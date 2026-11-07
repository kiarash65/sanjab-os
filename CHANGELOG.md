# Changelog

All notable changes to SanjabOS (سان‌جاب‌او‌اس) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [4.1.0] - 2025-11-07

> «سنجابک» نسخهٔ محصولی — گیت انتشار سخت‌گیرانه، مرکز انتشار حرفه‌ای، سفربُر جدی، راهنمای سنجابک و مرکز فرمان.

### Added
- **مرکز انتشار (Release Center)** — بازطراحی کامل «دانلود و به‌روزرسانی»: مقایسهٔ نسخهٔ نصب‌شده فقط با آخرین **Stable** (پیش‌انتشار جدا و برچسب‌گذاری‌شده)، فایل پیشنهادی بر اساس سیستم‌عامل کاربر، **تأییدکنندهٔ SHA-256 محلی** (پیاده‌سازی جریانی حافظه‌بهینه با آزمون بردارهای NIST)، یادداشت انتشار با Markdown امن (react-markdown + GFM، بدون innerHTML) و تاریخچهٔ نسخه‌ها.
- **دسته‌بندی درست دارایی‌ها** — ماژول خالص `releases.ts`: تشخیص نوع از روی نام کامل (رفع باگ «CLI به‌جای بستهٔ لینوکس»)، مقایسهٔ SemVer استاندارد با پیش‌انتشار، وضعیت به‌روزرسانی صادقانه.
- **راهنمای سنجابک (Sanjabak Guide)** — اپ جدید: فرادادهٔ کمک برای همهٔ اپ‌ها و بازی‌ها (هدف، امکانات، نحوهٔ استفاده، مجوزها، محل ذخیره، وابستگی اینترنت، محدودیت‌ها، رفع اشکال)، حالت «این چیه؟» با `data-help-id` روی نوار وظیفه/پنجره‌ها/میزکار، پاسخ محلی آفلاین + پاسخ هوشمند اختیاری با `/api/guide` (زمینهٔ فقط-خواندنی، بدون کلید در کلاینت).
- **مرکز فرمان سان‌جاب** — Command Palette با **Ctrl+K** (cmdk): همهٔ اپ‌ها و بازی‌ها، کارهای سیستمی (قفل، ریستارت، کاغذدیواری بعدی، صدا، کاهش حرکت) — جستجوی فارسی/انگلیسی و کیبورد-محور.
- **سفربُر ۴٫۱** — رفع باگ حذف بوکمارک (حذف بر اساس URL خود بوکمارک)، حالت خصوصی با توضیح صادقانه، بازیابی نشست و تب بسته‌شده (Ctrl+Shift+T)، تکثیر تب، انتخاب موتور جستجو (DDG/Google/Bing/Brave/ویکی‌پدیا)، پیشنهادهای نوار آدرس از تاریخچه/بوکمارک، مدیر بوکمارک با ویرایش و ورود/خروج JSON، تاریخچه با پاک‌سازی بازه‌ای، میان‌برهای کامل کیبورد.
- **Endpoint سلامت** — `/api/health` با وضعیت دیتابیس و آپ‌تایم؛ مبنای سلامت‌سنجی دسکتاپ و حالت توسعه‌دهنده.
- **آزمون‌های واحد** — `tests/selftest.test.ts` با دوندهٔ داخلی Bun: مقایسهٔ نسخه، دسته‌بندی دارایی، اعتبارسنجی آدرس، مدیریت بوکمارک و SHA-256 (بردارهای FIPS 180-4 + مرزهای بلوک).

