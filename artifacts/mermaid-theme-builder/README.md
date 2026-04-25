# Mermaid Theme Builder

**A static, browser-based visual governance utility for Mermaid diagrams.**

Mermaid Theme Builder helps you define a visual theme once, apply it to existing Mermaid code, preview the styled result, copy or export the result, and generate reusable prompt scaffolds — so LLMs stop hallucinating diagram styles.

Everything runs in your browser. Your diagram code never leaves the page.

---

## Features

- **Paste and theme** — Paste any Mermaid diagram code and apply a visual theme in one click
- **25 diagram types detected** — Flowchart, sequence, class, ER, Gantt, pie, git graph, mindmap, and more (with per-type theme support notes)
- **7 built-in palettes** — 3 first-party OKHP3 brand presets + 4 utility/example presets
- **Brand example library** — Load palette-matched flowchart and sequence examples for each OKHP3 brand preset
- **Showcase sample** — "OverKill Rube Goldberg Showcase" — a complex stress-test flowchart demonstrating subgraphs, semantic classes, clickable nodes, ELK layout, and attribution
- **Live preview** — Compare Original and Themed output side by side
- **Three export formats:**
  - **Styled Code** — `%%{init}%%`-prefixed Mermaid code ready to paste
  - **Markdown Bootstrap** — Rich Markdown block with usage instructions and metadata
  - **Prompt Scaffold** — Structured prompt for LLMs to maintain consistent styling
- **Attribution controls** — Toggle metadata comments and optional attribution badge
- **Custom theme naming** — Name and version your custom themes
- **Render-safety warnings** — Flags existing init directives, YAML frontmatter, non-printable characters, and long labels

---

## OKHP3 Ecosystem Brand Presets

Mermaid Theme Builder includes three first-class brand presets from the [OverKill Hill P³](https://overkillhill.com) ecosystem.

| Palette | Site | Best for |
|---|---|---|
| **OverKill Hill P³** | [overkillhill.com](https://overkillhill.com) | Technical, architectural, systems, strategy, executive-facing |
| **AskJamie** | [askjamie.bot](https://askjamie.bot) | Support flows, helpdesk, explainers, user-assistance workflows |
| **Glee-fully** | [glee-fully.tools](https://glee-fully.tools) | Personal productivity, consumer-facing, approachable explainers |

See [docs/BRAND_PRESETS.md](docs/BRAND_PRESETS.md) for full color specifications and usage guidance.

---

## Quick Start

1. Open the app
2. Paste your Mermaid diagram in the **Input** pane
3. Select a theme from **Brand Presets** or **Theme Presets**
4. Click **Themed** in the preview pane to see the result
5. Use **Export** buttons to copy the styled code, Markdown, or Prompt Scaffold

---

## Export Formats

### Styled Code
Copies the `%%{init}%%`-prefixed Mermaid code. Paste directly into any Mermaid renderer that supports the `base` theme.

### Markdown Bootstrap
A complete Markdown document with:
- Theme name, ID, version, and generated date
- Fenced Mermaid code block
- Usage instructions and renderer warnings
- Attribution and non-affiliation disclaimer

### Prompt Scaffold
A structured prompt for AI assistants (ChatGPT, Claude, Gemini, etc.) that includes:
- Required `%%{init}%%` directive
- Metadata comment block
- Brand-specific usage guidance
- Rules to prevent style hallucination
- Example output structure

---

## Attribution

When **Metadata comments** is enabled, generated Mermaid code includes:

```
%% Theme: OverKill Hill P³
%% Theme ID: overkill-hill
%% Theme Version: 0.1.0
%% Created with: Mermaid Theme Builder by OverKill Hill P³
%% Tool URL: https://overkillhill.com/projects/mermaid-theme-builder/
%% Tool Version: 0.1.0
%% Theme Created: 2026-01-01T00:00:00.000Z
%% Theme Updated: 2026-01-01T00:00:00.000Z
%% Not affiliated with Builders FirstSource, Mermaid, Mermaid Chart, or Mermaid.ai
```

When **Attribution badge** is enabled (flowchart diagrams only), a small linked badge node is added to the diagram.

See [docs/ATTRIBUTION.md](docs/ATTRIBUTION.md) for details.

---

## Theme Metadata Schema

Each palette includes:
- `id` — canonical slug
- `name` — display name
- `brandFamily` — `"okhp3"` for ecosystem presets, absent for generic palettes
- `isBrandPreset` — boolean flag
- `description` — short description
- `themeIntent` — intended diagram use cases
- `sourceUrls` — brand source URLs
- `version` — semantic version string
- `colors` — 13 Mermaid theme variable key/value pairs
- `attribution` — default attribution metadata

See [docs/THEME_METADATA.md](docs/THEME_METADATA.md) for full schema documentation.

---

## Constraints

- **No backend** — fully static, client-side only
- **No login or user accounts**
- **No AI API calls**
- **No payment or cloud storage**
- **No file upload**
- **No fork of Mermaid** — uses Mermaid.js as an npm dependency

---

## About this project

Mermaid Theme Builder is a personal [OverKill Hill P³](https://overkillhill.com) project by Jamie Hill.

It is not affiliated with:

- Builders FirstSource or any third-party corporate brand
- [Mermaid](https://mermaid.js.org/) — the open-source diagramming library this tool renders with
- [Mermaid Chart](https://www.mermaidchart.com/) — the commercial platform by the Mermaid maintainers
- [Mermaid.ai](https://www.mermaid.ai/) — a separate AI-powered diagramming product

All built-in brand presets are sourced from OKHP3-owned public brand surfaces (OverKill Hill P³, AskJamie, Glee-fully). All color values are derived from publicly available CSS on GitHub.

---

## Stack

- React 18 + Vite + TypeScript
- Tailwind CSS v4
- Mermaid.js v11 (npm dependency — not forked)
- No backend, no database, no auth

---

*Mermaid Theme Builder is a personal [OverKill Hill P³](https://overkillhill.com) project by Jamie Hill. Not affiliated with Builders FirstSource, Mermaid, Mermaid Chart, or Mermaid.ai.*
