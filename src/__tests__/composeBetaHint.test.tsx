// @vitest-environment happy-dom

/**
 * Tests for the beta-preview hint bar in ComposeTab (Task #320).
 *
 * The "N styles not applied" beta hint bar appears when the selected preview
 * diagram has a Beta or Experimental badge. It contains a "See support
 * details →" button that calls onNavigateToParityMatrix to switch to the
 * Reference tab and force-open the Renderer Parity Matrix section.
 *
 * isBetaPreview is derived from the selected EXAMPLE_CATALOG entry's badge.
 * selectedSampleId is initialized from localStorage key
 * "mtb.compose.previewSampleId" on mount, so presetting that key controls
 * which entry is active without touching component internals.
 */

import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

vi.mock("mermaid", () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn().mockResolvedValue({ svg: "<svg><g></g></svg>", bindFunctions: undefined }),
  },
}));

import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { createElement } from "react";
import { ComposeTab } from "@/pages/tabs/ComposeTab";
import { BRAND_PALETTES } from "@/lib/palettes";
import { DEFAULT_TYPOGRAPHY } from "@/lib/typography";

const PREVIEW_SAMPLE_KEY = "mtb.compose.previewSampleId";

const palette = BRAND_PALETTES[0];

type ImportDiagnostics = {
  missingKeys: string[];
  unknownKeys: string[];
  invalidValues: Array<{ key: string; value: string }>;
  warnValues: Array<{ key: string; value: string }>;
};

function makeBaseProps(overrides: Record<string, unknown> = {}) {
  const noop = vi.fn();
  return {
    selectedPalette: palette,
    selectedPaletteId: palette.id,
    onSelectPalette: noop,
    customColors: {},
    onColorChange: noop,
    onResetPalette: noop,
    hasCustomizations: false,
    includeMetaComments: true,
    onIncludeMetaCommentsChange: noop,
    includeBadge: true,
    onIncludeBadgeChange: noop,
    customThemeName: "",
    onCustomThemeNameChange: noop,
    effectiveThemeName: palette.name,
    userPalettes: [],
    onSavePalette: noop,
    onImportPalette: noop,
    onDeleteUserPalette: noop,
    onShowToast: noop,
    look: "classic" as const,
    onLookChange: noop,
    fontSize: "",
    onFontSizeChange: noop,
    typography: DEFAULT_TYPOGRAPHY,
    onTypographyChange: noop,
    rendererTarget: "",
    onRendererTargetChange: noop,
    onUseExtractedTheme: noop,
    onSwitchTab: noop,
    onNavigateToParityMatrix: noop,
    importDiagnostics: null as ImportDiagnostics | null,
    onImportDiagnosticsChange: noop,
    ...overrides,
  };
}

beforeEach(() => {
  localStorage.removeItem(PREVIEW_SAMPLE_KEY);
});

afterEach(() => {
  cleanup();
  localStorage.removeItem(PREVIEW_SAMPLE_KEY);
});

describe("ComposeTab — beta hint bar 'See support details →' button", () => {
  it("shows the button when the selected preview diagram is a Beta family", () => {
    // "sankey-effort-to-output" has badge: "Beta" → isBetaPreview=true
    localStorage.setItem(PREVIEW_SAMPLE_KEY, "sankey-effort-to-output");
    render(createElement(ComposeTab, makeBaseProps()));

    expect(screen.getByRole("button", { name: "See support details →" })).toBeDefined();
  });

  it("clicking the button calls onNavigateToParityMatrix exactly once", () => {
    localStorage.setItem(PREVIEW_SAMPLE_KEY, "sankey-effort-to-output");
    const spy = vi.fn();
    render(createElement(ComposeTab, makeBaseProps({ onNavigateToParityMatrix: spy })));

    fireEvent.click(screen.getByRole("button", { name: "See support details →" }));

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("does NOT show the button when the selected preview diagram is not a Beta/Experimental family", () => {
    // "flowchart-basic" has no badge → isBetaPreview=false
    localStorage.setItem(PREVIEW_SAMPLE_KEY, "flowchart-basic");
    render(createElement(ComposeTab, makeBaseProps()));

    expect(screen.queryByRole("button", { name: "See support details →" })).toBeNull();
  });

  it("does NOT show the button when no sample id is stored (defaults to flowchart-basic)", () => {
    // No localStorage entry → default "flowchart-basic" → no beta badge
    render(createElement(ComposeTab, makeBaseProps()));

    expect(screen.queryByRole("button", { name: "See support details →" })).toBeNull();
  });
});
