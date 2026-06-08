#!/usr/bin/env bash
# check-changelog.sh — Release CHANGELOG gate
#
# Verifies that CHANGELOG.md contains a versioned section matching the given
# tag before a release is tagged.  Called by .github/workflows/release-gate.yml
# on every v* tag push, and documented in docs/release-checklist.md for local
# pre-tag validation.
#
# Usage:
#   bash scripts/check-changelog.sh v0.6.0
#
# Exits 0 on success.  Exits 1 with a descriptive error when the versioned
# section is absent, so the release pipeline fails fast rather than shipping
# a tag with no CHANGELOG entry.

set -euo pipefail

TAG="${1:-}"

if [[ -z "$TAG" ]]; then
  echo "Usage: $0 <tag>  (e.g., v0.6.0)" >&2
  exit 1
fi

# Strip a leading 'v' so both "v0.6.0" and "0.6.0" are accepted.
VERSION="${TAG#v}"

CHANGELOG="CHANGELOG.md"

if [[ ! -f "$CHANGELOG" ]]; then
  echo "ERROR: $CHANGELOG not found in the working directory." >&2
  exit 1
fi

# Check that a versioned section matching the tag exists.
if grep -qE "^## \[${VERSION}\]" "$CHANGELOG"; then
  echo "PASS: $CHANGELOG contains a [${VERSION}] section."
else
  echo "" >&2
  echo "ERROR: $CHANGELOG has no [${VERSION}] section." >&2
  echo "" >&2
  echo "  Before tagging ${TAG}, follow docs/release-checklist.md:" >&2
  echo "    1. Move all items from [Unreleased] to a new ## [${VERSION}] — YYYY-MM-DD section." >&2
  echo "    2. Add a comparison link in the footer:" >&2
  echo "       [${VERSION}]: https://github.com/OKHP3/mermaid-theme-builder/compare/vPREV...v${VERSION}" >&2
  echo "    3. Commit the updated CHANGELOG.md, then re-run this script." >&2
  echo "" >&2
  exit 1
fi

# Warn (non-fatal) if the [Unreleased] section has been removed entirely.
if grep -qE "^## \[Unreleased\]" "$CHANGELOG"; then
  echo "PASS: [Unreleased] section is present for future development items."
else
  echo "WARNING: [Unreleased] section not found." >&2
  echo "  Add it back so the next development cycle has a place to log changes." >&2
fi

echo ""
echo "CHANGELOG gate passed for ${TAG}."