### Changed
- **گیت انتشار Stable** — `release.yml`: حذف `continue-on-error` از job ویندوز؛ انتشار فقط با آرتیفکت‌های اجباری کامل (exe + msi + وب + SBOM)؛ در شکست دسکتاپ، Release **Draft می‌ماند** و علت دقیق گزارش می‌شود؛ سنسِ هم‌خوانی تگ/VERSION/Cargo؛ تازه‌سازی دیتابیس دسکتاپ (schema-only) در CI.
- **راه‌اندازی دسکتاپ (Tauri)** — سلامت‌سنجی واقعی HTTP روی `/api/health` (نه فقط TCP)، تشخیص زودهنگام کرش سایدکار، تایم‌اوت قابل تنظیم `SANJAB_STARTUP_TIMEOUT_MS`، صفحهٔ خطای حرفه‌ای با علت (`static/error.html`)، پاک‌سازی پردازهٔ Node در همهٔ مسیرهای شکست، DATABASE_URL سایدکار به **AppData کاربر** با seed امن از نسخهٔ CI.
- **امنیت** — CSP واقعی در tauri.conf.json (به‌جای null)، هدرهای امنیتی پایه در next.config.ts (nosniff، Referrer-Policy، Permissions-Policy با camera=(self))، حذف لاگ کوئری Prisma در Production.
- **مانیتور سیستم** — برچسب صریح «دادهٔ نمایشی — شبیه‌سازی‌شده» روی رابط (صداقت دربارهٔ دادهٔ فیک).
- نسخه‌ها به **۴٫۱٫۰** همگام شدند: VERSION، package.json، Cargo.toml، tauri.conf.json، version.ts، brand.ts، CLI.

### Fixed
- **باگ حذف بوکمارک مرورگر** — دکمهٔ حذف قبلاً `toggleBookmark` تپ فعال را صدا می‌زد و بوکمارک اشتباه عوض می‌شد؛ حالا حذف بر اساس URL همان بوکمارک است (+ آزمون).
- **SHA-256 جریانی** — پیاده‌سازی با پدینگ صحیح برای پیام‌های مضرب ۶۴ بایت (در آزمون با مرزهای ۵۵–۱۲۹ بایت راستی‌آزمایی شد).
- گیر کردن کاربر روی Loading ابدی در شکست راه‌اندازی سرور دسکتاپ → صفحهٔ خطا با علت و پیشنهاد.

---

## [4.0.0] - 2025-11-06

> «Sanjabak» — تمرکز نسخه: آکادمی‌های واقعی + رانتایم واقعی + نوشت‌یار + پل دسکتاپ ویندوز.

### Added
- **آکادمی پایتون** — ۲۵ درس در ۹ سطح (۰ تا ۸) + ۴ پروژهٔ نهایی (ماشین‌حساب، بازی حدس، مدیر کارها JSON، تحلیل‌گر CSV)؛ هر درس با ساختار کامل: چه یاد می‌گیرید/پیش‌نیاز/تشبیه/تشریح فنی/دو مثال/تحلیل خط‌به‌خط/اشتباه‌های رایج/تمرین/چالش/خلاصه/آزمونک.
- **تصحیح تمرین با CPython واقعی** — Pyodide 0.26.4 در Web Worker؛ assert واقعی، traceback واقعی پایتون؛ `loadPackagesFromImports` برای پکیج‌های WASM؛ تایم‌اوت ۱۵ ثانیه با کشتن ورکر.
- **آکادمی پاورشل** — ۱۲ درس در ۴ مرحله + شبیه‌ساز آموزشی object-pipeline (Where-Object/Sort-Object/Measure-Object روی مدل شیء فیک) + ۵ مأموریت + آزمون.
- **نوشت‌یار** — دستیار نوشتن فارسی کاملاً محلی: اصلاح چیدمان fa↔en با تأیید کاربر، یکسان‌سازی ی/ک و ارقام، نیم‌فاصلهٔ هوشمند، نشانه‌گذاری، غلط‌های رایج، تحلیل خوانایی، پذیرش/رد هر پیشنهاد، undo/redo و ذخیرهٔ سندها.
- **آزمایشگاه حافظهٔ Rust** — چهار دیاگرام تعاملی (Move/Borrow/Clone/Drop) با انیمیشن و خطاهای واقعی rustc (E0382، E0502، E0499).
- **آزمایشگاه‌های AI** — توکن‌ساز BPE زنده، خودتوجهی (Attention) با اعداد واقعی، و آزمایشگاه RAG (بازیابی بگ-آو-وردز + چانکینگ).
- **مدیر اجراکننده‌ها** — فهرست صادقانهٔ موتورها (Pyodide، مینی، v86/Alpine، شبیه‌سازها، WebGPU، آیتم‌های برنامه‌ریزی‌شده) با آزمایش سریع پایتون واقعی.
- **دانلود و به‌روزرسانی** — خواندن زندهٔ GitHub Releases (نسخه، یادداشت، فایل‌ها، حجم، checksum) با کش ۱۰ دقیقه‌ای.
- **POC دسکتاپ ویندوز (Tauri v2)** — `src-tauri/` با معماری سایدکار: Node.exe باندل‌شده + سرور Next standalone فقط روی `127.0.0.1:<پورت آزاد>`؛ خاموشی تمیز پردازه؛ NSIS per-user و MSI.
- **Release pipeline کامل** — `release.yml`: بیلد وب + SBOM (SPDX) + THIRD-PARTY-NOTICES + SHA256SUMS → draft release؛ job ویندوز (tauri-action، windows-latest، rust-cache، آیکن‌سازی خودکار) → publish مشروط با یادداشت صادقانه.
- گیمیفیکیشن: `registerGame` به‌رکورد-جدید بازی‌ها وصل شد؛ `completeLesson('ai')` و `('powershell')` و `('python')` فعال شدند.

