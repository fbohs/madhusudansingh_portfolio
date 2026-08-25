# Madhusudansingh Rathore - Portfolio

This website is built using [MkDocs](https://www.mkdocs.org/) and the [Material for MkDocs](https://squidfunk.github.io/mkdocs-material/) theme. It serves as my professional portfolio and documentation hub.

## Project Structure

- `docs/`: Markdown content source files, plus `stylesheets/extra.css` and `javascripts/mermaid-init.js`.
- `mkdocs.yml`: Configuration, including the hand-curated `nav` tree.
- `requirements.txt`: Python dependencies.
- `deploy/`: Publish script and the nginx config mirrored from the server.

## Local Development

Prerequisites: Python 3, and the system cairo libraries that the `social` plugin's image generation depends on — pip alone is not enough:

```bash
brew install cairo freetype libpng
```

1. **Create the virtual environment** (do this before installing anything, so the dependencies land in the project rather than in system Python):

```bash
python3 -m venv .venv
```

2. **Install the dependencies:**

```bash
.venv/bin/pip install -r requirements.txt
```

3. **Start the development server:**

```bash
.venv/bin/mkdocs serve --livereload
```

Open [http://localhost:8000](http://localhost:8000) in your browser.

The `.venv/bin/` prefix is intentional throughout — it targets this project's environment whether or not the venv is activated. If you prefer, `source .venv/bin/activate` once and drop the prefix.

## Build

To build the static site:

```bash
.venv/bin/mkdocs build
```

This generates the static HTML files in the `site/` directory, which is gitignored.

Internal links are not checked by default — a build succeeds with broken ones. Use `--strict` to promote them to errors:

```bash
.venv/bin/mkdocs build --strict
```

## Deployment

The site is published to a VPS and served by nginx at [themadhu.dev](https://themadhu.dev). The build happens locally — the server holds only the generated output and has no Python or MkDocs on it.

```bash
./deploy/publish.sh            # dry run — shows exactly what would change
./deploy/publish.sh --apply    # publish
```

Dry run is the default deliberately. The sync uses `--delete` against a live web root, so `deleting` lines in the output are files about to be removed from production — read them before applying.

The script builds, refuses to publish an empty or truncated build, and verifies the live site responds correctly afterwards. It requires the `vps-79tech-deploy` SSH host alias.

Nginx config is deployed separately: `deploy/nginx/madhu-dev.conf` mirrors the server file, with apply and rollback steps in its header comment.
