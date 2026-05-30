import { describe, it, expect, beforeEach } from "vitest";
import {
  loadPersistedState,
  savePersistedState,
  clearPersistedState,
  PREVIEW_MODE_KEY,
  loadStoredPreviewMode,
  saveStoredPreviewMode,
  type PersistedState,
} from "@/lib/persistence";

function makeLocalStorageMock() {
  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    },
  };
}

const localStorageMock = makeLocalStorageMock();

Object.defineProperty(globalThis, "window", {
  value: { localStorage: localStorageMock },
  writable: true,
  configurable: true,
});

beforeEach(() => {
  localStorageMock.clear();
});

const BASE_STATE: PersistedState = {
  schemaVersion: 1,
  selectedPaletteId: "overkill-hill",
  customColors: {},
  includeMetaComments: true,
  includeBadge: true,
  customThemeName: "",
  inputCode: "flowchart TD\n  A --> B",
  userPalettes: [],
  recentPaletteIds: [],
};

describe("PersistedState — lastSelectedExampleId round-trip", () => {
  it("round-trips a valid example ID", () => {
    savePersistedState({ ...BASE_STATE, lastSelectedExampleId: "showcase" });
    const loaded = loadPersistedState();
    expect(loaded?.lastSelectedExampleId).toBe("showcase");
  });

  it("round-trips a brand-palette example ID", () => {
    savePersistedState({ ...BASE_STATE, lastSelectedExampleId: "brand-overkill-hill-flow" });
    const loaded = loadPersistedState();
    expect(loaded?.lastSelectedExampleId).toBe("brand-overkill-hill-flow");
  });

  it("round-trips an empty string (cleared selection)", () => {
    savePersistedState({ ...BASE_STATE, lastSelectedExampleId: "" });
    const loaded = loadPersistedState();
    expect(loaded?.lastSelectedExampleId).toBe("");
  });

  it("returns undefined lastSelectedExampleId when field is absent (legacy state)", () => {
    const legacy = { ...BASE_STATE } as Partial<PersistedState>;
    delete legacy.lastSelectedExampleId;
    savePersistedState(legacy as PersistedState);
    const loaded = loadPersistedState();
    expect(loaded?.lastSelectedExampleId).toBeUndefined();
  });
});

describe("PersistedState — previewMode round-trip", () => {
  it("round-trips previewMode: themed", () => {
    savePersistedState({ ...BASE_STATE, previewMode: "themed" });
    const loaded = loadPersistedState();
    expect(loaded?.previewMode).toBe("themed");
  });

  it("round-trips previewMode: original", () => {
    savePersistedState({ ...BASE_STATE, previewMode: "original" });
    const loaded = loadPersistedState();
    expect(loaded?.previewMode).toBe("original");
  });

  it("round-trips previewMode: diff", () => {
    savePersistedState({ ...BASE_STATE, previewMode: "diff" });
    const loaded = loadPersistedState();
    expect(loaded?.previewMode).toBe("diff");
  });

  it("round-trips previewMode: code", () => {
    savePersistedState({ ...BASE_STATE, previewMode: "code" });
    const loaded = loadPersistedState();
    expect(loaded?.previewMode).toBe("code");
  });

  it("returns undefined previewMode when field is absent (legacy state)", () => {
    const legacy = { ...BASE_STATE } as Partial<PersistedState>;
    delete legacy.previewMode;
    savePersistedState(legacy as PersistedState);
    const loaded = loadPersistedState();
    expect(loaded?.previewMode).toBeUndefined();
  });
});

describe("clearPersistedState — clears all mtb keys", () => {
  it("clearPersistedState removes the main state key", () => {
    savePersistedState(BASE_STATE);
    clearPersistedState();
    expect(loadPersistedState()).toBeNull();
  });

  it("clearPersistedState also removes the preview-mode key", () => {
    saveStoredPreviewMode("used");
    clearPersistedState();
    expect(loadStoredPreviewMode()).toBeNull();
  });

  it("clearPersistedState removes both keys when both are set", () => {
    savePersistedState(BASE_STATE);
    saveStoredPreviewMode("all");
    clearPersistedState();
    expect(loadPersistedState()).toBeNull();
    expect(loadStoredPreviewMode()).toBeNull();
  });

  it("clearPersistedState is a no-op when storage is already empty", () => {
    expect(() => clearPersistedState()).not.toThrow();
    expect(loadPersistedState()).toBeNull();
    expect(loadStoredPreviewMode()).toBeNull();
  });
});

describe("PREVIEW_MODE_KEY — constant value", () => {
  it("is the expected storage key string", () => {
    expect(PREVIEW_MODE_KEY).toBe("mtb.classBrowser.previewMode");
  });
});

describe("loadStoredPreviewMode — contract", () => {
  it("returns null when storage is empty", () => {
    expect(loadStoredPreviewMode()).toBeNull();
  });

  it("returns 'all' after saving 'all'", () => {
    saveStoredPreviewMode("all");
    expect(loadStoredPreviewMode()).toBe("all");
  });

  it("returns 'used' after saving 'used'", () => {
    saveStoredPreviewMode("used");
    expect(loadStoredPreviewMode()).toBe("used");
  });

  it("returns null for an unrecognized stored value", () => {
    localStorageMock.setItem(PREVIEW_MODE_KEY, "invalid");
    expect(loadStoredPreviewMode()).toBeNull();
  });

  it("overwrite: saving 'used' after 'all' returns 'used'", () => {
    saveStoredPreviewMode("all");
    saveStoredPreviewMode("used");
    expect(loadStoredPreviewMode()).toBe("used");
  });
});

describe("saveStoredPreviewMode — writes the correct key", () => {
  it("writes 'all' under PREVIEW_MODE_KEY", () => {
    saveStoredPreviewMode("all");
    expect(localStorageMock.getItem(PREVIEW_MODE_KEY)).toBe("all");
  });

  it("writes 'used' under PREVIEW_MODE_KEY", () => {
    saveStoredPreviewMode("used");
    expect(localStorageMock.getItem(PREVIEW_MODE_KEY)).toBe("used");
  });
});
