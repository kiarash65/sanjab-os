# سیاست انتشار — Release Policy (v2.0.0)

## ۱. نسخه‌گذاری (SemVer)

- فرمت: `MAJOR.MINOR.PATCH` — source of truth نسخهٔ وب، فایل **`VERSION`** در ریشهٔ ریپو است (فعلاً `2.0.0`).
- **MAJOR:** تغییر ناسازگار در رفتار دسکتاپ/فایل‌سیستم مجازی/قالب ذخیره‌سازی (مثلاً مهاجرت fs به IndexedDB).
- **MINOR:** اپ/فیچر جدید بدون شکستن داده‌ها (مثلاً Pyodide، gamification engine).
- **PATCH:** رفع اشکال و امنیت بدون تغییر قالب داده.
- CLI محصول جداگانه است ولی **هم‌نسخه** با وب منتشر می‌شود (نسخهٔ مشترک از `VERSION`).

## ۲. کانال‌ها (Channels)

| کانال | هدف | منبع | پایداری |
|-------|-----|------|---------|
| `stable` | کاربران عادی/مدارس | tag رسمی `vX.Y.Z` روی `main` + checksum | بالا |
| `beta` | تست فیچرها | tag `vX.Y.Z-beta.N` روی branch منتشر | متوسط |
| `nightly` | توسعه‌دهندگان | آخرین commit `main` (build CI) | پایین — هر وقت می‌تواند بشکند |

## ۳. چک‌لیست انتشار (Release checklist)

1. [ ] بررسی آیتم‌های `In Progress` هدف این نسخه در `docs/AUDIT.md` (یا موکول آگاهانه با یادداشت).
2. [ ] ابطال/rotate هر secret درگیر و پاک‌سازی تاریخچهٔ گیت در صورت لزوم (AUDIT-010) — **پیش از هر چیز**.
3. [ ] آپدیت `VERSION` (بدون پیشوند `v`).
4. [ ] آپدیت `CHANGELOG.md` (Keep-a-Changelog).
5. [ ] هم‌ترازی نسخه در packaging: `linux-edition/packaging/debian/control`، `debian/changelog`، `build-deb.sh`، `arch/PKGBUILD`.
6. [ ] tag: `git tag -a v2.0.0 -m "SanjabOS 2.0.0"` و push tag.
7. [ ] CI روی tag سبز؛ سپس release workflow artifacts + `SHA256SUMS.txt` می‌سازد.
8. [ ] Release notes از قالب workflow (خلاصه + known limitations).
9. [ ] انتشار و درج لینک‌ها در README (در صورت نیاز).

## ۴. سیاست آپدیت کاربران (Update policy)

- **هرگز `git reset --hard` برای کاربران نزنید.** نصب‌کننده (`linux-edition/install.sh`) آپدیت را با `git pull --ff-only` انجام می‌دهد؛ در case conflict کاربر با پیام راهنما متوقف می‌شود، نه با از بین رفتن تغییرات محلی.
- دانلودهای release **immutable** هستند: بعد از انتشار، artifact و checksum آن تغییر نمی‌کند؛ اصلاحات امنیتی = نسخهٔ جدید.
- قبل از هر migration (مثلاً مهاجرت `pengo-fs-v2` به IndexedDB در نسخه‌های بعدی): **بکاپ خودکار** از کلیدهای localStorage/IndexedDB مرتبط گرفته می‌شود و فقط بعد از موفقیت، migration نهایی می‌شود.
- **Rollback:** نسخهٔ قبلی همیشه از downloads همان release قابل نصب مجدد است؛ برای نصب لینوکسی، بکاپ پیش از آپدیت (در install.sh) مسیر برگشت را می‌سازد.

## ۵. اعتبارسنجی دانلود (Checksum verify)

```bash
# دریافت release و checksum
sha256sum -c SHA256SUMS.txt --ignore-missing
# مطابقت نسخه
cat VERSION   # باید vX.Y.Z بدون پیشوند باشد
```

## ۶. known limitations هر release

هر release notes باید بخش «Known limitations» داشته باشد. برای 2.0.0 حداقل:
- ISO بوت‌تست رسمی ندارد (فاز 10).
- امتیازهای جهانی ضد-spoof نیستند (AUDIT-005).
- وزن‌های face-api روی ref `master` پین‌اند تا commit SHA (AUDIT-009).
- lazy-loading رجیستری و IndexedDB backup در نسخه‌های بعدی.
