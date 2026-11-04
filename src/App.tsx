import {
  Component,
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { useThemeMode, type ThemeMode } from "@/hooks/useThemeMode";
import { useThemeLibrary, sameTheme } from "@/hooks/useThemeLibrary";
import {
  paletteToCompleteTheme,
  completeThemeToPalette,
  uniqueThemeId,
  libraryToPortableJson,
  parseLibraryImport,
  parseThemeImport,
  WORKSPACE_RECOVERY_TYPE,
  THEME_LIBRARY_KEY,
  LEGACY_THEME_KEY,
  type ThemeLibrary,
} from "@/lib/theme-library";
import { ThemeLibraryStatus, ThemeDialog, themeActionClass } from "@/components/ThemeLibraryStatus";
import {
  BUILTIN_PALETTES,
  BRAND_PALETTES,
  PALETTE_TOOL_VERSION,
  UTILITY_PALETTES,
  REQUIRED_COLOR_KEYS,
  KNOWN_COLOR_KEYS,
  type Palette,
  type ThemeColor,
  getEffectiveThemeName,
} from "@/lib/palettes";
import { clearAllDismissals } from "@/lib/family-syntax-hints";
import { APPLY_TAB_DEFAULT } from "@/data/examples";
import { AppIcon } from "@/components/AppIcon";
import { ApplyTab } from "@/pages/tabs/ApplyTab";
import { ComposeTab } from "@/pages/tabs/ComposeTab";
import { ExamplesTab } from "@/pages/tabs/ExamplesTab";
import { ReferenceTab } from "@/pages/tabs/ReferenceTab";
import { ExtractTab } from "@/pages/tabs/ExtractTab";
import {
  hasCompletedFirstVisit,
  markFirstVisitComplete,
  readShareToken,
  hasShareToken,
  clearShareToken,
  type ShareablePayload,
} from "@/lib/persistence";
import {
  type MermaidLook,
  type AdvancedMermaidConfig,
  CLASSDEF_CAPABLE_FAMILIES,
  getClassDefs,
  generateThemedCode,
} from "@/lib/theme-engine";
import { getRendererById, getRendererDefaultOutputFormat } from "@/data/renderer-parity";
import { type MyThemeSlot, type MyThemeSlotId, slotDisplayName } from "@/lib/my-theme-slots";
import { downloadTextFile, makeFilename } from "@/lib/exporters";
import {
  migrateSlotToProfile,
  createGovernanceProfile,
  profileToPortableJson,
  profileToSlot,
  type GovernanceProfile,
} from "@/lib/governance-profile";
import { ProfileDetailsPanel } from "@/components/ProfileDetailsPanel";
import {
  buildProfileShareUrl,
  clearProfileShareToken,
  decodeProfileToken,
  readProfileShareToken,
  writeToClipboard,
} from "@/lib/profile-share";
import { RouteSelector } from "@/components/RouteSelector";
import { detectDiagram } from "@/lib/detector";
import { type TypographySettings, DEFAULT_TYPOGRAPHY } from "@/lib/typography";
import { paletteFromExtracted, extractTheme, hasExtractableTheme } from "@/lib/extractor";

export type AppTab = "apply" | "compose" | "examples" | "reference" | "extract";
type OutputFormat = "init-directive" | "frontmatter";

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-8">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="w-12 h-12 text-destructive/60"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
          <div className="text-center max-w-md">
            <p className="text-sm font-semibold text-foreground mb-1">Failed to load</p>
            <p className="text-xs text-muted-foreground mb-3">
              Something went wrong initialising the theme builder.
            </p>
            <pre className="text-[10px] text-destructive/70 bg-destructive/8 border border-destructive/20 rounded p-3 text-left whitespace-pre-wrap font-mono max-h-40 overflow-auto">
              {this.state.error.message}
            </pre>
          </div>
          <button
            className="text-xs px-3 py-1.5 rounded border border-border hover:bg-muted transition-colors text-muted-foreground"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const TAB_CONFIG: {
  id: AppTab;
  label: string;
  icon: ReactNode;
}[] = [
  {
    id: "compose",
    label: "Compose",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path
          fillRule="evenodd"
          d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    id: "apply",
    label: "Apply",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
      </svg>
    ),
  },
  {
    id: "examples",
    label: "Examples",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path
          fillRule="evenodd"
          d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    id: "reference",
    label: "Reference",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
      </svg>
    ),
  },
  {
    id: "extract",
    label: "Extract",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path
          fillRule="evenodd"
          d="M10 2a.75.75 0 01.75.75v8.614l3.205-3.129a.75.75 0 111.09 1.03l-4.25 4.5a.75.75 0 01-1.09 0l-4.25-4.5a.75.75 0 111.09-1.03L9.25 11.364V2.75A.75.75 0 0110 2z"
          clipRule="evenodd"
        />
        <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
      </svg>
    ),
  },
];

function uniquePaletteId(prefix: string, taken: Set<string>): string {
  let id = `${prefix}${Date.now().toString(36)}`;
  let salt = 0;
  while (taken.has(id)) {
    salt++;
    id = `${prefix}${Date.now().toString(36)}-${salt.toString(36)}`;
  }
  return id;
}

export function buildPaletteFromShare(payload: ShareablePayload): Palette {
  const name = payload.paletteName || "Shared theme";
  const colors: ThemeColor[] = Object.entries(payload.themeVariables).map(([key, value]) => ({
    key,
    label: key,
    value,
  }));
  // Merge with a sensible label set when keys overlap with the canonical palette schema.
  const canonical = BRAND_PALETTES[0].colors;
  const merged: ThemeColor[] = canonical.map((c) => {
    const override = colors.find((o) => o.key === c.key);
    return override ? { ...c, value: override.value } : c;
  });
  // Add any extra keys beyond the canonical set
  for (const c of colors) {
    if (!merged.find((m) => m.key === c.key)) merged.push(c);
  }
  return {
    id:
      payload.paletteId && payload.paletteId.startsWith("shared-")
        ? payload.paletteId
        : `shared-${Date.now().toString(36)}`,
    name,
    description: "Theme loaded from a shared link.",
    version: "0.0.0",
    colors: merged,
    attribution: {
      enabledByDefault: true,
      label: `Themed with Mermaid Theme Builder · ${name}`,
      url: "https://overkillhill.com/projects/mermaid-theme-builder/",
      themeName: name,
      toolName: "Mermaid Theme Builder",
      toolVersion: PALETTE_TOOL_VERSION,
    },
  };
}

const RECENT_PALETTES_MAX = 5;

function ThemeModeToggle({
  mode,
  cycle,
  className,
}: {
  mode: ThemeMode;
  cycle: () => void;
  className?: string;
}) {
  const label =
    mode === "system"
      ? "System theme (click to switch to light)"
      : mode === "light"
        ? "Light theme (click to switch to dark)"
        : "Dark theme (click to switch to system)";
  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={label}
      title={label}
      className={
        className ??
        "p-1.5 rounded-md border border-border/60 hover:border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors print-hide"
      }
    >
      {mode === "light" ? (
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zM10 15a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zM3.75 9.25a.75.75 0 000 1.5h1.5a.75.75 0 000-1.5h-1.5zM15 9.25a.75.75 0 000 1.5h1.5a.75.75 0 000-1.5H15zM5.05 5.05a.75.75 0 011.06 0l1.06 1.06a.75.75 0 11-1.06 1.06L5.05 6.11a.75.75 0 010-1.06zM12.83 12.83a.75.75 0 011.06 0l1.06 1.06a.75.75 0 11-1.06 1.06l-1.06-1.06a.75.75 0 010-1.06zM5.05 14.95a.75.75 0 010-1.06l1.06-1.06a.75.75 0 111.06 1.06l-1.06 1.06a.75.75 0 01-1.06 0zM12.83 7.17a.75.75 0 010-1.06l1.06-1.06a.75.75 0 011.06 1.06L13.89 7.17a.75.75 0 01-1.06 0zM10 6a4 4 0 100 8 4 4 0 000-8z"
            clipRule="evenodd"
          />
        </svg>
      ) : mode === "dark" ? (
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5" aria-hidden="true">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      ) : (
        <svg
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          className="w-3.5 h-3.5"
          aria-hidden="true"
        >
          <rect x="2.5" y="4" width="15" height="11" rx="1.5" />
          <path d="M7 18h6M10 15v3" strokeLinecap="round" />
        </svg>
      )}
    </button>
  );
}

