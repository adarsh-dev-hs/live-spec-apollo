#!/usr/bin/env node
/**
 * Mirror ../docs/**\/*.md into content/docs/**\/*.mdx.
 *
 * ../docs is the single source of truth and is NEVER modified by this script.
 * content/docs is generated, git-ignored, and wiped on every run.
 *
 * What it does, and why each step is needed, is documented in README.md.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SOURCE = path.resolve(HERE, '../../docs');
const TARGET = path.resolve(HERE, '../content/docs');
const DOCS_ROUTE = '/docs';
const DESC_MAX = 180;

/**
 * Sidebar configuration. A folder listed here gets this title, icon and position.
 * A folder in ../docs that is NOT listed here still syncs — it is appended at the
 * end under a title derived from its own name. Adding docs must never require
 * editing the site.
 */
const SECTIONS = [
  { dir: '00-foundation',   title: '00 Foundation',   icon: 'Compass' },
  { dir: '01-standards',    title: '01 Standards',    icon: 'Ruler' },
  { dir: '02-platform',     title: '02 Platform',     icon: 'Layers' },
  { dir: '03-modules',      title: '03 Modules',      icon: 'Boxes' },
  { dir: '04-integrations', title: '04 Integrations', icon: 'PlugZap' },
  { dir: '05-delivery',     title: '05 Delivery',     icon: 'Rocket' },
  { dir: '06-source-plan',  title: '06 Source plan',  icon: 'FileText' },
];

/* ------------------------------------------------------------------ *
 * 1. Fence splitting — the basis of every text transformation below.
 *    Nothing inside a fenced code block is ever touched.
 * ------------------------------------------------------------------ */

/** Split into [{ fence: boolean, lines: string[] }] preserving order. */
function splitFences(content) {
  const out = [];
  let current = { fence: false, lines: [] };
  let fenceMarker = null;

  for (const line of content.split('\n')) {
    const open = line.match(/^\s*(`{3,}|~{3,})/);
    if (!fenceMarker && open) {
      if (current.lines.length) out.push(current);
      fenceMarker = open[1][0].repeat(3);
      current = { fence: true, lines: [line] };
      continue;
    }
    if (fenceMarker && open && open[1].startsWith(fenceMarker)) {
      current.lines.push(line);
      out.push(current);
      current = { fence: false, lines: [] };
      fenceMarker = null;
      continue;
    }
    current.lines.push(line);
  }
  if (current.lines.length) out.push(current);
  return out;
}

/**
 * Map a function over prose only. `fn(text)` is called for the runs of text
 * between inline code spans; `spanFn(span, line)` for the spans themselves.
 * Fenced blocks are passed through verbatim.
 */
function mapProse(content, fn, spanFn = (s) => s) {
  return splitFences(content)
    .map((seg) => {
      if (seg.fence) return seg.lines.join('\n');
      return seg.lines
        .map((line) => {
          let out = '';
          let last = 0;
          const re = /(`+)(.*?)\1/g;
          let m;
          while ((m = re.exec(line)) !== null) {
            out += fn(line.slice(last, m.index));
            out += spanFn(m[0], line);
            last = m.index + m[0].length;
          }
          out += fn(line.slice(last));
          return out;
        })
        .join('\n');
    })
    .join('\n');
}

/* ------------------------------------------------------------------ *
 * 2. MDX escaping — this is where it breaks.
 *    The docs use <n>, <entity> and {...} as notation. Unescaped, MDX
 *    parses them as JSX/expressions and they silently vanish.
 * ------------------------------------------------------------------ */

// The one place the docs use real HTML rather than notation: collapsible task lists inside table
// cells. Blanket `<` escaping would turn them into visible text, so these exact tags survive.
const HTML_PASSTHROUGH = /<\/?(?:details|summary|ul|li)>/g;

