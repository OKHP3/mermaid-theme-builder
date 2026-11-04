import { test, expect, type Page } from "@playwright/test";
import axe from "axe-core";
import { createGovernanceProfile } from "../src/lib/governance-profile";
import { BRAND_PALETTES } from "../src/lib/palettes";
import { prepareThemeLibrary } from "../src/lib/theme-library";

const source = "\nflowchart LR\n A[Original source] --> B[Keep until replaced]\n";
const theme = createGovernanceProfile({
  id: "gallery-theme",
  name: "Documentation theme",
  colors: BRAND_PALETTES[0].colors,
  rendererTarget: "github",
  outputFormat: "frontmatter",
  outputFormatOverridden: true,
});

async function seed(page: Page) {
  const result = prepareThemeLibrary(null);
  if (!result.ok) throw new Error(result.error);
  result.state.themes = [theme];
  result.state.revision = 1;
  result.state.editorSession = {
    inputCode: source,
    activeThemeId: theme.id,
    selectedPaletteId: BRAND_PALETTES[0].id,
    preferences: {},
  };
  await page.addInitScript((state) => {
    if (localStorage.getItem("gallery-test-seeded")) return;
    localStorage.setItem("mtb.firstVisit", "true");
    localStorage.setItem("mtb.state.v2", JSON.stringify(state));
    localStorage.setItem("mtb.compose.previewSampleId", "class-mermaid-basic");
    localStorage.setItem("gallery-test-seeded", "true");
  }, result.state);
  await page.goto("./#compose");
  await expect(page.getByRole("region", { name: "Theme library status" })).toContainText(
    "Saved on this browser"
  );
}

async function preview(page: Page) {
  const svg = page.locator(".studio-canvas svg[aria-roledescription]").first();
  await expect(svg).toBeVisible();
  return svg;
}

test.use({ screenshot: "only-on-failure", trace: "retain-on-failure" });

test("gallery renders each family on demand and leaves source, theme, and original picker intact", async ({
  page,
}) => {
  await seed(page);
  const picker = page.getByRole("combobox", { name: "Preview diagram", exact: true });
  await expect(picker).toHaveValue("class-mermaid-basic");
  await expect(page.getByRole("region", { name: "Cross-diagram sample gallery" })).toHaveCount(0);
  await page.getByRole("button", { name: "Compare samples", exact: true }).click();
  const gallery = page.getByRole("region", { name: "Cross-diagram sample gallery" });
  for (const [family, expectedText] of [
    ["Flowchart", "Process A"],
    ["Sequence Diagram", "Submit Request"],
    ["ER Diagram", "CUSTOMER"],
  ]) {
    const button = gallery.getByRole("button", { name: new RegExp(family, "i") });
    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await expect(await preview(page)).toContainText(expectedText);
    await expect(page.locator(".studio-canvas svg[aria-roledescription]")).toHaveCount(1);
    await expect(page.locator(".studio-preview")).not.toContainText("Render Error");
    expect(
      await page.locator(".studio-canvas").evaluate((el) => el.getBoundingClientRect().height)
    ).toBeGreaterThanOrEqual(280);
  }
  await expect(gallery).toContainText("External renderer not validated");
  await expect(gallery).toContainText("GitHub");
  await page.getByRole("button", { name: "Close comparison", exact: true }).click();
  await expect(picker).toHaveValue("class-mermaid-basic");
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("mtb.state.v2")!));
  expect(saved.themes).toEqual([theme]);
  expect(saved.editorSession.inputCode).toBe(source);
  expect(saved.editorSession.activeThemeId).toBe(theme.id);
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export JSON", exact: true }).click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  if (!stream) throw new Error("Theme export stream missing");
  let exported = "";
  for await (const chunk of stream) exported += chunk.toString();
  expect(JSON.parse(exported)).toMatchObject({
    name: theme.name,
    colors: theme.colors,
    rendererTarget: "github",
    outputFormat: "frontmatter",
  });
  expect(exported).not.toContain("Original source");
});

test("rapid gallery navigation settles on the final sample and remains usable", async ({
  page,
}) => {
  await seed(page);
  await page.getByRole("button", { name: "Compare samples", exact: true }).click();
  const samples = page.getByRole("group", { name: "Preview samples" }).getByRole("button");
  await samples.nth(1).click();
  await samples.nth(2).click();
  await samples.nth(0).click();
  await expect(samples.nth(0)).toHaveAttribute("aria-pressed", "true");
  await expect(await preview(page)).toContainText("Process A");
  await page.getByRole("button", { name: "Use with my diagram" }).click();
  await expect(page.getByRole("textbox", { name: "Mermaid diagram code input" })).toHaveValue(
    source
  );
});

test("next-diagram action selects existing source without mutating it or the saved theme", async ({
  page,
}) => {
  await seed(page);
  await page.getByRole("button", { name: "Use theme", exact: true }).click();
  const input = page.getByRole("textbox", { name: "Mermaid diagram code input" });
  await page.getByRole("button", { name: "Paste next diagram", exact: true }).click();
  await expect(input).toBeFocused();
  await expect(input).toHaveValue(source);
  expect(
    await input.evaluate((el: HTMLTextAreaElement) => [el.selectionStart, el.selectionEnd])
  ).toEqual([0, source.length]);
  await input.fill("sequenceDiagram\n Alice->>Bob: Reuse this theme");
  await expect
    .poll(async () =>
      page.evaluate(() => JSON.parse(localStorage.getItem("mtb.state.v2")!).editorSession.inputCode)
    )
    .toContain("Reuse this theme");
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("mtb.state.v2")!));
  expect(saved.themes).toEqual([theme]);
  expect(saved.editorSession.activeThemeId).toBe(theme.id);
  await page.reload();
  await expect(input).toContainText("Reuse this theme");
});

test("gallery is keyboard-operable and fits a narrow viewport without serious accessibility findings", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await seed(page);
  await page.getByRole("button", { name: "Compare samples", exact: true }).click();
  const gallery = page.getByRole("region", { name: "Cross-diagram sample gallery" });
  const samples = gallery.getByRole("group", { name: "Preview samples" }).getByRole("button");
  await samples.nth(0).focus();
  await page.keyboard.press("Tab");
  await expect(samples.nth(1)).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(samples.nth(1)).toHaveAttribute("aria-pressed", "true");
  await preview(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true
  );
  await page.addScriptTag({ content: axe.source });
  const violations = await page.evaluate(
    async () =>
      (await (window as any).axe.run(document.querySelector(".cross-diagram-gallery"))).violations
  );
  expect(
    violations.filter((v: { impact: string }) => ["critical", "serious"].includes(v.impact))
  ).toEqual([]);
});
