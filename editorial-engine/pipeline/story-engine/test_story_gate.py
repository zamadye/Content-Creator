#!/usr/bin/env python3
"""Offline synthetic tests; no test result approves an episode."""
import copy
import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

PATH = Path(__file__).with_name("story_gate.py")
spec = importlib.util.spec_from_file_location("story_gate", PATH)
gate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gate)


def example():
    kinds = ["context", "disruption", "escalation", "escalation", "crisis",
             "climax", "turning_point", "consequence", "payoff"]
    beats = []
    for i, kind in enumerate(kinds, 1):
        beats.append({"id": f"B{i}", "kind": kind,
                      "before": f"Keadaan sebelum langkah {i}",
                      "event": f"Kejadian langkah {i}", "after": f"Keadaan sesudah langkah {i}",
                      "causeToNext": f"Dampak langkah {i} terhadap kelanjutan",
                      "emotionHypothesis": f"Emosi yang mungkin pada langkah {i}",
                      "sourceIds": ["S1"]})
    brief = {
        "schemaVersion": 1, "format": "long-master", "storyId": "synthetic-story",
        "scriptId": "synthetic-script", "truthMode": "fact", "premise": "Tokoh menghadapi masalah dan akibat.",
        "dramaticQuestion": "Apa akibat keputusan tersebut?", "entity": "Tangki fiktif",
        "goal": "Warga ingin tempat yang aman.", "stakes": "Orang di sekitar dapat terdampak.",
        "audienceAnchor": "Tanda yang terlihat di lingkungan.",
        "sources": [{"id": "S1", "url": "https://example.org/fact",
                     "supports": "Rujukan uji sintetis", "limits": "Bukan sumber kisah nyata"}],
        "beats": beats,
        "hook": {"entityAtFrame0": "Tangki di tepi jalan", "peakVisual": "Tangki berubah",
                 "openingLine": "Benda itu berubah.", "cutQuestion": "Apa yang terjadi?",
                 "climaxBeatId": "B6", "answerBeatId": "B8",
                 "visualCutSeconds": None, "spokenOpeningSeconds": None},
        "turn": {"clueBeatId": "B3", "revealBeatId": "B7", "oldMeaning": "Awalnya diduga A",
                 "newMeaning": "Bukti menunjukkan B", "changedStake": "Pilihan berubah",
                 "evidenceBoundary": "Jangan mengarang penyebab lain"},
        "interactions": {
            "comment": {"beatId": "B7", "storyMoment": "Dua pihak melihat bukti",
                        "question": "Siapa yang perlu bertindak?", "whyDiscuss": "Ada akibat dan pilihan",
                        "viewpoints": ["Pemilik", "Pemeriksa dan pemilik"],
                        "avoidFalseBalance": "Jangan mengabaikan bukti keselamatan"},
            "share": {"beatId": "B8", "recipient": "Teman di lingkungan", "value": "Membahas tanda risiko"},
            "follow": {"seriesPromise": "Kisah tanda biasa yang mengubah nasib", "whyReturn": "Kisah lain yang utuh"}},
        "shortPlan": {"sourceBeatId": "B6", "context": "Tempat dan orang",
                      "miniConflict": "Masalahnya terjadi", "standalonePayoff": "Akibat dan jawaban",
                      "distortionRisk": "Jangan menghapus batas faktanya"},
        "scenePlan": [
            {"sceneId": "A", "beatId": "B1", "objectMap": [{"object": "tangki", "action": "berdiri"},
                                                                {"object": "jalan", "action": "melintas"}]},
            {"sceneId": "B", "beatId": "B6", "objectMap": [{"object": "bangunan", "action": "terlihat"},
                                                                {"object": "peta", "action": "menunjuk lokasi"}]},
        ],
    }
    script = {"id": "synthetic-script", "scenes": [
        {"id": "A", "narration": "Benda itu berubah."},
        {"id": "B", "narration": "Kejadian itu berakhir."}]}
    audit = {"scriptId": script["id"],
             "audienceAnchor": {"situation": "Sesuatu di lingkungan", "scope": "Contoh saja"},
             "items": []}
    for scene in script["scenes"]:
        audit["items"].append({"sceneId": scene["id"], "text": scene["narration"],
                               "purpose": "Fungsi contoh", "viewerQuestion": "Apa akibatnya?",
                               "connection": "Konteks contoh", "visualAction": "Objek berubah",
                               "evidence": "Contoh fiksi", "nextOrPayoff": "Jawaban di akhir",
                               "wordChoice": "Nama objek dibuat jelas"})
    return brief, script, audit


