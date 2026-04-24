# Brand Presets — OKHP3 Ecosystem

Mermaid Theme Builder ships with three first-class brand presets derived from the OverKill Hill P³ design system. All color values are sourced directly from the `--mermaid-*` CSS custom properties and brand color tokens in the publicly available [shared theme.css](https://github.com/OKHP3/OverKill-Hill/blob/main/assets/css/theme.css).

---

## Shared Brand Tokens (OKH P³ Design System)

All three brand presets draw from a common palette of design tokens:

| Token | Value | Role |
|---|---|---|
| `--okh-teal` | `#1c3a34` | Deep forest teal |
| `--okh-olive` | `#676a2c` | Earthy olive green |
| `--okh-ochre` | `#a06e28` | Warm golden ochre |
| `--okh-rust` | `#5b3a27` | Dark rust/espresso brown |
| `--okh-espresso` | `#2a2320` | Deepest espresso brown |
| `--okh-orange` | `#c46a2c` | Rust-orange — primary accent |
| `--okh-amber` | `#e6a03c` | Warm amber — highlight |
| `--okh-paper` | `#f6f2ee` | Warm cream/paper |
| `--okh-gray` | `#6b7280` | Muted gray |

---

## OverKill Hill P³

**ID:** `overkill-hill`  
**Site:** [overkillhill.com](https://overkillhill.com)  
**CSS source:** [theme.css on GitHub](https://github.com/OKHP3/OverKill-Hill/blob/main/assets/css/theme.css)

**Design tone:** Precise, structured, technical, executive-readable, dark/serious

**Theme intent:** Technical, architectural, systems, AI tooling, strategy, and executive-facing diagrams

### Color specification

| Role | Key | Value |
|---|---|---|
| Primary (nodes) | `primaryColor` | `#111827` |
| Primary text | `primaryTextColor` | `#e5e7eb` |
| Primary border | `primaryBorderColor` | `#c46a2c` |
| Lines & arrows | `lineColor` | `#c46a2c` |
| Secondary nodes | `secondaryColor` | `#181f26` |
| Tertiary nodes | `tertiaryColor` | `#1c3a34` |
| Background | `background` | `#0d1117` |
| Main background | `mainBkg` | `#111827` |
| Node border | `nodeBorder` | `#c46a2c` |
| Cluster background | `clusterBkg` | `#0d1117` |
| Title color | `titleColor` | `#e6a03c` |
| Edge label bg | `edgeLabelBackground` | `#181f26` |
| Font family | `fontFamily` | `DM Sans, system-ui, sans-serif` |

### Use for
- Cloud architecture diagrams
- AI agent and orchestration flows
- API and system design maps
- Strategy and roadmap diagrams
- Executive-facing technical presentations

### Do not use for
- Consumer-facing or casual content
- Playful or lightweight explainers

---

## AskJamie

**ID:** `askjamie`  
**Site:** [askjamie.bot](https://askjamie.bot)  
**CSS source:** [theme.css on GitHub](https://github.com/OKHP3/AskJamie/blob/main/assets/css/theme.css)

**Design tone:** Approachable, helpful, friendly AI helpdesk, clear, accessible, trustworthy

**Theme intent:** Support flows, helpdesk diagrams, explainers, user-assistance workflows, and friendly AI-generated step-by-step guides

### Color specification

| Role | Key | Value | Source token |
|---|---|---|---|
| Primary (nodes) | `primaryColor` | `#5b3a27` | `--okh-rust` |
| Primary text | `primaryTextColor` | `#f6f2ee` | `--okh-paper` |
| Primary border | `primaryBorderColor` | `#c46a2c` | `--okh-orange` |
| Lines & arrows | `lineColor` | `#a06e28` | `--okh-ochre` |
| Secondary nodes | `secondaryColor` | `#676a2c` | `--okh-olive` |
| Tertiary nodes | `tertiaryColor` | `#e6a03c` | `--okh-amber` |
| Background | `background` | `#f6f2ee` | `--okh-paper` |
| Main background | `mainBkg` | `#eff2f5` | light mode bg |
| Node border | `nodeBorder` | `#a06e28` | `--okh-ochre` |
| Cluster background | `clusterBkg` | `#f0ebe5` | soft paper |
| Title color | `titleColor` | `#2a2320` | `--okh-espresso` |
| Edge label bg | `edgeLabelBackground` | `#f6f2ee` | `--okh-paper` |
| Font family | `fontFamily` | `DM Sans, system-ui, sans-serif` | brand font |

### Use for
- Step-by-step user guidance diagrams
- Helpdesk and support process flows
- AI assistant conversation flows
- Onboarding and "how it works" content
- Non-technical explainer diagrams

### Do not use for
- Deep technical architecture (use OverKill Hill P³ instead)
- Executive strategy decks

---

## Glee-fully

**ID:** `glee-fully`  
**Site:** [glee-fully.tools](https://glee-fully.tools)  
**CSS source:** [theme.css on GitHub](https://github.com/OKHP3/Glee-fullyTools/blob/main/assets/css/theme.css)

**Design tone:** Warm, playful, approachable, light, friendly, non-technical

**Theme intent:** Life-organization, personal productivity, family-friendly, consumer-facing, and approachable explainer diagrams

### Color specification

| Role | Key | Value | Derivation |
|---|---|---|---|
| Primary (nodes) | `primaryColor` | `#1c3a34` | `--okh-teal` |
| Primary text | `primaryTextColor` | `#f6f2ee` | `--okh-paper` |
| Primary border | `primaryBorderColor` | `#2d6a4f` | medium teal-green |
| Lines & arrows | `lineColor` | `#e6a03c` | `--okh-amber` (warm/playful) |
| Secondary nodes | `secondaryColor` | `#52b788` | soft mint green |
| Tertiary nodes | `tertiaryColor` | `#d8f3e6` | light teal-green |
| Background | `background` | `#f4fdf7` | very light mint |
| Main background | `mainBkg` | `#d8f3e6` | soft teal |
| Node border | `nodeBorder` | `#2d6a4f` | medium green |
| Cluster background | `clusterBkg` | `#e8f7ef` | light teal |
| Title color | `titleColor` | `#1c3a34` | `--okh-teal` |
| Edge label bg | `edgeLabelBackground` | `#f4fdf7` | very light mint |
| Font family | `fontFamily` | `DM Sans, system-ui, sans-serif` | brand font |

### Use for
- Personal task and productivity diagrams
- Family-friendly process flows
- Approachable decision trees
- Consumer-facing "how it works" diagrams
- Any content where warmth and approachability matter more than technical precision

### Do not use for
- Technical or enterprise-facing content

---

## Adding additional brand presets

To add a new palette, extend the `BUILTIN_PALETTES` array in `src/lib/palettes.ts`. Set `isBrandPreset: true` and `brandFamily: "okhp3"` to display it in the Brand Presets section of the UI. All other fields are documented in [THEME_METADATA.md](THEME_METADATA.md).
