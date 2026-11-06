#!/usr/bin/env python3
"""Temporary read-only, range-limited source for the user-approved Drive relay.

Bind to 0.0.0.0 for the platform HTTPS preview. Public endpoints reveal no
media or credentials: only an encrypted envelope and a generic health response.
The media endpoint requires a high-entropy bearer over the platform's HTTPS
proxy, supports bounded byte ranges, and never logs request headers or paths.
Local state is outside the repo and removed after the one-time transfer.
"""
import hmac
import json
import os
import re
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

STATE = Path(os.environ.get('RELAY_STATE_DIR', '/home/user/.cache/ump-relay')).resolve()
PORT = int(os.environ.get('RELAY_PORT', '8765'))
MAX_RANGE = 8 * 1024 * 1024


def local_state():
    data = json.loads((STATE / 'server-config.json').read_text())
    if not re.fullmatch(r'[a-f0-9]{32}', data.get('nonce', '')):
        raise ValueError('BAD_NONCE')
    token = (STATE / 'token').read_text().strip()
    if not re.fullmatch(r'[A-Za-z0-9_-]{48,128}', token):
        raise ValueError('BAD_TOKEN')
    path = Path(data['file_path']).resolve(strict=True)
    allowed = [Path('/home/user/.cache/ump-relay').resolve(), Path('/home/user/Content-Creator/google_drive').resolve()]
    if not path.is_file() or not any(path.is_relative_to(root) for root in allowed):
        raise ValueError('BAD_PATH')
    return data, token, path


class Handler(BaseHTTPRequestHandler):
    server_version = 'DriveRelay/1.0'
    def log_message(self, *args):
        # In particular, never write Authorization or a URI to a log.
        return
    def response(self, status, body=b'', mime='text/plain'):
        self.send_response(status)
        self.send_header('Content-Type', mime)
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store, private')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.end_headers()
        self.wfile.write(body)
    def do_HEAD(self):
        self.send_response(200 if self.path=='/' else 404)
        self.send_header('Content-Length', '0')
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
    def do_GET(self):
        if self.path == '/':
            return self.response(200, b'Temporary transfer server. No public files.')
        try:
            data, token, path = local_state()
            if self.path == '/envelope/' + data['nonce']:
                envelope = STATE / 'envelope.bin'
                if not envelope.is_file():
                    return self.response(404)
                body = envelope.read_bytes()
                if not 300 <= len(body) <= 10000:
                    return self.response(500)
                return self.response(200, body, 'application/octet-stream')
            if self.path != '/media':
                return self.response(404)
            supplied = self.headers.get('Authorization', '')
            if not hmac.compare_digest(supplied, 'Bearer ' + token):
                return self.response(403)
            match = re.fullmatch(r'bytes=(\d+)-(\d+)', self.headers.get('Range', ''))
            if not match:
                return self.response(416)
            start, end = map(int, match.groups())
            size = path.stat().st_size
            if start > end or end >= size or end-start+1 > MAX_RANGE:
                return self.response(416)
            self.send_response(206)
            self.send_header('Content-Type', 'application/octet-stream')
            self.send_header('Content-Length', str(end-start+1))
            self.send_header('Content-Range', f'bytes {start}-{end}/{size}')
            self.send_header('Accept-Ranges', 'bytes')
            self.send_header('Cache-Control', 'no-store, private')
            self.send_header('X-Content-Type-Options', 'nosniff')
            self.end_headers()
            with path.open('rb') as f:
                f.seek(start)
                remaining = end-start+1
                while remaining:
                    buf = f.read(min(262144, remaining))
                    if not buf:
                        break
                    self.wfile.write(buf)
                    remaining -= len(buf)
        except (BrokenPipeError, ConnectionResetError):
            return
        except Exception:
            return self.response(500)


if __name__ == '__main__':
    if not 1024 <= PORT <= 65535:
        raise SystemExit('BAD_PORT')
    ThreadingHTTPServer(('0.0.0.0', PORT), Handler).serve_forever()
