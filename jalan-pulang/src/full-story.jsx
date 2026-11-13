import React from 'react';
import {AbsoluteFill,Audio,Sequence,staticFile} from 'remotion';
import {StoryBlocking} from './story-assembly';
import {RideTest} from './ride';
import {SignScene} from './sign-scene';
import {HomeScene} from './home-scene';
import {ENDING_SHOTS,endingFrame} from './ending-timeline';

// VO 01 was measured at 543.63425s. Nearest 30 fps frame is 16309;
// any intentional inter-file pause or overlap remains an editorial decision.
export const VO2_START=16309;
export const FullStoryBlocking=({resolutionScale=1})=><AbsoluteFill>
 <Sequence from={0} durationInFrames={VO2_START}><StoryBlocking resolutionScale={resolutionScale}/></Sequence>
 {ENDING_SHOTS.map(shot=>{
  let scene;
  if(shot.id==='aftermath')scene=<RideTest warungScene="aftermath" resolutionScale={resolutionScale}/>;
  else if(shot.id==='ride-away')scene=<RideTest resolutionScale={resolutionScale}/>;
  else if(shot.id==='three-kilometres')scene=<SignScene distance="3 km" resolutionScale={resolutionScale}/>;
  else if(shot.id==='village')scene=<RideTest village resolutionScale={resolutionScale}/>;
  else if(shot.id==='home')scene=<HomeScene voOffset={shot.start} resolutionScale={resolutionScale}/>;
  else throw new Error(`Unknown ending shot: ${shot.id}`);
  return <Sequence key={shot.id} from={VO2_START+endingFrame(shot.start)} durationInFrames={endingFrame(shot.end)-endingFrame(shot.start)}>{scene}</Sequence>;
 })}
 <Sequence from={VO2_START}><Audio src={staticFile('vo/VO-Jalan-Pulang_02.mp3')}/></Sequence>
</AbsoluteFill>;
