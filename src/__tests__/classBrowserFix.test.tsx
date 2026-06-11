// @vitest-environment happy-dom

/**
 * Interactive tests for the Fix button in ClassBrowser's unrecognized-class
 * warning (Task #316).
 *
 * Verifies that clicking "Fix" calls onApplyFix with the correct (typo,
 * suggestion) arguments. The actual diagram-source mutation is handled by the
 * parent (ReferenceTab.handleApplyFix / applyClassFix); the component contract
 * is simply to invoke the callback with the right pair.
 */

import { vi, describe, it, expect, afterEach } from "vitest";

vi.mock("mermaid", () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn().mockResolvedValue({ svg: "<svg><g></g></svg>", bindFunctions: undefined }),
  },
}));

import { render, screen, cleanup } from "@testing-library/react";
import { fireEvent } from "@testing-library/dom";
import { createElement } from "react";
import { ClassBrowser } from "@/components/ClassBrowser";
import type { ClassDef } from "@/lib/theme-engine";

afterEach(cleanup);

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

describe("ClassBrowser — Fix button click invokes onApplyFix", () => {
  it("calls onApplyFix with (typo, suggestion) when Fix is clicked", () => {
    const spy = vi.fn();
    render(
      createElement(ClassBrowser, {
        classDefs: SAMPLE_CLASS_DEFS,
        supportsClassDef: true,
        // "prmary" is edit-distance 1 from "primary" — a Fix button appears
        usedClassNames: new Set(["prmary"]),
        onApplyFix: spy,
      })
    );

    const fixBtn = screen.getByRole("button", { name: "Fix :::prmary → :::primary" });
    fireEvent.click(fixBtn);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith("prmary", "primary");
  });

  it("renders one Fix button per suggestion when multiple suggestions exist", () => {
    // Both "primar" (dist 1) and "secondary" (dist > 2 → no button) — only "primary"
    // is within the threshold. Use classDefs with names at the same min distance.
    const closeDefs: ClassDef[] = [
      { name: "abc", fill: "#000", stroke: "#000", color: "#fff", extra: "", description: "" },
      { name: "abd", fill: "#000", stroke: "#000", color: "#fff", extra: "", description: "" },
      { name: "abe", fill: "#000", stroke: "#000", color: "#fff", extra: "", description: "" },
    ];
    const spy = vi.fn();
    render(
      createElement(ClassBrowser, {
        classDefs: closeDefs,
        supportsClassDef: true,
        // "abx" has edit distance 1 from abc, abd, abe — all three are at min dist
        usedClassNames: new Set(["abx"]),
        onApplyFix: spy,
      })
    );

    // Three suggestions → three Fix buttons (suggestClassMatch caps at 3)
    const fixBtns = screen.getAllByRole("button", { name: /^Fix :::abx/ });
    expect(fixBtns).toHaveLength(3);

    fireEvent.click(fixBtns[0]);
    expect(spy).toHaveBeenCalledTimes(1);
    // First arg is always the typo
    expect(spy.mock.calls[0][0]).toBe("abx");
  });

  it("does not render Fix buttons when onApplyFix prop is omitted", () => {
    render(
      createElement(ClassBrowser, {
        classDefs: SAMPLE_CLASS_DEFS,
        supportsClassDef: true,
        usedClassNames: new Set(["prmary"]),
        // no onApplyFix
      })
    );

    const fixBtns = screen.queryAllByRole("button", { name: /^Fix :::/ });
    expect(fixBtns).toHaveLength(0);
  });
});
