// @vitest-environment happy-dom

/**
 * Component tests for DiffView (Task #108).
 *
 * Verifies the two critical behaviors the diff panel must always satisfy:
 *
 *   1. When a palette is applied to a diagram the themed code differs from the
 *      original, and the DiffView renders at least one "add" row in the table.
 *
 *   2. When original === themed (no palette applied, or diagram is identical)
 *      the DiffView renders a "no changes" empty-state message instead of a
 *      blank or confusing table.
 *
 *   3. When no diagram has been pasted yet (both texts empty) the component
 *      shows the "paste a diagram" prompt — not a blank panel.
 */

import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { createElement } from "react";
import { DiffView } from "@/components/DiffView";
import { generateThemedCode, type ExportOptions } from "@/lib/themeEngine";
import { BRAND_PALETTES } from "@/lib/palettes";

afterEach(cleanup);

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const SIMPLE_DIAGRAM = "flowchart TD\n  A --> B\n  B --> C";

const BASE_OPTIONS: ExportOptions = {
  palette: BRAND_PALETTES[0],
  diagramFamily: "flowchart",
  includeMetaComments: false,
  includeBadge: false,
};

/** Themed output produced by applying the first brand palette. */
const THEMED_CODE = generateThemedCode(SIMPLE_DIAGRAM, BASE_OPTIONS);

// ---------------------------------------------------------------------------
// 1. Add rows appear when a theme is applied
// ---------------------------------------------------------------------------

describe("DiffView — theme applied (original vs themed)", () => {
  it("renders the diff table when original and themed code differ", () => {
    render(createElement(DiffView, { oldText: SIMPLE_DIAGRAM, newText: THEMED_CODE }));
    const table = screen.getByRole("table");
    expect(table).toBeTruthy();
  });

  it("renders at least one add row when a palette is applied", () => {
    render(createElement(DiffView, { oldText: SIMPLE_DIAGRAM, newText: THEMED_CODE }));
    const rows = screen.getAllByRole("row");
    // At minimum the %%{init:...}%% directive must appear as an added line.
    // The marker cell for an added row contains "+".
    const markerCells = rows.flatMap((row) =>
      Array.from(row.querySelectorAll("td")).filter((td) => td.textContent === "+"),
    );
    expect(markerCells.length).toBeGreaterThan(0);
  });

  it("the summary header shows a non-zero added count when a palette is applied", () => {
    render(createElement(DiffView, { oldText: SIMPLE_DIAGRAM, newText: THEMED_CODE }));
    // The aria-label on the added-count span reports "N lines added".
    const addedSpan = screen.getByLabelText(/lines added/i);
    const addedCount = parseInt(addedSpan.textContent?.replace("+", "") ?? "0", 10);
    expect(addedCount).toBeGreaterThan(0);
  });

  it("the summary header shows zero removed lines when only a directive is prepended", () => {
    render(createElement(DiffView, { oldText: SIMPLE_DIAGRAM, newText: THEMED_CODE }));
    const removedSpan = screen.getByLabelText(/lines removed/i);
    const removedCount = parseInt(removedSpan.textContent?.replace("−", "") ?? "0", 10);
    expect(removedCount).toBe(0);
  });

  it("the init directive text appears somewhere in the rendered table", () => {
    render(createElement(DiffView, { oldText: SIMPLE_DIAGRAM, newText: THEMED_CODE }));
    // The %%{init: line must be visible in the diff output.
    expect(screen.getByRole("table").textContent).toContain("%%{init:");
  });
});

// ---------------------------------------------------------------------------
// 2. No-changes empty state — original matches themed (no palette change)
// ---------------------------------------------------------------------------

describe("DiffView — no changes (original equals themed)", () => {
  it("renders the no-changes empty-state message when both texts are identical", () => {
    render(createElement(DiffView, { oldText: SIMPLE_DIAGRAM, newText: SIMPLE_DIAGRAM }));
    expect(screen.getByText(/no changes/i)).toBeTruthy();
  });

  it("the no-changes message mentions selecting a palette", () => {
    render(createElement(DiffView, { oldText: SIMPLE_DIAGRAM, newText: SIMPLE_DIAGRAM }));
    expect(screen.getByText(/select a palette/i)).toBeTruthy();
  });

  it("does not render the diff table when there are no changes", () => {
    render(createElement(DiffView, { oldText: SIMPLE_DIAGRAM, newText: SIMPLE_DIAGRAM }));
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("does not render the no-changes state when texts differ", () => {
    render(createElement(DiffView, { oldText: SIMPLE_DIAGRAM, newText: THEMED_CODE }));
    expect(screen.queryByText(/no changes/i)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 3. Empty-input state — no diagram pasted yet
// ---------------------------------------------------------------------------

describe("DiffView — empty input (no diagram pasted)", () => {
  it("renders the paste-prompt when both texts are empty strings", () => {
    render(createElement(DiffView, { oldText: "", newText: "" }));
    expect(screen.getByText(/paste a mermaid diagram/i)).toBeTruthy();
  });

  it("renders the paste-prompt when both texts are whitespace-only", () => {
    render(createElement(DiffView, { oldText: "   ", newText: "   " }));
    expect(screen.getByText(/paste a mermaid diagram/i)).toBeTruthy();
  });

  it("does not render the diff table when both texts are empty", () => {
    render(createElement(DiffView, { oldText: "", newText: "" }));
    expect(screen.queryByRole("table")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 4. Wiring contract: generateThemedCode always differs from original input
//    (ensures future regressions in themeEngine won't silently break the diff)
// ---------------------------------------------------------------------------

describe("DiffView — wiring contract: palette application produces changes", () => {
  it("generateThemedCode output differs from its input for every brand palette", () => {
    for (const palette of BRAND_PALETTES) {
      const themed = generateThemedCode(SIMPLE_DIAGRAM, { ...BASE_OPTIONS, palette });
      expect(themed).not.toBe(SIMPLE_DIAGRAM);
    }
  });

  it("every brand palette produces at least one add row in DiffView", () => {
    for (const palette of BRAND_PALETTES) {
      const themed = generateThemedCode(SIMPLE_DIAGRAM, { ...BASE_OPTIONS, palette });
      const { unmount } = render(
        createElement(DiffView, { oldText: SIMPLE_DIAGRAM, newText: themed }),
      );
      const table = screen.getByRole("table");
      const markerCells = Array.from(table.querySelectorAll("td")).filter(
        (td) => td.textContent === "+",
      );
      expect(markerCells.length).toBeGreaterThan(0);
      unmount();
    }
  });
});
