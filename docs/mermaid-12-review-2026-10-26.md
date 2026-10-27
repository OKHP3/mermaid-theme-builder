# Mermaid 12.0.0 review checkpoint

Recorded October 26, 2026. Owner requested review and validation before Replit synchronization.

Status: candidate, not release acceptance. Do not synchronize Replit to the broken starting revision or count old green checks as validation of this upgrade.

Mermaid Theme Builder is a personal OverKill Hill P3 project by Jamie Hill.
It is not affiliated with Builders FirstSource, BFS, Mermaid, Mermaid Chart,
Mermaid.ai, or any third-party brand represented by user-entered colors.

## Starting state and findings

- Origin main `409a558db67d3317ceae68ba2a432266e0fff5b3` incorporated a concurrent Mermaid 12 experiment. Its CI, E2E, and Pages jobs failed before tests at frozen installation. A fresh independent clone reproduced the missing `lodash-es@4.17.23` lockfile entry. No shared checkout was reset.
- ZenUML 0.2.3 declares only Mermaid 10/11 peers. Existing adapter upgraded to exact 1.0.1, whose publisher explicitly supports 12. Its September 18 publication clears the retained one-day release-age requirement.
- The lockfile also referenced DOMPurify 3.4.11 despite the workspace security override. Regeneration restored that override; current audit then found newer DOMPurify and lodash-es advisories. Raise the sanitizer override to 3.4.17 and resolve lodash-es to patched 4.18.1. No audit allowlist or age bypass was added.
- Existing Classic output omitted `look`, and previews initialized without explicit appearance/layout. Three new regression assertions failed on that behavior. Pin Classic and Dagre in both export formats and preview defaults while retaining base theme variables and opt-in looks. Existing export snapshots changed for those explicit keys only.
- The pinned core package registers `usecase-beta` as family `usecase`. Add conservative beta/limited guidance with its example explicitly pending. No claim of full palette parity, a second separate business family, or cross-renderer support is made.

## Compatibility boundaries

The [Mermaid 12 release](https://github.com/mermaid-js/mermaid/releases/tag/mermaid@12.0.0) raises the runtime/browser floor to Node 22.12, ES2024, and Safari 17.4. Repository Node 24 meets that floor. Older browsers are no longer a supported acceptance target for this candidate. Layout defaults and legacy renderer-selection settings changed. This app already uses the official core module entry point and its own family detector, not removed legacy detector IDs. Export defaults are explicit to preserve prior intent.

The [ZenUML 1.0.1 release](https://github.com/mermaid-js/mermaid/releases/tag/@mermaid-js%2Fmermaid-zenuml@1.0.1) documents Mermaid 12 peer compatibility. A peer range is not proof of successful browser rendering; the new positive render test must pass.

## Evidence and remaining gates

- Original repaired lock plus adapter: frozen installation, 3,176 existing unit tests, and both package typechecks passed.
- Security correction: production audit at moderate threshold passed with one remaining low advisory. This is not a zero-vulnerability claim or an analysis of every bundled dependency.
- Output correction: three new assertions failed before the fix. Then 111 expected snapshot changes were regenerated across four files. All 3,179 unit tests passed after the correction and new family detection test. No assertions or required checks were disabled.
- Documentation truth, format, and typecheck passed locally. macOS native build is not an acceptance substitute: existing workspace policy excludes Darwin CSS bindings. Linux production build and complete browser tests remain mandatory.
- New browser checks require positive, nonempty rendering of flowchart, class, state, ER, requirement, use case, and ZenUML. They do not accept a render error or timeout as a successful diagram.
- Remaining: exact-head Linux build and browser results, any targeted repairs those expose, full required PR checks, review of the new-family guidance, version/release policy before shipping, merged revision verification, Replit frozen installation and preview behavior in Free Mode, final receipt and safe cleanup.
- Authenticated Edge access disappeared when the Mac locked. Replit remains on reviewed `14a1583e42739948e2c549f2fa55208a1eae3465`, not this candidate. Its original unpublished work and the generated fixture deletion are preserved separately. No paid agent or deployment was used.

## Restart boundary

Review clone: `/tmp/mermaid-v12-review.MFwVlN/fresh`, branch `codex/review-mermaid-12-closeout`. Shared task worktrees were repurposed by another writer and must not be deleted or switched. The [central closeout execution receipt](https://github.com/OKHP3/mermaid-theme-builder/pull/125) records prior integrations and the final state as it occurs. Archive only after it reports verified COMPLETE.
