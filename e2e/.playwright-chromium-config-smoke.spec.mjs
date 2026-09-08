import { expect, test } from "@playwright/test";

test('uses the configured Chromium executable', async ({ page }, testInfo) => {
  expect(testInfo.project.use.launchOptions?.executablePath).toBe(
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
  );
  await page.goto("data:text/html,<title>Chromium config smoke</title>");
  await expect(page).toHaveTitle("Chromium config smoke");
});
