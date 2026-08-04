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
| **GitHub** | `11.x (pinned, updated periodically)` | Yes | **Yes** — empirically confirmed; GitHub Docs reference the `config:` frontmatter block | Unverified — needs manual confirmation | Medium (version confirmed; frontmatter behaviour confirmed by docs) |
| **GitLab** | `11.x (varies by GitLab version)` | Yes for cloud; may be No for older self-hosted | **Partial** — cloud GitLab: Yes. Self-hosted instances on older GitLab versions may run Mermaid < 10.5.0 | Unverified — needs manual confirmation | Medium for cloud; Low for self-hosted |
| **Notion** | `10.x (pinned, rarely updated)` | Unverified — "10.x" spans 10.0–10.9; 10.5.0 is the cutoff | **Unverified** — Notion's `initDirectiveSupport` is already `partial`; frontmatter support unconfirmed. Prefer `%%{init}%%`. | Unverified — needs manual confirmation | Low |
| **Obsidian** | `11.x (built-in; plugin may update)` | Yes for built-in 11.x | **Yes (built-in)** — built-in Mermaid 11.x supports frontmatter. Older installs or plugins pinned to < 10.5.0 may not | Unverified — needs manual confirmation | Medium |
| **Confluence + Plugin** | `varies by plugin (often 10.x)` | Unverified — plugin-dependent | **Unverified** — completely plugin-dependent; older plugins may run Mermaid < 10.5.0 and will silently ignore the frontmatter block | Unverified — needs manual confirmation | Low |
| **CLI (mmdc)** | `pinned to installed npm package version` | Conditional — Yes when installed version ≥ 10.5.0 | **Conditional** — supported when `mmdc` version ≥ 10.5.0. Install with `npm install -g @mermaid-js/mermaid-cli@latest` for guaranteed support | Not applicable — CLI renders locally; no network length constraint | High (conditional on installed version) |
| **M365 / Loop** | `varies (pinned internally, may lag current release)` | Unverified | **Not recommended** — renderer-parity.ts notes explicitly state: "Prefer the %%{init}%% directive over YAML frontmatter — Loop may not process frontmatter reliably in all versions" | Unverified — needs manual confirmation | Low |

---

## Init-directive (`%%{init}%%`) safe-length measurements

> **Testing environment note:** `mmdc` (Mermaid CLI) was **not available** in the Phase 1
> discovery environment and could not be installed headlessly. All length ceiling values
> below are **Unverified — needs manual confirmation** per Phase 1 task rules. No number
> in this section has been measured; none should be used as a hard limit in Phase 2 code
> without first running the test fixtures described below.

### Methodology for Phase 2 manual testing

For each renderer where frontmatter is NOT supported (or not recommended), generate and
submit the following `%%{init}%%` test fixtures. Record the character count at which
rendering breaks or the theme directive is silently ignored.

**Test diagram template:**
```
%%{init: {"theme": "base", "themeVariables": {<PAYLOAD>}}}%%
flowchart TD
    A[Start] --> B[End]
```

**Realistic `themeVariables` payload at each character count target:**

| Target chars | Sample payload (count from `{` to `}`) |
|---|---|
| ~100 | `"primaryColor": "#1a4f8a", "primaryTextColor": "#3d3937", "lineColor": "#2563eb"` |
| ~150 | `"primaryColor": "#1a4f8a", "primaryTextColor": "#3d3937", "lineColor": "#2563eb", "secondaryColor": "#0ea5e9"` |
| ~200 | `"primaryColor": "#1a4f8a", "primaryTextColor": "#3d3937", "lineColor": "#2563eb", "secondaryColor": "#0ea5e9", "tertiaryColor": "#e0f2fe"` |
| ~250 | `"primaryColor": "#1a4f8a", "primaryTextColor": "#3d3937", "lineColor": "#2563eb", "secondaryColor": "#0ea5e9", "tertiaryColor": "#e0f2fe", "background": "#f0f9ff"` |
| ~300 | `"primaryColor": "#1a4f8a", "primaryTextColor": "#3d3937", "lineColor": "#2563eb", "secondaryColor": "#0ea5e9", "tertiaryColor": "#e0f2fe", "background": "#f0f9ff", "mainBkg": "#dbeafe"` |
| ~400 | 8–9 themeVariable keys |
| ~500 | 11–12 themeVariable keys (full MTB palette) |

**Renderers requiring manual testing (frontmatter unsupported or unverified):**
- Notion (submit test diagrams in a Notion page, check if init theme applies)
- Confluence + Plugin (depends on installed plugin)
- M365 / Loop (paste into a Loop page)
- GitLab self-hosted (if available; skip if only cloud access)

### Table to fill in during manual testing

| Renderer | 100 chars | 150 chars | 200 chars | 250 chars | 300 chars | 400 chars | 500 chars | Observed ceiling | Notes |
|---|---|---|---|---|---|---|---|---|---|
| Notion | — | — | — | — | — | — | — | Unverified | — |
| Confluence | — | — | — | — | — | — | — | Unverified | — |
| M365/Loop | — | — | — | — | — | — | — | Unverified | — |
| GitLab self-hosted | — | — | — | — | — | — | — | Unverified | — |

---

## Recommended export defaults per renderer (Phase 2 input)

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

*Produced: Phase 1 Discovery — read-only investigation, 2026-08-04*
*Author: Replit Agent, Task #594*
