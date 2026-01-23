import json
import os
import sys
from pathlib import Path

ROOT = "/Users/vivi/Documents/产品思考工具"
KB_DIR = Path(ROOT) / "产品知识库"
CONFIG = Path(ROOT) / "backend" / "sparks_sources.json"
ESSENTIAL_DIRS = [
    KB_DIR / "01-产品与设计",
    KB_DIR / "02-商业与战略",
    KB_DIR / "03-思维与认知",
    KB_DIR / "04-成长与效能",
    KB_DIR / "05-技术与AI",
    KB_DIR / "06-其他",
]


def load_config() -> dict:
    if CONFIG.exists():
        with CONFIG.open("r", encoding="utf-8") as f:
            return json.load(f)
    return {"org_evolution_dir": "", "approved": [], "pending": []}


def save_config(cfg: dict) -> None:
    CONFIG.parent.mkdir(parents=True, exist_ok=True)
    with CONFIG.open("w", encoding="utf-8") as f:
        json.dump(cfg, f, ensure_ascii=False, indent=2)


def scan_pending(cfg: dict) -> list[str]:
    approved = set(cfg.get("approved", []))
    pending = set(cfg.get("pending", []))

    found: list[str] = []
    for base in ESSENTIAL_DIRS:
        if not base.exists():
            continue
        for path in base.rglob("*"):
            if path.suffix.lower() not in {".md", ".txt"}:
                continue
            rel = path.relative_to(KB_DIR).as_posix()
            found.append(rel)
            if rel not in approved and rel not in pending:
                pending.add(rel)

    cfg["pending"] = sorted(pending)
    save_config(cfg)
    return sorted(set(found))


def approve_items(cfg: dict, items: list[str]) -> None:
    pending = set(cfg.get("pending", []))
    approved = set(cfg.get("approved", []))

    for item in items:
        if item in pending:
            pending.remove(item)
        approved.add(item)

    cfg["pending"] = sorted(pending)
    cfg["approved"] = sorted(approved)
    save_config(cfg)


def main() -> None:
    cfg = load_config()
    args = sys.argv[1:]

    if not args or args[0] == "--scan":
        scan_pending(cfg)
        print("Pending items updated.")
        return

    if args[0] == "--approve":
        approve_items(cfg, args[1:])
        print("Approved items updated.")
        return

    if args[0] == "--list":
        print("Pending:")
        for item in cfg.get("pending", []):
            print(f"- {item}")
        return

    print("Usage:")
    print("  python sparks_review.py --scan")
    print("  python sparks_review.py --list")
    print("  python sparks_review.py --approve <relative/path>")


if __name__ == "__main__":
    main()
