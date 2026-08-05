# Replit PRD v4 — Truth-and-Capability Closure Sprint to a Defensible v1.0.0

**Project:** Mermaid Theme Builder (OKHP3/mermaid-theme-builder)
**Author:** Claude, on Jamie's behalf, from two ground-truth audits run 2026-08-04
**Status:** Ready to paste. Phase-gated. Do not skip STOP gates.
**Supersedes:** Nothing directly, but should be read alongside `docs/roadmap.md` v0.6.0/v0.7.0 sections, which this sprint reprioritizes.

---

## 0. Why This PRD Exists — Read This Before Touching Code

Two audits ran against this repo and the live app on 2026-08-04. The first read the docs, changelog, and Notion tracker and found them stale against the actual git history (700 commits past the v0.5.0 tag, deployed continuously, undocumented). The second stopped reading docs entirely and used the live app hands-on: pasted real Mermaid source, read actual export output, triggered real renderer warnings, opened every panel.

The second audit is the one that matters for this PRD. It found the product is functionally past its own original v1.0 bar in most respects, and *exceeds* several v1.0-era requirements outright (per-tier typography with font overrides, a clickable in-diagram attribution badge, an 8-format Download menu, dual-format prompt scaffolding). It also found two real, verifiable defects, not documentation gaps: Extract mode is broken, and the "Neutral Enterprise" default palette was never built. Everything else is either done, exceeded, or genuinely still open per the existing roadmap.

**The mandate for this sprint:** close every verified gap, in the priority order below, until the product can claim v1.0.0 (or beyond) without a single hedge, and can *prove* that claim against a checklist rather than assert it in prose. Do not gloss over what's still broken. Do not undersell what's already exceeded.

---

## 1. Ground Rules

These are standing rules for this repo, restated because they apply to every phase below:

- Personal OverKill Hill P³ project. No Builders FirstSource branding, examples, or affiliation, anywhere, ever.
- Static, browser-only. No backend, no accounts, no AI API calls, no telemetry beyond what's already shipped and documented.
- **Phase-gated execution.** Finish a phase, produce the evidence artifact it calls for, stop, and wait for explicit "GO" before starting the next phase. Phase 1 in particular is read-only: no code changes.
- **Every "done" claim needs a check, not a sentence.** A grep pattern, a test file, a screenshot, a logged measurement. If you can't point to evidence, it isn't done, it's a plan.
- **Do not invent numbers.** Where this PRD references a limit, a version cutoff, or a count that hasn't been measured yet, it says so explicitly and assigns a discovery task. Do not fill that gap with a plausible-sounding number of your own. Report what you measured, including "inconclusive."

---

## 2. Definition of Done: What "v1.0.0, Honestly Claimed" Means Here

All of the following must be independently true and checkable before any copy anywhere claims v1.0.0 or "production release":

| # | Requirement | Status entering this sprint |
|---|---|---|
| 1 | Extract mode works for diagrams with an existing theme directive, of either format | Broken (confirmed 2026-08-04) |
| 2 | The app can detect, preserve, and generate *both* Mermaid frontmatter styles (`%%{init}%%` and YAML `---` config) | Not handled at all today |
| 3 | Output generation is renderer-aware enough that it does not hand a user a directive likely to fail on their stated target | Partially true (warnings exist for look/font support; not for frontmatter format or line length) |
| 4 | Default palette claim matches what's actually shipped | False (Neutral Enterprise doesn't exist) |
| 5 | Stroke/border width is either controllable or not claimed anywhere | Unconfirmed, treat as open |
| 6 | README, project page, and Notion all describe the same product the live app is | False today on multiple counts (family count, skill count, export format count) |
| 7 | Version tag reflects actual shipped state | False (v0.5.0 tag, 700 commits of undocumented drift) |
| 8 | No open P0/P1 in the Roadmap Tasks database without an explicit, logged deferral decision | Several open |

Line items 1-5 are Phase 2 engineering work. 6-7 are Phase 3-4. 8 is the closing gate in Phase 5.

