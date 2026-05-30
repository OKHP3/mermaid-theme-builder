import type { Palette } from "./palettes";
import type { DiagramFamily } from "./detector";
import { familyThemeOverlay } from "./family-theming";
import { typographyToScaffoldSection, type TypographySettings } from "./typography";
import {
  rendererToScaffoldSection,
  buildRendererHeaderComment,
  getRendererById,
} from "../data/renderer-parity";

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

const BADGE_SAFE_FAMILIES: DiagramFamily[] = [
  "flowchart",
  "sequenceDiagram",
  "stateDiagram",
  "classDiagram",
];

export const CLASSDEF_CAPABLE_FAMILIES: DiagramFamily[] = [
  "flowchart",
  "classDiagram",
  "stateDiagram",
  "block",
];

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
function applyTypographyToVars(vars: Record<string, string>, typography: TypographySettings): void {
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
  typography?: TypographySettings
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
  const safeBrandUrl =
    palette.isBrandPreset && palette.sourceUrls?.[0]
      ? sanitizeSourceUrl(palette.sourceUrls[0])
      : null;
  if (safeBrandUrl) {
    lines.push(`%% Brand source: ${safeBrandUrl}`);
  }
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

  const initDirective = buildInitDirective(
    palette,
    diagramFamily,
    options.look,
    options.fontSize,
    options.typography
  );
  const metaComments = includeMetaComments ? buildMetaComments(palette, themeName) : null;
  const badge = includeBadge ? buildBadgeNode(palette, themeName, diagramFamily) : null;

  const parts = [initDirective];
  if (metaComments) parts.push(metaComments);
  parts.push(strippedCode.trimEnd());
  if (badge) parts.push(badge);

  return parts.join("\n");
}

