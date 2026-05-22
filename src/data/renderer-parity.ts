export type RendererSupport = "full" | "partial" | "none" | "unknown";

export interface RendererLookSupport {
  classic: RendererSupport;
  neo: RendererSupport;
  handDrawn: RendererSupport;
}

export interface RendererProfile {
  id: string;
  displayName: string;
  shortName: string;
  url: string;
  notes: string;
  looksSupported: RendererLookSupport;
  themeVariableSupport: RendererSupport;
  cssInjectionSupport: RendererSupport;
  mermaidVersionApprox: string;
  caveats: string[];
}

export const RENDERER_PROFILES: RendererProfile[] = [
  {
    id: "mermaid-live",
    displayName: "Mermaid Live Editor",
    shortName: "mermaid.live",
    url: "https://mermaid.live",
    notes:
      "Reference renderer. Always runs the latest published Mermaid. All looks, themeVariables, and CSS injection are fully supported. Use this to validate before committing to other renderers.",
    looksSupported: { classic: "full", neo: "full", handDrawn: "full" },
    themeVariableSupport: "full",
    cssInjectionSupport: "full",
    mermaidVersionApprox: "latest",
    caveats: [],
  },
  {
    id: "github",
    displayName: "GitHub",
    shortName: "GitHub",
    url: "https://github.com",
    notes:
      "Renders Mermaid in issues, PRs, markdown files, and wikis. The %%{init}%% directive is respected and themeVariables apply. Mermaid version is pinned to a stable release — neo look may work depending on pinned version; handDrawn requires Rough.js which GitHub does not bundle.",
    looksSupported: { classic: "full", neo: "partial", handDrawn: "none" },
    themeVariableSupport: "full",
    cssInjectionSupport: "none",
    mermaidVersionApprox: "11.x (pinned, updated periodically)",
    caveats: [
      "CSS injection not supported",
      "handDrawn requires Rough.js — not available in GitHub renderer",
      "neo look depends on GitHub's pinned Mermaid version",
      "Some beta/experimental diagram families may not render",
    ],
  },
  {
    id: "gitlab",
    displayName: "GitLab",
    shortName: "GitLab",
    url: "https://gitlab.com",
    notes:
      "Similar to GitHub. Mermaid is rendered in markdown files, wikis, and descriptions. themeVariables from %%{init}%% are respected. Self-hosted GitLab instances may use older Mermaid versions where neo/handDrawn are unavailable.",
    looksSupported: { classic: "full", neo: "partial", handDrawn: "none" },
    themeVariableSupport: "full",
    cssInjectionSupport: "none",
    mermaidVersionApprox: "11.x (varies by GitLab version)",
    caveats: [
      "CSS injection not supported",
      "handDrawn not available",
      "Self-hosted instances may use a significantly older Mermaid version",
    ],
  },
  {
    id: "notion",
    displayName: "Notion",
    shortName: "Notion",
    url: "https://notion.so",
    notes:
      "Notion embeds Mermaid diagrams in pages. The %%{init}%% directive is supported but only a subset of themeVariables are applied. Mermaid version is pinned to an older stable release — neo and handDrawn looks are unavailable. Some diagram families (beta/experimental) may not render.",
    looksSupported: { classic: "full", neo: "none", handDrawn: "none" },
    themeVariableSupport: "partial",
    cssInjectionSupport: "none",
    mermaidVersionApprox: "10.x (pinned, rarely updated)",
    caveats: [
      "Pinned to an older Mermaid version — neo and handDrawn unavailable",
      "Only a subset of themeVariables are applied",
      "CSS injection not supported",
      "Beta and experimental diagram families may fail to render",
      "No dark-mode theming passthrough",
    ],
  },
  {
    id: "obsidian",
    displayName: "Obsidian",
    shortName: "Obsidian",
    url: "https://obsidian.md",
    notes:
      "Obsidian supports Mermaid via a built-in renderer and community plugins. themeVariables are respected. The Mermaid Enhancer or similar plugins can upgrade the bundled Mermaid version. CSS injection may work via Obsidian CSS snippets when targeting .mermaid elements.",
    looksSupported: { classic: "full", neo: "partial", handDrawn: "partial" },
    themeVariableSupport: "full",
    cssInjectionSupport: "partial",
    mermaidVersionApprox: "11.x (built-in; plugin may update)",
    caveats: [
      "Mermaid version depends on Obsidian release or installed plugin",
      "CSS injection requires custom Obsidian snippets",
      "neo/handDrawn availability depends on bundled Mermaid version",
    ],
  },
  {
    id: "confluence",
    displayName: "Confluence + Plugin",
    shortName: "Confluence",
    url: "https://marketplace.atlassian.com/search?category=Diagramming&hosting=cloud",
    notes:
      "Mermaid in Confluence requires a third-party macro plugin (e.g., Mermaid Diagrams, Markdown Macro). Plugin quality and Mermaid version vary. Most plugins support basic themeVariables; CSS injection is generally not available. neo and handDrawn looks are typically unavailable.",
    looksSupported: { classic: "partial", neo: "none", handDrawn: "none" },
    themeVariableSupport: "partial",
    cssInjectionSupport: "none",
    mermaidVersionApprox: "varies by plugin (often 10.x)",
    caveats: [
      "Third-party plugin required — not native Confluence functionality",
      "Plugin version determines Mermaid version and feature support",
      "CSS injection not available",
      "neo and handDrawn looks not supported",
      "Not all diagram families render correctly",
      "Cloud vs. Data Center plugin behavior may differ",
    ],
  },
  {
    id: "cli",
    displayName: "Mermaid CLI (mmdc)",
    shortName: "CLI/mmdc",
    url: "https://github.com/mermaid-js/mermaid-cli",
    notes:
      "Command-line renderer using Puppeteer + Mermaid. Produces SVG/PNG/PDF. Full feature support — the installed Mermaid version determines look and feature support. CSS injection is possible via the --cssFile flag. Best for CI/CD pipelines and batch rendering.",
    looksSupported: { classic: "full", neo: "full", handDrawn: "full" },
    themeVariableSupport: "full",
    cssInjectionSupport: "full",
    mermaidVersionApprox: "pinned to installed npm package version",
    caveats: [
      "Must install matching Mermaid npm version to access new looks/features",
      "CSS injection via --cssFile flag — not inline",
      "Requires Node.js + Chromium (Puppeteer) in CI environment",
    ],
  },
];

