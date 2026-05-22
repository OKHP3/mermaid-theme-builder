import type { Palette } from "./palettes";
import type { DiagramFamily } from "./detector";
import { familyThemeOverlay } from "./familyTheming";
import { typographyToScaffoldSection, type TypographySettings } from "./typography";
import { rendererToScaffoldSection, buildRendererHeaderComment, getRendererById } from "../data/renderer-parity";

// ── Markdown output sanitizers ──────────────────────────────────────────────
// These helpers prevent attacker-controlled palette metadata (imported via
// .theme.json files or ?theme= share tokens) from injecting active content
// into generated Markdown artifacts.

/** Sanitize a string for insertion into Markdown body/heading/bold contexts.
 *  - Strips CR/LF so attacker input cannot break heading or paragraph structure.
 *  - HTML-escapes < > & so raw HTML tags cannot be injected into the artifact.
 *  - Backslash-escapes [ ] ( ) so attacker input cannot synthesise Markdown links
 *    (e.g. `[label](javascript:...)`) inside fields that are not URL-valued. */
function sanitizeMdText(s: string): string {
  return s
    .replace(/[\r\n]/g, " ")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

/** Sanitize a string for insertion into a Markdown inline-code span (`` `...` ``).
 *  Strips CR/LF and backticks so the attacker cannot break out of the span.
 *  Also HTML-escapes < > & as defense-in-depth for permissive renderers. */
function sanitizeMdCode(s: string): string {
  return s
    .replace(/[\r\n`]/g, " ")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Sanitize a string for insertion into a fenced code block line.
 *  Strips CR/LF and backticks to prevent premature fence termination. */
function sanitizeFenceContent(s: string): string {
  return s.replace(/[\r\n`]/g, " ");
}

/** Accept only http: and https: URLs for Markdown link generation.
 *  Returns the URL constructor's re-serialized href (which percent-encodes
 *  characters like [ ] ( ) that could break Markdown link syntax), or null
 *  for any other scheme (e.g. javascript:, data:, vbscript:). */
function sanitizeSourceUrl(u: string): string | null {
  try {
    const parsed = new URL(u);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") return parsed.href;
    return null;
  } catch {
    return null;
  }
}

export type MermaidLook = "classic" | "neo" | "handDrawn";

export interface WatermarkOptions {
  enabled: boolean;
  themeName: string;
  toolUrl?: string;
}

export interface ExportOptions {
  palette: Palette;
  diagramFamily: DiagramFamily;
  includeMetaComments: boolean;
  includeBadge: boolean;
  customThemeName?: string;
  look?: MermaidLook;
  fontSize?: string;
  typography?: TypographySettings;
  rendererTarget?: string;
}

const TOOL_URL = "https://overkillhill.com/projects/mermaid-theme-builder/";
const TOOL_VERSION = "0.5.0";

const BADGE_SAFE_FAMILIES: DiagramFamily[] = ["flowchart", "sequenceDiagram", "stateDiagram", "classDiagram"];

export const CLASSDEF_CAPABLE_FAMILIES: DiagramFamily[] = ["flowchart", "classDiagram", "stateDiagram", "block"];

function buildThemeVars(palette: Palette): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const color of palette.colors) {
    vars[color.key] = color.value;
  }
  return vars;
}

/**
 * 5-tier typography → Mermaid themeVariable mapping table.
 *
 * Mermaid's themeVariables have limited typography support. The table below
 * documents the full 5-tier model and whether each tier has a direct
 * themeVariable key or requires CSS injection only:
 *
 * | Tier              | themeVariable / config key | Family support     |
 * |-------------------|----------------------------|--------------------|
 * | diagramTitle      | (CSS only: .label)         | flowchart only     |
 * | subgraphTitle     | (CSS only: .cluster-label) | flowchart only     |
 * | nestedSubgraph    | (CSS only: .cluster-label) | flowchart only     |
 * | nodeLabel         | `fontSize` themeVariable   | universal          |
 * | edgeLabel         | (CSS only: .edgeLabel)     | flowchart only     |
 *
 * Additionally, for sequence diagrams `config.sequence.fontSize` is emitted
 * and must always match the resolved `fontSize` themeVariable to stay
 * consistent (see buildInitDirective for resolution order).
 *
 * Per-tier fontFamily overrides: only `nodeLabel.fontFamily` is mapped to the
 * universal `fontFamily` themeVariable; tier-specific overrides for other tiers
 * (diagramTitle, subgraphTitle, etc.) are CSS-only and go into the Prompt
 * Scaffold via typographyToScaffoldSection(), not the init directive.
 *
 * Keys unsupported by a diagram family are silently omitted.
 */
function applyTypographyToVars(
  vars: Record<string, string>,
  typography: TypographySettings,
): void {
  // nodeLabel.fontSize → universal `fontSize` themeVariable (lower priority than
  // explicit fontSize override — caller applies the explicit override after this).
  vars["fontSize"] = `${typography.nodeLabel.fontSize}px`;

  // nodeLabel.fontFamily → universal `fontFamily` themeVariable, but only when
  // the palette has not already provided one (palette value wins).
  if (typography.nodeLabel.fontFamily && !vars["fontFamily"]) {
    vars["fontFamily"] = typography.nodeLabel.fontFamily;
  }
}

