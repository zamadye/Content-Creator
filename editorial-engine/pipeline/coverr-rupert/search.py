#!/usr/bin/env python3
"""Coverr API search for the Rupert-glass draft, sanitized metadata only.
Never print signed URLs, raw responses, error strings or credentials.
"""
import importlib.util,json,os,sys
from pathlib import Path
from urllib.error import HTTPError,URLError
from urllib.parse import urlencode
from urllib.request import Request,build_opener
spec=importlib.util.spec_from_file_location('coverr_safe',Path(__file__).parents[1]/'coverr-search-test.py');safe=importlib.util.module_from_spec(spec);spec.loader.exec_module(safe)
QUERIES=['prince rupert','glassblowing','molten glass','glass factory','glass hammer','shattering glass','broken glass','science laboratory','glass production']
PAGE_SIZE=8

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
 req=Request(safe.API_URL+'?'+params,headers={'x-api-key':key,'Accept':'application/json','User-Agent':'ContentCreator-Rupert-Stock-Search/1.0'})
 try:
  with build_opener(safe.SafeRedirect()).open(req,timeout=30) as res:status=res.getcode();body=res.read(safe.MAX_RESPONSE_BYTES+1)
  if status!=200:return {'query':query,'status':'HTTP_ERROR','http_status':status}
  if len(body)>safe.MAX_RESPONSE_BYTES:return {'query':query,'status':'RESPONSE_TOO_LARGE'}
  try:data=json.loads(body)
  except (ValueError,UnicodeDecodeError):return {'query':query,'status':'INVALID_JSON'}
  return summarize(data,query,key)
 except HTTPError as e:return {'query':query,'status':'HTTP_ERROR','http_status':e.code}
 except (URLError,OSError,TimeoutError) as e:return {'query':query,'status':'NETWORK_ERROR','kind':type(e).__name__}

def emit(obj):
 s=json.dumps(obj,ensure_ascii=True,separators=(',',':'));print('COVERR_RUPERT_SEARCH='+s)
 if os.environ.get('GITHUB_ACTIONS')=='true':print('::notice title=Coverr Rupert search::'+s.replace('%','%25').replace('\r','%0D').replace('\n','%0A'))
def main():
 key=os.environ.get('COVERR_API_KEY','').strip();fail=0
 for q in QUERIES:
  result=search(q,key);emit(result)
  if result['status'] not in ('PASS','NO_RESULTS'):
   fail+=1
   if result.get('http_status') in (401,403,429) or result['status']=='MISSING_KEY':break
 return 1 if fail else 0
if __name__=='__main__':sys.exit(main())
