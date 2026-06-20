# Microsoft 365 / Loop / Copilot Renderer Profile

## Purpose

This document covers how to target Microsoft 365 (Loop, Copilot, Teams) when generating Mermaid diagrams. It functions as a renderer profile — documenting known constraints, workarounds, and reusable prompt templates for producing on-brand, renderer-safe diagrams in M365 environments.

For generating your own branded theme block, use Mermaid Theme Builder to compose a governance profile and export the result as a Prompt Scaffold or Markdown Bootstrap. The tool generates the `%%{init}%%` directive and classDef blocks for any palette — including ones you customize to match your own brand or team conventions.

---

## Part 1: Generate Your Theme Block

Rather than using a hardcoded color palette, generate your own using Mermaid Theme Builder:

1. Open the **Compose** tab at the live tool.
2. Select a starting palette or create a custom one from scratch.
3. Set **Look** to **Classic** — Neo and Hand-Drawn are not reliably supported in Loop.
4. In the renderer selector, choose **Microsoft 365 / Loop / Copilot**.
5. Export via **Prompt Scaffold** — this produces the `%%{init}%%` directive block, classDef set, and rendering rules tailored to your palette and the M365 renderer constraints.
6. Paste the exported Prompt Scaffold into the thread opener template in Part 2 below, replacing the `[PASTE YOUR THEME BLOCK FROM MERMAID THEME BUILDER HERE]` placeholder.

### M365 / Loop Renderer Constraints

Before generating, be aware of what Loop does and does not support:

| Feature | Status | Notes |
|---|---|---|
| `%%{init}%%` directive | Partial | Supported; prefer over YAML frontmatter |
| YAML frontmatter (`---`) | Partial | May not be processed reliably in all Loop versions |
| `themeVariables` | Partial | Most apply; some variables may be ignored |
| `classDef` node styling | Partial | Works for supported diagram families |
| CSS injection | No | Blocked — do not use `<style>` blocks |
| Custom fonts | No | Platform applies Segoe UI / Calibri / Arial stack |
| Neo look | No | Not reliably available — use Classic |
| Hand-Drawn look | No | Not reliably available — use Classic |
| Beta diagram families | Partial | Avoid — rendering support varies by Loop version |
| Experimental families | No | Do not use — rendering not guaranteed |

---

## Part 2: Reusable Prompt Templates

### Template A — Thread Opener (Iterative Build)

Use this to start a Copilot chat thread whose purpose is to iteratively develop a Mermaid diagram.

> **Paste this as the first message in the thread:**

```
This thread's purpose is to create and iteratively refine a Mermaid diagram.

RENDERING RULES (apply to every diagram you generate in this thread):

1. Begin every diagram with this block — do NOT modify it:

[PASTE YOUR THEME BLOCK FROM MERMAID THEME BUILDER HERE]

2. Do NOT invent additional colors, gradients, or style overrides.
3. Do NOT use HTML tags (no <br>, no <b>, no <i>) inside node labels.
4. Do NOT use semicolons as line terminators.
5. Use double quotes only for string labels. Never use backticks or single quotes in labels.
6. Node IDs must contain only alphanumeric characters and underscores.
7. Every subgraph must have both a label and an explicit end keyword.
8. When I request changes, regenerate the FULL diagram — never output partial fragments or diffs.
9. Wrap output in a single fenced code block marked as mermaid.
10. Use look: classic — do not set look: neo or look: handDrawn.

The diagram type is: [SPECIFY: flowchart TD / sequenceDiagram / classDiagram / etc.]

Topic: [DESCRIBE THE SUBJECT]
```

### Template B — Drop-In Generator (Context-Based)

Use this when a chat thread already has content and you want to generate a diagram from that context.

> **Paste this into an existing thread:**

```
Based on the content discussed in this thread, generate a Mermaid [flowchart TD / sequenceDiagram / etc.] diagram.

MANDATORY RENDERING RULES:

1. Start with this exact block — include it verbatim, do not modify:

[PASTE YOUR THEME BLOCK FROM MERMAID THEME BUILDER HERE]

2. Do NOT add colors, styles, or gradients beyond what the block defines.
3. No HTML tags in labels. No semicolons. Node IDs alphanumeric/underscores only.
4. Use double quotes for all string labels.
5. Output as a single mermaid fenced code block.
6. Use look: classic — do not set look: neo or look: handDrawn.
7. Verify before output: every subgraph has an end keyword, no orphan nodes, no duplicate IDs.
```

### Template C — Init Directive Fallback (If YAML Frontmatter Fails)

If YAML frontmatter fails to render in Loop, use this alternate version in either Template A or B. Replace the block instruction with:

```
1. Start the diagram with this exact init directive on the very first line — include it verbatim:

[PASTE THE %%{init}%%  DIRECTIVE LINE FROM YOUR MERMAID THEME BUILDER EXPORT HERE]

2. The diagram type declaration must immediately follow the init directive on the next line.
3. No blank line between the init directive and the diagram type.
```

---

## Part 3: Available themeVariables Reference

From the official Mermaid v11.13 documentation. Only hex values work — named colors (e.g. "red") are ignored.

### General Variables

