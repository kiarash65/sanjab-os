"""Sanjab CLI — نقطهٔ ورود و dispatch فرمان‌ها + منوی تعاملی.

اجرا: sanjab [--version] یا sanjab <subcommand>. بدون فرمان، منوی تعاملی باز
می‌شود. همهٔ ورودی‌ها EOF/Ctrl+C امن هستند. فقط کتابخانهٔ استاندارد پایتون.
"""
from __future__ import annotations

import argparse
import os
import sys
from typing import Any, Dict, List, Optional

from . import (
    backup,
    config,
    doctor,
    games,
    linuxlab,
    progress,
    ui,
    uninstall,
    update,
    VERSION,
    SPONSOR,
)
from . import lessons

MENU_TITLE = "منوی سان‌جاب"


def cmd_version(args: Any = None) -> int:
    print("Sanjab CLI " + VERSION)
    print(ui.dim("SanjabOS 2.0 — ترمینال آموزشی آفلاین فارسی"))
    print(ui.dim(SPONSOR))
    print(ui.dim("داده‌ها: " + str(config.DATA_DIR)))
    return 0


def print_help() -> None:
    print(ui.head("راهنمای فرمان‌های سان‌جاب"))
    print(ui.hr())
    rows = [
        ("sanjab", "منوی تعاملی"),
        ("sanjab start", "همین منو — حلقهٔ تعاملی"),
        ("sanjab learn [python|rust|linux] [درس]", "درس‌ها — با --list فهرست، --hint راهنما، --solution راه‌حل"),
        ("sanjab game [quiz|typing|memory]", "بازی‌ها — بدون نام، منو باز می‌شود"),
        ("sanjab terminal", "آزمایشگاه لینوکس — شبیه‌ساز امن پوسته"),
        ("sanjab progress [--json]", "پیشرفت کامل"),
        ("sanjab status", "خلاصهٔ وضعیت در یک خط"),
        ("sanjab achievements", "فهرست دستاوردها"),
        ("sanjab doctor", "بررسی محیط (python, rustc, git, disk ...)"),
        ("sanjab config [list | get KEY | set KEY VALUE]", "تنظیمات"),
        ("sanjab backup [--list] [مسیر]", "پشتیبان‌گیری داده‌ها"),
        ("sanjab restore FILE.zip", "بازگردانی با تأیید"),
        ("sanjab update [--check]", "بررسی نسخهٔ جدید — بدون نصب خودکار"),
        ("sanjab uninstall [--keep-data]", "حذف داده با تأیید تایپی"),
        ("sanjab version", "نسخه"),
    ]
    for command, desc in rows:
        print("  " + ui.paint(command.ljust(44), "cyan") + ui.dim(desc))
    print(ui.dim(SPONSOR))


# --------------------------------------------------------------------------
# منوی تعاملی
# --------------------------------------------------------------------------
def _menu_learn() -> None:
    lessons.run()


def _menu_games() -> None:
    games.run()


def _menu_progress() -> None:
    progress.cmd_progress(None)


def _menu_achievements() -> None:
    progress.cmd_achievements(None)


def _menu_doctor() -> None:
    doctor.cmd_doctor(None)


def _menu_config() -> None:
    config.cmd_config(None)
    print(ui.dim("تغییر: مثال بنویس «lang fa» یا «xp_sound on» — Enter یعنی بازگشت."))
    raw = ui.safe_input(ui.dim("تنظیم: "))
    if raw is None:
        return
    parts = ui.to_latin(raw.strip()).split()
    if not parts:
        return
    if len(parts) >= 2 and parts[0] == "set":
        config.set_key(parts[1], parts[2] if len(parts) > 2 else "")
        print(ui.ok("انجام شد — فهرست دوباره:"))
        config.cmd_config(None)
        return
    if parts[0] == "get" and len(parts) > 1:
        config.cmd_config(type("Args", (), {"action": "get", "key": parts[1], "value": None})())
        return
    print(ui.fail("الگوی درست: set KEY VALUE یا get KEY"))


