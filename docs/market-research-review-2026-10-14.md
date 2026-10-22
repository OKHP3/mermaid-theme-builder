# Market Research Review: October 14, 2026

**Artifact reviewed:** The owner-supplied "Mermaid Theme Builder: Competitive,
Academic, and Market Research Report," identified as `user-report-2026-10-14`.
The original remains in the conversation. This is a review addendum, not a
verbatim transcript or an exhaustive replacement inventory.

**Decision question:** Can the report guide this existing app's next priorities
within its current governance?

**Decision:** `defer-for-evidence` for adopting the report as the roadmap.
`approve-with-limits` for using its narrowed governance thesis to design the
next validation study. Several facts need correction, the closest competitors
now overlap more substantially, and much of the proposed first stage already
exists locally. Customer demand and commercial defensibility remain unknown.

**Local baseline:** Commit `1ac3e666b6768d00dc29129099fd19dd3a54af4e`, root app
`0.6.3`, Mermaid `11.17.2`. The working tree was clean before this review.
Source inspection establishes implementation presence; it does not establish
deployment health, hosted parity, or release readiness.

Mermaid Theme Builder is a personal OverKill Hill P3 project by Jamie Hill.
It is not affiliated with Builders FirstSource, BFS, Mermaid, Mermaid Chart,
Mermaid.ai, or any third-party brand represented by user-entered colors.

## Findings that change the decision

