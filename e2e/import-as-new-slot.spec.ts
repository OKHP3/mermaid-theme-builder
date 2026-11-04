import { test, expect, type Page } from "@playwright/test";
import { createDefaultMyThemeSlot } from "../src/lib/my-theme-slots";

const palette = {
  type: "mtb-palette",
  schemaVersion: 1,
  id: "import-test",
  name: "Slate Storm",
  description: "test",
  version: "1.0.0",
  colors: [{ key: "primaryColor", label: "Primary", value: "#334155" }],
};
async function open(page: Page, count = 0) {
  await page.addInitScript(
    (slots) => {
      localStorage.setItem("mtb.firstVisit", "true");
      if (slots.length)
        localStorage.setItem(
          "mtb.state.v1",
          JSON.stringify({
            schemaVersion: 1,
            myThemeSlots: slots,
            activeMyThemeSlotId: slots[0].id,
            selectedPaletteId: "overkill-hill",
            inputCode: "flowchart LR\nA-->B",
            includeBadge: false,
          })
        );
    },
    Array.from({ length: count }, (_, i) => createDefaultMyThemeSlot(i + 1))
  );
  await page.goto("./#apply");
  await expect(page.getByRole("region", { name: "Theme library status" })).toBeVisible();
  await expect.poll(async () => (await library(page))?.themes.length).toBe(count);
}
async function upload(page: Page, json: string) {
  await page
    .getByLabel("Import palette JSON as new slot", { exact: true })
    .setInputFiles({ name: "theme.json", mimeType: "application/json", buffer: Buffer.from(json) });
}
const library = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem("mtb.state.v2")!));

for (const count of [0, 1, 3, 4]) {
  test("legacy import previews safely with " + count + " existing themes", async ({ page }) => {
    await open(page, count);
    await expect.poll(async () => (await library(page))?.themes.length).toBe(count);
    const before = await library(page);
    await expect(
      page.getByRole("button", { name: "Import JSON as new slot", exact: true })
    ).toBeVisible();
    await upload(page, JSON.stringify(palette));
    const dialog = page.getByRole("dialog", { name: "Review theme import" });
    await expect(dialog).toContainText("Slate Storm");
    await expect(dialog).toContainText("Legacy palettes");
    expect((await library(page)).themes).toHaveLength(count);
    await dialog.getByRole("button", { name: "Import as copies", exact: true }).click();
    await expect(dialog).not.toBeVisible();
    await expect.poll(async () => (await library(page)).themes.length).toBe(count + 1);
    const after = await library(page);
    expect(after.editorSession.inputCode).toBe(before.editorSession.inputCode);
    expect(after.editorSession.activeThemeId).toBe(before.editorSession.activeThemeId);
    await expect(
      page.getByRole("radio", { name: "Slate Storm Mine", exact: true })
    ).toHaveAttribute("aria-checked", "false");
    await expect(
      page.getByRole("button", { name: "Add My Theme workspace", exact: true })
    ).toBeVisible();
  });
}

test("canceling import preserves the original library", async ({ page }) => {
  await open(page, 1);
  await upload(page, JSON.stringify(palette));
  await page
    .getByRole("dialog", { name: "Review theme import" })
    .getByRole("button", { name: "Cancel", exact: true })
    .click();
  expect((await library(page)).themes).toHaveLength(1);
  await expect(page.getByRole("radio", { name: "Slate Storm Mine", exact: true })).toHaveCount(0);
});

for (const [label, json] of [
  ["truncated", '{"type":'],
  ["wrong type", JSON.stringify({ type: "wrong", schemaVersion: 1 })],
  ["future version", JSON.stringify({ ...palette, schemaVersion: 99 })],
]) {
  test("invalid import preserves the collection: " + label, async ({ page }) => {
    await open(page, 1);
    await upload(page, json);
    await expect(page.getByRole("alert")).toContainText("Could not import theme");
    await expect(page.getByRole("dialog", { name: "Review theme import" })).toHaveCount(0);
    expect((await library(page)).themes).toHaveLength(1);
  });
}

test("CSS warnings are reviewed before importing a legacy palette", async ({ page }) => {
  await open(page);
  await upload(
    page,
    JSON.stringify({
      ...palette,
      colors: [{ key: "primaryColor", label: "Primary", value: "coral" }],
    })
  );
  const dialog = page.getByRole("dialog", { name: "Review theme import" });
  await expect(dialog).toContainText("Review color value: primaryColor");
  await dialog.getByRole("button", { name: "Import as copies", exact: true }).click();
  await expect.poll(async () => (await library(page)).themes.length).toBe(1);
  expect((await library(page)).themes[0].colors[0].value).toBe("coral");
});
