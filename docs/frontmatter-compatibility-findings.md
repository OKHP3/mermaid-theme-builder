# Phase 1 Discovery Findings

> **Classification:** Gate document — Phase 2 engineering work is blocked until Jamie
> issues an explicit GO after reviewing this document.
>
> **Date produced:** 2026-08-04
> **Task:** #594 — Phase 1 Discovery & Validation (read-only)
> **Rule:** No code was changed. Every finding is evidence-first.

---

## Summary table

| Sub-task | Finding | Decision required? |
|---|---|---|
| P1-01 | Frontmatter support established per renderer; `%%{init}%%` length limits are unverified — mmdc unavailable | **Yes — manual testing needed for Notion, Confluence, Loop before Phase 2 hardcodes warnings** |
| P1-02 | Extract mode is NOT broken — it was deliberately embedded in Compose (commit `39da44a`, 2026-05-23). `#extract` hash falls back to Compose because "extract" was removed from AppTab. | **Yes — decide: restore dedicated tab OR accept embedded location** |
| P1-03 | Stroke/border-width numeric control is confirmed **absent** from ComposeTab, ApplyTab, palette schema, and theme-engine init directive. | No code decision needed — absence is confirmed. Phase 2 scope is now clear. |
| P1-04 | m365-loop profile is fully implemented. Half of the roadmap item is done (registered); the other half (Reference tab matrix) is also done automatically. README is the only surface that still lists 7 renderers. | **Minor** — roadmap.md item can be ticked off; README needs updating in Phase 3. |
| P1-05 | "Neutral Enterprise" palette has never existed in the codebase. References are only in PRD planning documents. | **Yes — Jamie must choose Option A (build it) or Option B (retire the claim) before Phase 2 begins.** |

---

## P1-01 — Renderer / frontmatter compatibility matrix

**Full table:** see [`docs/renderer-frontmatter-compatibility.md`](renderer-frontmatter-compatibility.md)

### Key determinations

YAML frontmatter (`---` block with `config:` key) was introduced in Mermaid **10.5.0**
(2023-10-24). Any renderer on an older version silently ignores the frontmatter block.

**Renderers where frontmatter is supported (high/medium confidence):**
- `mermaid-live` — always latest; always supported.
- `github` — running 11.x; frontmatter confirmed by GitHub Docs.
- `gitlab` (cloud) — running 11.x; supported. Self-hosted: unverified.
- `obsidian` (built-in) — running 11.x; supported. Older installs: unverified.
- `cli` — supported when installed version ≥ 10.5.0.

**Renderers where frontmatter is NOT recommended or unverified:**
- `notion` — "10.x (pinned, rarely updated)"; even init directives are only partial; frontmatter unverified. Prefer `%%{init}%%`.
- `confluence` — entirely plugin-dependent; "often 10.x"; unverified. Prefer `%%{init}%%`.
- `m365-loop` — renderer-parity.ts notes explicitly: "Prefer the `%%{init}%%` directive over YAML frontmatter — Loop may not process frontmatter reliably in all versions." Prefer `%%{init}%%`.

### `%%{init}%%` safe-length measurements — UNVERIFIED

`mmdc` (Mermaid CLI) was not available in the Phase 1 environment and could not be
installed headlessly. **No `%%{init}%%` directive length measurements were taken.**

All length values in Phase 2 warning logic must either:
1. Come from manual testing against each target renderer using the test fixtures defined
   in `docs/renderer-frontmatter-compatibility.md`, **or**
2. Be labelled as "field observation — unverified" in any warning text they appear in.

**Phase 2 must not hardcode "200 characters" or any other limit as a measured fact.** The
`%%{init}%%` directive for a full MTB palette (13 themeVariables) is approximately 500–600
characters. Whether this causes rendering problems on Notion, Confluence, or Loop has not
been measured.

### Recommended Phase 2 action

Implement a renderer-aware format picker that:
- Defaults to `%%{init}%%` for renderers where frontmatter is not recommended (Notion,
  Confluence, M365/Loop).
- Defaults to frontmatter for renderers where it is confirmed (GitHub, GitLab cloud,
  Obsidian, mermaid-live).
- Surfaces a warning for the unverified renderers noting that the limit is a field
  observation, not a measured fact, and links to the relevant renderer caveat.

---

## P1-02 — Extract mode routing diagnosis

### Root cause

Extract mode is **not broken**. It was intentionally moved.

**Commit:** `39da44a` — "Nest extract feature within compose tab and remove as top-level item"  
**Date:** 2026-05-23  
**Author:** Agent (session `023828b7-0333-46bc-b7da-b1685bb71d65`)

### What the commit changed in App.tsx

1. Removed `import { ExtractTab }` from App.tsx.
2. Narrowed `AppTab` type from:
   ```
   "apply" | "compose" | "examples" | "reference" | "extract"
   ```
   to:
   ```
   "apply" | "compose" | "examples" | "reference"
   ```