function escapeMdx(content) {
  return mapProse(
    content,
    (prose) => {
      const kept = [];
      return prose
        .replace(HTML_PASSTHROUGH, (t) => `\u0000${kept.push(t) - 1}\u0000`)
        .replace(/</g, '&lt;')
        .replace(/\{/g, '&#123;')
        .replace(/\}/g, '&#125;')
        .replace(/\u0000(\d+)\u0000/g, (_, i) => kept[Number(i)]);
    },
    // In a GFM table, a `|` inside an inline code span splits the cell and leaves
    // the span unterminated. Escape unescaped pipes inside spans on table rows.
    (span, line) => (isTableRow(line) ? span.replace(/(?<!\\)\|/g, '\\|') : span),
  );
}

function isTableRow(line) {
  const t = line.trim();
  return t.startsWith('|') && t.length > 1;
}

/* ------------------------------------------------------------------ *
 * 3. Cross-link rewriting
 *    ](03-modules/03-01-clients.md#anchor) -> ](/docs/03-modules/03-01-clients#anchor)
 *    Resolved relative to the containing file. README.md maps to /docs.
 * ------------------------------------------------------------------ */

function rewriteLinks(content, relFromDocsRoot) {
  const dir = path.dirname(relFromDocsRoot);
  return mapProse(content, (prose) =>
    prose.replace(/\]\(([^)\s]+?)(#[^)\s]*)?\)/g, (whole, target, hash = '') => {
      if (/^(?:[a-z]+:|\/\/|\/|#)/i.test(target)) return whole; // absolute, protocol, bare hash
      if (!target.toLowerCase().endsWith('.md')) return whole;
      const resolved = path.posix.normalize(path.posix.join(dir === '.' ? '' : dir, target));
      const route = toRoute(resolved);
      return `](${route}${hash})`;
    }),
  );
}

/** docs-relative markdown path -> site route */
function toRoute(relPath) {
  const noExt = relPath.replace(/\.md$/i, '');
  if (noExt.toLowerCase() === 'readme') return DOCS_ROUTE;
  const parts = noExt.split('/');
  if (parts[parts.length - 1].toLowerCase() === 'readme') parts.pop();
  return `${DOCS_ROUTE}/${parts.join('/')}`;
}

/* ------------------------------------------------------------------ *
 * 4. Frontmatter derivation
 * ------------------------------------------------------------------ */

/**
 * A source file may already carry frontmatter — `06-source-plan/` is machine-generated and states its
 * own title and description. Take it as authoritative and strip it from the body, rather than
 * deriving a second block and emitting both.
 */
function splitFrontmatter(raw) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw);
  if (!m) return { meta: null, rest: raw };
  const read = (key) => {
    const line = new RegExp(`^${key}:\\s*(.+)$`, 'm').exec(m[1]);
    if (!line) return null;
    const v = line[1].trim();
    try {
      return v.startsWith('"') ? JSON.parse(v) : v.replace(/^'(.*)'$/, '$1');
    } catch {
      return v;
    }
  };
  return { meta: { title: read('title'), description: read('description') }, rest: raw.slice(m[0].length) };
}

