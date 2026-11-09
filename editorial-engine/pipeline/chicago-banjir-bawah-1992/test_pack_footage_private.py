#!/usr/bin/env python3
"""Private companion list and path-guard tests; no Drive/network operations."""
from pathlib import Path
import tempfile
import unittest
import pack_footage_private as pack


class CompanionTests(unittest.TestCase):
    def test_companions_are_explicit_and_exclude_large_videos(self):
        scratch=pack.ROOT/'.scratch';scratch.mkdir(exist_ok=True)
        with tempfile.TemporaryDirectory(dir=scratch) as temp:
            root=Path(temp)
            for name in pack.COMPANIONS:(root/name).write_text('synthetic')
            (root/'EXTRA_VIDEO.mp4').write_text('not included')
            result=pack.companion_files(root)
            self.assertEqual({p.name for p in result},set(pack.COMPANIONS))
            self.assertFalse(any(p.suffix=='.mp4' for p in result))
            self.assertIn('STORYBOARD_FOOTAGE_DRAF.md',[p.name for p in result])
            (root/pack.COMPANIONS[0]).unlink()
            with self.assertRaises(ValueError):pack.companion_files(root)
    def test_private_directory_required(self):
        with self.assertRaises(ValueError):pack.companion_files(pack.ROOT)
    def test_escaping_symlink_is_rejected(self):
        scratch=pack.ROOT/'.scratch';scratch.mkdir(exist_ok=True)
        with tempfile.TemporaryDirectory(dir=scratch) as temp:
            root=Path(temp)
            for name in pack.COMPANIONS:(root/name).write_text('synthetic')
            target=root/pack.COMPANIONS[0];target.unlink();target.symlink_to(pack.ROOT/'README.md')
            with self.assertRaises(ValueError):pack.companion_files(root)


if __name__=='__main__':unittest.main(verbosity=2)
