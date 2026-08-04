# Roadmap

## v0.1.0 — Foundation (Shipped 2026-04-23)

- Static React + Vite + Tailwind CSS v4 app, no backend
- 15 diagram family auto-detection
- 7 built-in palettes (3 OKHP3 brand + 4 utility)
- Live side-by-side preview (Original / Themed)
- Three export formats: Styled Code, Markdown Bootstrap, Prompt Scaffold
- Two-way live color editor
- Attribution system (metadata comments + badge)
- MIT license, README, GitHub Pages deployment

---

## v0.2.0 — Capability Registry + Persistence (Shipped 2026-04-25)

- **Diagram Capability Registry** — 27 families tracked with support levels, confidence, compliance, and example files
- **10 capability gap entries** — honest "not supported" tracking for BPMN 2.0, ArchiMate, SysML, VSM, etc.
- **OverKill Mermaid Example Pack** — 26-entry example library with inlined `.mmd` content
- **Examples tab** — browse brand-matched examples per palette
- **`CapabilityNote`** — inline note for non-full-support diagram types
- **Render-safety warnings** — init directive conflicts, non-printable chars, long labels
- **localStorage persistence** — palette edits survive reload
- **URL-encoded palette sharing** — hash-fragment encoding
- **Import/export palette** as JSON; export all as bundle; export as CSS custom properties
- **Dark/light/system mode toggle**
- **Keyboard shortcut** `Ctrl+Shift+C` to copy Styled Code
- **Diagram family override** — manual selector
- **Compose tab** — build and edit custom palettes
- **Diff view** — three-mode Original / Themed / Diff
- **Multi-diagram paste splitting**
- **Extract mode** — reverse-engineer theme from existing `%%{init}%%`
- **Family-specific theming overlays** (sequence, ER, etc.)
- **Prompt Scaffold v2** — classDefs, YAML frontmatter, repair templates
- **Documentation suite** — AGENTS.md, PRODUCT_BRIEF, BRAND_PRESETS, ATTRIBUTION, LEGAL, MERMAID_CAPABILITY_REGISTRY, MERMAID_THEMING_REFERENCE, RELEASE_CHECKLIST, THEME_METADATA, DEPLOYMENT
- **`MERMAID_VERSION_VERIFIED`** governance constant
- **PWA manifest + service worker**

---

## v0.3.0 — App Icon + Palette Corrections (Shipped 2026-05-05)

- **Custom app icon** — "Forked Flow" SVG + PNG rasters (`scripts/generate-icons.mjs`)
- **Corrected OKHP3 palette hex values** — accurate colors for OverKill Hill, AskJamie, Glee-fully
- **Touch compatibility** improvements for mobile preview interactions
- **Diagram render fixes** — requirements, sequence, fishbone, comma parsing

---

## v0.4.0 — Reference Tab + URL Routing (Shipped 2026-05-05)

- **Reference tab** — `DiagramInventory` + `ClassBrowser` as a standalone tab
- **URL routing** — tab state encoded in URL hash
- **Filterable/searchable DiagramInventory** — All / Native / Beta+Partial / Experimental / Gaps filter tabs
- **`ClassBrowser`** — collapsible CSS class reference panel

---

## v0.5.0 — Forge UI System + Pan/Zoom + CI/CD (Shipped 2026-05-12)

- **OKH Forge UI System v0.1.0** — structured design token layer (8 sections, canonical `--okh-forge-*` tokens, utility classes)
- **`docs/design-system.md`** — design system reference
- **Pan and zoom on all diagram previews** — drag-to-pan, scroll zoom, pinch zoom, control toolbar
- **GitHub Pages CI/CD fixed** — pnpm/action-setup@v6 wired correctly; actions upgraded to current versions
- **5 security CVEs resolved** — mermaid upgraded to 11.15.0; uuid override `^11.1.1`

---

## v0.6.0 — P0 Capability Fixes + Documentation Truth Sync (Shipped 2026-08-04)

**Tag:** `v0.6.0`

