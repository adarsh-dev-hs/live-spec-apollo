#!/usr/bin/env node
/**
 * One-off importer: ../requirement_doc/*.html  ->  ../docs/06-source-plan/*.md
 *
 * Run BY HAND when the client's delivery plan is revised:
 *     npm run import:prd
 *
 * This is the one script that writes into ../docs. `sync-docs.mjs` never does —
 * it only reads. The markdown this produces is then ordinary source-of-truth
 * documentation, checked in alongside everything else, and the original HTML is
 * copied to public/ so the interactive version stays available verbatim.
 */
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'node-html-parser'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const SRC_DIR = path.resolve(HERE, '../../requirement_doc')
const OUT_DIR = path.resolve(HERE, '../../docs/06-source-plan')
const PUBLIC_FILE = path.resolve(HERE, '../public/requirement-doc.html')

/** Section id -> output file and page title. Order is the plan's own tab order. */
const PAGES = {
  read:      { n: '01', title: 'How to read this plan', desc: 'The engineering index, scope discipline, effort bands, AI leverage, risk drivers and confidence levels the whole plan is written in.' },
  summary:   { n: '02', title: 'Summary', desc: 'Effort by milestone, and the seven open items blocking a committable estimate.' },
  timeline:  { n: '03', title: 'Timeline and estimate', desc: 'Six months, sixteen milestones, the delivery principles, the schedule and the basis of the estimate.' },
  register:  { n: '04', title: 'Scope register', desc: 'Every client deliverable, the milestone carrying it, and its specification state — plus coverage against the source document.' },
  clientdoc: { n: '05', title: "The client's own document", desc: "Apollo's text reproduced without alteration: the deliverable inventory, the module structure and the letter of 19 August 2026." },
  // `modules` is split into one page per milestone, numbered 06-07 … 06-22
  open:      { n: '23', title: 'Open items', desc: 'All 49 open decisions with owner, timing, what each blocks and its impact if unresolved.' },
  integ:     { n: '24', title: 'Integrations', desc: 'Every outside system the platform touches, its supplier status, risk, cost driver and open item.' },
  deps2:     { n: '25', title: 'Dependencies', desc: 'The 22 accounts, contracts, registrations and access rights Apollo must obtain, by month and by track.' },
}

const SKIP_TAGS = new Set(['script', 'style', 'select', 'option', 'button', 'input', 'label', 'colgroup', 'col'])
const SKIP_CLASSES = ['filters', 'tabs']

const ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—',
  hellip: '…', rsquo: '\u2019', lsquo: '\u2018', ldquo: '\u201c', rdquo: '\u201d',
  times: '×', middot: '·', bull: '•', deg: '°', euro: '€', pound: '£', rupee: '₹',
}
const decode = (s) =>
  s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&([a-zA-Z]+);/g, (m, n) => ENTITIES[n] ?? m)

const clean = (s) => decode(s).replace(/\s+/g, ' ').trim()
const esc = (s) => s.replace(/\|/g, '\\|')

const INLINE_TAGS = new Set(['b', 'strong', 'i', 'em', 'span', 'code', 'a', 'br', 'small', 'u', 'sup', 'sub'])

/** A wrapper whose children are all inline is one paragraph, not several blocks. */
function isInlineOnly(node) {
  const kids = node.childNodes.filter((n) => n.nodeType === 1 || (n.nodeType === 3 && n.rawText.trim()))
  if (!kids.length) return false
  return kids.every((n) => n.nodeType === 3 || INLINE_TAGS.has(n.rawTagName?.toLowerCase()))
}

function isSkipped(node) {
  if (SKIP_TAGS.has(node.rawTagName?.toLowerCase())) return true
  const cls = node.getAttribute?.('class') ?? ''
  return SKIP_CLASSES.some((c) => cls.split(/\s+/).includes(c))
}

