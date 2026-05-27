# Prototype-to-Product Retrospective

**Project:** Mermaid Theme Builder  
**Analysis date:** 2026-05-21  
**Analysis depth:** EXHAUSTIVE  
**Roadmap horizon:** 90 days  
**Analyst:** Replit Agent (Build mode)  
**Sources:** Repl codebase · git log (131 commits, 2026-04-18 to 2026-05-21) · GitHub issues/PRs · GitHub Actions · AGENTS.md · docs/ · replit.md · ROADMAP.md · PRODUCT_BRIEF.md · deployment URL verification

---

## Executive Summary

### What this is
A fully static, browser-only visual governance utility that applies consistent brand themes to Mermaid diagram code. A personal OKHP3 project by Jamie Hill. Not a commercial product.

### The problem it solves
AI assistants generate syntactically valid Mermaid diagrams but almost never with correct, consistent styling. The `%%{init}%%` theme directive is underused, poorly documented, and frequently hallucinated by LLMs. This tool provides a repeatable path: paste AI-generated Mermaid → apply brand theme → export themed code or a "Prompt Scaffold" that teaches the LLM to stay on-brand in future sessions.

### What has been built (verified)
- Full paste → detect → theme → preview → export pipeline
- 27-family diagram capability registry with honest support levels
- 7 built-in palettes (3 OKHP3 brand + 4 utility)
- Two-way live color editor with localStorage persistence
- Three export formats (Styled Code, Markdown Bootstrap, Prompt Scaffold)
- Extract mode (pull theme from existing Mermaid code)
- Multi-diagram splitting, diff view, family overrides
- Pan/zoom on all diagram previews
- GitHub Pages CI/CD with custom domain
- OKH Forge UI System v0.1.0 (design token layer)
- Shareable URL encoding
- PWA manifest + service worker
- MIT license, Ko-fi funding, 11-document documentation suite
- 81-step manual release checklist

### Why it has crossed from prototype into product territory
- **Versioned and shipped:** v0.1 through v0.5 in 24 days with structured roadmap
- **Documented non-goals:** AGENTS.md architectural constraints, "permanently out of scope" list — product decisions, not prototype indifference
- **Public deployment:** live at two URLs with CI/CD, OG image, robots.txt, sitemap, service worker
- **Brand governance:** AGENTS.md brand firewall, `MERMAID_VERSION_VERIFIED` constant, capability registry, RELEASE_CHECKLIST
- **Design system:** OKH Forge UI System explicitly named, versioned, and documented
- **Funding link:** Ko-fi — signals intent to be a maintained public artifact

### Strongest product direction
Teaching LLMs to maintain visual consistency in Mermaid output. The Prompt Scaffold export is the unique differentiator no other tool offers. Everything else (themes, preview, export) supports this core value.

### Next productization step
Create v0.5.0 GitHub release tag. Complete user palette CRUD. Add Playwright smoke tests. Update ROADMAP.md. (Items 1, 3, 5 from this list are already done as of this retrospective.)

### Top 3 risks

| Risk | Description |
|---|---|
| No automated tests | 81-step manual checklist is the only gate. A single bad merge can silently break the core pipeline. |
| Major-version dep drift | 5 open Dependabot PRs: TypeScript 5→6, Zod 3→4, lucide-react 0.5→1, Vite plugin 5→6 — any is a potential breaking change. |
| Roadmap/version mismatch | Was at v0.5.0 but ROADMAP.md showed v0.3/v0.4 as future. Resolved in this retrospective session. |

---

## Prototype Origin Reconstruction

### Original spark (Inferred)
April 18, 2026: blank repo scaffold. April 23: "feat: Mermaid Theme Builder v0.1" — a single-session prototype triggered by the frustration that AI-generated Mermaid diagrams never maintain brand styling. The Prompt Scaffold concept was stated in the founding PRODUCT_BRIEF.md written on April 25, within the first week.

### Evolution timeline

| Date | Event | Signal |
|---|---|---|
| 2026-04-18 | Initial commit | Repo created |
| 2026-04-23 | v0.1 prototype | Core paste→theme→export pipeline working |
| 2026-04-24 | Brand palettes added | OKH/AskJamie/GleeFully — personal brand entered the product |
| 2026-04-25 | Brand firewall, MIT license, 11-doc suite | AGENTS.md — product governance entered |
| 2026-04-25 | 27-family capability registry | Product deepened substantially beyond prototype |
| 2026-04-25 | Prompt Scaffold v2 (classDefs, YAML) | Core differentiator matured |
| 2026-04-27 | Dependabot + GitHub Pages CI/CD fixes | DevOps professionalization |
| 2026-05-05 | v0.5.0, URL routing, Reference tab | Feature scope: reference tool layer added |
| 2026-05-06 | OKH Forge UI System — design tokens | Design system formalized |
| 2026-05-12 | Pan/zoom preview; 5 CVE security fixes | UX matured; security governance active |

