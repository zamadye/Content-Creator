#!/usr/bin/env python3
import importlib.util,json,unittest
from pathlib import Path
s=importlib.util.spec_from_file_location('search',Path(__file__).with_name('search.py'));m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
class SearchTest(unittest.TestCase):
 def test_allowlisted_metadata_and_redaction(self):
  key='supersecretkey';h={'id':'A123','title':'Glass studio','description':'A bright glass workshop','duration':12,'max_width':3840,'max_height':2160,'is_premium':False,'is_ai_generated':False,'is_vertical':False,'tags':['glass','https://private/token','supersecretkey'],'urls':{'mp4_download':'https://storage.coverr.co/x?token=secret'}}
  result=m.summarize({'hits':[h],'total':1},'glassblowing',key);raw=json.dumps(result)
  self.assertEqual(result['status'],'PASS');self.assertEqual(result['videos'][0]['id'],'A123');self.assertNotIn(key,raw);self.assertNotIn('https://',raw);self.assertNotIn('mp4_download',raw)
 def test_missing_or_invalid_input(self):
  self.assertEqual(m.search('not in list','key')['status'],'INVALID_QUERY')
  self.assertEqual(m.search('glassware','')['status'],'MISSING_KEY')
  self.assertEqual(m.summarize({'hits':[]},'glassblowing','x')['status'],'NO_RESULTS')
 def test_query_budget(self):self.assertLess(len(m.QUERIES),15)
 def test_annotation_is_valid_bounded_json_and_names_omissions(self):
  videos=[{'id':str(i),'title':'T'*200,'description':'ü'*200,'is_premium':False,'is_ai_generated':False,'is_vertical':False,'max_width':1920,'max_height':1080} for i in range(20)]
  value=m.annotation({'query':'glass','status':'PASS','total_hits':99,'videos':videos})
  result=json.loads(value)
  self.assertLessEqual(len(value.encode('utf8')),3700)
  self.assertEqual(len(result['videos'])+result['omitted_from_annotation'],20)
  self.assertGreater(result['omitted_from_annotation'],0)
if __name__=='__main__':unittest.main()
