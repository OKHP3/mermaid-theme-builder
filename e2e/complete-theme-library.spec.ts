import { test, expect, type Page } from "@playwright/test";
import axe from "axe-core";
import { createGovernanceProfile } from "../src/lib/governance-profile";
import { BRAND_PALETTES } from "../src/lib/palettes";
import {
  prepareThemeLibrary,
  parseThemeLibrary,
  type ThemeLibrary,
} from "../src/lib/theme-library";

const source = "\nflowchart LR\n  A[Keep source] --> B[Exactly]\n";
const a = createGovernanceProfile({
  id: "theme-a",
  name: "Theme A",
  colors: BRAND_PALETTES[0].colors,
  rendererTarget: "github",
  outputFormat: "frontmatter",
  outputFormatOverridden: true,
  fontSize: "22px",
  strokeWidth: 4,
  includeBadge: false,
  typography: {
    diagramTitle: { fontSize: 26, fontFamily: "Alfa Slab One" },
    subgraphTitle: { fontSize: 20, fontFamily: "DM Sans" },
    nestedSubgraphTitle: { fontSize: 18, fontFamily: "DM Sans" },
    nodeLabel: { fontSize: 16, fontFamily: "DM Sans" },
    edgeLabel: { fontSize: 13, fontFamily: "JetBrains Mono" },
  },
  semanticClassDefs: ["classDef future fill:#123456"],
  extensions: { retainedNote: "Synthetic compatibility fixture" },
  advancedMermaidConfig: { htmlLabels: false, deterministicIds: true, deterministicIDSeed: "A" },
});
const b = createGovernanceProfile({
  id: "theme-b",
  name: "Theme B",
  colors: BRAND_PALETTES[1].colors,
  look: "neo",
  fontSize: "14px",
  includeMetaComments: false,
});

async function seed(page: Page) {
  const prepared = prepareThemeLibrary(null);
  if (!prepared.ok) throw new Error(prepared.error);
  const state = prepared.state;
  state.themes = [a, b];
  state.revision = 1;
  state.editorSession = {
    inputCode: source,
    activeThemeId: a.id,
    selectedPaletteId: BRAND_PALETTES[0].id,
    preferences: {},
  };
  await page.addInitScript((initial) => {
    if (!localStorage.getItem("mtb.e2e.seeded")) {
      localStorage.clear();
      localStorage.setItem("mtb.state.v2", JSON.stringify(initial));
      localStorage.setItem("mtb.firstVisit", "true");
      localStorage.setItem("mtb.e2e.seeded", "true");
    }
  }, state);
  await page.goto("./#compose");
  await expect(page.getByRole("region", { name: "Theme library status" })).toContainText(
    "Saved on this browser"
  );
}

async function readLibrary(page: Page): Promise<ThemeLibrary> {
  return page.evaluate(() => JSON.parse(localStorage.getItem("mtb.state.v2")!));
}

test.use({ screenshot: "only-on-failure", trace: "retain-on-failure" });

test("complete themes remain isolated through save, switch, reload, and three diagram families", async ({
  page,
}) => {
  await seed(page);
  const compose = page.getByRole("tabpanel", { name: "Compose", exact: true });
  await compose.getByText("Typography", { exact: true }).click();
  await page.getByLabel("Custom font size", { exact: true }).fill("28px");
  await expect
    .poll(async () => (await readLibrary(page)).drafts.find((theme) => theme.id === a.id)?.fontSize)
    .toBe("28px");
  expect((await readLibrary(page)).themes[0].fontSize).toBe("22px");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect.poll(async () => (await readLibrary(page)).themes[0].fontSize).toBe("28px");
  await compose.getByRole("radio", { name: "Theme B Mine", exact: true }).click();
  await expect(page.getByLabel("Custom font size", { exact: true })).toHaveValue("14px");
  await compose.getByRole("radio", { name: "Theme A Mine", exact: true }).click();
  await expect(page.getByLabel("Custom font size", { exact: true })).toHaveValue("28px");
  await page.reload();
  await expect(page.getByRole("region", { name: "Theme library status" })).toContainText(
    "Saved on this browser"
  );
  await page.getByRole("tab", { name: "Apply", exact: true }).click();
  const input = page.getByLabel("Mermaid diagram code input");
  await expect(input).toHaveValue(source);
  for (const diagram of [
    "flowchart LR\nA-->B",
    "sequenceDiagram\nA->>B: Hello",
    "stateDiagram-v2\n[*] --> Active",
  ]) {
    await input.fill(diagram);
    await expect.poll(async () => (await readLibrary(page)).editorSession.inputCode).toBe(diagram);
    await expect(page.getByRole("region", { name: "Theme library status" })).toContainText(
      "Theme A"
    );
    await expect(page.locator('[id^="mermaid-preview-"] svg').first()).toBeVisible();
  }
  expect((await readLibrary(page)).themes[0].strokeWidth).toBe(4);
});

