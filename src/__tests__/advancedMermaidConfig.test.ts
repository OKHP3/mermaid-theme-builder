/**
 * Tests for AdvancedMermaidConfig — root-level config key emission.
 *
 * Verified invariants:
 * - htmlLabels and deterministicIds are emitted at the root config level in
 *   both %%{init}%% and YAML frontmatter formats.
 * - The deprecated flowchart.htmlLabels path is never emitted.
 * - deterministicIDSeed is only emitted when deterministicIds is true.
 * - GovernanceProfile round-trip preserves advancedMermaidConfig.
 * - Omitting advancedMermaidConfig produces output identical to the baseline.
 */

import { describe, it, expect } from "vitest";
import { generateThemedCode, computeInitDirectiveLength } from "@/lib/theme-engine";
import {
  migrateSlotToProfile,
  profileToPortableJson,
  parseGovernanceProfile,
} from "@/lib/governance-profile";
import type { Palette } from "@/lib/palettes";
import type { MyThemeSlot } from "@/lib/my-theme-slots";
import { DEFAULT_TYPOGRAPHY } from "@/lib/typography";

// ── Minimal test fixtures ────────────────────────────────────────────────────

const MINIMAL_PALETTE: Palette = {
  id: "test-palette",
  name: "Test Palette",
  description: "",
  version: "0.0.0",
  colors: [
    { key: "primaryColor", label: "Primary", value: "#1a1a2e" },
    { key: "primaryTextColor", label: "Primary Text", value: "#ffffff" },
    { key: "primaryBorderColor", label: "Primary Border", value: "#16213e" },
    { key: "lineColor", label: "Line", value: "#444466" },
    { key: "secondaryColor", label: "Secondary", value: "#16213e" },
    { key: "tertiaryColor", label: "Tertiary", value: "#0f3460" },
  ],
};

const SIMPLE_FLOWCHART = "flowchart TD\n  A --> B";

const BASE_EXPORT_OPTIONS = {
  palette: MINIMAL_PALETTE,
  diagramFamily: "flowchart" as const,
  includeMetaComments: false,
  includeBadge: false,
};

const MINIMAL_SLOT: MyThemeSlot = {
  id: "my-theme-1",
  name: "My Theme",
  colors: MINIMAL_PALETTE.colors,
  look: "classic" as const,
  fontSize: "",
  typography: DEFAULT_TYPOGRAPHY,
};

// ── %%{init}%% format tests ──────────────────────────────────────────────────