export function AppShell() {
  // Capture the URL hash at component-initialization time (render phase), before
  // any useEffect can mutate window.location.hash (e.g. the hash-sync effect that
  // writes activeTab back to the URL).  Used by the hydration effect to determine
  // whether an inbound URL hash should bypass the first-use route selector.
  const initialHashRef = useRef(window.location.hash.slice(1));

  const [activeTab, setActiveTab] = useState<AppTab>(() => {
    const h = window.location.hash.slice(1);
    const TABS: AppTab[] = ["apply", "compose", "examples", "reference", "extract"];
    return TABS.includes(h as AppTab) ? (h as AppTab) : "apply";
  });
  const [hydrated, setHydrated] = useState(false);
  // True once the user has completed (or skipped) the first-use route selector.
  // Initialised to `true` to avoid a flash on returning visits; set to `false`
  // after hydration confirms the user is brand new (no persisted state, no
  // share token, no URL-hash tab).
  const [firstVisitComplete, setFirstVisitComplete] = useState(true);
  const [toast, setToast] = useState<ReactNode | null>(null);
  const [userPalettes, setUserPalettes] = useState<Palette[]>([]);
  const [selectedPaletteId, setSelectedPaletteId] = useState(BRAND_PALETTES[0].id);
  const [customColors, setCustomColors] = useState<Record<string, ThemeColor[]>>({});
  const [inputCode, setInputCode] = useState(APPLY_TAB_DEFAULT);
  const [includeMetaComments, setIncludeMetaComments] = useState(true);
  const [includeBadge, setIncludeBadge] = useState(true);
  const [customThemeName, setCustomThemeName] = useState("");
  const [recentPaletteIds, setRecentPaletteIds] = useState<string[]>([]);
  const [look, setLook] = useState<MermaidLook>("classic");
  const [fontSize, setFontSize] = useState<string>("");
  const [typography, setTypography] = useState<TypographySettings>(DEFAULT_TYPOGRAPHY);
  const [rendererTarget, setRendererTarget] = useState<string>("");
  const [previewMode, setPreviewMode] = useState<"original" | "themed" | "diff" | "code">("themed");
  const [lastExampleType, setLastExampleType] = useState<Record<string, "flowchart" | "sequence">>(
    {}
  );
  const [lastSelectedExampleId, setLastSelectedExampleId] = useState<string>("");
  const [importDiagnostics, setImportDiagnostics] = useState<{
    missingKeys: string[];
    unknownKeys: string[];
    invalidValues: Array<{ key: string; value: string }>;
    warnValues: Array<{ key: string; value: string }>;
  } | null>(null);
  const [hintResetToken, setHintResetToken] = useState(0);
  const [settingsResetToken, setSettingsResetToken] = useState(0);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [confirmResetPalettes, setConfirmResetPalettes] = useState(false);
  const settingsBtnRef = useRef<HTMLButtonElement>(null);
  const settingsMenuRef = useRef<HTMLDivElement>(null);
  const [openParityMatrix, setOpenParityMatrix] = useState(false);
  const [openDistributionRenderer, setOpenDistributionRenderer] = useState<string | null>(null);
  const [myThemeSlots, setMyThemeSlots] = useState<MyThemeSlot[]>([]);
  const myThemeSlotsRef = useRef(myThemeSlots);
  const updateMyThemeSlots = useCallback(
    (update: MyThemeSlot[] | ((previous: MyThemeSlot[]) => MyThemeSlot[])) => {
      const next = typeof update === "function" ? update(myThemeSlotsRef.current) : update;
      myThemeSlotsRef.current = next;
      setMyThemeSlots(next);
    },
    []
  );
  const [activeMyThemeSlotId, setActiveMyThemeSlotId] = useState<string | null>(null);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("init-directive");
  const [outputFormatOverridden, setOutputFormatOverridden] = useState(false);
  const [rendererTargetHintDismissed, setRendererTargetHintDismissed] = useState(false);
  const [strokeWidth, setStrokeWidth] = useState<number | undefined>(undefined);
  const [advancedMermaidConfig, setAdvancedMermaidConfig] = useState<
    import("@/lib/theme-engine").AdvancedMermaidConfig
  >({});
  const [profileDetailSlotId, setProfileDetailSlotId] = useState<string | null>(null);
  const [profileShareError, setProfileShareError] = useState<string | null>(null);
  const [themeImportError, setThemeImportError] = useState<string | null>(null);
  const themeLibrary = useThemeLibrary();
  const { update: updateLibrary, stateRef: libraryRef, initial: initialLibrary } = themeLibrary;
  const hydrationStarted = useRef(false);
  const [pendingThemeSwitch, setPendingThemeSwitch] = useState<(() => void) | null>(null);
  const [pendingClearSettings, setPendingClearSettings] = useState(false);
  const [importingTheme, setImportingTheme] = useState(false);
  const [pendingThemeImport, setPendingThemeImport] = useState<{
    themes: GovernanceProfile[];
    warnings: string[];
    replaceId?: string;
  } | null>(null);

  const applyCompleteTheme = useCallback(
    (profile: GovernanceProfile, personal: boolean) => {
      const theme = structuredClone(profile);
      setActiveMyThemeSlotId(personal ? theme.id : null);
      if (personal)
        updateMyThemeSlots((slots) =>
          slots.some((slot) => slot.id === theme.id)
            ? slots.map((slot) => (slot.id === theme.id ? profileToSlot(theme) : slot))
            : [...slots, profileToSlot(theme)]
        );
      else {
        setSelectedPaletteId(theme.id);
        setCustomColors((previous) => ({ ...previous, [theme.id]: theme.colors }));
      }
      setCustomThemeName(personal ? "" : theme.name);
      setLook(theme.look);
      setFontSize(theme.fontSize);
      setTypography(theme.typography);
      setRendererTarget(theme.rendererTarget);
      setOutputFormat(
        theme.outputFormatOverridden
          ? theme.outputFormat
          : getRendererDefaultOutputFormat(theme.rendererTarget)
      );
      setOutputFormatOverridden(theme.outputFormatOverridden === true);
      setStrokeWidth(theme.strokeWidth);
      setIncludeMetaComments(theme.includeMetaComments !== false);
      setIncludeBadge(theme.includeBadge === true);
      const raw = theme.advancedMermaidConfig;
      setAdvancedMermaidConfig({
        ...(typeof raw?.htmlLabels === "boolean" ? { htmlLabels: raw.htmlLabels } : {}),
        ...(typeof raw?.deterministicIds === "boolean"
          ? { deterministicIds: raw.deterministicIds }
          : {}),
        ...(typeof raw?.deterministicIDSeed === "string"
          ? { deterministicIDSeed: raw.deterministicIDSeed }
          : {}),
      });
    },
    [updateMyThemeSlots]
  );

  // Keep the format aligned with the selected renderer until the user makes an
  // explicit format choice. This also handles renderer changes restored from
  // persistence or imported profiles, not only changes from the Target select.
  useEffect(() => {
    if (outputFormatOverridden || !rendererTarget) return;
    const recommended = getRendererDefaultOutputFormat(rendererTarget);
    setOutputFormat((current) => (current === recommended ? current : recommended));
  }, [rendererTarget, outputFormatOverridden]);

  // Once a renderer has been selected, keep the no-target guidance dismissed
  // even if the user later returns to the generic target.
  useEffect(() => {
    if (rendererTarget) setRendererTargetHintDismissed(true);
  }, [rendererTarget]);

  const handleRendererTargetChange = useCallback(
    (nextRendererTarget: string) => {
      setRendererTarget(nextRendererTarget);
      if (!outputFormatOverridden) {
        setOutputFormat(getRendererDefaultOutputFormat(nextRendererTarget));
      }
    },
    [outputFormatOverridden]
  );

  const handleOutputFormatChange = useCallback(
    (nextOutputFormat: OutputFormat) => {
      // Clicking the already-active recommended format does not create a
      // meaningless override indicator.
      if (nextOutputFormat !== outputFormat) {
        setOutputFormatOverridden(true);
      }
      setOutputFormat(nextOutputFormat);
    },
    [outputFormat]
  );

  const handleResetOutputFormat = useCallback(() => {
    const recommended = getRendererDefaultOutputFormat(rendererTarget);
    setOutputFormat(recommended);
    setOutputFormatOverridden(false);
  }, [rendererTarget]);

  /** Called when the user picks a route on the first-use selector. */
  const handleRouteSelect = useCallback((tab: AppTab) => {
    setActiveTab(tab);
    // Write the completion flag immediately so it persists even if the user
    // closes before the auto-save effect has a chance to flush the full blob.
    markFirstVisitComplete();
    setFirstVisitComplete(true);
  }, []);

  const handleNavigateToParityMatrix = useCallback(() => {
    setActiveTab("reference");
    setOpenParityMatrix(true);
  }, []);

  const handleNavigateToRendererExport = useCallback((rendererId: string) => {
    setActiveTab("reference");
    setOpenDistributionRenderer(rendererId);
  }, []);

  const supportsClassDef = useMemo(
    () => CLASSDEF_CAPABLE_FAMILIES.includes(detectDiagram(inputCode).family),
    [inputCode]
  );
  const tabsRef = useRef<HTMLDivElement>(null);
  const { mode: themeMode, cycle: cycleThemeMode } = useThemeMode();

  // Keep URL hash in sync with active tab so tabs are bookmarkable/shareable.
  useEffect(() => {
    window.location.hash = activeTab;
  }, [activeTab]);

  // Sync active tab when the browser navigates via Back / Forward.
  // Without this listener the URL hash changes but React state stays stale,
  // so pressing Back would show the wrong tab with the correct URL.
  useEffect(() => {
    const TABS: AppTab[] = ["apply", "compose", "examples", "reference", "extract"];
    const onHashChange = () => {
      const h = window.location.hash.slice(1);
      if (TABS.includes(h as AppTab)) {
        setActiveTab(h as AppTab);
      }
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // Read the additive library once. Invalid data stays untouched and disables writes.
  useEffect(() => {
    if (hydrationStarted.current) return;
    hydrationStarted.current = true;
    workingDrafts.current.clear();
    const tabs: AppTab[] = ["apply", "compose", "examples", "reference", "extract"];
    const hasUrlTab = tabs.includes(initialHashRef.current as AppTab);
    const profileToken = readProfileShareToken();
    const hasProfile = profileToken !== null;
    const hasLegacyShare = hasShareToken();
    const legacyShare = hasProfile ? null : readShareToken();
    if (hasProfile) clearProfileShareToken();
    if (hasLegacyShare) clearShareToken();
    let records: GovernanceProfile[] = [];
    if (initialLibrary.ok) {
      const state = initialLibrary.state;
      records = state.themes.map(
        (theme) => state.drafts.find((draft) => draft.id === theme.id) ?? theme
      );
      for (const draft of state.drafts) {
        if (
          !records.some((theme) => theme.id === draft.id) &&
          !BUILTIN_PALETTES.some((palette) => palette.id === draft.id)
        )
          records.push(draft);
      }
      if (state.themeOrder) {
        const order = new Map(state.themeOrder.map((id, index) => [id, index]));
        records.sort(
          (a, b) => (order.get(a.id) ?? records.length) - (order.get(b.id) ?? records.length)
        );
      }
      updateMyThemeSlots(records.map(profileToSlot));
      const session = state.editorSession;
      const preferences = session.preferences;
      const legacy =
        state.migration.legacySource === null ? {} : JSON.parse(state.migration.legacySource);
      if (state.revision > 0 || typeof legacy.inputCode === "string")
        setInputCode(session.inputCode);
      if (Array.isArray(preferences.recentPaletteIds))
        setRecentPaletteIds(
          preferences.recentPaletteIds
            .filter((id): id is string => typeof id === "string")
            .slice(0, RECENT_PALETTES_MAX)
        );
      if (["original", "themed", "diff", "code"].includes(String(preferences.previewMode)))
        setPreviewMode(preferences.previewMode as typeof previewMode);
      if (typeof preferences.lastSelectedExampleId === "string")
        setLastSelectedExampleId(preferences.lastSelectedExampleId);
      if (preferences.lastExampleType && typeof preferences.lastExampleType === "object") {
        setLastExampleType(
          Object.fromEntries(
            Object.entries(preferences.lastExampleType).filter(
              ([, value]) => value === "flowchart" || value === "sequence"
            )
          ) as Record<string, "flowchart" | "sequence">
        );
      }
      if (preferences.rendererTargetHintDismissed === true) setRendererTargetHintDismissed(true);
      if (!hasUrlTab && tabs.includes(preferences.activeTab as AppTab))
        setActiveTab(preferences.activeTab as AppTab);
      const id = session.activeThemeId ?? session.selectedPaletteId;
      const builtin = BUILTIN_PALETTES.find((palette) => palette.id === id) ?? BRAND_PALETTES[0];
      const selected =
        state.drafts.find((draft) => draft.id === id) ??
        records.find((theme) => theme.id === id) ??
        paletteToCompleteTheme(builtin);
      applyCompleteTheme(
        selected,
        records.some((theme) => theme.id === selected.id)
      );
    }
    if (profileToken) {
      const imported = decodeProfileToken(profileToken);
      if (!imported.ok) setProfileShareError(imported.error);
      else {
        setPendingThemeImport({ themes: [imported.profile], warnings: imported.warnings });
      }
    } else if (legacyShare) {
      const palette = buildPaletteFromShare(legacyShare);
      const profile = paletteToCompleteTheme(palette);
      profile.id = uniqueThemeId(
        palette.id,
        new Set([...BUILTIN_PALETTES.map((item) => item.id), ...records.map((theme) => theme.id)])
      );
      if (["classic", "neo", "handDrawn"].includes(String(legacyShare.look)))
        profile.look = legacyShare.look as MermaidLook;
      if (typeof legacyShare.rendererTarget === "string")
        profile.rendererTarget = legacyShare.rendererTarget;
      profile.outputFormat = getRendererDefaultOutputFormat(profile.rendererTarget);
      applyCompleteTheme(profile, true);
      setToast(`Loaded shared theme as an unsaved draft: "${profile.name}".`);
      const keys = Object.keys(legacyShare.themeVariables);
      const missingKeys = (REQUIRED_COLOR_KEYS as readonly string[]).filter(
        (key) => !keys.includes(key)
      );
      const unknownKeys = keys.filter((key) => !KNOWN_COLOR_KEYS.has(key));
      if (missingKeys.length || unknownKeys.length)
        setImportDiagnostics({ missingKeys, unknownKeys, invalidValues: [], warnValues: [] });
    } else if (hasLegacyShare)
      setProfileShareError("The shared theme could not be read. Nothing was imported.");
    if (!hasCompletedFirstVisit() && !hasUrlTab && !hasLegacyShare && !hasProfile)
      setFirstVisitComplete(false);
    setHydrated(true);
  }, [initialLibrary, applyCompleteTheme, updateMyThemeSlots]);

  // Auto-clear toast after 2.5s
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const allPalettes = useMemo<Palette[]>(
    () => [...BRAND_PALETTES, ...UTILITY_PALETTES, ...userPalettes],
    [userPalettes]
  );

  const activeMyThemeSlot = useMemo(
    () =>
      activeMyThemeSlotId ? (myThemeSlots.find((s) => s.id === activeMyThemeSlotId) ?? null) : null,
    [myThemeSlots, activeMyThemeSlotId]
  );

  const selectedPalette = useMemo((): Palette => {
    if (activeMyThemeSlot) {
      return completeThemeToPalette(migrateSlotToProfile(activeMyThemeSlot));
    }
    const base = allPalettes.find((p) => p.id === selectedPaletteId) ?? BRAND_PALETTES[0];
    const overrides = customColors[selectedPaletteId];
    if (!overrides) return base;
    return {
      ...base,
      colors: [
        ...base.colors.map((c) => {
          const override = overrides.find((o) => o.key === c.key);
          return override ?? c;
        }),
        ...overrides.filter(
          (color) => !base.colors.some((baseColor) => baseColor.key === color.key)
        ),
      ],
    };
  }, [allPalettes, selectedPaletteId, customColors, activeMyThemeSlot]);

  const classDefCount = useMemo(() => getClassDefs(selectedPalette).length, [selectedPalette]);

  const slotBaseColors = useMemo(() => {
    const builtin = BUILTIN_PALETTES.find((p) => p.id === selectedPaletteId);
    return (builtin ?? BRAND_PALETTES[0]).colors;
  }, [selectedPaletteId]);

  const hasSlotColorOverrides = useMemo(() => {
    if (!activeMyThemeSlot) return false;
    return activeMyThemeSlot.colors.some((c) => {
      const base = slotBaseColors.find((b) => b.key === c.key);
      return base !== undefined && base.value !== c.value;
    });
  }, [activeMyThemeSlot, slotBaseColors]);

  const hasCustomizations = activeMyThemeSlotId
    ? hasSlotColorOverrides
    : Boolean(customColors[selectedPaletteId]);

  const effectiveCustomThemeName = activeMyThemeSlot ? activeMyThemeSlot.name : customThemeName;
  const effectiveLook = activeMyThemeSlot ? activeMyThemeSlot.look : look;
  const effectiveFontSize = activeMyThemeSlot ? activeMyThemeSlot.fontSize : fontSize;
  const effectiveTypography = activeMyThemeSlot ? activeMyThemeSlot.typography : typography;

  const effectiveThemeName = useMemo(
    () => getEffectiveThemeName(selectedPalette, effectiveCustomThemeName, hasCustomizations),
    [selectedPalette, effectiveCustomThemeName, hasCustomizations]
  );

  const workingDrafts = useRef(new Map<string, GovernanceProfile>());
  const currentProfile = useMemo(() => {
    const base = activeMyThemeSlot
      ? migrateSlotToProfile(activeMyThemeSlot)
      : (workingDrafts.current.get(selectedPalette.id) ??
        themeLibrary.state?.drafts.find((draft) => draft.id === selectedPalette.id) ??
        paletteToCompleteTheme(selectedPalette));
    const unsupported = Object.fromEntries(
      Object.entries(base.advancedMermaidConfig ?? {}).filter(
        ([key]) => !["htmlLabels", "deterministicIds", "deterministicIDSeed"].includes(key)
      )
    );
    return createGovernanceProfile({
      ...base,
      name: effectiveCustomThemeName || selectedPalette.name,
      colors: selectedPalette.colors,
      look: effectiveLook,
      fontSize: effectiveFontSize,
      typography: effectiveTypography,
      rendererTarget,
      outputFormat,
      outputFormatOverridden,
      strokeWidth,
      includeMetaComments,
      includeBadge,
      advancedMermaidConfig: { ...unsupported, ...advancedMermaidConfig },
    });
  }, [
    activeMyThemeSlot,
    selectedPalette,
    effectiveCustomThemeName,
    effectiveLook,
    effectiveFontSize,
    effectiveTypography,
    rendererTarget,
    outputFormat,
    outputFormatOverridden,
    strokeWidth,
    includeMetaComments,
    includeBadge,
    advancedMermaidConfig,
  ]);
  workingDrafts.current.set(currentProfile.id, currentProfile);
  const session = useMemo<ThemeLibrary["editorSession"]>(
    () => ({
      inputCode,
      activeThemeId: activeMyThemeSlotId,
      selectedPaletteId,
      preferences: {
        ...(initialLibrary.ok ? initialLibrary.state.editorSession.preferences : {}),
        recentPaletteIds,
        previewMode,
        lastExampleType,
        lastSelectedExampleId,
        rendererTargetHintDismissed,
        firstVisitComplete,
        activeTab,
      },
    }),
    [
      inputCode,
      activeMyThemeSlotId,
      selectedPaletteId,
      recentPaletteIds,
      previewMode,
      lastExampleType,
      lastSelectedExampleId,
      rendererTargetHintDismissed,
      firstVisitComplete,
      activeTab,
      initialLibrary,
    ]
  );
  const baseline =
    themeLibrary.state?.themes.find((theme) => theme.id === currentProfile.id) ??
    (BUILTIN_PALETTES.find((palette) => palette.id === currentProfile.id)
      ? paletteToCompleteTheme(
          BUILTIN_PALETTES.find((palette) => palette.id === currentProfile.id)!
        )
      : undefined);
  const dirtyTheme = !baseline || !sameTheme(currentProfile, baseline);
  const currentProfileRef = useRef(currentProfile);
  currentProfileRef.current = currentProfile;
  const sessionRef = useRef(session);
  sessionRef.current = session;

  // Autosave only the working drafts and editor session, never named themes.
  useEffect(() => {
    if (!hydrated || !firstVisitComplete) return;
    const timer = setTimeout(() => {
      const working = [...workingDrafts.current.values()];
      for (const slot of myThemeSlots)
        if (!working.some((theme) => theme.id === slot.id))
          working.push(migrateSlotToProfile(slot));
      if (!working.some((theme) => theme.id === currentProfile.id)) working.push(currentProfile);
      void updateLibrary((state) => {
        const drafts = new Map(state.drafts.map((draft) => [draft.id, draft]));
        for (const profile of working) {
          const saved = state.themes.find((theme) => theme.id === profile.id);
          const builtin = BUILTIN_PALETTES.find((palette) => palette.id === profile.id);
          const original = saved ?? (builtin ? paletteToCompleteTheme(builtin) : undefined);
          if (original && sameTheme(original, profile)) drafts.delete(profile.id);
          else drafts.set(profile.id, profile);
        }
        return { ...state, drafts: [...drafts.values()], editorSession: session };
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [hydrated, firstVisitComplete, currentProfile, myThemeSlots, session, updateLibrary]);

  const saveCompleteTheme = useCallback(
    async (name?: string, asCopy = false) => {
      const current = currentProfileRef.current;
      const isBuiltin = BUILTIN_PALETTES.some((palette) => palette.id === current.id);
      const id = asCopy || isBuiltin ? `gp-${crypto.randomUUID()}` : current.id;
      const saved = createGovernanceProfile({
        ...current,
        id,
        name: name?.trim() || current.name,
        updatedAt: new Date().toISOString(),
        ...(id !== current.id
          ? {
              createdAt: new Date().toISOString(),
              provenance: { ...current.provenance, originalId: current.id },
            }
          : {}),
      });
      const result = await updateLibrary((state) => ({
        ...state,
        themes: state.themes.some((theme) => theme.id === id)
          ? state.themes.map((theme) => (theme.id === id ? saved : theme))
          : [...state.themes, saved],
        drafts: state.drafts.filter(
          (draft) => draft.id !== id && !(isBuiltin && draft.id === current.id)
        ),
        editorSession: { ...sessionRef.current, activeThemeId: id },
      }));
      if (!result) return false;
      workingDrafts.current.set(id, saved);
      applyCompleteTheme(saved, true);
      setToast(`Saved on this browser: ${saved.name}`);
      return true;
    },
    [updateLibrary, applyCompleteTheme]
  );

  const requestThemeSwitch = useCallback(
    (action: () => void) => {
      if (dirtyTheme) setPendingThemeSwitch(() => action);
      else action();
    },
    [dirtyTheme]
  );

  const selectThemeNow = useCallback(
    (id: string, personal: boolean) => {
      const slot = myThemeSlotsRef.current.find((item) => item.id === id);
      const palette = allPalettes.find((item) => item.id === id);
      const theme =
        workingDrafts.current.get(id) ??
        libraryRef.current?.drafts.find((item) => item.id === id) ??
        libraryRef.current?.themes.find((item) => item.id === id) ??
        (slot ? migrateSlotToProfile(slot) : palette ? paletteToCompleteTheme(palette) : undefined);
      if (!theme) return;
      applyCompleteTheme(theme, personal);
      setRecentPaletteIds((previous) =>
        [id, ...previous.filter((item) => item !== id)].slice(0, RECENT_PALETTES_MAX)
      );
    },
    [allPalettes, applyCompleteTheme, libraryRef]
  );

  const handleSelectPalette = useCallback(
    (id: string) => {
      if (currentProfileRef.current.id !== id) requestThemeSwitch(() => selectThemeNow(id, false));
    },
    [requestThemeSwitch, selectThemeNow]
  );

  const handleColorChange = useCallback(
    (key: string, value: string) => {
      if (activeMyThemeSlotId) {
        updateMyThemeSlots((prev) =>
          prev.map((s) =>
            s.id === activeMyThemeSlotId
              ? {
                  ...s,
                  colors: s.colors.map((c) => (c.key === key ? { ...c, value } : c)),
                  updatedAt: new Date().toISOString(),
                }
              : s
          )
        );
        return;
      }
      setCustomColors((prev) => {
        const base = allPalettes.find((p) => p.id === selectedPaletteId);
        if (!base) return prev;
        const existing = prev[selectedPaletteId] ?? base.colors.map((c) => ({ ...c }));
        const updated = existing.map((c) => (c.key === key ? { ...c, value } : c));
        return { ...prev, [selectedPaletteId]: updated };
      });
    },
    [allPalettes, selectedPaletteId, activeMyThemeSlotId]
  );

  const handleLookChange = useCallback(
    (newLook: MermaidLook) => {
      if (activeMyThemeSlotId) {
        updateMyThemeSlots((prev) =>
          prev.map((s) =>
            s.id === activeMyThemeSlotId
              ? { ...s, look: newLook, updatedAt: new Date().toISOString() }
              : s
          )
        );
      } else {
        setLook(newLook);
      }
    },
    [activeMyThemeSlotId]
  );

  const handleFontSizeChange = useCallback(
    (newSize: string) => {
      if (activeMyThemeSlotId) {
        updateMyThemeSlots((prev) =>
          prev.map((s) =>
            s.id === activeMyThemeSlotId
              ? { ...s, fontSize: newSize, updatedAt: new Date().toISOString() }
              : s
          )
        );
      } else {
        setFontSize(newSize);
      }
    },
    [activeMyThemeSlotId]
  );

  const handleTypographyChange = useCallback(
    (newTypo: import("@/lib/typography").TypographySettings) => {
      if (activeMyThemeSlotId) {
        updateMyThemeSlots((prev) =>
          prev.map((s) =>
            s.id === activeMyThemeSlotId
              ? { ...s, typography: newTypo, updatedAt: new Date().toISOString() }
              : s
          )
        );
      } else {
        setTypography(newTypo);
      }
    },
    [activeMyThemeSlotId]
  );

  const handleCustomThemeNameChange = useCallback(
    (newName: string) => {
      if (activeMyThemeSlotId) {
        updateMyThemeSlots((prev) =>
          prev.map((s) =>
            s.id === activeMyThemeSlotId
              ? { ...s, name: newName, updatedAt: new Date().toISOString() }
              : s
          )
        );
      } else {
        setCustomThemeName(newName);
      }
    },
    [activeMyThemeSlotId]
  );

  const handleSelectMyThemeSlot = useCallback(
    (id: string) => {
      if (currentProfileRef.current.id !== id) requestThemeSwitch(() => selectThemeNow(id, true));
    },
    [requestThemeSwitch, selectThemeNow]
  );

  const handleAddMyThemeSlot = useCallback(() => {
    requestThemeSwitch(() => {
      const profile = createGovernanceProfile({
        ...currentProfileRef.current,
        id: `gp-${crypto.randomUUID()}`,
        name: `My theme ${myThemeSlotsRef.current.length + 1}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      workingDrafts.current.set(profile.id, profile);
      applyCompleteTheme(profile, true);
    });
  }, [requestThemeSwitch, applyCompleteTheme]);

  const handleDeleteMyThemeSlot = useCallback(
    async (id: string) => {
      const result = await updateLibrary((state) => ({
        ...state,
        themes: state.themes.filter((theme) => theme.id !== id),
        drafts: state.drafts.filter((theme) => theme.id !== id),
        editorSession: {
          ...sessionRef.current,
          activeThemeId:
            sessionRef.current.activeThemeId === id ? null : sessionRef.current.activeThemeId,
        },
      }));
      if (!result) return;
      workingDrafts.current.delete(id);
      updateMyThemeSlots((slots) => slots.filter((slot) => slot.id !== id));
      if (currentProfileRef.current.id === id)
        applyCompleteTheme(paletteToCompleteTheme(BRAND_PALETTES[0]), false);
      setToast("Theme removed. Diagram text is unchanged.");
    },
    [updateLibrary, updateMyThemeSlots, applyCompleteTheme]
  );

  const profileForId = useCallback(
    (id: string) => {
      if (id === currentProfileRef.current.id) return currentProfileRef.current;
      return (
        workingDrafts.current.get(id) ??
        libraryRef.current?.drafts.find((theme) => theme.id === id) ??
        libraryRef.current?.themes.find((theme) => theme.id === id)
      );
    },
    [libraryRef]
  );

  const handleExportMyThemeSlot = useCallback(
    (id: string) => {
      const profile = profileForId(id);
      if (!profile) return;
      downloadTextFile(
        makeFilename(profile.name, "theme", "json"),
        profileToPortableJson(profile),
        "application/json"
      );
    },
    [profileForId]
  );

  const handleImportGovernanceProfile = useCallback(
    (profile: GovernanceProfile, warnings: string[]) => {
      setPendingThemeImport((previous) => ({
        themes: [...(previous?.themes ?? []), profile],
        warnings: [...(previous?.warnings ?? []), ...warnings],
      }));
    },
    []
  );

  const handleImportMyThemeSlot = useCallback(
    (
      palette: Palette,
      warnings: {
        invalidValues: Array<{ key: string; value: string }>;
        warnValues: Array<{ key: string; value: string }>;
      }
    ) => {
      setPendingThemeImport((previous) => ({
        themes: [...(previous?.themes ?? []), paletteToCompleteTheme(palette)],
        warnings: [
          ...(previous?.warnings ?? []),
          "This legacy palette did not store complete theme settings. Review the default destination, typography, and output preferences.",
          ...warnings.invalidValues.map((item) => `Invalid color value: ${item.key}`),
          ...warnings.warnValues.map((item) => `Review color value: ${item.key}`),
        ],
      }));
    },
    []
  );

  const handleShowProfileDetails = useCallback((id: string) => {
    setProfileDetailSlotId(id);
  }, []);

  const handleCopyProfileShareLink = useCallback(
    async (id: string) => {
      const profile = profileForId(id);
      if (!profile) return;
      try {
        await writeToClipboard(buildProfileShareUrl(profile));
        setToast(
          "Theme link copied. The complete theme is embedded in the URL and visible to recipients."
        );
      } catch (error) {
        setToast(
          error instanceof Error
            ? error.message
            : "Could not copy the theme link. Download the theme JSON instead."
        );
      }
    },
    [profileForId]
  );

  const handleReferenceShareLink = useCallback(async () => {
    await handleCopyProfileShareLink(currentProfileRef.current.id);
  }, [handleCopyProfileShareLink]);

  /**
   * Generate themed export code formatted for a specific renderer and copy it
   * to the clipboard.  Renderers with partial %%{init}%% support always receive
   * the init-directive format regardless of the user's current outputFormat
   * setting; fully-supported renderers respect the user's preference.
   */
  const handleCopyForRenderer = useCallback(
    async (rendererId: string) => {
      const renderer = getRendererById(rendererId);
      if (!renderer) return;
      if (!inputCode.trim()) {
        showToast("No diagram to copy. Add Mermaid diagram code first.");
        return;
      }
      // Renderers with partial init-directive support: force init-directive.
      // Full-support renderers: respect the user's chosen output format.
      const format: "init-directive" | "frontmatter" =
        renderer.initDirectiveSupport === "partial" ? "init-directive" : outputFormat;
      const code = generateThemedCode(inputCode, {
        palette: selectedPalette,
        diagramFamily: detectDiagram(inputCode).family,
        outputFormat: format,
        look: effectiveLook,
        fontSize: effectiveFontSize,
        typography: effectiveTypography,
        advancedMermaidConfig: advancedMermaidConfig as AdvancedMermaidConfig,
        includeMetaComments,
        includeBadge,
        customThemeName: effectiveCustomThemeName,
        strokeWidth,
      });
      await writeToClipboard(code);
      showToast(`Copied for ${renderer.shortName}`);
    },
    [
      inputCode,
      selectedPalette,
      effectiveLook,
      effectiveFontSize,
      effectiveTypography,
      advancedMermaidConfig,
      includeMetaComments,
      includeBadge,
      effectiveCustomThemeName,
      outputFormat,
      strokeWidth,
    ]
  );

  const handleRenameMyThemeSlot = useCallback(
    async (id: string, name: string) => {
      const profile = profileForId(id);
      if (!profile || !name.trim()) return;
      const renamed = { ...profile, name: name.trim(), updatedAt: new Date().toISOString() };
      const result = await updateLibrary((state) => ({
        ...state,
        themes: state.themes.map((theme) =>
          theme.id === id ? { ...theme, name: renamed.name, updatedAt: renamed.updatedAt } : theme
        ),
        drafts: [...state.drafts.filter((theme) => theme.id !== id), renamed],
      }));
      if (!result) return;
      workingDrafts.current.set(id, renamed);
      updateMyThemeSlots((slots) =>
        slots.map((slot) => (slot.id === id ? profileToSlot(renamed) : slot))
      );
    },
    [profileForId, updateLibrary, updateMyThemeSlots]
  );

  const handleImportIntoProfileDetailSlot = useCallback(
    (profile: GovernanceProfile, warnings: string[]) => {
      if (profileDetailSlotId)
        setPendingThemeImport({ themes: [profile], warnings, replaceId: profileDetailSlotId });
    },
    [profileDetailSlotId]
  );

  const handleImportAsNewSlot = handleImportMyThemeSlot;

  const handleDuplicateMyThemeSlot = useCallback(
    (id: string): MyThemeSlotId | null => {
      const profile = profileForId(id);
      if (!profile) return null;
      const copy = createGovernanceProfile({
        ...profile,
        id: `gp-${crypto.randomUUID()}`,
        name: `${profile.name} (copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      requestThemeSwitch(() => {
        workingDrafts.current.set(copy.id, copy);
        applyCompleteTheme(copy, true);
        setToast("Independent theme copy created as a draft. Save it when ready.");
      });
      return copy.id;
    },
    [profileForId, requestThemeSwitch, applyCompleteTheme]
  );

  const moveTheme = useCallback(
    async (id: string, direction: -1 | 1) => {
      const slots = myThemeSlotsRef.current;
      const index = slots.findIndex((slot) => slot.id === id);
      if (index < 0 || index + direction < 0 || index + direction >= slots.length) return;
      const reordered = [...slots];
      [reordered[index], reordered[index + direction]] = [
        reordered[index + direction],
        reordered[index],
      ];
      const order = new Map(reordered.map((slot, position) => [slot.id, position]));
      const result = await updateLibrary((state) => ({
        ...state,
        themes: [...state.themes].sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)),
        drafts: [...state.drafts].sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)),
        themeOrder: reordered.map((slot) => slot.id),
      }));
      if (result) updateMyThemeSlots(reordered);
    },
    [updateLibrary, updateMyThemeSlots]
  );
  const handleMoveMyThemeSlotUp = useCallback(
    (id: string) => {
      void moveTheme(id, -1);
    },
    [moveTheme]
  );
  const handleMoveMyThemeSlotDown = useCallback(
    (id: string) => {
      void moveTheme(id, 1);
    },
    [moveTheme]
  );

  const handleResetPalette = useCallback(() => {
    if (activeMyThemeSlotId) {
      updateMyThemeSlots((prev) =>
        prev.map((s) =>
          s.id === activeMyThemeSlotId
            ? {
                ...s,
                colors: slotBaseColors.map((c) => ({ ...c })),
                updatedAt: new Date().toISOString(),
              }
            : s
        )
      );
      return;
    }
    setCustomColors((prev) => {
      const next = { ...prev };
      delete next[selectedPaletteId];
      return next;
    });
    setCustomThemeName("");
  }, [activeMyThemeSlotId, selectedPaletteId, slotBaseColors]);

  const resetAllPaletteCustomizations = useCallback(async () => {
    const reset = (theme: GovernanceProfile) => {
      const palette = BUILTIN_PALETTES.find((item) => item.id === theme.id);
      const saved = libraryRef.current?.themes.find((item) => item.id === theme.id);
      const colors = saved?.colors ?? palette?.colors ?? BRAND_PALETTES[0].colors;
      return { ...theme, colors: structuredClone(colors) };
    };
    const drafts = [...workingDrafts.current.values()].map(reset);
    const result = await updateLibrary((state) => ({
      ...state,
      drafts: [
        ...state.drafts.filter((draft) => !drafts.some((item) => item.id === draft.id)),
        ...drafts,
      ],
    }));
    if (!result) return;
    for (const draft of drafts) workingDrafts.current.set(draft.id, draft);
    updateMyThemeSlots((slots) =>
      slots.map((slot) => profileToSlot(reset(migrateSlotToProfile(slot))))
    );
    setCustomColors({});
    const active = drafts.find((draft) => draft.id === currentProfileRef.current.id);
    if (active) applyCompleteTheme(active, !!activeMyThemeSlotId);
    setToast("All palette customizations reset.");
  }, [libraryRef, updateLibrary, updateMyThemeSlots, applyCompleteTheme, activeMyThemeSlotId]);

  /** Reset a single swatch back to its base palette value. If clearing this
   *  override leaves the palette with no remaining customizations, the
   *  override entry is removed entirely so `hasCustomizations` flips false. */
  const handleResetColor = useCallback(
    (key: string) => {
      setCustomColors((prev) => {
        const base = allPalettes.find((p) => p.id === selectedPaletteId);
        const overrides = prev[selectedPaletteId];
        if (!base || !overrides) return prev;
        const restored = overrides.map((c) => {
          if (c.key !== key) return c;
          const baseColor = base.colors.find((bc) => bc.key === key);
          return baseColor ? { ...c, value: baseColor.value } : c;
        });
        const stillCustomized = restored.some((c) => {
          const baseColor = base.colors.find((bc) => bc.key === c.key);
          return baseColor ? baseColor.value !== c.value : false;
        });
        const next = { ...prev };
        if (stillCustomized) {
          next[selectedPaletteId] = restored;
        } else {
          delete next[selectedPaletteId];
        }
        return next;
      });
    },
    [allPalettes, selectedPaletteId]
  );

  const handleLoadExample = useCallback((code: string) => {
    setInputCode(code);
    setActiveTab("apply");
  }, []);

  const handleExtractFromCode = useCallback(
    (extractedName?: string): Palette | null => {
      if (!hasExtractableTheme(inputCode)) {
        setToast("No theme directive found in the diagram.");
        return null;
      }
      const extracted = extractTheme(inputCode);
      const palette = paletteFromExtracted(extracted, extractedName ?? "Extracted theme");
      requestThemeSwitch(() => applyCompleteTheme(paletteToCompleteTheme(palette), true));
      return palette;
    },
    [inputCode, requestThemeSwitch, applyCompleteTheme]
  );

  const handleUseExtractedTheme = useCallback(
    (palette: Palette, codeWithClassDefs?: string) => {
      requestThemeSwitch(() => {
        const theme = paletteToCompleteTheme(palette);
        theme.id = uniqueThemeId(theme.id, new Set(myThemeSlotsRef.current.map((slot) => slot.id)));
        applyCompleteTheme(theme, true);
        if (codeWithClassDefs?.trim()) setInputCode(codeWithClassDefs);
        setToast("Extracted theme opened as a draft. Save it when ready.");
      });
    },
    [requestThemeSwitch, applyCompleteTheme]
  );

  const handleSavePalette = useCallback(
    (name: string) => saveCompleteTheme(name, true),
    [saveCompleteTheme]
  );

  const handleThemeSwitchDecision = useCallback(
    async (choice: "save" | "keep" | "discard" | "cancel") => {
      const next = pendingThemeSwitch;
      if (!next || choice === "cancel") {
        setPendingThemeSwitch(null);
        return;
      }
      const current = currentProfileRef.current;
      if (choice === "save") {
        if (!(await saveCompleteTheme())) return;
      } else {
        const result = await updateLibrary((state) => ({
          ...state,
          drafts: [
            ...state.drafts.filter((draft) => draft.id !== current.id),
            ...(choice === "keep" ? [current] : []),
          ],
          editorSession: sessionRef.current,
        }));
        if (!result) return;
        if (choice === "discard") {
          workingDrafts.current.delete(current.id);
          const saved = result.themes.find((theme) => theme.id === current.id);
          updateMyThemeSlots((slots) =>
            saved
              ? slots.map((slot) => (slot.id === current.id ? profileToSlot(saved) : slot))
              : slots.filter((slot) => slot.id !== current.id)
          );
        }
      }
      setPendingThemeSwitch(null);
      next();
    },
    [pendingThemeSwitch, saveCompleteTheme, updateLibrary, updateMyThemeSlots]
  );

  const commitThemeImport = useCallback(
    async (replace: boolean) => {
      if (!pendingThemeImport) return;
      const incoming = pendingThemeImport;
      let copies: GovernanceProfile[] = [];
      setImportingTheme(true);
      const result = await updateLibrary((state) => {
        const used = new Set([
          ...BUILTIN_PALETTES.map((palette) => palette.id),
          ...state.themes.map((theme) => theme.id),
          ...state.drafts.map((draft) => draft.id),
        ]);
        copies = incoming.themes.map((theme) =>
          createGovernanceProfile({
            ...theme,
            id: replace && incoming.replaceId ? incoming.replaceId : uniqueThemeId(theme.id, used),
            provenance: { ...theme.provenance, originalId: theme.id },
          })
        );
        const ids = new Set(copies.map((theme) => theme.id));
        return {
          ...state,
          themes: [...state.themes.filter((theme) => !ids.has(theme.id)), ...copies],
          drafts: state.drafts.filter((draft) => !ids.has(draft.id)),
          editorSession: sessionRef.current,
        };
      });
      setImportingTheme(false);
      if (!result) return;
      for (const profile of copies) workingDrafts.current.set(profile.id, profile);
      updateMyThemeSlots((slots) => [
        ...slots.filter((slot) => !copies.some((theme) => theme.id === slot.id)),
        ...copies.map(profileToSlot),
      ]);
      setPendingThemeImport(null);
      setToast(
        `Imported ${copies.length} complete theme${copies.length === 1 ? "" : "s"}. Select one to apply it. Diagram text is unchanged.`
      );
    },
    [pendingThemeImport, updateLibrary, updateMyThemeSlots]
  );

  const downloadWorkspaceRecovery = useCallback(() => {
    const raw: Record<string, string | null> = {};
    try {
      raw[LEGACY_THEME_KEY] = localStorage.getItem(LEGACY_THEME_KEY);
      raw[THEME_LIBRARY_KEY] = localStorage.getItem(THEME_LIBRARY_KEY);
      for (let index = 0; index < localStorage.length; index++) {
        const key = localStorage.key(index);
        if (key?.startsWith("mtb.recovery.")) raw[key] = localStorage.getItem(key);
      }
    } catch {
      /* The in-memory workspace remains exportable without storage access. */
    }
    const workspace = themeLibrary.recover([...workingDrafts.current.values()], sessionRef.current);
    downloadTextFile(
      "mermaid-theme-workspace-recovery.json",
      JSON.stringify(
        {
          type: WORKSPACE_RECOVERY_TYPE,
          schemaVersion: 1,
          includesDiagramText: true,
          workspace,
          originalStorage: raw,
        },
        null,
        2
      ),
      "application/json"
    );
  }, [themeLibrary.recover]);

  const handleImportThemeFile = useCallback((json: string) => {
    const result = parseThemeImport(json);
    if (result.ok) {
      setThemeImportError(null);
      setImportDiagnostics(result.diagnostics ?? null);
      setPendingThemeImport((previous) => ({
        themes: [...(previous?.themes ?? []), ...result.themes],
        warnings: [...(previous?.warnings ?? []), ...result.warnings],
      }));
    } else setThemeImportError(result.error);
  }, []);

  const handleImportPalette = useCallback((palette: Palette) => {
    setPendingThemeImport({
      themes: [paletteToCompleteTheme(palette)],
      warnings: ["Legacy palette settings use documented defaults."],
    });
  }, []);

  const handleDeleteUserPalette = useCallback(
    (id: string) => {
      void handleDeleteMyThemeSlot(id);
    },
    [handleDeleteMyThemeSlot]
  );

  const showToast = useCallback((msg: ReactNode) => setToast(msg), []);

  const handleResetSyntaxHints = useCallback(() => {
    clearAllDismissals();
    setHintResetToken((t) => t + 1);
    setToast("Syntax tips restored.");
  }, []);

  useEffect(() => {
    if (!showSettingsMenu) return;
    function onPointerDown(e: PointerEvent) {
      if (
        settingsMenuRef.current?.contains(e.target as Node) ||
        settingsBtnRef.current?.contains(e.target as Node)
      )
        return;
      setShowSettingsMenu(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setShowSettingsMenu(false);
        settingsBtnRef.current?.focus();
      } else if (e.key === "Tab") {
        setShowSettingsMenu(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [showSettingsMenu]);

  // Reset the palette-reset confirmation when the settings menu is dismissed.
  useEffect(() => {
    if (!showSettingsMenu) setConfirmResetPalettes(false);
  }, [showSettingsMenu]);

  const handleRecordExampleType = useCallback((id: string, type: "flowchart" | "sequence") => {
    setLastExampleType((prev) => ({ ...prev, [id]: type }));
  }, []);

  return (
    <div className="forge-shell">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:rounded-md focus:bg-card focus:text-foreground focus:shadow-lg focus:ring-2 focus:ring-primary focus:outline-none text-sm font-medium"
      >
        Skip to main content
      </a>
      <header className="forge-header sticky top-0 z-20 px-4 md:px-6 py-3 flex items-center justify-between gap-4 shrink-0 print-hide">
        <div className="flex items-center gap-3">
          <AppIcon size={28} aria-hidden="true" />
          <div>
            <div className="flex items-baseline gap-2 leading-none">
              <h1 className="forge-header-title">Mermaid Theme Builder</h1>
            </div>
            <p className="forge-header-subtitle">One visual style. Many diagrams.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-[10px]">
            <span className="forge-header-badge">OKHP³</span>
            <span className="forge-header-sep">·</span>
            <span className="forge-header-meta">v{__APP_VERSION__}</span>
          </div>
          <ThemeModeToggle
            mode={themeMode}
            cycle={cycleThemeMode}
            className="forge-header-icon-btn print-hide"
          />
          <div className="relative">
            <button
              type="button"
              ref={settingsBtnRef}
              onClick={() => setShowSettingsMenu((v) => !v)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  if (!showSettingsMenu) {
                    // Menu not yet in the DOM — open it, then wait for render
                    setShowSettingsMenu(true);
                    requestAnimationFrame(() => {
                      settingsMenuRef.current
                        ?.querySelector<HTMLElement>('[role="menuitem"]')
                        ?.focus();
                    });
                  } else {
                    // Menu already rendered — focus synchronously
                    settingsMenuRef.current
                      ?.querySelector<HTMLElement>('[role="menuitem"]')
                      ?.focus();
                  }
                } else if (e.key === "ArrowUp") {
                  // WAI-ARIA §3.15: ArrowUp opens menu and focuses the last item.
                  e.preventDefault();
                  const focusLast = () => {
                    const items =
                      settingsMenuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]');
                    if (items?.length) items[items.length - 1].focus();
                  };
                  if (!showSettingsMenu) {
                    setShowSettingsMenu(true);
                    requestAnimationFrame(focusLast);
                  } else {
                    focusLast();
                  }
                }
              }}
              aria-label="Settings"
              title="Settings"
              aria-expanded={showSettingsMenu}
              aria-haspopup="menu"
              className="forge-header-icon-btn print-hide"
            >
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-3.5 h-3.5"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            {showSettingsMenu && (
              <div
                ref={settingsMenuRef}
                role="menu"
                aria-label="Settings"
                className="absolute top-full right-0 mt-1.5 z-50 rounded-lg border border-border bg-card shadow-lg overflow-hidden"
                style={{ minWidth: "192px" }}
                onKeyDown={(e) => {
                  const items = Array.from(
                    settingsMenuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ??
                      []
                  );
                  if (items.length === 0) return;
                  const idx = items.indexOf(document.activeElement as HTMLElement);
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    items[(idx + 1) % items.length]?.focus();
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    items[(idx - 1 + items.length) % items.length]?.focus();
                  } else if (e.key === "Home") {
                    e.preventDefault();
                    items[0]?.focus();
                  } else if (e.key === "End") {
                    e.preventDefault();
                    items[items.length - 1]?.focus();
                  }
                }}
              >
                <div className="px-3 py-1.5 border-b border-border/60">
                  <span className="forge-eyebrow text-muted-foreground/60">Settings</span>
                </div>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    handleResetSyntaxHints();
                    setShowSettingsMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left text-foreground hover:bg-muted transition-colors"
                >
                  <svg
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className="w-3.5 h-3.5 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  >
                    <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm6.5-1.5A.75.75 0 017.25 6h1a.75.75 0 01.75.75v3.75h.25a.75.75 0 010 1.5h-2a.75.75 0 010-1.5h.25V7.5h-.25a.75.75 0 01-.75-.75zM8 4a1 1 0 110 2 1 1 0 010-2z" />
                  </svg>
                  Reset all syntax tips
                </button>
                {confirmResetPalettes ? (
                  <div className="px-3 py-2 border-t border-border/60">
                    <p className="text-xs text-foreground mb-2">
                      Reset all?{" "}
                      <span className="text-muted-foreground">This can&apos;t be undone.</span>
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        role="menuitem"
                        autoFocus
                        onClick={() => {
                          void resetAllPaletteCustomizations();
                          setConfirmResetPalettes(false);
                          setShowSettingsMenu(false);
                        }}
                        className="flex-1 rounded px-2 py-1 text-xs font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 dark:bg-destructive/20 dark:text-foreground dark:hover:bg-destructive/30 transition-colors"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => setConfirmResetPalettes(false)}
                        className="flex-1 rounded px-2 py-1 text-xs font-medium bg-muted text-foreground hover:bg-muted/80 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => setConfirmResetPalettes(true)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left text-foreground hover:bg-muted transition-colors"
                  >
                    <svg
                      viewBox="0 0 16 16"
                      fill="currentColor"
                      className="w-3.5 h-3.5 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8 3a5 5 0 1 0 4.546 2.914.75.75 0 0 1 1.357-.637A6.5 6.5 0 1 1 8 2v1.5a.75.75 0 0 1-1.5 0V.75a.75.75 0 0 1 .75-.75h2.25a.75.75 0 0 1 0 1.5H8Z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Reset all palette customizations
                  </button>
                )}
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setRecentPaletteIds([]);
                    setToast("Recent palette history cleared.");
                    setShowSettingsMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left text-foreground hover:bg-muted transition-colors"
                >
                  <svg
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className="w-3.5 h-3.5 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M1 8a7 7 0 1 1 14 0A7 7 0 0 1 1 8Zm7.75-4.25a.75.75 0 0 0-1.5 0V8c0 .414.336.75.75.75h3.25a.75.75 0 0 0 0-1.5h-2.5v-3.5Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Clear recent palette history
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setPendingClearSettings(true);
                    setShowSettingsMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left text-foreground hover:bg-muted transition-colors border-t border-border/60"
                >
                  <svg
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className="w-3.5 h-3.5 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.711Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Clear all settings
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <nav
        ref={tabsRef}
        className="hidden md:flex border-b border-border bg-card/60 px-4 shrink-0 print-hide"
        role="tablist"
        aria-label="Mermaid Theme Builder sections"
        hidden={hydrated && !firstVisitComplete}
        onKeyDown={(e) => {
          if (
            e.key !== "ArrowLeft" &&
            e.key !== "ArrowRight" &&
            e.key !== "Home" &&
            e.key !== "End"
          )
            return;
          e.preventDefault();
          const idx = TAB_CONFIG.findIndex((t) => t.id === activeTab);
          let next = idx;
          if (e.key === "ArrowLeft") next = (idx - 1 + TAB_CONFIG.length) % TAB_CONFIG.length;
          else if (e.key === "ArrowRight") next = (idx + 1) % TAB_CONFIG.length;
          else if (e.key === "Home") next = 0;
          else if (e.key === "End") next = TAB_CONFIG.length - 1;
          const nextId = TAB_CONFIG[next].id;
          setActiveTab(nextId);
          requestAnimationFrame(() => {
            const btn = tabsRef.current?.querySelector<HTMLButtonElement>(
              `[data-tab-id="${nextId}"]`
            );
            btn?.focus();
          });
        }}
      >
        {TAB_CONFIG.map((tab) => {
          const selected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              data-tab-id={tab.id}
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`tabpanel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActiveTab(tab.id)}
              className={`forge-tab${selected ? " forge-tab-active" : ""}`}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </nav>

      {hydrated && firstVisitComplete && (
        <ThemeLibraryStatus
          name={currentProfile.name}
          destination={getRendererById(rendererTarget)?.shortName ?? rendererTarget}
          dirty={dirtyTheme}
          saved={!!themeLibrary.state?.themes.some((theme) => theme.id === currentProfile.id)}
          recovered={
            initialLibrary.ok &&
            initialLibrary.state.drafts.some((draft) => draft.id === currentProfile.id)
          }
          busy={themeLibrary.busy}
          error={themeLibrary.error}
          warnings={[
            ...(currentProfile.provenance?.missingFields?.length
              ? ["Recovered theme: review defaults for settings that were not recorded."]
              : []),
            ...(currentProfile.semanticClassDefs?.length
              ? ["Recorded semantic definitions are retained but not applied to rendering."]
              : []),
            ...(Object.keys(currentProfile.advancedMermaidConfig ?? {}).some(
              (key) => !["htmlLabels", "deterministicIds", "deterministicIDSeed"].includes(key)
            )
              ? ["Unsupported advanced settings are retained but not applied to rendering."]
              : []),
          ]}
          onSave={() => saveCompleteTheme()}
          onSaveCopy={(name) => saveCompleteTheme(name, true)}
          onRecovery={downloadWorkspaceRecovery}
          onBackup={() => {
            if (libraryRef.current)
              downloadTextFile(
                "my-themes.theme-library.json",
                libraryToPortableJson(libraryRef.current),
                "application/json"
              );
          }}
          onRestore={(json) => {
            const result = parseLibraryImport(json);
            if (result.ok) setPendingThemeImport(result);
            else setThemeImportError(result.error);
          }}
        />
      )}

      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 md:overflow-hidden pb-20 md:pb-0 md:min-h-0 outline-none"
      >
        {hydrated && !firstVisitComplete ? (
          <RouteSelector onSelect={handleRouteSelect} />
        ) : (
          <>
            {/* ApplyTab is always mounted so its local state (activeDiagramIdx,
            showColorEditor, textareaExpanded, familyOverride, etc.) survives
            tab switches. It is visually hidden via the HTML `hidden` attribute
            when another tab is active. */}
            <div
              role="tabpanel"
              id="tabpanel-apply"
              aria-label="Apply"
              tabIndex={-1}
              className="md:h-full"
              hidden={activeTab !== "apply"}
            >
              <ApplyTab
                completeTheme={currentProfile}
                selectedPalette={selectedPalette}
                selectedPaletteId={selectedPaletteId}
                onSelectPalette={handleSelectPalette}
                customColors={customColors}
                onColorChange={handleColorChange}
                onResetPalette={handleResetPalette}
                onResetColor={handleResetColor}
                hasCustomizations={hasCustomizations}
                inputCode={inputCode}
                onInputChange={setInputCode}
                includeMetaComments={includeMetaComments}
                includeBadge={includeBadge}
                customThemeName={effectiveCustomThemeName}
                effectiveThemeName={effectiveThemeName}
                onSwitchTab={setActiveTab}
                onExtractTheme={handleExtractFromCode}
                userPalettes={userPalettes}
                onShowToast={showToast}
                recentPaletteIds={recentPaletteIds}
                look={effectiveLook}
                onLookChange={handleLookChange}
                fontSize={effectiveFontSize}
                onFontSizeChange={handleFontSizeChange}
                typography={effectiveTypography}
                rendererTarget={rendererTarget}
                onRendererTargetChange={handleRendererTargetChange}
                outputFormat={outputFormat}
                onOutputFormatChange={handleOutputFormatChange}
                outputFormatOverridden={outputFormatOverridden}
                onResetOutputFormat={handleResetOutputFormat}
                onNavigateToRendererExport={handleNavigateToRendererExport}
                strokeWidth={strokeWidth}
                lastExampleType={lastExampleType}
                onRecordExampleType={handleRecordExampleType}
                previewMode={previewMode}
                onPreviewModeChange={setPreviewMode}
                hintResetToken={hintResetToken}
                settingsResetToken={settingsResetToken}
                onResetSyntaxHints={handleResetSyntaxHints}
                myThemeSlots={myThemeSlots}
                activeMyThemeSlotId={activeMyThemeSlotId}
                onSelectMyThemeSlot={handleSelectMyThemeSlot}
                onAddMyThemeSlot={handleAddMyThemeSlot}
                onDeleteMyThemeSlot={handleDeleteMyThemeSlot}
                onExportMyThemeSlot={handleExportMyThemeSlot}
                onDuplicateMyThemeSlot={handleDuplicateMyThemeSlot}
                onRenameMyThemeSlot={handleRenameMyThemeSlot}
                onMoveMyThemeSlotUp={handleMoveMyThemeSlotUp}
                onMoveMyThemeSlotDown={handleMoveMyThemeSlotDown}
                onImportAsNewSlot={handleImportAsNewSlot}
                onImportThemeFile={handleImportThemeFile}
                onShowProfileDetails={handleShowProfileDetails}
                advancedMermaidConfig={advancedMermaidConfig}
              />
            </div>
            <div
              role="tabpanel"
              id={`tabpanel-${activeTab}`}
              aria-label={TAB_CONFIG.find((t) => t.id === activeTab)?.label ?? activeTab}
              tabIndex={-1}
              className="md:h-full"
              hidden={activeTab === "apply"}
            >
              {activeTab === "compose" && (
                <ComposeTab
                  selectedPalette={selectedPalette}
                  selectedPaletteId={selectedPaletteId}
                  onSelectPalette={handleSelectPalette}
                  customColors={customColors}
                  onColorChange={handleColorChange}
                  onResetPalette={handleResetPalette}
                  hasCustomizations={hasCustomizations}
                  includeMetaComments={includeMetaComments}
                  onIncludeMetaCommentsChange={setIncludeMetaComments}
                  includeBadge={includeBadge}
                  onIncludeBadgeChange={setIncludeBadge}
                  customThemeName={effectiveCustomThemeName}
                  onCustomThemeNameChange={handleCustomThemeNameChange}
                  effectiveThemeName={effectiveThemeName}
                  userPalettes={userPalettes}
                  onSavePalette={handleSavePalette}
                  completeTheme={currentProfile}
                  savedThemeCount={themeLibrary.state?.themes.length ?? 0}
                  onExportLibrary={() => {
                    if (libraryRef.current)
                      downloadTextFile(
                        "my-themes.theme-library.json",
                        libraryToPortableJson(libraryRef.current),
                        "application/json"
                      );
                  }}
                  onImportPalette={handleImportPalette}
                  onDeleteUserPalette={handleDeleteUserPalette}
                  onShowToast={showToast}
                  look={effectiveLook}
                  onLookChange={handleLookChange}
                  fontSize={effectiveFontSize}
                  onFontSizeChange={handleFontSizeChange}
                  typography={effectiveTypography}
                  onTypographyChange={handleTypographyChange}
                  rendererTarget={rendererTarget}
                  onRendererTargetChange={handleRendererTargetChange}
                  strokeWidth={strokeWidth}
                  onStrokeWidthChange={setStrokeWidth}
                  onUseExtractedTheme={handleUseExtractedTheme}
                  onSwitchTab={setActiveTab}
                  onNavigateToParityMatrix={handleNavigateToParityMatrix}
                  importDiagnostics={importDiagnostics}
                  onImportDiagnosticsChange={setImportDiagnostics}
                  myThemeSlots={myThemeSlots}
                  activeMyThemeSlotId={activeMyThemeSlotId}
                  onSelectMyThemeSlot={handleSelectMyThemeSlot}
                  onAddMyThemeSlot={handleAddMyThemeSlot}
                  onDeleteMyThemeSlot={handleDeleteMyThemeSlot}
                  onExportMyThemeSlot={handleExportMyThemeSlot}
                  onImportAsNewSlot={handleImportAsNewSlot}
                  onImportThemeFile={handleImportThemeFile}
                  onImportMyThemeSlot={handleImportMyThemeSlot}
                  onImportGovernanceProfile={handleImportGovernanceProfile}
                  onDuplicateMyThemeSlot={handleDuplicateMyThemeSlot}
                  onRenameMyThemeSlot={handleRenameMyThemeSlot}
                  onMoveMyThemeSlotUp={handleMoveMyThemeSlotUp}
                  onMoveMyThemeSlotDown={handleMoveMyThemeSlotDown}
                  onShowProfileDetails={handleShowProfileDetails}
                  onCopyProfileShareLink={handleCopyProfileShareLink}
                  customThemeNamePlaceholder={
                    activeMyThemeSlotId ? slotDisplayName(activeMyThemeSlotId) : undefined
                  }
                  advancedMermaidConfig={advancedMermaidConfig}
                  onAdvancedMermaidConfigChange={setAdvancedMermaidConfig}
                />
              )}
              {activeTab === "examples" && (
                <ExamplesTab
                  selectedPalette={selectedPalette}
                  selectedPaletteId={selectedPaletteId}
                  allPalettes={allPalettes}
                  customColors={customColors}
                  onSelectPalette={handleSelectPalette}
                  onLoadExample={handleLoadExample}
                  initialSelectedId={lastSelectedExampleId}
                  onExampleSelect={setLastSelectedExampleId}
                  myThemeSlots={myThemeSlots}
                  activeMyThemeSlotId={activeMyThemeSlotId}
                  onSelectMyThemeSlot={handleSelectMyThemeSlot}
                  onAddMyThemeSlot={handleAddMyThemeSlot}
                  onDeleteMyThemeSlot={handleDeleteMyThemeSlot}
                  onExportMyThemeSlot={handleExportMyThemeSlot}
                  onDuplicateMyThemeSlot={handleDuplicateMyThemeSlot}
                  onRenameMyThemeSlot={handleRenameMyThemeSlot}
                  onMoveMyThemeSlotUp={handleMoveMyThemeSlotUp}
                  onMoveMyThemeSlotDown={handleMoveMyThemeSlotDown}
                  onImportAsNewSlot={handleImportAsNewSlot}
                  onImportThemeFile={handleImportThemeFile}
                  onShowToast={showToast}
                  onShowProfileDetails={handleShowProfileDetails}
                />
              )}
              {activeTab === "reference" && (
                <ReferenceTab
                  selectedPalette={selectedPalette}
                  selectedPaletteId={selectedPaletteId}
                  allPalettes={allPalettes}
                  customColors={customColors}
                  onSelectPalette={handleSelectPalette}
                  supportsClassDef={supportsClassDef}
                  inputCode={inputCode}
                  onInputChange={setInputCode}
                  openParityMatrix={openParityMatrix}
                  onParityMatrixOpened={() => setOpenParityMatrix(false)}
                  openDistributionRenderer={openDistributionRenderer}
                  onDistributionOpened={() => setOpenDistributionRenderer(null)}
                  myThemeSlots={myThemeSlots}
                  activeMyThemeSlotId={activeMyThemeSlotId}
                  onSelectMyThemeSlot={handleSelectMyThemeSlot}
                  onAddMyThemeSlot={handleAddMyThemeSlot}
                  onDeleteMyThemeSlot={handleDeleteMyThemeSlot}
                  onExportMyThemeSlot={handleExportMyThemeSlot}
                  onDuplicateMyThemeSlot={handleDuplicateMyThemeSlot}
                  onRenameMyThemeSlot={handleRenameMyThemeSlot}
                  onMoveMyThemeSlotUp={handleMoveMyThemeSlotUp}
                  onMoveMyThemeSlotDown={handleMoveMyThemeSlotDown}
                  onImportAsNewSlot={handleImportAsNewSlot}
                  onImportThemeFile={handleImportThemeFile}
                  onShowToast={showToast}
                  onShowProfileDetails={handleShowProfileDetails}
                  rendererTarget={rendererTarget}
                  rendererTargetHintDismissed={rendererTargetHintDismissed}
                  onDismissRendererTargetHint={() => setRendererTargetHintDismissed(true)}
                  outputFormat={outputFormat}
                  onCopyForRenderer={handleCopyForRenderer}
                  onCopyShareLink={handleReferenceShareLink}
                />
              )}
              {activeTab === "extract" && (
                <ExtractTab
                  onUseExtractedTheme={handleUseExtractedTheme}
                  onSwitchTab={setActiveTab}
                  onShowToast={showToast}
                />
              )}
            </div>
          </>
        )}
      </main>

      <div
        className="md:hidden fixed bottom-14 left-0 right-0 z-20 flex items-center justify-center px-4 py-1 print-hide"
        style={{ background: "#0f1a17", borderTop: "1px solid rgba(212,201,181,0.08)" }}
        hidden={hydrated && !firstVisitComplete}
      >
        <p className="forge-mobile-disclaimer text-[9px] text-center">
          Not affiliated with Mermaid, Mermaid Chart, or Mermaid.ai
        </p>
      </div>

      <nav
        className="forge-mobile-nav fixed bottom-0 left-0 right-0 flex md:hidden z-30 shrink-0 print-hide"
        role="tablist"
        aria-label="Mermaid Theme Builder sections (mobile)"
        hidden={hydrated && !firstVisitComplete}
        onKeyDown={(e) => {
          if (
            e.key !== "ArrowLeft" &&
            e.key !== "ArrowRight" &&
            e.key !== "Home" &&
            e.key !== "End"
          )
            return;
          e.preventDefault();
          const idx = TAB_CONFIG.findIndex((t) => t.id === activeTab);
          let next = idx;
          if (e.key === "ArrowLeft") next = (idx - 1 + TAB_CONFIG.length) % TAB_CONFIG.length;
          else if (e.key === "ArrowRight") next = (idx + 1) % TAB_CONFIG.length;
          else if (e.key === "Home") next = 0;
          else if (e.key === "End") next = TAB_CONFIG.length - 1;
          const nextId = TAB_CONFIG[next].id;
          setActiveTab(nextId);
          requestAnimationFrame(() => {
            const btn = document.querySelector<HTMLButtonElement>(
              `.forge-mobile-nav [data-tab-id="${nextId}"]`
            );
            btn?.focus();
          });
        }}
      >
        {TAB_CONFIG.map((tab) => {
          const selected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              data-tab-id={tab.id}
              role="tab"
              id={`mobile-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`tabpanel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActiveTab(tab.id)}
              className={`forge-mobile-nav-item${selected ? " forge-mobile-nav-item-active" : ""}`}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </nav>

      <footer
        className="forge-footer flex-none hidden md:flex items-center justify-between px-4 py-1.5 print-hide"
        style={{ minHeight: "34px" }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 forge-footer-meta">
            <a
              href="https://overkillhill.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="forge-footer-brand forge-footer-link"
            >
              OverKill Hill P³
            </a>
          </div>
        </div>
        <div className="flex items-center gap-2 forge-footer-meta" style={{ fontSize: "9px" }}>
          Not affiliated with Mermaid, Mermaid Chart, or Mermaid.ai
        </div>
        <div className="flex items-center gap-2">
          <a
            href="https://replit.com/refer/overkillhillp3/"
            target="_blank"
            rel="noopener noreferrer"
            className="forge-footer-link"
            style={{ color: "#FF3C00" }}
          >
            Replit
          </a>
          <span className="forge-footer-meta">·</span>
          <a
            href="https://mermaidchart.cello.so/UhVlNtC2MlS"
            target="_blank"
            rel="noopener noreferrer"
            className="forge-footer-link"
            style={{ color: "#FF3670" }}
          >
            Mermaid.ai
          </a>
        </div>
      </footer>

      {pendingClearSettings && (
        <ThemeDialog title="Clear this workspace?" onClose={() => setPendingClearSettings(false)}>
          <p className="mb-3 text-sm">
            This clears the current theme library, drafts, diagram, and workspace preferences. The
            original pre-upgrade snapshot remains unchanged. Download a recovery copy first if you
            want to restore newer work.
          </p>
          <div className="flex flex-wrap gap-2">
            <button className={themeActionClass} onClick={downloadWorkspaceRecovery}>
              Download recovery first
            </button>
            <button className={themeActionClass} onClick={() => setPendingClearSettings(false)}>
              Cancel
            </button>
            <button
              className={themeActionClass}
              disabled={themeLibrary.busy || !!themeLibrary.error}
              onClick={async () => {
                const result = await updateLibrary((state) => ({
                  ...state,
                  themes: [],
                  drafts: [],
                  editorSession: {
                    inputCode: APPLY_TAB_DEFAULT,
                    activeThemeId: null,
                    selectedPaletteId: BRAND_PALETTES[0].id,
                    preferences: {},
                  },
                }));
                if (!result) return;
                try {
                  localStorage.removeItem("mtb.classBrowser.previewMode");
                  localStorage.removeItem("mtb.exportPreview.open");
                  localStorage.removeItem("mtb.firstVisit");
                } catch {
                  setProfileShareError(
                    "The workspace was cleared, but some separate browser preferences could not be reset."
                  );
                }
                workingDrafts.current.clear();
                updateMyThemeSlots([]);
                setCustomColors({});
                setUserPalettes([]);
                setRecentPaletteIds([]);
                setInputCode(APPLY_TAB_DEFAULT);
                setPreviewMode("themed");
                setLastExampleType({});
                setLastSelectedExampleId("");
                setRendererTargetHintDismissed(false);
                setSettingsResetToken((value) => value + 1);
                clearAllDismissals();
                setHintResetToken((value) => value + 1);
                applyCompleteTheme(paletteToCompleteTheme(BRAND_PALETTES[0]), false);
                setPendingClearSettings(false);
                setToast("All settings cleared. Original pre-upgrade data was retained.");
              }}
            >
              Confirm clear workspace
            </button>
          </div>
        </ThemeDialog>
      )}

      {pendingThemeSwitch && (
        <ThemeDialog title="Keep your theme changes?" onClose={() => setPendingThemeSwitch(null)}>
          <p className="mb-4 text-sm">
            Save changes to this theme, keep an unsaved draft for later, or discard the draft. Your
            diagram will not change.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              className={themeActionClass}
              disabled={themeLibrary.busy}
              onClick={() => void handleThemeSwitchDecision("save")}
            >
              Save and switch
            </button>
            <button
              className={themeActionClass}
              disabled={themeLibrary.busy}
              onClick={() => void handleThemeSwitchDecision("keep")}
            >
              Keep draft and switch
            </button>
            <button
              className={themeActionClass}
              disabled={themeLibrary.busy}
              onClick={() => void handleThemeSwitchDecision("discard")}
            >
              Discard draft and switch
            </button>
            <button className={themeActionClass} onClick={() => setPendingThemeSwitch(null)}>
              Cancel
            </button>
          </div>
        </ThemeDialog>
      )}

      {pendingThemeImport && (
        <ThemeDialog title="Review theme import" onClose={() => setPendingThemeImport(null)}>
          <p className="mb-2 text-sm">
            {pendingThemeImport.themes.length} theme
            {pendingThemeImport.themes.length === 1 ? "" : "s"}. Importing copies preserves your
            existing themes and diagram text.
          </p>
          <ul className="mb-3 max-h-48 list-disc overflow-auto pl-5 text-xs">
            {pendingThemeImport.themes.map((theme, index) => (
              <li key={`${theme.id}-${index}`}>
                {theme.name}: {theme.colors.length} colors, {theme.look},{" "}
                {theme.rendererTarget || "generic destination"}, {theme.outputFormat}
              </li>
            ))}
          </ul>
          {pendingThemeImport.warnings.map((warning, index) => (
            <p className="mb-2 text-xs text-muted-foreground" key={index}>
              {warning}
            </p>
          ))}
          <div className="flex flex-wrap gap-2">
            <button
              className={themeActionClass}
              disabled={importingTheme || !!themeLibrary.error}
              onClick={() => void commitThemeImport(false)}
            >
              Import as copies
            </button>
            {pendingThemeImport.replaceId && (
              <button
                className={themeActionClass}
                disabled={importingTheme || !!themeLibrary.error}
                onClick={() => void commitThemeImport(true)}
              >
                Confirm replace selected theme
              </button>
            )}
            <button className={themeActionClass} onClick={() => setPendingThemeImport(null)}>
              Cancel
            </button>
          </div>
        </ThemeDialog>
      )}

      <ProfileDetailsPanel
        open={profileDetailSlotId !== null}
        onClose={() => setProfileDetailSlotId(null)}
        slot={
          profileDetailSlotId && profileForId(profileDetailSlotId)
            ? profileToSlot(profileForId(profileDetailSlotId)!)
            : null
        }
        rendererTarget={
          profileDetailSlotId ? (profileForId(profileDetailSlotId)?.rendererTarget ?? "") : ""
        }
        outputFormat={
          profileDetailSlotId
            ? (profileForId(profileDetailSlotId)?.outputFormat ?? "init-directive")
            : "init-directive"
        }
        slotsFull={false}
        onRename={handleRenameMyThemeSlot}
        onExport={handleExportMyThemeSlot}
        onImport={handleImportIntoProfileDetailSlot}
        onDuplicate={handleDuplicateMyThemeSlot}
        onDelete={handleDeleteMyThemeSlot}
        onShowToast={showToast}
        onCopyShareLink={handleCopyProfileShareLink}
      />

      {/* Profile share-link error banner — shown when ?profile= token is invalid */}
      {(profileShareError || themeImportError) && (
        <div
          role="alert"
          className="fixed top-0 left-0 right-0 z-50 flex items-start justify-between gap-3 px-4 py-3 bg-destructive/10 border-b border-destructive/30"
        >
          <div className="flex items-center gap-2 min-w-0">
            <svg
              viewBox="0 0 16 16"
              fill="none"
              className="w-4 h-4 shrink-0 text-destructive"
              aria-hidden="true"
            >
              <path
                d="M8 2L1.5 13h13L8 2z"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M8 7v3M8 11.5v.5"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-destructive">
                {themeImportError ? "Could not import theme" : "Could not load shared profile"}
              </p>
              <p className="text-xs text-destructive">{themeImportError || profileShareError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setProfileShareError(null);
              setThemeImportError(null);
            }}
            className="shrink-0 p-1 rounded text-destructive/50 hover:text-destructive transition-colors"
            aria-label="Dismiss error"
          >
            <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5" aria-hidden="true">
              <path
                d="M4 4l8 8M12 4l-8 8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      )}

      {toast && (
        <div
          role="status"
          aria-label="Notification"
          aria-live="polite"
          className="fixed bottom-16 md:bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 pl-4 pr-2 py-2 rounded-md bg-foreground/90 text-background text-xs font-medium shadow-lg backdrop-blur animate-in fade-in slide-in-from-bottom-2"
        >
          <span>{toast}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Dismiss"
            className="shrink-0 opacity-60 hover:opacity-100 transition-opacity p-0.5 rounded"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5" aria-hidden="true">
              <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppShell />
    </ErrorBoundary>
  );
}

export default App;
