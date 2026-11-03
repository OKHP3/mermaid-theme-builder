import {
  createGovernanceProfile,
  GOVERNANCE_PROFILE_TYPE,
  parseGovernanceProfile,
  profileToPortableJson,
  type GovernanceProfile,
} from "./governance-profile";
import { BRAND_PALETTES, BUILTIN_PALETTES, type Palette } from "./palettes";
import { parsePaletteBundle, parsePortablePalette } from "./exporters";
import { resolvePersistedOutputFormat } from "./persistence";
import { getRendererDefaultOutputFormat } from "../data/renderer-parity";

export const THEME_LIBRARY_KEY = "mtb.state.v2";
export const LEGACY_THEME_KEY = "mtb.state.v1";
export const THEME_LIBRARY_TYPE = "mtb-theme-library";
export const WORKSPACE_RECOVERY_TYPE = "mtb-workspace-recovery";
export const LIBRARY_LOCK_NAME = "mtb-theme-library-write";

export interface ThemeLibrary {
  schemaVersion: 2;
  revision: number;
  themes: GovernanceProfile[];
  drafts: GovernanceProfile[];
  /** Shared order for saved themes and unsaved personal drafts. */
  themeOrder?: string[];
  editorSession: {
    inputCode: string;
    activeThemeId: string | null;
    selectedPaletteId: string;
    preferences: Record<string, unknown>;
  };
  migration: {
    legacySource: string | null;
    recoveredAt: string;
    idMap: { kind: "slot" | "palette"; index: number; originalId: string; id: string }[];
    warnings: string[];
  };
}

type LibraryResult = { ok: true; state: ThemeLibrary } | { ok: false; error: string; raw?: string };
export type ExclusiveLibraryLock = <T>(work: () => T | Promise<T>) => Promise<T>;
export type LibraryWriteResult =
  { ok: true; state: ThemeLibrary } | { ok: false; error: string; recoveryKey?: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function copy<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function normalizedJson(value: unknown): string {
  const sort = (item: unknown): unknown =>
    Array.isArray(item)
      ? item.map(sort)
      : isRecord(item)
        ? Object.fromEntries(
            Object.entries(item)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([key, entry]) => [key, sort(entry)])
          )
        : item;
  return JSON.stringify(sort(value));
}

export function uniqueThemeId(requested: string, used: Set<string>): string {
  let id = requested;
  let suffix = 2;
  while (used.has(id)) id = `${requested}-${suffix++}`;
  used.add(id);
  return id;
}

export function paletteToCompleteTheme(palette: Palette, now?: string): GovernanceProfile {
  const { id, name, colors, ...paletteMetadata } = palette;
  return createGovernanceProfile(
    {
      id,
      name,
      colors,
      description: palette.description,
      paletteMetadata,
      includeBadge: palette.attribution.enabledByDefault,
    },
    now
  );
}

export function completeThemeToPalette(theme: GovernanceProfile): Palette {
  return {
    description: theme.description,
    version: "1.0.0",
    attribution: {
      enabledByDefault: false,
      label: "",
      url: "",
      themeName: theme.name,
      toolName: "Mermaid Theme Builder",
      toolVersion: "",
    },
    ...theme.paletteMetadata,
    id: theme.id,
    name: theme.name,
    colors: theme.colors,
  };
}

const missingLegacyFields = [
  "rendererTarget",
  "outputFormat",
  "outputFormatOverridden",
  "strokeWidth",
  "advancedMermaidConfig",
  "includeMetaComments",
  "includeBadge",
];
const migratedFields = new Set([
  "schemaVersion",
  "inputCode",
  "myThemeSlots",
  "userPalettes",
  "customColors",
  "selectedPaletteId",
  "activeMyThemeSlotId",
  "customThemeName",
  "look",
  "fontSize",
  "typography",
  ...missingLegacyFields,
]);