**The competitor boundary has moved.** Mermaid Studio documents custom themes
that write per-family variables into ordinary Mermaid frontmatter, single-file
JSON theme exchange, and MCP tools for agent validation and rendering. Its MCP
documentation also supplies an iterative generation and review scaffold.
Describing it only as CSS autocomplete understates the overlap. These are
confirmed documentation claims; the product was not installed or tested.
[Custom themes](https://mermaidstudio.dev/docs/features/custom-themes/),
[theme exchange](https://mermaidstudio.dev/docs/features/custom-themes/import-export/),
[MCP tools](https://mermaidstudio.dev/docs/features/mcp-tools/).

Mermaid Chart documents custom styling, including AI-produced `themeVariables`
and `classDef`, plus an authenticated MCP validation/rendering service. This
does not establish an equivalent portable governance bundle, but it weakens the
report's broad exclusivity claims. The custom-styles page was retrieved by the
evidence reviewer; a subsequent parent fetch failed.
[Custom styles](https://mermaid.ai/docs/style-and-customize/create-custom-styles),
[MCP server](https://mermaid.ai/docs/ai/mcp-server).

**The academic evidence needs one numerical correction and tighter scope.**
Flowchart2Mermaid's Table 1 reports GPT-4.1-mini entity F1 of **0.986** and
relationship F1 of **0.979**. The supplied report incorrectly places its entity
F1 below 0.94. The paper's proposed consistency checking does not specifically
establish a visual-theme problem. [Flowchart2Mermaid](https://arxiv.org/html/2512.02170v1).

MermaidSeqBench's 132 pairs and the Llama 3.1-8B syntax scores of 92.01 and 68.89
are supported. They are LLM judge scores, not compiler pass percentages. The
benchmark evaluates syntax and semantics, not visual compliance or demand for
this app. [MermaidSeqBench](https://arxiv.org/html/2511.14967v1).

**The upstream timeline is stale.** Mermaid 12.0.0 was released September 10,
2026, and 12.2.0 on October 13. Current documentation still describes different
theme/look defaults by family. The existence of v12 does not prove that the
report's compound kill condition, complete unification plus a palette
generator, occurred. Keep this app's pinned 11.17.2 baseline separate from
current upstream documentation.
[12.0.0 release](https://github.com/mermaid-js/mermaid/releases/tag/mermaid%4012.0.0),
[12.2.0 release](https://github.com/mermaid-js/mermaid/releases/tag/mermaid%4012.2.0),
[current theming guidance](https://mermaid.js.org/config/theming.html).

**Theming pain is documented, but its current scope requires reproduction.**
Issue #7340 describes inconsistent configuration and selector surfaces. Issue
#4906 documents legacy C4 behavior, with later collaborator comments describing
unified-renderer work. An issue and its discussion establish a reported problem;
they do not establish that every current version and host still has it.
[Issue #7340](https://github.com/mermaid-js/mermaid/issues/7340),
[issue #4906](https://github.com/mermaid-js/mermaid/issues/4906).

Official documentation recommends `base` for variable customization and hex
colors. Its implicit derivation rules do not establish nondeterminism; the
pinned base-theme source computes derived values from configuration. Prefer
frontmatter where the target supports it, while retaining directives for
identified compatibility cases. Directives have been deprecated since 10.5.0.
[Theming](https://mermaid.js.org/config/theming.html),
[pinned base-theme source](https://github.com/mermaid-js/mermaid/blob/mermaid%4011.17.2/packages/mermaid/src/themes/theme-base.js),
[directives](https://mermaid.js.org/config/directives.html).

**The ThemeRoller rationale contains a dated premise.** jQuery UI released
1.14.0 in August 2024 and describes itself as maintained without planned major
feature work. The assertion that 1.13 was its final release is inaccurate as a
current description. Choosing a newer positioning analogy remains an editorial
proposal, distinct from the state of a particular ThemeRoller package.
[jQuery UI 1.14.0 announcement](https://blog.jqueryui.com/2024/08/jquery-ui-1-14-0-released/).

## Existing capabilities and the narrower gaps

| Proposed capability | Confirmed local implementation | Remaining question |
|---|---|---|
| Portable theme contract | Schema-v2 profiles include colors, typography, look, renderer, format, stroke width, and version metadata; profile JSON export is wired in the app | Does an exported/imported profile preserve the entire intended contract through the UI? |
| Per-family styling | Family overlays and family-aware scaffold sections already exist | Which rendered invariants are attainable per family? A universal `classDef` vocabulary is not supported |
| Prompt scaffold | Browser exports and a headless generation script exist | Does the theme survive generation and subsequent revisions while preserving diagram meaning? |
| Renderer parity matrix | Eight renderer profiles and contextual warnings exist | Which entries have current observations for a named host, plugin, and runtime? |
| Single `.mmtheme` bundle | Profile JSON and palette bundles exist; `.mmtheme` is not the implemented format | Is a new extension useful, and what additional content must the schema preserve? |

Evidence: [profile schema and serialization](../src/lib/governance-profile.ts),
[export UI](../src/App.tsx), [family overlays](../src/lib/family-theming.ts),
[scaffold engine](../src/lib/theme-engine.ts), [palette bundles](../src/lib/exporters.ts),
[renderer metadata](../src/data/renderer-parity.ts),
[headless scaffold generator](../skills/okhp3-mermaid-theme-builder/scripts/generate-prompt-scaffold.mjs).

Profile export currently does not attach a prompt document or populate the
optional semantic-class field from the slot export handler. Palette bundle
export is a collection of palettes, not the proposed full governance bundle.
These are packaging questions, not evidence that the whole workflow is absent.

The report's eight named surfaces differ from the app's eight profiles. The app
includes Mermaid Live, GitHub, GitLab, Notion, Obsidian, Confluence, CLI, and
M365/Loop. Docusaurus, Hugo, and VS Code preview require separately identified
versions/plugins. No usage evidence establishes that the report's list is the
eight most-used renderers.

[Existing compatibility evidence](renderer-frontmatter-compatibility.md) records
unverified hosts and an inferred GitLab length warning. Its historical GitHub
fixtures applied themes through 600 characters, so the shipped 500-character
advisory is a conservative policy, not a proven hosted cutoff. Metadata shape
tests and older observations do not establish parity on the current commit.

## Claim ledger

`CONFIRMED` means observed in current source or primary documentation. Product
documentation is source-reported behavior until tested. `INFERRED` identifies
interpretation; `PROPOSAL` identifies a recommendation; `UNKNOWN` identifies
missing evidence. Review status is separate from evidence tier.

| ID | Proposition | Tier / review status | Evidence | Consequence if false; next check |
|---|---|---|---|---|
| CLM-01 | The exact governance workflow has no competitor | UNKNOWN / disputed in its broad form | S01-S05 | Misprioritized features; compare current exports and agent workflows on shared fixtures |
| CLM-02 | Academic benchmarks prove styling pain | INFERRED / disputed | S08-S09 | Invalid justification; retain them as adjacent correctness research |
| CLM-03 | GPT-4.1-mini entity F1 is below 0.94 | CONFIRMED correction / disputed | S09, Table 1 | Reversed model comparison; replace with 0.986 |
| CLM-04 | Cross-family theming has documented friction | CONFIRMED reports / supported with limits | S10, S13-S14 | Obsolete warnings; reproduce per version, family, and host |
| CLM-05 | Mermaid v12 is still hypothetical | CONFIRMED correction / disputed | S12 | Stale strategy; evaluate actual v12 features separately from local 11.17.2 |
| CLM-06 | Implicit color derivation is nondeterministic | INFERRED / disputed | S10, S19 | Misdiagnosed behavior; repeat identical pinned inputs before asserting variability |
| CLM-07 | Most of Stage 1 must be built from scratch | CONFIRMED local presence / disputed | Local capability table | Duplicate work; inventory UI round trips and remaining packaging gaps |
| CLM-08 | A declared profile matrix proves hosted visual parity | UNKNOWN / disputed | Local compatibility evidence | False assurance; collect dated host observations and computed style results |
| CLM-09 | Prompt instructions deterministically enforce a theme | UNKNOWN / disputed | Local scaffold source | Overpromised reliability; test generation and revision against a separate task set |
| CLM-10 | Ecosystem scale proves demand for this app | INFERRED / provisional | S16-S17 | Unsupported market forecast; obtain direct workflow feedback and repeat-use evidence |
| CLM-11 | 500 weekly active exporters is an evidence-based gate | PROPOSAL / missing measurement | `src/lib/privacy-analytics.ts` | Unusable gate; define a privacy-compatible metric and rationale before adoption |
| CLM-12 | SSO and central cloud themes fit this app's later stages | PROPOSAL / scope conflict | AGENTS.md Section 9.2 | Architecture violation; treat as a distinct product decision |
| CLM-13 | Informal searches or TOS silence establish naming safety | UNKNOWN / disputed | S18 | Unsupported rights inference; keep legal clearance unknown |
| CLM-14 | Naming is the biggest immediate risk | INFERRED / provisional | No comparative user or risk study | Misplaced urgency; test confusion and discoverability before a rename decision |

## Current scale and price snapshots

The npm API returned **18,782,236 downloads for October 6-12, 2026**. GitHub's
repository API returned **90,657 stars and 9,348 forks** on October 14. Neither
metric counts unique people or proves demand for this app. GitHub's
`open_issues_count` includes pull requests, so it was not treated as an issue-only
count. The supplied May figures remain historical; their conflicting download
methodology was not resolved by this review.
[npm dated window](https://api.npmjs.org/downloads/point/2026-10-06:2026-10-12/mermaid),
[GitHub repository API](https://api.github.com/repos/mermaid-js/mermaid).

Mermaid Studio's September 23 editions page lists 32 diagram types, personal
Core/Studio at $25/$49 per year, and commercial Core/Studio at $75/$149 per year.
Mermaid Chart's official pricing lists Plus/Premium at $10/$20 per user per
month billed annually. Its Basic diagram allowance differs between the pricing
card and comparison table, so this review does not resolve that allowance.
These are dated vendor claims, not a willingness-to-pay study.
[Studio editions](https://mermaidstudio.dev/docs/editions/),
[Chart pricing](https://mermaid.ai/pricing).

## Source ledger

All sources were retrieved **2026-10-14**. The links identify the exact pages;
the publisher and authority column explains why each was used. Mutable pages
and API counts are retrieval snapshots. The fixed paper versions remain bounded
to their reported methods and datasets.

| ID | Title and URL | Publisher / authority | Exact supported claim |
|---|---|---|---|
| S01 | [Custom Themes](https://mermaidstudio.dev/docs/features/custom-themes/) and [Import and Export](https://mermaidstudio.dev/docs/features/custom-themes/import-export/) | Mermaid Studio / product owner documentation | Per-family frontmatter application and portable JSON exchange |
| S02 | [MCP Tools](https://mermaidstudio.dev/docs/features/mcp-tools/) | Mermaid Studio / product owner documentation | Agent validation, rendering, schemas, and an instruction scaffold |
| S03 | [Editions and Pricing](https://mermaidstudio.dev/docs/editions/) | Mermaid Studio / primary commercial terms page | Dated license prices and supported-type count |
| S04 | [Create custom styles](https://mermaid.ai/docs/style-and-customize/create-custom-styles) | Mermaid Chart / product owner documentation; reviewer retrieval, parent retry failed | Custom styles and AI-produced styling blocks |
| S05 | [MCP Server](https://mermaid.ai/docs/ai/mcp-server) | Mermaid Chart / product owner documentation | Authenticated diagram syntax validation and rendering |
| S06 | [Pricing](https://mermaid.ai/pricing) | Mermaid Chart / primary pricing page | Annual-billing rates and inconsistent Basic allowances |
| S07 | [beautiful-mermaid README](https://github.com/lukilabs/beautiful-mermaid) | lukilabs / implementation repository | Alternative renderer, 15 themes, Mono mode, Shiki mapping, ASCII, and six listed families; no verified governance equivalence |
| S08 | [MermaidSeqBench v1](https://arxiv.org/html/2511.14967v1) | Paper authors / original research | Dataset size, judge-dependent scores, syntax/semantic evaluation scope |
| S09 | [Flowchart2Mermaid v1](https://arxiv.org/html/2512.02170v1) | Paper authors / original research | Table 1 F1 values and unspecified future consistency work |
| S10 | [Theme Configuration](https://mermaid.js.org/config/theming.html) | Mermaid / upstream technical documentation | Base/hex guidance, derived values, and different current family defaults |
| S11 | [Directives](https://mermaid.js.org/config/directives.html) | Mermaid / upstream technical documentation | Deprecation since 10.5.0 and frontmatter preference |
| S12 | [12.0.0](https://github.com/mermaid-js/mermaid/releases/tag/mermaid%4012.0.0) and [12.2.0](https://github.com/mermaid-js/mermaid/releases/tag/mermaid%4012.2.0) | Mermaid / immutable release identities | Actual upstream release dates |
| S13 | [Suggestions to improve theming, #7340](https://github.com/mermaid-js/mermaid/issues/7340) | Mermaid issue author and maintainers / original practitioner report | Reported inconsistency in configuration and semantic selectors |
| S14 | [C4 theming, #4906](https://github.com/mermaid-js/mermaid/issues/4906) | Mermaid issue author and collaborators / original report and follow-up | Legacy C4 problem and later unified-renderer work; no blanket current failure proof |
| S15 | [jQuery UI 1.14.0 released](https://blog.jqueryui.com/2024/08/jquery-ui-1-14-0-released/) | jQuery UI team / official release announcement | 1.14.0 exists and maintenance continues |
| S16 | [Mermaid downloads, October 6-12](https://api.npmjs.org/downloads/point/2026-10-06:2026-10-12/mermaid) | npm / direct statistics API, fetched through Python after web-fetch failure | Exact download count and date window; no unique-user count |
| S17 | [Mermaid repository metadata](https://api.github.com/repos/mermaid-js/mermaid) | GitHub / repository API | Retrieval-time stars and forks; issues field includes pull requests |
| S18 | [Comprehensive clearance search](https://www.uspto.gov/trademarks/search/comprehensive-clearance-search-similar-trademarks) | USPTO / government search guidance | A clearance inquiry extends beyond exact-name registration snippets, including common-law use |
| S19 | [11.17.2 base-theme source](https://github.com/mermaid-js/mermaid/blob/mermaid%4011.17.2/packages/mermaid/src/themes/theme-base.js) | Mermaid / version-pinned implementation | Configuration-driven derivation; documentation alone does not demonstrate random variation |

## Review method and limits

The evidence, outcome, and safety/portability reviewers ran independently before
their results were compared. They agreed on deferring roadmap adoption while
retaining a bounded research direction. A conditional disruptor examined the
remaining thesis, and the parent agent adjudicated from sources and local
evidence. Separate roles used the same model family and some shared sources;
their agreement is not independent market validation. The
[machine-readable record](market-research-review-2026-10-14.json) distinguishes
live retrieval from analytical conclusions and tests that did not run.

The disruptor identified three surviving objections:

1. Existing deterministic configuration application may provide equal or better
   results than relying on prompt retention. Compare scaffold-only generation
   with generation followed by the existing theme application; measure semantics,
   realized styles, repairs, and effort. No comparative trial ran.
2. The same Mermaid version can behave differently under different host CSS,
   font availability, plugins, or security settings. A useful matrix needs
   installation/configuration boundaries, not only a version label. No paired
   host-configuration trial ran.
3. Contract retention can preserve an incorrect promise. The journey scaffold
   in [the engine](../src/lib/theme-engine.ts) says task and section colors come
   entirely from theme variables, while the journey entry in
   [the capability registry](../src/data/mermaid-capabilities.ts) marks them as
   internally managed. This textual contradiction was independently confirmed;
   the correct rendered behavior was not tested. Reconcile these claims against
   pinned-renderer evidence before evaluating adherence.

This was a targeted verification of consequential claims, not an exhaustive
competitor search. The remaining plugins, funding/investor list, market share,
workflow usage frequency, current reproductions on every named host, and
trademark registration searches were not verified. No competitor was installed,
no customer study or LLM holdout ran, and no legal clearance was performed.
TOS silence and third-party naming do not establish permission. Renaming remains
a positioning proposal, not an approved action or a proven launch blocker.

## Recommended next action

First reconcile scaffold promises with capability evidence, starting with the
journey contradiction. Then create a small, versioned evidence packet for the **existing** profile and
scaffold workflow, starting with flowchart and sequence fixtures in frontmatter
and directive form. Record the profile hash, fixture hash, Mermaid version,
target host/plugin/version, light/dark setting, expected styling tokens,
observed styles, warnings, and retrieval date. Mark inaccessible hosts unknown.
Measure syntax, meaning preservation, token compliance, and visual readability
separately. Add a generation-and-revision task set that the scaffold author has
not optimized against before claiming LLM adherence. Compare it with the
existing deterministic application workflow before asserting that prompt
retention offers additional value.

The proposed differentiator is a free browser workflow with portable exports,
explicit family/renderer limits, and inspectable evidence of contract retention.
Its commercial moat remains a hypothesis. Obtain direct workflow feedback before
using ecosystem scale, an inbound conversation, or an arbitrary exporter count
as a growth decision. Stage 3's login/cloud features conflict with current
governance; any enterprise platform needs a separate product decision. A new
extension, dependency, local CLI, MCP transport, or dependency upgrade is not
authorized by this research review.

## Artifact validation

Documentation-only change. No application source, dependency, configuration,
release, or deployment change is part of this review.

- **PASS:** Existing documentation-truth and source-reference validators.
- **BLOCKED:** The declared shell link checker fails on this host because its
  Bash lacks `mapfile`. A scoped Python check is used for the changed Markdown
  links; it does not replace the Linux CI checker.
- **PASS:** Thirteen relative links across the changed Markdown resolve; review
  JSON parses; initial-role structure and baseline hashes match; historical
  document bodies are preserved beyond the added review notices. Review prose
  passes the US English candidate screen, em-dash check, and whitespace check.
  Git whitespace validation treats the preserved CRLF endings as line endings.
- **PASS:** The dated npm API window independently confirms the download count.
- **NOT RUN:** App build/tests, live competitor comparisons, hosted parity,
  LLM holdout, customer demand, and legal clearance.

Refresh this review after a relevant competitor release, upstream theming
change, new hosted evidence, or direct user study. Resolve the measured workflow
questions before turning the research stages into implementation commitments.
