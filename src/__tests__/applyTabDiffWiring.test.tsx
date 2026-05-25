// @vitest-environment happy-dom

/**
 * Integration tests: ApplyTab ↔ DiffView wiring (Task #180).
 *
 * The existing diffView.test.tsx covers DiffView in isolation using
 * pre-computed themed code. These tests mount a real ApplyTab so that a
 * regression in any of the following would be caught:
 *
 *   - Wrong prop passed to DiffView (e.g. themedCode vs activeDiagramCode)
 *   - previewMode prop not reaching the DiffView branch
 *   - generateThemedCode stopping producing a diff for a given palette
 *   - A future refactor that accidentally swaps oldText / newText
 *
 * Strategy
 * --------
 * previewMode is a controlled prop on ApplyTab (owned by App.tsx). This lets
 * us render directly with previewMode="diff" to synchronously assert the diff
 * output, and separately verify the Diff tab button fires onPreviewModeChange
 * with the right argument. No async ticks required.
 */

// vi.mock must be hoisted (before any imports) due to vitest static analysis.
import { vi, describe, it, expect, afterEach } from "vitest";

vi.mock("mermaid", () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn().mockResolvedValue({ svg: "<svg><g></g></svg>", bindFunctions: undefined }),
  },
}));

vi.mock("@/components/PaletteSelectorBar", () => ({
  PaletteSelectorBar: () => null,
}));

import { render, screen, cleanup } from "@testing-library/react";
import { fireEvent } from "@testing-library/dom";
import { createElement } from "react";
import { ApplyTab } from "@/pages/tabs/ApplyTab";
import { BRAND_PALETTES } from "@/lib/palettes";
import { DEFAULT_TYPOGRAPHY } from "@/lib/typography";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const DIAGRAM = "flowchart TD\n  A[User Request] --> B[Validate Input]\n  B --> C[Return Response]";

const PALETTE = BRAND_PALETTES[0];

function noop() {}

/** Minimal but type-safe set of props for ApplyTab. */
const BASE_PROPS = {
  selectedPalette: PALETTE,
  selectedPaletteId: PALETTE.id,
  onSelectPalette: noop,
  customColors: {} as Record<string, import("@/lib/palettes").ThemeColor[]>,
  onColorChange: noop,
  onResetPalette: noop,
  onResetColor: noop,
  hasCustomizations: false,
  inputCode: DIAGRAM,
  onInputChange: noop,
  includeMetaComments: false,
  includeBadge: false,
  effectiveThemeName: PALETTE.name,
  onSwitchTab: noop,
  onExtractTheme: () => null,
  userPalettes: [],
  onShowToast: noop,
  recentPaletteIds: [],
  look: "classic" as const,
  onLookChange: noop,
  fontSize: "",
  onFontSizeChange: noop,
  typography: DEFAULT_TYPOGRAPHY,
  rendererTarget: "",
  onRendererTargetChange: noop,
  lastExampleType: {} as Record<string, "flowchart" | "sequence">,
  onRecordExampleType: noop,
  previewMode: "original" as const,
  onPreviewModeChange: noop,
  hintResetToken: 0,
  onResetSyntaxHints: noop,
};

afterEach(cleanup);

// ---------------------------------------------------------------------------
// 1. DiffView renders and shows add rows when previewMode="diff"
// ---------------------------------------------------------------------------

