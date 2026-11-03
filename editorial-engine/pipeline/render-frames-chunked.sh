#!/usr/bin/env bash
# Renders every frame in short-lived chunks.
# Each chunk is its own node process: RSS stays flat on a 4 GB box (a single long
# render process gets OOM-killed around 600 frames — observed, not theoretical).
set -u
CHUNK=${CHUNK:-180}
TOTAL=${TOTAL:-2660}
FRAMES_DIR=${FRAMES_DIR:-rendering/frames}
from=0
while [ "$from" -lt "$TOTAL" ]; do
  to=$(( from + CHUNK - 1 ))
  [ "$to" -ge "$TOTAL" ] && to=$(( TOTAL - 1 ))
  npx tsx pipeline/render-frames.ts --from "$from" --to "$to" 2>/dev/null | tail -1
  from=$(( to + 1 ))
done
ls "$FRAMES_DIR"/*.png 2>/dev/null | wc -l
