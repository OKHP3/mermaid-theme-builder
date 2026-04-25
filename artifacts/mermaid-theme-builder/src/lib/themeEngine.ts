import type { Palette } from "./palettes";
import type { DiagramFamily } from "./detector";

export interface ExportOptions {
  palette: Palette;
  diagramFamily: DiagramFamily;
  includeMetaComments: boolean;
  includeBadge: boolean;
  customThemeName?: string;
}

const TOOL_URL = "https://overkillhill.com/projects/mermaid-theme-builder/";
const TOOL_VERSION = "0.1.0";

const BADGE_SAFE_FAMILIES: DiagramFamily[] = ["flowchart", "sequenceDiagram", "stateDiagram", "classDiagram"];

function buildThemeVars(palette: Palette): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const color of palette.colors) {
    vars[color.key] = color.value;
  }
  return vars;
}

function buildInitDirective(palette: Palette): string {
  const vars = buildThemeVars(palette);

  const varEntries = Object.entries(vars)
    .filter(([k]) => k !== "fontFamily")
    .map(([k, v]) => `"${k}": "${v}"`)
    .join(", ");

  const fontFamilyEntry = vars["fontFamily"] ? `"fontFamily": "${vars["fontFamily"]}"` : null;
  const themeVarsStr = [varEntries, fontFamilyEntry].filter(Boolean).join(", ");

  return `%%{init: {"theme": "base", "themeVariables": {${themeVarsStr}}}}%%`;
}

function buildMetaComments(palette: Palette, themeName: string): string {
  const now = new Date().toISOString();
  const lines = [
    `%% Created with: ${TOOL_VERSION ? `Mermaid Theme Builder v${TOOL_VERSION}` : "Mermaid Theme Builder"}`,
    `%% Tool: ${TOOL_URL}`,
    `%% Theme: ${themeName}`,
    `%% Theme ID: ${palette.id}`,
    `%% Theme Version: ${palette.version}`,
    `%% Generated: ${now}`,
  ];
  if (palette.isBrandPreset && palette.sourceUrls?.[0]) {
    lines.push(`%% Brand source: ${palette.sourceUrls[0]}`);
  }
  lines.push(`%% Personal OverKill Hill P³ project by Jamie Hill — overkillhill.com`);
  lines.push(`%% Not affiliated with Builders FirstSource, Mermaid, Mermaid Chart, or Mermaid.ai`);
  return lines.join("\n");
}

function buildBadgeNode(palette: Palette, themeName: string, diagramFamily: DiagramFamily): string {
  if (!BADGE_SAFE_FAMILIES.includes(diagramFamily)) return "";

  const borderColor = palette.colors.find((c) => c.key === "primaryBorderColor")?.value ?? "#888";
  const bgColor = palette.colors.find((c) => c.key === "secondaryColor")?.value ?? "#333";
  const textColor = palette.colors.find((c) => c.key === "primaryTextColor")?.value ?? "#fff";

  const label = `Themed with Mermaid Theme Builder · ${themeName}`;
  const nodeId = "_mtb_attr";

  const lines = [
    `    ${nodeId}["${label}"]`,
    `    style ${nodeId} fill:${bgColor},stroke:${borderColor},color:${textColor},font-size:9px,opacity:0.7`,
  ];

  if (diagramFamily === "flowchart") {
    lines.push(`    click ${nodeId} href "${TOOL_URL}" _blank`);
  }

  return lines.join("\n");
}

