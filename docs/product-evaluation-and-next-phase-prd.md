# Product Evaluation and Next-Phase PRD

**Product:** Mermaid Theme Builder  
**Assessment date:** 2026-08-06  
**Reviewed release:** live `v0.6.1-e54b273` on GitHub Pages  
**Decision:** Continue, but do not broaden feature scope before the trust, first-use, and distribution gaps below are closed.

## Executive decision

Mermaid Theme Builder is a real product-shaped workbench, not a basic SPA or a speculative prototype. Its core use case works: a person can bring Mermaid code into the application, choose a visual profile and target renderer, see a rendered result, receive compatibility guidance, and export code or an AI-facing scaffold. The product has a credible differentiator in the combination of family awareness, renderer constraints, and prompt-scaffold export.

It is not yet a coherent public distribution hub. The implementation has outpaced the product narrative and first-use path. A new user lands in a dense five-tab workspace with a self-referential example, a custom theme slot, and many controls before understanding what outcome the product offers or which route to take. The skill distribution surface is present in the repository and catalog, but not yet designed as a product journey. Product claims and planning records also disagree about versions, family counts, and what is complete.

The next release should be a focused **Governance Profile and Adoption release**, not a wider expansion of diagram types, editor features, or integrations.

## Assessment basis and limits

### Directly reviewed

- Product documentation, roadmap, technical-debt register, release evidence, lifecycle definitions, market research, README, and planning PRDs.
- The live GitHub Pages application in desktop and 390 px mobile layouts.
- The active code structure, application state handling, renderer registry, exports, tests, build configuration, service worker, and workflows.
- The live core flow with GitHub selected as renderer, including preflight warnings and the prompt-scaffold dialog.

### Validation results

| Check | Result | Interpretation |
|---|---|---|
| Live application | Passed | `v0.6.1-e54b273` loaded and all five tabs were reachable. Apply, Examples, Reference, Extract, renderer guidance, and prompt scaffold were inspected. |
| TypeScript | Passed | `pnpm run typecheck` completed locally. |
| Published skill tests | Passed | 86 tests passed in `skills/okhp3-mermaid-theme-builder/tests`. |
| GitHub Pages deployment | Passed | The current commit had a successful deployment workflow on 2026-08-06. |
| Local unit suite | Not reproducible | 15 files and 378 tests failed because the current local runner did not provision `localStorage` for all browser-oriented tests. This is a test-environment defect, not proof that those features fail in the browser. |
| Local production build | Not reproducible | The local dependency tree lacks the macOS `lightningcss` native binary. The current GitHub Pages deployment did build successfully on Ubuntu. |
| WCAG 2.1 AA audit | Not run | The repository itself records this as an open v1 gate. |
| Offline PWA verification | Not run | Service-worker registration exists, but no current offline acceptance test was found. |

Do not represent the not-run checks as passing. Do not represent local failures as live-product failures without reproducing them in the supported Node 24 and installation environment.

## 1. Reconstructed Product Vision

### Product thesis

Mermaid Theme Builder is intended to be the visual-governance layer for Mermaid diagrams, especially diagrams generated or maintained with AI. It is not meant to compete as a general diagram editor, diagram generator, collaboration platform, or hosted content system.

Its lasting value is the portable **governance profile**: a controlled palette, typography hierarchy, Mermaid look, class definitions, output format, renderer target, and compatibility constraints that can be applied by a human in the browser or by an agent through the distributed skill package.

### Audience and jobs

| Audience | Job to be done | Required product result |
|---|---|---|
| AI power user | Keep future AI-generated Mermaid output visually consistent. | Copy a prompt scaffold or reusable profile that gives the model a non-invented styling contract. |
| Technical writer or architect | Make existing diagram-as-code portable and consistent across documentation surfaces. | Apply a profile, understand renderer losses before publishing, then export ready-to-use Mermaid or Markdown. |
| Brand or documentation steward | Define a standard without operating a backend or requiring accounts. | Create, name, version, share, import, and recover a local governance profile. |
| Agent or skill consumer | Apply the same governed output in an AI-assisted workflow. | Find the right skill, install or copy a profile, and obtain predictable artifacts and warnings. |

### Intended lifecycle

The evolving documents describe a lifecycle rather than merely five application tabs:

```text
Compose profile -> Apply to source -> Repair when necessary -> Validate target constraints -> Export or distribute -> Reuse in human and agent workflows
```