| Variable | Default | Notes |
|----------|---------|-------|
| `darkMode` | false | Set true for dark backgrounds |
| `background` | #f4f4f4 | Page/canvas background |
| `fontFamily` | trebuchet ms, verdana, arial | Font stack (ignored in Loop — platform overrides) |
| `fontSize` | 16px | Base font size |
| `primaryColor` | #fff4dd | Main node fill — all other colors derive from this |
| `primaryTextColor` | calculated | Text on primary nodes |
| `primaryBorderColor` | calculated | Border on primary nodes |
| `secondaryColor` | calculated | Second-tier node fill |
| `secondaryTextColor` | calculated | Text on secondary nodes |
| `secondaryBorderColor` | calculated | Border on secondary nodes |
| `tertiaryColor` | calculated | Third-tier node fill |
| `tertiaryTextColor` | calculated | Text on tertiary nodes |
| `tertiaryBorderColor` | calculated | Border on tertiary nodes |
| `lineColor` | calculated | Edge/connector lines |
| `textColor` | calculated | General text over background |
| `mainBkg` | calculated | Flowchart object backgrounds |
| `noteBkgColor` | #fff5ad | Note backgrounds |
| `noteTextColor` | #333 | Note text |
| `noteBorderColor` | calculated | Note borders |
| `errorBkgColor` | tertiaryColor | Syntax error background |
| `errorTextColor` | tertiaryTextColor | Syntax error text |

### Flowchart-Specific

| Variable | Default |
|----------|---------|
| `nodeBorder` | primaryBorderColor |
| `clusterBkg` | tertiaryColor |
| `clusterBorder` | tertiaryBorderColor |
| `defaultLinkColor` | lineColor |
| `titleColor` | tertiaryTextColor |
| `edgeLabelBackground` | calculated from secondaryColor |
| `nodeTextColor` | primaryTextColor |

### Sequence Diagram-Specific

| Variable | Default |
|----------|---------|
| `actorBkg` | mainBkg |
| `actorBorder` | primaryBorderColor |
| `actorTextColor` | primaryTextColor |
| `actorLineColor` | actorBorder |
| `signalColor` | textColor |
| `signalTextColor` | textColor |
| `labelBoxBkgColor` | actorBkg |
| `labelBoxBorderColor` | actorBorder |
| `labelTextColor` | actorTextColor |
| `loopTextColor` | actorTextColor |
| `activationBorderColor` | calculated from secondaryColor |
| `activationBkgColor` | secondaryColor |
| `sequenceNumberColor` | calculated from lineColor |

### Pie Chart-Specific

Variables `pie1` through `pie12` control section fills. `pieTitleTextSize`, `pieSectionTextSize`, `pieLegendTextSize` control text sizing. `pieStrokeColor`, `pieStrokeWidth`, `pieOpacity` control section borders and opacity.

### State Diagram

| Variable | Default |
|----------|---------|
| `labelColor` | primaryTextColor |
| `altBackground` | tertiaryColor |

### User Journey

Variables `fillType0` through `fillType7` control alternating section fills.

---

## Part 4: Common Copilot Mermaid Errors to Watch For

When Copilot generates Mermaid code, scan the output for these before pasting into Loop or Mermaid Live:

| Error | What It Looks Like | Fix |
|-------|-------------------|-----|
| HTML in labels | `A["Line 1<br>Line 2"]` | Remove `<br>`, use shorter single-line labels |
| Semicolons | `A --> B;` | Remove the semicolons |
| Inline style overrides | `style A fill:#ff0000` | Remove — the theme handles this |
| Single-quoted labels | `A['my label']` | Change to `A["my label"]` |
| Special characters in IDs | `my-node`, `node.1` | Change to `my_node`, `node_1` |
| Missing subgraph end | `subgraph Title` without `end` | Add `end` keyword |
| Duplicate node IDs | Two nodes both named `A` | Make unique: `A1`, `A2` |
| Empty init + frontmatter | Both `%%{init}%%` and `---` present | Use only one |
| Backtick labels | `` A[`label`] `` | Change to `A["label"]` |
| classDef overriding theme | `classDef x fill:#random` | Remove unless intentional accent |
| Non-Classic look set | `look: neo` or `look: handDrawn` | Remove or change to `look: classic` for Loop |

See `docs/diagram-output-contract.md` for the complete structural rules that govern all AI-generated Mermaid output.

---

## Part 5: Customizing the Palette

To build a palette for Loop using Mermaid Theme Builder:

1. Open the Compose tab and select a starting palette or press **+ New**.
2. Set **Look** to **Classic**.
3. In the renderer selector, choose **Microsoft 365 / Loop / Copilot**.
4. Adjust color tokens using the swatch editor — primary, secondary, tertiary, neutral, and accent.
5. Leave `fontFamily` at its default — Loop ignores custom fonts.
6. Preview across Flowchart, Sequence, and Class diagram families to validate the palette reads well.
7. Export via **Prompt Scaffold** or **Copy Bootstrap** to get the `%%{init}%%` block.

The `base` theme auto-calculates any variables you leave unset, deriving them from `primaryColor`. At minimum, set `primaryColor`, `primaryTextColor`, and `lineColor` — but explicitly setting more gives tighter control and prevents the engine from generating colors that clash.

---

## Sources

- Mermaid Theme Configuration: https://mermaid.ai/open-source/config/theming.html
- Mermaid Configuration (Frontmatter): https://mermaid.ai/open-source/config/configuration.html
- Mermaid Syntax Reference: https://mermaid.js.org/intro/syntax-reference.html
- Mermaid Live Editor: https://mermaid.live
