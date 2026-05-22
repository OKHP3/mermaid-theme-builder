---
name: okhp3-mermaid-theme-builder
description: Apply reusable color palettes and visual governance to Mermaid diagram code. Use this skill when the user wants to style, theme, color, or brand a Mermaid diagram; when they want a themeVariables block or %%{init}%% configuration; when they ask for a prompt scaffold that enforces consistent diagram styling for future AI-generated Mermaid; when they want renderer-safe output for GitHub, GitLab, Obsidian, Notion, or Confluence; when they mention Mermaid colors, palettes, CSS variables, diagram cleanup, or on-brand diagrams.
license: MIT
metadata:
  version: "0.3.0"
  author: OverKill Hill P³
  homepage: https://okhp3.github.io/mermaid-theme-builder
  repository: https://github.com/OKHP3/mermaid-theme-builder
  category: diagram-governance
  tags: mermaid, diagram, theme, palette, themeVariables, prompt-scaffold, renderer-profiles
---

# okhp3-mermaid-theme-builder

Visual governance for Mermaid diagram code. Applies brand palettes, generates `%%{init}%%` directives, and produces renderer-aware output for GitHub, GitLab, Obsidian, Notion, Confluence, and the Mermaid CLI.

**Live tool:** https://okhp3.github.io/mermaid-theme-builder  
**Reference files:** `references/`  
**JSON assets:** `assets/`  
**Scripts:** `scripts/` (Node.js only, no external deps)

---

## When to use

- User provides Mermaid code and wants it styled or on-brand
- User asks for a `themeVariables` block or `%%{init}%%` configuration
- User wants a prompt scaffold for AI-generated Mermaid (pre-prompting)
- User specifies a target renderer (GitHub, GitLab, Notion, Obsidian, Confluence, CLI)
- User mentions Mermaid colors, palettes, CSS variables, or diagram cleanup
- User wants to extract the theme from an existing themed diagram

## When NOT to use

- The user wants to render or display the diagram (this skill only produces text output)
- The user is working with a non-Mermaid diagramming tool (Draw.io, Lucidchart, PlantUML, D2)
- The user wants chart data, not diagram styling
- The user is asking about Mermaid syntax or diagram construction (not theming)

---

## 6-Step Workflow

### Step 1 — Identify input

Determine what the user has provided:
- **Raw Mermaid code** → proceed to Step 2
- **Existing themed code** (has `%%{init}%%`) → strip the existing init block, then proceed
- **Code wrapped in Markdown fences** → strip the fences first using `normalize-mermaid.mjs`
- **Natural language request only** → ask for the Mermaid code, or generate a basic fixture from `assets/fixtures/`

### Step 2 — Detect diagram family

Run `detect-diagram.mjs` or apply the keyword table below. The family determines:
- Which `themeVariables` apply (see `references/mermaid-theme-variables.md`)
- Whether `classDef` / `linkStyle` / subgraph style patterns are available
- Style strategy: `full` | `partial` | `limited`

**Family keyword table (first match wins):**

| Keyword | Family | Style strategy |
|---|---|---|
| `flowchart`, `graph` | flowchart | full |
| `sequenceDiagram` | sequenceDiagram | partial |
| `classDiagram` | classDiagram | partial |
| `stateDiagram`, `stateDiagram-v2` | stateDiagram | partial |
| `erDiagram` | erDiagram | partial |
| `gantt` | gantt | limited |
| `pie` | pie | limited |
| `gitGraph` | gitGraph | limited |
| `mindmap` | mindmap | limited |
| `timeline` | timeline | limited |
| `journey` | journey | limited |
| `quadrantChart` | quadrantChart | partial |
| `requirementDiagram` | requirementDiagram | partial |
| `c4Context`, `c4Container`, `c4Component`, `c4Dynamic`, `c4Deployment` | c4Diagram | partial |
| `block-beta` | block | partial |
| `sankey-beta` | sankey | partial |
| `xychart-beta` | xychart | partial |
| `zenuml` | zenuml | partial |
| `architectureBeta` | architectureBeta | partial |
| `kanban` | kanban | partial |
| `packet` | packet | limited |

### Step 3 — Select palette

Load `assets/palettes.json` or choose from the table below. Match palette to use case:

| Palette ID | Name | Best for |
|---|---|---|
| `overkill-hill` | OverKill Hill P³ | Technical, architecture, AI tooling, executive decks |
| `askjamie` | AskJamie | Support flows, helpdesk, user guidance, friendly AI |
| `glee-fully` | Glee-fully | Personal productivity, family-friendly, consumer-facing |
| `ocean-depth` | Ocean Depth | Technical docs, clean professional diagrams |
| `forest-sage` | Forest Sage | Process flows, calm/approachable content |
| `slate-ember` | Slate Ember | Architecture, high-contrast dark mode |
| `violet-mist` | Violet Mist | Product, UX, creative flows |

### Step 4 — Generate init block

Construct the `%%{init}%%` directive using this exact format:

```
%%{init: {"theme": "base", "themeVariables": {VARIABLES_JSON}}}%%
```

Rules:
- `"theme": "base"` is always required — do not use `"default"`, `"dark"`, `"forest"`, or `"neutral"`
- All string values must be double-quoted
- `fontFamily` must be the last variable in the object (or grouped separately)
- Do not add a trailing comma after the last variable
- Strip any existing `%%{init}%%` block from the input code before prepending

**Example (Ocean Depth, flowchart):**
```
%%{init: {"theme": "base", "themeVariables": {"primaryColor": "#1a4f8a", "primaryTextColor": "#ffffff", "primaryBorderColor": "#0d3060", "lineColor": "#2563eb", "secondaryColor": "#0ea5e9", "tertiaryColor": "#e0f2fe", "background": "#f0f9ff", "mainBkg": "#dbeafe", "nodeBorder": "#1d4ed8", "clusterBkg": "#e0f2fe", "titleColor": "#1e3a5f", "edgeLabelBackground": "#f0f9ff", "fontFamily": "DM Sans, system-ui, sans-serif"}}}%%
```

