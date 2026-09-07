# Equilibrium Review — v1.0 Readiness

**Review date:** 2026-09-07  
**Reviewed artifact:** Mermaid Theme Builder static web application  
**Frozen baseline:** commit `19c2ddc5d67df097338f98ced37b17064bf5974e` (`19c2ddc`)  
**Application version:** `0.6.2`  
**Machine-readable record:** [`equilibrium-review-v1-readiness.json`](equilibrium-review-v1-readiness.json)  
**Decision:** `defer-for-evidence` for `v1.0.0`; `approve-with-limits` for continued `v0.6.2` use

## Executive decision

Mermaid Theme Builder is a credible browser-only workbench for user-reviewed
Mermaid theming. The frozen baseline has strong local evidence for the main
Apply flow, broad unit and browser coverage, strict Mermaid initialization,
sanitized aggregate pageview transport, and a documented renderer/capability
model.

That evidence does **not** yet support an unconditional `v1.0.0` claim. The
release is deferred until the project has decisive evidence for:

1. hostile Mermaid, SVG, CSS, import, share, and persisted-state boundaries;
2. manual keyboard, screen-reader, zoom/reflow, contrast, and customized-state
   accessibility journeys;
3. renderer behavior outside the local Mermaid runtime, especially the
   explicitly unverified Notion, Confluence, Microsoft Loop/M365, and
   self-hosted GitLab cases;
4. PWA update/offline recovery behavior;
5. release-time enforcement that cannot create a green tag while build, test,
   documentation, or safety gates are absent; and
6. reconciliation of stale debt, checklist, screenshot, and product-brief
   statements.

This is a release-evidence decision, not a claim that the current design is
unsound. The product may continue as `v0.6.2` for non-sensitive, user-reviewed
diagrams, provided public language does not imply universal accessibility,
security validation, or external-renderer parity.

## 1. Review contract

### Decision question

> Is the frozen `0.6.2` artifact ready for a bounded public `v1.0.0` release
> within its stated browser-only, privacy-preserving, renderer-aware scope?

### Acceptance criteria

| Dimension                         | v1.0 acceptance criterion                                                                                                                                                                                                      |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Correctness                       | A fresh browser can paste, detect, theme, preview, copy, and download a valid source artifact for representative full and partial families. Stale output and actionable errors are covered.                                    |
| User outcome                      | Extract, profile/share, palette import/export, Prompt Scaffold, Examples, and Reference journeys are discoverable and preserve the user’s selected theme and source.                                                           |
| Privacy and safety                | No backend, login, diagram telemetry, or cloud storage is introduced. Documented aggregate analytics/font requests cannot carry diagram or palette data. Hostile preview/export/import/share/persistence fixtures fail closed. |
| Accessibility                     | Automated critical/serious axe scans remain clean, and a manual keyboard/screen-reader/zoom/reflow/contrast pass covers dialogs, menus, palette selection, import/share, errors, and focus return.                             |
| Renderer portability              | Claims are either proven with live/holdout renderer evidence or explicitly narrowed to profile guidance with visible validation caveats.                                                                                       |
| Evidence sufficiency              | Required checks run on the exact candidate commit; skipped jobs fail closed. External renderer and manual review evidence is dated, scoped, and not inferred from local tests.                                                 |
| Maintainability and release truth | README, roadmap, changelog, checklist, renderer data, threat model, screenshots, skill catalog, and release workflows agree on what is shipped, planned, observed, or unverified.                                              |

Test count is supporting evidence only. It is not an acceptance criterion by
itself.

## 2. Frozen baseline and evidence register

