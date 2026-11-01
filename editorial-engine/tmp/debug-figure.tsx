import React from 'react';
import { FrameProvider } from '../remotion/src/runtime';
import { Character } from '../remotion/src/illustration/figures';
import { Rect, T } from '../remotion/src/illustration/primitives';
import { renderPng } from '../pipeline/runtime/ssr';

const W = 1500, H = 1200;
const el = (
  <FrameProvider frame={0} fps={30} width={W} height={H} durationInFrames={1}>
    <g>
      <Rect x={0} y={0} w={W} h={H} fill="#8FA298" />
      {[300, 700, 1100].map((x, i) => (
        <g key={i}>
          <Rect x={x - 200} y={100} w={400} h={1000} fill="#7C8C82" opacity={0.5} />
          <Character kind="anak" x={x} y={1000} height={820} expression="neutral" pose={{ headTurn: 0, armA: [17, 7], armB: [-17, -7] }} />
        </g>
      ))}
      <T x={40} y={1140} size={22} fill="#141713">RIG DEBUG — anak @ height 820, arm 17 deg</T>
    </g>
  </FrameProvider>
);
renderPng(el as React.ReactElement, W, H, 'rendering/previews/debug-figure.png');
console.log('ok');
