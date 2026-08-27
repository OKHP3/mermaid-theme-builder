import { test, expect, type Page } from "@playwright/test";

/**
 * E2E regression test for the full Settings factory reset.
 *
 * The class-browser preview mode is intentionally stored outside the main
 * persisted state blob. This verifies the visible Settings action removes that
 * separate key and a real reload does not restore the former "All" selection.
 */

const PREVIEW_MODE_KEY = "mtb.classBrowser.previewMode";
const WELCOME_HEADING = /What would you like to do/i;
const DIAGRAM_WITH_USED_CLASS = 'flowchart TD\n  A["Start"]:::primary --> B["End"]';

async function openClassPreview(page: Page): Promise<void> {
  await page.getByRole("tab", { name: "Reference" }).first().click();

  const classLibrary = page.getByText("Class Library", { exact: true });
  await classLibrary.waitFor({ state: "visible", timeout: 6_000 });
  await classLibrary.click();

  const previewButton = page.getByRole("button", { name: "Preview all classDefs" });
  await previewButton.waitFor({ state: "visible", timeout: 5_000 });
  await previewButton.click();

  await expect(page.getByRole("group", { name: "Preview mode" })).toBeVisible({
    timeout: 5_000,
  });
}

test("Clear all settings removes the saved preview mode and a reload starts from the clean default", async ({
  page,
}) => {
  // The shared Playwright storage state marks this context as a returning user,
  // so the Settings menu is available without the welcome screen.
  await page.goto("/");
  await page.waitForLoadState("load");

  // Seed after navigation rather than with addInitScript: the value must not be
  // written again when page.reload() runs later in this test.
  await page.evaluate((key) => localStorage.setItem(key, "all"), PREVIEW_MODE_KEY);
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), PREVIEW_MODE_KEY))
    .toBe("all");

  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("menuitem", { name: "Clear all settings", exact: true }).click();

  // clearPersistedState removes this dedicated key synchronously.
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), PREVIEW_MODE_KEY))
    .toBeNull();

  await page.reload();
  await page.waitForLoadState("load");

  // The old value must stay absent after the browser reload; opening the
  // preview later must therefore use its normal no-preference default.
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), PREVIEW_MODE_KEY))
    .toBeNull();

  // A full factory reset can return this browser to the first-visit route
  // selector. When it is shown, dismiss it before continuing to the actual
  // preview-mode check; otherwise the reset has already landed on Apply.
  if (await page.getByRole("heading", { name: WELCOME_HEADING }).isVisible()) {
    await page.getByRole("button", { name: /Skip the welcome screen/i }).click();
  }

  // Add a diagram with a used class. Without a stored preference, the Class
  // Library's smart default is "Used"; a stale "all" key would activate "All".
  await page.getByRole("tab", { name: "Apply" }).first().click();
  const input = page.getByLabel("Mermaid diagram code input");
  await input.waitFor({ state: "visible", timeout: 5_000 });
  await input.fill(DIAGRAM_WITH_USED_CLASS);

  await openClassPreview(page);

  await expect(page.getByRole("button", { name: "Used", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  await expect(page.getByRole("button", { name: "All", exact: true })).toHaveAttribute(
    "aria-pressed",
    "false"
  );
});
