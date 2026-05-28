// @vitest-environment happy-dom

/**
 * Render-level tests for the multi-diagram selector in ApplyTab (Task #127 / Task #199).
 *
 * These tests render ApplyTab with @testing-library/react to catch regressions
 * that pure hook/unit tests cannot detect — specifically, a stale selector label
 * being visible in the DOM for one frame before React corrects the index.
 *
 * The guard under test (ApplyTab lines 187–189):
 *   if (activeDiagramIdx > 0 && activeDiagramIdx >= diagrams.length)
 *     setActiveDiagramIdx(0);
 *
 * Calling setState during render causes React to discard the current render and
 * immediately restart with the corrected index — no intermediate frame is painted,
 * so no stale selector label is ever visible. These tests verify that contract.
 *
 * previewMode is forced to "code" so MermaidPreview is never mounted and the
 * tests stay fast and environment-agnostic (no Mermaid rendering in happy-dom).
 */

import { describe, it, expect, vi, afterEach } from "vitest";

// Capture variables — prop-spy mocks write here; each test resets before asserting.
let capturedMermaidCode: string | undefined;
let capturedDiffOld: string | undefined;
let capturedDiffNew: string | undefined;

// vi.mock calls are hoisted before all imports by Vitest.
vi.mock("@/components/MermaidPreview", () => ({
  MermaidPreview: ({ code }: { code: string }) => {
    capturedMermaidCode = code;
    return null;
  },
}));

vi.mock("@/components/DiffView", () => ({
  DiffView: ({ oldText, newText }: { oldText: string; newText: string }) => {
    capturedDiffOld = oldText;
    capturedDiffNew = newText;
    return null;
  },
}));

import { render, screen, act, cleanup } from "@testing-library/react";
import { fireEvent } from "@testing-library/dom";
import { createElement } from "react";
import { ApplyTab } from "@/pages/tabs/ApplyTab";
import { BRAND_PALETTES } from "@/lib/palettes";
import { DEFAULT_TYPOGRAPHY } from "@/lib/typography";

const palette = BRAND_PALETTES[0];

// Two structurally distinct diagrams separated by a blank line — splitDiagrams
// will yield 2 entries with labels "Diagram 1" and "Diagram 2".
const MULTI_INPUT = [
  "flowchart TD",
  "  A --> B",
  "",
  "sequenceDiagram",
  "  Alice->>Bob: Hello",
].join("\n");

// Single-diagram content — splitDiagrams yields 1 entry with label "Diagram 1".
const SINGLE_INPUT = "flowchart TD\n  A --> B";

