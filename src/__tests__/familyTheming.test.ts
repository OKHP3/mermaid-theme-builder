import { describe, it, expect } from "vitest";
import { familyThemeOverlay } from "@/lib/family-theming";
import type { Palette } from "@/lib/palettes";
import type { DiagramFamily } from "@/lib/detector";

const TEST_PALETTE: Palette = {
  id: "test",
  label: "Test Palette",
  colors: [
    { key: "primaryColor", label: "Primary", value: "#1a4f8a" },
    { key: "primaryTextColor", label: "Primary text", value: "#ffffff" },
    { key: "primaryBorderColor", label: "Primary border", value: "#0d3060" },
    { key: "secondaryColor", label: "Secondary", value: "#374151" },
    { key: "tertiaryColor", label: "Tertiary", value: "#e5e7eb" },
    { key: "background", label: "Background", value: "#ffffff" },
    { key: "mainBkg", label: "Main bkg", value: "#dbeafe" },
    { key: "nodeBorder", label: "Node border", value: "#1d4ed8" },
    { key: "lineColor", label: "Line color", value: "#2563eb" },
    { key: "titleColor", label: "Title", value: "#111827" },
    { key: "clusterBkg", label: "Cluster bkg", value: "#e0f2fe" },
  ],
};

describe("familyThemeOverlay — block", () => {
  const result = familyThemeOverlay(TEST_PALETTE, "block");

  it("returns a non-empty object", () => {
    expect(Object.keys(result).length).toBeGreaterThan(0);
  });

  it("includes mainBkg from palette", () => {
    expect(result.mainBkg).toBe("#dbeafe");
  });

  it("includes nodeBorder from palette", () => {
    expect(result.nodeBorder).toBe("#1d4ed8");
  });

  it("includes lineColor from palette", () => {
    expect(result.lineColor).toBe("#2563eb");
  });

  it("includes clusterBkg from palette", () => {
    expect(result.clusterBkg).toBe("#e0f2fe");
  });

  it("includes titleColor from palette", () => {
    expect(result.titleColor).toBe("#111827");
  });
});

describe("familyThemeOverlay — c4Diagram", () => {
  const result = familyThemeOverlay(TEST_PALETTE, "c4Diagram");

  it("returns a non-empty object", () => {
    expect(Object.keys(result).length).toBeGreaterThan(0);
  });

  it("maps primaryColor to personBkg", () => {
    expect(result.personBkg).toBe("#1a4f8a");
  });

  it("maps primaryBorderColor to personBorder", () => {
    expect(result.personBorder).toBe("#0d3060");
  });

  it("includes mainBkg from palette", () => {
    expect(result.mainBkg).toBe("#dbeafe");
  });

  it("includes nodeBorder from palette", () => {
    expect(result.nodeBorder).toBe("#1d4ed8");
  });

  it("includes lineColor from palette", () => {
    expect(result.lineColor).toBe("#2563eb");
  });

  it("includes titleColor from palette", () => {
    expect(result.titleColor).toBe("#111827");
  });
});

const NO_OVERLAY_FAMILIES = [
  "flowchart",
  "mindmap",
  "requirementDiagram",
  "architectureBeta",
  "sankey",
  "packet",
  "kanban",
  "treemap",
  "venn",
  "ishikawa",
  "wardley",
  "treeView",
  "zenuml",
  "radar",
  "eventModeling",
  "unknown",
] as const satisfies readonly DiagramFamily[];

describe("familyThemeOverlay — default-overlay families", () => {
  for (const family of NO_OVERLAY_FAMILIES) {
    it(`returns no family-specific theme variables for ${family}`, () => {
      expect(familyThemeOverlay(TEST_PALETTE, family), family).toEqual({});
    });
  }
});

describe("familyThemeOverlay — palette fallback defaults", () => {
  const emptyPalette: Palette = { id: "empty", label: "Empty", colors: [] };

  it("block returns values even with an empty palette (falls back to hardcoded defaults)", () => {
    const result = familyThemeOverlay(emptyPalette, "block");
    expect(Object.keys(result).length).toBeGreaterThan(0);
    expect(result.mainBkg).toBeTruthy();
  });

  it("c4Diagram returns personBkg even with an empty palette", () => {
    const result = familyThemeOverlay(emptyPalette, "c4Diagram");
    expect(result.personBkg).toBeTruthy();
    expect(result.personBorder).toBeTruthy();
  });
});
