/**
 * Komposisi khas cerita "Jalan Pulang".
 *
 * Semua komposisi manual (di luar jalur `story.json` → `StudioStory`) untuk cerita
 * ini dikumpulkan di sini. Folder cerita lain boleh punya berkas yang sama, atau
 * tidak punya sama sekali — `src/index.jsx` hanya membaca daftar yang diekspor.
 *
 * Bentuk entri: {id, component, durationInFrames, defaultProps?, width?, height?, fps?}
 */
import {ModularStage, stageMetadata} from '../../src/modular-stage';
import {ManifestStory, manifestMetadata} from '../../src/manifest-story';
import {FullStoryBlocking} from '../../src/full-story';
import {HomeScene} from '../../src/home-scene';
import {StoryBlocking} from '../../src/story-assembly';
import {OpeningAssembly, OpeningSet} from '../../src/opening-scenes';
import {ForestTest} from '../../src/forest';
import {PhoneCallTest} from '../../src/phone';
import {RideTest} from '../../src/ride';
import {SignDryWithVO, SignWetWithVO} from '../../src/sign-scene';
import {EntityRigStudy} from '../../src/entity-rig';
import {
  WarungWithVO,
  WarungFigureWithVO,
  ThirdLoopAssembly,
  StandingFigureWithVO,
  CallWithVO,
} from '../../src/vo-scene';
import modularExample from '../studies/modular-stage.json';
import manifestExample from '../studies/example.json';

export default [
  {id: 'ModularStage', component: ModularStage, durationInFrames: 150, defaultProps: modularExample, calculateMetadata: stageMetadata},
  {id: 'ManifestStory', component: ManifestStory, durationInFrames: 270, defaultProps: manifestExample, calculateMetadata: manifestMetadata},
  {id: 'FullStoryBlocking', component: FullStoryBlocking, durationInFrames: 20398},
  {id: 'HomeSceneStudy', component: HomeScene, durationInFrames: 3000},
  {id: 'StoryBlocking', component: StoryBlocking, durationInFrames: 16290},
  {id: 'OpeningAssembly', component: OpeningAssembly, durationInFrames: 3030},
  {id: 'WarehouseSet', component: OpeningSet, durationInFrames: 1140},
  {id: 'TrafficSet', component: OpeningSet, durationInFrames: 900, defaultProps: {set: 'traffic'}},
  {id: 'CallWithVO', component: CallWithVO, durationInFrames: 2430},
  {id: 'MirrorSceneStudy', component: RideTest, durationInFrames: 300, defaultProps: {warungScene: 'mirror'}},
  {id: 'ShadowSceneStudy', component: RideTest, durationInFrames: 300, defaultProps: {warungScene: 'shadow'}},
  {id: 'ReleaseSceneStudy', component: RideTest, durationInFrames: 330, defaultProps: {warungScene: 'release'}},
  {id: 'BrakeSceneStudy', component: RideTest, durationInFrames: 510, defaultProps: {warungScene: 'brake'}},
  {id: 'CallSceneStudy', component: RideTest, durationInFrames: 900, defaultProps: {warungScene: 'call'}},
  {id: 'StandingFigureWithVO', component: StandingFigureWithVO, durationInFrames: 630},
  {id: 'SignDryWithVO', component: SignDryWithVO, durationInFrames: 540},
  {id: 'SignWetWithVO', component: SignWetWithVO, durationInFrames: 390},
  {id: 'ThirdLoopAssembly', component: ThirdLoopAssembly, durationInFrames: 870},
  {id: 'EntityRigStudy', component: EntityRigStudy, durationInFrames: 120},
  {id: 'ForestBlockout', component: ForestTest, durationInFrames: 300},
  {id: 'RideBlockout', component: RideTest, durationInFrames: 300},
  {id: 'WarungApproach', component: RideTest, durationInFrames: 270, defaultProps: {showWarung: true}},
  {id: 'WarungWithVO', component: WarungWithVO, durationInFrames: 270},
  {id: 'WarungLit', component: RideTest, durationInFrames: 180, defaultProps: {warungScene: 'lit'}},
  {id: 'WarungFigureWithVO', component: WarungFigureWithVO, durationInFrames: 300},
  {id: 'WarungFigureDetail', component: RideTest, durationInFrames: 180, defaultProps: {warungScene: 'seated', detailCamera: true}},
  {id: 'WarungFigure', component: RideTest, durationInFrames: 180, defaultProps: {warungScene: 'seated'}},
  {id: 'PhoneCallTest', component: PhoneCallTest, durationInFrames: 120},
];
