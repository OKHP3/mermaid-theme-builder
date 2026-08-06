/**
 * GovernanceProfile — the first-class versioned styling contract for MTB.
 *
 * A governance profile bundles the complete styling intent (colors, look,
 * typography, renderer target, output format, stroke width) plus formal
 * metadata (schema version, Mermaid version verified, created/updated
 * timestamps) into one portable, exportable object.
 *
 * The profile is the authoritative answer to "What contract am I applying?"
 * It can be serialised to JSON for import/export and embedded in export
 * artifact headers.
 */

import type { ThemeColor } from "./palettes";
import type { TypographySettings } from "./typography";
import { DEFAULT_TYPOGRAPHY } from "./typography";
import type { MermaidLook } from "./theme-engine";
import type { MyThemeSlot } from "./my-theme-slots";
import { MERMAID_VERSION_VERIFIED } from "@/data/mermaid-capabilities";

// ─── Schema version ──────────────────────────────────────────────────────────

/** Schema version for GovernanceProfile JSON. Bump on every breaking change. */
export const GOVERNANCE_PROFILE_SCHEMA_VERSION = 2 as const;

// ─── Core type ───────────────────────────────────────────────────────────────

export interface GovernanceProfile {
  /** Discriminator — always 2 for GovernanceProfile objects. */
  schemaVersion: 2;
  /** Stable identifier (UUID-like slug, e.g. "my-theme-1" or "gp-<hash>"). */
  id: string;
  /** Display name shown in UI and embedded in exports. */
  name: string;
  /** Optional short description of this profile's intent. */
  description: string;

  // ── Palette ──────────────────────────────────────────────────────────────
  /** Color tokens that constitute the Mermaid palette. */
  colors: ThemeColor[];

  // ── Styling ──────────────────────────────────────────────────────────────
  /** Mermaid diagram look variant. */
  look: MermaidLook;
  /** Explicit node font size override (e.g. "16px"), or "" for palette default. */
  fontSize: string;
  /** Five-tier typography settings. */
  typography: TypographySettings;
  /** Global classDef stroke-width override in pixels, or undefined for default. */
  strokeWidth?: number;

  // ── Renderer ─────────────────────────────────────────────────────────────
  /** Target renderer ID (e.g. "github", "mermaid-live"), or "" for none. */
  rendererTarget: string;
  /** Preferred output format for the theme directive. */
  outputFormat: "init-directive" | "frontmatter";

  // ── Advanced (future-facing, optional) ───────────────────────────────────
  /** Raw Mermaid `config` overrides beyond what themeVariables expose. */
  advancedMermaidConfig?: Record<string, unknown>;
  /** Named semantic classDef strings attached to this profile. */
  semanticClassDefs?: string[];

  // ── Metadata ─────────────────────────────────────────────────────────────
  /** ISO 8601 timestamp when this profile was first created. */
  createdAt: string;
  /** ISO 8601 timestamp of the most recent modification. */
  updatedAt: string;
  /**
   * Mermaid version this profile was authored and verified against.
   * Taken from MERMAID_VERSION_VERIFIED at creation time.
   */
  mermaidVersionVerified: string;
}

// ─── Factory ─────────────────────────────────────────────────────────────────

/**
 * Create a brand-new GovernanceProfile with sensible defaults.
 * The `now` parameter is injectable for deterministic tests.
 */
export function createGovernanceProfile(
  opts: {
    id?: string;
    name: string;
    description?: string;
    colors: ThemeColor[];
    look?: MermaidLook;
    fontSize?: string;
    typography?: TypographySettings;
    rendererTarget?: string;
    outputFormat?: "init-directive" | "frontmatter";
    strokeWidth?: number;
    advancedMermaidConfig?: Record<string, unknown>;
    semanticClassDefs?: string[];
  },
  now?: string
): GovernanceProfile {
  const ts = now ?? new Date().toISOString();
  return {
    schemaVersion: 2,
    id: opts.id ?? `gp-${Date.now().toString(36)}`,
    name: opts.name,
    description: opts.description ?? "",
    colors: opts.colors.map((c) => ({ ...c })),
    look: opts.look ?? "classic",
    fontSize: opts.fontSize ?? "",
    typography: opts.typography
      ? cloneTypography(opts.typography)
      : cloneTypography(DEFAULT_TYPOGRAPHY),
    rendererTarget: opts.rendererTarget ?? "",
    outputFormat: opts.outputFormat ?? "init-directive",
    strokeWidth: opts.strokeWidth,
    advancedMermaidConfig: opts.advancedMermaidConfig,
    semanticClassDefs: opts.semanticClassDefs,
    createdAt: ts,
    updatedAt: ts,
    mermaidVersionVerified: MERMAID_VERSION_VERIFIED,
  };
}

