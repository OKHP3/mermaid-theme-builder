# Replit PRD v5 — Length-Safety Closure and Truth-Sync Correction

**Project:** Mermaid Theme Builder (OKHP3/mermaid-theme-builder)
**Author:** Claude, on Jamie's behalf, from a hands-on re-verification of the v4 PRD sprint, run 2026-08-05
**Status:** Ready to paste. Phase-gated. Do not skip STOP gates.
**Supersedes:** PRD v4 ("Truth-and-Capability Closure Sprint"). v4 is roughly 60% closed; this PRD does not repeat what's already done, and does not re-litigate it. It closes what's still open and fixes two process failures from that sprint.

---

## 0. Why This PRD Exists — Read This Before Touching Code

PRD v4 shipped real work. Verified hands-on on 2026-08-05, live build `v0.6.0-3eb58e9`:

- Extract mode: fully functional, both frontmatter formats, correct detection/extraction/preview/CTA. Confirmed working.
- Dual-frontmatter toggle (`%%{init}%%` / YAML) on the Apply tab: generates correct, well-formed output both directions. Confirmed working.
- Stroke/border width control: present in Compose > Look exactly as the changelog describes. Confirmed working.
- Version bump to 0.6.0: real, in `package.json` and the deployed build hash.
- `docs/renderer-frontmatter-compatibility.md`: created.

**Do not touch any of the five items above.** They pass. Reopening them wastes tokens and risks regression for no reason.

Four things don't pass:

1. **The renderer-aware length-safety warning never shipped**, despite being the specific, named, load-bearing item of PRD v4's Phase 2. A single-line `%%{init}%%` directive of 597 characters, targeted at GitHub, produced zero warning of any kind on the live app. `docs/renderer-frontmatter-compatibility.md` exists but its own text says the length ceilings are "unverified, requires manual testing before Phase 2 implementation." Phase 1's STOP-for-GO gate on this measurement was never actually cleared before Phase 2 build work proceeded on it. This is a process failure, not just a missing feature: a discovery task got marked passable without discovery happening.
2. **The Notion Roadmap Tasks database was never touched.** All six PRD v4-tracked rows still carry Claude's own pre-sprint timestamps, not Replit's. This PRD rescopes that requirement (see Section 5) because the original ask was not actually achievable: this environment has no Notion write access, and asking for it in v4 without checking that first was a planning error on Claude's part, not a Replit failure. Corrected below.
3. **The "Neutral Enterprise" phantom-palette decision was made unilaterally.** PRD v4 Section 3, item P1-05, said explicitly: "that's Jamie's call, not an engineering default." The `CHANGELOG.md` [0.6.0] entry states the references were "removed from planning documents... never implemented in code" without that decision being surfaced first. The outcome (retire the claim) happens to match what v4 itself recommended, so this PRD does not ask you to reverse it. It does require a rule change so this doesn't happen again on the next ambiguous call, see Section 6.
4. **Skills catalog count disagrees with itself.** `CHANGELOG.md` [0.6.0] claims the catalog was "regenerated to include all 10 skills... `okhp3-mermaid-governance` v1.1.0 and `okhp3-skill-promotion` v0.1.0 added." The live Reference tab shows 9. A changelog entry describing work the shipped product doesn't reflect is exactly the failure mode PRD v4 existed to eliminate, and it recurred inside the sprint meant to fix it.

**The mandate for this sprint:** close item 1 for real, with actual measured data behind it, not a second unverified doc. Correct the process for items 2 and 3 so they don't recur. Reconcile item 4 to one true number across all three surfaces. Then, and only then, re-run the v1.0.0 declaration gate.

---

## 1. Ground Rules

Same standing rules as v4, restated because item 1 above exists specifically because a prior "STOP for GO" was not honored:

