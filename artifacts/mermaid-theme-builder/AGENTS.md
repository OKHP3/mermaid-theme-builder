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
│   ├── data/
│   │   └── mermaid-capabilities.ts   # capability registry
│   ├── lib/
│   │   ├── detector.ts               # diagram detection
│   │   ├── themeEngine.ts            # theme application + exports
│   │   └── palettes.ts               # palette schema + built-ins
│   ├── components/
│   │   ├── CapabilityNote.tsx        # blue info note for non-full diagrams
│   │   ├── WarningBanner.tsx         # yellow warning banner
│   │   └── MermaidPreview.tsx        # live preview renderer
│   └── pages/
│       └── ThemeBuilder.tsx          # main page
├── docs/
│   ├── BRAND_PRESETS.md
│   ├── ATTRIBUTION.md
│   ├── THEME_METADATA.md
│   ├── ROADMAP.md
│   ├── MERMAID_CAPABILITY_REGISTRY.md
│   ├── MERMAID_THEMING_REFERENCE.md  # full themeVariables table + renderer compat
│   ├── LEGAL.md                      # color copyright + brand policy analysis
│   ├── PRODUCT_BRIEF.md
│   ├── DEPLOYMENT.md
│   └── RELEASE_CHECKLIST.md
├── examples/
│   ├── overkill-hill-flowchart.mmd   # OverKill Hill P³ flowchart example
│   ├── overkill-hill-sequence.mmd    # OverKill Hill P³ sequence example
│   ├── askjamie-flowchart.mmd        # AskJamie flowchart example
│   ├── askjamie-sequence.mmd         # AskJamie sequence example
│   ├── glee-fully-flowchart.mmd      # Glee-fully flowchart example
│   └── glee-fully-sequence.mmd       # Glee-fully sequence example
├── standards/
│   ├── render-safety-checklist.md
│   └── mermaid-theme-builder-standard.md
├── LICENSE                           # MIT License — Jamie Hill / OverKill Hill P³
└── AGENTS.md
```
