# Evidence Log — v0.6.1 Sprint

> **Purpose:** Machine-readable record for Notion sync.  One row per PRD v5 /
> Release Integrity PRD line item.  Each row: item ID, one-line status, evidence
> pointer (file path, test name, or doc section).
>
> **Sprint scope:** GA4 removal, Windows portability, init-directive length
> warning, skills catalog reconciliation, release tagging and truth sync.
>
> **Release date:** 2026-08-05  
> **Tag:** v0.6.1  
> **Tests at tag:** 2657 unit + 133 E2E (all passing)

---

## Summary table

| Item ID | Requirement | Status | Evidence pointer |
|---------|-------------|--------|-----------------|
| PRD5-P1 | Remove GA4 analytics — app must make zero outbound network requests during normal use | ✅ Closed | `index.html` (no `gtag` script); `src/hooks/usePageTracking.ts` deleted; `src/App.tsx` import removed |
| PRD5-P2 | "No data collection" privacy claim must be accurate | ✅ Closed | `README.md` feature list: "no data is sent to any server. No backend, no login, no analytics." |
| PRD5-P3 | DECISIONS_NEEDED.md process record must exist for analytics policy | ✅ Closed | `DECISIONS_NEEDED.md` root; Analytics policy entry resolved 2026-08-05 |
| PRD5-P4 | Windows portability — install and E2E scripts must not require bash or WSL | ✅ Closed | `scripts/preinstall.mjs`, `scripts/run-e2e.mjs`, `scripts/start-e2e-server.mjs`; `playwright.config.ts` rewrote path logic with `path.delimiter`/`path.sep` |
| PRD5-P5 | Init-directive length — Mermaid parser-level ceiling measured for 8.x, 10.x, 11.x | ✅ Closed | `scripts/measure-init-directive-lengths.mjs` output: no length ceiling found (76–379 chars, all versions); `docs/renderer-frontmatter-compatibility.md` §Phase 1 measurement results |
| PRD5-P6 | Renderer-specific length ceilings documented in data | ✅ Closed | `src/data/renderer-parity.ts` — `initDirectiveSafeLength` field on all 8 profiles: GitHub/GitLab=500 (field-observed), mermaid.live/Obsidian/CLI=unlimited, Notion/Confluence/M365=unverified |
| PRD5-P7 | Length advisory wired into Export panel | ✅ Closed | `src/pages/tabs/ApplyTab.tsx` `exportAdvisories` useMemo; `src/lib/init-directive-length.ts` `checkInitDirectiveLength()`; fires when `directiveLength > ceiling` |
| PRD5-P8 | Length warning unit tests | ✅ Closed | `src/__tests__/initDirectiveLength.test.ts` — 28 tests; all pass |
| PRD5-P9 | Skills catalog count: disk, app, CHANGELOG all agree | ✅ Closed | `skills/` = 10 folders; `src/data/skills-catalog.ts` = 10 entries; `CHANGELOG.md [0.6.1]` = 10 skills; `README.md` auto-catalog = 10 skills |
| PRD5-P10 | CHANGELOG [0.6.0] overstatements corrected | ✅ Closed | `CHANGELOG.md [0.6.0]` skills entry updated: "README auto-catalog" scope made explicit; note added that app registration completed in v0.6.1 |
| RI-R1 | `package.json` version bumped to 0.6.1 | ✅ Closed | `package.json` `"version": "0.6.1"` |
| RI-R2 | `TOOL_VERSION` in theme-engine.ts matches package.json | ✅ Closed | `src/lib/theme-engine.ts` `const TOOL_VERSION = "0.6.1"` |
| RI-R3 | CHANGELOG has accurate [0.6.1] section | ✅ Closed | `CHANGELOG.md [0.6.1]` section |
| RI-R4 | README screenshot alt-text and feature list reflect v0.6.1 | ✅ Closed | `README.md` — alt text updated to v0.6.1; PWA claim added; privacy claim accurate |
| RI-R5 | `docs/roadmap.md` v0.6.1 section added; v0.6.0 finalized | ✅ Closed | `docs/roadmap.md` — header note updated; v0.6.0 status set to Shipped; v0.6.1 section added |
| RI-R6 | `docs/evidence-log-v061.md` created | ✅ Closed | This file |
| RI-R7 | `DECISIONS_NEEDED.md` present with resolved analytics entry | ✅ Closed | `DECISIONS_NEEDED.md` — one entry, resolved 2026-08-05 |
| RI-R8 | PWA claim verified or narrowed | ✅ Closed | `public/sw.js` and `public/manifest.webmanifest` confirmed present; README updated to "installable as a PWA" (accurate); no automated offline test exists — wording intentionally does not claim "works offline" |
| RI-R9 | `pnpm test` passes at tag | ✅ Closed | 2657 unit tests pass; vitest run at tag commit |
| RI-R10 | `pnpm run typecheck` passes at tag | ✅ Closed | `tsc -p tsconfig.json --noEmit` — clean at tag commit |
| RI-R11 | `pnpm run build` passes at tag | ✅ Closed | Vite build with `BASE_PATH=/mermaid-theme-builder/` — clean at tag commit |
| RI-R12 | git tag `v0.6.1` cut and pushed | ✅ Closed | Tag on HEAD commit of this release; pushed to `origin` |
| RI-R13 | GitHub Release created at v0.6.1 tag | ✅ Closed | GitHub Release with changelog section as release notes |

---

## Open items / deferred

| Item ID | Requirement | Status | Note |
|---------|-------------|--------|------|
| RI-D1 | Manual confirmation of GitHub 500-char init-directive ceiling | ⏳ Deferred | Task #614 — field-observed ceiling is conservative; exact limit unconfirmed |
| RI-D2 | E2E test for length advisory | ⏳ Deferred | Task #615 — no Playwright spec covers the caution advisory path |
| RI-D3 | Extend length advisory to Prompt Scaffold modal | ⏳ Deferred | Task #616 |
| RI-D4 | Skills catalog drift prevention (generator → app sync) | ⏳ Deferred | Task #617 |
| RI-D5 | Automated test for skills count vs directory | ⏳ Deferred | Task #618 |
| RI-D6 | WCAG 2.1 AA accessibility audit | ⏳ Deferred to v1.0.0 | Axe-core integration exists; full audit gate not yet run |
| RI-D7 | Privacy-respecting analytics | ⏳ Deferred to v1.0.0 | DECISIONS_NEEDED.md resolved as "no analytics" for now |

---

## v1.0.0 gate status

| Gate | Status | Evidence |
|------|--------|---------|
| Extract tab accessible | ✅ Pass | `AppTab` includes "extract"; `TAB_CONFIG` entry present; `#extract` resolves |
| Renderer-aware format generation | ✅ Pass | `getRendererDefaultOutputFormat` in `renderer-parity.ts`; `outputFormat` wired through App to ExportToolbar |
| Stroke/border width control | ✅ Pass | Button group in Compose Look section; `buildClassDefLibrary` accepts `strokeWidth` |
| Init-directive length safety | ✅ Pass | `checkInitDirectiveLength()` wired into `exportAdvisories`; 28 tests |
| Privacy — no outbound requests | ✅ Pass | GA4 removed; verified by code inspection |
| Privacy-respecting analytics | ❌ Open | Deferred — "no analytics" policy per DECISIONS_NEEDED.md |
| WCAG 2.1 AA accessibility audit | ❌ Open | Deferred to v1.0.0 sprint |

**Verdict: v0.6.1 — not v1.0.0.** Two v1.0.0 gates remain open.

---

*Produced: v0.6.1 release, 2026-08-05*  
*Author: Replit Agent, Task #611*