### Fixed
- شمارش‌های کهنه: boot-screen «۲۸ مأموریت» و «۱۴ فصل»؛ کپی آکادمی لینوکس.
- ناسازگاری نسخه‌ها: `VERSION` / `package.json` / `brand.ts` / `tauri.conf.json` همگی ۴.۰.۰ + سنسِ نسخه در CI.
- کد مردهٔ `wrapped` در pyodide-worker حذف شد؛ آکادمی AI حالا XP درس‌ها را ثبت می‌کند.
- `.gitignore` بازیابی شد؛ مودهای فایل‌های ۷۵۵ به ۶۴۴ بازگشت.

### Changed
- README بازنویسی شد: ماتریس صادقانهٔ قابلیت‌ها (شبیه‌ساز vs واقعی) + مستندات دسکتاپ.
- `THIRD_PARTY_LICENSES.md`: Pyodide (MPL-2.0)، Node sidecar و بخش «منابع آموزشی — الهام ساختاری بدون کپی».

---

## [2.0.0] - 2025-11-06

> نسخهٔ 2.0.0 با این ریلیز tag و منتشر می‌شود (قبل از آن `unreleased` بود).
> یادداشت صادقانگی: آیتم‌هایی که در snapshot کدِ فعلی هنوز merge نشده‌اند در بخش «In progress for 2.0.0 line» علامت خورده‌اند — در release notes نهایی به‌صورت Known limitations هم می‌آیند.

### Added

