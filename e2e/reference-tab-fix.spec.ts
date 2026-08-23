/**
 * E2E test: Fix button replaces the typo in the live diagram source (Task #527).
 *
 * The ClassBrowser in ReferenceTab detects :::token typos (e.g. :::prmary
 * alongside the palette's "primary" classDef) and surfaces a Fix button.
 * Clicking it calls onApplyFix → handleApplyFix → onInputChange(applyClassFix(...)),
 * which updates the Apply tab diagram source textarea in place.
 *
 * What this test guards:
 *   1. The Fix button appears inside the "Class Library" accordion when a typo
 *      is present in the seeded diagram.
 *   2. Clicking Fix updates the diagram textarea — the typo is gone and the
 *      correct token is present.
 *   3. The Fix button disappears once the typo has been corrected.
 *
 * Note: the Class Library section is collapsed by default; these tests click
 * the "Class Library" summary to open it before asserting the Fix button.
 */

import { test, expect, type Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Fixture — a flowchart that:
//   • uses :::prmary (one-character-deletion typo of "primary")
//     so the ClassBrowser detects it as an unknown class name with a
//     near-miss suggestion of "primary" (edit distance = 1)
// ---------------------------------------------------------------------------

const DIAGRAM_WITH_TYPO = `flowchart TD
  A[Start]:::prmary --> B[Finish]:::prmary
`;

const DIAGRAM_WITH_TWO_TYPOS = `flowchart TD
  A[Start]:::prmary --> B[Middle]:::secndary
`;

// ---------------------------------------------------------------------------
// Helper
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

/** Navigate to the Apply tab and wait for the diagram input to be ready. */
async function openApplyTab(page: Page): Promise<void> {
  await page.getByRole("tab", { name: "Apply", exact: true }).first().click();
  await page.getByLabel("Mermaid diagram code input").waitFor({ state: "visible" });
}

/** Navigate to the Reference tab and open the Class Library accordion. */
async function openClassLibrary(page: Page): Promise<void> {
  await page.getByRole("tab", { name: "Reference", exact: true }).first().click();
  // The Class Library section is collapsed by default — click the summary to open it.
  await page.getByText("Class Library").first().click();
}

// ---------------------------------------------------------------------------
// Test 1 — Fix button appears for a diagram that contains a typo
// ---------------------------------------------------------------------------

test("Fix button is visible in the Class Library when the diagram contains a classDef typo", async ({
  page,
}) => {
  await loadWithDiagram(page, DIAGRAM_WITH_TYPO);
  await openApplyTab(page);
  await openClassLibrary(page);

  // The Fix button aria-label follows the pattern "Fix :::typo → :::suggestion".
  const fixButton = page.getByRole("button", { name: "Fix :::prmary → :::primary" });
  await expect(fixButton).toBeVisible({ timeout: 5000 });
});

// ---------------------------------------------------------------------------
// Test 2 — Clicking Fix removes the typo from the diagram source
// ---------------------------------------------------------------------------

test("clicking Fix removes :::prmary from the diagram source textarea", async ({ page }) => {
  await loadWithDiagram(page, DIAGRAM_WITH_TYPO);
  await openApplyTab(page);

  const input = page.getByLabel("Mermaid diagram code input");
  // Confirm typo is present before clicking Fix.
  await expect(input).toHaveValue(/:::prmary/);

  await openClassLibrary(page);

  const fixButton = page.getByRole("button", { name: "Fix :::prmary → :::primary" });
  await expect(fixButton).toBeVisible({ timeout: 5000 });
  await fixButton.click();

  // After Fix, the textarea must no longer contain the typo.
  await expect(input).not.toHaveValue(/:::prmary/);
});

// ---------------------------------------------------------------------------
// Test 3 — Clicking Fix inserts the correct token in the diagram source
// ---------------------------------------------------------------------------

test("clicking Fix inserts :::primary into the diagram source textarea", async ({ page }) => {
  await loadWithDiagram(page, DIAGRAM_WITH_TYPO);
  await openApplyTab(page);

  const input = page.getByLabel("Mermaid diagram code input");
  await openClassLibrary(page);

  const fixButton = page.getByRole("button", { name: "Fix :::prmary → :::primary" });
  await expect(fixButton).toBeVisible({ timeout: 5000 });
  await fixButton.click();

  // The corrected token must now be present.
  await expect(input).toHaveValue(/:::primary/);
});

// ---------------------------------------------------------------------------
// Test 4 — Fix button disappears after it has been applied (no more typos)
// ---------------------------------------------------------------------------

test("Fix button disappears after the typo has been corrected", async ({ page }) => {
  await loadWithDiagram(page, DIAGRAM_WITH_TYPO);
  await openApplyTab(page);
  await openClassLibrary(page);

  const fixButton = page.getByRole("button", { name: "Fix :::prmary → :::primary" });
  await expect(fixButton).toBeVisible({ timeout: 5000 });
  await fixButton.click();

  // Once the typo is gone, the Fix button should no longer be visible.
  await expect(fixButton).not.toBeVisible({ timeout: 3000 });
});

// ---------------------------------------------------------------------------
// Test 5 — Fixing one typo leaves a different typo unchanged
// ---------------------------------------------------------------------------

test("Fix button only corrects the selected typo when multiple typos are present", async ({
  page,
}) => {
  await loadWithDiagram(page, DIAGRAM_WITH_TWO_TYPOS);
  await openApplyTab(page);

  const input = page.getByLabel("Mermaid diagram code input");
  await expect(input).toHaveValue(/:::prmary/);
  await expect(input).toHaveValue(/:::secndary/);

  await openClassLibrary(page);

  const primaryFixButton = page.getByRole("button", {
    name: "Fix :::prmary → :::primary",
  });
  const secondaryFixButton = page.getByRole("button", {
    name: "Fix :::secndary → :::secondary",
  });
  await expect(primaryFixButton).toBeVisible({ timeout: 5000 });
  await expect(secondaryFixButton).toBeVisible({ timeout: 5000 });

  await primaryFixButton.click();

  await expect(input).toHaveValue(/:::primary/);
  await expect(input).not.toHaveValue(/:::prmary/);
  await expect(input).toHaveValue(/:::secndary/);
  await expect(secondaryFixButton).toBeVisible();
});
