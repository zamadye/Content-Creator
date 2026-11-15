import React from 'react';
import {registerRoot, Composition} from 'remotion';
import {ModularStage, stageMetadata} from './modular-stage';
import modularExample from '../stories/modular-stage.json';
import {ManifestStory, manifestMetadata} from './manifest-story';
import example from '../stories/example.json';
import {FullStoryBlocking} from './full-story';
import {HomeScene} from './home-scene';
import {StoryBlocking} from './story-assembly';
import {OpeningAssembly,OpeningSet} from './opening-scenes';
import {ForestTest} from './forest';
import {PhoneCallTest} from './phone';
import {RideTest} from './ride';
import {SignDryWithVO, SignWetWithVO} from './sign-scene';
import {EntityRigStudy} from './entity-rig';
import {WarungWithVO, WarungFigureWithVO, ThirdLoopAssembly, StandingFigureWithVO, CallWithVO} from './vo-scene';
import {StudioStory, studioMetadata} from './studio/StudioStory.jsx';
import studioJalanPulang from '../stories/studio/jalan-pulang-01.json';
import studioWarungMalam from '../stories/studio/warung-malam.json';
import studioUjiKamera from '../stories/studio/uji-kamera.json';
const Root = () => <>
  <Composition id="ModularStage" component={ModularStage} defaultProps={modularExample} calculateMetadata={stageMetadata} width={1920} height={1080} fps={30} durationInFrames={150} />
  <Composition id="ManifestStory" component={ManifestStory} defaultProps={example} calculateMetadata={manifestMetadata} width={1920} height={1080} fps={30} durationInFrames={270} />
  <Composition id="FullStoryBlocking" component={FullStoryBlocking} width={1920} height={1080} fps={30} durationInFrames={20398} />
  <Composition id="HomeSceneStudy" component={HomeScene} width={1920} height={1080} fps={30} durationInFrames={3000} />
  <Composition id="StoryBlocking" component={StoryBlocking} width={1920} height={1080} fps={30} durationInFrames={16290} />
  <Composition id="OpeningAssembly" component={OpeningAssembly} width={1920} height={1080} fps={30} durationInFrames={3030} />
  <Composition id="WarehouseSet" component={OpeningSet} width={1920} height={1080} fps={30} durationInFrames={1140} />
  <Composition id="TrafficSet" component={OpeningSet} defaultProps={{set:"traffic"}} width={1920} height={1080} fps={30} durationInFrames={900} />
  <Composition id="CallWithVO" component={CallWithVO} width={1920} height={1080} fps={30} durationInFrames={2430} />
  <Composition id="MirrorSceneStudy" component={RideTest} defaultProps={{warungScene:"mirror"}} width={1920} height={1080} fps={30} durationInFrames={300} />
  <Composition id="ShadowSceneStudy" component={RideTest} defaultProps={{warungScene:"shadow"}} width={1920} height={1080} fps={30} durationInFrames={300} />
  <Composition id="ReleaseSceneStudy" component={RideTest} defaultProps={{warungScene:"release"}} width={1920} height={1080} fps={30} durationInFrames={330} />
  <Composition id="BrakeSceneStudy" component={RideTest} defaultProps={{warungScene:"brake"}} width={1920} height={1080} fps={30} durationInFrames={510} />
  <Composition id="CallSceneStudy" component={RideTest} defaultProps={{warungScene:"call"}} width={1920} height={1080} fps={30} durationInFrames={900} />
  <Composition id="StandingFigureWithVO" component={StandingFigureWithVO} width={1920} height={1080} fps={30} durationInFrames={630} />
  <Composition id="SignDryWithVO" component={SignDryWithVO} width={1920} height={1080} fps={30} durationInFrames={540} />
  <Composition id="SignWetWithVO" component={SignWetWithVO} width={1920} height={1080} fps={30} durationInFrames={390} />
  <Composition id="ThirdLoopAssembly" component={ThirdLoopAssembly} width={1920} height={1080} fps={30} durationInFrames={870} />
  <Composition id="EntityRigStudy" component={EntityRigStudy} width={1920} height={1080} fps={30} durationInFrames={120} />
  <Composition id="ForestBlockout" component={ForestTest} width={1920} height={1080} fps={30} durationInFrames={300} />
  <Composition id="RideBlockout" component={RideTest} width={1920} height={1080} fps={30} durationInFrames={300} />
  <Composition id="WarungApproach" component={RideTest} defaultProps={{showWarung: true}} width={1920} height={1080} fps={30} durationInFrames={270} />
  <Composition id="WarungWithVO" component={WarungWithVO} width={1920} height={1080} fps={30} durationInFrames={270} />
  <Composition id="WarungLit" component={RideTest} defaultProps={{warungScene: "lit"}} width={1920} height={1080} fps={30} durationInFrames={180} />
  <Composition id="WarungFigureWithVO" component={WarungFigureWithVO} width={1920} height={1080} fps={30} durationInFrames={300} />
  <Composition id="WarungFigureDetail" component={RideTest} defaultProps={{warungScene: "seated", detailCamera: true}} width={1920} height={1080} fps={30} durationInFrames={180} />
  <Composition id="WarungFigure" component={RideTest} defaultProps={{warungScene: "seated"}} width={1920} height={1080} fps={30} durationInFrames={180} />
  <Composition id="PhoneCallTest" component={PhoneCallTest} width={1920} height={1080} fps={30} durationInFrames={120} />
  <Composition id="StudioJalanPulang" component={StudioStory} defaultProps={{story: studioJalanPulang}} calculateMetadata={studioMetadata} width={1920} height={1080} fps={30} durationInFrames={705} />
  <Composition id="StudioWarungMalam" component={StudioStory} defaultProps={{story: studioWarungMalam}} calculateMetadata={studioMetadata} width={1920} height={1080} fps={30} durationInFrames={450} />
  <Composition id="StudioUjiKamera" component={StudioStory} defaultProps={{story: studioUjiKamera, hud: true}} calculateMetadata={studioMetadata} width={1920} height={1080} fps={30} durationInFrames={540} />
</>;
registerRoot(Root);
