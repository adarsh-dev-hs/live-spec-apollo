/**
 * Sync `../docs/**\/*.md` into `content/docs` for Fumadocs.
 *
 * The markdown under /docs is the single source of truth and is never modified.
 * This script produces a Fumadocs-ready mirror: frontmatter (title/description),
 * meta.json navigation, resolved cross-links and MDX-safe escaping.
 *
 * Run: node scripts/sync-docs.mjs   (wired to predev / prebuild)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const SRC = path.resolve(ROOT, '..', 'docs');
const OUT = path.join(ROOT, 'content', 'docs');

/** Sidebar section metadata, in navigation order. */
const SECTIONS = [
  {
    dir: '00-foundation',
    title: 'Foundation',
    icon: 'Compass',
    description: 'What the business does and how the system is shaped. Read once, first.',
  },
  {
    dir: '01-standards',
    title: 'Standards',
    icon: 'Ruler',
    description: 'House rules. Every component spec assumes these.',
  },
  {
    dir: '02-platform',
    title: 'Platform',
    icon: 'Layers',
    description: 'Shared components. Built once, depended on by two or more modules.',
  },
  {
    dir: '03-modules',
    title: 'Modules',
    icon: 'Boxes',
    description: 'The business modules, one spec per implementable unit.',
  },
  {
    dir: '04-integrations',
    title: 'Integrations',
    icon: 'Cable',
    description: 'Every external system the platform touches.',
  },
  {
    dir: '05-delivery',
    title: 'Delivery',
    icon: 'Rocket',
    description: 'Build order, playbook and the open decisions still blocking work.',
  },
];

// ---------------------------------------------------------------- utilities

/** Split a document into alternating prose / fenced-code segments. */
function splitFences(text) {
  const segments = [];
  const lines = text.split('\n');
  let buffer = [];
  let fence = null;

  const flush = (code) => {
    segments.push({ code, text: buffer.join('\n') });
    buffer = [];
  };

  for (const line of lines) {
    const marker = line.match(/^\s*(`{3,}|~{3,})/);
    if (!fence && marker) {
      flush(false);
      fence = marker[1][0].repeat(3);
      buffer.push(line);
    } else if (fence && marker && marker[1].startsWith(fence)) {
      buffer.push(line);
      flush(true);
      fence = null;
    } else {
      buffer.push(line);
    }
  }
  flush(Boolean(fence));
  return segments;
}

/** Apply `fn` to prose only, leaving fenced code and inline code untouched. */
function mapProse(text, fn) {
  return splitFences(text)
    .map((segment) => {
      if (segment.code) return segment.text;
      // Preserve inline `code` spans within prose.
      return segment.text
        .split(/(`+[^`]*?`+)/g)
        .map((part, i) => (i % 2 === 1 ? part : fn(part)))
        .join('');
    })
    .join('\n');
}

/**
 * In GFM tables a `|` splits the cell even inside an inline code span, which
 * leaves the span unterminated and exposes its `<...>` to the MDX parser.
 * Escaping the pipe keeps the cell (and the code span) intact.
 */
