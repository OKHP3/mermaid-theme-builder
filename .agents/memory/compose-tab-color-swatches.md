---
name: ComposeTab color swatches visibility
description: Color swatch hex inputs in ComposeTab are behind a collapsed section; Apply tab's ColorEditorPanel requires a state flag — how to reach them in e2e tests.
---

# ComposeTab color swatches visibility

## Rule
Click `getByRole("button", { name: "Toggle Colors" })` in the Compose tab before waiting for hex inputs. Filter with `.filter({ visible: true })` when the Apply tab (always mounted, hidden) might also have matching inputs in the DOM.

## Why
- `colorsOpen` starts as `false` in ComposeTab. The swatch section renders `className={colorsOpen ? "" : "hidden"}`, so inputs exist in the DOM but are not visible until toggled.
- ApplyTab's `ColorEditorPanel` is conditionally rendered only when `showColorEditor === true` — clicking through to it requires triggering a separate button.
- The Apply tab is always mounted (hidden when inactive), so its palette bar and swatches are always in the DOM; `.first()` without `.filter({ visible: true })` resolves to the hidden Apply-tab input, not the ComposeTab one.

## How to apply
For e2e tests that need to edit a color on the Compose tab:
```typescript
await page.getByRole("button", { name: "Toggle Colors" }).first().click();
const hexInput = page
  .locator('input[aria-label^="Hex value for"]')
  .filter({ visible: true })
  .first();
await hexInput.waitFor({ timeout: 8_000 });
```