describe("ApplyTab → DiffView — direct render with previewMode='diff'", () => {
  it("renders the diff table when previewMode is 'diff'", () => {
    render(createElement(ApplyTab, { ...BASE_PROPS, previewMode: "diff" }));
    expect(screen.getByRole("table")).toBeTruthy();
  });

  it("renders at least one add row (+) when a palette is applied", () => {
    render(createElement(ApplyTab, { ...BASE_PROPS, previewMode: "diff" }));
    const table = screen.getByRole("table");
    const addMarkers = Array.from(table.querySelectorAll("td")).filter(
      (td) => td.textContent === "+"
    );
    expect(addMarkers.length).toBeGreaterThan(0);
  });

  it("the %%{init…}%% directive appears in the diff table", () => {
    render(createElement(ApplyTab, { ...BASE_PROPS, previewMode: "diff" }));
    expect(screen.getByRole("table").textContent).toContain("%%{init:");
  });

  it("the summary header shows a non-zero added count", () => {
    render(createElement(ApplyTab, { ...BASE_PROPS, previewMode: "diff" }));
    const addedSpan = screen.getByLabelText(/lines added/i);
    const count = parseInt(addedSpan.textContent?.replace("+", "") ?? "0", 10);
    expect(count).toBeGreaterThan(0);
  });

  it("the summary header shows zero removed lines for a plain directive prepend", () => {
    render(createElement(ApplyTab, { ...BASE_PROPS, previewMode: "diff" }));
    const removedSpan = screen.getByLabelText(/lines removed/i);
    const count = parseInt(removedSpan.textContent?.replace("−", "") ?? "0", 10);
    expect(count).toBe(0);
  });

  it("does not render the diff table when previewMode is 'themed'", () => {
    render(createElement(ApplyTab, { ...BASE_PROPS, previewMode: "themed" }));
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("does not render the diff table when previewMode is 'original'", () => {
    render(createElement(ApplyTab, { ...BASE_PROPS, previewMode: "original" }));
    expect(screen.queryByRole("table")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 2. Switching to Diff mode — callback fires and table appears after rerender
// ---------------------------------------------------------------------------

describe("ApplyTab → DiffView — switching to diff mode via Diff tab button", () => {
  it("the Diff tab button exists with role='tab'", () => {
    render(createElement(ApplyTab, { ...BASE_PROPS, previewMode: "original" }));
    const btn = screen.getByRole("tab", { name: /^diff$/i });
    expect(btn).toBeTruthy();
  });

  it("clicking the Diff tab button calls onPreviewModeChange with 'diff'", () => {
    const onPreviewModeChange = vi.fn();
    render(
      createElement(ApplyTab, { ...BASE_PROPS, previewMode: "original", onPreviewModeChange })
    );
    const diffBtn = screen.getByRole("tab", { name: /^diff$/i });
    fireEvent.click(diffBtn);
    expect(onPreviewModeChange).toHaveBeenCalledTimes(1);
    expect(onPreviewModeChange).toHaveBeenCalledWith("diff");
  });

  it("re-rendering with previewMode='diff' shows the diff table", () => {
    const onPreviewModeChange = vi.fn();
    const { rerender } = render(
      createElement(ApplyTab, { ...BASE_PROPS, previewMode: "original", onPreviewModeChange })
    );
    // No table yet.
    expect(screen.queryByRole("table")).toBeNull();

    // Simulate App.tsx applying the state change after onPreviewModeChange fires.
    rerender(createElement(ApplyTab, { ...BASE_PROPS, previewMode: "diff", onPreviewModeChange }));

    const table = screen.getByRole("table");
    const addMarkers = Array.from(table.querySelectorAll("td")).filter(
      (td) => td.textContent === "+"
    );
    expect(addMarkers.length).toBeGreaterThan(0);
  });

  it("re-rendering back to 'themed' hides the diff table", () => {
    const { rerender } = render(createElement(ApplyTab, { ...BASE_PROPS, previewMode: "diff" }));
    expect(screen.getByRole("table")).toBeTruthy();

    rerender(createElement(ApplyTab, { ...BASE_PROPS, previewMode: "themed" }));
    expect(screen.queryByRole("table")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 3. Wiring regression guard: every brand palette produces add rows
//    through the full ApplyTab→themeEngine→DiffView pipeline
// ---------------------------------------------------------------------------

describe("ApplyTab → DiffView — all brand palettes produce add rows", () => {
  it("every brand palette shows at least one add row when wired through ApplyTab", () => {
    for (const palette of BRAND_PALETTES) {
      const { unmount } = render(
        createElement(ApplyTab, {
          ...BASE_PROPS,
          selectedPalette: palette,
          selectedPaletteId: palette.id,
          effectiveThemeName: palette.name,
          previewMode: "diff",
        })
      );
      const table = screen.getByRole("table");
      const addMarkers = Array.from(table.querySelectorAll("td")).filter(
        (td) => td.textContent === "+"
      );
      expect(addMarkers.length, `palette "${palette.name}" produced no add rows`).toBeGreaterThan(
        0
      );
      unmount();
    }
  });

  it("every brand palette init directive appears in the diff output", () => {
    for (const palette of BRAND_PALETTES) {
      const { unmount } = render(
        createElement(ApplyTab, {
          ...BASE_PROPS,
          selectedPalette: palette,
          selectedPaletteId: palette.id,
          effectiveThemeName: palette.name,
          previewMode: "diff",
        })
      );
      expect(
        screen.getByRole("table").textContent,
        `palette "${palette.name}" did not produce an %%{init…}%% directive`
      ).toContain("%%{init:");
      unmount();
    }
  });
});

// ---------------------------------------------------------------------------
// 4. oldText / newText orientation guard
//    The original diagram lines must appear in the "unchanged" (context) or
//    "removed" rows, never as "added" rows. The %%{init…} directive must
//    appear only in "added" rows (it is not present in the raw input).
// ---------------------------------------------------------------------------

describe("ApplyTab → DiffView — diff direction (old=original, new=themed)", () => {
  it("the original diagram lines are not marked as added", () => {
    render(createElement(ApplyTab, { ...BASE_PROPS, previewMode: "diff" }));
    const table = screen.getByRole("table");
    const rows = Array.from(table.querySelectorAll("tr"));

    // Find rows that contain an "A[User Request]" text cell.
    const relevantRows = rows.filter((row) => row.textContent?.includes("A[User Request]"));
    expect(relevantRows.length).toBeGreaterThan(0);

    for (const row of relevantRows) {
      const cells = Array.from(row.querySelectorAll("td"));
      const markerCell = cells[2];
      expect(markerCell?.textContent).not.toBe("+");
    }
  });

  it("the %%{init…}%% directive row is marked as added, not removed", () => {
    render(createElement(ApplyTab, { ...BASE_PROPS, previewMode: "diff" }));
    const table = screen.getByRole("table");
    const rows = Array.from(table.querySelectorAll("tr"));

    const initRows = rows.filter((row) => row.textContent?.includes("%%{init:"));
    expect(initRows.length).toBeGreaterThan(0);

    for (const row of initRows) {
      const cells = Array.from(row.querySelectorAll("td"));
      const markerCell = cells[2];
      expect(markerCell?.textContent).toBe("+");
    }
  });
});
