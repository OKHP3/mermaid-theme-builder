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

async function openTab(page: Page, tab: (typeof AUDITED_TABS)[number]): Promise<void> {
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem("mtb.firstVisit", "true");
    sessionStorage.clear();
  });
  await page.goto(`/#${tab.id}`);
  await page.waitForLoadState("load");
  await expect(page.getByRole("tab", { name: tab.name }).first()).toHaveAttribute(
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
  for (const tab of AUDITED_TABS) {
    test(`${tab.name} has no Critical or Serious axe-core violations`, async ({ page }) => {
      await openTab(page, tab);
      const results = await scanForWcagViolations(page);
      const releaseBlockingViolations = results.violations.filter(
        (violation) => violation.impact === "critical" || violation.impact === "serious"
      );

      expect(
        releaseBlockingViolations,
        `WCAG 2.1 AA release blockers on ${tab.name}:\n${describeViolations(
          releaseBlockingViolations
        )}`
      ).toEqual([]);
    });
  }
});
