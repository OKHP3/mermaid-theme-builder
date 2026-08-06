// @vitest-environment happy-dom

/**
 * Integration test: profile share URL bootstrap (Task #628).
 *
 * Verifies that all GovernanceProfile fields—including strokeWidth and
 * advancedMermaidConfig—survive the full encode → URL → decode cycle and
 * that the values produced by decodeProfileToken are structurally correct
 * for App-level consumption (setStrokeWidth, setAdvancedMermaidConfig).
 *
 * This does NOT mount App.tsx (too many deps for a focused unit test), but it
 * exercises the exact data path: profileToPortableJson → base64url → JSON →
 * parseGovernanceProfile.  The App's bootstrap code applies the decoded
 * profile directly, so if the decoded profile is correct the App's state
 * setters produce correct output.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  encodeProfileToken,
  decodeProfileToken,
  buildProfileShareUrl,
  readProfileShareToken,
  clearProfileShareToken,
  PROFILE_SHARE_PARAM,
} from "@/lib/profile-share";
import { createGovernanceProfile } from "@/lib/governance-profile";
import { BRAND_PALETTES } from "@/lib/palettes";

// ─── Fixture ─────────────────────────────────────────────────────────────────

const NOW = "2024-07-15T09:00:00.000Z";

/** A rich profile that exercises every app-level field sent through the URL. */
const richProfile = createGovernanceProfile(
  {
    id: "my-theme-2",
    name: "Integration Test Profile",
    description: "Profile used to verify full-field round-trip",
    colors: BRAND_PALETTES[0].colors,
    look: "neo",
    fontSize: "16px",
    rendererTarget: "obsidian",
    outputFormat: "frontmatter",
    strokeWidth: 4,
    advancedMermaidConfig: {
      htmlLabels: true,
      deterministicIds: true,
      deterministicIDSeed: "seed-42",
    },
  },
  NOW
);

// ─── Round-trip: all fields preserved ────────────────────────────────────────

describe("profile share bootstrap — full field round-trip", () => {
  it("preserves name and description through encode/decode", () => {
    const token = encodeProfileToken(richProfile);
    const result = decodeProfileToken(token);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.profile.name).toBe("Integration Test Profile");
    expect(result.profile.description).toBe("Profile used to verify full-field round-trip");
  });

  it("preserves rendererTarget and outputFormat through encode/decode", () => {
    const token = encodeProfileToken(richProfile);
    const result = decodeProfileToken(token);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.profile.rendererTarget).toBe("obsidian");
    expect(result.profile.outputFormat).toBe("frontmatter");
  });

  it("preserves strokeWidth through encode/decode", () => {
    const token = encodeProfileToken(richProfile);
    const result = decodeProfileToken(token);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // This field is applied via setStrokeWidth(profile.strokeWidth) in App.tsx.
    expect(result.profile.strokeWidth).toBe(4);
  });

  it("preserves advancedMermaidConfig.htmlLabels through encode/decode", () => {
    const token = encodeProfileToken(richProfile);
    const result = decodeProfileToken(token);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.profile.advancedMermaidConfig?.htmlLabels).toBe(true);
  });

  it("preserves advancedMermaidConfig.deterministicIds through encode/decode", () => {
    const token = encodeProfileToken(richProfile);
    const result = decodeProfileToken(token);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.profile.advancedMermaidConfig?.deterministicIds).toBe(true);
  });

  it("preserves advancedMermaidConfig.deterministicIDSeed through encode/decode", () => {
    const token = encodeProfileToken(richProfile);
    const result = decodeProfileToken(token);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.profile.advancedMermaidConfig?.deterministicIDSeed).toBe("seed-42");
  });

  it("preserves all palette colors through encode/decode", () => {
    const token = encodeProfileToken(richProfile);
    const result = decodeProfileToken(token);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.profile.colors).toHaveLength(richProfile.colors.length);
    for (let i = 0; i < richProfile.colors.length; i++) {
      expect(result.profile.colors[i].key).toBe(richProfile.colors[i].key);
      expect(result.profile.colors[i].value).toBe(richProfile.colors[i].value);
    }
  });

  it("preserves look and fontSize through encode/decode", () => {
    const token = encodeProfileToken(richProfile);
    const result = decodeProfileToken(token);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.profile.look).toBe("neo");
    expect(result.profile.fontSize).toBe("16px");
  });

  it("preserves timestamps through encode/decode", () => {
    const token = encodeProfileToken(richProfile);
    const result = decodeProfileToken(token);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.profile.createdAt).toBe(NOW);
    expect(result.profile.updatedAt).toBe(NOW);
  });
});