/** Deep-clone a TypographySettings object so profiles don't share references. */
function cloneTypography(t: TypographySettings): TypographySettings {
  return {
    diagramTitle: { ...t.diagramTitle },
    subgraphTitle: { ...t.subgraphTitle },
    nestedSubgraphTitle: { ...t.nestedSubgraphTitle },
    nodeLabel: { ...t.nodeLabel },
    edgeLabel: { ...t.edgeLabel },
  };
}

// ─── Migration ───────────────────────────────────────────────────────────────

/**
 * Migrate a MyThemeSlot (schema v1-style, no schemaVersion) to a
 * GovernanceProfile (schema v2). Idempotent: if the slot already carries
 * the optional governance fields, they are preserved.
 *
 * The caller must supply the current app-level renderer / format / strokeWidth
 * state so the profile captures the full contract at migration time.
 */
export function migrateSlotToProfile(
  slot: MyThemeSlot,
  appState?: {
    rendererTarget?: string;
    outputFormat?: "init-directive" | "frontmatter";
    strokeWidth?: number;
    advancedMermaidConfig?: Record<string, unknown>;
  },
  now?: string
): GovernanceProfile {
  const ts = now ?? new Date().toISOString();
  return {
    schemaVersion: 2,
    id: slot.id,
    name: slot.name,
    description: "",
    colors: slot.colors.map((c) => ({ ...c })),
    look: slot.look,
    fontSize: slot.fontSize,
    typography: cloneTypography(slot.typography),
    rendererTarget: appState?.rendererTarget ?? "",
    outputFormat: appState?.outputFormat ?? "init-directive",
    strokeWidth: appState?.strokeWidth,
    advancedMermaidConfig: appState?.advancedMermaidConfig,
    createdAt: ts,
    updatedAt: ts,
    mermaidVersionVerified: MERMAID_VERSION_VERIFIED,
  };
}

/**
 * Convert a GovernanceProfile back to the MyThemeSlot shape for backward
 * compatibility with the slot system. The slot carries colors + look +
 * fontSize + typography; the remaining profile fields (renderer, format, etc.)
 * are not part of the slot and must be applied separately at the app level.
 */
export function profileToSlot(profile: GovernanceProfile): MyThemeSlot {
  return {
    id: profile.id as import("./my-theme-slots").MyThemeSlotId,
    name: profile.name,
    colors: profile.colors.map((c) => ({ ...c })),
    look: profile.look,
    fontSize: profile.fontSize,
    typography: cloneTypography(profile.typography),
  };
}

// ─── Duplicate ───────────────────────────────────────────────────────────────

/**
 * Produce a copy of a profile with a new id and name, updating the timestamps.
 */
export function duplicateGovernanceProfile(
  source: GovernanceProfile,
  newId: string,
  newName: string,
  now?: string
): GovernanceProfile {
  const ts = now ?? new Date().toISOString();
  return {
    ...source,
    id: newId,
    name: newName,
    colors: source.colors.map((c) => ({ ...c })),
    typography: cloneTypography(source.typography),
    createdAt: ts,
    updatedAt: ts,
  };
}

// ─── Serialisation / deserialisation ─────────────────────────────────────────

/** JSON discriminator for a single governance profile export file. */
export const GOVERNANCE_PROFILE_TYPE = "mtb-governance-profile";

