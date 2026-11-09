#!/usr/bin/env python3
"""Mechanical regression tests only; none replace human editorial/rights review."""
from __future__ import annotations
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import unittest

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[2]


def read(name):
    return json.loads((HERE / name).read_text(encoding='utf-8'))


class PsychologyDraftTest(unittest.TestCase):
    def test_regeneration_is_deterministic(self):
        paths = ['brief.json', 'master.script.json', 'master.audit.json',
                 'short.script.json', 'short.audit.json', 'render-meta.json',
                 'naskah-master.md', 'naskah-short.md',
                 'storyboard-master.md', 'storyboard-short.md']
        def hashes():
            return {p: hashlib.sha256((HERE / p).read_bytes()).hexdigest() for p in paths}
        before = hashes()
        subprocess.run([sys.executable, str(HERE / 'author.py')], check=True, capture_output=True)
        self.assertEqual(before, hashes(), 'Generated files are stale relative to author.py')

    def test_every_scene_has_at_least_two_named_actions(self):
        meta = read('render-meta.json')
        for edition in ('master', 'short'):
            script = read(f'{edition}.script.json')
            self.assertEqual([s['id'] for s in script['scenes']], [s['id'] for s in meta[edition]])
            for scene in meta[edition]:
                objects = scene['objectMap']
                self.assertGreaterEqual(len(objects), 2, scene['id'])
                self.assertGreaterEqual(len({o['object'].strip().casefold() for o in objects}), 2, scene['id'])
                for obj in objects:
                    self.assertTrue(obj['object'].strip() and obj['action'].strip(), scene['id'])

    def test_early_disclosure_standalone_context_and_closing(self):
        for edition in ('master', 'short'):
            scenes = read(f'{edition}.script.json')['scenes']
            first_two = ' '.join(s['narration'] for s in scenes[:2]).casefold()
            all_text = ' '.join(s['narration'] for s in scenes).casefold()
            self.assertIn('rani', first_two)
            self.assertIn('ilustrasi', first_two)
            self.assertIn('bukan peserta penelitian', first_two)
            self.assertIn('email kerja', all_text)
            self.assertIn('tidak mendesak', all_text)
            self.assertIn('pesan', all_text)
            self.assertIn('ikuti knot theory', scenes[-1]['narration'])
        short_words = sum(len(s['narration'].split()) for s in read('short.script.json')['scenes'])
        self.assertLessEqual(short_words, 160, 'Word limit is not a substitute for measuring audio duration')

    def test_both_mechanical_coverage_gates_and_master_outline(self):
        engine = REPO / 'editorial-engine/pipeline'
        commands = [
            [engine / 'story-engine/story_gate.py', '--stage', 'outline', '--brief', HERE / 'brief.json',
             '--script', HERE / 'master.script.json', '--review', HERE / 'master.audit.json'],
            *[[engine / 'script-review/audit.py', '--script', HERE / f'{name}.script.json',
               '--review', HERE / f'{name}.audit.json'] for name in ('master', 'short')],
        ]
        for cmd in commands:
            result = subprocess.run([sys.executable, *map(str, cmd)], text=True, capture_output=True, check=True)
            self.assertEqual(json.loads(result.stdout)['mechanical'], 'PASS')


if __name__ == '__main__':
    unittest.main()
