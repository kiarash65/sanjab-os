"""تنظیمات سان‌جاب — ~/.sanjabos/config.json (بدون وابستگی خارجی)."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, Optional

DATA_DIR: Path = Path.home() / ".sanjabos"
CONFIG_FILE: Path = DATA_DIR / "config.json"

DEFAULTS: Dict[str, Any] = {"lang": "fa", "xp_sound": False, "name": ""}

KEY_INFO: Dict[str, str] = {
    "lang": "زبان برچسب‌ها: fa یا en",
    "xp_sound": "بوق کوتاه هنگام گرفتن امتیاز: true/false یا on/off",
    "name": "نام نمایشی (اختیاری، حداکثر ۴۰ حرف)",
}

_TRUE = {"true", "1", "on", "yes", "bale", "بله", "روشن"}
_FALSE = {"false", "0", "off", "no", "kheyr", "نه", "خاموش"}


def ensure_dir() -> Path:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    return DATA_DIR


def load() -> Dict[str, Any]:
    ensure_dir()
    try:
        raw = json.loads(CONFIG_FILE.read_text(encoding="utf-8"))
        if isinstance(raw, dict):
            merged = dict(DEFAULTS)
            for key in DEFAULTS:
                if key in raw:
                    merged[key] = raw[key]
            return merged
    except Exception:
        pass
    return dict(DEFAULTS)


def save(cfg: Dict[str, Any]) -> bool:
    try:
        ensure_dir()
        CONFIG_FILE.write_text(json.dumps(cfg, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        return True
    except Exception:
        return False


def get(key: str, default: Any = None) -> Any:
    return load().get(key, DEFAULTS.get(key, default))


def coerce_bool(value: str) -> Optional[bool]:
    text = str(value).strip().lower()
    if text in _TRUE:
        return True
    if text in _FALSE:
        return False
    return None


def set_key(key: str, value: Any) -> str:
    """مقدار را اعتبارسنجی و ذخیره می‌کند؛ پیام فارسی برمی‌گرداند."""
    cfg = load()
    if key == "lang":
        lang = str(value).strip().lower()
        if lang not in ("fa", "en"):
            return "زبان باید fa یا en باشد."
        cfg["lang"] = lang
    elif key == "xp_sound":
        flag = coerce_bool(str(value))
        if flag is None:
            return "مقدار صدا باید true/false یا on/off باشد."
        cfg["xp_sound"] = flag
    elif key == "name":
        name = str(value).strip()
        if not name or len(name) > 40:
            return "نام باید بین ۱ تا ۴۰ حرف باشد."
        cfg["name"] = name
    elif key in DEFAULTS:
        cfg[key] = value
    else:
        return "کلید ناشناخته: " + key + " — کلیدهای مجاز: " + ", ".join(DEFAULTS)
    return "ذخیره شد." if save(cfg) else "ذخیرهٔ فایل تنظیمات ناموفق بود."


def cmd_config(args: Any = None) -> int:
    from . import ui

    action = getattr(args, "action", None)
    key = getattr(args, "key", None)
    value = getattr(args, "value", None)

    if action == "set":
        if not key or value is None:
            print(ui.fail("الگوی درست: sanjab config set KEY VALUE"))
            return 2
        msg = set_key(key, value)
        printer = ui.ok if msg == "ذخیره شد." else ui.fail
        print(printer(msg))
        return 0 if msg == "ذخیره شد." else 2

    if action == "get":
        if not key:
            print(ui.fail("الگوی درست: sanjab config get KEY"))
            return 2
        if key not in DEFAULTS:
            print(ui.fail("کلید ناشناخته: " + key))
            return 2
        print(key + " = " + str(load().get(key)))
        return 0

    # بدون action یا با action=list — فهرست کامل
    cfg = load()
    print(ui.head("تنظیمات سان‌جاب — ~/.sanjabos/config.json"))
    for default_key, default_value in DEFAULTS.items():
        desc = KEY_INFO.get(default_key, "")
        print("  " + default_key.ljust(10) + " = " + str(cfg.get(default_key, default_value)).ljust(10) + " " + ui.dim(desc))
    print(ui.dim("  تغییر: sanjab config set lang en   |   sanjab config set xp_sound on"))
    return 0
