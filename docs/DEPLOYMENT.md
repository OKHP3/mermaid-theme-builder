# Deployment — Mermaid Theme Builder

> **Disclaimer:** Mermaid Theme Builder is a personal OverKill Hill P³ project by Jamie Hill. It is not affiliated with Builders FirstSource, BFS, Mermaid, Mermaid Chart, Mermaid.ai, or any third-party brand represented by user-entered colors.

## Overview

Mermaid Theme Builder is a static single-page application (SPA). There is no server, no backend, and no database. All rendering happens in the browser.

## Local Development

```bash
cd artifacts/mermaid-theme-builder
pnpm install
pnpm dev
```

The dev server starts on `http://localhost:5173` by default. The `PORT` environment variable overrides the port (used on Replit). `BASE_PATH` defaults to `/`.

## Build

```bash
cd artifacts/mermaid-theme-builder
pnpm build
```

Output: `artifacts/mermaid-theme-builder/dist/public/`

## GitHub Pages Deployment

Set the `BASE_PATH` environment variable to match the GitHub Pages sub-path:

```bash
BASE_PATH=/mermaid-theme-builder/ pnpm build
```

The built output in `dist/public/` is the GitHub Pages deployment root.

A GitHub Actions workflow (`.github/workflows/deploy.yml`) handles this automatically on push to `main`:

```yaml
- name: Build
  env:
    BASE_PATH: /mermaid-theme-builder/
  run: pnpm build
```

## Replit

Replit sets `PORT` and `BASE_PATH` environment variables automatically. The `vite.config.ts` reads these with safe defaults (`PORT=5173`, `BASE_PATH=/`), so the app runs without modification in either environment.

## Dependency Updates

Dependabot is configured in `.github/dependabot.yml` to open weekly PRs for:
- npm dependencies (all packages, including `mermaid`)
- GitHub Actions versions

### Mermaid Version Update Policy

When `mermaid` is upgraded:
1. Review the Mermaid release notes for new diagram types or breaking changes.
2. Update `src/data/mermaid-capabilities.json`:
   - Update `reviewedMermaidVersion`
   - Update `reviewedDate`
   - Add any new diagram types
   - Update `status`, `styleSupport`, or `notes` for existing types if changed
3. Run `pnpm typecheck && pnpm build` to confirm no breakage.
4. Human review and merge the PR.
