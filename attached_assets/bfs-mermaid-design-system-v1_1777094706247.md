# BFS Mermaid Design System v1.0

> A portable, AI-consumable visual specification for producing brand-consistent Mermaid diagrams across any platform. Functions as a CSS-like bootstrap — upload to Mermaid.ai projects, paste into any AI chat, or reference as a living standard.
>
> Mermaid version baseline: v11.14.0
> Brand baseline: BFS Light
> Author context: Jamie Hill, OverKill Hill P3
> Last validated: April 2026

---

## 1. Brand Foundation

### 1.1 Color Palette

All values are hex. Mermaid's theming engine does not recognize named colors.

#### Core Brand Blues

| Token | Hex | Semantic Role |
|-------|-----|---------------|
| `brand-navy` | `#00205B` | Primary brand anchor. Borders, text on light fills, subgraph strokes, title color. |
| `brand-medium` | `#003087` | Secondary brand. Strokes on light-blue fills, tertiary subgraph strokes. |
| `brand-deep` | `#002F86` | Edge lines, cluster borders, default link color, canvas-level line color. |
| `brand-accent` | `#307FE2` | Emphasis/highlight nodes. Use sparingly. |
| `brand-electric` | `#2F7FE1` | Interchangeable with accent. Paired stroke: `#1F6FCF`. |

#### Support Blues

| Token | Hex | Semantic Role |
|-------|-----|---------------|
| `blue-medium` | `#B3C1DB` | System/app node fills, secondary backgrounds, Tier 2 subgraph fills. |
| `blue-light` | `#D6E5F9` | AI/overlay/guidance fills, tertiary backgrounds, scope markers. |

#### Grays and Neutrals

| Token | Hex | Semantic Role |
|-------|-----|---------------|
| `gray-support` | `#D0D0CE` | BFS-owned context fills, boundary nodes, Tier 1/3 subgraph fills. |
| `gray-panel` | `#F2F2F2` | Cluster interior backgrounds. Lighter than canvas. |
| `gray-canvas` | `#E7E6E6` | Overall diagram background. |
| `white` | `#FFFFFF` | Default node fill. Gate/control/log nodes. Edge label backgrounds. |
| `gray-border` | `#A7A8A9` | Gate/control borders, dashed strokes, neutral chrome. |
| `gray-medium` | `#75787B` | Boundary strokes, identity/audit subgraph strokes. |
| `gray-slate` | `#515151` | Dark fill for infrastructure/database emphasis. Paired stroke: `#3A3A3A`. |
| `text-mid` | `#4D4D4D` | Primary body text on light backgrounds. |
| `text-dark` | `#333333` | General text. themeVariables default. |

#### Signal

| Token | Hex | Semantic Role |
|-------|-----|---------------|
| `signal-red` | `#C8102E` | Out-of-scope, exclusion, warning, risk. Paired stroke: `#9F0D24`. Never decorative. |

### 1.2 Typography

| Property | Value |
|----------|-------|
| Font Stack | `Segoe UI, Arial, Helvetica, sans-serif` |
| Base Size | `14px` |

### 1.3 Visual Grammar Rules

1. White is the default node fill. Colored fills signal semantic meaning via classDef.
2. Blue depth signals ownership. Deeper blue = platform/system. Lighter blue = guidance/overlay. Gray = BFS-owned context.
3. Dashed strokes signal conditionality. Gates use dash pattern `4 3`. Open questions use `6 4`.
4. Red is reserved for exclusion/warning only.
5. Stroke width creates hierarchy: 1px chrome, 1.4--1.5px standard, 1.8--2px emphasis.
6. White text on dark fills. Dark text on light fills.
7. Edge labels always get white backgrounds for readability.
8. Canvas is warm gray (`#E7E6E6`), not white.

---

## 2. Diagram Type Registry

Mermaid v11.14.0 supports 25 diagram types. Each has a different styling surface. This registry documents what each type can control and how BFS brand rules apply.

### Styling Surface Legend

