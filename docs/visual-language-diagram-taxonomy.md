# Visual Language Diagram Taxonomy — Mermaid Theme Builder

> **Document origin:** Migrated from internal Notion workspace (May 2026).  
> **Source of truth:** This file in the repository.

---

## Purpose

This document tracks the broader universe of diagram types used as visual language across business, technology, design, science, engineering, operations, and strategy.

The goal is not to make Mermaid Theme Builder responsible for every diagram type. The goal is to build a reference layer that helps answer:

- What diagram types exist?
- Who uses them?
- What notation or shape grammar do they rely on?
- Is the diagram still widely used?
- Is Mermaid native, partial, emulated, or missing?
- Should Mermaid Theme Builder provide examples, warnings, or theme support?
- Which gaps are worth watching or contributing upstream to Mermaid?

---

## Relationship to Mermaid Theme Builder

Mermaid Theme Builder should remain a **static, browser-based theming and visual-governance utility**. It should not become a full diagram-standard implementation project.

This taxonomy supports the product by creating a decision layer:

```
Diagram universe
→ Mermaid support status
→ theming confidence
→ example index
→ gap/opportunity backlog
```

---

## Diagram Inventory Operating Model

This taxonomy is the control layer for a three-part operating model:

1. **Diagram Taxonomy**  
   The broad universe of visual-language diagram types, whether Mermaid supports them or not.

2. **Mermaid Capability Registry**  
   The app-facing layer showing what Mermaid Theme Builder can detect, theme, warn about, and demonstrate safely.

3. **Example Library**  
   The repo/app examples that users can load, inspect, theme, and learn from.

**Strategic statement (north star):**  
"Mermaid Theme Builder should become the layer that helps users understand what kind of diagram they are making, whether Mermaid supports it, how safely it can be themed, what example to start from, and what limitations apply."

---

## Support Status Definitions

| Status | Meaning |
|--------|---------|
| **Native** | Mermaid directly supports the diagram family. |
| **Partial** | Mermaid supports a related or limited form, but not the full notation. |
| **Emulatable** | Mermaid can visually approximate the concept, usually with flowchart, block, or mindmap syntax. |
| **Gap** | Mermaid does not meaningfully support the diagram type. |
| **External** | The diagram type belongs more naturally in GIS, CAD, BI, statistical, design, engineering, or other specialized tools. |

---

## Theme Confidence Definitions

| Confidence | Meaning |
|------------|---------|
| **High** | Mermaid Theme Builder can apply rich styling or strong visual governance. |
| **Medium** | Theming is useful, but diagram-specific styling surface is narrower. |
| **Generic Only** | Broad theme variables may apply, but semantic styling is limited. |
| **Low** | Renderer/version differences make theming uncertain. |
| **Not Applicable** | Unsupported or external diagram type. |

---

## Notation Compliance Warnings

> "Mermaid Theme Builder must not claim that an emulated diagram is compliant with a formal notation unless Mermaid actually supports that notation. For example, a flowchart can approximate a BPMN-like business process, but it is not BPMN 2.0 compliant."

Specific warning language (use in UI copy and example headers where relevant):

- **BPMN 2.0:** Flowchart emulations may look BPMN-like, but they do not implement BPMN semantics, event types, gateways, pools/lanes behavior, or execution meaning. Label as **Approximation only**.
- **ArchiMate:** Mermaid diagrams can approximate architecture views, but do not implement ArchiMate element types/relationships or viewpoint compliance. Label as **Approximation only**.
- **SysML:** Mermaid can approximate blocks/states, but does not implement SysML semantics, constraint blocks, parametrics, allocations, or full diagram set. Label as **Approximation only**.
- **Value Stream Map:** Flowcharts can approximate stages/queues, but do not encode lean VSM symbols, inventory/lead-time calculations, or standard VSM notation. Label as **Approximation only**.
- **Service Blueprint:** Swimlane-like flowcharts can approximate lanes, but do not implement service blueprint conventions (line of visibility, evidence, backstage/frontstage semantics). Label as **Approximation only**.
- **OKR Alignment Map:** Mermaid can express hierarchies/links, but does not validate OKR semantics (ownership, weighting, scoring, funding) — treat as a **visual alignment aid**, not a compliance artifact.
- **Threat Model DFD:** Mermaid can approximate DFD-like flows, but does not validate trust boundaries, data classifications, or STRIDE coverage. Label as **Approximation only** and include security caveats.

---

## Taxonomy Usage Model

This taxonomy has three jobs:

