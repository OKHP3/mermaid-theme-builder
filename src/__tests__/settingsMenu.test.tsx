// @vitest-environment happy-dom

/**
 * Component tests for the three Settings menu actions (Task #350).
 *
 * Behaviors covered:
 *   1. "Reset all syntax tips" — calls clearAllDismissals, shows toast,
 *      closes menu.
 *   2. "Reset all palette customizations" (two-step confirm, Task #349):
 *        a. First click shows inline confirm panel.
 *        b. Confirm fires toast, closes menu, and clears customColors from
 *           persisted localStorage state.
 *        c. Cancel returns to the normal menu list with no side effects.
 *   3. "Clear recent palette history" — shows toast, closes menu, and
 *      clears recentPaletteIds from persisted localStorage state.
 *
 * Strategy
 * --------
 * The full <App /> is rendered so the real header (Settings button) and
 * persistence layer are exercised.  Mermaid is mocked to prevent canvas
 * errors.  clearAllDismissals is spied on for action #1.
 *
 * State-mutation tests seed "mtb.state.v1" in localStorage before rendering
 * so App loads non-empty customColors / recentPaletteIds.  After each action
 * the persisted value is read back (using waitFor since savePersistedState
 * runs inside a React useEffect) to confirm the mutation.
 */

// vi.mock calls must be hoisted before any imports.
import { vi, describe, it, expect, afterEach, beforeEach } from "vitest";

vi.mock("mermaid", () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn().mockResolvedValue({ svg: "<svg><g></g></svg>", bindFunctions: undefined }),
  },
}));

vi.mock("@/components/PaletteSelectorBar", () => ({
  PaletteSelectorBar: () => null,
}));

vi.mock("@/lib/family-syntax-hints", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/family-syntax-hints")>();
  return {
    ...actual,
    clearAllDismissals: vi.fn(),
  };
});

import { render, screen, cleanup, waitFor } from "@testing-library/react";
import { fireEvent } from "@testing-library/dom";
import { createElement } from "react";
import App from "@/App";
import { clearAllDismissals } from "@/lib/family-syntax-hints";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** localStorage key used by the persistence module (src/lib/persistence.ts). */
const STORAGE_KEY = "mtb.state.v1";

/** Secondary key for the ClassBrowser preview-mode preference. */
const PREVIEW_MODE_KEY = "mtb.classBrowser.previewMode";

/**
 * A minimal seeded state that gives App non-empty customColors and
 * recentPaletteIds so the state-mutation tests have something to verify.
 */
