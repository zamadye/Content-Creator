/**
 * EDITORIAL DESIGN TOKENS
 * -----------------------
 * Single source of truth for the "2D Animated Editorial Storytelling" identity.
 * Every scene, prop and type element pulls from this file. Nothing hard-codes a hex.
 *
 * Rule: muted earthy base + a small number of primary accents.
 * Accent usage is semantic, never decorative:
 *   brick   -> harm / urgency / the thing that went wrong
 *   mustard -> numbers, evidence, the thing being measured
 *   teal    -> institutional / procedural space
 *   clay    -> human warmth (people, hands, home)
 */

export const palette = {
  // --- base ---
  ink: '#141713',
  inkSoft: '#232822',
  night: '#182320',
  nightDeep: '#101917',
  paper: '#F1E9DA',
  paperDim: '#DDCFB6',
  paperWarm: '#E7D8BE',

  // --- earth ---
  clay: '#B96A45',
  clayDeep: '#8B4A2F',
  clayLight: '#D08A63',
  mustard: '#D9A544',
  mustardDeep: '#A97B2C',
  olive: '#6F7A5A',
  oliveDeep: '#4C5540',
  sage: '#A9B49A',
  sageDeep: '#7E8C72',

  // --- institutional ---
  teal: '#2E4A46',
  tealDeep: '#1B302D',
  tealLight: '#4A6C66',

  // --- accents ---
  brick: '#B23A2C',
  brickDeep: '#87281D',
  brickLight: '#D4644F',

  // --- light ---
  warmLight: '#F7DCAE',
  coolLight: '#C9D6CE',

  // --- neutrals ---
  white: '#FFFFFF',
  paperShadow: '#C4B79E',

  // --- misi 7: bahan kolase kertas ---
  /** kardus kraft (potongan yang ditempel) */
  kraft: '#B08154',
  kraftDeep: '#87603A',
  kraftLight: '#CBA277',
  /** selotip kertas */
  tape: '#E8E0C9',
  /** pensil / garis bantu */
  pencil: '#6F6A60',
  /** kertas yang lebih dalam, untuk panel grafik dan buku tulis */
  paperDeep: '#D8C9AE',
  /** tinta spidol (lebih hangat dari ink murni) */
  marker: '#221F1B',
  markerRed: '#9C2C24',
} as const;

/** Skin tones are drawn from a deliberately wide, warm range. */
export const skin = {
  light: '#E8BE9B',
  lightDeep: '#CE9E79',
  medium: '#C08A5F',
  mediumDeep: '#A06F49',
  deep: '#8A5A3B',
  deepShade: '#6E452C',
} as const;

export const type = {
  // MISI 7 (kolase kertas): display diganti Permanent Marker supaya tipografi
  // ikut bahasa visual referensi (tulisan spidol). Instrument Serif tetap ada
  // di assets/fonts untuk arsip misi 1–6, tapi tidak lagi dimuat manifest.
  display: 'Permanent Marker',
  serifArchive: 'Instrument Serif',
  // Catatan: berkas TTF di assets/fonts mendaftarkan dirinya sebagai keluarga
  // 'Archivo SemiBold' (nama internal Google Fonts), bukan 'Archivo'. Kalau ditulis
  // 'Archivo', resvg tidak menemukan keluarga itu dan jatuh ke Instrument Serif —
  // akibatnya semua teks sans (subtitle, kicker, label) ikut tampil serif.
  sans: 'Archivo SemiBold',
  /** Editorial scale for 1080-wide frames. Mobile-first readability is non-negotiable. */
  size: {
    hero: 132,
    h1: 96,
    h2: 68,
    h3: 50,
    stat: 200,
    body: 40,
    label: 26,
    micro: 21,
    caption: 34,
  },
  weight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  /** Tight tracking on display type, open tracking on small caps labels. */
  tracking: {
    display: -2,
    label: 4.5,
    micro: 3,
    none: 0,
  },
} as const;

/**
 * Motion language: slow, deliberate, human.
 * Editorial critique should feel like a held breath, not a hype video.
 */
export const motion = {
  fps: 30,
  /** Bezier curves (cubic) used across the film. */
  curve: {
    /** Slow-in / slow-out, the default for camera and reveals. */
    editorial: [0.33, 0.02, 0.11, 1] as const,
    /** Fast attack, long settle — for impacts and stamps. */
    impact: [0.16, 1, 0.3, 1] as const,
    /** Even, mechanical — for institutional UI / counters. */
    linearish: [0.4, 0.2, 0.2, 1] as const,
    /** Breath: gentle in and out for idle life. */
    breath: [0.45, 0.05, 0.55, 0.95] as const,
  },
  spring: {
    soft: { damping: 200, stiffness: 60, mass: 1 },
    snappy: { damping: 22, stiffness: 180, mass: 0.8 },
    settle: { damping: 30, stiffness: 90, mass: 1.1 },
  },
  /** Per-scene camera travel is capped so nothing wobbles. */
  camera: {
    maxScale: 1.18,
    minScale: 0.94,
  },
} as const;

export const layout = {
  video: { width: 1080, height: 1920 },
  poster: { width: 1080, height: 1350 },
  /** Vertical rhythm for 9:16 (Instagram Reels / TikTok). UI overlays live below 1720. */
  safe: {
    top: 210,
    bottom: 360,
    side: 72,
  },
  /** Locked vertical zones — every scene composes inside these. */
  rhythm: {
    brandY: 196,
    contentTop: 250,
    contentBottom: 1470,
    headlineY: 1240,
    /** 3 Nov 2026: dinaikkan 30 px (1566 -> 1536). Kotak subtitle dua baris setinggi
     *  146 px ternyata menutup baris sumber di y=1672 pada semua misi. 30 px cukup
     *  untuk memberi jarak, tanpa memakan zona konten (contentBottom 1470). */
    captionY: 1536,
    sourceY: 1672,
  },
} as const;

/** Typography helper: does this string need a line break hand-authored? */
export const credits = {
  illustrationLabel: 'ILUSTRASI',
  channel: 'SUARA PUBLIK',
  disclaimer: 'Ilustrasi editorial — bukan dokumentasi peristiwa.',
} as const;
