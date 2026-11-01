import React from 'react';
import { FrameProvider } from '../remotion/src/runtime';
import { Character } from '../remotion/src/illustration/figures';
import { Rect, T } from '../remotion/src/illustration/primitives';
import { renderPng } from '../pipeline/runtime/ssr';

const W = 900, H = 1100;
const el = (
  <FrameProvider frame={0} fps={30} width={W} height={H} durationInFrames={1}>
    <g>
      <Rect x={0} y={0} w={W} h={H} fill="#8FA298" />
      <Character kind="anak" x={450} y={1050} height={980} />
      {[0,1,2,3].map(i => <Rect key={i} x={0} y={i*100} w={40} h={100} fill="#000" opacity={0.06} />)}
    </g>
  </FrameProvider>
);
renderPng(el as React.ReactElement, W, H, 'rendering/previews/debug-zoom.png');
console.log('ok');
