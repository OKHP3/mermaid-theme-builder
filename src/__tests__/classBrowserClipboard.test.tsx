// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
import { fireEvent } from "@testing-library/dom";
import { createElement } from "react";
import { ClassBrowser } from "@/components/ClassBrowser";
import type { ClassDef } from "@/lib/themeEngine";

/**
 * Clipboard write tests for ClassBrowser.
 *
 * These run in happy-dom so navigator.clipboard is mockable and React state
 * updates are observable. Each test asserts the exact string passed to
 * navigator.clipboard.writeText after firing a click on the relevant button.
 *
 * Copy actions tested:
 *   - "Copy all"      → all classDef lines in definition order, joined by "\n"
 *   - "Copy used"     → only the subset of classDefs whose names are in
 *                        usedClassNames, in definition order (same as "Copy all")
 *   - Per-card usage  → ":::className"
 *   - Per-card def    → single "classDef …" line for that card
 */

const SAMPLE_CLASS_DEFS: ClassDef[] = [
  {
    name: "primary",
    fill: "#1e3a5f",
    stroke: "#3b82f6",
    color: "#ffffff",
    extra: "",
    description: "Primary node style",
  },
  {
    name: "secondary",
    fill: "#374151",
    stroke: "#6b7280",
    color: "#f3f4f6",
    extra: "",
    description: "Secondary node style",
  },
];

const PRIMARY_LINE = "classDef primary fill:#1e3a5f,stroke:#3b82f6,color:#ffffff";
const SECONDARY_LINE = "classDef secondary fill:#374151,stroke:#6b7280,color:#f3f4f6";
const ALL_BLOCK = `${PRIMARY_LINE}\n${SECONDARY_LINE}`;

let clipboardWriteText: ReturnType<typeof vi.fn>;

beforeEach(() => {
  clipboardWriteText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: clipboardWriteText },
    writable: true,
    configurable: true,
  });
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// "Copy all" button
// ---------------------------------------------------------------------------