### Major inflection points
1. **April 24** — Adding OKHP3 brand palettes: generic tool → personal product
2. **April 25** — AGENTS.md + 11-document suite: prototype → governed product
3. **May 5** — Reference tab: workflow tool → platform with reference/discovery layer

### Current classification
**Working MVP / utility app at public product candidate boundary.** More than a proof-of-concept, more than a prototype. Not yet a public product (no GitHub release tags, no automated tests). Closest to: internal tool promoted to public utility.

---

## As-Built Capability Summary

### Core Theme Pipeline
| Capability | Status |
|---|---|
| Paste Mermaid → auto-detect family → themed output | Complete |
| Manual family override | Complete |
| 7 built-in palettes | Complete |
| Two-way live color editor | Complete |
| Live side-by-side preview (Original / Themed / Diff) | Complete |
| Three export formats with metadata | Complete |
| Extract theme from existing `%%{init}%%` | Complete |
| Render-safety warnings | Complete |
| Family-specific theming overlays | Complete |
| Pan/zoom on all previews | Complete |

### Palette Management
| Capability | Status |
|---|---|
| localStorage persistence | Complete |
| URL-encoded palette sharing | Complete (not prominently surfaced in UI) |
| Import/export palette as JSON | Complete |
| User palette CRUD (save/rename/delete/reorder) | Partial — planned v0.6 |

### Reference & Discovery
| Capability | Status |
|---|---|
| Searchable/filterable diagram capability registry (27 families) | Complete |
| 10 capability gap entries (honest "not supported") | Complete |
| Brand-matched example library (26 diagrams) | Complete |
| CSS class reference browser | Complete |

### Deployment & Quality
| Capability | Status |
|---|---|
| GitHub Pages CI/CD | Complete |
| Custom domain (overkillhill.com) | Complete |
| PWA manifest + service worker | Partial (not recently validated) |
| Automated tests | Not present — Critical debt (TD-01) |
| GitHub releases / version tags | Not present — planned |
| WCAG 2.1 AA audit | Not done — planned v0.7 |

---

## Product Directionality Statement

> Based on the current implementation, this Repl appears to be evolving from a personal Mermaid theming utility into a visual governance layer for AI-assisted diagram workflows, with the strongest gravity around the Prompt Scaffold + Capability Registry combination as a formalized "visual contract" for LLM-generated Mermaid output. The next logical productization move is releasing v0.5.0 as a tagged GitHub release and completing user palette CRUD (the only significant incomplete workflow), not adding a syntax editor or community features.

---

## Architecture Summary

**Stack:** React 19 + Vite 8 + TypeScript 5.9 + Tailwind CSS v4 + pnpm 10 + Node 24  
**Runtime:** Fully static SPA, zero runtime network calls, single production dependency (`mermaid 11.15.0`)  
**Build:** `pnpm run build` → `dist/public/` → GitHub Pages  
**Persistence:** localStorage + URL hash fragment (no backend, no database, by design)

**Key files by size:**
- `ApplyTab.tsx` — 1017 lines (decomposition candidate — TD-06)
- `mermaid-capabilities.ts` — 887 lines (manually maintained registry)
- `example-library.ts` — 747 lines (inlined .mmd content)
- `ComposeTab.tsx` — 710 lines
- `themeEngine.ts` — 631 lines (core logic)

**Architectural strengths:**
- Zero runtime network calls — clean hard boundary
- Single production dependency — minimal security surface
- `mermaid-capabilities.ts` as single source of truth for all diagram governance
- Family-specific overlay pattern in `familyTheming.ts` — extensible without touching core engine
- OKH Forge design system — portable across sibling OKHP3 apps

**Architectural smells:**
- `ApplyTab.tsx` approaching decomposition threshold (TD-06)
- Zero automated tests (TD-01)
- `SESSION_SECRET` in Replit secrets, unused (TD-07)

---

## Decision Register (key decisions)

| Decision | Rationale | Consequence | Keep / Revisit |
|---|---|---|---|
| Fully static, no backend — ever | Privacy, zero hosting cost, portability | Cannot add server features | **Keep** — core identity |
| Single production dependency (mermaid) | Security surface minimization | Deep coupling to Mermaid release cadence | **Keep** |
| Exact pin on mermaid (not ^11.x.x) | CVE management — 4 CVEs fixed in one release | Must manually bump | **Keep** |
| localStorage not IndexedDB | Simpler, synchronous, sufficient | ~5MB limit | **Keep** unless palette library grows |
| Manual 81-step checklist, no automated tests | Speed of early development | High regression risk | **Revisit** — add Playwright |
| Version number not tracked via GitHub releases | Rapid iteration pace | No visible release history | **Revisit** — create tags |
| pnpm workspace root as app root | Supports sibling apps in artifacts/ | Unusual Replit structure | **Keep** |

