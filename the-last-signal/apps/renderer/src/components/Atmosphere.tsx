import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";

/**
 * Atmosfer prosedural — alasan utama gambar diam terasa hidup.
 *
 * Gambar yang kita punya adalah still. Yang membuat mata percaya itu rekaman
 * bukan gambarnya, tapi partikel yang bergerak di depannya: hujan yang jatuh
 * miring, kabut yang menyapu, debu di sorot lampu. Semua dihitung dari nomor
 * frame (bukan Math.random), jadi render bisa diulang persis dan dua render
 * paruh waktu akan menyambung tanpa lompatan.
 *
 * Biayanya kecil: satu div per lapisan, tidak ada canvas, tidak ada gambar
 * tambahan. Ini pilihan sadar — video AI tidak tersedia di pipeline, dan
 * parallax asli butuh depth map yang juga tidak tersedia.
 */

/** PRNG deterministik: seed yang sama → posisi partikel yang sama. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Hujan dari ubin SVG, bukan garis penuh frame.
 *
 * Versi pertama memakai repeating-linear-gradient: hasilnya garis sepanjang
 * layar yang seragam — terbaca seperti goresan film, bukan hujan. Ubin 420 px
 * berisi puluhan tetes dengan panjang, ketebalan, dan kecepatan berbeda jauh
 * lebih mirip hujan, dan biayanya satu div saja: ubinnya digeser per frame
 * lewat backgroundPosition.
 */
