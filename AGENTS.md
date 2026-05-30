# Agent Guidelines: Mermaid Theme Builder

This file is the operating constitution for any AI agent working in this repo.
Read it before touching any file. It applies equally to Replit Agent, Copilot,
Claude, and any other AI assistant.

Cross-reference `replit.md` for site-specific architecture, script inventory,
and current state.

- Work in small steps. Ask before large refactors.
- Prefer adding tests before changing logic if risk is medium or high.
- Keep changes localized. Avoid touching unrelated files.
- If you need config or secrets, stop and ask. Never invent credentials.
- Summarize what you changed and why at the end of every session.

> **AGENTS.md sync circuit** -- This file is one of five kept in lockstep.
> Any structural edit to Sections 1-8 must be propagated to the other four repos
> before the session closes. Section 9 (app-level governance) and Section 2.2.1
> (per-app inventory) are intentionally repo-specific and do not need to match
> line for line. When this file is silent or ambiguous on any governance matter,
> defer to the primary authority:
> <https://github.com/OKHP3/OverKill-Hill/blob/main/AGENTS.md>
>
> Static site repos:
> - **OverKill Hill P3:** <https://github.com/OKHP3/OverKill-Hill/blob/main/AGENTS.md>
> - **AskJamie:** <https://github.com/OKHP3/AskJamie/blob/main/AGENTS.md>
> - **Glee-fully Tools:** <https://github.com/OKHP3/Glee-fullyTools/blob/main/AGENTS.md>
>
> Web application repos:
> - **BPMN for Mermaid:** <https://github.com/OKHP3/mermaid-diagram-bpmn/blob/main/AGENTS.md>
> - **Mermaid Theme Builder:** <https://github.com/OKHP3/mermaid-theme-builder/blob/main/AGENTS.md>

---

## Repository Hygiene Standard

**Brand:** OverKill Hill P3 (Forge / Rust-orange) **Body scope class:** none -- this is the default brand; pages set no body class **Canonical stylesheet:** <https://raw.githubusercontent.com/OKHP3/OverKill-Hill/main/assets/css/theme.css> **Version:** 2.1

This section governs how files and folders are named, what structure all sibling
repos share, what counts as detritus, and the brand contract this repo serves.
It exists because AI agents, left alone, will name files inconsistently across
sessions, scatter working artifacts into the repo root, and leave paste-buffer
transcripts in `attached_assets/`. A reader two months later cannot tell what is
real, what is stale, and what was junk from the start. The rules below stop that.

---

### 0. Language Standard: en-US

This project is authored, owned, and maintained by a United States-based creator.
All user-facing content must use United States English (`en-US`).

**Scope:** UI copy, documentation, README content, release notes, comments intended
for human readers, prompts, tooltips, button text, error messages, validation
messages, QA/QC reports, marketing language, and any new code identifiers
authored in this repo.

**Examples of required US-EN spellings:** color, behavior, organization, optimize,
customize, center, analyze, modeling, artifact, visualization, standardization,
initialize, finalize, prioritize, summarize, license (noun), program, catalog,
fulfill, gray, toward, among, while.

**Protected exceptions (do NOT change spelling in):**

- Direct quotations from external sources
- Proper nouns, brand names, product names
- Dependency, package, or library names
- URLs, file names, route names
- API fields, schema keys, existing code identifiers
- Generated lockfiles or external standards

**Identifier rule:** en-US applies to identifiers authored in *new* code.
Renaming *existing* identifiers (variables, functions, types, exported symbols)
is a breaking change and falls under the same renaming policy as files in
Section 1: update every importer in the same commit, run the build and tests
after, and set up a redirect if anything external depends on the old name. Do
not run a blanket find-and-replace across existing identifiers without explicit
instruction.

**Status:** US English compliance is a required QA/QC gate, not a stylistic
preference. Any output failing this standard is a defect.

---

### 1. Naming conventions

#### 1.1 Default: lowercase with hyphens (kebab-case)

Every file and folder name defaults to lowercase letters and digits, with words
separated by single hyphens. Use this for documentation, configuration, assets,
data files, CSS, plain scripts, and folder names.

Examples that are correct:

