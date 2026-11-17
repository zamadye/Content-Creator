/**
 * Story -> timeline. Pure: same input, same output, no DOM, no three.js.
 * The renderer and the CLI both consume this, so what an agent validates is
 * literally what gets rendered.
 */
import {normalizeStory, validateStory, resolveOutfits, FIELDS, StoryError} from './schema.js';
import {sampleCamera, shotSubject, facingVector, facingYaw} from './camera.js';

/** Frame timing per shot, with the rounded frame boundaries kept consistent. */
export function shotTimings(shots, fps) {
  let acc = 0;
  return shots.map((shot) => {
    const durationInFrames = Math.max(1, Math.round(shot.duration * fps));
    const from = acc;
    acc += durationInFrames;
    return {id: shot.id, from, durationInFrames};
  });
}

export function compileStory(raw, {registry = null} = {}) {
  const story = normalizeStory(raw);
  const {warnings, durationInFrames} = validateStory(story, {registry});
  // Setelah validasi (outfit dicek terhadap daftar varian), cast bisa ditukar
  // ke asset varian yang benar-benar memakai kostum itu.
  resolveOutfits(story, {registry});
  const timings = shotTimings(story.shots, story.fps);

  const shots = story.shots.map((shot, i) => {
    const timing = timings[i];
    const positions = {};
    for (const a of shot.actors) positions[a.ref] = a.at;
    const subject = shotSubject(shot, positions);
    // Subjek yang bergerak (`travel`) untuk preset kamera `follow`, plus arah
    // hadap aktor pertama supaya kamera bisa berjalan di belakangnya.
    const seconds = timing.durationInFrames / (story.fps || 30);
    const lead = shot.actors.find((a) => !a.hidden) ?? null;
    const leadYaw = lead ? facingYaw(lead.facing) : 0;
    const leadTravel = lead?.travel ?? 0;
    const leadAt = lead?.at ?? [0, 0, 0];
    const subjectAt = (u) => [
      leadAt[0] + Math.sin(leadYaw) * leadTravel * seconds * u,
      leadAt[1],
      leadAt[2] + Math.cos(leadYaw) * leadTravel * seconds * u,
    ];
    const facing = lead ? facingVector(lead.facing) : [0, 0, 1];
    const cast = shot.actors.map((a) => ({
      ref: a.ref,
      assetId: story.cast[a.ref]?.asset,
      at: a.at,
      yaw: facingYaw(a.facing),
      facing: facingVector(a.facing),
      clip: a.clip,
      speed: a.speed ?? 1,
      travel: a.travel ?? 0,
      offset: a.offset ?? 0,
      lookAt: a.lookAt ?? null,
      hold: a.hold ?? null,
      holdHand: a.holdHand ?? 'R',
      holdOffset: a.holdOffset ?? [0, 0, 0],
      hidden: Boolean(a.hidden),
    }));
    const objects = shot.objects.map((o) => ({
      ref: o.ref,
      assetId: story.objects[o.ref]?.asset,
      at: o.at,
      rot: o.rot ?? 0,
      scale: o.scale ?? 1,
      hidden: Boolean(o.hidden),
    }));
    return {
      ...shot,
      index: i,
      from: timing.from,
      durationInFrames: timing.durationInFrames,
      subject,
      cast,
      objectPlacements: objects,
      secondary: shot.secondary ?? 1,
      cameraSample: (u) =>
        sampleCamera(shot, u, {
          subject,
          subjectAt,
          facing,
          subjectHeight: lead
            ? registry?.assets?.[story.cast[lead.ref]?.asset]?.bounds?.size?.[1] ??
              registry?.props?.[story.cast[lead.ref]?.asset]?.bounds?.size?.[1] ??
              null
            : null,
          seed: i + 1,
        }),
    };
  });

  const assets = new Map();
  for (const shot of shots) {
    for (const c of shot.cast) {
      assets.set(c.assetId, true);
      // properti yang dipegang ikut dimuat walau tidak diletakkan di set
      const held = c.hold ? story.objects[c.hold]?.asset : null;
      if (held) assets.set(held, true);
    }
    for (const o of shot.objectPlacements) assets.set(o.assetId, true);
    for (const s of shot.set) assets.set(s.asset, true);
  }

  const audio = shots
    .filter((s) => s.audio)
    .map((s) => ({shotId: s.id, from: s.from, durationInFrames: s.durationInFrames, ...s.audio}));

  const text = shots
    .filter((s) => s.text)
    .map((s) => ({shotId: s.id, from: s.from, durationInFrames: s.durationInFrames, ...s.text}));

  return {
    schema: story.schema,
    id: story.id,
    title: story.title,
    fps: story.fps,
    width: story.width,
    height: story.height,
    look: story.look,
    cast: story.cast,
    objects: story.objects,
    durationInFrames,
    durationInSeconds: durationInFrames / story.fps,
    shots,
    audio,
    text,
    assetIds: [...assets.keys()].filter(Boolean),
    warnings,
  };
}

/** Compact text view for CLIs and for feeding back to an agent. */
export function summarize(compiled) {
  const lines = [];
  lines.push(`${compiled.id} — ${compiled.title}`);
  lines.push(
    `${compiled.width}x${compiled.height} @ ${compiled.fps}fps · ${compiled.durationInFrames} frames · ${compiled.durationInSeconds.toFixed(1)}s · ${compiled.shots.length} shots`,
  );
  lines.push(`look=${compiled.look.preset} fog=${compiled.look.fog} assets=${compiled.assetIds.length}`);
  for (const s of compiled.shots) {
    const cast = s.cast.map((c) => `${c.ref}:${c.assetId}@${c.clip}`).join(' ');
    const cam = s.camera.preset;
    lines.push(
      `  #${String(s.index + 1).padStart(2, '0')} ${s.id.padEnd(14)} ${String(s.durationInFrames).padStart(4)}f  cam:${cam.padEnd(12)} ${cast}`,
    );
  }
  if (compiled.warnings.length) {
    lines.push('warnings:');
    for (const w of compiled.warnings) lines.push(`  ! ${w}`);
  }
  return lines.join('\n');
}

export {StoryError, FIELDS};
