# Roadmap — Mermaid Theme Builder

> **Disclaimer:** Mermaid Theme Builder is a personal OverKill Hill P³ project by Jamie Hill. It is not affiliated with Builders FirstSource, BFS, Mermaid, Mermaid Chart, Mermaid.ai, or any third-party brand represented by user-entered colors.

## Shipped: v0.2

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

## Current: v0.3 — Public Alpha

Target: First publicly shared release via overkillhill.com/projects/mermaid-theme-builder/

- [x] GitHub Actions CI workflow (typecheck + build on PR and push)
- [x] GitHub Pages deployment workflow
- [x] Theme extraction from pasted diagrams (Mode 3 — bidirectional binding via editable palette)
- [x] Family-specific themeVariables for sequence/state/ER/class/gantt/pie/git/journey/quadrant
- [x] Persistence of palette state, customizations, and input code via localStorage
- [x] Named user palettes — save, delete, import/export JSON
- [x] Shareable URLs (`?theme=…` base64url-encoded payload)
- [x] File downloads — `.mermaid`, `.svg`, `.png`, `.theme.json`
- [x] Header version label bumped to v0.3-alpha
- [x] AGENTS.md reviewed and confirmed accurate
- [x] README.md expanded with feature list and usage
- [x] Palette attribution and sourcing verified
- [x] Release checklist completed and signed off

## Future: v0.4+

These are planned but not committed. Scope may change.

- [ ] Two-way sync between editable palette and pasted diagram source (write-back of edits into the source code)
- [ ] Dark mode for the builder UI itself
- [ ] Support for Mermaid `classDef` injection for flowchart diagrams (extend extracted classDefs back into editable per-class palette)
- [ ] Link-specific styling hints (`linkStyle`)
- [ ] Capability registry auto-update check against installed Mermaid version
- [ ] Upload/drag-drop `.mermaid` and `.theme.json` files as alternative inputs
- [ ] Multi-palette comparison view (apply N palettes to one diagram side-by-side)

## Not Planned (Out of Scope)

- No backend.
- No login or accounts.
- No payment or subscription.
- No database.
- No AI API calls.
- No file upload to a server (local file pickers only).
- No real-company brand themes.
- No turning this into Mermaid.ai.
