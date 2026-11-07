#!/usr/bin/env bash
# Rebuild a private local draft from the separately restored input package.
# Never downloads source assets, uses credentials, schedules, or publishes.
set -euo pipefail
cd "$(dirname "$0")/../.."
D=deliverables/awan-rig-v2
[ -x node_modules/.bin/tsx ] || { echo 'Missing npm dependencies: run npm ci first' >&2; exit 1; }
python3 pipeline/awan-rig-v2/prepare.py
node --test pipeline/awan-rig-v2/test-rig.mjs
python3 pipeline/awan-rig-v2/test-restore.py
node_modules/.bin/tsx pipeline/awan-rig-v2/render.tsx --stills
read -r total middle < <(python3 -c 'import json; d=json.load(open("deliverables/awan-rig-v2/prepared.json")); n=round(d["duration"]*d["fps"]); print(n,n//2)')
# Parallel slices of the SAME frame clock; no separate scene timeline.
node_modules/.bin/tsx pipeline/awan-rig-v2/render.tsx --chunk 0 "$middle" part-0.mp4 &
a=$!
node_modules/.bin/tsx pipeline/awan-rig-v2/render.tsx --chunk "$middle" "$total" part-1.mp4 &
b=$!
set +e
wait "$a"; sa=$?
wait "$b"; sb=$?
set -e
if (( sa != 0 || sb != 0 )); then echo "Render failed (slice statuses $sa, $sb); not assembling" >&2; exit 1; fi
node_modules/.bin/tsx pipeline/awan-rig-v2/render.tsx --assemble
python3 pipeline/awan-rig-v2/write-deliverables.py
python3 pipeline/awan-rig-v2/qa.py
printf 'Private draft: %s\n' "$D/awan-500-ton-rig-v2.mp4"
