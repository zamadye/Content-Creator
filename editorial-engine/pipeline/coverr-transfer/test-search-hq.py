#!/usr/bin/env python3
"""Offline security and response-shape tests; no credentials or network."""
import importlib.util
import json
import unittest
from pathlib import Path
from unittest.mock import patch
from urllib.error import HTTPError

spec = importlib.util.spec_from_file_location('hq', Path(__file__).with_name('search-hq.py'))
hq = importlib.util.module_from_spec(spec)
spec.loader.exec_module(hq)

class Response:
    def __enter__(self): return self
    def __exit__(self, *args): return False
    def getcode(self): return 200
    def read(self, n):
        return json.dumps({'hits': [
            {'id':'abc','title':'Worker in store','is_premium':False,
             'is_vertical':False,'is_ai_generated':False,'max_width':1920,'max_height':1080,
             'creator':{'name':'Creator'},'urls':{'mp4':'https://example.invalid/?token=NOLOG'}},
            {'id':'../unsafe','title':'bad'},
        ]}).encode()

class SearchTests(unittest.TestCase):
    def test_allowlist_and_key_in_header_only(self):
        with patch.object(hq, 'build_opener') as opener:
            opener.return_value.open.return_value = Response()
            result = hq.search('factory worker', 'DUMMY_SECRET')
            req = opener.return_value.open.call_args.args[0]
            self.assertEqual(req.headers['X-api-key'], 'DUMMY_SECRET')
            self.assertNotIn('DUMMY_SECRET', req.full_url)
        self.assertEqual(result['status'], 'PASS')
        self.assertEqual(len(result['videos']), 1)
        text = json.dumps(result)
        for secret in ('DUMMY_SECRET','NOLOG','https://'):
            self.assertNotIn(secret, text)

    def test_invalid_query_no_key_or_network(self):
        with patch.object(hq, 'build_opener') as opener:
            self.assertEqual(hq.search('anything\n::error::', 'key')['status'], 'INVALID_QUERY')
            self.assertEqual(hq.search('factory worker', '')['status'], 'MISSING_SECRET')
            opener.assert_not_called()

    def test_http_error_no_url_or_body(self):
        with patch.object(hq, 'build_opener') as opener:
            opener.return_value.open.side_effect = HTTPError('https://unsafe/?token=SECRET', 429, 'bad', {}, None)
            result = hq.search('factory worker', 'secret')
        self.assertEqual((result['status'], result['http_status']), ('HTTP_ERROR', 429))
        self.assertNotIn('unsafe', json.dumps(result))

    def test_invalid_shapes(self):
        self.assertEqual(hq.summarize_batch({}, 'factory worker', 'x')['status'], 'INVALID_RESPONSE')
        self.assertEqual(hq.summarize_batch({'hits':[]}, 'factory worker', 'x')['status'], 'NO_RESULTS')

if __name__ == '__main__':
    unittest.main(verbosity=2)
