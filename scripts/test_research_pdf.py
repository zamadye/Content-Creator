#!/usr/bin/env python3
"""Offline component tests for the research PDF renderer."""
import importlib.util
from pathlib import Path
import tempfile
import unittest

from markdown_it.token import Token
from pypdf import PdfReader
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate

PATH = Path(__file__).with_name("render-research-pdf.py")
spec = importlib.util.spec_from_file_location("research_pdf", PATH)
renderer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(renderer)


class ResearchPdfTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        renderer.register_fonts()

    def test_arrow_normalized_and_unsafe_link_rejected(self):
        text = Token("text", "", 0)
        text.content = "A → B & C"
        self.assertEqual(renderer.inline([text]), "A › B &amp; C")
        link = Token("link_open", "a", 1)
        link.attrSet("href", "javascript:alert(1)")
        with self.assertRaises(ValueError):
            renderer.inline([link])

    def test_pdf_preserves_text_and_clickable_link(self):
        md = "# Judul\n\n> Ringkasan\n\n## Langkah\n\n1. A → B\n2. [Sumber](https://example.org/r?x=1&y=2)\n\n**Akurat** dan `objek`."
        with tempfile.TemporaryDirectory() as td:
            p = Path(td) / "test.pdf"
            doc = SimpleDocTemplate(str(p), pagesize=A4, leftMargin=48, rightMargin=48,
                                    topMargin=49, bottomMargin=53)
            doc.build(renderer.render_markdown(md), onFirstPage=renderer.paint_page,
                      onLaterPages=renderer.paint_page)
            pdf = PdfReader(str(p))
            content = " ".join(page.extract_text() for page in pdf.pages)
            self.assertIn("Judul", content)
            self.assertIn("Ringkasan", content)
            self.assertIn("A › B", content)
            self.assertIn("Akurat", content)
            uris = []
            for page in pdf.pages:
                for ref in page.get("/Annots", []):
                    action = ref.get_object().get("/A")
                    if action and action.get("/URI"):
                        uris.append(str(action["/URI"]))
            self.assertIn("https://example.org/r?x=1&y=2", uris)


if __name__ == "__main__":
    unittest.main()