export function generateThemedCode(originalCode: string, options: ExportOptions): string {
  const { palette, diagramFamily, includeMetaComments, includeBadge, customThemeName } = options;
  const themeName = customThemeName?.trim() || palette.name;

  const strippedCode = originalCode
    .replace(/%%\s*\{.*?\}.*?%%\s*\n?/gs, "")
    .replace(/\n\s*_mtb_attr\[.*?\]\n?/g, "")
    .replace(/\n\s*style _mtb_attr.*\n?/g, "")
    .replace(/\n\s*click _mtb_attr.*\n?/g, "")
    .trimStart();

  const initDirective = buildInitDirective(palette);
  const metaComments = includeMetaComments ? buildMetaComments(palette, themeName) : null;
  const badge = includeBadge ? buildBadgeNode(palette, themeName, diagramFamily) : null;

  const parts = [initDirective];
  if (metaComments) parts.push(metaComments);
  parts.push(strippedCode.trimEnd());
  if (badge) parts.push(badge);

  return parts.join("\n");
}

export function generateMarkdownExport(themedCode: string, palette: Palette, options: ExportOptions): string {
  const { customThemeName } = options;
  const themeName = customThemeName?.trim() || palette.name;
  const isCustom = !!customThemeName?.trim() && customThemeName.trim() !== palette.name;
  const displayLabel = isCustom ? `Custom — based on ${palette.name}` : palette.name;
  const now = new Date().toISOString().split("T")[0];

  const sourceSection = palette.sourceUrls?.length
    ? `\n**Brand sources:** ${palette.sourceUrls.map((u) => `[${u}](${u})`).join(" · ")}`
    : "";

  const intentSection = palette.themeIntent
    ? `\n**Use for:** ${palette.themeIntent}`
    : "";

  const warningNote = `\n> ⚠️ **Renderer note:** The \`%%{init}%%\` directive is supported by Mermaid.js v9+ and most modern renderers. GitHub Markdown, Notion, and some other tools may strip or ignore theme variables.`;

  const disclaimerNote = `\n> _Mermaid Theme Builder is a personal [OverKill Hill P³](https://overkillhill.com) project by Jamie Hill. Not affiliated with Builders FirstSource, Mermaid, Mermaid Chart, or Mermaid.ai. All transformations are local — your diagram code never leaves the browser._`;

  return `# Mermaid Diagram — ${themeName} Theme

**Theme:** ${displayLabel}  
**Theme ID:** \`${palette.id}\`  
**Version:** ${palette.version}  
**Generated:** ${now}  
**Tool:** [Mermaid Theme Builder](${TOOL_URL})${sourceSection}${intentSection}

## Usage

Paste the code block below into any Mermaid-compatible renderer. The \`%%{init}%%\` directive applies the theme automatically.

\`\`\`mermaid
${themedCode}
\`\`\`

## Recommended diagram families

${palette.themeIntent ? `This theme was designed for: **${palette.themeIntent}**` : "This theme works well with flowcharts, sequence diagrams, and class diagrams."}

## Attribution

Generated with [Mermaid Theme Builder](${TOOL_URL}) · Theme: **${themeName}**${warningNote}${disclaimerNote}
`;
}

function getBrandGuidance(palette: Palette): string {
  if (!palette.isBrandPreset) return "";

  const guidanceMap: Record<string, string> = {
    "overkill-hill": `
## Brand Guidance — OverKill Hill P³

Use this theme for:
- Technical architecture diagrams
- Systems design and infrastructure maps
- AI tooling and orchestration flows
- Strategy and executive-facing presentations
- Anything that needs to look precise, structured, and serious

Do NOT use this theme for:
- Consumer-facing or casual content
- Playful or lightweight explainers`,

    "askjamie": `
## Brand Guidance — AskJamie

Use this theme for:
- Support flows and helpdesk processes
- Step-by-step user guidance diagrams
- AI assistant conversation flows
- Explainer diagrams for non-technical users
- Onboarding and "how it works" content

Do NOT use this theme for:
- Deep technical architecture (use OverKill Hill P³ instead)
- Executive strategy decks`,

    "glee-fully": `
## Brand Guidance — Glee-fully

Use this theme for:
- Personal productivity and life-organization diagrams
- Family-friendly and consumer-facing content
- Approachable process explainers
- Warm, non-intimidating workflow diagrams

Do NOT use this theme for:
- Technical or enterprise-facing content (use OverKill Hill P³ or a utility theme instead)`,
  };

  return guidanceMap[palette.id] ?? "";
}

