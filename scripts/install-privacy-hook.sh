#!/usr/bin/env bash
set -euo pipefail
root="$(git rev-parse --show-toplevel)"
cd "$root"
git config --local core.hooksPath .githooks
printf 'Installed local pre-commit privacy filename guard in %s\n' "$root"
printf 'The guard checks names, not file contents. Review staged diffs manually. Re-run after a fresh workspace or clone.\n'
