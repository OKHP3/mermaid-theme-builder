# Product Positioning — Mermaid Theme Builder

**Last updated:** 2026-06-20
**Derived from:** Market Research (`docs/market-research.md`), three independent research sessions

---

## Canonical Positioning Statement

> **Mermaid Theme Builder is a visual governance tool for AI-generated Mermaid diagrams — not a Mermaid editor, not a color picker, and not a replacement for Mermaid Chart or Mermaid Live.**

The one-sentence version:

> *"The Material Theme Builder for Mermaid diagrams — generate a reusable theme contract, apply it across diagram families, and export a prompt scaffold so LLMs consistently produce on-brand diagrams."*

---

## What the Product IS

| Capability | Description |
|---|---|
| **Theme governance layer** | Visual editing of `themeVariables` + `classDef` sets across multiple diagram families simultaneously |
| **Diagram-type awareness** | Per-family theming surface documented; warnings when a theme feature is not supported for a given family |
| **Renderer compatibility checker** | Warns when a chosen style won't survive GitHub, GitLab, Notion, or other target renderers |
| **LLM prompt scaffold generator** | Exports a system-prompt fragment that instructs an LLM to use the current palette, classDef set, and supported `look` + theme combination |
| **Portable theme export** | `%%{init}%%` directive block, Markdown bootstrap, and JSON — all renderer-ready |
| **Static, browser-only** | No backend, no login, no diagram content transmitted anywhere |

## What the Product IS NOT

| Not this | Use instead |
|---|---|
| A Mermaid editor | Mermaid Live Editor, Mermaid Chart, VS Code extensions |
| A diagram collaboration platform | Mermaid Chart |
| A rendering engine | Mermaid.js (embedded) |
| An AI diagram generator | Mermaid Chart AI, Eraser, gitdiagram |
| A replacement for any existing tool | It is a companion that governs the styling layer |

---

## OKHP³ Visual Language Stack

Mermaid Theme Builder is the visual governance layer in the OKHP³ Visual Language Stack — a set of independent but composable tools that cover the full lifecycle of structured visual communication.

```
ReFolDec              Recursive decomposition and folding theory
    |
skillz                Agent-skill execution substrate
    |
BPMN for Mermaid      Process structure, notation, and workflow modeling layer
    |
Mermaid Theme Builder Visual governance, palette, renderer profile, and style-contract layer
    |
Target renderers      GitHub, Notion, Obsidian, M365 Loop, Confluence, Mermaid Live, CLI
```

Each layer is independent. You can use Mermaid Theme Builder without adopting any other layer. When combined, they form a coherent pipeline from raw intent to governed, brand-consistent visual output.

**Where this product fits:** Mermaid Theme Builder is the last mile before rendering. It does not create diagrams, interpret processes, or understand business logic. It takes any Mermaid code from any source — including AI assistants — and governs its visual output.

**BPMN for Mermaid** is the sibling project for the process structure and workflow modeling layer. When a diagram represents a business process or approval flow, start there for notation conventions, then pass the output through Mermaid Theme Builder for styling.

**Stage 2** of the product roadmap (LLM workflow integration — MCP server, CLI lint) connects this tool to the skillz execution layer, allowing AI agents to load the `okhp3-mermaid-theme-builder` skill and apply governance profiles programmatically.

See `docs/okhp3-visual-language-stack.md` for the full stack reference.

---

## Target Audience

| Segment | Pain | How Mermaid Theme Builder helps |
|---|---|---|
| **Enterprise architects** | ChatGPT/Claude generates diagrams that never match brand colors | Export a prompt scaffold that embeds the brand palette |
| **Technical writers** | Diagrams across docs are inconsistent; each engineer uses a different palette | Share a `.mmtheme` URL or Markdown bootstrap as a team standard |
| **Product managers** | Confluence/Notion diagrams look amateur | Apply a curated palette in 30 seconds without touching Mermaid syntax |
| **Consultants** | Client deliverables need consistent branding across 15+ architecture diagrams | Generate all diagrams from one Apply tab session with a named palette |
| **AI power users** | Generate 10+ Mermaid diagrams per week; restyling each is friction | One prompt scaffold — every subsequent LLM diagram arrives pre-styled |

