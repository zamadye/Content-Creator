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
};