- `forge-tokens.css`
- `design-system.md`
- `release-checklist.md`
- `sync-forge-tokens.yml`
- `scripts/generate-icons.mjs`
- `docs/mermaid-theming-reference.md`

Examples that are wrong and must be renamed when discovered:

- `ForgeTokens.css` (PascalCase used for a stylesheet)
- `designSystem.md` (camelCase)
- `ReleaseChecklist.md` (PascalCase used for a doc)
- `My Document.md` (spaces)

The convention does not change with file extension. A markdown doc, a YAML
workflow, and a CSS file all follow the same rule.

#### 1.2 The full convention by file role

The rule is "kebab-case by default" with three structural exceptions, all
dictated by ecosystem convention rather than preference. The table below is the
complete decision; deviations from it require an explicit reason.

| File role | Convention | Examples |
| ------------------------------------------------------------------ | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Documentation (`.md`) | kebab-case | `design-system.md`, `release-checklist.md` |
| Stylesheets (`.css`) | kebab-case | `forge-tokens.css`, `index.css` |
| YAML, JSON, TOML data and config | kebab-case | `sync-forge-tokens.yml`, `palette-defaults.json` |
| Plain scripts (`.sh`, `.py`, `.mjs`) | kebab-case | `generate-icons.mjs`, `check-changelog.sh` |
| Assets (SVG, PNG, WebP, etc.) | kebab-case | `favicon.svg`, `opengraph.jpg` |
| Folder names | kebab-case | `src/styles/`, `docs/`, `skills/` |
| Plain TypeScript modules (`.ts` not exporting a hook or component) | kebab-case | `theme-engine.ts`, `detector.ts`, `palettes.ts` |
| React hooks (`.ts` exporting `useFoo`) | camelCase matching the hook | `useThemeMode.ts`, `useCodeEditorOverride.ts` |
| React components (`.tsx`/`.jsx`) | PascalCase matching the component | `ApplyTab.tsx`, `DiffView.tsx`, `ClassBrowser.tsx` |
| Root governance files | ALL CAPS (ecosystem convention) | `README.md`, `LICENSE`, `CHANGELOG.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `AGENTS.md`, `SKILL.md` |
| Tool-required filenames | Whatever the tool requires | `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `.gitignore`, `.replit`, `.npmrc`, `.prettierrc`, `pnpm-workspace.yaml`, `CNAME` |
| Web-standard files | Whatever the spec dictates | `robots.txt`, `sitemap.xml`, `manifest.webmanifest`, `favicon.svg`, `sw.js` |

#### 1.3 The "why" behind the three structural exceptions

The three non-kebab cases (PascalCase components, camelCase hooks, ALL CAPS
governance) are not aesthetic choices. They are ecosystem signals.

- PascalCase `.tsx` matches the React component it exports, so the filename and
  the JSX tag read the same: `import Button from './Button'; <Button />`.
  Renaming it to kebab-case breaks tooling assumptions.
- camelCase `useThemeMode.ts` matches the hook function name. The convention is
  universal in the React ecosystem.
- ALL CAPS root files (LICENSE, README, etc.) trigger special rendering on
  GitHub and are recognized by virtually every tool that scans repos.
  Renaming them costs visibility.

Everything else is kebab-case because it is the most readable choice in URLs,
shell history, and `ls` output, and the broadly accepted default across modern
web ecosystems.

#### 1.4 Code identifiers are separate from filenames

These rules govern filenames and folder names only. Identifiers inside code
follow their language conventions: TypeScript uses `camelCase` for variables
and `PascalCase` for types; CSS custom properties use `--kebab-case`. Do not
change identifiers when renaming files.

#### 1.5 Decision tree (when in doubt)

1. Is it a root governance file with a universally expected name (`README`,
   `LICENSE`, `CHANGELOG`, etc.)? Keep the ALL CAPS conventional name.
2. Is it a tool-required filename (`package.json`, `tsconfig.json`, dotfile,
   etc.)? Use whatever the tool requires.
3. Is it a `.tsx`/`.jsx` exporting a React component? Use PascalCase matching
   the component.
4. Is it a `.ts` exporting a React hook (`useFoo`)? Use camelCase matching the
   hook.
5. Otherwise: kebab-case.

#### 1.6 Renaming policy

