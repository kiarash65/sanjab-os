# 🐿️ سان‌جاب‌او‌اس — SanjabOS 4.0

> یک سیستم‌عامل وبِ آموزشیِ فارسی در مرورگر — با آکادمی‌های واقعی (پایتون، Rust، لینوکس، پاورشل، هوش مصنوعی)، پایتونِ واقعی CPython در مرورگر، لینوکسِ واقعی (هستهٔ Alpine) در v86، نوشت‌یار فارسی، دستیار هوش مصنوعی «هوش‌یار»، آفیس، بازی‌ها و گیمیفیکیشن.
>
> A Persian (RTL) educational WebOS: real CPython in the browser, a real Linux kernel (v86 + Alpine), full Rust/PowerShell/AI academies, Persian writing assistant, gamification — and 50+ desktop apps & games.

<div align="center">

**با اسپانسری سان‌جاب** · Sponsored by [Sanjab](https://sunjob.ir)

![Version](https://img.shields.io/badge/Version-4.0.0-orange)
![Made with Next.js](https://img.shields.io/badge/Made%20with-Next.js%2016-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript%205-strict-blue?logo=typescript)
![Persian RTL](https://img.shields.io/badge/RTL-فارسی-success)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow)

</div>

---

## 🎓 آکادمی‌ها (Academies) — جدول صادقانهٔ قابلیت‌ها

| آکادمی | محتوا | موتور تمرین | صادقانه |
|---|---|---|---|
| **پایتون** | ۲۵ درس + ۴ پروژه، سطح ۰ تا ۸ (متغیر تا asyncio و تست) | **CPython 3.12 واقعی** (Pyodide WASM) — تصحیح خودکار با assert واقعی | بارگیری اول ~۱۰MB از CDN (اینترنت)؛ سقف اجرا ۱۵ ثانیه؛ فایل روی MEMFS مجازی |
| **پایتون مینی** | بخشی از کداستودیو | مفسر دست‌ساز آموزشی (آفلاین) | **زیرمجموعهٔ آموزشی است — CPython کامل نیست** |
| **Rust** | ۲۲ درس، ۴ مسیر + مأموریت‌های خطای کامپایلر (E0382، E0502 و…) | شبیه‌ساز زیرمجموعه + **آزمایشگاه حافظه** (Move/Borrow/Clone/Drop با انیمیشن) | شبیه‌ساز جاگزین چک‌گر کامپایلر نیست؛ rustc واقعی فقط در نسخهٔ دسکتاپ |
| **لینوکس** | ۱۴ فصل (۸ پایه + ۶ عمیق با ۱۰ انیمیشن)، آزمون ۱۹ سؤالی، گواهی | ترمینال شبیه‌ساز آموزشی + **هستهٔ لینوکس واقعی** (v86 + Alpine 3.21، کرنل 6.12.114) | شبیه‌ساز برای تمرین امن؛ v86 واقعاً کرنل بوت می‌کند (i686 نه x86_64) |
| **پاورشل** | ۱۲ درس، ۴ مرحله + زمین بازی object-pipeline + آزمون | شبیه‌ساز آموزشیِ cmdlet ها روی مدل شیء فیک | پاورشل واقعی فقط از پل دسکتاپ (برنامه‌ریزی‌شده) |
| **هوش مصنوعی** | ۱۳ بخش: پرسپترون، گرادیان، فعال‌سازها، شبکه ۳-۴-۲، بایگرام LLM، بیش‌برازش، **توکن‌ساز BPE، خودتوجهی (Attention)، RAG**، اخلاق + آزمایشگاه آموزش واقعی | محاسبات واقعی در مرورگر (autodiff، softmax، cosine retrieval) | پیاده‌سازی آموزشی — جایگزین مدل‌های تولیدی نیست |
| **نوشت‌یار** | اصلاح چیدمان fa↔en، یکسان‌سازی ی/ک و ارقام، نیم‌فاصله (ZWNJ)، نشانه‌گذاری، غلط‌های رایج، تحلیل خوانایی | موتور کاملاً محلی و آفلاین | پردازش ۱۰۰٪ روی دستگاه؛ هیچ متنی ارسال نمی‌شود |
| **ترمینال آموزشی** | ۲۸ مأموریت در ۵ فصل، ۷۰+ دستور، did-you-mean، Tab-completion، دستیار AI | شبیه‌ساز امنِ فارسی | برای یادگیری است — شل میزبان نیست |

### گیمیفیکیشن
XP، سطح، استریک روزانه، مأموریت روزانه، ۱۵ دستاورد — همهٔ آکادمی‌ها و بازی‌ها به یک موتور مرکزی وصل‌اند (مرکز پیشرفت).

---

## 🖥️ محیط رومیزی
- پنجره‌های کشیدنی/تغییر اندازه/مینیمایز/ماکزیمایز، نوار وظیفه، منو، لانچر
- **چرخش خودکار کاغذدیواری هر ۳۰ ثانیه** + ۲۹ کاغذدیواری
- صفحهٔ بوت با نقشهٔ نئونی ایران
- ۴۰+ اپ: نویسا (docx/pdf)، صفحه‌گسترده، اسلاید، PDF-ادیتور، نقاشی، یادداشت، کانبان، پومودورو، تقویم، اکسل‌مانند، مارک‌داون، regex-lab، تشخیص چهره (face-api)، دوربین قد/وزن، دوربین سن، رنگ‌آمیزی، تبدیل واحدها، مرورگر داخلی، هوش‌یار، مولد ایده و…
- ۱۰ بازی + تابلوی امتیاز

## 🤖 هوش‌یار (دستیار AI)
- اتصال به OpenAI · OpenRouter · Groq · DeepSeek · Claude · **GLM (چی‌پو)**
- کلید API فقط در مرورگر شما (localStorage) — هیچ سرور واسطی کلید را ذخیره نمی‌کند
- کاربردها: مولد ایده، دستیار ترمینال، تحلیل ایده

> ⚠️ در نسخهٔ نصبی/دسکتاپ، دستیارِ ساخته‌شده با کلید خودتان کار می‌کند؛ نقطهٔ انتهایی پیش‌فرضِ میزبان فقط روی نسخهٔ وب فعال است.

## ⚙️ مدیریت اجراکننده‌ها (Runtime Manager)
اپ «مدیر اجراکننده‌ها» فهرست صادقانهٔ موتورها را نشان می‌دهد — نسخه، وضعیت، حجم، محدودیت‌ها — با دکمهٔ آزمایش سریع پایتون واقعی (WebGPU هم تشخیص داده می‌شود).

## 📥 دانلود و به‌روزرسانی
اپ «دانلود» مستقیماً از GitHub Releases می‌خواند: آخرین نسخه، یادداشت‌ها، فایل‌های نصب، حجم، checksum و راهنمای نصب — بدون نسخهٔ هاردکد.

---

## 🪟 نسخهٔ دسکتاپ ویندوز (Tauri v2)

معماری (POC مستند در `src-tauri/`):

```
┌─ Tauri (Rust) ──────────────────────────────┐
│  Webview ←→ http://127.0.0.1:<port آزاد>    │
│      ▲                                       │
│      │ spawn + env(PORT, HOSTNAME=127.0.0.1) │
│  Node.exe sidecar → server-dist/server.js    │
│  (خروجی standalone بعدی + .next/static)      │
└──────────────────────────────────────────────┘
```

- سرور فقط روی loopback با پورت آزادِ تصادفی بالا می‌آید؛ در خروجی اپ، پردازهٔ Node حتماً کشته می‌شود
- نصب‌کننده: **NSIS (per-user)** و **MSI** — WebView2 با downloadBootstrapper
- ساخت با GitHub Actions: تگ `v*` → `release.yml` (وب + SBOM + checksum + نصب‌کنندهٔ ویندوز)

ساخت محلی:
```bash
bun run build
# خروجی standalone را در src-tauri/server-dist بریزید (release.yml این را خودکار انجام می‌دهد)
bunx @tauri-apps/cli icon ./public/squirrel-avatar.png -o src-tauri/icons
cd src-tauri && cargo tauri build
```

## 🚀 اجرا از سورس (نسخهٔ وب)

```bash
bun install
bun run dev        # http://localhost:3000
bun run build      # production standalone
bun run lint && bunx tsc --noEmit
```

## 🐍 پایتون واقعی — نکات فنی
- موتور: [Pyodide v0.26.4](https://github.com/pyodide/pyodide) (MPL-2.0) — CPython کامپایل‌شده به WebAssembly، در Web Worker جدا
- بارگیری فقط با اولین اجرا (lazy)؛ خروجی stream؛ تایم‌اوت والد ۱۵s با کشتن ورکر
- پکیج‌های سازگار WASM (numpy و…) خودکار با `loadPackagesFromImports` بارگیری می‌شوند
- همهٔ این‌ها در «مدیر اجراکننده‌ها» هم صادقانه مستند است

## 📁 ساختار پروژه

```
src/
  lib/academy/          ← برنامهٔ درسی پایتون (A/B/C + index)
  lib/persian/          ← موتور نوشت‌یار
  lib/gamification/     ← موتور XP/دستاورد مرکزی
  lib/ai/               ← micrograd (autodiff آموزشی)
  components/os/academy/← rust-memory، ai-labs، deep chapters
  components/os/apps/   ← ۵۰ اپ دسکتاپ (همه lazy)
  components/os/games/  ← ۱۰ بازی
src-tauri/              ← POC دسکتاپ ویندوز (Tauri v2 sidecar)
cli/                    ← CLI آموزشی پایتونی
docs/                   ← معماری، امنیت، پشتیبانی، نقشهٔ راه
linux-edition/          ← مستندات نسخهٔ لینوکس
```

## 📄 لایسنس و منابع ثالث
MIT — فهرست کامل و لایسنس‌های ثالث: [`THIRD_PARTY_LICENSES.md`](THIRD_PARTY_LICENSES.md)
منابع آموزشی به‌عنوان «الهامِ ساختاری» استفاده شده‌اند (فقط ایده، نه کپی محتوا): rustlings، comprehensive-rust، ML-For-Beginners، generative-ai-for-beginners، learnyoubash، NeveshtYar، DadmaTools.

## ⚠️ محدودیت‌های شناخته‌شده (صادقانه)
- مفسرهای «مینی» (پایتون/Rust آموزشی) **جایگزین زبان واقعی نیستند** و همین‌طور برچسب خورده‌اند
- v86 در مرورگر i686 است (نه x86_64) و شبکه به relay وابسته است
- face-api وزن‌ها از ref `master` بار می‌گیرد (AUDIT-009)
- هوش مصنوعی محلی (WebLLM/llama.cpp) «برنامه‌ریزی‌شده» است — هنوز یکپارچه نشده
- نصب‌کنندهٔ ویندوز POC است: تا اولین تگ `v4.x` که pipeline سبز شود، artifact تضمین نمی‌شود

## 🤝 مشارکت
Issue/PR خوش‌آمدید — لطفاً قبل از PR: `bunx tsc --noEmit && bun run lint` سبز باشد.

---

<div align="center">
<b>با اسپانسری سان‌جاب</b> — [sunjob.ir](https://sunjob.ir) 🐿️
</div>
