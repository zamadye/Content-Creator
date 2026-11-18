import React, {lazy, Suspense, useState} from 'react';
import {listAssets, thumbnailUri} from './library.js';
import './catalog.css';

const Inspector = lazy(() => import('./ModelInspector.jsx'));
const cast = listAssets().filter((a) => ['character', 'entity'].includes(a.category));
const names = {'char.remaja-perempuan': 'Nisa', 'char.remaja-laki': 'Bayu'};
const types = {character: 'Manusia', entity: 'Entitas horor'};
const title = (a) => names[a.id] || a.title.split(' — ')[0];
const description = (a) => a.title.split(' — ')[1] || a.id;
const status = (a) =>
  ({review: 'Dalam ulasan', draft: 'Draf', approved: 'Siap produksi'})[a.status] || a.status;
const link = (id) => '#karakter/' + id;

export default function CharacterCatalog({id}) {
  const [group, setGroup] = useState('all');
  const [query, setQuery] = useState('');
  const actor = cast.find((a) => a.id === id);
  const filtered = cast.filter(
    (a) =>
      (group === 'all' || a.category === group) &&
      [a.title, a.id, title(a), ...a.tags].join(' ').toLowerCase().includes(query.trim().toLowerCase()),
  );
  return (
    <div className="cast-app">
      <div className="cast-nav">
        <a className="cast-brand" href="#karakter">
          <b>LS</b> THE LAST SIGNAL
        </a>
        <nav aria-label="Studio">
          <a href="#karakter" aria-current="page">
            Katalog karakter
          </a>
          <a href="#adegan">Arsip adegan</a>
        </nav>
      </div>
      <div className="cast-content">
        {actor ? (
          <>
            <a className="cast-back" href="#karakter">
              ← Semua karakter
            </a>
            <div className="cast-heading">
              <div>
                <div className="cast-kicker">{types[actor.category]}</div>
                <h1>{title(actor)}</h1>
                <p>{actor.title}</p>
              </div>
              <span className="cast-status">{status(actor)}</span>
            </div>
            <div className="cast-detail">
              <Suspense fallback={<p>Memuat penampil 3D…</p>}>
                <Inspector key={actor.id} actor={actor} />
              </Suspense>
              <div className="cast-notes">
                <h2>Catatan model</h2>
                <dl>
                  <dt>Tinggi model</dt>
                  <dd>{actor.bounds.size[1].toFixed(2)} m</dd>
                  <dt>Rig</dt>
                  <dd>{actor.rig.bones} tulang</dd>
                  <dt>Animasi</dt>
                  <dd>{actor.rig.clips.length} klip</dd>
                </dl>
                <h3>Fokus perbaikan</h3>
                <p>{actor.review?.note || 'Model menunggu pemeriksaan visual.'}</p>
                <h3>Identitas aset</h3>
                <code>{actor.id}</code>
                <p>
                  <a href={'/' + actor.uri} download>
                    Unduh model GLB ↓
                  </a>
                </p>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="cast-heading">
              <div>
                <div className="cast-kicker">STUDIO ANIMASI 3D</div>
                <h1>Katalog karakter</h1>
                <p>Pilih tokoh untuk memeriksa bentuk, material, dan geraknya.</p>
              </div>
            </div>
            {id && <p role="alert">Karakter ini tidak ditemukan di katalog.</p>}
            <div className="cast-tools">
              <div className="cast-tabs" aria-label="Kategori">
                {[['all', 'Semua'], ...Object.entries(types)].map(([key, label]) => (
                  <button key={key} aria-pressed={group === key} onClick={() => setGroup(key)}>
                    {label}{' '}
                    <span>{key === 'all' ? cast.length : cast.filter((a) => a.category === key).length}</span>
                  </button>
                ))}
              </div>
              <input
                type="search"
                aria-label="Cari karakter"
                placeholder="Cari karakter…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="cast-grid">
              {filtered.map((a) => (
                <a className="cast-card" key={a.id} href={link(a.id)}>
                  <div className="cast-photo">
                    <img src={thumbnailUri(a.id)} alt="" loading="lazy" />
                    <span>{status(a)}</span>
                  </div>
                  <div className="cast-card-body">
                    <h2>{title(a)}</h2>
                    <p>{description(a)}</p>
                  </div>
                </a>
              ))}
            </div>
            {!filtered.length && <p role="status">Tidak ada karakter yang cocok.</p>}
          </>
        )}
      </div>
    </div>
  );
}
