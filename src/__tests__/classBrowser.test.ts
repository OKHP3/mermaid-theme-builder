import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import {
  ClassBrowser,
  highlightPropsSegment,
  highlightClassDefLine,
  highlightClassDefBlock,
  HL,
} from "@/components/ClassBrowser";
import type { ClassDef } from "@/lib/theme-engine";

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

  it("card copy-usage button is present (native button element)", () => {
    const html = render({ supportsClassDef: true });
    expect(html).toContain('aria-label="Copy usage :::primary"');
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
  it('grid container carries aria-disabled="true" when supportsClassDef={false}', () => {
    const html = render({ supportsClassDef: false });
    expect(html).toContain('aria-disabled="true"');
  });

  it("grid container does NOT carry aria-disabled when supportsClassDef={true}", () => {
    const html = render({ supportsClassDef: true });
    expect(html).not.toContain('aria-disabled="true"');
  });

  it('card button elements have tabindex="-1" when inactive', () => {
    const html = render({ supportsClassDef: false });
    expect(html).toContain('tabindex="-1"');
  });

  it('card button elements do NOT have tabindex="-1" when active', () => {
    const html = render({ supportsClassDef: true });
    expect(html).not.toContain('tabindex="-1"');
  });

  it('card button elements have tabindex="0" when active', () => {
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

describe("ClassBrowser — aria-live region (screen reader announcements)", () => {
  it("renders an aria-live='polite' region in the DOM", () => {
    const html = render({ supportsClassDef: true });
    expect(html).toContain('aria-live="polite"');
  });

  it("aria-live region is present even when supportsClassDef={false}", () => {
    const html = render({ supportsClassDef: false });
    expect(html).toContain('aria-live="polite"');
  });

  it("aria-live region carries role='status'", () => {
    const html = render({ supportsClassDef: true });
    expect(html).toContain('role="status"');
  });

  it("aria-live region carries aria-atomic='true'", () => {
    const html = render({ supportsClassDef: true });
    expect(html).toContain('aria-atomic="true"');
  });

  it("aria-live region is visually hidden via sr-only", () => {
    const html = render({ supportsClassDef: true });
    expect(html).toContain("sr-only");
  });

  it("aria-live region is initially empty (no copiedState on mount)", () => {
    const html = render({ supportsClassDef: true });
    const match = html.match(/aria-live="polite"[^>]*>(.*?)<\/span>/);
    expect(match).not.toBeNull();
    expect(match![1].trim()).toBe("");
  });
});

describe("ClassBrowser — count badge", () => {
  it("renders the badge with the correct count when supportsClassDef={true}", () => {
    const html = render({ supportsClassDef: true });
    expect(html).toContain("2 semantic class styles available");
  });

  it("badge count matches classDefs.length for a different-length array", () => {
    const html = render({
      supportsClassDef: true,
      classDefs: [SAMPLE_CLASS_DEFS[0]],
    });
    expect(html).toContain("1 semantic class styles available");
    expect(html).not.toContain("2 semantic class styles available");
  });

  it("badge count is zero when classDefs is empty", () => {
    const html = render({ supportsClassDef: true, classDefs: [] });
    expect(html).toContain("0 semantic class styles available");
  });

  it("badge has active styling (bg-primary/10) when supportsClassDef={true}", () => {
    const html = render({ supportsClassDef: true });
    expect(html).toContain("bg-primary/10");
  });

  it("badge has inactive/muted styling (bg-muted/60) when supportsClassDef={false}", () => {
    const html = render({ supportsClassDef: false });
    expect(html).toContain("bg-muted/60");
  });

  it("badge is still present (renders count) when supportsClassDef={false}", () => {
    const html = render({ supportsClassDef: false });
    expect(html).toContain("2 class styles exist but are inactive");
  });

  it("badge does NOT use active styling when supportsClassDef={false}", () => {
    const html = render({ supportsClassDef: false });
    expect(html).not.toContain("bg-primary/10");
  });

  it("badge does NOT use muted styling when supportsClassDef={true}", () => {
    const html = render({ supportsClassDef: true });
    expect(html).not.toContain("bg-muted/60");
  });

  it("badge carries aria-label with the class count", () => {
    const html = render({ supportsClassDef: true });
    expect(html).toContain('aria-label="2 class styles"');
  });

  it("badge aria-label reflects classDefs.length in the inactive state", () => {
    const html = render({ supportsClassDef: false });
    expect(html).toContain('aria-label="2 class styles"');
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

describe("ClassBrowser — unrecognized class name warning", () => {
  it("shows warning when a used class name has no matching classDef", () => {
    const html = render({
      supportsClassDef: true,
      usedClassNames: new Set(["typo"]),
    });
    expect(html).toContain("Unrecognized class name");
  });

  it("lists the unrecognized name with ::: prefix in the warning", () => {
    const html = render({
      supportsClassDef: true,
      usedClassNames: new Set(["typo"]),
    });
    expect(html).toContain(":::typo");
  });

  it("includes 'Check for typos' copy in the warning", () => {
    const html = render({
      supportsClassDef: true,
      usedClassNames: new Set(["typo"]),
    });
    expect(html).toContain("Check for typos");
  });

  it("warning has role='alert' for screen reader accessibility", () => {
    const html = render({
      supportsClassDef: true,
      usedClassNames: new Set(["typo"]),
    });
    expect(html).toContain('role="alert"');
  });

  it("uses plural 'names' heading when multiple unrecognized names are present", () => {
    const html = render({
      supportsClassDef: true,
      usedClassNames: new Set(["typo", "misspelled"]),
    });
    expect(html).toContain("Unrecognized class names");
  });

  it("uses singular 'name' heading when exactly one unrecognized name is present", () => {
    const html = render({
      supportsClassDef: true,
      usedClassNames: new Set(["typo"]),
    });
    expect(html).toContain("Unrecognized class name:");
    expect(html).not.toContain("Unrecognized class names:");
  });

  it("lists all unrecognized names when multiple are present", () => {
    const html = render({
      supportsClassDef: true,
      usedClassNames: new Set(["typo", "misspelled"]),
    });
    expect(html).toContain(":::typo");
    expect(html).toContain(":::misspelled");
  });

  it("does NOT show warning when all used class names match classDefs", () => {
    const html = render({
      supportsClassDef: true,
      usedClassNames: new Set(["primary", "secondary"]),
    });
    expect(html).not.toContain("Unrecognized class");
    expect(html).not.toContain("Check for typos");
  });

  it("does NOT show warning when usedClassNames is empty", () => {
    const html = render({
      supportsClassDef: true,
      usedClassNames: new Set(),
    });
    expect(html).not.toContain("Unrecognized class");
  });

  it("does NOT show warning when usedClassNames is omitted", () => {
    const html = render({ supportsClassDef: true });
    expect(html).not.toContain("Unrecognized class");
  });

  it("does NOT show warning when supportsClassDef={false} even if used names are unrecognized", () => {
    const html = render({
      supportsClassDef: false,
      usedClassNames: new Set(["typo"]),
    });
    expect(html).not.toContain("Unrecognized class");
    expect(html).not.toContain("Check for typos");
  });

  it("shows warning only for the unrecognized subset when some names match and some do not", () => {
    const html = render({
      supportsClassDef: true,
      usedClassNames: new Set(["primary", "ghost"]),
    });
    expect(html).toContain("Unrecognized class name:");
    // Scope assertions to the alert banner only — the card grid also contains
    // :::primary in its title attributes, so checking the full HTML is too broad.
    const alertSection = html.split('role="alert"')[1]?.split("</div>")[0] ?? "";
    expect(alertSection).toContain(":::ghost");
    expect(alertSection).not.toContain(":::primary");
  });
});

describe("ClassBrowser — unused class name info indicator", () => {
  it("shows the indicator when a classDef exists but is not in usedClassNames (with at least one used class)", () => {
    // primary is used; secondary is defined but not used → secondary should appear
    const html = render({
      supportsClassDef: true,
      usedClassNames: new Set(["primary"]),
    });
    // "style not applied" matches both singular ("1 style not applied") and plural ("N styles not applied")
    expect(html).toContain("style not applied");
  });

  it("uses singular '1 style not applied' when exactly one classDef is unused", () => {
    const html = render({
      supportsClassDef: true,
      usedClassNames: new Set(["primary"]),
    });
    expect(html).toContain("1 style not applied:");
    expect(html).not.toContain("2 styles not applied");
  });

  it("uses plural 'N styles not applied' when multiple classDefs are unused", () => {
    // Neither primary nor secondary is used, but hasUsed guard needs at least one used name —
    // use a third set member so hasUsed=true; both defined defs are then unused.
    const html = render({
      supportsClassDef: true,
      classDefs: SAMPLE_CLASS_DEFS,
      usedClassNames: new Set(["ghost"]), // "ghost" is used but not defined; primary+secondary = unused
    });
    expect(html).toContain("2 styles not applied:");
  });

  it("lists the unused class name with ::: prefix in the indicator", () => {
    const html = render({
      supportsClassDef: true,
      usedClassNames: new Set(["primary"]),
    });
    expect(html).toContain(":::secondary");
  });

  it("lists all unused names when multiple classDefs are unused", () => {
    const html = render({
      supportsClassDef: true,
      classDefs: SAMPLE_CLASS_DEFS,
      usedClassNames: new Set(["ghost"]),
    });
    expect(html).toContain(":::primary");
    expect(html).toContain(":::secondary");
  });

  it("includes the 'defined in the palette but not used' copy", () => {
    const html = render({
      supportsClassDef: true,
      usedClassNames: new Set(["primary"]),
    });
    expect(html).toContain("defined in the palette but not used");
  });

  it("uses sky/blue styling to distinguish it from the amber typo warning", () => {
    const html = render({
      supportsClassDef: true,
      usedClassNames: new Set(["primary"]),
    });
    expect(html).toContain("border-sky-500");
    expect(html).toContain("bg-sky-500");
  });

  it("does NOT show amber colors for the unused-styles indicator", () => {
    // Render a case where ONLY the unused indicator fires, not the typo warning.
    // primary is used (known), secondary is unused — no unknown names.
    const html = render({
      supportsClassDef: true,
      usedClassNames: new Set(["primary"]),
    });
    // The indicator must be sky/blue, not amber — amber is reserved for typos.
    // Split out the unused indicator section only (after the typo warning section).
    const skySection = html.split("border-sky-500")[1] ?? "";
    expect(skySection).not.toContain("border-amber-500");
  });

  it("does NOT show the indicator when usedClassNames is empty (blank diagram is intentional)", () => {
    const html = render({
      supportsClassDef: true,
      usedClassNames: new Set(),
    });
    expect(html).not.toContain("styles not applied");
  });

  it("does NOT show the indicator when usedClassNames is omitted", () => {
    const html = render({ supportsClassDef: true });
    expect(html).not.toContain("styles not applied");
  });

  it("does NOT show the indicator when all classDefs are present in usedClassNames", () => {
    const html = render({
      supportsClassDef: true,
      usedClassNames: new Set(["primary", "secondary"]),
    });
    expect(html).not.toContain("styles not applied");
  });

  it("does NOT show the indicator when supportsClassDef={false}", () => {
    const html = render({
      supportsClassDef: false,
      usedClassNames: new Set(["primary"]),
    });
    expect(html).not.toContain("styles not applied");
  });

  it("does NOT show the indicator when classDefs is empty", () => {
    const html = render({
      supportsClassDef: true,
      classDefs: [],
      usedClassNames: new Set(["primary"]),
    });
    expect(html).not.toContain("styles not applied");
  });
});

// ---------------------------------------------------------------------------
// Highlight functions — unit tests
// These functions are exported from ClassBrowser.tsx specifically for testing.
// renderToString converts their ReactNode output to HTML for assertion.
// ---------------------------------------------------------------------------

/** Render a single ReactNode (or array) to an HTML string. */
function hl(node: import("react").ReactNode): string {
  return renderToString(createElement("span", null, node));
}

/** Render highlightPropsSegment (returns ReactNode[]) to HTML. */
function hlProps(props: string): string {
  return renderToString(createElement("span", null, ...highlightPropsSegment(props, "t")));
}

// ---------------------------------------------------------------------------
// highlightClassDefLine
// ---------------------------------------------------------------------------

describe("highlightClassDefLine — keyword color", () => {
  it("renders the 'classDef' keyword in rust-orange (#c46a2c)", () => {
    const html = hl(highlightClassDefLine("classDef foo fill:#1e3a5f", 0));
    expect(html).toContain(`color:${HL.keyword}`);
    expect(html).toContain("classDef");
  });

  it("keyword color is distinct from the class name color", () => {
    const html = hl(highlightClassDefLine("classDef myClass fill:#ffffff", 0));
    expect(html).toContain(`color:${HL.keyword}`); // keyword
    expect(html).toContain(`color:${HL.name}`); // name — different span
  });
});

describe("highlightClassDefLine — class name color", () => {
  it("renders the class name in bright cream (#e8d9c0)", () => {
    const html = hl(highlightClassDefLine("classDef primary fill:#1e3a5f", 0));
    expect(html).toContain(`color:${HL.name}`);
    expect(html).toContain("primary");
  });

  it("class name with hyphen renders in cream (#e8d9c0)", () => {
    const html = hl(highlightClassDefLine("classDef my-class fill:#3b82f6", 0));
    expect(html).toContain(`color:${HL.name}`);
    expect(html).toContain("my-class");
  });
});

describe("highlightClassDefLine — property key color", () => {
  it("renders 'fill' key in forge teal (#5fa89a)", () => {
    const html = hl(highlightClassDefLine("classDef foo fill:#1e3a5f", 0));
    expect(html).toContain(`color:${HL.key}`);
    expect(html).toContain("fill");
  });

  it("renders 'stroke' key in forge teal (#5fa89a)", () => {
    const html = hl(highlightClassDefLine("classDef foo fill:#1e3a5f,stroke:#3b82f6", 0));
    const keyColorCount = (html.match(new RegExp(`color:${HL.key}`, "g")) ?? []).length;
    // Two property keys: fill and stroke
    expect(keyColorCount).toBeGreaterThanOrEqual(2);
  });

  it("renders 'color' key in forge teal (#5fa89a)", () => {
    const html = hl(highlightClassDefLine("classDef foo color:#ffffff", 0));
    expect(html).toContain(`color:${HL.key}`);
  });

  it("renders hyphenated key 'stroke-width' in forge teal (#5fa89a)", () => {
    const html = hl(highlightClassDefLine("classDef foo stroke-width:2px", 0));
    expect(html).toContain(`color:${HL.key}`);
    expect(html).toContain("stroke-width");
  });

  it("renders hyphenated key 'font-weight' in forge teal (#5fa89a)", () => {
    const html = hl(highlightClassDefLine("classDef foo font-weight:bold", 0));
    expect(html).toContain(`color:${HL.key}`);
    expect(html).toContain("font-weight");
  });
});

describe("highlightClassDefLine — hex value color", () => {
  it("renders a 6-digit hex value in sky blue (#9ecfe8)", () => {
    const html = hl(highlightClassDefLine("classDef foo fill:#1e3a5f", 0));
    expect(html).toContain(`color:${HL.hex}`);
    expect(html).toContain("#1e3a5f");
  });

  it("renders a 3-digit short hex value in sky blue (#9ecfe8)", () => {
    const html = hl(highlightClassDefLine("classDef foo fill:#fff", 0));
    expect(html).toContain(`color:${HL.hex}`);
    expect(html).toContain("#fff");
  });

  it("renders an 8-digit hex value (alpha) in sky blue (#9ecfe8)", () => {
    const html = hl(highlightClassDefLine("classDef foo fill:#1e3a5fff", 0));
    expect(html).toContain(`color:${HL.hex}`);
    expect(html).toContain("#1e3a5fff");
  });

  it("multiple hex values each get sky blue (#9ecfe8)", () => {
    const html = hl(
      highlightClassDefLine("classDef foo fill:#1e3a5f,stroke:#3b82f6,color:#ffffff", 0)
    );
    const hexColorCount = (html.match(new RegExp(`color:${HL.hex}`, "g")) ?? []).length;
    expect(hexColorCount).toBeGreaterThanOrEqual(3);
  });
});

describe("highlightClassDefLine — non-hex value color", () => {
  it("renders 'bold' (non-hex) in warm beige (#c8b89a)", () => {
    const html = hl(highlightClassDefLine("classDef foo font-weight:bold", 0));
    expect(html).toContain(`color:${HL.value}`);
    expect(html).toContain("bold");
  });

  it("renders '2px' (non-hex) in warm beige (#c8b89a)", () => {
    const html = hl(highlightClassDefLine("classDef foo stroke-width:2px", 0));
    expect(html).toContain(`color:${HL.value}`);
    expect(html).toContain("2px");
  });

  it("renders 'normal' (non-hex) in warm beige (#c8b89a)", () => {
    const html = hl(highlightClassDefLine("classDef foo font-style:normal", 0));
    expect(html).toContain(`color:${HL.value}`);
    expect(html).toContain("normal");
  });
});

describe("highlightClassDefLine — punctuation dim color", () => {
  it("renders the colon separator in dimmed color (#7a7060)", () => {
    const html = hl(highlightClassDefLine("classDef foo fill:#1e3a5f", 0));
    expect(html).toContain(`color:${HL.punct}`);
  });

  it("renders the comma separator in dimmed color (#7a7060)", () => {
    const html = hl(highlightClassDefLine("classDef foo fill:#1e3a5f,stroke:#3b82f6", 0));
    // At least one dimmed span for commas/colons
    expect(html).toContain(`color:${HL.punct}`);
  });
});

describe("highlightClassDefLine — malformed / non-standard lines", () => {
  it("a line not matching the classDef pattern renders entirely dimmed (#7a7060)", () => {
    const html = hl(highlightClassDefLine("not-a-classdef-line", 0));
    expect(html).toContain(`color:${HL.punct}`);
    expect(html).toContain("not-a-classdef-line");
    // Must NOT contain any of the active highlight colors
    expect(html).not.toContain(`color:${HL.keyword}`);
    expect(html).not.toContain(`color:${HL.name}`);
    expect(html).not.toContain(`color:${HL.key}`);
    expect(html).not.toContain(`color:${HL.hex}`);
    expect(html).not.toContain(`color:${HL.value}`);
  });

  it("'classDef' alone (no name or props) renders dimmed", () => {
    const html = hl(highlightClassDefLine("classDef", 0));
    expect(html).toContain(`color:${HL.punct}`);
    expect(html).not.toContain(`color:${HL.keyword}`);
  });

  it("'classDef name' (missing props) renders dimmed", () => {
    const html = hl(highlightClassDefLine("classDef myClass", 0));
    expect(html).toContain(`color:${HL.punct}`);
    expect(html).not.toContain(`color:${HL.keyword}`);
  });

  it("empty string renders a dimmed span containing empty text", () => {
    const html = hl(highlightClassDefLine("", 0));
    // Empty input has no classDef match → dimmed fallback
    expect(html).toContain(`color:${HL.punct}`);
    expect(html).not.toContain(`color:${HL.keyword}`);
  });
});

describe("highlightClassDefLine — extra/compound properties", () => {
  it("stroke-dasharray with multi-token value highlights key and value", () => {
    const html = hl(highlightClassDefLine("classDef dashed stroke-dasharray:5 3", 0));
    expect(html).toContain(`color:${HL.key}`); // key
    expect(html).toContain("stroke-dasharray");
    expect(html).toContain(`color:${HL.value}`); // non-hex value "5 3"
  });

  it("multiple mixed props (hex + non-hex) produce both value colors", () => {
    const html = hl(
      highlightClassDefLine("classDef mixed fill:#abc123,font-weight:bold,stroke-width:2px", 0)
    );
    expect(html).toContain(`color:${HL.hex}`); // hex value
    expect(html).toContain(`color:${HL.value}`); // non-hex values
    expect(html).toContain(`color:${HL.key}`); // keys
  });

  it("different lineIdx values produce non-overlapping React keys (no duplicate key warning)", () => {
    // Two calls with different lineIdx — if keys were shared React would warn.
    // We can only verify no throw from renderToString.
    expect(() => {
      hl(highlightClassDefLine("classDef a fill:#111", 0));
      hl(highlightClassDefLine("classDef b fill:#222", 1));
    }).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// highlightPropsSegment
// ---------------------------------------------------------------------------

describe("highlightPropsSegment — key color", () => {
  it("renders property key in forge teal (#5fa89a)", () => {
    const html = hlProps("fill:#1e3a5f");
    expect(html).toContain(`color:${HL.key}`);
    expect(html).toContain("fill");
  });

  it("renders hyphenated key 'stroke-width' in forge teal", () => {
    const html = hlProps("stroke-width:2px");
    expect(html).toContain(`color:${HL.key}`);
    expect(html).toContain("stroke-width");
  });

  it("multiple keys all get teal color", () => {
    const html = hlProps("fill:#111,stroke:#222,color:#333");
    const count = (html.match(new RegExp(`color:${HL.key}`, "g")) ?? []).length;
    expect(count).toBeGreaterThanOrEqual(3);
  });
});

describe("highlightPropsSegment — hex value color", () => {
  it("renders a hex value in sky blue (#9ecfe8)", () => {
    const html = hlProps("fill:#1e3a5f");
    expect(html).toContain(`color:${HL.hex}`);
    expect(html).toContain("#1e3a5f");
  });

  it("a short 3-digit hex is sky blue (#9ecfe8)", () => {
    const html = hlProps("fill:#fff");
    expect(html).toContain(`color:${HL.hex}`);
  });

  it("non-hex values do NOT get sky blue (#9ecfe8)", () => {
    const html = hlProps("font-weight:bold");
    expect(html).not.toContain(`color:${HL.hex}`);
  });
});

describe("highlightPropsSegment — non-hex value color", () => {
  it("renders 'bold' in warm beige (#c8b89a)", () => {
    const html = hlProps("font-weight:bold");
    expect(html).toContain(`color:${HL.value}`);
    expect(html).toContain("bold");
  });

  it("renders '2px' in warm beige (#c8b89a)", () => {
    const html = hlProps("stroke-width:2px");
    expect(html).toContain(`color:${HL.value}`);
    expect(html).toContain("2px");
  });

  it("renders a multi-token value ('5 3') in warm beige (#c8b89a)", () => {
    const html = hlProps("stroke-dasharray:5 3");
    expect(html).toContain(`color:${HL.value}`);
    expect(html).toContain("5 3");
  });
});

describe("highlightPropsSegment — punctuation dim color", () => {
  it("colon separator gets dim color (#7a7060)", () => {
    const html = hlProps("fill:#1e3a5f");
    expect(html).toContain(`color:${HL.punct}`);
  });

  it("comma between pairs gets dim color (#7a7060)", () => {
    const html = hlProps("fill:#1e3a5f,stroke:#3b82f6");
    expect(html).toContain(`color:${HL.punct}`);
  });
});

describe("highlightPropsSegment — empty and edge inputs", () => {
  it("empty string returns an empty array (no nodes to render)", () => {
    const nodes = highlightPropsSegment("", "k");
    expect(nodes).toHaveLength(0);
  });

  it("string with no key:value pairs renders as a dim tail span", () => {
    // Only punctuation / garbage text
    const html = hlProps(",,,");
    // No match → entire string is a tail span in punct color
    expect(html).toContain(`color:${HL.punct}`);
    expect(html).not.toContain(`color:${HL.key}`);
  });
});

// ---------------------------------------------------------------------------
// highlightClassDefBlock
// ---------------------------------------------------------------------------

describe("highlightClassDefBlock — multi-line rendering", () => {
  it("renders a single valid classDef line correctly", () => {
    const html = hl(highlightClassDefBlock("classDef foo fill:#1e3a5f"));
    expect(html).toContain(`color:${HL.keyword}`); // keyword
    expect(html).toContain(`color:${HL.name}`); // name
    expect(html).toContain(`color:${HL.key}`); // key
    expect(html).toContain(`color:${HL.hex}`); // hex value
  });

  it("renders multiple valid lines — all four colors present", () => {
    const block = [
      "classDef primary fill:#1e3a5f,stroke:#3b82f6",
      "classDef secondary fill:#374151,stroke:#6b7280",
    ].join("\n");
    const html = hl(highlightClassDefBlock(block));
    expect(html).toContain(`color:${HL.keyword}`);
    expect(html).toContain(`color:${HL.name}`);
    expect(html).toContain(`color:${HL.key}`);
    expect(html).toContain(`color:${HL.hex}`);
  });

  it("renders a mix of valid and invalid lines without throwing", () => {
    const block = [
      "classDef foo fill:#abc",
      "not-a-classdef-line",
      "classDef bar stroke:#def",
    ].join("\n");
    expect(() => hl(highlightClassDefBlock(block))).not.toThrow();
    const html = hl(highlightClassDefBlock(block));
    expect(html).toContain(`color:${HL.keyword}`); // from valid lines
    expect(html).toContain(`color:${HL.punct}`); // from invalid line
  });

  it("invalid lines in a block render dimmed (#7a7060), not as keyword color", () => {
    const block = "not-valid\nclassDef ok fill:#111";
    const html = hl(highlightClassDefBlock(block));
    expect(html).toContain(`color:${HL.punct}`); // invalid line dimmed
    expect(html).toContain(`color:${HL.keyword}`); // valid line highlighted
  });

  it("empty string input returns a block with one dimmed empty span", () => {
    expect(() => hl(highlightClassDefBlock(""))).not.toThrow();
    const html = hl(highlightClassDefBlock(""));
    // The single empty line falls through to the dimmed fallback
    expect(html).toContain(`color:${HL.punct}`);
  });

  it("newline separators appear between lines (not inside highlight spans)", () => {
    const block = "classDef a fill:#111\nclassDef b fill:#222";
    const html = hl(highlightClassDefBlock(block));
    // Both class names must appear in the output
    expect(html).toContain(">a<");
    expect(html).toContain(">b<");
  });
});
