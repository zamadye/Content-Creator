#!/usr/bin/env bash
# One local episode-specific build. All inputs/outputs remain private; no uploads.
set -euo pipefail
HERE="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd -- "$HERE/../../.." && pwd)"
ENGINE="$ROOT/editorial-engine"
cd "$ROOT"
if [[ ! -x "$ENGINE/node_modules/.bin/tsx" || ! -x "$ENGINE/node_modules/@ffmpeg-installer/linux-x64/ffmpeg" || ! -x "$ENGINE/node_modules/@remotion/compositor-linux-x64-gnu/ffprobe" ]]; then
  echo 'Missing Linux x64 toolchain. Run npm ci in editorial-engine first.' >&2; exit 1
fi
# The review record must be a real human decision. Never fabricate it.
node --test "$HERE/test-preflight.mjs"
python3 "$HERE/test-glyphs.py"
python3 "$HERE/check-glyphs.py"
python3 "$HERE/test-qa.py"
node "$HERE/preflight.mjs" --stage voice --review "$ROOT/.scratch/turbine/human-review.json"
python3 "$HERE/prepare.py"
node "$HERE/preflight.mjs" --stage render --review "$ROOT/.scratch/turbine/human-review.json"
(
  cd "$ENGINE"
  ./node_modules/.bin/tsc --noEmit
  ./node_modules/.bin/tsx pipeline/turbin-angin-v1/render.tsx --continuity-check
  ./node_modules/.bin/tsx pipeline/turbin-angin-v1/render.tsx --samples
  ./node_modules/.bin/tsx pipeline/turbin-angin-v1/render.tsx --all
)
python3 "$HERE/qa.py"
cp "$ENGINE/content/proposals/turbin-angin-caption-draf.txt" "$ROOT/.scratch/turbine/render/Caption-4-platform-DRAF.txt"
echo 'Private draft built. Human playback, mobile, rights and opening target remain unresolved; do not publish.'
