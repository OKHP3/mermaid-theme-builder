#!/bin/bash
set -e

# ── Validate packageManager before anything else ──────────────────────────
# Require an exact stable vendor pin before invoking the native launcher.

EXPECTED_PATTERN='^pnpm@[0-9]+\.[0-9]+\.[0-9]+$'

PKG_MANAGER=$(node -e "process.stdout.write(require('./package.json').packageManager || '')" 2>/dev/null || true)

if [ -z "$PKG_MANAGER" ]; then
  echo "post-merge: ERROR — packageManager field is missing from package.json" >&2
  echo "            Add the verified stable pnpm version." >&2
  exit 1
fi

if [[ ! "$PKG_MANAGER" =~ $EXPECTED_PATTERN ]]; then
  echo "post-merge: ERROR — unexpected packageManager value: \"$PKG_MANAGER\"" >&2
  echo "            Expected an exact stable pnpm version." >&2
  echo "            If this was an accidental bump, revert package.json and re-merge." >&2
  exit 1
fi

echo "post-merge: packageManager OK (${PKG_MANAGER})"

# ── Install dependencies ───────────────────────────────────────────────────
node scripts/run-pnpm.mjs install --frozen-lockfile --ignore-scripts
