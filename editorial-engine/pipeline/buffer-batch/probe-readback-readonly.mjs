/* Probe the query shape needed to verify future Buffer posts. Only channel,
 * queue and post reads; never create/edit/delete. Return only field-presence
 * results, not captions, IDs or media URLs. A new TikTok channel with no post
 * has no sample: SKIP_NO_POST is not evidence the create path works. */
import {BatchError} from './core.mjs';

export async function probeReadbackFields(io) {
  const out = {status:'STARTING',services:{}};
  try {
    const channels=await io.listChannels(), posts=await io.listPosts();
    if(!Array.isArray(channels)||!Array.isArray(posts))throw new BatchError('READBACK_PROBE_INPUT_INVALID');
    for(const service of ['facebook','youtube','tiktok']) {
      const candidates=channels.filter(c=>String(c.service??'').toLowerCase()===service);
      if(candidates.length===0){out.services[service]={status:'SKIP_NO_CHANNEL'};continue;}
      const ids=new Set(candidates.map(c=>String(c.id??'')));
      const sample=posts.find(p=>p?.id && ids.has(String(p.channelId??p.channel?.id??'')));
      if(!sample){out.services[service]={status:'SKIP_NO_POST'};continue;}
      const actual=await io.getPost(String(sample.id));
      if(!actual || String(actual.id??'')!==String(sample.id))throw new BatchError('READBACK_PROBE_ID_MISMATCH');
      const present=(key)=>Object.prototype.hasOwnProperty.call(actual,key);
      const flags={schedulingType:present('schedulingType'),shareMode:present('shareMode'),
        isCustomScheduled:typeof actual.isCustomScheduled==='boolean',
        aiToggle:service==='facebook' ? null : typeof actual.metadata?.isAiGenerated==='boolean'};
      if(!flags.schedulingType || !flags.shareMode || !flags.isCustomScheduled || flags.aiToggle===false)
        throw new BatchError('READBACK_PROBE_FIELDS_MISSING');
      out.services[service]={status:'PASS',fields:flags};
    }
    out.status='PASS';
  } catch(err) {
    out.status='FAIL';
    out.error=err instanceof BatchError ? err.code : 'UNEXPECTED_ERROR';
  }
  return out;
}
