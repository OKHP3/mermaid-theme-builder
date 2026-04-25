# Product Brief — Mermaid Theme Builder

> **Disclaimer:** Mermaid Theme Builder is a personal OverKill Hill P³ project by Jamie Hill. It is not affiliated with Builders FirstSource, BFS, Mermaid, Mermaid Chart, Mermaid.ai, or any third-party brand represented by user-entered colors.
>
> Built-in themes are original generic palettes or personal OverKill Hill ecosystem palettes. Users are responsible for ensuring they have the right to use any brand colors, fonts, logos, or identity systems they enter into the tool.

## What is Mermaid Theme Builder?

Mermaid Theme Builder is a browser-based, no-backend tool for applying custom visual themes to [Mermaid](https://mermaid.js.org/) diagrams. It is designed to solve one specific problem: AI-generated Mermaid diagrams use Mermaid's built-in default colors, and there is no easy way to apply consistent brand or personal color palettes to them.

This tool solves that by:
1. Letting users pick or customize a color palette.
2. Detecting the diagram type from pasted Mermaid code.
3. Generating a correct `%%{init:...}%%` directive and injecting it into the diagram.
4. Exporting the result as ready-to-use code, Markdown, or an AI prompt scaffold.

## Personal / OverKill Hill P³ Project

Mermaid Theme Builder is a personal tool by Jamie Hill, built under the OverKill Hill P³ brand. It is a solo side project, not a commercial product or a company initiative. It is not affiliated with any employer.

## Target User

- Developers and technical writers who use Mermaid diagrams in documentation, wikis, or GitHub.
- AI-assisted diagram authors who want consistent visual styling.
- Personal or team use — no accounts, no backend, no data storage.

## Core Scope (V0.x)

- Static, single-page React app.
- Built-in palette library with OKH ecosystem and generic palettes.
- Color editor with per-variable overrides.
- Diagram type detection with capability registry.
- Export: styled code, Markdown bootstrap, AI prompt scaffold.
- Optional metadata comments in all exports.

## Out of Scope (Not V0.x)

- No backend.
- No login or accounts.
- No payment or subscription.
- No database.
- No AI API calls.
- No file upload.
- No real-company brand themes.

## Mermaid Dependency

Mermaid is consumed as a versioned npm dependency (`mermaid ^11.x`). It is not copied, forked, or loaded from CDN `latest`. The capability registry (`src/data/mermaid-capabilities.json`) documents the reviewed version and must be updated when Mermaid is upgraded.

## Brand Palette Direction

Built-in palettes fall into two categories:

**OverKill Hill P³ Ecosystem Palettes** (derived from public site CSS):
- OKH Light — OverKill Hill P³ light palette
- OKH Protocol — OverKill Hill P³ dark/industrial palette
- AskJamie Friendly — AskJamie.bot light palette
- Glee-fully Bright — Glee-fully.tools amber palette

**Generic Original Palettes** (not derived from any third-party brand):
- Neutral Enterprise
- Ocean Depth
- Forest Sage
- Slate Ember
- Violet Mist

## Versioning

- `v0.1` — Initial proof-of-concept. Flowchart theming, basic palette, copy export.
- `v0.2` — OKH ecosystem palettes, capability registry, metadata comments, beta/experimental warnings.
- `v0.3` — Planned public alpha. Full documentation, GitHub Pages deployment, Dependabot.
