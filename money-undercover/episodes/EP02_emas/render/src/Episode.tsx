import React from 'react';
import {
  AbsoluteFill,
  Img,
  Sequence,
  staticFile,
  useCurrentFrame,
  interpolate,
  Easing,
} from 'remotion';
import {C, FONT, FPS, SCENES, EPISODE_DURATION_IN_FRAMES} from './theme';

export {FPS, EPISODE_DURATION_IN_FRAMES};

const easeOut = Easing.bezier(0.22, 1, 0.36, 1);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const ip = (
  f: number,
  range: [number, number],
  out: [number, number],
  easing?: (t: number) => number
) => interpolate(f, range, out, {...clamp, easing});

/* ---------- shared building blocks ---------- */

const SceneBox: React.FC<{
  dur: number;
  cut?: boolean;
  children: React.ReactNode;
}> = ({dur, cut, children}) => {
  const f = useCurrentFrame();
  const fin = cut ? 1 : ip(f, [0, 8], [0, 1]);
  const fout = cut ? 1 : ip(f, [dur - 8, dur], [1, 0]);
  return (
    <AbsoluteFill
      style={{
        backgroundColor: C.black,
        opacity: Math.min(fin, fout),
        fontFamily: FONT,
        overflow: 'hidden',
      }}
    >
      {children}
      {/* brand bug */}
      <div
        style={{
          position: 'absolute',
          top: 36,
          right: 48,
          fontSize: 22,
          letterSpacing: 6,
          color: C.slate,
          fontWeight: 700,
          zIndex: 40,
        }}
      >
        RUANG <span style={{color: C.amber}}>MARGIN</span>
      </div>
    </AbsoluteFill>
  );
};

const ActTag: React.FC<{act: string; name: string}> = ({act, name}) => (
  <div style={{position: 'absolute', top: 36, left: 48, fontSize: 22, letterSpacing: 4, zIndex: 30}}>
    <span style={{color: C.amber, fontWeight: 800}}>{act}</span>
    <span style={{color: C.slate, marginLeft: 16}}>{name}</span>
  </div>
);

const Ilustrasi: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      bottom: 36,
      right: 48,
      fontSize: 18,
      letterSpacing: 3,
      color: C.slate,
      border: `1px solid ${C.slate}`,
      padding: '6px 14px',
      zIndex: 30,
    }}
  >
    ILUSTRASI
  </div>
);

const H1: React.FC<{
  children: React.ReactNode;
  at?: number;
  size?: number;
  color?: string;
  style?: React.CSSProperties;
}> = ({children, at = 0, size = 76, color = C.bone, style}) => {
  const f = useCurrentFrame();
  const p = ip(f, [at, at + 18], [0, 1], easeOut);
  return (
    <div
      style={{
        fontSize: size,
        fontWeight: 800,
        lineHeight: 1.15,
        color,
        letterSpacing: -1,
        opacity: p,
        transform: `translateY(${(1 - p) * 30}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

const KenBurns: React.FC<{
  src: string;
  dur: number;
  from?: number;
  to?: number;
  dx?: number;
  dy?: number;
}> = ({src, dur, from = 1.06, to = 1.14, dx = 0, dy = 0}) => {
  const f = useCurrentFrame();
  const t = ip(f, [0, dur], [0, 1]);
  const s = from + (to - from) * t;
  return (
    <AbsoluteFill>
      <Img
        src={staticFile(src)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${s}) translate(${dx * t}px, ${dy * t}px)`,
        }}
      />
    </AbsoluteFill>
  );
};

const Vignette: React.FC<{strength?: number}> = ({strength = 0.55}) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse at center, rgba(8,12,19,0) 45%, rgba(8,12,19,${strength}) 100%)`,
      pointerEvents: 'none',
    }}
  />
);

const Counter: React.FC<{
  from: number;
  to: number;
  start: number;
  dur: number;
  prefix?: string;
  style?: React.CSSProperties;
}> = ({from, to, start, dur, prefix = '', style}) => {
  const f = useCurrentFrame();
  const v = Math.round(ip(f, [start, start + dur], [from, to], easeOut));
  return (
    <span style={style}>
      {prefix}
      {v.toLocaleString('id-ID')}
    </span>
  );
};

const Source: React.FC<{children: React.ReactNode}> = ({children}) => (
  <div style={{fontSize: 22, color: C.pale, letterSpacing: 1, opacity: 0.85}}>
    {children}
  </div>
);

/* ---------- SCENE 01 — HOOK ---------- */

const S01: React.FC = () => {
  const f = useCurrentFrame();
  const voidS = ip(f, [140, 640], [0, 1]);
  const stats = ip(f, [260, 300], [0, 1], easeOut);
  const head = ip(f, [480, 520], [0, 1], easeOut);
  const gleam = ip(f, [40, 160], [-1.2, 2.2]);
  return (
    <AbsoluteFill style={{backgroundColor: C.navy, alignItems: 'center', justifyContent: 'center'}}>
      <ActTag act="ACT 1" name="THE PROMISE" />
      {/* gold bar */}
      <div
        style={{
          position: 'absolute',
          top: 170,
          width: 380,
          height: 110,
          borderRadius: 14,
          background: `linear-gradient(135deg, ${C.amber} 0%, #ffd770 45%, ${C.amber} 100%)`,
          transform: 'perspective(600px) rotateX(18deg)',
          boxShadow: `0 24px 70px rgba(242,169,0,0.35)`,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: `${gleam * 100}%`,
            width: 60,
            height: '100%',
            background: 'rgba(255,255,255,0.55)',
            transform: 'skewX(-20deg)',
          }}
        />
      </div>
      {/* loss panel */}
      <div
        style={{
          position: 'absolute',
          top: 360,
          background: C.black,
          border: `2px solid ${C.slate}`,
          padding: '44px 84px',
          textAlign: 'center',
          zIndex: 2,
          opacity: stats,
          transform: `translateY(${(1 - stats) * 24}px)`,
        }}
      >
        <div style={{fontSize: 24, letterSpacing: 8, color: C.slate, marginBottom: 18}}>
          EMAS YANG HILANG — TAHUN YANG SAMA
        </div>
        <div style={{fontSize: 96, fontWeight: 800, color: C.red, fontVariantNumeric: 'tabular-nums'}}>
          444,5 gram
        </div>
        <div style={{fontSize: 40, fontWeight: 700, color: C.bone, marginTop: 10}}>
          + Rp180 juta tunai
        </div>
        <div style={{fontSize: 24, color: C.pale, marginTop: 14}}>Pandeglang — dilaporkan, tak kembali</div>
      </div>
      {/* red void */}
      <div
        style={{
          position: 'absolute',
          bottom: -170,
          width: 880 + voidS * 520,
          height: 250 + voidS * 170,
          background: `radial-gradient(ellipse at center, ${C.red} 0%, rgba(217,75,64,0.35) 45%, rgba(8,12,19,0) 72%)`,
          opacity: 0.8,
        }}
      />
      {/* headline */}
      <div
        style={{
          position: 'absolute',
          bottom: 150,
          width: '100%',
          textAlign: 'center',
          opacity: head,
          transform: `translateY(${(1 - head) * 24}px)`,
        }}
      >
        <div style={{fontSize: 84, fontWeight: 800, color: C.bone, letterSpacing: -2}}>
          REKOR <span style={{color: C.amber}}>ATAU</span> RUGI?
        </div>
        <div style={{fontSize: 32, color: C.pale, marginTop: 14}}>
          Emas tidak pernah bohong. Yang berbohong — orang yang menjanjikannya.
        </div>
      </div>
      <div style={{position: 'absolute', left: 48, bottom: 56, width: 1100, textAlign: 'left'}}>
        <Source>Sumber: Logam Mulia/Antam; detik.com; World Gold Council (2026)</Source>
      </div>
      <Ilustrasi />
      <Vignette />
    </AbsoluteFill>
  );
};

