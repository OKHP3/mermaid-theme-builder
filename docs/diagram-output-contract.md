# Diagram Output Contract

**Last updated:** 2026-06-20
**Applies to:** All Mermaid code produced by or for use with Mermaid Theme Builder

---

## Purpose

The Diagram Output Contract is the set of structural rules that every Mermaid diagram produced by an AI assistant or human author must satisfy to be compatible with Mermaid Theme Builder's governance workflow.

When an AI assistant is given a Prompt Scaffold export from Mermaid Theme Builder, this contract is embedded in that scaffold as the Rules section. Referencing this document by name in a system prompt is equivalent to embedding the full rules inline.

---

## The Contract

### Block structure

1. Output exactly one Mermaid fenced code block per response.
2. No stray prose, explanatory comments, or annotations inside the fenced block.
3. No partial diagrams or diff fragments — always output the complete diagram.
4. No diagram splitting across multiple code blocks or messages.

### Diagram header

5. When a `%%{init}%%` directive or YAML frontmatter block is provided, include it verbatim on the first line(s) of the diagram. Do not modify it.
6. Do not add a second `%%{init}%%` block or YAML frontmatter block when one is already present.
7. The diagram type keyword (`flowchart`, `sequenceDiagram`, `classDiagram`, etc.) must immediately follow the init block with no blank line between.

### Node identifiers

8. Node IDs must contain only alphanumeric characters and underscores: `[A-Za-z0-9_]+`.
9. Node IDs must be stable across revisions — do not change the ID of an existing node when updating diagram content.
10. Never use the literal string `end` as a node ID or unquoted node label. Mermaid reserves `end` to close `subgraph`, `alt`, `loop`, `opt`, and `par` blocks.

### Labels

11. Use double quotes for string labels whenever the label contains spaces, punctuation, or special characters.
12. Never use backtick labels. Use `A["label"]` not `` A[`label`] ``.
13. Never use single-quoted labels. Use `A["label"]` not `A['label']`.
14. No HTML tags inside node labels: no `<br>`, `<b>`, `<i>`, `<span>`, or any other HTML elements.
15. Prefer concise single-line labels. Long labels overflow in constrained renderers (GitHub, Notion, M365 Loop).

### Syntax

16. No semicolons as line terminators. Write `A --> B` not `A --> B;`.
17. Every `subgraph` block must close with an explicit `end` keyword on its own line.
18. Every `alt`, `loop`, `opt`, and `par` block in a sequence diagram must close with `end`.
19. No duplicate node IDs within the same diagram.
20. No empty subgraphs.

### Styling

21. Do not add `style`, `classDef`, or `linkStyle` directives that are not part of the active governance profile. The profile handles all color and style decisions.
22. Do not invent `classDef` class names. Use only the named classes provided by the active governance profile: `:::primary`, `:::secondary`, `:::tertiary`, `:::accent`, `:::neutral`, and any family-specific additions defined in the Prompt Scaffold.
23. Do not add inline style overrides (`style A fill:#ff0000`) except when explicitly instructed.

### Update and Repair rules

24. **Update mode:** When updating an existing diagram, preserve the `%%{init}%%` directive and all `classDef` blocks verbatim. Change only the structural content — nodes, edges, labels, and subgraph organization.
25. **Repair mode:** When repairing a syntax error, make the minimum change needed to produce valid syntax. Do not restructure, rename, or restyle unless the repair requires it.
26. Never silently remove a `%%{init}%%` block or `classDef` block when editing a diagram. If the block must change, note the change explicitly.

### Output quality

27. Before finalizing output, verify: every subgraph has an `end`, no orphan nodes (unless intentional), no duplicate node IDs.
28. Wrap the final diagram in a single fenced code block marked `mermaid`.

---

## Renderer-Specific Addenda

When a renderer target is specified in the Prompt Scaffold, the following additional rules apply:

### GitHub / GitLab

- No inline `<style>` blocks — CSS injection is blocked.
- Custom `fontFamily` values will be ignored — do not set fonts in the init directive.
- Use `classDef` for node-level styling instead of CSS injection.

### Microsoft 365 / Loop / Copilot

- Prefer `%%{init}%%` directive format over YAML frontmatter — Loop may not process YAML frontmatter reliably.
- Avoid beta or experimental diagram families — they may not render.
- Use `look: classic` — Neo and Hand-Drawn are not reliably available.
- No custom `fontFamily` — the platform applies its own font stack.

### Notion

- `%%{init}%%` is parsed but only a subset of `themeVariables` are applied — do not depend on secondary or tertiary color overrides.
- No custom `fontFamily`.
- Avoid beta diagram families.

---

## Using This Contract with AI Assistants

### Option A — Include via Prompt Scaffold

Export a Prompt Scaffold from Mermaid Theme Builder (Apply tab or Compose tab). The scaffold embeds this contract's rules in the Rules section automatically, keyed to the active palette, look, and renderer target.

### Option B — Reference directly

Include the following instruction in a system prompt or thread opener:

```
Follow the Mermaid Theme Builder Diagram Output Contract. Key rules:
- Exactly one mermaid fenced block per response.
- Include the provided %%{init}%% block verbatim on the first line.
- Node IDs: alphanumeric and underscores only.
- No HTML in labels. No semicolons. Double-quoted string labels.
- No invented classDef classes. Use only classes from the active governance profile.
- Every subgraph must close with end.
- Full diagram every time. No fragments or diffs.
```

---

## Relationship to the Governance Profile

The contract governs *structure*. The governance profile governs *appearance*. Together they define what a correctly produced Mermaid diagram looks like:

- **Governance profile** — colors, typography, look, renderer constraints, classDef palette
- **Diagram output contract** — block structure, node IDs, label syntax, styling discipline, update/repair rules

A diagram that satisfies both is safe to paste directly into any supported renderer without further modification.
