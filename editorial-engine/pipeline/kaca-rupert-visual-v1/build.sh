#!/usr/bin/env bash
# Private rebuild only. No network, upload, scheduling or publication.
set -euo pipefail
cd "$(dirname "$0")/../.."
[ -x node_modules/.bin/tsx ] || { echo 'Install dependencies: npm ci' >&2; exit 1; }
python3 pipeline/kaca-rupert-visual-v1/prepare.py
node --test pipeline/kaca-rupert-visual-v1/test-story.mjs pipeline/awan-rig-v2/test-rig.mjs
python3 pipeline/kaca-rupert-visual-v1/test-prepare.py
python3 pipeline/kaca-rupert-visual-v1/test-restore.py
./node_modules/.bin/tsx pipeline/kaca-rupert-visual-v1/render.tsx --stills
read -r total middle < <(python3 -c 'import json; d=json.load(open("deliverables/kaca-rupert-visual-v1/prepared.json")); n=round(d["duration"]*d["fps"]); print(n,n//2)')
./node_modules/.bin/tsx pipeline/kaca-rupert-visual-v1/render.tsx --chunk 0 "$middle" part-0.mp4 & a=$!
./node_modules/.bin/tsx pipeline/kaca-rupert-visual-v1/render.tsx --chunk "$middle" "$total" part-1.mp4 & b=$!
set +e; wait "$a"; sa=$?; wait "$b"; sb=$?; set -e
if ((sa != 0 || sb != 0)); then echo "Render failed $sa/$sb; not assembling" >&2; exit 1; fi
./node_modules/.bin/tsx pipeline/kaca-rupert-visual-v1/render.tsx --assemble
python3 pipeline/kaca-rupert-visual-v1/write-deliverables.py
python3 pipeline/kaca-rupert-visual-v1/qa.py
printf '%s\n' 'Private draft: deliverables/kaca-rupert-visual-v1/kaca-rupert-visual-v1.mp4'
