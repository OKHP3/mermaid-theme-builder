// @vitest-environment happy-dom

/**
 * Tests for the Theme Preview diagram picker (ComposeTab.tsx lines 244–271).
 *
 * Behaviors covered:
 *   1. Default selection resolves to EXAMPLE_CATALOG[0].id ("compose-instructions") when localStorage is empty.
 *   2. Changing the selection writes to localStorage key "mtb.compose.previewSampleId".
 *   3. An unknown stored id falls back gracefully to EXAMPLE_CATALOG[0] without throwing.
 *   4. The beta render-confidence hint appears/disappears based on the selected entry's badge.
 *
 * Strategy: render the real ComposeTab with heavily-mocked children so the
 * picker state, localStorage wiring, and isBetaPreview hint are exercised
 * through actual component paths rather than duplicated helper logic.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { fireEvent } from "@testing-library/dom";
import { createElement } from "react";
import { ComposeTab } from "@/pages/tabs/ComposeTab";
import { BRAND_PALETTES } from "@/lib/palettes";
import { DEFAULT_TYPOGRAPHY } from "@/lib/typography";
import { EXAMPLE_CATALOG } from "@/data/example-library";
import { generateThemedCode } from "@/lib/theme-engine";
import type { AppTab } from "@/App";
import type { ThemeColor } from "@/lib/palettes";

// ---------------------------------------------------------------------------
// Mocks — silence heavy child components that don't affect picker behavior
// ---------------------------------------------------------------------------

vi.mock("@/components/MermaidPreview", () => ({
  MermaidPreview: ({ code }: { code: string }) =>
    createElement("div", { "data-testid": "mermaid-preview", "data-code": code }),
}));

vi.mock("@/components/PromptScaffoldModal", () => ({
  PromptScaffoldModal: () => null,
}));

vi.mock("@/components/PaletteSelectorBar", () => ({
  PaletteSelectorBar: () => null,
}));

vi.mock("@/components/ColorSwatch", () => ({
  ColorSwatch: () => null,
}));

vi.mock("@/pages/tabs/ExtractTab", () => ({
  ExtractTab: () => null,
}));

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const LS_KEY = "mtb.compose.previewSampleId";
const SELECTED_PALETTE = BRAND_PALETTES[0];

function noop() {}

const BASE_PROPS = {
  selectedPalette: SELECTED_PALETTE,
  selectedPaletteId: SELECTED_PALETTE.id,
  onSelectPalette: noop,
  customColors: {} as Record<string, ThemeColor[]>,
  onColorChange: noop,
  onResetPalette: noop,
  hasCustomizations: false,
  includeMetaComments: false,
  onIncludeMetaCommentsChange: noop,
  includeBadge: false,
  onIncludeBadgeChange: noop,
  customThemeName: "",
  onCustomThemeNameChange: noop,
  effectiveThemeName: SELECTED_PALETTE.name,
  userPalettes: [],
  onSavePalette: noop,
  onImportPalette: noop,
  onDeleteUserPalette: noop,
  onShowToast: noop,
  look: "classic" as const,
  onLookChange: noop,
  fontSize: "16px",
  onFontSizeChange: noop,
  typography: DEFAULT_TYPOGRAPHY,
  onTypographyChange: noop,
  rendererTarget: "mermaid.js",
  onRendererTargetChange: noop,
  onUseExtractedTheme: noop,
  onSwitchTab: noop as (tab: AppTab) => void,
  onNavigateToParityMatrix: noop,
  importDiagnostics: null,
  onImportDiagnosticsChange: noop,
};

function renderTab() {
  return render(createElement(ComposeTab, BASE_PROPS));
}

function getPickerSelect(container: HTMLElement): HTMLSelectElement {
  const el = container.querySelector<HTMLSelectElement>('[aria-label="Preview diagram"]');
  if (!el) throw new Error("Preview diagram select not found in rendered output");
  return el;
}

function getMermaidPreview(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>("[data-testid='mermaid-preview']");
  if (!el) throw new Error("Mocked mermaid-preview not found");
  return el;
}

beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// 1. Default selection — empty localStorage → EXAMPLE_CATALOG[0] ("compose-instructions")
// ---------------------------------------------------------------------------

describe("previewPicker — default selection", () => {
  it("the preview select defaults to EXAMPLE_CATALOG[0].id when localStorage is empty", () => {
    const { container } = renderTab();
    expect(getPickerSelect(container).value).toBe(EXAMPLE_CATALOG[0].id);
  });

  it("the default id matches EXAMPLE_CATALOG[0].id", () => {
    const { container } = renderTab();
    expect(getPickerSelect(container).value).toBe(EXAMPLE_CATALOG[0].id);
  });

  it("the mocked preview receives the themed code for the default entry on initial render", () => {
    const { container } = renderTab();
    const preview = getMermaidPreview(container);
    // The code attr is non-empty and begins with the %%{init expected from theming.
    expect(preview.getAttribute("data-code")).toContain("%%{init:");
  });
});

// ---------------------------------------------------------------------------
// 2. localStorage write — selection change persists to the correct key
// ---------------------------------------------------------------------------

describe("previewPicker — localStorage write on selection change", () => {
  it("writes the selected id to the correct key after a change event", () => {
    const { container } = renderTab();
    fireEvent.change(getPickerSelect(container), {
      target: { value: "sankey-effort-to-output" },
    });
    expect(localStorage.getItem(LS_KEY)).toBe("sankey-effort-to-output");
  });

  it("uses exactly the key 'mtb.compose.previewSampleId' — not a shortened variant", () => {
    const { container } = renderTab();
    fireEvent.change(getPickerSelect(container), {
      target: { value: "flowchart-basic" },
    });
    expect(localStorage.getItem(LS_KEY)).toBe("flowchart-basic");
    expect(localStorage.getItem("previewSampleId")).toBeNull();
    expect(localStorage.getItem("compose.previewSampleId")).toBeNull();
  });

  it("overwrites the previous stored value on a second change", () => {
    const { container } = renderTab();
    const select = getPickerSelect(container);
    fireEvent.change(select, { target: { value: "sankey-effort-to-output" } });
    fireEvent.change(select, { target: { value: "flowchart-basic" } });
    expect(localStorage.getItem(LS_KEY)).toBe("flowchart-basic");
  });

  it("localStorage is empty before any change (confirming write only on change)", () => {
    renderTab(); // mount without interacting
    expect(localStorage.getItem(LS_KEY)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 3. Unknown stored id fallback — EXAMPLE_CATALOG[0] used, no throw
// ---------------------------------------------------------------------------

describe("previewPicker — unknown stored id fallback", () => {
  it("renders without throwing when localStorage holds an unrecognized id", () => {
    localStorage.setItem(LS_KEY, "completely-unknown-diagram-id-xyz");
    expect(() => renderTab()).not.toThrow();
  });

  it("the mocked preview receives non-empty themed code from the EXAMPLE_CATALOG[0] fallback", () => {
    localStorage.setItem(LS_KEY, "completely-unknown-diagram-id-xyz");
    const { container } = renderTab();
    const preview = getMermaidPreview(container);
    // sampleEntry falls back to EXAMPLE_CATALOG[0] via the ?? operator.
    // generateThemedCode always prepends %%{init:...} so the code is non-empty and themed.
    const code = preview.getAttribute("data-code") ?? "";
    expect(code.length).toBeGreaterThan(0);
    expect(code).toContain("%%{init:");
    // Confirm the fallback used flowchart content from EXAMPLE_CATALOG[0], not an error string.
    expect(code).toContain("flowchart");
  });

  it("the select snaps to the first available option when the stale id has no matching <option>", () => {
    localStorage.setItem(LS_KEY, "completely-unknown-diagram-id-xyz");
    const { container } = renderTab();
    // Browser behavior: a controlled <select> whose value prop doesn't match any
    // <option> renders as if the first option is selected. happy-dom matches this.
    // So select.value is the first catalog entry, not the unknown string.
    const select = getPickerSelect(container);
    expect(select.value).toBe(EXAMPLE_CATALOG[0].id);
  });
});

// ---------------------------------------------------------------------------
// 5. Option label suffixes — Beta/Experimental badges shown before picking
// ---------------------------------------------------------------------------

describe("previewPicker — option label suffixes", () => {
  it("a 'Beta' entry shows '· Beta' appended to its label in the picker", () => {
    const { container } = renderTab();
    const opt = Array.from(getPickerSelect(container).options).find(
      (o) => o.value === "sankey-effort-to-output"
    );
    expect(opt).toBeDefined();
    expect(opt!.text).toBe("Sankey · Beta");
  });

  it("a 'Canonical · Beta' entry shows only '· Beta' suffix, not the full badge text", () => {
    const { container } = renderTab();
    const opt = Array.from(getPickerSelect(container).options).find(
      (o) => o.value === "sankey-mermaid-basic"
    );
    expect(opt).toBeDefined();
    expect(opt!.text).toBe("Sankey — energy flow · Beta");
    expect(opt!.text).not.toContain("Canonical");
  });

  it("a 'Canonical'-only entry has no badge suffix", () => {
    const { container } = renderTab();
    const opt = Array.from(getPickerSelect(container).options).find(
      (o) => o.value === "flowchart-mermaid-basic"
    );
    expect(opt).toBeDefined();
    expect(opt!.text).toBe("Flowchart — basic");
    expect(opt!.text).not.toContain("· Beta");
    expect(opt!.text).not.toContain("· Experimental");
  });

  it("an entry with no badge field has no suffix", () => {
    const { container } = renderTab();
    const opt = Array.from(getPickerSelect(container).options).find(
      (o) => o.value === "flowchart-basic"
    );
    expect(opt).toBeDefined();
    expect(opt!.text).toBe("Flowchart");
    expect(opt!.text).not.toContain("· Beta");
    expect(opt!.text).not.toContain("· Experimental");
  });

  it("all options with beta/experimental badges carry the correct suffix", () => {
    const { container } = renderTab();
    const options = Array.from(getPickerSelect(container).options);
    // Every option whose text ends with "· Beta" or "· Experimental" must match
    // an EXAMPLE_CATALOG entry that carries a Beta or Experimental badge.
    for (const opt of options) {
      if (opt.text.endsWith("· Beta")) {
        const entry = EXAMPLE_CATALOG.find((e) => e.id === opt.value);
        expect(entry?.badge).toMatch(/Beta/);
      }
      if (opt.text.endsWith("· Experimental")) {
        const entry = EXAMPLE_CATALOG.find((e) => e.id === opt.value);
        expect(entry?.badge).toContain("Experimental");
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 4. Beta render-confidence hint — rendered via real ComposeTab
// ---------------------------------------------------------------------------

describe("previewPicker — beta render-confidence hint (rendered)", () => {
  it("no role='note' hint when the default entry (compose-instructions) is selected", () => {
    const { container } = renderTab();
    expect(container.querySelector('[role="note"]')).toBeNull();
  });

  it("hint appears after switching to a beta diagram (sankey-effort-to-output)", () => {
    const { container } = renderTab();
    fireEvent.change(getPickerSelect(container), {
      target: { value: "sankey-effort-to-output" },
    });
    const hint = container.querySelector('[role="note"]');
    expect(hint).not.toBeNull();
    expect(hint!.textContent).toContain("Beta");
  });

  it("hint text mentions limited theme variable support", () => {
    const { container } = renderTab();
    fireEvent.change(getPickerSelect(container), {
      target: { value: "sankey-effort-to-output" },
    });
    expect(container.querySelector('[role="note"]')!.textContent).toContain("limited");
  });

  it("hint disappears when switching back to a non-beta diagram", () => {
    const { container } = renderTab();
    const select = getPickerSelect(container);
    fireEvent.change(select, { target: { value: "sankey-effort-to-output" } });
    fireEvent.change(select, { target: { value: "flowchart-basic" } });
    expect(container.querySelector('[role="note"]')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 6. Beta hint bar details — label text, experimental variant, action button
// ---------------------------------------------------------------------------

describe("previewPicker — beta hint bar details", () => {
  it("hint shows 'Beta diagram type' for a Beta-badge entry", () => {
    const { container } = renderTab();
    fireEvent.change(getPickerSelect(container), {
      target: { value: "sankey-effort-to-output" },
    });
    const hint = container.querySelector('[role="note"]');
    expect(hint!.textContent).toContain("Beta diagram type");
    expect(hint!.textContent).not.toContain("Experimental diagram type");
  });

  it("'See support details' action button is present inside the hint bar", () => {
    const { container } = renderTab();
    fireEvent.change(getPickerSelect(container), {
      target: { value: "sankey-effort-to-output" },
    });
    const btn = container.querySelector<HTMLButtonElement>('[role="note"] button');
    expect(btn).not.toBeNull();
    expect(btn!.textContent).toContain("See support details");
  });

  it("'See support details' button is absent when no hint is shown", () => {
    // Default selection is compose-instructions — no beta hint, so no button.
    const { container } = renderTab();
    expect(container.querySelector('[role="note"]')).toBeNull();
    const detailsBtns = Array.from(container.querySelectorAll("button")).filter((b) =>
      b.textContent?.includes("See support details")
    );
    expect(detailsBtns).toHaveLength(0);
  });

  it("clicking 'See support details →' calls onNavigateToParityMatrix exactly once", () => {
    const spy = vi.fn();
    const { container } = render(
      createElement(ComposeTab, { ...BASE_PROPS, onNavigateToParityMatrix: spy })
    );
    fireEvent.change(getPickerSelect(container), {
      target: { value: "sankey-effort-to-output" },
    });
    const btn = container.querySelector<HTMLButtonElement>('[role="note"] button');
    expect(btn).not.toBeNull();
    fireEvent.click(btn!);
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
