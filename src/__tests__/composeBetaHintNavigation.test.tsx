// @vitest-environment happy-dom

/**
 * App-level integration test for the "See support details →" navigation
 * in the ComposeTab beta hint bar (Task #320).
 *
 * The unit tests in composeBetaHint.test.tsx verify ComposeTab in isolation.
 * This file tests the full chain that can break at the App.tsx level:
 *
 *   ComposeTab.onNavigateToParityMatrix
 *     → setActiveTab("reference")   — switches the visible tab
 *     → setOpenParityMatrix(true)   — force-opens the RPM section
 *
 * A minimal AppWrapper component reproduces the relevant slice of App.tsx
 * state (activeTab + openParityMatrix) and renders ComposeTab and
 * ReferenceTab together. The test then clicks the button and asserts:
 *   1. The Reference tab becomes active (ComposeTab button is gone).
 *   2. The Renderer Parity Matrix <details> element is open.
 *
 * ReferenceTab is rendered with supportsClassDef=false so its own auto-open
 * effect does NOT open the RPM details — only the openParityMatrix prop can.
 */

import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

vi.mock("mermaid", () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn().mockResolvedValue({ svg: "<svg><g></g></svg>", bindFunctions: undefined }),
  },
}));

vi.mock("@/components/PaletteSelectorBar", () => ({
  PaletteSelectorBar: () => null,
}));

vi.mock("@/components/DiagramInventory", () => ({
  DiagramInventory: () => null,
}));

vi.mock("@/components/ClassBrowser", () => ({
  ClassBrowser: () => null,
  HL: {},
  highlightPropsSegment: () => null,
  highlightClassDefLine: () => null,
  highlightClassDefBlock: () => null,
}));

import { useState, createElement, type ReactElement } from "react";
import { render, screen, cleanup, fireEvent, act } from "@testing-library/react";
import { ComposeTab } from "@/pages/tabs/ComposeTab";
import { ReferenceTab } from "@/pages/tabs/ReferenceTab";
import { BRAND_PALETTES } from "@/lib/palettes";
import { DEFAULT_TYPOGRAPHY } from "@/lib/typography";
import type { ThemeColor } from "@/lib/palettes";

const PREVIEW_SAMPLE_KEY = "mtb.compose.previewSampleId";
const palette = BRAND_PALETTES[0];

type ImportDiagnostics = {
  missingKeys: string[];
  unknownKeys: string[];
  invalidValues: Array<{ key: string; value: string }>;
  warnValues: Array<{ key: string; value: string }>;
};

function makeComposeProps(overrides: Record<string, unknown> = {}) {
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

const REFERENCE_BASE_PROPS = {
  selectedPalette: palette,
  selectedPaletteId: palette.id,
  allPalettes: [palette],
  customColors: {} as Record<string, ThemeColor[]>,
  onSelectPalette: vi.fn(),
  // supportsClassDef=false so the RPM details is NOT auto-opened by that effect.
  // Only the openParityMatrix prop should open it — making the assertion precise.
  supportsClassDef: false,
  inputCode: "",
};

/**
 * Minimal wrapper reproducing the App.tsx state slice relevant to this feature:
 *   - activeTab: "compose" | "reference"
 *   - openParityMatrix: boolean
 *   - handleNavigateToParityMatrix: sets both
 */
function AppWrapper({ onNavigateToParityMatrix }: { onNavigateToParityMatrix?: () => void }): ReactElement {
  const [activeTab, setActiveTab] = useState<"compose" | "reference">("compose");
  const [openParityMatrix, setOpenParityMatrix] = useState(false);

  const handleNavigate = () => {
    setActiveTab("reference");
    setOpenParityMatrix(true);
    onNavigateToParityMatrix?.();
  };

  return createElement(
    "div",
    null,
    activeTab === "compose" &&
      createElement(ComposeTab, makeComposeProps({ onNavigateToParityMatrix: handleNavigate })),
    activeTab === "reference" &&
      createElement(ReferenceTab, {
        ...REFERENCE_BASE_PROPS,
        openParityMatrix,
        onParityMatrixOpened: () => setOpenParityMatrix(false),
      })
  );
}

beforeEach(() => {
  localStorage.removeItem(PREVIEW_SAMPLE_KEY);
});

afterEach(() => {
  cleanup();
  localStorage.removeItem(PREVIEW_SAMPLE_KEY);
});

describe("ComposeTab → App.tsx → ReferenceTab navigation integration", () => {
  it("clicking 'See support details →' switches the visible tab from Compose to Reference", async () => {
    localStorage.setItem(PREVIEW_SAMPLE_KEY, "sankey-effort-to-output");
    render(createElement(AppWrapper, {}));

    const btn = screen.getByRole("button", { name: "See support details →" });
    await act(async () => { fireEvent.click(btn); });

    // ComposeTab is unmounted — the button is gone
    expect(screen.queryByRole("button", { name: "See support details →" })).toBeNull();
    // ReferenceTab is now mounted
    expect(screen.getByText("Renderer Parity Matrix")).toBeDefined();
  });

  it("the Renderer Parity Matrix details element is open after navigation", async () => {
    localStorage.setItem(PREVIEW_SAMPLE_KEY, "sankey-effort-to-output");
    render(createElement(AppWrapper, {}));

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "See support details →" }));
    });

    const label = screen.getByText("Renderer Parity Matrix");
    const details = label.closest("details") as HTMLDetailsElement;
    expect(details.open).toBe(true);
  });

  it("the navigation callback is invoked once when the button is clicked", async () => {
    localStorage.setItem(PREVIEW_SAMPLE_KEY, "sankey-effort-to-output");
    const spy = vi.fn();
    render(createElement(AppWrapper, { onNavigateToParityMatrix: spy }));

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "See support details →" }));
    });

    expect(spy).toHaveBeenCalledTimes(1);
  });
});