Extract and Update support the reverse and repeat paths. Examples and Reference provide learning, discovery, and evidence. The public skill family is the distribution channel that takes the same governance rules beyond the browser.

### Experience standard

The desired experience is precise, editorial, privacy-preserving, and candid about Mermaid limitations. It should make a complex compatibility problem feel legible, not hide it. It must retain the static, browser-only model: no accounts, backend, AI API, cloud persistence, or transmission of pasted diagram content.

## 2. Current Application Assessment

### What exists and works well

| Surface | Current implementation | Assessment |
|---|---|---|
| Apply | Code input, automatic detection with manual type selection, palette, renderer, and look controls, original/themed/diff/code views, pan and zoom, preflight, copy, download, and Live Editor handoff. | Strong core workbench. The live GitHub selection correctly surfaced font and renderer constraints. |
| Compose | Named local theme slots, duplication, ordering, import/export, color, typography, look, and preview controls. | Substantial authoring surface. It is richer than the older roadmap description. |
| Extract | Reads a theme directive or YAML frontmatter from pasted Mermaid to create editable local palette data. | Restored and appropriately scoped. The empty state is clear. |
| Examples | Grouped examples with themed preview, capability labels, raw-code copy, and load-to-Apply. | Useful learning bridge, particularly for technical users. |
| Reference | Class library, renderer parity, diagram inventory, and a catalog of ten Mermaid Agent Skills. | The right ingredients for a knowledge hub, but currently a compact catalog rather than a guided distribution center. |
| Export | Styled Mermaid, Markdown, Prompt Scaffold, SVG, PNG, JSON, CSS, and bundle downloads. | Excellent breadth when paired with a clear choice model. The prompt scaffold is the product's most distinctive output. |
| Privacy and persistence | Browser-only processing, local storage, URL state, clipboard, local downloads, and no account model. | Architecture aligns strongly with the stated privacy boundary. |
| Delivery | GitHub Pages deployment, PWA manifest/service worker, current live deployment, code-level test coverage, E2E suite, and skill-package tests. | Material engineering investment with a real release path. |

### User-experience assessment

The desktop workbench is visually consistent and communicates the Forge brand. At mobile width, the product retains functional navigation and an editor-first layout with a bottom tab bar. That is a sound responsive adaptation.

The first-use experience is the weak point. The default selected tab is Compose, while the primary stated job is usually “paste a diagram, apply a profile, and export.” The default content is a self-explanatory process diagram, which is useful as a demo but makes the user parse the product before doing their own work. Palette cards, target selection, look selection, syntax instruction, editor, preview, warnings, and exports are all visible in a short vertical distance. The page is capable, but it asks the user to understand too many concepts at once.

The navigation names are reasonable for informed users. They do not, by themselves, explain the lifecycle or distinguish between “make a reusable standard” and “fix this diagram now.” The page needs an outcome-oriented route choice, not more tabs.

### Current architecture assessment

The static architecture is appropriate for V1. Browser-only state, explicit local storage, and a pinned Mermaid dependency are good product decisions. The capability registry, renderer parity model, theme engine, and exported skill package show intentional domain modeling.

The internal cost is increasing. `src/lib/theme-engine.ts` is 2,405 lines, `src/App.tsx` is 1,840 lines, and `src/pages/tabs/ComposeTab.tsx` is 1,808 lines. These are not automatically defects, but they make product changes harder to isolate, characterize, and verify. The repository also has two meaningful skill surfaces: a ten-skill public `skills/` library shown in the app and a much broader `.agents/skills/` support tree. Their ownership and synchronization rules must remain explicit.

## 3. Vision-to-Execution Gap Analysis

### Fully implemented and aligned

- The static privacy boundary is architecturally respected for normal diagram handling. Pasted Mermaid stays in browser memory/local storage and exports are local browser actions. The explicit Live Editor action is an exception: it opens Mermaid Live with the themed code encoded in the URL fragment, so the user must understand that this hands their code to a third-party browser context.
- The central apply workflow exists end to end.
- Family and renderer awareness are visible in the working interface, rather than hidden in documentation.
- The prompt scaffold is implemented as an actionable, renderer-aware product artifact.
- Extract, examples, reference, and headless skills extend the product beyond a bare palette picker.
- The live site, deployment pipeline, PWA setup, strict type checking, E2E coverage, and separate published-skill tests demonstrate release discipline.

