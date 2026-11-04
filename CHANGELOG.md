## [Unreleased]

---

## [0.11.1] - 2026-11-04

### Fixed
- Keep arrow, Home, and End keys on theme-management buttons from changing the selected theme. Preserve modified keyboard shortcuts and normal theme-radio navigation.
- Restore lost keyboard focus after confirmed theme deletion without interrupting a user who has moved to another control.
- Add regression checks for keyboard selection, delayed deletion, canceled deletion, focus ownership, and preserved theme and diagram data.

Increment 5 is a bounded keyboard-safety repair. Theme storage, export contracts,
the Forge design, and all dependency pins are unchanged.

---

## [0.11.0] - 2026-11-04

### Changed
- Pin Mermaid to stable 12.3.0 after compatibility review, retaining Classic/Dagre defaults and all existing theme data and export contracts.
- Support vendor flowchart step animation and BPMN element shapes without claiming formal BPMN support or adding a new diagram family.
- Resolve ELK to 0.12.1 and remove Mermaid's unused uuid dependency. DOMPurify remains at the already-patched 3.4.17 resolution.
- Add rendering checks for adjacent edge IDs, BPMN shapes, ordered steps, reduced motion, and nested ELK graphs alongside existing preservation tests.

---

## [0.10.1] - 2026-11-04

### Fixed
- Scope offline caches to this application, preserving sibling applications and ambiguous legacy caches.
- Fetch current page content online, cache only validated production pages and hashed assets, and avoid freezing development modules.
- Verify a warmed offline reload and return online without changing saved themes or diagram source.
- Restore the editor when mobile Theme focus is selected during comparison, and remove an inactive gallery control reference.
- Use shared spacing tokens for the gallery without changing its default dimensions.

---

## [0.10.0] - 2026-11-04

### Added
- Compare one theme across Flowchart, Sequence, and ER samples on demand, with family and destination guidance.
- Prepare the next diagram paste without clearing existing source or changing the selected theme.

### Fixed
- Use the selected sample's actual family and the complete theme's output format in Compose previews.
- Serialize Mermaid preview initialization, rendering, and style cleanup; skip obsolete queued renders.
- Keep the comparison preview usable on compact screens and preserve the full catalog selection when closing it.

---

## [0.9.0] - 2026-11-04

### Added
- Complete local themes with isolated appearance, typography, destination, export, and provenance settings.
- Explicit save and copy actions, recoverable drafts, searchable collections, reviewed imports, complete share links, and saved-library backup and restore.
- Additive legacy recovery, verified browser writes, cross-tab conflict protection, and separately labeled workspace recovery downloads.

### Changed
- Remove the three-theme limit while preserving existing diagram, preview, export, and legacy import workflows.
- Export complete theme JSON from Apply and Compose. Keep the color-only legacy export separately labeled.

Increment 2 was approved by the owner for gated merge and release on 2026-11-04.

---

## [0.8.0] - 2026-11-03

### Changed
- Introduce a theme-first workspace with named-theme actions, a larger diagram area, focused mobile views, and preserved routes and storage contracts.
- Replace misleading rendering choices and universal readiness wording with destination-aware guidance. Keep valid saved preview samples; use a compact starter for new sessions.

### Fixed
- Keep the desktop diagram preview usable when a saved export-code panel is open.
- Associate the theme-name field with its label and keep the Save theme dialog keyboard-contained with focus return.
- Migrate pnpm's build policy to its current allow/deny map, explicitly deny dependency-driven Git hook setup, and verify repeat frozen installations in CI.

---

## [0.7.0] - 2026-11-02

### Changed
- Pin Mermaid 12.2.0 and stable workspace dependencies, with a daily exact-pin update proposal workflow and capability-review gate.
- Migrate to native pnpm 12.16.1, test CI on Node 26 LTS and Python 3.15, and retain Replit's supported Node 24 host until its system-library migration is verified.
- Patch source-map-js, PostCSS selector parsing, and Vitest mocker advisories without bypassing the release-age policy.
- Keep visible control text in accessible names and support Replit's native npm wrapper with the pinned package-manager launcher.
- Let Vite optimize Mermaid's nested CommonJS dependencies and verify all nine compatibility cases through both production and development servers.
- Repair the Mermaid 12 lockfile, pair it with ZenUML 1.0.1, and retain the existing sanitizer and release-age security controls.
- Pin Classic and Dagre in preview initialization and both export formats rather than inherit changed renderer defaults.
- Recognize the new use case beta family with limited-support guidance. Its bundled example and broader styling validation remain pending.
- Add positive browser-render checks for the changed layout families and ZenUML.
- Require the Mermaid 12 browser floor: ES2024 and Safari 17.4 or newer. Node 24 remains the project runtime.
- This compatibility release does not mark the broader Governance Profiles roadmap or v1.0 gates complete.

