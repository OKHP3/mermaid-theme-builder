// @vitest-environment happy-dom

/**
 * Unit tests for ExtractDiffHint dismiss behaviour (Task #526).
 *
 * Covers:
 *   1. Hint is visible on first render (no prior localStorage entry).
 *   2. Clicking × dismisses the hint immediately.
 *   3. After dismissal the correct localStorage key is set.
 *   4. Re-mounting with the dismissal key already set keeps the hint hidden
 *      (simulates a page reload).
 *   5. Dismissing ExtractDiffHint does NOT touch the DiffTabHint key
 *      (`mtb.hint-dismissed.diff-tab`) — the two dismissals are independent.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { createElement } from "react";
import { ExtractDiffHint } from "@/components/ExtractDiffHint";

const STORAGE_KEY = "mtb.hint-dismissed.extract-diff-tab";
const DIFF_TAB_KEY = "mtb.hint-dismissed.diff-tab";

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

// ---------------------------------------------------------------------------
// 1. Hint is visible on first visit
// ---------------------------------------------------------------------------

describe("ExtractDiffHint — initial render", () => {
  it("renders the hint banner when localStorage has no dismissal entry", () => {
    render(createElement(ExtractDiffHint));
    expect(screen.getByRole("note", { name: "How to use the Extract Diff panel" })).toBeTruthy();
  });

  it("renders the dismiss button", () => {
    render(createElement(ExtractDiffHint));
    expect(screen.getByRole("button", { name: "Dismiss Extract Diff panel hint" })).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// 2. Clicking × dismisses the hint immediately
// ---------------------------------------------------------------------------

describe("ExtractDiffHint — dismiss interaction", () => {
  it("clicking the dismiss button removes the hint from the DOM", () => {
    render(createElement(ExtractDiffHint));
    const btn = screen.getByRole("button", { name: "Dismiss Extract Diff panel hint" });
    fireEvent.click(btn);
    expect(screen.queryByRole("note", { name: "How to use the Extract Diff panel" })).toBeNull();
  });

  // ---------------------------------------------------------------------------
  // 3. Dismissal writes the expected localStorage key
  // ---------------------------------------------------------------------------

  it("clicking dismiss sets localStorage key to '1'", () => {
    render(createElement(ExtractDiffHint));
    fireEvent.click(screen.getByRole("button", { name: "Dismiss Extract Diff panel hint" }));
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("1");
  });

  // ---------------------------------------------------------------------------
  // 5. DiffTabHint key is untouched
  // ---------------------------------------------------------------------------

  it("dismissing ExtractDiffHint does NOT write the DiffTabHint key", () => {
    render(createElement(ExtractDiffHint));
    fireEvent.click(screen.getByRole("button", { name: "Dismiss Extract Diff panel hint" }));
    expect(window.localStorage.getItem(DIFF_TAB_KEY)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 4. Re-mount with dismissal key already set (simulates page reload)
// ---------------------------------------------------------------------------

describe("ExtractDiffHint — persisted dismissal across remount", () => {
  it("hint is hidden when the localStorage key is already set before first render", () => {
    window.localStorage.setItem(STORAGE_KEY, "1");
    render(createElement(ExtractDiffHint));
    expect(screen.queryByRole("note", { name: "How to use the Extract Diff panel" })).toBeNull();
  });

  it("hint stays hidden after a dismiss-then-cleanup-then-remount cycle", () => {
    // First mount: dismiss.
    render(createElement(ExtractDiffHint));
    fireEvent.click(screen.getByRole("button", { name: "Dismiss Extract Diff panel hint" }));
    cleanup();

    // Second mount (same localStorage state, simulating reload).
    render(createElement(ExtractDiffHint));
    expect(screen.queryByRole("note", { name: "How to use the Extract Diff panel" })).toBeNull();
  });

  it("hint reappears after the dismissal key is manually removed (simulating a reset)", () => {
    window.localStorage.setItem(STORAGE_KEY, "1");
    render(createElement(ExtractDiffHint));
    // Hint hidden — confirmed by earlier test.
    cleanup();

    window.localStorage.removeItem(STORAGE_KEY);
    render(createElement(ExtractDiffHint));
    expect(screen.getByRole("note", { name: "How to use the Extract Diff panel" })).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Independence: DiffTabHint key does not affect ExtractDiffHint
// ---------------------------------------------------------------------------

describe("ExtractDiffHint — key independence from DiffTabHint", () => {
  it("setting the DiffTabHint key does NOT hide the ExtractDiffHint banner", () => {
    window.localStorage.setItem(DIFF_TAB_KEY, "1");
    render(createElement(ExtractDiffHint));
    expect(screen.getByRole("note", { name: "How to use the Extract Diff panel" })).toBeTruthy();
  });
});
