#!/usr/bin/env bash
# One-command local OpenFilm setup/render for the 24-scene Gibran Mundur project.
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
if ROOT_FROM_GIT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel 2>/dev/null)"; then
  ROOT="$ROOT_FROM_GIT"
else
  ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
fi
ZIP_DEFAULT="$ROOT/gibran-mundur-openfilm-full-project-v3.zip"
ZIP_PATH="${OPENFILM_PROJECT_ZIP:-$ZIP_DEFAULT}"
PROJECT="$ROOT/editorial-engine/deliverables/gibran-mundur-2026/openfilm-full"
OUT_DIR="$ROOT/editorial-engine/deliverables/gibran-mundur-2026"
WORKERS="${OPENFILM_WORKERS:-2}"

fail(){ printf '\nERROR: %s\n' "$*" >&2; exit 1; }

if [[ ! -f "$ZIP_PATH" ]]; then
  cat >&2 <<EOF
Project ZIP belum ditemukan.

1. Unduh ZIP OpenFilm dari Google Drive:
   https://drive.google.com/file/d/1tmqfI5LlNRVFYZ6FFe41ZL5KzkGI99CO/view?usp=drivesdk
2. Simpan tanpa diekstrak sebagai:
   $ZIP_DEFAULT
3. Jalankan lagi: bash scripts/render-gibran-openfilm.sh

VO asli (vo.mp3) dan footage pembuka SC01 sudah ada DI DALAM ZIP; tidak perlu menaruhnya terpisah.
EOF
  exit 2
fi

command -v node >/dev/null 2>&1 || fail 'Node.js 22.18+ belum terpasang.'
node -e 'const [a,b]=process.versions.node.split(".").map(Number); if(a<22||(a===22&&b<18)){console.error(`Perlu Node >=22.18; ditemukan ${process.versions.node}`);process.exit(1)}' || exit 2
command -v ffmpeg >/dev/null 2>&1 || fail 'FFmpeg belum ada di PATH. Pasang FFmpeg, buka terminal baru, lalu jalankan ulang script.'
command -v ffprobe >/dev/null 2>&1 || fail 'FFprobe belum ada di PATH (biasanya ikut paket FFmpeg).'
command -v unzip >/dev/null 2>&1 || fail 'Perintah unzip tidak ditemukan.'
[[ "$WORKERS" =~ ^[1-9][0-9]*$ ]] || fail 'OPENFILM_WORKERS harus berupa angka bulat positif.'

# OpenFilm's audio timeline uses the `all` option of adelay; reject old FFmpeg before a long render.
if ! ffmpeg -hide_banner -loglevel error -f lavfi -i 'anullsrc=r=48000:cl=mono' -af 'adelay=0:all=1' -t 0.02 -f null - >/dev/null 2>&1; then
  fail 'FFmpeg terlalu lama atau tidak mendukung adelay=all. Pasang FFmpeg modern (6+) lalu coba lagi.'
fi
unzip -tq "$ZIP_PATH" >/dev/null || fail 'ZIP rusak atau tidak bisa dibaca.'

STAGE="$(mktemp -d "${TMPDIR:-/tmp}/gibran-openfilm.XXXXXX")"
trap 'rm -rf "$STAGE"' EXIT
unzip -q "$ZIP_PATH" -d "$STAGE/project"
SRC="$STAGE/project"
[[ -s "$SRC/film.html" ]] || fail 'film.html tidak ada pada root ZIP; unduh ZIP OpenFilm project v3.'
[[ -s "$SRC/assets/vo.mp3" ]] || fail 'VO assets/vo.mp3 tidak ada pada ZIP.'
[[ -s "$SRC/assets/SC01.mp4" ]] || fail 'Footage pembuka assets/SC01.mp4 tidak ada pada ZIP.'
PAGE_COUNT="$(find "$SRC" -maxdepth 1 -type f -name 'scene-[0-9][0-9].html' | wc -l | tr -d ' ')"
[[ "$PAGE_COUNT" == 24 ]] || fail "ZIP perlu memiliki 24 halaman scene; ditemukan $PAGE_COUNT."

mkdir -p "$PROJECT" "$OUT_DIR"
# Install/update only project files from the archive; preserve OpenFilm's .film cache/history.
cp -R "$SRC/." "$PROJECT/"
OUTPUT="$OUT_DIR/gibran-mundur-openfilm-full-$(date +%Y%m%d-%H%M%S).mp4"

printf '\nProject: %s\nScenes: 24 · 1920×1080 · 30 fps · 7:15\nWorkers: %s\n' "$PROJECT" "$WORKERS"
printf 'First run may download OpenFilm and its Chromium browser (~100 MB). Keep this terminal open.\n\n'
(
  cd "$PROJECT"
  npx --yes openfilm@0.3.2 render --workers "$WORKERS" --loudness=-16 --out "$OUTPUT"
  npx --yes openfilm@0.3.2 look "$OUTPUT" --full --loudness=-16
)

printf '\nRender selesai dan lolos pemeriksaan OpenFilm.\nFile: %s\n' "$OUTPUT"
printf 'Catatan: source VO tetap, tetapi timing scene/caption dan footage publik masih perlu editorial QA.\n'
