# OKH Forge UI System — v0.1.0

Design language shared across OverKill Hill P³ companion apps.
The primary home for this system is `src/index.css` in the Mermaid Theme Builder.

---

## What it is

A thin, opinionated CSS layer that gives all OKH P³ tools a recognisably consistent look without imposing a component framework. It lives entirely in CSS custom properties and plain class names — no runtime JS, no Tailwind plugin.

The visual language:

| Quality | Description |
|---|---|
| Warm paper | `#f0ebe5` page background, `#f6f2ee` cards |
| Always-dark header | `#1c3a34` teal — does not invert in dark mode |
| Rust-orange primary | `#c46a2c` — all interactive focus / actions |
| Dark forge panels | `#0f1f1c` bg, `#d4c9b5` text — code / workbench surfaces |
| Blueprint grid | 28 px crosshatch, 2.8 % opacity in light, 1.8 % in dark |
| Serious utility | Low-gloss, high-clarity — "productized prototype" not "AI dashboard" |

---

## Files

| File | Role |
|---|---|
| `src/index.css` | **Primary home** — all tokens and utility classes |
| `src/App.tsx` | Uses `forge-header`, `forge-footer`, `forge-mobile-nav`, `forge-shell` |
| `src/pages/tabs/*.tsx` | Use `forge-eyebrow`, `forge-code-panel` |

---

## Token sections in `src/index.css`

| Section | Contents |
|---|---|
| A — Raw palette tokens | `--okh-forge-*` hex values; fixed across modes |
| B — Tailwind @theme bridge | Maps CSS vars into Tailwind color utilities |
| C — Semantic tokens (light) | HSL values consumed by Tailwind utilities |
| D — Semantic tokens (dark) | `.dark` overrides |
| E — Base layer | Resets, grid texture, typography, focus ring |
| F — Forge utility classes | Named primitives (see table below) |
| G — Utility layer | Elevation helpers, misc |
| H — Print stylesheet | Hides chrome, shows diagram only |

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
| `.forge-code-panel` | Dark green surface (`#0f1f1c` bg, `#d4c9b5` text) |

### Action buttons

| Class | Action colour | Shape |
|---|---|---|
| `.forge-btn-primary` | Solid rust-orange | Filled |
| `.forge-btn-outline` | Warm paper bg | Outlined |
| `.forge-btn-accent` | Rust tint | Semi-transparent |

---

## Raw palette tokens (safe to read)

```css
--okh-forge-bg:       #f0ebe5   /* warm paper page background */
--okh-forge-paper:    #f6f2ee   /* card surface */
--okh-forge-ink:      #0f172a   /* primary text */
--okh-forge-teal:     #1c3a34   /* header / always-dark surfaces */
--okh-forge-rust:     #c46a2c   /* primary action */
--okh-forge-amber:    #e6a03c   /* secondary accent */
--okh-forge-code-bg:  #0f1f1c   /* code panel background */
--okh-forge-code-fg:  #d4c9b5   /* code panel text */
```

These are **fixed** — they do not change in dark mode. Do not override them inside component scope.

---

## Semantic tokens (safe to customise per-app)

These follow the Tailwind CSS v4 semantic token convention and are used via `hsl(var(--token))`:

```
--background       --foreground       --border
--card             --card-foreground  --card-border
--primary          --primary-foreground
--muted            --muted-foreground
--accent           --accent-foreground
--ring
```

Customise these to shift a companion app's light/dark behaviour without touching raw palette tokens.

---

## Typography

| Role | Font |
|---|---|
| Display heading (`h1`) | Alfa Slab One |
| UI body | DM Sans |
| Code / mono | JetBrains Mono |

Set via `--app-font-sans`, `--app-font-serif`, `--app-font-mono` in `:root`.

---

## Keeping a sibling app aligned

1. Copy sections A–F of `src/index.css` into the sibling app's global CSS.
2. Override only the semantic tokens (Section C / D) for any app-specific colour shifts.
3. Do not change the raw `--okh-forge-*` tokens — they are the shared identity.
4. Use the canonical class names from the table above; do not invent one-off variants.
5. Header and footer must remain always-dark (`var(--forge-header-bg)` / `var(--forge-footer-bg)`).
6. Blueprint grid must use the same size and opacity: 28 px, `--forge-grid-light` / `--forge-grid-dark`.