| ID   | Evidence                                                                                                         | Status       | What it establishes                                                                                                                  |
| ---- | ---------------------------------------------------------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| E-01 | Git baseline `19c2ddc5d67df097338f98ced37b17064bf5974e`; `package.json`; `pnpm-lock.yaml`                        | `live`       | Version `0.6.2`, Mermaid `11.16.0`, Node `>=24`, pnpm `10.26.1`, and the exact reviewed artifact                                     |
| E-02 | `pnpm test` on the frozen tree                                                                                   | `live`       | 89 test files and 3,163 tests passed; useful local regression signal                                                                 |
| E-03 | `pnpm run typecheck`                                                                                             | `live`       | TypeScript check passed                                                                                                              |
| E-04 | `PORT=18624 BASE_PATH=/mermaid-theme-builder/ pnpm run build`                                                    | `live`       | Production build passed when invoked with the repository-required runtime variables; Vite emitted non-blocking script/chunk warnings |
| E-05 | `pnpm test:e2e` workflow result for the same tree                                                                | `live`       | 243 browser tests passed, including the live XY-chart palette assertion                                                              |
| E-06 | `check:ci-workflow`, version, technology, documentation-truth, skills-catalog, source-reference, and link checks | `live`       | Current mechanical consistency checks passed                                                                                         |
| E-07 | `docs/accessibility-audit.md` and `e2e/accessibility-audit.spec.ts`                                              | `historical` | Twenty axe scans across five tabs, two themes, and desktop/mobile reported no Critical or Serious findings on 2026-09-01             |
| E-08 | `docs/renderer-frontmatter-compatibility.md`, `src/data/renderer-parity.ts`                                      | `analytical` | Renderer guidance and confidence levels; several targets and ceilings remain explicitly unverified                                   |
| E-09 | `docs/threat-model.md`, `src/components/MermaidPreview.tsx`, `src/lib/exporters.ts`                              | `analytical` | Threat boundaries and strict Mermaid controls exist, but hostile sink behavior is not directly proven                                |
| E-10 | `docs/screenshot-v0.6.1.jpg`, `docs/screenshot-latest.jpg`, release workflow                                     | `historical` | Release imagery is not yet evidence of the frozen `0.6.2` UI                                                                         |
| E-11 | `docs/roadmap.md`, `docs/release-checklist.md`, `docs/technical-debt-register.md`, `docs/product-brief.md`       | `analytical` | Several acceptance items remain unchecked or stale despite passing narrow checks                                                     |
| E-12 | Hostile-input, deep persistence, PWA update, manual accessibility, and external renderer runs                    | `not-run`    | The decisive missing evidence package                                                                                                |

The first bare `pnpm run build` invocation failed because `PORT` was not
provided. The repository’s Vite configuration intentionally requires `PORT`;
the corrected invocation in E-04 passed. This remains a validation ergonomics
hazard because a developer or release job can misread an environment failure as
a product failure.

## 3. Independent review record

Three reviewers ran in separate delegated contexts against the same frozen
source set. Their model identity was not available, so agreement is correlated
and not independent external corroboration.

| Role                            | Execution                                       | Conclusion                                                                                                                                                                                                                         |
| ------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Evidence reviewer               | `live` execution; analytical result             | Local implementation and checks support a credible `v0.6.2`; privacy egress, renderer parity, extraction round trips, hostile sinks, and the complete release gate remain provisional or blocked.                                  |
| Outcome reviewer                | `live` execution; analytical result             | Usefulness is bounded and credible for Apply, Examples, Reference, Compose, and Extract; eight-format outcome proof, family-wide consistency, keyboard completion, and product-brief wording remain incomplete.                    |
| Safety and portability reviewer | `live` execution; analytical result             | Strict mode, explicit navigation, and same-origin service-worker boundaries are promising; raw SVG/CSS sinks, malformed persistence, PWA recovery, manual accessibility, renderer portability, and tag operations remain unproven. |
| Disruptor                       | `live` conditional execution; analytical result | Hostile export, malformed state, stale cache, manual accessibility, renderer, and tag counterexamples survive; the convergence is not falsely reassuring.                                                                          |
| Negotiator                      | `live` conditional execution; analytical result | Select `defer-for-evidence`; allow bounded current use only with explicit limitations and do not authorize a v1 tag from this baseline alone.                                                                                      |

## 4. Claim ledger

Statuses mean:

