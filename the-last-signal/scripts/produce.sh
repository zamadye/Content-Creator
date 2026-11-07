#!/usr/bin/env bash
# produce.sh — bangun, render, encode, dan QC satu episode sampai berkas rilis.
#
# Kenapa satu skrip: sandbox hanya hidup satu giliran, jadi render 18.000 frame
# dan encode harus jalan tanpa henti di sesi yang sama. Kalau salah satu langkah
# salah parameter, waktu render terbuang (render LL-0002 ± beberapa jam).
#
# Parameter encode diambil dari stories/longform/<ID>/catatan-encode.md:
# batas 40 MB untuk 598 detik = 548 kbps total, jadi video ±452 kbps.
#
#   bash scripts/produce.sh LL-0002
#   bash scripts/produce.sh LL-0002 --skip-render   # ulangi encode+QC saja
set -euo pipefail

EPISODE="${1:?pakai: bash scripts/produce.sh <EPISODE_ID>}"
shift || true
SKIP_RENDER=0
[ "${1:-}" = "--skip-render" ] && SKIP_RENDER=1

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "== lingkungan"
eval "$(bash scripts/bootstrap.sh --env)"

echo "== bangun (naskah -> episode -> alignment -> skor)"
if [ "$SKIP_RENDER" -eq 0 ]; then
  bash scripts/build-all.sh "$EPISODE" --climax "${CLIMAX:-523}" | tail -12
fi

mkdir -p renders

if [ "$SKIP_RENDER" -eq 0 ]; then
  echo "== render master"
  echo "   mulai: $(date -u +%H:%M:%SZ)"
  # crf 20 untuk master (bahan encode), bukan untuk diunggah.
  npx tsx scripts/render.ts --episode "$EPISODE" --crf 20 --concurrency 2
  echo "   selesai: $(date -u +%H:%M:%SZ)"
  ls -la "renders/$EPISODE.mp4"
fi

echo "== encode delivery (target < 40 MB)"
# Master crf 20 untuk 10 menit bisa 300 MB; di sini yang penting ukuran akhir.
npx tsx scripts/encode-delivery.ts --episode "$EPISODE" --crf 27 --maxrate 520k --loudness -14 --tp -3

echo "== QC"
npx tsx scripts/qc.ts --episode "$EPISODE" || echo "   (QC gagal — jangan diunggah sebelum dibereskan)"
