# Tab Instructions

High-level user instructions for each tab in Mermaid Theme Builder.

Instruction diagrams: `examples/tab-instructions-compose.mmd` · `examples/tab-instructions-apply.mmd`

---

## Compose Tab

**Build and Customize a Reusable Mermaid Theme**

### 1. Start in Compose

Open the Compose tab to build a new theme or refine an existing one.
All theme-building controls live here: palette selection, look, colors, and typography.

### 2. Choose a Starting Palette

Select a palette from the top bar — brand palettes (OKHP3, Glee-fully, AskJamie),
utility palettes (Ocean Depth, Forest Sage, Slate Ember, Violet Mist), or a saved
custom palette. Press **+ New** to start from a blank slate.

- To reuse an existing theme, use **Import Theme → Import from JSON** to load a
  `.theme.json` or `.palette-bundle.json` file.
- To pull colors from a diagram you already have, use **Import Theme → Extract Theme**
  and paste the styled Mermaid code — the app reads the `%%{init}%%` block and
  populates the controls automatically.

### 3. Name the Theme

Give the active palette slot a recognizable name so it can be identified when
exporting, sharing, or reloading across sessions. The name appears in exported
JSON and in the Prompt Scaffold header.

### 4. Select the Rendering Look

Choose the visual rendering style applied to all diagrams:

- **Classic** — original Mermaid angles and connectors
- **Neo** — modern rounded nodes and cleaner connectors (Mermaid v11+)
- **Hand-Drawn** — sketch style with irregular strokes

> Note: not all renderers support Neo or Hand-Drawn. Check compatibility before exporting.

### 5. Adjust Primary Colors

Use the **Colors** section to set the core palette tokens:

| Token | Controls |
|---|---|
| Primary | Node fill, primary text, primary border |
| Secondary | Secondary node fill, secondary text, secondary border |
| Tertiary | Tertiary node fill, tertiary text, tertiary border |
| Neutral | Background, main background, node border, cluster background |
| Accent | Lines & arrows, edge label background, title color |

Click any color swatch to open the color picker. Changes update the live preview instantly.

### 6. Adjust Diagram Support Colors

Fine-tune colors for structural and semantic elements:

- **Nodes** — default node fill and stroke
- **Edges** — connector line color and edge label background
- **Clusters / Subgraphs** — cluster background and border
- **Labels** — text on nodes, edges, and metadata
- **Warnings / Alerts** — highlight colors for critical path nodes

### 7. Configure Typography Settings

Open the **Typography** section to set fonts and sizes across five tiers:

| Tier | Default size | Controls |
|---|---|---|
| Diagram Title | 20px | Font family, size |
| Subgraph Title | 16px | Font family, size |
| Nested Subgraph | 14px | Font family, size |
| Node Label | 14px | Font family, size |
| Edge Label | 12px | Font family, size |

Font family presets include DM Sans, Alfa Slab One, JetBrains Mono, Inter, and Georgia.
Enter any valid CSS font-family value for a custom typeface.

### 8. Review Typography Hierarchy

The app enforces readable hierarchy: child tiers cannot be set larger than their
parent tiers. A **warning badge** appears on any tier that violates its parent's size.

- Confirm Title > Subgraph > Nested Subgraph > Node Label > Edge Label
- Resolve any hierarchy warnings before exporting

### 9. Preview the Sample Diagram

The right panel renders a live sample diagram using the active theme. Use the
diagram-type picker above the preview to test the theme across different families:
Flowchart, Sequence, Class, Gantt, ER, and more.

All color and typography changes update the preview in real time — no manual refresh needed.

### 10. Check Renderer Compatibility

Review whether the theme will survive the target rendering environment:

| Renderer | Known limitations |
|---|---|
| GitHub | Partial `themeVariables` support; no `classDef` on some types |
| Notion | Limited `%%{init}%%` directive support |
| Obsidian | Plugin-dependent; variable support varies |
| Mermaid Live | Full support |
| CLI / mmdc | Full support |
| Azure DevOps | Minimal theme variable support |

If warnings appear, loop back to steps 5–7 to adjust colors, typography, or look.

### 11. Generate the Reusable Theme Output

Use the export controls to produce the output format you need:

- **Copy Bootstrap** — Markdown code block containing the themed `%%{init}%%` directive,
  ready to paste above any diagram
- **Prompt Scaffold** — detailed LLM instructions in four formats:
  - **Canonical** — full directive with all variables spelled out
  - **Markdown** — embedded in a fenced code block
  - **Minified** — compact single-line form
  - **JSON** — structured theme object for programmatic use
- **Share Link** — URL with the full theme payload encoded; shareable with teammates
- **Download** — save as `.theme.json` (portable single palette) or
  `.palette-bundle.json` (all saved palettes at once)

### 12. Copy or Export the Theme Contract

Copy or download the chosen output format for use outside the app.
The theme contract captures every color token, typography tier, and look setting
needed to reproduce the theme in any Mermaid environment.

### 13. Use the Theme Elsewhere

Paste or import the exported theme into:

- **AI assistants** — ChatGPT, Claude, Copilot, Gemini, Perplexity (via Prompt Scaffold)
- **Mermaid.ai** — paste the init directive above a new diagram
- **GitHub** — embed in `.md` files or GitHub Wiki pages
- **Notion / Obsidian** — paste into Mermaid code blocks (check renderer limits)
- **Documentation sites** — any Markdown-based doc platform that renders Mermaid

---

## Apply Tab

**Apply a Theme to an Existing Mermaid Diagram**

### 1. Start in Apply

Open the Apply tab to style a diagram you already have.
The active palette from the Compose tab is applied automatically — switch palettes
in the top bar at any time to re-theme without re-pasting your code.

### 2. Paste Mermaid Source Code

Drop raw Mermaid diagram code into the editor panel on the left.
Multi-diagram files are supported: a **Diagram** selector appears above the editor
when more than one diagram is detected in the pasted content.

### 3. Detect the Diagram Family

The app automatically identifies the diagram type from the syntax:
Flowchart, Sequence, Class, Gantt, Timeline, ER, State, Pie, Quadrant, C4, Block, and more.

The detected family controls:

- which theme variables are applied
- which export options are available
- which compatibility advisories are shown

### 4. Review Detection Results

The detection header shows the identified family name and confidence level.
If auto-detection is wrong, use the **family override** selector to set it manually.

Check for any immediate input diagnostics:

- **Existing `%%{init}%%` directive** — the app warns that its block will be replaced
- **Non-printable characters** — flagged as potential render failures
- **Long labels** — warned as likely to overflow in constrained renderers

### 5. Choose an Active Theme

Select which palette or custom theme to apply using the palette bar at the top.
The themed output updates immediately when the palette changes — no need to re-paste.

### 6. Apply the Theme

The app generates a themed version of your diagram by prepending a `%%{init}%%`
directive block containing all active color tokens, typography settings, and look
configuration. For supported diagram families, `classDef` style blocks are appended.

### 7. Preview the Themed Diagram

The preview panel renders the fully styled diagram live. Zoom, pan, and fit-to-window
controls are available in the bottom-right corner of the preview.

Switch between view modes using the tabs above the preview:

| Mode | Shows |
|---|---|
| **Original** | Raw pasted input, unstyled |
| **Themed** | Rendered diagram with active theme applied |
| **Diff** | Unified line diff — green for added init/classDef lines, red for removed |
| **Code** | Syntax-highlighted themed source, ready to copy |

### 8. Compare Original and Themed Output

Use **Diff** mode to review exactly what the theme engine added to your diagram:

- Green lines — added `%%{init}%%` directive and `classDef` blocks
- Red lines — any lines replaced or removed
- Line numbers and change counts shown throughout

Use **Original** and **Themed** side-by-side mental comparison to confirm the
visual result matches intent before exporting.

### 9. Review Compatibility Advisories

The advisory banner surfaces warnings specific to the detected family and active renderer:

- **Renderer limitations** — e.g., GitHub does not support `themeVariables` on this family
- **Unsupported styling** — e.g., `classDef` node styles are ignored by this renderer
- **classDef gaps** — a **No classDef** badge appears for families that don't support
  node-level class styling (e.g., Sequence diagrams)
- **Diagram-family restrictions** — e.g., Gantt colors are controlled by a separate
  variable set not in the standard theme block

### 10. Repair or Adjust if Needed

If advisories indicate risk, go back and fix before exporting:

- **Source** — edit the diagram code directly in the editor
- **Theme** — return to Compose to adjust colors, look, or typography
- **Target renderer** — reconsider which platform the diagram is destined for
- Loop returns to **step 2** (paste) after source edits, or **step 5** (choose theme)
  after palette changes

### 11. Copy Styled Mermaid Code

Click **Copy Styled Code** to copy the full themed Mermaid source — the original
diagram with the `%%{init}%%` directive and any `classDef` blocks prepended.
This is the output to paste directly into any Mermaid-rendering environment.

### 12. Export Markdown Bootstrap

Use the **Download → .md** option to export a complete Markdown file containing:

- The themed diagram in a fenced Mermaid code block
- Supporting context (palette name, renderer target, diagram family)

Paste this directly into GitHub README files, Notion pages, or any Markdown doc.

### 13. Export AI Prompt Scaffold

Use **Copy Prompt Scaffold** or **Download → .txt** to export a structured
instruction scaffold for AI assistants. The scaffold includes:

- Active theme directive in the format chosen (Canonical, Markdown, Minified, or JSON)
- Diagram family and renderer context
- `classDef` block if the family supports it
- Renderer-specific constraint notes when a target is selected

Paste into ChatGPT, Claude, Copilot, Gemini, or Perplexity to generate new diagrams
that match the active theme out of the box.

### 14. Open in Mermaid Live Editor

Click the **Live Editor** button to open `mermaid.live` with the themed code
pre-loaded. Use this to:

- Validate the themed output renders correctly
- Make fine-grained manual edits in the Mermaid Live interface
- Share a live-rendering permalink with teammates

