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
  lines.push(`%% Not affiliated with Mermaid, Mermaid Chart, or Mermaid.ai`);
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

  const disclaimerNote = `\n> _Not affiliated with Mermaid, Mermaid Chart, or Mermaid.ai. All transformations are local — your diagram code never leaves the browser._`;

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

  const initBlock = `%%{init: {"theme": "base", "themeVariables": {${palette.colors
    .filter((c) => c.key !== "fontFamily")
    .map((c) => `"${c.key}": "${c.value}"`)
    .join(", ")}}}}%%`;

  const metaBlock = `%% Theme: ${themeName}
%% Theme ID: ${palette.id}
%% Tool: ${TOOL_URL}
%% Not affiliated with Mermaid, Mermaid Chart, or Mermaid.ai`;

  const brandGuidance = getBrandGuidance(palette);

  const sourceNote = palette.sourceUrls?.length
    ? `\n**Source:** ${palette.sourceUrls[0]}`
    : "";

  return `# Mermaid Diagram Prompt Scaffold — ${themeName}

**Theme:** ${displayLabel}  
**Theme ID:** \`${palette.id}\`  
**Version:** ${palette.version}  
**Tool:** [Mermaid Theme Builder](${TOOL_URL})${sourceNote}

---

## Instructions for AI

When generating ${familyName} diagrams, apply the following visual theme exactly as specified. Do not invent new colors, do not add extra CSS overrides, and do not change the init directive.
${brandGuidance}

---

## Required: %%{init}%% directive

Add this directive at the VERY TOP of EVERY diagram — before the diagram type keyword.

\`\`\`
${initBlock}
\`\`\`

## Required: Metadata comments

Add these comment lines immediately after the \`%%{init}%%\` directive:

\`\`\`
${metaBlock}
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

1. ALWAYS start the diagram with the \`%%{init:...}%%\` directive above — no exceptions.
2. Add the metadata comment block immediately after the init directive.
3. Use \`${diagramFamily === "unknown" ? "flowchart TD" : diagramFamily === "flowchart" ? "flowchart TD" : diagramFamily}\` as the diagram type unless the user specifies otherwise.
4. Keep node labels concise (under 60 characters each).
5. Do NOT add extra CSS or styling overrides — the init directive handles all visual styling.
6. Sub-graphs and clusters inherit the theme automatically — use them freely.
7. Do NOT change any color values — reproduce them exactly as shown above.
8. If the diagram type changes, preserve the exact same \`%%{init}%%\` directive.

---

## Example output structure

\`\`\`mermaid
${initBlock}
${metaBlock}
${diagramFamily === "flowchart" || diagramFamily === "unknown" ? `flowchart TD
    A[Start] --> B[Process]
    B --> C{Decision}
    C -->|Yes| D[End]
    C -->|No| B` : `${diagramFamily}
    %% Your diagram here`}
\`\`\`

---

*Generated by [Mermaid Theme Builder](${TOOL_URL}) — paste this scaffold into your AI prompt to maintain visual consistency across all diagrams.*
*Not affiliated with Mermaid, Mermaid Chart, or Mermaid.ai.*
`;
}
