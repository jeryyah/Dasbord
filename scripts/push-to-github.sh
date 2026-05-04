#!/usr/bin/env bash
set -euo pipefail

REPO="https://github.com/jeryyah/Dasbord.git"
REMOTE="github-auto"

if [ -z "${TOKENS_ACCES:-}" ]; then
  echo "[auto-push] ERROR: TOKENS_ACCES secret not set. Exiting."
  exit 1
fi

REMOTE_URL="https://${TOKENS_ACCES}@github.com/jeryyah/Dasbord.git"

git config user.email "auto-push@replit.com" 2>/dev/null || true
git config user.name "Replit Auto-Push" 2>/dev/null || true

if git remote get-url "$REMOTE" &>/dev/null; then
  git remote set-url "$REMOTE" "$REMOTE_URL"
else
  git remote add "$REMOTE" "$REMOTE_URL"
fi

LAST_PUSHED=""

echo "[auto-push] Started. Watching for new commits to push to GitHub..."

while true; do
  CURRENT=$(git --no-optional-locks rev-parse HEAD 2>/dev/null || echo "")

  if [ -n "$CURRENT" ] && [ "$CURRENT" != "$LAST_PUSHED" ]; then
    echo "[auto-push] New commit detected: ${CURRENT:0:8} — pushing to GitHub..."
    if git push "$REMOTE" main --force 2>&1; then
      echo "[auto-push] Pushed successfully: ${CURRENT:0:8}"
      LAST_PUSHED="$CURRENT"
    else
      echo "[auto-push] Push failed, will retry in 30s..."
    fi
  fi

  sleep 15
done
