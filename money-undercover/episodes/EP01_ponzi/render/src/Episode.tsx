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
  cut?: boolean; // hard cut in/out (no fade)
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
        }}
      >
        MONEY <span style={{color: C.amber}}>UNDERCOVER</span>
      </div>
    </AbsoluteFill>
  );
};

const ActTag: React.FC<{act: string; name: string}> = ({act, name}) => (
  <div style={{position: 'absolute', top: 36, left: 48, fontSize: 22, letterSpacing: 4}}>
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
  const voidS = ip(f, [120, 660], [0, 1]);
  const head = ip(f, [240, 270], [0, 1], easeOut);
  return (
    <AbsoluteFill style={{backgroundColor: C.navy, alignItems: 'center', justifyContent: 'center'}}>
      <ActTag act="ACT 1" name="THE HOOK" />
      {/* balance panel */}
      <div
        style={{
          background: C.black,
          border: `2px solid ${C.slate}`,
          padding: '54px 90px',
          textAlign: 'center',
          transform: `translateY(${-40}px)`,
          boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
          zIndex: 2,
        }}
      >
        <div style={{fontSize: 24, letterSpacing: 8, color: C.slate, marginBottom: 18}}>
          SALDO TERKREDIT
        </div>
        <div style={{fontSize: 110, fontWeight: 800, color: C.amber, fontVariantNumeric: 'tabular-nums'}}>
          <Counter from={0} to={12450000} start={60} dur={480} prefix="Rp " />
        </div>
        <div style={{fontSize: 24, color: C.pale, marginTop: 14}}>Naik. Tepat waktu. Nyata.</div>
      </div>
      {/* red void growing beneath */}
      <div
        style={{
          position: 'absolute',
          bottom: -160,
          width: 900 + voidS * 500,
          height: 260 + voidS * 160,
          background: `radial-gradient(ellipse at center, ${C.red} 0%, rgba(217,75,64,0.35) 45%, rgba(8,12,19,0) 72%)`,
          opacity: 0.85,
          filter: 'blur(2px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 120,
          textAlign: 'center',
          fontSize: 30,
          color: C.red,
          letterSpacing: 4,
          fontWeight: 700,
          opacity: voidS,
        }}
      >
        LUBANG DI BAWAHNYA — TAK TERLIHAT
      </div>
      {/* headline */}
      <div
        style={{
          position: 'absolute',
          bottom: 210,
          width: '100%',
          textAlign: 'center',
          opacity: head,
          transform: `translateY(${(1 - head) * 24}px)`,
        }}
      >
        <div style={{fontSize: 84, fontWeight: 800, color: C.bone, letterSpacing: -2}}>
          KORBAN PERTAMA <span style={{color: C.amber}}>JUSTRU DIBAYAR</span>
        </div>
        <div style={{fontSize: 34, color: C.pale, marginTop: 16}}>
          Bukan ditipu — dibayar. Lalu semuanya hilang.
        </div>
      </div>
      <Ilustrasi />
      <Vignette />
    </AbsoluteFill>
  );
};

/* ---------- SCENE 02 — BOSTON 1920 ---------- */

const S02: React.FC<{dur: number}> = ({dur}) => (
  <AbsoluteFill style={{backgroundColor: C.navy}}>
    <KenBurns src="assets/ENV_BOSTON_1920_01.png" dur={dur} from={1.04} to={1.16} dx={-60} />
    <AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(16,26,43,0.92) 0%, rgba(16,26,43,0.55) 45%, rgba(16,26,43,0.1) 100%)'}} />
    <ActTag act="ACT 2" name="THE SETUP" />
    <div style={{position: 'absolute', left: 48, top: 160, maxWidth: 980}}>
      <H1 at={20} size={64}>
        BOSTON, <span style={{color: C.amber}}>1920</span>
      </H1>
      <div style={{marginTop: 44, background: C.black, borderLeft: `6px solid ${C.amber}`, padding: '30px 44px', opacity: ip(useCurrentFrame(), [80, 110], [0, 1])}}>
        <div style={{fontSize: 96, fontWeight: 800, color: C.amber, lineHeight: 1}}>50%</div>
        <div style={{fontSize: 34, color: C.bone, marginTop: 8}}>dalam 45 hari — janji Charles Ponzi</div>
      </div>
      <div style={{marginTop: 40, fontSize: 34, color: C.pale, lineHeight: 1.5, opacity: ip(useCurrentFrame(), [260, 300], [0, 1])}}>
        Antrian memanjang. Puluhan ribu warga menyerahkan uangnya.
        <br />
        Tidak ada yang merasa masuk perangkap — mereka merasa <span style={{color: C.bone, fontWeight: 700}}>masuk lebih awal</span>.
      </div>
      <div style={{marginTop: 28}}>
        <Source>Sumber: Smithsonian National Postal Museum; The New York Times (arsip 1920)</Source>
      </div>
    </div>
    <Ilustrasi />
    <Vignette />
  </AbsoluteFill>
);

/* ---------- SCENE 03 — IT REALLY PAID ---------- */

