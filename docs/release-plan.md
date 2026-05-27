# Mermaid Theme Builder — Release Plan v0.5.x / v0.6.x / v0.7.x

**Project:** Mermaid Theme Builder
**Author:** OverKill Hill P³
**Created:** 2026-05-23
**Status:** Planning document — tasks are checked off as they are completed
**Repository:** https://github.com/OKHP3/mermaid-theme-builder

> **Status key:**
> `[ ]` = not started or needs verification
> `[x]` = verified complete as of 2026-05-23 audit

---

## SPRINT v0.5.x — SKILL.md Hardening and Patch Quality

**Goal:** Close all known gaps between what SKILL.md documents and what exists in the repo.
Make the skill installable, testable, and trustworthy on all four supported platforms
(Claude Code, GitHub Copilot, Cursor, VS Code). Close the version parity gap between
SKILL.md metadata and package.json.

**Constraint:** No new UI features. No changes to the live tool behavior. All 25 tasks
are scoped to `skills/`, documentation, and minor bug fixes.

---

[ ] TASK-05x-01 | `skills/okhp3-mermaid-theme-builder/SKILL.md` | Verify that the YAML frontmatter block uses flat top-level fields (`name`, `version`, `author`, `license`, `homepage`, `repository`, `category`, `tags`, `tools`) with no nested `metadata:` wrapper, and that the frontmatter passes a strict YAML parser without errors.

[ ] TASK-05x-02 | `skills/okhp3-mermaid-theme-builder/SKILL.md` | Verify that `version: "0.5.0"` in the SKILL.md frontmatter exactly matches the `"version"` field in the root `package.json`, and update it if there is any discrepancy.

[ ] TASK-05x-03 | `skills/okhp3-mermaid-theme-builder/SKILL.md` | Verify that Step 4 (or Step 5) documents the optional `look` parameter with its three values (`classic`, `neo`, `handDrawn`), placement rules (before `themeVariables`), and a worked example init block using the `look: "neo"` value.

[ ] TASK-05x-04 | `skills/okhp3-mermaid-theme-builder/SKILL.md` | Verify that the renderer compatibility table includes a "Look support" column showing which look values each of the 7 renderers accepts, with entries matching the `lookSupport` arrays in `assets/renderer-profiles.json`.

[ ] TASK-05x-05 | `skills/okhp3-mermaid-theme-builder/SKILL.md` | Verify that Output Rule 10 states: validate `look` against the target renderer's `lookSupport` array before including it in any output; if the look value is not in the array, default to Classic and omit the `look` key entirely.

[ ] TASK-05x-06 | `skills/okhp3-mermaid-theme-builder/references/palette-registry.md` | Verify that the file exists and contains a complete table of all 7 canonical palettes (IDs, display names, hex values for all 14+ themeVariable tokens), with the OKHP3 brand palettes clearly distinguished from the 4 utility palettes.

[ ] TASK-05x-07 | `skills/okhp3-mermaid-theme-builder/references/mermaid-theme-variables.md` | Verify that the file exists and documents every themeVariable key supported in Mermaid 11.15.x, with type (hex color, string, boolean), default value, and which diagram families each variable affects.

[ ] TASK-05x-08 | `skills/okhp3-mermaid-theme-builder/references/renderer-profiles.md` | Verify that the file exists, contains the 7-renderer compatibility matrix with all feature columns (%%{init}%%, themeVars, classDef, CSS inject, Custom fonts, Look support, Risk), and that each renderer's narrative section notes look support/limitations explicitly.

[ ] TASK-05x-09 | `skills/okhp3-mermaid-theme-builder/references/output-format-contract.md` | Verify that the file exists, documents Formats A through F, and that Format F (Renderer Compatibility Notes) has a complete template, field validation rules, and at least one worked example — add Format F if it is absent.

[ ] TASK-05x-10 | `skills/okhp3-mermaid-theme-builder/references/prompt-scaffold-patterns.md` | Verify that the file exists and contains all 8 scaffold template patterns (single diagram, renderer-targeted, classDef governance, multi-family, extract mode, repair mode, batch palette, team style guide) with complete, parameterized templates.

[ ] TASK-05x-11 | `skills/okhp3-mermaid-theme-builder/references/scope-firewall.md` | Verify that the file exists and enumerates every prohibited action for agents using this skill: must not alter source code, must not call external APIs, must not capture or log diagram content, must not overwrite existing `%%{init}%%` blocks without strip-first logic.

