// @vitest-environment happy-dom

/**
 * Interactive tests for the clickable :::name buttons in the unused-styles
 * info indicator (Task #318).
 *
 * Verifies that:
 *   - Clicking a button writes ":::name" to the clipboard via navigator.clipboard
 *   - The aria-live region announces "Copied :::name" after the click
 *   - Clicking a second unused-name button writes the correct name
 */

import { vi, describe, it, expect, afterEach, beforeEach } from "vitest";

vi.mock("mermaid", () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn().mockResolvedValue({ svg: "<svg><g></g></svg>", bindFunctions: undefined }),
  },
}));

import { render, screen, cleanup, act } from "@testing-library/react";
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

let clipboardWritten: string[] = [];

beforeEach(() => {
  clipboardWritten = [];
  Object.defineProperty(navigator, "clipboard", {
    value: {
      writeText: vi.fn(async (text: string) => {
        clipboardWritten.push(text);
      }),
    },
    writable: true,
    configurable: true,
  });
});

describe("ClassBrowser — unused indicator copy buttons", () => {
  it("clicking an indicator button writes :::name to the clipboard", async () => {
    render(
      createElement(ClassBrowser, {
        classDefs: SAMPLE_CLASS_DEFS,
        supportsClassDef: true,
        usedClassNames: new Set(["primary"]),
      })
    );

    const copyBtn = screen.getByRole("button", { name: "Copy :::secondary" });
    await act(async () => {
      fireEvent.click(copyBtn);
    });

    expect(clipboardWritten).toContain(":::secondary");
  });

  it("the aria-live region announces 'Copied :::name' after the click", async () => {
    render(
      createElement(ClassBrowser, {
        classDefs: SAMPLE_CLASS_DEFS,
        supportsClassDef: true,
        usedClassNames: new Set(["primary"]),
      })
    );

    const liveRegion = screen.getByRole("status");
    expect(liveRegion.textContent).toBe("");

    const copyBtn = screen.getByRole("button", { name: "Copy :::secondary" });
    await act(async () => {
      fireEvent.click(copyBtn);
    });

    expect(liveRegion.textContent).toBe("Copied :::secondary");
  });

  it("clicking the second of two indicator buttons writes the correct name", async () => {
    render(
      createElement(ClassBrowser, {
        classDefs: SAMPLE_CLASS_DEFS,
        supportsClassDef: true,
        usedClassNames: new Set(["ghost"]),
      })
    );

    const primaryBtn = screen.getByRole("button", { name: "Copy :::primary" });
    const secondaryBtn = screen.getByRole("button", { name: "Copy :::secondary" });

    await act(async () => {
      fireEvent.click(secondaryBtn);
    });
    expect(clipboardWritten[clipboardWritten.length - 1]).toBe(":::secondary");

    await act(async () => {
      fireEvent.click(primaryBtn);
    });
    expect(clipboardWritten[clipboardWritten.length - 1]).toBe(":::primary");
  });

  it("the indicator button receives keyboard focus (tabIndex is not -1)", () => {
    render(
      createElement(ClassBrowser, {
        classDefs: SAMPLE_CLASS_DEFS,
        supportsClassDef: true,
        usedClassNames: new Set(["primary"]),
      })
    );

    const copyBtn = screen.getByRole("button", { name: "Copy :::secondary" });
    expect(copyBtn.getAttribute("tabindex")).not.toBe("-1");
  });
});
