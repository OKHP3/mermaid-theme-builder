# Renderer × Frontmatter Compatibility Matrix

> **Status:** Phase 1 Discovery output — evidence-first. Every value is sourced from
> `src/data/renderer-parity.ts` (where the `mermaidVersionApprox` fields were researched
> when the profiles were authored), cross-checked against platform documentation where cited.
> Values marked **Unverified** require manual confirmation before being used in Phase 2
> generated warnings.

---

## Background: when was YAML frontmatter introduced?

Mermaid **10.5.0** (released 2023-10-24) introduced the `---` YAML frontmatter block with a
`config:` key as the preferred alternative to `%%{init}%%` directives for renderers that
support it. Any renderer running Mermaid **< 10.5.0** cannot process YAML frontmatter.

Source: [Mermaid CHANGELOG](https://github.com/mermaid-js/mermaid/blob/develop/CHANGELOG.md),
entry for 10.5.0: "feat(config): add support for YAML frontmatter configuration block."

---

## Compatibility table

| Renderer | `mermaidVersionApprox` (from renderer-parity.ts) | ≥ 10.5.0? | YAML frontmatter supported | Init directive safe-length ceiling | Confidence |
|---|---|---|---|---|---|
| **mermaid-live** | `latest` | Yes (always) | **Yes** — reference renderer, all features | Not applicable — full support, no length concern | High |
| **GitHub** | `11.x (pinned, updated periodically)` | Yes | **Yes** — empirically confirmed; GitHub Docs reference the `config:` frontmatter block | **500 chars** — field-observed: 597-char directives cause rendering issues (PRD v5) | Medium (version confirmed; frontmatter behaviour confirmed by docs) |
| **GitLab** | `11.x (varies by GitLab version)` | Yes for cloud; may be No for older self-hosted | **Partial** — cloud GitLab: Yes. Self-hosted instances on older GitLab versions may run Mermaid < 10.5.0 | **500 chars** — inferred from GitHub field observation; unconfirmed for GitLab directly | Medium for cloud; Low for self-hosted |
| **Notion** | `10.x (pinned, rarely updated)` | Unverified — "10.x" spans 10.0–10.9; 10.5.0 is the cutoff | **Unverified** — Notion's `initDirectiveSupport` is already `partial`; frontmatter support unconfirmed. Prefer `%%{init}%%`. | **Unverified** — no field data; partial initDirectiveSupport already triggers its own advisory | Low |
| **Obsidian** | `11.x (built-in; plugin may update)` | Yes for built-in 11.x | **Yes (built-in)** — built-in Mermaid 11.x supports frontmatter. Older installs or plugins pinned to < 10.5.0 may not | **Unlimited** — local renderer; no backend pipeline, no network length constraint | Medium |
| **Confluence + Plugin** | `varies by plugin (often 10.x)` | Unverified — plugin-dependent | **Unverified** — completely plugin-dependent; older plugins may run Mermaid < 10.5.0 and will silently ignore the frontmatter block | **Unverified** — plugin-dependent; no field data | Low |
| **CLI (mmdc)** | `pinned to installed npm package version` | Conditional — Yes when installed version ≥ 10.5.0 | **Conditional** — supported when `mmdc` version ≥ 10.5.0. Install with `npm install -g @mermaid-js/mermaid-cli@latest` for guaranteed support | **Unlimited** — local renderer (Puppeteer); no network length constraint | High (conditional on installed version) |
| **M365 / Loop** | `varies (pinned internally, may lag current release)` | Unverified | **Not recommended** — renderer-parity.ts notes explicitly state: "Prefer the %%{init}%% directive over YAML frontmatter — Loop may not process frontmatter reliably in all versions" | **Unverified** — partial initDirectiveSupport; no field data on length | Low |

---

## Init-directive (`%%{init}%%`) safe-length measurements

> **Phase 2 update (2026-08-05):** The measurement script
> `scripts/measure-init-directive-lengths.mjs` was executed in the workspace.
> See output below.  The `initDirectiveSafeLength` field has been added to all
> eight `RendererProfile` objects in `src/data/renderer-parity.ts` and the
> `checkInitDirectiveLength()` utility in `src/lib/init-directive-length.ts` uses
> these values to surface caution advisories in the Export panel.

### Phase 1 measurement results (2026-08-05)

**Key finding — confirmed by automated measurement:**

Mermaid's own parser imposes **NO length ceiling** on `%%{init}%%` directives across all
three version families tested (8.14.x, 10.5.x, 11.x).

The measurement tested directive strings from 76 to 379 characters (1–12 OKH P3
themeVariable keys) and found:

| Keys | Directive length | 8.14.x extraction | 10.5.x extraction | 11.x extraction | JSON.parse |
|------|-----------------|-------------------|-------------------|-----------------|------------|
| 1 | 76 chars | ✓ | ✓ | ✓ | ✓ valid |
| 2 | 107 chars | ✓ | ✓ | ✓ | ✓ valid |
| 3 | 131 chars | ✓ | ✓ | ✓ | ✓ valid |
| 4 | 160 chars | ✓ | ✓ | ✓ | ✓ valid |
| 5 | 188 chars | ✓ | ✓ | ✓ | ✓ valid |
| 6 | 213 chars | ✓ | ✓ | ✓ | ✓ valid |
| 7 | 235 chars | ✓ | ✓ | ✓ | ✓ valid |
| 8 | 260 chars | ✓ | ✓ | ✓ | ✓ valid |
| 9 | 285 chars | ✓ | ✓ | ✓ | ✓ valid |
| 10 | 310 chars | ✓ | ✓ | ✓ | ✓ valid |
| 11 | 344 chars | ✓ | ✓ | ✓ | ✓ valid |
| 12 | 379 chars | ✓ | ✓ | ✓ | ✓ valid |

**Conclusion:** Length limits are **renderer-pipeline constraints**, not Mermaid-parser
constraints.  They arise from HTTP payload restrictions, markdown pre-processor truncation, or
backend rendering pipeline limits in each host platform.

### Renderer ceiling values (as shipped in `initDirectiveSafeLength`)

| Renderer | Ceiling | Confidence | Source |
|----------|---------|------------|--------|
| mermaid-live | unlimited | High | Local/reference renderer |
| GitHub | 500 chars | Medium | PRD v5 field report: 597-char directive caused rendering issues; live render check applied the theme at 100–600 chars |
| GitLab (cloud) | 500 chars | Low | Inferred from GitHub similarity; not independently confirmed |
| Notion | unverified | Low | No field data; partial initDirectiveSupport already advisory |
| Obsidian | unlimited | High | Local renderer, no backend pipeline |
| Confluence + Plugin | unverified | Low | Plugin-dependent |
| CLI (mmdc) | unlimited | High | Local renderer (Puppeteer), no network |
| M365 / Loop | unverified | Low | No field data; partial initDirectiveSupport already advisory |

### How ceilings are used in the app

The `exportAdvisories` useMemo in `src/pages/tabs/apply/ApplyTab.tsx` calls
`computeInitDirectiveLength()` (from `src/lib/theme-engine.ts`) then passes the result to
`checkInitDirectiveLength()` (from `src/lib/init-directive-length.ts`) when
`outputFormat === "init-directive"`.

- **`unlimited`** renderers: no advisory raised.
- **`unverified`** renderers: no advisory raised (no data to warn on).
- **Numeric ceiling** renderers: if `directiveLength > ceiling`, a caution advisory is
  appended to `exportAdvisories` and shown in the amber banner in `PreflightPanel`.

Example advisory text (GitHub, directive = 597 chars):
```
%%{init}%% directive (597 chars) may exceed GitHub's 500-char rendering limit — validate before publishing
```

### Methodology for future manual testing

For each renderer where the ceiling is **unverified**, generate and submit the following test
fixtures. Record the character count at which rendering breaks or the theme directive is
silently ignored.  Use `scripts/measure-init-directive-lengths.mjs` output as fixture source.

**Test diagram template:**
```
%%{init: {"theme": "base", "themeVariables": {<PAYLOAD>}}}%%
flowchart TD
    A[Start] --> B[End]
```

**Renderers requiring manual testing:**
- Notion (submit test diagrams in a Notion page, check if init theme applies)
- Confluence + Plugin (depends on installed plugin)
- M365 / Loop (paste into a Loop page)
- GitLab self-hosted (if available; skip if only cloud access)

**Manual testing table:**

| Renderer | 100 chars | 200 chars | 300 chars | 400 chars | 500 chars | 600 chars | Observed ceiling | Notes |
|---|---|---|---|---|---|---|---|---|
| GitHub (cloud) | Applies | Applies | Applies | Applies | Applies | Applies | >600 chars (not established) | Live public Markdown preview checked 2026-08-26; nodes retained the expected `#ff0054` fill at every tested length |
| Notion | — | — | — | — | — | — | Unverified | — |
| Confluence | — | — | — | — | — | — | Unverified | — |
| M365/Loop | — | — | — | — | — | — | Unverified | — |
| GitLab self-hosted | — | — | — | — | — | — | Unverified | — |

The GitHub result does **not** establish a hard ceiling: every fixture through 600 characters
rendered with the expected magenta theme. Keep the shipped 500-character advisory because the
separate PRD v5 field report observed rendering issues at 597 characters; this is a conservative
warning threshold rather than a measured parser or hosted-renderer cutoff.

When manual results are available for an unverified renderer, update `initDirectiveSafeLength` in the matching
`RendererProfile` object in `src/data/renderer-parity.ts` and re-run `pnpm test` to verify
the advisory thresholds.

---

## Recommended export defaults per renderer

| Renderer | Recommended format | Rationale |
|---|---|---|
| mermaid-live | Either | Full support for both; default to frontmatter for new exports |
| GitHub | Frontmatter | Both work; frontmatter is cleaner for Markdown files |
| GitLab (cloud) | Frontmatter | Both work; frontmatter preferred |
| GitLab (self-hosted) | `%%{init}%%` | Safer across version range |
| Notion | `%%{init}%%` | Frontmatter unverified; init is at least partial |
| Obsidian | Frontmatter | Built-in 11.x supports it |
| Confluence | `%%{init}%%` | Plugin compatibility varies; init is safer |
| CLI (≥ 10.5.0) | Either | Both work when version ≥ 10.5.0 |
| M365 / Loop | `%%{init}%%` | Explicitly recommended by renderer profile notes |

---

*Phase 1 produced: 2026-08-04 — read-only investigation*
*Phase 2 updated: 2026-08-05 — measurement script run, ceiling values shipped, advisory wired*