test("a fourth theme is saved and searchable, and a library download omits diagram source", async ({
  page,
}) => {
  await seed(page);
  for (const name of ["Theme C", "Theme D"]) {
    await page.getByRole("button", { name: "Save as copy", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Save a complete theme copy" });
    await dialog.getByLabel("Theme name", { exact: true }).fill(name);
    await dialog.getByRole("button", { name: "Save copy", exact: true }).click();
    await expect(dialog).not.toBeVisible();
  }
  expect((await readLibrary(page)).themes).toHaveLength(4);
  const compose = page.getByRole("tabpanel", { name: "Compose", exact: true });
  await compose.getByRole("searchbox", { name: "Search my themes" }).fill("Theme D");
  await expect(compose.getByRole("radio", { name: "Theme D Mine", exact: true })).toBeVisible();
  await expect(compose.getByRole("radio", { name: "Theme A Mine", exact: true })).toHaveCount(0);
  await page.getByText("Library backup", { exact: true }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download theme library", exact: true }).click();
  const file = await download;
  const stream = await file.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  const json = Buffer.concat(chunks).toString();
  expect(JSON.parse(json).themes).toHaveLength(4);
  expect(json).not.toContain("inputCode");
  expect(json).not.toContain("Keep source");
  expect(json).not.toContain("legacySource");
});

test("two tabs cannot silently overwrite each other's drafts", async ({ page, context }) => {
  await seed(page);
  await expect.poll(async () => (await readLibrary(page)).revision).toBeGreaterThan(1);
  const second = await context.newPage();
  await second.goto("./#compose");
  await expect(second.getByRole("region", { name: "Theme library status" })).toBeVisible();
  await Promise.all([
    page.getByText("Typography", { exact: true }).click(),
    second.getByText("Typography", { exact: true }).click(),
  ]);
  await Promise.all([
    page.getByLabel("Custom font size", { exact: true }).fill("27px"),
    second.getByLabel("Custom font size", { exact: true }).fill("29px"),
  ]);
  await expect
    .poll(
      async () =>
        (await page.getByRole("alert").count()) + (await second.getByRole("alert").count())
    )
    .toBeGreaterThan(0);
  await expect(page.getByLabel("Custom font size", { exact: true })).toHaveValue("27px");
  await expect(second.getByLabel("Custom font size", { exact: true })).toHaveValue("29px");
  expect((await readLibrary(page)).themes[0].fontSize).toBe("22px");
  const failing = (await page.getByRole("alert").count()) ? page : second;
  await expect(failing.getByRole("alert")).toContainText(/Another tab|library changed|could not/);
  await expect(
    failing.getByRole("alert").getByRole("button", { name: /Download workspace recovery/ })
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => {
        const values = Object.keys(localStorage)
          .filter((key) => key === "mtb.state.v2" || key.startsWith("mtb.recovery."))
          .flatMap((key) =>
            JSON.parse(localStorage.getItem(key)!).drafts.map(
              (theme: { fontSize: string }) => theme.fontSize
            )
          );
        return [values.includes("27px"), values.includes("29px")];
      })
    )
    .toEqual([true, true]);
});

async function downloadJson(page: Page, button: string) {
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: button, exact: true }).click(),
  ]);
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString();
}

