/**
 * Uji pemeriksa naskah. Yang diuji adalah *aturan*, bukan episode tertentu,
 * supaya daftar episode boleh berubah tanpa membuat uji ini rapuh.
 *
 *   node --test scripts/check-copy.test.mjs
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

/** Bangun pohon mini (projects/episodes + publish-queue) lalu jalankan pemeriksa di dalamnya. */
function run(fixture) {
  const root = mkdtempSync(join(tmpdir(), "copy-"));
  mkdirSync(join(root, "scripts"), { recursive: true });
  writeFileSync(join(root, "scripts", "check-copy.mjs"), readFileSync(join(HERE, "check-copy.mjs")));

  for (const [id, episode] of Object.entries(fixture.episodes ?? {})) {
    mkdirSync(join(root, "projects", "episodes", id), { recursive: true });
    writeFileSync(join(root, "projects", "episodes", id, "episode.json"), JSON.stringify(episode));
  }

  if (fixture.published?.length) {
    mkdirSync(join(root, "publish-queue"), { recursive: true });
    for (const id of fixture.published) {
      writeFileSync(join(root, "publish-queue", `${id}.json`), JSON.stringify({ episodeId: id, status: "published" }));
    }
  }

  const result = spawnSync(process.execPath, [join(root, "scripts", "check-copy.mjs"), ...(fixture.args ?? [])], {
    encoding: "utf8",
  });
  return { code: result.status, out: result.stdout + result.stderr };
}

const cta = { card: "KALAU TIDAK MAU, SUBSCRIBE" };

// Judul/deskripsi/komentar pertama sekarang ikut diperiksa, jadi tiap episode
// uji perlu metadata yang sah dan berbeda dari episode lain di fixture yang sama.
let seq = 0;
const episode = ({
  narration,
  headline = "SATU DUA",
  scenes = null,
  withCta = true,
  title = null,
  description = null,
  pinComment = null,
}) => {
  const n = ++seq;
  return {
    // Boleh berupa kalimat saja atau scene utuh (dengan durationFrames) —
    // aturan retensi perlu durasi tiap scene untuk tahu kapan cerita berbelok.
    scenes: (scenes ?? [narration]).map((line) => (typeof line === "string" ? { narration: line } : line)),
    publishing: {
      thumbnail: { headline },
      ...(withCta ? { cta } : {}),
      title: title ?? `Judul ${n} Untuk Episode Ini.`,
      description: description ?? `Pintu nomor ${n} terbuka pukul tiga. Tidak ada yang membukanya.\n\n#TheLastSignal`,
      pinComment: pinComment ?? `Kamu pernah membuka pintu jam ${n}? Tulis di komentar.`,
    },
  };
};

// Kalimat terakhir wajib berisi ajakan, jadi tiap fixture diakhiri CTA.
const withClosing = (lines) => [...lines, "Kalau kamu tidak ingin diganggu, klik subscribe."];

test("menerima naskah yang mengikuti aturan", () => {
  const { code, out } = run({
    episodes: {
      "LS-0100": episode({
        narration: "Truk itu ditemukan pukul empat pagi. Mesinnya tidak pernah dimatikan.",
        scenes: withClosing(["Truk itu ditemukan pukul empat pagi. Mesinnya tidak pernah dimatikan."]),
      }),
    },
  });
  assert.equal(code, 0, out);
});

const detik = (frames) => ({ durationFrames: frames });

test("menolak belokan cerita yang baru datang setelah detik 13", () => {
  const { code, out } = run({
    episodes: {
      "LS-0200": episode({
        narration: "Router di kamar kosmu mencatat satu perangkat asing. Namanya namamu.",
        scenes: [
          { narration: "Router di kamar kosmu mencatat satu perangkat asing.", durationFrames: 240 },
          { narration: "Perangkat itu menyala tiap malam pukul tiga lewat tiga puluh tiga.", durationFrames: 240 },
          { narration: "Kamu mematikan internet, tapi kameramu menyala sendiri.", durationFrames: 240 },
          { narration: "Kalau kamu tidak ingin diganggu, klik subscribe. Kamu pernah mengalaminya?", durationFrames: 240 },
        ],
      }),
    },
  });
  assert.equal(code, 1, out);
  assert.match(out, /belokan cerita baru di detik 16\.0/);
});

