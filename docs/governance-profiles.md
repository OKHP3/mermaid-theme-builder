# Governance Profiles

**Last updated:** 2026-06-20
**Applies to:** Mermaid Theme Builder v0.5.0+

---

## What Is a Governance Profile?

A Governance Profile is the complete, portable specification for how every Mermaid diagram produced in a given context should look and behave. It captures all the choices that control visual output — color tokens, typography, rendering look, target renderer constraints, and diagram output rules — as a single named, exportable, and shareable artifact.

When a governance profile is applied, any Mermaid diagram — regardless of type or source — can be styled consistently without manual intervention per diagram.

---

## What a Governance Profile Contains

| Component | What it controls |
|---|---|
| **Palette name** | The human-readable identifier for the profile |
| **Color tokens** | Primary, secondary, tertiary, neutral, and accent hex values — each mapped to a semantic role |
| **Typography tier** | Font family and size for diagram title, subgraph title, nested subgraph, node label, and edge label |
| **Look** | Classic, Neo, or Hand-Drawn rendering mode |
| **Renderer target** | The intended rendering environment and its known constraints |
| **classDef overlay** | Named style classes available for per-node semantic styling |
| **Output contract rules** | Structural constraints on AI-generated diagrams |

---

## Semantic Color Governance

Colors in a governance profile are not arbitrary. Each token should be assigned a consistent semantic meaning that holds across all diagram families:

| Token | Recommended semantic role | Example use |
|---|---|---|
| **Primary** | Core domain objects, main system components | Service nodes, primary actors |
| **Secondary** | Supporting components, related systems | Adjacent services, secondary participants |
| **Tertiary** | Background context, third-tier groupings | Cluster fills, nested subgraph backgrounds |
| **Neutral** | Canvas, margins, unassigned areas | Page background, empty states |
| **Accent** | Connectors, edges, attention indicators | Arrows, active paths, highlighted flows |

**Color-by-meaning conventions (recommended practice):**

| Situation | Suggested approach |
|---|---|
| Exception or error state | Use a warm accent tone via a named classDef override |
| Structural boundary | Use neutral or tertiary for background; primary border for the container |
| Assistive or informational | Lighter secondary or tertiary tone |
| Critical path | Accent color on the connecting edge via linkStyle |
| Success or completion | Positive tone via a named classDef class |

These are recommended conventions. The governance profile enforces the color tokens that implement your chosen conventions consistently — it does not automatically assign semantic meaning to diagram content.

---

## Lifecycle Modes

A governance profile operates across six lifecycle modes. Each mode describes a different way the profile is used in the diagram workflow:

### Apply Mode

Apply an existing governance profile to raw or unstyled Mermaid code. The tool prepends a `%%{init}%%` directive block and appends `classDef` blocks. The diagram code is not changed structurally — only styling is added.

*Primary tool surface: Apply tab.*

### Extract Mode

Pull a governance profile from existing styled Mermaid code. The tool reads the `%%{init}%%` or YAML frontmatter block and populates the color tokens, typography, and look settings automatically. Useful when you receive themed code from a colleague or AI assistant and want to capture the implicit profile as a named, reusable artifact.

*Primary tool surface: Compose tab — Import Theme — Extract Theme.*

### Compose Mode

Build or refine a governance profile from scratch. Select a starting palette, adjust color tokens, configure typography tiers, choose look and renderer target, and preview the result across diagram families.

*Primary tool surface: Compose tab.*

### Update Mode

Apply a changed governance profile to diagrams that were previously styled with an earlier version of the profile. The update replaces the existing `%%{init}%%` block with the new version while preserving the diagram structure and any `classDef` node assignments that are still valid.

*Workflow: Extract the old profile via Extract Mode — update it in Compose Mode — re-apply via Apply Mode.*

### Repair Mode

Fix structural issues in Mermaid code that prevent correct rendering, without changing the semantic meaning of the diagram. Repair mode targets syntax-level problems — invalid node IDs, bare `end` keywords used as node labels, mixed `%%{init}%%` and YAML frontmatter, semicolons, HTML in labels — not visual issues.

*Workflow: Paste into Apply tab — review diagnostic warnings — correct in the editor panel.*

### Export Mode

Package the governance profile as a portable artifact for sharing, injection into AI systems, or use in documentation pipelines.

| Export format | Use case |
|---|---|
| **Styled Code** | Full themed Mermaid source for direct paste into a renderer |
| **Markdown Bootstrap** | Complete Markdown file with fenced diagram block for docs platforms |
| **Prompt Scaffold** | AI system-prompt fragment that instructs an LLM to maintain the active profile |
| **Share Link** | URL with the full profile payload encoded — shareable without any backend |
| **JSON download** | Machine-readable profile bundle (`.theme.json` or `.palette-bundle.json`) |

*Primary tool surface: Apply tab export controls, Compose tab export controls.*

---

## Creating a Governance Profile

1. Open the **Compose** tab.
2. Select a starting palette from the top bar (brand preset or utility palette), or press **+ New** for a blank slate.
3. Name the profile in the name field.
4. Select the rendering look (Classic, Neo, or Hand-Drawn).
5. Adjust color tokens using the swatch editor.
6. Configure the five typography tiers.
7. Select the intended renderer target from the renderer selector.
8. Preview the profile across multiple diagram families using the family picker.
9. Export using **Copy Bootstrap**, **Prompt Scaffold**, **Share Link**, or **Download**.

---

## Sharing a Governance Profile

**For human recipients:** Export via **Download — .theme.json** and distribute the file, or use the **Share Link** to send a URL the recipient can open directly in Mermaid Theme Builder.

**For AI assistant use:** Export via **Prompt Scaffold** and paste the output as a system prompt or thread opener. The scaffold instructs the AI to prepend the `%%{init}%%` block verbatim, not to invent colors, and to follow the structural rules in the diagram output contract.

**For documentation teams:** Export via **Markdown Bootstrap** and include the fenced code block in a team wiki or internal documentation guide. The block is self-contained — paste it above any Mermaid diagram to apply the profile.

---

## Layout Tier Tokens (Roadmap — v0.7)

A planned v0.7 addition will introduce layout tier tokens as named `classDef` classes that encode structural roles:

| Token | Semantic meaning | Example usage |
|---|---|---|
| `:::zone.primary` | Primary domain zone or bounded context | Main system boundary |
| `:::zone.system` | System or service boundary | External service box |
| `:::lane.human` | Human actor or team lane | User-facing process step |
| `:::lane.automated` | Automated process or system actor | Background job, API call |

These tokens extend color semantic conventions into structural conventions — letting a reader know what kind of element they are looking at, not just which color tier it belongs to. They are tracked in the roadmap as a v0.7 feature.

---

## Relation to the Diagram Output Contract

The governance profile defines the *what* — which colors, typography, look, and constraints apply. The diagram output contract defines the *how* — the structural rules that AI-generated or human-authored Mermaid code must follow to be compatible with the profile.

See `docs/diagram-output-contract.md` for the full contract.
