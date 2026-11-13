// Approximate VO timestamps in seconds. All entries cover [from,to), no gaps.
// These are a rough blocking edit, not a claim that the narrated action is done.
export const storyShots=[
 {from:0,to:11,shot:'ride'},
 {from:11,to:49,shot:'warehouse'},
 {from:49,to:71,shot:'ride'},
 {from:71,to:101,shot:'traffic'},
 {from:101,to:127,shot:'ride'},
 {from:127,to:145,shot:'sign-dry'},
 {from:145,to:153,shot:'ride'},
 {from:153,to:162,shot:'warung-approach'},
 {from:162,to:167,shot:'ride'},
 {from:167,to:175,shot:'ride'},
 {from:175,to:182,shot:'sign-dry'},
 {from:182,to:198,shot:'ride'},
 {from:198,to:208,shot:'warung-approach'},
 {from:208,to:215,shot:'sign-dry'},
 {from:215,to:221,shot:'phone-clock'},
 {from:221,to:227,shot:'ride'},
 {from:227,to:240,shot:'warung-lit'},
 {from:240,to:251,shot:'entity-seated'},
 {from:251,to:256,shot:'entity-detail'},
 {from:256,to:267,shot:'ride'},
 {from:267,to:280,shot:'sign-wet'},
 {from:280,to:287,shot:'warung-lit'},
 {from:287,to:295,shot:'entity-detail'},
 {from:295,to:305,shot:'entity-reveal'},
 {from:305,to:318,shot:'ride'},
 {from:318,to:345,shot:'entity-standing'},
 {from:345,to:362,shot:'brake'},
 {from:362,to:443,shot:'call'},
 {from:443,to:455,shot:'mirror'},
 {from:455,to:474,shot:'shadow'},
 {from:474,to:488,shot:'call'},
 {from:488,to:498,shot:'shadow'},
 {from:498,to:532,shot:'call'},
 {from:532,to:543,shot:'release'},
];
export function validateShots(shots=storyShots){
 if(!shots.length || shots[0].from!==0) throw Error('Timeline must start at 0');
 for(let i=0;i<shots.length;i++){
  if(!Number.isInteger(shots[i].from)||!Number.isInteger(shots[i].to)||shots[i].to<=shots[i].from)throw Error(`Invalid duration at shot ${i}`);
  if(i && shots[i-1].to!==shots[i].from)throw Error(`Gap or overlap at shot ${i}`);
 }
 return shots[shots.length-1].to;
}
