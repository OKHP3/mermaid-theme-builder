# ADR-0004: Playwright for end-to-end testing

## Status

Accepted

## Date

2026-01-01

## Context

The app's most critical behaviors cannot be verified by unit tests alone:

- Mermaid diagram rendering in a real browser with actual CSS variable
  resolution.
- `document.head` style injection and deduplication across diagram switches.
- Keyboard navigation, focus management, and ARIA state transitions.
- `localStorage` persistence across page reloads.
- Accessibility landmark tab order and skip-link behavior.

These behaviors require a real or realistic browser environment with a full
DOM, CSS cascade, and JavaScript event loop.

## Decision Drivers

- **Real browser DOM** — CSS variable resolution and Mermaid SVG injection
  cannot be meaningfully tested with JSDOM (used by Vitest's browser-less mode).
- **Cross-browser coverage** — Playwright supports Chromium, Firefox, and
  WebKit from a single test suite.
- **Accessibility testing** — `aria-*` attributes and focus order require real
  browser accessibility tree inspection.
- **Parallel test execution** — Playwright's worker model runs test files in
  parallel, keeping the suite fast despite full browser launches.

## Considered Options

### Option 1: Playwright (chosen)

- **Pros**: Real browser, cross-browser, parallel, first-class TypeScript,
  `page.evaluate()` for JS context inspection, built-in accessibility locators.
- **Cons**: Slower than JSDOM; requires Chromium/Firefox/WebKit binaries in CI.

### Option 2: Cypress

- **Pros**: Good DX, GUI runner, time-travel debugging.
- **Cons**: Electron-based runner has quirks; cross-browser requires paid tier;
  network intercept and multi-tab support less complete.

### Option 3: Puppeteer

- **Pros**: Chromium-only, lightweight.
- **Cons**: No cross-browser; limited accessibility API surface; more manual
  setup for assertions.

### Option 4: Vitest browser mode

- **Pros**: Unified test runner.
- **Cons**: At decision time, Vitest browser mode was experimental and did not
  support the multi-page, localStorage-persistence, and CSS-variable patterns
  the test suite requires.

## Decision

Use **Playwright** for all E2E tests in `e2e/`. Unit and component tests
continue to use **Vitest** with JSDOM for fast, browser-less feedback.

The split is:
- **Vitest** — pure logic, component props/state, snapshot tests, accessibility
  attribute tests that do not need a full browser.
- **Playwright** — anything that requires real CSS variable resolution, real
  browser rendering, or real navigation.

Playwright tests run in Chromium only in local development and CI to keep
the feedback loop manageable. Cross-browser coverage can be enabled via the
`projects` array in `playwright.config.ts`.

## Consequences

### Positive

- Real-browser confidence for Mermaid rendering, CSS injection, and
  `localStorage` behavior.
- Accessibility tree inspection via built-in Playwright locators.
- Parallel file-level execution keeps the 66-test suite under 3 minutes.

### Negative

- Chromium binary adds ~300 MB to CI runner disk usage.
- E2E tests require building the app first (`vite build`), adding ~30 s
  to the test cycle compared to unit tests.

## Related decisions

- ADR-0003: Mermaid browser rendering (the primary behavior E2E tests verify)
