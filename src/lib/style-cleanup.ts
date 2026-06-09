/**
 * CSS leakage guard for Mermaid diagram rendering.
 *
 * ## Families confirmed to inject <style> nodes into document.head at render time
 *
 * During a mermaid.render() call several diagram families inject raw <style>
 * tags into document.head. These persist after the SVG string is captured and
 * bleed into subsequently rendered diagrams or into the app's own UI unless
 * explicitly removed.
 *
 * Confirmed render-time injectors (audited against mermaid ^11.14.0 dist chunks):
 *
 *   • venn        — mermaid/dist chunks (vennDiagram chunk) inject a <style>
 *                   tag with d3-based layout CSS on first render.
 *
 *   • gantt       — mermaid/dist chunks (ganttDiagram chunk) inject a <style>
 *                   tag with grid and task bar CSS on first render.
 *
 *   • shared      — Several mermaid internal shared chunks (e.g. dagre layout)
 *                   may add <style> nodes on first use.
 *
 * All other families (flowchart, sequence, class, state, ER, pie, gitGraph,
 * mindmap, timeline, quadrant, requirement, c4, architecture, block, sankey,
 * xychart, packet, kanban, treemap, ishikawa, wardley, treeView, radar,
 * eventModeling, zenuml) do not inject additional <style> nodes at render time
 * — their styling is fully embedded in the returned SVG string.
 *
 * Note on ZenUML: @mermaid-js/mermaid-zenuml (Vue-based) injects Vue-scoped
 * styles at registerExternalDiagrams() time. Those styles use [data-v-*]
 * selectors that only match Vue component DOM — they are harmless to Mermaid's
 * SVG output — so they are intentionally left in document.head and NOT captured.
 * Capturing them at init time would also remove Mermaid's own base CSS (font
 * metrics, size constraints), breaking zoom-to-fit for every non-ZenUML render.
 *
 * ## Strategy
 *
 * Rather than family-gating the cleanup (fragile as mermaid versions change),
 * we apply the cleanup universally: any <style> element added to document.head
 * during a render call is captured, removed from the head, and the CSS text is
 * re-injected as a scoped <style> inside the preview container. This is safe
 * because the SVG output is already a self-contained string — the global style
 * tags are redundant leakage, not required for SVG correctness.
 */

/**
 * Begins observing `document.head` for new `<style>` element insertions.
 *
 * Returns a `finish()` function. Call it after the operation that may inject
 * styles. `finish()` disconnects the observer, removes all captured `<style>`
 * elements from `document.head`, and returns their combined CSS text.
 *
 * @param head - The element to observe (defaults to `document.head`).
 *               Overridable for testing.
 */
export function createStyleCapture(head: Element = document.head): {
  finish: () => string;
} {
  const captured: HTMLStyleElement[] = [];

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node instanceof HTMLStyleElement) {
          captured.push(node);
        }
      }
    }
  });

  observer.observe(head, { childList: true });

  return {
    finish(): string {
      observer.disconnect();
      let css = "";
      for (const el of captured) {
        css += el.textContent ?? "";
        el.remove();
      }
      return css;
    },
  };
}
