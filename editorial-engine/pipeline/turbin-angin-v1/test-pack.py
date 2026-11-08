#!/usr/bin/env python3
"""Synthetic archive verification tests; no media or Drive access."""
from __future__ import annotations
import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
import zipfile

spec = importlib.util.spec_from_file_location('checkpoint', Path(__file__).with_name('pack-checkpoint.py'))
assert spec and spec.loader
checkpoint = importlib.util.module_from_spec(spec)
spec.loader.exec_module(checkpoint)


def fake(path: Path, name='notes.txt', actual=b'approved', expected=b'approved'):
    manifest = {'files': {name: {'size': len(expected), 'sha256': hashlib.sha256(expected).hexdigest()}}}
    with zipfile.ZipFile(path, 'w') as z:
        z.writestr(name, actual)
        z.writestr('MANIFEST.json', json.dumps(manifest))


class CheckpointTests(unittest.TestCase):
    def test_verified_archive(self):
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / 'a.zip'; fake(p); checkpoint.verify(p)

    def test_tampered_member_fails(self):
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / 'a.zip'; fake(p, actual=b'changed')
            with self.assertRaisesRegex(ValueError, 'integrity mismatch'): checkpoint.verify(p)

    def test_traversal_member_fails(self):
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / 'a.zip'; fake(p, name='../escape.txt')
            with self.assertRaisesRegex(ValueError, 'Unsafe archive member'): checkpoint.verify(p)

    def test_missing_manifest_or_extra_entry_fails(self):
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / 'a.zip'
            with zipfile.ZipFile(p, 'w') as z: z.writestr('notes.txt', b'text')
            with self.assertRaises(ValueError): checkpoint.verify(p)
            fake(p)
            with zipfile.ZipFile(p, 'a') as z: z.writestr('extra', b'text')
            with self.assertRaisesRegex(ValueError, 'list mismatch'): checkpoint.verify(p)


if __name__ == '__main__': unittest.main()