---

## [0.6.4] - 2026-10-26

### Fixed
- Recover invalid saved output formats with the selected renderer's recommendation and clear stale override flags. Keep explicit valid choices and hide redundant reset actions.
- Select the pinned pnpm through Node 24's bundled Corepack in CI and Pages, caching its verified download to avoid repeated registry outages and the stalled action self-installer.
- Run the dependency-free link and source-reference checks without installing the workspace, so package-manager setup cannot exhaust their five-minute job limit.
- Keep overlay controls, customized palette labels, and expanded reference content readable in both themes. Make the export preview keyboard-scrollable and separate the Compose color reset from its section toggle.

### Added
- Verify direct mobile tab bookmarks and saved-format recovery with regression tests.
- Scan menus, dialogs, persisted profiles, customized states, and the mobile expanded editor for Critical and Serious WCAG findings.

---

## [0.6.3] - 2026-09-20

### Fixed
- Patch the dependency-level DOMPurify, selector parser, and Vitest advisories; use official core renderer entry points and document the remaining ZenUML embedded-sanitizer review.
- Reconcile supported dependency and Actions updates, including Mermaid 11.17.2 rendering fixes. Keep ZenUML on its compatible pinned release.
- Typecheck the retained preview scaffold in CI and migrate its calendar, chart, and resizable-panel wrappers to their current APIs.
- Restore the missing Apply workspace layout styles and refresh the release screenshot while preserving older release images.

### Changed
- Audit all workspace dependencies, locked packages, runtimes, and GitHub Actions daily; group related Dependabot updates and maintain one review issue for unresolved version changes.
- Use the project's Corepack-selected pnpm in commit and Replit post-merge hooks.
- **Palette schema version is now a single constant** (`PALETTE_TOOL_VERSION` in `src/lib/palettes.ts`). All production files that embed a palette `toolVersion` field now import this constant instead of repeating the string literal, so a palette schema bump is a one-line change. The `check:version-strings` consistency guard continues to catch any drift automatically.
- **Privacy-respecting analytics**: Plausible records one aggregate pageview with only the origin and pathname. Query strings, hash fragments, Mermaid code, palette data, localStorage values, and custom properties are excluded.

### Added
- Technology inventory, source-linked version report, and a GitHub/Replit/Windows synchronization runbook.
- **Plausible pageview script**: the first-party transport sends only the sanitized pageview created by `src/lib/privacy-analytics.ts`, with a null referrer and `no-referrer` request policy.

### Fixed
- Discover source references with Node on Windows and preserve Windows line endings when checking or regenerating the skill catalog.
- Keep simulated component tests independent of external font stylesheet downloads; browser tests retain real rendering coverage.

---

## [0.6.2] - 2026-09-04

### Fixed
- Restore the final newline in family syntax hints data so CI and Pages formatting checks pass.
- Use the full Forge foreground token for the preview zoom counter to meet text contrast requirements.

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
| Privacy-respecting analytics | Pass | Plausible pageview script with sanitized URL; `src/lib/privacy-analytics.ts` tests exclude query strings and hash fragments |
| WCAG 2.1 AA accessibility audit | Pass | `docs/accessibility-audit.md`; axe-core 4.12.1 Playwright audit passes across Apply, Compose, Examples, Reference, and Extract |
| GitHub release cadence established | Pass | This release. Version policy added to `AGENTS.md` |

**Verdict: v0.6.0.** v1.0.0 remains blocked by its other roadmap gates; the WCAG 2.1 AA automated audit gate now passes.

[Unreleased]: https://github.com/OKHP3/mermaid-theme-builder/compare/v0.11.0...HEAD
[0.11.0]: https://github.com/OKHP3/mermaid-theme-builder/compare/v0.10.1...v0.11.0
[0.10.1]: https://github.com/OKHP3/mermaid-theme-builder/compare/v0.10.0...v0.10.1
[0.10.0]: https://github.com/OKHP3/mermaid-theme-builder/compare/v0.9.0...v0.10.0
[0.9.0]: https://github.com/OKHP3/mermaid-theme-builder/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/OKHP3/mermaid-theme-builder/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/OKHP3/mermaid-theme-builder/compare/v0.6.4...v0.7.0
[0.6.4]: https://github.com/OKHP3/mermaid-theme-builder/compare/v0.6.3...v0.6.4
[0.6.3]: https://github.com/OKHP3/mermaid-theme-builder/compare/v0.6.2...v0.6.3
[0.6.2]: https://github.com/OKHP3/mermaid-theme-builder/compare/v0.6.1...v0.6.2
[0.6.1]: https://github.com/OKHP3/mermaid-theme-builder/compare/v0.6.0...v0.6.1
[0.6.0]: https://github.com/OKHP3/mermaid-theme-builder/compare/v0.5.0...v0.6.0