- **Docs suite (فارسی + English terms):** `docs/AUDIT.md` (10 یافته با شناسه/شدت/بازتولید/اصلاح/تست/وضعیت)، `docs/SECURITY.md` (مدل تهدید، حریم خصوصی دوربین، سیاست مدل‌ها)، `docs/ARCHITECTURE.md` (نقشهٔ بوت، storage layers، runtime adapters)، `docs/DEPENDENCIES.md` (ماتریس تصمیم وابستگی‌ها + ردیف‌های evaluation-only)، `docs/ROADMAP.md` (فازهای 1–10)، `docs/RELEASES.md` (SemVer، کانال‌ها، چک‌لیست، سیاست آپدیت)، `docs/PLATFORM_SUPPORT.md` (ماتریس مرورگر/WSL2/Termux).
- `VERSION` file (single source of truth: `2.0.0`) و `THIRD_PARTY_LICENSES.md` شامل Alpine guest، وزن‌های face-api و v86.
- **CI:** `.github/workflows/ci.yml` — checkout + Bun + `bun install --frozen-lockfile` + `bunx tsc --noEmit` + lint + build (standalone) روی push/PR.
- **Release pipeline:** `.github/workflows/release.yml` — روی tag `v*`: بیلد وب، tarball standalone، tarball شرطی CLI (اگر `cli/` موجود باشد)، تولید `SHA256SUMS.txt` و انتشار GitHub Release با قالب notes.
- **linux-edition hardening:** سرویس systemd با کاربر/گروه اختصاصی `sanjabos`، `ExecStartPre` precheck، hardening گسترده (`NoNewPrivileges`, `ProtectSystem=strict`, `ProtectHome`, `PrivateTmp`, `RestrictSUIDSGID`, `LockPersonality`, `RestrictAddressFamilies`, `ReadWritePaths` محدود، `MemoryMax=1G`, `CPUQuota=80%`) و گوش‌دادن پیش‌فرض روی loopback.
- `docker-compose.yml` فقط پورت را روی `127.0.0.1:4310` مپ می‌کند (expose کردن روی LAN باید صریحاً توسط اپراتور انجام شود).
- `install.sh`: ساخت کاربر سیستم `sanjabos` با `--system`، بیلد با کاربر فراخوان (نه root)، بکاپ دادهٔ قبلی قبل از migration، آپدیت بدون `git reset --hard` (فقط `git pull --ff-only`).
- `uninstall.sh`: حفظ دادهٔ کاربر به‌صورت پیش‌فرض؛ حذف کامل فقط با فلگ `--purge`.
- جعبهٔ وضعیت صادقانه در `linux-edition/README.md` («بسته‌ها طراحی شده‌اند ولی هنوز boot-test رسمی نشده‌اند») + راهنمای سریع WSL2/Termux.
- هم‌ترازی نسخهٔ packaging با 2.0.0 (debian control/changelog، build-deb.sh، PKGBUILD).
- سفربُر (مرورگر داخلی) با بوکمارک و تاریخچه.
- آکادمی Rust — ۲۲ درس + شبیه‌ساز زیرمجموعهٔ Rust در مرورگر.
- آکادمی AI — ۷ آزمایش تعاملی به سبک micrograd (پرسپترون، نزول گرادیان، فعال‌سازها، شبکهٔ عصبی، بایگرام، بیش‌برازش، اخلاق).
- هوش‌یار با preset های OpenAI/OpenRouter/Groq/DeepSeek/Claude و **GLM (چی‌پو)** — کلید فقط در مرورگر کاربر.
- PDF ساز واقعی (pdf-lib + pdf.js) با ویرایش/ادغام و متن فارسی.

### Changed

- برچسب‌گذاری صادقانهٔ اپ‌های Face AI: body-metrics «تخمین» است (نه سنجش پزشکی)؛ ماشین زمان چهره «synthetic» است.
- برچسب صادقانهٔ v86: «emulated x86 32-bit» — کرنل واقعی Alpine 3.21.9 (kernel 6.12.114 i686)، سخت‌افزار شبیه‌سازی.
- برچسب صادقانهٔ code-studio: اجرای JS در Web Worker یک مرز امنیتی سخت نیست.
- README: بخش «مستندات و امنیت» اضافه شد (لینک‌های docs و خلاصهٔ سیاست امنیتی).

### Security

- untrack شدن `.env` و `db/custom.db` از گیت + قواعد gitignore (`db/`, `*.db`, `.env*`) — AUDIT-001/002.
- حذف `typescript.ignoreBuildErrors` از `next.config.ts` — `tsc --noEmit` صفر خطا؛ gate در CI فعال.
- `/api/tutor`: rate limit (۸/دقیقه/IP)، سقف حجم بدنه (2KB)، role رسمی `system`، timeout ۳۰ ثانیه — AUDIT-006.
- `/api/scores`: دفتر رسمی بازی‌ها (allowlist + بازهٔ امتیاز هر بازی)، rate limit (۱۰/دقیقه)، اعتبارسنجی نام — AUDIT-005.
- GitHub token: حالت «فقط این نشست» (sessionStorage)، ماسک‌نمایی، راهنمای حداقل‌دسترسی و revoke — AUDIT-007.
- پشتیبان‌گیری: کلیدهای API عمداً از فایل پشتیبان حذف می‌شوند.

