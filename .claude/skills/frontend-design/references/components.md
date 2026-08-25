# Component Map

Selector-by-selector map of `docs/stylesheets/extra.css`. Open this before
restyling an existing component so you edit the rule that already exists rather
than adding a competing one lower in the file.

Section order in the file is fixed — keep it. New components go in a new
`/* ─── Name ─── */` block in the position that matches the page's visual order.

## Theme plumbing (lines 1–71)

Four blocks, in order. Don't merge them.

| Block | Selector | Purpose |
|---|---|---|
| Design tokens | `:root` | The palette. The only place hex literals are allowed. |
| Slate scheme | `[data-md-color-scheme="slate"]` | Maps tokens onto Material's `--md-*` variables |
| Custom primary | `[data-md-color-primary="custom"]` | Header/nav background |
| Custom accent | `[data-md-color-accent="custom"]` | Interactive accent |

**The primary block is the one people get wrong.** Material treats
`--md-primary-fg-color` as the header *background* and `--md-primary-bg-color` as
the *text painted on it*. The names read backwards. This site wants a dark header
with light text, so `fg` is `--bg` and `bg` is `--text`. There's a comment in the
file saying so — leave it there.

Both custom blocks are required because `mkdocs.yml` sets `primary: custom` and
`accent: custom` under the `slate` scheme.

## Chrome

| Component | Selectors | Notes |
|---|---|---|
| Header | `.md-header`, `.md-header__title\|__topic\|__ellipsis`, `.md-header__button` | `--bg` background, hairline bottom border, `box-shadow: none !important`. Buttons are `--text-muted`, `--accent` on hover. |
| Nav tabs | `.md-tabs`, `.md-tabs__link`, `--active` | `0.78rem`, `opacity: 1` (Material dims these by default — the override is deliberate). |
| Sidebar | `.md-sidebar`, `.md-sidebar__inner`, `.md-nav__title` | Right hairline border. Title is mono/uppercase/`--text-dim`, `0.08em` tracking. |
| Nav links | `.md-nav__link`, `:hover\|:focus`, `--active`, `.md-nav__item--section >` | `0.82rem`, `--text-muted` → `--accent`. Section parents are `--text`, weight 500. |
| Search | `.md-search__input`, `::placeholder`, `.md-search-result__article\|__meta`, `.md-search__output` | `--bg2` surfaces throughout. |
| Footer | `.md-footer`, `.md-footer-meta`, `.md-footer__link` | `--bg2`, with `.md-footer-meta` dropping back to `--bg`. |
| Scrollbar | `::-webkit-scrollbar{,-track,-thumb}` | 5px, thumb `--bg3` → `--text-dim` on hover. WebKit only; Firefox falls back to default. |

Most chrome rules need `!important` because Material's own selectors are more
specific. Keep it where it exists; don't add it speculatively elsewhere.

## Content

| Component | Selectors | Notes |
|---|---|---|
| Typography | `body`, `code, kbd, pre` | Sora / JetBrains Mono. The mono rule is `!important` to beat Material's stack. |
| Headings | `.md-typeset h1`–`h6` + per-level sizes | `-0.02em` tracking. Only h2 has a bottom rule + `0.4rem` padding. |
| Links | `.md-typeset a`, `:hover` | Accent; hover is `opacity: 0.8`, not a colour change. |
| Inline code | `.md-typeset :not(pre) > code` | `--accent-dim2` fill, `--accent` text, `3px` radius — deliberately *not* `--radius`. |
| Code blocks | `.md-typeset pre`, `pre > code` | `--bg2`, hairline border, `--radius`. |
| Blockquotes | `.md-typeset blockquote` | 2px `--accent` left border, `--bg2`, radius on right corners only. |
| Tables | `.md-typeset table:not([class])` + `th`/`td`/`tr:last-child td` | `overflow: hidden` on the table is what makes the radius clip. `th` is mono `0.78rem`. Last row drops its border. |
| Admonitions | `.md-typeset .admonition, details` + `.admonition-title, summary` | Styled as one pair — `details` always rides along with `.admonition`. 2px accent left border. |
| Mermaid | `.md-typeset .mermaid`, `.mermaid svg` | **Layout only.** `--bg2` surface, hairline border, `--radius`, `overflow-x: auto`. All colour is set in `docs/javascripts/mermaid-init.js`; adding a colour rule here creates a second source of truth. |
| Content area | `.md-content`, `.md-typeset hr` | |
| Breadcrumbs | `.md-nav__link--index` | |

The `:not([class])` guard on tables scopes the styling to markdown tables and
leaves Material's own (search results, footnotes) alone. Preserve it.

## Mermaid: where each concern lives

Three files, one job each. Keep the split.

| File | Owns |
|---|---|
| `mkdocs.yml` | Registers `javascripts/mermaid-init.js` in `extra_javascript`, and the `pymdownx.superfences` custom fence that turns ` ```mermaid ` into `<pre class="mermaid">`. Mermaid itself is **not** listed — that's deliberate. |
| `docs/javascripts/mermaid-init.js` | Version pin + SRI, on-demand fetch, `themeVariables` and `themeCSS`, the `:::name` emphasis classes. Every colour. |
| `docs/stylesheets/extra.css` | The container box only — surface, border, radius, horizontal scroll. |

Two implementation details worth not breaking:

- **`.mermaid:not([data-processed])`** is the render selector. Mermaid stamps
  `data-processed` on diagrams it has drawn; re-running over those duplicates the
  SVG. Any new render path must keep that guard.
- **`startOnLoad: false`** is required, not a preference. Mermaid is injected
  after its own `DOMContentLoaded` hook would have fired, so nothing would render
  if it were left on. `render()` drives it explicitly, subscribing to Material's
  `document$` so it stays correct if `navigation.instant` is ever enabled.

## Adding a component

1. Check this file and the stylesheet for an existing rule first.
2. New `/* ─── Name ─── */` block, positioned by visual order.
3. `var(--token)` only. Need a new shade → add it to `:root`.
4. Hairline borders, no shadow, colour-only transitions at `0.15s`.
5. Build clean, then confirm visually.

## Not covered

No print stylesheet, no light-scheme support (`mkdocs.yml` ships `slate` only —
adding a light palette means auditing every `!important` in the file), no
reduced-motion rules (there is nothing animated beyond colour fades), and no
focus-visible styling beyond Material's defaults. Each is a real gap; none is
currently a bug.
