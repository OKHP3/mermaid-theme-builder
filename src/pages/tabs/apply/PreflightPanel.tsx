/**
 * PreflightPanel — consolidated compatibility preflight report.
 *
 * Replaces the previous scattered advisory banners with a single structured
 * report that shows all known issues for the current family + renderer
 * combination, with actionable resolution pointers for each item.
 *
 * Usage: drop in place of RenderWarningSection + WarningBanner + CapabilityNote.
 */

import { useState } from "react";
import type { DiagramCapability, DiagramFamily } from "@/data/mermaid-capabilities";
import { MERMAID_VERSION_VERIFIED } from "@/data/mermaid-capabilities";
import type { RendererProfile } from "@/data/renderer-parity";
import { getRendererDefaultOutputFormat } from "@/data/renderer-parity";
import type { MermaidLook } from "@/lib/theme-engine";
import { CLASSDEF_CAPABLE_FAMILIES } from "@/lib/theme-engine";
import { FamilySyntaxHint } from "@/components/FamilySyntaxHint";
import type { Palette } from "@/lib/palettes";

// ─── Public types ─────────────────────────────────────────────────────────────

export interface PreflightItem {
  /** "preserved" = works as expected, "degraded" = partial/approximate, "unsupported" = blocked */
  status: "preserved" | "degraded" | "unsupported";
  feature: string;
  detail: string;
  /** When set, names the specific control to change to resolve this issue. */
  actionLabel?: string;
}

export interface PreflightReport {
  family: DiagramFamily;
  familyLabel: string;
  rendererLabel: string | null;
  /** Overall confidence in this family + renderer combination. */
  confidence: DiagramCapability["themeConfidence"] | "not-applicable";
  items: PreflightItem[];
  /** Recommended output format for this renderer, or null when no renderer is selected. */
  suggestedFormat: "init-directive" | "frontmatter" | null;
  hasIssues: boolean;
}

// ─── Report builder (pure, synchronous) ──────────────────────────────────────

/**
 * Build a structured PreflightReport from capability + renderer signals.
 * Pure function — no side effects, safe to call in a render/memo.
 */
