import { defineConfig, devices } from "@playwright/test";
import { findChromiumExecutablePath } from "./scripts/find-chromium.mjs";

let chromiumExecutablePath: string | undefined;
if (!process.env.CI) {
  chromiumExecutablePath = findChromiumExecutablePath();
  if (!chromiumExecutablePath) {
    console.warn(
      "[Playwright] No system Chromium found; using the bundled browser. " +
        "Run `pnpm check:playwright-chromium` to verify discovery."
    );
  }
}

// Production-build preview server port — matches the CI workflow env.
// Using a dedicated port keeps the test server separate from the dev server
// (port 18624) so `pnpm test:e2e` does not interfere with live development.
const PREVIEW_PORT = 4173;
const PREVIEW_BASE = "/mermaid-theme-builder/";
const PREVIEW_URL = `http://localhost:${PREVIEW_PORT}${PREVIEW_BASE}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "list",
  webServer: {
    // Cross-platform build + preview server via a Node script.
    // ENV vars (PORT, BASE_PATH) are set inside the script using the Node API
    // rather than POSIX inline `VAR=val command` syntax so this works on
    // Windows as well as Linux / macOS.
    //
    // CI pre-builds and pre-starts the server before invoking Playwright, so
    // reuseExistingServer:true lets it skip the command entirely in CI.
    command: "node scripts/start-e2e-server.mjs",
    url: PREVIEW_URL,
    reuseExistingServer: true,
    timeout: 180_000,
  },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? PREVIEW_URL,
    actionTimeout: 15_000,
    trace: "on-first-retry",
    // Start every test with the first-visit key pre-seeded so the route selector
    // never blocks specs that do not explicitly test it.  Specs that call
    // localStorage.clear() in their addInitScript MUST also re-set this key
    // after the clear (or the selector will re-appear).  The route-selector.spec
    // tests manage the key themselves via their seedState helper.
    storageState: {
      cookies: [],
      origins: [
        {
          origin: "http://localhost:4173",
          localStorage: [{ name: "mtb.firstVisit", value: "true" }],
        },
      ],
    },
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        ...(chromiumExecutablePath
          ? {
              // Playwright 1.44 changed Chromium's default executable to the
              // headless shell. Keep executablePath inside launchOptions:
              // Playwright Test passes use.launchOptions to browserType.launch;
              // a top-level use.executablePath is ignored. Verify discovery
              // with: pnpm check:playwright-chromium
              launchOptions: { executablePath: chromiumExecutablePath },
            }
          : {}),
      },
    },
  ],
});
