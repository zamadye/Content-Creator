/**
 * P01 — HOOK
 * ----------
 * Satu sobekan kardus kraft di atas kertas kusut: "0,3% per hari".
 * Angkanya ditulis spidol goresan demi goresan, lalu kata "per hari" dilingkari —
 * bukan untuk menegaskan, tapi untuk mempersempit: yang kamu lihat cuma sehari.
 *
 * Catatan koordinat: semua anak dari KraftCard/Slip berada di ruang LOKAL kartu
 * (0..w, 0..h), karena komponen itu sudah men-translate dirinya sendiri.
 */
import React from 'react';
import { palette } from '../../../design/tokens';
import { SceneShell } from '../components/SceneShell';
import {
  KraftCard,
  MarkerText,
  PaperBg,
  PaperHeader,
  PaperIllustrationTag,
  PaperSource,
  PaperWrite,
  Pencil,
  SketchCircle,
  SketchUnderline,
  Slip,
  Tape,
} from '../illustration/topic-paper';
import { Easing, interpolate, useCurrentFrame } from '../runtime';

const seg = (f: number, a: number, b: number) =>
  interpolate(f, [a, b], [0, 1], { easing: Easing.editorial, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

export const P01Hook: React.FC<{ d: number }> = ({ d }) => {
  const f = useCurrentFrame();
  const cardIn = seg(f, 0, 14);
  const writeBig = seg(f, 10, d * 0.3);
  const writeSub = seg(f, d * 0.32, d * 0.44);
  const circle = seg(f, d * 0.46, d * 0.58);
  const slipIn = seg(f, d * 0.6, d * 0.7);
  const line1 = seg(f, d * 0.74, d * 0.82);
  const line2 = seg(f, d * 0.82, d * 0.9);
  const under = seg(f, d * 0.92, d * 0.99);

  return (
    <SceneShell durationInFrames={d} bg={palette.paperWarm} showBrand={false} source={null} vignette={0.35}>
      <PaperBg seed={1} />
      <PaperHeader />
      <PaperIllustrationTag />

      <g transform={`translate(0 ${(1 - cardIn) * -46})`} opacity={cardIn}>
        <KraftCard x={140} y={420} w={800} h={470} seed={2} rotate={-2.4}>
          <Tape x={24} y={-28} w={170} h={46} rotate={-12} />
          <Tape x={600} y={452} w={150} h={42} rotate={7} />

          <PaperWrite id="p01-big" x={40} y={100} w={720} h={200} p={writeBig}>
            <MarkerText x={400} y={258} lines="0,3%" size={198} anchor="middle" fill={palette.marker} />
          </PaperWrite>

          <PaperWrite id="p01-sub" x={90} y={286} w={620} h={110} p={writeSub}>
            <MarkerText x={400} y={372} lines="per hari" size={88} anchor="middle" fill={palette.markerRed} />
          </PaperWrite>

          <SketchCircle cx={400} cy={342} rx={232} ry={70} p={circle} seed={7} width={7} />
        </KraftCard>
      </g>

      <g opacity={slipIn} transform={`translate(${(1 - slipIn) * 30} 0)`}>
        <Slip x={190} y={1000} w={700} h={210} seed={5} lines={0} rotate={-1.6}>
          <Tape x={278} y={-16} w={132} h={38} rotate={-3} opacity={0.5} />
          <MarkerText x={350} y={118} lines="kelihatan kecil, kan?" size={46} anchor="middle" />
        </Slip>
      </g>

      <g opacity={line1}>
        <MarkerText x={72} y={1300} lines="Sebab yang kamu lihat" size={62} />
      </g>
      <g opacity={line2}>
        <MarkerText x={72} y={1392} lines="cuma sehari." size={84} fill={palette.markerRed} />
        <SketchUnderline x1={72} y={1424} x2={520} p={under} width={8} />
      </g>

      <Pencil x={800} y={1444} s={0.78} rotate={-24} opacity={0.9} />
      <PaperSource text="Contoh perhitungan terbuka — bukan kutipan iklan mana pun." />
    </SceneShell>
  );
};
