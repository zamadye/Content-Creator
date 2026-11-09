import test from 'node:test';
import assert from 'node:assert/strict';
import {BatchError, TIKTOK_AI_CAPTION_NOTICE, buildPayload, checkReadback, runBatch,
  validateBatch, validateQueue} from '../buffer-batch/core.mjs';
import {validateProbe} from '../buffer-batch/buffer-adapter.mjs';

const NOW = Date.parse('2026-11-09T12:00:00Z');
const DUE = '2026-11-10T07:30:00+07:00';
function fixture() {
  const video = (id) => ({id, storyId:'story1',url:'https://res.cloudinary.com/demo/video.mp4',
    sha256:'a'.repeat(64),sizeBytes:10000,publicCopyApproved:true,aiAssisted:true,
    qa:{facts:'PASS',rights:'PASS',technical:'PASS',human:'PASS'},
    disclosure:{facebook:'optional',youtube:'optional',tiktok:'caption'}});
  return {schemaVersion:1,nonce:'b'.repeat(32),action:'schedule',
    authorization:{scheduleApproved:true,simultaneousStoryApproved:true,tiktokCaptionDisclosureApproved:true},
    videos:[video('master'),video('short')],
    posts:[
      {id:'fb',videoId:'short',platform:'facebook',channelId:'fb1',dueAt:DUE,text:'Cerita fiksi di Facebook.'},
      {id:'yt',videoId:'master',platform:'youtube',channelId:'yt1',dueAt:DUE,text:'Cerita fiksi di YouTube.',title:'Tangga masih licin'},
      {id:'tt',videoId:'master',platform:'tiktok',channelId:'tt1',dueAt:DUE,text:`Cerita fiksi di TikTok. ${TIKTOK_AI_CAPTION_NOTICE} #Cerita`},
    ],
    exceptions:[{type:'simultaneous-single-story',storyId:'story1',postIds:['fb','yt','tt']}],
  };
}
function fakeIo({failCreate=0, interfere=false}={}) {
  const events=[], made=new Map(); let calls=0,queueReads=0;
  return {events,get calls(){return calls;},
    async listChannels(){events.push('channels');return [{id:'fb1',service:'facebook'},{id:'yt1',service:'youtube'},{id:'tt1',service:'tiktok'}];},
    async listPosts(){
      events.push('queue');queueReads++;
      if(interfere && queueReads>=3)return [{id:'unrelated',channelId:'other',status:'scheduled',dueAt:'2026-11-10T07:00:00+07:00',text:'other'}];
      return [...made.entries()].map(([id,p])=>({id,channelId:p.channelId,status:'scheduled',dueAt:p.dueAt,text:p.text}));
    },
    async verifyMedia(v){events.push('media:'+v.id);},
    async dryRun(p){events.push('dry:'+p.channelId);},
    async createPost(p){calls++;events.push('create:'+p.channelId);if(calls===failCreate)throw Error('ambiguous');const id='new'+calls;made.set(id,p);return id;},
    async getPost(id){
      events.push('read:'+id);const p=made.get(id);
      return {id,status:'scheduled',channelId:p.channelId,dueAt:p.dueAt,text:p.text,
        schedulingType:'automatic',shareMode:'customScheduled',isCustomScheduled:true,
        metadata:{title:p.metadata.youtube?.title,isAiGenerated:false},assets:[{type:'video',source:'https://source.example/video'}]};
    },
  };
}

test('exactly the approved three-platform same-story exception is accepted',()=>{
  assert.equal(validateBatch(fixture(),NOW).size,2);
  const noException=fixture();delete noException.exceptions;
  assert.throws(()=>validateBatch(noException,NOW),/BATCH_GAP_CONFLICT/);
});

test('exception cannot be generalized to unrelated, extra, shifted, or unapproved posts',()=>{
  const variants=[
    [b=>b.authorization.simultaneousStoryApproved=false,/TIMING_EXCEPTION_NOT_AUTHORIZED/],
    [b=>b.exceptions[0].type='ignore-gap',/BAD_TIMING_EXCEPTION/],
    [b=>b.exceptions[0].postIds=['fb','yt','fb'],/BAD_EXCEPTION_POSTS/],
    [b=>b.exceptions[0].postIds=['fb','yt','other'],/EXCEPTION_SCOPE_MISMATCH/],
    [b=>b.posts.push({...b.posts[2],id:'extra',channelId:'other'}),/EXCEPTION_SCOPE_MISMATCH/],
    [b=>b.posts[2].dueAt='2026-11-10T07:31:00+07:00',/EXCEPTION_TIME_MISMATCH/],
    [b=>b.videos[1].storyId='different',/EXCEPTION_STORY_MISMATCH/],
    [b=>{b.posts[2].platform='facebook';b.posts[2].videoId='short';},/UNUSED_VIDEO|EXCEPTION_PLATFORM_MISMATCH/],
    [b=>b.posts[2].channelId='fb1',/EXCEPTION_CHANNELS_NOT_UNIQUE/],
    [b=>b.exceptions.push({type:'anything'}),/TIMING_EXCEPTION_NOT_AUTHORIZED/],
  ];
  for(const [mutate,error] of variants){const b=fixture();mutate(b);assert.throws(()=>validateBatch(b,NOW),error);}
});