function buildInitDirective(
  palette: Palette,
  family: DiagramFamily = "flowchart",
  look?: MermaidLook,
  fontSize?: string,
  typography?: TypographySettings,
): string {
  const baseVars = buildThemeVars(palette);
  const overlay = familyThemeOverlay(palette, family);
  // Base palette tokens win over family-derived defaults so user edits propagate.
  const vars = { ...overlay, ...baseVars };

  // Typography-derived values are applied next (lower priority than explicit fontSize).
  if (typography) {
    applyTypographyToVars(vars, typography);
  }

  // Explicit fontSize override has highest priority — always wins if set.
  if (fontSize) vars["fontSize"] = fontSize;

  // --- vars["fontSize"] is now the single resolved effective font size ---
  // All downstream references (themeVariables + family config) must read from
  // vars["fontSize"] so explicit and typography-derived sizes never conflict.

  const varEntries = Object.entries(vars)
    .filter(([k]) => k !== "fontFamily")
    .map(([k, v]) => `"${k}": "${v}"`)
    .join(", ");

  const fontFamilyEntry = vars["fontFamily"] ? `"fontFamily": "${vars["fontFamily"]}"` : null;
  const themeVarsStr = [varEntries, fontFamilyEntry].filter(Boolean).join(", ");

  const lookEntry = look && look !== "classic" ? `"look": "${look}", ` : "";
  const archEntry = family === "architectureBeta" ? `"architecture": {"randomize": false}, ` : "";

  // Sequence-specific config: emit `sequence.fontSize` using the SAME resolved
  // effective fontSize as themeVariables.fontSize so both always agree.
  // Only emit when typography is active (opt-in) to avoid changing existing exports.
  let extraConfig = "";
  if (typography && family === "sequenceDiagram" && vars["fontSize"]) {
    const resolvedPx = vars["fontSize"];
    const numericSize = parseInt(resolvedPx, 10);
    if (!isNaN(numericSize)) {
      extraConfig = `"sequence": {"fontSize": ${numericSize}}, `;
    }
  }

  return `%%{init: {${lookEntry}"theme": "base", ${archEntry}${extraConfig}"themeVariables": {${themeVarsStr}}}}%%`;
}

function buildMetaComments(palette: Palette, themeName: string): string {
  const now = new Date().toISOString();
  const safeThemeName = sanitizeMdText(themeName);
  const safeId = sanitizeMdText(palette.id);
  const lines = [
    `%% Theme: ${safeThemeName}`,
    `%% Theme ID: ${safeId}`,
    `%% Theme Version: ${sanitizeFenceContent(palette.version)}`,
    `%% Created with: Mermaid Theme Builder by OverKill Hill P³`,
    `%% Tool URL: ${TOOL_URL}`,
    `%% Tool Version: ${TOOL_VERSION}`,
    `%% Theme Created: ${now}`,
    `%% Theme Updated: ${now}`,
  ];
  const safeBrandUrl = palette.isBrandPreset && palette.sourceUrls?.[0] ? sanitizeSourceUrl(palette.sourceUrls[0]) : null;
  if (safeBrandUrl) {
    lines.push(`%% Brand source: ${safeBrandUrl}`);
  }
  lines.push(`%% Personal OverKill Hill P³ project by Jamie Hill — overkillhill.com`);
  lines.push(`%% Not affiliated with Builders FirstSource, Mermaid, Mermaid Chart, or Mermaid.ai`);
  return lines.join("\n");
}

function buildBadgeNode(palette: Palette, themeName: string, diagramFamily: DiagramFamily): string {
  if (!BADGE_SAFE_FAMILIES.includes(diagramFamily)) return "";

  const nodeId = "MTB_ATTR";
  const label = `Styled with ${themeName} via Mermaid Theme Builder`;

  const lines = [
    `    ${nodeId}(["${label}"])`,
    `    classDef mtb_watermark fill:none,stroke:#888,stroke-width:1px,color:#888,font-size:10px`,
    `    class ${nodeId} mtb_watermark`,
  ];

  if (diagramFamily === "flowchart") {
    lines.push(`    click ${nodeId} "${TOOL_URL}" _blank`);
  }

  return lines.join("\n");
}

export function generateThemedCode(originalCode: string, options: ExportOptions): string {
  const { palette, diagramFamily, includeMetaComments, includeBadge, customThemeName } = options;
  const themeName = customThemeName?.trim() || palette.name;

  const strippedCode = originalCode
    .replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, "")
    .replace(/%%\s*\{.*?\}.*?%%\s*\n?/gs, "")
    .replace(/\n\s*_mtb_attr\[.*?\]\n?/g, "")
    .replace(/\n\s*style _mtb_attr.*\n?/g, "")
    .replace(/\n\s*click _mtb_attr.*\n?/g, "")
    .replace(/\n\s*MTB_ATTR\(.*?\)\n?/g, "")
    .replace(/\n\s*classDef mtb_watermark.*\n?/g, "")
    .replace(/\n\s*class MTB_ATTR.*\n?/g, "")
    .replace(/\n\s*click MTB_ATTR.*\n?/g, "")
    .trimStart();

  const initDirective = buildInitDirective(palette, diagramFamily, options.look, options.fontSize, options.typography);
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
  const rawThemeName = customThemeName?.trim() || palette.name;
  const themeName = sanitizeMdText(rawThemeName);
  const isCustom = !!customThemeName?.trim() && customThemeName.trim() !== palette.name;
  const displayLabel = sanitizeMdText(isCustom ? `Custom — based on ${palette.name}` : palette.name);
  const paletteId = sanitizeMdCode(palette.id);
  const now = new Date().toISOString().split("T")[0];

  const safeSourceUrls = (palette.sourceUrls ?? []).map(sanitizeSourceUrl).filter((u): u is string => u !== null);
  const sourceSection = safeSourceUrls.length
    ? `\n**Brand sources:** ${safeSourceUrls.map((u) => `<${u}>`).join(" · ")}`
    : "";

  const intentSection = palette.themeIntent
    ? `\n**Use for:** ${sanitizeMdText(palette.themeIntent)}`
    : "";

  const warningNote = `\n> ⚠️ **Renderer note:** The \`%%{init}%%\` directive is supported by Mermaid.js v9+ and most modern renderers (including [mermaid.live](https://mermaid.live)). GitHub Markdown, Notion, and some other tools may strip or ignore theme variables. The \`look\` parameter (\`neo\`, \`handDrawn\`) requires Mermaid.js v11+.`;

  const disclaimerNote = `\n> _Mermaid Theme Builder is a personal [OverKill Hill P³](https://overkillhill.com) project by Jamie Hill. Not affiliated with Builders FirstSource, Mermaid, Mermaid Chart, or Mermaid.ai. All transformations are local — your diagram code never leaves the browser._`;

  return `# Mermaid Diagram — ${themeName} Theme

**Theme:** ${displayLabel}  
**Theme ID:** \`${paletteId}\`  
**Version:** ${sanitizeMdText(palette.version)}  
**Generated:** ${now}  
**Tool:** [Mermaid Theme Builder](${TOOL_URL})${sourceSection}${intentSection}

## Usage

Paste the code block below into any Mermaid-compatible renderer. The \`%%{init}%%\` directive applies the theme automatically.

\`\`\`mermaid
${themedCode}
\`\`\`

## Recommended diagram families

${palette.themeIntent ? `This theme was designed for: **${sanitizeMdText(palette.themeIntent)}**` : "This theme works well with flowcharts, sequence diagrams, and class diagrams."}

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
# Mermaid v10.5+ preferred format — use instead of %%{init}%% where supported
config:
  theme: base
  themeVariables:
${themeLines}
---`;
}

