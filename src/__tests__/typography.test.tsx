// @vitest-environment happy-dom

/**
 * Tests for typography tier visual controls (Task #169).
 *
 * Three areas covered:
 *  1. enforceHierarchy — boundary conditions (equal tiers, cascading clamps,
 *     min/max values, immutability).
 *  2. Scale bar width formula — the Math.max(diagramTitle.fontSize, 1) guard
 *     and proportional width calculations.
 *  3. ComposeTab render — the five scale bars carry the correct `width` style
 *     for a given TypographySettings object.
 */

import { vi, describe, it, expect, afterEach } from "vitest";

// vi.mock is hoisted by vitest — must appear before any imports.
vi.mock("mermaid", () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn().mockResolvedValue({ svg: "<svg><g></g></svg>", bindFunctions: undefined }),
  },
}));

import { render, cleanup } from "@testing-library/react";
import { createElement } from "react";

import {
  enforceHierarchy,
  isDefaultTypography,
  generateTypographyCss,
  typographyToScaffoldSection,
  DEFAULT_TYPOGRAPHY,
  TIER_ORDER,
  type TypographySettings,
} from "@/lib/typography";
import { ComposeTab } from "@/pages/tabs/ComposeTab";
import { BRAND_PALETTES } from "@/lib/palettes";