export function buildPreflightReport(opts: {
  family: DiagramFamily;
  capability: DiagramCapability | null;
  rendererProfile: RendererProfile | undefined;
  look: MermaidLook;
  selectedPalette: Palette;
  outputFormat: "init-directive" | "frontmatter";
}): PreflightReport {
  const { family, capability, rendererProfile, look, selectedPalette, outputFormat } = opts;
  const items: PreflightItem[] = [];
  let hasIssues = false;

  // ── 1. Theme-variable coverage ──────────────────────────────────────────
  const confidence = capability?.themeConfidence ?? "not-applicable";
  switch (confidence) {
    case "high":
      items.push({
        status: "preserved",
        feature: "Theme colors",
        detail: "Full themeVariable coverage — all palette colors apply as expected.",
      });
      break;
    case "medium":
      items.push({
        status: "degraded",
        feature: "Theme colors",
        detail:
          "Partial coverage — primary / secondary / tertiary colors apply; some diagram-specific elements may use Mermaid's internal defaults.",
      });
      hasIssues = true;
      break;
    case "generic-only":
      items.push({
        status: "degraded",
        feature: "Theme colors",
        detail:
          "Background and text colors apply; diagram-specific fills (bars, slices, branches) use Mermaid's internal palette and cannot be overridden via themeVariables.",
      });
      hasIssues = true;
      break;
    case "low":
    case "not-applicable":
      items.push({
        status: "unsupported",
        feature: "Theme colors",
        detail: "Theme variables do not apply to this diagram type.",
      });
      hasIssues = true;
      break;
  }

  // ── 2. classDef support ─────────────────────────────────────────────────
  if (CLASSDEF_CAPABLE_FAMILIES.includes(family)) {
    const cdSupported = capability?.supportsClassDef ?? false;
    items.push({
      status: cdSupported ? "preserved" : "degraded",
      feature: "Per-node color classes (classDef)",
      detail: cdSupported
        ? "classDef fully supported — per-node color overrides work as expected."
        : "classDef is not supported for this diagram type; palette-level theming only.",
    });
    if (!cdSupported) hasIssues = true;
  }

  // ── 3. Look support ─────────────────────────────────────────────────────
  if (look !== "classic") {
    const supportedLooks = capability?.supportedLooks ?? [];
    const lookOk = supportedLooks.length === 0 || supportedLooks.includes(look);
    const lookLabel = look === "neo" ? "Neo" : "Hand Drawn";
    items.push({
      status: lookOk ? "preserved" : "unsupported",
      feature: `Look: ${lookLabel}`,
      detail: lookOk
        ? `'${lookLabel}' look is supported for ${capability?.displayName ?? family}.`
        : `'${lookLabel}' look is NOT supported for ${capability?.displayName ?? family}.`,
      actionLabel: lookOk ? undefined : "Look picker → Classic",
    });
    if (!lookOk) hasIssues = true;
  }

  // ── 4. Renderer-specific checks ─────────────────────────────────────────
  if (rendererProfile) {
    // init directive support
    if (rendererProfile.initDirectiveSupport !== "full" && outputFormat === "init-directive") {
      const blocked = rendererProfile.initDirectiveSupport === "none";
      items.push({
        status: blocked ? "unsupported" : "degraded",
        feature: `%%{init}%% on ${rendererProfile.shortName}`,
        detail: blocked
          ? `${rendererProfile.shortName} does not support %%{init}%% — theme colors will not apply.`
          : `${rendererProfile.shortName} has partial %%{init}%% support — some colors may differ.`,
        actionLabel: "Format toggle → YAML (if supported by this renderer)",
      });
      hasIssues = true;
    }

    // themeVariable support
    if (rendererProfile.themeVariableSupport !== "full") {
      items.push({
        status: rendererProfile.themeVariableSupport === "none" ? "unsupported" : "degraded",
        feature: `Theme variables on ${rendererProfile.shortName}`,
        detail: `Only a subset of themeVariables are applied on ${rendererProfile.shortName}.`,
      });
      hasIssues = true;
    }

    // custom font
    const hasCustomFont = selectedPalette.colors.some(
      (c) => c.key === "fontFamily" && c.value.trim()
    );
    if (hasCustomFont && rendererProfile.customFontSupport === "none") {
      items.push({
        status: "unsupported",
        feature: `Custom font on ${rendererProfile.shortName}`,
        detail: `Custom fontFamily is blocked — ${rendererProfile.shortName} applies its own system font stack.`,
        actionLabel: "Compose → Colors → fontFamily (remove custom font)",
      });
      hasIssues = true;
    }

    // classDef on renderer
    if (
      CLASSDEF_CAPABLE_FAMILIES.includes(family) &&
      capability?.supportsClassDef &&
      rendererProfile.classDefSupport !== "full"
    ) {
      items.push({
        status: rendererProfile.classDefSupport === "none" ? "unsupported" : "degraded",
        feature: `classDef on ${rendererProfile.shortName}`,
        detail: `classDef node styles may render differently on ${rendererProfile.shortName} — validate before publishing.`,
      });
      hasIssues = true;
    }
  }

  // ── 5. Mermaid version note (always preserved) ──────────────────────────
  items.push({
    status: "preserved",
    feature: "Mermaid version",
    detail: `Verified against Mermaid ${MERMAID_VERSION_VERIFIED}. Output uses ${
      outputFormat === "frontmatter" ? "YAML frontmatter (v10.5+)" : "%%{init}%% directive (v9+)"
    }.`,
  });

  // ── Suggested format ─────────────────────────────────────────────────────
  const suggestedFormat = rendererProfile
    ? getRendererDefaultOutputFormat(rendererProfile.id)
    : null;

  return {
    family,
    familyLabel: capability?.displayName ?? family,
    rendererLabel: rendererProfile?.shortName ?? null,
    confidence,
    items,
    suggestedFormat,
    hasIssues,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

function StatusIcon({ status }: { status: PreflightItem["status"] }) {
  if (status === "preserved")
    return (
      <svg
        viewBox="0 0 16 16"
        fill="currentColor"
        className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5"
      >
        <path
          fillRule="evenodd"
          d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"
          clipRule="evenodd"
        />
      </svg>
    );
  if (status === "degraded")
    return (
      <svg
        viewBox="0 0 16 16"
        fill="currentColor"
        className="w-3 h-3 text-amber-500 shrink-0 mt-0.5"
      >
        <path
          fillRule="evenodd"
          d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
          clipRule="evenodd"
        />
      </svg>
    );
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 text-rose-500 shrink-0 mt-0.5">
      <path
        fillRule="evenodd"
        d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

interface PreflightPanelProps {
  /** Renderer-target compatibility advisories (dismissible). */
  exportAdvisories: string[];
  advisoryDismissed: boolean;
  onDismissAdvisory: () => void;
  /** Capability metadata for the structured preflight report. */
  capability: DiagramCapability | null;
  family: DiagramFamily;
  hintResetToken: number;
  onFamilyHintDismiss: () => void;
  rendererProfile: RendererProfile | undefined;
  /** Look-incompatibility warning from the renderer profile (dismissible). */
  rendererLookWarning: string | null;
  look: MermaidLook;
  selectedPalette: Palette;
  outputFormat: "init-directive" | "frontmatter";
  onOutputFormatChange?: (format: "init-directive" | "frontmatter") => void;
  inputCode: string;
}

export function PreflightPanel({
  exportAdvisories,
  advisoryDismissed,
  onDismissAdvisory,
  capability,
  family,
  hintResetToken,
  onFamilyHintDismiss,
  rendererProfile,
  rendererLookWarning,
  look,
  selectedPalette,
  outputFormat,
  onOutputFormatChange,
  inputCode,
}: PreflightPanelProps) {
  const [expanded, setExpanded] = useState(false);

  // Only renderer advisories are shown here — they are dismissible per session.
  // Detector warnings and capability notes remain in ExportToolbar so they are
  // always visible regardless of advisory dismissal.
  const allIssues = [...exportAdvisories, ...(rendererLookWarning ? [rendererLookWarning] : [])];
  const hasAnyIssue = allIssues.length > 0;

  // Build the structured report (only needed when expanded)
  const report = expanded
    ? buildPreflightReport({
        family,
        capability,
        rendererProfile,
        look,
        selectedPalette,
        outputFormat,
      })
    : null;

  return (
    <>
      {/* ── Compact summary bar ── */}
      {hasAnyIssue && !advisoryDismissed && (
        <div className="flex-none border-b border-amber-500/20 bg-amber-500/6 px-3 py-1.5 flex items-center gap-2 print-hide">
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0"
          >
            <path
              fillRule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
          <span className="flex-1 min-w-0 text-[10px] text-amber-800 dark:text-amber-200/80 leading-snug">
            {allIssues[0]}
            {allIssues.length > 1 && (
              <span className="text-amber-600 dark:text-amber-400 ml-1">
                +{allIssues.length - 1} more
              </span>
            )}
          </span>
          {inputCode.trim() && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-label={expanded ? "Collapse preflight report" : "Expand preflight report"}
              className="shrink-0 text-[9px] font-medium text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 transition-colors px-1.5 py-0.5 rounded border border-amber-500/30 hover:border-amber-500/60"
            >
              {expanded ? "Collapse" : "Details"}
            </button>
          )}
          <button
            type="button"
            onClick={onDismissAdvisory}
            aria-label="Dismiss preflight advisory"
            className="shrink-0 text-amber-500/60 hover:text-amber-500 transition-colors"
          >
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
              <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z" />
            </svg>
          </button>
        </div>
      )}

      {/* ── Expanded structured report ── */}
      {expanded && hasAnyIssue && !advisoryDismissed && report && (
        <div className="flex-none border-b border-border bg-card/30 px-3 py-2.5 space-y-1 print-hide">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
              Compatibility Preflight
              {report.rendererLabel && (
                <span className="ml-2 normal-case font-normal text-foreground/70">
                  → {report.rendererLabel}
                </span>
              )}
            </span>
            <span className="text-[9px] text-muted-foreground">
              {report.familyLabel} · Mermaid {MERMAID_VERSION_VERIFIED}
            </span>
          </div>

          {report.items.map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <StatusIcon status={item.status} />
              <div className="min-w-0">
                <span className="text-[10px] font-medium text-foreground/90">{item.feature}</span>
                <span className="text-[10px] text-muted-foreground"> — {item.detail}</span>
                {item.actionLabel && (
                  <span className="ml-1.5 text-[9px] font-medium text-primary/80 bg-primary/8 border border-primary/20 rounded px-1 py-px">
                    Fix: {item.actionLabel}
                  </span>
                )}
              </div>
            </div>
          ))}

          {/* Suggested format action */}
          {report.suggestedFormat &&
            report.suggestedFormat !== outputFormat &&
            onOutputFormatChange && (
              <div className="mt-2 pt-2 border-t border-border/50 flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">Recommended format:</span>
                <button
                  type="button"
                  onClick={() => onOutputFormatChange(report.suggestedFormat!)}
                  className="text-[10px] px-2 py-0.5 rounded border border-primary/40 bg-primary/8 text-primary font-mono font-medium hover:bg-primary/14 transition-colors"
                >
                  Switch to {report.suggestedFormat === "frontmatter" ? "YAML" : "%%{init}%%"}
                </button>
              </div>
            )}
        </div>
      )}

      {/* ── Family syntax hint ── */}
      <FamilySyntaxHint
        family={family}
        resetToken={hintResetToken}
        onDismiss={onFamilyHintDismiss}
      />
    </>
  );
}
