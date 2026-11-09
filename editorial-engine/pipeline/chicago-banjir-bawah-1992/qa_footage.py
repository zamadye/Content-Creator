#!/usr/bin/env python3
"""Offline technical QC for private draft outputs; never an editorial approval."""
from __future__ import annotations
import argparse
import collections
import hashlib
import json
import re
from pathlib import Path
import subprocess
import sys
from PIL import Image
import render_rough as rough
import render_footage as footage


def sha(path, algorithm='sha256'):
    h=hashlib.new(algorithm)
    with path.open('rb') as f:
        for block in iter(lambda:f.read(1024*1024),b''):h.update(block)
    return h.hexdigest()


def call(args):
    p=subprocess.run([str(x) for x in args],capture_output=True,text=True)
    if p.returncode:raise ValueError(f'Command failed ({p.returncode}): {p.stderr[-1500:]}')
    return p


def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--out',type=Path,required=True,help='Private draft output directory')
    ap.add_argument('--ffprobe',type=Path,required=True,help='Locally installed ffprobe executable')
    args=ap.parse_args();out=args.out.resolve()
    if not out.is_relative_to((rough.ROOT/'.scratch').resolve()):raise ValueError('QC input must be private under .scratch.')
    data=json.loads((out/'TIMELINE_FOOTAGE_PERKIRAAN.json').read_text(encoding='utf-8'))
    catalog=footage.read_catalog(); results={}
    if set(data)!={'master','short'}:raise ValueError('Expected complete master and Short timeline.')
    for name,spec in data.items():
        path=out/spec['video']
        if not path.is_file() or not path.resolve().is_relative_to(out):raise ValueError('Missing or unsafe output video.')
        probe=json.loads(call([args.ffprobe,'-v','error','-count_frames','-show_entries',
            'stream=index,codec_name,codec_type,width,height,r_frame_rate,nb_frames,nb_read_frames,duration,channels,sample_rate:format=duration,size',
            '-of','json',path]).stdout)
        streams=probe['streams']; video=[x for x in streams if x['codec_type']=='video'];audio=[x for x in streams if x['codec_type']=='audio']
        if len(streams)!=2 or len(video)!=1 or len(audio)!=1:raise ValueError(f'{name}: expected exactly one video and one audio stream.')
        v=video[0];au=audio[0]
        if (v['codec_name']!='h264' or (v['width'],v['height'])!=(spec['width'],spec['height'])
                or v['r_frame_rate']!='24/1' or int(v['nb_read_frames'])!=spec['frames']
                or au['codec_name']!='aac' or int(au['sample_rate'])!=44100 or au['channels']!=2):
            raise ValueError(f'{name}: codec, resolution, rate, frame count or channels differ from timeline.')
        duration=float(probe['format']['duration'])
        if (abs(duration-spec['durationAudio'])>.1 or
            abs(float(v['duration'])-float(au['duration']))>.1):
            raise ValueError(f'{name}: audio/video duration mismatch.')
        # Decode all streams and measure, not just inspect metadata. The score is
        # synthesized locally; this is not a listening-quality assessment.
        p=call([rough.FF,'-nostats','-xerror','-i',path,'-filter_complex','ebur128=peak=true','-f','null','-'])
        tail=p.stderr.rsplit('Summary:',1)[-1]
        l=re.search(r'\bI:\s*(-?\d+(?:\.\d+)?)\s+LUFS',tail)
        peak=re.search(r'\bPeak:\s*(-?\d+(?:\.\d+)?)\s+dBFS',tail)
        if not l or not peak:raise ValueError(f'{name}: loudness analysis unavailable.')
        scenes=spec['scenes']
        script=json.loads((rough.CONTENT/f'{name}.script.json').read_text(encoding='utf-8'))
        if [s['id'] for s in scenes]!=[s['id'] for s in script['scenes']]:
            raise ValueError(f'{name}: rendered scene order differs from script.')
        ranges={s['id']:(round(s['start']*spec['fps']),round(s['end']*spec['fps'])) for s in scenes}
        shots=spec['shots'];expected=0; seconds=collections.defaultdict(float);seen_scenes=[]
        for shot in shots:
            if shot['startFrame']!=expected or shot['endFrame']<=expected:raise ValueError(f'{name}: shot frames have a gap or overlap.')
            scene=shot['sceneId']
            if scene not in ranges or shot['startFrame']<ranges[scene][0] or shot['endFrame']>ranges[scene][1]:
                raise ValueError(f'{name}: shot falls outside its scene.')
            if not seen_scenes or scene!=seen_scenes[-1]:seen_scenes.append(scene)
            expected=shot['endFrame'];count=shot['endFrame']-shot['startFrame']
            seconds[shot['source']]+=count/spec['fps']
            if len(shot['onScreenDisclosure'])!=2 or not all(shot['onScreenDisclosure']):raise ValueError(f'{name}: missing disclosure.')
            if shot['source']!='still':
                source='water2011' if shot['source']=='hybrid' else shot['source']
                if shot['sourceInSeconds']+count/spec['fps']>catalog['sources'][source]['duration']-.12:
                    raise ValueError(f'{name}: shot exceeds source bounds.')
        if expected!=spec['frames'] or seen_scenes!=[s['id'] for s in scenes]:
            raise ValueError(f'{name}: shots do not cover the video and ordered scenes.')
        srt=(out/f'{name.upper()}_SUBTITLE_PERKIRAAN.srt').read_text(encoding='utf-8')
        cues=spec['cues'];blocks=[x for x in srt.strip().split('\n\n') if x.strip()]
        if len(blocks)!=len(cues):raise ValueError(f'{name}: cue count does not match SRT.')
        previous=0.
        for i,(block,cue) in enumerate(zip(blocks,cues),1):
            rows=block.splitlines()
            if len(rows)<3 or rows[0]!=str(i) or rows[1]!=(rough.srt_clock(cue['start'])+' --> '+rough.srt_clock(cue['end'])) or '\n'.join(rows[2:])!=cue['text']:
                raise ValueError(f'{name}: SRT cue {i} differs from timeline.')
            if cue['start']<previous-1e-6 or cue['end']<=cue['start'] or cue['end']>duration+.1 or len(cue['text'].splitlines())>2:
                raise ValueError(f'{name}: invalid or overlapping subtitle cue {i}.')
            previous=cue['end']
        results[name]={'video':path.name,'bytes':path.stat().st_size,'sha256':sha(path),'md5':sha(path,'md5'),
                       'width':v['width'],'height':v['height'],'fps':'24/1','framesDecoded':int(v['nb_read_frames']),
                       'videoDurationSeconds':duration,'narrationDurationSeconds':spec['durationAudio'],
                       'audioCodec':'aac stereo 44100 Hz','loudnessLUFS':float(l.group(1)),'truePeakDBFS':float(peak.group(1)),
                       'cueCount':len(cues),'shotCount':len(shots),'firstSceneCutSeconds':spec['cutFrame']/spec['fps'],
                       'shotSecondsByKind':{k:round(v,3) for k,v in sorted(seconds.items())},
                       'directSourceSecondsIncludingStockTexture':round(sum(v for k,v in seconds.items() if k not in ('still','hybrid')),3),
                       'nonEventContextFootageSeconds':round(sum(seconds[k] for k in ('chicago1974','metra1992','metrospain2017','river2014')),3),
                       'stockWaterTextureDirectSeconds':round(seconds.get('water2011',0),3),
                       'hybridSeconds':round(seconds.get('hybrid',0),3),
                       'status':'PASS for file/technical checks only; human review NOT TESTED'}
        print(name,'decoded',results[name]['framesDecoded'],'frames; EBU',results[name]['loudnessLUFS'],'LUFS; peak',results[name]['truePeakDBFS'],'dBFS',flush=True)
    image_sizes={'MASTER_THUMBNAIL_DRAF.png':(1280,720),'SHORT_THUMBNAIL_DRAF.png':(1080,1920),'POSTER_4x5_DRAF.png':(1080,1350)}
    for filename,expected in image_sizes.items():
        image=Image.open(out/filename);image.verify();image=Image.open(out/filename)
        if image.size!=expected or image.getbbox() is None:raise ValueError(f'{filename}: invalid image dimensions or empty.')
    report={'technical':'PASS','scope':'Decoded files, frame/stream/timeline/SRT structure, source bounds and image dimensions only.',
            'notTested':['full human playback/listening','manual subtitle alignment','independent factual review','rights and platform disclosure review','audience response','release approval'],
            'outputs':results}
    (out/'QA_FOOTAGE_DATA.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('Technical checks PASS only; editorial, rights, listening and release remain NOT TESTED.',flush=True)


if __name__=='__main__':
    try:main()
    except (ValueError,KeyError,OSError,subprocess.CalledProcessError,json.JSONDecodeError) as e:
        print('ERROR:',e,file=sys.stderr);raise SystemExit(1)
