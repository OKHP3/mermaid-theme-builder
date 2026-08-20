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

import { render, cleanup, fireEvent } from "@testing-library/react";
import { createElement } from "react";

import {
  enforceHierarchy,
  isDefaultTypography,
  generateTypographyCss,
  typographyToScaffoldSection,
  hasFontFamilyInjectionChars,
  loadGoogleFont,
  sanitizeFontFamily,
  DEFAULT_TYPOGRAPHY,
  TIER_ORDER,
  type TypographySettings,
} from "@/lib/typography";
import { ComposeTab } from "@/pages/tabs/ComposeTab";
import { BRAND_PALETTES } from "@/lib/palettes";

afterEach(() => {
  cleanup();
  document.head.querySelectorAll("[data-mtb-google-font]").forEach((link) => link.remove());
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
      onNavigateToParityMatrix: noop,
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

  it("loads the selected Google Font when a preset is picked", () => {
    const { getByLabelText } = render(createElement(ComposeTab, makeProps(DEFAULT_TYPOGRAPHY)));

    fireEvent.change(getByLabelText("Node Label font family preset"), {
      target: { value: "JetBrains Mono, Courier New, monospace" },
    });

    const link = document.head.querySelector<HTMLLinkElement>(
      'link[data-mtb-google-font="jetbrains-mono"]'
    );
    expect(link?.rel).toBe("stylesheet");
    expect(link?.href).toContain("family=JetBrains+Mono");
  });
});

// ---------------------------------------------------------------------------
// 5. Lazy Google Font loading
// ---------------------------------------------------------------------------

