// @vitest-environment node
/**
 * Integration test for svgStringToPngBlob using a real canvas via @napi-rs/canvas.
 *
 * The companion browser suite (exporters-browser.test.ts) mocks the canvas
 * context and toBlob entirely, so a regression in scale math, background fill,
 * or dimension computation would stay undetected. This suite closes that gap by
 * wiring up a real @napi-rs/canvas implementation so that actual PNG pixel data
 * is produced and can be inspected.
 *
 * Globals that don't exist in Node.js (document, Image, URL.createObjectURL)
 * are stubbed with lightweight shims that delegate to node-canvas where it
 * matters (getContext, toBlob) and forward the rest correctly.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createCanvas } from "@napi-rs/canvas";
import { PNG } from "pngjs";
import { svgStringToPngBlob } from "@/lib/exporters";

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Parse a PNG Blob into a pngjs PNG object so we can inspect dimensions and
 * pixel data.
 */
async function parsePng(blob: Blob): Promise<PNG> {
  const arrayBuffer = await blob.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return new Promise((resolve, reject) => {
    const png = new PNG();
    png.parse(buffer, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}

/**
 * Build a thin canvas wrapper around @napi-rs/canvas whose width/height
 * properties are mutable (svgStringToPngBlob sets them after createElement).
 * The underlying node-canvas is (re)created lazily when getContext or toBlob
 * is first called with the final dimensions.
 *
 * drawImage is wrapped in a try/catch because @napi-rs/canvas only supports
 * drawing Canvas/Image objects — our stub Image has no pixel data, so the call
 * is a no-op here, but the fillRect white-background pass still runs and is
 * what we actually verify.
 */
function makeNodeCanvas() {
  let w = 1;
  let h = 1;
  let nc: ReturnType<typeof createCanvas> | null = null;

  function ensure() {
    const ew = Math.max(1, w);
    const eh = Math.max(1, h);
    if (!nc || nc.width !== ew || nc.height !== eh) {
      nc = createCanvas(ew, eh);
    }
    return nc;
  }

  return {
    get width() {
      return w;
    },
    set width(v: number) {
      w = v;
      nc = null;
    },
    get height() {
      return h;
    },
    set height(v: number) {
      h = v;
      nc = null;
    },
    getContext(type: string) {
      const ctx = ensure().getContext(type as "2d") as unknown as Record<string, unknown>;
      const origDrawImage = (ctx.drawImage as (...args: unknown[]) => void)?.bind(ctx);
      if (origDrawImage) {
        ctx.drawImage = (...args: unknown[]) => {
          try {
            origDrawImage(...args);
          } catch {
          }
        };
      }
      return ctx;
    },
    toBlob(cb: (b: Blob | null) => void, _mimeType?: string) {
      ensure()
        .encode("png")
        .then((buf) => {
          cb(new Blob([buf], { type: "image/png" }));
        })
        .catch(() => cb(null));
    },
  };
}

// ── Test setup ────────────────────────────────────────────────────────────────

beforeEach(() => {
  // URL.createObjectURL / revokeObjectURL don't exist in Node.js.
  // We return a dummy marker string; the Image stub ignores it.
  vi.stubGlobal("URL", {
    ...globalThis.URL,
    createObjectURL: vi.fn(() => "blob:node-mock"),
    revokeObjectURL: vi.fn(),
  });

  // Image stub: fires onload on the next microtask so the promise chain in
  // svgStringToPngBlob can wire up handlers before the event fires.
  class StubImage {
    width = 0;
    height = 0;
    onload: (() => void) | null = null;
    onerror: ((e: unknown) => void) | null = null;
    set src(_url: string) {
      Promise.resolve().then(() => this.onload?.());
    }
  }
  vi.stubGlobal("Image", StubImage);

  // document.createElement('canvas') → real @napi-rs/canvas wrapper.
  vi.stubGlobal("document", {
    createElement: (tag: string) => {
      if (tag === "canvas") return makeNodeCanvas();
      throw new Error(`Unsupported tag in integration test: ${tag}`);
    },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("svgStringToPngBlob — real canvas integration", () => {
  it("produces a valid PNG blob (real toBlob)", async () => {
    const blob = await svgStringToPngBlob('<svg width="100" height="50"></svg>');
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe("image/png");
    // Confirm it is actually parseable PNG (not a stub/fake bytes).
    const png = await parsePng(blob);
    expect(png).toBeDefined();
  });

  it("output PNG dimensions match width × scale (default scale 2)", async () => {
    const blob = await svgStringToPngBlob('<svg width="100" height="50"></svg>');
    const png = await parsePng(blob);
    expect(png.width).toBe(200);
    expect(png.height).toBe(100);
  });

  it("output PNG dimensions match width × scale (custom scale 3)", async () => {
    const blob = await svgStringToPngBlob('<svg width="80" height="40"></svg>', 3);
    const png = await parsePng(blob);
    expect(png.width).toBe(240);
    expect(png.height).toBe(120);
  });

  it("falls back to 800×600 when no dimension info is present, scaled by 2", async () => {
    const blob = await svgStringToPngBlob("<svg></svg>");
    const png = await parsePng(blob);
    expect(png.width).toBe(1600);
    expect(png.height).toBe(1200);
  });

  it("reads dimensions from viewBox when explicit width/height are absent", async () => {
    const blob = await svgStringToPngBlob('<svg viewBox="0 0 300 150"></svg>');
    const png = await parsePng(blob);
    expect(png.width).toBe(600);
    expect(png.height).toBe(300);
  });

  it("background pixel at (0, 0) is white (#ffffff, fully opaque)", async () => {
    const blob = await svgStringToPngBlob('<svg width="10" height="10"></svg>');
    const png = await parsePng(blob);
    // pngjs data layout: 4 bytes per pixel, row-major, RGBA.
    const r = png.data[0];
    const g = png.data[1];
    const b = png.data[2];
    const a = png.data[3];
    expect(r).toBe(255);
    expect(g).toBe(255);
    expect(b).toBe(255);
    expect(a).toBe(255);
  });

  it("URL.revokeObjectURL is called exactly once to clean up the SVG object URL", async () => {
    await svgStringToPngBlob('<svg width="50" height="25"></svg>');
    expect(URL.revokeObjectURL).toHaveBeenCalledOnce();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:node-mock");
  });
});
