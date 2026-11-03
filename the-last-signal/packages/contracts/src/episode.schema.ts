/**
 * THE LAST SIGNAL — Episode contract
 *
 * Ini adalah satu-satunya sumber kebenaran untuk bentuk data episode.
 * Story Agent, Director Agent, worker, dan Remotion composition semuanya
 * membaca/menulis bentuk ini. AI tidak pernah mengontrol render secara bebas:
 * AI menghasilkan JSON, kode yang memvalidasi, Remotion yang mengeksekusi.
 */
import { z } from "zod";

export const FPS = 30 as const;
export const WIDTH = 1080 as const;
export const HEIGHT = 1920 as const;

/** Rentang durasi yang diterima YouTube Shorts untuk format kita. */
export const MIN_DURATION_SECONDS = 40;
export const MAX_DURATION_SECONDS = 60;

export const CameraMoveSchema = z.enum([
  "static",
  "push_in",
  "pull_out",
  "pan_left",
  "pan_right",
  "handheld",
]);
export type CameraMove = z.infer<typeof CameraMoveSchema>;

export const ShotSizeSchema = z.enum(["wide", "medium", "closeup", "pov", "cctv"]);
export type ShotSize = z.infer<typeof ShotSizeSchema>;

export const EffectSchema = z.enum([
  "film_grain",
  "light_flicker",
  "vignette",
  "scanlines",
  "vhs_distortion",
  "volumetric_fog",
  "camera_shake",
  "creature_reveal",
  "flashlight",
  "timestamp_hud",
]);
export type Effect = z.infer<typeof EffectSchema>;

export const SfxCueSchema = z.object({
  /** Nama file SFX relatif terhadap folder episode, mis. "audio/sfx/knock.wav" */
  assetId: z.string().min(1),
  /** Posisi relatif terhadap awal scene (bukan timeline episode). */
  startFrame: z.number().int().nonnegative(),
  volume: z.number().min(0).max(1).default(1),
});
export type SfxCue = z.infer<typeof SfxCueSchema>;

export const SubtitleCueSchema = z.object({
  startFrame: z.number().int().nonnegative(),
  endFrame: z.number().int().positive(),
  text: z.string().min(1),
});

export const SceneSchema = z.object({
  id: z.string().regex(/^scene_\d{2}$/, "scene id harus berbentuk scene_01"),
  order: z.number().int().nonnegative(),
  durationFrames: z.number().int().positive(),

  /** Path gambar master relatif terhadap publicDir (= folder episode). */
  image: z.string().min(1),

  /** Narasi yang diucapkan pada scene ini (dipakai TTS + subtitle fallback). */
  narration: z.string().default(""),

  /**
   * Timestamp subtitle berasal dari alignment audio (Phase 3), bukan dari
   * perkiraan durasi kalimat. Frame di sini relatif terhadap awal scene.
   */
  subtitles: z.array(SubtitleCueSchema).default([]),

  visual: z.object({
    prompt: z.string().min(1),
    locationId: z.string().min(1),
    characterIds: z.array(z.string()).default([]),
    camera: CameraMoveSchema,
    shot: ShotSizeSchema,
    lighting: z.string().min(1),
    /** Intensitas efek kamera 0–1, mengatur kuatnya flicker/grain dll. */
    intensity: z.number().min(0).max(1).default(0.5),
    effects: z.array(EffectSchema).default([]),
  }),

  audio: z
    .object({
      ambienceId: z.string().optional(),
      ambienceVolume: z.number().min(0).max(1).default(0.35),
      sfx: z.array(SfxCueSchema).default([]),
    })
    .default({ ambienceVolume: 0.35, sfx: [] }),
});
export type Scene = z.infer<typeof SceneSchema>;

export const PublishingSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1),
  tags: z.array(z.string()).max(15).default([]),
  categoryId: z.string().default("24"), // 24 = Entertainment
  privacyStatus: z.enum(["public", "unlisted", "private"]).default("public"),
  selfDeclaredMadeForKids: z.boolean().default(false),
  /** Wajib: visual photorealistic yang menggambarkan kejadian fiktif. */
  syntheticDisclosure: z.boolean(),
});

export const EpisodeSchema = z.object({
  episodeId: z.string().regex(/^LS-\d{4}$/, "episodeId harus berbentuk LS-0001"),
  title: z.string().min(1),
  language: z.literal("id-ID"),
  category: z.literal("fictional_horror"),
  format: z.literal("found_footage").default("found_footage"),

  targetFps: z.literal(FPS).default(FPS),
  width: z.literal(WIDTH).default(WIDTH),
  height: z.literal(HEIGHT).default(HEIGHT),
  targetDurationSeconds: z.number().min(1).optional(),

  story: z.object({
    hook: z.string().min(1),
    premise: z.string().min(1),
    twist: z.string().min(1),
    ending: z.string().min(1),
  }),

  /** Audio narasi penuh (hasil TTS). Opsional sampai Phase 3. */
  narrationAudio: z.string().optional(),

  scenes: z.array(SceneSchema).min(1),

  publishing: PublishingSchema,
});
export type Episode = z.input<typeof EpisodeSchema>;
export type ParsedEpisode = z.output<typeof EpisodeSchema>;