describe("loadGoogleFont", () => {
  it("does not request a system or custom font stack", () => {
    loadGoogleFont("Georgia, Cambria, serif");
    loadGoogleFont("My Local Font, serif");

    expect(document.head.querySelector("[data-mtb-google-font]")).toBeNull();
  });

  it("adds each supported Google preset only once", () => {
    loadGoogleFont("'DM Sans', system-ui, sans-serif");
    loadGoogleFont("DM Sans, system-ui, sans-serif");

    expect(document.head.querySelectorAll('[data-mtb-google-font="dm-sans"]')).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// 6. generateTypographyCss
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

// ---------------------------------------------------------------------------
// 7. generateTypographyCss — CSS validity for unusual font-family values
//
// Guards against silent corruption of the CSS block when fontFamily contains
// spaces (e.g. "DM Sans"), comma-separated fallback stacks ("DM Sans, sans-serif"),
// or quoted names ("'DM Sans', sans-serif"). Also performs a structural brace-
// balance check on a fully-modified settings object to catch any case where an
// injected value breaks the selector { declarations } structure.
// ---------------------------------------------------------------------------

/** Count occurrences of a single character in a string. */
function countChar(s: string, ch: string): number {
  return [...s].filter((c) => c === ch).length;
}

describe("generateTypographyCss — CSS validity: font-family with spaces", () => {
  it("'DM Sans' (one space) emits a well-formed full CSS rule for nodeLabel", () => {
    const settings: TypographySettings = {
      ...DEFAULT_TYPOGRAPHY,
      nodeLabel: { fontSize: 14, fontFamily: "DM Sans" },
    };
    const result = generateTypographyCss(settings);
    expect(result).toContain(".node .label { font-family: DM Sans; }");
  });

  it("'Alfa Slab One' (two spaces) emits the value verbatim for diagramTitle", () => {
    const settings: TypographySettings = {
      ...DEFAULT_TYPOGRAPHY,
      diagramTitle: { fontSize: 20, fontFamily: "Alfa Slab One" },
    };
    const result = generateTypographyCss(settings);
    expect(result).toContain(".label { font-family: Alfa Slab One; }");
  });

  it("'JetBrains Mono' paired with a non-default font-size emits both declarations in one rule", () => {
    const settings: TypographySettings = {
      ...DEFAULT_TYPOGRAPHY,
      edgeLabel: { fontSize: 10, fontFamily: "JetBrains Mono" },
    };
    const result = generateTypographyCss(settings);
    expect(result).toContain(".edgeLabel { font-size: 10px; font-family: JetBrains Mono; }");
  });
});

describe("generateTypographyCss — CSS validity: comma-separated fallback stacks", () => {
  it("'DM Sans, sans-serif' emits the fallback stack verbatim", () => {
    const settings: TypographySettings = {
      ...DEFAULT_TYPOGRAPHY,
      nodeLabel: { fontSize: 14, fontFamily: "DM Sans, sans-serif" },
    };
    const result = generateTypographyCss(settings);
    expect(result).toContain("font-family: DM Sans, sans-serif;");
  });

  it("\"'DM Sans', sans-serif\" (quoted name + fallback) emits the quotes correctly", () => {
    const settings: TypographySettings = {
      ...DEFAULT_TYPOGRAPHY,
      nodeLabel: { fontSize: 14, fontFamily: "'DM Sans', sans-serif" },
    };
    const result = generateTypographyCss(settings);
    expect(result).toContain("font-family: 'DM Sans', sans-serif;");
  });

  it("three-item fallback stack is enclosed in a valid selector { ... } rule", () => {
    const settings: TypographySettings = {
      ...DEFAULT_TYPOGRAPHY,
      subgraphTitle: { fontSize: 16, fontFamily: "Inter, Arial, sans-serif" },
    };
    const result = generateTypographyCss(settings);
    expect(result).toContain(".cluster-label { font-family: Inter, Arial, sans-serif; }");
  });
});

describe("generateTypographyCss — CSS validity: brace balance on fully-modified settings", () => {
  const fullyModified: TypographySettings = {
    diagramTitle: { fontSize: 24, fontFamily: "Alfa Slab One" },
    subgraphTitle: { fontSize: 20, fontFamily: "'DM Sans', sans-serif" },
    nestedSubgraphTitle: { fontSize: 16, fontFamily: "DM Sans" },
    nodeLabel: { fontSize: 13, fontFamily: "JetBrains Mono, monospace" },
    edgeLabel: { fontSize: 11, fontFamily: "Inter, sans-serif" },
  };

  it("opening and closing brace counts are equal (braces are balanced)", () => {
    const result = generateTypographyCss(fullyModified);
    expect(countChar(result, "{")).toBe(countChar(result, "}"));
  });

  it("every CSS rule line ends with '}' — no dangling declarations", () => {
    const result = generateTypographyCss(fullyModified);
    const ruleLines = result.split("\n").filter((l) => l.startsWith("."));
    expect(ruleLines.length).toBeGreaterThan(0);
    for (const line of ruleLines) {
      expect(line.trim(), `Rule line should end with '}': ${line}`).toMatch(/\}$/);
    }
  });

  it("every CSS rule line contains exactly one '{' and one '}'", () => {
    const result = generateTypographyCss(fullyModified);
    const ruleLines = result.split("\n").filter((l) => l.startsWith("."));
    for (const line of ruleLines) {
      expect(countChar(line, "{"), `Expected exactly 1 opening brace in: ${line}`).toBe(1);
      expect(countChar(line, "}"), `Expected exactly 1 closing brace in: ${line}`).toBe(1);
    }
  });

  it("emits exactly five CSS rule lines — one per tier", () => {
    const result = generateTypographyCss(fullyModified);
    const ruleLines = result.split("\n").filter((l) => l.startsWith("."));
    expect(ruleLines).toHaveLength(5);
  });
});

// ---------------------------------------------------------------------------
// 8. hasFontFamilyInjectionChars & sanitizeFontFamily
// ---------------------------------------------------------------------------

describe("hasFontFamilyInjectionChars — detection", () => {
  it("returns false for a plain font name", () => {
    expect(hasFontFamilyInjectionChars("Roboto")).toBe(false);
  });

  it("returns false for a name with spaces", () => {
    expect(hasFontFamilyInjectionChars("DM Sans")).toBe(false);
  });

  it("returns false for a fallback stack with commas", () => {
    expect(hasFontFamilyInjectionChars("DM Sans, sans-serif")).toBe(false);
  });

  it("returns false for a quoted name", () => {
    expect(hasFontFamilyInjectionChars("'DM Sans', sans-serif")).toBe(false);
  });

  it("returns true when value contains a semicolon", () => {
    expect(hasFontFamilyInjectionChars("Roboto; color: red")).toBe(true);
  });

  it("returns true when value contains an opening brace", () => {
    expect(hasFontFamilyInjectionChars("Roboto { color: red")).toBe(true);
  });

  it("returns true when value contains a closing brace", () => {
    expect(hasFontFamilyInjectionChars("Roboto } color: red")).toBe(true);
  });

  it("returns true when value contains multiple injection characters", () => {
    expect(hasFontFamilyInjectionChars("Bad;{Font}")).toBe(true);
  });
});

describe("sanitizeFontFamily — stripping", () => {
  it("leaves a safe font name unchanged", () => {
    expect(sanitizeFontFamily("Roboto")).toBe("Roboto");
  });

  it("leaves a fallback stack unchanged", () => {
    expect(sanitizeFontFamily("DM Sans, sans-serif")).toBe("DM Sans, sans-serif");
  });

  it("strips a semicolon", () => {
    expect(sanitizeFontFamily("Roboto; color: red")).toBe("Roboto color: red");
  });

  it("strips an opening brace", () => {
    expect(sanitizeFontFamily("Font{Name")).toBe("FontName");
  });

  it("strips a closing brace", () => {
    expect(sanitizeFontFamily("Font}Name")).toBe("FontName");
  });

  it("strips all three unsafe characters at once", () => {
    expect(sanitizeFontFamily("Bad;{Font}")).toBe("BadFont");
  });

  it("returns an empty string when the input is only unsafe characters", () => {
    expect(sanitizeFontFamily(";{}")).toBe("");
  });
});

describe("generateTypographyCss — sanitizes fontFamily on export", () => {
  it("strips a semicolon from fontFamily before emitting the CSS rule", () => {
    const settings: TypographySettings = {
      ...DEFAULT_TYPOGRAPHY,
      nodeLabel: { fontSize: 14, fontFamily: "Roboto; color: red" },
    };
    const result = generateTypographyCss(settings);
    // The injected semicolon must be gone from the font-family value
    expect(result).not.toContain("Roboto; color: red");
    // The sanitized value should appear in a well-formed declaration
    expect(result).toContain("font-family: Roboto color: red;");
  });

  it("strips braces from fontFamily so the CSS block stays balanced", () => {
    const settings: TypographySettings = {
      ...DEFAULT_TYPOGRAPHY,
      diagramTitle: { fontSize: 20, fontFamily: "Bad{Font}" },
    };
    const result = generateTypographyCss(settings);
    const ruleLines = result.split("\n").filter((l) => l.startsWith("."));
    expect(ruleLines.length).toBeGreaterThan(0);
    for (const line of ruleLines) {
      expect(line.trim()).toMatch(/\}$/);
    }
    // Value should have braces stripped
    expect(result).toContain("font-family: BadFont;");
  });

  it("braces remain balanced when fontFamily contains injection characters", () => {
    const settings: TypographySettings = {
      ...DEFAULT_TYPOGRAPHY,
      edgeLabel: { fontSize: 12, fontFamily: "X;{Y}Z" },
    };
    const result = generateTypographyCss(settings);
    const opens = [...result].filter((c) => c === "{").length;
    const closes = [...result].filter((c) => c === "}").length;
    expect(opens).toBe(closes);
  });
});

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

describe("typographyToScaffoldSection — pipe character escaping", () => {
  it("escapes a pipe in the font family so the table cell is not split", () => {
    const settings: TypographySettings = {
      ...DEFAULT_TYPOGRAPHY,
      nodeLabel: { fontSize: 14, fontFamily: "Font | Fallback" },
    };
    const result = typographyToScaffoldSection(settings);
    // The raw unescaped pipe must not appear in a data row.
    const dataRows = result
      .split("\n")
      .filter((l) => l.startsWith("|") && !l.startsWith("|---") && !l.startsWith("| Tier"));
    for (const row of dataRows) {
      // Strip the leading and trailing delimiter, then check no bare pipe remains.
      const inner = row.slice(1, -1);
      expect(inner).not.toContain(" | Font | Fallback | ");
    }
    // The escaped form must be present.
    expect(result).toContain("Font \\| Fallback");
  });

  it("each data row has exactly 4 pipe-separated columns after escaping", () => {
    const settings: TypographySettings = {
      ...DEFAULT_TYPOGRAPHY,
      diagramTitle: { fontSize: 20, fontFamily: "A | B | C" },
      nodeLabel: { fontSize: 14, fontFamily: "Safe Font" },
    };
    const result = typographyToScaffoldSection(settings);
    const dataRows = result
      .split("\n")
      .filter((l) => l.startsWith("|") && !l.startsWith("|---") && !l.startsWith("| Tier"));
    expect(dataRows).toHaveLength(5);
    // A valid GFM table row with 4 columns: `| col1 | col2 | col3 | col4 |`
    // After escaping, splitting on unescaped `|` gives exactly 6 parts
    // (empty, col1, col2, col3, col4, empty).
    for (const row of dataRows) {
      // Split on `|` that is NOT preceded by `\`.
      const cols = row.split(/(?<!\\)\|/);
      // Leading and trailing empty strings from the outer delimiters → 6 parts total.
      expect(cols).toHaveLength(6);
    }
  });

  it("pipe in the placeholder value is also escaped", () => {
    // Manually test the placeholder path: fontFamily empty → falls back to
    // "(palette fontFamily)" which contains no pipe, but we verify general
    // pipe escaping logic still applies when fontFamily is exactly "|".
    const settings: TypographySettings = {
      ...DEFAULT_TYPOGRAPHY,
      edgeLabel: { fontSize: 12, fontFamily: "|" },
    };
    const result = typographyToScaffoldSection(settings);
    expect(result).toContain("\\|");
    // The table must still have the correct number of columns per row.
    const dataRows = result
      .split("\n")
      .filter((l) => l.startsWith("|") && !l.startsWith("|---") && !l.startsWith("| Tier"));
    for (const row of dataRows) {
      const cols = row.split(/(?<!\\)\|/);
      expect(cols).toHaveLength(6);
    }
  });

  it("safe font names without pipes are not altered", () => {
    const settings: TypographySettings = {
      ...DEFAULT_TYPOGRAPHY,
      nodeLabel: { fontSize: 14, fontFamily: "Inter, 'DM Sans', sans-serif" },
    };
    const result = typographyToScaffoldSection(settings);
    expect(result).toContain("Inter, 'DM Sans', sans-serif");
    expect(result).not.toContain("\\|");
  });
});

// ---------------------------------------------------------------------------
// 9. generateTypographyCss — snapshot tests
//
// Snapshot the full string output so any unintended change to whitespace,
// comment phrasing, declaration order, or tier ordering causes CI to fail and
// requires an intentional `vitest --update-snapshots` update.
// ---------------------------------------------------------------------------

describe("generateTypographyCss — snapshots", () => {
  it("default settings: only the header comment is emitted", () => {
    expect(generateTypographyCss(DEFAULT_TYPOGRAPHY)).toMatchInlineSnapshot(
      `"/* Mermaid typography hierarchy — flowchart/subgraph targets */"`
    );
  });

  it("single-tier override: one section comment + one rule line", () => {
    const settings: TypographySettings = {
      ...DEFAULT_TYPOGRAPHY,
      edgeLabel: { fontSize: 10, fontFamily: "JetBrains Mono" },
    };
    expect(generateTypographyCss(settings)).toMatchInlineSnapshot(`
      "/* Mermaid typography hierarchy — flowchart/subgraph targets */
      /* Edge Label */
      .edgeLabel { font-size: 10px; font-family: JetBrains Mono; }"
    `);
  });

  it("font-family-only tier change: emits a single font-family declaration with no font-size rule", () => {
    // nodeLabel fontSize stays at the default (14px) — only fontFamily is set.
    // The output must contain exactly one declaration: font-family, no font-size.
    const settings: TypographySettings = {
      ...DEFAULT_TYPOGRAPHY,
      nodeLabel: { fontSize: 14, fontFamily: "DM Sans" },
    };
    expect(generateTypographyCss(settings)).toMatchInlineSnapshot(`
      "/* Mermaid typography hierarchy — flowchart/subgraph targets */
      /* Node Label */
      .node .label { font-family: DM Sans; }"
    `);
  });

  it("font-family-only diagramTitle change: emits its title selector with one declaration", () => {
    const settings: TypographySettings = {
      ...DEFAULT_TYPOGRAPHY,
      diagramTitle: { fontSize: 20, fontFamily: "Alfa Slab One" },
    };
    expect(generateTypographyCss(settings)).toMatchInlineSnapshot(`
      "/* Mermaid typography hierarchy — flowchart/subgraph targets */
      /* Diagram Title */
      .label { font-family: Alfa Slab One; }"
    `);
  });

  it("font-family-only subgraphTitle change: emits its cluster selector with one declaration", () => {
    const settings: TypographySettings = {
      ...DEFAULT_TYPOGRAPHY,
      subgraphTitle: { fontSize: 16, fontFamily: "Space Grotesk" },
    };
    expect(generateTypographyCss(settings)).toMatchInlineSnapshot(`
      "/* Mermaid typography hierarchy — flowchart/subgraph targets */
      /* Subgraph Title */
      .cluster-label { font-family: Space Grotesk; }"
    `);
  });

  it("font-family-only nestedSubgraphTitle change: emits its nested selector with one declaration", () => {
    const settings: TypographySettings = {
      ...DEFAULT_TYPOGRAPHY,
      nestedSubgraphTitle: { fontSize: 14, fontFamily: "Source Serif" },
    };
    expect(generateTypographyCss(settings)).toMatchInlineSnapshot(`
      "/* Mermaid typography hierarchy — flowchart/subgraph targets */
      /* Nested Subgraph */
      .cluster-label .nodeLabel { font-family: Source Serif; }"
    `);
  });

  it("font-family-only edgeLabel change: emits its edge selector with one declaration", () => {
    const settings: TypographySettings = {
      ...DEFAULT_TYPOGRAPHY,
      edgeLabel: { fontSize: 12, fontFamily: "JetBrains Mono" },
    };
    expect(generateTypographyCss(settings)).toMatchInlineSnapshot(`
      "/* Mermaid typography hierarchy — flowchart/subgraph targets */
      /* Edge Label */
      .edgeLabel { font-family: JetBrains Mono; }"
    `);
  });

  it("fully-modified settings with fallback stacks: all five tiers in order", () => {
    const settings: TypographySettings = {
      diagramTitle: { fontSize: 24, fontFamily: "Alfa Slab One" },
      subgraphTitle: { fontSize: 20, fontFamily: "'DM Sans', sans-serif" },
      nestedSubgraphTitle: { fontSize: 16, fontFamily: "DM Sans" },
      nodeLabel: { fontSize: 13, fontFamily: "JetBrains Mono, monospace" },
      edgeLabel: { fontSize: 11, fontFamily: "Inter, sans-serif" },
    };
    expect(generateTypographyCss(settings)).toMatchInlineSnapshot(`
      "/* Mermaid typography hierarchy — flowchart/subgraph targets */
      /* Diagram Title */
      .label { font-size: 24px; font-family: Alfa Slab One; }
      /* Subgraph Title */
      .cluster-label { font-size: 20px; font-family: 'DM Sans', sans-serif; }
      /* Nested Subgraph */
      .cluster-label .nodeLabel { font-size: 16px; font-family: DM Sans; }
      /* Node Label */
      .node .label { font-size: 13px; font-family: JetBrains Mono, monospace; }
      /* Edge Label */
      .edgeLabel { font-size: 11px; font-family: Inter, sans-serif; }"
    `);
  });
});

// ---------------------------------------------------------------------------
// 8. typographyToScaffoldSection — full output pin
//
// Pins the complete string returned by typographyToScaffoldSection for
// DEFAULT_TYPOGRAPHY. Any accidental deletion of the prose blocks (hierarchy
// rule, CSS targets), the heading, the table structure, or any tier row will
// cause this test to fail and force an intentional update.
// ---------------------------------------------------------------------------

describe("typographyToScaffoldSection — full output pin for DEFAULT_TYPOGRAPHY", () => {
  it("matches the complete expected markdown section exactly", () => {
    const expected = [
      "## Typography Hierarchy",
      "",
      "The following 5-tier type scale applies to this diagram. Do not alter font sizes outside this contract.",
      "",
      "| Tier | Target | Size | Font Family |",
      "|------|--------|------|-------------|",
      "| Diagram Title | %%{init}%% title / diagram heading | 20px | (palette fontFamily) |",
      "| Subgraph Title | Top-level subgraph / cluster header | 16px | (palette fontFamily) |",
      "| Nested Subgraph | Inner subgraph header labels | 14px | (palette fontFamily) |",
      "| Node Label | Text inside nodes and shapes | 14px | (palette fontFamily) |",
      "| Edge Label | Text on edge connectors | 12px | (palette fontFamily) |",
      "",
      "**Hierarchy rule:** Each tier's size must be ≤ the tier above it. If you nest subgraphs, inner headings must be smaller than outer headings.",
      "",
      "**CSS targets (flowchart):**",
      "- Diagram title: `.label`",
      "- Subgraph title: `.cluster-label`",
      "- Node label: `.node .label`",
      "- Edge label: `.edgeLabel`",
    ].join("\n");
    expect(typographyToScaffoldSection(DEFAULT_TYPOGRAPHY)).toEqual(expected);
  });
});

// ---------------------------------------------------------------------------
// Font family live preview — ComposeTab render tests
// ---------------------------------------------------------------------------

describe("ComposeTab — font family live preview", () => {
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
      onNavigateToParityMatrix: noop,
      importDiagnostics: null,
      onImportDiagnosticsChange: noop,
    };
  }

  it("renders no font-family preview spans when all fontFamily values are empty", () => {
    const { container } = render(createElement(ComposeTab, makeProps(DEFAULT_TYPOGRAPHY)));
    const previews = container.querySelectorAll('[aria-label*="font family preview"]');
    expect(previews).toHaveLength(0);
  });

  it("renders a preview span when a single tier has a fontFamily set", () => {
    const typography: TypographySettings = {
      ...DEFAULT_TYPOGRAPHY,
      nodeLabel: { fontSize: 14, fontFamily: "Roboto" },
    };
    const { container } = render(createElement(ComposeTab, makeProps(typography)));
    const previews = container.querySelectorAll('[aria-label*="font family preview"]');
    expect(previews).toHaveLength(1);
  });

  it("preview span is labelled after its tier", () => {
    const typography: TypographySettings = {
      ...DEFAULT_TYPOGRAPHY,
      diagramTitle: { fontSize: 20, fontFamily: "DM Sans" },
    };
    const { container } = render(createElement(ComposeTab, makeProps(typography)));
    const preview = container.querySelector('[aria-label="Diagram Title font family preview"]');
    expect(preview).not.toBeNull();
  });

  it("preview span has the correct font-family inline style", () => {
    const typography: TypographySettings = {
      ...DEFAULT_TYPOGRAPHY,
      edgeLabel: { fontSize: 12, fontFamily: "JetBrains Mono" },
    };
    const { container } = render(createElement(ComposeTab, makeProps(typography)));
    const preview = container.querySelector(
      '[aria-label="Edge Label font family preview"]'
    ) as HTMLElement | null;
    expect(preview).not.toBeNull();
    // happy-dom may quote multi-word font names; normalise by stripping outer quotes
    expect(preview!.style.fontFamily.replace(/^"(.*)"$/, "$1")).toBe("JetBrains Mono");
  });

  it("renders five preview spans when all tiers have a fontFamily set", () => {
    const typography: TypographySettings = {
      diagramTitle: { fontSize: 20, fontFamily: "Alfa Slab One" },
      subgraphTitle: { fontSize: 16, fontFamily: "DM Sans" },
      nestedSubgraphTitle: { fontSize: 14, fontFamily: "DM Sans" },
      nodeLabel: { fontSize: 14, fontFamily: "JetBrains Mono" },
      edgeLabel: { fontSize: 12, fontFamily: "Inter" },
    };
    const { container } = render(createElement(ComposeTab, makeProps(typography)));
    const previews = container.querySelectorAll('[aria-label*="font family preview"]');
    expect(previews).toHaveLength(5);
  });

  it("preview span uses the sanitized font-family value (strips injection chars)", () => {
    const unsafe = "Roboto;color:red{";
    const typography: TypographySettings = {
      ...DEFAULT_TYPOGRAPHY,
      nodeLabel: { fontSize: 14, fontFamily: unsafe },
    };
    const { container } = render(createElement(ComposeTab, makeProps(typography)));
    const preview = container.querySelector(
      '[aria-label="Node Label font family preview"]'
    ) as HTMLElement | null;
    expect(preview).not.toBeNull();
    // Inline style must use the sanitized value, not the raw unsafe string
    expect(preview!.style.fontFamily).toBe(sanitizeFontFamily(unsafe));
    expect(preview!.style.fontFamily).not.toContain(";");
    expect(preview!.style.fontFamily).not.toContain("{");
  });

  it("preview span displays 'Aa' as its text content", () => {
    const typography: TypographySettings = {
      ...DEFAULT_TYPOGRAPHY,
      subgraphTitle: { fontSize: 16, fontFamily: "DM Sans" },
    };
    const { container } = render(createElement(ComposeTab, makeProps(typography)));
    const preview = container.querySelector(
      '[aria-label="Subgraph Title font family preview"]'
    ) as HTMLElement | null;
    expect(preview).not.toBeNull();
    expect(preview!.textContent?.trim()).toBe("Aa");
  });

  // -------------------------------------------------------------------------
  // Round-trip: fontFamily survives JSON serialization (mirrors persistence
  // save/load path used for user palettes and stored app state).
  // -------------------------------------------------------------------------

  it("fontFamily is byte-for-byte identical after JSON stringify → parse round-trip", () => {
    // Multi-word name with a fallback stack — spaces and commas must survive.
    const original: TypographySettings = {
      ...DEFAULT_TYPOGRAPHY,
      nodeLabel: { fontSize: 14, fontFamily: "DM Sans, sans-serif" },
    };
    const parsed = JSON.parse(JSON.stringify(original)) as TypographySettings;
    expect(parsed.nodeLabel.fontFamily).toBe("DM Sans, sans-serif");
  });

  it("all five tier fontFamily values survive a full JSON round-trip unchanged", () => {
    const original: TypographySettings = {
      diagramTitle: { fontSize: 24, fontFamily: "Alfa Slab One" },
      subgraphTitle: { fontSize: 20, fontFamily: "'DM Sans', sans-serif" },
      nestedSubgraphTitle: { fontSize: 16, fontFamily: "JetBrains Mono, monospace" },
      nodeLabel: { fontSize: 13, fontFamily: "Inter, Arial, sans-serif" },
      edgeLabel: { fontSize: 11, fontFamily: "Roboto" },
    };
    const parsed = JSON.parse(JSON.stringify(original)) as TypographySettings;
    for (const key of TIER_ORDER) {
      expect(parsed[key].fontFamily).toBe(original[key].fontFamily);
    }
  });

  it("preview span font-family style is identical before and after a JSON round-trip", () => {
    // Simulates the persistence path: App serialises TypographySettings to
    // localStorage (JSON.stringify) then re-reads it on the next load
    // (JSON.parse). The preview span must render the same font-family style
    // both times — no silent mutation of the value.
    const original: TypographySettings = {
      ...DEFAULT_TYPOGRAPHY,
      edgeLabel: { fontSize: 12, fontFamily: "DM Sans" },
    };

    // Render before the round-trip.
    const { container: before, unmount } = render(createElement(ComposeTab, makeProps(original)));
    const spanBefore = before.querySelector(
      '[aria-label="Edge Label font family preview"]'
    ) as HTMLElement | null;
    expect(spanBefore).not.toBeNull();
    // happy-dom may quote multi-word font names; normalise by stripping outer quotes.
    const styleBefore = spanBefore!.style.fontFamily.replace(/^"(.*)"$/, "$1");
    unmount();

    // Simulate the persistence round-trip.
    const roundTripped = JSON.parse(JSON.stringify(original)) as TypographySettings;

    // Render after the round-trip.
    const { container: after } = render(createElement(ComposeTab, makeProps(roundTripped)));
    const spanAfter = after.querySelector(
      '[aria-label="Edge Label font family preview"]'
    ) as HTMLElement | null;
    expect(spanAfter).not.toBeNull();
    const styleAfter = spanAfter!.style.fontFamily.replace(/^"(.*)"$/, "$1");

    // The style must be identical — round-trip must not mutate the value.
    expect(styleAfter).toBe(styleBefore);
    // And it must equal sanitizeFontFamily applied to the original value.
    expect(styleAfter).toBe(sanitizeFontFamily(original.edgeLabel.fontFamily));
  });
});

