"""حذف دادهٔ سان‌جاب با تأیید تایپی — پیش‌فرض فقط داده‌های CLI را پاک می‌کند.

مهم: این فرمان هیچ‌وقت نصب WebOS لینوکسی را حذف نمی‌کند؛ فقط ~/.sanjabos
(پیشرفت و تنظیمات CLI). برای حذف نسخهٔ لینوکسی: linux-edition/uninstall.sh
"""
from __future__ import annotations

import shutil
from pathlib import Path
from typing import Any

from . import ui
from .config import DATA_DIR, CONFIG_FILE

CONFIRM_WORD = "sanjab"


def _data_files() -> list:
    files = []
    if CONFIG_FILE.exists():
        files.append(CONFIG_FILE)
    progress = DATA_DIR / "progress.json"
    if progress.exists():
        files.append(progress)
    return files


def cmd_uninstall(args: Any = None) -> int:
    keep_data = bool(getattr(args, "keep_data", False))
    files = _data_files()
    print(ui.head("حذف سان‌جاب CLI"))
    print(ui.hr())
    if files:
        print(ui.warn("این فایل‌ها حذف خواهند شد:"))
        for item in files:
            print("  - " + str(item))
    else:
        print(ui.dim("داده‌ای در " + str(DATA_DIR) + " پیدا نشد — چیزی برای حذف نیست."))
    if keep_data:
        print(ui.info("فلگ --keep-data فعال است — داده‌ها حذف نمی‌شوند، فقط پیام راهنما می‌گیری."))
        print(ui.dim("برای حذف کامل داده‌ها بعداً اجرا کن: sanjab uninstall"))
        print(ui.dim("برای حذف نسخهٔ لینوکسی WebOS: linux-edition/uninstall.sh"))
        return 0
    print(ui.warn("تأیید تایپی لازم است — برای حذف، دقیقاً بنویس: " + CONFIRM_WORD))
    answer = ui.safe_input(ui.dim("تأیید: "))
    if answer is None:
        print(ui.dim("لغو شد (EOF) — داده‌ها سالم ماندند."))
        return 1
    if ui.to_latin(answer.strip().lower()) != CONFIRM_WORD:
        print(ui.dim("تأیید درست نبود — لغو شد. داده‌ها سالم ماندند."))
        return 1
    try:
        if DATA_DIR.exists():
            shutil.rmtree(DATA_DIR)
            print(ui.ok("پوشهٔ داده حذف شد: " + str(DATA_DIR)))
        else:
            print(ui.dim("پوشهٔ داده‌ای وجود نداشت."))
    except Exception as exc:
        print(ui.fail("حذف داده‌ها ناموفق بود: " + str(exc)))
        return 1
    print()
    print(ui.info("داده‌های CLI پاک شد؛ خود CLI با pipx uninstall sanjab-cli حذف می‌شود."))
    print(ui.dim("hint: پیشرفت و تنظیمات همگی داخل همین " + str(DATA_DIR) + " بودند — نسخهٔ لینوکسی WebOS دست‌نخورده است."))
    print(ui.dim("hint: برای حذف نصب نسخهٔ وب/لینوکسی: linux-edition/uninstall.sh (داده‌ها را نگه می‌دارد)."))
    print(ui.dim("با اسپانسری سان‌جاب — sunjob.ir"))
    return 0