- Personal OverKill Hill P³ project. No Builders FirstSource branding, examples, or affiliation, anywhere, ever.
- Static, browser-only. No backend, no accounts, no AI API calls, no telemetry beyond what's already shipped and documented.
- **Phase-gated execution.** Finish a phase, produce the evidence artifact it calls for, stop, and wait for explicit "GO" before starting the next phase. Phase 1 is read-only: no code changes, no warning-logic changes, nothing that touches the export pipeline.
- **A STOP gate that isn't actually cleared is a failure, not a formality.** If Phase 1 measurement work is incomplete, say so plainly and do not start Phase 2. Do not ship a partial answer under a "Phase 2 build" changelog entry.
- **Every "done" claim needs a check, not a sentence.** A grep pattern, a test file, a screenshot, a logged measurement, a passing fixture. If you can't point to evidence, it isn't done, it's a plan.
- **Do not invent numbers.** Where a limit, version cutoff, or count hasn't been measured, say so and log it as unverified. Do not fill the gap with a plausible-sounding number.
- **Claude, not Replit, owns Notion.** Nothing in this PRD asks Replit to write to Notion. Repo-side evidence artifacts only, per Section 5.

---

## 2. Definition of Done

All of the following must be independently true and checkable before any surface claims v1.0.0 or "production release":

| # | Requirement | Status entering this sprint |
|---|---|---|
| 1 | Renderer-aware length-safety warning fires correctly, using real measured data, not an unverified placeholder | Not implemented. Confirmed by direct test: 597-char init directive, GitHub target, no warning |
| 2 | `docs/renderer-frontmatter-compatibility.md` contains measured or explicitly-labeled-unverified data per renderer, not a blanket "unverified, needs manual testing" disclaimer covering the whole document | Currently the latter |
| 3 | Skills catalog count agrees across `scripts/gen-skills-readme.py` output, the live Reference tab, and `CHANGELOG.md`'s stated additions | Disagrees: changelog claims 10, live app shows 9 |
| 4 | A repo-side evidence log exists in a format Claude can mechanically read and sync into Notion, replacing the abandoned ask for Replit to update Notion directly | Does not exist |
| 5 | Any future ambiguous product decision explicitly reserved for Jamie in a PRD gets flagged and held, not resolved unilaterally | No mechanism currently enforces this |
| 6 | Version tag and changelog reflect actual verified shipped state, including this sprint's corrections | Partially true; 0.6.0 bump is real but the [0.6.0] changelog entry overstates the skills-catalog and length-safety work |

Items 1-2 are Phase 2 engineering work, gated by Phase 1. Item 3 is a Phase 2 doc/generator fix. Items 4-5 are process corrections, Section 5 and 6. Item 6 closes in Phase 4.

---

## 3. Phase 1 — Discovery & Validation (Read-Only) — STOP for GO

No code changes in this phase. Produce `docs/frontmatter-length-safety-measurements.md` and stop for explicit GO before Phase 2. This is the phase v4 asked for and did not get. The instruction below is more prescriptive than v4's, specifically because "measure it against live renderers" turned out to be impractical to actually execute and got skipped as a result. This version gives a method that is actually runnable inside this environment.

### P1-01: Measure init-directive length ceilings against real Mermaid parser versions

The mechanism worth measuring is not "does GitHub reject long lines," it's "does a given Mermaid core version's directive parser reject long lines." That's a property of the `mermaid` npm package itself, testable headlessly, without needing live access to GitHub/GitLab/Notion/Confluence's actual rendering pipelines.

**Method:**

