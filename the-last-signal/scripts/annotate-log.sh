#!/usr/bin/env bash
# Terjemahkan isi log menjadi anotasi GitHub.
#
# Kenapa ada: log job di GitHub Actions disimpan di blob storage yang tidak bisa
# dijangkau dari sandbox kerja, jadi `gh run view --log` selalu gagal di sana.
# Anotasi check-run tetap terbaca lewat API, jadi pesan galat asli dikirim
# sebagai anotasi agar bisa dibaca.
#
#   bash scripts/annotate-log.sh /tmp/render.log RENDER
set -uo pipefail

LOG="${1:?pakai: bash scripts/annotate-log.sh <berkas-log> [awalan]}"
PREFIX="${2:-LOG}"

if [ ! -f "$LOG" ]; then
  echo "::error::${PREFIX}:: berkas log $LOG tidak ada"
  exit 0
fi

emit() {
  # % dan baris kosong membuat anotasi rusak
  local line="${1//$'\r'/}"
  line="${line//%/%25}"
  [ -n "$line" ] && echo "::error::${PREFIX}:: $line"
}

# Kepala log: menunjukkan sejauh mana proses berjalan sebelum gagal.
head -6 "$LOG" | while IFS= read -r line; do emit "$line"; done

# Jendela di sekitar galat pertama — ini yang biasanya berisi pesan aslinya.
LINE="$(grep -n -i -m1 -E 'error|✖|cannot|unable|cannot|failed|not found|Exception|Cancelled' "$LOG" | cut -d: -f1)"
if [ -n "${LINE:-}" ]; then
  START=$((LINE > 2 ? LINE - 2 : 1))
  END=$((LINE + 8))
  sed -n "${START},${END}p" "$LOG" | while IFS= read -r line; do emit "$line"; done
else
  tail -8 "$LOG" | while IFS= read -r line; do emit "$line"; done
fi
