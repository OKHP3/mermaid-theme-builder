# Mermaid Theme Builder — v0.5–v0.7 Release Plan

**Project:** Mermaid Theme Builder
**Author:** OverKill Hill P³
**Created:** 2026-05-23
**Status:** Planning document — do not implement speculatively
**Live app:** https://okhp3.github.io/mermaid-theme-builder
**Project page:** https://overkillhill.com/projects/mermaid-theme-builder/

---

## Current State Snapshot (as of v0.5.0)

| Property | Value |
|---|---|
| App version | 0.5.0 |
| Mermaid version | 11.15.0 |
| Architecture | Pure static React + Vite + Tailwind CSS v4 — no backend |
| Tabs | Apply, Compose, Extract, Examples, Reference |
| Palettes | 7 (3 OKHP3 brand + 4 utility) |
| Diagram families tracked | 27 native + 10 capability gaps |
| Tests | 20 test files, ~659 unit/component tests (Vitest) |
| E2E tests | None (Playwright not yet set up) |
| Deployment | GitHub Pages via CI/CD (pnpm/action-setup@v6) |
| SKILL.md version | 0.5.0 (Agent Skills flat format, look API documented) |

**Active open technical debt:**
TD-01 (no Playwright), TD-03 (5 Dependabot PRs), TD-06 (ApplyTab.tsx 1017 lines),
TD-07 (SESSION_SECRET unused), TD-09 (PWA not validated), TD-10 (share link hidden),
TD-11 (capabilities.ts 887 lines, untested), TD-18 (typography model too global),
TD-19 (htmlLabels/deterministicIds missing), TD-20 (README lags v0.5), TD-21 (capability knobs undocumented)

---

## Release Band v0.5.x — Stabilization and Truth Alignment

**Theme:** Close the gap between what is shipped and what is documented, tested, and safe.
**Target: ~25 tasks. No new major features. Fix, harden, align.**

---

### V05-01 — README feature list update (TD-20)

**Description:** Rewrite `README.md` feature list to reflect actual v0.5.0 scope. Currently describes v0.3 capability levels.
**Rationale:** README is the first thing contributors and users see. Understating the product's scope (v0.3 language at v0.5) misleads visitors and potential users.
**Acceptance criteria:**
- Feature list accurately names: 27 diagram families, Forge UI system, pan/zoom, look API, renderer parity matrix, ClassBrowser, example library, skill package
- No mention of features that are not yet shipped
- Version badge in README shows 0.5.0

**Files:** `README.md`
**Risk:** Low
**Dependencies:** None
**Verification:** Manual review; no broken links

---

### V05-02 — CHANGELOG.md reconciliation pass

