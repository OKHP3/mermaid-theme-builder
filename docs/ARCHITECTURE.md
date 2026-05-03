# Architecture

> Mermaid Theme Builder is a personal OverKill Hill P³ project by Jamie Hill. It is not affiliated with Builders FirstSource, BFS, Mermaid, Mermaid Chart, Mermaid.ai, or any third-party brand represented by user-entered colors.

## Stack

- **React 18 + TypeScript** UI rendered through **Vite**.
- **Tailwind CSS** + a small set of custom UI primitives.
- **mermaid ^11.14.0** for diagram rendering and the Init/`themeVariables` directive.
- **No backend.** The app is fully static. There is no database, no login, no API call to any AI service, and no telemetry on pasted diagram content.

## Top-level directory layout

```
artifacts/mermaid-theme-builder/
├── src/
│   ├── App.tsx                  ← top-level shell + cross-tab state hub
│   ├── components/              ← MermaidPreview, ColorSwatch, modals, ErrorBoundary
│   ├── pages/tabs/
│   │   ├── ApplyTab.tsx         ← paste → theme → preview → copy/download
│   │   ├── ComposeTab.tsx       ← visual identity editor + import/export/share
│   │   ├── ExamplesTab.tsx      ← grouped example browser
│   │   └── ReferenceTab.tsx     ← capability registry & guidance
│   ├── lib/
│   │   ├── themeEngine.ts       ← buildInitDirective / generateThemedCode
│   │   ├── detector.ts          ← identifies diagram family
│   │   ├── extractor.ts         ← Mode 3: pull a theme out of pasted code
│   │   ├── familyTheming.ts     ← per-family themeVariables overlay
│   │   ├── persistence.ts       ← localStorage + base64url share tokens
│   │   ├── exporters.ts         ← .mermaid / .svg / .png / .theme.json
│   │   └── palettes.ts          ← built-in palettes (brand + utility)
│   └── data/
│       ├── mermaid-capabilities.ts ← capability registry (Reference tab)
│       ├── example-library.ts      ← shipped sample diagrams
│       └── examples.ts             ← generic preview sample
├── index.html
├── vite.config.ts               ← base = $BASE_PATH or "/"
└── package.json
```

## Cross-tab state

State lives in `App.tsx` and is passed to each tab via props. Shared state:

- `selectedPaletteId`, `customColors[paletteId]`, `userPalettes` (saved/imported/shared/extracted)
- `customThemeName`, `includeMetaComments`, `includeBadge`
- `inputCode` (the user's pasted Mermaid)
- `userPalettes` is persisted to `localStorage` under the key `mtb.state.v1`

We deliberately did not introduce Zustand/Redux: a small handful of useState/useCallback in App.tsx is sufficient and easier to audit.

## Theme engine

`buildInitDirective(palette, family)` produces the `%%{init: {...}}%%` block that Mermaid expects.

1. Convert the palette's `ThemeColor[]` to a flat `Record<string,string>` of theme variables.
2. Compute a family overlay (`familyTheming.ts`) that maps the palette's primary/secondary tokens to family-specific keys (e.g. `actorBkg` for sequence diagrams, `pie1`–`pie8` for pie charts).
3. Merge with the **base palette winning** over the overlay so that explicit user choices always override family defaults: `{ ...overlay, ...baseVars }`.

`generateThemedCode(input, options)` strips any pre-existing `%%{init}%%` block and prepends the new one. When the badge is enabled and the diagram family supports clickable nodes, a small `MTB_BADGE` classDef + node is appended. The larger 16-class semantic `classDef` library lives in the scaffold/markdown export path (`buildScaffold`), so the live preview stays faithful to what the user pasted while the exported scaffold gives an LLM the full styling vocabulary.

## Theme extraction (Mode 3)

`extractor.ts` parses YAML frontmatter, `%%{init}%%` blocks, and `classDef` lines from pasted Mermaid and synthesizes an editable palette. The Apply tab shows an "Extract theme" banner whenever the pasted diagram already carries its own theme directive.

## Persistence + sharing

- **localStorage:** versioned schema (`schemaVersion: 1`); newer schemas are ignored gracefully.
- **Share URLs:** `?theme=<base64url>` of a `ShareablePayload` (palette id, name, theme variables, custom theme name). Decoded payloads are sanitized to a strict `Record<string,string>` before being applied.
- **Portable JSON:** `mtb-palette` v1 schema with palette + theme variables, used by Compose tab Import/Export.

## Build pipeline

- Local dev: `pnpm --filter @workspace/mermaid-theme-builder run dev`. Reads `PORT` and `BASE_PATH` from env (Replit workflow injects these).
- CI: `.github/workflows/ci.yml` runs `pnpm install --frozen-lockfile`, `pnpm typecheck`, and a production build on PR/push.
- GitHub Pages: `.github/workflows/deploy-pages.yml` builds with a base path derived from `${GITHUB_REPOSITORY#*/}` (override via `vars.MTB_BASE_PATH`) and uploads `artifacts/mermaid-theme-builder/dist/public` to Pages, with an SPA-style 404 fallback.
