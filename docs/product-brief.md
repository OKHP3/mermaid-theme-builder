# Product Brief — Mermaid Theme Builder v0.5.0

**Project:** Mermaid Theme Builder
**Owner:** Jamie Hill / OverKill Hill P³
**Status:** Active — shipped v0.5.0
**Last updated:** 2026-06-20

---

## What it is

Mermaid Theme Builder is a fully static, browser-only visual governance utility for Mermaid diagrams. It helps you define a visual governance profile once, apply it to existing Mermaid code, preview the result, and export the themed diagram or a reusable prompt scaffold — so your LLM-generated diagrams stay on-brand.

Nothing is sent to a server. Your diagram code never leaves your browser.

**Stack context:** Mermaid Theme Builder is the visual governance layer in the OKHP³ Visual Language Stack. Sibling projects include BPMN for Mermaid (process structure and workflow modeling), skillz (agent-skill execution substrate), and ReFolDec (recursive decomposition theory). See `docs/okhp3-visual-language-stack.md` for the full stack reference.

---

## The problem it solves

AI assistants (ChatGPT, Claude, Gemini, Cursor, etc.) generate Mermaid diagrams constantly. They generate valid diagrams but almost never with correct, consistent styling. The `%%{init}%%` theme directive is underused, rarely documented, and frequently hallucinated.

Mermaid Theme Builder gives you:

1. A reusable governance profile expressed as a `%%{init}%%` block
2. A way to apply that profile to any Mermaid diagram in one click
3. A "Prompt Scaffold" export that teaches your AI assistant to maintain the profile in future diagrams

---

## Core workflow and lifecycle modes

```
Compose -> Apply -> Repair (if needed) -> Export
```

The full lifecycle covers six modes:

| Mode | What you do |
|---|---|
| **Compose** | Build or edit a governance profile — palette, typography, look, renderer target |
| **Apply** | Apply the profile to any Mermaid diagram — paste code, preview, compare |
| **Extract** | Pull a profile from existing styled Mermaid code |
| **Update** | Re-apply a changed profile to previously styled diagrams |
| **Repair** | Fix syntax issues in Mermaid code before or after theming |
| **Export** | Package the profile as Styled Code, Markdown Bootstrap, Prompt Scaffold, or JSON |

See `docs/governance-profiles.md` for the full lifecycle mode definitions.

---

## Non-goals (V1)

- No backend
- No login or user accounts
- No AI API calls
- No payment or cloud storage
- No file upload
- No fork of Mermaid
- No analytics that capture diagram content

---

## Built-in themes

### Brand presets (OKHP3 ecosystem)

| Palette | Site | Use case |
|---|---|---|
| OverKill Hill P³ | overkillhill.com | Technical, architectural, systems, executive-facing |
| AskJamie | askjamie.bot | Support flows, helpdesk, user-assistance |
| Glee-fully | glee-fully.tools | Personal productivity, consumer-facing, approachable |

### Utility palettes

- Ocean Depth — corporate blue
- Forest Sage — nature/sustainability
- Slate Ember — dark industrial
- Violet Mist — soft creative

---

## Diagram Inventory / Capability Registry

Mermaid Theme Builder includes a full Diagram Inventory accessible from the Reference tab. The registry answers four questions for every tracked diagram type:

1. **Does Mermaid support it?** — Support Status: Native, Partial, Emulatable, Gap, or External
2. **How safely can Theme Builder theme it?** — Theme Confidence: High, Medium, Generic Only, Low, or N/A
3. **Is the notation formally compliant?** — Notation Compliance: Mermaid-native, Approximation only, Not supported, or External tool recommended
4. **What example should I start from?** — Each entry links to the OverKill Mermaid Example Pack

### Mermaid families tracked (27)
Flowchart, Sequence, Class, State, ER, Journey, Gantt, Pie, Quadrant, Requirement, Git Graph, C4, Mindmap, Timeline, ZenUML, Sankey, XY Chart, Block, Packet, Kanban, Architecture, Radar, Treemap, Venn, Ishikawa, Wardley, Tree View.

### Capability gaps tracked (10)
BPMN 2.0, ArchiMate, SysML, Value Stream Map, Service Blueprint, OKR Alignment Map, Data Flow Diagram, Decision Tree, Org Chart, Threat Model DFD.

Gaps are tracked for honest reference only. **Mermaid Theme Builder does not implement unsupported formal notations.** BPMN 2.0 is a high-leverage gap but outside V1 implementation scope. Full new Mermaid diagram type creation is a separate upstream contribution lane. For BPMN-like process diagrams, see the BPMN for Mermaid sibling project.

### Style strategy summary

| Strategy | Meaning |
|---|---|
| **Full** | All themeVariables apply reliably |
| **Partial** | Most apply; some colors are managed internally |
| **Limited** | Background/text apply; diagram-specific colors do not |

---

## Attribution model

- Metadata comments are included by default in all exports
- An optional attribution badge node can be injected into flowchart diagrams only
- All exports include a non-affiliation disclaimer

---

## Canonical disclaimer

> Mermaid Theme Builder is a personal OverKill Hill P³ project by Jamie Hill. It is not affiliated with Builders FirstSource, BFS, Mermaid, Mermaid Chart, Mermaid.ai, or any third-party brand represented by user-entered colors.

---

## Success criteria (v0.5.0 — completed)

- [x] Full BFS/employer brand firewall in place
- [x] Three OKHP3 brand presets with accurate colors
- [x] 27-type capability registry (10 gap entries)
- [x] Capability note shown for non-full diagram types
- [x] Three export formats working with metadata
- [x] Live side-by-side preview with pan/zoom
- [x] Fully static — no network calls except Mermaid dependency load at build time
- [x] Attribution badge injectable for flowchart only
- [x] OKH Forge UI System (design token layer)
- [x] Renderer parity matrix (Reference tab)
- [x] Class browser (Reference tab)
- [x] Example library (26 entries, Examples tab)
- [x] skillz-compatible SKILL.md package (v0.5.0)

---

## Roadmap summary

See `docs/roadmap.md` for the full roadmap and `docs/okhp3-visual-language-stack.md` for stack positioning.

**V0.6 targets:**
- Governance profile export (named bundle combining palette, look, typography, renderer target)
- Family-specific Prompt Scaffold templates
- Renderer compatibility warnings in export bar
- Playwright smoke tests

**V0.7 targets:**
- Layout tier tokens (zone.primary, zone.system, lane.human, lane.automated classDef additions)
- Syntax-highlighted code editor
- WCAG 2.1 AA audit