/** Inline rendering: text plus <b>/<code>, chips joined readably. */
function inline(node) {
  if (node.nodeType === 3) return decode(node.rawText).replace(/\s+/g, ' ')
  if (isSkipped(node)) return ''
  const tag = node.rawTagName?.toLowerCase()
  const cls = node.getAttribute?.('class') ?? ''
  const kids = node.childNodes.map(inline).join('')
  const t = kids.trim()
  if (!t) return ''
  if (cls.includes('chip')) return ` \`${t}\``
  if (tag === 'b' || tag === 'strong') return `**${t}**`
  if (tag === 'i' || tag === 'em') return `*${t}*`
  if (tag === 'code') return `\`${t}\``
  if (tag === 'br') return ' '
  return kids
}

const inlineText = (node) => clean(inline(node)).replace(/\s+([.,;:])/g, '$1')

/* ------------------------------- tables ------------------------------- */

function renderTable(table) {
  const rows = []
  for (const tr of table.querySelectorAll('tr')) {
    const cells = tr.querySelectorAll('th,td')
    if (!cells.length) continue
    rows.push({
      head: cells[0].rawTagName.toLowerCase() === 'th',
      cells: cells.map((c) => {
        const cls = c.getAttribute('class') ?? ''
        // gantt month cell: a filled bar means the milestone runs that month
        if (cls.split(/\s+/).includes('mn')) return c.querySelector('.bar') ? '●' : ''
        return esc(inlineText(c))
      }),
    })
  }
  if (!rows.length) return ''

  const width = Math.max(...rows.map((r) => r.cells.length))
  const pad = (r) => [...r.cells, ...Array(width - r.cells.length).fill('')]

  let header = rows[0].head ? pad(rows.shift()) : Array(width).fill('')
  // the plan's tables often open with an empty first column; drop it everywhere
  const dropFirst = header[0] === '' && rows.every((r) => (pad(r)[0] ?? '') === '' || r.head)
  const cut = (a) => (dropFirst ? a.slice(1) : a)
  header = cut(header)
  if (header.every((h) => !h)) header = header.map((_, i) => (i === 0 ? 'Item' : `Column ${i + 1}`))

  const body = rows.map((r) => cut(pad(r)))
  const out = [
    `| ${header.join(' | ')} |`,
    `|${header.map(() => '---').join('|')}|`,
    ...body.map((c) => `| ${c.join(' | ')} |`),
  ]
  return out.join('\n')
}

/* -------------------------------- lists ------------------------------- */

function renderList(list, depth = 0) {
  const ordered = list.rawTagName.toLowerCase() === 'ol'
  const out = []
  let i = 1
  for (const li of list.childNodes.filter((n) => n.rawTagName?.toLowerCase() === 'li')) {
    const nested = li.childNodes.filter((n) => ['ul', 'ol'].includes(n.rawTagName?.toLowerCase()))
    const own = li.childNodes.filter((n) => !nested.includes(n)).map(inline).join('')
    const text = clean(own)
    const marker = ordered ? `${i++}.` : '-'
    if (text) out.push(`${'  '.repeat(depth)}${marker} ${text}`)
    for (const n of nested) out.push(renderList(n, depth + 1))
  }
  return out.join('\n')
}

/* ------------------------------- blocks ------------------------------- */