/**
 * Serialize a GovernanceProfile to a portable JSON string.
 * The output includes all profile fields plus a `type` discriminator
 * so import can distinguish it from legacy palette JSON files.
 *
 * NOTE: This intentionally does NOT include `inputCode` or any user-entered
 * Mermaid content — profiles are privacy-safe to share.
 */
export function profileToPortableJson(profile: GovernanceProfile): string {
  const payload = {
    schemaVersion: GOVERNANCE_PROFILE_SCHEMA_VERSION,
    type: GOVERNANCE_PROFILE_TYPE,
    id: profile.id,
    name: profile.name,
    description: profile.description,
    colors: profile.colors,
    look: profile.look,
    fontSize: profile.fontSize,
    typography: profile.typography,
    rendererTarget: profile.rendererTarget,
    outputFormat: profile.outputFormat,
    strokeWidth: profile.strokeWidth,
    advancedMermaidConfig: profile.advancedMermaidConfig,
    semanticClassDefs: profile.semanticClassDefs,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
    mermaidVersionVerified: profile.mermaidVersionVerified,
  };
  return JSON.stringify(payload, null, 2);
}

export interface GovernanceProfileImport {
  ok: true;
  profile: GovernanceProfile;
  warnings: string[];
}
export interface GovernanceProfileImportError {
  ok: false;
  error: string;
}

/**
 * Parse a governance profile from a JSON string.
 * Returns ok:true with the profile and any non-fatal warnings, or ok:false
 * with an error message for hard failures.
 */
