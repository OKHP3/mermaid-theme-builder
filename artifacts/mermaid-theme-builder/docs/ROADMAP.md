# Roadmap

## v0.1.0 — Foundation ✅ Complete

**Status:** Shipped

- Static React + Vite + Tailwind CSS v4 app, no backend
- 15 diagram family auto-detection
- 7 built-in palettes (3 OKHP3 brand + 4 utility)
- Live side-by-side preview (Original / Themed)
- Three export formats: Styled Code, Markdown Bootstrap, Prompt Scaffold
- Render-safety warnings
- Two-way live color editor
- Attribution system (metadata comments + badge)
- Custom theme naming
- Extended palette schema with brand metadata
- Documentation: README, BRAND_PRESETS, THEME_METADATA, ATTRIBUTION

---

## v0.2.0 — Examples + Persistence

**Status:** In progress

**Goals:** Make the app useful from first open. Add example library. Make custom themes survive a browser reload.

### Examples (shipped in v0.2-alpha)
- [x] Brand-matched example library (flowchart + sequence per OKHP3 palette)
- [x] "OverKill Rube Goldberg Showcase" — advanced stress-test flowchart with ELK layout, semantic classDefs, clickable nodes, and attribution
- [x] YAML frontmatter detection and strip-on-export
- [x] Showcase compatibility warning in UI

### Palette / Theme
- [ ] localStorage persistence for custom color edits and custom theme names
- [ ] Export custom palette as a JSON file (`download .json`)
- [ ] Import palette from JSON file

### Export
- [ ] Preview all three export formats before copying (read-only code pane below the diagram)
- [ ] Download as `.md` file (Markdown Bootstrap)
- [ ] Download as `.txt` file (Prompt Scaffold)

### UI
- [ ] Dark/light mode toggle (independent of diagram theme)
- [ ] Keyboard shortcut: `Ctrl+Shift+C` → copy Styled Code
- [ ] Diagram family override (manual selector when auto-detect is wrong)

### Palette
- [ ] User-created palettes — save, rename, delete, reorder
- [ ] Reset individual color (single swatch) without resetting all

---

## v0.3.0 — Palette Library

**Status:** Planned

**Goals:** Grow the community palette library without adding backend.

### Palette
- [ ] Share palette as a URL-encoded link (query string or hash fragment)
- [ ] Import palette from URL
- [ ] 3–5 additional community palettes (not brand-locked)

### Export
- [ ] Export all palettes as a JSON bundle
- [ ] Generate a static CSS custom-properties file (`:root { --mermaid-primary: ...; }`)

---

## v0.4.0 — Diagram Guidance

**Status:** Planned

**Goals:** Make the Prompt Scaffold smarter for different diagram families.

### Prompt Scaffold
- [ ] Family-specific scaffold templates (flowchart, sequence, class, ER)
- [ ] Configurable scaffold sections (select which sections to include)
- [ ] Option to generate multiple diagram type examples in one scaffold

### Editor
- [ ] Syntax-highlighted code editor (CodeMirror or Monaco micro-bundle)
- [ ] Paste-and-auto-switch to diagram family if auto-detected

---

## v1.0.0 — Public Release

**Status:** Planned

**Goals:** Polish, publish, and make the site properly discoverable.

- [ ] GitHub Pages deployment via CI (auto-publish on `main` merge)
- [ ] Proper `og:image` and social preview
- [ ] Analytics (privacy-respecting, no cookies)
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Keyboard-navigable palette picker
- [ ] `robots.txt` and sitemap

---

## Permanently out of scope

These will never be added regardless of version:

- Backend, server-side processing, or API calls
- User accounts or login
- Cloud storage for user diagrams
- AI API calls or LLM integration
- Payment or subscriptions
- File upload (beyond JSON palette import in v0.2)
- Fork of Mermaid.js source code

---

## Requests and suggestions

Open an issue at [github.com/OKHP3/mermaid-theme-builder](https://github.com/OKHP3/mermaid-theme-builder) or reach out via [overkillhill.com](https://overkillhill.com).
