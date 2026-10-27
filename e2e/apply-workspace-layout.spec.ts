import { expect, test } from "@playwright/test";
for (const width of [390, 1280]) {
  test(`Apply workspace keeps its styled layout at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("./#apply");
    await page.getByRole("tab", { name: "Apply" }).first().click();
    const content = page.locator(".theme-workbench-content");
    await expect(content).toHaveCSS("display", width < 768 ? "block" : "grid");
    await expect(page.locator(".theme-workbench-swatch").first()).toHaveCSS("width", "28px");
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
    ).toBe(true);
    await page.getByLabel("Mermaid diagram code input").fill("flowchart LR\n A[Start] --> B[Done]");
    await expect(page.locator(".theme-workbench-preview svg").first()).toBeVisible();
  });
}
