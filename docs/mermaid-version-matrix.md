# Mermaid Version Feature Matrix

**Last updated:** 2026-05-21  
**Covers:** Mermaid 11.11.0 through 11.15.0  
**Sources:** Official Mermaid GitHub release notes, ChatGPT research pass (2026-05-21)  
**Purpose:** Track which Mermaid features are available, which are surfaced in this app, and which are gaps.

---

## 11.11.0

| Feature | Category | Builder coverage | Notes |
|---|---|---|---|
| Sequence participant stereotypes | Syntax | ❌ Gap | `actor`, `boundary`, `control`, `entity`, `database`, `collections`, `queue` + aliases |
| Sequence diagram stabilization | Stability | ✅ Registry entry | Covered in capability registry |
| Security / sanitization patches | Security | ✅ (passive) | No builder action required |

---

## 11.12.x

| Feature | Category | Builder coverage | Notes |
|---|---|---|---|
| Stabilization and security trajectory | Security | ✅ (passive) | No builder action required |

---

## 11.13.0

| Feature | Category | Builder coverage | Notes |
|---|---|---|---|
| Venn diagram (beta) | New diagram | ✅ Registry entry | In capability registry |
| Ishikawa / fishbone diagram (beta) | New diagram | ✅ Registry + example | `ishikawa-premature-rendering-root-cause.mmd` |
| Root-level `htmlLabels` config | Config | ❌ Gap | Deprecated `flowchart.htmlLabels`; new location: root config. Not surfaced in exports. |
| Class namespace notes | Syntax | ❌ Gap | No example coverage in class diagram examples |
| CSS namespacing hardening | Security | ✅ (passive) | No builder action required |

---

## 11.14.0

| Feature | Category | Builder coverage | Notes |
|---|---|---|---|
| Wardley Maps (beta) | New diagram | ✅ Registry entry | `examplePending: true` — no example yet |
| TreeView (beta) | New diagram | ✅ Registry + example | `treeview-example-index.mmd` |
| `look: neo` for state and sequence | Look mode | ⚠ Partial | Registry notes; no per-family look warning UI yet |
| Architecture `randomize` config | Config | ❌ Gap | Not surfaced in exports or reference tab |
| Timeline direction `LR`/`TD` | Syntax | ❌ Gap | Not documented in timeline capability notes |
| XY chart individual bar labels | Config | ❌ Gap | `showDataLabel`, `showDataLabelOutsideBar` not surfaced |
| Root-level config migration for `htmlLabels` | Config | ❌ Gap | (same as 11.13 — confirmed in 11.14 release notes) |
| classDef hardening | Security | ✅ (passive) | No builder action required |

---

## 11.15.0

| Feature | Category | Builder coverage | Notes |
|---|---|---|---|
| **Event Modeling** (new diagram type) | New diagram | ⚠ Partial | Added to capability registry in this session. `examplePending: true`. |
| Architecture fcose layout tuning | Config | ❌ Gap | `nodeSeparation`, `idealEdgeLengthMultiplier`, `edgeElasticity`, `numIter` not surfaced |
| Hierarchical class namespaces | Syntax | ❌ Gap | Namespace labels, nested namespaces, `hierarchicalNamespaces: false` not in examples |
| Sankey styling controls | Config | ❌ Gap | New Sankey style properties not surfaced |
| CSS classDef hardening (continued) | Security | ✅ (passive) | No builder action required |
| Deterministic IDs / `deterministicIDSeed` | Config | ❌ Gap | Not surfaced in exports — important for same-page multi-diagram embeds |

---

## Cumulative Gap Summary

Gaps identified across 11.11–11.15 that are not yet surfaced in the builder:

| Gap | Version introduced | Priority | Effort |
|---|---|---|---|
| Event Modeling example | 11.15 | High | Small |
| Architecture randomize + fcose tuning | 11.14–11.15 | Medium | Small |
| Timeline direction LR/TD | 11.14 | Medium | Small |
| Root-level `htmlLabels` in exports | 11.13 | Medium | Small |
| Deterministic IDs in exports | 11.14–11.15 | Medium | Small |
| Hierarchical class namespaces example | 11.13–11.15 | Medium | Medium |
| Wardley Map example | 11.14 | Medium | Medium |
| XY chart label controls | 11.14 | Low | Small |
| Sankey styling controls | 11.15 | Low | Small |
| Sequence participant stereotypes example | 11.11 | Low | Medium |

---

## Look Mode Rollout Trajectory

`look:` support has been rolling out family-by-family across 11.x versions:

| Version | Look additions |
|---|---|
| 11.x baseline | `handDrawn` for flowchart only |
| 11.13 | `neo` for flowchart |
| 11.14 | `neo` extended to state, sequence; `handDrawn` extended to state |
| 11.15 | Continued hardening; Wardley explicitly rejects `handDrawn` |

The builder should treat `look` as a per-family feature gate, not a global setting.

---

## htmlLabels Migration Path

| Version | Behavior |
|---|---|
| ≤ 11.12 | `flowchart.htmlLabels` was the canonical location |
| 11.13+ | Root-level `htmlLabels` is now the canonical location; `flowchart.htmlLabels` is deprecated |

**Builder implication:** Exports should emit `htmlLabels` at the root config level, not nested under `flowchart:`. This affects prompt scaffolds and `%%{init}%%` block exports.

---

## How to Maintain This Document

- After each Mermaid major/minor release, review the GitHub release notes
- Update the corresponding version section with new features
- Update "Builder coverage" from ❌ to ✅ when the builder surfaces the feature
- Move resolved gaps out of the cumulative gap table
- Update `MERMAID_VERSION_VERIFIED` in `src/data/mermaid-capabilities.ts` to match
