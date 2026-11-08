#!/usr/bin/env python3
"""Render the nonsecret research Markdown to a compact, linked PDF.

This intentionally implements only the Markdown constructs used by the report:
headings, paragraphs, block quotes, ordered/unordered lists and inline links,
emphasis, and code. Unsupported blocks fail instead of silently disappearing.
No analytics, credentials, media downloads, or network calls are involved.
"""
from __future__ import annotations

import argparse
from functools import partial
from pathlib import Path
from xml.sax.saxutils import escape, quoteattr

from markdown_it import MarkdownIt
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer

ROOT = Path(__file__).resolve().parents[1]
FONT_DIR = ROOT / "editorial-engine" / "assets" / "fonts"


def register_fonts() -> None:
    paths = {
        "Archivo": "archivo-latin-400-normal.ttf",
        "ArchivoBold": "archivo-latin-700-normal.ttf",
        "ArchivoMedium": "archivo-latin-500-normal.ttf",
        "Instrument": "instrument-serif-latin-400-normal.ttf",
    }
    for name, filename in paths.items():
        pdfmetrics.registerFont(TTFont(name, str(FONT_DIR / filename)))
    # An italic Archivo file is not supplied; use the same regular face rather
    # than silently bringing in an untracked or unlicensed font family.
    pdfmetrics.registerFontFamily(
        "Archivo", normal="Archivo", bold="ArchivoBold",
        italic="Archivo", boldItalic="ArchivoBold",
    )


def inline(children) -> str:
    parts: list[str] = []
    for token in children or []:
        typ = token.type
        if typ == "text":
            # The bundled Latin font lacks U+2192; use a supported chevron so
            # causal sequences stay readable rather than rendering as boxes.
            parts.append(escape(token.content.replace("→", "›")))
        elif typ in {"softbreak", "hardbreak"}:
            parts.append("<br/>" if typ == "hardbreak" else " ")
        elif typ == "strong_open":
            parts.append("<b>")
        elif typ == "strong_close":
            parts.append("</b>")
        elif typ == "em_open":
            parts.append("<i>")
        elif typ == "em_close":
            parts.append("</i>")
        elif typ == "code_inline":
            # Apply the same arrow fallback inside inline code as plain text;
            # the supplied Latin font has no U+2192 glyph.
            parts.append('<font name="ArchivoMedium" color="#17647a">' +
                         escape(token.content.replace("→", "›")) + "</font>")
        elif typ == "link_open":
            target = token.attrGet("href") or ""
            if not target.startswith(("https://", "http://", "mailto:")):
                raise ValueError(f"Unsupported or unsafe link: {target!r}")
            parts.append(f'<link href={quoteattr(target)} color="#087b91">')
        elif typ == "link_close":
            parts.append("</link>")
        else:
            raise ValueError(f"Unsupported inline token: {typ}")
    return "".join(parts)


def make_styles() -> dict[str, ParagraphStyle]:
    base = dict(fontName="Archivo", fontSize=10.15, leading=15.2,
                textColor=colors.HexColor("#193044"), alignment=TA_LEFT,
                splitLongWords=1, allowWidows=0, allowOrphans=0)
    body = ParagraphStyle("Body", **base, spaceAfter=7.2)
    return {
        "body": body,
        "title": ParagraphStyle("Title", parent=body, fontName="Instrument", fontSize=30,
                                leading=33, textColor=colors.HexColor("#102b40"),
                                spaceBefore=9, spaceAfter=11, keepWithNext=1),
        "h2": ParagraphStyle("H2", parent=body, fontName="Instrument", fontSize=19,
                             leading=22, textColor=colors.HexColor("#102b40"),
                             spaceBefore=14, spaceAfter=7, keepWithNext=1),
        "h3": ParagraphStyle("H3", parent=body, fontName="ArchivoBold", fontSize=11.4,
                             leading=15, textColor=colors.HexColor("#13667a"),
                             spaceBefore=9, spaceAfter=5, keepWithNext=1),
        "list": ParagraphStyle("List", parent=body, leftIndent=20, firstLineIndent=0,
                               bulletIndent=3, bulletFontName="ArchivoBold", bulletFontSize=9,
                               spaceAfter=5),
        "quote": ParagraphStyle("Quote", parent=body, fontName="ArchivoMedium",
                                textColor=colors.HexColor("#123c4e"),
                                backColor=colors.HexColor("#e8f4f4"),
                                borderColor=colors.HexColor("#95cdd1"), borderWidth=0.6,
                                borderPadding=(10, 12, 10, 12), spaceBefore=5, spaceAfter=13),
    }


