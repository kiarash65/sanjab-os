# 🐧 سان‌جاب‌او‌اس — SanjabOS

> یک سیستم‌عامل وبِ بامزه و رنگی در مرورگر — با آکادمی لینوکس، ترمینال آموزشی، دستیار هوش مصنوعی «هوش‌یار»، محیط پایتون/سنجابی/JS/HTML، نرم‌افزار آفیس، نقاشی، یادداشت، بازی‌ها و خیلی بیشتر!
>
> A cute, colorful **Persian (RTL) WebOS** desktop environment that runs entirely in the browser — with a Linux Academy, teaching terminal, AI assistant "Hosh-yar", Python/Squirrel/JS/HTML playground, Office suite, Paint, Notes, Games and much more.

<div align="center">

**با اسپانسری سان‌جاب** · Sponsored by [Sanjab](https://sunjob.ir) 🐿️

![Made with Next.js](https://img.shields.io/badge/Made%20with-Next.js%2016-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Persian RTL](https://img.shields.io/badge/RTL-فارسی-success)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow)

</div>

---

## ✨ امکانات (Features)

### 🖥️ محیط رومیزی (Desktop Environment)
- پنجره‌های قابل کشیدن، تغییر اندازه، کوچک‌سازی و حداکثرسازی
- نوار وظیفه، منوی استارت، آیکن‌های رومیزی
- **چرخش خودکار کاغذدیواری هر ۳۰ ثانیه** + ۲۹ کاغذدیواری متنوع
- نقشه نئونی ایران در صفحهٔ بوت 🇮🇷
- حالت تاریک/روشن، رنگ‌های قابل تنظیم

### 🎓 آموزش لینوکس (Linux Education)
- **آکادمی لینوکس** — ۸ فصل با انیمیشن، تمرین تعاملی، توزیع‌ها و نصب
- **ترمینال آموزشی** — با تشخیص غلط املایی («did you mean»)، تکمیل با Tab، دستورات واقعی لینوکس
- فایل‌سیستم شبیه‌سازی‌شده، `grep`، `chmod`، `ps`، `man`، `apt` شبیه‌سازی‌شده

### 🤖 هوش مصنوعی (AI)
- **هوش‌یار** — دستیار هوش مصنوعی قابل اتصال به:
  - OpenAI · OpenRouter · Groq · DeepSeek · Claude · **GLM (چی‌پو)**
- **مولد ایده** متصل به هوش‌یار برای تحلیل ایده‌ها
- 🔒 کلید API فقط در مرورگر شما ذخیره می‌شود

> ⚠️ **نکته:** این قابلیت هوش مصنوعی در نسخهٔ نصبی روی سیستم فعال نیست و باید در «هوش‌یار» API key بزنید.

### 💻 کدنویسی (Code Playground)
- **کداستودیو** با ۴ زبان:
  - 🐍 **پایتون** (mini-python کاملاً آفلاین در مرورگر)
  - 🐿️ **سنجابی** — زبان برنامه‌نویسی فارسی!
  - 🟨 **جااسکریپت** (در Web Worker امن)
  - 🌐 **HTML** با پیش‌نمایش زنده
- راهنمای سریع توابع، مثال‌های فراوان، ذخیره/بارگذاری

### 📱 آفیس و کاربردی (Office & Utilities)
- **نویسا** — ویرایشگر متن با خروجی Word (.docx) و PDF
- **صفحه‌گسترده** — اکسل با فرمول و خروجی .xlsx
- **اسلایدساز** — پاورپوینت با خروجی PDF
- **نقاشی** — Paint کامل با رنگ‌ها و قلم‌مو
- **یادداشت** — دفترچه با قلم و فشار (Pressure-sensitive)
- **ماشین‌حساب علمی**، مبدل یکاها، تقویم جلالی، رمزساز

### 📷 هوش تصویری (Vision)
- **تشخیص چهره** — تشخیص جنسیت و سن با دوربین (face-api.js)
- حریم خصوصی ۱۰۰٪ — هیچ تصویری ارسال نمی‌شود

### 🎮 بازی‌ها (Games)
۱۰ بازی کامل: مار، ۲۰۴۸، دوز، حافظه، مین‌یاب، پینگ‌پنگ، پنگوئن پرنده، موش‌کوبی، آجرشکن، حدس‌لغت فارسی

### 🎁 ۱۰ قابلیت بامزه (10 Cute Features)
گربهٔ سیستمی، مترجم گربه‌ای، چرخ شانس، موسیقی چیپ‌تیون، مانیتور سیستم، فلش‌کارت لایتنر، و...

---

## 🚀 اجرا (Getting Started)

```bash
# نصب وابستگی‌ها
bun install

# اجرای سرور توسعه
bun run dev

# باز کردن مرورگر
# http://localhost:3000
```

### پیش‌نیازها
- Node.js 18+ یا Bun
- مرورگر مدرن (Chrome، Firefox، Edge)

---

## 🛠️ تکنولوژی‌ها (Tech Stack)

| بخش | تکنولوژی |
|------|----------|
| فریمورک | Next.js 16 (App Router) |
| زبان | TypeScript 5 |
| استایل | Tailwind CSS 4 + shadcn/ui |
| مدیریت وضعیت | Zustand |
| آیکون‌ها | Lucide |
| هوش تصویری | face-api.js + TensorFlow.js |
| اجرای پایتون | مفسر سفارشی آفلاین |
| ذخیره‌سازی | localStorage |

---

## 📁 ساختار پروژه (Project Structure)

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # صفحه اصلی (نقطه ورود)
│   └── globals.css        # استایل‌های سراسری
├── components/
│   ├── os/                # اجزای سیستم‌عامل
│   │   ├── apps/          # اپلیکیشن‌ها (۳۰+ اپ)
│   │   ├── games/         # بازی‌ها (۱۰ بازی)
│   │   ├── window.tsx     # قاب پنجره
│   │   ├── taskbar.tsx    # نوار وظیفه
│   │   ├── start-menu.tsx # منوی استارت
│   │   └── boot-screen.tsx# صفحه بوت
│   └── ui/                # کامپوننت‌های shadcn/ui
└── lib/
    └── os/                # منطق هسته
        ├── store.ts       # Zustand store
        ├── apps.tsx       # رجیستری اپ‌ها
        ├── interpreter.ts # مفسر پایتون/سنجابی
        ├── fs.ts          # فایل‌سیستم شبیه‌سازی
        └── wallpapers.ts  # کاغذدیواری‌ها
```

---

## ⚠️ سلب مسئولیت (Disclaimer)

این پروژه یک **شبیه‌سازی آموزشی** است و از هستهٔ واقعی لینوکس استفاده نمی‌کند. همهٔ دستورات ترمینال، فایل‌سیستم و فرآیندها در مرورگر شبیه‌سازی می‌شوند. هدف آن آموزش مفاهیم لینوکس به فارسی است.

This project is an **educational simulation** — it does not use a real Linux kernel. All terminal commands, the filesystem, and processes are simulated in the browser. Its goal is to teach Linux concepts in Persian.

---

## 📜 مجوز (License)

MIT License — آزاد برای استفاده، تغییر و توزیع.

---

## 🐿️ اسپانسر (Sponsor)

<div align="center">

**با اسپانسری سان‌جاب**

[![Sanjab](https://img.shields.io/badge/ Sanjab -sunjob.ir-orange)](https://sunjob.ir)

</div>

ساخته‌شده با ❤️ برای جامعه فارسی‌زبان · Made with ❤️ for the Persian-speaking community
