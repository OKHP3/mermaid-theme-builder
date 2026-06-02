---
name: Mermaid 11 diagram grammar quirks
description: Specific grammar constraints discovered by reading mermaid chunk parser tables — validated against live error messages
---

## Block-beta
- `block:Id["Label"]:N` is a COMPOSITE block (id-block token) requiring
  `children + end`. Plain named nodes use `Id["Label"]:N` directly.
- The SIZE token (`:N`) after node ID sets column span.
- `end` keyword closes composite blocks.

**Why:** Grammar rule 27: `blockStatement → id-block document end` (4 symbols).
Plain nodeStatement: rule 24: `nodeStatement → node SIZE`.

## Architecture-beta
- No `end` token exists in the architecture-beta grammar. Nested
  `group ... service ... end` is invalid.
- Use flat `service X(icon)[Label] in groupId` syntax instead.
- Dot (`.`) is invalid inside square-bracket labels `[...]`.
  Use space instead: `[Mermaid JS]` not `[Mermaid.js]`.
- Connections: `service:DIR -- DIR:service` (not `-->`).

## Flowchart (v11+)
- `:::className` (STYLE_SEPARATOR) is invalid after `@{ shape, label }`
  (SHAPE_DATA). The grammar has no valid transition between these states.
- Use `class nodeId className` statements instead.

## Venn-beta
- Grammar uses literal `set` and `union` keywords, not plain identifiers.
- Tokens (from chunk): SET=/^(?:set\b)/i, UNION=/^(?:union\b)/i,
  BRACKET_LABEL=/^(?:\["[^"]*"\])/i or /^(?:\[[^\]"]+\])/i.
- Correct syntax: `set A ["Label"]` and `union A B ["Label"]`.
- `A[Measure]` is tokenized as IDENTIFIER (not SET) — parse error.
- Title IS supported in venn-beta (TITLE token exists in grammar).

## EventModeling
- The eventModeling chunk is a thin re-export (173 bytes). The actual
  grammar does NOT support the `title` keyword — parser expects EOF
  after the diagram type keyword.
- Em dash (U+2014) causes lexer errors in most diagram grammars.
  Use ASCII hyphen `-` or remove special characters from labels.

## How to diagnose grammar issues
- The `.mjs` chunk files in `node_modules/mermaid/dist/chunks/mermaid.esm.min/`
  contain the full parser table. Use `node -e` to inspect `symbols_`,
  `productions_`, `performAction`, and `rules:` (lexer patterns).
- The `symbols_` table maps token names to numbers.
- The `rules:` array contains the lexer regex patterns (index = rule number).
