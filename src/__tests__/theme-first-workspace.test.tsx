// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ApplyTab } from "@/pages/tabs/ApplyTab";
import { BRAND_PALETTES } from "@/lib/palettes";
import { DEFAULT_TYPOGRAPHY } from "@/lib/typography";

vi.mock("@/components/MermaidPreview", () => ({
  MermaidPreview: () => <div>Preview fixture</div>,
}));
vi.mock("@/components/PaletteSelectorBar", () => ({ PaletteSelectorBar: () => null }));

const noop = () => {};
const props: Parameters<typeof ApplyTab>[0] = {
  selectedPalette: BRAND_PALETTES[0],
  selectedPaletteId: BRAND_PALETTES[0].id,
  onSelectPalette: noop,
  customColors: {},
  onColorChange: noop,
  onResetPalette: noop,
  onResetColor: noop,
  hasCustomizations: false,
  inputCode: "flowchart LR\n A --> B",
  onInputChange: noop,
  includeMetaComments: false,
  includeBadge: false,
  effectiveThemeName: "Documentation",
  onSwitchTab: noop,
  onExtractTheme: () => null,
  userPalettes: [],
  onShowToast: noop,
  recentPaletteIds: [],
  look: "classic",
  onLookChange: noop,
  fontSize: "",
  onFontSizeChange: noop,
  typography: DEFAULT_TYPOGRAPHY,
  rendererTarget: "",
  onRendererTargetChange: noop,
  lastExampleType: {},
  onRecordExampleType: noop,
  previewMode: "themed",
  onPreviewModeChange: noop,
  hintResetToken: 0,
  onResetSyntaxHints: noop,
};
afterEach(cleanup);

describe("Theme-first Apply workspace", () => {
  it("prepares the next paste without clearing source or changing the theme", async () => {
    const onInputChange = vi.fn();
    const onSelectPalette = vi.fn();
    render(<ApplyTab {...props} onInputChange={onInputChange} onSelectPalette={onSelectPalette} />);
    fireEvent.click(screen.getByRole("button", { name: "Paste next diagram" }));
    const input = screen.getByLabelText("Mermaid diagram code input") as HTMLTextAreaElement;
    await waitFor(() => expect(document.activeElement).toBe(input));
    expect(input.value).toBe(props.inputCode);
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe(props.inputCode.length);
    expect(document.activeElement).toBe(input);
    expect(onInputChange).not.toHaveBeenCalled();
    expect(onSelectPalette).not.toHaveBeenCalled();
  });

  it("does not offer fake rendering controls or universal readiness", () => {
    render(<ApplyTab {...props} />);
    expect(screen.queryByRole("button", { name: "Canvas" })).toBeNull();
    expect(screen.queryByRole("button", { name: "SVG" })).toBeNull();
    expect(screen.queryByText("Ready for the renderer")).toBeNull();
    expect(screen.getByText("External renderer not validated")).toBeTruthy();
  });

  it("includes destination advisories even when the source is recognized", () => {
    render(<ApplyTab {...props} rendererTarget="notion" />);
    expect(screen.getByText("Review compatibility guidance")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Review guidance/ })).toBeTruthy();
  });

  it("includes input warnings in the guidance summary", () => {
    render(<ApplyTab {...props} inputCode="not a recognized diagram" />);
    expect(screen.getByText("Review compatibility guidance")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Expand preflight report details" }));
    expect(screen.getByText("Compatibility Preflight")).toBeTruthy();
  });

  it("keeps family-only guidance reachable without an external renderer", () => {
    render(<ApplyTab {...props} inputCode={'pie\n "First" : 50\n "Second" : 50'} />);
    expect(screen.getByText("Review compatibility guidance")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Expand preflight report details" }));
    expect(screen.getByText("Compatibility Preflight")).toBeTruthy();
  });

  it("asks for a diagram instead of claiming readiness for blank input", () => {
    render(<ApplyTab {...props} inputCode="" />);
    expect(screen.getByText("Add a diagram to preview")).toBeTruthy();
  });

  it("switches workspace focus without changing source or theme", () => {
    const onInputChange = vi.fn();
    const onSelectPalette = vi.fn();
    render(<ApplyTab {...props} onInputChange={onInputChange} onSelectPalette={onSelectPalette} />);
    fireEvent.click(screen.getByRole("button", { name: "Edit diagram code" }));
    fireEvent.click(screen.getByRole("button", { name: "Show diagram preview" }));
    expect((screen.getByLabelText("Mermaid diagram code input") as HTMLTextAreaElement).value).toBe(
      props.inputCode
    );
    expect(screen.getByRole("heading", { name: "Documentation" })).toBeTruthy();
    expect(onInputChange).not.toHaveBeenCalled();
    expect(onSelectPalette).not.toHaveBeenCalled();
  });
});