const SEEDED_STATE = JSON.stringify({
  schemaVersion: 1,
  customColors: { "seed-palette": [{ key: "primaryColor", value: "#ff0000" }] },
  recentPaletteIds: ["seed-a", "seed-b"],
  selectedPaletteId: "okhp3",
  inputCode: "",
  includeMetaComments: false,
  includeBadge: false,
  customThemeName: "",
  userPalettes: [],
  look: "classic",
  fontSize: "",
  typography: {},
  rendererTarget: "",
  previewMode: "original",
  lastExampleType: {},
  lastSelectedExampleId: "",
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function openSettingsMenu(): void {
  fireEvent.click(screen.getByRole("button", { name: "Settings" }));
}

function getMenu(): Element | null {
  return screen.queryByRole("menu", { name: "Settings" });
}

function getToast(): string {
  return screen.getByRole("status").textContent ?? "";
}

function getPersistedState(): Record<string, unknown> {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  localStorage.clear();
});

beforeEach(() => {
  // Prevent App from loading stale state from a previous test.
  localStorage.clear();
});

// ---------------------------------------------------------------------------
// 1. Reset all syntax tips
// ---------------------------------------------------------------------------

describe("Settings menu — Reset all syntax tips", () => {
  it("calls clearAllDismissals when the menu item is clicked", () => {
    render(createElement(App, null));
    openSettingsMenu();
    fireEvent.click(screen.getByText("Reset all syntax tips"));
    expect(vi.mocked(clearAllDismissals)).toHaveBeenCalledOnce();
  });

  it('shows the "Syntax tips restored." toast after clicking', () => {
    render(createElement(App, null));
    openSettingsMenu();
    fireEvent.click(screen.getByText("Reset all syntax tips"));
    expect(getToast()).toContain("Syntax tips restored.");
  });

  it("closes the settings menu after the action", () => {
    render(createElement(App, null));
    openSettingsMenu();
    expect(getMenu()).not.toBeNull();
    fireEvent.click(screen.getByText("Reset all syntax tips"));
    expect(getMenu()).toBeNull();
  });

  it("does not clear the ClassBrowser preview-mode preference (PREVIEW_MODE_KEY survives)", () => {
    localStorage.setItem(PREVIEW_MODE_KEY, "used");
    render(createElement(App, null));
    openSettingsMenu();
    fireEvent.click(screen.getByText("Reset all syntax tips"));
    expect(localStorage.getItem(PREVIEW_MODE_KEY)).toBe("used");
  });
});

// ---------------------------------------------------------------------------
// 2. Reset all palette customizations (two-step confirm)
// ---------------------------------------------------------------------------

describe("Settings menu — Reset all palette customizations (confirm flow)", () => {
  it("shows the inline confirm panel after the first click", () => {
    render(createElement(App, null));
    openSettingsMenu();
    fireEvent.click(screen.getByText("Reset all palette customizations"));
    // Confirm panel text should be visible.
    expect(screen.getByText(/Reset all\?/)).toBeTruthy();
    // Confirm and Cancel buttons must be present.
    expect(screen.getByText("Confirm")).toBeTruthy();
    expect(screen.getByText("Cancel")).toBeTruthy();
    // The original button label must not be visible while the panel is shown.
    expect(screen.queryByText("Reset all palette customizations")).toBeNull();
  });

  it('fires the "All palette customizations reset." toast after Confirm', () => {
    render(createElement(App, null));
    openSettingsMenu();
    fireEvent.click(screen.getByText("Reset all palette customizations"));
    fireEvent.click(screen.getByText("Confirm"));
    expect(getToast()).toContain("All palette customizations reset.");
  });

  it("closes the settings menu after Confirm", () => {
    render(createElement(App, null));
    openSettingsMenu();
    fireEvent.click(screen.getByText("Reset all palette customizations"));
    fireEvent.click(screen.getByText("Confirm"));
    expect(getMenu()).toBeNull();
  });

  it("clears customColors in persisted localStorage state after Confirm", async () => {
    localStorage.setItem(STORAGE_KEY, SEEDED_STATE);
    render(createElement(App, null));
    openSettingsMenu();
    fireEvent.click(screen.getByText("Reset all palette customizations"));
    fireEvent.click(screen.getByText("Confirm"));

    // savePersistedState runs inside a React useEffect — wait for it.
    await waitFor(() => {
      const saved = getPersistedState();
      const colors = saved.customColors as Record<string, unknown>;
      expect(Object.keys(colors ?? {}).length).toBe(0);
    });
  });

  it("returns to the normal menu list after Cancel — original button is visible again", () => {
    render(createElement(App, null));
    openSettingsMenu();
    fireEvent.click(screen.getByText("Reset all palette customizations"));
    fireEvent.click(screen.getByText("Cancel"));
    // Confirm panel is gone.
    expect(screen.queryByText(/Reset all\?/)).toBeNull();
    expect(screen.queryByText("Confirm")).toBeNull();
    // Original button is back.
    expect(screen.getByText("Reset all palette customizations")).toBeTruthy();
  });

  it("keeps the settings menu open after Cancel", () => {
    render(createElement(App, null));
    openSettingsMenu();
    fireEvent.click(screen.getByText("Reset all palette customizations"));
    fireEvent.click(screen.getByText("Cancel"));
    expect(getMenu()).not.toBeNull();
  });

  it("does not fire the reset toast if Cancel is clicked instead of Confirm", () => {
    render(createElement(App, null));
    openSettingsMenu();
    fireEvent.click(screen.getByText("Reset all palette customizations"));
    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("does not clear the ClassBrowser preview-mode preference after Confirm (PREVIEW_MODE_KEY survives)", () => {
    localStorage.setItem(PREVIEW_MODE_KEY, "used");
    render(createElement(App, null));
    openSettingsMenu();
    fireEvent.click(screen.getByText("Reset all palette customizations"));
    fireEvent.click(screen.getByText("Confirm"));
    expect(localStorage.getItem(PREVIEW_MODE_KEY)).toBe("used");
  });
});

// ---------------------------------------------------------------------------
// 3. Clear recent palette history
// ---------------------------------------------------------------------------

describe("Settings menu — Clear recent palette history", () => {
  it('shows the "Recent palette history cleared." toast after clicking', () => {
    render(createElement(App, null));
    openSettingsMenu();
    fireEvent.click(screen.getByText("Clear recent palette history"));
    expect(getToast()).toContain("Recent palette history cleared.");
  });

  it("closes the settings menu after the action", () => {
    render(createElement(App, null));
    openSettingsMenu();
    expect(getMenu()).not.toBeNull();
    fireEvent.click(screen.getByText("Clear recent palette history"));
    expect(getMenu()).toBeNull();
  });

  it("clears recentPaletteIds in persisted localStorage state after clicking", async () => {
    localStorage.setItem(STORAGE_KEY, SEEDED_STATE);
    render(createElement(App, null));
    openSettingsMenu();
    fireEvent.click(screen.getByText("Clear recent palette history"));

    // savePersistedState runs inside a React useEffect — wait for it.
    await waitFor(() => {
      const saved = getPersistedState();
      expect(saved.recentPaletteIds).toEqual([]);
    });
  });

  it("does not clear the ClassBrowser preview-mode preference (PREVIEW_MODE_KEY survives)", () => {
    localStorage.setItem(PREVIEW_MODE_KEY, "used");
    render(createElement(App, null));
    openSettingsMenu();
    fireEvent.click(screen.getByText("Clear recent palette history"));
    expect(localStorage.getItem(PREVIEW_MODE_KEY)).toBe("used");
  });
});

// ---------------------------------------------------------------------------
// 4. Clear all settings
// ---------------------------------------------------------------------------

describe("Settings menu — Clear all settings", () => {
  it('shows the "All settings cleared." toast after clicking', () => {
    render(createElement(App, null));
    openSettingsMenu();
    fireEvent.click(screen.getByText("Clear all settings"));
    expect(getToast()).toContain("All settings cleared.");
  });

  it("closes the settings menu after the action", () => {
    render(createElement(App, null));
    openSettingsMenu();
    expect(getMenu()).not.toBeNull();
    fireEvent.click(screen.getByText("Clear all settings"));
    expect(getMenu()).toBeNull();
  });

  it("clears seeded customColors — the saved state has an empty customColors after clicking", async () => {
    // App's persistence useEffect re-saves state after the handler resets React
    // state, so STORAGE_KEY is not null — but it must reflect cleared values.
    localStorage.setItem(STORAGE_KEY, SEEDED_STATE);
    render(createElement(App, null));
    openSettingsMenu();
    fireEvent.click(screen.getByText("Clear all settings"));

    await waitFor(() => {
      const saved = getPersistedState();
      expect(Object.keys((saved.customColors as Record<string, unknown>) ?? {}).length).toBe(0);
    });
  });

  it("clears seeded recentPaletteIds — the saved state has an empty array after clicking", async () => {
    localStorage.setItem(STORAGE_KEY, SEEDED_STATE);
    render(createElement(App, null));
    openSettingsMenu();
    fireEvent.click(screen.getByText("Clear all settings"));

    await waitFor(() => {
      const saved = getPersistedState();
      expect(saved.recentPaletteIds).toEqual([]);
    });
  });

  it("clears the preview-mode key — PREVIEW_MODE_KEY is null after clicking", () => {
    // PREVIEW_MODE_KEY has no re-save useEffect, so it stays null after
    // clearPersistedState() runs — unlike STORAGE_KEY which is re-written
    // with the default state by App's persistence useEffect.
    localStorage.setItem(STORAGE_KEY, SEEDED_STATE);
    localStorage.setItem(PREVIEW_MODE_KEY, "used");
    render(createElement(App, null));
    openSettingsMenu();
    fireEvent.click(screen.getByText("Clear all settings"));
    // clearPersistedState is synchronous — PREVIEW_MODE_KEY is erased before
    // the next microtask tick.
    expect(localStorage.getItem(PREVIEW_MODE_KEY)).toBeNull();
  });

  it("atomically erases both keys — PREVIEW_MODE_KEY null and customColors cleared", async () => {
    localStorage.setItem(STORAGE_KEY, SEEDED_STATE);
    localStorage.setItem(PREVIEW_MODE_KEY, "all");
    render(createElement(App, null));
    openSettingsMenu();
    fireEvent.click(screen.getByText("Clear all settings"));

    // PREVIEW_MODE_KEY is synchronously null.
    expect(localStorage.getItem(PREVIEW_MODE_KEY)).toBeNull();

    // Seeded customizations are gone from the re-saved state blob.
    await waitFor(() => {
      const saved = getPersistedState();
      expect(Object.keys((saved.customColors as Record<string, unknown>) ?? {}).length).toBe(0);
    });
  });

  it("resets includeMetaComments to true — seeded false becomes true after clearing", async () => {
    // SEEDED_STATE seeds includeMetaComments: false; the default is true.
    localStorage.setItem(STORAGE_KEY, SEEDED_STATE);
    render(createElement(App, null));
    openSettingsMenu();
    fireEvent.click(screen.getByText("Clear all settings"));

    await waitFor(() => {
      const saved = getPersistedState();
      expect(saved.includeMetaComments).toBe(true);
    });
  });

  it("resets includeBadge to true — seeded false becomes true after clearing", async () => {
    // SEEDED_STATE seeds includeBadge: false; the default is true.
    localStorage.setItem(STORAGE_KEY, SEEDED_STATE);
    render(createElement(App, null));
    openSettingsMenu();
    fireEvent.click(screen.getByText("Clear all settings"));

    await waitFor(() => {
      const saved = getPersistedState();
      expect(saved.includeBadge).toBe(true);
    });
  });

  it("resets apply-tab previewMode to 'themed' — seeded 'original' becomes 'themed' after clearing", async () => {
    // SEEDED_STATE seeds previewMode: "original"; the default is "themed".
    localStorage.setItem(STORAGE_KEY, SEEDED_STATE);
    render(createElement(App, null));
    openSettingsMenu();
    fireEvent.click(screen.getByText("Clear all settings"));

    await waitFor(() => {
      const saved = getPersistedState();
      expect(saved.previewMode).toBe("themed");
    });
  });

  it("resets inputCode to the default diagram — seeded empty string is replaced by the factory default", async () => {
    // SEEDED_STATE seeds inputCode: ""; the handler sets it to APPLY_TAB_DEFAULT.
    localStorage.setItem(STORAGE_KEY, SEEDED_STATE);
    render(createElement(App, null));
    openSettingsMenu();
    fireEvent.click(screen.getByText("Clear all settings"));

    await waitFor(() => {
      const saved = getPersistedState();
      // APPLY_TAB_DEFAULT is the non-empty flowchart example used as the
      // factory default; the seeded empty string must be replaced.
      expect(typeof saved.inputCode).toBe("string");
      expect((saved.inputCode as string).length).toBeGreaterThan(0);
    });
  });
});
