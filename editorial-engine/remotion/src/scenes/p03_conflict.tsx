/**
 * P03 — CONFLICT
 * --------------
 * Tiga puluh kotak yang tadi penuh kini dicoret. Di luar baris, satu kotak tambahan:
 * HARI 31. Dari situ sebuah panah melingkar kembali ke awal — bunga yang berbunga.
 *
 * Koordinat anak Slip/TornCard = lokal kartu.
 */
import React from 'react';
import { palette } from '../../../design/tokens';
import { SceneShell } from '../components/SceneShell';
import { MarkerText, PaperBg, PaperHeader, PaperIllustrationTag, PaperSource, SketchLoop, Slip, TallyGrid, TornCard } from '../illustration/topic-paper';
import { Easing, interpolate, useCurrentFrame } from '../runtime';

const seg = (f: number, a: number, b: number) =>
  interpolate(f, [a, b], [0, 1], { easing: Easing.editorial, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

const GX = 110;
const GY = 430;
const GW = 10 * (46 + 13) - 13;
const GH = 3 * (46 + 13) - 13;

export const P03Conflict: React.FC<{ d: number }> = ({ d }) => {
  const f = useCurrentFrame();
  const dim = seg(f, 0, d * 0.12);
  const cross1 = seg(f, d * 0.08, d * 0.2);
  const cross2 = seg(f, d * 0.14, d * 0.26);
  const day31 = seg(f, d * 0.3, d * 0.42);
  const loop = seg(f, d * 0.46, d * 0.72);
  const notes = seg(f, d * 0.72, d * 0.86);
  const closeline = seg(f, d * 0.86, d * 0.96);

  return (
    <SceneShell durationInFrames={d} bg={palette.paperDeep} showBrand={false} source={null} vignette={0.45}>
      <PaperBg seed={6} tone="deep" dark={0.02 + dim * 0.03} />
      <PaperHeader />
      <PaperIllustrationTag />

      <TallyGrid x={GX} y={GY} cols={10} rows={3} cell={46} gap={13} filled={30} drawn={1} stroke={palette.marker} fill={palette.marker} opacity={0.55} />

      {/* tiga puluh hari yang sudah lewat — dan tidak otomatis berarti lunas */}
      <g stroke={palette.markerRed} strokeWidth={9} strokeLinecap="round" opacity={0.75}>
        <line x1={GX - 4} y1={GY - 2} x2={GX - 4 + (GW + 8) * cross1} y2={GY - 2 + (GH + 6) * cross1} />
        <line x1={GX - 4} y1={GY + GH + 4} x2={GX - 4 + (GW + 8) * cross2} y2={GY + GH + 4 - (GH + 6) * cross2} />
      </g>

      <g opacity={day31} transform={`translate(0 ${(1 - day31) * 40})`}>
        <TornCard x={230} y={830} w={620} h={196} seed={12} fill={palette.brick} rotate={-1.4} jag={10} shadow={0.26}>
          <MarkerText x={310} y={112} lines="HARI 31" size={92} anchor="middle" fill={palette.paper} />
          <MarkerText x={310} y={152} lines="di luar hitungan" size={30} anchor="middle" fill={palette.paperWarm} />
        </TornCard>
      </g>

      <SketchLoop x1={840} y1={880} x2={150} y2={540} p={loop} drop={150} stroke={palette.markerRed} width={6} seed={19} />

      <g opacity={notes}>
        <Slip x={640} y={1120} w={360} h={150} seed={31} lines={0} fill={palette.paperWarm} rotate={1.6}>
          <MarkerText x={30} y={62} lines="DENDA" size={48} fill={palette.brickDeep} />
          <MarkerText x={30} y={112} lines="di atas bunga" size={30} fill="#5B5548" />
        </Slip>
        <Slip x={90} y={1120} w={520} h={150} seed={33} lines={0} rotate={-1.2}>
          <MarkerText x={28} y={62} lines="POKOK" size={44} />
          <MarkerText x={28} y={112} lines="belum tentu turun." size={38} fill={palette.markerRed} />
        </Slip>
      </g>

      <g opacity={closeline}>
        <MarkerText x={72} y={1390} lines="Bunga tetap jalan." size={72} fill={palette.marker} />
      </g>

      <PaperSource text="Mekanisme bunga majemuk (S2) — bukan klaim tentang penyelenggara mana pun." />
    </SceneShell>
  );
};
