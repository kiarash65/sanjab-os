"""پشتیبان‌گیری و بازگردانی دادهٔ سان‌جاب (~/.sanjabos) با zipfile استاندارد.

فقط فایل‌های json پروژه داخل zip می‌روند و در بازگردانی هم فقط همان‌ها با
اعتبارسنجی مسیر (بدون .. و مسیر مطلق) استخراج می‌شوند — به‌صورت پیش‌فرض فایل
موجود با پسوند .bak نگه داشته می‌شود.
"""
from __future__ import annotations

import datetime as dt
import zipfile
from pathlib import Path
from typing import Any, List, Optional

from . import ui
from .config import DATA_DIR

ALLOWED_FILES = ("config.json", "progress.json")


def _backup_glob() -> str:
    return "sanjab-backup-*.zip"


def default_backup_path() -> Path:
    stamp = dt.datetime.now().strftime("%Y%m%d-%H%M%S")
    return Path.home() / ("sanjab-backup-" + stamp + ".zip")


def make_backup(path: Optional[Path] = None) -> Optional[Path]:
    target = path if path else default_backup_path()
    if not DATA_DIR.exists():
        print(ui.warn("داده‌ای برای پشتیبان‌گیری نیست: " + str(DATA_DIR)))
        return None
    try:
        target.parent.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(target, "w", compression=zipfile.ZIP_DEFLATED) as zf:
            for name in ALLOWED_FILES:
                source = DATA_DIR / name
                if source.exists():
                    zf.write(source, arcname=name)
        return target
    except Exception as exc:
        print(ui.fail("ساخت پشتیبان ناموفق بود: " + str(exc)))
        return None


def list_backups() -> List[Path]:
    home = Path.home()
    try:
        return sorted(home.glob(_backup_glob()))
    except Exception:
        return []


def _safe_members(zf: zipfile.ZipFile) -> List[str]:
    safe: List[str] = []
    for member in zf.namelist():
        if member in ALLOWED_FILES:
            safe.append(member)
            continue
        if member.startswith(ALLOWED_FILES[0] + ".") or member.startswith(ALLOWED_FILES[1] + "."):
            safe.append(member)
    return safe


def cmd_backup(args: Any = None) -> int:
    if args is not None and getattr(args, "list", False):
        backups = list_backups()
        print(ui.head("پشتیبان‌های موجود در خانه — " + _backup_glob()))
        if not backups:
            print(ui.dim("  هنوز پشتیبانی نیست — بساز: sanjab backup"))
        for item in backups:
            size_kb = max(1, int(item.stat().st_size / 1024))
            print("  " + item.name + "  " + ui.dim(ui.fa_num(size_kb) + " KB"))
        return 0

    custom = getattr(args, "path", None)
    target = make_backup(Path(custom) if custom else None)
    if target is None:
        return 1
    print(ui.ok("پشتیبان ساخته شد: " + str(target)))
    print(ui.dim("بازگردانی: sanjab restore " + str(target)))
    return 0


def cmd_restore(args: Any = None) -> int:
    zip_path = getattr(args, "zip_path", None)
    if not zip_path:
        print(ui.fail("الگوی درست: sanjab restore FILE.zip"))
        return 2
    source = Path(str(zip_path)).expanduser()
    if not source.exists():
        print(ui.fail("فایل پیدا نشد: " + str(source)))
        return 1
    try:
        zf = zipfile.ZipFile(source, "r")
    except Exception as exc:
        print(ui.fail("فایل zip معتبر نیست: " + str(exc)))
        return 1
    with zf:
        members = _safe_members(zf)
        if not members:
            print(ui.fail("هیچ فایل دادهٔ شناخته‌شده‌ای (" + ", ".join(ALLOWED_FILES) + ") داخل این zip نیست."))
            return 1
        print(ui.head("بازگردانی از: " + str(source)))
        for member in members:
            print("  - " + member)
        print(ui.warn("فایل‌های موجود در " + str(DATA_DIR) + " جایگزین می‌شوند (نسخهٔ قبلی با .bak نگه داشته می‌شود)."))
        if not ui.ask_yes_no(ui.dim("ادامه می‌دهی؟")):
            print(ui.dim("بازگردانی لغو شد — هیچ فایلی تغییر نکرد."))
            return 1
        restored = 0
        for member in members:
            try:
                target = DATA_DIR / member
                if target.exists():
                    backup_name = target.with_suffix(target.suffix + ".bak")
                    backup_name.write_bytes(target.read_bytes())
                DATA_DIR.mkdir(parents=True, exist_ok=True)
                target.write_bytes(zf.read(member))
                restored += 1
            except Exception as exc:
                print(ui.fail("استخراج " + member + " ناموفق بود: " + str(exc)))
        if restored:
            print(ui.ok("بازگردانی کامل شد (" + ui.fa_num(restored) + " فایل). سان‌جاب را دوباره باز کن."))
        return 0 if restored else 1
