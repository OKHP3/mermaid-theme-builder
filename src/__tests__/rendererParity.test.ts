import { describe, it, expect } from "vitest";
import {
  RENDERER_PROFILES,
  getRendererById,
  supportLabel,
  supportColor,
  buildRendererHeaderComment,
  type RendererSupport,
} from "@/data/renderer-parity";

const VALID_SUPPORT_VALUES: RendererSupport[] = ["full", "partial", "none", "unknown"];

describe("RENDERER_PROFILES", () => {
  it("has exactly 7 renderers", () => {
    expect(RENDERER_PROFILES.length).toBe(7);
  });

  it("every renderer has a non-empty id", () => {
    for (const r of RENDERER_PROFILES) {
      expect(r.id, "id must be non-empty").toBeTruthy();
    }
  });

  it("every renderer has a unique id", () => {
    const ids = RENDERER_PROFILES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every renderer has a non-empty displayName", () => {
    for (const r of RENDERER_PROFILES) {
      expect(r.displayName, `${r.id}.displayName must be non-empty`).toBeTruthy();
    }
  });

  it("every renderer has a non-empty shortName", () => {
    for (const r of RENDERER_PROFILES) {
      expect(r.shortName, `${r.id}.shortName must be non-empty`).toBeTruthy();
    }
  });

  it("every renderer has a non-empty url", () => {
    for (const r of RENDERER_PROFILES) {
      expect(r.url, `${r.id}.url must be non-empty`).toBeTruthy();
      expect(r.url.startsWith("http"), `${r.id}.url must start with http`).toBe(true);
    }
  });

  it("every renderer has a non-empty notes string", () => {
    for (const r of RENDERER_PROFILES) {
      expect(typeof r.notes).toBe("string");
      expect(r.notes.length, `${r.id}.notes must be non-empty`).toBeGreaterThan(10);
    }
  });

  it("every renderer looksSupported has classic, neo, handDrawn keys", () => {
    for (const r of RENDERER_PROFILES) {
      expect(r.looksSupported).toHaveProperty("classic");
      expect(r.looksSupported).toHaveProperty("neo");
      expect(r.looksSupported).toHaveProperty("handDrawn");
    }
  });

  it("every looksSupported value is a valid RendererSupport", () => {
    for (const r of RENDERER_PROFILES) {
      for (const [key, val] of Object.entries(r.looksSupported)) {
        expect(
          VALID_SUPPORT_VALUES.includes(val as RendererSupport),
          `${r.id}.looksSupported.${key} = "${val}" is not a valid RendererSupport`
        ).toBe(true);
      }
    }
  });

  it("themeVariableSupport is a valid RendererSupport for every renderer", () => {
    for (const r of RENDERER_PROFILES) {
      expect(
        VALID_SUPPORT_VALUES.includes(r.themeVariableSupport),
        `${r.id}.themeVariableSupport = "${r.themeVariableSupport}" is invalid`
      ).toBe(true);
    }
  });

  it("cssInjectionSupport is a valid RendererSupport for every renderer", () => {
    for (const r of RENDERER_PROFILES) {
      expect(
        VALID_SUPPORT_VALUES.includes(r.cssInjectionSupport),
        `${r.id}.cssInjectionSupport = "${r.cssInjectionSupport}" is invalid`
      ).toBe(true);
    }
  });

  it("mermaidVersionApprox is a non-empty string for every renderer", () => {
    for (const r of RENDERER_PROFILES) {
      expect(typeof r.mermaidVersionApprox).toBe("string");
      expect(
        r.mermaidVersionApprox.length,
        `${r.id}.mermaidVersionApprox must be non-empty`
      ).toBeGreaterThan(0);
    }
  });

  it("caveats is an array for every renderer", () => {
    for (const r of RENDERER_PROFILES) {
      expect(Array.isArray(r.caveats), `${r.id}.caveats must be an array`).toBe(true);
    }
  });

  it("mermaid-live renderer has full support for all looks", () => {
    const live = RENDERER_PROFILES.find((r) => r.id === "mermaid-live");
    expect(live).toBeDefined();
    expect(live?.looksSupported.classic).toBe("full");
    expect(live?.looksSupported.neo).toBe("full");
    expect(live?.looksSupported.handDrawn).toBe("full");
  });

  it("mermaid-live renderer has full themeVariable support", () => {
    const live = RENDERER_PROFILES.find((r) => r.id === "mermaid-live");
    expect(live?.themeVariableSupport).toBe("full");
  });

  it("notion renderer does not support neo look", () => {
    const notion = RENDERER_PROFILES.find((r) => r.id === "notion");
    expect(notion?.looksSupported.neo).toBe("none");
  });

  it("notion renderer does not support handDrawn look", () => {
    const notion = RENDERER_PROFILES.find((r) => r.id === "notion");
    expect(notion?.looksSupported.handDrawn).toBe("none");
  });

  it("github renderer does not support handDrawn look", () => {
    const github = RENDERER_PROFILES.find((r) => r.id === "github");
    expect(github?.looksSupported.handDrawn).toBe("none");
  });

  it("cli renderer has full support for all looks", () => {
    const cli = RENDERER_PROFILES.find((r) => r.id === "cli");
    expect(cli?.looksSupported.classic).toBe("full");
    expect(cli?.looksSupported.neo).toBe("full");
    expect(cli?.looksSupported.handDrawn).toBe("full");
  });

  it("no renderer has any undefined fields", () => {
    for (const r of RENDERER_PROFILES) {
      expect(r.id).not.toBeUndefined();
      expect(r.displayName).not.toBeUndefined();
      expect(r.shortName).not.toBeUndefined();
      expect(r.url).not.toBeUndefined();
      expect(r.notes).not.toBeUndefined();
      expect(r.looksSupported).not.toBeUndefined();
      expect(r.themeVariableSupport).not.toBeUndefined();
      expect(r.cssInjectionSupport).not.toBeUndefined();
      expect(r.mermaidVersionApprox).not.toBeUndefined();
      expect(r.caveats).not.toBeUndefined();
    }
  });
});

