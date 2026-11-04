/**
 * Pembungkus tipis di atas @zernio/node.
 *
 * Aturan keras modul ini:
 *  1. API key hanya dibaca dari environment, tidak pernah dicetak, tidak pernah
 *     ditulis ke file, tidak pernah masuk pesan error.
 *  2. Semua keluaran status berupa baris `::notice::` / `::warning::` / `::error::`
 *     supaya bisa dibaca lewat API check-run, karena log mentah Actions tidak
 *     selalu bisa diunduh dari sandbox.
 *  3. Tidak ada fallback diam-diam: kalau key tidak ada, keluar dengan kode 2.
 */

export function readKey(names = ['ZERNIO_API_KEY', 'ZERNIO_KEY']) {
  for (const name of names) {
    const value = process.env[name];
    if (typeof value === 'string' && value.trim().length > 0) {
      // Jangan pernah mencetak isi key, termasuk potongannya.
      mask(value);
      return { name, value, length: value.trim().length };
    }
  }
  return null;
}

export function mask(value) {
  if (!value) return;
  console.log(`::add-mask::${value}`);
}

export function notice(message) {
  console.log(`::notice::${flatten(message)}`);
}

export function warn(message) {
  console.log(`::warning::${flatten(message)}`);
}

export function fail(message) {
  console.log(`::error::${flatten(message)}`);
}

function flatten(message) {
  return String(message).replace(/\r?\n/g, ' | ');
}

/** Ringkas error SDK tanpa membocorkan header Authorization. */
export function describeError(error) {
  if (!error) return 'unknown error';
  const parts = [];
  if (error.name) parts.push(error.name);
  if (error.statusCode) parts.push(`HTTP ${error.statusCode}`);
  if (error.code) parts.push(`code=${error.code}`);
  if (error.message) parts.push(String(error.message).slice(0, 300));
  if (error.fields) {
    try {
      parts.push(`fields=${JSON.stringify(error.fields).slice(0, 300)}`);
    } catch {
      /* ignore */
    }
  }
  return parts.join(' · ') || 'unknown error';
}

export async function loadSdk() {
  const mod = await import('@zernio/node');
  return mod.default ?? mod;
}
