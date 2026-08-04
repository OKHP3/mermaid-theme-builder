# Changelog

All notable changes to **Mermaid Theme Builder** are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versions follow [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

---

## [0.6.0] — 2026-08-04

Phase 2 P0 capability fixes, plus documentation truth sync across all public surfaces.

### Added
- **Extract tab restored** — dedicated Extract nav tab re-registered in `AppTab`, `TAB_CONFIG`, and the hash router. `#extract` URL resolves to the tab. The embedded Extract shortcut in Compose is retained for Compose-flow users.
- **Renderer-aware output format toggle** — `%%{init}%%` / YAML frontmatter two-button pill in the Apply tab ExportToolbar. Defaults to the renderer-recommended format (`getRendererDefaultOutputFormat` in `renderer-parity.ts`): frontmatter for mermaid.live, GitHub, Obsidian; `%%{init}%%` for all others. User preference persisted to localStorage.
- **Stroke/border width control** — "Node border width" button group (Default / 1 px / 2 px / 3 px / 4 px) in the Compose tab Look section, matching the existing font-size stepper pattern. Wired through `buildClassDefLibrary` / `buildClassDefString` in `theme-engine.ts` as a global classDef `stroke-width` override.
- **YAML frontmatter generation** — `buildFrontmatter()` extended to accept `family`, `look`, `fontSize`, and `typography`, applying the same overlay logic as `buildInitDirective`. `generateThemedCode()` now respects `options.outputFormat`.

### Changed
- **Renderer parity matrix** — README and Reference tab now correctly show 8 renderers; m365-loop / Microsoft 365 / Loop row added to the README summary table.
- **Skills catalog** — regenerated to include all 10 skills: `okhp3-mermaid-governance` v1.1.0 and `okhp3-skill-promotion` v0.1.0 added to the README catalog block.
- **README** — family count updated from "27+" to "31 (18 native, 13 partial/beta) + 10 documented gaps"; Exports section rewritten to document all 8 Download formats; Tabs table updated to include Extract.
- **package.json** — version bumped to 0.6.0.

### Removed
- **Neutral Enterprise palette** — references removed from planning documents. The palette was never implemented in code; no user-facing change.

### Version tag evaluation — v1.0.0 gate check

| Gate | Status | Evidence |
|------|--------|---------|
| Extract tab accessible | Pass | `AppTab` includes "extract"; `TAB_CONFIG` entry present; `#extract` resolves |
| Renderer-aware format generation | Pass | `getRendererDefaultOutputFormat` in `renderer-parity.ts`; `outputFormat` wired through App to ExportToolbar |
| Stroke/border width control | Pass | Button group in Compose Look section; `buildClassDefLibrary` accepts `strokeWidth` |
| All tests pass | Pass | 2585 unit tests; typecheck clean |
| Privacy-respecting analytics | Fail | Not yet implemented — v1.0.0 gate per roadmap |
| WCAG 2.1 AA accessibility audit | Fail | axe-core audit not yet run — v1.0.0 gate per roadmap |
| GitHub release cadence established | Pass | This release; version policy added to `AGENTS.md` |

**Verdict: v0.6.0.** v1.0.0 requires analytics and a completed accessibility audit. Both remain open.

---

## [0.5.0] — 2026-05-12

### Added
- **OKH Forge UI System v0.1.0** — `src/index.css` restructured into 8 labeled sections (raw palette tokens, Tailwind bridge, semantic light/dark tokens, base layer, forge utility classes, elevation helpers, print). New canonical design tokens: `--okh-forge-*`, `--forge-header-*`, `--forge-footer-*`, `--forge-mobile-nav-*`. New utility classes: `.forge-shell`, `.forge-footer`, `.forge-mobile-nav`, `.forge-card`, `.forge-tabs`, `.forge-tab`, `.forge-tab-active`
- **`docs/design-system.md`** — OKH Forge UI System reference document
- **Pan and zoom on all diagram previews** — drag-to-pan, scroll-wheel zoom (10%–800%), touch pinch-to-zoom, double-click reset. Floating control toolbar with zoom-out, percentage readout, zoom-in, and reset buttons. Applies to Apply, Compose, and Examples tabs

### Changed
- `src/App.tsx` structural elements migrated to Forge utility classes (`.forge-shell`, `.forge-mobile-nav`, `.forge-footer`)

### Fixed
- GitHub Pages CI/CD pipeline now deploys correctly — removed conflicting `version: 10` from `pnpm/action-setup@v6` workflow steps; action now reads version from `"packageManager"` in `package.json`
- Build command corrected from `pnpm --filter @workspace/mermaid-theme-builder run build` to `pnpm run build` (pnpm v10 filter fails on root packages)
- Upgraded GH Actions: `actions/checkout@v6`, `actions/setup-node@v6`, `actions/upload-pages-artifact@v5`, `actions/deploy-pages@v5`, `actions/configure-pages@v6`

### Security
- Upgraded `@types/node` to `^25.6.0`
- Upgraded `tailwindcss` to `^4.2.4`

---

## [0.4.0] — 2026-05-05

### Added
- **Reference tab** — `ReferenceTab.tsx` hosting `DiagramInventory` and `ClassBrowser` as a standalone tab
- **URL routing** — tab state encoded in URL hash for deep-linking
- **`DiagramInventory`** — filterable/searchable diagram capability registry with All / Native / Beta+Partial / Experimental / Gaps filter tabs; search across name, ID, description, best-used-for
- **`ClassBrowser`** — collapsible CSS class reference panel
- **`MermaidReferral`** component — attribution and link-back to Mermaid.ai

### Changed
- Version bumped to 0.5.0 in package.json (reflecting rapid iteration across 0.2–0.5 milestones)

---

## [0.3.0] — 2026-05-05

### Added
- **App icon** — custom "Forked Flow" SVG icon (`src/components/AppIcon.tsx`). Dark navy background, cream input node, rust-orange fork connectors, orange themed output node. PNG rasters generated via `scripts/generate-icons.mjs`
- **Touch compatibility** — improved touch event handling for mobile preview interactions
- **Corrected OKHP3 palette colors** — accurate hex values for OverKill Hill, AskJamie, and Glee-fully palettes

### Fixed
- Requirements diagram rendering error
- Sequence, requirement, and fishbone diagram render errors
- Comma parsing errors in requirement diagrams

---

## [0.2.0] — 2026-04-25

### Added
- **Diagram Capability Registry** — `src/data/mermaid-capabilities.ts` tracking 27 Mermaid families with Support Status, Theme Confidence, Notation Compliance, style strategy, description, best-used-for, warning, and example reference
- **10 capability gap entries** — BPMN 2.0, ArchiMate, SysML, VSM, Service Blueprint, OKR Alignment, DFD, Decision Tree, Org Chart, Threat Model DFD (honest "not supported" tracking)
- **ZenUML and Radar** added to detection engine and capability registry
- **OverKill Mermaid Example Pack** — 26-entry example metadata registry with inlined `.mmd` content
- **Examples tab** (`ExamplesTab.tsx`) — browse brand-matched examples per palette
- **`CapabilityNote`** component — inline blue info note for non-full-support diagram families
- **`WarningBanner`** component — yellow warning for init directive conflicts, non-printable chars, long labels
- **localStorage persistence** — palette edits survive browser reload
- **URL-encoded palette sharing** — hash-fragment encoding of current palette state
- **Import/export palette** as JSON file; export all palettes as bundle; export as CSS custom properties
- **Dark/light/system mode toggle** — independent of diagram theme
- **Keyboard shortcut** `Ctrl+Shift+C` → copy Styled Code
- **Diagram family override** — manual selector when auto-detect fires wrong
- **Reset individual color swatch** without resetting entire palette
- **Download as `.md`** (Markdown Bootstrap) and **`.txt`** (Prompt Scaffold) files
- **Compose tab** (`ComposeTab.tsx`) — build and edit custom palettes with live preview
- **`DiffView`** component — three-mode preview: Original / Themed / Diff
- **Multi-diagram splitting** (`diagramSplit.ts`) — handles multi-block pastes
- **Extract mode** — pull theme from existing `%%{init}%%` directive in pasted Mermaid code
- **Family-specific theming overlays** (`familyTheming.ts`) — per-family themeVariable corrections for sequence, ER, and other families
- **Prompt Scaffold v2** — classDefs, YAML frontmatter, repair templates (`docs/copilot-prompt-kit.md`)
- **Documentation suite** — `AGENTS.md`, `docs/product-brief.md`, `docs/brand-presets.md`, `docs/attribution.md`, `docs/legal.md`, `docs/mermaid-capability-registry.md`, `docs/mermaid-theming-reference.md`, `docs/release-checklist.md`, `docs/theme-metadata.md`, `docs/deployment.md`, `standards/`
- **`MERMAID_VERSION_VERIFIED`** governance constant in `mermaid-capabilities.ts`
- **Ko-fi funding** link (`.github/FUNDING.yml`)
- **`robots.txt`**, **`sitemap.xml`**, **`opengraph.jpg`**, **PWA manifest** (`manifest.webmanifest`), **service worker** (`sw.js`)

### Fixed
- Removed employer/BFS hex values and brand references across all source and documentation

---

## [0.1.0] — 2026-04-23

### Added
- Initial static React + Vite + Tailwind CSS v4 application
- Core pipeline: paste Mermaid code → auto-detect diagram family → apply palette → preview → export
- 15 diagram family auto-detection (`src/lib/detector.ts`)
- 7 built-in palettes: OverKill Hill P³, AskJamie, Glee-fully, Ocean Depth, Forest Sage, Slate Ember, Violet Mist
- Live side-by-side preview (Original / Themed tabs) via `MermaidPreview.tsx`
- Three export formats: Styled Code (copy), Markdown Bootstrap, Prompt Scaffold
- Two-way live color editor (`ColorSwatch.tsx`)
- Attribution system — metadata comments in all exports; optional badge node for flowchart diagrams
- Custom theme naming
- Palette schema with brand metadata (`src/lib/palettes.ts`)
- `src/lib/themeEngine.ts` — palette → `%%{init}%%` directive generation
- MIT license, README, `docs/product-brief.md`
- GitHub Pages deployment via CI (`deploy-pages.yml`, `ci.yml`)

---

[Unreleased]: https://github.com/OKHP3/mermaid-theme-builder/compare/v0.6.0...HEAD
[0.6.0]: https://github.com/OKHP3/mermaid-theme-builder/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/OKHP3/mermaid-theme-builder/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/OKHP3/mermaid-theme-builder/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/OKHP3/mermaid-theme-builder/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/OKHP3/mermaid-theme-builder/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/OKHP3/mermaid-theme-builder/releases/tag/v0.1.0
