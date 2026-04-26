# AGENTS.md — Mermaid Theme Builder

## Brand Separation Directive (permanent, non-negotiable)

This project is a personal open-source tool by Jamie Hill (OverKill Hill / OKHP3).
It is NOT affiliated with any employer, including Builders FirstSource (BFS).

When generating code, documentation, comments, or examples for this repository:
- Never reference BFS, Builders FirstSource, or any employer brand.
- Never use these hex values as preset colors: #00205B, #003087, #002F86, #B3C1DB, #D6E5F9, #D0D0CE, #C8102E.
- All preset palettes must be original compositions or derived from the author's personal web properties (overkillhill.com, glee-fully.tools, askjamie.bot).
- Example diagrams must use generic, non-employer content.

## Acceptable Brand Presets

- OverKill Hill P3: teal #1C3A34, amber #E6A03C, dark surface #111827
- Glee-fully: coral #D94F63, paper cream #F6F2EE, teal #2D6F7E
- AskJamie: teal #2D6F7E, beige #EDE9E3, aqua #4A9BAD
- Generic presets: Ocean Depth, Forest Sage, Slate Ember, Violet Mist

## Technical Context

- Static browser-only tool. No backend, no login, no API calls.
- Mermaid.js ^11.14.0 via npm. Do not fork mermaid.
- React + TypeScript + Vite + Tailwind CSS.
- Deploy target: GitHub Pages (static build output).
- The app lives at: artifacts/mermaid-theme-builder/
