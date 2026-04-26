# BUILD SPEC — Mermaid Style Builder

> This document is the primary build instruction set. It is designed to be consumed by Replit (or any AI-assisted development environment) as a step-by-step specification. Follow the sections in order. Each section has a "done signal" that must be verified before moving to the next.

---

## Project Identity

- **Name:** Mermaid Style Builder
- **Repo:** OKHP3/mermaid-style-builder
- **Stack:** Vanilla JavaScript (ES modules) + Vite + CSS. No framework (no React, no Vue, no Svelte).
- **Diagram rendering:** mermaid.js loaded from CDN at runtime. NOT bundled.
- **Deployment target:** GitHub Pages (static files only).
- **License:** MIT

---

## Phase 1: Project Scaffolding

### File structure to create:

```
/
  index.html
  package.json
  vite.config.js
  .gitignore
  README.md
  LICENSE
  src/
    main.js
    tokens.js
    presets.js
    generator.js
    injector.js
    extractor.js
    preview.js
    ui.js
    utils.js
  styles/
    main.css
  docs/
    PRD.md
    POSITIONING.md
    DESIGN_SYSTEM.md
```

### package.json contents:

```json
{
  "name": "mermaid-style-builder",
  "version": "0.1.0",
  "description": "Define your brand. Style your diagrams. Stop fighting with LLM outputs.",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "devDependencies": {
    "vite": "^6.0.0"
  },
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/OKHP3/mermaid-style-builder"
  },
  "author": "Jamie Hill <jamie@overkillhill.com>",
  "keywords": [
    "mermaid",
    "mermaid-js",
    "diagram",
    "theme",
    "style",
    "branding",
    "design-system",
    "themeVariables"
  ]
}
```

### vite.config.js contents:

```js
import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
```

### .gitignore contents:

```
node_modules/
dist/
.DS_Store
*.log
```

### index.html shell:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mermaid Style Builder</title>
  <meta name="description" content="Define your brand colors, generate a complete Mermaid style system, apply it to diagrams, and keep everything visually consistent.">
  <meta property="og:title" content="Mermaid Style Builder">
  <meta property="og:description" content="Define your brand. Style your diagrams. Stop fighting with LLM outputs.">
  <meta property="og:type" content="website">
  <link rel="stylesheet" href="/styles/main.css">
  <script src="https://cdn.jsdelivr.net/npm/mermaid@11.14.0/dist/mermaid.min.js"></script>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

### Done signal: `npm install` succeeds, `npm run dev` starts the Vite server, browser shows an empty page with no errors in the console.

---

## Phase 2: Token State and Utilities

### src/utils.js

Implement these pure functions:

```
hexToRgb(hex) -> { r, g, b }
luminance(hex) -> number (0-1)
textColorFor(bgHex) -> "#333333" or "#FFFFFF" based on luminance threshold 0.55
darken(hex, amount=0.15) -> hex string
isValidHex(str) -> boolean (matches /^#[0-9A-Fa-f]{6}$/)
```

### src/presets.js

Export an object with preset palettes. Each preset contains:

```js
{
  name: "Display Name",
  primaryDark: "#hex",
  primaryMedium: "#hex",
  primaryDeep: "#hex",
  accent: "#hex",
  supportMed: "#hex",
  supportLight: "#hex",
  neutral: "#hex",
  canvas: "#hex",
  panel: "#hex",
  signalRed: "#hex",
  borderGray: "#hex",
  medGray: "#hex",
  slate: "#hex",
  fontFamily: "font stack string",
  fontSize: "14px"
}
```

Include these presets:

**BFS Light:**
primaryDark=#00205B, primaryMedium=#003087, primaryDeep=#002F86, accent=#307FE2, supportMed=#B3C1DB, supportLight=#D6E5F9, neutral=#D0D0CE, canvas=#E7E6E6, panel=#F2F2F2, signalRed=#C8102E, borderGray=#A7A8A9, medGray=#75787B, slate=#515151, fontFamily="Segoe UI, Arial, Helvetica, sans-serif", fontSize="14px"

**OverKill Hill:**
primaryDark=#111827, primaryMedium=#1F2937, primaryDeep=#374151, accent=#D97706, supportMed=#92400E, supportLight=#FEF3C7, neutral=#374151, canvas=#0F172A, panel=#1E293B, signalRed=#DC2626, borderGray=#6B7280, medGray=#9CA3AF, slate=#4B5563, fontFamily="Segoe UI, Arial, Helvetica, sans-serif", fontSize="14px"

**Glee-fully:**
primaryDark=#2D6F7E, primaryMedium=#D94F63, primaryDeep=#2D6F7E, accent=#D94F63, supportMed=#F6F2EE, supportLight=#FFF0ED, neutral=#F6F2EE, canvas=#FDFBF7, panel=#F6F2EE, signalRed=#D94F63, borderGray=#B8B0A8, medGray=#8A8279, slate=#4A4540, fontFamily="Trebuchet MS, Arial, sans-serif", fontSize="14px"

