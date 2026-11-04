import React from "react";
import { Audio, interpolate, Sequence, staticFile, useVideoConfig } from "remotion";
import type { ParsedEpisode } from "@the-last-signal/contracts";
import { sceneOffsets } from "@the-last-signal/contracts";

const FADE = 12;
/** Ambience ditekan selama narasi berjalan supaya suara narator selalu di depan. */
const DUCK_LEVEL = 0.38;

/**
 * Empat layer audio: narasi, ambience, SFX, impact.
 *
 * Narasi ada di depan mix. Ambience di-loop per scene dengan fade anti-klik dan
 * ducking otomatis selama narasi. SFX ditempatkan frame-exact dari episode.json.
 */
export const Soundscape: React.FC<{ episode: ParsedEpisode }> = ({ episode }) => {
  const { fps } = useVideoConfig();
  const offsets = sceneOffsets(episode);

  /** Window narasi per scene (frame global), dipakai untuk ducking musik. */
  const narrationWindows = episode.scenes.flatMap((scene, index) =>
    scene.narrationAudio
      ? [{ from: offsets[index], to: offsets[index] + scene.durationFrames }]
      : [],
  );

  return (
    <>
      {episode.narrationAudio ? <Audio src={staticFile(episode.narrationAudio)} volume={1} /> : null}

      {/* Skor musik: satu track untuk seluruh episode, bukan loop per scene.
          Musik ditekan saat narasi berjalan, naik di jeda — seperti mixing film. */}
      {episode.score ? (
        <Audio
          src={staticFile(episode.score.assetId)}
          volume={(frame) => {
            const narrationWindow = narrationWindows.find(
              (window) => frame >= window.from && frame <= window.to,
            );
            const duck = narrationWindow ? 0.34 : 1;
            return episode.score!.volume * duck;
          }}
        />
      ) : null}

      {/* Stinger jump scare. */}
      {episode.jumpscares.map((scare, index) => (
        <Sequence
          key={`scare-audio-${index}`}
          from={scare.atFrame}
          durationInFrames={Math.max(1, Math.round(fps * 2))}
          name={`stinger ${index + 1}`}
        >
          <Audio src={staticFile(scare.assetId)} volume={scare.volume} />
        </Sequence>
      ))}

      {episode.scenes.map((scene, sceneIndex) => {
        const from = offsets[sceneIndex];
        const duration = scene.durationFrames;
        const ambience = scene.audio.ambienceId;
        const hasNarration = Boolean(scene.narrationAudio);
        // Narasi diasumsikan mengisi ~72% awal scene; setelah itu ambience naik lagi.
        const duckEnd = Math.round(duration * 0.72);

        return (
          <React.Fragment key={`audio-${scene.id}`}>
            {scene.narrationAudio ? (
              <Sequence from={from} durationInFrames={duration} name={`narasi ${scene.id}`}>
                <Audio src={staticFile(scene.narrationAudio)} volume={1} />
              </Sequence>
            ) : null}

            {ambience ? (
              <Sequence from={from} durationInFrames={duration} name={`ambience ${scene.id}`}>
                <Audio
                  src={staticFile(ambience)}
                  loop
                  volume={(frame) => {
                    const base = interpolate(
                      frame,
                      [0, FADE, duration - FADE, duration],
                      [0, scene.audio.ambienceVolume, scene.audio.ambienceVolume, 0],
                      { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
                    );
                    if (!hasNarration) return base;
                    const duck = interpolate(frame, [duckEnd - 10, duckEnd], [DUCK_LEVEL, 1], {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                    });
                    return base * duck;
                  }}
                />
              </Sequence>
            ) : null}

            {scene.audio.sfx.map((cue, cueIndex) => (
              <Sequence
                key={`sfx-${scene.id}-${cueIndex}`}
                from={from + cue.startFrame}
                durationInFrames={Math.max(1, Math.round(fps * 4))}
                name={`sfx ${scene.id}.${cueIndex + 1}`}
              >
                <Audio src={staticFile(cue.assetId)} volume={cue.volume} />
              </Sequence>
            ))}
          </React.Fragment>
        );
      })}
    </>
  );
};
