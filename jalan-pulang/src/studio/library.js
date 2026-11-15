/**
 * Catalogue access for stories. Stories may only reference asset ids; this module
 * is the single place that turns an id into a file path, a rig, or a thumbnail.
 */
import REGISTRY from './registry.generated.js';

export const registry = REGISTRY;
export const units = REGISTRY.units;
export const categories = REGISTRY.categories;

export class UnknownAssetError extends Error {
  constructor(id, hint) {
    super(`unknown asset "${id}"${hint ? ` — ${hint}` : ''}`);
    this.name = 'UnknownAssetError';
    this.id = id;
  }
}

export function asset(id) {
  const entry = REGISTRY.assets[id];
  if (!entry) throw new UnknownAssetError(id, 'call listAssets() to see valid ids');
  return entry;
}

export function hasAsset(id) {
  return Boolean(REGISTRY.assets[id]);
}

export function listAssets({category, tag, rigged, query} = {}) {
  return Object.entries(REGISTRY.assets)
    .filter(([, e]) => (category ? e.category === category : true))
    .filter(([, e]) => (tag ? (e.tags ?? []).includes(tag) : true))
    .filter(([, e]) => (rigged === undefined ? true : Boolean(e.rig) === rigged))
    .filter(([, e]) => (query ? `${e.id} ${e.title} ${(e.tags ?? []).join(' ')}`.toLowerCase().includes(query.toLowerCase()) : true))
    .map(([id, e]) => ({id, ...e}));
}

/** Public-relative URI of the GLB, suitable for <img>/GLTFLoader after prefixing. */
export function assetUri(id, {base = '/'} = {}) {
  const e = asset(id);
  const clean = base.endsWith('/') ? base : `${base}/`;
  return `${clean}${e.uri}`;
}

export function thumbnailUri(id, {base = '/'} = {}) {
  const e = asset(id);
  const clean = base.endsWith('/') ? base : `${base}/`;
  return `${clean}${e.thumbnail}`;
}

export function clipsOf(id) {
  return asset(id).rig?.clips ?? [];
}

export function clipsForAsset(id) {
  return asset(id).rig?.clips ?? [];
}

export function boundsOf(id) {
  return asset(id).bounds ?? null;
}

/**
 * Resolve every asset a story mentions, with its cost, so the renderer can
 * preload exactly once and the CLI can report weight before rendering.
 */
export function resolveStoryAssets(story) {
  const used = new Map();
  const touch = (id, role) => {
    if (!id) return;
    const e = REGISTRY.assets[id];
    if (!e) throw new UnknownAssertErrorSafe(id);
    const rec = used.get(id) ?? {id, role, entry: e};
    used.set(id, rec);
  };
  for (const [, c] of Object.entries(story.cast ?? {})) touch(c.asset, 'cast');
  for (const [, o] of Object.entries(story.objects ?? {})) touch(o.asset, 'object');
  for (const shot of story.shots ?? []) {
    for (const s of shot.set ?? []) touch(s.asset, 'set');
  }
  const list = [...used.values()];
  return {
    assets: list,
    bytes: list.reduce((n, a) => n + (a.entry.bytes ?? 0), 0),
    unique: list.length,
  };
}

function UnknownAssertErrorSafe(id) {
  const err = new UnknownAssetError(id, 'referenced by the story');
  return err;
}

export {UnknownAssertErrorSafe};

/** Human/agent readable catalogue summary (used by CLI + docs). */
export function catalogueSummary() {
  const byCat = new Map();
  for (const [id, e] of Object.entries(REGISTRY.assets)) {
    const list = byCat.get(e.category) ?? [];
    list.push({id, title: e.title, clipCount: e.rig?.clips?.length ?? 0, status: e.status});
    byCat.set(e.category, list);
  }
  return [...byCat.entries()].map(([category, items]) => ({category, items}));
}
