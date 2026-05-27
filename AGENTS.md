# AGENTS.md — Mermaid Theme Builder

Guidance for AI agents, automated tools, and contributors working on this repository.

## Project identity

**Mermaid Theme Builder** is a personal [OverKill Hill P³](https://overkillhill.com) project by Jamie Hill. It is not affiliated with Builders FirstSource, BFS, Mermaid, Mermaid Chart, Mermaid.ai, or any third-party brand.

## Ownership and brand firewall

This repository must never contain references to:

- BFS, Builders FirstSource, BuildersFirstSource, BFS Light, Builders Blue, FirstSource
- Any agent's employer, daytime employer, or workplace
- Walmart, Starbucks, Apple Theme, Microsoft Theme, Target Theme, Home Depot Theme, or any large third-party company brand theme
- Any brand other than the approved OKHP3 ecosystem properties listed below

**Approved brand properties:**
- OverKill Hill / OverKill Hill P³ (overkillhill.com)
- AskJamie (askjamie.bot)
- Glee-fully (glee-fully.tools)

Built-in themes must be original generic palettes or personal OverKill Hill ecosystem palettes only.

## Canonical disclaimer

Always include this disclaimer in README and major docs:

> Mermaid Theme Builder is a personal OverKill Hill P³ project by Jamie Hill. It is not affiliated with Builders FirstSource, BFS, Mermaid, Mermaid Chart, Mermaid.ai, or any third-party brand represented by user-entered colors.

## Architecture constraints

Never add:
- Backend server (this is a fully static, browser-only app)
- User login, authentication, or user accounts
- AI API calls or LLM inference
- Payment processing or cloud storage
- File upload functionality
- Analytics that capture or transmit pasted diagram content
- Forked or copied Mermaid source — always use the npm dependency
- Unpinned latest Mermaid from a CDN in production

## Core workflow

Preserve at all times:

```
paste Mermaid → detect diagram family → select/edit theme → generate themed Mermaid → preview → copy/export
```

Do not break this flow.

## Mermaid dependency governance

- Mermaid is used as an npm dependency (`^11.14.0` or current stable 11.x)
- Do not fork Mermaid
- Do not copy Mermaid source into this repo
- Dependency updates must be reviewed and tested before release
- The capability registry (`src/data/mermaid-capabilities.ts`) must be manually updated after each Mermaid version upgrade
- See `docs/mermaid-capability-registry.md` for the update checklist
- See `docs/release-checklist.md` for release governance

## Version governance constants

The following constants in `src/data/mermaid-capabilities.ts` track governance state:

```typescript
export const MERMAID_VERSION_VERIFIED = "11.14.0";
```

These must be updated whenever the Mermaid dependency is upgraded.

## Diagram detection and capability

- Detection is driven by `src/data/mermaid-capabilities.ts` — do not hardcode diagram types anywhere else
- Do not claim full theme support for every diagram type
- All `styleStrategy` values must accurately reflect what themeVariables actually control
- New diagram types added to Mermaid must be manually added to the registry with accurate support levels

## UI rules

- Flowchart diagrams: full theme support, attribution badge supported
- All other diagram types: show capability note if `styleStrategy !== "full"`
- Unknown diagram type: show warning, not a capability note
- Attribution badge toggle must be disabled for non-flowchart diagrams in V1

## Export rules

- Metadata comments are included by default (can be toggled off)
- Attribution badge is off by default and only injectable into flowchart diagrams
- Exported code must be valid Mermaid syntax
- Never silently swallow export errors

## Testing before PR

Run the end-to-end test plan (see `docs/release-checklist.md`) before opening a pull request. All 6 e2e test scenarios must pass.

## Language Standard: en-US

This project is authored, owned, and maintained by a United States-based creator.
All user-facing content must use United States English (`en-US`).

Scope: UI copy, documentation, README content, release notes, comments intended for
human readers, prompts, tooltips, button text, error messages, validation messages,
QA/QC reports, and marketing language.

Examples of required US-EN spellings:
color, behavior, organization, optimize, customize, center, analyze, modeling,
artifact, visualization, standardization, initialize, finalize, prioritize, summarize,
license (noun), program, catalog, fulfill, gray, toward, among, while.

Do NOT change the following where spelling is externally defined or technically significant:
- Direct quotations from external sources
- Proper nouns, brand names, product names
- Dependency, package, or library names
- URLs, file names, route names
- API fields, schema keys, code identifiers
- Generated lockfiles or external standards

US English compliance is a required QA/QC gate. It is not a stylistic preference.
Any output that fails this standard is a defect.

## File structure

```
artifacts/mermaid-theme-builder/
├── src/
│   ├── App.tsx                       # root shell: tab routing, theme mode, keyboard shortcuts
│   ├── main.tsx                      # Vite entry point
│   ├── index.css                     # global Tailwind + custom CSS vars
│   ├── components/
│   │   ├── CapabilityNote.tsx        # blue info note for non-full-support diagram families
│   │   ├── ClassBrowser.tsx          # collapsible CSS class reference panel
│   │   ├── ColorSwatch.tsx           # single color chip with copy-on-click
│   │   ├── DiagramInventory.tsx      # filterable/searchable diagram family index
│   │   ├── DiffView.tsx              # three-mode preview: original / themed / diff
│   │   ├── MermaidPreview.tsx        # live Mermaid render wrapper
│   │   ├── MermaidReferral.tsx       # attribution + link-back component
│   │   ├── PromptScaffoldModal.tsx   # AI scaffold prompt modal
│   │   └── WarningBanner.tsx         # yellow warning for init-directive conflicts
│   ├── data/
│   │   ├── example-library.ts        # full example entries with inlined .mmd content
│   │   ├── examples.ts               # example metadata + display config
│   │   └── mermaid-capabilities.ts   # authoritative capability registry (27 families)
│   ├── lib/
│   │   ├── detector.ts               # diagram-family detection from raw text
│   │   ├── diagramSplit.ts           # splits multi-diagram pastes into individual blocks
│   │   ├── diff.ts                   # line-level diff computation for DiffView
│   │   ├── exporters.ts              # all export-format serializers (CSS, JSON, MD, etc.)
│   │   ├── extractor.ts              # extracts existing init/theme from pasted code
│   │   ├── familyTheming.ts          # per-family themeVariables overlays (sequence, ER, etc.)
│   │   ├── palettes.ts               # palette schema, built-in palettes, user-palette types
│   │   ├── persistence.ts            # localStorage read/write with schema versioning
│   │   ├── themeEngine.ts            # core: palette → Mermaid init directive + exports
│   │   └── themeMode.ts              # light/dark mode state hook
│   └── pages/
│       └── tabs/
│           ├── ApplyTab.tsx          # Apply tab: paste → detect → theme → export
│           ├── ComposeTab.tsx        # Compose tab: build/edit user palettes
│           ├── ExamplesTab.tsx       # Examples tab: browse OKHP3 example pack
│           └── ReferenceTab.tsx      # Reference tab: DiagramInventory + ClassBrowser
├── docs/
│   ├── attribution.md                # attribution model and third-party credits
│   ├── brand-presets.md              # OKHP3 brand palette definitions
│   ├── capability-crosswalk.md       # Mermaid 11.15 capability → builder coverage → gap
│   ├── copilot-prompt-kit.md         # reusable M365 Copilot prompt templates for themed Mermaid diagrams
│   ├── deployment.md                 # GitHub Pages deployment instructions
│   ├── design-system.md              # OKH Forge UI System reference
│   ├── legal.md                      # color copyright + brand policy analysis
│   ├── market-research.md            # competitive landscape and positioning
│   ├── mermaid-capability-registry.md # registry update checklist per Mermaid version
│   ├── mermaid-theming-reference.md  # full themeVariables table + renderer compat
│   ├── mermaid-version-matrix.md     # version-by-version feature matrix
│   ├── product-brief.md              # product vision, scope, and constraints
│   ├── product-positioning.md        # positioning and messaging
│   ├── prototype-to-product-retrospective.md  # v0.1–v0.4 retrospective
│   ├── release-checklist.md          # pre-release gate: manual test steps
│   ├── renderer-compatibility.md     # renderer compat notes
│   ├── roadmap.md                    # feature backlog with completion status
│   ├── technical-debt-register.md    # known tech debt items
│   └── theme-metadata.md             # palette metadata schema reference
├── examples/                         # .mmd source files — human-readable originals
│   │                                 # Content is inlined into example-library.ts;
│   │                                 # these files are dev/authoring references only.
│   ├── overkill-hill-flowchart.mmd
│   ├── overkill-hill-sequence.mmd
│   ├── askjamie-flowchart.mmd
│   ├── askjamie-sequence.mmd
│   ├── glee-fully-flowchart.mmd
│   ├── glee-fully-sequence.mmd
│   ├── overkill-rube-goldberg-showcase.mmd
│   └── … (27 files total — one per diagram family)
├── public/
│   ├── favicon.svg
│   ├── manifest.webmanifest          # PWA manifest
│   ├── opengraph.jpg
│   ├── robots.txt
│   ├── sitemap.xml
│   └── sw.js                         # service worker (cache-first strategy)
├── standards/
│   ├── mermaid-theme-builder-standard.md  # identity, brand, and quality standards
│   └── render-safety-checklist.md         # known Mermaid rendering pitfalls + mitigations
├── LICENSE                           # MIT — Jamie Hill / OverKill Hill P³
└── AGENTS.md
```
