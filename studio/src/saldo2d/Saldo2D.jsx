import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

/**
 * Saldo2D — renderer 2D cut-out ala animasi remaja Indonesia (acuan Dhot Design).
 *
 * Semua isi film datang dari `story.json` (skema `studio.story2d/1`):
 *   - `backdrops` : ilustrasi lokasi (Ken Burns halus)
 *   - `cast`      : karakter + daftar pose (sprite PNG transparan hasil
 *                   `scripts/2d-sprites.mjs`)
 *   - `shots`     : satu dialog satu shot, dengan pose, posisi, skala, dan teks
 *
 * Tidak ada 3D, tidak ada WebGL: semuanya HTML + CSS yang dianimasikan Remotion,
 * jadi render 720×1280 hanya butuh hitungan detik per frame.
 */

const FONT = 'Inter, "Segoe UI", system-ui, sans-serif';
const VO_LEAD_IN = 14;

const clamp01 = (v) => Math.max(0, Math.min(1, v));

const speakerOf = (value) => {
  const m = String(value).match(/^\s*([^—–:]{2,24}?)\s*(?:—|–|:)\s*/);
  return m ? {speaker: m[1].trim(), line: String(value).slice(m[0].length)} : {speaker: null, line: String(value)};
};

/** Satu baris subtitle kinetik: kata muncul berurutan, kata aktif menyala. */
const KineticLine = ({speaker, line, color, from, to, frame}) => {
  const words = line.split(' ');
  const span = Math.max(1, to - from);
  const p = clamp01((frame - from) / span);
  const shown = Math.min(words.length, Math.max(1, Math.ceil(p * words.length)));
  const activeIndex = Math.min(words.length - 1, shown - 1);
  const chipIn = interpolate(frame, [from - 4, from + 4], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <div style={{position: 'absolute', inset: 0}}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: '34%',
          background: 'linear-gradient(to top, rgba(8,5,3,0.82) 0%, rgba(8,5,3,0.55) 45%, rgba(8,5,3,0) 100%)',
        }}
      />
      <div style={{position: 'absolute', left: 0, right: 0, bottom: '9%', padding: '0 6%', textAlign: 'center'}}>
      {speaker ? (
        <div
          style={{
            display: 'inline-block',
            marginBottom: 14,
            padding: '8px 20px',
            borderRadius: 999,
            background: color,
            color: '#141008',
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: 30,
            letterSpacing: '0.06em',
            transform: `scale(${0.9 + chipIn * 0.1})`,
            opacity: chipIn,
            boxShadow: '0 6px 0 rgba(0,0,0,0.35)',
          }}
        >
          {speaker}
        </div>
      ) : null}
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 800,
          fontSize: 46,
          lineHeight: 1.18,
          letterSpacing: '-0.01em',
          color: '#fff8e8',
          textShadow: '0 4px 0 rgba(24,12,4,0.85), 0 10px 26px rgba(0,0,0,0.6)',
          WebkitTextStroke: '1px rgba(30,16,6,0.55)',
        }}
      >
        {words.map((w, i) => {
          const visible = i < shown;
          const isActive = i === activeIndex && shown < words.length + 1;
          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.96)',
                transition: 'none',
                color: isActive ? color : undefined,
                marginRight: '0.28em',
              }}
            >
              {w}
            </span>
          );
        })}
        </div>
      </div>
    </div>
  );
};

/** Kartu caption bergaya UI: notifikasi, chat, atau judul babak. */
const CaptionCard = ({text, frame, from, duration, color}) => {
  const local = frame - from;
  const inP = clamp01(local / 14);
  // kartu baru memudar di 10 frame terakhir shot, bukan setelah 40 frame
  const outP = clamp01((local - (duration - 10)) / 10);
  const y = (1 - inP) * 40;
  const kicker = String(text).split('·')[0]?.trim();
  const body = String(text).slice(kicker?.length ?? 0).replace(/^·\s*/, '');
  return (
    <div
      style={{
        position: 'absolute',
        left: '6%',
        right: '6%',
        bottom: '13%',
        padding: '26px 30px',
        borderRadius: 26,
        background: 'rgba(14,9,6,0.93)',
        border: `4px solid ${color}`,
        boxShadow: `0 18px 46px rgba(0,0,0,0.55), 0 0 0 6px rgba(0,0,0,0.25)`,
        transform: `translateY(${y}px) scale(${0.96 + inP * 0.04})`,
        opacity: inP * (1 - outP),
        fontFamily: FONT,
      }}
    >
      <div style={{fontSize: 26, fontWeight: 800, letterSpacing: '0.12em', color, textTransform: 'uppercase', marginBottom: 10}}>
        {kicker || 'INFO'}
      </div>
      <div style={{fontSize: 38, fontWeight: 700, lineHeight: 1.28, color: '#fdf3e0'}}>{body || String(text)}</div>
    </div>
  );
};