| Capability | Meaning |
|-----------|---------|
| `themeVars` | Accepts themeVariables in frontmatter/init |
| `classDef` | Supports classDef + class assignment |
| `linkStyle` | Supports linkStyle for edge styling |
| `subgraph` | Supports subgraph containers with style fallback |
| `nodeShape` | Supports multiple node shapes |
| `look` | Supports look parameter (classic, handDrawn, neo) |
| `layout` | Supports layout parameter (dagre, elk) |

### 2.1 Full-Control Diagram Types

These types support the full BFS styling surface. Use the complete classDef library and themeVariables contract.

| Type | Declaration | Direction | Capabilities | BFS Coverage |
|------|-------------|-----------|-------------|--------------|
| **Flowchart** | `flowchart LR` / `flowchart TD` | LR, TD, TB, BT, RL | themeVars, classDef, linkStyle, subgraph, nodeShape, look, layout | Full. Primary diagram type. |
| **Block Diagram** | `block-beta` | LR, TD | themeVars, classDef, linkStyle | Full. Use BFS classDefs. |

### 2.2 Structural Diagram Types

These types support themeVariables but have limited or no classDef support. Brand control is primarily through themeVariables.

| Type | Declaration | Capabilities | BFS Styling Notes |
|------|-------------|-------------|-------------------|
| **Sequence** | `sequenceDiagram` | themeVars (actor, signal, label, activation, note vars) | Actor boxes = white + navy border. Activations = `blue-medium`. Notes = `blue-light`. Signal lines = `brand-deep`. |
| **Class Diagram** | `classDiagram` | themeVars, limited classDef | themeVars handle most styling. Class text color via `classText` variable. |
| **State Diagram** | `stateDiagram-v2` | themeVars, look, layout | States inherit from primary/secondary/tertiary. Use `altBackground` for nested states. |
| **Entity Relationship** | `erDiagram` | themeVars | Entities inherit primaryColor. Relationship lines inherit lineColor. |
| **Requirement** | `requirementDiagram` | themeVars | Minimal styling surface. themeVars only. |
| **C4 Diagram** | `C4Context` / `C4Container` / etc. | themeVars | Experimental. Has its own person/system/container styling. themeVars partially apply. |

### 2.3 Data Visualization Types

These types use section-based coloring. BFS brand colors map to section indices.

| Type | Declaration | Color Mechanism | BFS Color Mapping |
|------|-------------|----------------|-------------------|
| **Pie Chart** | `pie` | `pie1` through `pie12` | pie1=`#00205B`, pie2=`#003087`, pie3=`#307FE2`, pie4=`#B3C1DB`, pie5=`#D6E5F9`, pie6=`#D0D0CE` |
| **Gantt** | `gantt` | Section colors, task states | Uses primary/secondary/tertiary from themeVars. `taskBkgColor`, `activeTaskBkgColor`, `doneTaskBkgColor`. |
| **User Journey** | `journey` | `fillType0` through `fillType7` | fillType0=`#00205B`, fillType1=`#B3C1DB`, fillType2=`#D6E5F9`, fillType3=`#D0D0CE`, fillType4=`#F2F2F2` |
| **XY Chart** | `xychart-beta` | themeVars | Bar/line colors inherit from primary/secondary. |
| **Quadrant** | `quadrantChart` | themeVars | Quadrant fills derive from primary. Point colors from primary/secondary. |
| **Radar** | `radar` (experimental) | themeVars | Minimal. Inherits primary palette. |
| **Sankey** | `sankey-beta` | themeVars | Link colors inherit. Node colors derive from primary. |

### 2.4 Timeline and Chronological Types

| Type | Declaration | Color Mechanism | BFS Color Mapping |
|------|-------------|----------------|-------------------|
| **Timeline** | `timeline` | `cScale0`--`cScale11`, `cScaleLabel0`--`cScaleLabel11` | cScale0=`#00205B`/label=`#FFFFFF`, cScale1=`#003087`/label=`#FFFFFF`, cScale2=`#307FE2`/label=`#FFFFFF`, cScale3=`#B3C1DB`/label=`#00205B`, cScale4=`#D6E5F9`/label=`#00205B`, cScale5=`#D0D0CE`/label=`#333333` |
| **Gantt** | `gantt` | (see Data Visualization above) | |
| **GitGraph** | `gitgraph` | themeVars, branch-specific vars | `git0` through `git7` for branch colors. Map to BFS palette sequentially. |

