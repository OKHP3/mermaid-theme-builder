/**
 * CSS leakage guard for Mermaid diagram rendering.
 *
 * ## Families confirmed to inject <style> nodes into document.head
 *
 * During a mermaid.render() call (or at import/registration time), several
 * diagram families inject raw <style> tags into document.head. These persist
 * after the SVG string is captured and bleed into subsequently rendered
 * diagrams or into the app's own UI unless explicitly removed.
 *
 * Confirmed injectors (audited against mermaid ^11.14.0 dist chunks):
 *
 *   • zenuml      — @mermaid-js/mermaid-zenuml (Vue-based, external package)
 *                   Injects Vue component styles at registerExternalDiagrams()
 *                   time, not per render. Captured once at init and stored for
 *                   scoped re-injection only when a ZenUML diagram is displayed.
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
 * eventModeling) do not inject additional <style> nodes at render time — their
 * styling is fully embedded in the returned SVG string.
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
