import React from "react";
import { Composition } from "remotion";
import { ParsedEpisodeSchema, totalFrames } from "@the-last-signal/contracts";
import type { ParsedEpisode } from "@the-last-signal/contracts";
// Fixture, BUKAN episode tertentu: dulu berkas ini mengimpor
// projects/episodes/LS-0001/episode.json, sehingga render episode apa pun gagal
// begitu LS-0001 diarsipkan. Nilai di sini hanya default — render selalu
// mengirim episode sebenarnya lewat inputProps + calculateMetadata.
import sampleEpisodeJson from "./fixture-episode.json";
import { HorrorShort } from "./compositions/HorrorShort";

const sampleEpisode = sampleEpisodeJson as unknown as ParsedEpisode;

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="HorrorShort"
      component={HorrorShort}
      durationInFrames={totalFrames(sampleEpisode)}
      fps={sampleEpisode.targetFps}
      width={sampleEpisode.width}
      height={sampleEpisode.height}
      defaultProps={{ episode: sampleEpisode }}
      calculateMetadata={({ props }) => {
        // Validasi dijalankan sebelum composition menerima data.
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
  );
};
