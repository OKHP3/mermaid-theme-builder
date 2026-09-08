---
name: Mermaid sequence E2E styling
description: Non-obvious SVG visibility and computed-style behavior for themed Mermaid sequence diagrams
---

## Rule

Mermaid sequence message lines can retain an inline `stroke="none"` attribute for marker geometry while the scoped Mermaid CSS supplies the themed signal color. In browser tests, assert their presence and computed stroke separately; do not require the line to be visible.

**Why:** Playwright treats the inline `stroke="none"` as hidden even when the rendered preview has the correct palette styling. Actor rectangles expose the themed fill and border directly through computed CSS.

**How to apply:** Locate the rendered `svg[aria-roledescription="sequence"]`, assert actor computed fill/border, then use a count/presence assertion plus `toHaveCSS("stroke", ...)` for `line.messageLine0`.