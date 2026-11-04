import { EXAMPLE_CATALOG } from "@/data/example-library";
import { getCapabilityById, type DiagramCapability } from "@/data/mermaid-capabilities";
import { getRendererById, supportLabel } from "@/data/renderer-parity";
import { detectDiagram } from "@/lib/detector";
import type { MermaidLook } from "@/lib/theme-engine";

// Catalog identifiers select samples, not a second registry of diagram families.
export const CROSS_DIAGRAM_SAMPLES = [
  "flowchart-basic",
  "sequence-basic",
  "er-mermaid-basic",
].flatMap((id) => {
  const entry = EXAMPLE_CATALOG.find((candidate) => candidate.id === id);
  if (!entry) return [];
  const capability = getCapabilityById(detectDiagram(entry.content).family);
  return capability ? [{ entry, capability }] : [];
});

export function previewCompatibility(
  capability: DiagramCapability,
  rendererTarget: string,
  look: MermaidLook
) {
  const renderer = getRendererById(rendererTarget);
  return {
    family: capability.displayName,
    coverage: capability.styleStrategy === "full" ? "Full theme surface" : "Limited theme surface",
    destination: renderer?.displayName ?? "Choose a destination in Apply",
    colors: renderer ? supportLabel(renderer.themeVariableSupport) : "Not checked",
    look:
      capability.supportedLooks?.length && !capability.supportedLooks.includes(look)
        ? "Not supported by this family"
        : renderer
          ? supportLabel(renderer.looksSupported[look])
          : "Not checked",
    fonts: renderer ? supportLabel(renderer.customFontSupport) : "Not checked",
    externalValidation: "External renderer not validated",
  };
}
