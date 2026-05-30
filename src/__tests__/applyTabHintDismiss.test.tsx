// @vitest-environment happy-dom

/**
 * Integration tests: ApplyTab ↔ FamilySyntaxHint dismiss / restore flow
 * (Task #214).
 *
 * Behaviors covered:
 *   1. The syntax hint panel is visible on initial render for a hinted family.
 *   2. The contextual "Show syntax tip" restore button is hidden initially.
 *   3. After dismissing the hint the panel is gone and the restore button
 *      appears.
 *   4. Clicking the restore button fires onResetSyntaxHints; when the parent
 *      responds by incrementing hintResetToken the hint panel re-appears and
 *      the restore button disappears.
 */

// vi.mock must be hoisted before any imports due to vitest static analysis.
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

import { render, screen, cleanup, act } from "@testing-library/react";
import { fireEvent } from "@testing-library/dom";
import { createElement } from "react";
import { ApplyTab } from "@/pages/tabs/ApplyTab";
import { BRAND_PALETTES } from "@/lib/palettes";
import { DEFAULT_TYPOGRAPHY } from "@/lib/typography";
import { clearAllDismissals, dismissHint } from "@/lib/family-syntax-hints";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

// A plain flowchart so the detector resolves to "flowchart" and
// FamilySyntaxHint renders the flowchart hint.
const FLOWCHART = "flowchart TD\n  A[Start] --> B[End]";

// A sequence diagram so the detector resolves to "sequence".
const SEQUENCE = "sequenceDiagram\n  Alice->>Bob: Hello";

// Text that doesn't match any known diagram family (resolves to "unknown",
// which has no hint entry — so the restore button must never appear).
const UNKNOWN = "plain text that is not a mermaid diagram";

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
  inputCode: FLOWCHART,
  onInputChange: noop,
  includeMetaComments: false,
  includeBadge: false,
  effectiveThemeName: PALETTE.name,
  onSwitchTab: noop,
  onNavigateToParityMatrix: noop,
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
  previewMode: "themed" as const,
  onPreviewModeChange: noop,
  hintResetToken: 0,
  onResetSyntaxHints: noop,
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  localStorage.clear();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hintPanelVisible(): boolean {
  return screen.queryByRole("note", { name: "Syntax tips for flowchart" }) !== null;
}

function restoreButtonVisible(): boolean {
  return screen.queryByRole("button", { name: "Show syntax tip for this diagram type" }) !== null;
}

// ---------------------------------------------------------------------------
// 1. Initial state — hint visible, restore button hidden
// ---------------------------------------------------------------------------

