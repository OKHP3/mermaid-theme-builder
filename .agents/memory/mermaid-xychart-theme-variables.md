---
name: Mermaid xychart theme variables
description: Mermaid 11's configuration shape for applying palette colors to xychart bar and line series.
---

Mermaid 11 reads xychart series colors from `themeVariables.xyChart.plotColorPalette`. The palette remains a comma-separated color string, but `xyChart` must be a nested object; a quoted `themeVariables.xyChart` string silently falls back to Mermaid's default series colors.

**Why:** A browser render can look successful while ignoring the selected palette, so output-shape tests alone are not enough for xychart theming.

**How to apply:** Serialize the nested object in both init-directive and YAML frontmatter exports, and verify at least one rendered bar or line fill in a real browser.