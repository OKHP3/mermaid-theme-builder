// Mermaid initialization and injected-style capture share document state.
// Keep the whole render transaction serial, including cleanup after errors.
let pending: Promise<unknown> = Promise.resolve();

export function queuePreviewRender<T>(render: () => Promise<T>): Promise<T> {
  const result = pending.then(render);
  pending = result.catch(() => undefined);
  return result;
}