export const Saldo2DStory = ({story, hud = false}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // timeline shot
  let acc = 0;
  const shots = story.shots.map((s) => {
    const from = Math.round(acc * fps);
    acc += s.duration;
    return {...s, from, durationInFrames: Math.round(s.duration * fps)};
  });
  const total = shots[shots.length - 1];
  const shot = shots.find((s) => frame >= s.from && frame < s.from + s.durationInFrames) ?? total;
  const local = frame - shot.from;
  const localSeconds = local / fps;

  const backdrop = story.backdrops?.[shot.backdrop] ?? null;
  const castEntry = shot.actor ? story.cast[shot.actor.ref] : null;
  const speaking = Boolean(shot.text) && shot.text.style === 'subtitle';

  // lip-flap: ganti pose tiap 4 frame saat karakter sedang bicara
  // Lip-flap ala animasi 2D: satu pose ditahan 8 frame (±1,9 pose/detik) dan
  // sesekali mulut berhenti menutup — ritmenya jadi seperti orang bicara,
  // bukan kedipan mesin.
  const speakClock = local - VO_LEAD_IN;
  const holdTick = Math.floor(speakClock / 8);
  const breathingPause = holdTick % 5 === 0;
  const flap = speaking && speakClock > 0 && !breathingPause && holdTick % 2 === 1;
  const poseKey = flap ? shot.actor?.poseAlt ?? shot.actor?.pose : shot.actor?.pose;
  const poseList = castEntry?.poses ?? {};
  const poseFile = poseList[poseKey] ?? Object.values(poseList)[0];

  const {speaker, line} = shot.text ? speakerOf(shot.text.value) : {speaker: null, line: ''};
  const color = castEntry?.color ?? shot.actor?.color ?? '#ffd166';

  // gerak masuk: pop 6 frame, lalu napas halus
  const inP = interpolate(local, [0, 14], [0, 1], {extrapolateRight: 'clamp'});
  const popIn = 1 + (1 - inP) * 0.02;
  const riseY = (1 - inP) * 26;
  const bob = Math.sin((localSeconds * Math.PI * 2) / 3.8) * 2.2;
  const sway = Math.sin((localSeconds * Math.PI * 2) / 6.1) * 0.35;

  const vo = shot.audio?.vo ?? null;
  const audioStart = shot.from + VO_LEAD_IN;
  const textFrom = VO_LEAD_IN + 4;
  const textTo = Math.max(textFrom + 12, shot.durationInFrames - 10);

  return (
    <AbsoluteFill style={{backgroundColor: '#0b0806', overflow: 'hidden', fontFamily: FONT}}>
      {/* latar ilustrasi */}
      {backdrop ? (
        <Img
          src={staticFile(backdrop.image)}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: '50% 55%',
            transform: `scale(${1.02 + 0.045 * clamp01(local / shot.durationInFrames)})`,
            zIndex: 0,
          }}
        />
      ) : null}

      {/* audio VO per baris */}
      {vo ? (
        <Sequence from={audioStart} durationInFrames={Math.max(1, shot.durationInFrames - VO_LEAD_IN)}>
          <Audio src={staticFile(vo)} />
        </Sequence>
      ) : null}

      {/* bayangan kontak di lantai */}
      {poseFile ? (
        <div
          style={{
            position: 'absolute',
            left: `${(shot.actor.x ?? 0.5) * 100}%`,
            bottom: `${(1 - (shot.actor.y ?? 0.97)) * 100}%`,
            width: 320,
            height: 54,
            transform: 'translate(-50%, 18px)',
            background: 'radial-gradient(ellipse at center, rgba(20,10,4,0.5) 0%, rgba(20,10,4,0) 70%)',
            zIndex: 1,
          }}
        />
      ) : null}

      {/* karakter */}
      {poseFile ? (
        <div
          style={{
            position: 'absolute',
            left: `${(shot.actor.x ?? 0.5) * 100}%`,
            bottom: `${(1 - (shot.actor.y ?? 0.97)) * 100}%`,
            transform: `translate(-50%, ${bob + riseY}px) rotate(${sway}deg) scale(${(shot.actor.scale ?? 1) * popIn})`,
            opacity: inP,
            transformOrigin: 'bottom center',
            zIndex: 2,
            filter: 'drop-shadow(0 18px 22px rgba(0,0,0,0.45))',
          }}
        >
          <Img src={staticFile(poseFile)} style={{display: 'block', height: `${(shot.actor.height ?? 0.62) * 1280}px`, width: 'auto'}} />
        </div>
      ) : null}

      {/* teks */}
      {shot.text?.style === 'subtitle' ? (
        <div style={{position: 'absolute', inset: 0, zIndex: 3}}>
          <KineticLine speaker={speaker} line={line} color={color} from={textFrom} to={textTo} frame={local} />
        </div>
      ) : null}
      {shot.text && shot.text.style !== 'subtitle' ? (
        <div style={{position: 'absolute', inset: 0, zIndex: 3}}>
          <CaptionCard text={shot.text.value} frame={local} from={4} duration={shot.durationInFrames} color={color} />
        </div>
      ) : null}

      {/* vignette + garis sinematik */}
      <AbsoluteFill
        style={{
          zIndex: 4,
          pointerEvents: 'none',
          background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 45%, rgba(10,6,3,0.55) 100%)',
        }}
      />
      {hud ? (
        <div style={{position: 'absolute', top: 18, left: 20, zIndex: 5, fontFamily: 'ui-monospace, monospace', fontSize: 18, color: '#9fe8c0'}}>
          {shot.id} · f{frame}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export const saldo2dMetadata = ({props}) => ({
  durationInFrames: Math.max(1, Math.round(props.story.shots.reduce((s, x) => s + x.duration, 0) * props.story.fps)),
  fps: props.story.fps,
  width: props.story.width,
  height: props.story.height,
});

export default Saldo2DStory;
