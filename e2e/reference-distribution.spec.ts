/**
 * End-to-end coverage for the Reference tab's "Use in…" distribution center.
 *
 * The tests exercise AppShell's real renderer-aware export callbacks and the
 * ReferenceTab action buttons. Clipboard permissions are granted so assertions
 * inspect the exact code written by the browser API.
 */

import { test, expect, type Page } from "@playwright/test";
import { RENDERER_PROFILES } from "../src/data/renderer-parity";
import { createDefaultMyThemeSlot } from "../src/lib/my-theme-slots";
import { PROFILE_SHARE_PARAM } from "../src/lib/profile-share";

const STATE_KEY = "mtb.state.v1";
const FIRST_VISIT_KEY = "mtb.firstVisit";
const SELECTOR_HEADING = /What would you like to do/i;

const EMPTY_SLOTS_STATE = {
  schemaVersion: 1,
  selectedPaletteId: "okh-forge-night",
  customColors: {},
  includeMetaComments: true,
  includeBadge: true,
  customThemeName: "",
  inputCode: "",
  userPalettes: [],
  recentPaletteIds: [],
  myThemeSlots: [],
  activeMyThemeSlotId: null,
};

const ACTIVE_PROFILE_NAME = "Reference Share Theme";
const ACTIVE_PROFILE_STATE = {
  ...EMPTY_SLOTS_STATE,
  myThemeSlots: [{ ...createDefaultMyThemeSlot(1), name: ACTIVE_PROFILE_NAME }],
  activeMyThemeSlotId: "my-theme-1",
  rendererTarget: "github",
  outputFormat: "frontmatter",
  outputFormatOverridden: true,
};

/**
 * Start with a deterministic first-visit state, optionally hydrating a
 * persisted AppShell state before React's first render.
 */
async function gotoTab(page: Page, tab: "apply" | "reference", state?: object): Promise<void> {
  await page.addInitScript(
    ({ stateKey, firstVisitKey, stateValue }) => {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem(firstVisitKey, "true");
      if (stateValue) localStorage.setItem(stateKey, JSON.stringify(stateValue));
    },
    {
      stateKey: STATE_KEY,
      firstVisitKey: FIRST_VISIT_KEY,
      stateValue: state ?? null,
    }
  );

  await page.goto(`/#${tab}`);
  await page.waitForLoadState("load");
  await expect(page.getByRole("heading", { name: SELECTOR_HEADING })).not.toBeVisible({
    timeout: 4_000,
  });
}

/** Seed only once so a reload can verify the persisted hint dismissal. */
async function gotoTabWithReloadSafeSeed(page: Page, tab: "reference"): Promise<void> {
  await page.addInitScript(
    ({ stateKey, firstVisitKey }) => {
      if (sessionStorage.getItem("__mtb_reference_hint_seeded")) return;
      sessionStorage.setItem("__mtb_reference_hint_seeded", "true");
      localStorage.clear();
      localStorage.setItem(firstVisitKey, "true");
      localStorage.removeItem(stateKey);
    },
    { stateKey: STATE_KEY, firstVisitKey: FIRST_VISIT_KEY }
  );

  await page.goto(`/#${tab}`);
  await page.waitForLoadState("load");
  await expect(page.getByRole("tab", { name: "Reference", exact: true }).first()).toBeVisible();
}

/** Open the Reference tab's distribution accordion. */
async function openDistribution(page: Page): Promise<void> {
  await page.getByRole("tab", { name: "Reference", exact: true }).first().click();
  const summary = page.locator("summary").filter({ hasText: "Use in…" });
  await expect(summary).toBeVisible();
  await summary.click();
  await expect(page.getByText(/destinations · copy formatted export code/)).toBeVisible();
}

/** Set the user's current format to YAML on a full-support renderer. */
async function chooseYamlFormat(page: Page): Promise<void> {
  await page.getByLabel("Select target renderer").selectOption("github");
  await expect(
    page
      .getByRole("group", { name: "Theme directive format" })
      .getByRole("button", { name: "YAML" })
  ).toHaveAttribute("aria-pressed", "true");
}

