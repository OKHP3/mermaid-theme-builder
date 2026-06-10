# Tab Instructions

High-level steps for each tab in Mermaid Theme Builder.
Format: **Step Title** (3–5 words) — description (8–20 words).

Instruction diagrams: `examples/tab-instructions-compose.mmd` · `examples/tab-instructions-apply.mmd`

---

## Compose Tab

**Build and customize your theme**

1. **Start in Compose** — Open the Compose tab to build or refine a reusable Mermaid theme.
2. **Choose a starting palette** — Select an existing brand palette or create a new custom one.
3. **Name the theme** — Give the theme a recognizable name for reuse across diagrams and prompts.
4. **Select the rendering look** — Choose Classic, Neo, or Hand-Drawn to control visual rendering style.
5. **Adjust primary colors** — Set primary, secondary, accent, background, border, and text colors.
6. **Adjust diagram support colors** — Configure colors for nodes, edges, clusters, labels, warnings, and metadata.
7. **Configure typography settings** — Set title, body, label, and caption fonts along with their sizes.
8. **Review typography hierarchy** — Confirm title, section, body, and caption sizes follow a readable order.
9. **Preview the sample diagram** — Watch the built-in preview update live as theme settings change.
10. **Check renderer compatibility** — Review whether the theme survives target renderers like GitHub, Notion, or Obsidian.
11. **Generate the reusable theme output** — Produce Mermaid config, Markdown bootstrap, JSON package, or AI prompt scaffold.
12. **Copy or export the theme** — Save the reusable theme contract for diagrams or AI prompt use.
13. **Use the theme elsewhere** — Paste the scaffold into ChatGPT, Claude, GitHub docs, or Markdown documentation.

---

## Apply Tab

**Apply your theme to a diagram**

1. **Start in Apply** — Open the Apply tab to style an existing Mermaid diagram.
2. **Paste Mermaid source code** — Drop any Mermaid diagram source code into the editor input field.
3. **Detect the diagram family** — Let the app identify the diagram type: flowchart, sequence, class, Gantt, etc.
4. **Review detection results** — Confirm the detected diagram type and any support limitations or warnings.
5. **Choose an active theme** — Select the palette or custom theme you want to apply.
6. **Apply the theme** — Generate a fully themed version of the pasted Mermaid diagram.
7. **Preview the themed diagram** — View the rendered result using the selected theme and look.
8. **Compare original and themed output** — Switch between Original, Preview, Code, or Diff views.
9. **Review compatibility advisories** — Check warnings for renderer limits, unsupported styling, or classDef gaps.
10. **Repair or adjust if needed** — Modify source, theme, or export target when warnings indicate risk.
11. **Copy styled Mermaid code** — Copy the themed source with its generated config and init block.
12. **Export Markdown bootstrap** — Export a reusable Markdown block with the styled diagram and context.
13. **Export prompt scaffold** — Generate an AI-ready instruction scaffold for future diagram generation.
14. **Open in Mermaid Live Editor** — Send or copy the result to Mermaid Live for independent validation.
15. **Use in target documentation** — Paste the styled diagram into GitHub, Notion, Obsidian, or project docs.

---

## Examples Tab

**Browse and load diagram examples**

1. **Browse the sidebar catalog** — Scroll grouped families or expand Browse all supported families for the full list.
2. **Search by name or type** — Type in the search box to filter by diagram name, family, or badge.
3. **Preview with your palette** — Click any example and see it rendered instantly with your active theme.
4. **Load into Apply Tab** — Click the button to send the example to Apply as a starting template.

---

## Reference Tab

**Explore technical specs and classes**

1. **Check renderer compatibility** — Open the parity matrix to see platform support for init directives and theme variables.
2. **Review diagram families** — Browse all supported Mermaid types with theme-confidence and notation ratings.
3. **Explore the class library** — Look up CSS class names like .primary and .secondary used in diagrams.
4. **Fix class name errors** — If Apply tab code has unrecognized class names, use the Fix button to correct them.
5. **Understand support badges** — Legend entries explain Native, Beta, and Experimental support levels at a glance.