### 2.5 Hierarchical / Conceptual Types

| Type | Declaration | Capabilities | BFS Styling Notes |
|------|-------------|-------------|-------------------|
| **Mindmap** | `mindmap` | themeVars, shape syntax, config (padding, maxNodeWidth) | Inherits primary/secondary/tertiary for depth levels. Shape variety (circle, square, cloud, bang, hexagon) available but classes/icons require host support. |
| **Treemap** | `treemap` (experimental) | themeVars | Minimal. Inherits section coloring from primary palette. |
| **TreeView** | `treeView` (experimental) | themeVars | Minimal. Tree structure inherits primary line/text colors. |
| **Ishikawa** | `ishikawa` (experimental) | themeVars | Cause-and-effect. Inherits primary colors. |
| **Venn** | `venn` (experimental) | themeVars | Circle fills derive from primary/secondary/tertiary. |

### 2.6 Specialized Types

| Type | Declaration | Capabilities | BFS Styling Notes |
|------|-------------|-------------|-------------------|
| **Kanban** | `kanban` (experimental) | themeVars | Board columns/cards inherit primary styling. |
| **Packet** | `packet-beta` | themeVars | Network packet visualization. Minimal theming. |
| **Architecture** | `architecture-beta` | themeVars, icon support | Uses service/group/edge syntax. themeVars apply to groups and edges. |
| **ZenUML** | `zenuml` | themeVars | Alternative sequence syntax. Same actor/signal variables apply. |

---

## 3. Flowchart Shape Library

Flowcharts are the primary diagram type and have the richest shape vocabulary. v11.3.0+ introduced 40+ shapes via the `@{ shape: name }` syntax. This section maps every shape to a BFS semantic role and recommends which classDef to pair with it.

### 3.1 Shape-to-Role Mapping

#### Process / Computation Shapes

| Shape | Syntax (legacy) | Syntax (v11.3+) | Semantic Role | Recommended classDef |
|-------|-----------------|-----------------|---------------|---------------------|
| Rectangle (process) | `A["Label"]` | `A@{ shape: rect }` | Standard process step, system component, UI surface | `secondary` or `platform` |
| Rounded rectangle (event) | `A("Label")` | `A@{ shape: rounded }` | Event, trigger, notification | `tertiary` |
| Subroutine | `A[["Label"]]` | `A@{ shape: fr-rect }` | Subprocess, runtime service, execution layer | `secondary` |
| Divided process | -- | `A@{ shape: div-rect }` | Multi-phase process | `secondary` |
| Lined/shaded process | -- | `A@{ shape: lin-rect }` | Background process, batch operation | `primary` |
| Tagged process | -- | `A@{ shape: tag-rect }` | Tagged/categorized process | `secondary` |
| Multi-process | -- | `A@{ shape: st-rect }` | Parallel processes, multi-instance | `secondary` |

#### Data / Storage Shapes

| Shape | Syntax (legacy) | Syntax (v11.3+) | Semantic Role | Recommended classDef |
|-------|-----------------|-----------------|---------------|---------------------|
| Cylinder (database) | `A[("Label")]` | `A@{ shape: cyl }` | Database, persistent store | `slate` + `dbStrong` |
| Horizontal cylinder | -- | `A@{ shape: h-cyl }` | Direct access storage | `slate` |
| Lined cylinder (disk) | -- | `A@{ shape: lin-cyl }` | Disk storage | `slate` |
| Stored data (bow-tie rect) | -- | `A@{ shape: bow-rect }` | Stored data, cache | `platform` |
| Internal storage (window pane) | -- | `A@{ shape: win-pane }` | Internal storage | `platform` |

#### Decision / Conditional Shapes

| Shape | Syntax (legacy) | Syntax (v11.3+) | Semantic Role | Recommended classDef |
|-------|-----------------|-----------------|---------------|---------------------|
| Diamond (decision) | `A{"Label"}` | `A@{ shape: diam }` | Decision point, branching logic | `gate` or `tertiary` |
| Hexagon (prepare) | `A{{"Label"}}` | `A@{ shape: hex }` | Preparation step, conditional setup | `gate` |
| Hourglass (collate) | -- | `A@{ shape: hourglass }` | Collation, merge operation | `control` |