[ ] TASK-05x-12 | `skills/okhp3-mermaid-theme-builder/assets/palettes.json` | Verify that `palettes.json` exists, is valid JSON, contains all 7 canonical palette IDs, and that every hex value in the file matches the corresponding value in `src/lib/palettes.ts` exactly (no rounding, no approximation).

[ ] TASK-05x-13 | `skills/okhp3-mermaid-theme-builder/assets/renderer-profiles.json` | Verify that `renderer-profiles.json` exists, is valid JSON, contains all 7 renderer objects, and that every object has a `lookSupport` array with values from the set `["classic", "neo", "handDrawn"]`.

[ ] TASK-05x-14 | `skills/okhp3-mermaid-theme-builder/assets/theme-variable-map.json` | Verify that `theme-variable-map.json` exists, is valid JSON, and that every themeVariable key listed in `references/mermaid-theme-variables.md` has a corresponding entry in the map with its type and default value.

[ ] TASK-05x-15 | `skills/okhp3-mermaid-theme-builder/assets/fixtures/` | Verify that the fixtures directory contains at least 5 valid `.mmd` files covering: flowchart, sequenceDiagram, classDiagram, erDiagram, and gantt — each without a `%%{init}%%` block, and each parseable by `node scripts/detect-diagram.mjs`.

[ ] TASK-05x-16 | `skills/okhp3-mermaid-theme-builder/scripts/detect-diagram.mjs` | Verify that `detect-diagram.mjs` exists, accepts a Mermaid code string via stdin or a file argument, returns a JSON object with `family` and `confidence` fields, and that the families it outputs match the union defined in `src/lib/detector.ts`.

[ ] TASK-05x-17 | `skills/okhp3-mermaid-theme-builder/scripts/normalize-mermaid.mjs` | Verify that `normalize-mermaid.mjs` exists, strips any existing `%%{init}%%` block from input Mermaid code, trims leading/trailing whitespace, and returns the cleaned code without altering diagram logic.

[ ] TASK-05x-18 | `skills/okhp3-mermaid-theme-builder/scripts/apply-theme.mjs` | Verify that `apply-theme.mjs` exists, accepts a Mermaid code string and a palette ID, calls `normalize-mermaid.mjs` to strip any existing init block, and prepends a correct `%%{init}%%` directive using the palette's themeVariables.

[ ] TASK-05x-19 | `skills/okhp3-mermaid-theme-builder/scripts/validate-theme.mjs` | Verify that `validate-theme.mjs` exists, accepts themed Mermaid code as input, checks that the `%%{init}%%` block is on line 1, uses `theme: "base"`, contains a `themeVariables` object with at least 6 hex color fields, and exits non-zero with a descriptive error message if any check fails.

[ ] TASK-05x-20 | `skills/okhp3-mermaid-theme-builder/scripts/generate-prompt-scaffold.mjs` | Verify that `generate-prompt-scaffold.mjs` exists, accepts a palette ID and a diagram family, and outputs a complete Format C prompt scaffold document sourced from the patterns in `references/prompt-scaffold-patterns.md`.

[ ] TASK-05x-21 | `skills/okhp3-mermaid-theme-builder/tests/detect-diagram.test.mjs` | Verify that `detect-diagram.test.mjs` exists, runs via `node --test`, covers at least 8 diagram families plus the `unknown` fallback case, and passes without failures against the current script.

[ ] TASK-05x-22 | `skills/okhp3-mermaid-theme-builder/tests/apply-theme.test.mjs` | Verify that `apply-theme.test.mjs` exists, runs via `node --test`, asserts that all 7 canonical palettes produce valid themed output for the flowchart fixture, and that the output passes `validate-theme.mjs`.

[ ] TASK-05x-23 | `skills/okhp3-mermaid-theme-builder/tests/validate-theme.test.mjs` | Verify that `validate-theme.test.mjs` exists, runs via `node --test`, covers at least 4 error cases (no init block, init not on line 1, missing themeVariables, wrong theme value) and 2 success cases.

[ ] TASK-05x-24 | `skills/okhp3-mermaid-theme-builder/tests/` | Run the full skill test suite with `node --test tests/*.test.mjs` from the skill root and confirm that all tests pass; document the passing test count and any skipped tests in a `TEST-RESULTS.md` note at the root of the skill package.