**Corporate Neutral:**
primaryDark=#1A1A2E, primaryMedium=#16213E, primaryDeep=#0F3460, accent=#E94560, supportMed=#D4E4F7, supportLight=#EDF2F7, neutral=#E2E8F0, canvas=#F7FAFC, panel=#EDF2F7, signalRed=#E94560, borderGray=#A0AEC0, medGray=#718096, slate=#4A5568, fontFamily="Segoe UI, Arial, sans-serif", fontSize="14px"

### src/tokens.js

Implement a reactive state store for color tokens. Pattern:

```js
// Internal state object holding all token values
// A subscribers array for change notifications
// setToken(key, value) -> updates state, notifies subscribers
// getToken(key) -> returns current value
// getAllTokens() -> returns full state copy
// loadPreset(presetKey) -> replaces all tokens with preset values
// subscribe(callback) -> registers a listener called on any token change
```

Use a simple pub/sub pattern. No external state library.

### Done signal: Importing tokens.js and presets.js in main.js works. Calling loadPreset("bfs") sets all token values. Calling subscribe() and then setToken() triggers the callback.

---

## Phase 3: Output Generation

### src/generator.js

Implement these functions. Each takes the full token state object as input and returns a string.

**generateYamlFrontmatter(tokens) -> string**

Produces the YAML frontmatter block. Format:

```
---
config:
  theme: base
  look: classic
  themeVariables:
    background: "{canvas}"
    fontFamily: "{fontFamily}"
    fontSize: "{fontSize}"
    textColor: "#333333"
    lineColor: "{primaryDeep}"
    clusterBorder: "{primaryDeep}"
    titleColor: "{primaryDark}"
    primaryColor: "#FFFFFF"
    primaryBorderColor: "{borderGray}"
    primaryTextColor: "#333333"
    secondaryColor: "{supportMed}"
    secondaryBorderColor: "{primaryDark}"
    secondaryTextColor: "{computed: textColorFor(supportMed) dark->primaryDark, light->#FFFFFF}"
    tertiaryColor: "{canvas}"
    tertiaryBorderColor: "{medGray}"
    tertiaryTextColor: "{computed: textColorFor(canvas) dark->#4D4D4D, light->#E5E5E5}"
    edgeLabelBackground: "#FFFFFF"
    clusterBkg: "{panel}"
    mainBkg: "#FFFFFF"
    nodeBorder: "{borderGray}"
    nodeTextColor: "#333333"
    noteBkgColor: "{supportLight}"
    noteTextColor: "{primaryDark}"
    noteBorderColor: "{primaryMedium}"
    actorBkg: "#FFFFFF"
    actorBorder: "{primaryDark}"
    actorTextColor: "{primaryDark}"
    signalColor: "#333333"
    labelBoxBkgColor: "{supportMed}"
    labelBoxBorderColor: "{primaryDark}"
---
```

**generateInitDirective(tokens) -> string**

Same variables as YAML but in single-line `%%{init: {"theme":"base","themeVariables":{...}}}%%` format.

**generateClassDefs(tokens) -> string**

Produces all 17 classDef declarations plus linkStyle default. Each classDef's fill, stroke, and color values derive from the token state using utils.js functions for contrast calculation.

```
classDef primary     fill:{neutral},stroke:{primaryDark},stroke-width:1.5px,color:{textColorFor(neutral)}
classDef secondary   fill:{supportMed},stroke:{primaryDark},stroke-width:1.5px,color:{textColorFor(supportMed)->primaryDark or #FFFFFF}
classDef tertiary    fill:{supportLight},stroke:{primaryMedium},stroke-width:1.5px,color:{textColorFor(supportLight)->primaryDark or #FFFFFF}
classDef platform    fill:#FFFFFF,stroke:{primaryDark},stroke-width:1.5px,color:#4D4D4D
classDef boundary    fill:{neutral},stroke:{medGray},stroke-width:1.5px,color:{textColorFor(neutral)}
classDef actor       fill:#FFFFFF,stroke:{primaryDark},stroke-width:1.5px,color:{primaryDark}
classDef gate        fill:#FFFFFF,stroke:{borderGray},stroke-width:1px,stroke-dasharray:4 3,color:#4D4D4D
classDef control     fill:#FFFFFF,stroke:{borderGray},stroke-width:1px,color:#4D4D4D
classDef log         fill:#FFFFFF,stroke:{borderGray},stroke-width:1px,color:#4D4D4D
classDef question    fill:#FFFFFF,stroke:{primaryDark},stroke-width:1px,stroke-dasharray:6 4,color:{primaryDark}
classDef accent      fill:{accent},stroke:{darken(accent)},stroke-width:1.4px,color:{textColorFor(accent)}
classDef deepBlue    fill:{primaryDeep},stroke:{primaryDeep},stroke-width:1.4px,color:#FFFFFF
classDef slate       fill:{slate},stroke:{darken(slate)},stroke-width:1.4px,color:#FFFFFF
classDef dbStrong    stroke-width:1.8px
classDef scope       fill:{supportLight},stroke:{primaryDark},stroke-width:2px,color:{textColorFor(supportLight)->primaryDark or #FFFFFF}
classDef outOfScope  fill:#FFFFFF,stroke:{signalRed},stroke-width:2px,color:{signalRed}
classDef redDash     fill:{signalRed},stroke:{darken(signalRed)},stroke-dasharray:3 2,stroke-width:1.5px,color:#FFFFFF

linkStyle default stroke:{primaryDeep},stroke-width:1.3px
```

