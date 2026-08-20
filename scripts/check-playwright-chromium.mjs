import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { chmod, mkdir, mkdtemp, readFile, rm, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { findChromiumExecutablePath } from "./find-chromium.mjs";

const tempRoot = await mkdtemp(join(tmpdir(), "mermaid-theme-builder-chromium-"));
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const executableSuffix = process.platform === "win32" ? ".exe" : "";
const discoveredChromium = findChromiumExecutablePath();
const installedChromium = chromium.executablePath();
const smokeChromium = discoveredChromium ?? installedChromium;

function run(command, args, options) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(command, args, options);
    let output = "";

    child.stdout.on("data", (chunk) => {
      output += chunk;
    });
    child.stderr.on("data", (chunk) => {
      output += chunk;
    });
    child.on("error", rejectRun);
    child.on("close", (code) => {
      if (code === 0) {
        resolveRun(output);
      } else {
        rejectRun(
          new Error(`Playwright config smoke test failed with exit code ${code}:\n${output}`)
        );
      }
    });
  });
}

try {
  const overridePath = join(tempRoot, `override-chromium${executableSuffix}`);
  const pathChromium = join(tempRoot, "bin", `chromium${executableSuffix}`);
  const pathChrome = join(tempRoot, "bin", `chrome${executableSuffix}`);

  await mkdir(join(tempRoot, "bin"));
  await writeFile(overridePath, "");
  await writeFile(pathChromium, "");
  await writeFile(pathChrome, "");
  if (process.platform !== "win32") {
    await chmod(overridePath, 0o755);
    await chmod(pathChromium, 0o755);
    await chmod(pathChrome, 0o755);
  }

  assert.equal(
    findChromiumExecutablePath({
      env: {
        PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH: overridePath,
        PATH: join(tempRoot, "bin"),
      },
    }),
    overridePath,
    "the explicit executable path must take priority over PATH"
  );

  assert.equal(
    findChromiumExecutablePath({
      env: { PATH: join(tempRoot, "bin") },
    }),
    pathChromium,
    "PATH scanning must prefer chromium over later browser names"
  );

  assert.equal(
    findChromiumExecutablePath({
      env: { PATH: join(tempRoot, "missing") },
    }),
    undefined,
    "missing override and PATH entries must leave the bundled browser in use"
  );

  assert.ok(
    smokeChromium && existsSync(smokeChromium),
    `No usable Chromium was found. Install Playwright Chromium or set PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH before running this check. Checked: ${smokeChromium}`
  );

  const smokeSpecPath = join(projectRoot, "e2e", ".playwright-chromium-config-smoke.spec.mjs");
  const markerPath = join(tempRoot, "configured-chromium-launched");
  let configuredExecutablePath = smokeChromium;

  if (process.platform !== "win32") {
    configuredExecutablePath = join(tempRoot, "chromium-launch-wrapper");
    await writeFile(
      configuredExecutablePath,
      [
        "#!/bin/sh",
        'printf "configured system Chromium launched" > "$PLAYWRIGHT_CONFIG_SMOKE_MARKER"',
        'exec "$PLAYWRIGHT_CONFIG_SMOKE_REAL_CHROMIUM" "$@"',
        "",
      ].join("\n")
    );
    await chmod(configuredExecutablePath, 0o755);
  }

  await writeFile(
    smokeSpecPath,
    [
      'import { expect, test } from "@playwright/test";',
      "",
      "test('uses the configured Chromium executable', async ({ page }, testInfo) => {",
      "  expect(testInfo.project.use.launchOptions?.executablePath).toBe(",
      "    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH",
      "  );",
      '  await page.goto("data:text/html,<title>Chromium config smoke</title>");',
      '  await expect(page).toHaveTitle("Chromium config smoke");',
      "});",
      "",
    ].join("\n")
  );

  try {
    await run(
      process.platform === "win32" ? "pnpm.cmd" : "pnpm",
      [
        "exec",
        "playwright",
        "test",
        smokeSpecPath,
        "--project=chromium",
        "--workers=1",
        "--reporter=line",
      ],
      {
        cwd: projectRoot,
        env: {
          ...process.env,
          CI: "",
          PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH: configuredExecutablePath,
          PLAYWRIGHT_CONFIG_SMOKE_MARKER: markerPath,
          PLAYWRIGHT_CONFIG_SMOKE_REAL_CHROMIUM: smokeChromium,
        },
      }
    );
  } finally {
    await unlink(smokeSpecPath).catch(() => {});
  }

  if (process.platform !== "win32") {
    assert.equal(
      (await readFile(markerPath, "utf8")).trim(),
      "configured system Chromium launched",
      "Playwright did not launch the executable selected by launchOptions.executablePath"
    );
  }

  console.log("Playwright Chromium discovery and config launch smoke check passed.");
} finally {
  await rm(tempRoot, { recursive: true, force: true });
}
