# Roadmap — Mermaid Theme Builder

> **Disclaimer:** Mermaid Theme Builder is a personal OverKill Hill P³ project by Jamie Hill. It is not affiliated with Builders FirstSource, BFS, Mermaid, Mermaid Chart, Mermaid.ai, or any third-party brand represented by user-entered colors.

## Current: v0.2 (In Progress)

- [x] OKH ecosystem palettes (OKH Light, OKH Protocol, AskJamie Friendly, Glee-fully Bright)
- [x] Neutral Enterprise and generic palettes (Ocean Depth, Forest Sage, Slate Ember, Violet Mist)
- [x] Mermaid Capability Registry (`src/data/mermaid-capabilities.json`)
- [x] Diagram type detection with capability metadata
- [x] Beta/experimental diagram type warnings in UI
- [x] Style support level shown in UI header
- [x] Reviewed Mermaid version shown in UI
- [x] Theme metadata comments in exports (toggle: default ON)
- [x] Attribution in Markdown and Prompt Scaffold exports
- [x] Dependabot for npm and GitHub Actions
- [x] Product documentation (PRODUCT_BRIEF, ROADMAP, DEPLOYMENT, RELEASE_CHECKLIST)
- [x] Standards documentation

## Next: v0.3 — Public Alpha

Target: First publicly shared release via overkillhill.com/projects/mermaid-theme-builder/

- [ ] GitHub Actions CI workflow (typecheck + build on PR and push)
- [ ] GitHub Pages deployment workflow
- [ ] AGENTS.md reviewed and confirmed accurate
- [ ] README.md expanded with screenshots and usage examples
- [ ] Palette attribution and sourcing verified
- [ ] Release checklist completed and signed off

## Future: v0.4+

These are planned but not committed. Scope may change.

- [ ] Persist palette customizations to localStorage
- [ ] Named custom palette save/load (localStorage, no backend)
- [ ] Palette import/export as JSON
- [ ] More diagram-specific theming hints (sequence actor colors, etc.)
- [ ] Dark mode for the builder UI itself
- [ ] Shareable URL with palette state encoded in query string (no backend)
- [ ] Support for Mermaid `classDef` injection for flowchart diagrams
- [ ] Link-specific styling hints (`linkStyle`)
- [ ] Capability registry auto-update check against installed Mermaid version

## Not Planned (Out of Scope)

- No backend.
- No login or accounts.
- No payment or subscription.
- No database.
- No AI API calls.
- No file upload.
- No real-company brand themes.
- No turning this into Mermaid.ai.