describe("ClassBrowser — 'Copy all' clipboard write", () => {
  it("writes all classDef lines joined by newline in definition order", async () => {
    render(
      createElement(ClassBrowser, {
        classDefs: SAMPLE_CLASS_DEFS,
        supportsClassDef: true,
      })
    );
    const btn = screen.getByTitle("Copy all classDefs as a single block");
    await act(async () => {
      fireEvent.click(btn);
    });
    expect(clipboardWriteText).toHaveBeenCalledOnce();
    expect(clipboardWriteText).toHaveBeenCalledWith(ALL_BLOCK);
  });

  it("writes exactly the correct classDef syntax for each class", async () => {
    render(
      createElement(ClassBrowser, {
        classDefs: SAMPLE_CLASS_DEFS,
        supportsClassDef: true,
      })
    );
    const btn = screen.getByTitle("Copy all classDefs as a single block");
    await act(async () => {
      fireEvent.click(btn);
    });
    const written = clipboardWriteText.mock.calls[0][0] as string;
    const lines = written.split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe(PRIMARY_LINE);
    expect(lines[1]).toBe(SECONDARY_LINE);
  });

  it("preserves definition order even when some classes are in use (visual sort differs)", async () => {
    render(
      createElement(ClassBrowser, {
        classDefs: SAMPLE_CLASS_DEFS,
        supportsClassDef: true,
        usedClassNames: new Set(["secondary"]),
      })
    );
    const btn = screen.getByTitle("Copy all classDefs as a single block");
    await act(async () => {
      fireEvent.click(btn);
    });
    const written = clipboardWriteText.mock.calls[0][0] as string;
    const lines = written.split("\n");
    expect(lines[0]).toBe(PRIMARY_LINE);
    expect(lines[1]).toBe(SECONDARY_LINE);
  });

  it("writes a single line when classDefs has exactly one entry", async () => {
    render(
      createElement(ClassBrowser, {
        classDefs: [SAMPLE_CLASS_DEFS[0]],
        supportsClassDef: true,
      })
    );
    const btn = screen.getByTitle("Copy all classDefs as a single block");
    await act(async () => {
      fireEvent.click(btn);
    });
    expect(clipboardWriteText).toHaveBeenCalledWith(PRIMARY_LINE);
  });

  it("does not call clipboard.writeText when disabled (supportsClassDef=false)", async () => {
    render(
      createElement(ClassBrowser, {
        classDefs: SAMPLE_CLASS_DEFS,
        supportsClassDef: false,
      })
    );
    const btn = screen.getByTitle("Copy all classDefs as a single block");
    await act(async () => {
      fireEvent.click(btn);
    });
    expect(clipboardWriteText).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// "Copy used" button
// ---------------------------------------------------------------------------

describe("ClassBrowser — 'Copy used' clipboard write", () => {
  it("writes only the classDef line for the single class that is in use", async () => {
    render(
      createElement(ClassBrowser, {
        classDefs: SAMPLE_CLASS_DEFS,
        supportsClassDef: true,
        usedClassNames: new Set(["primary"]),
      })
    );
    const btn = screen.getByTitle("Copy only the 1 classDef used in the current diagram");
    await act(async () => {
      fireEvent.click(btn);
    });
    expect(clipboardWriteText).toHaveBeenCalledOnce();
    expect(clipboardWriteText).toHaveBeenCalledWith(PRIMARY_LINE);
  });

  it("writes exactly 1 line when 1 of 2 classes is in use", async () => {
    render(
      createElement(ClassBrowser, {
        classDefs: SAMPLE_CLASS_DEFS,
        supportsClassDef: true,
        usedClassNames: new Set(["secondary"]),
      })
    );
    const btn = screen.getByTitle("Copy only the 1 classDef used in the current diagram");
    await act(async () => {
      fireEvent.click(btn);
    });
    const written = clipboardWriteText.mock.calls[0][0] as string;
    const lines = written.split("\n");
    expect(lines).toHaveLength(1);
    expect(lines[0]).toBe(SECONDARY_LINE);
  });

  it("writes both lines when both classes are in use", async () => {
    render(
      createElement(ClassBrowser, {
        classDefs: SAMPLE_CLASS_DEFS,
        supportsClassDef: true,
        usedClassNames: new Set(["primary", "secondary"]),
      })
    );
    const btn = screen.getByTitle("Copy only the 2 classDefs used in the current diagram");
    await act(async () => {
      fireEvent.click(btn);
    });
    expect(clipboardWriteText).toHaveBeenCalledOnce();
    const written = clipboardWriteText.mock.calls[0][0] as string;
    const lines = written.split("\n");
    expect(lines).toHaveLength(2);
    expect(lines).toContain(PRIMARY_LINE);
    expect(lines).toContain(SECONDARY_LINE);
  });

  it("does not include unused classes in the written text", async () => {
    render(
      createElement(ClassBrowser, {
        classDefs: SAMPLE_CLASS_DEFS,
        supportsClassDef: true,
        usedClassNames: new Set(["primary"]),
      })
    );
    const btn = screen.getByTitle("Copy only the 1 classDef used in the current diagram");
    await act(async () => {
      fireEvent.click(btn);
    });
    const written = clipboardWriteText.mock.calls[0][0] as string;
    expect(written).not.toContain("secondary");
    expect(written).toContain("primary");
  });

  it("preserves definition order when the used subset is non-contiguous", async () => {
    const THREE_DEFS: ClassDef[] = [
      {
        name: "alpha",
        fill: "#aaaaaa",
        stroke: "#111111",
        color: "#ffffff",
        extra: "",
        description: "",
      },
      {
        name: "beta",
        fill: "#bbbbbb",
        stroke: "#222222",
        color: "#eeeeee",
        extra: "",
        description: "",
      },
      {
        name: "gamma",
        fill: "#cccccc",
        stroke: "#333333",
        color: "#dddddd",
        extra: "",
        description: "",
      },
    ];
    // alpha (index 0) and gamma (index 2) are used; beta (index 1) is not.
    // Definition order must be preserved: alpha line before gamma line.
    render(
      createElement(ClassBrowser, {
        classDefs: THREE_DEFS,
        supportsClassDef: true,
        usedClassNames: new Set<string>(["gamma", "alpha"]),
      })
    );
    const btn = screen.getByTitle("Copy only the 2 classDefs used in the current diagram");
    await act(async () => {
      fireEvent.click(btn);
    });
    const written = clipboardWriteText.mock.calls[0][0] as string;
    const lines = written.split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatch(/^classDef alpha /);
    expect(lines[1]).toMatch(/^classDef gamma /);
    expect(written).not.toContain("beta");
  });

  it("'Copy used' button is absent when usedClassNames is empty (no clipboard call possible)", () => {
    render(
      createElement(ClassBrowser, {
        classDefs: SAMPLE_CLASS_DEFS,
        supportsClassDef: true,
        usedClassNames: new Set<string>(),
      })
    );
    expect(
      screen.queryByTitle(/Copy only the \d+ classDef/)
    ).toBeNull();
  });

  it("'Copy used' button is absent when usedClassNames is omitted", () => {
    render(
      createElement(ClassBrowser, {
        classDefs: SAMPLE_CLASS_DEFS,
        supportsClassDef: true,
      })
    );
    expect(
      screen.queryByTitle(/Copy only the \d+ classDef/)
    ).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Per-card usage copy (click card → writes ":::className")
// ---------------------------------------------------------------------------

describe("ClassBrowser — per-card usage copy (:::className)", () => {
  it("writes ':::primary' when the primary card is clicked", async () => {
    render(
      createElement(ClassBrowser, {
        classDefs: SAMPLE_CLASS_DEFS,
        supportsClassDef: true,
      })
    );
    const card = screen.getByTitle("Click to copy :::primary");
    await act(async () => {
      fireEvent.click(card);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(clipboardWriteText).toHaveBeenCalledOnce();
    expect(clipboardWriteText).toHaveBeenCalledWith(":::primary");
  });

  it("writes ':::secondary' when the secondary card is clicked", async () => {
    render(
      createElement(ClassBrowser, {
        classDefs: SAMPLE_CLASS_DEFS,
        supportsClassDef: true,
      })
    );
    const card = screen.getByTitle("Click to copy :::secondary");
    await act(async () => {
      fireEvent.click(card);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(clipboardWriteText).toHaveBeenCalledWith(":::secondary");
  });

  it("does not call clipboard.writeText when card is disabled (supportsClassDef=false)", async () => {
    render(
      createElement(ClassBrowser, {
        classDefs: SAMPLE_CLASS_DEFS,
        supportsClassDef: false,
      })
    );
    const card = screen.getByTitle("Click to copy :::primary");
    await act(async () => {
      fireEvent.click(card);
    });
    expect(clipboardWriteText).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Per-card classDef copy (copy-icon button → writes full "classDef …" line)
// ---------------------------------------------------------------------------

describe("ClassBrowser — per-card classDef copy (full classDef line)", () => {
  it("writes the full classDef line for primary when its copy-icon is clicked", async () => {
    render(
      createElement(ClassBrowser, {
        classDefs: SAMPLE_CLASS_DEFS,
        supportsClassDef: true,
      })
    );
    const btn = screen.getByLabelText("Copy classDef primary");
    await act(async () => {
      fireEvent.click(btn);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(clipboardWriteText).toHaveBeenCalledOnce();
    expect(clipboardWriteText).toHaveBeenCalledWith(PRIMARY_LINE);
  });

  it("writes the full classDef line for secondary when its copy-icon is clicked", async () => {
    render(
      createElement(ClassBrowser, {
        classDefs: SAMPLE_CLASS_DEFS,
        supportsClassDef: true,
      })
    );
    const btn = screen.getByLabelText("Copy classDef secondary");
    await act(async () => {
      fireEvent.click(btn);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(clipboardWriteText).toHaveBeenCalledWith(SECONDARY_LINE);
  });

  it("written line starts with 'classDef <name>'", async () => {
    render(
      createElement(ClassBrowser, {
        classDefs: SAMPLE_CLASS_DEFS,
        supportsClassDef: true,
      })
    );
    const btn = screen.getByLabelText("Copy classDef primary");
    await act(async () => {
      fireEvent.click(btn);
      await Promise.resolve();
      await Promise.resolve();
    });
    const written = clipboardWriteText.mock.calls[0][0] as string;
    expect(written).toMatch(/^classDef primary /);
  });

  it("written line contains fill, stroke, and color properties", async () => {
    render(
      createElement(ClassBrowser, {
        classDefs: SAMPLE_CLASS_DEFS,
        supportsClassDef: true,
      })
    );
    const btn = screen.getByLabelText("Copy classDef primary");
    await act(async () => {
      fireEvent.click(btn);
      await Promise.resolve();
      await Promise.resolve();
    });
    const written = clipboardWriteText.mock.calls[0][0] as string;
    expect(written).toContain("fill:#1e3a5f");
    expect(written).toContain("stroke:#3b82f6");
    expect(written).toContain("color:#ffffff");
  });

  it("does not call clipboard.writeText when copy-icon is clicked while disabled", async () => {
    render(
      createElement(ClassBrowser, {
        classDefs: SAMPLE_CLASS_DEFS,
        supportsClassDef: false,
      })
    );
    const btn = screen.getByLabelText("Copy classDef primary");
    await act(async () => {
      fireEvent.click(btn);
    });
    expect(clipboardWriteText).not.toHaveBeenCalled();
  });
});
