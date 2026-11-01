import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Character } from '../remotion/src/illustration/figures';
const m = renderToStaticMarkup(<svg><Character kind="anak" x={0} y={0} height={360} /></svg>);
const idx = m.indexOf('rotate(17');
console.log(m.length);
console.log(m.slice(0, 900));
