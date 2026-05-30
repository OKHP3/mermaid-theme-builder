// @vitest-environment happy-dom

/**
 * Tests for Examples tab selection persistence (Task #129).
 *
 * Behaviors covered:
 *   1. A valid initialSelectedId prop is used as the active selection.
 *   2. A stale/unrecognized initialSelectedId falls back to the first example.
 *   3. Clicking an example fires onExampleSelect with the correct ID.
 *   4. A late-arriving initialSelectedId (async hydration) updates the selection
 *      via the useEffect sync path in ExamplesTab.
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup, act } from "@testing-library/react";
import { fireEvent } from "@testing-library/dom";
import { createElement } from "react";
import { ExamplesTab } from "@/pages/tabs/ExamplesTab";
import { BRAND_PALETTES } from "@/lib/palettes";
import { SHOWCASE_META } from "@/data/examples";

// ---------------------------------------------------------------------------
// Mocks — prevent Mermaid rendering and heavy sub-components in unit tests.
// ---------------------------------------------------------------------------

vi.mock("@/components/MermaidPreview", () => ({
  MermaidPreview: ({ code }: { code: string }) =>
    createElement("div", { "data-testid": "mermaid-preview", "data-code": code }),
}));

vi.mock("@/components/MermaidReferral", () => ({
  MermaidReferral: () => null,
}));

vi.mock("@/components/DiagramInventory", () => ({
  DiagramInventory: () => createElement("div", { "data-testid": "diagram-inventory" }),
}));

vi.mock("@/components/PaletteSelectorBar", () => ({
  PaletteSelectorBar: () => null,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DEFAULT_PALETTE = BRAND_PALETTES[0];

// The first example built by ExamplesTab.buildExampleList() is the first brand
// palette's flowchart: brand-<id>-flow.
const FIRST_EXAMPLE_LABEL = `${BRAND_PALETTES[0].name} \u2014 Flowchart`;

// A non-default example from the second brand palette.
const NON_DEFAULT_EXAMPLE_ID = `brand-${BRAND_PALETTES[1].id}-flow`;
const NON_DEFAULT_EXAMPLE_LABEL = `${BRAND_PALETTES[1].name} \u2014 Flowchart`;

function noop() {}

const COMMON_PALETTE_PROPS = {
  selectedPaletteId: DEFAULT_PALETTE.id,
  allPalettes: BRAND_PALETTES,
  customColors: {} as Record<string, import("@/lib/palettes").ThemeColor[]>,
  onSelectPalette: noop,
};

/**
 * Returns the text content of the currently-selected sidebar button.
 * The selected button is identified by the `bg-primary/10` Tailwind highlight class.
 */
function getSelectedLabel(container: HTMLElement): string {
  const buttons = container.querySelectorAll<HTMLButtonElement>("button");
  for (const btn of buttons) {
    if (btn.className.includes("bg-primary/10")) {
      return btn.querySelector("span.flex-1")?.textContent?.trim() ?? "";
    }
  }
  return "";
}

/**
 * Finds a sidebar example button whose label span matches the given text.
 */
function findExampleButton(container: HTMLElement, labelText: string): HTMLButtonElement | null {
  const buttons = container.querySelectorAll<HTMLButtonElement>("button");
  for (const btn of buttons) {
    const labelSpan = btn.querySelector("span.flex-1");
    if (labelSpan?.textContent?.trim() === labelText) return btn;
  }
  return null;
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// 1. Valid initialSelectedId → that example becomes the active selection
// ---------------------------------------------------------------------------

describe("ExamplesTab — initialSelectedId hydration", () => {
  it("uses a valid initialSelectedId as the active example on first render", () => {
    const { container } = render(
      createElement(ExamplesTab, {
        ...COMMON_PALETTE_PROPS,
        selectedPalette: DEFAULT_PALETTE,
        onLoadExample: noop,
        initialSelectedId: NON_DEFAULT_EXAMPLE_ID,
        onExampleSelect: noop,
      })
    );

    expect(getSelectedLabel(container)).toBe(NON_DEFAULT_EXAMPLE_LABEL);
  });

  it("marks only the matching sidebar button as selected — others are unselected", () => {
    const { container } = render(
      createElement(ExamplesTab, {
        ...COMMON_PALETTE_PROPS,
        selectedPalette: DEFAULT_PALETTE,
        onLoadExample: noop,
        initialSelectedId: NON_DEFAULT_EXAMPLE_ID,
        onExampleSelect: noop,
      })
    );

    const selectedButtons = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button")
    ).filter((btn) => btn.className.includes("bg-primary/10"));

    expect(selectedButtons).toHaveLength(1);
    expect(selectedButtons[0].querySelector("span.flex-1")?.textContent?.trim()).toBe(
      NON_DEFAULT_EXAMPLE_LABEL
    );
  });
});

// ---------------------------------------------------------------------------
// 2. Stale/unrecognized ID → falls back to the first example
// ---------------------------------------------------------------------------

