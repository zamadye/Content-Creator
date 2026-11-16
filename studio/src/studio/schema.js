/**
 * studio.story/2 — the data contract for agent-authored scenes.
 *
 * A story is pure JSON: no code, no paths to code. Every asset is referenced by
 * its catalogue id (see public/assets/registry.json). Nothing in here touches the
 * DOM, so it can be validated in Node and in the browser with the same code.
 */

export const STORY_SCHEMA = 'studio.story/2';
export const RIG = 'studio-humanoid-v1';

export const FACINGS = ['+Z', '-Z', '+X', '-X'];
export const FPS_CHOICES = [24, 25, 30];

/** Fields allowed on each node. Unknown fields are errors: agents get feedback. */
export const FIELDS = {
  story: ['schema', 'id', 'title', 'fps', 'width', 'height', 'look', 'cast', 'objects', 'shots', 'meta'],
  look: ['preset', 'fog', 'exposure', 'grain', 'vignette', 'sky'],
  cast: ['asset', 'clip', 'palette', 'scale', 'label', 'note'],
  objects: ['asset', 'scale', 'label'],
  shot: ['id', 'duration', 'title', 'set', 'actors', 'objects', 'camera', 'light', 'audio', 'text', 'secondary', 'note'],
  set: ['asset', 'at', 'rot', 'scale', 'clip'],
  actor: ['ref', 'at', 'facing', 'clip', 'offset', 'speed', 'travel', 'loop', 'lookAt', 'hold', 'holdHand', 'holdOffset', 'hidden'],
  object: ['ref', 'at', 'rot', 'scale', 'hidden'],
  camera: ['preset', 'from', 'to', 'target', 'fov', 'roll', 'shake', 'side', 'radius', 'startAngle', 'arc', 'distance', 'height'],
  light: ['preset', 'intensity', 'color'],
  audio: ['vo', 'ambience', 'music', 'sfx'],
  text: ['id', 'style', 'value'],
  meta: ['author', 'notes', 'generatedBy', 'tags'],
};

export const CAMERA_PRESETS = [
  'static',
  'dolly-in',
  'dolly-out',
  'pan',
  'orbit',
  'crane-up',
  'low-angle',
  'over-shoulder',
  'handheld',
  'follow',
];

export const LIGHT_PRESETS = ['siang', 'sore', 'malam', 'lampu-teplok', 'neon', 'bulan', 'fajar'];
export const LOOK_PRESETS = ['kampung-siang', 'kampung-sore', 'kampung-malam', 'interior-lampu', 'hutan-pagi', 'industri'];
export const TEXT_STYLES = ['subtitle', 'title', 'sign', 'caption'];

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const isVec3 = (v) => Array.isArray(v) && v.length === 3 && v.every(isNum);
const isStr = (v) => typeof v === 'string' && v.length > 0;

export class StoryError extends Error {
  constructor(problems) {
    super(`story invalid:\n  - ${problems.join('\n  - ')}`);
    this.name = 'StoryError';
    this.problems = problems;
  }
}

function checkFields(obj, allowed, where, problems) {
  for (const key of Object.keys(obj)) {
    if (!allowed.includes(key)) problems.push(`${where}: unknown field "${key}" (allowed: ${allowed.join(', ')})`);
  }
}

function checkVec3(v, where, problems) {
  if (!isVec3(v)) problems.push(`${where}: expected [x, y, z] numbers`);
}

/** Fill defaults. Returns a new object; never mutates the input. */
export function normalizeStory(raw) {
  const s = structuredClone(raw ?? {});
  s.schema = s.schema ?? STORY_SCHEMA;
  s.id = s.id ?? 'untitled';
  s.title = s.title ?? s.id;
  s.fps = s.fps ?? 30;
  s.width = s.width ?? 1920;
  s.height = s.height ?? 1080;
  s.look = {preset: 'kampung-siang', fog: 0.02, exposure: 1, grain: 0.035, vignette: 0.22, ...(s.look ?? {})};
  s.cast = s.cast ?? {};
  s.objects = s.objects ?? {};
  s.shots = (s.shots ?? []).map((shot, i) => {
    const out = {...shot};
    out.id = shot.id ?? `shot-${String(i + 1).padStart(2, '0')}`;
    out.duration = shot.duration ?? 3;
    out.set = (shot.set ?? []).map((item) => ({at: [0, 0, 0], rot: 0, scale: 1, ...item}));
    out.actors = (shot.actors ?? []).map((a) => ({facing: '+Z', clip: 'idle', speed: 1, travel: 0, offset: 0, lookAt: null, hold: null, holdHand: 'R', holdOffset: [0, 0, 0], hidden: false, ...a}));
    out.objects = (shot.objects ?? []).map((o) => ({at: [0, 0, 0], rot: 0, scale: 1, hidden: false, ...o}));
    out.camera = {preset: 'static', fov: 40, roll: 0, shake: 0, ...(shot.camera ?? {})};
    out.light = {preset: 'siang', intensity: 1, ...(shot.light ?? {})};
    // 1 = gerak sekunder normal, 0 = mati (mis. saat beku), 2 = dilebihkan
    out.secondary = shot.secondary ?? 1;
    return out;
  });
  return s;
}