function readLegacyProfile(
  value: unknown,
  kind: "slot" | "palette",
  now: string
): GovernanceProfile {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    !value.id ||
    typeof value.name !== "string" ||
    !Array.isArray(value.colors) ||
    !value.colors.length ||
    !value.colors.every(
      (color) =>
        isRecord(color) && ["key", "label", "value"].every((key) => typeof color[key] === "string")
    )
  ) {
    throw new Error(`A legacy ${kind} is malformed. The original workspace has not been changed.`);
  }
  const { id, name, colors, ...metadata } = value;
  const parsed = parseGovernanceProfile(
    JSON.stringify({
      ...value,
      schemaVersion: value.schemaVersion ?? 1,
      type: GOVERNANCE_PROFILE_TYPE,
      ...(kind === "palette" ? { paletteMetadata: metadata } : {}),
      createdAt: value.createdAt ?? now,
      updatedAt: value.updatedAt ?? now,
      mermaidVersionVerified: value.mermaidVersionVerified ?? "",
      provenance: value.provenance ?? {
        recoveredFrom: `legacy-${kind}`,
        missingFields: missingLegacyFields,
      },
    })
  );
  if (!parsed.ok) throw new Error(parsed.error);
  return parsed.profile;
}

/** Pure conversion. It never writes or deletes the legacy workspace. */
export function prepareThemeLibrary(
  raw: string | null,
  now = new Date().toISOString()
): LibraryResult {
  try {
    const old: unknown = raw === null ? {} : JSON.parse(raw);
    if (!isRecord(old)) throw new Error("The saved workspace is not an object.");
    if (old.schemaVersion !== undefined && old.schemaVersion !== 1) {
      throw new Error(
        "The saved workspace schema is not supported. Keep it for recovery with a compatible app."
      );
    }
    for (const key of ["myThemeSlots", "userPalettes"]) {
      if (old[key] !== undefined && !Array.isArray(old[key]))
        throw new Error(`Invalid ${key}. Nothing was migrated.`);
    }
    if (old.inputCode !== undefined && typeof old.inputCode !== "string")
      throw new Error("Invalid diagram source. Nothing was migrated.");
    if (old.customColors !== undefined && !isRecord(old.customColors))
      throw new Error("Invalid custom colors. Nothing was migrated.");
    const state: ThemeLibrary = {
      schemaVersion: 2,
      revision: 0,
      themes: [],
      drafts: [],
      editorSession: {
        inputCode: typeof old.inputCode === "string" ? old.inputCode : "",
        activeThemeId: null,
        selectedPaletteId:
          typeof old.selectedPaletteId === "string" ? old.selectedPaletteId : BRAND_PALETTES[0].id,
        preferences: copy(
          Object.fromEntries(Object.entries(old).filter(([key]) => !migratedFields.has(key)))
        ),
      },
      migration: { legacySource: raw, recoveredAt: now, idMap: [], warnings: [] },
    };
    const used = new Set(BUILTIN_PALETTES.map((palette) => palette.id));
    for (const kind of ["slot", "palette"] as const) {
      const records = (old[kind === "slot" ? "myThemeSlots" : "userPalettes"] ?? []) as unknown[];
      records.forEach((record, index) => {
        const theme = readLegacyProfile(record, kind, now);
        const originalId = theme.id;
        theme.id = uniqueThemeId(originalId, used);
        if (theme.id !== originalId) theme.provenance = { ...theme.provenance, originalId };
        state.migration.idMap.push({ kind, index, originalId, id: theme.id });
        state.themes.push(theme);
        if (
          (kind === "slot" && old.activeMyThemeSlotId === originalId) ||
          (kind === "palette" && !old.activeMyThemeSlotId && old.selectedPaletteId === originalId)
        ) {
          state.editorSession.activeThemeId = theme.id;
        }
      });
    }
    const customColors = isRecord(old.customColors) ? old.customColors : {};
    for (const [originalId, colors] of Object.entries(customColors)) {
      const map = state.migration.idMap.find(
        (entry) => entry.kind === "palette" && entry.originalId === originalId
      );
      const base =
        state.themes.find((theme) => theme.id === (map?.id ?? originalId)) ??
        (BUILTIN_PALETTES.find((palette) => palette.id === originalId)
          ? paletteToCompleteTheme(
              BUILTIN_PALETTES.find((palette) => palette.id === originalId)!,
              now
            )
          : createGovernanceProfile(
              { id: originalId, name: `Recovered ${originalId}`, colors: [], provenance: {} },
              now
            ));
      if (
        !Array.isArray(colors) ||
        !colors.every(
          (color) =>
            isRecord(color) && typeof color.key === "string" && typeof color.value === "string"
        )
      )
        throw new Error("Malformed custom color overrides. Nothing was migrated.");
      const overrides = colors.map((color) => ({
        ...color,
        label:
          typeof color.label === "string"
            ? color.label
            : (base.colors.find((entry) => entry.key === color.key)?.label ?? color.key),
      }));
      const mergedColors = [
        ...base.colors.map(
          (color) => overrides.find((override) => override.key === color.key) ?? color
        ),
        ...overrides.filter((color) => !base.colors.some((entry) => entry.key === color.key)),
      ];
      state.drafts.push(
        readLegacyProfile(
          {
            ...base,
            colors: mergedColors,
            provenance: state.themes.some((theme) => theme.id === base.id)
              ? base.provenance
              : { recoveredFrom: "legacy-palette", missingFields: missingLegacyFields },
          },
          "slot",
          now
        )
      );
    }
    const activeId = state.editorSession.activeThemeId ?? state.editorSession.selectedPaletteId;
    const active =
      state.drafts.find((theme) => theme.id === activeId) ??
      state.themes.find((theme) => theme.id === activeId) ??
      (BUILTIN_PALETTES.find((palette) => palette.id === activeId)
        ? paletteToCompleteTheme(
            BUILTIN_PALETTES.find((palette) => palette.id === activeId)!,
            now
          )
        : { ...paletteToCompleteTheme(BRAND_PALETTES[0], now), id: activeId });
    if (active && raw !== null) {
      const settings = Object.fromEntries(
        [...missingLegacyFields, "look", "fontSize", "typography"]
          .filter((key) => old[key] !== undefined)
          .map((key) => [key, old[key]])
      );
      // Slot appearance was already recorded separately from global controls.
      if (old.outputFormat !== undefined || old.outputFormatOverridden !== undefined) {
        Object.assign(
          settings,
          resolvePersistedOutputFormat(
            old.outputFormat,
            old.outputFormatOverridden,
            getRendererDefaultOutputFormat(
              typeof old.rendererTarget === "string" ? old.rendererTarget : active.rendererTarget
            )
          )
        );
      }
      if (state.editorSession.activeThemeId)
        for (const key of ["look", "fontSize", "typography"]) delete settings[key];
      if (
        !state.editorSession.activeThemeId &&
        typeof old.customThemeName === "string" &&
        old.customThemeName
      )
        settings.name = old.customThemeName;
      const draft = readLegacyProfile(
        {
          ...copy(active),
          ...settings,
          provenance:
            state.themes.some((theme) => theme.id === active.id) ||
            state.drafts.some((theme) => theme.id === active.id)
              ? active.provenance
              : { recoveredFrom: "legacy-palette", missingFields: missingLegacyFields },
        },
        "slot",
        now
      );
      state.drafts = [...state.drafts.filter((theme) => theme.id !== draft.id), draft];
    }
    if (state.themes.some((theme) => theme.provenance?.missingFields?.length)) {
      state.migration.warnings.push(
        "Recovered themes use defaults for settings that were not recorded. Review those defaults before saving changes."
      );
    }
    return { ok: true, state };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Migration failed.",
      ...(raw === null ? {} : { raw }),
    };
  }
}

