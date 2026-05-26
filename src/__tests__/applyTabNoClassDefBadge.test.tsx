// @vitest-environment happy-dom

/**
 * Tests that the "No classDef" badge on the Prompt Scaffold copy button renders
 * when the detected diagram family does not support classDef (Task #219,
 * guarded by Task #277).
 *
 * Behaviors covered:
 *   1. A classDef-capable family (flowchart) — badge is absent.
 *   2. A non-capable family (gantt) — badge appears with the correct title text.
 *   3. The badge is associated with the Prompt Scaffold button, not a stray element.
 *   4. Another non-capable family (pie) also shows the badge (not family-specific).
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

import { render, screen, cleanup } from "@testing-library/react";
import { createElement } from "react";
import { ApplyTab } from "@/pages/tabs/ApplyTab";
import { BRAND_PALETTES } from "@/lib/palettes";
import { DEFAULT_TYPOGRAPHY } from "@/lib/typography";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/** A minimal flowchart — in CLASSDEF_CAPABLE_FAMILIES. */
const FLOWCHART = "flowchart TD\n  A[Start] --> B[End]";

/** A minimal gantt — NOT in CLASSDEF_CAPABLE_FAMILIES. */
const GANTT =
  "gantt\n  title Release\n  dateFormat YYYY-MM-DD\n  section Phase\n  Work : 2024-01-01, 7d";

/** A minimal pie — NOT in CLASSDEF_CAPABLE_FAMILIES. */
const PIE = 'pie title Pets\n  "Dogs" : 386\n  "Cats" : 85';

const NO_CLASSDEF_TITLE =
  "This diagram type only supports palette-level theming, not per-node color classes";

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
  previewMode: "original" as const,
  onPreviewModeChange: noop,
  hintResetToken: 0,
  onResetSyntaxHints: noop,
};

afterEach(cleanup);

// ---------------------------------------------------------------------------
// 1. classDef-capable family — badge absent
// ---------------------------------------------------------------------------

describe("ApplyTab Prompt Scaffold — No classDef badge — classDef-capable family", () => {
  it("does not render the 'No classDef' badge for a flowchart (classDef-capable)", () => {
    render(createElement(ApplyTab, { ...BASE_PROPS, inputCode: FLOWCHART }));
    // Download menu is closed, so only the copy-button badge location is in the DOM.
    expect(screen.queryByText("No classDef")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 2. Non-capable family — badge present with correct tooltip
// ---------------------------------------------------------------------------

describe("ApplyTab Prompt Scaffold — No classDef badge — non-capable family", () => {
  it("renders the 'No classDef' badge for a gantt diagram", () => {
    render(createElement(ApplyTab, { ...BASE_PROPS, inputCode: GANTT }));
    const badge = screen.getByText("No classDef");
    expect(badge).toBeTruthy();
  });

  it("badge has the correct title (tooltip) text for gantt", () => {
    render(createElement(ApplyTab, { ...BASE_PROPS, inputCode: GANTT }));
    const badge = screen.getByText("No classDef");
    expect(badge.getAttribute("title")).toBe(NO_CLASSDEF_TITLE);
  });

  it("badge is inside the Prompt Scaffold button area", () => {
    render(createElement(ApplyTab, { ...BASE_PROPS, inputCode: GANTT }));
    const badge = screen.getByText("No classDef");
    // The badge lives inside a <button> that also contains "Prompt Scaffold".
    const btn = badge.closest("button");
    expect(btn).toBeTruthy();
    expect(btn!.textContent).toContain("Prompt Scaffold");
  });

  it("also renders the badge for a pie diagram (another non-capable family)", () => {
    render(createElement(ApplyTab, { ...BASE_PROPS, inputCode: PIE }));
    const badge = screen.getByText("No classDef");
    expect(badge).toBeTruthy();
    expect(badge.getAttribute("title")).toBe(NO_CLASSDEF_TITLE);
  });
});