### Partially implemented or incomplete

| Gap | Why it matters | Required closure |
|---|---|---|
| Governance profile is not yet a first-class shared contract | The code has profile types and local slots, but the user-facing product does not clearly offer a named, versioned, portable profile with a visible share action and lifecycle. | Define one schema, make Save/Export/Import/Copy Share Link a primary profile flow, and show compatibility state with the artifact. |
| Distribution center is catalog-only | Reference lists ten installable skills, but a non-expert cannot choose the right skill, understand prerequisites, or complete an installation path without leaving the app/repository context. | Add a guided distribution area with use case, artifact, install/copy action, version, and relationship to the browser profile. |
| Renderer parity is presented as product truth but remains partly evidence-limited | The UI warnings work, but several renderer limits are documented as field-observed or unverified. | Add “verified on,” evidence state, Mermaid version, and an explicit unverified label. Do not imply universal live validation. |
| Sharing is technically present but not productized | URL and JSON mechanisms exist, but the critical “Copy share link” is not a first-class visible outcome. | Add a clear share action with size/privacy explanation, import success state, and a recovery path. |
| PWA is implemented but not acceptance-tested | Installation metadata and registration exist; offline reliability is not established. | Add a production PWA smoke check and narrow any claim until it passes. |
| Accessibility work is incomplete | The live DOM shows useful labels and landmarks, but an AA audit is explicitly outstanding. | Run automated and manual keyboard, focus, contrast, zoom, and screen-reader acceptance checks. |

### Present but misaligned

| Finding | Why it is misaligned |
|---|---|
| The workbench opens in Compose before it establishes the user’s job. | The product thesis prioritizes fast application and reuse, but the first screen emphasizes profile construction and tool controls. |
| The product talks about a distribution center, but the visible experience does not make distribution a destination. | Skills, artifacts, and profile reuse exist mostly as secondary information or repository material. |
| Documentation does not consistently describe the evolving product. | `docs/product-brief.md` and `docs/okhp3-visual-language-stack.md` still describe version 0.5.0 and 27 families, while the live app and roadmap describe 0.6.1 and 31 families. The README contains its own family-count reconciliation warning. |
| The privacy narrative is broader than the delivered page. | Diagram content is local, but `index.html` loads Google Fonts at runtime. Claims must say “no diagram content or analytics are transmitted,” or fonts must be self-hosted to support a no-third-party-request claim. |
| The HTML metadata describes v0.5.0. | Search, link-preview, and browser-facing descriptions lag the live 0.6.1 product. |

### Missing functionality and structure

- A short first-run route selector: “Apply an existing diagram,” “Create a reusable profile,” “Extract a profile,” and “Explore examples.”
- One clear home or guided-workbench state that explains the result of each route and makes Apply the default for the common case.
- First-class profile packaging with schema version, profile name, change date, renderer target, validation status, import compatibility report, and copyable share link.
- A guided human and agent distribution surface for the ten public skills and their relationship to profiles.
- Export preview and explicit artifact choice help. Eight download types are valuable, but users need to see what they will get before copying or downloading.
- A documentation truth source and release check that keep page metadata, README, product brief, roadmap, capability counts, and app catalog synchronized.
- Product-level evidence collection that does not violate privacy. Until a separate approved measurement policy exists, use voluntary feedback, issue templates, and manual release checks rather than speculative analytics.

### Technical and quality concerns

1. **Test-environment reliability is a P0 engineering issue.** The repository declares a Node 24 support target, yet `pnpm test` did not run cleanly in the current environment because many tests expect browser storage while Vitest defaults to `node`. Make the test environment deterministic rather than relying on runner behavior.
2. **Local build reproducibility is impaired on macOS.** The present installation lacks `lightningcss.darwin-arm64.node`. The cloud deployment is green, but a maintainer should be able to reproduce a clean build on the documented target platform.
3. **Large central files increase change risk.** Refactor only after acceptance tests are stabilized. First extract pure state transitions and export/profile adapters, then split components behind preserved behavior.
4. **Documentation is a trust surface.** Unreconciled counts, old versions, and self-contradictory notes weaken the credibility of a tool that asks users to trust its renderer guidance.
5. **External fonts create a privacy and resilience dependency.** This is not a diagram-data leak. It is a transparent decision to make, test, and describe correctly.

