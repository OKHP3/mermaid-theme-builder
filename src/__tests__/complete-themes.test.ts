import { describe, expect, it } from "vitest";
import {
  createGovernanceProfile,
  duplicateGovernanceProfile,
  migrateSlotToProfile,
  parseGovernanceProfile,
  profileToPortableJson,
  profileToSlot,
} from "@/lib/governance-profile";
import { BRAND_PALETTES } from "@/lib/palettes";
import {
  buildProfileShareUrl,
  decodeProfileToken,
  encodeProfileToken,
  MAX_PROFILE_SHARE_URL_LENGTH,
} from "@/lib/profile-share";

const now = "2026-11-03T12:00:00.000Z";

describe("complete theme contract", () => {
  it("shares complete settings and removes a conflicting legacy token", () => {
    const theme = createGovernanceProfile(
      {
        name: "Réutilisable 日本語",
        colors: BRAND_PALETTES[0].colors,
        outputFormatOverridden: true,
        includeBadge: true,
        includeMetaComments: false,
        strokeWidth: 5,
      },
      now
    );
    const url = new URL(buildProfileShareUrl(theme, "https://example.test/?theme=old#compose"));
    expect(url.searchParams.has("theme")).toBe(false);
    const result = decodeProfileToken(url.searchParams.get("profile")!);
    expect(result.ok && result.profile).toEqual(theme);
    expect(url.hash).toBe("#compose");
  });

  it("refuses oversized links before decoding and offers a JSON fallback", () => {
    expect(decodeProfileToken("a".repeat(MAX_PROFILE_SHARE_URL_LENGTH + 1)).ok).toBe(false);
    const theme = createGovernanceProfile(
      {
        name: "Large",
        colors: BRAND_PALETTES[0].colors,
        description: "x".repeat(MAX_PROFILE_SHARE_URL_LENGTH),
      },
      now
    );
    expect(() => encodeProfileToken(theme)).toThrow(/JSON/);
    expect(profileToPortableJson(theme)).toContain(theme.description);
  });
  it("round-trips all output preferences and palette provenance", () => {
    const { id: _id, name: _name, colors, ...paletteMetadata } = BRAND_PALETTES[0];
    const theme = createGovernanceProfile(
      {
        id: "saved-a",
        name: "Editorial",
        colors,
        paletteMetadata,
        rendererTarget: "github",
        outputFormat: "frontmatter",
        outputFormatOverridden: true,
        includeBadge: false,
        includeMetaComments: false,
        strokeWidth: 3,
        advancedMermaidConfig: {
          htmlLabels: false,
          deterministicIds: true,
          deterministicIDSeed: "a",
        },
        semanticClassDefs: ["classDef note fill:#fff"],
        extensions: { origin: { revision: 4 } },
      },
      now
    );
    const result = parseGovernanceProfile(profileToPortableJson(theme));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.profile).toEqual(theme);
    expect(theme.includeMetaComments).toBe(false);
    expect(theme.outputFormatOverridden).toBe(true);
    expect(theme.paletteMetadata).toEqual(paletteMetadata);
    expect(theme.advancedMermaidConfig).toEqual({
      htmlLabels: false,
      deterministicIds: true,
      deterministicIDSeed: "a",
    });
    expect(theme.schemaVersion).toBe(3);
    expect(profileToPortableJson(theme)).not.toContain("inputCode");
  });

  it("does not claim creation is renderer verification", () => {
    const theme = createGovernanceProfile({ name: "New", colors: BRAND_PALETTES[0].colors }, now);
    expect(theme.mermaidVersionVerified).toBe("");
    expect(theme.provenance?.authoredWithMermaidVersion).toBeTruthy();
  });

  it("keeps complete slot adapters lossless and ignores unrelated global settings", () => {
    const theme = createGovernanceProfile(
      {
        name: "A",
        colors: BRAND_PALETTES[0].colors,
        rendererTarget: "github",
        strokeWidth: 2,
        includeBadge: false,
      },
      now
    );
    const slot = profileToSlot(theme);
    expect(migrateSlotToProfile(slot, { rendererTarget: "other", strokeWidth: 8 }, now)).toEqual(
      theme
    );
  });

  it("deep-clones every nested setting when creating and duplicating", () => {
    const advanced = { preserved: { values: [1] } };
    const source = createGovernanceProfile(
      {
        name: "A",
        colors: BRAND_PALETTES[0].colors,
        advancedMermaidConfig: advanced,
        semanticClassDefs: ["one"],
        extensions: { tags: ["a"] },
      },
      now
    );
    const copy = duplicateGovernanceProfile(source, "copy", "Copy", now);
    (copy.advancedMermaidConfig!.preserved as { values: number[] }).values.push(2);
    copy.semanticClassDefs!.push("two");
    (copy.extensions!.tags as string[]).push("b");
    expect(source.advancedMermaidConfig).toEqual(advanced);
    expect(source.semanticClassDefs).toEqual(["one"]);
    expect(source.extensions).toEqual({ tags: ["a"] });
  });

  it("reads version 2 without manufacturing missing verification", () => {
    const data = {
      ...createGovernanceProfile({ name: "Old", colors: BRAND_PALETTES[0].colors }, now),
      type: "mtb-governance-profile",
      schemaVersion: 2,
      mermaidVersionVerified: undefined,
      provenance: undefined,
      customMetadata: { team: "personal" },
    };
    const result = parseGovernanceProfile(JSON.stringify(data));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.profile.mermaidVersionVerified).toBe("");
    expect(result.profile.extensions?.customMetadata).toEqual({ team: "personal" });
  });

  it("rejects unknown newer schemas instead of downgrading them", () => {
    const data = JSON.parse(
      profileToPortableJson(
        createGovernanceProfile({ name: "Future", colors: BRAND_PALETTES[0].colors }, now)
      )
    );
    data.schemaVersion = 999;
    expect(parseGovernanceProfile(JSON.stringify(data)).ok).toBe(false);
  });

  it.each([-1, 2.5, "3", null])(
    "rejects an invalid explicit schema version %s",
    (schemaVersion) => {
      const data = JSON.parse(
        profileToPortableJson(
          createGovernanceProfile({ name: "Invalid", colors: BRAND_PALETTES[0].colors }, now)
        )
      );
      data.schemaVersion = schemaVersion;
      expect(parseGovernanceProfile(JSON.stringify(data)).ok).toBe(false);
    }
  );

  it("rejects malformed palette metadata before it can reach rendering", () => {
    const data = JSON.parse(
      profileToPortableJson(
        createGovernanceProfile({ name: "Invalid", colors: BRAND_PALETTES[0].colors }, now)
      )
    );
    data.paletteMetadata = { sourceUrls: [null], attribution: { label: {} } };
    expect(parseGovernanceProfile(JSON.stringify(data)).ok).toBe(false);
  });

  it("preserves unsupported advanced settings as inert data with a warning", () => {
    const theme = createGovernanceProfile(
      {
        name: "Imported",
        colors: BRAND_PALETTES[0].colors,
        advancedMermaidConfig: { themeCSS: "untrusted", htmlLabels: false },
        semanticClassDefs: ["custom"],
      },
      now
    );
    const result = parseGovernanceProfile(profileToPortableJson(theme));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.profile.advancedMermaidConfig).toEqual(theme.advancedMermaidConfig);
    expect(result.warnings.join(" ")).toContain("preserved");
  });
});
