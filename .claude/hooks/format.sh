#!/usr/bin/env bash
# PostToolUse hook (Edit|Write|MultiEdit): format the file Claude just wrote,
# so formatting never needs a separate step.
#   server/**/*.go -> gofmt -w, then golangci-lint fmt (goimports with the
#                     repo config) when golangci-lint is installed
#   client/**      -> Prettier with the client's config and ignore file
# Silent on success. A missing tool is reported to the user as a warning and
# never fails the edit. A formatter error (e.g. a syntax error) exits 2, which
# shows the message to Claude so it can fix the file.
set -euo pipefail

input=$(cat)

if command -v jq >/dev/null 2>&1; then
  file=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')
else
  file=$(printf '%s' "$input" | sed -n 's/.*"file_path"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -n1)
fi
[ -n "$file" ] && [ -f "$file" ] || exit 0

root=$(cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}" && pwd -P)
file="$(cd "$(dirname "$file")" && pwd -P)/$(basename "$file")"
rel=${file#"$root"/}

# Shown to the user, not Claude. Messages are fixed text without quotes.
warn() {
  printf '{"systemMessage": "format hook: %s"}\n' "$1"
  exit 0
}
# Shown to Claude (PostToolUse exit 2); the edit itself already happened.
fail() {
  printf 'format hook: %s failed on %s:\n%s\n' "$1" "$rel" "$2" >&2
  exit 2
}

case "$rel" in
  server/*.go)
    # gofmt first: it reports syntax errors (golangci-lint fmt skips them
    # silently). Then golangci-lint fmt adds goimports with the repo config.
    command -v gofmt >/dev/null 2>&1 || warn "gofmt not found; $rel left unformatted"
    out=$(gofmt -w "$file" 2>&1) || fail gofmt "$out"
    if command -v golangci-lint >/dev/null 2>&1; then
      out=$(cd "$root/server" && golangci-lint fmt "$file" 2>&1) || fail "golangci-lint fmt" "$out"
    fi
    ;;
  client/*)
    prettier="$root/client/node_modules/.bin/prettier"
    [ -x "$prettier" ] || warn "client/node_modules missing (run yarn install in client/); $rel left unformatted"
    # --ignore-unknown skips files Prettier has no parser for; .prettierignore
    # (generated files) is honoured because we run from client/.
    out=$(cd "$root/client" && "$prettier" --write --ignore-unknown --log-level=warn "$file" 2>&1) ||
      fail prettier "$out"
    ;;
esac
exit 0