### Risks if the current direction continues

- More diagram types, export formats, and controls will magnify first-use overload faster than product value.
- The codebase can become difficult to change safely before the governing profile artifact has a stable contract.
- A public visitor may experience a capable but hard-to-explain workbench and leave before reaching the differentiated Prompt Scaffold.
- The renderer matrix can become a liability if evidence freshness, uncertainty, and version scope are not visible.
- Documentation drift will eventually produce false release and privacy claims.

## 4. Critical Verdict

**Verdict: on track for a focused expert utility, not yet on track for the broader “application plus distribution hub” vision.**

The product has not drifted into a meaningless collection of features. Its parts have a valid internal logic: Compose creates a profile, Apply uses it, Extract recovers it, Examples teach it, Reference explains it, and skills distribute it. The problem is presentation and contract completion. That logic is visible mainly to the builder and a technically fluent user, not to a first-time visitor.

The strongest work to preserve is the browser-only architecture, the Apply pipeline, capability honesty, renderer warnings, rich exports, theme/profile foundation, and agent-skill distribution. Do not replace these with a generic Mermaid editor or add an AI generation feature. Those choices would weaken the product's differentiation.

The work to rework is the entry experience and the profile lifecycle. The product must make its artifact explicit: “this is the reusable visual governance contract you can apply, validate, export, share, and give to an agent.” Once that is visible, Examples, Reference, and Skills become useful parts of a distribution system instead of adjacent panels.

Simplify by reducing simultaneous decisions on the first screen. Do not remove advanced controls. Progressively disclose them after the user chooses an outcome and a renderer target.

The current implementation is scalable enough for the next focused release, but not for unconstrained feature growth. Stabilize tests and profile boundaries before expanding capability coverage or undertaking a broad editor rewrite.

## 5. Recommended Product Direction

Position the next phase as:

> **A local-first visual governance profile system for Mermaid. Create or extract a profile once, apply it safely to diagrams, and distribute it to people and AI workflows.**

This is a sharper and more actionable version of the existing thesis. It gives the product three coherent surfaces:

1. **Workbench:** Apply, Compose, Extract, and preview a governed diagram.
2. **Profile library:** Save, version, share, import, validate, and recover portable governance profiles.
3. **Distribution center:** Give human collaborators and agents the exact artifact, implementation guidance, and skill needed to reuse that profile.

The next release should improve cohesion, trust, and adoption. It should not add a backend, accounts, cloud storage, file uploads, AI calls, payments, or broad collaboration features.

## 6. Long-Form PRD

### Release identity

**Working name:** v0.7.0 Governance Profiles and Adoption  
**Release goal:** Turn the current theme state into a clear, portable, validated product artifact and make the first-use journey explain how to use it.

### Product goals

1. A new visitor can choose a relevant path and reach a successful first outcome in under two minutes.
2. A profile can be named, saved, exported, imported, shared, and applied without the user understanding internal storage or URL encoding.
3. A user can tell whether an output is safe for their target renderer and what evidence supports that guidance.
4. The browser application and public skills form one understandable distribution story.
5. Product claims, metadata, source documentation, and visible counts remain synchronized at release.
6. The release can be built and tested deterministically on the documented developer and CI environments.

### Non-goals

- Mermaid code collaboration, cloud libraries, organizational administration, or accounts.
- AI-generated diagrams, AI APIs, model orchestration, payments, or analytics that transmit diagram content.
- A replacement for Mermaid Live, Mermaid Chart, or a full IDE editor.
- A broad mobile native application effort.
- New diagram-family coverage unless required to correctly package and validate existing support.

### Core user journeys

#### Journey A: Apply a profile to an existing diagram

1. Visitor selects **Apply a diagram** from the first-use route selector.
2. Visitor pastes Mermaid or chooses a starter example.
3. The app detects the family, requests or suggests a target renderer, and explains any constraint in plain language.
4. Visitor chooses a profile or starts from a preset.
5. Visitor sees the themed preview and a concise validation summary.
6. Visitor previews and exports Styled Mermaid, Markdown, or Prompt Scaffold.
7. The application records only local preferences unless the visitor explicitly downloads or copies an artifact.

#### Journey B: Create a reusable governance profile