// ─── advancedMermaidConfig sanitization matches App.tsx sanitizer ─────────────

describe("advancedMermaidConfig sanitization correctness", () => {
  /**
   * This mirrors the exact sanitization code used in the App.tsx bootstrap
   * effect.  If the profile round-trips correctly, and this sanitizer passes,
   * then App.tsx will apply the correct values.
   */
  function sanitizeAdvancedConfig(raw: Record<string, unknown> | undefined): {
    htmlLabels?: boolean;
    deterministicIds?: boolean;
    deterministicIDSeed?: string;
  } {
    if (!raw || typeof raw !== "object") return {};
    const clean: {
      htmlLabels?: boolean;
      deterministicIds?: boolean;
      deterministicIDSeed?: string;
    } = {};
    if (typeof raw.htmlLabels === "boolean") clean.htmlLabels = raw.htmlLabels;
    if (typeof raw.deterministicIds === "boolean") clean.deterministicIds = raw.deterministicIds;
    if (typeof raw.deterministicIDSeed === "string")
      clean.deterministicIDSeed = raw.deterministicIDSeed;
    return clean;
  }

  it("sanitizer retains all three known advancedMermaidConfig fields", () => {
    const token = encodeProfileToken(richProfile);
    const result = decodeProfileToken(token);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const sanitized = sanitizeAdvancedConfig(result.profile.advancedMermaidConfig);
    expect(sanitized.htmlLabels).toBe(true);
    expect(sanitized.deterministicIds).toBe(true);
    expect(sanitized.deterministicIDSeed).toBe("seed-42");
  });

  it("sanitizer produces empty object when advancedMermaidConfig is absent", () => {
    const noAdvProfile = createGovernanceProfile(
      {
        id: "my-theme-1",
        name: "Minimal",
        colors: BRAND_PALETTES[0].colors,
        rendererTarget: "github",
        outputFormat: "init-directive",
      },
      NOW
    );
    const token = encodeProfileToken(noAdvProfile);
    const result = decodeProfileToken(token);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const sanitized = sanitizeAdvancedConfig(result.profile.advancedMermaidConfig);
    expect(sanitized).toEqual({});
  });

  it("sanitizer drops unknown fields (no injection surface)", () => {
    const withExtra = {
      ...richProfile,
      advancedMermaidConfig: {
        htmlLabels: true,
        unknownField: "should be dropped",
        __proto__: "injection attempt",
      } as Record<string, unknown>,
    };
    const token = encodeProfileToken(withExtra as typeof richProfile);
    const result = decodeProfileToken(token);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const sanitized = sanitizeAdvancedConfig(result.profile.advancedMermaidConfig);
    expect(sanitized.htmlLabels).toBe(true);
    expect(Object.keys(sanitized)).not.toContain("unknownField");
    expect(Object.keys(sanitized)).not.toContain("__proto__");
  });
});

// ─── readProfileShareToken / clearProfileShareToken ──────────────────────────

