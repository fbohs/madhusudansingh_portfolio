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

## Deploying

Use `deploy/publish.sh` — never a hand-written `rsync`. The script builds locally and
syncs `site/` to the VPS (`vps-79tech-deploy:/var/www/madhusudansingh_rathore_portfolio`,
served at https://themadhu.dev). Nothing is built on the server.

```bash
./deploy/publish.sh            # dry run — the default
./deploy/publish.sh --apply    # publish
```

It syncs with `--delete`, so the dry run is not optional: `deleting` lines in the
output are files about to be removed from production. The script refuses to publish
if `site/index.html` is missing or fewer than 20 HTML files were built (either would
mean `--delete` wipes the live site), excludes the hand-written `portfolio.html` that
mkdocs does not produce, and curls `/`, a deep page and a bad path afterwards to
confirm 200/200/404.

**Do not run `--apply` on the user's behalf.** Publishing is theirs to trigger.

Nginx is deployed separately and is not touched by the script:
`deploy/nginx/madhu-dev.conf` mirrors `/etc/nginx/sites-available/madhu-dev`, and the
apply/rollback steps are in that file's header comment. It needs sudo on the VPS.

## Hard rules

1. **Every new page MUST be registered in `mkdocs.yml` under `nav:`.** Nav is hand-curated, not auto-generated. An unregistered page builds but is unreachable — MkDocs only logs it as INFO, so it fails silently.
2. **Quote paths — directory names contain spaces and ampersands:** `API Fundamentals/`, `Generative AI/`, `Project Learnings/`, `Prisma & Kysely/`, `System Design/`, `VPS Must Know/`.
3. **Nav labels ≠ directory layout.** The `Learnings` nav section pulls from several directories (`Database/`, `Project Learnings/`, `Authentication-Authorization/`, `Go/`, `Python3/`, `DSA/`). Don't infer file location from the nav tree or vice versa.
4. **Site is dark-only.** Only the `slate` scheme is configured. Any CSS must work on a dark background; there is no light-mode fallback to preserve.
5. **There is no Node toolchain.** No `package.json`, no bundler, no npm scripts — the Docusaurus-era files were deleted. If a task seems to need one, it doesn't; propose the MkDocs/CSS-only version.

## Content conventions

- Enabled markdown extensions: `admonition`, `pymdownx.details`, `pymdownx.superfences`.
- Mermaid diagrams use a ` ```mermaid ` fence (custom superfence). Mermaid is **not** in `extra_javascript` — `docs/javascripts/mermaid-init.js` fetches it on demand, only on pages that contain a diagram. The CDN URL is version-pinned and SRI-checked; `MERMAID_SRC` and `MERMAID_SRI` must be changed together or the script is silently blocked in every browser while the build still passes.
- Diagrams are themed centrally from the CSS tokens by `mermaid-init.js`. Docs pages must not contain `style`, `classDef`, or hex values — use the shared `:::accent` / `:::blue` / `:::amber` / `:::red` / `:::purple` / `:::muted` classes.
- Styling lives in `docs/stylesheets/extra.css`. Design tokens (`--accent: #00d9a3`, `--bg: #0f1117`, Sora / JetBrains Mono) are defined at the top — reuse them, don't hardcode new colors. The `frontend-design` skill has the full rules.
- Docs are personal reference notes: dense, code-first, cheat-sheet style. Match that register — no filler intros.

## Verifying a change

`mkdocs build` exits 0 even with broken internal links, so build with `--strict`, which promotes them to errors:

```bash
.venv/bin/mkdocs build --strict -d /tmp/mkdocs-check 2>&1 | grep -vE '│|^[[:space:]]*$'
```

The build is warning-clean, so **any** warning is new and yours. The `grep` only strips the Material team's MkDocs 2.0 banner. Build to `/tmp` so `site/` isn't clobbered. Or just run `/docs-check`.

Orphaned pages (in `docs/` but absent from `nav`) are logged at INFO, not WARNING, and `--strict` does **not** catch them. Read the log, don't just check the exit code.

## Known issues (pre-existing, unfixed)

- `.cache/` holds the generated social cards (~11 MB, gitignored). Deleting it makes the next build ~3 s instead of ~0.8 s; it is not otherwise load-bearing.
- `requirements.txt` pins only direct deps, not a full lock. `CairoSVG` needs the system cairo library (`brew install cairo freetype libpng`) — pip alone is not enough on a fresh machine.

## Git

Work on `development`. Commit messages are lowercase, imperative, no Conventional-Commits prefix — e.g. `restructure docs nav and add database, auth, prisma & VPS guides`.