/** Strict envelope validation: a partial/newer envelope must never become an empty library. */
export function parseThemeLibrary(raw: string): LibraryResult {
  try {
    const value: unknown = JSON.parse(raw);
    if (
      !isRecord(value) ||
      value.schemaVersion !== 2 ||
      !Number.isSafeInteger(value.revision) ||
      (value.revision as number) < 0 ||
      !Array.isArray(value.themes) ||
      !Array.isArray(value.drafts) ||
      (value.themeOrder !== undefined &&
        (!Array.isArray(value.themeOrder) ||
          !value.themeOrder.every((id) => typeof id === "string") ||
          new Set(value.themeOrder).size !== value.themeOrder.length)) ||
      !isRecord(value.editorSession) ||
      typeof value.editorSession.inputCode !== "string" ||
      !isRecord(value.editorSession.preferences) ||
      typeof value.editorSession.selectedPaletteId !== "string" ||
      !(
        value.editorSession.activeThemeId === null ||
        typeof value.editorSession.activeThemeId === "string"
      ) ||
      !isRecord(value.migration) ||
      !(
        value.migration.legacySource === null || typeof value.migration.legacySource === "string"
      ) ||
      typeof value.migration.recoveredAt !== "string" ||
      !Array.isArray(value.migration.idMap) ||
      !Array.isArray(value.migration.warnings) ||
      !value.migration.warnings.every((warning) => typeof warning === "string") ||
      !value.migration.idMap.every(
        (entry) =>
          isRecord(entry) &&
          ["slot", "palette"].includes(String(entry.kind)) &&
          Number.isSafeInteger(entry.index) &&
          typeof entry.originalId === "string" &&
          typeof entry.id === "string"
      )
    ) {
      throw new Error(
        "The theme library is malformed or uses a newer schema. Nothing was overwritten. Download workspace recovery data and use a compatible app."
      );
    }
    if (
      value.migration.legacySource !== null &&
      !isRecord(JSON.parse(value.migration.legacySource))
    )
      throw new Error(
        "The retained legacy snapshot is malformed. Keep the original workspace for recovery."
      );
    for (const records of [value.themes, value.drafts]) {
      const ids = new Set<string>();
      for (const record of records) {
        if (
          !isRecord(record) ||
          record.schemaVersion !== 3 ||
          typeof record.id !== "string" ||
          !record.id ||
          ids.has(record.id)
        )
          throw new Error("Invalid or duplicate theme record. Nothing was overwritten.");
        ids.add(record.id);
        const parsed = parseGovernanceProfile(
          JSON.stringify({ ...record, type: GOVERNANCE_PROFILE_TYPE })
        );
        if (!parsed.ok) throw new Error(parsed.error);
        for (const [key, field] of Object.entries(parsed.profile)) {
          if (field !== undefined && !(key in record))
            throw new Error(
              `Missing stored theme field: ${key}. Keep the original workspace for recovery.`
            );
        }
        // Parsing may normalize a legacy import, but must not repair stored v3 data silently.
        for (const [key, field] of Object.entries(record)) {
          if (
            normalizedJson(field) !== normalizedJson(parsed.profile[key as keyof GovernanceProfile])
          )
            throw new Error(
              `Invalid stored theme field: ${key}. Keep the original workspace for recovery.`
            );
        }
      }
    }
    return { ok: true, state: value as unknown as ThemeLibrary };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not read the theme library.",
      raw,
    };
  }
}

