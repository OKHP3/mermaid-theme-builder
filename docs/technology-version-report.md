# Technology version report

Retrieved: 2026-09-19T02:57:13.961Z. Source commit: 51e3bc806d431e799aff57dd0f9c1917147be22b.
The source commit is the baseline; uncommitted maintenance changes are included in this report.

Current npm versions are lockfile resolutions, not a claim about every host's installed modules. Latest means the publisher's stable npm latest tag or official release feed. Unknowns and ahead-of-latest results require review; they never trigger downgrades.

Summary: {"directDeclarations":91,"distinctDirectPackages":78,"lockfileResolutions":550,"outdatedNpm":40,"outdatedActions":16,"runtimeReviews":3,"errors":0}

## Runtimes and package manager

| Technology | Declared / running here | Latest stable | Status | Source |
| --- | --- | --- | --- | --- |
| Nixpkgs / Replit channel | stable-25_05 / not observed | 26.05 | update-available | https://nixos.org/manual/nixos/stable/release-notes |
| pnpm | pnpm@10.26.1 / not observed | 12.4.2 | update-available | https://registry.npmjs.org/pnpm/latest |
| Node.js | 24 / v24.11.1 | v26.9.0 | tracking-lts-major | https://nodejs.org/dist/index.json |
| Python | 3.11 / not observed | 3.14.7 | update-available | https://www.python.org/api/v2/downloads/release/?is_published=true&pre_release=false |

## GitHub Actions (including composite actions)

