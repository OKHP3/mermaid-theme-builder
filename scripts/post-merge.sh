#!/bin/bash
set -e

# ── Validate packageManager before anything else ──────────────────────────
# A bad value here (e.g. pnpm@11.x or a non-existent release copied from a
# dependency) causes SIGABRT crash-loops that exhaust all PTY resources and
# make every workflow unrecoverable until the value is manually reverted.
# Catch it here so the error is obvious and the fix is a single-line revert.

EXPECTED_PREFIX="pnpm@10."

PKG_MANAGER=$(node -e "process.stdout.write(require('./package.json').packageManager || '')" 2>/dev/null || true)

if [ -z "$PKG_MANAGER" ]; then
  echo "post-merge: ERROR — packageManager field is missing from package.json" >&2
  echo "            Add: \"packageManager\": \"pnpm@10.x.x\"" >&2
  exit 1
fi

if [[ "$PKG_MANAGER" != ${EXPECTED_PREFIX}* ]]; then
  echo "post-merge: ERROR — unexpected packageManager value: \"$PKG_MANAGER\"" >&2
  echo "            Expected a value starting with \"${EXPECTED_PREFIX}\"" >&2
  echo "            If this was an accidental bump, revert package.json and re-merge." >&2
  exit 1
fi

echo "post-merge: packageManager OK (${PKG_MANAGER})"

# ── Install dependencies ───────────────────────────────────────────────────
pnpm install --frozen-lockfile
