import { expect, test } from "@playwright/test";

type PlausibleEvent = {
  n: string;
  u: string;
};

test("Plausible sends exactly one sanitized pageview", async ({ page }) => {
  const events: PlausibleEvent[] = [];

  await page.addInitScript(() => {
    // Plausible suppresses events from automation clients unless this flag is set.
    (window as Window & { __plausible?: boolean }).__plausible = true;
  });

  await page.route("https://plausible.io/js/script.manual.js", async (route) => {
    const response = await route.fetch();
    const script = await response.text();
    const localhostGuard = 'return m(o,g,"localhost")';

    if (!script.includes(localhostGuard)) {
      throw new Error("Plausible manual tracker no longer contains its localhost guard.");
    }

    // Keep the production manual tracker intact while allowing this local E2E
    // server to observe the request that Plausible normally suppresses.
    await route.fulfill({
      response,
      body: script.replace(localhostGuard, "void 0"),
    });
  });

  await page.route("https://plausible.io/api/event", async (route) => {
    events.push(JSON.parse(route.request().postData() ?? "{}") as PlausibleEvent);
    await route.fulfill({ status: 202, body: "" });
  });

  await page.goto("/?private-query=diagram-secret#shared-palette-payload");

  await expect.poll(() => events).toHaveLength(1);
  await page.waitForTimeout(250);
  expect(events).toHaveLength(1);

  const [event] = events;
  expect(event.n).toBe("pageview");
  expect(event.u).toBe("http://localhost:4173/mermaid-theme-builder/");
  expect(event.u).not.toContain("private-query");
  expect(event.u).not.toContain("shared-palette-payload");
});