### 15. Use in Target Documentation

Paste or import the final styled diagram into the destination:

- **GitHub** — `.md` files, GitHub Wiki, README, pull request descriptions
- **Notion** — Mermaid code block (check renderer advisory for variable support)
- **Obsidian** — Mermaid plugin block (plugin version determines theme support)
- **Documentation sites** — GitBook, Docusaurus, MkDocs, Confluence, and others
- **Project pages** — any platform that renders fenced Mermaid code blocks

---

## Examples Tab

**Browse and Load Diagram Examples**

### 1. Browse the Sidebar Catalog

The left sidebar organizes all examples into groups:

- **Showcase** — advanced multi-feature examples (Overkill Rube Goldberg, etc.)
- **Core Families** — Flowchart, Sequence, Class, ER, State, Gantt, Pie
- **Specialized** — Timeline, Quadrant, XY Chart, Sankey, Block
- **Visual Strategy** — Mindmap, Wardley Map, Event Modeling
- **Project Management** — Gantt, User Journey, Git Graph
- **C4 Architecture** — C4 Context, Container, Component, Dynamic
- **Overkill & Edge Cases** — stress-test diagrams and renderer-edge examples

Click **Browse all supported families** to open the full Diagram Family Inventory,
which lists every registered Mermaid type with support status (Native / Legacy),
Theme Confidence (High / Low / Generic), and Notation Compliance rating.

### 2. Search by Name or Type

Type in the search box above the sidebar to filter examples by:

- Diagram name (e.g., "Overkill")
- Family name (e.g., "sequence")
- Badge label (e.g., "beta", "canonical")

Results update live as you type.

### 3. Preview with Your Palette

Click any example in the sidebar to render it immediately in the preview panel
using the currently active palette. Switch palettes in the top bar to see the
same diagram restyled in a different theme without reloading the example.

Support badges on each example indicate rendering behavior:

- **Native** — full theme variable support
- **Beta** — limited or partial theme support
- **Experimental** — unstable; may not render consistently across versions
- **Canonical** — standard reference example for that family

### 4. Load into Apply Tab

Click **Load into Apply Tab** to send the example's Mermaid source to the Apply
tab editor. Use this to:

- Start from a working example and apply your own theme
- Test how a specific diagram family responds to your active palette
- Use the example as a structural template for your own content

---

## Reference Tab

**Explore Technical Specs, Renderer Parity, and Class Details**

### 1. Check Renderer Compatibility

Open the **Renderer Parity Matrix** accordion to see a detailed support table
for all major Mermaid rendering environments.

Matrix columns:

| Column | Meaning |
|---|---|
| **Looks** | Whether Classic, Neo, and Hand-Drawn are supported |
| **init** | Whether `%%{init}%%` directive is honored |
| **themeVars** | Whether `themeVariables` keys are applied |
| **classDef** | Whether `classDef` node styling is applied |
| **CSS** | Whether external CSS injection works |
| **fonts** | Whether custom `fontFamily` values are respected |
| **Version** | Approximate minimum Mermaid version for full support |

Renderers covered: GitHub, Notion, Obsidian, GitLab, Azure DevOps, Mermaid Live,
Mermaid CLI (mmdc), Confluence, Docusaurus, and others.

### 2. Review Diagram Families

The **Diagram Family Inventory** section lists every registered Mermaid diagram
type with:

- **Support status** — Native (current renderer) or Legacy (older syntax)
- **Theme Confidence** — High, Low, or Generic (how well theme variables apply)
- **Notation Compliance** — how closely the family follows standard Mermaid notation
- **Beta / Experimental badges** — families with known instability or partial support

Use this to understand which families will produce the most reliable themed output
before committing to a diagram type for a project.

### 3. Explore the Class Library

The **Class Library** browser shows all `classDef` style blocks generated by the
active palette — the full set of named styles available for node-level theming:

- `:::primary` — primary palette node style
- `:::secondary` — secondary palette node style
- `:::tertiary` — tertiary palette node style
- `:::accent` — accent color node style
- `:::neutral` — neutral / background node style
- Plus any additional classes defined by the active family overlay

Each entry shows the full CSS properties (fill, stroke, color, font-weight).
Classes are marked **Used** or **Unused** based on whether they appear in the
code currently loaded in the Apply tab.

### 4. Fix Class Name Errors

If the Apply tab contains unrecognized or misspelled class names (e.g., `:::primar`
instead of `:::primary`), the Class Library browser surfaces a **Close Match** alert.

Click the **Fix** button next to the alert to perform a safe regex replacement
throughout the Apply tab source — correcting the typo without touching any other
content.

### 5. Understand Support Badges

The badge legend at the top of the Reference tab explains every status indicator
used across the app:

- **Native** — full theme variable support in the active renderer
- **Beta** — theme support is partial; some variables may be ignored
- **Experimental** — the diagram type itself is unstable; output may vary
- **Canonical** — this is the standard reference example for the family
- **High / Low / Generic** — theme confidence levels from the family registry
