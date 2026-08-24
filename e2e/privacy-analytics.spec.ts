import { expect, test } from "@playwright/test";

type PlausibleEvent = {
  n: string;
  v: number;
  u: string;
  d: string;
  r: null;
};

test("Plausible sends exactly one sanitized pageview", async ({ page }) => {
  const events: Array<{
    payload: PlausibleEvent;
    headers: Record<string, string>;
  }> = [];

  await page.route("https://plausible.io/api/event", async (route) => {
    events.push({
      payload: JSON.parse(route.request().postData() ?? "{}") as PlausibleEvent,
      headers: route.request().headers(),
    });
    await route.fulfill({ status: 202, body: "" });
  });

  await page.goto("/?private-query=diagram-secret#shared-palette-payload");

  await expect.poll(() => events).toHaveLength(1);
  await page.waitForTimeout(250);
  expect(events).toHaveLength(1);

  const [{ payload, headers }] = events;
  expect(payload).toEqual({
    n: "pageview",
    v: 36,
    u: "http://localhost:4173/mermaid-theme-builder/",
    d: "okhp3.github.io",
    r: null,
  });
  expect(headers.referer).toBeUndefined();
  expect(headers.cookie).toBeUndefined();
  expect(JSON.stringify({ payload, headers })).not.toContain("private-query");
  expect(JSON.stringify({ payload, headers })).not.toContain("shared-palette-payload");
});
