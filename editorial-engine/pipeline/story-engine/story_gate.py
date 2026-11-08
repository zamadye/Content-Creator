#!/usr/bin/env python3
"""Offline structural preflight for long-form story briefs.

PASS means only machine-checkable fields/links match. This tool cannot evaluate
story quality, emotional response, accuracy, rights, playback, or authorization.
"""
from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
import re
import sys
from typing import Any
from urllib.parse import urlparse

ID = re.compile(r"^[A-Za-z0-9_-]{1,64}$")
SHA = re.compile(r"^[0-9a-f]{64}$")
EMPTY = {"", "-", "—", "...", "…", "???", "tbd", "todo", "n/a", "belum"}
KINDS = {"context", "disruption", "escalation", "turning_point", "crisis",
         "climax", "consequence", "payoff"}
ATTESTATION_CRITERIA = ("causality", "stakes_and_payoff", "emotion_and_discussion",
                        "source_boundaries", "sentence_audit")


def meaningful(value: Any) -> bool:
    return isinstance(value, str) and value.strip().casefold() not in EMPTY


def valid_id(value: Any) -> bool:
    return isinstance(value, str) and ID.fullmatch(value) is not None


def nonempty_text(obj: Any, key: str, path: str, errors: list[str]) -> str | None:
    value = obj.get(key) if isinstance(obj, dict) else None
    if not meaningful(value):
        errors.append(f"{path}.{key} must be a non-placeholder string")
        return None
    return value


def object_at(obj: Any, key: str, path: str, errors: list[str]) -> dict[str, Any]:
    value = obj.get(key) if isinstance(obj, dict) else None
    if not isinstance(value, dict):
        errors.append(f"{path}.{key} must be an object")
        return {}
    return value


def text_array(value: Any, path: str, errors: list[str], minimum: int = 0) -> list[str]:
    if not isinstance(value, list) or len(value) < minimum or any(not meaningful(v) for v in value):
        errors.append(f"{path} must be a string list of at least {minimum} non-placeholder items")
        return []
    return value