1. Visitor selects **Create a profile**.
2. Visitor starts from a preset or blank profile, names it, and selects a target renderer.
3. Visitor edits palette, typography, look, and supported structural classes.
4. The app previews a representative family and shows constraints.
5. Visitor saves the profile locally and can export a versioned portable profile or copy a share link.

#### Journey C: Extract and standardize an existing theme

1. Visitor selects **Extract a profile**.
2. Visitor pastes an existing themed diagram.
3. The app reports what it extracted, what it could not infer, and any syntax/compatibility issue.
4. Visitor names the new profile, reviews it, and applies it to another diagram or exports it.

#### Journey D: Distribute to a collaborator or agent

1. Visitor opens **Distribute** from Profile details or Reference.
2. Visitor selects a human artifact or agent artifact.
3. For a human, the app presents Copy Share Link, profile JSON, Markdown Bootstrap, and use instructions.
4. For an agent, the app recommends the matching public skill, gives installation/copy instructions, and provides a profile artifact or scaffold.
5. The app makes clear that agent installation happens in the user’s environment and does not transmit the diagram.

### Functional requirements

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| GP-01 | Add a first-use route selector. | P0 | On a clean local state, the visitor sees Apply, Create, Extract, and Explore paths. Each choice opens the intended surface with concise expected outcome text. |
| GP-02 | Make Apply the default common-case path. | P0 | A fresh visitor can paste and export without entering Compose first. Existing saved-user preference may restore the last tab only after first use. |
| GP-03 | Establish a versioned governance-profile schema. | P0 | Export includes schema version, profile ID/name, profile version, creation/update time, palette, typography, look, renderer target, class definitions, and explicit optional fields. Unsupported fields are rejected or reported on import. |
| GP-04 | Provide a Profile Details surface. | P0 | The selected profile has name, source, local/save state, target, evidence status, export, import, duplicate, rename, delete, and distribute actions. |
| GP-05 | Add Copy Share Link as a visible action. | P0 | The control explains that its payload is encoded in the URL, contains no hosted profile record, warns on oversized payload, and reports copied or failure state accessibly. |
| GP-06 | Add an export preview. | P1 | Before copy/download, the visitor can inspect the exact Styled Mermaid, Markdown, Prompt Scaffold, and profile JSON with renderer caveats. |
| GP-07 | Add distribution guidance for public skills. | P1 | Each listed skill has intended task, version, source path/link, required input, output artifact, and copyable install/use instruction. The app identifies the recommended skill for a selected profile action. |
| GP-08 | Display renderer evidence state. | P1 | Each renderer capability has Mermaid version, last-verified date, evidence status, and plain-language caveat. “Unverified” never looks equivalent to “full.” |
| GP-09 | Preserve existing Apply, Compose, Extract, Examples, Reference, and exports. | P0 | Existing E2E core paths remain available, tab links continue to resolve, and no diagram content is transmitted. |
| GP-10 | Add a documentation-truth validation command. | P0 | A CI-safe command fails when package version, app version, HTML metadata, capability count, renderer count, and public skill catalog count disagree with declared sources of truth. |

### UX and UI requirements

- Keep the Forge visual system and desktop/mobile responsiveness.
- Use progressive disclosure. Show task choice and basic input before advanced profile controls.
- Explain the result of every prominent action in verbs: Apply, Create, Extract, Validate, Export, Distribute.
- Do not use the word “workspace” as the primary user concept when “profile” is more precise.
- Retain direct access to advanced controls for experienced users without forcing a wizard.
- Add a visible distinction between supported, limited, and unverified renderer claims.
- Ensure keyboard access, focus order, focus return from dialogs, color contrast, zoom behavior, and live-region feedback meet the accessibility gate.
- Keep mobile navigation but test the first-use route selector, editor, preview, and export dialog at 390 px and 320 px widths.

### Content requirements

- Update product brief, positioning, README, visual-language stack reference, HTML metadata, and release evidence from the same release facts.
- State the privacy boundary accurately: no diagram content, account data, analytics payload, or profile data is sent to a product backend during normal use. Explain the explicit Mermaid Live handoff, which places themed code in a third-party URL fragment. If Google Fonts remain, disclose the third-party font request or self-host the fonts.
- Define “Governance Profile” once and use that exact term across app, docs, exports, and skills.
- Maintain a concise first-use explanation and an advanced conceptual reference. Do not put all implementation detail in the first-use screen.

