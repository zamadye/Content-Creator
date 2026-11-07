import {strict as assert} from 'node:assert';
import {test} from 'node:test';
import {solveArm,wristWorld,risingDroplet} from './rig-math.mjs';
import {pose} from './poses.mjs';
const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
test('two-bone IK preserves both segment lengths and reaches feasible target',()=>{
 for(const bend of [-1,1])for(const target of [[230,200],[250,300],[0,420],[-100,320]]){
  const s=[92,292],r=solveArm(s,target,140,135,bend);
  assert.ok(Math.abs(dist(s,r.elbow)-140)<.001);assert.ok(Math.abs(dist(r.elbow,r.wrist)-135)<.001);
  if(!r.clamped)assert.ok(dist(r.wrist,target)<.001);
 }
});
test('unreachable target is clamped to avoid exploding limbs',()=>{
 const r=solveArm([0,0],[1000,0]);assert.equal(r.clamped,true);assert.ok(dist([0,0],r.wrist)<275);
});
test('nine authored scenes have finite joint poses and changed gestures',()=>{
 const emotions=new Set();let moved=0;
 for(let i=0;i<9;i++){
  const a=pose(i,.2),b=pose(i,3.5);emotions.add(a.emotion);emotions.add(b.emotion);
  for(const v of [a,b]){assert.ok([v.x,v.y,v.scale,v.lean,v.head,...v.left,...v.right].every(Number.isFinite));assert.ok(v.scale>0);}
  if(dist(a.right,b.right)>10||Math.abs(a.x-b.x)>10||Math.abs(a.lean-b.lean)>5)moved++;
 }
 assert.ok(emotions.size>=4);assert.ok(moved>=5);
});


test('wrist locator matches the rendered group transform on both sides',()=>{
 for(let i=0;i<9;i++)for(const t of [0,1,3,7])for(const side of ['left','right']){
  const p=pose(i,t),shoulder=side==='right'?[92,292]:[-92,292];
  const [x,y]=solveArm(shoulder,p[side],140,135,side==='right'?1:-1).wrist;
  const angle=p.lean*Math.PI/180,expected=[p.x+p.scale*(Math.cos(angle)*x-Math.sin(angle)*(y-450)),p.y+p.scale*(Math.sin(angle)*x+Math.cos(angle)*(y-450)+450)];
  assert.ok(dist(wristWorld(p,side),expected)<1e-8);
 }
});


test('model droplets visibly rise while in a loop segment',()=>{
 for(let i=0;i<9;i++){
  const t=(1-i*.137)/.18+0.7; // safely inside a cycle
  const first=risingDroplet(t,i),second=risingDroplet(t+0.5,i);
  assert.ok(first.opacity>0 && second.opacity>0);
  assert.ok(second.y<first.y);
 }
});
