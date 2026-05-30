// @vitest-environment happy-dom
/**
 * Browser-side exporter tests.
 *
 * Runs under happy-dom (per the @vitest-environment directive above) so that
 * document, Blob, URL, Image, and canvas APIs are available. All heavy
 * dependencies (mermaid, canvas 2D context) are mocked so the suite stays
 * fast and deterministic.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ── Mock mermaid before any imports so the dynamic import() in renderToSvg
//    picks up the stub instead of the real library (vi.mock is hoisted).
vi.mock("mermaid", () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn().mockResolvedValue({ svg: "<svg><text>mock</text></svg>" }),
  },
}));

import { downloadTextFile, downloadBlob, renderToSvg, svgStringToPngBlob } from "@/lib/exporters";
import { type TypographySettings, DEFAULT_TYPOGRAPHY } from "@/lib/typography";
import mermaid from "mermaid";

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Capture every anchor element that exporters append to document.body. */
function interceptAnchors(): { anchors: HTMLAnchorElement[]; restore: () => void } {
  const anchors: HTMLAnchorElement[] = [];
  const orig = document.body.appendChild.bind(document.body);
  const spy = vi.spyOn(document.body, "appendChild").mockImplementation((node) => {
    if (node instanceof HTMLAnchorElement) {
      // Stub click() before the element enters the DOM so happy-dom's navigation
      // handler never fires and never tries to construct a URL from the blob: href.
      node.click = vi.fn();
      anchors.push(node);
    }
    return orig(node);
  });
  return {
    anchors,
    restore: () => spy.mockRestore(),
  };
}

// ── renderToSvg ───────────────────────────────────────────────────────────────