### Shipped
- **Extract tab restored** — dedicated Extract nav tab re-registered; `#extract` URL resolves
- **Renderer-aware output format toggle** — `%%{init}%%` / YAML frontmatter pill in Apply ExportToolbar; defaults per renderer; persisted
- **Stroke/border width control** — "Node border width" button group in Compose Look section (Default / 1–4 px)
- **YAML frontmatter generation** — `buildFrontmatter()` aligned with `buildInitDirective` for look, family, typography
- **8-renderer README** — m365-loop / Microsoft Loop added to the README parity matrix table
- **Skills catalog regenerated** — 10 skills; okhp3-mermaid-governance v1.1.0 and okhp3-skill-promotion v0.1.0 now appear
- **Documentation truth sync** — README family count, Exports section, Tabs table, and renderer count all match the live app
- **Neutral Enterprise retired** — removed from planning documents (was never in code)

### v1.0.0 evaluation
Privacy-respecting analytics and a completed WCAG 2.1 AA audit remain open. v1.0.0 is not yet earned.

---

## v0.7.0 — Governance Profiles (Planned)

---

## v0.8.0 — Editor + Accessibility + Layout Tier Tokens

**Status:** Planned

- [ ] **Layout tier tokens** — `:::zone.primary`, `:::zone.system`, `:::lane.human`, `:::lane.automated` as semantic classDef additions; encodes structural role, not just color tier (see `docs/governance-profiles.md`)
- [ ] **Syntax-highlighted code editor** — CodeMirror or Monaco micro-bundle for the paste area
- [ ] **Auto-load brand example on palette switch** — pre-fill Apply tab with matching example when no code is present
- [ ] **WCAG 2.1 AA audit** — axe-core review + remediation of critical/serious violations
- [ ] Configurable Prompt Scaffold sections — select which sections to include

---

## v1.0.0 — Public Release

**Status:** Planned

**Goals:** Polish, publish, and make the site properly discoverable.

- [ ] **Privacy-respecting analytics** — Plausible or Fathom (no cookies, no diagram content captured)
- [ ] **GitHub release cadence** — tagged releases with CHANGELOG notes for each version
- [ ] **Accessibility** — WCAG 2.1 AA verified
- [ ] Keyboard-navigable palette picker (already partial)
- [ ] `robots.txt` and `sitemap.xml`

---

## Version Policy

**Cadence:** Tag a new version after every sprint that ships at least one user-visible feature or behavior change. Do not leave the repo 700 commits ahead of the last tag.

**Rule for agents:** Before marking a task that touches user-visible behavior as complete, check whether a version bump is warranted. If yes, update `package.json`, add a `CHANGELOG.md` entry, commit, tag, and push the tag to GitHub. A GitHub release is required for any tag that crosses a minor version boundary (e.g. v0.5.0 → v0.6.0).

**Earning versions:**
- `v0.x.y` patch: bug fixes and internal refactors with no user-visible behavior change.
- `v0.x.0` minor: any shipped user-visible feature or capability, however small.
- `v1.0.0`: earned only when all v1.0.0 gates in the roadmap pass (currently: analytics + WCAG 2.1 AA audit + full keyboard navigation). Do not tag v1.0.0 until every gate is explicitly checked and passes.

This policy is enforced in `AGENTS.md` Section 9.

---

## Permanently out of scope

These will never be added regardless of version:

- Backend, server-side processing, or API calls
- User accounts or login
- Cloud storage for user diagrams
- AI API calls or LLM integration
- Payment or subscriptions
- File upload (beyond JSON palette import)
- Fork of Mermaid.js source code
- Analytics that capture or transmit pasted diagram content

---

## Detailed Planning Documents

- [v0.5–v0.7 Detailed Release Plan](roadmap/mermaid-theme-builder-v0.5-v0.7-plan.md)

---

## Requests and suggestions

Open an issue at [github.com/OKHP3/mermaid-theme-builder](https://github.com/OKHP3/mermaid-theme-builder) or reach out via [overkillhill.com](https://overkillhill.com).
