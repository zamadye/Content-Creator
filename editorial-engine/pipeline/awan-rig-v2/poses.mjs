import {ease,lerp} from './rig-math.mjs';
/** Poses are scene-local functions of the one shared global timeline. */
export function pose(scene,t){
 const a=ease(t/1.4),b=ease((t-.6)/2.1),breath=Math.sin(t*2.0);
 const p={x:225,y:850,scale:.82,lean:0,head:0,gaze:1,emotion:'curious',left:[-135,440],right:[265,300],walk:0};
 if(scene===0)return {...p,x:235+24*a,y:830,scale:.87,lean:lerp(-9,5,a)+2*breath,head:-6+7*a,emotion:'surprised',left:[-185,265+18*breath],right:[250,205+40*a],gaze:1};
 if(scene===1)return {...p,x:250+25*a,y:845,scale:.83,lean:4,head:-7,emotion:'skeptical',left:[-130,445],right:[235+20*b,205+35*b],gaze:1};
 if(scene===2)return {...p,x:265,y:870,scale:.78,lean:-3+4*breath,head:4,emotion:'curious',left:[-205,315+12*Math.sin(t*.7)],right:[230+22*b,220+18*b],gaze:1};
 if(scene===3)return {...p,x:260+18*a,y:870,scale:.80,lean:2,head:2,emotion:'surprised',left:[-205,405],right:[235+20*b,300-20*b],gaze:1};
 if(scene===4)return {...p,x:255,y:860,scale:.83,lean:lerp(-4,7,b),head:-4,emotion:b>.6?'aha':'curious',left:[-140,430-10*b],right:[230+25*b,230+55*b],gaze:1};
 if(scene===5)return {...p,x:255,y:850,scale:.88,lean:2*Math.sin(t*.6),head:-3,emotion:'curious',left:[-130,455],right:[230+15*Math.sin(t*.8),250+15*Math.cos(t*.7)],gaze:1};
 if(scene===6)return {...p,x:250,y:870,scale:.82,lean:5,head:3,emotion:'aha',left:[-200,395+8*Math.sin(t*.6)],right:[245+16*b,284-16*b],gaze:1};
 if(scene===7)return {...p,x:245+75*b,y:875,scale:.80,lean:lerp(-3,4,b),head:-4,emotion:'surprised',left:[-130,445],right:[215,200],walk:t>1&&t<3?Math.sin(t*7):0,gaze:1};
 return {...p,x:255,y:840,scale:.86,lean:2*Math.sin(t*.7),head:3,emotion:t>7?'happy':'aha',left:[-165,250+20*Math.sin(t*.9)],right:[250,225+35*Math.sin(t*.5)],gaze:t>7?0:1};
}