- **supported** — directly established within the stated boundary;
- **provisional** — implementation or narrow evidence exists, but the product
  claim is broader than the decisive evidence;
- **disputed** — sources or public surfaces conflict and must be reconciled;
- **blocked** — a required decision input or safety proof is missing.

| Claim                                                                                                         | Status                 | Evidence                                                                                                                                | Consequence if false                                                                                            | Smallest decisive next test                                                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| CLM-01. Diagram and palette transformation is browser-side with no backend, login, or cloud storage.          | **supported**          | `README.md`; `docs/threat-model.md`; static entry tree; `src/`                                                                          | The core privacy and product boundary would be false.                                                           | Fresh build/source audit confirming no server/API surface and browser-only state flow.                                                                                                     |
| CLM-02. No diagram or palette data leaves the browser during normal use.                                      | **provisional**        | `src/lib/privacy-analytics.ts`; `public/plausible-privacy.js`; privacy E2E; `index.html`                                                | Confidential source could leak through analytics, fonts, redirects, or future egress.                           | Fresh-context request allowlist while pasting, rendering, editing, extracting, importing, and using every export. Assert no diagram/palette/query/hash in URL, body, headers, or referrer. |
| CLM-03. The existing aggregate pageview is privacy-constrained and not content telemetry.                     | **supported**, bounded | Privacy analytics code and tests; `CHANGELOG.md`                                                                                        | Public privacy language would overstate or understate the actual network boundary.                              | Repeat the sanitized pageview assertion and keep analytics out of the release gate; reject any expansion.                                                                                  |
| CLM-04. Family detection and capability labels are accurate for all 31 advertised families and unknown input. | **provisional**        | `src/data/mermaid-capabilities.ts`; README; current E2E coverage                                                                        | Users may receive incorrect overlays or believe a capability gap is supported.                                  | Built-app fixture matrix for all 31 families plus unknown input, checking family, support level, warning, and false positives.                                                             |
| CLM-05. Renderer profiles are reliable compatibility claims.                                                  | **provisional**        | `src/data/renderer-parity.ts`; frontmatter matrix; Reference tab                                                                        | Exports may silently fail or look different in the target host.                                                 | Submit representative flowchart and sequence fixtures in both formats to each advertised renderer/version tier and retain results.                                                         |
| CLM-06. Strict Mermaid mode prevents executable preview content.                                              | **provisional**        | `MermaidPreview.tsx`; `exporters.ts`                                                                                                    | A malicious diagram could execute in the app origin or read local state.                                        | Hostile corpus asserting no script, event attributes, dangerous links, foreignObject, or sentinel execution in preview and rendered SVG.                                                   |
| CLM-07. Downloaded SVG/CSS/frontmatter artifacts are inert and safe to reopen.                                | **blocked**            | Export implementation; imported palette paths; raw SVG insertion                                                                        | A crafted font, color, name, or description could break a style boundary or create active content elsewhere.    | Import hostile metadata and assert every export has valid structure, no executable markup, no event attributes, no external URLs, and no comment/style breakout.                           |
| CLM-08. Extract, import, share, and local persistence preserve reusable governance state.                     | **supported**, bounded | `ExtractTab.tsx`; `persistence.ts`; `profile-share.ts`; related E2E                                                                     | Users could lose palette identity or restore the wrong renderer/format.                                         | Fresh-context round trip for init/YAML extraction and profile/share, including custom names, typography, renderer, format, and advanced settings.                                          |
| CLM-09. All eight advertised download formats are outcome-valid.                                              | **provisional**        | README; `ExportToolbar.tsx`; `exporters.ts`; partial E2E                                                                                | Users may receive an empty, malformed, stale, or visually invalid artifact.                                     | Download all eight formats for a full family and a partial family; assert signatures, parseability, names, source, and actionable failure UI.                                              |
| CLM-10. Prompt Scaffold always reflects the latest source and selected theme.                                 | **provisional**        | Prompt Scaffold implementation; pending regression task                                                                                 | AI prompts could encode stale diagram instructions and cause theme drift.                                       | Change source after opening scaffold, regenerate, and assert the latest source/family/theme are present.                                                                                   |
| CLM-11. The product meets WCAG 2.1 AA broadly.                                                                | **disputed**           | Narrow axe audit passes; roadmap/checklist say keyboard coverage remains partial                                                        | v1 could be labeled accessible while keyboard, screen-reader, zoom, or custom-state journeys fail.              | Manual keyboard and screen-reader pass through menus, dialogs, import/share, palette selection, errors, downloads, focus return, 200–400% zoom, forced colors, and reduced motion.         |
| CLM-12. The PWA is offline-capable and recovers across releases.                                              | **provisional**        | `public/sw.js`; manifest; README qualification; TD-09                                                                                   | Users may see blank or stale apps after an update or offline launch.                                            | Cache build A, serve build B with changed/removed chunks, navigate offline, update the worker, and assert usable current shell or actionable failure.                                      |
| CLM-13. Release automation enforces the v1 evidence package.                                                  | **blocked**            | `.github/workflows/ci.yml`; `.github/workflows/e2e.yml`; `.github/workflows/release-gate.yml`                                           | A tag could pass only changelog/screenshot automation while failing build, tests, safety, or deployment checks. | Tag-triggered fork/dry run requiring exact-SHA CI, E2E, docs, safety corpus, and health checks before publication; verify least privilege.                                                 |
| CLM-14. Public documentation accurately describes the current product.                                        | **disputed**           | README passes narrow doc-truth checks; roadmap, debt register, brief, checklist, and screenshots contain stale/contradictory statements | Users and maintainers may make release or safety decisions from false maturity signals.                         | Reconcile every “planned/open/no audit” statement, product mode claim, screenshot label, and file path; rerun all truth/link/version checks.                                               |

