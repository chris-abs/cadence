#!/usr/bin/env bash
# PreToolUse hook (Edit|Write|MultiEdit|NotebookEdit): refuse edits Claude must
# never make (CLAUDE.md hard rule 5):
#   - anything under legacy/ (reference only)
#   - generated files (*.gen.go, client route tree, client API schema)
#   - a migration that already exists on main (schema changes are new files)
# Exit 2 blocks the tool call and shows the reason to Claude; exit 0 allows it.
# GUARD_PROTECTED_REFS overrides the refs checked for migrations (for testing).
set -euo pipefail

input=$(cat)

# Prefer jq; fall back to sed so a machine without jq still gets the guard.
if command -v jq >/dev/null 2>&1; then
  file=$(printf '%s' "$input" | jq -r '.tool_input.file_path // .tool_input.notebook_path // empty')
else
  file=$(printf '%s' "$input" | sed -nE 's/.*"(file_path|notebook_path)"[[:space:]]*:[[:space:]]*"([^"]*)".*/\2/p' | head -n1)
fi
[ -n "$file" ] || exit 0

root=$(cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}" && pwd -P)
case "$file" in /*) ;; *) file="$root/$file" ;; esac

# Resolve the nearest existing directory so `..` and symlinks cannot dodge the
# rules (the file itself may not exist yet for a Write).
dir=$(dirname "$file")
rest=$(basename "$file")
while [ ! -d "$dir" ]; do
  rest="$(basename "$dir")/$rest"
  dir=$(dirname "$dir")
done
abs="$(cd "$dir" && pwd -P)/$rest"

rel=${abs#"$root"/}
[ "$rel" != "$abs" ] || exit 0 # outside the repo: not ours to police

block() {
  printf 'Blocked by .claude/hooks/guard-edits.sh: %s\n' "$1" >&2
  exit 2
}

case "$rel" in
  legacy | legacy/*)
    block "legacy/ is read-only reference code; build the new version in server/ or client/." ;;
  *.gen.go | client/src/routeTree.gen.ts | client/src/lib/api/schema.d.ts)
    block "$rel is generated; change its source (SQL, api/openapi.yaml or routes) and run make gen." ;;
  server/db/migrations/*)
    for ref in ${GUARD_PROTECTED_REFS:-main origin/main}; do
      if git -C "$root" cat-file -e "$ref:$rel" 2>/dev/null; then
        block "$rel is already on $ref; never edit a merged migration. Add one: make -C server migration name=<snake_case>."
      fi
    done
    ;;
esac
exit 0
