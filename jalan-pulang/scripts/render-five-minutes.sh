#!/usr/bin/env bash
# Render a 300-second WIP assembly as sequential, independently verifiable
# chunks. Never treat the output as final without story, audio and visual QC.
set -euo pipefail
cd "$(dirname "$0")/.."
export LD_LIBRARY_PATH="$PWD/../.jalan-pulang-tools/al2023/lib:$PWD/../.jalan-pulang-tools/swiftshader${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
ffmpeg="$PWD/node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg"
ffprobe="$PWD/node_modules/@remotion/compositor-linux-x64-gnu/ffprobe"
chunks="$PWD/render/five-minutes-parts"
mkdir -p "$chunks" deliverables
# A fresh directory per invocation avoids silently reusing stale frames after
# source changes. Set RUN_ID explicitly only to resume the exact same sources.
run_id="${RUN_ID:-$(date -u +%Y%m%dT%H%M%SZ)}"
dir="$chunks/$run_id"
mkdir -p "$dir"
printf 'RUN_ID=%s\n' "$run_id"
list="$dir/concat.txt"
: > "$list"
for i in $(seq 0 14); do
  start=$((i*600)); end=$((start+599)); part=$(printf '%s/part-%02d.mp4' "$dir" "$i")
  # Existing parts are accepted only if they contain the exact frame count.
  if [[ -f "$part" ]]; then
    frames=$("$ffprobe" -v error -select_streams v:0 -count_frames -show_entries stream=nb_read_frames -of default=noprint_wrappers=1:nokey=1 "$part") || frames=0
    if [[ "$frames" != 600 ]]; then rm -f "$part"; fi
  fi
  if [[ ! -f "$part" ]]; then
    echo "Rendering $((i+1))/15: frames $start-$end"
    ./node_modules/.bin/remotion render src/index.jsx StoryBlocking "$part" --frames="$start-$end" --muted --props='{"resolutionScale":0.5}' --browser-executable=../.jalan-pulang-tools/chromium --concurrency=1 --gl=angle --chromium-flags='{"enable-unsafe-swiftshader":true,"use-angle":"swiftshader","ignore-gpu-blocklist":true,"disable-gpu-sandbox":true}' --scale=0.5
    frames=$("$ffprobe" -v error -select_streams v:0 -count_frames -show_entries stream=nb_read_frames -of default=noprint_wrappers=1:nokey=1 "$part")
    [[ "$frames" == 600 ]] || { echo "Invalid frame count $frames for $part" >&2; exit 1; }
  fi
  printf "file '%s'\n" "$part" >> "$list"
done
# Add VO once after video concatenation so segment boundaries cannot duplicate
# or omit samples. Output name explicitly says this is a blocking draft.
"$ffmpeg" -hide_banner -loglevel error -f concat -safe 0 -i "$list" -i public/vo/VO-Jalan-Pulang_01.mp3 -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -t 300 -y "$dir/combined.tmp.mp4"
frames=$("$ffprobe" -v error -select_streams v:0 -count_frames -show_entries stream=nb_read_frames -of default=noprint_wrappers=1:nokey=1 "$dir/combined.tmp.mp4")
[[ "$frames" == 9000 ]] || { echo "Invalid final frame count $frames" >&2; exit 1; }
cp "$dir/combined.tmp.mp4" deliverables/jalan-pulang-blocking-5-menit.mp4
echo "Draft assembled: deliverables/jalan-pulang-blocking-5-menit.mp4; requires QC."
