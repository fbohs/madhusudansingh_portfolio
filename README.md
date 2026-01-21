# Madhusudansingh Rathore - Portfolio

This website is built using [MkDocs](https://www.mkdocs.org/) and the [Material for MkDocs](https://squidfunk.github.io/mkdocs-material/) theme. It serves as my professional portfolio and documentation hub.

## Project Structure

- `docs/`: Markdown content source files.
- `mkdocs.yml`: Configuration file.

## Local Development

Prerequisites: Python and pip.

1. **Install MkDocs and Material Theme:**

```bash
pip install mkdocs-material
```

2. **Initialize Python Virtual Environment**

```bash
python3 -m venv .venv
```

3. **Initialize Python Virtual Environment**

```bash
source .venv/bin/activate
```

4. **Start the development server:**

```bash
mkdocs serve --livereload
```

Open [http://localhost:8000](http://localhost:8000) in your browser.

## Build

To build the static site:

```bash
mkdocs build
```

This generates the static HTML files in the `site/` directory.

## Deployment

This site can be deployed to GitHub Pages or any static site host using the built-in deploy command:

```bash
mkdocs build
rsync -avzP ./site/ user@remote:/path/to/server/root
```
