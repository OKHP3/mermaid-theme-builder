export interface ThemeColor {
  key: string;
  label: string;
  value: string;
}

export interface PaletteAttribution {
  enabledByDefault: boolean;
  label: string;
  url: string;
  themeName: string;
  toolName: string;
  toolVersion: string;
}

export interface Palette {
  id: string;
  name: string;
  brandFamily?: "okhp3";
  isBrandPreset?: boolean;
  description: string;
  themeIntent?: string;
  sourceUrls?: string[];
  version: string;
  colors: ThemeColor[];
  attribution: PaletteAttribution;
}

/**
 * The 11 color keys that every MTB palette must supply.
 * Missing keys cause silent rendering gaps in Mermaid diagrams.
 */
export const REQUIRED_COLOR_KEYS = [
  "primaryColor",
  "primaryTextColor",
  "primaryBorderColor",
  "lineColor",
  "secondaryColor",
  "tertiaryColor",
  "background",
  "mainBkg",
  "nodeBorder",
  "clusterBkg",
  "titleColor",
] as const;

/**
 * All color keys recognized by MTB (required + optional).
 * Keys outside this set are flagged as unknown on import.
 */
export const KNOWN_COLOR_KEYS = new Set<string>([
  ...REQUIRED_COLOR_KEYS,
  "edgeLabelBackground",
  "fontFamily",
  "secondaryTextColor",
  "secondaryBorderColor",
  "tertiaryTextColor",
  "tertiaryBorderColor",
  "textColor",
]);

const TOOL_ATTRIBUTION_BASE: Pick<PaletteAttribution, "toolName" | "toolVersion" | "url"> = {
  toolName: "Mermaid Theme Builder",
  toolVersion: "0.3.0",
  url: "https://overkillhill.com/projects/mermaid-theme-builder/",
};

