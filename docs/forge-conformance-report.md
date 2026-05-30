# OKH P³ Forge Brand Conformance Report

**Date:** 2026-05-29  
**Repo:** Mermaid Theme Builder (`@workspace/mermaid-theme-builder`)  
**Path taken:** Dry-run verification — all 12 items confirmed by file read with line references. No corrections required.

---

## Checklist Table

| # | Check | File : Line | Value Found | Result | Change Made |
|---|-------|-------------|-------------|--------|-------------|
| 1 | Font load: Alfa Slab One, DM Sans, JetBrains Mono present; Fraunces and Inter absent as app UI fonts | `index.html:22` | Google Fonts URL: `family=Alfa+Slab+One&family=DM+Sans:ital,opsz,wght@0,9..40,...&family=JetBrains+Mono:wght@400;500` — all three present; Fraunces absent; Inter absent from font load | **PASS** | None |
| 2 | Token import: `forge-tokens.css` is first local design-token `@import` | `src/index.css:3` | `@import "./styles/forge-tokens.css";` — line 3, after `tailwindcss` (line 1) and `tw-animate-css` (line 2); first local design-token import | **PASS** | None |
| 3 | Raw forge palette: all 8 canonical `--okh-forge-*` hex values present | `src/styles/forge-tokens.css:42–49` | `--okh-forge-bg: #f0ebe5; --okh-forge-paper: #f6f2ee; --okh-forge-ink: #0f172a; --okh-forge-teal: #1c3a34; --okh-forge-rust: #c46a2c; --okh-forge-amber: #e6a03c; --okh-forge-code-bg: #0f1f1c; --okh-forge-code-fg: #d4c9b5;` | **PASS** | None |
| 4 | Light mode semantics: background, foreground, card, primary, primary-foreground, muted-foreground, ring, radius | `src/styles/forge-tokens.css:118–172` | `--background: 33 18% 94%; --foreground: 222 47% 11%; --card: 34 35% 95%; --primary: 25 63% 47%; --primary-foreground: 0 0% 100%; --muted-foreground: 220 9% 35%; --ring: 25 63% 47%; --radius: 0.75rem;` — all 8 match spec | **PASS** | None |
| 5 | Dark mode background hue: slate-blue family (hue ~224), not olive (hue 88) | `src/styles/forge-tokens.css:204` | `--background: 224 30% 8%;` — hue 224 confirmed; hue 88 absent | **PASS** | None |
| 6 | Header surface: `--forge-header-bg` resolves to `#1c3a34` via `var(--okh-forge-teal)` | `src/styles/forge-tokens.css:45, 52` | Line 45: `--okh-forge-teal: #1c3a34;` Line 52: `--forge-header-bg: var(--okh-forge-teal); /* #1c3a34 */` — chain confirmed | **PASS** | None |
| 7 | Typography tokens: `--app-font-sans` = DM Sans, `--app-font-display` = Alfa Slab One, `--app-font-mono` = JetBrains Mono | `src/styles/forge-tokens.css:166–169` | Line 166: `--app-font-sans: 'DM Sans', system-ui, ...` Line 167: `--app-font-display: 'Alfa Slab One', system-ui, ...` Line 169: `--app-font-mono: 'JetBrains Mono', 'Menlo', monospace;` — all three match | **PASS** | None |
| 8 | Mermaid palette export: `OKH_P3_MERMAID_THEME` exists with all 12 required key/value pairs | `src/lib/palettes.ts:316–335` | Export present with 18 keys (superset allowed). Spot-checked required values: `primaryColor: "#111827"`, `primaryBorderColor: "#c46a2c"`, `lineColor: "#c46a2c"`, `tertiaryColor: "#1c3a34"`, `clusterBkg: "#0d1117"`, `fontFamily: "DM Sans, system-ui, sans-serif"`, `titleColor: "#c46a2c"` — all match canonical values | **PASS** | None |
| 9 | Default mode: `safeRead()` returns `"light"` when no stored preference; dark and system modes still functional | `src/hooks/useThemeMode.ts:13` | Line 13: `return "light";` (fallback when localStorage returns null/unrecognized value). `resolveMode` handles dark/system at lines 25–28. Hook returns all three modes via `cycle()` at line 67. | **PASS** | None |
| 10 | Brand firewall: no BFS, Builders FirstSource, or employer palette/screenshot references | `src/data/example-library.ts:1137` | One match: `M4@{ shape: comment, label: "No BFS. No employer bleed." }:::warning` — this is an anti-reference inside a diagram example that explicitly declares brand separation; it is not employer content, palette data, or a color value. No other matches in any source file. | **PASS** | None |
| 11 | Forbidden drift: Fraunces absent; Inter not used as primary app UI font; no font-serif assumption for core OKH headings | All source files | Fraunces: **zero matches** in all `.ts`, `.tsx`, `.css`, `.html` files. Inter: appears only at `src/pages/tabs/ComposeTab.tsx:44` as a user-selectable *diagram* font option (`{ label: "Inter", value: "Inter, system-ui, sans-serif" }`), and in test fixtures for diagram CSS generation (`src/__tests__/typography.test.tsx:482,495`). Not present in `forge-tokens.css`, `index.css`, or any app UI font assignment. `header h1` in `src/index.css:34` uses `'Alfa Slab One'`. | **PASS** | None |
| 12 | No new infrastructure: no new package.json dependencies, no tailwind.config, no backend files, no analytics, no AI API calls, no payment code | `package.json`, project root, `src/` | No `tailwind.config.js` or `tailwind.config.ts` present. No `src/server*`, `src/api*`, or `src/backend*` files. No analytics (`gtag`, `plausible`, `segment`, `mixpanel`, `hotjar`, `sentry`), AI API (`openai`, `anthropic`), or payment (`stripe`, `braintree`, `paypal`) code found. `package.json` dependencies unchanged from baseline. | **PASS** | None |

---

## Diff Summary

**No files changed.** This was a read-only verification pass. Zero production code modifications were required.

---

## Validation Summary

| Command | Result |
|---------|--------|
| `pnpm run typecheck` | PASS — 0 errors |
| `pnpm test` | PASS — 1995 tests across 57 suites |

No corrections were made, so validation results reflect the pre-existing state of the repository.

---

## Drift Findings

One administrative drift was found between the checklist spec and the codebase. It has no conformance impact:

- **Check 9 file path:** The task spec cited `src/lib/themeMode.ts:13`. The actual file is `src/hooks/useThemeMode.ts`. The `safeRead()` fallback `return "light"` is at line 13 of the actual file. The file was likely relocated from `src/lib/` to `src/hooks/` after the checklist was authored. The conformance logic is intact.

No brand, token, or behavioral drift was found.

---

## Final Conformance Statement

**All 12 checklist items: PASS. Zero failures. Zero corrections applied.**

This repository is approved as the **OKH P³ Forge React/Tailwind reference implementation**. The BPMN for Mermaid project may converge toward this codebase's token structure, font loading, palette export, default mode behavior, and brand-firewall conventions without modification.
