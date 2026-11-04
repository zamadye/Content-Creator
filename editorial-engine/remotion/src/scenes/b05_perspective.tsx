/**
 * B05 — PERSPECTIVE
 * -----------------
 * Pipa penyaluran digambar tangan: perusahaan → BPJS → rekening → Rp900.000.
 * Tiga sambungan harus tersambung semua. Yang tidak memegang ketiganya
 * tidak pernah masuk daftar — bukan karena ditolak, tapi karena tidak tercatat.
 */
import React from 'react';
import { palette } from '../../../design/tokens';
import { SceneShell } from '../components/SceneShell';
import { MarkerText, PaperBg, PaperHeader, PaperIllustrationTag, PaperSource, Pencil, SketchCircle, Slip, Tape } from '../illustration/topic-paper';
import { T } from '../illustration/primitives';
import { Easing, interpolate, useCurrentFrame } from '../runtime';

const seg = (f: number, a: number, b: number) =>
  interpolate(f, [a, b], [0, 1], { easing: Easing.editorial, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

const BOXES = [
  { label: 'PERUSAHAAN', sub: 'yang mendaftarkan', y: 380, syarat: true },
  { label: 'BPJS AKTIF', sub: 'sampai Agustus 2026', y: 620, syarat: true },
  { label: 'REKENING', sub: 'yang bisa dikirimi', y: 860, syarat: true },
  { label: 'Rp900.000', sub: 'sampai juga', y: 1100, syarat: false },
];

export const B05Perspective: React.FC<{ d: number }> = ({ d }) => {
  const f = useCurrentFrame();
  const headIn = seg(f, 0, 10);
  const p = BOXES.map((_, i) => seg(f, d * (0.06 + i * 0.13), d * (0.18 + i * 0.13)));
  const circles = seg(f, d * 0.62, d * 0.8);
  const note = seg(f, d * 0.84, d * 0.98);

  return (
    <SceneShell durationInFrames={d} bg={palette.paperWarm} showBrand={false} source={null} vignette={0.35}>
      <PaperBg seed={51} />
      <PaperHeader />
      <PaperIllustrationTag />

      <g opacity={headIn}>
        <MarkerText x={72} y={318} lines="Yang harus tersambung" size={56} fill={palette.marker} />
      </g>

      {BOXES.map((b, i) => (
        <g key={b.label} opacity={p[i]} transform={`translate(0 ${(1 - p[i]) * 24})`}>
          <Slip x={190} y={b.y} w={700} h={140} seed={52 + i} lines={0} rotate={i % 2 ? 0.8 : -0.8} fill={i === 3 ? palette.kraftLight : palette.paper}>
            <MarkerText x={350} y={66} anchor="middle" lines={b.label} size={b.label.startsWith('Rp') ? 52 : 46} fill={palette.marker} />
            <T x={350} y={108} anchor="middle" size={24} weight={600} fill={palette.paperShadow}>
              {b.sub}
            </T>
          </Slip>
          {i < BOXES.length - 1 && (
            <g opacity={p[i]}>
              <line x1={540} y1={b.y + 142} x2={540} y2={b.y + 196} stroke={palette.marker} strokeWidth={5} strokeLinecap="round" />
              <path d={`M 526 ${b.y + 186} L 540 ${b.y + 202} L 554 ${b.y + 186}`} fill="none" stroke={palette.marker} strokeWidth={5} strokeLinecap="round" />
            </g>
          )}
        </g>
      ))}

      <g opacity={circles}>
        <SketchCircle cx={540} cy={450} rx={372} ry={86} p={circles} seed={55} width={6} stroke={palette.brick} />
        <SketchCircle cx={540} cy={690} rx={372} ry={86} p={circles} seed={56} width={6} stroke={palette.brick} />
        <SketchCircle cx={540} cy={930} rx={372} ry={86} p={circles} seed={57} width={6} stroke={palette.brick} />
      </g>

      <g opacity={note}>
        <MarkerText x={72} y={1322} lines={['Tiga syarat.', 'Tidak satu pun soal kebutuhan.']} size={48} lineHeight={62} fill={palette.marker} />
      </g>

      <Pencil x={812} y={1010} s={0.55} rotate={-68} opacity={0.7} />
      <PaperSource text="Syarat penerima: Permenaker 16/2026 — batas upah, peserta aktif s.d. Agustus 2026" />
    </SceneShell>
  );
};
