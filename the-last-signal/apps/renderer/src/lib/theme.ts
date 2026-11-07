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
    // Subtitle tetap di tengah layar (2026-11-06), tetapi hurufnya DITURUNKAN
    // dari 92 ke 64 px pada 2026-11-07. Alasannya hierarki, bukan keterbacaan:
    // pada 92 px subtitle hampir sebesar kartu hook, jadi frame pertama terasa
    // seperti dua judul yang berkelahi. Kartu hook yang naik (132–150 px),
    // subtitle yang turun — penonton membaca satu hal utama per frame.
    size: 64,
    lineHeight: 1.18,
    maxWidth: 900,
    bottom: 0, // tidak dipakai lagi; posisi sekarang tengah
  },
  hud: {
    timestampSize: 40,
    labelSize: 26,
  },
} as const;
