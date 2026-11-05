#!/usr/bin/env python3
"""Offline tests with fake HTTP responses; does not call Coverr or read a real key."""
import importlib.util
import io
import json
import os
from pathlib import Path
import unittest
from contextlib import redirect_stdout
from unittest.mock import patch
from urllib.error import HTTPError, URLError

spec = importlib.util.spec_from_file_location("coverr_search_test", Path(__file__).with_name("coverr-search-test.py"))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class Response:
    def __init__(self, obj):
        self.body = obj if isinstance(obj, bytes) else json.dumps(obj).encode()
    def __enter__(self): return self
    def __exit__(self, *args): return False
    def getcode(self): return 200
    def read(self, limit): return self.body[:limit]


class CoverrSearchTests(unittest.TestCase):
    def setUp(self):
        self.key = "test-secret-DO-NOT-LOG"
        self.hit = {
            "id": "sample-123", "title": "A worker at a factory", "duration": 12.5,
            "aspect_ratio": "16:9", "is_vertical": False, "is_ai_generated": False,
            "is_premium": False, "max_width": 1920, "max_height": 1080,
            "creator": {"name": "Example Creator"},
            "urls": {"mp4": "https://storage.coverr.co/abc?token=DO-NOT-LOG"},
            "untrusted": self.key,
        }

    def fake_search(self, payload):
        with patch.object(module, "build_opener") as opener:
            opener.return_value.open.return_value = Response(payload)
            result = module.search("worker", self.key)
            request = opener.return_value.open.call_args.args[0]
            self.assertNotIn(self.key, request.full_url)
            self.assertEqual(request.headers.get("X-api-key"), self.key)
            self.assertIn("page_size=1", request.full_url)
            self.assertIn("is_ai_generated%3Afalse", request.full_url)
            return result

    def test_one_result_is_an_allowlist_not_raw_data(self):
        result = self.fake_search({"total": 123, "hits": [self.hit]})
        output = json.dumps(result)
        self.assertEqual(result["status"], "PASS")
        self.assertEqual(result["video"]["title"], "A worker at a factory")
        self.assertEqual(result["video"]["creator"], "Example Creator")
        self.assertNotIn("storage.coverr.co", output)
        self.assertNotIn("DO-NOT-LOG", output)
        self.assertNotIn("urls", output)

    def test_missing_key_does_not_make_request(self):
        with patch.object(module, "build_opener") as opener:
            self.assertEqual(module.search("worker", "")["status"], "MISSING_SECRET")
            opener.assert_not_called()

    def test_empty_result_and_bad_shape_are_not_pass(self):
        self.assertEqual(self.fake_search({"hits": []})["status"], "NO_RESULTS")
        self.assertEqual(self.fake_search({"videos": []})["status"], "INVALID_RESPONSE")

    def test_unauthorized_and_rate_limit_are_reported_without_body(self):
        for code in (401, 403, 429, 500):
            with patch.object(module, "build_opener") as opener:
                opener.return_value.open.side_effect = HTTPError("https://example.invalid/?token=leak", code, "error", {}, None)
                result = module.search("worker", self.key)
                self.assertEqual((result["status"], result["http_status"]), ("HTTP_ERROR", code))
                self.assertNotIn("token", json.dumps(result))

    def test_invalid_json_and_network_errors_are_safe(self):
        self.assertEqual(self.fake_search(b"not json")["status"], "INVALID_JSON")
        with patch.object(module, "build_opener") as opener:
            opener.return_value.open.side_effect = URLError("https://secret.invalid/?token=leak")
            result = module.search("worker", self.key)
            self.assertEqual(result["status"], "NETWORK_ERROR")
            self.assertNotIn("token", json.dumps(result))

    def test_title_and_creator_never_echo_key_or_signed_url(self):
        self.hit["title"] = "Title " + self.key
        self.hit["creator"] = "https://storage.coverr.co/clip?token=hidden"
        result = self.fake_search({"hits": [self.hit]})
        self.assertEqual(result["video"]["title"], "Title [redacted]")
        self.assertIsNone(result["video"]["creator"])
        self.assertNotIn(self.key, json.dumps(result))

    def test_cross_origin_redirect_is_blocked(self):
        req = module.Request(module.API_URL, headers={"x-api-key": self.key})
        with self.assertRaises(URLError):
            module.SafeRedirect().redirect_request(req, None, 302, "Found", {}, "https://other.example/redirect")
        with self.assertRaises(URLError):
            module.SafeRedirect().redirect_request(req, None, 302, "Found", {}, "http://api.coverr.co/videos")

    def test_invalid_query_and_notice_escaping(self):
        self.assertEqual(module.search("worker\n::error::leak", self.key)["status"], "INVALID_QUERY")
        stdout = io.StringIO()
        with patch.dict(os.environ, {"GITHUB_ACTIONS": "true"}):
            with redirect_stdout(stdout):
                module.emit({"status": "PASS", "title": "10% of workers"})
        self.assertIn("10%25", stdout.getvalue())
        self.assertNotIn(self.key, stdout.getvalue())


if __name__ == "__main__":
    unittest.main(verbosity=2)
