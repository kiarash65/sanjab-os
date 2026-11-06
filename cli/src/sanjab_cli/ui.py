"""Sanjab CLI — رابط کاربری ترمینال: رنگ ANSI، متن فارسی، بنر، ورودی امن.

رنگ‌ها طبق استاندارد NO_COLOR خاموش می‌شوند؛ در ویندوز با ترفند os.system('')
فعال می‌شود. فقط کتابخانهٔ استاندارد پایتون.
"""
from __future__ import annotations

import os
import sys
from typing import Optional

RESET = "\033[0m"
BOLD = "\033[1m"
DIM = "\033[2m"

_FG = {
    "red": "\033[31m",
    "green": "\033[32m",
    "yellow": "\033[33m",
    "blue": "\033[34m",
    "magenta": "\033[35m",
    "cyan": "\033[36m",
    "white": "\033[37m",
}

_FA_DIGITS = str.maketrans("0123456789", "۰۱۲۳۴۵۶۷۸۹")
_LATIN_DIGITS = str.maketrans("۰۱۲۳۴۵۶۷۸۹", "0123456789")


def _enable_windows_ansi() -> None:
    """ویندوز ۱۰+ با یک os.system('') پشتیبانی ANSI ترمینال را روشن می‌کند."""
    if os.name == "nt":
        try:
            os.system("")
        except Exception:
            pass


def _detect_color() -> bool:
    if os.environ.get("NO_COLOR"):
        return False
    if os.environ.get("FORCE_COLOR"):
        return True
    _enable_windows_ansi()
    try:
        return bool(sys.stdout.isatty())
    except Exception:
        return False


COLOR: bool = _detect_color()


def paint(text: str, color: Optional[str] = None, *, bold: bool = False, dim: bool = False) -> str:
    """متن را با کد ANSI می‌پوشاند؛ اگر رنگ خاموش باشد همان متن برمی‌گردد."""
    if not COLOR:
        return text
    prefix = ""
    if bold:
        prefix += BOLD
    if dim:
        prefix += DIM
    if color:
        prefix += _FG.get(color, "")
    return (prefix + text + RESET) if prefix else text


def ok(text: str) -> str:
    return paint(text, "green")


def warn(text: str) -> str:
    return paint(text, "yellow")


def fail(text: str) -> str:
    return paint(text, "red")


def info(text: str) -> str:
    return paint(text, "cyan")


def dim(text: str) -> str:
    return paint(text, dim=True)


def head(text: str) -> str:
    return paint(text, "cyan", bold=True)


def fa_num(value: object) -> str:
    """تبدیل رقم‌های لاتین به فارسی — فقط برای نمایش."""
    return str(value).translate(_FA_DIGITS)


def to_latin(text: str) -> str:
    """تبدیل رقم‌های فارسی ورودی کاربر به لاتین."""
    return text.translate(_LATIN_DIGITS)


def code_block(code: str, indent: str = "    ") -> str:
    return "\n".join((indent + line) if line.strip() else "" for line in code.splitlines())


def print_code(title: str, code: str) -> None:
    print(dim("--- " + title + " ---"))
    print(code_block(code))


def hr(width: int = 56) -> str:
    return dim("─" * width)


def banner() -> str:
    art = (
        "\n"
        "      (\\,--./)\n"
        "      /  oo  \\     سان‌جاب او‌اس 2.0.0\n"
        "      \\  ~~  /     Sanjab CLI — سنجاب کوچکِ ترمینال شما\n"
        "       `----'      یادگیری پایتون، راست و لینوکس — کاملاً آفلاین\n"
        "                   با اسپانسری سان‌جاب — sunjob.ir\n"
    )
    return paint(art, "cyan")


def safe_input(prompt: str = "") -> Optional[str]:
    """ورودی امن: EOF یا Ctrl+C هرگز کرش نمی‌دهد؛ None یعنی پایان ورودی."""
    try:
        return input(prompt)
    except (EOFError, KeyboardInterrupt):
        print()
        return None


def ask_yes_no(prompt: str, default: bool = False) -> bool:
    raw = safe_input(prompt + " [y/n] ")
    if raw is None:
        return default
    raw = raw.strip().lower()
    if raw in ("y", "yes", "bale", "بله", "آره"):
        return True
    if raw in ("n", "no", "kheyr", "نه", "خیر"):
        return False
    return default


def pause(message: str = "برای ادامه Enter بزن...") -> None:
    safe_input(message)


def bell() -> None:
    """بوق کوتاه هنگام امتیاز — فقط اگر xp_sound در تنظیمات روشن باشد."""
    try:
        from .config import get as cfg_get

        if bool(cfg_get("xp_sound", False)):
            print("\a", end="", flush=True)
    except Exception:
        pass


def print_gain(res: dict) -> None:
    """نمایش پیام‌های امتیاز (خروجی add_xp/record_*) به شکل رنگی."""
    for msg in res.get("messages", []):
        if msg.startswith("+"):
            print(ok("  " + msg))
        else:
            print(dim("  " + msg))
    bell()


def clear_screen() -> None:
    print("\n" * 40)