1. **Describe the diagram universe**  
   Capture the common diagram types used across business, technology, design, engineering, strategy, data, and operations.

2. **Classify Mermaid support**  
   Identify whether each diagram type is native, partial, emulatable, a gap, or better handled externally.

3. **Drive product decisions**  
   Decide whether Mermaid Theme Builder should:
   - provide a native example,
   - provide an emulation example,
   - add a renderer warning,
   - add theme support,
   - track as a future Mermaid contribution candidate,
   - or explicitly exclude from scope.

The taxonomy is not a commitment to implement every diagram type. It is a product intelligence layer.

---

## Scope Boundary: Theme Builder vs. New Mermaid Diagram Types

Mermaid Theme Builder should not implement new Mermaid diagram grammars inside this project.

**In scope:**
- detect known Mermaid diagram families
- style Mermaid-supported diagrams
- warn when support is partial
- provide examples and emulation patterns
- maintain a capability registry
- export prompt scaffolds and theme bootstraps

**Out of scope for this project:**
- creating a new BPMN parser
- creating a new ArchiMate grammar
- creating a new SysML renderer
- maintaining custom diagram syntax outside Mermaid core
- becoming a competing diagramming language

**Future option:**  
A separate OverKill Hill research project may explore upstream Mermaid contributions for high-value gaps such as BPMN.

---

## Decision Record: BPMN Is High-Leverage, But Not V1 Scope

**Decision:** BPMN-style business process modeling is the highest-leverage gap currently identified, but full BPMN implementation is outside Mermaid Theme Builder V1 scope.

**Why BPMN matters:**
- It serves business analysts, process architects, automation teams, enterprise architects, and operations leaders.
- It aligns with the diagram-heavy work where AI-generated Mermaid could provide immediate value.
- Mermaid flowcharts can approximate BPMN-like visuals but do not implement BPMN semantics.

**What Mermaid Theme Builder should do now:**
- Add `bpmn-lite-emulation.mmd`.
- Clearly label it as "BPMN-like, not BPMN 2.0 compliant."
- Track BPMN as a critical gap in the taxonomy database.
- Add BPMN to the capability registry as `Gap / Emulatable`.
- Avoid claiming true BPMN support.

**What may happen later:**  
A separate research lane may investigate what it would take to propose BPMN support upstream to Mermaid.

---

## What Is Involved in Creating a New Mermaid Diagram Type?

Creating a new Mermaid diagram type is a real open-source engineering effort. It is not equivalent to adding a theme preset.

A new Mermaid diagram type generally requires:

1. Define the use case and notation boundary.
2. Define the Mermaid syntax users will type.
3. Design or extend the grammar/parser.
4. Map parsed syntax into an internal representation.
5. Build a renderer that outputs SVG.
6. Define layout behavior.
7. Add theme-variable support.
8. Add styling hooks.
9. Create examples.
10. Create automated tests.
11. Write documentation.
12. Align with Mermaid maintainers.
13. Submit and iterate on an upstream pull request.
14. Maintain compatibility as Mermaid evolves.

**Implication:**  
This is outside the Mermaid Theme Builder product lane, but it could become a separate OverKill Hill technical contribution project.

---

## BREAKING: Wardley Maps shipped in Mermaid v11.14.0 (`wardley-beta`)

As of April 2026, Wardley Maps are now a native Mermaid diagram type (`wardley-beta`). This was one of our top-5 high-priority gaps. It closed while we were building the Theme Builder.

**Immediate action items:**
- Update `detector.ts` to detect `wardley-beta` diagrams
- Add wardley-beta to the Mermaid Capability Registry
- Create a `wardley-basic.mmd` example for the example library
- Update the gap analysis: Mermaid now has 22 native types (was 21)
- Study the Wardley Map implementation as a case study for how new diagram types get created

---

## Gap Analysis Summary (April 2026 — 91-type catalog)

- **Mermaid: Full support** — 22 types: flowchart, sequence, class, state, ER, gantt, pie, gitGraph, mindmap, timeline, quadrant, journey, block, sankey, xychart, requirement, C4 (×4), zenuml, packet, architecture, kanban, **wardley-beta**
- **Mermaid: Partial / Emulatable** — 12 types: swimlane, decision tree, org chart, sitemap, activity diagram, component diagram, deployment diagram, dimensional model, WBS, stakeholder map, SWOT, data lineage
- **Mermaid: No support** — 57 types

### High-priority gaps

