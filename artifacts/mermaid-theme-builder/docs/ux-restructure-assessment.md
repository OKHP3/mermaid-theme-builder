# UX Restructure Assessment — V0.3.1 Workflow Shell

This document captures the current-state evaluation that preceded the V0.3.1
tabbed-shell refactor of Mermaid Theme Builder, and the planned correction.

It is referenced from the Notion master plan
([Mermaid Theme Builder — Master Build Plan v0.1](https://www.notion.so/overkillhill/Mermaid-Theme-Builder-Master-Build-Plan-v0-1-7bc611bd57454d9185fadccdae11a93f))
and lives alongside the existing `docs/ROADMAP.md` and `docs/PRODUCT_BRIEF.md`.

## 1. Current maturity classification

| Dimension                  | Pre-refactor state |
| -------------------------- | ------------------ |
| Product maturity           | Public alpha       |
| Technical maturity         | V1-ready engine    |
| UX maturity                | Pre-alpha          |
| Mobile maturity            | Broken (vertical scroll past textarea before reaching preview) |
| Information architecture   | None — single everything-window |

The theme engine, detector, capability registry, palette system, prompt
scaffold, and example library are all functional and stable. The shell that
hosts them is the bottleneck.

## 2. Alignment with the Notion master plan

Confirmed unchanged by the refactor:

- Core workflow (paste → theme → preview → copy) is preserved.
- Static, no-backend, browser-only scope is preserved.
- GitHub Pages deployment workflow is preserved.
- Palette and theme behaviour is preserved (no changes to `themeEngine.ts`,
  `palettes.ts`, or detection logic).
- Diagram capability registry is preserved and surfaced more prominently.
- Example library is preserved and now individually selectable.
- Prompt scaffold export is preserved (existing modal is reused).
- Scope firewall is preserved — no Builders FirstSource, BFS, employer, or
  third-party corporate brand presets are introduced. Built-in themes remain
  generic palettes plus the OverKill Hill / Glee-fully / AskJamie ecosystem.

## 3. Current deficiencies (pre-refactor)

- **Everything-window problem.** Palette picker, color editor, font controls,
  textarea, preview, export buttons, ClassBrowser, DiagramInventory, capability
  notes, warnings, prompt scaffold, and example loader all competed for the
  same screen.
- **Desktop cognitive overload.** Seven distinct functional zones with no
  visual hierarchy, no progressive disclosure, no clear "what do I do first"
  cue.
- **Mobile layout failure.** Approximately 1400px of vertical scroll before a
  user could reach the textarea on a typical phone viewport. Preview was
  squeezed to an unusable height when it did appear.
- **Reference content crowded the workflow.** Capability registry and class
  library lived inside the main builder — useful, but actively distracting
  during the core "apply a theme" task.
- **Color editor overwhelmed the default path.** A first-time user had to look
  past 13 color swatches just to find the export buttons.
- **Inventory competed with the primary task.** DiagramInventory was hidden
  behind a small icon and rendered as a full-screen overlay, suggesting it was
  an afterthought when it is actually a core differentiator.
- **Export options were not separated into an export mode.** Styled Code,
  Markdown, Prompt Scaffold, and Bootstrap were mixed together at the bottom
  of a long page.

## 4. Planned correction

Convert the app into a four-tab workflow shell with a single shared state
container.

| Tab        | Purpose                                                              |
| ---------- | -------------------------------------------------------------------- |
| Apply      | Paste Mermaid → choose a theme → preview → copy/export.              |
| Compose    | Design a reusable theme/bootstrap without needing diagram code.      |
| Examples   | Browse and load sample diagrams (themed live with the current preset). |
| Reference  | Inspect Mermaid support, capability warnings, and visual-language guidance. |

State that crosses tab boundaries (selected palette, custom colors, input code,
metadata toggles, theme name) is lifted to the app shell so switching tabs
never loses work.

The full color editor lives in Compose. Apply only exposes a slide-out
"Edit Colors" panel for quick adjustments. DiagramInventory and ClassBrowser
move to Reference. The example gallery moves to its own tab with a "Load into
Apply" handoff.

Mobile gets a fixed bottom tab bar instead of a top tab bar to keep navigation
within thumb reach. Apply on mobile stacks vertically with the textarea at a
sensible default height and the preview taking remaining space.

## 5. Explicit non-goals

This refactor must not:

- Rewrite theme engine logic (`src/lib/themeEngine.ts`).
- Rewrite diagram detector logic (`src/lib/detector.ts`).
- Change palette data (`src/lib/palettes.ts`) except where rendering containment
  forces it.
- Change `MermaidPreview.tsx` logic unless layout containment requires it.
- Introduce a backend, user accounts, AI API calls, file upload, analytics
  capture of pasted Mermaid content, custom diagram grammars, or any third-party
  corporate brand preset.
- Break the existing GitHub Pages deployment.

## Outcome

V0.3.1 ships as a layout-and-information-architecture refactor only. All
business logic, capability data, palette presets, example content, and export
formats are preserved. The product surface area shrinks per-screen while the
total feature set is unchanged.
