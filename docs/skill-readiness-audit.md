# Skill Readiness Audit: okhp3-mermaid-theme-builder

**Audited:** 2026-05-22  
**Auditor:** Task #103 (agent)  
**Purpose:** Document which codebase logic is reusable headless, which is UI-coupled, and what must never enter the skill package.

---

## 1. Reusable Non-React Logic

These files contain pure business logic that can be mirrored (or summarized) in the skill without any React or DOM dependency:

| Source File | Reusable content | Skill surface |
|---|---|---|
| `src/lib/palettes.ts` | `BUILTIN_PALETTES` array (7 palettes), `ThemeColor`, `Palette` interfaces | `assets/palettes.json`, `references/palette-registry.md` |
| `src/data/renderer-parity.ts` | `RENDERER_PROFILES` array (7 profiles), `RendererProfile` interface, `buildRendererHeaderComment()`, `rendererToScaffoldSection()` | `assets/renderer-profiles.json`, `references/renderer-profiles.md` |
| `src/data/mermaid-capabilities.ts` | `DIAGRAM_CAPABILITIES`, `DiagramFamily` type | `references/mermaid-theme-variables.md`, `scripts/detect-diagram.mjs` |
| `src/lib/detector.ts` | `detectDiagram()` function, family keyword matching | `scripts/detect-diagram.mjs` (mirrors logic) |
| `src/lib/themeEngine.ts` | `buildInitDirective()` shape, `generateThemedCode()` output contract | `scripts/apply-theme.mjs`, `references/output-format-contract.md` |
| `src/lib/extractor.ts` | `parseInitDirective()` logic (extracts `%%{init}%%` blocks) | `scripts/apply-theme.mjs` (strips init before prepending) |

---

## 2. UI-Coupled Logic (Must Not Enter Skill)

These files are tightly coupled to React, Tailwind, or the browser DOM. They must not be imported or referenced inside `skills/`:

| File | Coupling | Reason |
|---|---|---|
| `src/components/MermaidPreview.tsx` | React + Mermaid DOM renderer | Browser-only rendering |
| `src/components/ColorSwatch.tsx` | React state, event handlers | Interactive UI only |
| `src/pages/ThemeBuilder.tsx` | React, Tailwind, all tabs | App shell |
| `src/lib/exporters.ts` | DOM Blob, `document`, canvas | Browser-only file download |
| `src/lib/persistence.ts` | `localStorage`, `URLSearchParams` | Browser storage |
| `src/lib/themeMode.ts` | `window.matchMedia` | Browser API |
| `src/lib/typography.ts` | React context, UI panel state | Partially UI-coupled |
| `tailwind.config.*` | Tailwind CSS | Build tooling only |

---

## 3. Source File → Skill Asset Mapping

```
src/lib/palettes.ts
  └── assets/palettes.json          (all 7 palettes, hex values verbatim)
  └── references/palette-registry.md

src/data/renderer-parity.ts
  └── assets/renderer-profiles.json (all 7 profiles, interface fields verbatim)
  └── references/renderer-profiles.md

src/data/mermaid-capabilities.ts + src/lib/detector.ts
  └── scripts/detect-diagram.mjs
  └── references/mermaid-theme-variables.md

src/lib/themeEngine.ts (buildInitDirective shape)
  └── scripts/apply-theme.mjs
  └── scripts/validate-theme.mjs
  └── references/output-format-contract.md

examples/*.mmd (5 basic fixtures)
  └── assets/fixtures/*.mmd         (stripped of any %%{init}%% blocks)
```

---

## 4. What Must Never Enter the Skill

- **BFS / Builders FirstSource**: No employer branding, references, or content. The disclaimer in `themeEngine.ts` ("Not affiliated with Builders FirstSource") must not appear in skill output as a positive association — it only appears as the disassociation disclaimer.
- **Stub content**: All reference files and JSON assets must have full, factual content derived from the repo source of truth.
- **Hallucinated themeVariable names**: Only variable names present in `BUILTIN_PALETTES.colors[].key` or standard Mermaid `themeVariables` documented at mermaid.js.org are permitted.
- **Renderer promises contradicting the parity matrix**: Do not claim a renderer supports CSS injection or custom fonts if `renderer-parity.ts` records `"none"` for that capability.
- **React imports**: No `import React`, `import { useState }`, JSX, or any `@/` alias paths.
- **Private/internal notes**: `docs/product-brief.md`, `docs/prototype-to-product-retrospective.md`, `docs/market-research.md`, `docs/roadmap.md` contain internal notes that must not be reproduced in the skill.

---

## 5. Build Checklist

- [x] Read `src/lib/palettes.ts` — 7 palettes confirmed, hex values extracted
- [x] Read `src/data/renderer-parity.ts` — 7 renderer profiles confirmed, all fields captured
- [x] Read `src/data/mermaid-capabilities.ts` — 27+ diagram families, keyword declarations confirmed
- [x] Read `src/lib/themeEngine.ts` — `buildInitDirective()` output shape confirmed: `%%{init: {"theme": "base", "themeVariables": {...}}}%%`
- [x] Read `src/lib/detector.ts` — keyword matching logic confirmed (iterates `DIAGRAM_CAPABILITIES[].declarations` regexes)
- [x] Read `examples/basic-*.mmd` — 5 fixture files confirmed present and clean (no `%%{init}%%` blocks)
- [x] Verified `.gitignore` does not exclude `skills/`
- [ ] Write `SKILL.md` (≤500 lines, spec-compliant frontmatter)
- [ ] Write 6 reference files (full non-stub content)
- [ ] Generate 3 JSON assets from source of truth
- [ ] Copy 5 fixture `.mmd` files
- [ ] Write 5 scripts (no external deps, node-only)
- [ ] Write 3 test files (node:test runner)
- [ ] Write `skills/.../README.md`
- [ ] Append `## Agent Skill` section to root `README.md`
- [ ] Run: `pnpm run typecheck`, `pnpm test`, `node --test skills/.../tests/*.test.mjs`
