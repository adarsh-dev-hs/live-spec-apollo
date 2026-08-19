# Apollo Knowledge GWD — Documentation Site

A [Fumadocs](https://fumadocs.dev) site that renders the engineering documentation in
[`../docs`](../docs).

## Running it locally

```bash
cd docs-site
npm install     # first time only
npm run dev
```

Then open <http://localhost:3000>. The documentation itself is at `/docs`.

## How the content works

`../docs` is the **single source of truth** and is never modified. `scripts/sync-docs.mjs`
mirrors it into `content/docs/`, which is generated and git-ignored. The sync runs
automatically before `dev` and `build`, or on demand with `npm run sync`.

The sync does four things the raw markdown needs before Fumadocs can render it:

| Step | Why |
|---|---|
| Adds `title` / `description` frontmatter | Derived from the `#` heading and the **Purpose** paragraph |
| Writes `meta.json` per folder | Gives each section its sidebar name, icon and page order |
| Rewrites `*.md` cross-links | `03-modules/03-01-clients.md` → `/docs/03-modules/03-01-clients` |
| Escapes `<placeholder>`, `{`, `}` and table pipes | The docs use `<key>`, `<module>` etc. as notation; unescaped they are parsed as JSX and vanish |

It also generates a landing page for each section listing that section's documents.

**To change documentation content, edit the files in `../docs`.** Anything written directly
into `content/docs/` is overwritten on the next sync.

Adding a new folder under `../docs` works without configuration — it appears at the end of the
sidebar under its own name. To give it a proper title and icon, add it to the `SECTIONS` array
at the top of `scripts/sync-docs.mjs`.

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Sync, then start the dev server on port 3000 |
| `npm run build` | Sync, then build for production |
| `npm start` | Serve the production build (run `build` first) |
| `npm run sync` | Regenerate `content/docs` only |
| `npm run types:check` | TypeScript check |

## What you get

- All 60 documents, plus a landing page per section
- Full-text search (Orama, built at load time) — `⌘K`
- Table of contents, breadcrumbs, previous/next navigation, light and dark themes
- `/llms.txt` and `/llms-full.txt`, and a "copy as markdown" button on every page
