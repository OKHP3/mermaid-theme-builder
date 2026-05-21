# Technical Debt Register

**Project:** Mermaid Theme Builder  
**Last updated:** 2026-05-21  
**Source:** Prototype-to-Product Retrospective (see `docs/prototype-to-product-retrospective.md`)

Items are tracked here so future maintainers and AI agents do not re-create known issues.

---

| Debt ID | Area | Issue | Impact | Severity | Recommended Fix | Effort | Status |
|---|---|---|---|---|---|---|---|
| TD-01 | Testing | Zero automated tests against an 81-step manual checklist | High — any refactor risks silent regression; CI does not catch logic failures | **Critical** | Add Playwright smoke tests for core pipeline (paste → detect → export) | Medium | Open |
| TD-02 | Governance | ~~`MERMAID_VERSION_VERIFIED` constant was `11.14.0` after upgrade to `11.15.0`~~ | Misleads agents and maintainers; AGENTS.md explicitly calls this out | **High** | ~~Update constant in `mermaid-capabilities.ts`~~ | Small | **Resolved 2026-05-21** |
| TD-03 | Dependency | 5 open Dependabot PRs with major version bumps: TypeScript 5→6, Zod 3→4, lucide-react 0.5→1, @vitejs/plugin-react 5→6, tailwindcss 4.2→4.3 | Each is a potential breaking change; TypeScript 6 especially risky | **High** | Evaluate each individually; TypeScript 6 and Zod 4 require careful migration testing | Large | Open |
| TD-04 | Versioning | No GitHub releases or tags despite being at v0.5.0 | No visible version history; no GitHub release notes | **High** | Create v0.5.0 release tag with CHANGELOG notes | Small | Open |
| TD-05 | Documentation | ~~ROADMAP.md showed v0.3/v0.4 as future but product was at v0.5.0~~ | Confusing for maintainer context; future agent plans may conflict | **High** | ~~Rewrite ROADMAP.md~~ | Small | **Resolved 2026-05-21** |
| TD-06 | Code quality | `ApplyTab.tsx` is ~1017 lines | Approaching decomposition threshold; hard to navigate and test | Medium | Extract: export toolbar, warning section, preview panel, detect header into sub-components | Medium | Open |
| TD-07 | Security/Secrets | `SESSION_SECRET` present in Replit secrets but not used by this app | Noise; confusing to future maintainers | Low | Remove unused secret from Replit environment | Small | Open |
| TD-08 | Deployment | ~~`minimumReleaseAgeExclude` for `mermaid` and `@mermaid-js/*` in pnpm-workspace.yaml was temporary~~ | Temporary exclusion needed cleanup after May 13, 2026 | Medium | ~~Remove exclusion entries~~ | Small | **Resolved 2026-05-21** |
| TD-09 | PWA / Service worker | `public/sw.js` present but PWA offline behaviour not in release checklist and not recently validated | PWA install may fail or serve stale content | Medium | Add PWA smoke test to release checklist; validate cache strategy | Small | Open |
| TD-10 | UX | URL palette sharing is implemented but not surfaced in UI | Users cannot discover the share feature | Medium | Add "Copy share link" button to palette editor or export bar | Small | Open |
| TD-11 | Maintainability | `mermaid-capabilities.ts` is ~887 lines and manually maintained with no tests | Capability claims can be wrong with no automated catch | Medium | Add test fixtures asserting known diagram types detect correctly | Medium | Open |
| TD-12 | Documentation | No CHANGELOG.md | No versioned narrative of what changed and when | Medium | ~~Create CHANGELOG.md covering v0.1.0 through v0.5.0~~ | Small | **Resolved 2026-05-21** |
| TD-13 | UX | Export preview pane not yet implemented | Roadmap gap from v0.2 | Low | Implement read-only export preview pane below diagram | Medium | Planned v0.6 |
| TD-14 | UX | Full user palette CRUD only partially implemented in ComposeTab | Core workflow gap for power users | Medium | Complete save/rename/delete/reorder in ComposeTab; persist to localStorage | Medium | Planned v0.6 |
| TD-15 | Accessibility | No WCAG 2.1 AA audit performed | Unknown accessibility quality | Medium | Run axe-core or manual audit; fix critical/serious violations | Medium | Planned v0.7 |
| TD-16 | Analytics | No privacy-respecting analytics | No insight into actual usage patterns | Low | Add Plausible or Fathom (no cookies, no diagram content captured) | Small | Planned v1.0 |

---

## How to use this register

- When a debt item is resolved, update its **Status** to `Resolved YYYY-MM-DD` and ~~strike through~~ the issue description.
- Before starting a refactor that touches a file with open debt items, review this register first.
- When adding a new debt item: assign the next `TD-XX` ID, fill all columns, set Status to `Open`.
- This file is a living document — update it as part of every release cycle.
