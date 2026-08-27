import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

let css: string;

beforeAll(() => {
  css = readFileSync(resolve(import.meta.dirname, "../../src/styles/forge-tokens.css"), "utf-8");
});

// ─── Check 3: canonical raw palette hex values ────────────────────────────────

describe("forge-tokens.css — raw palette tokens (check 3)", () => {
  const CANONICAL_HEX: Record<string, string> = {
    "--okh-forge-bg": "#f0ebe5",
    "--okh-forge-paper": "#f6f2ee",
    "--okh-forge-ink": "#0f172a",
    "--okh-forge-teal": "#1c3a34",
    "--okh-forge-rust": "#c46a2c",
    "--okh-forge-amber": "#e6a03c",
    "--okh-forge-code-bg": "#0f1f1c",
    "--okh-forge-code-fg": "#d4c9b5",
  };

  for (const [token, hex] of Object.entries(CANONICAL_HEX)) {
    it(`${token} equals ${hex}`, () => {
      const pattern = new RegExp(String.raw`${token}\s*:\s*${hex.replace("#", "\\#")}`, "i");
      expect(pattern.test(css), `Expected "${token}: ${hex}" in forge-tokens.css`).toBe(true);
    });
  }
});

// ─── Check 4: light-mode semantic values ─────────────────────────────────────

describe("forge-tokens.css — light-mode semantic tokens (check 4)", () => {
  const LIGHT_TOKENS: Record<string, string> = {
    "--background": "33 18% 94%",
    "--foreground": "222 47% 11%",
    "--card": "34 35% 95%",
    "--primary": "25 63% 47%",
    "--primary-foreground": "222 47% 11%",
    "--muted-foreground": "220 9% 35%",
    "--ring": "25 63% 47%",
    "--radius": "0.75rem",
  };

  for (const [token, value] of Object.entries(LIGHT_TOKENS)) {
    it(`${token}: ${value}`, () => {
      const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const pattern = new RegExp(String.raw`${token}\s*:\s*${escaped}`);
      expect(
        pattern.test(css),
        `Expected "${token}: ${value}" in the light-mode :root block of forge-tokens.css`
      ).toBe(true);
    });
  }
});

// ─── Check 5: dark-mode background hue ───────────────────────────────────────

describe("forge-tokens.css — dark-mode background token (check 5)", () => {
  it("dark-mode --background hue starts with 224", () => {
    const pattern = /--background\s*:\s*224\b/;
    expect(
      pattern.test(css),
      'Expected dark-mode "--background: 224 ..." in forge-tokens.css'
    ).toBe(true);
  });
});

// ─── Check 7: typography font stacks ─────────────────────────────────────────

describe("forge-tokens.css — typography font variables (check 7)", () => {
  it('--app-font-sans contains "DM Sans"', () => {
    const pattern = /--app-font-sans\s*:[^;]*DM Sans/;
    expect(
      pattern.test(css),
      'Expected --app-font-sans to reference "DM Sans" in forge-tokens.css'
    ).toBe(true);
  });

  it('--app-font-display contains "Alfa Slab One"', () => {
    const pattern = /--app-font-display\s*:[^;]*Alfa Slab One/;
    expect(
      pattern.test(css),
      'Expected --app-font-display to reference "Alfa Slab One" in forge-tokens.css'
    ).toBe(true);
  });

  it('--app-font-mono contains "JetBrains Mono"', () => {
    const pattern = /--app-font-mono\s*:[^;]*JetBrains Mono/;
    expect(
      pattern.test(css),
      'Expected --app-font-mono to reference "JetBrains Mono" in forge-tokens.css'
    ).toBe(true);
  });
});

// ─── Check 8: Tailwind theme bridge references ───────────────────────────────

describe("forge-tokens.css — Tailwind theme bridge references (check 8)", () => {
  it("references only variables defined in an earlier :root block", () => {
    const themeMatch = /@theme\s+inline\s*\{([\s\S]*?)\}/.exec(css);
    expect(themeMatch, "Expected an @theme inline block in forge-tokens.css").not.toBeNull();

    if (!themeMatch) return;

    const rootDefinitions = new Set<string>();
    const rootBlockPattern = /:root\s*\{([\s\S]*?)\}/g;

    for (const rootMatch of css.matchAll(rootBlockPattern)) {
      if (rootMatch.index >= themeMatch.index) continue;

      for (const definitionMatch of rootMatch[1].matchAll(/^\s*(--[\w-]+)\s*:/gm)) {
        rootDefinitions.add(definitionMatch[1]);
      }
    }

    const referencedVariables = [...themeMatch[1].matchAll(/var\(\s*(--[\w-]+)\s*\)/g)].map(
      (match) => match[1]
    );
    const missingVariables = [...new Set(referencedVariables)].filter(
      (variable) => !rootDefinitions.has(variable)
    );

    expect(
      missingVariables,
      "Every var(--token) in @theme inline must be defined in an earlier :root block"
    ).toEqual([]);
  });
});

