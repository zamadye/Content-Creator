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

/**
 * Format panjang (LL-XXXX) punya kontrak sendiri: 5–11 menit, 16:9. Dipisah
 * supaya aturan Shorts tidak pernah dipakai untuk video 8 menit — dan
 * sebaliknya.
 */
export const LONG_MIN_DURATION_SECONDS = 300;
export const LONG_MAX_DURATION_SECONDS = 660;

export const CameraMoveSchema = z.enum([
  "static",
  "push_in",
  "pull_out",
  "pan_left",
  "pan_right",
  "handheld",
  // Gerakan tambahan untuk format panjang: satu gambar bertahan 6–10 detik,
  // jadi kamera butuh lebih banyak kosakata daripada dorongan pelan yang itu-itu saja.
  "dolly_in",
  "dolly_out",
  "arc_left",
  "arc_right",
  "tilt_up",
  "tilt_down",
  "drift",
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
  // Lapisan atmosfer bergerak adalah aksen; shot naratif tetap wajib punya
  // subjek/objek bergerak dalam footage atau animasi adegan.
  "rain",
  "heavy_rain",
  "mist_drift",
  "dust_motes",
  "sea_spray",
  "smoke_drift",
  "static_burst",
  "focus_rack",
]);
export type Effect = z.infer<typeof EffectSchema>;

export const SfxCueSchema = z.object({
  /** Nama file SFX relatif terhadap folder episode, mis. "audio/sfx/knock.wav" */
  assetId: z.string().min(1),
  /** Posisi relatif terhadap awal scene (bukan timeline episode). */
  startFrame: z.number().int().nonnegative(),
  volume: z.number().min(0).max(1).default(1),
  /**
   * Panjang cue dalam frame. Diisi perencana audio dari durasi berkas aslinya.
   * Tanpa ini renderer memakai 4 detik untuk semua efek, sehingga guntur 7
   * detik terpotong di tengah.
   */
  durationFrames: z.number().int().positive().optional(),
});
export type SfxCue = z.infer<typeof SfxCueSchema>;

export const SubtitleCueSchema = z.object({
  startFrame: z.number().int().nonnegative(),
  endFrame: z.number().int().positive(),
  text: z.string().min(1),
});

/**
 * Potongan framing di dalam satu scene. Untuk episode baru, shot harus tetap
 * memakai footage/animasi bergerak; variasi framing/cut tidak mengubah still
 * image menjadi motion footage.
 */
export const CutSchema = z.object({
  /** Frame relatif terhadap awal scene. Harus naik dan < durationFrames. */
  atFrame: z.number().int().positive(),
  /** Ganti gambar pada cut ini (opsional; default tetap gambar scene). */
  image: z.string().optional(),
  camera: CameraMoveSchema.optional(),
  /** Skala framing, 1 = tanpa crop. */
  scale: z.number().min(1).max(2.5).optional(),
  /** Geser framing dalam px ruang 1080×1920. */
  // Batas dilonggarkan karena sekarang ada dua orientasi (1080×1920 & 1920×1080).
  offsetX: z.number().min(-960).max(960).optional(),
  offsetY: z.number().min(-960).max(960).optional(),
});
export type Cut = z.infer<typeof CutSchema>;

