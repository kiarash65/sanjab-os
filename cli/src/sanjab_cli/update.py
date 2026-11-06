"""بررسی نسخهٔ جدید سان‌جاب از GitHub Releases — هرگز نصب خودکار نمی‌کند.

درخواست با timeout ۱۰ ثانیه؛ آفلاین بودن یا هر خطای شبکه پیام آرام فارسی دارد.
"""
from __future__ import annotations

import json
import urllib.error
import urllib.request
from typing import Any, Optional, Tuple

from . import ui
from .config import DATA_DIR

__version__ = "2.0.0"

API_URL = "https://api.github.com/repos/kiarash65/sanjab-os/releases/latest"
TIMEOUT_SEC = 10


def _parse_version(text: str) -> Optional[Tuple[int, ...]]:
    cleaned = text.strip().lstrip("vV")
    parts = cleaned.split(".")
    numbers: Tuple[int, ...] = ()
    for part in parts[:3]:
        digits = "".join(ch for ch in part if ch.isdigit())
        if not digits:
            return None
        numbers = numbers + (int(digits),)
    return numbers


def _fetch_latest() -> Tuple[Optional[str], str]:
    request = urllib.request.Request(
        API_URL,
        headers={
            "Accept": "application/vnd.github+json",
            "User-Agent": "sanjab-cli/" + __version__,
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=TIMEOUT_SEC) as response:
            payload = json.loads(response.read().decode("utf-8", errors="replace"))
        tag = str(payload.get("tag_name") or payload.get("name") or "")
        return (tag if tag else None), ""
    except urllib.error.HTTPError as exc:
        return None, "پاسخ HTTP " + str(exc.code) + " از گیت‌هاب"
    except urllib.error.URLError as exc:
        reason = getattr(exc, "reason", exc)
        return None, "اتصال برقرار نشد (" + str(reason) + ") — آفلاین؟"
    except Exception as exc:
        return None, "خطای ناشناخته: " + str(exc)


def cmd_update(args: Any = None) -> int:
    print(ui.head("بررسی نسخهٔ جدید — " + API_URL))
    print(ui.dim("نسخهٔ فعلی CLI: " + __version__ + "  |  DATA_DIR: " + str(DATA_DIR)))
    latest, error = _fetch_latest()
    if latest is None:
        print(ui.warn("بررسی ناموفق بود: " + error))
        print(ui.dim("این فرمان فقط بررسی می‌کند؛ نصب خودکار هرگز انجام نمی‌شود."))
        return 0
    local = _parse_version(__version__)
    remote = _parse_version(latest)
    print(ui.info("آخرین انتشار گیت‌هاب: " + latest))
    if local and remote and remote > local:
        print(ui.ok("نسخهٔ جدید موجود است: " + latest + " (فعلی: " + __version__ + ")"))
        print(ui.dim("آپدیت دستی: pipx upgrade sanjab-cli  |  یا مستندات: docs/RELEASES.md"))
    elif local and remote:
        print(ui.ok("به‌روز هستی — نسخهٔ تو " + __version__ + " است."))
    else:
        print(ui.warn("مقایسهٔ نسخه ممکن نشد (قالب برچسب غیرمتعارف: " + latest + ")."))
    print(ui.dim("نصب خودکار انجام نمی‌شود — تصمیم با توست."))
    return 0