/** Build a full ApplyTab prop set with controlled inputCode and safe stubs. */
function makeProps(inputCode: string) {
  return {
    selectedPalette: palette,
    selectedPaletteId: palette.id,
    onSelectPalette: vi.fn(),
    customColors: {} as Record<string, never[]>,
    onColorChange: vi.fn(),
    onResetPalette: vi.fn(),
    onResetColor: vi.fn(),
    hasCustomizations: false,
    inputCode,
    onInputChange: vi.fn(),
    includeMetaComments: false,
    includeBadge: false,
    effectiveThemeName: palette.name,
    onSwitchTab: vi.fn(),
    onExtractTheme: vi.fn().mockReturnValue(null),
    userPalettes: [],
    onShowToast: vi.fn(),
    recentPaletteIds: [],
    look: "classic" as const,
    onLookChange: vi.fn(),
    fontSize: "",
    onFontSizeChange: vi.fn(),
    typography: DEFAULT_TYPOGRAPHY,
    rendererTarget: "",
    onRendererTargetChange: vi.fn(),
    lastExampleType: {} as Record<string, "flowchart" | "sequence">,
    onRecordExampleType: vi.fn(),
    previewMode: "code" as const,
    onPreviewModeChange: vi.fn(),
    hintResetToken: 0,
    onResetSyntaxHints: vi.fn(),
  };
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Presence: selector appears / disappears based on diagram count
// ---------------------------------------------------------------------------

describe("ApplyTab — diagram selector presence", () => {
  it("renders the diagram selector when inputCode contains 2 diagrams", () => {
    render(createElement(ApplyTab, makeProps(MULTI_INPUT)));
    expect(screen.getByLabelText("Select diagram")).toBeTruthy();
  });

  it("selector has one option per diagram with correct labels", () => {
    render(createElement(ApplyTab, makeProps(MULTI_INPUT)));
    const select = screen.getByLabelText("Select diagram");
    const options = Array.from(select.querySelectorAll("option"));
    expect(options).toHaveLength(2);
    // Multi-diagram label format: "${index+1}. ${keyword}" (from splitDiagrams)
    expect(options[0].textContent).toMatch(/^1\. flowchart/);
    expect(options[1].textContent).toMatch(/^2\. sequenceDiagram/);
  });

  it("does not render the selector when inputCode contains only 1 diagram", () => {
    render(createElement(ApplyTab, makeProps(SINGLE_INPUT)));
    expect(screen.queryByLabelText("Select diagram")).toBeNull();
  });

  it("does not render the Previous/Next diagram buttons for single input", () => {
    render(createElement(ApplyTab, makeProps(SINGLE_INPUT)));
    expect(screen.queryByLabelText("Previous diagram")).toBeNull();
    expect(screen.queryByLabelText("Next diagram")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Sync: selector and stale label disappear when content shrinks
// ---------------------------------------------------------------------------

describe("ApplyTab — diagram selector sync: selector hidden after content shrinks", () => {
  it("hides the selector immediately when inputCode changes from 2 diagrams to 1", () => {
    const { rerender } = render(createElement(ApplyTab, makeProps(MULTI_INPUT)));
    expect(screen.getByLabelText("Select diagram")).toBeTruthy();

    act(() => {
      rerender(createElement(ApplyTab, makeProps(SINGLE_INPUT)));
    });

    expect(screen.queryByLabelText("Select diagram")).toBeNull();
  });

  it("removes the second diagram option from the DOM when content shrinks to 1 diagram", () => {
    const { rerender } = render(createElement(ApplyTab, makeProps(MULTI_INPUT)));
    // While multi-diagram, the second option ("2. sequenceDiagram") exists
    const selectBefore = screen.getByLabelText("Select diagram");
    expect(selectBefore.querySelectorAll("option")).toHaveLength(2);

    act(() => {
      rerender(createElement(ApplyTab, makeProps(SINGLE_INPUT)));
    });

    // The entire select is gone — no option from the old multi-diagram state remains
    expect(screen.queryByLabelText("Select diagram")).toBeNull();
  });

  it("hides the selector when activeDiagramIdx was 1 before content shrinks to 1 diagram", async () => {
    // This is the primary regression guard for the Task #127 fix.
    // The user was viewing diagram 2 (activeDiagramIdx=1). When they paste
    // single-diagram content, the inline setState guard in ApplyTab must clamp
    // activeDiagramIdx back to 0 before any frame is painted.
    const { rerender } = render(createElement(ApplyTab, makeProps(MULTI_INPUT)));

    // Navigate to diagram 2 — sets activeDiagramIdx to 1 inside the component.
    const nextBtn = screen.getByLabelText("Next diagram");
    await act(async () => {
      fireEvent.click(nextBtn);
    });
    expect(screen.getByLabelText("Select diagram")).toBeTruthy();

    // Simulate the user pasting single-diagram content (parent changes inputCode prop).
    act(() => {
      rerender(createElement(ApplyTab, makeProps(SINGLE_INPUT)));
    });

    // The guard fires: activeDiagramIdx (1) >= diagrams.length (1) → setActiveDiagramIdx(0)
    // React discards the in-progress render and restarts with activeDiagramIdx=0.
    // isMultiDiagram is now false → selector is not rendered.
    expect(screen.queryByLabelText("Select diagram")).toBeNull();
  });

  it("no stale diagram option remains in DOM when user was on diagram 2 and content shrinks", async () => {
    const { rerender } = render(createElement(ApplyTab, makeProps(MULTI_INPUT)));

    const nextBtn = screen.getByLabelText("Next diagram");
    await act(async () => {
      fireEvent.click(nextBtn);
    });
    // While on diagram 2, the select still has 2 options
    expect(screen.getByLabelText("Select diagram").querySelectorAll("option")).toHaveLength(2);

    act(() => {
      rerender(createElement(ApplyTab, makeProps(SINGLE_INPUT)));
    });

    // The entire selector must be gone — no stale option from diagram 2 can remain
    // (the inline guard fires before any frame is painted with the stale state).
    expect(screen.queryByLabelText("Select diagram")).toBeNull();
  });

  it("re-renders the selector correctly when content grows back to 2 diagrams", () => {
    const { rerender } = render(createElement(ApplyTab, makeProps(SINGLE_INPUT)));
    expect(screen.queryByLabelText("Select diagram")).toBeNull();

    act(() => {
      rerender(createElement(ApplyTab, makeProps(MULTI_INPUT)));
    });

    expect(screen.getByLabelText("Select diagram")).toBeTruthy();
    const options = Array.from(screen.getByLabelText("Select diagram").querySelectorAll("option"));
    expect(options).toHaveLength(2);
  });

  it("'themed' preview shows diagram 0 content after selector sync", async () => {
    capturedMermaidCode = undefined;
    const { rerender } = render(
      createElement(ApplyTab, { ...makeProps(MULTI_INPUT), previewMode: "themed" as const })
    );

    // Navigate to diagram 2 (sequenceDiagram).
    const nextBtn = screen.getByLabelText("Next diagram");
    await act(async () => {
      fireEvent.click(nextBtn);
    });

    // Shrink to single-diagram content — selector sync clamps activeDiagramIdx to 0.
    act(() => {
      rerender(
        createElement(ApplyTab, { ...makeProps(SINGLE_INPUT), previewMode: "themed" as const })
      );
    });

    // The MermaidPreview code prop must reflect diagram 0 (flowchart), not diagram 1.
    expect(capturedMermaidCode).toContain("flowchart");
    expect(capturedMermaidCode).not.toContain("sequenceDiagram");
  });

  it("'diff' view shows diagram 0 content after selector sync", async () => {
    capturedDiffOld = undefined;
    capturedDiffNew = undefined;
    const { rerender } = render(
      createElement(ApplyTab, { ...makeProps(MULTI_INPUT), previewMode: "diff" as const })
    );

    // Navigate to diagram 2 (sequenceDiagram).
    const nextBtn = screen.getByLabelText("Next diagram");
    await act(async () => {
      fireEvent.click(nextBtn);
    });

    // Shrink to single-diagram content — selector sync clamps activeDiagramIdx to 0.
    act(() => {
      rerender(
        createElement(ApplyTab, { ...makeProps(SINGLE_INPUT), previewMode: "diff" as const })
      );
    });

    // Both DiffView props must reflect diagram 0 (flowchart), not diagram 1.
    expect(capturedDiffOld).toContain("flowchart");
    expect(capturedDiffOld).not.toContain("sequenceDiagram");
    expect(capturedDiffNew).toContain("flowchart");
    expect(capturedDiffNew).not.toContain("sequenceDiagram");
  });
});
