# Capability Crosswalk — Mermaid Theme Builder v0.5.0

Maps every diagram family in the registry to its Mermaid support status, theme confidence level, example file, and renderer-specific notes.

Source: `src/data/mermaid-capabilities.ts` · Verified against Mermaid 11.15.0.

---

## Legend

| Column | Meaning |
|--------|---------|
| **Diagram Family** | Display name and registry `id` |
| **Stability** | Mermaid's own stability label for the diagram type |
| **Support Status** | How the builder covers this family: Native / Partial / Gap / External |
| **Theme Confidence** | How reliably `themeVariables` control the visual output: High / Medium / Generic Only / Low / N/A |
| **Example File** | Authoring reference in `examples/` and whether it is wired into the example library |
| **Renderer Notes** | Caveats for specific renderers or look modes |

---

## Native Diagram Families (28 families)

| Diagram Family | Stability | Support Status | Theme Confidence | Example File | Renderer Notes |
|----------------|-----------|---------------|-----------------|--------------|---------------|
| **Flowchart** (`flowchart`) | Stable | Native | High | `flowchart-overkill-operating-system.mmd` ✓ | Classic / Neo / Hand-Drawn all supported. Best-supported family for full theme control, classDef, subgraphs, and linkStyle. |
| **Sequence Diagram** (`sequenceDiagram`) | Stable | Native | Medium | `sequence-council-to-prototype.mmd` ✓ | Classic and Neo supported. Hand-Drawn not supported (Rough.js limitation). Actor and background colors theme reliably; activation box fills are partial. |
| **Class Diagram** (`classDiagram`) | Stable | Native | Medium | `class-domain-model.mmd` ✓ | Classic and Neo supported. Hand-Drawn not supported. classDef applies to class boxes. Relationship line labels use primaryTextColor. |
| **State Diagram** (`stateDiagram`) | Stable | Native | Medium | `state-theme-lifecycle.mmd` ✓ | Classic, Neo, Hand-Drawn all supported. classDef supported. Composite state backgrounds use clusterBkg. stateDiagram v1 syntax not separately tested. |
| **ER Diagram** (`erDiagram`) | Stable | Native | Medium | `er-theme-registry.mmd` ✓ | Classic and Neo supported. Hand-Drawn not supported. No classDef or linkStyle. Relationship lines use lineColor. |
| **Gantt Chart** (`gantt`) | Stable | Native | Generic Only | `gantt-mermaid-theme-builder-roadmap.mmd` ✓ | Classic only. Task bar colors cycle from Mermaid's internal Gantt palette — not overridable via themeVariables. Background and grid colors apply reliably. |
| **Pie Chart** (`pie`) | Stable | Native | Generic Only | `pie-effort-allocation.mmd` ✓ | Classic only. Pie slice colors cycle internally (pie1–pie12). Background and title apply. |
| **User Journey** (`journey`) | Stable | Native | Generic Only | `journey-idea-to-shipped-tool.mmd` ✓ | Classic only. Task bar and section header colors managed by Mermaid's journey renderer. Background and global text apply. |
| **Quadrant Chart** (`quadrantChart`) | Stable | Native | Medium | `quadrant-opportunity.mmd` ✓ | Classic only. Background, axis labels, and grid lines apply. Quadrant fill and data point colors respond partially. |
| **Requirement Diagram** (`requirementDiagram`) | Stable | Native | Medium | `requirement-scope-firewall.mmd` ✓ | Classic and Neo supported. Hand-Drawn not supported. Requirement box backgrounds, borders, and text theme reliably. |
| **Git Graph** (`gitGraph`) | Stable | Native | Generic Only | `gitgraph-repo-evolution.mmd` ✓ | Classic only. Branch and commit colors are managed by Mermaid's gitGraph renderer. Background colors apply. |
| **Mindmap** (`mindmap`) | Stable | Native | Generic Only | `mindmap-overkill-hill-system.mmd` ✓ | Classic and Neo supported. Hand-Drawn not supported. Individual node fill colors managed internally — themeVariables have limited effect. |
| **Timeline** (`timeline`) | Stable | Native | Generic Only | `timeline-overkill-theme-builder-history.mmd` ✓ | Classic only. Section and event colors respond partially. Background and title apply. Full color control requires CSS injection. |
| **Kanban** (`kanban`) | Stable | Native | Generic Only | `kanban-public-alpha-board.mmd` ✓ | Classic only. Card backgrounds partially influenced by themeVariables. Column header colors managed internally. Requires Mermaid 11.4.0+. |
| **ZenUML** (`zenuml`) | Stable | Native | Medium | `zenuml-council-prototype-flow.mmd` ✓ | Classic only. Background and participant colors apply. Less granular than sequenceDiagram. Requires Mermaid 11.0.0+. |
| **C4 Diagram** (`c4Diagram`) | Stable | Partial | Medium | `c4-context-overkill-ecosystem.mmd` ✓ | Classic only. Covers C4Context / Container / Component / Dynamic / Deployment. Background and primary colors apply; C4-specific boundary and system colors may need CSS for full brand control. Not supported on Hand-Drawn or Neo. |
| **Sankey Diagram** (`sankey`) | Beta | Partial | Medium | `sankey-effort-to-output.mmd` ✓ | Classic only. Mermaid 11.15 added configurable nodeWidth, nodePadding, and custom node colors. Individual link flow colors still cycle internally. Validate in target renderer before publication. |
| **XY Chart** (`xychart`) | Beta | Partial | Medium | `xychart-clarity-velocity.mmd` ✓ | Classic only. Background, axis labels, and title apply. Bar and line series colors respond partially. Validate in target renderer. Requires Mermaid 10.9.0+. |
| **Block Diagram** (`block`) | Beta | Partial | Medium | `block-product-modules.mmd` ✓ | Classic only. Theming applies to block backgrounds, borders, and text. classDef supported for custom block styling. Requires Mermaid 11.0.0+. |
| **Packet Diagram** (`packet`) | Beta | Partial | Generic Only | `packet-theme-bootstrap-payload.mmd` ✓ | Classic only. Use `packet` keyword (not `packet-beta`) for Mermaid 11.0+. Background and text apply. Packet field colors not controlled by themeVariables. Requires Mermaid 11.0.0+. |
| **Architecture Diagram** (`architectureBeta`) | Beta | Partial | Generic Only | `architecture-static-app.mmd` ✓ | Classic only. Keyword is `architecture-beta`. Node backgrounds and line colors apply. May change in future Mermaid releases. Requires Mermaid 11.1.0+. |
| **Wardley Map** (`wardley`) | Beta | Partial | Low | `wardley-basic.mmd` ✓ | Classic only (Hand-Drawn not supported, falls back to Classic). Background colors apply. Component and evolution axis styles managed internally. Requires Mermaid 11.14.0+. |
| **Radar Chart** (`radar`) | Experimental | Partial | Generic Only | `radar-product-maturity.mmd` ✓ | Classic only. Background and title apply. Radar polygon and axis colors managed internally. Keyword is `radar-beta`. Requires Mermaid 11.6.0+. |
| **Treemap** (`treemap`) | Experimental | Partial | Low | `treemap-project-value.mmd` ✓ | Classic only. Node fill colors use internal color cycling — themeVariables do not apply reliably. Keyword is `treemap-beta`. Requires Mermaid 11.4.0+. |
| **Venn Diagram** (`venn`) | Experimental | Partial | Low | `venn-measure-document-diagram.mmd` ✓ | Classic only. Circle fill and label colors respond partially. Background applies reliably. Keyword is `venn-beta`. Requires Mermaid 11.12.3+. |
| **Ishikawa (Fishbone)** (`ishikawa`) | Experimental | Partial | Low | `ishikawa-premature-rendering-root-cause.mmd` ✓ | Classic only. Background and spine line colors apply via themeVariables. Branch-level node colors not individually controllable. Keyword is `ishikawa-beta`. Requires Mermaid 11.12.3+. |
| **Tree View** (`treeView`) | Experimental | Partial | Low | `treeview-example-index.mmd` ✓ | Classic only. Keyword is `treeView-beta`. Theming support is limited. May not render consistently across Mermaid-compatible environments. Requires Mermaid 11.14.0+. |
| **Event Modeling** (`eventModeling`) | Experimental | Partial | Low | `eventmodeling-basic.mmd` ✓ | Classic only. New in Mermaid 11.15.0. Background and primary colors apply. Per-element styling not available. Will not render on Mermaid installations older than 11.15.0. |

