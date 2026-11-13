import React from 'react';
import {AbsoluteFill,Audio,Sequence,staticFile} from 'remotion';
import {StoryBlocking} from './story-assembly';
import {RideTest} from './ride';
import {SignScene} from './sign-scene';
import {HomeScene} from './home-scene';

// VO 01 was measured at 543.63425s. Nearest 30 fps frame is 16309;
// any intentional inter-file pause or overlap remains an editorial decision.
export const VO2_START=16309;
const f=t=>Math.round(t*30);
export const FullStoryBlocking=({resolutionScale=1})=><AbsoluteFill>
 <Sequence from={0} durationInFrames={VO2_START}><StoryBlocking resolutionScale={resolutionScale}/></Sequence>
 <Sequence from={VO2_START} durationInFrames={f(23.5)}><RideTest warungScene="aftermath" resolutionScale={resolutionScale}/></Sequence>
 <Sequence from={VO2_START+f(23.5)} durationInFrames={f(32.3)-f(23.5)}><RideTest resolutionScale={resolutionScale}/></Sequence>
 <Sequence from={VO2_START+f(32.3)} durationInFrames={f(40.3)-f(32.3)}><SignScene distance="3 km" resolutionScale={resolutionScale}/></Sequence>
 <Sequence from={VO2_START+f(40.3)} durationInFrames={f(42.3)-f(40.3)}><RideTest resolutionScale={resolutionScale}/></Sequence>
 <Sequence from={VO2_START+f(42.3)}><HomeScene voOffset={42.3} resolutionScale={resolutionScale}/></Sequence>
 <Sequence from={VO2_START}><Audio src={staticFile('vo/VO-Jalan-Pulang_02.mp3')}/></Sequence>
</AbsoluteFill>;