**Description:** Review `CHANGELOG.md` against merged task history from the v0.5.x agent sprint. Ensure all merged tasks (#107, #108, #112, #115, #116–#128) have entries.
**Rationale:** Changelog is the authoritative narrative of what changed. Missing entries break the version history.
**Acceptance criteria:**
- All agent-merged tasks from v0.5.x sprint appear in the `[0.5.x]` section
- Each entry names: what changed, why it matters, any BC implications

**Files:** `CHANGELOG.md`
**Risk:** Low
**Dependencies:** V05-01
**Verification:** Cross-check task list in GitHub against CHANGELOG entries

---

### V05-03 — Technical debt register cleanup pass

**Description:** Review all open TD items in `docs/technical-debt-register.md`. Resolve newly-closed items (TD-17 resolved, SKILL.md items resolved), add any new debt surfaced during v0.5.x sprint.
**Rationale:** The register is used by agents and maintainers to avoid re-creating known issues. Stale open entries cause unnecessary rework.
**Acceptance criteria:**
- All items resolved during v0.5.x sprint are marked `Resolved YYYY-MM-DD` with strikethrough
- No more than 12 open items remain after cleanup
- Any new debt discovered during sprint is added with a TD-XX ID

**Files:** `docs/technical-debt-register.md`
**Risk:** Low
**Dependencies:** V05-01, V05-02
**Verification:** Item-by-item review against current codebase state

---

### V05-04 — Dead link audit across all docs

**Description:** Scan all Markdown files in `docs/`, `README.md`, `AGENTS.md`, and `skills/` for broken links (internal and external). Fix or remove them.
**Rationale:** Dead links in the skill package and docs reduce trust and break agent workflows that follow reference links.
**Acceptance criteria:**
- All internal file links resolve to real files
- External links validated (okhp3.github.io, mermaid.js.org, github.com/OKHP3)
- No unresolved stub text in reference files

**Files:** All `.md` files; `skills/okhp3-mermaid-theme-builder/references/*.md`
**Risk:** Low
**Dependencies:** None
**Verification:** Internal link grep returns clean; manual link check

---

### V05-05 — Release checklist alignment with v0.5.0 features

**Description:** Update `docs/release-checklist.md` to cover v0.5.0 features not in the checklist: Forge UI token rendering, pan/zoom controls, look API warnings, ClassBrowser copy behavior.
**Rationale:** The checklist is used by the human maintainer before every release. If it doesn't cover features introduced since v0.3, quality regressions slip through.
**Acceptance criteria:**
- Checklist includes test scenarios for: pan/zoom gesture, look API warning in Apply tab, ClassBrowser copy in Reference tab, Compose tab palette save round-trip, theme extractor round-trip

**Files:** `docs/release-checklist.md`
**Risk:** Low
**Dependencies:** None
**Verification:** Dry-run the checklist against the current app; confirm every step is executable

---

### V05-06 — SKILL.md reference: output-format-contract.md Format F entry

**Description:** Add Format F (Renderer Compatibility Notes) as an official format to `skills/okhp3-mermaid-theme-builder/references/output-format-contract.md`. Currently Formats A–E are documented; Format F was added to SKILL.md but the reference spec was not updated.
**Rationale:** An agent reading the formal spec file to understand the output contract will not find Format F. The SKILL.md and its reference files must be consistent.
**Acceptance criteria:**
- Format F section added to `output-format-contract.md` with: template, field validation rules, and one worked example
- Skill integrity test updated to assert Format F exists in the contract document

**Files:** `skills/okhp3-mermaid-theme-builder/references/output-format-contract.md`, `skills/okhp3-mermaid-theme-builder/tests/skill-integrity.test.mjs`
**Risk:** Low
**Dependencies:** None
**Verification:** `node --test tests/skill-integrity.test.mjs` passes

---

### V05-07 — Renderer-profiles.md look support column

**Description:** Add the `Look support` column to the compatibility matrix table in `skills/okhp3-mermaid-theme-builder/references/renderer-profiles.md`, matching the SKILL.md summary table and the `lookSupport` arrays in `renderer-profiles.json`.
**Rationale:** `renderer-profiles.md` is the authoritative human-readable form of the renderer matrix. It currently lacks the `look` column added to the other surfaces.
**Acceptance criteria:**
- Table in `renderer-profiles.md` has a Look support column with values matching `renderer-profiles.json.lookSupport`
- Per-renderer narrative sections mention look support/limitations

**Files:** `skills/okhp3-mermaid-theme-builder/references/renderer-profiles.md`
**Risk:** Low
**Dependencies:** None
**Verification:** Manual review of the matrix against `renderer-profiles.json`

---

### V05-08 — ApplyTab.tsx decomposition (TD-06)

**Description:** Break `src/pages/tabs/ApplyTab.tsx` (~1017 lines) into sub-components: `ExportToolbar`, `RenderWarningSection`, `DiagramPreviewPanel`, `DiagramDetectHeader`.
**Rationale:** A 1000+ line component is a maintainability risk. It is hard to test in isolation and slows editor navigation. Agent tasks involving the Apply tab have a high surface area for conflicts.
**Acceptance criteria:**
- `ApplyTab.tsx` under 500 lines after extraction
- Each extracted component has its own file in `src/components/`
- All 659+ existing tests still pass
- No visual regression in Apply tab

**Files:** `src/pages/tabs/ApplyTab.tsx`, `src/components/ExportToolbar.tsx` (new), `src/components/RenderWarningSection.tsx` (new), `src/components/DiagramPreviewPanel.tsx` (new), `src/components/DiagramDetectHeader.tsx` (new)
**Risk:** Medium — large surface area; must not change behavior
**Dependencies:** V05-02 (changelog entry needed)
**Verification:** `pnpm --filter @workspace/mermaid-theme-builder run typecheck` passes; existing tests pass; visual check of Apply tab

---

### V05-09 — Root-level htmlLabels and deterministicIds in exports (TD-19)

**Description:** Emit `htmlLabels` at root config level (not `flowchart.htmlLabels`) in `%%{init}%%` and Markdown Bootstrap exports. Add `deterministicIds: true` and `deterministicIDSeed` option to advanced config export for multi-diagram embed safety.
**Rationale:** `flowchart.htmlLabels` nesting was deprecated in Mermaid 11.13. Multi-diagram embeds risk SVG ID collisions without `deterministicIds`.
**Acceptance criteria:**
- Styled Code export emits `"htmlLabels": true` at root (not inside `"flowchart":`)
- Markdown Bootstrap export includes a note about `deterministicIds` for multi-embed use
- Existing themeEngine tests updated to assert root-level placement

**Files:** `src/lib/themeEngine.ts`, `src/lib/exporters.ts`, `src/__tests__/themeEngine.test.ts`
**Risk:** Low
**Dependencies:** None
**Verification:** Manually inspect Styled Code export for flowchart; check test output

---

### V05-10 — Typography model: per-element font hierarchy scaffold (TD-18)

**Description:** Extend the typography model (`src/lib/typography.ts`) to expose a documented per-element font hierarchy: title, body, node label, subgraph title, axis/legend. Gate per-family availability using the capability registry. Emit correct variables per family in the init block.
**Rationale:** The current model is global — one `fontFamily` for everything. Mermaid supports per-element typography tuning, and advanced users building prompt scaffolds need to know which variables to set.
**Acceptance criteria:**
- `typography.ts` exposes a typed hierarchy interface with family-gated fields
- Init block generation uses family-appropriate typography variables
- No visual regression on existing palette output

**Files:** `src/lib/typography.ts`, `src/lib/themeEngine.ts`, `src/data/mermaid-capabilities.ts`
**Risk:** Medium — affects themeEngine output; needs test updates
**Dependencies:** V05-09
**Verification:** Typecheck passes; themeEngine test assertions cover new variables

---

### V05-11 — Architecture diagram capability tuning knobs (TD-21)

**Description:** Document `architectureBeta` layout tuning options (`nodeSeparation`, `idealEdgeLengthMultiplier`, `edgeElasticity`, `numIter`) and Timeline direction (`LR`/`TD`) in the capability registry and `CapabilityNote` component. Add one architecture `.mmd` fixture file with tuning annotations.
**Rationale:** LLM-generated architecture diagrams often produce poor layouts because neither the user nor the LLM knows these knobs exist.
**Acceptance criteria:**
- `DIAGRAM_CAPABILITIES` entry for `architectureBeta` includes a `layoutTuning` note
- `CapabilityNote` renders layout tuning hint for architecture diagrams
- `assets/fixtures/architecture-basic.mmd` added with layout param comments

**Files:** `src/data/mermaid-capabilities.ts`, `src/components/CapabilityNote.tsx`, `skills/okhp3-mermaid-theme-builder/assets/fixtures/` (new file)
**Risk:** Low
**Dependencies:** None
**Verification:** Architecture diagram in Apply tab shows layout tuning capability note

---

### V05-12 — URL palette share link surfaced in UI (TD-10)

**Description:** Add a "Copy share link" button to the Compose tab palette editor (or export bar). The URL encoding already exists in `persistence.ts`; this task only surfaces it.
**Rationale:** URL sharing is implemented but undiscoverable. Users who want to share a custom palette have no visible affordance.
**Acceptance criteria:**
- "Copy share link" button visible in Compose tab when a palette is active
- Clicking it copies the full URL with palette hash to clipboard
- Button shows a transient "Copied!" confirmation

**Files:** `src/pages/tabs/ComposeTab.tsx`, `src/lib/persistence.ts`
**Risk:** Low
**Dependencies:** None
**Verification:** Click "Copy share link" → paste URL in new tab → palette state restored

---

### V05-13 — PWA offline smoke test and cache strategy validation (TD-09)

**Description:** Validate `public/sw.js` cache behavior on first load and after a cache bust. Add a release checklist entry for PWA install and offline smoke test.
**Rationale:** PWA is listed in shipped features (v0.2) but the service worker has never been validated and is absent from the release checklist.
**Acceptance criteria:**
- Service worker registers without console errors on fresh load
- App shell loads from cache on second load (offline simulation in DevTools)
- Release checklist includes PWA smoke test step

**Files:** `public/sw.js`, `docs/release-checklist.md`
**Risk:** Low
**Dependencies:** V05-05
**Verification:** DevTools → Application → Service Workers → Offline mode → reload

---

### V05-14 — Remove unused SESSION_SECRET from environment (TD-07)

**Description:** Remove the `SESSION_SECRET` env var from the Replit environment. Document the removal in `AGENTS.md` so future agents don't assume it is needed.
**Rationale:** The secret is present but unused. It creates confusion for future maintainers and agents who may wrongly infer the app has a session layer.
**Acceptance criteria:**
- Secret removed from Replit environment
- `AGENTS.md` notes that no session secret is required for this static app

**Files:** `AGENTS.md`
**Risk:** Low (app is stateless — removing the secret has no runtime effect)
**Dependencies:** None
**Verification:** Build succeeds; app loads normally

---

### V05-15 — Capability registry: mermaid-capabilities.ts test coverage (TD-11)

**Description:** Add assertions to a new or extended test file that validate: (a) all `DiagramFamily` union values have a corresponding `DIAGRAM_CAPABILITIES` entry, (b) `MERMAID_VERSION_VERIFIED` matches the installed Mermaid version at test time, (c) no capability entry has `examplePending: true` without a corresponding fixture file check.
**Rationale:** The 887-line capabilities file is manually maintained with no automated guards against drift.
**Acceptance criteria:**
- New or extended `src/__tests__/registry.test.ts` covers the three assertions above
- Test fails if `MERMAID_VERSION_VERIFIED` drifts from `package.json` mermaid version

**Files:** `src/__tests__/registry.test.ts`, `src/data/mermaid-capabilities.ts`
**Risk:** Low
**Dependencies:** None
**Verification:** `pnpm --filter @workspace/mermaid-theme-builder run test` passes

---

### V05-16 — Event Modeling .mmd example and registry entry

**Description:** Create `examples/event-modeling-basic.mmd` and update the `DIAGRAM_CAPABILITIES` entry for `eventModeling` to set `examplePending: false`. Wire into example library.
**Rationale:** Event Modeling shipped in Mermaid 11.15.0 and the capability entry exists but is marked `examplePending: true`.
**Acceptance criteria:**
- `examples/event-modeling-basic.mmd` contains a valid Mermaid eventModeling diagram
- `DIAGRAM_CAPABILITIES.eventModeling.examplePending` is `false`
- Example appears in the example library under the appropriate group

**Files:** `examples/event-modeling-basic.mmd` (new), `src/data/mermaid-capabilities.ts`, `src/data/example-library.ts`
**Risk:** Low
**Dependencies:** V05-15
**Verification:** Example loads in Examples tab; no capability registry test fails

---

### V05-17 — Look API per-family warnings in Apply tab

**Description:** Show a warning in the Apply tab when `look: handDrawn` or `look: neo` is unsupported for the currently detected diagram family or target renderer. Wire to `renderer-parity.ts` lookSupport data.
**Rationale:** The look API is documented in SKILL.md and the renderer profiles but the Apply tab does not surface renderer-specific look limitations contextually.
**Acceptance criteria:**
- When a renderer with `lookSupport: ["classic"]` is selected (e.g. Notion), a warning is shown if any look other than classic is active
- Warning is dismissible and non-blocking

**Files:** `src/pages/tabs/ApplyTab.tsx`, `src/data/renderer-parity.ts`, `src/components/WarningBanner.tsx`
**Risk:** Low
**Dependencies:** V05-08 (after ApplyTab decomposition)
**Verification:** Select Notion as target renderer → toggle `neo` look → warning appears

---

### V05-18 — Mobile preview layout: portrait mode fix

**Description:** Fix the mobile portrait layout issue where the split-pane preview panel collapses code input below the fold. Implement a stacked single-column layout on `<640px` viewports.
**Rationale:** The current portrait-mode layout is broken — the split pane is not usable below 640px.
**Acceptance criteria:**
- On `<640px` viewport: input textarea above, preview below, no horizontal overflow
- On `>=640px` viewport: existing split layout unchanged
- Pan/zoom still works in mobile preview panel

**Files:** `src/pages/tabs/ApplyTab.tsx` (or extracted `DiagramPreviewPanel.tsx`), Tailwind utility classes
**Risk:** Medium — layout changes; test on real device or DevTools emulation
**Dependencies:** V05-08
**Verification:** Chrome DevTools mobile emulation (iPhone SE, Pixel 5); existing tests pass

---

### V05-19 — Pan/zoom reset button and keyboard shortcut

**Description:** Add a "Reset view" button (`Ctrl+0` / `Cmd+0`) to the pan/zoom control toolbar on all diagram preview panels.
**Rationale:** Users who over-zoom or over-pan have no quick way to return to the default view.
**Acceptance criteria:**
- "Reset" button in the zoom toolbar resets pan offset and zoom level to defaults
- `Ctrl+0` / `Cmd+0` triggers the same reset when focus is in the preview panel
- Reset button has `aria-label="Reset diagram view"`

**Files:** `src/components/MermaidPreview.tsx`
**Risk:** Low
**Dependencies:** None
**Verification:** Manual: zoom in → click reset → diagram returns to default fit

---

### V05-20 — Copy/export clipboard reliability audit

**Description:** Audit all clipboard write paths in `exporters.ts`. Ensure they fall back gracefully when `navigator.clipboard` is unavailable. Add a visible error message if clipboard write fails.
**Rationale:** Silent clipboard failures are a top-3 user frustration in static web tools.
**Acceptance criteria:**
- All `navigator.clipboard.writeText` calls have a catch handler
- On failure, a visible toast/warning appears: "Could not copy — select and copy manually"
- `exporters.test.ts` covers the fallback path

**Files:** `src/lib/exporters.ts`, `src/pages/tabs/ApplyTab.tsx`, `src/__tests__/exporters.test.ts`
**Risk:** Low
**Dependencies:** None
**Verification:** Mock `navigator.clipboard` to reject → confirm error message appears

---

### V05-21 — Dependabot PR evaluation and safe merges (TD-03)

**Description:** Review the 5 open Dependabot PRs. Evaluate each for breaking changes. Merge those that are safe. Defer TypeScript 5→6 and Zod 3→4 with documented rationale.
**Rationale:** Open Dependabot PRs accumulate security debt. Unreviewed major bumps carry real risk.
**Acceptance criteria:**
- Each PR evaluated with a decision: merge, defer with note, or close
- Any merged upgrades pass typecheck and existing tests
- Decisions documented in `docs/technical-debt-register.md` under TD-03

**Files:** `package.json`, `pnpm-lock.yaml`, `tsconfig.json` (potentially)
**Risk:** Medium — major version bumps may break types
**Dependencies:** V05-05
**Verification:** `pnpm --filter @workspace/mermaid-theme-builder run typecheck` + test suite passes after any merge

---

### V05-22 — Accessibility: Apply tab focus trap on modal open

**Description:** Audit the Apply tab for focus management issues when `PromptScaffoldModal`, `DiagramInventory`, and warning popovers open. Implement correct focus trap (enter on open, return to trigger on close).
**Rationale:** Keyboard-only users cannot currently navigate modals correctly.
**Acceptance criteria:**
- Opening any modal/overlay traps focus inside it
- `Escape` closes and returns focus to the triggering element
- Tab cycle stays inside the modal while it is open
- `accessibility.test.tsx` covers the focus trap

**Files:** `src/components/PromptScaffoldModal.tsx`, `src/components/DiagramInventory.tsx`, `src/__tests__/accessibility.test.tsx`
**Risk:** Low
**Dependencies:** V05-08
**Verification:** Keyboard-only navigation through Apply tab with modals open

---

### V05-23 — Project page content alignment support

**Description:** Update `docs/product-positioning.md` and `docs/product-brief.md` to reflect v0.5.0 feature state. Provide copy the maintainer can use to update the public project page.
**Rationale:** The public project page content is sourced from internal docs. If the docs are stale, the page is stale.
**Acceptance criteria:**
- `product-brief.md` version references updated to 0.5.0
- Feature list matches current shipped scope
- No references to planned-but-not-shipped features

**Files:** `docs/product-brief.md`, `docs/product-positioning.md`
**Risk:** Low
**Dependencies:** V05-01
**Verification:** Human maintainer review against live project page

---

### V05-24 — Renderer caveat language pass in capability registry

**Description:** Review all `DIAGRAM_CAPABILITIES` entries and their `rendererNotes` fields. Remove or qualify any claims that overstate renderer support. Cross-reference against `renderer-parity.ts`.
**Rationale:** Overconfident renderer claims propagate to CapabilityNote UI hints and to SKILL.md. They mislead users and agents.
**Acceptance criteria:**
- All `rendererNotes` cross-referenced against `renderer-parity.ts`
- Any contradiction resolved in favor of `renderer-parity.ts` data
- `rendererParity.test.ts` asserts no capability entry claims higher support than the parity matrix

**Files:** `src/data/mermaid-capabilities.ts`, `src/data/renderer-parity.ts`, `src/__tests__/rendererParity.test.ts`
**Risk:** Low
**Dependencies:** None
**Verification:** Test suite passes; manual spot-check of CapabilityNote for sequence diagram

---

### V05-25 — Build and deploy pipeline verification pass

**Description:** Confirm the full GitHub Actions CI/CD pipeline is green: lint, typecheck, build, and GitHub Pages deploy. Validate the deployed site loads correctly with the correct base path.
**Rationale:** The pipeline was fixed in v0.5.0 but has not been formally verified end-to-end since then.
**Acceptance criteria:**
- All CI workflow steps pass on main branch
- Deployed site at `okhp3.github.io/mermaid-theme-builder` loads correctly
- `MERMAID_VERSION_VERIFIED` constant matches deployed Mermaid version

**Files:** `.github/workflows/deploy.yml`, `src/data/mermaid-capabilities.ts`
**Risk:** Low
**Dependencies:** V05-21
**Verification:** Green CI badge; manual smoke test of deployed site

---

## Release Band v0.6.x — Validation, Mobile Hardening, and Trust

**Theme:** Comprehensive validation infrastructure, mobile-first quality, and user trust signals.
**Target: ~25 tasks. No speculative features. Make what exists provably good.**

---

### V06-01 — Playwright E2E smoke test suite (TD-01)

**Description:** Set up Playwright and implement core pipeline smoke tests: paste flowchart → detect → themed preview renders → export contains `%%{init}%%`; palette switch → preview updates; extract tab round-trip; Examples tab: load example → themed preview renders.
**Rationale:** The 81-step manual checklist is not automated. Any refactor risks silent regression. This is the single highest-impact quality improvement in the backlog.
**Acceptance criteria:**
- Playwright installed and configured in the workspace
- 4 core smoke tests pass in CI
- Tests run against the dev server
- CI pipeline includes `pnpm test:e2e` step

**Files:** `playwright.config.ts` (new), `tests/e2e/` (new), `.github/workflows/deploy.yml`
**Risk:** Medium — Playwright setup in Replit requires careful port/BASE_PATH config
**Dependencies:** V05-25
**Verification:** `pnpm --filter @workspace/mermaid-theme-builder run test:e2e` passes in CI

---

### V06-02 — Renderer parity matrix UI in Apply tab

**Description:** Surface per-renderer compatibility information directly in the Apply tab when a renderer is selected. Show a compact compatibility card (init directive, themeVars, classDef, look, CSS inject) inline below the export bar.
**Rationale:** The compatibility matrix lives in docs but is invisible during the actual workflow.
**Acceptance criteria:**
- Renderer selector dropdown in export bar (or a "Target renderer" selector)
- Selecting a renderer shows a compact compatibility card sourced from `renderer-parity.ts`
- Card updates when renderer changes
- Notion selection shows "partial init / partial themeVars / Classic only" warning

**Files:** `src/pages/tabs/ApplyTab.tsx` (or `ExportToolbar.tsx`), `src/data/renderer-parity.ts`
**Risk:** Low
**Dependencies:** V05-08, V05-17
**Verification:** Select each renderer → verify card matches `renderer-parity.ts` data

---

### V06-03 — Mobile companion mode: input-first layout

**Description:** Implement a dedicated mobile layout mode where the app defaults to a single-pane input-focused view. Tapping a "Preview" button overlays the diagram preview full-screen.
**Rationale:** The desktop split-pane layout is fundamentally unusable on a 375px phone even with the V05-18 fix.
**Acceptance criteria:**
- On `<640px` viewport: input pane fills screen; floating "Preview" FAB opens full-screen overlay
- Overlay has Close button and export actions accessible from preview
- Works on iOS Safari and Chrome Android

**Files:** `src/pages/tabs/ApplyTab.tsx` (or `DiagramPreviewPanel.tsx`), new mobile layout components
**Risk:** Medium — significant UX restructuring; must not break desktop
**Dependencies:** V05-08, V05-18
**Verification:** Real device testing (iOS Safari, Chrome Android) + Playwright mobile viewport

---

### V06-04 — iPad layout optimization

**Description:** Optimize the split-pane layout for iPad-class viewports (768px–1024px). Implement a dedicated two-pane balanced layout for tablet-class widths.
**Rationale:** iPad is a target use case for diagram review. The current layout at 768px is neither mobile nor desktop.
**Acceptance criteria:**
- `768px–1024px` viewport: balanced 50/50 split pane, no horizontal overflow, legible text
- Header navigation adapts to tablet width
- Tested on iPad Air simulated viewport

**Files:** `src/pages/tabs/ApplyTab.tsx`, Tailwind breakpoint utilities
**Risk:** Low
**Dependencies:** V06-03
**Verification:** Chrome DevTools iPad Air emulation; visual inspection

---

### V06-05 — Keyboard and clipboard handling audit

**Description:** Audit all keyboard interaction paths. Ensure Tab/Shift+Tab, Enter, Escape, and `Ctrl+Shift+C` work correctly across all controls. Add keyboard shortcuts reference.
**Rationale:** The app has partial keyboard support but it is inconsistent and undiscoverable.
**Acceptance criteria:**
- Full keyboard navigation through Apply tab without mouse
- `Ctrl+Shift+C` shortcut tooltip visible on the Copy Styled Code button
- A keyboard shortcuts reference (tooltip or `?` help button) lists all shortcuts
- `accessibility.test.tsx` covers the keyboard paths

**Files:** `src/pages/tabs/ApplyTab.tsx`, `src/components/`, `src/__tests__/accessibility.test.tsx`
**Risk:** Low
**Dependencies:** V05-22
**Verification:** Keyboard-only walkthrough of complete Apply tab workflow

---

### V06-06 — WCAG 2.1 AA contrast audit and remediation

**Description:** Run axe-core against all tabs in light and dark mode. Fix all critical (level A) and serious (level AA) violations. Document any known exceptions.
**Rationale:** No WCAG audit has been performed (TD-15). The forge design system's dark teal palette may have contrast issues on some components.
**Acceptance criteria:**
- Zero axe-core critical violations in all tabs (light and dark)
- Zero axe-core serious violations for interactive elements
- Known acceptable exceptions documented in `docs/accessibility.md` (new)

**Files:** `src/components/`, `tailwind.config.*`, potentially `docs/accessibility.md` (new)
**Risk:** Medium — some contrast fixes may change the visual language
**Dependencies:** V05-22, V06-05
**Verification:** axe-core automated scan + manual review with NVDA/VoiceOver

---

### V06-07 — User palette CRUD: save, rename, delete (TD-14)

**Description:** Complete the user palette authoring workflow in the Compose tab. Implement: save current palette with a name, rename a saved palette, delete a saved palette, reorder saved palettes. All persisted to localStorage.
**Rationale:** The Compose tab lets users edit palettes but saving them is not implemented (TD-14).
**Acceptance criteria:**
- "Save palette" button saves the current state with a user-defined name
- Saved palettes appear in the palette selector alongside built-ins
- Rename and delete work without data loss
- Saved palettes survive page reload

**Files:** `src/pages/tabs/ComposeTab.tsx`, `src/lib/persistence.ts`, `src/__tests__/persistence.test.ts`
**Risk:** Medium — localStorage schema change; migration needed for existing keys
**Dependencies:** V05-12
**Verification:** Save → reload → palette present; delete → reload → palette gone

---

### V06-08 — Export preview pane (TD-13)

**Description:** Implement a read-only export preview pane in the Apply tab showing all three export formats (Styled Code, Markdown Bootstrap, Prompt Scaffold) simultaneously below the diagram preview.
**Rationale:** Users frequently copy the wrong format because they cannot see what they will get.
**Acceptance criteria:**
- Three tabs below the diagram preview: "Styled Code", "Markdown", "Prompt Scaffold"
- Each tab shows the formatted output for the current palette + diagram
- Copy button in each tab copies that format
- Preview updates immediately when palette or diagram changes

**Files:** `src/pages/tabs/ApplyTab.tsx` (or `ExportToolbar.tsx`), `src/lib/themeEngine.ts`
**Risk:** Low
**Dependencies:** V05-08
**Verification:** Paste diagram → switch between preview tabs → confirm content matches copy output

---

### V06-09 — Family-specific Prompt Scaffold templates

**Description:** Add per-family scaffold sections to the Prompt Scaffold export for flowchart, sequenceDiagram, classDiagram, and erDiagram. Each section includes family-specific classDef patterns and renderer notes.
**Rationale:** The current Prompt Scaffold is palette-centric. Per-family depth makes LLM outputs dramatically more consistent.
**Acceptance criteria:**
- Prompt Scaffold for flowchart includes classDef template block with 3 example class definitions
- Prompt Scaffold for sequence includes actor and note styling guidance
- Scaffold content is sourced from `familyTheming.ts` data, not hardcoded

**Files:** `src/lib/themeEngine.ts`, `src/lib/familyTheming.ts`, `src/components/PromptScaffoldModal.tsx`
**Risk:** Low
**Dependencies:** None
**Verification:** Generate scaffold for flowchart → confirm classDef section present

---

### V06-10 — Renderer compatibility contextual warnings in export bar

**Description:** Surface renderer-specific warnings at the point of export: "CSS injection blocked on GitHub", "classDef unsupported for sequence/Gantt in Confluence". Warnings keyed to selected renderer + detected diagram family.
**Rationale:** Users copy output without knowing about renderer limitations and then debug why their diagram looks wrong.
**Acceptance criteria:**
- Warning appears if selected renderer has `supportsCSSInjection: "none"` and user has CSS content
- Warning appears if selected renderer has `supportsClassDef: "partial"` for the detected family
- Warnings are concise and link to renderer-profiles.md for details

**Files:** `src/pages/tabs/ApplyTab.tsx` (or `ExportToolbar.tsx`), `src/data/renderer-parity.ts`
**Risk:** Low
**Dependencies:** V06-02
**Verification:** Select Confluence + classDiagram → confirm classDef warning appears

---

### V06-11 — Fixture library expansion to 12 diagrams

**Description:** Expand `assets/fixtures/` in the skill package and `examples/` in the app to cover 12 diagram families. Add: stateDiagram-v2, C4 context, xychart-beta, timeline, zenuml (plus ER already done in V05).
**Rationale:** Test coverage for detect/apply/validate scripts is limited to 5 fixture types.
**Acceptance criteria:**
- 12 fixture files in `skills/okhp3-mermaid-theme-builder/assets/fixtures/`
- Each passes `node scripts/validate-theme.mjs` after applying ocean-depth palette
- Integrity test updated to assert 12+ fixture files

**Files:** `skills/okhp3-mermaid-theme-builder/assets/fixtures/` (7 new files), `skills/okhp3-mermaid-theme-builder/tests/skill-integrity.test.mjs`
**Risk:** Low
**Dependencies:** V05-06
**Verification:** `node --test tests/*.test.mjs` passes for all fixtures

---

### V06-12 — Support taxonomy UI in Reference tab

**Description:** Add a "Support taxonomy" section to the Reference tab explaining the four support tiers: Stable-Full, Stable-Limited, Beta/Experimental, Renderer-Dependent.
**Rationale:** Users frequently ask why some diagram types have different styling behavior. A visible taxonomy removes a documentation lookup.
**Acceptance criteria:**
- Support taxonomy legend visible in Reference tab or DiagramInventory header
- Each tier described in one sentence with color coding matching existing badge system
- Taxonomy wording matches SKILL.md exactly

**Files:** `src/pages/tabs/ReferenceTab.tsx`, `src/components/DiagramInventory.tsx`
**Risk:** Low
**Dependencies:** None
**Verification:** Reference tab shows taxonomy legend; wording matches SKILL.md

---

### V06-13 — Local storage safeguards: quota, corruption, migration

**Description:** Add a localStorage quota guard (warn if >80% of quota used), a corruption recovery path (catch parse errors in `persistence.ts` and reset to defaults), and a schema version key for future migrations.
**Rationale:** As user palettes are saved (V06-07), localStorage usage grows. Currently no quota check, no corruption recovery, and no version migration path.
**Acceptance criteria:**
- `persistence.ts` wraps all `localStorage.setItem` in try/catch with quota error message
- `persistence.ts` wraps all `localStorage.getItem` parse in try/catch with reset path
- `LS_SCHEMA_VERSION` constant defined; checked on load

**Files:** `src/lib/persistence.ts`, `src/__tests__/persistence.test.ts`
**Risk:** Low
**Dependencies:** V06-07
**Verification:** Corrupt a localStorage key → reload → app recovers to defaults without crash

---

### V06-14 — Screenshot regression test setup

**Description:** Add Playwright screenshot tests for the Apply tab in three states: default load with OverKill Hill palette + flowchart example, dark mode with Slate Ember palette, mobile viewport.
**Rationale:** Screenshot regression catches visual changes that unit tests cannot.
**Acceptance criteria:**
- Playwright screenshot baseline images committed to `tests/e2e/screenshots/`
- CI runs diff check on subsequent PRs
- A `--update-snapshots` flag allows intentional updates

**Files:** `tests/e2e/` (new screenshot tests), `.github/workflows/deploy.yml`
**Risk:** Medium — screenshot tests are flaky if not pinned to a consistent viewport/font render
**Dependencies:** V06-01
**Verification:** Two runs produce identical screenshots; intentional UI change triggers diff

---

### V06-15 — Examples gallery: richer diagram showcase

**Description:** Expand the Examples tab gallery to include at least 3 entries per palette. Add examples for sequence, class, ER, C4, Gantt, timeline.
**Rationale:** A richer gallery increases surface area for discovery and seeds the Apply tab with real diagram types.
**Acceptance criteria:**
- Each palette has at least 3 example entries in `example-library.ts`
- Examples span at least 5 different diagram families across all palettes
- All examples render without Mermaid errors in the preview

**Files:** `src/data/example-library.ts`, `src/data/examples.ts`, `src/pages/tabs/ExamplesTab.tsx`
**Risk:** Low
**Dependencies:** V06-11
**Verification:** Examples tab loads; all examples render; no console errors

---

### V06-16 — QA automation: manual checklist → automated steps

**Description:** Migrate at least 20 of the 81 manual release checklist steps to automated Playwright or Vitest tests, focused on the most-likely-to-regress paths.
**Rationale:** An 81-step manual checklist is a bottleneck for every release.
**Acceptance criteria:**
- 20+ checklist items have a corresponding automated test
- Each automated item is marked `[AUTO]` in `docs/release-checklist.md`
- Tests pass in CI

**Files:** `docs/release-checklist.md`, `tests/e2e/` (new Playwright tests), `src/__tests__/`
**Risk:** Low
**Dependencies:** V06-01
**Verification:** `pnpm run test:e2e` covers the automated items; checklist items marked accordingly

---

### V06-17 — Syntax-highlighted code editor (CodeMirror micro-bundle)

**Description:** Replace the plain `<textarea>` in the Apply tab input pane with a CodeMirror 6 micro-bundle (syntax highlighting for Mermaid, line numbers, accessible).
**Rationale:** A plain textarea for Mermaid input misses a significant UX quality bar for developer tooling.
**Acceptance criteria:**
- CodeMirror renders Mermaid syntax highlighting in the input pane
- Line numbers visible; dark/light mode follows the app's theme toggle
- `Tab` key behavior does not break focus management
- Bundle size increase <50kB gzipped

**Files:** `src/pages/tabs/ApplyTab.tsx`, `src/lib/liveEditor.ts`, `package.json`
**Risk:** Medium — adds a dependency; bundle size must be monitored
**Dependencies:** V05-08
**Verification:** Paste flowchart code → syntax highlighting appears; no regression in existing tests

---

### V06-18 — Auto-load brand example on palette switch (no-code state)

**Description:** When no diagram code is present in the Apply tab and the user switches palettes, auto-load the palette's brand example.
**Rationale:** New users landing on the app with an empty input have no feedback about what the tool does.
**Acceptance criteria:**
- When Apply tab input is empty and user selects a different palette, a brand-appropriate example loads automatically
- The auto-load is visually indicated ("Example loaded — OverKill Hill P³ flowchart")
- The user can clear the input and type their own code without the auto-load re-triggering

**Files:** `src/pages/tabs/ApplyTab.tsx`, `src/data/example-library.ts`
**Risk:** Low
**Dependencies:** None
**Verification:** Clear input → switch palette → example appears; type code → switch palette → no auto-load

---

### V06-19 — Privacy-respecting analytics (Plausible) (TD-16)

**Description:** Add Plausible analytics to track aggregate page views, tab usage, and export button clicks. No diagram content captured. No cookies. GDPR-compliant by design.
**Rationale:** The app has zero usage data. Without knowing which features are used, it is impossible to prioritize future work accurately.
**Acceptance criteria:**
- Plausible script added to `index.html` with appropriate domain config
- Custom events: tab switch, palette select, export type click
- No diagram code or user text captured in any event
- Privacy policy note added to `docs/legal.md`

**Files:** `index.html`, `src/pages/`, `docs/legal.md`
**Risk:** Low (privacy-respecting by design; no personal data)
**Dependencies:** None
**Verification:** Plausible dashboard shows events; no `navigator.sendBeacon` with diagram content

---

### V06-20 — SKILL.md advanced examples: C4 and class diagram

**Description:** Add two more worked examples to `SKILL.md`: (4) Apply OverKill Hill P³ to a C4 context diagram with renderer caveat note, (5) Apply Glee-fully to a class diagram with classDef library block.
**Rationale:** C4 and classDef-heavy diagrams are frequent agent requests with distinct styling patterns not covered by the current 3 worked examples.
**Acceptance criteria:**
- Two new worked examples added under `## Worked Examples`
- Each includes: input diagram, palette choice, renderer selection rationale, full Format A output, any caveats
- Skill integrity test updated to assert 5+ worked examples

**Files:** `skills/okhp3-mermaid-theme-builder/SKILL.md`, `skills/okhp3-mermaid-theme-builder/tests/skill-integrity.test.mjs`
**Risk:** Low
**Dependencies:** V05-06
**Verification:** Test passes; manually verify C4 and classDef outputs are correct

---

### V06-21 — 3 additional community palettes

**Description:** Add 3 new utility palettes to `src/lib/palettes.ts`: "Sunset Terracotta" (warm oranges/creams), "Arctic Blueprint" (steel blues/whites), "Ink Press" (near-black/near-white, print-safe).
**Rationale:** The 4 current utility palettes cover technical and neutral use cases. Warmer, cooler, and print-safe additions broaden applicability.
**Acceptance criteria:**
- 3 new palettes in `BUILTIN_PALETTES` with all 14+ themeVariable tokens
- Added to `assets/palettes.json` and `references/palette-registry.md`
- At least one example per new palette in the example library
- Existing tests pass (no regression)

**Files:** `src/lib/palettes.ts`, `skills/okhp3-mermaid-theme-builder/assets/palettes.json`, `skills/okhp3-mermaid-theme-builder/references/palette-registry.md`, `src/data/example-library.ts`
**Risk:** Low
**Dependencies:** V06-15
**Verification:** New palettes visible in Apply tab selector; all tests pass

---

### V06-22 — Stronger empty state for all tabs

**Description:** Improve empty states in Apply, Examples, and Compose tabs with clear calls-to-action and first-time user prompts.
**Rationale:** Empty states are currently absent or unclear. First-time users are confused about what to do.
**Acceptance criteria:**
- Apply tab with empty input shows a callout with a "Load example" button
- Examples tab with no matching palette examples shows a fallback message
- Compose tab with no saved palettes shows a first-time user prompt

**Files:** `src/pages/tabs/ApplyTab.tsx`, `src/pages/tabs/ExamplesTab.tsx`, `src/pages/tabs/ComposeTab.tsx`
**Risk:** Low
**Dependencies:** V06-18
**Verification:** Clear localStorage → open each tab → empty state visible and actionable

---

### V06-23 — mermaid-capabilities.ts modularization (TD-11)

**Description:** Break `src/data/mermaid-capabilities.ts` (~887 lines) into per-category modules: `capabilities-stable.ts`, `capabilities-beta.ts`, `capabilities-experimental.ts`, `capabilities-gaps.ts`. Re-export from an index file.
**Rationale:** An 887-line manually-maintained file is fragile. Per-category files reduce merge conflicts.
**Acceptance criteria:**
- `mermaid-capabilities.ts` becomes a thin re-export barrel (<50 lines)
- 4 category files in `src/data/capabilities/`
- All imports across the codebase updated to use the barrel
- All existing tests pass

**Files:** `src/data/mermaid-capabilities.ts`, `src/data/capabilities/` (new directory)
**Risk:** Medium — broad import surface across the app; requires careful refactor
**Dependencies:** V05-15
**Verification:** Typecheck passes; all tests pass; no import errors

---

### V06-24 — Diff view: highlight theme-only changes

**Description:** Enhance the `DiffView` component to highlight only the `%%{init}%%` block addition and any `classDef` lines added by theming, with a "Show theme changes only" toggle.
**Rationale:** Users want to see "what did the theme builder add?" not the full diff including original code.
**Acceptance criteria:**
- Diff view has a "Show theme changes only" toggle
- When active, only `%%{init}%%` block and classDef lines are highlighted; original code is dimmed
- Toggle state persisted to localStorage

**Files:** `src/components/DiffView.tsx`, `src/lib/diff.ts`, `src/__tests__/diffView.test.tsx`
**Risk:** Low
**Dependencies:** None
**Verification:** Paste diagram → apply theme → Diff tab → toggle "theme changes only" → init block highlighted

---

### V06-25 — Look API selector in Compose tab

**Description:** Add a Look API selector (Classic / Neo / Hand-Drawn) to the Compose tab. Preview should update to show the selected look. Selection is included in the export if supported by the chosen renderer.
**Rationale:** Look API (Mermaid v11.15.0) is documented but the app has no UI for selecting it.
**Acceptance criteria:**
- Look selector (3 radio buttons or dropdown) in Compose tab
- Preview updates immediately on look change
- Warning appears if selected look is not supported in the target renderer profile
- Selection exported in Styled Code output as `"look": "neo"` preceding `themeVariables`

**Files:** `src/pages/tabs/ComposeTab.tsx`, `src/lib/themeEngine.ts`
**Risk:** Low
**Dependencies:** V05-17
**Verification:** Select Neo → preview updates; select Notion renderer + Neo look → warning appears

---

## Release Band v0.7.x — Workflow Expansion

**Theme:** Power-user workflows, preset management, export depth, and documentation tooling.
**Target: ~25 tasks. Expand surface area without breaking the stable core.**

---

### V07-01 — User-defined palettes: full CRUD in Compose tab

**Description:** Building on V06-07 (save/rename/delete), add: duplicate palette from built-in, reorder saved palettes by drag-and-drop, import palette from JSON file.
**Acceptance criteria:**
- "Duplicate" action for any palette creates an editable copy
- Drag-to-reorder works in the saved palette list
- "Import from JSON" accepts files exported by the existing JSON export feature

**Files:** `src/pages/tabs/ComposeTab.tsx`, `src/lib/persistence.ts`
**Risk:** Low
**Dependencies:** V06-07, V06-13

---

### V07-02 — Preset management: themed export bundles

**Description:** Add an "Export theme bundle" action that packages the current palette + classDef library + scaffold preferences into a single JSON bundle. Add a corresponding "Import bundle" action.
**Acceptance criteria:**
- "Export bundle" downloads `{palette-name}-theme-bundle.json` containing: palette, classDef library, scaffold prefs, app version
- "Import bundle" restores all three components; bundle schema is versioned

**Files:** `src/lib/exporters.ts`, `src/lib/persistence.ts`, `src/pages/tabs/ComposeTab.tsx`
**Risk:** Low
**Dependencies:** V07-01

---

### V07-03 — Prompt pack exports

**Description:** Add a "Download prompt pack" action that generates a `.zip` file containing: the Prompt Scaffold document, the themed Mermaid init block as a standalone file, a `README.md`, and the palette as JSON.
**Acceptance criteria:**
- "Download prompt pack" produces a `.zip` with 4 files
- Works without any server-side processing (client-side zip)
- Archive contains: `scaffold.md`, `init-block.mmd`, `palette.json`, `README.md`

**Files:** `src/lib/exporters.ts`, `src/pages/tabs/ApplyTab.tsx`, `package.json` (JSZip dep)
**Risk:** Medium — adds a dependency (JSZip) and bundle size
**Dependencies:** V06-09

---

### V07-04 — Integration-ready JSON schema for theme output

**Description:** Define and publish a versioned JSON schema for the theme output payload. Host at `okhp3.github.io/mermaid-theme-builder/schema/v1/theme-output.json`. Reference from SKILL.md and README.
**Acceptance criteria:**
- JSON schema defines: `palette`, `initBlock`, `renderer`, `look`, `diagramFamily`, `appVersion`
- Schema hosted at the stated URL after next GitHub Pages deploy
- SKILL.md references the schema URL in the Assets section

**Files:** `public/schema/v1/theme-output.json` (new), `skills/okhp3-mermaid-theme-builder/SKILL.md`, `README.md`
**Risk:** Low
**Dependencies:** V07-02

---

### V07-05 — Documentation export: Markdown theme reference

**Description:** Add a "Download theme reference" action that generates a single Markdown document combining: the palette's full variable table, the renderer compatibility card, and the diagram family theming notes.
**Acceptance criteria:**
- "Download theme reference" produces a `.md` file
- Document contains: palette name + hex table, renderer matrix for the selected renderer, classDef patterns for the selected family, usage rules
- Renders correctly in GitHub Markdown preview

**Files:** `src/lib/exporters.ts`, `src/pages/tabs/ApplyTab.tsx`
**Risk:** Low
**Dependencies:** V07-03

---

### V07-06 — Configurable Prompt Scaffold sections

**Description:** Let users select which sections to include in the Prompt Scaffold export. Preferences saved to localStorage.
**Acceptance criteria:**
- Prompt Scaffold modal shows a section toggle UI before generating
- Toggle state persisted via `scaffoldPrefs.ts`
- "Preview" in modal updates in real time as sections are toggled

**Files:** `src/components/PromptScaffoldModal.tsx`, `src/lib/scaffoldPrefs.ts`
**Risk:** Low
**Dependencies:** V06-09

---

### V07-07 — Saved palette presets: shareable preset URLs

**Description:** Extend the existing URL hash encoding to include user-defined palette names, look preference, and selected renderer. Generate a "Share preset" URL that fully restores the user's environment.
**Acceptance criteria:**
- "Copy share preset URL" encodes: palette tokens, palette name, selected renderer, look mode
- Pasting the URL restores all four settings
- URL stays under 2000 characters for common palettes

**Files:** `src/lib/persistence.ts`, `src/pages/tabs/ComposeTab.tsx`
**Risk:** Low
**Dependencies:** V05-12, V06-07

---

### V07-08 — SKILL.md: headless/CLI packaging documentation

**Description:** Document how to use the `scripts/*.mjs` collection as a lightweight headless theming pipeline in a CI/CD context. Add `HEADLESS_USAGE.md` to the skill package.
**Acceptance criteria:**
- `skills/okhp3-mermaid-theme-builder/HEADLESS_USAGE.md` added
- Example shell scripts for: `detect-diagram.mjs`, `apply-theme.mjs`, piped combination
- All examples tested against the actual scripts

**Files:** `skills/okhp3-mermaid-theme-builder/HEADLESS_USAGE.md` (new), SKILL.md (reference link)
**Risk:** Low
**Dependencies:** None

---

### V07-09 — Richer Compose tab: live classDef editor

**Description:** Add a classDef editor section to the Compose tab. Let users add, name, and preview custom classDef blocks. ClassDefs stored with the palette bundle (V07-02) and used in scaffold generation (V06-09).
**Acceptance criteria:**
- ClassDef editor in Compose tab: name, fill, stroke, text color, font-weight fields
- Live preview of classDef applied to a sample node in MermaidPreview
- ClassDef block exported in Styled Code when "Include classDefs" is enabled

**Files:** `src/pages/tabs/ComposeTab.tsx`, `src/lib/familyTheming.ts`, `src/lib/themeEngine.ts`
**Risk:** Medium — new UI surface; must not interfere with palette editor
**Dependencies:** V06-07

---

### V07-10 — Notion/GitHub documentation sync support

**Description:** Add a "Copy for Notion" export format (Notion-safe: core themeVars only, system fonts, no Neo/Hand-Drawn) and "Copy for GitHub README" (strips CSS injection hints, replaces custom fonts with `system-ui`).
**Acceptance criteria:**
- "Copy for Notion" produces output validated against Notion's known limitations
- "Copy for GitHub README" strips CSS injection hints
- Both formats appear in the export bar when the relevant renderer is selected

**Files:** `src/lib/exporters.ts`, `src/pages/tabs/ApplyTab.tsx` (or `ExportToolbar.tsx`)
**Risk:** Low
**Dependencies:** V06-10

---

### V07-11 — Multi-diagram enhanced workflow

**Description:** Improve the multi-diagram splitting workflow: show a diagram count badge, let users name each slice, apply different palettes per slice, export all slices as a single Markdown document.
**Acceptance criteria:**
- Diagram count badge visible when >1 diagram detected
- Each slice can be named and given an independent palette
- "Export all" produces a single Markdown document with all slices

**Files:** `src/lib/diagramSplit.ts`, `src/pages/tabs/ApplyTab.tsx`, `src/lib/exporters.ts`
**Risk:** Medium — significant UX change to multi-diagram flow
**Dependencies:** V05-08

---

### V07-12 — Example gallery: filter by diagram family

**Description:** Add a diagram family filter to the Examples tab to complement the existing palette filter.
**Acceptance criteria:**
- Diagram family filter (multi-select or tabs) in Examples tab
- Cross-filter with palette selector: "Show all flowchart examples in AskJamie"
- Filter state persisted to localStorage

**Files:** `src/pages/tabs/ExamplesTab.tsx`, `src/data/example-library.ts`
**Risk:** Low
**Dependencies:** V06-15, V06-21

---

### V07-13 — SKILL.md: advanced scaffold patterns for agent workflows

**Description:** Add 3 new scaffold patterns to `prompt-scaffold-patterns.md`: (9) Multi-diagram governance, (10) CI/CD pipeline scaffold, (11) Team style guide scaffold.
**Acceptance criteria:**
- Patterns 9–11 added with complete, parameterized templates
- Each pattern references the correct palette template markers and renderer caveat sections
- Skill integrity test updated to assert 11 patterns

**Files:** `skills/okhp3-mermaid-theme-builder/references/prompt-scaffold-patterns.md`, integrity test
**Risk:** Low
**Dependencies:** V06-20

---

### V07-14 — TypeScript 5 → 6 migration (TD-03, if safe)

**Description:** Migrate to TypeScript 6. Resolve any type errors introduced by breaking changes. Update `tsconfig.base.json` and all tsconfig files.
**Acceptance criteria:**
- All TypeScript type errors resolved; `pnpm run typecheck` passes on TypeScript 6
- No runtime behavior changes

**Files:** `tsconfig.base.json`, `tsconfig.json`, `package.json`, `pnpm-workspace.yaml`
**Risk:** High — TypeScript 6 has breaking changes in strict mode
**Dependencies:** V06-01 (E2E tests needed to catch runtime regressions)

---

### V07-15 — Accessibility: WCAG 2.1 AA full audit and remediation

**Description:** Comprehensive WCAG 2.1 AA audit across all tabs using axe-core + manual testing (NVDA/VoiceOver). Remediate all critical and serious violations. Document exceptions.
**Acceptance criteria:**
- Zero axe-core critical violations across all tabs
- Zero axe-core serious violations across all interactive elements
- Manual screen reader walkthrough confirms all major workflows are accessible
- `docs/accessibility.md` updated with audit results

**Files:** `src/components/`, `src/pages/tabs/`, `docs/accessibility.md`
**Risk:** Medium — some accessibility fixes may require significant ARIA restructuring
**Dependencies:** V06-06

---

### V07-16 — Color contrast checker in palette editor

**Description:** Add a real-time WCAG contrast ratio display in the Compose tab palette editor for each color pair (primaryColor / primaryTextColor, etc.).
**Acceptance criteria:**
- Contrast ratio shown for all text-on-background pairs in the palette editor
- WCAG AA pass/fail indicator shown inline with each pair
- Pairs failing WCAG AA flagged in red; pairs failing WCAG AAA shown in amber

**Files:** `src/pages/tabs/ComposeTab.tsx`, `src/lib/palettes.ts`
**Risk:** Low
**Dependencies:** V07-09

---

### V07-17 — Zod schema validation for palette JSON imports

**Description:** Add Zod validation to the palette JSON import flow. Show field-level error messages when the format is wrong.
**Acceptance criteria:**
- Zod schema defined for palette import format
- Validation errors shown to user with field-level detail: "primaryColor must be a hex color"
- Valid imports continue to work as before

**Files:** `src/lib/persistence.ts`, `src/lib/palettes.ts`, `src/__tests__/palettes.test.ts`
**Risk:** Low
**Dependencies:** V07-02

---

### V07-18 — Renderer profile versioning

**Description:** Add Mermaid version range annotations to renderer profiles in `renderer-parity.ts`. Surface in the renderer compatibility card as "Based on Mermaid ~X.Y.Z".
**Acceptance criteria:**
- `RendererProfile` type includes `mermaidVersionApprox: string` field
- All 7 renderer profiles have the field populated
- Version shown in the renderer compatibility card UI

**Files:** `src/data/renderer-parity.ts`, renderer card component
**Risk:** Low
**Dependencies:** V06-02

---

### V07-19 — SKILL.md: packaging for external agent platforms

**Description:** Update `skills/okhp3-mermaid-theme-builder/README.md` with platform-specific install instructions for: Replit, Claude Code, GitHub Copilot, Cursor. Add a version check script.
**Acceptance criteria:**
- Each platform section includes: copy command, verification step, and a test prompt
- A `scripts/check-skill-install.mjs` script verifies all referenced files are present

**Files:** `skills/okhp3-mermaid-theme-builder/README.md`, `skills/okhp3-mermaid-theme-builder/scripts/check-skill-install.mjs` (new)
**Risk:** Low
**Dependencies:** V07-08

---

### V07-20 — CHANGELOG automation: PR-to-CHANGELOG script

**Description:** Add a `scripts/generate-changelog-entry.mjs` that reads a merged GitHub PR title and labels and outputs a formatted CHANGELOG entry.
**Acceptance criteria:**
- Script accepts `--title`, `--labels`, `--version` arguments
- Outputs a formatted CHANGELOG entry (Markdown) to stdout
- Can be piped into `CHANGELOG.md` in a GitHub Actions workflow

**Files:** `scripts/generate-changelog-entry.mjs` (new), potentially `.github/workflows/`
**Risk:** Low
**Dependencies:** V05-02

---

### V07-21 — Improved diagram detection confidence UI

**Description:** Surface the detection confidence level (`high`/`medium`/`low`) in the Apply tab header alongside the family label. Add a tooltip explaining each level.
**Acceptance criteria:**
- Confidence badge (High / Medium / Low) visible next to family label
- Tooltip explains each level on hover/focus
- Low confidence triggers a gentle warning: "Detection uncertain — override below if needed"

**Files:** `src/pages/tabs/ApplyTab.tsx` (or `DiagramDetectHeader.tsx`), `src/lib/detector.ts`
**Risk:** Low
**Dependencies:** V05-08

---

### V07-22 — Font family preview in palette editor

**Description:** Add a live font preview to the `fontFamily` field in the Compose tab. Show a sample node label rendered in the specified font family.
**Acceptance criteria:**
- Font preview shows a sample text in the specified `fontFamily`
- If the font fails to load, a warning: "Font may not render in all renderers"
- Preview updates within 500ms of font family input change

**Files:** `src/pages/tabs/ComposeTab.tsx`, `src/lib/palettes.ts`
**Risk:** Low
**Dependencies:** V07-09

---

### V07-23 — Offline mode: full PWA with offline caching (V2)

**Description:** Upgrade the service worker to a full network-first-with-cache-fallback strategy. Ensure the full app (including Mermaid.js) loads offline after first visit.
**Acceptance criteria:**
- App fully functional offline after first load
- Cache version updated on each deploy (cache busting via `CACHE_VERSION`)
- Offline indicator shown in header when network is unavailable

**Files:** `public/sw.js`, `index.html`
**Risk:** Medium — Mermaid.js and its dependencies are large; cache strategy must be correct
**Dependencies:** V05-13

---

### V07-24 — Mermaid version upgrade governance tooling

**Description:** Add a `scripts/check-mermaid-upgrade.mjs` that reports: current vs verified Mermaid version, new diagram families, changed themeVariable names. Run before any Mermaid version bump.
**Acceptance criteria:**
- Script produces a diff report: new families, removed families, changed themeVars
- Report format is human-readable and CI-loggable
- Script is referenced in the release checklist

**Files:** `scripts/check-mermaid-upgrade.mjs` (new), `docs/release-checklist.md`
**Risk:** Low
**Dependencies:** V05-15

---

### V07-25 — v0.7.0 release prep: docs, tagging, deployment

**Description:** Full release preparation cycle for v0.7.0: update version in `package.json`, update CHANGELOG.md, update `docs/roadmap.md`, verify MERMAID_VERSION_VERIFIED, run full release checklist, tag the release, deploy.
**Acceptance criteria:**
- `package.json` version = `0.7.0`
- CHANGELOG.md has `[0.7.0]` section
- `docs/roadmap.md` updated with v0.7.0 as shipped
- Release tag `v0.7.0` pushed to GitHub; GitHub Pages deploy verified

**Files:** `package.json`, `CHANGELOG.md`, `docs/roadmap.md`
**Risk:** Low
**Dependencies:** All V07-xx tasks

---

## Future Outlook

### v0.8.x — Agent/Tooling Expansion

- Full MCP (Model Context Protocol) server wrapping the headless scripts
- SKILL.md packaged as an NPM module for agent platform distribution
- Integration with Cursor, VS Code extension API, and Copilot custom instructions API
- Structured logging for agent usage patterns (no diagram content)
- `mermaid-theme-builder` CLI (`npx @okhp3/mermaid-theme-builder --palette overkill-hill --input diagram.mmd`)

### v1.x — Stable Public Release

- WCAG 2.1 AA certified across all browsers and screen readers
- Privacy-respecting analytics (Plausible) verified and operational
- Public API for theme generation (JSON in/out, no server, via WASM or edge function)
- Full documentation site (Docusaurus or similar) separate from GitHub wiki
- Semantic versioning contract for SKILL.md format (semver-stable agent API)
- Community palette submission process (GitHub PR template + automated validation)
- Canonical OKH P³ diagram style guide published

---

## "Do Not Do Yet" Guardrails

| Guardrail | Reason |
|---|---|
| Native mobile app (iOS/Android) | The web app at mobile-first quality is sufficient; native adds distribution/cert/update overhead with no clear user need yet |
| Backend services or API | The app is intentionally 100% client-side. No user data should ever leave the browser. No use case currently requires a server. |
| User accounts, login, or session management | No user data to persist server-side. Adding auth before there is a reason creates privacy and security surface area with no benefit. |
| AI API calls or LLM integration | The app generates prompts for LLMs; it does not call them. This separation is intentional and must be maintained. |
| Diagram rendering as a service (backend SVG export) | The existing CLI (`mmdc`) serves this use case. No need to re-implement it server-side. |
| Claiming experimental/proposal diagram types are official Mermaid support | Venn, Ishikawa, Wardley, EventModeling are experimental. Never present them as fully supported in documentation, UI, or SKILL.md. |
| Overclaiming renderer support | Do not document a renderer as supporting a feature without verification against the actual renderer version. The matrix is conservative by design. |
| Bundling or forking Mermaid.js | Mermaid is a peer dependency. Forking it creates maintenance burden and licensing risk. |
| Payment, subscriptions, or commercial licensing | This is an MIT-licensed open-source tool by a solo maintainer. Monetization requires a separate strategic decision. |
| Emoji in documentation or code comments | US English house style; no decorative emoji in output, commits, or documentation. |

---

## Cross-Release Dependencies

```
V05-08 (ApplyTab decomposition)
  > V05-17, V05-18, V05-19, V05-22, V06-02, V06-03, V06-04, V06-08, V06-17, V07-11, V07-21

V06-07 (user palette CRUD)
  > V06-13, V07-01, V07-02, V07-09, V07-17

V06-01 (Playwright E2E)
  > V06-14, V06-16, V07-14

V05-15 (capability registry tests)
  > V05-16, V06-23, V07-24
```

---

## Index by Risk Level

**High risk** (require careful planning and rollback readiness):
V07-14 (TypeScript 6 migration), V05-08 (ApplyTab decomposition)

**Medium risk** (require validation gates before merging):
V05-10 (typography model), V05-11 (capability knobs), V06-03 (mobile companion mode),
V06-06 (WCAG contrast audit), V06-13 (localStorage safeguards), V06-14 (screenshot regression),
V06-17 (CodeMirror editor), V06-23 (capabilities.ts modularization), V07-03 (prompt pack zip),
V07-11 (multi-diagram workflow), V07-15 (WCAG full audit), V07-23 (PWA offline v2)

**Low risk** (implement freely with standard test gate):
All remaining V05-xx, V06-xx, and V07-xx tasks

---

*This document is the planning artifact only. Implementation proceeds task-by-task in build mode. Do not implement this plan speculatively or in bulk.*