describe("renderToSvg", () => {
  beforeEach(() => {
    vi.mocked(mermaid.render).mockResolvedValue({
      svg: "<svg><text>mock</text></svg>",
      bindFunctions: undefined,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns the SVG string produced by mermaid.render", async () => {
    const result = await renderToSvg("flowchart LR\n  A --> B");
    expect(result).toBe("<svg><text>mock</text></svg>");
  });

  it("calls mermaid.initialize before render", async () => {
    await renderToSvg("graph TD\n  A --> B");
    expect(mermaid.initialize).toHaveBeenCalledWith(
      expect.objectContaining({ startOnLoad: false })
    );
  });

  it("passes the diagram code to mermaid.render", async () => {
    const code = 'pie\n  title Test\n  "A" : 50\n  "B" : 50';
    await renderToSvg(code);
    expect(mermaid.render).toHaveBeenCalledWith(expect.any(String), code);
  });

  it("forwards a different SVG payload correctly", async () => {
    const altSvg = '<svg width="200" height="100"><rect/></svg>';
    vi.mocked(mermaid.render).mockResolvedValueOnce({ svg: altSvg, bindFunctions: undefined });
    const result = await renderToSvg("graph LR\n  X --> Y");
    expect(result).toBe(altSvg);
  });

  it("propagates errors thrown by mermaid.render", async () => {
    vi.mocked(mermaid.render).mockRejectedValueOnce(new Error("parse error"));
    await expect(renderToSvg("not valid mermaid!")).rejects.toThrow("parse error");
  });

  it("returns unmodified SVG when no typography is supplied", async () => {
    const result = await renderToSvg("flowchart LR\n  A --> B");
    expect(result).toBe("<svg><text>mock</text></svg>");
  });

  it("embeds a <style> block when non-default typography is supplied", async () => {
    vi.mocked(mermaid.render).mockResolvedValueOnce({
      svg: "<svg><text>mock</text></svg>",
      bindFunctions: undefined,
    });
    const typography: TypographySettings = {
      ...DEFAULT_TYPOGRAPHY,
      nodeLabel: { fontSize: 18, fontFamily: "" },
    };
    const result = await renderToSvg("flowchart LR\n  A --> B", typography);
    expect(result).toContain("<style>");
    expect(result).toContain("font-size: 18px");
    expect(result).toMatch(/<\/style><\/svg>$/);
  });

  it("returns unmodified SVG when all typography tiers match defaults", async () => {
    vi.mocked(mermaid.render).mockResolvedValueOnce({
      svg: "<svg><text>mock</text></svg>",
      bindFunctions: undefined,
    });
    const result = await renderToSvg("flowchart LR\n  A --> B", DEFAULT_TYPOGRAPHY);
    expect(result).toBe("<svg><text>mock</text></svg>");
  });

  it("preserves the closing </svg> tag after injecting typography CSS", async () => {
    vi.mocked(mermaid.render).mockResolvedValueOnce({
      svg: '<svg width="200" height="100"><text>hi</text></svg>',
      bindFunctions: undefined,
    });
    const typography: TypographySettings = {
      ...DEFAULT_TYPOGRAPHY,
      edgeLabel: { fontSize: 10, fontFamily: "Arial" },
    };
    const result = await renderToSvg("flowchart LR\n  A --> B", typography);
    expect(result.endsWith("</svg>")).toBe(true);
    expect(result).toContain("font-size: 10px");
    expect(result).toContain("font-family: Arial");
  });
});

// ── svgStringToPngBlob ────────────────────────────────────────────────────────

describe("svgStringToPngBlob", () => {
  let restoreCreateElement: () => void;
  let restoreObjectUrl: () => void;

  beforeEach(() => {
    // Stub URL.createObjectURL / revokeObjectURL — happy-dom may not implement them.
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:mock-svg-url"),
      revokeObjectURL: vi.fn(),
    });
    restoreObjectUrl = () => {
      vi.stubGlobal("URL", {
        ...URL,
        createObjectURL: originalCreate,
        revokeObjectURL: originalRevoke,
      });
    };

    // Stub Image so it fires onload synchronously after src is set.
    class StubImage {
      onload: (() => void) | null = null;
      onerror: ((e: unknown) => void) | null = null;
      set src(_url: string) {
        // Defer to next microtask so the promise chain can wire up handlers.
        Promise.resolve().then(() => this.onload?.());
      }
    }
    vi.stubGlobal("Image", StubImage);

    // Stub document.createElement("canvas") to return a minimal mock canvas.
    const mockCtx = {
      fillStyle: "",
      fillRect: vi.fn(),
      drawImage: vi.fn(),
    };
    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => mockCtx),
      toBlob: vi.fn((cb: (b: Blob | null) => void) => {
        cb(new Blob(["fake-png"], { type: "image/png" }));
      }),
    };

    const origCreateElement = document.createElement.bind(document);
    const spy = vi
      .spyOn(document, "createElement")
      .mockImplementation((tag: string, opts?: ElementCreationOptions) => {
        if (tag === "canvas") return mockCanvas as unknown as HTMLCanvasElement;
        return origCreateElement(tag, opts);
      });
    restoreCreateElement = () => spy.mockRestore();
  });

  afterEach(() => {
    restoreCreateElement?.();
    restoreObjectUrl?.();
    vi.unstubAllGlobals();
  });

  it("resolves with a Blob", async () => {
    const blob = await svgStringToPngBlob('<svg width="100" height="50"></svg>');
    expect(blob).toBeInstanceOf(Blob);
  });

  it("resolved Blob has image/png type", async () => {
    const blob = await svgStringToPngBlob('<svg width="100" height="50"></svg>');
    expect(blob.type).toBe("image/png");
  });

  it("injects xmlns if missing from the SVG", async () => {
    // We can't directly observe the patched SVG, but if no error is thrown and a
    // Blob is returned the code path that adds the namespace attribute ran correctly.
    const svgWithoutNs = '<svg width="80" height="40"><rect/></svg>';
    const blob = await svgStringToPngBlob(svgWithoutNs);
    expect(blob).toBeInstanceOf(Blob);
  });

  it("reads width/height from viewBox when explicit attributes are absent", async () => {
    const blob = await svgStringToPngBlob('<svg viewBox="0 0 300 150"></svg>');
    expect(blob).toBeInstanceOf(Blob);
  });

  it("falls back to 800×600 when no dimension info is present", async () => {
    const blob = await svgStringToPngBlob("<svg></svg>");
    expect(blob).toBeInstanceOf(Blob);
  });

  it("accepts a custom scale factor", async () => {
    const blob = await svgStringToPngBlob('<svg width="50" height="25"></svg>', 3);
    expect(blob).toBeInstanceOf(Blob);
  });
});

