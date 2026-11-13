// Documentary comparison only: never treats a guide row as a completed edit.
import fs from 'node:fs';
const shots=JSON.parse(fs.readFileSync('data/guide-72-shots.json','utf8'));
const coverage={
 1:['00:00–00:49','Perjalanan, gudang/telepon rig serta insert jam, pabrik dan transfer','foto ayah dan rumah ibu belum dibuat; prop serta timing perlu QC'],
 2:['00:49–01:11','Halaman kos, keberangkatan, tas pada rak dan perjalanan 3D','kontak tubuh, tekstur tas dan model motor masih perlu QC'],
 3:['01:11–01:41','Kemacetan, petugas mendekat dan menunjuk, Dimas duduk di motor serta kamera berganti','lip sync, pakaian petugas, kendaraan low-poly dan kontak masih perlu QC'],
 4:['01:41–02:25','Jalan dan vegetasi bergerak dengan sudut lebar/POV/samping, motor dan papan 12 km','vegetasi karet autentik, instrumen, genggaman dan reaksi detail masih perlu QC'],
 5:['02:25–03:47','Warung, papan berulang, jalan melengkung dan ponsel 3D; kamera tangan/setang','aksi merogoh ponsel, genggaman dan transisi motor masih perlu QC'],
 6:['03:47–04:27','Warung menyala dan sosok duduk','lintasan motor, senandung dan close-up telinga belum final'],
 7:['04:27–05:45','Papan basah, wajah dan sosok berdiri dengan beberapa framing','mulut, akting serta tangan pada setang belum final'],
 8:['05:45–06:23','Rem/turun motor dan panggilan 3D','kontak, UI sinyal dan sinkronisasi perlu dibenahi'],
 9:['06:23–07:15','Panggilan, kamera berganti dan kilas balik ayah di motor serta kamar','reaksi dan pose ayah masih kasar'],
 10:['07:15–08:18','Spion render target dan lengan bayangan','montase penyebab dan kontak tubuh perlu dibuat ulang'],
 11:['08:18–09:03.633','Panggilan dan fade sosok','akting salam, napas dan ekspresi perlu dibenahi'],
 12:['VO02 00:00–00:49','Sosok padam, naik motor, papan 3 km dan desa','kontinuitas helm, kontak dan respons emosi perlu QC'],
 13:['VO02 00:49–02:05','Rumah, ketukan, dialog dan bayangan','ibu hanya tersirat, ekspresi, bayangan dan Foley perlu QC'],
 14:['VO02 02:05–02:16.3','Rumah dan fade judul','jalan kosong, dua bayangan serta penutup perlu QC']
};
let out='# Audit 14 adegan / 72 shot panduan Jalan Pulang\n\n';
out+='Sumber lengkap: `PANDUAN-ANIMASI-ORIGINAL.md`, disalin dari Drive. **Waktu sumber adalah rancangan berbeda hingga 13:25, bukan timestamp kedua VO aktual** (gabungan sekitar 11:19,9). Rentang adaptasi per adegan di bawah adalah perkiraan berdasarkan transkrip, bukan sinkronisasi yang sudah didengar. Baris adalah referensi kerja, **bukan bukti bahwa 72 shot final sudah dirender**. Pengganti gambar/foto diinterpretasikan sebagai 3D bergerak; kabut ditiadakan sesuai arahan terbaru.\n\n';
for(let n=1;n<=14;n++){
 const group=shots.filter(s=>s.scene===n),[time,built,missing]=coverage[n];
 out+=`## ${n}. ${group[0].sceneTitle}\n\nAcuan VO: ${time}. Ada: ${built}. Masih perlu: ${missing}. Status semua baris: **belum diverifikasi shot per shot**.\n\n`;
 out+='| Shot | Waktu panduan asli | Rincian panduan asli |\n|---|---|---|\n';
 for(const s of group) out+=`| ${s.id} | ${s.originalStart}–${s.originalEnd} | ${s.description.replaceAll('|',' / ')} |\n`;
 out+='\n';
}
fs.writeFileSync('AUDIT-14-ADEGAN-72-SHOT.md',out);
