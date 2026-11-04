import { describe, expect, it } from "vitest";
import { BRAND_PALETTES } from "@/lib/palettes";
import { createDefaultMyThemeSlot } from "@/lib/my-theme-slots";
import {
  prepareThemeLibrary,
  parseThemeLibrary,
  loadThemeLibrary,
  writeThemeLibrary,
  libraryToPortableJson,
  parseLibraryImport,
  THEME_LIBRARY_KEY,
  LEGACY_THEME_KEY,
  paletteToCompleteTheme,
  type ExclusiveLibraryLock,
} from "@/lib/theme-library";

const now = "2026-11-03T12:00:00.000Z";
function storageFixture() {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    key: (index: number) => [...data.keys()][index] ?? null,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
    removeItem: (key: string) => {
      data.delete(key);
    },
    clear: () => data.clear(),
  } satisfies Storage;
}
function lockFixture(): ExclusiveLibraryLock {
  let tail = Promise.resolve();
  return async (work) => {
    const previous = tail;
    let release!: () => void;
    tail = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;
    try {
      return await work();
    } finally {
      release();
    }
  };
}
function legacyFixture() {
  return JSON.stringify({
    schemaVersion: 1,
    inputCode: "\nflowchart LR\n  A-->B\n",
    selectedPaletteId: BRAND_PALETTES[0].id,
    myThemeSlots: [createDefaultMyThemeSlot(1), createDefaultMyThemeSlot(2)],
    activeMyThemeSlotId: "my-theme-1",
    userPalettes: [{ ...BRAND_PALETTES[0], id: "my-theme-1", name: "Same ID, distinct theme" }],
    customColors: {
      [BRAND_PALETTES[0].id]: [{ key: "primaryColor", label: "Primary", value: "#abcdef" }],
    },
    rendererTarget: "github",
    outputFormat: "frontmatter",
    outputFormatOverridden: true,
    strokeWidth: 4,
    includeBadge: true,
    includeMetaComments: false,
    advancedMermaidConfig: {
      htmlLabels: false,
      deterministicIds: true,
      deterministicIDSeed: "legacy",
    },
    unknownPreference: { retained: true },
  });
}