const S03: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const stamp = ip(f, [380, 420], [0, 1], easeOut);
  const rows = [120, 300, 480];
  return (
    <AbsoluteFill style={{backgroundColor: C.navy}}>
      <Img
        src={staticFile('assets/CHAR_CONSUMER_RANI_01.png')}
        style={{position: 'absolute', right: 0, top: 0, width: '52%', height: '100%', objectFit: 'cover', transform: `scale(${ip(f, [0, dur], [1.03, 1.1])})`}}
      />
      <AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(16,26,43,0.97) 0%, rgba(16,26,43,0.75) 40%, rgba(16,26,43,0) 65%)'}} />
      <ActTag act="ACT 2" name="THE SETUP" />
      <div style={{position: 'absolute', left: 48, top: 170, maxWidth: 900}}>
        <H1 at={16} size={60}>
          BUKTI TERBAIK
          <br />
          YANG PERNAH <span style={{color: C.amber}}>ADA</span>
        </H1>
        {/* receipt card */}
        <div style={{marginTop: 46, background: C.bone, color: C.navy, padding: '34px 44px', width: 720, position: 'relative'}}>
          <div style={{fontSize: 24, letterSpacing: 5, color: C.slate, marginBottom: 20}}>LAPORAN PENARIKAN</div>
          {['Pencairan #1 — masuk', 'Pencairan #2 — masuk', 'Pencairan #3 — diproses'].map((t, i) => (
            <div
              key={t}
              style={{
                fontSize: 32,
                fontWeight: 700,
                padding: '14px 0',
                borderTop: i ? `1px solid rgba(16,26,43,0.25)` : 'none',
                opacity: ip(f, [rows[i], rows[i] + 20], [0, 1]),
                color: i === 2 ? C.slate : C.navy,
              }}
            >
              <span style={{color: C.green, marginRight: 18}}>✓</span>
              {t}
            </div>
          ))}
          {/* stamp */}
          <div
            style={{
              position: 'absolute',
              right: -30,
              bottom: -34,
              border: `5px solid ${C.red}`,
              color: C.red,
              fontWeight: 800,
              fontSize: 30,
              letterSpacing: 2,
              padding: '12px 24px',
              background: 'rgba(242,240,233,0.92)',
              transform: `rotate(-8deg) scale(${2 - stamp})`,
              opacity: stamp,
            }}
          >
            DIBAYARKAN TEPAT WAKTU
          </div>
        </div>
        <div style={{marginTop: 56, fontSize: 32, color: C.pale, lineHeight: 1.5, opacity: ip(f, [560, 600], [0, 1])}}>
          Setiap pembayaran adalah iklan yang dibayar
          <br />
          oleh <span style={{color: C.amber, fontWeight: 700}}>anggota berikutnya</span>.
        </div>
      </div>
      <Ilustrasi />
      <Vignette />
    </AbsoluteFill>
  );
};

/* ---------- SCENE 04 — THE WALL ---------- */

const S04: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const reveal = ip(f, [30, 380], [0, 1]);
  const hit = f >= 430 && f <= 442;
  const shake = hit ? Math.sin(f * 3.7) * 10 : 0;
  const flash = ip(f, [428, 434, 448], [0, 0.55, 0]);
  const frozen = f > 448;
  return (
    <AbsoluteFill style={{backgroundColor: C.navy, transform: `translateX(${shake}px)`}}>
      <ActTag act="ACT 3" name="THE MECHANISM" />
      <div style={{position: 'absolute', top: 140, width: '100%', textAlign: 'center'}}>
        <H1 at={10} size={64} style={{textAlign: 'center'}}>
          DINDING <span style={{color: C.red}}>MATEMATIKA</span>
        </H1>
      </div>
      <div style={{position: 'absolute', top: 280, left: '50%', transform: 'translateX(-50%)', width: 1500, height: 640, clipPath: `inset(0 ${(1 - reveal) * 100}% 0 0)`}}>
        <Img src={staticFile('assets/INFO_KURVA_TUMBUKAN_01.png')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </div>
      <div style={{position: 'absolute', bottom: 120, width: '100%', textAlign: 'center', opacity: ip(f, [460, 500], [0, 1])}}>
        <div style={{fontSize: 40, color: C.bone, fontWeight: 700}}>
          Skema tidak <span style={{color: C.amber}}>menghasilkan</span> uang — ia{' '}
          <span style={{color: C.red}}>memindahkan</span> uang.
        </div>
        <div style={{fontSize: 28, color: C.pale, marginTop: 14, opacity: frozen ? 1 : 0.4}}>
          12 Agustus 1920 — Ponzi ditangkap. Kerugian investor: ±USD 7 juta.
        </div>
        <div style={{marginTop: 16}}>
          <Source>Sumber: Smithsonian Postal Museum; Biography.com — angka kerugian bervariasi antar sumber</Source>
        </div>
      </div>
      <AbsoluteFill style={{background: C.bone, opacity: flash, pointerEvents: 'none'}} />
      <Ilustrasi />
      <Vignette />
    </AbsoluteFill>
  );
};

/* ---------- SCENE 05 — DEFINITION ---------- */

