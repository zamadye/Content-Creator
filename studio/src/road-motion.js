// Positive wrapping is required when travelling beyond one entire scenery cycle.
export const positiveModulo=(value,period)=>((value%period)+period)%period;
export const sceneryZ=(base,travel,period)=>4-positiveModulo(base-travel,period);
// A right bend begins beyond the foreground, then straightens without sudden jumps.
export const rightBendX=z=>{const d=Math.min(18,Math.max(0,-z-3));return .032*d*d;};
