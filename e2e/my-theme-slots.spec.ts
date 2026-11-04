import { test, expect, type Page } from "@playwright/test";
import { createDefaultMyThemeSlot } from "../src/lib/my-theme-slots";
import type { ThemeLibrary } from "../src/lib/theme-library";

const source = "flowchart LR\n A[Keep] --> B[Source]";
const tile = (page: Page, name: string) =>
  page.getByRole("radio", { name: name + " Mine", exact: true });
async function state(page: Page): Promise<ThemeLibrary> {
  return page.evaluate(() => JSON.parse(localStorage.getItem("mtb.state.v2")!));
}
async function working(page: Page) {
  const value = await state(page);
  return [
    ...value.themes.map((theme) => value.drafts.find((draft) => draft.id === theme.id) ?? theme),
    ...value.drafts.filter((draft) => !value.themes.some((theme) => theme.id === draft.id)),
  ];
}
async function seed(page: Page, count = 1, active = 1) {
  const legacy = JSON.stringify({
    schemaVersion: 1,
    myThemeSlots: Array.from({ length: count }, (_, i) => createDefaultMyThemeSlot(i + 1)),
    activeMyThemeSlotId: "my-theme-" + active,
    selectedPaletteId: "overkill-hill",
    customColors: {},
    userPalettes: [],
    inputCode: source,
    includeBadge: false,
    includeMetaComments: true,
  });
  await page.addInitScript((raw) => {
    if (!localStorage.getItem("mtb.test.seeded")) {
      localStorage.setItem("mtb.state.v1", raw);
      localStorage.setItem("mtb.firstVisit", "true");
      localStorage.setItem("mtb.test.seeded", "true");
    }
  }, legacy);
  await page.goto("./#compose");
  await expect(tile(page, "My Theme 1")).toBeVisible();
  await expect.poll(async () => (await state(page))?.revision).toBeGreaterThan(0);
  return legacy;
}
async function keepDraftIfAsked(page: Page) {
  const dialog = page.getByRole("dialog", { name: "Keep your theme changes?" });
  if (await dialog.isVisible())
    await dialog.getByRole("button", { name: "Keep draft and switch" }).click();
}

test("legacy selection restores themes and preserves original data", async ({ page }) => {
  const legacy = await seed(page, 2, 2);
  await expect(tile(page, "My Theme 2")).toHaveAttribute("aria-checked", "true");
  await tile(page, "My Theme 1").click();
  await keepDraftIfAsked(page);
  await expect(tile(page, "My Theme 1")).toHaveAttribute("aria-checked", "true");
  await expect(tile(page, "My Theme 2")).toHaveAttribute("aria-checked", "false");
  expect(await page.evaluate(() => localStorage.getItem("mtb.state.v1"))).toBe(legacy);
  expect((await state(page)).editorSession.inputCode).toBe(source);
});

test("New creates drafts beyond three themes without overwriting saved themes", async ({
  page,
}) => {
  await seed(page, 3);
  const add = page.getByRole("button", { name: "Add My Theme workspace", exact: true });
  await add.click();
  await keepDraftIfAsked(page);
  await expect(tile(page, "My theme 4")).toHaveAttribute("aria-checked", "true");
  await expect(add).toBeVisible();
  await expect.poll(async () => (await working(page)).length).toBe(4);
  expect((await state(page)).themes).toHaveLength(3);
});

test("deletion requires confirmation and removes only the chosen theme", async ({ page }) => {
  await seed(page, 2);
  await tile(page, "My Theme 1").hover();
  await page.getByRole("button", { name: "Delete My Theme 1", exact: true }).click({ force: true });
  const dialog = page.getByRole("dialog", { name: /Delete/ });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(tile(page, "My Theme 1")).toBeVisible();
  await tile(page, "My Theme 1").hover();
  await page.getByRole("button", { name: "Delete My Theme 1", exact: true }).click({ force: true });
  await dialog.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(tile(page, "My Theme 1")).toHaveCount(0);
  await expect
    .poll(async () => (await working(page)).map((theme) => theme.name))
    .toEqual(["My Theme 2"]);
  expect((await state(page)).editorSession.inputCode).toBe(source);
});

test("color edits persist only as a draft until explicitly saved", async ({ page }) => {
  await seed(page);
  const original = (await state(page)).themes[0];
  await page.getByRole("button", { name: "Colors", exact: true }).click();
  const color = page
    .locator('input[aria-label^="Hex value for"]')
    .filter({ visible: true })
    .first();
  await color.fill("#c0ffee");
  await color.press("Tab");
  await expect
    .poll(async () => (await working(page))[0].colors.some((color) => color.value === "#c0ffee"))
    .toBe(true);
  expect((await state(page)).themes[0]).toEqual(original);
  expect((await state(page)).drafts.every((theme) => theme.id === "my-theme-1")).toBe(true);
  await page
    .getByRole("region", { name: "Theme library status" })
    .getByRole("button", { name: "Save changes" })
    .click();
  await expect
    .poll(async () =>
      (await state(page)).themes[0].colors.some((color) => color.value === "#c0ffee")
    )
    .toBe(true);
});