export function generateMarkdownExport(
  themedCode: string,
  palette: Palette,
  options: ExportOptions
): string {
  const { customThemeName } = options;
  const rawThemeName = customThemeName?.trim() || palette.name;
  const themeName = sanitizeMdText(rawThemeName);
  const isCustom = !!customThemeName?.trim() && customThemeName.trim() !== palette.name;
  const displayLabel = sanitizeMdText(
    isCustom ? `Custom — based on ${palette.name}` : palette.name
  );
  const paletteId = sanitizeMdCode(palette.id);
  const now = new Date().toISOString().split("T")[0];

  const safeSourceUrls = (palette.sourceUrls ?? [])
    .map(sanitizeSourceUrl)
    .filter((u): u is string => u !== null);
  const sourceSection = safeSourceUrls.length
    ? `\n**Brand sources:** ${safeSourceUrls.map((u) => `<${u}>`).join(" · ")}`
    : "";

  const intentSection = palette.themeIntent
    ? `\n**Use for:** ${sanitizeMdText(palette.themeIntent)}`
    : "";

  const warningNote = `\n> ⚠️ **Renderer note:** The \`%%{init}%%\` directive is supported by Mermaid.js v9+ and most modern renderers (including [mermaid.live](https://mermaid.live)). GitHub Markdown, Notion, and some other tools may strip or ignore theme variables. The \`look\` parameter (\`neo\`, \`handDrawn\`) requires Mermaid.js v11+.`;

  const disclaimerNote = `\n> _Mermaid Theme Builder is a personal [OverKill Hill P³](https://overkillhill.com) project by Jamie Hill. All transformations are local — your diagram code never leaves the browser._`;

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

    askjamie: `
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
  const parts = [
    `fill:${def.fill}`,
    `stroke:${def.stroke}`,
    `color:${def.color}`,
    def.extra,
    fontSizeRule ?? "",
  ].filter(Boolean);
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

  const primary = c("primaryColor", "#111827");
  const primaryText = c("primaryTextColor", "#f0f0f0");
  const primaryBorder = c("primaryBorderColor", "#888888");
  const secondary = c("secondaryColor", "#1f2937");
  const tertiary = c("tertiaryColor", "#374151");
  const background = c("background", "#ffffff");
  const mainBkg = c("mainBkg", "#1e2330");
  const nodeBorder = c("nodeBorder", "#888888");
  const clusterBkg = c("clusterBkg", "#111827");
  const titleColor = c("titleColor", "#e0e0e0");
  const lineColor = c("lineColor", "#888888");

  return [
    {
      name: "primary",
      fill: primary,
      stroke: primaryBorder,
      color: primaryText,
      extra: "",
      description: "Main action / entity",
    },
    {
      name: "secondary",
      fill: secondary,
      stroke: primaryBorder,
      color: primaryText,
      extra: "",
      description: "Supporting entity",
    },
    {
      name: "tertiary",
      fill: tertiary,
      stroke: nodeBorder,
      color: primaryText,
      extra: "",
      description: "Background / context",
    },
    {
      name: "platform",
      fill: mainBkg,
      stroke: lineColor,
      color: primaryText,
      extra: "",
      description: "Infrastructure layer",
    },
    {
      name: "boundary",
      fill: clusterBkg,
      stroke: lineColor,
      color: titleColor,
      extra: "stroke-dasharray:5",
      description: "System limits",
    },
    {
      name: "actor",
      fill: primary,
      stroke: primaryBorder,
      color: primaryText,
      extra: "font-weight:bold",
      description: "Human roles",
    },
    {
      name: "gate",
      fill: primaryBorder,
      stroke: nodeBorder,
      color: background,
      extra: "",
      description: "Decision / gateway",
    },
    {
      name: "control",
      fill: tertiary,
      stroke: nodeBorder,
      color: primaryText,
      extra: "",
      description: "Management / orchestration",
    },
    {
      name: "log",
      fill: secondary,
      stroke: lineColor,
      color: primaryText,
      extra: "font-style:italic",
      description: "Audit records",
    },
    {
      name: "question",
      fill: mainBkg,
      stroke: lineColor,
      color: titleColor,
      extra: "stroke-dasharray:3",
      description: "Unknowns / TBD",
    },
    {
      name: "accent",
      fill: lineColor,
      stroke: nodeBorder,
      color: background,
      extra: "",
      description: "Highlighted results",
    },
    {
      name: "deepBlue",
      fill: primary,
      stroke: nodeBorder,
      color: primaryText,
      extra: "stroke-width:2px",
      description: "Emphasis variant",
    },
    {
      name: "slate",
      fill: background,
      stroke: lineColor,
      color: primary,
      extra: "",
      description: "Neutral / muted details",
    },
    {
      name: "scope",
      fill: clusterBkg,
      stroke: primaryBorder,
      color: titleColor,
      extra: "stroke-width:2px",
      description: "Items in scope",
    },
    {
      name: "outOfScope",
      fill: background,
      stroke: nodeBorder,
      color: primaryText,
      extra: "stroke-dasharray:8,opacity:0.6",
      description: "Excluded items",
    },
    {
      name: "redDash",
      fill: "#3b0e0e",
      stroke: "#b91c1c",
      color: "#fecaca",
      extra: "stroke-dasharray:4",
      description: "Warning / error",
    },
  ];
}

/** Build 6-tier subgraph style patterns for the given palette. */
function buildSubgraphTiers(palette: Palette): string {
  const c = (key: string, fallback: string) =>
    palette.colors.find((cl) => cl.key === key)?.value ?? fallback;

  const primary = c("primaryColor", "#111827");
  const secondary = c("secondaryColor", "#1f2937");
  const tertiary = c("tertiaryColor", "#374151");
  const clusterBkg = c("clusterBkg", "#111827");
  const background = c("background", "#ffffff");
  const lineColor = c("lineColor", "#888888");
  const primaryBorder = c("primaryBorderColor", "#888888");
  const titleColor = c("titleColor", "#e0e0e0");

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

function buildScaffold(
  palette: Palette,
  options: ExportOptions,
  scaffoldFormat: ScaffoldFormat
): string {
  const { diagramFamily, customThemeName } = options;
  const themeName = sanitizeMdText(customThemeName?.trim() || palette.name);
  const isCustom = !!customThemeName?.trim() && customThemeName.trim() !== palette.name;
  const displayLabel = sanitizeMdText(
    isCustom ? `Custom — based on ${palette.name}` : palette.name
  );
  const familyName = diagramFamily === "unknown" ? "Mermaid" : diagramFamily;
  const supportsClassDef = CLASSDEF_CAPABLE_FAMILIES.includes(diagramFamily);

  const rendererProfile = options.rendererTarget
    ? getRendererById(options.rendererTarget)
    : undefined;
  const rendererInitPartial = rendererProfile?.initDirectiveSupport === "partial";
  const rendererInitNone = rendererProfile?.initDirectiveSupport === "none";
  const rendererThemeVarsPartial = rendererProfile?.themeVariableSupport === "partial";
  const rendererClassDefBlocked = rendererProfile?.classDefSupport === "none";
  const rendererClassDefPartial = rendererProfile?.classDefSupport === "partial";

  const colorLines = palette.colors
    .filter((c) => !["fontFamily", "edgeLabelBackground"].includes(c.key))
    .map((c) => `  - ${c.label}: \`${c.value}\``)
    .join("\n");

  const initBlock = buildInitDirective(
    palette,
    diagramFamily,
    options.look,
    options.fontSize,
    options.typography
  );
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
%% Tool: ${TOOL_URL}`;

  const safeFirstSourceUrl = palette.sourceUrls?.length
    ? sanitizeSourceUrl(palette.sourceUrls[0])
    : null;
  const sourceNote = safeFirstSourceUrl ? `\n**Source:** <${safeFirstSourceUrl}>` : "";

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
                  : diagramFamily === "gitGraph"
                    ? `gitGraph
   commit id: "init"
   branch feature/login
   checkout feature/login
   commit id: "add-auth"
   commit id: "add-tests"
   checkout main
   merge feature/login id: "merge-login"
   branch release/1.0
   checkout release/1.0
   commit id: "bump-version" tag: "v1.0.0"`
                    : diagramFamily === "xychart"
                      ? `xychart-beta
    title "Monthly Active Users"
    x-axis [Jan, Feb, Mar, Apr, May, Jun]
    y-axis "Users (thousands)" 0 --> 120
    bar [42, 58, 74, 91, 105, 118]
    line [42, 58, 74, 91, 105, 118]`
                      : diagramFamily === "journey"
                        ? `journey
    title My Working Day
    section Morning
        Wake up       : 5: Me
        Have coffee   : 3: Me
        Check emails  : 2: Me, Work
    section Afternoon
        Team standup  : 4: Me, Work
        Development   : 5: Me
        Code review   : 3: Me, Work
    section Evening
        Wind down     : 4: Me
        Dinner        : 5: Me, Family`
                        : diagramFamily === "timeline"
                          ? `timeline
    title History of Technology
    section 1950s
        1951 : UNIVAC I
             : First commercial computer
    section 1970s
        1971 : Intel 4004
             : First microprocessor
        1975 : Altair 8800
    section 1990s
        1991 : World Wide Web
        1995 : JavaScript
             : Java`
                          : diagramFamily === "quadrantChart"
                            ? `quadrantChart
    title Feature Prioritization
    x-axis Low Effort --> High Effort
    y-axis Low Impact --> High Impact
    quadrant-1 Do Now
    quadrant-2 Schedule
    quadrant-3 Deprioritize
    quadrant-4 Delegate
    Feature A: [0.3, 0.8]
    Feature B: [0.7, 0.7]
    Feature C: [0.4, 0.3]
    Feature D: [0.8, 0.2]`
                            : diagramFamily === "block"
                              ? `block-beta
    columns 3
    A["Input"]:::actor
    B["Process"]:::primary
    C["Output"]:::accent
    space
    D["Storage"]:::platform
    space

    A --> B
    B --> C
    B --> D`
                              : diagramFamily === "c4Diagram"
                                ? `C4Context
    title System Context — My Application
    Person(user, "User", "A person using the system")
    System(app, "My Application", "Core application system")
    System_Ext(ext, "External Service", "Third-party API provider")
    Rel(user, app, "Uses", "HTTPS")
    Rel(app, ext, "Calls", "REST/HTTPS")`
                                : diagramFamily === "sankey"
                                  ? `sankey-beta
Energy Source,Transmission,120
Energy Source,Direct Use,30
Transmission,Industrial,75
Transmission,Residential,45
Direct Use,Commercial,30`
                                  : diagramFamily === "packet"
                                    ? `packet-beta