describe("ApplyTab hint — initial state for a hinted diagram family", () => {
  it("renders the syntax hint panel on initial load", () => {
    render(createElement(ApplyTab, BASE_PROPS));
    expect(hintPanelVisible()).toBe(true);
  });

  it("does not render the restore button on initial load", () => {
    render(createElement(ApplyTab, BASE_PROPS));
    expect(restoreButtonVisible()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 2. Dismiss → restore cycle
// ---------------------------------------------------------------------------

describe("ApplyTab hint — dismiss and restore flow", () => {
  it("hides the hint panel and shows the restore button after dismissing", async () => {
    render(createElement(ApplyTab, BASE_PROPS));

    expect(hintPanelVisible()).toBe(true);
    expect(restoreButtonVisible()).toBe(false);

    const dismissBtn = screen.getByRole("button", { name: "Dismiss flowchart syntax tip" });
    await act(async () => {
      fireEvent.click(dismissBtn);
    });

    expect(hintPanelVisible()).toBe(false);
    expect(restoreButtonVisible()).toBe(true);
  });

  it("calls onResetSyntaxHints when the restore button is clicked", async () => {
    const onResetSyntaxHints = vi.fn();
    render(createElement(ApplyTab, { ...BASE_PROPS, onResetSyntaxHints }));

    const dismissBtn = screen.getByRole("button", { name: "Dismiss flowchart syntax tip" });
    await act(async () => {
      fireEvent.click(dismissBtn);
    });

    const restoreBtn = screen.getByRole("button", {
      name: "Show syntax tip for this diagram type",
    });
    await act(async () => {
      fireEvent.click(restoreBtn);
    });

    expect(onResetSyntaxHints).toHaveBeenCalledTimes(1);
  });

  it("re-shows the hint and hides the restore button when hintResetToken is incremented", async () => {
    const onResetSyntaxHints = vi.fn(() => {
      clearAllDismissals();
    });

    const { rerender } = render(
      createElement(ApplyTab, { ...BASE_PROPS, hintResetToken: 0, onResetSyntaxHints })
    );

    // Dismiss the hint
    const dismissBtn = screen.getByRole("button", { name: "Dismiss flowchart syntax tip" });
    await act(async () => {
      fireEvent.click(dismissBtn);
    });
    expect(hintPanelVisible()).toBe(false);
    expect(restoreButtonVisible()).toBe(true);

    // Click restore — onResetSyntaxHints clears localStorage in this mock
    const restoreBtn = screen.getByRole("button", {
      name: "Show syntax tip for this diagram type",
    });
    await act(async () => {
      fireEvent.click(restoreBtn);
    });

    // Simulate App.tsx responding by bumping hintResetToken
    act(() => {
      rerender(createElement(ApplyTab, { ...BASE_PROPS, hintResetToken: 1, onResetSyntaxHints }));
    });

    expect(hintPanelVisible()).toBe(true);
    expect(restoreButtonVisible()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 3. Family switching while the restore button is visible
// ---------------------------------------------------------------------------

describe("ApplyTab hint — family switching while restore button is visible", () => {
  it("hides the restore button when switching to a family with no hint", async () => {
    const { rerender } = render(createElement(ApplyTab, BASE_PROPS));

    const dismissBtn = screen.getByRole("button", { name: "Dismiss flowchart syntax tip" });
    await act(async () => {
      fireEvent.click(dismissBtn);
    });
    expect(restoreButtonVisible()).toBe(true);

    // Switch to code the detector can't classify — "unknown" has no hint entry
    act(() => {
      rerender(createElement(ApplyTab, { ...BASE_PROPS, inputCode: UNKNOWN }));
    });

    expect(restoreButtonVisible()).toBe(false);
  });

  it("shows the restore button immediately when switching to a previously dismissed family", async () => {
    // Pre-dismiss the sequenceDiagram family before rendering so localStorage
    // already has the dismissal flag when the family switch triggers the useEffect.
    dismissHint("sequenceDiagram");

    const { rerender } = render(createElement(ApplyTab, BASE_PROPS));

    const dismissBtn = screen.getByRole("button", { name: "Dismiss flowchart syntax tip" });
    await act(async () => {
      fireEvent.click(dismissBtn);
    });

    // Switch to sequence — it was pre-dismissed, so the restore button must appear
    await act(async () => {
      rerender(createElement(ApplyTab, { ...BASE_PROPS, inputCode: SEQUENCE }));
    });

    expect(restoreButtonVisible()).toBe(true);
  });

  it("shows the hint panel and hides the restore button when switching to an undismissed family", async () => {
    const { rerender } = render(createElement(ApplyTab, BASE_PROPS));

    const dismissBtn = screen.getByRole("button", { name: "Dismiss flowchart syntax tip" });
    await act(async () => {
      fireEvent.click(dismissBtn);
    });
    expect(restoreButtonVisible()).toBe(true);

    // Switch to sequence — never dismissed, so the hint panel should be visible
    // and the restore button should be gone.
    await act(async () => {
      rerender(createElement(ApplyTab, { ...BASE_PROPS, inputCode: SEQUENCE }));
    });

    expect(restoreButtonVisible()).toBe(false);
    expect(screen.queryByRole("note", { name: "Syntax tips for sequenceDiagram" })).not.toBeNull();
  });
});
