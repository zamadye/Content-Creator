#!/usr/bin/env python3
"""Offline tests with dummy credentials only; never contacts external services."""
import importlib.util
import json
import os
import tempfile
import threading
import unittest
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

ROOT=Path('/home/user/.cache/ump-relay')
ROOT.mkdir(parents=True,exist_ok=True)
TMP=tempfile.TemporaryDirectory(dir=ROOT)
os.environ['RELAY_STATE_DIR']=TMP.name
spec=importlib.util.spec_from_file_location('relay_server',Path(__file__).with_name('server.py'))
mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)

class ServerTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        p=Path(TMP.name);(p/'token').write_text('A'*64);(p/'test.bin').write_bytes(bytes(range(100)))
        (p/'server-config.json').write_text(json.dumps({'nonce':'a'*32,'file_path':str(p/'test.bin')}))
        (p/'envelope.bin').write_bytes(b'x'*400)
        cls.server=mod.ThreadingHTTPServer(('127.0.0.1',0),mod.Handler)
        cls.thread=threading.Thread(target=cls.server.serve_forever,daemon=True);cls.thread.start()
        cls.url='http://127.0.0.1:'+str(cls.server.server_port)
    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown();cls.server.server_close();cls.thread.join()
    def get(self,path,headers=None):
        return urlopen(Request(self.url+path,headers=headers or {}),timeout=5)
    def test_health_and_encrypted_envelope_only(self):
        with self.get('/') as r:self.assertEqual(r.status,200)
        with self.get('/envelope/'+'a'*32) as r:self.assertEqual(r.read(),b'x'*400)
        with self.assertRaises(HTTPError) as e:self.get('/envelope/'+'b'*32)
        self.assertEqual(e.exception.code,404)
    def test_media_denied_without_correct_bearer(self):
        for headers in [{},{'Authorization':'Bearer wrong','Range':'bytes=0-1'}]:
            with self.assertRaises(HTTPError) as e:self.get('/media',headers)
            self.assertEqual(e.exception.code,403)
    def test_media_range_is_bounded_and_exact(self):
        auth={'Authorization':'Bearer '+'A'*64}
        with self.get('/media',{**auth,'Range':'bytes=10-19'}) as r:
            self.assertEqual(r.status,206);self.assertEqual(r.headers['Content-Range'],'bytes 10-19/100');self.assertEqual(r.read(),bytes(range(10,20)))
        for value in ['bytes=20-200','bytes=-1-2','bytes=7-3','bytes=0-']:
            with self.assertRaises(HTTPError) as e:self.get('/media',{**auth,'Range':value})
            self.assertEqual(e.exception.code,416)

if __name__=='__main__':
    try:unittest.main(verbosity=2)
    finally:TMP.cleanup()
