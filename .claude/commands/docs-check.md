---
description: Build the site and report orphaned pages, broken internal links, and nav drift
allowed-tools: Read, Bash(.venv/bin/mkdocs build*), Bash(find docs*), Bash(rg*), Bash(ls*)
---

Health-check the docs. Build to a scratch directory so `site/` is not clobbered:

```bash
.venv/bin/mkdocs build -d /tmp/mkdocs-check 2>&1 \
  | grep -vE '│|Required dependencies of "social"|No module named|Install with:|^[[:space:]]*$'
```

That filter strips the Material MkDocs-2.0 banner and the per-page `social` plugin warnings (one block per page — ~50 lines unfiltered) while keeping everything else.

Then report, grouped and ranked by severity:

1. **Broken internal links** — `not found among documentation files` warnings.
2. **Orphaned pages** — files in `docs/` absent from `nav:` (`not included in the "nav" configuration`).
3. **Nav drift** — entries in `mkdocs.yml` `nav:` pointing at files that no longer exist. Cross-check the nav paths against `find docs -name "*.md"`.
4. **Anything else** the build flagged.

**The build is currently clean** — the only expected output is the `social` plugin's missing imaging deps, which the filter above already strips. `requirements.txt` pins `mkdocs-material[imaging]`; those warnings disappear once it and the system cairo library are installed, so their absence is also fine.

Anything else the build prints is a regression. Report it as one — there is no standing "known issues" allowance to fall back on. (The previously-known orphaned `Database/database_questions.md` and the `Go/trivia.md` → `./file-index.md` link were both fixed on 2026-08-24.)

Note what the build does **not** check: mermaid diagrams are never parsed (they render client-side) and CSS is never validated. A clean report is not evidence that either works.

Do not fix anything unless asked. Report only.
