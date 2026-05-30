// @vitest-environment happy-dom

/**
 * Tests for the PromptScaffoldModal renderer constraint callouts (Task #250).
 *
 * Two layers of coverage:
 *
 *   A. Direct unit tests for getRendererConstraints() — exercises all 8
 *      possible output strings by passing crafted RendererProfile stubs.
 *      This covers the two "none" variants (%%{init}%% not supported,
 *      theme variables not supported) that no real renderer profile has.
 *
 *   B. Rendered integration tests — render the real PromptScaffoldModal with
 *      real renderer IDs and assert the amber callout appears/disappears and
 *      contains the expected constraint text.
 *
 * Renderer profile facts used in section B (from src/data/renderer-parity.ts):
 *   mermaid-live — all "full"                             → 0 constraints
 *   github       — init: full, theme: full, css: none, font: none → 2 constraints
 *   notion       — init: partial, theme: partial, css: none, font: none → 4 constraints
 *   obsidian     — init: full, theme: full, css: partial, font: partial → 2 constraints
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { createElement } from "react";
import { PromptScaffoldModal } from "@/components/PromptScaffoldModal";
import { getRendererConstraints } from "@/data/renderer-parity";
import type { RendererProfile } from "@/data/renderer-parity";

// ---------------------------------------------------------------------------
// Minimal RendererProfile stub factory
// ---------------------------------------------------------------------------

function makeProfile(overrides: Partial<RendererProfile> = {}): RendererProfile {
  return {
    id: "test",
    displayName: "Test",
    shortName: "Test",
    url: "",
    sourceUrl: "",
    notes: "",
    looksSupported: { classic: "full", neo: "full", handDrawn: "full" },
    initDirectiveSupport: "full",
    themeVariableSupport: "full",
    classDefSupport: "full",
    cssInjectionSupport: "full",
    customFontSupport: "full",
    mermaidVersionApprox: "",
    caveats: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Shared fixtures for rendered tests
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

/**
 * Returns all constraint callout `<p>` elements in the container.
 * Each callout paragraph carries `text-amber-700` as a Tailwind class.
 * When constraints are present, one callout appears per format card (3 total).
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

// ===========================================================================
// A. Direct unit tests for getRendererConstraints — all 8 output strings
// ===========================================================================

describe("getRendererConstraints — all 8 constraint strings", () => {
  it("returns empty array when all supports are 'full'", () => {
    expect(getRendererConstraints(makeProfile())).toEqual([]);
  });

  it("emits '%%{init}%% not supported' when initDirectiveSupport is 'none'", () => {
    const result = getRendererConstraints(makeProfile({ initDirectiveSupport: "none" }));
    expect(result).toContain("%%{init}%% not supported");
    expect(result).not.toContain("%%{init}%% support partial");
  });

  it("emits '%%{init}%% support partial' when initDirectiveSupport is 'partial'", () => {
    const result = getRendererConstraints(makeProfile({ initDirectiveSupport: "partial" }));
    expect(result).toContain("%%{init}%% support partial");
    expect(result).not.toContain("%%{init}%% not supported");
  });

  it("emits 'theme variables not supported' when themeVariableSupport is 'none'", () => {
    const result = getRendererConstraints(makeProfile({ themeVariableSupport: "none" }));
    expect(result).toContain("theme variables not supported");
    expect(result).not.toContain("theme variables partial");
  });

  it("emits 'theme variables partial' when themeVariableSupport is 'partial'", () => {
    const result = getRendererConstraints(makeProfile({ themeVariableSupport: "partial" }));
    expect(result).toContain("theme variables partial");
    expect(result).not.toContain("theme variables not supported");
  });

  it("emits 'CSS injection not supported' when cssInjectionSupport is 'none'", () => {
    const result = getRendererConstraints(makeProfile({ cssInjectionSupport: "none" }));
    expect(result).toContain("CSS injection not supported");
    expect(result).not.toContain("CSS injection partial");
  });

  it("emits 'CSS injection partial' when cssInjectionSupport is 'partial'", () => {
    const result = getRendererConstraints(makeProfile({ cssInjectionSupport: "partial" }));
    expect(result).toContain("CSS injection partial");
    expect(result).not.toContain("CSS injection not supported");
  });

  it("emits 'custom fonts blocked' when customFontSupport is 'none'", () => {
    const result = getRendererConstraints(makeProfile({ customFontSupport: "none" }));
    expect(result).toContain("custom fonts blocked");
    expect(result).not.toContain("custom fonts limited");
  });

  it("emits 'custom fonts limited' when customFontSupport is 'partial'", () => {
    const result = getRendererConstraints(makeProfile({ customFontSupport: "partial" }));
    expect(result).toContain("custom fonts limited");
    expect(result).not.toContain("custom fonts blocked");
  });

  it("emits all 4 strings when every support field is 'none'", () => {
    const result = getRendererConstraints(
      makeProfile({
        initDirectiveSupport: "none",
        themeVariableSupport: "none",
        cssInjectionSupport: "none",
        customFontSupport: "none",
      })
    );
    expect(result).toEqual([
      "%%{init}%% not supported",
      "theme variables not supported",
      "CSS injection not supported",
      "custom fonts blocked",
    ]);
  });

  it("emits all 4 strings when every support field is 'partial'", () => {
    const result = getRendererConstraints(
      makeProfile({
        initDirectiveSupport: "partial",
        themeVariableSupport: "partial",
        cssInjectionSupport: "partial",
        customFontSupport: "partial",
      })
    );
    expect(result).toEqual([
      "%%{init}%% support partial",
      "theme variables partial",
      "CSS injection partial",
      "custom fonts limited",
    ]);
  });

  it("preserves order: init → theme → css → font", () => {
    const result = getRendererConstraints(
      makeProfile({
        initDirectiveSupport: "partial",
        themeVariableSupport: "none",
        cssInjectionSupport: "partial",
        customFontSupport: "none",
      })
    );
    expect(result).toEqual([
      "%%{init}%% support partial",
      "theme variables not supported",
      "CSS injection partial",
      "custom fonts blocked",
    ]);
  });
});

// ===========================================================================
// B. Rendered integration tests — callout appearance in the modal UI
// ===========================================================================

describe("PromptScaffoldModal — no constraint callout for empty renderer target", () => {
  it("no amber callout paragraph when rendererTarget is empty string", () => {
    const { container } = render(createElement(PromptScaffoldModal, buildProps()));
    expect(getConstraintCallouts(container)).toHaveLength(0);
  });
});

describe("PromptScaffoldModal — no callout for mermaid-live (all full)", () => {
  it("no callout paragraph when all renderer features are 'full'", () => {
    const { container } = render(
      createElement(PromptScaffoldModal, buildProps({ rendererTarget: "mermaid-live" }))
    );
    expect(getConstraintCallouts(container)).toHaveLength(0);
  });
});

describe("PromptScaffoldModal — github renderer constraint callouts", () => {
  it("renders one callout per format card (3 total) when renderer has constraints", () => {
    const { container } = render(
      createElement(PromptScaffoldModal, buildProps({ rendererTarget: "github" }))
    );
    expect(getConstraintCallouts(container)).toHaveLength(3);
  });

  it("callout text contains the renderer shortName 'GitHub:'", () => {
    const { container } = render(
      createElement(PromptScaffoldModal, buildProps({ rendererTarget: "github" }))
    );
    expect(getConstraintCallouts(container)[0].textContent).toContain("GitHub:");
  });

  it("callout lists 'CSS injection not supported · custom fonts blocked' joined by ' · '", () => {
    const { container } = render(
      createElement(PromptScaffoldModal, buildProps({ rendererTarget: "github" }))
    );
    expect(getConstraintCallouts(container)[0].textContent).toContain(
      "CSS injection not supported · custom fonts blocked"
    );
  });

  it("all three callout paragraphs show identical constraint text", () => {
    const { container } = render(
      createElement(PromptScaffoldModal, buildProps({ rendererTarget: "github" }))
    );
    const texts = getConstraintCallouts(container).map((p) => p.textContent);
    expect(texts[0]).toBe(texts[1]);
    expect(texts[1]).toBe(texts[2]);
  });
});

describe("PromptScaffoldModal — notion renderer: 4 constraints via real profile", () => {
  it("callout contains all 4 notion constraint strings joined in order", () => {
    const { container } = render(
      createElement(PromptScaffoldModal, buildProps({ rendererTarget: "notion" }))
    );
    const text = getConstraintCallouts(container)[0].textContent ?? "";
    expect(text).toContain("%%{init}%% support partial");
    expect(text).toContain("theme variables partial");
    expect(text).toContain("CSS injection not supported");
    expect(text).toContain("custom fonts blocked");
  });

  it("callout shortName is 'Notion:'", () => {
    const { container } = render(
      createElement(PromptScaffoldModal, buildProps({ rendererTarget: "notion" }))
    );
    expect(getConstraintCallouts(container)[0].textContent).toContain("Notion:");
  });
});

describe("PromptScaffoldModal — obsidian renderer: partial constraint variants", () => {
  it("callout contains 'CSS injection partial · custom fonts limited'", () => {
    const { container } = render(
      createElement(PromptScaffoldModal, buildProps({ rendererTarget: "obsidian" }))
    );
    expect(getConstraintCallouts(container)[0].textContent).toContain(
      "CSS injection partial · custom fonts limited"
    );
  });
});
