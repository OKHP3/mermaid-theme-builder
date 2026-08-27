# Replit Remediation and Community Readiness Directive

**Date:** 2026-08-21  
**Status:** Owner-requested delivery directive. It is not authorization to publish, post, or claim an official Mermaid role.  
**Operator:** Replit Agent working in this exact repository checkout.  
**Repository:** `OKHP3/mermaid-theme-builder`  
**Product:** Mermaid Theme Builder v0.6.1

## 1. Operating instruction

Read this directive, `AGENTS.md`, and `replit.md` completely before making a
change. Remediate the repository so the current source, lockfile, tests,
documentation, GitHub Pages deployment, and public description agree.

The outcome is a tested, deployable, browser-only companion for Mermaid styling
and theme-governance work. It is not permission to represent the project as an
official Mermaid product, a fix for Mermaid defects, or evidence of an official
community role.

Work in the stated order. Do not skip a failed gate by deleting tests, weakening
assertions, muting accessibility checks, relaxing frozen installation, or
writing a claim that cannot be shown in the deployed build.

All repository guardrails remain binding:

- Work only in this repository.
- Make localized changes. Ask before a broad refactor.
- Add no dependencies without owner approval.
- Add no backend, login, cloud storage, file upload, payment, AI API, or
  analytics that transmit pasted diagram content.
- Do not fork or copy Mermaid source.
- Use US English. Do not add em dashes.
- Do not hand-edit `src/styles/forge-tokens.css`.
- Do not post, reply, react, follow, send messages, open third-party pull
  requests, or otherwise write externally without the owner's separate review
  and approval of exact text and target.

## 2. Product contract

Mermaid Theme Builder is an independent OverKill Hill P3 static browser tool. It
works locally in the browser: a person supplies Mermaid text, selects or edits
a palette and renderer profile, previews the result, then copies or exports
usable artifacts.

This workflow is release-critical:

```text
paste Mermaid -> detect diagram family -> select or edit theme ->
generate themed Mermaid -> preview -> copy or export
```

Do not add a server, account, or external data path to implement this work.

Use this description only after the release gates below pass:

> Mermaid Theme Builder is an independent, browser-only companion for preparing
> Mermaid base-theme configurations, previewing styled diagrams, and exporting
> portable authoring artifacts. It communicates family and renderer limitations.
> It does not repair Mermaid parser, layout, host-renderer, or SVG-emission
> defects.

Retain the repository's canonical non-affiliation disclaimer in major product
and promotion materials:

> Mermaid Theme Builder is a personal OverKill Hill P3 project by Jamie Hill.
> It is not affiliated with Builders FirstSource, BFS, Mermaid, Mermaid Chart,
> Mermaid.ai, or any third-party brand represented by user-entered colors.

## 3. Verified baseline

Reconfirm these findings in the working tree before editing and report every
difference in the delivery record.

