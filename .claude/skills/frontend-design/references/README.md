# references/

Overflow for `SKILL.md`. Files here are **not** auto-loaded — Claude reads one
only when `SKILL.md` links to it and the task calls for it. That is the point:
`SKILL.md` stays short enough to be read in full every time, and the long tail
costs nothing until it's needed.

Put something here when it is:

- **Exhaustive** — a full token table, every admonition variant, a component catalogue.
- **Rarely needed** — migration notes, rationale, historical decisions.
- **Long** — anything that would push `SKILL.md` past ~300 lines.

Keep in `SKILL.md` anything that applies to *every* frontend change.

## Linking

From `SKILL.md`, reference by relative path and say when to open it:

```markdown
Full component catalogue: see `references/components.md` before adding a new
element type to extra.css.
```

Without that "when" clause the pointer is dead weight — Claude won't know it
should open the file.

## Suggested files

Create only what you need; delete this README once the directory has real content.

| File | For |
|---|---|
| `components.md` | Per-component specs: header, sidebar, tables, admonitions, code blocks |
| `tokens.md` | Full token reference with usage examples, if the `SKILL.md` table outgrows itself |
| `accessibility.md` | Contrast matrix, focus states, reduced-motion rules |
