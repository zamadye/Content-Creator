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
    size: 56,
    lineHeight: 1.28,
    maxWidth: 920,
    bottom: 300,
  },
  hud: {
    timestampSize: 40,
    labelSize: 26,
  },
} as const;
