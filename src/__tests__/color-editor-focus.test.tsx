// @vitest-environment happy-dom
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ColorEditorPanel } from "@/pages/tabs/apply/ColorEditorPanel";
import { BRAND_PALETTES } from "@/lib/palettes";

afterEach(cleanup);

it("preserves focused text and selection across draft-save renders while using the latest close callback", () => {
  const firstClose = vi.fn();
  const latestClose = vi.fn();
  const props = {
    selectedPalette: BRAND_PALETTES[0],
    selectedPaletteId: BRAND_PALETTES[0].id,
    customColors: {},
    hasCustomizations: false,
    onColorChange: vi.fn(),
    onResetPalette: vi.fn(),
    onResetColor: vi.fn(),
    onSwitchToCompose: vi.fn(),
  };
  const view = render(<ColorEditorPanel {...props} onClose={firstClose} />);
  const input = view.container.querySelector<HTMLInputElement>('input[type="text"]')!;
  input.focus();
  input.setSelectionRange(1, 4);
  view.rerender(<ColorEditorPanel {...props} onClose={latestClose} />);
  expect(document.activeElement).toBe(input);
  expect([input.selectionStart, input.selectionEnd]).toEqual([1, 4]);
  fireEvent.keyDown(input, { key: "Escape" });
  expect(latestClose).toHaveBeenCalledOnce();
  expect(firstClose).not.toHaveBeenCalled();
});