/** Serialize a single ClassDef object to a Mermaid `classDef` line.
 *
 *  This is the single source of truth for classDef string format. Both the
 *  Class Library copy buttons (ClassBrowser) and the Styled Code export
 *  (buildClassDefLibrary) delegate here so they can never drift apart.
 *
 *  @param def          The ClassDef to serialize.
 *  @param fontSizeRule Optional `font-size:Npx` rule to append (used by the
 *                      export path when a non-default node font size is set).
 */
export function buildClassDefString(def: ClassDef, fontSizeRule?: string): string {
  const parts = [`fill:${def.fill}`, `stroke:${def.stroke}`, `color:${def.color}`, def.extra, fontSizeRule ?? ""].filter(Boolean);
  return `classDef ${def.name} ${parts.join(",")}`;
}

/** Build a 16-entry semantic classDef library from palette hex values.
 *
 *  Delegates to getClassDefs() and buildClassDefString() as the single source
 *  of truth so the rendered class browser and the exported classDef text
 *  always stay in sync.
 *
 *  When `typography` is provided and nodeLabel.fontSize differs from the
 *  Mermaid default (16px), a `font-size:Npx` rule is appended to each
 *  classDef so the exported block respects the typography settings.
 */
function buildClassDefLibrary(palette: Palette, typography?: TypographySettings): string {
  // Mermaid's built-in default fontSize is 16px. Only emit font-size on classDefs
  // when the user has explicitly chosen a different nodeLabel size.
  const mermaidDefaultFontSize = 16;
  const nodeFontSize = typography?.nodeLabel.fontSize;
  const fontSizeRule =
    nodeFontSize !== undefined && nodeFontSize !== mermaidDefaultFontSize
      ? `font-size:${nodeFontSize}px`
      : "";

  return getClassDefs(palette)
    .map((def) => `    ${buildClassDefString(def, fontSizeRule)}`)
    .join("\n");
}

export interface ClassDef {
  name: string;
  fill: string;
  stroke: string;
  color: string;
  extra: string;
  description: string;
}

/**
 * Returns all 16 semantic class definitions for the given palette as structured objects.
 * Useful for building UI previews or custom renderers.
 */