### Technical architecture requirements

- Preserve the static browser-only architecture and the exact Mermaid pin.
- Treat the profile schema as a pure domain module with migration and validation functions independent of React components.
- Keep local storage as the default persistence mechanism. Validate, migrate, and recover malformed local data without crashing the app.
- Keep URL profiles intentionally explicit and size-bounded. Do not add server-side short links.
- Separate application shell/navigation, profile state, Apply orchestration, export adapters, and UI panels behind typed contracts.
- Before splitting large components, capture existing behavior in tests. Refactor `App.tsx`, `ComposeTab.tsx`, and `theme-engine.ts` incrementally, not in one large rewrite.
- Use locally hosted fonts or change privacy copy and add a resilient system-font fallback test.
- Fix Vitest's browser-storage setup for every browser-oriented test. Pin and document the local Node 24 installation/build path, including native optional dependencies.

### Data and state requirements

- One versioned `GovernanceProfile` type is the portable source of truth.
- Runtime selection state may remain separate from saved profile data.
- Local profile lifecycle: create, rename, duplicate, reorder, delete with confirmation, export, import, share, and recover.
- Import must show a compatibility report before overwriting or adding a profile.
- Do not store diagram source inside a shareable profile by default. Diagram source is a separate user-controlled artifact.

### Distribution and maintenance workflow

- Public `skills/` is the distributable skill source. `.agents/skills/` is support tooling unless explicitly mirrored and recorded.
- Generate the in-app skill catalog and README catalog from a shared manifest or validated source, not separate hand-maintained lists.
- Each release produces a truth record with version, supported-family count, renderer count, public-skill count, validation outcomes, privacy statement, and unresolved evidence.
- A maintainer must be able to run the documented checks from a clean supported installation before publishing.

### Non-functional requirements

- No diagram content is sent to a product backend. The Mermaid Live handoff remains explicit, opt-in, and clearly disclosed because it encodes themed code in a third-party URL fragment.
- No new backend, login, database, or AI API dependency.
- Existing output formats remain backward-compatible unless a documented schema migration is supplied.
- First interaction remains usable without network access after core assets are cached, subject to PWA verification.
- All validation results distinguish passed, failed, not-run, and unverified.

### Success criteria

| Measure | Release target |
|---|---|
| First-use completion | A scripted new-user test reaches a valid export via Apply in 2 minutes or less. |
| Profile portability | Exported profile imports into a clean browser state with identical key settings and an explicit compatibility result. |
| Distribution clarity | A scripted user can identify and use the appropriate human or agent artifact without reading repository source. |
| Trust correctness | No version, family-count, renderer-count, or privacy-copy inconsistency across governed release surfaces. |
| Quality gate | Type check, full unit suite, build, E2E, public skill tests, documentation-truth check, and accessibility gate pass in the supported environment. |
| Accessibility | No critical or serious automated violations plus manual keyboard/focus/zoom acceptance record. |

### Scope by phase

| Phase | Scope |
|---|---|
| Existing baseline | v0.6.1 workbench, core pipeline, renderer controls, exports, Examples, Reference, Extract, and ten public skills. Preserve it. |
| Next MVP, v0.7 | First-use route selector, Profile Details, schema/import/export/share, documentation truth checks, test/build reproducibility, privacy-copy or font resolution. |
| V1 public-release gate | Complete accessibility and PWA validation, renderer evidence freshness policy, release-quality documentation, and a verified end-to-end new-user path. |
| Future only after evidence | More profile templates, family-specific advanced controls, CLI/MCP integration, team governance. Any backend or enterprise plane remains a separate strategic decision, not a continuation of this release. |

## 7. Replit Build Directive

Use this directive as the next development brief.

### Objective

Turn Mermaid Theme Builder from a capable expert workbench into a clear local-first governance-profile product. The release must improve first use, reusable profile lifecycle, distribution clarity, and release trust without changing the product's static privacy boundary.

### Preserve

- Browser-only React/Vite architecture and local-only diagram handling.
- Apply pipeline, family detection, renderer selector, preflight warnings, prompt scaffold, export formats, Extract, Examples, Reference, skill package, and Forge visual language.
- Exact Mermaid version pin and capability-registry honesty.
- Existing tab hash navigation and saved state migration behavior.

### Build in this order