3. Removed the "Extract" entry from `TAB_CONFIG` (the 4-button tab bar).
4. Removed the `{activeTab === "extract" && <ExtractTab ... />}` render branch.
5. Added `onUseExtractedTheme` and `onSwitchTab` props to the `<ComposeTab>` render so
   that ComposeTab could host the embedded ExtractTab.

### Where Extract is now

`ExtractTab.tsx` (685 lines) is still imported and used in **ComposeTab.tsx**:
- Line 20: `import { ExtractTab } from "@/pages/tabs/ExtractTab";`
- Lines 560–608: Collapsible "Import Theme" section with an "Extract Theme" sub-section
  that renders `<ExtractTab embedded={true} onUseExtractedTheme={...} onSwitchTab={...} onShowToast={...} />`

### Why `#extract` falls back to Compose

`AppShell` initializes `activeTab` by checking `window.location.hash.slice(1)` against the
current TABS array: `["apply", "compose", "examples", "reference"]`. Since "extract" is no
longer in that array, any `#extract` URL falls back to the default — "compose". This is
the correct behavior given the current architecture.

### Decision required

The PRD v4 P1-02 asked for a diagnosis. The diagnosis is complete: **no routing bug, no
incomplete refactor, no feature flag.** This was a deliberate architectural choice to
reduce tab count by embedding Extract within Compose.

Phase 2 has two options:

**Option A — Restore dedicated Extract tab:**  
Re-add "extract" to `AppTab`, re-add the tab nav entry in `TAB_CONFIG`, and render
`<ExtractTab>` (non-embedded) directly from App.tsx. The tab already works — it just
needs the nav entry restored. `ComposeTab` can keep the embedded version for Compose-flow
users, or it can be removed to avoid duplication.

**Option B — Accept embedded location:**  
The current embedded location inside Compose is intentional and functional. The only
gap is that `#extract` doesn't navigate there. A shallow fix: when `#extract` is detected,
navigate to `#compose` and expand the "Import Theme" section programmatically.

Jamie should choose before Phase 2 implements either path.

---

## P1-03 — Stroke / border-width control audit

### Finding: CONFIRMED ABSENT

No stroke-width or border-width per-tier numeric control exists anywhere in the
Compose or Apply UI, palette schema, or theme-engine init directive generation.

**Evidence:**

| Surface | Finding |
|---|---|
| `ComposeTab.tsx` — Colors section | Renders all `palette.colors` entries except `fontFamily`. Colors include `primaryBorderColor`, `nodeBorder`, `secondaryBorderColor`, `tertiaryBorderColor` — these are **hex color values**, not width values. No width slider or input exists. |
| `ComposeTab.tsx` — Typography section | Controls: diagram body font (fontFamily), global base size (fontSize preset XS/S/M/L/XL + custom input), per-tier fontSize hierarchy. No stroke-width or border-width input. |
| `palettes.ts` — `REQUIRED_COLOR_KEYS` | 11 keys: primaryColor, primaryTextColor, primaryBorderColor, lineColor, secondaryColor, tertiaryColor, background, mainBkg, nodeBorder, clusterBkg, titleColor. No width key. |
| `palettes.ts` — `KNOWN_COLOR_KEYS` | Extends REQUIRED with: edgeLabelBackground, fontFamily, secondaryTextColor, secondaryBorderColor, tertiaryTextColor, tertiaryBorderColor, textColor. No width key. |
| `theme-engine.ts` — `buildInitDirective` | Outputs palette color values + fontSize + fontFamily. No stroke-width. |
| `theme-engine.ts` — `getClassDefs` | Stroke-width appears only in classDef `extra` strings (e.g. `"stroke-width:2px"` for "emphasized" and "border" class defs) — these are hardcoded, not user-configurable. |
| Mermaid themeVariables | Mermaid's `base` theme does not expose a `strokeWidth` or `borderWidth` themeVariable in its public API. Width control in Mermaid is done via classDef or CSS injection, not themeVariables. |

### Implication for Phase 2

A "stroke/border width control" would require either:
1. A CSS injection approach (not viable for GitHub, Notion, Confluence, Loop which block CSS injection), or
2. Per-classDef `stroke-width` editing — surfacing the hardcoded values in `getClassDefs` as user-editable fields.

The most viable path is (2): add a per-classDef stroke-width field to the Compose classDef editor. This is a **new feature**, not a fix to an existing missing control.

---

## P1-04 — 8th renderer: m365-loop identity and roadmap reconciliation

### Finding: PROFILE IS COMPLETE; ROADMAP ITEM IS PARTIALLY STALE

**The m365-loop profile is fully implemented** in `src/data/renderer-parity.ts`:
- `id`: `"m365-loop"`
- `displayName`: `"Microsoft 365 / Loop / Copilot"`
- `shortName`: `"M365/Loop"`
- `url`: `"https://loop.microsoft.com"`
- `sourceUrl`: real Microsoft Support page URL
- All 7 support fields populated (`looksSupported`, `initDirectiveSupport`, `themeVariableSupport`, `classDefSupport`, `cssInjectionSupport`, `customFontSupport`)
- 6 caveats documented
- `notes`: substantive guidance including the frontmatter caution

