// @vitest-environment happy-dom

/**
 * Tests for the PromptScaffoldModal "last used" badge persistence (Task #249).
 *
 * Behaviors covered:
 *   1. Pre-seeded localStorage value → correct format card shows "last used" badge.
 *   2. No stored value → no badge shown; subtitle says "Choose a theme directive format".
 *   3. Invalid/stale stored value → resolveScaffoldFormat returns "both" (the safe
 *      default), so the "All" card is badged — not silently hidden.
 *   4. Copying a format writes the correct key/value pair to localStorage.
 *   5. Subtitle hint text reflects whether a preference exists.
 *
 * Pattern mirrors promptScaffoldCopyFlash.test.tsx: real PromptScaffoldModal with
 * mocked onCopy/generatePreview/onClose, fake timers to freeze setTimeout calls.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { fireEvent } from "@testing-library/dom";
import { act, createElement } from "react";
import { PromptScaffoldModal } from "@/components/PromptScaffoldModal";
import { SCAFFOLD_FORMAT_KEY } from "@/lib/scaffoldPrefs";

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const PREVIEW_TEXT = "%%{init: {'theme': 'base'} }%%\nflowchart TD\n  A --> B";

function noop() {}

function buildProps(overrides: Partial<Parameters<typeof PromptScaffoldModal>[0]> = {}) {
  return {
    open: true,
    onClose: vi.fn(),
    onCopy: vi.fn().mockResolvedValue(undefined),
    generatePreview: (_format: string) => PREVIEW_TEXT,
    rendererTarget: "",
    onRendererTargetChange: noop,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Locator helpers
// ---------------------------------------------------------------------------

/** Returns all "last used" badge spans present in the container. */
function getLastUsedBadges(container: HTMLElement): HTMLSpanElement[] {
  return Array.from(container.querySelectorAll<HTMLSpanElement>("span")).filter(
    (s) => s.textContent?.trim() === "last used"
  );
}

/**
 * Finds the main card copy button for the given badge label ("Format A", "Format B", "All").
 * The main copy button carries `text-left` and has no aria-label (unlike the toggle bar).
 */
function getMainCopyButton(container: HTMLElement, badge: string): HTMLButtonElement {
  const btn = Array.from(container.querySelectorAll<HTMLButtonElement>("button")).find(
    (b) =>
      b.classList.contains("text-left") &&
      b.textContent?.includes(badge) &&
      !b.getAttribute("aria-label")
  );
  if (!btn) throw new Error(`Main copy button for "${badge}" not found`);
  return btn;
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  localStorage.clear();
});

// ---------------------------------------------------------------------------
// 1. Pre-seeded preference → badge appears on the correct format card
// ---------------------------------------------------------------------------

