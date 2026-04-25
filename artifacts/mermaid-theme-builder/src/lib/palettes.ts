export interface ThemeColor {
  key: string;
  label: string;
  value: string;
}

export interface Palette {
  id: string;
  name: string;
  description: string;
  /** Attribution note shown when the palette derives from a public brand CSS */
  attribution?: string;
  colors: ThemeColor[];
}

// ── OKH Ecosystem Palettes ────────────────────────────────────────────────────
// Derived from public OverKill Hill P³ site CSS (overkillhill.com / github.com/OKHP3/OverKill-Hill)
// CSS tokens: --okh-teal #1c3a34, --okh-orange #c46a2c, --okh-amber #e6a03c,
//             --okh-paper #f6f2ee, --okh-espresso #2a2320, DM Sans font family.

// ── Generic Palettes ─────────────────────────────────────────────────────────
// Original palettes not derived from any brand.

export const BUILTIN_PALETTES: Palette[] = [
  // ── OKH Ecosystem ──────────────────────────────────────────────────────────
  {
    id: "okh-light",
    name: "OKH Light",
    description: "OverKill Hill P³ light palette — warm paper tones, teal nodes, rust-orange accents",
    attribution: "Derived from OverKill Hill P³ public site CSS (overkillhill.com). Token sources: --okh-teal, --okh-orange, --okh-paper, data-theme=light tokens.",
    colors: [
      { key: "primaryColor", label: "Primary (nodes)", value: "#1c3a34" },
      { key: "primaryTextColor", label: "Primary text", value: "#ffffff" },
      { key: "primaryBorderColor", label: "Primary border", value: "#c46a2c" },
      { key: "lineColor", label: "Lines & arrows", value: "#c46a2c" },
      { key: "secondaryColor", label: "Secondary nodes", value: "#e6a03c" },
      { key: "tertiaryColor", label: "Tertiary nodes", value: "#f6f2ee" },
      { key: "background", label: "Background", value: "#eff2f5" },
      { key: "mainBkg", label: "Main background", value: "#f0ebe5" },
      { key: "nodeBorder", label: "Node border", value: "#c46a2c" },
      { key: "clusterBkg", label: "Cluster background", value: "#f6f2ee" },
      { key: "titleColor", label: "Title color", value: "#0f172a" },
      { key: "edgeLabelBackground", label: "Edge label bg", value: "#f6f2ee" },
      { key: "fontFamily", label: "Font family", value: "DM Sans, system-ui, sans-serif" },
    ],
  },
  {
    id: "okh-protocol",
    name: "OKH Protocol",
    description: "OverKill Hill P³ dark palette — espresso background, rust-orange edges, industrial blueprint feel",
    attribution: "Derived from OverKill Hill P³ public site CSS (overkillhill.com). Token sources: --mermaid-* variables, --okh-espresso, data-theme=dark tokens.",
    colors: [
      { key: "primaryColor", label: "Primary (nodes)", value: "#111827" },
      { key: "primaryTextColor", label: "Primary text", value: "#e5e7eb" },
      { key: "primaryBorderColor", label: "Primary border", value: "#c46a2c" },
      { key: "lineColor", label: "Lines & arrows", value: "#c46a2c" },
      { key: "secondaryColor", label: "Secondary nodes", value: "#181f26" },
      { key: "tertiaryColor", label: "Tertiary nodes", value: "#1c3a34" },
      { key: "background", label: "Background", value: "#2a2320" },
      { key: "mainBkg", label: "Main background", value: "#111827" },
      { key: "nodeBorder", label: "Node border", value: "#c46a2c" },
      { key: "clusterBkg", label: "Cluster background", value: "#0d1117" },
      { key: "titleColor", label: "Title color", value: "#e6a03c" },
      { key: "edgeLabelBackground", label: "Edge label bg", value: "#181f26" },
      { key: "fontFamily", label: "Font family", value: "DM Sans, system-ui, sans-serif" },
    ],
  },
  {
    id: "askjamie-friendly",
    name: "AskJamie Friendly",
    description: "Clean, approachable light palette — calm blues with OKH orange accents, great for how-to and process diagrams",
    attribution: "Derived from AskJamie (askjamie.bot) public site CSS (github.com/OKHP3/AskJamie). Light-mode surface and accent tokens.",
    colors: [
      { key: "primaryColor", label: "Primary (nodes)", value: "#1d4ed8" },
      { key: "primaryTextColor", label: "Primary text", value: "#ffffff" },
      { key: "primaryBorderColor", label: "Primary border", value: "#c46a2c" },
      { key: "lineColor", label: "Lines & arrows", value: "#3b82f6" },
      { key: "secondaryColor", label: "Secondary nodes", value: "#93c5fd" },
      { key: "tertiaryColor", label: "Tertiary nodes", value: "#eff6ff" },
      { key: "background", label: "Background", value: "#f9fafb" },
      { key: "mainBkg", label: "Main background", value: "#eff6ff" },
      { key: "nodeBorder", label: "Node border", value: "#2563eb" },
      { key: "clusterBkg", label: "Cluster background", value: "#eff6ff" },
      { key: "titleColor", label: "Title color", value: "#1e3a5f" },
      { key: "edgeLabelBackground", label: "Edge label bg", value: "#f9fafb" },
      { key: "fontFamily", label: "Font family", value: "DM Sans, system-ui, sans-serif" },
    ],
  },
  {
    id: "gleefully-bright",
    name: "Glee-fully Bright",
    description: "Bright amber-gold palette — energetic, warm, ideal for tool flows and quick reference diagrams",
    attribution: "Derived from Glee-fully Tools (glee-fully.tools) public site CSS (github.com/OKHP3/Glee-fullyTools). OKH amber accent family.",
    colors: [
      { key: "primaryColor", label: "Primary (nodes)", value: "#d97706" },
      { key: "primaryTextColor", label: "Primary text", value: "#ffffff" },
      { key: "primaryBorderColor", label: "Primary border", value: "#f59e0b" },
      { key: "lineColor", label: "Lines & arrows", value: "#f59e0b" },
      { key: "secondaryColor", label: "Secondary nodes", value: "#fcd34d" },
      { key: "tertiaryColor", label: "Tertiary nodes", value: "#fef3c7" },
      { key: "background", label: "Background", value: "#fffbeb" },
      { key: "mainBkg", label: "Main background", value: "#fef3c7" },
      { key: "nodeBorder", label: "Node border", value: "#d97706" },
      { key: "clusterBkg", label: "Cluster background", value: "#fef3c7" },
      { key: "titleColor", label: "Title color", value: "#78350f" },
      { key: "edgeLabelBackground", label: "Edge label bg", value: "#fffbeb" },
      { key: "fontFamily", label: "Font family", value: "DM Sans, system-ui, sans-serif" },
    ],
  },
  // ── Generic Palettes ────────────────────────────────────────────────────────
  {
    id: "neutral-enterprise",
    name: "Neutral Enterprise",
    description: "Clean gray-on-white palette — neutral, professional, works in any corporate or technical context",
    colors: [
      { key: "primaryColor", label: "Primary (nodes)", value: "#374151" },
      { key: "primaryTextColor", label: "Primary text", value: "#ffffff" },
      { key: "primaryBorderColor", label: "Primary border", value: "#6b7280" },
      { key: "lineColor", label: "Lines & arrows", value: "#6b7280" },
      { key: "secondaryColor", label: "Secondary nodes", value: "#9ca3af" },
      { key: "tertiaryColor", label: "Tertiary nodes", value: "#f3f4f6" },
      { key: "background", label: "Background", value: "#f9fafb" },
      { key: "mainBkg", label: "Main background", value: "#f3f4f6" },
      { key: "nodeBorder", label: "Node border", value: "#374151" },
      { key: "clusterBkg", label: "Cluster background", value: "#f3f4f6" },
      { key: "titleColor", label: "Title color", value: "#111827" },
      { key: "edgeLabelBackground", label: "Edge label bg", value: "#f9fafb" },
      { key: "fontFamily", label: "Font family", value: "Inter, system-ui, sans-serif" },
    ],
  },
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
];

export function createCustomPalette(base: Palette, overrides: Partial<ThemeColor>[] = []): Palette {
  const colors = base.colors.map((c) => {
    const override = overrides.find((o) => o.key === c.key);
    return override ? { ...c, ...override } : c;
  });
  return { ...base, id: "custom", name: "Custom", description: "Your custom palette", colors };
}
