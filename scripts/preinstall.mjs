#!/usr/bin/env node
/**
 * preinstall.mjs — cross-platform preinstall guard.
 *
 * Replaces the `sh -c '...'` preinstall in package.json so the guard runs on
 * Windows (cmd.exe / PowerShell) as well as Linux and macOS.
 *
 * What it does:
 *  1. Removes package-lock.json and yarn.lock to prevent accidental mixed
 *     installs from other package managers.
 *  2. Enforces pnpm — exits with an error if another package manager is used.
 */

import { existsSync, unlinkSync } from "node:fs";

for (const file of ["package-lock.json", "yarn.lock"]) {
  try {
    if (existsSync(file)) unlinkSync(file);
  } catch {
    // Ignore — file may already be absent or not writable.
  }
}

const agent = process.env.npm_config_user_agent ?? "";
if (!agent.startsWith("pnpm/")) {
  process.stderr.write("Use pnpm instead\n");
  process.exit(1);
}
