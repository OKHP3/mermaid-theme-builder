# Contributing

> Mermaid Theme Builder is a personal OverKill Hill P³ project by Jamie Hill. It is not affiliated with Builders FirstSource, BFS, Mermaid, Mermaid Chart, Mermaid.ai, or any third-party brand represented by user-entered colors.

This is a personal project. External contributions are welcome but will be evaluated against the brand-firewall and product-scope rules below.

## Brand firewall (non-negotiable)

Read [`AGENTS.md`](../AGENTS.md) before opening a PR. The short version:

- **Do not** reintroduce BFS / Builders FirstSource / employer references in code, comments, examples, palettes, docs, or commit messages.
- **Do not** add real-company brand palettes (Walmart, Starbucks, Apple, Microsoft, Target, Home Depot, etc.).
- **Do not** add brand hex values that match the rejected list in `AGENTS.md`.
- Built-in palettes must remain either (a) original generic palettes or (b) personal OverKill Hill / AskJamie / Glee-fully ecosystem palettes.

## Product scope (also non-negotiable)

The product remains static, browser-based, and local-only. PRs that add any of the following will be closed:

- Backend services, databases, login, payment, file upload to a server, cloud storage.
- AI API calls or telemetry on pasted diagram content.
- A custom BPMN / ArchiMate / SysML grammar or a Mermaid fork.
- A Mermaid.ai clone.

The tool styles and explains Mermaid-supported (or Mermaid-emulatable) diagrams. It does not become a competing diagram language.

## Development setup

```bash
pnpm install
pnpm --filter @workspace/mermaid-theme-builder run dev
```

The dev server reads `PORT` and `BASE_PATH` from the environment. In Replit these are provided by the workflow; locally `pnpm dev` defaults are sufficient.

## Quality bar

Before opening a PR, please run:

```bash
pnpm run typecheck    # builds composite libs then typechecks each leaf package
pnpm --filter @workspace/mermaid-theme-builder run build
```

Both must succeed. CI (`.github/workflows/ci.yml`) runs the same checks.

## Code style

- TypeScript strict mode is on; do not weaken it.
- Use `req.log` for server logging — there is no server in this artifact, so this is informational.
- Prefer the existing UI primitives in `src/components/ui/` over introducing new dependencies.
- Tailwind utility classes preferred; co-located `*.module.css` only when necessary.
- No `console.log` in shipped code paths.

## PR checklist

- [ ] No BFS / employer references introduced anywhere.
- [ ] No real-company brand palettes added.
- [ ] `pnpm run typecheck` passes.
- [ ] Production build (`pnpm --filter @workspace/mermaid-theme-builder run build`) succeeds.
- [ ] If a new diagram family was added, capability registry entry added with `supportStatus`, `themeConfidence`, `notationCompliance`.
- [ ] If a new palette was added, all 13+ keys provided + `fontFamily`.
- [ ] If a new export format was added, it is reflected in both `lib/exporters.ts` and the Apply tab Download dropdown.
- [ ] `docs/RELEASE_CHECKLIST.md` updated when shipping a new version.
