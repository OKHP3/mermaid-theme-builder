// @vitest-environment happy-dom

/**
 * Unit tests for DiffTabHint dismiss and persistence behaviour.
 *
 * Covers:
 *   1. Hint is visible on first render (no prior localStorage entry).
 *   2. Clicking × dismisses the hint immediately.
 *   3. After dismissal the correct localStorage key is set.
 *   4. Re-mounting with the dismissal key already set keeps the hint hidden.
 *   5. The ExtractDiffHint key does not affect DiffTabHint.
 *   6. Removing the dismissal key makes the hint visible again on remount.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { createElement } from "react";
import { DiffTabHint } from "@/components/DiffTabHint";

const STORAGE_KEY = "mtb.hint-dismissed.diff-tab";
const EXTRACT_DIFF_KEY = "mtb.hint-dismissed.extract-diff-tab";

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe("DiffTabHint — initial render", () => {
  it("renders the hint banner when localStorage has no dismissal entry", () => {
    render(createElement(DiffTabHint));
    expect(screen.getByRole("note", { name: "How to use the Diff tab" })).toBeTruthy();
  });
});

describe("DiffTabHint — dismiss interaction", () => {
  it("clicking the dismiss button removes the hint from the DOM", () => {
    render(createElement(DiffTabHint));
    fireEvent.click(screen.getByRole("button", { name: "Dismiss Diff tab hint" }));
    expect(screen.queryByRole("note", { name: "How to use the Diff tab" })).toBeNull();
  });

  it("remains dismissible when localStorage read and write both throw", () => {
    const getItemSpy = vi.spyOn(window.localStorage, "getItem").mockImplementation(() => {
      throw new Error("localStorage unavailable");
    });
    const setItemSpy = vi.spyOn(window.localStorage, "setItem").mockImplementation(() => {
      throw new Error("localStorage unavailable");
    });

    try {
      render(createElement(DiffTabHint));
      expect(screen.getByRole("note", { name: "How to use the Diff tab" })).toBeTruthy();
      expect(getItemSpy).toHaveBeenCalledWith(STORAGE_KEY);

      expect(() => {
        fireEvent.click(screen.getByRole("button", { name: "Dismiss Diff tab hint" }));
      }).not.toThrow();
      expect(screen.queryByRole("note", { name: "How to use the Diff tab" })).toBeNull();
      expect(setItemSpy).toHaveBeenCalledWith(STORAGE_KEY, "1");
    } finally {
      getItemSpy.mockRestore();
      setItemSpy.mockRestore();
    }
  });

  it("clicking dismiss sets localStorage key to '1'", () => {
    render(createElement(DiffTabHint));
    fireEvent.click(screen.getByRole("button", { name: "Dismiss Diff tab hint" }));
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("1");
  });
});

describe("DiffTabHint — persisted dismissal across remount", () => {
  it("keeps the hint hidden when the localStorage key is already set", () => {
    window.localStorage.setItem(STORAGE_KEY, "1");
    render(createElement(DiffTabHint));
    expect(screen.queryByRole("note", { name: "How to use the Diff tab" })).toBeNull();
  });

  it("makes the hint visible again after the dismissal key is removed", () => {
    window.localStorage.setItem(STORAGE_KEY, "1");
    render(createElement(DiffTabHint));
    expect(screen.queryByRole("note", { name: "How to use the Diff tab" })).toBeNull();

    cleanup();
    window.localStorage.removeItem(STORAGE_KEY);
    render(createElement(DiffTabHint));
    expect(screen.getByRole("note", { name: "How to use the Diff tab" })).toBeTruthy();
  });
});

describe("DiffTabHint — key independence from ExtractDiffHint", () => {
  it("does not hide when only the ExtractDiffHint key is set", () => {
    window.localStorage.setItem(EXTRACT_DIFF_KEY, "1");
    render(createElement(DiffTabHint));
    expect(screen.getByRole("note", { name: "How to use the Diff tab" })).toBeTruthy();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