describe("PromptScaffoldModal — last used badge from pre-seeded localStorage", () => {
  it("shows 'last used' badge on the Format A card when 'formatA' is stored", () => {
    localStorage.setItem(SCAFFOLD_FORMAT_KEY, "formatA");
    const { container } = render(createElement(PromptScaffoldModal, buildProps()));

    const badges = getLastUsedBadges(container);
    expect(badges).toHaveLength(1);
    // The badge lives inside the main copy button; that button's text includes the
    // format badge label ("Format A") confirming it is on the correct card.
    expect(badges[0].closest("button")?.textContent).toContain("Format A");
  });

  it("shows 'last used' badge on the Format B card when 'formatB' is stored", () => {
    localStorage.setItem(SCAFFOLD_FORMAT_KEY, "formatB");
    const { container } = render(createElement(PromptScaffoldModal, buildProps()));

    const badges = getLastUsedBadges(container);
    expect(badges).toHaveLength(1);
    expect(badges[0].closest("button")?.textContent).toContain("Format B");
  });

  it("shows 'last used' badge on the All card when 'both' is stored", () => {
    localStorage.setItem(SCAFFOLD_FORMAT_KEY, "both");
    const { container } = render(createElement(PromptScaffoldModal, buildProps()));

    const badges = getLastUsedBadges(container);
    expect(badges).toHaveLength(1);
    expect(badges[0].closest("button")?.textContent).toContain("All");
  });

  it("shows exactly one 'last used' badge — not one per card", () => {
    localStorage.setItem(SCAFFOLD_FORMAT_KEY, "formatA");
    const { container } = render(createElement(PromptScaffoldModal, buildProps()));
    expect(getLastUsedBadges(container)).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// 2. No stored value → no badge, neutral subtitle
// ---------------------------------------------------------------------------

describe("PromptScaffoldModal — no badge when localStorage is empty", () => {
  it("shows no 'last used' badge when no key is stored", () => {
    const { container } = render(createElement(PromptScaffoldModal, buildProps()));
    expect(getLastUsedBadges(container)).toHaveLength(0);
  });

  it("subtitle reads 'Choose a theme directive format' when no preference is stored", () => {
    const { container } = render(createElement(PromptScaffoldModal, buildProps()));
    expect(container.textContent).toContain("Choose a theme directive format");
  });
});

// ---------------------------------------------------------------------------
// 3. Invalid/stale stored value → treated as no prior selection (no badge)
//    readLastFormat() checks for exact valid literals and returns null for anything
//    else, so a garbage or stale stored value does not produce a spurious badge.
// ---------------------------------------------------------------------------

describe("PromptScaffoldModal — invalid stored value shows no badge", () => {
  it("an unrecognized stored value produces no 'last used' badge", () => {
    localStorage.setItem(SCAFFOLD_FORMAT_KEY, "not-a-real-format");
    const { container } = render(createElement(PromptScaffoldModal, buildProps()));
    expect(getLastUsedBadges(container)).toHaveLength(0);
  });

  it("subtitle reads 'Choose a theme directive format' for an invalid stored value", () => {
    localStorage.setItem(SCAFFOLD_FORMAT_KEY, "not-a-real-format");
    const { container } = render(createElement(PromptScaffoldModal, buildProps()));
    expect(container.textContent).toContain("Choose a theme directive format");
    expect(container.textContent).not.toContain("highlighted");
  });

  it("an empty string stored produces no badge (empty string is not a valid format)", () => {
    localStorage.setItem(SCAFFOLD_FORMAT_KEY, "");
    const { container } = render(createElement(PromptScaffoldModal, buildProps()));
    expect(getLastUsedBadges(container)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 4. Copying a format writes the correct key/value to localStorage
// ---------------------------------------------------------------------------

describe("PromptScaffoldModal — copy writes to localStorage", () => {
  it("copying Format A writes 'formatA' under the correct key", async () => {
    const { container } = render(createElement(PromptScaffoldModal, buildProps()));

    await act(async () => {
      fireEvent.click(getMainCopyButton(container, "Format A"));
    });

    expect(localStorage.getItem(SCAFFOLD_FORMAT_KEY)).toBe("formatA");
  });

  it("copying Format B writes 'formatB' under the correct key", async () => {
    const { container } = render(createElement(PromptScaffoldModal, buildProps()));

    await act(async () => {
      fireEvent.click(getMainCopyButton(container, "Format B"));
    });

    expect(localStorage.getItem(SCAFFOLD_FORMAT_KEY)).toBe("formatB");
  });

  it("copying All (both) writes 'both' under the correct key", async () => {
    const { container } = render(createElement(PromptScaffoldModal, buildProps()));

    await act(async () => {
      fireEvent.click(getMainCopyButton(container, "All"));
    });

    expect(localStorage.getItem(SCAFFOLD_FORMAT_KEY)).toBe("both");
  });

  it("uses the exact key 'mtb-scaffold-format' — not a shortened variant", async () => {
    const { container } = render(createElement(PromptScaffoldModal, buildProps()));

    await act(async () => {
      fireEvent.click(getMainCopyButton(container, "Format A"));
    });

    expect(localStorage.getItem("mtb-scaffold-format")).toBe("formatA");
    expect(localStorage.getItem("scaffold-format")).toBeNull();
    expect(localStorage.getItem("scaffoldFormat")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 5. Subtitle hint text reflects the preference state
// ---------------------------------------------------------------------------

describe("PromptScaffoldModal — subtitle hint text", () => {
  it("says 'highlighted' when a valid preference is stored", () => {
    localStorage.setItem(SCAFFOLD_FORMAT_KEY, "formatB");
    const { container } = render(createElement(PromptScaffoldModal, buildProps()));
    expect(container.textContent).toContain("Your last-used format is highlighted");
  });

  it("says 'Choose a theme directive format' when the modal opens with no prior preference", () => {
    const { container } = render(createElement(PromptScaffoldModal, buildProps()));
    expect(container.textContent).toContain("Choose a theme directive format");
    expect(container.textContent).not.toContain("highlighted");
  });
});
