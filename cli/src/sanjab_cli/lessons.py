"""موتور درس‌های سان‌جاب — نمایش، تمرین، بررسی امن و ثبت امتیاز.

انواع تمرین:
  - code: کد پایتون در پروسهٔ ایزوله اجرا می‌شود (timeout ۳ ثانیه، محدودیت
    حافظه/CPU روی سیستم‌های POSIX، دایرکتوری موقت، بدون ورودی). این ایزولاسیون
    پروسه‌ای است و مرز امنیتی مطلق نیست — کد را خود کاربر می‌نویسد.
  - rust: بدون اجرا؛ ساختار کد با الگو بررسی می‌شود (شبیه‌ساز — صادقانه).
  - command: فرمان تایپ‌شده فقط با تطبیق الگو بررسی می‌شود (شبیه‌ساز امن).

همهٔ ورودی‌ها EOF/Ctrl+C امن هستند.
"""
from __future__ import annotations

import re
import subprocess
import sys
import tempfile
from typing import Any, Dict, List, Optional, Tuple

from . import ui
from .content import LESSONS, TRACK_SIZES

TRACK_LABELS: Dict[str, str] = {
    "python": "پایتون",
    "rust": "راست",
    "linux": "لینوکس",
}

EXEC_TIMEOUT_SEC = 3.0
MAX_CODE_LINES = 60


# --------------------------------------------------------------------------
# اعتبارسنجی ورودی‌های برنامه (نه ورودی کاربر)
# --------------------------------------------------------------------------
def normalize_track(track: Optional[str]) -> Optional[str]:
    if not track:
        return None
    return track.strip().lower()


def get_lesson(track: str, lesson_id: str) -> Optional[Dict[str, Any]]:
    for lesson in LESSONS.get(track, []):
        if lesson["id"] == lesson_id:
            return lesson
    return None


def lesson_ids(track: str) -> List[str]:
    return [lesson["id"] for lesson in LESSONS.get(track, [])]


# --------------------------------------------------------------------------
# اجرای امن کد پایتون — پروسهٔ ایزوله با محدودیت
# --------------------------------------------------------------------------
def run_python_code(code: str) -> Tuple[bool, str, str]:
    """کد را در پروسهٔ جدا اجرا می‌کند؛ (موفقیت، خروجی، پیام خطا) برمی‌گرداند."""
    preexec = None
    if sys.platform != "win32":
        try:
            import resource

            def _limits() -> None:  # pragma: no cover — در پروسهٔ فرزند اجرا می‌شود
                resource.setrlimit(resource.RLIMIT_CPU, (3, 3))
                resource.setrlimit(resource.RLIMIT_AS, (256 * 1024 * 1024, 256 * 1024 * 1024))

            preexec = _limits
        except Exception:
            preexec = None
    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            proc = subprocess.run(
                [sys.executable, "-I", "-c", code],
                input="",
                capture_output=True,
                text=True,
                timeout=EXEC_TIMEOUT_SEC,
                cwd=tmpdir,
                preexec_fn=preexec,
            )
        return proc.returncode == 0, proc.stdout or "", proc.stderr or ""
    except subprocess.TimeoutExpired:
        return False, "", "زمان اجرا تمام شد (بیشتر از " + str(int(EXEC_TIMEOUT_SEC)) + " ثانیه)."
    except Exception as exc:  # هر خطای ناشناخته — بدون کرش
        return False, "", "اجرای امن ممکن نشد: " + str(exc)


def normalize_output(text: str) -> str:
    lines = [line.rstrip() for line in text.replace("\r\n", "\n").split("\n")]
    while lines and not lines[-1]:
        lines.pop()
    return "\n".join(lines)


def check_exercise(
    kind: str, code: str, checks: Any
) -> Tuple[bool, List[str]]:
    """بررسی پاسخ کاربر؛ خروجی (موفقیت، فهرست پیام‌های فارسی).

    checks ممکن است dict تکی یا فهرست‌ باشد (در محتوای موجود هر دو قالب هست).
    """
    if isinstance(checks, dict):
        checks = [checks]
    normalized: List[Dict[str, Any]] = [
        check for check in checks if isinstance(check, dict)
    ]
    messages: List[str] = []
    all_ok = True
    stdout = ""
    if kind == "code":
        ran, stdout, err = run_python_code(code)
        if not ran:
            return False, ["کد اجرا نشد: " + (normalize_output(err)[:300] or "خطای اجرا")]
    for check in normalized:
        ckind = check.get("kind")
        if ckind == "output":
            expected = normalize_output(str(check.get("expected", "")))
            if normalize_output(stdout) == expected:
                messages.append("ok: خروجی درست است — " + expected.replace("\n", " | ")[:80])
            else:
                all_ok = False
                messages.append("no: خروجی مورد انتظار «" + expected.replace("\n", " | ")[:80] + "» بود")
        elif ckind == "regex":
            pattern = str(check.get("pattern", ""))
            target = stdout if check.get("target") == "output" else code
            if re.search(pattern, target):
                messages.append("ok: الگو پیدا شد")
            else:
                all_ok = False
                messages.append("no: الگوی لازم پیدا نشد — " + pattern)
        else:
            all_ok = False
            messages.append("no: نوع بررسی ناشناخته")
    if kind == "rust" and all_ok:
        messages.append("بررسی شبیه‌سازی‌شده انجام شد — بدون کامپایل واقعی rustc")
    if kind == "command" and all_ok:
        messages.append("فرمان با تطبیق الگو بررسی شد (شبیه‌ساز امن — اجرای واقعی نه)")
    return all_ok, messages


