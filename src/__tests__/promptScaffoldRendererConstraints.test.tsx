// @vitest-environment happy-dom

/**
 * Tests for the PromptScaffoldModal renderer constraint callouts (Task #250).
 *
 * When a `rendererTarget` is selected, an amber callout appears below each
 * format card listing the renderer's limitations (e.g. "CSS injection not
 * supported", "custom fonts blocked"). This suite verifies:
 *
 *   1. No callout when `rendererTarget` is empty (generic mode).
 *   2. No callout for a fully-supported renderer (mermaid-live — all "full").
 *   3. Callout appears on every format card when the renderer has constraints.
 *   4. The callout text contains the renderer's `shortName`.
 *   5. All 4 "none"-variant constraint strings surface via the notion renderer,
 *      covering every reachable constraint message from getRendererConstraints.
 *   6. The two "partial"-variant strings surface via the obsidian renderer
 *      ("CSS injection partial", "custom fonts limited").
 *   7. Constraints are joined with the " · " separator.
 *
 * Renderer profile facts used below (from src/data/renderer-parity.ts):
 *   github   — init: full, theme: full, css: none, font: none  → 2 constraints
 *   notion   — init: partial, theme: partial, css: none, font: none → 4 constraints
 *   obsidian — init: full, theme: full, css: partial, font: partial → 2 constraints
 *   mermaid-live — all full → 0 constraints
 *
 * Note: no current renderer profile sets initDirectiveSupport or
 * themeVariableSupport to "none", so those two constraint strings
 * ("%%{init}%% not supported", "theme variables not supported") can only be
 * exercised via unit-testing getRendererConstraints directly if it is ever
 * exported. The partial variants are covered via notion/confluence.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { createElement } from "react";
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
 * Returns all constraint callout `<p>` elements visible in the container.
 * Each callout `<p>` uses `text-amber-700` which is unique to the callout.
 * When constraints are present, there is one callout per format card (3 total).
 */