export function loadThemeLibrary(storage: Storage): LibraryResult {
  try {
    const raw = storage.getItem(THEME_LIBRARY_KEY);
    return raw === null
      ? prepareThemeLibrary(storage.getItem(LEGACY_THEME_KEY))
      : parseThemeLibrary(raw);
  } catch {
    return {
      ok: false,
      error:
        "Browser storage is unavailable. Keep this tab open and download your work before leaving.",
    };
  }
}

export function browserLibraryLock(): ExclusiveLibraryLock | null {
  if (typeof navigator === "undefined" || !navigator.locks?.request) return null;
  return (work) => navigator.locks.request(LIBRARY_LOCK_NAME, { mode: "exclusive" }, work);
}

/** Serialize cooperating tabs, compare versions inside the lock, and verify the committed bytes. */
export async function writeThemeLibrary(
  state: ThemeLibrary,
  expectedRevision: number,
  storage: Storage,
  exclusive: ExclusiveLibraryLock | null
): Promise<LibraryWriteResult> {
  if (!exclusive)
    return {
      ok: false,
      error:
        "This browser cannot coordinate safe saves across tabs. Download your work and use an HTTPS browser with Web Locks support.",
    };
  // Capture before waiting on the lock so callers cannot mutate a queued write.
  const snapshot = JSON.stringify(state);
  const validated = parseThemeLibrary(snapshot);
  if (!validated.ok) return validated;
  try {
    return await exclusive(() => {
      const current = loadThemeLibrary(storage);
      const legacyChanged =
        storage.getItem(LEGACY_THEME_KEY) !== validated.state.migration.legacySource;
      if (!current.ok || current.state.revision !== expectedRevision || legacyChanged) {
        const recoveryKey = `mtb.recovery.${crypto.randomUUID()}`;
        const error = legacyChanged
          ? "An older app changed the original workspace. Your current work was kept separately; the library was not overwritten."
          : "Another tab changed the library, or its data needs recovery. Your current work was kept separately; the library was not overwritten.";
        try {
          storage.setItem(recoveryKey, snapshot);
          if (storage.getItem(recoveryKey) !== snapshot)
            throw new Error("Recovery verification failed");
          return { ok: false, error, recoveryKey };
        } catch {
          return {
            ok: false,
            error:
              "The library changed and a recovery copy could not be stored. Keep this tab open and download your current work.",
          };
        }
      }
      const next = { ...validated.state, revision: expectedRevision + 1 };
      const serialized = JSON.stringify(next);
      storage.setItem(THEME_LIBRARY_KEY, serialized);
      if (storage.getItem(THEME_LIBRARY_KEY) !== serialized)
        return {
          ok: false,
          error:
            "The browser could not verify the saved data. Keep this tab open and download your work.",
        };
      return { ok: true, state: next };
    });
  } catch {
    return {
      ok: false,
      error:
        "The browser could not save your work. Storage may be full or unavailable. Keep this tab open and download a recovery copy.",
    };
  }
}

