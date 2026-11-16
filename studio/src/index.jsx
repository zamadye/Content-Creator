import React from 'react';
import {registerRoot, Composition} from 'remotion';
import {StudioStory, studioMetadata} from './studio/StudioStory.jsx';
import {storyPacks} from '../stories/index.js';

/*
 * Titik masuk Remotion. Framework ini TIDAK tahu cerita apa pun:
 *
 *   1. setiap `stories/<dir>/story.json` menjadi komposisi `<Studio><Dir>`
 *      yang digerakkan `StudioStory` (jalur generik: naskah → shot → video),
 *   2. setiap `stories/<dir>/compositions.jsx` boleh mendaftarkan komposisi
 *      manual tambahan (adegan studi, versi VO, dsb.).
 *
 * Menambah cerita baru cukup dengan menambah folder di `stories/`.
 */
const RawComposition = ({id, component, defaultProps, durationInFrames, width, height, fps, calculateMetadata}) => (
  <Composition
    id={id}
    component={component}
    defaultProps={defaultProps}
    durationInFrames={durationInFrames}
    width={width ?? 1920}
    height={height ?? 1080}
    fps={fps ?? 30}
    calculateMetadata={calculateMetadata}
  />
);

const Root = () => (
  <>
    {storyPacks.map((pack) => (
      <Composition
        key={pack.compositionId}
        id={pack.compositionId}
        component={StudioStory}
        defaultProps={{story: pack.story}}
        calculateMetadata={studioMetadata}
        width={pack.story.width ?? 1920}
        height={pack.story.height ?? 1080}
        fps={pack.story.fps ?? 30}
        durationInFrames={Math.max(1, Math.round((pack.story.shots ?? []).reduce((s, x) => s + (x.duration ?? 0), 0) * (pack.story.fps ?? 30)))}
      />
    ))}
    {storyPacks.flatMap((pack) => pack.compositions.map((c) => <RawComposition key={c.id} {...c} />))}
  </>
);

registerRoot(Root);