| Gap | Why it matters |
|-----|----------------|
| BPMN (ISO 19510) | Millions of practitioners. No text-diagram tool covers it. |
| Use Case Diagram (UML) | Core UML. Extremely common in requirements engineering. |
| Wardley Map | ~~Rapidly growing in CTO/strategy community.~~ **Closed — shipped in v11.14.0.** |
| Threat Model (STRIDE/DFD) | Security-first orgs. Growing with DevSecOps. |
| Org Chart | Universal need. Every organization has one. |

### Medium-priority gaps

Fishbone/Ishikawa, Value Stream Map, Venn Diagram, ArchiMate, DFD, Swimlane, Causal Loop Diagram, Service Blueprint, Data Lineage.

---

## The Wardley Maps Case Study: What It Actually Takes

Mark Craddock's implementation of `wardley-beta` for Mermaid v11.14.0 provides the first public, detailed post-mortem of creating a new Mermaid diagram type. This is the real blueprint.

### Architecture (6-layer pipeline)

```
Input (DSL) > Langium Grammar > Parser > AST > Database > Renderer > SVG
```

Each layer has one job. Data flows one direction. No layer reaches back.

### What was built

1. **Langium grammar file** — defines valid syntax (the DSL). Langium generates the parser, tokenizer, error recovery, and AST automatically from the grammar declaration.
2. **Parser integration** — hooks the generated parser into Mermaid's plugin architecture.
3. **Internal database layer** — walks the AST and populates a domain-specific data model (components, edges, evolution coordinates, annotations, pipelines).
4. **D3.js renderer** — reads the database and outputs positioned SVG elements (axes, components, edges, labels, annotations).
5. **Theme variable support** — so `wardley-beta` respects Mermaid's `%%{init}%%` theming system.
6. **12 E2E visual regression tests** — using snapshot comparison.
7. **Comprehensive documentation** for mermaid.js.org.
8. **OWM compatibility** — (OnlineWardleyMaps coordinate convention) so existing Wardley mappers can adopt the syntax without relearning coordinates.

### Key design decisions

- Used `[visibility, evolution]` coordinates (opposite of typical `(x, y)`) for OWM compatibility.
- Langium handles all parsing complexity declaratively; no hand-written tokenizer.
- Separation of concerns: parser knows syntax, database knows domain, renderer knows SVG.
- 147 real-world Wardley Maps from Simon Wardley's repository were used for validation.

### Effort estimate

The scope suggests 100–300 hours of focused engineering including grammar design, renderer, tests, docs, and upstream PR iteration. This is a serious open-source contribution, not a weekend project.

### Implication for BPMN

BPMN would be significantly more complex than Wardley Maps:

- Wardley Maps have ~10 element types.
- BPMN 2.0 has 100+ element types across events (start, intermediate, end × multiple triggers), tasks, gateways (exclusive, parallel, inclusive, complex, event-based), pools, lanes, message flows, data objects, artifacts, and sub-processes.
- BPMN has execution semantics — the diagram defines executable process logic.
- BPMN has a formal metamodel (ISO/IEC 19510).

A BPMN implementation for Mermaid would likely be 3–5× the effort of Wardley Maps, with the additional challenge of deciding which BPMN subset to support.

---

## Scope Recommendation

Keep Mermaid Theme Builder focused on theming, examples, capability registry, and visual governance. Treat new diagram-type creation as a **separate research lane** or future OverKill Hill technical contribution, not as a blocker for the current product.

```
V1:   Style and document existing Mermaid support.
V1.5: Create emulation examples for high-value gaps.
V2+:  Consider separate upstream contribution research for BPMN, ArchiMate, or SysML.
```

---

## Crossover: Diagramming as Measurement

A diagram measures relationships — proximity, dependency, sequence, hierarchy, and boundary. Documentation records what was observed. Diagramming records what was observed in spatial terms. Measurement applies a standard to an observation to produce a comparable value. All three are siblings.

This lens connects to OKR frameworks:

- OKR trees are inherently hierarchical diagrams (mindmap or flowchart TD topology).
- The "Align" superpower is a diagramming problem: orphaned or unfunded OKRs are invisible in tables but obvious in tree diagrams.
- The 0.0–1.0 scoring system is a heatmap waiting to happen.
- CFR cadences (Conversations, Feedback, Recognition) map to sequence diagrams.

Potential article angle: *"Your OKRs Are Invisible Until You Diagram Them"* or *"The First OKR Tree Is Usually a Liar."*

---

*Last updated: May 2026. Migrated from Notion; maintained in this repository.*
