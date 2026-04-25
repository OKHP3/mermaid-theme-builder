# Mermaid Style Builder

**Define your brand. Style your diagrams. Stop fighting with LLM outputs.**

A client-side web tool that gives you control over Mermaid diagram styling. Define brand colors through interactive pickers, generate a complete Mermaid theme system (YAML frontmatter, init directives, classDef libraries), apply themes to existing diagrams, and extract themes from styled diagrams with bidirectional editing.

Built for anyone who generates Mermaid diagrams through AI assistants and wants the output to look intentional rather than accidental.

---

## The problem

When an LLM generates a Mermaid diagram, the visual output is random. Every diagram gets a different palette. Follow-up prompts to fix styling burn tokens, partially comply, and sometimes break the diagram's content. Maintaining visual consistency across a multi-diagram deliverable through prompt engineering alone is essentially impossible.

Mermaid has powerful theming capabilities, but no user-facing workflow for creating, applying, and reusing a visual identity.

## The solution

Three workflows in one tool:

**Compose** -- Define brand colors, generate a portable style specification (YAML, init directive, classDef library, subgraph tiers). Upload the output to any LLM as context so every diagram arrives pre-styled.

**Apply** -- Paste an existing diagram, inject the active theme, preview the result, copy the styled code.

**Extract** -- Paste a styled diagram, extract its color values into the picker panel, adjust, and export.

## Quick start

Visit [overkillhill.com/projects/mermaid-style-builder](https://overkillhill.com/projects/mermaid-style-builder/) to use the hosted tool. No installation required.

## Local development

```bash
git clone https://github.com/OKHP3/mermaid-style-builder.git
cd mermaid-style-builder
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## Build for production

```bash
npm run build
```

Output is in `dist/`. Open `dist/index.html` directly or deploy to any static host.

## How it works

The tool generates Mermaid configuration code from your color choices. It does not render diagrams as a service. The live preview uses [mermaid.js](https://github.com/mermaid-js/mermaid) (MIT licensed) loaded from CDN for validation only. Your primary output is styled text that you paste into your target environment.

### Outputs

- **YAML frontmatter** -- The current Mermaid standard (v10.5+) for per-diagram configuration
- **Init directive** -- Single-line `%%{init}%%` fallback for renderers that don't support frontmatter (e.g., some versions of Microsoft Loop)
- **classDef library** -- 17 semantic node classes with auto-calculated contrast colors
- **Subgraph style tiers** -- 6 container patterns for consistent subgraph styling
- **Full design system** -- Complete markdown document combining all outputs, suitable for upload to Claude Projects, Custom GPTs, Copilot agents, or Mermaid.ai project files

### Supported diagram types

Theme injection works across all Mermaid diagram types. Flowchart-family diagrams (flowchart, graph, block-beta) receive both theme configuration and classDef injection. All other types (sequenceDiagram, classDiagram, stateDiagram, erDiagram, gantt, pie, timeline, mindmap, etc.) receive theme configuration only, as classDef is not supported outside the flowchart family.

## Built-in presets

| Preset | Description |
|--------|-------------|
| BFS Light | Enterprise blue palette with warm gray canvas |
| OverKill Hill | Dark industrial palette with amber accents |
| Glee-fully | Warm coral and teal on cream |
| Corporate Neutral | Navy and slate on cool white |

Custom palettes can be saved to browser localStorage and exported as JSON.

## Companion content

This tool is part of the [OverKill Hill P3](https://overkillhill.com) project ecosystem.

- **Article:** [The First Diagram Is Usually a Liar](https://overkillhill.com/writings/first-diagram-is-a-liar/) -- The conceptual foundation for why iterative diagramming and visual consistency matter.
- **Design System:** The BFS Mermaid Design System v1.0 (included in `docs/DESIGN_SYSTEM.md`) provides a comprehensive reference covering all 25 Mermaid diagram types and 40+ flowchart shapes mapped to a semantic style taxonomy.

## Technical details

- Entirely client-side. No server, no backend, no tracking.
- Built with vanilla JavaScript and Vite.
- Mermaid.js loaded from CDN at runtime (not bundled).
- Deployable on any static host (GitHub Pages, Netlify, Vercel, S3).

## Contributing

Issues and pull requests welcome. If you've created a preset palette you'd like to share, open a PR adding it to `src/presets.js`.

## License

MIT

## Author

Jamie Hill -- [OverKill Hill P3](https://overkillhill.com) -- [LinkedIn](https://www.linkedin.com/in/oabornes/)