1. In a scratch harness (not the app itself), install at minimum three pinned versions of the `mermaid` package via separate scratch directories or a version-matrix script: one pre-10.0 (representative of renderers still on an old pinned core, for example `8.14.x`), one early-frontmatter-era (`10.5.x` to `10.9.x`), and current (`11.16.x`, matching what the app itself ships).
2. Generate test fixtures: single-line `%%{init: {...}}%%` directives with realistic `themeVariables` payloads, stepped from 100 characters to 600 characters in 50-character increments (100, 150, 200, ..., 600). Reuse a real generated payload shape from `theme-engine.ts`'s `buildFrontmatter()`, not synthetic filler text, so the fixture matches what the app actually emits.
3. For each pinned version, run each fixture through that version's `mermaid.parse()` (headless, Node, no browser needed) and record pass/fail.
4. Separately, for each renderer profile in `src/data/renderer-parity.ts`, record the Mermaid core version it's documented or observed to pin (release notes, public docs, prior audit notes), and cross-reference against step 3's results to derive a safe-length estimate per renderer. Where a renderer's actual pinned version can't be determined with confidence, say so explicitly and mark that renderer's row "unverified: pinned version unknown" rather than guessing or omitting it.
5. Rewrite `docs/renderer-frontmatter-compatibility.md`'s length-ceiling data with this measured table: Renderer | Mermaid version (pinned, sourced) | Frontmatter supported | Init-directive safe length (measured against that version) | Confidence (measured directly / derived from version match / unverified).

This directly tests Jamie's original field observation (failures cluster above roughly 200 characters on pre-10.0 parsers, largely absent on 11.x) against real parser behavior rather than leaving it as an anecdote. If the measured data contradicts the ~200 figure, report the actual numbers. Do not anchor to 200 if the data says otherwise.

### P1-02: Reconcile the skills catalog count

Three surfaces currently disagree: `scripts/gen-skills-readme.py`'s generated output (last run showed 8), the live Reference tab (shows 9), and `CHANGELOG.md`'s [0.6.0] entry (claims 10, naming `okhp3-mermaid-governance` and `okhp3-skill-promotion` as additions).

**Task:** enumerate the actual skill folders on disk (wherever the generator and the Reference tab both source from), confirm which of the two named additions actually exist as real, complete skill packages in the repo versus being planned-but-not-added, and report the true count with a one-line cause for each surface's discrepancy (generator excludes X because Y; Reference tab counts Z separately because W). Do not fix the generator yet, that's Phase 2, this task is diagnosis only.

### P1-03: Confirm the Neutral Enterprise removal is final and complete

Per Section 0, item 3: this PRD is not asking you to reverse the removal, since it matches v4's own recommendation. Confirm there are no remaining half-references anywhere (docs, in-app copy, capability registry, prompt scaffold text) so this doesn't surface as a sixth inconsistency later. Report a clean list of what was checked and what, if anything, still references it.

**STOP. Post the P1 findings doc. Wait for explicit GO before Phase 2.**

---

## 4. Phase 2 — P0 Fixes

Do not start this phase without a GO on Phase 1 findings. P2-01 below is directly downstream of P1-01's measured data; building it against unverified numbers is the exact mistake this PRD exists to correct.

### 4.1 Renderer-Aware Length-Safety Warning

Full spec, using P1-01's measured ceilings:

**Trigger.** Whenever the app is about to emit an init-directive output (Styled Code, Code tab default view, `Download > .mermaid`, or any export surface using init-directive format, whether by user choice or because the selected TARGET renderer doesn't support frontmatter), compare the generated directive's length against the TARGET renderer's measured or derived safe-length ceiling from `docs/renderer-frontmatter-compatibility.md`.

**Three-tier response, in priority order:**

1. **Safe** (under the measured ceiling, or comfortably under with margin): no warning, no interruption.
2. **Caution** (approaching or at the measured ceiling): if the TARGET renderer supports YAML frontmatter, offer to switch format automatically, user can decline. If it doesn't, show a specific warning naming the actual renderer and the actual measured number from P1-01 (for example: "This directive is 340 characters. [Renderer]'s Mermaid [version] core has shown parse failures above [measured number] characters on a single init line in our testing. Consider Format B (YAML frontmatter) if your target supports it, or trim theme keys.").
3. **Unverified renderer** (P1-01 couldn't pin the renderer's version with confidence): softer, honestly-hedged warning, same as v4 originally specified: state plainly that the limit for this specific renderer hasn't been empirically confirmed, cite the general pattern as a field observation, and suggest manual verification.

**Never** silently truncate, minify past readability, or corrupt the directive to force it under a limit without telling the user what was cut.

**Verification requirement for this task specifically, since this is the item that shipped incomplete once already:** before marking this done, reproduce the exact test that found the gap: generate a directive of 500+ characters, select GitHub as TARGET, and confirm a warning actually appears in the running app, not just in a unit test. Screenshot or equivalent evidence required.

This is a completion of `TASK-FRONTMATTER-01`, not a new task ID.

### 4.2 Skills Catalog Reconciliation

Per P1-02's diagnosis. Fix whichever surface is wrong (generator exclusion logic, Reference tab source, or the changelog's overstated claim) so all three agree on one true number. If `okhp3-skill-promotion` genuinely doesn't exist as a complete skill package yet, correct `CHANGELOG.md`'s [0.6.0] entry to stop claiming it was added, rather than adding a rushed skill just to make the number match. Truth of the count matters more than which number it lands on.

