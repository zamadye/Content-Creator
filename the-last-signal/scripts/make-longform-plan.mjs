#!/usr/bin/env node
/**
 * make-longform-plan.mjs — gabungkan naskah + peta visual menjadi plan.json
 * yang dibaca `build-longform.mjs`.
 *
 * Kenapa perlu: naskah (`narration.json`) dan peta visual (`visual-map.json`)
 * dipisah supaya penulis bisa mengubah kata tanpa menyentuh gambar, dan
 * sebaliknya. Pipeline butuh satu berkas.
 *
 * Kolam gambar: 152 shot tidak berarti 152 gambar unik. Shot yang menunjuk benda
 * yang sama (Buku C, surat ukur, berita acara, layar alat) memakai satu berkas
 * gambar yang sama, lalu dibedakan lewat skala/offset. Jumlah gambar unik
 * dicetak di akhir supaya biaya produksi terlihat sejak awal.
 *
 *   node scripts/make-longform-plan.mjs --story stories/longform/LL-0002
 *   node scripts/make-longform-plan.mjs --story stories/longform/LL-0002 --dry-run
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function arg(name, fallback = null) {
  const index = process.argv.indexOf(`--${name}`);
  return index !== -1 ? process.argv[index + 1] : fallback;
}

const storyArg = arg("story", "stories/longform/LL-0002");
const storyDir = resolve(ROOT, storyArg);
const dryRun = process.argv.includes("--dry-run");

for (const file of ["narration.json", "visual-map.json"]) {
  if (!existsSync(join(storyDir, file))) {
    console.error(`✖ ${file} tidak ada di ${storyArg}`);
    process.exit(1);
  }
}
const narasi = JSON.parse(readFileSync(join(storyDir, "narration.json"), "utf8"));
const peta = JSON.parse(readFileSync(join(storyDir, "visual-map.json"), "utf8"));
const episodeId = peta.episode;

/**
 * Kolam gambar: pola pada `isi` → satu berkas. Urutan penting, yang paling
 * spesifik di atas. Kalau tidak ada yang cocok, shot itu dapat berkas sendiri.
 */
const KOLAM = [
  // benda yang benar-benar berulang
  [["halaman buku c", "buku c", "kolom nama", "tahun 1981", "angka 221", "halaman dua ratus"], "buku-c"],
  [["surat ukur", "inisial", "tulisan pensil", "kurang 12", "kertas 2004"], "surat-ukur-2004"],
  [["berita acara", "meterai"], "berita-acara"],
  [["sppt", "stempel bank"], "sppt"],
  [["layar alat", "layar total station", "layar hitam", "indikator baterai"], "layar-alat"],
  [["patok beton", "patok kayu", "patok keempat", "patok kecil", "lubang patok"], "patok"],
  [["beringin"], "beringin"],
  [["nisan", "makam"], "makam"],
  [["pos kamling", "kamling"], "kamling"],
  [["tripod", "kotak alat", "pita ukur", "alat ukur", "statif"], "peralatan-ukur"],
  // orang yang berulang (wajah tetap tidak boleh terlihat penuh)
  [["mang karta", "pria tua bertopi", "wajah pria tua", "mulut pria tua", "kepala pria tua"], "mang-karta"],
  [["pak hadi", "pria tua berpeci", "punggung pak hadi"], "pak-hadi"],
  [["bu sri", "perempuan tua", "wajah bu sri"], "bu-sri"],
  [["pak darto", "petugas desa"], "pak-darto"],
  [["pria berjaket hijau", "jaket hijau", "pria itu"], "protagonis-belakang"],
];

const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);

function kolamUntuk(shot) {
  const teks = ` ${(shot.isi ?? "").toLowerCase()} `;
  for (const [pola, ref] of KOLAM) {
    if (pola.some((p) => teks.includes(` ${p}`))) return ref;
  }
  return slug(shot.id);
}

const KAMERA = [
  ["push_in", "push_in"],
  ["pull_out", "pull_out"],
  ["handheld", "handheld"],
  ["static", "static"],
];
const kameraDari = (teks = "static") => {
  const t = teks.toLowerCase();
  for (const [pola, nilai] of KAMERA) if (t.includes(pola)) return nilai;
  return "static";
};

/** Ukuran shot di naskah → enum kontrak (wide | medium | closeup | pov | cctv). */
const UKURAN = {
  wide: "wide",
  full: "wide",
  medium: "medium",
  close: "closeup",
  "extreme close": "closeup",
  insert: "closeup",
  pov: "pov",
};
const ukuranDari = (teks = "medium") => UKURAN[String(teks).toLowerCase().trim()] ?? "medium";

/** Cahaya per segmen (dari visual-map.atmosfer). */
const CAHAYA = {
  S1: "morning_sun_low_4200k",
  S2: "harsh_midday_sun_5600k",
  S3: "high_sun_hard_shadow_5200k",
  S4: "heat_haze_late_afternoon_4800k",
  S5: "golden_then_phone_led_night",
  S6: "flat_white_neon_6000k",
  S7: "single_warm_practical_night_2800k",
  S8: "soft_morning_mist_5000k",
  S9: "warm_late_afternoon_4500k",
};