## 5. Counterexample and falsification record

| ID     | Counterexample                                                                                                                 | Result                                                                             | Required evidence                                                                   |
| ------ | ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| CEX-01 | Mermaid labels, links, HTML, SVG event attributes, `javascript:` URLs, or `foreignObject` escape strict mode.                  | `not-run`; strict mode is only a control, not proof                                | Playwright sentinel and DOM/SVG inspection in preview and export                    |
| CEX-02 | Imported `fontFamily`, color, name, or description breaks CSS/frontmatter/SVG boundaries or creates a network-fetching value.  | `not-run`                                                                          | Hostile palette import/export corpus across CSS, SVG, JSON, init, and frontmatter   |
| CEX-03 | Schema-valid but deeply malformed or oversized localStorage/share/profile data crashes or persists bad state.                  | `not-run`                                                                          | Bounded parser and recovery test with malformed nested objects and oversized values |
| CEX-04 | Normal use sends diagram/palette content through analytics, fonts, referrers, service-worker requests, or explicit navigation. | `partial`; sanitized analytics assertions pass, full allowlist not run             | Fresh-browser request inventory with secrets in input, query, and hash              |
| CEX-05 | Service worker serves an old shell that references removed chunks after an update or offline launch.                           | `not-run`                                                                          | Build-A/build-B offline/update integration test                                     |
| CEX-06 | Keyboard, screen-reader, zoom, forced-colors, or customized palette states fail despite axe scans.                             | `not-run`; audit explicitly states these limits                                    | Manual accessibility protocol with dated results and specialist review where needed |
| CEX-07 | Notion, Confluence, Loop/M365, GitLab self-hosted, or long directives silently ignore output.                                  | `partial`; GitHub fixtures through 600 characters passed, other targets unverified | Renderer/version submission matrix with observed theme/look/format results          |
| CEX-08 | A malformed tag or failing commit reaches a release workflow that only checks changelog and screenshot.                        | `analytical`; workflow inspection confirms omitted gates, no dry run               | Fork dry run and least-privilege workflow contract                                  |

The recent XY-chart live assertion is a successful targeted falsification attempt
for one previously field-observed color-format claim. It does not upgrade the
whole renderer matrix or export-safety claim.

## 6. Release gates and existing backlog mapping

