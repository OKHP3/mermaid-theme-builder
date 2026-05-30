// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
import { fireEvent } from "@testing-library/dom";
import { createElement } from "react";
import { ClassBrowser } from "@/components/ClassBrowser";
import type { ClassDef } from "@/lib/theme-engine";

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
  localStorage.clear();
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
    expect(screen.queryByTitle(/Copy only the \d+ classDef/)).toBeNull();
  });

  it("'Copy used' button is absent when usedClassNames is omitted", () => {
    render(
      createElement(ClassBrowser, {
        classDefs: SAMPLE_CLASS_DEFS,
        supportsClassDef: true,
      })
    );
    expect(screen.queryByTitle(/Copy only the \d+ classDef/)).toBeNull();
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

// ---------------------------------------------------------------------------
// Preview panel "Copy" button
// ---------------------------------------------------------------------------
// The preview panel (opened via the eye-icon) has its own "Copy" button that
// routes to handleCopyAll or handleCopyUsed based on the active previewMode.
// The panel Copy button title is "Copy all classDefs" or "Copy used classDefs"
// — intentionally distinct from the top-level "Copy all classDefs as a single
// block" and "Copy only the N classDef..." button titles.
// Note: per task #193, opening the panel with non-empty usedClassNames defaults
// to "used" mode, so tests that need "all" mode switch to it first.
// ---------------------------------------------------------------------------

/** Click the eye-icon button to open the preview panel. */
function openPreviewPanel() {
  const eyeBtn = screen.getByLabelText("Preview all classDefs");
  act(() => {
    fireEvent.click(eyeBtn);
  });
}

/** Click the "All" toggle button inside the open preview panel. */
function switchToAllMode() {
  const allBtn = screen.getByTitle("Show all classDefs");
  act(() => {
    fireEvent.click(allBtn);
  });
}

/** Click the "Used" toggle button inside the open preview panel. */
function switchToUsedMode() {
  const usedBtn = screen.getByTitle(/^Show only the \d+ classDef/);
  act(() => {
    fireEvent.click(usedBtn);
  });
}

describe("ClassBrowser — preview panel 'Copy' button: 'all' mode writes full block", () => {
  it("writes the full ALL_BLOCK when Copy is clicked in 'all' mode", async () => {
    render(
      createElement(ClassBrowser, {
        classDefs: SAMPLE_CLASS_DEFS,
        supportsClassDef: true,
        usedClassNames: new Set(["primary"]),
      })
    );
    openPreviewPanel();
    // Panel opens in "used" mode (task #193) → switch to "all"
    switchToAllMode();
    const copyBtn = screen.getByTitle("Copy all classDefs");
    await act(async () => {
      fireEvent.click(copyBtn);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(clipboardWriteText).toHaveBeenCalledOnce();
    expect(clipboardWriteText).toHaveBeenCalledWith(ALL_BLOCK);
  });

  it("writes both classDef lines separated by a newline in 'all' mode", async () => {
    render(
      createElement(ClassBrowser, {
        classDefs: SAMPLE_CLASS_DEFS,
        supportsClassDef: true,
        usedClassNames: new Set(["secondary"]),
      })
    );
    openPreviewPanel();
    switchToAllMode();
    const copyBtn = screen.getByTitle("Copy all classDefs");
    await act(async () => {
      fireEvent.click(copyBtn);
      await Promise.resolve();
      await Promise.resolve();
    });
    const written = clipboardWriteText.mock.calls[0][0] as string;
    const lines = written.split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe(PRIMARY_LINE);
    expect(lines[1]).toBe(SECONDARY_LINE);
  });

  it("preserves definition order in 'all' mode even when a used class sorts visually first", async () => {
    // "secondary" is used → visual grid shows secondary before primary,
    // but "Copy all" via the panel must still emit definition order.
    render(
      createElement(ClassBrowser, {
        classDefs: SAMPLE_CLASS_DEFS,
        supportsClassDef: true,
        usedClassNames: new Set(["secondary"]),
      })
    );
    openPreviewPanel();
    switchToAllMode();
    const copyBtn = screen.getByTitle("Copy all classDefs");
    await act(async () => {
      fireEvent.click(copyBtn);
      await Promise.resolve();
      await Promise.resolve();
    });
    const written = clipboardWriteText.mock.calls[0][0] as string;
    const lines = written.split("\n");
    // primary (index 0 in classDefs) must appear before secondary (index 1)
    expect(lines[0]).toBe(PRIMARY_LINE);
    expect(lines[1]).toBe(SECONDARY_LINE);
  });

  it("writes full block when no classes are used (panel stays in 'all' mode)", async () => {
    render(
      createElement(ClassBrowser, {
        classDefs: SAMPLE_CLASS_DEFS,
        supportsClassDef: true,
        usedClassNames: new Set<string>(),
      })
    );
    openPreviewPanel();
    // No toggle group → panel stays in "all" mode; button title is "Copy all classDefs"
    const copyBtn = screen.getByTitle("Copy all classDefs");
    await act(async () => {
      fireEvent.click(copyBtn);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(clipboardWriteText).toHaveBeenCalledOnce();
    expect(clipboardWriteText).toHaveBeenCalledWith(ALL_BLOCK);
  });

  it("writes full block when usedClassNames is omitted (panel stays in 'all' mode)", async () => {
    render(
      createElement(ClassBrowser, {
        classDefs: SAMPLE_CLASS_DEFS,
        supportsClassDef: true,
      })
    );
    openPreviewPanel();
    const copyBtn = screen.getByTitle("Copy all classDefs");
    await act(async () => {
      fireEvent.click(copyBtn);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(clipboardWriteText).toHaveBeenCalledOnce();
    expect(clipboardWriteText).toHaveBeenCalledWith(ALL_BLOCK);
  });
});

describe("ClassBrowser — preview panel 'Copy' button: 'used' mode writes subset", () => {
  it("writes only the used classDef line when previewMode='used' with one used class", async () => {
    render(
      createElement(ClassBrowser, {
        classDefs: SAMPLE_CLASS_DEFS,
        supportsClassDef: true,
        usedClassNames: new Set(["primary"]),
      })
    );
    openPreviewPanel();
    // Panel opens in "used" mode by default (task #193)
    const copyBtn = screen.getByTitle("Copy used classDefs");
    await act(async () => {
      fireEvent.click(copyBtn);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(clipboardWriteText).toHaveBeenCalledOnce();
    expect(clipboardWriteText).toHaveBeenCalledWith(PRIMARY_LINE);
  });

  it("does not include unused classes when previewMode='used'", async () => {
    render(
      createElement(ClassBrowser, {
        classDefs: SAMPLE_CLASS_DEFS,
        supportsClassDef: true,
        usedClassNames: new Set(["primary"]),
      })
    );
    openPreviewPanel();
    const copyBtn = screen.getByTitle("Copy used classDefs");
    await act(async () => {
      fireEvent.click(copyBtn);
      await Promise.resolve();
      await Promise.resolve();
    });
    const written = clipboardWriteText.mock.calls[0][0] as string;
    expect(written).not.toContain("secondary");
    expect(written).toContain("primary");
  });

  it("writes the secondary line when only secondary is used", async () => {
    render(
      createElement(ClassBrowser, {
        classDefs: SAMPLE_CLASS_DEFS,
        supportsClassDef: true,
        usedClassNames: new Set(["secondary"]),
      })
    );
    openPreviewPanel();
    const copyBtn = screen.getByTitle("Copy used classDefs");
    await act(async () => {
      fireEvent.click(copyBtn);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(clipboardWriteText).toHaveBeenCalledOnce();
    expect(clipboardWriteText).toHaveBeenCalledWith(SECONDARY_LINE);
  });

  it("writes both lines in definition order when both classes are used", async () => {
    render(
      createElement(ClassBrowser, {
        classDefs: SAMPLE_CLASS_DEFS,
        supportsClassDef: true,
        usedClassNames: new Set(["primary", "secondary"]),
      })
    );
    openPreviewPanel();
    const copyBtn = screen.getByTitle("Copy used classDefs");
    await act(async () => {
      fireEvent.click(copyBtn);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(clipboardWriteText).toHaveBeenCalledOnce();
    const written = clipboardWriteText.mock.calls[0][0] as string;
    const lines = written.split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe(PRIMARY_LINE);
    expect(lines[1]).toBe(SECONDARY_LINE);
  });

  it("written line starts with 'classDef <name>' in correct format", async () => {
    render(
      createElement(ClassBrowser, {
        classDefs: SAMPLE_CLASS_DEFS,
        supportsClassDef: true,
        usedClassNames: new Set(["secondary"]),
      })
    );
    openPreviewPanel();
    const copyBtn = screen.getByTitle("Copy used classDefs");
    await act(async () => {
      fireEvent.click(copyBtn);
      await Promise.resolve();
      await Promise.resolve();
    });
    const written = clipboardWriteText.mock.calls[0][0] as string;
    expect(written).toMatch(/^classDef secondary /);
    expect(written).toContain("fill:#374151");
    expect(written).toContain("stroke:#6b7280");
    expect(written).toContain("color:#f3f4f6");
  });
});

describe("ClassBrowser — preview panel 'Copy' button: mode switch changes clipboard output", () => {
  it("switching from 'used' to 'all' changes the written block", async () => {
    // primary is used, secondary is not — so "used" writes 1 line, "all" writes 2
    render(
      createElement(ClassBrowser, {
        classDefs: SAMPLE_CLASS_DEFS,
        supportsClassDef: true,
        usedClassNames: new Set(["primary"]),
      })
    );
    openPreviewPanel();

    // "Used" mode Copy → PRIMARY_LINE only
    const copyUsedBtn = screen.getByTitle("Copy used classDefs");
    await act(async () => {
      fireEvent.click(copyUsedBtn);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(clipboardWriteText).toHaveBeenNthCalledWith(1, PRIMARY_LINE);

    // Switch to "all" → Copy → full ALL_BLOCK
    switchToAllMode();
    const copyAllBtn = screen.getByTitle("Copy all classDefs");
    await act(async () => {
      fireEvent.click(copyAllBtn);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(clipboardWriteText).toHaveBeenNthCalledWith(2, ALL_BLOCK);
  });

  it("switching from 'all' back to 'used' restores the subset copy", async () => {
    render(
      createElement(ClassBrowser, {
        classDefs: SAMPLE_CLASS_DEFS,
        supportsClassDef: true,
        usedClassNames: new Set(["secondary"]),
      })
    );
    openPreviewPanel();

    // Start in "used" mode → switch to "all" then back to "used"
    switchToAllMode();
    switchToUsedMode();

    const copyBtn = screen.getByTitle("Copy used classDefs");
    await act(async () => {
      fireEvent.click(copyBtn);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(clipboardWriteText).toHaveBeenCalledOnce();
    expect(clipboardWriteText).toHaveBeenCalledWith(SECONDARY_LINE);
  });

  it("clipboard is called exactly once per Copy click regardless of mode switches", async () => {
    render(
      createElement(ClassBrowser, {
        classDefs: SAMPLE_CLASS_DEFS,
        supportsClassDef: true,
        usedClassNames: new Set(["primary"]),
      })
    );
    openPreviewPanel();
    switchToAllMode();

    const copyAllBtn = screen.getByTitle("Copy all classDefs");
    await act(async () => {
      fireEvent.click(copyAllBtn);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(clipboardWriteText).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// Cross-comparison: 'Copy used' output matches 'Copy all' when all classes used
// ---------------------------------------------------------------------------
// handleCopyAll and handleCopyUsed both call buildClassDefString internally but
// through separate code paths. When every classDef is in usedClassNames both
// handlers must produce the same string. These tests catch any divergence
// between the two paths — e.g. a bug in the filter, a different sort applied
// to one but not the other, or a formatting difference in the line builder.
// ---------------------------------------------------------------------------

describe("ClassBrowser — 'Copy used' output matches 'Copy all' when all classes are in use", () => {
  it("writes identical text from both buttons when all classDefs are used", async () => {
    render(
      createElement(ClassBrowser, {
        classDefs: SAMPLE_CLASS_DEFS,
        supportsClassDef: true,
        usedClassNames: new Set(["primary", "secondary"]),
      })
    );

    // Fire "Copy used" first (top-level button)
    const copyUsedBtn = screen.getByTitle("Copy only the 2 classDefs used in the current diagram");
    await act(async () => {
      fireEvent.click(copyUsedBtn);
      await Promise.resolve();
      await Promise.resolve();
    });
    const writtenByUsed = clipboardWriteText.mock.calls[0][0] as string;

    // Fire "Copy all" second (top-level button)
    const copyAllBtn = screen.getByTitle("Copy all classDefs as a single block");
    await act(async () => {
      fireEvent.click(copyAllBtn);
      await Promise.resolve();
      await Promise.resolve();
    });
    const writtenByAll = clipboardWriteText.mock.calls[1][0] as string;

    expect(writtenByUsed).toBe(writtenByAll);
  });

  it("both writes have the same number of lines", async () => {
    render(
      createElement(ClassBrowser, {
        classDefs: SAMPLE_CLASS_DEFS,
        supportsClassDef: true,
        usedClassNames: new Set(["primary", "secondary"]),
      })
    );

    const copyUsedBtn = screen.getByTitle("Copy only the 2 classDefs used in the current diagram");
    await act(async () => {
      fireEvent.click(copyUsedBtn);
      await Promise.resolve();
      await Promise.resolve();
    });
    const linesFromUsed = (clipboardWriteText.mock.calls[0][0] as string).split("\n");

    const copyAllBtn = screen.getByTitle("Copy all classDefs as a single block");
    await act(async () => {
      fireEvent.click(copyAllBtn);
      await Promise.resolve();
      await Promise.resolve();
    });
    const linesFromAll = (clipboardWriteText.mock.calls[1][0] as string).split("\n");

    expect(linesFromUsed).toHaveLength(linesFromAll.length);
    expect(linesFromUsed).toHaveLength(2);
  });

  it("both writes contain the same lines in the same order", async () => {
    render(
      createElement(ClassBrowser, {
        classDefs: SAMPLE_CLASS_DEFS,
        supportsClassDef: true,
        usedClassNames: new Set(["primary", "secondary"]),
      })
    );

    const copyUsedBtn = screen.getByTitle("Copy only the 2 classDefs used in the current diagram");
    await act(async () => {
      fireEvent.click(copyUsedBtn);
      await Promise.resolve();
      await Promise.resolve();
    });
    const linesFromUsed = (clipboardWriteText.mock.calls[0][0] as string).split("\n");

    const copyAllBtn = screen.getByTitle("Copy all classDefs as a single block");
    await act(async () => {
      fireEvent.click(copyAllBtn);
      await Promise.resolve();
      await Promise.resolve();
    });
    const linesFromAll = (clipboardWriteText.mock.calls[1][0] as string).split("\n");

    linesFromUsed.forEach((line, i) => {
      expect(line).toBe(linesFromAll[i]);
    });
  });

  it("neither write contains extra whitespace or formatting differences", async () => {
    render(
      createElement(ClassBrowser, {
        classDefs: SAMPLE_CLASS_DEFS,
        supportsClassDef: true,
        usedClassNames: new Set(["primary", "secondary"]),
      })
    );

    const copyUsedBtn = screen.getByTitle("Copy only the 2 classDefs used in the current diagram");
    await act(async () => {
      fireEvent.click(copyUsedBtn);
      await Promise.resolve();
      await Promise.resolve();
    });
    const writtenByUsed = clipboardWriteText.mock.calls[0][0] as string;

    const copyAllBtn = screen.getByTitle("Copy all classDefs as a single block");
    await act(async () => {
      fireEvent.click(copyAllBtn);
      await Promise.resolve();
      await Promise.resolve();
    });
    const writtenByAll = clipboardWriteText.mock.calls[1][0] as string;

    // Exact byte-for-byte equality catches any trailing-space, tab, or
    // line-ending divergence between the two handlers
    expect(writtenByUsed.length).toBe(writtenByAll.length);
    expect(writtenByUsed).toBe(writtenByAll);
  });
});

// ---------------------------------------------------------------------------
// Preview panel displayed text matches clipboard write (sync test)
// ---------------------------------------------------------------------------
// usedPreviewBlock and handleCopyUsed both derive from the same memo over
// classDefs filtered by usedClassNames. A regression (e.g. one path gets a
// different sort, one path uses sortedClassDefs instead of classDefs) would
// cause the user to see one ordering in the preview but paste a different
// one from the clipboard. These tests lock both surfaces to the same string
// via a non-contiguous used subset (alpha=index 0, gamma=index 2, beta
// skipped) so any ordering divergence shows up immediately.
// ---------------------------------------------------------------------------

const ALPHA_DEF: ClassDef = {
  name: "alpha",
  fill: "#aaaaaa",
  stroke: "#111111",
  color: "#ffffff",
  extra: "",
  description: "",
};
const BETA_DEF: ClassDef = {
  name: "beta",
  fill: "#bbbbbb",
  stroke: "#222222",
  color: "#eeeeee",
  extra: "",
  description: "",
};
const GAMMA_DEF: ClassDef = {
  name: "gamma",
  fill: "#cccccc",
  stroke: "#333333",
  color: "#dddddd",
  extra: "",
  description: "",
};
const NON_CONTIGUOUS_DEFS: ClassDef[] = [ALPHA_DEF, BETA_DEF, GAMMA_DEF];
const ALPHA_LINE = "classDef alpha fill:#aaaaaa,stroke:#111111,color:#ffffff";
const BETA_LINE = "classDef beta fill:#bbbbbb,stroke:#222222,color:#eeeeee";
const GAMMA_LINE = "classDef gamma fill:#cccccc,stroke:#333333,color:#dddddd";

describe("ClassBrowser — preview panel displayed text matches 'Copy used' clipboard write", () => {
  it("preview text exactly matches clipboard write for a non-contiguous used subset", async () => {
    const { container } = render(
      createElement(ClassBrowser, {
        classDefs: NON_CONTIGUOUS_DEFS,
        supportsClassDef: true,
        usedClassNames: new Set(["alpha", "gamma"]),
      })
    );
    openPreviewPanel();
    // Panel defaults to "used" mode (task #193) since usedClassNames is non-empty
    const pre = container.querySelector("pre");
    const previewText = pre?.textContent ?? "";

    const copyBtn = screen.getByTitle("Copy used classDefs");
    await act(async () => {
      fireEvent.click(copyBtn);
      await Promise.resolve();
      await Promise.resolve();
    });
    const writtenToClipboard = clipboardWriteText.mock.calls[0][0] as string;

    expect(previewText).toBe(writtenToClipboard);
  });

  it("preview text is in definition order (alpha before gamma) regardless of Set iteration order", async () => {
    const { container } = render(
      createElement(ClassBrowser, {
        classDefs: NON_CONTIGUOUS_DEFS,
        supportsClassDef: true,
        // Pass gamma first in the Set to confirm definition order wins
        usedClassNames: new Set(["gamma", "alpha"]),
      })
    );
    openPreviewPanel();
    const pre = container.querySelector("pre");
    const lines = (pre?.textContent ?? "").split("\n");

    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatch(/^classDef alpha /);
    expect(lines[1]).toMatch(/^classDef gamma /);
  });

  it("preview text does not include the unused middle class (beta)", async () => {
    const { container } = render(
      createElement(ClassBrowser, {
        classDefs: NON_CONTIGUOUS_DEFS,
        supportsClassDef: true,
        usedClassNames: new Set(["alpha", "gamma"]),
      })
    );
    openPreviewPanel();
    const pre = container.querySelector("pre");
    const previewText = pre?.textContent ?? "";

    expect(previewText).not.toContain("beta");
    expect(previewText).toContain("alpha");
    expect(previewText).toContain("gamma");
  });

  it("preview text and clipboard write both have exactly 2 lines for a 2-of-3 used subset", async () => {
    const { container } = render(
      createElement(ClassBrowser, {
        classDefs: NON_CONTIGUOUS_DEFS,
        supportsClassDef: true,
        usedClassNames: new Set(["alpha", "gamma"]),
      })
    );
    openPreviewPanel();
    const pre = container.querySelector("pre");
    const previewLines = (pre?.textContent ?? "").split("\n");

    const copyBtn = screen.getByTitle("Copy used classDefs");
    await act(async () => {
      fireEvent.click(copyBtn);
      await Promise.resolve();
      await Promise.resolve();
    });
    const clipboardLines = (clipboardWriteText.mock.calls[0][0] as string).split("\n");

    expect(previewLines).toHaveLength(2);
    expect(clipboardLines).toHaveLength(2);
  });

  it("each preview line exactly matches its corresponding clipboard line", async () => {
    const { container } = render(
      createElement(ClassBrowser, {
        classDefs: NON_CONTIGUOUS_DEFS,
        supportsClassDef: true,
        usedClassNames: new Set(["alpha", "gamma"]),
      })
    );
    openPreviewPanel();
    const pre = container.querySelector("pre");
    const previewLines = (pre?.textContent ?? "").split("\n");

    const copyBtn = screen.getByTitle("Copy used classDefs");
    await act(async () => {
      fireEvent.click(copyBtn);
      await Promise.resolve();
      await Promise.resolve();
    });
    const clipboardLines = (clipboardWriteText.mock.calls[0][0] as string).split("\n");

    expect(previewLines[0]).toBe(ALPHA_LINE);
    expect(previewLines[1]).toBe(GAMMA_LINE);
    previewLines.forEach((line, i) => {
      expect(line).toBe(clipboardLines[i]);
    });
  });

  it("switching to 'all' mode updates the preview text to the full block", async () => {
    const { container } = render(
      createElement(ClassBrowser, {
        classDefs: NON_CONTIGUOUS_DEFS,
        supportsClassDef: true,
        usedClassNames: new Set(["alpha", "gamma"]),
      })
    );
    openPreviewPanel();
    // Start in "used" mode — switch to "all"
    switchToAllMode();
    const pre = container.querySelector("pre");
    const previewText = pre?.textContent ?? "";
    const lines = previewText.split("\n");

    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe(ALPHA_LINE);
    expect(lines[1]).toBe(BETA_LINE);
    expect(lines[2]).toBe(GAMMA_LINE);
  });
});

// ---------------------------------------------------------------------------
// Preview panel displayed text matches clipboard write — 'all' mode sync
// ---------------------------------------------------------------------------
// previewBlock and handleCopyAll are separate code paths that both derive from
// classDefs in definition order. A regression (e.g. one path reads
// sortedClassDefs, one gets an accidental sort) would cause the user to see
// one ordering in the preview but paste a different one. These tests lock both
// surfaces to the same string across two scenarios: no usedClassNames (panel
// opens directly in "all" mode with no toggle) and an explicit switch to "all"
// mode when usedClassNames is present.
// ---------------------------------------------------------------------------

describe("ClassBrowser — preview panel displayed text matches 'Copy all' clipboard write", () => {
  it("preview text exactly matches clipboard write when no usedClassNames", async () => {
    // No usedClassNames → panel opens in "all" mode by default, no toggle shown
    const { container } = render(
      createElement(ClassBrowser, {
        classDefs: NON_CONTIGUOUS_DEFS,
        supportsClassDef: true,
      })
    );
    openPreviewPanel();

    const pre = container.querySelector("pre");
    const previewText = pre?.textContent ?? "";

    const copyBtn = screen.getByTitle("Copy all classDefs");
    await act(async () => {
      fireEvent.click(copyBtn);
      await Promise.resolve();
      await Promise.resolve();
    });
    const writtenToClipboard = clipboardWriteText.mock.calls[0][0] as string;

    expect(previewText).toBe(writtenToClipboard);
  });

  it("preview text exactly matches clipboard write after switching to 'all' mode", async () => {
    // usedClassNames present → panel opens in "used" mode; user switches to "all"
    const { container } = render(
      createElement(ClassBrowser, {
        classDefs: NON_CONTIGUOUS_DEFS,
        supportsClassDef: true,
        usedClassNames: new Set(["alpha", "gamma"]),
      })
    );
    openPreviewPanel();
    switchToAllMode();

    const pre = container.querySelector("pre");
    const previewText = pre?.textContent ?? "";

    const copyBtn = screen.getByTitle("Copy all classDefs");
    await act(async () => {
      fireEvent.click(copyBtn);
      await Promise.resolve();
      await Promise.resolve();
    });
    const writtenToClipboard = clipboardWriteText.mock.calls[0][0] as string;

    expect(previewText).toBe(writtenToClipboard);
  });

  it("preview text is in definition order (alpha, beta, gamma) — no usedClassNames", async () => {
    const { container } = render(
      createElement(ClassBrowser, {
        classDefs: NON_CONTIGUOUS_DEFS,
        supportsClassDef: true,
      })
    );
    openPreviewPanel();

    const pre = container.querySelector("pre");
    const lines = (pre?.textContent ?? "").split("\n");

    expect(lines).toHaveLength(3);
    expect(lines[0]).toMatch(/^classDef alpha /);
    expect(lines[1]).toMatch(/^classDef beta /);
    expect(lines[2]).toMatch(/^classDef gamma /);
  });

  it("preview text has exactly 3 lines and clipboard write has exactly 3 lines", async () => {
    const { container } = render(
      createElement(ClassBrowser, {
        classDefs: NON_CONTIGUOUS_DEFS,
        supportsClassDef: true,
      })
    );
    openPreviewPanel();

    const pre = container.querySelector("pre");
    const previewLines = (pre?.textContent ?? "").split("\n");

    const copyBtn = screen.getByTitle("Copy all classDefs");
    await act(async () => {
      fireEvent.click(copyBtn);
      await Promise.resolve();
      await Promise.resolve();
    });
    const clipboardLines = (clipboardWriteText.mock.calls[0][0] as string).split("\n");

    expect(previewLines).toHaveLength(3);
    expect(clipboardLines).toHaveLength(3);
  });

  it("each preview line exactly matches its corresponding clipboard line", async () => {
    const { container } = render(
      createElement(ClassBrowser, {
        classDefs: NON_CONTIGUOUS_DEFS,
        supportsClassDef: true,
      })
    );
    openPreviewPanel();

    const pre = container.querySelector("pre");
    const previewLines = (pre?.textContent ?? "").split("\n");

    const copyBtn = screen.getByTitle("Copy all classDefs");
    await act(async () => {
      fireEvent.click(copyBtn);
      await Promise.resolve();
      await Promise.resolve();
    });
    const clipboardLines = (clipboardWriteText.mock.calls[0][0] as string).split("\n");

    expect(previewLines[0]).toBe(ALPHA_LINE);
    expect(previewLines[1]).toBe(BETA_LINE);
    expect(previewLines[2]).toBe(GAMMA_LINE);
    previewLines.forEach((line, i) => {
      expect(line).toBe(clipboardLines[i]);
    });
  });

  it("definition order is preserved even when usedClassNames would sort differently", async () => {
    // "gamma" is the only used class → visual grid shows gamma first,
    // but "all" mode preview and Copy all must still emit definition order.
    const { container } = render(
      createElement(ClassBrowser, {
        classDefs: NON_CONTIGUOUS_DEFS,
        supportsClassDef: true,
        usedClassNames: new Set(["gamma"]),
      })
    );
    openPreviewPanel();
    switchToAllMode();

    const pre = container.querySelector("pre");
    const lines = (pre?.textContent ?? "").split("\n");

    expect(lines[0]).toMatch(/^classDef alpha /);
    expect(lines[1]).toMatch(/^classDef beta /);
    expect(lines[2]).toMatch(/^classDef gamma /);
  });
});
