import type { Palette, ThemeColor } from "./palettes";
import type { TypographySettings } from "./typography";

export const PERSISTENCE_SCHEMA_VERSION = 1;
const STORAGE_KEY = "mtb.state.v1";

export interface PersistedState {
  schemaVersion: number;
  selectedPaletteId: string;
  customColors: Record<string, ThemeColor[]>;
  includeMetaComments: boolean;
  includeBadge: boolean;
  customThemeName: string;
  inputCode: string;
  userPalettes: Palette[];
  recentPaletteIds?: string[];
  look?: string;
  fontSize?: string;
  typography?: TypographySettings;
  rendererTarget?: string;
  previewMode?: string;
}

export const DEFAULT_PERSISTED_STATE: Omit<PersistedState, "selectedPaletteId" | "inputCode"> = {
  schemaVersion: PERSISTENCE_SCHEMA_VERSION,
  customColors: {},
  includeMetaComments: true,
  includeBadge: true,
  customThemeName: "",
  userPalettes: [],
  recentPaletteIds: [],
};

function safeStorage(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    if (!window.localStorage) return null;
    // Probe access (private mode can throw).
    const k = "__mtb_probe__";
    window.localStorage.setItem(k, "1");
    window.localStorage.removeItem(k);
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadPersistedState(): Partial<PersistedState> | null {
  const storage = safeStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    if (typeof parsed.schemaVersion !== "number") return null;
    if (parsed.schemaVersion > PERSISTENCE_SCHEMA_VERSION) {
      // Newer schema we don't understand — bail out gracefully.
      console.warn("[mtb] persisted state has newer schema; ignoring");
      return null;
    }
    return parsed as Partial<PersistedState>;
  } catch (err) {
    console.warn("[mtb] failed to load persisted state", err);
    return null;
  }
}

export function savePersistedState(state: PersistedState): void {
  const storage = safeStorage();
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn("[mtb] failed to persist state", err);
  }
}

export function clearPersistedState(): void {
  const storage = safeStorage();
  if (!storage) return;
  try {
    storage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn("[mtb] failed to clear persisted state", err);
  }
}

// ───────────────────────── shareable URL ─────────────────────────

export interface ShareablePayload {
  v: number;
  paletteName?: string;
  paletteId?: string;
  themeVariables: Record<string, string>;
  customThemeName?: string;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  const b64 = typeof btoa !== "undefined" ? btoa(binary) : Buffer.from(binary, "binary").toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const binary = typeof atob !== "undefined" ? atob(b64) : Buffer.from(b64, "base64").toString("binary");
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function encodeShareableTheme(payload: ShareablePayload): string {
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);
  return bytesToBase64Url(bytes);
}

export function decodeShareableTheme(token: string): ShareablePayload | null {
  try {
    const bytes = base64UrlToBytes(token);
    const json = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json);
    if (typeof parsed !== "object" || parsed === null) return null;
    if (typeof parsed.v !== "number") return null;
    if (typeof parsed.themeVariables !== "object" || parsed.themeVariables === null) return null;
    // Sanitize themeVariables to a strict Record<string, string>
    const cleanVars: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed.themeVariables as Record<string, unknown>)) {
      if (typeof k === "string" && typeof v === "string") cleanVars[k] = v;
    }
    const out: ShareablePayload = {
      v: parsed.v,
      themeVariables: cleanVars,
      paletteName: typeof parsed.paletteName === "string" ? parsed.paletteName : undefined,
      paletteId: typeof parsed.paletteId === "string" ? parsed.paletteId : undefined,
      customThemeName: typeof parsed.customThemeName === "string" ? parsed.customThemeName : undefined,
    };
    return out;
  } catch (err) {
    console.warn("[mtb] failed to decode share token", err);
    return null;
  }
}

export function paletteToShareablePayload(palette: Palette, customThemeName: string): ShareablePayload {
  const themeVariables: Record<string, string> = {};
  for (const c of palette.colors) themeVariables[c.key] = c.value;
  return {
    v: 1,
    paletteId: palette.id,
    paletteName: palette.name,
    themeVariables,
    customThemeName: customThemeName || undefined,
  };
}