function rainTile(seed: number, count: number, slant: number, maxLength: number): string {
  const rand = mulberry32(seed);
  const drops: string[] = [];
  for (let index = 0; index < count; index++) {
    const x = rand() * 420;
    const y = rand() * 420;
    const length = maxLength * (0.35 + rand() * 0.65);
    const width = 1 + rand() * 1.6;
    const alpha = 0.18 + rand() * 0.5;
    // Tetes digambar miring: ujung atas lebih ke kiri daripada ujung bawah.
    const dx = (Math.tan((slant * Math.PI) / 180) * length) / 2;
    drops.push(
      `<line x1="${(x - dx).toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x + dx).toFixed(1)}" y2="${(y + length).toFixed(1)}" stroke="rgba(206,224,238,${alpha.toFixed(2)})" stroke-width="${width.toFixed(1)}" stroke-linecap="round"/>`,
    );
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="420" height="420" viewBox="0 0 420 420">${drops.join("")}</svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

const Rain: React.FC<{ heavy: boolean; intensity: number; seed: number }> = ({ heavy, intensity, seed }) => {
  const frame = useCurrentFrame();
  const layers = useMemo(
    () =>
      heavy
        ? [
            { tile: rainTile(seed * 7 + 1, 130, 12, 54), speed: 22, size: 420, alpha: 0.85, blur: 0 },
            { tile: rainTile(seed * 7 + 2, 70, 12, 30), speed: 34, size: 300, alpha: 0.6, blur: 0.4 },
            { tile: rainTile(seed * 7 + 3, 34, 12, 74), speed: 13, size: 560, alpha: 0.4, blur: 1.1 },
          ]
        : [
            { tile: rainTile(seed * 5 + 1, 46, 16, 34), speed: 16, size: 420, alpha: 0.75, blur: 0 },
            { tile: rainTile(seed * 5 + 2, 26, 16, 22), speed: 26, size: 320, alpha: 0.5, blur: 0.5 },
          ],
    [heavy, seed],
  );

  return (
    <AbsoluteFill style={{ overflow: "hidden", opacity: 0.5 + intensity * 0.5 }}>
      {layers.map((layer, index) => {
        const offsetY = (frame * layer.speed) % layer.size;
        const offsetX = (frame * layer.speed * 0.18) % layer.size;
        return (
          <AbsoluteFill
            key={index}
            style={{
              backgroundImage: layer.tile,
              backgroundSize: `${layer.size}px ${layer.size}px`,
              backgroundPosition: `${offsetX}px ${offsetY}px`,
              backgroundRepeat: "repeat",
              opacity: layer.alpha,
              filter: layer.blur ? `blur(${layer.blur}px)` : undefined,
            }}
          />
        );
      })}
      {/* Kabut basah di kaki frame: hujan tanpa percikan terasa seperti tekstur. */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 108%, rgba(190,206,220,${0.09 + intensity * 0.08}), transparent 58%)`,
          transform: `translateY(${Math.sin(frame / 60) * 2}px)`,
        }}
      />
    </AbsoluteFill>
  );
};

const MistDrift: React.FC<{ intensity: number; seed: number }> = ({ intensity, seed }) => {
  const frame = useCurrentFrame();
  const blobs = useMemo(() => {
    const rand = mulberry32(seed * 977 + 13);
    return Array.from({ length: 3 }, (_, index) => ({
      x: 10 + rand() * 80,
      y: 35 + rand() * 45,
      size: 55 + rand() * 40,
      period: 190 + rand() * 160,
      phase: index * 2.1 + rand(),
      alpha: 0.1 + rand() * 0.08,
    }));
  }, [seed]);

  return (
    <AbsoluteFill>
      {blobs.slice(0, 2).map((blob, index) => {
        const drift = Math.sin(frame / blob.period + blob.phase) * 9;
        return (
          <AbsoluteFill
            key={index}
            style={{
              background: `radial-gradient(ellipse ${blob.size}% ${blob.size * 0.6}% at ${blob.x + drift}% ${blob.y}%, rgba(176,190,198,${blob.alpha * (0.7 + intensity * 0.6)}), transparent 70%)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/**
 * Debu, percikan laut, dan asap dulu dibuat dari puluhan div kecil dengan
 * `filter: blur()`. Di Chromium headless itu berarti puluhan layer yang harus
 * di-raster ulang tiap frame: render LL-0001 turun dari 3,1 fps ke 0,5 fps.
 * Sekarang butiran digambar sekali sebagai ubin SVG (satu div, satu tekstur
 * yang digeser), sama seperti hujan. Rupa hampir tidak berubah, biaya turun
 * seorde.
 */
function moteTile(seed: number, count: number, maxRadius: number, tint: string): string {
  const rand = mulberry32(seed);
  const dots: string[] = [];
  for (let index = 0; index < count; index++) {
    const x = rand() * 500;
    const y = rand() * 500;
    const r = 0.6 + rand() * maxRadius;
    const alpha = 0.1 + rand() * 0.45;
    dots.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${tint}" opacity="${alpha.toFixed(2)}"/>`);
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">${dots.join("")}</svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

const DustMotes: React.FC<{ intensity: number; seed: number }> = ({ intensity, seed }) => {
  const frame = useCurrentFrame();
  const tile = useMemo(() => moteTile(seed * 131 + 7, 46, 2.6, "rgba(255,244,220,0.9)"), [seed]);
  // Naik pelan + goyang horizontal: debu di sorot lampu bergerak lebih lambat
  // daripada hujan, jadi geserannya beberapa px per detik saja.
  const offsetY = -((frame * 0.55) % 500);
  const offsetX = Math.sin(frame / 90) * 9;

  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", opacity: 0.55 + intensity * 0.45 }}>
      <AbsoluteFill
        style={{
          backgroundImage: tile,
          backgroundSize: "500px 500px",
          backgroundPosition: `${offsetX}px ${offsetY}px`,
          backgroundRepeat: "repeat",
        }}
      />
    </AbsoluteFill>
  );
};

const SeaSpray: React.FC<{ intensity: number; seed: number }> = ({ intensity, seed }) => {
  const frame = useCurrentFrame();
  const tile = useMemo(() => moteTile(seed * 613 + 29, 34, 3.4, "rgba(226,236,242,0.85)"), [seed]);
  const offsetY = -((frame * 1.6) % 500);
  const offsetX = Math.sin(frame / 70) * 14;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {/* Kabut garam di kaki frame: satu gradien, bukan partikel. */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 108%, rgba(206,216,222,${0.16 + intensity * 0.12}), transparent 60%)`,
          transform: `translateY(${Math.sin(frame / 70) * 3}px)`,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage: tile,
          backgroundSize: "500px 500px",
          backgroundPosition: `${offsetX}px ${offsetY}px`,
          backgroundRepeat: "repeat",
          maskImage: "linear-gradient(180deg, transparent 35%, #000 78%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(180deg, transparent 35%, #000 78%, transparent 100%)",
          opacity: 0.5 + intensity * 0.4,
        }}
      />
    </AbsoluteFill>
  );
};

const SmokeDrift: React.FC<{ intensity: number; seed: number }> = ({ intensity, seed }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen" }}>
      {[0, 1, 2].map((index) => {
        const rise = ((frame / (140 + index * 40)) % 1) * 60;
        const sway = Math.sin(frame / (95 + index * 20) + index) * 12;
        return (
          <AbsoluteFill
            key={index}
            style={{
              background: `radial-gradient(ellipse ${24 + index * 8}% ${18 + index * 6}% at ${42 + index * 9 + sway}% ${78 - rise}%, rgba(198,200,204,${(0.1 - index * 0.02) * (0.6 + intensity)}), transparent 72%)`,
              filter: "blur(12px)",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const StaticBurst: React.FC<{ intensity: number; seed: number }> = ({ intensity, seed }) => {
  const frame = useCurrentFrame();
  // Denyut tiap ±4 detik: cukup untuk mengingatkan bahwa ini siaran radio,
  // tidak cukup untuk mengganggu subjudul.
  const pulse = Math.max(0, Math.sin((frame + seed * 40) / 34));
  const burst = Math.pow(pulse, 6);
  const jitter = Math.sin((frame + seed) * 3.1) * 2;

  return (
    <AbsoluteFill style={{ opacity: burst * (0.28 + intensity * 0.35), mixBlendMode: "screen" }}>
      <AbsoluteFill
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(220,232,240,0.5) 0px, rgba(220,232,240,0.5) 1px, transparent 1px, transparent 4px)",
          transform: `translateY(${jitter}px)`,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, rgba(180,200,215,0.35) 0px, rgba(180,200,215,0.35) 2px, transparent 2px, transparent 9px)",
          transform: `translateX(${-jitter * 3}px)`,
          opacity: 0.7,
        }}
      />
    </AbsoluteFill>
  );
};

export type AtmosphereKind =
  | "rain"
  | "heavy_rain"
  | "mist_drift"
  | "dust_motes"
  | "sea_spray"
  | "smoke_drift"
  | "static_burst";

/**
 * Satu lapisan atmosfer. `kind` dipilih per scene di episode.json, jadi naskah
 * yang menentukan cuaca — bukan renderer yang menebak.
 */
export const Atmosphere: React.FC<{ kind: AtmosphereKind; intensity: number; seed?: number }> = ({
  kind,
  intensity,
  seed = 0,
}) => {
  switch (kind) {
    case "rain":
      return <Rain heavy={false} intensity={intensity} seed={seed} />;
    case "heavy_rain":
      return <Rain heavy intensity={intensity} seed={seed} />;
    case "mist_drift":
      return <MistDrift intensity={intensity} seed={seed} />;
    case "dust_motes":
      return <DustMotes intensity={intensity} seed={seed} />;
    case "sea_spray":
      return <SeaSpray intensity={intensity} seed={seed} />;
    case "smoke_drift":
      return <SmokeDrift intensity={intensity} seed={seed} />;
    case "static_burst":
      return <StaticBurst intensity={intensity} seed={seed} />;
    default:
      return null;
  }
};
