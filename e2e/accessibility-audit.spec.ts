import axe, { type AxeResults } from "axe-core";
import { expect, test, type Page } from "@playwright/test";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];
const AUDITED_TABS = [
  { id: "apply", name: "Apply" },
  { id: "compose", name: "Compose" },
  { id: "examples", name: "Examples" },
  { id: "reference", name: "Reference" },
  { id: "extract", name: "Extract" },
] as const;

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

async function openTab(
  page: Page,
  tab: (typeof AUDITED_TABS)[number],
  mode: (typeof AUDIT_MODES)[number]
): Promise<void> {
  if (mode.viewport) {
    await page.setViewportSize(mode.viewport);
  }
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem("mtb.firstVisit", "true");
    sessionStorage.clear();
  });
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
        `${violation.impact ?? "unknown"}: ${violation.id} — ${violation.help}\n${violation.nodes
          .map((node) => `  ${node.target.join(", ")}: ${node.failureSummary ?? ""}`)
          .join("\n")}`
    )
    .join("\n\n");
}

test.describe("WCAG 2.1 AA audit", () => {
  for (const mode of AUDIT_MODES) {
    for (const tab of AUDITED_TABS) {
      test(`${tab.name} has no Critical or Serious axe-core violations in ${mode.name}`, async ({
        page,
      }) => {
        await openTab(page, tab, mode);
        const results = await scanForWcagViolations(page);
        const releaseBlockingViolations = results.violations.filter(
          (violation) => violation.impact === "critical" || violation.impact === "serious"
        );

        expect(
          releaseBlockingViolations,
          `WCAG 2.1 AA release blockers on ${tab.name} (${mode.name}):\n${describeViolations(
            releaseBlockingViolations
          )}`
        ).toEqual([]);
      });
    }
  }
});
