#!/usr/bin/env python3
"""Check rendered text against the actual TTF Unicode cmap; no font fallback.

Covers literal Title/Tag/Txt strings in this episode's TSX plus narration text.
This is not a substitute for watching the video or visual layout checks.
"""
from __future__ import annotations
import json, re, struct, sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[3]
ENGINE=ROOT/'editorial-engine'
PIPE=Path(__file__).resolve().parent

def u16(data:bytes,offset:int)->int:return struct.unpack_from('>H',data,offset)[0]
def i16(data:bytes,offset:int)->int:return struct.unpack_from('>h',data,offset)[0]
def u32(data:bytes,offset:int)->int:return struct.unpack_from('>I',data,offset)[0]

def unicode_subtables(data:bytes)->list[int]:
 """Find Unicode cmap format-4/12 subtables in an SFNT/TTF file."""
 for n in range(u16(data,4)):
  record=12+16*n
  if data[record:record+4]!=b'cmap':continue
  base=u32(data,record+8);count=u16(data,base+2);result=[]
  for j in range(count):
   at=base+4+8*j;platform=u16(data,at);encoding=u16(data,at+2);off=base+u32(data,at+4)
   if (platform==0 or (platform==3 and encoding in (1,10))) and u16(data,off) in (4,12):result.append(off)
  if not result:raise ValueError('Font has no supported Unicode cmap')
  return result
 raise ValueError('Font has no cmap table')

def glyph_id(data:bytes,subtables:list[int],codepoint:int)->int:
 for off in subtables:
  fmt=u16(data,off)
  if fmt==12:
   groups=u32(data,off+12)
   for n in range(groups):
    at=off+16+12*n;start,end,first=struct.unpack_from('>III',data,at)
    if start<=codepoint<=end:
     glyph=first+codepoint-start
     if glyph:return glyph
     break
  elif fmt==4 and codepoint<=0xffff:
   segs=u16(data,off+6)//2;ends=off+14;starts=ends+2*segs+2;deltas=starts+2*segs;ranges=deltas+2*segs
   for n in range(segs):
    start=u16(data,starts+2*n);end=u16(data,ends+2*n)
    if start<=codepoint<=end:
     delta=i16(data,deltas+2*n);distance=u16(data,ranges+2*n)
     if distance==0:glyph=(codepoint+delta)&0xffff
     else:
      addr=ranges+2*n+distance+2*(codepoint-start);glyph=u16(data,addr)
      if glyph:glyph=(glyph+delta)&0xffff
     if glyph:return glyph
     break
 return 0

def missing(font:Path,text:str)->list[str]:
 data=font.read_bytes();tables=unicode_subtables(data)
 return sorted({c for c in text if not c.isspace() and not glyph_id(data,tables,ord(c))})

def source_text(source:str,narration:str)->tuple[str,str]:
 # Title a/b are hand lettering; Title tags and Tag text use Archivo.
 hand=''.join(re.findall(r'\b(?:a|b)="([^"\n]*)"',source))
 body=narration+''.join(re.findall(r'\b(?:tag|text)="([^"\n]*)"',source))
 # Literal direct Txt children are either hand-lettered or Archivo. Dynamic
 # subtitle children are covered through the exact narration string above.
 for attrs,text in re.findall(r'<Txt\b([^>]*)>([^<{]+)</Txt>',source):
  if re.search(r'\bhand\b',attrs):hand+=text
  else:body+=text
 return hand,body

def main():
 script=json.loads((ENGINE/'content/proposals/turbin-angin-draf-v1.json').read_text(encoding='utf8'))
 narration=' '.join(s['narration'] for s in script['scenes'])
 hand,body=source_text((PIPE/'render.tsx').read_text(encoding='utf8'),narration)
 fonts={'Permanent Marker':(ENGINE/'assets/fonts/permanent-marker-latin-400-normal.ttf',hand),
        'Archivo':(ENGINE/'assets/fonts/archivo-latin-700-normal.ttf',body)}
 result={name:missing(font,text) for name,(font,text) in fonts.items()}
 print(json.dumps({'glyph_coverage':'PASS' if not any(result.values()) else 'FAIL',
  'missing':result,'scope':'Literal rendered labels and approved narration characters; not layout or mobile QA'},ensure_ascii=False,indent=2))
 if any(result.values()):raise SystemExit(1)

if __name__=='__main__':
 try:main()
 except (OSError,ValueError,struct.error,KeyError) as exc:
  print(f'Glyph check failed: {exc}',file=sys.stderr);raise SystemExit(2)