---

## Gap / Emulatable / External Entries (10 entries)

These are listed in the capability registry for reference but are not native Mermaid diagram types. They may be approximated using native families.

| Diagram Type | Support Status | Theme Confidence | Approximated By | Example File | Notes |
|-------------|---------------|-----------------|-----------------|--------------|-------|
| **BPMN 2.0** (`bpmn`) | Gap | N/A | `flowchart` | — (pending) | BPMN 2.0 semantics not supported in Mermaid. Use Camunda Modeler or bpmn.io for formal compliance. Flowchart can approximate visual flows only. |
| **ArchiMate** (`archimate`) | External | N/A | `flowchart` | — (pending) | Not supported in Mermaid. Use Archi, Sparx EA, or other ArchiMate-certified tools. |
| **SysML** (`sysml`) | External | N/A | `requirementDiagram` | — (pending) | Not supported in Mermaid. Use Cameo Systems Modeler or MagicDraw. requirementDiagram approximates requirements views only. |
| **Value Stream Map** (`value-stream-map`) | Emulatable | Low | `flowchart` | — (pending) | VSM symbols (push arrows, kaizen bursts, inventory icons) not available in Mermaid. classDef can differentiate value-add vs. waste steps in a flowchart approximation. |
| **Service Blueprint** (`service-blueprint`) | Emulatable | Low | `sequenceDiagram` | — (pending) | Swim-lane separation and line of visibility not natively supported. Sequence or flowchart can approximate but omits frontstage/backstage distinction. |
| **OKR Alignment Map** (`okr-alignment-map`) | Emulatable | Low | `mindmap` | — (pending) | Mindmap or flowchart can approximate OKR hierarchy. Dedicated OKR tools (Lattice, Betterworks) provide richer semantic modeling. |
| **Data Flow Diagram** (`dfd`) | Emulatable | Low | `flowchart` | — (pending) | DFD symbols (circles for processes, parallel lines for data stores) not available. Flowchart approximation supported. |
| **Decision Tree** (`decision-tree`) | Emulatable | Medium | `flowchart` | — (pending) | Maps naturally to flowchart using diamond gate nodes. Probability annotations not natively supported. |
| **Org Chart** (`org-chart`) | Emulatable | Medium | `flowchart` | — (pending) | Approximated with flowchart TD layout. Dedicated org chart tools support photo/avatar rendering. |
| **Threat Model DFD** (`threat-model-dfd`) | Emulatable | Low | `flowchart` | — (pending) | STRIDE/PASTA semantics approximate with dashed trust boundaries and classDef threat annotations. Formal modeling requires Threat Dragon or IriusRisk. |

---

## Renderer Look Support by Family

Summary of which Mermaid rendering looks each family supports:

| Look | Supported Families | Not Supported |
|------|-------------------|---------------|
| **Classic** | All 28 native families | — |
| **Neo** | flowchart, sequenceDiagram, classDiagram, stateDiagram, erDiagram, requirementDiagram, mindmap, zenuml | gantt, pie, gitGraph, journey, quadrantChart, timeline, kanban, sankey, xychart, block, packet, architectureBeta, radar, treemap, venn, ishikawa, wardley, treeView, eventModeling, c4Diagram |
| **Hand-Drawn** | flowchart, stateDiagram | All others (Rough.js not bundled by most renderers) |

> **Renderer compatibility:** Notion and Confluence plugin renderers support Classic only. GitHub's pinned Mermaid version determines Neo availability. Hand-Drawn requires Rough.js, which only mermaid.live and CLI bundle by default.

---

*Last updated: Mermaid Theme Builder v0.5.0, Mermaid 11.15.0.*