#### Start / Stop / Terminal Shapes

| Shape | Syntax (legacy) | Syntax (v11.3+) | Semantic Role | Recommended classDef |
|-------|-----------------|-----------------|---------------|---------------------|
| Circle (start) | `A(("Label"))` | `A@{ shape: circle }` | Start point, actor, focal node | `actor` or `deepBlue` |
| Small circle | -- | `A@{ shape: sm-circ }` | Small start marker | `deepBlue` |
| Double circle (stop) | `A((("Label")))` | `A@{ shape: dbl-circ }` | Stop/end point | `deepBlue` |
| Framed circle (stop) | -- | `A@{ shape: fr-circ }` | Alternative stop marker | `deepBlue` |
| Stadium (terminal) | `A(["Label"])` | `A@{ shape: stadium }` | Terminal point, endpoint | `primary` |
| Crossed circle (summary) | -- | `A@{ shape: cross-circ }` | Summary node | `accent` |

#### Input / Output Shapes

| Shape | Syntax (legacy) | Syntax (v11.3+) | Semantic Role | Recommended classDef |
|-------|-----------------|-----------------|---------------|---------------------|
| Parallelogram (lean right) | `A[/"Label"/]` | `A@{ shape: lean-r }` | Data input/output | `platform` |
| Parallelogram alt (lean left) | `A[\"Label"\]` | `A@{ shape: lean-l }` | Output/input (reverse) | `platform` |
| Manual input (sloped rect) | -- | `A@{ shape: sl-rect }` | Manual input step | `actor` |
| Display (curved trapezoid) | -- | `A@{ shape: curv-trap }` | Display output | `secondary` |

#### Document Shapes

| Shape | Syntax (legacy) | Syntax (v11.3+) | Semantic Role | Recommended classDef |
|-------|-----------------|-----------------|---------------|---------------------|
| Document | -- | `A@{ shape: doc }` | Single document | `platform` |
| Lined document | -- | `A@{ shape: lin-doc }` | Lined document, form | `platform` |
| Multi-document | -- | `A@{ shape: docs }` | Multiple documents, batch | `platform` |
| Tagged document | -- | `A@{ shape: tag-doc }` | Classified/tagged document | `secondary` |

#### Manual / Human Shapes

| Shape | Syntax (legacy) | Syntax (v11.3+) | Semantic Role | Recommended classDef |
|-------|-----------------|-----------------|---------------|---------------------|
| Trapezoid bottom (priority) | `A[/"Label"\]` | `A@{ shape: trap-b }` | Priority action, manual task emphasis | `secondary` |
| Trapezoid top (manual op) | `A[\"Label"/]` | `A@{ shape: trap-t }` | Manual operation, human task | `actor` |
| Asymmetric (flag-like) | `A>"Label"]` | `A@{ shape: odd }` | Flag, milestone, asymmetric marker | `scope` |

#### Communication / Annotation Shapes

| Shape | Syntax (legacy) | Syntax (v11.3+) | Semantic Role | Recommended classDef |
|-------|-----------------|-----------------|---------------|---------------------|
| Lightning bolt | -- | `A@{ shape: bolt }` | Communication link, integration point | `accent` |
| Cloud | -- | `A@{ shape: cloud }` | External/uncertain dependency, SaaS | `boundary` |
| Curly brace (comment) | -- | `A@{ shape: brace }` | Annotation, comment | `log` |
| Curly brace right | -- | `A@{ shape: brace-r }` | Right-side annotation | `log` |
| Curly braces both | -- | `A@{ shape: braces }` | Bracketed annotation | `log` |
| Text block | -- | `A@{ shape: text }` | Floating text annotation | `log` |
| Bang | -- | `A@{ shape: bang }` | Alert, warning, attention marker | `outOfScope` or `redDash` |

#### Flow Control Shapes

