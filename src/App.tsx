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
import {
  BUILTIN_PALETTES,
  BRAND_PALETTES,
  UTILITY_PALETTES,
  REQUIRED_COLOR_KEYS,
  KNOWN_COLOR_KEYS,
  type Palette,
  type ThemeColor,
  getEffectiveThemeName,
} from "@/lib/palettes";
import { clearAllDismissals } from "@/lib/family-syntax-hints";
import {
  APPLY_TAB_DEFAULT,
  BRAND_EXAMPLES,
  GENERIC_EXAMPLE,
  SHOWCASE_EXAMPLE,
} from "@/data/examples";
import { EXAMPLE_GROUPS } from "@/data/example-library";
import { AppIcon } from "@/components/AppIcon";
import { ApplyTab } from "@/pages/tabs/ApplyTab";
import { ComposeTab } from "@/pages/tabs/ComposeTab";
import { ExamplesTab } from "@/pages/tabs/ExamplesTab";
import { ReferenceTab } from "@/pages/tabs/ReferenceTab";
import { ExtractTab } from "@/pages/tabs/ExtractTab";
import {
  loadPersistedState,
  savePersistedState,
  clearPersistedState,
  hasCompletedFirstVisit,
  markFirstVisitComplete,
  decodeShareableTheme,
  type ShareablePayload,
} from "@/lib/persistence";
import {
  type MermaidLook,
  type AdvancedMermaidConfig,
  CLASSDEF_CAPABLE_FAMILIES,
  getClassDefs,
  generateThemedCode,
} from "@/lib/theme-engine";
import { getRendererById } from "@/data/renderer-parity";
import {
  type MyThemeSlot,
  type MyThemeSlotId,
  createDefaultMyThemeSlot,
  nextSlotNumber,
  isMyThemeSlotId,
  slotDisplayName,
  duplicateSlot,
  moveSlotUp,
  moveSlotDown,
} from "@/lib/my-theme-slots";
import { downloadTextFile, makeFilename, paletteToPortableJson } from "@/lib/exporters";
import {
  migrateSlotToProfile,
  profileToPortableJson,
  profileToSlot,
  parseGovernanceProfile,
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
import {
  paletteFromExtracted,
  makeExtractedPaletteId,
  extractTheme,
  hasExtractableTheme,
} from "@/lib/extractor";

export type AppTab = "apply" | "compose" | "examples" | "reference" | "extract";

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

function buildPaletteFromShare(payload: ShareablePayload): Palette {
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
      toolVersion: "0.3.0",
    },
  };
}

function readShareToken(): ShareablePayload | null {
  if (typeof window === "undefined") return null;
  try {
    const url = new URL(window.location.href);
    const token = url.searchParams.get("theme");
    if (!token) return null;
    return decodeShareableTheme(token);
  } catch {
    return null;
  }
}

