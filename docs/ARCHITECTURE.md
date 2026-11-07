# معماری — Architecture (v4.0.0 «سنجابک»)

> نقشهٔ فنی سان‌جاب‌او‌اس: از بوت مرورگر تا کرنل واقعی Alpine داخل شبیه‌ساز.
> به‌روزرسانی برای ریلیز ۴.۰: لایهٔ دامنهٔ یادگیری، مرکز یادگیری، آکادمی الگوریتم، مربی سنجاب، کارگاه پروژه و سنجابک اضافه شد — جزئیات: docs/LEARNING-EXPERIENCE-TRANSFORMATION.md

## ۱. نمای کلی (Boot → Desktop → Apps)

```
┌───────────────────────────── مرورگر کاربر ─────────────────────────────┐
│                                                                        │
│  app/page.tsx                                                          │
│     └─▶ OSRoot (components/os/os-root.tsx)                             │
│           ├─ BootScreen  (انیمیشن بوت + نقشهٔ ایران)                   │
│           ├─ Desktop     (desktop-icons + wallpapers + tux-pet)        │
│           ├─ Window Manager  (store.ts: مختصات، focus، z-index، ...)   │
│           ├─ StartMenu / Taskbar / Toasts / LockScreen                 │
│           └─ WindowFrame ──▶ رجیستری اپ‌ها (lib/os/apps.tsx)           │
│                                  ├─ 39 اپ (app category)               │
│                                  ├─ 10 بازی (game category)            │
│                                  └─ 1 اپ سیستمی (about)                │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

- رجیستری اپ‌ها (`APPS: AppMeta[]`) متادیتای هر اپ را دارد: `id`، `name`، `icon`، `category`، اندازهٔ پنجره، `keywords`، گرادیان `tint`.
- `launch(id)` از طریق `useOS.openApp(...)` پنجره می‌سازد؛ `getApp(id)` کامپوننت را از رجیستری برمی‌گرداند.
- وضعیت بارگذاری: رجیستری اپ‌ها با `next/dynamic` (`ssr: false`) lazy-loaded است — هر اپ/بازی chunk جدا (از نسخهٔ ۲.۱).

## ۲. لایه‌های ذخیره‌سازی (Storage layers)

```
┌─────────────────────────── مرورگر کاربر ───────────────────────────┐
│ localStorage (zustand persist)                                     │
│   ├─ sunjob-os-v1   → فقط settings (partialize: settings)          │
│   │                    (wallpaper, accent, funMode, sound, ...)    │
│   └─ pengo-fs-v2    → فایل‌سیستم مجازی پنگوئن‌اواس (fs.ts)          │
│                        درخت /home/pengo مشترک بین ترمینال/پرونده‌ها │
│ localStorage (کلیدهای اپ‌ها)                                        │
│   ├─ pengo-notes / pengo-sheets-v1 / pengo-slides-v1 / pengo-ideas │
│   ├─ pengo-ai-chats-v1 / pengo-tutor-v1 / pengo-sh-history         │
│   ├─ pengo-best-* / pengo-player-name (بازی‌ها)                    │
│   ├─ pengo-ai-cfg-v1 / pengo-gh-token-v1 (اعتبارنامه — SECURITY.md)│
│   └─ pengo-custom-wallpaper                                        │
│ IndexedDB                                                          │
│   └─ وضعیت VM (save/restore v86) و بکاپ/بازیابی — [planned]        │
└────────────────────────────────────────────────────────────────────┘
┌─────────────────────────── سرور ───────────────────────────────────┐
│ SQLite (Prisma, db/custom.db از DATABASE_URL)                      │
│   └─ فقط Score { game, name, score, createdAt } — رکوردهای جهانی   │
└────────────────────────────────────────────────────────────────────┘
```

- persist زوستند با `partialize` فقط `settings` را نگه می‌دارد — پنجره‌های باز بین رفرش حفظ نمی‌شوند.
- IndexedDB (وضعیت VM، بکاپ/بازیابی، مهاجرت fs) طراحی شده اما در snapshot فعلی کدی ندارد `[planned]`.

## ۳. آداپتورهای رانتایم کد (Runtime adapters)

```
┌───────────────────────────── کداستودیو ─────────────────────────────┐
│                                                                      │
│  python (mini)     → مفسر آموزشی بسته‌بندی‌شده (lib/os/interpreter.ts)│
│                      بدون وابستگی، کاملاً آفلاین، زیرمجموعهٔ پایتون   │
│                      برچسب: «educational mini-python»               │
│                                                                      │
│  squirrel (سنجابی) → زبان برنامه‌نویسی فارسی، همان مفسر              │
│                                                                      │
│  javascript        → Web Worker ساخته‌شده از blob URL                │
│                      کنترل: worker.terminate() — جعبهٔ شنی سخت نیست  │
│                      (AUDIT-008، برچسب صادقانه در UI)               │
│                                                                      │
│  html              → پیش‌نمایش زندهٔ iframe                          │
│                                                                      │
│  Pyodide (CPython 3.12 واقعی در Worker) — فعال (PyodideRunner)       │
│    ارزیابی‌شده: MPL-2.0، نسخهٔ 0.26.x از CDN پین می‌شود              │
│    هنوز در کد ادغام نشده؛ ادغام به فاز 3 نقشهٔ راه موکول است         │
└──────────────────────────────────────────────────────────────────────┘
```

## ۴. آداپتور هوش مصنوعی (هوش‌یار)

```
┌──────────── مرورگر کاربر ────────────┐        ┌── سرویس بیرونی ──┐
│ ai-chat.tsx / idea-generator.tsx     │        │ OpenAI-compatible│
│   └─ integrations.ts                 │        │   api.openai.com │
│       cfg = { kind, baseUrl,         │ fetch  │   openrouter.ai  │
│               apiKey, model }        │───────▶│   api.groq.com   │
│       (localStorage: pengo-ai-cfg-v1)│        │   deepseek       │
│   presets: openai / openrouter /     │        │   GLM (bigmodel) │
│   groq / deepseek / claude / glm     │        │ Anthropic API    │
└──────────────────────────────────────┘        └──────────────────┘
```

- کلید و baseUrl/model همه از کاربر است؛ هیچ کلیدی سمت سرور نگه‌داری نمی‌شود؛ preset آمادهٔ **GLM (چی‌پو)** با مدل `glm-4-flash` موجود است.
- برای Anthropic از هدر `anthropic-dangerous-direct-browser-access` استفاده می‌شود — مستند و آگاهانه.

## ۵. مسیرهای API سرور (API routes)

```
┌ مرورگر ┐   POST /api/tutor { question }        ┌ Node/Bun server ┐
│ ترمینال │ ────────────────────────────────────▶│ rate limit [planned]
│ آموزشی  │   cap 500 کاراکتر                    │ z-ai-web-dev-sdk│
└─────────┘   (نقش system + timeout [planned])   └─────────────────┘
┌ مرورگر ┐   GET  /api/scores?game=...           ┌ Prisma/SQLite ──┐
│ بازی‌ها │   POST /api/scores {game,name,score}  │ جدول Score      │
└─────────┘   (رجیستری + rate limit [planned])   └─────────────────┘
```

## ۶. موتور بازی‌وارسازی (Gamification engine)

- موجود: رکورد محلی هر بازی (`pengo-best-*`)، اسم بازیکن (`pengo-player-name`)، پنل «رکوردهای جهانی» (`components/os/leaderboard.tsx` → `/api/scores`)، اعلان‌های سرگرم‌کنندهٔ سیستم.
- موتور جامع XP/سطح/مدال/«مرکز پیشرفت»: `[planned]` — در snapshot فعلی پیاده‌سازی نشده و فقط رکورد بازی‌ها وجود دارد.

## ۷. اپ‌های Face AI (بینایی محلی)

```
دوربین (getUserMedia، فقط HTTPS/localhost)
   └─▶ <video> محلی
         └─▶ face-api.js 0.22.2 (jsDelivr، پین‌شده، با اقدام صریح کاربر)
               ├─ TinyFaceDetector        → جعبهٔ چهره
               ├─ age_gender_model        → تخمین سن/جنسیت
               └─ expression_model        → حالات چهره
                     ├─ face-detect.tsx   → برچسب‌های فارسی زنده
                     ├─ body-metrics.tsx  → تخمین قد با کالیبراسیون چهره + BMI
                     │      ⚠ برچسب صادقانه: «تخمین/estimate» — نه سنجش پزشکی
                     └─ age-machine.tsx   → شبیه‌سازی پیر/جوان‌سازی روی canvas
                            با لندمارک‌ها — برچسب «synthetic»
