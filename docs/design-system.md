# OKH Forge UI System — v0.1.0

Design language shared across OverKill Hill P³ companion apps.
Token definitions live in `src/styles/forge-tokens.css`; utility classes live in `src/index.css`.

---

## Governance rules

| Rule | Detail |
|---|---|
| **Raw primitives are fixed** | `--okh-forge-*` hex values never change in component scope or dark mode. If a value feels wrong, propose a token change — don't override locally. |
| **Semantic tokens absorb variation** | Light/dark shifts belong in `--background`, `--foreground`, `--primary`, etc. — not in raw primitives. |
| **No hardcoded OKH hex in TSX** | Components must not reference `#1c3a34`, `#c46a2c`, `#e8dcc8`, etc. directly. Use a forge utility class or a CSS variable. |
| **Dynamic data-driven styles are the only exception** | User-selected Mermaid palette colors (ColorSwatch, ApplyTab preview swatches, ClassBrowser class defs) may use `style={{ backgroundColor: value }}` because the value is runtime data — not a design token. |

---

## Files

| File | Role |
|---|---|
| `src/styles/forge-tokens.css` | **Token source** — Sections A–D: raw primitives, header/footer surface tokens, semantic HSL tokens, Tailwind `@theme` bridge |
| `src/index.css` | **Utility classes** — Sections E–H: base layer, forge utility classes, utilities, print |
| `src/App.tsx` | Uses `forge-shell`, `forge-header`, `forge-footer`, `forge-mobile-nav` and all header/footer/nav text classes |
| `src/components/MermaidPreview.tsx` | Uses `forge-preview-controls`, `forge-preview-btn`, `forge-preview-counter` |
| `src/pages/tabs/*.tsx` | Use `forge-eyebrow`, `forge-code-panel` |

---

## Token sections

| Section | File | Contents |
|---|---|---|
| A — Raw palette tokens | `forge-tokens.css` | `--okh-forge-*` hex values + header/footer surface tokens; fixed |
| B — Semantic tokens (light) | `forge-tokens.css` | HSL values for Tailwind utilities |
| C — Semantic tokens (dark) | `forge-tokens.css` | `.dark` overrides |
| D — Tailwind @theme bridge | `forge-tokens.css` | Maps CSS vars → Tailwind color/font/radius |
| E — Base layer | `index.css` | Resets, grid texture, typography, focus ring |
| F — Forge utility classes | `index.css` | Named primitives (see tables below) |
| G — Utility layer | `index.css` | Elevation helpers, misc |
| H — Print stylesheet | `index.css` | Hides chrome, shows diagram only |

---

## Canonical utility classes

### Structural layout

| Class | Usage |
|---|---|
| `.forge-shell` | Outermost `<div>` — `h-dvh flex flex-col overflow-hidden` |
| `.forge-header` | Always-dark top bar (`<header>`) |
| `.forge-main` | Scrollable content area (`<main>`) |
| `.forge-footer` | Always-dark desktop footer rail (`<footer>`) |
| `.forge-mobile-nav` | Always-dark bottom nav for mobile (`<nav>`) |

### Header text elements

| Class | Usage |
|---|---|
| `.forge-header-title` | App name `<h1>` — 17 px, warm cream `#e8dcc8` |
| `.forge-header-slug` | Monospace slug `<code>` badge — hidden on mobile, inline ≥ 640 px |
| `.forge-header-subtitle` | Subtitle `<p>` — 11 px muted, hidden on mobile, block ≥ 640 px |
| `.forge-header-badge` | Brand label (`OKHP³`) — rust-orange, bold uppercase |
| `.forge-header-sep` | Separator `·` — very muted white |
| `.forge-header-meta` | Version / mono metadata — faint mono text |
| `.forge-header-icon-btn` | Icon button (theme toggle) — bordered, hover lifts |

### Mobile nav items

| Class | Usage |
|---|---|
| `.forge-mobile-nav-item` | Each tab button in the mobile bottom nav |
| `.forge-mobile-nav-item-active` | Active state modifier — rust-orange |