export const BUILTIN_PALETTES: Palette[] = [
  {
    id: "ocean-depth",
    name: "Ocean Depth",
    description: "Deep blues and teals — clean, professional, great for technical diagrams",
    version: "0.1.0",
    colors: [
      { key: "primaryColor", label: "Primary (nodes)", value: "#1a4f8a" },
      { key: "primaryTextColor", label: "Primary text", value: "#3d3937" },
      { key: "primaryBorderColor", label: "Primary border", value: "#0d3060" },
      { key: "lineColor", label: "Lines & arrows", value: "#2563eb" },
      { key: "secondaryColor", label: "Secondary nodes", value: "#0ea5e9" },
      { key: "tertiaryColor", label: "Tertiary nodes", value: "#e0f2fe" },
      { key: "background", label: "Background", value: "#f0f9ff" },
      { key: "mainBkg", label: "Main background", value: "#dbeafe" },
      { key: "nodeBorder", label: "Node border", value: "#1d4ed8" },
      { key: "clusterBkg", label: "Cluster background", value: "#e0f2fe" },
      { key: "titleColor", label: "Title color", value: "#1e3a5f" },
      { key: "edgeLabelBackground", label: "Edge label bg", value: "#f0f9ff" },
      { key: "fontFamily", label: "Font family", value: "DM Sans, system-ui, sans-serif" },
    ],
    attribution: {
      ...TOOL_ATTRIBUTION_BASE,
      enabledByDefault: true,
      label: "Themed with Mermaid Theme Builder · Ocean Depth",
      themeName: "Ocean Depth",
    },
  },
  {
    id: "forest-sage",
    name: "Forest Sage",
    description: "Earthy greens and warm neutrals — approachable, calm, ideal for process flows",
    version: "0.1.0",
    colors: [
      { key: "primaryColor", label: "Primary (nodes)", value: "#1a5c38" },
      { key: "primaryTextColor", label: "Primary text", value: "#3d3937" },
      { key: "primaryBorderColor", label: "Primary border", value: "#0f3d25" },
      { key: "lineColor", label: "Lines & arrows", value: "#2d6a4f" },
      { key: "secondaryColor", label: "Secondary nodes", value: "#52b788" },
      { key: "tertiaryColor", label: "Tertiary nodes", value: "#d8f3dc" },
      { key: "background", label: "Background", value: "#f4faf6" },
      { key: "mainBkg", label: "Main background", value: "#d8f3dc" },
      { key: "nodeBorder", label: "Node border", value: "#1b4332" },
      { key: "clusterBkg", label: "Cluster background", value: "#d8f3dc" },
      { key: "titleColor", label: "Title color", value: "#1b4332" },
      { key: "edgeLabelBackground", label: "Edge label bg", value: "#f4faf6" },
      { key: "fontFamily", label: "Font family", value: "DM Sans, system-ui, sans-serif" },
    ],
    attribution: {
      ...TOOL_ATTRIBUTION_BASE,
      enabledByDefault: true,
      label: "Themed with Mermaid Theme Builder · Forest Sage",
      themeName: "Forest Sage",
    },
  },
  {
    id: "slate-ember",
    name: "Slate Ember",
    description:
      "Dark grays with warm orange accents — high contrast, modern, striking for architecture diagrams",
    version: "0.1.0",
    colors: [
      { key: "primaryColor", label: "Primary (nodes)", value: "#1e2330" },
      { key: "primaryTextColor", label: "Primary text", value: "#f8fafc" },
      { key: "primaryBorderColor", label: "Primary border", value: "#f97316" },
      { key: "lineColor", label: "Lines & arrows", value: "#f97316" },
      { key: "secondaryColor", label: "Secondary nodes", value: "#2d3748" },
      { key: "tertiaryColor", label: "Tertiary nodes", value: "#374151" },
      { key: "background", label: "Background", value: "#111827" },
      { key: "mainBkg", label: "Main background", value: "#1e2330" },
      { key: "nodeBorder", label: "Node border", value: "#f97316" },
      { key: "clusterBkg", label: "Cluster background", value: "#1f2937" },
      { key: "titleColor", label: "Title color", value: "#f97316" },
      { key: "edgeLabelBackground", label: "Edge label bg", value: "#1e2330" },
      { key: "fontFamily", label: "Font family", value: "DM Sans, system-ui, sans-serif" },
    ],
    attribution: {
      ...TOOL_ATTRIBUTION_BASE,
      enabledByDefault: true,
      label: "Themed with Mermaid Theme Builder · Slate Ember",
      themeName: "Slate Ember",
    },
  },
  {
    id: "violet-mist",
    name: "Violet Mist",
    description: "Soft purples and lavenders — elegant, creative, great for product and UX flows",
    version: "0.1.0",
    colors: [
      { key: "primaryColor", label: "Primary (nodes)", value: "#6d28d9" },
      { key: "primaryTextColor", label: "Primary text", value: "#3d3937" },
      { key: "primaryBorderColor", label: "Primary border", value: "#4c1d95" },
      { key: "lineColor", label: "Lines & arrows", value: "#7c3aed" },
      { key: "secondaryColor", label: "Secondary nodes", value: "#a78bfa" },
      { key: "tertiaryColor", label: "Tertiary nodes", value: "#ede9fe" },
      { key: "background", label: "Background", value: "#f5f3ff" },
      { key: "mainBkg", label: "Main background", value: "#ede9fe" },
      { key: "nodeBorder", label: "Node border", value: "#5b21b6" },
      { key: "clusterBkg", label: "Cluster background", value: "#ede9fe" },
      { key: "titleColor", label: "Title color", value: "#4c1d95" },
      { key: "edgeLabelBackground", label: "Edge label bg", value: "#f5f3ff" },
      { key: "fontFamily", label: "Font family", value: "DM Sans, system-ui, sans-serif" },
    ],
    attribution: {
      ...TOOL_ATTRIBUTION_BASE,
      enabledByDefault: true,
      label: "Themed with Mermaid Theme Builder · Violet Mist",
      themeName: "Violet Mist",
    },
  },
  {
    id: "overkill-hill",
    name: "OKHP3",
    brandFamily: "okhp3",
    isBrandPreset: true,
    description:
      "Industrial dark mode with teal and amber forge accents — bold, high-contrast, built for architecture diagrams",
    themeIntent:
      "Technical, architectural, systems, AI tooling, strategy, and executive-facing diagrams",
    sourceUrls: [
      "https://overkillhill.com",
      "https://github.com/OKHP3/OverKill-Hill/blob/main/assets/css/theme.css",
    ],
    version: "0.2.0",
    colors: [
      { key: "primaryColor", label: "Primary (nodes)", value: "#111827" },
      { key: "primaryTextColor", label: "Primary text", value: "#e5e7eb" },
      { key: "primaryBorderColor", label: "Primary border", value: "#c46a2c" },
      { key: "lineColor", label: "Lines & arrows", value: "#c46a2c" },
      { key: "secondaryColor", label: "Secondary nodes", value: "#181f26" },
      { key: "secondaryTextColor", label: "Secondary text", value: "#e5e7eb" },
      { key: "secondaryBorderColor", label: "Secondary border", value: "#c46a2c" },
      { key: "tertiaryColor", label: "Tertiary nodes", value: "#1c3a34" },
      { key: "tertiaryTextColor", label: "Tertiary text", value: "#e5e7eb" },
      { key: "tertiaryBorderColor", label: "Tertiary border", value: "#c46a2c" },
      { key: "textColor", label: "Text color", value: "#e5e7eb" },
      { key: "background", label: "Background", value: "#111827" },
      { key: "mainBkg", label: "Main background", value: "#111827" },
      { key: "nodeBorder", label: "Node border", value: "#c46a2c" },
      { key: "clusterBkg", label: "Cluster background", value: "#0d1117" },
      { key: "titleColor", label: "Title color", value: "#c46a2c" },
      { key: "edgeLabelBackground", label: "Edge label bg", value: "#181f26" },
      { key: "fontFamily", label: "Font family", value: "DM Sans, system-ui, sans-serif" },
    ],
    attribution: {
      ...TOOL_ATTRIBUTION_BASE,
      enabledByDefault: true,
      label: "Themed with Mermaid Theme Builder · OverKill Hill P³",
      themeName: "OverKill Hill P³",
    },
  },
  {
    id: "glee-fully",
    name: "Glee-fully",
    brandFamily: "okhp3",
    isBrandPreset: true,
    description:
      "Warm and playful with coral and cream — approachable, energetic, great for how-to flows and tutorials",
    themeIntent:
      "Life-organization, personal productivity, family-friendly, consumer-facing, and approachable explainer diagrams",
    sourceUrls: [
      "https://glee-fully.tools",
      "https://github.com/OKHP3/Glee-fullyTools/blob/main/assets/css/theme.css",
    ],
    version: "0.2.0",
    colors: [
      { key: "primaryColor", label: "Primary (nodes)", value: "#fffdfa" },
      { key: "primaryTextColor", label: "Primary text", value: "#2e2b29" },
      { key: "primaryBorderColor", label: "Primary border", value: "#d94f63" },
      { key: "lineColor", label: "Lines & arrows", value: "#d94f63" },
      { key: "secondaryColor", label: "Secondary nodes", value: "#f6f2ee" },
      { key: "secondaryTextColor", label: "Secondary text", value: "#2e2b29" },
      { key: "secondaryBorderColor", label: "Secondary border", value: "#d94f63" },
      { key: "tertiaryColor", label: "Tertiary nodes", value: "#e5d9ce" },
      { key: "tertiaryTextColor", label: "Tertiary text", value: "#2e2b29" },
      { key: "tertiaryBorderColor", label: "Tertiary border", value: "#d94f63" },
      { key: "textColor", label: "Text color", value: "#2e2b29" },
      { key: "background", label: "Background", value: "#fff7f1" },
      { key: "mainBkg", label: "Main background", value: "#fffdfa" },
      { key: "nodeBorder", label: "Node border", value: "#d94f63" },
      { key: "clusterBkg", label: "Cluster background", value: "#f9f3ef" },
      { key: "titleColor", label: "Title color", value: "#d94f63" },
      { key: "edgeLabelBackground", label: "Edge label bg", value: "#fff7f1" },
      { key: "fontFamily", label: "Font family", value: "Open Sans, system-ui, sans-serif" },
    ],
    attribution: {
      ...TOOL_ATTRIBUTION_BASE,
      enabledByDefault: true,
      label: "Themed with Mermaid Theme Builder · Glee-fully",
      themeName: "Glee-fully",
    },
  },
  {
    id: "askjamie",
    name: "AskJamie",
    brandFamily: "okhp3",
    isBrandPreset: true,
    description:
      "Calm mid-century tones with muted aquas and beige — clean, readable, ideal for guides and documentation",
    themeIntent:
      "Support flows, helpdesk diagrams, explainers, user-assistance workflows, and friendly AI-generated step-by-step guides",
    sourceUrls: [
      "https://askjamie.bot",
      "https://github.com/OKHP3/AskJamie/blob/main/assets/css/theme.css",
    ],
    version: "0.2.0",
    colors: [
      { key: "primaryColor", label: "Primary (nodes)", value: "#fdfbf7" },
      { key: "primaryTextColor", label: "Primary text", value: "#2e2b29" },
      { key: "primaryBorderColor", label: "Primary border", value: "#2d6f7e" },
      { key: "lineColor", label: "Lines & arrows", value: "#2d6f7e" },
      { key: "secondaryColor", label: "Secondary nodes", value: "#f6f2ee" },
      { key: "secondaryTextColor", label: "Secondary text", value: "#2e2b29" },
      { key: "secondaryBorderColor", label: "Secondary border", value: "#2d6f7e" },
      { key: "tertiaryColor", label: "Tertiary nodes", value: "#e1ecef" },
      { key: "tertiaryTextColor", label: "Tertiary text", value: "#2e2b29" },
      { key: "tertiaryBorderColor", label: "Tertiary border", value: "#2d6f7e" },
      { key: "textColor", label: "Text color", value: "#2e2b29" },
      { key: "background", label: "Background", value: "#f6f2ee" },
      { key: "mainBkg", label: "Main background", value: "#fdfbf7" },
      { key: "nodeBorder", label: "Node border", value: "#2d6f7e" },
      { key: "clusterBkg", label: "Cluster background", value: "#e8f4f7" },
      { key: "titleColor", label: "Title color", value: "#2d6f7e" },
      { key: "edgeLabelBackground", label: "Edge label bg", value: "#f6f2ee" },
      { key: "fontFamily", label: "Font family", value: "Open Sans, system-ui, sans-serif" },
    ],
    attribution: {
      ...TOOL_ATTRIBUTION_BASE,
      enabledByDefault: true,
      label: "Themed with Mermaid Theme Builder · AskJamie",
      themeName: "AskJamie",
    },
  },
];

export const BRAND_PALETTES = BUILTIN_PALETTES.filter((p) => p.isBrandPreset);
export const UTILITY_PALETTES = BUILTIN_PALETTES.filter((p) => !p.isBrandPreset);

export function getEffectiveThemeName(
  palette: Palette,
  customName: string,
  isCustomized: boolean
): string {
  if (customName.trim()) return customName.trim();
  if (isCustomized) return `Custom — based on ${palette.name}`;
  return palette.name;
}