afterEach(() => {
  cleanup();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function make(
  diagramTitle: number,
  subgraphTitle: number,
  nestedSubgraphTitle: number,
  nodeLabel: number,
  edgeLabel: number
): TypographySettings {
  return {
    diagramTitle: { fontSize: diagramTitle, fontFamily: "" },
    subgraphTitle: { fontSize: subgraphTitle, fontFamily: "" },
    nestedSubgraphTitle: { fontSize: nestedSubgraphTitle, fontFamily: "" },
    nodeLabel: { fontSize: nodeLabel, fontFamily: "" },
    edgeLabel: { fontSize: edgeLabel, fontFamily: "" },
  };
}

/** Scale bar width for one tier (mirrors the ComposeTab inline formula). */
function barWidth(tierSize: number, topSize: number): number {
  return (tierSize / Math.max(topSize, 1)) * 100;
}

// ---------------------------------------------------------------------------
// 1. enforceHierarchy — boundary conditions
// ---------------------------------------------------------------------------

describe("enforceHierarchy — no-op cases", () => {
  it("leaves DEFAULT_TYPOGRAPHY unchanged", () => {
    expect(enforceHierarchy(DEFAULT_TYPOGRAPHY)).toEqual(DEFAULT_TYPOGRAPHY);
  });

  it("leaves all-equal tiers unchanged (14px across all)", () => {
    const s = make(14, 14, 14, 14, 14);
    expect(enforceHierarchy(s)).toEqual(s);
  });

  it("leaves strictly decreasing tiers unchanged", () => {
    const s = make(30, 24, 18, 14, 10);
    expect(enforceHierarchy(s)).toEqual(s);
  });

  it("leaves minimum-size tiers (8px) unchanged", () => {
    const s = make(8, 8, 8, 8, 8);
    expect(enforceHierarchy(s)).toEqual(s);
  });
});

describe("enforceHierarchy — single-level violations", () => {
  it("clamps subgraphTitle to diagramTitle when it exceeds it", () => {
    const result = enforceHierarchy(make(16, 20, 14, 12, 10));
    expect(result.subgraphTitle.fontSize).toBe(16);
  });

  it("clamps nestedSubgraphTitle to subgraphTitle when it exceeds it", () => {
    const result = enforceHierarchy(make(20, 16, 18, 12, 10));
    expect(result.nestedSubgraphTitle.fontSize).toBe(16);
  });

  it("clamps nodeLabel to subgraphTitle when it exceeds it", () => {
    const result = enforceHierarchy(make(20, 14, 12, 18, 10));
    expect(result.nodeLabel.fontSize).toBe(14);
  });

  it("clamps edgeLabel to nodeLabel when it exceeds it", () => {
    const result = enforceHierarchy(make(20, 16, 14, 12, 15));
    expect(result.edgeLabel.fontSize).toBe(12);
  });
});

describe("enforceHierarchy — cascade clamping", () => {
  it("cascades a low diagramTitle down through all tiers", () => {
    // All tiers set high; diagramTitle is 10 — everyone must collapse to 10.
    const result = enforceHierarchy(make(10, 20, 20, 20, 20));
    expect(result.subgraphTitle.fontSize).toBe(10);
    expect(result.nestedSubgraphTitle.fontSize).toBe(10);
    expect(result.nodeLabel.fontSize).toBe(10);
    expect(result.edgeLabel.fontSize).toBe(10);
  });

  it("cascades a mid-level reduction into lower tiers only", () => {
    // subgraphTitle reduced below nestedSubgraphTitle and below; nodeLabel, edgeLabel cascade.
    const result = enforceHierarchy(make(20, 10, 14, 14, 12));
    expect(result.diagramTitle.fontSize).toBe(20); // unchanged
    expect(result.subgraphTitle.fontSize).toBe(10); // clamped to diagramTitle limit? No — subgraphTitle=10 ≤ 20, fine
    expect(result.nestedSubgraphTitle.fontSize).toBe(10); // clamped to subgraphTitle=10
    expect(result.nodeLabel.fontSize).toBe(10); // clamped to subgraphTitle=10
    expect(result.edgeLabel.fontSize).toBe(10); // clamped to nodeLabel=10
  });
});

describe("enforceHierarchy — immutability", () => {
  it("does not mutate the input object", () => {
    const input = make(20, 25, 14, 12, 10);
    const inputClone = JSON.parse(JSON.stringify(input)) as TypographySettings;
    enforceHierarchy(input);
    expect(input).toEqual(inputClone);
  });

  it("preserves fontFamily values through clamping", () => {
    const input: TypographySettings = {
      diagramTitle: { fontSize: 16, fontFamily: "Roboto" },
      subgraphTitle: { fontSize: 20, fontFamily: "DM Sans" },
      nestedSubgraphTitle: { fontSize: 14, fontFamily: "" },
      nodeLabel: { fontSize: 14, fontFamily: "" },
      edgeLabel: { fontSize: 12, fontFamily: "" },
    };
    const result = enforceHierarchy(input);
    // subgraphTitle is clamped but fontFamily is preserved
    expect(result.subgraphTitle.fontSize).toBe(16);
    expect(result.subgraphTitle.fontFamily).toBe("DM Sans");
    // diagramTitle fontFamily unchanged
    expect(result.diagramTitle.fontFamily).toBe("Roboto");
  });
});

// ---------------------------------------------------------------------------
// 2. isDefaultTypography
// ---------------------------------------------------------------------------

describe("isDefaultTypography", () => {
  it("returns true for DEFAULT_TYPOGRAPHY", () => {
    expect(isDefaultTypography(DEFAULT_TYPOGRAPHY)).toBe(true);
  });

  it("returns false when a fontSize differs", () => {
    const modified = { ...DEFAULT_TYPOGRAPHY, diagramTitle: { fontSize: 24, fontFamily: "" } };
    expect(isDefaultTypography(modified)).toBe(false);
  });

  it("returns false when a fontFamily is set", () => {
    const modified = { ...DEFAULT_TYPOGRAPHY, nodeLabel: { fontSize: 14, fontFamily: "Roboto" } };
    expect(isDefaultTypography(modified)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 3. Scale bar width formula — Math.max(diagramTitle.fontSize, 1) guard
// ---------------------------------------------------------------------------

describe("scale bar width formula", () => {
  it("returns 100% for the diagramTitle tier (always the reference)", () => {
    expect(barWidth(20, 20)).toBe(100);
  });

  it("calculates correct width for subgraphTitle in DEFAULT_TYPOGRAPHY (16/20 = 80%)", () => {
    expect(barWidth(16, 20)).toBe(80);
  });

  it("calculates correct width for edgeLabel in DEFAULT_TYPOGRAPHY (12/20 = 60%)", () => {
    expect(barWidth(12, 20)).toBe(60);
  });

  it("guards against diagramTitle.fontSize = 0 (Math.max gives 1, no division by zero)", () => {
    const width = barWidth(14, 0);
    expect(isFinite(width)).toBe(true);
    expect(width).toBe(1400); // 14/max(0,1)*100 = 1400 — large but finite
  });

  it("guards against diagramTitle.fontSize = 1 (bar fills full width)", () => {
    expect(barWidth(1, 1)).toBe(100);
  });

  it("returns 0% when tierSize is 0", () => {
    expect(barWidth(0, 20)).toBe(0);
  });

  it("TIER_ORDER has 5 entries (one scale bar per tier)", () => {
    expect(TIER_ORDER).toHaveLength(5);
  });
});

// ---------------------------------------------------------------------------
// 4. ComposeTab render — scale bars carry correct width styles
// ---------------------------------------------------------------------------

describe("ComposeTab — scale bar widths", () => {
  const palette = BRAND_PALETTES[0];
  const noop = vi.fn();

  function makeProps(typography: TypographySettings) {
    return {
      selectedPalette: palette,
      selectedPaletteId: palette.id,
      onSelectPalette: noop,
      customColors: {},
      onColorChange: noop,
      onResetPalette: noop,
      hasCustomizations: false,
      includeMetaComments: true,
      onIncludeMetaCommentsChange: noop,
      includeBadge: false,
      onIncludeBadgeChange: noop,
      customThemeName: "",
      onCustomThemeNameChange: noop,
      effectiveThemeName: palette.name,
      userPalettes: [],
      onSavePalette: noop,
      onImportPalette: noop,
      onDeleteUserPalette: noop,
      onShowToast: noop,
      look: "classic" as const,
      onLookChange: noop,
      fontSize: "",
      onFontSizeChange: noop,
      typography,
      onTypographyChange: noop,
      rendererTarget: "",
      onRendererTargetChange: noop,
      onUseExtractedTheme: noop,
      onSwitchTab: noop,
      importDiagnostics: null,
      onImportDiagnosticsChange: noop,
    };
  }

  /**
   * Find the five scale bar inner divs.
   * Each Aa sample div carries title="Xpx sample"; navigating to its parent row
   * then to the first child gives the bar container, whose first child is the bar.
   */
  function getScaleBarWidths(container: HTMLElement): string[] {
    const aaSamples = Array.from(
      container.querySelectorAll('[aria-hidden="true"][title*="px sample"]')
    );
    return aaSamples.map((sample) => {
      const row = sample.parentElement!;
      const barContainer = row.firstElementChild as HTMLElement;
      const bar = barContainer.firstElementChild as HTMLElement;
      return bar.style.width;
    });
  }

  it("renders five scale bar elements — one per tier", () => {
    const { container } = render(createElement(ComposeTab, makeProps(DEFAULT_TYPOGRAPHY)));
    const widths = getScaleBarWidths(container);
    expect(widths).toHaveLength(5);
  });

  it("diagramTitle bar is always 100% (reference tier)", () => {
    const { container } = render(createElement(ComposeTab, makeProps(DEFAULT_TYPOGRAPHY)));
    const widths = getScaleBarWidths(container);
    expect(widths[0]).toBe("100%");
  });

  it("DEFAULT_TYPOGRAPHY produces correct proportional widths for all tiers", () => {
    const { container } = render(createElement(ComposeTab, makeProps(DEFAULT_TYPOGRAPHY)));
    const widths = getScaleBarWidths(container);
    // diagramTitle=20, subgraph=16, nested=14, nodeLabel=14, edgeLabel=12
    expect(widths[0]).toBe("100%"); // 20/20 = 100%
    expect(widths[1]).toBe("80%"); // 16/20 = 80%
    expect(widths[2]).toBe("70%"); // 14/20 = 70%
    expect(widths[3]).toBe("70%"); // 14/20 = 70%
    expect(widths[4]).toBe("60%"); // 12/20 = 60%
  });

  it("custom typography: larger diagramTitle shrinks all other bars proportionally", () => {
    const custom = make(40, 20, 14, 12, 8);
    const { container } = render(createElement(ComposeTab, makeProps(custom)));
    const widths = getScaleBarWidths(container);
    expect(widths[0]).toBe("100%"); // 40/40
    expect(widths[1]).toBe("50%"); // 20/40
    expect(widths[2]).toBe("35%"); // 14/40
    expect(widths[3]).toBe("30%"); // 12/40
    expect(widths[4]).toBe("20%"); // 8/40
  });

  it("all-equal tiers produce all-100% bars", () => {
    const custom = make(16, 16, 16, 16, 16);
    const { container } = render(createElement(ComposeTab, makeProps(custom)));
    const widths = getScaleBarWidths(container);
    expect(widths.every((w) => w === "100%")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 5. generateTypographyCss
// ---------------------------------------------------------------------------

describe("generateTypographyCss — header comment", () => {
  it("always includes the header comment line as the first line", () => {
    const result = generateTypographyCss(DEFAULT_TYPOGRAPHY);
    expect(result.split("\n")[0]).toBe(
      "/* Mermaid typography hierarchy — flowchart/subgraph targets */"
    );
  });

  it("returns only the header comment when all tiers match defaults", () => {
    const result = generateTypographyCss(DEFAULT_TYPOGRAPHY);
    expect(result).toBe("/* Mermaid typography hierarchy — flowchart/subgraph targets */");
  });
});

describe("generateTypographyCss — font-size rules", () => {
  it("emits a font-size rule when a tier size differs from default", () => {
    const settings: TypographySettings = {
      ...DEFAULT_TYPOGRAPHY,
      diagramTitle: { fontSize: 28, fontFamily: "" },
    };
    const result = generateTypographyCss(settings);
    expect(result).toContain("font-size: 28px;");
  });

  it("uses the correct CSS selector for the modified tier", () => {
    const settings: TypographySettings = {
      ...DEFAULT_TYPOGRAPHY,
      edgeLabel: { fontSize: 10, fontFamily: "" },
    };
    const result = generateTypographyCss(settings);
    expect(result).toContain(".edgeLabel { font-size: 10px; }");
  });

  it("skips the rule entirely when both size and family match defaults", () => {
    const result = generateTypographyCss(DEFAULT_TYPOGRAPHY);
    expect(result).not.toContain("font-size:");
    expect(result).not.toContain("font-family:");
  });
});

describe("generateTypographyCss — font-family rules", () => {
  it("emits a font-family rule when fontFamily is set on a tier", () => {
    const settings: TypographySettings = {
      ...DEFAULT_TYPOGRAPHY,
      nodeLabel: { fontSize: 14, fontFamily: "Roboto" },
    };
    const result = generateTypographyCss(settings);
    expect(result).toContain("font-family: Roboto;");
  });

  it("does not emit a font-family rule when fontFamily is empty", () => {
    const result = generateTypographyCss(DEFAULT_TYPOGRAPHY);
    expect(result).not.toContain("font-family:");
  });

  it("emits both font-size and font-family when both differ from defaults", () => {
    const settings: TypographySettings = {
      ...DEFAULT_TYPOGRAPHY,
      subgraphTitle: { fontSize: 18, fontFamily: "DM Sans" },
    };
    const result = generateTypographyCss(settings);
    expect(result).toContain("font-size: 18px;");
    expect(result).toContain("font-family: DM Sans;");
  });
});

describe("generateTypographyCss — all tiers modified", () => {
  it("emits rules for all five tiers when every tier differs from defaults", () => {
    const settings: TypographySettings = {
      diagramTitle: { fontSize: 24, fontFamily: "Alfa Slab One" },
      subgraphTitle: { fontSize: 20, fontFamily: "DM Sans" },
      nestedSubgraphTitle: { fontSize: 16, fontFamily: "DM Sans" },
      nodeLabel: { fontSize: 13, fontFamily: "JetBrains Mono" },
      edgeLabel: { fontSize: 11, fontFamily: "JetBrains Mono" },
    };
    const result = generateTypographyCss(settings);
    expect(result).toContain(".label { font-size: 24px; font-family: Alfa Slab One; }");
    expect(result).toContain(".cluster-label { font-size: 20px; font-family: DM Sans; }");
    expect(result).toContain(
      ".cluster-label .nodeLabel { font-size: 16px; font-family: DM Sans; }"
    );
    expect(result).toContain(".node .label { font-size: 13px; font-family: JetBrains Mono; }");
    expect(result).toContain(".edgeLabel { font-size: 11px; font-family: JetBrains Mono; }");
  });
});

// ---------------------------------------------------------------------------
// 6. typographyToScaffoldSection
// ---------------------------------------------------------------------------

describe("typographyToScaffoldSection — markdown table structure", () => {
  it("contains the markdown table header row", () => {
    const result = typographyToScaffoldSection(DEFAULT_TYPOGRAPHY);
    expect(result).toContain("| Tier | Target | Size | Font Family |");
  });

  it("contains the separator row below the header", () => {
    const result = typographyToScaffoldSection(DEFAULT_TYPOGRAPHY);
    expect(result).toContain("|------|--------|------|-------------|");
  });

  it("starts with the section heading", () => {
    const result = typographyToScaffoldSection(DEFAULT_TYPOGRAPHY);
    expect(result.startsWith("## Typography Hierarchy")).toBe(true);
  });
});

describe("typographyToScaffoldSection — tier rows", () => {
  it("includes the correct size for diagramTitle (20px by default)", () => {
    const result = typographyToScaffoldSection(DEFAULT_TYPOGRAPHY);
    expect(result).toContain("| Diagram Title |");
    expect(result).toContain("| 20px |");
  });

  it("includes the correct size for edgeLabel (12px by default)", () => {
    const result = typographyToScaffoldSection(DEFAULT_TYPOGRAPHY);
    expect(result).toContain("| Edge Label |");
    expect(result).toContain("| 12px |");
  });

  it("uses the custom size when a tier fontSize is overridden", () => {
    const settings: TypographySettings = {
      ...DEFAULT_TYPOGRAPHY,
      diagramTitle: { fontSize: 32, fontFamily: "" },
    };
    const result = typographyToScaffoldSection(settings);
    expect(result).toContain("| 32px |");
  });
});

describe("typographyToScaffoldSection — font family column", () => {
  it("uses '(palette fontFamily)' placeholder when fontFamily is empty", () => {
    const result = typographyToScaffoldSection(DEFAULT_TYPOGRAPHY);
    const lines = result
      .split("\n")
      .filter((l) => l.startsWith("|") && !l.startsWith("|---") && !l.startsWith("| Tier"));
    expect(lines.length).toBeGreaterThan(0);
    lines.forEach((line) => {
      expect(line).toContain("(palette fontFamily)");
    });
  });

  it("uses the actual fontFamily string when set", () => {
    const settings: TypographySettings = {
      ...DEFAULT_TYPOGRAPHY,
      nodeLabel: { fontSize: 14, fontFamily: "Roboto" },
    };
    const result = typographyToScaffoldSection(settings);
    expect(result).toContain("| Roboto |");
  });

  it("mixes placeholder and actual values when only some tiers have fontFamily set", () => {
    const settings: TypographySettings = {
      ...DEFAULT_TYPOGRAPHY,
      diagramTitle: { fontSize: 20, fontFamily: "Alfa Slab One" },
    };
    const result = typographyToScaffoldSection(settings);
    expect(result).toContain("| Alfa Slab One |");
    expect(result).toContain("(palette fontFamily)");
  });
});
