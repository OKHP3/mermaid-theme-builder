# ADR-0005: pnpm workspace + Replit scaffold

## Status

Accepted

## Date

2026-01-01

## Context

Replit's artifact system wraps web applications in a monorepo scaffold:

- A root `pnpm-workspace.yaml` declares the workspace.
- An `artifacts/<name>/` directory contains a `package.json` shell, the
  Replit platform registration file (`artifact.toml`), and a preview asset.
- The `packageManager` field in the root `package.json` pins the pnpm version
  for reproducible installs.
- The actual application source lives at the repo root in `src/`.

This layout is Replit scaffolding and is not a traditional monorepo; there is
no second application package. The `artifacts/mermaid-theme-builder/` directory
contains no source code.

## Decision Drivers

- **Replit platform requirement** — the artifact registration system requires
  `artifact.toml` in the artifact directory and a workspace `package.json` shell.
- **pnpm reproducibility** — `pnpm-lock.yaml` pins every transitive dependency.
  The `packageManager` field pins the pnpm major version so CI and local
  environments install identically.
- **Catalog-based version pins** — `pnpm-workspace.yaml` `catalog:` entries
  ensure all packages in the workspace resolve to the same version.

## Decision

Accept and maintain the **Replit pnpm workspace scaffold** as a platform
requirement. Treat `artifacts/mermaid-theme-builder/` as infrastructure, not
application code. Keep the `packageManager` field pinned to the verified pnpm
`10.x` version; do not accept automated bumps that change the major version
without explicit testing.

The application is the root `package.json` (`@workspace/mermaid-theme-builder`).
The workspace structure is Replit scaffolding and should not be confused with a
multi-package monorepo.

## Consequences

### Positive

- Replit's artifact system provides managed workflows, preview routing, and
  deployment without manual CI configuration.
- `pnpm-lock.yaml` ensures reproducible installs across Replit, GitHub Actions,
  and local environments.

### Negative

- The workspace layout can mislead new contributors into thinking there is a
  separate artifact package with its own source code.
- Automated tools (Dependabot, task agents) may update `packageManager` to a
  non-existent or incompatible version if they treat it as a regular dependency
  field.

### Risks and mitigations

- **packageManager field accident** — if the field is bumped to a non-existent
  version (e.g., by copying a dependency version), every workflow bootstrap
  crashes with SIGABRT. Mitigation: Task #478 adds a CI guard for this field.
- **Workspace confusion** — `AGENTS.md` Section 2 documents that this is
  Replit scaffolding and that `artifacts/` contains no application source.

## Related decisions

- ADR-0001: React + Vite SPA (the application this scaffold hosts)
