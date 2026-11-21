import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

/**
 * Saldo2D — renderer 2D cut-out ala animasi remaja Indonesia (acuan Dhot Design).
 *
 * Skema `studio.story2d/2`:
 *   backdrops : ilustrasi lokasi
 *   cast      : karakter + peta pose (sprite hasil scripts/2d-sprites.mjs)
 *   shots     : satu shot bisa berisi BEBERAPA baris dialog (ganti tokoh),
 *               masing-masing baris punya `who`, `pose`, `text`, `audio`, `duration`.
 *
 * Prinsip gerak: seminimal mungkin. Latar diam, badan hanya "napas" 1,5 px,
 * lip-flap ditahan 10 frame (±1,2 pose/detik) dan berhenti tiap beberapa pose.
 * Kalau sebuah pose tidak punya pasangan bicara (poseAlt), tidak ada gerakan mulut.
 */

const FONT = 'Inter, "Segoe UI", system-ui, sans-serif';

const clamp01 = (v) => Math.max(0, Math.min(1, v));

/** Satu baris subtitle kinetik: kata muncul berurutan, kata aktif menyala. */
const KineticLine = ({speaker, line, color, from, to, frame}) => {
  const words = String(line).split(' ').filter(Boolean);
  const span = Math.max(1, to - from);
  const p = clamp01((frame - from) / span);
  const shown = Math.min(words.length, Math.max(1, Math.ceil(p * words.length)));
  const activeIndex = Math.min(words.length - 1, shown - 1);
  const chipIn = interpolate(frame, [from - 3, from + 5], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <div style={{position: 'absolute', inset: 0}}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: '34%',
          background: 'linear-gradient(to top, rgba(8,5,3,0.86) 0%, rgba(8,5,3,0.55) 45%, rgba(8,5,3,0) 100%)',
        }}
      />
      <div style={{position: 'absolute', left: 0, right: 0, bottom: '8%', padding: '0 6%', textAlign: 'center'}}>
        {speaker ? (
          <div
            style={{
              display: 'inline-block',
              marginBottom: 12,
              padding: '7px 20px',
              borderRadius: 999,
              background: color,
              color: '#141008',
              fontFamily: FONT,
              fontWeight: 800,
              fontSize: 28,
              letterSpacing: '0.06em',
              opacity: chipIn,
              transform: `translateY(${(1 - chipIn) * 10}px)`,
            }}
          >
            {speaker}
          </div>
        ) : null}
        <div style={{fontFamily: FONT, fontSize: 46, fontWeight: 800, lineHeight: 1.24, color: '#fff7e9'}}>
          {words.map((w, i) => (
            <React.Fragment key={i}>
              <span
                style={{
                  opacity: i < shown ? 1 : 0,
                  color: i === activeIndex ? color : '#fff7e9',
                  textShadow: '0 3px 12px rgba(0,0,0,0.85)',
                }}
              >
                {w}
              </span>
              {i < words.length - 1 ? ' ' : null}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

/** Kartu teks untuk shot properti/insert (tanpa dialog). */
const CaptionCard = ({text, frame, duration, color}) => {
  const inP = clamp01(frame / 14);
  const outP = clamp01((frame - (duration - 12)) / 12);
  const [kicker, ...rest] = String(text).split('·');
  const body = rest.join('·').trim();
  return (
    <div
      style={{
        position: 'absolute',
        left: '6%',
        right: '6%',
        bottom: '12%',
        padding: '24px 28px',
        borderRadius: 24,
        background: 'rgba(14,9,6,0.93)',
        border: `4px solid ${color}`,
        boxShadow: '0 18px 46px rgba(0,0,0,0.55)',
        transform: `translateY(${(1 - inP) * 22}px) scale(${0.97 + inP * 0.03})`,
        opacity: inP * (1 - outP),
        fontFamily: FONT,
      }}
    >
      <div style={{fontSize: 24, fontWeight: 800, letterSpacing: '0.12em', color, textTransform: 'uppercase', marginBottom: 8}}>
        {kicker.trim() || 'INFO'}
      </div>
      <div style={{fontSize: 36, fontWeight: 700, lineHeight: 1.3, color: '#fdf3e0'}}>{body || String(text)}</div>
    </div>
  );
};

export const Saldo2DStory = ({story, hud = false}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

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

  // --- timeline baris dialog di dalam satu shot -----------------------------
  let cursor = 0;
  const lines = (shot.lines ?? []).map((l, i) => {
    const start = Math.round(cursor * fps);
    cursor += l.duration;
    const end = Math.round(cursor * fps);
    return {...l, index: i, start, end, frames: Math.max(1, end - start)};
  });
  const active = lines.find((l) => local >= l.start && local < l.end) ?? lines[lines.length - 1] ?? null;

  // `line.sprite` menampilkan karakter lain dari yang bicara (mis. telepon:
  // yang tampil Alya, yang bicara Ibu lewat suara telepon).
  const spriteRef = active?.sprite ?? active?.who ?? shot.actor?.ref ?? null;
  const castEntry = spriteRef ? story.cast[spriteRef] : null;
  const voiceCast = active?.who ? story.cast[active.who] : null;
  const poseKey = active?.pose ?? shot.actor?.pose;
  const poseAltKey = active?.poseAlt ?? shot.actor?.poseAlt;
  const poseList = castEntry?.poses ?? {};
  const hasAudioLine = Boolean(active?.audio);

  // Lip-flap: 10 frame per pose, dan diam tiap tick ke-4. Tanpa poseAlt → diam.
  const lineLocal = active ? local - active.start : 0;
  const holdTick = Math.floor(lineLocal / 10);
  const flap = hasAudioLine && Boolean(poseAltKey) && holdTick % 4 !== 0 && holdTick % 2 === 1;
  const activePoseKey = flap ? poseAltKey : poseKey;
  const spriteOn = shot.sprite !== false;
  const poseFile = spriteOn ? (poseList[activePoseKey] ?? poseList[poseKey] ?? Object.values(poseList)[0] ?? null) : null;

  const color = voiceCast?.color ?? castEntry?.color ?? '#ffd166';
  const speaker = voiceCast?.label ?? active?.label ?? null;
  const isInsert = shot.sprite === false;

  // Gerak masuk sangat halus (18 frame), lalu hanya napas.
  const inP = interpolate(local, [0, 18], [0, 1], {extrapolateRight: 'clamp'});
  const riseY = (1 - inP) * 16;
  const bob = Math.sin((localSeconds * Math.PI * 2) / 5.2) * 1.5;

  const actorPos = active?.pos ?? shot.actor ?? {};
  const actorX = actorPos.x ?? 0.5;
  const actorY = actorPos.y ?? 0.97;
  const actorHeight = actorPos.height ?? 0.62;
  const actorScale = actorPos.scale ?? 1;

  return (
    <AbsoluteFill style={{backgroundColor: '#0b0806', overflow: 'hidden', fontFamily: FONT}}>
      {backdrop ? (
        <Img
          src={staticFile(backdrop.image)}
          style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 55%', zIndex: 0}}
        />
      ) : null}

      {lines.map((l) =>
        l.audio ? (
          <Sequence key={l.index} from={l.start} durationInFrames={l.frames}>
            <Audio src={staticFile(l.audio)} />
          </Sequence>
        ) : null,
      )}

      {poseFile ? (
        <div
          style={{
            position: 'absolute',
            left: `${actorX * 100}%`,
            bottom: `${(1 - actorY) * 100}%`,
            width: 300,
            height: 46,
            transform: 'translate(-50%, 16px)',
            background: 'radial-gradient(ellipse at center, rgba(20,10,4,0.45) 0%, rgba(20,10,4,0) 70%)',
            zIndex: 1,
          }}
        />
      ) : null}

      {poseFile ? (
        <div
          style={{
            position: 'absolute',
            left: `${actorX * 100}%`,
            bottom: `${(1 - actorY) * 100}%`,
            transform: `translate(-50%, ${bob + riseY}px) scale(${actorScale})`,
            opacity: inP,
            transformOrigin: 'bottom center',
            zIndex: 2,
            filter: 'drop-shadow(0 16px 20px rgba(0,0,0,0.42))',
          }}
        >
          <Img src={staticFile(poseFile)} style={{display: 'block', height: `${actorHeight * 1280}px`, width: 'auto'}} />
        </div>
      ) : null}

      {active ? (
        <div style={{position: 'absolute', inset: 0, zIndex: 3}}>
          <KineticLine
            speaker={speaker}
            line={active.text}
            color={color}
            from={active.start + 4}
            to={Math.max(active.start + 20, active.end - 4)}
            frame={local}
          />
        </div>
      ) : null}

      {!active && shot.text ? (
        <div style={{position: 'absolute', inset: 0, zIndex: 3}}>
          <CaptionCard text={shot.text.value ?? shot.text} frame={local} duration={shot.durationInFrames} color={color} />
        </div>
      ) : null}

      <AbsoluteFill
        style={{
          zIndex: 4,
          pointerEvents: 'none',
          background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 45%, rgba(10,6,3,0.52) 100%)',
        }}
      />

      {/* gelap perlahan di akhir film */}
      {frame > total.from + total.durationInFrames - 45 ? (
        <AbsoluteFill
          style={{
            zIndex: 6,
            backgroundColor: '#000',
            opacity: clamp01((frame - (total.from + total.durationInFrames - 45)) / 45),
          }}
        />
      ) : null}

      {hud ? (
        <div style={{position: 'absolute', top: 18, left: 20, zIndex: 7, fontFamily: 'ui-monospace, monospace', fontSize: 18, color: '#9fe8c0'}}>
          {shot.id} · {active ? active.who : 'insert'} · f{frame}
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
