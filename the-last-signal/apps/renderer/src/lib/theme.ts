/** Token visual channel: satu tempat untuk warna, tipografi, dan frame HUD. */
export const theme = {
  colors: {
    black: "#050506",
    ink: "#0b0c0e",
    bone: "#e7e3da",
    amber: "#d8a657",
    signal: "#c9433a",
    fog: "#8d9298",
  },
  font: {
    sans: '"Open Sans", "Helvetica Neue", Helvetica, Arial, sans-serif',
    mono: '"DejaVu Sans Mono", "Courier New", monospace',
  },
  subtitle: {
    // Subtitle pindah ke tengah layar (2026-11-06). Huruf dinaikkan dari 56 ke
    // 74 px: di layar ponsel, teks tengah harus terbaca dalam sekali lihat.
    size: 92,
    lineHeight: 1.18,
    maxWidth: 900,
    bottom: 0, // tidak dipakai lagi; posisi sekarang tengah
  },
  hud: {
    timestampSize: 40,
    labelSize: 26,
  },
} as const;
