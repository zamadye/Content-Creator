/**
 * S06 — DEVELOPMENT (the certificate and the temperature)
 * The document is perfect. The cold chain is not. The scene travels down the wall from
 * the certificate to the counter where the holding temperature has already failed.
 * Hierarchy: 1) certificate + stamp 2) the temperature 3) the clock 4) the kitchen.
 */
import React from 'react';
import { palette } from '../../../design/tokens';
import { Kitchen } from '../illustration/environments';
import { Character } from '../illustration/figures';
import { Certificate, TempGauge, WallClock } from '../illustration/props';
import { Rect, T } from '../illustration/primitives';
import { SceneShell } from '../components/SceneShell';
import { Kicker, SourceTag } from '../typography';
import { cam, countTo, fade, impact } from '../animations';
import { Easing, interpolate, useCurrentFrame } from '../runtime';

export const S06Certificate: React.FC<{ d: number }> = ({ d }) => {
  const frame = useCurrentFrame();
  // vertical tracking shot: certificate -> counter
  const yShift = interpolate(frame, [Math.round(d * 0.28), Math.round(d * 0.72)], [0, 385], {
    easing: Easing.editorial,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const push = interpolate(frame, [0, d], [1.06, 1.12], { easing: Easing.editorial, extrapolateRight: 'clamp' });
  const stamp = impact(frame, Math.round(d * 0.22), 16);
  const temp = countTo(frame, Math.round(d * 0.34), Math.round(d * 0.5), 68, 41, Easing.linearish);
  const clockMinutes = countTo(frame, 0, d, 10, 250);
  const gaugeIn = fade(frame, Math.round(d * 0.36), 20);
  const certIn = fade(frame, 4, 16);

  return (
    <SceneShell durationInFrames={d} bg={palette.night} source="Sumber: Ombudsman RI Perwakilan Sumut (Okt 2026)">
      <g transform={cam(push, 540, 900, 0, -yShift)}>
        <Kitchen steam={0.4} />

        {/* the certificate, framed, on the wall */}
        <g opacity={certIn}>
          <Rect x={470} y={322} w={382} h={268} r={3} fill={palette.paper} opacity={0.14} />
          <Certificate x={660} y={452} s={1.16} stamped={stamp} title="SERTIFIKAT" lines={['LAIK HIGIENE SANITASI', 'SPPG — DAPUR SATUAN PELAYANAN']} />
        </g>

        {/* clock: time passes while nobody checks */}
        <WallClock x={230} y={390} s={1.55} minutes={clockMinutes} hours={9 + clockMinutes / 60} />
        <T x={230} y={486} size={19} weight={600} tracking={3} fill={palette.sage} anchor="middle" opacity={0.7}>
          HOLDING TIME
        </T>

        {/* the counter where food waits */}
        <Rect x={-40} y={1010} w={1180} h={54} fill="#9AA79C" />
        <Rect x={-40} y={1064} w={1180} h={20} fill={palette.ink} opacity={0.25} />

        {/* tray of packed meals — cooling down */}
        <g opacity={0.98}>
          <Rect x={250} y={930} w={430} h={80} r={8} fill={palette.tealLight} />
          {[0, 1, 2, 3].map((i) => (
            <Rect key={i} x={268 + i * 102} y={916} w={84} h={62} r={6} fill={palette.paperDim} />
          ))}
          {[0, 1, 2, 3].map((i) => (
            <Rect key={`s${i}`} x={282 + i * 102} y={930} w={56} h={8} r={4} fill={palette.brick} opacity={0.5} />
          ))}
        </g>

        {/* digital gauge — the number that should have stopped the delivery */}
        <g opacity={gaugeIn}>
          <TempGauge x={866} y={900} s={1.55} temp={temp} safe={60} />
        </g>

        {/* staff passing with a tray, not looking at the gauge */}
        <g opacity={0.9}>
          <Character
            kind="petugas"
            x={186}
            y={1800}
            height={660}
            pose={{ torso: 5, head: -8, armA: [34, -52], armB: [26, -6], legA: [20, -10], legB: [-22, -8] }}
            expression="neutral"
            opacity={0.96}
          />
        </g>
      </g>

      {/* reading aids: label + threshold */}
      <g opacity={fade(frame, Math.round(d * 0.3), 18)}>
        <Kicker x={72} y={330} text="SERTIFIKAT ADA" color={palette.mustard} />
      </g>
      <g opacity={gaugeIn}>
        <T x={866} y={1040} size={21} weight={600} tracking={2.6} fill={palette.brickLight} anchor="middle">
          AMBANG AMAN 60°C KE ATAS
        </T>
      </g>
    </SceneShell>
  );
};
