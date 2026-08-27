export interface TypographyTier {
  fontSize: number;
  fontFamily: string;
}

export interface TypographySettings {
  diagramTitle: TypographyTier;
  subgraphTitle: TypographyTier;
  nestedSubgraphTitle: TypographyTier;
  nodeLabel: TypographyTier;
  edgeLabel: TypographyTier;
}

export const DEFAULT_TYPOGRAPHY: TypographySettings = {
  diagramTitle: { fontSize: 20, fontFamily: "" },
  subgraphTitle: { fontSize: 16, fontFamily: "" },
  nestedSubgraphTitle: { fontSize: 14, fontFamily: "" },
  nodeLabel: { fontSize: 14, fontFamily: "" },
  edgeLabel: { fontSize: 12, fontFamily: "" },
};

export type TypographyTierKey = keyof TypographySettings;

export const TIER_META: Record<
  TypographyTierKey,
  { label: string; description: string; cssProp: string }
> = {
  diagramTitle: {
    label: "Diagram Title",
    description: "%%{init}%% title / diagram heading",
    cssProp: ".label",
  },
  subgraphTitle: {
    label: "Subgraph Title",
    description: "Top-level subgraph / cluster header",
    cssProp: ".cluster-label",
  },
  nestedSubgraphTitle: {
    label: "Nested Subgraph",
    description: "Inner subgraph header labels",
    cssProp: ".cluster-label .nodeLabel",
  },
  nodeLabel: {
    label: "Node Label",
    description: "Text inside nodes and shapes",
    cssProp: ".node .label",
  },
  edgeLabel: { label: "Edge Label", description: "Text on edge connectors", cssProp: ".edgeLabel" },
};

export const TIER_ORDER: TypographyTierKey[] = [
  "diagramTitle",
  "subgraphTitle",
  "nestedSubgraphTitle",
  "nodeLabel",
  "edgeLabel",
];

const GOOGLE_FONT_PRESETS = {
  "DM Sans": {
    id: "dm-sans",
    href: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&display=swap",
  },
  "Alfa Slab One": {
    id: "alfa-slab-one",
    href: "https://fonts.googleapis.com/css2?family=Alfa+Slab+One&display=swap",
  },
  "JetBrains Mono": {
    id: "jetbrains-mono",
    href: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap",
  },
  Inter: {
    id: "inter",
    href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap",
  },
} as const;

function getPrimaryFontFamily(fontFamily: string): string {
  const firstFamily = fontFamily.split(",", 1)[0]?.trim() ?? "";
  if (
    (firstFamily.startsWith('"') && firstFamily.endsWith('"')) ||
    (firstFamily.startsWith("'") && firstFamily.endsWith("'"))
  ) {
    return firstFamily.slice(1, -1);
  }
  return firstFamily;
}

/**
 * Lazily adds the Google Fonts stylesheet for a supported preset. Custom and
 * system font stacks are intentionally ignored, and the stable link ID keeps
 * repeated selections across typography tiers from requesting a font twice.
 */
export function loadGoogleFont(
  fontFamily: string,
  doc: Document | undefined = typeof document === "undefined" ? undefined : document
): void {
  const primaryFontFamily = getPrimaryFontFamily(fontFamily);
  const preset = GOOGLE_FONT_PRESETS[primaryFontFamily as keyof typeof GOOGLE_FONT_PRESETS];
  if (!preset || !doc || doc.getElementById(`mtb-google-font-${preset.id}`)) return;

  const link = doc.createElement("link");
  link.id = `mtb-google-font-${preset.id}`;
  link.rel = "stylesheet";
  link.href = preset.href;
  link.dataset.mtbGoogleFont = preset.id;
  doc.head.appendChild(link);
}

export function enforceHierarchy(settings: TypographySettings): TypographySettings {
  const s = { ...settings };
  // subgraphTitle cannot exceed diagramTitle
  if (s.subgraphTitle.fontSize > s.diagramTitle.fontSize)
    s.subgraphTitle = { ...s.subgraphTitle, fontSize: s.diagramTitle.fontSize };
  // nestedSubgraphTitle cannot exceed subgraphTitle
  if (s.nestedSubgraphTitle.fontSize > s.subgraphTitle.fontSize)
    s.nestedSubgraphTitle = { ...s.nestedSubgraphTitle, fontSize: s.subgraphTitle.fontSize };
  // nodeLabel cannot exceed subgraphTitle
  if (s.nodeLabel.fontSize > s.subgraphTitle.fontSize)
    s.nodeLabel = { ...s.nodeLabel, fontSize: s.subgraphTitle.fontSize };
  // edgeLabel cannot exceed nodeLabel
  if (s.edgeLabel.fontSize > s.nodeLabel.fontSize)
    s.edgeLabel = { ...s.edgeLabel, fontSize: s.nodeLabel.fontSize };
  return s;
}

