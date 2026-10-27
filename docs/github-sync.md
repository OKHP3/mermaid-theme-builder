# GitHub, Replit, and Windows synchronization

GitHub `main` is the shared source of truth. Replit and the Windows folder are independent checkouts. Saving a file in one checkout does not update the others; an uncommitted file is not part of any remote branch.

Mermaid Theme Builder is a personal OverKill Hill P3 project by Jamie Hill.
It is not affiliated with Builders FirstSource, BFS, Mermaid, Mermaid Chart,
Mermaid.ai, or any third-party brand represented by user-entered colors.

## Start with the actual state

Run these commands from the repository root on each host:

```sh
git status --short --branch
git branch --show-current
git worktree list
git stash list
git fetch --no-prune --no-prune-tags origin
git rev-list --left-right --count HEAD...origin/main
git log -1 --format=%H
git rev-parse origin/main
```

The two counts mean local-only and remote-only commits. A clean status and `0 0` establish alignment only after a successful fetch. The remote should be `OKHP3/mermaid-theme-builder`, using an ordinary HTTPS or SSH URL. Do not embed credentials in its URL or copy credentials between hosts.

## Publish changes through a reviewed branch

1. Inspect the diff and preserve uncertain local work. If `main` has edits, create a `codex/<task-name>` branch before committing them.
2. Use `corepack pnpm` so `package.json` selects the intended package manager. Run the repository checks, including typecheck, unit tests, format, source references, skill catalog, build, skill tests, links, and Playwright.
3. Stage the reviewed paths, commit, and push the feature branch. Open a PR against `main`; wait for all required checks, review the actual change, and squash-merge approved work.
4. On every host, return to a clean `main`, fetch, then run `git pull --ff-only origin main`. Run `corepack pnpm install --frozen-lockfile` when the package manifest or lockfile changes.
5. Verify identical full commit hashes, clean status, and `0 0` on both hosts. Refresh Replit's Git panel. Check Pages deployment separately from Git state.

If either count is nonzero on both sides, preserve the local commits on a recovery branch and reconcile them through a PR. Repeating a bare pull or pushing directly to protected `main` will not resolve the underlying difference. Do not reset, force-push, drop stashes, or delete an unresolved branch.

## Host-specific failure boundaries

| Symptom | Meaning and response |
| --- | --- |
| Shell fetch or push fails | Inspect the Git error, network access, remote identity, and the host's credential helper. Reauthenticate through the host's normal connection UI when required. |
| Replit Git panel looks stale | Refresh and Fetch, then compare its displayed branch with the shell's freshly fetched state. |
| Replit connector reports `UNAUTHORIZED` | Reconnect that connector in the client. Browser access, shell Git, and the connector have separate authentication state. A successful shell push does not repair connector OAuth. |
| Windows validation differs from Linux | Confirm the pinned package manager and line endings. Source discovery uses Node's filesystem API; the skill catalog preserves the checkout's line endings. Both paths have regression coverage. |
| Git reports missing commits only from its commit graph | Validate the object database with commit-graph reading disabled. Preserve the cache, rebuild it only if the objects pass, and run full Git verification again. Do not treat missing actual objects as a cache-only problem. |
| A skill catalog reports an extra folder | Inspect the folder. Preserve incomplete local content outside the active catalog; do not register an empty skeleton as a shipped skill or delete unknown work. |

The pre-commit and Replit post-merge hooks invoke `corepack pnpm`. This prevents a different globally installed pnpm version from silently replacing the repository's selected version.

## Branch and notification cleanup

Keep active PR branches. Before retiring a merged or superseded branch, preserve its exact tip under a dated recovery ref and verify its PR disposition plus the resulting `main` content. Delete only those verified branches, then prune their stale tracking refs. Preserve platform backup remotes and existing archive refs.

Resolve a notification's cause first. Mark only this repository's resolved threads read and Done, then verify the repository-filtered active inbox is empty. An empty inbox does not establish that open PRs are safe to merge.

See the [technology inventory and update plan](technology-inventory.md) for dependency maintenance and the [release checklist](release-checklist.md) for release validation.