export function getClassDefs(palette: Palette): ClassDef[] {
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

  return [
    { name: "primary",    fill: primary,       stroke: primaryBorder, color: primaryText, extra: "",                          description: "Main action / entity" },
    { name: "secondary",  fill: secondary,     stroke: primaryBorder, color: primaryText, extra: "",                          description: "Supporting entity" },
    { name: "tertiary",   fill: tertiary,      stroke: nodeBorder,    color: primaryText, extra: "",                          description: "Background / context" },
    { name: "platform",   fill: mainBkg,       stroke: lineColor,     color: primaryText, extra: "",                          description: "Infrastructure layer" },
    { name: "boundary",   fill: clusterBkg,    stroke: lineColor,     color: titleColor,  extra: "stroke-dasharray:5",        description: "System limits" },
    { name: "actor",      fill: primary,       stroke: primaryBorder, color: primaryText, extra: "font-weight:bold",          description: "Human roles" },
    { name: "gate",       fill: primaryBorder, stroke: nodeBorder,    color: background,  extra: "",                          description: "Decision / gateway" },
    { name: "control",    fill: tertiary,      stroke: nodeBorder,    color: primaryText, extra: "",                          description: "Management / orchestration" },
    { name: "log",        fill: secondary,     stroke: lineColor,     color: primaryText, extra: "font-style:italic",         description: "Audit records" },
    { name: "question",   fill: mainBkg,       stroke: lineColor,     color: titleColor,  extra: "stroke-dasharray:3",        description: "Unknowns / TBD" },
    { name: "accent",     fill: lineColor,     stroke: nodeBorder,    color: background,  extra: "",                          description: "Highlighted results" },
    { name: "deepBlue",   fill: primary,       stroke: nodeBorder,    color: primaryText, extra: "stroke-width:2px",          description: "Emphasis variant" },
    { name: "slate",      fill: background,    stroke: lineColor,     color: primary,     extra: "",                          description: "Neutral / muted details" },
    { name: "scope",      fill: clusterBkg,    stroke: primaryBorder, color: titleColor,  extra: "stroke-width:2px",          description: "Items in scope" },
    { name: "outOfScope", fill: background,    stroke: nodeBorder,    color: primaryText, extra: "stroke-dasharray:8,opacity:0.6", description: "Excluded items" },
    { name: "redDash",    fill: "#3b0e0e",     stroke: "#b91c1c",     color: "#fecaca",   extra: "stroke-dasharray:4",        description: "Warning / error" },
  ];
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

export type ScaffoldFormat = "formatA" | "formatB" | "both";

function buildScaffold(palette: Palette, options: ExportOptions, scaffoldFormat: ScaffoldFormat): string {
  const { diagramFamily, customThemeName } = options;
  const themeName = sanitizeMdText(customThemeName?.trim() || palette.name);
  const isCustom = !!customThemeName?.trim() && customThemeName.trim() !== palette.name;
  const displayLabel = sanitizeMdText(isCustom ? `Custom — based on ${palette.name}` : palette.name);
  const familyName = diagramFamily === "unknown" ? "Mermaid" : diagramFamily;
  const supportsClassDef = CLASSDEF_CAPABLE_FAMILIES.includes(diagramFamily);

  const rendererProfile = options.rendererTarget ? getRendererById(options.rendererTarget) : undefined;
  const rendererInitPartial = rendererProfile?.initDirectiveSupport === "partial";
  const rendererInitNone = rendererProfile?.initDirectiveSupport === "none";
  const rendererThemeVarsPartial = rendererProfile?.themeVariableSupport === "partial";
  const rendererClassDefBlocked = rendererProfile?.classDefSupport === "none";
  const rendererClassDefPartial = rendererProfile?.classDefSupport === "partial";

  const colorLines = palette.colors
    .filter((c) => !["fontFamily", "edgeLabelBackground"].includes(c.key))
    .map((c) => `  - ${c.label}: \`${c.value}\``)
    .join("\n");

  const initBlock = buildInitDirective(palette, diagramFamily, options.look, options.fontSize, options.typography);
  const frontmatterBlock = buildFrontmatter(palette);
  const classDefBlock = buildClassDefLibrary(palette, options.typography);
  const subgraphBlock = buildSubgraphTiers(palette);
  const brandGuidance = getBrandGuidance(palette);

  const exampleDirective = scaffoldFormat === "formatB" ? frontmatterBlock : initBlock;

  const rendererInitCaveat =
    rendererInitNone && rendererProfile
      ? `\n\n> ✗ **Not supported on ${rendererProfile.shortName}:** The \`%%{init}%%\` directive is not supported on this renderer. Use Format B (YAML frontmatter) if it is available, or contact your rendering environment for an alternative.`
      : rendererInitPartial && rendererProfile
      ? `\n\n> ⚠ **Partial support on ${rendererProfile.shortName}:** The \`%%{init}%%\` directive is recognized but only a subset of \`themeVariables\` are applied — some color tokens may be ignored. Validate the themed output in this renderer before publishing.`
      : "";

  const rendererThemeVarCaveat =
    rendererThemeVarsPartial && rendererProfile && !rendererInitPartial && !rendererInitNone
      ? `\n\n> ⚠ **Partial themeVariable support on ${rendererProfile.shortName}:** Only a subset of the color tokens in the directive will take effect — some values may be ignored. Validate in this renderer before publishing.`
      : "";

  const themeDirectiveSection =
    scaffoldFormat === "formatA"
      ? `## Required: Theme directive

Use the \`%%{init}%%\` directive (Format A) — compatible with Mermaid v9+, Microsoft Loop, Notion, and most renderers.

\`\`\`
${initBlock}
\`\`\`${rendererInitCaveat}${rendererThemeVarCaveat}`
      : scaffoldFormat === "formatB"
      ? `## Required: Theme directive

Use YAML frontmatter (Format B) — the preferred format for Mermaid v10.5+, Mermaid Live Editor, VS Code, and GitHub (where supported).

\`\`\`
${frontmatterBlock}
\`\`\`${rendererThemeVarCaveat}`
      : `## Required: Theme directive

Choose ONE of the two formats below based on your renderer. Never use both in the same diagram.

### Format A — \`%%{init}%%\` directive (universal, Mermaid v9+)

> Use this for: Microsoft Loop, Notion, older renderers, or anywhere YAML frontmatter is not supported.

\`\`\`
${initBlock}
\`\`\`${rendererInitCaveat}

### Format B — YAML frontmatter (preferred, Mermaid v10.5+)

> Use this for: Mermaid Live Editor, VS Code with Mermaid extension, GitHub (where supported). This format is the current Mermaid standard and deprecates \`%%{init}%%\`.

\`\`\`
${frontmatterBlock}
\`\`\`${rendererThemeVarCaveat}`;

  const formatRuleText =
    scaffoldFormat === "formatA"
      ? "ALWAYS start the diagram with the `%%{init}%%` theme directive — no exceptions."
      : scaffoldFormat === "formatB"
      ? "ALWAYS start the diagram with the YAML frontmatter theme directive — no exceptions."
      : "ALWAYS start the diagram with the theme directive (Format A or Format B above) — no exceptions.";

  const updateRestoreText =
    scaffoldFormat === "formatA"
      ? "Restore the `%%{init}%%` theme directive at the very top (do not omit it)."
      : scaffoldFormat === "formatB"
      ? "Restore the YAML frontmatter theme directive at the very top (do not omit it)."
      : "Restore the theme directive at the very top (use Format A or B from the original scaffold — do not omit it).";

  const metaBlock = `%% Theme: ${sanitizeFenceContent(themeName)}
%% Theme ID: ${sanitizeFenceContent(palette.id)}
%% Tool: ${TOOL_URL}
%% Personal OverKill Hill P³ project by Jamie Hill — overkillhill.com
%% Not affiliated with Builders FirstSource, Mermaid, Mermaid Chart, or Mermaid.ai`;

  const safeFirstSourceUrl = palette.sourceUrls?.length ? sanitizeSourceUrl(palette.sourceUrls[0]) : null;
  const sourceNote = safeFirstSourceUrl
    ? `\n**Source:** <${safeFirstSourceUrl}>`
    : "";

  const diagramTypeExample =
    diagramFamily === "sequenceDiagram"
      ? `sequenceDiagram
    actor User as User
    participant App as Application
    participant API as API Server

    User->>App: Initiate request
    activate App
    App->>API: POST /process
    API-->>App: 200 OK
    deactivate App
    App-->>User: Show result`
      : diagramFamily === "erDiagram"
      ? `erDiagram
    CUSTOMER {
        int customerId PK
        string name
        string email
    }
    ORDER {
        int orderId PK
        date createdAt
        string status
    }
    PRODUCT {
        int productId PK
        string name
        float price
    }
    CUSTOMER ||--o{ ORDER : "places"
    ORDER }o--|{ PRODUCT : "contains"`
      : diagramFamily === "classDiagram"
      ? `classDiagram
    class User {
        +int userId
        +String email
        +login() bool
    }
    class Service {
        +String name
        +process(request) Response
    }
    class Database {
        +String host
        +query(sql) Result
    }
    User:::actor --> Service:::primary : calls
    Service:::primary --> Database:::platform : reads`
      : diagramFamily === "stateDiagram"
      ? `stateDiagram-v2
    [*] --> Idle
    Idle --> Active : start
    Active --> Paused : pause
    Paused --> Active : resume
    Active --> [*] : complete`
      : diagramFamily === "gantt"
      ? `gantt
    title Project Timeline
    dateFormat YYYY-MM-DD
    section Planning
        Requirements : done, req, 2024-01-01, 7d
        Design       : active, des, 2024-01-08, 7d
    section Development
        Backend      : dev, 2024-01-15, 14d
        Frontend     : fe, 2024-01-22, 14d
    section Release
        Launch       : milestone, m1, 2024-02-05, 0d`
      : diagramFamily === "pie"
      ? `pie title Distribution
    "Category A" : 40
    "Category B" : 30
    "Category C" : 20
    "Category D" : 10`
      : diagramFamily === "mindmap"
      ? `mindmap
  root((Project))
    Planning
      Requirements
      Design
    Development
      Backend
      Frontend
    Release
      Testing
      Launch`
      : diagramFamily === "flowchart" || diagramFamily === "unknown"
      ? `flowchart TD
    A[Start] --> B[Process]
    B:::primary --> C{Decision}:::gate
    C -->|Yes| D[End]:::accent
    C -->|No| B`
      : `${diagramFamily}
    %% Your diagram here`;

  const scaffoldPaletteId = sanitizeMdCode(palette.id);
  const rendererHeaderComment = options.rendererTarget
    ? buildRendererHeaderComment(options.rendererTarget) + "\n"
    : "";

  const classDefCaveatNote =
    rendererClassDefBlocked && rendererProfile
      ? `> ✗ **Not supported on ${rendererProfile.shortName}:** \`classDef\` / \`:::className\` styling is not available on this renderer. Rely only on the theme directive for all visual styling — omit any \`:::className\` annotations.`
      : rendererClassDefPartial && rendererProfile
      ? `> ⚠ **Partial support on ${rendererProfile.shortName}:** \`classDef\` / \`:::className\` rendering quality varies on this renderer. Test before relying on per-node class styles; the theme directive is the safer primary styling mechanism.`
      : null;

  return `# Mermaid Diagram Prompt Scaffold — ${themeName}

**Theme:** ${displayLabel}  
**Theme ID:** \`${scaffoldPaletteId}\`  
**Version:** ${sanitizeMdText(palette.version)}  
**Tool:** [Mermaid Theme Builder](${TOOL_URL})${sourceNote}

${rendererHeaderComment}---

<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- PART 1 — THREAD OPENER                                             -->
<!-- Paste this entire section as your first message in a new AI thread -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

## Instructions for AI

When generating ${familyName} diagrams, apply the following visual theme exactly as specified. Do not invent new colors, do not add extra CSS overrides, and do not change the theme directive.
${brandGuidance}

---

${themeDirectiveSection}

---

## Required: Metadata comments

Add these comment lines immediately after the theme directive:

\`\`\`
${metaBlock}
\`\`\`

---

${diagramFamily === "sequenceDiagram" ? `## Sequence diagram: participant syntax & theming

SequenceDiagram styling is controlled entirely by the theme directive above — all participant box colors, arrow colors, and label fonts come from the theme variables. There is **no** \`:::className\` syntax in sequence diagrams; nodes cannot be individually styled.

### Participant declarations

Declare all participants at the top of the diagram, before any messages:

\`\`\`mermaid
${exampleDirective}
sequenceDiagram
    actor User as User
    participant FE as Frontend
    participant API as API Server
    participant DB as Database
\`\`\`

Use \`actor\` for human roles and \`participant\` for systems, services, and components. The \`as\` keyword sets the display label.

### Arrow types

| Syntax | Style | Meaning |
|--------|-------|---------|
| \`->>\` | Solid arrowhead | Synchronous request / call |
| \`-->>\` | Dashed arrowhead | Async reply / response |
| \`->\` | Solid line | Message (no arrowhead) |
| \`-->\` | Dashed line | Reply (no arrowhead) |
| \`-x\` | Solid with ✕ | Fire-and-forget / destroy message |
| \`--x\` | Dashed with ✕ | Async fire-and-forget |
| \`-)\` | Solid open | Async message |
| \`--)\` | Dashed open | Async reply |

---

## Sequence diagram: control flow & activation blocks

Use these blocks to show conditional logic, repetition, and activation lifelines:

\`\`\`mermaid
${exampleDirective}
sequenceDiagram
    %% Conditional
    alt Happy path
        Client->>Server: POST /resource
        Server-->>Client: 201 Created
    else Error path
        Client->>Server: POST /resource
        Server-->>Client: 400 Bad Request
    end

    %% Loop
    loop Retry up to 3 times
        Client->>Server: GET /status
        Server-->>Client: 202 Accepted
    end

    %% Activation lifeline (box on participant bar)
    activate Server
        Client->>Server: Long operation
        Server-->>Client: Result
    deactivate Server

    %% Notes
    Note right of Server: Processing request
    Note over Client,Server: Handshake complete

    %% Optional block
    opt Only if authenticated
        Client->>Server: GET /profile
        Server-->>Client: 200 OK
    end

    %% Parallel
    par Fetch in parallel
        Client->>ServiceA: GET /a
    and
        Client->>ServiceB: GET /b
    end
\`\`\`` : diagramFamily === "erDiagram" ? `## ER diagram: entity syntax & theming

\`erDiagram\` styling is controlled entirely by the theme directive above — entity header colors, attribute row styles, and relationship line colors all come from the theme variables. There is **no** \`:::className\` syntax in ER diagrams; entities cannot be individually styled.

### Entity declaration syntax

Declare entities with their attributes using this syntax:

\`\`\`mermaid
${exampleDirective}
erDiagram
    ENTITY_NAME {
        dataType attributeName PK "optional description"
        dataType attributeName FK
        dataType attributeName
    }
\`\`\`

Attribute constraint keywords: \`PK\` (primary key), \`FK\` (foreign key), \`UK\` (unique key). A quoted description string may follow the constraint.

### Relationship cardinality notation

| Syntax | Meaning |
|--------|---------|
| \`||--||\` | Exactly one to exactly one |
| \`||--o{\` | Exactly one to zero or more |
| \`||--|{\` | Exactly one to one or more |
| \`o|--o{\` | Zero or one to zero or more |
| \`}o--o{\` | Zero or more to zero or more |
| \`}|--|{\` | One or more to one or more |

Relationship statement format: \`ENTITY_A cardinality ENTITY_B : "label"\`

---

## ER diagram: theming note

All ER diagram colors come from the theme directive. No per-entity style overrides are possible with classDef or inline styling.` : diagramFamily === "classDiagram" ? `## Class diagram: declaration syntax & classDef theming

\`classDiagram\` supports \`:::className\` styling — apply the semantic classDef vocabulary below to class nodes. The theme directive controls default colors; classDef adds per-node variation.

### Class declaration syntax

Declare classes with their attributes and methods:

\`\`\`mermaid
${exampleDirective}
classDiagram
    class Animal {
        +String name
        +int age
        +makeSound() String
        -sleep() void
    }
    class Dog {
        +String breed
        +fetch() void
    }
    Animal <|-- Dog : inherits
\`\`\`

Visibility modifiers: \`+\` public, \`-\` private, \`#\` protected, \`~\` package/internal. Return type follows the method name.

### Relationship arrow types

| Arrow | Meaning |
|-------|---------|
| \`<|--\` | Inheritance / extension |
| \`*--\` | Composition (filled diamond) |
| \`o--\` | Aggregation (open diamond) |
| \`-->\` | Association / dependency |
| \`..>\` | Dashed dependency |
| \`..|>\` | Realization / implements |
| \`--\` | Solid link |
| \`..\` | Dashed link |

Cardinality on each end: \`Dog "1" --> "0..*" Owner : owns\`

---

## Semantic classDef library

${classDefCaveatNote ? classDefCaveatNote : `Apply these classDef classes to class nodes using \`:::className\` syntax. Do NOT add any other fill, stroke, or color values — use only these classes.

\`\`\`mermaid
${exampleDirective}
classDiagram
${classDefBlock}

    %% Apply to a class node: class MyClass:::primary
    %% Class with members: class Service:::platform { +process() void }
\`\`\`

### Class reference table

| Class | Role | When to use |
|-------|------|-------------|
| \`primary\` | Main action / primary entity | Core domain classes |
| \`secondary\` | Supporting / related | Adjacent services, helpers |
| \`tertiary\` | Background / context | Passive or reference classes |
| \`platform\` | Platform / infrastructure | Databases, queues, runtimes |
| \`boundary\` | System boundary (dashed) | External systems, APIs |
| \`actor\` | Person / user / role | User types, personas |
| \`gate\` | Decision / gateway | Routing or condition classes |
| \`control\` | Control / management | Orchestrators, managers |
| \`log\` | Log / audit / record (italic) | Audit or event classes |
| \`question\` | Open question / TBD (dashed) | Unknowns, pending design |
| \`accent\` | Highlighted / key result | Output or result classes |
| \`deepBlue\` | Deep emphasis | Core or critical classes |
| \`slate\` | Neutral / muted | Supporting detail classes |
| \`scope\` | In-scope boundary | Classes explicitly in scope |
| \`outOfScope\` | Out-of-scope (faded, dashed) | Excluded classes |
| \`redDash\` | Warning / error / blocker | Error or exception classes |`}` : diagramFamily === "stateDiagram" ? `## State diagram: declaration syntax & theming

\`stateDiagram-v2\` styling is primarily controlled by the theme directive above — state box colors, transition arrow colors, and label fonts all come from the theme variables. classDef is available but renderer support varies; test in your target renderer before relying on per-state styling.

### State declaration syntax

\`\`\`mermaid
${exampleDirective}
stateDiagram-v2
    [*] --> Idle
    Idle --> Processing : submit
    Processing --> Success : complete
    Processing --> Error : fail
    Success --> [*]
    Error --> Idle : retry
\`\`\`

Use \`[*]\` for the initial state and terminal (end) states. Transition labels follow the arrow after a colon.

### Composite states and concurrency

\`\`\`mermaid
${exampleDirective}
stateDiagram-v2
    state Processing {
        [*] --> Validating
        Validating --> Executing
        Executing --> [*]
    }

    state "Parallel work" as parallel {
        [*] --> TaskA
        --
        [*] --> TaskB
    }

    note right of Processing
        Logged to audit trail
    end note
\`\`\`

### ClassDef styling (limited renderer support)

classDef is technically available in state diagrams but support varies by renderer. Use the theme directive as the primary styling mechanism:

\`\`\`mermaid
stateDiagram-v2
    classDef active fill:#abc,stroke:#def
    class Processing active
\`\`\`` : diagramFamily === "gantt" ? `## Gantt diagram: section and task syntax

\`gantt\` styling is controlled entirely by the theme directive above — bar colors, section backgrounds, and label fonts all come from the theme variables. There is **no** \`:::className\` syntax in Gantt diagrams; tasks cannot be individually styled.

### Date format and task declaration

Always declare \`dateFormat\` before any sections or tasks:

\`\`\`mermaid
${exampleDirective}
gantt
    title My Project Timeline
    dateFormat YYYY-MM-DD
    section Phase 1
        Task A : done, a1, 2024-01-01, 7d
        Task B : active, a2, 2024-01-08, 7d
    section Phase 2
        Task C : c1, after a2, 5d
        Launch : milestone, m1, 2024-01-20, 0d
\`\`\`

Task status keywords: \`done\` (completed), \`active\` (in progress), \`crit\` (critical path). Use a duration of \`0d\` to mark a milestone point. Task IDs are optional but enable \`after taskId\` relative scheduling.

### Date format tokens

| Token | Meaning |
|-------|---------|
| \`YYYY\` | 4-digit year |
| \`MM\` | 2-digit month (01–12) |
| \`DD\` | 2-digit day (01–31) |
| \`HH\` | Hour (00–23) |
| \`mm\` | Minute (00–59) |

---

## Gantt diagram: theming note

All Gantt colors come from the theme directive. No per-task style overrides are possible with classDef or inline styling.` : diagramFamily === "pie" ? `## Pie chart: title and slice syntax

\`pie\` styling is controlled entirely by the theme directive above — slice colors, label fonts, and background all come from the theme variables. There is **no** \`:::className\` syntax in pie charts; individual slices cannot be independently styled beyond the palette color sequence.

### Pie chart syntax

\`\`\`mermaid
${exampleDirective}
pie title Distribution
    "Label A" : 40
    "Label B" : 30
    "Label C" : 20
    "Label D" : 10
\`\`\`

The \`title\` keyword is optional but recommended. Each slice is \`"Label" : value\` where value is a positive number — Mermaid calculates percentages automatically. Labels must be quoted strings.

---

## Pie chart: theming note

All pie chart colors come from the theme directive and are assigned in palette sequence order. No per-slice style overrides are possible with classDef or inline styling.` : diagramFamily === "mindmap" ? `## Mindmap: indented node syntax & shape notation

\`mindmap\` styling is controlled entirely by the theme directive above — node colors, border styles, and label fonts all come from the theme variables. There is **no** \`:::className\` syntax in mindmaps; nodes cannot be individually styled.

### Node shape notation

| Syntax | Shape |
|--------|-------|
| \`text\` | Default (cloud / rounded rectangle) |
| \`[text]\` | Rectangle |
| \`(text)\` | Rounded rectangle |
| \`((text))\` | Circle |
| \`{{text}}\` | Hexagon |
| \`)text(\` | Bang / callout |

### Indented node syntax

\`\`\`mermaid
${exampleDirective}
mindmap
  root((Central Topic))
    Branch A
      Leaf A1
      Leaf A2
    Branch B
      Sub-branch
        Deep leaf
    Branch C
\`\`\`

The root node is at the first indentation level. Each deeper indentation level creates child nodes. Use 2 or 4 spaces consistently — do not mix indent sizes within the same diagram.

---

## Mindmap: theming note

All mindmap colors come from the theme directive. No per-node style overrides are possible with classDef or inline styling.` : `## Semantic classDef library

${classDefCaveatNote ? classDefCaveatNote : `This is the complete styling vocabulary for this theme. Apply these classDef classes to nodes using \`:::className\` syntax. Do NOT add any other fill, stroke, or color values — use only these classes.

\`\`\`mermaid
${exampleDirective}
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
| \`redDash\` | Warning / error / blocker | Error states, blockers, known failures |`}

