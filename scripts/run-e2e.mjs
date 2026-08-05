#!/usr/bin/env node
/**
 * run-e2e.mjs — cross-platform E2E test runner entry point.
 *
 * On Linux / macOS / CI: delegates to run-e2e.sh, which sets up NixOS-specific
 * LD_LIBRARY_PATH entries that Playwright's bundled headless Chromium needs on
 * Replit / NixOS. That setup is a POSIX-only concern; no equivalent is needed
 * on Windows.
 *
 * On Windows: invokes `pnpm exec playwright test` directly via the shell so
 * that Windows can resolve pnpm.cmd and Playwright's cmd shim without needing
 * bash or WSL. `shell: true` is intentional and scoped to the Windows branch.
 *
 * Extra CLI arguments (e.g. --grep, --reporter) are forwarded in both cases.
 *
 * Usage: `node scripts/run-e2e.mjs [playwright-args...]`
 * Invoked via `pnpm test:e2e`.
 */

import { spawn } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const extraArgs = process.argv.slice(2);

let child;

if (process.platform === "win32") {
  // Windows: run `pnpm exec playwright test` through the shell so that
  // cmd.exe can resolve pnpm.cmd and Playwright's own .cmd shim.
  // Using the array form avoids manual argument escaping; the shell handles it.
  child = spawn(
    "pnpm",
    ["exec", "playwright", "test", "--config", "playwright.config.ts", ...extraArgs],
    {
      stdio: "inherit",
      // shell: true is required on Windows to resolve .cmd executables such as
      // pnpm.cmd. On Linux/macOS this branch is never reached.
      shell: true,
    }
  );
} else {
  // Linux / macOS / CI: delegate to the shell script for NixOS compatibility.
  child = spawn("bash", [resolve(__dirname, "run-e2e.sh"), ...extraArgs], {
    stdio: "inherit",
    shell: false,
  });
}

child.on("error", (err) => {
  process.stderr.write(`E2E runner error: ${err.message}\n`);
  process.exit(1);
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
