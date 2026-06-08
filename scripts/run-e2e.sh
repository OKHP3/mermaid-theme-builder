#!/usr/bin/env bash
# Wrapper for `pnpm test:e2e` that supplies the Nix library paths Playwright's
# bundled headless Chromium needs when running on NixOS (Replit dev env).
#
# On Ubuntu/CI the Nix chromium wrapper is absent; the script is a no-op and
# falls through to the normal `playwright test` call.
#
# Strategy:
#  1. Locate the system `chromium` wrapper in PATH.
#  2. Parse the `exec "..."` line to find the unwrapped binary path.
#  3. Extract its DT_RUNPATH (embedded library search paths).
#  4. Strip out glibc / gcc entries — loading these into the Node.js process
#     that runs Playwright causes a stack-smash / ABI mismatch crash.
#  5. Prepend the safe Nix lib paths to LD_LIBRARY_PATH so the Playwright
#     bundled headless shell can dlopen libatk, libglib, libX11, etc.
#  6. exec playwright.

set -e

if CHROME_BIN=$(command -v chromium 2>/dev/null); then
  UNWRAPPED=$(grep -m1 'exec "' "$CHROME_BIN" \
    | sed 's/.*exec "\([^"]*\)".*/\1/' \
    || true)
  if [ -x "$UNWRAPPED" ]; then
    RAW_RUNPATH=$(readelf -d "$UNWRAPPED" 2>/dev/null \
      | grep RUNPATH \
      | sed 's/.*\[\(.*\)\]/\1/' \
      || true)
    if [ -n "$RAW_RUNPATH" ]; then
      # Filter out glibc and gcc paths — they must not shadow Node's own ABI
      SAFE_RUNPATH=$(echo "$RAW_RUNPATH" \
        | tr ':' '\n' \
        | grep -Ev -- '-glibc-|-gcc-' \
        | tr '\n' ':' \
        | sed 's/:$//')
      if [ -n "$SAFE_RUNPATH" ]; then
        export LD_LIBRARY_PATH="${SAFE_RUNPATH}${LD_LIBRARY_PATH:+:}${LD_LIBRARY_PATH}"
      fi
    fi
  fi
fi

exec node_modules/.bin/playwright test --config playwright.config.ts "$@"