---

## Subgraph tier patterns

Use \`style SubgraphName ...\` statements to apply visual hierarchy to subgraphs. Replace \`SubgraphName\` with the actual subgraph ID.

\`\`\`mermaid
${exampleDirective}
flowchart TD
${subgraphBlock}
\`\`\``}

---

## Theme: ${themeName}

${sanitizeMdText(palette.description ?? "")}
${palette.themeIntent ? `\n**Intended use:** ${sanitizeMdText(palette.themeIntent)}` : ""}

### Color reference
${colorLines}

### Font
\`${palette.colors.find((c) => c.key === "fontFamily")?.value ?? "system-ui, sans-serif"}\`

---

${options.typography ? typographyToScaffoldSection(options.typography) + "\n\n---\n\n" : ""}${options.rendererTarget ? rendererToScaffoldSection(options.rendererTarget, options.look) + "\n\n---\n\n" : ""}## Rules

${diagramFamily === "sequenceDiagram" ? `1. ${formatRuleText}
2. Add the metadata comment block immediately after the theme directive.
3. Use \`sequenceDiagram\` as the diagram type.
4. Declare all \`participant\` and \`actor\` labels at the top — before any messages.
5. Use \`->>\` for synchronous requests and \`-->>\` for async replies/responses.
6. Use \`alt\`/\`else\`/\`end\` for conditional flows, \`loop\` for repetition, \`opt\` for optional blocks.
7. Use \`activate\`/\`deactivate\` (or the \`+\`/\`-\` shorthand) to show lifeline activation boxes.
8. Do NOT use \`:::className\` syntax — sequenceDiagram does not support per-node classDef styling.
9. Do NOT add inline \`fill:\`, \`stroke:\`, or \`color:\` values — the theme directive handles all styling.
10. Do NOT change any color values — reproduce them exactly as shown.
11. Keep message labels concise (under 60 characters).
12. If the diagram type changes, preserve the exact same theme directive.` : diagramFamily === "erDiagram" ? `1. ${formatRuleText}
2. Add the metadata comment block immediately after the theme directive.
3. Use \`erDiagram\` as the diagram type.
4. Declare all entities with their attributes: \`ENTITY_NAME { dataType attrName PK|FK|UK "description" }\`.
5. Use correct cardinality notation: \`||--o{\` (one-to-many), \`}o--o{\` (many-to-many), \`||--||\` (one-to-one), etc.
6. Always include a relationship label in quotes: \`ENTITY_A ||--o{ ENTITY_B : "label"\`.
7. Do NOT use \`:::className\` syntax — erDiagram does not support per-entity classDef styling.
8. Do NOT add inline \`fill:\`, \`stroke:\`, or \`color:\` values — the theme directive handles all styling.
9. Do NOT change any color values — reproduce them exactly as shown.
10. Attribute type names are descriptive only; Mermaid does not validate them against a schema.
11. If the diagram type changes, preserve the exact same theme directive.` : diagramFamily === "classDiagram" ? `1. ${formatRuleText}
2. Add the metadata comment block immediately after the theme directive.
3. Use \`classDiagram\` as the diagram type.
4. Declare classes with their attributes and methods: \`class Name { +type attr method() ReturnType }\`.
5. Use visibility modifiers: \`+\` (public), \`-\` (private), \`#\` (protected), \`~\` (package).
6. Use correct relationship arrows: \`<|--\` (inheritance), \`*--\` (composition), \`o--\` (aggregation), \`-->\` (association).
7. Include cardinality labels where meaningful: \`"1"\` / \`"0..*"\` on each end of the line.
8. Style class nodes using \`:::className\` with the classDef vocabulary from the scaffold.
9. Do NOT add inline \`fill:\`, \`stroke:\`, or \`color:\` values — use classDef classes instead.
10. Do NOT change any color values — reproduce them exactly as shown.
11. If the diagram type changes, preserve the exact same theme directive.` : diagramFamily === "stateDiagram" ? `1. ${formatRuleText}
2. Add the metadata comment block immediately after the theme directive.
3. Use \`stateDiagram-v2\` as the diagram type.
4. Use \`[*]\` for the initial state and terminal (end) states.
5. Transition syntax: \`StateA --> StateB : label\`.
6. Use \`state CompositeName { ... }\` for composite (nested) states.
7. Use \`--\` inside a composite state to separate concurrent regions.
8. classDef styling is available but support varies by renderer — test before relying on it.
9. Do NOT add inline \`fill:\`, \`stroke:\`, or \`color:\` values — the theme directive handles all styling.
10. Do NOT change any color values — reproduce them exactly as shown.
11. If the diagram type changes, preserve the exact same theme directive.` : diagramFamily === "gantt" ? `1. ${formatRuleText}
2. Add the metadata comment block immediately after the theme directive.
3. Use \`gantt\` as the diagram type.
4. Always declare \`dateFormat\` before any \`section\` or task entries.
5. Use \`title\` to name the overall timeline.
6. Group tasks into \`section\` blocks for visual organization.
7. Task status keywords: \`done\` (completed), \`active\` (in progress), \`crit\` (critical path), \`milestone\` (zero-duration point with \`0d\`).
8. Durations can be absolute dates (\`YYYY-MM-DD\`) or relative (\`7d\`, \`after taskId\`).
9. Do NOT use \`:::className\` syntax — gantt does not support per-task classDef styling.
10. Do NOT add inline \`fill:\`, \`stroke:\`, or \`color:\` values — the theme directive handles all styling.
11. Do NOT change any color values — reproduce them exactly as shown.
12. If the diagram type changes, preserve the exact same theme directive.` : diagramFamily === "pie" ? `1. ${formatRuleText}
2. Add the metadata comment block immediately after the theme directive.
3. Use \`pie\` as the diagram type.
4. Add a \`title\` on the same line as \`pie\`: \`pie title My Title\`.
5. Each slice is \`"Label" : value\` where value is a positive number — Mermaid auto-calculates percentages.
6. Labels must be quoted strings; keep them concise (under 40 characters each).
7. Do NOT use \`:::className\` syntax — pie does not support per-slice classDef styling.
8. Do NOT add inline \`fill:\`, \`stroke:\`, or \`color:\` values — the theme directive handles all styling.
9. Do NOT change any color values — reproduce them exactly as shown.
10. If the diagram type changes, preserve the exact same theme directive.` : diagramFamily === "mindmap" ? `1. ${formatRuleText}
2. Add the metadata comment block immediately after the theme directive.
3. Use \`mindmap\` as the diagram type.
4. The root node is at the first indentation level; each deeper level creates child nodes.
5. Use consistent indentation (2 or 4 spaces) — do not mix indent sizes within the same diagram.
6. Use shape notation to distinguish node types: \`((text))\` for root, \`[text]\` for categories, \`(text)\` for subcategories.
7. Keep node labels concise (under 40 characters each).
8. Do NOT use \`:::className\` syntax — mindmap does not support per-node classDef styling.
9. Do NOT add inline \`fill:\`, \`stroke:\`, or \`color:\` values — the theme directive handles all styling.
10. Do NOT change any color values — reproduce them exactly as shown.
11. If the diagram type changes, preserve the exact same theme directive.` : `1. ${formatRuleText}
2. Add the metadata comment block immediately after the theme directive.
3. Use \`${diagramFamily === "unknown" ? "flowchart TD" : diagramFamily === "flowchart" ? "flowchart TD" : diagramFamily}\` as the diagram type unless the user specifies otherwise.
4. Keep node labels concise (under 60 characters each).
5. Style nodes using ONLY the classDef classes defined above — apply with \`:::className\` syntax.
6. Do NOT add inline \`fill:\`, \`stroke:\`, or \`color:\` values on individual nodes — use classDef classes instead.
7. Do NOT change any color values — reproduce them exactly as shown.
8. Use subgraph tier styles for visual hierarchy — never leave subgraphs unstyled.
9. If the diagram type changes, preserve the exact same theme directive.
10. If the diagram type does not support classDef (e.g. sequenceDiagram, erDiagram), omit classDef statements entirely — the theme directive handles all styling.`}