describe("AdvancedMermaidConfig — init-directive output", () => {
  it("emits htmlLabels at root config level when true", () => {
    const result = generateThemedCode(SIMPLE_FLOWCHART, {
      ...BASE_EXPORT_OPTIONS,
      advancedMermaidConfig: { htmlLabels: true },
    });
    expect(result).toContain('"htmlLabels": true');
    // Must appear before "theme" in the init directive (root level)
    const directiveLine = result.split("\n")[0];
    const htmlLabelsPos = directiveLine.indexOf('"htmlLabels"');
    const themePos = directiveLine.indexOf('"theme"');
    expect(htmlLabelsPos).toBeGreaterThan(-1);
    expect(htmlLabelsPos).toBeLessThan(themePos);
  });

  it("emits htmlLabels: false at root config level", () => {
    const result = generateThemedCode(SIMPLE_FLOWCHART, {
      ...BASE_EXPORT_OPTIONS,
      advancedMermaidConfig: { htmlLabels: false },
    });
    expect(result).toContain('"htmlLabels": false');
  });

  it("never emits the deprecated flowchart.htmlLabels path", () => {
    const result = generateThemedCode(SIMPLE_FLOWCHART, {
      ...BASE_EXPORT_OPTIONS,
      advancedMermaidConfig: { htmlLabels: true },
    });
    expect(result).not.toContain('"flowchart"');
    expect(result).not.toContain("flowchart.htmlLabels");
  });

  it("emits deterministicIds at root config level when true", () => {
    const result = generateThemedCode(SIMPLE_FLOWCHART, {
      ...BASE_EXPORT_OPTIONS,
      advancedMermaidConfig: { deterministicIds: true },
    });
    expect(result).toContain('"deterministicIds": true');
    const directiveLine = result.split("\n")[0];
    const pos = directiveLine.indexOf('"deterministicIds"');
    const themePos = directiveLine.indexOf('"theme"');
    expect(pos).toBeGreaterThan(-1);
    expect(pos).toBeLessThan(themePos);
  });

  it("emits deterministicIDSeed only when deterministicIds is true", () => {
    const withBoth = generateThemedCode(SIMPLE_FLOWCHART, {
      ...BASE_EXPORT_OPTIONS,
      advancedMermaidConfig: { deterministicIds: true, deterministicIDSeed: "my-seed" },
    });
    expect(withBoth).toContain('"deterministicIDSeed": "my-seed"');

    const withSeedOnly = generateThemedCode(SIMPLE_FLOWCHART, {
      ...BASE_EXPORT_OPTIONS,
      // deterministicIds NOT set — seed must be suppressed
      advancedMermaidConfig: { deterministicIDSeed: "my-seed" },
    });
    expect(withSeedOnly).not.toContain("deterministicIDSeed");
  });

  it("does NOT emit deterministicIDSeed when deterministicIds is false", () => {
    const result = generateThemedCode(SIMPLE_FLOWCHART, {
      ...BASE_EXPORT_OPTIONS,
      advancedMermaidConfig: { deterministicIds: false, deterministicIDSeed: "should-not-appear" },
    });
    expect(result).not.toContain("deterministicIDSeed");
  });

  it("emits all three fields when fully specified", () => {
    const result = generateThemedCode(SIMPLE_FLOWCHART, {
      ...BASE_EXPORT_OPTIONS,
      advancedMermaidConfig: {
        htmlLabels: true,
        deterministicIds: true,
        deterministicIDSeed: "stable-v1",
      },
    });
    expect(result).toContain('"htmlLabels": true');
    expect(result).toContain('"deterministicIds": true');
    expect(result).toContain('"deterministicIDSeed": "stable-v1"');
  });

  it("produces no advanced entries when advancedMermaidConfig is omitted", () => {
    const baseline = generateThemedCode(SIMPLE_FLOWCHART, { ...BASE_EXPORT_OPTIONS });
    const withEmpty = generateThemedCode(SIMPLE_FLOWCHART, {
      ...BASE_EXPORT_OPTIONS,
      advancedMermaidConfig: {},
    });
    expect(withEmpty).toBe(baseline);
    expect(baseline).not.toContain("htmlLabels");
    expect(baseline).not.toContain("deterministicIds");
  });
});

// ── YAML frontmatter format tests ────────────────────────────────────────────

describe("AdvancedMermaidConfig — frontmatter output", () => {
  const FM_OPTIONS = { ...BASE_EXPORT_OPTIONS, outputFormat: "frontmatter" as const };

  it("emits htmlLabels under config block (root level, before themeVariables)", () => {
    const result = generateThemedCode(SIMPLE_FLOWCHART, {
      ...FM_OPTIONS,
      advancedMermaidConfig: { htmlLabels: true },
    });
    expect(result).toContain("  htmlLabels: true");
    // Must appear before themeVariables:
    const htmlPos = result.indexOf("  htmlLabels:");
    const tvPos = result.indexOf("  themeVariables:");
    expect(htmlPos).toBeGreaterThan(-1);
    expect(htmlPos).toBeLessThan(tvPos);
  });

  it("emits deterministicIds in frontmatter at root config level", () => {
    const result = generateThemedCode(SIMPLE_FLOWCHART, {
      ...FM_OPTIONS,
      advancedMermaidConfig: { deterministicIds: true },
    });
    expect(result).toContain("  deterministicIds: true");
    const pos = result.indexOf("  deterministicIds:");
    const tvPos = result.indexOf("  themeVariables:");
    expect(pos).toBeLessThan(tvPos);
  });

  it("emits deterministicIDSeed in frontmatter only with deterministicIds: true", () => {
    const withBoth = generateThemedCode(SIMPLE_FLOWCHART, {
      ...FM_OPTIONS,
      advancedMermaidConfig: { deterministicIds: true, deterministicIDSeed: "fm-seed" },
    });
    expect(withBoth).toContain('  deterministicIDSeed: "fm-seed"');

    const noSeed = generateThemedCode(SIMPLE_FLOWCHART, {
      ...FM_OPTIONS,
      advancedMermaidConfig: { deterministicIDSeed: "fm-seed" },
    });
    expect(noSeed).not.toContain("deterministicIDSeed");
  });

  it("never emits flowchart sub-key in frontmatter", () => {
    const result = generateThemedCode(SIMPLE_FLOWCHART, {
      ...FM_OPTIONS,
      advancedMermaidConfig: { htmlLabels: true },
    });
    expect(result).not.toMatch(/^\s+flowchart:/m);
  });
});