function extractTitle(content) {
  const m = content.match(/^#\s+(.+?)\s*$/m);
  return m ? stripInline(m[1]) : null;
}

function stripH1(content) {
  return content.replace(/^#\s+.+?\s*$\n?/m, '').replace(/^\n+/, '');
}

/** Remove markdown emphasis, code ticks and links so a description reads as plain prose. */
function stripInline(s) {
  return s
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\*\*([^*]*)\*\*/g, '$1')
    .replace(/\*([^*]*)\*/g, '$1')
    .replace(/_([^_]*)_/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

const SKIP_LINE = (l) => {
  const t = l.trim();
  if (!t) return true;
  if (t.startsWith('#')) return true;                       // headings
  if (/^([-*_]\s*){3,}$/.test(t)) return true;              // thematic rules
  if (t.startsWith('|')) return true;                       // tables
  if (/^[-*+]\s/.test(t) || /^\d+[.)]\s/.test(t)) return true; // lists
  if (t.startsWith('>')) return true;                       // quotes
  if (/^\*\*[A-Za-z ]+\*\*\s*[`·]/.test(t)) return true;    // the bold metadata row
  if (/^\*\*(Package|Schema|Plan|Effort|Risk|Build in)\*\*/.test(t)) return true;
  if (/^</.test(t)) return true;                            // raw html/jsx
  return false;
};

function extractDescription(content) {
  const segs = splitFences(content).filter((s) => !s.fence);
  const lines = segs.flatMap((s) => s.lines);

  // Prefer the opening paragraph of the `## Purpose` section (`## 1. Purpose` too).
  const purposeIdx = lines.findIndex((l) => /^#{2,3}\s+(?:\d+\.\s*)?Purpose\s*$/i.test(l.trim()));
  const pools = purposeIdx >= 0 ? [lines.slice(purposeIdx + 1), lines] : [lines];

  for (const pool of pools) {
    const para = firstParagraph(pool);
    if (para) return truncate(stripInline(para));
  }
  return null;
}

function firstParagraph(lines) {
  const buf = [];
  for (const line of lines) {
    if (buf.length === 0) {
      if (SKIP_LINE(line)) continue;
      buf.push(line.trim());
    } else {
      if (!line.trim() || SKIP_LINE(line)) break;
      buf.push(line.trim());
    }
  }
  return buf.length ? buf.join(' ') : null;
}

/** Truncate to ~DESC_MAX chars on a sentence boundary, else a word boundary. */
function truncate(text) {
  if (text.length <= DESC_MAX) return text;
  const window = text.slice(0, DESC_MAX + 1);
  const sentence = window.search(/[.!?](?:\s|$)(?![^.]*\d)/) >= 0 ? lastSentenceEnd(window) : -1;
  if (sentence > DESC_MAX * 0.5) return text.slice(0, sentence + 1).trim();
  const word = window.lastIndexOf(' ');
  return `${text.slice(0, word > 0 ? word : DESC_MAX).trim()}…`;
}

function lastSentenceEnd(window) {
  let idx = -1;
  const re = /[.!?](\s|$)/g;
  let m;
  while ((m = re.exec(window)) !== null) idx = m.index;
  return idx;
}

const yaml = (v) => JSON.stringify(v ?? '');

/* ------------------------------------------------------------------ *
 * 5. Walk, transform, write
 * ------------------------------------------------------------------ */

async function listMarkdown(dir, base = '') {
  const entries = await fs.readdir(path.join(dir, base), { withFileTypes: true });
  const files = [];
  for (const e of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const rel = base ? `${base}/${e.name}` : e.name;
    if (e.isDirectory()) files.push(...(await listMarkdown(dir, rel)));
    else if (e.isFile() && e.name.toLowerCase().endsWith('.md')) files.push(rel);
  }
  return files;
}

function sectionFor(dir) {
  return (
    SECTIONS.find((s) => s.dir === dir) ?? {
      dir,
      title: dir
        .replace(/^\d+[-_]/, '')
        .split(/[-_]/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' '),
      icon: 'Folder',
      extra: true,
    }
  );
}

/** Does this path exist? Used to detect a missing ../docs before anything is wiped. */
async function exists(target) {
  try {
    await fs.stat(target);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  /* ../docs sits outside this repo, so it is absent from a fresh clone and from
     CI. The committed content/docs mirror is what the site builds from there, so
     bail out BEFORE the wipe rather than destroying the only copy. */
  if (!(await exists(SOURCE))) {
    if (!(await exists(TARGET))) {
      console.error(`sync-docs: no source at ${SOURCE} and no content/docs mirror to build from`);
      process.exit(1);
    }
    console.warn(`sync-docs: no source at ${SOURCE} — building from the committed content/docs mirror`);
    return;
  }

  await fs.rm(TARGET, { recursive: true, force: true });
  await fs.mkdir(TARGET, { recursive: true });

  const files = await listMarkdown(SOURCE);
  if (!files.length) throw new Error(`No markdown found in ${SOURCE}`);

  const byDir = new Map(); // dir -> [{ slug, title, description }]
  let pageCount = 0;

  for (const rel of files) {
    const source = await fs.readFile(path.join(SOURCE, rel), 'utf8');
    const { meta, rest: raw } = splitFrontmatter(source);
    // The filename carries the document's index (`05-01`). Put it back on the title so the sidebar,
    // breadcrumb and search results are as findable as the file tree is.
    const index = /^(\d{2}-\d{2})-/.exec(path.basename(rel))?.[1] ?? null;
    const bare = meta?.title ?? extractTitle(raw) ?? path.basename(rel, '.md');
    const title = index ? `${index} ${bare}` : bare;
    const description = meta?.description ?? extractDescription(raw);

    let body = stripH1(raw);
    body = rewriteLinks(body, rel);
    body = escapeMdx(body);

    const isRootReadme = rel.toLowerCase() === 'readme.md';
    const outRel = isRootReadme ? 'index.mdx' : rel.replace(/\.md$/i, '.mdx');
    const outPath = path.join(TARGET, outRel);
    await fs.mkdir(path.dirname(outPath), { recursive: true });

    const frontmatter =
      `---\ntitle: ${yaml(title)}\n` +
      (description ? `description: ${yaml(description)}\n` : '') +
      `---\n\n`;
    await fs.writeFile(outPath, frontmatter + body.trimEnd() + '\n', 'utf8');
    pageCount++;

    const dir = path.dirname(outRel);
    if (dir !== '.') {
      if (!byDir.has(dir)) byDir.set(dir, []);
      byDir.get(dir).push({ slug: path.basename(outRel, '.mdx'), title, description });
    }
  }

  /* Section landing pages — a Cards grid, so folder links resolve and
     sections are browsable rather than dead ends. */
  for (const [dir, pages] of byDir) {
    const section = sectionFor(dir);
    const cards = pages
      .map(
        (p) =>
          `  <Card title=${yaml(p.title)} href=${yaml(`${DOCS_ROUTE}/${dir}/${p.slug}`)}>\n` +
          `    ${escapeMdx(p.description ?? '')}\n  </Card>`,
      )
      .join('\n');

    const content =
      `---\ntitle: ${yaml(section.title)}\n` +
      `description: ${yaml(`${pages.length} document${pages.length === 1 ? '' : 's'} in ${section.title}.`)}\n` +
      `---\n\n<Cards>\n${cards}\n</Cards>\n`;
    await fs.writeFile(path.join(TARGET, dir, 'index.mdx'), content, 'utf8');
    pageCount++;

    await fs.writeFile(
      path.join(TARGET, dir, 'meta.json'),
      JSON.stringify(
        {
          title: section.title,
          icon: section.icon,
          pages: ['index', ...pages.map((p) => p.slug)],
        },
        null,
        2,
      ) + '\n',
      'utf8',
    );
  }

  /* Root meta: configured sections in order, then anything else, appended. */
  const known = SECTIONS.map((s) => s.dir).filter((d) => byDir.has(d));
  const extra = [...byDir.keys()].filter((d) => !known.includes(d)).sort();
  await fs.writeFile(
    path.join(TARGET, 'meta.json'),
    JSON.stringify({ root: true, title: 'Documentation', pages: ['index', ...known, ...extra] }, null, 2) + '\n',
    'utf8',
  );

  console.log(
    `sync-docs: ${pageCount} pages from ${files.length} source files ` +
      `across ${byDir.size} sections${extra.length ? ` (${extra.length} unconfigured: ${extra.join(', ')})` : ''}`,
  );
}

main().catch((err) => {
  console.error('sync-docs failed:', err);
  process.exit(1);
});