1. **Create the truth baseline before feature changes.**
   - Record current versions, counts, claims, and failing local checks.
   - Choose canonical machine-readable sources for version, counts, profile schema, and skill catalog.
   - Add a check that detects stale HTML metadata and documentation count/version claims.

2. **Fix the release environment.**
   - Make all browser-oriented Vitest tests receive a consistent browser-like storage implementation.
   - Reproduce a clean local Node 24 install and build on macOS. Correct optional-native dependency resolution or document a tested supported command.
   - Do not change product behavior while fixing this infrastructure.

3. **Implement the governance-profile contract.**
   - Formalize the existing profile model as one versioned portable schema.
   - Add pure validation, migration, import report, and deterministic export functions before UI changes.
   - Add characterization tests for legacy palette slots and existing `.theme.json` artifacts.

4. **Build Profile Details and distribution actions.**
   - Make profile name, renderer target, status, local save, export, import, copy share link, duplicate, reorder, and delete visible in one coherent location.
   - Do not put diagram content into a profile share link by default.
   - Present size and privacy limitations before copy/download actions when relevant.

5. **Rework entry and navigation.**
   - Add a lightweight first-use route selector on clean state.
   - Make Apply the default task for users who arrive with Mermaid source.
   - Keep Compose as the profile-authoring route, not the assumed first action.
   - Do not add a multi-step wizard that blocks experienced users.

6. **Make Reference a real distribution center.**
   - Reframe the skills section around “use this profile with an agent.”
   - Add task-to-skill routing, version, artifact contract, source, and usable instructions.
   - Add export preview so users can see the human or agent artifact before copying.

7. **Close trust and accessibility gates.**
   - Resolve the Google Fonts privacy/resilience decision by self-hosting or precisely narrowing public wording. Clearly disclose the opt-in Mermaid Live handoff.
   - Test PWA registration and offline fallback in a production build.
   - Perform the explicit WCAG accessibility audit and remediate verified findings.
   - Version, document, and deploy only after all required checks are fresh.

### Do not do in this release

- Do not add backend services, accounts, cloud storage, payment, analytics collection, AI APIs, or generic collaboration.
- Do not add more diagram families merely to increase catalog size.
- Do not replace the Apply UI or refactor all large files at once.
- Do not claim renderer parity, offline support, accessibility conformance, or privacy beyond the evidence recorded for the release.

### Required acceptance evidence

- Fresh recordings of unit, build, E2E, public skill, truth-check, accessibility, and PWA checks.
- Desktop and mobile screenshots of each new first-use route and profile distribution path.
- A compatibility test that exports a profile, clears state, imports it, and verifies expected settings.
- A test that confirms shared profile links omit diagram code by default.
- A release documentation comparison proving version and counts match all public surfaces.

## 8. Prioritized Implementation Roadmap

1. **P0: Restore deterministic quality gates.** Fix Vitest storage setup and local macOS build reproducibility. A product that cannot be predictably validated should not add behavior.
2. **P0: Establish and test the portable Governance Profile contract.** This is the product artifact that makes the broader vision coherent.
3. **P0: Productize profile sharing and import.** Add visible Copy Share Link, Profile Details, compatibility reporting, and safe local lifecycle actions.
4. **P1: Redesign first use around outcomes.** Add route selection, default Apply for the common job, and reduce simultaneous decisions.
5. **P1: Convert Reference into a guided distribution surface.** Connect selected profile actions to human exports and the correct agent skill.
6. **P1: Add export preview and renderer evidence states.** Make artifact choice and parity confidence inspectable before export.
7. **P1: Resolve documentation, metadata, and privacy truth drift.** Self-host fonts or narrow claims. Synchronize 0.6.1 facts before publishing the next release.
8. **P1: Run and close accessibility and PWA verification.** These are public-release gates, not cosmetic cleanup.
9. **P2: Refactor by seams after behavior is protected.** Extract profile state and export adapters from the large app and Compose files. Do not make this a redesign.
10. **P3: Consider external workflow integration only after adoption evidence.** CLI/MCP or team governance belongs after the profile artifact and distribution path are proven.

## Final release recommendation

Do not declare V1 from the current build. It is a high-quality v0.6.1 expert tool with a strong wedge and meaningful operational maturity. It becomes a defensible public product when a new user can understand, create, apply, and distribute a governance profile with the same confidence the current code already gives an expert user.