describe("additive complete-theme migration", () => {
  it.each(["broken", "null", "[]"])(
    "rejects a malformed retained legacy snapshot before hydration: %s",
    (raw) => {
      const prepared = prepareThemeLibrary(null, now);
      if (!prepared.ok) throw new Error(prepared.error);
      prepared.state.migration.legacySource = raw;
      const serialized = JSON.stringify(prepared.state);
      const result = parseThemeLibrary(serialized);
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.raw).toBe(serialized);
    }
  );
  it("recovers an invalid legacy format using the destination recommendation without an override", () => {
    const result = prepareThemeLibrary(
      JSON.stringify({
        schemaVersion: 1,
        rendererTarget: "github",
        outputFormat: "invalid-format",
        outputFormatOverridden: true,
      }),
      now
    );
    if (!result.ok) throw new Error(result.error);
    expect(result.state.drafts[0].outputFormat).toBe("frontmatter");
    expect(result.state.drafts[0].outputFormatOverridden).toBe(false);
  });
  it("rehearses rollback to the untouched snapshot and recovery by a compatible reader", async () => {
    const storage = storageFixture();
    const raw = legacyFixture();
    storage.setItem(LEGACY_THEME_KEY, raw);
    const initial = loadThemeLibrary(storage);
    if (!initial.ok) throw new Error(initial.error);
    initial.state.editorSession.inputCode = "newer diagram source";
    initial.state.themes.push({
      ...paletteToCompleteTheme(BRAND_PALETTES[0], now),
      id: "new-theme",
    });
    const committed = await writeThemeLibrary(initial.state, 0, storage, lockFixture());
    expect(committed.ok).toBe(true);
    // The old reader only knows v1; it cannot see the new theme or source.
    expect(JSON.parse(storage.getItem(LEGACY_THEME_KEY)!)).toEqual(JSON.parse(raw));
    const compatible = loadThemeLibrary(storage);
    if (!compatible.ok) throw new Error(compatible.error);
    expect(compatible.state.editorSession.inputCode).toBe("newer diagram source");
    expect(compatible.state.themes.at(-1)?.id).toBe("new-theme");
    const backup = parseLibraryImport(libraryToPortableJson(compatible.state));
    if (!backup.ok) throw new Error(backup.error);
    const empty = prepareThemeLibrary(null, now);
    if (!empty.ok) throw new Error(empty.error);
    empty.state.themes = backup.themes;
    const restoredStorage = storageFixture();
    expect((await writeThemeLibrary(empty.state, 0, restoredStorage, lockFixture())).ok).toBe(true);
    const restored = loadThemeLibrary(restoredStorage);
    if (!restored.ok) throw new Error(restored.error);
    expect(restored.state.themes).toEqual(compatible.state.themes);
    expect(restored.state.editorSession.inputCode).toBe("");
  });

  it("validates and saves a representative 200-theme library", async () => {
    const prepared = prepareThemeLibrary(null, now);
    if (!prepared.ok) throw new Error(prepared.error);
    prepared.state.themes = Array.from({ length: 200 }, (_, index) => ({
      ...paletteToCompleteTheme(BRAND_PALETTES[0], now),
      id: `scale-${index}`,
      name: `Style ${index}`,
    }));
    const storage = storageFixture();
    const start = performance.now();
    expect((await writeThemeLibrary(prepared.state, 0, storage, lockFixture())).ok).toBe(true);
    const savedMs = performance.now() - start;
    const readStart = performance.now();
    const result = loadThemeLibrary(storage);
    const readMs = performance.now() - readStart;
    if (!result.ok) throw new Error(result.error);
    expect(result.state.themes).toHaveLength(200);
    console.info(
      JSON.stringify({
        benchmark: "200 complete themes",
        saveMs: Math.round(savedMs),
        loadMs: Math.round(readMs),
        bytes: new TextEncoder().encode(storage.getItem(THEME_LIBRARY_KEY)!).length,
      })
    );
  });
  it("is deterministic with an injected timestamp and does not invent old authoring history", () => {
    const raw = legacyFixture();
    const first = prepareThemeLibrary(raw, now);
    expect(prepareThemeLibrary(raw, now)).toEqual(first);
    if (!first.ok) throw new Error(first.error);
    expect(
      first.state.drafts.find((theme) => theme.id === BRAND_PALETTES[0].id)?.provenance
        ?.authoredWithMermaidVersion
    ).toBeUndefined();
    expect(first.state.editorSession.preferences.unknownPreference).toEqual({ retained: true });
  });

  it("recovers all three slots and does not deduplicate equal colors or non-ASCII names", () => {
    const legacy = JSON.parse(legacyFixture());
    legacy.myThemeSlots.push({
      ...createDefaultMyThemeSlot(3),
      name: "Thème 日本語",
      customField: { retained: true },
    });
    const result = prepareThemeLibrary(JSON.stringify(legacy), now);
    if (!result.ok) throw new Error(result.error);
    expect(result.state.themes).toHaveLength(4);
    expect(result.state.themes[2].name).toBe("Thème 日本語");
    expect(result.state.themes[2].extensions?.customField).toEqual({ retained: true });
    expect(result.state.migration.idMap).toHaveLength(4);
  });
  it("preserves each record, IDs, collisions, custom drafts, source bytes, and raw recovery data", () => {
    const raw = legacyFixture();
    const result = prepareThemeLibrary(raw, now);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const state = result.state;
    expect(state.themes).toHaveLength(3);
    expect(new Set(state.themes.map((theme) => theme.id)).size).toBe(3);
    expect(state.themes[0].id).toBe("my-theme-1");
    expect(state.migration.idMap).toContainEqual(
      expect.objectContaining({ originalId: "my-theme-1", id: "my-theme-1-2" })
    );
    expect(state.editorSession.inputCode).toBe(JSON.parse(raw).inputCode);
    expect(state.migration.legacySource).toBe(raw);
    expect(
      state.drafts
        .find((theme) => theme.id === BRAND_PALETTES[0].id)
        ?.colors.find((color) => color.key === "primaryColor")?.value
    ).toBe("#abcdef");
    expect(state.themes.every((theme) => theme.mermaidVersionVerified === "")).toBe(true);
  });

  it("recovers current settings only into the active draft, not every saved theme", () => {
    const result = prepareThemeLibrary(legacyFixture(), now);
    if (!result.ok) throw new Error(result.error);
    const active = result.state.drafts.find((theme) => theme.id === "my-theme-1")!;
    const inactive = result.state.themes.find((theme) => theme.id === "my-theme-2")!;
    expect(active.rendererTarget).toBe("github");
    expect(active.strokeWidth).toBe(4);
    expect(active.includeMetaComments).toBe(false);
    expect(inactive.rendererTarget).toBe("");
    expect(inactive.strokeWidth).toBeUndefined();
    expect(inactive.provenance?.missingFields).toContain("rendererTarget");
  });

  it.each([
    null,
    "{}",
    '{"schemaVersion":1}',
    '{"schemaVersion":1,"myThemeSlots":[],"inputCode":""}',
  ])("handles empty or partial legacy data %s", (raw) => {
    expect(prepareThemeLibrary(raw, now).ok).toBe(true);
  });

  it.each([
    '{"schemaVersion":9}',
    '{"schemaVersion":1,"myThemeSlots":[null]}',
    '{"schemaVersion":1,"userPalettes":[{}]}',
    "broken",
  ])("blocks malformed/future data without discarding it", (raw) => {
    const result = prepareThemeLibrary(raw, now);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.raw).toBe(raw);
  });

  it("commits a verified new envelope once and leaves the legacy key unchanged", async () => {
    const storage = storageFixture();
    const raw = legacyFixture();
    storage.setItem(LEGACY_THEME_KEY, raw);
    const prepared = loadThemeLibrary(storage);
    if (!prepared.ok) throw new Error(prepared.error);
    const saved = await writeThemeLibrary(prepared.state, 0, storage, lockFixture());
    expect(saved.ok).toBe(true);
    expect(storage.getItem(LEGACY_THEME_KEY)).toBe(raw);
    const loaded = loadThemeLibrary(storage);
    if (!loaded.ok) throw new Error(loaded.error);
    expect(loaded.state.themes).toEqual(prepared.state.themes);
    expect(loaded.state.revision).toBe(1);
  });

  it("retains both simultaneous tab edits without last-writer overwrite", async () => {
    const storage = storageFixture();
    const prepared = prepareThemeLibrary(null, now);
    if (!prepared.ok) throw new Error(prepared.error);
    const a = structuredClone(prepared.state);
    const b = structuredClone(prepared.state);
    a.editorSession.inputCode = "tab A";
    b.editorSession.inputCode = "tab B";
    const exclusive = lockFixture();
    const results = await Promise.all([
      writeThemeLibrary(a, 0, storage, exclusive),
      writeThemeLibrary(b, 0, storage, exclusive),
    ]);
    expect(results[0].ok).toBe(true);
    expect(results[1].ok).toBe(false);
    expect(JSON.parse(storage.getItem(THEME_LIBRARY_KEY)!).editorSession.inputCode).toBe("tab A");
    const conflict = results[1];
    if (conflict.ok) return;
    expect(conflict.recoveryKey).toBeTruthy();
    expect(storage.getItem(conflict.recoveryKey!)).toContain("tab B");
  });

  it("detects old-app writes and preserves the newer workspace as a recovery copy", async () => {
    const storage = storageFixture();
    const initial = prepareThemeLibrary(null, now);
    if (!initial.ok) throw new Error(initial.error);
    const raw = legacyFixture();
    storage.setItem(LEGACY_THEME_KEY, raw);
    const result = await writeThemeLibrary(initial.state, 0, storage, lockFixture());
    expect(result.ok).toBe(false);
    expect(storage.getItem(THEME_LIBRARY_KEY)).toBeNull();
    expect(storage.getItem(LEGACY_THEME_KEY)).toBe(raw);
  });

  it("never claims success when locks, storage, quota, or readback fail", async () => {
    const storage = storageFixture();
    const prepared = prepareThemeLibrary(null, now);
    if (!prepared.ok) throw new Error(prepared.error);
    expect((await writeThemeLibrary(prepared.state, 0, storage, null)).ok).toBe(false);
    storage.setItem = () => {
      throw new DOMException("Full", "QuotaExceededError");
    };
    expect((await writeThemeLibrary(prepared.state, 0, storage, lockFixture())).ok).toBe(false);
    storage.setItem = () => {};
    expect((await writeThemeLibrary(prepared.state, 0, storage, lockFixture())).ok).toBe(false);
    storage.getItem = () => {
      throw new DOMException("Denied", "SecurityError");
    };
    expect(loadThemeLibrary(storage).ok).toBe(false);
  });

  it("retains a newer library without reverting to the legacy snapshot", () => {
    const storage = storageFixture();
    storage.setItem(THEME_LIBRARY_KEY, '{"schemaVersion":999}');
    storage.setItem(LEGACY_THEME_KEY, legacyFixture());
    expect(loadThemeLibrary(storage).ok).toBe(false);
    expect(storage.getItem(THEME_LIBRARY_KEY)).toBe('{"schemaVersion":999}');
  });

  it("exports and restores all themes without source text or legacy workspace data", () => {
    const prepared = prepareThemeLibrary(legacyFixture(), now);
    if (!prepared.ok) throw new Error(prepared.error);
    const json = libraryToPortableJson(prepared.state);
    expect(json).not.toContain("inputCode");
    expect(json).not.toContain("legacySource");
    const restored = parseLibraryImport(json);
    expect(restored.ok).toBe(true);
    if (!restored.ok) return;
    expect(restored.themes).toEqual(prepared.state.themes);
  });
});