---

## 5. Phase 3 — Evidence Log for Notion Sync (Corrected Scope)

PRD v4 asked Replit to update "Notion hub + Roadmap Tasks database" directly. That was wrong scope: this repo and Replit's working environment have no Notion write access, and that should have been caught in v4 rather than left as a silently-failed requirement.

**Corrected task:** produce `docs/evidence-log-v5.md` (or `.json`, whichever is easier to generate reliably) containing one entry per PRD line item, each with: item ID, one-line status, and a pointer to its evidence (file path, test name, doc section, or measured table row). This is the same discipline as the v4 Phase 5 checklist, just captured in a format Claude can read directly and use to update the Notion Roadmap Tasks database in a separate step, without needing repo write access to Notion.

Also update in this phase, same as v4 Phase 3 intent:

- `docs/renderer-frontmatter-compatibility.md` (already covered by P1-01/4.1)
- `README.md` Exports and Agent Skill sections, if the skills count changed
- `docs/roadmap.md` and `CHANGELOG.md`, logging this sprint's actual work under a real entry, correcting the [0.6.0] entry's overstated skills claim in place rather than leaving it standing alongside a corrected number elsewhere

Do not attempt to write to Notion, Slack, email, or any external system. Repo files only.

---

## 6. Phase 4 — Decision Escalation Rule (Process Fix)

PRD v4 explicitly reserved the Neutral Enterprise call for Jamie and it got resolved unilaterally anyway. The outcome was fine; the process wasn't, and the next ambiguous call might not land fine by accident.

**Rule, effective this sprint forward:** any PRD line item phrased as "present the tradeoff, don't decide silently," "Jamia's call, not an engineering default," or equivalent, gets logged to a new file, `DECISIONS_NEEDED.md` at repo root, with the question and both options stated plainly, instead of being resolved in the same sprint. Do not act on it until that file is reviewed and a decision comes back. If no such item exists in a given sprint, `DECISIONS_NEEDED.md` simply doesn't get created or stays empty, no action needed.

Also cut a real version bump reflecting the state after Phases 2-3 land (likely a 0.6.1 or 0.6.2 patch/minor, given the scope here is narrower than a full version-era shift), and update `CHANGELOG.md` with an entry that only claims what's actually verified. No entry should describe work that the live app doesn't reflect. That's the specific failure this whole PRD exists to close out.

---

## 7. Phase 5 — v1.0.0 Declaration Checklist (Final Gate, Updated)

Every box needs a link to its evidence before any surface anywhere says v1.0.0 or "production release." Items carried forward unchanged from v4 are marked; items new to v5 are marked.

