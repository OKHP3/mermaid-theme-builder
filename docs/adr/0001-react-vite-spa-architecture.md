# ADR-0001: React + Vite client-only SPA architecture

## Status

Accepted

## Date

2026-01-01

## Context

The Mermaid Theme Builder is a developer tool for creating, previewing, and
exporting Mermaid diagram themes. It needs to:

- Render live Mermaid diagram previews directly in the browser (Mermaid.js is
  a browser-only renderer; it manipulates the DOM).
- Provide a code editor with syntax highlighting.
- Export theme definitions as CSS or JavaScript configuration strings.
- Deploy to GitHub Pages as a static artifact with no server required.
- Support fast local development with hot module replacement.

The tool has no user accounts, no database, and no server-side business logic.
All state lives in `localStorage` or in-memory during a session.

## Decision Drivers

- **Mermaid.js is browser-only** — rendering must happen client-side regardless
  of the framework choice, eliminating any benefit from SSR for the core feature.
- **Static deployment** — GitHub Pages and Replit artifact hosting both serve
  static files; a server runtime would add operational cost with no user benefit.
- **Developer-tool audience** — users expect fast, responsive UI; React's
  component model maps well to the palette editor, tab navigation, and
  live-preview panel structure.
- **Team familiarity** — React + Vite is the established pattern across all
  OverKill Hill P³ web application repos.

## Considered Options

### Option 1: React + Vite (chosen)

- **Pros**: Fast dev server, first-class TypeScript, tree-shaking, static output,
  excellent ecosystem for component-driven UI, consistent with sibling repos.
- **Cons**: Bundle includes React runtime; no SSR (not needed).

### Option 2: Next.js

- **Pros**: SSR, file-based routing, image optimization.
- **Cons**: Requires a Node.js server for SSR features; adds operational
  complexity for a tool that is entirely client-side; GitHub Pages deployment
  requires an `export` step with limitations.

### Option 3: Svelte + SvelteKit

- **Pros**: Smaller runtime, reactive primitives.
- **Cons**: Different paradigm from sibling repos; smaller ecosystem for the
  specific component patterns needed.

## Decision

Use **React 19 + Vite** as the client-only SPA framework. No SSR, no server
runtime, no API routes. All Mermaid rendering, theme editing, and export logic
runs entirely in the browser.

## Rationale

The browser-only constraint from Mermaid.js is decisive. SSR frameworks add
complexity without enabling any feature that client-only cannot provide.
Vite's fast HMR and Rollup-based production build satisfy both the development
experience and the static-deployment requirement.

## Consequences

### Positive

- Zero server infrastructure to operate or secure.
- Deploy to any static host (GitHub Pages, Replit, CDN).
- Fast HMR development cycle.
- Full TypeScript support without configuration friction.

### Negative

- Bundle must include Mermaid.js (~2 MB minified), making initial load heavier
  than a server-rendered equivalent.
- No progressive enhancement; JavaScript is required.

### Mitigations

- Mermaid is lazy-initialized after the first render to avoid blocking the UI.
- The app is a developer tool, so the audience expects JavaScript to be enabled.

## Related decisions

- ADR-0002: Tailwind CSS v4 (styling approach for this SPA)
- ADR-0003: Mermaid.js browser-side rendering (rendering contract)
