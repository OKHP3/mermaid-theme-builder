# Capability Crosswalk — Mermaid Theme Builder v0.5.0

Maps Mermaid 11.15.0 capability → builder registry coverage → public project page claim → identified gap.

Generated from `src/data/mermaid-capabilities.ts` and validated against the Mermaid 11.15.0 changelog and documentation.

---

## Legend

| Column | Meaning |
|--------|---------|
| **Mermaid 11.15 Capability** | Feature or diagram type as documented in Mermaid 11.15.0 |
| **Registry ID** | `id` field in `DIAGRAM_CAPABILITIES` |
| **Builder Coverage** | What the builder does with this capability |
| **Project Page Claim** | What the public project page says (overkillhill.com/projects/mermaid-theme-builder/) |
| **Gap / Notes** | Discrepancy, caveat, or known limitation |

---

## Diagram Families

| Mermaid 11.15 Capability | Registry ID | Builder Coverage | Project Page Claim | Gap / Notes |
|--------------------------|-------------|-----------------|-------------------|-------------|
| Flowchart | `flowchart` | Full detection, theming, classDef, subgraph, preview | Supported | None |
| Sequence Diagram | `sequenceDiagram` | Full detection, theming, actor colors | Supported | No classDef (not applicable) |
| Class Diagram | `classDiagram` | Full detection, theming, classDef | Supported | None |
| State Diagram (v2) | `stateDiagram` | Full detection, theming | Supported | stateDiagram v1 syntax not tested |
| ER Diagram | `erDiagram` | Detection, theming (limited) | Supported | themeVars apply partially; no classDef |
| Gantt | `gantt` | Detection, theming | Supported | Section colors use themeVars only |
| Pie Chart | `pie` | Detection, theming | Supported | pie1–pie12 colors from themeVars |
| Git Graph | `gitGraph` | Detection, theming | Supported | git0–git7 branch colors from themeVars |
| User Journey | `journey` | Detection, theming | Supported | Limited themeVar influence |
| Quadrant Chart | `quadrantChart` | Detection, theming | Supported | Axis/label colors from themeVars |
| Requirement Diagram | `requirementDiagram` | Detection, theming | Supported | None |
| Mindmap | `mindmap` | Detection, theming | Supported | Limited themeVar influence |
| Timeline | `timeline` | Detection, theming | Supported | Limited themeVar influence |
| ZenUML | `zenuml` | Detection, theming | Supported | None |
| Sankey (beta) | `sankey` | Detection, theming | Supported | beta stability |
| XY Chart (beta) | `xychart` | Detection, theming | Supported | beta stability |
| Block Diagram (beta) | `block` | Detection, theming, classDef | Supported | beta stability |
| Architecture (beta) | `architectureBeta` | Detection, partial theming | Supported (beta) | Keyword is `architecture-beta`; minMermaid 11.14.0; classDef not supported |
| Packet (beta) | `packet` | Detection, partial theming | Supported (beta) | beta stability |
| Kanban | `kanban` | Detection, partial theming | Supported | minMermaid 11.14.0; themeVar influence is low |
| C4 (multi-variant) | `c4Diagram` | Detection via regex, partial theming | Supported | Covers C4Context/Container/Component/Dynamic/Deployment; CSS typically needed for full brand color control |
| Wardley Map (beta) | `wardley` | Detection via `wardley-beta` keyword, partial theming | Supported (beta) | handDrawn not supported; low theme confidence |
| Tree View (experimental) | `treeView` | Detection, limited theming | Listed | `treeView-beta` keyword; experimental stability |
| Event Modeling | `eventModeling` | Detection, limited theming | Listed | minMermaid 11.15.0; example available |
| Radar | `radar` | Detection, limited theming | Listed | Limited themeVar influence |
| Treemap | `treemap` | Detection, limited theming | Listed | Limited themeVar support |
| Venn (beta) | `venn` | Detection, limited theming | Listed (beta) | beta; themeVar influence is low |
| Ishikawa (beta) | `ishikawa` | Detection, limited theming | Listed (beta) | beta; minimal themeVar influence |

---

## Diagram Families — Extended Registry (non-native / community)

These are in the registry as `notationCompliance: "extended"` or `"community"` and listed in the builder for reference, but are not native Mermaid diagram types.

