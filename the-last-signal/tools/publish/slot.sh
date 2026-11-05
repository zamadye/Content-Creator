#!/usr/bin/env bash
# slot.sh — tahan berkas antrean berstatus "held" sampai jam tayangnya, lalu lepas.
#
# Workflow hanya mengunggah berkas berstatus "requested", jadi antrean boleh
# disiapkan berjam-jam lebih awal. Skrip ini yang menunggu, bukan manusia:
# ia tidur sampai jam yang diminta, mengubah status, lalu push satu berkas.
#
#   tools/publish/slot.sh \
#     --request the-last-signal/publish-queue/2026-11-05T13-12-LL-0001.json \
#     --at 2026-11-06T02:00:00Z
#
# Kalau proses ini mati (sandbox ditutup), jalankan ulang dengan --at yang sama:
# berkas yang sudah "requested"/"published" dilewati, tidak ada unggahan ganda.
set -u

REQUEST=""
AT=""
BRANCH="arena/479de245-content-creator"

while [ $# -gt 0 ]; do
  case "$1" in
    --request) REQUEST="${2:-}"; shift 2 ;;
    --at) AT="${2:-}"; shift 2 ;;
    --branch) BRANCH="${2:-}"; shift 2 ;;
    *) echo "argumen tidak dikenal: $1" >&2; exit 2 ;;
  esac
done

[ -n "$REQUEST" ] || { echo "--request wajib" >&2; exit 2; }
[ -n "$AT" ] || { echo "--at wajib (ISO UTC, mis. 2026-11-06T02:00:00Z)" >&2; exit 2; }

cd /home/user/Content-Creator || exit 1
[ -f "$REQUEST" ] || { echo "berkas antrean tidak ada: $REQUEST" >&2; exit 1; }

TARGET=$(date -u -d "$AT" +%s) || { echo "format --at tidak terbaca: $AT" >&2; exit 2; }
EPISODE=$(node -e "console.log(require('./' + process.argv[1]).episodeId)" "$REQUEST")
echo "slot $EPISODE pada $(date -u -d "@$TARGET") — sekarang $(date -u)"

while [ "$(date -u +%s)" -lt "$TARGET" ]; do
  sleep 60
done

STATUS=$(node -e "try{console.log(require('./' + process.argv[1]).status ?? '')}catch(e){console.log('')}" "$REQUEST")
if [ "$STATUS" != "held" ]; then
  echo "status sekarang \"$STATUS\" — tidak ada yang perlu dilepas"
  exit 0
fi

echo "waktunya. melepas $EPISODE ke requested"
git pull --rebase -q origin "$BRANCH" || true
node -e '
const fs = require("fs");
const [file, id] = process.argv.slice(1);
const r = JSON.parse(fs.readFileSync(file, "utf8"));
r.status = "requested";
r.createdAt = new Date().toISOString().replace(/\.\d{3}Z$/, ".000Z");
delete r.holdReason;
fs.writeFileSync(file, JSON.stringify(r, null, 2) + "\n");
console.log(`${id}: status -> requested pada ${r.createdAt}`);
' "$REQUEST" "$EPISODE"

git add "$REQUEST"
git commit -q -m "terbit($EPISODE): slot $(date -u -d "@$TARGET" '+%H.%M UTC') — antrean dilepas" || {
  echo "tidak ada yang berubah, dilewati"; exit 0;
}
git push -q origin "$BRANCH" && echo "push ok — workflow akan QC lalu mengunggah"
