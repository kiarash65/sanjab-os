# Sanjab CLI — سان‌جاب CLI

Offline, Persian-first learning terminal for SanjabOS 2.0. Built with the Python
standard library only — zero third-party dependencies, works fully headless.

ترمینال آموزشی آفلاین و فارسی‌محور سان‌جاب او‌اس ۲.۰. فقط با کتابخانهٔ استاندارد
پایتون ساخته شده — بدون هیچ وابستگی خارجی، حتی بدون وب‌اپ.

Sponsored by — با اسپانسری سان‌جاب: sunjob.ir

## Install — نصب

```bash
pipx install sanjab-cli     # recommended — پیشنهادی
# or — یا
pip install sanjab-cli
```

Run from source — اجرا از سورس:

```bash
cd cli
PYTHONPATH=src python3 -m sanjab_cli.cli
```

## Commands — دستورها

| Command | Description |
|---|---|
| `sanjab` | interactive menu — منوی تعاملی |
| `sanjab version` | version info — نسخه |
| `sanjab learn [python\|rust\|linux] [lesson]` | lessons with exercises — درس‌ها (`--list --hint --solution`) |
| `sanjab games [quiz\|typing\|memory]` | three real games — بازی‌ها |
| `sanjab progress [--json]` | XP, level, streaks, history — پیشرفت |
| `sanjab achievements` | achievement list — دستاوردها |
| `sanjab doctor` | environment checks — دکتر سیستم |
| `sanjab config [list \| get KEY \| set KEY VALUE]` | settings (lang, xp_sound, name) — تنظیمات |
| `sanjab lab [--list \| --mission ID]` | safe virtual Linux shell — آزمایشگاه مجازی |
| `sanjab backup [--list \| --file F \| --out F]` | zip backup of ~/.sanjabos — پشتیبان‌گیری |
| `sanjab restore FILE.zip` | restore with confirmation — بازگردانی |
| `sanjab update --check` | check latest GitHub release — بررسی نسخهٔ جدید |
| `sanjab uninstall [--keep-data]` | remove data with typed confirmation — حذف داده‌ها |

Data lives in `~/.sanjabos` (progress.json, config.json). XP events are
idempotent (deduplicated by event id), so replaying a lesson never double-awards.

داده‌ها در `~/.sanjabos` ذخیره می‌شوند؛ امتیازها با شناسهٔ رویداد تکرارناپذیرند.

## Windows notes — ویندوز

ANSI colors are enabled automatically (the `os.system('')` trick on Windows 10+).
If your terminal shows escape codes, set `NO_COLOR=1` or use Windows Terminal.

رنگ‌ها خودکار فعال می‌شوند؛ اگر کد رنگ دیدید `NO_COLOR=1` بگذارید یا از
Windows Terminal استفاده کنید. همهٔ ورودی‌ها EOF/Ctrl+C امن هستند.

## Termux notes — ترمکس

Works headless on Android via Termux: `pip install sanjab-cli` then run `sanjab`.
No root, no storage permission, no internet needed.

در ترمکس اندروید هم بدون روت و بدون اینترنت کار می‌کند.

## Honest notes — نکات صادقانه

- The Rust track (and the web version of SanjabOS) uses a simulator; real
  compilation needs rustc/cargo — check with `sanjab doctor`.
- مسیر راست با شبیه‌ساز است؛ کامپایل واقعی به rustc/cargo نیاز دارد.
- The Linux lab is a safe in-memory simulator; it never executes real shell
  commands on your system.
- Python lesson exercises run in a process-isolated sandbox (separate
  interpreter, 3-second timeout, memory/CPU limits, temp working directory).
  It is practical isolation, not a hard security boundary.
- درس‌های لینوکس/راست شبیه‌سازی‌شده بررسی می‌شوند؛ تمرین پایتون در پروسهٔ
  ایزوله با timeout و محدودیت اجرا می‌شود — ایزولاسیون عملی، نه مرز امنیتی مطلق.