test('existing posts retain the two-hour protection even with an exception',()=>{
  const posts=fixture().posts;
  assert.throws(()=>validateQueue(posts,[{id:'other',channelId:'other',status:'scheduled',dueAt:DUE,text:'other'}]),/EXISTING_GAP_CONFLICT/);
  assert.throws(()=>validateQueue(posts,[{id:'other',status:'sent',sentAt:'2026-11-10T05:30:01+07:00'}]),/EXISTING_GAP_CONFLICT/);
  validateQueue(posts,[{id:'other',status:'sent',sentAt:'2026-11-10T05:30:00+07:00'}]);
});

test('TikTok AI caption disclosure and platform limits cannot be silently skipped',()=>{
  for(const modify of [
    b=>delete b.authorization.tiktokCaptionDisclosureApproved,
    b=>b.videos[0].disclosure.tiktok='optional',
    b=>b.posts[2].text='Caption without the actual disclosure',
  ]) {const b=fixture();modify(b);assert.throws(()=>validateBatch(b,NOW),/TIKTOK_DISCLOSURE_NOT_APPROVED/);}
  const many=fixture();many.posts[2].text+=' #one #two #three #four #five';
  assert.throws(()=>validateBatch(many,NOW),/TIKTOK_TOO_MANY_HASHTAGS/);
  const long=fixture();long.posts[2].text+='a'.repeat(2201);assert.throws(()=>validateBatch(long,NOW),/BAD_CAPTION/);
});

test('TikTok payload declares AI assistance and uses an approved caption, not a false denial',()=>{
  const b=fixture(),p=buildPayload(b.posts[2],b.videos[0]);
  assert.equal(p.aiAssisted,true);assert.equal(p.schedulingType,'automatic');assert.equal(p.mode,'customScheduled');
  assert.equal(p.dueAt,'2026-11-10T00:30:00.000Z');assert.equal(p.metadata.tiktok.isAiGenerated,false);
  assert.ok(p.text.includes(TIKTOK_AI_CAPTION_NOTICE));assert.equal(p.assets[0].video.url,b.videos[0].url);
});

test('readback must prove automatic custom scheduling and requested toggle',()=>{
  const b=fixture(),p=b.posts[2];
  const actual={id:'p1',status:'scheduled',channelId:p.channelId,dueAt:'2026-11-10T00:30:00Z',text:p.text,
    schedulingType:'automatic',shareMode:'customScheduled',isCustomScheduled:true,
    metadata:{isAiGenerated:false},assets:[{type:'video',source:'https://source.example/clip'}]};
  assert.equal(checkReadback(p,actual,'p1'),true);
  assert.throws(()=>checkReadback(p,{...actual,schedulingType:'notification'},'p1'),/READBACK_NOT_AUTOMATIC/);
  assert.throws(()=>checkReadback(p,{...actual,isCustomScheduled:false},'p1'),/READBACK_NOT_CUSTOM_SCHEDULED/);
  assert.throws(()=>checkReadback(p,{...actual,metadata:{isAiGenerated:true}},'p1'),/READBACK_AI_TOGGLE_MISMATCH/);
  assert.throws(()=>checkReadback(p,{...actual,assets:[]},'p1'),/READBACK_VIDEO_MISSING/);
});

test('mocked batch verifies all three, with all preflights before first create',async()=>{
  const io=fakeIo(),report={};await runBatch(fixture(),io,{now:NOW,report});
  assert.equal(io.calls,3);assert.equal(report.status,'SUBMITTED');
  assert.deepEqual(report.posts.map(p=>p.outcome),['SCHEDULED_VERIFIED','SCHEDULED_VERIFIED','SCHEDULED_VERIFIED']);
  assert.ok(io.events.indexOf('dry:tt1')<io.events.indexOf('create:fb1'));
});

test('an unrelated post appearing mid-batch stops remaining creates',async()=>{
  const io=fakeIo({interfere:true}),report={};
  await assert.rejects(runBatch(fixture(),io,{now:NOW,report}),/EXISTING_GAP_CONFLICT/);
  assert.equal(io.calls,1);assert.equal(report.status,'PARTIAL_OR_UNCERTAIN');
  assert.deepEqual(report.posts.map(p=>p.outcome),['SCHEDULED_VERIFIED','NOT_ATTEMPTED','NOT_ATTEMPTED']);
});

test('a timeout on create never retries or continues to another platform',async()=>{
  const io=fakeIo({failCreate:2}),report={};
  await assert.rejects(runBatch(fixture(),io,{now:NOW,report}),/CREATE_UNCERTAIN_RECONCILE/);
  assert.equal(io.calls,2);assert.equal(report.status,'PARTIAL_OR_UNCERTAIN');
  assert.deepEqual(report.posts.map(p=>p.outcome),['SCHEDULED_VERIFIED','CREATE_UNCERTAIN','NOT_ATTEMPTED']);
});

test('TikTok media duration bound and existing full-HD safety gate',()=>{
  const info={streams:[{codec_type:'video',width:1080,height:1920},{codec_type:'audio'}],format:{duration:'600'}};
  assert.equal(validateProbe(info,['tiktok']).duration,600);
  assert.throws(()=>validateProbe({...info,format:{duration:'600.1'}},['tiktok']),/TIKTOK_VIDEO_TOO_LONG/);
  assert.throws(()=>validateProbe({...info,streams:[{codec_type:'video',width:720,height:1280},{codec_type:'audio'}]},['tiktok']),/BAD_VERTICAL_VIDEO_SIZE/);
});