def render_markdown(text: str):
    tokens = MarkdownIt("commonmark", {"html": False}).parse(text)
    styles = make_styles()
    story = []
    current = None
    lists: list[dict] = []
    list_bullet = None
    quote_depth = 0
    for token in tokens:
        typ = token.type
        if typ == "heading_open":
            current = "title" if token.tag == "h1" else ("h2" if token.tag == "h2" else "h3")
        elif typ == "heading_close":
            current = None
        elif typ == "paragraph_open":
            current = "quote" if quote_depth else ("list" if lists else "body")
        elif typ == "paragraph_close":
            current = None
            list_bullet = None
        elif typ == "inline":
            if not current:
                raise ValueError("Inline text outside a supported block")
            kwargs = {"bulletText": list_bullet} if current == "list" and list_bullet else {}
            story.append(Paragraph(inline(token.children), styles[current], **kwargs))
        elif typ == "blockquote_open":
            quote_depth += 1
        elif typ == "blockquote_close":
            quote_depth -= 1
        elif typ in {"bullet_list_open", "ordered_list_open"}:
            start = int(token.attrGet("start") or "1")
            lists.append({"kind": typ, "next": start})
        elif typ in {"bullet_list_close", "ordered_list_close"}:
            lists.pop()
        elif typ == "list_item_open":
            if not lists:
                raise ValueError("List item outside a list")
            ctx = lists[-1]
            list_bullet = "•" if ctx["kind"] == "bullet_list_open" else f'{ctx["next"]}.'
            ctx["next"] += 1
        elif typ == "list_item_close":
            list_bullet = None
        else:
            raise ValueError(f"Unsupported block token: {typ}")
    if lists or quote_depth:
        raise ValueError("Unbalanced document")
    story.append(Spacer(1, 4))
    return story


def paint_page(canvas, doc, footer: str = "RISET RETENSI  ·  7 NOVEMBER 2026") -> None:
    width, height = A4
    canvas.saveState()
    canvas.setFillColor(colors.HexColor("#102b40"))
    canvas.rect(0, height - 7, width, 7, stroke=0, fill=1)
    canvas.setFillColor(colors.HexColor("#138f9a"))
    canvas.rect(0, height - 7, 118, 7, stroke=0, fill=1)
    canvas.setFont("ArchivoBold", 8)
    canvas.setFillColor(colors.HexColor("#176779"))
    canvas.drawString(48, height - 35, "KNOT THEORY  /  DUNIA KEBALIK")
    canvas.setStrokeColor(colors.HexColor("#d4e2e5"))
    canvas.line(48, 40, width - 48, 40)
    canvas.setFont("Archivo", 8)
    canvas.setFillColor(colors.HexColor("#627783"))
    canvas.drawString(48, 27, footer)
    canvas.drawRightString(width - 48, 27, f"{doc.page}")
    canvas.restoreState()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path, help="UTF-8 Markdown file")
    parser.add_argument("output", type=Path, help="PDF output path")
    parser.add_argument("--footer", default="RISET RETENSI  ·  7 NOVEMBER 2026",
                        help="Text printed in the page footer")
    parser.add_argument("--title", default="Retensi dan Pertumbuhan Shorts — Knot Theory",
                        help="PDF document title metadata")
    parser.add_argument("--subject", default="Riset berbasis sumber dan rencana pengujian retensi",
                        help="PDF document subject metadata")
    args = parser.parse_args()
    if args.output.suffix.lower() != ".pdf":
        parser.error("output must end in .pdf")
    register_fonts()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(str(args.output), pagesize=A4, leftMargin=48, rightMargin=48,
                            topMargin=49, bottomMargin=53,
                            title=args.title,
                            author="Knot Theory — Riset Dunia Kebalik",
                            subject=args.subject)
    story = render_markdown(args.input.read_text(encoding="utf-8"))
    page_painter = partial(paint_page, footer=args.footer)
    doc.build(story, onFirstPage=page_painter, onLaterPages=page_painter)
    print(f"Wrote {args.output}")


if __name__ == "__main__":
    main()
