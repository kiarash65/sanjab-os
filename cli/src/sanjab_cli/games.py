"""بازی‌های سان‌جاب — کوئیز، تایپ و حافظه؛ همه آفلاین و EOF امن.

هر دور بازی با gamification.record_game ثبت می‌شود؛ امتیاز XP بر اساس نتیجه است.
هیچ وابستگی خارجی وجود ندارد.
"""
from __future__ import annotations

import random
import time
from typing import Any, Dict, List, Optional

from . import ui

GAME_LABELS: Dict[str, str] = {
    "quiz": "کوئیز دانش",
    "typing": "سرعت تایپ",
    "memory": "حافظهٔ عددی",
}

ROUNDS_PER_GAME = 5

QUIZ_BANK: List[Dict[str, Any]] = [
    {"q": "در پایتون کدام یک عدد صحیح است؟", "options": ["3.14", "7", '"hi"', "True"], "answer": 2},
    {"q": "کدام فرمان محتوای پوشه را نشان می‌دهد؟", "options": ["cd", "pwd", "ls", "rm"], "answer": 3},
    {"q": "در راست نقطهٔ ورود برنامه چیست؟", "options": ["fn start()", "fn main()", "def main()", "init()"], "answer": 2},
    {"q": "خروجی print(len(\"sanjab\")) در پایتون چیست؟", "options": ["5", "6", "7", "خطا"], "answer": 2},
    {"q": "کدام فرمان فایل می‌سازد (خالی)؟", "options": ["mkdir", "touch", "cp", "mv"], "answer": 2},
    {"q": "let mut در راست یعنی چه؟", "options": ["ثابت", "تغییرپذیر", "عمومی", "خصوصی"], "answer": 2},
    {"q": "چاپ در راست با کدام ماکرو انجام می‌شود؟", "options": ["print()", "echo", "println!", "log()"], "answer": 3},
    {"q": "در لینوکس ~ یعنی چه؟", "options": ["ریشه", "خانهٔ کاربر", "پوشهٔ فعلی", "پوشهٔ بالا"], "answer": 2},
    {"q": "کدام فرمان جستجوی متن در فایل است؟", "options": ["grep", "find", "cat", "chmod"], "answer": 1},
    {"q": "list comprehension در پایتون کدام است؟", "options": ["(x for x)", "[x for x in items]", "{x: x}", "for x in items"], "answer": 2},
    {"q": "chmod 600 یعنی چه؟", "options": ["همه همه‌چیز", "مالک خواندن+نوشتن، بقیه هیچ", "فقط اجرا", "خواندن برای همه"], "answer": 2},
    {"q": "پایپ | در شل چه می‌کند؟", "options": ["فایل می‌سازد", "خروجی را به فرمان بعدی می‌دهد", "حذف می‌کند", "کپی می‌کند"], "answer": 2},
    {"q": "مقدار پیش‌فرض تابع پایتون بدون return چیست؟", "options": ["0", "None", "خطا", "rشتهٔ خالی"], "answer": 2},
    {"q": "String::from(\"x\") در راست چه می‌سازد؟", "options": ["&str", "String با مالکیت", "Vec", "enum"], "answer": 2},
    {"q": "کدام فرمان پوشه می‌سازد؟", "options": ["touch", "mkdir", "ls", "mv"], "answer": 2},
]

TYPING_ITEMS: List[str] = [
    "ls -la",
    "cd /home/pengo",
    "grep -n sanjab log.txt",
    "chmod 600 secret.txt",
    "find . -name \"*.txt\"",
    "echo sanjab > info.txt",
    "git commit -m \"fix\"",
    "cargo build --release",
    "python3 -m venv .venv",
    "cat log.txt | grep error",
    "mkdir -p work/2025",
    "tar -czf backup.tar.gz docs",
]

MEMORY_ALPHABET = "0123456789"


# --------------------------------------------------------------------------
# ابزارهای مشترک
# --------------------------------------------------------------------------
def _record(game_id: str, score: int, xp: int) -> Dict[str, Any]:
    from . import gamification

    return gamification.record_game(game_id, int(score), int(xp))


def _finish_round(game_id: str, score: int, xp: int) -> None:
    print()
    print(ui.head("پایان " + GAME_LABELS.get(game_id, game_id) + " — نتیجه: " + ui.fa_num(score)))
    result = _record(game_id, score, xp)
    ui.print_gain(result)
    if result.get("level_up"):
        print(ui.head("** سطح جدید! رسیدی به سطح " + ui.fa_num(result["level"]) + " **"))


def _ask_index(prompt: str, limit: int) -> Optional[int]:
    """پرسش گزینهٔ عددی؛ None یعنی EOF — caller تصمیم می‌گیرد."""
    raw = ui.safe_input(prompt)
    if raw is None:
        return None
    raw = ui.to_latin(raw.strip())
    if not raw.isdigit():
        return -1
    value = int(raw)
    if 1 <= value <= limit:
        return value
    return -1


