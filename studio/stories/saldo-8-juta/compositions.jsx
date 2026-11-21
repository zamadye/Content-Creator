import React from 'react';
import story from './story.json';
import {Saldo2DStory, saldo2dMetadata} from '../../src/saldo2d/Saldo2D.jsx';

/**
 * Komposisi 2D untuk "Saldo 8 Juta". Jalur generik `StudioStory` (3D) tidak
 * dipakai lagi untuk film ini — seluruh gambar adalah sprite PNG + ilustrasi
 * latar yang dianimasikan Remotion.
 */
export default [
  {
    id: 'StudioSaldo2D',
    component: Saldo2DStory,
    defaultProps: {story},
    calculateMetadata: saldo2dMetadata,
  },
];
