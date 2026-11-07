#!/usr/bin/env bash
# Local/private pipeline only. A complete render is CPU and disk intensive.
set -euo pipefail
cd "$(dirname "$0")/../.."
if [[ ! -f deliverables/shark-2026-11-07/01-INPUT-PRIVAT-HIU.zip ]]; then
  echo 'Missing private input ZIP; restore it from Drive first.' >&2; exit 1
fi
if [[ ! -x node_modules/.bin/tsx ]]; then npm ci --no-audit --no-fund; fi
python3 pipeline/hiu-sebelum-hutan-2026/restore-input.py
python3 pipeline/hiu-sebelum-hutan-2026/prepare.py
python3 pipeline/hiu-sebelum-hutan-2026/captions.py
./node_modules/.bin/tsx pipeline/hiu-sebelum-hutan-2026/render.tsx --stills
./node_modules/.bin/tsx pipeline/hiu-sebelum-hutan-2026/render.tsx
python3 pipeline/hiu-sebelum-hutan-2026/qa.py
python3 pipeline/hiu-sebelum-hutan-2026/pack.py