export const SceneSchema = z.object({
  id: z.string().regex(/^scene_\d{2}$/, "scene id harus berbentuk scene_01"),
  order: z.number().int().nonnegative(),
  durationFrames: z.number().int().positive(),

  /** Path gambar master relatif terhadap publicDir (= folder episode); legacy poster reference. */
  image: z.string().min(1),

  /** Footage/animasi bergerak untuk timeline, relatif terhadap folder episode. */
  motionVideo: z.string().min(1).optional(),

  /** Narasi yang diucapkan pada scene ini (dipakai TTS + subtitle fallback). */
  narration: z.string().default(""),

  /** Hasil TTS untuk narasi scene ini (relatif terhadap folder episode). */
  narrationAudio: z.string().optional(),

  /** Potongan framing di dalam scene; kosong = satu shot penuh. */
  cuts: z.array(CutSchema).default([]),

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

  /**
   * Frame pembuka yang berfungsi sebagai thumbnail kanal.
   *
   * YouTube tidak mengizinkan pemilihan thumbnail lewat API untuk akun ini,
   * jadi frame pertama video adalah satu-satunya thumbnail yang bisa dikontrol.
   * Karena itu headline dibakar ke dalam gambar dan wajib ditahan minimal
   * 6 frame (0,2 detik) — di bawah itu YouTube bisa mengambil frame berikutnya.
   */
  thumbnail: z
    .object({
      /** 2–4 kata yang membuat penasaran. Bukan judul lengkap. */
      headline: z.string().min(3).max(42),
      /** Detail kecil di atas headline, mis. "03.17 · CCTV". */
      kicker: z.string().max(28).optional(),
      /** Gambar thumbnail; default gambar scene pertama. */
      image: z.string().min(1).optional(),
      /** Berapa lama frame ini ditahan. */
      holdFrames: z.number().int().min(6).max(45).default(15),
    })
    .optional(),

  /**
   * Ajakan bertindak di akhir cerita.
   *
   * Bukan tempelan promosi: penonton baru tahu apa yang harus dilakukan kalau
   * diminta setelah cerita selesai, dan ajakan yang menyambung dari cerita
   * ("kalau kamu tidak ingin ...") jauh lebih kuat daripada "jangan lupa
   * subscribe". Kalimatnya sendiri diucapkan di narasi scene terakhir; kartu
   * ini hanya menampilkannya sebagai tombol.
   */
  cta: z
    .object({
      /** Satu baris pendek di atas tombol, maksimal 30 karakter. */
      card: z.string().min(6).max(30),
      /** Berapa frame kartu ditahan di atas scene terakhir. */
      holdFrames: z.number().int().min(45).max(150).default(84),
    })
    .optional(),
});

