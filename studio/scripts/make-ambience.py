#!/usr/bin/env python3
"""Deterministic temporary sound design for the first 300 seconds.

No samples or external libraries beyond numpy. This is a procedural guide mix,
not a replacement for recorded Foley, acting or a final mastering pass.
Outputs 48 kHz stereo PCM; audio cues use transcript seconds, not verified VO.
"""
import argparse
import math
import wave
import numpy as np

parser = argparse.ArgumentParser()
parser.add_argument('out')
parser.add_argument('--duration', type=int, default=300)
args = parser.parse_args()
rate = 48000
rng = np.random.default_rng(2112)

# Envelope in seconds. Smooth transitions avoid clicks at cut points.
def window(t, start, end, fade=1.0):
    return np.minimum(np.minimum(np.clip((t-start)/fade, 0, 1),
                                 np.clip((end-t)/fade, 0, 1)), 1)

with wave.open(args.out, 'wb') as out:
    out.setnchannels(2)
    out.setsampwidth(2)
    out.setframerate(rate)
    last = 0.0
    for second in range(args.duration):
        t = second + np.arange(rate, dtype=np.float64)/rate
        white = rng.standard_normal(rate)
        # One-pole low-pass with state maintained across each one-second block.
        # FFT convolution is unnecessary; averaging adjacent samples suppresses
        # shrill digital hiss while retaining continuous ambient texture.
        noise = (white + np.concatenate(([last], white[:-1]))) * 0.5
        last = white[-1]
        outdoors = (window(t,0,11) + window(t,49,300))
        indoors = window(t,11,49)
        base = noise*(outdoors*.0015 + indoors*.0007)
        # Distinct timbres, intentionally restrained below narration level.
        engine_env = (window(t,0,11) + window(t,49,71) + window(t,101,300))
        engine = (np.sin(2*np.pi*46*t + 1.5*np.sin(2*np.pi*.12*t)) +
                  .38*np.sin(2*np.pi*92*t)) * .0025 * engine_env
        room = np.sin(2*np.pi*50*t)*.0012*indoors
        # Two emergency tones and alternating intensity: 01:11–01:41.
        siren_env = window(t,71,101,2)
        siren_phase = 2*np.pi*(610*t - 21*np.cos(2*np.pi*.18*t))
        siren = np.sin(siren_phase)*.0022*siren_env
        # Faint electrical hum after warung light appears.
        lamp = np.sin(2*np.pi*100*t)*.0007*window(t,227,300,2)
        # One quiet, sustained humming note only where explicitly narrated.
        hum = np.sin(2*np.pi*174.6*t)*.0008*window(t,256,267,2)
        mono = base+engine+room+siren+lamp+hum
        # Stereo variation is subtle; VO is mixed separately in the next step.
        left = np.clip(mono, -1, 1)
        right = np.clip(mono*.93 + noise*.00012, -1, 1)
        samples = np.stack((left,right),axis=-1)
        out.writeframes((samples*32767).astype('<i2').tobytes())
print(f'Wrote {args.duration}s stereo guide ambience to {args.out}')
