// MONEY UNDERCOVER — brand tokens (BRAND-CONFIG.md v1.0)
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
  {id: 'S02', sec: 40}, // Boston 1920
  {id: 'S03', sec: 35}, // It really paid
  {id: 'S04', sec: 30}, // The wall
  {id: 'S05', sec: 45}, // Definition
  {id: 'S06', sec: 60}, // Money flow
  {id: 'S07', sec: 50}, // Modern face
  {id: 'S08', sec: 70}, // Rani
  {id: 'S09', sec: 50}, // Smart people
  {id: 'S10', sec: 60}, // First Travel
  {id: 'S11', sec: 35}, // Legal status
  {id: 'S12', sec: 80}, // Reveal
  {id: 'S13', sec: 55}, // Aftermath
  {id: 'S14', sec: 45}, // Insight & out
] as const;

export const EPISODE_DURATION_IN_FRAMES = SCENES.reduce(
  (a, s) => a + s.sec * FPS,
  0
); // 685s = 16440 frames @24fps

export const sec = (s: number) => Math.round(s * FPS);
