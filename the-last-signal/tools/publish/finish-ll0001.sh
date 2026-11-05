#!/usr/bin/env bash
# finish-ll0001.sh — selesaikan LL-0001 setelah render ulang selesai.
#
# Dipakai karena render ulang 9 menit (57 shot + atmosfer) memakan ±2 jam:
# skrip ini menunggu proses render mati, meng-encode delivery, menjalankan QC,
# dan hanya kalau QC lolos mengganti releases/LL-0001.mp4 lalu commit+push.
# Kalau QC gagal, berkas lama dibiarkan — slot unggah tetap punya video valid.
set -u
cd /home/user/Content-Creator/the-last-signal || exit 1
LOG=/tmp/finish-ll0001.log
log() { echo "$(date -u '+%H:%M:%S') $*" | tee -a "$LOG"; }

log "menunggu render ulang selesai"
while pgrep -f "scripts/render.ts --episode LL-0001" >/dev/null 2>&1; do sleep 60; done
sleep 20
log "render selesai; master: $(ls -la renders/LL-0001.mp4 | awk '{printf "%.0f MB", $5/1048576}')"

log "encode delivery (1,2M / crf 30)"
npx tsx scripts/encode-delivery.ts --episode LL-0001 --maxrate 1.2M --crf 30 --tp -3 --loudness -14 >>"$LOG" 2>&1
if [ ! -f renders/LL-0001-delivery.mp4 ]; then log "GAGAL: delivery tidak terbentuk"; exit 1; fi
log "delivery: $(ls -la renders/LL-0001-delivery.mp4 | awk '{printf "%.1f MB", $5/1048576}')"

log "QC"
if ! npx tsx scripts/qc.ts --episode LL-0001 >>"$LOG" 2>&1; then
  log "GAGAL: QC tidak lolos — release lama dipertahankan"
  exit 1
fi

cp renders/LL-0001-delivery.mp4 releases/LL-0001.mp4
log "release diganti: $(ls -la releases/LL-0001.mp4 | awk '{printf "%.1f MB", $5/1048576}')"

cd /home/user/Content-Creator || exit 1
git add the-last-signal/releases/LL-0001.mp4 the-last-signal/projects/episodes/LL-0001/reports the-last-signal/knowledge
git commit -q -m "render(LL-0001): 57 shot + atmosfer bergerak, QC lolos — release diganti" || log "tidak ada yang berubah"
git push -q origin arena/479de245-content-creator && log "push ok"
log "selesai"
