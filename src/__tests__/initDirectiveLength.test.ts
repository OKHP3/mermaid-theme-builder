import { describe, it, expect } from "vitest";
import { checkInitDirectiveLength } from "@/lib/init-directive-length";
import type { RendererProfile } from "@/data/renderer-parity";
import { RENDERER_PROFILES } from "@/data/renderer-parity";

// ─── Stub factory ────────────────────────────────────────────────────────────

function makeProfile(overrides: Partial<RendererProfile>): RendererProfile {
  return {
    id: "test",
    displayName: "Test Renderer",
    shortName: "Test",
    url: "https://example.com",
    sourceUrl: "https://example.com",
    notes: "",
    looksSupported: { classic: "full", neo: "full", handDrawn: "full" },
    initDirectiveSupport: "full",
    themeVariableSupport: "full",
    classDefSupport: "full",
    cssInjectionSupport: "full",
    customFontSupport: "full",
    mermaidVersionApprox: "test",
    caveats: [],
    initDirectiveSafeLength: "unlimited",
    ...overrides,
  };
}

// ─── unlimited ceiling ────────────────────────────────────────────────────────

describe("checkInitDirectiveLength — unlimited ceiling", () => {
  it("returns status ok for a very long directive", () => {
    const profile = makeProfile({
      initDirectiveSafeLength: "unlimited",
      shortName: "mermaid.live",
    });
    const result = checkInitDirectiveLength(1000, profile);
    expect(result.status).toBe("ok");
    expect(result.directiveLength).toBe(1000);
    expect(result.ceiling).toBe("unlimited");
    expect(result.rendererName).toBe("mermaid.live");
  });

  it("returns ok for zero-length directive", () => {
    const profile = makeProfile({ initDirectiveSafeLength: "unlimited" });
    expect(checkInitDirectiveLength(0, profile).status).toBe("ok");
  });

  it("carries directiveLength unchanged", () => {
    const profile = makeProfile({ initDirectiveSafeLength: "unlimited" });
    const result = checkInitDirectiveLength(379, profile);
    expect(result.directiveLength).toBe(379);
  });
});

// ─── unverified ceiling ───────────────────────────────────────────────────────

describe("checkInitDirectiveLength — unverified ceiling", () => {
  it("returns status unknown for short directive", () => {
    const profile = makeProfile({ initDirectiveSafeLength: "unverified", shortName: "Notion" });
    const result = checkInitDirectiveLength(10, profile);
    expect(result.status).toBe("unknown");
    expect(result.ceiling).toBe("unverified");
  });

  it("returns status unknown for very long directive", () => {
    const profile = makeProfile({ initDirectiveSafeLength: "unverified", shortName: "Notion" });
    expect(checkInitDirectiveLength(800, profile).status).toBe("unknown");
  });

  it("never raises caution for unverified renderers", () => {
    const profile = makeProfile({ initDirectiveSafeLength: "unverified" });
    for (const len of [0, 1, 100, 500, 501, 597, 1000]) {
      expect(checkInitDirectiveLength(len, profile).status).not.toBe("caution");
    }
  });

  it("includes correct rendererName", () => {
    const profile = makeProfile({ initDirectiveSafeLength: "unverified", shortName: "Confluence" });
    expect(checkInitDirectiveLength(400, profile).rendererName).toBe("Confluence");
  });
});

// ─── numeric ceiling ──────────────────────────────────────────────────────────

describe("checkInitDirectiveLength — numeric ceiling (GitHub = 500)", () => {
  const githubProfile = makeProfile({ initDirectiveSafeLength: 500, shortName: "GitHub" });

  it("returns ok when directive is well below ceiling", () => {
    const result = checkInitDirectiveLength(200, githubProfile);
    expect(result.status).toBe("ok");
    expect(result.directiveLength).toBe(200);
    expect(result.ceiling).toBe(500);
    expect(result.rendererName).toBe("GitHub");
  });

  it("returns ok when directive is just below ceiling (499)", () => {
    expect(checkInitDirectiveLength(499, githubProfile).status).toBe("ok");
  });

  it("returns ok exactly at ceiling (500)", () => {
    // The safe ceiling is inclusive: at exactly the ceiling length the
    // directive is still within the safe zone.
    const result = checkInitDirectiveLength(500, githubProfile);
    expect(result.status).toBe("ok");
    expect(result.directiveLength).toBe(500);
  });

  it("returns caution at ceiling + 1 (501)", () => {
    const result = checkInitDirectiveLength(501, githubProfile);
    expect(result.status).toBe("caution");
    expect(result.directiveLength).toBe(501);
    expect(result.ceiling).toBe(500);
    expect(result.rendererName).toBe("GitHub");
  });

  it("returns caution for field-observed failure length (597)", () => {
    // PRD v5 notes that a 597-char directive failed on GitHub — this is the
    // original motivation for the 500-char ceiling.
    const result = checkInitDirectiveLength(597, githubProfile);
    expect(result.status).toBe("caution");
  });

  it("returns caution for very long directive (900)", () => {
    expect(checkInitDirectiveLength(900, githubProfile).status).toBe("caution");
  });
});

