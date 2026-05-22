# Technical Debt Register

**Project:** Mermaid Theme Builder  
**Last updated:** 2026-05-22  
**Source:** Prototype-to-Product Retrospective (see `docs/prototype-to-product-retrospective.md`)

Items are tracked here so future maintainers and AI agents do not re-create known issues.

---

| Debt ID | Area | Issue | Impact | Severity | Recommended Fix | Effort | Status |
|---|---|---|---|---|---|---|---|
| TD-01 | Testing | Zero automated tests against an 81-step manual checklist | High — any refactor risks silent regression; CI does not catch logic failures | **Critical** | Add Playwright smoke tests for core pipeline (paste → detect → export) | Medium | Open |
| TD-02 | Governance | ~~`MERMAID_VERSION_VERIFIED` constant was `11.14.0` after upgrade to `11.15.0`~~ | Misleads agents and maintainers; AGENTS.md explicitly calls this out | **High** | ~~Update constant in `mermaid-capabilities.ts`~~ | Small | **Resolved 2026-05-21** |
| TD-03 | Dependency | 5 open Dependabot PRs with major version bumps: TypeScript 5→6, Zod 3→4, lucide-react 0.5→1, @vitejs/plugin-react 5→6, tailwindcss 4.2→4.3 | Each is a potential breaking change; TypeScript 6 especially risky | **High** | Evaluate each individually; TypeScript 6 and Zod 4 require careful migration testing | Large | Open |
| TD-04 | Versioning | ~~No GitHub releases or tags despite being at v0.5.0~~ | No visible version history; no GitHub release notes | **High** | ~~Create v0.5.0 release tag with CHANGELOG notes~~ | Small | **Resolved 2026-05-21** |
| TD-05 | Documentation | ~~ROADMAP.md showed v0.3/v0.4 as future but product was at v0.5.0~~ | Confusing for maintainer context; future agent plans may conflict | **High** | ~~Rewrite ROADMAP.md~~ | Small | **Resolved 2026-05-21** |
| TD-06 | Code quality | `ApplyTab.tsx` is ~1017 lines | Approaching decomposition threshold; hard to navigate and test | Medium | Extract: export toolbar, warning section, preview panel, detect header into sub-components | Medium | Open |
| TD-07 | Security/Secrets | `SESSION_SECRET` present in Replit secrets but not used by this app | Noise; confusing to future maintainers | Low | Remove unused secret from Replit environment | Small | Open |
| TD-08 | Deployment | ~~`minimumReleaseAgeExclude` for `mermaid` and `@mermaid-js/*` in pnpm-workspace.yaml was temporary~~ | Temporary exclusion needed cleanup after May 13, 2026 | Medium | ~~Remove exclusion entries~~ | Small | **Resolved 2026-05-21** |
| TD-09 | PWA / Service worker | `public/sw.js` present but PWA offline behavior not in release checklist and not recently validated | PWA install may fail or serve stale content | Medium | Add PWA smoke test to release checklist; validate cache strategy | Small | Open |
| TD-10 | UX | URL palette sharing is implemented but not surfaced in UI | Users cannot discover the share feature | Medium | Add "Copy share link" button to palette editor or export bar | Small | Open |
| TD-11 | Maintainability | `mermaid-capabilities.ts` is ~887 lines and manually maintained with no tests | Capability claims can be wrong with no automated catch | Medium | Add test fixtures asserting known diagram types detect correctly | Medium | Open |
| TD-12 | Documentation | No CHANGELOG.md | No versioned narrative of what changed and when | Medium | ~~Create CHANGELOG.md covering v0.1.0 through v0.5.0~~ | Small | **Resolved 2026-05-21** |
| TD-13 | UX | Export preview pane not yet implemented | Roadmap gap from v0.2 | Low | Implement read-only export preview pane below diagram | Medium | Planned v0.6 |
| TD-14 | UX | Full user palette CRUD only partially implemented in ComposeTab | Core workflow gap for power users | Medium | Complete save/rename/delete/reorder in ComposeTab; persist to localStorage | Medium | Planned v0.6 |
| TD-15 | Accessibility | No WCAG 2.1 AA audit performed | Unknown accessibility quality | Medium | Run axe-core or manual audit; fix critical/serious violations | Medium | Planned v0.7 |
| TD-16 | Analytics | No privacy-respecting analytics | No insight into actual usage patterns | Low | Add Plausible or Fathom (no cookies, no diagram content captured) | Small | Planned v1.0 |
| TD-17 | Capability Registry | Event Modeling (Mermaid 11.15) was absent from the capability registry and DiagramFamily type | Reference tab gave no coverage signal for a shipped diagram type; detector silently ignored it | Medium | Add `"eventModeling"` to `DiagramFamily` union and `DIAGRAM_CAPABILITIES` entry | Small | **Resolved 2026-05-22** |
| TD-18 | Feature Gap | Typography model is too global — no per-element font hierarchy (title, body, node label, subgraph, axis) | Advanced users cannot control typography at the granularity Mermaid supports; prompt scaffolds underspecify font intent | Medium | Add title/body/node/subgraph/axis typography hierarchy controls with fallback rules and per-family capability gating | Large | Open |
| TD-19 | Export | Root-level `htmlLabels` and `deterministicIds`/`deterministicIDSeed` not surfaced in any export format | Exports emit stale `flowchart.htmlLabels` nesting (deprecated in 11.13); multi-diagram embeds risk SVG ID collisions with no builder guidance | Medium | Emit `htmlLabels` at root config level in `%%{init}%%` and Markdown Bootstrap exports; add `deterministicIds` option to advanced config | Small | Open |
| TD-20 | Documentation | README and public project page narrative lags delivered scope — still describes v0.3 capability levels | First impression understates product maturity; misleads potential contributors | Medium | Update README feature list and public copy to reflect v0.5 truth including 11.15 coverage, live editor link, renderer warnings, and example library depth | Small | Open |
| TD-21 | Capability Registry | Architecture fcose layout tuning knobs (11.15: `nodeSeparation`, `idealEdgeLengthMultiplier`, `edgeElasticity`, `numIter`), Timeline direction (`LR`/`TD`), and class hierarchical namespaces (11.13–11.15) not documented or exposed | Users generating architecture/class/timeline diagrams via LLM cannot discover these controls exist | Low | Add to capability notes, expose in family-specific overrides in Apply tab, and add example `.mmd` files | Medium | Open |

---

## How to use this register

- When a debt item is resolved, update its **Status** to `Resolved YYYY-MM-DD` and ~~strike through~~ the issue description.
- Before starting a refactor that touches a file with open debt items, review this register first.
- When adding a new debt item: assign the next `TD-XX` ID, fill all columns, set Status to `Open`.
- This file is a living document — update it as part of every release cycle.
