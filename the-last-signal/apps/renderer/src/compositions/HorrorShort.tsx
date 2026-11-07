import React from "react";
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { ParsedEpisode } from "@the-last-signal/contracts";
import { sceneOffsets } from "@the-last-signal/contracts";
import { CinematicScene } from "../components/CinematicScene";
import { CtaCard } from "../components/CtaCard";
import { FilmGrain } from "../components/FilmGrain";
import { FoundFootageHud } from "../components/FoundFootageHud";
import { Jumpscare } from "../components/Jumpscare";
import { OnScreenTextTrack } from "../components/OnScreenText";
import { Soundscape } from "../components/Soundscape";
import { SubtitleTrack } from "../components/SubtitleTrack";
import { ThumbnailCard } from "../components/ThumbnailCard";
import { Vignette } from "../components/Vignette";
import { theme } from "../lib/theme";

const END_CARD_FRAMES = 30;

/** Kartu penutup: sinyal putus, judul arsip, episode id. */
const EndCard: React.FC<{ title: string; episodeId: string }> = ({ title, episodeId }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.black,
        opacity,
        justifyContent: "center",
        alignItems: "center",
        gap: 28,
      }}
    >
      <div
        style={{
          fontFamily: theme.font.sans,
          fontWeight: 700,
          fontSize: 74,
          letterSpacing: 8,
          color: theme.colors.bone,
          textAlign: "center",
          padding: "0 80px",
        }}
      >
        THE LAST SIGNAL
      </div>
      <div
        style={{
          fontFamily: theme.font.sans,
          fontSize: 30,
          color: theme.colors.fog,
          maxWidth: 760,
          textAlign: "center",
          opacity: 0.8,
        }}
      >
        {title}
      </div>
    </AbsoluteFill>
  );
};

export const HorrorShort: React.FC<{ episode: ParsedEpisode }> = ({ episode }) => {
  const { durationInFrames } = useVideoConfig();
  const offsets = sceneOffsets(episode);
  // Kartu penutup menimpa ekor scene terakhir — rekaman "putus" di tengah.
  const endCardFrom = Math.max(0, durationInFrames - END_CARD_FRAMES);
  // Kartu CTA memuat kalimat yang sama dengan subjudul; kalau keduanya tampil
  // bersamaan, teksnya bertumpuk dan tidak terbaca. Subjudul berhenti tepat
  // sebelum kartu CTA masuk.
  const ctaFrom = episode.publishing.cta
    ? Math.max(0, endCardFrom - (episode.publishing.cta.holdFrames ?? 84))
    : endCardFrom;

  return (
    <AbsoluteFill style={{ backgroundColor: theme.colors.black }}>
      {episode.scenes.map((scene, index) => (
        <Sequence
          key={scene.id}
          from={offsets[index]}
          durationInFrames={scene.durationFrames}
          name={`${scene.id} · ${scene.visual.locationId}`}
        >
          <CinematicScene scene={scene} index={index} />
        </Sequence>
      ))}

      <Sequence from={0} durationInFrames={ctaFrom} name="subtitle (sebelum CTA)">
        <SubtitleTrack episode={episode} />
      </Sequence>
      <OnScreenTextTrack episode={episode} />
      {/* HUD rekaman CCTV hanya masuk akal kalau episode MEMANG rekaman kamera.
          Cerita orang pertama ("saya petugas sensus…") tidak punya kamera yang
          merekamnya: stempel REC/CAM langsung membocorkan bahwa ini templat,
          dan pemilik kanal sudah melarang HUD itu untuk narasi orang pertama.
          Jadi bukan format yang menentukan, melainkan pernyataan episode:
          production.hud === true (bawaan: tidak ada HUD). */}
      {(episode as { production?: { hud?: boolean } }).production?.hud === true ? (
        <FoundFootageHud />
      ) : null}
      {episode.jumpscares.map((scare, index) => (
        <Sequence
          key={`scare-${index}`}
          from={scare.atFrame}
          durationInFrames={scare.durationFrames}
          name={`jumpscare ${index + 1}`}
        >
          <Jumpscare scare={scare} />
        </Sequence>
      ))}

      <Vignette strength={0.55} />
      <FilmGrain opacity={0.06} />

      {/* Frame 0 = thumbnail kanal. Dirender di atas grain dan vignette supaya
          teks tetap tajam saat dipotong YouTube jadi gambar kecil. */}
      {episode.publishing.thumbnail ? (
        <Sequence
          from={0}
          durationInFrames={episode.publishing.thumbnail.holdFrames ?? 15}
          name="thumbnail frame"
        >
          <ThumbnailCard
            headline={episode.publishing.thumbnail.headline}
            kicker={episode.publishing.thumbnail.kicker}
            image={episode.publishing.thumbnail.image ?? episode.scenes[0].image}
            durationInFrames={episode.publishing.thumbnail.holdFrames ?? 15}
          />
        </Sequence>
      ) : null}

      {/* Ajakan bertindak: menempel di ekor scene terakhir, setelah payoff,
          sebelum kartu penutup. Kalimatnya sudah diucapkan narasi. */}
      {episode.publishing.cta ? (
        <Sequence
          from={ctaFrom}
          durationInFrames={episode.publishing.cta.holdFrames ?? 84}
          name="cta"
        >
          <CtaCard
            line={episode.publishing.cta.card}
            durationInFrames={episode.publishing.cta.holdFrames ?? 84}
          />
        </Sequence>
      ) : null}

      <Sequence from={endCardFrom} durationInFrames={END_CARD_FRAMES} name="end card">
        <EndCard title={episode.title} episodeId={episode.episodeId} />
      </Sequence>

      <Soundscape episode={episode} />
    </AbsoluteFill>
  );
};