---

## Example output structure

\`\`\`mermaid
${exampleDirective}
${metaBlock}
${diagramTypeExample}
\`\`\`

---

<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- PART 2 — UPDATE PROMPT (style drift prevention)                    -->
<!-- Use this when continuing a diagram thread and style has drifted    -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

## Update Prompt — paste this when style has drifted

> Copy the block below into your AI thread when you notice the diagram is missing its theme directive or using wrong colors${supportsClassDef ? ", or has lost classDef classes" : ""}.

---

**[UPDATE — Restore theme contract]**

The diagram above has drifted from the required visual theme. Please regenerate it in full with the following corrections applied:

1. ${updateRestoreText}
2. Restore the metadata comment block immediately after the directive.
${supportsClassDef
  ? `3. Re-apply all node classes using the classDef vocabulary from the original scaffold (:::className syntax). Do not add any inline fill, stroke, or color values.
4. Do not change any logic, labels, or relationships — only restore the visual styling contract.
5. Output the complete diagram from top to bottom — do not abbreviate or use "..." placeholders.`
  : `3. Do not add classDef statements — this diagram type (${familyName}) does not support them. The theme directive handles all styling.
4. Do not change any logic, labels, or relationships — only restore the visual styling contract.
5. Output the complete diagram from top to bottom — do not abbreviate or use "..." placeholders.`}

Theme contract reference:
- Theme: **${themeName}** (\`${scaffoldPaletteId}\`)
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

/** Original public function — unchanged signature, always produces both formats. */
export function generatePromptScaffold(palette: Palette, options: ExportOptions): string {
  return buildScaffold(palette, options, "both");
}

/** Format-aware variant — UI calls this when the user has chosen a specific directive format. */
export function generatePromptScaffoldWithFormat(
  palette: Palette,
  options: ExportOptions,
  format: ScaffoldFormat,
): string {
  return buildScaffold(palette, options, format);
}