0-7: "Version"
8-15: "Header Length"
16-31: "Total Length"
32-47: "Identification"
48-63: "Flags + Fragment Offset"
64-71: "TTL"
72-79: "Protocol"
80-95: "Header Checksum"
96-127: "Source Address"
128-159: "Destination Address"`
                                    : diagramFamily === "requirementDiagram"
                                      ? `requirementDiagram

requirement AuthRequirement {
    id: 1
    text: Users must authenticate before accessing protected resources
    risk: high
    verifyMethod: test
}

functionalRequirement SessionRequirement {
    id: 2
    text: Sessions must expire after 30 minutes of inactivity
    risk: medium
    verifyMethod: inspection
}

element AuthService {
    type: system
    docref: /docs/auth-service
}

AuthRequirement - satisfies -> AuthService
SessionRequirement - traces -> AuthRequirement`
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

${
  diagramFamily === "sequenceDiagram"
    ? `## Sequence diagram: participant syntax & theming

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
\`\`\``
    : diagramFamily === "erDiagram"
      ? `## ER diagram: entity syntax & theming

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

All ER diagram colors come from the theme directive. No per-entity style overrides are possible with classDef or inline styling.`
      : diagramFamily === "classDiagram"
        ? `## Class diagram: declaration syntax & classDef theming

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

${
  classDefCaveatNote
    ? classDefCaveatNote
    : `Apply these classDef classes to class nodes using \`:::className\` syntax. Do NOT add any other fill, stroke, or color values — use only these classes.

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
| \`redDash\` | Warning / error / blocker | Error or exception classes |`
}`
        : diagramFamily === "stateDiagram"
          ? `## State diagram: declaration syntax & theming

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
\`\`\``
          : diagramFamily === "gantt"
            ? `## Gantt diagram: section and task syntax

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

All Gantt colors come from the theme directive. No per-task style overrides are possible with classDef or inline styling.`
            : diagramFamily === "pie"
              ? `## Pie chart: title and slice syntax

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

All pie chart colors come from the theme directive and are assigned in palette sequence order. No per-slice style overrides are possible with classDef or inline styling.`
              : diagramFamily === "mindmap"
                ? `## Mindmap: indented node syntax & shape notation

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

All mindmap colors come from the theme directive. No per-node style overrides are possible with classDef or inline styling.`
                : diagramFamily === "gitGraph"
                  ? `## Git graph: commit and branch syntax

\`gitGraph\` styling is controlled by the theme directive and gitGraph-specific config options. There is **no** \`:::className\` syntax in git graphs; commits and branches cannot be individually styled via classDef.

### Basic commit and branch syntax

\`\`\`mermaid
${exampleDirective}
gitGraph
   commit id: "initial commit"
   branch develop
   checkout develop
   commit id: "add feature"
   commit id: "add tests"
   checkout main
   merge develop id: "merge feature"
   commit id: "release" tag: "v1.0.0"
\`\`\`

Keywords: \`commit\` adds a commit on the current branch. \`branch\` creates a new branch. \`checkout\` switches to a branch. \`merge\` merges a named branch into the current branch. \`cherry-pick\` copies a commit by ID.

### Commit options

| Option | Meaning |
|--------|---------|
| \`id: "label"\` | Display label for the commit |
| \`tag: "v1.0"\` | Adds a version tag badge |
| \`type: HIGHLIGHT\` | Highlighted commit (filled circle) |
| \`type: REVERSE\` | Reverse commit (crossed circle) |
| \`type: NORMAL\` | Default commit style |

### Branch color config

Branch colors (\`git0\`–\`git7\`) are set via the \`gitGraph\` config block inside the theme directive. They are **not** standard \`themeVariables\` — they must be placed in a separate \`gitGraph\` key:

\`\`\`
%%{init: {"theme": "base", "themeVariables": { ... }, "gitGraph": {"rotateCommitLabel": false}}}%%
\`\`\`

The theme directive's \`primaryColor\` and \`primaryBorderColor\` influence the overall background and label colors but branch rail colors are assigned by Mermaid's gitGraph renderer from a built-in sequence.

---

## Git graph: theming note

All global colors (background, text, label boxes) come from the theme directive. Branch rail colors (\`git0\`–\`git7\`) are renderer-assigned and cannot be individually overridden with classDef or inline styles. Use the theme directive to control the overall visual palette.`
                  : diagramFamily === "xychart"
                    ? `## XY chart: axis and data series syntax

\`xychart-beta\` styling is partially controlled by the theme directive — background, axis labels, title fonts, and bar/line colors respond to themeVariables. There is **no** \`:::className\` syntax in XY charts; individual bars or points cannot be styled via classDef.

### Basic xychart syntax

\`\`\`mermaid
${exampleDirective}
xychart-beta
    title "Chart Title"
    x-axis ["Label A", "Label B", "Label C", "Label D"]
    y-axis "Y Axis Label" 0 --> 100
    bar [25, 50, 75, 100]
    line [10, 40, 65, 90]
\`\`\`

The \`title\` line sets the chart heading. \`x-axis\` declares category labels (quoted strings in brackets, or bare tokens for simple labels). \`y-axis\` sets the axis label and the numeric range (\`min --> max\`). \`bar\` and \`line\` each take a bracketed list of numeric values — one per x-axis category.

### Data series

| Statement | Meaning |
|-----------|---------|
| \`bar [v1, v2, ...]\` | Vertical bar series |
| \`line [v1, v2, ...]\` | Line series overlaid on the same axes |

Both \`bar\` and \`line\` can appear together in the same chart. The number of values must match the number of x-axis categories. Negative values and decimal numbers are supported.

---

## XY chart: theming note

Background, axis labels, title, and grid colors come from the theme directive. Bar and line series colors partially respond to \`primaryColor\` and related palette tokens — validate in your target renderer, as xychart-beta color application can vary. No per-bar or per-point style overrides are possible with classDef or inline styling.`
                    : diagramFamily === "journey"
                      ? `## Journey diagram: section and task syntax

\`journey\` styling is controlled entirely by the theme directive above — section backgrounds, task bars, and label fonts all come from the theme variables. There is **no** \`:::className\` syntax in journey diagrams; individual tasks cannot be styled with classDef.

### Task declaration syntax

Each task follows the pattern \`Task label : score: Actor1, Actor2\`. Scores range from **1** (very negative) to **5** (very positive) and control the vertical position of each task bar on the experience curve.

\`\`\`mermaid
${exampleDirective}
journey
    title User Onboarding Experience
    section Sign-up
        Visit landing page   : 4: Visitor
        Fill out form        : 3: Visitor
        Confirm email        : 2: Visitor
    section First use
        Complete tutorial    : 5: User
        Explore dashboard    : 4: User
    section Ongoing
        Daily check-in       : 5: User, Team
        Share with colleague : 4: User
\`\`\`

### Score reference

| Score | Experience |
|-------|-----------|
| \`5\` | Very positive |
| \`4\` | Positive |
| \`3\` | Neutral |
| \`2\` | Negative |
| \`1\` | Very negative |

Multiple actors separated by commas (\`Actor1, Actor2\`) are all shown on the same task row.

---

## Journey diagram: theming note

All journey colors come from the theme directive. Scores (1–5) control task bar height on the experience curve — they are not affected by theme styling. No per-task style overrides are possible with classDef or inline styling.`
                      : diagramFamily === "timeline"
                        ? `## Timeline diagram: period and event syntax

\`timeline\` styling is controlled entirely by the theme directive above — period headers, event blocks, and label fonts all come from the theme variables. There is **no** \`:::className\` syntax in timeline diagrams; individual events cannot be styled with classDef.

### Event declaration syntax

Group events under named periods. Multiple events can appear under the same period date/label by repeating the indented \`:\` notation:

\`\`\`mermaid
${exampleDirective}
timeline
    title Product Roadmap
    section Q1
        Jan : Kickoff
            : Team onboarding
        Feb : Architecture design
        Mar : Prototype complete
    section Q2
        Apr : Alpha release
            : User testing begins
        May : Feedback review
        Jun : Beta launch
\`\`\`

Periods (the date or label before the first \`:\`) appear as section headers on the timeline rail. Events (indented \`:\` entries) appear as blocks under their period. \`section\` groups are optional but help with long timelines.

---

## Timeline diagram: theming note

All timeline colors come from the theme directive. Period header colors, event block backgrounds, and connector lines are all theme-controlled. No per-event style overrides are possible with classDef or inline styling.`
                        : diagramFamily === "quadrantChart"
                          ? `## Quadrant chart: axis and point syntax

\`quadrantChart\` styling is controlled entirely by the theme directive above — quadrant backgrounds, axis labels, and point colors all come from the theme variables. There is **no** \`:::className\` syntax in quadrant charts; individual points cannot be styled with classDef.

### Axis and quadrant label declaration

Always declare \`x-axis\` and \`y-axis\` before any points. Quadrant labels (\`quadrant-1\` through \`quadrant-4\`) are optional but recommended for clarity:

\`\`\`mermaid
${exampleDirective}
quadrantChart
    title Strategic Portfolio
    x-axis Low Complexity --> High Complexity
    y-axis Low Value --> High Value
    quadrant-1 Core investments
    quadrant-2 Plan carefully
    quadrant-3 Deprioritize
    quadrant-4 Quick wins
    Initiative A: [0.2, 0.8]
    Initiative B: [0.6, 0.75]
    Initiative C: [0.35, 0.3]
    Initiative D: [0.75, 0.25]
\`\`\`

### Point placement

Points are declared as \`Label: [x, y]\` where \`x\` and \`y\` are decimal values between \`0\` and \`1\` (0 = left/bottom, 1 = right/top).

### Quadrant numbering

| Label | Position |
|-------|----------|
| \`quadrant-1\` | Top-right |
| \`quadrant-2\` | Top-left |
| \`quadrant-3\` | Bottom-left |
| \`quadrant-4\` | Bottom-right |

---

## Quadrant chart: theming note

All quadrant colors come from the theme directive. Point colors, quadrant backgrounds, and axis line colors are theme-controlled. No per-point style overrides are possible with classDef or inline styling.`
                          : diagramFamily === "block"
                            ? `## Block diagram: columns/space/block syntax & classDef theming

\`block-beta\` supports \`:::className\` styling — apply the semantic classDef vocabulary below to block nodes. The theme directive controls default colors; classDef adds per-block color variation.

### Layout syntax

Declare the column count with \`columns N\` at the top of the diagram. Blocks are declared by ID with optional labels. Use \`space\` to insert empty grid cells for alignment:

\`\`\`mermaid
${exampleDirective}
block-beta
    columns 3
    A["Input"] B["Process"] C["Output"]
    space D["Storage"] space

    A --> B
    B --> C
    B --> D
\`\`\`

### Block shape variants

| Syntax | Shape |
|--------|-------|
| \`id["label"]\` | Rectangle (default) |
| \`id(["label"])\` | Rounded rectangle |
| \`id(("label"))\` | Circle |
| \`id{{"label"}}\` | Hexagon |
| \`id>"label"]\` | Asymmetric / flag shape |

### classDef styling

Apply \`:::className\` to individual block nodes after all block declarations:

\`\`\`mermaid
${exampleDirective}
block-beta
    columns 3
    A["User"]:::actor
    B["Service"]:::primary
    C["Database"]:::platform

    A --> B
    B --> C
\`\`\`

---

## Semantic classDef library

${
  classDefCaveatNote
    ? classDefCaveatNote
    : `Apply these classDef classes to block nodes using \`:::className\` syntax. Do NOT add any other fill, stroke, or color values — use only these classes.

\`\`\`mermaid
${exampleDirective}
block-beta
${classDefBlock}

    %% Usage example: A["My Block"]:::primary
    %% Apply to any block node: B["Storage"]:::platform
\`\`\`

### Class reference table

| Class | Role | When to use |
|-------|------|-------------|
| \`primary\` | Main action / primary entity | Core blocks, key steps, subject of the diagram |
| \`secondary\` | Supporting / related entity | Adjacent processes, related systems |
| \`tertiary\` | Background / context | Passive blocks, reference items |
| \`platform\` | Platform / infrastructure | Hosting layer, databases, queues |
| \`boundary\` | System boundary (dashed) | External system limits, context edges |
| \`actor\` | Person / user / role | Human actors, teams, personas |
| \`gate\` | Decision / gateway | Branching or condition blocks |
| \`control\` | Control / management | Orchestrators, managers |
| \`log\` | Log / audit / record (italic) | Audit trails, event logs |
| \`question\` | Open question / TBD (dashed) | Unknowns, pending design |
| \`accent\` | Highlighted / key result | Outputs, final states, primary results |
| \`deepBlue\` | Deep emphasis | Core or critical blocks |
| \`slate\` | Neutral / muted | Supporting detail blocks |
| \`scope\` | In-scope boundary | Blocks explicitly in scope |
| \`outOfScope\` | Out-of-scope (faded, dashed) | Excluded blocks |
| \`redDash\` | Warning / error / blocker | Error states, blockers |`
}

