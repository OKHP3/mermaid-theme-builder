# ADR-0003: Mermaid.js browser-side rendering

## Status

Accepted

## Date

2026-01-01

## Context

The app must render live Mermaid diagram previews whenever the user changes
theme values, switches diagram types, or edits diagram syntax. The rendering
must reflect the exact CSS custom property values the user has configured,
which means it must run in the same browser context as the theme.

Mermaid.js performs DOM manipulation and SVG insertion directly in the browser.
The library's rendering pipeline reads the active CSS variables from the
document at render time, which is exactly the behavior this app needs to show
live theme previews.

## Decision Drivers

- **Live preview requirement** — theme changes must be reflected immediately
  without a round-trip to a server.
- **CSS variable resolution** — only the browser's rendering engine can resolve
  CSS custom properties against the live document state.
- **Mermaid.js is browser-only** — the library has no official server-side
  rendering path that captures computed CSS variable values.
- **No server infrastructure** — the project deploys to static hosts.

## Considered Options

### Option 1: Mermaid.js in-browser (chosen)

- **Pros**: Live CSS variable resolution, no server required, exact preview
  of what users will get in their own Mermaid deployments.
- **Cons**: Heavy bundle (~2 MB); initialization takes ~300 ms on first render;
  some diagram types (ZenUML) load additional modules asynchronously.

### Option 2: Server-side pre-rendering with mermaid-js/mermaid CLI

- **Pros**: SVG generated outside the browser, no client bundle size impact.
- **Cons**: Cannot resolve live CSS custom properties from the user's active
  theme; requires a server; adds deployment complexity and latency.

### Option 3: PNG/SVG screenshot via Puppeteer

- **Pros**: Pixel-perfect capture of rendered output.
- **Cons**: Server and browser automation infrastructure; too slow for live
  preview; cannot respond to sub-second theme changes.

## Decision

Use **Mermaid.js running directly in the browser** via `import('mermaid')`.
The module is initialized lazily on first preview render to avoid blocking the
initial UI paint. ZenUML is registered as a separate module via
`@mermaid-js/mermaid-zenuml`.

The Mermaid version is pinned exactly in the workspace catalog and in
`pnpm-workspace.yaml`. Every upgrade requires:

1. Updating `MERMAID_VERSION_VERIFIED` in the source.
2. Running the capability registry update script.
3. Verifying the E2E test suite passes.

## Consequences

### Positive

- Live CSS variable resolution — theme changes reflect in real time.
- No server infrastructure.
- Users see an accurate preview of how their theme will look in any Mermaid
  deployment.

### Negative

- ~2 MB Mermaid bundle is included in every page load.
- Style leak risk: Mermaid injects `<style>` elements into `document.head`
  as it renders; the app monitors and deduplicates these.
- Diagram initialization is async; the UI shows a loading state during first render.

### Risks and mitigations

- **Style leak**: Monitored by E2E tests that count `document.head` style
  elements across diagram switches.
- **Version compatibility**: Capability registry and integration tests
  must be updated on every Mermaid upgrade.

## Related decisions

- ADR-0001: React + Vite SPA (client-only constraint that motivates this choice)
