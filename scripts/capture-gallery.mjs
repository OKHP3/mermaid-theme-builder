/**
 * Product Hunt gallery screenshot capture script.
 *
 * Captures the five gallery screenshots defined in LAUNCH.md §Gallery Plan
 * at 1280×800 and saves them to docs/gallery/.
 *
 * Run with:  node scripts/capture-gallery.mjs
 * Requires:  dev server running at http://localhost:80/mermaid-theme-builder/
 */

import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const GALLERY_DIR = resolve(ROOT, "docs/gallery");
const BASE = "http://localhost:80/mermaid-theme-builder/";
const CHROMIUM = "/nix/store/qa9cnw4v5xkxyip6mb9kxqfq1z4x2dx1-chromium-138.0.7204.100/bin/chromium";

const VIEWPORT = { width: 1280, height: 800 };

async function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Seed localStorage using the exact schema the app reads (mtb.state.v1).
 * Called via addInitScript so it runs before React initialises.
 */
function seedStorage({ paletteId = "okhp3", rendererTarget = "", outputFormat = "init-directive" } = {}) {
  const state = JSON.stringify({
    schemaVersion: 1,
    selectedPaletteId: paletteId,
    customColors: {},
    includeMetaComments: true,
    includeBadge: true,
    customThemeName: "",
    inputCode: "",
    userPalettes: [],
    recentPaletteIds: [],
    myThemeSlots: [],
    activeMyThemeSlotId: null,
    rendererTarget,
    outputFormat,
  });
  localStorage.setItem("mtb.state.v1", state);
  localStorage.setItem("mtb.firstVisit", "true");
  localStorage.removeItem("mtb.exportPreview.open");
}

/** Go to a tab via hash and wait for it to settle. */
async function gotoTab(page, tab) {
  await page.goto(`${BASE}#${tab}`);
  await page.waitForLoadState("networkidle");
  await wait(1000);
}

// --------------------------------------------------------------------------
// Screenshot 1 — Apply tab, palette picker visible, GitHub renderer, init-directive
// --------------------------------------------------------------------------
async function shot1(browser) {
  const ctx = await browser.newContext({ viewport: VIEWPORT });
  await ctx.addInitScript(seedStorage, { paletteId: "okhp3", rendererTarget: "", outputFormat: "init-directive" });
  const page = await ctx.newPage();

  await gotoTab(page, "apply");

  // Wait for the diagram code input.
  const input = page.getByLabel("Mermaid diagram code input");
  await input.waitFor({ state: "visible" });

  // Paste a clean flowchart.
  await input.fill([
    "flowchart LR",
    "  A([Client]) -->|Request| B[API Gateway]",
    "  B --> C{Auth Check}",
    "  C -->|Valid| D[Service Layer]",
    "  C -->|Invalid| E[/Error Response/]",
    "  D --> F[(Database)]",
    "  D --> G[Cache]",
  ].join("\n"));
  await wait(800);

  // Select GitHub renderer via the dropdown.
  const rendererSelect = page.getByLabel("Select target renderer");
  await rendererSelect.waitFor({ state: "visible" });
  await rendererSelect.selectOption("github");
  await wait(600);

  // Click the OKHP3 palette tile to make the selection visually clear.
  const okhpTile = page.locator('[role="radio"][id^="apply-palette-tile-okhp3"]');
  if (await okhpTile.isVisible().catch(() => false)) {
    await okhpTile.click();
    await wait(400);
  }

  await page.screenshot({ path: `${GALLERY_DIR}/01-apply-palette-github-init.png` });
  await ctx.close();
  console.log("✓ Screenshot 1 saved");
}

// --------------------------------------------------------------------------
// Screenshot 2 — Apply tab, export preview open, directive-length advisory
// --------------------------------------------------------------------------
async function shot2(browser) {
  const ctx = await browser.newContext({ viewport: VIEWPORT });
  await ctx.addInitScript(seedStorage, { paletteId: "okhp3", rendererTarget: "", outputFormat: "init-directive" });
  const page = await ctx.newPage();

  await gotoTab(page, "apply");

  const input = page.getByLabel("Mermaid diagram code input");
  await input.waitFor({ state: "visible" });

  // A longer flowchart to push the init directive past GitHub's byte ceiling.
  await input.fill([
    "flowchart TD",
    "  A([Start]) --> B[Parse Request]",
    "  B --> C{Validate Schema}",
    "  C -->|Invalid| D[/Return 400/]",
    "  C -->|Valid| E[Auth Middleware]",
    "  E --> F{Token Valid?}",
    "  F -->|No| G[/Return 401/]",
    "  F -->|Yes| H[Rate Limiter]",
    "  H --> I{Under Limit?}",
    "  I -->|No| J[/Return 429/]",
    "  I -->|Yes| K[Business Logic]",
    "  K --> L[(Primary DB)]",
    "  K --> M[Cache Layer]",
    "  M --> N{Cache Hit?}",
    "  N -->|Yes| O[Return Cached]",
    "  N -->|No| P[Query DB]",
    "  P --> Q[Update Cache]",
    "  Q --> R[Format Response]",
    "  O --> R",
    "  L --> R",
    "  R --> S([End])",
  ].join("\n"));
  await wait(800);

  // Select GitHub renderer.
  const rendererSelect = page.getByLabel("Select target renderer");
  await rendererSelect.waitFor({ state: "visible" });
  await rendererSelect.selectOption("github");
  await wait(400);

  // Open the export preview panel.
  const previewBtn = page.getByRole("button", { name: /Preview/i }).first();
  await previewBtn.waitFor({ state: "visible" });
  await previewBtn.click();
  await wait(1200);

  // Wait for the export preview code panel.
  await page.getByLabel("Export code preview").waitFor({ state: "visible", timeout: 8000 }).catch(() => {});
  await wait(600);

  await page.screenshot({ path: `${GALLERY_DIR}/02-apply-export-preview-advisory.png` });
  await ctx.close();
  console.log("✓ Screenshot 2 saved");
}

