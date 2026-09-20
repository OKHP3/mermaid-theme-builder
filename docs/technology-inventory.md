# Technology inventory and update plan

Reviewed September 18, 2026 (America/Chicago). Registry retrievals continued on September 19 UTC.

The dated September 18 inventory below is historical evidence. The [September 20 dependency review](dependency-review-2026-09-20.md) records the v0.6.3 changes, validated Mermaid 11.17.2 pin, and remaining upgrade decisions. The checked-in manifests and lockfile define current versions.

This review answers which technologies the solution uses, which versions are in place, which stable releases are available, and how future updates reach a reviewed release.

Mermaid Theme Builder is a personal OverKill Hill P3 project by Jamie Hill.
It is not affiliated with Builders FirstSource, BFS, Mermaid, Mermaid Chart,
Mermaid.ai, or any third-party brand represented by user-entered colors.

## Inventory and evidence boundaries

The [complete version report](technology-version-report.md) lists **78 distinct direct npm packages**, **91 dependency declarations**, **550 lockfile package resolutions**, every external action reference including local composite actions, and all 10 internal package manifests. Every npm row links to its registry source. The script also checks unused catalog entries, which are not evidence of application use.

The application is version **0.6.2** at source commit `51e3bc806d431e799aff57dd0f9c1917147be22b`. The working tree was clean before this audit. GitHub's root manifest matched the local manifest. Replit's shell showed the same commit and no uncommitted changes. Windows has all 29 root dependencies installed at their lockfile versions.

The root package builds the published application. `artifacts/mermaid-theme-builder/` is its Replit registration shell, internally versioned `0.5.0`. The separate `artifacts/mermaid-theme-workbench/` package, version `0.0.0`, contains an additional React/Vite workbench and UI dependencies. Its packages are inventoried separately; their presence does not establish that they ship in the root application's bundle. Seven support-skill packages are internally versioned `0.1.0` and declare no npm dependencies.

The review found **31 distinct direct packages with newer stable releases** (40 declarations across the two packages), **16 outdated action references**, and runtime/platform work for pnpm, Python, and the Replit Nix channel. These counts describe available updates, not confirmed security vulnerabilities or verified compatibility.

## Main application technologies

