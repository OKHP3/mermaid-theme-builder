---
name: Playwright localStorage seeding
description: How to correctly seed localStorage before the app loads in Playwright e2e tests; the goto+evaluate+reload approach races with React's default initial state.
---

# Playwright localStorage seeding

## Rule
Use `page.addInitScript()` to seed localStorage, never `goto → evaluate → reload`.

## Why
React's initial state renders the default slots (e.g. one `my-theme-1` tile) before the hydration `useEffect` fires and reads localStorage. If you seed with `evaluate` after `goto`, then `waitFor` on tile-1 succeeds against the default render (before hydration), but extra tiles seeded in localStorage don't appear because `waitFor` returned before hydration ran. `addInitScript` runs at document creation time — before any page scripts — so the app's first render already reflects the seeded state.

## How to apply
```typescript
await page.addInitScript(
  ({ key, value }: { key: string; value: string }) => {
    localStorage.setItem(key, value);
  },
  { key: LS_KEY, value: JSON.stringify(state) }
);
await page.goto("/");
```

Never seed with `evaluate` + `reload`; that approach introduces an unpredictable race.
