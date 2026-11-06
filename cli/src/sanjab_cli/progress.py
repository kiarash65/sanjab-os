"""پیشرفت و دستاوردهای سان‌جاب — خروجی XP، سطح، استریک، کوئست و تاریخچه.

--json خروجی ماشینی می‌دهد؛ بقیهٔ خروجی‌ها جدول فارسی رنگی است.
"""
from __future__ import annotations

import json
from typing import Any, Dict, Optional

from . import ui
from .config import get as cfg_get
from .gamification import (
    ACHIEVEMENTS,
    get_stats,
    level_for_xp,
    load_state,
    quest_status,
    xp_for_level,
)


def _bar(current: int, total: int, width: int = 24) -> str:
    if total <= 0:
        return "[" + "-" * width + "]"
    filled = int(width * min(1.0, current / total))
    return "[" + "#" * filled + "." * (width - filled) + "]"


def _progress_lines(state: Dict[str, Any]) -> list:
    stats = get_stats(state)
    total_xp = stats["total_xp"]
    level = stats["level"]
    level_start = xp_for_level(level)
    level_end = xp_for_level(level + 1)
    into_level = total_xp - level_start
    span = max(1, level_end - level_start)
    quest, quest_done = quest_status(state)
    lines = [
        ui.head("پیشرفت سان‌جاب"),
        ui.hr(),
        "  سطح: " + ui.fa_num(level) + "   امتیاز کل: " + ui.fa_num(total_xp),
        "  " + _bar(into_level, span) + "  " + ui.dim(ui.fa_num(into_level) + "/" + ui.fa_num(span) + " تا سطح " + ui.fa_num(level + 1)),
        "  استریک: " + ui.fa_num(stats["streak_current"]) + " روز (رکورد: " + ui.fa_num(stats["streak_best"]) + ")",
        "",
        ui.head("درس‌ها"),
        "  پایتون: " + ui.fa_num(stats["python_completed"]) + "/" + ui.fa_num(stats["python_total"]) + "  " + _bar(stats["python_completed"], stats["python_total"], 18),
        "  راست:   " + ui.fa_num(stats["rust_completed"]) + "/" + ui.fa_num(stats["rust_total"]) + "  " + _bar(stats["rust_completed"], stats["rust_total"], 18),
        "  لینوکس: " + ui.fa_num(stats["linux_completed"]) + "/" + ui.fa_num(stats["linux_total"]) + "  " + _bar(stats["linux_completed"], stats["linux_total"], 18),
        "",
        ui.head("بازی‌ها و کوئست"),
        "  دورهای بازی: " + ui.fa_num(stats["games_played"]) + "   دستاوردها: " + ui.fa_num(stats["achievements_count"]) + "/" + ui.fa_num(len(ACHIEVEMENTS)),
        "  کوئست امروز: " + str(quest["title_fa"]) + ("  " + ui.ok("[done]") if quest_done else "  " + ui.dim("[منتظر تو است]")),
    ]
    return lines


def cmd_progress(args: Optional[Any] = None) -> int:
    state = load_state()
    if args is not None and getattr(args, "json", False):
        stats = get_stats(state)
        payload = dict(stats)
        payload["name"] = cfg_get("name", "") or None
        payload["today_quest"] = quest_status(state)[0]
        payload["today_quest_done"] = quest_status(state)[1]
        print(json.dumps(payload, ensure_ascii=False, indent=2))
        return 0
    for line in _progress_lines(state):
        print(line)
    history = state.get("history", [])[-5:]
    if history:
        print()
        print(ui.head("آخرین رویدادهای امتیاز"))
        for item in reversed(history):
            amount = int(item.get("amount", 0))
            marker = ui.ok("+" + str(amount)) if amount >= 0 else ui.fail(str(amount))
            print("  " + marker + "  " + ui.dim(str(item.get("ts", "")) + " — ") + str(item.get("reason", "")))
    return 0


def cmd_status(args: Optional[Any] = None) -> int:
    state = load_state()
    stats = get_stats(state)
    name = cfg_get("name", "")
    who = " (" + str(name) + ")" if name else ""
    print(
        "sanjab status — سطح "
        + ui.fa_num(stats["level"])
        + who
        + " | "
        + ui.fa_num(stats["total_xp"])
        + " XP | درس‌ها: "
        + ui.fa_num(stats["lessons_completed"])
        + " | استریک: "
        + ui.fa_num(stats["streak_current"])
        + " روز"
    )
    print(ui.dim("جزئیات کامل: sanjab progress"))
    return 0


def cmd_achievements(args: Optional[Any] = None) -> int:
    state = load_state()
    stats = get_stats(state)
    print(ui.head("دستاوردهای سان‌جاب — " + ui.fa_num(stats["achievements_count"]) + "/" + ui.fa_num(len(ACHIEVEMENTS))))
    print(ui.hr())
    for achievement in ACHIEVEMENTS:
        earned = achievement["id"] in state.get("achievements", [])
        marker = ui.ok("[+]") if earned else ui.dim("[ ]")
        title = str(achievement["title_fa"])
        if earned:
            title = ui.ok(title)
        print("  " + marker + " " + title.ljust(24) + ui.dim(str(achievement["desc_fa"])))
    print(ui.dim("هر دستاورد جدید ۱۰ امتیاز اضافه می‌دهد."))
    return 0
