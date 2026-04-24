export interface ThemeColor {
  key: string;
  label: string;
  value: string;
}

export interface Palette {
  id: string;
  name: string;
  description: string;
  colors: ThemeColor[];
}

export const BUILTIN_PALETTES: Palette[] = [
  {
    id: "ocean-depth",
    name: "Ocean Depth",
    description: "Deep blues and teals — clean, professional, great for technical diagrams",
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
  },
  {
    id: "forest-sage",
    name: "Forest Sage",
    description: "Earthy greens and warm neutrals — approachable, calm, ideal for process flows",
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
  },
  {
    id: "slate-ember",
    name: "Slate Ember",
    description: "Dark grays with warm orange accents — high contrast, modern, striking for architecture diagrams",
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
  },
  {
    id: "violet-mist",
    name: "Violet Mist",
    description: "Soft purples and lavenders — elegant, creative, great for product and UX flows",
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
  },
  {
    id: "okh-industrial",
    name: "OKH Industrial",
    description: "OverKill Hill P³ — dark charcoal nodes with rust-orange borders, exact brand tokens from overkillhill.com",
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
  },
  {
    id: "glee-teal",
    name: "Glee Teal",
    description: "Glee-fully Tools — deep teal backgrounds with olive-green borders and amber highlights from glee-fully.tools",
    colors: [
      { key: "primaryColor", label: "Primary (nodes)", value: "#1c3a34" },
      { key: "primaryTextColor", label: "Primary text", value: "#e5e7eb" },
      { key: "primaryBorderColor", label: "Primary border", value: "#676a2c" },
      { key: "lineColor", label: "Lines & arrows", value: "#e6a03c" },
      { key: "secondaryColor", label: "Secondary nodes", value: "#111827" },
      { key: "tertiaryColor", label: "Tertiary nodes", value: "#676a2c" },
      { key: "background", label: "Background", value: "#020617" },
      { key: "mainBkg", label: "Main background", value: "#1c3a34" },
      { key: "nodeBorder", label: "Node border", value: "#676a2c" },
      { key: "clusterBkg", label: "Cluster background", value: "#111827" },
      { key: "titleColor", label: "Title color", value: "#e6a03c" },
      { key: "edgeLabelBackground", label: "Edge label bg", value: "#1c3a34" },
      { key: "fontFamily", label: "Font family", value: "DM Sans, system-ui, sans-serif" },
    ],
  },
  {
    id: "ask-jamie-warm",
    name: "Ask Jamie Warm",
    description: "Ask Jamie — warm paper light mode with espresso/rust nodes, ochre lines, and cream backgrounds from askjamie.bot",
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
  },
];

export function createCustomPalette(base: Palette, overrides: Partial<ThemeColor>[] = []): Palette {
  const colors = base.colors.map((c) => {
    const override = overrides.find((o) => o.key === c.key);
    return override ? { ...c, ...override } : c;
  });
  return { ...base, id: "custom", name: "Custom", description: "Your custom palette", colors };
}
