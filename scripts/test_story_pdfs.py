#!/usr/bin/env python3
"""Private PDF builder tests. Not a visual, editorial or audience review."""
import importlib.util
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import unicodedata
import unittest

from markdown_it import MarkdownIt
from pypdf import PdfReader

PATH = Path(__file__).with_name("build-story-pdfs.py")
spec = importlib.util.spec_from_file_location("story_pdfs", PATH)
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)


class StoryPdfTest(unittest.TestCase):
    def test_relative_repo_links_become_absolute_github_links(self):
        source = builder.ROOT / "editorial-engine/docs/SISTEM-CERITA-LONG-FORM.md"
        text = builder.linked_markdown(source)
        self.assertIn("https://github.com/zamadye/Content-Creator/blob/", text)
        self.assertIn("STANDARD-MINIMAL-CONTENT-PRODUCTION.md", text)
        self.assertNotIn("](../../STANDARD-MINIMAL", text)

    def test_unknown_relative_link_and_unsupported_table_fail(self):
        scratch = builder.ROOT / ".scratch"
        scratch.mkdir(exist_ok=True)
        with tempfile.TemporaryDirectory(dir=scratch) as temp:
            source = Path(temp) / "input.md"
            source.write_text("# Test\n\n[hilang](../missing-unknown-document.md)\n", encoding="utf-8")
            with self.assertRaises(ValueError):
                builder.linked_markdown(source)
            source.write_text("# Test\n\n| A | B |\n|---|---|\n| A | B |\n", encoding="utf-8")
            with self.assertRaises(ValueError):
                builder.linked_markdown(source)
            source.write_text("# Test\n\n[bad](javascript:alert)\n", encoding="utf-8")
            with self.assertRaises(ValueError):
                builder.linked_markdown(source)

    def test_builds_four_pdfs_with_text_metadata_and_links(self):
        scratch = builder.ROOT / ".scratch"
        scratch.mkdir(exist_ok=True)
        with tempfile.TemporaryDirectory(dir=scratch) as temp:
            result = subprocess.run([sys.executable, str(PATH), "--output-dir", temp],
                                    capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            def normalize(text):
                return " ".join(unicodedata.normalize("NFKC", text).replace("→", "›").split())
            for source, filename, title, _ in builder.REPORTS:
                pdf = PdfReader(str(Path(temp) / filename))
                self.assertGreaterEqual(len(pdf.pages), 1)
                raw_pages = [page.extract_text() or "" for page in pdf.pages]
                text = " ".join(raw_pages)
                self.assertGreater(len(text), 3000)
                self.assertIn("CERITA PANJANG", text)
                self.assertEqual(pdf.metadata.title, title)
                # Ignore repeated page furniture, including page numbers, to
                # compare every complete Markdown text block across breaks.
                lines = [line for page in raw_pages for line in page.splitlines()
                         if not re.fullmatch(r"(KNOT THEORY\s*/\s*DUNIA KEBALIK|"
                                             r"EDISI CERITA PANJANG\s*·\s*SUMBER AKTIF|\d+)", line.strip())]
                extracted = normalize(" ".join(lines))
                parsed = MarkdownIt("commonmark").parse(builder.linked_markdown(builder.ROOT / source))
                expected_links = set()
                for token in parsed:
                    if token.type != "inline":
                        continue
                    parts = []
                    for child in token.children:
                        if child.type in ("text", "code_inline"):
                            parts.append(child.content)
                        elif child.type in ("softbreak", "hardbreak"):
                            parts.append(" ")
                        elif child.type == "link_open":
                            expected_links.add(child.attrGet("href"))
                    self.assertIn(normalize("".join(parts)), extracted, filename)
                actual_links = set()
                for page in pdf.pages:
                    for ref in page.get("/Annots", []):
                        action = ref.get_object().get("/A", {})
                        if action.get("/URI"):
                            actual_links.add(str(action["/URI"]))
                self.assertTrue(expected_links)
                self.assertTrue(expected_links.issubset(actual_links), expected_links - actual_links)

    def test_output_outside_ignored_private_paths_rejected(self):
        result = subprocess.run([sys.executable, str(PATH), "--output-dir", str(builder.ROOT / "public-pdf-test")],
                                capture_output=True, text=True)
        self.assertEqual(result.returncode, 2)
        self.assertFalse((builder.ROOT / "public-pdf-test").exists())


if __name__ == "__main__":
    unittest.main()
