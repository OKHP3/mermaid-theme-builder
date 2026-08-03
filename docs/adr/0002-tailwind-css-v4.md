# ADR-0002: Tailwind CSS v4

## Status

Accepted

## Date

2026-01-01

## Context

The project needs a styling approach that:

- Keeps component styles co-located with markup (reduces context-switching).
- Supports theming via CSS custom properties (required for live theme preview).
- Works cleanly with Vite's build pipeline.
- Produces small production CSS (only used utilities are emitted).

Tailwind v3 was the widely-adopted version when this project started.
Tailwind v4 entered release candidate and then stable status during development.

## Decision Drivers

- **CSS custom property integration** — the app's live theme preview system
  injects CSS variables at runtime; Tailwind v4's `@theme` directive and
  CSS variable-first design align naturally with this approach.
- **Vite plugin** — `@tailwindcss/vite` v4 is a first-class Vite plugin with
  no PostCSS configuration required, simplifying the build.
- **No config file** — v4 moves configuration into `index.css` via `@theme`,
  eliminating `tailwind.config.js` and reducing root clutter.
- **Early adoption risk** — accepted because the project is a developer tool
  for an audience that expects and tolerates cutting-edge dependencies.

## Considered Options

### Option 1: Tailwind CSS v4 (chosen)

- **Pros**: CSS variable-first theming, Vite plugin, no separate config file,
  Lightning CSS transform, supports `@apply` and `@theme` natively.
- **Cons**: Fewer community examples at adoption time; some v3 utilities renamed
  or removed; requires careful review of changelog before upgrades.

### Option 2: Tailwind CSS v3

- **Pros**: Mature, extensive community examples, well-documented.
- **Cons**: PostCSS pipeline required; CSS variable integration less seamless;
  would require a planned migration to v4 later.

### Option 3: CSS Modules

- **Pros**: Scoped styles, no utility-class proliferation.
- **Cons**: More verbose; co-location of logic and style requires separate files
  per component; no design-system constraint utilities.

## Decision

Use **Tailwind CSS v4** with `@tailwindcss/vite`. Version is pinned exactly
in the workspace catalog. CSS tokens are declared in `src/index.css` using
`@theme` and in `src/styles/forge-tokens.css` (synced from the upstream
OverKill Hill brand source).

## Consequences

### Positive

- CSS variables declared in `@theme` are automatically available as Tailwind
  utility classes.
- No `tailwind.config.js` at the repo root.
- Fast Vite HMR for style changes via the native Vite plugin.

### Negative

- v4 API changes break v3 patterns; team must consult the v4 migration guide
  when upgrading from external resources.
- `forge-tokens.css` sync must be tested against v4 compatibility after each
  upstream update.

## Related decisions

- ADR-0001: React + Vite SPA (build pipeline that hosts Tailwind v4)
