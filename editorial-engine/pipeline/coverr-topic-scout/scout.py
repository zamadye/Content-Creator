#!/usr/bin/env python3
"""User-requested read-only stock discovery for prospective story topics.

Coverr key stays in Actions; print allowlisted metadata, never signed URLs or
raw HTTP bodies. No downloads, publishing, scheduling, or API retry on denial.
"""
import importlib.util,json,os,sys
from pathlib import Path

s=importlib.util.spec_from_file_location('coverr_rupert',Path(__file__).parents[1]/'coverr-rupert'/'search.py')
coverr=importlib.util.module_from_spec(s);s.loader.exec_module(coverr)
# Fourth pass tests a grounded everyday engineering story: continuously
# welded railway track, counterposed with traditional jointed rail.
QUERIES=['railway track','train tracks','train','train rail','rail welding','railway worker','railroad','track maintenance']
coverr.QUERIES=QUERIES
coverr.PAGE_SIZE=20

def emit(obj):
 # Full, sanitized metadata goes to the Actions log; compact valid JSON goes to
 # a check-run annotation with a count of items omitted due to the byte cap.
 full=json.dumps(obj,ensure_ascii=True,separators=(',',':'))
 print('COVERR_TOPIC_SCOUT='+full)
 if os.environ.get('GITHUB_ACTIONS')=='true':
  notice=coverr.annotation(obj).replace('%','%25').replace('\r','%0D').replace('\n','%0A')
  print('::notice title=Coverr topic scout::'+notice)

def main():
 key=os.environ.get('COVERR_API_KEY','').strip();failed=0
 for query in QUERIES:
  result=coverr.search(query,key);emit(result)
  if result['status'] not in ('PASS','NO_RESULTS'):
   failed+=1
   if result.get('http_status') in (401,403,429) or result['status']=='MISSING_KEY':break
 return 1 if failed else 0
if __name__=='__main__':sys.exit(main())
