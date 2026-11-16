import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {RideTest} from './ride';
// Timestamp in source transcript (seconds), not yet checked by listening.
// A wrapper keeps scene-local time independent of the source audio offset.
export const WarungWithVO = () => <AbsoluteFill>
  <RideTest showWarung={true}/>
  <Audio src={staticFile('vo/VO-Jalan-Pulang_01.mp3')} startFrom={145*30} />
</AbsoluteFill>;

// Seated figure at approximately 04:00–04:10 of the first narration file.
export const WarungFigureWithVO = () => {
  const frame=useCurrentFrame();
  return <AbsoluteFill>
    <RideTest warungScene="seated" detailCamera={frame>=165}/>
    <Audio src={staticFile('vo/VO-Jalan-Pulang_01.mp3')} startFrom={240*30} />
  </AbsoluteFill>;
};

// Work-in-progress assembly, 03:47–04:16 of VO 01. The scene-local
// sequences retain the original animation and keep narration continuous.
export const ThirdLoopAssembly = () => {
  const frame = useCurrentFrame();
  return <AbsoluteFill>
    <Sequence from={0} durationInFrames={13*30}><RideTest warungScene="lit"/></Sequence>
    <Sequence from={13*30} durationInFrames={16*30}><RideTest warungScene="seated" detailCamera={frame >= 18.5*30}/></Sequence>
    <Audio src={staticFile('vo/VO-Jalan-Pulang_01.mp3')} startFrom={227*30}/>
  </AbsoluteFill>;
};

// Fifth loop: 05:18–05:39. Standing and wave are WIP animation.
export const StandingFigureWithVO = () => <AbsoluteFill>
  <RideTest warungScene="standing"/>
  <Audio src={staticFile('vo/VO-Jalan-Pulang_01.mp3')} startFrom={318*30}/>
</AbsoluteFill>;

// Phone conversation blocking, 06:02–07:23. Visual performance and VO
// alignment are still unverified; phone and character interactions need QC.
export const CallWithVO = () => {
 const frame=useCurrentFrame();
 return <AbsoluteFill><RideTest warungScene="call" detailCamera={frame>=21*30}/><Audio src={staticFile('vo/VO-Jalan-Pulang_01.mp3')} startFrom={362*30}/></AbsoluteFill>;
};
