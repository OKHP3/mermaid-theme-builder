# Mermaid Theme Builder

**Define your brand. Style your diagrams. Stop fighting with LLM outputs.**

Mermaid Theme Builder is a browser-based visual governance tool for Mermaid diagrams. Paste any Mermaid diagram, apply a theme, preview it live, and export styled code, markdown bootstraps, or AI prompt scaffolds.

Built for enterprise architects, technical writers, and AI power users who generate Mermaid diagrams through Claude, ChatGPT, Copilot, Gemini, or Mermaid.ai.

## Workflow Tabs (V0.3.1)

The interface is organized into four focused tabs that share palette and code state:

- **Apply** — paste Mermaid, apply a theme, preview, and copy/export. The default landing tab and core workflow.
- **Compose** — design a reusable theme/bootstrap without needing diagram code. Hosts the full color editor and exports a Bootstrap Markdown or Prompt Scaffold to seed an LLM.
- **Examples** — browse and load sample diagrams. Each example previews live with the current theme and can be loaded into Apply with one click.
- **Reference** — inspect Mermaid support, capability warnings, theme confidence, notation compliance, and visual-language guidance. Hosts the Diagram Inventory and Class Library.

Mobile uses a fixed bottom tab bar to keep navigation in thumb reach. The Apply tab on mobile stacks code, preview, and export actions vertically; the color editor opens as a full-screen drawer. See `docs/ux-restructure-assessment.md` for the full restructure rationale.

## Features

- Paste Mermaid code, auto-detect diagram family (15 types)
- 7 built-in palettes: Ocean Depth, Forest Sage, Slate Ember, Violet Mist, OverKill Hill P3, Glee-fully, AskJamie
- Two-way live color editor with instant preview
- Three export modes: Styled Code, Markdown Bootstrap, Prompt Scaffold
- Render-safety warnings (existing init directives, non-printable chars, long labels)
- Optional theme attribution watermark with clickable link
- 100% client-side. No backend, no login, no data leaves your browser.

## Quick Start

```bash
pnpm install
pnpm --filter @workspace/mermaid-theme-builder dev
```

## Supported Diagram Types

Flowchart, Sequence, Class, State, ER, Gantt, Pie, Git Graph, Mindmap, Timeline, Quadrant, User Journey, Block, Sankey, XY Chart.

## License

MIT

## Disclaimer

Mermaid Theme Builder is a personal OverKill Hill P3 project by Jamie Hill. It is not affiliated with Builders FirstSource, BFS, Mermaid, Mermaid Chart, or Mermaid.ai.