---

## Block diagram: theming note

The theme directive controls background, border, and text colors for all blocks. Use \`:::className\` with the classDef vocabulary for per-block color variation. \`space\` cells are invisible layout-only placeholders — they cannot be styled.`
                            : diagramFamily === "c4Diagram"
                              ? `## C4 diagram: architecture vocabulary & theming

\`c4Diagram\` styling is partially controlled by the theme directive — background, border, and label fonts respond to some themeVariables, but not all tokens are applied consistently across element types. There is **no** \`:::className\` syntax in C4 diagrams; elements cannot be individually styled with classDef.

### C4 element types

| Statement | Meaning |
|-----------|---------|
| \`Person(id, "Label", "Description")\` | A person / user role |
| \`System(id, "Label", "Description")\` | An internal system |
| \`System_Ext(id, "Label", "Description")\` | An external system (outside your scope) |
| \`Container(id, "Label", "Technology", "Description")\` | A container within a system |
| \`Component(id, "Label", "Technology", "Description")\` | A component within a container |
| \`Rel(fromId, toId, "Label")\` | Directional relationship |
| \`Rel(fromId, toId, "Label", "Technology")\` | Relationship with technology annotation |
| \`BiRel(fromId, toId, "Label")\` | Bidirectional relationship |

### C4 diagram type keywords

| Keyword | Context |
|---------|---------|
| \`C4Context\` | System context — people and systems |
| \`C4Container\` | Container view — internal containers |
| \`C4Component\` | Component view — internal components |
| \`C4Dynamic\` | Dynamic / sequence view |

### Syntax example

\`\`\`mermaid
${exampleDirective}
C4Context
    title System Context — My Application
    Person(user, "User", "A person using the system")
    System(app, "My Application", "Core application")
    System_Ext(ext, "External Service", "Third-party API")
    Rel(user, app, "Uses", "HTTPS")
    Rel(app, ext, "Calls", "REST/HTTPS")
\`\`\`

---

## C4 diagram: theming note

All C4 element colors (person icons, system/container boxes, boundary lines) are controlled by the theme directive. themeVariable support is partial — some tokens may not apply to all element types. No per-element style overrides are possible with classDef or inline styling.`
                              : diagramFamily === "sankey"
                                ? `## Sankey diagram: CSV link syntax

\`sankey-beta\` styling is controlled entirely by the theme directive above — flow band colors, node label fonts, and background all come from the theme variables. There is **no** \`:::className\` syntax in sankey diagrams; individual flows cannot be styled with classDef.

### Link declaration syntax

Each line declares one flow as \`source,target,value\` (comma-separated, no spaces around commas). The \`value\` is a positive number representing the flow magnitude:

\`\`\`mermaid
${exampleDirective}
sankey-beta
Renewable,Wind,45
Renewable,Solar,55
Wind,Grid,45
Solar,Grid,40
Solar,Storage,15
Grid,Industrial,60
Grid,Residential,25
\`\`\`

### Link format reference

| Field | Description |
|-------|-------------|
| \`source\` | Origin node label (bare text, no quotes required) |
| \`target\` | Destination node label |
| \`value\` | Flow magnitude (positive number; relative widths are auto-scaled) |

Nodes are created automatically from the unique source and target labels — there is no separate node declaration syntax. Duplicate labels are merged into the same node.

---

## Sankey diagram: theming note

All sankey band colors and node fill colors come from the theme directive. Flow band widths are proportional to values — they are not affected by theme styling. No per-flow or per-node style overrides are possible with classDef or inline styling.`
                                : diagramFamily === "packet"
                                  ? `## Packet diagram: block and field syntax

\`packet-beta\` styling is controlled entirely by the theme directive above — field block colors, label fonts, and background all come from the theme variables. There is **no** \`:::className\` syntax in packet diagrams; individual fields cannot be styled with classDef.

### Field declaration syntax

Each field occupies a bit range declared as \`startBit-endBit: "Label"\`. Fields are rendered left-to-right in ascending bit order across a fixed-width row (default 32 bits per row):

\`\`\`mermaid
${exampleDirective}
packet-beta
0-3: "Version"
4-7: "IHL"
8-15: "DSCP+ECN"
16-31: "Total Length"
32-47: "Identification"
48-50: "Flags"
51-63: "Fragment Offset"
64-71: "TTL"
72-79: "Protocol"
80-95: "Header Checksum"
96-127: "Source IP"
128-159: "Destination IP"
\`\`\`

### Field format reference

| Field | Description |
|-------|-------------|
| \`startBit\` | Zero-based bit index of the field's first bit |
| \`endBit\` | Zero-based bit index of the field's last bit (inclusive) |
| \`"Label"\` | Quoted display label for the field block |

Fields that span more than one row are automatically wrapped. Multi-word labels should be quoted.

---

## Packet diagram: theming note

All field block colors, border colors, and label fonts come from the theme directive. Field widths are proportional to bit-range sizes — they are not affected by theme styling. No per-field style overrides are possible with classDef or inline styling.`
                                  : diagramFamily === "requirementDiagram"
                                    ? `## Requirement diagram: declaration and relationship syntax

\`requirementDiagram\` styling is controlled entirely by the theme directive above — requirement box colors, element box colors, and label fonts all come from the theme variables. There is **no** \`:::className\` syntax in requirement diagrams; individual requirements or elements cannot be styled with classDef.

### Requirement declaration syntax

Declare requirements with a type keyword, a name, and a body block. The type keyword controls the visual label on the box:

\`\`\`mermaid
${exampleDirective}
requirementDiagram

requirement DataIntegrity {
    id: 1
    text: All data writes must be validated before persistence
    risk: high
    verifyMethod: test
}

performanceRequirement ResponseTime {
    id: 2
    text: API responses must complete within 200ms at p95
    risk: medium
    verifyMethod: analysis
}

element APIService {
    type: system
    docref: /docs/api-service
}

DataIntegrity - satisfies -> APIService
ResponseTime - traces -> DataIntegrity
\`\`\`

### Requirement type keywords

| Keyword | Meaning |
|---------|---------|
| \`requirement\` | General requirement |
| \`functionalRequirement\` | Functional requirement |
| \`performanceRequirement\` | Performance requirement |
| \`interfaceRequirement\` | Interface / integration requirement |
| \`physicalRequirement\` | Physical / hardware requirement |
| \`designConstraint\` | Design constraint |

### Requirement body fields

| Field | Values |
|-------|--------|
| \`id\` | Unique identifier (number or string) |
| \`text\` | Human-readable description |
| \`risk\` | \`low\`, \`medium\`, or \`high\` |
| \`verifyMethod\` | \`analysis\`, \`demonstration\`, \`inspection\`, or \`test\` |

### Relationship syntax

| Syntax | Meaning |
|--------|---------|
| \`A - contains -> B\` | A contains B |
| \`A - copies -> B\` | A copies B |
| \`A - derives -> B\` | A is derived from B |
| \`A - satisfies -> B\` | A satisfies B (element satisfies requirement) |
| \`A - traces -> B\` | A traces to B |
| \`A - refines -> B\` | A refines B |
| \`A - verifies -> B\` | A verifies B |

---

## Requirement diagram: theming note

All requirement and element box colors, border styles, and label fonts come from the theme directive. No per-requirement or per-element style overrides are possible with classDef or inline styling.`
                                    : `## Semantic classDef library

${
  classDefCaveatNote
    ? classDefCaveatNote
    : `This is the complete styling vocabulary for this theme. Apply these classDef classes to nodes using \`:::className\` syntax. Do NOT add any other fill, stroke, or color values — use only these classes.

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
| \`redDash\` | Warning / error / blocker | Error states, blockers, known failures |`
}