**The roadmap.md item (line 95) reads:**
```
- [ ] **Microsoft Loop / M365 Copilot renderer profile** — registered in renderer-parity.ts;
      surfaced in renderer selector and Reference tab parity matrix
```

This is **split into two sub-claims**, both of which need checking:

| Sub-claim | Status | Evidence |
|---|---|---|
| "registered in renderer-parity.ts" | ✅ DONE | m365-loop entry exists at lines 184–207 of renderer-parity.ts |
| "surfaced in Reference tab parity matrix" | ✅ DONE | `ReferenceTab.tsx` uses `RENDERER_PROFILES.map(...)` at lines 288 and 339 — all 8 renderers render automatically |
| "surfaced in renderer selector (Apply/Compose)" | Needs verification | The renderer target `<select>` in Apply/Compose needs manual inspection to confirm m365-loop appears in the dropdown |

### README drift

The README parity matrix table (lines 57–64) lists only 7 renderers — no m365-loop row.
This is a **documentation gap** to fix in Phase 3, not a Phase 2 bug.

### Recommendation

1. **Tick the roadmap.md item** — the profile work is done; the Reference tab auto-includes it.
2. **Verify the renderer target dropdown** manually in the live app to confirm m365-loop appears.
3. **Fix README table** in Phase 3 (add m365-loop row).

---

## P1-05 — Neutral Enterprise palette fate

### Finding: NEVER EXISTED IN THE CODEBASE

"Neutral Enterprise" has never been implemented, committed, or referenced in the project
source code.

**Evidence:**
- `src/lib/palettes.ts`: 7 palettes defined — Ocean Depth, Forest Sage, Slate Ember,
  Violet Mist, OKHP3, Glee-fully, AskJamie. No "Neutral Enterprise."
- Git log: no commit with "neutral enterprise", "neutral-enterprise", or
  "neutralEnterprise" in the message or diff.
- `CHANGELOG.md`: no mention.
- `README.md`: no mention.
- References found only in:
  - `.attached_assets/Pasted--Replit-PRD-v4-...txt` (the PRD that introduced the concept)
  - `.local/tasks/prd-phase*.md` (Phase 1 planning docs)

**Live palette bar (confirmed):** My Theme 1, OKHP3, Glee-fully, AskJamie, Ocean Depth,
Forest Sage, Slate Ember, Violet Mist.

### Options for Phase 2 (decision required from Jamie)

**Option A — Build it:**
- Name: "Neutral Enterprise"
- Palette concept: neutral grayscale, no brand personality, WCAG AA contrast minimum on
  all required color pairs, positioned as the zero-state default before a user picks a
  brand palette.
- Implementation: add a new entry to `BUILTIN_PALETTES` in `palettes.ts` with
  `isBrandPreset: false`. Would become the 8th palette.
- Rationale: fills the genuine gap of a "no-opinion" starting point that works in
  corporate contexts without brand implication.

**Option B — Retire the claim:**
- Remove every reference to "Neutral Enterprise" from planning documents, PRDs, and any
  future-facing writing.
- Keep the current 7 built-in palettes as the canonical set.
- Rationale: the current 7 palettes are sufficient and well-documented; adding a new
  one adds maintenance surface without a clear user demand signal.

**Jamie's choice determines Phase 2 scope.** Do not implement either option until the
decision is received.

---

## Documents produced by this phase

| Document | Purpose |
|---|---|
| `docs/renderer-frontmatter-compatibility.md` | Renderer × frontmatter compatibility table; `%%{init}%%` test fixture specs for manual length testing |
| `docs/frontmatter-compatibility-findings.md` | This document — all five P1 sub-task findings and gate summary |

---

## STOP — Awaiting GO for Phase 2

Phase 2 engineering work is **blocked** until Jamie provides:

1. **P1-01:** Confirmation that Phase 2 warning logic for unverified renderers should use
   hedged language ("field observation — unverified") rather than waiting for manual
   length measurements. OR: manual length test results to fill in the table in
   `docs/renderer-frontmatter-compatibility.md`.

2. **P1-02:** Choice of **Option A** (restore dedicated Extract tab) or **Option B**
   (accept embedded location + shallow `#extract` hash redirect).

3. **P1-05:** Choice of **Option A** (build Neutral Enterprise palette) or **Option B**
   (retire the claim permanently).

Items that do **not** require a decision before Phase 2 begins:
- P1-03 (stroke audit is complete — absence confirmed, Phase 2 knows what to build)
- P1-04 (m365-loop profile is done; only README update and roadmap tick remain)

---

*Phase 1 produced by Replit Agent, Task #594, 2026-08-04.*
*No code was modified during this phase.*