export function parseGovernanceProfile(
  json: string
): GovernanceProfileImport | GovernanceProfileImportError {
  try {
    const data = JSON.parse(json);
    if (typeof data !== "object" || data === null) {
      return { ok: false, error: "Not a JSON object." };
    }
    if (data.type !== GOVERNANCE_PROFILE_TYPE) {
      return {
        ok: false,
        error: `Missing or wrong 'type' field — expected '${GOVERNANCE_PROFILE_TYPE}'.`,
      };
    }
    const warnings: string[] = [];

    // ── Schema version check ────────────────────────────────────────────────
    // Non-fatal: newer / unknown versions are accepted with a warning so
    // users can still recover as much data as possible.
    if (typeof data.schemaVersion === "number") {
      if (data.schemaVersion > GOVERNANCE_PROFILE_SCHEMA_VERSION) {
        warnings.push(
          `Profile was created with a newer schema (v${data.schemaVersion}). ` +
            `This app understands up to v${GOVERNANCE_PROFILE_SCHEMA_VERSION} — ` +
            `some fields may not be applied correctly.`
        );
      } else if (data.schemaVersion < GOVERNANCE_PROFILE_SCHEMA_VERSION) {
        warnings.push(
          `Profile schema migrated from v${data.schemaVersion} to ` +
            `v${GOVERNANCE_PROFILE_SCHEMA_VERSION} — all known fields preserved.`
        );
      }
      // schemaVersion === GOVERNANCE_PROFILE_SCHEMA_VERSION: no warning needed.
    } else {
      // Missing schemaVersion — pre-schema or third-party export; warn and continue.
      warnings.push(
        "Profile has no recognized schema version — attempting import with field defaults."
      );
    }

    if (!Array.isArray(data.colors) || data.colors.length === 0) {
      return { ok: false, error: "Missing or empty 'colors' array." };
    }

    // Validate colors
    const colors: ThemeColor[] = data.colors.map((c: unknown) => {
      if (typeof c !== "object" || c === null) throw new Error("Invalid color entry");
      const cc = c as Record<string, unknown>;
      if (typeof cc.key !== "string") throw new Error("Color entry missing string 'key'");
      if (typeof cc.label !== "string") throw new Error("Color entry missing string 'label'");
      const value = typeof cc.value === "string" ? cc.value : "[invalid]";
      return { key: cc.key as string, label: cc.label as string, value };
    });

    // Validate / coerce look
    const validLooks = ["classic", "neo", "handDrawn"];
    const look: MermaidLook = validLooks.includes(data.look) ? data.look : "classic";
    if (!validLooks.includes(data.look)) {
      warnings.push(`Unknown look '${data.look}' — defaulted to 'classic'.`);
    }

    // Validate / coerce outputFormat
    const validFormats = ["init-directive", "frontmatter"];
    const outputFormat: "init-directive" | "frontmatter" = validFormats.includes(data.outputFormat)
      ? data.outputFormat
      : "init-directive";
    if (data.outputFormat && !validFormats.includes(data.outputFormat)) {
      warnings.push(`Unknown outputFormat '${data.outputFormat}' — defaulted to 'init-directive'.`);
    }

    // Coerce typography
    const typography: TypographySettings = isTypographySettings(data.typography)
      ? cloneTypography(data.typography)
      : cloneTypography(DEFAULT_TYPOGRAPHY);
    if (!isTypographySettings(data.typography)) {
      warnings.push("Typography settings were absent or malformed — defaults applied.");
    }

    const now = new Date().toISOString();
    const profile: GovernanceProfile = {
      schemaVersion: 2,
      id: typeof data.id === "string" && data.id ? data.id : `gp-${Date.now().toString(36)}`,
      name: typeof data.name === "string" && data.name ? data.name : "Imported Profile",
      description: typeof data.description === "string" ? data.description : "",
      colors,
      look,
      fontSize: typeof data.fontSize === "string" ? data.fontSize : "",
      typography,
      rendererTarget: typeof data.rendererTarget === "string" ? data.rendererTarget : "",
      outputFormat,
      strokeWidth:
        typeof data.strokeWidth === "number" && data.strokeWidth >= 1
          ? data.strokeWidth
          : undefined,
      advancedMermaidConfig:
        typeof data.advancedMermaidConfig === "object" && data.advancedMermaidConfig !== null
          ? (data.advancedMermaidConfig as Record<string, unknown>)
          : undefined,
      semanticClassDefs: Array.isArray(data.semanticClassDefs)
        ? (data.semanticClassDefs as unknown[]).filter((s): s is string => typeof s === "string")
        : undefined,
      createdAt: typeof data.createdAt === "string" ? data.createdAt : now,
      updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : now,
      mermaidVersionVerified:
        typeof data.mermaidVersionVerified === "string"
          ? data.mermaidVersionVerified
          : MERMAID_VERSION_VERIFIED,
    };

    return { ok: true, profile, warnings };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Validate a raw JSON string as a GovernanceProfile without applying it to
 * app state. Useful for pre-flight checks and UI feedback before import.
 *
 * Returns `{ valid: true, warnings }` when the JSON is a parseable profile
 * (including cases where version migration was applied or fields were defaulted),
 * or `{ valid: false, errors }` when the JSON is structurally unrecoverable.
 *
 * This is a thin wrapper around `parseGovernanceProfile` with a simpler result
 * shape for callers that only need a validity signal.
 */
export function validateGovernanceProfile(
  json: string
): { valid: true; warnings: string[] } | { valid: false; errors: string[] } {
  const result = parseGovernanceProfile(json);
  if (result.ok) {
    return { valid: true, warnings: result.warnings };
  }
  return { valid: false, errors: [result.error] };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isTypographySettings(t: unknown): t is TypographySettings {
  if (typeof t !== "object" || t === null) return false;
  const obj = t as Record<string, unknown>;
  const tiers = ["diagramTitle", "subgraphTitle", "nestedSubgraphTitle", "nodeLabel", "edgeLabel"];
  return tiers.every((tier) => {
    const entry = obj[tier];
    if (typeof entry !== "object" || entry === null) return false;
    const e = entry as Record<string, unknown>;
    return typeof e.fontSize === "number";
  });
}

/**
 * Build a compact summary string for embedding in export artifact headers.
 * Format: "Profile: <name> · Renderer: <renderer> · Mermaid: <version>"
 */
export function buildProfileHeaderComment(profile: GovernanceProfile): string {
  const parts = [`Profile: ${profile.name}`, `Schema: v${profile.schemaVersion}`];
  if (profile.rendererTarget) parts.push(`Renderer: ${profile.rendererTarget}`);
  parts.push(`Mermaid verified: ${profile.mermaidVersionVerified}`);
  return `%% ${parts.join(" · ")}`;
}