function getConstraintCallouts(container: HTMLElement): HTMLParagraphElement[] {
  return Array.from(container.querySelectorAll<HTMLParagraphElement>("p")).filter((p) =>
    p.className.includes("amber-700")
  );
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
// 1. No callout when rendererTarget is empty (generic mode)
// ---------------------------------------------------------------------------

describe("PromptScaffoldModal — no constraint callout for empty renderer target", () => {
  it("no amber callout paragraph when rendererTarget is empty string", () => {
    const { container } = render(createElement(PromptScaffoldModal, buildProps()));
    expect(getConstraintCallouts(container)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 2. No callout for a fully-supported renderer (mermaid-live)
// ---------------------------------------------------------------------------

describe("PromptScaffoldModal — no callout for mermaid-live (all full)", () => {
  it("no callout paragraph when all renderer features are 'full'", () => {
    const { container } = render(
      createElement(PromptScaffoldModal, buildProps({ rendererTarget: "mermaid-live" }))
    );
    expect(getConstraintCallouts(container)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 3 & 4. GitHub renderer — callout present, one per card, contains shortName
// ---------------------------------------------------------------------------

describe("PromptScaffoldModal — github renderer constraint callouts", () => {
  it("renders one callout per format card (3 total) when renderer has constraints", () => {
    const { container } = render(
      createElement(PromptScaffoldModal, buildProps({ rendererTarget: "github" }))
    );
    // One callout per FORMAT_OPTIONS entry (formatA, formatB, both).
    expect(getConstraintCallouts(container)).toHaveLength(3);
  });

  it("callout text starts with the renderer shortName 'GitHub:'", () => {
    const { container } = render(
      createElement(PromptScaffoldModal, buildProps({ rendererTarget: "github" }))
    );
    const callout = getConstraintCallouts(container)[0];
    expect(callout.textContent).toContain("GitHub:");
  });

  it("callout lists 'CSS injection not supported' for github", () => {
    const { container } = render(
      createElement(PromptScaffoldModal, buildProps({ rendererTarget: "github" }))
    );
    expect(getConstraintCallouts(container)[0].textContent).toContain(
      "CSS injection not supported"
    );
  });

  it("callout lists 'custom fonts blocked' for github", () => {
    const { container } = render(
      createElement(PromptScaffoldModal, buildProps({ rendererTarget: "github" }))
    );
    expect(getConstraintCallouts(container)[0].textContent).toContain("custom fonts blocked");
  });

  it("constraints are joined with ' · ' separator", () => {
    const { container } = render(
      createElement(PromptScaffoldModal, buildProps({ rendererTarget: "github" }))
    );
    // github has exactly 2 constraints so they are separated by ' · '.
    expect(getConstraintCallouts(container)[0].textContent).toContain(
      "CSS injection not supported · custom fonts blocked"
    );
  });

  it("all three callout paragraphs show identical constraint text", () => {
    const { container } = render(
      createElement(PromptScaffoldModal, buildProps({ rendererTarget: "github" }))
    );
    const callouts = getConstraintCallouts(container);
    const texts = callouts.map((p) => p.textContent);
    expect(texts[0]).toBe(texts[1]);
    expect(texts[1]).toBe(texts[2]);
  });
});

// ---------------------------------------------------------------------------
// 5. Notion renderer — all 4 constraint string types (covers every
//    reachable message from getRendererConstraints with real profiles)
// ---------------------------------------------------------------------------

describe("PromptScaffoldModal — notion renderer: all 4 constraint message types", () => {
  it("callout contains '%%{init}%% support partial' (partial initDirectiveSupport)", () => {
    const { container } = render(
      createElement(PromptScaffoldModal, buildProps({ rendererTarget: "notion" }))
    );
    expect(getConstraintCallouts(container)[0].textContent).toContain("%%{init}%% support partial");
  });

  it("callout contains 'theme variables partial' (partial themeVariableSupport)", () => {
    const { container } = render(
      createElement(PromptScaffoldModal, buildProps({ rendererTarget: "notion" }))
    );
    expect(getConstraintCallouts(container)[0].textContent).toContain("theme variables partial");
  });

  it("callout contains 'CSS injection not supported' (none cssInjectionSupport)", () => {
    const { container } = render(
      createElement(PromptScaffoldModal, buildProps({ rendererTarget: "notion" }))
    );
    expect(getConstraintCallouts(container)[0].textContent).toContain(
      "CSS injection not supported"
    );
  });

  it("callout contains 'custom fonts blocked' (none customFontSupport)", () => {
    const { container } = render(
      createElement(PromptScaffoldModal, buildProps({ rendererTarget: "notion" }))
    );
    expect(getConstraintCallouts(container)[0].textContent).toContain("custom fonts blocked");
  });

  it("callout shortName is 'Notion:'", () => {
    const { container } = render(
      createElement(PromptScaffoldModal, buildProps({ rendererTarget: "notion" }))
    );
    expect(getConstraintCallouts(container)[0].textContent).toContain("Notion:");
  });
});

// ---------------------------------------------------------------------------
// 6. Obsidian renderer — "partial" variants of CSS and font constraint strings
// ---------------------------------------------------------------------------

describe("PromptScaffoldModal — obsidian renderer: partial constraint variants", () => {
  it("callout contains 'CSS injection partial' (partial cssInjectionSupport)", () => {
    const { container } = render(
      createElement(PromptScaffoldModal, buildProps({ rendererTarget: "obsidian" }))
    );
    expect(getConstraintCallouts(container)[0].textContent).toContain("CSS injection partial");
  });

  it("callout contains 'custom fonts limited' (partial customFontSupport)", () => {
    const { container } = render(
      createElement(PromptScaffoldModal, buildProps({ rendererTarget: "obsidian" }))
    );
    expect(getConstraintCallouts(container)[0].textContent).toContain("custom fonts limited");
  });
});
