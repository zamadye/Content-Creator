import React from 'react';
import {Composition} from 'remotion';
import {Episode, EPISODE_DURATION_IN_FRAMES, FPS} from './Episode';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="EP01"
      component={Episode}
      durationInFrames={EPISODE_DURATION_IN_FRAMES}
      fps={FPS}
      width={1920}
      height={1080}
    />
  );
};
