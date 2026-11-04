import React from "react";
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { ParsedEpisode } from "@the-last-signal/contracts";
import { sceneOffsets } from "@the-last-signal/contracts";
import { CinematicScene } from "../components/CinematicScene";
import { FilmGrain } from "../components/FilmGrain";
import { FoundFootageHud } from "../components/FoundFootageHud";
import { Jumpscare } from "../components/Jumpscare";
import { OnScreenTextTrack } from "../components/OnScreenText";
import { Soundscape } from "../components/Soundscape";
import { SubtitleTrack } from "../components/SubtitleTrack";
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
          fontFamily: theme.font.mono,
          fontSize: 26,
          letterSpacing: 10,
          color: theme.colors.fog,
        }}
      >
        {episodeId} · ARSIP FIKSI
      </div>
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

      <SubtitleTrack episode={episode} />
      <OnScreenTextTrack episode={episode} />
      <FoundFootageHud />
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

      <Sequence from={endCardFrom} durationInFrames={END_CARD_FRAMES} name="end card">
        <EndCard title={episode.title} episodeId={episode.episodeId} />
      </Sequence>

      <Soundscape episode={episode} />
    </AbsoluteFill>
  );
};
