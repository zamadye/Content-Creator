#!/usr/bin/env bash
# Offline private rebuild. Does not upload, schedule, or publish.
set -euo pipefail
cd "$(dirname "$0")/../.."
D=deliverables/awan-rig-v3
[ -x node_modules/.bin/tsx ] || { echo 'Missing npm dependencies: run npm ci' >&2; exit 1; }
python3 pipeline/awan-rig-v3/prepare.py
node --test pipeline/awan-rig-v3/test-story.mjs pipeline/awan-rig-v2/test-rig.mjs
python3 pipeline/awan-rig-v3/test-prepare.py
python3 pipeline/awan-rig-v3/test-restore.py
node_modules/.bin/tsx pipeline/awan-rig-v3/render.tsx --stills
read -r total middle < <(python3 -c 'import json; d=json.load(open("deliverables/awan-rig-v3/prepared.json")); n=round(d["duration"]*d["fps"]); print(n,n//2)')
node_modules/.bin/tsx pipeline/awan-rig-v3/render.tsx --chunk 0 "$middle" part-0.mp4 & a=$!
node_modules/.bin/tsx pipeline/awan-rig-v3/render.tsx --chunk "$middle" "$total" part-1.mp4 & b=$!
set +e; wait "$a"; sa=$?; wait "$b"; sb=$?; set -e
if ((sa != 0 || sb != 0)); then echo "Render failed ($sa/$sb); not assembling" >&2; exit 1; fi
node_modules/.bin/tsx pipeline/awan-rig-v3/render.tsx --assemble
python3 pipeline/awan-rig-v3/write-deliverables.py
python3 pipeline/awan-rig-v3/qa.py
printf 'Private draft: %s\n' "$D/awan-500-ton-rig-v3.mp4"
