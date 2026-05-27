// @vitest-environment happy-dom

/**
 * Integration tests: gear-icon settings menu in AppShell header (Task #273).
 *
 * Behaviors covered:
 *   1. The gear/settings button is present and accessible in the header.
 *   2. Clicking the button opens the settings popover containing the
 *      "Reset all syntax tips" menu item.
 *   3. Clicking "Reset all syntax tips" calls clearAllDismissals, shows the
 *      "Syntax tips restored." toast, and closes the popover.
 */

// vi.mock calls are hoisted by vitest — must appear before any imports.
import { vi, describe, it, expect, afterEach, beforeAll } from "vitest";

vi.mock("mermaid", () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn().mockResolvedValue({ svg: "<svg><g></g></svg>", bindFunctions: undefined }),
  },
}));

vi.mock("@/components/PaletteSelectorBar", () => ({
  PaletteSelectorBar: () => null,
}));

const { clearAllDismissalsMock } = vi.hoisted(() => ({
  clearAllDismissalsMock: vi.fn(),
}));

vi.mock("@/lib/family-syntax-hints", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/family-syntax-hints")>();
  return { ...original, clearAllDismissals: clearAllDismissalsMock };
});

import { render, screen, cleanup, act } from "@testing-library/react";
import { fireEvent } from "@testing-library/dom";
import { createElement } from "react";
import { AppShell } from "@/App";

// ---------------------------------------------------------------------------
// Suppress happy-dom navigation warnings triggered by AppShell writing to
// window.location.hash in a useEffect. These are benign in tests.
// ---------------------------------------------------------------------------
beforeAll(() => {
  vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
    const msg = String(args[0] ?? "");
    if (msg.includes("navigation") || msg.includes("Not implemented")) return;
    console.warn("[test error]", ...args);
  });
});

afterEach(() => {
  cleanup();
  clearAllDismissalsMock.mockClear();
  localStorage.clear();
});

// ---------------------------------------------------------------------------
// 1. Gear button presence and accessibility
// ---------------------------------------------------------------------------

describe("AppShell settings menu — gear button", () => {
  it("renders a settings button with aria-label='Settings' in the header", () => {
    render(createElement(AppShell));
    const btn = screen.getByRole("button", { name: "Settings" });
    expect(btn).toBeDefined();
  });

  it("settings button declares aria-haspopup='menu'", () => {
    render(createElement(AppShell));
    const btn = screen.getByRole("button", { name: "Settings" });
    expect(btn.getAttribute("aria-haspopup")).toBe("menu");
  });

  it("settings button is not expanded on initial render", () => {
    render(createElement(AppShell));
    const btn = screen.getByRole("button", { name: "Settings" });
    expect(btn.getAttribute("aria-expanded")).toBe("false");
  });
});

// ---------------------------------------------------------------------------
// 2. Popover opens on click and contains the expected menu item
// ---------------------------------------------------------------------------

describe("AppShell settings menu — popover", () => {
  it("settings menu is not present before the button is clicked", () => {
    render(createElement(AppShell));
    expect(screen.queryByRole("menu", { name: "Settings" })).toBeNull();
  });

  it("opens a role=menu popover when the settings button is clicked", async () => {
    render(createElement(AppShell));
    const btn = screen.getByRole("button", { name: "Settings" });

    await act(async () => {
      fireEvent.click(btn);
    });

    expect(screen.getByRole("menu", { name: "Settings" })).toBeDefined();
  });

  it("popover contains a 'Reset all syntax tips' menu item", async () => {
    render(createElement(AppShell));
    const btn = screen.getByRole("button", { name: "Settings" });

    await act(async () => {
      fireEvent.click(btn);
    });

    const item = screen.getByRole("menuitem", { name: /reset all syntax tips/i });
    expect(item).toBeDefined();
  });

  it("settings button reports aria-expanded='true' while the menu is open", async () => {
    render(createElement(AppShell));
    const btn = screen.getByRole("button", { name: "Settings" });

    await act(async () => {
      fireEvent.click(btn);
    });

    expect(btn.getAttribute("aria-expanded")).toBe("true");
  });
});

// ---------------------------------------------------------------------------
// 3. "Reset all syntax tips" action
// ---------------------------------------------------------------------------

describe("AppShell settings menu — Reset all syntax tips", () => {
  async function openMenuAndClickReset() {
    const btn = screen.getByRole("button", { name: "Settings" });
    await act(async () => {
      fireEvent.click(btn);
    });
    const item = screen.getByRole("menuitem", { name: /reset all syntax tips/i });
    await act(async () => {
      fireEvent.click(item);
    });
  }

  it("calls clearAllDismissals when 'Reset all syntax tips' is clicked", async () => {
    render(createElement(AppShell));
    await openMenuAndClickReset();
    expect(clearAllDismissalsMock).toHaveBeenCalledTimes(1);
  });

  it("shows the 'Syntax tips restored.' toast after clicking 'Reset all syntax tips'", async () => {
    render(createElement(AppShell));
    await openMenuAndClickReset();
    const toast = screen.getByRole("status");
    expect(toast.textContent).toContain("Syntax tips restored.");
  });

  it("closes the settings menu after clicking 'Reset all syntax tips'", async () => {
    render(createElement(AppShell));
    await openMenuAndClickReset();
    expect(screen.queryByRole("menu", { name: "Settings" })).toBeNull();
  });
});
