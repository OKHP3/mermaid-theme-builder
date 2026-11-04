# Offline reliability

Increment 4 repairs the existing production service worker. It does not change
saved themes, drafts, legacy recovery data, or diagram source.

## What to expect

Open the application online, let it load, then reload once online and visit the
features you intend to use offline. The browser can then reuse that warmed
workspace without a connection. Unvisited diagram families, external fonts,
and destinations are not guaranteed offline. Browser storage restrictions or
eviction can remove the offline cache, so keep theme-library backups separately.

On returning online, page requests fetch current content. Versioned assets are
identified by their build hashes. An already open page does not force a reload;
reload normally to use a deployed update. The app does not clear user data or
unregister workers as an update shortcut.

## Cache boundaries

- Cache names include this application's full registration scope.
- Activation removes only older caches with that exact application prefix.
- The ambiguous legacy `mtb-cache-v1` cache is retained, not deleted.
- Only successful production HTML and hashed production assets are stored.
- Development modules and query-bearing asset requests use the network normally.
- Page queries are not retained as separate offline cache keys.
- Unrelated paths, origins, browser storage, and sibling caches remain untouched.

These changes affect caching only. They add no dependencies, cloud storage,
network analytics, background jobs, or new application data schema.

## Validation boundary

Unit tests cover cache ownership, failed responses, development bypass, canonical
page keys, and missing-cache behavior. An isolated browser test warms the workspace,
reloads offline, renders the saved diagram, returns online, and verifies saved
themes, source, unrelated local storage, and a sibling cache remain intact.
This is not a guarantee that every unvisited feature works offline.

Reference: [MDN CacheStorage](https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage)
and [registration scope](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/scope).

Mermaid Theme Builder is a personal OverKill Hill P3 project by Jamie Hill.
It is not affiliated with Builders FirstSource, BFS, Mermaid, Mermaid Chart,
Mermaid.ai, or any third-party brand represented by user-entered colors.
