#!/bin/sh
set -u
cd "$(dirname "$0")/.."

failed=0
step() {
  name=$1
  shift
  if ! out=$("$@" 2>&1); then
    printf '\n✗ %s\n%s\n' "$name" "$out"
    failed=1
  fi
}

generated_up_to_date() {
  tmp=$(mktemp -d)
  trap 'rm -rf "$tmp"' EXIT
  stale=""
  for f in src/lib/api/schema.d.ts src/routeTree.gen.ts; do
    cp "$f" "$tmp/$(basename "$f")" 2>/dev/null || stale="$stale $f"
  done
  yarn -s gen >/dev/null 2>&1 || { echo "yarn gen failed"; return 1; }
  for f in src/lib/api/schema.d.ts src/routeTree.gen.ts; do
    cmp -s "$f" "$tmp/$(basename "$f")" || stale="$stale $f"
  done
  [ -z "$stale" ] && return 0
  echo "Out of date (now regenerated, commit them):$stale"
  return 1
}

step "generated files" generated_up_to_date
step "typecheck" yarn -s typecheck
step "lint" yarn -s lint
step "format" yarn -s format:check
step "test" yarn -s test
step "build" yarn -s vite build

exit $failed