Renaming a file changes import paths and deployed URLs. When fixing a casing
violation:

- Update every importer in the same change.
- If the file is referenced by a deployed URL, add a redirect or keep a stub
  at the old path until traffic clears.
- Never rename without running the build and tests after.

---

### 2. Web application repo structural standard

This repo is a TypeScript / Vite / React / Tailwind v4 web application. It uses
a flat layout: `src/` is at the repo root. The presence of `pnpm-workspace.yaml`
and `artifacts/mermaid-theme-builder/` is Replit scaffolding and does not indicate
a monorepo. The actual application package is the root `package.json`, named
`@workspace/mermaid-theme-builder`.

`artifacts/mermaid-theme-builder/.replit-artifact/artifact.toml` is a required
Replit platform registration file. It is a single-file platform token containing
no source code. Do not delete it.

```
<repo-root>/
|-- .agents/                  Replit Agent working memory (committed; canonical)
|-- .github/
|   |-- workflows/
|   |   |-- ci.yml                    typecheck, unit tests, lint
|   |   |-- deploy-pages.yml          GitHub Pages build and deploy (active)
|   |   |-- e2e.yml                   Playwright end-to-end tests
|   |   |-- link-check.yml            internal Markdown link checker
|   |   |-- release-gate.yml          CHANGELOG entry check on tag push
|   |   |-- skill-tests.yml           Node.js skill package tests
|   |   |-- sync-forge-tokens.yml     weekly upstream forge-tokens.css sync
|   |-- dependabot.yml
|   |-- FUNDING.yml
|   +-- copilot-instructions.md
|-- .gitignore
|-- .npmrc
|-- .prettierrc
|-- .prettierignore
|-- .replit
|-- .replitignore
|-- AGENTS.md                 this file
|-- CHANGELOG.md
|-- LICENSE
|-- README.md
|-- artifacts/
|   +-- mermaid-theme-builder/
|       +-- .replit-artifact/
|           +-- artifact.toml         Replit platform registration only -- not source code
|-- docs/                     human-authored design, product, and process docs
|-- e2e/                      Playwright end-to-end test specs
|-- examples/                 .mmd authoring reference files (not compiled;
|                             content is inlined into src/data/example-library.ts)
|-- index.html                Vite entry point
|-- package.json              app package (@workspace/mermaid-theme-builder v0.5.0)
|-- playwright.config.ts
|-- pnpm-lock.yaml
|-- pnpm-workspace.yaml       Replit scaffold + catalog: version pins
|-- public/                   static assets (copied verbatim into dist/public/ by Vite)
|-- replit.md                 Replit-specific project notes
|-- scripts/                  build and maintenance scripts
|-- skills/
|   +-- okhp3-mermaid-theme-builder/  SKILL.md package for AI agents using this app
|-- src/                      APPLICATION SOURCE (all app code lives here)
|   |-- __tests__/            unit and component tests (Vitest)
|   |   +-- __snapshots__/    generated snapshots (regenerable; gitignore or accept)
|   |-- components/           PascalCase React components
|   |-- data/                 static data files (kebab-case)
|   |-- hooks/                React hooks (camelCase useFoo.ts)
|   |-- lib/                  pure logic modules (kebab-case)
|   |-- pages/
|   |   +-- tabs/             tab-level route components and sub-components
|   |       +-- apply/        Apply tab sub-components
|   |-- styles/
|   |   +-- forge-tokens.css  synced from OKHP3/OverKill-Hill upstream; do not hand-edit
|   |-- App.tsx
|   |-- index.css
|   |-- main.tsx
|   +-- vite-env.d.ts
|-- standards/                process standards and reference checklists
|-- tsconfig.base.json        shared strict TypeScript defaults
|-- tsconfig.json             app typecheck config (extends tsconfig.base.json)
|-- vite.config.ts            base path injected via BASE_PATH env var; throws if missing
+-- vitest.config.ts
```

#### 2.1 Build output

Build output lands in `dist/public/` (relative to repo root; set in
`vite.config.ts`). `dist/` is always gitignored. Never commit build output.

