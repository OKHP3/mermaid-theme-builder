/**
 * Integration tests: Settings reset action wires through clearPersistedState.
 *
 * Background (Task #336 / Task #422)
 * -----------------------------------
 * Task #336 fixed clearPersistedState() to also erase PREVIEW_MODE_KEY (the
 * ClassBrowser preview-mode preference stored separately from the main state
 * blob). Without that fix, calling clearPersistedState() left a stale
 * "used"/"all" value in localStorage that the app re-loaded on the next visit,
 * making the reset incomplete from a user's perspective.
 *
 * These tests verify the end-to-end contract using the public API exclusively:
 *
 *   savePersistedState / loadPersistedState   — main state blob key
 *   saveStoredPreviewMode / loadStoredPreviewMode — secondary preview-mode key
 *   clearPersistedState                       — must erase both keys atomically
 *
 * Drift note
 * ----------
 * At time of writing, clearPersistedState is NOT imported or called from any
 * UI component (App.tsx, tabs, settings menu). The Settings menu actions
 * ("Reset all syntax tips", "Reset all palette customizations", "Clear recent
 * palette history") operate on React state and persist via useEffect — none
 * calls clearPersistedState. If a future "Clear all settings" button is added
 * to the Settings menu, these tests should be extended to drive the action via
 * fireEvent.click and assert the same post-conditions.
 *
 * To run just this file:
 *   pnpm vitest run src/__tests__/settingsActions.test.ts
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  savePersistedState,
  loadPersistedState,
  saveStoredPreviewMode,
  loadStoredPreviewMode,
  clearPersistedState,
  type PersistedState,
} from "@/lib/persistence";

// ---------------------------------------------------------------------------
// localStorage mock — isolated per test via beforeEach clear
// ---------------------------------------------------------------------------

const store: Record<string, string> = {};

const localStorageMock = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => {
    store[key] = value;
  },
  removeItem: (key: string) => {
    delete store[key];
  },
  clear: () => Object.keys(store).forEach((k) => delete store[k]),
};

Object.defineProperty(globalThis, "window", {
  value: { localStorage: localStorageMock },
  writable: true,
  configurable: true,
});

beforeEach(() => {
  localStorageMock.clear();
});

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const BASE_STATE: PersistedState = {
  schemaVersion: 1,
  selectedPaletteId: "overkill-hill",
  customColors: { "test-palette": [{ key: "primaryColor", value: "#ff0000" }] },
  includeMetaComments: true,
  includeBadge: true,
  customThemeName: "My Test Theme",
  inputCode: "flowchart TD\n  A --> B",
  userPalettes: [],
  recentPaletteIds: ["palette-a", "palette-b"],
};

// ---------------------------------------------------------------------------
// clearPersistedState — end-to-end public API round-trip
//
// These tests seed both storage keys using the same public API that the app
// itself uses at runtime, then assert that clearPersistedState erases both so
// that subsequent loads return null.
// ---------------------------------------------------------------------------

describe("Settings reset: clearPersistedState erases the main state blob", () => {
  it("loadPersistedState returns null after save → clear cycle", () => {
    savePersistedState(BASE_STATE);
    expect(loadPersistedState()).not.toBeNull(); // confirm seeding worked

    clearPersistedState();

    expect(loadPersistedState()).toBeNull();
  });

  it("the cleared state has no customColors residue", () => {
    savePersistedState(BASE_STATE);
    clearPersistedState();
    // loadPersistedState returns null — no partial state survives
    expect(loadPersistedState()?.customColors).toBeUndefined();
  });

  it("the cleared state has no recentPaletteIds residue", () => {
    savePersistedState(BASE_STATE);
    clearPersistedState();
    expect(loadPersistedState()?.recentPaletteIds).toBeUndefined();
  });
});

describe("Settings reset: clearPersistedState erases the preview-mode key", () => {
  it("loadStoredPreviewMode returns null after saveStoredPreviewMode('used') → clear", () => {
    saveStoredPreviewMode("used");
    expect(loadStoredPreviewMode()).toBe("used"); // confirm seeding worked

    clearPersistedState();

    expect(loadStoredPreviewMode()).toBeNull();
  });

  it("loadStoredPreviewMode returns null after saveStoredPreviewMode('all') → clear", () => {
    saveStoredPreviewMode("all");
    clearPersistedState();
    expect(loadStoredPreviewMode()).toBeNull();
  });
});

describe("Settings reset: clearPersistedState is atomic — both keys cleared together", () => {
  it("pre-seeding both keys then clearing leaves both null", () => {
    // This is the primary regression guard for Task #336.
    // Before that fix, clearPersistedState only removed STORAGE_KEY and left
    // PREVIEW_MODE_KEY intact, causing a stale preview-mode preference to
    // survive a "full reset".
    savePersistedState(BASE_STATE);
    saveStoredPreviewMode("used");

    // Confirm both are seeded.
    expect(loadPersistedState()).not.toBeNull();
    expect(loadStoredPreviewMode()).toBe("used");

    clearPersistedState();

    // Both must be null — neither key may survive.
    expect(loadPersistedState()).toBeNull();
    expect(loadStoredPreviewMode()).toBeNull();
  });

  it("a subsequent save after clear works normally — no leftover corruption", () => {
    savePersistedState(BASE_STATE);
    saveStoredPreviewMode("used");
    clearPersistedState();

    // Re-seed with different values after the clear.
    const newState: PersistedState = { ...BASE_STATE, customThemeName: "Fresh Start" };
    savePersistedState(newState);
    saveStoredPreviewMode("all");

    expect(loadPersistedState()?.customThemeName).toBe("Fresh Start");
    expect(loadStoredPreviewMode()).toBe("all");
  });

  it("calling clearPersistedState twice is idempotent", () => {
    savePersistedState(BASE_STATE);
    saveStoredPreviewMode("used");

    clearPersistedState();
    expect(() => clearPersistedState()).not.toThrow();

    expect(loadPersistedState()).toBeNull();
    expect(loadStoredPreviewMode()).toBeNull();
  });
});

describe("Settings reset: clearPersistedState is a no-op on empty storage", () => {
  it("does not throw when both keys are absent", () => {
    expect(() => clearPersistedState()).not.toThrow();
    expect(loadPersistedState()).toBeNull();
    expect(loadStoredPreviewMode()).toBeNull();
  });

  it("does not throw when only the preview-mode key is absent", () => {
    savePersistedState(BASE_STATE);
    expect(() => clearPersistedState()).not.toThrow();
    expect(loadPersistedState()).toBeNull();
  });

  it("does not throw when only the main state key is absent", () => {
    saveStoredPreviewMode("all");
    expect(() => clearPersistedState()).not.toThrow();
    expect(loadStoredPreviewMode()).toBeNull();
  });
});
