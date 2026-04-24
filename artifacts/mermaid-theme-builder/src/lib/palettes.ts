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

const TOOL_ATTRIBUTION_BASE: Pick<PaletteAttribution, "toolName" | "toolVersion" | "url"> = {
  toolName: "Mermaid Theme Builder",
  toolVersion: "0.1.0",
  url: "https://overkillhill.com/projects/mermaid-theme-builder/",
};

export const BUILTIN_PALETTES: Palette[] = [
  {
    id: "overkill-hill",
    name: "OverKill Hill P³",
    brandFamily: "okhp3",
    isBrandPreset: true,
    description: "Official OverKill Hill P³ brand theme — dark charcoal nodes with rust-orange borders and amber titles. Built from the exact --mermaid-* tokens in the OKH shared theme.css.",
    themeIntent: "Technical, architectural, systems, AI tooling, strategy, and executive-facing diagrams",
    sourceUrls: [
      "https://overkillhill.com",
      "https://github.com/OKHP3/OverKill-Hill/blob/main/assets/css/theme.css",
    ],
    version: "0.1.0",
    colors: [
      { key: "primaryColor", label: "Primary (nodes)", value: "#111827" },
      { key: "primaryTextColor", label: "Primary text", value: "#e5e7eb" },
      { key: "primaryBorderColor", label: "Primary border", value: "#c46a2c" },
      { key: "lineColor", label: "Lines & arrows", value: "#c46a2c" },
      { key: "secondaryColor", label: "Secondary nodes", value: "#181f26" },
      { key: "tertiaryColor", label: "Tertiary nodes", value: "#1c3a34" },
      { key: "background", label: "Background", value: "#0d1117" },
      { key: "mainBkg", label: "Main background", value: "#111827" },
      { key: "nodeBorder", label: "Node border", value: "#c46a2c" },
      { key: "clusterBkg", label: "Cluster background", value: "#0d1117" },
      { key: "titleColor", label: "Title color", value: "#e6a03c" },
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
    id: "askjamie",
    name: "AskJamie",
    brandFamily: "okhp3",
    isBrandPreset: true,
    description: "Official AskJamie brand theme — warm paper light mode with espresso/rust nodes, ochre lines, and cream backgrounds. Approachable and trustworthy for helpdesk and user-facing flows.",
    themeIntent: "Support flows, helpdesk diagrams, explainers, user-assistance workflows, and friendly AI-generated step-by-step guides",
    sourceUrls: [
      "https://askjamie.bot",
      "https://github.com/OKHP3/AskJamie/blob/main/assets/css/theme.css",
    ],
    version: "0.1.0",
    colors: [
      { key: "primaryColor", label: "Primary (nodes)", value: "#5b3a27" },
      { key: "primaryTextColor", label: "Primary text", value: "#f6f2ee" },
      { key: "primaryBorderColor", label: "Primary border", value: "#c46a2c" },
      { key: "lineColor", label: "Lines & arrows", value: "#a06e28" },
      { key: "secondaryColor", label: "Secondary nodes", value: "#676a2c" },
      { key: "tertiaryColor", label: "Tertiary nodes", value: "#e6a03c" },
      { key: "background", label: "Background", value: "#f6f2ee" },
      { key: "mainBkg", label: "Main background", value: "#eff2f5" },
      { key: "nodeBorder", label: "Node border", value: "#a06e28" },
      { key: "clusterBkg", label: "Cluster background", value: "#f0ebe5" },
      { key: "titleColor", label: "Title color", value: "#2a2320" },
      { key: "edgeLabelBackground", label: "Edge label bg", value: "#f6f2ee" },
      { key: "fontFamily", label: "Font family", value: "DM Sans, system-ui, sans-serif" },
    ],
    attribution: {
      ...TOOL_ATTRIBUTION_BASE,
      enabledByDefault: true,
      label: "Themed with Mermaid Theme Builder · AskJamie",
      themeName: "AskJamie",
    },
  },
  {
    id: "glee-fully",
    name: "Glee-fully",
    brandFamily: "okhp3",
    isBrandPreset: true,
    description: "Official Glee-fully Personalizable Tools brand theme — soft teal light mode with warm amber accents. Friendly, approachable, and non-technical.",
    themeIntent: "Life-organization, personal productivity, family-friendly, consumer-facing, and approachable explainer diagrams",
    sourceUrls: [
      "https://glee-fully.tools",
      "https://github.com/OKHP3/Glee-fullyTools/blob/main/assets/css/theme.css",
    ],
    version: "0.1.0",
    colors: [
      { key: "primaryColor", label: "Primary (nodes)", value: "#1c3a34" },
      { key: "primaryTextColor", label: "Primary text", value: "#f6f2ee" },
      { key: "primaryBorderColor", label: "Primary border", value: "#2d6a4f" },
      { key: "lineColor", label: "Lines & arrows", value: "#e6a03c" },
      { key: "secondaryColor", label: "Secondary nodes", value: "#52b788" },
      { key: "tertiaryColor", label: "Tertiary nodes", value: "#d8f3e6" },
      { key: "background", label: "Background", value: "#f4fdf7" },
      { key: "mainBkg", label: "Main background", value: "#d8f3e6" },
      { key: "nodeBorder", label: "Node border", value: "#2d6a4f" },
      { key: "clusterBkg", label: "Cluster background", value: "#e8f7ef" },
      { key: "titleColor", label: "Title color", value: "#1c3a34" },
      { key: "edgeLabelBackground", label: "Edge label bg", value: "#f4fdf7" },
      { key: "fontFamily", label: "Font family", value: "DM Sans, system-ui, sans-serif" },
    ],
    attribution: {
      ...TOOL_ATTRIBUTION_BASE,
      enabledByDefault: true,
      label: "Themed with Mermaid Theme Builder · Glee-fully",
      themeName: "Glee-fully",
    },
  },
  {
    id: "ocean-depth",
    name: "Ocean Depth",
    description: "Deep blues and teals — clean, professional, great for technical diagrams",
    version: "0.1.0",
    colors: [
      { key: "primaryColor", label: "Primary (nodes)", value: "#1a4f8a" },
      { key: "primaryTextColor", label: "Primary text", value: "#ffffff" },
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
      { key: "fontFamily", label: "Font family", value: "Inter, system-ui, sans-serif" },
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
      { key: "primaryTextColor", label: "Primary text", value: "#ffffff" },
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
      { key: "fontFamily", label: "Font family", value: "Inter, system-ui, sans-serif" },
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
    description: "Dark grays with warm orange accents — high contrast, modern, striking for architecture diagrams",
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
      { key: "fontFamily", label: "Font family", value: "Inter, system-ui, sans-serif" },
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
      { key: "primaryTextColor", label: "Primary text", value: "#ffffff" },
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
      { key: "fontFamily", label: "Font family", value: "Inter, system-ui, sans-serif" },
    ],
    attribution: {
      ...TOOL_ATTRIBUTION_BASE,
      enabledByDefault: true,
      label: "Themed with Mermaid Theme Builder · Violet Mist",
      themeName: "Violet Mist",
    },
  },
];

export const BRAND_PALETTES = BUILTIN_PALETTES.filter((p) => p.isBrandPreset);
export const UTILITY_PALETTES = BUILTIN_PALETTES.filter((p) => !p.isBrandPreset);

export function getEffectiveThemeName(palette: Palette, customName: string, isCustomized: boolean): string {
  if (customName.trim()) return customName.trim();
  if (isCustomized) return `Custom — based on ${palette.name}`;
  return palette.name;
}

export function createCustomPalette(base: Palette, overrides: Partial<ThemeColor>[] = []): Palette {
  const colors = base.colors.map((c) => {
    const override = overrides.find((o) => o.key === c.key);
    return override ? { ...c, ...override } : c;
  });
  return {
    ...base,
    id: "custom",
    name: "Custom",
    description: "Your custom palette",
    isBrandPreset: false,
    colors,
  };
}
