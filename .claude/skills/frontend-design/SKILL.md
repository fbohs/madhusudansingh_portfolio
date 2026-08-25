---
name: frontend-design
description: Visual and styling conventions for this MkDocs Material docs site. Use when editing docs/stylesheets/extra.css, theming mermaid diagrams, changing the header/sidebar/tables/admonitions/code blocks, adjusting colour, type, spacing or borders, or when a new docs page needs a visual element beyond plain markdown.
---

# Docs Site Design

This is an **MkDocs Material static site**. There is no bundler, no component
framework, no state management, and no JavaScript build step. Styling is one
file: `docs/stylesheets/extra.css` (~300 lines), loaded via `extra_css` in
`mkdocs.yml`.

Do not introduce React, Tailwind, a CSS preprocessor, or a build pipeline. If a
change seems to need one, it doesn't — say so and propose the CSS-only version.

## The one hard rule

**Never write a raw hex value outside the `:root` token block.**

Every colour in `extra.css` past line ~26 is `var(--token)`. Every colour in a
docs page is *nothing at all* — pages carry no colour. If you need a shade that
doesn't exist, add a token to `:root` first, then reference it. A hex literal in
a component rule or a markdown file is a defect, not a shortcut.

## Tokens

Defined in `:root` at the top of `extra.css`. This is the whole palette.

| Token | Value | Use |
|---|---|---|
| `--bg` | `#0f1117` | Page, header, sidebar, tab bar, content area |
| `--bg2` | `#161b27` | Raised surfaces: code blocks, tables, blockquotes, admonitions, search, footer |
| `--bg3` | `#1c2333` | Highest layer: table headers, admonition titles, scrollbar thumb |
| `--border` | `rgba(255,255,255,0.07)` | All borders — always `0.5px solid` |
| `--border-hover` | `rgba(255,255,255,0.14)` | Border on hover |
| `--text` | `#e8eaf0` | Body text, headings, site title |
| `--text-muted` | `#7a8499` | Secondary text, nav links, table cells, footer |
| `--text-dim` | `#4a5168` | Tertiary: nav section titles, placeholders |
| `--accent` | `#00d9a3` | Teal. Links, active/hover state, inline code, left borders |
| `--blue` | `#4f9eff` | Informational emphasis |
| `--amber` | `#f5a623` | Caution / "watch out" emphasis |
| `--red` | `#ff6b6b` | Error / "don't do this" emphasis |
| `--purple` | `#b388ff` | Alternative categorical emphasis |
| `--mono` | JetBrains Mono | Code, labels, table headers, nav titles |
| `--sans` | Sora | Body and headings |
| `--radius` / `--radius-lg` | `8px` / `12px` | Corners |

Each hue also has a `-dim` variant at ~12% alpha (`--accent-dim`, `--blue-dim`,
`--amber-dim`, `--red-dim`, `--purple-dim`) for fills behind that hue's stroke,
plus `--accent-dim2` at 6% for inline-code backgrounds.

**Semantic meaning is fixed.** Teal = primary/success/active. Blue = info.
Amber = caution. Red = wrong/failure. Purple = a fourth category when you've run
out. Don't repurpose a hue because it looks nicer in one diagram.

## Visual grammar

The site has a consistent, deliberately understated look. Match it:

- **Borders are hairlines.** `0.5px solid var(--border)`, never 1px, never a
  brighter colour. Depth comes from the `--bg`/`--bg2`/`--bg3` layering, not from
  strokes.
- **No shadows.** `box-shadow: none` is set explicitly on the header and
  admonitions. Don't reintroduce them.
- **Accent appears as a 2px left border**, on blockquotes and admonitions. That
  is the site's signature element.
- **Mono + uppercase + letter-spacing marks a label**, not content — nav section
  titles (`0.72rem`, `0.08em`), table headers (`0.78rem`, `0.04em`), admonition
  titles (`0.8rem`, `0.04em`).
- **Headings tighten, they don't shout.** `letter-spacing: -0.02em`, weight 500–600,
  h1 `1.6rem` / h2 `1.2rem` / h3 `1.05rem`. Only h2 gets an underline rule.
