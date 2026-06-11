// @vitest-environment happy-dom

/**
 * Automated tests for Reference tab accordion behavior.
 *
 * The Reference tab uses an exclusive accordion: all sections start collapsed
 * on load, and opening one section closes any previously open section.
 * supportsClassDef no longer drives the open/closed state of sections.
 *
 * Also covers (regression guard):
 *   - RPM inactive badge: visible when section is collapsed + supportsClassDef=false,
 *     hidden when the section is open
 *   - Class Library inactive badge: same rule as RPM
 *   - Both badges re-appear when the exclusive accordion closes a section to
 *     make room for another section opening
 *
 * Strategy
 * --------
 * The accordion is implemented via native <details> elements with onToggle
 * React handlers. @testing-library/react's render() and rerender() both wrap
 * in act(), which flushes effects synchronously, so assertions can run
 * immediately after render.
 *
 * For "manual expand" tests the native toggle event is fired directly on the
 * <details> element (simulating browser behavior) to trigger React's onToggle
 * prop and flush the resulting state update.
 */

// vi.mock must be hoisted before any imports.
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

vi.mock("@/components/DiagramInventory", () => ({
  DiagramInventory: () => null,
}));

vi.mock("@/components/ClassBrowser", () => ({
  ClassBrowser: () => null,
}));

import { render, screen, cleanup, act } from "@testing-library/react";
import { fireEvent } from "@testing-library/dom";
import { createElement } from "react";
import { ReferenceTab } from "@/pages/tabs/ReferenceTab";
import { BRAND_PALETTES } from "@/lib/palettes";
import type { ThemeColor } from "@/lib/palettes";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const PALETTE = BRAND_PALETTES[0];

function noop() {}

const BASE_PROPS = {
  selectedPalette: PALETTE,
  selectedPaletteId: PALETTE.id,
  allPalettes: [PALETTE],
  customColors: {} as Record<string, ThemeColor[]>,
  onSelectPalette: noop,
  supportsClassDef: true,
  inputCode: "",
};

// ---------------------------------------------------------------------------
// DOM query helpers
// ---------------------------------------------------------------------------

/** Returns the <details> element that wraps the Renderer Parity Matrix. */
function getRpmDetails(): HTMLDetailsElement {
  const label = screen.getByText("Renderer Parity Matrix");
  const details = label.closest("details");
  if (!details) throw new Error("<details> for Renderer Parity Matrix not found in DOM");
  return details as HTMLDetailsElement;
}

/** Returns the <details> element that wraps the Class Library. */
function getClassLibraryDetails(): HTMLDetailsElement {
  const label = screen.getByText("Class Library");
  const details = label.closest("details");
  if (!details) throw new Error("<details> for Class Library not found in DOM");
  return details as HTMLDetailsElement;
}

/** Returns true if any "inactive for this diagram type" badge is inside the given details. */
function hasBadgeIn(detailsEl: HTMLDetailsElement): boolean {
  return screen
    .queryAllByText("inactive for this diagram type")
    .some((el) => el.closest("details") === detailsEl);
}

afterEach(cleanup);

// ---------------------------------------------------------------------------
// 1. supportsClassDef=false — both sections closed (same as any other state)
// ---------------------------------------------------------------------------

