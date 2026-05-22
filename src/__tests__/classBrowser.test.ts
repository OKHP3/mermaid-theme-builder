import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { ClassBrowser } from "@/components/ClassBrowser";
import type { ClassDef } from "@/lib/themeEngine";

/**
 * Tests for ClassBrowser (src/components/ClassBrowser.tsx).
 *
 * Uses react-dom/server renderToString so tests run in the node environment
 * without jsdom. We assert on the rendered HTML string for:
 *   - supportsClassDef={false}: amber warning present, grid pointer-events-none,
 *     inactive footer copy, opacity-60 container
 *   - supportsClassDef={true} (and default): no warning, interactive grid,
 *     live-update footer copy
 */

const SAMPLE_CLASS_DEFS: ClassDef[] = [
  {
    name: "primary",
    fill: "#1e3a5f",
    stroke: "#3b82f6",
    color: "#ffffff",
    extra: "",
    description: "Primary node style",
  },
  {
    name: "secondary",
    fill: "#374151",
    stroke: "#6b7280",
    color: "#f3f4f6",
    extra: "",
    description: "Secondary node style",
  },
];

function render(props: {
  supportsClassDef?: boolean;
  classDefs?: ClassDef[];
  usedClassNames?: ReadonlySet<string>;
}): string {
  return renderToString(
    createElement(ClassBrowser, {
      classDefs: props.classDefs ?? SAMPLE_CLASS_DEFS,
      supportsClassDef: props.supportsClassDef,
      usedClassNames: props.usedClassNames,
    })
  );
}

describe("ClassBrowser — supportsClassDef={false} (inactive state)", () => {
  it("renders the amber warning banner", () => {
    const html = render({ supportsClassDef: false });
    expect(html).toContain("classDef styles don&#x27;t apply to this diagram type");
  });

  it("warning banner mentions supported diagram families", () => {
    const html = render({ supportsClassDef: false });
    expect(html).toContain("flowchart");
    expect(html).toContain("class");
    expect(html).toContain("state");
    expect(html).toContain("block");
  });

  it("warning banner includes the amber border/background color classes", () => {
    const html = render({ supportsClassDef: false });
    expect(html).toContain("border-amber-500");
    expect(html).toContain("bg-amber-500");
  });

  it("grid has pointer-events-none class to suppress card clicks", () => {
    const html = render({ supportsClassDef: false });
    expect(html).toContain("pointer-events-none");
  });

  it("grid also has select-none alongside pointer-events-none", () => {
    const html = render({ supportsClassDef: false });
    expect(html).toContain("select-none");
  });

  it("container root has opacity-60 to signal inactive state", () => {
    const html = render({ supportsClassDef: false });
    expect(html).toContain("opacity-60");
  });

  it("footer shows inactive-variant copy", () => {
    const html = render({ supportsClassDef: false });
    expect(html).toContain("tokens are inactive for this diagram type");
  });

  it("footer does NOT show the live-update copy", () => {
    const html = render({ supportsClassDef: false });
    expect(html).not.toContain("Styles update live as you edit palette colors");
  });

  it("still renders class node cards (color previews remain visible)", () => {
    const html = render({ supportsClassDef: false });
    expect(html).toContain("primary");
    expect(html).toContain("secondary");
  });
});

describe("ClassBrowser — supportsClassDef={true} (active state)", () => {
  it("does NOT render the amber warning banner", () => {
    const html = render({ supportsClassDef: true });
    expect(html).not.toContain("border-amber-500");
  });

  it("warning text is absent", () => {
    const html = render({ supportsClassDef: true });
    expect(html).not.toContain("classDef styles don");
  });

  it("grid does NOT have pointer-events-none", () => {
    const html = render({ supportsClassDef: true });
    expect(html).not.toContain("pointer-events-none");
  });

  it("grid does NOT have select-none", () => {
    const html = render({ supportsClassDef: true });
    expect(html).not.toContain("select-none");
  });

  it("container root does NOT have opacity-60", () => {
    const html = render({ supportsClassDef: true });
    expect(html).not.toContain("opacity-60");
  });

  it("footer shows live-update copy", () => {
    const html = render({ supportsClassDef: true });
    expect(html).toContain("Styles update live as you edit palette colors in the sidebar");
  });

  it("footer does NOT show the inactive-state copy", () => {
    const html = render({ supportsClassDef: true });
    expect(html).not.toContain("tokens are inactive for this diagram type");
  });

  it("renders class node cards", () => {
    const html = render({ supportsClassDef: true });
    expect(html).toContain("primary");
    expect(html).toContain("secondary");
  });

  it("card copy-usage button is present (role=button)", () => {
    const html = render({ supportsClassDef: true });
    expect(html).toContain('role="button"');
  });
});