[ ] TASK-05x-25 | `skills/okhp3-mermaid-theme-builder/README.md` | Verify that `README.md` exists and contains verified install instructions for all four target platforms: Claude Code (`~/.claude/skills/`), GitHub Copilot (`.github/copilot-instructions.md` append), Cursor (`.cursor/rules/` copy), and VS Code (`.vscode/instructions/` copy), with a one-command verification step for each.

---

## SPRINT v0.6.x — Native Capability + Ko-fi Artifact Line + PWA Hardening

**Goal:** Make the Mermaid Theme Builder distributable as a native iOS/Android app via
Capacitor, publish the first Ko-fi downloadable artifact set, and harden the PWA manifest
for offline capability. This sprint turns the tool from a browser tab into a portable
professional instrument.

**Constraint:** The core React application source must not change its behavior. Capacitor
wraps the existing static build. Ko-fi artifacts are produced as exportable files the tool
can generate, not SaaS features. No backend is introduced.

---

[ ] TASK-06x-01 | `package.json`, `capacitor.config.ts` | Install `@capacitor/core` and `@capacitor/cli` as devDependencies, initialize Capacitor with `npx cap init` using app ID `com.overkillhill.mermaidthemebuilder` and app name `Mermaid Theme Builder`, and create `capacitor.config.ts` with `webDir` pointing to `dist/public/`.

[ ] TASK-06x-02 | `capacitor.config.ts` | Configure Capacitor's `server.androidScheme` to `https`, set `plugins.SplashScreen.launchAutoHide` to `false`, set `plugins.StatusBar.style` to `dark`, and confirm the config parses correctly with `npx cap sync --dry-run`.

[ ] TASK-06x-03 | `ios/` | Add the iOS platform with `npx cap add ios`, generate a complete icon set (1024×1024 source → all required iOS sizes via `@capacitor/assets`), and provide a splash screen image at 2732×2732px using the OKH Forge dark teal `#1c3a34` background and the Forked Flow app icon centered.

[ ] TASK-06x-04 | `android/` | Add the Android platform with `npx cap add android`, generate a complete adaptive icon set (foreground layer at 432×432px, background layer `#1c3a34`), and provide splash screen drawables for all density buckets (mdpi through xxxhdpi) using the same brand assets as iOS.

[ ] TASK-06x-05 | `ios/App/`, `android/app/src/main/` | Install `@capacitor/filesystem`, wire it to the existing "Import palette JSON" button so that on native the button opens the device Files app (iOS) / Storage Access Framework (Android) and reads the selected `.json` or `.mmd` file directly into the app without a web `<input type="file">`.

[ ] TASK-06x-06 | `src/lib/exporters.ts`, `ios/`, `android/` | Install `@capacitor/share`, detect at runtime whether the app is running on a native platform using `Capacitor.isNativePlatform()`, and replace the current clipboard-copy path in all three export buttons with the native Share Sheet when on iOS/Android.

[ ] TASK-06x-07 | `src/App.tsx` | Install `@capacitor/clipboard`, add an `appState` listener that fires on native app foreground, reads the current clipboard content with `Clipboard.read()`, detects whether it begins with a Mermaid keyword (e.g. `flowchart`, `sequenceDiagram`, `%%{init`), and displays a non-blocking banner prompting the user to load the clipboard content into the Apply tab.

[ ] TASK-06x-08 | `public/manifest.json` | Complete the PWA web app manifest with: all required icon sizes (48, 72, 96, 128, 144, 152, 192, 384, 512px with and without maskable purpose), `display: "standalone"`, `orientation: "any"`, `theme_color: "#1c3a34"`, `background_color: "#1c3a34"`, and two shortcuts (Apply and Compose tabs).

[ ] TASK-06x-09 | `public/sw.js` | Rewrite the service worker to implement a cache-first strategy for all static assets (JS, CSS, fonts, WASM) and a network-first strategy for the root HTML, so the full app loads offline after first visit; increment `CACHE_VERSION` on every build using a Vite plugin or build script.

[ ] TASK-06x-10 | `docs/artifacts/kofi-pptx-template/` | Create a 10-slide PPTX template using `pptxgenjs` (scripted generation, no manual authoring): slides cover Apply, Compose, Extract, Examples, Reference tabs, plus a title slide, agenda, diagram governance principles slide, color palette showcase, and a blank diagram starter slide — all using OKH P³ brand colors and Alfa Slab One / DM Sans fonts.