| Registry ID | Type | Builder Coverage | Gap / Notes |
|-------------|------|-----------------|-------------|
| `bpmn` | BPMN 2.0 (via plugin) | Detection signal only, no native theming | Not a native Mermaid type; requires bpmn.js plugin |
| `archimate` | ArchiMate (via plugin) | Detection signal only | Not native; reference listing |
| `sysml` | SysML (via plugin) | Detection signal only | Not native; reference listing |
| `value-stream-map` | Value Stream Map | Detection signal only | Notation only; no native Mermaid support |
| `service-blueprint` | Service Blueprint | Detection signal only | Notation only |
| `okr-alignment-map` | OKR Alignment Map | Detection signal only | Notation only |
| `dfd` | Data Flow Diagram | Detection signal only | Notation only; approximate with flowchart |
| `decision-tree` | Decision Tree | Detection signal only | Notation only; approximate with flowchart |
| `org-chart` | Org Chart | Detection signal only | Notation only; can approximate with gitGraph or flowchart |
| `threat-model-dfd` | Threat Model DFD | Detection signal only | Notation only |

---

## Rendering Looks (Mermaid 11.15.0)

| Look | Mermaid 11.15 Status | Builder Registry | Renderer Parity | Gap / Notes |
|------|---------------------|-----------------|----------------|-------------|
| Classic | Stable, default | Fully supported | Universal | None |
| Neo | Stable (11.4+) | Fully supported | Full on live/CLI, partial on GitHub/GitLab/Obsidian, none on Notion/Confluence | Notion and Confluence pinned to Mermaid 10.x — Neo unavailable |
| Hand-Drawn | Stable (11.x) | Fully supported | Full on live/CLI, partial on Obsidian, none elsewhere | Requires Rough.js bundled by the renderer; GitHub, GitLab, Notion do not bundle Rough.js |

---

## themeVariables (Mermaid 11.15.0)

| Variable | Builder Exposes | Palettes Use It | Gap / Notes |
|----------|----------------|----------------|-------------|
| `primaryColor` | Yes | Yes | Core brand primary |
| `primaryTextColor` | Yes | Yes | Text on primary backgrounds |
| `primaryBorderColor` | Yes | Yes | Border on primary elements |
| `secondaryColor` | Yes | Yes | Supporting color |
| `tertiaryColor` | Yes | Yes | Background / neutral areas |
| `background` | Yes | Yes | Page/canvas background |
| `mainBkg` | Yes | Yes | Main background (aliases primaryColor in some families) |
| `nodeBorder` | Yes | Yes | Node border color |
| `clusterBkg` | Yes | Yes | Subgraph background |
| `lineColor` | Yes | Yes | Edge/line color |
| `edgeLabelBackground` | Yes (editable) | Yes | Edge label pill background |
| `fontFamily` | Yes | Yes | Global font stack |
| `fontSize` | Via separate control | Via separate control | Global base size; per-tier sizes in Typography section |

---

## Typography Hierarchy (Phase 3 — Builder v0.5.0)

| Tier | Default Size | Builder UI | Scaffold Section | Mermaid Native Control | Gap |
|------|-------------|-----------|-----------------|----------------------|-----|
| Diagram Title | 20px | Yes (±1 stepper) | Yes | Via `%%{init}%% title` (limited) | Mermaid does not expose a distinct title font-size themeVar; CSS targeting `.label` required for full control |
| Subgraph Title | 16px | Yes | Yes | Via `.cluster-label` (CSS only) | Not a themeVar — CSS injection required |
| Nested Subgraph | 14px | Yes | Yes | Via `.cluster-label .nodeLabel` (CSS only) | CSS only; renderer support varies |
| Node Label | 14px | Yes | Yes | Via `fontSize` themeVar (all nodes, not per-tier) | Per-tier control requires CSS; `fontSize` themeVar scales all text globally |
| Edge Label | 12px | Yes | Yes | Via `.edgeLabel` (CSS only) | CSS only; renderers that block CSS injection will not respect per-tier edge sizes |

---

## Prompt Scaffold Sections (Phase 6 target — v0.5.0)

| Section | Current State | Phase 6 Target | Gap |
|---------|-------------|---------------|-----|
| Theme directive (Format A / B) | Present | Present | None |
| Metadata comments | Present | Present | None |
| Semantic classDef library | Present | Present | None |
| Subgraph tier patterns | Present | Present | None |
| Color reference table | Present | Present | None |
| Typography contract | Present (Phase 3) | Present | None |
| Renderer target section | Absent | Phase 6 | rendererTarget not yet in ExportOptions or scaffold output |

---

*Last updated: Mermaid Theme Builder v0.5.0, Mermaid 11.15.0, research-grounding sprint completion.*