/** Build a YAML frontmatter block (Mermaid v10.5+ format).
 *  Returns the full ---...--- block as a string.
 */
function buildFrontmatter(palette: Palette): string {
  const vars = buildThemeVars(palette);
  const themeLines = Object.entries(vars)
    .map(([k, v]) => `    ${k}: "${v}"`)
    .join("\n");

  return `---
config:
  theme: base
  themeVariables:
${themeLines}
---`;
}

/** Build a 16-entry semantic classDef library from palette hex values.
 *
 *  Classes are derived entirely from the palette's own color tokens —
 *  no BFS or third-party brand values are ever used here.
 *
 *  The "redDash" class uses a fixed deep-red (#3b0e0e / #b91c1c) that is
 *  an accessibility/warning marker, NOT a brand color.
 */
function buildClassDefLibrary(palette: Palette): string {
  const c = (key: string, fallback: string) =>
    palette.colors.find((cl) => cl.key === key)?.value ?? fallback;

  const primary        = c("primaryColor",       "#111827");
  const primaryText    = c("primaryTextColor",    "#f0f0f0");
  const primaryBorder  = c("primaryBorderColor",  "#888888");
  const secondary      = c("secondaryColor",      "#1f2937");
  const tertiary       = c("tertiaryColor",       "#374151");
  const background     = c("background",          "#ffffff");
  const mainBkg        = c("mainBkg",             "#1e2330");
  const nodeBorder     = c("nodeBorder",          "#888888");
  const clusterBkg     = c("clusterBkg",          "#111827");
  const titleColor     = c("titleColor",          "#e0e0e0");
  const lineColor      = c("lineColor",           "#888888");

  const classes = [
    { name: "primary",     fill: primary,    stroke: primaryBorder, color: primaryText,  extra: "" },
    { name: "secondary",   fill: secondary,  stroke: primaryBorder, color: primaryText,  extra: "" },
    { name: "tertiary",    fill: tertiary,   stroke: nodeBorder,    color: primaryText,  extra: "" },
    { name: "platform",    fill: mainBkg,    stroke: lineColor,     color: primaryText,  extra: "" },
    { name: "boundary",    fill: clusterBkg, stroke: lineColor,     color: titleColor,   extra: "stroke-dasharray:5" },
    { name: "actor",       fill: primary,    stroke: primaryBorder, color: primaryText,  extra: "font-weight:bold" },
    { name: "gate",        fill: primaryBorder, stroke: nodeBorder, color: background,   extra: "" },
    { name: "control",     fill: tertiary,   stroke: nodeBorder,    color: primaryText,  extra: "" },
    { name: "log",         fill: secondary,  stroke: lineColor,     color: primaryText,  extra: "font-style:italic" },
    { name: "question",    fill: mainBkg,    stroke: lineColor,     color: titleColor,   extra: "stroke-dasharray:3" },
    { name: "accent",      fill: lineColor,  stroke: nodeBorder,    color: background,   extra: "" },
    { name: "deepBlue",    fill: primary,    stroke: nodeBorder,    color: primaryText,  extra: "stroke-width:2px" },
    { name: "slate",       fill: background, stroke: lineColor,     color: primary,      extra: "" },
    { name: "scope",       fill: clusterBkg, stroke: primaryBorder, color: titleColor,   extra: "stroke-width:2px" },
    { name: "outOfScope",  fill: background, stroke: nodeBorder,    color: primaryText,  extra: "stroke-dasharray:8,opacity:0.6" },
    { name: "redDash",     fill: "#3b0e0e",  stroke: "#b91c1c",     color: "#fecaca",    extra: "stroke-dasharray:4" },
  ];

  return classes
    .map(({ name, fill, stroke, color, extra }) => {
      const style = [`fill:${fill}`, `stroke:${stroke}`, `color:${color}`, extra].filter(Boolean).join(",");
      return `    classDef ${name} ${style}`;
    })
    .join("\n");
}

