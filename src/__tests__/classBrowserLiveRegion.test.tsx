// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
import { fireEvent } from "@testing-library/dom";
import { createElement } from "react";
import { ClassBrowser } from "@/components/ClassBrowser";
import type { ClassDef } from "@/lib/themeEngine";

/**
 * Interactive tests for the aria-live announcements in ClassBrowser.
 *
 * These run in happy-dom (registered in vitest.config.ts environmentMatchGlobs)
 * so React state updates are observable via @testing-library/react.
 *
 * Verifies that the visually-hidden aria-live="polite" region mirrors the
 * toast text on every copy action and clears when copiedState resets.
 */

const SAMPLE_CLASS_DEFS: ClassDef[] = [
  {
    name: "primary",
    fill: "#1e3a5f",
    stroke: "#3b82f6",
    color: "#ffffff",
    extra: "",
    description: "Primary node style",
  },
  {
    name: "secondary",
    fill: "#374151",
    stroke: "#6b7280",
    color: "#f3f4f6",
    extra: "",
    description: "Secondary node style",
  },
];

beforeEach(() => {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    writable: true,
    configurable: true,
  });
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function getLiveRegion(): HTMLElement {
  return screen.getByRole("status");
}

describe("ClassBrowser — live-region updates on copy (interactive)", () => {
  it("live region is empty on initial mount", () => {
    render(
      createElement(ClassBrowser, {
        classDefs: SAMPLE_CLASS_DEFS,
        supportsClassDef: true,
      })
    );
    expect(getLiveRegion().textContent?.trim()).toBe("");
  });

  it("live region announces usage copy: 'Copied :::primary'", async () => {
    render(
      createElement(ClassBrowser, {
        classDefs: SAMPLE_CLASS_DEFS,
        supportsClassDef: true,
      })
    );
    const usageCard = screen.getByTitle("Click to copy :::primary");
    await act(async () => {
      fireEvent.click(usageCard);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(getLiveRegion().textContent?.trim()).toBe("Copied :::primary");
  });

  it("live region is cleared after the 1 800 ms timeout", async () => {
    render(
      createElement(ClassBrowser, {
        classDefs: SAMPLE_CLASS_DEFS,
        supportsClassDef: true,
      })
    );
    const usageCard = screen.getByTitle("Click to copy :::primary");
    await act(async () => {
      fireEvent.click(usageCard);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(getLiveRegion().textContent?.trim()).toBe("Copied :::primary");

    await act(async () => {
      vi.advanceTimersByTime(1800);
    });
    expect(getLiveRegion().textContent?.trim()).toBe("");
  });

  it("live region announces 'Copy all' action", async () => {
    render(
      createElement(ClassBrowser, {
        classDefs: SAMPLE_CLASS_DEFS,
        supportsClassDef: true,
      })
    );
    const copyAllBtn = screen.getByTitle("Copy all classDefs as a single block");
    await act(async () => {
      fireEvent.click(copyAllBtn);
    });
    expect(getLiveRegion().textContent?.trim()).toBe(
      `Copied ${SAMPLE_CLASS_DEFS.length} classDefs`
    );
  });

  it("live region announces classDef copy via the copy-icon button", async () => {
    render(
      createElement(ClassBrowser, {
        classDefs: SAMPLE_CLASS_DEFS,
        supportsClassDef: true,
      })
    );
    const copyDefBtn = screen.getByLabelText("Copy classDef primary");
    await act(async () => {
      fireEvent.click(copyDefBtn);
    });
    expect(getLiveRegion().textContent?.trim()).toBe("Copied classDef primary");
  });

  it("live region announces 'Copy used' action", async () => {
    render(
      createElement(ClassBrowser, {
        classDefs: SAMPLE_CLASS_DEFS,
        supportsClassDef: true,
        usedClassNames: new Set(["primary"]),
      })
    );
    const copyUsedBtn = screen.getByTitle("Copy only the 1 classDef used in the current diagram");
    await act(async () => {
      fireEvent.click(copyUsedBtn);
    });
    expect(getLiveRegion().textContent?.trim()).toBe("Copied 1 classDef");
  });

  it("live region stays empty when supportsClassDef={false} (copy actions disabled)", () => {
    render(
      createElement(ClassBrowser, {
        classDefs: SAMPLE_CLASS_DEFS,
        supportsClassDef: false,
      })
    );
    expect(getLiveRegion().textContent?.trim()).toBe("");
  });
});
