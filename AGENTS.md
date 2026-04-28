# AGENTS.md — Mermaid Theme Builder

> **Disclaimer:** Mermaid Theme Builder is a personal OverKill Hill P³ project by Jamie Hill. It is not affiliated with Builders FirstSource, BFS, Mermaid, Mermaid Chart, Mermaid.ai, or any third-party brand represented by user-entered colors.

This file provides context and instructions for AI coding agents working in this repository.

---

## Repository Structure

```
/
├── artifacts/
│   ├── mermaid-theme-builder/    ← Main app (React + Vite + Tailwind)
│   │   ├── src/
│   │   │   ├── data/
│   │   │   │   └── mermaid-capabilities.json  ← Capability registry
│   │   │   ├── lib/
│   │   │   │   ├── detector.ts    ← Diagram type detection + registry lookup
│   │   │   │   ├── palettes.ts    ← Built-in theme palettes
│   │   │   │   └── themeEngine.ts ← Init directive generation + exports
│   │   │   ├── pages/
│   │   │   │   └── ThemeBuilder.tsx ← Main UI
│   │   │   └── components/
│   │   └── package.json
│   ├── api-server/               ← Replit dev helper (not used in production)
│   └── mockup-sandbox/           ← UI mockup exploration (not production)
├── docs/                         ← Product documentation
├── standards/                    ← Technical and product standards
├── .github/
│   └── dependabot.yml            ← Dependency update config
├── README.md
└── AGENTS.md                     ← This file
```

---

## Brand Rules — Critical

**Always enforce these rules. No exceptions.**

1. This project is a **personal OverKill Hill P³ project by Jamie Hill**.
2. It is **not affiliated** with Builders FirstSource, BFS, or any employer.
3. **Remove or refuse** any BFS, Builders FirstSource, or employer references.
4. **Do not add** real-company brand palettes (Walmart, Starbucks, Apple, Microsoft, Target, Home Depot, etc.).
5. **Do not add** any backend, login, payment, database, AI API calls, or file upload features.

---

## Built-in Palettes

Palettes live in `artifacts/mermaid-theme-builder/src/lib/palettes.ts`.

### Allowed palette categories:

**OKH Ecosystem** (derived from public OverKill Hill P³ site CSS):
- `okh-light` — OKH Light
- `okh-protocol` — OKH Protocol (dark)
- `askjamie-friendly` — AskJamie Friendly
- `gleefully-bright` — Glee-fully Bright

**Generic Original** (no third-party brand):
- `neutral-enterprise`
- `ocean-depth`
- `forest-sage`
- `slate-ember`
- `violet-mist`

When adding or modifying OKH ecosystem palettes, include the `attribution` field referencing the public site CSS.

---

## Mermaid Dependency

- Mermaid is in `package.json` as `"mermaid": "^11.x"`.
- Do **not** load from CDN `latest` or any unpinned URL.
- Do **not** fork or copy Mermaid into the repo.

---

## Capability Registry

File: `artifacts/mermaid-theme-builder/src/data/mermaid-capabilities.json`

- Must be updated when `mermaid` is upgraded.
- `detector.ts` imports this file and uses it for style support metadata and warnings.
- All diagram types detected by `detector.ts` must be present in the registry.

---

## Development Commands

```bash
# Install dependencies (from repo root)
pnpm install

# Dev server for the main app
cd artifacts/mermaid-theme-builder
pnpm dev

# Typecheck
pnpm typecheck

# Build
pnpm build
```

---

## Code Style

- TypeScript strict mode.
- React functional components with hooks.
- Tailwind CSS for styling.
- No class components.
- No `any` unless absolutely unavoidable with a comment.
- Prefer `useMemo`/`useCallback` for computed values and stable handlers.

---

## What Agents Should Not Do

- Do not add real-company brand palettes.
- Do not add backend, API server, login, payment, or database.
- Do not load Mermaid from CDN.
- Do not introduce BFS, Builders FirstSource, or employer references.
- Do not remove or edit the disclaimers in docs, standards, or README.
- Do not add AI API calls or LLM integrations.
