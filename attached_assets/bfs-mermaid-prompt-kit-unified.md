# BFS Mermaid Prompt Kit — Unified Style + Reusable Prompts

## Purpose

Reusable prompt components for Microsoft 365 Copilot that produce visually consistent, brand-aligned Mermaid diagrams. Functions like a PowerPoint template — same styling, different content. Every diagram generated from these prompts shares a common visual grammar rooted in BFS brand standards.

---

## Part 1: Master Color Palette

| Name | Hex | Role |
|------|-----|------|
| Builders Blue | `#00205B` | Primary brand — borders, text on light fills, major subgraph strokes |
| Medium Blue | `#003087` | Secondary brand — strokes on light-blue fills, tertiary subgraph strokes |
| Deep Blue | `#002F86` | Edge lines, cluster borders, title text, canvas-level line color |
| Accent Blue | `#2F7FE1` | Emphasis nodes, highlights (use sparingly) |
| Accent Blue Stroke | `#1F6FCF` | Paired stroke for Accent Blue fills |
| Support Blue Med | `#B3C1DB` | UI element fills, secondary node backgrounds, Tier 2 subgraph fills |
| Support Blue Light | `#D6E5F9` | Guidance/overlay fills, tertiary node backgrounds, scope markers |
| Support Gray Light | `#D0D0CE` | BFS-owned context fills, boundary nodes, Tier 1/3 subgraph fills |
| Panel Gray | `#F2F2F2` | Cluster interior backgrounds (lighter than canvas) |
| Canvas Gray | `#E7E6E6` | Overall diagram background |
| White | `#FFFFFF` | Default node fill, gate/control/log nodes, edge label backgrounds |
| Border Gray | `#A7A8A9` | Gate borders, control borders, dashed strokes |
| Medium Gray | `#75787B` | Boundary strokes, identity/audit subgraph strokes |
| Slate | `#515151` | Dark fill for infrastructure/database emphasis nodes |
| Slate Stroke | `#3A3A3A` | Paired stroke for Slate fills |
| Text Gray | `#4D4D4D` | Primary body text on light backgrounds |
| Dark Text | `#333333` | General text, themeVariables default text |
| BFS Red | `#C8102E` | Out-of-scope, exclusion, warning (never decorative) |
| Red Stroke | `#9F0D24` | Paired stroke for BFS Red fills |

### Design Rules

