/**
 * S02 — BEAT
 * No narration. The camera simply looks at what a corridor looks like after the hook.
 * Purpose: let the previous sentence land; establish that the "empty chair" is a subject.
 */
import React from 'react';
import { palette } from '../../../design/tokens';
import { Corridor } from '../illustration/environments';
import { Character } from '../illustration/figures';
import { Chair, SchoolBag } from '../illustration/props';
import { Ellipse, Rect } from '../illustration/primitives';
import { SceneShell } from '../components/SceneShell';
import { blinkAt, breathe, cam, pan } from '../animations';
import { useCurrentFrame } from '../runtime';

const SEATS = [
  { x: 300, kind: 'student', flip: true },
  { x: 560, kind: 'student', flip: true },
  { x: 820, kind: 'empty', flip: true },
] as const;

export const S02Corridor: React.FC<{ d: number }> = ({ d }) => {
  const frame = useCurrentFrame();
  const dx = pan(frame, 0, d, 46, -52);
  const b1 = breathe(frame, 30, 1.4, 0.3);
  const b2 = breathe(frame, 30, 1.1, 2.1);

  return (
    <SceneShell durationInFrames={d} bg={palette.nightDeep} dipIn={4} dipOut={6} vignette={1} showBrand={false} illustration>
      <g transform={cam(1.06, 540, 1200, dx, 0)}>
        <Corridor dusk={0.25} lights={0.4} />

        {/* floor line under the row of chairs */}
        <Rect x={0} y={1428} w={1080} h={5} fill={palette.ink} opacity={0.25} />

        {SEATS.map((seat, i) => {
          const b = i === 0 ? b1 : b2;
          return (
            <g key={i}>
              <Chair x={seat.x} y={1440} s={1.08} flip color={palette.tealLight} />
              {seat.kind === 'student' && (
                <g>
                  <Ellipse cx={seat.x} cy={1444} rx={92} ry={13} fill={palette.ink} opacity={0.24} />
                  <Character
                    kind="anak"
                    x={seat.x + 4}
                    y={1440}
                    height={520}
                    flip
                    pose={{
                      torso: 8 + b * 0.5,
                      head: 22,
                      headTurn: 0.4,
                      hipDrop: 118,
                      armA: [-8, -18],
                      armB: [-70, -26],
                      legA: [86, -84],
                      legB: [92, -88],
                    }}
                    expression={i === 0 ? 'tired' : 'sad'}
                    blink={blinkAt(frame, 30, 11 + i * 5, 3.4 + i)}
                    gaze={0.3}
                  />
                </g>
              )}
              {seat.kind === 'empty' && (
                <g opacity={0.95}>
                  <SchoolBag x={seat.x + 6} y={1372} s={0.9} flip />
                  <Ellipse cx={seat.x + 6} cy={1374} rx={54} ry={9} fill={palette.ink} opacity={0.2} />
                </g>
              )}
            </g>
          );
        })}

        {/* a water bottle left on the floor — evidence of an interrupted day */}
        <g opacity={0.9}>
          <Rect x={676} y={1470} w={26} h={68} r={10} fill={palette.coolLight} opacity={0.75} />
          <Rect x={681} y={1478} w={16} h={22} r={6} fill={palette.paper} opacity={0.5} />
        </g>
      </g>
    </SceneShell>
  );
};
