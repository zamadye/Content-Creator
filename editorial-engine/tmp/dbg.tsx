import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Character } from '../remotion/src/illustration/figures';

const m = renderToStaticMarkup(<svg><Character kind="anak" x={0} y={0} height={360} pose={{ armA: [8, 6] }} /></svg>);
// print group transforms in order
const re = /<g transform="translate\(([-\d.]+) ([-\d.]+)\) rotate\(([-\d.]+)\)"><rect[^>]*fill="([^"]+)"/g;
let x;
while ((x = re.exec(m))) console.log('seg', x[1], x[2], x[3], 'fill', x[4]);
console.log('--- circles');
const rc = /<circle cx="([-\d.]+)" cy="([-\d.]+)" r="([-\d.]+)" fill="([^"]+)"/g;
while ((x = rc.exec(m))) console.log('circle', x[1], x[2], x[3], x[4]);