function blocks(node, out = [], depth = 0) {
  for (const child of node.childNodes) {
    if (child.nodeType === 3) {
      const t = clean(child.rawText)
      if (t) out.push(t)
      continue
    }
    if (child.nodeType !== 1 || isSkipped(child)) continue

    const tag = child.rawTagName.toLowerCase()
    const cls = child.getAttribute('class') ?? ''
    const has = (c) => cls.split(/\s+/).includes(c)

    if (tag === 'h2') { out.push(`# ${inlineText(child)}`); continue }
    if (tag === 'h3') { out.push(`## ${inlineText(child)}`); continue }
    if (tag === 'h4') { out.push(`${'#'.repeat(Math.min(6, 3 + depth * 2))} ${inlineText(child)}`); continue }
    if (tag === 'table') { const t = renderTable(child); if (t) out.push(t); continue }
    if (tag === 'ul' || tag === 'ol') { const l = renderList(child); if (l) out.push(l); continue }
    if (tag === 'p') { const t = inlineText(child); if (t) out.push(t); continue }

    // an open decision / buildable item
    if (tag === 'details') { out.push(...renderItem(child, depth)); continue }

    // callout
    if (has('note')) {
      const t = inlineText(child)
      if (t) out.push(`> ${t}`)
      continue
    }

    // the client's own words, reproduced verbatim
    if (has('srcbox')) {
      const inner = []
      blocks(child, inner)
      out.push(inner.map((b) => `> ${b.replace(/\n/g, '\n> ')}`).join('\n>\n'))
      continue
    }

    if (has('srchead') || has('srccite')) {
      const t = inlineText(child)
      if (t) out.push(`*${t}*`)
      continue
    }

    // a labelled list of short explanations
    if (has('legend')) {
      for (const item of child.childNodes.filter((n) => n.nodeType === 1)) {
        const b = item.querySelector('b')
        const title = b ? clean(b.text) : ''
        if (b) b.remove()
        const rest = inlineText(item)
        out.push(title ? `**${title}** — ${rest}` : rest)
      }
      continue
    }

    // headline number cards
    if (has('cards')) {
      const cards = child.querySelectorAll('.card').map((c) => {
        const n = inlineText(c.querySelector('.n') ?? c)
        const l = inlineText(c.querySelector('.l') ?? c)
        const d = c.querySelector('.d') ? inlineText(c.querySelector('.d')) : ''
        return `| ${esc(l)} | **${esc(n)}** | ${esc(d)} |`
      })
      if (cards.length) out.push(['| | | |', '|---|---|---|', ...cards].join('\n').replace('| | | |', '| Measure | Value | Detail |'))
      continue
    }

    // per-item effort footer
    if (has('effline')) {
      const parts = child.querySelectorAll('span').map((s) => clean(inlineText(s))).filter(Boolean)
      if (parts.length) out.push(parts.join(' · '))
      continue
    }

    if (tag === 'div' && isInlineOnly(child)) {
      const t = inlineText(child)
      if (t) out.push(t)
      continue
    }

    blocks(child, out, depth)
  }
  return out
}

function renderItem(details, depth = 0) {
  const sum = details.querySelector('summary')
  const body = details.querySelector('.body')
  const out = []
  if (sum) {
    const sid = sum.querySelector('.sid') ? inlineText(sum.querySelector('.sid')) : ''
    const snm = sum.querySelector('.snm') ? inlineText(sum.querySelector('.snm')) : ''
    const chips = sum.querySelectorAll('.chip').map((c) => clean(c.text)).filter(Boolean)
    const heading = [sid, snm].filter(Boolean).join(' — ')
    out.push(`${'#'.repeat(4 + depth)} ${heading || clean(sum.text)}`)
    if (chips.length) out.push(chips.map((c) => `\`${c}\``).join(' · '))
  }
  if (body) out.push(...blocks(body, [], depth + 1))
  return out
}

/* -------------------------------- main -------------------------------- */

const yaml = (v) => JSON.stringify(v ?? '')

function banner(srcFile, version) {
  return (
    `> **Client source document — reproduced, not rewritten.** This page is the Apollo delivery plan\n` +
    `> (\`${srcFile}\`, ${version}) converted to markdown so it is searchable alongside the engineering\n` +
    `> documentation. It is the *commercial* document; the engineering translation of it lives in\n` +
    `> sections 00–05. Where the two disagree, this one wins.\n` +
    `> [Open the original, with its tabs and styling →](/requirement-doc)\n\n`
  )
}

