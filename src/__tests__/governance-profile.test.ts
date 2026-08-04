/**
 * Unit tests for the GovernanceProfile module:
 * - Schema / interface invariants
 * - createGovernanceProfile factory
 * - migrateSlotToProfile migration
 * - profileToPortableJson / parseGovernanceProfile round-trip
 * - duplicateGovernanceProfile
 * - profileToSlot back-conversion
 * - buildProfileHeaderComment
 */

import { describe, it, expect } from "vitest";
import {
  createGovernanceProfile,
  duplicateGovernanceProfile,
  migrateSlotToProfile,
  parseGovernanceProfile,
  profileToPortableJson,
  profileToSlot,
  buildProfileHeaderComment,
  GOVERNANCE_PROFILE_SCHEMA_VERSION,
  GOVERNANCE_PROFILE_TYPE,
  type GovernanceProfile,
} from "@/lib/governance-profile";
import { DEFAULT_TYPOGRAPHY } from "@/lib/typography";
import { MERMAID_VERSION_VERIFIED } from "@/data/mermaid-capabilities";
import type { MyThemeSlot } from "@/lib/my-theme-slots";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-01-01T00:00:00.000Z";

const TEST_COLORS = [
  { key: "primaryColor", label: "Primary", value: "#1a73e8" },
  { key: "secondaryColor", label: "Secondary", value: "#ea4335" },
];

function makeProfile(overrides?: Partial<GovernanceProfile>): GovernanceProfile {
  return createGovernanceProfile(
    {
      id: "test-profile",
      name: "Test Profile",
      description: "A test governance profile",
      colors: TEST_COLORS,
      look: "classic",
      fontSize: "14px",
      typography: DEFAULT_TYPOGRAPHY,
      rendererTarget: "github",
      outputFormat: "init-directive",
    },
    FIXED_NOW
  );
}

const SLOT: MyThemeSlot = {
  id: "my-theme-1" as import("@/lib/my-theme-slots").MyThemeSlotId,
  name: "My Slot",
  colors: TEST_COLORS,
  look: "classic",
  fontSize: "",
  typography: DEFAULT_TYPOGRAPHY,
};

// ─── createGovernanceProfile ──────────────────────────────────────────────────

describe("createGovernanceProfile", () => {
  it("sets schemaVersion to 2", () => {
    const profile = makeProfile();
    expect(profile.schemaVersion).toBe(2);
    expect(profile.schemaVersion).toBe(GOVERNANCE_PROFILE_SCHEMA_VERSION);
  });

  it("uses the provided id", () => {
    const profile = makeProfile();
    expect(profile.id).toBe("test-profile");
  });

  it("defaults to generated id when none given", () => {
    const profile = createGovernanceProfile({ name: "Auto", colors: TEST_COLORS }, FIXED_NOW);
    expect(typeof profile.id).toBe("string");
    expect(profile.id.length).toBeGreaterThan(0);
  });

  it("stores mermaidVersionVerified from MERMAID_VERSION_VERIFIED", () => {
    const profile = makeProfile();
    expect(profile.mermaidVersionVerified).toBe(MERMAID_VERSION_VERIFIED);
  });

  it("sets createdAt and updatedAt to the provided now string", () => {
    const profile = makeProfile();
    expect(profile.createdAt).toBe(FIXED_NOW);
    expect(profile.updatedAt).toBe(FIXED_NOW);
  });

  it("deep-clones colors so mutations do not escape", () => {
    const profile = makeProfile();
    profile.colors[0].value = "#mutated";
    // Original TEST_COLORS must not be affected
    expect(TEST_COLORS[0].value).toBe("#1a73e8");
  });

  it("deep-clones typography so mutations do not escape", () => {
    const profile = makeProfile();
    profile.typography.diagramTitle.fontSize = 9999;
    expect(DEFAULT_TYPOGRAPHY.diagramTitle.fontSize).not.toBe(9999);
  });

  it("defaults look to 'classic' when not provided", () => {
    const profile = createGovernanceProfile({ name: "X", colors: TEST_COLORS }, FIXED_NOW);
    expect(profile.look).toBe("classic");
  });

  it("defaults outputFormat to 'init-directive' when not provided", () => {
    const profile = createGovernanceProfile({ name: "X", colors: TEST_COLORS }, FIXED_NOW);
    expect(profile.outputFormat).toBe("init-directive");
  });
});

// ─── migrateSlotToProfile ────────────────────────────────────────────────────

