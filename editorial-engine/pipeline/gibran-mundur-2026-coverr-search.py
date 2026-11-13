#!/usr/bin/env python3
"""Read-only Coverr stock search for Gibran Mundur symbolic/institutional shots.
Only sanitized metadata is emitted; no media downloads or publishing.
"""
import importlib.util,json,os,sys
from pathlib import Path
from urllib.error import HTTPError,URLError
from urllib.parse import urlencode
from urllib.request import Request,build_opener
spec=importlib.util.spec_from_file_location('coverr_safe',Path(__file__).parent/'coverr-search-test.py')
safe=importlib.util.module_from_spec(spec);spec.loader.exec_module(safe)
QUERIES=['government building','parliament building','courthouse exterior','government office meeting','empty chair office','blueprint architecture','bridge construction','car mechanic engine','car radiator','city hall exterior','documents paperwork','scales justice']
def search(q,key):
 p=urlencode({'query':q,'page':0,'page_size':20})
 req=Request(safe.API_URL+'?'+p,headers={'x-api-key':key,'Accept':'application/json','User-Agent':'ContentCreator-Gibran-Stock-Search/1.0'})
 try:
  with build_opener(safe.SafeRedirect()).open(req,timeout=30) as r: body=r.read(safe.MAX_RESPONSE_BYTES+1)
  if len(body)>safe.MAX_RESPONSE_BYTES:return {'query':q,'status':'TOO_LARGE'}
  data=json.loads(body); hits=data.get('hits',[]); out=[]
  for h in hits[:20]:
   if not isinstance(h,dict):continue
   item=safe.summarize({'hits':[h],'total':1},q,key)
   if item.get('status')=='PASS':
    v=item['video']; out.append({k:v.get(k) for k in ('id','title','max_width','max_height','is_premium','is_ai_generated','is_vertical')})
  return {'query':q,'status':'PASS' if out else 'NO_RESULTS','total':safe.number(data.get('total')),'videos':out[:8]}
 except HTTPError as e:return {'query':q,'status':'HTTP_ERROR','code':e.code}
 except (URLError,OSError,TimeoutError):return {'query':q,'status':'NETWORK_ERROR'}
 except Exception:return {'query':q,'status':'INVALID_RESPONSE'}
def main():
 key=os.environ.get('COVERR_API_KEY','')
 if not key:print('::error::MISSING_KEY');sys.exit(2)
 for q in QUERIES:
  obj=search(q,key); raw=json.dumps(obj,separators=(',',':'),ensure_ascii=False)
  # Limit to GitHub annotation byte cap. Keep candidate metadata only.
  while len(raw.encode())>3600 and obj.get('videos'):
   obj['videos'].pop();obj['omitted']=obj.get('omitted',0)+1;raw=json.dumps(obj,separators=(',',':'),ensure_ascii=False)
  print(f'::notice title=gibran-coverr-search {q}::{raw}')
if __name__=='__main__':main()
