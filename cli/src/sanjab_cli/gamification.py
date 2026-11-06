"""موتور امتیاز و انگیزش سان‌جاب: XP، سطح، دستاورد، استریک، کوئست روزانه.

منحنی سطح: level = floor(sqrt(xp / 100)) + 1.
داده‌ها در ~/.sanjabos/progress.json ذخیره می‌شوند. همهٔ رویدادهای امتیاز
«شناسهٔ رویداد» دارند و تکرارشان امتیاز دوباره حساب نمی‌کند (idempotent).
"""
from __future__ import annotations

import datetime as dt
import json
import math
import random
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional

from .config import DATA_DIR

PROGRESS_FILE: Path = DATA_DIR / "progress.json"

HISTORY_LIMIT = 60
FIRST_TRY_BONUS = 5
STREAK_BONUS = 10
ACHIEVEMENT_BONUS = 10
QUEST_XP_DEFAULT = 20


def level_for_xp(xp: int) -> int:
    return math.isqrt(max(0, int(xp)) // 100) + 1


def xp_for_level(level: int) -> int:
    """حداقل امتیاز لازم برای رسیدن به سطح داده‌شده."""
    if level <= 1:
        return 0
    return (level - 1) ** 2 * 100


def _today() -> str:
    return dt.date.today().isoformat()


def _now() -> str:
    return dt.datetime.now().isoformat(timespec="seconds")


def _default_state() -> Dict[str, Any]:
    return {
        "version": "2.0.0",
        "xp": 0,
        "events": {},
        "lessons": {},
        "exercises": {},
        "games": {},
        "streak": {"last_date": None, "current": 0, "best": 0},
        "achievements": [],
        "quests": {},
        "history": [],
    }


def load_state() -> Dict[str, Any]:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not PROGRESS_FILE.exists():
        state = _default_state()
        save_state(state)
        return state
    try:
        data = json.loads(PROGRESS_FILE.read_text(encoding="utf-8"))
        if not isinstance(data, dict):
            raise ValueError("bad state file")
    except Exception:
        state = _default_state()
        save_state(state)
        return state
    base = _default_state()
    for key, value in data.items():
        base[key] = value
    return base


def save_state(state: Dict[str, Any]) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    tmp = PROGRESS_FILE.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp.replace(PROGRESS_FILE)


def _apply(state: Dict[str, Any], amount: int, reason: str, event_id: Optional[str]) -> bool:
    """ثبت یک رویداد امتیاز؛ اگر شناسه تکراری باشد کاری نمی‌کند."""
    if event_id and event_id in state["events"]:
        return False
    state["xp"] = int(state.get("xp", 0)) + int(amount)
    if event_id:
        state["events"][event_id] = {"xp": int(amount), "reason": reason, "date": _today()}
    state["history"].append({"ts": _now(), "amount": int(amount), "reason": reason})
    del state["history"][:-HISTORY_LIMIT]
    return True


def _touch_streak(state: Dict[str, Any], messages: List[str]) -> None:
    today = _today()
    streak = state.setdefault("streak", {"last_date": None, "current": 0, "best": 0})
    if streak.get("last_date") == today:
        return
    yesterday = (dt.date.today() - dt.timedelta(days=1)).isoformat()
    streak["current"] = (int(streak.get("current", 0)) + 1) if streak.get("last_date") == yesterday else 1
    streak["best"] = max(int(streak.get("best", 0)), streak["current"])
    streak["last_date"] = today
    if _apply(state, STREAK_BONUS, "فعالیت روزانه — استریک " + str(streak["current"]) + " روزه", "streak:" + today):
        messages.append("+%d امتیاز — روز %d استریک" % (STREAK_BONUS, streak["current"]))


def get_stats(state: Dict[str, Any]) -> Dict[str, int]:
    from .content import TRACK_SIZES

    lessons = state.get("lessons", {})
    games = state.get("games", {})
    total_xp = int(state.get("xp", 0))
    return {
        "total_xp": total_xp,
        "level": level_for_xp(total_xp),
        "lessons_completed": len(lessons),
        "python_completed": sum(1 for key in lessons if key.startswith("python:")),
        "rust_completed": sum(1 for key in lessons if key.startswith("rust:")),
        "linux_completed": sum(1 for key in lessons if key.startswith("linux:")),
        "python_total": TRACK_SIZES.get("python", 0),
        "rust_total": TRACK_SIZES.get("rust", 0),
        "linux_total": TRACK_SIZES.get("linux", 0),
        "first_try_count": len(state.get("exercises", {})),
        "games_played": sum(int(g.get("plays", 0)) for g in games.values()),
        "quests_done": len(state.get("quests", {})),
        "streak_current": int(state.get("streak", {}).get("current", 0)),
        "streak_best": int(state.get("streak", {}).get("best", 0)),
        "achievements_count": len(state.get("achievements", [])),
    }


ACHIEVEMENTS: List[Dict[str, Any]] = [
    {"id": "a_first_step", "title_fa": "اولین گام", "desc_fa": "اولین درس را کامل کن", "cond": lambda s: s["lessons_completed"] >= 1},
    {"id": "a_python_3", "title_fa": "پایتون‌باز تازه‌کار", "desc_fa": "۳ درس پایتون را کامل کن", "cond": lambda s: s["python_completed"] >= 3},
    {"id": "a_python_all", "title_fa": "فارغ‌تحصیل پایتون", "desc_fa": "همهٔ درس‌های پایتون را تمام کن", "cond": lambda s: s["python_total"] > 0 and s["python_completed"] >= s["python_total"]},
    {"id": "a_rust_5", "title_fa": "راست‌خوان", "desc_fa": "۵ درس راست را کامل کن", "cond": lambda s: s["rust_completed"] >= 5},
    {"id": "a_linux_3", "title_fa": "پنگوئن‌پرور", "desc_fa": "۳ درس لینوکس را کامل کن", "cond": lambda s: s["linux_completed"] >= 3},
    {"id": "a_linux_all", "title_fa": "مدیر ترمینال", "desc_fa": "همهٔ درس‌های لینوکس را تمام کن", "cond": lambda s: s["linux_total"] > 0 and s["linux_completed"] >= s["linux_total"]},
    {"id": "a_games_3", "title_fa": "بازیباز", "desc_fa": "۳ بار بازی کن", "cond": lambda s: s["games_played"] >= 3},
    {"id": "a_streak_3", "title_fa": "پیوستهٔ سه‌روزه", "desc_fa": "۳ روز پشت هم فعال باش", "cond": lambda s: s["streak_best"] >= 3},
    {"id": "a_streak_7", "title_fa": "هفتهٔ کامل", "desc_fa": "۷ روز پشت هم فعال باش", "cond": lambda s: s["streak_best"] >= 7},
    {"id": "a_xp_500", "title_fa": "۵۰۰ امتیازی", "desc_fa": "۵۰۰ امتیاز جمع کن", "cond": lambda s: s["total_xp"] >= 500},
    {"id": "a_xp_2000", "title_fa": "۲۰۰۰ امتیازی", "desc_fa": "۲۰۰۰ امتیاز جمع کن", "cond": lambda s: s["total_xp"] >= 2000},
    {"id": "a_first_try_5", "title_fa": "تک‌تلاش", "desc_fa": "۵ تمرین را اولین بار درست حل کن", "cond": lambda s: s["first_try_count"] >= 5},
    {"id": "a_quest_3", "title_fa": "کوئست‌باز", "desc_fa": "۳ کوئست روزانه را کامل کن", "cond": lambda s: s["quests_done"] >= 3},
    {"id": "a_level_5", "title_fa": "سطح ۵", "desc_fa": "به سطح ۵ برس", "cond": lambda s: s["level"] >= 5},
]


def _eval_achievements(state: Dict[str, Any], messages: List[str]) -> None:
    stats = get_stats(state)
    for ach in ACHIEVEMENTS:
        if ach["id"] in state["achievements"]:
            continue
        try:
            earned = bool(ach["cond"](stats))
        except Exception:
            earned = False
        if earned:
            state["achievements"].append(ach["id"])
            if _apply(state, ACHIEVEMENT_BONUS, "دستاورد: " + ach["title_fa"], "ach:" + ach["id"]):
                messages.append("+%d امتیاز — دستاورد جدید: %s" % (ACHIEVEMENT_BONUS, ach["title_fa"]))


DAILY_QUESTS: List[Dict[str, Any]] = [
    {"id": "q_lesson", "title_fa": "امروز یک درس را کامل کن", "kind": "lesson", "xp": QUEST_XP_DEFAULT},
    {"id": "q_game", "title_fa": "امروز یک بازی بازی کن", "kind": "game", "xp": 15},
    {"id": "q_xp50", "title_fa": "امروز ۵۰ امتیاز بگیر", "kind": "xp", "target": 50, "xp": QUEST_XP_DEFAULT},
]


def today_quest(state: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """کوئست امروز به‌صورت قطعی (deterministic) از تاریخ انتخاب می‌شود."""
    seed = "sanjab-quest:" + _today()
    return DAILY_QUESTS[random.Random(seed).randrange(len(DAILY_QUESTS))]


def quest_status(state: Dict[str, Any]) -> tuple:
    quest = today_quest(state)
    done_key = "quest:" + _today() + ":" + quest["id"]
    return quest, done_key in state.get("events", {})


def _check_quest(state: Dict[str, Any], messages: List[str]) -> None:
    quest, done = quest_status(state)
    if done:
        return
    today = _today()
    met = False
    kind = quest["kind"]
    if kind == "lesson":
        met = any(v.get("date") == today for v in state.get("lessons", {}).values())
    elif kind == "game":
        met = any(g.get("last_date") == today for g in state.get("games", {}).values())
    elif kind == "xp":
        total = sum(int(e.get("xp", 0)) for e in state.get("events", {}).values() if e.get("date") == today)
        met = total >= int(quest.get("target", 50))
    if met and _apply(state, int(quest["xp"]), "کوئست روزانه: " + quest["title_fa"], "quest:" + today + ":" + quest["id"]):
        state["quests"][_today()] = quest["id"]
        messages.append("+%s امتیاز — کوئست روزانه انجام شد: %s" % (quest["xp"], quest["title_fa"]))


def add_xp(amount: int, reason: str, event_id: Optional[str] = None) -> Dict[str, Any]:
    """اعطای امتیاز با dedup رویداد + استریک + دستاورد + کوئست. خروجی پیام‌های فارسی است."""
    state = load_state()
    before_level = level_for_xp(int(state.get("xp", 0)))
    messages: List[str] = []
    awarded = True
    if event_id and event_id in state["events"]:
        awarded = False
        messages.append("این رویداد قبلاً ثبت شده و امتیازش تکرار نشد: " + event_id)
    else:
        _apply(state, amount, reason, event_id)
        messages.append("+%d امتیاز — %s" % (amount, reason))
    _touch_streak(state, messages)
    _eval_achievements(state, messages)
    _check_quest(state, messages)
    save_state(state)
    total = int(state["xp"])
    return {
        "awarded": awarded,
        "total_xp": total,
        "level": level_for_xp(total),
        "level_up": level_for_xp(total) > before_level,
        "messages": messages,
    }


def record_lesson(track: str, lesson_id: str, xp: int, first_try: bool) -> Dict[str, Any]:
    """ثبت درس کامل‌شده + پاداش اولین تلاش؛ شناسهٔ رویداد تکرارناپذیر است."""
    state = load_state()
    key = track + ":" + lesson_id
    lessons = state.setdefault("lessons", {})
    rec = lessons.get(key, {})
    rec["completed"] = True
    rec["date"] = _today()
    if first_try:
        rec["first_try"] = True
        state.setdefault("exercises", {})[key] = {"first_try": True, "date": _today()}
    lessons[key] = rec
    save_state(state)
    result = add_xp(xp, "درس کامل شد: " + track + " " + lesson_id, "lesson:" + track + ":" + lesson_id)
    if first_try:
        bonus = add_xp(FIRST_TRY_BONUS, "تمرین در اولین تلاش درست بود", "exercise:" + track + ":" + lesson_id + ":first")
        result["messages"].extend(bonus["messages"])
    result["total_xp"] = int(load_state()["xp"])
    result["level"] = level_for_xp(result["total_xp"])
    return result


def record_game(game_id: str, score: int, xp: int) -> Dict[str, Any]:
    """ثبت یک دور بازی؛ هر دور رویداد منحصربه‌فرد خودش را دارد."""
    state = load_state()
    games = state.setdefault("games", {})
    entry = games.setdefault(game_id, {"plays": 0, "best_score": 0, "last_score": 0, "last_date": None})
    entry["plays"] = int(entry.get("plays", 0)) + 1
    entry["last_score"] = int(score)
    entry["best_score"] = max(int(entry.get("best_score", 0)), int(score))
    entry["last_date"] = _today()
    save_state(state)
    stamp = dt.datetime.now().strftime("%Y%m%d-%H%M%S")
    return add_xp(int(xp), "بازی " + game_id + " — نتیجه " + str(score), "game:" + game_id + ":" + stamp)
