---
name: Playwright test isolation for this app
description: How to keep e2e tests isolated from localStorage state and strict-mode locator pitfalls specific to this app's tab/settings structure
---

## Rule
Always add `storageState: { cookies: [], origins: [] }` to `playwright.config.ts`'s `use` block so every test starts with empty browser storage. Without this, tab persistence from a previous run bleeds into the next run and changes which tab (and which DOM elements) are visible on load.

**Why:** App.tsx initializes `activeTab` from `window.location.hash`, then writes it back. If localStorage persists a previous `#compose` hash, the Compose tab opens on load — exposing a `aria-label="Toggle Settings"` accordion button that is invisible on the Apply tab. Any `getByRole("button", { name: "Settings" })` without `exact: true` then hits *two* elements (the header Settings button + the Compose accordion button) and throws a strict-mode violation.

**How to apply:**
- `playwright.config.ts` → `use: { storageState: { cookies: [], origins: [] } }` (global, not per-project)
- All `getByRole("button", { name: "Settings" })` locators → add `exact: true` to prevent substring match on "Toggle Settings"
- Default tab fallback in `App.tsx` `useState` initializer must remain `"apply"`, not `"compose"`, to match the test expectation `expect(["#apply", "#"]).toContain(initialHash)`
