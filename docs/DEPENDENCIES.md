# ماتریس تصمیم وابستگی‌ها — Dependencies Decision Matrix (v2.0.0)

> نسخه‌ها از `package.json` / `bun.lock` و فایل‌های پین‌شدهٔ ریپو خوانده شده‌اند. هر ردیف: روش ادغام انتخاب‌شده، دلیل، محدودیت‌ها و وضعیت.

## ۱. وابستگی‌های ادغام‌شده (Integrated)

| پروژه | نسخه/commit پین‌شده | مجوز | روش ادغام | دلیل | محدودیت‌ها | وضعیت |
|-------|----------------------|-------|-----------|------|-------------|--------|
| Next.js | 16.1.1 (`^16.1.1`) | MIT | bun.lock، App Router، `output: standalone` | فریمورک اصلی web + standalone برای نسخهٔ لینوکس/Docker | نیاز به بیلد در زمان نصب | Integrated |
| React / React-DOM | 19 (`^19.0.0`) | MIT | bun.lock | پایهٔ UI | — | Integrated |
| Tailwind CSS | 4 (`^4` + `@tailwindcss/postcss`) | MIT | postcss + `tw-animate-css` | استایل RTL/تم | نحو v4 با v3 متفاوت | Integrated |
| shadcn/ui | کامپوننت‌های vendored در `src/components/ui` (radix-ui props) | MIT | کپی کامپوننت (شِما `components.json`) | کنترل کامل روی کد UI | آپدیت دستی | Integrated |
| zustand | 5.0.6 | MIT | persist middleware | مدیریت وضعیت پنجره‌ها/فایل‌سیستم | persist فقط localStorage | Integrated |
| Prisma | 6.11.1 (`^6.11.1`) | Apache-2.0 | `prisma/schema.prisma` + SQLite | جدول امتیازهای جهانی | نیاز به `DATABASE_URL` (AUDIT-001) | Integrated |
| v86 | بیلد پین‌شده در `public/v86/` (libv86.js + v86.wasm + seabios/vgabios) | BSD-2-Clause | فایل‌های باندل‌شده در `public/`، آفلاین | بوت کرنل واقعی Linux در مرورگر | فقط x86 32-bit؛ سنگین برای دستگاه ضعیف | Integrated |
| Alpine Linux (guest) | 3.21.9 — `vmlinuz-virt` (kernel 6.12.114-0-virt i686) + `initramfs-virt` + `alpine-virt.iso` | GPL-2.0 (کرنل) و مجوزهای Alpine | فایل‌های رسمی netboot در `public/v86/` | guest واقعی با `apk` آفلاین از ISO | حجم ~85MB؛ license های guest در THIRD_PARTY_LICENSES.md | Integrated |
| face-api.js | 0.22.2 — `https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js` | MIT | بارگذاری از CDN پین‌شده با اقدام صریح کاربر | تشخیص چهره/سن/حالت بدون سرور | وزن‌ها روی ref `@master` (AUDIT-009 — پین SHA در کارهای بعدی) | Integrated |
| face-api model weights | مخزن justadudewhohacks — `https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights` | MIT | CDN jsDelivr، فقط با فعال‌سازی دوربین | TinyFaceDetector + age_gender + expression | ref متغیر؛ SRI ندارد | Integrated (پین SHA pending) |
| Pyodide | 0.26.x (هدف) | MPL-2.0 | ارزیابی‌شده برای Worker | CPython واقعی در مرورگر | **هنوز ادغام نشده** — مفسر mini-python فعلی آموزشی است | Evaluated / Planned — NOT in code |
| pdf-lib | 1.17.1 (`^1.17.1`) | MIT | npm | ساخت/ادغام/چرخش صفحات PDF | — | Integrated |
| pdfjs-dist | 6.5.438 (`^6.5.438`)، worker در `public/pdf/pdf.worker.min.mjs` | Apache-2.0 | npm + worker باندل‌شده | رندر PDF در PDF ساز | worker باید هم‌نسخه باشد | Integrated |
| docx | 9.15.1 (`^9.15.1`) | MIT | npm | خروجی Word از نویسا | — | Integrated |
| jspdf | 4.2.1 (`^4.2.1`) | MIT | npm | خروجی PDF نویسا/اسلایدساز | — | Integrated |
| z-ai-web-dev-sdk | 0.0.18 (`^0.0.18`) | مجوز platform SDK | server-only در `/api/tutor` | پراکسی هوش مصنوعی ترمینال آموزشی | فقط سمت سرور؛ مستند از platform | Integrated |
| Lucide (lucide-react) | 0.525.0 (`^0.525.0`) | ISC | npm | آیکن‌های کل UI | — | Integrated |
| Radix UI (پایهٔ shadcn) | نسخه‌های `^1.x`/`^2.x` در package.json | MIT | npm | پرimitives دسترس‌پذیر | — | Integrated |
| framer-motion / recharts / dnd-kit / react-hook-form / zod / sonner / next-themes و غیره | طبق `package.json` | MIT | npm | UX عمومی | — | Integrated |

