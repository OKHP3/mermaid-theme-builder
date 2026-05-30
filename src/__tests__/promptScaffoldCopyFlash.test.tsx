// @vitest-environment happy-dom

/**
 * Component tests for the PromptScaffoldModal copy-flash behavior (Task #189).
 *
 * Covers the emerald-tint feedback on the preview toggle bar and the in-preview
 * copy button that fires when the user copies a prompt scaffold format.
 *
 * Two copy paths are exercised:
 *   A. Main card copy button (card body — always visible)
 *   B. In-preview copy button (inside the expanded preview panel)
 *
 * Each path asserts:
 *   1. Toggle bar for the copied format gains emerald CSS classes.
 *   2. In-preview copy button gains emerald styling while the flash is active.
 *   3. onClose() is called after the 1200 ms flash + 150 ms animation (fake timers).
 *
 * The companion Playwright e2e test (e2e/promptScaffoldCopyFlash.spec.ts) covers
 * the same behaviors against the running app.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { fireEvent } from "@testing-library/dom";
import { act, createElement } from "react";
import { PromptScaffoldModal } from "@/components/PromptScaffoldModal";

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

/**
 * Finds the preview toggle-bar button for a given badge label.
 * aria-label = "Preview <badge> scaffold" (when panel is closed).
 */
function getToggleBar(container: HTMLElement, badge: string): HTMLButtonElement {
  const allButtons = Array.from(container.querySelectorAll<HTMLButtonElement>("button"));
  const btn = allButtons.find((b) => b.getAttribute("aria-label") === `Preview ${badge} scaffold`);
  if (!btn) throw new Error(`Toggle bar for "${badge}" not found`);
  return btn;
}

/**
 * Finds the in-preview copy button for a given badge label.
 * aria-label = "Copy <badge> scaffold".
 */
function getInPreviewCopy(container: HTMLElement, badge: string): HTMLButtonElement {
  const allButtons = Array.from(container.querySelectorAll<HTMLButtonElement>("button"));
  const btn = allButtons.find((b) => b.getAttribute("aria-label") === `Copy ${badge} scaffold`);
  if (!btn) throw new Error(`In-preview copy button for "${badge}" not found`);
  return btn;
}

/**
 * Returns the main card copy button that is NOT the toggle bar.
 * The copy button has `text-left` in its class; toggle bars have `items-center justify-between`.
 */