| Shape | Syntax (legacy) | Syntax (v11.3+) | Semantic Role | Recommended classDef |
|-------|-----------------|-----------------|---------------|---------------------|
| Fork/join (filled rect) | -- | `A@{ shape: fork }` | Fork or join in process flow | `deepBlue` |
| Junction (filled circle) | -- | `A@{ shape: f-circ }` | Junction point, merge | `deepBlue` |
| Delay (half-rounded) | -- | `A@{ shape: delay }` | Wait state, delay | `gate` |
| Loop limit (notched pentagon) | -- | `A@{ shape: notch-pent }` | Loop boundary, iteration limit | `control` |
| Card (notched rect) | -- | `A@{ shape: notch-rect }` | Card, form, input record | `platform` |
| Paper tape (flag) | -- | `A@{ shape: flag }` | Paper tape, legacy I/O | `primary` |
| Triangle (extract) | -- | `A@{ shape: tri }` | Extraction, filter | `tertiary` |
| Flipped triangle (manual file) | -- | `A@{ shape: flip-tri }` | Manual file operation | `primary` |

---

## 4. themeVariables Contract

### 4.1 Flowchart / Block Diagram (Primary)

```yaml
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
```

### 4.2 Sequence Diagram Extensions

Add these alongside the base variables when generating sequence diagrams:

```yaml
    actorBkg: "#FFFFFF"
    actorBorder: "#00205B"
    actorTextColor: "#00205B"
    actorLineColor: "#A7A8A9"
    signalColor: "#002F86"
    signalTextColor: "#333333"
    labelBoxBkgColor: "#B3C1DB"
    labelBoxBorderColor: "#00205B"
    labelTextColor: "#00205B"
    loopTextColor: "#00205B"
    activationBorderColor: "#003087"
    activationBkgColor: "#B3C1DB"
    sequenceNumberColor: "#307FE2"
    noteBkgColor: "#D6E5F9"
    noteTextColor: "#00205B"
    noteBorderColor: "#003087"
```

### 4.3 Pie Chart Extensions

```yaml
    pie1: "#00205B"
    pie2: "#003087"
    pie3: "#307FE2"
    pie4: "#B3C1DB"
    pie5: "#D6E5F9"
    pie6: "#D0D0CE"
    pie7: "#F2F2F2"
    pie8: "#A7A8A9"
    pieTitleTextColor: "#00205B"
    pieSectionTextColor: "#FFFFFF"
    pieLegendTextColor: "#333333"
    pieStrokeColor: "#FFFFFF"
    pieStrokeWidth: "2px"
    pieOpacity: "0.9"
```

### 4.4 Timeline Extensions

```yaml
    cScale0: "#00205B"
    cScaleLabel0: "#FFFFFF"
    cScale1: "#003087"
    cScaleLabel1: "#FFFFFF"
    cScale2: "#307FE2"
    cScaleLabel2: "#FFFFFF"
    cScale3: "#B3C1DB"
    cScaleLabel3: "#00205B"
    cScale4: "#D6E5F9"
    cScaleLabel4: "#00205B"
    cScale5: "#D0D0CE"
    cScaleLabel5: "#333333"
```

### 4.5 User Journey Extensions

```yaml
    fillType0: "#00205B"
    fillType1: "#B3C1DB"
    fillType2: "#D6E5F9"
    fillType3: "#D0D0CE"
    fillType4: "#F2F2F2"
    fillType5: "#003087"
    fillType6: "#307FE2"
    fillType7: "#A7A8A9"
```

### 4.6 Init Directive Fallback (Single Line)

For renderers that do not support YAML frontmatter. Must be a single line. Must be the first line of the mermaid block.

```
%%{init: {"theme":"base","themeVariables":{"background":"#E7E6E6","fontFamily":"Segoe UI, Arial, Helvetica, sans-serif","fontSize":"14px","textColor":"#333333","lineColor":"#002F86","clusterBorder":"#002F86","titleColor":"#002F86","primaryColor":"#FFFFFF","primaryBorderColor":"#A7A8A9","primaryTextColor":"#333333","secondaryColor":"#B3C1DB","secondaryBorderColor":"#00205B","secondaryTextColor":"#00205B","tertiaryColor":"#E7E6E6","tertiaryBorderColor":"#75787B","tertiaryTextColor":"#4D4D4D","edgeLabelBackground":"#FFFFFF","clusterBkg":"#F2F2F2","mainBkg":"#FFFFFF","nodeBorder":"#A7A8A9","nodeTextColor":"#333333"}}}%%
```