| Finding | Tier | Evidence and required response |
| --- | --- | --- |
| The root package is v0.6.1 and pins Mermaid 11.16.0. | Confirmed | Root `package.json`. Align registry, lockfile, docs, and release material after repair. |
| Current `main` fails CI and Pages deployment. | Confirmed | Actions run `32437211610` failed on 2026-08-21 because frozen pnpm installation found a stale lockfile. Repair the root cause. |
| The live Pages URL serves an older successful deployment. | Confirmed | Current `main` is `e8d0d85c4cce4e970073eaadb8d6d1f4743cd757`; live assets returned HTTP 200 with a 2026-08-20 last-modified date. Do not call current `main` live until a deployment for its release commit succeeds. |
| A second source package is in the workspace but not the lockfile importers. | Confirmed | `artifacts/mermaid-theme-workbench/package.json` exists, `pnpm-workspace.yaml` includes artifact packages, and the corresponding importer is absent from `pnpm-lock.yaml`. Reconcile topology and lock truth. |
| TypeScript fails in `ApplyTab.tsx`. | Confirmed | The component aliases `onPreviewModeChange` to `setPreviewMode` then later calls the original name. Repair the callback contract. |
| Unit tests fail under local Node 24. | Confirmed | Failures include local-storage initialization behavior and 35 assertions across 12 files when using a temporary local-storage file. Diagnose every cause. |
| The macOS build cannot resolve the Lightning CSS native binary. | Confirmed | Build failed loading `lightningcss.darwin-arm64.node`. Establish a real platform policy. |
| Repository guidance is stale. | Confirmed | `AGENTS.md` and `replit.md` describe a source-free artifact area. `AGENTS.md` says v0.6.0 while the root manifest is v0.6.1. Update only after topology is decided. |
| Existing doc checks miss this drift. | Confirmed | Existing documentation checks pass despite the topology conflict. Add a narrow prevention check. |
| The headless skill package passes. | Confirmed | `node --test skills/okhp3-mermaid-theme-builder/tests/*.test.mjs` passed 86 tests. Preserve it and rerun after relevant changes. |
| Mermaid 11.16.1 is the advisory-patched release for GHSA-c4c3-pg64-4m4v. | Confirmed external | [GitHub Advisory GHSA-c4c3-pg64-4m4v](https://github.com/advisories/GHSA-c4c3-pg64-4m4v). Review and test the exact upgrade after workspace repair. |
| No safe Replit workspace target was found in repository configuration. | Unknown | Do not state that Replit deployment has occurred. Use this directive in the matching Replit workspace when it is identified. |

## 4. Required outcome

Deliver a coherent product state:

1. One documented application topology and a lockfile representing every
   included workspace package.
2. Clean frozen installation, typecheck, unit tests, formatting, build,
   documentation checks, skill tests, and end-to-end tests.
3. A successful Pages deployment for the released commit.
4. Live-site evidence tied to that release, not merely an HTTP 200 response.
5. Documentation that accurately states product capability, privacy boundary,
   support level, and limitations.
6. A private outreach packet for later review. No external promotion during
   this work.

The final status must be **GO**, **NO-GO**, or **CONDITIONALLY READY**. A
skipped or unavailable release-critical validator is not a pass.

## 5. Scope

### Included

- Fixing repository state that blocks installation, CI, test, build, deployment,
  or accurate public claims.
- Reconciling the artifact workspace topology and lockfile.
- Repairing the identified source, test, platform, and documentation failures.
- Reviewing and testing an exact Mermaid 11.16.1 upgrade.
- Preparing private public-signal research and owner-review response drafts.

### Excluded unless separately approved

- A redesign, a large component rewrite, or new product line.
- New dependencies.
- Automatic monitoring or alerting services.
- Private, authenticated, invite-only, or direct-message research.
- Any external post, issue, pull request, reaction, email, or direct message.
- Claims of official Mermaid affiliation, partnership, maintainership, or
  endorsement.

## 6. Execution plan

### Phase 0. Baseline and failure capture

Before editing:

1. Record `git status --short --branch`, `git rev-parse HEAD`, and
   `git rev-parse origin/main`.
2. Read the package manifests, workspace and lockfile, Vite and Vitest
   configuration, Pages and CI workflows, affected source, and affected tests.
3. Capture exact output for:

```sh
pnpm install --frozen-lockfile --ignore-scripts
pnpm run typecheck
pnpm run test
BASE_PATH=/mermaid-theme-builder/ PORT=18624 pnpm run build
```

4. Confirm supported Node and pnpm versions from configuration and workflows.
5. Keep a dated repair record based only on observed facts.

**Exit condition:** every failing command has a localized probable cause and
next validation step.

### Phase 1. Workspace and lockfile truth

The root application remains source of truth unless repository evidence proves
an approved alternative. The workbench package is a deployment blocker because
it is included in the workspace but does not have a lockfile importer.

First inventory `artifacts/mermaid-theme-workbench`:

- commit introduction and stated purpose;
- source imports, links, workflows, documentation, or registrations that use it;
- whether it contains unique behavior absent from `src/`;
- whether it is a deliberate maintained package or generated surplus.

Then select exactly one route based on evidence.

**Route A: supported package.** Use only if it is intended to ship or be
maintained. Make it reproducible, validate it with package-specific commands,
document its role and deployment ownership, and ensure it cannot accidentally
block the root Pages release.

**Route B: unintended surplus.** Use when no evidence establishes it as a
maintained product package. Preserve any unique, in-scope behavior first. Then
remove the surplus package, workspace inclusion, and stale references in one
focused change. Never remove
`artifacts/mermaid-theme-builder/.replit-artifact/artifact.toml`.

After the decision, regenerate the lockfile using the pinned package manager
and prove:

```sh
pnpm install --frozen-lockfile --ignore-scripts
```

Do not change CI to mutable installation. Do not commit caches, `node_modules`,
or native binaries. If evidence cannot distinguish the routes, stop and request
the smallest required owner decision.

**Exit condition:** frozen installation passes from a clean environment and
documentation matches the retained topology.

### Phase 2. Source and test integrity

Repair the `ApplyTab.tsx` preview-mode callback at the contract boundary. Add
or retain a focused test proving the selected diagram or example changes preview
mode correctly. Run it before and after the repair, then run full typecheck.

For every failing test:

1. Classify the defect: test environment, state leakage, implementation,
   outdated expectation, or accessibility.
2. Identify the product source of truth.
3. Repair the narrowest correct layer.
4. Run the focused file and then the full suite.

For local storage, define a repeatable, cross-platform test-runner strategy that
preserves per-test isolation. Do not require a developer-specific path or an
undocumented shell flag. Do not solve failures by turning off storage isolation.

For accessibility, fix invalid ARIA values, labels, and keyboard behavior in
the product. Do not suppress axe rules without a documented valid exception.

**Exit condition:** `pnpm run typecheck` and `pnpm run test` pass with no
test exclusions, unreliable retries, or broad weakened assertions.

### Phase 3. Build-platform policy

Investigate the missing macOS Lightning CSS binary through workspace overrides,
optional dependencies, lockfile data, and Vite configuration. Select and
validate one supported policy:

- Cross-platform development: clean installation and build work on supported
  macOS arm64 and GitHub Actions Linux.
- Linux deployment only: macOS build is explicitly unsupported and a documented,
  tested alternative path exists.

Cross-platform development is preferred. Do not select Linux-only merely to
avoid repair. Never commit native binaries or machine-specific caches.

**Exit condition:** Pages Linux build passes and every claimed developer
platform has been independently validated.

### Phase 4. Mermaid security and capability review

Only after the workspace, typecheck, tests, and build are healthy, review an
exact upgrade from Mermaid 11.16.0 to 11.16.1. The official advisory identifies
11.16.1 as the patched release for GHSA-c4c3-pg64-4m4v. This is a
review-and-test requirement, not an automatic version bump.

1. Read the advisory, release information, and relevant upstream issue state.
2. Update the exact dependency and lockfile.
3. Update `MERMAID_VERSION_VERIFIED` in
   `src/data/mermaid-capabilities.ts`.
4. Update version-sensitive documentation, changelog, and release checklist
   material from verified facts.
5. Regression-test representative fixtures for every declared diagram family
   and renderer profile. Include flowcharts, subgraphs, C4, class diagrams,
   dark mode, and frontmatter configuration.
6. Check for upstream regressions before saying 11.16.1 is an unqualified
   improvement. A Mermaid layout defect remains an upstream defect.

If the upgrade produces a release-critical regression, keep 11.16.0 only with a
precise reproduction, documented risk decision, and owner-visible follow-up.
Do not state that the advisory concern is resolved until an upgrade or other
verified mitigation exists.

**Exit condition:** selected dependency version, registry, lockfile,
documentation, and tested behavior agree.

### Phase 5. Documentation and regression prevention

After the source and topology decisions, review at least:

- `AGENTS.md`
- `replit.md`
- `README.md`
- `CHANGELOG.md`
- `docs/technical-debt-register.md`
- `docs/promotion-strategy.md`
- `docs/mermaid-capability-registry.md`
- `docs/release-checklist.md`
- `.github/workflows/ci.yml`
- `.github/workflows/deploy-pages.yml`

Correct version statements, workspace and artifact claims, deployment status,
capability-language drift, privacy statements, and non-affiliation wording.
Do not write that every document is current without naming its verified source.

Add a narrow check for the failure mode found here. A suitable approach is a
built-in-Node script that checks each supported workspace manifest against
lockfile importers and compares documented version or artifact-topology claims
with the source of truth. Do not add a dependency to implement the check.

**Exit condition:** all documentation checks and the new targeted check pass,
and the repository distinguishes implemented behavior, planned work, limits,
and unknown external state.

### Phase 6. Release validation and deployment

From a clean supported environment, run:

```sh
pnpm install --frozen-lockfile --ignore-scripts
pnpm run typecheck
pnpm run test
pnpm run format
pnpm run check:doc-truth
pnpm run check:source-refs
pnpm run check:version-strings
BASE_PATH=/mermaid-theme-builder/ PORT=18624 pnpm run build
node --test skills/okhp3-mermaid-theme-builder/tests/*.test.mjs
git diff --check
```

Run the repository's current Playwright suite as well. If browser binaries or an
environment prerequisite are unavailable, use the documented project setup when
authorized. Otherwise mark the result unavailable and release status NO-GO.

Use a real browser to verify:

1. Flowchart, class, C4, and unknown or unsupported diagram input.
2. Family detection and capability messages.
3. Palette selection and editing, renderer-profile changes, and preview.
4. Mermaid, Markdown, and prompt-scaffold export.
5. Metadata toggling and flowchart-only attribution badge behavior.
6. Local persistence without an application service receiving pasted diagram
   text.
7. Keyboard navigation, accessibility, and a narrow mobile viewport.
8. Service-worker update behavior after a new release.

After release:

1. Confirm Pages workflow success for the release SHA.
2. Confirm the live URL contains the current build, not merely an old HTTP 200
   page.
3. Tie the live application to the release through a visible or inspectable
   build-provenance marker, commit marker, or verified asset mapping.
4. Record live URL, run URL, SHA, verification time, and verifier.

**Exit condition:** every release-critical command passes, Pages succeeds for
the release commit, and browser verification matches that deployment.

## 7. Community contribution and public-signal workstream

Begin this work only after Phase 6 passes. Its purpose is helpful,
evidence-based contribution and careful identification of narrow situations
where the deployed application may be relevant. It is not a lead-generation
exercise or a reason to attach a tool link to unrelated bug reports.

### 7.1 Permitted research sources

Review only public, lawfully accessible content:

1. [Mermaid core GitHub issues and discussions](https://github.com/mermaid-js/mermaid).
2. [Mermaid Live Editor GitHub issues and discussions](https://github.com/mermaid-js/mermaid-live-editor).
3. [Official theming guidance](https://mermaid.js.org/config/theming.html) and
   [official contribution guidance](https://mermaid.js.org/community/contributing.html).
4. Public official Mermaid community spaces when their rules allow review.
5. Public issue trackers for documented Mermaid integrations when a request
   specifically concerns theme configuration, authoring, or renderer-aware
   style communication.

Discord status is **unknown**. Do not search private servers, bypass
authentication, collect member data, use automation, or read direct messages.
Reviewing Discord requires a public channel link, an owner-authorized access
method, and a clear explanation of channel rules.

### 7.2 Fit taxonomy

Potentially relevant requests concern:

- Base-theme variables and theme-variable discoverability.
- Cross-diagram visual consistency.
- Palette choice, contrast, dark-mode guidance, and color governance.
- Renderer-profile communication and host-specific styling limits.
- Theme-aware Mermaid examples and authoring scaffolds.
- Documentation gaps that a companion example can clarify.

Not relevant by default:

- Parser, layout, routing, subgraph, or rendering-engine defects.
- SVG or CSS-variable emission defects.
- Live Editor export-fidelity defects.
- Requests for official Mermaid API or built-in theme additions.
- Dependency security fixes.

### 7.3 Initial public-source ledger

These are research leads, not instructions to post.

| Source | Signal | Fit and disposition |
| --- | --- | --- |
| [Mermaid issue #7815](https://github.com/mermaid-js/mermaid/issues/7815) | Open request for consistent styling across diagram types. A maintainer noted the theming documentation needs improvement and theme variables should be applied more consistently. | Potentially relevant only after live validation. The builder can prepare base-theme configuration and expose limits; it cannot make upstream theming consistent. Prepare a private draft only. |
| [Mermaid issue #7670](https://github.com/mermaid-js/mermaid/issues/7670) | Open request for more complete configuration and theming documentation. | Possible documentation contribution route, not a promotion venue. Offer a narrow example or matrix only if maintainers ask. |
| [Mermaid issue #4906](https://github.com/mermaid-js/mermaid/issues/4906) | C4 theme support request with active upstream implementation discussion. | Not a fit for tool promotion. Track only for registry testing. |
| [Mermaid issue #8007](https://github.com/mermaid-js/mermaid/issues/8007) | CSS-variable emission and SVG behavior concern. | Not a fit. The application does not alter Mermaid SVG emission. |
| [Mermaid issue #8066](https://github.com/mermaid-js/mermaid/issues/8066) | Subgraph direction and edge-layout regression. | Not a fit. It is an upstream layout defect. |
| [Mermaid issue #7324](https://github.com/mermaid-js/mermaid/issues/7324) | Styling question already answered by a maintainer. | Do not comment. A companion product mention adds no clear value. |
| [Live Editor issue #1932](https://github.com/mermaid-js/mermaid-live-editor/issues/1932) | Class-diagram PNG rendering concern. | Do not comment unless a deployed, reproducible application behavior gives a directly tested workaround. |

### 7.4 Candidate ledger requirements

After release validation, maintain any public-signal record privately in
`docs/`. Each candidate requires:

| Field | Required content |
| --- | --- |
| Source URL | Direct public link. |
| Retrieval date | Date and time reviewed. |
| Source state | Open, closed, answered, stale, or active. |
| Requester need | Faithful short summary. |
| Matching capability | Specific deployed behavior, test, registry entry, or export. |
| Limitation | What the application does not do for the requester. |
| Readiness evidence | Release SHA, successful deployment, and validation date. |
| Draft response | Helpful response first and optional tool mention second. |
| Risk | Spam, stale thread, duplicate answer, scope mismatch, or affiliation risk. |
| Disposition | No action, watch, owner review, approved, or posted. |

Keyword overlap is not fit. Request owner review only if the requester has a
current direct need, the deployed feature is verified for the relevant diagram
and renderer, the message adds information beyond maintainer responses, the
message states its limitation, community rules allow it, and the owner approves
the exact text and destination.

### 7.5 Contribution posture and draft

Build community credibility through accurate reproduction, narrowly scoped
documentation or tests when requested, transparent maintenance, and clear
limitations. Do not claim to be a primary community member, maintainer, partner,
or endorsed product without formal evidence.

Owner-review-only draft:

> I agree that [specific theme-authoring difficulty] is difficult across
> diagram families. I maintain an independent browser-only companion, Mermaid
> Theme Builder, that helps prepare base-theme variables, preview the result,
> and make family or renderer limitations visible. It does not change Mermaid's
> upstream rendering behavior. If useful, the current tested version is here:
> [verified live URL]. I would welcome feedback on whether its capability notes
> or examples would help this documentation work.

This is not authorization to send.

## 8. Claim controls

| Claim | Status | Rule |
| --- | --- | --- |
| The app is browser-only and does not send pasted diagram content to an app backend. | Allowed after source and network verification. | Cite the release evidence. |
| The app supports a named diagram family. | Allowed only for registry-supported and release-tested behavior. | State support level and renderer limit. |
| The app fixes Mermaid styling inconsistency. | Not allowed. | It helps authoring and cannot alter unsupported upstream behavior. |
| The app solves Mermaid parser, layout, export, or SVG defects. | Not allowed by default. | Require direct tested proof. |
| The app is live. | Allowed only after current SHA deployment and live-provenance check. | Never infer from HTTP 200 alone. |
| The creator is a Mermaid maintainer or official member. | Not allowed without formal evidence. | Describe actual independent contribution work instead. |
| Mermaid recommends the app. | Not allowed without explicit authorization. | Never infer endorsement from a link or comment. |

## 9. Acceptance matrix

| Gate | Evidence | Release-critical |
| --- | --- | --- |
| Workspace topology | Inventory, chosen route, matching lockfile importers. | Yes |
| Frozen install | Clean frozen install pass. | Yes |
| Type safety | Typecheck pass. | Yes |
| Tests | Full test pass without unjustified exclusions. | Yes |
| Format | Format pass. | Yes |
| Documentation | Existing and new drift check pass. | Yes |
| Build | Exact Pages base-path build pass. | Yes |
| Skill | Headless skill test pass. | Yes |
| End-to-end | Current Playwright suite pass. | Yes |
| Browser review | Core workflow, privacy, mobile, and accessibility results. | Yes |
| Pages | Successful workflow for release SHA. | Yes |
| Live provenance | Current live build tied to release. | Yes |
| Outreach | Owner approves exact copy and target before remote write. | Yes before external action |

## 10. Final delivery record

Append a dated record to this document or write a dated handoff under `docs/`.
It must include:

1. GO, NO-GO, or CONDITIONALLY READY.
2. Branch, SHA, package version, Mermaid version, deployment URL, run URL, and
   verification time.
3. Changed files and one-sentence purpose for each.
4. Workspace route and evidence, including preserved behavior if any.
5. Every validation command, exact result, environment, and date.
6. Manual browser results for every Phase 6 scenario.
7. Documentation updates and evidence source.
8. Security and privacy result.
9. Public candidates reviewed, fit reason, and confirmation that no unapproved
   public action occurred.
10. Remaining risks and exact owner decision, if any.

Do not write that a check passed if it was skipped, unavailable, or run against
an older commit.

## 11. Stop conditions and definition of done

Stop and request owner direction if workspace intent cannot be proven, a repair
requires a new dependency or prohibited service, deleting the workbench would
discard unreconciled unique behavior, Mermaid 11.16.1 causes a critical
regression, deployment needs unavailable credentials, or a proposed public
message needs an unproven claim.

At a stop, report observed evidence, available options, impact, recommendation,
and the smallest approval needed.

Done means the current commit is demonstrably deployable, live verification
matches that commit, documentation makes accurate limited claims, and a
responsible owner-review outreach packet exists. A lockfile change, an HTTP 200
response, or a promotional draft alone is not done.
