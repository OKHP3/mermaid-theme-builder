// @vitest-environment happy-dom

/**
 * Unit tests: ExtractTab empty-state messages (Task #224).
 *
 * Behaviors covered:
 *   1. On initial render the idle placeholder is shown.
 *   2. After extracting a bare diagram (no theme data) the "No theme found"
 *      message is shown, and it lists what the tab expects.
 *   3. The "No theme found" message includes a "Go to Apply tab" button that
 *      calls onSwitchTab("apply").
 *   4. After extracting a diagram that has a directive but no themeVariables,
 *      the "Theme directive found — but no color variables" message is shown.
 *   5. The "no-vars" message does NOT show the "no theme found" text.
 *   6. After extracting a fully-themed diagram the results panel appears (not
 *      either warning message).
 */

import { vi, describe, it, expect, afterEach } from "vitest";

vi.mock("mermaid", () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn().mockResolvedValue({ svg: "<svg><g></g></svg>", bindFunctions: undefined }),
  },
}));

import { render, screen, cleanup, act } from "@testing-library/react";
import { fireEvent } from "@testing-library/dom";
import { createElement } from "react";
import { ExtractTab } from "@/pages/tabs/ExtractTab";
import type { AppTab } from "@/App";
import type { Palette } from "@/lib/palettes";

function noop() {}

const BASE_PROPS = {
  onUseExtractedTheme: (_p: Palette, _c?: string) => {},
  onSwitchTab: noop as (tab: AppTab) => void,
  onShowToast: noop,
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderExtract(overrides: Partial<typeof BASE_PROPS> = {}) {
  return render(createElement(ExtractTab, { ...BASE_PROPS, ...overrides }));
}

async function extractCode(code: string) {
  const textarea = screen.getByRole("textbox", { name: "Paste themed Mermaid diagram here" });
  await act(async () => {
    fireEvent.change(textarea, { target: { value: code } });
  });
  const btn = screen.getByRole("button", { name: "Extract theme" });
  await act(async () => {
    fireEvent.click(btn);
  });
}

// ---------------------------------------------------------------------------
// 1. Idle state
// ---------------------------------------------------------------------------

describe("ExtractTab — idle state", () => {
  it("shows the idle placeholder on initial render", () => {
    renderExtract();
    expect(screen.getByText("Paste a themed diagram above, then click Extract theme")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// 2. "No theme found" (status === "empty")
// ---------------------------------------------------------------------------

const BARE_DIAGRAM = "flowchart TD\n  A[Start] --> B[End]";

describe("ExtractTab — no theme found (bare diagram)", () => {
  it("shows the 'No theme found' heading after extracting a bare diagram", async () => {
    renderExtract();
    await extractCode(BARE_DIAGRAM);
    expect(screen.getByText("No theme found in this diagram")).toBeTruthy();
  });

  it("lists the %%{init}%% directive as a requirement", async () => {
    renderExtract();
    await extractCode(BARE_DIAGRAM);
    const matches = screen.getAllByText(/%%\{init\}%%/);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it("lists classDef as a requirement", async () => {
    renderExtract();
    await extractCode(BARE_DIAGRAM);
    const matches = screen.getAllByText(/classDef/);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it("includes a 'Go to Apply tab' button", async () => {
    renderExtract();
    await extractCode(BARE_DIAGRAM);
    expect(screen.getByRole("button", { name: /Go to Apply tab/i })).toBeTruthy();
  });

  it("calls onSwitchTab('apply') when the Apply tab button is clicked", async () => {
    const onSwitchTab = vi.fn();
    renderExtract({ onSwitchTab });
    await extractCode(BARE_DIAGRAM);

    const btn = screen.getByRole("button", { name: /Go to Apply tab/i });
    await act(async () => {
      fireEvent.click(btn);
    });

    expect(onSwitchTab).toHaveBeenCalledWith("apply");
  });

  it("does not show the idle placeholder after extraction", async () => {
    renderExtract();
    await extractCode(BARE_DIAGRAM);
    expect(screen.queryByText("Paste a themed diagram above, then click Extract theme")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 3. "Theme directive found but no vars" (status === "no-vars")
// ---------------------------------------------------------------------------

// Directive with only a theme name, no themeVariables block.
const DIRECTIVE_NO_VARS =
  "%%{init: {'theme':'base'}}%%\nflowchart TD\n  A[Start] --> B[End]";

describe("ExtractTab — theme directive found but no themeVariables", () => {
  it("shows the 'no color variables' heading", async () => {
    renderExtract();
    await extractCode(DIRECTIVE_NO_VARS);
    expect(screen.getByText(/Theme directive found.*no color variables/i)).toBeTruthy();
  });

  it("does NOT show the 'No theme found' heading", async () => {
    renderExtract();
    await extractCode(DIRECTIVE_NO_VARS);
    expect(screen.queryByText("No theme found in this diagram")).toBeNull();
  });

  it("does NOT show the 'Go to Apply tab' button", async () => {
    renderExtract();
    await extractCode(DIRECTIVE_NO_VARS);
    expect(screen.queryByRole("button", { name: /Go to Apply tab/i })).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 4. Full theme found (status === "found") — neither warning shown
// ---------------------------------------------------------------------------

const THEMED_DIAGRAM =
  "%%{init: {'theme':'base','themeVariables':{'primaryColor':'#4a90d9','lineColor':'#333'}}}%%\nflowchart TD\n  A[Start] --> B[End]";

describe("ExtractTab — full theme found", () => {
  it("does NOT show the 'No theme found' message", async () => {
    renderExtract();
    await extractCode(THEMED_DIAGRAM);
    expect(screen.queryByText("No theme found in this diagram")).toBeNull();
  });

  it("does NOT show the 'no color variables' message", async () => {
    renderExtract();
    await extractCode(THEMED_DIAGRAM);
    expect(screen.queryByText(/Theme directive found.*no color variables/i)).toBeNull();
  });

  it("shows the extracted variable count summary", async () => {
    renderExtract();
    await extractCode(THEMED_DIAGRAM);
    expect(screen.getByText(/variables extracted/i)).toBeTruthy();
  });
});