const S05: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const sweep = ip(f, [260, 480], [0, 1]);
  return (
    <AbsoluteFill style={{backgroundColor: C.navy}}>
      <KenBurns src="assets/ENV_PENGADILAN_DOKUMEN_01.png" dur={dur} from={1.1} to={1.02} />
      <AbsoluteFill style={{background: 'rgba(8,12,19,0.62)'}} />
      <ActTag act="ACT 3" name="THE MECHANISM" />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
        <div style={{background: C.bone, color: C.navy, width: 1360, padding: '64px 80px', position: 'relative', opacity: ip(f, [20, 50], [0, 1]), transform: `translateY(${ip(f, [20, 50], [40, 0], easeOut)}px)`}}>
          <div style={{fontSize: 26, letterSpacing: 6, color: C.slate, marginBottom: 28}}>DEFINISI RESMI — OJK</div>
          <div style={{fontSize: 46, lineHeight: 1.55, fontWeight: 600}}>
            Skema Ponzi membayarkan keuntungan kepada investor dari uang mereka sendiri — atau dari{' '}
            <span style={{position: 'relative', whiteSpace: 'nowrap'}}>
              <span style={{position: 'absolute', left: 0, bottom: 4, height: 16, width: `${sweep * 100}%`, background: C.amber, opacity: 0.75}} />
              <span style={{position: 'relative'}}>uang investor berikutnya</span>
            </span>{' '}
            — bukan dari keuntungan bisnis yang dijalankan.
          </div>
          <div style={{display: 'flex', gap: 34, marginTop: 46}}>
            {[
              ['1', 'Dibayar → korban melihat uang'],
              ['2', 'Dari investor lain → lubang tumbuh'],
              ['3', 'Tanpa bisnis → lubang tak tertutup'],
            ].map(([n, t], i) => (
              <div key={n} style={{flex: 1, opacity: ip(f, [520 + i * 40, 560 + i * 40], [0, 1])}}>
                <div style={{fontSize: 54, fontWeight: 800, color: C.amber}}>{n}</div>
                <div style={{fontSize: 28, color: C.navy, marginTop: 6, lineHeight: 1.35}}>{t}</div>
              </div>
            ))}
          </div>
          <div style={{position: 'absolute', right: 40, bottom: 26, fontSize: 22, color: C.slate}}>
            sikapiuangmu.ojk.go.id
          </div>
        </div>
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

/* ---------- SCENE 06 — MONEY FLOW ---------- */

const S06: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const dots = [0, 1, 2, 3, 4];
  return (
    <AbsoluteFill style={{backgroundColor: C.navy}}>
      <ActTag act="ACT 3" name="THE MECHANISM" />
      <div style={{position: 'absolute', top: 130, width: '100%', textAlign: 'center'}}>
        <H1 at={10} size={62} style={{textAlign: 'center'}}>
          SATU SETORAN, <span style={{color: C.amber}}>DUA TUJUAN</span>
        </H1>
      </div>
      <div style={{position: 'absolute', top: 270, left: '50%', transform: 'translateX(-50%)', width: 1240, height: 700}}>
        <Img src={staticFile('assets/INFO_MONEY_FLOW_01.png')} style={{width: '100%', height: '100%', objectFit: 'cover', opacity: ip(f, [20, 50], [0, 1])}} />
        {/* falling coins */}
        {dots.map((i) => {
          const t = ((f / 70) + i * 0.2) % 1;
          const y = 60 + t * 460;
          const x = 300 + i * 160 + Math.sin(t * Math.PI) * 40;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: x,
                top: y,
                width: 26,
                height: 26,
                borderRadius: 13,
                background: C.amber,
                boxShadow: `0 0 18px ${C.amber}`,
                opacity: t > 0.92 ? 1 - (t - 0.92) / 0.08 : 1,
              }}
            />
          );
        })}
      </div>
      <div style={{position: 'absolute', left: 90, bottom: 170, width: 620, opacity: ip(f, [140, 180], [0, 1])}}>
        <div style={{fontSize: 34, fontWeight: 800, color: C.amber, letterSpacing: 1}}>→ DIBAYARKAN KE PESERTA LAMA</div>
        <div style={{fontSize: 27, color: C.pale, marginTop: 10, lineHeight: 1.45}}>Uang nyata. Mereka tersenyum. Mereka merekrut.</div>
      </div>
      <div style={{position: 'absolute', right: 90, bottom: 170, width: 620, textAlign: 'right', opacity: ip(f, [320, 360], [0, 1])}}>
        <div style={{fontSize: 34, fontWeight: 800, color: C.red, letterSpacing: 1}}>MENAMBAH LUBANG +</div>
        <div style={{fontSize: 27, color: C.pale, marginTop: 10, lineHeight: 1.45}}>Setiap rupiah yang keluar meninggalkan lubang.</div>
      </div>
      <div style={{position: 'absolute', bottom: 60, width: '100%', textAlign: 'center', opacity: ip(f, [900, 940], [0, 1])}}>
        <div style={{fontSize: 30, color: C.bone}}>
          Yang dijual bukan produk. Yang dijual:{' '}
          <span style={{color: C.amber, fontWeight: 800}}>pembayaran yang terlanjur terbukti</span>.
        </div>
      </div>
      <Ilustrasi />
      <Vignette />
    </AbsoluteFill>
  );
};

/* ---------- SCENE 07 — MODERN FACE ---------- */

