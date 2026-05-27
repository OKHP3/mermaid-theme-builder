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

## Repository Hygiene Standard

**Brand:** OverKill Hill P³ (Forge)
**Body scope:** default; no body class set for this brand
**Canonical stylesheet:** https://raw.githubusercontent.com/OKHP3/OverKill-Hill/main/assets/css/theme.css
**Version:** 1.0

This section governs how files and folders are named, what structure all sibling repos share, what counts as detritus, and the brand contract this repo serves. Replit Agent, left alone, will name files inconsistently, scatter working artifacts into the root, and leave paste-buffer transcripts in `attached_assets/`. The rules below stop that.

### 0. Language Standard: en-US

This project is authored, owned, and maintained by a United States-based creator. All user-facing content must use United States English (`en-US`).

**Scope:** UI copy, documentation, README content, release notes, comments intended for human readers, prompts, tooltips, button text, error messages, validation messages, QA/QC reports, marketing language, and any new code identifiers authored in this repo.

**Examples of required US-EN spellings:** color, behavior, organization, optimize, customize, center, analyze, modeling, artifact, visualization, standardization, initialize, finalize, prioritize, summarize, license (noun), program, catalog, fulfill, gray, toward, among, while.

**Protected exceptions (do NOT change spelling in):**
- Direct quotations from external sources
- Proper nouns, brand names, product names
- Dependency, package, or library names
- URLs, file names, route names
- API fields, schema keys, existing code identifiers
- Generated lockfiles or external standards

**Identifier rule:** en-US applies to identifiers authored in *new* code. Renaming *existing* identifiers (variables, functions, types, exported symbols) is a breaking change and falls under the same renaming policy as files in Section 1: update every importer in the same commit, run the build and tests after, and set up a redirect if anything external depends on the old name. Do not run a blanket find-and-replace across existing identifiers without explicit instruction.

**Status:** US English compliance is a required QA/QC gate, not a stylistic preference. Any output failing this standard is a defect.

### 1. Naming conventions

The rule is kebab-case by default with three structural exceptions, all dictated by ecosystem convention.

| File role | Convention | Examples |
|---|---|---|
| Docs (.md), CSS, YAML, JSON-data, SVG, plain scripts | kebab-case | `design-system.md`, `forge-tokens.css`, `sync-skills.sh` |
| Folder names | kebab-case | `src/styles/`, `docs/roadmap/` |
| Plain TypeScript modules (not exporting a hook or component) | kebab-case | `bpmn-styles.ts`, `theme-mode.ts`, `palettes.ts` |
| React hooks (`.ts` exporting `useFoo`) | camelCase matching the hook | `useTheme.ts`, `useDebounce.ts` |
| React components (`.tsx`/`.jsx`) | PascalCase matching the component | `ApplyTab.tsx`, `DiffView.tsx` |
| Root governance files | ALL CAPS (ecosystem convention) | `README.md`, `LICENSE`, `CHANGELOG.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `AGENTS.md`, `SKILL.md` |
| Tool-required filenames | Whatever the tool requires | `package.json`, `tsconfig.json`, `vite.config.ts`, `.gitignore`, `.replit`, `.npmrc`, `Dockerfile`, `Makefile`, `CNAME` |
| Web-standard files | Whatever the spec dictates | `humans.txt`, `robots.txt`, `llms.txt`, `404.html`, `_headers`, `favicon.ico` |

Decision tree when in doubt: (1) governance file with universal name → ALL CAPS; (2) tool-required name → whatever the tool says; (3) `.tsx`/`.jsx` component → PascalCase matching the component; (4) `.ts` hook → camelCase matching the hook; (5) everything else → kebab-case.

These rules govern filenames only. Identifiers inside code follow language conventions: TypeScript uses `camelCase` for variables/functions and `PascalCase` for types/components; CSS custom properties use `--kebab-case`.

When renaming a file to fix a casing violation: update every importer in the same change, set up a redirect if the file is referenced by a deployed URL, and run the build and tests after.

### 2. Repository structure

Companion apps under this brand share this top-level structure:

```
<repo-root>/
├── .agents/                  Replit Agent working memory
├── .github/                  Actions, issue templates
├── .gitignore
├── .replit, .replitignore, .npmrc, .prettierrc
├── AGENTS.md
├── CHANGELOG.md
├── CONTRIBUTING.md
├── LICENSE
├── README.md
├── docs/
│   ├── design-system.md
│   ├── conformance-audit.md
│   └── roadmap/
├── public/
├── scripts/
├── skills/                   SKILL.md packages this app owns
├── src/                      app source
│   ├── components/           PascalCase React components
│   ├── data/                 kebab-case
│   ├── hooks/                useFoo.ts hooks
│   ├── lib/                  kebab-case modules
│   ├── pages/                PascalCase route components
│   ├── styles/               CSS including forge-tokens.css
│   └── __tests__/
├── e2e/                      Playwright
├── examples/
├── standards/
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

Two valid layouts: flat (`src/` at repo root) is default. `artifacts/<app-name>/src/` is for repos that legitimately ship multiple apps. Do not use `artifacts/` for a single app.