async function main() {
  const files = (await fs.readdir(SRC_DIR)).filter((f) => f.toLowerCase().endsWith('.html'))
  if (!files.length) throw new Error(`No .html found in ${SRC_DIR}`)
  const srcFile = files.sort().reverse()[0]
  const html = await fs.readFile(path.join(SRC_DIR, srcFile), 'utf8')
  const root = parse(html, { blockTextElements: { script: false, style: false } })

  const title = clean(root.querySelector('title')?.text ?? 'Delivery plan')
  const version = clean(root.querySelector('.metaline span')?.text ?? '')

  await fs.rm(OUT_DIR, { recursive: true, force: true })
  await fs.mkdir(OUT_DIR, { recursive: true })

  const written = []
  const B = banner(srcFile, version)

  const writePage = async (file, title, desc, body) => {
    const front = `---\ntitle: ${yaml(title)}\ndescription: ${yaml(desc)}\n---\n\n`
    const clean = body.join('\n\n').replace(/\n{3,}/g, '\n\n').replace(/^# .*\n+/, '')
    await fs.writeFile(path.join(OUT_DIR, file), front + `# ${title}\n\n` + B + clean + '\n', 'utf8')
    written.push({ file, chars: clean.length })
  }

  for (const [id, meta] of Object.entries(PAGES)) {
    const section = root.querySelector(`section#${id}`)
    if (!section) { console.warn(`  ! section #${id} not found, skipped`); continue }
    await writePage(`06-${meta.n}-${id}.md`, meta.title, meta.desc, blocks(section))
  }

  /* ---- milestone detail: one page per milestone ---- */
  const modules = root.querySelector('section#modules')
  const milestones = modules ? modules.querySelectorAll('.modblock') : []
  const index = []

  for (const [i, block] of milestones.entries()) {
    const head = block.querySelector('.modhead')
    const mid = head?.querySelector('.mid') ? clean(head.querySelector('.mid').text) : `Milestone ${i}`
    const name = head?.querySelector('.mname') ? clean(head.querySelector('.mname').text) : ''
    const mdesc = head?.querySelector('.mdesc') ? clean(head.querySelector('.mdesc').text) : ''
    const pills = head ? head.querySelectorAll('.chip').map((c) => clean(c.text)).filter(Boolean) : []
    const code = block.getAttribute('data-mod') ?? `M${i}`
    const slug = code.toLowerCase()
    const file = `06-${String(7 + i).padStart(2, '0')}-${slug}.md`

    const body = []
    body.push(`*${mid}*`)
    if (pills.length) body.push(pills.map((p) => `\`${p}\``).join(' · '))
    if (mdesc) body.push(mdesc)
    const mbody = block.querySelector('.modbody')
    if (mbody) body.push(...blocks(mbody))

    const title = name ? `${code} — ${name}` : code
    const desc = mdesc.length > 190 ? mdesc.slice(0, 187).replace(/\s+\S*$/, '') + '…' : mdesc
    await writePage(file, title, desc, body)
    index.push({ code, name, mid, pills, file, desc })
  }

  if (index.length) {
    const lede = modules.querySelector('p.lede')
    const rows = index.map((m) =>
      `| [${m.code}](/docs/06-source-plan/${m.file.replace(/\.md$/, '')}) | ${esc(m.name)} | ${esc(m.mid.replace(/^[^·]*·\s*/, ''))} | ${esc(m.pills.join(' · '))} |`)
    await writePage(
      '06-06-milestone-detail.md',
      'Milestone detail',
      'All sixteen milestones and every one of the 208 buildable items, with the elements on each screen and the conditions it must satisfy.',
      [
        lede ? clean(lede.text) : '',
        'Each milestone has its own page below.',
        ['| Milestone | Name | Deliverables · months | Scale |', '|---|---|---|---|', ...rows].join('\n'),
      ].filter(Boolean),
    )
  }

  // keep the original browsable, verbatim, at /requirement-doc.html
  await fs.mkdir(path.dirname(PUBLIC_FILE), { recursive: true })
  await fs.copyFile(path.join(SRC_DIR, srcFile), PUBLIC_FILE)

  console.log(`import-requirement-doc: ${written.length} pages from ${srcFile}`)
  written.forEach((w) => console.log(`  ${w.file}  ${(w.chars / 1024).toFixed(1)} kB`))
  console.log(`  original copied to public/requirement-doc.html`)
}

main().catch((e) => { console.error('import-requirement-doc failed:', e); process.exit(1) })