// --------------------------------------------------------------------------
// Screenshot 3 — Compose tab, live branded diagram with custom palette
// --------------------------------------------------------------------------
async function shot3(browser) {
  const ctx = await browser.newContext({ viewport: VIEWPORT });
  await ctx.addInitScript(seedStorage, { paletteId: "okhp3", rendererTarget: "", outputFormat: "init-directive" });
  const page = await ctx.newPage();

  await gotoTab(page, "compose");
  await wait(2500); // let Mermaid render

  // Expand the Colors accordion if collapsed to show the palette is active.
  const colorsSection = page.getByRole("button", { name: /Colors/i }).first();
  if (await colorsSection.isVisible().catch(() => false)) {
    const expanded = await colorsSection.getAttribute("aria-expanded").catch(() => null);
    if (expanded === "false" || expanded === null) {
      await colorsSection.click();
      await wait(400);
    }
  }

  await page.screenshot({ path: `${GALLERY_DIR}/03-compose-branded-diagram.png` });
  await ctx.close();
  console.log("✓ Screenshot 3 saved");
}

// --------------------------------------------------------------------------
// Screenshot 4 — Extract tab, pasted code with extracted palette variables
// --------------------------------------------------------------------------
async function shot4(browser) {
  const ctx = await browser.newContext({ viewport: VIEWPORT });
  await ctx.addInitScript(seedStorage, { paletteId: "okhp3", rendererTarget: "", outputFormat: "init-directive" });
  const page = await ctx.newPage();

  await gotoTab(page, "extract");

  const mermaidWithTheme = [
    "%%{init: {'theme': 'base', 'themeVariables': {",
    "  'primaryColor': '#2D6A4F',",
    "  'primaryTextColor': '#FFFFFF',",
    "  'primaryBorderColor': '#1B4332',",
    "  'secondaryColor': '#52B788',",
    "  'secondaryTextColor': '#081C15',",
    "  'tertiaryColor': '#B7E4C7',",
    "  'tertiaryTextColor': '#1B4332',",
    "  'lineColor': '#40916C',",
    "  'background': '#F0FFF4',",
    "  'mainBkg': '#2D6A4F',",
    "  'nodeBorder': '#1B4332',",
    "  'clusterBkg': '#D8F3DC',",
    "  'titleColor': '#081C15',",
    "  'edgeLabelBackground': '#B7E4C7',",
    "  'fontFamily': 'Inter, sans-serif'",
    "}}}%%",
    "flowchart TD",
    "  A[Brand Audit] --> B{Palette Valid?}",
    "  B -->|Yes| C[Apply Theme]",
    "  B -->|No| D[Fix Colors]",
    "  D --> B",
    "  C --> E[Export Init Directive]",
  ].join("\n");

  const textarea = page.locator("#extract-paste-area");
  await textarea.waitFor({ state: "visible", timeout: 8000 });
  await textarea.fill(mermaidWithTheme);
  await wait(400);

  // Click Extract.
  const extractBtn = page.getByRole("button", { name: /Extract/i }).first();
  await extractBtn.waitFor({ state: "visible" });
  await extractBtn.click();
  await wait(1200);

  await page.screenshot({ path: `${GALLERY_DIR}/04-extract-palette-variables.png` });
  await ctx.close();
  console.log("✓ Screenshot 4 saved");
}

// --------------------------------------------------------------------------
// Screenshot 5 — Reference tab, renderer × family capability matrix expanded
// --------------------------------------------------------------------------
async function shot5(browser) {
  const ctx = await browser.newContext({ viewport: VIEWPORT });
  await ctx.addInitScript(seedStorage, { paletteId: "okhp3", rendererTarget: "", outputFormat: "init-directive" });
  const page = await ctx.newPage();

  await gotoTab(page, "reference");
  await wait(1000);

  // Expand the "Renderer Parity Matrix" section.
  const matrixSection = page.locator("summary, button, [role='button']").filter({ hasText: /Renderer Parity/i }).first();
  if (await matrixSection.isVisible().catch(() => false)) {
    await matrixSection.click();
    await wait(1000);
  } else {
    // Try clicking by text content
    await page.getByText("Renderer Parity Matrix").first().click().catch(() => {});
    await wait(1000);
  }

  await page.screenshot({ path: `${GALLERY_DIR}/05-reference-capability-matrix.png` });
  await ctx.close();
  console.log("✓ Screenshot 5 saved");
}

// --------------------------------------------------------------------------
// Main
// --------------------------------------------------------------------------
async function main() {
  mkdirSync(GALLERY_DIR, { recursive: true });
  console.log(`Saving screenshots to ${GALLERY_DIR}`);

  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || CHROMIUM,
  });

  try {
    await shot1(browser);
    await shot2(browser);
    await shot3(browser);
    await shot4(browser);
    await shot5(browser);
    console.log("\nAll 5 gallery screenshots captured.");
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
