// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
import { fireEvent } from "@testing-library/dom";
import { createElement } from "react";
import { ClassBrowser, HL } from "@/components/ClassBrowser";
import type { ClassDef } from "@/lib/theme-engine";

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
  localStorage.clear();
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

describe("ClassBrowser — classDef preview panel highlighting (integration)", () => {
  it("preview panel <pre> is absent from the DOM on initial mount", () => {
    const { container } = render(
      createElement(ClassBrowser, { classDefs: SAMPLE_CLASS_DEFS, supportsClassDef: true })
    );
    expect(container.querySelector("pre")).toBeNull();
  });

  it("clicking the preview toggle button mounts the preview panel", () => {
    const { container } = render(
      createElement(ClassBrowser, { classDefs: SAMPLE_CLASS_DEFS, supportsClassDef: true })
    );
    act(() => {
      fireEvent.click(screen.getByLabelText("Preview all classDefs"));
    });
    expect(container.querySelector("pre")).not.toBeNull();
  });

  it("toggle button aria-pressed reflects panel open/closed state", () => {
    render(createElement(ClassBrowser, { classDefs: SAMPLE_CLASS_DEFS, supportsClassDef: true }));
    const btn = screen.getByLabelText("Preview all classDefs");
    expect(btn.getAttribute("aria-pressed")).toBe("false");
    act(() => {
      fireEvent.click(btn);
    });
    expect(btn.getAttribute("aria-pressed")).toBe("true");
  });

  it("preview panel pre contains a span with HL.keyword color (classDef keyword)", () => {
    const { container } = render(
      createElement(ClassBrowser, { classDefs: SAMPLE_CLASS_DEFS, supportsClassDef: true })
    );
    act(() => {
      fireEvent.click(screen.getByLabelText("Preview all classDefs"));
    });
    const pre = container.querySelector("pre")!;
    // highlightClassDefBlock wraps the "classDef" token in a span with HL.keyword color.
    const spans = Array.from(pre.querySelectorAll<HTMLSpanElement>("span"));
    expect(spans.some((s) => s.style.color === HL.keyword)).toBe(true);
  });

  it("preview panel pre contains a span with HL.name color (class name identifier)", () => {
    const { container } = render(
      createElement(ClassBrowser, { classDefs: SAMPLE_CLASS_DEFS, supportsClassDef: true })
    );
    act(() => {
      fireEvent.click(screen.getByLabelText("Preview all classDefs"));
    });
    const pre = container.querySelector("pre")!;
    const spans = Array.from(pre.querySelectorAll<HTMLSpanElement>("span"));
    expect(spans.some((s) => s.style.color === HL.name)).toBe(true);
  });

  it("preview panel pre contains a span with HL.key color (property key like fill/stroke)", () => {
    const { container } = render(
      createElement(ClassBrowser, { classDefs: SAMPLE_CLASS_DEFS, supportsClassDef: true })
    );
    act(() => {
      fireEvent.click(screen.getByLabelText("Preview all classDefs"));
    });
    const pre = container.querySelector("pre")!;
    const spans = Array.from(pre.querySelectorAll<HTMLSpanElement>("span"));
    expect(spans.some((s) => s.style.color === HL.key)).toBe(true);
  });

  it("preview panel pre contains a span with HL.hex color (hex value like #1e3a5f)", () => {
    const { container } = render(
      createElement(ClassBrowser, { classDefs: SAMPLE_CLASS_DEFS, supportsClassDef: true })
    );
    act(() => {
      fireEvent.click(screen.getByLabelText("Preview all classDefs"));
    });
    const pre = container.querySelector("pre")!;
    const spans = Array.from(pre.querySelectorAll<HTMLSpanElement>("span"));
    expect(spans.some((s) => s.style.color === HL.hex)).toBe(true);
  });

  it("close button removes the preview panel from the DOM", () => {
    const { container } = render(
      createElement(ClassBrowser, { classDefs: SAMPLE_CLASS_DEFS, supportsClassDef: true })
    );
    act(() => {
      fireEvent.click(screen.getByLabelText("Preview all classDefs"));
    });
    expect(container.querySelector("pre")).not.toBeNull();
    act(() => {
      fireEvent.click(screen.getByLabelText("Close preview"));
    });
    expect(container.querySelector("pre")).toBeNull();
  });

  it("preview panel does not mount when supportsClassDef is false", () => {
    const { container } = render(
      createElement(ClassBrowser, { classDefs: SAMPLE_CLASS_DEFS, supportsClassDef: false })
    );
    // The toggle button is disabled; the pre should not appear even if somehow clicked.
    const btn = screen.getByLabelText("Preview all classDefs") as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(container.querySelector("pre")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// All / Used preview toggle
// ---------------------------------------------------------------------------

describe("ClassBrowser — All / Used preview panel toggle", () => {
  function renderWithUsed() {
    return render(
      createElement(ClassBrowser, {
        classDefs: SAMPLE_CLASS_DEFS,
        supportsClassDef: true,
        usedClassNames: new Set(["primary"]),
      })
    );
  }

  function openPreview(container: HTMLElement) {
    act(() => {
      fireEvent.click(screen.getByLabelText("Preview all classDefs"));
    });
    return container.querySelector("pre")!;
  }

  it("opening the preview with usedClassNames defaults to 'used' mode", () => {
    const { container } = renderWithUsed();
    const pre = openPreview(container);
    expect(pre.textContent).toContain("primary");
    expect(pre.textContent).not.toContain("secondary");
  });

  it("the 'Used' toggle button has aria-pressed='true' in default mode", () => {
    const { container } = renderWithUsed();
    openPreview(container);
    const usedBtn = container.querySelector<HTMLButtonElement>('[data-preview-toggle="used"]')!;
    expect(usedBtn.getAttribute("aria-pressed")).toBe("true");
  });

  it("the 'All' toggle button has aria-pressed='false' in default (used) mode", () => {
    const { container } = renderWithUsed();
    openPreview(container);
    const allBtn = screen.getByTitle("Show all classDefs");
    expect(allBtn.getAttribute("aria-pressed")).toBe("false");
  });

  it("clicking 'All' shows both primary and secondary in the pre", () => {
    const { container } = renderWithUsed();
    const pre = openPreview(container);
    act(() => {
      fireEvent.click(screen.getByTitle("Show all classDefs"));
    });
    expect(pre.textContent).toContain("primary");
    expect(pre.textContent).toContain("secondary");
  });

  it("after clicking 'All', the All button has aria-pressed='true'", () => {
    const { container } = renderWithUsed();
    openPreview(container);
    const allBtn = screen.getByTitle("Show all classDefs");
    act(() => {
      fireEvent.click(allBtn);
    });
    expect(allBtn.getAttribute("aria-pressed")).toBe("true");
  });

  it("clicking 'Used' after 'All' reduces the pre back to primary only", () => {
    const { container } = renderWithUsed();
    const pre = openPreview(container);
    act(() => {
      fireEvent.click(screen.getByTitle("Show all classDefs"));
    });
    expect(pre.textContent).toContain("secondary");
    act(() => {
      fireEvent.click(container.querySelector<HTMLButtonElement>('[data-preview-toggle="used"]')!);
    });
    expect(pre.textContent).toContain("primary");
    expect(pre.textContent).not.toContain("secondary");
  });

  it("the All/Used toggle group is absent when no usedClassNames are provided", () => {
    const { container } = render(
      createElement(ClassBrowser, {
        classDefs: SAMPLE_CLASS_DEFS,
        supportsClassDef: true,
      })
    );
    openPreview(container);
    expect(container.querySelector('[data-preview-toggle="all"]')).toBeNull();
    expect(container.querySelector('[data-preview-toggle="used"]')).toBeNull();
  });
});
