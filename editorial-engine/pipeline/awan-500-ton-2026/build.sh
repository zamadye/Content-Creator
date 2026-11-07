#!/usr/bin/env bash
# Local/private render only; never publishes or alters Drive.
set -euo pipefail
cd "$(dirname "$0")/../.."
if [[ ! -f deliverables/awan-500-ton-2026/01-INPUT-PRIVAT-AWAN.zip ]]; then
  echo 'Input ZIP privat tidak ada; pulihkan dari Drive ke deliverables/awan-500-ton-2026/.' >&2; exit 1
fi
if [[ ! -x node_modules/.bin/tsx ]]; then npm ci --no-audit --no-fund; fi
python3 pipeline/awan-500-ton-2026/restore-input.py
python3 -m unittest pipeline/awan-500-ton-2026/test_pipeline.py
python3 pipeline/awan-500-ton-2026/prepare.py
python3 pipeline/awan-500-ton-2026/captions.py
./node_modules/.bin/tsx pipeline/awan-500-ton-2026/render.tsx --stills
./node_modules/.bin/tsx pipeline/awan-500-ton-2026/render.tsx
python3 pipeline/awan-500-ton-2026/qa.py
python3 pipeline/awan-500-ton-2026/pack.py