def validate_brief(brief: Any, script: Any | None = None) -> dict[str, Any]:
    errors: list[str] = []
    warnings: list[str] = []
    result: dict[str, Any] = {
        "mechanical": "FAIL", "opening_timing": "NOT TESTED",
        "story_quality": "NOT TESTED", "audience_response": "NOT TESTED",
        "facts_and_rights": "NOT TESTED", "release_authorization": "NOT TESTED",
        "scope": "Structure and cross-references only; never an editorial or publication approval.",
        "errors": errors, "warnings": warnings,
    }
    if not isinstance(brief, dict):
        errors.append("brief must be an object")
        return result
    if type(brief.get("schemaVersion")) is not int or brief.get("schemaVersion") != 1:
        errors.append("brief.schemaVersion must be integer 1")
    if brief.get("format") != "long-master":
        errors.append("brief.format must be long-master")
    if not valid_id(brief.get("storyId")):
        errors.append("brief.storyId must be a valid ID")
    mode = brief.get("truthMode")
    if not isinstance(mode, str) or mode not in {"fact", "fiction"}:
        errors.append("brief.truthMode must be fact or fiction")
    if mode == "fiction":
        nonempty_text(brief, "fictionDisclosure", "brief", errors)
    for key in ("premise", "dramaticQuestion", "entity", "goal", "stakes", "audienceAnchor"):
        nonempty_text(brief, key, "brief", errors)

    sources = brief.get("sources")
    source_ids: set[str] = set()
    if not isinstance(sources, list) or (mode == "fact" and not sources):
        errors.append("brief.sources must be a list; fact requires at least one source")
        sources = []
    for i, source in enumerate(sources):
        p = f"sources[{i}]"
        if not isinstance(source, dict):
            errors.append(f"{p} must be an object")
            continue
        sid = source.get("id")
        if not valid_id(sid) or sid in source_ids:
            errors.append(f"{p}.id must be valid and unique")
        else:
            source_ids.add(sid)
        url = source.get("url")
        try:
            parsed = urlparse(url) if isinstance(url, str) else None
            valid_url = bool(parsed and parsed.scheme in {"https", "http"} and parsed.netloc)
        except ValueError:
            valid_url = False
        if not valid_url:
            errors.append(f"{p}.url must be an HTTP(S) URL")
        for key in ("supports", "limits"):
            nonempty_text(source, key, p, errors)

    beats = brief.get("beats")
    beat_ids: dict[str, tuple[int, str]] = {}
    positions: dict[str, list[int]] = {kind: [] for kind in KINDS}
    if not isinstance(beats, list) or not beats:
        errors.append("brief.beats must be a nonempty array")
        beats = []
    for i, beat in enumerate(beats):
        p = f"beats[{i}]"
        if not isinstance(beat, dict):
            errors.append(f"{p} must be an object")
            continue
        bid, kind = beat.get("id"), beat.get("kind")
        kind_valid = isinstance(kind, str) and kind in KINDS
        if not valid_id(bid) or bid in beat_ids:
            errors.append(f"{p}.id must be valid and unique")
        elif kind_valid:
            beat_ids[bid] = (i, kind)
        if not kind_valid:
            errors.append(f"{p}.kind is invalid")
        else:
            positions[kind].append(i)
        for key in ("before", "event", "after", "causeToNext", "emotionHypothesis"):
            nonempty_text(beat, key, p, errors)
        refs = text_array(beat.get("sourceIds"), f"{p}.sourceIds", errors, 1 if mode == "fact" else 0)
        for ref in refs:
            if ref not in source_ids:
                errors.append(f"{p}.sourceIds references unknown source {ref!r}")
    for kind in KINDS:
        need = 2 if kind == "escalation" else 1
        if len(positions[kind]) < need:
            errors.append(f"brief.beats needs at least {need} {kind} beat(s)")
    # A documentary reveal may follow the physical climax; it still must be
    # planted earlier and come before the story's payoff.
    if all(positions[k] for k in KINDS) and len(positions["escalation"]) >= 2:
        first = lambda k: positions[k][0]
        if not (first("context") < first("disruption") < positions["escalation"][0]
                < positions["escalation"][1] < first("crisis") < first("climax")
                < first("consequence") <= first("payoff")):
            errors.append("beat order must progress context, disruption, two escalations, crisis, climax, consequence, payoff")
        if not (first("disruption") < first("turning_point") < first("payoff")):
            errors.append("turning_point must occur after disruption and before payoff")

    def beat_ref(obj: dict[str, Any], key: str, path: str, allowed: set[str] | None = None) -> str | None:
        value = obj.get(key)
        if not isinstance(value, str) or value not in beat_ids:
            errors.append(f"{path}.{key} must reference an existing beat ID")
            return None
        if allowed is not None and beat_ids[value][1] not in allowed:
            errors.append(f"{path}.{key} has an incompatible beat kind")
        return value

    hook = object_at(brief, "hook", "brief", errors)
    for key in ("entityAtFrame0", "peakVisual", "openingLine", "cutQuestion"):
        nonempty_text(hook, key, "hook", errors)
    beat_ref(hook, "climaxBeatId", "hook", {"climax"})
    beat_ref(hook, "answerBeatId", "hook", {"climax", "turning_point", "consequence", "payoff"})
    timings = []
    for key in ("visualCutSeconds", "spokenOpeningSeconds"):
        value = hook.get(key)
        if value is None:
            timings.append(None)
        elif isinstance(value, bool) or not isinstance(value, (int, float)) or not 0 < value < 3600:
            errors.append(f"hook.{key} must be null or a positive measured number")
        else:
            timings.append(value)
    if len(timings) == 2 and None not in timings:
        result["opening_timing"] = "NEEDS REVIEW" if any(v < 1 or v > 3 for v in timings) else "MEASURED (SELF-REPORTED)"
        if result["opening_timing"] == "NEEDS REVIEW":
            warnings.append("A measured opening component is outside the creative 1–3 second target")
    elif len(timings) == 2:
        warnings.append("Opening cut or full spoken opening has not been measured")

    turn = object_at(brief, "turn", "brief", errors)
    clue = beat_ref(turn, "clueBeatId", "turn")
    reveal = beat_ref(turn, "revealBeatId", "turn", {"turning_point"})
    if clue and reveal and beat_ids[clue][0] >= beat_ids[reveal][0]:
        errors.append("turn.clueBeatId must occur before the reveal")
    for key in ("oldMeaning", "newMeaning", "changedStake", "evidenceBoundary"):
        nonempty_text(turn, key, "turn", errors)

    interactions = object_at(brief, "interactions", "brief", errors)
    comment = object_at(interactions, "comment", "interactions", errors)
    beat_ref(comment, "beatId", "interactions.comment")
    for key in ("storyMoment", "question", "whyDiscuss", "avoidFalseBalance"):
        nonempty_text(comment, key, "interactions.comment", errors)
    views = text_array(comment.get("viewpoints"), "interactions.comment.viewpoints", errors, 2)
    if len(views) >= 2 and len({v.strip().casefold() for v in views}) < 2:
        errors.append("interactions.comment.viewpoints must have at least two distinct positions")
    share = object_at(interactions, "share", "interactions", errors)
    beat_ref(share, "beatId", "interactions.share")
    for key in ("recipient", "value"):
        nonempty_text(share, key, "interactions.share", errors)
    follow = object_at(interactions, "follow", "interactions", errors)
    for key in ("seriesPromise", "whyReturn"):
        nonempty_text(follow, key, "interactions.follow", errors)

    short = object_at(brief, "shortPlan", "brief", errors)
    beat_ref(short, "sourceBeatId", "shortPlan", {"crisis", "climax", "turning_point", "consequence"})
    for key in ("context", "miniConflict", "standalonePayoff", "distortionRisk"):
        nonempty_text(short, key, "shortPlan", errors)

    if script is not None:
        validate_scene_plan(brief, script, beat_ids, errors)
    if not errors:
        result["mechanical"] = "PASS"
    return result