```

- هیچ فریمی از مرورگر خارج نمی‌شود (SECURITY.md بخش ۳).

## ۸. کرنل واقعی داخل مرورگر (v86)

```
public/v86/  (آفلاین، ~85MB)
  ├─ v86.wasm + libv86.js + seabios.bin + vgabios.bin
  ├─ vmlinuz-virt      → bzImage رسمی Alpine 3.21.9 (i686)
  ├─ initramfs-virt    → initramfs netboot
  └─ alpine-virt.iso   → cdrom: مخزن apk آفلاین + modloop
        └─▶ real-linux.tsx: V86({...})
              ├─ memory: شبیه‌سازی x86 32-bit (v86 فعلاً 64-bit ندارد)
              ├─ terminal سریال سفارشی: پارسر ANSI + تاریخچه + چیپ‌ها
              ├─ login خودکار root → Kernel 6.12.114-0-virt
              └─ network_relay_url:'fetch' فقط با انتخاب کاربر [opt-in]
برچسب صادقانه: «emulated x86 32-bit» — کرنل واقعی است، سخت‌افزار شبیه‌سازی است.
save_state/restore_state در Worker: [planned].
```

## ۹. نسخهٔ لینوکس واقعی (linux-edition/)

```
install.sh ──clone──▶ ~/.sanjabos یا /opt/sanjabos (user sanjabos)
   └─ bun install/build → .next/standalone
   └─ systemd unit (User=sanjabos، hardening، listen loopback)
   └─ فرمان sanjabos (start/stop/logs/open/kiosk/update)
packaging/debian (control/postinst/prerm) · arch/PKGBUILD · Dockerfile+compose
   └─ Docker: پورت فقط روی 127.0.0.1:4310 مپ می‌شود (LAN exposure صریح)
```

جزئیات امنیتی: `docs/RELEASES.md` و `linux-edition/README.md`. ISO بوت‌تست‌شده هنوز عرضه نشده است.

## ۱۰. Sanjab CLI

- CLI یک **محصول جداگانه** است که نسخه‌اش با WebOS هم‌تراز می‌شود (هر دو `2.0.0` طبق فایل `VERSION`).
- در snapshot فعلی ریپو پوشهٔ `cli/` وجود ندارد (استریم کد CLI جداگانه است)؛ release workflow شرطی است: اگر `cli/` موجود باشد tarball می‌شود، وگرنه فقط وب منتشر می‌شود.

## ۱۱. جریان دادهٔ یک درخواست tutor (نمونهٔ end-to-end)

```
کاربر در ترمینال سؤال می‌پرسد
  → POST /api/tutor {question: "ls چیست؟"}
  → [planned: rate limit per-IP] → cap 500 char
  → ZAI.create() → zai.chat.completions.create({messages:[system, user]})
  → {answer} → نمایش در ترمینال
```
