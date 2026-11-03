# Stable foundation maintenance

Mermaid Theme Builder is a personal OverKill Hill P3 project by Jamie Hill.
It is not affiliated with Builders FirstSource, BFS, Mermaid, Mermaid Chart,
Mermaid.ai, or any third-party brand represented by user-entered colors.

## Version contract

The application uses exact direct dependency pins, a committed pnpm lockfile,
and frozen installations. The root Builder and separate Workbench are both in
scope. Historical inventories remain historical; generate a fresh report with
`node scripts/check-technology-versions.mjs --output-dir <approved-report-home> --fail-on-errors`.
It lists direct and transitive packages, workspace declarations, Actions,
runtime selectors, source URLs, lookup failures, and latest stable releases.

The reviewed candidate uses Mermaid **12.2.0**, ZenUML **1.0.1**, React **19.3.1**,
Vite **8.3.5**, TypeScript **7.0.2**, Tailwind **4.3.3**, Vitest **5.0.5**,
Playwright **1.64.1**, and pnpm **12.16.1**. CI pins Node **26.13.0** LTS and
Python **3.15.2**. These are source/test targets, not a claim of deployment.

Tailwind 4.3.4, Vitest 5.1.0, and the newest Vite React plugin release were still
inside the three-day release-age window during the November 2 review. The
updater selects the newest eligible stable release at or below the vendor's
`latest` tag, so a new tag does not block an older security patch. It never
selects alpha, beta, RC, nightly, or canary packages or downgrades a pin.
Beta diagram families inside stable Mermaid remain labeled as such; they are
not prerelease package installations.

## Mermaid compatibility review

The [12.0 review](mermaid-12-review-2026-10-26.md) remains the basis for the
ES2024/Safari 17.4+ floor, compatible ZenUML 1, and explicit Classic/Dagre
defaults. Those defaults are preserved in previews and exports.

[Mermaid 12.1](https://github.com/mermaid-js/mermaid/releases/tag/mermaid@12.1.0)
adds ELK feedback-edge orientation and packet bit order and updates the parser.
[Mermaid 12.2](https://github.com/mermaid-js/mermaid/releases/tag/mermaid@12.2.0)
adds opt-in depth coloring for mindmaps and fixes label sizing, ELK routing,
mindmap labels, and swimlane rendering. No new Builder controls or expanded
styling promises are introduced. Positive rendering regressions include the
existing seven migration cases plus mindmap labels and circle-label sizing.

`check:version-strings` rejects any mismatch between the exact Mermaid pin and
`MERMAID_VERSION_VERIFIED`. The updater deliberately does not mark a new
renderer verified. Review vendor notes, capability guidance, and actual
rendering before changing that constant and its export snapshots.

## Daily update path

1. `foundation-updates.yml` checks official npm, Node LTS, and Python stable
   release feeds daily at 14:43 UTC and on manual dispatch.
2. `update-foundation.mjs` resolves all metadata before writing, rejects
   incomplete/deprecated/prerelease latest tags, applies a three-day cooldown,
   and updates actual workspace dependency declarations plus runtime pins.
   Unused catalog entries, local workspace references, and transitive majors
   are not independently upgraded.
3. It regenerates the lockfile, verifies a frozen install, and opens one review
   PR. An existing proposal is not overwritten. Failures are visible in Actions.
4. The workflow explicitly dispatches CI, E2E, links, and skill tests on the new
   branch. This is required because PRs created with `GITHUB_TOKEN` do not
   automatically trigger PR workflows. CI builds both applications. Mermaid
   drift intentionally blocks acceptance until reviewed.
5. The owner or an authorized agent reviews and merges with all protections
   intact. There is no unattended merge, direct main push, paid Replit job,
   new credential, or paid hosting. Updates are proposed automatically, not
   guaranteed deployed without review. Major migrations require explicit review.

Dependabot still handles security updates and daily GitHub Actions updates.
Its npm version PR limit is zero to avoid duplicate version proposals.
The independent daily technology audit and single backlog issue remain active,
including lookup failures and Replit runtime/channel drift.

## Runtime and Replit boundaries

Use `node scripts/run-pnpm.mjs <command>` on hosts with an older Corepack.
pnpm 12 is a native executable; old Corepack expects a removed JavaScript file.
CI installs the exact `packageManager` value through npm with scripts disabled.
[Vendor installation guidance](https://pnpm.io/installation) and
[GitHub ecosystem support](https://docs.github.com/en/code-security/reference/supply-chain-security/supported-ecosystems-and-repositories)
confirm native pnpm 12 and Dependabot support.

Replit Free Mode was used for planning and runtime checks. Its worker was
occupied by an unrelated task, so the new queued duplicate implementation was
canceled without stopping existing work. Replit's clean main was still at
`14a1583` when inspected. Native pnpm 12.16.1 launched successfully there.
Node 26's upstream binary failed because `libatomic.so.1` was unavailable.
The existing Replit Node 24.22.1 host and `.replit` Node 24 selector are retained;
CI's Node 26 target does not prove Replit Node 26 support. Python 3.11 and the
Replit Nix channel also remain host migration items, not silently edited to
unverified module names. No paid mode or deployment was used.

## Security and acceptance

The upgrade patches source-map-js to 1.2.2, the legacy PostCSS selector parser
to 6.1.5, and Vitest to 5.0.5. The findings affect source-map/selector processing
and test mock-server behavior. They are development dependencies, but that
classification alone is not proof of unreachability. Patches are preferred to
assuming safety. The package audit reported zero advisories after resolution.

Before merge, require frozen install, full unit tests, both builds, Workbench
tests, typechecks, formatting, metadata/doc/workflow checks, skill tests, and
the full Playwright suite. Review license changes separately when a vendor
changes licensing; a clean vulnerability scan is not a legal certification.
After merge, verify Pages and the live app, then fast-forward each clean host
checkout and verify its installed versions and preview separately. Do not
reset or force-push a diverged Replit workspace.
