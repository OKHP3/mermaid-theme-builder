# Mermaid Theme Builder — Vision Audit & v1.0→v2.0 PRD

Prepared as a critical second opinion. Repo audited: `OKHP3/mermaid-theme-builder`, local mirror at `/Volumes/OKH-Local/04_GitHub_Mirrors/mermaid-theme-builder`, current release v0.6.1 (2026-08-05). Live app checked at `https://okhp3.github.io/mermaid-theme-builder/` on 2026-08-06 — loads clean, no console errors, behavior matches the codebase.

Method: two independent research passes (one through 30+ docs files including `AGENTS.md`, `roadmap.md`, `release-plan.md`, `market-research.md`, `product-positioning.md`, the ADRs, and the technical-debt register; one through the full `src/` tree, test suite, and CI config), plus a live click-through of Compose, Apply, and Reference tabs. Every claim below traces back to a specific file or observed behavior — I've flagged the handful of places where the evidence was ambiguous rather than asserting past what I could verify.

---

## 1. Reconstructed Product Vision

Strip away the framing and the docs agree on this much: Mermaid Theme Builder is a browser-only tool that lets you define a visual theme once and apply it to Mermaid diagrams, with the specific angle that AI assistants generate Mermaid syntax correctly but style it badly or not at all. The wedge is a "Prompt Scaffold" export — a chunk of text you feed back to ChatGPT/Claude/Copilot so future diagrams come out pre-styled. `product-positioning.md` states the identity claim directly: not a Mermaid editor, not a color picker, not a Mermaid Chart competitor — "a visual governance tool for AI-generated Mermaid diagrams."

Target users are named specifically in `product-positioning.md`: enterprise architects, technical writers, PMs, consultants producing client deliverables, and AI power users generating 10+ diagrams a week. That's a real, narrow ICP, not "everyone who uses Mermaid."

Here's the part that matters most for this audit. The documentation contains two competing visions of how big this should get, and they were never reconciled on paper:

**Vision A — narrow, defensible utility.** `AGENTS.md`, `roadmap.md`, and `product-positioning.md` (the three most current, most authoritative docs) explicitly rule out a backend, accounts, cloud storage, AI API calls, payments, and file upload. `product-positioning.md` stages any platform ambition — MCP server, CLI, enterprise SSO governance plane, Figma sync — as Stage 2/3, "deliberately out of scope for v1.0."

**Vision B — stack layer / hub.** The same doc set describes Mermaid Theme Builder as one layer in a five-part "OKHP³ Visual Language Stack" (ReFolDec → skillz → BPMN for Mermaid → Theme Builder → renderers), ships an installable Agent Skills package meant for five different AI coding tools, and frames the "Governance Profile" as a portable spec meant to travel across teams and tools — not a picker, a standard. `docs/release-plan.md` (33KB, dated 2026-05-23) goes further and plans native iOS/Android distribution via Capacitor and a full Mermaid Chart API integration — a genuinely platform-scale ambition. Two later PRDs (2026-08-04, 2026-08-05) then declare that mobile/Capacitor work explicitly out of scope and never carry it forward into `roadmap.md`. Nothing in the repo formally retracts `release-plan.md` — it just stops being referenced.

So: the "distribution center / functional hub" instinct you're bringing to this session isn't new. It's Vision B, and it was already live in your own planning docs three months ago. What happened is the project made a sequencing call — narrow the scope, close v1.0 — and that call was reasonable, but it was never written down as a decision the way `DECISIONS_NEEDED.md` exists to capture exactly this kind of call. You're not asking "did we drift from the vision." You're asking "did we ever finish deciding which vision this is," and the honest answer is no.

## 2. Current Application Assessment

What's live today is a five-tab SPA — Compose, Apply, Examples, Reference, Extract — no router, hash-based tab state, opening directly into Compose. There's no landing page, dashboard, or home screen distinct from the tool itself. I confirmed this live: the app boots straight into the palette editor with your prior session's "My Theme 1/2" restored from `localStorage`.