GitHub Pages deployment is handled by `workflows/deploy-pages.yml`. Base path
and port are injected at build time via `BASE_PATH` and `PORT` environment
variables. The Replit dev server uses `BASE_PATH=/mermaid-theme-builder/` and
`PORT=18624` (set in `artifacts/mermaid-theme-builder/.replit-artifact/
artifact.toml`). The e2e workflow uses `PORT=4173`.

#### 2.2 Folders that must not exist at the repo root

Reserved for detritus and must not be used as legitimate folders: `_unused/`,
`attached_assets/`, `attached-assets/`, `_drafts/`, `_scratch/`, `_old/`,
`tmp/`, `temp/`, `unused/`, `build/`, `.next/`, `.vite/`.

#### 2.2.1 Per-app directory inventory

Current state as surveyed 2026-05-29.

| Directory | Current state | Notes |
| ----------------------------- | --------------------------------------------- | --------------------------------------------------- |
| `src/` | Full application source | All app code; see structure above |
| `src/__tests__/` | 60+ unit and component test files | Hand-authored; none are generated |
| `src/__tests__/__snapshots__/` | 3 snapshot files | Generated; safe to delete and regenerate |
| `src/components/` | 13 React components | All PascalCase .tsx |
| `src/data/` | 4 TypeScript data modules | mermaid-capabilities.ts is the capability registry |
| `src/hooks/` | 2 hooks | useThemeMode.ts, useCodeEditorOverride.ts |
| `src/lib/` | 15 pure logic modules | All kebab-case .ts |
| `src/pages/tabs/` | 5 tab-level route components | ApplyTab, ComposeTab, ExamplesTab, ExtractTab, ReferenceTab |
| `src/pages/tabs/apply/` | 5 Apply tab sub-components | ColorEditorPanel, DiagramDetectHeader, DiagramPreviewPanel, ExportToolbar, RenderWarningSection |
| `src/styles/` | `forge-tokens.css` | Synced from upstream; do not hand-edit |
| `docs/` | 26 Markdown docs + 1 subdirectory + 1 image | All unique content; see Section 9.6 |
| `e2e/` | 10 Playwright spec files | All hand-authored |
| `examples/` | 73 .mmd files + `emulated/` subdirectory | Authoring references; content inlined in example-library.ts |
| `public/` | favicon.svg, icon.svg, 3 generated PNGs, manifest.webmanifest, opengraph.jpg, robots.txt, sitemap.xml, sw.js | PNGs are generated by scripts/generate-icons.mjs |
| `scripts/` | 5 scripts | run-e2e.sh, post-merge.sh, generate-icons.mjs, check-changelog.sh, check-links.sh |
| `skills/okhp3-mermaid-theme-builder/` | SKILL.md, tests, assets, references | Full skill package; tested via skill-tests.yml |
| `standards/` | 2 Markdown docs | mermaid-theme-builder-standard.md, render-safety-checklist.md |
| `artifacts/mermaid-theme-builder/` | .replit-artifact/artifact.toml only | Platform registration; not source code |
| `test-results/` | .last-run.json | Generated by Playwright; gitignore this file |

---

### 3. Detritus (what does not belong in version control)

Replit Agent generates working artifacts during a build. Some are useful in
the moment and become noise the next week. The categories below are detritus
by default and must be gitignored, moved to a proper home, or deleted.

#### 3.1 Replit working-buffer artifacts

- **`attached_assets/`**: paste-buffer transcripts and screenshots from Replit
  Agent prompts. Filenames look like `Pasted--<title>-<timestamp>.txt` or
  `image_<timestamp>.png`. Never useful after the session. Always gitignore.
  Delete from history if accidentally committed.
- **`_unused/`**: code Replit moved out of the way during a refactor. Read it
  once to confirm nothing important is stranded, then delete the folder.
- **`attached-assets/`** (hyphen variant) and **`unused/`**: same rules.

#### 3.2 Test and build output

- **`test-results/`**: Playwright run output. Always gitignored. Delete if committed.
- **`playwright-report/`**: same.
- **`coverage/`**: same.
- **`build/`**, **`.next/`**, **`.vite/`**: build output or cache. Gitignore.
- **`dist/`**: Vite build output. Always gitignored. Never commit.
- **`node_modules/`**: already gitignored by default; verify.
- **`test-results/.last-run.json`**: Playwright run metadata. Gitignore.
- **`src/__tests__/__snapshots__/`**: generated snapshot files. Add to
  `.gitignore` or accept them as committed artifacts -- either is valid. If
  committed, update them with `pnpm test -u` after intentional output changes.

