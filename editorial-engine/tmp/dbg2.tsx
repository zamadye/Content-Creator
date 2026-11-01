import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Character } from '../remotion/src/illustration/figures';
const m = renderToStaticMarkup(<svg><Character kind="anak" x={0} y={0} height={360} /></svg>);
const groups = m.match(/<g transform="translate\([-\d.]+ [-\d.]+\) rotate\([-\d.]+\)"><rect[^/]*\/>/g) ?? [];
console.log('segments:', groups.length);
groups.forEach((g, i) => console.log(i, g.slice(0, 150)));
