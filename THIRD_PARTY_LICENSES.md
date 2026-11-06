# مجوزهای اشخاص ثالث — Third-Party Licenses (v4.0.0)

> سان‌جاب‌او‌اس خودش تحت **MIT** منتشر می‌شود (فایل `LICENSE`). این سند فهرست وابستگی‌های زمان اجرا با مجوز، منبع، نسخهٔ پین‌شده و محل استفاده است. نسخه‌های دقیق در `package.json` / `bun.lock`.

## وابستگی‌های زمان اجرا (Runtime dependencies)

| بسته/پروژه | مجوز | منبع | نسخهٔ پین‌شده | کجا استفاده شده |
|-------------|------|------|----------------|------------------|
| Next.js | MIT | https://github.com/vercel/next.js | 16.1.1 | فریمورک اپ (App Router، standalone) |
| React / React-DOM | MIT | https://github.com/facebook/react | 19.x | UI |
| Tailwind CSS | MIT | https://github.com/tailwindlabs/tailwindcss | 4.x | استایل |
| shadcn/ui (کامپوننت‌های vendored) | MIT | https://github.com/shadcn-ui/ui | vendored در `src/components/ui` | UI primitives |
| Radix UI | MIT | https://github.com/radix-ui/primitives | نسخه‌های `^1.x`/`^2.x` | پایهٔ shadcn |
| zustand | MIT | https://github.com/pmndrs/zustand | 5.0.6 | وضعیت OS + persist |
| Prisma / @prisma/client | Apache-2.0 | https://github.com/prisma/prisma | 6.11.1 | `/api/scores` (SQLite) |
| v86 | BSD-2-Clause | https://github.com/copy/v86 | بیلد پین‌شده در `public/v86/` (libv86.js, v86.wasm, seabios.bin, vgabios.bin) | شبیه‌ساز x86 در اپ «بوت کرنل واقعی» |
| **Alpine Linux (guest OS)** | GPL-2.0 (کرنل Linux) و مجوزهای متعدد Alpine (musl MIT-like، busybox GPL-2.0 و ...) | https://alpinelinux.org — bzImage/initramfs رسمی netboot 3.21.9 | kernel 6.12.114-0-virt (i686) + initramfs + alpine-virt.iso در `public/v86/` | کرنل واقعی داخل مرورگر؛ مجوزهای guest برای کاربر نهایی با همین توزیع رسمی اعمال می‌شود |
| face-api.js | MIT | https://github.com/justadudewhohacks/face-api.js | 0.22.2 از `https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js` | اپ‌های چهره (face-detect، body-metrics، age-machine) |
| face-api model weights | MIT | https://github.com/justadudewhohacks/face-api.js (پوشهٔ weights) | از `https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights` | TinyFaceDetector + age_gender + expression |
| pdf-lib | MIT | https://github.com/Hopding/pdf-lib | 1.17.1 | PDF ساز (نوشتن/ادغام) |
| pdfjs-dist | Apache-2.0 | https://github.com/mozilla/pdf.js | 6.5.438 (+ worker در `public/pdf/pdf.worker.min.mjs`) | PDF ساز (رندر) |
| docx | MIT | https://github.com/dolanmiu/docx | 9.15.1 | خروجی Word نویسا |
| jspdf | MIT | https://github.com/parallax/jsPDF | 4.2.1 | خروجی PDF نویسا/اسلایدساز |
| **Pyodide (CPython WASM)** | MPL-2.0 | https://github.com/pyodide/pyodide | 0.26.4 از `https://cdn.jsdelivr.net/pyodide/v0.26.4/full/` (پین‌شده در `public/pyodide-worker.js`) | موتور پایتون واقعی — آکادمی پایتون، کداستودیو (حالت واقعی)، مدیر اجراکننده‌ها |
| Node.js sidecar (دسکتاپ) | MIT | https://nodejs.org | v22.14.0 win-x64 — در CI دانلود و در نصب‌کننده Tauri باندل می‌شود | اجرای سرور محلی Next standalone در نسخهٔ دسکتاپ (`src-tauri`) |
| z-ai-web-dev-sdk | مجوز platform (سرویس‌دهنده) | platform سان‌جاب | 0.0.18 | فقط server-side در `/api/tutor` |
| lucide-react | ISC | https://github.com/lucide-icons/lucide | 0.525.0 | آیکن‌ها |
| framer-motion | MIT | https://github.com/motiondivision/motion | 12.x | انیمیشن |
| recharts | MIT | https://github.com/recharts/recharts | 2.x | چارت‌ها |
| dnd-kit (@dnd-kit/*) | MIT | https://github.com/clauderic/dnd-kit | 6.x/10.x/3.x | drag & drop |
| react-hook-form + zod | MIT | https://github.com/react-hook-form/react-hook-form · https://github.com/colinhacks/zod | 7.x · 4.x | فرم‌ها/اعتبارسنجی |
| sonner | MIT | https://github.com/emilkowalski/sonner | 2.x | toast |
| next-themes | MIT | https://github.com/pacocoursey/next-themes | 0.4.x | تم |
| html2canvas | MIT | https://github.com/niklasvh/html2canvas | 1.4.1 | خروجی تصویری |
| sharp | Apache-2.0 (زیرمجموعه‌های libvips LGPL-2.1+/سایر مجوزهای vips) | https://github.com/lovell/sharp | 0.34.3 | پردازش تصویر سمت سرور (وابستگی build/serve) |
| Tw-animate-css / tailwindcss-animate | MIT | https://github.com/Wombosvideo/tw-animate-css | 1.3.5 | انیمیشن tailwind |

> محیط اجرای سمت سرور در نسخهٔ لینوکس/Docker: **Bun** (oven/bun 1.1 — مجوز Bun MIT-based؛ اسکریپت‌های نصب فقط runtime را نصب می‌کنند).

## گنجانده‌شده‌های خاص (Bundled assets)

| دارایی | مجوز | منبع | محل |
|--------|------|------|-----|
| کرنل Linux (bzImage) در guest Alpine | GPL-2.0 | Alpine netboot رسمی 3.21.9 | `public/v86/vmlinuz-virt` |
| initramfs + ISO Alpine virt | مجوزهای Alpine Linux | Alpine netboot 3.21.9 | `public/v86/initramfs-virt`، `public/v86/alpine-virt.iso` |
| SeaBIOS / VGA BIOS | LGPL-3.0 (SeaBIOS) | همراه بیلد v86 | `public/v86/seabios.bin`، `public/v86/vgabios.bin` |
| لوگو/والپیپرها/آواتارهای سان‌جاب | MIT (مالکیت پروژه) | ساخته‌شده برای این پروژه | `public/` |

## موارد ارزیابی‌شده و حذف‌شده

- **CodeFormer** — به دلیل موانع مجوز (استفادهٔ تجاری/توزیع) از توزیع در این پروژه **حذف شد (REJECTED)**. کد یا وزن آن در ریپو/بیلد وجود ندارد.
- **GFPGAN** — ارزیابی شد؛ به دلیل ابهام مجوز بازتولید و ملاحظات consent دادهٔ چهره ادغام نشد.
- **SAM** و مدل‌های پیری چهره (Dual Aging Diffusion) — کد پژوهشی/وزن‌های سنگین GPU؛ ادغام نشد.
- فهرست کامل تصمیم‌ها: `docs/DEPENDENCIES.md` (بخش evaluation-only).

## روش انطباق

1. هنگام افزودن وابستگی جدید، ردیف این جدول + ردیف ماتریس `docs/DEPENDENCIES.md` هم‌زمان به‌روزرسانی می‌شود.
2. مجوزهای non-permissive قبل از ورود بررسی می‌شوند.
3. در توزیع‌های بسته‌بندی (deb/arch)، فایل این سند همراه بسته کپی می‌شود (`packaging/debian/copyright` مرجع دبین است).


## منابع آموزشی (الهام ساختاری — بدون کپی محتوا)

| پروژه | مجوز | استفادهٔ ما |
|---|---|---|
| rust-lang/rustlings | MIT | الگوی مأموریت‌های کوتاه تصحیح‌شوندهٔ آکادمی Rust |
| google/comprehensive-rust | Apache-2.0 | ساختار مراحل (مالکیت → انواع → پیشرفته) |
| microsoft/ML-For-Beginners | MIT | چیدمان مفاهیم ML (بخش‌های AI آکادمی) |
| microsoft/generative-ai-for-beginners | MIT | سرفصل بخش LLM/RAG |
| denysdovhan/learnyoubash (GPL) و bash-handbook (CC-BY-SA) | GPL / CC-BY-SA | فقط الهام طراحی تمرین‌ها؛ محتوایی کپی نشده است |
| FarsioIR/NeveshtYar | MIT | الهام قابلیت‌های نوشت‌یار (چیدمان، نرمال‌سازی) — پیاده‌سازی اصلی |
| Dadmatech/DadmaTools | Apache-2.0 | الهام فهرست قابلیت‌های نرمال‌سازی فارسی — پیاده‌سازی اصلی |
| karpathy/micrograd | MIT | الگوی autodiff — `src/lib/ai/micrograd.ts` بازنویسی آموزشی مستقل است |

> قاعده: هر محتوای آموزشی این پروژه متنِ اصلی فارسی است؛ پروژه‌های بالا فقط به‌عنوان مرجعِ ساختار دوره استفاده شده‌اند و کد/متن آن‌ها کپی نشده است.