**generateSubgraphTiers(tokens) -> string**

Produces 6 tier patterns as comments/reference:

```
Tier 1 (major boundary):     style ID fill:{neutral},stroke:{primaryDark},stroke-width:2px,color:{textColorFor(neutral)}
Tier 2 (system tenant):      style ID fill:{supportMed},stroke:{primaryDark},stroke-width:2px,color:{textColorFor(supportMed)}
Tier 2b (light system):      style ID fill:{supportLight},stroke:{primaryMedium},stroke-width:2px,color:{textColorFor(supportLight)}
Tier 3 (interior group):     style ID fill:{neutral},stroke:{medGray},stroke-width:2px,color:{textColorFor(neutral)}
Tier 3b (chrome group):      style ID fill:#FFFFFF,stroke:{borderGray},stroke-width:2px,color:#4D4D4D
Tier 4 (environment panel):  style ID fill:{panel},stroke:{primaryDeep},stroke-width:1.5px,color:{textColorFor(panel)}
```

**generateFullSystem(tokens) -> string**

Combines all outputs into a single markdown document formatted as a complete Mermaid Design System file, suitable for upload to Mermaid.ai, Claude Projects, Custom GPTs, or Copilot agents.

### Done signal: All generator functions produce correct output for the BFS Light preset. Output can be copy-pasted into Mermaid Live Editor and renders without errors.

---

## Phase 4: UI Shell and Color Picker Panel

### styles/main.css

