import { test, expect } from "@playwright/test";
import { createDefaultMyThemeSlot } from "../src/lib/my-theme-slots";
import { migrateSlotToProfile } from "../src/lib/governance-profile";
import { buildProfileShareUrl } from "../src/lib/profile-share";

const name = "Shared Launch Profile";
function shareUrl() {
  const profile = migrateSlotToProfile(
    { ...createDefaultMyThemeSlot(1), name },
    { rendererTarget: "github", outputFormat: "frontmatter" }
  );
  return buildProfileShareUrl(profile, "http://localhost:4173/mermaid-theme-builder/");
}
test("shared profiles require review, preserve the working theme, and remove the URL token", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(shareUrl());
  const dialog = page.getByRole("dialog", { name: "Review theme import" });
  await expect(dialog).toContainText(name);
  await expect.poll(() => new URL(page.url()).searchParams.get("profile")).toBeNull();
  await expect(page.getByRole("radio", { name: name + " Mine", exact: true })).toHaveCount(0);
  await dialog.getByRole("button", { name: "Import as copies" }).click();
  const tile = page.getByRole("radio", { name: name + " Mine", exact: true });
  await expect(tile).toBeVisible();
  await expect(tile).toHaveAttribute("aria-checked", "false");
  await tile.click();
  await expect(tile).toHaveAttribute("aria-checked", "true");
  await expect(page.getByLabel("Select target renderer")).toHaveValue("github");
  expect(errors).toEqual([]);
});
test("canceling a shared profile leaves the library unchanged", async ({ page }) => {
  await page.goto(shareUrl());
  await page
    .getByRole("dialog", { name: "Review theme import" })
    .getByRole("button", { name: "Cancel", exact: true })
    .click();
  await expect(page.getByRole("radio", { name: name + " Mine", exact: true })).toHaveCount(0);
});
test("malformed shared profiles show a dismissible error without creating a theme", async ({
  page,
}) => {
  await page.goto("./?profile=xyz#apply");
  const alert = page.getByRole("alert");
  await expect(alert).toContainText("Could not load shared profile");
  await expect(page.getByRole("radio", { name: name + " Mine", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Dismiss error" }).click();
  await expect(alert).toHaveCount(0);
});
