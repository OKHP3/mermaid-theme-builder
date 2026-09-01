import { expect, test, type Page } from "@playwright/test";

async function gotoApply(page: Page): Promise<void> {
  await page.addInitScript(() => {
    if (sessionStorage.getItem("renderer-format-test-seeded") === "true") return;
    localStorage.clear();
    localStorage.setItem("mtb.firstVisit", "true");
    sessionStorage.setItem("renderer-format-test-seeded", "true");
  });
  await page.goto("/");
  await page.waitForLoadState("load");
  await expect(page.getByLabel("Select target renderer")).toBeVisible();
}

function formatButton(page: Page, name: "%%{init}%%" | "YAML") {
  return page.getByRole("group", { name: "Theme directive format" }).getByRole("button", { name });
}

test.describe("renderer-aware output format recommendations", () => {
  test("selecting renderers applies their recommended format on every switch", async ({ page }) => {
    await gotoApply(page);

    const rendererSelect = page.getByLabel("Select target renderer");
    await rendererSelect.selectOption("github");
    await expect(formatButton(page, "YAML")).toHaveAttribute("aria-pressed", "true");

    await rendererSelect.selectOption("gitlab");
    await expect(formatButton(page, "%%{init}%%")).toHaveAttribute("aria-pressed", "true");

    await rendererSelect.selectOption("github");
    await expect(formatButton(page, "YAML")).toHaveAttribute("aria-pressed", "true");
  });

  test("an explicit format choice survives renderer changes until reset", async ({ page }) => {
    await gotoApply(page);

    const rendererSelect = page.getByLabel("Select target renderer");
    await rendererSelect.selectOption("github");
    await formatButton(page, "%%{init}%%").click();
    await expect(formatButton(page, "%%{init}%%")).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("button", { name: "Reset to recommended" })).toBeVisible();

    await rendererSelect.selectOption("gitlab");
    await rendererSelect.selectOption("github");
    await expect(formatButton(page, "%%{init}%%")).toHaveAttribute("aria-pressed", "true");

    await page.getByRole("button", { name: "Reset to recommended" }).click();
    await expect(formatButton(page, "YAML")).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("button", { name: "Reset to recommended" })).toHaveCount(0);
  });

  test("an explicit format choice survives reload and reset persists the recommendation", async ({
    page,
  }) => {
    await gotoApply(page);

    const rendererSelect = page.getByLabel("Select target renderer");
    await rendererSelect.selectOption("github");
    await expect(formatButton(page, "YAML")).toHaveAttribute("aria-pressed", "true");

    await formatButton(page, "%%{init}%%").click();
    await expect(formatButton(page, "%%{init}%%")).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("button", { name: "Reset to recommended" })).toBeVisible();

    await page.reload();
    await expect(page.getByLabel("Select target renderer")).toHaveValue("github");
    await expect(formatButton(page, "%%{init}%%")).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("button", { name: "Reset to recommended" })).toBeVisible();

    await page.getByRole("button", { name: "Reset to recommended" }).click();
    await expect(formatButton(page, "YAML")).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("button", { name: "Reset to recommended" })).toHaveCount(0);

    await page.reload();
    await expect(page.getByLabel("Select target renderer")).toHaveValue("github");
    await expect(formatButton(page, "YAML")).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("button", { name: "Reset to recommended" })).toHaveCount(0);
  });
});
