#!/usr/bin/env bash
# Linux x86_64 / WSL2. Offline assets required; render is WIP, not final film.
set -euo pipefail
cd "$(dirname "$0")/.."
mode=gpu; seconds=300; concurrency=1; scale=0.5; browser="${CHROME_PATH:-}"; check_only=0; smoke=0
usage() { cat <<'HELP'
Usage: bash scripts/render-local.sh [--check|--smoke] [--mode gpu|software]
       [--browser /path/to/chromium] [--seconds 1..339]
       [--scale 0.25..1] [--concurrency positive_integer]
Default: GPU (ANGLE EGL), 300 seconds, 960x540, 30 fps, concurrency 1.
--check checks dependencies/assets only; --smoke renders one second with VO.
Full film is NOT yet available: this only renders the existing rough blocking.
HELP
}
while (($#)); do
 case "$1" in
  --check) check_only=1; shift;; --smoke) smoke=1; shift;; --mode) mode="${2:?Missing mode}";shift 2;;
  --browser) browser="${2:?Missing browser path}";shift 2;; --seconds) seconds="${2:?Missing seconds}";shift 2;;
  --concurrency) concurrency="${2:?Missing concurrency}";shift 2;; --scale) scale="${2:?Missing scale}";shift 2;;
  -h|--help) usage;exit 0;; *) echo "Unknown option: $1" >&2;usage;exit 2;;
 esac
done
[[ "$(uname -s)" == Linux && "$(uname -m)" == x86_64 ]] || { echo 'Supported workflow: Linux x86_64 or Windows WSL2 x86_64. macOS/native Windows not tested.' >&2; exit 1; }
[[ "$mode" == gpu || "$mode" == software ]] || { echo 'Mode must be gpu or software' >&2;exit 2; }
[[ "$seconds" =~ ^[0-9]+$ && "$seconds" -ge 1 && "$seconds" -le 339 ]] || { echo 'Seconds must be 1..339' >&2;exit 2; }
[[ "$concurrency" =~ ^[1-9][0-9]*$ ]] || { echo 'Concurrency must be a positive integer' >&2;exit 2; }
[[ "$scale" =~ ^(0\.[0-9]+|1|1\.0+)$ ]] && awk "BEGIN {exit !($scale>=0.25 && $scale<=1)}" || { echo 'Scale must be 0.25..1' >&2;exit 2; }
for command in node npm tar sha256sum awk; do command -v "$command" >/dev/null || { echo "Missing required command: $command" >&2;exit 1; };done
node -e 'if(+process.versions.node.split(".")[0]<22){console.error("Node.js 22 or later required");process.exit(1)}'
missing=0
for asset in 'vo/VO-Jalan-Pulang_01.mp3' 'kenney-nature/plant_bush.glb' 'makehuman/entity-head.obj' 'makehuman/rigged-body.json' 'garments/namuhekam_male_polo_shirt.json' 'garments/namuhekam_male_polo_shirt.jpg' 'garments/cortu_cargo_pants.json' 'garments/cortu_cargo_pants.webp' 'garments/shoes01.json' 'garments/shoes01.jpg' 'nature-cc0/tree.glb' 'nature-cc0/fern.glb' 'pbr/metal_rusty_paint_Color.png' 'pbr/metal_rusty_paint_NormalGL.jpg' 'pbr/metal_rusty_paint_Roughness.jpg' 'pbr/metal_rusty_paint_Metalness.jpg' 'pbr/street_asphalt_Color.png' 'pbr/street_asphalt_NormalGL.jpg' 'pbr/street_asphalt_Roughness.jpg' 'pbr/wood_planks_diffuse.jpg' 'pbr/wood_planks_normal.jpg' 'pbr/wood_planks_rough.jpg' 'pbr/wall_plaster_dirty_Color.png' 'pbr/wall_plaster_dirty_NormalGL.jpg' 'pbr/wall_plaster_dirty_Roughness.jpg' 'pbr/sidewalk_concrete_Color.png' 'pbr/sidewalk_concrete_NormalGL.jpg' 'pbr/sidewalk_concrete_Roughness.jpg' 'models/wooden_table_02/wooden_table_02_1k.gltf' 'models/wooden_table_02/wooden_table_02.bin' 'models/wooden_table_02/textures/wooden_table_02_arm_1k.jpg' 'models/wooden_table_02/textures/wooden_table_02_diff_1k.jpg' 'models/wooden_table_02/textures/wooden_table_02_nor_gl_1k.jpg' 'models/steel_frame_shelves_01/steel_frame_shelves_01_1k.gltf' 'models/steel_frame_shelves_01/steel_frame_shelves_01.bin' 'models/steel_frame_shelves_01/textures/steel_frame_shelves_01_arm_1k.jpg' 'models/steel_frame_shelves_01/textures/steel_frame_shelves_01_diff_1k.jpg' 'models/steel_frame_shelves_01/textures/steel_frame_shelves_01_nor_gl_1k.jpg'; do
 [[ -s "public/$asset" ]] || { echo "Missing: public/$asset" >&2;missing=1; }