/**
 * Validasi lintas-field yang tidak bisa diekspresikan lewat tipe.
 * Semua aturan di sini harus deterministik (tanpa AI, tanpa I/O jaringan).
 */
export const ParsedEpisodeSchema = EpisodeSchema.superRefine((episode, ctx) => {
  const totalFrames = episode.scenes.reduce((sum, s) => sum + s.durationFrames, 0);
  const totalSeconds = totalFrames / episode.targetFps;

  if (episode.targetDurationSeconds) {
    const tolerance = Math.max(2, episode.targetDurationSeconds * 0.1);
    if (Math.abs(totalSeconds - episode.targetDurationSeconds) > tolerance) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["scenes"],
        message: `total durasi ${totalSeconds.toFixed(1)}s menyimpang dari target ${episode.targetDurationSeconds}s (±${tolerance}s)`,
      });
    }
  }

  if (totalSeconds < MIN_DURATION_SECONDS || totalSeconds > MAX_DURATION_SECONDS) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["scenes"],
      message: `total durasi ${totalSeconds.toFixed(1)}s di luar rentang Shorts yang diizinkan (${MIN_DURATION_SECONDS}–${MAX_DURATION_SECONDS}s)`,
    });
  }

  const seenIds = new Set<string>();
  const seenOrders = new Set<number>();
  const seenImages = new Set<string>();

  episode.scenes.forEach((scene, index) => {
    const path = ["scenes", index] as const;

    if (seenIds.has(scene.id)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [...path, "id"], message: `scene id duplikat: ${scene.id}` });
    }
    seenIds.add(scene.id);

    if (seenOrders.has(scene.order)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [...path, "order"], message: `scene order duplikat: ${scene.order}` });
    }
    seenOrders.add(scene.order);

    if (scene.order !== index) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [...path, "order"],
        message: `scene order harus berurutan sesuai posisi array (expected ${index}, dapat ${scene.order})`,
      });
    }

    if (seenImages.has(scene.image)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [...path, "image"],
        message: `master image dipakai lebih dari satu scene: ${scene.image}`,
      });
    }
    seenImages.add(scene.image);

    if (scene.durationFrames < 15) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [...path, "durationFrames"],
        message: "scene terlalu pendek (<0.5s) untuk terbaca dengan baik",
      });
    }

    scene.audio.sfx.forEach((cue, sfxIndex) => {
      if (cue.startFrame >= scene.durationFrames) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [...path, "audio", "sfx", sfxIndex, "startFrame"],
          message: `SFX di frame ${cue.startFrame} berada di luar timeline scene (${scene.durationFrames} frame)`,
        });
      }
    });

    let lastEnd = -1;
    scene.subtitles.forEach((cue, cueIndex) => {
      if (cue.endFrame <= cue.startFrame) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [...path, "subtitles", cueIndex],
          message: "endFrame subtitle harus lebih besar dari startFrame",
        });
      }
      if (cue.endFrame > scene.durationFrames) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [...path, "subtitles", cueIndex, "endFrame"],
          message: `subtitle melewati durasi scene (${cue.endFrame} > ${scene.durationFrames})`,
        });
      }
      if (cue.startFrame < lastEnd) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [...path, "subtitles", cueIndex, "startFrame"],
          message: "subtitle overlap dengan cue sebelumnya",
        });
      }
      lastEnd = cue.endFrame;
      if (cue.text.length > 120) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [...path, "subtitles", cueIndex, "text"],
          message: "subtitle terlalu panjang untuk layar 9:16 (maks 120 karakter)",
        });
      }
    });
  });

  if (episode.narrationAudio && episode.scenes.some((s) => s.narration.trim().length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["narrationAudio"],
      message: "narrationAudio ada, tetapi ada scene tanpa teks narasi — alignment tidak mungkin dilakukan",
    });
  }

  if (!episode.publishing.syntheticDisclosure) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["publishing", "syntheticDisclosure"],
      message:
        "syntheticDisclosure wajib true: channel memakai visual AI photorealistic dengan format found footage",
    });
  }
});

export function parseEpisode(input: unknown) {
  return ParsedEpisodeSchema.parse(input);
}

export function safeParseEpisode(input: unknown) {
  return ParsedEpisodeSchema.safeParse(input);
}

/** Total durasi komposisi dalam frame. */
export function totalFrames(episode: { scenes: { durationFrames: number }[] }): number {
  return episode.scenes.reduce((sum, scene) => sum + scene.durationFrames, 0);
}

/** Offset (frame) awal setiap scene pada timeline episode. */
export function sceneOffsets(episode: { scenes: { durationFrames: number }[] }): number[] {
  const offsets: number[] = [];
  let cursor = 0;
  for (const scene of episode.scenes) {
    offsets.push(cursor);
    cursor += scene.durationFrames;
  }
  return offsets;
}
