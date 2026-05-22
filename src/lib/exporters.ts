import type { Palette } from "./palettes";

/**
 * Trigger a browser download for a string blob. Same-origin, no backend.
 */
export function downloadTextFile(filename: string, content: string, mime = "text/plain;charset=utf-8"): void {
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
 */
export async function renderToSvg(code: string): Promise<string> {
  const mod = await import("mermaid");
  const mermaid = mod.default;
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "strict",
    suppressErrorRendering: true,
  });
  const id = `mtb-export-${Date.now().toString(36)}`;
  const { svg } = await mermaid.render(id, code);
  // Mermaid renders into a document, then sanitises. Return the raw SVG string.
  return svg;
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
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob returned null"))), "image/png");
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
  const slug = themeName
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
  const toKebab = (s: string): string =>
    s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
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

export interface PortablePaletteImport {
  ok: true;
  palette: Palette;
}
export interface PortablePaletteError {
  ok: false;
  error: string;
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
    const colors = data.colors.map((c: unknown) => {
      if (typeof c !== "object" || c === null) throw new Error("Invalid color entry");
      const cc = c as Record<string, unknown>;
      if (typeof cc.key !== "string" || typeof cc.label !== "string" || typeof cc.value !== "string") {
        throw new Error("Color entries must have key/label/value strings");
      }
      return { key: cc.key, label: cc.label, value: cc.value };
    });
    const id = typeof data.id === "string" ? data.id : `imported-${Date.now().toString(36)}`;
    const name = typeof data.name === "string" ? data.name : "Imported palette";
    const description = typeof data.description === "string" ? data.description : "Imported palette.";
    const version = typeof data.version === "string" ? data.version : "0.0.0";
    return {
      ok: true,
      palette: {
        id,
        name,
        description,
        themeIntent: typeof data.themeIntent === "string" ? data.themeIntent : undefined,
        sourceUrls: Array.isArray(data.sourceUrls) ? data.sourceUrls.filter((u: unknown) => typeof u === "string") : undefined,
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
