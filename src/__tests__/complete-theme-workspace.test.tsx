// @vitest-environment happy-dom
import { act, cleanup, render, screen, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { BRAND_PALETTES } from "@/lib/palettes";
import { createGovernanceProfile } from "@/lib/governance-profile";
import {
  prepareThemeLibrary,
  THEME_LIBRARY_KEY,
  LEGACY_THEME_KEY,
  type ThemeLibrary,
} from "@/lib/theme-library";

const observed = vi.hoisted(() => ({ props: {} as Record<string, any> }));
vi.mock("@/pages/tabs/ApplyTab", () => ({
  ApplyTab: (props: Record<string, any>) => {
    observed.props = props;
    return null;
  },
}));
vi.mock("@/pages/tabs/ComposeTab", () => ({ ComposeTab: () => null }));
vi.mock("@/pages/tabs/ExamplesTab", () => ({ ExamplesTab: () => null }));
vi.mock("@/pages/tabs/ReferenceTab", () => ({ ReferenceTab: () => null }));
vi.mock("@/pages/tabs/ExtractTab", () => ({ ExtractTab: () => null }));
import { AppShell } from "@/App";

const source = "\nflowchart LR\n  A[Unchanged] --> B[Source]\n";
const a = createGovernanceProfile({
  id: "theme-a",
  name: "Theme A",
  colors: BRAND_PALETTES[0].colors,
  rendererTarget: "github",
  strokeWidth: 4,
  includeBadge: false,
  includeMetaComments: false,
  advancedMermaidConfig: {
    htmlLabels: false,
    deterministicIds: true,
    deterministicIDSeed: "A",
    unsupported: { retained: true },
  },
  outputFormat: "frontmatter",
  outputFormatOverridden: true,
  fontSize: "22px",
});
const b = createGovernanceProfile({
  id: "theme-b",
  name: "Theme B",
  colors: BRAND_PALETTES[1].colors,
  rendererTarget: "",
  look: "neo",
  includeBadge: true,
});

function stored(): ThemeLibrary {
  return JSON.parse(localStorage.getItem(THEME_LIBRARY_KEY)!);
}
beforeEach(() => {
  localStorage.clear();
  window.history.replaceState({}, "", "/#apply");
  localStorage.setItem("mtb.firstVisit", "true");
  Object.defineProperty(navigator, "locks", {
    configurable: true,
    value: {
      request: (_name: string, _options: unknown, work: () => unknown) => Promise.resolve(work()),
    },
  });
  const prepared = prepareThemeLibrary(null);
  if (!prepared.ok) throw new Error(prepared.error);
  const state = prepared.state;
  state.themes = [a, b];
  state.revision = 1;
  state.editorSession = {
    inputCode: source,
    activeThemeId: a.id,
    selectedPaletteId: BRAND_PALETTES[0].id,
    preferences: {},
  };
  localStorage.setItem(THEME_LIBRARY_KEY, JSON.stringify(state));
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("complete-theme workspace", () => {
  it("switches contrasting themes without carrying settings or changing source bytes", async () => {
    render(createElement(AppShell));
    expect(observed.props.strokeWidth).toBe(4);
    expect(observed.props.advancedMermaidConfig.htmlLabels).toBe(false);
    act(() => observed.props.onSelectMyThemeSlot(b.id));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(observed.props.rendererTarget).toBe("");
    expect(observed.props.strokeWidth).toBeUndefined();
    expect(observed.props.advancedMermaidConfig).toEqual({});
    expect(observed.props.includeMetaComments).toBe(true);
    expect(observed.props.inputCode).toBe(source);
    act(() => observed.props.onSelectMyThemeSlot(a.id));
    expect(observed.props.rendererTarget).toBe("github");
    expect(observed.props.outputFormat).toBe("frontmatter");
    expect(observed.props.outputFormatOverridden).toBe(true);
    expect(observed.props.fontSize).toBe("22px");
    expect(observed.props.inputCode).toBe(source);
    await waitFor(() => expect(stored().editorSession.activeThemeId).toBe(a.id));
    await waitFor(() => expect(stored().revision).toBeGreaterThan(1));
    expect(stored().drafts.some((theme) => theme.id === "my-theme-1")).toBe(false);
  });

  it("autosaves a draft without overwriting a named theme, then explicitly saves it", async () => {
    render(createElement(AppShell));
    act(() => observed.props.onFontSizeChange("28px"));
    await waitFor(() =>
      expect(stored().drafts.find((theme) => theme.id === a.id)?.fontSize).toBe("28px")
    );
    expect(stored().themes[0].fontSize).toBe("22px");
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(stored().themes[0].fontSize).toBe("28px"));
    expect(stored().themes[0].advancedMermaidConfig?.unsupported).toEqual({ retained: true });
    expect(stored().editorSession.inputCode).toBe(source);
    cleanup();
    render(createElement(AppShell));
    expect(observed.props.fontSize).toBe("28px");
    expect(observed.props.strokeWidth).toBe(4);
  });

  it("keeps or discards a dirty draft only after the switch choice", async () => {
    render(createElement(AppShell));
    act(() => observed.props.onFontSizeChange("28px"));
    act(() => observed.props.onSelectMyThemeSlot(b.id));
    expect(screen.getByRole("dialog", { name: "Keep your theme changes?" })).toBeTruthy();
    expect(observed.props.activeMyThemeSlotId).toBe(a.id);
    fireEvent.click(screen.getByRole("button", { name: "Keep draft and switch" }));
    await waitFor(() => expect(observed.props.activeMyThemeSlotId).toBe(b.id));
    act(() => observed.props.onSelectMyThemeSlot(a.id));
    expect(observed.props.fontSize).toBe("28px");
    act(() => observed.props.onSelectMyThemeSlot(b.id));
    fireEvent.click(screen.getByRole("button", { name: "Discard draft and switch" }));
    await waitFor(() => expect(observed.props.activeMyThemeSlotId).toBe(b.id));
    act(() => observed.props.onSelectMyThemeSlot(a.id));
    expect(observed.props.fontSize).toBe("22px");
  });

  it("preserves the original legacy value when the app migrates and saves a draft", async () => {
    localStorage.removeItem(THEME_LIBRARY_KEY);
    const raw = JSON.stringify({
      schemaVersion: 1,
      inputCode: source,
      myThemeSlots: [{ ...a, schemaVersion: undefined }],
      activeMyThemeSlotId: a.id,
      rendererTarget: "github",
      strokeWidth: 3,
    });
    localStorage.setItem(LEGACY_THEME_KEY, raw);
    render(createElement(AppShell));
    await waitFor(() => expect(localStorage.getItem(THEME_LIBRARY_KEY)).not.toBeNull());
    expect(localStorage.getItem(LEGACY_THEME_KEY)).toBe(raw);
    expect(observed.props.inputCode).toBe(source);
    expect(observed.props.strokeWidth).toBe(3);
  });
});
