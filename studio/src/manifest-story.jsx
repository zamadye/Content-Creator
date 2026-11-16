import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {validateManifest} from './manifest';
import {Shot} from './story-assembly';

export const manifestMetadata = ({props}) => validateManifest(props.story);
export const ManifestStory = ({story, resolutionScale=1}) => {
 validateManifest(story);
 return <AbsoluteFill>
  {story.shots.map((s,i)=><Sequence key={i} from={s.from} durationInFrames={s.duration}>
   <Shot shot={s.type} from={s.from/story.fps} view={s.view} resolutionScale={resolutionScale}/>
  </Sequence>)}
  {(story.audio || []).map((a,i)=><Sequence key={i} from={a.from} durationInFrames={a.duration}><Audio src={staticFile(a.src)}/></Sequence>)}
 </AbsoluteFill>;
};
