# Mermaid Capability Registry

Mermaid Theme Builder maintains an explicit capability registry that is separate from the Mermaid npm dependency. This registry records:

- Which diagram types are known by the app
- The stability of each type as of the verified Mermaid version
- How well each diagram responds to `%%{init}%%` theme variables
- Which advanced Mermaid features (classDef, linkStyle, subgraph) are supported

**Verified against Mermaid version:** `11.14.0`  
**Registry file:** `src/data/mermaid-capabilities.ts`

The app uses Mermaid as an npm dependency for rendering. It does not auto-detect new diagram types at runtime — the registry is updated manually when Mermaid releases new or promoted diagram types.

---

## Diagram registry

| ID | Display Name | Stability | Style Strategy | classDef | linkStyle | Subgraph |
|---|---|---|---|---|---|---|
| `flowchart` | Flowchart | stable | **full** | ✅ | ✅ | ✅ |
| `sequenceDiagram` | Sequence Diagram | stable | partial | — | — | — |
| `classDiagram` | Class Diagram | stable | partial | ✅ | — | — |
| `stateDiagram` | State Diagram | stable | partial | ✅ | — | — |
| `erDiagram` | ER Diagram | stable | partial | — | — | — |
| `gantt` | Gantt Chart | stable | limited | — | — | — |
| `pie` | Pie Chart | stable | limited | — | — | — |
| `gitGraph` | Git Graph | stable | limited | — | — | — |
| `mindmap` | Mindmap | stable | limited | — | — | — |
| `timeline` | Timeline | stable | limited | — | — | — |
| `quadrantChart` | Quadrant Chart | stable | partial | — | — | — |
| `journey` | User Journey | stable | limited | — | — | — |
| `requirementDiagram` | Requirement Diagram | stable | partial | — | — | — |
| `c4Diagram` | C4 Diagram | stable | partial | — | — | — |
| `kanban` | Kanban | stable | limited | — | — | — |
| `architectureBeta` | Architecture | beta | limited | — | — | — |
| `block` | Block Diagram | beta | partial | ✅ | — | — |
| `sankey` | Sankey Diagram | beta | limited | — | — | — |
| `xychart` | XY Chart | beta | partial | — | — | — |
| `packet` | Packet Diagram | beta | limited | — | — | — |
| `treemap` | Treemap | experimental | limited | — | — | — |
| `venn` | Venn Diagram | experimental | limited | — | — | — |
| `ishikawa` | Ishikawa (Fishbone) | experimental | limited | — | — | — |
| `wardley` | Wardley Map | experimental | limited | — | — | — |
| `treeView` | Tree View | experimental | limited | — | — | — |

---

## Style strategy definitions

| Strategy | Meaning |
|---|---|
| **full** | All standard `themeVariables` apply reliably. `%%{init}%%` gives complete visual control. |
| **partial** | Most `themeVariables` apply but some diagram-specific colors are managed internally by Mermaid. |
| **limited** | Background and text colors apply. Most diagram-specific colors are not controlled by `themeVariables`. |
| **none** | `themeVariables` have no meaningful effect on this diagram type. |

---

## Attribution badge support

The optional attribution badge node is only enabled for flowchart diagrams in the current UI. The full badge (with clickable link) is flowchart-only. A text-only styled node fallback is defined in the engine for sequence, state, and class diagrams but is not currently exposed in the UI.

---

## Maintenance checklist

When a new version of Mermaid is released:

1. **Check the Mermaid release notes** at [github.com/mermaid-js/mermaid/releases](https://github.com/mermaid-js/mermaid/releases)

2. **Look for:**
   - New diagram types added (look for new `diagram` registrations)
   - Beta diagrams promoted to stable
   - Experimental diagrams promoted to beta
   - New `themeVariables` added (may improve `styleStrategy` for existing types)
   - Breaking changes to existing diagram keywords

3. **Update `src/data/mermaid-capabilities.ts`:**
   - Add any new `DiagramCapability` entries to `DIAGRAM_CAPABILITIES`
   - Add the new `id` to the `DiagramFamily` union type
   - Update `stability` for any promoted diagram types
   - Update `styleStrategy` if new `themeVariables` improve a diagram's theming
   - Update `MERMAID_VERSION_VERIFIED` to the new version string

4. **Update `package.json`** to bump the `mermaid` version if desired

5. **Test rendering** of newly added or promoted diagram types in the preview pane

6. **Update this file** — add the new diagram type to the table above

7. **If a diagram type is deprecated or removed** in the new Mermaid version, mark it in the registry notes and consider removing it from `DIAGRAM_CAPABILITIES`

### Do NOT:
- Auto-update the Mermaid dependency without reviewing capability changes
- Assume that upgrading Mermaid automatically makes new diagram types available in the app's capability registry
- Remove entries from the registry without confirming they are no longer supported

---

## Adding a new diagram type (example)

```typescript
// In src/data/mermaid-capabilities.ts
{
  id: "newDiagram",         // add to DiagramFamily union type first
  displayName: "New Diagram",
  declarations: /^\s*newDiagram\b/im,
  stability: "beta",
  styleStrategy: "partial",
  supportsClassDef: false,
  supportsLinkStyle: false,
  supportsSubgraphStyle: false,
  notes: "Beta diagram type. Describe what theming applies and what doesn't.",
},
```

Add `"newDiagram"` to the `DiagramFamily` type union **before** adding the capability entry — TypeScript will enforce the type match.

---

## Why a separate registry?

Mermaid's rendering engine is included as an npm dependency. When Mermaid adds a new diagram type, the rendering capability is available immediately after upgrading the dependency. However, the **styling guidance** is not automatic — the app needs to know:

1. Whether the `%%{init}%%` directive works for the new type
2. Which `themeVariables` apply and which do not
3. Whether beta/experimental diagrams are stable enough to expose to users
4. What caveats to show in the UI

The capability registry decouples these concerns. The Mermaid dependency handles rendering; the registry handles what the Theme Builder knows how to style.