---

## 3. Phase 1 — Discovery & Validation (Read-Only) — STOP for GO

No code changes in this phase. Produce a findings document (`docs/frontmatter-compatibility-findings.md`) and stop for explicit GO before Phase 2.

### P1-01: Build the real renderer/frontmatter compatibility matrix

This is the load-bearing task of the whole PRD. Jamie's own field observation, not a documented Mermaid spec limit: diagrams styled with the `%%{init: {...}}%%` directive can fail to parse on renderers running an older, pinned Mermaid core when the directive line gets long, roughly in the neighborhood of 200 characters, and this problem tends to disappear on renderers running Mermaid 11.x. Mermaid's own docs confirm the mechanism this sits on top of but not the number:

- The `%%{init}%%` directive has been **deprecated since Mermaid v10.5.0** in favor of YAML frontmatter's `config` key. It still works; it's not removed.
- YAML frontmatter (`---` block with a `config` key) was **introduced in v10.5.0** as the forward-looking replacement.
- Mermaid's own documentation does not state a character or line-length limit for the init directive. If a limit exists, it is a property of a *specific renderer's pinned Mermaid version or embedding pipeline* (GitHub, GitLab, Notion, Confluence, and similar all pin and lag core Mermaid independently), not of the Mermaid spec itself.

So: do not hardcode "200." Measure it, per renderer, and only then encode it.

**Task:** for every renderer profile already tracked in `src/data/renderer-parity.ts`, plus whichever 8th renderer the live Reference tab already counts that the README's 7-item list is missing, plus Microsoft Loop if it's being added in this sprint (see P1-04):

1. Record the Mermaid core version that renderer is actually running or pinned to, as best determinable (changelog/release notes for that platform's Mermaid integration, or direct inspection where feasible).
2. Record whether that version supports YAML frontmatter config at all (i.e., is it ≥ 10.5.0).
3. For renderers where frontmatter isn't supported and init-directive is the only option: generate test fixtures of increasing `%%{init}%%` line length (start at 100 characters, step by 50, up to at least 500) with realistic themeVariables payloads, and determine the actual failure point for that renderer where feasible to test directly (`mmdc` pinned to the matching version is the most reliable path; where a renderer can't be tested headlessly, note that explicitly and mark the finding "unverified, needs manual confirmation" rather than guessing).
4. Write the results into `docs/renderer-frontmatter-compatibility.md` as a table: Renderer | Mermaid version (pinned/typical) | Frontmatter supported | Init-directive safe length (measured) | Confidence (measured / manually confirmed / unverified).

If a given renderer's real limit can't be pinned down this pass, that's an acceptable outcome. Log it as unverified with a clear note, don't leave it silently absent from the table.

### P1-02: Diagnose why Extract mode isn't routed

`ExtractTab.tsx`, `ExtractDiffHint.tsx`, and `extractTabEmptyState.test.tsx` all exist in the repo. `#extract` falls back to Compose in the live app. Determine: is this a removed nav entry, an incomplete refactor, a feature flag left off, or something else. Report the actual cause. Do not fix yet, that's Phase 2.

### P1-03: Confirm stroke/border width control state

Check `Compose > Colors` and `Compose > Typography` (and anywhere else plausible) for any existing stroke-width or border-width control. Report exactly what exists, if anything, with a screenshot or component reference. This closes an unconfirmed item from the capability audit either way.

### P1-04: Identify the 8th renderer and confirm Microsoft Loop's real status

The live Reference tab's Renderer Parity Matrix counts 8 renderers; the README names 7 (mermaid.live, GitHub, GitLab, Notion, Obsidian, Confluence, CLI). Identify the 8th from `renderer-parity.ts` directly. Separately: the in-app Prompt Scaffold copy already mentions "Microsoft Loop" as a compatibility target, but `docs/roadmap.md`'s v0.6.0 checklist still lists "Microsoft Loop / M365 Copilot renderer profile" as unchecked. Determine whether it's genuinely registered in `renderer-parity.ts` or just mentioned in scaffold copy without real parity data behind it, and report which.