/** Build 6-tier subgraph style patterns for the given palette. */
function buildSubgraphTiers(palette: Palette): string {
  const c = (key: string, fallback: string) =>
    palette.colors.find((cl) => cl.key === key)?.value ?? fallback;

  const primary      = c("primaryColor",      "#111827");
  const secondary    = c("secondaryColor",    "#1f2937");
  const tertiary     = c("tertiaryColor",     "#374151");
  const clusterBkg   = c("clusterBkg",        "#111827");
  const background   = c("background",        "#ffffff");
  const lineColor    = c("lineColor",         "#888888");
  const primaryBorder = c("primaryBorderColor", "#888888");
  const titleColor   = c("titleColor",        "#e0e0e0");

  return `    %% Tier 1 — Primary system boundary (most prominent)
    style SubgraphName fill:${primary},stroke:${primaryBorder},color:${titleColor}

    %% Tier 2 — Secondary system or service grouping
    style SubgraphName fill:${secondary},stroke:${lineColor},color:${titleColor}

    %% Tier 3 — Tertiary context or supporting group
    style SubgraphName fill:${tertiary},stroke:${lineColor},color:${titleColor}

    %% Tier 4 — Cluster / infrastructure boundary
    style SubgraphName fill:${clusterBkg},stroke:${lineColor},color:${titleColor},stroke-dasharray:5

    %% Tier 5 — Out-of-scope / external system
    style SubgraphName fill:${background},stroke:${lineColor},color:${primary},stroke-dasharray:8,opacity:0.7

    %% Tier 6 — Annotation / note boundary (no fill)
    style SubgraphName fill:transparent,stroke:${lineColor},color:${titleColor},stroke-dasharray:2`;
}

