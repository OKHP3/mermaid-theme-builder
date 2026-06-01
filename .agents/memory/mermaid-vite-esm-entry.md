---
name: Mermaid + Vite ESM entry aliasing
description: Why mermaid and mermaid-zenuml must be aliased to their .esm.min.mjs builds in Vite dev
---

## The rule
Always alias `mermaid` and `@mermaid-js/mermaid-zenuml` to their `.esm.min.mjs` files
in `resolve.alias`, AND exclude them from `optimizeDeps`.

**Why:**
Both packages export `.core.mjs` as their ESM entry (`exports["."].import`).
The `.core.mjs` build has EXTERNAL imports for dayjs, @zenuml/core, etc. — CJS packages
that fail in the browser without Vite pre-bundling ("does not provide an export named default").

The `.esm.min.mjs` build bundles ALL deps inline — no external CJS imports, works without pre-bundling.

`optimizeDeps.exclude` is required so files are served raw (not pre-bundled),
preserving the relative `./chunks/mermaid.esm.min/...` dynamic imports that
the lazy diagram loaders use. Pre-bundling breaks those relative paths.

**How to apply:**
When upgrading mermaid or mermaid-zenuml, verify `.esm.min.mjs` still exists
and that the `optimizeDeps.exclude` + `resolve.alias` pair is in vite.config.ts.