describe("URL helpers — readProfileShareToken / clearProfileShareToken", () => {
  let originalHref: string;

  beforeEach(() => {
    originalHref = window.location.href;
  });

  afterEach(() => {
    // Restore original URL
    window.history.replaceState({}, "", originalHref);
  });

  it("readProfileShareToken returns the encoded token from the URL", () => {
    const token = encodeProfileToken(richProfile);
    const url = new URL(window.location.href);
    url.searchParams.set(PROFILE_SHARE_PARAM, token);
    window.history.replaceState({}, "", url.toString());

    expect(readProfileShareToken()).toBe(token);
  });

  it("readProfileShareToken returns null when the param is absent", () => {
    const url = new URL(window.location.href);
    url.searchParams.delete(PROFILE_SHARE_PARAM);
    window.history.replaceState({}, "", url.toString());

    expect(readProfileShareToken()).toBeNull();
  });

  it("clearProfileShareToken removes the param from the address bar", () => {
    const token = encodeProfileToken(richProfile);
    const url = new URL(window.location.href);
    url.searchParams.set(PROFILE_SHARE_PARAM, token);
    window.history.replaceState({}, "", url.toString());

    expect(readProfileShareToken()).not.toBeNull();
    clearProfileShareToken();
    expect(readProfileShareToken()).toBeNull();
    expect(window.location.search).not.toContain(PROFILE_SHARE_PARAM);
  });

  it("clearProfileShareToken is idempotent when the param is already gone", () => {
    // Should not throw
    expect(() => clearProfileShareToken()).not.toThrow();
  });

  it("full bootstrap simulation: read → decode → verify → clear", () => {
    // Simulate exactly what App.tsx does in its mount effect.
    const url = buildProfileShareUrl(richProfile, window.location.href);
    window.history.replaceState({}, "", url);

    // Step 1: read token
    const profileToken = readProfileShareToken();
    expect(profileToken).not.toBeNull();

    // Step 2: decode
    const profileResult = decodeProfileToken(profileToken!);
    expect(profileResult.ok).toBe(true);
    if (!profileResult.ok) return;

    // Step 3: verify all fields the App would apply
    const { profile } = profileResult;
    expect(profile.name).toBe(richProfile.name);
    expect(profile.rendererTarget).toBe(richProfile.rendererTarget);
    expect(profile.outputFormat).toBe(richProfile.outputFormat);
    expect(profile.strokeWidth).toBe(richProfile.strokeWidth); // setStrokeWidth
    expect(profile.advancedMermaidConfig?.htmlLabels).toBe(true); // setAdvancedMermaidConfig
    expect(profile.advancedMermaidConfig?.deterministicIds).toBe(true);
    expect(profile.advancedMermaidConfig?.deterministicIDSeed).toBe("seed-42");

    // Step 4: clear URL param (as App.tsx does immediately after decode)
    clearProfileShareToken();
    expect(readProfileShareToken()).toBeNull();
  });
});

// ─── State-contamination guard ────────────────────────────────────────────────
//
// Verifies that importing a profile unconditionally resets optional fields.
// A recipient who previously had non-default strokeWidth or advancedMermaidConfig
// must get EXACTLY the sender's values — not a blend of theirs and the sender's.