def encoded(obj):
    return (json.dumps(obj, ensure_ascii=False, indent=2) + "\n").encode("utf-8")


def digest(raw):
    return hashlib.sha256(raw).hexdigest()


class StoryGateTest(unittest.TestCase):
    def setUp(self):
        self.brief, self.script, self.audit = example()

    def test_valid_outline_does_not_claim_story_or_audience_pass(self):
        result = gate.validate_brief(self.brief)
        self.assertEqual(result["mechanical"], "PASS")
        for key in ("story_quality", "audience_response", "facts_and_rights", "release_authorization", "opening_timing"):
            self.assertEqual(result[key], "NOT TESTED")

    def test_scenes_complete_and_distinct_objects(self):
        self.assertEqual(gate.validate_brief(self.brief, self.script)["mechanical"], "PASS")
        self.brief["scenePlan"][0]["objectMap"][1]["object"] = "TANGKI"
        self.assertEqual(gate.validate_brief(self.brief, self.script)["mechanical"], "FAIL")
        self.brief["scenePlan"][0]["objectMap"].pop()
        self.assertEqual(gate.validate_brief(self.brief, self.script)["mechanical"], "FAIL")

    def test_every_scene_even_silent_needs_mapping(self):
        self.script["scenes"].append({"id": "C", "narration": ""})
        result = gate.validate_brief(self.brief, self.script)
        self.assertIn("scenePlan must cover every script scene exactly once and in script order", result["errors"])

    def test_missing_and_wrong_beat_orders_fail(self):
        self.brief["beats"].pop(2)
        result = gate.validate_brief(self.brief)
        self.assertTrue(any("2 escalation" in e for e in result["errors"]))
        self.brief, _, _ = example()
        self.brief["beats"][0], self.brief["beats"][1] = self.brief["beats"][1], self.brief["beats"][0]
        self.assertTrue(any("beat order" in e for e in gate.validate_brief(self.brief)["errors"]))

    def test_legal_reveal_may_follow_physical_climax(self):
        result = gate.validate_brief(self.brief)
        self.assertEqual(result["mechanical"], "PASS")
        self.brief["turn"]["clueBeatId"] = "B8"
        self.assertTrue(any("before the reveal" in e for e in gate.validate_brief(self.brief)["errors"]))

    def test_wrong_climax_reference_and_false_positions(self):
        self.brief["hook"]["climaxBeatId"] = "B1"
        self.brief["interactions"]["comment"]["viewpoints"] = ["Sama", " sama "]
        result = gate.validate_brief(self.brief)
        self.assertEqual(result["mechanical"], "FAIL")
        self.assertTrue(any("incompatible beat kind" in e for e in result["errors"]))
        self.assertTrue(any("distinct positions" in e for e in result["errors"]))

    def test_source_is_required_for_factual_beats(self):
        self.brief["sources"] = []
        self.brief["beats"][0]["sourceIds"] = []
        result = gate.validate_brief(self.brief)
        self.assertTrue(any("at least one source" in e for e in result["errors"]))
        self.assertTrue(any("sourceIds" in e for e in result["errors"]))

    def test_fiction_requires_disclosure(self):
        self.brief["truthMode"] = "fiction"
        self.brief["sources"] = []
        for beat in self.brief["beats"]:
            beat["sourceIds"] = []
        self.assertEqual(gate.validate_brief(self.brief)["mechanical"], "FAIL")
        self.brief["fictionDisclosure"] = "Cerita ini fiksi."
        self.assertEqual(gate.validate_brief(self.brief)["mechanical"], "PASS")

    def test_placeholders_and_bad_types_fail_cleanly(self):
        self.brief["premise"] = "..."
        self.brief["truthMode"] = []
        self.brief["beats"][0]["kind"] = []
        self.brief["scenePlan"][0]["beatId"] = []
        result = gate.validate_brief(self.brief, self.script)
        self.assertEqual(result["mechanical"], "FAIL")
        self.assertGreaterEqual(len(result["errors"]), 4)

    def test_timing_is_self_reported_not_a_quality_pass(self):
        self.brief["hook"]["visualCutSeconds"] = 2
        self.brief["hook"]["spokenOpeningSeconds"] = 3.32
        result = gate.validate_brief(self.brief)
        self.assertEqual(result["opening_timing"], "NEEDS REVIEW")
        self.assertEqual(result["story_quality"], "NOT TESTED")
        self.brief["hook"]["spokenOpeningSeconds"] = True
        self.assertEqual(gate.validate_brief(self.brief)["mechanical"], "FAIL")

    def test_scene_coverage_and_narration_order(self):
        self.brief["scenePlan"].reverse()
        self.assertEqual(gate.validate_brief(self.brief, self.script)["mechanical"], "FAIL")
        self.audit["items"][0]["text"] = "Teks yang berubah."
        result = gate.load_sentence_checker().audit(self.script, self.audit)
        self.assertEqual(result["mechanical"], "FAIL")

    def test_prevoice_cli_requires_review_and_exact_input_hashes(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            paths = [root / name for name in ("brief.json", "script.json", "audit.json", "human.json")]
            raws = [encoded(x) for x in (self.brief, self.script, self.audit)]
            for p, raw in zip(paths[:3], raws):
                p.write_bytes(raw)
            base = [sys.executable, str(PATH), "--stage", "prevoice", "--brief", str(paths[0]),
                    "--script", str(paths[1]), "--review", str(paths[2])]
            missing = subprocess.run(base, capture_output=True, text=True)
            self.assertEqual(missing.returncode, 1)
            receipt = {"briefSha256": digest(raws[0]), "scriptSha256": digest(raws[1]),
                       "auditSha256": digest(raws[2]), "reviewerRole": "editor sintetis",
                       "reviewedAt": "test timestamp", "method": "simulasi",
                       "evidenceLocation": "catatan uji sintetis", "criteria": {
                           key: {"status": "PASS", "evidence": f"simulasi {key}"}
                           for key in gate.ATTESTATION_CRITERIA}}
            paths[3].write_bytes(encoded(receipt))
            ok = subprocess.run(base + ["--human-review", str(paths[3])], capture_output=True, text=True)
            self.assertEqual(ok.returncode, 0, ok.stdout + ok.stderr)
            result = json.loads(ok.stdout)
            self.assertEqual(result["human_attestation"], "RECORDED (NOT INDEPENDENTLY VERIFIED)")
            self.assertEqual(result["audience_response"], "NOT TESTED")
            self.assertEqual(result["facts_and_rights"], "NOT TESTED")
            self.assertEqual(result["release_authorization"], "NOT TESTED")
            # Change only file formatting: the reviewed raw file is no longer identical.
            paths[0].write_bytes(raws[0] + b" ")
            stale = subprocess.run(base + ["--human-review", str(paths[3])], capture_output=True, text=True)
            self.assertEqual(stale.returncode, 1)
            self.assertTrue(any("briefSha256" in e for e in json.loads(stale.stdout)["errors"]))

    def test_invalid_receipt_cannot_be_a_pass(self):
        hashes = {"briefSha256": "a" * 64, "scriptSha256": "b" * 64, "auditSha256": "c" * 64}
        record = {**hashes, "reviewerRole": "editor", "reviewedAt": "now", "method": "read",
                  "evidenceLocation": "private", "criteria": {
                      key: {"status": "PASS", "evidence": "catatan"} for key in gate.ATTESTATION_CRITERIA}}
        self.assertEqual(gate.validate_attestation(record, hashes), [])
        record["criteria"]["emotion_and_discussion"]["status"] = "NOT TESTED"
        self.assertTrue(gate.validate_attestation(record, hashes))
        record["briefSha256"] = "incorrect"
        self.assertTrue(any("briefSha256" in e for e in gate.validate_attestation(record, hashes)))

    def test_wrapper_blocks_side_effect_until_prevoice_receipt_is_valid(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            paths = [root / name for name in ("brief.json", "script.json", "audit.json", "human.json")]
            raws = [encoded(x) for x in (self.brief, self.script, self.audit)]
            for p, raw in zip(paths[:3], raws):
                p.write_bytes(raw)
            receipt = {"briefSha256": digest(raws[0]), "scriptSha256": digest(raws[1]),
                       "auditSha256": digest(raws[2]), "reviewerRole": "reviewer sintetis",
                       "reviewedAt": "test", "method": "simulasi", "evidenceLocation": "uji privat",
                       "criteria": {key: {"status": "NOT TESTED", "evidence": ""}
                                    for key in gate.ATTESTATION_CRITERIA}}
            paths[3].write_bytes(encoded(receipt))
            sentinel = root / "sentinel"
            cmd = [sys.executable, str(PATH.with_name("run_after_story_gate.py")),
                   "--brief", str(paths[0]), "--script", str(paths[1]),
                   "--review", str(paths[2]), "--human-review", str(paths[3]), "--",
                   sys.executable, "-c", "from pathlib import Path; Path(%r).write_text('ran')" % str(sentinel)]
            blocked = subprocess.run(cmd, capture_output=True, text=True)
            self.assertEqual(blocked.returncode, 1)
            self.assertFalse(sentinel.exists())
            for item in receipt["criteria"].values():
                item.update({"status": "PASS", "evidence": "simulasi saja"})
            paths[3].write_bytes(encoded(receipt))
            allowed = subprocess.run(cmd, capture_output=True, text=True)
            self.assertEqual(allowed.returncode, 0, allowed.stdout + allowed.stderr)
            self.assertEqual(sentinel.read_text(), "ran")

    def test_receipt_creator_is_blank_and_never_overwrites(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            paths = [root / name for name in ("brief.json", "script.json", "audit.json", "human.json")]
            raws = [encoded(x) for x in (self.brief, self.script, self.audit)]
            for p, raw in zip(paths[:3], raws):
                p.write_bytes(raw)
            create = PATH.with_name("create_review_receipt.py")
            cmd = [sys.executable, str(create), "--brief", str(paths[0]), "--script", str(paths[1]),
                   "--review", str(paths[2]), "--output", str(paths[3])]
            self.assertEqual(subprocess.run(cmd, capture_output=True).returncode, 0)
            receipt_raw = paths[3].read_bytes()
            receipt = json.loads(receipt_raw)
            self.assertEqual(receipt["briefSha256"], digest(raws[0]))
            self.assertTrue(all(v["status"] == "NOT TESTED" for v in receipt["criteria"].values()))
            hashes = {"briefSha256": digest(raws[0]), "scriptSha256": digest(raws[1]),
                      "auditSha256": digest(raws[2])}
            self.assertTrue(gate.validate_attestation(receipt, hashes))
            self.assertEqual(subprocess.run(cmd, capture_output=True).returncode, 2)
            self.assertEqual(paths[3].read_bytes(), receipt_raw)

    def test_unreadable_or_invalid_json_returns_input_error(self):
        with tempfile.TemporaryDirectory() as td:
            brief = Path(td) / "bad.json"
            brief.write_text("{", encoding="utf-8")
            r = subprocess.run([sys.executable, str(PATH), "--brief", str(brief)], capture_output=True, text=True)
            self.assertEqual(r.returncode, 2)
            self.assertEqual(json.loads(r.stdout)["release_authorization"], "NOT TESTED")


if __name__ == "__main__":
    unittest.main()
