// Mermaid diagram initialization for OverKill Hill P³
// Relies on YAML front-matter in each diagram for theme/look (theme: neutral, look: neo).
// initialize() intentionally omits themeVariables to avoid overriding the YAML config.
import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";

mermaid.initialize({
  startOnLoad: false,
  securityLevel: "loose",
  flowchart: {
    curve: "basis",
    nodeSpacing: 55,
    rankSpacing: 65,
    htmlLabels: true,
  },
});

// Explicit run — more reliable than startOnLoad with ES module loading order
mermaid.run({
  querySelector: ".mermaid",
}).catch((err) => {
  console.warn("[mermaid-init] render error:", err);
});