done
if ((missing)); then echo 'VO is excluded from Git: download VO-Jalan-Pulang_01.mp3 from Drive and place it at the path above. Restore any other missing assets from the branch.' >&2;exit 1;fi
if [[ ! -x node_modules/.bin/remotion ]]; then echo 'Installing exact npm dependencies via npm ci...';npm ci;fi
ffmpeg="$PWD/node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg"
ffprobe="$PWD/node_modules/@remotion/compositor-linux-x64-gnu/ffprobe"
[[ -x "$ffmpeg" && -x "$ffprobe" ]] || { echo 'Remotion ffmpeg/ffprobe missing; run npm ci again.' >&2;exit 1; }
if [[ -z "$browser" ]]; then
 for candidate in google-chrome google-chrome-stable chromium chromium-browser; do if command -v "$candidate" >/dev/null;then browser="$(command -v "$candidate")";break;fi;done
fi
if [[ -z "$browser" ]]; then
 echo 'System Chrome not found; manually extracting @sparticuz/chromium...'
 npm run extract:chromium
 browser="$PWD/../.jalan-pulang-tools/chromium"
 export LD_LIBRARY_PATH="$PWD/../.jalan-pulang-tools/al2023/lib${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
 if [[ "$mode" == software ]];then export LD_LIBRARY_PATH="$PWD/../.jalan-pulang-tools/swiftshader:$LD_LIBRARY_PATH";fi
fi
[[ -x "$browser" ]] || { echo "Browser is not executable: $browser" >&2;exit 1; }
"$browser" --version || { echo 'Browser could not start; install missing system libraries or use --browser.' >&2;exit 1; }
"$ffprobe" -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 public/vo/VO-Jalan-Pulang_01.mp3 | awk -v s="$seconds" '{if ($1 < s) {print "VO is shorter than render duration" > "/dev/stderr";exit 1}}'
echo "Mode=$mode browser=$browser output=$(awk "BEGIN{print 1920*$scale\"x\"1080*$scale}") 30fps seconds=$seconds concurrency=$concurrency"
echo 'Warning: GPU availability/acceleration and visual quality are not guaranteed by preflight.'
if ((check_only));then echo 'Preflight passed. Run --smoke next to test WebGL rendering.';exit 0;fi
mkdir -p render/local deliverables
flags=(--browser-executable="$browser" --concurrency="$concurrency" --scale="$scale" --props="{\"resolutionScale\":$scale}")
if [[ "$mode" == gpu ]];then flags+=(--gl=angle-egl);else flags+=(--gl=angle --chromium-flags='{"enable-unsafe-swiftshader":true,"use-angle":"swiftshader","ignore-gpu-blocklist":true,"disable-gpu-sandbox":true}');fi
remotion=./node_modules/.bin/remotion
if ((smoke));then
 "$remotion" render src/index.jsx StoryBlocking render/local/smoke.mp4 --frames=0-29 "${flags[@]}"
 echo 'Smoke test: render/local/smoke.mp4. Verify visual output and audio; a successful render does not prove GPU acceleration.';exit 0
fi
# Content-addressed cache: refuse to reuse stale chunks after changes in sources,
# assets, audio, browser or settings. Deleting render/local is always safe.
fingerprint=$( (find src public -type f -print0 | sort -z | xargs -0 sha256sum; sha256sum package-lock.json "$browser"; printf '%s\n' "$mode $seconds $concurrency $scale" ) | sha256sum | cut -d' ' -f1)
dir="render/local/$fingerprint";mkdir -p "$dir";list="$dir/concat.txt";: > "$list"
total=$((seconds*30));step=600; index=0
for ((start=0;start<total;start+=step));do
 end=$((start+step-1));(( end>=total )) && end=$((total-1))
 expected=$((end-start+1));part=$(printf '%s/part-%03d.mp4' "$dir" "$index")
 if [[ -f "$part" ]];then
  frames=$("$ffprobe" -v error -select_streams v:0 -count_frames -show_entries stream=nb_read_frames -of default=noprint_wrappers=1:nokey=1 "$part" 2>/dev/null || true)
  [[ "$frames" == "$expected" ]] || rm -f "$part"
 fi
 if [[ ! -f "$part" ]];then
  echo "Rendering frames $start-$end / $((total-1))"
  "$remotion" render src/index.jsx StoryBlocking "$part" --frames="$start-$end" --muted "${flags[@]}"
  frames=$("$ffprobe" -v error -select_streams v:0 -count_frames -show_entries stream=nb_read_frames -of default=noprint_wrappers=1:nokey=1 "$part")
  [[ "$frames" == "$expected" ]] || { echo 'Invalid chunk frame count.' >&2;exit 1; }
 fi
 printf "file '%s/%s'\n" "$PWD" "$part" >> "$list"
 index=$((index+1))
done
"$ffmpeg" -hide_banner -loglevel error -f concat -safe 0 -i "$list" -i public/vo/VO-Jalan-Pulang_01.mp3 -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -t "$seconds" -y "$dir/combined.mp4"
frames=$("$ffprobe" -v error -select_streams v:0 -count_frames -show_entries stream=nb_read_frames -of default=noprint_wrappers=1:nokey=1 "$dir/combined.mp4")
[[ "$frames" == "$total" ]] || { echo 'Invalid assembled frame count' >&2;exit 1; }
out="deliverables/jalan-pulang-blocking-${seconds}s.mp4";cp "$dir/combined.mp4" "$out"
echo "Done: $out (draft only; inspect video and audio before use)."
