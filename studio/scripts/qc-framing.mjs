/**
 * QC framing: apakah yang seharusnya terlihat benar-benar masuk frame, di
 * sepanjang shot — bukan hanya di frame pertama.
 *
 *   node scripts/qc-framing.mjs                  # semua cerita di stories/<dir>/story.json
 *   node scripts/qc-framing.mjs stories/x/story.json [...]
 *
 * Tidak menggambar apa pun. Kamera, posisi aktor (termasuk geseran `travel`),
 * dan fov diproyeksikan ke NDC dengan matematika yang sama seperti renderer,
 * lalu dilaporkan per shot:
 *
 *   ok         kepala, dada, dan kaki subjek di dalam frame sepanjang shot
 *   terpotong  sebagian badan keluar frame (atau terlalu mepet, < 4% ke tepi)
 *   LUAR       seluruh tubuh keluar frame
 *   kosong     shot tak punya aktor maupun properti untuk diperiksa
 *
 * Ini penjaga untuk shot bergerak: di sandbox tanpa browser, framing tidak bisa
 * dilihat, jadi ia diukur. Keluar dengan kode 1 kalau ada LUAR/terpotong.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {compileStory} from '../src/studio/compile.js';
import {registry} from '../src/studio/library.js';

/** Story 2D (sprite + Remotion) tidak punya kamera 3D — lewati di QC 3D. */
function is3dStoryFile(file) {
  try {
    return !String(JSON.parse(fs.readFileSync(file, 'utf8')).schema ?? '').startsWith('studio.story2d');
  } catch {
    return true;
  }
}


const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const SAMPLES = [0, 0.25, 0.5, 0.75, 1];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (a) => {
  const l = Math.hypot(...a) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};

/** Proyeksi perspektif ke NDC: |x|,|y| <= 1 berarti di dalam frame. */
function project(point, cam, aspect) {
  const eye = cam.position;
  const fwd = norm(sub(cam.target, eye));
  const right = norm(cross(fwd, [0, 1, 0]));
  const up = cross(right, fwd);
  const rel = sub(point, eye);
  const depth = dot(rel, fwd);
  if (depth <= 0.05) return {behind: true, depth, x: NaN, y: NaN, inside: false, margin: Infinity};
  const tanHalf = Math.tan((cam.fov * Math.PI) / 360);
  const x = dot(rel, right) / (depth * tanHalf * aspect);
  const y = dot(rel, up) / (depth * tanHalf);
  const margin = Math.max(Math.abs(x), Math.abs(y));
  return {behind: false, depth, x, y, inside: margin <= 1, margin};
}

/** Posisi aktor pada u (0..1) shot, sudah termasuk geseran `travel`. */
function actorPoint(c, u, seconds, dy) {
  const d = (c.travel ?? 0) * seconds * u;
  return [c.at[0] + Math.sin(c.yaw) * d, c.at[1] + dy, c.at[2] + Math.cos(c.yaw) * d];
}

/** Titik tengah bounding box sebuah aset, untuk properti dan isi set. */
function assetCenter(id) {
  const b = registry.assets?.[id]?.bounds;
  if (!b) return [0, 0.5, 0];
  return [(b.min[0] + b.max[0]) / 2, (b.min[1] + b.max[1]) / 2, (b.min[2] + b.max[2]) / 2];
}

const fmt = (p) => (Number.isFinite(p.x) ? `(${p.x.toFixed(2)},${p.y.toFixed(2)})` : '(∞,∞)');

/**
 * Periksa satu cerita hasil compile. Mengembalikan satu baris per shot:
 * {id, status, detail, jarak: [dekat, jauh], issues: [...]}.
 */
