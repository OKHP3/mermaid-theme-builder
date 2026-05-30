#!/usr/bin/env bash
# check-links.sh — Internal Markdown link validator
#
# Scans docs/, skills/, and selected root-level Markdown files for relative
# links that point to files that no longer exist on disk.  External URLs
# (http/https) and mailto: links are intentionally skipped to avoid
# rate-limit failures in CI.
#
# Handles both inline links  [text](target)
# and reference-style links  [ref]: target
#
# Usage (from the project root):
#   bash scripts/check-links.sh
#
# No external dependencies required — pure bash + standard POSIX tools.
#
# Exits 0 when all relative links resolve.
# Exits 1 with a clear per-file error listing every broken link found.

set -euo pipefail

ROOT_MD_FILES=()
for f in README.md CHANGELOG.md AGENTS.md; do
  [[ -f "$f" ]] && ROOT_MD_FILES+=("$f")
done

mapfile -t DOCS_MD_FILES < <(find docs/ -name "*.md" -type f | sort)

SKILLS_MD_FILES=()
if [[ -d skills/ ]]; then
  mapfile -t SKILLS_MD_FILES < <(find skills/ -name "*.md" -type f | sort)
fi

ALL_FILES=("${ROOT_MD_FILES[@]}" "${DOCS_MD_FILES[@]}" "${SKILLS_MD_FILES[@]}")

if [[ ${#ALL_FILES[@]} -eq 0 ]]; then
  echo "No Markdown files found to check." >&2
  exit 1
fi

echo "Checking internal links in ${#ALL_FILES[@]} Markdown file(s)..."
echo ""

FAILED=0
BROKEN_COUNT=0

for FILE in "${ALL_FILES[@]}"; do
  FILE_DIR="$(dirname "$FILE")"
  FILE_BROKEN=0

  # Extract relative link targets from two syntaxes, then filter:
  #   Inline:           [text](target)   — grep for target inside parens
  #   Reference-style:  [ref]: target    — grep for bare URL/path on ref lines
  # Both: skip http(s)://, mailto:, pure anchors (#), and empty values.
  while IFS= read -r RAW_TARGET; do
    # Strip any trailing fragment (#section) so we check the file itself.
    TARGET="${RAW_TARGET%%#*}"
    [[ -z "$TARGET" ]] && continue

    # Resolve relative to the file's directory.
    if [[ "$TARGET" == /* ]]; then
      RESOLVED="$TARGET"
    else
      RESOLVED="$FILE_DIR/$TARGET"
    fi

    if [[ ! -e "$RESOLVED" ]]; then
      if [[ "$FILE_BROKEN" -eq 0 ]]; then
        echo "  $FILE"
      fi
      echo "    [BROKEN] $RAW_TARGET"
      FILE_BROKEN=1
      BROKEN_COUNT=$((BROKEN_COUNT + 1))
      FAILED=1
    fi
  done < <(
    {
      # Inline links: [text](target)
      grep -oP '\]\(\K[^)]+' "$FILE" 2>/dev/null || true

      # Reference-style link definitions: ^[label]: target
      grep -oP '^\s*\[[^\]]+\]:\s+\K\S+' "$FILE" 2>/dev/null || true
    } \
      | grep -v '^https\?://' \
      | grep -v '^http://' \
      | grep -v '^https://' \
      | grep -v '^mailto:' \
      | grep -v '^#' \
      || true
  )
done

echo ""
if [[ "$FAILED" -eq 0 ]]; then
  echo "PASS: All internal Markdown links are valid."
else
  echo "FAIL: $BROKEN_COUNT broken internal link(s) detected." >&2
  echo "" >&2
  echo "  Fix the links listed above, then re-run: bash scripts/check-links.sh" >&2
  echo "" >&2
  exit 1
fi
