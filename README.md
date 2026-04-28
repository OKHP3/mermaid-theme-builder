# Mermaid Theme Builder

> **Disclaimer:** Mermaid Theme Builder is a personal OverKill Hill P³ project by Jamie Hill. It is not affiliated with Builders FirstSource, BFS, Mermaid, Mermaid Chart, Mermaid.ai, or any third-party brand represented by user-entered colors.
>
> Built-in themes are original generic palettes or personal OverKill Hill ecosystem palettes. Users are responsible for ensuring they have the right to use any brand colors, fonts, logos, or identity systems they enter into the tool.

**Mermaid Theme Builder** is a browser-based tool for applying consistent visual themes to [Mermaid](https://mermaid.js.org/) diagrams — especially AI-generated ones.

## What It Does

AI tools like ChatGPT and GitHub Copilot generate Mermaid diagrams using default colors. Mermaid Theme Builder lets you:

1. **Pick or customize a color palette** from the built-in library.
2. **Paste your Mermaid code** — the tool detects the diagram type automatically.
3. **See a live preview** of your diagram with the theme applied.
4. **Export** the themed code, Markdown, or an AI prompt scaffold with the theme baked in.

## Features

- 9 built-in palettes including OverKill Hill P³ ecosystem themes and generic originals
- Per-color override editor with live preview
- Diagram type detection with Mermaid capability registry (stable/beta/experimental classification)
- Style support level shown per diagram type
- Optional metadata comments in all exports (default: ON)
- No backend, no accounts, no data sent anywhere

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
cd artifacts/mermaid-theme-builder
pnpm dev
```

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for build and deployment instructions.

## Documentation

- [docs/PRODUCT_BRIEF.md](docs/PRODUCT_BRIEF.md) — What this tool is and isn't
- [docs/ROADMAP.md](docs/ROADMAP.md) — Planned work
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — Build and deployment
- [docs/RELEASE_CHECKLIST.md](docs/RELEASE_CHECKLIST.md) — Pre-release checklist
- [standards/mermaid-theme-builder-standard.md](standards/mermaid-theme-builder-standard.md) — Technical and product standards
- [standards/render-safety-checklist.md](standards/render-safety-checklist.md) — Render safety guide
- [AGENTS.md](AGENTS.md) — Instructions for AI coding agents

## License

MIT — Personal project by Jamie Hill / OverKill Hill P³.
