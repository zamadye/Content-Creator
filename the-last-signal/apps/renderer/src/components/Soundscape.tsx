import React from "react";
import { Audio, interpolate, Sequence, staticFile, useVideoConfig } from "remotion";
import type { ParsedEpisode } from "@the-last-signal/contracts";
import { sceneOffsets } from "@the-last-signal/contracts";

const FADE = 12;

/**
 * Empat layer audio: narasi, ambience, SFX, impact.
 * Ambience di-loop per scene dengan fade in/out supaya tidak ada lompatan
 * klik saat cut.
 */
export const Soundscape: React.FC<{ episode: ParsedEpisode }> = ({ episode }) => {
  const { fps } = useVideoConfig();
  const offsets = sceneOffsets(episode);

  return (
    <>
      {episode.narrationAudio ? (
        <Audio src={staticFile(episode.narrationAudio)} volume={1} />
      ) : null}

      {episode.scenes.map((scene, sceneIndex) => {
        const from = offsets[sceneIndex];
        const duration = scene.durationFrames;
        const ambience = scene.audio.ambienceId;

        return (
          <React.Fragment key={`audio-${scene.id}`}>
            {ambience ? (
              <Sequence from={from} durationInFrames={duration} name={`ambience ${scene.id}`}>
                <Audio
                  src={staticFile(ambience)}
                  loop
                  volume={(f) =>
                    interpolate(
                      f,
                      [0, FADE, duration - FADE, duration],
                      [0, scene.audio.ambienceVolume, scene.audio.ambienceVolume, 0],
                      { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
                    )
                  }
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
