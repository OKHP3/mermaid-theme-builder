import { describe, it, expect } from "vitest";
import {
  generatePromptScaffoldWithFormat,
  type ExportOptions,
} from "@/lib/themeEngine";
import { resolveScaffoldFormat } from "@/lib/scaffoldPrefs";
import { BRAND_PALETTES } from "@/lib/palettes";

const palette = BRAND_PALETTES[0];

const BASE_OPTIONS: ExportOptions = {
  palette,
  diagramFamily: "flowchart",
  includeMetaComments: false,
  includeBadge: false,
};

/**
 * Tests for resolveScaffoldFormat (src/lib/scaffoldPrefs.ts).
 * That function is the single validator used by both PromptScaffoldModal and
 * ApplyTab — it guards against invalid or missing localStorage values.
 */
describe("resolveScaffoldFormat", () => {
  it('returns "formatA" when "formatA" is stored', () => {
    expect(resolveScaffoldFormat("formatA")).toBe("formatA");
  });

  it('returns "formatB" when "formatB" is stored', () => {
    expect(resolveScaffoldFormat("formatB")).toBe("formatB");
  });

  it('returns "both" when "both" is stored', () => {
    expect(resolveScaffoldFormat("both")).toBe("both");
  });

  it('defaults to "both" when stored value is null (key not set)', () => {
    expect(resolveScaffoldFormat(null)).toBe("both");
  });

  it('defaults to "both" for empty string', () => {
    expect(resolveScaffoldFormat("")).toBe("both");
  });

  it('defaults to "both" for an unrecognized value', () => {
    expect(resolveScaffoldFormat("format-a")).toBe("both");
    expect(resolveScaffoldFormat("A")).toBe("both");
    expect(resolveScaffoldFormat("formatC")).toBe("both");
  });

  it('defaults to "both" for wrong-case variants ("FormatA", "BOTH")', () => {
    expect(resolveScaffoldFormat("FormatA")).toBe("both");
    expect(resolveScaffoldFormat("BOTH")).toBe("both");
  });
});

describe("generatePromptScaffoldWithFormat — format-specific output", () => {
  describe("formatA", () => {
    it("contains the %%{init}%% directive in the theme section", () => {
      const result = generatePromptScaffoldWithFormat(palette, BASE_OPTIONS, "formatA");
      expect(result).toContain("%%{init:");
    });

    it("does NOT contain the Format B YAML frontmatter heading", () => {
      const result = generatePromptScaffoldWithFormat(palette, BASE_OPTIONS, "formatA");
      expect(result).not.toContain("Format B —");
    });

    it("instructs AI to always start with the %%{init}%% directive", () => {
      const result = generatePromptScaffoldWithFormat(palette, BASE_OPTIONS, "formatA");
      expect(result).toContain("ALWAYS start the diagram with the `%%{init}%%` theme directive");
    });

    it("update-prompt restore text references %%{init}%% specifically", () => {
      const result = generatePromptScaffoldWithFormat(palette, BASE_OPTIONS, "formatA");
      expect(result).toContain("Restore the `%%{init}%%` theme directive at the very top");
    });

    it("theme directive section heading names Format A explicitly", () => {
      const result = generatePromptScaffoldWithFormat(palette, BASE_OPTIONS, "formatA");
      expect(result).toContain("directive (Format A)");
    });
  });

  describe("formatB", () => {
    it("contains YAML frontmatter block (config: / themeVariables:)", () => {
      const result = generatePromptScaffoldWithFormat(palette, BASE_OPTIONS, "formatB");
      expect(result).toContain("config:");
      expect(result).toContain("themeVariables:");
    });

    it("does NOT contain the Format A %% directive heading", () => {
      const result = generatePromptScaffoldWithFormat(palette, BASE_OPTIONS, "formatB");
      expect(result).not.toContain("Format A —");
    });

    it("instructs AI to always start with the YAML frontmatter directive", () => {
      const result = generatePromptScaffoldWithFormat(palette, BASE_OPTIONS, "formatB");
      expect(result).toContain("ALWAYS start the diagram with the YAML frontmatter theme directive");
    });

    it("update-prompt restore text references YAML frontmatter specifically", () => {
      const result = generatePromptScaffoldWithFormat(palette, BASE_OPTIONS, "formatB");
      expect(result).toContain("Restore the YAML frontmatter theme directive at the very top");
    });

    it("describes Format B as preferred for Mermaid v10.5+", () => {
      const result = generatePromptScaffoldWithFormat(palette, BASE_OPTIONS, "formatB");
      expect(result).toContain("YAML frontmatter (Format B)");
    });
  });

  describe("both", () => {
    it("includes both Format A and Format B section headings", () => {
      const result = generatePromptScaffoldWithFormat(palette, BASE_OPTIONS, "both");
      expect(result).toContain("Format A —");
      expect(result).toContain("Format B —");
    });

    it("includes the %%{init}%% directive block", () => {
      const result = generatePromptScaffoldWithFormat(palette, BASE_OPTIONS, "both");
      expect(result).toContain("%%{init:");
    });

    it("includes the YAML frontmatter block", () => {
      const result = generatePromptScaffoldWithFormat(palette, BASE_OPTIONS, "both");
      expect(result).toContain("config:");
      expect(result).toContain("themeVariables:");
    });

    it("instructs AI never to use both in the same diagram", () => {
      const result = generatePromptScaffoldWithFormat(palette, BASE_OPTIONS, "both");
      expect(result).toContain("Never use both in the same diagram");
    });

    it("update-prompt restore text is format-agnostic (A or B)", () => {
      const result = generatePromptScaffoldWithFormat(palette, BASE_OPTIONS, "both");
      expect(result).toContain("Restore the theme directive at the very top");
    });
  });

  describe("format output is mutually distinguishable", () => {
    it("formatA and formatB produce different output", () => {
      const a = generatePromptScaffoldWithFormat(palette, BASE_OPTIONS, "formatA");
      const b = generatePromptScaffoldWithFormat(palette, BASE_OPTIONS, "formatB");
      expect(a).not.toBe(b);
    });

    it("formatA and both produce different output", () => {
      const a = generatePromptScaffoldWithFormat(palette, BASE_OPTIONS, "formatA");
      const both = generatePromptScaffoldWithFormat(palette, BASE_OPTIONS, "both");
      expect(a).not.toBe(both);
    });

    it("formatB and both produce different output", () => {
      const b = generatePromptScaffoldWithFormat(palette, BASE_OPTIONS, "formatB");
      const both = generatePromptScaffoldWithFormat(palette, BASE_OPTIONS, "both");
      expect(b).not.toBe(both);
    });
  });
});

