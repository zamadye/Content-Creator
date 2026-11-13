import React from 'react';
import {AbsoluteFill,Audio,Sequence,staticFile} from 'remotion';
import {OpeningSet} from './opening-scenes';
import {RideTest} from './ride';
import {SignScene} from './sign-scene';
import {PhoneClockInsert} from './phone-insert';
import {storyShots,validateShots} from './story-timeline';

const Shot=({shot,resolutionScale})=>{
 switch(shot){
  case 'ride': return <RideTest resolutionScale={resolutionScale}/>;
  case 'warehouse': return <OpeningSet set="warehouse" resolutionScale={resolutionScale}/>;
  case 'traffic': return <OpeningSet set="traffic" resolutionScale={resolutionScale}/>;
  case 'sign-dry': return <SignScene resolutionScale={resolutionScale}/>;
  case 'sign-wet': return <SignScene wet resolutionScale={resolutionScale}/>;
  case 'phone-clock': return <PhoneClockInsert resolutionScale={resolutionScale}/>;
  case 'warung-approach': return <RideTest showWarung resolutionScale={resolutionScale}/>;
  case 'warung-lit': return <RideTest warungScene="lit" resolutionScale={resolutionScale}/>;
  case 'entity-seated': return <RideTest warungScene="seated" resolutionScale={resolutionScale}/>;
  case 'entity-detail': return <RideTest warungScene="seated" detailCamera resolutionScale={resolutionScale}/>;
  case 'entity-standing': return <RideTest warungScene="standing" resolutionScale={resolutionScale}/>;
  default: throw new Error(`Unknown shot: ${shot}`);
 }
};
// One continuous narration track prevents drift or duplicate playback at cuts.
// No silent filler is used for unbuilt story portions beyond 05:39.
export const StoryBlocking=({resolutionScale=1})=>{
 validateShots();
 return <AbsoluteFill>
  {storyShots.map((s,i)=><Sequence key={i} from={s.from*30} durationInFrames={(s.to-s.from)*30}><Shot shot={s.shot} resolutionScale={resolutionScale}/></Sequence>)}
  <Audio src={staticFile('vo/VO-Jalan-Pulang_01.mp3')}/>
 </AbsoluteFill>;
};
