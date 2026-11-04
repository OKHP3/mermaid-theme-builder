import { CROSS_DIAGRAM_SAMPLES, previewCompatibility } from "@/lib/cross-diagram-preview";
import type { MermaidLook } from "@/lib/theme-engine";

interface Props {
  selectedId: string;
  onSelect: (id: string) => void;
  rendererTarget: string;
  look: MermaidLook;
  onUseTheme: () => void;
}

export function CrossDiagramGallery({
  selectedId,
  onSelect,
  rendererTarget,
  look,
  onUseTheme,
}: Props) {
  const selected =
    CROSS_DIAGRAM_SAMPLES.find((sample) => sample.entry.id === selectedId) ??
    CROSS_DIAGRAM_SAMPLES[0];
  if (!selected) return null;
  const guidance = previewCompatibility(selected.capability, rendererTarget, look);
  return (
    <section className="cross-diagram-gallery" aria-label="Cross-diagram sample gallery">
      <div className="gallery-heading">
        <div>
          <h3>One theme. Different diagrams.</h3>
          <p>Choose a sample to compare. Only the selected diagram renders.</p>
        </div>
        <button type="button" className="workspace-text-button" onClick={onUseTheme}>
          Use with my diagram
        </button>
      </div>
      <div className="gallery-samples" role="group" aria-label="Preview samples">
        {CROSS_DIAGRAM_SAMPLES.map(({ entry, capability }, index) => (
          <button
            type="button"
            key={entry.id}
            aria-pressed={entry.id === selected.entry.id}
            onClick={() => onSelect(entry.id)}
          >
            <span className="gallery-number" aria-hidden="true">
              0{index + 1}
            </span>
            <span>{capability.displayName}</span>
            <small>
              {capability.styleStrategy === "full" ? "Full theme surface" : "Limited theme surface"}
            </small>
          </button>
        ))}
      </div>
      <div className="gallery-compatibility" aria-live="polite" aria-atomic="true">
        <p>
          <strong>{guidance.destination}</strong>. {guidance.externalValidation}.
        </p>
        <p>
          Theme colors: {guidance.colors}. Selected look: {guidance.look}. Custom fonts:{" "}
          {guidance.fonts}.
        </p>
      </div>
    </section>
  );
}
