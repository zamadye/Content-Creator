#!/usr/bin/env python3
"""Coverr API search for the Kamar Berlangit test, sanitized metadata only.
Never print signed URLs, raw responses, error strings or credentials.
Queries allowlisted per the 2026-11-13 user authorization (visual test with
real footage; narrator rig and subtitle cards stay in the composite).
"""
import importlib.util,json,os,sys
from pathlib import Path
from urllib.error import HTTPError,URLError
from urllib.parse import urlencode
from urllib.request import Request,build_opener
spec=importlib.util.spec_from_file_location('coverr_safe',Path(__file__).parents[1]/'coverr-search-test.py');safe=importlib.util.module_from_spec(spec);spec.loader.exec_module(safe)
QUERIES=['milky way night sky','starry sky','night sky stars timelapse','city night skyline','city light pollution night']
PAGE_SIZE=20

def summarize(data,query,key):
 if not isinstance(data,dict) or not isinstance(data.get('hits'),list):return {'query':query,'status':'INVALID_RESPONSE'}
 out=[]
 for hit in data['hits'][:PAGE_SIZE]:
  if not isinstance(hit,dict):continue
  base=safe.summarize({'hits':[hit],'total':1},query,key)
  if base.get('status')!='PASS':continue
  v=base['video'];v['description']=safe.clean_text(hit.get('description'),key,200)
  tags=hit.get('tags',[])
  v['tags']=[x for raw in (tags[:8] if isinstance(tags,list) else []) if (x:=safe.clean_text(raw,key,50))]
  out.append(v)
 return {'query':query,'status':'PASS' if out else 'NO_RESULTS','total_hits':safe.number(data.get('total')),'videos':out}

def search(query,key):
 if query not in QUERIES:return {'status':'INVALID_QUERY'}
 if not key:return {'query':query,'status':'MISSING_KEY'}
 params=urlencode({'query':query,'page':0,'page_size':PAGE_SIZE,'filter':'is_ai_generated:false'})
 req=Request(safe.API_URL+'?'+params,headers={'x-api-key':key,'Accept':'application/json','User-Agent':'ContentCreator-Kamar-Stock-Search/1.0'})
 try:
  with build_opener(safe.SafeRedirect()).open(req,timeout=30) as res:status=res.getcode();body=res.read(safe.MAX_RESPONSE_BYTES+1)
  if status!=200:return {'query':query,'status':'HTTP_ERROR','http_status':status}
  if len(body)>safe.MAX_RESPONSE_BYTES:return {'query':query,'status':'RESPONSE_TOO_LARGE'}
  try:data=json.loads(body)
  except (ValueError,UnicodeDecodeError):return {'query':query,'status':'INVALID_JSON'}
  return summarize(data,query,key)
 except HTTPError as e:return {'query':query,'status':'HTTP_ERROR','http_status':e.code}
 except (URLError,OSError,TimeoutError) as e:return {'query':query,'status':'NETWORK_ERROR','kind':type(e).__name__}

def annotation(obj):
 # GitHub truncates an individual annotation at 4096 bytes. Publish a compact
 # JSON object and explicitly report omissions instead of emitting invalid JSON.
 result={k:v for k,v in obj.items() if k!='videos'}
 if 'videos' in obj:
  fields=('id','title','description','max_width','max_height','is_premium','is_ai_generated','is_vertical')
  result['videos']=[{k:(v[:90] if k in ('title','description') and isinstance(v,str) else v) for k,v in item.items() if k in fields} for item in obj['videos']]
  result['omitted_from_annotation']=0
  while len(json.dumps(result,ensure_ascii=False,separators=(',',':')).encode('utf8'))>3700 and result['videos']:
   result['videos'].pop();result['omitted_from_annotation']+=1
 return json.dumps(result,ensure_ascii=False,separators=(',',':'))

def main():
 key=os.environ.get('COVERR_API_KEY','')
 if not key:print('::error::MISSING_KEY');sys.exit(2)
 for query in QUERIES:
  res=search(query,key)
  payload=annotation(res)
  print(f'::notice title=kamar-coverr-search {query}::{payload[:3700]}')
  print(json.dumps({'query':res.get('query'),'status':res.get('status'),'videos':len(res.get('videos',[]))}))

if __name__=='__main__':main()