[ ] TASK-06x-11 | `docs/artifacts/kofi-scaffold-pack/` | Package all 8 scaffold templates from `skills/okhp3-mermaid-theme-builder/references/prompt-scaffold-patterns.md` into a single downloadable PDF using a Markdown-to-PDF pipeline (`md-to-pdf` or `puppeteer`), with a cover page showing the OKH P³ brand, a table of contents, and one template per page.

[ ] TASK-06x-12 | `docs/artifacts/kofi-diagram-standard/` | Produce the OverKill Hill Mermaid Diagram Standard as a PDF document: compile the content from `docs/mermaid-capability-registry.md`, `docs/renderer-compatibility.md`, and `docs/mermaid-theming-reference.md` into a single 20–30 page branded PDF with numbered sections, a cover page, and a footer with the OKH P³ attribution.

[ ] TASK-06x-13 | `docs/artifacts/kofi-palette-bundle/` | Create the OKH P³ palette bundle artifact: a `.zip` containing `okhp3-palettes.json` (the three brand palettes as the tool exports them), `okhp3-palettes.css` (CSS custom properties for all three palettes), and a `README.md` explaining how to use each file.

[ ] TASK-06x-14 | `src/lib/exporters.ts`, `src/pages/tabs/ComposeTab.tsx` | Add a "Download palette bundle" button to the Compose tab that packages the currently active palette as both JSON and CSS custom properties and downloads them as a `.zip` file named `{palette-name}-bundle.zip`, without requiring any server-side processing.

[ ] TASK-06x-15 | `docs/store-metadata/ios-app-store.md` | Create the iOS App Store metadata document specifying: app name (30 chars max), subtitle (30 chars max), four keyword strings (100 chars max each), short description (170 chars max), full description (4000 chars max), and a list of 10 required screenshot specifications (device, orientation, what each screenshot must show).

[ ] TASK-06x-16 | `docs/store-metadata/google-play.md` | Create the Google Play metadata document specifying: app title (50 chars max), short description (80 chars max), full description (4000 chars max), and a list of 8 required screenshot specifications plus the feature graphic spec (1024×500px).

[ ] TASK-06x-17 | `.github/workflows/capacitor-build.yml` | Create a GitHub Actions workflow that triggers on pushes to `main`, runs `pnpm build` to produce the static output, runs `npx cap sync`, then uses `arcade-software/fastlane-action` (or equivalent) to produce unsigned `.ipa` and `.apk` artifacts uploaded to the workflow run's artifact store.

[ ] TASK-06x-18 | `src/components/DiagramInventory.tsx`, `src/data/renderer-parity.ts` | Add `overflow-x: auto` and a minimum column width of 80px to the renderer parity matrix table in the Reference tab so that the table scrolls horizontally on viewports below 480px width without text truncation.

[ ] TASK-06x-19 | `src/pages/tabs/ComposeTab.tsx` | Rearrange the Compose tab typography controls (font family, font size, line height) into a single-column stacked layout on viewports below 480px width, replacing the current two- or three-column grid that overflows on small screens.

[ ] TASK-06x-20 | `src/components/ColorSwatch.tsx` | Ensure every HSL range slider and color swatch button in `ColorSwatch.tsx` has a minimum touch target height of 44px and a minimum touch target width of 44px, verified by adding a Vitest assertion that no swatch element has inline `height` or `minHeight` below 44.

[ ] TASK-06x-21 | `capacitor.config.ts`, `ios/App/App/AppDelegate.swift` | Configure Capacitor's deep link plugin to handle the URL scheme `okhp3://apply?code=<url-encoded-mermaid>` so that tapping a deep link on iOS or Android opens the app and loads the decoded Mermaid code directly into the Apply tab's input textarea.

[ ] TASK-06x-22 | `src/App.tsx` | Add an in-app update notification that fetches the latest release tag from the GitHub Releases API (`https://api.github.com/repos/OKHP3/mermaid-theme-builder/releases/latest`) on app launch (once per 24 hours, cached in localStorage), compares it to `package.json` version, and surfaces a dismissible banner if a newer version is available.

