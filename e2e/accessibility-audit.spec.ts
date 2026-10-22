import axe, { type AxeResults } from "axe-core";
import { expect, test, type Page } from "@playwright/test";
import { createDefaultMyThemeSlot } from "../src/lib/my-theme-slots";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];
const PERSISTED_STATE_KEY = "mtb.state.v1";
const AUDITED_TABS = [
  { id: "apply", name: "Apply" },
  { id: "compose", name: "Compose" },
  { id: "examples", name: "Examples" },
  { id: "reference", name: "Reference" },
  { id: "extract", name: "Extract" },
] as const;

const CUSTOMIZED_STATE = {
  schemaVersion: 1,
  selectedPaletteId: "overkill-hill",
  customColors: {
    "overkill-hill": [
      { key: "primaryColor", value: "#7f1d1d" },
      { key: "lineColor", value: "#f59e0b" },
    ],
  },
  includeMetaComments: true,
  includeBadge: true,
  customThemeName: "Persisted Audit Theme",
  inputCode: "flowchart TD\n  A[Start] --> B[Finish]",
  userPalettes: [],
  myThemeSlots: [],
  activeMyThemeSlotId: null,
  outputFormat: "frontmatter",
  outputFormatOverridden: true,
};

const PROFILE_SLOT = {
  ...createDefaultMyThemeSlot(1),
  name: "Persisted Audit Profile",
};

const PROFILE_STATE = {
  ...CUSTOMIZED_STATE,
  customColors: {},
  customThemeName: "",
  myThemeSlots: [PROFILE_SLOT],
  activeMyThemeSlotId: PROFILE_SLOT.id,
};

const AUDIT_MODES = [
  { name: "light desktop", theme: "light", viewport: undefined },
  { name: "dark desktop", theme: "dark", viewport: undefined },
  {
    name: "light mobile",
    theme: "light",
    viewport: { width: 390, height: 844 },
  },
  {
    name: "dark mobile",
    theme: "dark",
    viewport: { width: 390, height: 844 },
  },
] as const;

const OVERLAY_MODES = [AUDIT_MODES[0], AUDIT_MODES[1]] as const;

