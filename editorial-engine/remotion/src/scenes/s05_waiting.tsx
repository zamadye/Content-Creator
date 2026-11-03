/**
 * S05 — BEAT (the room the statistics don't show)
 * Silent scene. A mother, a child, a drip stand, late light.
 * Camera is almost static: this is a held breath, not a reveal.
 */
import React from 'react';
import { palette } from '../../../design/tokens';
import { WaitingRoom } from '../illustration/environments';
import { Character } from '../illustration/figures';
import { Bench, IVStand } from '../illustration/props';
import { Ellipse } from '../illustration/primitives';
import { SceneShell } from '../components/SceneShell';
import { blinkAt, breathe, handheld } from '../animations';
import { useCurrentFrame } from '../runtime';

export const S05Waiting: React.FC<{ d: number }> = ({ d }) => {
  const frame = useCurrentFrame();
  const hh = handheld(frame, 1.2);
  const motherBreath = breathe(frame, 30, 1.3, 0.2);
  const childBreath = breathe(frame, 30, 1.8, 1.4);
  const blinkMother = blinkAt(frame, 30, 4, 4.4);
  const blinkChild = blinkAt(frame, 30, 12, 5.2);
  const curtain = Math.sin(frame * 0.035) * 3;

  return (
    <SceneShell durationInFrames={d} bg={palette.tealDeep} dipIn={6} dipOut={8} illustration source={null} showBrand>
      <g transform={`translate(${hh.dx} ${hh.dy})`}>
        <g transform="translate(-120 -250) scale(1.34)">
        <WaitingRoom dusk={0.7} />

        {/* curtain drifting in the window light */}
        <g opacity={0.5}>
          <path
            d={`M 640 300 q ${30 + curtain} 210 ${10 + curtain * 1.4} 420 q -24 -6 -40 -12 q 18 -204 -6 -408 Z`}
            fill={palette.paper}
            opacity={0.55}
          />
        </g>

        {/* bench */}
        <Bench x={580} y={1560} s={2.7} seats={3} />
        <Ellipse cx={470} cy={1562} rx={220} ry={16} fill={palette.ink} opacity={0.2} />

        {/* mother, seated, holding her child */}
        <Character
          kind="ibu"
          x={430}
          y={1560 + motherBreath * 0.5}
          height={620}
          pose={{
            torso: 4,
            head: 10,
            headTurn: 0.45,
            hipDrop: 150,
            armA: [34, -64],
            armB: [-10, -26],
            legA: [86, -84],
            legB: [92, -88],
          }}
          expression="sad"
          blink={blinkMother}
          gaze={0.25}
          mouthOpen={0}
        />

        {/* child leaning into her lap */}
        <Character
          kind="anak"
          x={636}
          y={1560 + childBreath * 0.6}
          height={452}
          pose={{
            torso: -12,
            head: -22,
            headTurn: -0.3,
            hipDrop: 112,
            armA: [24, -18],
            armB: [-14, -26],
            legA: [84, -82],
            legB: [88, -86],
          }}
          expression="sick"
          blink={blinkChild * 0.4}
          mouthOpen={0.12}
        />

        {/* drip stand */}
        <IVStand x={880} y={1572} s={1.7} drip={0.4} />

        {/* folded blanket + a plastic bag of belongings on the bench */}
        <g opacity={0.95}>
          <Ellipse cx={800} cy={1508} rx={54} ry={12} fill={palette.clayLight} opacity={0.85} />
          <Ellipse cx={800} cy={1498} rx={48} ry={10} fill={palette.clay} opacity={0.7} />
        </g>
        </g>
      </g>
    </SceneShell>
  );
};