[x] TASK-06x-23 | `CHANGELOG.md`, `scripts/check-changelog.sh`, `.github/workflows/release-gate.yml` | ~~Create `CHANGELOG.md`~~ **Done — CHANGELOG.md already exists** with Keep a Changelog entries for v0.1.0 through v0.5.0 and an `[Unreleased]` section for v0.6.0 items. Task reduced to the maintenance workflow: (1) `docs/release-checklist.md` now includes an explicit step to move `[Unreleased]` items to the versioned section and add the comparison link before each tag; (2) `scripts/check-changelog.sh` errors if the pushed tag has no matching `## [x.y.z]` section in CHANGELOG.md; (3) `.github/workflows/release-gate.yml` runs the script automatically on every `v*` tag push.

[ ] TASK-06x-24 | `docs/MOBILE.md` | Create `docs/MOBILE.md` documenting the Capacitor build process: required Xcode version (minimum 15), required Android Studio version (minimum Hedgehog), required Ruby/Bundler for Fastlane, code signing prerequisites for both platforms, and the exact `pnpm build && npx cap sync && npx cap open ios` command sequence.

[ ] TASK-06x-25 | `docs/store-metadata/app-store-review-checklist.md` | Create an App Store review readiness checklist documenting how the app satisfies Apple's Guideline 4.2 (Minimum Functionality): list the 5+ distinct native capabilities (Filesystem import, Share Sheet, Clipboard detection, deep links, offline PWA caching) that go beyond a simple web wrapper.

---

## SPRINT v0.7.x — Session Persistence + Multi-Diagram Canvas + Mermaid Chart Integration

**Goal:** Make the tool stateful across sessions and powerful as a governance instrument
for multi-diagram documents. Integrate with the Mermaid Chart enterprise platform using
its API tier. Introduce saved theme sessions, multi-diagram batch theming, and theme drift
detection.

**Constraint:** Persistence must use localStorage for web and Capacitor Preferences plugin
for native. No third-party sync backend. Mermaid Chart API integration is read/write against
the user's own workspace only — no platform-wide data access.

---

[ ] TASK-07x-01 | `src/lib/sessions.ts` | Create `src/lib/sessions.ts` with functions `saveSession(name, state)`, `loadSession(name)`, `deleteSession(name)`, and `listSessions()` backed by localStorage under the key `okh:sessions`, where each session stores the active palette, diagram code, diagram family override, look setting, and a `savedAt` ISO timestamp.

[ ] TASK-07x-02 | `src/components/SessionPanel.tsx` | Create `src/components/SessionPanel.tsx` as a slide-in panel showing a scrollable list of saved sessions with per-row actions: Load (restores all session state into the Apply tab), Rename (inline edit), Delete (with confirmation), and Export as JSON (downloads the single session as a `.json` file).

[ ] TASK-07x-03 | `src/components/SessionPanel.tsx`, `src/lib/sessions.ts` | Add a "Import sessions" button to `SessionPanel.tsx` that accepts a `.json` file (either a single session or an array of sessions), validates the schema with Zod, and merges the imported sessions into the local session store without overwriting existing sessions of the same name.

[ ] TASK-07x-04 | `src/pages/tabs/ApplyTab.tsx` | Add a multi-diagram input mode toggle to the Apply tab that, when active, accepts multiple Mermaid code blocks separated by `---` on its own line or by a blank line followed by a new Mermaid keyword, and displays a diagram count badge showing how many blocks were detected.

[ ] TASK-07x-05 | `src/lib/themeEngine.ts`, `src/lib/diagramSplit.ts` | Implement a batch theming function `batchApplyTheme(diagrams: string[], palette: Palette): string[]` that applies a single palette's `%%{init}%%` directive to each diagram in the array using the existing `applyTheme` logic, preserving each diagram's detected family for family-specific overlays.

[ ] TASK-07x-06 | `src/lib/exporters.ts`, `src/pages/tabs/ApplyTab.tsx` | Add a "Download all themed" button to the Apply tab's multi-diagram mode that packages each themed diagram as an individual `.mmd` file and downloads them as a `.zip` archive named `{palette-name}-themed-diagrams.zip`, plus a second "Download as Markdown" option that concatenates all themed diagrams into one `.md` file with fenced code blocks.

[ ] TASK-07x-07 | `src/lib/driftDetector.ts` | Create `src/lib/driftDetector.ts` with a `detectDrift(diagrams: string[], referencePalette: Palette): DriftReport` function that checks each diagram's existing `%%{init}%%` themeVariables against the reference palette's values, returns a list of non-conforming diagrams with the specific keys that differ, and flags diagrams missing an init block entirely.

