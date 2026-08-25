---
description: Scaffold a new docs page and register it in the mkdocs.yml nav
argument-hint: <section>/<page-title>  e.g. "Database/Query Planning"
allowed-tools: Read, Write, Edit, Bash(.venv/bin/mkdocs build*), Bash(ls*), Bash(find docs*)
---

Create a new documentation page: **$ARGUMENTS**

Steps:

1. Resolve the target directory under `docs/`. Reuse an existing section directory if one matches (list them first — names contain spaces, quote them). Only create a new directory if no section fits, and say so.
2. Filename: lowercase kebab-case `.md` derived from the page title.
3. Write the page with an `# H1` matching the title, then a short lead paragraph and the content skeleton. Match the house style: dense, code-first, cheat-sheet register — no filler intro, no "In this guide we will…".
4. **Register it in `mkdocs.yml` under `nav:`** in the section that matches the nav tree, not the directory tree. This step is mandatory — an unregistered page is unreachable.
5. Verify with the same filter `/docs-check` uses, and confirm the new page is neither orphaned nor emitting link warnings:

   ```bash
   .venv/bin/mkdocs build -d /tmp/mkdocs-check 2>&1 \
     | grep -vE '│|Required dependencies of "social"|No module named|Install with:|^[[:space:]]*$'
   ```

Report the file path and the exact nav lines you added.