The following sequence groups existing work; it does not recreate the
regression tasks. Task references are preserved so the owner can use the
existing queue.

| Gate and order                         | Existing work                                                | Exit condition                                                                                                                                                                             | Evidence status                                             |
| -------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| **A — validation health**              | `#659`, `#660`, `#670`, `#666`; known typecheck/E2E failures | Unit, typecheck, build, format, docs/source/version/skills/link checks and E2E run on the exact candidate; environment failures are reproducible and distinguishable from product failures | `live` for the frozen rerun; tag-time enforcement `not-run` |
| **B — accessibility**                  | `#601`, `#589`, `#591`, `#639`                               | Axe remains clean and manual keyboard/screen-reader/zoom/reflow/contrast coverage is signed off for dialogs, menus, customized states, errors, and focus return                            | `historical` automated; manual `not-run`                    |
| **S — privacy and safety**             | New review track; no analytics task is a gate                | Hostile Mermaid/SVG/CSS, malformed import/share/persistence, request allowlist, explicit-navigation, and service-worker tests pass with limits documented                                  | `not-run`                                                   |
| **C — core journeys**                  | `#599`, `#642`–`#643`, `#644`–`#649`, `#664`, `#673`         | Extract routing/history, first-use/share links, export preview/copy/stale state, empty/clipboard states, and the remaining journey cases pass in fresh contexts                            | `live` for some narrow journeys; gate-wide `not-run`        |
| **D — renderer/output evidence**       | `#598`, `#614`–`#616`, `#600`, `#665`, merged `#676`         | Renderer warnings and output formats are proven in representative live/holdout hosts; field-observed values are labeled, not promoted to parity claims                                     | `live` for `#676`; remainder `not-run`                      |
| **E — palette/profile integrity**      | `#578`–`#583`, `#585`, `#587`–`#590`, `#617`–`#618`          | Imported/custom names, slots, order, share links, saved formats, syntax hints, and profile state cannot silently change user intent                                                        | `live` for selected regressions; gate-wide `not-run`        |
| **F — release truth and distribution** | `#603`, `#650`–`#652`, `#655`                                | README/changelog/roadmap/checklist/debt register/screenshots/skills catalog agree; tag workflow fails closed and validates the exact release commit                                        | `analytical`; completion `not-run`                          |

**Analytics boundary:** the pending owner-only analytics proof (`#729`) is
rejected as a release gate and should be retired rather than executed for this
product. No new analytics, telemetry, backend service, login, database, or
cloud storage belongs in the v1 path. The existing aggregate Plausible
pageview is treated as a narrowly documented exception to a literal
network-silent claim; it must not expand or carry diagram/palette data.

## 7. Staged mitigation path