export const EpisodeSchema = z.object({
  /**
   * Setelan produksi yang tidak mengubah isi cerita.
   *
   * `hud` dulu hanya dibaca lewat cast di renderer, padahal skema ini membuang
   * kunci tak dikenal — jadi nilainya tidak pernah sampai. Sekarang resmi.
   * `transitions` menyimpan jenis transisi antar scene berurutan (jumlahnya
   * scene - 1); kosong berarti renderer memilih sendiri berdasarkan kontras
   * terang/gelap.
   */
  production: z
    .object({
      hud: z.boolean().default(false),
      transitions: z
        .array(
          z.enum([
            "whip_left",
            "whip_right",
            "whip_up",
            "whip_down",
            "flash_white",
            "dip_black",
            "zoom_punch",
          ]),
        )
        .default([]),
      transitionFrames: z.number().int().min(6).max(24).default(12),
      // Catatan internal produksi (dipakai build-longform). Bukan kontrak
      // tayang, tapi harus dideklarasikan supaya tidak dibuang parser.
      subgenre: z.string().optional(),
      experiment: z.string().nullable().optional(),
      structure: z.string().nullable().optional(),
      slate: z.string().optional(),
      format: z.string().optional(),
    })
    .optional(),
  episodeId: z.string().regex(/^(LS|LL)-\d{4}$/, "episodeId harus berbentuk LS-0001 atau LL-0001"),
  title: z.string().min(1),
  language: z.literal("id-ID"),
  category: z.literal("fictional_horror"),
  /** `found_footage` = Short vertikal; `longform_narration` = video panjang 16:9. */
  format: z.enum(["found_footage", "longform_narration"]).default("found_footage"),

  targetFps: z.literal(FPS).default(FPS),
  width: z.union([z.literal(WIDTH), z.literal(HEIGHT)]).default(WIDTH),
  height: z.union([z.literal(HEIGHT), z.literal(WIDTH)]).default(HEIGHT),
  targetDurationSeconds: z.number().min(1).optional(),

  story: z.object({
    hook: z.string().min(1),
    premise: z.string().min(1),
    twist: z.string().min(1),
    ending: z.string().min(1),
  }),

  /** Audio narasi penuh (hasil TTS). Alternatif dari narasi per scene. */
  narrationAudio: z.string().optional(),

  /**
   * Skor musik latar untuk seluruh episode (satu file, panjangnya = episode).
   * Musik tidak di-loop per scene: restart tiap cut justru membunuh tensi.
   */
  score: z
    .object({
      assetId: z.string().min(1),
      volume: z.number().min(0).max(1).default(0.8),
    })
    .optional(),

  /**
   * Jump scare yang direncanakan — bukan kejutan acak.
   * Maksimum 3 per Shorts; lebih dari itu penonton jadi kebal.
   */
  jumpscares: z
    .array(
      z.object({
        atFrame: z.number().int().nonnegative(),
        /** Still pengganti hanya untuk episode legacy. */
        image: z.string().optional(),
        /** Footage scare bergerak; wajib untuk produksi baru. */
        motionVideo: z.string().min(1).optional(),
        assetId: z.string().min(1),
        volume: z.number().min(0).max(1).default(1),
        /** Intensitas kilatan putih 0–1. */
        flash: z.number().min(0).max(1).default(0.8),
        /** Intensitas guncangan kamera 0–1. */
        shake: z.number().min(0).max(1).default(0.9),
        /** Zoom burst saat scare (1 = tanpa zoom). */
        zoom: z.number().min(1).max(2.5).default(1.35),
        /** Durasi efek visual dalam frame. */
        durationFrames: z.number().int().min(4).max(45).default(14),
      }),
    )
    .max(3)
    .default([]),

  /**
   * Kartu teks besar sebagai tanda baca ritme (mis. "JANGAN DIBUKA").
   * Maksimum 4–5 per episode; ini bukan subtitle.
   */
  onScreenText: z
    .array(
      z.object({
        text: z.string().min(1).max(32),
        startFrame: z.number().int().nonnegative(),
        endFrame: z.number().int().positive(),
      }),
    )
    .max(5)
    .default([]),

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

  const longform = episode.format === "longform_narration";
  const [minSeconds, maxSeconds] = longform
    ? [LONG_MIN_DURATION_SECONDS, LONG_MAX_DURATION_SECONDS]
    : [MIN_DURATION_SECONDS, MAX_DURATION_SECONDS];

  if (totalSeconds < minSeconds || totalSeconds > maxSeconds) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["scenes"],
      message: `total durasi ${totalSeconds.toFixed(1)}s di luar rentang ${longform ? "video panjang" : "Shorts"} yang diizinkan (${minSeconds}–${maxSeconds}s)`,
    });
  }

  // Orientasi harus salah satu dari dua yang punya komposisi, bukan kombinasi acak.
  const vertical = episode.width === WIDTH && episode.height === HEIGHT;
  const horizontal = episode.width === HEIGHT && episode.height === WIDTH;
  if (!vertical && !horizontal) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["width"],
      message: `orientasi ${episode.width}×${episode.height} tidak dikenal (harus 1080×1920 atau 1920×1080)`,
    });
  } else if (longform !== horizontal) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["width"],
      message: longform
        ? "format longform_narration harus 1920×1080 (mendatar)"
        : "format found_footage harus 1080×1920 (vertikal)",
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

    let previousCut = 0;
    scene.cuts.forEach((cut, cutIndex) => {
      if (cut.atFrame <= previousCut) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [...path, "cuts", cutIndex, "atFrame"],
          message: `cut harus naik (${cut.atFrame} setelah ${previousCut})`,
        });
      }
      if (cut.atFrame >= scene.durationFrames) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [...path, "cuts", cutIndex, "atFrame"],
          message: `cut di frame ${cut.atFrame} berada di luar durasi scene (${scene.durationFrames})`,
        });
      }
      previousCut = cut.atFrame;
    });

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

  let previousScare = -1;
  episode.jumpscares.forEach((scare, index) => {
    const path = ["jumpscares", index] as const;
    if (scare.atFrame <= previousScare) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [...path, "atFrame"],
        message: "jumpscare harus berurutan dan tidak boleh menumpuk",
      });
    }
    if (scare.atFrame + scare.durationFrames > totalFrames) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [...path],
        message: "jumpscare melewati akhir episode",
      });
    }
    // Scare di 5 detik pertama membuang hook; penonton belum punya konteks.
    if (scare.atFrame < 150) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [...path, "atFrame"],
        message: "jumpscare terlalu awal (<5 detik): tidak ada tensi yang bisa dipecahkan",
      });
    }
    previousScare = scare.atFrame;
  });

  let previousTextEnd = -1;
  episode.onScreenText.forEach((item, index) => {
    const path = ["onScreenText", index] as const;
    if (item.endFrame <= item.startFrame) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [...path],
        message: "endFrame kartu teks harus lebih besar dari startFrame",
      });
    }
    if (item.endFrame > totalFrames) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [...path],
        message: `kartu teks melewati durasi episode (${item.endFrame} > ${totalFrames})`,
      });
    }
    if (item.startFrame <= previousTextEnd) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [...path],
        message: "kartu teks overlap dengan kartu sebelumnya",
      });
    }
    previousTextEnd = item.endFrame;
  });

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
