# Cross-diagram preview and repeat use

Increment 3 adds an on-demand comparison in Compose. Open **Compare samples**
and select Flowchart, Sequence Diagram, or ER Diagram. The samples come from
the existing example catalog; family information comes from the capability registry.

Only the selected sample renders. The full preview picker remains available,
and closing comparison restores its prior selection, the library, and the editor.
Comparison temporarily focuses the workspace on the samples. Comparing samples does
not replace your own diagram or change a saved theme. Theme edits update the
selected sample using the current appearance, typography, and output format.

On mobile, selecting **Theme** closes comparison and restores theme editing.
The normal preview picker remains available when returning to **Preview**.

The gallery separates family coverage from the selected destination's documented
color, look, and font limits. It does not test an external renderer. Verify your
export in its destination before publishing. **Use with my diagram** returns
to Apply with your original source and current theme.

In Apply, **Paste next diagram** focuses and selects the existing input without
clearing it. Nothing changes until you paste or type the replacement. The theme
stays selected. Copy or download the current diagram first if you need to retain it;
this action is not a diagram-history or batch-processing feature.

**Export JSON** continues to export a complete portable theme, not the preview
sample or pasted diagram. See [complete themes](complete-themes.md) for save,
draft, import, backup, and recovery behavior.

## Rendering boundary

Preview initialization, rendering, and injected-style cleanup run serially.
Obsolete queued previews are skipped, and an error does not stop the next
render. This avoids multiple style-capture transactions sharing Mermaid's
document-level state. No renderer dependency or parallel rendering engine is added.

Mermaid Theme Builder is a personal OverKill Hill P3 project by Jamie Hill.
It is not affiliated with Builders FirstSource, BFS, Mermaid, Mermaid Chart,
Mermaid.ai, or any third-party brand represented by user-entered colors.