### P1-05: Decide the fate of "Neutral Enterprise"

Search git history for any prior implementation of a palette by this name. If it never existed, this PRD recommends retiring the claim rather than building a palette to satisfy a stale requirement, but that's Jamie's call, not an engineering default. Report findings and present both options (build it / retire the claim) for a decision before Phase 2 starts on this item.

**STOP. Post the P1 findings doc. Wait for explicit GO before Phase 2.**

---

## 4. Phase 2 — P0 Capability Fixes

Do not start this phase without a GO on Phase 1 findings, since P1-01's measured data directly determines what P2-01 below actually builds.

### 4.1 Dual Frontmatter: Detection, Extraction, and Renderer-Aware Generation

This is the core engineering item Jamie asked for by name. Full spec:

**Detection.** On paste (Apply tab) and on any code ingestion path, parse the leading content for:
- A YAML frontmatter block: content starts with `---`, a YAML document, then a closing `---`, optionally containing a `config` key.
- A `%%{init: {...}}%%` directive: a comment-style directive line (which may itself span multiple lines; Mermaid's own docs show both single-line and multi-line forms as valid) appearing before the diagram body.
- Neither.
- Per Mermaid's own precedence rules, if both are somehow present, frontmatter takes precedence. The detector must not silently prefer one over the other on its own logic; mirror Mermaid's actual precedence.

**Extraction (this is what "fixes" Extract mode, properly, not just re-routes a tab).** When either format is detected, parse out the actual theme values it sets (colors, fonts, look, whatever it declares) and present the user a real choice, not a blind overwrite:
- **Import as new custom palette** — the original, documented Extract mode behavior from changelog v0.2.0. This path has been missing since at least this audit; restore it as a first-class, working option.
- **Replace with currently selected palette** — today's only behavior. Keep it; it's valid when the user genuinely wants to re-theme, not extract.

Do not remove the replace path to add the extract path. Users need both, and need to be asked which they want rather than have the app assume.

**Generation.** Every surface that emits a fully themed diagram (the "Styled Code" toolbar button, the Code tab's default view, `Download > .mermaid`) currently hardcodes init-directive output. The Prompt Scaffold modal already offers Format A (init) vs Format B (YAML frontmatter) vs both, which proves the underlying generator logic for both formats already exists somewhere in the codebase. Wire that same choice into every export surface, not just the scaffold modal. Default the choice based on the selected TARGET renderer's measured frontmatter support from `docs/renderer-frontmatter-compatibility.md` (Phase 1 output): frontmatter by default where supported and preferred, init-directive by default where it isn't, always overridable by the user.

**Renderer-aware safety for init-directive output.** When the app is about to emit an init-directive (because the user chose it, or because the target renderer doesn't support frontmatter) and the target renderer has a measured or manually-confirmed safe-length ceiling from Phase 1 that the generated directive would exceed, apply this priority order:

1. If the target renderer *does* support frontmatter, offer to switch format automatically (with the user able to decline).
2. If it doesn't, or the user declines, show a specific warning naming the actual renderer and the actual measured number from Phase 1 (for example: "This directive is 340 characters. GitHub's pinned Mermaid renderer has shown parse failures above roughly 210 characters on a single init line in our testing. Consider Format B (YAML frontmatter) if your target supports it, or trim theme keys.") — not a generic "may not work" banner.
3. Never silently truncate, minify past readability, or corrupt the directive to force it under a limit without telling the user what was cut.

If Phase 1 comes back with "unverified" for a given renderer's length ceiling, this feature should still surface a softer, honestly-hedged warning for that renderer ("length limits for this renderer haven't been empirically confirmed; directives over ~200 characters have caused failures on similarly-pinned renderers, verify manually if you hit issues") rather than staying silent. Cite it as Jamie's field observation if that's genuinely the only basis, don't dress it up as measured fact where it isn't.

**This is new scope.** Log it as its own line in `docs/roadmap.md`, separate from the existing (already largely shipped) v0.6.0 items. Suggested id: `TASK-FRONTMATTER-01` in the Roadmap Tasks database, Release Band v0.6.x, Priority P0.

### 4.2 Extract Mode Routing

Depends on P1-02's root-cause finding. If it's a missing nav entry or a disconnected route, restore it, either as a dedicated tab (matching the original design, which the in-app mindmap example itself still lists as a peer of Apply/Compose) or as an inline mode within Apply (acceptable alternative if that's a cleaner integration with the 4.1 work above — Jamie's call if both are viable, present the tradeoff rather than picking silently). This must ship together with 4.1's extraction logic since they're the same feature.

### 4.3 Resolve the Phantom Default Palette

Per the Phase 1 P1-05 decision: either build "Neutral Enterprise" (spec if chosen: neutral grayscale, WCAG AA contrast minimum, no brand personality, positioned as the true zero-state default before a user picks a brand palette) or strike every remaining reference to it. Do not leave it half-referenced anywhere after this phase closes.

### 4.4 Stroke/Border Width Controls

Per P1-03's finding. If missing: implement, matching the existing per-tier stepper pattern already used for font size in Compose > Typography (numeric stepper, live preview swatch). If found to already exist: this task closes with a pointer to where, and the capability audit gets corrected.

---

## 5. Phase 3 — Documentation Truth Sync

Only start once Phase 2 has shipped and its own acceptance checks pass. Update, in this order:

1. **README.md** — family count (31, cite the 21-supported/10-gap split), renderer count (name the 8th from P1-04), skills catalog (re-run `scripts/gen-skills-readme.py`, confirm Governance v1.1.0 appears, confirm the count matches the live Reference tab), Exports section (document the full Download menu: `.mermaid`, `.md`, `.txt`, `.svg`, `.png`, `.theme.json`, `.css`, `.bundle.json`, not just the 3 toolbar buttons), Extract mode (document what it actually does post-4.1/4.2, don't leave the old description in place unchanged), Agent Skill section (mention the dual frontmatter capability from 4.1 as a skill-relevant detail if the skill logic changed).
2. **overkillhill.com project page** — this is `TASK-054-01` in the tracker, already P0 and still open as of the last audit. Once the app itself reflects this sprint's work, the project page needs the same truth-alignment pass it's been waiting on since a June 2026 PRD that was never executed. Don't repeat that failure mode here.
3. **docs/roadmap.md and changelog.md** — log this sprint's actual shipped work under a real version entry (see Phase 4), not folded silently into the existing unreleased v0.6.0 block.
4. **Notion hub + Roadmap Tasks database** — close out the tasks this sprint resolves (`TASK-EXTRACT-01`, the new `TASK-FRONTMATTER-01`, `TASK-EXPORT-01`, `TASK-054-01`, and whichever DOC-0x/DRIFT-0x rows this sprint's README pass resolves) with the same evidence-over-assertion standard used throughout this PRD.

---

## 6. Phase 4 — Version and Release Policy

1. Cut a real version tag reflecting the state after Phases 2-3 land. Given the scope of this sprint (Extract mode restored, dual-frontmatter support shipped, all known doc drift closed), evaluate honestly whether the result clears v1.0.0 outright rather than defaulting to v0.6.0 out of habit. That evaluation is the whole point of this PRD; don't skip it.
2. Establish a going-forward policy so the repo doesn't drift 700 commits past a tag again silently. Two acceptable options, pick one and document it in `AGENTS.md` or `docs/roadmap.md`:
   - **Cadence tagging:** bump the patch/minor version on every notable feature merge, not just at the end of a sprint.
   - **Rolling-release labeling:** keep infrequent version tags, but add a visible "last verified" date badge (already have the infrastructure for this via `Tool Updated` metadata embedded in exports) so the version number stops being read as a freshness signal it was never meant to carry.

---

## 7. Phase 5 — v1.0.0 Declaration Checklist (Final Gate)

Every box needs a link to its evidence (a test file, a doc diff, a measured table row) before any surface anywhere is allowed to say v1.0.0 or "production release."

- [ ] Extract mode functional for both frontmatter styles (evidence: passing test fixtures for both formats)
- [ ] Dual frontmatter generation available on every export surface, defaulting by target renderer (evidence: `docs/renderer-frontmatter-compatibility.md` + wired defaults in each export path)
- [ ] Renderer-aware line-length safety in place, or an explicit, reasoned decision that a specific renderer is out of scope (evidence: the compatibility doc, no silent gaps)
- [ ] Phantom palette resolved, built or formally retired (evidence: P1-05 decision + implementation or doc strike)
- [ ] Stroke/border width resolved, built or confirmed pre-existing (evidence: P1-03 finding + any resulting component)
- [ ] README, project page, and Notion all agree with the shipped app (evidence: spot-check against this sprint's own audit trail)
- [ ] Skills catalog regenerated and accurate, including Governance v1.1.0 (evidence: regenerated table, timestamp current)
- [ ] Version tag matches actual commit/feature state (evidence: the tag itself, changelog entry)
- [ ] No open P0/P1 in the Roadmap Tasks database without a logged deferral decision (evidence: database query)

---

## 8. Explicit Non-Goals For This Sprint

- No mobile/Capacitor/app-store work. Legitimately future scope, tracked elsewhere in the v0.6.x/v1.x band.
- No backend, accounts, or AI API calls. Permanently out of scope per `docs/roadmap.md`; this PRD does not reopen that.
- No BFS-related anything. Standing rule, restated for emphasis, not because there's any indication it's at risk.
- No opportunistic rewrites of working code paths encountered while in a file for an unrelated reason. Touch what this PRD scopes, nothing else, unless a Phase 1 finding specifically calls for it.

---

## 9. Appendix: Evidence Log (For Traceability)

Condensed from the 2026-08-04 audits; full detail lives in the Notion Roadmap Tasks database under `AUDIT-2026-08-04` and `AUDIT-2026-08-04-DEEP`.

- Live build `v0.5.0-dc139d3` deployed and current as of 2026-08-04; 700 commits past the `v0.5.0` tag per `git log v0.5.0..HEAD`.
- Reference tab: 31 diagram families (21 supported, 10 tracked gaps), 9 Agent Skills (README's generated catalog showed 8, missing `okhp3-mermaid-governance` v1.1.0).
- Download menu: 8 real file formats (`.mermaid`, `.md`, `.txt`, `.svg`, `.png`, `.theme.json`, `.css`, `.bundle.json`), none of it in the README's Exports section.
- Prompt Scaffold: dual-format (init directive / YAML frontmatter / both) already implemented in that one modal, not wired anywhere else.
- Extract mode: pasting code with an existing `%%{init}%%` block triggers "applying this theme will replace it" and overwrites, rather than offering extraction. `#extract` falls back to Compose. `ExtractTab.tsx` and its tests exist in the repo.
- "Neutral Enterprise" default palette: absent from the live palette bar (My Theme 1, OKHP3, Glee-fully, AskJamie, Ocean Depth, Forest Sage, Slate Ember, Violet Mist only).
- Renderer-target warnings verified real and specific: switching to GitHub + Neo look surfaced "GitHub has partial Neo look support" and "Custom fontFamily is blocked on GitHub, system font fallback will apply," both accurate to GitHub's actual Mermaid embedding constraints.
- Compose Typography: 5-tier hierarchy with per-tier font overrides confirmed, exceeding the original V1.0 PRD's single "font selection" requirement.
- Mermaid frontmatter facts (mermaid.js.org, fetched 2026-08-04): init directive deprecated since v10.5.0 in favor of YAML frontmatter's `config` key; frontmatter introduced in v10.5.0; no documented line-length limit in Mermaid's own spec. Any observed length limit is a property of a specific renderer's pinned Mermaid version, not the Mermaid spec, per Jamie's field observation, to be measured per-renderer in Phase 1 rather than assumed.
