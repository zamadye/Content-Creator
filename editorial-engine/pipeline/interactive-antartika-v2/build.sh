#!/usr/bin/env bash
# Local pilot only: no Drive, Buffer, scheduling, network or publishing.
set -euo pipefail
cd "$(dirname "$0")/../.."
python3 pipeline/interactive-antartika-v2/prepare.py
python3 pipeline/interactive-antartika-v2/captions.py
npx --no-install tsx pipeline/interactive-antartika-v2/render.tsx --stills
npx --no-install tsx pipeline/interactive-antartika-v2/render.tsx
python3 pipeline/interactive-antartika-v2/qa.py
