/**
 * Global <defs>. Kept in one place so environments/figures can reference stable ids
 * (`tile-fill`, `batik-fill`, `blur-soft`, ...) without prop-drilling.
 */
import React from 'react';
import { palette } from '../../../design/tokens';

export const GlobalDefs: React.FC = () => (
  <defs>
    <pattern id="tile-fill" width="96" height="96" patternUnits="userSpaceOnUse">
      <rect width="96" height="96" fill="none" />
      <path d="M0 0 H96 M0 96 H96 M0 0 V96 M96 0 V96" stroke={palette.ink} strokeWidth="2" opacity="0.16" />
    </pattern>

    <pattern id="batik-fill" width="22" height="22" patternUnits="userSpaceOnUse">
      <rect width="22" height="22" fill={palette.clayDeep} />
      <circle cx="5.5" cy="5.5" r="2.4" fill={palette.paper} opacity="0.5" />
      <circle cx="16.5" cy="16.5" r="2.4" fill={palette.paper} opacity="0.5" />
      <path d="M11 2 L20 11 L11 20 L2 11 Z" fill="none" stroke={palette.mustard} strokeWidth="0.9" opacity="0.35" />
    </pattern>

    <pattern id="hatch-fill" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
      <path d="M0 0 V12" stroke={palette.ink} strokeWidth="3.4" opacity="0.35" />
    </pattern>

    <filter id="blur-soft" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="26" />
    </filter>
    <filter id="blur-mid" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="10" />
    </filter>
    <filter id="blur-hard" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="44" />
    </filter>
    {/* bayangan potongan kertas (misi 7 — kolase) */}
    <filter id="paper-shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="9" />
    </filter>
    <filter id="paper-shadow-soft" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="20" />
    </filter>

    <linearGradient id="vignette" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={palette.ink} stopOpacity="0.55" />
      <stop offset="26%" stopColor={palette.ink} stopOpacity="0" />
      <stop offset="74%" stopColor={palette.ink} stopOpacity="0" />
      <stop offset="100%" stopColor={palette.ink} stopOpacity="0.72" />
    </linearGradient>

    <linearGradient id="paper-glow" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={palette.warmLight} stopOpacity="0.22" />
      <stop offset="100%" stopColor={palette.warmLight} stopOpacity="0" />
    </linearGradient>
  </defs>
);
