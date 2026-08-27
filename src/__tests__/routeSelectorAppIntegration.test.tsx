// @vitest-environment happy-dom

/**
 * Full AppShell integration coverage for the first-use route selector.
 *
 * The route selector itself has component-level tests, but these checks keep
 * the App hydration gate, route handler, and persistence effect wired together.
 */

import { vi, describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from "vitest";

vi.mock("mermaid", () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn().mockResolvedValue({ svg: "<svg><g></g></svg>", bindFunctions: undefined }),
  },
}));

// Keep the test focused on AppShell's route and persistence wiring rather than
// the rendering internals of each tab.
vi.mock("@/pages/tabs/ApplyTab", () => ({ ApplyTab: () => null }));
vi.mock("@/pages/tabs/ComposeTab", () => ({ ComposeTab: () => null }));
vi.mock("@/pages/tabs/ExamplesTab", () => ({ ExamplesTab: () => null }));
vi.mock("@/pages/tabs/ReferenceTab", () => ({ ReferenceTab: () => null }));
vi.mock("@/pages/tabs/ExtractTab", () => ({ ExtractTab: () => null }));

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createElement } from "react";
import { AppShell } from "@/App";

const STORAGE_KEY = "mtb.state.v1";
const FIRST_VISIT_KEY = "mtb.firstVisit";

function tablists(): Element[] {
  return Array.from(document.querySelectorAll('[role="tablist"]'));
}

function tabsNamed(name: string): HTMLElement[] {
  return screen.getAllByRole("tab", { name, exact: true });
}

async function expectActiveTab(name: string): Promise<void> {
  await waitFor(() => {
    expect(tabsNamed(name)).toHaveLength(2);
    expect(tabsNamed(name).every((tab) => tab.getAttribute("aria-selected") === "true")).toBe(true);
  });
}

function persistedState(): Record<string, unknown> {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
}

beforeAll(() => {
  vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
    const message = String(args[0] ?? "");
    if (message.includes("navigation") || message.includes("Not implemented")) return;
    console.warn("[test error]", ...args);
  });
});

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  window.history.replaceState({}, "", "/");
});

afterEach(() => {
  cleanup();
});

afterAll(() => {
  vi.mocked(console.error).mockRestore();
});

describe("AppShell first-use route selector integration", () => {
  it("shows the selector for a brand-new user and hides both tab navigations", async () => {
    render(createElement(AppShell));

    expect(await screen.findByRole("heading", { name: "What would you like to do?" })).toBeTruthy();
    await waitFor(() => {
      expect(tablists()).toHaveLength(2);
      expect(tablists().every((tablist) => tablist.hasAttribute("hidden"))).toBe(true);
    });
  });

  it("persists the selected route and restores it for a returning user", async () => {
    render(createElement(AppShell));

    await screen.findByRole("heading", { name: "What would you like to do?" });
    fireEvent.click(screen.getByRole("button", { name: /Explore Examples/i }));

    await expectActiveTab("Examples");
    await waitFor(() => {
      expect(localStorage.getItem(FIRST_VISIT_KEY)).toBe("true");
      expect(persistedState().firstVisitComplete).toBe(true);
      expect(persistedState().activeTab).toBe("examples");
    });

    cleanup();
    render(createElement(AppShell));

    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: "What would you like to do?" })).toBeNull();
    });
    await expectActiveTab("Examples");
  });

  it("skips the selector for persisted first-visit state and restores the last tab", async () => {
    localStorage.setItem(FIRST_VISIT_KEY, "true");
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 1,
        activeTab: "reference",
        firstVisitComplete: true,
      })
    );

    render(createElement(AppShell));

    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: "What would you like to do?" })).toBeNull();
    });
    await expectActiveTab("Reference");
  });

  it("uses Apply as the destination when the user skips the welcome screen", async () => {
    render(createElement(AppShell));

    await screen.findByRole("heading", { name: "What would you like to do?" });
    fireEvent.click(
      screen.getByRole("button", { name: "Skip the welcome screen and go straight to Apply" })
    );

    await expectActiveTab("Apply");
    await waitFor(() => {
      expect(localStorage.getItem(FIRST_VISIT_KEY)).toBe("true");
      expect(persistedState().firstVisitComplete).toBe(true);
      expect(persistedState().activeTab).toBe("apply");
    });
  });
});
