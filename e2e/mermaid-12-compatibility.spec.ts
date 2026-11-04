import { expect, test, type Page } from "@playwright/test";

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
  {
    name: "mindmap labels",
    marker: "ReviewMindmap",
    code: "mindmap\n  root((ReviewMindmap))\n    First\n    Second",
  },
  {
    name: "circle label sizing",
    marker: "ReviewCircleLabel",
    code: "flowchart LR\n  A((ReviewCircleLabel)) --> B(((Done)))",
  },
  {
    name: "adjacent edge IDs",
    marker: "ReviewEdgeId",
    code: "flowchart LR\n  A[ReviewEdgeId]e1@--> B@{ shape: circle, label: Done }e2@--> C[Result]",
  },
  {
    name: "BPMN shapes within a flowchart",
    marker: "ReviewEvent",
    code: `flowchart LR
  A@{ shape: bpmn-start, label: ReviewEvent }
  B@{ shape: bpmn-activity, label: ReviewTask }
  C@{ shape: bpmn-gateway, label: ReviewChoice }
  D@{ shape: bpmn-end, label: ReviewEnd }
  E@{ shape: bpmn-intermediate, label: ReviewIntermediate }
  F@{ shape: bpmn-boundary, label: ReviewBoundary }
  G@{ shape: bpmn-data, label: ReviewData }
  H@{ shape: bpmn-data-store, label: ReviewStore }
  I@{ shape: bpmn-annotation, label: ReviewNote }
  A --> B --> C --> D
  E --> F
  G --> H --> I`,
  },
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
    // Mermaid labels its root SVG; exclude controls and nested ZenUML arrow SVGs.
    const svg = preview.locator("svg[aria-roledescription]");
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

async function renderSteps(page: Page) {
  await page.goto("./#apply");
  await page.getByLabel("Mermaid diagram code input").fill(`flowchart LR
  A[ReviewSteps]e1@--> B[ReviewResult]
  B e2@--> C[ReviewFinish]
  e1@{ step: 1 }
  e2@{ step: 2 }`);
  const svg = page.locator('section[aria-label="Diagram preview"] svg[aria-roledescription]');
  await expect(svg).toContainText("ReviewSteps", { timeout: 30000 });
  return svg;
}

test("Mermaid 12.3 preserves ordered step animation through strict preview rendering", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const svg = await renderSteps(page);
  await expect(svg.locator("circle.edge-step-dot animateMotion")).toHaveCount(2);
  expect(
    await svg
      .locator("circle.edge-step-dot")
      .evaluateAll((dots) => dots.map((dot) => dot.getAttribute("data-step")))
  ).toEqual(["1", "2"]);
});

test("Mermaid 12.3 hides step animation when reduced motion is requested", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const svg = await renderSteps(page);
  const dots = svg.locator("circle.edge-step-dot");
  await expect(dots).toHaveCount(2);
  for (const dot of await dots.all()) await expect(dot).toHaveCSS("display", "none");
  await expect(svg).toBeVisible();
});

test("Mermaid 12.3 renders nested ELK edges in Original and preserves themed output", async ({
  page,
}) => {
  const elkResponses: string[] = [];
  page.on("response", (response) => {
    if (/elk/i.test(response.url()) && response.ok()) elkResponses.push(response.url());
  });
  await page.goto("./#apply");
  await page.getByLabel("Mermaid diagram code input").fill(`%%{init: {"layout":"elk"}}%%
flowchart TB
  subgraph outer[ReviewOuter]
    subgraph inner[ReviewInner]
      da[ReviewSource]
    end
    a[ReviewTarget]
  end
  outer --> a
  da --> a`);
  await page.getByRole("tab", { name: "original", exact: true }).click();
  const svg = page.locator('section[aria-label="Diagram preview"] svg[aria-roledescription]');
  await expect(svg).toContainText("ReviewTarget", { timeout: 30000 });
  await expect.poll(() => elkResponses.length).toBeGreaterThan(0);
  await expect(svg.locator("path.flowchart-link")).toHaveCount(2);
  await page.getByRole("tab", { name: "themed", exact: true }).click();
  await expect(svg).toContainText("ReviewTarget", { timeout: 30000 });
  await expect(svg.locator("path.flowchart-link")).toHaveCount(2);
  await expect(page.getByLabel("Mermaid diagram code input")).toHaveValue(/ReviewSource/);
});
