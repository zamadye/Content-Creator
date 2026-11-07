#!/usr/bin/env bash
# bootstrap.sh — siapkan lingkungan render dari nol dalam satu perintah.
#
# Kenapa ada: sandbox Arena hanya mempertahankan berkas yang dilacak git.
# `node_modules/`, `/tmp/`, dan berkas yang di-.gitignore HILANG setiap sesi
# baru. Dua akibat yang sudah menimpa pekerjaan LL-0002:
#   1. 37 gambar yang di-ignore lenyap (sekarang gambar masuk git sebagai .jpg);
#   2. ffmpeg dan chromium di /tmp hilang, jadi render tidak bisa dijalankan.
#
# Karena host yang boleh diakses hanya registry.npmjs.org (plus github.com),
# ffmpeg dan chromium TIDAK boleh diunduh lewat postinstall yang mengambil dari
# CDN lain (ffmpeg-static gagal: release-assets.githubusercontent.com diblok).
# Yang dipakai adalah paket npm yang membawa binary DI DALAM tarball:
#   @ffmpeg-installer/ffmpeg  -> ffmpeg statis (alimiter, ebur128, loudnorm)
#   @sparticuz/chromium       -> chromium untuk Remotion
#
#   bash scripts/bootstrap.sh          # siapkan + cetak env
#   source <(bash scripts/bootstrap.sh --env)   # ekspor langsung ke shell
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [ ! -d node_modules ] || [ ! -x node_modules/.bin/tsx ]; then
  echo "→ pasang dependensi (TLS longgar hanya untuk sandbox ini)" >&2
  command -v pnpm >/dev/null 2>&1 || npm i -g pnpm@9 --silent
  NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm install --no-frozen-lockfile --silent
fi

FFMPEG="$(node -e "process.stdout.write(require('@ffmpeg-installer/ffmpeg').path)")"
BROWSER="$(node -e "require('@sparticuz/chromium').executablePath().then(p=>process.stdout.write(p))")"

if [ ! -x "$FFMPEG" ]; then
  echo "✖ ffmpeg tidak ditemukan di $FFMPEG" >&2
  exit 1
fi
if [ ! -x "$BROWSER" ]; then
  echo "✖ chromium tidak ditemukan di $BROWSER" >&2
  exit 1
fi

if [ "${1:-}" = "--env" ]; then
  echo "export FFMPEG_PATH='$FFMPEG'"
  echo "export REMOTION_BROWSER_EXECUTABLE='$BROWSER'"
  echo "export LD_LIBRARY_PATH='/tmp:${LD_LIBRARY_PATH:-}'"
else
  echo "✔ lingkungan siap"
  echo "  ffmpeg  : $FFMPEG"
  echo "  browser : $BROWSER"
  echo
  echo "  pakai:  export FFMPEG_PATH='$FFMPEG'"
  echo "          export REMOTION_BROWSER_EXECUTABLE='$BROWSER'"
fi
