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
          } catch {}
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

// ── Content pixel preservation ─────────────────────────────────────────────
//
// The tests above verify dimensions and the white background fill. They can't
// check foreground content because StubImage has no pixel data — drawImage is
// silently swallowed in makeNodeCanvas when it receives a zero-size stub.
//
// These tests close that gap by:
//   1. Pre-rendering a solid-color source canvas with @napi-rs/canvas.
//   2. Wrapping it in a SourceImage stub that exposes the canvas via
//      `_sourceCanvas` so drawImage can receive real pixel data.
//   3. Using a canvas factory (makeContentCanvas) that unwraps `_sourceCanvas`
//      and forwards it to the real @napi-rs/canvas drawImage — no silent catch.
//   4. Asserting that interior pixels reflect the source color, not just white.
//
// The beforeEach URL stubs (createObjectURL → "blob:node-mock", revokeObjectURL)
// remain active; only Image and document are re-stubbed inside each test.
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Canvas factory for content pixel tests.
 *
 * Unlike makeNodeCanvas, drawImage here:
 *  - Unwraps the `_sourceCanvas` property on a SourceImage (if present)
 *    so the underlying @napi-rs/canvas Canvas reaches the real drawImage call.
 *  - Does NOT swallow errors — any draw failure surfaces as a test failure.
 */
function makeContentCanvas() {
  let w = 1;
  let h = 1;
  let nc: ReturnType<typeof createCanvas> | null = null;

  function ensure() {
    const ew = Math.max(1, w);
    const eh = Math.max(1, h);
    if (!nc || nc.width !== ew || nc.height !== eh) nc = createCanvas(ew, eh);
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
      const origDraw = (ctx.drawImage as (...a: unknown[]) => void).bind(ctx);
      ctx.drawImage = (imgArg: unknown, ...rest: unknown[]) => {
        // Unwrap SourceImage wrapper → the underlying @napi-rs/canvas Canvas.
        const src = (imgArg as { _sourceCanvas?: unknown })?._sourceCanvas ?? imgArg;
        origDraw(src, ...rest);
      };
      return ctx;
    },
    toBlob(cb: (b: Blob | null) => void, _mimeType?: string) {
      ensure()
        .encode("png")
        .then((buf) => cb(new Blob([buf], { type: "image/png" })))
        .catch(() => cb(null));
    },
  };
}

