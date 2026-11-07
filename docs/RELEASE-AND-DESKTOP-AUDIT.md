# RELEASE AND DESKTOP AUDIT — سان‌جاب‌اواس ۴٫۱

> تاریخ ممیزی: ۱۳ آبان ۱۴۰۴ (۷ نوامبر ۲۰۲۵) — روی شاخهٔ `feat/desktop-release-browser-upgrade`
> مبنا: کد واقعی در کامیت 839514d (main پیش از این شاخه) + تغییرات همین مأموریت.

## ۱. وضعیت انتشار در لحظهٔ ممیزی

| مورد | وضعیت یافت‌شده | پیامد |
|---|---|---|
| آخرین کامیت main | `839514d` — بعد از تگ رسمی | نسخهٔ نصب‌شدهٔ کاربران از قابلیت‌های main عقب بود |
| آخرین Release رسمی | v4.0.0 → تگ روی `0a127d8` (کامیت قدیمی) | آموزش‌ها/فونت‌ها/Readerهای بعدی در نصب نبودند |
| `VERSION` / `package.json` / `Cargo.toml` / `tauri.conf.json` | همگی 4.0.0 | هم‌خوان بودند؛ سنسِ نسخه در CI فعال بود |
| نسخهٔ جدید | **4.1.0** (Minor — قابلیت‌های واقعی اضافه شد، SemVer) | همگام‌سازی کامل + سنسِ تگ در release.yml |

## ۲. مشکلات واقعی و رفع آن‌ها

### A. نگاشت اشتباه آرتیفکت‌ها (Critical) — ✅ رفع شد
- **علت دقیق:** در `downloads.tsx` قدیمی، `assetType()` همهٔ `*.tar.gz` را «لینوکس» می‌نامید و `targzAsset` اولین tar.gz را برمی‌داشت. در Release واقعی، `sanjab-cli-4.0.0.tar.gz` قبل از `sanjabos-web-…-standalone.tar.gz` می‌آمد → راهنمای «لینوکس» دستور نصب CLI را نشان می‌داد.
- **رفع:** ماژول خالص `src/lib/os/releases.ts` با `classifyAsset()` که از **نام کامل** تشخیص می‌دهد (sanjab-cli → CLI، sanjabos-web → وب، SBOM، SHA256SUMS، exe → NSIS، msi → MSI). پوشش با ۷ آزمون.
- **وضعیت:** Completed / Verified (bun test)

### B. انتشار Stable با نصاب شکسته (Critical) — ✅ رفع شد
- **علت دقیق:** `release.yml` روی job ویندوز `continue-on-error: true` داشت و job publish با `if: always()` حتی در شکست ویندوز `--draft=false` می‌زد.
- **رفع:** حذف continue-on-error؛ publish فقط وقتی web موفق **و** windows.ok=true اجرا می‌شود؛ قبل از انتشار، وجود آرتیفکت‌های اجباری (exe/msi/وب/SBOM) راستی‌آزمایی می‌شود؛ در شکست، Release **Draft می‌ماند** + یادداشت صادقانه در بدنهٔ آن + `exit 1` با پیام واضح در لاگ CI.
- **وضعیت:** Completed (تأیید نهایی نیاز به اجرای واقعی release بعدی دارد — این فایل تا آن موقع Verified نمی‌شود)

### C. راه‌اندازی دسکتاپ (High) — ✅ رفع شد
- **یافته‌ها:** سلامت‌سنجی فقط TCP بود؛ در شکست، کاربر تا ابد روی `static/index.html` می‌ماند؛ کرش زودهنگام Node تشخیص داده نمی‌شد؛ در همهٔ مسیرهای خطا پردازه پاک نمی‌شد.
- **رفع در `src-tauri/src/lib.rs`:** `http_health_ok()` (GET واقعی `/api/health` با پاسخ 200)، پرچم `crashed` از رویداد `Terminated` سایدکار، تایم‌اوت `SANJAB_STARTUP_TIMEOUT_MS` (پیش‌فرض ۳۰s)، `show_error_window()` با `static/error.html` و علت دقیق، `child.kill()` در هر مسیر شکست.
- **وضعیت:** Completed (ساخت/اجرای نصاب واقعی ویندوز در این محیط ممکن نیست — job ویندوز CI آن را می‌سازد؛ اجرای واقعی روی دستگاه، شرط Verified است)

### D. دیتابیس دسکتاپ (High) — ✅ رفع شد
- **یافته:** سایدکار فقط PORT/HOSTNAME/NODE_ENV می‌گرفت؛ `DATABASE_URL` تعریف نشده بود → APIهایی مثل `/api/scores` در نصب کار نمی‌کردند.
- **رفع:** `prepare_database()` در lib.rs — دیتابیس در `app_data_dir` کاربر (نه پوشهٔ نصب)، seed اولیه از `server-dist/sanjabos.db` که در CI با `prisma db push` تازه ساخته می‌شود (**بدون دادهٔ توسعه‌دهنده**)، و `DATABASE_URL=file:…` به سایدکار داده می‌شود. `/api/health` وضعیت db را شفاف برمی‌گرداند.
- **وضعیت:** Completed / آپدیت‌های آینده: backup قبل از migration (مستند در DESKTOP-FEATURE-PARITY)

### E. لاگ و امنیت — ✅ رفع شد
- `src/lib/db.ts`: `log: ['query']` همیشه فعال بود → حالا فقط در توسعه.
- `tauri.conf.json`: `csp: null` → CSP واقعی با `wasm-unsafe-eval` (Pyodide)، `frame-src https: http:` (سفربُر)، بدون `object-src` آزاد.
- `next.config.ts`: هدرهای nosniff / Referrer-Policy / Permissions-Policy (camera=(self)) + no-store برای /api/health.
- سایدکار فقط روی 127.0.0.1 گوش می‌دهد (بدون تغییر — از قبل درست بود).

### F. دادهٔ فیک بدون برچسب — ✅ رفع شد
- `system-monitor.tsx`: برچسب «⚠ دادهٔ نمایشی — شبیه‌سازی‌شده» روی سربرگ + tooltip. اپ‌های خیالیِ دیگر (آب‌وهوا، مترجم گربه) از قبل در راهنما/نامشان صادق‌اند.

### G. WebView2 — ⚠ مستند شد (تغییر نکرد)
- وضعیت: `downloadBootstrapper`. روی ویندوز ۱۱ و اغلب ویندوزهای ۱۰ از قبل نصب است؛ در غیر این صورت نصاب از اینترنت می‌گیرد.
- تصمیم: **Offline Installer (~127MB اضافه) انتخاب نشد** — حجم به‌جای سود، اینترنتِ کم را هم بند می‌آورد. محدودیت شفاف در راهنمای نصب مرکز انتشار نوشته شد. بازنگری بعد از دریافت بازخورد کاربران.

## ۳. وضعیت نهایی موردی

| قلم | وضعیت |
|---|---|
| نگاشت آرتیفکت‌ها | **Completed + Verified (tests)** |
| گیت انتشار Stable | **Completed** — Verified پس از اولین release واقعی |
| راه‌اندازی دسکتاپ | **Completed** — Verified نصب واقعی on-device باقی است |
| DATABASE_URL/AppData | **Completed** |
| CSP/هدرها/لاگ | **Completed + Verified (تایپ‌چک/لینت/تست)** |
| نسخهٔ 4.1.0 همگام | **Completed + Verified (سنس در CI)** |
| تست نصب واقعی ویندوز | **Not Started** — نیازمند دستگاه/VM ویندوز؛ سناریوها در DESKTOP-FEATURE-PARITY فهرست شده |