def _menu_backup() -> None:
    print(ui.head("پشتیبان‌گیری"))
    print("  1) گرفتن پشتیبان تازه")
    print("  2) فهرست پشتیبان‌ها")
    print("  3) بازگردانی از فایل")
    print("  0) بازگشت")
    raw = ui.safe_input(ui.dim("انتخاب: "))
    if raw is None:
        return
    choice = ui.to_latin(raw.strip())
    if choice == "1":
        backup.cmd_backup(None)
    elif choice == "2":
        backup.cmd_backup(type("Args", (), {"list": True, "path": None})())
    elif choice == "3":
        path = ui.safe_input(ui.dim("مسیر zip: "))
        if path and path.strip():
            backup.cmd_restore(type("Args", (), {"zip_path": path.strip()})())
    elif choice in ("0", ""):
        return
    else:
        print(ui.fail("انتخاب نامعتبر."))


def _menu_help() -> None:
    print_help()


MENU_ITEMS: List[Dict[str, Any]] = [
    {"key": "0", "title_fa": "خروج", "action": None},
    {"key": "1", "title_fa": "یادگیری", "action": _menu_learn},
    {"key": "2", "title_fa": "بازی‌ها", "action": _menu_games},
    {"key": "3", "title_fa": "پیشرفت", "action": _menu_progress},
    {"key": "4", "title_fa": "دستاوردها", "action": _menu_achievements},
    {"key": "5", "title_fa": "دکتر سیستم", "action": _menu_doctor},
    {"key": "6", "title_fa": "تنظیمات", "action": _menu_config},
    {"key": "7", "title_fa": "پشتیبان‌گیری", "action": _menu_backup},
    {"key": "8", "title_fa": "راهنما", "action": _menu_help},
]


def run_menu() -> int:
    print(ui.banner())
    while True:
        print()
        print(ui.head(MENU_TITLE))
        print(ui.hr())
        for item in MENU_ITEMS:
            if item["key"] == "0":
                print("  0) خروج")
            else:
                print("  " + item["key"] + ") " + str(item["title_fa"]))
        raw = ui.safe_input(ui.dim("انتخاب: "))
        if raw is None:
            print(ui.dim("خروج — امتیازها در " + str(config.DATA_DIR) + " ذخیره ماندند."))
            return 0
        choice = ui.to_latin(raw.strip().lower())
        if choice in ("0", "exit", "quit", "q", "خروج"):
            print(ui.dim("خداحافظ — امتیازها ذخیره ماندند. " + SPONSOR))
            return 0
        if choice in ("help", "راهنما", "8"):
            _menu_help()
            continue
        if choice in ("1", "learn", "یادگیری"):
            _menu_learn()
            continue
        if choice in ("2", "games", "game", "بازی‌ها"):
            _menu_games()
            continue
        if choice in ("3", "progress", "پیشرفت"):
            _menu_progress()
            continue
        if choice in ("4", "achievements", "دستاوردها"):
            _menu_achievements()
            continue
        if choice in ("5", "doctor", "دکتر سیستم"):
            _menu_doctor()
            continue
        if choice in ("6", "config", "تنظیمات"):
            _menu_config()
            continue
        if choice in ("7", "backup", "پشتیبان‌گیری"):
            _menu_backup()
            continue
        if choice == "version":
            cmd_version(None)
            continue
        print(ui.fail("انتخاب نامعتبر — عدد 0 تا 8 یا نام گزینه را بزن."))