// ─── boundary arithmetic ─────────────────────────────────────────────────────

describe("checkInitDirectiveLength — boundary arithmetic", () => {
  it("ceiling of 1 — returns ok for length 0", () => {
    const p = makeProfile({ initDirectiveSafeLength: 1 });
    expect(checkInitDirectiveLength(0, p).status).toBe("ok");
  });

  it("ceiling of 1 — returns ok for length 1", () => {
    const p = makeProfile({ initDirectiveSafeLength: 1 });
    expect(checkInitDirectiveLength(1, p).status).toBe("ok");
  });

  it("ceiling of 1 — returns caution for length 2", () => {
    const p = makeProfile({ initDirectiveSafeLength: 1 });
    expect(checkInitDirectiveLength(2, p).status).toBe("caution");
  });

  it("ceiling of 300 — checks are consistent with > not >=", () => {
    const p = makeProfile({ initDirectiveSafeLength: 300 });
    expect(checkInitDirectiveLength(300, p).status).toBe("ok");
    expect(checkInitDirectiveLength(301, p).status).toBe("caution");
  });
});

// ─── integration: live RENDERER_PROFILES ─────────────────────────────────────

describe("checkInitDirectiveLength — live RENDERER_PROFILES", () => {
  it("all profiles define initDirectiveSafeLength with an allowed value", () => {
    for (const profile of RENDERER_PROFILES) {
      const val = profile.initDirectiveSafeLength;
      const valid = val === "unlimited" || val === "unverified" || typeof val === "number";
      expect(
        valid,
        `${profile.id}.initDirectiveSafeLength is "${String(val)}" — must be a number, "unlimited", or "unverified"`
      ).toBe(true);
    }
  });

  it("mermaid-live is unlimited and always ok", () => {
    const profile = RENDERER_PROFILES.find((r) => r.id === "mermaid-live")!;
    expect(profile.initDirectiveSafeLength).toBe("unlimited");
    expect(checkInitDirectiveLength(10_000, profile).status).toBe("ok");
  });

  it("cli is unlimited and always ok", () => {
    const profile = RENDERER_PROFILES.find((r) => r.id === "cli")!;
    expect(profile.initDirectiveSafeLength).toBe("unlimited");
    expect(checkInitDirectiveLength(10_000, profile).status).toBe("ok");
  });

  it("obsidian is unlimited and always ok", () => {
    const profile = RENDERER_PROFILES.find((r) => r.id === "obsidian")!;
    expect(profile.initDirectiveSafeLength).toBe("unlimited");
    expect(checkInitDirectiveLength(10_000, profile).status).toBe("ok");
  });

  it("github has a numeric ceiling and raises caution at 597 chars", () => {
    const profile = RENDERER_PROFILES.find((r) => r.id === "github")!;
    expect(typeof profile.initDirectiveSafeLength).toBe("number");
    expect(checkInitDirectiveLength(597, profile).status).toBe("caution");
  });

  it("gitlab has a numeric ceiling and raises caution at 597 chars", () => {
    const profile = RENDERER_PROFILES.find((r) => r.id === "gitlab")!;
    expect(typeof profile.initDirectiveSafeLength).toBe("number");
    expect(checkInitDirectiveLength(597, profile).status).toBe("caution");
  });

  it("notion ceiling is unverified — never raises caution", () => {
    const profile = RENDERER_PROFILES.find((r) => r.id === "notion")!;
    expect(profile.initDirectiveSafeLength).toBe("unverified");
    for (const len of [10, 400, 597, 1000]) {
      expect(checkInitDirectiveLength(len, profile).status).not.toBe("caution");
    }
  });

  it("confluence ceiling is unverified — never raises caution", () => {
    const profile = RENDERER_PROFILES.find((r) => r.id === "confluence")!;
    expect(profile.initDirectiveSafeLength).toBe("unverified");
    expect(checkInitDirectiveLength(600, profile).status).toBe("unknown");
  });

  it("m365-loop ceiling is unverified — never raises caution", () => {
    const profile = RENDERER_PROFILES.find((r) => r.id === "m365-loop")!;
    expect(profile.initDirectiveSafeLength).toBe("unverified");
    expect(checkInitDirectiveLength(600, profile).status).toBe("unknown");
  });
});
