#!/usr/bin/env python3
"""Regression tests for Unicode glyph lookup and rendered-string extraction."""
import importlib.util, unittest
from pathlib import Path

spec=importlib.util.spec_from_file_location('glyphs',Path(__file__).with_name('check-glyphs.py'))
glyphs=importlib.util.module_from_spec(spec);spec.loader.exec_module(glyphs)
FONT=glyphs.ENGINE/'assets/fonts/archivo-latin-700-normal.ttf'

class GlyphTests(unittest.TestCase):
 def test_known_supported_and_unsupported_characters(self):
  self.assertEqual(glyphs.missing(FONT,'KONTROL DAYA · BUKAN BERHENTI'),[])
  self.assertIn('≠',glyphs.missing(FONT,'KONTROL DAYA ≠ BERHENTI'))
  self.assertIn(chr(0x10ffff),glyphs.missing(FONT,'A'+chr(0x10ffff)))
 def test_extraction_covers_title_tag_direct_text_and_narration(self):
  hand,body=glyphs.source_text('<Title a="ANGIN" b="DIAM?" tag="SKEMA"/><Tag text="KONTEKS"/><Txt hand>HEAD</Txt><Txt>isi · teks</Txt>','narasi.')
  self.assertIn('ANGIN',hand);self.assertIn('HEAD',hand)
  for text in ('SKEMA','KONTEKS','isi · teks','narasi.'):self.assertIn(text,body)

if __name__=='__main__':unittest.main()
