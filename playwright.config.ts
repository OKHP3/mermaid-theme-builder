import { defineConfig, devices } from "@playwright/test";
import { execSync } from "child_process";
import { existsSync } from "fs";

let chromiumExecutablePath: string | undefined;
if (!process.env.CI) {
  // Build a prioritised list of candidate paths and take the first that exists.
  // Using direct PATH scanning avoids spawning a shell (`which`) that may have a
  // different environment when Playwright evaluates this config in a subprocess.
  const candidates: (string | undefined)[] = [
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    // Check every directory on PATH for a `chromium` binary (covers Nix store entries).
    ...(process.env.PATH ?? "").split(":").map((d) => `${d}/chromium`),
  ];

  // Also try `which chromium` as a fallback in case PATH differs.
  try {
    candidates.push(execSync("which chromium", { encoding: "utf8" }).trim());
  } catch {
    // ignore — `which` may not be available
  }

  chromiumExecutablePath = candidates.find((p): p is string => !!p && existsSync(p));
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
    // Build a production bundle then serve it with `vite preview`.
    // CI pre-builds and pre-starts the server before invoking Playwright, so
    // reuseExistingServer:true lets it skip the command entirely in CI.
    command: `PORT=${PREVIEW_PORT} BASE_PATH=${PREVIEW_BASE} pnpm build && PORT=${PREVIEW_PORT} BASE_PATH=${PREVIEW_BASE} pnpm serve`,
    url: PREVIEW_URL,
    reuseExistingServer: true,
    timeout: 180_000,
  },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? PREVIEW_URL,
    actionTimeout: 15_000,
    trace: "on-first-retry",
    // Start every test with empty localStorage so tab-persistence state from
    // a previous run does not bleed into the next test.
    storageState: { cookies: [], origins: [] },
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        ...(chromiumExecutablePath
          ? {
              // In Playwright 1.44+ the default Chromium browser is the
              // headless shell; executablePath must be inside launchOptions
              // to override the resolved binary path.
              launchOptions: { executablePath: chromiumExecutablePath },
            }
          : {}),
      },
    },
  ],
});