## ۲. ردیف‌های «فقط ارزیابی‌شده» — Evaluation-only (ادغام نشده؛ دلیل مستند)

| پروژه | مجوز | دلیل عدم ادغام در 2.0 | تصمیم |
|-------|------|------------------------|--------|
| SAM (Segment Anything) | Apache-2.0 (کد research) | کد پژوهشی؛ checkpoint های GPU-سنگین؛ برای محصول وب مرورگری عملیاتی نیست | NOT integrated — نیاز به سرویس native جداگانه دارد (Blocked) |
| Dual Aging Diffusion (مدل‌های پیری چهره) | research-only | وزن‌ها/کد تحقیقاتی، هزینهٔ inference بالا، بدون مجوز تولیدی روشن | NOT integrated |
| GFPGAN | اجازهٔ بازتولید/مجوز محدود + ملاحظات consent چهره | ارزیابی شد؛ نگرانی مجوز بازتولید و رضایت دادهٔ چهره | Evaluated — NOT integrated |
| CodeFormer | مجوز با مانع استفادهٔ تجاری | blocker مجوزی برای توزیع در پروژهٔ MIT | **REJECTED for distribution** |
| MediaPipe | Apache-2.0 | گزینهٔ آینده برای upgrade لندمارک چهره؛ فعلاً face-api.js کافی است | Possible future upgrade |
| TensorFlow Playground | Apache-2.0 | فقط مرجع طراحی برای زمین‌بازی شبکهٔ عصبی آکادمی AI | Design reference |
| micrograd | MIT | مرجع آموزشی برای lab autodiff بسته‌بندی‌شده در آکادمی AI (پیاده‌سازی خودمان) | Educational reference |
| Transformers.js / WebLLM | Apache-2.0 / MIT | ML مرورگری اختیاری در آینده؛ با سیاست «بدون دانلود خودکار مدل» سازگار نیست مگر opt-in کامل | Optional future (opt-in) |
| llama.cpp | MIT | خارج از scope وب؛ مسیر native/CLI در آینده | Out of scope (web) |
| Rustlings / Rust By Example | MIT / Apache-2.0 | فقط مرجع curriculum برای آکادمی Rust؛ کد بالادستی باندل نمی‌شود | Curriculum references |
| Phaser | MIT | بازی‌های 2D آینده؛ بازی‌های فعلی canvas خالص‌اند | Future (2D games) |
| xterm.js | MIT | upgrade آیندهٔ رندر ترمینال؛ ترمینال فعلی کامپوننت اختصاصی است | Future (terminal rendering) |
| node-pty | MIT (با native addon) | مسیر agent نیتیو؛ باندل نمی‌شود | Not bundled (native path) |
| Termux / proot-distro | GPL-3.0 / مجوزهای بالادستی | مسیر مستندشدهٔ اندروید؛ باندل نمی‌شود، فقط راهنما | Documented path (Android) |
| Playwright / Vitest | Apache-2.0 / MIT | QA برنامه‌ریزی‌شده؛ هنوز تست‌ها author نشده‌اند و CI فعلاً بدون تست‌job است | Planned QA — not yet authored |
| Textual / Rich | MIT | پرداخت ظاهر CLI؛ CLI فعلاً فقط stdlib است | Optional CLI polish |

## ۳. قواعد به‌روزرسانی وابستگی‌ها

1. آپدیت‌ها از طریق `bun update <pkg>` با commit جداگانه و چک CI (typecheck سخت‌گیرانه).
2. هر CDN جدید باید نسخه‌پین‌شده باشد و به‌همراه URL دقیق در این سند ثبت شود؛ ترجیح: self-host در `public/`.
3. هر وابستگی با مجوز non-permissive (مثل AGPL یا مجوز با مانع تجاری) قبل از ورود باید در این جدول ارزیابی و تأیید شود.
4. وزن‌های مدل فقط با اقدام صریح کاربر بارگذاری می‌شوند — هیچ دانلود خودکار مدل.
