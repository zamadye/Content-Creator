// RUANG MARGIN — brand tokens (BRAND-CONFIG.md v1.0)
export const C = {
  navy: '#101A2B',
  amber: '#F2A900',
  bone: '#F2F0E9',
  red: '#D94B40',
  slate: '#536174',
  pale: '#A8C3D9',
  black: '#080C13',
  green: '#5D9B78',
} as const;

export const FONT =
  "'DejaVu Sans', 'Liberation Sans', 'Noto Sans', Arial, sans-serif";

export const FPS = 24;

// Scene durations in seconds (from storyboard 05-storyboard.md)
export const SCENES = [
  {id: 'S01', sec: 30}, // Hook
  {id: 'S02', sec: 45}, // Demam emas
  {id: 'S03', sec: 35}, // Bahasa kepercayaan
  {id: 'S04', sec: 50}, // Titip emas
  {id: 'S05', sec: 50}, // 40 gram untuk umrah
  {id: 'S06', sec: 40}, // Pejabat & bantahan
  {id: 'S07', sec: 60}, // Pre-order + promosi
  {id: 'S08', sec: 45}, // Mesin yang sama
  {id: 'S09', sec: 45}, // Kenapa yang pintar jatuh
  {id: 'S10', sec: 45}, // Harga mentah vs janji
  {id: 'S11', sec: 50}, // Empat tanda + 157
  {id: 'S12', sec: 45}, // Tangga hukum 2026
  {id: 'S13', sec: 50}, // Yang hilang bukan angka
  {id: 'S14', sec: 45}, // Insight & out
] as const;

export const EPISODE_DURATION_IN_FRAMES = SCENES.reduce(
  (a, s) => a + s.sec * FPS,
  0
); // 635s = 15240 frames @24fps

export const sec = (s: number) => Math.round(s * FPS);
