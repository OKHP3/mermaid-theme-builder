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
  sourceUrl: string;
  notes: string;
  looksSupported: RendererLookSupport;
  initDirectiveSupport: RendererSupport;
  themeVariableSupport: RendererSupport;
  classDefSupport: RendererSupport;
  cssInjectionSupport: RendererSupport;
  customFontSupport: RendererSupport;
  mermaidVersionApprox: string;
  caveats: string[];
}

export const RENDERER_PROFILES: RendererProfile[] = [
  {
    id: "mermaid-live",
    displayName: "Mermaid Live Editor",
    shortName: "mermaid.live",
    url: "https://mermaid.live",
    sourceUrl: "https://mermaid.js.org/config/theming.html",
    notes:
      "Reference renderer. Always runs the latest published Mermaid. All looks, themeVariables, and CSS injection are fully supported. Use this to validate before committing to other renderers.",
    looksSupported: { classic: "full", neo: "full", handDrawn: "full" },
    initDirectiveSupport: "full",
    themeVariableSupport: "full",
    classDefSupport: "full",
    cssInjectionSupport: "full",
    customFontSupport: "full",
    mermaidVersionApprox: "latest",
    caveats: [],
  },
  {
    id: "github",
    displayName: "GitHub",
    shortName: "GitHub",
    url: "https://github.com",
    sourceUrl: "https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-diagrams",
    notes:
      "Renders Mermaid in issues, PRs, markdown files, and wikis. The %%{init}%% directive is respected and themeVariables apply. Mermaid version is pinned to a stable release — neo look may work depending on pinned version; handDrawn requires Rough.js which GitHub does not bundle. Custom web fonts are blocked by CSP.",
    looksSupported: { classic: "full", neo: "partial", handDrawn: "none" },
    initDirectiveSupport: "full",
    themeVariableSupport: "full",
    classDefSupport: "full",
    cssInjectionSupport: "none",
    customFontSupport: "none",
    mermaidVersionApprox: "11.x (pinned, updated periodically)",
    caveats: [
      "CSS injection not supported — external stylesheets cannot target Mermaid SVG",
      "Custom web fonts blocked by CSP — system font fallback applies",
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
    sourceUrl: "https://docs.gitlab.com/user/markdown/#mermaid",
    notes:
      "Similar to GitHub. Mermaid is rendered in markdown files, wikis, and descriptions. themeVariables from %%{init}%% are respected. Self-hosted GitLab instances may use older Mermaid versions where neo/handDrawn are unavailable. Custom web fonts are blocked by CSP.",
    looksSupported: { classic: "full", neo: "partial", handDrawn: "none" },
    initDirectiveSupport: "full",
    themeVariableSupport: "full",
    classDefSupport: "full",
    cssInjectionSupport: "none",
    customFontSupport: "none",
    mermaidVersionApprox: "11.x (varies by GitLab version)",
    caveats: [
      "CSS injection not supported",
      "Custom web fonts blocked by CSP — system font fallback applies",
      "handDrawn not available",
      "Self-hosted instances may use a significantly older Mermaid version",
    ],
  },
  {
    id: "notion",
    displayName: "Notion",
    shortName: "Notion",
    url: "https://notion.so",
    sourceUrl: "https://www.notion.so/help/embed-and-connect-other-apps",
    notes:
      "Notion embeds Mermaid diagrams in pages. The %%{init}%% directive is parsed but only a subset of themeVariables are applied — colors may differ from other renderers. Mermaid version is pinned to an older stable release — neo and handDrawn looks are unavailable. Some diagram families (beta/experimental) may not render.",
    looksSupported: { classic: "full", neo: "none", handDrawn: "none" },
    initDirectiveSupport: "partial",
    themeVariableSupport: "partial",
    classDefSupport: "full",
    cssInjectionSupport: "none",
    customFontSupport: "none",
    mermaidVersionApprox: "10.x (pinned, rarely updated)",
    caveats: [
      "%%{init}%% directive parsed but only a subset of themeVariables are applied",
      "Pinned to an older Mermaid version — neo and handDrawn unavailable",
      "CSS injection not supported",
      "Custom fonts not supported",
      "Beta and experimental diagram families may fail to render",
      "No dark-mode theming passthrough",
    ],
  },
  {
    id: "obsidian",
    displayName: "Obsidian",
    shortName: "Obsidian",
    url: "https://obsidian.md",
    sourceUrl: "https://help.obsidian.md/Editing+and+formatting/Advanced+formatting+syntax#Diagram",
    notes:
      "Obsidian supports Mermaid via a built-in renderer and community plugins. themeVariables are respected. The Mermaid Enhancer or similar plugins can upgrade the bundled Mermaid version. CSS injection may work via Obsidian CSS snippets when targeting .mermaid elements. System fonts work; web fonts require custom snippet.",
    looksSupported: { classic: "full", neo: "partial", handDrawn: "partial" },
    initDirectiveSupport: "full",
    themeVariableSupport: "full",
    classDefSupport: "full",
    cssInjectionSupport: "partial",
    customFontSupport: "partial",
    mermaidVersionApprox: "11.x (built-in; plugin may update)",
    caveats: [
      "Mermaid version depends on Obsidian release or installed plugin",
      "CSS injection requires custom Obsidian CSS snippets",
      "Custom web fonts require CSS snippet; system fonts work",
      "neo/handDrawn availability depends on bundled Mermaid version",
    ],
  },
  {
    id: "confluence",
    displayName: "Confluence + Plugin",
    shortName: "Confluence",
    url: "https://marketplace.atlassian.com/search?category=Diagramming&hosting=cloud",
    sourceUrl: "https://marketplace.atlassian.com/search?category=Diagramming&hosting=cloud",
    notes:
      "Mermaid in Confluence requires a third-party macro plugin (e.g., Mermaid Diagrams, Markdown Macro). Plugin quality and Mermaid version vary. Most plugins support basic themeVariables; CSS injection is generally not available. neo and handDrawn looks are typically unavailable.",
    looksSupported: { classic: "partial", neo: "none", handDrawn: "none" },
    initDirectiveSupport: "partial",
    themeVariableSupport: "partial",
    classDefSupport: "partial",
    cssInjectionSupport: "none",
    customFontSupport: "none",
    mermaidVersionApprox: "varies by plugin (often 10.x)",
    caveats: [
      "Third-party plugin required — not native Confluence functionality",
      "Plugin version determines Mermaid version and feature support",
      "%%{init}%% support and themeVariable coverage varies by plugin",
      "classDef rendering quality varies by plugin",
      "CSS injection not available",
      "Custom fonts not supported",
      "neo and handDrawn looks not supported",
      "Cloud vs. Data Center plugin behavior may differ",
    ],
  },
  {
    id: "cli",
    displayName: "Mermaid CLI (mmdc)",
    shortName: "CLI/mmdc",
    url: "https://github.com/mermaid-js/mermaid-cli",
    sourceUrl: "https://github.com/mermaid-js/mermaid-cli",
    notes:
      "Command-line renderer using Puppeteer + Mermaid. Produces SVG/PNG/PDF. Full feature support — the installed Mermaid version determines look and feature support. CSS injection is possible via the --cssFile flag. Best for CI/CD pipelines and batch rendering.",
    looksSupported: { classic: "full", neo: "full", handDrawn: "full" },
    initDirectiveSupport: "full",
    themeVariableSupport: "full",
    classDefSupport: "full",
    cssInjectionSupport: "full",
    customFontSupport: "full",
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

/**
 * Builds a one-line HTML comment that identifies the target renderer and lists
 * any styling capabilities that are blocked or limited on that renderer.
 * Returns an empty string for unknown / generic (empty) renderer IDs.
 */
export function buildRendererHeaderComment(rendererId: string): string {
  if (!rendererId) return "";
  const renderer = getRendererById(rendererId);
  if (!renderer) return "";
  const blocked: string[] = [];
  if (renderer.initDirectiveSupport === "none") blocked.push("%%{init}%% not supported");
  if (renderer.themeVariableSupport === "partial") blocked.push("themeVariable support is partial");
  if (renderer.cssInjectionSupport === "none") blocked.push("CSS injection not supported");
  else if (renderer.cssInjectionSupport === "partial") blocked.push("CSS injection is partial");
  if (renderer.customFontSupport === "none") blocked.push("custom fonts not supported");
  const suffix = blocked.length > 0 ? ` — ${blocked.join(", ")}` : "";
  return `<!-- Target renderer: ${renderer.shortName}${suffix} -->`;
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
