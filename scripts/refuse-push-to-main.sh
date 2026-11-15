#!/usr/bin/env bash
# lefthook pre-push guard: refuse any push whose target is the remote `main`.
# Git feeds one line per ref being pushed on stdin:
#   <local ref> <local sha> <remote ref> <remote sha>
# Changes reach main only through a pull request.
set -euo pipefail

status=0
while read -r _local_ref _local_sha remote_ref _remote_sha; do
  if [ "$remote_ref" = "refs/heads/main" ]; then
    echo "refusing to push to main: open a pull request from a feature/<name> branch instead" >&2
    status=1
  fi
done
exit "$status"
