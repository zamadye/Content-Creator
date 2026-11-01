/**
 * S01 — HOOK
 * A normal classroom at lunch, one second before it stops being normal.
 *
 * Visual hierarchy:  1) the boy bent over his desk  2) the plate he never finished
 * 3) the classmate reaching for him  4) the room / the teacher leaving.
 * The scene states the situation without narration doubling it: the room is telling us
 * something is wrong before the voice-over says it.
 */
import React from 'react';
import { palette, type as t } from '../../../design/tokens';
import { Classroom } from '../illustration/environments';
import { Character } from '../illustration/figures';
import { Chair, Plate, SchoolDesk } from '../illustration/props';
import { Ellipse, Rect, T } from '../illustration/primitives';
import { SceneShell } from '../components/SceneShell';
import { blinkAt, breathe, cam, pushIn } from '../animations';
import { Easing, interpolate, useCurrentFrame } from '../runtime';

export const S01Hook: React.FC<{ d: number }> = ({ d }) => {
  const frame = useCurrentFrame();
  const scale = pushIn(frame, { dur: d, from: 1.03, to: 1.14 });
  const tremor = Math.sin(frame * 1.9) * clamp01((frame - 30) / 45) * 2.6;
  const kidBreathe = breathe(frame, 30, 1.5);
  const blinkA = blinkAt(frame, 30, 3, 3.1);
  const blinkB = blinkAt(frame, 30, 9, 4.2);
  const blinkT = blinkAt(frame, 30, 17, 3.6);
  const dateIn = interpolate(frame, [18, 46], [0, 1], { easing: Easing.editorial, extrapolateRight: 'clamp' });

  return (
    <SceneShell durationInFrames={d} bg={palette.tealDeep} illustration source="Kejadian: Kudus, Januari 2026 — BBC News Indonesia">
      <g transform={cam(scale, 420, 1280)}>
        <Classroom dusk={0} />

        {/* ---- background: teacher leaving the room mid-lesson ---- */}
        <Character
          kind="guru"
          x={196}
          y={1560}
          height={432}
          pose={{ torso: 5, head: -4, armA: [30, -16], armB: [-26, -12], legA: [24, -10], legB: [-26, -8] }}
          expression="firm"
          blink={blinkT}
          opacity={0.95}
        />

        {/* ---- midground: one desk, pushed to the right, at a different depth ---- */}
        <g opacity={0.96}>
          <SchoolDesk x={944} y={1584} s={2.1} flip />
          <Chair x={944} y={1584} s={2.1} flip />
        </g>

        {/* ---- main subject: the student the meal has stopped agreeing with ---- */}
        <g transform={`translate(${tremor} 0)`}>
          <Ellipse cx={368} cy={1700} rx={132} ry={19} fill={palette.ink} opacity={0.3} />
          <Character
            kind="anak"
            x={368}
            y={1700 + kidBreathe * 0.6}
            height={600}
            pose={{
              torso: 13 + kidBreathe * 0.7,
              head: 24,
              headTurn: 0.18,
              // one hand pressed against the stomach, the other hanging
              armA: [26, -62],
              armB: [-4, -30],
              legA: [7, -5],
              legB: [-6, -2],
            }}
            expression="sick"
            blink={blinkA * 0.55}
            mouthOpen={0.2 + kidMouth(frame)}
            gaze={-0.2}
          />
        </g>

        {/* ---- second subject: classmate reaching for him ---- */}
        <Ellipse cx={760} cy={1716} rx={118} ry={17} fill={palette.ink} opacity={0.28} />
        <Character
          kind="anak"
          x={760}
          y={1716}
          height={556}
          flip
          pose={{
            torso: -6,
            head: 8,
            headTurn: -0.5,
            // reaching towards the other student
            armA: [56, -34],
            armB: [-10, -8],
            legA: [-9, -3],
            legB: [12, -5],
          }}
          expression="worried"
          blink={blinkB}
          mouthOpen={0.3}
        />

        {/* ---- the meal nobody finished ---- */}
        <g transform="rotate(-5 250 1706)">
          <Plate x={196} y={1886} s={1.05} tilt={2} />
        </g>
        <g opacity={0.9}>
          <Plate x={612} y={1892} s={0.86} empty tilt={-8} />
        </g>
        {[
          { x: 300, y: 1880, r: 5 },
          { x: 332, y: 1894, r: 4 },
          { x: 282, y: 1902, r: 3.4 },
          { x: 354, y: 1876, r: 3 },
        ].map((p, i) => (
          <Ellipse key={i} cx={p.x} cy={p.y} rx={p.r * 1.7} ry={p.r} fill={palette.white} opacity={0.6} />
        ))}

        {/* ---- foreground: near desk edge (depth + surface for a second plate) ---- */}
        <Rect x={-40} y={1844} w={1180} h={220} r={10} fill={palette.clayDeep} />
        <Rect x={-40} y={1844} w={1180} h={16} r={6} fill={palette.clay} opacity={0.92} />
        <Rect x={-40} y={1860} w={1180} h={34} fill={palette.ink} opacity={0.2} />
        <Plate x={210} y={1878} s={0.82} tilt={-3} empty />
      </g>

      {/* ---- place stamp ---- */}
      <g opacity={dateIn * 0.92}>
        <T x={72} y={286} size={t.size.micro} weight={700} tracking={5} fill={palette.mustard}>
          KUDUS · JANUARI 2026
        </T>
        <Rect x={72} y={300} w={208 * dateIn} h={2} fill={palette.mustard} opacity={0.7} />
      </g>
    </SceneShell>
  );
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
/** Small deterministic mouth flutter so the ill student reads as breathing, not frozen. */
const kidMouth = (frame: number) => Math.max(0, Math.sin(frame * 0.09)) * 0.14;