test("menerima belokan cerita sebelum detik 11", () => {
  const { code, out } = run({
    episodes: {
      "LS-0201": episode({
        narration: "Router di kamar kosmu mencatat satu perangkat asing. Namanya namamu.",
        scenes: [
          { narration: "Pukul tiga router kosmu menyala sendiri lagi.", durationFrames: 150 },
          { narration: "Namanya namamu, dan ia online sejak malam kamu pindah.", durationFrames: 150 },
          { narration: "Kamu mematikan internet, tapi kameramu menyala sendiri.", durationFrames: 240 },
          { narration: "Kalau kamu tidak ingin diganggu, klik subscribe. Kamu pernah mengalaminya?", durationFrames: 240 },
        ],
      }),
    },
  });
  assert.equal(code, 0, out);
  assert.doesNotMatch(out, /belokan cerita/);
});

test("mengingatkan penutup yang tidak bertanya ke penonton", () => {
  const { code, out } = run({
    episodes: {
      "LS-0202": episode({
        narration: "Lift itu berhenti di lantai yang tidak ada. Kamu menekan tombol tutup.",
        scenes: [
          { narration: "Lift itu berhenti di lantai yang tidak ada.", durationFrames: 150 },
          { narration: "Kamu menekan tombol tutup, pintunya tidak bergerak.", durationFrames: 150 },
          { narration: "Kalau kamu tidak ingin ikut, klik subscribe.", durationFrames: 240 },
        ],
      }),
    },
  });
  assert.match(out, /penutup belum bertanya ke penonton/);
});

test("menolak pembuka yang seragam pada episode yang belum terbit", () => {
  const { code, out } = run({
    episodes: {
      "LS-0100": episode({ narration: "Bayangkan kamu membuka pintu itu. Ada suara di baliknya.", scenes: withClosing(["Bayangkan kamu membuka pintu itu. Ada suara di baliknya."]) }),
      "LS-0101": episode({ narration: "Bayangkan kamu mendengar suara itu lagi. Kali ini dari dalam.", scenes: withClosing(["Bayangkan kamu mendengar suara itu lagi. Kali ini dari dalam."]) }),
    },
  });
  assert.equal(code, 1);
  assert.match(out, /hook tidak boleh seragam/);
});

test("pembuka seragam yang seluruhnya sudah terbit hanya jadi riwayat", () => {
  const { code, out } = run({
    episodes: {
      "LS-0100": episode({ narration: "Bayangkan kamu membuka pintu itu. Ada suara di baliknya.", scenes: withClosing(["Bayangkan kamu membuka pintu itu. Ada suara di baliknya."]) }),
      "LS-0101": episode({ narration: "Bayangkan kamu mendengar suara itu lagi. Kali ini dari dalam.", scenes: withClosing(["Bayangkan kamu mendengar suara itu lagi. Kali ini dari dalam."]) }),
      "LS-0102": episode({
        narration: "Perahu itu tenggelam sebelas tahun lalu. Radionya tidak pernah berhenti memanggil namamu.",
        scenes: withClosing(["Perahu itu tenggelam sebelas tahun lalu. Radionya tidak pernah berhenti memanggil namamu."]),
      }),
    },
    published: ["LS-0100", "LS-0101"],
  });
  assert.equal(code, 0, out);
  assert.match(out, /jangan diulang lagi/);
});