# --------------------------------------------------------------------------
# بازی کوئیز
# --------------------------------------------------------------------------
def play_quiz() -> None:
    questions = random.sample(QUIZ_BANK, k=min(ROUNDS_PER_GAME, len(QUIZ_BANK)))
    score = 0
    print(ui.head("کوئیز دانش — " + ui.fa_num(len(questions)) + " سؤال؛ امتیاز هر پاسخ درست: ۵ XP"))
    for index, item in enumerate(questions, start=1):
        print()
        print(ui.info("سؤال " + ui.fa_num(index) + "/" + ui.fa_num(len(questions)) + ": " + str(item["q"])))
        options: List[str] = list(item["options"])
        for option_index, option in enumerate(options, start=1):
            print("   " + ui.fa_num(option_index) + ") " + option)
        picked = _ask_index(ui.dim("پاسخ (1-" + ui.fa_num(len(options)) + "): "), len(options))
        if picked is None:
            print(ui.warn("ورودی تمام شد — بازی نیمه‌کاره تمام شد."))
            break
        if picked == -1:
            print(ui.warn("پاسخ نامعتبر — این سؤال اشتباه حساب شد."))
        elif picked == int(item["answer"]):
            score += 1
            print(ui.ok("درست بود!"))
        else:
            correct_text = options[int(item["answer"]) - 1]
            print(ui.fail("اشتباه بود — پاسخ درست: " + correct_text))
    xp = score * 5
    _finish_round("quiz", score, xp)


# --------------------------------------------------------------------------
# بازی تایپ
# --------------------------------------------------------------------------
def play_typing() -> None:
    items = random.sample(TYPING_ITEMS, k=min(ROUNDS_PER_GAME, len(TYPING_ITEMS)))
    score = 0
    total_seconds = 0.0
    print(ui.head("سرعت تایپ — متن را دقیقاً همان‌طور که می‌بینی تایپ کن"))
    for index, item in enumerate(items, start=1):
        print()
        print(ui.info("متن " + ui.fa_num(index) + "/" + ui.fa_num(len(items)) + ":"))
        print(ui.paint("   " + item, "magenta", bold=True))
        started = time.monotonic()
        raw = ui.safe_input(ui.dim("تایپ کن: "))
        elapsed = time.monotonic() - started
        if raw is None:
            print(ui.warn("ورودی تمام شد — بازی نیمه‌کاره تمام شد."))
            break
        total_seconds += elapsed
        if raw.strip() == item:
            score += 1
            speed = elapsed if elapsed > 0 else 99.0
            print(ui.ok("دقیق بود! (" + ui.fa_num(round(speed, 1)) + " ثانیه)"))
        else:
            print(ui.fail("مطابقت نداشت."))
    xp = score * 5
    if score == len(items) and total_seconds > 0 and len(items) > 0:
        average = total_seconds / len(items)
        if average < 4.0:
            xp += 10
            print(ui.dim("پاداش سرعت: میانگین زیر ۴ ثانیه — +۱۰ XP"))
    _finish_round("typing", score, xp)


# --------------------------------------------------------------------------
# بازی حافظه
# --------------------------------------------------------------------------
def play_memory() -> None:
    print(ui.head("حافظهٔ عددی — دنباله را به خاطر بسپار و تکرار کن (بدون فاصله)"))
    length = 3
    score = 0
    while length <= 9:
        sequence = "".join(random.choice(MEMORY_ALPHABET) for _ in range(length))
        print()
        print(ui.info("دنبالهٔ " + ui.fa_num(length) + " رقمی:"))
        print(ui.paint("   " + sequence, "magenta", bold=True))
        print(ui.dim("(سه ثانیه وقت داری...)"))
        time.sleep(3.0)
        ui.clear_screen()
        raw = ui.safe_input(ui.dim("دنباله را تکرار کن: "))
        if raw is None:
            print(ui.warn("ورودی تمام شد — بازی نیمه‌کاره تمام شد."))
            break
        guess = ui.to_latin(raw.strip())
        if guess == sequence:
            score = length
            print(ui.ok("درست بود!"))
            length += 1
        else:
            print(ui.fail("اشتباه بود — دنباله درست: " + sequence))
            break
    xp = score * 5
    _finish_round("memory", score, xp)


# --------------------------------------------------------------------------
# منو و فرمان
# --------------------------------------------------------------------------
def game_menu() -> Optional[str]:
    names = list(GAME_LABELS)
    print(ui.head("کدام بازی؟"))
    for index, name in enumerate(names, start=1):
        print("  " + ui.fa_num(index) + ") " + GAME_LABELS[name] + "  " + ui.dim("(" + name + ")"))
    print("  0) بازگشت")
    raw = ui.safe_input(ui.dim("انتخاب: "))
    if raw is None:
        return None
    raw = ui.to_latin(raw.strip())
    if raw in ("0", ""):
        return None
    if raw in names:
        return raw
    if raw.isdigit() and 1 <= int(raw) <= len(names):
        return names[int(raw) - 1]
    print(ui.fail("انتخاب نامعتبر."))
    return None


def run(game: Optional[str] = None) -> None:
    """نقطهٔ ورود منوی تعاملی بازی‌ها."""
    if not game:
        game = game_menu()
        if not game:
            return
    if game == "quiz":
        play_quiz()
    elif game == "typing":
        play_typing()
    elif game == "memory":
        play_memory()
    else:
        print(ui.fail("بازی ناشناخته: " + game + " — بازی‌های موجود: " + ", ".join(GAME_LABELS)))


def cmd_game(args: Any = None) -> int:
    name = getattr(args, "name", None)
    if name:
        name = str(name).strip().lower()
    run(name)
    return 0
