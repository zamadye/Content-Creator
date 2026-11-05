#!/usr/bin/env python3
"""One read-only Coverr stock-footage search for GitHub Actions.

Only sanitized metadata is printed. No signed media URLs, HTTP bodies or
secrets are logged or written to files. A search is not a download test.
"""
from __future__ import annotations

import json
import math
import os
import re
import sys
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlparse
from urllib.request import HTTPRedirectHandler, Request, build_opener

API_HOST = "api.coverr.co"
API_URL = f"https://{API_HOST}/videos"
MAX_RESPONSE_BYTES = 2_000_000


class SafeRedirect(HTTPRedirectHandler):
    """Never forward x-api-key to another origin or downgrade to HTTP."""

    def redirect_request(self, req: Any, fp: Any, code: int, msg: str, headers: Any, newurl: str) -> Any:
        target = urlparse(newurl)
        if target.scheme != "https" or target.hostname != API_HOST or target.port not in (None, 443):
            raise URLError("cross-origin redirect blocked")
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def clean_text(value: Any, key: str = "", limit: int = 160) -> str | None:
    if not isinstance(value, str):
        return None
    text = " ".join(value.split())
    if key:
        text = text.replace(key, "[redacted]")
    text = text[:limit]
    # Signed URLs can contain tokens bound to the API key; never report them.
    if re.search(r"https?://|(?:token|api[_-]?key)\s*[=:]", text, re.I):
        return None
    return text or None


def public_id(value: Any, key: str = "") -> str | None:
    if not isinstance(value, str) or (key and key in value):
        return None
    return value if re.fullmatch(r"[A-Za-z0-9_-]{1,100}", value) else None


def number(value: Any) -> float | int | None:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return None
    if not math.isfinite(value) or value < 0:
        return None
    return value


def creator_name(hit: dict[str, Any], key: str) -> str | None:
    for field in ("creator", "author", "user", "photographer"):
        value = hit.get(field)
        if isinstance(value, dict):
            value = value.get("name") or value.get("display_name")
        name = clean_text(value, key, 100)
        if name:
            return name
    return None


def summarize(data: Any, query: str, key: str) -> dict[str, Any]:
    """Return a strict allowlist; do not propagate API JSON or media URLs."""
    base: dict[str, Any] = {"query": query, "http_status": 200}
    if not isinstance(data, dict) or not isinstance(data.get("hits"), list):
        return {**base, "status": "INVALID_RESPONSE"}
    hits = data["hits"]
    base["returned_hits"] = len(hits)
    base["total_hits"] = number(data.get("total"))
    if not hits:
        return {**base, "status": "NO_RESULTS"}
    hit = hits[0]
    if not isinstance(hit, dict):
        return {**base, "status": "INVALID_RESPONSE"}
    video_id, title = public_id(hit.get("id"), key), clean_text(hit.get("title"), key)
    if not video_id or not title:
        return {**base, "status": "INVALID_RESPONSE"}
    result = {
        "id": video_id,
        "title": title,
        "duration_seconds": number(hit.get("duration")),
        "aspect_ratio": clean_text(hit.get("aspect_ratio"), key, 20),
        "max_width": number(hit.get("max_width")),
        "max_height": number(hit.get("max_height")),
        "is_vertical": hit.get("is_vertical") if isinstance(hit.get("is_vertical"), bool) else None,
        "is_ai_generated": hit.get("is_ai_generated") if isinstance(hit.get("is_ai_generated"), bool) else None,
        "is_premium": hit.get("is_premium") if isinstance(hit.get("is_premium"), bool) else None,
        "creator": creator_name(hit, key),
    }
    return {**base, "status": "PASS", "video": result}


def search(query: str, key: str) -> dict[str, Any]:
    # Keep all potentially untrusted strings, including query and key, out of
    # URLs in output. Only one paginated result is requested.
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9 -]{0,79}", query):
        return {"status": "INVALID_QUERY"}
    if not key:
        return {"status": "MISSING_SECRET", "query": query}
    params = urlencode({"query": query, "page": 0, "page_size": 1, "filter": "is_ai_generated:false"})
    req = Request(API_URL + "?" + params, headers={"x-api-key": key, "Accept": "application/json", "User-Agent": "ContentCreator-Coverr-Test/1.0"})
    try:
        opener = build_opener(SafeRedirect())
        with opener.open(req, timeout=25) as resp:
            code = resp.getcode()
            body = resp.read(MAX_RESPONSE_BYTES + 1)
        if code != 200:
            return {"status": "HTTP_ERROR", "http_status": code, "query": query}
        if len(body) > MAX_RESPONSE_BYTES:
            return {"status": "RESPONSE_TOO_LARGE", "http_status": code, "query": query}
        try:
            data = json.loads(body)
        except (ValueError, UnicodeDecodeError):
            return {"status": "INVALID_JSON", "http_status": code, "query": query}
        return summarize(data, query, key)
    except HTTPError as exc:
        return {"status": "HTTP_ERROR", "http_status": exc.code, "query": query}
    except (URLError, OSError, TimeoutError) as exc:
        # Do not include exception messages: they can contain signed URLs.
        return {"status": "NETWORK_ERROR", "kind": type(exc).__name__, "query": query}


def emit(result: dict[str, Any]) -> None:
    payload = json.dumps(result, ensure_ascii=True, separators=(",", ":"))
    print("COVERR_TEST_RESULT=" + payload)
    if os.environ.get("GITHUB_ACTIONS") == "true":
        # Notices are queryable using the GitHub Checks API even when runner
        # log downloads are unavailable. Escape workflow-command delimiters.
        escaped = payload.replace("%", "%25").replace("\r", "%0D").replace("\n", "%0A")
        print("::notice title=Coverr one-footage test::" + escaped)


def main() -> int:
    query = os.environ.get("COVERR_SEARCH_QUERY", "worker").strip()
    key = os.environ.get("COVERR_API_KEY", "").strip()
    result = search(query, key)
    emit(result)
    return 0 if result["status"] == "PASS" else 1


if __name__ == "__main__":
    sys.exit(main())
