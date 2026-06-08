// @vitest-environment happy-dom

/**
 * Integration tests for the "See support details →" navigation in the
 * ComposeTab beta hint bar (Task #320).
 *
 * Two levels of integration are tested here:
 *
 * 1. AppWrapper (custom minimal harness) — mirrors the relevant slice of
 *    App.tsx state (activeTab + openParityMatrix + handleNavigateToParityMatrix)
 *    and renders ComposeTab + ReferenceTab together. Verifies the tab switch
 *    and RPM open state precisely (supportsClassDef=false prevents auto-open).
 *
 * 2. AppShell (real App.tsx component) — renders the actual top-level shell
 *    so that the real App.tsx wiring is exercised. Verifies the full chain:
 *    - onNavigateToParityMatrix is correctly passed to ComposeTab in App.tsx
 *    - clicking the button switches the active tab to Reference
 *    - the Renderer Parity Matrix section is present after navigation
 *
 * Mocks:  mermaid, ApplyTab, ExamplesTab, MermaidPreview (ComposeTab preview),
 *         AppIcon, PaletteSelectorBar, DiagramInventory, ClassBrowser.
 *         ComposeTab and ReferenceTab are NOT mocked.
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

vi.mock("@/components/MermaidPreview", () => ({
  MermaidPreview: () => null,
}));

vi.mock("@/pages/tabs/ApplyTab", () => ({
  ApplyTab: () => null,
}));

vi.mock("@/pages/tabs/ExamplesTab", () => ({
  ExamplesTab: () => null,
}));

vi.mock("@/components/AppIcon", () => ({
  AppIcon: () => null,
}));

import { useState, createElement, type ReactElement } from "react";
import { render, screen, cleanup, fireEvent, act } from "@testing-library/react";
import { AppShell } from "@/App";
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
 *
 * supportsClassDef=false ensures the RPM details is only opened by
 * openParityMatrix, not the auto-open effect, keeping assertions precise.
 */
function AppWrapper({
  onNavigateToParityMatrix,
}: {
  onNavigateToParityMatrix?: () => void;
}): ReactElement {
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

// ---------------------------------------------------------------------------
// 1. AppWrapper — minimal harness (precise supportsClassDef=false isolation)
// ---------------------------------------------------------------------------

describe("ComposeTab → App.tsx → ReferenceTab navigation integration (AppWrapper)", () => {
  it("clicking 'See support details →' switches the visible tab from Compose to Reference", async () => {
    localStorage.setItem(PREVIEW_SAMPLE_KEY, "sankey-effort-to-output");
    render(createElement(AppWrapper, {}));

    const btn = screen.getByRole("button", { name: "See support details →" });
    await act(async () => {
      fireEvent.click(btn);
    });

    expect(screen.queryByRole("button", { name: "See support details →" })).toBeNull();
    expect(screen.getByText("Renderer Parity Matrix")).toBeDefined();
  });

  it("the Renderer Parity Matrix details element is open after navigation", async () => {
    localStorage.setItem(PREVIEW_SAMPLE_KEY, "sankey-effort-to-output");
    render(createElement(AppWrapper, {}));

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "See support details →" }));
    });

    const details = screen
      .getByText("Renderer Parity Matrix")
      .closest("details") as HTMLDetailsElement;
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

// ---------------------------------------------------------------------------
// 2. AppShell — real App.tsx wiring (catches "forgot to pass the prop" bugs)
// ---------------------------------------------------------------------------

describe("AppShell integration — full wiring via real App.tsx", () => {
  it("clicking 'See support details →' switches AppShell to the Reference tab", async () => {
    localStorage.setItem(PREVIEW_SAMPLE_KEY, "sankey-effort-to-output");
    render(createElement(AppShell, {}));

    // AppShell starts on Apply. AppShell renders two navbars (desktop + mobile),
    // each containing duplicate tab buttons — pick the first Compose tab.
    await act(async () => {
      fireEvent.click(screen.getAllByRole("tab", { name: /Compose/i })[0]);
    });

    const btn = screen.getByRole("button", { name: "See support details →" });
    await act(async () => {
      fireEvent.click(btn);
    });

    // Reference tab is now active — Renderer Parity Matrix heading is rendered.
    expect(screen.getByText("Renderer Parity Matrix")).toBeDefined();
    // The Compose beta hint button is gone (ComposeTab unmounted).
    expect(screen.queryByRole("button", { name: "See support details →" })).toBeNull();
  });

  it("Renderer Parity Matrix is visible in AppShell after navigation", async () => {
    localStorage.setItem(PREVIEW_SAMPLE_KEY, "sankey-effort-to-output");
    render(createElement(AppShell, {}));

    await act(async () => {
      fireEvent.click(screen.getAllByRole("tab", { name: /Compose/i })[0]);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "See support details →" }));
    });

    // The Renderer Parity Matrix section heading is present in the DOM.
    expect(screen.getByText("Renderer Parity Matrix")).toBeDefined();
  });
});