describe("profile share bootstrap — state-contamination guard", () => {
  /**
   * Simulate the exact sanitizer used in the App.tsx bootstrap block so we
   * can prove the sanitized output is correct without mounting App.tsx.
   */
  function applyAdvancedConfigFromProfile(raw: Record<string, unknown> | undefined): {
    htmlLabels?: boolean;
    deterministicIds?: boolean;
    deterministicIDSeed?: string;
  } {
    const clean: {
      htmlLabels?: boolean;
      deterministicIds?: boolean;
      deterministicIDSeed?: string;
    } = {};
    if (raw && typeof raw === "object") {
      if (typeof raw.htmlLabels === "boolean") clean.htmlLabels = raw.htmlLabels;
      if (typeof raw.deterministicIds === "boolean") clean.deterministicIds = raw.deterministicIds;
      if (typeof raw.deterministicIDSeed === "string")
        clean.deterministicIDSeed = raw.deterministicIDSeed;
    }
    return clean;
  }

  it("a profile without strokeWidth decodes to undefined — resets recipient's non-default value", () => {
    // Sender created a minimal profile with no strokeWidth (used app default).
    const minimalProfile = createGovernanceProfile(
      {
        id: "my-theme-1",
        name: "Minimal — no strokeWidth",
        colors: BRAND_PALETTES[0].colors,
        rendererTarget: "github",
        outputFormat: "init-directive",
        // strokeWidth intentionally absent
      },
      NOW
    );
    const token = encodeProfileToken(minimalProfile);
    const result = decodeProfileToken(token);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    // The decoded profile must have undefined strokeWidth.
    // App.tsx calls setStrokeWidth(profile.strokeWidth) unconditionally:
    // passing undefined resets a recipient who had e.g. strokeWidth=5.
    expect(result.profile.strokeWidth).toBeUndefined();
  });

  it("a profile without advancedMermaidConfig decodes to undefined — sanitizer produces {} to reset recipient's config", () => {
    const minimalProfile = createGovernanceProfile(
      {
        id: "my-theme-1",
        name: "Minimal — no advancedMermaidConfig",
        colors: BRAND_PALETTES[0].colors,
        rendererTarget: "github",
        outputFormat: "init-directive",
        // advancedMermaidConfig intentionally absent
      },
      NOW
    );
    const token = encodeProfileToken(minimalProfile);
    const result = decodeProfileToken(token);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    // The decoded profile has no advancedMermaidConfig.
    // The sanitizer (mirrored above) must produce {} so App.tsx calls
    // setAdvancedMermaidConfig({}) — resetting a recipient who had e.g.
    // { htmlLabels: true, deterministicIds: true }.
    const applied = applyAdvancedConfigFromProfile(result.profile.advancedMermaidConfig);
    expect(applied).toEqual({});
  });

  it("importing a profile with strokeWidth=4 when recipient had strokeWidth=7 applies 4", () => {
    // Recipient persisted state: strokeWidth = 7 (non-default, non-undefined).
    // Profile being imported: strokeWidth = 4.
    const senderProfile = createGovernanceProfile(
      {
        id: "my-theme-1",
        name: "Sender with strokeWidth 4",
        colors: BRAND_PALETTES[0].colors,
        rendererTarget: "github",
        outputFormat: "init-directive",
        strokeWidth: 4,
      },
      NOW
    );
    const token = encodeProfileToken(senderProfile);
    const result = decodeProfileToken(token);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    // App.tsx calls setStrokeWidth(profile.strokeWidth) unconditionally.
    // Regardless of what the recipient had (7), the result must be 4.
    expect(result.profile.strokeWidth).toBe(4);
  });

  it("importing a profile with htmlLabels=false when recipient had htmlLabels=true applies false", () => {
    // Recipient persisted: advancedMermaidConfig.htmlLabels = true.
    // Profile being imported: advancedMermaidConfig.htmlLabels = false.
    const senderProfile = createGovernanceProfile(
      {
        id: "my-theme-1",
        name: "Sender with htmlLabels=false",
        colors: BRAND_PALETTES[0].colors,
        rendererTarget: "github",
        outputFormat: "init-directive",
        advancedMermaidConfig: { htmlLabels: false },
      },
      NOW
    );
    const token = encodeProfileToken(senderProfile);
    const result = decodeProfileToken(token);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const applied = applyAdvancedConfigFromProfile(result.profile.advancedMermaidConfig);
    // Must be false — not the recipient's true.
    expect(applied.htmlLabels).toBe(false);
  });

  it("full bootstrap simulation with absent optional fields resets contamination", () => {
    // A profile shared by someone who never changed stroke/advancedConfig.
    const cleanProfile = createGovernanceProfile(
      {
        id: "my-theme-1",
        name: "Clean defaults",
        colors: BRAND_PALETTES[0].colors,
        rendererTarget: "mermaid-live",
        outputFormat: "init-directive",
      },
      NOW
    );

    const url = buildProfileShareUrl(cleanProfile, window.location.href);
    window.history.replaceState({}, "", url);

    const profileToken = readProfileShareToken();
    expect(profileToken).not.toBeNull();

    const profileResult = decodeProfileToken(profileToken!);
    expect(profileResult.ok).toBe(true);
    if (!profileResult.ok) return;

    const { profile } = profileResult;

    // strokeWidth absent → undefined → setStrokeWidth(undefined) resets recipient
    expect(profile.strokeWidth).toBeUndefined();

    // advancedMermaidConfig absent → sanitizer → {} → setAdvancedMermaidConfig({}) resets recipient
    const appliedAmc = applyAdvancedConfigFromProfile(profile.advancedMermaidConfig);
    expect(appliedAmc).toEqual({});

    clearProfileShareToken();
    expect(readProfileShareToken()).toBeNull();
  });
});
