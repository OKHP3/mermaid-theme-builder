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
import { encodeShareableTheme } from "@/lib/persistence";
import { encodeProfileToken } from "@/lib/profile-share";
import { BRAND_PALETTES } from "@/lib/palettes";
import { createGovernanceProfile } from "@/lib/governance-profile";

const STORAGE_KEY = "mtb.state.v1";
const FIRST_VISIT_KEY = "mtb.firstVisit";

function tablists(): Element[] {
  return Array.from(document.querySelectorAll('[role="tablist"]'));
}

function tabsNamed(name: string): HTMLElement[] {
  return screen.getAllByRole("tab", { name });
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
  it("bypasses the selector and activates Extract for a URL hash", async () => {
    window.history.replaceState({}, "", "/#extract");

    render(createElement(AppShell));

    expect(screen.queryByRole("heading", { name: "What would you like to do?" })).toBeNull();
    await expectActiveTab("Extract");
    expect(screen.queryByRole("heading", { name: "What would you like to do?" })).toBeNull();
  });

  it("bypasses the selector and applies a shared theme token", async () => {
    const token = encodeShareableTheme({
      v: 1,
      paletteName: "Shared integration theme",
      themeVariables: {
        primaryColor: "#123456",
      },
    });
    window.history.replaceState({}, "", `/?theme=${encodeURIComponent(token)}`);

    render(createElement(AppShell));

    expect(screen.queryByRole("heading", { name: "What would you like to do?" })).toBeNull();
    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: "What would you like to do?" })).toBeNull();
      expect(persistedState().selectedPaletteId).toMatch(/^shared-/);
      expect(
        (persistedState().userPalettes as Array<{ name: string }>).map((p) => p.name)
      ).toContain("Shared integration theme");
    });
  });

  it("bypasses the selector and applies a shared profile token", async () => {
    const profile = createGovernanceProfile(
      {
        id: "my-theme-2",
        name: "Shared integration profile",
        colors: BRAND_PALETTES[0].colors,
        rendererTarget: "obsidian",
        outputFormat: "frontmatter",
      },
      "2026-08-27T12:00:00.000Z"
    );
    const token = encodeProfileToken(profile);
    window.history.replaceState({}, "", `/?profile=${encodeURIComponent(token)}`);

    render(createElement(AppShell));

    expect(screen.queryByRole("heading", { name: "What would you like to do?" })).toBeNull();
    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: "What would you like to do?" })).toBeNull();
      const state = persistedState();
      expect((state.myThemeSlots as Array<{ name: string }>).map((slot) => slot.name)).toContain(
        "Shared integration profile"
      );
      expect(state.activeMyThemeSlotId).toBe("my-theme-2");
      expect(state.rendererTarget).toBe("obsidian");
    });
  });

  it("lets a profile share win over a conflicting theme share and consumes both links", async () => {
    const themeToken = encodeShareableTheme({
      v: 1,
      paletteName: "Losing palette share",
      themeVariables: {
        primaryColor: "#123456",
      },
    });
    const profile = createGovernanceProfile(
      {
        id: "my-theme-2",
        name: "Winning profile share",
        colors: BRAND_PALETTES[0].colors,
        rendererTarget: "obsidian",
        outputFormat: "frontmatter",
      },
      "2026-08-27T12:00:00.000Z"
    );
    const profileToken = encodeProfileToken(profile);
    window.history.replaceState(
      {},
      "",
      `/?theme=${encodeURIComponent(themeToken)}&profile=${encodeURIComponent(profileToken)}`
    );

    render(createElement(AppShell));

    expect(screen.queryByRole("heading", { name: "What would you like to do?" })).toBeNull();
    expect(new URL(window.location.href).searchParams.has("theme")).toBe(false);
    expect(new URL(window.location.href).searchParams.has("profile")).toBe(false);
    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: "What would you like to do?" })).toBeNull();
      const state = persistedState();
      expect((state.myThemeSlots as Array<{ name: string }>).map((slot) => slot.name)).toContain(
        "Winning profile share"
      );
      expect(state.activeMyThemeSlotId).toBe("my-theme-2");
      expect(state.rendererTarget).toBe("obsidian");
      expect(state.selectedPaletteId).not.toMatch(/^shared-/);
      expect(
        (state.userPalettes as Array<{ name: string }>).map((palette) => palette.name)
      ).not.toContain("Losing palette share");
    });
  });

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
