"""دکتر سیستم سان‌جاب — بررسی محیط با جدول ok/warn/fail.

هیچ نصب خودکاری انجام نمی‌دهد؛ فقط گزارش می‌دهد و همیشه با کد خروج ۰ تمام
می‌شود (کاربر نگیرد «سیستمم خراب است»، فقط بداند چه چیزی هست و چه چیزی نیست).
"""
from __future__ import annotations

import platform
import shutil
import subprocess
import sys
from typing import Any, Callable, List, NamedTuple, Optional

from . import ui
from .config import DATA_DIR


class CheckResult(NamedTuple):
    name: str
    status: str  # "ok" | "warn" | "fail"
    detail: str


def _marker(status: str) -> str:
    if status == "ok":
        return ui.ok("[PASS]")
    if status == "warn":
        return ui.warn("[WARN]")
    return ui.fail("[FAIL]")


def _tool_version(tool: str) -> Optional[str]:
    """نسخهٔ ابزار را با فراخوانی امن می‌گیرد؛ شکست = None."""
    executable = shutil.which(tool)
    if not executable:
        return None
    try:
        proc = subprocess.run(
            [executable, "--version"],
            capture_output=True,
            text=True,
            timeout=5,
        )
        first = (proc.stdout or proc.stderr or "").strip().splitlines()
        return first[0] if first else "installed"
    except Exception:
        return "installed"


def check_python() -> CheckResult:
    version = sys.version_info
    label = platform.python_implementation() + " " + ".".join(str(part) for part in version[:3])
    if version >= (3, 9):
        return CheckResult("python", "ok", label + " (نیاز: >= 3.9)")
    return CheckResult("python", "fail", label + " (نیاز: >= 3.9)")


def check_tool(name: str, required: bool, why_fa: str) -> CheckResult:
    version = _tool_version(name)
    if version:
        return CheckResult(name, "ok", version)
    if required:
        return CheckResult(name, "fail", "پیدا نشد — " + why_fa)
    return CheckResult(name, "warn", "نصب نیست — " + why_fa)


def check_disk() -> CheckResult:
    try:
        try:
            DATA_DIR.mkdir(parents=True, exist_ok=True)
        except Exception:
            pass
        usage = shutil.disk_usage(str(DATA_DIR))
        free_mb = int(usage.free / (1024 * 1024))
        if free_mb < 200:
            return CheckResult("disk", "fail", "فضای آزاد: " + ui.fa_num(free_mb) + " MB — خیلی کم")
        if free_mb < 1024:
            return CheckResult("disk", "warn", "فضای آزاد: " + ui.fa_num(free_mb) + " MB — کمی کم")
        return CheckResult("disk", "ok", "فضای آزاد: " + ui.fa_num(free_mb) + " MB")
    except Exception as exc:
        return CheckResult("disk", "warn", "بررسی فضای دیسک ممکن نشد: " + str(exc))


def check_data_dir() -> CheckResult:
    try:
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        probe = DATA_DIR / ".sanjab-write-test"
        probe.write_text("ok", encoding="utf-8")
        probe.unlink(missing_ok=True)
        return CheckResult("data-dir", "ok", "قابل‌نوشتن: " + str(DATA_DIR))
    except Exception as exc:
        return CheckResult("data-dir", "fail", "نوشتن در " + str(DATA_DIR) + " نشد: " + str(exc))


def check_platform() -> CheckResult:
    detail = (
        platform.system()
        + " "
        + platform.release()
        + " / "
        + platform.machine()
        + " — UI رنگ: "
        + ("خاموش (NO_COLOR یا غیر تعاملی)" if not ui.COLOR else "روشن")
    )
    return CheckResult("platform", "ok", detail)


def run_checks() -> List[CheckResult]:
    checks: List[Callable[[], CheckResult]] = [
        check_python,
        check_platform,
        lambda: check_tool("rustc", required=False, why_fa="کامپایل واقعی درس‌های راست با آن ممکن است"),
        lambda: check_tool("cargo", required=False, why_fa="ساخت پروژه‌های واقعی راست"),
        lambda: check_tool("git", required=False, why_fa="برای کار با مخزن‌ها"),
        lambda: check_tool("curl", required=False, why_fa="برای دانلود و تست شبکه"),
        check_disk,
        check_data_dir,
    ]
    return [check() for check in checks]


def cmd_doctor(args: Any = None) -> int:
    print(ui.head("دکتر سیستم سان‌جاب — بررسی محیط"))
    print(ui.hr())
    results = run_checks()
    for result in results:
        name = result.name.ljust(12)
        print("  " + name + _marker(result.status) + "  " + result.detail)
    print(ui.hr())
    problems = [result for result in results if result.status == "fail"]
    warnings = [result for result in results if result.status == "warn"]
    summary = (
        ui.fa_num(len(results) - len(problems) - len(warnings)) + " سالم، "
        + ui.fa_num(len(warnings)) + " هشدار، "
        + ui.fa_num(len(problems)) + " خطا"
    )
    print(ui.dim(summary))
    if problems:
        print(ui.warn("برای درس‌های راست لازم نیست همه‌چیز سبز باشد — فقط python و data-dir مهم‌اند."))
    print(ui.dim("هیچ نصب خودکاری انجام نمی‌شود — فقط گزارش."))
    return 0
