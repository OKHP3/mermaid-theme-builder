# Architecture Decision Records

Architecture Decision Records (ADRs) for the Mermaid Theme Builder project.
Each ADR captures the context, decision, and consequences of a significant
architectural or technology choice. ADRs are immutable once accepted — new
decisions supersede rather than rewrite them.

See `AGENTS.md` Section 1 for file-naming conventions (kebab-case).

## Index

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| [0001](0001-react-vite-spa-architecture.md) | React + Vite client-only SPA | Accepted | 2026-01-01 |
| [0002](0002-tailwind-css-v4.md) | Tailwind CSS v4 | Accepted | 2026-01-01 |
| [0003](0003-mermaid-browser-rendering.md) | Mermaid.js browser-side rendering | Accepted | 2026-01-01 |
| [0004](0004-playwright-e2e.md) | Playwright for end-to-end testing | Accepted | 2026-01-01 |
| [0005](0005-pnpm-workspace-replit.md) | pnpm workspace + Replit scaffold | Accepted | 2026-01-01 |

## Creating a new ADR

1. Copy `0001-react-vite-spa-architecture.md` as a template.
2. Name it `NNNN-short-decision-title.md` (kebab-case, zero-padded number).
3. Fill in Status, Context, Decision, Rationale, and Consequences.
4. Add a row to the index table above.

## ADR lifecycle

```
Proposed → Accepted → Deprecated → Superseded
              ↓
           Rejected
```
