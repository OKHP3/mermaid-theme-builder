/**
 * E2E test for the "See support details →" button in the ComposeTab beta hint
 * bar (Task #410).
 *
 * Unit / integration tests in composeBetaHint.test.tsx and
 * composeBetaHintNavigation.test.tsx verify the wiring at the React component
 * level. This spec exercises the full browser round-trip:
 *
 *   1. Load the app with a beta-family diagram pre-selected in the Compose
 *      tab preview picker (sankey-effort-to-output, badge: "Beta").
 *   2. Navigate to the Compose tab — the amber hint bar should be visible.
 *   3. Click "See support details →".
 *   4. Assert the Reference tab becomes the active panel (URL hash #reference).
 *   5. Assert "Renderer Parity Matrix" text is visible on screen (the section
 *      is auto-opened by the openParityMatrix effect in ReferenceTab).
 *
 * Strategy:
 *   - Seed mtb.compose.previewSampleId in localStorage via addInitScript()
 *     before React's first render to avoid a race with the default sample
 *     selection.
 *   - Use waitForURL to detect the tab switch synchronously rather than
 *     polling for panel visibility, which is slower and flakier.
 */

import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** localStorage key that ComposeTab reads for the preview picker selection. */
const LS_PREVIEW_KEY = "mtb.compose.previewSampleId";

/**
 * A catalog entry whose badge is "Beta" — triggers the hint bar.
 * id from src/data/example-library.ts line ~1471.
 */
const BETA_SAMPLE_ID = "sankey-effort-to-output";

// ---------------------------------------------------------------------------
// Test
// ---------------------------------------------------------------------------

/**
 * Non-beta sample ID used to clear the hint bar.
 * "compose-instructions" has no badge — it is the default placeholder entry.
 */
const NON_BETA_SAMPLE_ID = "compose-instructions";

test("'See support details →' switches to Reference tab and reveals Renderer Parity Matrix", async ({
  page,
}) => {
  // 1. Seed localStorage before React initialises so the picker already
  //    holds the beta sample on first render (avoids a race/double-render).
  await page.addInitScript(
    ({ key, value }: { key: string; value: string }) => {
      window.localStorage.clear();
      localStorage.setItem("mtb.firstVisit", "true");
      window.sessionStorage.clear();
      window.localStorage.setItem(key, value);
    },
    { key: LS_PREVIEW_KEY, value: BETA_SAMPLE_ID }
  );

  await page.goto("/");
  await page.waitForLoadState("load");

  // 2. Switch to the Compose tab.
  await Promise.all([
    page.waitForURL((url) => url.hash === "#compose"),
    page.getByRole("tab", { name: "Compose" }).first().click(),
  ]);

  // 3. The beta hint bar should now be visible — locate the button.
  const seeDetailsBtn = page.getByRole("button", { name: "See support details →" });
  await seeDetailsBtn.waitFor({ state: "visible", timeout: 8_000 });

  // 4. Click the button and wait for the app to switch to the Reference tab.
  await Promise.all([
    page.waitForURL((url) => url.hash === "#reference", { timeout: 8_000 }),
    seeDetailsBtn.click(),
  ]);

  expect(new URL(page.url()).hash).toBe("#reference");

  // 5. The Renderer Parity Matrix <details> is auto-opened by ReferenceTab's
  //    openParityMatrix effect. Assert its summary text is visible.
  await expect(page.getByText("Renderer Parity Matrix", { exact: false })).toBeVisible({
    timeout: 8_000,
  });
});

test("beta hint bar disappears when the preview picker switches to a non-beta diagram", async ({
  page,
}) => {
  // 1. Seed localStorage with the beta sample so the hint bar is visible on load.
  await page.addInitScript(
    ({ key, value }: { key: string; value: string }) => {
      window.localStorage.clear();
      localStorage.setItem("mtb.firstVisit", "true");
      window.sessionStorage.clear();
      window.localStorage.setItem(key, value);
    },
    { key: LS_PREVIEW_KEY, value: BETA_SAMPLE_ID }
  );

  await page.goto("/");
  await page.waitForLoadState("load");

  // 2. Switch to the Compose tab.
  await Promise.all([
    page.waitForURL((url) => url.hash === "#compose"),
    page.getByRole("tab", { name: "Compose" }).first().click(),
  ]);

  // 3. Confirm the hint bar is initially visible.
  const seeDetailsBtn = page.getByRole("button", { name: "See support details →" });
  await seeDetailsBtn.waitFor({ state: "visible", timeout: 8_000 });

  // 4. Switch the preview picker to a non-beta diagram.
  const picker = page.getByLabel("Preview diagram");
  await picker.selectOption(NON_BETA_SAMPLE_ID);

  // 5. The hint bar must disappear — the "See support details →" button should
  //    no longer be attached to the DOM.
  await expect(seeDetailsBtn).not.toBeAttached({ timeout: 5_000 });
});