describe("getRendererById", () => {
  it("returns the renderer with matching id", () => {
    const r = getRendererById("github");
    expect(r?.id).toBe("github");
  });

  it("returns undefined for unknown id", () => {
    expect(getRendererById("nonexistent")).toBeUndefined();
  });

  it("works for every renderer id in RENDERER_PROFILES", () => {
    for (const r of RENDERER_PROFILES) {
      expect(getRendererById(r.id)?.id).toBe(r.id);
    }
  });
});

describe("supportLabel", () => {
  it("returns 'Full' for full", () => {
    expect(supportLabel("full")).toBe("Full");
  });

  it("returns 'Partial' for partial", () => {
    expect(supportLabel("partial")).toBe("Partial");
  });

  it("returns 'None' for none", () => {
    expect(supportLabel("none")).toBe("None");
  });

  it("returns 'Unknown' for unknown", () => {
    expect(supportLabel("unknown")).toBe("Unknown");
  });
});

describe("supportColor", () => {
  it("returns a non-empty string for every support level", () => {
    for (const level of VALID_SUPPORT_VALUES) {
      const color = supportColor(level);
      expect(typeof color).toBe("string");
      expect(color.length).toBeGreaterThan(0);
    }
  });

  it("returns different colors for full vs none", () => {
    expect(supportColor("full")).not.toBe(supportColor("none"));
  });
});