[ ] TASK-07x-08 | `src/lib/exporters.ts`, `src/pages/tabs/ApplyTab.tsx` | Add a "Export drift report" button (visible only when drift has been detected) that downloads a Markdown document listing each non-conforming diagram by index, the differing themeVariable keys and their actual vs. expected values, and the corrective `%%{init}%%` block the user should apply.

[ ] TASK-07x-09 | `src/lib/mermaidChart.ts` | Create `src/lib/mermaidChart.ts` implementing the OAuth 2.0 PKCE authorization flow against the Mermaid Chart API (`https://www.mermaidchart.com/api`), storing the access token in localStorage under `okh:mc:token`, and exposing `connect()`, `disconnect()`, and `isConnected()` functions.

[ ] TASK-07x-10 | `src/pages/tabs/ApplyTab.tsx`, `src/lib/mermaidChart.ts` | Add a "Load from Mermaid Chart" button (visible when `mermaidChart.isConnected()` is true) that fetches the list of diagrams from the authenticated user's workspace, displays them in a searchable picker, and loads the selected diagram's code into the Apply tab input.

[ ] TASK-07x-11 | `src/pages/tabs/ApplyTab.tsx`, `src/lib/mermaidChart.ts` | Add a "Save to Mermaid Chart" button that, when clicked after theming, calls the Mermaid Chart API to update the originating diagram's content with the themed code, shows a success/failure toast, and records the save timestamp in the session state.

[ ] TASK-07x-12 | `src/lib/mermaidChart.ts` | Implement `syncPalette(palette: Palette)` in `mermaidChart.ts` that writes the palette's themeVariable values to a Mermaid Chart workspace custom theme (using the appropriate API endpoint), so all collaborators in the workspace share the same base theme without manual copying.

[ ] TASK-07x-13 | `src/lib/themeHistory.ts` | Create `src/lib/themeHistory.ts` that maintains a ring buffer of the last 10 theme states in localStorage under `okh:history`, where each entry stores the full palette, diagram code, and a timestamp — exposing `push(state)`, `list()`, `restore(index)`, and `clear()` functions.

[ ] TASK-07x-14 | `src/components/ThemeHistoryPanel.tsx` | Create `src/components/ThemeHistoryPanel.tsx` that displays a scrollable list of the last 10 theme history entries (thumbnail digest, palette name, timestamp), with a "Restore" button per entry and a "Compare" toggle that switches to a side-by-side `DiffView` showing what changed between the selected entry and the current state.

[ ] TASK-07x-15 | `src/pages/tabs/ComposeTab.tsx`, `src/lib/palettes.ts` | Add an HSL-based palette constructor section to the Compose tab that accepts 3 seed hex colors (primary, background, accent) and derives a complete 14-variable theme by computing complementary, analogous, and lightness-shifted values — outputting a new palette object ready for immediate use or saving.

[ ] TASK-07x-16 | `src/pages/tabs/ComposeTab.tsx`, `src/lib/palettes.ts` | Add a real-time WCAG contrast ratio display next to each text/background color pair in the Compose tab (at minimum: `primaryTextColor` vs `primaryColor`, `secondaryTextColor` vs `secondaryColor`, `tertiaryTextColor` vs `tertiaryColor`), showing the ratio and a pass/fail badge for WCAG AA (4.5:1 text, 3:1 large) and WCAG AAA (7:1 text).

[ ] TASK-07x-17 | `src/lib/exporters.ts`, `src/pages/tabs/ApplyTab.tsx` | Add a "Contrast enforcement" toggle to the Apply tab's export bar that, when enabled, blocks the copy/download export actions and shows an error banner if any monitored text/background pair in the current palette fails WCAG AA — providing a "View failing pairs" link that jumps to the Compose tab.

[ ] TASK-07x-18 | `src/pages/tabs/ComposeTab.tsx`, `src/lib/familyTheming.ts` | Add a classDef library builder section to the Compose tab allowing the user to define named semantic roles (e.g. `decision`, `start`, `end`, `external`), assign fill/stroke/text-color/font-weight to each, preview the role applied to a sample Mermaid node via `MermaidPreview`, and save the library to localStorage.