// ---------------------------------------------------------------------------
// FontFamilySelect in typography tier rows
//
// Acceptance criteria (task #504):
//   1. Each tier row renders a preset dropdown (<select>) and a custom text input.
//   2. Picking a preset from the dropdown immediately updates the fontFamily value
//      and makes the live "Aa" preview span appear.
//   3. Typing a custom font name in the text input also updates the value —
//      users are not restricted to the preset list.
// ---------------------------------------------------------------------------

describe("ComposeTab — FontFamilySelect in typography tier rows", () => {
  const palette = BRAND_PALETTES[0];
  const noop = vi.fn();

  function makeProps(
    typography: TypographySettings,
    onTypographyChange: (t: TypographySettings) => void = noop
  ) {
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
      onTypographyChange,
      rendererTarget: "",
      onRendererTargetChange: noop,
      onUseExtractedTheme: noop,
      onSwitchTab: noop,
      onNavigateToParityMatrix: noop,
      importDiagnostics: null,
      onImportDiagnosticsChange: noop,
    };
  }

  it("renders a preset <select> and a custom text <input> for each of the five tiers", () => {
    const { container } = render(createElement(ComposeTab, makeProps(DEFAULT_TYPOGRAPHY)));
    // Each tier row's FontFamilySelect renders one <select aria-label="… font family preset">
    // and one <input aria-label="… font family override"> per TIER_META label.
    const selects = container.querySelectorAll('[aria-label$="font family preset"]');
    const inputs = container.querySelectorAll('[aria-label$="font family override"]');
    // There are 5 typography tier rows; each gets one select + one input.
    expect(selects.length).toBeGreaterThanOrEqual(5);
    expect(inputs.length).toBeGreaterThanOrEqual(5);
  });

  it("selecting a preset option calls onTypographyChange with the preset value", () => {
    const onChange = vi.fn();
    const { container } = render(
      createElement(ComposeTab, makeProps(DEFAULT_TYPOGRAPHY, onChange))
    );

    // Grab the preset select for "Node Label".
    const select = container.querySelector(
      '[aria-label="Node Label font family preset"]'
    ) as HTMLSelectElement | null;
    expect(select).not.toBeNull();

    // Change to the "Inter" preset (value "Inter, system-ui, sans-serif").
    fireEvent.change(select!, { target: { value: "Inter, system-ui, sans-serif" } });

    // onTypographyChange must have been called at least once.
    expect(onChange).toHaveBeenCalled();
    // The most-recent call must carry the chosen preset value on nodeLabel.
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0] as TypographySettings;
    expect(lastCall.nodeLabel.fontFamily).toBe("Inter, system-ui, sans-serif");
  });

  it("selecting a preset causes the live 'Aa' preview span to appear", () => {
    const { container, rerender } = render(
      createElement(ComposeTab, makeProps(DEFAULT_TYPOGRAPHY))
    );

    // No preview span yet — fontFamily is empty.
    expect(container.querySelector('[aria-label="Node Label font family preview"]')).toBeNull();

    // Rerender with the preset applied.
    const withPreset: TypographySettings = {
      ...DEFAULT_TYPOGRAPHY,
      nodeLabel: { fontSize: 14, fontFamily: "Inter, system-ui, sans-serif" },
    };
    rerender(createElement(ComposeTab, makeProps(withPreset)));

    const preview = container.querySelector(
      '[aria-label="Node Label font family preview"]'
    ) as HTMLElement | null;
    expect(preview).not.toBeNull();
    expect(preview!.textContent?.trim()).toBe("Aa");
  });

  it("typing a custom font name in the text input calls onTypographyChange with that value", () => {
    const onChange = vi.fn();
    const { container } = render(
      createElement(ComposeTab, makeProps(DEFAULT_TYPOGRAPHY, onChange))
    );

    const input = container.querySelector(
      '[aria-label="Edge Label font family override"]'
    ) as HTMLInputElement | null;
    expect(input).not.toBeNull();

    fireEvent.change(input!, { target: { value: "My Custom Font" } });

    expect(onChange).toHaveBeenCalled();
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0] as TypographySettings;
    expect(lastCall.edgeLabel.fontFamily).toBe("My Custom Font");
  });

  it("the custom text input reflects an existing fontFamily value (controlled)", () => {
    const typography: TypographySettings = {
      ...DEFAULT_TYPOGRAPHY,
      diagramTitle: { fontSize: 20, fontFamily: "Roboto, sans-serif" },
    };
    const { container } = render(createElement(ComposeTab, makeProps(typography)));

    const input = container.querySelector(
      '[aria-label="Diagram Title font family override"]'
    ) as HTMLInputElement | null;
    expect(input).not.toBeNull();
    expect(input!.value).toBe("Roboto, sans-serif");
  });
});
