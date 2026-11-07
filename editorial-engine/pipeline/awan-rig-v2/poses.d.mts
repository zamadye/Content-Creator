import type {Point} from './rig-math.mjs';
export type Pose={x:number;y:number;scale:number;lean:number;head:number;gaze:number;emotion:'curious'|'surprised'|'skeptical'|'aha'|'happy';left:Point;right:Point;walk:number};
export function pose(scene:number,t:number):Pose;