[ ] TASK-07x-19 | `src/lib/themeEngine.ts`, `src/components/PromptScaffoldModal.tsx` | Wire the classDef library from TASK-07x-18 into the Format C (Prompt Scaffold) export so that when a classDef library is defined, the scaffold includes a `## ClassDef Library` section listing all roles as ready-to-paste Mermaid `classDef` directives with a usage example.

[ ] TASK-07x-20 | `src/pages/tabs/ReferenceTab.tsx`, `src/lib/diagramSplit.ts` | Add a "Diagram family stats" panel to the Reference tab that accepts a paste or file upload of multiple Mermaid code blocks, calls `detectDiagram()` on each, and renders a bar chart (using only HTML/CSS, no charting library) showing how many diagrams of each family were found and what theming tier (Full/Partial/Limited/Gap) applies to each.

[ ] TASK-07x-21 | `docs/API-INTEGRATION.md` | Create `docs/API-INTEGRATION.md` documenting the Mermaid Chart API integration: required API scopes, OAuth 2.0 PKCE flow step-by-step, token storage location and expiry handling, rate limits, the exact API endpoints used (list diagrams, get diagram content, update diagram, sync theme), and how to revoke access.

[ ] TASK-07x-22 | `docs/SESSIONS.md` | Create `docs/SESSIONS.md` documenting the session save/load format: the JSON schema for a single session object (including `version`, `name`, `savedAt`, `palette`, `diagramCode`, `familyOverride`, `look`, `scaffoldPrefs`), the migration path if the schema changes between app versions, and the import/export contract for session bundles.

[ ] TASK-07x-23 | `src/lib/persistence.ts` | Extend the URL hash encoding in `persistence.ts` to include two additional fields: `session` (the name of the active saved session, if any) and `look` (the active look value: `classic`, `neo`, or `handDrawn`), so that a shared URL fully restores palette, look, and session name on load.

[ ] TASK-07x-24 | `src/hooks/useKeyboardShortcuts.ts` | Create `src/hooks/useKeyboardShortcuts.ts` implementing exactly 6 global keyboard shortcuts: `Ctrl/Cmd+Shift+C` (copy Styled Code), `Ctrl/Cmd+Shift+P` (toggle preview panel), `Ctrl/Cmd+Shift+K` (open palette picker), `Ctrl/Cmd+Shift+L` (cycle look: Classic → Neo → Hand-Drawn), `Ctrl/Cmd+Shift+X` (copy to clipboard in active format), `Ctrl/Cmd+Shift+I` (open import dialog) — with no conflicts with browser defaults.

[ ] TASK-07x-25 | `docs/KEYBOARD-SHORTCUTS.md` | Create `docs/KEYBOARD-SHORTCUTS.md` listing all 6 shortcuts from TASK-07x-24 in a two-column table (Mac modifier / Windows+Linux modifier) with a description column, plus a note that `Tab` and `Shift+Tab` navigate all controls and that `Escape` closes all modals and overlays.

---

## DEPENDENCIES AND SEQUENCING

### 1. Hard dependencies: v0.5.x → v0.6.x

The following v0.5.x tasks must be verified complete before beginning v0.6.x work:

- **TASK-05x-24** (test suite passes) must be green before any release-gating work begins.
- **TASK-05x-25** (README install instructions) must be done before App Store or Google Play
  metadata references the skill package as a distributable asset.
- **TASK-05x-08 and TASK-05x-09** (renderer profiles and output format contract complete)
  must be done before TASK-06x-10 through TASK-06x-13 (Ko-fi artifacts) since those
  artifacts reference the renderer profiles and output format documentation.

No other v0.5.x tasks block v0.6.x work. The native/PWA infrastructure tasks (TASK-06x-01
through TASK-06x-09) are fully independent of the skill package.

### 2. Hard dependencies: v0.6.x → v0.7.x

- **TASK-06x-01 through TASK-06x-04** (Capacitor installed and both platforms added) must
  be complete before TASK-07x-01 through TASK-07x-03 (session persistence) if the Capacitor
  Preferences plugin is used for native persistence. Web-only localStorage can begin sooner.
- **TASK-06x-23** (CHANGELOG.md created) should precede any v0.7.x release tagging.
- **TASK-06x-09** (service worker offline caching) must be complete and tested before
  TASK-07x-13 and TASK-07x-14 (theme history in localStorage) to avoid cache/storage quota
  issues.