/* ---------- SCENE 02 — DEMAM EMAS ---------- */

const S02: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const card = ip(f, [80, 120], [0, 1], easeOut);
  const facts = ip(f, [520, 560], [0, 1]);
  const pemicu = [640, 720, 800];
  return (
    <AbsoluteFill style={{backgroundColor: C.navy}}>
      <KenBurns src="assets/ENV_DEMAM_BUTIK_01.png" dur={dur} from={1.04} to={1.15} dx={-50} />
      <AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(16,26,43,0.95) 0%, rgba(16,26,43,0.6) 48%, rgba(16,26,43,0.12) 100%)'}} />
      <ActTag act="ACT 1" name="THE PROMISE" />
      <div style={{position: 'absolute', left: 48, top: 150, maxWidth: 1000}}>
        <H1 at={20} size={64}>
          DEMAM EMAS <span style={{color: C.amber}}>2026</span>
        </H1>
        <div
          style={{
            marginTop: 40,
            background: C.black,
            borderLeft: `6px solid ${C.amber}`,
            padding: '30px 44px',
            opacity: card,
            maxWidth: 780,
          }}
        >
          <div style={{fontSize: 26, letterSpacing: 4, color: C.slate}}>HARGA ANTAM — REKOR TERTINGGI</div>
          <div style={{fontSize: 84, fontWeight: 800, color: C.amber, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums'}}>
            <Counter from={2488000} to={3168000} start={140} dur={520} prefix="Rp " />
          </div>
          <div style={{fontSize: 28, color: C.bone, marginTop: 6}}>/ gram · 29 Januari 2026</div>
        </div>
        <div style={{marginTop: 34, fontSize: 32, color: C.pale, lineHeight: 1.5, opacity: facts}}>
          Dunia: <span style={{color: C.bone, fontWeight: 700}}>US$5.589,38/ons</span> — rekor (28 Jan).
          <br />
          Setahun sebelumnya harga naik <span style={{color: C.bone, fontWeight: 700}}>lebih dari 61%</span>.
        </div>
        <div style={{marginTop: 34, display: 'flex', gap: 18}}>
          {['INFLASI', 'GEOPOLITIK', 'BANK SENTRAL'].map((t, i) => (
            <div
              key={t}
              style={{
                background: 'rgba(8,12,19,0.85)',
                border: `1px solid ${C.slate}`,
                color: C.bone,
                fontSize: 26,
                fontWeight: 700,
                letterSpacing: 3,
                padding: '14px 26px',
                opacity: ip(f, [pemicu[i], pemicu[i] + 20], [0, 1]),
              }}
            >
              {t}
            </div>
          ))}
        </div>
        <div style={{marginTop: 26}}>
          <Source>Sumber: Logam Mulia/Antam; investor.id; World Gold Council (2026)</Source>
        </div>
      </div>
      <Ilustrasi />
      <Vignette />
    </AbsoluteFill>
  );
};

/* ---------- SCENE 03 — BAHASA KEPERCAYAAN ---------- */

const S03: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const crack = ip(f, [660, 760], [0, 1]);
  const chips = [180, 300, 420];
  return (
    <AbsoluteFill style={{backgroundColor: C.navy}}>
      <KenBurns src="assets/ENV_KOTAK_IBU_01.png" dur={dur} from={1.05} to={1.13} dx={40} />
      <AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(16,26,43,0.96) 0%, rgba(16,26,43,0.7) 42%, rgba(16,26,43,0.15) 100%)'}} />
      <ActTag act="ACT 1" name="THE PROMISE" />
      <div style={{position: 'absolute', left: 48, top: 170, maxWidth: 900}}>
        <H1 at={16} size={62}>
          EMAS ADALAH
          <br />
          BAHASA <span style={{color: C.amber}}>CINTA</span>
        </H1>
        <div style={{marginTop: 46, display: 'flex', gap: 20}}>
          {['SUNATAN', 'UMRAH', 'MENIKAH'].map((t, i) => (
            <div
              key={t}
              style={{
                background: 'rgba(8,12,19,0.88)',
                border: `2px solid ${C.bone}`,
                color: C.bone,
                fontSize: 30,
                fontWeight: 800,
                letterSpacing: 4,
                padding: '18px 34px',
                opacity: ip(f, [chips[i], chips[i] + 22], [0, 1], easeOut),
                transform: `translateY(${(1 - ip(f, [chips[i], chips[i] + 22], [0, 1], easeOut)) * 18}px)`,
              }}
            >
              {t}
            </div>
          ))}
        </div>
        <div style={{marginTop: 44, fontSize: 32, color: C.pale, lineHeight: 1.55, opacity: ip(f, [540, 580], [0, 1])}}>
          Ibu-ibu adalah bendaharanya.
          <br />
          Bisa <span style={{color: C.bone, fontWeight: 700}}>dilihat, dipegang, disimpan.</span>
        </div>
        <div
          style={{
            marginTop: 34,
            fontSize: 30,
            fontWeight: 700,
            color: C.red,
            letterSpacing: 1,
            opacity: crack,
          }}
        >
          — makanya kotak itu terbuka terlalu cepat.
        </div>
      </div>
      <div style={{position: 'absolute', left: 48, bottom: 56, width: 1100, textAlign: 'left'}}>
        <Source>Sumber: edukasi OJK; laporan media titip emas (Sep–Nov 2026)</Source>
      </div>
      <Ilustrasi />
      <Vignette />
    </AbsoluteFill>
  );
};

