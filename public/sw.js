/* Mermaid Theme Builder service worker.
 * Scope every cache and request to this application. Never touch theme data.
 */
const APP_SCOPE = new URL(self.registration.scope);
const CACHE_PREFIX = `mtb:${APP_SCOPE.href}:`;
const CACHE_NAME = `${CACHE_PREFIX}v2`;
const SHELL_URL = new URL("index.html", APP_SCOPE).href;
const HASHED_ASSET = /^assets\/[^/]+-[A-Za-z0-9_-]{8,}\.(?:js|css|wasm|woff2?|png|jpe?g|svg|webp)$/;

async function readCache(request) {
  try {
    return await (await caches.open(CACHE_NAME)).match(request);
  } catch {
    return undefined;
  }
}

async function writeCache(request, response) {
  try {
    await (await caches.open(CACHE_NAME)).put(request, response.clone());
  } catch {
    // Storage restrictions or quota must not prevent a successful online load.
  }
}

async function rememberShell(response) {
  if (!response.ok || response.type !== "basic") return;
  if (!response.headers.get("content-type")?.includes("text/html")) return;
  const html = await response.clone().text();
  if (html.includes("/@vite/client")) return;
  await writeCache(SHELL_URL, response);
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    fetch(SHELL_URL, { cache: "reload" }).then(async (response) => {
      if (!response.ok) throw new Error("Application shell is unavailable");
      await rememberShell(response);
      await self.skipWaiting();
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .catch(() => undefined)
      .then(() => self.clients.claim())
  );
  // The old shared mtb-cache-v1 cache is intentionally retained. Its ownership
  // is ambiguous on an origin hosting several applications. Never purge siblings.
});

async function navigationResponse(request) {
  try {
    const response = await fetch(request);
    await rememberShell(response);
    return response;
  } catch {
    return (
      (await readCache(SHELL_URL)) ??
      new Response("You are offline. Open this app online once, then try again.", {
        status: 503,
        headers: { "content-type": "text/plain; charset=utf-8" },
      })
    );
  }
}

async function assetResponse(request) {
  const cached = await readCache(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (
    response.ok &&
    response.type === "basic" &&
    !response.headers.get("content-type")?.includes("text/html")
  ) {
    await writeCache(request, response);
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (
    request.method !== "GET" ||
    url.origin !== APP_SCOPE.origin ||
    !url.pathname.startsWith(APP_SCOPE.pathname)
  )
    return;

  if (request.mode === "navigate") {
    event.respondWith(navigationResponse(request));
  } else if (!url.search && HASHED_ASSET.test(url.pathname.slice(APP_SCOPE.pathname.length))) {
    event.respondWith(assetResponse(request));
  }
  // Unversioned files, development modules, and query-bearing requests use the
  // network normally. A previous production worker must not freeze a dev build.
});
