import type { Palette } from "./palettes";
import { REQUIRED_COLOR_KEYS, KNOWN_COLOR_KEYS } from "./palettes";
import { type TypographySettings, generateTypographyCss, isDefaultTypography } from "./typography";

/**
 * Trigger a browser download for a string blob. Same-origin, no backend.
 */
export function downloadTextFile(
  filename: string,
  content: string,
  mime = "text/plain;charset=utf-8"
): void {
  const blob = new Blob([content], { type: mime });
  triggerDownload(filename, blob);
}

export function downloadBlob(filename: string, blob: Blob): void {
  triggerDownload(filename, blob);
}

function triggerDownload(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Render a Mermaid diagram to an SVG string off-screen.
 * Reuses the singleton mermaid instance loaded by MermaidPreview, but does its
 * own initialize() call to avoid coupling.
 *
 * When `typography` is supplied, the generated typography CSS is embedded in a
 * `<style>` block inside the SVG so that downloaded files visually match the
 * live preview at all 5 typography tiers.
 */
export async function renderToSvg(code: string, typography?: TypographySettings): Promise<string> {
  const mod = await import("mermaid");
  const mermaid = mod.default;
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "strict",
    suppressErrorRendering: true,
  });
  const id = `mtb-export-${Date.now().toString(36)}`;
  const { svg } = await mermaid.render(id, code);
  if (!typography || isDefaultTypography(typography)) return svg;
  const css = generateTypographyCss(typography);
  if (!css.trim()) return svg;
  // Embed a <style> block just before </svg> so the rules apply to the
  // diagram elements that Mermaid has already emitted.
  return svg.replace(/<\/svg>\s*$/, `<style>/* MTB typography */\n${css}\n</style></svg>`);
}

/**
 * Convert an SVG string to a PNG Blob using a canvas. Resolves in the browser
 * with no native dependencies.
 */