/* ---------- SCENE 04 — TITIP EMAS ---------- */

const S04: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const rows = [160, 340, 520];
  const strike = ip(f, [760, 820], [0, 1]);
  const stamp = ip(f, [880, 930], [0, 1], easeOut);
  const items = [
    ['Titip emas 50 gram', '→ +1–5 gram tiap bulan'],
    ['Titip uang', '→ bunga 5–10% per bulan'],
    ['Pinjam emas warga 1 bulan', '→ keuntungan di akhir'],
  ];
  return (
    <AbsoluteFill style={{backgroundColor: C.navy}}>
      <KenBurns src="assets/ENV_TITIP_EMAS_01.png" dur={dur} from={1.1} to={1.02} />
      <AbsoluteFill style={{background: 'rgba(8,12,19,0.66)'}} />
      <ActTag act="ACT 2" name="THE TRUST" />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
        <div
          style={{
            background: C.bone,
            color: C.navy,
            width: 1180,
            padding: '56px 72px',
            position: 'relative',
            opacity: ip(f, [40, 80], [0, 1]),
            transform: `translateY(${ip(f, [40, 80], [40, 0], easeOut)}px)`,
          }}
        >
          <div style={{fontSize: 26, letterSpacing: 6, color: C.slate, marginBottom: 10}}>
            TOKO EMAS MITRA MAKMUR DUA — PANIMBANG, PANDEGLANG
          </div>
          <div style={{fontSize: 48, fontWeight: 800, marginBottom: 34}}>
            SKEMA <span style={{color: C.amber}}>YANG TERDENGAR MULIA</span>
          </div>
          {items.map(([a, b], i) => (
            <div
              key={a}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                padding: '22px 0',
                borderTop: i ? '1px solid rgba(16,26,43,0.25)' : 'none',
                opacity: ip(f, [rows[i], rows[i] + 24], [0, 1]),
                position: 'relative',
              }}
            >
              <span style={{fontSize: 34, fontWeight: 700, color: strike > 0.5 ? C.slate : C.navy}}>
                {a}
              </span>
              <span style={{fontSize: 34, fontWeight: 800, color: strike > 0.5 ? C.slate : C.amber}}>
                {b}
              </span>
              <span
                style={{
                  position: 'absolute',
                  left: 0,
                  top: '52%',
                  height: 4,
                  width: `${strike * 100}%`,
                  background: C.red,
                }}
              />
            </div>
          ))}
          <div style={{marginTop: 30, fontSize: 28, color: C.slate, opacity: ip(f, [700, 740], [0, 1])}}>
            Ditawarkan lewat toko langganan bertahun-tahun.
          </div>
          {/* stamp */}
          <div
            style={{
              position: 'absolute',
              right: -40,
              bottom: -40,
              border: `6px solid ${C.red}`,
              color: C.red,
              fontWeight: 800,
              fontSize: 36,
              letterSpacing: 2,
              padding: '16px 30px',
              background: 'rgba(242,240,233,0.94)',
              transform: `rotate(-8deg) scale(${2 - stamp})`,
              opacity: stamp,
            }}
          >
            TOKO TUTUP TOTAL
          </div>
        </div>
      </AbsoluteFill>
      <div style={{position: 'absolute', bottom: 96, width: '100%', textAlign: 'center'}}>
        <Source>Sumber: tvOneNews; IDN Times Banten; Fakta Banten (Sep–Nov 2026) — status: dugaan/laporan</Source>
      </div>
      <Ilustrasi />
      <Vignette />
    </AbsoluteFill>
  );
};

/* ---------- SCENE 05 — 40 GRAM UNTUK UMRAH ---------- */

