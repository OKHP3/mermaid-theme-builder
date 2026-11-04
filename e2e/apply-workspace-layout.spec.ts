import { expect, test } from "@playwright/test";

for (const width of [320, 390, 1280]) {
  test(`Theme-first workspace keeps preview and source usable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 720 });
    await page.goto("./#apply");
    const content = page.locator(".theme-workbench-content");
    await expect(content).toHaveCSS("display", width < 768 ? "block" : "grid");
    const preview = page.getByRole("region", { name: "Diagram preview", exact: true });
    await expect(preview).toBeVisible();
    expect((await preview.boundingBox())!.y).toBeLessThan(420);
    if (width < 768) await page.getByRole("button", { name: "Edit diagram code" }).click();
    const source = page.getByLabel("Mermaid diagram code input");
    await source.fill("flowchart LR\n A[Start] --> B[Done]");
    if (width < 768) await page.getByRole("button", { name: "Show diagram preview" }).click();
    await expect(page.locator(".theme-workbench-preview svg").first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true
    );
    if (width < 768) {
      await page.getByRole("button", { name: "Choose theme" }).click();
      await expect(page.locator("#apply-palette-tile-overkill-hill")).toBeVisible();
      await page.getByRole("button", { name: "Edit diagram code" }).click();
    }
    await expect(source).toHaveValue("flowchart LR\n A[Start] --> B[Done]");
  });
}

test("Studio actions preserve current work and keep save keyboard-operable", async ({ page }) => {
  await page.goto("./#apply");
  const source = "sequenceDiagram\n Alice->>Bob: Keep this source";
  await page.getByLabel("Mermaid diagram code input").fill(source);
  await page.getByRole("button", { name: "Edit theme", exact: true }).click();
  await expect(page).toHaveURL(/#compose$/);
  await page.getByRole("button", { name: "Export Theme", exact: true }).click();
  await page.getByLabel("My Theme's Name", { exact: true }).fill("Review theme");
  const save = page
    .getByRole("tabpanel", { name: "Compose", exact: true })
    .getByRole("button", { name: "Save a copy", exact: true });
  await save.click();
  await expect(page.getByLabel("New theme name")).toBeFocused();
  await page.getByLabel("New theme name").press("Shift+Tab");
  await expect(page.getByRole("button", { name: "Cancel", exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(save).toBeFocused();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export JSON", exact: true }).click();
  expect((await download).suggestedFilename()).toMatch(/\.json$/);
  await page.getByRole("button", { name: "Use theme", exact: true }).click();
  await expect(page.getByLabel("Mermaid diagram code input")).toHaveValue(source);
  await expect(page.getByRole("heading", { name: "Review theme", exact: true })).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => {
        const state = JSON.parse(localStorage.getItem("mtb.state.v2")!);
        return [
          state?.editorSession.inputCode,
          state?.drafts.find(
            (draft: { id: string }) => draft.id === state.editorSession.selectedPaletteId
          )?.name,
        ];
      })
    )
    .toEqual([source, "Review theme"]);
  await page.reload();
  await expect(page.getByLabel("Mermaid diagram code input")).toHaveValue(source);
  await expect(page.getByRole("heading", { name: "Review theme", exact: true })).toBeVisible();
});

test("Mobile studio presents a preview before the inspector", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./#compose");
  await expect(page.locator(".studio-preview svg").first()).toBeVisible();
  expect((await page.locator(".studio-preview").boundingBox())!.y).toBeLessThan(300);
  await expect(page.getByRole("button", { name: "Use theme", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Edit theme settings" }).click();
  await expect(page.getByRole("button", { name: "Colors", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Preview sample diagram" }).click();
  await expect(page.locator(".studio-preview svg").first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("Promoted copy action exports the current styled code", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("./#apply");
  const source = page.getByLabel("Mermaid diagram code input");
  await source.fill("flowchart LR\n A[Review] --> B[Reuse]");
  await page.getByRole("button", { name: "Copy code", exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toContain("A[Review]");
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain("%%{init:");
  await source.fill("");
  await expect(page.getByRole("button", { name: "Copy code", exact: true })).toBeDisabled();
});

test("A saved export pane does not collapse the desktop diagram preview", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.addInitScript(() => localStorage.setItem("mtb.exportPreview.open", "true"));
  await page.goto("./#apply");
  await expect(page.getByTestId("export-preview-pane")).toBeVisible();
  const preview = page.locator(".theme-workbench-preview [data-print-only]");
  await expect.poll(async () => (await preview.boundingBox())?.height ?? 0).toBeGreaterThan(140);
  await expect(page.getByRole("button", { name: "Copy code", exact: true })).toBeInViewport();
  await expect(page.getByLabel("Mermaid diagram code input")).toBeInViewport();
});