| Stage                                         | Owner role                                | Prerequisite                                            | Observable acceptance criteria                                                                                                                                                                                | Evidence status                                         | Re-review trigger                                                                           |
| --------------------------------------------- | ----------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 0. Freeze and label                           | Release maintainer                        | None                                                    | Candidate commit, package/runtime versions, source set, and decision record are immutable and linked                                                                                                          | `live`                                                  | Any source, dependency, renderer, or public-claim change                                    |
| 1. Stabilize validation                       | CI/release maintainer                     | Stage 0                                                 | Required checks run on the exact SHA; `PORT`/`BASE_PATH` are supplied by every build job; E2E instability has a reproducible cause; skipped jobs fail closed                                                  | `live` locally; tag enforcement `not-run`               | Workflow, runner, Node, pnpm, Playwright, or build-config change                            |
| 2. Close accessibility                        | Accessibility reviewer plus UI maintainer | Stage 1                                                 | Manual protocol covers keyboard-only completion, screen reader, overlays, focus return, zoom/reflow, forced colors, reduced motion, and custom states; findings are fixed or explicitly scoped                | Automated `historical`; manual `not-run`                | Any interactive control, overlay, theme, layout, or palette-editor change                   |
| 3. Prove privacy and hostile-input boundaries | Security/privacy reviewer                 | Stage 1; Stage 2 for user-facing error/focus assertions | Hostile preview/export corpus, CSS/frontmatter sink corpus, malformed/oversized import/share/persistence recovery, request allowlist, and explicit navigation checks pass; limitations are written            | `not-run`                                               | Mermaid upgrade, exporter/parser change, persistence/share change, analytics/font/SW change |
| 4. Validate renderer/output claims            | Renderer evidence owner                   | Stages 1 and 3                                          | Representative diagrams and both formats are tested in each advertised renderer tier; unverified results remain visibly unverified; eight download formats have valid payload checks                          | `live` for XY-chart assertion only; remainder `not-run` | Mermaid/renderer version, profile, format, theme engine, or family overlay change           |
| 5. Reconcile product truth and assets         | Documentation/release maintainer          | Stages 1–4                                              | Product brief, README, changelog, roadmap, checklist, debt register, threat model, renderer data, skills catalog, screenshots, and distribution notes agree; stale items are corrected or explicitly deferred | `analytical`; completion `not-run`                      | Any shipped feature, version bump, release image, renderer claim, or public wording change  |
| 6. Adjudicate v1                              | Owner/release reviewer                    | All prior stages                                        | Claim ledger has no blocked high-consequence claim; all limits are public; exact-SHA release dry run passes; decision is recorded as approve, approve-with-limits, defer, or reject                           | `not-run`                                               | New release cycle or any re-review trigger below                                            |

## 8. Truth reconciliation findings

The narrow automated truth checks pass, but they do not cover all maturity
signals. The following are retained as release work rather than silently
treated as resolved:

- `docs/technical-debt-register.md` still says the WCAG audit is unperformed
  and analytics is merely planned, while the current audit and constrained
  pageview transport exist.
- `docs/release-checklist.md` contains a stale `src/lib/themeEngine.ts`
  post-release path; the current implementation uses
  `src/lib/theme-engine.ts`.
- The roadmap still leaves keyboard navigation, release cadence, and
  discoverability items unchecked. Its broad v1 policy therefore still blocks
  the tag.
- `docs/product-brief.md` describes explicit Repair and Update modes that are
  not presented as separate top-level tabs; the wording needs qualification or
  a discoverable acceptance journey.
- `docs/renderer-frontmatter-compatibility.md` correctly labels several values
  unverified, while README and profile language must not collapse those into
  universal parity.
- `docs/screenshot-latest.jpg` is a release surface, not proof of the frozen
  `0.6.2` UI until a current capture is dated and reviewed.
- The skill catalog and internal links currently pass their automated checks;
  that is distribution consistency evidence, not proof that every skill
  instruction remains behaviorally current.

## 9. Decision, limits, and expiry

### Decision

**`defer-for-evidence` for v1.0.0.**

**`approve-with-limits` for continued v0.6.2 use** under all of these limits:

- use non-sensitive, user-reviewed diagrams;
- treat renderer profiles as guidance, not compatibility guarantees;
- do not treat strict Mermaid mode as a completed hostile-input security
  certification;
- do not claim universal WCAG 2.1 AA conformance from the automated axe gate;
- do not publish a v1 tag or call the current export surface
  security-validated until the staged evidence package passes; and
- keep analytics, telemetry, backend, login, cloud storage, and diagram-content
  collection out of scope.

### Review expiry and mandatory re-review triggers

Reopen this review on any of the following:

- Mermaid, Vite, Node, pnpm, Playwright, or renderer-version change;
- new diagram family, export format, palette schema, profile/share, or
  persistence behavior;
- changes to the privacy boundary, analytics transport, fonts, service worker,
  external navigation, or browser-origin security configuration;
- security, accessibility, legal, or renderer-owner findings;
- CI, release workflow, tag, deployment, or screenshot automation changes;
- a change to README, product brief, roadmap, changelog, checklist, threat
  model, or other release claim; or
- a new release cycle or a request to promote the product beyond `v0.6.2`.

This record does not replace specialist security, accessibility, legal, or
renderer-owner review.