- [x] Extract mode functional for both frontmatter styles — **closed, v4, verified hands-on 2026-08-05**
- [x] Dual frontmatter generation available across export surfaces — **closed, v4, verified hands-on 2026-08-05**
- [x] Stroke/border width control — **closed, v4, verified hands-on 2026-08-05**
- [ ] Renderer-aware line-length safety fires correctly with real measured data (evidence: P1-01 measurement table + 4.1's reproduced live-app test) — **v5, still open**
- [x] Phantom palette resolved — **closed, v4, confirmed clean in P1-03**
- [ ] Skills catalog count agrees across generator, live app, and changelog (evidence: P1-02 + 4.2) — **v5, still open**
- [ ] Evidence log exists in a Claude-readable format for Notion sync (evidence: `docs/evidence-log-v5.md`) — **v5, still open**
- [ ] Version tag and changelog reflect only verified work, no overstated claims (evidence: the tag itself, corrected changelog entry) — **v5, still open**
- [ ] `DECISIONS_NEEDED.md` mechanism exists and is empty or resolved (evidence: file present, no pending items) — **v5, still open**

v1.0.0 is not declared until every box above is checked with evidence. Given the narrower scope of what's left, this sprint is realistically a v0.6.x or v0.7.x closure, not a v1.0.0 jump by itself, unless the Phase 5 review at close concludes otherwise with evidence to back it. Evaluate honestly rather than defaulting to either answer.

---

## 8. Explicit Non-Goals For This Sprint

- No rework of Extract mode, the dual-frontmatter toggle, or the stroke-width control. All three are confirmed working. Touching them risks regression for zero benefit.
- No mobile/Capacitor/app-store work. Out of scope, tracked elsewhere.
- No backend, accounts, or AI API calls. Permanently out of scope per `docs/roadmap.md`.
- No BFS-related anything. Standing rule, restated for emphasis.
- No opportunistic rewrites of working code encountered while in a file for an unrelated reason.
- No direct Notion, email, or external-system writes from this environment. Repo files only, per Section 5.

---

## 9. Appendix: Evidence Log (For Traceability)

Condensed from the 2026-08-05 re-verification; full detail lives in this conversation's audit trail.

- Live build `v0.6.0-3eb58e9` deployed and current as of 2026-08-05.
- Extract mode: tested with both a YAML frontmatter fixture and an `%%{init}%%` fixture, both correctly detected, extracted, previewed, and offered via "Use extracted theme in Apply tab." Passes.
- Dual-frontmatter toggle: tested on the Apply tab, produces well-formed YAML frontmatter output when toggled from the default init-directive format. Passes.
- Stroke-width control: confirmed present in Compose > Look, "Default | 1px | 2px | 3px | 4px" button group, matches `CHANGELOG.md`'s description exactly. Passes.
- Length-safety warning: tested with a 597-character single-line `%%{init}%%` directive, TARGET renderer set to GitHub via the renderer selector. No warning appeared. Fails.
- `docs/renderer-frontmatter-compatibility.md`: exists, but its own text states length ceilings are "unverified... require manual testing before Phase 2 implementation," meaning the Phase 1 STOP gate from v4 was not actually cleared before Phase 2 build work on this item proceeded.
- Notion Roadmap Tasks database: all six v4-tracked rows (`TASK-FRONTMATTER-01`, `TASK-EXTRACT-01`, `TASK-EXPORT-01`, `TASK-054-01`, `TASK-VER-01`, `TASK-SKILL-01`) still carry Claude's pre-sprint timestamps. Replit made no writes, consistent with having no Notion access, which v4 should have accounted for and didn't.
- `CHANGELOG.md` [0.6.0] entry: states the Neutral Enterprise references were "removed from planning documents... never implemented in code," a unilateral resolution of a decision v4 explicitly reserved for Jamie. Outcome matches v4's own recommendation, so not reversed here, but the process gap is real and addressed in Section 6.
- `CHANGELOG.md` [0.6.0] entry also claims "regenerated to include all 10 skills... `okhp3-mermaid-governance` v1.1.0 and `okhp3-skill-promotion` v0.1.0 added." Live Reference tab shows 9 skills, unchanged from pre-sprint. Discrepancy confirmed, cause not yet diagnosed, that's P1-02.
- Family count (31) and renderer count (8) in the live Reference tab: unchanged from pre-sprint state, no regression, not part of this sprint's scope.