const EFEK = {
  S4: ["film_grain", "vignette", "dust_motes"],
  S5: ["film_grain", "vignette", "light_flicker"],
  S6: ["film_grain", "vignette"],
  S7: ["film_grain", "vignette", "static_burst"],
  default: ["film_grain", "vignette"],
};

const segmenNarasi = new Map(narasi.segmen.map((s) => [s.id, s]));
const pool = new Set();
let jumlahShot = 0;

const masterDipakai = new Set();
const segments = peta.segmen.map((seg) => {
  const n = segmenNarasi.get(seg.id);
  if (!n) throw new Error(`segmen ${seg.id} tidak ada di narration.json`);

  const shots = seg.shots.map((shot, index) => {
    jumlahShot += 1;
    // Shot yang memuat entitas TIDAK boleh menumpang gambar kolam: kalau ikut,
    // makhluknya akan muncul di semua shot lain yang memakai berkas itu
    // (ATURAN 3.1: entitas muncul 3 kali, tidak lebih).
    const ref = shot.entitas ? `entitas-${shot.id.toLowerCase()}` : kolamUntuk(shot);
    pool.add(ref);
    // Tangga framing 0,25: skala bergantian supaya dua shot berurutan tidak
    // terasa seperti gambar yang sama.
    const step = [1.06, 1.18, 1.1, 1.24][index % 4];
    return {
      image: `images/${ref}.png`,
      camera: kameraDari(shot.kamera),
      scale: step,
      offsetX: [0, 40, -30, 20][index % 4],
      offsetY: [0, -20, 25, -10][index % 4],
      shot: ukuranDari(shot.ukuran),
      pemicu: shot.pemicu,
      offsetFrame: shot.offset_frame,
      prompt: shot.isi,
      entitas: shot.entitas,
      sfx: shot.sfx,
    };
  });

  // Gambar pembuka tiap segmen harus unik (kontrak menolak master image yang
  // dipakai dua scene). Kalau kena kolam yang sudah dipakai segmen lain, shot
  // pembuka itu diberi berkasnya sendiri.
  if (masterDipakai.has(shots[0].image)) {
    shots[0].image = `images/${slug(`${seg.id}-pembuka`)}.png`;
  }
  masterDipakai.add(shots[0].image);

  return {
    id: seg.id,
    narration: n.paragraf.join("\n\n"),
    imagePrompt: seg.shots[0]?.isi ?? n.judul,
    lighting: CAHAYA[seg.id] ?? "low_key_practical",
    intensity: seg.id === "S2" || seg.id === "S8" ? 0.82 : seg.id === "S7" ? 0.35 : 0.6,
    effects: EFEK[seg.id] ?? EFEK.default,
    ambienceVolume: seg.id === "S7" ? 0.22 : 0.3,
    sfx: [],
    shots,
  };
});

const plan = {
  episodeId,
  title: narasi.judul,
  subgenre: "Long-form narration",
  experiment:
    "Satu bidang tanah, satu selisih dua belas meter persegi. Horornya dari dokumen, bukan dari kegelapan.",
  structure: "pekerjaan → tawaran → kejanggalan → arsip → sebab manusia → tindakan",
  story: {
    hook: "Kurang dua belas meter.",
    premise:
      "Juru ukur tanah mengukur satu bidang dan hasilnya selalu kurang dua belas meter persegi — persis seluas makam yang namanya dihapus dari Buku C desa.",
    twist: "Selisihnya bukan perbuatan makhluk; ayahnya sudah mencatat angka yang sama dua puluh satu tahun lalu.",
    ending:
      "Ia menanam patok di tepi makam, mengecualikan dua belas meter di berita acara, dan mengembalikan uang muka. Sehari kemudian ada patok kecil di atas nisan yang bukan miliknya.",
  },
  cards: [{ text: peta.hook_card?.teks ?? "", at: 0 }],
  youtube: {
    title: arg("judul", "Dua Belas Meter yang Hilang"),
    description: arg(
      "deskripsi",
      "Tanah yang saya ukur kurang dua belas meter persegi. Tiga juru ukur sebelum saya mendapat angka yang sama.",
    ),
    tags: ["cerita horor", "horor indonesia", "juru ukur tanah", "cerita seram", "kisah nyata"],
    pinComment: arg("komentar", "Kalau kamu jadi saya: tulis angka yang diminta, atau angka yang benar?"),
  },
  thumbnail: { headline: "KURANG 12 M²", kicker: "Tanah ini tidak bisa diukur" },
  cta: { card: "Tulis jawabanmu di komentar", holdFrames: 90 },
  segments,
};

const planPath = join(storyDir, "plan.json");
if (!dryRun) writeFileSync(planPath, `${JSON.stringify(plan, null, 2)}\n`, "utf8");

console.log(`${dryRun ? "○" : "✔"} plan ${episodeId} — ${plan.title}`);
console.log(`  segmen      : ${segments.length}`);
console.log(`  shot        : ${jumlahShot}`);
console.log(`  gambar unik : ${pool.size} (kolam)`);
console.log(`  berkas      : ${dryRun ? "-" : planPath.replace(`${ROOT}/`, "")}`);
if (pool.size > 80) {
  console.log(`  ! ${pool.size} gambar masih berat; tambah pola di KOLAM kalau ada benda yang berulang`);
}