test("menolak kalimat lebih dari 24 kata", () => {
  const panjang = Array.from({ length: 28 }, (_, i) => `kata${i}`).join(" ") + ".";
  const { code, out } = run({ episodes: { "LS-0100": episode({ narration: "Pintu itu terbuka.", scenes: withClosing(["Pintu itu terbuka.", panjang]) }) } });
  assert.equal(code, 1);
  assert.match(out, /maks 24/);
});

test("menolak headline thumbnail lebih dari 42 karakter", () => {
  const { code, out } = run({
    episodes: { "LS-0100": episode({ narration: "Pintu itu terbuka dari dalam.", headline: "X".repeat(50), scenes: withClosing(["Pintu itu terbuka dari dalam."]) }) },
  });
  assert.equal(code, 1);
  assert.match(out, /maks 42/);
});

test("menolak kalimat pertama lebih dari 9 kata (Short)", () => {
  // Batas lama 20 kata: hook boleh melebar dan tidak ada yang menegur
  // (arahan pemilik kanal 7 Nov 2026 — hook LL-0002 dinilai kurang kuat).
  const pembuka = Array.from({ length: 10 }, (_, i) => `kata${i}`).join(" ") + ".";
  const { code, out } = run({ episodes: { "LS-0100": episode({ narration: pembuka, scenes: withClosing([pembuka]) }) } });
  assert.equal(code, 1);
  assert.match(out, /maks 9/);
});

test("--strict mengubah peringatan menjadi gagal", () => {
  const { code, out } = run({
    episodes: { "LS-0100": episode({ narration: "Pintu itu terbuka sendiri.", scenes: withClosing(["Pintu itu terbuka sendiri."]) }) },
    args: ["--strict"],
  });
  assert.equal(code, 1, out);
});

test("menolak episode tanpa publishing.cta", () => {
  const { code, out } = run({
    episodes: {
      "LS-0100": episode({
        narration: "Kamu membuka pintu itu dan ada suara di baliknya.",
        scenes: withClosing(["Kamu membuka pintu itu dan ada suara di baliknya."]),
        withCta: false,
      }),
    },
  });
  assert.equal(code, 1);
  assert.match(out, /publishing\.cta/);
});

test("menolak kalimat terakhir tanpa ajakan", () => {
  const { code, out } = run({
    episodes: { "LS-0100": episode({ narration: "Kamu membuka pintu itu.", scenes: ["Kamu membuka pintu itu."] }) },
  });
  assert.equal(code, 1);
  assert.match(out, /belum berisi ajakan/);
});

test("menolak narasi yang tidak menyapa penonton", () => {
  const { code, out } = run({
    episodes: {
      "LS-0100": episode({
        narration: "Pintu itu terbuka sendiri.",
        scenes: ["Pintu itu terbuka sendiri.", "Kalau tidak ingin diganggu, klik subscribe."],
      }),
    },
  });
  assert.equal(code, 1);
  assert.match(out, /tidak menyapa penonton/);
});

test("menolak kerangka judul yang dipakai ulang di episode belum terbit", () => {
  const { code, out } = run({
    episodes: {
      "LS-0100": episode({
        narration: "Truk itu ditemukan pukul empat pagi. Mesinnya masih menyala.",
        scenes: withClosing(["Truk itu ditemukan pukul empat pagi. Mesinnya masih menyala."]),
        title: "Truk Itu Ditemukan dengan Mesin Menyala. Radionya Masih Bernapas.",
      }),
      "LS-0101": episode({
        narration: "Perahu itu tenggelam sebelas tahun lalu. Radionya masih memanggil.",
        scenes: withClosing(["Perahu itu tenggelam sebelas tahun lalu. Radionya masih memanggil."]),
        title: "Perahu Itu Tenggelam Sebelas Tahun Lalu. Radionya Masih Memanggil.",
      }),
    },
  });
  assert.equal(code, 1);
  assert.match(out, /bentuk judul/);
});

