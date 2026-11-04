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

const episode = ({ narration, headline = "SATU DUA", scenes = null }) => ({
  scenes: (scenes ?? [narration]).map((line) => ({ narration: line })),
  publishing: { thumbnail: { headline } },
});

test("menerima naskah yang mengikuti aturan", () => {
  const { code, out } = run({
    episodes: { "LS-0100": episode({ narration: "Truk itu ditemukan pukul empat pagi. Mesinnya menyala." }) },
  });
  assert.equal(code, 0, out);
});

test("menolak pembuka yang seragam pada episode yang belum terbit", () => {
  const { code, out } = run({
    episodes: {
      "LS-0100": episode({ narration: "Bayangkan kamu membuka pintu itu. Ada suara di baliknya." }),
      "LS-0101": episode({ narration: "Bayangkan kamu mendengar suara itu lagi. Kali ini dari dalam." }),
    },
  });
  assert.equal(code, 1);
  assert.match(out, /hook tidak boleh seragam/);
});

test("pembuka seragam yang seluruhnya sudah terbit hanya jadi riwayat", () => {
  const { code, out } = run({
    episodes: {
      "LS-0100": episode({ narration: "Bayangkan kamu membuka pintu itu. Ada suara di baliknya." }),
      "LS-0101": episode({ narration: "Bayangkan kamu mendengar suara itu lagi. Kali ini dari dalam." }),
      "LS-0102": episode({ narration: "Perahu itu tenggelam sebelas tahun lalu. Radionya masih memanggil." }),
    },
    published: ["LS-0100", "LS-0101"],
  });
  assert.equal(code, 0, out);
  assert.match(out, /jangan diulang lagi/);
});

test("menolak kalimat lebih dari 24 kata", () => {
  const panjang = Array.from({ length: 28 }, (_, i) => `kata${i}`).join(" ") + ".";
  const { code, out } = run({ episodes: { "LS-0100": episode({ narration: "Pintu itu terbuka.", scenes: ["Pintu itu terbuka.", panjang] }) } });
  assert.equal(code, 1);
  assert.match(out, /maks 24/);
});

test("menolak headline thumbnail lebih dari 42 karakter", () => {
  const { code, out } = run({
    episodes: { "LS-0100": episode({ narration: "Pintu itu terbuka dari dalam.", headline: "X".repeat(50) }) },
  });
  assert.equal(code, 1);
  assert.match(out, /maks 42/);
});

test("menolak kalimat pertama lebih dari 20 kata", () => {
  const pembuka = Array.from({ length: 21 }, (_, i) => `kata${i}`).join(" ") + ".";
  const { code, out } = run({ episodes: { "LS-0100": episode({ narration: pembuka }) } });
  assert.equal(code, 1);
  assert.match(out, /maks 20/);
});

test("--strict mengubah peringatan menjadi gagal", () => {
  const { code, out } = run({
    episodes: { "LS-0100": episode({ narration: "Pintu itu terbuka sendiri." }) },
    args: ["--strict"],
  });
  assert.equal(code, 1, out);
});
