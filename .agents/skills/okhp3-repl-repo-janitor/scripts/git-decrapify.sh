#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# git-decrapify
# Part of: okhp3-repl-repo-janitor  (OverKill Hill P³)
#
# A portable, interactive shell function that cleans up local branch clutter
# in a single Replit-hosted Git checkout.
#
# INSTALL — add to ~/.zshrc or ~/.bashrc, then `source` the file:
#
#   source /path/to/.agents/skills/okhp3-repl-repo-janitor/scripts/git-decrapify.sh
#
# Or paste the function body directly into your shell config.
#
# USAGE:
#   git-decrapify            # base branch defaults to "main"
#   git-decrapify develop    # specify a different base branch
#
# WHAT IT DELETES:
#   Tier 1 (auto, with confirmation):
#     • All local subrepl-* branches    — Replit task-agent ephemera
#     • All local agent/* branches      — Replit agent-branch pattern
#     • All local branches fully merged into <base-branch>
#
#   Tier 2 (asks separately):
#     • replit-agent — may hold the full unflattened dev history;
#       safe to delete if the squash-merged content is already on <base>,
#       but worth a deliberate choice.
#
# WHAT IT NEVER TOUCHES:
#   • The currently checked-out branch
#   • Remote-tracking refs (remotes/origin/*)
#   • Stashes or archive refs
#   • The base branch itself
# ─────────────────────────────────────────────────────────────────────────────

git-decrapify() {
  local base="${1:-main}"

  # ── Preflight ───────────────────────────────────────────────────────────────
  if ! git rev-parse --git-dir &>/dev/null; then
    echo "❌  Not inside a git repository." >&2; return 1
  fi

  if ! git rev-parse --verify "$base" &>/dev/null && \
     ! git rev-parse --verify "origin/$base" &>/dev/null; then
    echo "❌  Base branch '$base' not found locally or at origin/$base." >&2; return 1
  fi

  local current
  current=$(git branch --show-current)

  # ── Tier 1a: subrepl-* and agent/* (Replit task-agent ephemera) ─────────────
  local tier1a
  tier1a=$(git branch --format='%(refname:short)' \
    | grep -E '^(subrepl-|agent/)' \
    | grep -v "^${current}$")

  # ── Tier 1b: branches fully merged into base ────────────────────────────────
  local tier1b
  tier1b=$(git branch --merged "${base}" --format='%(refname:short)' \
    | grep -v -E "^(${base}|${current}|HEAD)$")

  # Merge 1a + 1b, deduplicate
  local auto_delete
  auto_delete=$(printf '%s\n%s\n' "$tier1a" "$tier1b" \
    | sort -u | grep -v '^$')

  # ── Tier 2: replit-agent (ask separately) ────────────────────────────────────
  local has_replit_agent=""
  if git rev-parse --verify replit-agent &>/dev/null \
     && [[ "$current" != "replit-agent" ]]; then
    has_replit_agent="yes"
  fi

  # ── Summary header ───────────────────────────────────────────────────────────
  echo "═══════════════════════════════════════════════════"
  echo "  git-decrapify  (base: $base | on: $current)"
  echo "═══════════════════════════════════════════════════"

  if [[ -z "$auto_delete" && -z "$has_replit_agent" ]]; then
    echo "✅  Nothing to delete — already clean."; return 0
  fi

  # ── Print Tier 1 candidates ──────────────────────────────────────────────────
  local auto_count=0
  if [[ -n "$auto_delete" ]]; then
    auto_count=$(echo "$auto_delete" | grep -c .)
    echo ""
    echo "AUTO-DELETE candidates ($auto_count branch(es)):"
    echo "  subrepl-* / agent/* → Replit task-agent ephemera"
    echo "  merged into $base   → content already on $base"
    echo ""
    while IFS= read -r b; do
      local last
      last=$(git log -1 --format="%ar  %s" "$b" 2>/dev/null | cut -c1-72)
      printf "  %-42s  %s\n" "$b" "$last"
    done <<< "$auto_delete"
  fi

  # ── Print Tier 2 info ────────────────────────────────────────────────────────
  if [[ -n "$has_replit_agent" ]]; then
    local ra_count
    ra_count=$(git log --oneline replit-agent ^"$base" 2>/dev/null | wc -l | tr -d ' ')
    echo ""
    echo "ASK separately — replit-agent: $ra_count commit(s) ahead of $base"
    echo "  Usually the full unflattened dev history. Safe to delete once"
    echo "  squash-merged content is confirmed on $base."
  fi

  echo ""

  # ── Execute Tier 1 ──────────────────────────────────────────────────────────
  if [[ -n "$auto_delete" ]]; then
    read -r -p "Delete $auto_count branch(es) above? [y/N] " go
    if [[ "$go" =~ ^[Yy]$ ]]; then
      local deleted=0 failed=0
      while IFS= read -r b; do
        if git branch -D "$b" 2>/dev/null; then
          ((deleted++))
        else
          echo "  ⚠️  Could not delete: $b" >&2
          ((failed++))
        fi
      done <<< "$auto_delete"
      echo "✅  $deleted deleted${failed:+, $failed skipped}."
    else
      echo "⏭   Skipped Tier 1."
    fi
  fi

  # ── Execute Tier 2 ──────────────────────────────────────────────────────────
  if [[ -n "$has_replit_agent" ]]; then
    echo ""
    read -r -p "Delete replit-agent too? [y/N] " go2
    if [[ "$go2" =~ ^[Yy]$ ]]; then
      git branch -D replit-agent && echo "✅  replit-agent deleted."
    else
      echo "⏭   Kept replit-agent."
    fi
  fi

  # ── Final state ─────────────────────────────────────────────────────────────
  echo ""
  echo "Remaining local branches:"
  git branch
}
