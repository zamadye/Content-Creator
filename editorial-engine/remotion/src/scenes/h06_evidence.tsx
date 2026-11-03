/**
 * H06 — EVIDENCE
 * --------------
 * Papan penyidikan: empat kartu bukti dan benang penghubung. Angka penindakan dipasang
 * satu per satu, bukan muncul sebagai satu blok — supaya terlihat bahwa ini proses,
 * bukan hasil akhir.
 */
import React from 'react';
import { palette } from '../../../design/tokens';
import { SceneShell } from '../components/SceneShell';
import { Rect, T } from '../illustration/primitives';
import { Benang, KartuInvestigasi, PapanInvestigasi, ScrimK } from '../illustration/topic-karhutla';
import { Headline, Kicker } from '../typography';
import { cam, fade } from '../animations';
import { Easing, interpolate, useCurrentFrame } from '../runtime';

export const H06Evidence: React.FC<{ d: number }> = ({ d }) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, d], [1.02, 1.06], {
    easing: Easing.editorial,
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });
  const p1 = fade(frame, Math.round(d * 0.06), 16);
  const p2 = fade(frame, Math.round(d * 0.2), 16);
  const p3 = fade(frame, Math.round(d * 0.34), 16);
  const p4 = fade(frame, Math.round(d * 0.48), 16);
  const benang = interpolate(frame, [Math.round(d * 0.58), Math.round(d * 0.8)], [0, 1], {
    easing: Easing.editorial,
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });
  const note = fade(frame, Math.round(d * 0.72), 18);
  const kick = fade(frame, Math.round(d * 0.05), 14);

  return (
    <SceneShell
      durationInFrames={d}
      bg={palette.ink}
      illustration
      illustrationY={250}
      sourceY={250}
      source="Bareskrim Polri, 29 Okt 2026 · periode beda dari rekap BNPB"
    >
      <g transform={cam(scale, 540, 960)}>
        <Rect x={0} y={0} w={1080} h={1920} fill="#171A15" />
        <PapanInvestigasi x={56} y={640} w={968} h={620} />

        <Benang x1={300} y1={830} x2={600} y2={830} p={benang} />
        <Benang x1={300} y1={830} x2={300} y2={1050} p={benang} />
        <Benang x1={600} y1={830} x2={600} y2={1050} p={benang} />

        <KartuInvestigasi x={110} y={700} w={380} h={210} label="LAPORAN POLISI" value="104" note="per 29 Oktober 2026" rotate={-1.2} p={p1} />
        <KartuInvestigasi x={530} y={700} w={380} h={210} label="NAIK KE PENYIDIKAN" value="97" note="korporasi" rotate={1.4} p={p2} />
        <KartuInvestigasi x={110} y={960} w={380} h={210} label="TERSANGKA KORPORASI" value="20" note="4 di antaranya modal asing" rotate={1} p={p3} accent={palette.brick} />
        <KartuInvestigasi x={530} y={960} w={380} h={210} label="ANCAMAN PIDANA" value="5 thn" note="denda maks. Rp15 miliar" rotate={-1.6} p={p4} />

        <g opacity={note}>
          <T x={84} y={1332} size={22} weight={600} tracking={1.4} fill={palette.paper} opacity={0.8}>
            29.168 hektare masuk laporan polisi
          </T>
          <T x={84} y={1366} size={17} weight={500} tracking={0.8} fill={palette.sage} opacity={0.6}>
            Pasal 98, 99, 108 UU 32/2009
          </T>
        </g>

        <ScrimK y={0} h={680} from={0.92} to={0} />
      </g>

      <g opacity={kick}>
        <Kicker x={84} y={330} text="BARESKRIM POLRI · 29 OKT 2026" />
        <Headline x={84} y={424} lines={['97 disidik.', '20 tersangka.']} size={64} accentLine={1} accentFill={palette.mustard} />
      </g>
    </SceneShell>
  );
};
