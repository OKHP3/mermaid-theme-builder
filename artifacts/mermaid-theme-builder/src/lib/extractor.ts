import type { ThemeColor, Palette } from "./palettes";

export interface ExtractedClassDef {
  name: string;
  fill?: string;
  stroke?: string;
  color?: string;
  strokeWidth?: string;
}

export type ExtractionSource = "frontmatter" | "init-directive" | "none";

export interface ExtractedTheme {
  themeName?: string;
  themeVariables: Record<string, string>;
  classDefs: ExtractedClassDef[];
  sourceFormat: ExtractionSource;
}

const HEX_OR_NAMED = /^#?[0-9a-zA-Z][\w#,()%.\s-]*$/;

function safeUnquote(value: string): string {
  const v = value.trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    return v.slice(1, -1);
  }
  return v;
}

function normalizeColor(value: string): string {
  const v = safeUnquote(value).trim();
  if (!v) return v;
  // Accept hex, rgb(), rgba(), hsl(), hsla(), named colors, font strings.
  return v;
}

/**
 * Extract themeVariables from a YAML frontmatter block.
 * Mermaid v10.5+ format:
 *   ---
 *   config:
 *     theme: base
 *     themeVariables:
 *       primaryColor: "#abc123"
 *   ---
 */
function parseFrontmatter(code: string): { theme?: string; vars: Record<string, string> } | null {
  const match = code.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return null;
  const block = match[1];

  // Find themeVariables block by indentation
  const tvIdx = block.search(/^[ \t]*themeVariables\s*:\s*$/m);
  if (tvIdx === -1) {
    // Maybe it's still useful even without themeVariables
    const themeMatch = block.match(/^[ \t]*theme\s*:\s*(["']?)([^"'\n]+)\1\s*$/m);
    if (themeMatch) return { theme: themeMatch[2].trim(), vars: {} };
    return null;
  }

  const themeMatch = block.match(/^[ \t]*theme\s*:\s*(["']?)([^"'\n]+)\1\s*$/m);
  const theme = themeMatch ? themeMatch[2].trim() : undefined;

  // Read indented entries after themeVariables:
  const after = block.slice(tvIdx);
  const lines = after.split("\n").slice(1);
  // Determine indent from first non-empty line
  let baseIndent = -1;
  const vars: Record<string, string> = {};
  for (const rawLine of lines) {
    if (!rawLine.trim()) continue;
    const indentMatch = rawLine.match(/^([ \t]*)\S/);
    if (!indentMatch) continue;
    const indent = indentMatch[1].length;
    if (baseIndent === -1) baseIndent = indent;
    if (indent < baseIndent) break;
    if (indent !== baseIndent) continue;
    const kv = rawLine.trim().match(/^([A-Za-z_][\w]*)\s*:\s*(.*)$/);
    if (!kv) continue;
    vars[kv[1]] = normalizeColor(kv[2]);
  }
  return { theme, vars };
}

/**
 * Extract themeVariables from `%%{init: {...}}%%` directive.
 * Tolerates JSON5-ish input (single quotes, trailing commas, unquoted keys).
 */
function parseInitDirective(code: string): { theme?: string; vars: Record<string, string> } | null {
  const match = code.match(/%%\s*\{[\s\S]*?init\s*:\s*([\s\S]*?)\}\s*%%/);
  if (!match) return null;
  let payload = match[1].trim();
  // Strip trailing closing braces matching the outer init wrapper
  // The captured payload starts at the value of "init:" — locate the balanced object.
  // Simpler: find the largest top-level {...} substring within the directive block.
  const directiveBlock = match[0];
  const objMatch = directiveBlock.match(/init\s*:\s*(\{[\s\S]*\})\s*\}\s*%%/);
  if (objMatch) payload = objMatch[1];

  // Try to recover themeVariables by simple text search rather than full JSON parse
  const tvMatch = payload.match(/themeVariables\s*:\s*\{([\s\S]*?)\}/);
  const themeMatch = payload.match(/(?:^|[\s,{])theme\s*:\s*["']?([A-Za-z][\w-]*)["']?/);
  const theme = themeMatch ? themeMatch[1] : undefined;

  if (!tvMatch) {
    return theme ? { theme, vars: {} } : null;
  }

  const inside = tvMatch[1];
  const vars: Record<string, string> = {};
  // Match key:value pairs. Keys may be quoted.
  const kvRe = /(?:["']([A-Za-z_][\w-]*)["']|([A-Za-z_][\w-]*))\s*:\s*(?:"([^"]*)"|'([^']*)'|([^,}\n]+))/g;
  let m: RegExpExecArray | null;
  while ((m = kvRe.exec(inside)) !== null) {
    const key = m[1] ?? m[2];
    const value = (m[3] ?? m[4] ?? m[5] ?? "").trim().replace(/,\s*$/, "");
    if (key && value && HEX_OR_NAMED.test(value)) {
      vars[key] = normalizeColor(value);
    } else if (key && value) {
      // Allow font strings with spaces, commas — only if quoted (m[3]/m[4])
      if (m[3] !== undefined || m[4] !== undefined) {
        vars[key] = normalizeColor(value);
      }
    }
  }
  return { theme, vars };
}

/**
 * Extract `classDef <name> <styles>` declarations.
 * Supports both `key:value,key:value` and `key=value` flowchart syntax.
 */
function parseClassDefs(code: string): ExtractedClassDef[] {
  const re = /^\s*classDef\s+([A-Za-z_][\w-]*)\s+([^\n]+)$/gm;
  const result: ExtractedClassDef[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(code)) !== null) {
    const name = m[1];
    if (name === "mtb_watermark") continue;
    const styleStr = m[2].trim();
    const def: ExtractedClassDef = { name };
    for (const part of styleStr.split(",")) {
      const kv = part.trim().match(/^([A-Za-z-]+)\s*[:=]\s*(.+)$/);
      if (!kv) continue;
      const key = kv[1].toLowerCase();
      const value = kv[2].trim();
      if (key === "fill") def.fill = value;
      else if (key === "stroke") def.stroke = value;
      else if (key === "color") def.color = value;
      else if (key === "stroke-width" || key === "strokewidth") def.strokeWidth = value;
    }
    result.push(def);
  }
  return result;
}

/**
 * Defensive: never throws. Returns an empty extraction if input is malformed.
 */
export function extractTheme(code: string): ExtractedTheme {
  const fallback: ExtractedTheme = {
    themeVariables: {},
    classDefs: [],
    sourceFormat: "none",
  };
  if (!code || typeof code !== "string") return fallback;
  try {
    const fm = parseFrontmatter(code);
    const init = parseInitDirective(code);
    const classDefs = parseClassDefs(code);

    let themeVariables: Record<string, string> = {};
    let themeName: string | undefined;
    let sourceFormat: ExtractionSource = "none";

    if (fm && Object.keys(fm.vars).length > 0) {
      themeVariables = fm.vars;
      themeName = fm.theme;
      sourceFormat = "frontmatter";
    } else if (init && Object.keys(init.vars).length > 0) {
      themeVariables = init.vars;
      themeName = init.theme;
      sourceFormat = "init-directive";
    } else if (fm) {
      themeName = fm.theme;
      sourceFormat = "frontmatter";
    } else if (init) {
      themeName = init.theme;
      sourceFormat = "init-directive";
    }

    return { themeName, themeVariables, classDefs, sourceFormat };
  } catch {
    return fallback;
  }
}

/**
 * True iff the code contains anything worth extracting (themeVariables or classDefs).
 */
export function hasExtractableTheme(code: string): boolean {
  const e = extractTheme(code);
  return Object.keys(e.themeVariables).length > 0 || e.classDefs.length > 0;
}

const EXTRACTED_PALETTE_PREFIX = "extracted-";

export function isExtractedPaletteId(id: string): boolean {
  return id.startsWith(EXTRACTED_PALETTE_PREFIX);
}

export function makeExtractedPaletteId(): string {
  return `${EXTRACTED_PALETTE_PREFIX}${Date.now().toString(36)}`;
}

const PALETTE_KEY_LABELS: Array<{ key: string; label: string }> = [
  { key: "primaryColor", label: "Primary (nodes)" },
  { key: "primaryTextColor", label: "Primary text" },
  { key: "primaryBorderColor", label: "Primary border" },
  { key: "lineColor", label: "Lines & arrows" },
  { key: "secondaryColor", label: "Secondary nodes" },
  { key: "tertiaryColor", label: "Tertiary nodes" },
  { key: "background", label: "Background" },
  { key: "mainBkg", label: "Main background" },
  { key: "nodeBorder", label: "Node border" },
  { key: "clusterBkg", label: "Cluster background" },
  { key: "titleColor", label: "Title color" },
  { key: "edgeLabelBackground", label: "Edge label bg" },
  { key: "fontFamily", label: "Font family" },
];

const FALLBACK_COLORS: Record<string, string> = {
  primaryColor: "#1f2937",
  primaryTextColor: "#ffffff",
  primaryBorderColor: "#6b7280",
  lineColor: "#6b7280",
  secondaryColor: "#374151",
  tertiaryColor: "#e5e7eb",
  background: "#ffffff",
  mainBkg: "#f3f4f6",
  nodeBorder: "#6b7280",
  clusterBkg: "#f9fafb",
  titleColor: "#111827",
  edgeLabelBackground: "#ffffff",
  fontFamily: "Inter, system-ui, sans-serif",
};

/**
 * Convert an extracted theme into a synthetic Palette so it slots into the
 * existing color-editor and theme-engine pipeline without special-casing.
 */
export function paletteFromExtracted(extracted: ExtractedTheme, label = "Extracted theme"): Palette {
  const colors: ThemeColor[] = PALETTE_KEY_LABELS.map(({ key, label: lbl }) => ({
    key,
    label: lbl,
    value: extracted.themeVariables[key] ?? FALLBACK_COLORS[key],
  }));

  return {
    id: makeExtractedPaletteId(),
    name: label,
    description: "Theme extracted from a pasted diagram. Edit any color to refine, then save it as a named palette.",
    version: "0.0.0",
    colors,
    attribution: {
      enabledByDefault: true,
      label: `Themed with Mermaid Theme Builder · ${label}`,
      url: "https://overkillhill.com/projects/mermaid-theme-builder/",
      themeName: label,
      toolName: "Mermaid Theme Builder",
      toolVersion: "0.3.0",
    },
  };
}
