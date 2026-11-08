/**
 * Guard for later voice/video generation. A structural check or the creator's
 * own audit is not human approval. The user/editor must actually review the
 * exact files and provide a recorded decision; do not fabricate this record.
 */
import crypto from 'node:crypto';
export const sha256=b=>crypto.createHash('sha256').update(b).digest('hex');
const meaningful=s=>typeof s==='string'&&s.trim().length>=4&&!/^(todo|tbd|unknown|pending|belum|none|n\/a)$/i.test(s.trim());
export function checkHumanReview(approval,scriptBytes,auditBytes,planBytes){
 const issues=[];
 if(!Buffer.isBuffer(scriptBytes)||!Buffer.isBuffer(auditBytes)||!Buffer.isBuffer(planBytes))return {allowed:false,issues:['Exact script, audit and shot-plan bytes are required.']};
 if(!approval||typeof approval!=='object')return {allowed:false,issues:['Human script and storyboard review is NOT TESTED.']};
 if(approval.decision!=='PASS')issues.push('Human decision is not PASS.');
 if(!meaningful(approval.reviewerRole)||!meaningful(approval.reviewMethod)||!meaningful(approval.evidence))issues.push('Reviewer role, method and actual evidence must be recorded.');
 const dateText=approval.reviewedAt||'',stamp=Date.parse(`${dateText}T00:00:00Z`);
 if(!/^\d{4}-\d{2}-\d{2}$/.test(dateText)||!Number.isFinite(stamp)||new Date(stamp).toISOString().slice(0,10)!==dateText)issues.push('A valid review date is required.');
 if(approval.scriptSha256!==sha256(scriptBytes))issues.push('Script changed after review.');
 if(approval.auditSha256!==sha256(auditBytes))issues.push('Audit changed after review.');
 if(approval.planSha256!==sha256(planBytes))issues.push('Shot plan changed after review.');
 if(!Array.isArray(approval.scope)||!['script','sentence-audit','storyboard','factual-scope'].every(x=>approval.scope.includes(x)))issues.push('Review must cover script, sentence audit, storyboard and factual scope.');
 return {allowed:issues.length===0,issues};
}
