#!/usr/bin/env bash
# Revised 24-scene master; the v3 archive supplies source media only.
set -Eeuo pipefail
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PIPELINE="$ROOT/editorial-engine/pipeline/gibran-mundur-2026/openfilm-master"
OUT_DIR="$ROOT/editorial-engine/deliverables/gibran-mundur-2026"
PROJECT="${OPENFILM_PROJECT_DIR:-$OUT_DIR/openfilm-master-v6-hook}"
WORKERS="${OPENFILM_WORKERS:-1}"
MODE="${1:---render}"
fail(){ printf '\nERROR: %s\n' "$*" >&2; exit 1; }
if [[ "$MODE" == '--help' ]]; then
  printf '%s\n' 'Usage: bash scripts/render-gibran-openfilm.sh [--prepare|--open|--render]'
  printf '%s\n' '--prepare: build the revised master without rendering.' '--open: open it in Studio.' '--render (default): full MP4 and frame QA.'
  exit 0
fi
[[ "$MODE" == '--prepare' || "$MODE" == '--open' || "$MODE" == '--render' ]] || fail "Unknown mode: $MODE"
command -v node >/dev/null || fail 'Node.js 22.18+ belum terpasang.'
command -v python3 >/dev/null || fail 'Python 3 belum terpasang.'
node -e 'const [a,b]=process.versions.node.split(".").map(Number);if(a<22||(a===22&&b<18))process.exit(1)' || fail 'Perlu Node.js 22.18+.'
[[ "$WORKERS" =~ ^[1-9][0-9]*$ ]] || fail 'OPENFILM_WORKERS harus angka bulat positif.'
# A render must not overwrite Studio edits or restore the obsolete v3 HTML.
if [[ "$MODE" == '--prepare' || ! -s "$PROJECT/film.html" ]]; then
  python3 "$PIPELINE/build.py" --out "$PROJECT"
fi
[[ -s "$PROJECT/build-manifest.json" ]] || fail 'Project perlu build-manifest.json dari builder master revisi.'
[[ -s "$PROJECT/assets/vo.mp3" ]] || fail 'VO asli tidak ditemukan.'
[[ "$MODE" != '--prepare' ]] || exit 0
export OPENFILM_BROWSER_CHANNEL="${OPENFILM_BROWSER_CHANNEL:-chrome}"
export OPENFILM_HEADED="${OPENFILM_HEADED:-1}"
CHROME_HOOK="$(node -e 'console.log(require("node:url").pathToFileURL(process.argv[1]).href)' "$SCRIPT_DIR/openfilm-local-chrome.mjs")"
export NODE_OPTIONS="${NODE_OPTIONS:+$NODE_OPTIONS }--import=$CHROME_HOOK"
if [[ -z "${OPENFILM_TOOL_BIN:-}" && -d "$ROOT/.scratch/openfilm/bin" ]]; then OPENFILM_TOOL_BIN="$ROOT/.scratch/openfilm/bin"; fi
if [[ -n "${OPENFILM_TOOL_BIN:-}" ]]; then export PATH="$OPENFILM_TOOL_BIN:$PATH"; fi
if [[ -z "${OPENFILM_CLI:-}" && -f "$ROOT/.scratch/openfilm/runtime/node_modules/openfilm/bin/openfilm.mjs" ]]; then
  OPENFILM_CLI="$ROOT/.scratch/openfilm/runtime/node_modules/openfilm/bin/openfilm.mjs"
fi
run_openfilm(){
  if [[ -n "${OPENFILM_CLI:-}" ]]; then node "$OPENFILM_CLI" "$@";
  else npx --yes openfilm@0.3.2 "$@"; fi
}
if [[ "$MODE" == '--open' ]]; then
  cd "$PROJECT"
  run_openfilm open .
  exit 0
fi
command -v ffmpeg >/dev/null || fail 'FFmpeg belum ada di PATH; atur OPENFILM_TOOL_BIN jika memakai versi portabel.'
command -v ffprobe >/dev/null || fail 'FFprobe belum ada di PATH.'
ffmpeg -hide_banner -loglevel error -f lavfi -i 'anullsrc=r=48000:cl=mono' -af 'adelay=0:all=1' -t 0.02 -f null - >/dev/null 2>&1 || fail 'FFmpeg tidak mendukung filter yang diperlukan.'
python3 "$PIPELINE/preflight.py" "$PROJECT"
MASTER_VERSION="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["version"])' "$PROJECT/build-manifest.json")"
OUTPUT="${OPENFILM_OUTPUT:-$OUT_DIR/gibran-mundur-master-v$MASTER_VERSION-$(date +%Y%m%d-%H%M%S).mp4}"
printf '\nProject: %s\nBrowser: %s · GUI: %s\nWorkers: %s\n' "$PROJECT" "$OPENFILM_BROWSER_CHANNEL" "$OPENFILM_HEADED" "$WORKERS"
cd "$PROJECT"
run_openfilm render --workers "$WORKERS" --fps 30 --loudness=-16 --out "$OUTPUT"
run_openfilm look "$OUTPUT" --full --loudness=-16
printf '\nRender selesai: %s\n' "$OUTPUT"
printf 'QA frame tidak menggantikan pemeriksaan editorial dan sinkronisasi ucapan.\n'