describe("ExamplesTab — stale ID fallback", () => {
  it("falls back to the first example when initialSelectedId is unrecognized", () => {
    const { container } = render(
      createElement(ExamplesTab, {
        ...COMMON_PALETTE_PROPS,
        selectedPalette: DEFAULT_PALETTE,
        onLoadExample: noop,
        initialSelectedId: "this-id-does-not-exist-in-the-catalog",
        onExampleSelect: noop,
      })
    );

    expect(getSelectedLabel(container)).toBe(FIRST_EXAMPLE_LABEL);
  });

  it("falls back to the first example when initialSelectedId is an empty string", () => {
    const { container } = render(
      createElement(ExamplesTab, {
        ...COMMON_PALETTE_PROPS,
        selectedPalette: DEFAULT_PALETTE,
        onLoadExample: noop,
        initialSelectedId: "",
        onExampleSelect: noop,
      })
    );

    expect(getSelectedLabel(container)).toBe(FIRST_EXAMPLE_LABEL);
  });

  it("falls back to the first example when initialSelectedId is undefined", () => {
    const { container } = render(
      createElement(ExamplesTab, {
        ...COMMON_PALETTE_PROPS,
        selectedPalette: DEFAULT_PALETTE,
        onLoadExample: noop,
        onExampleSelect: noop,
      })
    );

    expect(getSelectedLabel(container)).toBe(FIRST_EXAMPLE_LABEL);
  });
});

// ---------------------------------------------------------------------------
// 3. Clicking an example fires onExampleSelect with the correct ID
// ---------------------------------------------------------------------------

describe("ExamplesTab — onExampleSelect callback", () => {
  it("fires onExampleSelect with the clicked example's ID", () => {
    const onExampleSelect = vi.fn();

    const { container } = render(
      createElement(ExamplesTab, {
        ...COMMON_PALETTE_PROPS,
        selectedPalette: DEFAULT_PALETTE,
        onLoadExample: noop,
        onExampleSelect,
      })
    );

    const targetButton = findExampleButton(container, NON_DEFAULT_EXAMPLE_LABEL);
    expect(targetButton).toBeTruthy();
    fireEvent.click(targetButton!);

    expect(onExampleSelect).toHaveBeenCalledTimes(1);
    expect(onExampleSelect).toHaveBeenCalledWith(NON_DEFAULT_EXAMPLE_ID);
  });

  it("fires onExampleSelect with 'showcase' when the showcase example is clicked", () => {
    const onExampleSelect = vi.fn();

    const { container } = render(
      createElement(ExamplesTab, {
        ...COMMON_PALETTE_PROPS,
        selectedPalette: DEFAULT_PALETTE,
        onLoadExample: noop,
        onExampleSelect,
      })
    );

    const showcaseButton = findExampleButton(container, SHOWCASE_META.title);
    expect(showcaseButton).toBeTruthy();
    fireEvent.click(showcaseButton!);

    expect(onExampleSelect).toHaveBeenCalledTimes(1);
    expect(onExampleSelect).toHaveBeenCalledWith("showcase");
  });
});

// ---------------------------------------------------------------------------
// 4. Late-arriving initialSelectedId (async hydration) updates the selection
// ---------------------------------------------------------------------------

describe("ExamplesTab — late-hydration via useEffect", () => {
  it("updates the selection when initialSelectedId arrives after first render", () => {
    const { container, rerender } = render(
      createElement(ExamplesTab, {
        ...COMMON_PALETTE_PROPS,
        selectedPalette: DEFAULT_PALETTE,
        onLoadExample: noop,
        initialSelectedId: undefined,
        onExampleSelect: noop,
      })
    );

    // Initially falls back to the first example.
    expect(getSelectedLabel(container)).toBe(FIRST_EXAMPLE_LABEL);

    // Simulate the App.tsx useEffect delivering a hydrated ID after mount.
    act(() => {
      rerender(
        createElement(ExamplesTab, {
          ...COMMON_PALETTE_PROPS,
          selectedPalette: DEFAULT_PALETTE,
          onLoadExample: noop,
          initialSelectedId: NON_DEFAULT_EXAMPLE_ID,
          onExampleSelect: noop,
        })
      );
    });

    // The component's internal useEffect should have synced the selection.
    expect(getSelectedLabel(container)).toBe(NON_DEFAULT_EXAMPLE_LABEL);
  });

  it("ignores a late-arriving stale ID and keeps the current selection", () => {
    const { container, rerender } = render(
      createElement(ExamplesTab, {
        ...COMMON_PALETTE_PROPS,
        selectedPalette: DEFAULT_PALETTE,
        onLoadExample: noop,
        initialSelectedId: undefined,
        onExampleSelect: noop,
      })
    );

    act(() => {
      rerender(
        createElement(ExamplesTab, {
          ...COMMON_PALETTE_PROPS,
          selectedPalette: DEFAULT_PALETTE,
          onLoadExample: noop,
          initialSelectedId: "stale-nonexistent-id",
          onExampleSelect: noop,
        })
      );
    });

    // Stale ID must not override the current valid selection.
    expect(getSelectedLabel(container)).toBe(FIRST_EXAMPLE_LABEL);
  });
});
