// @vitest-environment happy-dom

/**
 * Tests for the ClassBrowser "Fix" button click behavior (Task #402).
 *
 * The unrecognized-class warning renders a Fix button next to each fuzzy
 * suggestion.  Clicking it must invoke onApplyFix(typo, suggestion) so the
 * parent (ReferenceTab) can call inputCode.replaceAll(`:::typo`, `:::suggestion`).
 *
 * This file uses happy-dom + @testing-library/react so button clicks fire real
 * React synthetic events.  HTML-only checks for the button's presence live in
 * classBrowser.test.ts which uses react-dom/server renderToString.
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { fireEvent } from "@testing-library/dom";
import { createElement } from "react";
import { ClassBrowser } from "@/components/ClassBrowser";
import type { ClassDef } from "@/lib/theme-engine";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

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

afterEach(cleanup);

// ---------------------------------------------------------------------------
// Fix button click — onApplyFix callback fires with correct arguments
// ---------------------------------------------------------------------------

describe("ClassBrowser Fix button — onApplyFix callback (Task #402)", () => {
  it("calls onApplyFix(typo, suggestion) when the Fix button is clicked", () => {
    const onApplyFix = vi.fn();

    render(
      createElement(ClassBrowser, {
        classDefs: SAMPLE_CLASS_DEFS,
        supportsClassDef: true,
        // "prmary" is 1 edit away from "primary" — suggestClassMatch returns ["primary"]
        usedClassNames: new Set(["prmary"]),
        onApplyFix,
      })
    );

    const fixBtn = screen.getByRole("button", {
      name: "Fix :::prmary → :::primary",
    });
    fireEvent.click(fixBtn);

    expect(onApplyFix).toHaveBeenCalledOnce();
    expect(onApplyFix).toHaveBeenCalledWith("prmary", "primary");
  });

  it("passes the exact typo string as the first argument", () => {
    const onApplyFix = vi.fn();

    render(
      createElement(ClassBrowser, {
        classDefs: SAMPLE_CLASS_DEFS,
        supportsClassDef: true,
        usedClassNames: new Set(["prmary"]),
        onApplyFix,
      })
    );

    fireEvent.click(screen.getByRole("button", { name: "Fix :::prmary → :::primary" }));

    expect(onApplyFix.mock.calls[0][0]).toBe("prmary");
  });

  it("passes the exact suggestion string as the second argument", () => {
    const onApplyFix = vi.fn();

    render(
      createElement(ClassBrowser, {
        classDefs: SAMPLE_CLASS_DEFS,
        supportsClassDef: true,
        usedClassNames: new Set(["prmary"]),
        onApplyFix,
      })
    );

    fireEvent.click(screen.getByRole("button", { name: "Fix :::prmary → :::primary" }));

    expect(onApplyFix.mock.calls[0][1]).toBe("primary");
  });

  it("calls onApplyFix once per click — not multiple times", () => {
    const onApplyFix = vi.fn();

    render(
      createElement(ClassBrowser, {
        classDefs: SAMPLE_CLASS_DEFS,
        supportsClassDef: true,
        usedClassNames: new Set(["prmary"]),
        onApplyFix,
      })
    );

    const fixBtn = screen.getByRole("button", { name: "Fix :::prmary → :::primary" });
    fireEvent.click(fixBtn);

    expect(onApplyFix).toHaveBeenCalledTimes(1);
  });

  it("fires with the correct typo/suggestion for a different near-typo ('secondry' → 'secondary')", () => {
    const onApplyFix = vi.fn();

    render(
      createElement(ClassBrowser, {
        classDefs: SAMPLE_CLASS_DEFS,
        supportsClassDef: true,
        // "secondry" is 1 edit away from "secondary"
        usedClassNames: new Set(["secondry"]),
        onApplyFix,
      })
    );

    fireEvent.click(screen.getByRole("button", { name: "Fix :::secondry → :::secondary" }));

    expect(onApplyFix).toHaveBeenCalledWith("secondry", "secondary");
  });
});