---

## Subgraph tier patterns

Use \`style SubgraphName ...\` statements to apply visual hierarchy to subgraphs. Replace \`SubgraphName\` with the actual subgraph ID.

\`\`\`mermaid
${exampleDirective}
flowchart TD
${subgraphBlock}
\`\`\``
}

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

${
  diagramFamily === "sequenceDiagram"
    ? `1. ${formatRuleText}
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
12. If the diagram type changes, preserve the exact same theme directive.`
    : diagramFamily === "erDiagram"
      ? `1. ${formatRuleText}
2. Add the metadata comment block immediately after the theme directive.
3. Use \`erDiagram\` as the diagram type.
4. Declare all entities with their attributes: \`ENTITY_NAME { dataType attrName PK|FK|UK "description" }\`.
5. Use correct cardinality notation: \`||--o{\` (one-to-many), \`}o--o{\` (many-to-many), \`||--||\` (one-to-one), etc.
6. Always include a relationship label in quotes: \`ENTITY_A ||--o{ ENTITY_B : "label"\`.
7. Do NOT use \`:::className\` syntax — erDiagram does not support per-entity classDef styling.
8. Do NOT add inline \`fill:\`, \`stroke:\`, or \`color:\` values — the theme directive handles all styling.
9. Do NOT change any color values — reproduce them exactly as shown.
10. Attribute type names are descriptive only; Mermaid does not validate them against a schema.
11. If the diagram type changes, preserve the exact same theme directive.`
      : diagramFamily === "classDiagram"
        ? `1. ${formatRuleText}
2. Add the metadata comment block immediately after the theme directive.
3. Use \`classDiagram\` as the diagram type.
4. Declare classes with their attributes and methods: \`class Name { +type attr method() ReturnType }\`.
5. Use visibility modifiers: \`+\` (public), \`-\` (private), \`#\` (protected), \`~\` (package).
6. Use correct relationship arrows: \`<|--\` (inheritance), \`*--\` (composition), \`o--\` (aggregation), \`-->\` (association).
7. Include cardinality labels where meaningful: \`"1"\` / \`"0..*"\` on each end of the line.
8. Style class nodes using \`:::className\` with the classDef vocabulary from the scaffold.
9. Do NOT add inline \`fill:\`, \`stroke:\`, or \`color:\` values — use classDef classes instead.
10. Do NOT change any color values — reproduce them exactly as shown.
11. If the diagram type changes, preserve the exact same theme directive.`
        : diagramFamily === "stateDiagram"
          ? `1. ${formatRuleText}
2. Add the metadata comment block immediately after the theme directive.
3. Use \`stateDiagram-v2\` as the diagram type.
4. Use \`[*]\` for the initial state and terminal (end) states.
5. Transition syntax: \`StateA --> StateB : label\`.
6. Use \`state CompositeName { ... }\` for composite (nested) states.
7. Use \`--\` inside a composite state to separate concurrent regions.
8. classDef styling is available but support varies by renderer — test before relying on it.
9. Do NOT add inline \`fill:\`, \`stroke:\`, or \`color:\` values — the theme directive handles all styling.
10. Do NOT change any color values — reproduce them exactly as shown.
11. If the diagram type changes, preserve the exact same theme directive.`
          : diagramFamily === "gantt"
            ? `1. ${formatRuleText}
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
12. If the diagram type changes, preserve the exact same theme directive.`
            : diagramFamily === "pie"
              ? `1. ${formatRuleText}
2. Add the metadata comment block immediately after the theme directive.
3. Use \`pie\` as the diagram type.
4. Add a \`title\` on the same line as \`pie\`: \`pie title My Title\`.
5. Each slice is \`"Label" : value\` where value is a positive number — Mermaid auto-calculates percentages.
6. Labels must be quoted strings; keep them concise (under 40 characters each).
7. Do NOT use \`:::className\` syntax — pie does not support per-slice classDef styling.
8. Do NOT add inline \`fill:\`, \`stroke:\`, or \`color:\` values — the theme directive handles all styling.
9. Do NOT change any color values — reproduce them exactly as shown.
10. If the diagram type changes, preserve the exact same theme directive.`
              : diagramFamily === "mindmap"
                ? `1. ${formatRuleText}
2. Add the metadata comment block immediately after the theme directive.
3. Use \`mindmap\` as the diagram type.
4. The root node is at the first indentation level; each deeper level creates child nodes.
5. Use consistent indentation (2 or 4 spaces) — do not mix indent sizes within the same diagram.
6. Use shape notation to distinguish node types: \`((text))\` for root, \`[text]\` for categories, \`(text)\` for subcategories.
7. Keep node labels concise (under 40 characters each).
8. Do NOT use \`:::className\` syntax — mindmap does not support per-node classDef styling.
9. Do NOT add inline \`fill:\`, \`stroke:\`, or \`color:\` values — the theme directive handles all styling.
10. Do NOT change any color values — reproduce them exactly as shown.
11. If the diagram type changes, preserve the exact same theme directive.`
                : diagramFamily === "gitGraph"
                  ? `1. ${formatRuleText}
2. Add the metadata comment block immediately after the theme directive.
3. Use \`gitGraph\` as the diagram type.
4. Always use \`checkout\` before adding commits to a branch — do not commit directly without checking out the branch first.
5. Use \`commit id: "label"\` to give commits meaningful display names.
6. Use \`tag: "v1.0.0"\` on milestone commits to add version badges.
7. Use \`merge branchName\` (on the receiving branch after \`checkout\`) to merge commits.
8. Do NOT use \`:::className\` syntax — gitGraph does not support per-commit or per-branch classDef styling.
9. Do NOT add inline \`fill:\`, \`stroke:\`, or \`color:\` values — the theme directive handles all styling.
10. Do NOT change any color values — reproduce them exactly as shown.
11. Branch rail colors (\`git0\`–\`git7\`) are assigned by the renderer — do not attempt to override them with classDef.
12. If the diagram type changes, preserve the exact same theme directive.`
                  : diagramFamily === "xychart"
                    ? `1. ${formatRuleText}
2. Add the metadata comment block immediately after the theme directive.
3. Use \`xychart-beta\` as the diagram type keyword.
4. Always declare \`title\`, \`x-axis\`, and \`y-axis\` before any data series (\`bar\` or \`line\`).
5. The number of values in each \`bar\` or \`line\` series must match the number of x-axis categories exactly.
6. \`y-axis\` range syntax: \`"Axis Label" min --> max\` — the label must be a quoted string.
7. Use \`bar\` for column series and \`line\` for line series; both can appear together in the same chart.
8. Do NOT use \`:::className\` syntax — xychart-beta does not support per-bar or per-point classDef styling.
9. Do NOT add inline \`fill:\`, \`stroke:\`, or \`color:\` values — the theme directive handles all styling.
10. Do NOT change any color values — reproduce them exactly as shown.
11. Validate the output in your target renderer — xychart-beta color application varies across renderers.
12. If the diagram type changes, preserve the exact same theme directive.`
                    : diagramFamily === "journey"
                      ? `1. ${formatRuleText}
2. Add the metadata comment block immediately after the theme directive.
3. Use \`journey\` as the diagram type.
4. Each task follows the syntax \`Task label : score: Actor1, Actor2\` — the score (1–5) is required and controls vertical position on the experience curve.
5. Group tasks into \`section\` blocks for phase or stage organization.
6. Scores must be integers between 1 and 5: 1 = very negative, 3 = neutral, 5 = very positive.
7. List multiple actors separated by commas after the score — all named actors appear on the same task bar.
8. Do NOT use \`:::className\` syntax — journey does not support per-task classDef styling.
9. Do NOT add inline \`fill:\`, \`stroke:\`, or \`color:\` values — the theme directive handles all styling.
10. Do NOT change any color values — reproduce them exactly as shown.
11. If the diagram type changes, preserve the exact same theme directive.`
                      : diagramFamily === "timeline"
                        ? `1. ${formatRuleText}
2. Add the metadata comment block immediately after the theme directive.
3. Use \`timeline\` as the diagram type.
4. Use \`title\` to name the overall timeline.
5. Periods (dates or labels) appear before the first \`:\` on a line — they become the column headers on the timeline rail.
6. Events appear as \`: Event label\` entries indented under their period — multiple events share the same period column.
7. Use optional \`section\` blocks to group periods into larger phases.
8. Do NOT use \`:::className\` syntax — timeline does not support per-event classDef styling; styling is theme-only.
9. Do NOT add inline \`fill:\`, \`stroke:\`, or \`color:\` values — the theme directive handles all styling.
10. Do NOT change any color values — reproduce them exactly as shown.
11. If the diagram type changes, preserve the exact same theme directive.`
                        : diagramFamily === "quadrantChart"
                          ? `1. ${formatRuleText}
2. Add the metadata comment block immediately after the theme directive.
3. Use \`quadrantChart\` as the diagram type keyword.
4. Always declare \`x-axis\` and \`y-axis\` with labels and direction: \`x-axis Low Label --> High Label\`.
5. Quadrant labels (\`quadrant-1\` through \`quadrant-4\`) are optional but recommended: 1 = top-right, 2 = top-left, 3 = bottom-left, 4 = bottom-right.
6. Points use \`Label: [x, y]\` where x and y are decimal values between 0 (left/bottom) and 1 (right/top).
7. Use a \`title\` line to name the chart — it appears as the chart heading.
8. Do NOT use \`:::className\` syntax — quadrantChart does not support per-point classDef styling.
9. Do NOT add inline \`fill:\`, \`stroke:\`, or \`color:\` values — the theme directive handles all styling.
10. Do NOT change any color values — reproduce them exactly as shown.
11. If the diagram type changes, preserve the exact same theme directive.`
                          : diagramFamily === "block"
                            ? `1. ${formatRuleText}
2. Add the metadata comment block immediately after the theme directive.
3. Use \`block-beta\` as the diagram type.
4. Declare \`columns N\` at the top to set the grid width — blocks fill left-to-right, top-to-bottom.
5. Use \`space\` to insert empty grid cells and control layout alignment.
6. Block shape syntax: \`id["label"]\` (rectangle), \`id(["label"])\` (rounded), \`id(("label"))\` (circle), \`id{{"label"}}\` (hexagon).
7. Style block nodes using \`:::className\` with the classDef vocabulary from the scaffold.
8. Declare all edges (\`A --> B\`) after all block declarations.
9. Do NOT add inline \`fill:\`, \`stroke:\`, or \`color:\` values — use classDef classes instead.
10. Do NOT change any color values — reproduce them exactly as shown.
11. If the diagram type changes, preserve the exact same theme directive.`
                            : diagramFamily === "c4Diagram"
                              ? `1. ${formatRuleText}
2. Add the metadata comment block immediately after the theme directive.
3. Use the appropriate C4 diagram type keyword: \`C4Context\`, \`C4Container\`, \`C4Component\`, or \`C4Dynamic\`.
4. Declare all elements before relationships: \`Person(id, "Label", "Description")\`, \`System(id, "Label", "Description")\`, etc.
5. Use \`System_Ext\` for external systems (outside your scope boundary).
6. Relationship syntax: \`Rel(fromId, toId, "label")\` or \`Rel(fromId, toId, "label", "technology")\`.
7. Use \`title\` to name the diagram view.
8. Do NOT use \`:::className\` syntax — c4Diagram does not support per-element classDef styling.
9. Do NOT add inline \`fill:\`, \`stroke:\`, or \`color:\` values — the theme directive handles all styling.
10. Do NOT change any color values — reproduce them exactly as shown.
11. themeVariable support is partial — validate the output in your target renderer before publishing.
12. If the diagram type changes, preserve the exact same theme directive.`
                              : diagramFamily === "sankey"
                                ? `1. ${formatRuleText}
2. Add the metadata comment block immediately after the theme directive.
3. Use \`sankey-beta\` as the diagram type keyword.
4. Each line must be exactly \`source,target,value\` — comma-separated with no spaces around the commas.
5. The \`value\` must be a positive number (integer or decimal); Mermaid auto-scales flow band widths.
6. Nodes are implicit — they are created from unique source and target labels; do not declare nodes separately.
7. Duplicate node labels are merged into the same node — spelling and capitalization must be consistent.
8. Do NOT use \`:::className\` syntax — sankey-beta does not support per-flow or per-node classDef styling.
9. Do NOT add inline \`fill:\`, \`stroke:\`, or \`color:\` values — the theme directive handles all styling.
10. Do NOT change any color values — reproduce them exactly as shown.
11. If the diagram type changes, preserve the exact same theme directive.`
                                : diagramFamily === "packet"
                                  ? `1. ${formatRuleText}
2. Add the metadata comment block immediately after the theme directive.
3. Use \`packet-beta\` as the diagram type keyword.
4. Each field is declared as \`startBit-endBit: "Label"\` — bit indices are zero-based and end-inclusive.
5. Fields must not overlap in bit range — ensure ranges are contiguous and non-overlapping.
6. Labels should be quoted strings; keep them concise (under 30 characters each).
7. Fields that span more than one row width (default 32 bits) are automatically wrapped — no special syntax needed.
8. Do NOT use \`:::className\` syntax — packet-beta does not support per-field classDef styling.
9. Do NOT add inline \`fill:\`, \`stroke:\`, or \`color:\` values — the theme directive handles all styling.
10. Do NOT change any color values — reproduce them exactly as shown.
11. If the diagram type changes, preserve the exact same theme directive.`
                                  : diagramFamily === "requirementDiagram"
                                    ? `1. ${formatRuleText}
2. Add the metadata comment block immediately after the theme directive.
3. Use \`requirementDiagram\` as the diagram type keyword.
4. Declare all requirements before elements, and all elements before relationships.
5. Each requirement body must include \`id\`, \`text\`, \`risk\` (low/medium/high), and \`verifyMethod\` (analysis/demonstration/inspection/test).
6. Use the appropriate type keyword for each requirement: \`requirement\`, \`functionalRequirement\`, \`performanceRequirement\`, \`interfaceRequirement\`, \`physicalRequirement\`, or \`designConstraint\`.
7. Each element body must include \`type\` and optionally \`docref\`.
8. Relationship syntax: \`A - relationshipType -> B\` — valid types are \`contains\`, \`copies\`, \`derives\`, \`satisfies\`, \`traces\`, \`refines\`, \`verifies\`.
9. Do NOT use \`:::className\` syntax — requirementDiagram does not support per-requirement or per-element classDef styling.
10. Do NOT add inline \`fill:\`, \`stroke:\`, or \`color:\` values — the theme directive handles all styling.
11. Do NOT change any color values — reproduce them exactly as shown.
12. If the diagram type changes, preserve the exact same theme directive.`
                                    : `1. ${formatRuleText}
2. Add the metadata comment block immediately after the theme directive.
3. Use \`${diagramFamily === "unknown" ? "flowchart TD" : diagramFamily === "flowchart" ? "flowchart TD" : diagramFamily}\` as the diagram type unless the user specifies otherwise.
4. Keep node labels concise (under 60 characters each).
5. Style nodes using ONLY the classDef classes defined above — apply with \`:::className\` syntax.
6. Do NOT add inline \`fill:\`, \`stroke:\`, or \`color:\` values on individual nodes — use classDef classes instead.
7. Do NOT change any color values — reproduce them exactly as shown.
8. Use subgraph tier styles for visual hierarchy — never leave subgraphs unstyled.
9. If the diagram type changes, preserve the exact same theme directive.
10. If the diagram type does not support classDef (e.g. sequenceDiagram, erDiagram), omit classDef statements entirely — the theme directive handles all styling.`
}

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
${
  supportsClassDef
    ? `3. Re-apply all node classes using the classDef vocabulary from the original scaffold (:::className syntax). Do not add any inline fill, stroke, or color values.
4. Do not change any logic, labels, or relationships — only restore the visual styling contract.
5. Output the complete diagram from top to bottom — do not abbreviate or use "..." placeholders.`
    : `3. Do not add classDef statements — this diagram type (${familyName}) does not support them. The theme directive handles all styling.
4. Do not change any logic, labels, or relationships — only restore the visual styling contract.
5. Output the complete diagram from top to bottom — do not abbreviate or use "..." placeholders.`
}

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
  format: ScaffoldFormat
): string {
  return buildScaffold(palette, options, format);
}