def validate_scene_plan(brief: dict[str, Any], script: Any,
                        beat_ids: dict[str, tuple[int, str]], errors: list[str]) -> None:
    if not isinstance(script, dict) or not valid_id(script.get("id")):
        errors.append("script needs a valid id")
        return
    if brief.get("scriptId") != script.get("id"):
        errors.append("brief.scriptId must match script.id")
    scenes = script.get("scenes")
    if not isinstance(scenes, list) or not scenes:
        errors.append("script.scenes must be a nonempty array")
        return
    script_ids = []
    for i, scene in enumerate(scenes):
        sid = scene.get("id") if isinstance(scene, dict) else None
        if not valid_id(sid) or sid in script_ids:
            errors.append(f"script.scenes[{i}].id must be valid and unique")
        else:
            script_ids.append(sid)
    plans = brief.get("scenePlan")
    if not isinstance(plans, list):
        errors.append("brief.scenePlan must be an array")
        return
    plan_ids = []
    for i, plan in enumerate(plans):
        p = f"scenePlan[{i}]"
        if not isinstance(plan, dict):
            errors.append(f"{p} must be an object")
            continue
        sid = plan.get("sceneId")
        if not valid_id(sid) or sid in plan_ids:
            errors.append(f"{p}.sceneId must be valid and unique")
        else:
            plan_ids.append(sid)
        beat_id = plan.get("beatId")
        if not isinstance(beat_id, str) or beat_id not in beat_ids:
            errors.append(f"{p}.beatId must reference an existing beat")
        objects = plan.get("objectMap")
        names = []
        if not isinstance(objects, list) or len(objects) < 2:
            errors.append(f"{p}.objectMap requires at least two objects")
            continue
        for j, item in enumerate(objects):
            name = nonempty_text(item, "object", f"{p}.objectMap[{j}]", errors)
            nonempty_text(item, "action", f"{p}.objectMap[{j}]", errors)
            if name:
                names.append(name.strip().casefold())
        if len(set(names)) < 2:
            errors.append(f"{p}.objectMap requires two distinct named objects")
    if script_ids != plan_ids:
        errors.append("scenePlan must cover every script scene exactly once and in script order")


