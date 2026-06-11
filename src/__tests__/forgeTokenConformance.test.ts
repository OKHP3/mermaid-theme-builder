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
    "--primary-foreground": "0 0% 100%",
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
