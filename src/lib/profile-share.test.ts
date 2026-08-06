/**
 * Tests for profile-share encode/decode utilities.
 */

import { describe, it, expect } from "vitest";
import {
  encodeProfileToken,
  decodeProfileToken,
  buildProfileShareUrl,
  PROFILE_SHARE_PARAM,
} from "./profile-share";
import { createGovernanceProfile } from "./governance-profile";
import { BRAND_PALETTES } from "./palettes";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const NOW = "2024-06-01T12:00:00.000Z";

const testProfile = createGovernanceProfile(
  {
    id: "my-theme-1",
    name: "Ocean Depth",
    description: "A blue-green oceanic palette",
    colors: BRAND_PALETTES[0].colors,
    look: "neo",
    fontSize: "14px",
    rendererTarget: "github",
    outputFormat: "frontmatter",
  },
  NOW
);

// ─── Round-trip ───────────────────────────────────────────────────────────────

describe("encodeProfileToken / decodeProfileToken", () => {
  it("round-trips a complete profile without data loss", () => {
    const token = encodeProfileToken(testProfile);
    const result = decodeProfileToken(token);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const { profile } = result;
    expect(profile.name).toBe(testProfile.name);
    expect(profile.description).toBe(testProfile.description);
    expect(profile.look).toBe(testProfile.look);
    expect(profile.fontSize).toBe(testProfile.fontSize);
    expect(profile.rendererTarget).toBe(testProfile.rendererTarget);
    expect(profile.outputFormat).toBe(testProfile.outputFormat);
    expect(profile.colors).toHaveLength(testProfile.colors.length);
    for (let i = 0; i < testProfile.colors.length; i++) {
      expect(profile.colors[i].key).toBe(testProfile.colors[i].key);
      expect(profile.colors[i].value).toBe(testProfile.colors[i].value);
    }
  });

  it("preserves createdAt and updatedAt through encode/decode", () => {
    const token = encodeProfileToken(testProfile);
    const result = decodeProfileToken(token);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.profile.createdAt).toBe(NOW);
    expect(result.profile.updatedAt).toBe(NOW);
  });

  it("produces a URL-safe token (no +, /, or = characters)", () => {
    const token = encodeProfileToken(testProfile);
    expect(token).not.toMatch(/[+/=]/);
  });

  it("produces a non-empty token", () => {
    const token = encodeProfileToken(testProfile);
    expect(token.length).toBeGreaterThan(0);
  });
});

// ─── Decode failure paths ─────────────────────────────────────────────────────

describe("decodeProfileToken — failure paths", () => {
  it("returns ok:false for a completely garbled token", () => {
    const result = decodeProfileToken("not-a-valid-token!!!!");
    expect(result.ok).toBe(false);
  });

  it("returns ok:false for valid base64 that is not a governance profile", () => {
    const notAProfile = { hello: "world", something: 42 };
    const json = JSON.stringify(notAProfile);
    const bytes = new TextEncoder().encode(json);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    const b64url = btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const result = decodeProfileToken(b64url);
    // parseGovernanceProfile rejects objects without the correct `type` field.
    expect(result.ok).toBe(false);
  });

  it("returns ok:false for a truncated token", () => {
    const token = encodeProfileToken(testProfile);
    const truncated = token.slice(0, 20);
    const result = decodeProfileToken(truncated);
    // A truncated base64 blob will either fail to decode or fail JSON parsing.
    expect(result.ok).toBe(false);
  });

  it("returns ok:false for an empty string", () => {
    const result = decodeProfileToken("");
    expect(result.ok).toBe(false);
  });
});

// ─── buildProfileShareUrl ────────────────────────────────────────────────────

describe("buildProfileShareUrl", () => {
  it("includes the profile param in the returned URL", () => {
    const url = buildProfileShareUrl(testProfile, "https://example.com/app");
    const parsed = new URL(url);
    expect(parsed.searchParams.has(PROFILE_SHARE_PARAM)).toBe(true);
  });

  it("the profile param decodes back to the original profile", () => {
    const url = buildProfileShareUrl(testProfile, "https://example.com/app#compose");
    const parsed = new URL(url);
    const token = parsed.searchParams.get(PROFILE_SHARE_PARAM)!;
    const result = decodeProfileToken(token);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.profile.name).toBe(testProfile.name);
    expect(result.profile.id).toBe(testProfile.id);
  });

  it("preserves the base URL path and hash", () => {
    const base = "https://example.com/my-app#compose";
    const url = buildProfileShareUrl(testProfile, base);
    const parsed = new URL(url);
    expect(parsed.pathname).toBe("/my-app");
    expect(parsed.hash).toBe("#compose");
  });

  it("does not include a '?profile=null' or empty param", () => {
    const url = buildProfileShareUrl(testProfile, "https://example.com/");
    expect(url).not.toContain("profile=null");
    expect(url).not.toContain("profile=undefined");
    expect(url).not.toContain("profile=");
  });

  it("round-trip URL: encode via buildProfileShareUrl then decode preserves all fields", () => {
    const url = buildProfileShareUrl(testProfile, "https://example.com/");
    const parsed = new URL(url);
    const token = parsed.searchParams.get(PROFILE_SHARE_PARAM)!;
    const result = decodeProfileToken(token);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.profile.createdAt).toBe(testProfile.createdAt);
    expect(result.profile.updatedAt).toBe(testProfile.updatedAt);
    expect(result.profile.colors).toHaveLength(testProfile.colors.length);
  });
});
