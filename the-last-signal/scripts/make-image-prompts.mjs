#!/usr/bin/env node
/**
 * make-image-prompts.mjs — daftar prompt gambar per berkas di kolam gambar.
 *
 * Kenapa: `plan.json` menyebut berkas gambar (mis. `images/beringin.png`) dipakai
 * beberapa shot. Yang perlu dibuat model gambar adalah BERKAS-nya, bukan
 * shot-nya: satu prompt per berkas, digabung dari shot pertama yang memakainya.
 *
 * Acuan watak tokoh/entitas diambil apa adanya dari `assets/characters/characters.json`
 * (ATURAN 3.1: identitas tetap, tidak didesain ulang per episode).
 *
 *   node scripts/make-image-prompts.mjs --story stories/longform/LL-0002
 *   node scripts/make-image-prompts.mjs --story stories/longform/LL-0002 --prioritas
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const arg = (name, fallback = null) => {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : fallback;
};

const storyDir = resolve(ROOT, arg("story", "stories/longform/LL-0002"));
const onlyPriority = process.argv.includes("--prioritas");
const plan = JSON.parse(readFileSync(join(storyDir, "plan.json"), "utf8"));
const karakter = JSON.parse(readFileSync(join(ROOT, "assets/characters/characters.json"), "utf8"));

const core = Object.fromEntries(karakter.characters.map((c) => [c.id, c]));

const GAYA =
  "cinematic 16:9 film still, Indonesian rural setting, natural light only, 35mm film grain, muted earthy palette, documentary realism, no text, no watermark, no captions";

/** Berkas yang wajib dibuat lebih dulu: pembuka segmen, entitas, dokumen kunci. */
const PRIORITAS = /pembuka|entitas|buku-c|surat-ukur|berita-acara|patok|makam|mang-karta|protagonis/;

const daftar = new Map();

for (const seg of plan.segments) {
  for (const shot of seg.shots) {
    const berkas = basename(shot.image, ".png");
    if (!daftar.has(berkas)) {
      daftar.set(berkas, {
        berkas: shot.image,
        segmen: seg.id,
        jumlah_shot: 0,
        shot: [],
        isi: shot.prompt,
        entitas: shot.entitas,
        cahaya: seg.lighting,
      });
    }
    const item = daftar.get(berkas);
    item.jumlah_shot += 1;
    item.shot.push(shot.pemicu);
    if (!item.entitas && shot.entitas) item.entitas = shot.entitas;
  }
}

const hasil = [];
for (const item of daftar.values()) {
  const bagian = [GAYA, item.isi];
  let referensi = null;

  if (item.entitas) {
    bagian.push(core["entitas-penunggu"].promptCore);
    bagian.push(core["entitas-penunggu"].negatif);
    referensi = core["entitas-penunggu"].berkas;
  } else if (/jaket hijau|protagonis|punggung|pria itu/.test(item.isi ?? "")) {
    bagian.push(core["protagonis"].promptCore);
    bagian.push(core["protagonis"].negatif);
    referensi = core["protagonis"].berkas;
  } else {
    bagian.push("no people facing the camera, no visible faces");
  }

  bagian.push(`lighting: ${item.cahaya}`);
  if (item.segmen === "S1" || item.segmen === "S2" || item.segmen === "S8") {
    bagian.push("bright daylight, the scene must read as ordinary daytime work");
  }

  hasil.push({
    berkas: item.berkas,
    segmen: item.segmen,
    jumlah_shot: item.jumlah_shot,
    prioritas: PRIORITAS.test(basename(item.berkas)),
    referensi,
    prompt: bagian.filter(Boolean).join(", "),
    pemicu: item.shot.slice(0, 4),
  });
}

hasil.sort((a, b) => Number(b.prioritas) - Number(a.prioritas) || b.jumlah_shot - a.jumlah_shot);
const keluaran = onlyPriority ? hasil.filter((x) => x.prioritas) : hasil;

const target = join(storyDir, "image-prompts.json");
writeFileSync(target, `${JSON.stringify(keluaran, null, 2)}\n`, "utf8");

console.log(`✔ prompt gambar ${plan.episodeId}`);
console.log(`  berkas unik : ${hasil.length}`);
console.log(`  prioritas   : ${hasil.filter((x) => x.prioritas).length}`);
console.log(`  ditulis     : ${keluaran.length}${onlyPriority ? " (hanya prioritas)" : ""}`);
console.log(`  berkas      : ${target.replace(`${ROOT}/`, "")}`);