- **Transitions are 0.15s on colour only.** No transforms, no easing curves.

Full selector-by-selector map of the stylesheet: see
`references/components.md` — open it before restyling an existing component, so
you change the rule that already exists instead of adding a competing one.

## Mermaid diagrams

Diagrams are themed **centrally** by `docs/javascripts/mermaid-init.js`, which
reads the `:root` tokens at runtime. They inherit the palette automatically —
change a token and every diagram on the site repaints.

That file is the **only** entry point. Mermaid itself is deliberately *not* in
`extra_javascript`: it is ~3.5 MB and only about half the pages carry a diagram,
so `mermaid-init.js` fetches it on demand and only when a `.mermaid` node is
present. Layout and container chrome live in the Mermaid block in `extra.css`;
every colour lives in the JS. Don't split that differently.

!!! warning "Bumping the mermaid version"
    The CDN URL is pinned and integrity-checked. `MERMAID_SRC` and `MERMAID_SRI`
    must change **together** — a stale hash silently blocks the script in every
    browser, and the build still passes. Regenerate with:

    ```bash
    curl -sL -o m.js https://unpkg.com/mermaid@<version>/dist/mermaid.min.js
    echo "sha384-$(openssl dgst -sha384 -binary m.js | openssl base64 -A)"
    ```

**Docs pages must not contain `style`, `classDef`, or hex values.** A diagram
that needs no emphasis needs no styling — the default node already matches the
site. This keeps ~20 diagrams from drifting apart and means a token change
repaints all of them.

For emphasis, use the shared classes with mermaid's `:::` syntax:

```
flowchart TD
    A["Plain node"] --> B["Highlighted"]:::accent
    B --> C["Caution"]:::amber
```

Available: `:::accent`, `:::blue`, `:::amber`, `:::red`, `:::purple`, `:::muted`.

Authoring rules:

- Quote every label: `A["Text here"]`. Unquoted labels break on `(`, `,`, `:` and `-`.
- Use `<br/>` for line breaks; escape `>` as `&gt;` inside labels.
- Keep diagrams under ~12 nodes. Past that, split it or use a table.
- Reach for a diagram when it shows a *mechanism* — a lookup path, a state
  change, a decision. A picture of a list is worse than the list.
- ASCII blocks inside a fenced code block are correct and idiomatic here for
  spatial layouts (grids, memory maps, box diagrams) that mermaid draws badly.
  Existing pages use them freely; that's a feature, not drift.

## Markdown conventions in docs pages

Available extensions: `admonition`, `pymdownx.details`, `pymdownx.superfences`.
Nothing else is enabled — don't use tabs, annotations, or content blocks without
adding the extension to `mkdocs.yml` first.

- Page opens with `# H1`, then a bold one-line lead (often a blockquote), then `---`.
- `!!! note` / `!!! tip` / `!!! warning` for asides; `???` for collapsed detail.
- Tables for anything comparative. The register is cheat-sheet: dense, code-first,
  no filler intros.

## Verify

Any CSS or diagram change must build clean:

```bash
.venv/bin/mkdocs build -d /tmp/mkdocs-check 2>&1 \
  | grep -vE '│|Required dependencies of "social"|No module named|Install with:|^[[:space:]]*$'
```

That filter strips the MkDocs-2.0 banner and the per-page `social` plugin
warnings. The `social` warnings appear only where the imaging extras aren't
installed — `requirements.txt` pins `mkdocs-material[imaging]`, but CairoSVG also
needs the system library (`brew install cairo freetype libpng`).

**The build is otherwise clean.** Treat any other warning as a regression you
introduced, not as background noise.

A clean build proves almost nothing about the visuals:

- CSS is never validated — a build passes with completely broken styling.
- **Mermaid is never parsed.** Diagrams render client-side, so a malformed
  diagram builds fine and fails only in the browser.

Confirm in a browser (`.venv/bin/mkdocs serve`), or state plainly that you did not.
