// @vitest-environment happy-dom
/**
 * Interactive tests for the All/Used preview toggle in ClassBrowser.
 *
 * Covers:
 *   - Auto-switch to "used" mode when the preview is opened with used classes
 *   - Auto-open in "all" mode when no classes are in use
 *   - Toggle group visibility (only shown when usedClassNames is non-empty)
 *   - Mode switching updates the header label and preview content
 *   - Copy button in the panel routes to the correct copy action per mode
 *
 * Runs in happy-dom so React state updates are observable via
 * @testing-library/react, matching the pattern in classBrowserLiveRegion.test.tsx.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
import { fireEvent } from "@testing-library/dom";
import { createElement } from "react";
import { ClassBrowser } from "@/components/ClassBrowser";
import type { ClassDef } from "@/lib/themeEngine";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ALL_DEFS: ClassDef[] = [
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
  {
    name: "accent",
    fill: "#c46a2c",
    stroke: "#ff8c00",
    color: "#ffffff",
    extra: "",
    description: "Accent node style",
  },
];

// Only "primary" and "secondary" are used in the diagram
const USED_SET = new Set(["primary", "secondary"]);
const SINGLE_USED_SET = new Set(["accent"]);
const EMPTY_SET = new Set<string>();

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
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
// Helpers
// ---------------------------------------------------------------------------

function getEyeButton() {
  return screen.getByLabelText("Preview all classDefs");
}

function openPreview() {
  act(() => {
    fireEvent.click(getEyeButton());
  });
}

function getPreviewPanel() {
  return screen.queryByRole("group", { name: "Preview mode" });
}

function getAllButton() {
  return screen.getByTitle("Show all classDefs");
}

function getUsedButton() {
  // The "Used" button title includes the count, so we match by aria-pressed
  return screen.getAllByRole("button").find(
    (b) => b.textContent?.trim() === "Used" || b.getAttribute("title")?.startsWith("Show only the")
  )!;
}

function getPanelCopyButton() {
  return screen.getByLabelText(/Copy (used|all) classDefs/i);
}

function getPreviewPre() {
  return document.querySelector("pre");
}

// ---------------------------------------------------------------------------
// Tests: eye-button auto-switch on open
// ---------------------------------------------------------------------------

describe("ClassBrowser preview — auto-switch on open with used classes", () => {
  it("opens in 'used' mode when usedClassNames is non-empty", () => {
    render(
      createElement(ClassBrowser, {
        classDefs: ALL_DEFS,
        supportsClassDef: true,
        usedClassNames: USED_SET,
      })
    );
    openPreview();
    // "Used" button should be aria-pressed=true
    const usedBtn = getUsedButton();
    expect(usedBtn.getAttribute("aria-pressed")).toBe("true");
  });

  it("opens in 'all' mode when usedClassNames is empty", () => {
    render(
      createElement(ClassBrowser, {
        classDefs: ALL_DEFS,
        supportsClassDef: true,
        usedClassNames: EMPTY_SET,
      })
    );
    openPreview();
    // Panel has no toggle group (hasUsed is false), but All/Used buttons are absent
    expect(getPreviewPanel()).toBeNull();
  });

  it("opens in 'all' mode when usedClassNames is omitted", () => {
    render(
      createElement(ClassBrowser, {
        classDefs: ALL_DEFS,
        supportsClassDef: true,
      })
    );
    openPreview();
    // No toggle group rendered when no used classes
    expect(getPreviewPanel()).toBeNull();
  });

  it("re-opening after user switched to 'all' resets to 'used' mode", () => {
    render(
      createElement(ClassBrowser, {
        classDefs: ALL_DEFS,
        supportsClassDef: true,
        usedClassNames: USED_SET,
      })
    );

    // Open → defaults to "used"
    openPreview();
    expect(getUsedButton().getAttribute("aria-pressed")).toBe("true");

    // Switch to "all" inside the panel
    act(() => {
      fireEvent.click(getAllButton());
    });
    expect(getAllButton().getAttribute("aria-pressed")).toBe("true");

    // Close and re-open → should reset to "used"
    act(() => {
      fireEvent.click(getEyeButton());
    });
    act(() => {
      fireEvent.click(getEyeButton());
    });
    expect(getUsedButton().getAttribute("aria-pressed")).toBe("true");
  });
});

// ---------------------------------------------------------------------------
// Tests: toggle group visibility
// ---------------------------------------------------------------------------

describe("ClassBrowser preview — All/Used toggle visibility", () => {
  it("shows the All/Used toggle group when usedClassNames is non-empty", () => {
    render(
      createElement(ClassBrowser, {
        classDefs: ALL_DEFS,
        supportsClassDef: true,
        usedClassNames: USED_SET,
      })
    );
    openPreview();
    expect(getPreviewPanel()).not.toBeNull();
  });

  it("hides the All/Used toggle group when usedClassNames is empty", () => {
    render(
      createElement(ClassBrowser, {
        classDefs: ALL_DEFS,
        supportsClassDef: true,
        usedClassNames: EMPTY_SET,
      })
    );
    openPreview();
    expect(getPreviewPanel()).toBeNull();
  });

  it("hides the All/Used toggle group when usedClassNames is omitted", () => {
    render(
      createElement(ClassBrowser, {
        classDefs: ALL_DEFS,
        supportsClassDef: true,
      })
    );
    openPreview();
    expect(getPreviewPanel()).toBeNull();
  });

  it("shows the toggle group for a single used class", () => {
    render(
      createElement(ClassBrowser, {
        classDefs: ALL_DEFS,
        supportsClassDef: true,
        usedClassNames: SINGLE_USED_SET,
      })
    );
    openPreview();
    expect(getPreviewPanel()).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Tests: mode switching updates header label
// ---------------------------------------------------------------------------

describe("ClassBrowser preview — header label changes with mode", () => {
  it("header includes '(used only)' suffix when in 'used' mode", () => {
    render(
      createElement(ClassBrowser, {
        classDefs: ALL_DEFS,
        supportsClassDef: true,
        usedClassNames: USED_SET,
      })
    );
    openPreview();
    // Default open = "used" mode
    const header = document.querySelector(".forge-code-panel, [class*='bg-\\[#0f1f1c\\]'] span, pre")!
      .closest("div")
      ?.previousElementSibling;
    // The "(used only)" text should appear somewhere in the preview panel header
    expect(document.body.textContent).toContain("(used only)");
  });

  it("header does NOT include '(used only)' suffix when in 'all' mode", () => {
    render(
      createElement(ClassBrowser, {
        classDefs: ALL_DEFS,
        supportsClassDef: true,
        usedClassNames: USED_SET,
      })
    );
    openPreview();

    // Switch to "all"
    act(() => {
      fireEvent.click(getAllButton());
    });

    expect(document.body.textContent).not.toContain("(used only)");
  });

  it("switching from 'all' to 'used' shows the '(used only)' label", () => {
    render(
      createElement(ClassBrowser, {
        classDefs: ALL_DEFS,
        supportsClassDef: true,
        usedClassNames: USED_SET,
      })
    );
    openPreview();

    // Switch to "all" first
    act(() => {
      fireEvent.click(getAllButton());
    });
    expect(document.body.textContent).not.toContain("(used only)");

    // Then back to "used"
    act(() => {
      fireEvent.click(getUsedButton());
    });
    expect(document.body.textContent).toContain("(used only)");
  });
});

// ---------------------------------------------------------------------------
// Tests: preview content filters by mode
// ---------------------------------------------------------------------------

describe("ClassBrowser preview — content filtering by mode", () => {
  it("'used' mode shows only the used classDef names in the preview", () => {
    render(
      createElement(ClassBrowser, {
        classDefs: ALL_DEFS,
        supportsClassDef: true,
        usedClassNames: USED_SET,
      })
    );
    openPreview();
    const pre = getPreviewPre()!;
    // "primary" and "secondary" are used
    expect(pre.textContent).toContain("primary");
    expect(pre.textContent).toContain("secondary");
    // "accent" is NOT used
    expect(pre.textContent).not.toContain("accent");
  });

  it("'all' mode shows all classDef names in the preview", () => {
    render(
      createElement(ClassBrowser, {
        classDefs: ALL_DEFS,
        supportsClassDef: true,
        usedClassNames: USED_SET,
      })
    );
    openPreview();

    // Switch to "all"
    act(() => {
      fireEvent.click(getAllButton());
    });

    const pre = getPreviewPre()!;
    expect(pre.textContent).toContain("primary");
    expect(pre.textContent).toContain("secondary");
    expect(pre.textContent).toContain("accent");
  });

  it("without used classes, 'all' mode shows all classDefs", () => {
    render(
      createElement(ClassBrowser, {
        classDefs: ALL_DEFS,
        supportsClassDef: true,
        usedClassNames: EMPTY_SET,
      })
    );
    openPreview();
    const pre = getPreviewPre()!;
    expect(pre.textContent).toContain("primary");
    expect(pre.textContent).toContain("secondary");
    expect(pre.textContent).toContain("accent");
  });
});

// ---------------------------------------------------------------------------
// Tests: Copy button in panel routes correctly by mode
// ---------------------------------------------------------------------------

describe("ClassBrowser preview — panel Copy button label by mode", () => {
  it("Copy button has aria-label 'Copy used classDefs' in 'used' mode", () => {
    render(
      createElement(ClassBrowser, {
        classDefs: ALL_DEFS,
        supportsClassDef: true,
        usedClassNames: USED_SET,
      })
    );
    openPreview();
    // Default: "used" mode
    expect(getPanelCopyButton().getAttribute("aria-label")).toBe("Copy used classDefs");
  });

  it("Copy button has aria-label 'Copy all classDefs' in 'all' mode", () => {
    render(
      createElement(ClassBrowser, {
        classDefs: ALL_DEFS,
        supportsClassDef: true,
        usedClassNames: USED_SET,
      })
    );
    openPreview();

    // Switch to "all"
    act(() => {
      fireEvent.click(getAllButton());
    });

    expect(getPanelCopyButton().getAttribute("aria-label")).toBe("Copy all classDefs");
  });

  it("Copy button has aria-label 'Copy all classDefs' when no classes are used", () => {
    render(
      createElement(ClassBrowser, {
        classDefs: ALL_DEFS,
        supportsClassDef: true,
        usedClassNames: EMPTY_SET,
      })
    );
    openPreview();
    expect(getPanelCopyButton().getAttribute("aria-label")).toBe("Copy all classDefs");
  });
});

describe("ClassBrowser preview — panel Copy button writes correct content", () => {
  it("Copy in 'used' mode writes only the used classDefs to clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      writable: true,
      configurable: true,
    });

    render(
      createElement(ClassBrowser, {
        classDefs: ALL_DEFS,
        supportsClassDef: true,
        usedClassNames: USED_SET,
      })
    );
    openPreview();

    // Default: "used" mode
    await act(async () => {
      fireEvent.click(getPanelCopyButton());
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(writeText).toHaveBeenCalledOnce();
    const written: string = writeText.mock.calls[0][0];
    expect(written).toContain("primary");
    expect(written).toContain("secondary");
    expect(written).not.toContain("accent");
  });

  it("Copy in 'all' mode writes all classDefs to clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      writable: true,
      configurable: true,
    });

    render(
      createElement(ClassBrowser, {
        classDefs: ALL_DEFS,
        supportsClassDef: true,
        usedClassNames: USED_SET,
      })
    );
    openPreview();

    // Switch to "all" first
    act(() => {
      fireEvent.click(getAllButton());
    });

    await act(async () => {
      fireEvent.click(getPanelCopyButton());
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(writeText).toHaveBeenCalledOnce();
    const written: string = writeText.mock.calls[0][0];
    expect(written).toContain("primary");
    expect(written).toContain("secondary");
    expect(written).toContain("accent");
  });

  it("Copy without used classes writes all classDefs to clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      writable: true,
      configurable: true,
    });

    render(
      createElement(ClassBrowser, {
        classDefs: ALL_DEFS,
        supportsClassDef: true,
        usedClassNames: EMPTY_SET,
      })
    );
    openPreview();

    await act(async () => {
      fireEvent.click(getPanelCopyButton());
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(writeText).toHaveBeenCalledOnce();
    const written: string = writeText.mock.calls[0][0];
    expect(written).toContain("primary");
    expect(written).toContain("secondary");
    expect(written).toContain("accent");
  });
});

// ---------------------------------------------------------------------------
// Tests: aria-pressed state on toggle buttons
// ---------------------------------------------------------------------------

describe("ClassBrowser preview — All/Used toggle aria-pressed state", () => {
  it("'Used' button is aria-pressed=true on open when classes are used", () => {
    render(
      createElement(ClassBrowser, {
        classDefs: ALL_DEFS,
        supportsClassDef: true,
        usedClassNames: USED_SET,
      })
    );
    openPreview();
    expect(getUsedButton().getAttribute("aria-pressed")).toBe("true");
    expect(getAllButton().getAttribute("aria-pressed")).toBe("false");
  });

  it("clicking 'All' sets All to aria-pressed=true and Used to aria-pressed=false", () => {
    render(
      createElement(ClassBrowser, {
        classDefs: ALL_DEFS,
        supportsClassDef: true,
        usedClassNames: USED_SET,
      })
    );
    openPreview();

    act(() => {
      fireEvent.click(getAllButton());
    });

    expect(getAllButton().getAttribute("aria-pressed")).toBe("true");
    expect(getUsedButton().getAttribute("aria-pressed")).toBe("false");
  });

  it("clicking 'Used' sets Used to aria-pressed=true and All to aria-pressed=false", () => {
    render(
      createElement(ClassBrowser, {
        classDefs: ALL_DEFS,
        supportsClassDef: true,
        usedClassNames: USED_SET,
      })
    );
    openPreview();

    // Start in "used", switch to "all", then back
    act(() => {
      fireEvent.click(getAllButton());
    });
    act(() => {
      fireEvent.click(getUsedButton());
    });

    expect(getUsedButton().getAttribute("aria-pressed")).toBe("true");
    expect(getAllButton().getAttribute("aria-pressed")).toBe("false");
  });
});

// ---------------------------------------------------------------------------
// Tests: preview panel presence
// ---------------------------------------------------------------------------

describe("ClassBrowser preview — panel not rendered when supportsClassDef=false", () => {
  it("eye button is disabled when supportsClassDef=false", () => {
    render(
      createElement(ClassBrowser, {
        classDefs: ALL_DEFS,
        supportsClassDef: false,
        usedClassNames: USED_SET,
      })
    );
    expect((getEyeButton() as HTMLButtonElement).disabled).toBe(true);
  });
});
