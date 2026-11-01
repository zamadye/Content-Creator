/**
 * EDITORIAL VIDEO — composition root
 * ----------------------------------
 * The composition owns: timeline order, scene windows, caption layer, global defs.
 * It owns none of the art direction — that lives in scenes/ and illustration/.
 * Scene order and durations come from content/timeline.generated.ts (machine-generated
 * from real voice-over durations), so re-recording narration re-times the film.
 */
import React from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame } from '../runtime';
import { GlobalDefs } from '../components/GlobalDefs';
import { SCENES } from '../scenes';
import { Caption } from '../typography';
import { layout, palette } from '../../../design/tokens';
import type { Timeline } from '../content/types';
import { fade } from '../animations';

const CaptionLayer: React.FC<{ text: string[]; d: number }> = ({ text, d }) => {
  const frame = useCurrentFrame();
  const opacity = fade(frame, 0, 5, Math.max(5, d - 5), 5);
  return <Caption text={text} opacity={opacity} />;
};

export const EditorialVideo: React.FC<{ timeline: Timeline }> = ({ timeline }) => {
  return (
    <AbsoluteFill>
      <GlobalDefs />
      <rect x={0} y={0} width={layout.video.width} height={layout.video.height} fill={palette.ink} />

      {timeline.scenes.map((scene) => {
        const Scene = SCENES[scene.id];
        if (!Scene) {
          // Fail loudly in the render log rather than silently skipping a beat.
          console.warn(`[composition] unknown scene id: ${scene.id}`);
          return null;
        }
        return (
          <Sequence key={scene.id} from={scene.startFrame} durationInFrames={scene.durationInFrames} name={scene.id}>
            <Scene d={scene.durationInFrames} />
          </Sequence>
        );
      })}

      {timeline.captions.map((cue, i) => (
        <Sequence key={`cap-${i}`} from={cue.startFrame} durationInFrames={cue.durationInFrames} name={`caption-${i}`}>
          <CaptionLayer text={cue.text} d={cue.durationInFrames} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