function escapeTablePipes(text) {
  return splitFences(text)
    .map((segment) => {
      if (segment.code) return segment.text;
      return segment.text
        .split('\n')
        .map((line) => {
          if (!/^\s*\|/.test(line)) return line;
          return line
            .split(/(`+[^`]*?`+)/g)
            .map((part, i) => (i % 2 === 1 ? part.replace(/(?<!\\)\|/g, '\\|') : part))
            .join('');
        })
        .join('\n');
    })
    .join('\n');
}

/**
 * The docs use `<n>`, `<Requisition>`, `<void>` etc. as placeholder notation.
 * Un-escaped these are parsed as HTML/JSX and silently disappear.
 */
function escapeMdx(text) {
  return mapProse(text, (part) =>
    part
      .replace(/<(?!https?:\/\/|mailto:)/g, '&lt;')
      .replace(/\{/g, '&#123;')
      .replace(/\}/g, '&#125;'),
  );
}

/** Map a docs-relative markdown path to its site URL. */
function toUrl(relPath) {
  let rel = relPath.replace(/\\/g, '/').replace(/\.md$/i, '').replace(/\/$/, '');
  if (rel === 'README' || rel === '.' || rel === '') return '/docs';
  rel = rel.replace(/\/README$/i, '');
  return `/docs/${rel}`;
}

/** Rewrite relative links between source docs into site routes. */
function rewriteLinks(text, fileRel) {
  const dir = path.dirname(fileRel);
  return mapProse(text, (part) =>
    part.replace(/\]\(([^)]+)\)/g, (match, target) => {
      const raw = target.trim();
      if (/^(https?:|mailto:|#|\/)/i.test(raw)) return match;
      const [linkPath, hash] = raw.split('#');
      if (!linkPath) return match;
      if (!/\.md$/i.test(linkPath) && !linkPath.endsWith('/')) return match;
      const resolved = path.posix.normalize(path.posix.join(dir, linkPath));
      return `](${toUrl(resolved)}${hash ? `#${hash}` : ''})`;
    }),
  );
}

/** Strip markdown decoration down to plain text, for the description field. */
function plainText(line) {
  return line
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\*\*([^*]*)\*\*/g, '$1')
    .replace(/[*>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Prefer the "Purpose" section's opening paragraph; else the first real prose. */
function extractDescription(body) {
  const lines = body.split('\n');
  const candidates = [];

  const purposeAt = lines.findIndex((l) => /^#{2,3}\s+(\d+\.\s*)?Purpose\b/i.test(l));
  if (purposeAt !== -1) candidates.push(lines.slice(purposeAt + 1));
  candidates.push(lines);

  for (const scope of candidates) {
    const paragraph = [];
    let fence = false;
    for (const line of scope) {
      if (/^\s*(`{3,}|~{3,})/.test(line)) {
        fence = !fence;
        continue;
      }
      if (fence) continue;
      const trimmed = line.trim();
      if (!trimmed) {
        if (paragraph.length) break;
        continue;
      }
      // Skip separators, headings, tables, quotes, lists and bold metadata rows.
      if (/^(-{3,}|={3,})$/.test(trimmed)) continue;
      if (/^#/.test(trimmed)) {
        if (paragraph.length) break;
        continue;
      }
      if (/^[|>]/.test(trimmed) || /^[-*+]\s/.test(trimmed) || /^\d+\.\s/.test(trimmed)) {
        if (paragraph.length) break;
        continue;
      }
      if (/^\*\*[^*]+\*\*\s/.test(trimmed) && trimmed.includes('·')) continue;
      paragraph.push(trimmed);
    }
    const text = plainText(paragraph.join(' '));
    if (text.length > 25) {
      if (text.length <= 180) return text;
      const cut = text.slice(0, 180);
      const stop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf(' '));
      return `${cut.slice(0, stop > 80 ? stop : 180).replace(/[,;:.\s]+$/, '')}…`;
    }
  }
  return null;
}

