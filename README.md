# Apollo Knowledge GWD — documentation site

A [Fumadocs](https://fumadocs.dev) site that renders `../docs`.

```bash
npm install
npm run dev     # syncs, then serves on http://localhost:3000
```

## `../docs` is the source of truth

**`../docs/**/*.md` is the single source of truth and is never modified by this site.**

`content/docs/**/*.mdx` is **generated** by `scripts/sync-docs.mjs` and **wiped and regenerated on
every run whenever `../docs` is present**. Never edit anything in `content/docs` — the next sync
deletes it. It is committed all the same, because the deployed site builds without `../docs`
alongside it; see [Generated files](#generated-files).

To change the documentation, edit the markdown in `../docs`.

## Scripts

| Script | Does |
|---|---|
| `npm run import:prd` | **Writes into `../docs`.** Converts the client's requirement HTML into `../docs/06-source-plan/`. Manual, never a lifecycle hook — see below |
| `npm run sync` | Mirror `../docs` into `content/docs`. Idempotent — wipes and regenerates. |
| `npm run dev` | `predev` syncs, then Next.js dev server |
| `npm run build` | `prebuild` syncs, then a production build |
| `npm start` | Serve the production build |
| `npm run types:check` | `next typegen && tsc --noEmit` |
| `npm run lint` | ESLint |

`predev` and `prebuild` are npm lifecycle hooks, so the site can never be built against stale content.
`import:prd` is deliberately **not** one — it is the single script that writes into `../docs`, and it
runs only when someone asks for it.

## The original requirement document

The client's plan lives at `../requirement_doc/Apollo_Delivery_Plan_6Month_v0.4.html`. It reaches the
site two ways, both produced by `npm run import:prd`:

| Where | What it is |
|---|---|
| `/docs/06-source-plan/…` | 25 markdown pages in `../docs/06-source-plan/`, converted from the HTML — searchable, cross-linkable, and rendered like any other section |
| `/requirement-doc` | The HTML itself, copied verbatim to `public/requirement-doc.html` and framed by `app/requirement-doc/page.tsx`, so its tabs, filters and styling still work |

The converter (`scripts/import-requirement-doc.mjs`) reproduces, it does not rewrite: `<details class="item">`
blocks become nested headings, gantt cells become `●`, `.srcbox` quotes stay quotes, `.legend` entries
stay definitions, and HTML entities are decoded. The `Milestone detail` tab is split into one page per
milestone (`06-07-m0` … `06-22-m15`) because a single page of sixteen milestones is unreadable in a
sidebar. Every generated page carries a banner saying it is a reproduction and linking to the original.

**`../docs/06-source-plan/` is generated — do not hand-edit it.** Re-run `npm run import:prd` when the
client issues a new version of the plan, and bump `srcFile` in the script if the filename changes.

## What the sync does, and why each step is needed

| # | Step | Why |
|---|---|---|
| 0 | **Pass through frontmatter the source already has**, and skip steps 1–3 for that file | `06-source-plan/` is machine-generated and states its own title and description. Deriving a second block would emit two, and the page would render its own frontmatter as body text |
| 1 | **Derive `title`** from the first `#` heading, then strip that heading from the body | Fumadocs renders the title from frontmatter; leaving the H1 in the body would render it twice |
| 2 | **Derive `description`** from the opening paragraph of the `## Purpose` section (`## 1. Purpose` matches too), falling back to the first real prose paragraph | Every spec opens with a bold metadata row and many open with tables. Without skipping headings, rules, tables, lists, quotes and metadata rows, the description would be `**Package** \`@apollo/…\`` |
| 3 | **Truncate** the description to ~180 chars on a sentence boundary, else a word boundary | Sidebar cards, search results, OG images and `llms.txt` all use it |
| 4 | **Write `meta.json` per folder** — sidebar title, Lucide icon and explicit page order — from the `SECTIONS` array at the top of the script | Without it the sidebar sorts alphabetically and shows raw folder names. A folder in `../docs` that is **not** in `SECTIONS` still syncs, appended at the end under a title derived from its own name — **adding docs must never require editing the site** |
| 5 | **Write a root `meta.json`** with `root: true` | Makes `/docs` the tree root rather than a nested folder |
| 6 | **Rewrite cross-links**: `](03-modules/03-01-clients.md#anchor)` → `](/docs/03-modules/03-01-clients#anchor)`, resolved relative to the containing file | The docs use relative markdown links so they work in an editor and on GitHub; the site needs routes. Absolute, `http(s):`, `mailto:` and bare `#` links are left alone. `README.md` maps to `/docs` |
| 7 | **Escape for MDX** — `<` → `&lt;`, `{` → `&#123;`, `}` → `&#125;`, **in prose only** | **This is where it breaks.** The docs use `<n>`, `<entity>` and `{…}` as notation. Unescaped, MDX parses them as JSX and expressions, and they *silently vanish* from the rendered page rather than failing the build |
| 7b | **`<details>`, `<summary>`, `<ul>` and `<li>` pass through step 7 unescaped** | [05-01](../docs/05-delivery/05-01-build-sequence.md) puts collapsible task lists inside table cells. They are the one place the docs use real HTML rather than notation, so they are allow-listed by name — everything else still escapes |
| 8 | Escaping **never touches fenced code blocks or inline code spans** — it is a fence-splitter plus a prose-mapper, not a blanket regex | A blanket regex would corrupt every SQL snippet, TypeScript interface and ASCII diagram in the docs |
| 9 | **Escape unescaped `\|` inside inline code spans on table rows** | In a GFM table a `\|` inside a code span splits the cell and leaves the span unterminated — a separate failure from step 7 |
| 10 | **Generate a section landing page** (`index.mdx`) per folder — a `<Cards>` grid of that section's documents with their descriptions | Folder links would otherwise 404, and sections would be dead ends rather than browsable. `../docs/README.md` becomes the docs landing page at `/docs` |
| 11 | **Wipe `content/docs` and regenerate on every run**, then log the page count | Idempotent. A renamed or deleted source file leaves no orphan page |

## Adding a new section

1. Create the folder in `../docs` with your `.md` files.
2. Run `npm run sync`. **It already works** — the section appears at the end of the sidebar with a
   title derived from the folder name.
3. To give it a position, a title and an icon, add one line to `SECTIONS` at the top of
   `scripts/sync-docs.mjs`:

```js
{ dir: '07-operations', title: 'Operations', icon: 'Wrench' },
```

`icon` is any [Lucide](https://lucide.dev) icon name, resolved by Fumadocs' `lucideIconsPlugin`.

## Site features

- **Search** (⌘K) — Orama, built from the synced content at `/api/search`
- **Table of contents, breadcrumbs, prev/next** — Fumadocs defaults
- **Light and dark themes**
- **`/llms.txt`** and **`/llms-full.txt`** for LLM consumption
- **Copy as markdown** on every page, plus a **view options** popover
- **Markdown content negotiation** — `proxy.ts` rewrites so that both
  `GET /docs/<path>.md` and `GET /docs/<path>` with `Accept: text/markdown` return raw markdown for
  the same URL
- **OG images** generated per page at `/og/docs/<path>/image.png`
- **A home page at `/`** stating what the docs are, the reading order, and links into each section
- **`/requirement-doc`** — the client's original plan, framed and reachable from the top nav

## Configuration

| File | Holds |
|---|---|
| `lib/shared.ts` | `appName`, `appDescription`, and the docs route constants |
| `lib/layout.shared.tsx` | Nav configuration shared by the home and docs layouts |
| `app/layout.tsx` | Root metadata: title template `%s · Apollo Knowledge GWD`, `metadataBase` from `NEXT_PUBLIC_SITE_URL ?? http://localhost:3000` |
| `lib/source.ts` | The Fumadocs source loader |
| `scripts/sync-docs.mjs` | `SECTIONS`, and everything in the table above |
| `scripts/import-requirement-doc.mjs` | `srcFile`, the tab→page mapping, and the HTML→markdown rules |

Set `NEXT_PUBLIC_SITE_URL` when deploying so OG images and canonical URLs resolve absolutely.

## Generated files

`.source` is generated by Fumadocs on every build and is git-ignored.

`content/docs` is generated too, but **is** committed. `../docs` lives outside this repo, so a fresh
clone — Vercel's included — has no source to sync from. The committed mirror is what those builds
render, and `sync-docs` detects the missing source and leaves it alone rather than wiping it. Keep
editing `../docs` and re-running `npm run sync`; commit the resulting `content/docs` diff along with
the change.

`public/requirement-doc.html` and `../docs/06-source-plan/` are also generated, but **are** committed —
they are the reproduction of a client deliverable, and the repo should read correctly without anyone
having to run the importer first.