const S05: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const card = ip(f, [80, 120], [0, 1], easeOut);
  const unpaid = ip(f, [560, 600], [0, 1]);
  const total = ip(f, [860, 900], [0, 1]);
  return (
    <AbsoluteFill style={{backgroundColor: C.navy}}>
      <Img
        src={staticFile('assets/ENV_KONTER_TUKAR_01.png')}
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          width: '54%',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${ip(f, [0, dur], [1.03, 1.1])})`,
        }}
      />
      <AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(16,26,43,0.97) 0%, rgba(16,26,43,0.78) 42%, rgba(16,26,43,0.1) 66%)'}} />
      <ActTag act="ACT 2" name="THE TRUST" />
      <div style={{position: 'absolute', left: 48, top: 160, maxWidth: 900}}>
        <H1 at={16} size={60}>
          40 GRAM
          <br />
          UNTUK <span style={{color: C.amber}}>UMRAH</span>
        </H1>
        <div
          style={{
            marginTop: 44,
            background: C.black,
            border: `2px solid ${C.slate}`,
            padding: '36px 48px',
            width: 780,
            opacity: card,
            position: 'relative',
          }}
        >
          <div style={{fontSize: 24, letterSpacing: 5, color: C.slate, marginBottom: 18}}>
            JUAL BELI — MARET 2026 (KUTIPAN MEDIA)
          </div>
          <div style={{fontSize: 46, fontWeight: 800, color: C.amber, fontVariantNumeric: 'tabular-nums'}}>
            40 g × Rp1.800.000
          </div>
          <div style={{fontSize: 34, color: C.bone, marginTop: 12}}>Untuk biaya umrah 4 orang keluarga</div>
          <div
            style={{
              marginTop: 24,
              paddingTop: 20,
              borderTop: `1px solid rgba(83,97,116,0.6)`,
              display: 'flex',
              justifyContent: 'space-between',
              opacity: unpaid,
            }}
          >
            <span style={{fontSize: 32, color: C.bone}}>Yang dibayar: <b style={{color: C.amber}}>Rp5 juta</b> muka</span>
            <span style={{fontSize: 32, color: C.red, fontWeight: 800}}>BELUM LUNAS</span>
          </div>
          <div style={{fontSize: 26, color: C.pale, marginTop: 14, opacity: unpaid}}>
            Janji transfer keesokan hari — tak pernah datang. Ia meminjam ke tetangga.
          </div>
        </div>
        <div
          style={{
            marginTop: 40,
            background: 'rgba(8,12,19,0.9)',
            borderLeft: `6px solid ${C.red}`,
            padding: '26px 38px',
            opacity: total,
          }}
        >
          <div style={{fontSize: 44, fontWeight: 800, color: C.red, fontVariantNumeric: 'tabular-nums'}}>
            444,5 g + Rp180 juta
          </div>
          <div style={{fontSize: 28, color: C.bone, marginTop: 6}}>total korban gelombang ini — diperkirakan &gt; Rp1 miliar</div>
        </div>
      </div>
      <div style={{position: 'absolute', left: 48, bottom: 56, width: 1100, textAlign: 'left'}}>
        <Source>Sumber: Kompas/Tirto (Mar 2026); tvOneNews; IDN Times Banten — kutipan media</Source>
      </div>
      <Ilustrasi />
      <Vignette />
    </AbsoluteFill>
  );
};

/* ---------- SCENE 06 — PEJABAT & BANTAHAN ---------- */

const S06: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const stamps = [
    {t: 'DILAPORKAN', c: C.amber, at: 140},
    {t: 'MEMBANTAH', c: C.bone, at: 320},
    {t: 'PROSES — BELUM ADA PUTUSAN', c: C.slate, at: 500},
  ];
  const rule = ip(f, [720, 760], [0, 1]);
  return (
    <AbsoluteFill style={{backgroundColor: C.navy}}>
      <KenBurns src="assets/ENV_GEDUNG_DPRD_01.png" dur={dur} from={1.05} to={1.13} dy={-30} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(16,26,43,0.88) 0%, rgba(16,26,43,0.62) 55%, rgba(16,26,43,0.9) 100%)'}} />
      <ActTag act="ACT 2" name="THE TRUST" />
      <div style={{position: 'absolute', top: 150, width: '100%', textAlign: 'center'}}>
        <H1 at={14} size={62} style={{textAlign: 'center'}}>
          LAPORAN & <span style={{color: C.amber}}>BANTAHAN</span>
        </H1>
        <div style={{fontSize: 30, color: C.pale, marginTop: 18, opacity: ip(f, [80, 120], [0, 1])}}>
          Anggota DPRD Provinsi Banten — inisial RM — dan orang kepercayaannya, AW.
        </div>
        <div style={{display: 'flex', gap: 28, justifyContent: 'center', marginTop: 56}}>
          {stamps.map((s) => {
            const p = ip(f, [s.at, s.at + 30], [0, 1], easeOut);
            return (
              <div
                key={s.t}
                style={{
                  border: `4px solid ${s.c}`,
                  color: s.c,
                  fontSize: 30,
                  fontWeight: 800,
                  letterSpacing: 3,
                  padding: '22px 40px',
                  background: 'rgba(8,12,19,0.82)',
                  opacity: p,
                  transform: `scale(${1.6 - p * 0.6})`,
                  maxWidth: 560,
                }}
              >
                {s.t}
              </div>
            );
          })}
        </div>
        <div
          style={{
            margin: '64px auto 0',
            width: 1160,
            background: 'rgba(8,12,19,0.9)',
            border: `1px solid ${C.slate}`,
            padding: '30px 44px',
            opacity: rule,
          }}
        >
          <div style={{fontSize: 32, color: C.bone}}>
            RM menyatakan kepemilikan toko berpindah sejak <b>8 Maret 2024</b> — dan <b>membantah</b> laporan.
          </div>
          <div style={{fontSize: 34, fontWeight: 800, color: C.amber, marginTop: 16, letterSpacing: 1}}>
            PRADUGA TIDAK BERSALAH BERLAKU UNTUK SEMUA.
          </div>
        </div>
        <div style={{marginTop: 26}}>
          <Source>Sumber: keterangan tertulis RM (17 Sep 2026); IDN Times; TotalBanten; Polda Banten</Source>
        </div>
      </div>
      <Ilustrasi />
      <Vignette />
    </AbsoluteFill>
  );
};

/* ---------- SCENE 07 — PRE-ORDER + PROMOSI ---------- */

const S07: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const offer = ip(f, [60, 100], [0, 1], easeOut);
  const fail = ip(f, [380, 420], [0, 1]);
  const grid = ip(f, [560, 640], [0, 1]);
  const fig = ip(f, [860, 900], [0, 1]);
  const stat = ip(f, [1120, 1160], [0, 1]);
  const stamp = ip(f, [1240, 1290], [0, 1], easeOut);
  return (
    <AbsoluteFill style={{backgroundColor: C.navy}}>
      <Img
        src={staticFile('assets/MOCKUP_PREORDER_01.png')}
        style={{
          position: 'absolute',
          right: -60,
          top: 0,
          width: '44%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center 30%',
          transform: `scale(${ip(f, [0, dur], [1.02, 1.09])})`,
        }}
      />
      <AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(16,26,43,0.98) 0%, rgba(16,26,43,0.85) 45%, rgba(16,26,43,0.25) 72%)'}} />
      <ActTag act="ACT 3" name="THE MARKETING" />
      <div style={{position: 'absolute', left: 48, top: 130, maxWidth: 1050}}>
        <H1 at={12} size={58}>
          PRE-ORDER + <span style={{color: C.amber}}>PROMOSI</span>
        </H1>
        {/* offer card */}
        <div
          style={{
            marginTop: 34,
            display: 'flex',
            gap: 26,
            opacity: offer,
            transform: `translateY(${(1 - offer) * 20}px)`,
          }}
        >
          <div style={{background: C.black, border: `2px solid ${C.amber}`, padding: '24px 36px', textAlign: 'center'}}>
            <div style={{fontSize: 26, color: C.slate, letterSpacing: 3}}>BELI</div>
            <div style={{fontSize: 52, fontWeight: 800, color: C.bone}}>5 gram</div>
          </div>
          <div style={{alignSelf: 'center', fontSize: 46, color: C.amber, fontWeight: 800}}>→</div>
          <div style={{background: C.black, border: `2px solid ${C.amber}`, padding: '24px 36px', textAlign: 'center'}}>
            <div style={{fontSize: 26, color: C.slate, letterSpacing: 3}}>DIJANJIKAN BONUS</div>
            <div style={{fontSize: 52, fontWeight: 800, color: C.amber}}>4 gram</div>
          </div>
          <div
            style={{
              alignSelf: 'center',
              fontSize: 28,
              fontWeight: 700,
              color: C.red,
              maxWidth: 240,
              lineHeight: 1.35,
              opacity: fail,
            }}
          >
            Emas tak kunjung datang. Buyback tinggi — batal.
          </div>
        </div>
        {/* structure */}
        <div style={{marginTop: 44, opacity: grid}}>
          <div style={{fontSize: 26, letterSpacing: 4, color: C.slate, marginBottom: 14}}>
            STRUKTUR: 1 INDUK + 6 CANGKANG
          </div>
          <div style={{display: 'flex', gap: 14, alignItems: 'center'}}>
            <div style={{width: 150, height: 84, background: C.amber, color: C.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 24}}>INDUK</div>
            <div style={{color: C.slate, fontSize: 30}}>→</div>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10}}>
              {Array.from({length: 6}).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: 96,
                    height: 60,
                    border: `2px solid ${C.slate}`,
                    background: 'rgba(83,97,116,0.18)',
                    opacity: ip(f, [640 + i * 24, 664 + i * 24], [0, 1]),
                  }}
                />
              ))}
            </div>
          </div>
          <div style={{fontSize: 26, color: C.pale, marginTop: 12, opacity: ip(f, [780, 820], [0, 1])}}>
            Direktur utama: WNA · kantor cabang tutup
          </div>
        </div>
        {/* figures */}
        <div
          style={{
            marginTop: 40,
            background: 'rgba(8,12,19,0.92)',
            border: `1px solid ${C.slate}`,
            padding: '24px 36px',
            opacity: fig,
            maxWidth: 860,
          }}
        >
          <div style={{fontSize: 30, color: C.bone, fontWeight: 700}}>
            Figur publik dalam materi promosi — <span style={{color: C.amber}}>diminta klarifikasi</span>
          </div>
          <div style={{fontSize: 28, color: C.pale, marginTop: 8}}>
            JC · KL · NN · AWK — “promosi ≠ kelola dana” (klarifikasi)
          </div>
        </div>
        {/* stats + stamp */}
        <div style={{marginTop: 36, display: 'flex', gap: 26, alignItems: 'center'}}>
          <div style={{opacity: stat, background: C.black, borderLeft: `6px solid ${C.red}`, padding: '20px 32px'}}>
            <span style={{fontSize: 44, fontWeight: 800, color: C.red}}>85 korban</span>
            <span style={{fontSize: 34, color: C.bone, marginLeft: 18}}>± Rp25 miliar</span>
          </div>
          <div
            style={{
              border: `4px solid ${C.slate}`,
              color: C.slate,
              fontSize: 26,
              fontWeight: 800,
              letterSpacing: 3,
              padding: '16px 30px',
              opacity: stamp,
              transform: `scale(${1.7 - stamp * 0.7})`,
              background: 'rgba(8,12,19,0.85)',
            }}
          >
            DIALAMI PENYIDIK
          </div>
        </div>
        <div style={{marginTop: 24}}>
          <Source>Sumber: Liputan6; Kompas.com; IDXChannel; Bsinews (Okt 2026) — praduga tidak bersalah</Source>
        </div>
      </div>
      <Ilustrasi />
      <Vignette />
    </AbsoluteFill>
  );
};

/* ---------- SCENE 08 — MESIN YANG SAMA ---------- */

const S08: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const lock = f >= 420 && f <= 432;
  const shake = lock ? Math.sin(f * 3.7) * 8 : 0;
  const labels = [520, 680, 840];
  return (
    <AbsoluteFill style={{backgroundColor: C.navy, transform: `translateX(${shake}px)`}}>
      <ActTag act="ACT 4" name="THE MECHANISM" />
      <div style={{position: 'absolute', top: 120, width: '100%', textAlign: 'center'}}>
        <H1 at={10} size={64} style={{textAlign: 'center'}}>
          EMAS = <span style={{color: C.amber}}>KOSTUM</span>
        </H1>
      </div>
      <div
        style={{
          position: 'absolute',
          top: 270,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 1150,
          height: 640,
        }}
      >
        <Img
          src={staticFile('assets/INFO_MONEY_FLOW_01.png')}
          style={{width: '100%', height: '100%', objectFit: 'cover', opacity: ip(f, [20, 60], [0, 1])}}
        />
      </div>
      <div style={{position: 'absolute', bottom: 130, width: '100%', textAlign: 'center'}}>
        {[
          <>Bonus <b style={{color: C.amber}}>4 gram</b> ← setoran orang berikutnya</>,
          <>Bunga <b style={{color: C.amber}}>5–10%/bulan</b> ← titipan anggota baru</>,
          <>
            Mesinnya tetap <b style={{color: C.red}}>PONZI</b> — bayar yang lama dengan yang baru
          </>,
        ].map((t, i) => (
          <div
            key={i}
            style={{
              fontSize: 34,
              color: C.bone,
              fontWeight: 600,
              marginBottom: 12,
              opacity: ip(f, [labels[i], labels[i] + 26], [0, 1]),
            }}
          >
            {t}
          </div>
        ))}
      </div>
      <div style={{position: 'absolute', left: 48, bottom: 56, width: 1100, textAlign: 'left'}}>
        <Source>Sumber: Liputan6; Harianbasis; edukasi OJK — praduga tidak bersalah</Source>
      </div>
      <Ilustrasi />
      <Vignette />
    </AbsoluteFill>
  );
};

/* ---------- SCENE 09 — KENAPA YANG PINTAR JATUH ---------- */

const S09: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const cards = [
    {t: 'TOKO LANGGANAN', s: 'kepercayaan jadi kebiasaan', at: 80},
    {t: 'FIGUR PUBLIK', s: 'yang terlihat terasa nyata', at: 240},
    {t: 'BONUS +80%', s: 'untung besar = berhenti bertanya', at: 400},
    {t: 'MENUNGGU BULANAN', s: 'sudah terlanjur — berhenti = rugi', at: 560},
  ];
  const slash = ip(f, [760, 860], [0, 1]);
  const tag = ip(f, [900, 940], [0, 1]);
  return (
    <AbsoluteFill style={{backgroundColor: C.navy}}>
      <ActTag act="ACT 4" name="THE MECHANISM" />
      <div style={{position: 'absolute', top: 120, width: '100%', textAlign: 'center'}}>
        <H1 at={10} size={58} style={{textAlign: 'center'}}>
          EMPAT KUNCI <span style={{color: C.amber}}>KEPERCAYAAN</span>
        </H1>
      </div>
      <div
        style={{
          position: 'absolute',
          top: 280,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 1440,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 34,
        }}
      >
        {cards.map((c) => (
          <div
            key={c.t}
            style={{
              background: C.black,
              border: `2px solid ${C.slate}`,
              padding: '34px 44px',
              position: 'relative',
              opacity: ip(f, [c.at, c.at + 26], [0, 1], easeOut),
              transform: `translateY(${(1 - ip(f, [c.at, c.at + 26], [0, 1], easeOut)) * 24}px)`,
            }}
          >
            <div style={{fontSize: 40, fontWeight: 800, color: C.bone, letterSpacing: 1}}>{c.t}</div>
            <div style={{fontSize: 28, color: C.pale, marginTop: 10}}>{c.s}</div>
            <div
              style={{
                position: 'absolute',
                left: 24,
                top: '50%',
                width: `${slash * 88}%`,
                height: 6,
                background: C.red,
                transform: 'translateY(-50%) rotate(-3deg)',
              }}
            />
          </div>
        ))}
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 110,
          width: '100%',
          textAlign: 'center',
          opacity: tag,
        }}
      >
        <div style={{fontSize: 34, color: C.bone, fontWeight: 700}}>
          Korban bukan orang bodoh — sistemnya <span style={{color: C.red}}>'dirancang terlihat bisa dipercaya'</span>
        </div>
        <div style={{marginTop: 10, fontSize: 22, letterSpacing: 3, color: C.slate}}>ANALISIS — PSIKOLOGI KORBAN</div>
      </div>
      <div style={{position: 'absolute', left: 48, bottom: 56, width: 1100, textAlign: 'left'}}>
        <Source>Sumber: edukasi OJK — 7 ciri ponzi &amp; 2L; literasi keuangan keluarga</Source>
      </div>
      <Ilustrasi />
      <Vignette />
    </AbsoluteFill>
  );
};

/* ---------- SCENE 10 — HARGA MENTAH VS JANJI ---------- */

const S10: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const reveal = ip(f, [40, 380], [0, 1]);
  const snap = ip(f, [780, 800, 830], [0, 0.5, 0]);
  const q = ip(f, [880, 920], [0, 1], easeOut);
  return (
    <AbsoluteFill style={{backgroundColor: C.navy}}>
      <ActTag act="ACT 4" name="THE MECHANISM" />
      <div style={{position: 'absolute', top: 120, width: '100%', textAlign: 'center'}}>
        <H1 at={10} size={58} style={{textAlign: 'center'}}>
          KENYATAAN vs <span style={{color: C.red}}>JANJI</span>
        </H1>
      </div>
      <div
        style={{
          position: 'absolute',
          top: 260,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 1400,
          height: 600,
          clipPath: `inset(0 ${(1 - reveal) * 100}% 0 0)`,
        }}
      >
        <Img src={staticFile('assets/INFO_DUA_KURVA_01.png')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        <div style={{position: 'absolute', left: 60, bottom: 40, fontSize: 30, fontWeight: 800, color: C.amber, background: 'rgba(8,12,19,0.8)', padding: '10px 22px'}}>
          KENYATAAN: Rp1,5 jt → &gt;Rp3 jt/gram · setahun
        </div>
        <div style={{position: 'absolute', right: 60, top: 50, fontSize: 30, fontWeight: 800, color: C.red, background: 'rgba(8,12,19,0.8)', padding: '10px 22px'}}>
          JANJI: 5–10% per BULAN
        </div>
      </div>
      <AbsoluteFill style={{background: C.bone, opacity: snap, pointerEvents: 'none'}} />
      <div style={{position: 'absolute', bottom: 110, width: '100%', textAlign: 'center', opacity: q}}>
        <div style={{fontSize: 44, fontWeight: 800, color: C.bone}}>
          Emas bisa memberi <span style={{color: C.amber}}>5–10% tiap bulan</span>? <span style={{color: C.red}}>Tidak pernah.</span>
        </div>
        <div style={{marginTop: 12}}>
          <Source>Sumber: harga Logam Mulia/Antam 2025–2026; edukasi OJK — untung tetap bulanan = red flag</Source>
        </div>
      </div>
      <Ilustrasi />
      <Vignette />
    </AbsoluteFill>
  );
};

/* ---------- SCENE 11 — EMPAT TANDA + 157 ---------- */

const S11: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const flags = [
    'Harga terlalu miring',
    'Transfer ke rekening pribadi',
    'Barang nunggu berbulan-bulan',
    'Penarikan dipersulit',
    'Untung tetap tiap bulan',
  ];
  const cards = [760, 900];
  const last = ip(f, [1060, 1100], [0, 1], easeOut);
  return (
    <AbsoluteFill style={{backgroundColor: C.navy}}>
      <ActTag act="ACT 5" name="THE DEFENSE" />
      <div style={{position: 'absolute', top: 120, width: '100%', textAlign: 'center'}}>
        <H1 at={10} size={56} style={{textAlign: 'center'}}>
          KENALI <span style={{color: C.amber}}>TANDANYA</span>
        </H1>
      </div>
      {/* checklist */}
      <div
        style={{
          position: 'absolute',
          left: 110,
          top: 270,
          width: 860,
          background: C.bone,
          color: C.navy,
          padding: '40px 54px',
        }}
      >
        <div style={{fontSize: 24, letterSpacing: 5, color: C.slate, marginBottom: 16}}>RED FLAGS — OJK</div>
        {flags.map((t, i) => (
          <div
            key={t}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 22,
              padding: '16px 0',
              borderTop: i ? '1px solid rgba(16,26,43,0.2)' : 'none',
              opacity: ip(f, [100 + i * 90, 130 + i * 90], [0, 1]),
            }}
          >
            <span style={{fontSize: 34, fontWeight: 900, color: i === 4 ? C.amber : C.red}}>✕</span>
            <span style={{fontSize: 33, fontWeight: 700, color: i === 4 ? C.amber : C.navy}}>{t}</span>
          </div>
        ))}
      </div>
      {/* 2L cards */}
      <div style={{position: 'absolute', right: 110, top: 270, width: 640}}>
        {[
          {n: 'LEGAL', s: 'Izinnya ada? Cek OJK. Antam · Pegadaian · platform berizin.', at: cards[0]},
          {n: 'LOGIS', s: 'Untungnya masuk akal? 5–10%/bulan = tidak.', at: cards[1]},
        ].map((c) => (
          <div
            key={c.n}
            style={{
              background: C.black,
              border: `2px solid ${C.amber}`,
              padding: '30px 40px',
              marginBottom: 28,
              opacity: ip(f, [c.at, c.at + 26], [0, 1], easeOut),
            }}
          >
            <div style={{fontSize: 44, fontWeight: 800, color: C.bone, letterSpacing: 4}}>{c.n}</div>
            <div style={{fontSize: 27, color: C.pale, marginTop: 10, lineHeight: 1.45}}>{c.s}</div>
          </div>
        ))}
        <div
          style={{
            display: 'flex',
            gap: 22,
            alignItems: 'stretch',
            opacity: last,
            transform: `translateY(${(1 - last) * 20}px)`,
          }}
        >
          <div
            style={{
              flex: 1,
              background: C.black,
              border: `3px solid ${C.amber}`,
              textAlign: 'center',
              padding: '22px 10px',
            }}
          >
            <div style={{fontSize: 62, fontWeight: 900, color: C.amber}}>157</div>
            <div style={{fontSize: 22, color: C.pale}}>Kontak OJK</div>
          </div>
          <div style={{flex: 1.6, background: C.black, border: `1px solid ${C.slate}`, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 28px'}}>
            <div style={{fontSize: 30, fontWeight: 700, color: C.bone}}>iasc.ojk.go.id</div>
            <div style={{fontSize: 23, color: C.pale, marginTop: 6}}>korban penipuan — blokir rekening cepat</div>
          </div>
        </div>
      </div>
      <div style={{position: 'absolute', left: 48, bottom: 56, width: 1100, textAlign: 'left'}}>
        <Source>Sumber: sikapiuangmu.OJK; edukasi OJK (2024–2026); IASC (2026)</Source>
      </div>
      <Ilustrasi />
      <Vignette />
    </AbsoluteFill>
  );
};

/* ---------- SCENE 12 — TANGGA HUKUM 2026 ---------- */

const S12: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const law = ip(f, [60, 100], [0, 1], easeOut);
  const c1 = ip(f, [340, 380], [0, 1]);
  const st = ip(f, [820, 870], [0, 1], easeOut);
  return (
    <AbsoluteFill style={{backgroundColor: C.navy}}>
      <KenBurns src="assets/ENV_PENGADILAN_DOKUMEN_01.png" dur={dur} from={1.1} to={1.03} />
      <AbsoluteFill style={{background: 'rgba(8,12,19,0.68)'}} />
      <ActTag act="ACT 5" name="THE DEFENSE" />
      <div style={{position: 'absolute', top: 130, width: '100%', textAlign: 'center'}}>
        <H1 at={12} size={58} style={{textAlign: 'center'}}>
          HUKUM <span style={{color: C.amber}}>BERGERAK</span>
        </H1>
      </div>
      <div
        style={{
          position: 'absolute',
          top: 260,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 1240,
          background: C.bone,
          color: C.navy,
          padding: '34px 50px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          opacity: law,
        }}
      >
        <div>
          <div style={{fontSize: 34, fontWeight: 800}}>Pasal 492 KUHP Baru (UU 1/2023)</div>
          <div style={{fontSize: 26, color: C.slate, marginTop: 6}}>penipuan — ancaman maksimal 4 tahun</div>
        </div>
        <div style={{fontSize: 28, fontWeight: 800, color: C.amber, letterSpacing: 2, border: `3px solid ${C.amber}`, padding: '12px 24px'}}>
          BERLAKU 2 JAN 2026
        </div>
      </div>
      {/* counters */}
      <div
        style={{
          position: 'absolute',
          top: 470,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 1340,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 26,
          opacity: c1,
        }}
      >
        {[
          {v: <Counter from={0} to={250} start={380} dur={380} />, l: 'entitas investasi ilegal dihentikan (Jan–Sep 2026)', c: C.red},
          {v: <Counter from={0} to={702833} start={380} dur={460} />, l: 'rekening penipuan diblokir (IASC, per 30 Sep 2026)', c: C.red},
          {v: <Counter from={0} to={825200000000} start={380} dur={480} prefix="Rp " />, l: 'dana tertahan di rekening terblokir', c: C.bone},
          {v: <Counter from={0} to={207160000000} start={380} dur={480} prefix="Rp " />, l: 'difasilitasi kembali ke korban', c: C.green},
        ].map((x, i) => (
          <div key={i} style={{background: 'rgba(8,12,19,0.92)', border: `1px solid ${C.slate}`, padding: '26px 36px'}}>
            <div style={{fontSize: 52, fontWeight: 800, color: x.c, fontVariantNumeric: 'tabular-nums'}}>{x.v}</div>
            <div style={{fontSize: 25, color: C.pale, marginTop: 8, lineHeight: 1.4}}>{x.l}</div>
          </div>
        ))}
      </div>
      {/* case stamps */}
      <div style={{position: 'absolute', bottom: 120, width: '100%', display: 'flex', justifyContent: 'center', gap: 30}}>
        {['PANDEGLANG', 'DIVINE GOLD'].map((t) => (
          <div
            key={t}
            style={{
              border: `4px solid ${C.amber}`,
              color: C.amber,
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: 3,
              padding: '16px 34px',
              background: 'rgba(8,12,19,0.9)',
              opacity: st,
              transform: `scale(${1.6 - st * 0.6})`,
            }}
          >
            {t} — PROSES BERJALAN
          </div>
        ))}
      </div>
      <div style={{position: 'absolute', bottom: 54, width: '100%', textAlign: 'center'}}>
        <Source>Sumber: UU 1/2023; Satgas PASTI/OJK (RDK OJK 2026); Pewarta — belum ada vonis untuk kedua kasus</Source>
      </div>
      <Ilustrasi />
      <Vignette />
    </AbsoluteFill>
  );
};

/* ---------- SCENE 13 — YANG HILANG BUKAN ANGKA ---------- */

const S13: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const l1 = ip(f, [140, 190], [0, 1]);
  const st = ip(f, [620, 670], [0, 1], easeOut);
  return (
    <AbsoluteFill style={{backgroundColor: C.navy}}>
      <KenBurns src="assets/ENV_KELUARGA_MENUNGGU_01.png" dur={dur} from={1.04} to={1.12} dx={30} />
      <AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(16,26,43,0.94) 0%, rgba(16,26,43,0.6) 50%, rgba(16,26,43,0.15) 100%)'}} />
      <ActTag act="ACT 6" name="THE LESSON" />
      <div style={{position: 'absolute', left: 48, top: 190, maxWidth: 950}}>
        <H1 at={16} size={58}>
          YANG HILANG BUKAN
          <br />
          CUMA <span style={{color: C.red}}>ANGKA</span>
        </H1>
        <div style={{marginTop: 46, fontSize: 36, color: C.bone, lineHeight: 1.6, opacity: l1}}>
          Umrah yang dibiayai utang.
          <br />
          Sunatan yang tertunda.
          <br />
          <span style={{color: C.pale}}>Kepercayaan pada toko tetangga — yang paling sulit kembali.</span>
        </div>
        <div
          style={{
            marginTop: 56,
            display: 'inline-block',
            border: `4px solid ${C.amber}`,
            color: C.amber,
            fontSize: 30,
            fontWeight: 800,
            letterSpacing: 3,
            padding: '18px 36px',
            background: 'rgba(8,12,19,0.85)',
            opacity: st,
            transform: `scale(${1.5 - st * 0.5})`,
          }}
        >
          PEMULIHAN — PELAN, BERJALAN
        </div>
        <div style={{marginTop: 28, fontSize: 26, color: C.green, opacity: st}}>
          ✓ lapor lebih awal → peluang dana tertahan dikembalikan
        </div>
      </div>
      <div style={{position: 'absolute', left: 48, bottom: 56, width: 1100, textAlign: 'left'}}>
        <Source>Sumber: liputan korban (Sep–Nov 2026); IASC — pengembalian dana</Source>
      </div>
      <Ilustrasi />
      <Vignette />
    </AbsoluteFill>
  );
};

/* ---------- SCENE 14 — INSIGHT & OUT ---------- */

const S14: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const q1 = ip(f, [80, 130], [0, 1], easeOut);
  const cards = ip(f, [420, 470], [0, 1]);
  const brand = ip(f, [760, 820], [0, 1], easeOut);
  return (
    <AbsoluteFill style={{backgroundColor: C.navy}}>
      <Img
        src={staticFile('assets/CHAR_INVESTIGATOR_REVEAL_01.png')}
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          width: '46%',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${ip(f, [0, dur], [1.03, 1.1])})`,
        }}
      />
      <AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(16,26,43,0.98) 0%, rgba(16,26,43,0.8) 45%, rgba(16,26,43,0.08) 70%)'}} />
      <ActTag act="ACT 6" name="THE LESSON" />
      <div style={{position: 'absolute', left: 48, top: 150, maxWidth: 980}}>
        <H1 at={20} size={54}>
          Emas tidak pernah bohong —
          <br />
          <span style={{color: C.amber}}>yang berbohong: orang yang menjanjikannya.</span>
        </H1>
        <div
          style={{
            marginTop: 50,
            display: 'flex',
            gap: 24,
            opacity: cards,
          }}
        >
          <div style={{background: C.black, border: `2px solid ${C.amber}`, padding: '24px 36px', textAlign: 'center', flex: 1}}>
            <div style={{fontSize: 38, fontWeight: 800, color: C.bone, letterSpacing: 3}}>LEGAL</div>
            <div style={{fontSize: 23, color: C.pale, marginTop: 8}}>izinnya ada?</div>
          </div>
          <div style={{background: C.black, border: `2px solid ${C.amber}`, padding: '24px 36px', textAlign: 'center', flex: 1}}>
            <div style={{fontSize: 38, fontWeight: 800, color: C.bone, letterSpacing: 3}}>LOGIS</div>
            <div style={{fontSize: 23, color: C.pale, marginTop: 8}}>untungnya masuk akal?</div>
          </div>
          <div style={{background: C.black, border: `2px solid ${C.amber}`, padding: '24px 36px', textAlign: 'center', flex: 0.7}}>
            <div style={{fontSize: 48, fontWeight: 900, color: C.amber}}>157</div>
            <div style={{fontSize: 21, color: C.pale, marginTop: 4}}>sudah ragu?</div>
          </div>
        </div>
        <div style={{marginTop: 44, fontSize: 30, color: C.pale, opacity: cards}}>
          Uang mungkin bisa dicari lagi. <span style={{color: C.bone, fontWeight: 700}}>Waktu dan kepercayaan — tidak.</span>
        </div>
        <div
          style={{
            marginTop: 70,
            opacity: brand,
            transform: `translateY(${(1 - brand) * 20}px)`,
          }}
        >
          <div style={{fontSize: 58, fontWeight: 800, letterSpacing: 14, color: C.amber}}>
            RUANG MARGIN
          </div>
          <div style={{fontSize: 26, letterSpacing: 6, color: C.pale, marginTop: 10}}>
            THE STORIES BEHIND MONEY.
          </div>
        </div>
      </div>
      <div style={{position: 'absolute', left: 48, bottom: 56, width: 1100, textAlign: 'left'}}>
        <Source>Sumber: ringkasan F01–F22 — lampiran 02-research-ledger.md</Source>
      </div>
      <Ilustrasi />
      <Vignette />
    </AbsoluteFill>
  );
};

