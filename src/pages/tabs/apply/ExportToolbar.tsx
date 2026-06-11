import { useState, useCallback, useEffect, type ReactNode } from "react";
import type { Palette } from "@/lib/palettes";
import { WarningBanner } from "@/components/WarningBanner";
import { CapabilityNote } from "@/components/CapabilityNote";
import {
  generateMarkdownExport,
  generatePromptScaffoldWithFormat,
  type ExportOptions,
  type ScaffoldFormat,
} from "@/lib/theme-engine";
import { readScaffoldFormat } from "@/lib/scaffold-prefs";
import {
  downloadTextFile,
  downloadBlob,
  renderToSvg,
  svgStringToPngBlob,
  makeFilename,
  paletteToPortableJson,
  paletteToCssVariables,
  palettesToBundleJson,
} from "@/lib/exporters";
import { openInLiveEditor } from "@/lib/live-editor";
import { writeToClipboard } from "@/lib/clipboard";
import type { RendererProfile } from "@/data/renderer-parity";
import type { DetectionResult } from "@/lib/detector";
import type { TypographySettings } from "@/lib/typography";

type ExportType = "code" | "markdown" | "prompt";
type DownloadType = "mermaid" | "svg" | "png" | "json" | "markdown" | "scaffold" | "css" | "bundle";

const EXPORT_LABELS: Record<ExportType, string> = {
  code: "Styled Code",
  markdown: "Markdown",
  prompt: "Prompt Scaffold",
};

const DOWNLOAD_LABELS: Record<DownloadType, string> = {
  mermaid: ".mermaid",
  svg: ".svg",
  png: ".png",
  json: ".theme.json",
  markdown: ".md",
  scaffold: ".txt",
  css: ".css",
  bundle: ".bundle.json",
};

interface ExportToolbarProps {
  warnings: string[];
  showCapabilityNote: boolean;
  capability: DetectionResult["capability"];
  hasCustomizations: boolean;
  onOpenColorEditor: () => void;
  inputCode: string;
  exportCode: string;
  effectiveExportCode: string;
  selectedPalette: Palette;
  exportOptions: ExportOptions;
  effectiveThemeName: string;
  themedCode: string;
  typography: TypographySettings;
  allPalettes: Palette[];
  rendererProfile: RendererProfile | undefined;
  promptIsThemeOnly: boolean;
  onShowScaffoldModal: () => void;
  onShowToast: (msg: ReactNode) => void;
}

