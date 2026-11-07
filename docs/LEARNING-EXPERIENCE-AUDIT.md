# LEARNING EXPERIENCE AUDIT — سنجاب‌اواس ۴.۰

> PHASE 0 از مأموریت «Learning Experience Transformation».
> این سند وضعیت **واقعی کد** (نه README) را قبل از تحول توصیف می‌کند.
> تاریخ: نسخه ۴.۰ «سنجابک»

## ۱. نقشه واقعی داده‌های پیشرفت (قبل از تحول)

| مسیر | کلید ذخیره‌سازی | ساختار | نقطه ضعف |
|---|---|---|---|
| پایتون | `sunjob-py-v1` | `{done[], ex[], quizBest: Record, projects[]}` | `done` لحظهٔ باز کردن درس ثبت می‌شود، نه خواندن |
| لینوکس | `sunjob-academy-v1` | `{done[], missions[], quizBest: number, certName}` | `quizBest` عدد واحد (آزمون جامع) |
| راست | `sunjob-rust-v1` | `{done[], quizBest: number, missionsDone[]}` | مثل بالا |
| هوش مصنوعی | `sunjob-ai-v1` | `{done[], quizBest: number}` | فقط یک آزمون نهایی |
| پاورشل | `sunjob-ps-v1` | `{done[], missionsDone[], quizBest: number}` | مثل بالا |
| فلش‌کارت | `sunjob-flashcards-v1` | `{boxes: Record<cardId,1..5>, personal[], reviewed, correct}` | Leitner بدون تاریخ — زمان‌بندی واقعی ندارد |
| ترمینال (توتور) | `pengo-tutor-v1` | XP موازی خودش | سیستم XP دوم — غیرمجتمع |
| گیمیفیکیشن | `sanjab-game-v1` | `{xp, events[], lessons: Record<Track, number>, ...}` | فقط **شمارنده** — lesson id نگه نمی‌دارد |
| تنظیمات | `sunjob-os-v1` (v2) | `settings` | — |
| فایل‌سیستم | `pengo-fs-v2` | درخت مجازی | — |

**نتیجه:** هیچ منبع یگانهٔ حقیقت برای «پیشرفت درسی» وجود نداشت؛ ۵ آکادمی × کد دست‌سازِ جدا + موتور XP با شمارنده + یک سیستم XP موازی در ترمینال.

## ۲. مرکز پیشرفت (قبل)

`progress-center.tsx` (۱۸۵ خط) فقط از `useGame` می‌خواند: XP، سطح، استریک، دستاوردها، شمارندهٔ فعالیت هر مسیر. **هیچ ارتباطی با سرفصل آکادمی‌ها نداشت** — نمی‌توانست بگوید «درس ۴ از ۲۶ پایتون» یا درصد تسلط.

## ۳. Age Machine

`age-machine.tsx` (۶۱۸ خط): دوربین + face-api.js (CDN) برای شبیه‌سازی پیر/جوان شدن چهره. **ابزار آموزشی نیست** — طبق مأموریت بازنشسته شد (حذف از رجیستری + حذف فایل). `face-detect.tsx` و `body-metrics.tsx` مستقل ماندند (لودر CDN مشترک فقط از طریق `window.faceapi`).

## ۴. ماسکوت

`tux-pet.tsx`: پنگوئن راه‌روندهٔ SVG با ۸ نکتهٔ ترمینالی، مونت‌شده در `os-root.tsx:279`، تابع `funMode`. بدون ذخیره‌سازی، بدون اتصال به یادگیری. «سنجابک» فقط در متن‌ها و یک لوگو بود؛ هویت تصویری نداشت.

## ۵. زیرساخت قابل استفاده مجدد (نیمه‌پر)

- `LearningReader` (reader.tsx): فهرست، Scroll-Spy، بازگشت به نقطه، حالت فوکوس، ردیابی زمان مطالعه (`sunjob-reading-v1`) — آماده برای همهٔ آکادمی‌ها
- `PyodideRunner`: CPython 3.12 واقعی در Worker با timeout
- `aiComplete()` + BYOK + ۶ preset (هوش‌یار) — کلاینت مرورگر مستقیم
- `settings-io.ts`: Export/Import تنظیمات و دادهٔ یادگیری با پیشوند `sunjob-`
- موتور XP idempotent با رویدادهای event-id

