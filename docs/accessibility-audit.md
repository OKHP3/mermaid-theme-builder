# Accessibility audit

**Audit date:** 2026-08-24
**Status:** WCAG 2.1 A/AA automated release-blocker gate passing

## Automated scope

The Playwright audit in `e2e/accessibility-audit.spec.ts` scans the visible desktop
experience for these first-visit tabs:

- Apply
- Compose
- Examples
- Reference
- Extract

Each scan injects axe-core 4.12.1 and evaluates the `wcag2a`, `wcag2aa`, `wcag21a`,
and `wcag21aa` rule sets. Critical and Serious axe findings fail the test.

Run it with:

```sh
./scripts/run-e2e.sh e2e/accessibility-audit.spec.ts
```

## 2026-08-24 result

All five scans passed with no Critical or Serious violations.

The remediation raised shared muted, selected-state, header, footer, navigation,
status, and primary-button text to accessible contrast on their rendered surfaces.
It also corrected the audit's tab-panel selector to address the intentionally
separate desktop and mobile tab-panel trees.

## Boundaries and follow-up

This automated gate is a release-blocker check, not a complete accessibility
certification. It does not replace manual keyboard, screen-reader, zoom/reflow,
high-contrast, reduced-motion, or dark-mode review. Moderate and Minor axe findings
do not fail this gate and should be triaged when they appear.
