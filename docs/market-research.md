# Market Research — Mermaid Theme Builder

**Research date:** 2026-05-21  
**Sources:** Three independent research passes (Claude Opus 4.5, Perplexity, ChatGPT o3)  
**Status:** Authoritative internal reference — not published externally

---

## Executive Summary

Three independent research sessions converged on the same strategic conclusion: **the "visual governance for AI-generated Mermaid diagrams" product category is real, unoccupied, and defensible** — but only in its sharpened form. The naive form (palette picker + themeVariables export) is already covered by at least ten free tools and two paid products. The differentiated wedge is the *cross-family theme contract + renderer parity matrix + LLM prompt scaffold* combination, which no existing competitor ships end-to-end.

---

## Ecosystem Scale

| Signal | Value | Source |
|---|---|---|
| Mermaid npm weekly downloads | ~6.7M (Snyk) / ~24M (npmjs, different aggregation) | Claude research |
| GitHub stars | 88,196 as of May 2026 | Claude research |
| GitHub forks | 8,996 | Claude research |
| Open issues | 1,421 | Claude research |
| Star trajectory | ~35K → 52K (2022 post-GitHub native rendering) → 88K (2026) | Claude research |
| Mermaid Chart seed funding | $7.5M, March 2024 | TechCrunch / Mermaid Chart press release |
| Mermaid Chart investors | Microsoft M12, Sequoia Capital, Open Core Ventures (Sid Sijbrandij / GitLab), 9+ others | Mermaid Chart press release |
| Docusaurus `@docusaurus/theme-mermaid` dependents | 1,230 at v11.14.0 | npmjs |

---

## AI Workflow Validation

The "AI-generated Mermaid" pipeline is mainstream, not niche:

- ChatGPT, Claude, GitHub Copilot, and Cursor all routinely emit Mermaid diagrams
- Third-party AI tools built specifically on Mermaid generation: gitdiagram, Eraser, Taskade Genesis, vscode-mermAId, Microsoft GenAIScript
- H2O Enterprise (h2oGPTe tutorial 10) is the closest prior art to "AI-generated Mermaid with consistent styling" — and it hard-codes the palette rather than exporting a reusable theme contract
- No tool ships a **system prompt + theme pair** as a portable artifact. That is the gap.

### Academic Evidence (MermaidSeqBench — IBM Research, NeurIPS 2025 workshop)

IBM Research published MermaidSeqBench, a 132-sample benchmark for LLM-to-Mermaid sequence diagram generation. Key findings:

| Model | Syntax score (×100) | Activation Handling |
|---|---|---|
| Qwen 2.5-0.5B | 58.90 | 26.52 |
| Llama 3.2-1B | 68.98 | 39.85 |
| Granite 3.3-8B | 86.97 | 74.13 |
| Llama 3.1-8B | 92.01 | 79.17 |

**Caveat:** MermaidSeqBench tests syntactic/semantic correctness, not visual styling. Do not cite it as evidence of visual inconsistency. Use it only to validate that "LLMs generating Mermaid" is an established and growing workflow worth tooling for.

Additional academic context:
- *Flowchart2Mermaid* — image-to-editable-Mermaid with mixed-initiative refinement
- *MermaidFlow* — Mermaid as verifiable intermediate representation for agentic workflow generation
- *Reference-free flowchart image-to-code evaluation* — production monitoring need for Mermaid generation
- *AI-assisted causal pathway diagrams* (HCI paper) — lower cognitive load, improved creativity with AI diagram support

Collectively: **generation is getting better; correctness, usability, evaluation, and human steering remain open problems.** That is where theme governance creates value.

### Practitioner Evidence

- DEV.to ("Levi Liu"): *"95% of Mermaid diagrams in the wild look exactly the same — it's a defaults problem"*
- GitHub issues documenting theming pain: #7340, #4906, #7144, #1874, #611, #7590
- Obsidian forum threads: Mermaid theme does not auto-mirror dark mode
- Gordonby (mermaid-theming reference): cannot change font family on GitHub's native renderer

---

## Competitive Landscape

### Direct Competitors

| Product | Pricing | Theme editing | Multi-family | Renderer warnings | LLM scaffold | Portable export |
|---|---|---|---|---|---|---|
| **Mermaid Live Editor** | Free | Dropdown only | n/a | No | No | No |
| **Mermaid Chart** | Free / $10 / $20 / Enterprise per seat | Theme Selector dropdown (Neo, Redux) | No per-diagram editing | No | Generates diagrams, not themes | No |
| **Mermaid Studio** (JetBrains plugin) | $49–99/yr | CSS class completions per-class | Partial (IDE-side) | No | No | No |
| **beautiful-mermaid** | Free/OSS | Color-picker UI | No | No | No | No |
| **Gordonby/MermaidTheming** | Free/OSS | Variable reference | No builder UI | No | No | No |
| **mermaid-cli (mmdc)** | Free/OSS | Config file only | No UI | No | No | No |
| **MarkChart / mermaidonline.live** | Free | Basic editor | No | No | No | No |