---

## Competitive Differentiation

| Feature | Mermaid Live Editor | Mermaid Chart | Mermaid Studio | **Mermaid Theme Builder** |
|---|---|---|---|---|
| Visual color editing | Dropdown only | Dropdown only | CSS completions | Two-way color swatch editor |
| Multi-family theme | No | No | Partial | 27+ family capability registry |
| Renderer compatibility warnings | No | No | No | Per-renderer warning system |
| LLM prompt scaffold export | No | No | No | Prompt Scaffold export |
| Portable `%%{init}%%` export | Paste only | No | No | Styled Code + Markdown Bootstrap |
| Mermaid Live Editor link | No | No | No | Live Editor button |
| No login required | Yes | No | IDE account | Yes |
| No diagram content transmitted | Yes | No | Partial | Yes |
| Pricing | Free | $10–20/seat/mo | $49–99/yr | Free (portfolio project) |

---

## The Defensible Wedge

The three advantages that a well-funded first-party (Mermaid Chart) is unlikely to replicate quickly:

1. **Diagram-family parity awareness** — tracking which theming features work per family (classDef, look mode, linkStyle, subgraph style) is unglamorous maintenance work. The first-party is focused on collaboration and AI generation, not governance.

2. **LLM prompt-injectable theme artifact** — packaging a Mermaid theme as a system-prompt fragment that constrains LLM output is novel. No competitor ships this workflow end-to-end.

3. **Renderer divergence matrix** — validating theme output across GitHub, GitLab, Notion, Obsidian, Confluence, Docusaurus, Hugo, and VS Code and publishing the results is a knowledge moat. It compounds over time and is not the first-party's core product motion.

---

## Stage Strategy (Research-Recommended)

### Stage 1 — Narrow, Defensible Wedge (current)
- Theme Bundle artifact: themeVariables JSON + per-family classDef library + LLM prompt template
- Renderer parity matrix published publicly
- **Threshold to advance:** 500+ weekly theme-export users or 1+ inbound enterprise/docs-team conversation

### Stage 2 — LLM Workflow Integration
- MCP server and/or prompt scaffold snippets for Claude, ChatGPT, Cursor, Copilot
- CLI lint (`mermaid-lint --theme acme.mmtheme path/`) wrapping `mmdc`
- Connects to the skillz layer — agents load `okhp3-mermaid-theme-builder` and apply governance profiles programmatically
- **Threshold to advance:** Integration adopted by 1+ documentation platform team or cited in 1+ Mermaid GitHub thread as the recommended AI workflow approach

### Stage 3 — Enterprise Governance Plane
- SSO-gated central themes
- Figma variables to Mermaid themeVariables sync
- Git pre-commit hook + PR-bot with theme-diff previews
- Pricing analog: Mermaid Studio's $99/yr/seat, Mermaid Chart Premium tier

**Stages 2 and 3 are deliberately out of scope for v1.0.** The "permanently out of scope" list in `docs/roadmap.md` holds for v1.0.

---

## Positioning Analogs to Use in Copy

| Use | Avoid |
|---|---|
| Material Theme Builder (m3.material.io) | jQuery UI ThemeRoller (legacy/sunset) |
| tints.dev (Tailwind palette generator) | Generic "color picker" framing |
| Bootstrap theme builders (bootstrap.build) | |

> *"If Material Theme Builder is what you use before writing any Material component, Mermaid Theme Builder is what you configure before generating any Mermaid diagram."*

---

## Naming Consideration

The name "Mermaid Theme Builder" creates potential confusion with Mermaid Chart's "Theme Selector." No USPTO/WIPO trademark was found for "Mermaid" in the diagram-software class (surface search only — not a formal clearance). For portfolio/personal use this is not a current risk. For any commercial launch, a trademark clearance and a differentiated name should be evaluated. Research-suggested alternatives: "Theme Forge for Mermaid," "MermaidThemes.dev."
