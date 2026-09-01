---
name: Direct Playwright smoke checks
description: How standalone browser checks should launch Chromium in this workspace.
---

Standalone Playwright scripts must launch Chromium using the executable discovered by the repository's browser-discovery helper rather than assuming the bundled Playwright browser exists.

**Why:** The repository's Chromium discovery check can pass using the system Nix Chromium while a direct `chromium.launch()` still fails because the bundled Playwright executable is not installed.

**How to apply:** For one-off live-site or network-interception checks, reuse the same discovery helper used by `playwright.config.ts` and pass its result as `executablePath`.