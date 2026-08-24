/**
 * E2E test: unused-styles indicator checkmark flash (Task #528).
 *
 * The ClassBrowser renders a "N styles not applied" banner for palette
 * classDef names that are not referenced in the current diagram.  Each
 * unused name is a clickable button (aria-label "Copy :::name") that:
 *   1. Writes ":::name" to the clipboard.
 *   2. Temporarily shows a checkmark SVG inside the button (the "flash").
 *   3. Clears the SVG after 1800 ms and reverts to the plain ":::name" text.
 *
 * This spec verifies the timing and SVG visibility in a real browser,
 * complementing the happy-dom unit tests in classBrowserIndicatorCopy.test.tsx.
 */

import { test, expect, type Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Fixture — a flowchart that uses :::primary so "primary" is in usedClassNames,
// leaving all other palette classDef names (secondary, tertiary, …) unused.
// ---------------------------------------------------------------------------

const DIAGRAM_WITH_ONE_USED_CLASS = `flowchart TD
  A[Start]:::primary --> B[Finish]:::primary
`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function loadWithDiagram(page: Page, inputCode: string): Promise<void> {
  await page.addInitScript((code) => {
    window.localStorage.clear();
    localStorage.setItem("mtb.firstVisit", "true");
    window.sessionStorage.clear();
    window.localStorage.setItem(
      "mtb.state.v1",
      JSON.stringify({ schemaVersion: 1, inputCode: code })
    );
  }, inputCode);

  await page.goto("/");
  await page.waitForLoadState("load");
}

/** Open the Apply tab (wires inputCode into the app) then switch to Reference
 *  and open the Class Library accordion. */
async function openClassLibrary(page: Page): Promise<void> {
  await page.getByRole("tab", { name: "Apply", exact: true }).first().click();
  await page.getByLabel("Mermaid diagram code input").waitFor({ state: "visible" });

  await page.getByRole("tab", { name: "Reference", exact: true }).first().click();
  await page.getByText("Class Library").first().click();
}

// ---------------------------------------------------------------------------
// Test 1 — "N styles not applied" banner is present with the expected buttons
// ---------------------------------------------------------------------------

test("unused-styles banner shows Copy buttons for classDef names absent from the diagram", async ({
  page,
}) => {
  await loadWithDiagram(page, DIAGRAM_WITH_ONE_USED_CLASS);
  await openClassLibrary(page);

  // The banner should be visible (at least one classDef is unused).
  await expect(page.getByText(/styles not applied/)).toBeVisible({ timeout: 5000 });

  // The "secondary" classDef is never used, so its Copy button must exist.
  await expect(page.getByRole("button", { name: "Copy :::secondary" })).toBeVisible({
    timeout: 3000,
  });
});

// ---------------------------------------------------------------------------
// Test 2 — Clicking the button makes the checkmark SVG visible
// ---------------------------------------------------------------------------

test("clicking a Copy button makes the checkmark SVG appear inside it", async ({ page }) => {
  await loadWithDiagram(page, DIAGRAM_WITH_ONE_USED_CLASS);
  await openClassLibrary(page);

  const copyBtn = page.getByRole("button", { name: "Copy :::secondary" });
  await expect(copyBtn).toBeVisible({ timeout: 5000 });

  // No SVG inside the button before clicking.
  await expect(copyBtn.locator("svg")).not.toBeAttached();

  // Click and assert the SVG appears.
  await copyBtn.click();
  await expect(copyBtn.locator("svg")).toBeVisible({ timeout: 2000 });
});

// ---------------------------------------------------------------------------
// Test 3 — The checkmark SVG disappears after 2 s (flash window is 1800 ms)
// ---------------------------------------------------------------------------

test("checkmark SVG disappears after the 1800 ms flash window", async ({ page }) => {
  await loadWithDiagram(page, DIAGRAM_WITH_ONE_USED_CLASS);
  await openClassLibrary(page);

  const copyBtn = page.getByRole("button", { name: "Copy :::secondary" });
  await expect(copyBtn).toBeVisible({ timeout: 5000 });

  await copyBtn.click();
  // SVG is present immediately after click.
  await expect(copyBtn.locator("svg")).toBeVisible({ timeout: 2000 });

  // Wait for the flash to expire (1800 ms + small buffer).
  await page.waitForTimeout(2100);

  // SVG must be gone; button reverts to plain ":::secondary" text.
  await expect(copyBtn.locator("svg")).not.toBeAttached();
  await expect(copyBtn).toContainText(":::secondary");
});

// ---------------------------------------------------------------------------
// Test 4 — Only the clicked button flashes; sibling buttons are unaffected
// ---------------------------------------------------------------------------

test("only the clicked indicator button shows the checkmark — siblings are unaffected", async ({
  page,
}) => {
  await loadWithDiagram(page, DIAGRAM_WITH_ONE_USED_CLASS);
  await openClassLibrary(page);

  // Both secondary and tertiary are unused in the fixture diagram.
  const secondaryBtn = page.getByRole("button", { name: "Copy :::secondary" });
  const tertiaryBtn = page.getByRole("button", { name: "Copy :::tertiary" });

  await expect(secondaryBtn).toBeVisible({ timeout: 5000 });
  await expect(tertiaryBtn).toBeVisible({ timeout: 3000 });

  // Click secondary only.
  await secondaryBtn.click();
  await expect(secondaryBtn.locator("svg")).toBeVisible({ timeout: 2000 });

  // Tertiary button must NOT have an SVG.
  await expect(tertiaryBtn.locator("svg")).not.toBeAttached();
});

// ---------------------------------------------------------------------------
// Test 5 — Copy button writes the usage annotation to the clipboard
// ---------------------------------------------------------------------------

test("clicking Copy :::secondary writes the exact usage annotation to the clipboard", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await loadWithDiagram(page, DIAGRAM_WITH_ONE_USED_CLASS);
  await openClassLibrary(page);

  const copyBtn = page.getByRole("button", { name: "Copy :::secondary" });
  await expect(copyBtn).toBeVisible({ timeout: 5000 });
  await copyBtn.click();
  await expect(copyBtn.locator("svg")).toBeVisible({ timeout: 2000 });

  const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboardText).toBe(":::secondary");
});
