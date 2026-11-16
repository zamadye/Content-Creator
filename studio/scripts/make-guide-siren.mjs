// Synthesized guide cue (not a recorded siren), deterministic PCM at 48 kHz.
import {writeFileSync} from 'node:fs';
const file=process.argv[2];if(!file)throw Error('Output WAV path required');
const rate=48000,count=rate*30,data=Buffer.alloc(44+count*2);
data.write('RIFF',0);data.writeUInt32LE(36+count*2,4);data.write('WAVEfmt ',8);data.writeUInt32LE(16,16);data.writeUInt16LE(1,20);data.writeUInt16LE(1,22);data.writeUInt32LE(rate,24);data.writeUInt32LE(rate*2,28);data.writeUInt16LE(2,32);data.writeUInt16LE(16,34);data.write('data',36);data.writeUInt32LE(count*2,40);
for(let i=0;i<count;i++){const t=i/rate,fade=Math.max(0,Math.min(1,t/2,(30-t)/2));const phase=2*Math.PI*(610*t-21*Math.cos(2*Math.PI*.18*t));data.writeInt16LE(Math.round(32767*.004*fade*Math.sin(phase)),44+i*2)}
writeFileSync(file,data);