export function generatePromptScaffold(palette: Palette, options: ExportOptions): string {
  const { diagramFamily, customThemeName } = options;
  const themeName = customThemeName?.trim() || palette.name;
  const isCustom = !!customThemeName?.trim() && customThemeName.trim() !== palette.name;
  const displayLabel = isCustom ? `Custom — based on ${palette.name}` : palette.name;
  const familyName = diagramFamily === "unknown" ? "Mermaid" : diagramFamily;

  const colorLines = palette.colors
    .filter((c) => !["fontFamily", "edgeLabelBackground"].includes(c.key))
    .map((c) => `  - ${c.label}: \`${c.value}\``)
    .join("\n");

  const initBlock = buildInitDirective(palette);
  const frontmatterBlock = buildFrontmatter(palette);
  const classDefBlock = buildClassDefLibrary(palette);
  const subgraphBlock = buildSubgraphTiers(palette);
  const brandGuidance = getBrandGuidance(palette);

  const metaBlock = `%% Theme: ${themeName}
%% Theme ID: ${palette.id}
%% Tool: ${TOOL_URL}
%% Personal OverKill Hill P³ project by Jamie Hill — overkillhill.com
%% Not affiliated with Builders FirstSource, Mermaid, Mermaid Chart, or Mermaid.ai`;

  const sourceNote = palette.sourceUrls?.length
    ? `\n**Source:** ${palette.sourceUrls[0]}`
    : "";

  const diagramTypeExample =
    diagramFamily === "flowchart" || diagramFamily === "unknown"
      ? `flowchart TD
    A[Start] --> B[Process]
    B:::primary --> C{Decision}:::gate
    C -->|Yes| D[End]:::accent
    C -->|No| B`
      : `${diagramFamily}
    %% Your diagram here`;

  return `# Mermaid Diagram Prompt Scaffold — ${themeName}

**Theme:** ${displayLabel}  
**Theme ID:** \`${palette.id}\`  
**Version:** ${palette.version}  
**Tool:** [Mermaid Theme Builder](${TOOL_URL})${sourceNote}

---

<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- PART 1 — THREAD OPENER                                             -->
<!-- Paste this entire section as your first message in a new AI thread -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

## Instructions for AI

When generating ${familyName} diagrams, apply the following visual theme exactly as specified. Do not invent new colors, do not add extra CSS overrides, and do not change the theme directive.
${brandGuidance}

---

## Required: Theme directive

Choose ONE of the two formats below based on your renderer. Never use both in the same diagram.

### Format A — \`%%{init}%%\` directive (universal, Mermaid v9+)

> Use this for: Microsoft Loop, Notion, older renderers, or anywhere YAML frontmatter is not supported.

\`\`\`
${initBlock}
\`\`\`

### Format B — YAML frontmatter (preferred, Mermaid v10.5+)

> Use this for: Mermaid Live Editor, VS Code with Mermaid extension, GitHub (where supported). This format is the current Mermaid standard and deprecates \`%%{init}%%\`.

\`\`\`
${frontmatterBlock}
\`\`\`

---

## Required: Metadata comments

Add these comment lines immediately after the theme directive:

\`\`\`
${metaBlock}
\`\`\`

---

## Semantic classDef library

This is the complete styling vocabulary for this theme. Apply these classDef classes to nodes using \`:::className\` syntax. Do NOT add any other fill, stroke, or color values — use only these classes.

\`\`\`mermaid
${initBlock}
flowchart TD
${classDefBlock}

    %% Usage example: NodeLabel:::primary
    %% Apply a class to a node: A[My Node]:::secondary
    %% Apply to a decision node: B{Choice}:::gate
\`\`\`

### Class reference table

| Class | Role | When to use |
|-------|------|-------------|
| \`primary\` | Main action / primary entity | Core nodes, key steps, subject of the diagram |
| \`secondary\` | Supporting / related entity | Adjacent systems, related processes |
| \`tertiary\` | Background / context | Passive nodes, reference items |
| \`platform\` | Platform / infrastructure | Hosting layer, operating environment |
| \`boundary\` | System boundary (dashed) | External system boundaries, context limits |
| \`actor\` | Person / user / role | Human actors, teams, personas |
| \`gate\` | Decision / gateway | Diamond decision nodes, routing logic |
| \`control\` | Control / management | Orchestrators, managers, approval nodes |
| \`log\` | Log / audit / record (italic) | Audit trails, event logs, history |
| \`question\` | Open question / TBD (dashed) | Unknowns, pending decisions, assumptions |
| \`accent\` | Highlighted / key result | Outcomes, final states, primary outputs |
| \`deepBlue\` | Deep emphasis / dark primary | Stressed primary nodes, thick border variant |
| \`slate\` | Neutral / muted | Low-priority nodes, supporting details |
| \`scope\` | In-scope boundary | Items explicitly in scope |
| \`outOfScope\` | Out-of-scope (faded, dashed) | Explicitly excluded items |
| \`redDash\` | Warning / error / blocker | Error states, blockers, known failures |

---

## Subgraph tier patterns

Use \`style SubgraphName ...\` statements to apply visual hierarchy to subgraphs. Replace \`SubgraphName\` with the actual subgraph ID.

\`\`\`mermaid
${initBlock}
flowchart TD
${subgraphBlock}
\`\`\`

---

## Theme: ${themeName}

${palette.description}
${palette.themeIntent ? `\n**Intended use:** ${palette.themeIntent}` : ""}

### Color reference
${colorLines}

### Font
\`${palette.colors.find((c) => c.key === "fontFamily")?.value ?? "system-ui, sans-serif"}\`

---

## Rules

1. ALWAYS start the diagram with the theme directive (Format A or Format B above) — no exceptions.
2. Add the metadata comment block immediately after the theme directive.
3. Use \`${diagramFamily === "unknown" ? "flowchart TD" : diagramFamily === "flowchart" ? "flowchart TD" : diagramFamily}\` as the diagram type unless the user specifies otherwise.
4. Keep node labels concise (under 60 characters each).
5. Style nodes using ONLY the classDef classes defined above — apply with \`:::className\` syntax.
6. Do NOT add inline \`fill:\`, \`stroke:\`, or \`color:\` values on individual nodes — use classDef classes instead.
7. Do NOT change any color values — reproduce them exactly as shown.
8. Use subgraph tier styles for visual hierarchy — never leave subgraphs unstyled.
9. If the diagram type changes, preserve the exact same theme directive.
10. If the diagram type does not support classDef (e.g. sequenceDiagram, erDiagram), omit classDef statements entirely — the theme directive handles all styling.

---

## Example output structure

\`\`\`mermaid
${initBlock}
${metaBlock}
${diagramTypeExample}
\`\`\`

---

<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- PART 2 — UPDATE PROMPT (style drift prevention)                    -->
<!-- Use this when continuing a diagram thread and style has drifted    -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

## Update Prompt — paste this when style has drifted

> Copy the block below into your AI thread when you notice the diagram is missing its theme directive, using wrong colors, or has lost classDef classes.

---

**[UPDATE — Restore theme contract]**

The diagram above has drifted from the required visual theme. Please regenerate it in full with the following corrections applied:

1. Restore the theme directive at the very top (use Format A or B from the original scaffold — do not omit it).
2. Restore the metadata comment block immediately after the directive.
3. Re-apply all node classes using the classDef vocabulary from the original scaffold. Do not add any inline color values.
4. Do not change any logic, labels, or relationships — only restore the visual styling contract.
5. Output the complete diagram from top to bottom — do not abbreviate or use "..." placeholders.

Theme contract reference:
- Theme: **${themeName}** (\`${palette.id}\`)
- Primary node color: \`${palette.colors.find((c) => c.key === "primaryColor")?.value ?? "n/a"}\`
- Border color: \`${palette.colors.find((c) => c.key === "primaryBorderColor")?.value ?? "n/a"}\`
- Accent / line color: \`${palette.colors.find((c) => c.key === "lineColor")?.value ?? "n/a"}\`
- Font: \`${palette.colors.find((c) => c.key === "fontFamily")?.value ?? "system-ui, sans-serif"}\`

---

<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- PART 3 — REPAIR PROMPT (parse error recovery)                      -->
<!-- Use this when Mermaid throws a parse or render error               -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

## Repair Prompt — paste this when the diagram has a parse error

> Copy the block below and fill in the \`[PASTE ERROR HERE]\` section with the actual error text from your renderer.

---

**[REPAIR — Fix parse error without changing theme]**

The diagram below is failing to render with the following error:

\`\`\`
[PASTE ERROR HERE]
\`\`\`

Please repair the diagram so it renders correctly. Rules for this repair:

1. Fix only the syntax or structural issue causing the parse error.
2. Do NOT change the theme directive (\`%%{init}%%\` or YAML frontmatter), metadata comments, or any classDef statements.
3. Do NOT change any color values or add inline styling.
4. Do NOT restructure the diagram logic unless the structure itself is the cause of the error.
5. Output the complete repaired diagram from top to bottom — do not abbreviate.

If the error is caused by an unsupported feature for this diagram type, note the limitation and propose the minimal change needed to fix it while preserving as much of the original intent as possible.

---

*Generated by [Mermaid Theme Builder](${TOOL_URL}) — paste PART 1 into your AI thread to maintain visual consistency. Use PART 2 to restore drift. Use PART 3 to fix parse errors.*  
*Mermaid Theme Builder is a personal [OverKill Hill P³](https://overkillhill.com) project by Jamie Hill. Not affiliated with Builders FirstSource, Mermaid, Mermaid Chart, or Mermaid.ai.*
`;
}