#### 3.3 IDE and OS junk

- **`.DS_Store`**, **`Thumbs.db`**, **`.idea/`**, **`.vscode/`** (with
  team-specific settings): gitignore unless the project deliberately ships a
  workspace config.

#### 3.4 Stale planning artifacts

- **`_replit/`**: old Replit working notes. Triage before deleting: move anything
  worth keeping into `docs/` or `docs/archive/`, delete the rest.

#### 3.5 Duplicated content from sibling repos

When an agent copies a skill or asset from another repo, it sometimes lands in
the wrong repo. If the skill or folder is not owned by this app, remove it.

#### 3.6 Pre-deploy preview directories

Pre-deploy previews of sibling apps copied into this repo are dead weight once
the live URL is deployed. Delete them.

#### 3.7 Deprecated GitHub Actions workflows

These workflow files are superseded and safe to delete:

- `.github/workflows/deploy-mermaid-theme-builder.yml` -- noop since v0.3-alpha.
  Superseded by `deploy-pages.yml`.
- `.github/workflows/pages.yml` -- same. Superseded by `deploy-pages.yml`.

---

### 4. Required `.gitignore` entries

This repo must include at least the following. Add these where absent.

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

If a folder in this list is currently tracked, untrack it
(`git rm -r --cached <folder>`) before committing the `.gitignore` change so
it actually disappears from the index.

---

### 5. Decrapify command (reusable instruction)

When the repo accumulates working artifacts, paste this message to Replit Agent:

> **Decrapify this repo per the Repository Hygiene Standard in `AGENTS.md`
> Section 5.** Triage, do not just delete. Produce a plan first, then execute
> on confirmation. Cover: `attached_assets/` and any hyphen variant, `_unused/`,
> `test-results/`, `playwright-report/`, `coverage/`, `dist/`, `build/`,
> `_replit/` (triage contents into `docs/` or `docs/archive/` before deleting),
> any duplicated sibling-repo content, any file or folder violating the naming
> rules in Section 1, and any folder name listed as forbidden in Section 2.2.
> Do NOT delete `artifacts/mermaid-theme-builder/.replit-artifact/artifact.toml`
> -- that is a required Replit platform file. Delete the two deprecated workflow
> files listed in Section 3.7. Ensure `.gitignore` covers everything in Section
> 4 and `git rm -r --cached` anything that became newly-ignored. Output a
> plain-text plan with: each item, category (gitignore-only, delete,
> triage-then-delete, rename), justification, and risk. Wait for "go" before
> executing. No em dashes in the plan.

---

### 6. Brand contract (OverKill Hill P3 Forge)

This repo serves the OverKill Hill P3 Forge motif.
Canonical reference: <https://raw.githubusercontent.com/OKHP3/OverKill-Hill/main/assets/css/theme.css>

Forge motif declared values:

| Aspect | Value |
| --------------------- | ---------------------------------------------------------- |
| Body scope class | none -- this is the default brand; pages set no body class |
| Display font | Alfa Slab One |
| Body font | DM Sans |
| Mono font | JetBrains Mono |
| Primary accent | rust-orange `#c46a2c` |
| Secondary accent | amber `#e6a03c` |
| Header surface | teal `#1c3a34` |
| Light page background | `#f0ebe5` (warm paper) |
| Light ink | `#0f172a` (deep navy) |
| Dark mode | espresso/slate-blue family (hue ~224) |
| Base radius | `0.75rem` |
| Mermaid line/border | `#c46a2c` |
| Tone | precise, editorial, forge-mode |

**Forbidden in this brand's design system:**

- Coral `#d94f63` (that is Glee-fully)
- Aqua/teal `#2d6f7e` as a primary accent (that is AskJamie)
- Fredoka or Baloo 2 headings (those are Glee-fully and AskJamie)
- Any font outside Alfa Slab One / DM Sans / JetBrains Mono
- Olive hue family in dark mode
- Builders FirstSource (BFS) references, color systems, or examples of any kind

