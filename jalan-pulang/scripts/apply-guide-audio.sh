#!/usr/bin/env bash
# Run only after render-five-minutes.sh has finished and the draft has been QC'd.
set -euo pipefail
cd "$(dirname "$0")/.."
export LD_LIBRARY_PATH="$PWD/../.jalan-pulang-tools/al2023/lib:$PWD/../.jalan-pulang-tools/swiftshader${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
ffmpeg="$PWD/node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg"
ffprobe="$PWD/node_modules/@remotion/compositor-linux-x64-gnu/ffprobe"
video="deliverables/jalan-pulang-blocking-5-menit.mp4"
audio="render/vo-ambience-guide-5min.m4a"
test -s "$video" && test -s "$audio" || { echo 'Missing five-minute video or guide audio' >&2; exit 1; }
"$ffmpeg" -hide_banner -loglevel error -i "$video" -i "$audio" -map 0:v:0 -map 1:a:0 -c copy -t 300 -y render/five-minute-guide-audio.tmp.mp4
frames=$("$ffprobe" -v error -select_streams v:0 -count_frames -show_entries stream=nb_read_frames -of default=noprint_wrappers=1:nokey=1 render/five-minute-guide-audio.tmp.mp4)
[[ "$frames" == 9000 ]] || { echo "Wrong frame count: $frames" >&2; exit 1; }
cp render/five-minute-guide-audio.tmp.mp4 deliverables/jalan-pulang-blocking-5-menit-audio-guide.mp4
echo 'Draft with guide audio ready for listening and visual QC.'
