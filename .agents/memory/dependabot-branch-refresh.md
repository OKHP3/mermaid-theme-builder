---
name: Dependabot branch refresh
description: Why remote branch cleanup can appear to undo itself after a fresh fetch
---

Remote Dependabot branches are managed by GitHub and can be recreated or appear after a later `git fetch --prune`, even when an earlier cleanup left only `origin/main`.

**Why:** A repository refresh is authoritative for current remote state, so a branch sweep performed before the refresh can become stale. The branch tip and its relationship to `origin/main` must be rechecked before deletion or merging.

**How to apply:** Always fetch first, classify each current Dependabot branch against `origin/main`, and do not assume a branch is dead solely because it was absent during an earlier cleanup.