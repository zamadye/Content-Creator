#!/usr/bin/env bash
# Local/private pipeline only. A complete render is CPU and disk intensive.
set -euo pipefail
cd "$(dirname "$0")/../.."
if [[ ! -f assets/audio/episode-teleskop-2026/vo-teleskop.mp3 ]]; then
  echo 'Missing user narration vo-teleskop.mp3; restore it from Drive first.' >&2; exit 1
fi
if [[ ! -x node_modules/.bin/tsx ]]; then npm ci --no-audit --no-fund; fi
python3 pipeline/teleskop-2026-11-12/prepare.py
python3 pipeline/teleskop-2026-11-12/captions.py
./node_modules/.bin/tsx pipeline/teleskop-2026-11-12/render.tsx --stills
./node_modules/.bin/tsx pipeline/teleskop-2026-11-12/render.tsx
python3 pipeline/teleskop-2026-11-12/qa.py