export function ExportToolbar({
  warnings,
  showCapabilityNote,
  capability,
  hasCustomizations,
  onOpenColorEditor,
  inputCode,
  exportCode,
  effectiveExportCode,
  selectedPalette,
  exportOptions,
  effectiveThemeName,
  themedCode,
  typography,
  allPalettes,
  rendererProfile,
  promptIsThemeOnly,
  onShowScaffoldModal,
  onShowToast,
}: ExportToolbarProps) {
  const [copiedType, setCopiedType] = useState<ExportType | null>(null);
  const [downloadingType, setDownloadingType] = useState<DownloadType | null>(null);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  useEffect(() => {
    if (!showDownloadMenu) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowDownloadMenu(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showDownloadMenu]);

  const handleCopy = useCallback(
    async (type: ExportType) => {
      if (type === "prompt") {
        onShowScaffoldModal();
        return;
      }
      let text = "";
      if (type === "code") text = effectiveExportCode;
      else if (type === "markdown")
        text = generateMarkdownExport(effectiveExportCode, selectedPalette, exportOptions);
      await writeToClipboard(text);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
    },
    [effectiveExportCode, selectedPalette, exportOptions, onShowScaffoldModal]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || !e.shiftKey) return;
      if (e.key !== "C" && e.key !== "c") return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) return;
      e.preventDefault();
      void handleCopy("code");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleCopy]);

  const handleDownload = useCallback(
    async (type: DownloadType) => {
      if (downloadingType) return;
      setShowDownloadMenu(false);
      setDownloadingType(type);
      try {
        if (type === "mermaid") {
          downloadTextFile(
            makeFilename(effectiveThemeName, "themed", "mermaid"),
            effectiveExportCode,
            "text/plain;charset=utf-8"
          );
          onShowToast("Downloaded .mermaid file.");
        } else if (type === "json") {
          downloadTextFile(
            makeFilename(effectiveThemeName, "theme", "json"),
            paletteToPortableJson(selectedPalette),
            "application/json;charset=utf-8"
          );
          onShowToast("Downloaded .theme.json file.");
        } else if (type === "svg") {
          const svg = await renderToSvg(themedCode, typography);
          downloadTextFile(
            makeFilename(effectiveThemeName, "diagram", "svg"),
            svg,
            "image/svg+xml;charset=utf-8"
          );
          onShowToast("Downloaded .svg file.");
        } else if (type === "png") {
          const svg = await renderToSvg(themedCode, typography);
          const blob = await svgStringToPngBlob(svg, 2);
          downloadBlob(makeFilename(effectiveThemeName, "diagram", "png"), blob);
          onShowToast("Downloaded .png file.");
        } else if (type === "markdown") {
          downloadTextFile(
            makeFilename(effectiveThemeName, "themed", "md"),
            generateMarkdownExport(effectiveExportCode, selectedPalette, exportOptions),
            "text/markdown;charset=utf-8"
          );
          onShowToast("Downloaded .md file.");
        } else if (type === "scaffold") {
          const scaffoldFormat: ScaffoldFormat = readScaffoldFormat();
          downloadTextFile(
            makeFilename(effectiveThemeName, "scaffold", "txt"),
            generatePromptScaffoldWithFormat(selectedPalette, exportOptions, scaffoldFormat),
            "text/plain;charset=utf-8"
          );
          onShowToast("Downloaded .txt scaffold file.");
        } else if (type === "css") {
          downloadTextFile(
            makeFilename(effectiveThemeName, "theme", "css"),
            paletteToCssVariables(selectedPalette),
            "text/css;charset=utf-8"
          );
          onShowToast("Downloaded .css variables file.");
        } else if (type === "bundle") {
          downloadTextFile(
            makeFilename("mermaid-theme-builder", "palettes", "bundle.json"),
            palettesToBundleJson(allPalettes),
            "application/json;charset=utf-8"
          );
          onShowToast(`Downloaded bundle of ${allPalettes.length} palettes.`);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        onShowToast(`Download failed: ${msg.slice(0, 80)}`);
      } finally {
        setDownloadingType(null);
      }
    },
    [
      downloadingType,
      effectiveExportCode,
      themedCode,
      typography,
      selectedPalette,
      effectiveThemeName,
      allPalettes,
      exportOptions,
      onShowToast,
    ]
  );

  return (
    <div className="flex-none border-t border-border bg-card/40 print-hide">
      {warnings.length > 0 && (
        <div className="px-3 pt-2.5">
          <WarningBanner warnings={warnings} />
        </div>
      )}
      {showCapabilityNote && capability && (
        <div className="px-3 pt-2.5">
          <CapabilityNote capability={capability} />
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2 px-3 py-2.5">
        <div className="flex-1" />

        <button
          onClick={onOpenColorEditor}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border transition-all font-medium ${
            hasCustomizations
              ? "border-primary/40 bg-primary/8 text-primary hover:bg-primary/12"
              : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
            <path
              fillRule="evenodd"
              d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z"
              clipRule="evenodd"
            />
          </svg>
          Edit Colors
          {hasCustomizations && (
            <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
          )}
        </button>

        <button
          onClick={() => openInLiveEditor(exportCode)}
          disabled={!inputCode.trim()}
          title="Open themed diagram in Mermaid Live Editor (mermaid.live)"
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-border bg-background hover:bg-muted hover:border-primary/40 font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-3.5 h-3.5 text-muted-foreground"
          >
            <path
              fillRule="evenodd"
              d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z"
              clipRule="evenodd"
            />
            <path
              fillRule="evenodd"
              d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z"
              clipRule="evenodd"
            />
          </svg>
          Live Editor
        </button>

        {(["code", "prompt"] as ExportType[]).map((type) => {
          const copied = copiedType === type;
          const disabled = !inputCode.trim() && type !== "prompt";
          const isPrimary = type === "code";
          const isAccent = type === "prompt";
          return (
            <button
              key={type}
              onClick={() => handleCopy(type)}
              disabled={disabled}
              title={type === "code" ? "Copy themed Mermaid code (Ctrl+Shift+C)" : undefined}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border font-medium transition-all ${
                copied
                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : isPrimary
                    ? "border-primary bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                    : isAccent
                      ? "border-primary/35 bg-primary/8 text-primary hover:bg-primary/14 disabled:opacity-40 disabled:cursor-not-allowed"
                      : "border-border bg-card text-foreground hover:bg-muted hover:border-primary/30 disabled:opacity-40 disabled:cursor-not-allowed"
              }`}
            >
              {copied ? (
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                  <path
                    fillRule="evenodd"
                    d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-3.5 h-3.5 text-muted-foreground"
                >
                  <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
                  <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.44A1.5 1.5 0 008.378 6H4.5z" />
                </svg>
              )}
              {copied ? "Copied!" : EXPORT_LABELS[type]}
              {type === "prompt" && !copied && rendererProfile && (
                <span
                  title={`Scaffold is tailored for ${rendererProfile.shortName} — clear the renderer target for a portable generic version`}
                  className="ml-0.5 px-1.5 py-px rounded text-[10px] font-semibold leading-none bg-primary/15 text-primary border border-primary/30 cursor-help"
                >
                  {rendererProfile.shortName}
                </span>
              )}
              {type === "prompt" && !copied && promptIsThemeOnly && (
                <span
                  title="This diagram type only supports palette-level theming, not per-node color classes"
                  className="ml-0.5 px-1.5 py-px rounded text-[10px] font-semibold leading-none bg-muted text-muted-foreground border border-border cursor-help"
                >
                  No classDef
                </span>
              )}
            </button>
          );
        })}

        <div className="relative">
          <button
            onClick={() => setShowDownloadMenu((v) => !v)}
            disabled={!inputCode.trim() || !!downloadingType}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-border bg-background hover:bg-muted hover:border-primary/40 font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-3.5 h-3.5 text-muted-foreground"
            >
              <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
              <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
            </svg>
            {downloadingType ? `Saving ${DOWNLOAD_LABELS[downloadingType]}…` : "Download"}
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-muted-foreground">
              <path
                fillRule="evenodd"
                d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          {showDownloadMenu && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowDownloadMenu(false)} />
              <div className="absolute right-0 bottom-full mb-1 z-40 min-w-[180px] rounded-md border border-border bg-popover shadow-lg overflow-hidden">
                {(
                  [
                    "mermaid",
                    "markdown",
                    "scaffold",
                    "svg",
                    "png",
                    "json",
                    "css",
                    "bundle",
                  ] as DownloadType[]
                ).map((t) => (
                  <button
                    key={t}
                    onClick={() => handleDownload(t)}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors flex items-center justify-between"
                  >
                    <span className="font-medium text-foreground">{DOWNLOAD_LABELS[t]}</span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      {t === "mermaid" && "raw text"}
                      {t === "markdown" && (
                        <>
                          bootstrap
                          {rendererProfile && (
                            <span className="px-1.5 py-px rounded text-[10px] font-semibold leading-none bg-primary/15 text-primary border border-primary/30">
                              {rendererProfile.shortName}
                            </span>
                          )}
                          {promptIsThemeOnly && (
                            <span
                              title="This diagram type only supports palette-level theming, not per-node color classes"
                              className="px-1.5 py-px rounded text-[10px] font-semibold leading-none bg-muted text-muted-foreground border border-border cursor-help"
                            >
                              No classDef
                            </span>
                          )}
                        </>
                      )}
                      {t === "scaffold" && (
                        <>
                          prompt
                          {rendererProfile && (
                            <span className="px-1.5 py-px rounded text-[10px] font-semibold leading-none bg-primary/15 text-primary border border-primary/30">
                              {rendererProfile.shortName}
                            </span>
                          )}
                          {promptIsThemeOnly && (
                            <span
                              title="This diagram type only supports palette-level theming, not per-node color classes"
                              className="px-1.5 py-px rounded text-[10px] font-semibold leading-none bg-muted text-muted-foreground border border-border cursor-help"
                            >
                              No classDef
                            </span>
                          )}
                        </>
                      )}
                      {t === "svg" && "vector"}
                      {t === "png" && "raster 2x"}
                      {t === "json" && "palette"}
                      {t === "css" && "variables"}
                      {t === "bundle" && "all palettes"}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
