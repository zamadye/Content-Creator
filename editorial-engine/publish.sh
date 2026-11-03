#!/usr/bin/env bash
# ============================================================================
#  publish.sh — satu perintah: video + caption + komentar pertama -> Buffer
# ----------------------------------------------------------------------------
#  Contoh:
#     ./publish.sh pinjol-bunga-harian-2026              # validasi saja (aman)
#     ./publish.sh pinjol-bunga-harian-2026 --send       # benar-benar mengirim
#     ./publish.sh pinjol-bunga-harian-2026 --send --platforms instagram,tiktok
#     MODE=shareNow ./publish.sh pinjol-bunga-harian-2026 --send
#
#  Kunci API dibaca dari environment atau dari berkas .env di folder ini
#  (jangan pernah commit .env — sudah masuk .gitignore).
# ============================================================================
set -uo pipefail
cd "$(dirname "$0")" || exit 1

MISSION="${1:-}"
if [ -z "$MISSION" ] || [[ "$MISSION" == --* ]]; then
  echo "pakai: ./publish.sh <mission> [--send] [--platforms a,b,c]"
  echo "mis. : ./publish.sh pinjol-bunga-harian-2026"
  exit 2
fi
shift

# --- .env (opsional) -------------------------------------------------------
if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

# --- prasyarat -------------------------------------------------------------
fail=0
command -v node >/dev/null 2>&1   || { echo "✗ node tidak ada (butuh Node 20+)"; fail=1; }
command -v buffer >/dev/null 2>&1 || { echo "✗ CLI buffer tidak ada. Jalankan: npm i -g @bufferapp/cli"; fail=1; }
[ -n "${BUFFER_API_KEY:-}" ]      || { echo "✗ BUFFER_API_KEY belum diset (taruh di .env atau export)"; fail=1; }
if [ "${MEDIA_PROVIDER:-release}" = "release" ] && [[ " $* " == *" --send "* ]]; then
  command -v gh >/dev/null 2>&1 || { echo "✗ gh (GitHub CLI) tidak ada — dibutuhkan untuk mengunggah aset rilis"; fail=1; }
fi
[ "$fail" -eq 0 ] || exit 1

# --- jalankan --------------------------------------------------------------
exec node pipeline/publish-buffer.mjs --mission "$MISSION" "$@"