The core loop works and works well. Paste Mermaid, the app detects the diagram family against a 34-family capability registry, flags renderer-specific risks (GitHub/GitLab's ~500-char init-directive ceiling, Notion/Confluence support gaps), lets you theme it against 7 built-in palettes or your own, and exports to eight formats including the Prompt Scaffold. I clicked through Compose → Apply → Reference live and it matched the codebase exactly — no drift between what the docs/code claim and what ships.

The engineering hygiene is genuinely above the bar for a solo project: 75 unit tests, 23 Playwright e2e specs, 7 CI workflows (build, e2e, deploy, link-check, release-gate, skill-tests, dependency-version-audit), a pre-commit hook chain, and a strict brand/voice governance layer (`AGENTS.md` bans em dashes and AI-filler words in commit messages, enforces file-naming hygiene, runs a 12-point brand-conformance audit). Zero backend, zero network calls at runtime, `localStorage`-only persistence — a real, verifiable privacy posture, not a marketing claim.

Where it's thin: the Reference tab, which is the closest thing to a hub, renders as four collapsed accordion rows and nothing else above the fold — I saw this live. "Mermaid Agent Skills · 10 skills · publicly installable" sits there as one collapsed line; expanding it gets you a list of outbound GitHub links, not delivered content. That's the entire "distribution center" surface as it exists today.

Under the hood, three files are carrying most of the weight: `App.tsx` (72KB, ~1,800+ lines, all app state as `useState`/`useMemo` prop-drilled into tabs), `ComposeTab.tsx` (82KB), and `theme-engine.ts` (98KB, the single largest file in the repo). None of these are broken — the test suite covers them — but they're the kind of monolith that gets expensive to extend, and "extend" is exactly what a hub build would require.

## 3. Vision-to-Execution Gap Analysis

**Fully implemented and aligned with Vision A (the narrow utility):**

| Area | Evidence |
|---|---|
| Theme → apply → export core loop | Live-verified across Compose/Apply; matches `AGENTS.md` §9.3 canonical flow |
| Diagram family detection + capability registry | `src/data/mermaid-capabilities.ts`, 34 families, drives detection and warnings |
| Renderer parity matrix | `src/data/renderer-parity.ts`, 8 renderer profiles with sourced claims |
| Multi-format export | 8 download formats + 3 toolbar exports, all live-confirmed |
| Zero-backend, zero-telemetry architecture | No API client or DB dependency in `package.json`; GA4 actively removed in v0.6.1 |
| Test/CI maturity | 75 unit tests, 23 e2e specs, 7 CI workflows |
| Brand/design governance | `design-system.md`, `forge-conformance-report.md` (12/12 pass) |

**Partially implemented:**

- WCAG 2.1 AA — `axe-core` is wired into the unit test suite, but the actual audit is still unrun and has been a named v1.0.0 gate since v0.5.0. Three versions of "still open."
- User palette CRUD — save exists, full rename/reorder/delete is tracked as incomplete (TD-14).
- Export preview pane — planned for v0.6, not shipped by v0.6.1 (TD-13).
- Governance Profile as a portable named artifact — the concept is fully specified in `docs/governance-profiles.md`, but I could not confirm from the code review that a distinct "Governance Profile" export exists separate from `.theme.json`/`.bundle.json`. Flagging this as unverified rather than asserting either way — worth a direct check before you plan v0.7.0 around it.
- Share-link — fully built (`persistence.ts` encode/decode, consumed on load) but not surfaced anywhere in the UI (TD-10). This is a shipped feature nobody can find.

**Present but misaligned:**

- `ExportToolbar.tsx` still passes `warnings`/`showCapabilityNote`/`capability` props that are marked `@deprecated` in favor of the newer `PreflightPanel`, and `ApplyTab.tsx` feeds both simultaneously. A refactor was started and not finished.
- The naming collision risk with Mermaid Chart's "Theme Selector" is self-flagged in `market-research.md` and still unresolved — it gets more expensive to fix the longer public launch copy circulates under the current name.
- `release-plan.md`'s mobile/Capacitor/Mermaid-Chart-API ambition sits in the repo unretracted while two more recent PRDs treat it as out of scope. Either it's dead or it isn't — right now the repo doesn't say.

**Missing, relative to the "distribution center / functional hub" framing you've voiced in this session:**

- No landing/dashboard view. The app has no page whose job is to orient a new user or surface what else exists.
- No actual content delivery mechanism. The Skills catalog is a list of outbound links, not something the app hosts, versions, or serves.
- No surfacing of the broader OKHP³ stack (ReFolDec, BPMN for Mermaid) inside the app — it's described in docs as a pipeline but the product doesn't show you you're standing in one node of it.
- No guided onboarding for a genuinely dense 5-tab tool with 20-40 props per tab component.

**Technical architecture concerns:** the three-file monolith (`App.tsx`, `ComposeTab.tsx`, `theme-engine.ts`) plus pure prop-drilling state management is a real constraint on adding hub-scale surface area later. It's not a bug today; it's a bill that comes due the moment you try to bolt a home page, a resource library, or new top-level sections onto this shell.

**Product strategy concern, stated plainly:** the project has excellent process infrastructure for capturing exactly this kind of open question — `DECISIONS_NEEDED.md` exists for it — but the scope-ambition question itself (narrow utility vs. stack layer vs. shelved platform) was never routed through it. That's a process gap, not an execution gap, and it's the cheapest one on this list to close.

## 4. Critical Verdict

Is it on track? Split answer, and I'd push back on treating it as one question.

As a narrow visual-governance utility — the thing `AGENTS.md` and `roadmap.md` actually commit to right now — yes, it's on track and it's good. Better tested, better documented, and more honestly scoped than most solo-dev tools ever get. The competitive research holds up: nobody else combines diagram-family awareness, renderer-divergence warnings, and an LLM prompt scaffold in one tool. That's a real wedge, not marketing copy.

As the "distribution center, functional hub, structured delivery system" you're describing today — no. Not because of poor execution. Because that build was never started. It was scoped, shelved in `release-plan.md`, and the shelving was never confirmed as final. What exists is not a hub with weak execution; it's a well-built narrow tool that a hub hasn't been attempted on top of yet.

Coherent product or collection of pieces? Coherent, within the narrow scope. The five tabs share one workflow and one data model and it reads as a single tool, not five projects glued together. That coherence would not survive an unplanned hub bolt-on — there's no shell built for "home page plus five workflow tabs plus a resource library," and building one badly would be worse than not building one at all.

Scalable enough for the intended direction? For more diagram families, more palettes, more renderers — yes, that's what the data-driven registries are for. For a genuine hub layer — not as currently structured. The three monolith files need to be broken up before, not after, you add a home page and a content layer on top of them.

Strongest work: the data layer (capability registry, renderer parity matrix — this is the actual moat per your own market research), the test/CI discipline, and the privacy posture. Weakest: the gap between what the docs promise (Governance Profiles as a portable spec, a five-project stack) and what the app currently shows a first-time visitor (an accordion with four collapsed rows). Preserve the former. Fix the latter before adding to it.

## 5. Recommended Product Direction

Two real paths from here, not five equally-valid options.

| | Path A — Close v1.0, then scope the hub | Path B — Build the hub now, alongside v1.0 |
|---|---|---|
| What it means | Finish the three named v1.0.0 gates (WCAG AA audit, privacy analytics, keyboard nav) on the current narrow scope. Write a real Stage 2 PRD for the hub layer afterward. | Start building a home/dashboard surface and content-delivery layer now, in parallel with gate closure. |
| Effort to next milestone | Small, bounded — the gates are already scoped in `roadmap.md` | Larger, undefined — no hub PRD exists yet |
| Risk | Low. Matches the strategy your own `product-positioning.md` already lays out (Stage 1 → 2 → 3). | Re-fragments focus right as three versions' worth of deferred gates finally come due. Risks repeating the pattern already logged in `prototype-to-product-retrospective.md` (roadmap drift, gates set and not honored). |
| Foundation cost | None extra — gate work doesn't touch the monolith files | Compounds: adds hub surface area on top of `App.tsx`/`theme-engine.ts` before they're decomposed |

Recommendation: Path A. Close the v1.0 gates first — they're small, already scoped, and have been open since v0.5.0 for no good reason. Then run a dedicated Stage 2 PRD for the hub, and do the `App.tsx`/`ComposeTab`/`theme-engine.ts` decomposition as part of that PRD's foundation work, not as a side quest squeezed in later. Section 6 below is written as that Stage 2 PRD, sequenced after gate closure, so you have both documents in hand rather than waiting on a second pass.

---

## 6. Long-Form PRD — v1.0 Gate Closure & v2.0 Hub Layer

### 6.1 Product Vision

Mermaid Theme Builder is the visual governance layer for AI-generated Mermaid diagrams: define a theme once, apply it anywhere Mermaid renders, and teach your AI tools to keep producing it correctly. v1.0 proves this as a standalone utility. v2.0 makes it the front door to the broader OKHP³ visual-language toolset it already claims, in its own docs, to be part of.

### 6.2 Product Goals

1. Close the three outstanding v1.0.0 gates without adding new scope that could push them out further.
2. Resolve the scope-ambition contradiction explicitly, in writing, via `DECISIONS_NEEDED.md`.
3. Decompose the three monolith files so v2.0 has a foundation to build on rather than a foundation to fight.
4. Ship a genuine hub surface (home/dashboard) that makes the OKHP³ stack and skills catalog feel like delivered content, not a links list.
5. Do all of this without violating the existing, correct architecture constraints (no backend, no accounts, no AI API calls, no payment processing) — the hub should stay static and client-side.

### 6.3 Target Users

Unchanged from current positioning: enterprise architects, technical writers, PMs producing shared documentation, consultants delivering client-facing diagrams, and AI power users. v2.0 adds one implicit user: someone who lands on the site cold, via search or a shared link, and needs 10 seconds to understand what this is and what else is here — which the current Compose-first landing does not serve.

### 6.4 Core Use Cases

1. Theme a pasted Mermaid diagram and export it for a specific renderer (existing, working).
2. Generate a Prompt Scaffold and hand it to an AI assistant so future diagrams come pre-styled (existing, working).
3. Land on the site with no prior context and, within one screen, understand what the tool does, see it's part of a broader toolset, and get to the workflow that matches their need (missing — this is the hub gap).
4. Discover and install a related Agent Skill without leaving the app to figure out what it is first (currently a bare link list).
5. Return to a previously shared theme via a discoverable share link (built but hidden — surface it).

### 6.5 Primary User Journeys

**Journey 1 — Cold landing → oriented → working.** User arrives at the root URL → sees a lightweight orientation (what this is, one-line value prop, the three or four things they can do here) → picks a path (theme a diagram / browse examples / grab a skill) → lands in the relevant tab with intent preserved. This journey does not exist today; users land directly in Compose with zero orientation.

**Journey 2 — Existing power-user loop.** Unchanged — Compose or Apply directly, theme, export. Do not add friction here. Any hub/landing surface must be skippable in one click or via a `#compose` deep link, exactly as today's hash routing already allows.

**Journey 3 — Skill discovery.** User wants the Agent Skill, not the web app. Reference tab's Skills section becomes a real mini-catalog: what each skill does, which AI tools it works with, one-click copy of the install path — not just an outbound GitHub link.

### 6.6 Functional Requirements

**v1.0 gate closure (do first, do not scope-creep):**
- FR-1: Run a full WCAG 2.1 AA audit via `axe-core` (already a devDependency) across all five tabs plus modals; fix all critical/serious violations before tagging v1.0.0.
- FR-2: Implement one privacy-respecting analytics provider (Plausible or Fathom, per `roadmap.md`'s own shortlist) with no diagram-content capture, consistent with the zero-analytics stance already re-affirmed in `DECISIONS_NEEDED.md`.
- FR-3: Full keyboard navigation audit — tab order, focus trapping in modals, arrow-key palette selection already partially present per the code review; close remaining gaps.
- FR-4: Surface the existing share-link feature in the UI (a "Share" button next to Export is the minimum) — this is a one-day fix for a feature that's already built (TD-10).
- FR-5: Remove the deprecated `warnings`/`showCapabilityNote`/`capability` props from `ExportToolbar.tsx` and finish the migration to `PreflightPanel` that was started but not completed.
- FR-6: Resolve the naming-collision question (keep "Mermaid Theme Builder" vs. rename) as a written decision in `DECISIONS_NEEDED.md`, not a lingering open item in `market-research.md`.
- FR-7: Formally retire or formally re-scope `docs/release-plan.md`'s Capacitor/mobile/Mermaid-Chart-API content — either move it to an explicit "Future / Not Committed" doc or delete it. It should not sit in the repo looking like an active plan when it isn't one.

**v2.0 hub layer (do after FR-1 through FR-7):**
- FR-8: Add a lightweight landing/home experience — not a full dashboard, a single oriented screen — that states the value prop, shows the three-workflow entry points (Compose/Apply/Examples), and surfaces the OKHP³ stack context (what ReFolDec, BPMN for Mermaid, and the Skills catalog are, in one line each, with real links). Must remain a static page with no new runtime dependency.
- FR-9: Upgrade the Reference tab's Skills section from a link list to a real mini-catalog: per-skill description, compatible tools, and a copy-to-clipboard install snippet, sourced from `src/data/skills-catalog.ts` extended with richer metadata.
- FR-10: Formalize Governance Profiles as a distinct, documented export format if it doesn't already exist as one (verify first — see open question in §3) — this is the artifact that makes the "portable spec" ambition in `governance-profiles.md` real rather than aspirational.
- FR-11: Decompose `App.tsx`, `ComposeTab.tsx`, and `theme-engine.ts` into smaller, testable units before or alongside FR-8/FR-9 — this is foundation work, not a nice-to-have. Target: no single file over roughly 20KB / 500 lines in the app-logic layer.
- FR-12: Introduce a lightweight state-management pattern (React context + reducer, or a small library like Zustand) to replace prop-drilling as tab count and hub surface area grow. Evaluate during FR-11, don't bolt on after.

### 6.7 Non-Functional Requirements

- Stay fully static, zero-backend, zero-account. This constraint is correct and should not be relaxed for the hub — a hub does not require a server, it requires better information architecture.
- No new runtime dependency beyond what's needed for FR-8/FR-9 (avoid adding a router library purely for a landing page; the existing hash-routing pattern can extend to one more state).
- Maintain the existing test/CI bar: any new component ships with unit test coverage matching the existing `src/__tests__` pattern; any new user flow gets an e2e spec.
- Maintain `AGENTS.md`'s brand/voice governance (no em dashes, no AI-filler language, en-US spelling) across all new copy, including the new landing page.
- Page weight: the landing addition should not meaningfully regress the app's current fast, static-file load time. Budget and measure.

### 6.8 Content Requirements

- Landing copy: one-sentence value prop, three workflow entry points with one-line descriptions, and a short "part of the OKHP³ visual language stack" section with real outbound context (not just a logo wall).
- Skills catalog: expand `skills-catalog.ts` entries with description, compatible-tools list, and install snippet per skill — this is a data-modeling task, not new infrastructure.
- Retire or clearly mark as historical: `docs/release-plan.md`'s shelved mobile/API-integration content (FR-7).

### 6.9 UX & UI Requirements

- The landing/hub screen must be skippable — power users should be able to deep-link straight to `#compose` or `#apply` exactly as they do today, with zero added friction.
- Visual language for the hub must match the existing OKH Forge design-token system (`design-system.md`) — no new visual language invented for this one surface.
- Reference tab's Skills section should default at least one entry expanded, or show a one-line summary per collapsed row, so the tab doesn't read as empty on first view (this was directly observed as a live UX weakness).

### 6.10 Information Architecture

Current: flat tab bar, 5 siblings, no hierarchy. Recommended for v2.0: keep the 5 workflow tabs as siblings (don't nest them under a hub — that adds a click to the core loop power users already rely on), and add the hub/landing as what a user sees at the bare root URL before a tab is selected, with the existing hash-routing distinguishing "just arrived" from "already picked a tab." This preserves Journey 2 while enabling Journey 1.

### 6.11 Technical Architecture Recommendations

- Decompose by responsibility, not by size alone: split `theme-engine.ts` along its actual functions (init-directive generation, frontmatter generation, classDef emission, prompt-scaffold generation appear to be four distinct concerns per the code review) rather than an arbitrary line-count cut.
- Split `ComposeTab.tsx`'s six accordion sections (Import, Look, Colors, Typography, Advanced, Export) into independent components if they aren't already — the file size suggests they're still fused.
- Keep Vite + React + Tailwind + `mermaid` as the stack. Nothing about the hub requirement calls for a framework change.
- If FR-12's state pattern change happens, do it as a standalone refactor PR with full e2e regression coverage before layering FR-8/FR-9 on top — sequencing matters here specifically because the retrospective already logged one instance of build work proceeding before a "STOP-for-GO" gate was actually honored.

### 6.12 Data & State Management Requirements

- Existing `localStorage`-only persistence model is correct and should not change — no backend for hub content either.
- Skills catalog metadata expansion (FR-9) stays in a typed data file (`skills-catalog.ts`), consistent with the existing `mermaid-capabilities.ts` / `renderer-parity.ts` pattern.
- If FR-12 introduces a state library, keep persisted state serialization backward-compatible with existing saved themes/palettes in users' `localStorage` — do not break returning users' saved work.

### 6.13 Integration Requirements

None beyond what exists. No AI API calls, no OAuth, no third-party accounts. This is a hard constraint carried forward from `AGENTS.md`, not a gap to close.

### 6.14 Distribution Workflows

- Web app: continue GitHub Pages as primary (`okhp3.github.io/mermaid-theme-builder`), confirm `overkillhill.com/projects/mermaid-theme-builder` as either a mirror or the canonical marketing page — resolve the "which URL is canonical" open question logged in the retrospective (DEP-01) as part of FR-6/FR-7's documentation cleanup.
- Skills package: continue as a separate, versioned artifact in `skills/`, now with better in-app discoverability per FR-9.

### 6.15 Success Criteria

| Milestone | Criteria |
|---|---|
| v1.0.0 tag | All three named gates (WCAG AA, analytics, keyboard nav) closed; FR-1 through FR-7 shipped |
| v2.0 hub (Stage 2) | New visitor can state what the tool does and name one other thing in the OKHP³ stack within one screen, without clicking into a tab first |
| Technical health | No app-logic file over ~20KB; state management no longer pure prop-drilling through `App.tsx` |
| Existing-user impact | Zero regression to Journey 2 — deep links and default Compose landing for tab-experienced users unaffected |

### 6.16 Prioritized Phases

- **MVP (v1.0.0):** FR-1 through FR-7. Nothing else. This is gate closure, not feature work.
- **V1 follow-through (v1.1–v1.x):** FR-11, FR-12 (foundation decomposition) — done before hub UI work starts, explicitly to avoid building hub surface on the current monolith.
- **V2 (Stage 2 per `product-positioning.md`):** FR-8, FR-9, FR-10 — the actual hub layer.
- **Future / not committed:** MCP server, CLI integration, enterprise SSO governance plane, Figma sync (Stage 3 per existing docs) — do not schedule until Stage 2 ships and is validated against the 500-weekly-user / 1-inbound-enterprise-conversation threshold `product-positioning.md` already set for advancing stages.

### 6.17 Acceptance Criteria for Major Features

- **WCAG AA audit (FR-1):** `axe-core` run against all 5 tabs + all modals with zero critical/serious violations; documented in `evidence-log` per existing project convention.
- **Share link surfaced (FR-4):** a visible Share action exists in the Compose/Apply export area; clicking it copies a working shareable URL; e2e test added confirming round-trip load of a shared theme.
- **Hub landing (FR-8):** loads as a static page with no new runtime dependency; Lighthouse performance score does not regress from current baseline; deep links to `#compose`/`#apply`/etc. bypass it entirely.
- **Skills mini-catalog (FR-9):** every entry in `skills-catalog.ts` has description + compatible-tools + install-snippet fields populated; UI renders all without requiring an extra click to see what a skill does.
- **File decomposition (FR-11):** `App.tsx`, `ComposeTab.tsx`, `theme-engine.ts` each reduced below ~20KB per resulting file; full existing test suite (75 unit + 23 e2e) passes unmodified in behavior, only structure changes.

---

## 7. Replit Build Directive

Work in this order. Do not start hub work (Phase 3) before Phase 1 gates close — that sequencing is the single most important instruction in this document, given the project's own retrospective already logged one instance of build work outrunning an unhonored gate.

**Phase 1 — Gate closure (build this first, nothing else):**
1. Run `axe-core` against all 5 tabs and every modal. Fix critical/serious findings. Log results in a new `docs/evidence-log-v1.0.md` following the existing evidence-log format.
2. Integrate Plausible or Fathom analytics with zero diagram-content capture. Confirm against the policy already resolved in `DECISIONS_NEEDED.md`.
3. Audit and close keyboard-navigation gaps: full tab order, modal focus trapping, arrow-key palette selection.
4. Add a visible "Share" button that surfaces the existing `persistence.ts` share-link encode/decode. Add an e2e test for it.
5. Remove the deprecated props from `ExportToolbar.tsx`; finish routing that data through `PreflightPanel` only.
6. Write the naming-collision decision (keep vs. rename) into `DECISIONS_NEEDED.md` as a resolved entry, following the file's existing format.
7. Either delete `docs/release-plan.md`'s mobile/Capacitor/Mermaid-Chart-API sections or move them to a clearly labeled `docs/future-not-committed.md`.
8. Tag v1.0.0 once 1–7 are done and CI is green.

**Phase 2 — Foundation (before any new UI surface):**
9. Split `theme-engine.ts` by function: init-directive generation, frontmatter generation, classDef emission, prompt-scaffold generation as separate modules, each independently tested.
10. Split `ComposeTab.tsx`'s six accordion sections into independent components.
11. Split `App.tsx`'s state and tab-shell logic; evaluate and, if justified, introduce a context/reducer or small state library to stop prop-drilling.
12. Run the full existing test suite after each split to confirm zero behavior change — this phase changes structure only.

**Phase 3 — Hub layer (Stage 2):**
13. Build the landing/orientation screen: value prop, three workflow entry points, OKHP³ stack context section. Must load as a static page, must be skippable via existing hash-routing deep links.
14. Expand `skills-catalog.ts` with description/compatible-tools/install-snippet per entry; rebuild the Reference tab's Skills section as a real mini-catalog with at least one entry expanded by default.
15. Verify whether a distinct Governance Profile export exists; if not, build it per `docs/governance-profiles.md`'s spec as a named, versioned, shareable artifact.
16. Re-run the full test suite plus a new e2e pass covering the landing screen and skills catalog.

**Do not build in this pass:** MCP server, CLI, enterprise SSO plane, Figma sync, mobile apps, Mermaid Chart API integration. All Stage 3 per existing docs, all correctly out of scope until Stage 2 is live and validated.

---

## 8. Prioritized Implementation Roadmap

1. WCAG 2.1 AA audit and fixes — highest priority, open since v0.5.0, blocks the tag that's been due for three releases.
2. Privacy-respecting analytics integration — small, already scoped, second named gate.
3. Keyboard navigation closure — third named gate.
4. Surface the share-link feature — trivial effort, real user value, already built.
5. Clean up the deprecated `ExportToolbar` props — small, prevents the codebase accumulating more of this pattern.
6. Write the naming-collision decision down — cheap now, expensive after public launch copy ships.
7. Retire or relabel `release-plan.md`'s shelved mobile/API ambitions — removes a standing contradiction in the repo's own paper trail.
8. Tag v1.0.0.
9. Decompose `theme-engine.ts`, `ComposeTab.tsx`, `App.tsx` — foundation work, unglamorous, do it before item 11 not after.
10. Introduce real state management if the decomposition shows prop-drilling is the actual constraint (verify, don't assume).
11. Build the landing/hub screen.
12. Rebuild the Skills section as a real mini-catalog.
13. Verify and, if needed, build a real Governance Profile export format.
14. Re-baseline against the Stage 2 advancement threshold already set in `product-positioning.md` (500+ weekly theme-export users or 1+ inbound enterprise conversation) before scoping Stage 3.

---

*One open item I could not verify from documentation and code alone: whether "Governance Profile" is already a distinct shipped export format or purely a documented concept. Recommend a direct check in Replit before FR-10/item 13 gets scoped — five minutes to confirm, versus building something that already exists or skipping something that doesn't.*
