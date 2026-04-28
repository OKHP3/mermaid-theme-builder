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
