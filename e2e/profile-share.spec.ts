/**
 * End-to-end coverage for GovernanceProfile share-link bootstrap.
 *
 * A profile share URL is decoded during AppShell hydration, imported into the
 * first available My Theme slot, activated, and removed from the address bar.
 */

import { test, expect, type Page } from "@playwright/test";
import { createDefaultMyThemeSlot } from "../src/lib/my-theme-slots";
import { migrateSlotToProfile } from "../src/lib/governance-profile";
import { buildProfileShareUrl } from "../src/lib/profile-share";

const APPLY_PREFIX = "apply-palette-tile";
const SHARED_PROFILE_NAME = "Shared Launch Profile";

function buildShareUrl(): string {
  const sourceSlot = {
    ...createDefaultMyThemeSlot(1),
    name: SHARED_PROFILE_NAME,
  };
  const profile = migrateSlotToProfile(
    sourceSlot,
    { rendererTarget: "github", outputFormat: "frontmatter" },
    "2026-08-20T12:00:00.000Z"
  );
  return buildProfileShareUrl(profile, "http://localhost:4173/mermaid-theme-builder/");
}

async function openSharedProfile(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem("mtb.firstVisit", "true");
    sessionStorage.clear();
  });
  await page.goto(buildShareUrl());
  await page.waitForLoadState("load");
}

test.describe("Profile share URL bootstrap", () => {
  test("creates the shared profile slot and removes profile from the address bar", async ({
    page,
  }) => {
    await openSharedProfile(page);

    const sharedTile = page.locator(`#${APPLY_PREFIX}-my-theme-2`);
    await expect(sharedTile).toHaveAttribute("title", SHARED_PROFILE_NAME, { timeout: 8_000 });
    await expect(sharedTile).toBeVisible();
    await expect
      .poll(() => new URL(page.url()).searchParams.get("profile"), { timeout: 4_000 })
      .toBeNull();
  });

  test("auto-activates the newly created shared profile slot", async ({ page }) => {
    await openSharedProfile(page);

    const sharedTile = page.locator(`#${APPLY_PREFIX}-my-theme-2`);
    await expect(sharedTile).toHaveAttribute("aria-checked", "true", { timeout: 8_000 });
    await expect(page.locator(`#${APPLY_PREFIX}-my-theme-1`)).toHaveAttribute(
      "aria-checked",
      "false"
    );
  });

  test("shows a dismissible error for a malformed profile without creating a slot", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.clear();
      localStorage.setItem("mtb.firstVisit", "true");
      sessionStorage.clear();
    });
    await page.goto("/?profile=xyz");
    await page.waitForLoadState("load");

    const alert = page.getByRole("alert");
    await expect(alert).toContainText("Could not load shared profile", { timeout: 8_000 });
    await expect(page.locator(`#${APPLY_PREFIX}-my-theme-1`)).toBeVisible();
    await expect(page.locator(`#${APPLY_PREFIX}-my-theme-2`)).toHaveCount(0);

    await page.getByRole("button", { name: "Dismiss error" }).click();
    await expect(alert).toHaveCount(0);
  });
});
