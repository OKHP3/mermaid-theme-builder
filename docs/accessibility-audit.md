# Accessibility audit

**Audit date:** 2026-09-01
**Status:** WCAG 2.1 A/AA automated release-blocker gate passing

## Automated scope

The Playwright audit in `e2e/accessibility-audit.spec.ts` scans the visible
first-visit experience for these tabs:

- Apply
- Compose
- Examples
- Reference
- Extract

Each tab is audited in four rendered modes:

- Light desktop (the default release gate)
- Dark desktop
- Light mobile at 390 × 844
- Dark mobile at 390 × 844

Each scan injects axe-core 4.13.0 and evaluates the `wcag2a`, `wcag2aa`, `wcag21a`,
and `wcag21aa` rule sets. Critical and Serious axe findings fail the test.

Run it with:

```sh
./scripts/run-e2e.sh e2e/accessibility-audit.spec.ts
```

## 2026-09-01 result

All 20 scans passed with no Critical or Serious violations.

The dark and mobile audit also caught and remediated low-contrast mobile disclaimer
text and light-theme tinted export controls. The existing desktop audit remains a
release blocker, and the expanded matrix now blocks the same Critical and Serious
findings in every covered theme/layout combination.

## Boundaries and follow-up

This automated gate is a release-blocker check, not a complete accessibility
certification. It does not replace manual keyboard, screen-reader, zoom/reflow,
high-contrast, or reduced-motion review. Moderate and Minor axe findings do not fail
this gate and should be triaged when they appear. The dark and mobile modes covered
here are the app's explicit theme and viewport states; arbitrary viewport sizes and
user-customized palette states remain outside this automated scope.
