import { expect, test } from "@playwright/test";

// These checks require actual rendering, not detection or a tolerated error.
const cases = [
  { name: "flowchart", marker: "ReviewFlow", code: "flowchart TD\n  A[ReviewFlow] --> B[Done]" },
  {
    name: "class",
    marker: "ReviewClass",
    code: "classDiagram\n  class ReviewClass\n  ReviewClass --> Result",
  },
  {
    name: "state",
    marker: "ReviewState",
    code: "stateDiagram-v2\n  [*] --> ReviewState\n  ReviewState --> [*]",
  },
  {
    name: "entity relationship",
    marker: "REVIEW_ENTITY",
    code: "erDiagram\n  REVIEW_ENTITY ||--o{ RESULT : creates",
  },
  {
    name: "requirement",
    marker: "ReviewRequirement",
    code: "requirementDiagram\n  requirement ReviewRequirement {\n    id: 1\n    text: Review\n    risk: low\n    verifymethod: test\n  }",
  },
  {
    name: "use case beta",
    marker: "ReviewUseCase",
    code: "usecase-beta\n  actor Reader\n  Read(ReviewUseCase)\n  Reader --> Read",
  },
  { name: "ZenUML adapter", marker: "ReviewActor", code: "zenuml\n  ReviewActor.method()" },
];

for (const item of cases) {
  test(`Mermaid 12 renders ${item.name} through the Apply pipeline`, async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.addInitScript(() => {
      localStorage.clear();
      localStorage.setItem("mtb.firstVisit", "true");
      sessionStorage.clear();
    });
    await page.goto("./#apply");
    await page.getByLabel("Mermaid diagram code input").fill(item.code);
    const preview = page.locator('section[aria-label="Diagram preview"] [id^="mermaid-preview-"]');
    // Scope to rendered content, excluding loading and zoom-control icons.
    const svg = preview.locator('[title^="Drag to pan"] svg');
    await expect(svg).toBeVisible({ timeout: 30000 });
    await expect(svg).toContainText(item.marker, { timeout: 30000 });
    const dimensions = await svg.evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      return { width: bounds.width, height: bounds.height };
    });
    expect(dimensions.width).toBeGreaterThan(0);
    expect(dimensions.height).toBeGreaterThan(0);
    await expect(preview.getByText("Render Error", { exact: true })).toHaveCount(0);
    expect(pageErrors).toEqual([]);
  });
}