/* ---------- episode assembly ---------- */

export const Episode: React.FC = () => {
  let from = 0;
  const nodes: React.ReactNode[] = [];
  const S = SCENES;
  const push = (i: number, el: React.ReactNode, cut = false) => {
    const dur = S[i].sec * FPS;
    nodes.push(
      <Sequence key={S[i].id} from={from} durationInFrames={dur} layout="none">
        <SceneBox dur={dur} cut={cut}>
          {el}
        </SceneBox>
      </Sequence>
    );
    from += dur;
  };

  push(0, <S01 />);
  push(1, <S02 dur={S[1].sec * FPS} />);
  push(2, <S03 dur={S[2].sec * FPS} />);
  push(3, <S04 dur={S[3].sec * FPS} />);
  push(4, <S05 dur={S[4].sec * FPS} />);
  push(5, <S06 dur={S[5].sec * FPS} />);
  push(6, <S07 dur={S[6].sec * FPS} />);
  push(7, <S08 dur={S[7].sec * FPS} />);
  push(8, <S09 dur={S[8].sec * FPS} />);
  push(9, <S10 dur={S[9].sec * FPS} />);
  push(10, <S11 dur={S[10].sec * FPS} />, true); // hard cut into checklist act
  push(11, <S12 dur={S[11].sec * FPS} />);
  push(12, <S13 dur={S[12].sec * FPS} />);
  push(13, <S14 dur={S[13].sec * FPS} />);

  return <AbsoluteFill style={{backgroundColor: C.black}}>{nodes}</AbsoluteFill>;
};
