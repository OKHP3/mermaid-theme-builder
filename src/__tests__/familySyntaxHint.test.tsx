// @vitest-environment happy-dom

/**
 * Tests for the FamilySyntaxHint component and the familySyntaxHints storage
 * helpers (dismissHint, isHintDismissed, clearAllDismissals).
 *
 * Behaviors covered:
 *   1. The hint panel renders for every family present in the HINTS registry:
 *      gantt, pie, mindmap, erDiagram, classDiagram, stateDiagram,
 *      sequenceDiagram, block, timeline.
 *   2. The hint panel does NOT render for families absent from the HINTS
 *      registry: "flowchart", "unknown", "gitGraph", "journey".
 *   3. Clicking the dismiss button hides the panel and writes the dismissal
 *      flag to localStorage under "mtb.hint-dismissed.<family>".
 *   4. A family already marked dismissed in localStorage starts hidden.
 *   5. A resetToken change on the same mounted instance re-evaluates the
 *      dismissed state from localStorage.
 *   6. clearAllDismissals() removes every "mtb.hint-dismissed.*" key from
 *      localStorage without touching unrelated keys.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
import { fireEvent } from "@testing-library/dom";
import { createElement } from "react";
import { FamilySyntaxHint } from "@/components/FamilySyntaxHint";
import { clearAllDismissals, dismissHint, isHintDismissed } from "@/lib/familySyntaxHints";
import type { DiagramFamily } from "@/data/mermaid-capabilities";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderHint(family: DiagramFamily, resetToken?: number) {
  return render(createElement(FamilySyntaxHint, { family, resetToken }));
}

function hintIsVisible(): boolean {
  return screen.queryByRole("note") !== null;
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  localStorage.clear();
});

// ---------------------------------------------------------------------------
// 1. Families that have a registered hint — panel should render
// ---------------------------------------------------------------------------

describe("FamilySyntaxHint — renders for supported families", () => {
  const SUPPORTED_FAMILIES: DiagramFamily[] = [
    "flowchart",
    "gantt",
    "pie",
    "mindmap",
    "erDiagram",
    "classDiagram",
    "stateDiagram",
    "sequenceDiagram",
    "block",
    "timeline",
    "xychart",
    "quadrantChart",
    "sankey",
  ];

  for (const family of SUPPORTED_FAMILIES) {
    it(`renders the hint panel for "${family}"`, () => {
      renderHint(family);
      expect(hintIsVisible()).toBe(true);
    });
  }

  it('hint panel for "gantt" carries the correct aria-label', () => {
    renderHint("gantt");
    expect(screen.getByRole("note").getAttribute("aria-label")).toBe("Syntax tips for gantt");
  });

  it('hint panel for "sequenceDiagram" carries the correct aria-label', () => {
    renderHint("sequenceDiagram");
    expect(screen.getByRole("note").getAttribute("aria-label")).toBe(
      "Syntax tips for sequenceDiagram"
    );
  });
});

// ---------------------------------------------------------------------------
// 2. Families without a registered hint — panel should NOT render
// ---------------------------------------------------------------------------

describe("FamilySyntaxHint — does not render for unsupported families", () => {
  const UNSUPPORTED_FAMILIES: DiagramFamily[] = ["unknown", "gitGraph", "journey"];

  for (const family of UNSUPPORTED_FAMILIES) {
    it(`returns null for "${family}"`, () => {
      renderHint(family);
      expect(hintIsVisible()).toBe(false);
    });
  }
});

// ---------------------------------------------------------------------------
// 3. Dismissal — clicking the dismiss button hides the panel and persists
// ---------------------------------------------------------------------------

describe("FamilySyntaxHint — dismiss behavior", () => {
  it("hides the panel when the dismiss button is clicked", async () => {
    renderHint("gantt");
    expect(hintIsVisible()).toBe(true);

    const dismissBtn = screen.getByRole("button", {
      name: "Dismiss gantt syntax tip",
    });
    await act(async () => {
      fireEvent.click(dismissBtn);
    });

    expect(hintIsVisible()).toBe(false);
  });

  it("writes the dismissal flag to localStorage", async () => {
    renderHint("pie");
    const dismissBtn = screen.getByRole("button", {
      name: "Dismiss pie syntax tip",
    });
    await act(async () => {
      fireEvent.click(dismissBtn);
    });

    expect(localStorage.getItem("mtb.hint-dismissed.pie")).toBe("1");
  });

  it("dismissal for one family does not hide hints for other families", async () => {
    renderHint("gantt");
    const dismissBtn = screen.getByRole("button", {
      name: "Dismiss gantt syntax tip",
    });
    await act(async () => {
      fireEvent.click(dismissBtn);
    });

    cleanup();

    renderHint("sequenceDiagram");
    expect(hintIsVisible()).toBe(true);
  });

  it("fires the optional onDismiss callback", async () => {
    const onDismiss = vi.fn();
    render(createElement(FamilySyntaxHint, { family: "classDiagram", onDismiss }));
    const dismissBtn = screen.getByRole("button", {
      name: "Dismiss classDiagram syntax tip",
    });
    await act(async () => {
      fireEvent.click(dismissBtn);
    });

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// 4. Pre-dismissed via localStorage — component starts hidden
// ---------------------------------------------------------------------------

describe("FamilySyntaxHint — pre-dismissed state", () => {
  it("starts hidden when the family is already dismissed in localStorage", () => {
    localStorage.setItem("mtb.hint-dismissed.erDiagram", "1");
    renderHint("erDiagram");
    expect(hintIsVisible()).toBe(false);
  });

  it("starts hidden for sequenceDiagram when pre-dismissed", () => {
    localStorage.setItem("mtb.hint-dismissed.sequenceDiagram", "1");
    renderHint("sequenceDiagram");
    expect(hintIsVisible()).toBe(false);
  });

  it("renders normally for a different family even when another is pre-dismissed", () => {
    localStorage.setItem("mtb.hint-dismissed.gantt", "1");
    renderHint("mindmap");
    expect(hintIsVisible()).toBe(true);
  });

  it("pre-dismissed localStorage key for an unsupported family has no effect (still returns null)", () => {
    localStorage.setItem("mtb.hint-dismissed.unknown", "1");
    renderHint("unknown");
    expect(hintIsVisible()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 5. resetToken re-evaluates dismissed state on the same mounted instance
// ---------------------------------------------------------------------------

describe("FamilySyntaxHint — resetToken re-evaluates dismissed state", () => {
  it("re-shows the hint when the dismissal flag is cleared before a resetToken bump", async () => {
    const { rerender } = renderHint("timeline", 0);
    expect(hintIsVisible()).toBe(true);

    const dismissBtn = screen.getByRole("button", {
      name: "Dismiss timeline syntax tip",
    });
    await act(async () => {
      fireEvent.click(dismissBtn);
    });
    expect(hintIsVisible()).toBe(false);
    expect(localStorage.getItem("mtb.hint-dismissed.timeline")).toBe("1");

    localStorage.removeItem("mtb.hint-dismissed.timeline");

    act(() => {
      rerender(createElement(FamilySyntaxHint, { family: "timeline", resetToken: 1 }));
    });

    expect(hintIsVisible()).toBe(true);
  });

  it("keeps the panel hidden when the dismissal flag is still set on resetToken bump", async () => {
    const { rerender } = renderHint("block", 0);

    const dismissBtn = screen.getByRole("button", {
      name: "Dismiss block syntax tip",
    });
    await act(async () => {
      fireEvent.click(dismissBtn);
    });
    expect(hintIsVisible()).toBe(false);

    act(() => {
      rerender(createElement(FamilySyntaxHint, { family: "block", resetToken: 1 }));
    });

    expect(hintIsVisible()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 6. clearAllDismissals — removes all mtb.hint-dismissed.* keys
// ---------------------------------------------------------------------------

describe("clearAllDismissals — removes all dismissal keys from localStorage", () => {
  it("removes a single dismissal key", () => {
    localStorage.setItem("mtb.hint-dismissed.gantt", "1");
    clearAllDismissals();
    expect(localStorage.getItem("mtb.hint-dismissed.gantt")).toBeNull();
  });

  it("removes multiple dismissal keys in one call", () => {
    localStorage.setItem("mtb.hint-dismissed.gantt", "1");
    localStorage.setItem("mtb.hint-dismissed.pie", "1");
    localStorage.setItem("mtb.hint-dismissed.sequenceDiagram", "1");
    clearAllDismissals();
    expect(localStorage.getItem("mtb.hint-dismissed.gantt")).toBeNull();
    expect(localStorage.getItem("mtb.hint-dismissed.pie")).toBeNull();
    expect(localStorage.getItem("mtb.hint-dismissed.sequenceDiagram")).toBeNull();
  });

  it("does not remove unrelated localStorage keys", () => {
    localStorage.setItem("some-unrelated-key", "value");
    localStorage.setItem("mtb.hint-dismissed.gantt", "1");
    clearAllDismissals();
    expect(localStorage.getItem("some-unrelated-key")).toBe("value");
  });

  it("does not throw when there are no dismissal keys to remove", () => {
    expect(() => clearAllDismissals()).not.toThrow();
  });

  it("isHintDismissed returns false for all previously dismissed families after clearAllDismissals", () => {
    dismissHint("gantt");
    dismissHint("pie");
    expect(isHintDismissed("gantt")).toBe(true);
    expect(isHintDismissed("pie")).toBe(true);

    clearAllDismissals();

    expect(isHintDismissed("gantt")).toBe(false);
    expect(isHintDismissed("pie")).toBe(false);
  });
});