async function openTab(
  page: Page,
  tab: (typeof AUDITED_TABS)[number],
  mode: (typeof AUDIT_MODES)[number],
  persistedState?: object
): Promise<void> {
  if (mode.viewport) {
    await page.setViewportSize(mode.viewport);
  }
  await page.addInitScript(
    ({ stateKey, state }) => {
      localStorage.clear();
      localStorage.setItem("mtb.firstVisit", "true");
      sessionStorage.clear();
      if (state) localStorage.setItem(stateKey, JSON.stringify(state));
    },
    { stateKey: PERSISTED_STATE_KEY, state: persistedState ?? null }
  );
  await page.addInitScript((theme) => {
    localStorage.setItem("mtb.theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, mode.theme);
  await page.goto(`/#${tab.id}`);
  await page.waitForLoadState("load");
  await expect(page.locator("html")).toHaveAttribute("data-theme-mode", mode.theme);
  if (mode.viewport) {
    await expect(page.locator(".forge-mobile-nav")).toBeVisible();
  } else {
    await expect(page.locator('nav[aria-label="Mermaid Theme Builder sections"]')).toBeVisible();
  }
  await expect(page.getByRole("tab", { name: tab.name }).last()).toHaveAttribute(
    "aria-selected",
    "true"
  );
  await expect(page.locator(`#tabpanel-${tab.id}:not([hidden])`)).toBeVisible();
}

async function scanForWcagViolations(page: Page): Promise<AxeResults> {
  await page.evaluate(axe.source);
  return page.evaluate(async (tags) => {
    return (window as { axe: typeof axe }).axe.run(document, {
      runOnly: { type: "tag", values: tags },
    });
  }, WCAG_TAGS);
}

function describeViolations(violations: AxeResults["violations"]): string {
  return violations
    .map(
      (violation) =>
        `${violation.impact ?? "unknown"}: ${violation.id}. ${violation.help}\n` +
        `  Help: ${violation.helpUrl}\n${violation.nodes
          .map(
            (node) =>
              `  Target: ${node.target.join(", ")}\n` +
              `  HTML: ${node.html}\n` +
              `  Fix: ${node.failureSummary ?? "Review the axe-core help link above."}`
          )
          .join("\n")}`
    )
    .join("\n\n");
}

async function expectNoCriticalOrSerious(page: Page, stateDescription: string): Promise<void> {
  const results = await scanForWcagViolations(page);
  const releaseBlockingViolations = results.violations.filter(
    (violation) => violation.impact === "critical" || violation.impact === "serious"
  );

  expect(
    releaseBlockingViolations,
    `WCAG 2.1 A/AA Critical or Serious findings in ${stateDescription}:\n${describeViolations(
      releaseBlockingViolations
    )}`
  ).toEqual([]);
}

test.describe("WCAG 2.1 AA audit", () => {
  for (const mode of AUDIT_MODES) {
    for (const tab of AUDITED_TABS) {
      test(`${tab.name} has no Critical or Serious axe-core violations in ${mode.name}`, async ({
        page,
      }) => {
        await openTab(page, tab, mode);
        await expectNoCriticalOrSerious(page, `${tab.name} (${mode.name})`);
      });
    }
  }
});

test.describe("WCAG 2.1 A/AA overlay, expanded, and persisted states", () => {
  for (const mode of OVERLAY_MODES) {
    test(`Settings menu and reset confirmation pass in ${mode.name}`, async ({ page }) => {
      await openTab(page, AUDITED_TABS[0], mode, CUSTOMIZED_STATE);
      await page.getByRole("button", { name: "Settings", exact: true }).first().click();

      const settingsMenu = page.getByRole("menu", { name: "Settings" });
      await expect(settingsMenu).toBeVisible();
      await expectNoCriticalOrSerious(page, `Settings menu (${mode.name})`);

      await settingsMenu
        .getByRole("menuitem", { name: "Reset all palette customizations" })
        .click();
      await expect(settingsMenu.getByText("Reset all?", { exact: false })).toBeVisible();
      await expect(settingsMenu.getByRole("menuitem", { name: "Confirm" })).toBeVisible();
      await expectNoCriticalOrSerious(page, `Settings reset confirmation (${mode.name})`);
    });

    test(`Apply menus, export preview, and customized color dialog pass in ${mode.name}`, async ({
      page,
    }) => {
      await openTab(page, AUDITED_TABS[0], mode, CUSTOMIZED_STATE);

      const familyMenuTrigger = page.locator('button[title^="Auto-detected family"]');
      await familyMenuTrigger.click();
      await expect(page.getByRole("menu", { name: "Override diagram family" })).toBeVisible();
      await expectNoCriticalOrSerious(page, `Apply family menu (${mode.name})`);
      await page.getByRole("menuitemradio", { name: /Auto-detect/ }).click();

      await page.getByRole("button", { name: "Download", exact: true }).click();
      await expect(page.getByText(".mermaid", { exact: true }).first()).toBeVisible();
      await expectNoCriticalOrSerious(page, `Apply download menu (${mode.name})`);
      await page.getByRole("button", { name: "Download", exact: true }).click();

      await page.getByRole("button", { name: "Preview", exact: true }).click();
      await expect(page.getByTestId("export-preview-pane")).toBeVisible();
      await expectNoCriticalOrSerious(page, `Apply persisted-theme export preview (${mode.name})`);

      await page.getByRole("button", { name: "Edit Colors", exact: true }).click();
      const colorDialog = page.getByRole("dialog", { name: /Edit colors for/ });
      await expect(colorDialog).toBeVisible();
      await expect(
        colorDialog.getByRole("button", { name: "Reset all color overrides to default" })
      ).toBeVisible();
      await expectNoCriticalOrSerious(page, `Customized color editor dialog (${mode.name})`);
    });

    test(`Apply Prompt Scaffold dialog passes in ${mode.name}`, async ({ page }) => {
      await openTab(page, AUDITED_TABS[0], mode, CUSTOMIZED_STATE);
      await page.getByRole("button", { name: "Prompt Scaffold", exact: true }).click();
      await expect(page.getByRole("dialog", { name: "Generate Prompt Pattern" })).toBeVisible();
      await expectNoCriticalOrSerious(page, `Apply Prompt Scaffold dialog (${mode.name})`);
    });

    test(`Persisted profile details dialog passes in ${mode.name}`, async ({ page }) => {
      await openTab(page, AUDITED_TABS[0], mode, PROFILE_STATE);
      await page
        .getByRole("button", { name: "Profile details for Persisted Audit Profile" })
        .click();
      await expect(page.getByRole("dialog", { name: "Profile Details" })).toBeVisible();
      await expectNoCriticalOrSerious(page, `Persisted profile details dialog (${mode.name})`);
    });

    test(`Compose expanded sections and dialogs pass in ${mode.name}`, async ({ page }) => {
      await openTab(page, AUDITED_TABS[1], mode, CUSTOMIZED_STATE);

      for (const section of [
        "Import Theme",
        "Look",
        "Colors",
        "Typography",
        "Advanced",
        "Export Theme",
      ]) {
        await page.getByText(section, { exact: true }).click();
        const expandedSection = page.locator('[aria-expanded="true"]').filter({ hasText: section });
        await expect(expandedSection.first()).toBeVisible();
        await expectNoCriticalOrSerious(page, `Compose ${section} section (${mode.name})`);
      }

      await page.getByRole("button", { name: "Save Theme as", exact: true }).click();
      await expect(page.getByRole("dialog", { name: "Save as new palette" })).toBeVisible();
      await expectNoCriticalOrSerious(page, `Compose Save Theme dialog (${mode.name})`);
      await page.getByRole("button", { name: "Cancel", exact: true }).click();

      await page.getByRole("button", { name: "Generate Prompt Pattern", exact: true }).click();
      await expect(page.getByRole("dialog", { name: "Generate Prompt Pattern" })).toBeVisible();
      await expectNoCriticalOrSerious(page, `Compose Prompt Pattern dialog (${mode.name})`);
    });

    test(`Reference expanded panels and inventory pass in ${mode.name}`, async ({ page }) => {
      await openTab(page, AUDITED_TABS[3], mode, PROFILE_STATE);

      for (const section of [
        "Class Library",
        "Renderer Parity Matrix",
        "Use in…",
        "Mermaid Agent Skills",
      ]) {
        await page.locator("summary").filter({ hasText: section }).click();
        await expect(
          page
            .locator("details")
            .filter({ has: page.locator("summary").filter({ hasText: section }) })
        ).toHaveAttribute("open", "");
        await expectNoCriticalOrSerious(page, `Reference ${section} panel (${mode.name})`);
      }

      await page.getByRole("button", { name: /Diagram Inventory/ }).click();
      await expectNoCriticalOrSerious(page, `Reference Diagram Inventory (${mode.name})`);
    });

    test(`Examples expanded Diagram Inventory passes in ${mode.name}`, async ({ page }) => {
      await openTab(page, AUDITED_TABS[2], mode, PROFILE_STATE);
      await page.getByRole("button", { name: /Diagram Inventory/ }).click();
      await expectNoCriticalOrSerious(page, `Examples Diagram Inventory (${mode.name})`);
    });
  }

  for (const mode of [
    { name: "light mobile", theme: "light", viewport: { width: 390, height: 844 } },
    { name: "dark mobile", theme: "dark", viewport: { width: 390, height: 844 } },
  ] as const) {
    test(`Apply expanded code editor passes in ${mode.name}`, async ({ page }) => {
      await openTab(page, AUDITED_TABS[0], mode, CUSTOMIZED_STATE);
      await page.getByRole("button", { name: "Expand code editor" }).click();
      await expect(page.getByRole("button", { name: "Collapse code editor" })).toBeVisible();
      await expectNoCriticalOrSerious(page, `Apply expanded code editor (${mode.name})`);
    });
  }
});
