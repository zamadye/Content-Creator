import React from 'react';
import { S01Hook } from './s01_hook';
import { S02Corridor } from './s02_corridor';
import { S03Scale } from './s03_scale';
import { S04Stat } from './s04_stat';
import { S05Waiting } from './s05_waiting';
import { S06Certificate } from './s06_certificate';
import { S07Taste } from './s07_taste';
import { S08Metric } from './s08_metric';
import { S09Closing } from './s09_closing';
import { K01Hook } from './k01_hook';
import { K02Context } from './k02_context';
import { K03Conflict } from './k03_conflict';
import { K04Development } from './k04_development';
import { K05Perspective } from './k05_perspective';
import { K06Evidence } from './k06_evidence';
import { K07Closing } from './k07_closing';
import { H01Hook } from './h01_hook';
import { H02Context } from './h02_context';
import { H03Conflict } from './h03_conflict';
import { H04Development } from './h04_development';
import { H05Perspective } from './h05_perspective';
import { H06Evidence } from './h06_evidence';
import { H07Closing } from './h07_closing';
import { P01Hook } from './p01_hook';
import { P02Context } from './p02_context';
import { P03Conflict } from './p03_conflict';
import { P04Development } from './p04_development';
import { P05Perspective } from './p05_perspective';
import { P06Evidence } from './p06_evidence';
import { P07Closing } from './p07_closing';

/** Scene registry: the timeline refers to scenes by id, never by import order. */
export const SCENES: Record<string, React.FC<{ d: number }>> = {
  s01: S01Hook,
  s02: S02Corridor,
  s03: S03Scale,
  s04: S04Stat,
  s05: S05Waiting,
  s06: S06Certificate,
  s07: S07Taste,
  s08: S08Metric,
  s09: S09Closing,
  // misi kelima — judol-taruhan-kecil-2026 (prefix k)
  k01: K01Hook,
  k02: K02Context,
  k03: K03Conflict,
  k04: K04Development,
  k05: K05Perspective,
  k06: K06Evidence,
  k07: K07Closing,
  // misi keenam — karhutla-angka-turun-2026 (prefix h)
  h01: H01Hook,
  h02: H02Context,
  h03: H03Conflict,
  h04: H04Development,
  h05: H05Perspective,
  h06: H06Evidence,
  h07: H07Closing,
  // misi ketujuh — pinjol-bunga-harian-2026 (prefix p, gaya kolase kertas)
  p01: P01Hook,
  p02: P02Context,
  p03: P03Conflict,
  p04: P04Development,
  p05: P05Perspective,
  p06: P06Evidence,
  p07: P07Closing,
};