export async function svgStringToPngBlob(svgString: string, scale = 2): Promise<Blob> {
  // Ensure the SVG declares an XML namespace so <img> can parse it.
  let svg = svgString;
  if (!svg.includes("xmlns=")) {
    svg = svg.replace(/<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  // Extract the intrinsic width/height from the SVG element.
  const widthMatch = svg.match(/<svg[^>]*\swidth=["']([\d.]+)/);
  const heightMatch = svg.match(/<svg[^>]*\sheight=["']([\d.]+)/);
  const viewBoxMatch = svg.match(/<svg[^>]*\sviewBox=["']([\d.\s-]+)["']/);

  let width = widthMatch ? parseFloat(widthMatch[1]) : 0;
  let height = heightMatch ? parseFloat(heightMatch[1]) : 0;
  if ((!width || !height) && viewBoxMatch) {
    const parts = viewBoxMatch[1].trim().split(/\s+/).map(Number);
    if (parts.length === 4) {
      width = width || parts[2];
      height = height || parts[3];
    }
  }
  if (!width) width = 800;
  if (!height) height = 600;

  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  try {
    const img = await loadImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    // White background — PNGs without a fill come out transparent which is
    // usually wrong for slide decks and docs.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("toBlob returned null"))),
        "image/png"
      );
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = url;
  });
}

/**
 * Sanitize a label into a filename slug.
 */
export function makeFilename(themeName: string, suffix: string, ext: string): string {
  const slug =
    themeName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "diagram";
  return `${slug}-${suffix}.${ext}`;
}

/**
 * Serialize a palette to CSS custom properties (`:root { --token: value; }`).
 *
 * Variable names are derived from each color's `key` by lower-camel → kebab-case
 * (e.g. `primaryColor` → `--mermaid-primary-color`). Hex/raw values are emitted
 * verbatim; the human-readable label is included as a comment for reference.
 *
 * Note: this is a static stylesheet for design-system handoff, not a runtime
 * Mermaid theme. Mermaid itself ignores CSS variables — use the JSON or
 * `%%{init}%%` exports for diagram theming.
 */
export function paletteToCssVariables(palette: Palette): string {
  const toKebab = (s: string): string => s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
  const lines: string[] = [];
  lines.push(`/* ${palette.name} — ${palette.description} */`);
  lines.push(`/* Static design tokens; not consumed by Mermaid at runtime. */`);
  lines.push(":root {");
  for (const c of palette.colors) {
    lines.push(`  --mermaid-${toKebab(c.key)}: ${c.value}; /* ${c.label} */`);
  }
  lines.push("}");
  return lines.join("\n") + "\n";
}

/**
 * Serialize a list of palettes to a portable JSON bundle for backup or
 * cross-device migration. Each entry uses the same shape as
 * `paletteToPortableJson`, wrapped under `palettes: [...]` with a top-level
 * `type: "mtb-palette-bundle"` discriminator so a future import can tell a
 * single-palette file apart from a bundle.
 */
export function palettesToBundleJson(palettes: Palette[]): string {
  const payload = {
    schemaVersion: 1,
    type: "mtb-palette-bundle",
    exportedAt: new Date().toISOString(),
    count: palettes.length,
    palettes: palettes.map((palette) => ({
      schemaVersion: 1,
      type: "mtb-palette",
      id: palette.id,
      name: palette.name,
      description: palette.description,
      themeIntent: palette.themeIntent,
      version: palette.version,
      isBrandPreset: palette.isBrandPreset,
      colors: palette.colors,
      sourceUrls: palette.sourceUrls,
    })),
  };
  return JSON.stringify(payload, null, 2);
}

/**
 * Serialize a palette to a portable JSON string for import/export.
 */
export function paletteToPortableJson(palette: Palette): string {
  const payload = {
    schemaVersion: 1,
    type: "mtb-palette",
    id: palette.id,
    name: palette.name,
    description: palette.description,
    themeIntent: palette.themeIntent,
    version: palette.version,
    colors: palette.colors,
    sourceUrls: palette.sourceUrls,
  };
  return JSON.stringify(payload, null, 2);
}

/** Matches 3-, 4-, 6-, and 8-digit hex color strings (e.g. #fff, #1a2b3c). */
const HEX_COLOR_RE = /^#[0-9a-fA-F]{3}$|^#[0-9a-fA-F]{4}$|^#[0-9a-fA-F]{6}$|^#[0-9a-fA-F]{8}$/;
/** CSS color keywords accepted by Mermaid's theme engine. */
const CSS_KEYWORD_RE = /^transparent$|^inherit$|^currentColor$/i;
/**
 * Matches alpha-only strings that look like CSS named colors (e.g. "red",
 * "coral", "steelblue"). Used to distinguish softer "may not work" warnings
 * from hard "definitely invalid" errors.
 */
const CSS_NAMED_COLOR_RE = /^[a-zA-Z]+$/;
/**
 * Matches CSS color function calls — rgb(), rgba(), hsl(), hsla() — that are
 * valid CSS but unreliable inside Mermaid's theme engine.
 */
const CSS_FUNCTION_COLOR_RE = /^(rgba?|hsla?)\s*\(/i;

/**
 * Returns true when `value` is a CSS named color for the given `key`.
 * fontFamily is always exempt. The three Mermaid-safe keywords are excluded.
 */
function isCssNamedColorValue(key: string, value: string): boolean {
  if (key === "fontFamily") return false;
  return CSS_NAMED_COLOR_RE.test(value) && !CSS_KEYWORD_RE.test(value);
}

/**
 * Returns true when `value` is a CSS color function call (rgb, rgba, hsl,
 * hsla) for the given `key`. fontFamily is always exempt.
 */
function isCssFunctionColorValue(key: string, value: string): boolean {
  if (key === "fontFamily") return false;
  return CSS_FUNCTION_COLOR_RE.test(value);
}

/**
 * Returns true when `value` is acceptable for `key`.
 * - `fontFamily` keys accept any non-empty string (font stacks can contain
 *   spaces, commas, and quotes that would fail a hex check).
 * - All other keys must be a valid hex color or one of the three CSS keywords
 *   Mermaid's theming layer understands.
 * - Empty strings are always invalid.
 */
function isValidColorValue(key: string, value: string): boolean {
  if (value.length === 0) return false;
  if (key === "fontFamily") return true;
  return HEX_COLOR_RE.test(value) || CSS_KEYWORD_RE.test(value);
}

export interface PortablePaletteImport {
  ok: true;
  palette: Palette;
  /** Required color keys that are absent — diagram may render incorrectly. */
  missingKeys: string[];
  /** Color keys present in the file that MTB does not recognize. */
  unknownKeys: string[];
  /**
   * Color entries whose `value` field is not a valid hex string, CSS keyword,
   * or (for `fontFamily`) a non-empty string. These pass through unchanged so
   * the user can correct them, but diagram rendering will likely be broken.
   */
  invalidValues: Array<{ key: string; value: string }>;
  /**
   * Color entries whose `value` is a CSS named color (e.g. "red", "coral") or
   * a CSS color function call (e.g. "rgb(255,0,0)", "hsl(30,50%,50%)").
   * These are technically valid CSS but Mermaid's theme engine does not
   * reliably handle them — a softer "may not render correctly" warning is
   * surfaced rather than treating them as hard errors.
   */
  warnValues: Array<{ key: string; value: string }>;
}
export interface PortablePaletteError {
  ok: false;
  error: string;
}

export interface PortableBundleImport {
  ok: true;
  palettes: PortablePaletteImport[];
}

/**
 * Parse a multi-palette bundle JSON (`type: "mtb-bundle"`).
 *
 * Each palette entry in the `palettes` array is validated with the same
 * per-key rules as `parsePortablePalette`. Returns `ok: true` with a list of
 * `PortablePaletteImport` records (each carrying its own `missingKeys` /
 * `unknownKeys` diagnostic lists) so the caller can surface per-palette
 * warnings in the same amber banner used for single imports.
 *
 * The bundle format matches `palettesToBundleJson` output:
 * ```json
 * {
 *   "type": "mtb-palette-bundle",
 *   "schemaVersion": 1,
 *   "palettes": [ { "type": "mtb-palette", ... }, ... ]
 * }
 * ```
 */
export function parsePaletteBundle(json: string): PortableBundleImport | PortablePaletteError {
  try {
    const data = JSON.parse(json);
    if (typeof data !== "object" || data === null) {
      return { ok: false, error: "Not a JSON object." };
    }
    if (data.type !== "mtb-palette-bundle") {
      return { ok: false, error: "Missing or wrong `type` field — expected `mtb-palette-bundle`." };
    }
    if (!Array.isArray(data.palettes) || data.palettes.length === 0) {
      return { ok: false, error: "Missing or empty `palettes` array." };
    }
    const results: PortablePaletteImport[] = [];
    for (let i = 0; i < data.palettes.length; i++) {
      const entry = data.palettes[i];
      const result = parsePortablePalette(JSON.stringify(entry));
      if (!result.ok) {
        return { ok: false, error: `Palette ${i + 1}: ${result.error}` };
      }
      results.push(result);
    }
    return { ok: true, palettes: results };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export function parsePortablePalette(json: string): PortablePaletteImport | PortablePaletteError {
  try {
    const data = JSON.parse(json);
    if (typeof data !== "object" || data === null) {
      return { ok: false, error: "Not a JSON object." };
    }
    if (data.type !== "mtb-palette") {
      return { ok: false, error: "Missing or wrong `type` field — expected `mtb-palette`." };
    }
    if (!Array.isArray(data.colors) || data.colors.length === 0) {
      return { ok: false, error: "Missing or empty `colors` array." };
    }
    // Validate top-level string fields — reject when present with the wrong type,
    // but allow absent (undefined) values and substitute a safe default.
    for (const field of ["id", "name", "version", "description"] as const) {
      if (data[field] !== undefined && typeof data[field] !== "string") {
        return {
          ok: false,
          error: `Field '${field}' must be a string, got ${typeof data[field]}.`,
        };
      }
    }

    const colors: { key: string; label: string; value: string }[] = data.colors.map(
      (c: unknown) => {
        if (typeof c !== "object" || c === null) throw new Error("Invalid color entry");
        const cc = c as Record<string, unknown>;
        if (typeof cc.key !== "string" || typeof cc.label !== "string") {
          throw new Error("Color entries must have string key and label fields");
        }
        // Non-string value: coerce to a displayable string so the entry reaches
        // invalidValues with a clear representation rather than aborting the import.
        const value: string = typeof cc.value === "string" ? cc.value : `[type:${typeof cc.value}]`;
        return { key: cc.key, label: cc.label, value };
      }
    );
    const id = typeof data.id === "string" ? data.id : `imported-${Date.now().toString(36)}`;
    const name = typeof data.name === "string" ? data.name : "Imported palette";
    const description =
      typeof data.description === "string" ? data.description : "Imported palette.";
    const version = typeof data.version === "string" ? data.version : "0.0.0";

    const presentKeys = new Set(colors.map((c) => c.key));
    const missingKeys = (REQUIRED_COLOR_KEYS as readonly string[]).filter(
      (k) => !presentKeys.has(k)
    );
    const unknownKeys = colors.map((c) => c.key).filter((k) => !KNOWN_COLOR_KEYS.has(k));
    const invalidValues = colors
      .filter(
        (c) =>
          !isValidColorValue(c.key, c.value) &&
          !isCssNamedColorValue(c.key, c.value) &&
          !isCssFunctionColorValue(c.key, c.value)
      )
      .map((c) => ({ key: c.key, value: c.value }));
    const warnValues = colors
      .filter(
        (c) => isCssNamedColorValue(c.key, c.value) || isCssFunctionColorValue(c.key, c.value)
      )
      .map((c) => ({ key: c.key, value: c.value }));

    return {
      ok: true,
      missingKeys,
      unknownKeys,
      invalidValues,
      warnValues,
      palette: {
        id,
        name,
        description,
        themeIntent: typeof data.themeIntent === "string" ? data.themeIntent : undefined,
        sourceUrls: Array.isArray(data.sourceUrls)
          ? data.sourceUrls.filter((u: unknown) => typeof u === "string")
          : undefined,
        version,
        colors,
        attribution: {
          enabledByDefault: true,
          label: `Themed with Mermaid Theme Builder · ${name}`,
          url: "https://overkillhill.com/projects/mermaid-theme-builder/",
          themeName: name,
          toolName: "Mermaid Theme Builder",
          toolVersion: "0.3.0",
        },
      },
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
