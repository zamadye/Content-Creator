#!/usr/bin/env python3
import importlib.util,json,unittest
from pathlib import Path
s=importlib.util.spec_from_file_location('scout',Path(__file__).with_name('scout.py'));m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
class ScoutTests(unittest.TestCase):
 def test_query_budget_and_allowlist(self):
  self.assertLessEqual(len(m.QUERIES),10)
  self.assertEqual(len(set(m.QUERIES)),len(m.QUERIES))
  self.assertEqual(m.coverr.search('not allowed','test-key')['status'],'INVALID_QUERY')
  self.assertEqual(m.coverr.search('railway track','')['status'],'MISSING_KEY')
 def test_only_safe_metadata_and_bounded_notice(self):
  key='TEST_KEY';hits=[]
  for i in range(20):
   hits.append({'id':str(i),'title':'Ship '+str(i),'description':'A ship in a port','max_width':1920,'max_height':1080,'is_premium':False,'is_vertical':False,'is_ai_generated':False,'urls':{'mp4_download':'https://secret.example/x?token='+key}})
  result=m.coverr.summarize({'hits':hits,'total':200},'cargo ship',key)
  self.assertEqual(len(result['videos']),20)
  for text in (json.dumps(result),m.coverr.annotation(result)):
   self.assertNotIn(key,text);self.assertNotIn('http',text);self.assertNotIn('mp4_download',text)
  notice=m.coverr.annotation(result)
  self.assertLessEqual(len(notice.encode('utf8')),3700)
  parsed=json.loads(notice);self.assertEqual(len(parsed['videos'])+parsed['omitted_from_annotation'],20)
if __name__=='__main__':unittest.main()