def load_sentence_checker():
    path = Path(__file__).resolve().parents[1] / "script-review" / "audit.py"
    spec = importlib.util.spec_from_file_location("sentence_audit", path)
    if spec is None or spec.loader is None:
        raise RuntimeError("cannot load sentence audit")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def sha256(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def validate_attestation(record: Any, hashes: dict[str, str]) -> list[str]:
    errors: list[str] = []
    if not isinstance(record, dict):
        return ["human review receipt must be an object"]
    for key, actual in hashes.items():
        supplied = record.get(key)
        if not isinstance(supplied, str) or not SHA.fullmatch(supplied) or supplied != actual:
            errors.append(f"human review {key} must match the exact input SHA-256")
    for key in ("reviewerRole", "reviewedAt", "method", "evidenceLocation"):
        nonempty_text(record, key, "humanReview", errors)
    criteria = record.get("criteria")
    if not isinstance(criteria, dict):
        errors.append("humanReview.criteria must be an object")
        return errors
    for criterion in ATTESTATION_CRITERIA:
        entry = criteria.get(criterion)
        if not isinstance(entry, dict) or entry.get("status") != "PASS":
            errors.append(f"humanReview.criteria.{criterion} must record PASS")
        else:
            nonempty_text(entry, "evidence", f"humanReview.criteria.{criterion}", errors)
    return errors


def read_json(path: str) -> tuple[bytes, Any]:
    raw = Path(path).read_bytes()
    return raw, json.loads(raw.decode("utf-8"))


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--brief", required=True, help="Long-form story brief JSON")
    parser.add_argument("--stage", choices=("outline", "prevoice"), default="outline")
    parser.add_argument("--script", help="Episode JSON with id and scenes")
    parser.add_argument("--review", help="Per-sentence audit JSON")
    parser.add_argument("--human-review", help="Private review receipt bound to SHA-256 of the three inputs")
    args = parser.parse_args()
    try:
        brief_raw, brief = read_json(args.brief)
        if bool(args.script) != bool(args.review):
            raise ValueError("--script and --review must be provided together")
        script_raw, script = read_json(args.script) if args.script else (None, None)
        audit_raw, sentence_review = read_json(args.review) if args.review else (None, None)
        human_raw, human = read_json(args.human_review) if args.human_review else (None, None)
        del human_raw
        result = validate_brief(brief, script)
        result["stage"] = args.stage
        result["sentence_coverage"] = "NOT TESTED"
        result["human_attestation"] = "NOT TESTED"
        if script is not None:
            sentence = load_sentence_checker().audit(script, sentence_review)
            result["sentence_coverage"] = sentence["mechanical"]
            result["warnings"].extend(sentence["warnings"])
            if sentence["mechanical"] != "PASS":
                result["errors"].extend("sentence audit: " + s for s in sentence["issues"])
        if args.stage == "prevoice":
            if script_raw is None or audit_raw is None or human is None:
                result["errors"].append("prevoice requires --script, --review and --human-review")
            else:
                hashes = {"briefSha256": sha256(brief_raw), "scriptSha256": sha256(script_raw),
                          "auditSha256": sha256(audit_raw)}
                attestation_errors = validate_attestation(human, hashes)
                if attestation_errors:
                    result["errors"].extend(attestation_errors)
                else:
                    result["human_attestation"] = "RECORDED (NOT INDEPENDENTLY VERIFIED)"
        elif human is not None:
            result["warnings"].append("Human receipt is evaluated only in prevoice stage")
        if result["errors"]:
            result["mechanical"] = "FAIL"
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0 if result["mechanical"] == "PASS" else 1
    except (OSError, UnicodeError, json.JSONDecodeError, ValueError, RuntimeError) as exc:
        print(json.dumps({"mechanical": "FAIL", "error": str(exc), "story_quality": "NOT TESTED",
                          "audience_response": "NOT TESTED", "facts_and_rights": "NOT TESTED",
                          "release_authorization": "NOT TESTED"}, ensure_ascii=False))
        return 2


if __name__ == "__main__":
    sys.exit(main())
