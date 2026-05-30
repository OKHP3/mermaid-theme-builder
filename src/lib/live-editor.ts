/**
 * Builds a mermaid.live/edit URL for a given block of Mermaid code.
 *
 * Compatible with the mermaid-js/mermaid-live-editor base64 serde format:
 *   https://github.com/mermaid-js/mermaid-live-editor/blob/develop/src/lib/util/serde.ts
 *
 * Serde format: #base64:<urlSafeBase64(utf8(JSON.stringify(State)))>
 *
 * We build the URL synchronously so window.open() receives the final URL
 * in the same call — opening a blank window first and navigating later
 * fails when noopener is set (the returned reference is null in all
 * modern browsers, so the deferred navigation never fires).
 *
 * The %%{init}%% directive in the code takes precedence over the `mermaid`
 * config field in the live editor, so our palette-injected theme renders
 * correctly without modification.
 */

const LIVE_EDITOR_BASE = "https://mermaid.live/edit";

function toUrlSafeBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function openInLiveEditor(themedCode: string): void {
  const stateJson = JSON.stringify({
    code: themedCode,
    mermaid: JSON.stringify({ theme: "base" }),
    updateDiagram: true,
    rough: false,
    panZoom: true,
    grid: true,
  });
  const encoded = new TextEncoder().encode(stateJson);
  const url = `${LIVE_EDITOR_BASE}#base64:${toUrlSafeBase64(encoded)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}