const S07: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const notes = [
    ['Grup VIP', 'Pencairan ke-3 berhasil ✓'],
    ['Bonus referral', '10% masuk rekening'],
    ['Teman satu kampus', '“ikut juga?”'],
  ];
  return (
    <AbsoluteFill style={{backgroundColor: C.navy}}>
      <KenBurns src="assets/ENV_KAMAR_GELAP_01.png" dur={dur} from={1.08} to={1.0} dy={-30} />
      <ActTag act="ACT 3" name="THE MECHANISM" />
      <div style={{position: 'absolute', left: 48, top: 160, maxWidth: 960}}>
        <H1 at={16} size={58}>
          POLANYA TIDAK BERUBAH —
          <br />
          <span style={{color: C.amber}}>ANTRENYA PINDAH KE PONSEL</span>
        </H1>
        <div style={{marginTop: 34, fontSize: 32, color: C.pale, lineHeight: 1.5, opacity: ip(f, [160, 200], [0, 1])}}>
          Juli 2026 — OJK NTT menegaskan aplikasi VIR{' '}
          <span style={{color: C.red, fontWeight: 700}}>ilegal & tidak berizin</span>, indikasi skema Ponzi:
          anggota baru wajib menyetor saat pendaftaran.
        </div>
        <div style={{marginTop: 22, opacity: ip(f, [420, 460], [0, 1])}}>
          <Source>Sumber: ANTARA News Kupang, 17 Juli 2026 — 3 pengaduan: Rp40 jt / Rp9 jt / Rp4 jt</Source>
        </div>
      </div>
      {/* notifications */}
      <div style={{position: 'absolute', right: 120, top: 200, width: 640}}>
        {notes.map(([title, body], i) => {
          const p = ip(f, [240 + i * 90, 280 + i * 90], [0, 1], easeOut);
          return (
            <div
              key={title}
              style={{
                background: 'rgba(8,12,19,0.92)',
                border: `1px solid ${C.slate}`,
                borderLeft: `6px solid ${C.amber}`,
                padding: '24px 30px',
                marginBottom: 26,
                opacity: p,
                transform: `translateX(${(1 - p) * 120}px)`,
              }}
            >
              <div style={{fontSize: 24, color: C.amber, letterSpacing: 2, fontWeight: 700}}>{title}</div>
              <div style={{fontSize: 30, color: C.bone, marginTop: 8}}>{body}</div>
            </div>
          );
        })}
        <div style={{fontSize: 20, color: C.slate, letterSpacing: 3, textAlign: 'right'}}>ILUSTRASI</div>
      </div>
      <Vignette />
    </AbsoluteFill>
  );
};

/* ---------- SCENE 08 — RANI ---------- */

const S08: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const beats = [
    {at: 300, label: 'PENARIKAN #1', ok: true, note: 'uang masuk — keraguan berkurang'},
    {at: 700, label: 'PENARIKAN #2', ok: true, note: 'untung lagi — keyakinan tumbuh'},
    {at: 1150, label: 'PENARIKAN #3', ok: false, note: 'TERTUNDA — layar bergetar'},
  ];
  const glitch = f >= 1150 && f <= 1190 ? Math.sin(f * 5.1) * 8 : 0;
  return (
    <AbsoluteFill style={{backgroundColor: C.navy, transform: `translateX(${glitch}px)`}}>
      <Img
        src={staticFile('assets/CHAR_CONSUMER_RANI_01.png')}
        style={{position: 'absolute', left: 0, top: 0, width: '50%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%', transform: `scale(${ip(f, [0, dur], [1.05, 1.0])})`}}
      />
      <AbsoluteFill style={{background: 'linear-gradient(270deg, rgba(16,26,43,0.97) 0%, rgba(16,26,43,0.8) 42%, rgba(16,26,43,0.15) 70%)'}} />
      <ActTag act="ACT 4" name="THE CONFLICT" />
      <div style={{position: 'absolute', right: 70, top: 150, width: 940}}>
        <H1 at={16} size={56} style={{textAlign: 'right'}}>
          RANI TIDAK BODOH.
          <br />
          <span style={{color: C.amber}}>IA PUNYA 20 BUKTI NYATA.</span>
        </H1>
        <div style={{marginTop: 50}}>
          {beats.map((b) => {
            const p = ip(f, [b.at, b.at + 24], [0, 1], easeOut);
            const col = b.ok ? C.green : C.red;
            return (
              <div
                key={b.label}
                style={{
                  background: C.black,
                  border: `2px solid ${col}`,
                  padding: '26px 36px',
                  marginBottom: 26,
                  opacity: p,
                  transform: `translateX(${(1 - p) * 90}px)`,
                  textAlign: 'right',
                }}
              >
                <div style={{fontSize: 36, fontWeight: 800, color: col}}>
                  {b.ok ? '✓' : '⚠'} {b.label} — {b.ok ? 'BERHASIL' : 'TERTUNDA'}
                </div>
                <div style={{fontSize: 26, color: C.pale, marginTop: 6}}>{b.note}</div>
              </div>
            );
          })}
        </div>
        <div style={{fontSize: 28, color: C.bone, textAlign: 'right', opacity: ip(f, [1350, 1400], [0, 1]), lineHeight: 1.5}}>
          Bias konfirmasi. Biaya tenggelam. Takut tertinggal.
          <br />
          <span style={{color: C.amber, fontWeight: 700}}>Dua puluh bukti. Nol alasan untuk curiga.</span>
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 36,
          left: 48,
          fontSize: 18,
          letterSpacing: 3,
          color: C.pale,
          border: `1px solid ${C.pale}`,
          padding: '6px 14px',
        }}
      >
        ILUSTRASI — TOKOH KOMPOSIT
      </div>
      <Vignette />
    </AbsoluteFill>
  );
};

