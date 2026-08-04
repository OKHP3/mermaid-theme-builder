/**
 * E2E test: color-coded Beta badge chips in Examples sidebar (Task #529).
 *
 * BadgeChip renders an amber pill for any badge string containing "Beta" and
 * a violet pill for badges containing "Experimental".  These tests verify the
 * chips actually appear with the expected text in a real Chromium browser —
 * both in the sidebar list and in the preview-panel header after the entry is
 * selected.
 */

import { test, expect, type Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function openExamplesTab(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await page.goto("/");
  await page.waitForLoadState("load");
  await page.getByRole("tab", { name: "Examples", exact: true }).first().click();
  // Wait for at least one sidebar entry to be present in the DOM.
  await page.waitForSelector("[data-example-id]", { timeout: 8000 });
}

/** Expand a section accordion by clicking its header button. */
async function expandSection(page: Page, sectionLabel: string): Promise<void> {
  await page.getByRole("button", { name: sectionLabel, exact: true }).click();
  // The entries inside the section become visible after the toggle.
}

// ---------------------------------------------------------------------------
// Test 1 — Beta chip is visible in the sidebar for a Beta-badged entry
// ---------------------------------------------------------------------------

test("Beta chip is visible in the 'Data & Planning' sidebar next to the Sankey entry", async ({
  page,
}) => {
  await openExamplesTab(page);
  await expandSection(page, "Data & Planning");

  // The Sankey entry has badge: "Beta" — its button must contain a "Beta" chip.
  const sankeyButton = page.locator('[data-example-id="sankey-effort-to-output"]');
  await expect(sankeyButton).toBeVisible({ timeout: 5000 });

  // The BadgeChip <span> sits inside the sidebar button.
  const chip = sankeyButton.getByText("Beta");
  await expect(chip).toBeVisible();
});

// ---------------------------------------------------------------------------
// Test 2 — Beta chip is visible in the preview header after clicking the entry
// ---------------------------------------------------------------------------

test("Beta chip appears in the preview header after selecting the Sankey Beta entry", async ({
  page,
}) => {
  await openExamplesTab(page);
  await expandSection(page, "Data & Planning");

  const sankeyButton = page.locator('[data-example-id="sankey-effort-to-output"]');
  await expect(sankeyButton).toBeVisible({ timeout: 5000 });
  await sankeyButton.click();

  // The preview header renders <BadgeChip badge={selectedExample?.badge} />.
  // It sits in the header bar alongside the example label and "Themed preview" text.
  // We look for at least two visible "Beta" texts: one in the sidebar, one in the header.
  const betaChips = page.getByText("Beta");
  await expect(betaChips.first()).toBeVisible({ timeout: 3000 });

  // There must be at least 2 visible occurrences (sidebar + preview header).
  const count = await betaChips.count();
  expect(count).toBeGreaterThanOrEqual(2);
});

// ---------------------------------------------------------------------------
// Test 3 — Beta chip carries amber color styling
// ---------------------------------------------------------------------------

test("Beta chip has amber text color (bg-amber or text-amber class)", async ({ page }) => {
  await openExamplesTab(page);
  await expandSection(page, "Data & Planning");

  const sankeyButton = page.locator('[data-example-id="sankey-effort-to-output"]');
  await expect(sankeyButton).toBeVisible({ timeout: 5000 });

  // The chip <span> sits inside the sidebar button with amber Tailwind classes.
  const chip = sankeyButton.locator("span").filter({ hasText: "Beta" }).first();
  await expect(chip).toBeVisible();

  const className = await chip.getAttribute("class");
  expect(className).toMatch(/amber/);
});

// ---------------------------------------------------------------------------
// Test 4 — A second Beta entry in a different section also shows a chip
// ---------------------------------------------------------------------------

test("Beta chip appears for a Wardley entry in the Specialty section", async ({ page }) => {
  await openExamplesTab(page);
  await expandSection(page, "Specialty");

  // wardley-diagram-generation-value-chain has badge: "Beta".
  const wardleyButton = page.locator('[data-example-id="wardley-diagram-generation-value-chain"]');
  await expect(wardleyButton).toBeVisible({ timeout: 5000 });

  const chip = wardleyButton.getByText("Beta");
  await expect(chip).toBeVisible();
});

// ---------------------------------------------------------------------------
// Test 5 — Entries without a badge show no chip
// ---------------------------------------------------------------------------

test("Sidebar entries without a badge show no chip text", async ({ page }) => {
  await openExamplesTab(page);
  // The first section "Flowchart & Sequence" contains plain non-badged entries.
  await expandSection(page, "Flowchart & Sequence");

  // flowchart-mermaid-basic has badge: "Canonical" (no amber/violet chip).
  const fcButton = page.locator('[data-example-id="flowchart-mermaid-basic"]');
  await expect(fcButton).toBeVisible({ timeout: 5000 });

  // There must be no amber span inside this button.
  const amberSpan = fcButton.locator("span").filter({ hasText: /^(Beta|Experimental)$/ });
  await expect(amberSpan).not.toBeAttached();
});
