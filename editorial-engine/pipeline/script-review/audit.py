#!/usr/bin/env python3
"""Check audit completeness and text coverage, not storytelling quality.

This offline check deliberately cannot approve an audience response, sentence
segmentation, factual accuracy, naturalness, rights, or any human QA gate.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from typing import Any


REQUIRED = (
    "text", "purpose", "viewerQuestion", "connection", "visualAction",
    "evidence", "nextOrPayoff", "wordChoice",
)
PLACEHOLDERS = {"", "-", "—", "...", "…", "???", "tbd", "todo", "n/a", "belum"}
# Only a warning: abbreviations, quotations, ellipses, etc. need human review.
MULTIPLE_SENTENCES = re.compile(r"[.!?][\"'”’\)\]]*\s+\S")


def meaningful(value: Any) -> bool:
    return isinstance(value, str) and value.strip().casefold() not in PLACEHOLDERS


def normalize_space(value: str) -> str:
    return " ".join(value.split())


def audit(script: Any, review: Any) -> dict[str, Any]:
    issues: list[str] = []
    warnings: list[str] = []
    result: dict[str, Any] = {
        "mechanical": "FAIL",
        "sentence_segmentation": "NOT TESTED",
        "human_script_quality": "NOT TESTED",
        "audience_response": "NOT TESTED",
        "facts_and_rights": "NOT TESTED",
        "scope": "Text coverage and nonempty audit fields only; manual review is required.",
        "issues": issues,
        "warnings": warnings,
    }
    if not isinstance(script, dict) or not isinstance(review, dict):
        issues.append("Script and review must both be JSON objects.")
        return result

    script_id = script.get("id")
    if not meaningful(script_id) or review.get("scriptId") != script_id:
        issues.append("scriptId must match the nonempty script id.")

    anchor = review.get("audienceAnchor")
    if not isinstance(anchor, dict):
        issues.append("audienceAnchor must be an object.")
    else:
        for key in ("situation", "scope"):
            if not meaningful(anchor.get(key)):
                issues.append(f"audienceAnchor.{key} is missing or a placeholder.")

    scenes = script.get("scenes")
    expected_ids: list[str] = []
    expected_narration: dict[str, str] = {}
    seen_ids: set[str] = set()
    if not isinstance(scenes, list) or not scenes:
        issues.append("Script needs a nonempty scenes array.")
    else:
        for index, scene in enumerate(scenes, 1):
            if not isinstance(scene, dict):
                issues.append(f"Scene {index} must be an object.")
                continue
            scene_id, narration = scene.get("id"), scene.get("narration")
            if not meaningful(scene_id):
                issues.append(f"Scene {index} needs a nonempty id.")
                continue
            if scene_id in seen_ids:
                issues.append(f"Duplicate script scene id: {scene_id}.")
                continue
            seen_ids.add(scene_id)
            if not isinstance(narration, str):
                issues.append(f"Scene {scene_id} needs a narration string; use an empty string for silence.")
                continue
            if not narration.strip():
                continue  # An explicitly silent scene has no sentence to audit.
            if not meaningful(narration):
                issues.append(f"Scene {scene_id} has placeholder narration.")
                continue
            expected_ids.append(scene_id)
            expected_narration[scene_id] = normalize_space(narration)
        if not expected_ids:
            issues.append("Script needs at least one scene with spoken narration.")

    items = review.get("items")
    segments: dict[str, list[str]] = {}
    observed_order: list[str] = []
    if not isinstance(items, list) or not items:
        issues.append("Review needs a nonempty items array.")
    else:
        last_id = None
        for index, item in enumerate(items, 1):
            if not isinstance(item, dict):
                issues.append(f"Item {index} must be an object.")
                continue
            scene_id = item.get("sceneId")
            if not meaningful(scene_id):
                issues.append(f"Item {index} needs a nonempty sceneId.")
                continue
            if scene_id != last_id:
                observed_order.append(scene_id)
                last_id = scene_id
            for key in REQUIRED:
                if not meaningful(item.get(key)):
                    issues.append(f"Item {index} ({scene_id}) needs {key}; placeholders are not accepted.")
            text = item.get("text")
            if isinstance(text, str):
                segments.setdefault(scene_id, []).append(text.strip())
                if MULTIPLE_SENTENCES.search(text.strip()):
                    warnings.append(f"Item {index} ({scene_id}) may contain multiple sentences; check manually.")
            if scene_id not in expected_narration:
                issues.append(f"Item {index} references an unknown script scene.")

    if expected_ids != observed_order:
        issues.append("Review scenes must appear once, in script order, without omissions or extras.")
    for scene_id in expected_ids:
        reconstructed = normalize_space(" ".join(segments.get(scene_id, [])))
        if reconstructed != expected_narration[scene_id]:
            issues.append(f"Reviewed text does not match narration in scene {scene_id}.")

    if not issues:
        result["mechanical"] = "PASS"
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--script", required=True, help="Episode JSON with id, scenes, and narration")
    parser.add_argument("--review", required=True, help="Per-sentence audit JSON")
    args = parser.parse_args()
    try:
        with open(args.script, encoding="utf-8") as f:
            script = json.load(f)
        with open(args.review, encoding="utf-8") as f:
            review = json.load(f)
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        print(json.dumps({"mechanical": "FAIL", "error": type(exc).__name__,
                          "sentence_segmentation": "NOT TESTED", "human_script_quality": "NOT TESTED",
                          "audience_response": "NOT TESTED", "facts_and_rights": "NOT TESTED"},
                         ensure_ascii=False))
        return 2
    result = audit(script, review)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result["mechanical"] == "PASS" else 1


if __name__ == "__main__":
    sys.exit(main())