/* ---------- SCENE 09 — SMART PEOPLE ---------- */

const S09: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const cards = [
    ['BUKTI VISUAL', 'video pencairan, mutasi rekening'],
    ['ORANG YANG DIPERCAYA', 'kakak kelas, keluarga, grup'],
    ['JANJI TANPA RISIKO', 'untung besar — “pasti aman”'],
    ['FOMO', '“semua orang sudah mencairkan”'],
  ];
  const lineP = ip(f, [700, 820], [0, 1]);
  return (
    <AbsoluteFill style={{backgroundColor: C.black}}>
      <ActTag act="ACT 4" name="THE CONFLICT" />
      <div style={{position: 'absolute', top: 140, width: '100%', textAlign: 'center'}}>
        <H1 at={10} size={58} style={{textAlign: 'center'}}>
          MEREKA MENYERANG <span style={{color: C.amber}}>KEPERCAYAAN</span>, BUKAN KECERDASAN
        </H1>
      </div>
      <div style={{position: 'absolute', top: 330, left: 0, width: '100%', display: 'flex', justifyContent: 'center', gap: 40, padding: '0 60px'}}>
        {cards.map(([t, s], i) => {
          const p = ip(f, [80 + i * 70, 130 + i * 70], [0, 1], easeOut);
          return (
            <div
              key={t}
              style={{
                width: 400,
                background: C.navy,
                border: `2px solid ${C.slate}`,
                padding: '40px 34px',
                opacity: p,
                transform: `translateY(${(1 - p) * 70}px) rotate(${(1 - p) * (i % 2 ? 3 : -3)}deg)`,
              }}
            >
              <div style={{fontSize: 34, fontWeight: 800, color: C.bone, lineHeight: 1.2}}>{t}</div>
              <div style={{fontSize: 25, color: C.pale, marginTop: 16, lineHeight: 1.4}}>{s}</div>
            </div>
          );
        })}
      </div>
      {/* red risk line sweeping */}
      <div
        style={{
          position: 'absolute',
          top: 640,
          left: `${(1 - lineP) * 100}%`,
          width: '100%',
          height: 6,
          background: C.red,
          boxShadow: `0 0 30px ${C.red}`,
        }}
      />
      <div style={{position: 'absolute', top: 700, width: '100%', textAlign: 'center', opacity: ip(f, [820, 870], [0, 1])}}>
        <div style={{fontSize: 56, fontWeight: 800, color: C.red, letterSpacing: 2}}>RISIKO TINGGI SELALU IKUT</div>
        <div style={{fontSize: 32, color: C.bone, marginTop: 18}}>
          Satu hukum yang tidak pernah bolong — hasil tinggi datang bersama risiko.
        </div>
        <div style={{marginTop: 18}}>
          <Source>Analisis psikologi: bias konfirmasi, sunk cost, FOMO (labeled ANALYSIS di naskah)</Source>
        </div>
      </div>
      <Ilustrasi />
      <Vignette />
    </AbsoluteFill>
  );
};

/* ---------- SCENE 10 — FIRST TRAVEL ---------- */