describe("svgStringToPngBlob — content pixel preservation", () => {
  it("non-white foreground pixels are preserved when drawImage receives real pixel data", async () => {
    // Pre-render a solid-red 10×10 source canvas to simulate diagram content.
    const source = createCanvas(10, 10);
    const srcCtx = source.getContext("2d");
    srcCtx.fillStyle = "#ff0000";
    srcCtx.fillRect(0, 0, 10, 10);

    // Image stub: reports 10×10 dimensions and carries the red canvas as
    // _sourceCanvas. makeContentCanvas.getContext.drawImage unwraps it so the
    // real @napi-rs/canvas drawImage receives a Canvas instance with pixel data.
    class SourceImage {
      readonly width = 10;
      readonly height = 10;
      readonly _sourceCanvas = source;
      onload: (() => void) | null = null;
      onerror: ((e: unknown) => void) | null = null;
      set src(_url: string) {
        Promise.resolve().then(() => this.onload?.());
      }
    }

    // Override Image and document stubs for this test only.
    // URL stubs (createObjectURL / revokeObjectURL) remain from beforeEach.
    vi.stubGlobal("Image", SourceImage);
    vi.stubGlobal("document", {
      createElement: (tag: string) => {
        if (tag === "canvas") return makeContentCanvas();
        throw new Error(`Unsupported tag in content pixel test: ${tag}`);
      },
    });

    // scale=1 so the output PNG is 10×10 — same dimensions as the source canvas.
    const blob = await svgStringToPngBlob('<svg width="10" height="10"></svg>', 1);
    const png = await parsePng(blob);

    expect(png.width).toBe(10);
    expect(png.height).toBe(10);

    // Interior pixel (5, 5): pipeline is fillRect(white) then drawImage(red source).
    // drawImage paints red over white so the pixel must be red, not white.
    const stride = png.width * 4; // 40 bytes per row at 10px wide
    const offset = 5 * stride + 5 * 4; // row 5, col 5
    expect(png.data[offset], "R should be 255 (red foreground)").toBe(255);
    expect(png.data[offset + 1], "G should be 0 (red foreground)").toBe(0);
    expect(png.data[offset + 2], "B should be 0 (red foreground)").toBe(0);
    expect(png.data[offset + 3], "Alpha should be fully opaque").toBe(255);
  });

  it("blue foreground source produces blue interior pixels (color fidelity)", async () => {
    // Verify color fidelity with a second hue to rule out coincidental red output.
    const source = createCanvas(20, 20);
    const srcCtx = source.getContext("2d");
    srcCtx.fillStyle = "#0000ff";
    srcCtx.fillRect(0, 0, 20, 20);

    class SourceImage {
      readonly width = 20;
      readonly height = 20;
      readonly _sourceCanvas = source;
      onload: (() => void) | null = null;
      onerror: ((e: unknown) => void) | null = null;
      set src(_url: string) {
        Promise.resolve().then(() => this.onload?.());
      }
    }

    vi.stubGlobal("Image", SourceImage);
    vi.stubGlobal("document", {
      createElement: (tag: string) => {
        if (tag === "canvas") return makeContentCanvas();
        throw new Error(`Unsupported tag in content pixel test: ${tag}`);
      },
    });

    const blob = await svgStringToPngBlob('<svg width="20" height="20"></svg>', 1);
    const png = await parsePng(blob);

    const stride = png.width * 4;
    const offset = 10 * stride + 10 * 4; // interior pixel (10, 10)
    expect(png.data[offset], "R should be 0 (blue foreground)").toBe(0);
    expect(png.data[offset + 1], "G should be 0 (blue foreground)").toBe(0);
    expect(png.data[offset + 2], "B should be 255 (blue foreground)").toBe(255);
    expect(png.data[offset + 3], "Alpha should be fully opaque").toBe(255);
  });

  it("drawImage runs after the white background fill (foreground overpaints background)", async () => {
    // A corner pixel (0,0) should also be the foreground color, confirming
    // drawImage painted the full canvas (not just the interior).
    const source = createCanvas(8, 8);
    const srcCtx = source.getContext("2d");
    srcCtx.fillStyle = "#00cc44"; // green
    srcCtx.fillRect(0, 0, 8, 8);

    class SourceImage {
      readonly width = 8;
      readonly height = 8;
      readonly _sourceCanvas = source;
      onload: (() => void) | null = null;
      onerror: ((e: unknown) => void) | null = null;
      set src(_url: string) {
        Promise.resolve().then(() => this.onload?.());
      }
    }

    vi.stubGlobal("Image", SourceImage);
    vi.stubGlobal("document", {
      createElement: (tag: string) => {
        if (tag === "canvas") return makeContentCanvas();
        throw new Error(`Unsupported tag in content pixel test: ${tag}`);
      },
    });

    const blob = await svgStringToPngBlob('<svg width="8" height="8"></svg>', 1);
    const png = await parsePng(blob);

    // Corner pixel (0, 0)
    expect(png.data[0], "R should match green foreground").toBe(0x00);
    expect(png.data[1], "G should match green foreground").toBe(0xcc);
    expect(png.data[2], "B should match green foreground").toBe(0x44);
    expect(png.data[3], "Alpha should be fully opaque").toBe(255);
  });

  it("scale=2: 10×10 source canvas produces correct interior pixels in 20×20 output", async () => {
    // A solid-red 10×10 source drawn into a 20×20 output (scale=2).
    // drawImage is called as ctx.drawImage(img, 0, 0, 20, 20), scaling the
    // content to fill the larger canvas. Interior pixel (10,10) must be red,
    // not the white background — catching any regression in scale math that
    // produces a correctly-sized canvas but misdraws its content.
    const source = createCanvas(10, 10);
    const srcCtx = source.getContext("2d");
    srcCtx.fillStyle = "#ff0000";
    srcCtx.fillRect(0, 0, 10, 10);

    class SourceImage {
      readonly width = 10;
      readonly height = 10;
      readonly _sourceCanvas = source;
      onload: (() => void) | null = null;
      onerror: ((e: unknown) => void) | null = null;
      set src(_url: string) {
        Promise.resolve().then(() => this.onload?.());
      }
    }

    vi.stubGlobal("Image", SourceImage);
    vi.stubGlobal("document", {
      createElement: (tag: string) => {
        if (tag === "canvas") return makeContentCanvas();
        throw new Error(`Unsupported tag in scale=2 content pixel test: ${tag}`);
      },
    });

    const blob = await svgStringToPngBlob('<svg width="10" height="10"></svg>', 2);
    const png = await parsePng(blob);

    expect(png.width).toBe(20);
    expect(png.height).toBe(20);

    // Interior pixel (10, 10) — well within the scaled canvas.
    const stride = png.width * 4;
    const offset = 10 * stride + 10 * 4;
    expect(png.data[offset], "R should be 255 (red scaled content)").toBe(255);
    expect(png.data[offset + 1], "G should be 0 (red scaled content)").toBe(0);
    expect(png.data[offset + 2], "B should be 0 (red scaled content)").toBe(0);
    expect(png.data[offset + 3], "Alpha should be fully opaque").toBe(255);
  });

  it("scale=3: 10×10 source canvas produces correct interior pixels in 30×30 output", async () => {
    // A solid-blue 10×10 source drawn into a 30×30 output (scale=3).
    // Interior pixel (15,15) must carry the source color at the larger scale.
    const source = createCanvas(10, 10);
    const srcCtx = source.getContext("2d");
    srcCtx.fillStyle = "#0000ff";
    srcCtx.fillRect(0, 0, 10, 10);

    class SourceImage {
      readonly width = 10;
      readonly height = 10;
      readonly _sourceCanvas = source;
      onload: (() => void) | null = null;
      onerror: ((e: unknown) => void) | null = null;
      set src(_url: string) {
        Promise.resolve().then(() => this.onload?.());
      }
    }

    vi.stubGlobal("Image", SourceImage);
    vi.stubGlobal("document", {
      createElement: (tag: string) => {
        if (tag === "canvas") return makeContentCanvas();
        throw new Error(`Unsupported tag in scale=3 content pixel test: ${tag}`);
      },
    });

    const blob = await svgStringToPngBlob('<svg width="10" height="10"></svg>', 3);
    const png = await parsePng(blob);

    expect(png.width).toBe(30);
    expect(png.height).toBe(30);

    // Interior pixel (15, 15) — center of the 30×30 output.
    const stride = png.width * 4;
    const offset = 15 * stride + 15 * 4;
    expect(png.data[offset], "R should be 0 (blue scaled content)").toBe(0);
    expect(png.data[offset + 1], "G should be 0 (blue scaled content)").toBe(0);
    expect(png.data[offset + 2], "B should be 255 (blue scaled content)").toBe(255);
    expect(png.data[offset + 3], "Alpha should be fully opaque").toBe(255);
  });

  it("scale=2: corner pixel (0,0) is the foreground color, confirming no offset or clipping at origin", async () => {
    // Verifies that the scaled drawImage starts at (0,0) with no offset.
    // If the scale transform introduced an offset, the origin pixel would
    // remain white (background) instead of the foreground color.
    const source = createCanvas(10, 10);
    const srcCtx = source.getContext("2d");
    srcCtx.fillStyle = "#9b2335"; // crimson
    srcCtx.fillRect(0, 0, 10, 10);

    class SourceImage {
      readonly width = 10;
      readonly height = 10;
      readonly _sourceCanvas = source;
      onload: (() => void) | null = null;
      onerror: ((e: unknown) => void) | null = null;
      set src(_url: string) {
        Promise.resolve().then(() => this.onload?.());
      }
    }

    vi.stubGlobal("Image", SourceImage);
    vi.stubGlobal("document", {
      createElement: (tag: string) => {
        if (tag === "canvas") return makeContentCanvas();
        throw new Error(`Unsupported tag in scale=2 corner pixel test: ${tag}`);
      },
    });

    const blob = await svgStringToPngBlob('<svg width="10" height="10"></svg>', 2);
    const png = await parsePng(blob);

    expect(png.width).toBe(20);
    expect(png.height).toBe(20);

    // Corner pixel (0, 0) — byte offset 0 in the RGBA data array.
    expect(png.data[0], "R should be 0x9b (crimson, no origin offset)").toBe(0x9b);
    expect(png.data[1], "G should be 0x23 (crimson, no origin offset)").toBe(0x23);
    expect(png.data[2], "B should be 0x35 (crimson, no origin offset)").toBe(0x35);
    expect(png.data[3], "Alpha should be fully opaque").toBe(255);
  });
});