describe("ClassBrowser — default prop (supportsClassDef omitted)", () => {
  it("defaults to active state — no warning banner", () => {
    const html = render({});
    expect(html).not.toContain("border-amber-500");
  });

  it("defaults to active state — no pointer-events-none", () => {
    const html = render({});
    expect(html).not.toContain("pointer-events-none");
  });

  it("defaults to active state — live-update footer", () => {
    const html = render({});
    expect(html).toContain("Styles update live as you edit palette colors in the sidebar");
  });
});

describe("ClassBrowser — usedClassNames interaction", () => {
  it("active: shows 'in use' badge when usedClassNames is non-empty", () => {
    const html = render({
      supportsClassDef: true,
      usedClassNames: new Set(["primary"]),
    });
    expect(html).toContain("in use");
  });

  it("active: no 'in use' badge when usedClassNames is empty", () => {
    const html = render({
      supportsClassDef: true,
      usedClassNames: new Set(),
    });
    expect(html).not.toContain("in use");
  });

  it("inactive: 'in use' badge is suppressed even if class is used (grid non-interactive)", () => {
    const html = render({
      supportsClassDef: false,
      usedClassNames: new Set(["primary"]),
    });
    expect(html).toContain("pointer-events-none");
  });
});

describe("ClassBrowser — aria accessibility (inactive state)", () => {
  it("grid container carries aria-disabled=\"true\" when supportsClassDef={false}", () => {
    const html = render({ supportsClassDef: false });
    expect(html).toContain('aria-disabled="true"');
  });

  it("grid container does NOT carry aria-disabled when supportsClassDef={true}", () => {
    const html = render({ supportsClassDef: true });
    expect(html).not.toContain('aria-disabled="true"');
  });

  it("card role=button elements have tabindex=\"-1\" when inactive", () => {
    const html = render({ supportsClassDef: false });
    expect(html).toContain('tabindex="-1"');
  });

  it("card role=button elements do NOT have tabindex=\"-1\" when active", () => {
    const html = render({ supportsClassDef: true });
    expect(html).not.toContain('tabindex="-1"');
  });

  it("card role=button elements have tabindex=\"0\" when active", () => {
    const html = render({ supportsClassDef: true });
    expect(html).toContain('tabindex="0"');
  });
});

describe("ClassBrowser — aria accessibility (active state)", () => {
  it("no aria-disabled attribute present when supportsClassDef={true}", () => {
    const html = render({ supportsClassDef: true });
    expect(html).not.toContain("aria-disabled");
  });

  it("no aria-disabled attribute present when supportsClassDef is omitted", () => {
    const html = render({});
    expect(html).not.toContain("aria-disabled");
  });
});

describe("ClassBrowser — Copy used button", () => {
  it("shows 'Copy used' button when usedClassNames is non-empty and supportsClassDef={true}", () => {
    const html = render({
      supportsClassDef: true,
      usedClassNames: new Set(["primary"]),
    });
    expect(html).toContain("Copy used");
  });

  it("includes the used count in the button label", () => {
    const html = render({
      supportsClassDef: true,
      usedClassNames: new Set(["primary", "secondary"]),
    });
    expect(html).toContain("Copy used (");
    expect(html).toContain(">2<");
  });

  it("does NOT show 'Copy used' when usedClassNames is empty", () => {
    const html = render({
      supportsClassDef: true,
      usedClassNames: new Set(),
    });
    expect(html).not.toContain("Copy used");
  });

  it("does NOT show 'Copy used' when usedClassNames is omitted", () => {
    const html = render({ supportsClassDef: true });
    expect(html).not.toContain("Copy used");
  });

  it("does NOT show 'Copy used' when supportsClassDef={false} even if classes are in use", () => {
    const html = render({
      supportsClassDef: false,
      usedClassNames: new Set(["primary"]),
    });
    expect(html).not.toContain("Copy used");
  });

  it("'Copy used' button has emerald styling to distinguish it from 'Copy all'", () => {
    const html = render({
      supportsClassDef: true,
      usedClassNames: new Set(["primary"]),
    });
    expect(html).toContain("border-emerald-500");
  });
});
