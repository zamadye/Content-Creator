#!/usr/bin/env python3
"""API-only stock search for the user-approved UMP high-resolution revision.

Search is read-only. Emit an allowlist of public, sanitized metadata only:
never log API keys, signed URLs, raw response bodies, or network error strings.
Actual source resolution and rights must be verified after selection/download.
"""
import importlib.util
import json
import os
import sys
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, build_opener

spec = importlib.util.spec_from_file_location('safe_coverr', Path(__file__).parent.parent / 'coverr-search-test.py')
safe = importlib.util.module_from_spec(spec)
spec.loader.exec_module(safe)

QUERY_GROUPS = [
    ['sewing', 'factory', 'workers', 'warehouse', 'assembly line', 'garment', 'industrial', 'seamstress'],
    ['market', 'supermarket', 'shopping', 'food stall', 'store owner', 'restaurant', 'cooking', 'vegetables'],
    ['budget', 'salary', 'document', 'contract', 'office meeting', 'motorcycle', 'freelance', 'payroll'],
]
QUERIES = [q for group in QUERY_GROUPS for q in group]
PAGE_SIZE = 8


def summarize_batch(data, query, key):
    if not isinstance(data, dict) or not isinstance(data.get('hits'), list):
        return {'query': query, 'status': 'INVALID_RESPONSE'}
    videos = []
    for hit in data['hits'][:PAGE_SIZE]:
        if not isinstance(hit, dict):
            continue
        r = safe.summarize({'hits': [hit], 'total': 1}, query, key)
        if r.get('status') == 'PASS':
            videos.append(r['video'])
    return {'query': query, 'status': 'PASS' if videos else 'NO_RESULTS', 'videos': videos}


def search(query, key):
    if not key:
        return {'query': query, 'status': 'MISSING_SECRET'}
    if query not in QUERIES:
        return {'status': 'INVALID_QUERY'}
    params = urlencode({'query': query, 'page': 0, 'page_size': PAGE_SIZE, 'filter': 'is_ai_generated:false'})
    request = Request(safe.API_URL + '?' + params, headers={
        'x-api-key': key, 'Accept': 'application/json',
        'User-Agent': 'ContentCreator-Coverr-HQ-Search/1.0',
    })
    try:
        with build_opener(safe.SafeRedirect()).open(request, timeout=30) as response:
            status = response.getcode()
            body = response.read(safe.MAX_RESPONSE_BYTES + 1)
        if status != 200:
            return {'query': query, 'status': 'HTTP_ERROR', 'http_status': status}
        if len(body) > safe.MAX_RESPONSE_BYTES:
            return {'query': query, 'status': 'RESPONSE_TOO_LARGE'}
        try:
            data = json.loads(body)
        except (ValueError, UnicodeDecodeError):
            return {'query': query, 'status': 'INVALID_JSON'}
        return summarize_batch(data, query, key)
    except HTTPError as exc:
        return {'query': query, 'status': 'HTTP_ERROR', 'http_status': exc.code}
    except (URLError, OSError, TimeoutError) as exc:
        return {'query': query, 'status': 'NETWORK_ERROR', 'kind': type(exc).__name__}


def emit(result):
    payload = json.dumps(result, ensure_ascii=True, separators=(',', ':'))
    print('COVERR_HQ_SEARCH=' + payload)
    if os.environ.get('GITHUB_ACTIONS') == 'true':
        # Each query fits the check-annotation limit. Never include raw JSON.
        escaped = payload.replace('%', '%25').replace('\r', '%0D').replace('\n', '%0A')
        print('::notice title=Coverr HQ search::' + escaped)


def main():
    key = os.environ.get('COVERR_API_KEY', '').strip()
    group = os.environ.get('COVERR_QUERY_GROUP', '')
    if group not in ('0', '1', '2'):
        emit({'status': 'INVALID_QUERY_GROUP'})
        return 1
    failures = 0
    for query in QUERY_GROUPS[int(group)]:
        result = search(query, key)
        emit(result)
        if result['status'] not in ('PASS', 'NO_RESULTS'):
            failures += 1
            if result.get('http_status') in (401, 403, 429) or result['status'] == 'MISSING_SECRET':
                break
    return 1 if failures else 0


if __name__ == '__main__':
    sys.exit(main())
