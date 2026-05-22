/**
 * Builds a mermaid.live/edit URL for a given block of Mermaid code.
 *
 * Compatible with the mermaid-js/mermaid-live-editor pako serde format:
 *   https://github.com/mermaid-js/mermaid-live-editor/blob/develop/src/lib/util/serde.ts
 *   https://github.com/mermaid-js/mermaid-live-editor/blob/develop/src/lib/types.d.ts
 *
 * Serde format:  #pako:<urlSafeBase64(deflate(utf8(JSON.stringify(State))))>
 * Fallback:      #base64:<urlSafeBase64(utf8(JSON.stringify(State)))>  (live editor supports both)
 *
 * The %%{init}%% directive in the code takes precedence over the `mermaid` config field
 * in the live editor, so our palette-injected theme renders correctly without modification.
 */

const LIVE_EDITOR_BASE = "https://mermaid.live/edit";

function toUrlSafeBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function buildLiveEditorUrl(themedCode: string): Promise<string> {
  const stateJson = JSON.stringify({
    code: themedCode,
    mermaid: JSON.stringify({ theme: "base" }),
    updateDiagram: true,
    rough: false,
    panZoom: true,
    grid: true,
  });

  const encoded = new TextEncoder().encode(stateJson);

  if (typeof CompressionStream !== "undefined") {
    const cs = new CompressionStream("deflate");
    const writer = cs.writable.getWriter();
    await writer.write(encoded);
    await writer.close();
    const buffer = await new Response(cs.readable).arrayBuffer();
    return `${LIVE_EDITOR_BASE}#pako:${toUrlSafeBase64(new Uint8Array(buffer))}`;
  }

  return `${LIVE_EDITOR_BASE}#base64:${toUrlSafeBase64(encoded)}`;
}

export function openInLiveEditor(themedCode: string): void {
  // Open the window synchronously inside the click event so the popup blocker
  // treats it as a direct user gesture. Navigate it once the URL is ready.
  const win = window.open("", "_blank", "noopener,noreferrer");
  if (!win) return;
  buildLiveEditorUrl(themedCode)
    .then((url) => {
      win.location.href = url;
    })
    .catch(() => {
      win.location.href = LIVE_EDITOR_BASE;
    });
}