describe("migrateSlotToProfile", () => {
  it("sets schemaVersion to 2", () => {
    const profile = migrateSlotToProfile(SLOT, {}, FIXED_NOW);
    expect(profile.schemaVersion).toBe(2);
  });

  it("copies slot id and name", () => {
    const profile = migrateSlotToProfile(SLOT, {}, FIXED_NOW);
    expect(profile.id).toBe(SLOT.id);
    expect(profile.name).toBe(SLOT.name);
  });

  it("copies colors from slot", () => {
    const profile = migrateSlotToProfile(SLOT, {}, FIXED_NOW);
    expect(profile.colors).toHaveLength(SLOT.colors.length);
    expect(profile.colors[0].key).toBe(TEST_COLORS[0].key);
  });

  it("picks up appState.rendererTarget when provided", () => {
    const profile = migrateSlotToProfile(SLOT, { rendererTarget: "obsidian" }, FIXED_NOW);
    expect(profile.rendererTarget).toBe("obsidian");
  });

  it("defaults rendererTarget to empty string when appState is absent", () => {
    const profile = migrateSlotToProfile(SLOT, undefined, FIXED_NOW);
    expect(profile.rendererTarget).toBe("");
  });

  it("picks up appState.outputFormat when provided", () => {
    const profile = migrateSlotToProfile(SLOT, { outputFormat: "frontmatter" }, FIXED_NOW);
    expect(profile.outputFormat).toBe("frontmatter");
  });

  it("is idempotent: running twice on same slot produces identical colors", () => {
    const p1 = migrateSlotToProfile(SLOT, {}, FIXED_NOW);
    const p2 = migrateSlotToProfile(SLOT, {}, FIXED_NOW);
    expect(p1.colors).toEqual(p2.colors);
  });
});

// ─── profileToSlot ───────────────────────────────────────────────────────────

describe("profileToSlot", () => {
  it("converts profile back to a MyThemeSlot-compatible shape", () => {
    const profile = makeProfile();
    const slot = profileToSlot(profile);
    expect(slot.id).toBe(profile.id);
    expect(slot.name).toBe(profile.name);
    expect(slot.colors).toEqual(profile.colors);
    expect(slot.look).toBe(profile.look);
    expect(slot.fontSize).toBe(profile.fontSize);
  });

  it("deep-clones colors so mutations on slot do not bleed back", () => {
    const profile = makeProfile();
    const slot = profileToSlot(profile);
    slot.colors[0].value = "#slotmutated";
    expect(profile.colors[0].value).toBe("#1a73e8");
  });
});

// ─── duplicateGovernanceProfile ──────────────────────────────────────────────

describe("duplicateGovernanceProfile", () => {
  it("produces a new id and name", () => {
    const source = makeProfile();
    const dup = duplicateGovernanceProfile(source, "dup-id", "Dup Name", FIXED_NOW);
    expect(dup.id).toBe("dup-id");
    expect(dup.name).toBe("Dup Name");
  });

  it("copies all other fields from source", () => {
    const source = makeProfile();
    const dup = duplicateGovernanceProfile(source, "dup-id", "Dup", FIXED_NOW);
    expect(dup.rendererTarget).toBe(source.rendererTarget);
    expect(dup.outputFormat).toBe(source.outputFormat);
    expect(dup.colors).toEqual(source.colors);
  });

  it("deep-clones colors", () => {
    const source = makeProfile();
    const dup = duplicateGovernanceProfile(source, "dup-id", "Dup", FIXED_NOW);
    dup.colors[0].value = "#dupmutated";
    expect(source.colors[0].value).toBe("#1a73e8");
  });
});

// ─── profileToPortableJson / parseGovernanceProfile round-trip ────────────────