test("Apply JSON and Compose share links carry every complete theme field", async ({
  page,
  context,
  browser,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await seed(page);
  await page.getByRole("tab", { name: "Apply", exact: true }).click();
  await page.getByRole("button", { name: "Download", exact: true }).click();
  const json = JSON.parse(await downloadJson(page, ".theme.json complete theme"));
  expect(json).toMatchObject(JSON.parse(JSON.stringify(a)));
  expect(json.type).toBe("mtb-governance-profile");
  expect(json).not.toHaveProperty("inputCode");
  await page.getByRole("tab", { name: "Compose", exact: true }).click();
  await page.getByRole("button", { name: "Export Theme", exact: true }).click();
  await page.getByRole("button", { name: "Share Via URL", exact: true }).click();
  const url = await page.evaluate(() => navigator.clipboard.readText());
  expect(new URL(url).searchParams.has("profile")).toBe(true);
  const receiver = await browser.newContext();
  const other = await receiver.newPage();
  await other.goto(url);
  const review = other.getByRole("dialog", { name: "Review theme import" });
  await expect(review).toContainText("Theme A");
  await review.getByRole("button", { name: "Import as copies", exact: true }).click();
  await expect.poll(async () => (await readLibrary(other)).themes.length).toBe(1);
  expect((await readLibrary(other)).themes[0]).toMatchObject(JSON.parse(JSON.stringify(a)));
  await receiver.close();
});

test("library backup restores complete records into an empty browser without importing source", async ({
  page,
  browser,
}) => {
  await seed(page);
  await page.getByText("Library backup", { exact: true }).click();
  const json = await downloadJson(page, "Download theme library");
  const context = await browser.newContext();
  const restored = await context.newPage();
  await restored.goto(page.url());
  const originalSource = await restored.evaluate(
    () =>
      document.querySelector<HTMLTextAreaElement>('[aria-label="Mermaid diagram code input"]')
        ?.value
  );
  await restored.getByLabel("Restore theme library", { exact: true }).setInputFiles({
    name: "library.json",
    mimeType: "application/json",
    buffer: Buffer.from(json),
  });
  const dialog = restored.getByRole("dialog", { name: "Review theme import" });
  await expect(dialog).toContainText("2 themes");
  await dialog.getByRole("button", { name: "Import as copies" }).click();
  await expect.poll(async () => (await readLibrary(restored)).themes.length).toBe(2);
  const recovered = await readLibrary(restored);
  const expected = [a, b].map((theme) => ({
    ...JSON.parse(JSON.stringify(theme)),
    provenance: { ...theme.provenance, originalId: theme.id },
  }));
  expect(recovered.themes).toEqual(expected);
  expect(recovered.editorSession.inputCode).not.toBe(source);
  if (originalSource !== undefined) expect(recovered.editorSession.inputCode).toBe(originalSource);
  await restored.reload();
  expect((await readLibrary(restored)).themes).toEqual(expected);
  await context.close();
});

test("saved and unsaved themes retain a mixed order across reload", async ({ page }) => {
  await seed(page);
  await page.getByRole("button", { name: "Add My Theme workspace", exact: true }).click();
  const draft = page.getByRole("radio", { name: "My theme 3 Mine", exact: true });
  await expect(draft).toBeVisible();
  await draft.hover();
  await page
    .getByRole("button", { name: "Move My theme 3 up", exact: true })
    .click({ force: true });
  await expect.poll(async () => (await readLibrary(page)).themeOrder?.length).toBe(3);
  await expect
    .poll(async () => (await readLibrary(page)).drafts.some((theme) => theme.name === "My theme 3"))
    .toBe(true);
  await page.reload();
  const radios = page.getByRole("radio").filter({ hasText: /Theme A|Theme B|My theme 3/ });
  await expect(radios.nth(1)).toHaveAttribute("title", "My theme 3");
});

test("a storage quota failure keeps saved data and offers downloadable current work", async ({
  page,
  browser,
}) => {
  await seed(page);
  await expect.poll(async () => (await readLibrary(page)).revision).toBeGreaterThan(1);
  const before = await readLibrary(page);
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "mtb.state.v2" || key.startsWith("mtb.recovery."))
        throw new DOMException("Full", "QuotaExceededError");
      original.call(this, key, value);
    };
  });
  await page.getByText("Typography", { exact: true }).click();
  await page.getByLabel("Custom font size", { exact: true }).fill("31px");
  await expect(page.getByRole("alert")).toContainText(/could not save|unavailable/);
  await expect(page.getByRole("button", { name: "Save changes", exact: true })).toBeDisabled();
  expect((await readLibrary(page)).themes).toEqual(before.themes);
  const json = await downloadJson(page, "Download workspace recovery (includes diagram)");
  expect(json).toContain("31px");
  expect(json).toContain("Keep source");
  // Rehearse restoration in a compatible build without mutating the failed tab.
  // The diagnostic package is intentionally not an ordinary library import.
  const restored = parseThemeLibrary(JSON.stringify(JSON.parse(json).workspace));
  expect(restored.ok).toBe(true);
  if (!restored.ok) throw new Error(restored.error);
  const recoveryContext = await browser.newContext();
  try {
    await recoveryContext.addInitScript((state) => {
      if (sessionStorage.getItem("recovery-seeded")) return;
      localStorage.setItem("mtb.state.v2", JSON.stringify(state));
      if (state.migration.legacySource !== null)
        localStorage.setItem("mtb.state.v1", state.migration.legacySource);
      localStorage.setItem("mtb.firstVisit", "true");
      sessionStorage.setItem("recovery-seeded", "true");
    }, restored.state);
    const recovered = await recoveryContext.newPage();
    await recovered.goto(page.url());
    await recovered.getByText("Typography", { exact: true }).click();
    await expect(recovered.getByLabel("Custom font size", { exact: true })).toHaveValue("31px");
    expect((await readLibrary(recovered)).themes).toEqual(before.themes);
    expect((await readLibrary(recovered)).editorSession.inputCode).toBe(source);
    await recovered.reload();
    await expect(recovered.getByRole("region", { name: "Theme library status" })).toContainText(
      "Unsaved changes"
    );
    expect((await readLibrary(page)).themes).toEqual(before.themes);
  } finally {
    await recoveryContext.close();
  }
});