The forge design tokens for this app live in `src/styles/forge-tokens.css`.
This file is synced weekly from the upstream canonical at
`OKHP3/OverKill-Hill/main/assets/css/forge-tokens.css` via
`workflows/sync-forge-tokens.yml`. Do not hand-edit `src/styles/forge-tokens.css`.
If a token is wrong, fix it upstream.

---

### 7. Universal guardrails

These apply in every session, regardless of task:

- No em dashes anywhere (code, comments, copy, commit messages). Use periods
  or restructure the sentence.
- No AI filler in copy or comments: not "seamlessly," "robust," "powerful,"
  "effortlessly," "elevate," "unleash."
- Tailwind v4 only: no `tailwind.config.js` (tokens live in CSS via
  `@theme inline`).
- No new dependencies unless explicitly requested.
- All user-facing content must use US English per the Language Standard in
  Section 0. UK and Commonwealth spellings are defects, not stylistic variants.

---

### 8. US English audit command (reusable instruction)

When the repo accumulates UK or Commonwealth spellings, paste this message to
Replit Agent:

> **Run the US English audit per the Language Standard in `AGENTS.md` Section
> 0.** Produce a QA summary first; execute corrections only after I say "go."
> Cover: UI copy, docs, README, release notes, human-readable comments,
> prompts, tooltips, error and validation messages, and QA/QC reports. Apply
> protected exceptions in Section 0. For existing code identifiers with UK
> spellings, list them as renaming candidates but do not auto-rename without
> confirmation. Output: (1) files scanned, (2) files to change, (3) UK spellings
> found with location, (4) US-EN replacements proposed, (5) protected exceptions
> intentionally left unchanged with reason, (6) identifier renaming candidates
> flagged for separate handling, (7) final confirmation the report itself
> contains no UK spellings. Wait for "go." No em dashes.

---

### 9. App-level governance

#### 9.1 Project identity and brand firewall

**Mermaid Theme Builder** is a personal OverKill Hill P3 project by Jamie Hill.
It is not affiliated with Builders FirstSource, BFS, Mermaid, Mermaid Chart,
Mermaid.ai, or any third-party brand.

This repository must never contain references to:

- BFS, Builders FirstSource, BuildersFirstSource, BFS Light, Builders Blue,
  FirstSource, or any employer or workplace
- Walmart, Starbucks, Apple Theme, Microsoft Theme, Target Theme, Home Depot
  Theme, or any large third-party company brand theme
- Any brand other than the approved OKHP3 ecosystem properties below

**Approved brand properties:**

- OverKill Hill / OverKill Hill P3 (overkillhill.com)
- AskJamie (askjamie.bot)
- Glee-fully (glee-fully.tools)

Built-in themes must be original generic palettes or personal OverKill Hill
ecosystem palettes only.

**Canonical disclaimer** -- always include this in README and major docs:

> Mermaid Theme Builder is a personal OverKill Hill P3 project by Jamie Hill.
> It is not affiliated with Builders FirstSource, BFS, Mermaid, Mermaid Chart,
> Mermaid.ai, or any third-party brand represented by user-entered colors.

#### 9.2 Architecture constraints

Never add:

- Backend server (this is a fully static, browser-only app)
- User login, authentication, or user accounts
- AI API calls or LLM inference
- Payment processing or cloud storage
- File upload functionality
- Analytics that capture or transmit pasted diagram content
- Forked or copied Mermaid source -- always use the npm dependency
- Unpinned latest Mermaid from a CDN in production

#### 9.3 Core workflow

Preserve at all times:

```
paste Mermaid -> detect diagram family -> select or edit theme ->
generate themed Mermaid -> preview -> copy or export
```

Any change that breaks this flow is a defect, regardless of other intent.

#### 9.4 Mermaid dependency governance

- Mermaid is used as an npm dependency (currently `11.15.0` -- pinned exactly).
- Do not fork Mermaid. Do not copy Mermaid source into this repo.
- Dependency updates must be reviewed and tested before release.
- After each Mermaid version upgrade, manually update the constants in
  `src/data/mermaid-capabilities.ts`:
  - `MERMAID_VERSION_VERIFIED` -- set to the new verified version string.
