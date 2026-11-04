import { describe, expect, it } from "vitest";
import { CROSS_DIAGRAM_SAMPLES, previewCompatibility } from "@/lib/cross-diagram-preview";
import { queuePreviewRender } from "@/lib/preview-render-queue";

describe("cross-diagram previews", () => {
  it("reuses three distinct stable catalog families with real source", () => {
    expect(CROSS_DIAGRAM_SAMPLES).toHaveLength(3);
    expect(new Set(CROSS_DIAGRAM_SAMPLES.map((sample) => sample.capability.id)).size).toBe(3);
    for (const sample of CROSS_DIAGRAM_SAMPLES) {
      expect(sample.entry.content.trim()).not.toBe("");
      expect(sample.entry.badge ?? "").not.toMatch(/Beta|Experimental/);
    }
  });

  it("separates local coverage from destination limits and unknown destinations", () => {
    const sample = CROSS_DIAGRAM_SAMPLES[0];
    expect(previewCompatibility(sample.capability, "github", "handDrawn")).toMatchObject({
      destination: "GitHub",
      look: "None",
      externalValidation: "External renderer not validated",
    });
    expect(previewCompatibility(sample.capability, "missing", "classic").destination).toBe(
      "Choose a destination in Apply"
    );
  });

  it("serializes rendering and recovers after failure", async () => {
    const order: string[] = [];
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const first = queuePreviewRender(async () => {
      order.push("first");
      await gate;
      order.push("done");
      throw new Error("Synthetic render failure");
    });
    const failure = expect(first).rejects.toThrow("Synthetic render failure");
    const second = queuePreviewRender(async () => {
      order.push("second");
    });
    await Promise.resolve();
    expect(order).toEqual(["first"]);
    release();
    await failure;
    await second;
    expect(order).toEqual(["first", "done", "second"]);
  });
});
