#!/bin/sh
# The client quality gate. Runs every step, prints only the output of failing
# steps, and exits non-zero if any step failed.
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

# Regenerate into place and compare, so typecheck below sees fresh output and
# a stale file shows up as a diff to commit.
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

# Features and routes use theme tokens and component variants, never arbitrary
# Tailwind values such as h-[475px] or text-[#333] (see CLAUDE.md). oxlint has no
# Tailwind rules, so this is a plain search.
no_arbitrary_values() {
  ! grep -rnE '[a-z0-9]-\[[^]]+\]' --include='*.tsx' --include='*.ts' src/features src/routes
}

step "generated files" generated_up_to_date
step "no arbitrary tailwind values in features/routes" no_arbitrary_values
step "typecheck" yarn -s typecheck
step "lint" yarn -s lint
step "format" yarn -s format:check
step "test" yarn -s test
step "build" yarn -s vite build

exit $failed
