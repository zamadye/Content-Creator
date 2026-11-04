import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { theme } from "../lib/theme";

/**
 * Frame pembuka = thumbnail kanal.
 *
 * Kenapa dibakar ke video: YouTube tidak mengizinkan pemilihan thumbnail lewat
 * API untuk akun ini, jadi frame pertama adalah satu-satunya thumbnail yang
 * benar-benar kita kendalikan. Frame ini harus lolos dua ujian sekaligus:
 *
 *  1. Sebagai thumbnail 9:16 di feed — headline besar, 2–3 kata kunci, terbaca
 *     dalam sepersekian detik di layar kecil.
 *  2. Sebagai detik pertama video — tidak boleh terasa seperti poster statis,
 *     jadi ada dorongan kamera pelan dan satu potongan keras di akhir.
 *
 * Aturan tata letak: headline di sepertiga atas (titik pandang pertama), wajah
 * atau subjek horor di tengah-bawah, kicker kecil di atas headline, dan tanda
 * kanal di bawah agar identitas tetap terbaca walau di-crop.
 */
export const ThumbnailCard: React.FC<{
  headline: string;
  kicker?: string;
  image: string;
  durationInFrames: number;
  episodeId: string;
}> = ({ headline, kicker, image, durationInFrames, episodeId }) => {
  const frame = useCurrentFrame();

  // Dorongan pelan: 1.0 → 1.045. Cukup untuk terasa hidup, tidak menggeser teks.
  const scale = interpolate(frame, [0, durationInFrames], [1.0, 1.045], {
    extrapolateRight: "clamp",
  });

  // Bar aksen tumbuh di 4 frame pertama; setelah itu diam (tidak berkedip).
  const barWidth = interpolate(frame, [0, 4], [0, 190], { extrapolateRight: "clamp" });

  // Ukuran headline menyesuaikan panjang agar tetap 2 baris maksimal.
  const fontSize = headline.length > 26 ? 84 : headline.length > 18 ? 96 : 110;

  return (
    <AbsoluteFill style={{ backgroundColor: theme.colors.black }}>
      <AbsoluteFill style={{ transform: `scale(${scale})` }}>
        <Img
          src={staticFile(image)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>

      {/* Gradasi: gelap di atas untuk teks, gelap di bawah untuk tanda kanal. */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.35) 34%, rgba(0,0,0,0.15) 55%, rgba(0,0,0,0.85) 100%)",
        }}
      />

      <AbsoluteFill style={{ padding: "150px 64px 120px", justifyContent: "space-between" }}>
        <div>
          {kicker ? (
            <div
              style={{
                fontFamily: theme.font.mono,
                fontSize: 28,
                letterSpacing: 7,
                color: theme.colors.amber,
                textTransform: "uppercase",
                marginBottom: 18,
                textShadow: "0 2px 18px rgba(0,0,0,0.9)",
              }}
            >
              {kicker}
            </div>
          ) : null}

          <div
            style={{
              fontFamily: theme.font.sans,
              fontWeight: 800,
              fontSize,
              lineHeight: 1.02,
              letterSpacing: 1,
              textTransform: "uppercase",
              color: "#ffffff",
              textShadow: "0 8px 34px rgba(0,0,0,0.95), 0 0 90px rgba(0,0,0,0.8)",
            }}
          >
            {headline}
          </div>

          <div
            style={{
              marginTop: 22,
              width: barWidth,
              height: 6,
              backgroundColor: theme.colors.signal,
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            fontFamily: theme.font.mono,
            fontSize: 24,
            letterSpacing: 5,
            color: theme.colors.fog,
          }}
        >
          <span>THE LAST SIGNAL</span>
          <span>{episodeId} · FIKSI</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
