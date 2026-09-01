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
    localStorage.setItem("mtb.firstVisit", "true");
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
// Test 4 — A combined Canonical · Beta entry still shows the amber Beta chip
// ---------------------------------------------------------------------------

test("combined Canonical · Beta entry renders the amber Beta chip", async ({ page }) => {
  await openExamplesTab(page);
  await expandSection(page, "Data & Planning");

  // xychart-mermaid-basic has badge: "Canonical · Beta". The UI intentionally
  // surfaces the classification as a Beta pill rather than the full source
  // badge string, so this protects the includes("Beta") branch directly.
  const xychartButton = page.locator('[data-example-id="xychart-mermaid-basic"]');
  await expect(xychartButton).toBeVisible({ timeout: 5000 });

  const chip = xychartButton.locator("span").filter({ hasText: "Beta" }).first();
  await expect(chip).toBeVisible();
  await expect(chip).toHaveText("Beta");

  const className = await chip.getAttribute("class");
  expect(className).toMatch(/amber/);
});

// ---------------------------------------------------------------------------
// Test 5 — The combined badge remains visible in the preview header
// ---------------------------------------------------------------------------

test("combined Canonical · Beta entry keeps an amber Beta chip in the preview header", async ({
  page,
}) => {
  await openExamplesTab(page);
  await expandSection(page, "Data & Planning");

  const xychartButton = page.locator('[data-example-id="xychart-mermaid-basic"]');
  await expect(xychartButton).toBeVisible({ timeout: 5000 });

  const sidebarChip = xychartButton
    .locator("span")
    .filter({ hasText: /^Beta$/ })
    .first();
  await expect(sidebarChip).toBeVisible();

  await xychartButton.click();

  const previewHeader = page.getByText("Themed preview", { exact: true }).locator("..");
  const headerChip = previewHeader
    .locator("span")
    .filter({ hasText: /^Beta$/ })
    .first();
  await expect(headerChip).toBeVisible();
  await expect(headerChip).toHaveText("Beta");

  const headerClassName = await headerChip.getAttribute("class");
  expect(headerClassName).toMatch(/amber/);
  await expect(sidebarChip).toBeVisible();
});

// ---------------------------------------------------------------------------
// Test 6 — A second Beta entry in a different section also shows a chip
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
// Test 7 — Experimental chip is visible in the sidebar and preview header
// ---------------------------------------------------------------------------

test("Experimental chip is visible in the Specialty sidebar next to the Venn entry", async ({
  page,
}) => {
  await openExamplesTab(page);
  await expandSection(page, "Specialty");

  // venn-governance-triangle has badge: "Experimental" — the violet chip.
  const vennButton = page.locator('[data-example-id="venn-governance-triangle"]');
  await expect(vennButton).toBeVisible({ timeout: 5000 });

  const chip = vennButton.getByText("Experimental");
  await expect(chip).toBeVisible();
});

test("Experimental chip carries violet color styling", async ({ page }) => {
  await openExamplesTab(page);
  await expandSection(page, "Specialty");

  const vennButton = page.locator('[data-example-id="venn-governance-triangle"]');
  await expect(vennButton).toBeVisible({ timeout: 5000 });

  const chip = vennButton.locator("span").filter({ hasText: "Experimental" }).first();
  await expect(chip).toBeVisible();

  const className = await chip.getAttribute("class");
  expect(className).toMatch(/violet/);
});

test("Experimental chip also appears in the preview header after selecting the Venn entry", async ({
  page,
}) => {
  await openExamplesTab(page);
  await expandSection(page, "Specialty");

  const vennButton = page.locator('[data-example-id="venn-governance-triangle"]');
  await expect(vennButton).toBeVisible({ timeout: 5000 });
  await vennButton.click();

  // At least 2 visible "Experimental" texts: sidebar + preview header.
  const chips = page.getByText("Experimental");
  await expect(chips.first()).toBeVisible({ timeout: 3000 });
  const count = await chips.count();
  expect(count).toBeGreaterThanOrEqual(2);
});

// ---------------------------------------------------------------------------
// Test 10 — Entries without a badge show no chip
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