---

## 5. classDef System

### 5.1 Core Library

```
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
classDef dbStrong    stroke-width:1.8px
classDef scope       fill:#D6E5F9,stroke:#00205B,stroke-width:2px,color:#00205B
classDef outOfScope  fill:#FFFFFF,stroke:#C8102E,stroke-width:2px,color:#C8102E
classDef redDash     fill:#C8102E,stroke:#9F0D24,stroke-dasharray:3 2,stroke-width:1.5px,color:#FFFFFF
```

### 5.2 Semantic Role Definitions

| Class | Semantic Role | When To Use |
|-------|--------------|-------------|
| `primary` | BFS-owned context | Internal enterprise elements, business-side nodes, owned infrastructure |
| `secondary` | Primary application surface | Tenant UIs, core platform elements, major system components |
| `tertiary` | Overlay / assistive | AI features, guidance layers, assistive experiences, secondary planes |
| `platform` | Neutral infrastructure | Platform components, generic services, neutral technical elements |
| `boundary` | Administrative boundary | Trust zones, ownership zones, governance containers |
| `actor` | People / endpoints | Human roles, teams, user devices, entry points |
| `gate` | Prerequisite / condition | Eligibility checks, policy gates, enablement dependencies |
| `control` | Governance lever | Admin toggles, lifecycle controls, kill switches, config points |
| `log` | Telemetry / audit | Logging, monitoring, detection, review, audit artifacts |
| `question` | Open item / TBD | Unresolved dependencies, design questions, pending decisions |
| `accent` | Rare emphasis | Highlight nodes, focal points. Use sparingly. |
| `deepBlue` | Deep brand emphasis | Key infrastructure, channel nodes, start/stop points |
| `slate` | Dark infrastructure | Databases, persistence layers, infrastructure contrast |
| `dbStrong` | Modifier | Heavier stroke for data stores. Combine with `slate` or `deepBlue`. |
| `scope` | In-scope framing | Scope guardrails, approved focus areas |
| `outOfScope` | Exclusion marker | Out-of-scope items, prohibited elements (border only, white fill) |
| `redDash` | Risk/warning | Risk hotspots, exception warnings (filled red) |

### 5.3 Subgraph Style Tiers

| Tier | Pattern | Use For |
|------|---------|---------|
| 1 - Major boundary | `fill:#D0D0CE,stroke:#00205B,stroke-width:2px,color:#4D4D4D` | BFS-owned context, major platform boundaries |
| 2 - System tenant | `fill:#B3C1DB,stroke:#00205B,stroke-width:2px,color:#00205B` | Primary application tenants, SaaS boundaries |
| 2b - Light system | `fill:#D6E5F9,stroke:#003087,stroke-width:2px,color:#00205B` | Secondary/overlay planes, guidance layers |
| 3 - Interior group | `fill:#D0D0CE,stroke:#75787B,stroke-width:2px,color:#4D4D4D` | Nested compartments, identity planes, audit groups |
| 3b - Chrome group | `fill:#FFFFFF,stroke:#A7A8A9,stroke-width:2px,color:#4D4D4D` | Gates, open questions, neutral chrome groups |
| 4 - Environment | `fill:#F2F2F2,stroke:#002F86,stroke-width:1.5px,color:#002F86` | Dev/QA/Prod panels, environment containers |

### 5.4 Edge Styling

```
linkStyle default stroke:#002F86,stroke-width:1.3px
```

| Edge Syntax | Semantic Usage |
|-------------|---------------|
| `-->` | Primary flow, data movement, control signals |
| `-.->` | Optional paths, provisioning, log export, boundary anchors |
| `-->\|"Label"\|` | Named solid relationships |
| `-. "Label" .->` | Named optional/guidance flows |

---

## 6. AI Instruction Layer

When this document is provided as context to any AI (Claude, ChatGPT, Copilot, Gemini, Perplexity, Mermaid.ai, or others), the AI should follow these rules when generating Mermaid diagrams.

### 6.1 Output Rules