### 3. Internal sprint ordering requirements

**v0.5.x internal order:**

- TASK-05x-12 through TASK-05x-14 (asset JSONs populated) must precede TASK-05x-16 through
  TASK-05x-20 (scripts that read from those assets) and TASK-05x-21 through TASK-05x-23
  (tests that run those scripts). Suggested order: 01–05 (SKILL.md text) → 06–11 (reference
  files) → 12–14 (asset JSONs) → 15 (fixtures) → 16–20 (scripts) → 21–23 (tests) → 24
  (test suite run) → 25 (README).

**v0.6.x internal order:**

- TASK-06x-01 and TASK-06x-02 (Capacitor install and config) must precede TASK-06x-03,
  TASK-06x-04, TASK-06x-05, TASK-06x-06, TASK-06x-07, TASK-06x-21, and TASK-06x-17 (all
  platform-specific and plugin tasks).
- TASK-06x-08 (PWA manifest) must precede TASK-06x-09 (service worker, which references
  the manifest's cache scope).
- TASK-06x-10 through TASK-06x-13 (Ko-fi artifacts) require TASK-05x-08 and TASK-05x-09
  complete; they are otherwise independent of each other.
- TASK-06x-15 and TASK-06x-16 (store metadata) must precede TASK-06x-17 (build pipeline)
  and TASK-06x-25 (review checklist).

**v0.7.x internal order:**

- TASK-07x-01 (sessions.ts) must precede TASK-07x-02 and TASK-07x-03 (Session UI).
- TASK-07x-04 (multi-diagram mode) must precede TASK-07x-05 (batch engine) and
  TASK-07x-06 (batch export).
- TASK-07x-05 must precede TASK-07x-07 (drift detector, which operates on batches).
- TASK-07x-07 must precede TASK-07x-08 (drift report export).
- TASK-07x-09 (OAuth) must precede TASK-07x-10, TASK-07x-11, TASK-07x-12 (all API
  operations require a connected session).
- TASK-07x-13 (theme history ring buffer) must precede TASK-07x-14 (history panel UI).
- TASK-07x-15 (HSL palette constructor) must precede TASK-07x-16 (contrast checker, which
  validates the constructed palette).
- TASK-07x-16 must precede TASK-07x-17 (contrast enforcement requires the checker).
- TASK-07x-18 (classDef library builder) must precede TASK-07x-19 (classDef export
  integration into Format C).
- TASK-07x-24 (keyboard shortcuts implementation) must precede TASK-07x-25 (docs).

### 4. Tasks that can be parallelized safely

**v0.5.x — safe to parallelize:**

- TASK-05x-01 through TASK-05x-05 (SKILL.md text verification) can all run in parallel.
- TASK-05x-06 through TASK-05x-11 (reference file verification) can all run in parallel
  once assets are confirmed.
- TASK-05x-21, TASK-05x-22, TASK-05x-23 (tests) can run in parallel once scripts exist.

**v0.6.x — safe to parallelize:**

- TASK-06x-03 (iOS platform) and TASK-06x-04 (Android platform) are fully independent.
- TASK-06x-05, TASK-06x-06, TASK-06x-07 (plugin integrations) are independent of each
  other and can run in parallel once TASK-06x-01 is done.
- TASK-06x-08 (PWA manifest) is independent of all Capacitor work.
- TASK-06x-10 through TASK-06x-13 (Ko-fi artifacts) are all independent of each other.
- TASK-06x-15 and TASK-06x-16 (App Store and Google Play metadata) are independent.
- TASK-06x-18, TASK-06x-19, TASK-06x-20 (mobile viewport fixes) are independent.

**v0.7.x — safe to parallelize:**

- TASK-07x-01 through TASK-07x-03 (sessions) and TASK-07x-09 through TASK-07x-12
  (Mermaid Chart API) are independent groups that can run in parallel.
- TASK-07x-15, TASK-07x-18 (palette constructor, classDef builder) are independent.
- TASK-07x-21, TASK-07x-22, TASK-07x-25 (documentation files) can all run in parallel
  once the features they document are implemented.
- TASK-07x-20 (family stats panel) is independent of all persistence and API work.

---

*This document is the planning artifact only. Implementation proceeds task-by-task with
individual project tasks in build mode. Do not implement this plan speculatively or in bulk.*