### Step 5 — Produce styled output

Select the appropriate output mode (see Output Modes section). Prepend the init directive. For `full` strategy families (flowchart), optionally append a classDef library block.

### Step 6 — Apply renderer awareness

Check `assets/renderer-profiles.json` or `references/renderer-profiles.md` for the target renderer.
Profile fields use the following names (matching `renderer-profiles.json` keys):
- If `supportsInitDirective: "none"` → warn and offer Format B (YAML frontmatter) instead
- If `supportsThemeVariables: "partial"` → note that some variables may be ignored
- If `supportsCSSInjection: "none"` → omit CSS injection suggestions
- If `supportsCustomFonts: "none"` → fall back to system font stack

---

## Output Modes

### Format A — Styled Mermaid Code

Minimal format. Just the `%%{init}%%` directive prepended to the diagram. Use when the user wants clean, paste-ready code.

```
%%{init: {"theme": "base", "themeVariables": {...}}}%%
<original diagram code>
```

### Format B — YAML Frontmatter (Mermaid v10.5+)

Use when the target renderer prefers frontmatter over `%%{init}%%`, or when init directive support is `none` or `partial`.

```
---
config:
  theme: base
  themeVariables:
    primaryColor: "#..."
    primaryTextColor: "#..."
    ...
---
<original diagram code>
```

### Format C — Prompt Scaffold (LLM Pre-prompting)

Full Markdown document for pasting into a system prompt or user message before asking an LLM to generate Mermaid. See `references/prompt-scaffold-patterns.md` for 8 parameterized templates.

Structure:
```markdown
## Mermaid Diagram Style Rules

**Palette:** {PALETTE_NAME}
**Theme base:** base (always)

### Required %%{init}%% block

Prepend this exact block to every Mermaid diagram you generate:

\`\`\`
%%{init: {"theme": "base", "themeVariables": {THEME_VARIABLES_JSON}}}%%
\`\`\`

### Diagram family rules
...
### Renderer constraints (if applicable)
...
```

### Format D — Markdown Bootstrap

Full Markdown document for publishing a themed diagram with attribution and usage notes. Includes the styled code in a fenced code block, renderer warning, and attribution.

### Format E — Extract + Re-theme

When given existing themed code:
1. Extract the current `%%{init}%%` or frontmatter block
2. Identify current palette (match hex values against `assets/palettes.json`)
3. Apply the new palette, replacing the old init block
4. Return Format A output

---

## Renderer Compatibility Summary

| Renderer | `%%{init}%%` | themeVars | classDef | CSS inject | Custom fonts | Risk |
|---|---|---|---|---|---|---|
| mermaid.live | Full | Full | Full | Full | Full | Low |
| GitHub | Full | Full | Full | None | None | Low |
| GitLab | Full | Full | Full | None | None | Low |
| Notion | Partial | Partial | Full | None | None | Medium |
| Obsidian | Full | Full | Full | Partial | Partial | Low |
| Confluence | Partial | Partial | Partial | None | None | High |
| CLI (mmdc) | Full | Full | Full | Full | Full | Low |

Full compatibility matrix and renderer-specific workarounds: `references/renderer-profiles.md`

---

## Output Rules

1. **Never invent themeVariable names.** Only use names present in `assets/palettes.json` or documented at mermaid.js.org/config/theming.html.
2. **Never claim a renderer supports a feature it does not.** Always check `assets/renderer-profiles.json` first.
3. **`"theme": "base"` is always required.** No exceptions.
4. **Strip existing init blocks before prepending.** Never double-apply.
5. **Font family must be a valid CSS font stack string.** Always quoted.
6. **Hex values must match `/#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/`.** No RGB, HSL, or named colors in themeVariables.
7. **`fontSize` must end in `px`.** Example: `"14px"`, not `14` or `"14"`.
8. **No unrelated employer branding or corporate entity names** in any skill output. See `references/scope-firewall.md`.
9. **No hallucinated palette names.** Only the 7 palettes in `assets/palettes.json` are canonical.

---

## References

- `references/palette-registry.md` — All 7 palettes with full variable tables
- `references/mermaid-theme-variables.md` — Variable reference by diagram family
- `references/renderer-profiles.md` — Full 7-renderer compatibility matrix
- `references/output-format-contract.md` — Formal spec for all 5 output formats
- `references/prompt-scaffold-patterns.md` — 8 parameterized scaffold templates
- `references/scope-firewall.md` — What must never appear in skill output

## Scripts

Run with `node scripts/<name>.mjs` (no external dependencies required):

- `scripts/detect-diagram.mjs` — Detect diagram family from code
- `scripts/normalize-mermaid.mjs` — Strip Markdown fences and prose wrappers
- `scripts/apply-theme.mjs` — Apply a palette to diagram code
- `scripts/validate-theme.mjs` — Validate a themed diagram's init block
- `scripts/generate-prompt-scaffold.mjs` — Generate a prompt scaffold document

## Assets

- `assets/palettes.json` — 7 palettes with all themeVariable tokens (from source of truth)
- `assets/renderer-profiles.json` — 7 renderer profiles (from source of truth)
- `assets/theme-variable-map.json` — 21 core variables with semantic roles and format rules
- `assets/fixtures/*.mmd` — 5 clean diagram fixtures for testing

## Tests

Run with `node --test tests/*.test.mjs`:

- `tests/detect-diagram.test.mjs`
- `tests/apply-theme.test.mjs`
- `tests/validate-theme.test.mjs`