// ─── Check 9: public Tailwind utility bridge entries ──────────────────────────

describe("forge-tokens.css — public Tailwind theme bridge entries (check 9)", () => {
  const EXPECTED_BRIDGE_ENTRIES = {
    colors: {
      "--color-background": "hsl(var(--background))",
      "--color-foreground": "hsl(var(--foreground))",
      "--color-border": "hsl(var(--border))",
      "--color-input": "hsl(var(--input))",
      "--color-ring": "hsl(var(--ring))",
      "--color-card": "hsl(var(--card))",
      "--color-card-foreground": "hsl(var(--card-foreground))",
      "--color-card-border": "hsl(var(--card-border))",
      "--color-popover": "hsl(var(--popover))",
      "--color-popover-foreground": "hsl(var(--popover-foreground))",
      "--color-popover-border": "hsl(var(--popover-border))",
      "--color-primary": "hsl(var(--primary))",
      "--color-primary-foreground": "hsl(var(--primary-foreground))",
      "--color-primary-border": "var(--primary-border)",
      "--color-secondary": "hsl(var(--secondary))",
      "--color-secondary-foreground": "hsl(var(--secondary-foreground))",
      "--color-secondary-border": "var(--secondary-border)",
      "--color-muted": "hsl(var(--muted))",
      "--color-muted-foreground": "hsl(var(--muted-foreground))",
      "--color-muted-border": "var(--muted-border)",
      "--color-accent": "hsl(var(--accent))",
      "--color-accent-foreground": "hsl(var(--accent-foreground))",
      "--color-accent-border": "var(--accent-border)",
      "--color-destructive": "hsl(var(--destructive))",
      "--color-destructive-foreground": "hsl(var(--destructive-foreground))",
      "--color-destructive-border": "var(--destructive-border)",
      "--color-chart-1": "hsl(var(--chart-1))",
      "--color-chart-2": "hsl(var(--chart-2))",
      "--color-chart-3": "hsl(var(--chart-3))",
      "--color-chart-4": "hsl(var(--chart-4))",
      "--color-chart-5": "hsl(var(--chart-5))",
      "--color-sidebar": "hsl(var(--sidebar))",
      "--color-sidebar-foreground": "hsl(var(--sidebar-foreground))",
      "--color-sidebar-border": "hsl(var(--sidebar-border))",
      "--color-sidebar-primary": "hsl(var(--sidebar-primary))",
      "--color-sidebar-primary-foreground": "hsl(var(--sidebar-primary-foreground))",
      "--color-sidebar-primary-border": "var(--sidebar-primary-border)",
      "--color-sidebar-accent": "hsl(var(--sidebar-accent))",
      "--color-sidebar-accent-foreground": "hsl(var(--sidebar-accent-foreground))",
      "--color-sidebar-accent-border": "var(--sidebar-accent-border)",
      "--color-sidebar-ring": "hsl(var(--sidebar-ring))",
    },
    fonts: {
      "--font-sans": "var(--app-font-sans)",
      "--font-display": "var(--app-font-display)",
      "--font-serif": "var(--app-font-serif)",
      "--font-mono": "var(--app-font-mono)",
    },
    radii: {
      "--radius-sm": "calc(var(--radius) - 4px)",
      "--radius-md": "calc(var(--radius) - 2px)",
      "--radius-lg": "var(--radius)",
      "--radius-xl": "calc(var(--radius) + 4px)",
    },
  } as const;

  it("keeps every public color, font, and radius utility available", () => {
    const themeMatch = /@theme\s+inline\s*\{([\s\S]*?)\}/.exec(css);
    expect(themeMatch, "Expected an @theme inline block in forge-tokens.css").not.toBeNull();

    if (!themeMatch) return;

    const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const missingEntries = Object.values(EXPECTED_BRIDGE_ENTRIES)
      .flatMap((entries) => Object.entries(entries))
      .filter(([name, value]) => {
        const pattern = new RegExp(
          String.raw`^\s*${escapeRegExp(name)}\s*:\s*${escapeRegExp(value)}\s*;`,
          "m"
        );
        return !pattern.test(themeMatch[1]);
      })
      .map(([name]) => name);

    expect(
      missingEntries,
      `Missing Tailwind bridge utilities: ${missingEntries.join(", ")}`
    ).toEqual([]);
  });
});
