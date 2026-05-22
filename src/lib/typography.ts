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
  diagramTitle:        { fontSize: 20, fontFamily: "" },
  subgraphTitle:       { fontSize: 16, fontFamily: "" },
  nestedSubgraphTitle: { fontSize: 14, fontFamily: "" },
  nodeLabel:           { fontSize: 14, fontFamily: "" },
  edgeLabel:           { fontSize: 12, fontFamily: "" },
};

export type TypographyTierKey = keyof TypographySettings;

export const TIER_META: Record<TypographyTierKey, { label: string; description: string; cssProp: string }> = {
  diagramTitle:        { label: "Diagram Title",        description: "%%{init}%% title / diagram heading",          cssProp: ".label" },
  subgraphTitle:       { label: "Subgraph Title",        description: "Top-level subgraph / cluster header",         cssProp: ".cluster-label" },
  nestedSubgraphTitle: { label: "Nested Subgraph",       description: "Inner subgraph header labels",                cssProp: ".cluster-label .nodeLabel" },
  nodeLabel:           { label: "Node Label",            description: "Text inside nodes and shapes",                cssProp: ".node .label" },
  edgeLabel:           { label: "Edge Label",            description: "Text on edge connectors",                     cssProp: ".edgeLabel" },
};

export const TIER_ORDER: TypographyTierKey[] = [
  "diagramTitle",
  "subgraphTitle",
  "nestedSubgraphTitle",
  "nodeLabel",
  "edgeLabel",
];

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

export function generateTypographyCss(settings: TypographySettings): string {
  const lines: string[] = [
    "/* Mermaid typography hierarchy — flowchart/subgraph targets */",
  ];
  for (const key of TIER_ORDER) {
    const tier = settings[key];
    const meta = TIER_META[key];
    const rules: string[] = [];
    if (tier.fontSize !== DEFAULT_TYPOGRAPHY[key].fontSize) rules.push(`font-size: ${tier.fontSize}px;`);
    if (tier.fontFamily) rules.push(`font-family: ${tier.fontFamily};`);
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
    const ff = tier.fontFamily || "(palette fontFamily)";
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