describe("buildRendererHeaderComment", () => {
  describe("generic / empty renderer ID", () => {
    it("returns empty string for empty string input", () => {
      expect(buildRendererHeaderComment("")).toBe("");
    });
  });

  describe("unknown renderer ID", () => {
    it("returns empty string for an unrecognized renderer ID", () => {
      expect(buildRendererHeaderComment("nonexistent-renderer")).toBe("");
    });

    it("returns empty string for a plausible-sounding unknown ID", () => {
      expect(buildRendererHeaderComment("vscode")).toBe("");
    });
  });

  describe("mermaid-live — full support, no blocked features", () => {
    it("returns an HTML comment naming the renderer", () => {
      const result = buildRendererHeaderComment("mermaid-live");
      expect(result).toMatch(/^<!-- Target renderer:/);
    });

    it("includes the shortName 'mermaid.live'", () => {
      const result = buildRendererHeaderComment("mermaid-live");
      expect(result).toContain("mermaid.live");
    });

    it("does NOT list any blocked or limited features", () => {
      const result = buildRendererHeaderComment("mermaid-live");
      expect(result).not.toContain("—");
    });

    it("closes the HTML comment correctly", () => {
      const result = buildRendererHeaderComment("mermaid-live");
      expect(result).toMatch(/-->$/);
    });
  });

  describe("github — CSS injection and custom fonts blocked", () => {
    it("returns an HTML comment naming GitHub", () => {
      const result = buildRendererHeaderComment("github");
      expect(result).toContain("GitHub");
    });

    it("lists CSS injection as not supported", () => {
      const result = buildRendererHeaderComment("github");
      expect(result).toContain("CSS injection not supported");
    });

    it("lists custom fonts as not supported", () => {
      const result = buildRendererHeaderComment("github");
      expect(result).toContain("custom fonts not supported");
    });

    it("uses the em-dash separator between renderer name and blocked list", () => {
      const result = buildRendererHeaderComment("github");
      expect(result).toContain(" — ");
    });

    it("matches the expected full comment string", () => {
      expect(buildRendererHeaderComment("github")).toBe(
        "<!-- Target renderer: GitHub — CSS injection not supported, custom fonts not supported -->"
      );
    });
  });

  describe("obsidian — CSS injection partial, no fully-blocked features", () => {
    it("returns an HTML comment naming Obsidian", () => {
      const result = buildRendererHeaderComment("obsidian");
      expect(result).toContain("Obsidian");
    });

    it("notes CSS injection is partial (not 'not supported')", () => {
      const result = buildRendererHeaderComment("obsidian");
      expect(result).toContain("CSS injection is partial");
      expect(result).not.toContain("CSS injection not supported");
    });

    it("does NOT report custom fonts as blocked (obsidian supports them partially)", () => {
      const result = buildRendererHeaderComment("obsidian");
      expect(result).not.toContain("custom fonts not supported");
    });

    it("matches the expected full comment string", () => {
      expect(buildRendererHeaderComment("obsidian")).toBe(
        "<!-- Target renderer: Obsidian — CSS injection is partial -->"
      );
    });
  });

  describe("notion — themeVariable partial, CSS injection and custom fonts blocked", () => {
    it("notes themeVariable support is partial", () => {
      const result = buildRendererHeaderComment("notion");
      expect(result).toContain("themeVariable support is partial");
    });

    it("notes CSS injection is not supported", () => {
      const result = buildRendererHeaderComment("notion");
      expect(result).toContain("CSS injection not supported");
    });

    it("notes custom fonts are not supported", () => {
      const result = buildRendererHeaderComment("notion");
      expect(result).toContain("custom fonts not supported");
    });

    it("matches the expected full comment string", () => {
      expect(buildRendererHeaderComment("notion")).toBe(
        "<!-- Target renderer: Notion — themeVariable support is partial, CSS injection not supported, custom fonts not supported -->"
      );
    });
  });

  describe("output format invariants", () => {
    it("every known renderer produces an HTML comment (not empty string)", () => {
      for (const renderer of RENDERER_PROFILES) {
        const result = buildRendererHeaderComment(renderer.id);
        expect(result, `${renderer.id} should produce a non-empty comment`).toMatch(
          /^<!-- Target renderer:/
        );
      }
    });

    it("every known renderer comment closes with -->", () => {
      for (const renderer of RENDERER_PROFILES) {
        const result = buildRendererHeaderComment(renderer.id);
        expect(result, `${renderer.id} comment should close with -->`).toMatch(/-->$/);
      }
    });

    it("a renderer with all 'full' support produces no em-dash separator", () => {
      const fullRenderers = RENDERER_PROFILES.filter(
        (r) =>
          r.initDirectiveSupport !== "none" &&
          r.themeVariableSupport !== "partial" &&
          r.cssInjectionSupport !== "none" &&
          r.cssInjectionSupport !== "partial" &&
          r.customFontSupport !== "none"
      );
      for (const renderer of fullRenderers) {
        const result = buildRendererHeaderComment(renderer.id);
        expect(result, `${renderer.id} should have no blocked items`).not.toContain(" — ");
      }
    });
  });
});