test("theme action keys preserve selection, focus, and saved data", async ({ page }) => {
  const legacy = await seed(page, 3, 2);
  const before = await state(page);
  for (const name of [
    "Delete My Theme 2",
    "Move My Theme 2 up",
    "Move My Theme 2 down",
    "Duplicate My Theme 2",
    "Rename My Theme 2",
    "Profile details for My Theme 2",
    "Add My Theme workspace",
    "Import JSON as new slot",
  ]) {
    const button = page.getByRole("button", { name, exact: true });
    await button.focus();
    for (const key of ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"]) {
      await button.press(key);
      await expect(button).toBeFocused();
      await expect(tile(page, "My Theme 2")).toHaveAttribute("aria-checked", "true");
    }
  }
  expect((await state(page)).themes).toEqual(before.themes);
  expect((await state(page)).editorSession.inputCode).toBe(source);
  expect(await page.evaluate(() => localStorage.getItem("mtb.state.v1"))).toBe(legacy);
});

for (const scenario of [
  { count: 2, deleted: 1, expected: "OKHP3" },
  { count: 2, deleted: 2, expected: "My Theme 1 Mine" },
  { count: 1, deleted: 1, expected: "OKHP3" },
]) {
  test(`keyboard deletion of theme ${scenario.deleted} among ${scenario.count} restores focus`, async ({
    page,
  }) => {
    const legacy = await seed(page, scenario.count);
    const before = await state(page);
    const trigger = page.getByRole("button", {
      name: `Delete My Theme ${scenario.deleted}`,
      exact: true,
    });
    await trigger.press("Enter");
    const dialog = page.getByRole("dialog", { name: /Delete/ });
    await expect(dialog).toBeVisible();
    await dialog.press("Escape");
    await expect(trigger).toBeFocused();
    await trigger.press("Enter");
    await dialog.getByRole("button", { name: "Delete", exact: true }).press("Enter");
    await expect(tile(page, `My Theme ${scenario.deleted}`)).toHaveCount(0);
    await expect(page.getByRole("radio", { name: scenario.expected, exact: true })).toBeFocused();
    expect((await state(page)).themes).toEqual(
      before.themes.filter((theme) => theme.id !== `my-theme-${scenario.deleted}`)
    );
    expect((await state(page)).editorSession.inputCode).toBe(source);
    expect(await page.evaluate(() => localStorage.getItem("mtb.state.v1"))).toBe(legacy);
  });
}

for (const tab of ["Compose", "Apply", "Examples", "Reference"]) {
  test("Duplicate and rename remain available from " + tab, async ({ page }) => {
    await seed(page, 3);
    await page.getByRole("tab", { name: tab, exact: true }).click();
    await tile(page, "My Theme 1").hover();
    await page
      .getByRole("button", { name: "Duplicate My Theme 1", exact: true })
      .click({ force: true });
    await keepDraftIfAsked(page);
    const rename = page.getByRole("textbox", { name: "Rename My Theme 1 (copy)" });
    await expect(rename).toBeFocused();
    await expect(rename).toHaveJSProperty("selectionStart", 0);
    await expect(rename).toHaveJSProperty("selectionEnd", "My Theme 1 (copy)".length);
    await rename.fill("Reusable style");
    await rename.press("Enter");
    await expect(tile(page, "Reusable style")).toHaveAttribute("aria-checked", "true");
    await expect
      .poll(async () => (await working(page)).map((theme) => theme.name))
      .toContain("Reusable style");
    expect((await state(page)).themes).toHaveLength(3);
    await tile(page, "Reusable style").getByText("Reusable style", { exact: true }).dblclick();
    const secondRename = page.getByRole("textbox", { name: "Rename Reusable style" });
    await secondRename.fill("Reusable style renamed");
    await secondRename.press("Home");
    await expect(secondRename).toHaveJSProperty("selectionStart", 0);
    await secondRename.press("End");
    await expect(secondRename).toHaveJSProperty("selectionStart", 22);
    await secondRename.press("Tab");
    await expect(
      page.getByRole("button", { name: "Delete Reusable style renamed", exact: true })
    ).toBeFocused();
    await expect
      .poll(async () => (await working(page)).map((theme) => theme.name))
      .toContain("Reusable style renamed");
  });

  for (const direction of ["up", "down"] as const) {
    test("Move " + direction + " persists and reloads from " + tab, async ({ page }) => {
      await seed(page, 2);
      await page.getByRole("tab", { name: tab, exact: true }).click();
      const name = direction === "up" ? "My Theme 2" : "My Theme 1";
      await tile(page, name).hover();
      await page
        .getByRole("button", { name: "Move " + name + " " + direction, exact: true })
        .click({ force: true });
      await expect
        .poll(async () => (await state(page)).themes.map((theme) => theme.id))
        .toEqual(["my-theme-2", "my-theme-1"]);
      await page.reload();
      const tiles = page.getByRole("radio").filter({ hasText: /My Theme [12]/ });
      await expect(tiles.nth(0)).toHaveAttribute("title", "My Theme 2");
      await expect(tiles.nth(1)).toHaveAttribute("title", "My Theme 1");
    });
  }
}

test("reorder controls respect the first and last theme boundaries", async ({ page }) => {
  await seed(page, 2);
  await tile(page, "My Theme 1").hover();
  await expect(
    page.getByRole("button", { name: "Move My Theme 1 up", exact: true })
  ).toBeDisabled();
  await tile(page, "My Theme 2").hover();
  await expect(
    page.getByRole("button", { name: "Move My Theme 2 down", exact: true })
  ).toBeDisabled();
});
