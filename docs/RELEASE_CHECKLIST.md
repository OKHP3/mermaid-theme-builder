# Release Checklist — Mermaid Theme Builder

> **Disclaimer:** Mermaid Theme Builder is a personal OverKill Hill P³ project by Jamie Hill. It is not affiliated with Builders FirstSource, BFS, Mermaid, Mermaid Chart, Mermaid.ai, or any third-party brand represented by user-entered colors.

## Pre-Release Checklist

### Brand Alignment
- [ ] No BFS, Builders FirstSource, or employer references in any file
- [ ] No real-company brand palettes (Walmart, Starbucks, Apple, Microsoft, Target, Home Depot, etc.)
- [ ] Disclaimer present in README.md
- [ ] Disclaimer present in docs/PRODUCT_BRIEF.md
- [ ] All built-in palettes are either original generic palettes or OKH ecosystem palettes
- [ ] OKH ecosystem palette attributions are accurate and reference the correct public CSS source

### Code Quality
- [ ] `pnpm typecheck` passes with no errors
- [ ] `pnpm build` completes with no errors
- [ ] No console errors in browser on fresh load
- [ ] Sample diagram renders correctly with each built-in palette

### Mermaid Dependency
- [ ] `mermaid` is pinned to a specific version (not CDN `latest`)
- [ ] `src/data/mermaid-capabilities.json` `reviewedMermaidVersion` matches installed version
- [ ] `reviewedDate` is current

### Capability Registry
- [ ] All diagram types listed in PRODUCT_BRIEF are present in registry
- [ ] `status`, `styleSupport`, and support flags are accurate for current Mermaid version
- [ ] Beta and experimental types show warnings in UI

### Theme Metadata
- [ ] Metadata comments are correct (tool name, creator, URL, version)
- [ ] Toggle defaults to ON
- [ ] Toggling OFF removes all metadata from exports

### Documentation
- [ ] README.md is accurate and includes disclaimers
- [ ] AGENTS.md is accurate
- [ ] docs/PRODUCT_BRIEF.md is current
- [ ] docs/ROADMAP.md reflects actual completed and planned work
- [ ] docs/DEPLOYMENT.md deployment instructions are accurate
- [ ] standards/ files are current

### CI / Deployment
- [ ] `.github/dependabot.yml` is present and correct
- [ ] GitHub Actions CI workflow passes on the release branch
- [ ] GitHub Pages deployment workflow tested

## Post-Release
- [ ] Tag the release in git (`vX.Y.Z`)
- [ ] Update `toolVersion` in `themeEngine.ts` to match the release tag
- [ ] Update `reviewedDate` in capability registry if Mermaid version changed
- [ ] Announce on overkillhill.com if desired

## v0.3-alpha sign-off

- [x] All v0.3 roadmap items complete (see `docs/ROADMAP.md`)
- [x] `TOOL_VERSION` in `src/lib/themeEngine.ts` bumped to `0.3.0`
- [x] Header version label set to `v0.3-alpha`
- [x] Theme extraction parser added (`src/lib/extractor.ts`) — handles YAML frontmatter and `%%{init}%%` directives
- [x] Family-specific themeVariables (`src/lib/familyTheming.ts`) wired into `buildInitDirective`
- [x] Persistence module (`src/lib/persistence.ts`) — localStorage + base64url share URLs
- [x] File-download exporters (`src/lib/exporters.ts`) — `.mermaid`, `.svg`, `.png`, `.theme.json`
- [x] CI workflow (`.github/workflows/ci.yml`) typechecks and builds on push/PR
- [x] Pages deploy workflow (`.github/workflows/deploy-pages.yml`) builds with derived base path and uploads SPA artifact

> Sign-off date: 2026-05-03 — Jamie Hill (OKHP3)