for (const raw of ["malformed data", '{"schemaVersion":99}']) {
  test("unreadable storage remains untouched: " + raw, async ({ page }) => {
    await page.addInitScript((value) => {
      localStorage.setItem("mtb.state.v2", value);
      localStorage.setItem("mtb.firstVisit", "true");
    }, raw);
    await page.goto("./#compose");
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page.getByRole("region", { name: "Theme library status" })).toContainText(
      "Not saved"
    );
    expect(await page.evaluate(() => localStorage.getItem("mtb.state.v2"))).toBe(raw);
    const json = await downloadJson(page, "Download workspace recovery (includes diagram)");
    expect(JSON.stringify(JSON.parse(json))).toContain(JSON.stringify(raw).slice(1, -1));
  });
}

for (const width of [320, 640]) {
  test(
    "theme copy dialog is keyboard accessible and reflows at " + width + " CSS pixels",
    async ({ page }) => {
      await page.setViewportSize({ width, height: width === 640 ? 360 : 840 });
      await seed(page);
      await page.getByText("Library", { exact: true }).click();
      const opener = page.getByRole("button", { name: "Save as copy", exact: true });
      await opener.click();
      const dialog = page.getByRole("dialog", { name: "Save a complete theme copy" });
      await expect(dialog.getByLabel("Theme name", { exact: true })).toBeFocused();
      await page.evaluate(axe.source);
      const violations = await page.evaluate(
        async () =>
          (
            await (window as { axe: typeof axe }).axe.run(document, {
              runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
            })
          ).violations
      );
      expect(
        violations.filter((item) => item.impact === "serious" || item.impact === "critical")
      ).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true
      );
      await page.keyboard.press("Escape");
      await expect(dialog).not.toBeVisible();
      await expect(opener).toBeFocused();
    }
  );
}