- White is the default node fill — colored fills are applied via classDef to signal semantic meaning
- Blue depth signals ownership — deeper blue = platform/system; lighter blue = guidance/overlay; gray = BFS-owned
- Dashed strokes signal conditionality — gates use dash patterns; open questions use wider dashes
- Red is reserved for exclusion/warning only
- Stroke width creates hierarchy — 1px chrome, 1.4–1.5px standard, 1.8–2px emphasis
- White text on dark fills; dark text on light fills
- Edge labels always get white backgrounds
- Canvas is warm gray (#E7E6E6), not white

---

## Part 2: Theme Blocks

Two formats provided. YAML frontmatter is the current Mermaid standard (v10.5+). Init directive is deprecated but may render more reliably in Microsoft Loop.

### Option A: YAML Frontmatter (Preferred)

```
---
config:
  theme: base
  look: classic
  themeVariables:
    background: "#E7E6E6"
    fontFamily: "Segoe UI, Arial, Helvetica, sans-serif"
    fontSize: "14px"
    textColor: "#333333"
    lineColor: "#002F86"
    clusterBorder: "#002F86"
    titleColor: "#002F86"
    primaryColor: "#FFFFFF"
    primaryBorderColor: "#A7A8A9"
    primaryTextColor: "#333333"
    secondaryColor: "#B3C1DB"
    secondaryBorderColor: "#00205B"
    secondaryTextColor: "#00205B"
    tertiaryColor: "#E7E6E6"
    tertiaryBorderColor: "#75787B"
    tertiaryTextColor: "#4D4D4D"
    edgeLabelBackground: "#FFFFFF"
    clusterBkg: "#F2F2F2"
    mainBkg: "#FFFFFF"
    nodeBorder: "#A7A8A9"
    nodeTextColor: "#333333"
    noteBkgColor: "#D6E5F9"
    noteTextColor: "#00205B"
    noteBorderColor: "#003087"
    actorBkg: "#FFFFFF"
    actorBorder: "#00205B"
    actorTextColor: "#00205B"
    signalColor: "#333333"
    labelBoxBkgColor: "#B3C1DB"
    labelBoxBorderColor: "#00205B"
---
```

### Option B: Init Directive (Loop Fallback)

```
%%{init: {"theme":"base","themeVariables":{"background":"#E7E6E6","fontFamily":"Segoe UI, Arial, Helvetica, sans-serif","fontSize":"14px","textColor":"#333333","lineColor":"#002F86","clusterBorder":"#002F86","titleColor":"#002F86","primaryColor":"#FFFFFF","primaryBorderColor":"#A7A8A9","primaryTextColor":"#333333","secondaryColor":"#B3C1DB","secondaryBorderColor":"#00205B","secondaryTextColor":"#00205B","tertiaryColor":"#E7E6E6","tertiaryBorderColor":"#75787B","tertiaryTextColor":"#4D4D4D","edgeLabelBackground":"#FFFFFF","clusterBkg":"#F2F2F2","mainBkg":"#FFFFFF","nodeBorder":"#A7A8A9","nodeTextColor":"#333333","noteBkgColor":"#D6E5F9","noteTextColor":"#00205B","noteBorderColor":"#003087","actorBkg":"#FFFFFF","actorBorder":"#00205B","actorTextColor":"#00205B","signalColor":"#333333","labelBoxBkgColor":"#B3C1DB","labelBoxBorderColor":"#00205B"}}}%%
```

---

## Part 3: classDef Library

Include these after the diagram type declaration. Select only the classes needed for a given diagram — do not include unused classes.

### Structural / Contextual Nodes

```
classDef primary     fill:#D0D0CE,stroke:#00205B,stroke-width:1.5px,color:#4D4D4D
classDef secondary   fill:#B3C1DB,stroke:#00205B,stroke-width:1.5px,color:#00205B
classDef tertiary    fill:#D6E5F9,stroke:#003087,stroke-width:1.5px,color:#00205B
classDef platform    fill:#FFFFFF,stroke:#00205B,stroke-width:1.5px,color:#4D4D4D
classDef boundary    fill:#D0D0CE,stroke:#75787B,stroke-width:1.5px,color:#4D4D4D
```

### Actors / Entry Points

```
classDef actor       fill:#FFFFFF,stroke:#00205B,stroke-width:1.5px,color:#00205B
```

### Gates / Controls / Logs (Chrome)

```
classDef gate        fill:#FFFFFF,stroke:#A7A8A9,stroke-width:1px,stroke-dasharray:4 3,color:#4D4D4D
classDef control     fill:#FFFFFF,stroke:#A7A8A9,stroke-width:1px,color:#4D4D4D
classDef log         fill:#FFFFFF,stroke:#A7A8A9,stroke-width:1px,color:#4D4D4D
classDef question    fill:#FFFFFF,stroke:#00205B,stroke-width:1px,stroke-dasharray:6 4,color:#00205B
```

### Emphasis / Highlight

```
classDef accent      fill:#2F7FE1,stroke:#1F6FCF,stroke-width:1.4px,color:#FFFFFF
classDef deepBlue    fill:#002F86,stroke:#002F86,stroke-width:1.4px,color:#FFFFFF
classDef slate       fill:#515151,stroke:#3A3A3A,stroke-width:1.4px,color:#FFFFFF
classDef dbStrong    stroke-width:1.8px
```

### Scope / Signal

```
classDef scope       fill:#D6E5F9,stroke:#00205B,stroke-width:2px,color:#00205B
classDef outOfScope  fill:#FFFFFF,stroke:#C8102E,stroke-width:2px,color:#C8102E
classDef redDash     fill:#C8102E,stroke:#9F0D24,stroke-dasharray:3 2,stroke-width:1.5px,color:#FFFFFF
```

---

## Part 4: Subgraph Styling Tiers

Apply using inline `style` statements after each subgraph block.

### Tier 1 — Major context boundary
```
style SUBGRAPH_ID fill:#D0D0CE,stroke:#00205B,stroke-width:2px,color:#4D4D4D
```

### Tier 2 — System/tenant boundary
```
style SUBGRAPH_ID fill:#B3C1DB,stroke:#00205B,stroke-width:2px,color:#00205B
```

### Tier 2b — Lighter system groups
```
style SUBGRAPH_ID fill:#D6E5F9,stroke:#003087,stroke-width:2px,color:#00205B
```

### Tier 3 — Interior grouping
```
style SUBGRAPH_ID fill:#D0D0CE,stroke:#75787B,stroke-width:2px,color:#4D4D4D
```

### Tier 3b — Chrome/neutral groups
```
style SUBGRAPH_ID fill:#FFFFFF,stroke:#A7A8A9,stroke-width:2px,color:#4D4D4D
```

### Tier 4 — Environment panels
```
style SUBGRAPH_ID fill:#F2F2F2,stroke:#002F86,stroke-width:1.5px,color:#002F86
```

---

## Part 5: Edge Styling

| Syntax | Usage |
|--------|-------|
| `-->` | Primary flow, data movement, control signals |
| `-.->` | Optional paths, provisioning, log export, boundary anchors |
| `-->\|Label\|` | Named solid relationships |
| `-. "Label" .->` | Named optional/guidance flows |
| `linkStyle default stroke:#002F86,stroke-width:1.3px` | Brand-default edge color (optional; themeVariables lineColor handles this if init block is present) |

---

## Part 6: Reusable Prompt Templates

### Template A — Thread Opener (Iterative Build)

Start a Copilot chat thread whose purpose is to iteratively develop a Mermaid diagram.

> **Paste as the first message:**

```
This thread's purpose is to create and iteratively refine a Mermaid diagram.

RENDERING RULES — apply to every diagram you generate in this thread:

1. Begin every diagram with this exact YAML frontmatter. Include it verbatim. Do NOT modify any values:

---
config:
  theme: base
  look: classic
  themeVariables:
    background: "#E7E6E6"
    fontFamily: "Segoe UI, Arial, Helvetica, sans-serif"
    fontSize: "14px"
    textColor: "#333333"
    lineColor: "#002F86"
    clusterBorder: "#002F86"
    titleColor: "#002F86"
    primaryColor: "#FFFFFF"
    primaryBorderColor: "#A7A8A9"
    primaryTextColor: "#333333"
    secondaryColor: "#B3C1DB"
    secondaryBorderColor: "#00205B"
    secondaryTextColor: "#00205B"
    tertiaryColor: "#E7E6E6"
    tertiaryBorderColor: "#75787B"
    tertiaryTextColor: "#4D4D4D"
    edgeLabelBackground: "#FFFFFF"
    clusterBkg: "#F2F2F2"
    mainBkg: "#FFFFFF"
    nodeBorder: "#A7A8A9"
    nodeTextColor: "#333333"
---

2. Use ONLY these classDef declarations for node styling. Select the ones relevant to the diagram — do not include unused classes. Do NOT invent additional colors, fills, gradients, or style overrides:

classDef primary     fill:#D0D0CE,stroke:#00205B,stroke-width:1.5px,color:#4D4D4D
classDef secondary   fill:#B3C1DB,stroke:#00205B,stroke-width:1.5px,color:#00205B
classDef tertiary    fill:#D6E5F9,stroke:#003087,stroke-width:1.5px,color:#00205B
classDef platform    fill:#FFFFFF,stroke:#00205B,stroke-width:1.5px,color:#4D4D4D
classDef boundary    fill:#D0D0CE,stroke:#75787B,stroke-width:1.5px,color:#4D4D4D
classDef actor       fill:#FFFFFF,stroke:#00205B,stroke-width:1.5px,color:#00205B
classDef gate        fill:#FFFFFF,stroke:#A7A8A9,stroke-width:1px,stroke-dasharray:4 3,color:#4D4D4D
classDef control     fill:#FFFFFF,stroke:#A7A8A9,stroke-width:1px,color:#4D4D4D
classDef log         fill:#FFFFFF,stroke:#A7A8A9,stroke-width:1px,color:#4D4D4D
classDef question    fill:#FFFFFF,stroke:#00205B,stroke-width:1px,stroke-dasharray:6 4,color:#00205B
classDef accent      fill:#2F7FE1,stroke:#1F6FCF,stroke-width:1.4px,color:#FFFFFF
classDef deepBlue    fill:#002F86,stroke:#002F86,stroke-width:1.4px,color:#FFFFFF
classDef slate       fill:#515151,stroke:#3A3A3A,stroke-width:1.4px,color:#FFFFFF
classDef scope       fill:#D6E5F9,stroke:#00205B,stroke-width:2px,color:#00205B
classDef outOfScope  fill:#FFFFFF,stroke:#C8102E,stroke-width:2px,color:#C8102E
classDef redDash     fill:#C8102E,stroke:#9F0D24,stroke-dasharray:3 2,stroke-width:1.5px,color:#FFFFFF

3. Style subgraphs with inline style statements using ONLY these patterns:
   - Major boundary:   fill:#D0D0CE,stroke:#00205B,stroke-width:2px,color:#4D4D4D
   - System tenant:    fill:#B3C1DB,stroke:#00205B,stroke-width:2px,color:#00205B
   - Light system:     fill:#D6E5F9,stroke:#003087,stroke-width:2px,color:#00205B
   - Interior group:   fill:#D0D0CE,stroke:#75787B,stroke-width:2px,color:#4D4D4D
   - Chrome group:     fill:#FFFFFF,stroke:#A7A8A9,stroke-width:2px,color:#4D4D4D
   - Environment:      fill:#F2F2F2,stroke:#002F86,stroke-width:1.5px,color:#002F86

4. Do NOT use HTML tags (no <br>, <b>, <i>) inside node labels.
5. Do NOT use semicolons as line terminators.
6. Use double quotes only for string labels.
7. Node IDs: alphanumeric characters and underscores only.
8. Every subgraph must have both a label and an explicit end keyword.
9. When I request changes, regenerate the FULL diagram — never output partial fragments or diffs.
10. Wrap output in a single fenced code block marked as mermaid.

The diagram type is: [SPECIFY: flowchart TD / flowchart LR / sequenceDiagram / classDiagram / stateDiagram / etc.]

Topic: [DESCRIBE THE SUBJECT]
```

---

### Template B — Drop-In Generator (Context-Based)

Paste into an existing thread to generate a diagram from conversation context.

> **Paste into an existing thread:**

```
Based on the content discussed in this thread, generate a Mermaid [flowchart TD / flowchart LR / sequenceDiagram / etc.] diagram.

MANDATORY RENDERING RULES:

1. Start with this exact YAML frontmatter — include verbatim, do not modify:

---
config:
  theme: base
  look: classic
  themeVariables:
    background: "#E7E6E6"
    fontFamily: "Segoe UI, Arial, Helvetica, sans-serif"
    fontSize: "14px"
    textColor: "#333333"
    lineColor: "#002F86"
    clusterBorder: "#002F86"
    titleColor: "#002F86"
    primaryColor: "#FFFFFF"
    primaryBorderColor: "#A7A8A9"
    primaryTextColor: "#333333"
    secondaryColor: "#B3C1DB"
    secondaryBorderColor: "#00205B"
    secondaryTextColor: "#00205B"
    tertiaryColor: "#E7E6E6"
    tertiaryBorderColor: "#75787B"
    tertiaryTextColor: "#4D4D4D"
    edgeLabelBackground: "#FFFFFF"
    clusterBkg: "#F2F2F2"
    mainBkg: "#FFFFFF"
    nodeBorder: "#A7A8A9"
    nodeTextColor: "#333333"
---

2. Use ONLY these classDef declarations (include only the ones relevant to the diagram):

classDef primary     fill:#D0D0CE,stroke:#00205B,stroke-width:1.5px,color:#4D4D4D
classDef secondary   fill:#B3C1DB,stroke:#00205B,stroke-width:1.5px,color:#00205B
classDef tertiary    fill:#D6E5F9,stroke:#003087,stroke-width:1.5px,color:#00205B
classDef platform    fill:#FFFFFF,stroke:#00205B,stroke-width:1.5px,color:#4D4D4D
classDef boundary    fill:#D0D0CE,stroke:#75787B,stroke-width:1.5px,color:#4D4D4D
classDef actor       fill:#FFFFFF,stroke:#00205B,stroke-width:1.5px,color:#00205B
classDef gate        fill:#FFFFFF,stroke:#A7A8A9,stroke-width:1px,stroke-dasharray:4 3,color:#4D4D4D
classDef control     fill:#FFFFFF,stroke:#A7A8A9,stroke-width:1px,color:#4D4D4D
classDef log         fill:#FFFFFF,stroke:#A7A8A9,stroke-width:1px,color:#4D4D4D
classDef question    fill:#FFFFFF,stroke:#00205B,stroke-width:1px,stroke-dasharray:6 4,color:#00205B
classDef accent      fill:#2F7FE1,stroke:#1F6FCF,stroke-width:1.4px,color:#FFFFFF
classDef deepBlue    fill:#002F86,stroke:#002F86,stroke-width:1.4px,color:#FFFFFF
classDef slate       fill:#515151,stroke:#3A3A3A,stroke-width:1.4px,color:#FFFFFF
classDef scope       fill:#D6E5F9,stroke:#00205B,stroke-width:2px,color:#00205B
classDef outOfScope  fill:#FFFFFF,stroke:#C8102E,stroke-width:2px,color:#C8102E
classDef redDash     fill:#C8102E,stroke:#9F0D24,stroke-dasharray:3 2,stroke-width:1.5px,color:#FFFFFF

3. Style subgraphs using ONLY these fill/stroke patterns:
   - Major boundary:   fill:#D0D0CE,stroke:#00205B,stroke-width:2px,color:#4D4D4D
   - System tenant:    fill:#B3C1DB,stroke:#00205B,stroke-width:2px,color:#00205B
   - Light system:     fill:#D6E5F9,stroke:#003087,stroke-width:2px,color:#00205B
   - Interior group:   fill:#D0D0CE,stroke:#75787B,stroke-width:2px,color:#4D4D4D
   - Chrome group:     fill:#FFFFFF,stroke:#A7A8A9,stroke-width:2px,color:#4D4D4D
   - Environment:      fill:#F2F2F2,stroke:#002F86,stroke-width:1.5px,color:#002F86

4. Do NOT add colors, fills, styles, or gradients beyond what is defined above.
5. No HTML tags in labels. No semicolons. Node IDs alphanumeric/underscores only.
6. Use double quotes for all string labels.
7. Output as a single mermaid fenced code block.
8. Verify before output: every subgraph has an end keyword, no orphan nodes, no duplicate IDs.
```

---

### Template C — Init Directive Variant (Loop Fallback)

If YAML frontmatter fails to render in Loop, replace instruction 1 in either Template A or B with this:

```
1. Start the diagram with this exact init directive on the very first line — include verbatim:

%%{init: {"theme":"base","themeVariables":{"background":"#E7E6E6","fontFamily":"Segoe UI, Arial, Helvetica, sans-serif","fontSize":"14px","textColor":"#333333","lineColor":"#002F86","clusterBorder":"#002F86","titleColor":"#002F86","primaryColor":"#FFFFFF","primaryBorderColor":"#A7A8A9","primaryTextColor":"#333333","secondaryColor":"#B3C1DB","secondaryBorderColor":"#00205B","secondaryTextColor":"#00205B","tertiaryColor":"#E7E6E6","tertiaryBorderColor":"#75787B","tertiaryTextColor":"#4D4D4D","edgeLabelBackground":"#FFFFFF","clusterBkg":"#F2F2F2","mainBkg":"#FFFFFF","nodeBorder":"#A7A8A9","nodeTextColor":"#333333"}}}%%

The diagram type declaration must immediately follow the init directive on the next line.
```

---

## Part 7: Copilot Error Checklist

Scan Copilot output for these before pasting into Loop or Mermaid Live:

| Error | What It Looks Like | Fix |
|-------|-------------------|-----|
| HTML in labels | `A["Line 1<br>Line 2"]` | Remove `<br>`, use single-line labels |
| Semicolons | `A --> B;` | Remove semicolons |
| Inline style overrides | `style A fill:#ff0000` on individual nodes | Remove — classDef handles node styling |
| Invented classDefs | `classDef custom fill:#random` | Remove — use only the library above |
| Invented colors in subgraph style | `style SUB fill:#8B5CF6` | Replace with nearest tier pattern |
| Single-quoted labels | `A['my label']` | Change to `A["my label"]` |
| Special chars in IDs | `my-node`, `node.1` | Change to `my_node`, `node_1` |
| Missing subgraph end | `subgraph Title` without `end` | Add `end` keyword |
| Duplicate node IDs | Two nodes both named `A` | Make unique: `A1`, `A2` |
| Both init + frontmatter | `%%{init}%%` and `---` both present | Use only one |
| Backtick labels | `` A[`label`] `` | Change to `A["label"]` |

---

## Part 8: Customization Notes

### Swapping the Palette

To adapt this kit for a different brand while keeping the structural logic:

1. Replace Builders Blue / Medium Blue / Deep Blue with your primary brand color at three depths
2. Replace Support Blue Med / Light with two tints of your brand hue
3. Replace Support Gray Light / Panel Gray / Canvas Gray with your neutral scale
4. Keep White, Border Gray, Text Gray, and Dark Text as-is (they're functional, not brand)
5. Replace BFS Red with your exclusion/warning signal color
6. Update all hex values in the frontmatter, init directive, classDef library, and subgraph tier patterns
7. Test in Mermaid Live Editor (mermaid.live) before deploying

### Minimum Viable Theme

If the full classDef library is too much for a given prompt, the themeVariables block alone provides a reasonable baseline. Copilot will apply primaryColor (white), secondaryColor (support blue), and tertiaryColor (canvas gray) automatically to nodes based on their nesting depth. The classDefs add precision on top of that baseline.

### Adding New Classes

If a new diagram needs a semantic category not in the library, derive it from the existing palette — pick a fill from the Master Color Palette table, pair it with the appropriate border and text color following the dark-fill/light-text or light-fill/dark-text rule, and match stroke-width to the hierarchy tier (1px chrome, 1.4–1.5px standard, 2px emphasis).

---

## Sources

- Mermaid Theme Configuration: https://mermaid.ai/open-source/config/theming.html
- Mermaid Configuration (Frontmatter): https://mermaid.ai/open-source/config/configuration.html
- Mermaid Syntax Reference: https://mermaid.js.org/intro/syntax-reference.html
- Mermaid Live Editor: https://mermaid.live