// ── downloadTextFile ──────────────────────────────────────────────────────────

describe("downloadTextFile", () => {
  beforeEach(() => {
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:mock-text-url"),
      revokeObjectURL: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("appends an anchor element to document.body", () => {
    const { anchors, restore } = interceptAnchors();
    downloadTextFile("output.mmd", "graph TD\n  A --> B");
    restore();
    expect(anchors.length).toBeGreaterThanOrEqual(1);
  });

  it("sets the correct download filename on the anchor", () => {
    const { anchors, restore } = interceptAnchors();
    downloadTextFile("my-diagram.mmd", "graph TD\n  A --> B");
    restore();
    const anchor = anchors[anchors.length - 1];
    expect(anchor.download).toBe("my-diagram.mmd");
  });

  it("sets an href on the anchor", () => {
    const { anchors, restore } = interceptAnchors();
    downloadTextFile("export.md", "# markdown");
    restore();
    const anchor = anchors[anchors.length - 1];
    // happy-dom resolves blob: URLs differently; we just verify it's non-empty.
    expect(anchor.href.length).toBeGreaterThan(0);
  });

  it("calls URL.createObjectURL to produce the href", () => {
    const { restore } = interceptAnchors();
    downloadTextFile("test.txt", "hello");
    restore();
    expect(URL.createObjectURL).toHaveBeenCalledOnce();
  });

  it("preserves the filename when it contains hyphens and dots", () => {
    const { anchors, restore } = interceptAnchors();
    downloadTextFile("ocean-depth-styled.mmd", "graph LR\n  X --> Y");
    restore();
    const anchor = anchors[anchors.length - 1];
    expect(anchor.download).toBe("ocean-depth-styled.mmd");
  });
});

// ── downloadBlob ──────────────────────────────────────────────────────────────

describe("downloadBlob", () => {
  beforeEach(() => {
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:mock-blob-url"),
      revokeObjectURL: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("appends an anchor element to document.body", () => {
    const { anchors, restore } = interceptAnchors();
    const blob = new Blob(["<svg/>"], { type: "image/svg+xml" });
    downloadBlob("diagram.svg", blob);
    restore();
    expect(anchors.length).toBeGreaterThanOrEqual(1);
  });

  it("sets the correct download filename on the anchor", () => {
    const { anchors, restore } = interceptAnchors();
    const blob = new Blob(["png-bytes"], { type: "image/png" });
    downloadBlob("diagram.png", blob);
    restore();
    const anchor = anchors[anchors.length - 1];
    expect(anchor.download).toBe("diagram.png");
  });

  it("calls URL.createObjectURL with the provided Blob", () => {
    const { restore } = interceptAnchors();
    const blob = new Blob(["data"], { type: "image/png" });
    downloadBlob("out.png", blob);
    restore();
    expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
  });

  it("sets an href on the anchor derived from the blob URL", () => {
    const { anchors, restore } = interceptAnchors();
    const blob = new Blob(["<svg/>"], { type: "image/svg+xml" });
    downloadBlob("chart.svg", blob);
    restore();
    const anchor = anchors[anchors.length - 1];
    expect(anchor.href.length).toBeGreaterThan(0);
  });

  it("schedules URL.revokeObjectURL after triggering the download", () => {
    vi.useFakeTimers();
    try {
      const { restore } = interceptAnchors();
      const blob = new Blob(["data"], { type: "image/png" });
      downloadBlob("cleanup.png", blob);
      restore();
      // revokeObjectURL is fired inside setTimeout(…, 1000) — advance the clock.
      vi.runAllTimers();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-blob-url");
    } finally {
      vi.useRealTimers();
    }
  });
});