Design constraints:
- Light background (#FAFAFA or similar), dark text
- Segoe UI font stack
- Two-column layout for desktop (left 40%, right 60%)
- Clean, professional, not fancy. The tool's visual identity should not compete with the diagrams it styles.
- Use CSS custom properties for the tool's own theming (not to be confused with the Mermaid theme it generates)
- Tab bar with underline-style active indicator
- Code output blocks: monospace font, light gray background, 11-12px font size
- Copy buttons: small, positioned at top-right of code blocks
- Color picker inputs: native HTML `<input type="color">` sized 32x32px, with hex text input beside each

### src/ui.js

Implement DOM construction and event binding. The UI is built programmatically (no HTML template strings longer than 10 lines; build elements with createElement or a small helper).

**Left column sections:**
1. Preset buttons row (horizontal, wrap on overflow)
2. "Brand colors" section: primaryDark, primaryMedium, primaryDeep, accent (each with color picker + hex input + label)
3. "Fills and surfaces" section: supportMed, supportLight, neutral, canvas
4. "Chrome and signals" section: panel, borderGray, medGray, slate, signalRed
5. "Typography" section: fontFamily (text input), fontSize (text input)
6. Output tab bar: YAML | Init | classDef | Subgraph | Full System
7. Output code block (scrollable, monospace) with Copy button

**Right column sections:**
1. Mode selector: Compose | Apply | Extract (radio buttons or toggle group)
2. Diagram textarea (hidden in Compose mode)
3. Preview panel

### src/main.js

Entry point. On DOM ready:
1. Initialize token state with default preset (BFS Light)
2. Build the UI
3. Subscribe to token changes to update outputs and preview
4. Bind preset buttons, color pickers, mode selectors

### Done signal: The page renders with all color pickers, preset buttons work and update all pickers, output tabs show generated code, copy buttons work.

---

## Phase 5: Preview Panel

### src/preview.js

**renderNodePreview(tokens, containerElement)**

Renders HTML sample nodes (not using mermaid.js) showing how each classDef would look. Each node is a styled `<div>` with the class name as its label, using the fill, stroke, and text color from the active tokens. This provides instant visual feedback without needing a Mermaid diagram.

Render these classes: primary, secondary, tertiary, platform, actor, boundary, gate, control, log, question, accent, deepBlue, slate, scope, outOfScope, redDash.

**renderSubgraphPreview(tokens, containerElement)**

Renders 3-4 sample subgraph containers showing the tier patterns.

**renderDiagramPreview(mermaidCode, containerElement)**

Takes styled Mermaid code, calls `mermaid.render()` with a unique ID, and inserts the resulting SVG into the container. On error, displays the error message in the container.

Initialize mermaid.js on page load:
```js
mermaid.initialize({ startOnLoad: false, securityLevel: "loose", theme: "base" });
```

Use `mermaid.render()` for dynamic rendering (not `mermaid.run()`).

### Done signal: Node preview shows all 16 class styles with correct colors. Subgraph preview shows tier containers. Changing a color picker immediately updates the previews.

---

## Phase 6: Diagram Injection (Apply Mode)

### src/injector.js

**detectDiagramType(code) -> string**

Scan the first 10 non-empty, non-comment lines for diagram type declarations. Return one of:
- "flowchart" (matches `flowchart`, `graph`)
- "sequence" (matches `sequenceDiagram`)
- "class" (matches `classDiagram`)
- "state" (matches `stateDiagram`, `stateDiagram-v2`)
- "er" (matches `erDiagram`)
- "gantt" (matches `gantt`)
- "pie" (matches `pie`)
- "timeline" (matches `timeline`)
- "mindmap" (matches `mindmap`)
- "block" (matches `block-beta`)
- "other" (fallback)

**stripExistingTheme(code) -> string**

Remove any existing:
- YAML frontmatter blocks (between `---` delimiters at start of code)
- `%%{init: ...}%%` directives
- Existing `classDef` lines (if user wants a clean injection)
Preserve everything else.

**injectTheme(code, tokens, options) -> string**

Options: `{ format: "yaml" | "init", includeClassDefs: boolean }`

1. Strip existing theme from code
2. Detect diagram type
3. For flowchart/graph/block-beta: inject frontmatter (or init), then diagram declaration line, then classDefs + linkStyle, then remaining code
4. For all other types: inject frontmatter (or init), then the entire original code
5. Return the assembled styled code string

### Done signal: Paste a plain `sequenceDiagram` and get back the same diagram with YAML frontmatter prepended. Paste a plain `flowchart LR` and get back the diagram with frontmatter, classDefs, and linkStyle injected. The styled code renders correctly in the preview panel.

---

## Phase 7: Theme Extraction (Extract Mode)

### src/extractor.js

**extractFromInit(code) -> partial token object or null**

Regex-parse `%%{init: ...}%%` directive for themeVariables values. Map known variable names to token keys:
- `primaryColor` -> (note: in BFS system this is white, so may not map directly)
- `lineColor` -> primaryDeep
- `clusterBorder` -> primaryDeep
- `titleColor` -> primaryDark
- `background` -> canvas
- `clusterBkg` -> panel
- etc.

**extractFromFrontmatter(code) -> partial token object or null**

Parse YAML frontmatter block for the same themeVariables.

**extractFromClassDefs(code) -> partial token object or null**

Parse classDef declarations for fill and stroke hex values. Use heuristics to map:
- The most common fill color -> likely supportMed or neutral
- The most common stroke color -> likely primaryDark
- Any red (#C8xxxx range) -> signalRed
- Any very dark color (#0-3xxxxx range) -> primaryDark or primaryDeep
- Font family from fontFamily themeVariable -> fontFamily

**extractTheme(code) -> partial token object**

Run all three extractors, merge results (init/frontmatter take priority over classDef inference), return the best-guess token mapping.

### Done signal: Paste one of the three original BFS diagrams from this project's reference material. The color pickers populate with values that approximately match the BFS Light preset. Adjusting a picker updates the code and re-renders the preview.

---

## Phase 8: Polish and Build

1. Add error handling: invalid hex values in pickers, mermaid render failures, empty paste textarea
2. Add the Download .md button for the Full System output
3. Test all four presets: load each, verify outputs, verify preview
4. Test diagram injection with at least these diagram types: flowchart LR, flowchart TD, sequenceDiagram, classDiagram, pie, timeline, mindmap
5. Test theme extraction with at least one styled diagram
6. Run `npm run build`, verify dist/ output works as standalone static files
7. Open dist/index.html directly in browser (no server) to confirm it works

### Done signal: `npm run build` produces a dist/ folder. Opening dist/index.html in a browser shows the fully functional tool with no console errors. All three modes work. All four presets work. Copy-to-clipboard works.

---

## Deployment Notes

After build, the dist/ folder contents are the production deployment. To deploy on GitHub Pages:

Option A: Enable GitHub Pages from the `dist/` folder via a GitHub Action that runs `npm run build` on push.

Option B: Copy dist/ contents into the target directory of the overkillhill.com website repo.

The tool loads mermaid.js from cdn.jsdelivr.net at runtime. No other external dependencies. Total deployment is approximately 3-5 files (index.html, one JS bundle, one CSS file, possibly a favicon).
