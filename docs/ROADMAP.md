# نقشهٔ راه — Roadmap (فازهای 1 تا 10)

> وضعیت هر فاز با خواندن مستقیم کد بازبینی شده است (آخرین بازبینی: ریلیز ۴.۰ «سنجابک»). ستون «وضعیت» صادقانه است: چیزی که در کد نیست، «done» نمی‌شود.

| فاز | عنوان | وضعیت کلی | انجام‌شده | باقی‌مانده |
|-----|-------|-----------|-----------|------------|
| 1 | امنیت (Security) | In Progress | ممیزی کامل (`docs/AUDIT.md`)، مدل تهدید (`docs/SECURITY.md`)، hardening سرویس linux-edition، پورت loopback در compose، CI با gate تایپ‌چک، مستندات اعتبارنامه‌ها | untrack کردن `.env` و `db/custom.db` از گیت، حذف `ignoreBuildErrors` در کد، rate limit ها، **پاک‌سازی تاریخچهٔ گیت (AUDIT-010)**، pentest خارجی |
| 2 | هستهٔ OS (Core) | In Progress | رجیستری 50 مدخل (39 اپ + 10 بازی + about)، پنجره‌ها/کوکاسزون، fs مجازی `pengo-fs-v2`، تنظیمات `sunjob-os-v1`، سفربُر با بوکمارک/تاریخچه، PDF ساز | lazy-loading رجیستری با `next/dynamic` (فعلاً import استاتیک)، بکاپ/بازیابی با IndexedDB، مهاجرت fs به IndexedDB |
| 3 | Python / Rust | In Progress | مفسر mini-python آفلاین + زبان سنجابی + JS Worker + HTML preview؛ آکادمی Rust با شبیه‌ساز زیرمجموعهٔ Rust (lexer/parser/evaluator، E0382 به سبک rustc) | Pyodide 0.26.x (CPython واقعی در Worker) — ادغام شده (PyodideRunner)؛ `rustc` واقعی نیتیو از طریق toolchain محلی (CLI وجود `rustc` را تشخیص می‌دهد) |
| 4 | هوش مصنوعی | In Progress | هوش‌یار با 6 preset (شامل GLM)، آکادمی AI با ۷ آزمایش تعاملی (پرسپترون، نزول گرادیان، فعال‌سازها، شبکهٔ عصبی، بایگرام، بیش‌برازش، اخلاق — سبک micrograd)، مولد ایده | Transformers.js / WebLLM با opt-in صریح (بدون دانلود خودکار مدل) |
| 5 | بازی‌وارسازی (Gamification) | In Progress | رکورد محلی هر بازی (`pengo-best-*`)، اسم بازیکن، پنل «رکوردهای جهانی» روی `/api/scores` | موتور XP/سطح/مدال و «مرکز پیشرفت»، جدول‌های server-side جامع با رجیستری بازی‌ها + rate limit |
| 6 | Face AI | In Progress | تشخیص چهره/سن/حالت محلی با face-api.js 0.22.2، قدسنج/وزن‌یاب با برچسب «تخمین»، ماشین زمان چهره با برچسب «synthetic»، حریم خصوصی ۱۰۰٪ محلی | مدل‌های کلاس SAM/GFPGAN نیازمند سرویس native جداگانه — **Blocked** (ملاحظات GPU، مجوز و consent) |
| 7 | لینوکس واقعی | In Progress | v86 guest واقعی (Alpine 3.21.9، kernel 6.12.114 i686، apk آفلاین از ISO، ترمینال سریال سفارشی)، نسخهٔ نصبی linux-edition (systemd/deb/arch/docker)، حالت کیوسک | save_state/restore_state در v86، مسیرهای مستند WSL2/Termux با تست واقعی، agent نیتیو |
| 8 | CLI | In Progress | مستندسازی CLI به‌عنوان محصول جداگانه با نسخهٔ مشترک 2.0.0، نصب‌کننده‌های لینوکس (deb/arch/install.sh)، فرمان `sanjabos` | تضمین هم‌ترازی نسخهٔ استریم کد CLI (در snapshot فعلی پوشهٔ `cli/` در این ریپو نیست)، installer های macOS/Windows |
| 9 | انتشار (Release) | In Progress | `VERSION` (2.0.0)، `CHANGELOG.md`، CI (typecheck/lint/build)، release workflow با SHA256SUMS، `THIRD_PARTY_LICENSES.md`، مجموعهٔ مستندات `docs/` | signing artifacts، SBOM (CycloneDX/spdx)، انتشار باینری رسمی |
| 10 | ISO بوت‌شدنی | Pending | طراحی در `linux-edition/` (service، compose، packaging، kiosk) | **ISO بوت‌تست‌شده عرضه نشده است** — صادقانه: شipped نیست تا وقتی تست بوت روی سخت‌افزار واقعی انجام شود |

## معیار «done» هر فاز

- کد merge شده روی `main` + CI سبز + مستندات به‌روز + (برای فازهای امنیتی) آیتم‌های AUDIT مرتبط به `Verified Fixed` رسیده باشند.
- فازهایی که به عملیات git/release-ops وابسته‌اند (پاک‌سازی تاریخچه، untrack) تا اجرای واقعی `In Progress` می‌مانند.
