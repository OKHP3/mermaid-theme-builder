# OKHP³ Visual Language Stack

**Last updated:** 2026-06-20
**Status:** Active positioning reference

---

## Overview

The OKHP³ Visual Language Stack is a set of related tools and frameworks that together cover the full lifecycle of structured visual communication — from capturing intent, to generating notation, to enforcing governance, to rendering reliably across environments.

Each layer in the stack is independent. You can use any layer without adopting the others. But when used together they form a coherent pipeline from raw intent to governed, brand-consistent visual output.

```
ReFolDec              Recursive decomposition and folding theory
    |
skillz                Agent-skill execution substrate
    |
BPMN for Mermaid      Process structure, notation, and workflow modeling layer
    |
Mermaid Theme Builder Visual governance, palette, renderer profile, and style-contract layer
    |
Target renderers      GitHub, Notion, Obsidian, M365 Loop, Confluence, Mermaid Live, CLI, etc.
```

---

## Layer Descriptions

### ReFolDec

Recursive folding and decomposition — the upstream transformation theory that governs how complex structures are broken down, represented, and reconstructed. ReFolDec provides the conceptual grammar that other layers in the stack draw on when parsing, simplifying, or recomposing structured representations.

In the context of Mermaid diagrams, ReFolDec thinking applies when you need to take a complex system description and decide which level of abstraction to express, which elements to collapse into a single node, and which boundaries to render explicitly.

### skillz

The agent-skill execution substrate. skillz defines a flat, portable skill package format that allows AI agents to apply domain-specific knowledge — theming a Mermaid diagram, generating a governed output, enforcing a diagram output contract — as a reusable, versioned, and composable capability.

Mermaid Theme Builder ships as a skillz-compatible skill package (`okhp3-mermaid-theme-builder`). When loaded by an agent, the skill instructs the agent how to detect diagram families, select renderer profiles, apply governance profiles, and export contract-compliant output — without requiring any special tool infrastructure.

See `skills/okhp3-mermaid-theme-builder/SKILL.md` for the current skill definition.

### BPMN for Mermaid

A sibling OKHP³ project. BPMN for Mermaid covers the process structure and workflow modeling layer — how to express business processes, decision flows, approval chains, and handoff sequences using Mermaid notation with explicit BPMN-like semantics.

Because standard Mermaid flowcharts can approximate BPMN-like visuals but do not implement BPMN 2.0 semantics (event types, gateways, pools, lanes, message flows, execution meaning), BPMN for Mermaid provides the structural and notational conventions that close that gap as far as text-based diagramming allows.

For process and workflow diagrams, start in BPMN for Mermaid to establish the structure, then pass the resulting Mermaid code through Mermaid Theme Builder for governance and styling.

Use the `okhp3-bpmn-for-mermaid` skill when the goal is process structure or workflow notation. Use the `okhp3-mermaid-theme-builder` skill when the goal is visual governance, palette application, or export scaffolding.

### Mermaid Theme Builder

The visual governance, palette, and style-contract layer. Mermaid Theme Builder governs:

- **Color palette** — which colors are used for which semantic roles across all diagram families
- **Typography** — font family and size hierarchy across title, subgraph, node label, and edge label tiers
- **Look** — Classic, Neo, or Hand-Drawn rendering style
- **Renderer profile** — which constraints apply to the target rendering environment (GitHub, Notion, M365 Loop, Obsidian, Confluence, etc.)
- **Lifecycle modes** — Apply, Extract, Compose, Update, Repair, and Export stages of the diagram governance workflow
- **Output contract** — the structural rules that govern AI-generated Mermaid code

Mermaid Theme Builder is a fully static browser tool — no backend, no login, nothing transmitted. See `docs/governance-profiles.md` for the Governance Profile concept.

---

## How the Layers Relate

| Question | Which layer answers it |
|---|---|
| How should I decompose and represent this system? | ReFolDec |
| Which skill should my AI agent load to do Mermaid work? | skillz |
| How should I express this business process in Mermaid notation? | BPMN for Mermaid |
| What colors, typography, and look should this diagram use? | Mermaid Theme Builder |
| Will this diagram render correctly in GitHub / Notion / Loop? | Mermaid Theme Builder — renderer profiles |
| How do I get my AI to generate consistently styled diagrams? | Mermaid Theme Builder — Prompt Scaffold export |

---

## Choose the Right Starting Point

**Starting from a business process or workflow?**
Use BPMN for Mermaid to structure the notation, then Mermaid Theme Builder to apply the governance profile.

**Starting from an existing Mermaid diagram?**
Use Mermaid Theme Builder in Apply or Extract mode directly.

**Starting from a color palette or brand guide?**
Use Mermaid Theme Builder Compose mode to build the governance profile first.

**Starting from AI-generated Mermaid output?**
Paste into Mermaid Theme Builder Apply tab, then export the Prompt Scaffold so future AI output arrives pre-governed.

**Building a reusable AI agent that generates diagrams?**
Load the `okhp3-mermaid-theme-builder` skill into your agent. Export a Governance Profile from the live tool, then inject it into the skill as the active palette and renderer target.

---

## Versioning

Each layer versions independently. Compatibility between layers is maintained through the shared output contract (`docs/diagram-output-contract.md`). Any tool in the stack that produces Mermaid code should produce code that satisfies the diagram output contract.

| Layer | Current version |
|---|---|
| Mermaid Theme Builder | 0.5.0 |
| okhp3-mermaid-theme-builder skill | 0.5.0 |
| BPMN for Mermaid | See that repository |
| skillz | See skillz repository |
