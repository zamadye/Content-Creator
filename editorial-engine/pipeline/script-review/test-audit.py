#!/usr/bin/env python3
"""Offline tests of structural checks; never tests subjective quality."""
import copy
import importlib.util
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("script_audit", HERE / "audit.py")
audit_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit_module)


def row(scene_id, text):
    return {
        "sceneId": scene_id,
        "text": text,
        "purpose": "Menyajikan situasi yang dapat dibayangkan.",
        "viewerQuestion": "Apa yang mungkin terjadi berikutnya?",
        "connection": "Mengingatkan pada sebuah pengamatan yang umum.",
        "visualAction": "Objek bergerak saat Host menunjuknya.",
        "evidence": "N/A — contoh fiktif untuk tes mekanis.",
        "nextOrPayoff": "Bagian berikut memberi penjelasan.",
        "wordChoice": "Kata dipilih agar mudah dipahami sekali dengar.",
    }


def fixtures():
    script = {"id": "synthetic", "scenes": [
        {"id": "S01", "narration": "Satu benda terlihat. Mengapa berubah?"},
        {"id": "S02", "narration": "Jawabannya sebuah contoh. ikuti knot theory."},
    ]}
    review = {"scriptId": "synthetic", "audienceAnchor": {
        "situation": "Orang dapat membayangkan melihat sebuah benda.",
        "scope": "Contoh saja; tidak menganggap semua orang pernah mengalami ini.",
    }, "items": [row("S01", "Satu benda terlihat."), row("S01", "Mengapa berubah?"),
                 row("S02", "Jawabannya sebuah contoh."), row("S02", "ikuti knot theory.")]}
    return script, review


class AuditTests(unittest.TestCase):
    def test_complete_review_only_passes_mechanical_coverage(self):
        script, review = fixtures()
        result = audit_module.audit(script, review)
        self.assertEqual(result["mechanical"], "PASS")
        self.assertEqual(result["human_script_quality"], "NOT TESTED")
        self.assertEqual(result["sentence_segmentation"], "NOT TESTED")
        self.assertEqual(result["audience_response"], "NOT TESTED")
        self.assertEqual(result["facts_and_rights"], "NOT TESTED")
        self.assertFalse(result["warnings"])

    def test_every_sentence_text_is_covered_and_in_order(self):
        script, review = fixtures()
        bad_cases = []
        missing = copy.deepcopy(review); missing["items"].pop(1); bad_cases.append(missing)
        changed = copy.deepcopy(review); changed["items"][0]["text"] = "Satu benda menghilang."; bad_cases.append(changed)
        reordered = copy.deepcopy(review); reordered["items"][0], reordered["items"][1] = reordered["items"][1], reordered["items"][0]; bad_cases.append(reordered)
        extra = copy.deepcopy(review); extra["items"].append(row("S03", "Tambahan.")); bad_cases.append(extra)
        split_scene = copy.deepcopy(review); split_scene["items"].insert(1, split_scene["items"].pop(2)); bad_cases.append(split_scene)
        for bad in bad_cases:
            with self.subTest(bad=bad):
                self.assertEqual(audit_module.audit(script, bad)["mechanical"], "FAIL")

    def test_missing_fields_anchor_id_and_duplicate_scene_fail(self):
        script, review = fixtures()
        for key in audit_module.REQUIRED:
            bad = copy.deepcopy(review); bad["items"][0][key] = "..."
            with self.subTest(field=key):
                self.assertEqual(audit_module.audit(script, bad)["mechanical"], "FAIL")
        for key in ("situation", "scope"):
            bad = copy.deepcopy(review); bad["audienceAnchor"][key] = " "
            self.assertEqual(audit_module.audit(script, bad)["mechanical"], "FAIL")
        bad = copy.deepcopy(review); bad["scriptId"] = "different"
        self.assertEqual(audit_module.audit(script, bad)["mechanical"], "FAIL")
        bad_script = copy.deepcopy(script); bad_script["scenes"][1]["id"] = "S01"
        self.assertEqual(audit_module.audit(bad_script, review)["mechanical"], "FAIL")

    def test_whitespace_is_normalized_but_punctuation_is_not(self):
        script, review = fixtures()
        script["scenes"][0]["narration"] = "Satu   benda terlihat.\nMengapa berubah?"
        self.assertEqual(audit_module.audit(script, review)["mechanical"], "PASS")
        review["items"][1]["text"] = "Mengapa berubah!"
        self.assertEqual(audit_module.audit(script, review)["mechanical"], "FAIL")

    def test_explicit_silence_is_allowed_but_missing_narration_is_not(self):
        script, review = fixtures()
        script["scenes"].insert(1, {"id": "S-silent", "narration": ""})
        self.assertEqual(audit_module.audit(script, review)["mechanical"], "PASS")
        del script["scenes"][1]["narration"]
        self.assertEqual(audit_module.audit(script, review)["mechanical"], "FAIL")
        script["scenes"][1] = {"id": "S01", "narration": ""}
        self.assertEqual(audit_module.audit(script, review)["mechanical"], "FAIL")
        silent_only = {"id": "synthetic", "scenes": [{"id": "S", "narration": ""}]}
        self.assertEqual(audit_module.audit(silent_only, review)["mechanical"], "FAIL")

    def test_possible_grouped_sentences_warn_not_auto_approve(self):
        script, review = fixtures()
        review["items"][0]["text"] += " " + review["items"][1]["text"]
        review["items"].pop(1)
        result = audit_module.audit(script, review)
        self.assertEqual(result["mechanical"], "PASS")
        self.assertEqual(result["sentence_segmentation"], "NOT TESTED")
        self.assertTrue(result["warnings"])
        self.assertEqual(result["human_script_quality"], "NOT TESTED")

    def test_malformed_input_and_cli_exit_codes(self):
        self.assertEqual(audit_module.audit([], {})["mechanical"], "FAIL")
        script, review = fixtures()
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); script_path = root / "script.json"; review_path = root / "review.json"
            script_path.write_text(json.dumps(script), encoding="utf-8")
            review_path.write_text(json.dumps(review), encoding="utf-8")
            cmd = [sys.executable, str(HERE / "audit.py"), "--script", str(script_path), "--review", str(review_path)]
            completed = subprocess.run(cmd, capture_output=True, text=True, check=False)
            self.assertEqual(completed.returncode, 0)
            self.assertEqual(json.loads(completed.stdout)["audience_response"], "NOT TESTED")
            review["items"].pop()
            review_path.write_text(json.dumps(review), encoding="utf-8")
            completed = subprocess.run(cmd, capture_output=True, text=True, check=False)
            self.assertEqual(completed.returncode, 1)
            review_path.write_text("{", encoding="utf-8")
            completed = subprocess.run(cmd, capture_output=True, text=True, check=False)
            self.assertEqual(completed.returncode, 2)
            self.assertEqual(json.loads(completed.stdout)["human_script_quality"], "NOT TESTED")


if __name__ == "__main__":
    unittest.main()
