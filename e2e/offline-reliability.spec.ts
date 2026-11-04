import { expect, test } from "@playwright/test";
import { createGovernanceProfile } from "../src/lib/governance-profile";
import { BRAND_PALETTES } from "../src/lib/palettes";
import { prepareThemeLibrary } from "../src/lib/theme-library";

test("a warmed workspace reloads offline and returns online without losing themes or sibling data", async ({
  page,
  context,
}) => {
  const prepared = prepareThemeLibrary(null);
  if (!prepared.ok) throw new Error(prepared.error);
  const source = "flowchart LR\n  A[Preserve offline] --> B[Return online]";
  const theme = createGovernanceProfile({
    id: "offline-review",
    name: "Offline review",
    colors: BRAND_PALETTES[0].colors,
  });
  prepared.state.themes = [theme];
  prepared.state.revision = 1;
  prepared.state.editorSession = {
    inputCode: source,
    activeThemeId: theme.id,
    selectedPaletteId: BRAND_PALETTES[0].id,
    preferences: {},
  };
  await page.addInitScript((state) => {
    if (localStorage.getItem("mtb.offline.seeded")) return;
    localStorage.setItem("mtb.state.v2", JSON.stringify(state));
    localStorage.setItem("mtb.firstVisit", "true");
    localStorage.setItem("sibling-fixture", "keep this unrelated value");
    localStorage.setItem("mtb.offline.seeded", "true");
  }, prepared.state);
  await page.goto("./#compose");
  await expect
    .poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
    .toBe(true);
  await page.evaluate(async () => {
    const cache = await caches.open("sibling-offline-fixture");
    await cache.put("/sibling-fixture.txt", new Response("preserved sibling cache"));
  });
  // Warm the controlled production shell and the features tested below online.
  await page.reload();
  await page.getByRole("button", { name: "Compare samples", exact: true }).click();
  for (const [family, content] of [
    ["Flowchart", "Process A"],
    ["Sequence Diagram", "Submit Request"],
    ["ER Diagram", "CUSTOMER"],
  ])
    await test.step(`Warm ${family}`, async () => {
      await page
        .getByRole("group", { name: "Preview samples" })
        .getByRole("button", { name: new RegExp(family) })
        .click();
      await expect(page.locator(".studio-canvas svg[aria-roledescription]")).toContainText(content);
    });
  await page.getByRole("tab", { name: "Apply", exact: true }).click();
  await expect(page.getByLabel("Mermaid diagram code input")).toHaveValue(source);
  await expect(page.locator('[id^="mermaid-preview-"] svg').first()).toBeVisible();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("mtb.state.v2")!));

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByLabel("Mermaid diagram code input")).toHaveValue(source);
  await expect(page.getByRole("region", { name: "Theme library status" })).toContainText(
    "Offline review"
  );
  await expect(page.locator('[id^="mermaid-preview-"] svg').first()).toBeVisible();
  const retained = await page.evaluate(async () => ({
    library: JSON.parse(localStorage.getItem("mtb.state.v2")!),
    sibling: localStorage.getItem("sibling-fixture"),
    cachedSibling: await (
      await (await caches.open("sibling-offline-fixture")).match("/sibling-fixture.txt")
    )?.text(),
  }));
  expect(retained.library.themes).toEqual(saved.themes);
  expect(retained.library.editorSession.inputCode).toBe(source);
  expect(retained.sibling).toBe("keep this unrelated value");
  expect(retained.cachedSibling).toBe("preserved sibling cache");

  await context.setOffline(false);
  await page.reload();
  await expect(page.getByLabel("Mermaid diagram code input")).toHaveValue(source);
  await expect(page.locator('[id^="mermaid-preview-"] svg').first()).toBeVisible();
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem("mtb.state.v2")!).themes)
  ).toEqual(saved.themes);
});
