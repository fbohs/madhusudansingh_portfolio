# madhusudansingh_portfolio

Personal portfolio + technical documentation hub. **MkDocs + Material theme.** Published at https://themadhu.dev.

## Stack

| Thing | Value |
|---|---|
| Generator | MkDocs 1.6 + `mkdocs-material` 9.7 |
| Runtime | Python venv at `.venv/` (Python 3.14) |
| Content | Markdown in `docs/` |
| Config | `mkdocs.yml` (single source of truth for nav) |
| Output | `site/` (gitignored, never commit) |
| Default branch | `development` |

## Commands

Always use the venv binary — there is no global mkdocs guarantee.

```bash
.venv/bin/mkdocs serve --livereload   # dev server on :8000
.venv/bin/mkdocs build                # → site/
.venv/bin/pip install -r requirements.txt
```

Deploy is manual: `mkdocs build` then `rsync -avzP ./site/ user@remote:/path/to/server/root`.

## Hard rules

1. **Every new page MUST be registered in `mkdocs.yml` under `nav:`.** Nav is hand-curated, not auto-generated. An unregistered page builds but is unreachable — MkDocs only logs it as INFO, so it fails silently.
2. **Do not touch the Docusaurus leftovers.** `package.json`, `src/`, `static/`, `ecosystem.config.js` are dead artifacts from the pre-MkDocs site. They are not part of the build. Do not "fix", update, or run them. `ecosystem.config.js` in particular describes an `npm run build` deploy that no longer exists.
3. **Quote paths — directory names contain spaces and ampersands:** `API Fundamentals/`, `Generative AI/`, `Project Learnings/`, `Prisma & Kysely/`, `System Design/`, `VPS Must Know/`.
4. **Nav labels ≠ directory layout.** The `Learnings` nav section pulls from several directories (`Database/`, `Project Learnings/`, `Authentication-Authorization/`, `Go/`, `Python3/`, `DSA/`). Don't infer file location from the nav tree or vice versa.
5. **Site is dark-only.** Only the `slate` scheme is configured. Any CSS must work on a dark background; there is no light-mode fallback to preserve.

## Content conventions

- Enabled markdown extensions: `admonition`, `pymdownx.details`, `pymdownx.superfences`.
- Mermaid diagrams use a ` ```mermaid ` fence (custom superfence). Mermaid 11 loads from unpkg CDN via `extra_javascript`.
- Styling lives in `docs/stylesheets/extra.css`. Design tokens (`--accent: #00d9a3`, `--bg: #0f1117`, Sora / JetBrains Mono) are defined at the top — reuse them, don't hardcode new colors.
- Docs are personal reference notes: dense, code-first, cheat-sheet style. Match that register — no filler intros.

## Verifying a change

`mkdocs build` exits 0 even with broken internal links, so build with `--strict`, which promotes them to errors:

```bash
.venv/bin/mkdocs build --strict -d /tmp/mkdocs-check 2>&1 | grep -vE '│|^[[:space:]]*$'
```

The build is warning-clean, so **any** warning is new and yours. The `grep` only strips the Material team's MkDocs 2.0 banner. Build to `/tmp` so `site/` isn't clobbered. Or just run `/docs-check`.

Orphaned pages (in `docs/` but absent from `nav`) are logged at INFO, not WARNING, and `--strict` does **not** catch them. Read the log, don't just check the exit code.

## Known issues (pre-existing, unfixed)

- Mermaid loads on every page from `unpkg.com/mermaid@11` — 3.5 MB raw / 950 KB gzipped — but only ~25 of 53 pages contain a diagram. The floating `@11` range also redirects (extra hop, 60 s-cacheable) and lets minor versions land unpinned.
- `.cache/` holds the generated social cards (~11 MB, gitignored). Deleting it makes the next build ~3 s instead of ~0.8 s; it is not otherwise load-bearing.
- `requirements.txt` pins only direct deps, not a full lock. `CairoSVG` needs the system cairo library (`brew install cairo freetype libpng`) — pip alone is not enough on a fresh machine.

## Git

Work on `development`. Commit messages are lowercase, imperative, no Conventional-Commits prefix — e.g. `restructure docs nav and add database, auth, prisma & VPS guides`.
