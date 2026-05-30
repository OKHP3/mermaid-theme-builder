// @vitest-environment happy-dom

/**
 * Automated tests for Reference tab auto-collapse behavior (Task #183).
 *
 * Both the Renderer Parity Matrix (Task #112) and the Class Library (Task #67)
 * auto-collapse based on `supportsClassDef`. These tests lock in the behavior
 * at the DOM level so a silent regression can't slip through undetected.
 *
 * Also covers (as a regression guard for Task #182 / #314 / #315):
 *   - RPM inactive badge: visible when collapsed + supportsClassDef=false,
 *     hidden when supportsClassDef becomes true or the section is expanded
 *   - Class Library inactive badge: same hide-on-expand rule as RPM (added in
 *     Task #314). Section 6 locks in this symmetry with a combined test so a
 *     future refactor that silently diverges the two behaviors will fail.
 *
 * Strategy
 * --------
 * The auto-collapse is implemented via useEffect that sets el.open imperatively.
 * @testing-library/react's render() and rerender() both wrap in act(), which
 * flushes effects synchronously, so assertions can run immediately after render.
 *
 * For the "badge hides on manual expand" test the native toggle event is fired
 * directly on the <details> element (simulating browser behavior) to trigger
 * React's onToggle handler and flush the resulting state update.
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
// 1. supportsClassDef=false — both sections auto-collapse
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
// 2. supportsClassDef=true — both sections are open
// ---------------------------------------------------------------------------

describe("Reference tab auto-collapse — supportsClassDef=true", () => {
  it("Renderer Parity Matrix is open when supportsClassDef is true", () => {
    render(createElement(ReferenceTab, { ...BASE_PROPS, supportsClassDef: true }));
    expect(getRpmDetails().open).toBe(true);
  });

  it("Class Library is open when supportsClassDef is true", () => {
    render(createElement(ReferenceTab, { ...BASE_PROPS, supportsClassDef: true }));
    expect(getClassLibraryDetails().open).toBe(true);
  });

  it("both sections are open simultaneously when supportsClassDef is true", () => {
    render(createElement(ReferenceTab, { ...BASE_PROPS, supportsClassDef: true }));
    expect(getRpmDetails().open).toBe(true);
    expect(getClassLibraryDetails().open).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 3. State transitions — diagram type switch via rerender
// ---------------------------------------------------------------------------

describe("Reference tab auto-collapse — transitions on rerender", () => {
  it("RPM collapses when supportsClassDef transitions from true to false", () => {
    const { rerender } = render(
      createElement(ReferenceTab, { ...BASE_PROPS, supportsClassDef: true })
    );
    expect(getRpmDetails().open).toBe(true);

    rerender(createElement(ReferenceTab, { ...BASE_PROPS, supportsClassDef: false }));
    expect(getRpmDetails().open).toBe(false);
  });

  it("Class Library collapses when supportsClassDef transitions from true to false", () => {
    const { rerender } = render(
      createElement(ReferenceTab, { ...BASE_PROPS, supportsClassDef: true })
    );
    expect(getClassLibraryDetails().open).toBe(true);

    rerender(createElement(ReferenceTab, { ...BASE_PROPS, supportsClassDef: false }));
    expect(getClassLibraryDetails().open).toBe(false);
  });

  it("RPM expands when supportsClassDef transitions from false to true", () => {
    const { rerender } = render(
      createElement(ReferenceTab, { ...BASE_PROPS, supportsClassDef: false })
    );
    expect(getRpmDetails().open).toBe(false);

    rerender(createElement(ReferenceTab, { ...BASE_PROPS, supportsClassDef: true }));
    expect(getRpmDetails().open).toBe(true);
  });

  it("Class Library expands when supportsClassDef transitions from false to true", () => {
    const { rerender } = render(
      createElement(ReferenceTab, { ...BASE_PROPS, supportsClassDef: false })
    );
    expect(getClassLibraryDetails().open).toBe(false);

    rerender(createElement(ReferenceTab, { ...BASE_PROPS, supportsClassDef: true }));
    expect(getClassLibraryDetails().open).toBe(true);
  });

  it("both sections track multiple rapid transitions correctly", () => {
    const { rerender } = render(
      createElement(ReferenceTab, { ...BASE_PROPS, supportsClassDef: true })
    );
    rerender(createElement(ReferenceTab, { ...BASE_PROPS, supportsClassDef: false }));
    expect(getRpmDetails().open).toBe(false);
    expect(getClassLibraryDetails().open).toBe(false);

    rerender(createElement(ReferenceTab, { ...BASE_PROPS, supportsClassDef: true }));
    expect(getRpmDetails().open).toBe(true);
    expect(getClassLibraryDetails().open).toBe(true);

    rerender(createElement(ReferenceTab, { ...BASE_PROPS, supportsClassDef: false }));
    expect(getRpmDetails().open).toBe(false);
    expect(getClassLibraryDetails().open).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 4. RPM inactive badge (Task #182 regression guard / Task #242 coverage)
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

    // Confirm badge is visible before expansion.
    expect(hasBadgeIn(rpmDetails)).toBe(true);

    // Simulate the browser expanding <details>: set open, dispatch toggle event.
    // The native toggle event triggers React's onToggle prop → setRendererParityOpen(true).
    act(() => {
      rpmDetails.open = true;
      fireEvent(rpmDetails, new Event("toggle"));
    });

    // The badge condition is !supportsClassDef && !rendererParityOpen.
    // rendererParityOpen is now true, so the badge must be gone.
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

    // Confirm badge is visible before expansion.
    expect(hasBadgeIn(clDetails)).toBe(true);

    // Simulate the browser expanding <details>: set open, dispatch toggle event.
    // The native toggle event triggers React's onToggle prop → setClassLibraryOpen(true).
    act(() => {
      clDetails.open = true;
      fireEvent(clDetails, new Event("toggle"));
    });

    // The badge condition is !supportsClassDef && !classLibraryOpen.
    // classLibraryOpen is now true, so the badge must be gone.
    expect(hasBadgeIn(clDetails)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 6. Combined RPM + Class Library badge behavior (Task #315)
// ---------------------------------------------------------------------------

describe("Reference tab — RPM and Class Library badges hide on expand — symmetric behavior", () => {
  /**
   * Combined regression guard for Task #314 / #315.
   *
   * Both the Renderer Parity Matrix and the Class Library share the same badge
   * hide-on-expand rule: when supportsClassDef is false the "inactive" badge is
   * visible, and it disappears as soon as the user manually opens that section.
   *
   * This test renders both sections in a single component tree and expands each
   * one in sequence, asserting the expected hide happens for each — so a future
   * change that accidentally diverges the two behaviors will be caught here even
   * if the individual section-4 / section-5 tests are not run together.
   */
  it("both RPM and Class Library badges hide when their sections are manually expanded", () => {
    render(createElement(ReferenceTab, { ...BASE_PROPS, supportsClassDef: false }));

    const rpmDetails = getRpmDetails();
    const clDetails = getClassLibraryDetails();

    // Both badges must be visible before any expansion.
    expect(hasBadgeIn(rpmDetails)).toBe(true);
    expect(hasBadgeIn(clDetails)).toBe(true);

    // Expand RPM → only the RPM badge should disappear.
    act(() => {
      rpmDetails.open = true;
      fireEvent(rpmDetails, new Event("toggle"));
    });
    expect(hasBadgeIn(rpmDetails)).toBe(false);
    expect(hasBadgeIn(clDetails)).toBe(true);

    // Expand Class Library → the CL badge should also disappear.
    act(() => {
      clDetails.open = true;
      fireEvent(clDetails, new Event("toggle"));
    });
    expect(hasBadgeIn(rpmDetails)).toBe(false);
    expect(hasBadgeIn(clDetails)).toBe(false);
  });
});
