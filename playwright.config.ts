import { defineConfig, devices } from "@playwright/test";
import { existsSync } from "fs";
import { delimiter, sep } from "path";

let chromiumExecutablePath: string | undefined;
if (!process.env.CI) {
  // Build a prioritised list of candidate paths and take the first that exists.
  //
  // Using direct PATH scanning avoids spawning a shell (`which`) that may not
  // be available on all platforms (Windows cmd.exe / PowerShell do not have
  // `which`). On Windows executables carry a .exe suffix; on POSIX they do not.
  //
  // `delimiter` is ":" on POSIX, ";" on Windows.
  // `sep` is "/" on POSIX, "\" on Windows.
  const exeSuffix = process.platform === "win32" ? ".exe" : "";
  const binaryNames = [
    `chromium${exeSuffix}`,
    `chromium-browser${exeSuffix}`,
    `chrome${exeSuffix}`,
  ];
  const pathDirs = (process.env.PATH ?? "").split(delimiter);

  const candidates: (string | undefined)[] = [
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    // Check every directory on PATH for known Chromium binary names.
    ...pathDirs.flatMap((d) => binaryNames.map((b) => `${d}${sep}${b}`)),
  ];

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
