/**
 * record-demo.mjs
 *
 * Records a ~30-second demo of the core Apply-tab loop for the Product Hunt
 * video slot.  Uses Playwright's built-in video recording then re-encodes to
 * MP4 via ffmpeg.
 *
 * Usage:
 *   node scripts/record-demo.mjs
 *
 * Output: docs/demo-apply-tab-loop.mp4
 *
 * Requirements:
 *   - Dev server running on localhost:18624 (pnpm run dev)
 *   - System Chromium reachable on PATH or at CHROMIUM_PATH env var
 *   - ffmpeg on PATH
 */

import pwPkg from "/home/runner/workspace/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright/index.js";
const { chromium } = pwPkg;
import { mkdirSync, readdirSync, renameSync, existsSync } from "fs";
import { execSync } from "child_process";
import { tmpdir } from "os";
import { join } from "path";
import { existsSync as fsExistsSync } from "fs";

// ── Config ────────────────────────────────────────────────────────────────────

const APP_URL = "http://localhost:18624/mermaid-theme-builder/";
const OUT_FILE = "docs/demo-apply-tab-loop.mp4";
const VIDEO_DIR = join(tmpdir(), "mtb-demo-video-" + Date.now());
const WIDTH = 1280;
const HEIGHT = 720;

// Chromium candidates — env override wins, then PATH, then known Nix store path
const CHROMIUM_CANDIDATES = [
  process.env.CHROMIUM_PATH,
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
  "/nix/store/qa9cnw4v5xkxyip6mb9kxqfq1z4x2dx1-chromium-138.0.7204.100/bin/chromium",
];
const chromiumPath = CHROMIUM_CANDIDATES.find((p) => p && fsExistsSync(p));

const DIAGRAM = `flowchart TD
  A([🚀 Start]) --> B{Has Mermaid theme?}
  B -->|No| C[Open Theme Builder]
  B -->|Yes| D[Pick renderer target]
  C --> D
  D --> E[Apply brand palette]
  E --> F[Copy styled code]
  F --> G([✅ Done])`;

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  mkdirSync(VIDEO_DIR, { recursive: true });

  console.log("Launching Chromium…", chromiumPath ?? "(bundled)");
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    ...(chromiumPath ? { executablePath: chromiumPath } : {}),
  });

  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    recordVideo: { dir: VIDEO_DIR, size: { width: WIDTH, height: HEIGHT } },
    // Seed firstVisit so the route-selector overlay doesn't block
    storageState: {
      cookies: [],
      origins: [
        {
          origin: "http://localhost:18624",
          localStorage: [{ name: "mtb.firstVisit", value: "true" }],
        },
      ],
    },
  });

  const page = await context.newPage();

  // ── 0. Load app ─────────────────────────────────────────────────────────────
  console.log("Navigating to app…");
  await page.goto(APP_URL, { waitUntil: "networkidle" });
  await sleep(1500); // let fonts / diagram settle

  // ── 1. Switch to Apply tab ───────────────────────────────────────────────────
  console.log("Clicking Apply tab…");
  await page.getByRole("tab", { name: "Apply" }).first().click();
  await page.getByLabel("Mermaid diagram code input").waitFor({ state: "visible" });
  await sleep(1200);

  // ── 2. Paste diagram code ────────────────────────────────────────────────────
  console.log("Pasting diagram…");
  const input = page.getByLabel("Mermaid diagram code input");
  await input.click();
  await input.fill(DIAGRAM);
  await sleep(400);

  // ── 3. Wait for family auto-detection badge ──────────────────────────────────
  console.log("Waiting for detection badge…");
  await page
    .locator("button")
    .filter({ hasText: /^Flowchart$/ })
    .first()
    .waitFor({ timeout: 8000 });
  await sleep(1800); // pause so viewer can see the badge appear

  // ── 4. Pick a renderer (GitHub) ──────────────────────────────────────────────
  console.log("Selecting GitHub renderer…");
  const rendererSelect = page.getByLabel("Select target renderer");
  await rendererSelect.waitFor({ state: "visible" });
  await rendererSelect.selectOption({ label: "GitHub" });
  await sleep(2000); // show preflight advisory

  // ── 5. Toggle format: %%{init}%% → YAML ─────────────────────────────────────
  console.log("Toggling to YAML format…");
  const formatGroup = page.getByRole("group", { name: "Theme directive format" });
  await formatGroup.waitFor({ state: "visible" });
  const yamlBtn = formatGroup.getByRole("button", { name: /YAML/i });
  await yamlBtn.waitFor({ state: "visible" });
  await yamlBtn.click();
  await sleep(1800); // show YAML output

  // ── 6. Toggle back to %%{init}%% ─────────────────────────────────────────────
  console.log("Toggling back to %%{init}%%…");
  const initBtn = formatGroup.getByRole("button", { name: /%%\{init\}%%/ });
  await initBtn.waitFor({ state: "visible" });
  await initBtn.click();
  await sleep(1500);

  // ── 7. Open export preview pane ──────────────────────────────────────────────
  console.log("Opening export preview…");
  // The Preview toggle button shows "Preview" when closed and "Hide" when open.
  const previewToggle = page.getByRole("button", { name: /^Preview$|^Hide$/ });
  const isOpen = (await previewToggle.textContent())?.trim() === "Hide";
  if (!isOpen) {
    await previewToggle.click();
  }
  await page.locator('[data-testid="export-preview-pane"]').waitFor({ state: "visible" });
  await sleep(2000); // let viewer read the preview

  // ── 8. Copy from the preview pane ────────────────────────────────────────────
  console.log("Clicking copy…");
  const copyBtn = page.getByRole("button", {
    name: /Copy export code from preview/i,
  });
  await copyBtn.waitFor({ state: "visible" });
  await copyBtn.click();
  // Wait for "Copied!" confirmation
  await page
    .getByRole("button", { name: /Copied!/i })
    .waitFor({ state: "visible", timeout: 4000 })
    .catch(() => {}); // soft — some browsers suppress clipboard
  await sleep(2000); // hold on the "Copied!" flash

  // ── 9. Also click the main Styled Code button for completeness ───────────────
  console.log("Clicking Styled Code…");
  const styledCodeBtn = page.getByRole("button", { name: /Styled Code/i });
  if (await styledCodeBtn.isVisible()) {
    await styledCodeBtn.click();
    await page
      .getByRole("button", { name: /Copied!/i })
      .waitFor({ state: "visible", timeout: 3000 })
      .catch(() => {});
    await sleep(2000);
  }

  // ── 10. Final pause ──────────────────────────────────────────────────────────
  await sleep(1000);

  // ── Stop recording ───────────────────────────────────────────────────────────
  console.log("Stopping recording…");
  await context.close(); // this finalises the .webm file
  await browser.close();

  // ── Find the .webm and convert to MP4 ────────────────────────────────────────
  const files = readdirSync(VIDEO_DIR).filter((f) => f.endsWith(".webm"));
  if (files.length === 0) {
    throw new Error(`No .webm found in ${VIDEO_DIR}`);
  }
  const webmPath = join(VIDEO_DIR, files[0]);
  console.log(`Converting ${webmPath} → ${OUT_FILE}…`);

  execSync(
    `ffmpeg -y -i "${webmPath}" -c:v libx264 -preset fast -crf 22 -movflags +faststart -vf "scale=${WIDTH}:${HEIGHT}" "${OUT_FILE}"`,
    { stdio: "inherit" }
  );

  console.log(`\n✅  Demo saved to: ${OUT_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
