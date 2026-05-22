import { describe, it, expect, beforeEach } from "vitest";
import {
  loadPersistedState,
  savePersistedState,
  type PersistedState,
} from "@/lib/persistence";

function makeLocalStorageMock() {
  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
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
