# Threat Model

## Project Overview

Mermaid Theme Builder is a static React/Vite application that lets users paste Mermaid diagram text, apply theme variables, preview the rendered output, and export themed Mermaid, Markdown, SVG, PNG, CSS, and JSON artifacts. There is no backend, database, authentication, or server-side API in production scope. The primary production risk is therefore client-side: untrusted diagram or import data reaching browser execution and persistence surfaces.

## Assets

- **Browser execution context** — the app runs entirely in the user’s browser. If untrusted content can execute script in this origin, an attacker can manipulate the UI, tamper with downloads, read app state, and potentially persist via service worker or storage.
- **User-supplied Mermaid diagrams** — diagram text is intentionally pasted from external sources and is therefore untrusted by default. It must not gain script execution or unsafe DOM capabilities when previewed or exported.
- **Exported artifacts** — generated SVG, PNG, Markdown, Mermaid, CSS, and JSON files may be shared or opened elsewhere. The app must not turn untrusted input into active content that executes when exported artifacts are viewed.
- **Local persisted state** — localStorage stores diagram text, palettes, and preferences. Compromise of this origin could leak or tamper with saved work and create persistent malicious state for future visits.

## Trust Boundaries

- **User input to renderer boundary** — pasted Mermaid text crosses from an untrusted textarea into Mermaid parsing/rendering and then into DOM insertion and export generation.
- **Imported/share data to app state boundary** — palette JSON files and `?theme=` share tokens cross from untrusted external input into local application state and UI rendering.
- **App origin to browser persistence boundary** — rendered state crosses into localStorage and the service-worker-controlled cache. Any client-side code execution issue can become persistent within this origin.
- **App to external site boundary** — exported/opened diagrams may be sent to `mermaid.live`; only explicitly user-triggered navigation should cross this boundary.
- **Production vs dev-only boundary** — `examples/`, documentation, standards, and `artifacts/mockup-sandbox/` are normally out of production scope unless code paths prove they are bundled or reachable in the static build.

## Scan Anchors

- Production entry points: `index.html`, `src/main.tsx`, `src/App.tsx`
- Highest-risk code areas: `src/components/MermaidPreview.tsx`, `src/lib/exporters.ts`, `src/lib/persistence.ts`, `src/pages/tabs/ApplyTab.tsx`, `src/pages/tabs/ComposeTab.tsx`
- Public surface: entire app is public client-side UI; there are no authenticated or admin-only surfaces
- Dev-only areas usually ignorable: `examples/`, `docs/`, `standards/`, `artifacts/mockup-sandbox/`

## Threat Categories

### Tampering

Untrusted Mermaid text, imported palette JSON, and share-token payloads can all influence what the app renders, stores, and exports. The app must treat these inputs as hostile and ensure they cannot alter browser state outside the intended theming features, inject unsafe diagram directives, or create active exported content beyond what the user explicitly requested.

### Information Disclosure

Because the app is local-only, disclosure risk is primarily browser-origin compromise rather than server data leakage. The app must ensure untrusted diagram content cannot execute script that reads localStorage, rendered diagram contents, clipboard-adjacent UI state, or other same-origin data.

### Denial of Service

Mermaid parsing and rendering are CPU- and memory-intensive compared with the rest of the app. The app must avoid giving untrusted input a path to lock up the UI, crash the renderer repeatedly, or create persistent broken state through storage or the service worker.

### Elevation of Privilege

In this project, elevation of privilege means turning untrusted diagram or import data into arbitrary same-origin script execution or active content. All Mermaid rendering and export paths must prevent attacker-controlled input from reaching executable DOM or script-capable SVG/HTML contexts, and safer Mermaid modes such as strict sanitization or sandboxing are required whenever externally sourced diagrams are previewed.