Folders that must NOT exist at the repo root because their names are reserved for detritus: `_unused/`, `attached_assets/`, `attached-assets/`, `_drafts/`, `_scratch/`, `_old/`, `tmp/`, `temp/`, `unused/`.

### 3. Detritus (does not belong in version control)

- **`attached_assets/`** — Replit paste-buffer transcripts and screenshots. Always gitignored. Delete if committed.
- **`_unused/`** — code Replit moved aside during refactor. Triage once, then delete.
- **`test-results/`, `playwright-report/`, `coverage/`** — test/build output. Gitignore.
- **`dist/`, `build/`, `.next/`, `.vite/`** — build output. Gitignore.
- **`.DS_Store`, `Thumbs.db`, `.idea/`** — OS/IDE junk. Gitignore.
- **`_replit/`** — old working notes. Triage: salvage useful content into `docs/` or `docs/archive/<YYYY-MM-DD>-<topic>.md`, delete the rest.
- **Duplicated sibling-repo content** — e.g., a skill folder for another app that landed here by accident. Remove it.
- **Pre-deploy previews of sibling apps** in `_replit/*-preview/` — once the live URL is deployed, delete.

### 4. `.gitignore` baseline

This repo must include at minimum:

```
# Replit working-buffer artifacts
attached_assets/
attached-assets/
_unused/
unused/

# Test and build output
test-results/
playwright-report/
coverage/
dist/
build/
.next/
.vite/

# IDE / OS
.DS_Store
Thumbs.db
.idea/

# Node
node_modules/
*.log
```

If a folder in this list is currently tracked, `git rm -r --cached <folder>` before committing the `.gitignore` change.

### 5. Decrapify command (the reusable instruction)

When the repo accumulates working artifacts, send this short message to Replit Agent:

> **Decrapify this repo per the Repository Hygiene Standard in `AGENTS.md` Section 5.** Triage, do not just delete. Produce a plan first, then execute on confirmation. Cover: `attached_assets/` and any hyphen variant, `_unused/`, `test-results/`, `playwright-report/`, `coverage/`, `dist/`, `build/`, `_replit/` (triage contents into `docs/` or `docs/archive/` before deleting), any duplicated sibling-repo content, any file or folder violating Section 1, and any folder name listed as forbidden in Section 2. Ensure `.gitignore` covers Section 4 and `git rm -r --cached` anything newly-ignored. Output a plain-text plan with: item, category (gitignore-only, delete, triage-then-delete, rename), justification, risk. Wait for "go" before executing. No em dashes.

### 6. Brand contract (OverKill Hill P³ Forge)

This repo serves the OverKill Hill P³ Forge motif. Canonical reference: https://raw.githubusercontent.com/OKHP3/OverKill-Hill/main/assets/css/theme.css

Forge motif declared values:

| Aspect | Value |
|---|---|
| Body scope class | NONE (this is the default brand) |
| Display font | Alfa Slab One |
| Body font | DM Sans |
| Mono font | JetBrains Mono |
| Primary accent | rust-orange `#c46a2c` |
| Secondary accent | amber `#e6a03c` |
| Header surface | teal `#1c3a34` |
| Light page bg | `#f0ebe5` (warm paper) |
| Light ink | `#0f172a` (deep navy) |
| Dark mode | espresso/slate-blue family (hue ~224) |
| Base radius | `0.75rem` |
| Mermaid accent | `#c46a2c` lines and borders |

Forbidden in this brand's apps:
- Coral `#d94f63` (that's the glee-fully brand)
- Aqua `#2d6f7e` (that's the AskJamie brand)
- Olive hue family in dark mode
- Fraunces, Inter, or any font that is not Alfa Slab One / DM Sans / JetBrains Mono
- Builders FirstSource (BFS) references, color systems, or examples of any kind

### 7. Universal guardrails

- No em dashes anywhere (code, comments, copy, commit messages). Use periods or restructure.
- No AI filler in copy or comments: not "seamlessly," "robust," "powerful," "effortlessly," "elevate," "unleash."
- Tailwind v4 only: no `tailwind.config.js` (tokens live in CSS via `@theme inline`).
- No new dependencies unless explicitly requested.
- All user-facing content must use US English per the Language Standard in Section 0. UK/Commonwealth spellings are defects, not stylistic variants.

### 8. US English audit command (reusable instruction)

When the repo accumulates UK/Commonwealth spellings, send this short message to Replit Agent:

> **Run the US English audit per the Language Standard in `AGENTS.md` Section 0.** Produce a QA summary first; execute corrections only after I say "go." Cover: UI copy, docs, README, release notes, human-readable comments, prompts, tooltips, error/validation messages, and QA/QC reports. Apply protected exceptions in Section 0. For existing code identifiers with UK spellings, list them as renaming candidates but do not auto-rename without confirmation. Output: (1) files scanned, (2) files changed, (3) UK spellings found with location, (4) US-EN replacements proposed, (5) protected exceptions intentionally left unchanged with reason, (6) identifier renaming candidates flagged for separate handling, (7) final confirmation that the report itself contains no UK spellings. Wait for "go." No em dashes.

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
