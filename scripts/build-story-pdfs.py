#!/usr/bin/env python3
"""Build versioned private story PDFs from active Markdown; no network calls.

Relative repository links are rewritten to the session branch's GitHub source
URL so PDFs have usable link annotations. Output is deliberately gitignored.
"""
from __future__ import annotations
import argparse
from pathlib import Path
import re
import subprocess
import sys
import tempfile
from urllib.parse import quote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
BRANCH = "arena/54cb36c6-content-creator"
BASE = f"https://github.com/zamadye/Content-Creator/blob/{BRANCH}/"
LINK = re.compile(r"(?<!!)\[([^\]\n]+)\]\(([^)\s]+)\)")
REPORTS = (
    ("editorial-engine/docs/SISTEM-CERITA-LONG-FORM.md", "01-SISTEM-CERITA-PANJANG.pdf",
     "Sistem Cerita Panjang", "Aturan cerita aktif dan alur potongan pendek"),
    ("RISET-STORYTELLING-DUNIA-KEBALIK.md", "02-RISET-DAN-CONTOH-CERITA.pdf",
     "Riset dan Contoh Cerita", "Riset, batas bukti dan contoh faktual; bukan izin produksi"),
    ("RISET-RETENSI-DAN-PERTUMBUHAN-KNOT-THEORY.md", "03-DISTRIBUSI-DAN-PERCAKAPAN.pdf",
     "Distribusi dan Percakapan", "Koreksi sinyal komentar dan metode pengukuran"),
    ("editorial-engine/docs/AUDIT-ATURAN-DAN-PENERAPAN.md", "04-AUDIT-PENERAPAN.pdf",
     "Audit Aturan dan Penerapan", "Audit apa yang diterapkan, belum teruji dan dibatasi"),
)


def linked_markdown(source: Path) -> str:
    source = source.resolve()
    if not source.is_relative_to(ROOT) or not source.is_file():
        raise ValueError("source must be an existing file in the repository")
    text = source.read_text(encoding="utf-8")
    # CommonMark can silently treat GFM tables as paragraphs. Reject them and
    # fenced code explicitly so no unsupported content is disguised as PDF.
    if re.search(r"(?m)^\s*\|.*\|\s*$|^\s*(```|~~~)", text):
        raise ValueError(f"Unsupported table/fenced block in {source.name}")

    def convert(match: re.Match[str]) -> str:
        label, target = match.group(1), match.group(2)
        parsed = urlsplit(target)
        if parsed.scheme:
            if parsed.scheme not in {"https", "http", "mailto"}:
                raise ValueError(f"Unsupported link scheme: {parsed.scheme}")
            return match.group(0)
        if parsed.netloc or target.startswith("/") or parsed.query:
            raise ValueError(f"Unsupported relative link: {target}")
        destination = (source.parent / parsed.path).resolve() if parsed.path else source
        if not destination.is_relative_to(ROOT) or not destination.is_file():
            raise ValueError(f"Relative link does not resolve inside repo: {target}")
        rel = destination.relative_to(ROOT).as_posix()
        url = BASE + quote(rel, safe="/")
        if parsed.fragment:
            url += "#" + quote(parsed.fragment, safe="-_")
        return f"[{label}]({url})"

    return LINK.sub(convert, text)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-dir", type=Path, required=True,
                        help="Output directory; use a private gitignored workspace location")
    args = parser.parse_args()
    output = args.output_dir.resolve()
    private_roots = (ROOT / ".scratch", ROOT / "google_drive",
                     ROOT / "editorial-engine/deliverables/retensi-research/private")
    if not any(output.is_relative_to(private.resolve()) for private in private_roots):
        parser.error("output directory must be in a gitignored private workspace location")
    output.mkdir(parents=True, exist_ok=True)
    try:
        # Validate all inputs before writing any output.
        prepared = [(linked_markdown(ROOT / src), name, title, subject)
                    for src, name, title, subject in REPORTS]
        with tempfile.TemporaryDirectory(prefix="knot-pdf-") as temp:
            for i, (text, name, title, subject) in enumerate(prepared, 1):
                input_md = Path(temp) / f"{i}.md"
                input_md.write_text(text, encoding="utf-8")
                subprocess.run([sys.executable, str(ROOT / "scripts/render-research-pdf.py"),
                                str(input_md), str(output / name),
                                "--footer", "EDISI CERITA PANJANG  ·  SUMBER AKTIF",
                                "--title", title, "--subject", subject], check=True)
        print("PDFs built. Text/link and visual checks are separate; no publication authorization.")
        return 0
    except (OSError, UnicodeError, ValueError, subprocess.CalledProcessError) as exc:
        print(f"PDF build failed: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