# --------------------------------------------------------------------------
# argparse
# --------------------------------------------------------------------------
def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="sanjab",
        description="Sanjab CLI — ترمینال آموزشی آفلاین و فارسی‌محور SanjabOS 2.0 (پایتون، راست، لینوکس)",
        epilog="داده‌ها در ~/.sanjabos — امتیازها idempotent هستند. " + SPONSOR,
    )
    parser.add_argument(
        "--version",
        action="version",
        version="sanjab-cli " + VERSION + " — " + SPONSOR,
    )
    subparsers = parser.add_subparsers(dest="command", metavar="<command>")

    subparsers.add_parser("version", help="نمایش نسخه")
    subparsers.add_parser("start", help="منوی تعاملی")

    subparsers.add_parser("doctor", help="بررسی محیط با جدول PASS/WARN/FAIL")
    subparsers.add_parser("status", help="خلاصهٔ وضعیت در یک خط")

    learn = subparsers.add_parser("learn", help="درس‌ها — مسیرها: python/rust/linux")
    learn.add_argument("track", nargs="?", help="python | rust | linux")
    learn.add_argument("lesson_id", nargs="?", help="شناسهٔ درس مثل 01")
    learn.add_argument("--list", action="store_true", help="فهرست درس‌ها")
    learn.add_argument("--hint", action="store_true", help="نمایش راهنمای درس")
    learn.add_argument("--solution", action="store_true", help="نمایش راه‌حل درس")

    game = subparsers.add_parser("game", help="بازی‌ها: quiz / typing / memory")
    game.add_argument("name", nargs="?", help="quiz | typing | memory — بدون نام منو باز می‌شود")
    subparsers.add_parser("games", help="همان game (نام مستعار)")

    prog = subparsers.add_parser("progress", help="پیشرفت کامل")
    prog.add_argument("--json", action="store_true", help="خروجی JSON")

    subparsers.add_parser("achievements", help="فهرست دستاوردها")
    subparsers.add_parser("terminal", help="آزمایشگاه لینوکس — شبیه‌ساز امن")

    config_parser = subparsers.add_parser("config", help="تنظیمات: list / get KEY / set KEY VALUE")
    config_parser.add_argument("action", nargs="?", choices=["list", "get", "set"])
    config_parser.add_argument("key", nargs="?")
    config_parser.add_argument("value", nargs="?")

    backup_parser = subparsers.add_parser("backup", help="پشتیبان‌گیری داده")
    backup_parser.add_argument("--list", action="store_true", help="فهرست پشتیبان‌های خانه")
    backup_parser.add_argument("path", nargs="?", help="مسیر خروجی zip (اختیاری)")

    restore = subparsers.add_parser("restore", help="بازگردانی از zip با تأیید")
    restore.add_argument("zip_path", nargs="?", help="مسیر فایل zip")

    upd = subparsers.add_parser("update", help="بررسی نسخهٔ جدید گیت‌هاب — بدون نصب خودکار")
    upd.add_argument("--check", action="store_true", help="فقط بررسی (پیش‌فرض هم همین است)")

    un = subparsers.add_parser("uninstall", help="حذف داده با تأیید تایپی")
    un.add_argument("--keep-data", dest="keep_data", action="store_true", help="داده‌ها حذف نشوند")

    return parser


def dispatch(args: argparse.Namespace) -> int:
    command = getattr(args, "command", None)
    if command is None:
        return run_menu()
    if command == "version":
        return cmd_version(args)
    if command == "start":
        return run_menu()
    if command == "doctor":
        return doctor.cmd_doctor(args)
    if command == "status":
        return progress.cmd_status(args)
    if command == "learn":
        return lessons.cmd_learn(args)
    if command in ("game", "games"):
        return games.cmd_game(args)
    if command == "progress":
        return progress.cmd_progress(args)
    if command == "achievements":
        return progress.cmd_achievements(args)
    if command == "config":
        return config.cmd_config(args)
    if command == "backup":
        return backup.cmd_backup(args)
    if command == "restore":
        return backup.cmd_restore(args)
    if command == "update":
        return update.cmd_update(args)
    if command == "terminal":
        return linuxlab.cmd_terminal(args)
    if command == "uninstall":
        return uninstall.cmd_uninstall(args)
    print(ui.fail("فرمان ناشناخته: " + str(command)))
    return 2


def main(argv: Optional[List[str]] = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        return int(dispatch(args))
    except BrokenPipeError:
        # خروجی لوله بسته شد (مثلاً sanjab progress | head) — خروج تمیز
        try:
            os.dup2(os.open(os.devnull, os.O_WRONLY), sys.stdout.fileno())
        except Exception:
            pass
        return 0
    except KeyboardInterrupt:
        print()
        print(ui.dim("قطع شد — امتیازها ذخیره ماندند."))
        return 130
    except EOFError:
        print()
        print(ui.dim("پایان ورودی — امتیازها ذخیره ماندند."))
        return 0


if __name__ == "__main__":
    sys.exit(main())
