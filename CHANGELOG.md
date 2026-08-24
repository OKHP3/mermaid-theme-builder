## [Unreleased]

### Changed
- **Palette schema version is now a single constant** (`PALETTE_TOOL_VERSION` in `src/lib/palettes.ts`). All production files that embed a palette `toolVersion` field now import this constant instead of repeating the string literal, so a palette schema bump is a one-line change. The `check:version-strings` consistency guard continues to catch any drift automatically.

---

 - 2026-08-05

Privacy integrity fix, process governance scaffolding, renderer-aware init-directive length warning, and skills catalog truth sync.

### Removed
- **Google Analytics (GA4)**: measurement ID `G-VJ1BKXS27H` removed from `index.html`; `usePageTracking` hook deleted and all call sites removed from `App.tsx`. The app now makes zero outbound network requests during normal use. This corrects a contradiction between the public "no data collection" claim and the actual runtime behaviour.

### Changed
- **Privacy copy**: README feature list updated to state explicitly that Mermaid code, palette data, and exports stay in the browser and no data is sent to any server.
- **Skills catalog reconciled**: `src/data/skills-catalog.ts` now registers all 10 skills on disk. `okhp3-skill-promotion` v0.1.0 was present in `skills/` and listed in the README auto-catalog but missing from the app's Reference tab source. Added. Stale drift notes removed from `README.md`.

### Added
- **`DECISIONS_NEEDED.md`**: standing process record at repo root. Any future proposal to add analytics must open an entry here and wait for explicit owner sign-off before any tracking code is written. Analytics policy entry included and resolved.
- **Renderer-aware init-directive length warning**: `src/lib/init-directive-length.ts` new utility; `initDirectiveSafeLength` field added to all 8 renderer profiles (GitHub/GitLab: 500 chars field-observed; mermaid.live/Obsidian/CLI: unlimited; Notion/Confluence/M365: unverified). Advisory wired into `exportAdvisories` in `ApplyTab.tsx`; fires when directive exceeds renderer ceiling. 28 unit tests added.

---

## [0.6.0] - 2026-08-04

Phase 2 P0 capability fixes, plus documentation truth sync across all public surfaces.

### Added
- **Extract tab restored**: dedicated Extract nav tab re-registered in `AppTab`, `TAB_CONFIG`, and the hash router. `#extract` URL resolves to the tab. The embedded Extract shortcut in Compose is retained for Compose-flow users.
- **Renderer-aware output format toggle**: `%%{init}%%` / YAML frontmatter two-button pill in the Apply tab ExportToolbar. Defaults to the renderer-recommended format (`getRendererDefaultOutputFormat` in `renderer-parity.ts`): frontmatter for mermaid.live, GitHub, Obsidian; `%%{init}%%` for all others. User preference persisted to localStorage.
- **Stroke/border width control**: "Node border width" button group (Default / 1 px / 2 px / 3 px / 4 px) in the Compose tab Look section, matching the existing font-size stepper pattern. Wired through `buildClassDefLibrary` / `buildClassDefString` in `theme-engine.ts` as a global classDef `stroke-width` override.
- **YAML frontmatter generation**: `buildFrontmatter()` extended to accept `family`, `look`, `fontSize`, and `typography`, applying the same overlay logic as `buildInitDirective`. `generateThemedCode()` now respects `options.outputFormat`.

### Changed
- **Renderer parity matrix**: README and Reference tab now correctly show 8 renderers; m365-loop / Microsoft 365 / Loop row added to the README summary table.
- **Skills catalog (README)**: auto-generated README catalog block regenerated to 10 skills; `okhp3-mermaid-governance` v1.1.0 and `okhp3-skill-promotion` v0.1.0 now appear in the README table. Note: registration of `okhp3-skill-promotion` in `src/data/skills-catalog.ts` (app Reference tab) was completed in v0.6.1.
- **README**: family count updated from "27+" to "31 (18 native, 13 partial/beta) + 10 documented gaps"; Exports section rewritten to document all 8 Download formats; Tabs table updated to include Extract.
- **package.json**: version bumped to 0.6.0.

### Removed
- **Neutral Enterprise palette**: references removed from planning documents. The palette was never implemented in code. No user-facing change.

### Version tag evaluation - v1.0.0 gate check

| Gate | Status | Evidence |
|------|--------|---------|
| Extract tab accessible | Pass | `AppTab` includes "extract"; `TAB_CONFIG` entry present; `#extract` resolves |
| Renderer-aware format generation | Pass | `getRendererDefaultOutputFormat` in `renderer-parity.ts`; `outputFormat` wired through App to ExportToolbar |
| Stroke/border width control | Pass | Button group in Compose Look section; `buildClassDefLibrary` accepts `strokeWidth` |
| All tests pass | Pass | 2585 unit tests; typecheck clean |
| Privacy-respecting analytics | Fail | Not yet implemented. v1.0.0 gate per roadmap |
| WCAG 2.1 AA accessibility audit | Pass | `docs/accessibility-audit.md`; axe-core 4.12.1 Playwright audit passes across Apply, Compose, Examples, Reference, and Extract |
| GitHub release cadence established | Pass | This release. Version policy added to `AGENTS.md` |

**Verdict: v0.6.0.** v1.0.0 remains blocked by its other roadmap gates; the WCAG 2.1 AA automated audit gate now passes.

[Unreleased]: https://github.com/OKHP3/mermaid-theme-builder/compare/v0.6.1...HEAD
[0.6.1]: https://github.com/OKHP3/mermaid-theme-builder/compare/v0.6.0...v0.6.1
[0.6.0]: https://github.com/OKHP3/mermaid-theme-builder/compare/v0.5.0...v0.6.0