export function libraryToPortableJson(state: ThemeLibrary): string {
  return JSON.stringify(
    {
      type: THEME_LIBRARY_TYPE,
      schemaVersion: 1,
      themes: state.themes.map((theme) => JSON.parse(profileToPortableJson(theme))),
    },
    null,
    2
  );
}

export function parseLibraryImport(json: string):
  | {
      ok: true;
      themes: GovernanceProfile[];
      warnings: string[];
      diagnostics?: {
        missingKeys: string[];
        unknownKeys: string[];
        invalidValues: { key: string; value: string }[];
        warnValues: { key: string; value: string }[];
      };
    }
  | { ok: false; error: string } {
  try {
    if (json.length > 5_000_000)
      throw new Error("The library file is too large. Keep the original for recovery.");
    const data: unknown = JSON.parse(json);
    if (
      !isRecord(data) ||
      data.type !== THEME_LIBRARY_TYPE ||
      data.schemaVersion !== 1 ||
      !Array.isArray(data.themes)
    )
      throw new Error("Unsupported theme-library file. Nothing was imported.");
    const themes: GovernanceProfile[] = [];
    const warnings: string[] = [];
    for (const record of data.themes) {
      const result = parseGovernanceProfile(JSON.stringify(record));
      if (!result.ok) throw new Error(result.error);
      themes.push(result.profile);
      warnings.push(...result.warnings);
    }
    return { ok: true, themes, warnings: [...new Set(warnings)] };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not read the library file.",
    };
  }
}

export function parseThemeImport(json: string): ReturnType<typeof parseLibraryImport> {
  try {
    if (json.length > 5_000_000)
      throw new Error("The file is too large. Keep the original for recovery.");
    const data: unknown = JSON.parse(json);
    if (!isRecord(data)) throw new Error("The theme file is not an object.");
    if (data.type === THEME_LIBRARY_TYPE) return parseLibraryImport(json);
    if (data.type === GOVERNANCE_PROFILE_TYPE) {
      const parsed = parseGovernanceProfile(json);
      return parsed.ok ? { ok: true, themes: [parsed.profile], warnings: parsed.warnings } : parsed;
    }
    if (data.schemaVersion !== undefined && data.schemaVersion !== 1)
      throw new Error("Unsupported palette schema. Nothing was imported.");
    const parsed =
      data.type === "mtb-palette-bundle" ? parsePaletteBundle(json) : parsePortablePalette(json);
    if (!parsed.ok) return parsed;
    const records = "palettes" in parsed ? parsed.palettes : [parsed];
    return {
      ok: true,
      diagnostics: {
        missingKeys: [...new Set(records.flatMap((record) => record.missingKeys))],
        unknownKeys: [...new Set(records.flatMap((record) => record.unknownKeys))],
        invalidValues: records.flatMap((record) => record.invalidValues),
        warnValues: records.flatMap((record) => record.warnValues),
      },
      themes: records.map((record) => {
        const theme = paletteToCompleteTheme(record.palette);
        theme.provenance = { recoveredFrom: "legacy-palette", missingFields: missingLegacyFields };
        return theme;
      }),
      warnings: [
        "Legacy palettes did not record all theme settings. Review the recovered defaults.",
        ...records.flatMap((record) => [
          ...record.missingKeys.map((key) => `Missing color: ${key}`),
          ...record.unknownKeys.map((key) => `Unrecognized color token retained: ${key}`),
          ...record.invalidValues.map(
            ({ key, value }) =>
              `Invalid color value: ${key}: "${value}". The diagram may render incorrectly.`
          ),
          ...record.warnValues.map(
            ({ key, value }) =>
              `Review color value: ${key}: "${value}". ${/^(rgba?|hsla?)\s*\(/i.test(value) ? "CSS color function" : "Named CSS color"} may not render consistently in Mermaid.`
          ),
        ]),
      ],
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not read the theme file.",
    };
  }
}