describe("generatePromptScaffoldWithFormat — renderer-awareness", () => {
  const RENDERER_OPTIONS: ExportOptions = {
    ...BASE_OPTIONS,
    rendererTarget: "github",
  };

  describe("renderer header comment placement", () => {
    it("appears before the first --- divider when a renderer is set", () => {
      const result = generatePromptScaffoldWithFormat(palette, RENDERER_OPTIONS, "both");
      const commentIdx = result.indexOf("<!-- Target renderer:");
      const dividerIdx = result.indexOf("\n---\n");
      expect(commentIdx, "renderer comment should be present").toBeGreaterThan(-1);
      expect(dividerIdx, "divider should be present").toBeGreaterThan(-1);
      expect(commentIdx).toBeLessThan(dividerIdx);
    });

    it("is absent when no rendererTarget is set", () => {
      const result = generatePromptScaffoldWithFormat(palette, BASE_OPTIONS, "both");
      expect(result).not.toContain("<!-- Target renderer:");
    });

    it("is absent when rendererTarget is undefined", () => {
      const opts: ExportOptions = { ...BASE_OPTIONS, rendererTarget: undefined };
      const result = generatePromptScaffoldWithFormat(palette, opts, "formatA");
      expect(result).not.toContain("<!-- Target renderer:");
    });
  });

  describe("github renderer — CSS injection and custom fonts blocked", () => {
    it("includes the renderer header comment near the top", () => {
      const result = generatePromptScaffoldWithFormat(palette, RENDERER_OPTIONS, "both");
      expect(result).toContain("<!-- Target renderer: GitHub");
    });

    it("header comment includes CSS injection blocked note", () => {
      const result = generatePromptScaffoldWithFormat(palette, RENDERER_OPTIONS, "both");
      expect(result).toContain("CSS injection not supported");
    });

    it("header comment includes custom fonts blocked note", () => {
      const result = generatePromptScaffoldWithFormat(palette, RENDERER_OPTIONS, "both");
      expect(result).toContain("custom fonts not supported");
    });

    it("header comment is present for formatA", () => {
      const result = generatePromptScaffoldWithFormat(palette, RENDERER_OPTIONS, "formatA");
      expect(result).toContain("<!-- Target renderer: GitHub");
    });

    it("header comment is present for formatB", () => {
      const result = generatePromptScaffoldWithFormat(palette, RENDERER_OPTIONS, "formatB");
      expect(result).toContain("<!-- Target renderer: GitHub");
    });
  });

  describe("obsidian renderer — CSS injection partial", () => {
    const obsidianOpts: ExportOptions = { ...BASE_OPTIONS, rendererTarget: "obsidian" };

    it("includes the renderer header comment", () => {
      const result = generatePromptScaffoldWithFormat(palette, obsidianOpts, "both");
      expect(result).toContain("<!-- Target renderer: Obsidian");
    });

    it("notes CSS injection is partial (not fully blocked)", () => {
      const result = generatePromptScaffoldWithFormat(palette, obsidianOpts, "both");
      expect(result).toContain("CSS injection is partial");
      expect(result).not.toContain("CSS injection not supported");
    });
  });

  describe("mermaid-live renderer — full support, no blocked items in comment", () => {
    const liveOpts: ExportOptions = { ...BASE_OPTIONS, rendererTarget: "mermaid-live" };

    it("includes the renderer header comment", () => {
      const result = generatePromptScaffoldWithFormat(palette, liveOpts, "both");
      expect(result).toContain("<!-- Target renderer: mermaid.live");
    });

    it("does NOT list any blocked features in the header comment", () => {
      const result = generatePromptScaffoldWithFormat(palette, liveOpts, "both");
      const commentStart = result.indexOf("<!-- Target renderer:");
      const commentEnd = result.indexOf("-->", commentStart);
      const commentText = result.slice(commentStart, commentEnd + 3);
      expect(commentText).not.toContain("—");
      expect(commentText).not.toContain("not supported");
      expect(commentText).not.toContain("partial");
    });
  });

  describe("scaffold with renderer differs from scaffold without renderer", () => {
    it("github renderer output differs from generic (no renderer)", () => {
      const withRenderer = generatePromptScaffoldWithFormat(palette, RENDERER_OPTIONS, "both");
      const withoutRenderer = generatePromptScaffoldWithFormat(palette, BASE_OPTIONS, "both");
      expect(withRenderer).not.toBe(withoutRenderer);
    });
  });
});
