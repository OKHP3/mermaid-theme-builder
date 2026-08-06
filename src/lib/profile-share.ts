/**
 * profile-share — client-side encode / decode for GovernanceProfile share URLs.
 *
 * Encoding: JSON-serialise the profile via profileToPortableJson, UTF-8 encode
 * the result, then base64url-encode the bytes (URL-safe, no padding).
 *
 * The URL parameter name is "profile" — distinct from the legacy "theme" param
 * used for palette-only shares.
 *
 * No server-side storage or short-URL service is involved; the profile is fully
 * embedded in the URL.  Links may be long (~2–4 KB) but are always valid URLs.
 */

import {
  profileToPortableJson,
  parseGovernanceProfile,
  type GovernanceProfile,
  type GovernanceProfileImport,
  type GovernanceProfileImportError,
} from "./governance-profile";

// ─── URL parameter name ───────────────────────────────────────────────────────

export const PROFILE_SHARE_PARAM = "profile" as const;

// ─── Base64url helpers ────────────────────────────────────────────────────────

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  const b64 =
    typeof btoa !== "undefined" ? btoa(binary) : Buffer.from(binary, "binary").toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(s: string): Uint8Array {
  // Re-pad: the original length modulo 4 determines how many "=" are needed.
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const binary =
    typeof atob !== "undefined" ? atob(b64) : Buffer.from(b64, "base64").toString("binary");
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// ─── Token encode / decode ───────────────────────────────────────────────────

/**
 * Encode a GovernanceProfile into a URL-safe base64 token.
 * Use `buildProfileShareUrl` to get the full shareable URL.
 */
export function encodeProfileToken(profile: GovernanceProfile): string {
  const json = profileToPortableJson(profile);
  const bytes = new TextEncoder().encode(json);
  return bytesToBase64Url(bytes);
}

export type ProfileTokenResult = GovernanceProfileImport | GovernanceProfileImportError;

/**
 * Decode a raw base64url token back into a GovernanceProfile.
 * Returns `{ ok: true, profile, warnings }` on success, or
 * `{ ok: false, error }` when the token cannot be decoded or parsed.
 */
export function decodeProfileToken(token: string): ProfileTokenResult {
  try {
    const bytes = base64UrlToBytes(token);
    const json = new TextDecoder().decode(bytes);
    return parseGovernanceProfile(json);
  } catch (err) {
    return {
      ok: false,
      error: `Could not decode share token: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

// ─── URL helpers ─────────────────────────────────────────────────────────────

/**
 * Build a full shareable URL containing the encoded profile.
 * `baseHref` defaults to `window.location.href` and can be overridden for
 * testing or server-side rendering.
 */
export function buildProfileShareUrl(profile: GovernanceProfile, baseHref?: string): string {
  const href =
    baseHref ?? (typeof window !== "undefined" ? window.location.href : "https://example.com");
  const url = new URL(href);
  url.searchParams.set(PROFILE_SHARE_PARAM, encodeProfileToken(profile));
  return url.toString();
}

/**
 * Read the profile share token from the current URL.
 * Returns the raw token string, or null when the param is absent.
 */
export function readProfileShareToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const url = new URL(window.location.href);
    return url.searchParams.get(PROFILE_SHARE_PARAM);
  } catch {
    return null;
  }
}

/**
 * Remove the profile share param from the URL using `history.replaceState`
 * so the link isn't re-imported on page refresh.
 */
export function clearProfileShareToken(): void {
  if (typeof window === "undefined") return;
  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has(PROFILE_SHARE_PARAM)) return;
    url.searchParams.delete(PROFILE_SHARE_PARAM);
    window.history.replaceState({}, "", url.toString());
  } catch {
    // ignore — replaceState is best-effort
  }
}

// ─── Clipboard helper ─────────────────────────────────────────────────────────

/**
 * Write `text` to the system clipboard.  Falls back to the deprecated
 * `execCommand` path for browsers that block `navigator.clipboard`.
 */
export async function writeToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const el = document.createElement("textarea");
    el.value = text;
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
  }
}