describe("profileToPortableJson + parseGovernanceProfile round-trip", () => {
  it("serialises and deserialises losslessly", () => {
    const original = makeProfile();
    const json = profileToPortableJson(original);
    const result = parseGovernanceProfile(json);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const restored = result.profile;
    expect(restored.id).toBe(original.id);
    expect(restored.name).toBe(original.name);
    expect(restored.schemaVersion).toBe(2);
    expect(restored.colors).toEqual(original.colors);
    expect(restored.look).toBe(original.look);
    expect(restored.rendererTarget).toBe(original.rendererTarget);
    expect(restored.outputFormat).toBe(original.outputFormat);
    expect(restored.mermaidVersionVerified).toBe(original.mermaidVersionVerified);
  });

  it("serialised JSON always has type === GOVERNANCE_PROFILE_TYPE", () => {
    const profile = makeProfile();
    const json = profileToPortableJson(profile);
    const parsed = JSON.parse(json) as Record<string, unknown>;
    expect(parsed.type).toBe(GOVERNANCE_PROFILE_TYPE);
  });

  it("serialised JSON never contains inputCode or user diagram content", () => {
    const profile = makeProfile();
    const json = profileToPortableJson(profile);
    // Ensure no "inputCode", "code", or "diagram" key at top level
    const parsed = JSON.parse(json) as Record<string, unknown>;
    expect(parsed).not.toHaveProperty("inputCode");
    expect(parsed).not.toHaveProperty("code");
    expect(parsed).not.toHaveProperty("diagram");
  });

  it("no-warnings round-trip produces empty warnings array", () => {
    const original = makeProfile();
    const json = profileToPortableJson(original);
    const result = parseGovernanceProfile(json);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.warnings).toHaveLength(0);
  });

  it("returns ok:false for plain text input", () => {
    const result = parseGovernanceProfile("not json at all");
    expect(result.ok).toBe(false);
  });

  it("returns ok:false when type is missing", () => {
    const profile = makeProfile();
    const parsed = JSON.parse(profileToPortableJson(profile)) as Record<string, unknown>;
    delete parsed.type;
    const result = parseGovernanceProfile(JSON.stringify(parsed));
    expect(result.ok).toBe(false);
  });

  it("returns ok:false when colors array is missing", () => {
    const profile = makeProfile();
    const parsed = JSON.parse(profileToPortableJson(profile)) as Record<string, unknown>;
    delete parsed.colors;
    const result = parseGovernanceProfile(JSON.stringify(parsed));
    expect(result.ok).toBe(false);
  });

  it("returns ok:false when colors array is empty", () => {
    const profile = makeProfile();
    const parsed = JSON.parse(profileToPortableJson(profile)) as Record<string, unknown>;
    parsed.colors = [];
    const result = parseGovernanceProfile(JSON.stringify(parsed));
    expect(result.ok).toBe(false);
  });

  it("falls back gracefully when look is unknown — warning, not error", () => {
    const profile = makeProfile();
    const parsed = JSON.parse(profileToPortableJson(profile)) as Record<string, unknown>;
    parsed.look = "nonExistentLook";
    const result = parseGovernanceProfile(JSON.stringify(parsed));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.profile.look).toBe("classic");
    expect(result.warnings.some((w) => w.includes("look"))).toBe(true);
  });

  it("falls back gracefully when outputFormat is unknown — warning, not error", () => {
    const profile = makeProfile();
    const parsed = JSON.parse(profileToPortableJson(profile)) as Record<string, unknown>;
    parsed.outputFormat = "weird-format";
    const result = parseGovernanceProfile(JSON.stringify(parsed));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.profile.outputFormat).toBe("init-directive");
    expect(result.warnings.some((w) => w.includes("outputFormat"))).toBe(true);
  });

  it("falls back gracefully when typography is absent — warning, not error", () => {
    const profile = makeProfile();
    const parsed = JSON.parse(profileToPortableJson(profile)) as Record<string, unknown>;
    delete parsed.typography;
    const result = parseGovernanceProfile(JSON.stringify(parsed));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.profile.typography).toBeDefined();
    expect(result.warnings.some((w) => w.includes("Typography"))).toBe(true);
  });

  it("preserves strokeWidth when present", () => {
    const profile = createGovernanceProfile(
      { name: "SW", colors: TEST_COLORS, strokeWidth: 3 },
      FIXED_NOW
    );
    const json = profileToPortableJson(profile);
    const result = parseGovernanceProfile(json);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.profile.strokeWidth).toBe(3);
  });

  it("frontmatter outputFormat is preserved round-trip", () => {
    const profile = createGovernanceProfile(
      { name: "FM", colors: TEST_COLORS, outputFormat: "frontmatter" },
      FIXED_NOW
    );
    const json = profileToPortableJson(profile);
    const result = parseGovernanceProfile(json);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.profile.outputFormat).toBe("frontmatter");
  });
});

// ─── buildProfileHeaderComment ───────────────────────────────────────────────

describe("buildProfileHeaderComment", () => {
  it("starts with %% (Mermaid comment prefix)", () => {
    const profile = makeProfile();
    const comment = buildProfileHeaderComment(profile);
    expect(comment.startsWith("%%")).toBe(true);
  });

  it("includes the profile name", () => {
    const profile = makeProfile();
    const comment = buildProfileHeaderComment(profile);
    expect(comment).toContain("Test Profile");
  });

  it("includes mermaidVersionVerified", () => {
    const profile = makeProfile();
    const comment = buildProfileHeaderComment(profile);
    expect(comment).toContain(MERMAID_VERSION_VERIFIED);
  });

  it("includes the renderer target when set", () => {
    const profile = makeProfile();
    const comment = buildProfileHeaderComment(profile);
    expect(comment).toContain("github");
  });

  it("omits renderer section when rendererTarget is empty", () => {
    const profile = createGovernanceProfile({ name: "No RT", colors: TEST_COLORS }, FIXED_NOW);
    const comment = buildProfileHeaderComment(profile);
    expect(comment).not.toContain("Renderer:");
  });
});