// ── computeInitDirectiveLength ───────────────────────────────────────────────

describe("computeInitDirectiveLength with AdvancedMermaidConfig", () => {
  it("returns a longer length when advanced config is provided", () => {
    const base = computeInitDirectiveLength(MINIMAL_PALETTE, "flowchart");
    const withAdvanced = computeInitDirectiveLength(
      MINIMAL_PALETTE,
      "flowchart",
      undefined,
      undefined,
      undefined,
      { htmlLabels: true }
    );
    expect(withAdvanced).toBeGreaterThan(base);
  });

  it("length matches the actual directive length", () => {
    const config = { deterministicIds: true, deterministicIDSeed: "seed-42" };
    const computed = computeInitDirectiveLength(
      MINIMAL_PALETTE,
      "flowchart",
      undefined,
      undefined,
      undefined,
      config
    );
    const actual = generateThemedCode(SIMPLE_FLOWCHART, {
      ...BASE_EXPORT_OPTIONS,
      advancedMermaidConfig: config,
    }).split("\n")[0].length;
    expect(computed).toBe(actual);
  });
});

// ── GovernanceProfile round-trip ─────────────────────────────────────────────

describe("AdvancedMermaidConfig — GovernanceProfile round-trip", () => {
  it("round-trips via migrateSlotToProfile → profileToPortableJson → parseGovernanceProfile", () => {
    const config = { htmlLabels: true, deterministicIds: true, deterministicIDSeed: "rt-seed" };
    const profile = migrateSlotToProfile(MINIMAL_SLOT, {
      rendererTarget: "github",
      outputFormat: "init-directive",
      advancedMermaidConfig: config,
    });

    expect(profile.advancedMermaidConfig).toEqual(config);

    const json = profileToPortableJson(profile);
    const parsed = JSON.parse(json);
    expect(parsed.advancedMermaidConfig).toEqual(config);

    const result = parseGovernanceProfile(json);
    expect(result.profile).not.toBeNull();
    expect(result.profile!.advancedMermaidConfig).toEqual(config);
  });

  it("omits advancedMermaidConfig from profile when not provided", () => {
    const profile = migrateSlotToProfile(MINIMAL_SLOT, {
      rendererTarget: "",
      outputFormat: "init-directive",
    });
    expect(profile.advancedMermaidConfig).toBeUndefined();

    const json = profileToPortableJson(profile);
    const parsed = JSON.parse(json);
    expect(parsed.advancedMermaidConfig).toBeUndefined();
  });

  it("partial config (only deterministicIds) round-trips correctly", () => {
    const config = { deterministicIds: true };
    const profile = migrateSlotToProfile(MINIMAL_SLOT, {
      advancedMermaidConfig: config,
    });
    const json = profileToPortableJson(profile);
    const result = parseGovernanceProfile(json);
    expect(result.profile!.advancedMermaidConfig).toEqual(config);
  });
});
