#!/usr/bin/env bash
# One episode, locally only: no network, Drive sharing or scheduling.
set -euo pipefail
cd "$(dirname "$0")/../.."
if [[ $# != 1 ]]; then echo "Usage: bash pipeline/rebuild-nov-2026/build.sh EPISODE_ID" >&2; exit 2; fi
id="$1"
[[ "$id" =~ ^[a-z0-9-]+$ ]] || { echo 'Invalid episode id' >&2; exit 2; }
python3 pipeline/rebuild-nov-2026/prepare.py "$id"
python3 pipeline/rebuild-nov-2026/captions.py "$id"
npx --no-install tsx pipeline/rebuild-nov-2026/render.tsx "$id" --stills
npx --no-install tsx pipeline/rebuild-nov-2026/render.tsx "$id"
python3 pipeline/rebuild-nov-2026/qa.py "$id"
