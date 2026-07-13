# Technology Inventory

Reviewed 2026-07-13.

This inventory covers technologies declared by the repository, used by source
code, used by tests and build tooling, or supplied by the Replit and GitHub
execution environments. The current column is the resolved version in
`pnpm-lock.yaml` unless the technology is a runtime or action reference. The
latest column is the latest stable release checked during this review. Previews,
nightlies, canaries, and experimental releases are excluded.

The lockfile contains hundreds of transitive packages. They are generated from
the direct manifests and are intentionally not repeated here. Dependabot and
the version audit cover the direct manifests and the resulting lockfile.

## Languages, runtimes, and platform

| Technology           | Current use                                                                                                                                 | Latest stable checked                                                | Source and maintenance note                                                                                                                           |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| JavaScript           | Browser service worker, icon generator, Vite configuration runtime, and compiled output. There is no standalone JavaScript package version. | ECMAScript target is `es2022` in `tsconfig.base.json`                | [ECMAScript language standard](https://tc39.es/ecma262/). The runtime is governed by Node.js and browser support.                                     |
| TypeScript           | `7.0.2`, strict compiler, `target: es2022`                                                                                                  | `7.0.2`                                                              | [npm](https://www.npmjs.com/package/typescript). Major upgrades require typecheck and build review.                                                   |
| Node.js              | Declared as major `24` in `.replit` and GitHub Actions. Local review runtime was `24.11.1`.                                                 | `24.18.0` latest Node 24 LTS patch. `26.5.0` latest overall release. | [Node.js release schedule](https://nodejs.org/en/about/previous-releases). Keep CI on Node 24 LTS until a deliberate major upgrade is tested.         |
| pnpm                 | `11.12.0` in `package.json`; lockfile format `9.0`.                                                                                         | `11.12.0`                                                            | [npm](https://www.npmjs.com/package/pnpm). The declared package manager is the reproducible project value.                                            |
| Python               | Replit provisions `python-3.11`; no Python source, dependency manifest, or script exists in this repository.                                | `3.14.6`                                                             | [Python 3.14.6](https://www.python.org/downloads/release/python-3146/). This is platform support inventory, not an application dependency.            |
| Nixpkgs / Replit Nix | `stable-25_05` channel in `replit.nix`; `gir-rs` package plus Replit browser packages.                                                      | `26.05` latest NixOS stable release                                  | [NixOS 26.05](https://nixos.org/blog/announcements/2026/nixos-2605/). Channel upgrades are Replit environment changes and need a platform smoke test. |

## Application framework and build

| Package or technology                                                                                            | Current | Latest stable | Role                                         |
| ---------------------------------------------------------------------------------------------------------------- | ------: | ------------: | -------------------------------------------- |
| [React](https://www.npmjs.com/package/react)                                                                     |  19.2.7 |        19.2.7 | UI component framework                       |
| [React DOM](https://www.npmjs.com/package/react-dom)                                                             |  19.2.7 |        19.2.7 | React browser renderer                       |
| [Vite](https://www.npmjs.com/package/vite)                                                                       |   8.1.4 |         8.1.4 | Dev server and production bundler            |
| [Tailwind CSS](https://www.npmjs.com/package/tailwindcss)                                                        |   4.3.2 |         4.3.2 | Utility CSS framework, v4 only               |
| [@tailwindcss/vite](https://www.npmjs.com/package/@tailwindcss/vite)                                             |   4.3.2 |         4.3.2 | Tailwind Vite integration                    |
| [@tailwindcss/oxide-win32-x64-msvc](https://www.npmjs.com/package/@tailwindcss/oxide-win32-x64-msvc)             |   4.3.2 |         4.3.2 | Windows Tailwind native binary               |
| [tw-animate-css](https://www.npmjs.com/package/tw-animate-css)                                                   |   1.4.0 |         1.4.0 | Tailwind animation utilities                 |
| [@vitejs/plugin-react](https://www.npmjs.com/package/@vitejs/plugin-react)                                       |   6.0.3 |         6.0.3 | React transform and Fast Refresh integration |
| [@replit/vite-plugin-cartographer](https://www.npmjs.com/package/@replit/vite-plugin-cartographer)               |   0.6.0 |         0.6.0 | Replit development integration               |
| [@replit/vite-plugin-dev-banner](https://www.npmjs.com/package/@replit/vite-plugin-dev-banner)                   |   0.1.2 |         0.1.2 | Replit development banner                    |
| [@replit/vite-plugin-runtime-error-modal](https://www.npmjs.com/package/@replit/vite-plugin-runtime-error-modal) |   0.0.6 |         0.0.6 | Replit development error overlay             |
| [@types/node](https://www.npmjs.com/package/@types/node)                                                         |  26.1.1 |        26.1.1 | Node.js type declarations                    |
| [@types/react](https://www.npmjs.com/package/@types/react)                                                       | 19.2.17 |       19.2.17 | React type declarations                      |
| [@types/react-dom](https://www.npmjs.com/package/@types/react-dom)                                               |  19.2.3 |        19.2.3 | React DOM type declarations                  |

## Diagram rendering and asset generation

| Package or technology                                                                    |                 Current | Latest stable | Role and upgrade constraint                                                                                  |
| ---------------------------------------------------------------------------------------- | ----------------------: | ------------: | ------------------------------------------------------------------------------------------------------------ |
| [Mermaid](https://www.npmjs.com/package/mermaid)                                         | 11.16.0, pinned exactly |       11.16.0 | Browser diagram renderer. Update `MERMAID_VERSION_VERIFIED` and the capability registry after every upgrade. |
| [@mermaid-js/mermaid-zenuml](https://www.npmjs.com/package/@mermaid-js/mermaid-zenuml)   |                   0.2.3 |         0.2.3 | ZenUML renderer integration                                                                                  |
| [@napi-rs/canvas](https://www.npmjs.com/package/@napi-rs/canvas)                         |                   1.0.2 |         1.0.2 | Real canvas implementation for PNG integration tests                                                         |
| [pngjs](https://www.npmjs.com/package/pngjs)                                             |                   7.0.0 |         7.0.0 | Pure JavaScript PNG generation and test inspection                                                           |
| [lightningcss-win32-x64-msvc](https://www.npmjs.com/package/lightningcss-win32-x64-msvc) |                  1.32.0 |        1.32.0 | Windows native CSS processing package used by the build toolchain                                            |

## Testing, accessibility, and developer tooling

| Package or technology                                                         |          Current | Latest stable | Role                                                |
| ----------------------------------------------------------------------------- | ---------------: | ------------: | --------------------------------------------------- |
| [Vitest](https://www.npmjs.com/package/vitest)                                |           4.1.10 |        4.1.10 | Unit and component test runner                      |
| [Playwright Test](https://www.npmjs.com/package/@playwright/test)             |           1.61.1 |        1.61.1 | Chromium end-to-end tests                           |
| [Testing Library DOM](https://www.npmjs.com/package/@testing-library/dom)     |           10.4.1 |        10.4.1 | DOM test helpers                                    |
| [Testing Library React](https://www.npmjs.com/package/@testing-library/react) |           16.3.2 |        16.3.2 | React test rendering and queries                    |
| [happy-dom](https://www.npmjs.com/package/happy-dom)                          |          20.10.6 |       20.10.6 | DOM test environment                                |
| [axe-core](https://www.npmjs.com/package/axe-core)                            |           4.12.1 |        4.12.1 | Automated accessibility checks                      |
| [Prettier](https://www.npmjs.com/package/prettier)                            |            3.9.5 |         3.9.5 | Formatting and CI format checks                     |
| [lint-staged](https://www.npmjs.com/package/lint-staged)                      |           17.0.8 |        17.0.8 | Pre-commit staged-file formatting                   |
| [simple-git-hooks](https://www.npmjs.com/package/simple-git-hooks)            |           2.13.1 |        2.13.1 | Pre-commit hook registration                        |
| TypeScript path aliases                                                       | `@/*` to `src/*` | Not versioned | Vite and TypeScript module resolution configuration |

## Browser and web platform technologies

| Technology                  | Current use                                                                                                  | Version note                                          |
| --------------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| HTML5                       | `index.html`, semantic app shell, metadata, and manifest references                                          | Web standard, no package pin                          |
| CSS                         | `src/index.css`, synced Forge tokens, Tailwind v4, CSS custom properties, media queries, and color functions | Web standard, processed by Tailwind and Lightning CSS |
| Web Storage API             | `localStorage` and `sessionStorage` for local preferences and test isolation                                 | Browser standard, no package pin                      |
| Clipboard API               | Copy controls use `navigator.clipboard` with a fallback                                                      | Browser standard, no package pin                      |
| Service Workers             | `public/sw.js` caches static assets for the GitHub Pages app                                                 | Browser standard, no package pin                      |
| SVG, PNG, Web Manifest, XML | Icons, generated raster icons, app manifest, robots, and sitemap                                             | File formats and web standards, no package pin        |
| GitHub Pages                | Static hosting at `/mermaid-theme-builder/`                                                                  | GitHub platform service, no repo package version      |

## GitHub Actions and update automation

Workflows currently use `actions/checkout@v6`, `pnpm/action-setup@v6`,
`actions/setup-node@v6`, `actions/upload-artifact@v7`,
`actions/configure-pages@v6`, `actions/upload-pages-artifact@v5`,
`actions/deploy-pages@v5`, and `peter-evans/create-pull-request@v8`. These are
major-tag references rather than exact patch pins. The existing GitHub Actions
Dependabot entry checks these references weekly. GitHub documents that the
`github-actions` ecosystem raises pull requests when newer action versions are
available: [Keeping your actions up to date with Dependabot](https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/secure-your-dependencies/auto-update-actions).

## Maintenance plan implemented

1. Keep `.github/dependabot.yml` as the source of automated npm and GitHub
   Actions pull requests. It already excludes Mermaid major upgrades because
   that change requires capability registry review.
2. Run `pnpm check:technology-versions` locally when reviewing a dependency
   change. Use `pnpm check:technology-versions -- --json` for machine-readable
   output, or add `--fail-on-outdated` when a clean latest-version check is
   required.
3. Run `.github/workflows/technology-version-audit.yml` every Monday and on
   demand. It checks direct npm packages, the declared and installed pnpm
   versions, the Node.js release feed, and the official Python release feed.
   The report is retained as a workflow artifact.
4. Review runtime changes manually. A Node major change or Replit Nix channel
   change requires `pnpm install --frozen-lockfile`, unit tests, typecheck,
   production build, and Playwright coverage before changing `.replit`, CI,
   or `replit.nix`.
5. For Mermaid upgrades, follow `docs/mermaid-capability-registry.md`, update
   `src/data/mermaid-capabilities.ts`, refresh the Mermaid version matrix, and
   rerun the full release checklist.

The audit reports drift. Dependabot proposes dependency and action updates. A
human review remains required for runtime majors, Mermaid changes, and platform
channel changes because those can change rendering behavior or deployment
behavior even when the package manager accepts the new version.