test("menolak label arsip dan kalimat pengungkapan di judul, deskripsi, dan komentar", () => {
  const { code, out } = run({
    episodes: {
      "LS-0200": episode({
        narration: "Kamu membuka pintu itu pukul tiga.",
        scenes: withClosing(["Kamu membuka pintu itu pukul tiga."]),
        title: "Pintu Itu Terbuka Sendiri, Ternyata Ini Sebabnya.",
        description: "ARSIP FIKSI — pintu itu terbuka pukul tiga.",
      }),
      "LS-0201": episode({
        narration: "Kamu mendengar suara itu dari dalam.",
        scenes: withClosing(["Kamu mendengar suara itu dari dalam."]),
        description: "Suara dari dalam lemari. Seluruh kejadian dalam video ini adalah fiksi.",
      }),
      "LS-0202": episode({
        narration: "Kamu melihat lapak itu dari jauh.",
        scenes: withClosing(["Kamu melihat lapak itu dari jauh."]),
        pinComment: "Visual dibuat dengan bantuan AI. Kamu pernah melihat lapak itu?",
      }),
    },
  });
  assert.equal(code, 1);
  assert.match(out, /deskripsi memuat label arsip/);
  assert.match(out, /komentar pertama memuat label arsip/);
});

test("menolak deskripsi yang masih dibuka label arsip dan yang memuat \\n harfiah", () => {
  const { code, out } = run({
    episodes: {
      "LS-0100": episode({
        narration: "Kamu membuka pintu itu pukul tiga.",
        scenes: withClosing(["Kamu membuka pintu itu pukul tiga."]),
        description: "ARSIP FIKSI — rekaman kamar 9. Ini fiksi, visual dibantu AI.",
      }),
      "LS-0101": episode({
        narration: "Kamu mendengar suara itu dari dalam.",
        scenes: withClosing(["Kamu mendengar suara itu dari dalam."]),
        description: "Suara dari dalam lemari. Ini fiksi, visual dibantu AI.\\n\\n#TheLastSignal",
      }),
    },
  });
  assert.equal(code, 1);
  assert.match(out, /label arsip/);
  assert.match(out, /harfiah/);
});

test("menolak komentar pertama yang identik dan yang tidak bertanya", () => {
  const sama = "Fiksi. Visual dibuat dengan bantuan AI. Kamu pernah kehilangan jam tangan?";
  const { code, out } = run({
    episodes: {
      "LS-0100": episode({ narration: "Kamu membuka pintu itu pukul tiga.", scenes: withClosing(["Kamu membuka pintu itu pukul tiga."]), pinComment: sama }),
      "LS-0101": episode({ narration: "Kamu mendengar suara itu dari dalam.", scenes: withClosing(["Kamu mendengar suara itu dari dalam."]), pinComment: sama }),
      "LS-0102": episode({ narration: "Kamu melihat lapak itu dari jauh.", scenes: withClosing(["Kamu melihat lapak itu dari jauh."]), pinComment: "Fiksi. Visual dibuat dengan bantuan AI." }),
    },
  });
  assert.equal(code, 1);
  assert.match(out, /komentar pertama identik/);
  assert.match(out, /tidak bertanya/);
});

test("menerima judul, deskripsi, dan komentar yang ditulis per episode", () => {
  const { code, out } = run({
    episodes: {
      "LS-0100": episode({ narration: "Kamu membuka pintu itu pukul tiga. Tidak ada yang membukanya lagi.", scenes: withClosing(["Kamu membuka pintu itu pukul tiga. Tidak ada yang membukanya lagi."]), title: "Pukul Tiga Pintu Itu Terbuka Sendiri." }),
      "LS-0101": episode({ narration: "Pukul tiga sesuatu mengetuk dari dalam lemari. Lemari itu kosong.", scenes: withClosing(["Pukul tiga sesuatu mengetuk dari dalam lemari. Lemari itu kosong."]), title: "Dari Dalam Lemari, Sesuatu Mengetuk Namamu." }),
    },
  });
  assert.equal(code, 0, out);
});
