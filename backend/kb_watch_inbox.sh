#!/usr/bin/env bash
set -euo pipefail

VENV_PY="/Users/vivi/Documents/产品思考工具/backend/venv/bin/python"
SCRIPT="/Users/vivi/Documents/产品思考工具/backend/kb_watch_inbox.py"

if [[ -x "$VENV_PY" ]]; then
  exec "$VENV_PY" "$SCRIPT"
fi

exec python "$SCRIPT"