describe("Reference tab auto-collapse — supportsClassDef=false", () => {
  it("Renderer Parity Matrix is closed when supportsClassDef is false", () => {
    render(createElement(ReferenceTab, { ...BASE_PROPS, supportsClassDef: false }));
    expect(getRpmDetails().open).toBe(false);
  });

  it("Class Library is closed when supportsClassDef is false", () => {
    render(createElement(ReferenceTab, { ...BASE_PROPS, supportsClassDef: false }));
    expect(getClassLibraryDetails().open).toBe(false);
  });

  it("both sections are closed simultaneously when supportsClassDef is false", () => {
    render(createElement(ReferenceTab, { ...BASE_PROPS, supportsClassDef: false }));
    expect(getRpmDetails().open).toBe(false);
    expect(getClassLibraryDetails().open).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 2. All sections start collapsed regardless of supportsClassDef
// ---------------------------------------------------------------------------

describe("Reference tab accordion — all sections start collapsed", () => {
  it("Renderer Parity Matrix is closed on initial load when supportsClassDef is true", () => {
    render(createElement(ReferenceTab, { ...BASE_PROPS, supportsClassDef: true }));
    expect(getRpmDetails().open).toBe(false);
  });

  it("Class Library is closed on initial load when supportsClassDef is true", () => {
    render(createElement(ReferenceTab, { ...BASE_PROPS, supportsClassDef: true }));
    expect(getClassLibraryDetails().open).toBe(false);
  });

  it("both sections are closed simultaneously on initial load", () => {
    render(createElement(ReferenceTab, { ...BASE_PROPS, supportsClassDef: true }));
    expect(getRpmDetails().open).toBe(false);
    expect(getClassLibraryDetails().open).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 3. Accordion exclusive behavior — supportsClassDef does not drive open state
// ---------------------------------------------------------------------------

describe("Reference tab accordion — exclusive expand", () => {
  it("sections remain collapsed when supportsClassDef changes to false", () => {
    const { rerender } = render(
      createElement(ReferenceTab, { ...BASE_PROPS, supportsClassDef: true })
    );
    expect(getRpmDetails().open).toBe(false);
    expect(getClassLibraryDetails().open).toBe(false);

    rerender(createElement(ReferenceTab, { ...BASE_PROPS, supportsClassDef: false }));
    expect(getRpmDetails().open).toBe(false);
    expect(getClassLibraryDetails().open).toBe(false);
  });

  it("sections remain collapsed when supportsClassDef changes to true", () => {
    const { rerender } = render(
      createElement(ReferenceTab, { ...BASE_PROPS, supportsClassDef: false })
    );
    expect(getRpmDetails().open).toBe(false);
    expect(getClassLibraryDetails().open).toBe(false);

    rerender(createElement(ReferenceTab, { ...BASE_PROPS, supportsClassDef: true }));
    expect(getRpmDetails().open).toBe(false);
    expect(getClassLibraryDetails().open).toBe(false);
  });

  it("opening RPM while CL is open closes CL", () => {
    render(createElement(ReferenceTab, { ...BASE_PROPS }));
    const rpmDetails = getRpmDetails();
    const clDetails = getClassLibraryDetails();

    act(() => {
      clDetails.open = true;
      fireEvent(clDetails, new Event("toggle"));
    });
    expect(clDetails.open).toBe(true);

    act(() => {
      rpmDetails.open = true;
      fireEvent(rpmDetails, new Event("toggle"));
    });
    expect(rpmDetails.open).toBe(true);
    expect(clDetails.open).toBe(false);
  });

  it("opening CL while RPM is open closes RPM", () => {
    render(createElement(ReferenceTab, { ...BASE_PROPS }));
    const rpmDetails = getRpmDetails();
    const clDetails = getClassLibraryDetails();

    act(() => {
      rpmDetails.open = true;
      fireEvent(rpmDetails, new Event("toggle"));
    });
    expect(rpmDetails.open).toBe(true);

    act(() => {
      clDetails.open = true;
      fireEvent(clDetails, new Event("toggle"));
    });
    expect(clDetails.open).toBe(true);
    expect(rpmDetails.open).toBe(false);
  });

  it("manually opened section stays open when supportsClassDef changes", () => {
    const { rerender } = render(
      createElement(ReferenceTab, { ...BASE_PROPS, supportsClassDef: false })
    );
    const rpmDetails = getRpmDetails();

    act(() => {
      rpmDetails.open = true;
      fireEvent(rpmDetails, new Event("toggle"));
    });
    expect(rpmDetails.open).toBe(true);

    rerender(createElement(ReferenceTab, { ...BASE_PROPS, supportsClassDef: true }));
    expect(rpmDetails.open).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 4. RPM inactive badge (regression guard)
// ---------------------------------------------------------------------------

describe("Reference tab — RPM inactive badge visibility", () => {
  it("badge is present inside RPM summary when supportsClassDef is false", () => {
    render(createElement(ReferenceTab, { ...BASE_PROPS, supportsClassDef: false }));
    expect(hasBadgeIn(getRpmDetails())).toBe(true);
  });

  it("badge is absent from RPM summary when supportsClassDef is true", () => {
    render(createElement(ReferenceTab, { ...BASE_PROPS, supportsClassDef: true }));
    expect(hasBadgeIn(getRpmDetails())).toBe(false);
  });

  it("badge appears when supportsClassDef transitions from true to false", () => {
    const { rerender } = render(
      createElement(ReferenceTab, { ...BASE_PROPS, supportsClassDef: true })
    );
    expect(hasBadgeIn(getRpmDetails())).toBe(false);

    rerender(createElement(ReferenceTab, { ...BASE_PROPS, supportsClassDef: false }));
    expect(hasBadgeIn(getRpmDetails())).toBe(true);
  });

  it("badge disappears when supportsClassDef transitions from false to true", () => {
    const { rerender } = render(
      createElement(ReferenceTab, { ...BASE_PROPS, supportsClassDef: false })
    );
    expect(hasBadgeIn(getRpmDetails())).toBe(true);

    rerender(createElement(ReferenceTab, { ...BASE_PROPS, supportsClassDef: true }));
    expect(hasBadgeIn(getRpmDetails())).toBe(false);
  });

  it("badge hides when RPM section is manually expanded while supportsClassDef is false", () => {
    render(createElement(ReferenceTab, { ...BASE_PROPS, supportsClassDef: false }));
    const rpmDetails = getRpmDetails();

    expect(hasBadgeIn(rpmDetails)).toBe(true);

    act(() => {
      rpmDetails.open = true;
      fireEvent(rpmDetails, new Event("toggle"));
    });

    expect(hasBadgeIn(rpmDetails)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 5. Class Library inactive badge
// ---------------------------------------------------------------------------

describe("Reference tab — Class Library inactive badge visibility", () => {
  it("badge is present inside Class Library summary when supportsClassDef is false", () => {
    render(createElement(ReferenceTab, { ...BASE_PROPS, supportsClassDef: false }));
    expect(hasBadgeIn(getClassLibraryDetails())).toBe(true);
  });

  it("badge is absent from Class Library summary when supportsClassDef is true", () => {
    render(createElement(ReferenceTab, { ...BASE_PROPS, supportsClassDef: true }));
    expect(hasBadgeIn(getClassLibraryDetails())).toBe(false);
  });

  it("Class Library badge appears when supportsClassDef transitions to false", () => {
    const { rerender } = render(
      createElement(ReferenceTab, { ...BASE_PROPS, supportsClassDef: true })
    );
    expect(hasBadgeIn(getClassLibraryDetails())).toBe(false);

    rerender(createElement(ReferenceTab, { ...BASE_PROPS, supportsClassDef: false }));
    expect(hasBadgeIn(getClassLibraryDetails())).toBe(true);
  });

  it("badge hides when Class Library is manually expanded while supportsClassDef is false", () => {
    render(createElement(ReferenceTab, { ...BASE_PROPS, supportsClassDef: false }));
    const clDetails = getClassLibraryDetails();

    expect(hasBadgeIn(clDetails)).toBe(true);

    act(() => {
      clDetails.open = true;
      fireEvent(clDetails, new Event("toggle"));
    });

    expect(hasBadgeIn(clDetails)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 6. Combined RPM + Class Library badge behavior — exclusive accordion
// ---------------------------------------------------------------------------

describe("Reference tab — RPM and Class Library badges with exclusive accordion", () => {
  /**
   * Regression guard for the exclusive accordion + badge interaction.
   *
   * When supportsClassDef=false, the "inactive" badge is visible on any
   * collapsed section. Opening RPM hides the RPM badge. Then opening CL
   * (exclusive accordion) forces RPM to auto-close — which re-shows the RPM
   * badge (because RPM is now collapsed again) while hiding the CL badge.
   */
  it("RPM badge re-appears when exclusive accordion closes RPM to open CL", () => {
    render(createElement(ReferenceTab, { ...BASE_PROPS, supportsClassDef: false }));

    const rpmDetails = getRpmDetails();
    const clDetails = getClassLibraryDetails();

    expect(hasBadgeIn(rpmDetails)).toBe(true);
    expect(hasBadgeIn(clDetails)).toBe(true);

    // Expand RPM → RPM badge hides, CL badge stays.
    act(() => {
      rpmDetails.open = true;
      fireEvent(rpmDetails, new Event("toggle"));
    });
    expect(hasBadgeIn(rpmDetails)).toBe(false);
    expect(hasBadgeIn(clDetails)).toBe(true);

    // Expand CL → exclusive accordion closes RPM, so RPM badge re-appears;
    // CL badge disappears because CL is now open.
    act(() => {
      clDetails.open = true;
      fireEvent(clDetails, new Event("toggle"));
    });
    expect(hasBadgeIn(rpmDetails)).toBe(true);
    expect(hasBadgeIn(clDetails)).toBe(false);
  });
});