/**
 * Validate a story against the schema and (optionally) the asset catalogue.
 * Throws StoryError with every problem found; returns warnings.
 */
export function validateStory(raw, {registry = null} = {}) {
  const problems = [];
  const warnings = [];
  const s = normalizeStory(raw);

  if (s.schema !== STORY_SCHEMA) problems.push(`schema must be "${STORY_SCHEMA}" (got "${s.schema}")`);
  if (!/^[a-z0-9][a-z0-9._-]*$/.test(s.id)) problems.push(`id "${s.id}" must be lower-case slug (a-z0-9._-)`);
  if (!FPS_CHOICES.includes(s.fps)) problems.push(`fps must be one of ${FPS_CHOICES.join('/')}`);
  for (const k of ['width', 'height']) {
    if (!Number.isInteger(s[k]) || s[k] < 256 || s[k] > 4096 || s[k] % 2) problems.push(`${k} must be an even integer 256..4096`);
  }
  checkFields(s.look, FIELDS.look, 'look', problems);
  if (!LOOK_PRESETS.includes(s.look.preset)) problems.push(`look.preset must be one of ${LOOK_PRESETS.join('/')}`);
  if (!(s.look.fog >= 0 && s.look.fog <= 0.2)) problems.push('look.fog must be 0..0.2');

  const knownAssets = registry ? {...(registry.assets ?? {}), ...(registry.props ?? {})} : null;
  const assetOk = (id, where) => {
    if (!isStr(id)) {
      problems.push(`${where}: asset must be a catalogue id string`);
      return;
    }
    if (!knownAssets) return;
    if (!knownAssets[id]) problems.push(`${where}: unknown asset "${id}" (see public/assets/registry.json)`);
    else if (knownAssets[id].status === 'draft') warnings.push(`${where}: asset "${id}" is still draft quality`);
  };

  for (const [name, c] of Object.entries(s.cast)) {
    checkFields(c, FIELDS.cast, `cast.${name}`, problems);
    assetOk(c.asset, `cast.${name}`);
    if (c.palette && !/^[a-z0-9-]+$/.test(c.palette)) problems.push(`cast.${name}.palette must be a slug`);
    if (c.scale !== undefined && !(c.scale > 0.02 && c.scale < 20)) problems.push(`cast.${name}.scale out of range`);
  }
  for (const [name, o] of Object.entries(s.objects)) {
    checkFields(o, FIELDS.objects, `objects.${name}`, problems);
    assetOk(o.asset, `objects.${name}`);
  }

  if (!s.shots.length) problems.push('shots must contain at least one shot');
  const ids = new Set();
  let total = 0;
  s.shots.forEach((shot, i) => {
    const where = `shots[${i}]${shot.id ? ` (${shot.id})` : ''}`;
    checkFields(shot, FIELDS.shot, where, problems);
    if (!/^[a-z0-9][a-z0-9._-]*$/i.test(shot.id)) problems.push(`${where}: bad id`);
    if (ids.has(shot.id)) problems.push(`${where}: duplicate id "${shot.id}"`);
    ids.add(shot.id);
    if (!(isNum(shot.duration) && shot.duration >= 0.2 && shot.duration <= 120)) problems.push(`${where}: duration must be 0.2..120 s`);
    total += isNum(shot.duration) ? shot.duration : 0;

    shot.set.forEach((item, j) => {
      checkFields(item, FIELDS.set, `${where}.set[${j}]`, problems);
      assetOk(item.asset, `${where}.set[${j}]`);
      checkVec3(item.at, `${where}.set[${j}].at`, problems);
      if (!isNum(item.rot)) problems.push(`${where}.set[${j}].rot must be radians (number)`);
    });

    const seen = new Set();
    shot.actors.forEach((a, j) => {
      const w = `${where}.actors[${j}]`;
      checkFields(a, FIELDS.actor, w, problems);
      if (!s.cast[a.ref]) problems.push(`${w}: ref "${a.ref}" is not in cast`);
      if (seen.has(a.ref)) problems.push(`${w}: "${a.ref}" placed twice in one shot`);
      seen.add(a.ref);
      checkVec3(a.at, `${w}.at`, problems);
      if (!FACINGS.includes(a.facing)) problems.push(`${w}.facing must be one of ${FACINGS.join(' ')}`);
      if (!isStr(a.clip)) problems.push(`${w}.clip must be a clip name`);
      if (a.speed !== undefined && !(a.speed > 0 && a.speed <= 4)) problems.push(`${w}.speed must be 0..4`);
      // travel: world metres per second along `facing` (0 = berjalan di tempat)
      if (a.travel !== undefined && !(a.travel >= 0 && a.travel <= 6)) problems.push(`${w}.travel must be 0..6`);
      // lookAt: "ref" (nama di cast) atau titik dunia [x, y, z]
      if (a.lookAt !== undefined && a.lookAt !== null) {
        if (typeof a.lookAt === 'string') {
          if (a.lookAt === a.ref) problems.push(`${w}.lookAt: tidak bisa menoleh ke diri sendiri`);
          else if (!s.cast[a.lookAt]) problems.push(`${w}.lookAt: ref "${a.lookAt}" is not in cast`);
          else if (!shot.actors.some((x) => x.ref === a.lookAt)) {
            problems.push(`${w}.lookAt: "${a.lookAt}" must be placed in this shot too`);
          }
        } else {
          checkVec3(a.lookAt, `${w}.lookAt`, problems);
        }
      }
      // hold: properti dari story.objects yang menempel di tangan aktor
      if (a.hold !== undefined && a.hold !== null) {
        if (!s.objects[a.hold]) problems.push(`${w}.hold: ref \"${a.hold}\" is not in objects`);
        if (a.holdHand !== undefined && !['L', 'R'].includes(a.holdHand)) {
          problems.push(`${w}.holdHand must be \"L\" or \"R\"`);
        }
        if (a.holdOffset !== undefined) checkVec3(a.holdOffset, `${w}.holdOffset`, problems);
      }
      const entry = knownAssets?.[s.cast[a.ref]?.asset];
      if (entry?.rig?.clips && isStr(a.clip) && !entry.rig.clips.includes(a.clip)) {
        problems.push(`${w}.clip "${a.clip}" not in ${s.cast[a.ref].asset} (has: ${entry.rig.clips.join(', ')})`);
      }
    });

    shot.objects.forEach((o, j) => {
      const w = `${where}.objects[${j}]`;
      checkFields(o, FIELDS.object, w, problems);
      if (!s.objects[o.ref]) problems.push(`${w}: ref "${o.ref}" is not in objects`);
      checkVec3(o.at, `${w}.at`, problems);
    });

    const cam = shot.camera;
    checkFields(cam, FIELDS.camera, `${where}.camera`, problems);
    if (!CAMERA_PRESETS.includes(cam.preset)) problems.push(`${where}.camera.preset must be one of ${CAMERA_PRESETS.join('/')}`);
    for (const k of ['from', 'to', 'target']) if (cam[k] !== undefined) checkVec3(cam[k], `${where}.camera.${k}`, problems);
    if (!(cam.fov >= 10 && cam.fov <= 120)) problems.push(`${where}.camera.fov must be 10..120`);
    if (cam.distance !== undefined && !(isNum(cam.distance) && cam.distance >= 0.3 && cam.distance <= 30)) {
      problems.push(`${where}.camera.distance must be 0,3..30 m`);
    }
    if (cam.height !== undefined && !(isNum(cam.height) && cam.height >= -2 && cam.height <= 20)) {
      problems.push(`${where}.camera.height must be -2..20 m`);
    }
    if (cam.preset === 'over-shoulder' && cam.target === undefined) warnings.push(`${where}.camera: over-shoulder without target falls back to the subject's chest`);

    if (!(isNum(shot.secondary) && shot.secondary >= 0 && shot.secondary <= 2)) {
      problems.push(`${where}.secondary must be 0..2 (0 = off, 1 = normal)`);
    }

    checkFields(shot.light, FIELDS.light, `${where}.light`, problems);
    if (!LIGHT_PRESETS.includes(shot.light.preset)) problems.push(`${where}.light.preset must be one of ${LIGHT_PRESETS.join('/')}`);

    if (shot.audio) {
      checkFields(shot.audio, FIELDS.audio, `${where}.audio`, problems);
      if (shot.audio.vo && !/^vo\/[a-z0-9][a-z0-9._/-]*\.(mp3|wav|m4a)$/.test(shot.audio.vo)) {
        problems.push(`${where}.audio.vo must be a safe public-relative path like vo/ep1-01.mp3`);
      }
    }
    if (shot.text) {
      checkFields(shot.text, FIELDS.text, `${where}.text`, problems);
      if (!TEXT_STYLES.includes(shot.text.style)) problems.push(`${where}.text.style must be one of ${TEXT_STYLES.join('/')}`);
      if (typeof shot.text.value !== 'string' || shot.text.value.length > 240) problems.push(`${where}.text.value must be a string ≤240 chars`);
    }
  });

  if (total > 900) problems.push(`total duration ${total.toFixed(1)}s exceeds the 15 minute ceiling for a single story file`);
  if (s.shots.length > 400) problems.push('more than 400 shots: split the story');

  if (problems.length) throw new StoryError(problems);
  return {warnings, durationInFrames: Math.round(total * s.fps), durationInSeconds: Number(total.toFixed(3))};
}
