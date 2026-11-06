"""محتوای درس‌های سان‌جاب — سه مسیر: پایتون، راست، لینوکس."""
from __future__ import annotations

from typing import Any, Dict

from . import linux_lessons, python_lessons, rust_lessons

LESSONS: Dict[str, Any] = {
    "python": python_lessons.LESSONS,
    "rust": rust_lessons.LESSONS,
    "linux": linux_lessons.LESSONS,
}

TRACK_SIZES: Dict[str, int] = {name: len(items) for name, items in LESSONS.items()}

__all__ = ["LESSONS", "TRACK_SIZES"]