| Action | Reference | Latest release | Status | File |
| --- | --- | --- | --- | --- |
| [pnpm/action-setup](https://github.com/pnpm/action-setup/releases) | v6 | v6.1.0 | tracking-latest-major | .github/actions/setup-pnpm/action.yml |
| [actions/setup-node](https://github.com/actions/setup-node/releases) | v6 | v7.0.0 | update-available | .github/actions/setup-pnpm/action.yml |
| [actions/cache](https://github.com/actions/cache/releases) | v4 | v6.1.0 | update-available | .github/actions/setup-pnpm/action.yml |
| [actions/checkout](https://github.com/actions/checkout/releases) | v6 | v7.0.1 | update-available | .github/workflows/ci.yml |
| [actions/checkout](https://github.com/actions/checkout/releases) | v6 | v7.0.1 | update-available | .github/workflows/deploy-pages.yml |
| [pnpm/action-setup](https://github.com/pnpm/action-setup/releases) | v6.0.10 | v6.1.0 | update-available | .github/workflows/deploy-pages.yml |
| [actions/setup-node](https://github.com/actions/setup-node/releases) | v6 | v7.0.0 | update-available | .github/workflows/deploy-pages.yml |
| [actions/configure-pages](https://github.com/actions/configure-pages/releases) | v6 | v6.0.0 | tracking-latest-major | .github/workflows/deploy-pages.yml |
| [actions/upload-pages-artifact](https://github.com/actions/upload-pages-artifact/releases) | v5 | v5.0.0 | tracking-latest-major | .github/workflows/deploy-pages.yml |
| [actions/deploy-pages](https://github.com/actions/deploy-pages/releases) | v5 | v5.0.1 | tracking-latest-major | .github/workflows/deploy-pages.yml |
| [actions/checkout](https://github.com/actions/checkout/releases) | v6 | v7.0.1 | update-available | .github/workflows/e2e.yml |
| [actions/cache](https://github.com/actions/cache/releases) | v6 | v6.1.0 | tracking-latest-major | .github/workflows/e2e.yml |
| [actions/upload-artifact](https://github.com/actions/upload-artifact/releases) | v7 | v7.0.1 | tracking-latest-major | .github/workflows/e2e.yml |
| [actions/checkout](https://github.com/actions/checkout/releases) | v6 | v7.0.1 | update-available | .github/workflows/link-check.yml |
| [pnpm/action-setup](https://github.com/pnpm/action-setup/releases) | v6.1.0 | v6.1.0 | current | .github/workflows/link-check.yml |
| [actions/setup-node](https://github.com/actions/setup-node/releases) | v6 | v7.0.0 | update-available | .github/workflows/link-check.yml |
| [actions/checkout](https://github.com/actions/checkout/releases) | v6 | v7.0.1 | update-available | .github/workflows/release-gate.yml |
| [actions/checkout](https://github.com/actions/checkout/releases) | v6 | v7.0.1 | update-available | .github/workflows/release-gate.yml |
| [actions/cache](https://github.com/actions/cache/releases) | v6 | v6.1.0 | tracking-latest-major | .github/workflows/release-gate.yml |
| [actions/upload-artifact](https://github.com/actions/upload-artifact/releases) | v7 | v7.0.1 | tracking-latest-major | .github/workflows/release-gate.yml |
| [actions/checkout](https://github.com/actions/checkout/releases) | v6 | v7.0.1 | update-available | .github/workflows/skill-tests.yml |
| [actions/setup-node](https://github.com/actions/setup-node/releases) | v6 | v7.0.0 | update-available | .github/workflows/skill-tests.yml |
| [actions/checkout](https://github.com/actions/checkout/releases) | v6 | v7.0.1 | update-available | .github/workflows/sync-forge-tokens.yml |
| [peter-evans/create-pull-request](https://github.com/peter-evans/create-pull-request/releases) | v8 | v8.1.1 | tracking-latest-major | .github/workflows/sync-forge-tokens.yml |
| [actions/checkout](https://github.com/actions/checkout/releases) | v6 | v7.0.1 | update-available | .github/workflows/technology-version-audit.yml |
| [actions/setup-node](https://github.com/actions/setup-node/releases) | v6 | v7.0.0 | update-available | .github/workflows/technology-version-audit.yml |
| [actions/upload-artifact](https://github.com/actions/upload-artifact/releases) | v7 | v7.0.1 | tracking-latest-major | .github/workflows/technology-version-audit.yml |

## Direct dependencies in all repository manifests

| Package | Resolved | Latest stable | Status | Manifest |
| --- | --- | --- | --- | --- |
| [@hookform/resolvers](https://registry.npmjs.org/%40hookform%2Fresolvers/latest) | 3.10.0 | 5.9.1 | update-available | artifacts/mermaid-theme-workbench/package.json |
| [@radix-ui/react-accordion](https://registry.npmjs.org/%40radix-ui%2Freact-accordion/latest) | 1.2.20 | 1.2.20 | current | artifacts/mermaid-theme-workbench/package.json |
| [@radix-ui/react-alert-dialog](https://registry.npmjs.org/%40radix-ui%2Freact-alert-dialog/latest) | 1.1.23 | 1.1.23 | current | artifacts/mermaid-theme-workbench/package.json |
| [@radix-ui/react-aspect-ratio](https://registry.npmjs.org/%40radix-ui%2Freact-aspect-ratio/latest) | 1.1.15 | 1.1.15 | current | artifacts/mermaid-theme-workbench/package.json |
| [@radix-ui/react-avatar](https://registry.npmjs.org/%40radix-ui%2Freact-avatar/latest) | 1.2.6 | 1.2.6 | current | artifacts/mermaid-theme-workbench/package.json |
| [@radix-ui/react-checkbox](https://registry.npmjs.org/%40radix-ui%2Freact-checkbox/latest) | 1.3.11 | 1.3.11 | current | artifacts/mermaid-theme-workbench/package.json |
| [@radix-ui/react-collapsible](https://registry.npmjs.org/%40radix-ui%2Freact-collapsible/latest) | 1.1.20 | 1.1.20 | current | artifacts/mermaid-theme-workbench/package.json |
| [@radix-ui/react-context-menu](https://registry.npmjs.org/%40radix-ui%2Freact-context-menu/latest) | 2.3.7 | 2.3.7 | current | artifacts/mermaid-theme-workbench/package.json |
| [@radix-ui/react-dialog](https://registry.npmjs.org/%40radix-ui%2Freact-dialog/latest) | 1.1.23 | 1.1.23 | current | artifacts/mermaid-theme-workbench/package.json |
| [@radix-ui/react-dropdown-menu](https://registry.npmjs.org/%40radix-ui%2Freact-dropdown-menu/latest) | 2.1.24 | 2.1.24 | current | artifacts/mermaid-theme-workbench/package.json |
| [@radix-ui/react-hover-card](https://registry.npmjs.org/%40radix-ui%2Freact-hover-card/latest) | 1.1.23 | 1.1.23 | current | artifacts/mermaid-theme-workbench/package.json |
| [@radix-ui/react-label](https://registry.npmjs.org/%40radix-ui%2Freact-label/latest) | 2.1.15 | 2.1.15 | current | artifacts/mermaid-theme-workbench/package.json |
| [@radix-ui/react-menubar](https://registry.npmjs.org/%40radix-ui%2Freact-menubar/latest) | 1.1.24 | 1.1.24 | current | artifacts/mermaid-theme-workbench/package.json |
| [@radix-ui/react-navigation-menu](https://registry.npmjs.org/%40radix-ui%2Freact-navigation-menu/latest) | 1.2.22 | 1.2.22 | current | artifacts/mermaid-theme-workbench/package.json |
| [@radix-ui/react-popover](https://registry.npmjs.org/%40radix-ui%2Freact-popover/latest) | 1.1.23 | 1.1.23 | current | artifacts/mermaid-theme-workbench/package.json |
| [@radix-ui/react-progress](https://registry.npmjs.org/%40radix-ui%2Freact-progress/latest) | 1.1.16 | 1.1.16 | current | artifacts/mermaid-theme-workbench/package.json |
| [@radix-ui/react-radio-group](https://registry.npmjs.org/%40radix-ui%2Freact-radio-group/latest) | 1.4.7 | 1.4.7 | current | artifacts/mermaid-theme-workbench/package.json |
| [@radix-ui/react-scroll-area](https://registry.npmjs.org/%40radix-ui%2Freact-scroll-area/latest) | 1.2.18 | 1.2.18 | current | artifacts/mermaid-theme-workbench/package.json |
| [@radix-ui/react-select](https://registry.npmjs.org/%40radix-ui%2Freact-select/latest) | 2.3.7 | 2.3.7 | current | artifacts/mermaid-theme-workbench/package.json |
| [@radix-ui/react-separator](https://registry.npmjs.org/%40radix-ui%2Freact-separator/latest) | 1.1.15 | 1.1.15 | current | artifacts/mermaid-theme-workbench/package.json |
| [@radix-ui/react-slider](https://registry.npmjs.org/%40radix-ui%2Freact-slider/latest) | 1.4.7 | 1.4.7 | current | artifacts/mermaid-theme-workbench/package.json |
| [@radix-ui/react-slot](https://registry.npmjs.org/%40radix-ui%2Freact-slot/latest) | 1.3.3 | 1.3.3 | current | artifacts/mermaid-theme-workbench/package.json |
| [@radix-ui/react-switch](https://registry.npmjs.org/%40radix-ui%2Freact-switch/latest) | 1.3.7 | 1.3.7 | current | artifacts/mermaid-theme-workbench/package.json |
| [@radix-ui/react-tabs](https://registry.npmjs.org/%40radix-ui%2Freact-tabs/latest) | 1.1.21 | 1.1.21 | current | artifacts/mermaid-theme-workbench/package.json |
| [@radix-ui/react-toast](https://registry.npmjs.org/%40radix-ui%2Freact-toast/latest) | 1.2.23 | 1.2.23 | current | artifacts/mermaid-theme-workbench/package.json |
| [@radix-ui/react-toggle](https://registry.npmjs.org/%40radix-ui%2Freact-toggle/latest) | 1.1.18 | 1.1.18 | current | artifacts/mermaid-theme-workbench/package.json |
| [@radix-ui/react-toggle-group](https://registry.npmjs.org/%40radix-ui%2Freact-toggle-group/latest) | 1.1.19 | 1.1.19 | current | artifacts/mermaid-theme-workbench/package.json |
| [@radix-ui/react-tooltip](https://registry.npmjs.org/%40radix-ui%2Freact-tooltip/latest) | 1.2.16 | 1.2.16 | current | artifacts/mermaid-theme-workbench/package.json |
| [@replit/vite-plugin-cartographer](https://registry.npmjs.org/%40replit%2Fvite-plugin-cartographer/latest) | 0.6.1 | 0.6.1 | current | artifacts/mermaid-theme-workbench/package.json |
| [@replit/vite-plugin-dev-banner](https://registry.npmjs.org/%40replit%2Fvite-plugin-dev-banner/latest) | 0.1.2 | 0.1.2 | current | artifacts/mermaid-theme-workbench/package.json |
| [@replit/vite-plugin-runtime-error-modal](https://registry.npmjs.org/%40replit%2Fvite-plugin-runtime-error-modal/latest) | 0.0.6 | 0.0.6 | current | artifacts/mermaid-theme-workbench/package.json |
| [@tailwindcss/typography](https://registry.npmjs.org/%40tailwindcss%2Ftypography/latest) | 0.5.20 | 0.5.20 | current | artifacts/mermaid-theme-workbench/package.json |
| [@tailwindcss/vite](https://registry.npmjs.org/%40tailwindcss%2Fvite/latest) | 4.3.2 | 4.3.3 | update-available | artifacts/mermaid-theme-workbench/package.json |
| [@tanstack/react-query](https://registry.npmjs.org/%40tanstack%2Freact-query/latest) | 5.101.4 | 5.103.1 | update-available | artifacts/mermaid-theme-workbench/package.json |
| [@types/node](https://registry.npmjs.org/%40types%2Fnode/latest) | 26.4.0 | 26.6.2 | update-available | artifacts/mermaid-theme-workbench/package.json |
| [@types/react](https://registry.npmjs.org/%40types%2Freact/latest) | 19.2.18 | 19.3.0 | update-available | artifacts/mermaid-theme-workbench/package.json |
| [@types/react-dom](https://registry.npmjs.org/%40types%2Freact-dom/latest) | 19.2.3 | 19.3.0 | update-available | artifacts/mermaid-theme-workbench/package.json |
| [@vitejs/plugin-react](https://registry.npmjs.org/%40vitejs%2Fplugin-react/latest) | 6.0.5 | 6.1.1 | update-available | artifacts/mermaid-theme-workbench/package.json |
| [class-variance-authority](https://registry.npmjs.org/class-variance-authority/latest) | 0.7.1 | 0.7.1 | current | artifacts/mermaid-theme-workbench/package.json |
| [clsx](https://registry.npmjs.org/clsx/latest) | 2.1.1 | 2.1.1 | current | artifacts/mermaid-theme-workbench/package.json |
| [cmdk](https://registry.npmjs.org/cmdk/latest) | 1.1.1 | 1.1.1 | current | artifacts/mermaid-theme-workbench/package.json |
| [date-fns](https://registry.npmjs.org/date-fns/latest) | 3.6.0 | 4.4.0 | update-available | artifacts/mermaid-theme-workbench/package.json |
| [embla-carousel-react](https://registry.npmjs.org/embla-carousel-react/latest) | 8.6.0 | 8.6.0 | current | artifacts/mermaid-theme-workbench/package.json |
| [framer-motion](https://registry.npmjs.org/framer-motion/latest) | 13.1.0 | 13.4.0 | update-available | artifacts/mermaid-theme-workbench/package.json |
| [input-otp](https://registry.npmjs.org/input-otp/latest) | 1.5.0 | 1.5.0 | current | artifacts/mermaid-theme-workbench/package.json |
| [lucide-react](https://registry.npmjs.org/lucide-react/latest) | 1.33.0 | 1.47.0 | update-available | artifacts/mermaid-theme-workbench/package.json |
| [next-themes](https://registry.npmjs.org/next-themes/latest) | 0.4.6 | 0.4.6 | current | artifacts/mermaid-theme-workbench/package.json |
| [react](https://registry.npmjs.org/react/latest) | 19.2.8 | 19.3.0 | update-available | artifacts/mermaid-theme-workbench/package.json |
| [react-day-picker](https://registry.npmjs.org/react-day-picker/latest) | 9.14.0 | 10.0.1 | update-available | artifacts/mermaid-theme-workbench/package.json |
| [react-dom](https://registry.npmjs.org/react-dom/latest) | 19.2.8 | 19.3.0 | update-available | artifacts/mermaid-theme-workbench/package.json |
| [react-hook-form](https://registry.npmjs.org/react-hook-form/latest) | 7.85.0 | 7.88.0 | update-available | artifacts/mermaid-theme-workbench/package.json |
| [react-icons](https://registry.npmjs.org/react-icons/latest) | 5.7.0 | 5.7.0 | current | artifacts/mermaid-theme-workbench/package.json |
| [react-resizable-panels](https://registry.npmjs.org/react-resizable-panels/latest) | 2.1.9 | 4.12.4 | update-available | artifacts/mermaid-theme-workbench/package.json |
| [recharts](https://registry.npmjs.org/recharts/latest) | 2.15.4 | 3.10.1 | update-available | artifacts/mermaid-theme-workbench/package.json |
| [sonner](https://registry.npmjs.org/sonner/latest) | 2.0.8 | 2.0.8 | current | artifacts/mermaid-theme-workbench/package.json |
| [tailwind-merge](https://registry.npmjs.org/tailwind-merge/latest) | 3.6.0 | 3.7.0 | update-available | artifacts/mermaid-theme-workbench/package.json |
| [tailwindcss](https://registry.npmjs.org/tailwindcss/latest) | 4.3.2 | 4.3.3 | update-available | artifacts/mermaid-theme-workbench/package.json |
| [tw-animate-css](https://registry.npmjs.org/tw-animate-css/latest) | 1.4.0 | 1.4.0 | current | artifacts/mermaid-theme-workbench/package.json |
| [vaul](https://registry.npmjs.org/vaul/latest) | 1.1.2 | 1.1.2 | current | artifacts/mermaid-theme-workbench/package.json |
| [vite](https://registry.npmjs.org/vite/latest) | 8.1.4 | 8.3.0 | update-available | artifacts/mermaid-theme-workbench/package.json |
| [wouter](https://registry.npmjs.org/wouter/latest) | 3.10.0 | 3.11.0 | update-available | artifacts/mermaid-theme-workbench/package.json |
| [zod](https://registry.npmjs.org/zod/latest) | 4.4.3 | 4.6.5 | update-available | artifacts/mermaid-theme-workbench/package.json |
| [mermaid](https://registry.npmjs.org/mermaid/latest) | 11.16.0 | 12.0.0 | update-available | package.json |
| [@mermaid-js/mermaid-zenuml](https://registry.npmjs.org/%40mermaid-js%2Fmermaid-zenuml/latest) | 0.2.3 | 1.0.1 | update-available | package.json |
| [@napi-rs/canvas](https://registry.npmjs.org/%40napi-rs%2Fcanvas/latest) | 1.0.8 | 1.0.9 | update-available | package.json |
| [@playwright/test](https://registry.npmjs.org/%40playwright%2Ftest/latest) | 1.62.1 | 1.63.0 | update-available | package.json |
| [@replit/vite-plugin-cartographer](https://registry.npmjs.org/%40replit%2Fvite-plugin-cartographer/latest) | 0.6.1 | 0.6.1 | current | package.json |
| [@replit/vite-plugin-dev-banner](https://registry.npmjs.org/%40replit%2Fvite-plugin-dev-banner/latest) | 0.1.2 | 0.1.2 | current | package.json |
| [@replit/vite-plugin-runtime-error-modal](https://registry.npmjs.org/%40replit%2Fvite-plugin-runtime-error-modal/latest) | 0.0.6 | 0.0.6 | current | package.json |
| [@tailwindcss/oxide-win32-x64-msvc](https://registry.npmjs.org/%40tailwindcss%2Foxide-win32-x64-msvc/latest) | 4.3.3 | 4.3.3 | current | package.json |
| [@tailwindcss/vite](https://registry.npmjs.org/%40tailwindcss%2Fvite/latest) | 4.3.2 | 4.3.3 | update-available | package.json |
| [@testing-library/dom](https://registry.npmjs.org/%40testing-library%2Fdom/latest) | 10.4.1 | 10.4.2 | update-available | package.json |
| [@testing-library/react](https://registry.npmjs.org/%40testing-library%2Freact/latest) | 16.3.2 | 16.3.3 | update-available | package.json |
| [@types/node](https://registry.npmjs.org/%40types%2Fnode/latest) | 26.4.0 | 26.6.2 | update-available | package.json |
| [@types/react](https://registry.npmjs.org/%40types%2Freact/latest) | 19.2.18 | 19.3.0 | update-available | package.json |
| [@types/react-dom](https://registry.npmjs.org/%40types%2Freact-dom/latest) | 19.2.3 | 19.3.0 | update-available | package.json |
| [@vitejs/plugin-react](https://registry.npmjs.org/%40vitejs%2Fplugin-react/latest) | 6.0.5 | 6.1.1 | update-available | package.json |
| [axe-core](https://registry.npmjs.org/axe-core/latest) | 4.13.0 | 4.13.0 | current | package.json |
| [happy-dom](https://registry.npmjs.org/happy-dom/latest) | 20.10.6 | 20.14.5 | update-available | package.json |
| [lightningcss-win32-x64-msvc](https://registry.npmjs.org/lightningcss-win32-x64-msvc/latest) | 1.33.0 | 1.33.0 | current | package.json |
| [lint-staged](https://registry.npmjs.org/lint-staged/latest) | 17.0.8 | 17.5.1 | update-available | package.json |
| [pngjs](https://registry.npmjs.org/pngjs/latest) | 7.0.0 | 7.0.0 | current | package.json |
| [prettier](https://registry.npmjs.org/prettier/latest) | 3.9.6 | 3.9.8 | update-available | package.json |
| [react](https://registry.npmjs.org/react/latest) | 19.2.8 | 19.3.0 | update-available | package.json |
| [react-dom](https://registry.npmjs.org/react-dom/latest) | 19.2.8 | 19.3.0 | update-available | package.json |
| [simple-git-hooks](https://registry.npmjs.org/simple-git-hooks/latest) | 2.14.0 | 2.14.0 | current | package.json |
| [tailwindcss](https://registry.npmjs.org/tailwindcss/latest) | 4.3.2 | 4.3.3 | update-available | package.json |
| [tw-animate-css](https://registry.npmjs.org/tw-animate-css/latest) | 1.4.0 | 1.4.0 | current | package.json |
| [typescript](https://registry.npmjs.org/typescript/latest) | 7.0.2 | 7.0.2 | current | package.json |
| [vite](https://registry.npmjs.org/vite/latest) | 8.1.4 | 8.3.0 | update-available | package.json |
| [vitest](https://registry.npmjs.org/vitest/latest) | 4.1.10 | 5.0.1 | update-available | package.json |

## Unused workspace catalog entries

These are declarations, not evidence that the app uses these packages.

| Package | Declared range | Latest stable | Source |
| --- | --- | --- | --- |
| drizzle-orm | ^0.45.2 | 0.45.2 | https://registry.npmjs.org/drizzle-orm/latest |
| tsx | ^4.21.0 | 4.23.13 | https://registry.npmjs.org/tsx/latest |

## Internal packages

| Manifest | Name | Internal version |
| --- | --- | --- |
| .agents/skills/okhp3-as-is-process-capture/package.json | @bp-skill/as-is-process-capture | 0.1.0 |
| .agents/skills/okhp3-decision-model-authoring/package.json | @bp-skill/decision-model-authoring | 0.1.0 |
| .agents/skills/okhp3-elicitation-interviews/package.json | @bp-skill/elicitation-and-interview-facilitation | 0.1.0 |
| .agents/skills/okhp3-future-state-strategy/package.json | @bp-skill/future-state-and-change-strategy | 0.1.0 |
| .agents/skills/okhp3-handoff-packaging/package.json | @bp-skill/publication-and-handoff-packaging | 0.1.0 |
| .agents/skills/okhp3-process-gap-analysis/package.json | @bp-skill/process-gap-and-exception-analysis | 0.1.0 |
| .agents/skills/okhp3-process-intake-and-scope/package.json | @bp-skill/process-intake-and-scope | 0.1.0 |
| artifacts/mermaid-theme-builder/package.json | @workspace/mermaid-theme-builder-artifact | 0.5.0 |
| artifacts/mermaid-theme-workbench/package.json | @workspace/mermaid-theme-workbench | 0.0.0 |
| package.json | @workspace/mermaid-theme-builder | 0.6.2 |

## Complete lockfile package inventory

Includes direct, transitive, and optional platform packages. Upgrade through their parents and regenerate the lockfile; do not force every transitive package to its latest major.

| Package | Resolved | Latest stable | Status |
| --- | --- | --- | --- |
| [@alloc/quick-lru](https://registry.npmjs.org/%40alloc%2Fquick-lru/latest) | 5.2.0 | 5.3.0 | update-available |
| [@antfu/install-pkg](https://registry.npmjs.org/%40antfu%2Finstall-pkg/latest) | 1.1.0 | 2.1.0 | update-available |
| [@babel/code-frame](https://registry.npmjs.org/%40babel%2Fcode-frame/latest) | 7.29.0 | 8.0.6 | update-available |
| [@babel/generator](https://registry.npmjs.org/%40babel%2Fgenerator/latest) | 7.29.1 | 8.0.6 | update-available |
| [@babel/helper-globals](https://registry.npmjs.org/%40babel%2Fhelper-globals/latest) | 7.28.0 | 8.0.6 | update-available |
| [@babel/helper-string-parser](https://registry.npmjs.org/%40babel%2Fhelper-string-parser/latest) | 7.27.1 | 8.0.6 | update-available |
| [@babel/helper-validator-identifier](https://registry.npmjs.org/%40babel%2Fhelper-validator-identifier/latest) | 7.28.5 | 8.0.6 | update-available |
| [@babel/parser](https://registry.npmjs.org/%40babel%2Fparser/latest) | 7.29.0 | 7.29.9 | update-available |
| [@babel/runtime](https://registry.npmjs.org/%40babel%2Fruntime/latest) | 7.29.2 | 8.0.5 | update-available |
| [@babel/template](https://registry.npmjs.org/%40babel%2Ftemplate/latest) | 7.28.6 | 8.0.0 | update-available |
| [@babel/traverse](https://registry.npmjs.org/%40babel%2Ftraverse/latest) | 7.29.0 | 8.0.6 | update-available |
| [@babel/types](https://registry.npmjs.org/%40babel%2Ftypes/latest) | 7.29.0 | 8.0.6 | update-available |
| [@braintree/sanitize-url](https://registry.npmjs.org/%40braintree%2Fsanitize-url/latest) | 7.1.2 | 7.1.2 | current |
| [@chevrotain/types](https://registry.npmjs.org/%40chevrotain%2Ftypes/latest) | 11.1.2 | 13.2.0 | update-available |
| [@date-fns/tz](https://registry.npmjs.org/%40date-fns%2Ftz/latest) | 1.5.0 | 1.5.0 | current |
| [@emnapi/core](https://registry.npmjs.org/%40emnapi%2Fcore/latest) | 1.11.1 | 1.11.3 | update-available |
| [@emnapi/runtime](https://registry.npmjs.org/%40emnapi%2Fruntime/latest) | 1.11.1 | 1.11.3 | update-available |
| [@emnapi/wasi-threads](https://registry.npmjs.org/%40emnapi%2Fwasi-threads/latest) | 1.2.2 | 2.1.0 | update-available |
| [@floating-ui/core](https://registry.npmjs.org/%40floating-ui%2Fcore/latest) | 1.7.5 | 1.8.0 | update-available |
| [@floating-ui/dom](https://registry.npmjs.org/%40floating-ui%2Fdom/latest) | 1.7.6 | 1.8.0 | update-available |
| [@floating-ui/react-dom](https://registry.npmjs.org/%40floating-ui%2Freact-dom/latest) | 2.1.8 | 2.1.9 | update-available |
| [@floating-ui/react](https://registry.npmjs.org/%40floating-ui%2Freact/latest) | 0.26.28 | 0.27.20 | update-available |
| [@floating-ui/react](https://registry.npmjs.org/%40floating-ui%2Freact/latest) | 0.27.19 | 0.27.20 | update-available |
| [@floating-ui/utils](https://registry.npmjs.org/%40floating-ui%2Futils/latest) | 0.2.11 | 0.2.12 | update-available |
| [@headlessui/react](https://registry.npmjs.org/%40headlessui%2Freact/latest) | 2.2.10 | 2.2.10 | current |
| [@headlessui/tailwindcss](https://registry.npmjs.org/%40headlessui%2Ftailwindcss/latest) | 0.2.2 | 0.2.2 | current |
| [@hookform/resolvers](https://registry.npmjs.org/%40hookform%2Fresolvers/latest) | 3.10.0 | 5.9.1 | update-available |
| [@iconify/types](https://registry.npmjs.org/%40iconify%2Ftypes/latest) | 2.0.0 | 2.0.0 | current |
| [@iconify/utils](https://registry.npmjs.org/%40iconify%2Futils/latest) | 3.1.1 | 3.1.7 | update-available |
| [@internationalized/date](https://registry.npmjs.org/%40internationalized%2Fdate/latest) | 3.12.2 | 3.12.4 | update-available |
| [@internationalized/number](https://registry.npmjs.org/%40internationalized%2Fnumber/latest) | 3.6.7 | 3.6.8 | update-available |
| [@internationalized/string](https://registry.npmjs.org/%40internationalized%2Fstring/latest) | 3.2.9 | 3.2.10 | update-available |
| [@jridgewell/gen-mapping](https://registry.npmjs.org/%40jridgewell%2Fgen-mapping/latest) | 0.3.13 | 0.3.13 | current |
| [@jridgewell/remapping](https://registry.npmjs.org/%40jridgewell%2Fremapping/latest) | 2.3.5 | 2.3.5 | current |
| [@jridgewell/resolve-uri](https://registry.npmjs.org/%40jridgewell%2Fresolve-uri/latest) | 3.1.2 | 3.1.2 | current |
| [@jridgewell/sourcemap-codec](https://registry.npmjs.org/%40jridgewell%2Fsourcemap-codec/latest) | 1.5.5 | 1.6.0 | update-available |
| [@jridgewell/trace-mapping](https://registry.npmjs.org/%40jridgewell%2Ftrace-mapping/latest) | 0.3.31 | 0.3.31 | current |
| [@mermaid-js/mermaid-zenuml](https://registry.npmjs.org/%40mermaid-js%2Fmermaid-zenuml/latest) | 0.2.3 | 1.0.1 | update-available |
| [@mermaid-js/parser](https://registry.npmjs.org/%40mermaid-js%2Fparser/latest) | 1.2.0 | 2.0.0 | update-available |
| [@napi-rs/canvas-android-arm64](https://registry.npmjs.org/%40napi-rs%2Fcanvas-android-arm64/latest) | 0.1.100 | 1.0.9 | update-available |
| [@napi-rs/canvas-android-arm64](https://registry.npmjs.org/%40napi-rs%2Fcanvas-android-arm64/latest) | 1.0.8 | 1.0.9 | update-available |
| [@napi-rs/canvas-darwin-arm64](https://registry.npmjs.org/%40napi-rs%2Fcanvas-darwin-arm64/latest) | 0.1.100 | 1.0.9 | update-available |
| [@napi-rs/canvas-darwin-arm64](https://registry.npmjs.org/%40napi-rs%2Fcanvas-darwin-arm64/latest) | 1.0.8 | 1.0.9 | update-available |
| [@napi-rs/canvas-darwin-x64](https://registry.npmjs.org/%40napi-rs%2Fcanvas-darwin-x64/latest) | 0.1.100 | 1.0.9 | update-available |
| [@napi-rs/canvas-darwin-x64](https://registry.npmjs.org/%40napi-rs%2Fcanvas-darwin-x64/latest) | 1.0.8 | 1.0.9 | update-available |
| [@napi-rs/canvas-linux-arm-gnueabihf](https://registry.npmjs.org/%40napi-rs%2Fcanvas-linux-arm-gnueabihf/latest) | 0.1.100 | 1.0.9 | update-available |
| [@napi-rs/canvas-linux-arm-gnueabihf](https://registry.npmjs.org/%40napi-rs%2Fcanvas-linux-arm-gnueabihf/latest) | 1.0.8 | 1.0.9 | update-available |
| [@napi-rs/canvas-linux-arm64-gnu](https://registry.npmjs.org/%40napi-rs%2Fcanvas-linux-arm64-gnu/latest) | 0.1.100 | 1.0.9 | update-available |
| [@napi-rs/canvas-linux-arm64-gnu](https://registry.npmjs.org/%40napi-rs%2Fcanvas-linux-arm64-gnu/latest) | 1.0.8 | 1.0.9 | update-available |
| [@napi-rs/canvas-linux-arm64-musl](https://registry.npmjs.org/%40napi-rs%2Fcanvas-linux-arm64-musl/latest) | 0.1.100 | 1.0.9 | update-available |
| [@napi-rs/canvas-linux-arm64-musl](https://registry.npmjs.org/%40napi-rs%2Fcanvas-linux-arm64-musl/latest) | 1.0.8 | 1.0.9 | update-available |
| [@napi-rs/canvas-linux-riscv64-gnu](https://registry.npmjs.org/%40napi-rs%2Fcanvas-linux-riscv64-gnu/latest) | 0.1.100 | 1.0.9 | update-available |
| [@napi-rs/canvas-linux-riscv64-gnu](https://registry.npmjs.org/%40napi-rs%2Fcanvas-linux-riscv64-gnu/latest) | 1.0.8 | 1.0.9 | update-available |
| [@napi-rs/canvas-linux-x64-gnu](https://registry.npmjs.org/%40napi-rs%2Fcanvas-linux-x64-gnu/latest) | 0.1.100 | 1.0.9 | update-available |
| [@napi-rs/canvas-linux-x64-gnu](https://registry.npmjs.org/%40napi-rs%2Fcanvas-linux-x64-gnu/latest) | 1.0.8 | 1.0.9 | update-available |
| [@napi-rs/canvas-linux-x64-musl](https://registry.npmjs.org/%40napi-rs%2Fcanvas-linux-x64-musl/latest) | 0.1.100 | 1.0.9 | update-available |
| [@napi-rs/canvas-linux-x64-musl](https://registry.npmjs.org/%40napi-rs%2Fcanvas-linux-x64-musl/latest) | 1.0.8 | 1.0.9 | update-available |
| [@napi-rs/canvas-win32-arm64-msvc](https://registry.npmjs.org/%40napi-rs%2Fcanvas-win32-arm64-msvc/latest) | 0.1.100 | 1.0.9 | update-available |
| [@napi-rs/canvas-win32-arm64-msvc](https://registry.npmjs.org/%40napi-rs%2Fcanvas-win32-arm64-msvc/latest) | 1.0.8 | 1.0.9 | update-available |
| [@napi-rs/canvas-win32-x64-msvc](https://registry.npmjs.org/%40napi-rs%2Fcanvas-win32-x64-msvc/latest) | 0.1.100 | 1.0.9 | update-available |
| [@napi-rs/canvas-win32-x64-msvc](https://registry.npmjs.org/%40napi-rs%2Fcanvas-win32-x64-msvc/latest) | 1.0.8 | 1.0.9 | update-available |
| [@napi-rs/canvas](https://registry.npmjs.org/%40napi-rs%2Fcanvas/latest) | 0.1.100 | 1.0.9 | update-available |
| [@napi-rs/canvas](https://registry.npmjs.org/%40napi-rs%2Fcanvas/latest) | 1.0.8 | 1.0.9 | update-available |
| [@napi-rs/wasm-runtime](https://registry.npmjs.org/%40napi-rs%2Fwasm-runtime/latest) | 1.1.6 | 1.2.4 | update-available |
| [@nodelib/fs.scandir](https://registry.npmjs.org/%40nodelib%2Ffs.scandir/latest) | 2.1.5 | 4.0.1 | update-available |
| [@nodelib/fs.stat](https://registry.npmjs.org/%40nodelib%2Ffs.stat/latest) | 2.0.5 | 4.0.0 | update-available |
| [@nodelib/fs.walk](https://registry.npmjs.org/%40nodelib%2Ffs.walk/latest) | 1.2.8 | 3.0.1 | update-available |
| [@oxc-project/types](https://registry.npmjs.org/%40oxc-project%2Ftypes/latest) | 0.139.0 | 0.150.0 | update-available |
| [@playwright/test](https://registry.npmjs.org/%40playwright%2Ftest/latest) | 1.62.1 | 1.63.0 | update-available |
| [@radix-ui/number](https://registry.npmjs.org/%40radix-ui%2Fnumber/latest) | 1.1.3 | 1.1.3 | current |
| [@radix-ui/primitive](https://registry.npmjs.org/%40radix-ui%2Fprimitive/latest) | 1.1.7 | 1.1.7 | current |
| [@radix-ui/react-accordion](https://registry.npmjs.org/%40radix-ui%2Freact-accordion/latest) | 1.2.20 | 1.2.20 | current |
| [@radix-ui/react-alert-dialog](https://registry.npmjs.org/%40radix-ui%2Freact-alert-dialog/latest) | 1.1.23 | 1.1.23 | current |
| [@radix-ui/react-arrow](https://registry.npmjs.org/%40radix-ui%2Freact-arrow/latest) | 1.1.15 | 1.1.15 | current |
| [@radix-ui/react-aspect-ratio](https://registry.npmjs.org/%40radix-ui%2Freact-aspect-ratio/latest) | 1.1.15 | 1.1.15 | current |
| [@radix-ui/react-avatar](https://registry.npmjs.org/%40radix-ui%2Freact-avatar/latest) | 1.2.6 | 1.2.6 | current |
| [@radix-ui/react-checkbox](https://registry.npmjs.org/%40radix-ui%2Freact-checkbox/latest) | 1.3.11 | 1.3.11 | current |
| [@radix-ui/react-collapsible](https://registry.npmjs.org/%40radix-ui%2Freact-collapsible/latest) | 1.1.20 | 1.1.20 | current |
| [@radix-ui/react-collection](https://registry.npmjs.org/%40radix-ui%2Freact-collection/latest) | 1.1.15 | 1.1.15 | current |
| [@radix-ui/react-compose-refs](https://registry.npmjs.org/%40radix-ui%2Freact-compose-refs/latest) | 1.1.5 | 1.1.5 | current |
| [@radix-ui/react-context-menu](https://registry.npmjs.org/%40radix-ui%2Freact-context-menu/latest) | 2.3.7 | 2.3.7 | current |
| [@radix-ui/react-context](https://registry.npmjs.org/%40radix-ui%2Freact-context/latest) | 1.2.2 | 1.2.2 | current |
| [@radix-ui/react-dialog](https://registry.npmjs.org/%40radix-ui%2Freact-dialog/latest) | 1.1.23 | 1.1.23 | current |
| [@radix-ui/react-direction](https://registry.npmjs.org/%40radix-ui%2Freact-direction/latest) | 1.1.4 | 1.1.4 | current |
| [@radix-ui/react-dismissable-layer](https://registry.npmjs.org/%40radix-ui%2Freact-dismissable-layer/latest) | 1.1.19 | 1.1.19 | current |
| [@radix-ui/react-dropdown-menu](https://registry.npmjs.org/%40radix-ui%2Freact-dropdown-menu/latest) | 2.1.24 | 2.1.24 | current |
| [@radix-ui/react-focus-guards](https://registry.npmjs.org/%40radix-ui%2Freact-focus-guards/latest) | 1.1.6 | 1.1.6 | current |
| [@radix-ui/react-focus-scope](https://registry.npmjs.org/%40radix-ui%2Freact-focus-scope/latest) | 1.1.16 | 1.1.16 | current |
| [@radix-ui/react-hover-card](https://registry.npmjs.org/%40radix-ui%2Freact-hover-card/latest) | 1.1.23 | 1.1.23 | current |
| [@radix-ui/react-id](https://registry.npmjs.org/%40radix-ui%2Freact-id/latest) | 1.1.4 | 1.1.4 | current |
| [@radix-ui/react-label](https://registry.npmjs.org/%40radix-ui%2Freact-label/latest) | 2.1.15 | 2.1.15 | current |
| [@radix-ui/react-menu](https://registry.npmjs.org/%40radix-ui%2Freact-menu/latest) | 2.1.24 | 2.1.24 | current |
| [@radix-ui/react-menubar](https://registry.npmjs.org/%40radix-ui%2Freact-menubar/latest) | 1.1.24 | 1.1.24 | current |
| [@radix-ui/react-navigation-menu](https://registry.npmjs.org/%40radix-ui%2Freact-navigation-menu/latest) | 1.2.22 | 1.2.22 | current |
| [@radix-ui/react-popover](https://registry.npmjs.org/%40radix-ui%2Freact-popover/latest) | 1.1.23 | 1.1.23 | current |
| [@radix-ui/react-popper](https://registry.npmjs.org/%40radix-ui%2Freact-popper/latest) | 1.3.7 | 1.3.7 | current |
| [@radix-ui/react-portal](https://registry.npmjs.org/%40radix-ui%2Freact-portal/latest) | 1.1.17 | 1.1.17 | current |
| [@radix-ui/react-presence](https://registry.npmjs.org/%40radix-ui%2Freact-presence/latest) | 1.1.10 | 1.1.10 | current |
| [@radix-ui/react-primitive](https://registry.npmjs.org/%40radix-ui%2Freact-primitive/latest) | 2.1.10 | 2.1.10 | current |
| [@radix-ui/react-progress](https://registry.npmjs.org/%40radix-ui%2Freact-progress/latest) | 1.1.16 | 1.1.16 | current |
| [@radix-ui/react-radio-group](https://registry.npmjs.org/%40radix-ui%2Freact-radio-group/latest) | 1.4.7 | 1.4.7 | current |
| [@radix-ui/react-roving-focus](https://registry.npmjs.org/%40radix-ui%2Freact-roving-focus/latest) | 1.1.19 | 1.1.19 | current |
| [@radix-ui/react-scroll-area](https://registry.npmjs.org/%40radix-ui%2Freact-scroll-area/latest) | 1.2.18 | 1.2.18 | current |
| [@radix-ui/react-select](https://registry.npmjs.org/%40radix-ui%2Freact-select/latest) | 2.3.7 | 2.3.7 | current |
| [@radix-ui/react-separator](https://registry.npmjs.org/%40radix-ui%2Freact-separator/latest) | 1.1.15 | 1.1.15 | current |
| [@radix-ui/react-slider](https://registry.npmjs.org/%40radix-ui%2Freact-slider/latest) | 1.4.7 | 1.4.7 | current |
| [@radix-ui/react-slot](https://registry.npmjs.org/%40radix-ui%2Freact-slot/latest) | 1.3.3 | 1.3.3 | current |
| [@radix-ui/react-switch](https://registry.npmjs.org/%40radix-ui%2Freact-switch/latest) | 1.3.7 | 1.3.7 | current |
| [@radix-ui/react-tabs](https://registry.npmjs.org/%40radix-ui%2Freact-tabs/latest) | 1.1.21 | 1.1.21 | current |
| [@radix-ui/react-toast](https://registry.npmjs.org/%40radix-ui%2Freact-toast/latest) | 1.2.23 | 1.2.23 | current |
| [@radix-ui/react-toggle-group](https://registry.npmjs.org/%40radix-ui%2Freact-toggle-group/latest) | 1.1.19 | 1.1.19 | current |
| [@radix-ui/react-toggle](https://registry.npmjs.org/%40radix-ui%2Freact-toggle/latest) | 1.1.18 | 1.1.18 | current |
| [@radix-ui/react-tooltip](https://registry.npmjs.org/%40radix-ui%2Freact-tooltip/latest) | 1.2.16 | 1.2.16 | current |
| [@radix-ui/react-use-callback-ref](https://registry.npmjs.org/%40radix-ui%2Freact-use-callback-ref/latest) | 1.1.4 | 1.1.4 | current |
| [@radix-ui/react-use-controllable-state](https://registry.npmjs.org/%40radix-ui%2Freact-use-controllable-state/latest) | 1.2.6 | 1.2.6 | current |
| [@radix-ui/react-use-effect-event](https://registry.npmjs.org/%40radix-ui%2Freact-use-effect-event/latest) | 0.0.5 | 0.0.5 | current |
| [@radix-ui/react-use-is-hydrated](https://registry.npmjs.org/%40radix-ui%2Freact-use-is-hydrated/latest) | 0.1.3 | 0.1.3 | current |
| [@radix-ui/react-use-layout-effect](https://registry.npmjs.org/%40radix-ui%2Freact-use-layout-effect/latest) | 1.1.4 | 1.1.4 | current |
| [@radix-ui/react-use-previous](https://registry.npmjs.org/%40radix-ui%2Freact-use-previous/latest) | 1.1.4 | 1.1.4 | current |
| [@radix-ui/react-use-rect](https://registry.npmjs.org/%40radix-ui%2Freact-use-rect/latest) | 1.1.4 | 1.1.4 | current |
| [@radix-ui/react-use-size](https://registry.npmjs.org/%40radix-ui%2Freact-use-size/latest) | 1.1.4 | 1.1.4 | current |
| [@radix-ui/react-visually-hidden](https://registry.npmjs.org/%40radix-ui%2Freact-visually-hidden/latest) | 1.2.11 | 1.2.11 | current |
| [@radix-ui/rect](https://registry.npmjs.org/%40radix-ui%2Frect/latest) | 1.1.3 | 1.1.3 | current |
| [@react-aria/focus](https://registry.npmjs.org/%40react-aria%2Ffocus/latest) | 3.22.1 | 3.22.1 | current |
| [@react-aria/interactions](https://registry.npmjs.org/%40react-aria%2Finteractions/latest) | 3.28.1 | 3.28.1 | current |
| [@react-types/shared](https://registry.npmjs.org/%40react-types%2Fshared/latest) | 3.35.0 | 3.36.1 | update-available |
| [@replit/vite-plugin-cartographer](https://registry.npmjs.org/%40replit%2Fvite-plugin-cartographer/latest) | 0.6.1 | 0.6.1 | current |
| [@replit/vite-plugin-dev-banner](https://registry.npmjs.org/%40replit%2Fvite-plugin-dev-banner/latest) | 0.1.2 | 0.1.2 | current |
| [@replit/vite-plugin-runtime-error-modal](https://registry.npmjs.org/%40replit%2Fvite-plugin-runtime-error-modal/latest) | 0.0.6 | 0.0.6 | current |
| [@rolldown/binding-android-arm64](https://registry.npmjs.org/%40rolldown%2Fbinding-android-arm64/latest) | 1.1.5 | 1.2.9 | update-available |
| [@rolldown/binding-darwin-arm64](https://registry.npmjs.org/%40rolldown%2Fbinding-darwin-arm64/latest) | 1.1.5 | 1.2.9 | update-available |
| [@rolldown/binding-darwin-x64](https://registry.npmjs.org/%40rolldown%2Fbinding-darwin-x64/latest) | 1.1.5 | 1.2.9 | update-available |
| [@rolldown/binding-freebsd-x64](https://registry.npmjs.org/%40rolldown%2Fbinding-freebsd-x64/latest) | 1.1.5 | 1.2.9 | update-available |
| [@rolldown/binding-linux-arm-gnueabihf](https://registry.npmjs.org/%40rolldown%2Fbinding-linux-arm-gnueabihf/latest) | 1.1.5 | 1.2.9 | update-available |
| [@rolldown/binding-linux-arm64-gnu](https://registry.npmjs.org/%40rolldown%2Fbinding-linux-arm64-gnu/latest) | 1.1.5 | 1.2.9 | update-available |
| [@rolldown/binding-linux-arm64-musl](https://registry.npmjs.org/%40rolldown%2Fbinding-linux-arm64-musl/latest) | 1.1.5 | 1.2.9 | update-available |
| [@rolldown/binding-linux-ppc64-gnu](https://registry.npmjs.org/%40rolldown%2Fbinding-linux-ppc64-gnu/latest) | 1.1.5 | 1.2.9 | update-available |
| [@rolldown/binding-linux-s390x-gnu](https://registry.npmjs.org/%40rolldown%2Fbinding-linux-s390x-gnu/latest) | 1.1.5 | 1.2.9 | update-available |
| [@rolldown/binding-linux-x64-gnu](https://registry.npmjs.org/%40rolldown%2Fbinding-linux-x64-gnu/latest) | 1.1.5 | 1.2.9 | update-available |
| [@rolldown/binding-linux-x64-musl](https://registry.npmjs.org/%40rolldown%2Fbinding-linux-x64-musl/latest) | 1.1.5 | 1.2.9 | update-available |
| [@rolldown/binding-openharmony-arm64](https://registry.npmjs.org/%40rolldown%2Fbinding-openharmony-arm64/latest) | 1.1.5 | 1.2.9 | update-available |
| [@rolldown/binding-wasm32-wasi](https://registry.npmjs.org/%40rolldown%2Fbinding-wasm32-wasi/latest) | 1.1.5 | 1.2.9 | update-available |
| [@rolldown/binding-win32-arm64-msvc](https://registry.npmjs.org/%40rolldown%2Fbinding-win32-arm64-msvc/latest) | 1.1.5 | 1.2.9 | update-available |
| [@rolldown/binding-win32-x64-msvc](https://registry.npmjs.org/%40rolldown%2Fbinding-win32-x64-msvc/latest) | 1.1.5 | 1.2.9 | update-available |
| [@rolldown/pluginutils](https://registry.npmjs.org/%40rolldown%2Fpluginutils/latest) | 1.0.1 | 1.0.1 | current |
| [@standard-schema/spec](https://registry.npmjs.org/%40standard-schema%2Fspec/latest) | 1.1.0 | 1.1.0 | current |
| [@swc/helpers](https://registry.npmjs.org/%40swc%2Fhelpers/latest) | 0.5.23 | 0.5.23 | current |
| [@tabby_ai/hijri-converter](https://registry.npmjs.org/%40tabby_ai%2Fhijri-converter/latest) | 1.0.5 | 1.0.5 | current |
| [@tailwindcss/node](https://registry.npmjs.org/%40tailwindcss%2Fnode/latest) | 4.3.2 | 4.3.3 | update-available |
| [@tailwindcss/oxide-linux-x64-gnu](https://registry.npmjs.org/%40tailwindcss%2Foxide-linux-x64-gnu/latest) | 4.3.2 | 4.3.3 | update-available |
| [@tailwindcss/oxide-wasm32-wasi](https://registry.npmjs.org/%40tailwindcss%2Foxide-wasm32-wasi/latest) | 4.3.2 | 4.3.3 | update-available |
| [@tailwindcss/oxide-win32-x64-msvc](https://registry.npmjs.org/%40tailwindcss%2Foxide-win32-x64-msvc/latest) | 4.3.3 | 4.3.3 | current |
| [@tailwindcss/oxide](https://registry.npmjs.org/%40tailwindcss%2Foxide/latest) | 4.3.2 | 4.3.3 | update-available |
| [@tailwindcss/typography](https://registry.npmjs.org/%40tailwindcss%2Ftypography/latest) | 0.5.20 | 0.5.20 | current |
| [@tailwindcss/vite](https://registry.npmjs.org/%40tailwindcss%2Fvite/latest) | 4.3.2 | 4.3.3 | update-available |
| [@tanstack/query-core](https://registry.npmjs.org/%40tanstack%2Fquery-core/latest) | 5.101.4 | 5.103.1 | update-available |
| [@tanstack/react-query](https://registry.npmjs.org/%40tanstack%2Freact-query/latest) | 5.101.4 | 5.103.1 | update-available |
| [@tanstack/react-virtual](https://registry.npmjs.org/%40tanstack%2Freact-virtual/latest) | 3.13.26 | 3.14.13 | update-available |
| [@tanstack/virtual-core](https://registry.npmjs.org/%40tanstack%2Fvirtual-core/latest) | 3.16.0 | 3.17.11 | update-available |
| [@testing-library/dom](https://registry.npmjs.org/%40testing-library%2Fdom/latest) | 10.4.1 | 10.4.2 | update-available |
| [@testing-library/react](https://registry.npmjs.org/%40testing-library%2Freact/latest) | 16.3.2 | 16.3.3 | update-available |
| [@tybys/wasm-util](https://registry.npmjs.org/%40tybys%2Fwasm-util/latest) | 0.10.3 | 0.10.4 | update-available |
| [@types/aria-query](https://registry.npmjs.org/%40types%2Faria-query/latest) | 5.0.4 | 5.0.4 | current |
| [@types/chai](https://registry.npmjs.org/%40types%2Fchai/latest) | 5.2.3 | 5.2.3 | current |
| [@types/d3-array](https://registry.npmjs.org/%40types%2Fd3-array/latest) | 3.2.2 | 3.2.2 | current |
| [@types/d3-axis](https://registry.npmjs.org/%40types%2Fd3-axis/latest) | 3.0.6 | 3.0.6 | current |
| [@types/d3-brush](https://registry.npmjs.org/%40types%2Fd3-brush/latest) | 3.0.6 | 3.0.6 | current |
| [@types/d3-chord](https://registry.npmjs.org/%40types%2Fd3-chord/latest) | 3.0.6 | 3.0.6 | current |
| [@types/d3-color](https://registry.npmjs.org/%40types%2Fd3-color/latest) | 3.1.3 | 3.1.3 | current |
| [@types/d3-contour](https://registry.npmjs.org/%40types%2Fd3-contour/latest) | 3.0.6 | 3.0.6 | current |
| [@types/d3-delaunay](https://registry.npmjs.org/%40types%2Fd3-delaunay/latest) | 6.0.4 | 6.0.4 | current |
| [@types/d3-dispatch](https://registry.npmjs.org/%40types%2Fd3-dispatch/latest) | 3.0.7 | 3.0.7 | current |
| [@types/d3-drag](https://registry.npmjs.org/%40types%2Fd3-drag/latest) | 3.0.7 | 3.0.7 | current |
| [@types/d3-dsv](https://registry.npmjs.org/%40types%2Fd3-dsv/latest) | 3.0.7 | 3.0.7 | current |
| [@types/d3-ease](https://registry.npmjs.org/%40types%2Fd3-ease/latest) | 3.0.2 | 3.0.2 | current |
| [@types/d3-fetch](https://registry.npmjs.org/%40types%2Fd3-fetch/latest) | 3.0.7 | 3.0.7 | current |
| [@types/d3-force](https://registry.npmjs.org/%40types%2Fd3-force/latest) | 3.0.10 | 3.0.10 | current |
| [@types/d3-format](https://registry.npmjs.org/%40types%2Fd3-format/latest) | 3.0.4 | 3.0.4 | current |
| [@types/d3-geo](https://registry.npmjs.org/%40types%2Fd3-geo/latest) | 3.1.0 | 3.1.1 | update-available |
| [@types/d3-hierarchy](https://registry.npmjs.org/%40types%2Fd3-hierarchy/latest) | 3.1.7 | 3.1.7 | current |
| [@types/d3-interpolate](https://registry.npmjs.org/%40types%2Fd3-interpolate/latest) | 3.0.4 | 3.0.4 | current |
| [@types/d3-path](https://registry.npmjs.org/%40types%2Fd3-path/latest) | 3.1.1 | 3.1.1 | current |
| [@types/d3-polygon](https://registry.npmjs.org/%40types%2Fd3-polygon/latest) | 3.0.2 | 3.0.2 | current |
| [@types/d3-quadtree](https://registry.npmjs.org/%40types%2Fd3-quadtree/latest) | 3.0.6 | 3.0.6 | current |
| [@types/d3-random](https://registry.npmjs.org/%40types%2Fd3-random/latest) | 3.0.3 | 3.0.4 | update-available |
| [@types/d3-scale-chromatic](https://registry.npmjs.org/%40types%2Fd3-scale-chromatic/latest) | 3.1.0 | 3.1.0 | current |
| [@types/d3-scale](https://registry.npmjs.org/%40types%2Fd3-scale/latest) | 4.0.9 | 4.0.9 | current |
| [@types/d3-selection](https://registry.npmjs.org/%40types%2Fd3-selection/latest) | 3.0.11 | 3.0.12 | update-available |
| [@types/d3-shape](https://registry.npmjs.org/%40types%2Fd3-shape/latest) | 3.1.8 | 3.2.0 | update-available |
| [@types/d3-time-format](https://registry.npmjs.org/%40types%2Fd3-time-format/latest) | 4.0.3 | 4.0.3 | current |
| [@types/d3-time](https://registry.npmjs.org/%40types%2Fd3-time/latest) | 3.0.4 | 3.0.4 | current |
| [@types/d3-timer](https://registry.npmjs.org/%40types%2Fd3-timer/latest) | 3.0.2 | 3.0.2 | current |
| [@types/d3-transition](https://registry.npmjs.org/%40types%2Fd3-transition/latest) | 3.0.9 | 3.0.9 | current |
| [@types/d3-zoom](https://registry.npmjs.org/%40types%2Fd3-zoom/latest) | 3.0.8 | 3.0.8 | current |
| [@types/d3](https://registry.npmjs.org/%40types%2Fd3/latest) | 7.4.3 | 7.4.3 | current |
| [@types/deep-eql](https://registry.npmjs.org/%40types%2Fdeep-eql/latest) | 4.0.2 | 4.0.2 | current |
| [@types/estree](https://registry.npmjs.org/%40types%2Festree/latest) | 1.0.9 | 1.0.9 | current |
| [@types/geojson](https://registry.npmjs.org/%40types%2Fgeojson/latest) | 7946.0.16 | 7946.0.16 | current |
| [@types/node](https://registry.npmjs.org/%40types%2Fnode/latest) | 26.4.0 | 26.6.2 | update-available |
| [@types/react-dom](https://registry.npmjs.org/%40types%2Freact-dom/latest) | 19.2.3 | 19.3.0 | update-available |
| [@types/react](https://registry.npmjs.org/%40types%2Freact/latest) | 19.2.18 | 19.3.0 | update-available |
| [@types/trusted-types](https://registry.npmjs.org/%40types%2Ftrusted-types/latest) | 2.0.7 | 2.0.7 | current |
| [@types/whatwg-mimetype](https://registry.npmjs.org/%40types%2Fwhatwg-mimetype/latest) | 3.0.2 | 5.0.0 | update-available |
| [@types/ws](https://registry.npmjs.org/%40types%2Fws/latest) | 8.18.1 | 8.18.1 | current |
| [@typescript/typescript-aix-ppc64](https://registry.npmjs.org/%40typescript%2Ftypescript-aix-ppc64/latest) | 7.0.2 | 7.0.2 | current |
| [@typescript/typescript-darwin-arm64](https://registry.npmjs.org/%40typescript%2Ftypescript-darwin-arm64/latest) | 7.0.2 | 7.0.2 | current |
| [@typescript/typescript-darwin-x64](https://registry.npmjs.org/%40typescript%2Ftypescript-darwin-x64/latest) | 7.0.2 | 7.0.2 | current |
| [@typescript/typescript-freebsd-arm64](https://registry.npmjs.org/%40typescript%2Ftypescript-freebsd-arm64/latest) | 7.0.2 | 7.0.2 | current |
| [@typescript/typescript-freebsd-x64](https://registry.npmjs.org/%40typescript%2Ftypescript-freebsd-x64/latest) | 7.0.2 | 7.0.2 | current |
| [@typescript/typescript-linux-arm64](https://registry.npmjs.org/%40typescript%2Ftypescript-linux-arm64/latest) | 7.0.2 | 7.0.2 | current |
| [@typescript/typescript-linux-arm](https://registry.npmjs.org/%40typescript%2Ftypescript-linux-arm/latest) | 7.0.2 | 7.0.2 | current |
| [@typescript/typescript-linux-loong64](https://registry.npmjs.org/%40typescript%2Ftypescript-linux-loong64/latest) | 7.0.2 | 7.0.2 | current |
| [@typescript/typescript-linux-mips64el](https://registry.npmjs.org/%40typescript%2Ftypescript-linux-mips64el/latest) | 7.0.2 | 7.0.2 | current |
| [@typescript/typescript-linux-ppc64](https://registry.npmjs.org/%40typescript%2Ftypescript-linux-ppc64/latest) | 7.0.2 | 7.0.2 | current |
| [@typescript/typescript-linux-riscv64](https://registry.npmjs.org/%40typescript%2Ftypescript-linux-riscv64/latest) | 7.0.2 | 7.0.2 | current |
| [@typescript/typescript-linux-s390x](https://registry.npmjs.org/%40typescript%2Ftypescript-linux-s390x/latest) | 7.0.2 | 7.0.2 | current |
| [@typescript/typescript-linux-x64](https://registry.npmjs.org/%40typescript%2Ftypescript-linux-x64/latest) | 7.0.2 | 7.0.2 | current |
| [@typescript/typescript-netbsd-arm64](https://registry.npmjs.org/%40typescript%2Ftypescript-netbsd-arm64/latest) | 7.0.2 | 7.0.2 | current |
| [@typescript/typescript-netbsd-x64](https://registry.npmjs.org/%40typescript%2Ftypescript-netbsd-x64/latest) | 7.0.2 | 7.0.2 | current |
| [@typescript/typescript-openbsd-arm64](https://registry.npmjs.org/%40typescript%2Ftypescript-openbsd-arm64/latest) | 7.0.2 | 7.0.2 | current |
| [@typescript/typescript-openbsd-x64](https://registry.npmjs.org/%40typescript%2Ftypescript-openbsd-x64/latest) | 7.0.2 | 7.0.2 | current |
| [@typescript/typescript-sunos-x64](https://registry.npmjs.org/%40typescript%2Ftypescript-sunos-x64/latest) | 7.0.2 | 7.0.2 | current |
| [@typescript/typescript-win32-arm64](https://registry.npmjs.org/%40typescript%2Ftypescript-win32-arm64/latest) | 7.0.2 | 7.0.2 | current |
| [@typescript/typescript-win32-x64](https://registry.npmjs.org/%40typescript%2Ftypescript-win32-x64/latest) | 7.0.2 | 7.0.2 | current |
| [@upsetjs/venn.js](https://registry.npmjs.org/%40upsetjs%2Fvenn.js/latest) | 2.0.0 | 2.0.0 | current |
| [@vitejs/plugin-react](https://registry.npmjs.org/%40vitejs%2Fplugin-react/latest) | 6.0.5 | 6.1.1 | update-available |
| [@vitest/expect](https://registry.npmjs.org/%40vitest%2Fexpect/latest) | 4.1.10 | 5.0.1 | update-available |
| [@vitest/mocker](https://registry.npmjs.org/%40vitest%2Fmocker/latest) | 4.1.10 | 5.0.1 | update-available |
| [@vitest/pretty-format](https://registry.npmjs.org/%40vitest%2Fpretty-format/latest) | 4.1.10 | 5.0.1 | update-available |
| [@vitest/runner](https://registry.npmjs.org/%40vitest%2Frunner/latest) | 4.1.10 | 4.1.11 | update-available |
| [@vitest/snapshot](https://registry.npmjs.org/%40vitest%2Fsnapshot/latest) | 4.1.10 | 5.0.1 | update-available |
| [@vitest/spy](https://registry.npmjs.org/%40vitest%2Fspy/latest) | 4.1.10 | 5.0.1 | update-available |
| [@vitest/utils](https://registry.npmjs.org/%40vitest%2Futils/latest) | 4.1.10 | 5.0.1 | update-available |
| [@zenuml/core](https://registry.npmjs.org/%40zenuml%2Fcore/latest) | 3.49.0 | 4.3.0 | update-available |
| [abort-controller](https://registry.npmjs.org/abort-controller/latest) | 3.0.0 | 3.0.0 | current |
| [acorn](https://registry.npmjs.org/acorn/latest) | 8.16.0 | 8.18.0 | update-available |
| [ansi-escapes](https://registry.npmjs.org/ansi-escapes/latest) | 7.3.0 | 7.3.0 | current |
| [ansi-regex](https://registry.npmjs.org/ansi-regex/latest) | 5.0.1 | 6.3.0 | update-available |
| [ansi-regex](https://registry.npmjs.org/ansi-regex/latest) | 6.2.2 | 6.3.0 | update-available |
| [ansi-styles](https://registry.npmjs.org/ansi-styles/latest) | 5.2.0 | 7.0.0 | update-available |
| [ansi-styles](https://registry.npmjs.org/ansi-styles/latest) | 6.2.3 | 7.0.0 | update-available |
| [antlr4](https://registry.npmjs.org/antlr4/latest) | 4.11.0 | 4.13.2 | update-available |
| [any-promise](https://registry.npmjs.org/any-promise/latest) | 1.3.0 | 1.3.0 | current |
| [anymatch](https://registry.npmjs.org/anymatch/latest) | 3.1.3 | 3.1.3 | current |
| [arg](https://registry.npmjs.org/arg/latest) | 5.0.2 | 5.0.2 | current |
| [aria-hidden](https://registry.npmjs.org/aria-hidden/latest) | 1.2.6 | 1.2.6 | current |
| [aria-query](https://registry.npmjs.org/aria-query/latest) | 5.3.0 | 5.3.2 | update-available |
| [assertion-error](https://registry.npmjs.org/assertion-error/latest) | 2.0.1 | 2.0.1 | current |
| [atomic-sleep](https://registry.npmjs.org/atomic-sleep/latest) | 1.0.0 | 1.0.0 | current |
| [axe-core](https://registry.npmjs.org/axe-core/latest) | 4.13.0 | 4.13.0 | current |
| [base64-js](https://registry.npmjs.org/base64-js/latest) | 1.5.1 | 1.5.1 | current |
| [binary-extensions](https://registry.npmjs.org/binary-extensions/latest) | 2.3.0 | 3.2.0 | update-available |
| [braces](https://registry.npmjs.org/braces/latest) | 3.0.3 | 3.0.3 | current |
| [buffer-image-size](https://registry.npmjs.org/buffer-image-size/latest) | 0.6.4 | 0.6.4 | current |
| [buffer](https://registry.npmjs.org/buffer/latest) | 6.0.3 | 6.0.3 | current |
| [camelcase-css](https://registry.npmjs.org/camelcase-css/latest) | 2.0.1 | 2.0.1 | current |
| [chai](https://registry.npmjs.org/chai/latest) | 6.2.2 | 6.2.2 | current |
| [chokidar](https://registry.npmjs.org/chokidar/latest) | 3.6.0 | 5.0.0 | update-available |
| [class-variance-authority](https://registry.npmjs.org/class-variance-authority/latest) | 0.7.1 | 0.7.1 | current |
| [cli-cursor](https://registry.npmjs.org/cli-cursor/latest) | 5.0.0 | 5.0.0 | current |
| [cli-truncate](https://registry.npmjs.org/cli-truncate/latest) | 5.2.0 | 6.1.1 | update-available |
| [clsx](https://registry.npmjs.org/clsx/latest) | 2.1.1 | 2.1.1 | current |
| [cmdk](https://registry.npmjs.org/cmdk/latest) | 1.1.1 | 1.1.1 | current |
| [color-name](https://registry.npmjs.org/color-name/latest) | 2.1.0 | 2.1.1 | update-available |
| [color-string](https://registry.npmjs.org/color-string/latest) | 2.1.4 | 2.1.4 | current |
| [commander](https://registry.npmjs.org/commander/latest) | 4.1.1 | 15.0.0 | update-available |
| [commander](https://registry.npmjs.org/commander/latest) | 7.2.0 | 15.0.0 | update-available |
| [commander](https://registry.npmjs.org/commander/latest) | 8.3.0 | 15.0.0 | update-available |
| [confbox](https://registry.npmjs.org/confbox/latest) | 0.1.8 | 0.3.1 | update-available |
| [convert-source-map](https://registry.npmjs.org/convert-source-map/latest) | 2.0.0 | 2.0.0 | current |
| [cose-base](https://registry.npmjs.org/cose-base/latest) | 1.0.3 | 2.2.0 | update-available |
| [cose-base](https://registry.npmjs.org/cose-base/latest) | 2.2.0 | 2.2.0 | current |
| [cssesc](https://registry.npmjs.org/cssesc/latest) | 3.0.0 | 3.0.0 | current |
| [csstype](https://registry.npmjs.org/csstype/latest) | 3.2.3 | 3.2.3 | current |
| [cytoscape-cose-bilkent](https://registry.npmjs.org/cytoscape-cose-bilkent/latest) | 4.1.0 | 4.1.0 | current |
| [cytoscape-fcose](https://registry.npmjs.org/cytoscape-fcose/latest) | 2.2.0 | 2.2.0 | current |
| [cytoscape](https://registry.npmjs.org/cytoscape/latest) | 3.34.0 | 3.34.3 | update-available |
| [d3-array](https://registry.npmjs.org/d3-array/latest) | 2.12.1 | 3.2.4 | update-available |
| [d3-array](https://registry.npmjs.org/d3-array/latest) | 3.2.4 | 3.2.4 | current |
| [d3-axis](https://registry.npmjs.org/d3-axis/latest) | 3.0.0 | 3.0.0 | current |
| [d3-brush](https://registry.npmjs.org/d3-brush/latest) | 3.0.0 | 3.0.0 | current |
| [d3-chord](https://registry.npmjs.org/d3-chord/latest) | 3.0.1 | 3.0.1 | current |
| [d3-color](https://registry.npmjs.org/d3-color/latest) | 3.1.0 | 3.1.0 | current |
| [d3-contour](https://registry.npmjs.org/d3-contour/latest) | 4.0.2 | 4.0.2 | current |
| [d3-delaunay](https://registry.npmjs.org/d3-delaunay/latest) | 6.0.4 | 6.0.4 | current |
| [d3-dispatch](https://registry.npmjs.org/d3-dispatch/latest) | 3.0.1 | 3.0.1 | current |
| [d3-drag](https://registry.npmjs.org/d3-drag/latest) | 3.0.0 | 3.0.0 | current |
| [d3-dsv](https://registry.npmjs.org/d3-dsv/latest) | 3.0.1 | 3.0.1 | current |
| [d3-ease](https://registry.npmjs.org/d3-ease/latest) | 3.0.1 | 3.0.1 | current |
| [d3-fetch](https://registry.npmjs.org/d3-fetch/latest) | 3.0.1 | 3.0.1 | current |
| [d3-force](https://registry.npmjs.org/d3-force/latest) | 3.0.0 | 3.0.0 | current |
| [d3-format](https://registry.npmjs.org/d3-format/latest) | 3.1.2 | 3.1.2 | current |
| [d3-geo](https://registry.npmjs.org/d3-geo/latest) | 3.1.1 | 3.1.1 | current |
| [d3-hierarchy](https://registry.npmjs.org/d3-hierarchy/latest) | 3.1.2 | 3.1.2 | current |
| [d3-interpolate](https://registry.npmjs.org/d3-interpolate/latest) | 3.0.1 | 3.0.1 | current |
| [d3-path](https://registry.npmjs.org/d3-path/latest) | 1.0.9 | 3.1.0 | update-available |
| [d3-path](https://registry.npmjs.org/d3-path/latest) | 3.1.0 | 3.1.0 | current |
| [d3-polygon](https://registry.npmjs.org/d3-polygon/latest) | 3.0.1 | 3.0.1 | current |
| [d3-quadtree](https://registry.npmjs.org/d3-quadtree/latest) | 3.0.1 | 3.0.1 | current |
| [d3-random](https://registry.npmjs.org/d3-random/latest) | 3.0.1 | 3.0.1 | current |
| [d3-sankey](https://registry.npmjs.org/d3-sankey/latest) | 0.12.3 | 0.12.3 | current |
| [d3-scale-chromatic](https://registry.npmjs.org/d3-scale-chromatic/latest) | 3.1.0 | 3.1.0 | current |
| [d3-scale](https://registry.npmjs.org/d3-scale/latest) | 4.0.2 | 4.0.2 | current |
| [d3-selection](https://registry.npmjs.org/d3-selection/latest) | 3.0.0 | 3.0.0 | current |
| [d3-shape](https://registry.npmjs.org/d3-shape/latest) | 1.3.7 | 3.2.0 | update-available |
| [d3-shape](https://registry.npmjs.org/d3-shape/latest) | 3.2.0 | 3.2.0 | current |
| [d3-time-format](https://registry.npmjs.org/d3-time-format/latest) | 4.1.0 | 4.1.0 | current |
| [d3-time](https://registry.npmjs.org/d3-time/latest) | 3.1.0 | 3.1.0 | current |
| [d3-timer](https://registry.npmjs.org/d3-timer/latest) | 3.0.1 | 3.0.1 | current |
| [d3-transition](https://registry.npmjs.org/d3-transition/latest) | 3.0.1 | 3.0.1 | current |
| [d3-zoom](https://registry.npmjs.org/d3-zoom/latest) | 3.0.0 | 3.0.0 | current |
| [d3](https://registry.npmjs.org/d3/latest) | 7.9.0 | 7.9.0 | current |
| [dagre-d3-es](https://registry.npmjs.org/dagre-d3-es/latest) | 7.0.14 | 7.0.14 | current |
| [date-fns-jalali](https://registry.npmjs.org/date-fns-jalali/latest) | 4.1.0-0 | No stable SemVer release; latest tag 4.4.0-0 | no-stable-release |
| [date-fns](https://registry.npmjs.org/date-fns/latest) | 3.6.0 | 4.4.0 | update-available |
| [date-fns](https://registry.npmjs.org/date-fns/latest) | 4.4.0 | 4.4.0 | current |
| [dayjs](https://registry.npmjs.org/dayjs/latest) | 1.11.20 | 1.11.23 | update-available |
| [debug](https://registry.npmjs.org/debug/latest) | 4.4.3 | 4.4.3 | current |
| [decimal.js-light](https://registry.npmjs.org/decimal.js-light/latest) | 2.5.1 | 2.5.1 | current |
| [delaunator](https://registry.npmjs.org/delaunator/latest) | 5.1.0 | 5.1.0 | current |
| [dequal](https://registry.npmjs.org/dequal/latest) | 2.0.3 | 2.0.3 | current |
| [detect-libc](https://registry.npmjs.org/detect-libc/latest) | 2.1.2 | 2.1.2 | current |
| [detect-node-es](https://registry.npmjs.org/detect-node-es/latest) | 1.1.0 | 1.1.0 | current |
| [didyoumean](https://registry.npmjs.org/didyoumean/latest) | 1.2.2 | 1.2.2 | current |
| [dlv](https://registry.npmjs.org/dlv/latest) | 1.1.3 | 1.1.3 | current |
| [dom-accessibility-api](https://registry.npmjs.org/dom-accessibility-api/latest) | 0.5.16 | 0.7.1 | update-available |
| [dom-helpers](https://registry.npmjs.org/dom-helpers/latest) | 5.2.1 | 6.0.1 | update-available |
| [dompurify](https://registry.npmjs.org/dompurify/latest) | 3.4.11 | 3.4.15 | update-available |
| [embla-carousel-react](https://registry.npmjs.org/embla-carousel-react/latest) | 8.6.0 | 8.6.0 | current |
| [embla-carousel-reactive-utils](https://registry.npmjs.org/embla-carousel-reactive-utils/latest) | 8.6.0 | 8.6.0 | current |
| [embla-carousel](https://registry.npmjs.org/embla-carousel/latest) | 8.6.0 | 8.6.0 | current |
| [emoji-regex](https://registry.npmjs.org/emoji-regex/latest) | 10.6.0 | 11.0.0 | update-available |
| [enhanced-resolve](https://registry.npmjs.org/enhanced-resolve/latest) | 5.21.6 | 5.25.1 | update-available |
| [entities](https://registry.npmjs.org/entities/latest) | 7.0.1 | 8.1.0 | update-available |
| [environment](https://registry.npmjs.org/environment/latest) | 1.1.0 | 1.1.0 | current |
| [es-errors](https://registry.npmjs.org/es-errors/latest) | 1.3.0 | 1.3.0 | current |
| [es-module-lexer](https://registry.npmjs.org/es-module-lexer/latest) | 2.1.0 | 3.0.2 | update-available |
| [es-toolkit](https://registry.npmjs.org/es-toolkit/latest) | 1.46.1 | 1.52.0 | update-available |
| [estree-walker](https://registry.npmjs.org/estree-walker/latest) | 3.0.3 | 3.0.3 | current |
| [event-target-shim](https://registry.npmjs.org/event-target-shim/latest) | 5.0.1 | 6.0.2 | update-available |
| [eventemitter3](https://registry.npmjs.org/eventemitter3/latest) | 4.0.7 | 5.0.4 | update-available |
| [eventemitter3](https://registry.npmjs.org/eventemitter3/latest) | 5.0.4 | 5.0.4 | current |
| [events](https://registry.npmjs.org/events/latest) | 3.3.0 | 3.3.0 | current |
| [expect-type](https://registry.npmjs.org/expect-type/latest) | 1.3.0 | 1.4.0 | update-available |
| [fast-equals](https://registry.npmjs.org/fast-equals/latest) | 5.4.1 | 6.0.3 | update-available |
| [fast-glob](https://registry.npmjs.org/fast-glob/latest) | 3.3.3 | 3.3.3 | current |
| [fast-redact](https://registry.npmjs.org/fast-redact/latest) | 3.5.0 | 3.5.0 | current |
| [fastq](https://registry.npmjs.org/fastq/latest) | 1.20.1 | 1.20.3 | update-available |
| [fdir](https://registry.npmjs.org/fdir/latest) | 6.5.0 | 6.5.0 | current |
| [fill-range](https://registry.npmjs.org/fill-range/latest) | 7.1.1 | 7.1.1 | current |
| [framer-motion](https://registry.npmjs.org/framer-motion/latest) | 13.1.0 | 13.4.0 | update-available |
| [fsevents](https://registry.npmjs.org/fsevents/latest) | 2.3.2 | 2.3.3 | update-available |
| [fsevents](https://registry.npmjs.org/fsevents/latest) | 2.3.3 | 2.3.3 | current |
| [function-bind](https://registry.npmjs.org/function-bind/latest) | 1.1.2 | 1.1.2 | current |
| [get-east-asian-width](https://registry.npmjs.org/get-east-asian-width/latest) | 1.6.0 | 1.7.0 | update-available |
| [get-nonce](https://registry.npmjs.org/get-nonce/latest) | 1.0.1 | 1.0.1 | current |
| [glob-parent](https://registry.npmjs.org/glob-parent/latest) | 5.1.2 | 6.0.2 | update-available |
| [glob-parent](https://registry.npmjs.org/glob-parent/latest) | 6.0.2 | 6.0.2 | current |
| [graceful-fs](https://registry.npmjs.org/graceful-fs/latest) | 4.2.11 | 4.2.11 | current |
| [hachure-fill](https://registry.npmjs.org/hachure-fill/latest) | 0.5.2 | 0.5.2 | current |
| [happy-dom](https://registry.npmjs.org/happy-dom/latest) | 20.10.6 | 20.14.5 | update-available |
| [hasown](https://registry.npmjs.org/hasown/latest) | 2.0.4 | 2.0.4 | current |
| [highlight.js](https://registry.npmjs.org/highlight.js/latest) | 11.11.1 | 11.12.0 | update-available |
| [html-to-image](https://registry.npmjs.org/html-to-image/latest) | 1.11.13 | 1.11.13 | current |
| [iconv-lite](https://registry.npmjs.org/iconv-lite/latest) | 0.6.3 | 0.7.3 | update-available |
| [ieee754](https://registry.npmjs.org/ieee754/latest) | 1.2.1 | 1.2.1 | current |
| [immer](https://registry.npmjs.org/immer/latest) | 10.2.0 | 11.1.18 | update-available |
| [input-otp](https://registry.npmjs.org/input-otp/latest) | 1.5.0 | 1.5.0 | current |
| [internmap](https://registry.npmjs.org/internmap/latest) | 1.0.1 | 2.0.3 | update-available |
| [internmap](https://registry.npmjs.org/internmap/latest) | 2.0.3 | 2.0.3 | current |
| [is-binary-path](https://registry.npmjs.org/is-binary-path/latest) | 2.1.0 | 3.0.0 | update-available |
| [is-core-module](https://registry.npmjs.org/is-core-module/latest) | 2.16.2 | 2.17.0 | update-available |
| [is-extglob](https://registry.npmjs.org/is-extglob/latest) | 2.1.1 | 2.1.1 | current |
| [is-fullwidth-code-point](https://registry.npmjs.org/is-fullwidth-code-point/latest) | 5.1.0 | 5.1.0 | current |
| [is-glob](https://registry.npmjs.org/is-glob/latest) | 4.0.3 | 4.0.3 | current |
| [is-number](https://registry.npmjs.org/is-number/latest) | 7.0.0 | 7.0.0 | current |
| [jiti](https://registry.npmjs.org/jiti/latest) | 1.21.7 | 2.7.0 | update-available |
| [jiti](https://registry.npmjs.org/jiti/latest) | 2.7.0 | 2.7.0 | current |
| [jotai](https://registry.npmjs.org/jotai/latest) | 2.20.0 | 3.0.0 | update-available |
| [js-tokens](https://registry.npmjs.org/js-tokens/latest) | 4.0.0 | 10.0.0 | update-available |
| [jsesc](https://registry.npmjs.org/jsesc/latest) | 3.1.0 | 3.1.0 | current |
| [katex](https://registry.npmjs.org/katex/latest) | 0.16.45 | 0.18.7 | update-available |
| [khroma](https://registry.npmjs.org/khroma/latest) | 2.1.0 | 2.1.0 | current |
| [layout-base](https://registry.npmjs.org/layout-base/latest) | 1.0.2 | 2.0.1 | update-available |
| [layout-base](https://registry.npmjs.org/layout-base/latest) | 2.0.1 | 2.0.1 | current |
| [lightningcss-linux-x64-gnu](https://registry.npmjs.org/lightningcss-linux-x64-gnu/latest) | 1.32.0 | 1.33.0 | update-available |
| [lightningcss-win32-x64-msvc](https://registry.npmjs.org/lightningcss-win32-x64-msvc/latest) | 1.33.0 | 1.33.0 | current |
| [lightningcss](https://registry.npmjs.org/lightningcss/latest) | 1.32.0 | 1.33.0 | update-available |
| [lilconfig](https://registry.npmjs.org/lilconfig/latest) | 3.1.3 | 3.1.3 | current |
| [lines-and-columns](https://registry.npmjs.org/lines-and-columns/latest) | 1.2.4 | 2.0.4 | update-available |
| [lint-staged](https://registry.npmjs.org/lint-staged/latest) | 17.0.8 | 17.5.1 | update-available |
| [listr2](https://registry.npmjs.org/listr2/latest) | 10.2.1 | 11.1.0 | update-available |
| [lodash-es](https://registry.npmjs.org/lodash-es/latest) | 4.18.1 | 4.18.1 | current |
| [lodash](https://registry.npmjs.org/lodash/latest) | 4.18.1 | 4.18.1 | current |
| [log-update](https://registry.npmjs.org/log-update/latest) | 6.1.0 | 8.0.0 | update-available |
| [loose-envify](https://registry.npmjs.org/loose-envify/latest) | 1.4.0 | 1.4.0 | current |
| [lucide-react](https://registry.npmjs.org/lucide-react/latest) | 1.33.0 | 1.47.0 | update-available |
| [lz-string](https://registry.npmjs.org/lz-string/latest) | 1.5.0 | 1.5.0 | current |
| [magic-string](https://registry.npmjs.org/magic-string/latest) | 0.30.21 | 1.4.1 | update-available |
| [marked](https://registry.npmjs.org/marked/latest) | 16.4.2 | 18.0.13 | update-available |
| [marked](https://registry.npmjs.org/marked/latest) | 4.3.0 | 18.0.13 | update-available |
| [merge2](https://registry.npmjs.org/merge2/latest) | 1.4.1 | 1.4.1 | current |
| [mermaid](https://registry.npmjs.org/mermaid/latest) | 11.16.0 | 12.0.0 | update-available |
| [micromatch](https://registry.npmjs.org/micromatch/latest) | 4.0.8 | 4.0.8 | current |
| [mimic-function](https://registry.npmjs.org/mimic-function/latest) | 5.0.1 | 5.0.1 | current |
| [mitt](https://registry.npmjs.org/mitt/latest) | 3.0.1 | 3.0.1 | current |
| [mlly](https://registry.npmjs.org/mlly/latest) | 1.8.2 | 1.8.2 | current |
| [modern-screenshot](https://registry.npmjs.org/modern-screenshot/latest) | 4.6.8 | 4.7.0 | update-available |
| [motion-dom](https://registry.npmjs.org/motion-dom/latest) | 13.0.0 | 13.3.0 | update-available |
| [motion-utils](https://registry.npmjs.org/motion-utils/latest) | 13.0.0 | 13.3.0 | update-available |
| [ms](https://registry.npmjs.org/ms/latest) | 2.1.3 | 2.1.3 | current |
| [mz](https://registry.npmjs.org/mz/latest) | 2.7.0 | 2.7.0 | current |
| [nanoid](https://registry.npmjs.org/nanoid/latest) | 3.3.14 | 6.0.1 | update-available |
| [next-themes](https://registry.npmjs.org/next-themes/latest) | 0.4.6 | 0.4.6 | current |
| [normalize-path](https://registry.npmjs.org/normalize-path/latest) | 3.0.0 | 3.0.0 | current |
| [object-assign](https://registry.npmjs.org/object-assign/latest) | 4.1.1 | 4.1.1 | current |
| [object-hash](https://registry.npmjs.org/object-hash/latest) | 3.0.0 | 3.0.0 | current |
| [obug](https://registry.npmjs.org/obug/latest) | 2.1.1 | 3.0.0 | update-available |
| [on-exit-leak-free](https://registry.npmjs.org/on-exit-leak-free/latest) | 2.1.2 | 2.1.2 | current |
| [onetime](https://registry.npmjs.org/onetime/latest) | 7.0.0 | 8.0.0 | update-available |
| [package-manager-detector](https://registry.npmjs.org/package-manager-detector/latest) | 1.6.0 | 1.8.0 | update-available |
| [pako](https://registry.npmjs.org/pako/latest) | 2.1.0 | 3.0.2 | update-available |
| [path-data-parser](https://registry.npmjs.org/path-data-parser/latest) | 0.1.0 | 0.1.0 | current |
| [path-parse](https://registry.npmjs.org/path-parse/latest) | 1.0.7 | 1.0.7 | current |
| [pathe](https://registry.npmjs.org/pathe/latest) | 2.0.3 | 2.0.3 | current |
| [picocolors](https://registry.npmjs.org/picocolors/latest) | 1.1.1 | 1.1.1 | current |
| [picomatch](https://registry.npmjs.org/picomatch/latest) | 2.3.2 | 4.0.7 | update-available |
| [picomatch](https://registry.npmjs.org/picomatch/latest) | 4.0.4 | 4.0.7 | update-available |
| [picomatch](https://registry.npmjs.org/picomatch/latest) | 4.0.5 | 4.0.7 | update-available |
| [pify](https://registry.npmjs.org/pify/latest) | 2.3.0 | 6.1.0 | update-available |
| [pino-abstract-transport](https://registry.npmjs.org/pino-abstract-transport/latest) | 1.2.0 | 3.0.0 | update-available |
| [pino-std-serializers](https://registry.npmjs.org/pino-std-serializers/latest) | 6.2.2 | 7.1.0 | update-available |
| [pino](https://registry.npmjs.org/pino/latest) | 8.21.0 | 10.3.1 | update-available |
| [pirates](https://registry.npmjs.org/pirates/latest) | 4.0.7 | 4.0.7 | current |
| [pkg-types](https://registry.npmjs.org/pkg-types/latest) | 1.3.1 | 2.3.3 | update-available |
| [playwright-core](https://registry.npmjs.org/playwright-core/latest) | 1.62.1 | 1.63.0 | update-available |
| [playwright](https://registry.npmjs.org/playwright/latest) | 1.62.1 | 1.63.0 | update-available |
| [pngjs](https://registry.npmjs.org/pngjs/latest) | 7.0.0 | 7.0.0 | current |
| [points-on-curve](https://registry.npmjs.org/points-on-curve/latest) | 0.2.0 | 1.0.1 | update-available |
| [points-on-path](https://registry.npmjs.org/points-on-path/latest) | 0.2.1 | 0.2.1 | current |
| [postcss-import](https://registry.npmjs.org/postcss-import/latest) | 15.1.0 | 17.0.0 | update-available |
| [postcss-js](https://registry.npmjs.org/postcss-js/latest) | 4.1.0 | 5.1.0 | update-available |
| [postcss-load-config](https://registry.npmjs.org/postcss-load-config/latest) | 6.0.1 | 6.0.1 | current |
| [postcss-nested](https://registry.npmjs.org/postcss-nested/latest) | 6.2.0 | 8.0.1 | update-available |
| [postcss-selector-parser](https://registry.npmjs.org/postcss-selector-parser/latest) | 6.0.10 | 7.1.6 | update-available |
| [postcss-selector-parser](https://registry.npmjs.org/postcss-selector-parser/latest) | 6.1.2 | 7.1.6 | update-available |
| [postcss-value-parser](https://registry.npmjs.org/postcss-value-parser/latest) | 4.2.0 | 4.2.0 | current |
| [postcss](https://registry.npmjs.org/postcss/latest) | 8.5.15 | 8.5.28 | update-available |
| [postcss](https://registry.npmjs.org/postcss/latest) | 8.5.17 | 8.5.28 | update-available |
| [prettier](https://registry.npmjs.org/prettier/latest) | 3.9.6 | 3.9.8 | update-available |
| [pretty-format](https://registry.npmjs.org/pretty-format/latest) | 27.5.1 | 30.5.1 | update-available |
| [process-warning](https://registry.npmjs.org/process-warning/latest) | 3.0.0 | 5.1.0 | update-available |
| [process](https://registry.npmjs.org/process/latest) | 0.11.10 | 0.11.10 | current |
| [prop-types](https://registry.npmjs.org/prop-types/latest) | 15.8.1 | 15.8.1 | current |
| [queue-microtask](https://registry.npmjs.org/queue-microtask/latest) | 1.2.3 | 1.2.3 | current |
| [quick-format-unescaped](https://registry.npmjs.org/quick-format-unescaped/latest) | 4.0.4 | 4.0.4 | current |
| [react-aria](https://registry.npmjs.org/react-aria/latest) | 3.49.0 | 3.52.1 | update-available |
| [react-day-picker](https://registry.npmjs.org/react-day-picker/latest) | 9.14.0 | 10.0.1 | update-available |
| [react-dom](https://registry.npmjs.org/react-dom/latest) | 19.2.8 | 19.3.0 | update-available |
| [react-hook-form](https://registry.npmjs.org/react-hook-form/latest) | 7.85.0 | 7.88.0 | update-available |
| [react-icons](https://registry.npmjs.org/react-icons/latest) | 5.7.0 | 5.7.0 | current |
| [react-is](https://registry.npmjs.org/react-is/latest) | 16.13.1 | 19.3.0 | update-available |
| [react-is](https://registry.npmjs.org/react-is/latest) | 17.0.2 | 19.3.0 | update-available |
| [react-is](https://registry.npmjs.org/react-is/latest) | 18.3.1 | 19.3.0 | update-available |
| [react-remove-scroll-bar](https://registry.npmjs.org/react-remove-scroll-bar/latest) | 2.3.8 | 2.3.8 | current |
| [react-remove-scroll](https://registry.npmjs.org/react-remove-scroll/latest) | 2.7.2 | 2.7.2 | current |
| [react-resizable-panels](https://registry.npmjs.org/react-resizable-panels/latest) | 2.1.9 | 4.12.4 | update-available |
| [react-smooth](https://registry.npmjs.org/react-smooth/latest) | 4.0.4 | 4.0.4 | current |
| [react-stately](https://registry.npmjs.org/react-stately/latest) | 3.47.0 | 3.50.0 | update-available |
| [react-style-singleton](https://registry.npmjs.org/react-style-singleton/latest) | 2.2.3 | 2.2.3 | current |
| [react-transition-group](https://registry.npmjs.org/react-transition-group/latest) | 4.4.5 | 4.4.5 | current |
| [react](https://registry.npmjs.org/react/latest) | 19.2.8 | 19.3.0 | update-available |
| [read-cache](https://registry.npmjs.org/read-cache/latest) | 1.0.0 | 1.0.2 | update-available |
| [readable-stream](https://registry.npmjs.org/readable-stream/latest) | 4.7.0 | 4.7.0 | current |
| [readdirp](https://registry.npmjs.org/readdirp/latest) | 3.6.0 | 5.1.1 | update-available |
| [real-require](https://registry.npmjs.org/real-require/latest) | 0.2.0 | 1.0.0 | update-available |
| [recharts-scale](https://registry.npmjs.org/recharts-scale/latest) | 0.4.5 | 0.4.5 | current |
| [recharts](https://registry.npmjs.org/recharts/latest) | 2.15.4 | 3.10.1 | update-available |
| [regexparam](https://registry.npmjs.org/regexparam/latest) | 3.0.0 | 3.0.0 | current |
| [resolve](https://registry.npmjs.org/resolve/latest) | 1.22.12 | 1.22.12 | current |
| [restore-cursor](https://registry.npmjs.org/restore-cursor/latest) | 5.1.0 | 5.1.0 | current |
| [reusify](https://registry.npmjs.org/reusify/latest) | 1.1.0 | 1.1.0 | current |
| [rfdc](https://registry.npmjs.org/rfdc/latest) | 1.4.1 | 1.4.1 | current |
| [robust-predicates](https://registry.npmjs.org/robust-predicates/latest) | 3.0.3 | 3.0.3 | current |
| [rolldown](https://registry.npmjs.org/rolldown/latest) | 1.1.5 | 1.2.9 | update-available |
| [roughjs](https://registry.npmjs.org/roughjs/latest) | 4.6.6 | 4.6.6 | current |
| [run-parallel](https://registry.npmjs.org/run-parallel/latest) | 1.2.0 | 1.2.0 | current |
| [rw](https://registry.npmjs.org/rw/latest) | 1.3.3 | 1.3.3 | current |
| [safe-buffer](https://registry.npmjs.org/safe-buffer/latest) | 5.2.1 | 5.2.1 | current |
| [safe-stable-stringify](https://registry.npmjs.org/safe-stable-stringify/latest) | 2.5.0 | 2.5.0 | current |
| [safer-buffer](https://registry.npmjs.org/safer-buffer/latest) | 2.1.2 | 2.1.2 | current |
| [scheduler](https://registry.npmjs.org/scheduler/latest) | 0.27.0 | 0.28.0 | update-available |
| [siginfo](https://registry.npmjs.org/siginfo/latest) | 2.0.0 | 2.0.0 | current |
| [signal-exit](https://registry.npmjs.org/signal-exit/latest) | 4.1.0 | 4.1.0 | current |
| [simple-git-hooks](https://registry.npmjs.org/simple-git-hooks/latest) | 2.14.0 | 2.14.0 | current |
| [slice-ansi](https://registry.npmjs.org/slice-ansi/latest) | 7.1.2 | 9.0.1 | update-available |
| [slice-ansi](https://registry.npmjs.org/slice-ansi/latest) | 8.0.0 | 9.0.1 | update-available |
| [sonic-boom](https://registry.npmjs.org/sonic-boom/latest) | 3.8.1 | 5.0.1 | update-available |
| [sonner](https://registry.npmjs.org/sonner/latest) | 2.0.8 | 2.0.8 | current |
| [source-map-js](https://registry.npmjs.org/source-map-js/latest) | 1.2.1 | 1.2.1 | current |
| [split2](https://registry.npmjs.org/split2/latest) | 4.2.0 | 4.2.0 | current |
| [stackback](https://registry.npmjs.org/stackback/latest) | 0.0.2 | 0.0.2 | current |
| [std-env](https://registry.npmjs.org/std-env/latest) | 4.1.0 | 4.2.0 | update-available |
| [string-argv](https://registry.npmjs.org/string-argv/latest) | 0.3.2 | 0.3.2 | current |
| [string-width](https://registry.npmjs.org/string-width/latest) | 7.2.0 | 8.2.2 | update-available |
| [string-width](https://registry.npmjs.org/string-width/latest) | 8.2.1 | 8.2.2 | update-available |
| [string_decoder](https://registry.npmjs.org/string_decoder/latest) | 1.3.0 | 1.3.0 | current |
| [strip-ansi](https://registry.npmjs.org/strip-ansi/latest) | 7.2.0 | 7.2.0 | current |
| [stylis](https://registry.npmjs.org/stylis/latest) | 4.4.0 | 4.4.0 | current |
| [sucrase](https://registry.npmjs.org/sucrase/latest) | 3.35.1 | 3.35.1 | current |
| [supports-preserve-symlinks-flag](https://registry.npmjs.org/supports-preserve-symlinks-flag/latest) | 1.0.0 | 1.0.0 | current |
| [tabbable](https://registry.npmjs.org/tabbable/latest) | 6.4.0 | 6.5.0 | update-available |
| [tailwind-merge](https://registry.npmjs.org/tailwind-merge/latest) | 3.6.0 | 3.7.0 | update-available |
| [tailwindcss](https://registry.npmjs.org/tailwindcss/latest) | 3.4.19 | 4.3.3 | update-available |
| [tailwindcss](https://registry.npmjs.org/tailwindcss/latest) | 4.3.2 | 4.3.3 | update-available |
| [tapable](https://registry.npmjs.org/tapable/latest) | 2.3.3 | 2.3.3 | current |
| [thenify-all](https://registry.npmjs.org/thenify-all/latest) | 1.6.0 | 1.6.0 | current |
| [thenify](https://registry.npmjs.org/thenify/latest) | 3.3.1 | 3.3.1 | current |
| [thread-stream](https://registry.npmjs.org/thread-stream/latest) | 2.7.0 | 4.2.0 | update-available |
| [tiny-invariant](https://registry.npmjs.org/tiny-invariant/latest) | 1.3.3 | 1.3.3 | current |
| [tinybench](https://registry.npmjs.org/tinybench/latest) | 2.9.0 | 6.2.0 | update-available |
| [tinyexec](https://registry.npmjs.org/tinyexec/latest) | 1.2.2 | 1.3.1 | update-available |
| [tinyexec](https://registry.npmjs.org/tinyexec/latest) | 1.2.4 | 1.3.1 | update-available |
| [tinyglobby](https://registry.npmjs.org/tinyglobby/latest) | 0.2.17 | 0.2.17 | current |
| [tinyrainbow](https://registry.npmjs.org/tinyrainbow/latest) | 3.1.0 | 3.1.1 | update-available |
| [to-regex-range](https://registry.npmjs.org/to-regex-range/latest) | 5.0.1 | 5.0.1 | current |
| [ts-dedent](https://registry.npmjs.org/ts-dedent/latest) | 2.2.0 | 2.3.0 | update-available |
| [ts-interface-checker](https://registry.npmjs.org/ts-interface-checker/latest) | 0.1.13 | 1.0.2 | update-available |
| [tslib](https://registry.npmjs.org/tslib/latest) | 2.8.1 | 2.8.1 | current |
| [tw-animate-css](https://registry.npmjs.org/tw-animate-css/latest) | 1.4.0 | 1.4.0 | current |
| [typescript](https://registry.npmjs.org/typescript/latest) | 7.0.2 | 7.0.2 | current |
| [ufo](https://registry.npmjs.org/ufo/latest) | 1.6.3 | 1.6.4 | update-available |
| [undici-types](https://registry.npmjs.org/undici-types/latest) | 8.3.0 | 8.10.2 | update-available |
| [use-callback-ref](https://registry.npmjs.org/use-callback-ref/latest) | 1.3.3 | 1.3.3 | current |
| [use-sidecar](https://registry.npmjs.org/use-sidecar/latest) | 1.1.3 | 1.1.3 | current |
| [use-sync-external-store](https://registry.npmjs.org/use-sync-external-store/latest) | 1.6.0 | 1.7.0 | update-available |
| [util-deprecate](https://registry.npmjs.org/util-deprecate/latest) | 1.0.2 | 1.0.2 | current |
| [uuid](https://registry.npmjs.org/uuid/latest) | 11.1.1 | 14.0.2 | update-available |
| [vaul](https://registry.npmjs.org/vaul/latest) | 1.1.2 | 1.1.2 | current |
| [victory-vendor](https://registry.npmjs.org/victory-vendor/latest) | 36.9.2 | 37.3.6 | update-available |
| [vite](https://registry.npmjs.org/vite/latest) | 8.1.4 | 8.3.0 | update-available |
| [vitest](https://registry.npmjs.org/vitest/latest) | 4.1.10 | 5.0.1 | update-available |
| [whatwg-mimetype](https://registry.npmjs.org/whatwg-mimetype/latest) | 3.0.0 | 5.0.0 | update-available |
| [why-is-node-running](https://registry.npmjs.org/why-is-node-running/latest) | 2.3.0 | 3.2.2 | update-available |
| [wouter](https://registry.npmjs.org/wouter/latest) | 3.10.0 | 3.11.0 | update-available |
| [wrap-ansi](https://registry.npmjs.org/wrap-ansi/latest) | 10.0.0 | 10.0.1 | update-available |
| [wrap-ansi](https://registry.npmjs.org/wrap-ansi/latest) | 9.0.2 | 10.0.1 | update-available |
| [ws](https://registry.npmjs.org/ws/latest) | 8.21.0 | 8.21.3 | update-available |
| [yaml](https://registry.npmjs.org/yaml/latest) | 2.9.0 | 2.9.1 | update-available |
| [zod](https://registry.npmjs.org/zod/latest) | 4.4.3 | 4.6.5 | update-available |