**Gap:** No existing tool combines Mermaid-specific theme editing + diagram-type awareness + renderer compatibility warnings + LLM prompt scaffold generation + portable Markdown export. Mermaid Theme Builder is the only tool that does all five.

**Most under-appreciated competitor:** Mermaid Studio (JetBrains/VS Code plugin, $49–99/yr). Theme CSS completions per class is a real differentiator. Any public launch must explicitly position against it.

**First-party threat:** Mermaid Chart ($7.5M funded) has a "Theme Selector" and the IP/resources to extend it. Their current focus is collaboration/AI generation, not enterprise theme governance — but this could change within 2 quarters.

### Adjacent Analogs (Validated Patterns)

| Analog | What it validates |
|---|---|
| **Material Theme Builder** (m3.material.io) | Palette UI → portable token bundle → code export. Same pattern. Commercially validated by Google. |
| **tints.dev** (Tailwind palette generator) | HSL-tweakable palette → Tailwind config export. Pattern is well-understood. |
| **bootstrap.build / themestr.app** | Visual Bootstrap theme editor → SCSS/CSS bundle. Commercially validated by Bootstrap ecosystem. |
| ~~jQuery UI ThemeRoller~~ | **Avoid as a marketing analogy** — jQuery UI 1.13 is the project's "final planned release"; the ThemeRoller npm package is "no longer maintained." Legacy/nostalgic, not aspirational. |

**Lead with Material Theme Builder and tints.dev as positioning analogs. Drop ThemeRoller entirely.**

---

## Theming Surface — What Authors Actually Get

- Only the `base` theme is truly modifiable via `themeVariables`; other themes (`forest`, `dark`, `neutral`) partially override user variables
- Practitioner consensus: **6 variables drive most of the visual result** — `primaryColor`, `primaryTextColor`, `primaryBorderColor`, `lineColor`, `fontFamily`, `fontSize`. The other 50+ create exactly the inconsistency that theme governance could systematize.
- Variable names differ per diagram family (`actorBkg` for sequence, `nodeBkg` for flowcharts)
- `look:` (neo / handDrawn) rolls out family-by-family — not uniformly supported
- C4 diagrams largely ignore themeVariables
- CSS injection (`<style>` tags) is blocked by GitHub and GitLab (XSS risk)
- Custom fonts blocked by CSP on most hosted platforms

---

## Kill Conditions

These would materially undercut the defensible wedge:

1. **Mermaid Chart ships portable multi-family theme export + AI prompt scaffold** within ~2 quarters. They have $7.5M and the IP. Probability: medium within 12 months.
2. **Mermaid v12 unifies the theming engine** — consistent classDef coverage across all families, built-in palette generator. Probability: low within 12 months based on current roadmap signals.

---

## Naming Risk

The name "Mermaid Theme Builder" carries reputational-confusion risk with Mermaid Chart's "Theme Selector" and Mermaid Studio. No USPTO trademark for "Mermaid" in the diagram-software class was found in surface searches (Justia/TrademarkElite), but a formal TESS/WIPO/EUIPO clearance was not run.

Suggested alternatives (not decisions): "Theme Forge for Mermaid," "MermaidThemes.dev," or any non-overlapping name with a clear "for Mermaid diagrams" descriptor.

**This is a naming consideration for any future public marketing effort, not a current blocker for a personal/portfolio tool.**

---

## Defensibility Assessment

| Framing | Defensibility |
|---|---|
| **Naive:** palette UI + themeVariables export | Weak — covered by 10+ free tools and 2 paid products |
| **Sharpened:** cross-family theme contract + renderer parity matrix + LLM prompt scaffold | **Moderate** — three durable advantages (see below) |

**Three durable advantages of the sharpened framing:**

1. **The diagram-family parity problem is Mermaid's own gap** — Neo look ships incrementally, C4/mindmap themes are broken. An external governance layer that accounts for this is genuinely useful.
2. **The LLM-reuse layer is unique** — no other product packages a Mermaid theme as a *prompt-injectable artifact*.
3. **The renderer-divergence matrix is a knowledge moat** — validating across GitHub, GitLab, Notion, Obsidian, Confluence, Docusaurus, Hugo, VS Code and publishing the results is something a $7.5M-funded team won't do first because it isn't their core product motion.

**Verdict: build the sharpened version, position around "AI-ready theme governance for Mermaid diagrams," and ship the renderer parity matrix as the visible-from-day-one moat.**

---

## Research Caveats

- MermaidSeqBench tests correctness, not styling consistency. Do not miscite.
- npm weekly download figures conflict (Snyk vs npmjs use different aggregation windows). Cite as "tens of millions per month" not a specific number.
- Mermaid Chart pricing was reported third-hand ($80/user/year, $6.67/user/month) — official pricing page was inaccessible to the fetcher. Do not cite as authoritative.
- Trademark search was surface-level only (USPTO, Justia, TrademarkElite). Not a formal clearance.
- No first-party usage telemetry available from OpenAI/Anthropic for Mermaid-emitting workflows.
- Mermaid Chart actual MAU/seat count unknown. $7.5M seed is the only funding datapoint.
