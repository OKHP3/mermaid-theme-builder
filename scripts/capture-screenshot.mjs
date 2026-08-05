#!/usr/bin/env node
/**
 * capture-screenshot.mjs
 *
 * Takes a fresh JPEG screenshot of the Mermaid Theme Builder and writes it to
 * docs/screenshot-v0.5.0.jpg, overwriting the previous image.
 *
 * Usage:
 *   pnpm run capture-screenshot                 # uses default preview URL
 *   pnpm run capture-screenshot --url <url>     # capture against a running server
 *
 * The script requires a running server at the target URL. Start one first:
 *   Local dev:     pnpm dev   (then run the script with --url http://localhost:18624/mermaid-theme-builder/)
 *   Prod preview:  pnpm build && pnpm serve   (default URL works)
 *
 * CI (release-gate workflow) pre-builds and pre-starts the server before
 * invoking this script, so no extra flags are needed there.
 */

import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve, delimiter, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const DEFAULT_URL = "http://localhost:4173/mermaid-theme-builder/";
const OUTPUT_PATH = resolve(root, "docs/screenshot-v0.5.0.jpg");
const VIEWPORT = { width: 1280, height: 800 };

// Parse --url flag.
const urlFlagIdx = process.argv.indexOf("--url");
const targetUrl = urlFlagIdx !== -1 ? process.argv[urlFlagIdx + 1] : DEFAULT_URL;

if (!targetUrl) {
  console.error("Error: --url flag provided but no URL value given.");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Chromium executable path (mirrors playwright.config.ts detection)
// ---------------------------------------------------------------------------

let chromiumExecutablePath;
if (!process.env.CI) {
  // Cross-platform Chromium detection — no `which` (unavailable on Windows).
  // `delimiter` is ":" on POSIX, ";" on Windows.
  // `sep` is "/" on POSIX, "\" on Windows.
  const exeSuffix = process.platform === "win32" ? ".exe" : "";
  const binaryNames = [
    `chromium${exeSuffix}`,
    `chromium-browser${exeSuffix}`,
    `chrome${exeSuffix}`,
  ];
  const pathDirs = (process.env.PATH ?? "").split(delimiter);
  const candidates = [
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    ...pathDirs.flatMap((d) => binaryNames.map((b) => `${d}${sep}${b}`)),
  ];
  chromiumExecutablePath = candidates.find((p) => !!p && existsSync(p));
}

// ---------------------------------------------------------------------------
// Capture
// ---------------------------------------------------------------------------

console.log(`Capturing screenshot of ${targetUrl}`);
console.log(`Output: ${OUTPUT_PATH}`);

// Ensure docs/ exists (it should, but be safe).
mkdirSync(dirname(OUTPUT_PATH), { recursive: true });

const browser = await chromium.launch({
  headless: true,
  ...(chromiumExecutablePath ? { executablePath: chromiumExecutablePath } : {}),
});

const page = await browser.newPage();
await page.setViewportSize(VIEWPORT);

try {
  // Navigate and wait for network idle so Mermaid's async rendering finishes.
  await page.goto(targetUrl, { waitUntil: "networkidle", timeout: 60_000 });

  // Give any post-load JS animations a moment to settle (SVG pan/zoom etc).
  await page.waitForTimeout(1500);

  // Save as JPEG at quality 90 — matches the existing docs screenshot format.
  await page.screenshot({ path: OUTPUT_PATH, type: "jpeg", quality: 90 });

  console.log("Screenshot saved.");
} finally {
  await browser.close();
}