# --------------------------------------------------------------------------
# نمایش
# --------------------------------------------------------------------------
def print_lesson_body(lesson: Dict[str, Any], track: str) -> None:
    print(ui.head("درس " + ui.fa_num(lesson["id"]) + " — " + lesson["title_fa"] + "  (" + TRACK_LABELS.get(track, track) + ")"))
    print(ui.hr())
    for line in lesson["body_fa"]:
        print("  " + line)
    print()
    if lesson.get("example"):
        ui.print_code("مثال", str(lesson["example"]))


def read_multiline_code(starter: str) -> Optional[str]:
    """خواندن چندخطی کد؛ پایان با خط خالی یا EOF. None یعنی EOF از همان ابتدا."""
    print(ui.info("کدت را بنویس — برای پایان، یک خط خالی بگذار (Ctrl+C هم امن است):"))
    if starter.strip():
        print(ui.dim("شروع پیشنهادی:"))
        print(ui.code_block(starter))
    lines: List[str] = []
    while True:
        line = ui.safe_input(ui.dim("  ... ") if lines else ui.dim("  >  "))
        if line is None:
            return "\n".join(lines) if lines else None
        if line.strip() == "":
            return "\n".join(lines)
        if len(lines) >= MAX_CODE_LINES:
            return "\n".join(lines)
        lines.append(line)


def read_single_command() -> Optional[str]:
    line = ui.safe_input(ui.dim("  فرمان > "))
    if line is None:
        return None
    return re.sub(r"\s+", " ", ui.to_latin(line).strip())


def run_exercise(track: str, lesson: Dict[str, Any]) -> bool:
    """اجرای تمرین با تلاش مجدد؛ خروجی: درس کامل شد یا نه."""
    exercise = lesson.get("exercise")
    if not exercise:
        print(ui.warn("این درس تمرین ندارد — فقط بخوان و لذت ببر."))
        return False
    kind = str(exercise.get("kind", "code"))
    attempts = 0
    while True:
        attempts += 1
        if kind == "command":
            print(ui.info("تمرین: " + str(exercise.get("prompt_fa", ""))))
            answer = read_single_command()
            code = answer or ""
        else:
            print(ui.info("تمرین: " + str(exercise.get("prompt_fa", ""))))
            code = read_multiline_code(str(exercise.get("starter", "")))
            if code is None:
                if attempts == 1:
                    print()
                    print(ui.warn("ورودی تمام شد — درس ناتمام ماند. دفعهٔ بعد ادامه بده؛ راهنما: --hint"))
                    return False
                print()
                print(ui.warn("ورودی تمام شد — درس ناتمام ماند."))
                return False
        if code.strip() == "":
            if attempts == 1:
                print(ui.warn("پاسخ خالی بود — تلاش کن یا با Enter خالی و بعد EOF خارج شو."))
                continue
            return False
        passed, messages = check_exercise(kind, code, exercise.get("check", []))
        for message in messages:
            if message.startswith("ok:"):
                print(ui.ok("  [OK] " + message[4:]))
            elif message.startswith("no:"):
                print(ui.fail("  [NO] " + message[4:]))
            else:
                print(ui.dim("  " + message))
        if passed:
            result = record_track_result(track, lesson, first_try=(attempts == 1))
            ui.print_gain(result)
            if result.get("level_up"):
                print(ui.head("  ** سطح جدید! رسیدی به سطح " + ui.fa_num(result["level"]) + " **"))
            return True
        print(ui.warn("پاسخ کامل نبود. دوباره تلاش کن، یا EOF بده تا تمام شود."))
        retry = ui.safe_input(ui.dim("  تلاش دوباره؟ [y/n] (پیش‌فرض: بله) "))
        if retry is None:
            print(ui.dim("  درس ناتمام ماند — بعداً ادامه بده."))
            return False
        if retry.strip().lower() in ("n", "no", "نه", "kheyr", "خیر"):
            print(ui.dim("  درس ناتمام ماند — بعداً ادامه بده."))
            return False


def record_track_result(track: str, lesson: Dict[str, Any], first_try: bool) -> Dict[str, Any]:
    from . import gamification

    return gamification.record_lesson(track, str(lesson["id"]), int(lesson.get("xp", 20)), first_try)


def show_hint(lesson: Dict[str, Any]) -> None:
    print(ui.info("راهنما: " + str(lesson.get("hint_fa", "راهنمایی ثبت نشده"))))


def show_solution(lesson: Dict[str, Any]) -> None:
    ui.print_code("راه‌حل", str(lesson.get("solution", "")))