const S10: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const gauge = ip(f, [720, 900], [0, 1]);
  return (
    <AbsoluteFill style={{backgroundColor: C.navy}}>
      <KenBurns src="assets/ENV_TERMINAL_UMRAH_01.png" dur={dur} from={1.12} to={1.02} />
      <AbsoluteFill style={{background: 'linear-gradient(0deg, rgba(8,12,19,0.94) 0%, rgba(16,26,43,0.55) 55%, rgba(16,26,43,0.3) 100%)'}} />
      <ActTag act="ACT 4" name="THE CONFLICT" />
      <div style={{position: 'absolute', top: 140, width: '100%', textAlign: 'center'}}>
        <H1 at={10} size={62} style={{textAlign: 'center'}}>
          FIRST TRAVEL — <span style={{color: C.red}}>ANGKANYA</span>
        </H1>
      </div>
      {/* counters band */}
      <div style={{position: 'absolute', top: 330, left: 0, width: '100%', display: 'flex', justifyContent: 'center', gap: 70}}>
        {[
          {label: 'SETOR (Nov 16–Mei 17)', to: 93295, start: 160, color: C.amber},
          {label: 'BERANGKAT', to: 29985, start: 340, color: C.bone},
          {label: 'DIRUGIKAN (amar hakim)', to: 63310, start: 520, color: C.red},
        ].map((c) => (
          <div key={c.label} style={{background: 'rgba(8,12,19,0.9)', border: `2px solid ${c.color}`, padding: '34px 50px', minWidth: 440, textAlign: 'center'}}>
            <div style={{fontSize: 88, fontWeight: 800, color: c.color, fontVariantNumeric: 'tabular-nums'}}>
              <Counter from={0} to={c.to} start={c.start} dur={140} />
            </div>
            <div style={{fontSize: 23, color: C.pale, letterSpacing: 2, marginTop: 10}}>{c.label}</div>
          </div>
        ))}
      </div>
      {/* red gauge */}
      <div style={{position: 'absolute', top: 650, left: '50%', transform: 'translateX(-50%)', width: 1400, opacity: ip(f, [700, 740], [0, 1])}}>
        <div style={{height: 44, background: C.black, border: `1px solid ${C.slate}`, position: 'relative'}}>
          <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${gauge * 100}%`, background: `linear-gradient(90deg, ${C.red}, #ff7a6e)`}} />
          <div style={{position: 'absolute', right: 18, top: 6, fontSize: 26, fontWeight: 800, color: C.bone}}>
            Rp 905 MILIAR
          </div>
        </div>
        <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 14}}>
          <Source>Setoran total ±Rp1,319 triliun (93.295 orang)</Source>
          <Source>PN Depok, 30 Mei 2018 — via ANTARA / Kompas / Katadata</Source>
        </div>
      </div>
      <div style={{position: 'absolute', bottom: 90, width: '100%', textAlign: 'center', opacity: ip(f, [1000, 1050], [0, 1])}}>
        <div style={{fontSize: 36, color: C.bone, fontWeight: 600}}>
          Janji ibadah yang dibayar uang peserta lain — angkanya tidak bisa ditutupi.
        </div>
      </div>
      <Vignette />
    </AbsoluteFill>
  );
};

/* ---------- SCENE 11 — LEGAL STATUS ---------- */

const S11: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const cols = [
    {t: 'TERBUKTI', case: 'First Travel', d: 'Vonis PN Depok: 20 / 18 / 15 tahun penjara', color: C.amber, at: 60},
    {t: 'PERINGATAN REGULATOR', case: 'Aplikasi VIR', d: 'OJK NTT: ilegal, tidak berizin, indikasi Ponzi', color: C.red, at: 160},
    {t: 'VONIS BEBAS', case: 'MeMiles', d: 'Dihentikan satgas — bosnya tidak terbukti bersalah', color: C.slate, at: 260},
  ];
  return (
    <AbsoluteFill style={{backgroundColor: C.black}}>
      <ActTag act="ACT 4" name="THE CONFLICT" />
      <div style={{position: 'absolute', top: 140, width: '100%', textAlign: 'center'}}>
        <H1 at={10} size={54} style={{textAlign: 'center'}}>
          STATUS HUKUM BUKAN CERITA YANG BOLEH
          <br />
          KITA <span style={{color: C.amber}}>PUTAR SENDIRI</span>
        </H1>
      </div>
      <div style={{position: 'absolute', top: 380, left: 0, width: '100%', display: 'flex', justifyContent: 'center', gap: 44, padding: '0 60px'}}>
        {cols.map((c) => {
          const p = ip(f, [c.at, c.at + 30], [0, 1], easeOut);
          return (
            <div
              key={c.t}
              style={{
                width: 470,
                background: C.navy,
                borderTop: `8px solid ${c.color}`,
                padding: '44px 38px',
                opacity: p,
                transform: `translateY(${(1 - p) * 90}px)`,
              }}
            >
              <div style={{fontSize: 26, letterSpacing: 3, fontWeight: 800, color: c.color}}>{c.t}</div>
              <div style={{fontSize: 44, fontWeight: 800, color: C.bone, marginTop: 18}}>{c.case}</div>
              <div style={{fontSize: 27, color: C.pale, marginTop: 18, lineHeight: 1.45}}>{c.d}</div>
            </div>
          );
        })}
      </div>
      <div style={{position: 'absolute', bottom: 110, width: '100%', textAlign: 'center', opacity: ip(f, [520, 560], [0, 1])}}>
        <div style={{fontSize: 34, color: C.bone}}>
          Ada yang terbukti. Ada yang masih dugaan.{' '}
          <span style={{color: C.amber, fontWeight: 700}}>Membingkai semuanya sama = kehilangan kepercayaan.</span>
        </div>
        <div style={{marginTop: 16}}>
          <Source>Sumber: Kompas.com (18 Apr 2022); ANTARA (30 Mei 2018); ANTARA NTT (17 Jul 2026)</Source>
        </div>
      </div>
      <Ilustrasi />
      <Vignette />
    </AbsoluteFill>
  );
};

/* ---------- SCENE 12 — REVEAL ---------- */

