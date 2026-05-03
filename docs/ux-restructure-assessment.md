# UX Restructure Assessment — v0.3-alpha → V1 Sprint

> Mermaid Theme Builder is a personal OverKill Hill P³ project by Jamie Hill. It is not affiliated with Builders FirstSource, BFS, Mermaid, Mermaid Chart, Mermaid.ai, or any third-party brand represented by user-entered colors.

This document captures the current state of the product after the v0.3-alpha shipment and the V1 follow-on sprint, the remaining gaps relative to the V1.0 plan, and the mental model the four tabs are intended to reinforce.

## Current maturity (post v0.3-alpha + V1 follow-on)

| Dimension | State | Notes |
|---|---|---|
| Product maturity | **Alpha+ → early beta** | Workflow tabs, persistence, sharing, downloads, theme extraction, family-aware variables, custom font selector all shipped. |
| Technical maturity | **Solid alpha** | Typescript-strict, composite libs, OpenAPI codegen elsewhere in the monorepo, CI + Pages deploy wired. ErrorBoundary in place, no telemetry. |
| UX maturity | **Workflow-clear** | Four tabs map cleanly to four mental models. Apply is the default; Compose, Examples, Reference are no longer crowding it. |
| Mobile maturity | **Functional** | Tab navigation has desktop-top + mobile-bottom layouts. Apply stacks vertically below 768 px, color editor opens as a slide-out panel. Some dense reference content still benefits from larger viewports. |
| Information architecture | **Settled** | Capability registry powers detection, ApplyTab warnings, and the Reference tab. Examples grouped by category. Persistence schema versioned. |

## Feature inventory (shipped)

- Theme presets: 7+ palettes (5 brand, 2 utility, plus user-saved/imported/shared/extracted).
- Color editor: 13+ tokens per palette; per-palette user customizations stored in localStorage.
- Live Mermaid preview with ErrorBoundary and inline parse-error display.
- Diagram detection across 25+ Mermaid families (flowchart, sequence, class, state, ER, journey, gantt, pie, quadrant, requirement, gitGraph, C4, mindmap, timeline, zenuml, sankey, xychart, block, packet, kanban, architecture-beta, radar, treemap, venn, ishikawa, wardley-beta, treeView).
- Capability registry surfaces per-family `supportStatus`, `themeConfidence`, `notationCompliance`, `warning`, `bestUsedFor`.
- Examples organized by category (flow, structural, data-viz, timeline, specialty), each with a Beta/Native badge where applicable.
- Prompt Scaffold export with multiple LLM-format flavors.
- Watermark / metadata-comment toggles.
- File downloads: `.mermaid`, `.svg`, `.png`, `.theme.json`.
- Shareable URLs (`?theme=<base64url>`); portable JSON import/export.
- localStorage persistence (versioned schema; corrupt/newer schemas ignored gracefully).
- Theme extraction (Mode 3): pull a palette out of pasted code with bidirectional binding.
- Family-aware `themeVariables` overlay with base-palette-wins merge order.
- Font family selector in Compose tab (Inter, Trebuchet MS, Arial, Calibri, Georgia, Courier New, system-ui).
- GitHub Actions CI + Pages deploy with derived base path and SPA 404 fallback.
- Brand firewall scan clean (no BFS / Walmart / Starbucks / etc. references in code, examples, or palettes).

## Known deficiencies vs. V1.0 mega-sprint plan (deferred)

These are documented as future work rather than blockers:

- **Diff view** in Apply tab (Original / Themed / Diff toggle). Not shipped.
- **Dark mode** for the builder UI shell itself (the rendered Mermaid preview always uses a light background).
- **PWA manifest** + service worker for offline use.
- **Print stylesheet** that hides chrome and shows only the diagram.
- **Recent themes history** (last-N quick switcher).
- **Multiple-diagram preview** when the pasted code contains multiple diagrams.
- **Custom font input** beyond the curated dropdown.
- **Accessibility deep pass:** ARIA tablist roles, focus trap in modals, Esc-to-close on every modal, Ctrl+Enter shortcuts.

## Alignment with the Notion master plan

- ✅ Static browser utility, no backend.
- ✅ Visual governance focus; capability registry distinguishes native vs. emulatable vs. gap.
- ✅ Public GitHub Pages deployment with a derived base path.
- ✅ Personal-project firewall enforced — BFS, employer, and real-company brand references audited and removed where found.

## Brand-firewall scan (this sprint)

- Found and removed: one stray "OKH/BFS" reference in `src/data/example-pack.ts` description (the requirement-firewall example). Replaced with "OverKill Hill ownership firewall".
- All other matches for "BFS / Builders FirstSource" found by ripgrep are inside disclaimer language ("not affiliated with…"), which is allowed and required by the firewall policy.
- No real-company brand palettes present (Walmart, Starbucks, Apple, Microsoft, Target, Home Depot).

## Mental model the four tabs reinforce

| Tab | Question it answers |
|---|---|
| **Apply** | "What happens when I paste Mermaid and apply a theme?" |
| **Compose** | "What visual system should future Mermaid diagrams follow?" |
| **Examples** | "What example should I start from?" |
| **Reference** | "What does Mermaid support, what is safe to theme, and what should I not overclaim?" |

The Apply tab remains the default and stays uncluttered: palette ribbon, code input, preview, warnings, export bar. The Edit Colors slide-out keeps the full color editor one click away without crowding the default path.
