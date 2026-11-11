import React from "react";
import { Composition } from "remotion";
import { ParsedEpisodeSchema, totalFrames } from "@the-last-signal/contracts";
import type { ParsedEpisode } from "@the-last-signal/contracts";
// Fixture, BUKAN episode tertentu: render umum mengirim episode lewat inputProps.
import sampleEpisodeJson from "./fixture-episode.json";
import { HorrorShort } from "./compositions/HorrorShort";
import { LS0020Revisi01, LS0020RevisionMeta } from "./compositions/LS0020Revisi01";

const sampleEpisode = sampleEpisodeJson as unknown as ParsedEpisode;

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="HorrorShort"
      component={HorrorShort}
      durationInFrames={totalFrames(sampleEpisode)}
      fps={sampleEpisode.targetFps}
      width={sampleEpisode.width}
      height={sampleEpisode.height}
      defaultProps={{ episode: sampleEpisode }}
      calculateMetadata={({ props }) => {
        const episode = ParsedEpisodeSchema.parse(props.episode);
        return {
          durationInFrames: totalFrames(episode),
          fps: episode.targetFps,
          width: episode.width,
          height: episode.height,
          props: { episode },
        };
      }}
    />
    <Composition
      id="LS0020Revisi01"
      component={LS0020Revisi01}
      durationInFrames={LS0020RevisionMeta.durationInFrames}
      fps={LS0020RevisionMeta.fps}
      width={LS0020RevisionMeta.width}
      height={LS0020RevisionMeta.height}
      defaultProps={{}}
    />
  </>
);
