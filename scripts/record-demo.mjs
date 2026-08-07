/**
 * record-demo.mjs
 *
 * Records a ~30-second demo of the core Apply-tab loop for the Product Hunt
 * video slot.  Uses Playwright's built-in video recording then re-encodes to
 * MP4 via ffmpeg.
 *
 * Usage (dev server must already be running via `pnpm run dev`):
 *   node scripts/record-demo.mjs
 *
 * Output: docs/demo-apply-tab-loop.mp4
 *
 * Chromium discovery (in priority order):
 *   1. PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH env var
 *   2. First of chromium / chromium-browser / chrome found on PATH
 *   3. Playwright's own bundled browser (if installed)
 */

import { createRequire } from "module";
import { existsSync, mkdirSync, readdirSync } from "fs";
import { execSync } from "child_process";
import { tmpdir } from "os";
import { join, delimiter, sep } from "path";

// ── Portable Playwright import ────────────────────────────────────────────────
// @playwright/test is the declared devDependency and re-exports chromium.
// createRequire resolves via the workspace node_modules so pnpm hoisting is
// used — no store path is hard-coded and it survives lockfile updates.
const _require = createRequire(import.meta.url);
const { chromium } = _require("@playwright/test");

// ── Chromium discovery (mirrors playwright.config.ts) ────────────────────────
const exeSuffix = process.platform === "win32" ? ".exe" : "";
const binaryNames = [`chromium${exeSuffix}`, `chromium-browser${exeSuffix}`, `chrome${exeSuffix}`];
const pathDirs = (process.env.PATH ?? "").split(delimiter);
const chromiumCandidates = [
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
  ...pathDirs.flatMap((d) => binaryNames.map((b) => `${d}${sep}${b}`)),
];
const chromiumPath = chromiumCandidates.find((p) => !!p && existsSync(p));

// ── Config ────────────────────────────────────────────────────────────────────
const APP_URL = "http://localhost:18624/mermaid-theme-builder/";
const OUT_FILE = "docs/demo-apply-tab-loop.mp4";
const VIDEO_DIR = join(tmpdir(), "mtb-demo-video-" + Date.now());
const WIDTH = 1280;
const HEIGHT = 720;

