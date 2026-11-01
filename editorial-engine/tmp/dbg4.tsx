import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Character } from '../remotion/src/illustration/figures';
const m = renderToStaticMarkup(<svg><Character kind="anak" x={0} y={0} height={360} /></svg>);
for (const key of ['rotate(17)', 'rotate(24)', 'rotate(-17)', 'rotate(-24)']) {
  const i = m.indexOf(key);
  console.log(key, '=>', i === -1 ? 'MISSING' : m.slice(Math.max(0, i - 90), i + 200).replace(/></g, '>\n<'));
  console.log('----');
}
