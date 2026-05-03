# Mermaid Theme Builder

[![CI](https://github.com/OWNER/REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/OWNER/REPO/actions/workflows/ci.yml)
[![Pages](https://github.com/OWNER/REPO/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/OWNER/REPO/actions/workflows/deploy-pages.yml)

> **Disclaimer:** Mermaid Theme Builder is a personal OverKill Hill P³ project by Jamie Hill. It is not affiliated with Builders FirstSource, BFS, Mermaid, Mermaid Chart, Mermaid.ai, or any third-party brand represented by user-entered colors.
>
> Built-in themes are original generic palettes or personal OverKill Hill ecosystem palettes. Users are responsible for ensuring they have the right to use any brand colors, fonts, logos, or identity systems they enter into the tool.

**Mermaid Theme Builder** is a browser-based tool for applying consistent visual themes to [Mermaid](https://mermaid.js.org/) diagrams — especially AI-generated ones.

> Replace `OWNER/REPO` in the badges above with your GitHub org/repo after the first push, and the badges will go live alongside the workflows.

## Try It

After enabling GitHub Pages on this repo (Settings → Pages → Source: GitHub Actions), the latest `main` deploys to:

```
https://OWNER.github.io/REPO/
```

The Pages workflow auto-derives the base path from the repository name. To deploy at a different path (e.g. a custom domain), set a repository Variable named `MTB_BASE_PATH` (for example `/`).

## What It Does

AI tools like ChatGPT and GitHub Copilot generate Mermaid diagrams using default colors. Mermaid Theme Builder lets you:

1. **Pick or customize a color palette** from the built-in library, or **extract** the theme from a diagram you already have.
2. **Paste your Mermaid code** — the tool detects the diagram type automatically.
3. **See a live preview** of your diagram with the theme applied.
4. **Export** the themed code, Markdown, or an AI prompt scaffold with the theme baked in.
5. **Download** the result as `.mermaid`, `.svg`, `.png`, or `.theme.json`.
6. **Save, share, and reuse** palettes — named saves persist locally; shareable URLs encode the theme in a base64url query parameter.

## Features (v0.3-alpha)

- **9 built-in palettes** including OverKill Hill P³ ecosystem themes and generic originals
- **Per-color override editor** with live preview
- **Diagram type detection** with Mermaid capability registry (stable / beta / experimental classification)
- **Family-specific theme variables** for sequence diagrams, state diagrams, ER diagrams, class diagrams, Gantt charts, pie charts, git graphs, journey maps, and quadrant charts — Mermaid renders the right tokens for each diagram family rather than only flowchart tokens
- **Theme extraction** from pasted diagrams with YAML frontmatter or `%%{init}%%` directives — turns any styled diagram into an editable palette
- **Local persistence** of palette selection, color customizations, theme name, exports settings, and the diagram you're working on (localStorage; no backend)
- **Named user palettes** — save the current theme, delete unwanted ones, import/export JSON
- **Shareable URLs** — copy a link with the theme encoded in a `?theme=…` query parameter
- **File downloads** — `.mermaid` (raw text), `.svg` (vector), `.png` (2× rasterised), `.theme.json` (portable palette)
- **Optional metadata comments** in all exports (default: ON)
- **Optional attribution watermark** for visible-credit exports
- **No backend, no accounts, no telemetry** — everything runs in the browser

## Built-in Palettes

| Palette | Category | Description |
|---|---|---|
| OKH Light | OKH Ecosystem | OverKill Hill P³ light — warm paper tones, teal nodes |
| OKH Protocol | OKH Ecosystem | OverKill Hill P³ dark — espresso bg, rust-orange edges |
| AskJamie Friendly | OKH Ecosystem | AskJamie.bot light — calm blues, OKH orange accents |
| Glee-fully Bright | OKH Ecosystem | Glee-fully.tools — amber-gold, energetic |
| Neutral Enterprise | Generic | Clean gray-on-white, works anywhere |
| Ocean Depth | Generic | Deep blues and teals |
| Forest Sage | Generic | Earthy greens and warm neutrals |
| Slate Ember | Generic | Dark grays with orange accents |
| Violet Mist | Generic | Soft purples and lavenders |

OKH ecosystem palettes are derived from public OverKill Hill P³ site CSS. See attribution in the color editor sidebar.

## Mermaid Version

This tool is reviewed and tested against **Mermaid `^11.14.0`**. The capability registry (`src/data/mermaid-capabilities.json`) documents the reviewed version and diagram-specific theming support levels.

## Development

```bash
pnpm install
pnpm --filter @workspace/mermaid-theme-builder run dev
```

The dev server reads `PORT` and `BASE_PATH` from the environment (provided automatically by the Replit workflow). For local non-Replit dev:

```bash
PORT=18624 BASE_PATH=/mermaid-theme-builder/ pnpm --filter @workspace/mermaid-theme-builder run dev
```

To build for production:

```bash
PORT=18624 BASE_PATH=/mermaid-theme-builder/ pnpm --filter @workspace/mermaid-theme-builder run build
```

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for build and deployment instructions.

## Documentation

- [docs/PRODUCT_BRIEF.md](docs/PRODUCT_BRIEF.md) — What this tool is and isn't
- [docs/ROADMAP.md](docs/ROADMAP.md) — Planned and shipped work
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — Build and deployment
- [docs/RELEASE_CHECKLIST.md](docs/RELEASE_CHECKLIST.md) — Pre-release checklist
- [standards/mermaid-theme-builder-standard.md](standards/mermaid-theme-builder-standard.md) — Technical and product standards
- [standards/render-safety-checklist.md](standards/render-safety-checklist.md) — Render safety guide
- [AGENTS.md](AGENTS.md) — Instructions for AI coding agents

## License

MIT — Personal project by Jamie Hill / OverKill Hill P³.