function yamlString(value) {
  return `"${String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

/** A landing page listing every document in a section. */
function sectionIndex(section, entries) {
  const cards = entries
    .map((entry) => {
      const body = entry.description ? `\n  ${escapeMdx(entry.description)}\n` : '';
      return `  <Card title=${yamlString(entry.title)} href="/docs/${section.dir}/${entry.slug}">${body}  </Card>`;
    })
    .join('\n');

  return [
    '---',
    `title: ${yamlString(section.title)}`,
    section.description ? `description: ${yamlString(section.description)}` : null,
    '---',
    '',
    `This section contains ${entries.length} document${entries.length === 1 ? '' : 's'}.`,
    '',
    '<Cards>',
    cards,
    '</Cards>',
    '',
  ]
    .filter((line) => line !== null)
    .join('\n');
}

// ------------------------------------------------------------------ convert

function convert(absPath, fileRel) {
  const source = fs.readFileSync(absPath, 'utf8');
  const lines = source.split('\n');

  const headingAt = lines.findIndex((l) => /^#\s+\S/.test(l));
  const title =
    headingAt === -1
      ? path.basename(fileRel, '.md')
      : plainText(lines[headingAt].replace(/^#\s+/, ''));

  const body = (headingAt === -1 ? lines : lines.slice(headingAt + 1)).join('\n').replace(/^\s+/, '');
  const description = extractDescription(body);

  const frontmatter = [
    '---',
    `title: ${yamlString(title)}`,
    description ? `description: ${yamlString(description)}` : null,
    '---',
    '',
  ]
    .filter((l) => l !== null)
    .join('\n');

  const processed = escapeMdx(escapeTablePipes(rewriteLinks(body, fileRel)));

  return { title, description, content: `${frontmatter}\n${processed}\n` };
}

// --------------------------------------------------------------------- main

function main() {
  // The source markdown lives outside this repo, so it is absent in CI and on
  // fresh clones. `content/docs` is committed, so keep the existing mirror and
  // let the build proceed instead of failing.
  if (!fs.existsSync(SRC)) {
    console.warn(`[sync-docs] source folder not found: ${SRC} — keeping existing content/docs`);
    if (!fs.existsSync(OUT)) {
      console.error('[sync-docs] no content/docs mirror to fall back on');
      process.exit(1);
    }
    return;
  }

  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  let count = 0;

  // Root README becomes the docs landing page.
  const readme = path.join(SRC, 'README.md');
  if (fs.existsSync(readme)) {
    const { content } = convert(readme, 'README.md');
    fs.writeFileSync(path.join(OUT, 'index.mdx'), content);
    count++;
  }

  const known = new Set(SECTIONS.map((s) => s.dir));
  const extra = fs
    .readdirSync(SRC, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !known.has(e.name))
    .map((e) => ({ dir: e.name, title: e.name, icon: null, description: null }));

  for (const section of [...SECTIONS, ...extra]) {
    const srcDir = path.join(SRC, section.dir);
    if (!fs.existsSync(srcDir)) {
      console.warn(`[sync-docs] skipping missing section: ${section.dir}`);
      continue;
    }
    const outDir = path.join(OUT, section.dir);
    fs.mkdirSync(outDir, { recursive: true });

    const files = fs
      .readdirSync(srcDir)
      .filter((f) => f.toLowerCase().endsWith('.md'))
      .sort();

    const entries = [];
    for (const file of files) {
      const fileRel = path.posix.join(section.dir, file);
      const { title, description, content } = convert(path.join(srcDir, file), fileRel);
      const slug = file.replace(/\.md$/i, '');
      fs.writeFileSync(path.join(outDir, `${slug}.mdx`), content);
      entries.push({ slug, title, description });
      count++;
    }

    // A landing page per section, so folder links resolve and the section is browsable.
    fs.writeFileSync(path.join(outDir, 'index.mdx'), sectionIndex(section, entries));
    count++;

    const meta = { title: section.title, pages: ['index', ...entries.map((e) => e.slug)] };
    if (section.icon) meta.icon = section.icon;
    if (section.description) meta.description = section.description;
    fs.writeFileSync(path.join(outDir, 'meta.json'), `${JSON.stringify(meta, null, 2)}\n`);
  }

  const rootMeta = {
    title: 'Documentation',
    root: true,
    pages: ['index', ...SECTIONS.map((s) => s.dir), ...extra.map((s) => s.dir)],
  };
  fs.writeFileSync(path.join(OUT, 'meta.json'), `${JSON.stringify(rootMeta, null, 2)}\n`);

  console.log(`[sync-docs] wrote ${count} pages from ${path.relative(ROOT, SRC)} to content/docs`);
}

main();