## ۶. مشکلات اولویت‌بندی‌شده

| # | مشکل | شدت |
|---|---|---|
| P1 | پراکندگی پیشرفت — ۵ کلید ناسازگار + XP موازی ترمینال | بحرانی |
| P2 | Progress Center بدون تحلیل واقعی (فقط XP) | بحرانی |
| P3 | هیچ مدل مهارت/تسلطی وجود ندارد (کامل‌شدن ≠ بلد بودن) | بحرانی |
| P4 | هیچ مرور فاصله‌دار واقعی (فلش‌کارت فقط Leitner درون‌جلسه‌ای) | بالا |
| P5 | Assessment ضعیف: فقط MCQ داخلی آکادمی‌ها، بدون hint/بازخورد چندلایه/دشواری | بالا |
| P6 | Age Machine غیرآموزشی اشغال جای کاربردی‌ها | متوسط |
| P7 | ماسکوت بدون هویت (Tux) و بدون اتصال به پیشرفت | متوسط |
| P8 | مستندات v2.0.0 و ادعاهای `[planned]` برای چیزهای ساخته‌شده | متوسط |
| P9 | `pengo-*` های یادگیری در Export/Backup نمی‌آیند | کم |

## ۷. معماری پیشنهادی (اجرا‌شده در همین ریلیز)

```
src/lib/learning/           ← لایهٔ دامنهٔ یادگیری (منبع یگانهٔ حقیقت)
  types.ts                  ← مدل: Profile، Event، Evidence، ReviewItem…
  skills.ts                 ← Skill Registry + گراف پیش‌نیاز (۳۱ مهارت)
  store.ts                  ← useLearning (zustand persist: sanjab-learning-v1) + Adapterها + Migration
  mastery.ts                ← موتور تسلط (شواهد وزن‌دار + تازگی)
  review.ts                 ← زمان‌بند نردبانی (SM-2 گونه، مستند و صادق)
  assessment.ts             ← موتور آزمون: ۸ نوع سؤال، تصحیح، بازخورد چندلایه، hint
  banks.ts                  ← بانک سؤال (۳۶ سؤال reviewed: پایتون/لینوکس/الگوریتم/راست/AI/پاورشل)
  algos.ts                  ← Trace واقعی ۷ الگوریتم + Complexity Model
  lessons.ts                ← رجیستری درس‌ها (عنوان رسمی همهٔ مسیرها)
  plan.ts                   ← برنامهٔ روزانه + گزارش هفتگی + خلاصهٔ مسیرها

src/lib/academy/
  algorithm-curriculum.ts   ← ۶ سطح × ۳۵ درس
  projects.ts               ← ۷ پروژهٔ هدایت‌شده با تست خودکار

src/components/os/
  apps/learning-hub.tsx     ← مرکز یادگیری (۷ تب) — جایگزین progress-center
  apps/algorithm-academy.tsx← آکادمی الگوریتم + Visualizer + Playground + Challenges
  apps/project-lab.tsx      ← کارگاه پروژه (Pyodide + تست + Checkpoint + Export)
  apps/coach.tsx            ← مربی سنجاب (۷ حالت + حریم خصوصی + سقف مصرف)
  apps/sanjabak-studio.tsx  ← استودیو سنجابک
  academy/question-card.tsx ← کارت سؤال مشترک
  sanjabak/Sanjabak.tsx     ← ماسکوت لایه‌ای SVG + همدم میزکار
src/lib/os/mascot-store.ts  ← پروفایل سنجابک + سیستم Unlock واقعی
```

**مهاجرت:** `ensureMigrated()` در اولین رندر هاب، دادهٔ ۵ کلید قدیمی را (بدون حذف‌شان) به پروفایل جدید seed می‌کند — idempotent با مهر `migratedAt`.

## ۸. Workflow کاربر هدف

بوت → سنجابک سلام می‌دهد → مرکز یادگیری: «ادامهٔ یادگیری» یک‌کلیکی → درس در Learning Reader → تمرین/آزمون → شواهد → تسلط → مرور فاصله‌دار سررسید می‌شود → برنامهٔ امروز مرتب می‌کند → پروژه → پورتفولیو → آیتم‌های سنجابک باز می‌شوند.