function clearShareToken(): void {
  if (typeof window === "undefined") return;
  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("theme")) return;
    url.searchParams.delete("theme");
    window.history.replaceState({}, "", url.toString());
  } catch {
    // ignore
  }
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
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [confirmResetPalettes, setConfirmResetPalettes] = useState(false);
  const settingsBtnRef = useRef<HTMLButtonElement>(null);
  const settingsMenuRef = useRef<HTMLDivElement>(null);
  const [openParityMatrix, setOpenParityMatrix] = useState(false);
  const [myThemeSlots, setMyThemeSlots] = useState<MyThemeSlot[]>(() => [
    createDefaultMyThemeSlot(1, BRAND_PALETTES[0].colors),
  ]);
  const myThemeSlotsRef = useRef(myThemeSlots);
  const updateMyThemeSlots = useCallback(
    (update: MyThemeSlot[] | ((previous: MyThemeSlot[]) => MyThemeSlot[])) => {
      const next = typeof update === "function" ? update(myThemeSlotsRef.current) : update;
      myThemeSlotsRef.current = next;
      setMyThemeSlots(next);
    },
    []
  );
  const [activeMyThemeSlotId, setActiveMyThemeSlotId] = useState<string | null>("my-theme-1");
  const [outputFormat, setOutputFormat] = useState<"init-directive" | "frontmatter">(
    "init-directive"
  );
  const [strokeWidth, setStrokeWidth] = useState<number | undefined>(undefined);
  const [advancedMermaidConfig, setAdvancedMermaidConfig] = useState<
    import("@/lib/theme-engine").AdvancedMermaidConfig
  >({});
  const [profileDetailSlotId, setProfileDetailSlotId] = useState<string | null>(null);
  const [profileShareError, setProfileShareError] = useState<string | null>(null);

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

  // Hydrate from URL share token (highest priority) or localStorage on mount.
  useEffect(() => {
    const TABS: AppTab[] = ["apply", "compose", "examples", "reference", "extract"];
    // Use the hash captured at render time so the hash-sync effect (which runs
    // before this effect and writes activeTab back to window.location.hash) does
    // not falsely make every fresh load look like a URL-hash navigation.
    const hasUrlTab = TABS.includes(initialHashRef.current as AppTab);

    let didApplyShare = false;
    const share = readShareToken();
    if (share) {
      const palette = buildPaletteFromShare(share);
      const taken = new Set<string>(BUILTIN_PALETTES.map((p) => p.id));
      if (taken.has(palette.id)) palette.id = uniquePaletteId("shared-", taken);
      setUserPalettes((prev) => [...prev, palette]);
      setSelectedPaletteId(palette.id);
      if (share.customThemeName) setCustomThemeName(share.customThemeName);
      // v2 share tokens carry look + rendererTarget — apply when present.
      // Coerce look to a known value; unknown strings silently fall back to "classic".
      const validLooks = ["classic", "neo", "handDrawn"] as const;
      if (share.look && (validLooks as readonly string[]).includes(share.look)) {
        setLook(share.look as (typeof validLooks)[number]);
      }
      if (typeof share.rendererTarget === "string") {
        setRendererTarget(share.rendererTarget);
      }
      setToast(`Loaded shared theme: ${palette.name}`);
      clearShareToken();
      didApplyShare = true;

      // Validate raw decoded keys BEFORE buildPaletteFromShare canonicalizes
      // them onto BRAND_PALETTES[0]. After canonicalization every required key
      // is present regardless of what the sharer sent, so the check must run
      // on the original themeVariables payload.
      const sharedKeys = new Set(Object.keys(share.themeVariables));
      const missingKeys = (REQUIRED_COLOR_KEYS as readonly string[]).filter(
        (k) => !sharedKeys.has(k)
      );
      const unknownKeys = Object.keys(share.themeVariables).filter((k) => !KNOWN_COLOR_KEYS.has(k));
      if (missingKeys.length > 0 || unknownKeys.length > 0) {
        setImportDiagnostics({ missingKeys, unknownKeys, invalidValues: [], warnValues: [] });
      }
    }

    const persisted = loadPersistedState();
    if (persisted) {
      if (Array.isArray(persisted.userPalettes))
        setUserPalettes((prev) => {
          // Dedupe by id; share-token palettes win over persisted duplicates.
          const seen = new Set(prev.map((p) => p.id));
          const merged = [...prev];
          for (const p of persisted.userPalettes!) if (!seen.has(p.id)) merged.push(p);
          return merged;
        });
      if (!didApplyShare && typeof persisted.selectedPaletteId === "string") {
        setSelectedPaletteId(persisted.selectedPaletteId);
      }
      if (persisted.customColors && typeof persisted.customColors === "object") {
        setCustomColors(persisted.customColors as Record<string, ThemeColor[]>);
      }
      if (typeof persisted.includeMetaComments === "boolean")
        setIncludeMetaComments(persisted.includeMetaComments);
      if (typeof persisted.includeBadge === "boolean") setIncludeBadge(persisted.includeBadge);
      if (typeof persisted.customThemeName === "string" && !didApplyShare)
        setCustomThemeName(persisted.customThemeName);
      if (typeof persisted.inputCode === "string" && persisted.inputCode.trim()) {
        const knownDefaults = new Set<string>([
          APPLY_TAB_DEFAULT,
          GENERIC_EXAMPLE,
          SHOWCASE_EXAMPLE,
          ...Object.values(BRAND_EXAMPLES).flatMap(({ flowchart, sequence }) => [
            flowchart,
            sequence,
          ]),
          ...EXAMPLE_GROUPS.flatMap((g) => g.entries.map((e) => e.content)),
        ]);
        if (!knownDefaults.has(persisted.inputCode)) {
          setInputCode(persisted.inputCode);
        }
      }
      if (Array.isArray(persisted.recentPaletteIds)) {
        setRecentPaletteIds(
          persisted.recentPaletteIds
            .filter((s): s is string => typeof s === "string")
            .slice(0, RECENT_PALETTES_MAX)
        );
      }
      if (typeof persisted.fontSize === "string") setFontSize(persisted.fontSize);
      if (persisted.typography && typeof persisted.typography === "object") {
        const t = persisted.typography as TypographySettings;
        if (
          t.diagramTitle &&
          t.subgraphTitle &&
          t.nestedSubgraphTitle &&
          t.nodeLabel &&
          t.edgeLabel
        ) {
          setTypography(t);
        }
      }
      const VALID_PREVIEW_MODES = ["original", "themed", "diff", "code"] as const;
      if (
        typeof persisted.previewMode === "string" &&
        (VALID_PREVIEW_MODES as readonly string[]).includes(persisted.previewMode)
      ) {
        setPreviewMode(persisted.previewMode as "original" | "themed" | "diff" | "code");
      }
      if (persisted.lastExampleType && typeof persisted.lastExampleType === "object") {
        const clean: Record<string, "flowchart" | "sequence"> = {};
        for (const [k, v] of Object.entries(persisted.lastExampleType)) {
          if (typeof k === "string" && (v === "flowchart" || v === "sequence")) clean[k] = v;
        }
        setLastExampleType(clean);
      }
      if (typeof persisted.lastSelectedExampleId === "string" && persisted.lastSelectedExampleId) {
        setLastSelectedExampleId(persisted.lastSelectedExampleId);
      }
      if (Array.isArray(persisted.myThemeSlots)) {
        const validSlots = (persisted.myThemeSlots as unknown[]).filter(
          (s): s is MyThemeSlot =>
            typeof s === "object" &&
            s !== null &&
            "id" in s &&
            isMyThemeSlotId((s as MyThemeSlot).id) &&
            Array.isArray((s as MyThemeSlot).colors)
        );
        // Apply even when empty — an empty array means the user intentionally
        // deleted all slots; only the absence of the field means "use default".
        updateMyThemeSlots(validSlots);
        // Validate active slot ID against the hydrated slots so a stale or
        // dangling ID (e.g. slot was deleted in another tab) doesn't persist.
        const validSlotIds = new Set(validSlots.map((s) => s.id));
        if (persisted.activeMyThemeSlotId === null) {
          setActiveMyThemeSlotId(null);
        } else if (
          typeof persisted.activeMyThemeSlotId === "string" &&
          isMyThemeSlotId(persisted.activeMyThemeSlotId) &&
          validSlotIds.has(persisted.activeMyThemeSlotId)
        ) {
          setActiveMyThemeSlotId(persisted.activeMyThemeSlotId);
        } else {
          // ID references a slot that no longer exists — clear it.
          setActiveMyThemeSlotId(null);
        }
      }
      if (
        typeof persisted.outputFormat === "string" &&
        (persisted.outputFormat === "init-directive" || persisted.outputFormat === "frontmatter")
      ) {
        setOutputFormat(persisted.outputFormat);
      }
      if (
        typeof persisted.strokeWidth === "number" &&
        persisted.strokeWidth >= 1 &&
        persisted.strokeWidth <= 8
      ) {
        setStrokeWidth(persisted.strokeWidth);
      }
      if (persisted.advancedMermaidConfig && typeof persisted.advancedMermaidConfig === "object") {
        const amc = persisted.advancedMermaidConfig;
        const clean: import("@/lib/theme-engine").AdvancedMermaidConfig = {};
        if (typeof amc.htmlLabels === "boolean") clean.htmlLabels = amc.htmlLabels;
        if (typeof amc.deterministicIds === "boolean")
          clean.deterministicIds = amc.deterministicIds;
        if (typeof amc.deterministicIDSeed === "string")
          clean.deterministicIDSeed = amc.deterministicIDSeed;
        setAdvancedMermaidConfig(clean);
      }
      // Restore the last-visited tab for returning users — only when no URL
      // hash tab is already directing the destination.
      if (
        !hasUrlTab &&
        typeof persisted.activeTab === "string" &&
        TABS.includes(persisted.activeTab as AppTab)
      ) {
        setActiveTab(persisted.activeTab as AppTab);
      }
    }
    // ── Profile share token (applied after persisted state) ────────────────
    // Uses ?profile=<base64url> — distinct from the legacy ?theme= palette param.
    const profileToken = readProfileShareToken();
    if (profileToken) {
      clearProfileShareToken();
      const profileResult = decodeProfileToken(profileToken);
      if (!profileResult.ok) {
        setProfileShareError(profileResult.error);
      } else {
        const { profile, warnings } = profileResult;
        // Build a slot from the profile; assign to the first available slot number,
        // or replace slot 1 when all three are taken.
        const existingSlots = Array.isArray(persisted?.myThemeSlots)
          ? (persisted!.myThemeSlots as unknown[]).filter(
              (s): s is MyThemeSlot =>
                typeof s === "object" &&
                s !== null &&
                isMyThemeSlotId((s as MyThemeSlot).id) &&
                Array.isArray((s as MyThemeSlot).colors)
            )
          : [createDefaultMyThemeSlot(1, BRAND_PALETTES[0].colors)];
        const usedNums = new Set(
          existingSlots.map((s) => Number((s as MyThemeSlot).id.replace("my-theme-", "")))
        );
        const slotNum = ([1, 2, 3] as const).find((n) => !usedNums.has(n)) ?? 1;
        const targetId = `my-theme-${slotNum}` as MyThemeSlotId;
        const profileSlot = profileToSlot(profile);
        const newSlot: MyThemeSlot = { ...profileSlot, id: targetId };
        const updatedSlots = [
          ...existingSlots.filter((s) => (s as MyThemeSlot).id !== targetId),
          newSlot,
        ];
        updateMyThemeSlots(updatedSlots);
        setActiveMyThemeSlotId(targetId);
        setRendererTarget(profile.rendererTarget);
        if (profile.outputFormat) setOutputFormat(profile.outputFormat);
        // Apply app-level render settings unconditionally so a recipient's
        // previously-persisted values cannot contaminate the imported profile.
        // When a field is absent in the profile, we reset to the default
        // (undefined / empty object) rather than keeping whatever the
        // recipient had before.
        setStrokeWidth(profile.strokeWidth); // undefined → reset to default
        {
          // Mirror applyAdvancedConfigFromProfile: only accept known typed
          // fields; an absent advancedMermaidConfig explicitly resets to {}.
          const amc = profile.advancedMermaidConfig;
          const cleanAmc: import("@/lib/theme-engine").AdvancedMermaidConfig = {};
          if (amc && typeof amc === "object") {
            if (typeof amc.htmlLabels === "boolean") cleanAmc.htmlLabels = amc.htmlLabels;
            if (typeof amc.deterministicIds === "boolean")
              cleanAmc.deterministicIds = amc.deterministicIds;
            if (typeof amc.deterministicIDSeed === "string")
              cleanAmc.deterministicIDSeed = amc.deterministicIDSeed;
          }
          setAdvancedMermaidConfig(cleanAmc);
        }
        const warnNote = warnings.length > 0 ? ` (${warnings.length} advisory)` : "";
        setToast(`Loaded shared profile: "${profile.name}"${warnNote}`);
      }
    }

    // ── New-user / returning-user detection ──────────────────────────────
    // Show the route selector when the dedicated `mtb.firstVisit` key is
    // absent (written immediately by handleRouteSelect/Skip — see below).
    // This covers genuine new users, legacy users whose state pre-dates the
    // selector, and users who closed before completing it on a prior visit.
    // The selector is bypassed when an inbound URL hash, theme share token,
    // or profile share token already implies a destination.
    // `profileToken` was captured before clearProfileShareToken() was called,
    // so `hadProfileToken` correctly reflects arrival state.
    const hadProfileToken = !!profileToken;
    if (!hasCompletedFirstVisit() && !hasUrlTab && !didApplyShare && !hadProfileToken) {
      setFirstVisitComplete(false);
    }

    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save to localStorage after hydration.
  // Guard on `firstVisitComplete` so a new user who closes before picking a
  // route doesn't get silently marked as a returning user on next visit.
  useEffect(() => {
    if (!hydrated || !firstVisitComplete) return;
    savePersistedState({
      schemaVersion: 1,
      selectedPaletteId,
      customColors,
      includeMetaComments,
      includeBadge,
      customThemeName,
      inputCode,
      userPalettes,
      recentPaletteIds,
      look,
      fontSize,
      typography,
      rendererTarget,
      previewMode,
      lastExampleType,
      lastSelectedExampleId,
      myThemeSlots,
      activeMyThemeSlotId,
      outputFormat,
      strokeWidth,
      advancedMermaidConfig,
      firstVisitComplete,
      activeTab,
    });
  }, [
    hydrated,
    firstVisitComplete,
    activeTab,
    selectedPaletteId,
    customColors,
    includeMetaComments,
    includeBadge,
    customThemeName,
    inputCode,
    userPalettes,
    recentPaletteIds,
    look,
    fontSize,
    typography,
    rendererTarget,
    previewMode,
    lastExampleType,
    lastSelectedExampleId,
    myThemeSlots,
    activeMyThemeSlotId,
    outputFormat,
    strokeWidth,
    advancedMermaidConfig,
  ]);

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
      const base = BRAND_PALETTES[0];
      return {
        ...base,
        id: activeMyThemeSlot.id,
        name: activeMyThemeSlot.name,
        colors: activeMyThemeSlot.colors,
      };
    }
    const base = allPalettes.find((p) => p.id === selectedPaletteId) ?? BRAND_PALETTES[0];
    const overrides = customColors[selectedPaletteId];
    if (!overrides) return base;
    return {
      ...base,
      colors: base.colors.map((c) => {
        const override = overrides.find((o) => o.key === c.key);
        return override ?? c;
      }),
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

  const handleSelectPalette = useCallback((id: string) => {
    setActiveMyThemeSlotId(null);
    setSelectedPaletteId(id);
    setCustomThemeName("");
    setRecentPaletteIds((prev) => {
      const next = [id, ...prev.filter((p) => p !== id)].slice(0, RECENT_PALETTES_MAX);
      return next;
    });
  }, []);

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

  const handleSelectMyThemeSlot = useCallback((id: string) => {
    setActiveMyThemeSlotId(id);
  }, []);

  const handleAddMyThemeSlot = useCallback(() => {
    updateMyThemeSlots((prev) => {
      if (prev.length >= 3) return prev;
      const num = nextSlotNumber(prev);
      if (num === null) return prev;
      const newSlot = createDefaultMyThemeSlot(num, selectedPalette.colors);
      setActiveMyThemeSlotId(newSlot.id);
      return [...prev, newSlot];
    });
  }, [selectedPalette.colors]);

  const handleDeleteMyThemeSlot = useCallback(
    (id: string) => {
      updateMyThemeSlots((prev) => {
        const idx = prev.findIndex((s) => s.id === id);
        const next = prev.filter((s) => s.id !== id);
        if (activeMyThemeSlotId === id) {
          // Prefer the slot immediately before the deleted one; fall back to
          // the slot that now occupies the same index (i.e. the one to the right).
          const nearest = next[idx - 1] ?? next[idx] ?? null;
          setActiveMyThemeSlotId(nearest ? nearest.id : null);
        }
        return next;
      });
    },
    [activeMyThemeSlotId]
  );

  const handleExportMyThemeSlot = useCallback(
    (id: string) => {
      const slot = myThemeSlots.find((s) => s.id === id);
      if (!slot) return;
      // Export as a full GovernanceProfile JSON — includes look, typography,
      // rendererTarget, outputFormat, and schemaVersion so it can be imported
      // back with full fidelity.
      const profile = migrateSlotToProfile(slot, {
        rendererTarget,
        outputFormat,
        strokeWidth,
        advancedMermaidConfig:
          Object.keys(advancedMermaidConfig).length > 0
            ? (advancedMermaidConfig as Record<string, unknown>)
            : undefined,
      });
      const json = profileToPortableJson(profile);
      const filename = makeFilename(slot.name, "profile", "json");
      downloadTextFile(filename, json, "application/json");
    },
    [myThemeSlots, rendererTarget, outputFormat, strokeWidth, advancedMermaidConfig]
  );

  const handleImportMyThemeSlot = useCallback(
    (
      palette: Palette,
      warnings: {
        invalidValues: Array<{ key: string; value: string }>;
        warnValues: Array<{ key: string; value: string }>;
      }
    ) => {
      if (activeMyThemeSlotId) {
        const activeSlotName =
          myThemeSlots.find((s) => s.id === activeMyThemeSlotId)?.name ?? "My Theme";
        updateMyThemeSlots((prev) =>
          prev.map((s) =>
            s.id === activeMyThemeSlotId
              ? { ...s, colors: palette.colors, updatedAt: new Date().toISOString() }
              : s
          )
        );
        if (warnings.invalidValues.length > 0 || warnings.warnValues.length > 0) {
          const problemKeys = [
            ...warnings.invalidValues.map((e) => e.key),
            ...warnings.warnValues.map((e) => e.key),
          ];
          const keyList = problemKeys.join(", ");
          setImportDiagnostics({
            missingKeys: [],
            unknownKeys: [],
            invalidValues: warnings.invalidValues,
            warnValues: warnings.warnValues,
          });
          setToast(
            `Imported "${palette.name}" into "${activeSlotName}". CSS values may not render in Mermaid: ${keyList}.`
          );
        } else {
          setToast(`Imported "${palette.name}" into "${activeSlotName}".`);
        }
      } else {
        updateMyThemeSlots((prev) => {
          if (prev.length >= 3) return prev;
          const num = nextSlotNumber(prev);
          if (num === null) return prev;
          const newSlot = createDefaultMyThemeSlot(num, palette.colors);
          newSlot.name = palette.name;
          setActiveMyThemeSlotId(newSlot.id);
          return [...prev, newSlot];
        });
        setToast(`Imported "${palette.name}" into a new My Theme slot.`);
      }
    },
    [activeMyThemeSlotId, myThemeSlots]
  );

  /**
   * Read the advancedMermaidConfig from an imported GovernanceProfile and
   * apply it to local state. Only trusted field types are accepted.
   */
  const applyAdvancedConfigFromProfile = useCallback((raw: Record<string, unknown> | undefined) => {
    if (!raw || typeof raw !== "object") {
      setAdvancedMermaidConfig({});
      return;
    }
    const clean: import("@/lib/theme-engine").AdvancedMermaidConfig = {};
    if (typeof raw.htmlLabels === "boolean") clean.htmlLabels = raw.htmlLabels;
    if (typeof raw.deterministicIds === "boolean") clean.deterministicIds = raw.deterministicIds;
    if (typeof raw.deterministicIDSeed === "string")
      clean.deterministicIDSeed = raw.deterministicIDSeed;
    setAdvancedMermaidConfig(clean);
  }, []);

  /**
   * Import a full GovernanceProfile JSON into the active (or a new) slot,
   * and restore the renderer target + output format from the profile.
   */
  const handleImportGovernanceProfile = useCallback(
    (profile: GovernanceProfile, importWarnings: string[]) => {
      const slot = profileToSlot(profile);

      if (activeMyThemeSlotId) {
        const activeSlotName =
          myThemeSlots.find((s) => s.id === activeMyThemeSlotId)?.name ?? "My Theme";
        updateMyThemeSlots((prev) =>
          prev.map((s) =>
            s.id === activeMyThemeSlotId
              ? {
                  ...s,
                  name: slot.name,
                  colors: slot.colors,
                  look: slot.look,
                  fontSize: slot.fontSize,
                  typography: slot.typography,
                  createdAt: s.createdAt ?? profile.createdAt,
                  updatedAt: new Date().toISOString(),
                }
              : s
          )
        );
        // Restore app-level renderer / format from the profile.
        // Always apply — an empty rendererTarget intentionally clears any
        // previously-set renderer; truthy-gating would silently skip that.
        setRendererTarget(profile.rendererTarget);
        if (profile.outputFormat) setOutputFormat(profile.outputFormat);
        applyAdvancedConfigFromProfile(profile.advancedMermaidConfig);

        const warnNote = importWarnings.length > 0 ? ` (${importWarnings.length} advisory)` : "";
        setToast(`Imported profile "${profile.name}" into "${activeSlotName}"${warnNote}.`);
      } else {
        updateMyThemeSlots((prev) => {
          if (prev.length >= 3) {
            setToast("All 3 My Theme slots are in use — delete one before importing.");
            return prev;
          }
          const num = nextSlotNumber(prev);
          if (num === null) return prev;
          const newSlot = { ...slot, id: `my-theme-${num}` as MyThemeSlotId };
          setActiveMyThemeSlotId(newSlot.id);
          setRendererTarget(profile.rendererTarget);
          if (profile.outputFormat) setOutputFormat(profile.outputFormat);
          applyAdvancedConfigFromProfile(profile.advancedMermaidConfig);
          const warnNote = importWarnings.length > 0 ? ` (${importWarnings.length} advisory)` : "";
          setToast(`Imported profile "${profile.name}" into a new My Theme slot${warnNote}.`);
          return [...prev, newSlot];
        });
      }
    },
    [activeMyThemeSlotId, myThemeSlots] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const handleShowProfileDetails = useCallback((id: string) => {
    setProfileDetailSlotId(id);
  }, []);

  const handleCopyProfileShareLink = useCallback(
    async (slotId: string) => {
      const slot = myThemeSlots.find((s) => s.id === slotId);
      if (!slot) return;
      const profile = migrateSlotToProfile(slot, {
        rendererTarget,
        outputFormat,
        strokeWidth,
        advancedMermaidConfig: advancedMermaidConfig as Record<string, unknown>,
      });
      const url = buildProfileShareUrl(profile);
      await writeToClipboard(url);
      setToast("Profile share link copied to clipboard!");
    },
    [myThemeSlots, rendererTarget, outputFormat, strokeWidth, advancedMermaidConfig]
  );

  /** Copy the active slot's share link (no-arg wrapper used by ReferenceTab). */
  const handleReferenceShareLink = useCallback(async () => {
    if (activeMyThemeSlotId) {
      await handleCopyProfileShareLink(activeMyThemeSlotId);
    }
  }, [activeMyThemeSlotId, handleCopyProfileShareLink]);

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

  const handleRenameSlotById = useCallback((id: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    updateMyThemeSlots((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, name: trimmed, updatedAt: new Date().toISOString() } : s
      )
    );
  }, []);

  const handleImportIntoProfileDetailSlot = useCallback(
    (profile: GovernanceProfile, importWarnings: string[]) => {
      if (!profileDetailSlotId) return;
      const slot = profileToSlot(profile);
      const targetSlotName =
        myThemeSlots.find((s) => s.id === profileDetailSlotId)?.name ?? "My Theme";
      updateMyThemeSlots((prev) =>
        prev.map((s) =>
          s.id === profileDetailSlotId
            ? {
                ...s,
                name: slot.name,
                colors: slot.colors,
                look: slot.look,
                fontSize: slot.fontSize,
                typography: slot.typography,
                createdAt: s.createdAt ?? profile.createdAt,
                updatedAt: new Date().toISOString(),
              }
            : s
        )
      );
      // Apply app-level settings from the imported profile
      setRendererTarget(profile.rendererTarget);
      if (profile.outputFormat) setOutputFormat(profile.outputFormat);
      applyAdvancedConfigFromProfile(profile.advancedMermaidConfig);
      const warnNote = importWarnings.length > 0 ? ` (${importWarnings.length} advisory)` : "";
      setToast(`Imported profile "${profile.name}" into "${targetSlotName}"${warnNote}.`);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [profileDetailSlotId, myThemeSlots, applyAdvancedConfigFromProfile]
  );

  const handleImportAsNewSlot = useCallback(
    (
      palette: Palette,
      warnings: {
        invalidValues: Array<{ key: string; value: string }>;
        warnValues: Array<{ key: string; value: string }>;
      }
    ) => {
      const currentSlots = myThemeSlotsRef.current;
      if (currentSlots.length >= 3) {
        setToast("All 3 My Theme slots are in use — delete one before importing.");
        return;
      }
      const num = nextSlotNumber(currentSlots);
      if (num === null) return;

      const newSlot = createDefaultMyThemeSlot(num, palette.colors);
      newSlot.name = palette.name;
      updateMyThemeSlots([...currentSlots, newSlot]);
      setActiveMyThemeSlotId(newSlot.id);

      if (warnings.invalidValues.length > 0 || warnings.warnValues.length > 0) {
        const problemKeys = [
          ...warnings.invalidValues.map((e) => e.key),
          ...warnings.warnValues.map((e) => e.key),
        ];
        setImportDiagnostics({
          missingKeys: [],
          unknownKeys: [],
          invalidValues: warnings.invalidValues,
          warnValues: warnings.warnValues,
        });
        setToast(
          `Imported "${palette.name}" into a new My Theme slot. CSS values may not render in Mermaid: ${problemKeys.join(", ")}.`
        );
      } else {
        setToast(`Imported "${palette.name}" into a new My Theme slot.`);
      }
    },
    [updateMyThemeSlots]
  );

  const handleDuplicateMyThemeSlot = useCallback(
    (id: string) => {
      const result = duplicateSlot(myThemeSlots, id);
      if (!result) {
        setToast("All 3 My Theme slots are in use — delete one before duplicating.");
        return;
      }
      updateMyThemeSlots(result.slots);
      setActiveMyThemeSlotId(result.newSlotId);
    },
    [myThemeSlots]
  );

  const handleMoveMyThemeSlotUp = useCallback((id: string) => {
    updateMyThemeSlots((prev) => moveSlotUp(prev, id));
  }, []);

  const handleMoveMyThemeSlotDown = useCallback((id: string) => {
    updateMyThemeSlots((prev) => moveSlotDown(prev, id));
  }, []);

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

  /** Theme B: extract theme from current input code into a new user palette. */
  const handleExtractFromCode = useCallback(
    (extractedName?: string): Palette | null => {
      if (!hasExtractableTheme(inputCode)) {
        setToast("No theme directive found in the diagram.");
        return null;
      }
      const extracted = extractTheme(inputCode);
      const palette = paletteFromExtracted(extracted, extractedName ?? "Extracted theme");
      setUserPalettes((prev) => [...prev, palette]);
      setSelectedPaletteId(palette.id);
      setCustomThemeName("");
      setToast(`Extracted ${Object.keys(extracted.themeVariables).length} theme variables.`);
      return palette;
    },
    [inputCode]
  );

  /** Extract tab: accept a pre-built Palette from the Extract tab and activate it.
   *  When codeWithClassDefs is provided (classDef overrides were edited), populate
   *  the Apply tab's input code so the overrides are immediately visible.
   */
  const handleUseExtractedTheme = useCallback(
    (palette: Palette, codeWithClassDefs?: string) => {
      const taken = new Set<string>([
        ...BUILTIN_PALETTES.map((p) => p.id),
        ...userPalettes.map((p) => p.id),
      ]);
      const safeId = taken.has(palette.id) ? uniquePaletteId("extracted-", taken) : palette.id;
      const safe: Palette = { ...palette, id: safeId };
      setUserPalettes((prev) => [...prev, safe]);
      setSelectedPaletteId(safeId);
      setCustomThemeName("");
      if (codeWithClassDefs?.trim()) {
        setInputCode(codeWithClassDefs);
      }
    },
    [userPalettes]
  );

  /** Theme C: save the current effective palette (with edits) as a named user palette. */
  const handleSavePalette = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      const taken = new Set<string>([
        ...BUILTIN_PALETTES.map((p) => p.id),
        ...userPalettes.map((p) => p.id),
      ]);
      const id = uniquePaletteId("saved-", taken);
      const palette: Palette = {
        ...selectedPalette,
        id,
        name: trimmed,
        description: `User-saved palette · derived from ${selectedPalette.name}`,
        version: "0.0.0",
        attribution: {
          ...selectedPalette.attribution,
          themeName: trimmed,
          label: `Themed with Mermaid Theme Builder · ${trimmed}`,
        },
      };
      setUserPalettes((prev) => [...prev, palette]);
      setSelectedPaletteId(id);
      setCustomThemeName("");
      setToast(`Saved palette: ${trimmed}`);
    },
    [selectedPalette, userPalettes]
  );

  const handleImportPalette = useCallback((palette: Palette) => {
    setUserPalettes((prev) => {
      const taken = new Set<string>([
        ...BUILTIN_PALETTES.map((p) => p.id),
        ...prev.map((p) => p.id),
      ]);
      const safeId =
        taken.has(palette.id) || !palette.id ? uniquePaletteId("imported-", taken) : palette.id;
      const safe: Palette = { ...palette, id: safeId };
      // Defer selection until next tick so userPalettes update applies first.
      queueMicrotask(() => {
        setSelectedPaletteId(safeId);
        setCustomThemeName("");
        setToast(`Imported palette: ${safe.name}`);
      });
      return [...prev, safe];
    });
  }, []);

  const handleDeleteUserPalette = useCallback((id: string) => {
    setUserPalettes((prev) => prev.filter((p) => p.id !== id));
    setCustomColors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setSelectedPaletteId((current) => (current === id ? BRAND_PALETTES[0].id : current));
    setToast("Palette removed.");
  }, []);

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
            <p className="forge-header-subtitle">
              visual governance for AI-generated Mermaid diagrams
            </p>
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
                          setCustomColors({});
                          setCustomThemeName("");
                          setToast("All palette customizations reset.");
                          setConfirmResetPalettes(false);
                          setShowSettingsMenu(false);
                        }}
                        className="flex-1 rounded px-2 py-1 text-xs font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
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
                    // Erase both localStorage keys atomically.
                    clearPersistedState();
                    // Reset every persisted React state field to its factory default.
                    setSelectedPaletteId(BRAND_PALETTES[0].id);
                    setCustomColors({});
                    setIncludeMetaComments(true);
                    setIncludeBadge(true);
                    setCustomThemeName("");
                    setInputCode(APPLY_TAB_DEFAULT);
                    setUserPalettes([]);
                    setRecentPaletteIds([]);
                    setLook("classic");
                    setFontSize("");
                    setTypography(DEFAULT_TYPOGRAPHY);
                    setRendererTarget("");
                    setPreviewMode("themed");
                    setLastExampleType({});
                    setLastSelectedExampleId("");
                    updateMyThemeSlots([createDefaultMyThemeSlot(1, BRAND_PALETTES[0].colors)]);
                    setActiveMyThemeSlotId("my-theme-1");
                    // Clear hint dismissals so all syntax tips reappear.
                    clearAllDismissals();
                    setHintResetToken((t) => t + 1);
                    setToast("All settings cleared.");
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
                onRendererTargetChange={setRendererTarget}
                outputFormat={outputFormat}
                onOutputFormatChange={setOutputFormat}
                strokeWidth={strokeWidth}
                lastExampleType={lastExampleType}
                onRecordExampleType={handleRecordExampleType}
                previewMode={previewMode}
                onPreviewModeChange={setPreviewMode}
                hintResetToken={hintResetToken}
                onResetSyntaxHints={handleResetSyntaxHints}
                myThemeSlots={myThemeSlots}
                activeMyThemeSlotId={activeMyThemeSlotId}
                onSelectMyThemeSlot={handleSelectMyThemeSlot}
                onAddMyThemeSlot={handleAddMyThemeSlot}
                onDeleteMyThemeSlot={handleDeleteMyThemeSlot}
                onExportMyThemeSlot={handleExportMyThemeSlot}
                onDuplicateMyThemeSlot={handleDuplicateMyThemeSlot}
                onMoveMyThemeSlotUp={handleMoveMyThemeSlotUp}
                onMoveMyThemeSlotDown={handleMoveMyThemeSlotDown}
                onImportAsNewSlot={handleImportAsNewSlot}
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
                  onRendererTargetChange={setRendererTarget}
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
                  onImportMyThemeSlot={handleImportMyThemeSlot}
                  onImportGovernanceProfile={handleImportGovernanceProfile}
                  onDuplicateMyThemeSlot={handleDuplicateMyThemeSlot}
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
                  onMoveMyThemeSlotUp={handleMoveMyThemeSlotUp}
                  onMoveMyThemeSlotDown={handleMoveMyThemeSlotDown}
                  onImportAsNewSlot={handleImportAsNewSlot}
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
                  myThemeSlots={myThemeSlots}
                  activeMyThemeSlotId={activeMyThemeSlotId}
                  onSelectMyThemeSlot={handleSelectMyThemeSlot}
                  onAddMyThemeSlot={handleAddMyThemeSlot}
                  onDeleteMyThemeSlot={handleDeleteMyThemeSlot}
                  onExportMyThemeSlot={handleExportMyThemeSlot}
                  onDuplicateMyThemeSlot={handleDuplicateMyThemeSlot}
                  onMoveMyThemeSlotUp={handleMoveMyThemeSlotUp}
                  onMoveMyThemeSlotDown={handleMoveMyThemeSlotDown}
                  onImportAsNewSlot={handleImportAsNewSlot}
                  onShowToast={showToast}
                  onShowProfileDetails={handleShowProfileDetails}
                  rendererTarget={rendererTarget}
                  outputFormat={outputFormat}
                  onCopyForRenderer={handleCopyForRenderer}
                  onCopyShareLink={activeMyThemeSlotId ? handleReferenceShareLink : undefined}
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
        <p
          className="text-[9px] text-center"
          style={{ color: "rgba(212,201,181,0.45)", lineHeight: 1.4 }}
        >
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
        <div
          className="flex items-center gap-2 forge-footer-meta"
          style={{ opacity: 0.7, fontSize: "9px" }}
        >
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

      <ProfileDetailsPanel
        open={profileDetailSlotId !== null}
        onClose={() => setProfileDetailSlotId(null)}
        slot={myThemeSlots.find((s) => s.id === profileDetailSlotId) ?? null}
        rendererTarget={rendererTarget}
        outputFormat={outputFormat}
        slotsFull={myThemeSlots.length >= 3}
        onRename={handleRenameSlotById}
        onExport={handleExportMyThemeSlot}
        onImport={handleImportIntoProfileDetailSlot}
        onDuplicate={handleDuplicateMyThemeSlot}
        onDelete={handleDeleteMyThemeSlot}
        onShowToast={showToast}
        onCopyShareLink={handleCopyProfileShareLink}
      />

      {/* Profile share-link error banner — shown when ?profile= token is invalid */}
      {profileShareError && (
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
                Could not load shared profile
              </p>
              <p className="text-[10px] text-destructive/70 truncate">{profileShareError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setProfileShareError(null)}
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