# --------------------------------------------------------------------------
# فهرست‌ها
# --------------------------------------------------------------------------
def list_tracks() -> None:
    from . import gamification

    state = gamification.load_state()
    done = state.get("lessons", {})
    print(ui.head("مسیرهای یادگیری سان‌جاب"))
    print(ui.hr())
    for track in ("python", "rust", "linux"):
        total = TRACK_SIZES.get(track, 0)
        completed = sum(1 for key in done if key.startswith(track + ":"))
        bar = "[" + "#" * completed + "." * max(0, total - completed) + "]"
        print(
            "  "
            + track.ljust(8)
            + " "
            + ui.dim(bar)
            + " "
            + ui.fa_num(completed)
            + "/"
            + ui.fa_num(total)
            + "  "
            + ui.dim("(پیش‌نمایش: sanjab learn " + track + " --list)")
        )
    print(ui.dim("  شروع: sanjab learn python 01"))


def list_lessons(track: str) -> None:
    from . import gamification

    state = gamification.load_state()
    done = state.get("lessons", {})
    print(ui.head("درس‌های مسیر " + TRACK_LABELS.get(track, track) + " (" + track + ")"))
    print(ui.hr())
    for lesson in LESSONS.get(track, []):
        key = track + ":" + lesson["id"]
        marker = ui.ok("[done]") if done.get(key, {}).get("completed") else ui.dim("[....]")
        print(
            "  "
            + lesson["id"].ljust(4)
            + " "
            + marker
            + " "
            + lesson["title_fa"]
            + "  "
            + ui.dim("(+" + str(lesson.get("xp", 20)) + " XP)")
        )
    print(ui.dim("  اجرا: sanjab learn " + track + " " + (lesson_ids(track)[0] if lesson_ids(track) else "01")))


# --------------------------------------------------------------------------
# فرمان learn
# --------------------------------------------------------------------------
def cmd_learn(args: Any = None) -> int:
    track = normalize_track(getattr(args, "track", None))
    lesson_id = getattr(args, "lesson_id", None)
    show_list = bool(getattr(args, "list", False))
    show_hint_flag = bool(getattr(args, "hint", False))
    show_solution_flag = bool(getattr(args, "solution", False))

    if not track or show_list:
        if track and track in LESSONS:
            list_lessons(track)
        else:
            if track:
                print(ui.fail("مسیر ناشناخته: " + track + " — مسیرهای موجود: " + ", ".join(LESSONS)))
                return 2
            list_tracks()
        return 0

    if track not in LESSONS:
        print(ui.fail("مسیر ناشناخته: " + track + " — مسیرهای موجود: " + ", ".join(LESSONS)))
        return 2

    if not lesson_id:
        list_lessons(track)
        return 0

    lesson = get_lesson(track, ui.to_latin(str(lesson_id)).strip())
    if not lesson:
        print(ui.fail("درس پیدا نشد: " + str(lesson_id) + " — فهرست: sanjab learn " + track + " --list"))
        return 2

    if show_hint_flag:
        show_hint(lesson)
    if show_solution_flag:
        show_solution(lesson)
    if show_hint_flag or show_solution_flag:
        return 0

    print_lesson_body(lesson, track)
    run_exercise(track, lesson)
    return 0


def choose_track_interactive() -> Optional[str]:
    print(ui.head("کدام مسیر؟"))
    tracks = list(LESSONS)
    for index, track in enumerate(tracks, start=1):
        print("  " + ui.fa_num(index) + ") " + TRACK_LABELS.get(track, track) + "  " + ui.dim("(" + track + ")"))
    print("  0) بازگشت")
    raw = ui.safe_input(ui.dim("انتخاب: "))
    if raw is None:
        return None
    raw = ui.to_latin(raw.strip())
    if raw in ("0", ""):
        return None
    if raw in tracks:
        return raw
    if raw.isdigit() and 1 <= int(raw) <= len(tracks):
        return tracks[int(raw) - 1]
    print(ui.fail("انتخاب نامعتبر."))
    return None


def choose_lesson_interactive(track: str) -> Optional[Dict[str, Any]]:
    list_lessons(track)
    raw = ui.safe_input(ui.dim("شناسهٔ درس (مثال: " + (lesson_ids(track)[0] if lesson_ids(track) else "01") + ") یا Enter برای بازگشت: "))
    if raw is None or raw.strip() == "":
        return None
    return get_lesson(track, ui.to_latin(raw.strip()))


def run(track: Optional[str] = None, lesson_id: Optional[str] = None) -> None:
    """نقطهٔ ورود منوی تعاملی برای یادگیری."""
    if not track:
        track = choose_track_interactive()
        if not track:
            return
    if not lesson_id:
        lesson = choose_lesson_interactive(track)
        if not lesson:
            return
    else:
        lesson = get_lesson(track, lesson_id)
        if not lesson:
            print(ui.fail("درس پیدا نشد: " + lesson_id))
            return
    print_lesson_body(lesson, track)
    run_exercise(track, lesson)