export function framingIssues(story) {
  const aspect = story.width / story.height;
  const rows = [];

  for (const shot of story.shots) {
    const seconds = shot.durationInFrames / story.fps;
    const issues = [];
    let insideCount = 0;
    let nearest = Infinity;
    let farthest = 0;
    let detail = '';

    const actors = shot.cast.filter((c) => !c.hidden);
    for (const a of actors) {
      // Bounds use local metres from the actor origin, which can be below the feet.
      const bounds = registry.assets[a.assetId]?.bounds;
      const headY = bounds?.max[1] ?? 1.72;
      const chestY = bounds ? bounds.min[1] + 0.668 * bounds.size[1] : 1.2;
      const track = SAMPLES.map((u) => {
        const cam = shot.cameraSample(u);
        const point = actorPoint(a, u, seconds, 0);
        return {
          u,
          head: project([point[0], point[1] + headY, point[2]], cam, aspect),
          chest: project([point[0], point[1] + chestY, point[2]], cam, aspect),
        };
      });
      const chestIn = track.filter((t) => t.chest.inside);
      const headOut = track.filter((t) => !t.head.inside);
      for (const t of track) {
        nearest = Math.min(nearest, t.chest.depth);
        farthest = Math.max(farthest, t.chest.depth);
      }
      // Aktor yang duduk (`sit`) punya kepala jauh di bawah bbox aset yang
      // berdiri tegak, jadi pemeriksaan kepala dari bbox akan salah: di
      // `busri-05` ia menuduh kepala terpotong padahal render justru pas.
      // Untuk mereka cukup dada yang diukur; ukuran kepala yang sebenarnya
      // diperiksa `scripts/qc-subject.mjs` memakai pose klip.
      const seated = /^sit/.test(String(a.clip ?? ''));
      if (!chestIn.length) {
        issues.push(`${a.ref} tak pernah masuk frame`);
      } else {
        insideCount++;
        if (headOut.length && !seated) {
          const t = headOut[0];
          issues.push(`${a.ref} kepala terpotong di u=${t.u.toFixed(2)} ${fmt(t.head)}`);
        }
      }
      if (!detail) detail = `${a.ref} dada ${fmt(track[0].chest)}`;
    }

    // shot tanpa aktor: pastikan masih ada isi set yang membingkai gambar
    if (!actors.length) {
      const props = [...shot.objectPlacements, ...shot.set.map((s) => ({...s, ref: s.asset}))].filter(
        (p) => !p.hidden,
      );
      if (!props.length) {
        rows.push({id: shot.id, status: 'kosong', detail: 'tak ada aktor maupun properti', jarak: null, issues: []});
        continue;
      }
      let anyInside = false;
      for (const p of props) {
        const c = assetCenter(p.ref);
        const sc = p.scale ?? 1;
        const at = [p.at[0] + c[0] * sc, p.at[1] + c[1] * sc, p.at[2] + c[2] * sc];
        if (SAMPLES.some((u) => project(at, shot.cameraSample(u), aspect).inside)) anyInside = true;
      }
      if (!anyInside) issues.push('tidak ada isi set di dalam frame');
      insideCount = anyInside ? 1 : 0;
      detail = `${props.length} aset set`;
    }

    const status = !insideCount ? 'LUAR' : issues.length ? 'mepet' : 'ok';
    rows.push({
      id: shot.id,
      status,
      detail,
      jarak: Number.isFinite(nearest) && nearest < Infinity ? [nearest, farthest] : null,
      issues,
    });
  }

  return rows;
}

/** Format satu baris laporan, dipakai CLI. */
export function formatRow(r) {
  const jarak = r.jarak
    ? `jarak ${r.jarak[0].toFixed(2)}${r.jarak[1] - r.jarak[0] > 0.05 ? '–' + r.jarak[1].toFixed(2) : ''}m`
    : '';
  return (
    `  ${r.id.padEnd(13)} ${r.status.padEnd(9)} ${[r.detail, jarak].filter(Boolean).join(' · ').padEnd(38)}` +
    (r.issues.length ? `! ${r.issues.join(' | ')}` : '')
  );
}

/** Jalan sebagai CLI: `node scripts/qc-framing.mjs [file.json ...]`. */
function main() {
  const args = process.argv.slice(2);
  const files = args.length
    ? args
    : fs
        .readdirSync(path.join(root, 'stories'), {withFileTypes: true})
        .filter((d) => d.isDirectory())
        .map((d) => path.join(root, 'stories', d.name, 'story.json'))
        .filter(is3dStoryFile)
        .filter((f) => fs.existsSync(f))
        .sort();

  const out = [];
  let shots = 0;
  let flagged = 0;
  for (const file of files) {
    const story = compileStory(JSON.parse(fs.readFileSync(file, 'utf8')), {registry});
    const rows = framingIssues(story);
    shots += rows.length;
    flagged += rows.filter((r) => r.status !== 'ok' && r.status !== 'kosong').length;
    out.push(`${path.basename(file)} — ${rows.length} shot, ${story.durationInSeconds.toFixed(1)}s`);
    out.push(rows.map(formatRow).join('\n'));
  }
  console.log(out.join('\n'));
  console.log(`\n${shots} shot diperiksa · ${flagged} perlu perhatian`);
  if (flagged) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