- See `docs/mermaid-capability-registry.md` for the full update checklist.
- See `docs/release-checklist.md` for release governance.
- Mermaid major version updates are excluded from Dependabot automation and
  must be handled manually.

**Version governance constants** -- the following must be updated when the
Mermaid dependency is upgraded:

```typescript
// src/data/mermaid-capabilities.ts
export const MERMAID_VERSION_VERIFIED = "11.15.0";
```

#### 9.5 App-specific conventions

**Capability registry:** `src/data/mermaid-capabilities.ts` is the canonical
source of truth for all diagram family detection and capability data. Do not
hardcode diagram family names anywhere else. All `styleStrategy` values must
accurately reflect what `themeVariables` actually control. New diagram types
added to Mermaid must be manually added to the registry with accurate support
levels.

**Example library:** `src/data/example-library.ts` contains the full example
catalog with inlined `.mmd` content. The `.mmd` files in `examples/` are
authoring references only. When updating an example, update both the `.mmd`
source file and the inlined content in `example-library.ts`.

**Generated public assets:** `public/icon-192.png`, `public/icon-512.png`, and
`public/apple-touch-icon.png` are generated by `scripts/generate-icons.mjs`.
Do not hand-edit these files. Regenerate them by running
`node scripts/generate-icons.mjs` when the icon design changes.

**forge-tokens.css:** `src/styles/forge-tokens.css` is synced from upstream and
must never be hand-edited. Raise a sync issue or fix the upstream file if a
token is incorrect.

**Styling tokens:** All new React components must use the existing Tailwind
utility classes and CSS custom properties from `forge-tokens.css`. Do not
introduce ad-hoc color values or spacing values that bypass the token system.

**Validation before commit:** All new skill packages must pass
`node --test tests/*.test.mjs` from within `skills/okhp3-mermaid-theme-builder/`
before commit (handled by `skill-tests.yml` in CI, but verify locally first).

**UI rules:**

- Flowchart diagrams: full theme support, attribution badge supported.
- All other diagram types: show capability note if `styleStrategy !== "full"`.
- Unknown diagram type: show warning, not a capability note.
- Attribution badge toggle must be disabled for non-flowchart diagrams in V1.

**Badge conventions** -- the `badge` field on example library entries uses plain
text tokens:

| Token | Meaning |
| -------------------- | ------------------------------------------------------------------- |
| `"Beta"` | Diagram family rendered by Mermaid but not production-stable |
| `"Experimental"` | Diagram family with known renderer gaps or breaking-change risk |
| `"Canonical"` | Reference-quality example; no user-facing badge chip |
| `"Canonical - Beta"` | Reference example for a Beta family; surfaces as `- Beta` to users |

Cross-surface consistency rule: both the Examples tab chip and the Compose tab
picker option must convey the same signal. The `previewOptionLabel` field handles
this automatically -- no extra work is needed when adding a new entry.

**Export rules:**

- Metadata comments are included by default (can be toggled off).
- Attribution badge is off by default and only injectable into flowchart diagrams.
- Exported code must be valid Mermaid syntax.
- Never silently swallow export errors.

**Testing before PR:** Run the end-to-end test plan in `docs/release-checklist.md`
before opening a pull request. All e2e test scenarios must pass.

#### 9.6 Per-app directory inventory

See Section 2.2.1 above.

Notable docs in `docs/`:

| File | Purpose |
| --------------------------------------- | -------------------------------------------- |
| `mermaid-capability-registry.md` | Required reading before any Mermaid upgrade |
| `release-checklist.md` | Pre-release manual test gate |
| `design-system.md` | OKH Forge UI System reference |
| `mermaid-theming-reference.md` | Full themeVariables table and renderer compat |
| `threat-model.md` | STRIDE threat model for this app |
| `technical-debt-register.md` | Known tech debt items |
| `roadmap.md` | Feature backlog with completion status |

#### 9.7 Deprecated files and workflows

The following are safe to delete. They contain no unique content and are not
referenced by any active workflow:

- `.github/workflows/deploy-mermaid-theme-builder.yml` -- noop since v0.3-alpha.
- `.github/workflows/pages.yml` -- noop since v0.3-alpha.

When deleting these, confirm that no other workflow references them by name
before executing the delete.