1. Return exactly one fenced mermaid code block.
2. Begin with the appropriate YAML frontmatter or init directive from Section 4.
3. Include only the classDefs from Section 5 that are relevant to the diagram.
4. Include `linkStyle default` for all flowchart-family diagrams.
5. Do not invent colors, fonts, fills, gradients, classDefs, or inline style overrides beyond what this document defines.
6. Style every subgraph with an explicit inline style statement from the approved tier patterns (Section 5.3).

### 6.2 Syntax Safety Rules

1. Use short stable node IDs (alphanumeric and underscores only).
2. Put all human-readable text in double-quoted labels.
3. Quote any label containing punctuation, parentheses, slashes, colons, angle brackets, or special characters.
4. Do not use HTML tags in labels.
5. Do not use semicolons as line terminators.
6. Never use lowercase "end" as a node label or node ID.
7. Every subgraph must have a quoted label and an explicit `end` keyword.
8. Do not accidentally create circle edges (`---o`) or cross edges (`---x`).

### 6.3 Diagram Family Selection

| If the subject is about... | Use this diagram type |
|----------------------------|----------------------|
| Systems, services, interfaces, zones, data stores, architecture | `flowchart LR` |
| Steps, approvals, branching, swimlanes, task flow | `flowchart TD` |
| Who talks to whom, in what order, over time | `sequenceDiagram` |
| Object structure, inheritance, interfaces | `classDiagram` |
| State transitions, lifecycle | `stateDiagram-v2` |
| Data relationships, cardinality | `erDiagram` |
| Milestones, phases, chronology | `timeline` |
| Proportions, distribution | `pie` |
| User experience evaluation | `journey` |
| Conceptual hierarchy, brainstorming | `mindmap` |
| Project scheduling, dependencies | `gantt` |
| Metrics across multiple dimensions | (not yet reliable; suggest flowchart alternative) |

### 6.4 Iterative Refinement Rules

When updating an existing diagram:
- Preserve the theme/config block exactly.
- Preserve all classDef lines exactly.
- Preserve the linkStyle default exactly.
- Return the full updated diagram, not a diff or fragment.
- Only change nodes, edges, labels, and subgraphs that must change.

When repairing broken syntax:
- Keep the theme/config block unchanged.
- Keep all colors, classes, and linkStyle unchanged.
- Fix only syntax issues: IDs, brackets, arrows, subgraph structure, reserved words, quoting.

### 6.5 Quality Standard

The final diagram should feel BFS-branded, restrained, professional, and executive-readable. It should look like it came from a reusable enterprise template, not a one-off AI generation. Do not create rainbow diagrams. Do not use the word "Mermaid" in the diagram content. Keep the visual system disciplined and enterprise-appropriate.

---

## 7. Render Safety Reference

| Error Pattern | What It Looks Like | Fix |
|---------------|-------------------|-----|
| HTML in labels | `A["Line<br>Two"]` | Remove `<br>`, use single-line labels |
| Semicolons | `A --> B;` | Remove semicolons |
| Node style overrides | `style A fill:#ff0000` | Remove. classDef handles node styling. |
| Invented classDefs | `classDef custom fill:#random` | Remove. Use only Section 5 library. |
| Invented subgraph colors | `style SUB fill:#8B5CF6` | Replace with nearest Section 5.3 tier. |
| Single-quoted labels | `A['label']` | Change to `A["label"]` |
| Special chars in IDs | `my-node`, `node.1` | Change to `my_node`, `node_1` |
| Missing subgraph end | `subgraph Title` | Add `end` keyword |
| Duplicate IDs | Two nodes both `A` | Make unique: `A1`, `A2` |
| Both init + frontmatter | `%%{init}%%` and `---` | Use only one |
| Lowercase "end" label | Node text = `end` | Rename to "Complete" or "Finish" |
| Accidental special edges | `A---oB` or `A---xB` | Use `A --> B` |

---

## 8. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | April 2026 | Initial release. Covers Mermaid v11.14.0. 25 diagram types, 40+ flowchart shapes, complete themeVariables per diagram family, semantic classDef system, subgraph tier patterns, AI instruction layer. Synthesized from Claude, ChatGPT, Copilot, and Perplexity analysis passes against BFS production diagrams and official Mermaid documentation. |
