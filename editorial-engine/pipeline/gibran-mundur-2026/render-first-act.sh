#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
D="deliverables/gibran-mundur-2026"
mkdir -p "$D"
# Render each <=6s chunk in a fresh Node process to keep Resvg memory bounded.
python3 - <<'PY' > "$D/first-act-chunks.txt"
import json,math
p='content/gibran-mundur/timeline.json'
x=json.load(open(p))
for scene in x['scenes'][:3]:
    n=scene['n']; dur=scene['end']-scene['start']; off=0.0
    while off < dur-1e-6:
        length=min(6.0,dur-off)
        print(n, f'{off:.3f}', f'{length:.3f}')
        off += length
PY
: > "$D/first-act-list.txt"
while read -r N OFFSET LENGTH; do
  NAME=$(printf 'chunk-sc%02d-o%06d.mp4' "$N" "$(python3 -c "print(round(float('$OFFSET')*1000))")")
  if [ ! -s "$D/$NAME" ]; then
    ./node_modules/.bin/tsx pipeline/gibran-mundur-2026/render-design.tsx --render-chunk --scene="$N" --offset="$OFFSET" --duration="$LENGTH"
  fi
  printf "file '%s'\n" "$NAME" >> "$D/first-act-list.txt"
done < "$D/first-act-chunks.txt"
FF="node_modules/@ffmpeg-installer/linux-x64/ffmpeg"
VO="assets/audio/gibran-mundur-2026-11-13/vo-gibran-mundur.mp3"
"$FF" -nostdin -hide_banner -loglevel error -y -f concat -safe 0 -i "$D/first-act-list.txt" -i "$VO" \
  -filter_complex "[0:v]fps=30,format=yuv420p[v];[1:a]atrim=0:55,asetpts=PTS-STARTPTS,loudnorm=I=-16:TP=-3.5:LRA=11[a]" \
  -map '[v]' -map '[a]' -t 55 -r 30 -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p \
  -c:a aac -b:a 192k -ar 48000 -movflags +faststart "$D/animatic-first-55s-v0.mp4"
echo 'FIRST-ACT-DONE deliverables/gibran-mundur-2026/animatic-first-55s-v0.mp4'