## Shipped in this drop (کد 2.0 — اکنون در مخزن)

- **lazy-loading رجیستری اپ‌ها** با `next/dynamic` — هر اپ/بازی chunk جدا + loading state؛ bundle اصلی فقط فراداده.
- **Pyodide (CPython واقعی) در کداستودیو** — `pyodide-worker.js` (v0.26.4 پین‌شده، Web Worker جدا)، انتخابگر «مینی (آفلاین)» مقابل «پایتون واقعی CPython»، timeout و سقف خروجی؛ مترپرتر مینی صادقانه «زیرمجموعهٔ آموزشی» برچسب خورده.
- **آزمایشگاه شبکه عصبی واقعی در آکادمی AI** — موتور autodiff اسکالر (الهام micrograd)، MLP قابل تنظیم (لایه/نورون)، آموزش زنده با پس‌انتشار، مرز تصمیم و منحنی خطا روی canvas.
- **مأموریت‌های کامپایلر در آکادمی Rust** (سبک rustlings) — ۶ مأموریت با خطای واقعی rustc (E0382/E0384/E0308/...)، چک‌گر ساختاری + اجرای شبیه‌ساز، راهنما و راه‌حل؛ برچسب صادقانه: کامپایلر واقعی rustc در مرورگر نیست.
- **موتور گیمیفیکیشن مرکزی** (`src/lib/gamification/`) — XP با رویدادهای idempotent، ۱۵ دستاورد، مأموریت روزانهٔ قطعی، استریک روزها؛ اپ «مرکز پیشرفت» + اتصال به آکادمی‌ها (لینوکس/Rust/AI/کداستودیو).
- **بکاپ/بازیابی در تنظیمات** — export/import کل داده‌های سیستم به‌صورت JSON (بدون رازها) + گزارش حجم؛ `src/lib/os/backup.ts`.
- **v86 snapshot** — ذخیره/بازیابی وضعیت ماشین Alpine در IndexedDB (`src/lib/os/idb.ts`) + دکمه‌های Save/Restore.
- **سفربُر** — بوکمارک کاربر (persist)، پیام راهنمای سایت‌های X-Frame-Options با دکمهٔ باز کردن بیرونی.
- **Sanjab CLI 2.0.0** (`cli/`) — پکیج پایتون stdlib-only با ۲۱ ماژول: درس‌های پایتون/Rust/لینوکس فارسی، بازی‌ها (quiz/typing/memory)، لابراتوار شل مجازی امن، doctor، گیمیفیکیشن (XP/دستاورد/استریک)، backup/restore، update --check، uninstall؛ نصب با pipx.


## [1.x] — Legacy

خلاصهٔ نسخه‌های 1.x (پیش از این فایل):

- اولین نسخهٔ دسکتاپ وب فارسی RTL: بوت، دسکتاپ، window manager، ترمینال آموزشی پنگوئن‌اواس، آکادمی لینوکس، بازی‌ها، آفیس سبک، موتور مفسر mini-python/سنجابی.
- اولین نسخهٔ linux-edition (install.sh، systemd، deb، PKGBUILD، Docker، kiosk) با نسخهٔ بستهٔ `1.0.0`.
- در 1.x به‌طور پیش‌فرض از `.env` بسته‌بندی‌شده برای `DATABASE_URL` استفاده می‌شد و ممیزی 2.0 چند ضعف امنیتی این دوره را ثبت کرد (AUDIT-001 تا 010).

[2.0.0]: https://github.com/kiarash65/sanjab-os/compare/v1.0.0...v2.0.0
