// Provisional timings relative to VO 02, in seconds. Verify by listening to VO.
export const HOME_KNOCK_TIMES=[62.25,63.05,63.85];
export const VO2_START_FRAME=16309;
export const FPS=30;
export const cueMilliseconds=t=>Math.round((VO2_START_FRAME/FPS+t)*1000);
