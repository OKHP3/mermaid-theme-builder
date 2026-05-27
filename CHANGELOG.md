# Changelog

All notable changes to **Mermaid Theme Builder** are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versions follow [Semantic Versioning](https://semver.org/).

---

## [Unreleased] — v0.6.0

Palette authoring, smarter Prompt Scaffold, and Mermaid 11.14–11.15 coverage.

### Planned — Palette
- User palette CRUD — save, rename, delete, and reorder custom palettes (localStorage)
- "Copy share link" button — surface URL-encoded palette sharing in the palette editor UI
- 3–5 additional community palettes (not brand-locked)

### Planned — Export
- Export preview pane — read-only pane showing all three export formats before copy/download
- Family-specific Prompt Scaffold templates — per-family scaffold sections (flowchart, sequence, class, ER)

### Planned — Mermaid 11.14–11.15 Coverage
- Event Modeling example — add `.mmd` for the new 11.15 diagram type; update capability registry
- Look mode per-family warnings — warn in Apply tab when `look: handDrawn` or `look: neo` is unsupported for the detected family
- Renderer compatibility warnings — surface "CSS injection blocked on GitHub" and "classDef unsupported for sequence/Gantt" as contextual export-bar warnings
- Root-level `htmlLabels` — emit at root config level in `%%{init}%%` exports (11.13+ migration: deprecated `flowchart.htmlLabels`)

### Planned — Testing
- Playwright smoke tests — core pipeline: paste → detect → themed preview renders → Styled Code export contains `%%{init}%%`

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

[Unreleased]: https://github.com/OKHP3/mermaid-theme-builder/compare/v0.5.0...HEAD
[0.5.0]: https://github.com/OKHP3/mermaid-theme-builder/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/OKHP3/mermaid-theme-builder/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/OKHP3/mermaid-theme-builder/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/OKHP3/mermaid-theme-builder/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/OKHP3/mermaid-theme-builder/releases/tag/v0.1.0