function getMainCopyButton(container: HTMLElement, badge: string): HTMLButtonElement {
  const allButtons = Array.from(container.querySelectorAll<HTMLButtonElement>("button"));
  const btn = allButtons.find(
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
// Path A — main card copy button
// ---------------------------------------------------------------------------

describe("PromptScaffoldModal — Path A: main card copy button", () => {
  it("toggle bar for the copied format gains emerald class when copy fires", async () => {
    const props = buildProps();
    const { container } = render(createElement(PromptScaffoldModal, props));

    const bar = getToggleBar(container, "Format A");
    expect(bar.className).not.toMatch(/emerald/);

    const copyBtn = getMainCopyButton(container, "Format A");
    await act(async () => {
      fireEvent.click(copyBtn);
    });

    // After the async onCopy resolves and setCopiedFormat fires, the toggle bar
    // must have emerald classes.
    expect(bar.className).toMatch(/bg-emerald-500/);
    expect(bar.className).toMatch(/text-emerald-/);
    expect(bar.className).toMatch(/border-emerald-500/);
  });

  it("toggle bar for the NOT-copied format does NOT gain emerald class", async () => {
    const props = buildProps();
    const { container } = render(createElement(PromptScaffoldModal, props));

    // Copy Format A; Format B's toggle bar must stay default.
    const copyBtn = getMainCopyButton(container, "Format A");
    await act(async () => {
      fireEvent.click(copyBtn);
    });

    const barB = getToggleBar(container, "Format B");
    expect(barB.className).not.toMatch(/bg-emerald-500/);
  });

  it("onClose is called after the 1200 ms flash + 150 ms animation", async () => {
    const onClose = vi.fn();
    const props = buildProps({ onClose });
    const { container } = render(createElement(PromptScaffoldModal, props));

    const copyBtn = getMainCopyButton(container, "Format A");
    await act(async () => {
      fireEvent.click(copyBtn);
    });

    // Flash is active; onClose not yet called.
    expect(onClose).not.toHaveBeenCalled();

    // Advance past the 1200 ms flash timeout.
    await act(async () => {
      vi.advanceTimersByTime(1200);
    });

    // Advance past the 150 ms close animation.
    await act(async () => {
      vi.advanceTimersByTime(150);
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("main card copy button is disabled while a flash is in progress", async () => {
    const props = buildProps();
    const { container } = render(createElement(PromptScaffoldModal, props));

    const copyBtnA = getMainCopyButton(container, "Format A");
    await act(async () => {
      fireEvent.click(copyBtnA);
    });

    // All main copy buttons are disabled while copiedFormat !== null.
    const allDisabledCopyBtns = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button.text-left")
    ).every((btn) => btn.disabled);
    expect(allDisabledCopyBtns).toBe(true);
  });

  it("main copy button shows 'Copied' check indicator while flash is active", async () => {
    const props = buildProps();
    const { container } = render(createElement(PromptScaffoldModal, props));

    const copyBtnA = getMainCopyButton(container, "Format A");
    await act(async () => {
      fireEvent.click(copyBtnA);
    });

    // After act() completes, React has re-rendered with setCopiedFormat(format).
    // The button text includes "Copied" while copiedFormat is set.
    expect(copyBtnA.textContent).toContain("Copied");
  });
});

// ---------------------------------------------------------------------------
// Path B — in-preview copy button (inside the expanded preview panel)
// ---------------------------------------------------------------------------

describe("PromptScaffoldModal — Path B: in-preview copy button", () => {
  it("in-preview copy button is hidden before the panel is opened", () => {
    const props = buildProps();
    const { container } = render(createElement(PromptScaffoldModal, props));

    const allButtons = Array.from(container.querySelectorAll<HTMLButtonElement>("button"));
    const inPreviewBtn = allButtons.find(
      (b) => b.getAttribute("aria-label") === "Copy Format A scaffold"
    );
    expect(inPreviewBtn).toBeUndefined();
  });

  it("in-preview copy button becomes visible after toggling the preview panel", () => {
    const props = buildProps();
    const { container } = render(createElement(PromptScaffoldModal, props));

    const bar = getToggleBar(container, "Format A");
    fireEvent.click(bar);

    const inPreviewBtn = getInPreviewCopy(container, "Format A");
    expect(inPreviewBtn).toBeDefined();
  });

  it("toggle bar gains emerald class after clicking the in-preview copy button", async () => {
    const props = buildProps();
    const { container } = render(createElement(PromptScaffoldModal, props));

    // Open the preview panel.
    const bar = getToggleBar(container, "Format A");
    fireEvent.click(bar);

    const inPreviewBtn = getInPreviewCopy(container, "Format A");
    await act(async () => {
      fireEvent.click(inPreviewBtn);
    });

    // The toggle bar (now with aria-label "Hide preview for Format A" because
    // it was open before the copy; after copy the aria-label might differ)
    // must have emerald class.
    const barAfter = container.querySelector<HTMLButtonElement>('button[class*="bg-emerald-500"]');
    expect(barAfter).not.toBeNull();
    expect(barAfter!.className).toMatch(/bg-emerald-500/);
  });

  it("in-preview copy button gains emerald styling while flash is active", async () => {
    const props = buildProps();
    const { container } = render(createElement(PromptScaffoldModal, props));

    // Open the preview panel.
    fireEvent.click(getToggleBar(container, "Format A"));

    const inPreviewBtn = getInPreviewCopy(container, "Format A");
    await act(async () => {
      fireEvent.click(inPreviewBtn);
    });

    // The in-preview copy button aria-label changes to "Copied Format A scaffold"
    // while the flash is active.
    const allButtons = Array.from(container.querySelectorAll<HTMLButtonElement>("button"));
    const copiedBtn = allButtons.find(
      (b) => b.getAttribute("aria-label") === "Copied Format A scaffold"
    );
    expect(copiedBtn).toBeDefined();
    expect(copiedBtn!.className).toMatch(/bg-emerald-500/);
  });

  it("onClose is called after the 1200 ms flash + 150 ms animation (in-preview path)", async () => {
    const onClose = vi.fn();
    const props = buildProps({ onClose });
    const { container } = render(createElement(PromptScaffoldModal, props));

    // Open the Format B preview panel.
    fireEvent.click(getToggleBar(container, "Format B"));

    const inPreviewBtn = getInPreviewCopy(container, "Format B");
    await act(async () => {
      fireEvent.click(inPreviewBtn);
    });

    expect(onClose).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(1200);
    });
    await act(async () => {
      vi.advanceTimersByTime(150);
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
