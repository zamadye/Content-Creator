#!/usr/bin/env bash
# build-all.sh — jalankan seluruh rantai bangun episode DALAM URUTAN YANG BENAR.
#
# Kenapa ada: urutannya tidak boleh ditukar, dan dua kali sudah salah:
#   1. `build-longform` menulis ulang episode.json dengan durasi TAKSIRAN
#      (kata / 2,2). Kalau `align-narration` tidak dijalankan sesudahnya,
#      subjudul dan potongan shot memakai durasi yang meleset beberapa persen.
#   2. `align-cuts` mengunci potongan ke posisi kata, jadi harus dijalankan
#      SETELAH `align-narration` (yang menetapkan awal/akhir narasi per scene),
#      bukan sebelumnya.
#
#   bash scripts/build-all.sh LL-0002
#   bash scripts/build-all.sh LL-0002 --climax 523
set -euo pipefail

EPISODE="${1:?pakai: bash scripts/build-all.sh <EPISODE_ID> [--climax <detik>]}"
shift || true
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

CLIMAX=""
while [ $# -gt 0 ]; do
  case "$1" in
    --climax) CLIMAX="$2"; shift 2 ;;
    *) echo "argumen tidak dikenal: $1" >&2; exit 1 ;;
  esac
done

STORY="stories/longform/$EPISODE"
if [ ! -d "$STORY" ]; then
  echo "✖ folder naskah $STORY tidak ada" >&2
  exit 1
fi

echo "== 1/6 naskah + peta visual -> plan.json"
node scripts/make-longform-plan.mjs --story "$STORY"
node scripts/make-image-prompts.mjs --story "$STORY" >/dev/null

echo "== 2/6 plan.json -> episode.json (durasi taksiran)"
node scripts/build-longform.mjs --plan "$STORY/plan.json" | head -3

echo "== 3/6 durasi dari audio terukur"
npx tsx scripts/align-narration.ts --episode "$EPISODE" --lead-in 4 --tail 8 | tail -4

echo "== 4/6 potongan shot dikunci ke posisi kata"
node scripts/align-cuts.mjs --episode "$EPISODE" | tail -3

echo "== 5/6 skor + overlay"
if [ -n "$CLIMAX" ]; then
  node scripts/make-score.mjs --episode "$EPISODE" --climax "$CLIMAX" | head -2
else
  node scripts/make-score.mjs --episode "$EPISODE" | head -2
fi
node scripts/make-ambience.mjs --episode "$EPISODE"
node scripts/make-overlays.mjs --episode "$EPISODE" >/dev/null

echo "== 6/6 validasi"
npx tsx scripts/validate-episode.ts --episode "$EPISODE" | tail -14
