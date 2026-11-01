#!/usr/bin/env bash
# ONE COMMAND BUILD: script + voice-over -> deliverables A (poster), B (video), C (subtitles)
#
#   bash pipeline/build-all.sh
#
# Steps are separate binaries on purpose: any step can be re-run alone after a fix,
# and every step writes its own report under qa/ or deliverables/.
set -euo pipefail
cd "$(dirname "$0")/.."

step() { printf '\n\033[1m== %s\033[0m\n' "$1"; }

step "1/9 fonts (woff2 -> ttf for resvg)"
npx tsx pipeline/prepare-fonts.ts

step "2/9 measure voice-over"
npx tsx pipeline/measure-voiceover.ts

step "3/9 build timeline (scene timing from measured VO)"
npx tsx pipeline/build-timeline.ts

step "4/9 subtitles"
npx tsx pipeline/build-subtitles.ts

step "5/9 score + sound design (procedural)"
DURATION=$(node -e "const t=require('./content/timeline.json');console.log(t.durationInFrames/t.fps)")
python3 audio/processing/synth_score.py --duration "$DURATION"

step "6/9 mix (voice / score duck / sfx -> -14 LUFS master)"
npx tsx pipeline/mix-audio.ts

step "7/9 render frames"
TOTAL=$(node -e "console.log(require('./content/timeline.json').durationInFrames)")
TOTAL=$TOTAL bash pipeline/render-frames-chunked.sh

step "8/9 encode + poster"
npx tsx pipeline/encode.ts
npx tsx pipeline/render-poster.ts

step "9/9 technical QA"
npx tsx pipeline/qa.ts

printf '\n\033[1mdone.\033[0m deliverables/ + qa/QA-TECHNICAL.md\n'
