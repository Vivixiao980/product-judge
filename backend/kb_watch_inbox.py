import os
import subprocess
from watchfiles import watch

ROOT = "/Users/vivi/Documents/产品思考工具/产品知识库"
INBOX_DIR = os.path.join(ROOT, "原始数据", "待处理")
PROCESS_SCRIPT = "/Users/vivi/Documents/产品思考工具/backend/kb_process_inbox.sh"
SPARKS_SCRIPT = "/Users/vivi/Documents/产品思考工具/backend/generate_sparks_cards.py"
SPARKS_REVIEW = "/Users/vivi/Documents/产品思考工具/backend/sparks_review.py"
VENV_PY = "/Users/vivi/Documents/产品思考工具/backend/venv/bin/python"

ESSENTIAL_DIRS = [
    os.path.join(ROOT, "01-产品与设计"),
    os.path.join(ROOT, "02-商业与战略"),
    os.path.join(ROOT, "03-思维与认知"),
    os.path.join(ROOT, "04-成长与效能"),
    os.path.join(ROOT, "05-技术与AI"),
    os.path.join(ROOT, "06-其他"),
]

os.makedirs(INBOX_DIR, exist_ok=True)

WATCH_DIRS = [INBOX_DIR, *ESSENTIAL_DIRS]

print(f"[kb] watching: {', '.join(WATCH_DIRS)}")

def run_sparks() -> None:
    try:
        if os.path.exists(VENV_PY):
            subprocess.run([VENV_PY, SPARKS_SCRIPT], check=False)
        else:
            subprocess.run(["python", SPARKS_SCRIPT], check=False)
    except Exception as exc:
        print(f"[kb] sparks failed: {exc}")


for changes in watch(*WATCH_DIRS):
    changed_paths = {path for _change, path in changes}
    if any(path.startswith(INBOX_DIR) for path in changed_paths):
        try:
            subprocess.run([PROCESS_SCRIPT, INBOX_DIR], check=False)
        except Exception as exc:
            print(f"[kb] process failed: {exc}")
        continue

    if any(any(path.startswith(d) for d in ESSENTIAL_DIRS) for path in changed_paths):
        try:
            if os.path.exists(VENV_PY):
                subprocess.run([VENV_PY, SPARKS_REVIEW, "--scan"], check=False)
            else:
                subprocess.run(["python", SPARKS_REVIEW, "--scan"], check=False)
        except Exception as exc:
            print(f"[kb] sparks review failed: {exc}")
        run_sparks()