export function isDefaultTypography(settings: TypographySettings): boolean {
  return (
    settings.diagramTitle.fontSize === DEFAULT_TYPOGRAPHY.diagramTitle.fontSize &&
    settings.subgraphTitle.fontSize === DEFAULT_TYPOGRAPHY.subgraphTitle.fontSize &&
    settings.nestedSubgraphTitle.fontSize === DEFAULT_TYPOGRAPHY.nestedSubgraphTitle.fontSize &&
    settings.nodeLabel.fontSize === DEFAULT_TYPOGRAPHY.nodeLabel.fontSize &&
    settings.edgeLabel.fontSize === DEFAULT_TYPOGRAPHY.edgeLabel.fontSize &&
    settings.diagramTitle.fontFamily === DEFAULT_TYPOGRAPHY.diagramTitle.fontFamily &&
    settings.subgraphTitle.fontFamily === DEFAULT_TYPOGRAPHY.subgraphTitle.fontFamily &&
    settings.nestedSubgraphTitle.fontFamily === DEFAULT_TYPOGRAPHY.nestedSubgraphTitle.fontFamily &&
    settings.nodeLabel.fontFamily === DEFAULT_TYPOGRAPHY.nodeLabel.fontFamily &&
    settings.edgeLabel.fontFamily === DEFAULT_TYPOGRAPHY.edgeLabel.fontFamily
  );
}

/**
 * Characters that break a CSS property value if injected verbatim.
 * A semicolon ends the declaration early; braces open/close rule blocks.
 */
const FONT_FAMILY_UNSAFE_RE = /[;{}]/;

/** Returns true if the font-family value contains characters that would corrupt CSS output. */
export function hasFontFamilyInjectionChars(value: string): boolean {
  return FONT_FAMILY_UNSAFE_RE.test(value);
}

/**
 * Strips characters from a fontFamily value that would break CSS property syntax.
 * The sanitized value is safe to emit verbatim inside a `font-family: ...;` declaration.
 */
export function sanitizeFontFamily(value: string): string {
  return value.replace(/[;{}]/g, "");
}

export function generateTypographyCss(settings: TypographySettings): string {
  const lines: string[] = ["/* Mermaid typography hierarchy — flowchart/subgraph targets */"];
  for (const key of TIER_ORDER) {
    const tier = settings[key];
    const meta = TIER_META[key];
    const rules: string[] = [];
    if (tier.fontSize !== DEFAULT_TYPOGRAPHY[key].fontSize)
      rules.push(`font-size: ${tier.fontSize}px;`);
    if (tier.fontFamily) rules.push(`font-family: ${sanitizeFontFamily(tier.fontFamily)};`);
    if (rules.length > 0) {
      lines.push(`/* ${meta.label} */`);
      lines.push(`${meta.cssProp} { ${rules.join(" ")} }`);
    }
  }
  return lines.join("\n");
}

export function typographyToScaffoldSection(settings: TypographySettings): string {
  const rows = TIER_ORDER.map((key) => {
    const tier = settings[key];
    const meta = TIER_META[key];
    // Escape pipe characters so a font-family value like "Font | Fallback" does
    // not split the Markdown table cell into extra columns.
    const ff = (tier.fontFamily || "(palette fontFamily)").replace(/\|/g, "\\|");
    return `| ${meta.label} | ${meta.description} | ${tier.fontSize}px | ${ff} |`;
  });
  return `## Typography Hierarchy

The following 5-tier type scale applies to this diagram. Do not alter font sizes outside this contract.

| Tier | Target | Size | Font Family |
|------|--------|------|-------------|
${rows.join("\n")}

**Hierarchy rule:** Each tier's size must be ≤ the tier above it. If you nest subgraphs, inner headings must be smaller than outer headings.

**CSS targets (flowchart):**
- Diagram title: \`.label\`
- Subgraph title: \`.cluster-label\`
- Node label: \`.node .label\`
- Edge label: \`.edgeLabel\``;
}
