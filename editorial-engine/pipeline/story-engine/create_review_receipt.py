#!/usr/bin/env python3
"""Create a blank private human-review receipt tied to exact input bytes.

No review is performed. The output is NOT TESTED and will not pass prevoice
until a real reviewer fills every criterion with a recorded assessment.
"""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
import sys

CRITERIA = ("causality", "stakes_and_payoff", "emotion_and_discussion",
            "source_boundaries", "sentence_audit")


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--brief", required=True)
    p.add_argument("--script", required=True)
    p.add_argument("--review", required=True, help="Per-sentence audit JSON")
    p.add_argument("--output", required=True, help="New private receipt file; refuses overwrite")
    args = p.parse_args()
    try:
        hashes = {}
        for key, filename in (("briefSha256", args.brief), ("scriptSha256", args.script),
                              ("auditSha256", args.review)):
            raw = Path(filename).read_bytes()
            json.loads(raw.decode("utf-8"))  # Do not issue receipts for malformed inputs.
            hashes[key] = hashlib.sha256(raw).hexdigest()
        receipt = {**hashes, "reviewerRole": "", "reviewedAt": "", "method": "", "evidenceLocation": "",
                   "criteria": {key: {"status": "NOT TESTED", "evidence": ""} for key in CRITERIA}}
        target = Path(args.output)
        with target.open("x", encoding="utf-8") as out:
            json.dump(receipt, out, ensure_ascii=False, indent=2)
            out.write("\n")
        print("Blank receipt created; all human criteria are NOT TESTED.")
        return 0
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        print(f"Cannot create receipt: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
