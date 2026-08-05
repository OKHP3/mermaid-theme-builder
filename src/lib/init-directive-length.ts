/**
 * init-directive-length.ts
 *
 * Pure utility for checking whether a generated %%{init}%% directive falls
 * within a renderer's known safe length ceiling.
 *
 * Background
 * ----------
 * Mermaid's own parser imposes no length ceiling on %%{init}%% directives —
 * confirmed by scripts/measure-init-directive-lengths.mjs across Mermaid
 * 8.14.x, 10.5.x, and 11.x.  Limits are renderer-specific: they arise from
 * HTTP payload restrictions, markdown pre-processor truncation, or backend
 * rendering pipeline constraints in each host platform.
 *
 * Ceiling values on RendererProfile.initDirectiveSafeLength:
 *   - number:       field-observed or documented limit.  Directives longer
 *                   than this value have been seen to fail or be silently
 *                   stripped on that renderer.
 *   - "unlimited":  local/reference renderer; no pipeline length constraint.
 *   - "unverified": no field data; limit unknown.  No advisory is raised, but
 *                   the user should validate manually for long directives.
 */

import type { RendererProfile } from "@/data/renderer-parity";

// ─── Types ───────────────────────────────────────────────────────────────────

/** Outcome of a single directive-length check against a renderer profile. */
export interface InitDirectiveLengthCheck {
  /**
   * "ok":      directive is within the renderer's known safe ceiling (or the
   *            renderer is a local/reference renderer with no length concern).
   * "caution": directive exceeds the renderer's field-observed ceiling.
   *            The user should validate before publishing.
   * "unknown": renderer has no measured ceiling ("unverified").  No advisory
   *            is raised; the value is returned for callers that want to
   *            inspect the reason.
   */
  status: "ok" | "caution" | "unknown";
  /** Length of the directive string that was checked (in characters). */
  directiveLength: number;
  /** The ceiling value from the renderer profile. */
  ceiling: number | "unlimited" | "unverified";
  /** Human-readable short name of the renderer (for advisory messages). */
  rendererName: string;
}

// ─── Core function ────────────────────────────────────────────────────────────

/**
 * Check whether a generated %%{init}%% directive (identified by its character
 * length) falls within the given renderer's known safe ceiling.
 *
 * @param directiveLength  Character length of the %%{init}%% directive string.
 *   Use computeInitDirectiveLength() from @/lib/theme-engine to obtain this
 *   from a Palette + ExportOptions without generating the full themed output.
 * @param rendererProfile  The RendererProfile for the current export target.
 *
 * @returns InitDirectiveLengthCheck — call .status to decide whether to show
 *   an advisory.  Only "caution" warrants a user-facing message.
 *
 * @example
 * ```ts
 * const len = computeInitDirectiveLength(palette, family, look, fontSize);
 * const check = checkInitDirectiveLength(len, rendererProfile);
 * if (check.status === "caution") {
 *   advisories.push(`Directive too long for ${check.rendererName}`);
 * }
 * ```
 */
export function checkInitDirectiveLength(
  directiveLength: number,
  rendererProfile: RendererProfile
): InitDirectiveLengthCheck {
  const ceiling = rendererProfile.initDirectiveSafeLength;
  const rendererName = rendererProfile.shortName;

  if (ceiling === "unlimited") {
    return { status: "ok", directiveLength, ceiling, rendererName };
  }

  if (ceiling === "unverified") {
    return { status: "unknown", directiveLength, ceiling, rendererName };
  }

  // Numeric ceiling: directive is safe up to and including the ceiling.
  return {
    status: directiveLength > ceiling ? "caution" : "ok",
    directiveLength,
    ceiling,
    rendererName,
  };
}
