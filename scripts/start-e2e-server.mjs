#!/usr/bin/env node
/**
 * start-e2e-server.mjs — cross-platform webServer command for Playwright.
 *
 * Sets PORT and BASE_PATH using the Node.js process.env API — no POSIX
 * inline `VAR=val command` syntax — so this works on Windows cmd.exe /
 * PowerShell as well as Linux and macOS.
 *
 * Builds the production bundle synchronously, then spawns `pnpm serve` and
 * keeps this process alive so Playwright can make requests to the preview
 * server. The script exits with the same code as the serve process.
 *
 * playwright.config.ts references this as webServer.command:
 *   command: "node scripts/start-e2e-server.mjs"
 *
 * CI pre-builds and pre-starts the server before invoking Playwright, so
 * reuseExistingServer:true in playwright.config.ts skips this script
 * entirely in CI environments.
 *
 * Windows note: `pnpm` is provided as a .cmd shim on Windows and requires
 * shell mediation. `shell: true` is set conditionally so Linux/macOS
 * continue to spawn directly without an extra shell process.
 */

import { execSync, spawn } from "node:child_process";

const PREVIEW_PORT = 4173;
const PREVIEW_BASE = "/mermaid-theme-builder/";

// Set env vars in-process so both the build step and the serve step inherit
// them without any shell-specific syntax.
process.env.PORT = String(PREVIEW_PORT);
process.env.BASE_PATH = PREVIEW_BASE;

// On Windows, pnpm is a .cmd shim and requires shell mediation to resolve.
// On Linux/macOS, shell:false is preferred to avoid an extra sh process.
const isWin = process.platform === "win32";

console.log(
  `[e2e-server] Building production bundle (PORT=${PREVIEW_PORT}, BASE_PATH=${PREVIEW_BASE})…`
);
execSync("pnpm build", {
  stdio: "inherit",
  env: process.env,
  // execSync on Windows also needs the shell to resolve pnpm.cmd.
  ...(isWin ? { shell: true } : {}),
});

console.log("[e2e-server] Starting preview server…");
const serve = spawn("pnpm", ["serve"], {
  stdio: "inherit",
  env: process.env,
  // shell: true lets cmd.exe resolve pnpm.cmd on Windows.
  // On Linux/macOS shell is not needed.
  shell: isWin,
});

serve.on("error", (err) => {
  console.error("[e2e-server] Failed to start preview server:", err.message);
  process.exit(1);
});

serve.on("exit", (code) => {
  process.exit(code ?? 0);
});