export function getRendererById(id: string): RendererProfile | undefined {
  return RENDERER_PROFILES.find((r) => r.id === id);
}

export function supportLabel(s: RendererSupport): string {
  switch (s) {
    case "full":
      return "Full";
    case "partial":
      return "Partial";
    case "none":
      return "None";
    case "unknown":
      return "Unknown";
  }
}

export function supportColor(s: RendererSupport): string {
  switch (s) {
    case "full":
      return "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10";
    case "partial":
      return "text-amber-600 dark:text-amber-400 bg-amber-500/10";
    case "none":
      return "text-rose-600 dark:text-rose-400 bg-rose-500/10";
    case "unknown":
      return "text-muted-foreground bg-muted/50";
  }
}

export function rendererToScaffoldSection(rendererId: string, look?: string): string {
  const renderer = getRendererById(rendererId);
  if (!renderer) return "";

  const lookKey = (look ?? "classic") as keyof RendererLookSupport;
  const lookSupport = renderer.looksSupported[lookKey] ?? ("unknown" as RendererSupport);
  const lookLabel = lookKey === "handDrawn" ? "Hand-Drawn" : lookKey === "neo" ? "Neo" : "Classic";

  const LOOK_KEYS: (keyof RendererLookSupport)[] = ["classic", "neo", "handDrawn"];
  const LOOK_NAMES: Record<keyof RendererLookSupport, string> = {
    classic: "Classic",
    neo: "Neo",
    handDrawn: "Hand-Drawn",
  };

  const rows = LOOK_KEYS.map(
    (k) => `| ${LOOK_NAMES[k]} | ${supportLabel(renderer.looksSupported[k])} |`,
  );

  const lines: string[] = [
    `## Target Renderer: ${renderer.displayName}`,
    "",
    `**Version:** ${renderer.mermaidVersionApprox}  `,
    `**themeVariables:** ${supportLabel(renderer.themeVariableSupport)} · **CSS injection:** ${supportLabel(renderer.cssInjectionSupport)}`,
    "",
    "### Look compatibility",
    "",
    "| Look | Support |",
    "|------|---------|",
    ...rows,
  ];

  if (lookSupport === "none") {
    lines.push(
      "",
      `> ⚠ **Warning:** The selected **${lookLabel}** look is NOT supported by ${renderer.displayName}. Revert to Classic look to ensure correct rendering in this environment.`,
    );
  } else if (lookSupport === "partial") {
    lines.push(
      "",
      `> ⚠ **Caution:** The selected **${lookLabel}** look has only partial support in ${renderer.displayName}. Validate in the target environment before publishing.`,
    );
  }

  if (renderer.caveats.length > 0) {
    lines.push("", "### Renderer constraints", "");
    for (const caveat of renderer.caveats) {
      lines.push(`- ${caveat}`);
    }
  }

  if (renderer.notes) {
    lines.push("", `*${renderer.notes}*`);
  }

  return lines.join("\n");
}