---

## Productization Gap Scorecard

| Area | Current | Required | Gap | Priority |
|---|---|---|---|---|
| Product definition | 5 | 4 | None | — |
| Core workflows | 4 | 4 | Palette CRUD incomplete | Medium |
| Testing | 1 | 3 | **Critical** | P0 |
| Roadmap | 4 | 4 | Updated in this session | — |
| Versioning / releases | 1 | 3 | No GitHub release tags | High |
| UX discoverability | 3 | 4 | Hidden features (URL share) | Medium |
| Documentation | 4 | 4 | CHANGELOG added in this session | — |
| Analytics | 0 | 2 | None installed | Low |
| Accessibility | 1 | 3 | No audit done | Medium |

**Overall: ~3.1/5 — solid MVP boundary.**

---

## Forward Roadmap (90-day, as of 2026-05-21)

### Phase 1 — Stabilize (done in this session)
- ✅ Update `MERMAID_VERSION_VERIFIED` to 11.15.0
- ✅ Remove expired pnpm `minimumReleaseAgeExclude` entries
- ✅ Create `CHANGELOG.md`
- ✅ Rewrite `docs/ROADMAP.md`
- ✅ Create `docs/technical-debt-register.md`
- ✅ Create `docs/prototype-to-product-retrospective.md`
- ⬜ Create v0.5.0 GitHub release tag
- ⬜ Evaluate 5 open Dependabot major-version PRs

### Phase 2 — Clarify (weeks 2–4)
- ⬜ Playwright smoke tests (TD-01)
- ⬜ Complete user palette CRUD (FR-022)
- ⬜ Add "Copy share link" button (TD-10)
- ⬜ ApplyTab.tsx decomposition (TD-06)
- ⬜ README refresh

### Phase 3 — Extend (weeks 4–8)
- ⬜ Export preview pane
- ⬜ Family-specific Prompt Scaffold templates
- ⬜ Syntax-highlighted code editor (evaluate bundle impact first)
- ⬜ 3–5 additional community palettes
- ⬜ WCAG 2.1 AA audit

### Phase 4 — Productize (weeks 8–12)
- ⬜ Privacy-respecting analytics (Plausible/Fathom)
- ⬜ OKH Forge design system ported to sibling apps
- ⬜ v1.0.0 formal release

---

## Open Questions

| ID | Question | Blocks |
|---|---|---|
| P-01 | Is this intended only for OKHP3 or as a general Mermaid tool? | v0.6 community palette priority |
| P-02 | Is v1.0 tied to a specific announcement or overkillhill.com launch? | v1.0 milestone definition |
| P-03 | Should the Prompt Scaffold be published as an open format/spec? | Platform path decision |
| T-01 | Does Mermaid 11.15.0 add new diagram families not yet in the registry? | MERMAID_VERSION_VERIFIED accuracy |
| T-02 | Is the service worker functioning? When was it last validated? | PWA claims |
| T-03 | Do TypeScript 6 / Zod 4 introduce breaking changes to this codebase? | Dependabot PR triage |
| S-01 | Does `securityLevel: "loose"` have XSS implications for user-pasted content? | Ongoing security review |
| DEP-01 | Is overkillhill.com or okhp3.github.io the canonical URL? | sitemap.xml, canonical meta tags |

---

## Documentation Artifact Plan

| Document | Status | Path |
|---|---|---|
| Prototype-to-Product Retrospective | ✅ Created | `docs/prototype-to-product-retrospective.md` |
| Technical Debt Register | ✅ Created | `docs/technical-debt-register.md` |
| CHANGELOG | ✅ Created | `CHANGELOG.md` |
| Updated ROADMAP | ✅ Updated | `docs/ROADMAP.md` |
| Product Brief (v0.1-era) | Exists but stale | `docs/PRODUCT_BRIEF.md` — update to v0.5 scope |
| Architecture Summary | Covered in this doc + AGENTS.md | Optional: `docs/architecture-summary.md` |
| Decision Register | Summarized in this doc | Optional: `docs/decision-register.md` |
| README | Likely stale | Update to reflect v0.5 feature set |
| GitHub releases | Missing | Create v0.5.0 release tag |
| GitHub issues backlog | Partial | Convert recommended backlog to GitHub issues |
