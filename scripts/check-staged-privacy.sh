#!/usr/bin/env bash
set -euo pipefail
# Public repository: fail closed on staged media/archives and common credential
# filenames. It does NOT scan content; humans still review diffs for secrets.
blocked=0
check_path() {
  local original="$1" p base
  p="$(printf '%s' "$original" | tr '[:upper:]' '[:lower:]')"
  base="${p##*/}"
  case "$p" in
    *.mp4|*.mov|*.mkv|*.webm|*.mp3|*.wav|*.flac|*.m4a|*.aac|*.ogg|*.opus|\
    *.png|*.jpg|*.jpeg|*.webp|*.gif|*.bmp|*.svg|*.zip|*.7z|*.tar|*.tar.gz|*.tgz|\
    *.key|*.p12|*.pfx|*.pem|*.env)
      printf 'BLOCKED: media/archive/possible credential in staged path: %s\n' "$original" >&2; blocked=1 ;;
  esac
  case "$base" in
    .env.example) ;;
    .env|.env.*|.netrc|.git-credentials|credentials.json|service-account.json)
      printf 'BLOCKED: possible credential in staged path: %s\n' "$original" >&2; blocked=1 ;;
  esac
}
if [[ "${1:-}" == '--check-paths' ]]; then
  shift
  for p in "$@"; do check_path "$p"; done
elif [[ "${1:-}" == '--stdin0' ]]; then
  while IFS= read -r -d '' p; do [[ -z "$p" ]] || check_path "$p"; done
else
  git rev-parse --show-toplevel >/dev/null
  while IFS= read -r -d '' p; do [[ -z "$p" ]] || check_path "$p"; done < <(git diff --cached --name-only --diff-filter=ACMRT -z)
fi
if ((blocked)); then
  echo 'Do not commit/push. Save media in private Drive and stage only approved non-secret source.' >&2
  exit 1
fi
printf 'PASS filename guard; review staged content manually for secrets and privacy.\n'