test.describe("Reference distribution center", () => {
  for (const renderer of RENDERER_PROFILES) {
    test(`${renderer.shortName} copies the correct themed export format`, async ({
      page,
      context,
    }) => {
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
      await gotoTab(page, "apply");
      await chooseYamlFormat(page);
      await openDistribution(page);

      // Full-support destinations honor the user's selected YAML format.
      // Partial-support destinations always use init directives, as required
      // by the distribution-center renderer policy.
      const usesInitDirective = renderer.initDirectiveSupport === "partial";
      const formatLabel = usesInitDirective ? "%%{init}%%" : "YAML frontmatter";
      const copyButton = page.getByRole("button", {
        name: `Copy ${formatLabel} code for ${renderer.shortName}`,
      });

      await expect(copyButton).toBeVisible();
      await copyButton.click();
      await expect(copyButton).toContainText("Copied");

      const copied = await page.evaluate(() => navigator.clipboard.readText());
      expect(copied).toContain("flowchart TD");
      expect(copied).toContain("themeVariables");

      if (usesInitDirective) {
        expect(copied).toMatch(/^%%\{init:/);
        expect(copied).not.toMatch(/^---\n/);
      } else {
        expect(copied).toMatch(/^---\n/);
        expect(copied).toContain("config:\n");
        expect(copied).not.toContain("%%{init:");
      }
    });
  }

  for (const renderer of RENDERER_PROFILES.filter(
    (candidate) => candidate.id === "github" || candidate.id === "notion"
  )) {
    test(`${renderer.shortName} shortcut opens and focuses its export card`, async ({ page }) => {
      await gotoTab(page, "apply");

      const rendererSelect = page.getByLabel("Select target renderer");
      await rendererSelect.selectOption(renderer.id);

      const shortcut = page.getByRole("button", {
        name: `Open ${renderer.shortName} export card in Reference`,
      });
      await expect(shortcut).toBeVisible();

      await Promise.all([page.waitForURL((url) => url.hash === "#reference"), shortcut.click()]);

      const card = page.locator(`[data-renderer-id="${renderer.id}"]`);
      await expect(card).toBeVisible();
      await expect(card).toBeFocused();
      await expect(card).toHaveClass(/bg-primary\/5/);
      await expect(card).toBeInViewport();
      await expect(card).toHaveAttribute(
        "aria-label",
        `${renderer.displayName} export destination`
      );

      const distribution = card.locator("xpath=ancestor::details");
      await expect(distribution).toHaveAttribute("open", "");

      // The shortcut uses the normal tab hash, so browser Back returns to
      // Apply without losing the selected renderer.
      await Promise.all([page.waitForURL((url) => url.hash === "#apply"), page.goBack()]);
      await expect(rendererSelect).toHaveValue(renderer.id);
    });
  }

  test("shows a dismissible no-renderer hint and remembers the dismissal", async ({ page }) => {
    await gotoTabWithReloadSafeSeed(page, "reference");
    await openDistribution(page);

    const hint = page.getByText("Select a renderer target in Compose for best results.", {
      exact: true,
    });
    await expect(hint).toBeVisible();
    await page.getByRole("button", { name: "Dismiss renderer target hint" }).click();
    await expect(hint).not.toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(() => {
          const raw = localStorage.getItem("mtb.state.v1");
          return raw ? JSON.parse(raw).rendererTargetHintDismissed : false;
        })
      )
      .toBe(true);

    await page.reload();
    await page.waitForLoadState("load");
    await expect(page.getByRole("tab", { name: "Reference", exact: true }).first()).toBeVisible();
    await openDistribution(page);
    await expect(
      page.getByText("Select a renderer target in Compose for best results.", { exact: true })
    ).not.toBeVisible();
  });

  test("keeps the hint hidden after a renderer is selected and then cleared", async ({ page }) => {
    await gotoTab(page, "apply");
    const rendererSelect = page.getByLabel("Select target renderer");
    await rendererSelect.selectOption("github");
    await expect
      .poll(() =>
        page.evaluate(() => {
          const raw = localStorage.getItem("mtb.state.v1");
          return raw ? JSON.parse(raw).rendererTargetHintDismissed : false;
        })
      )
      .toBe(true);

    await rendererSelect.selectOption("");
    await openDistribution(page);
    await expect(
      page.getByText("Select a renderer target in Compose for best results.", { exact: true })
    ).not.toBeVisible();
  });

  test("disables every destination copy button when the diagram input is empty", async ({
    page,
  }) => {
    await gotoTab(page, "apply");
    await page.getByLabel("Mermaid diagram code input").fill(" \n\t ");

    await openDistribution(page);

    const disabledCopyButtons = page.getByRole("button", { name: /No diagram to copy for/ });
    await expect(disabledCopyButtons).toHaveCount(RENDERER_PROFILES.length);
    await expect(disabledCopyButtons.first()).toBeDisabled();
    await expect(disabledCopyButtons.first()).toHaveAttribute(
      "title",
      "No diagram to copy — enter Mermaid diagram code in Apply first."
    );
  });

  test("disables profile sharing when no My Theme slot is active", async ({ page }) => {
    await gotoTab(page, "reference", EMPTY_SLOTS_STATE);
    await openDistribution(page);

    await expect(
      page.getByRole("button", { name: "Copy profile share link to clipboard" })
    ).toBeDisabled();
  });

  test("enables profile sharing when a My Theme slot is active", async ({ page }) => {
    await gotoTab(page, "reference");
    await openDistribution(page);

    await expect(
      page.getByRole("button", { name: "Copy profile share link to clipboard" })
    ).toBeEnabled();
  });

  test("copies a profile link that restores the same slot and renderer settings in a new session", async ({
    page,
    context,
    browser,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await gotoTab(page, "apply", ACTIVE_PROFILE_STATE);
    await openDistribution(page);

    const copyProfileLink = page.getByRole("button", {
      name: "Copy profile share link to clipboard",
    });
    await expect(copyProfileLink).toBeEnabled();
    await copyProfileLink.click();
    await expect(copyProfileLink).toContainText("Copied");

    const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
    const parsedSharedUrl = new URL(sharedUrl);
    expect(parsedSharedUrl.searchParams.get(PROFILE_SHARE_PARAM)).toMatch(/^[A-Za-z0-9_-]+$/);

    const cleanContext = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    });
    try {
      const cleanPage = await cleanContext.newPage();
      await cleanPage.goto(sharedUrl);
      await cleanPage.waitForLoadState("load");

      const importedSlot = cleanPage.locator("#apply-palette-tile-my-theme-2");
      await expect(importedSlot).toHaveAttribute("title", ACTIVE_PROFILE_NAME, {
        timeout: 8_000,
      });
      await expect(importedSlot).toHaveAttribute("aria-checked", "true");

      await cleanPage.getByRole("tab", { name: "Apply", exact: true }).first().click();
      await expect(cleanPage.getByLabel("Select target renderer")).toHaveValue("github");
      await expect(
        cleanPage
          .getByRole("group", { name: "Theme directive format" })
          .getByRole("button", { name: "YAML" })
      ).toHaveAttribute("aria-pressed", "true");
    } finally {
      await cleanContext.close();
    }
  });
});