const DIAGRAM = `flowchart TD
  A([🚀 Start]) --> B{Has Mermaid theme?}
  B -->|No| C[Open Theme Builder]
  B -->|Yes| D[Pick renderer target]
  C --> D
  D --> E[Apply brand palette]
  E --> F[Copy styled code]
  F --> G([✅ Done])`;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  mkdirSync(VIDEO_DIR, { recursive: true });

  console.log("Launching Chromium…", chromiumPath ?? "(Playwright bundled)");
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    ...(chromiumPath ? { executablePath: chromiumPath } : {}),
  });

  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    recordVideo: { dir: VIDEO_DIR, size: { width: WIDTH, height: HEIGHT } },
    // Seed firstVisit so the route-selector overlay never blocks the demo.
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

  // ── 0. Load app and wait for full paint ─────────────────────────────────────
  console.log("Navigating to app…");
  await page.goto(APP_URL, { waitUntil: "networkidle" });
  // Wait for a visible UI landmark to confirm the shell has painted.
  await page.getByRole("tab", { name: "Apply" }).first().waitFor({ state: "visible" });
  await sleep(3000); // [0–3 s] Hold on the loaded app so the viewer sees it clearly

  // ── 1. Switch to Apply tab ───────────────────────────────────────────────────
  console.log("Clicking Apply tab…");
  await page.getByRole("tab", { name: "Apply" }).first().click();
  await page.getByLabel("Mermaid diagram code input").waitFor({ state: "visible" });
  await sleep(1500); // [~4–5 s] Show the empty Apply tab state

  // ── 2. Paste diagram code ────────────────────────────────────────────────────
  console.log("Pasting diagram code…");
  const input = page.getByLabel("Mermaid diagram code input");
  await input.click();
  await input.fill(DIAGRAM);
  await sleep(800); // brief settle

  // ── 3. Wait for family auto-detection badge ──────────────────────────────────
  console.log("Waiting for Flowchart detection badge…");
  await page
    .locator("button")
    .filter({ hasText: /^Flowchart$/ })
    .first()
    .waitFor({ timeout: 8000 });
  await sleep(2500); // [~7–10 s] Let the viewer read the detected family badge

  // ── 4. Pick GitHub as the target renderer ────────────────────────────────────
  console.log("Selecting GitHub renderer…");
  const rendererSelect = page.getByLabel("Select target renderer");
  await rendererSelect.waitFor({ state: "visible" });
  await rendererSelect.selectOption({ label: "GitHub" });
  await sleep(3000); // [~10–13 s] Show the preflight advisory that appears

  // ── 5. Toggle format: %%{init}%% → YAML frontmatter ─────────────────────────
  console.log("Toggling to YAML format…");
  const formatGroup = page.getByRole("group", { name: "Theme directive format" });
  await formatGroup.waitFor({ state: "visible" });
  const yamlBtn = formatGroup.getByRole("button", { name: /YAML/i });
  await yamlBtn.click();
  await sleep(2500); // [~13–16 s] Show YAML output in the code panel

  // ── 6. Toggle back to %%{init}%% ─────────────────────────────────────────────
  console.log("Toggling back to %%{init}%%…");
  const initBtn = formatGroup.getByRole("button", { name: /%%\{init\}%%/ });
  await initBtn.click();
  await sleep(2000); // [~16–18 s] Show init-directive output

  // ── 7. Open the export preview pane ──────────────────────────────────────────
  console.log("Opening export preview pane…");
  // Button reads "Preview" when the pane is closed, "Hide" when open.
  const previewToggle = page.getByRole("button", { name: /^Preview$/ });
  if (await previewToggle.isVisible()) {
    await previewToggle.click();
  }
  await page.locator('[data-testid="export-preview-pane"]').waitFor({ state: "visible" });
  await sleep(3000); // [~18–21 s] Let the viewer read the full export preview

  // ── 8. Copy from the preview pane ────────────────────────────────────────────
  console.log("Clicking copy in preview…");
  const previewCopyBtn = page.getByRole("button", {
    name: /Copy export code from preview/i,
  });
  if (await previewCopyBtn.isVisible()) {
    await previewCopyBtn.click();
    await page
      .getByRole("button", { name: /Copied!/i })
      .waitFor({ state: "visible", timeout: 4000 })
      .catch(() => {}); // soft — clipboard may be suppressed in headless
    await sleep(2000); // [~21–23 s] Hold on the "Copied!" flash
  }

  // ── 9. Main Styled Code button as the closing beat ───────────────────────────
  console.log("Clicking Styled Code…");
  const styledCodeBtn = page.getByRole("button", { name: /^Styled Code$/ });
  if (await styledCodeBtn.isVisible()) {
    await styledCodeBtn.click();
    await page
      .getByRole("button", { name: /Copied!/i })
      .first()
      .waitFor({ state: "visible", timeout: 3000 })
      .catch(() => {});
    await sleep(2500); // [~23–26 s] Hold on the flash
  }

  // ── 10. Final hold — app visible in its complete state ───────────────────────
  await sleep(4000); // [~26–30 s] Linger on the finished state before fade-out

  // ── Stop recording ───────────────────────────────────────────────────────────
  console.log("Stopping recording…");
  await context.close(); // finalises the .webm
  await browser.close();

  // ── Find the .webm and convert to MP4 ────────────────────────────────────────
  const files = readdirSync(VIDEO_DIR).filter((f) => f.endsWith(".webm"));
  if (files.length === 0) throw new Error(`No .webm found in ${VIDEO_DIR}`);
  const webmPath = join(VIDEO_DIR, files[0]);
  console.log(`Converting ${webmPath} → ${OUT_FILE}…`);

  execSync(
    `ffmpeg -y -i "${webmPath}" -c:v libx264 -preset fast -crf 22 -movflags +faststart -vf "scale=${WIDTH}:${HEIGHT}" "${OUT_FILE}"`,
    { stdio: "inherit" }
  );

  // Report final duration.
  const probe = execSync(
    `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${OUT_FILE}"`,
    { encoding: "utf8" }
  ).trim();
  console.log(`\n✅  Demo saved: ${OUT_FILE}  (duration: ${probe} s)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
