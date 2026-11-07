#!/usr/bin/env node
// Berkas naskah pendamping untuk satu episode dari stories/slate.json.
//
// Layout narasi panjang (stories/longform/<id>/) dan Short (stories/shorts/<id>/)
// sebelumnya ditulis tangan satu per satu. Akibatnya naskah.md sering berbeda
// dari episode.json — angka kata, hook, dan penutup tidak pernah cocok. Skrip ini
// menarik semuanya dari slate, satu sumber, supaya tidak bisa melenceng.
//
// Pemakaian:
//   node scripts/make-story-files.mjs --story LS-0012
//   node scripts/make-story-files.mjs --all

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const WPS = 2.2; // kata per detik, rata-rata pembacaan lambat (NASKAH.md §Menulis untuk telinga)

function arg(name, fallback = null) {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : process.argv[i + 1];
}

const slate = JSON.parse(readFileSync(join(ROOT, "stories/slate.json"), "utf8"));
const sentences = (text) => text.split(/(?<=[.!?])\s+/).filter(Boolean);
const words = (text) => text.split(/\s+/).filter(Boolean).length;

function build(entry) {
  const id = entry.episodeId;
  const short = entry.format === "short_9x16";
  const dir = join(ROOT, short ? "stories/shorts" : "stories/longform", id);
  const scenes = entry.scenes.map((s, i) => ({
    ...s,
    segmen: `S${i + 1}`,
    n: i + 1,
    kata: words(s.narration),
  }));
  const totalKata = scenes.reduce((sum, s) => sum + s.kata, 0);
  const detik = Math.round((totalKata / WPS) * 10) / 10;
  const judul = entry.story?.title ?? entry.judul ?? id;

  mkdirSync(join(dir, "images"), { recursive: true });

  // --- narration.json -------------------------------------------------------
  writeFileSync(
    join(dir, "narration.json"),
    `${JSON.stringify(
      {
        episode: id,
        judul,
        format: entry.format,
        total_kata: totalKata,
        estimasi_detik: detik,
        segmen: scenes.map((s) => ({
          id: s.segmen,
          segmen: s.n,
          judul: s.narration.split(".")[0].slice(0, 60),
          paragraf: [s.narration],
          kata: s.kata,
        })),
      },
      null,
      2,
    )}\n`,
  );

  // --- visual-map.json ------------------------------------------------------
  writeFileSync(
    join(dir, "visual-map.json"),
    `${JSON.stringify(
      {
        episode: id,
        judul,
        format: entry.format,
        fps: 30,
        resolusi: short ? [1080, 1920] : [1920, 1080],
        total_kata_narasi: totalKata,
        estimasi_durasi_detik: detik,
        hook_card: {
          teks: entry.cards?.[0] ?? entry.thumb?.headline ?? "",
          tampil: "frame 0–60",
          catatan: "teks di layar bersamaan dengan kalimat pertama; maksimal 4 kata",
        },
        aturan_sinkron: {
          dasar: "knowledge/ATURAN.md §3.3 — visual tidak boleh mendahului kata",
          offset_masuk_frame: [2, 4],
          offset_insert_frame: [2, 8],
        },
        scenes: scenes.map((s) => ({
          segmen: s.segmen,
          kata: s.kata,
          kamera: s.camera,
          shot: s.shot,
          lighting: s.lighting,
          intensitas: s.intensity,
          effects: s.effects,
          berkas: `images/scene-${String(s.n).padStart(2, "0")}.jpg`,
        })),
      },
      null,
      2,
    )}\n`,
  );

  // --- image-prompts.json ---------------------------------------------------
  writeFileSync(
    join(dir, "image-prompts.json"),
    `${JSON.stringify(
      scenes.map((s) => ({
        berkas: `images/scene-${String(s.n).padStart(2, "0")}.jpg`,
        segmen: s.segmen,
        aspek: short ? "9:16" : "16:9",
        jumlah_shot: 1,
        prompt: s.imagePrompt,
        pemicu: [sentences(s.narration)[0]],
      })),
      null,
      2,
    )}\n`,
  );

  // --- plan.json ------------------------------------------------------------
  writeFileSync(
    join(dir, "plan.json"),
    `${JSON.stringify(
      {
        episodeId: id,
        title: judul,
        format: entry.format,
        subgenre: entry.subgenre,
        experiment: entry.experiment,
        structure: entry.structure,
        story: entry.story,
        scenes: scenes.map((s) => ({ segmen: s.segmen, kata: s.kata, narasi: s.narration })),
        youtube: entry.youtube,
        thumb: entry.thumb,
        catatan: entry.catatan ?? null,
      },
      null,
      2,
    )}\n`,
  );

  // --- naskah.md ------------------------------------------------------------
  const md = [];
  md.push(`# ${id} — "${judul}"`, "");
  md.push(
    `**Format:** ${short ? `Short vertikal 9:16 · narasi **${totalKata} kata** · ±${detik} s pada ${WPS} kata/detik (target ${short ? "40–60" : "300–660"} s)` : `video panjang 16:9 · narasi **${totalKata} kata** · ±${detik} s`}`,
  );
  md.push(`**Premis:** ${entry.story?.premise ?? "-"}`);
  md.push(`**Hook:** "${entry.story?.hook ?? "-"}"`);
  md.push(`**Twist:** ${entry.story?.twist ?? "-"}`);
  md.push(`**Penutup:** ${entry.story?.ending ?? "-"}`);
  md.push("");
  md.push(
    "Setiap baris di bawah sudah ditulis dengan hukum `knowledge/NASKAH.md` dan diuji `scripts/check-copy.mjs`.",
  );
  md.push("");
  for (const s of scenes) {
    md.push(`## ${s.segmen} — ${s.kata} kata (±${Math.round((s.kata / WPS) * 10) / 10} s)`, "");
    for (const line of sentences(s.narration)) md.push(`> ${line}`, ">");
    md.push(
      `*Kamera* ${s.camera} · *shot* ${s.shot} · *cahaya* ${s.lighting} · *efek* ${(s.effects ?? []).join(", ")}`,
      "",
    );
  }
  md.push("---", "");
  md.push("## Periksa sebelum rekam (NASKAH.md)", "");
  md.push(`- [ ] Hook ≤ ${short ? 9 : 12} kata, ada angka/waktu, kejanggalan muncul di 3 kalimat pertama.`);
  md.push("- [ ] Twist dijawab oleh petunjuk yang sudah terdengar lebih dulu (tanpa fakta baru di pengungkapan).");
  md.push("- [ ] Kalimat terakhir menyentuh kata kunci hook dan memuat ajakan.");
  md.push("- [ ] Dibaca keras sekali; setiap kalimat satu gagasan.");
  md.push("");
  writeFileSync(join(dir, "naskah.md"), md.join("\n"));

  return { id, dir: dir.replace(`${ROOT}/`, ""), totalKata, detik, scenes: scenes.length };
}

const one = arg("story");
const targets = arg("all") !== null || !one ? slate.episodes.filter((e) => e.scenes?.length) : slate.episodes.filter((e) => e.episodeId === one);
if (!targets.length) {
  console.error(`Tidak ada episode "${one}" di stories/slate.json`);
  process.exit(1);
}
for (const entry of targets) {
  const r = build(entry);
  console.log(`✔ ${r.id} → ${r.dir}/ (${r.scenes} scene, ${r.totalKata} kata, ±${r.detik} s)`);
}
