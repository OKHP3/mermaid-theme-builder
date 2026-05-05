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
- See `docs/MERMAID_CAPABILITY_REGISTRY.md` for the update checklist
- See `docs/RELEASE_CHECKLIST.md` for release governance

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

Run the end-to-end test plan (see `docs/RELEASE_CHECKLIST.md`) before opening a pull request. All 6 e2e test scenarios must pass.

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
│   │   ├── ColorSwatch.tsx           # single colour chip with copy-on-click
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
│   │   ├── exporters.ts              # all export-format serialisers (CSS, JSON, MD, etc.)
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
│   ├── ATTRIBUTION.md                # attribution model and third-party credits
│   ├── BRAND_PRESETS.md              # OKHP3 brand palette definitions
│   ├── DEPLOYMENT.md                 # GitHub Pages deployment instructions
│   ├── LEGAL.md                      # colour copyright + brand policy analysis
│   ├── MERMAID_CAPABILITY_REGISTRY.md # registry update checklist per Mermaid version
│   ├── MERMAID_THEMING_REFERENCE.md  # full themeVariables table + renderer compat
│   ├── PRODUCT_BRIEF.md              # product vision, scope, and constraints
│   ├── RELEASE_CHECKLIST.md          # pre-release gate: 81 manual test steps
│   ├── ROADMAP.md                    # feature backlog with completion status
│   └── THEME_METADATA.md             # palette metadata schema reference
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
