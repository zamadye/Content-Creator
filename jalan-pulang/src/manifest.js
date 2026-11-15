import {SHOT_TYPES} from './shot-registry.js';

const fail = (message) => { throw new Error(`Story manifest: ${message}`); };
const integer = (n) => Number.isSafeInteger(n);
const object = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const keys = (obj, allowed, label) => { for (const key of Object.keys(obj)) if (!allowed.includes(key)) fail(`${label}: unknown field ${key}`); };
export function validateManifest(story) {
 if (!object(story)) fail('expected an object');
 keys(story, ['version','id','fps','width','height','shots','audio'], 'story');
 if (story.version !== 1) fail('version must be 1');
 if (typeof story.id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(story.id)) fail('invalid id');
 if (story.fps !== 30) fail('fps must be 30 for legacy scenes');
 for (const k of ['width','height']) if (!integer(story[k]) || story[k] <= 0 || story[k] % 2) fail(`${k} must be a positive even integer`);
 if (!Array.isArray(story.shots) || !story.shots.length) fail('shots must be a non-empty array');
 let end=0;
 story.shots.forEach((shot,i) => {
  if (!object(shot)) fail(`shot ${i}: expected object`);
  keys(shot,['type','from','duration','view'],`shot ${i}`);
  if (!Object.hasOwn(SHOT_TYPES,shot.type)) fail(`shot ${i}: unknown type ${shot.type}`);
  if (!integer(shot.from) || shot.from !== end) fail(`shot ${i}: expected from ${end}`);
  if (!integer(shot.duration) || shot.duration <= 0 || !Number.isSafeInteger(end+shot.duration)) fail(`shot ${i}: invalid duration`);
  if (shot.view !== undefined && !SHOT_TYPES[shot.type].includes(shot.view)) fail(`shot ${i}: invalid view`);
  end += shot.duration;
 });
 if (story.audio !== undefined) {
  if (!Array.isArray(story.audio)) fail('audio must be an array');
  story.audio.forEach((audio,i) => {
   if (!object(audio)) fail(`audio ${i}: expected object`);
   keys(audio,['src','from','duration'],`audio ${i}`);
   if (typeof audio.src !== 'string' || !/^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_.-]+)+$/.test(audio.src) || audio.src.split('/').some(p=>p==='.' || p==='..')) fail(`audio ${i}: expected safe public-relative path`);
   if (!integer(audio.from) || audio.from < 0 || !integer(audio.duration) || audio.duration <= 0 || audio.from+audio.duration > end) fail(`audio ${i}: invalid range`);
  });
 }
 return {durationInFrames:end, fps:story.fps, width:story.width, height:story.height};
}
