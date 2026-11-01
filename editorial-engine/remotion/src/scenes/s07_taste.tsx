/**
 * S07 — DEVELOPMENT (the taster, and the loop)
 * A teacher tastes first. Three children wait. Then the institutional reflex:
 * close temporarily, apologise, reopen — stamped three times in rhythm.
 * Hierarchy: 1) the spoon 2) the waiting plates 3) the stamp loop.
 */
import React from 'react';
import { palette } from '../../../design/tokens';
import { Classroom } from '../illustration/environments';
import { Character, limbEndPoint } from '../illustration/figures';
import { Plate, SchoolDesk } from '../illustration/props';
import { Ellipse, Rect, Scrim, T } from '../illustration/primitives';
import { SceneShell } from '../components/SceneShell';
import { Kicker } from '../typography';
import { blinkAt, breathe, cam, fade, impact } from '../animations';
import { Easing, interpolate, useCurrentFrame } from '../runtime';

const STAMPS = [0.34, 0.48, 0.62];

export const S07Taste: React.FC<{ d: number }> = ({ d }) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, d], [1.02, 1.08], { easing: Easing.editorial, extrapolateRight: 'clamp' });
  const taste = interpolate(frame, [10, Math.round(d * 0.26), Math.round(d * 0.5)], [0, 1, 0.25], {
    easing: Easing.editorial,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const b1 = breathe(frame, 30, 1.1, 0.8);
  const b2 = breathe(frame, 30, 0.9, 2.0);
  const b3 = breathe(frame, 30, 1.4, 3.1);
  const loopIn = fade(frame, Math.round(d * 0.3), 16);
  const guruPose = {
    torso: 3,
    head: 10 - taste * 12,
    headTurn: 0.1,
    armA: [40 + taste * 46, -58 - taste * 44] as [number, number],
    armB: [10, -14] as [number, number],
    legA: [6, -4] as [number, number],
    legB: [-7, -4] as [number, number],
  };
  const spoon = limbEndPoint('guru', { x: 400, y: 1738 + b1, height: 700 }, 'A', guruPose.armA);

  return (
    <SceneShell durationInFrames={d} bg={palette.tealDeep} illustration source="Sumber: The Conversation/CELIOS (Sep 2026)">
      <g transform={cam(scale, 540, 1150)}>
        <Classroom dusk={0.15} />

        {/* --- children waiting, plates untouched --- */}
        <g>
          <Character
            kind="anak"
            x={806}
            y={1560 + b2}
            height={520}
            pose={{ torso: 4, head: 8, headTurn: -0.4, armA: [16, -14], armB: [-10, -22], legA: [5, -3], legB: [-6, -3] }}
            expression="worried"
            blink={blinkAt(frame, 30, 6, 3.2)}
            gaze={-0.5}
          />
          <SchoolDesk x={812} y={1640} s={2.2} flip />
          <Plate x={812} y={1612} s={0.8} />
        </g>

        <g>
          <Character
            kind="anak"
            x={916}
            y={1500 + b3}
            height={462}
            pose={{ torso: 2, head: 12, headTurn: -0.2, armA: [12, -10], armB: [-8, -18], legA: [4, -2], legB: [-5, -3] }}
            expression="tired"
            blink={blinkAt(frame, 30, 14, 4.1)}
            opacity={0.95}
          />
          <SchoolDesk x={922} y={1560} s={1.85} flip />
        </g>

        {/* --- the teacher tasting before the children eat --- */}
        <Ellipse cx={400} cy={1742} rx={160} ry={22} fill={palette.ink} opacity={0.24} />
        <Character
          kind="guru"
          x={400}
          y={1738 + b1}
          height={700}
          pose={guruPose}
          expression={taste > 0.6 ? 'firm' : 'neutral'}
          blink={blinkAt(frame, 30, 22, 3.6)}
          mouthOpen={taste * 0.2}
        />

        {/* spoon — positioned from the rig's actual hand, never guessed */}
        <g transform={`translate(${spoon.x} ${spoon.y}) rotate(${spoon.angle - 90})`}>
          <Rect x={-6} y={-74} w={12} h={86} r={6} fill={palette.paperShadow} />
          <Ellipse cx={0} cy={-82} rx={17} ry={21} fill={palette.paperDim} />
          <Ellipse cx={0} cy={-84} rx={11} ry={14} fill={palette.olive} opacity={taste > 0.5 ? 0.45 : 0.9} />
        </g>

        {/* the plate he tastes from */}
        <Plate x={256} y={1700} s={1.1} tilt={-4} />
      </g>

      {/* --- the institutional loop, stamped --- */}
      <Scrim x={0} y={230} w={1080} h={250} direction="down" opacity={0.72} />
      <g opacity={loopIn}>
        <Kicker x={72} y={330} text="RESPONS BERULANG" color={palette.brickLight} />
        <T x={72} y={392} size={26} weight={500} tracking={0.6} fill={palette.sage} opacity={0.9}>
          tutup sementara · minta maaf · buka lagi
        </T>
      </g>

      {STAMPS.map((at, i) => {
        const p = impact(frame, Math.round(d * at), 14);
        if (p <= 0) return null;
        const y = 355 + i * 96;
        const rotate = -3.4 + i * 1.1;
        return (
          <g key={i} opacity={Math.min(1, p * 1.4)} transform={`translate(${700} ${y}) rotate(${rotate}) scale(${0.86 + p * 0.14})`}>
            <Rect x={-136} y={-27} w={272} h={54} r={6} fill={palette.ink} opacity={0.55} />
            <Rect x={-136} y={-27} w={272} h={54} r={6} fill="none" stroke={palette.brickLight} strokeWidth={3} opacity={0.85} />
            <T x={0} y={9} size={22} weight={700} tracking={2} fill={palette.brickLight} anchor="middle">
              DITUTUP SEMENTARA
            </T>
          </g>
        );
      })}
    </SceneShell>
  );
};
