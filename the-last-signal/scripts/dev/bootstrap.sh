#!/usr/bin/env bash
# Siapkan environment kerja di sandbox/ephemeral CI.
# Dipakai setiap kali workspace dibuat ulang (node_modules & /tmp tidak persisten).
#
#   bash scripts/dev/bootstrap.sh
set -euo pipefail

BRANCH="${1:-arena/479de245-content-creator}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"

cd "$REPO_ROOT"
git fetch -q origin "$BRANCH" || true
if git rev-parse --verify FETCH_HEAD >/dev/null 2>&1; then
  if git diff --quiet && git diff --cached --quiet; then
    echo "▶ sinkron ke origin/$BRANCH"
    git reset --hard FETCH_HEAD >/dev/null
  else
    echo "⚠ ada perubahan lokal — sinkron dilewati (commit dulu)"
  fi
fi

command -v pnpm >/dev/null 2>&1 || { echo "▶ install pnpm"; npm i -g pnpm@9 >/dev/null 2>&1; }

cd "$REPO_ROOT/the-last-signal"
echo "▶ pnpm install"
pnpm install --silent

if [ ! -x /tmp/chromium ]; then
  echo "▶ provision chromium"
  bash scripts/dev/provision-browser.sh
fi

echo
echo "Siap. Render:"
echo "  LD_LIBRARY_PATH=/tmp/chromelibs REMOTION_BROWSER_EXECUTABLE=/tmp/chromium pnpm render"
