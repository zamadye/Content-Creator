#!/usr/bin/env python3
"""Fail-closed wrapper: run a command only after the prevoice preflight passes.

This is not a sandbox or a publication permission. It cannot enforce itself on
legacy scripts or prevent edits between the preflight and the invoked command.
"""
from __future__ import annotations
import argparse
from pathlib import Path
import subprocess
import sys


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    for flag in ("brief", "script", "review", "human-review"):
        p.add_argument("--" + flag, required=True)
    p.add_argument("command", nargs=argparse.REMAINDER, help="Command after -- (no shell evaluation)")
    a = p.parse_args()
    cmd = list(a.command)
    if cmd and cmd[0] == "--":
        cmd.pop(0)
    if not cmd:
        p.error("provide a command after --")
    gate = Path(__file__).with_name("story_gate.py")
    try:
        result = subprocess.run([sys.executable, str(gate), "--stage", "prevoice",
                                 "--brief", a.brief, "--script", a.script,
                                 "--review", a.review, "--human-review", a.human_review])
        if result.returncode != 0:
            print("Story preflight did not pass; command was not run.", file=sys.stderr)
            return result.returncode if result.returncode > 0 else 1
        print("Prevoice checks passed mechanically; human/audience/facts/rights/authorization remain separate.",
              flush=True)
        return subprocess.run(cmd).returncode
    except OSError as exc:
        print(f"Unable to run preflight or command: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