| Package | In place | Latest stable | Result |
| --- | --- | --- | --- |
| [mermaid](https://registry.npmjs.org/mermaid/latest) | 11.16.0 | 12.0.0 | update-available |
| [@mermaid-js/mermaid-zenuml](https://registry.npmjs.org/%40mermaid-js%2Fmermaid-zenuml/latest) | 0.2.3 | 1.0.1 | update-available |
| [@napi-rs/canvas](https://registry.npmjs.org/%40napi-rs%2Fcanvas/latest) | 1.0.8 | 1.0.9 | update-available |
| [@playwright/test](https://registry.npmjs.org/%40playwright%2Ftest/latest) | 1.62.1 | 1.63.0 | update-available |
| [@replit/vite-plugin-cartographer](https://registry.npmjs.org/%40replit%2Fvite-plugin-cartographer/latest) | 0.6.1 | 0.6.1 | current |
| [@replit/vite-plugin-dev-banner](https://registry.npmjs.org/%40replit%2Fvite-plugin-dev-banner/latest) | 0.1.2 | 0.1.2 | current |
| [@replit/vite-plugin-runtime-error-modal](https://registry.npmjs.org/%40replit%2Fvite-plugin-runtime-error-modal/latest) | 0.0.6 | 0.0.6 | current |
| [@tailwindcss/oxide-win32-x64-msvc](https://registry.npmjs.org/%40tailwindcss%2Foxide-win32-x64-msvc/latest) | 4.3.3 | 4.3.3 | current |
| [@tailwindcss/vite](https://registry.npmjs.org/%40tailwindcss%2Fvite/latest) | 4.3.2 | 4.3.3 | update-available |
| [@testing-library/dom](https://registry.npmjs.org/%40testing-library%2Fdom/latest) | 10.4.1 | 10.4.2 | update-available |
| [@testing-library/react](https://registry.npmjs.org/%40testing-library%2Freact/latest) | 16.3.2 | 16.3.3 | update-available |
| [@types/node](https://registry.npmjs.org/%40types%2Fnode/latest) | 26.4.0 | 26.6.2 | update-available |
| [@types/react](https://registry.npmjs.org/%40types%2Freact/latest) | 19.2.18 | 19.3.0 | update-available |
| [@types/react-dom](https://registry.npmjs.org/%40types%2Freact-dom/latest) | 19.2.3 | 19.3.0 | update-available |
| [@vitejs/plugin-react](https://registry.npmjs.org/%40vitejs%2Fplugin-react/latest) | 6.0.5 | 6.1.1 | update-available |
| [axe-core](https://registry.npmjs.org/axe-core/latest) | 4.13.0 | 4.13.0 | current |
| [happy-dom](https://registry.npmjs.org/happy-dom/latest) | 20.10.6 | 20.14.5 | update-available |
| [lightningcss-win32-x64-msvc](https://registry.npmjs.org/lightningcss-win32-x64-msvc/latest) | 1.33.0 | 1.33.0 | current |
| [lint-staged](https://registry.npmjs.org/lint-staged/latest) | 17.0.8 | 17.5.1 | update-available |
| [pngjs](https://registry.npmjs.org/pngjs/latest) | 7.0.0 | 7.0.0 | current |
| [prettier](https://registry.npmjs.org/prettier/latest) | 3.9.6 | 3.9.8 | update-available |
| [react](https://registry.npmjs.org/react/latest) | 19.2.8 | 19.3.0 | update-available |
| [react-dom](https://registry.npmjs.org/react-dom/latest) | 19.2.8 | 19.3.0 | update-available |
| [simple-git-hooks](https://registry.npmjs.org/simple-git-hooks/latest) | 2.14.0 | 2.14.0 | current |
| [tailwindcss](https://registry.npmjs.org/tailwindcss/latest) | 4.3.2 | 4.3.3 | update-available |
| [tw-animate-css](https://registry.npmjs.org/tw-animate-css/latest) | 1.4.0 | 1.4.0 | current |
| [typescript](https://registry.npmjs.org/typescript/latest) | 7.0.2 | 7.0.2 | current |
| [vite](https://registry.npmjs.org/vite/latest) | 8.1.4 | 8.3.0 | update-available |
| [vitest](https://registry.npmjs.org/vitest/latest) | 4.1.10 | 5.0.1 | update-available |

Current values above are lockfile resolutions, independently checked against Windows installations. Latest values come from the publisher's npm metadata. A newer stable release is an upgrade candidate, not permission to skip testing. Full workbench and transitive versions appear in the complete report.

## Languages, runtimes, and browser environment

| Technology | Version in place | Latest stable checked | Maintenance route |
| --- | --- | --- | --- |
| JavaScript / ECMAScript | TypeScript target and library `ES2022`; browser scripts and Node maintenance tools | ECMAScript 2026, 17th edition | Treat the compile target as a browser compatibility decision, not an npm upgrade. [Ecma specification](https://ecma-international.org/publications-and-standards/standards/ecma-262/) |
| Node.js | Replit and CI select major 24; root engine is `>=24.0.0`; Windows runs 24.11.1; Replit runs 24.13.0 | 26.9.0 Current; **24.21.0 LTS** | Refresh hosts to the Node 24 LTS patch first. CI's major selector follows patches automatically; local installations and Replit modules need separate verification. [Official release feed](https://nodejs.org/dist/index.json) |
| pnpm | Project pin and Corepack: **10.26.1** on Windows and Replit; bare Windows `pnpm` reports 11.19.0; lockfile format 9.0 | 12.4.2 | Use `corepack pnpm` for the project. Test a package-manager migration separately, including lockfile compatibility and Dependabot support. [Publisher metadata](https://registry.npmjs.org/pnpm/latest) |
| Corepack | Windows **0.34.2**; invokes the project's pinned pnpm version | **0.36.0** | Host tool, separately versioned from pnpm. Verify package-manager resolution after updating. [Publisher metadata](https://registry.npmjs.org/corepack/latest) |
| Python | Replit module 3.11, installed **3.11.14**; Windows `py` defaults to **3.14.0rc1** | **3.14.7** overall; **3.11.16** on the existing line | Python supports repository skill scripts and tests. It is not an application backend. Use a stable interpreter; test skill utilities before changing the Replit module. [Python release feed](https://www.python.org/api/v2/downloads/release/?is_published=true&pre_release=false) |
| Git for Windows | **2.55.0.windows.5** | **2.55.0.windows.5** | Host maintenance; not pinned by the app. [Publisher releases](https://github.com/git-for-windows/git/releases/latest) |
| PowerShell | Windows operator shell **7.6.5** | **7.6.6** | Host maintenance; not a browser runtime dependency. [Publisher releases](https://github.com/PowerShell/PowerShell/releases/latest) |
| Bash | Git for Windows bundles **5.3.15(2)-release**; CI supplies its own shell | Follows the verified Git for Windows bundle above; separate upstream patch level not verified | Update through the supplying host or runner and run shell-based checks. |
| Nixpkgs / Replit Nix | `.replit` selects `stable-25_05`; evaluated package set reports `25.05pre-git` | NixOS **26.05** | Verify that Replit offers the corresponding channel before editing `.replit`; NixOS availability does not prove Replit availability. [NixOS stable release notes](https://nixos.org/manual/nixos/stable/release-notes) |
| Chromium for Playwright | Installed Playwright 1.62.1 declares browser **151.0.7922.34**, revision 1234 | Chrome for Testing Stable **153.0.8010.52** | Upgrade Playwright and install its matching browser. Do not swap in a random system browser revision. [Official browser feed](https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions.json) |
| Chromium in Replit's Nix package set | **138.0.7204.100** | Chromium-family stable channel **153.0.8010.52** | This is separate from Playwright's managed browser. Review through the Replit channel and verify the actual executable used by tests. [Official browser feed](https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions.json) |
| GLib in Replit Nix | **2.84.3** | **2.90.0** | Update through the Nix package set. [GNOME release archive](https://download.gnome.org/sources/glib/2.90/) |
| NSPR in Replit Nix | **4.36** | **4.40** | Update through the Nix package set. [Mozilla release archive](https://ftp.mozilla.org/pub/nspr/releases/) |
| NSS in Replit Nix | **3.101.2** | **3.129** | Update through the Nix package set. [Mozilla release archive](https://ftp.mozilla.org/pub/security/nss/releases/) |
| gir-rs in Replit Nix | **0.19.0** | **0.19.0** latest published GitHub release | A platform support executable, not a browser dependency. [Publisher releases](https://github.com/gtk-rs/gir/releases/latest) |

The Nix library versions are evaluated attributes from Replit's configured package set. They are not proof that every library is loaded by the running browser. The complete operating-system dependency closure is platform-managed and is outside the application lockfile inventory.

Python source files exist under `.agents/skills/` and `skills/`; the prior inventory's claim that there were none was incorrect. Their imports use the standard library and local modules; no pip requirements or Python package manifest is tracked.

## Standards, services, and assets without a single upgradeable version

| Technology | In-place contract | Update mechanism |
| --- | --- | --- |
| HTML, DOM, CSS, CSS custom properties, media queries | Browser standards; CSS uses Tailwind v4 and Forge tokens | Browser compatibility tests. HTML is a living standard; CSS has independently versioned modules. No invented HTML/CSS package version. |
| SVG, Canvas 2D, PNG, Blob / object URLs, Clipboard, Web Storage, Service Worker, URL APIs, Web Manifest | Browser APIs and file formats used for rendering, export, persistence, and offline assets | Browser and Playwright updates plus export, clipboard, persistence, and offline regression tests. |
| JSON, YAML, TOML, Markdown, Mermaid text | Data, configuration, and document formats | Parser package versions are in the lockfile report. Internal schemas evolve with this app. |
| Google Fonts: Alfa Slab One, DM Sans, JetBrains Mono | Hosted stylesheet request in `index.html`; no exact font release pin | Provider-managed delivery. Inspect typography after browser/build changes. |
| Forge tokens | Tracked `src/styles/forge-tokens.css`, copied from the canonical OKHP3 source | Existing weekly `sync-forge-tokens.yml` opens a review PR. Do not hand-edit the generated copy. |
| Plausible | Local `public/plausible-privacy.js` client and hosted event service; no vendor SDK version pin | Review the local client's privacy and event tests. Hosted service version is not exposed by this repository. |
| GitHub Pages, Actions runners, Dependabot, Replit | Hosted services; workflows use `ubuntu-latest` | Provider updates, action PRs, workflow tests, deployment checks, and separate Replit smoke tests. No application-controlled SaaS version. |
| VS Code, browsers used by the owner, Explorer, ChatGPT/Codex | Authoring and inspection clients | Not dependencies of the shipped solution; their desktop application releases are outside this repository's update contract. |

## Update process implemented

1. **Detect daily.** `technology-version-audit.yml` runs at 14:17 UTC daily and supports manual dispatch. It reads every tracked `package.json`, the complete pnpm lockfile, workspace catalog, runtime feeds, workflows, and composite actions. It uses Node built-ins, so it can audit even when dependency installation is broken. It publishes Markdown and JSON artifacts plus the actual GitHub job summary.
2. **Propose updates.** Dependabot now checks npm and Actions daily, with a three-day npm cooldown, ten npm PR slots, and related React, Tailwind, and Vite updates grouped together. It also explicitly includes `.github/actions/setup-pnpm`, whose embedded action references were previously missed. Workspace catalogs and the shared lockfile stay together in the npm update. Mermaid majors remain excluded from automatic PRs under the repository's governance.
3. **Keep omissions visible.** The audit maintains one GitHub review issue for outdated declarations, runtime changes, ignored majors, lookup failures, and packages with no stable SemVer release. An unchanged backlog causes no issue edit. Lookup failures fail the workflow and cannot close the issue. This issue is the follow-up path when Dependabot cannot update a runtime or package-manager pin, or its PR queue stalls.
4. **Validate each update.** Require frozen installation, audit regression tests, unit tests, typecheck, formatting, build, skill tests, and Playwright. A resolved dependency graph is not proof that a major migration works. For the separate workbench, run its own build and visual smoke checks whenever its dependencies change; the root app suite does not prove workbench compatibility.
5. **Review and release.** Keep the repository's PR review and merge protections. No auto-merge or direct push to main is added. After merging, verify CI, Pages deployment, and the live app; update each local/Replit checkout and verify runtime plus lockfile parity separately. Revert the update PR if acceptance fails.

The existing `minimumReleaseAge: 1440` protection and hosted `--ignore-scripts` installation policy remain in place. The audit retrieves release metadata, not package executables, and does not install or upgrade dependencies itself.

GitHub documents [pnpm workspace catalog support](https://github.blog/changelog/2025-02-04-dependabot-now-supports-pnpm-workspace-catalogs-ga/) and [Dependabot schedules, groups, and cooldowns](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference). Composite directory handling was also checked in [Dependabot's action file fetcher](https://github.com/dependabot/dependabot-core/blob/main/github_actions/lib/dependabot/github_actions/file_fetcher.rb). The current supported-ecosystem list identifies pnpm versions through v10, which is another reason to review the 10-to-12 migration separately: [supported ecosystems](https://docs.github.com/en/code-security/reference/supply-chain-security/supported-ecosystems-and-repositories).

## Prioritized upgrade plan

| Order | Change | Acceptance and coordination |
| --- | --- | --- |
| 1 | Merge the audit and Dependabot changes, then manually dispatch Technology Version Audit | Confirm the JSON/Markdown artifacts, job summary, and single review issue. Confirm Dependabot opens root/workbench and composite-action updates. |
| 2 | Update Node 24 host patches, same-major npm packages, and action references | Windows, Replit, and CI checks. Pair Tailwind/Vite plugins and platform binaries. Keep Node type declarations aligned with APIs supported by the chosen runtime; current `@types/node` 26 is ahead of Node 24. |
| 3 | Review Mermaid 11.16.0 to **11.17.2** as a same-major step; plan Mermaid **12.0.0** separately | Review the capability registry and update `MERMAID_VERSION_VERIFIED` only after verification. Test every supported diagram family, ZenUML, previews, theme variables, exports, and renderer profiles. [Mermaid releases](https://github.com/mermaid-js/mermaid/releases) |
| 4 | Review Vitest 5, ZenUML 1, pnpm 12, and workbench major updates independently | Read migration notes, preserve recovery commits, and update configuration/lockfile together. Existing workbench PR #73 concerns react-resizable-panels; avoid duplicating it. |
| 5 | Refresh Python and Replit's Nix channel | Prefer a stable Windows Python; run skill tests on 3.11 and the proposed new line. Confirm Replit channel support and native dependencies, then rerun browser tests there. |
| 6 | Review language target and provider-managed assets quarterly | Raise ES2022 only for a justified feature and a tested browser floor. Review fonts, Forge tokens, analytics contract, hosted platform health, and Git/shell support. |

These are proposals. This task builds the inventory and update mechanism; it does not certify those candidate upgrades or install major versions.

## Reproducing the audit

```sh
corepack pnpm run test:technology-versions
node scripts/check-technology-versions.mjs --output-dir .local/technology-audit --fail-on-errors
node scripts/update-technology-issue.mjs .local/technology-audit/technology-version-report.json --dry-run
```

`--json` prints the full machine-readable report. `--fail-on-outdated` additionally fails when direct packages, runtimes, or actions need review. Transitive updates are listed comprehensively but upgraded through their parents, not forced independently. On GitHub the issue writer uses the built-in token with `contents: read` and `issues: write`; no secret or new dependency is required. Scheduling starts only after the workflow lands on the default branch and Actions is enabled. It can be disabled by pausing the workflow; Dependabot remains separately configurable.

## Validation of this maintenance change

The live audit completed with zero lookup errors. Its lockfile parser was independently compared with the installed YAML parser: all importer resolutions and all 550 package records matched. All 13 audit/issue regression tests, 22 CI workflow contract tests, and 86 headless skill tests passed. Typecheck, production build, formatting, version/documentation checks, and internal links in 83 Markdown files also passed. The build retains its existing large-chunk warning.

The initial inventory pass reported 3 failures among 3,171 application tests. Two timing failures passed on an unchanged targeted rerun. Subsequent Git reconciliation preserved the empty untracked `skills/okhp3-bpmn-for-mermaid/` skeleton outside the active catalog, fixed Windows line-ending checks, and repaired source discovery to scan all 196 TypeScript files. The affected source and catalog tests passed. Component tests now skip hosted font stylesheets in their simulated browser. Full-suite acceptance, hosted automation, and deployment evidence belong to the integration PR and its exact commit checks; initial local checks alone do not establish release readiness.

## Limitations and next checks

| Claim | Evidence tier | Evidence | Consequence if wrong / next check |
| --- | --- | --- | --- |
| Source versions and available npm/action releases | Confirmed | Local manifests and lockfile, GitHub root manifest, timestamped registry/API report | Rerun the audit before upgrading because releases change. |
| Replit runtime and Nix package-set versions | Confirmed at review time | Browser shell at source commit 51e3bc8 | Recheck after module/channel changes; these are not future guarantees. |
| Latest release is compatible with this app | Unknown | Candidate versions only | Run the update's full acceptance checks before merging. |
| Every transitive package has a stable release | False for `date-fns-jalali` | Publisher uses suffixes such as current `4.1.0-0` and latest tag `4.4.0-0`; no unsuffixed stable version found | Record publisher convention explicitly. Do not silently strip suffixes or treat a prerelease as stable. |
| Daily automation has run on GitHub | Not verified by local tests | Workflow is authored locally | Merge, dispatch, inspect hosted results and generated PRs. Local tests do not prove activation. |
| Whole machine / operating system is fully inventoried | Out of scope | App manifests, declared Nix packages, and observed runtimes only | Obtain a host software inventory if the goal expands beyond this solution. |

Next action: merge the tested maintenance change and dispatch the audit, then process the first grouped dependency PRs in the order above.
