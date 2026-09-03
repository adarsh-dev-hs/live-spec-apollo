# Apollo Knowledge GWD — documentation site

A [Fumadocs](https://fumadocs.dev) site presenting the Apollo Knowledge GWD platform in **four tabs**.

```bash
npm install
npm run dev     # http://localhost:3000
```

## The four tabs

| Tab | Route | What it is |
|---|---|---|
| **Original Plan** | `/original-plan` | The client's original delivery plan, framed verbatim from `public/requirement-doc.html` — its own tabs, filters and styling intact |
| **Live POC App** | external | The running POC (`live_app_apollo`). Every screen reference in the docs links straight into it |
| **Release Plan** | `/docs/release-plan` | The Statement of Work signed **3 September 2026**, reproduced: 51 deliverables, three parts, assumptions and client dependencies. **The authority on scope.** |
| **Engineering Documentation** | `/docs/engineering` | How the platform is built: architecture, platform services, the twenty modules with scope and purpose, data model, APIs, infrastructure, security, integrations, delivery |

The tabs are declared once in `lib/layout.shared.tsx` and rendered by both the home layout and the
docs layout, so they are present on every page.

## Content lives in `content/docs`, and is hand-authored

`content/docs/**/*.mdx` is **the source of truth** and is edited directly. Two folders carry
`"root": true` in their `meta.json`, which is what makes them the two docs tabs and what scopes the
sidebar to whichever one you are inside. Folders one level down are **collapsible sidebar groups**,
each with its own title, icon and `defaultOpen`.

```
content/docs/
  index.mdx                    /docs — "Start here"
  meta.json                    root: true

  release-plan/                root: true  →  the Release Plan tab
    index.mdx                  Overview
    parts/                     group: "The three parts"
      part-1.mdx  part-2.mdx  part-3.mdx
    scope/                     group: "Scope"
      deliverables.mdx  matrix.mdx  assumptions.mdx

  engineering/                 root: true  →  the Engineering Documentation tab
    index.mdx                  Overview
    context/                   group: "Context"
      product-context.mdx  architecture.mdx
    build/                     group: "What gets built"
      platform-services.mdx  modules.mdx
    reference/                 group: "Technical reference"
      data-model.mdx  api-design.mdx  infrastructure.mdx  security.mdx  integrations.mdx
    delivery-and-quality.mdx
```

Order comes from each `meta.json` `pages` array, not from filenames, so files carry no numeric
prefixes. Every page sets a Lucide `icon` in its frontmatter and every folder sets one in its
`meta.json`.

`content/_archive/` holds the previous 121-page specification set (foundation, standards, platform,
modules, integrations, delivery, source plan, phases). It is outside `content/docs`, so it is not
built and not routed — kept on disk because it is where much of the current content was distilled
from.

### Where the tabs come from

`lib/tabs.tsx` declares the four tabs once. Three surfaces consume it:

| Surface | How |
|---|---|
| Home page header | `baseOptions().links`, rendered by fumadocs' `HomeLayout` |
| Docs sidebar | `components/tab-bar.tsx` as the sidebar **banner**, with `links={[]}` and `tabs={false}` on `DocsLayout` |
| `/original-plan` header | the same `TabBar`, horizontal — that page is outside both fumadocs layouts |

The docs layout needs the banner rather than plain `links` because fumadocs' docs header is
mobile-only: nav links fall through into the sidebar and render with page-tree styling, so four
top-level destinations end up reading as siblings of "Overview" and "Context".

### Where scope comes from

`Apollo_SOW_Final_03_09_2026_Engineering.pdf` (one directory up) is the signed document. The
`release-plan/` pages reproduce it — deliverable register, part contents, assumptions, dependencies.
**Where the engineering documentation and the release plan disagree, the release plan wins.**

## Scripts

| Script | Does |
|---|---|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run types:check` | `next typegen && tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run import:prd` | Regenerates `public/requirement-doc.html` (and `../docs/06-source-plan/`) from the client's requirement HTML. Manual, run only when the client reissues the plan |
| `npm run sync` | **Destructive, and no longer automatic.** Mirrors `../docs/**/*.md` into `content/docs`, wiping it first |

`sync` used to be a `predev` / `prebuild` lifecycle hook, back when `content/docs` was a generated
mirror of `../docs`. It is not one any more: `content/docs` is hand-authored, and the script now
**refuses to run without `--force`** when `content/docs` exists, so a stray `npm run dev` cannot
delete the only copy. `scripts/sync-docs.mjs` is kept, with its MDX-escaping and link-rewriting
logic intact, for the day a markdown source is reintroduced.

## Screen references link to the live POC

Any inline code span that names a route the POC actually serves is rendered as a link into the live
app — `` `/board` ``, `` `/requisitions/:id` ``, `` `/app/check-in` ``. The list of real routes is
`lib/poc-routes.ts`, and anything absent from it (API paths like `/v1/invoices`, health endpoints)
stays plain code. That is what keeps the linking honest: a link exists only where a screen does.

`NEXT_PUBLIC_POC_APP_URL` overrides the target — set it to `http://localhost:5173` to point the docs
at a local Vite dev server.

## Site features

- **Search** (⌘K) — Orama, at `/api/search`
- **Table of contents, breadcrumbs, prev/next** — Fumadocs defaults
- **Light and dark themes**
- **`/llms.txt`** and **`/llms-full.txt`** for LLM consumption
- **Copy as markdown** on every page, plus a view-options popover
- **Markdown content negotiation** — `proxy.ts` rewrites so that both `GET /docs/<path>.md` and
  `GET /docs/<path>` with `Accept: text/markdown` return raw markdown for the same URL
- **OG images** generated per page at `/og/docs/<path>/image.png`
- **`/requirement-doc`** redirects to `/original-plan`, so older links still resolve

## Configuration

| File | Holds |
|---|---|
| `lib/shared.ts` | `appName`, `appDescription`, the docs and original-plan routes, and the POC app URL |
| `lib/tabs.tsx` | **The four tabs** — the single definition all three surfaces read |
| `lib/layout.shared.tsx` | Turns `TABS` into fumadocs `links` for the home layout |
| `components/tab-bar.tsx` | The tab block rendered in the docs sidebar and on `/original-plan` |
| `lib/poc-routes.ts` | Every route the live POC serves — the allow-list for screen links |
| `lib/source.ts` | The Fumadocs source loader |
| `app/layout.tsx` | Root metadata: title template, `metadataBase` from `NEXT_PUBLIC_SITE_URL ?? http://localhost:3000` |
| `app/docs/layout.tsx` | `links={[]}`, `tabs={false}`, and the `TabBar` as the sidebar banner |
| `content/docs/**/meta.json` | Sidebar title, icon, `defaultOpen` and page order per root and group |

Set `NEXT_PUBLIC_SITE_URL` when deploying so OG images and canonical URLs resolve absolutely.

## Adding a page

1. Create the `.mdx` file inside the group folder it belongs to, with `title`, `description` and
   `icon` frontmatter. `icon` is any [Lucide](https://lucide.dev) name in PascalCase.
2. Add its slug to that folder's `meta.json` `pages` array, in the position you want it — a page
   missing from `pages` is still routed, it just sorts last.

To add a whole group, create the folder with a `meta.json` carrying `title`, `icon`,
`defaultOpen` and `pages`, then list the folder name in its parent's `pages`.

Two things worth knowing when writing:

- **MDX parses `<` and `{`.** Write `&lt;` and `&#123;` in prose, or keep the notation inside a code
  fence or a code span.
- **A `|` inside an inline code span inside a table cell** splits the cell. Escape it as `\|`.

## Generated files

`.source` is generated by Fumadocs on every build and is git-ignored.

`public/requirement-doc.html` is generated by `npm run import:prd` but **is** committed — it is the
reproduction of a client deliverable, and the repo should read correctly without anyone having to run
the importer first.