const S12: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const push = ip(f, [0, 700], [1.0, 1.14]);
  const diag = ip(f, [620, 700], [0, 1], easeOut);
  const morph = ip(f, [880, 960], [0, 1]); // arrow flips to LUBANG
  const ladder = ip(f, [1200, 1280], [0, 1], easeOut);
  const big = ip(f, [420, 470], [0, 1], easeOut);
  return (
    <AbsoluteFill style={{backgroundColor: C.black}}>
      <Img
        src={staticFile('assets/CHAR_INVESTIGATOR_REVEAL_01.png')}
        style={{position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${push})`}}
      />
      <AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(8,12,19,0.9) 0%, rgba(8,12,19,0.55) 55%, rgba(8,12,19,0.25) 100%)'}} />
      <ActTag act="ACT 5" name="THE REVEAL" />
      {/* headline */}
      <div style={{position: 'absolute', left: 48, top: 150, maxWidth: 1150, opacity: big, transform: `translateY(${(1 - big) * 30}px)`}}>
        <div style={{fontSize: 66, fontWeight: 800, color: C.bone, lineHeight: 1.2}}>
          YANG KAMU TERIMA <span style={{color: C.amber}}>BUKAN KEUNTUNGAN.</span>
        </div>
        <div style={{fontSize: 46, fontWeight: 700, color: C.pale, marginTop: 18}}>
          Kamu terima <span style={{color: C.red}}>uang orang berikutnya</span> — dan orang berikutnya…{' '}
          <span style={{color: C.amber}}>kamu</span>.
        </div>
      </div>
      {/* diagram card */}
      <div style={{position: 'absolute', left: 48, bottom: 260, width: 900, background: 'rgba(8,12,19,0.94)', border: `2px solid ${C.slate}`, padding: '36px 44px', opacity: diag, transform: `translateY(${(1 - diag) * 60}px)`}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 26}}>
          <div style={{background: C.amber, color: C.navy, fontWeight: 800, fontSize: 30, padding: '16px 26px'}}>SETORAN BARU</div>
          <div style={{fontSize: 46, color: C.bone, transform: `rotate(${morph * 180}deg)`}}>→</div>
          <div
            style={{
              border: `3px solid ${morph > 0.5 ? C.red : C.green}`,
              color: morph > 0.5 ? C.red : C.green,
              fontWeight: 800,
              fontSize: 30,
              padding: '16px 26px',
            }}
          >
            {morph < 0.5 ? 'KEUNTUNGAN (dibayar)' : 'LUBANG (tumbuh)'}
          </div>
        </div>
        <div style={{fontSize: 26, color: C.pale, marginTop: 20, opacity: morph}}>
          Bayarannya bukan hasil investasi — itu{' '}
          <span style={{color: C.amber, fontWeight: 800}}>BIAYA IKLAN</span>.
        </div>
      </div>
      {/* scale ladder */}
      <div style={{position: 'absolute', right: 60, bottom: 180, textAlign: 'right', opacity: ladder}}>
        <div style={{fontSize: 30, color: C.pale, letterSpacing: 3}}>SKALA — PRINSIP YANG SAMA</div>
        <div style={{fontSize: 54, fontWeight: 800, color: C.bone, marginTop: 12}}>Rp 4 juta — grup WhatsApp</div>
        <div style={{fontSize: 78, fontWeight: 800, color: C.amber, marginTop: 6}}>
          ≥ $50 MILIAR — Madoff
        </div>
        <div style={{marginTop: 12}}>
          <Source>SEC Press Release 2008-293 (11 Des 2008): pengakuan “giant Ponzi scheme”</Source>
        </div>
      </div>
      <Ilustrasi />
      <Vignette strength={0.7} />
    </AbsoluteFill>
  );
};

/* ---------- SCENE 13 — AFTERMATH ---------- */

const S13: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const stamp = ip(f, [160, 210], [0, 1], easeOut);
  const checks = [500, 620, 740];
  return (
    <AbsoluteFill style={{backgroundColor: C.navy}}>
      <KenBurns src="assets/ENV_PENGADILAN_DOKUMEN_01.png" dur={dur} from={1.04} to={1.12} dx={40} />
      <AbsoluteFill style={{background: 'rgba(8,12,19,0.68)'}} />
      <ActTag act="ACT 6" name="THE AFTERMATH" />
      <div style={{position: 'absolute', left: 48, top: 160, maxWidth: 1050}}>
        <H1 at={14} size={58}>
          SETELAH RUNTUH — YANG TERISA
          <br />
          <span style={{color: C.amber}}>BUKAN ANGKA, TAPI ORANG</span>
        </H1>
        <div style={{marginTop: 44, display: 'flex', gap: 30}}>
          {[
            'Putusan PK MA — aset dikembalikan ke jemaah (Jan 2023)',
            'Proses bertahun-tahun; sebagian dana baru bergerak kembali',
            'Kepercayaan yang hilang tidak bisa dikembalikan putusan',
          ].map((t, i) => (
            <div
              key={t}
              style={{
                flex: 1,
                background: 'rgba(8,12,19,0.92)',
                border: `1px solid ${i === 2 ? C.red : C.green}`,
                padding: '30px 30px',
                fontSize: 27,
                color: C.bone,
                lineHeight: 1.45,
                opacity: ip(f, [checks[i], checks[i] + 24], [0, 1]),
                transform: `translateY(${ip(f, [checks[i], checks[i] + 24], [30, 0], easeOut)}px)`,
              }}
            >
              <div style={{color: i === 2 ? C.red : C.green, fontWeight: 800, fontSize: 32, marginBottom: 12}}>
                {i === 2 ? '⚠' : '✓'}
              </div>
              {t}
            </div>
          ))}
        </div>
        <div style={{marginTop: 34, opacity: ip(f, [900, 940], [0, 1])}}>
          <Source>Sumber: Kompas.com — Putusan PK Mahkamah Agung, 5 Januari 2023</Source>
        </div>
      </div>
      {/* amber stamp */}
      <div
        style={{
          position: 'absolute',
          right: 130,
          top: 330,
          border: `6px solid ${C.amber}`,
          color: C.amber,
          fontWeight: 800,
          fontSize: 44,
          letterSpacing: 2,
          padding: '26px 44px',
          background: 'rgba(8,12,19,0.85)',
          transform: `rotate(-6deg) scale(${2.2 - stamp * 1.2})`,
          opacity: stamp,
          textAlign: 'center',
        }}
      >
        DIKEMBALIKAN
        <br />
        KE JEMAAH
      </div>
      <div style={{position: 'absolute', bottom: 80, width: '100%', textAlign: 'center', opacity: ip(f, [980, 1030], [0, 1])}}>
        <div style={{fontSize: 36, color: C.bone, fontWeight: 600}}>
          Angka bisa dicari kembali. <span style={{color: C.red}}>Waktu — tidak.</span>
        </div>
      </div>
      <Vignette />
    </AbsoluteFill>
  );
};

/* ---------- SCENE 14 — INSIGHT & OUT ---------- */

const S14: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const lightsOff = (i: number) => f > 60 + i * 42;
  const tag = ip(f, [620, 680], [0, 1], easeOut);
  const end = ip(f, [860, 920], [0, 1]);
  return (
    <AbsoluteFill style={{backgroundColor: C.navy, alignItems: 'center', justifyContent: 'center'}}>
      <ActTag act="ACT 6" name="THE AFTERMATH" />
      {/* lamp dots */}
      <div style={{position: 'absolute', top: 140, display: 'flex', gap: 60}}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              background: lightsOff(i) ? C.slate : C.amber,
              boxShadow: lightsOff(i) ? 'none' : `0 0 26px ${C.amber}`,
              opacity: lightsOff(i) ? 0.35 : 1,
              transition: 'none',
            }}
          />
        ))}
      </div>
      <div style={{textAlign: 'center', maxWidth: 1500, opacity: ip(f, [120, 170], [0, 1]), transform: 'translateY(-70px)'}}>
        <div style={{fontSize: 68, fontWeight: 800, color: C.bone, lineHeight: 1.3}}>
          Skema Ponzi tidak kekurangan <span style={{color: C.amber}}>kejujuran</span> —
          <br />
          ia kekurangan <span style={{color: C.red}}>peserta baru</span>.
        </div>
        {/* sub-line yields to the 2L/157 cards as they arrive */}
        <div style={{fontSize: 38, color: C.pale, marginTop: 34, lineHeight: 1.5, opacity: 1 - ip(f, [400, 450], [0, 1])}}>
          Karena itu yang dijual bukan produknya — melainkan{' '}
          <span style={{color: C.bone, fontWeight: 700}}>keyakinan</span>.
        </div>
      </div>
      {/* 2L + 157 */}
      <div style={{position: 'absolute', bottom: 280, display: 'flex', gap: 44, opacity: ip(f, [420, 470], [0, 1])}}>
        {[
          ['LEGAL', 'Izinnya ada? Cek di OJK.'],
          ['LOGIS', 'Untungnya masuk akal?'],
          ['157', 'Sudah ragu? Kontak OJK.'],
        ].map(([k, v], i) => (
          <div key={k} style={{background: C.black, border: `2px solid ${i === 2 ? C.amber : C.slate}`, padding: '26px 44px', textAlign: 'center', minWidth: 340}}>
            <div style={{fontSize: 46, fontWeight: 800, color: i === 2 ? C.amber : C.bone}}>{k}</div>
            <div style={{fontSize: 24, color: C.pale, marginTop: 8}}>{v}</div>
          </div>
        ))}
      </div>
      {/* end tagline */}
      <div style={{position: 'absolute', bottom: 70, textAlign: 'center', opacity: tag}}>
        <div style={{fontSize: 52, fontWeight: 800, letterSpacing: 8, color: C.amber}}>
          MONEY UNDERCOVER
        </div>
        <div style={{fontSize: 24, letterSpacing: 6, color: C.bone, marginTop: 8, opacity: end}}>
          THE STORIES BEHIND MONEY.
        </div>
      </div>
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
  push(2, <S03 dur={S[2].sec * FPS} />, true); // hard cut on stamp (storyboard)
  push(3, <S04 dur={S[3].sec * FPS} />);
  push(4, <S05 dur={S[4].sec * FPS} />);
  push(5, <S06 dur={S[5].sec * FPS} />);
  push(6, <S07 dur={S[6].sec * FPS} />);
  push(7, <S08 dur={S[7].sec * FPS} />);
  push(8, <S09 dur={S[8].sec * FPS} />);
  push(9, <S10 dur={S[9].sec * FPS} />);
  push(10, <S11 dur={S[10].sec * FPS} />);
  push(11, <S12 dur={S[11].sec * FPS} />);
  push(12, <S13 dur={S[12].sec * FPS} />);
  push(13, <S14 dur={S[13].sec * FPS} />);

  return <AbsoluteFill style={{backgroundColor: C.black}}>{nodes}</AbsoluteFill>;
};
