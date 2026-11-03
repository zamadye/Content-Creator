/**
 * H07 — CLOSING
 * -------------
 * Kembali ke potongan tanah yang sama dengan pembuka, tanpa asap. Yang tersisa hanya
 * satu titik bara di bawah garis permukaan — dan itu tidak muncul di laporan harian.
 */
import React from 'react';
import { palette } from '../../../design/tokens';
import { SceneShell } from '../components/SceneShell';
import { Ellipse, Rect, T } from '../illustration/primitives';
import { Bara, ScrimK } from '../illustration/topic-karhutla';
import { Kicker, PullQuote } from '../typography';
import { cam, fade } from '../animations';
import { Easing, interpolate, useCurrentFrame } from '../runtime';

export const H07Closing: React.FC<{ d: number }> = ({ d }) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, d], [1.03, 1.0], {
    easing: Easing.editorial,
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });
  const beat = (frame / 62) % 1;
  const glow = interpolate(frame, [Math.round(d * 0.5), Math.round(d * 0.85)], [0.55, 0.95], {
    easing: Easing.editorial,
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });
  const line = fade(frame, Math.round(d * 0.3), 24);
  const kick = fade(frame, Math.round(d * 0.1), 18);

  return (
    <SceneShell durationInFrames={d} bg={palette.ink} illustration illustrationY={250} sourceY={250} source={null}>
      <g transform={cam(scale, 540, 1100)}>
        <Rect x={0} y={0} w={1080} h={1180} fill="#101410" />
        <Rect x={0} y={1180} w={1080} h={740} fill="#16130E" />
        
        {/* garis permukaan */}
        <Rect x={0} y={1178} w={1080} h={2} fill={palette.paper} opacity={0.16} />
        {/* abu tipis yang tersisa di atas garis */}
        {Array.from({ length: 14 }).map((_, i) => (
          <Ellipse key={i} cx={60 + i * 74} cy={1172} rx={26 + (i % 4) * 8} ry={2} fill={palette.paper} opacity={0.06} />
        ))}
        {/* satu bara yang tersisa */}
        <Bara x={540} y={1418} r={30} p={glow * (0.7 + 0.3 * Math.sin(beat * Math.PI * 2))} />
        <Bara x={318} y={1530} r={13} p={0.35 * glow} />
        <Bara x={742} y={1580} r={16} p={0.3 * glow} />
        <Rect x={0} y={1430} w={1080} h={490} fill={palette.ink} opacity={0.35} />
        <ScrimK y={0} h={760} from={0.92} to={0} />
      </g>

      <g opacity={kick}>
        <Kicker x={84} y={330} text="PENUTUP" />
        <PullQuote
          x={84}
          y={862}
          lines={['Yang padam', 'dilaporkan.', 'Yang membara tidak.']}
          size={72}
          frame={frame}
          start={Math.round(d * 0.18)}
          fill={palette.paper}
          accent={palette.brick}
        />
      </g>

      <g opacity={line}>
        <T x={84} y={1660} size={16} weight={500} tracking={0.8} fill={palette.sage} opacity={0.55}>
          Sumber: BNPB · Kemendikdasmen · Kemenkes · Bareskrim Polri, Okt–Nov 2026
        </T>
      </g>
    </SceneShell>
  );
};