### Content surfaces

| Class | Usage |
|---|---|
| `.forge-card` | Paper-toned card surface |
| `.forge-card-title` | Card section heading (13 px, weight 600) |
| `.forge-eyebrow` | 11 px uppercase section label |
| `.forge-status-pill` | Inline status badge (pill shape, border) |

### Tab navigation

| Class | Usage |
|---|---|
| `.forge-tabs` | Tab list container (adds bottom border, card bg) |
| `.forge-tab` | Individual tab button (base state) |
| `.forge-tab-active` | Active modifier — add alongside `.forge-tab` |

### Code / workbench

| Class | Usage |
|---|---|
| `.forge-code-panel` | Dark forge workbench surface (`#0f1f1c` bg, `#d4c9b5` text) |

### Preview panel controls

| Class | Usage |
|---|---|
| `.forge-preview-controls` | Zoom/reset bar overlay — dark workbench surface with blur |
| `.forge-preview-btn` | Icon button inside the controls bar |
| `.forge-preview-counter` | Zoom percentage readout — mono, muted |

### Footer text elements

| Class | Usage |
|---|---|
| `.forge-footer-meta` | Footer wrapper text — 10 px muted |
| `.forge-footer-slug` | Monospace repo slug — slightly brighter |
| `.forge-footer-brand` | Brand name (`OverKill Hill P³`) — rust-orange |
| `.forge-footer-link` | Footer link — muted, hover brightens |

### Action buttons

| Class | Action color | Shape |
|---|---|---|
| `.forge-btn-primary` | Solid rust-orange | Filled |
| `.forge-btn-outline` | Warm paper bg | Outlined |
| `.forge-btn-accent` | Rust tint | Semi-transparent |

---

## Raw palette tokens (read-only)

```css
--okh-forge-bg:       #f0ebe5   /* warm paper page background */
--okh-forge-paper:    #f6f2ee   /* card surface */
--okh-forge-ink:      #0f172a   /* primary text */
--okh-forge-teal:     #1c3a34   /* header / always-dark surfaces */
--okh-forge-rust:     #c46a2c   /* primary action */
--okh-forge-amber:    #e6a03c   /* secondary accent */
--okh-forge-code-bg:  #0f1f1c   /* code panel background */
--okh-forge-code-fg:  #d4c9b5   /* code panel text */

/* Header-specific cream tones (warm, not generic gray) */
--forge-header-title: #e8dcc8   /* warm cream app title */
--forge-header-slug:  #b8aa96   /* muted warm cream slug/badge */
```

These are **fixed** — they do not change in dark mode. Do not override them in component scope.

---

## Semantic tokens (safe to customize per-app)

These follow Tailwind CSS v4 convention and are consumed via `hsl(var(--token))`:

```
--background       --foreground       --border
--card             --card-foreground  --card-border
--primary          --primary-foreground
--muted            --muted-foreground
--accent           --accent-foreground
--ring
```

Customize these to shift a companion app's light/dark behavior without touching raw palette tokens.

---

## Typography

| Role | Font | Token |
|---|---|---|
| Display heading (`h1`) | Alfa Slab One | `--app-font-display` |
| UI body | DM Sans | `--app-font-sans` |
| Code / mono | JetBrains Mono | `--app-font-mono` |

---

## Keeping a sibling app aligned

1. Copy `src/styles/forge-tokens.css` into the sibling app's global CSS.
2. Layer your own utility classes on top in a second file.
3. Override only the **semantic tokens** (Sections B/C) for app-specific color shifts.
4. Do not change `--okh-forge-*` tokens — they are the shared identity.
5. Use the canonical class names from the tables above; do not invent one-off variants.
6. Header and footer must remain always-dark (`var(--forge-header-bg)` / `var(--forge-footer-bg)`).
7. Blueprint grid must use the same size and opacity: 28 px, `--forge-grid-light` / `--forge-grid-dark`.
