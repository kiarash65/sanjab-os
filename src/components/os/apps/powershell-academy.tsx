'use client'

/* ================================================================
   آکادمی پاورشل — سان‌جاب‌او‌اس
   دورهٔ ساختاریافتهٔ پاورشل برای کاربران ویندوز:
   ۴ مرحله / ۱۲ درس + زمین بازی (شبیه‌ساز آموزشی صادق) + آزمون + گواهی
   ================================================================
   نکتهٔ صداقت: ترمینال این آکادمی یک شبیه‌ساز آموزشی است و به‌هیچ‌وجه
   پاورشل واقعی نیست — این موضوع در همه‌جای رابط کاربری اعلام می‌شود.
   ================================================================ */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  AlertTriangle,
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Copy,
  FileCode,
  FlaskConical,
  GraduationCap,
  KeyRound,
  Lightbulb,
  ListChecks,
  Package,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  SquareTerminal,
  Target,
  Trophy,
  Wrench,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { BRAND, SUNJOB_PALETTE } from '@/lib/os/brand'
import { useOS } from '@/lib/os/store'
import { useGame, type Track } from '@/lib/gamification/engine'
import { ReadProgress, lastView, rememberView } from '@/components/os/academy/reader'

/* ------------------------------------------------------------------ */
/* موتور گیمیفیکیشن مرکزی فقط چهار ترک شناخته‌شده دارد؛ ترک «powershell» */
/* عمداً جدا ثبت می‌شود: شناسهٔ رویدادها یکتا می‌ماند (lesson:powershell:*) */
/* و به آمار ترک‌های دیگر دست نمی‌زند — کست امن در سطح runtime.          */
/* ------------------------------------------------------------------ */
const PS_TRACK: Track = 'powershell'

/* ================================================================
   پیشرفت و ذخیره‌سازی
   ================================================================ */

interface PsProgress {
  done: string[]
  missionsDone: string[]
  quizBest: number
}

const PROGRESS_KEY = 'sunjob-ps-v1'
const EMPTY_PROGRESS: PsProgress = { done: [], missionsDone: [], quizBest: 0 }

function loadProgress(): PsProgress {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY)
    if (!raw) return EMPTY_PROGRESS
    return { ...EMPTY_PROGRESS, ...(JSON.parse(raw) as Partial<PsProgress>) }
  } catch {
    return EMPTY_PROGRESS
  }
}

function saveProgress(p: PsProgress) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(p))
  } catch {
    /* ignore */
  }
}

const fa = (n: number) => n.toLocaleString('fa-IR')

/* ================================================================
   دورهٔ درسی — ۴ مرحله، ۱۲ درس
   ================================================================ */

interface CodeSample {
  title: string
  lang: 'powershell'
  code: string
}

interface Lesson {
  id: string
  stage: number
  title: string
  minutes: number
  /** چرا مهم است + تشبیه فارسی */
  intro: string
  body: string[]
  code: CodeSample[]
  mistakes: string[]
  exercise: { prompt: string; sampleSolution: string }
  keyTerms: { en: string; fa: string }[]
}

interface StageDef {
  title: string
  subtitle: string
  icon: typeof BookOpen
  tint: string
}

const STAGES: StageDef[] = [
  { title: 'شروع', subtitle: 'فلسفهٔ اشیاء و کشف دستورها', icon: Sparkles, tint: SUNJOB_PALETTE.orange },
  { title: 'کار با سیستم', subtitle: 'فایل‌ها، پروسه‌ها، سرویس‌ها و شبکه', icon: Wrench, tint: '#10b981' },
  { title: 'اسکریپت‌نویسی', subtitle: 'شرط، حلقه، تابع و مدیریت خطا', icon: FileCode, tint: SUNJOB_PALETTE.violet },
  { title: 'حرفه‌ای', subtitle: 'ماژول، اسکریپت امن، API و winget', icon: Package, tint: '#06b6d4' },
]

const LESSONS: Lesson[] = [
  /* ---------------- درس ۱ ---------------- */
  {
    id: 'ps-1',
    stage: 0,
    title: 'پاورشل چیست؟ اشیاء در برابر متن',
    minutes: 10,
    intro:
      'پاورشل شل رسمی مایکروسافت روی .NET است؛ جایی که به‌جای ردوبدل کردن متن خام، «شیء» جابه‌جا می‌شود. تشبیه: خط لولهٔ bash مثل دفترخانه‌ای است که هر کارمند باید نامه‌های تایپ‌شده را از اول بخواند و ستون‌ها را حدس بزند؛ خط لولهٔ پاورشل مثل نوار نقالهٔ جعبه‌های برچسب‌دار است — هر ایستگاه دقیقاً می‌داند داخل جعبه چیست.',
    body: [
      'سه راه برای حرف‌زدن با کامپیوتر داری: رابط گرافیکی (GUI) با کلیک، رابط خط فرمان (CLI) با تایپ، و «شل» که کامل‌ترین شکل CLI است — یک زبان برنامه‌نویسی واقعی + دسترسی به همهٔ امکانات سیستم. پاورشل همان نقشی را در ویندوز دارد که bash در لینوکس دارد، ولی فلسفه‌اش متفاوت است.',
      'تفاوت اصلی: در bash خروجی هر دستور «متن» است؛ برای گرفتن ستون دوم باید با grep و awk و sed متن را برشی بزنی و اگر سازندهٔ برنامه یک فاصلهٔ اضافه بگذارد اسکریپتت می‌شکند. در پاورشل خروجی هر دستور «شیء» است: ستون‌ها نام دارند (Name ،Id ،CPU)، نوعشان مشخص است و هر شیء متدهای خودش را دارد. فیلتر کردن یعنی Where-Object، نه حدس‌زدن متن.',
      'نام‌گذاری دستورها هم قانونمند است: هر دستور (cmdlet) به شکل «فعل-اسم» است؛ Get-Process یعنی «بگیر: پروسه»، Stop-Service یعنی «متوقف کن: سرویس». همین الگو یادگیری را ده‌ها برابر آسان‌تر می‌کند — یک‌بار الگو را بفهمی، صدها دستور را حدس می‌زنی.',
    ],
    code: [
      {
        title: 'اولین خط لوله',
        lang: 'powershell',
        code: `Get-Process | Select-Object -First 3\n\n# خروجی شیء است؛ ستون‌ها از ویژگی‌های خودِ شیء می‌آیند\n# نه از حدس‌زدن جای فاصله‌ها در یک متن`,
      },
      {
        title: 'مقایسهٔ فلسفه: متن (bash) در برابر شیء (PowerShell)',
        lang: 'powershell',
        code: `# bash: با متن رشته‌ای کار می‌کند؛ تجزیهٔ دستی ستون‌ها\nps aux | grep chrome | awk '{print $2}'\n\n# PowerShell: با اشیاء کار می‌کند؛ ستون‌ها نام دارند\nGet-Process chrome | Select-Object Id, CPU`,
      },
      {
        title: 'هر چیز یک شیء است',
        lang: 'powershell',
        code: `Get-Date | Get-Member      # ویژگی‌ها و متدهای شیء DateTime را فهرست می‌کند\n(Get-Date).Year            # دسترسی مستقیم به یک ویژگی`,
      },
    ],
    mistakes: [
      'پاورشل را «bash مخصوص ویندوز» فرض کردن — فلسفهٔ اشیاء هیچ شباهتی به تجزیهٔ متن ندارد.',
      'انتظار متن خام از خط لوله؛ وقتی Where-Object می‌نویسی داری با ویژگی‌های شیء کار می‌کنی نه با رشته.',
      'دنبال «فایل اجرایی» گشتن برای هر دستور؛ اکثر cmdletها توابع داخلی خود شل هستند.',
    ],
    exercise: {
      prompt: 'یک دستور بنویس که فقط ستون‌های Id و CPU سه پروسهٔ اول را نشان دهد.',
      sampleSolution: `Get-Process | Select-Object -First 3 Id, CPU`,
    },
    keyTerms: [
      { en: 'Cmdlet', fa: 'دستور استاندارد پاورشل با الگوی فعل-اسم' },
      { en: 'Pipeline', fa: 'خط لولهٔ انتقال خروجی یک دستور به دستور بعد' },
      { en: 'Object', fa: 'شیء؛ دادهٔ ساخت‌یافته با ویژگی‌های نام‌دار' },
      { en: 'Property', fa: 'ویژگیِ شیء؛ مثل Id یا CPU یک پروسه' },
    ],
  },
  /* ---------------- درس ۲ ---------------- */
  {
    id: 'ps-2',
    stage: 0,
    title: 'Get-Help و Get-Command — هنوز پیدا کردن',
    minutes: 8,
    intro:
      'هیچ‌کس پاورشل را حفظ نمی‌کند؛ حرفه‌ای‌ها فقط سریع کمک پیدا می‌کنند. تشبیه: پاورشل تنها شلی است که کتاب راهنمای کامل را داخل جعبه گذاشته — Get-Help مثل همکار صبوری است که همیشه آماده توضیح دادن است، حتی بدون اینترنت.',
    body: [
      'دو دستور، نود درصد مسیر یادگیری: Get-Command برای «چه دستوری وجود دارد؟» و Get-Help برای «این دستور چطور کار می‌کند؟». پارامتر -Examples نمونه‌های واقعی می‌دهد، -Full جزئیات کامل و -Online مستندات وب را باز می‌کند.',
      'الگوی جستجو: اگر اسم کامل را نمی‌دانی با ستاره جستجو کن؛ Get-Command *service* هر چیزی را که نامش service دارد می‌آورد، و Get-Command -Verb Get -Noun Process دقیقاً خانوادهٔ موردنظرت را می‌دهد. فعل‌های تأییدشده با Get-Verb فهرست می‌شوند.',
      'راهنمای موضوعی هم داریم: فایل‌های about_* مثل about_Variables مقاله‌های مفهومی داخل خود شل هستند. یک‌بار Update-Help را اجرا کن (اینترنت + دسترسی مدیر می‌خواهد) تا راهنماها کامل و فارسی‌سازی‌شده به زبان سیستم نصب شوند.',
    ],
    code: [
      {
        title: 'راهنمای با مثال',
        lang: 'powershell',
        code: `Get-Help Get-Process -Examples\nGet-Help Get-ChildItem -Parameter Filter   # فقط یک پارامتر خاص`,
      },
      {
        title: 'کشف دستورها',
        lang: 'powershell',
        code: `Get-Command -Noun Process          # همهٔ دستورهای خانوادهٔ Process\nGet-Command *service*              # هر چیزی که اسمش service دارد\nGet-Verb                           # فهرست فعل‌های استاندارد`,
      },
      {
        title: 'به‌روزرسانی و موضوعات مفهومی',
        lang: 'powershell',
        code: `Update-Help                        # یک‌بار اجرا کن؛ نیاز به اینترنت دارد\nGet-Help about_Variables           # مقالهٔ مفهومی داخل خود شل`,
      },
    ],
    mistakes: [
      'به‌جای Get-Help دنبال آموزش در گوگل گشتن؛ اولین منبع باید خود شل باشد.',
      'فراموش کردن Update-Help؛ بدون آن راهنمای پیش‌فرض ناقص است.',
      'گم شدن بین «help» و «Get-Help» — help فقط یک تابع راحت‌تر است که خروجی را صفحه‌بندی می‌کند.',
    ],
    exercise: {
      prompt: 'همهٔ دستورهایی را پیدا کن که نامشان با Item تمام می‌شود (خانوادهٔ کار با آیتم‌ها).',
      sampleSolution: `Get-Command -Noun Item`,
    },
    keyTerms: [
      { en: 'Get-Help', fa: 'راهنمای داخلی هر دستور' },
      { en: '-Examples', fa: 'پارامتر نمایش نمونه‌های واقعی استفاده' },
      { en: 'about_ topics', fa: 'مقاله‌های مفهومی داخل خود پاورشل' },
    ],
  },
  /* ---------------- درس ۳ ---------------- */
  {
    id: 'ps-3',
    stage: 0,
    title: 'متغیرها و انواع داده',
    minutes: 9,
    intro:
      'متغیر یعنی جعبه‌ای با برچسب که داده در آن می‌ماند. تشبیه: در پاورشل هر جعبه خودش می‌گوید چه چیزی داخلش است — GetType را صدا کن، خودش معرفی می‌کند؛ لازم نیست مثل زبان‌های قدیمی قبل از استفاده از دادستان اجازهٔ نوع بگیری.',
    body: [
      'همهٔ متغیرها با $ شروع می‌شوند: $name ،$age ،$ok. نوع‌دهی دینامیک است؛ چیزی که ذخیره می‌کنی نوعش را تعیین می‌کند و هر مقدار یک شیء .NET است — پس روی هر متغیر می‌توانی متد صدا بزنی.',
      'تفاوت نقل‌قول‌ها حیاتی است: در نقل‌قول دویی (") مقدار متغیر جایگزین می‌شود (درون‌ریزی) و برای فرمول‌های پیچیده از $($...) استفاده می‌شود؛ در نقل‌قول تکی (\') متن عیناً همان می‌ماند که نوشتی. عادت حرفه‌ای: پیش‌فرض تکی، فقط وقتی درون‌ریزی می‌خواهی دویی.',
      'انواع پایه: رشته (string)، عدد صحیح و اعشاری، بولی ($true/$false) و $null یعنی «هیچ». آرایه با ویرگول ساخته می‌شود و چون خودش هم شیء است، Count و متدهایش را دارد. برای دیدن همهٔ ویژگی‌های هر مقدار، آن را به Get-Member لوله کن.',
    ],
    code: [
      {
        title: 'ساخت متغیر',
        lang: 'powershell',
        code: `$name = 'Sanjab'          # رشته — تکی، بدون درون‌ریزی\n$age  = 19                # عدد صحیح\n$pi   = 3.14              # اعشاری\n$ok   = $true             # بولی\n$none = $null             # «هیچ»`,
      },
      {
        title: 'نوع و درون‌ریزی',
        lang: 'powershell',
        code: `$age.GetType()            # Int32 — هر متغیر یک شیء .NET است\n"سلام $name، سال بعد $($age + 1) ساله می‌شوی"   # درون‌ریزی با "..."\n'سلام $name'              # عیناً همین متن چاپ می‌شود`,
      },
      {
        title: 'آرایه هم شیء است',
        lang: 'powershell',
        code: `$nums = 1, 2, 3           # آرایه با ویرگول\n$nums.Count               # 3\n$nums | ForEach-Object { $_ * 10 }`,
      },
    ],
    mistakes: [
      'فراموش کردن $ در اول نام متغیر؛ پاورشل بدون آن نام را به‌عنوان رشته یا فرمان می‌گیرد.',
      'درون‌ریزی متغیر داخل نقل‌قول تکی و تعجب از چاپ شدن خود علامت $.',
      'مقایسه با == به سبک C؛ در پاورشل عملگر مقایسه -eq است و = فقط انتساب.',
    ],
    exercise: {
      prompt: 'متغیری بساز که عدد بگیرد و سپس نوع واقعی آن را با متد خودش نشان بده.',
      sampleSolution: `$x = 42\n$x.GetType()`,
    },
    keyTerms: [
      { en: '$var', fa: 'متغیر؛ همه با علامت دلار شروع می‌شوند' },
      { en: 'GetType()', fa: 'متد نمایش نوع واقعی هر شیء' },
      { en: 'Interpolation', fa: 'درون‌ریزی متغیر داخل نقل‌قول دویی' },
      { en: '$null', fa: 'مقدار «هیچ» — نبودنِ داده' },
    ],
  },
  /* ---------------- درس ۴ ---------------- */
  {
    id: 'ps-4',
    stage: 1,
    title: 'پوشه‌ها و فایل‌ها؛ دنیای Providerها',
    minutes: 11,
    intro:
      'کار روزمرهٔ ادمین همین‌جاست: پیمایش، کپی، پاک کردن. تشبیه: پاورشل همه‌چیز را «درایو» می‌بیند — دیسک یک درایو است، رجیستری یک درایو (HKLM:) و حتی متغیرهای محیطی یک درایو (Env:)؛ مثل شهری که همهٔ محله‌هایش با یک نقشه و یک قانون رفت‌وآمد مدیریت می‌شوند.',
    body: [
      'چهار دستور پایه: Get-Location (کجاییم)، Set-Location (برو به)، Get-ChildItem (فهرست کن) و New-Item (بساز). الگوی «فعل-اسم» باعث می‌شود همین دستورها روی هر Provider — فایل‌سیستم، رجیستری، گواهی‌ها، متغیرهای محیطی — یکسان کار کنند.',
      'پارامترهای حرفه‌ای: -Recurse برای پیمایش بازگشتی زیرپوشه‌ها، -Filter برای پیش‌فیلتر سریع در سطح Provider، و -Exclude. برای مسیرهای عجیب که براکت یا کاراکتر خاص دارند از -LiteralPath استفاده کن تا وایلدکارت تفسیر نشود.',
      'قانون طلایی امنیت: قبل از هر عمل مخرب — مخصوصاً Remove-Item — با -WhatIf «حالت تمرینی» اجرا کن تا فقط گزارش ببینی که چه اتفاقی می‌افتاد. با -Confirm هم پاورشل قبل از هر حذف ازت تأیید می‌گیرد. این دو پارامتر روی هر دستوری که ShouldProcess پشتیبانی کند کار می‌کنند.',
    ],
    code: [
      {
        title: 'پیمایش پایه',
        lang: 'powershell',
        code: `Get-Location                              # مثل pwd\nSet-Location C:\\Users\\Sanjab\\Documents    # مثل cd\nGet-ChildItem                             # مثل ls / dir`,
      },
      {
        title: 'Providerها — همه‌چیز درایو است',
        lang: 'powershell',
        code: `Get-ChildItem Env:                        # متغیرهای محیطی مثل یک پوشه\nGet-ChildItem HKLM:\\Software              # رجیستری هم یک درایو است\nGet-PSDrive                               # فهرست همهٔ درایوهای فعلی`,
      },
      {
        title: 'جستجو و حذف امن',
        lang: 'powershell',
        code: `Get-ChildItem -Path $env:USERPROFILE -Filter *.txt -Recurse\n\nCopy-Item report.txt D:\\Backup\\           # کپی\nRemove-Item old.txt -WhatIf               # اول شبیه‌سازی: هیچ‌چیز واقعاً پاک نمی‌شود\nRemove-Item old.txt -Confirm              # قبل از اجرا تأیید بگیر`,
      },
    ],
    mistakes: [
      'اجرای Remove-Item بدون -WhatIf روی مسیرهای مهم؛ اول شبیه‌سازی، بعد واقعی.',
      'استفاده از -Path برای مسیرهای دارای براکت [ ]؛ چون وایلدکارت حساب می‌شود، -LiteralPath لازم است.',
      'فراموش کردن -Recurse و تعجب از اینکه فقط پوشهٔ اول فهرست شد.',
    ],
    exercise: {
      prompt: 'همهٔ فایل‌های .txt زیر پوشهٔ Documents پروفایل کاربری را فهرست کن (زیرپوشه‌ها هم بشود).',
      sampleSolution: `Get-ChildItem $env:USERPROFILE\\Documents -Filter *.txt -Recurse`,
    },
    keyTerms: [
      { en: 'Provider', fa: 'لایه‌ای که هر منبع داده را مثل فایل‌سیستم نشان می‌دهد' },
      { en: '-WhatIf', fa: 'حالت شبیه‌سازی؛ گزارش بدون اجرای واقعی' },
      { en: '-Recurse', fa: 'پیمایش بازگشتی زیرپوشه‌ها' },
    ],
  },
  /* ---------------- درس ۵ ---------------- */
  {
    id: 'ps-5',
    stage: 1,
    title: 'پروسه‌ها و سرویس‌ها',
    minutes: 10,
    intro:
      'Task Manager ویندوز یک جدول ساده است؛ پاورشل همان جدول را به‌صورت اشیاء واقعی به تو می‌دهد تا فیلتر و مرتب و متوقفش کنی. تشبیه: پروسه مثل یک کارگر شیفت فعلی است و سرویس مثل نگهبان ثابت ساختمان — نگهبان را از پشت دوربین (Get-Service) مدیریت می‌کنی، نه با بوق زدن.',
    body: [
      'Get-Process فهرست پروسه‌ها را می‌دهد: Name ،Id ،CPU و WorkingSet. می‌توانی با نام صدا بزنی (Get-Process chrome)، با Id (Get-Process -Id 4012) یا کل جدول را به Sort-Object و Select-Object بدهی تا پر‌مصرف‌ترین‌ها را در یک خط ببینی.',
      'Stop-Process خطرناک‌ترین دستور این درس است: با -Id دقیق بزن، نه حدسی؛ قبلش -WhatIf. اگر برنامه‌ای مهم را ببندی، دستکست یا فریز می‌شود — اینجاست که -Confirm نجات‌دهنده است.',
      'سرویس‌ها برنامه‌های پس‌زمینهٔ ویندوزند: Get-Service فهرستشان می‌دهد و Start-Service ،Stop-Service ،Restart-Service مدیریتشان می‌کنند. اکثر تغییرات سرویس به اجرای پاورشل «به‌عنوان Administrator» نیاز دارد. فیلتر کردن سرویس‌های در حال اجرا با سینتکس سادهٔ Where-Object Status -eq Running یک خط بیشتر نیست.',
    ],
    code: [
      {
        title: 'پروسه‌ها: دیدن و مرتب‌کردن',
        lang: 'powershell',
        code: `Get-Process                                # همه\nGet-Process chrome                         # فقط کروم\nGet-Process | Sort-Object CPU -Descending | Select-Object -First 5`,
      },
      {
        title: 'توقف امن پروسه',
        lang: 'powershell',
        code: `Stop-Process -Name notepad -WhatIf         # اول شبیه‌سازی کن\nStop-Process -Id 4012 -Confirm             # با تأیید؛ آیدی دقیق، نه حدس`,
      },
      {
        title: 'سرویس‌ها',
        lang: 'powershell',
        code: `Get-Service | Where-Object Status -eq Running\nGet-Service wuauserv                       # سرویس Windows Update\nStart-Service -Name spooler -WhatIf        # معمولاً دسترسی مدیر لازم است\nRestart-Service -Name wuauserv`,
      },
    ],
    mistakes: [
      'توقف پروسه با نام مشترک مثل chrome و بستن همهٔ پنجره‌های کاربر؛ اول Id بگیر، بعد -WhatIf بزن.',
      'اجرای Start-Service بدون دسترسی Administrator و تعجب از پیام رد دسترسی.',
      'اشتباه گرفتن Name سرویس با DisplayName؛ Name کد کوتاه است (wuauserv)، DisplayName برچسب بلند (Windows Update).',
    ],
    exercise: {
      prompt: 'با یک خط لوله، پنج پروسهٔ پرمصرف‌ترین CPU را پیدا کن.',
      sampleSolution: `Get-Process | Sort-Object CPU -Descending | Select-Object -First 5`,
    },
    keyTerms: [
      { en: 'Process', fa: 'برنامهٔ در حال اجرا با Id و مصرف منابع' },
      { en: 'Service', fa: 'برنامهٔ پس‌زمینهٔ ویندوز با وضعیت Running/Stopped' },
      { en: 'PID', fa: 'شناسهٔ یکتای پروسه' },
    ],
  },
  /* ---------------- درس ۶ ---------------- */
  {
    id: 'ps-6',
    stage: 1,
    title: 'شبکه و CIM؛ سیستم گزارش می‌دهد',
    minutes: 12,
    intro:
      'CIM بانک اطلاعاتی زندهٔ ویندوز است: هر قطعه سخت‌افزار و تنظیم، یک کلاس آماده گزارش دارد. تشبیه: مثل این است که ویندوز یک منشی همیشه بیدار داشته باشد که هر لحظه آماده باشد مشخصات رسمی هر بخش ساختمان را با فرم استاندارد تحویل بدهد.',
    body: [
      'سه دستور شبکه‌ای پرکاربرد: Get-NetIPAddress برای آدرس‌های IP (با -AddressFamily IPv4 فقط IPv4)، Get-NetAdapter برای کارت‌های شبکه، و Test-Connection برای پینگ مدرن — که برخلاف پینگ کلاسیک خروجی شیء می‌دهد و قابل فیلتر و ثبت است.',
      'Get-CimInstance دروازهٔ CIM است: نام کلاس بده، شیء کامل بگیر. Win32_OperatingSystem مشخصات و آخرین بوت، Win32_BIOS اطلاعات مادربرد، Win32_LogicalDisk دیسک‌ها را می‌دهد. با -Filter می‌توانی سمت منبع فیلتر کنی که در سرورهای راه دور سریع‌تر است.',
      'قدرت واقعی وقتی است که CIM را با خواص محاسباتی ترکیب کنی: با @{n=;e=} می‌توانی ستون بسازی — مثلاً بایت‌های FreeSpace را به گیگابایت تبدیل کنی. و یادت باشد Get-WmiObject نسل قدیمی و منسوخ این خانواده است؛ در کد جدید همیشه CIM بنویس.',
    ],
    code: [
      {
        title: 'آدرس‌های شبکه',
        lang: 'powershell',
        code: `Get-NetIPAddress -AddressFamily IPv4 |\n    Select-Object InterfaceAlias, IPAddress`,
      },
      {
        title: 'پینگ شیءگرا',
        lang: 'powershell',
        code: `Test-Connection sunjob.ir -Count 2         # خروجی شیء است، نه متن ساده`,
      },
      {
        title: 'کلاس‌های CIM',
        lang: 'powershell',
        code: `Get-CimInstance Win32_OperatingSystem |\n    Select-Object Caption, LastBootUpTime\n\nGet-CimInstance Win32_LogicalDisk -Filter "DriveType=3" |\n    Select-Object DeviceID, @{n='FreeGB';e={ $_.FreeSpace / 1GB }}`,
      },
    ],
    mistakes: [
      'استفاده از Get-WmiObject که منسوخ شده؛ جایگزین رسمی Get-CimInstance است.',
      'حدس‌زدن نام ویژگی‌ها به‌جای Get-Member؛ اول ببین شیء واقعاً چه ویژگی‌هایی دارد.',
      'فراموش کردن سیمبل‌های محاسباتی و دستی تقسیم کردن بایت‌ها در ماشین‌حساب.',
    ],
    exercise: {
      prompt: 'نام ویندوز (Caption) و زمان آخرین بوت سیستم را با یک خط بگیر.',
      sampleSolution: `Get-CimInstance Win32_OperatingSystem | Select-Object Caption, LastBootUpTime`,
    },
    keyTerms: [
      { en: 'CIM', fa: 'استاندارد مشترک گزارش وضعیت سیستم' },
      { en: 'Win32_OperatingSystem', fa: 'کلاس مشخصات و وضعیت ویندوز' },
      { en: 'Test-Connection', fa: 'پینگ مدرن با خروجی شیء' },
    ],
  },
  /* ---------------- درس ۷ ---------------- */
  {
    id: 'ps-7',
    stage: 2,
    title: 'شرط‌ها و حلقه‌ها',
    minutes: 12,
    intro:
      'اینجا اسکریپت از «چند دستور پشت هم» به «برنامهٔ واقعی» تبدیل می‌شود. تشبیه: if چراغ راهنمای تقاطع است و حلقه مثل چرخش روزنامه‌رسان بین منازل — تا وقتی شرط برقرار است، همان مسیر تکرار می‌شود.',
    body: [
      'عملگرهای مقایسه در پاورشل کلمه‌ای‌اند: -eq و -ne برای تساوی، -gt و -lt و -ge و -le برای بزرگ‌تر/کوچک‌تر، -like برای وایلدکارت (با *) و -match برای عبارت باقاعده (regex). هیچ علامت > یا < در مقایسه استفاده نمی‌شود چون آن‌ها جهت بازچینی دارند.',
      'if/elseif/else شرط ساده می‌سازد و switch برای مقایسهٔ یک مقدار با چند حالت تمیزتر است. برای تکرار دو خانواده داری: foreach ($x in $list) با متغیر نام‌دار، و خط لوله‌ای $list | ForEach-Object { ... } که در آن $_ یعنی «شیء جاری». هر دو به‌کار می‌آیند؛ خط لوله‌ای برای زنجیره‌های کوتاه شیءگرا زیباتر است.',
      'While و do/while هم برای تکرار با شرط پایانِ نامشخص کاربرد دارند. ترکیب قهرمان این درس: Get-Process | Where-Object { $_.CPU -gt 100 } | ForEach-Object { $_.Name } — فیلتر، بعد استخراج؛ دقیقاً همان الگویی که در زمین بازی تمرین می‌کنی.',
    ],
    code: [
      {
        title: 'شرط‌های سه‌لایه',
        lang: 'powershell',
        code: `$cpu = 82\nif ($cpu -gt 90) { 'بحرانی' }\nelseif ($cpu -gt 60) { 'شلوغ' }\nelse { 'آرام' }`,
      },
      {
        title: 'switch برای حالت‌های متعدد',
        lang: 'powershell',
        code: `$s = 'run'\nswitch ($s) {\n    'stop'  { 'توقف' }\n    'run'   { 'اجرا' }\n    default { 'نامشخص' }\n}`,
      },
      {
        title: 'حلقه‌ها و خط لوله',
        lang: 'powershell',
        code: `foreach ($p in Get-Process) { if ($p.CPU -gt 100) { $p.Name } }\n\nGet-Process | ForEach-Object { $_.Name }   # $_ یعنی شیء جاری\n\n1..10 | Where-Object { $_ % 2 -eq 0 }      # عددهای زوج`,
      },
    ],
    mistakes: [
      'نوشتن = به‌جای -eq در شرط؛ = انتساب است و شرط را همیشه درست نشان می‌دهد.',
      'فراموش کردن $_ در ForEach-Object و استفاده از متغیری که تعریف نشده.',
      'استفاده از > و < برای مقایسه؛ این‌ها در پاورشل جهت بازچینی هستند نه مقایسه.',
    ],
    exercise: {
      prompt: 'با یک خط لوله، عددهای زوج ۱ تا ۱۰ را چاپ کن.',
      sampleSolution: `1..10 | Where-Object { $_ % 2 -eq 0 }`,
    },
    keyTerms: [
      { en: '-eq / -gt / -like', fa: 'عملگرهای مقایسهٔ کلمه‌ای' },
      { en: '$_', fa: 'شیء جاری در خط لوله' },
      { en: 'ForEach-Object', fa: 'حلقهٔ خط لوله‌ای روی هر شیء' },
      { en: 'switch', fa: 'انتخاب تمیز بین چند حالت' },
    ],
  },
  /* ---------------- درس ۸ ---------------- */
  {
    id: 'ps-8',
    stage: 2,
    title: 'توابع؛ بسته‌بندی منطق',
    minutes: 13,
    intro:
      'تابع یعنی یک‌بار فکر کن، هزار بار استفاده کن. تشبیه: تابع مثل دستگاه آبمیوه‌گیری است — ورودی (میوه) را با param تعریف می‌کنی، داخل بدنه فرمول می‌نویسی، و اگر از خط لوله تغذیه‌اش کنی مثل ظرفیت دو لیوانی هر بار یک لیوان آب تحویل می‌دهد.',
    body: [
      'ساختار استاندارد: فعل-اسم برای نام (طبق Get-Verb)، بلاک param() برای ورودی‌ها با نوع و مقدار پیش‌فرض، و خروجیِ تمیز. در پاورشل هر چیزی که در تابع «چاپ» نشود بلکه «خروجی» شود به خط لوله می‌رود؛ بنابراین Write-Host برای داده ممنوع است — فقط برای پیام رنگی به کاربر.',
      'سه بلاک طلایی خط لوله: begin یک‌بار قبل از همه (آماده‌سازی)، process برای هر شیء ورودی ($_) و end یک‌بار در پایان. تابعی که با process بنویسی مثل یک ایستگاه واقعی در خط لوله می‌شود: Get-Process | Get-BigProcess بدون هیچ حلقهٔ اضافه.',
      'خروجی ساخت‌یافته با [pscustomobject]@{ ... } بساز تا مصرف‌کننده بعدی بتواند بر اساس نام ویژگی فیلتر و مرتب کند. راهنمای مصرف‌کننده را هم با راهنمای کامنت‌محور بنویس: <# .SYNOPSIS ... #> بالای تابع تا Get-Help روی خودت هم کار کند.',
    ],
    code: [
      {
        title: 'تابع با param و مقدار پیش‌فرض',
        lang: 'powershell',
        code: `function Get-FreeSpaceGB {\n    param([string]$DriveLetter = 'C:')\n    $disk = Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='$DriveLetter'"\n    [math]::Round($disk.FreeSpace / 1GB, 1)\n}\nGet-FreeSpaceGB -DriveLetter 'C:'`,
      },
      {
        title: 'ورودی خط لوله با process',
        lang: 'powershell',
        code: `function Get-BigProcess {\n    param([int]$MinCpu = 100)\n    process {
        if ($_.CPU -gt $MinCpu) {
            [pscustomobject]@{ Name = $_.Name; CPU = $_.CPU }
        }\n    }\n}\nGet-Process | Get-BigProcess -MinCpu 200`,
      },
      {
        title: 'راهنمای کامنت‌محور',
        lang: 'powershell',
        code: `<#\n.SYNOPSIS\n    خوش‌آمدگویی ساده برای تست خط لوله\n#>\nfunction Show-Welcome { param([string]$Name) "سلام $Name" }`,
      },
    ],
    mistakes: [
      'استفاده از Write-Host برای داده؛ خروجی باید به خط لوله برود نه فقط صفحه.',
      'فراموش کردن param() و خواندن ورودی از $args بدون نوع؛ خطاها بعداً سراغت می‌آیند.',
      'نام‌گذاری تابع خارج از فعل‌های استاندارد Get-Verb و گیج شدن مصرف‌کننده.',
    ],
    exercise: {
      prompt: 'تابعی بنویس که یک عدد بگیرد و یک شیء با دو ویژگیِ عدد و مربع آن برگرداند.',
      sampleSolution: `function Get-Square {\n    param([int]$N)\n    process { [pscustomobject]@{ Number = $N; Square = $N * $N } }\n}\n1..5 | Get-Square`,
    },
    keyTerms: [
      { en: 'param()', fa: 'بلاک تعریف ورودی تابع با نوع' },
      { en: 'process{}', fa: 'بلاک اجرا برای هر شیء ورودی خط لوله' },
      { en: 'PSCustomObject', fa: 'ساخت شیء سفارشی با ویژگی‌های نام‌دار' },
    ],
  },
  /* ---------------- درس ۹ ---------------- */
  {
    id: 'ps-9',
    stage: 2,
    title: 'مدیریت خطاها؛ وقتی کار خراب می‌شود',
    minutes: 11,
    intro:
      'اسکریپت حرفه‌ای با «هرگز خطا نمی‌دهد» سنجیده نمی‌شود، با «خطایش را باوقار گزارش می‌کند». تشبیه: try/catch مثل کیسهٔ هواست — انتظار تصادف نداری، ولی اگر شد نمی‌گذارد به آسفالت (اسکریپت نیمه‌کاره) بخوری.',
    body: [
      'دو نکتهٔ حیاتی: اول اینکه اکثر خطاهای پاورشل «غیرمتوقف‌کننده» (non-terminating) هستند و به‌تنهایی catch را فعال نمی‌کنند؛ باید همان دستور را با -ErrorAction Stop اجرا کنی تا خطا جدی شود. دوم اینکه با $ErrorActionPreference می‌توانی رفتار پیش‌فرض کل نشست را عوض کنی.',
      'ساختار کامل try/catch/finally: در catch شیء $_ حاوی خطاست و $_.Exception.Message متن انسانی‌اش. finally همیشه اجرا می‌شود — مناسب برای بستن اتصال یا پاک‌سازی. نوشتن catch خالی یعنی دفن خطا؛ بدترین عادت ممکن.',
      'تفاوت Write-Error و throw: اولی خطای غیرمتوقف‌کننده صادر می‌کند و اسکریپت می‌تواند ادامه دهد (مناسب «هشدار») و دومی استثنای متوقف‌کننده می‌اندازد (مناسب «وضعیت بی‌معنا»). انتخاب بین این دو یعنی تعیین جدی‌بودن مشکل برای مصرف‌کنندهٔ تابع.',
    ],
    code: [
      {
        title: 'try/catch/finally استاندارد',
        lang: 'powershell',
        code: `try {\n    Get-Content 'C:\\config.json' -ErrorAction Stop\n}\ncatch {\n    "خطا: $($_.Exception.Message)"\n}\nfinally {\n    'این بخش همیشه اجرا می‌شود'\n}`,
      },
      {
        title: 'کنترل رفتار خطا',
        lang: 'powershell',
        code: `Get-Item 'C:\\nope.txt' -ErrorAction SilentlyContinue   # خطا را نادیده بگیر\n$ErrorActionPreference = 'Stop'   # همهٔ خطاها از این‌جا جدی شوند`,
      },
      {
        title: 'Write-Error در برابر throw',
        lang: 'powershell',
        code: `function Test-Quota { param([int]$GB)\n    if ($GB -gt 100) { Write-Error 'سهمیه بیش از حد مجاز است' }   # ادامه ممکن\n    if ($GB -lt 0)   { throw 'عدد منفی بی‌معناست' }                # توقف فوری\n}`,
      },
    ],
    mistakes: [
      'catch خالی که خطا را بی‌صدا می‌بلعد و اشکال‌زدایی را غیرممکن می‌کند.',
      'انتظار فعال شدن catch بدون -ErrorAction Stop روی خطاهای غیرمتوقف‌کننده.',
      'استفاده از throw برای هر چیز جزطی؛ هشدارهایی که ادامهٔ کار را مجاز می‌کنند باید Write-Error باشند.',
    ],
    exercise: {
      prompt: 'خواندن فایلی که شاید وجود نداشته باشد را طوری بپوشان که به‌جای قرمزی کنسول، یک پیام مودبانه چاپ شود.',
      sampleSolution: `try {\n    Get-Content 'C:\\maybe-missing.txt' -ErrorAction Stop\n}\ncatch {\n    "فایل در دسترس نیست: $($_.Exception.Message)"\n}`,
    },
    keyTerms: [
      { en: '-ErrorAction Stop', fa: 'تبدیل خطای غیرمتوقف‌کننده به متوقف‌کننده' },
      { en: 'finally', fa: 'بلاک همیشه‌اجرا برای پاک‌سازی' },
      { en: 'throw', fa: 'انداختن استثنای متوقف‌کننده' },
    ],
  },
  /* ---------------- درس ۱۰ ---------------- */
  {
    id: 'ps-10',
    stage: 3,
    title: 'ماژول‌ها و اسکریپت‌ها؛ سیاست اجرا',
    minutes: 12,
    intro:
      'اینجا از «چند خط در کنسول» به «فایل قابل توزیع» می‌رسی. تشبیه: اسکریپت ps1 مثل غذای آمادهٔ خانه است و ماژول psm1 مثل رستوران زنجیره‌ای — منوی مشخص (Export-ModuleMember)، آشپزخانهٔ پنهان و بسته‌بندی استاندارد برای همه.',
    body: [
      'اجرای اسکریپت محلی همیشه با مسیر نسبی است: .\\script.ps1 نه script.ps1 (دلایل امنیتی). بالای فایل حرفه‌ای، #requires -Version 5.1 می‌گذاری تا روی نسخه‌های قدیمی اصلاً اجرا نشود، و پارامترها را با param() تعریف می‌کنی.',
      'سیاست اجرا (Execution Policy) مهم‌ترین مفهوم امنیتی این درس است: Restricted هیچ اسکریپتی را بند می‌کند (پیش‌فرض کلاینت ویندوز)، RemoteSigned اسکریپت‌های محلی را آزاد و دانلودی از اینترنت را فقط با امضا مجاز می‌کند، Unrestricted همه‌چیز را با هشدار باز می‌گذارد. توصیهٔ استاندارد: Set-ExecutionPolicy -Scope CurrentUser RemoteSigned — یعنی فقط برای خودت، نه کل سیستم.',
      'فایل دانلودی ویندوز نشانِ «از اینترنت آمده» (MOTW) دارد؛ اگر مطمئنی سالم است با Unblock-File آزادش کن. ماژول psm1 هم با Import-Module بار می‌شود و Export-ModuleMember مشخص می‌کند کدام توابع عمومی‌اند و کدام داخلی — همان منوی رستوران.',
    ],
    code: [
      {
        title: 'یک اسکریپت استاندارد',
        lang: 'powershell',
        code: `# script.ps1\n#requires -Version 5.1\nparam([string]$Name)\n"سلام $Name از اسکریپت"\n\n# اجرا (حتماً با .\\ ):\n.\\script.ps1 -Name Sanjab`,
      },
      {
        title: 'سیاست اجرا — درست و امن',
        lang: 'powershell',
        code: `Get-ExecutionPolicy -List                   # وضعیت هر سطح\nSet-ExecutionPolicy -Scope CurrentUser RemoteSigned\nUnblock-File .\\downloaded-tool.ps1          # آزادسازی نشان اینترنت`,
      },
      {
        title: 'کوچک‌ترین ماژول',
        lang: 'powershell',
        code: `# MyTools.psm1\nfunction Get-Greeting { 'سلام از ماژول' }\nfunction Hide-Internal { 'توابع خصوصی' }\nExport-ModuleMember -Function Get-Greeting\n\n# مصرف:\nImport-Module .\\MyTools.psm1\nGet-Command -Module MyTools`,
      },
    ],
    mistakes: [
      'گذاشتن Set-ExecutionPolicy Unrestricted به‌صورت مدیر روی کل سیستم؛ درِ بانک را کامل باز کردن.',
      'اجرای اسکریپت بدون .\\ و تعجب از اینکه ویندوز فایل را پیدا نمی‌کند.',
      'دانلود و اجرای اسکریپت بدون خواندن؛ اول بخوان، بعد Unblock کن.',
    ],
    exercise: {
      prompt: 'امن‌ترین تنظیم رایج برای اجرای اسکریپت‌های محلیِ خودت را بنویس (فقط برای کاربر فعلی).',
      sampleSolution: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`,
    },
    keyTerms: [
      { en: 'ps1 / psm1', fa: 'فایل اسکریپت / فایل ماژول' },
      { en: 'Execution Policy', fa: 'قانون مجاز‌بودن اجرای اسکریپت‌ها' },
      { en: 'RemoteSigned', fa: 'سیاست توصیه‌شده: محلی آزاد، اینترنتی فقط امضاشده' },
      { en: 'Export-ModuleMember', fa: 'تعیین توابع عمومی ماژول' },
    ],
  },
  /* ---------------- درس ۱۱ ---------------- */
  {
    id: 'ps-11',
    stage: 3,
    title: 'کار با API و JSON',
    minutes: 10,
    intro:
      'نیمی از وب امروز با JSON حرف می‌زند و پاورشل مترجم دوزبانه‌ی توست. تشبیه: Invoke-RestMethod مثل همکاری است که سفارش را می‌برد و جواب را همین‌جا باز می‌کند و مرتب روی میزت می‌چیند؛ Invoke-WebRequest فقط بستهٔ خام را می‌آورد و بازکردنش با خودت.',
    body: [
      'Invoke-RestMethod پاسخ JSON یا XML را خودکار به شیء تبدیل می‌کند: یک درخواست به API گیت‌هاب، و بلافاصله $repo.stargazers_count در دسترس است — هیچ ConvertFrom-Json دستی لازم نیست. برای پاسخ خام یا کار با HTML از Invoke-WebRequest استفاده کن.',
      'دستورهای ترکیبی: -Headers برای توکن احراز هویت (هرگز توکن را داخل فایل ننویس؛ از $env: استفاده کن)، -Method Post با -Body برای ارسال داده، و -ContentType برای تعیین فرمت بدنه. اکثر خطاهای API از فراموش کردن ContentType شروع می‌شوند.',
      'خارج از HTTP هم جفت ابزار ConvertTo-Json و ConvertFrom-Json بین دنیای اشیاء و متن JSON رفت‌وآمد می‌کنند. حواست به -Depth باشد: پیش‌فرض فقط ۲ است و داده‌های تودرتو بی‌سروصدا بریده می‌شوند؛ برای داده واقعی معمولاً -Depth 5 یا بیشتر می‌گذارند.',
    ],
    code: [
      {
        title: 'ساده‌ترین فراخوانی API',
        lang: 'powershell',
        code: `$repo = Invoke-RestMethod 'https://api.github.com/repos/PowerShell/PowerShell'\n$repo.stargazers_count        # پاسخ JSON خودبه‌خود شیء شده است`,
      },
      {
        title: 'درخواست احراز هویت‌شده',
        lang: 'powershell',
        code: `$r = Invoke-RestMethod -Uri 'https://api.example.com/items' -Headers @{ Authorization = "Bearer $env:MY_TOKEN" }`,
      },
      {
        title: 'تبدیل JSON دوطرفه',
        lang: 'powershell',
        code: `$obj = '{"name":"Sanjab","year":2025}' | ConvertFrom-Json\n$obj.year                     # 2025\n\n$people | ConvertTo-Json -Depth 5   # پیش‌فرض Depth فقط 2 است!`,
      },
    ],
    mistakes: [
      'استفاده از Invoke-WebRequest و تجزیهٔ دستی .Content؛ وقتی پاسخ JSON است Invoke-RestMethod کار را تمام می‌کند.',
      'فراموش کردن -ContentType در POST و دریافت خطای 400 از سرور.',
      'اعتماد به پیش‌فرض ConvertTo-Json؛ عمق ۲ داده‌های تودرتو را قطع می‌کند.',
      'نوشتن توکن API داخل اسکریپت؛ توکن باید در متغیر محیطی یا مدیریت رمز بماند.',
    ],
    exercise: {
      prompt: 'تعداد ستاره‌های مخزن PowerShell/PowerShell در گیت‌هاب را در یک متغیر نشان بده.',
      sampleSolution: `$repo = Invoke-RestMethod 'https://api.github.com/repos/PowerShell/PowerShell'\n$repo.stargazers_count`,
    },
    keyTerms: [
      { en: 'Invoke-RestMethod', fa: 'فراخوانی API با تبدیل خودکار پاسخ به شیء' },
      { en: 'ConvertFrom-Json', fa: 'تبدیل متن JSON به شیء پاورشل' },
      { en: '-Depth', fa: 'عمق تبدیل آبجکت به JSON (پیش‌فرض ۲)' },
    ],
  },
  /* ---------------- درس ۱۲ ---------------- */
  {
    id: 'ps-12',
    stage: 3,
    title: 'winget و مدیریت نرم‌افزار',
    minutes: 9,
    intro:
      'winget نصب نرم‌افزار در ویندوز را به تجربهٔ «بسته‌بندی لینوکسی» نزدیک می‌کند: یک دستور، مخزن رسمی، بدون گشتن در ده سایت پر از دکمهٔ گول‌زنندهٔ Download. تشبیه: winget مثل سوپرمارکتی است که همهٔ قفسه‌هایش برچسب استاندارد دارند و رسید خرید هم کتباً تحویل می‌دهی.',
    body: [
      'چرخهٔ کامل: winget search برای پیدا کردن، winget show برای دیدن جزئیات و ناشر، winget install برای نصب با شناسهٔ دقیق --id و پرچم -e (--exact) تا دقیقاً همان بسته نصب شود نه شبیهش، و winget uninstall برای حذف.',
      'نگهداری: winget upgrade فهرست «قدیمی‌شده‌ها» را می‌دهد و winget upgrade --all همه را یک‌جا به‌روز می‌کند. نصب خاموش با --silent و پذیرش خودکار قراردادها با --accept-package-agreements --accept-source-agreements باعث می‌شود اسکریپت‌های راه‌اندازی سیستم‌های جدید بدون کلیک اجرا شوند.',
      'امنیت: winget از داخل پاورشل هم اجرا می‌شود (چون یک exe استاندارد است) و با winget source list مخزن‌های فعال را می‌بینی. قانون طلایی: شناسهٔ بسته و ناشرش را بخوان — جستجوی مایکروسافت گاهی ده‌ها نتیجهٔ شبیه‌هم می‌دهد و بستهٔ قلابی اولین نتیجه نیست، ولی بدون -e ممکن است همان نصب شود.',
    ],
    code: [
      {
        title: 'جستجو و نصب دقیق',
        lang: 'powershell',
        code: `winget search vscode\nwinget show Microsoft.VisualStudioCode\nwinget install --id Microsoft.VisualStudioCode -e`,
      },
      {
        title: 'به‌روزرسانی گروهی',
        lang: 'powershell',
        code: `winget upgrade                     # چه چیزهایی قدیمی شده؟\nwinget upgrade --all               # همه را یک‌جا به‌روز کن`,
      },
      {
        title: 'نصب خاموش برای اسکریپت راه‌اندازی',
        lang: 'powershell',
        code: `winget install --id 7zip.7zip -e --silent --accept-package-agreements --accept-source-agreements\nwinget source list                 # مخزن‌های فعال`,
      },
    ],
    mistakes: [
      'نصب بدون --id و -e؛ جستجوی مبهم ممکن است بستهٔ اشتباهی را نصب کند.',
      'اعتماد به نتایج جستجو بدون خواندن نام ناشر در خروجی winget show.',
      'اضافه کردن مخزن (source) ناشناس برای نرم‌افزارهایی که در مخزن رسمی هستند.',
    ],
    exercise: {
      prompt: '7-Zip را با شناسهٔ دقیق پیدا و نصب کن — به‌صورت خاموش برای اسکریپت.',
      sampleSolution: `winget search 7zip\nwinget install --id 7zip.7zip -e --silent --accept-package-agreements --accept-source-agreements`,
    },
    keyTerms: [
      { en: 'winget', fa: 'مدیر بستهٔ رسمی ویندوز' },
      { en: '--id / -e', fa: 'نصب دقیق با شناسهٔ یکتای بسته' },
      { en: 'upgrade --all', fa: 'به‌روزرسانی گروهی همهٔ نرم‌افزارها' },
    ],
  },
]

const LESSON_IDS = LESSONS.map((l) => l.id)

/* ================================================================
   آزمون — ۸ سؤال، قبولی با ۶
   ================================================================ */

interface QuizQ {
  q: string
  options: string[]
  answer: number
  why: string
}

const QUIZ: QuizQ[] = [
  {
    q: 'خروجی که بین فرمان‌ها در خط لولهٔ پاورشل جابه‌جا می‌شود چیست؟',
    options: ['متن خام مثل bash', 'اشیاء .NET با ویژگی‌های نام‌دار', 'فایل‌های موقت روی دیسک', 'کدهای کامپایل‌شده'],
    answer: 1,
    why: 'قلب فلسفهٔ پاورشل همین است: به‌جای تجزیهٔ متن، اشیاء با ویژگی‌های واقعی منتقل می‌شوند؛ ستون‌ها نام دارند و دوباره parse لازم نیست.',
  },
  {
    q: 'می‌خواهی نمونه‌های آمادهٔ استفاده از Get-Process را ببینی. کدام دستور درست است؟',
    options: ['Get-Process /?', 'Get-Help Get-Process -Examples', 'Show-Example Get-Process', 'Get-Process -Help'],
    answer: 1,
    why: 'پارامتر -Examples بخش نمونه‌های Get-Help است؛ گزینه‌های واقعی دیگر -Full و -Online هستند.',
  },
  {
    q: 'کدام گزینه دربارهٔ نقل‌قول‌ها درست است؟',
    options: [
      'هر دو نوع متغیر را درون‌ریزی می‌کنند',
      'فقط نقل‌قول تکی متغیرها را درون‌ریزی می‌کند',
      'فقط نقل‌قول دویی متغیرها را درون‌ریزی می‌کند',
      'پاورشل اصلاً درون‌ریزی ندارد',
    ],
    answer: 2,
    why: 'در "..." مقدار $name جایگزین می‌شود؛ در \'...\' متن عیناً همان می‌ماند که نوشتی.',
  },
  {
    q: 'کدام خط فقط پروسه‌هایی را نگه می‌دارد که CPU بیش از ۱۰۰ دارند؟',
    options: [
      'Get-Process | Filter CPU > 100',
      'Get-Process | Where-Object { $_.CPU -gt 100 }',
      'Get-Process | Select-Object CPU 100',
      'Get-Process -Where CPU -gt 100',
    ],
    answer: 1,
    why: 'Where-Object با بلاک شرط و عملگر -gt استاندارد فیلتر خط لوله است؛ Filter و -Where اصلاً وجود ندارند.',
  },
  {
    q: 'قبل از پاک کردن فایلی می‌خواهی ببینی دقیقاً چه اتفاقی می‌افتد، بدون اجرای واقعی. چه می‌زنی؟',
    options: ['-Confirm:$false', '-WhatIf', '-Force', '-Verbose'],
    answer: 1,
    why: '-WhatIf اجرا را شبیه‌سازی می‌کند و فقط گزارش می‌دهد؛ این همان فلسفهٔ امنیتی ShouldProcess است که در شبیه‌ساز زمین بازی هم تمرین کردی.',
  },
  {
    q: 'try/catch نوشته‌ای ولی catch هرگز اجرا نمی‌شود. محتمل‌ترین دلیل چیست؟',
    options: [
      'خطا غیرمتوقف‌کننده بوده و -ErrorAction Stop نگذاشته‌ای',
      'catch فقط داخل ماژول کار می‌کند',
      'باید catch را قبل از try بنویسی',
      'پاورشل try/catch ندارد',
    ],
    answer: 0,
    why: 'خطاهای غیرمتوقف‌کننده به‌تنهایی catch را فعال نمی‌کنند؛ یا -ErrorAction Stop می‌گذاری یا $ErrorActionPreference را Stop می‌کنی.',
  },
  {
    q: 'اسکریپت محلی .ps1 روی ویندوز تازه‌نصب اجرا نمی‌شود. معمول‌ترین علت؟',
    options: [
      'Execution Policy روی Restricted است',
      'ویندوز پسوند ps1 را نمی‌شناسد',
      'فایل باید bat باشد',
      'پاورشل باید جدا نصب شود',
    ],
    answer: 0,
    why: 'پیش‌فرض ویندوز کلاینت Restricted است؛ راه استاندارد: Set-ExecutionPolicy -Scope CurrentUser RemoteSigned.',
  },
  {
    q: 'تفاوت اصلی Invoke-RestMethod با Invoke-WebRequest چیست؟',
    options: [
      'پاسخ JSON/XML را خودکار به شیء تبدیل می‌کند',
      'فقط سرعتش بیشتر است',
      'مخصوص گیت‌هاب است',
      'هیچ تفاوتی ندارند',
    ],
    answer: 0,
    why: 'Invoke-RestMethod پاسخ ساخت‌یافته را خودکار parse می‌کند؛ Invoke-WebRequest پاسخ خام (HTML و رشته) می‌دهد.',
  },
]

const PASS_SCORE = 6

/* ================================================================
   زمین بازی — مدل دادهٔ شبیه‌ساز (داده‌ها کاملاً جعلی و امن‌اند)
   ================================================================ */

type PsPrimitive = string | number | boolean

interface PsObj {
  type: string
  props: Record<string, PsPrimitive>
}

interface ConsoleLine {
  kind: 'in' | 'out' | 'err' | 'ok' | 'warn'
  text: string
}

const HOME = 'C:\\Users\\Sanjab'

const FAKE_PROCESSES: PsObj[] = [
  ['chrome', 4012, 812.4, 1284],
  ['chrome', 4820, 245.9, 812],
  ['chrome', 5311, 96.2, 640],
  ['Code', 3188, 451.7, 1024],
  ['explorer', 1284, 84.3, 212],
  ['svchost', 908, 38.6, 148],
  ['dwm', 1120, 132.5, 96],
  ['spotify', 6604, 74.8, 384],
  ['notepad', 7240, 2.1, 32],
  ['SearchApp', 5560, 41.9, 180],
  ['MsMpEng', 2216, 156.3, 288],
  ['steam', 680, 201.4, 512],
].map(([n, id, cpu, ws]) => ({ type: 'Process', props: { Name: n, Id: id, CPU: cpu, WorkingSet: ws } }))

const FAKE_SERVICES: PsObj[] = [
  ['wuauserv', 'Windows Update', 'Stopped', 'Manual'],
  ['Spooler', 'Print Spooler', 'Running', 'Automatic'],
  ['Audiosrv', 'Windows Audio', 'Running', 'Automatic'],
  ['bits', 'Background Intelligent Transfer Service', 'Stopped', 'Manual'],
  ['Dhcp', 'DHCP Client', 'Running', 'Automatic'],
  ['Dnscache', 'DNS Client', 'Running', 'Automatic'],
  ['Themes', 'Themes', 'Running', 'Automatic'],
  ['WSearch', 'Windows Search', 'Running', 'Automatic (Delayed)'],
  ['WinDefend', 'Microsoft Defender Antivirus Service', 'Running', 'Automatic'],
  ['W32Time', 'Windows Time', 'Stopped', 'Manual'],
].map(([n, d, s, st]) => ({ type: 'Service', props: { Name: n, DisplayName: d, Status: s, StartType: st } }))

interface FsEntry {
  kind: 'dir' | 'file'
  length: number
  modified: string
}

const FAKE_FS: Record<string, FsEntry> = {
  [HOME]: { kind: 'dir', length: 0, modified: '2025-06-10 09:12' },
  [`${HOME}\\Desktop`]: { kind: 'dir', length: 0, modified: '2025-06-09 18:40' },
  [`${HOME}\\Documents`]: { kind: 'dir', length: 0, modified: '2025-06-10 11:02' },
  [`${HOME}\\Documents\\projects`]: { kind: 'dir', length: 0, modified: '2025-06-10 11:05' },
  [`${HOME}\\Downloads`]: { kind: 'dir', length: 0, modified: '2025-06-08 21:17' },
  [`${HOME}\\readme.txt`]: { kind: 'file', length: 612, modified: '2025-06-10 09:14' },
  [`${HOME}\\Desktop\\todo.txt`]: { kind: 'file', length: 143, modified: '2025-06-09 18:41' },
  [`${HOME}\\Documents\\report.txt`]: { kind: 'file', length: 2860, modified: '2025-06-10 11:03' },
  [`${HOME}\\Documents\\notes.md`]: { kind: 'file', length: 918, modified: '2025-06-10 10:47' },
  [`${HOME}\\Documents\\projects\\backup.ps1`]: { kind: 'file', length: 742, modified: '2025-06-10 11:06' },
  [`${HOME}\\Downloads\\setup.exe`]: { kind: 'file', length: 52428800, modified: '2025-06-08 21:20' },
  [`${HOME}\\Downloads\\song.mp3`]: { kind: 'file', length: 7864320, modified: '2025-06-07 22:05' },
}

function fsLookup(path: string): string | null {
  const lower = path.toLowerCase()
  return Object.keys(FAKE_FS).find((k) => k.toLowerCase() === lower) ?? null
}

function resolveWinPath(cwd: string, rawInput: string): string {
  let p = rawInput.replace(/^["']|["']$/g, '').trim()
  if (!p || p === '~') return HOME
  if (p.startsWith('~')) p = HOME + p.slice(1)
  else if (!/^[a-zA-Z]:/.test(p)) p = `${cwd}\\${p}`
  p = p.replace(/\//g, '\\')
  const stack: string[] = []
  for (const seg of p.split('\\')) {
    if (!seg || seg === '.') continue
    if (seg === '..') {
      if (stack.length > 1) stack.pop()
      continue
    }
    stack.push(seg)
  }
  return stack.join('\\')
}

/* ---------------- فرمان‌های پشتیبانی‌شدهٔ شبیه‌ساز ---------------- */

const SIM_COMMANDS: { name: string; desc: string }[] = [
  { name: 'Get-Process', desc: 'فهرست پروسه‌های جعلی' },
  { name: 'Get-Service', desc: 'فهرست سرویس‌های جعلی' },
  { name: 'Get-ChildItem', desc: 'فهرست فایل‌سیستم جعلی (با -Name)' },
  { name: 'Set-Location', desc: 'تغییر پوشهٔ جاری' },
  { name: 'Get-Location', desc: 'نمایش پوشهٔ جاری' },
  { name: 'Get-Command', desc: 'فهرست همین فرمان‌ها' },
  { name: 'Get-Help', desc: 'راهنمای هر فرمان' },
  { name: 'Get-Date', desc: 'تاریخ و ساعت' },
  { name: 'Get-Member', desc: 'اعضای شیء (نسخهٔ ثابت آموزشی)' },
  { name: 'Where-Object', desc: 'فیلتر اشیاء با شرط' },
  { name: 'ForEach-Object', desc: 'تبدیل هر شیء (فقط $_.Property)' },
  { name: 'Sort-Object', desc: 'مرتب‌سازی (با -Descending)' },
  { name: 'Select-Object', desc: 'برداشتن چند شیء اول/آخر' },
  { name: 'Measure-Object', desc: 'شمارش و محاسبهٔ آماری' },
  { name: 'Write-Output', desc: 'چاپ متن (alias: echo)' },
  { name: 'Clear-Host', desc: 'پاک کردن صفحه (alias: cls)' },
]

const ALIASES: Record<string, string> = {
  echo: 'Write-Output',
  write: 'Write-Output',
  'write-host': 'Write-Output',
  cls: 'Clear-Host',
  clear: 'Clear-Host',
  gci: 'Get-ChildItem',
  ls: 'Get-ChildItem',
  dir: 'Get-ChildItem',
  cd: 'Set-Location',
  sl: 'Set-Location',
  chdir: 'Set-Location',
  pwd: 'Get-Location',
  gl: 'Get-Location',
  ps: 'Get-Process',
  gps: 'Get-Process',
  gsv: 'Get-Service',
  date: 'Get-Date',
  sort: 'Sort-Object',
  select: 'Select-Object',
  where: 'Where-Object',
  '?': 'Where-Object',
  foreach: 'ForEach-Object',
  '%': 'ForEach-Object',
  measure: 'Measure-Object',
  gm: 'Get-Member',
  help: 'Get-Help',
  man: 'Get-Help',
}

const HELP_TEXT: Record<string, string[]> = {
  'get-process': ['خلاصه: پروسه‌های جعلی سیستم را فهرست می‌کند', 'مثال:', '  Get-Process', '  Get-Process | Sort-Object CPU -Descending | Select-Object -First 3'],
  'get-service': ['خلاصه: سرویس‌های جعلی را فهرست می‌کند', 'مثال:', '  Get-Service | Where-Object { $_.Status -eq \'Running\' }'],
  'get-childitem': ['خلاصه: محتوای یک پوشهٔ جعلی را فهرست می‌کند', 'پارامترها: مسیر (اختیاری)، -Name، -Filter *.txt', 'مثال:', '  Get-ChildItem -Name'],
  'set-location': ['خلاصه: پوشهٔ جاری را عوض می‌کند', 'مثال:', '  Set-Location Documents', '  Set-Location ..'],
  'get-location': ['خلاصه: پوشهٔ جاری را نشان می‌دهد', 'مثال:', '  Get-Location'],
  'get-command': ['خلاصه: فرمان‌های پشتیبانی‌شدهٔ شبیه‌ساز را فهرست می‌کند'],
  'get-date': ['خلاصه: تاریخ و ساعت فعلی را نشان می‌دهد'],
  'get-member': ['خلاصه: اعضای (نسخهٔ ثابت) اولین شیء ورودی را نشان می‌دهد', 'مثال:', '  Get-Process | Select-Object -First 1 | Get-Member'],
  'where-object': ['خلاصه: اشیاء را با شرط فیلتر می‌کند', 'فرم پشتیبانی‌شده: { $_.Property -op Value } یا Property -op Value', 'عملگرها: -eq -ne -gt -lt -ge -le -like -match', 'مثال:', '  Get-Process | Where-Object { $_.CPU -gt 100 }'],
  'foreach-object': ['خلاصه: هر شیء را به مقدار یک ویژگی تبدیل می‌کند', 'فرم پشتیبانی‌شده: { $_.Property }', 'مثال:', '  Get-Process | ForEach-Object { $_.Name }'],
  'sort-object': ['خلاصه: اشیاء را بر اساس یک ویژگی مرتب می‌کند', 'پارامتر: -Descending', 'مثال:', '  Get-Process | Sort-Object CPU -Descending'],
  'select-object': ['خلاصه: چند شیء اول یا آخر را برمی‌دارد', 'پارامترها: -First N، -Last N', 'مثال:', '  Get-Process | Select-Object -First 3'],
  'measure-object': ['خلاصه: شمارش و محاسبات آماری روی ویژگی عددی', 'پارامترها: -Property X، -Sum، -Average، -Minimum، -Maximum', 'مثال:', '  Get-Process | Measure-Object -Property CPU -Sum -Average'],
  'write-output': ['خلاصه: متن ورودی را چاپ می‌کند', 'مثال:', '  Write-Output سلام'],
  'clear-host': ['خلاصه: صفحهٔ کنسول را پاک می‌کند'],
  'get-help': ['خلاصه: همین راهنما را نشان می‌دهد', 'مثال:', '  Get-Help Get-Process'],
}

const MEMBER_DEMO: Record<string, { tn: string; rows: [string, string, string][] }> = {
  Process: {
    tn: 'System.Diagnostics.Process (شبیه‌سازی‌شده)',
    rows: [
      ['Name', 'Property', 'string Name {get;}'],
      ['Id', 'Property', 'int Id {get;}'],
      ['CPU', 'Property', 'double CPU {get;}'],
      ['WorkingSet', 'Property', 'long WorkingSet {get;}'],
      ['Kill', 'Method', 'void Kill()'],
      ['Refresh', 'Method', 'void Refresh()'],
    ],
  },
  Service: {
    tn: 'System.ServiceProcess.ServiceController (شبیه‌سازی‌شده)',
    rows: [
      ['Name', 'Property', 'string Name {get;}'],
      ['DisplayName', 'Property', 'string DisplayName {get;}'],
      ['Status', 'Property', 'ServiceControllerStatus Status {get;}'],
      ['Start', 'Method', 'void Start()'],
      ['Stop', 'Method', 'void Stop()'],
    ],
  },
  FileInfo: {
    tn: 'System.IO.FileInfo (شبیه‌سازی‌شده)',
    rows: [
      ['Name', 'Property', 'string Name {get;}'],
      ['Length', 'Property', 'long Length {get;}'],
      ['LastWriteTime', 'Property', 'datetime LastWriteTime {get;}'],
      ['Delete', 'Method', 'void Delete()'],
    ],
  },
  DirInfo: {
    tn: 'System.IO.DirectoryInfo (شبیه‌سازی‌شده)',
    rows: [
      ['Name', 'Property', 'string Name {get;}'],
      ['LastWriteTime', 'Property', 'datetime LastWriteTime {get;}'],
      ['Create', 'Method', 'void Create()'],
    ],
  },
  String: {
    tn: 'System.String (شبیه‌سازی‌شده)',
    rows: [
      ['Length', 'Property', 'int Length {get;}'],
      ['ToUpper', 'Method', 'string ToUpper()'],
      ['Contains', 'Method', 'bool Contains(string value)'],
    ],
  },
  CommandInfo: {
    tn: 'System.Management.Automation.CommandInfo (شبیه‌سازی‌شده)',
    rows: [
      ['Name', 'Property', 'string Name {get;}'],
      ['CommandType', 'Property', 'string CommandType {get;}'],
    ],
  },
}

/* ---------------- موتور خط لولهٔ شبیه‌ساز ---------------- */

function tokenize(s: string): string[] {
  const out: string[] = []
  let cur = ''
  let quote: string | null = null
  let brace = 0
  for (const ch of s) {
    if (quote) {
      cur += ch
      if (ch === quote) quote = null
      continue
    }
    if (ch === '{' || ch === '}') {
      brace = ch === '{' ? brace + 1 : Math.max(0, brace - 1)
      cur += ch
      continue
    }
    if (ch === ' ' && brace === 0) {
      if (cur) {
        out.push(cur)
        cur = ''
      }
      continue
    }
    if (ch === '"' || ch === "'") quote = ch
    cur += ch
  }
  if (cur) out.push(cur)
  return out
}

function unquote(v: string): string {
  return v.replace(/^['"]|['"]$/g, '')
}

function parseValue(v: string): PsPrimitive {
  const s = unquote(v)
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s)
  if (s === 'true') return true
  if (s === 'false') return false
  return s
}

function likeToRegex(pattern: string): RegExp {
  const esc = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.')
  return new RegExp(`^${esc}$`, 'i')
}

function propMatches(pv: PsPrimitive | undefined, op: string, target: PsPrimitive): boolean {
  if (pv === undefined) return false
  const bothNum = typeof pv === 'number' && typeof target === 'number'
  switch (op.toLowerCase()) {
    case '-eq':
      return bothNum ? pv === target : String(pv).toLowerCase() === String(target).toLowerCase()
    case '-ne':
      return bothNum ? pv !== target : String(pv).toLowerCase() !== String(target).toLowerCase()
    case '-gt':
      return bothNum ? (pv as number) > (target as number) : String(pv).toLowerCase() > String(target).toLowerCase()
    case '-lt':
      return bothNum ? (pv as number) < (target as number) : String(pv).toLowerCase() < String(target).toLowerCase()
    case '-ge':
      return bothNum ? (pv as number) >= (target as number) : String(pv).toLowerCase() >= String(target).toLowerCase()
    case '-le':
      return bothNum ? (pv as number) <= (target as number) : String(pv).toLowerCase() <= String(target).toLowerCase()
    case '-like':
      return likeToRegex(unquote(String(target))).test(String(pv))
    case '-match':
    case '-notmatch': {
      try {
        const hit = new RegExp(unquote(String(target)), 'i').test(String(pv))
        return op.toLowerCase() === '-notmatch' ? !hit : hit
      } catch {
        return false
      }
    }
    default:
      return false
  }
}

function formatTable(objs: PsObj[]): string[] {
  const cols: string[] = []
  for (const o of objs) for (const k of Object.keys(o.props)) if (!cols.includes(k)) cols.push(k)
  const cell = (v: PsPrimitive | undefined) => (v === undefined ? '' : String(v))
  const widths = cols.map((c) => Math.max(c.length, ...objs.map((o) => cell(o.props[c]).length)))
  const isNum = cols.map((c) => objs.every((o) => typeof o.props[c] === 'number'))
  const pad = (s: string, w: number, right: boolean) => (right ? s.padStart(w) : s.padEnd(w))
  const head = cols.map((c, i) => pad(c, widths[i], isNum[i])).join('  ')
  const sep = cols.map((_, i) => '-'.repeat(widths[i])).join('  ')
  const rows = objs.map((o) => cols.map((c, i) => pad(cell(o.props[c]), widths[i], isNum[i])).join('  '))
  return [head, sep, ...rows]
}

function objToLines(objs: PsObj[]): ConsoleLine[] {
  if (objs.length === 0) return [{ kind: 'out', text: '(نتیجه‌ای نیست — خط لوله خالی است)' }]
  const t = formatTable(objs)
  if (t.length <= 20) return t.map((text) => ({ kind: 'out' as const, text }))
  return [
    ...t.slice(0, 18).map((text) => ({ kind: 'out' as const, text })),
    { kind: 'out', text: `... ${t.length - 18} سطر دیگر حذف شد (خروجی شبیه‌ساز کوتاه می‌شود)` },
  ]
}

function memberLines(obj: PsObj): string[] {
  const demo = MEMBER_DEMO[obj.type]
  const tn = demo?.tn ?? `${obj.type} (شبیه‌سازی‌شده)`
  const rows = demo?.rows ?? Object.keys(obj.props).map((k) => [k, 'Property', `unknown ${k} {get;}`] as [string, string, string])
  const w = [Math.max(4, ...rows.map((r) => r[0].length)), Math.max(10, ...rows.map((r) => r[1].length)), Math.max(10, ...rows.map((r) => r[2].length))]
  const lines = ['   TypeName: ' + tn, '', [ 'Name', 'MemberType', 'Definition' ].map((h, i) => h.padEnd(w[i])).join('  '), w.map((x) => '-'.repeat(x)).join('  ')]
  for (const r of rows) lines.push(r.map((c, i) => c.padEnd(w[i])).join('  '))
  return lines
}

function measureLines(objs: PsObj[], args: string[]): string[] {
  const propIdx = args.findIndex((a) => a.toLowerCase() === '-property')
  const prop = propIdx !== -1 && args[propIdx + 1] ? unquote(args[propIdx + 1]) : null
  const has = (f: string) => args.some((a) => a.toLowerCase() === f)
  const lines = [`Count         : ${objs.length}`]
  if (prop) {
    const nums = objs.map((o) => o.props[prop]).filter((v): v is number => typeof v === 'number')
    if (nums.length === 0) return [...lines, `Property      : ${prop} (مقدار عددی یافت نشد)`]
    const sum = nums.reduce((a, b) => a + b, 0)
    const fmt = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 2 })
    if (has('-sum')) lines.push(`Sum           : ${fmt(sum)}`)
    if (has('-average')) lines.push(`Average       : ${fmt(sum / nums.length)}`)
    if (has('-minimum') || has('-min')) lines.push(`Minimum       : ${fmt(Math.min(...nums))}`)
    if (has('-maximum') || has('-max')) lines.push(`Maximum       : ${fmt(Math.max(...nums))}`)
    if (lines.length === 1) lines.push(`Property      : ${prop} (برای محاسبه پرچم -Sum یا -Average بزن)`)
  }
  return lines
}

interface StageOut {
  objs?: PsObj[]
  terminal?: string[]
  err?: string
  cwd?: string
  clear?: boolean
}

function execStage(input: PsObj[] | null, raw: string, cwd: string, isFirst: boolean): StageOut {
  const tokens = tokenize(raw)
  if (tokens.length === 0) return { err: 'دستور خالی است' }
  const cmdRaw = tokens[0]
  const cmd = (ALIASES[cmdRaw.toLowerCase()] ?? cmdRaw).toLowerCase()
  const rest = tokens.slice(1)
  const flags: string[] = []
  const pos: string[] = []
  for (const t of rest) {
    if (t.startsWith('-') && t.length > 1) flags.push(t.toLowerCase())
    else pos.push(t)
  }
  const flagValue = (f: string): string | null => {
    const i = rest.findIndex((t) => t.toLowerCase() === f)
    return i !== -1 && rest[i + 1] ? unquote(rest[i + 1]) : null
  }

  const TRANSFORMERS = ['where-object', 'foreach-object', 'sort-object', 'select-object', 'measure-object', 'get-member']
  const PRODUCERS = ['get-process', 'get-service', 'get-childitem', 'get-command', 'get-date', 'write-output', 'get-location', 'get-help', 'clear-host', 'set-location']
  if (TRANSFORMERS.includes(cmd) && input === null)
    return { err: 'اولین مرحلهٔ خط لوله باید داده بسازد — مثال: Get-Process' }
  if (PRODUCERS.includes(cmd) && !isFirst)
    return { err: 'در شبیه‌ساز، فرمان‌های سازنده فقط باید مرحلهٔ اول خط لوله باشند' }

  switch (cmd) {
    case 'clear-host':
      return { clear: true }
    case 'get-location':
      return { terminal: [cwd] }
    case 'get-date':
      return { terminal: [new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'medium' })] }
    case 'write-output':
      return { terminal: [rest.map(unquote).join(' ') || '(رشتهٔ خالی)'] }
    case 'set-location': {
      const targetRaw = flagValue('-path') ?? pos[0] ?? ''
      const target = resolveWinPath(cwd, targetRaw)
      const key = fsLookup(target)
      if (!key || FAKE_FS[key].kind !== 'dir') return { err: `Set-Location : مسیر پیدا نشد: ${targetRaw || '.'}` }
      return { cwd: key, terminal: [] }
    }
    case 'get-childitem': {
      const targetRaw = flagValue('-path') ?? pos[0] ?? cwd
      const target = resolveWinPath(cwd, targetRaw)
      const key = fsLookup(target)
      if (!key) return { err: `Get-ChildItem : مسیر پیدا نشد: ${targetRaw}` }
      const entry = FAKE_FS[key]
      if (entry.kind === 'file')
        return { objs: [{ type: 'FileInfo', props: { Mode: '-a----', LastWriteTime: entry.modified, Length: entry.length, Name: key.split('\\').pop() ?? '' } }] }
      const nameOnly = flags.includes('-name')
      const filter = flagValue('-filter')
      const kids = Object.keys(FAKE_FS)
        .filter((k) => k !== key && k.toLowerCase().startsWith(key.toLowerCase() + '\\') && !k.slice(key.length + 1).includes('\\'))
        .sort((a, b) => (FAKE_FS[a].kind === FAKE_FS[b].kind ? a.localeCompare(b) : FAKE_FS[a].kind === 'dir' ? -1 : 1))
      if (nameOnly) {
        return {
          terminal: kids.map((k) => (FAKE_FS[k].kind === 'dir' ? `${k.split('\\').pop()}\\` : k.split('\\').pop() ?? '')),
        }
      }
      const objs = kids
        .map((k) => {
          const e = FAKE_FS[k]
          const name = k.split('\\').pop() ?? ''
          return {
            type: e.kind === 'dir' ? 'DirInfo' : 'FileInfo',
            props: { Mode: e.kind === 'dir' ? 'd-----' : '-a----', LastWriteTime: e.modified, Length: e.kind === 'dir' ? '' : e.length, Name: name } as Record<string, PsPrimitive>,
          }
        })
        .filter((o) => (filter ? likeToRegex(filter).test(String(o.props.Name)) : true))
      return { objs }
    }
    case 'get-process': {
      const namePat = flagValue('-name') ?? pos[0] ?? '*'
      const re = likeToRegex(namePat.includes('*') || namePat.includes('?') ? namePat : `*${namePat}*`)
      return { objs: FAKE_PROCESSES.filter((p) => re.test(String(p.props.Name))) }
    }
    case 'get-service': {
      const namePat = flagValue('-name') ?? pos[0] ?? '*'
      const re = likeToRegex(namePat.includes('*') || namePat.includes('?') ? namePat : `*${namePat}*`)
      return { objs: FAKE_SERVICES.filter((s) => re.test(String(s.props.Name)) || re.test(String(s.props.DisplayName))) }
    }
    case 'get-command':
      return { objs: SIM_COMMANDS.map((c) => ({ type: 'CommandInfo', props: { Name: c.name, Purpose: c.desc } })) }
    case 'get-help': {
      const topic = (pos[0] ? unquote(pos[0]) : '').toLowerCase()
      if (!topic)
        return {
          terminal: [
            'برای راهنمای هر فرمان: Get-Help <نام فرمان>',
            'فرمان‌های موجود شبیه‌ساز: Get-Command',
            'یادآوری صادقانه: این شبیه‌ساز آموزشی است — پاورشل واقعی نیست.',
          ],
        }
      const h = HELP_TEXT[topic]
      if (!h) return { terminal: [`راهنمایی برای «${topic}» در شبیه‌ساز ثبت نشده است؛ فهرست: Get-Command`] }
      return { terminal: h }
    }
    case 'where-object': {
      let inner = rest.join(' ')
      if (rest.length === 1 && rest[0].startsWith('{')) inner = rest[0].slice(1, -1).trim()
      inner = inner.trim()
      if (!inner) return { err: 'Where-Object : شرط خالی است — مثال: Where-Object { $_.CPU -gt 2 }' }
      let prop: string | undefined
      let op: string | undefined
      let valRaw: string | undefined
      const sb = inner.match(/^\$_\s*(?:\.\s*(\w+))?\s*(-eq|-ne|-gt|-lt|-ge|-le|-like|-match|-notmatch)?\s*(.+)?$/i)
      const simple = inner.match(/^(\w+)\s+(-eq|-ne|-gt|-lt|-ge|-le|-like|-match|-notmatch)\s+(.+)$/i)
      if (sb && (sb[1] || sb[2])) {
        prop = sb[1]
        op = sb[2]
        valRaw = sb[3]
      } else if (simple) {
        prop = simple[1]
        op = simple[2]
        valRaw = simple[3]
      } else {
        return { err: 'Where-Object : در شبیه‌ساز فقط فرم { $_.Property -op Value } یا Property -op Value پشتیبانی می‌شود' }
      }
      const objs = (input ?? []).filter((o) => {
        if (!prop) return true
        if (!op || valRaw === undefined) return Boolean(o.props[prop])
        return propMatches(o.props[prop], op, parseValue(valRaw))
      })
      return { objs }
    }
    case 'foreach-object': {
      const m = (rest[0] ?? '').match(/^\{\s*\$_\s*(?:\.\s*(\w+))?\s*\}$/)
      if (!m) return { err: 'ForEach-Object : در شبیه‌ساز فقط فرم { $_.Property } یا { $_ } پشتیبانی می‌شود' }
      const objs = (input ?? []).map((o) => {
        const v = m[1] ? o.props[m[1]] : o
        if (typeof v === 'object' && v !== null) return v
        return { type: 'String', props: { value: v ?? '' } }
      })
      return { objs }
    }
    case 'sort-object': {
      const desc = flags.includes('-descending')
      const propIdx = rest.findIndex((t) => t.toLowerCase() === '-property')
      const prop = unquote(propIdx !== -1 && rest[propIdx + 1] ? rest[propIdx + 1] : pos[0] ?? 'value')
      const objs = [...(input ?? [])].sort((a, b) => {
        const av = a.props[prop]
        const bv = b.props[prop]
        const an = typeof av === 'number'
        const bn = typeof bv === 'number'
        let c: number
        if (an && bn) c = (av as number) - (bv as number)
        else c = String(av ?? '').localeCompare(String(bv ?? ''))
        return desc ? -c : c
      })
      return { objs }
    }
    case 'select-object': {
      const first = flagValue('-first')
      const last = flagValue('-last')
      const objs = input ?? []
      if (first !== null) {
        const n = Number(first)
        if (!Number.isFinite(n)) return { err: 'Select-Object : مقدار -First باید عدد باشد' }
        return { objs: objs.slice(0, n) }
      }
      if (last !== null) {
        const n = Number(last)
        if (!Number.isFinite(n)) return { err: 'Select-Object : مقدار -Last باید عدد باشد' }
        return { objs: objs.slice(-n || undefined) }
      }
      return { err: 'Select-Object : در شبیه‌ساز فقط -First و -Last پشتیبانی می‌شود' }
    }
    case 'measure-object': {
      if (!input) return { err: 'Measure-Object : به ورودی خط لوله نیاز دارد' }
      return { terminal: measureLines(input, rest) }
    }
    case 'get-member': {
      if (!input || input.length === 0) return { err: 'Get-Member : به ورودی خط لوله نیاز دارد — مثال: Get-Date | Get-Member' }
      return { terminal: memberLines(input[0]) }
    }
    default:
      return {
        err: `«${cmdRaw}» در شبیه‌ساز پشتیبانی نمی‌شود — فهرست فرمان‌ها: Get-Command (این یک شبیه‌ساز آموزشی است، نه پاورشل واقعی)`,
      }
  }
}

interface ExecOut {
  lines: ConsoleLine[]
  err: boolean
  cwd?: string
  cleared?: boolean
}

function execPipeline(raw: string, cwd: string): ExecOut {
  const lines: ConsoleLine[] = []
  const stages = raw.split('|').map((s) => s.trim()).filter(Boolean)
  if (stages.length === 0) return { lines, err: true }
  let objs: PsObj[] | null = null
  let nextCwd: string | undefined
  let cleared = false
  for (let i = 0; i < stages.length; i++) {
    const r = execStage(objs, stages[i], cwd, i === 0)
    if (r.cwd) nextCwd = r.cwd
    if (r.err) return { lines: [{ kind: 'err', text: r.err }], err: true, cwd: nextCwd, cleared }
    if (r.clear) {
      cleared = true
      break
    }
    if (r.terminal) {
      for (const t of r.terminal) lines.push({ kind: 'out', text: t })
      return { lines, err: false, cwd: nextCwd, cleared }
    }
    objs = r.objs ?? null
  }
  if (objs) lines.push(...objToLines(objs))
  return { lines, err: false, cwd: nextCwd, cleared }
}

/* ================================================================
   مأموریت‌های زمین بازی
   ================================================================ */

interface PsMission {
  id: string
  brief: string
  hint: string
  check: (cmd: string, output: string) => boolean
}

const MISSIONS: PsMission[] = [
  {
    id: 'psm-1',
    brief: 'پروسه‌ای با بیشترین CPU را با خط لوله پیدا کن',
    hint: 'Get-Process را به Sort-Object CPU -Descending و بعد Select-Object -First 1 وصل کن',
    check: (c) => /get-process/i.test(c) && /sort-object|\bsort\b/i.test(c) && /cpu/i.test(c) && /-descending/i.test(c) && /-first\s+1/i.test(c),
  },
  {
    id: 'psm-2',
    brief: 'فقط سرویس‌های Running را فیلتر کن',
    hint: 'Get-Service | Where-Object { $_.Status -eq \'Running\' }',
    check: (c) => /get-service/i.test(c) && /where-object|where\b|\?/i.test(c) && /running/i.test(c),
  },
  {
    id: 'psm-3',
    brief: 'فایل‌های پوشهٔ جاری را بر اساس اندازه مرتب کن',
    hint: 'Get-ChildItem | Sort-Object Length (برای نزولی، -Descending اضافه کن)',
    check: (c) => /(get-childitem|gci|\bls\b|\bdir\b)/i.test(c) && /sort-object|\bsort\b/i.test(c) && /length/i.test(c),
  },
  {
    id: 'psm-4',
    brief: 'Where-Object و Measure-Object را در یک خط ترکیب کن',
    hint: 'اول فیلتر کن بعد بشمار: Get-Process | Where-Object { $_.CPU -gt 100 } | Measure-Object',
    check: (c) => /where-object|where\b|\?/i.test(c) && /measure-object|\bmeasure\b/i.test(c),
  },
  {
    id: 'psm-5',
    brief: 'یک خط لولهٔ کامل با سه مرحله بنویس',
    hint: 'سه فرمان را با دو کاراکتر | به هم وصل کن؛ مثل Get-Process | Sort-Object CPU -Descending | Select-Object -First 3',
    check: (c, out) => (c.match(/\|/g)?.length ?? 0) >= 2 && out.trim().length > 0,
  },
]

/* ================================================================
   اجزای کوچک رابط کاربری
   ================================================================ */

function SectionTitle({ icon: Icon, children, color }: { icon: typeof BookOpen; children: ReactNode; color: string }) {
  return (
    <h3 className="mb-2 flex items-center gap-2 text-sm font-black text-zinc-100">
      <span className="grid h-7 w-7 place-items-center rounded-lg" style={{ background: `${color}22`, color }}>
        <Icon size={15} />
      </span>
      {children}
    </h3>
  )
}

function CodeBlock({ title, code }: { title: string; code: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      /* کلیپ‌بورد در دسترس نیست */
    }
  }
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-zinc-950">
      <div className="flex items-center gap-2 border-b border-white/10 bg-zinc-900/80 px-3 py-1.5">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: SUNJOB_PALETTE.orange }} aria-hidden />
        <span className="min-w-0 flex-1 truncate text-[10.5px] font-bold text-zinc-400">{title}</span>
        <Badge variant="outline" className="h-4 border-white/15 px-1.5 text-[9px] font-black text-cyan-300" dir="ltr">
          PowerShell
        </Badge>
        <button
          onClick={copy}
          className="flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] text-zinc-500 transition hover:bg-white/10 hover:text-zinc-200"
          aria-label={`کپی کد ${title}`}
        >
          {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
          {copied ? 'کپی شد' : 'کپی'}
        </button>
      </div>
      <pre dir="ltr" className="overflow-x-auto p-3 font-mono text-[11px] leading-5" style={{ fontSize: 'var(--fa-code-size)', lineHeight: 'var(--fa-code-line-height)' }}>
        {code.split('\n').map((ln, i) => (
          <span key={i} className={ln.trimStart().startsWith('#') ? 'block text-zinc-500' : 'block text-emerald-300'}>
            {ln || ' '}
          </span>
        ))}
      </pre>
    </div>
  )
}

function ChapterShell({
  lesson,
  stage,
  done,
  onToggle,
  children,
}: {
  lesson: Lesson
  stage: StageDef
  done: boolean
  onToggle: () => void
  children: ReactNode
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ background: `${stage.tint}22`, color: stage.tint }}>
          <stage.icon size={19} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black" style={{ color: stage.tint }}>
            مرحلهٔ {stage.title}
          </p>
          <h2 className="text-base font-black text-zinc-50">{lesson.title}</h2>
          <p className="mt-0.5 flex items-center gap-1 text-[10.5px] text-zinc-400">
            <Clock size={11} aria-hidden />
            حدود {fa(lesson.minutes)} دقیقه مطالعه
          </p>
        </div>
        <Button
          size="sm"
          variant={done ? 'secondary' : 'outline'}
          onClick={onToggle}
          className={`shrink-0 text-[11px] ${done ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300' : 'border-white/15 text-zinc-300'}`}
        >
          <Check size={13} />
          {done ? 'خوانده شد' : 'خواندم!'}
        </Button>
      </div>
      {children}
    </div>
  )
}

/* ================================================================
   نمودار متحرک درس ۱: خط لولهٔ متن در برابر خط لولهٔ اشیاء
   ================================================================ */

const BASH_LINES = ['chrome    4012   812.4', 'explorer  1284    84.3', 'chrome    4820   245.9', 'msedge    2204    39.1']
const DIAG_OBJS = [
  { name: 'chrome', id: 4012, cpu: '812.4', tint: '#e11d48' },
  { name: 'explorer', id: 1284, cpu: '84.3', tint: '#10b981' },
  { name: 'Code', id: 3188, cpu: '451.7', tint: '#06b6d4' },
]
const STEP_CAPTIONS = [
  'دو مسیر موازی برای یک مسئلهٔ واحد: بالا متن خام (bash)، پایین اشیاء (پاورشل). دکمهٔ پخش را بزن یا گام‌به‌گام برو.',
  'داده‌ها وارد خط لوله می‌شوند: در bash چهار رشتهٔ بی‌نام، در پاورشل سه شیء با ویژگی‌های نام‌دار.',
  'فیلتر اجرا می‌شود: grep متن را جستجو می‌کند؛ Where-Object روی ویژگیِ Name شیء شرط می‌گذارد.',
  'نتیجه: رشتهٔ بی‌نامِ bash برای ستون بعدی دوباره تجزیه می‌خواهد؛ شیء پاورشل کامل مانده و آمادهٔ مرحلهٔ بعد است.',
]

function PipelineDiagram() {
  const reduced = useReducedMotion() ?? false
  const [step, setStep] = useState(1)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    if (!playing || reduced) return undefined
    const t = window.setTimeout(() => {
      if (step >= 3) {
        setPlaying(false)
        return
      }
      setStep(step + 1)
    }, 1600)
    return () => window.clearTimeout(t)
  }, [playing, step, reduced])

  const dur = reduced ? 0 : 0.35
  const show = (cond: boolean) => (cond ? 1 : 0)

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-950/60 p-3">
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-black text-zinc-100">خط لولهٔ متنی در برابر خط لولهٔ اشیاء</span>
        <div className="mr-auto flex items-center gap-1">
          {!reduced && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 border-white/15 px-2 text-[10.5px] text-zinc-200"
              onClick={() => {
                if (step >= 3) setStep(0)
                setPlaying((p) => !p)
              }}
            >
              {playing ? <Pause size={12} /> : <Play size={12} />}
              {playing ? 'توقف' : 'پخش'}
            </Button>
          )}
          <Button size="sm" variant="outline" className="h-7 border-white/15 px-2 text-[10.5px] text-zinc-200" onClick={() => setStep((s) => Math.min(3, s + 1))}>
            گام بعد
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-[10.5px] text-zinc-500"
            onClick={() => {
              setStep(1)
              setPlaying(false)
            }}
            aria-label="شروع دوباره نمودار"
          >
            <RotateCcw size={12} />
          </Button>
        </div>
      </div>

      <div dir="ltr" className="grid gap-3 md:grid-cols-2">
        {/* مسیر bash — متن */}
        <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-2.5">
          <div className="mb-2 flex items-center gap-1.5">
            <Badge className="border-transparent bg-zinc-700 text-[9.5px] font-black text-zinc-200">bash</Badge>
            <code className="truncate font-mono text-[9.5px] text-zinc-500">ps aux | grep chrome</code>
          </div>
          <div className="space-y-1">
            {BASH_LINES.map((l) => {
              const hit = l.startsWith('chrome')
              const dim = step >= 2 && !hit
              return (
                <motion.div
                  key={l}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: dim ? 0.18 : show(step >= 1), y: 0 }}
                  transition={{ duration: dur }}
                  className="rounded-md border border-white/10 bg-zinc-950 px-2 py-1 font-mono text-[10px] text-zinc-400"
                >
                  {l}
                </motion.div>
              )
            })}
          </div>
          {step >= 3 && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: dur }} className="mt-2 text-[9.5px] leading-4 text-zinc-500">
              خروجی: رشتهٔ بی‌نام — برای ستون بعدی باید دوباره تجزیه شود (awk)
            </motion.p>
          )}
        </div>

        {/* مسیر PowerShell — اشیاء */}
        <div className="rounded-xl border p-2.5" style={{ borderColor: `${SUNJOB_PALETTE.orange}44`, background: `${SUNJOB_PALETTE.orange}08` }}>
          <div className="mb-2 flex items-center gap-1.5">
            <Badge className="border-transparent text-[9.5px] font-black text-white" style={{ background: SUNJOB_PALETTE.orange }}>
              PowerShell
            </Badge>
            <code className="truncate font-mono text-[9.5px] text-amber-300/80" dir="ltr">
              {'Get-Process | Where-Object { $_.Name -eq "chrome" }'}
            </code>
          </div>
          <div className="space-y-1">
            {DIAG_OBJS.map((o) => {
              const hit = o.name === 'chrome'
              const dim = step >= 2 && !hit
              return (
                <motion.div
                  key={o.name}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: dim ? 0.15 : show(step >= 1), scale: dim ? 0.96 : 1 }}
                  transition={{ duration: dur }}
                  className="flex items-center gap-1.5 rounded-md border px-2 py-1"
                  style={{ borderColor: `${o.tint}55`, background: `${o.tint}14` }}
                >
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: o.tint }} aria-hidden />
                  {[
                    ['Name', o.name],
                    ['Id', String(o.id)],
                    ['CPU', o.cpu],
                  ].map(([k, v]) => (
                    <span key={k} className="rounded bg-black/30 px-1 py-0.5 font-mono text-[8.5px]" dir="ltr">
                      <span className="text-zinc-500">{k}: </span>
                      <span className="text-zinc-200">{v}</span>
                    </span>
                  ))}
                </motion.div>
              )
            })}
          </div>
          {step >= 3 && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: dur }} className="mt-2 text-[9.5px] font-bold leading-4 text-amber-300/90">
              خروجی: همان شیء کامل — همهٔ ویژگی‌ها برای مرحلهٔ بعد حفظ شده‌اند
            </motion.p>
          )}
        </div>
      </div>

      <p className="mt-3 rounded-lg bg-white/[0.04] p-2 text-center text-[10.5px] leading-5 text-zinc-300">{STEP_CAPTIONS[step]}</p>
    </div>
  )
}

/* ================================================================
   نمای درس
   ================================================================ */

function LessonView({
  lesson,
  done,
  onToggle,
  onNav,
}: {
  lesson: Lesson
  done: boolean
  onToggle: () => void
  onNav: (dir: -1 | 1) => void
}) {
  const stage = STAGES[lesson.stage]
  const idx = LESSONS.findIndex((l) => l.id === lesson.id)
  const [showSolution, setShowSolution] = useState(false)
  return (
    <ChapterShell lesson={lesson} stage={stage} done={done} onToggle={onToggle}>
      <div className="space-y-4 text-zinc-300">
        <div className="flex items-start gap-2 rounded-xl border p-3" style={{ borderColor: `${SUNJOB_PALETTE.orange}30`, background: `${SUNJOB_PALETTE.orange}0d` }}>
          <Lightbulb size={15} className="mt-0.5 shrink-0" style={{ color: SUNJOB_PALETTE.orange }} aria-hidden />
          <div>
            <p className="mb-1 text-[11px] font-black text-amber-200">چرا مهم است؟</p>
            <p className="text-zinc-300">{lesson.intro}</p>
          </div>
        </div>

        <section>
          <SectionTitle icon={BookOpen} color={stage.tint}>
            تشریح
          </SectionTitle>
          <div className="space-y-2">
            {lesson.body.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section>

        {lesson.id === 'ps-1' && <PipelineDiagram />}

        <section>
          <SectionTitle icon={SquareTerminal} color="#06b6d4">
            مثال‌های واقعی
          </SectionTitle>
          <div className="space-y-2">
            {lesson.code.map((c) => (
              <CodeBlock key={c.title} title={c.title} code={c.code} />
            ))}
          </div>
        </section>

        <section>
          <SectionTitle icon={AlertTriangle} color={SUNJOB_PALETTE.rose}>
            اشتباه‌های رایج
          </SectionTitle>
          <ul className="space-y-1.5">
            {lesson.mistakes.map((m) => (
              <li key={m} className="flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/[0.06] p-2.5 text-[11px] leading-5 text-zinc-300">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" aria-hidden />
                {m}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <SectionTitle icon={Target} color="#10b981">
            تمرین درس
          </SectionTitle>
          <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] p-3">
            <p className="text-zinc-200">{lesson.exercise.prompt}</p>
            <Button size="sm" variant="outline" className="mt-2 border-emerald-500/40 text-[10.5px] text-emerald-300" onClick={() => setShowSolution((s) => !s)}>
              {showSolution ? 'پنهان کردن پاسخ' : 'نمایش پاسخ نمونه'}
            </Button>
            <AnimatePresence>
              {showSolution && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="mt-2 overflow-hidden">
                  <CodeBlock title="پاسخ نمونه" code={lesson.exercise.sampleSolution} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        <section>
          <SectionTitle icon={KeyRound} color={SUNJOB_PALETTE.violet}>
            واژه‌های کلیدی
          </SectionTitle>
          <div className="flex flex-wrap gap-1.5">
            {lesson.keyTerms.map((t) => (
              <span key={t.en} className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-zinc-900/60 px-2 py-1 text-[10px]">
                <code dir="ltr" className="font-mono font-black" style={{ color: SUNJOB_PALETTE.violetSoft }}>
                  {t.en}
                </code>
                <span className="text-zinc-500">=</span>
                <span className="text-zinc-300">{t.fa}</span>
              </span>
            ))}
          </div>
        </section>

        <div className="flex items-center justify-between border-t border-white/10 pt-3">
          <Button size="sm" variant="ghost" disabled={idx === 0} onClick={() => onNav(-1)} className="text-[11px] text-zinc-400">
            درس قبلی
          </Button>
          <Button size="sm" variant="ghost" disabled={idx === LESSONS.length - 1} onClick={() => onNav(1)} className="text-[11px] text-zinc-400">
            درس بعدی
            <ChevronLeft size={13} />
          </Button>
        </div>
      </div>
    </ChapterShell>
  )
}

/* ================================================================
   زمین بازی — کنسول شبیه‌ساز آموزشی
   ================================================================ */

function PsConsole({
  missionsDone,
  onMissionDone,
}: {
  missionsDone: string[]
  onMissionDone: (id: string) => void
}) {
  const [cwd, setCwd] = useState(HOME)
  const [lines, setLines] = useState<ConsoleLine[]>([
    { kind: 'warn', text: 'شبیه‌ساز آموزشی — پاورشل واقعی نیست؛ داده‌ها جعلی و محیط کاملاً امن است.' },
    { kind: 'out', text: 'فهرست فرمان‌های پشتیبانی‌شده: Get-Command — راهنما: Get-Help Get-Process' },
  ])
  const [history, setHistory] = useState<string[]>([])
  const [histIdx, setHistIdx] = useState(-1)
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [lines])

  const run = useCallback(
    (raw: string) => {
      const trimmed = raw.trim()
      setLines((prev) => [...prev.slice(-200), { kind: 'in', text: `PS ${cwd}> ${trimmed}` }])
      if (!trimmed) return
      setHistory((h) => [...h.slice(-50), trimmed])
      setHistIdx(-1)
      const res = execPipeline(trimmed, cwd)
      if (res.cwd) setCwd(res.cwd)
      setLines((prev) => {
        let base = prev
        if (res.cleared) base = []
        return [...base, ...res.lines].slice(-200)
      })
      if (!res.err) {
        const outText = res.lines.map((l) => l.text).join('\n')
        for (const m of MISSIONS) {
          if (!missionsDone.includes(m.id) && m.check(trimmed, outText)) onMissionDone(m.id)
        }
      }
    },
    [cwd, missionsDone, onMissionDone]
  )

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-inner">
      <div className="flex flex-wrap items-center gap-1.5 border-b border-white/10 bg-zinc-900/80 px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-500" aria-hidden />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" aria-hidden />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" aria-hidden />
        <span className="mr-1 font-mono text-[11px] font-bold text-zinc-400" dir="ltr">
          PS {cwd}
        </span>
        <Badge className="mr-auto border-transparent bg-amber-500/15 text-[9px] font-black text-amber-300">شبیه‌ساز آموزشی — پاورشل واقعی نیست</Badge>
        <button
          onClick={() => {
            setCwd(HOME)
            setLines([{ kind: 'out', text: 'کنسول تازه نفس شد. دوباره برو!' }])
          }}
          className="flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] text-zinc-500 transition hover:bg-white/10 hover:text-zinc-200"
          title="ریست کنسول"
        >
          <RotateCcw size={11} />
          ریست
        </button>
      </div>
      <div
        ref={scrollRef}
        dir="ltr"
        role="log"
        aria-label="خروجی کنسول شبیه‌ساز پاورشل"
        className="os-scroll h-72 overflow-y-auto p-3 font-mono text-[11.5px] leading-6"
        onClick={() => inputRef.current?.focus()}
      >
        {lines.map((l, i) => (
          <div
            key={i}
            className={`pengo-fadein whitespace-pre-wrap break-all ${
              l.kind === 'in'
                ? 'text-amber-300'
                : l.kind === 'err'
                  ? 'text-rose-400'
                  : l.kind === 'ok'
                    ? 'font-bold text-emerald-400'
                    : l.kind === 'warn'
                      ? 'font-bold text-amber-400'
                      : 'text-zinc-300'
            }`}
          >
            {l.text}
          </div>
        ))}
        <div className="flex items-center gap-1.5" dir="ltr">
          <span className="shrink-0 font-mono font-bold text-emerald-400">PS {'>'}</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                run(input)
                setInput('')
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                if (history.length === 0) return
                const idx = histIdx === -1 ? history.length - 1 : Math.max(0, histIdx - 1)
                setHistIdx(idx)
                setInput(history[idx] ?? '')
              } else if (e.key === 'ArrowDown') {
                e.preventDefault()
                if (histIdx === -1) return
                const idx = histIdx + 1
                if (idx >= history.length) {
                  setHistIdx(-1)
                  setInput('')
                } else {
                  setHistIdx(idx)
                  setInput(history[idx] ?? '')
                }
              }
            }}
            className="min-w-0 flex-1 bg-transparent font-mono text-[12px] text-zinc-100 caret-emerald-400 outline-none"
            aria-label="ورودی کنسول شبیه‌ساز"
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="none"
          />
        </div>
      </div>
    </div>
  )
}

function MissionsPanel({ missionsDone }: { missionsDone: string[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-3">
      <h4 className="mb-2 flex items-center gap-1.5 text-xs font-black text-zinc-100">
        <Target size={14} style={{ color: SUNJOB_PALETTE.orange }} />
        مأموریت‌ها ({fa(Math.min(missionsDone.length, MISSIONS.length))}/{fa(MISSIONS.length)})
      </h4>
      <ol className="space-y-1.5">
        {MISSIONS.map((m, i) => {
          const done = missionsDone.includes(m.id)
          const active = !done && i <= missionsDone.length
          return (
            <li
              key={m.id}
              className={`rounded-lg border p-2 text-[10.5px] leading-4 transition ${
                done ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : active ? 'border-amber-500/50 bg-amber-500/10 text-amber-200' : 'border-white/10 bg-white/[0.03] text-zinc-500'
              }`}
            >
              <span className="flex items-start gap-1.5">
                {done ? (
                  <CheckCircle2 size={12} className="mt-0.5 shrink-0" aria-hidden />
                ) : (
                  <span className="mt-0.5 grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full border border-current text-[8px] font-black" aria-hidden>
                    {fa(i + 1)}
                  </span>
                )}
                <span>{m.brief}</span>
              </span>
              {active && <span className="mt-1 block pr-5 text-[9.5px] text-amber-300/70">راهنما: {m.hint}</span>}
            </li>
          )
        })}
      </ol>
      {missionsDone.length >= MISSIONS.length && (
        <p className="pengo-fadein mt-2 rounded-lg bg-emerald-500/15 p-2 text-[10px] font-bold leading-4 text-emerald-300">
          همهٔ مأموریت‌ها انجام شد! حالا رسماً خط‌لوله‌باز هستی.
        </p>
      )}
    </div>
  )
}

function PlayView({ missionsDone, onMissionDone }: { missionsDone: string[]; onMissionDone: (id: string) => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/[0.07] p-3">
        <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-400" aria-hidden />
        <p className="text-[11px] leading-5 text-amber-200/90">
          <b>شبیه‌ساز آموزشی — پاورشل واقعی نیست.</b> این کنسول روی یک مدل دادهٔ جعلی (پروسه‌ها، سرویس‌ها و فایل‌سیستم ساختگی) کار می‌کند تا فلسفهٔ خط لوله را بدون هیچ خطری تمرین کنی. هیچ فرمانی اثر واقعی روی سیستم ندارد.
        </p>
      </div>
      <div className="grid gap-3 lg:grid-cols-[1fr_260px]">
        <PsConsole missionsDone={missionsDone} onMissionDone={onMissionDone} />
        <div className="space-y-3">
          <MissionsPanel missionsDone={missionsDone} />
          <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-3">
            <h4 className="mb-1.5 flex items-center gap-1.5 text-xs font-black text-zinc-100">
              <FlaskConical size={14} className="text-cyan-300" />
              محدودیت‌های صادقانه
            </h4>
            <ul className="space-y-1 text-[10px] leading-4 text-zinc-500">
              <li>- فقط فرمان‌های فهرست‌شده شبیه‌سازی شده‌اند (Get-Command را بزن).</li>
              <li>- داده‌ها جعلی و ثابت‌اند و ذخیره نمی‌شوند.</li>
              <li>- Where-Object و ForEach-Object فقط فرم سادهٔ $ Property را می‌فهمند.</li>
              <li>- نوشتن فایل، نصب بسته و تغییر سرویس شبیه‌سازی نشده است.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ================================================================
   آزمون نهایی
   ================================================================ */

function FinalQuiz({ quizBest, onScore, onGoCert }: { quizBest: number; onScore: (s: number) => void; onGoCert: () => void }) {
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const passed = score >= PASS_SCORE

  const q = QUIZ[idx]

  const choose = (i: number) => {
    if (picked !== null) return
    setPicked(i)
    if (i === q.answer) setScore((s) => s + 1)
  }

  const next = () => {
    if (idx + 1 < QUIZ.length) {
      setIdx(idx + 1)
      setPicked(null)
    } else {
      setFinished(true)
      onScore(score)
    }
  }

  const restart = () => {
    setIdx(0)
    setPicked(null)
    setScore(0)
    setFinished(false)
  }

  if (finished) {
    return (
      <div className="space-y-4">
        <div className={`rounded-2xl border p-4 text-center ${passed ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-amber-500/40 bg-amber-500/10'}`}>
          <Trophy size={30} className={`mx-auto ${passed ? 'text-emerald-400' : 'text-amber-400'}`} aria-hidden />
          <p className="mt-2 text-lg font-black text-zinc-100">
            نمرهٔ تو: {fa(score)} از {fa(QUIZ.length)}
          </p>
          <p className="mt-1 text-xs leading-5 text-zinc-300">
            {passed
              ? 'قبول شدی! حالا اگر هر ۱۲ درس را هم خوانده باشی، گواهی آکادمی پاورشل برایت فعال است.'
              : `نزدیک بود؛ حد نصاب ${fa(PASS_SCORE)} درست است. درس‌ها را یک مرور کن و دوباره بیا — بهترین نمرهٔ فعلی تو: ${fa(quizBest)}`}
          </p>
        </div>
        {passed && (
          <div className="flex justify-center">
            <Button size="sm" onClick={onGoCert} className="text-xs">
              <Award size={14} />
              رفتن به گواهی
            </Button>
          </div>
        )}
        <div className="flex justify-center">
          <Button size="sm" variant="outline" onClick={restart} className="text-xs">
            <RotateCcw size={13} />
            آزمون دوباره
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Progress value={((idx + (picked !== null ? 1 : 0)) / QUIZ.length) * 100} className="h-1.5 flex-1" />
        <span className="text-[10px] text-zinc-500">
          {fa(idx + 1)} / {fa(QUIZ.length)}
        </span>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          initial={{ opacity: 0, x: -14 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 14 }}
          transition={{ duration: 0.18 }}
          className="space-y-2"
        >
          <p className="text-sm font-black leading-6 text-zinc-100">{q.q}</p>
          <div className="grid gap-1.5">
            {q.options.map((o, i) => {
              const isAnswer = i === q.answer
              const isPicked = picked === i
              let cls = 'border-white/10 bg-zinc-900/60 text-zinc-200 hover:border-amber-500/50'
              if (picked !== null) {
                if (isAnswer) cls = 'border-emerald-500/60 bg-emerald-500/15 text-emerald-200'
                else if (isPicked) cls = 'border-rose-500/60 bg-rose-500/15 text-rose-200'
                else cls = 'border-white/5 bg-zinc-900/40 text-zinc-500'
              }
              return (
                <button key={i} onClick={() => choose(i)} disabled={picked !== null} className={`rounded-xl border px-3 py-2.5 text-right text-xs leading-5 transition active:scale-[0.99] ${cls}`}>
                  {o}
                </button>
              )
            })}
          </div>
          {picked !== null && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-[11px] leading-5 text-zinc-300">
              {picked === q.answer ? <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-400" aria-hidden /> : <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-400" aria-hidden />}
              <span>{q.why}</span>
            </motion.div>
          )}
          {picked !== null && (
            <div className="flex justify-end">
              <Button size="sm" onClick={next} className="text-xs">
                {idx + 1 < QUIZ.length ? 'سؤال بعدی' : 'دیدن نتیجه'}
                <ChevronLeft size={14} />
              </Button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

/* ================================================================
   گواهی
   ================================================================ */

function CertView({ progress }: { progress: PsProgress }) {
  const [name, setName] = useState('')
  const lessonsDone = LESSON_IDS.every((id) => progress.done.includes(id))
  const quizOk = progress.quizBest >= PASS_SCORE
  const missionsAll = progress.missionsDone.length >= MISSIONS.length
  const eligible = lessonsDone && quizOk
  const today = new Date().toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' })

  if (!eligible) {
    const checks = [
      { label: `خواندن هر ۱۲ درس (${fa(progress.done.filter((d) => LESSON_IDS.includes(d)).length)}/${fa(LESSONS.length)})`, ok: lessonsDone },
      { label: `قبولی آزمون با حداقل ${fa(PASS_SCORE)} نمره (بهترین: ${fa(progress.quizBest)})`, ok: quizOk },
      { label: `مأموریت‌های زمین بازی — اختیاری اما توصیه‌شده (${fa(Math.min(progress.missionsDone.length, MISSIONS.length))}/${fa(MISSIONS.length)})`, ok: missionsAll },
    ]
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-2 rounded-xl border border-cyan-500/25 bg-cyan-500/[0.06] p-3">
          <Award size={16} className="mt-0.5 shrink-0 text-cyan-300" aria-hidden />
          <p className="text-[11.5px] leading-5 text-zinc-300">گواهی آکادمی پاورشل با دو شرط فعال می‌شود: خواندن همهٔ درس‌ها و قبولی در آزمون. پیشرفتت را ببین:</p>
        </div>
        <ul className="space-y-1.5">
          {checks.map((c) => (
            <li key={c.label} className={`flex items-center gap-2 rounded-xl border p-3 text-[11.5px] ${c.ok ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-white/10 bg-zinc-900/60 text-zinc-400'}`}>
              {c.ok ? <CheckCircle2 size={14} className="shrink-0" aria-hidden /> : <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-current" aria-hidden />}
              {c.label}
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="overflow-hidden rounded-2xl border-2 border-amber-500/50" style={{ background: 'linear-gradient(135deg,#0b1120 0%,#1a2744 100%)' }}>
        <div className="border-b border-white/10 bg-amber-500/10 px-4 py-2 text-center">
          <p className="text-[10px] font-black tracking-widest text-amber-300">CERTIFICATE OF COMPLETION</p>
        </div>
        <div className="flex flex-col items-center gap-2 p-5 text-center">
          <img src="/brand/sunjob-logo.webp" alt="لوگوی سان‌جاب" className="h-12 w-12 rounded-xl bg-white object-contain p-0.5" />
          <p className="text-[11px] text-zinc-400">گواهی می‌شود که</p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 30))}
            placeholder="اسمت را اینجا بنویس…"
            className="w-56 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-center text-sm font-black text-amber-200 outline-none focus:border-amber-500/60"
            maxLength={30}
            aria-label="نام روی گواهی"
          />
          <p className="text-[11px] leading-5 text-zinc-300">
            دورهٔ ساختاریافتهٔ «آکادمی پاورشل» را با نمرهٔ {fa(progress.quizBest)} از {fa(QUIZ.length)} با موفقیت به پایان رساند —
            <br />
            شامل فلسفهٔ اشیاء، خط لوله، پروسه‌ها و سرویس‌ها، CIM، اسکریپت‌نویسی، امنیت اجرا و winget
          </p>
          <div className="mt-1 flex items-center gap-4 text-[9.5px] text-zinc-500">
            <span>{today}</span>
            <span className="font-black text-amber-300/80">آکادمی پاورشلِ {BRAND.name}</span>
          </div>
        </div>
      </motion.div>
      <p className="text-center text-[10px] leading-4 text-zinc-500">
        این گواهی صرفاً آموزشی و سرگرم‌کننده است و جایگزین مدرک رسمی مایکروسافت (مثل AZ یا MCE) نیست؛ برای مسیر حرفه‌ای، آزمون‌های رسمی مایکروسافت را در نظر بگیر.
      </p>
    </div>
  )
}

/* ================================================================
   اپ اصلی
   ================================================================ */

type ViewId = 'home' | 'play' | 'quiz' | 'cert' | string

export default function PowerShellAcademyApp() {
  const [progress, setProgress] = useState<PsProgress>(EMPTY_PROGRESS)
  const [view, setView] = useState<ViewId>('home')
  const pushToast = useOS((s) => s.pushToast)
  const scrollRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const t = window.setTimeout(() => setProgress(loadProgress()), 0)
    return () => window.clearTimeout(t)
  }, [])

  /* آخرین درس دیده‌شده — برای «ادامهٔ یادگیری» در خانه */
  useEffect(() => {
    if (view !== 'home' && view !== 'play' && view !== 'quiz' && view !== 'cert') rememberView('powershell-academy', view)
  }, [view])

  const update = useCallback((fn: (p: PsProgress) => PsProgress) => {
    setProgress((prev) => {
      const next = fn(prev)
      saveProgress(next)
      return next
    })
  }, [])

  const toggleRead = useCallback(
    (lesson: Lesson) => {
      update((p) => {
        const willBeDone = !p.done.includes(lesson.id)
        const done = willBeDone ? [...p.done, lesson.id] : p.done.filter((d) => d !== lesson.id)
        if (willBeDone) {
          useGame.getState().completeLesson(PS_TRACK, lesson.id, 20)
          pushToast({
            title: `درس «${lesson.title}» تمام شد!`,
            body: done.length >= LESSONS.length ? 'همهٔ ۱۲ درس پاورشل را تموم کردی؛ آزمون در انتظارت است. با اسپانسری سان‌جاب' : `${fa(LESSONS.length - done.length)} درس تا پایان دوره باقی مانده. با اسپانسری سان‌جاب`,
            icon: GraduationCap,
          })
        }
        return { ...p, done }
      })
    },
    [pushToast, update]
  )

  const onMissionDone = useCallback(
    (id: string) => {
      update((p) => (p.missionsDone.includes(id) ? p : { ...p, missionsDone: [...p.missionsDone, id] }))
      useGame.getState().completeLesson(PS_TRACK, id, 15)
      const done = new Set([...progress.missionsDone, id])
      if (MISSIONS.every((m) => done.has(m.id))) {
        pushToast({ title: 'همهٔ مأموریت‌های زمین بازی انجام شد!', body: 'خط لولهٔ پاورشل حالا زیر نفذ توست. با اسپانسری سان‌جاب', icon: Trophy })
      }
    },
    [progress.missionsDone, pushToast, update]
  )

  const onQuizScore = useCallback(
    (s: number) => {
      update((p) => ({ ...p, quizBest: Math.max(p.quizBest, s) }))
      useGame.getState().registerQuiz(PS_TRACK, 'final', s === QUIZ.length, s >= PASS_SCORE ? 30 : 10)
      if (s >= PASS_SCORE) pushToast({ title: 'قبول شدی! گواهی آکادمی پاورشل فعال شد', body: 'اسم داخل گواهی را می‌توانی همان‌جا وارد کنی.', icon: Award })
    },
    [pushToast, update]
  )

  const lessonsDone = progress.done.filter((d) => LESSON_IDS.includes(d)).length
  const pct = Math.round((lessonsDone / LESSONS.length) * 100)
  const missionCount = Math.min(progress.missionsDone.length, MISSIONS.length)
  const activeLesson = LESSONS.find((l) => l.id === view)
  const resumeId = view === 'home' ? lastView('powershell-academy') : null
  const resumeLesson = resumeId ? (LESSONS.find((l) => l.id === resumeId) ?? null) : null

  const sidebarItem = (v: ViewId, Icon: typeof BookOpen, label: string, tint: string, doneFlag?: boolean) => (
    <button
      key={v}
      onClick={() => setView(v)}
      className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-right text-xs transition ${view === v ? 'font-black text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'}`}
      style={view === v ? { background: `${tint}26` } : undefined}
      aria-current={view === v ? 'page' : undefined}
    >
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg" style={{ background: `${tint}22`, color: tint }}>
        <Icon size={13} />
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {doneFlag && <CheckCircle2 size={13} className="shrink-0 text-emerald-400" aria-hidden />}
    </button>
  )

  return (
    <div className="flex h-full flex-col bg-zinc-950/70">
      {/* هدر */}
      <header className="relative h-24 shrink-0 overflow-hidden border-b border-white/10">
        <img src="/wallpapers/sunjob-sunrise.png" alt="طلوع سان‌جاب — پس‌زمینهٔ آکادمی پاورشل" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-l from-black/85 via-black/55 to-black/25" aria-hidden />
        <div className="relative flex h-full items-center gap-3 px-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/15 bg-black/40 backdrop-blur" style={{ color: SUNJOB_PALETTE.orange }}>
            <SquareTerminal size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-black text-white sm:text-lg">
              آکادمی پاورشل <span className="text-[10px] font-bold text-amber-300">— دورهٔ جامع ویندوز</span>
            </h1>
            <p className="hidden text-[11px] text-zinc-300 sm:block">از «اشیاء در برابر متن» تا winget و گواهی پایانی — با زمین بازی و آزمون</p>
            <div className="mt-1.5 flex max-w-xs items-center gap-2">
              <Progress value={pct} className="h-1.5 flex-1" />
              <span className="text-[10px] font-black text-amber-300">{fa(pct)}٪</span>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <Badge className="border border-amber-500/40 bg-black/50 text-[8.5px] font-black text-amber-300 backdrop-blur">شبیه‌ساز آموزشی — پاورشل واقعی نیست</Badge>
            <img src="/brand/sunjob-logo.webp" alt="لوگوی سان‌جاب" className="h-8 w-8 rounded-xl border border-white/15 bg-white/95 object-contain p-0.5" />
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* سایدبار */}
        <nav className="os-scroll hidden w-56 shrink-0 space-y-0.5 overflow-y-auto border-l border-white/10 bg-black/25 p-2 md:block" aria-label="درس‌های آکادمی پاورشل">
          {sidebarItem('home', GraduationCap, 'خانهٔ آکادمی', SUNJOB_PALETTE.orange)}
          {STAGES.map((s, si) => (
            <div key={s.title}>
              <p className="mt-3 mb-1 flex items-center gap-1.5 px-2.5 text-[9.5px] font-black uppercase tracking-wide" style={{ color: s.tint }}>
                <s.icon size={11} />
                مرحلهٔ {fa(si + 1)}: {s.title}
              </p>
              {LESSONS.filter((l) => l.stage === si).map((l) => sidebarItem(l.id, s.icon, l.title, s.tint, progress.done.includes(l.id)))}
            </div>
          ))}
          <p className="mt-3 mb-1 px-2.5 text-[9.5px] font-black uppercase tracking-wide text-cyan-300">تمرین و سنجش</p>
          {sidebarItem('play', FlaskConical, 'زمین بازی (شبیه‌ساز)', '#06b6d4', missionCount >= MISSIONS.length)}
          {sidebarItem('quiz', ListChecks, 'آزمون پایانی', SUNJOB_PALETTE.rose, progress.quizBest >= PASS_SCORE)}
          {sidebarItem('cert', Award, 'گواهی دوره', '#fbbf24', lessonsDone >= LESSONS.length && progress.quizBest >= PASS_SCORE)}
          <p className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-center text-[9.5px] leading-4 text-zinc-500">
            مسیر یادگیری برای کاربران ویندوز — الهام‌گرفته از مستندات رسمی Microsoft Learn
            <br />
            با اسپانسری سان‌جاب
          </p>
        </nav>

        {/* تب‌های موبایل */}
        <div className="absolute inset-x-0 top-24 z-10 flex gap-1 overflow-x-auto bg-black/60 px-2 py-1.5 backdrop-blur md:hidden" role="tablist" aria-label="بخش‌های آکادمی پاورشل">
          {[
            { id: 'home', label: 'خانه' },
            ...LESSONS.map((l) => ({ id: l.id, label: `درس ${fa(LESSONS.indexOf(l) + 1)}` })),
            { id: 'play', label: 'زمین بازی' },
            { id: 'quiz', label: 'آزمون' },
            { id: 'cert', label: 'گواهی' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setView(t.id)}
              className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold transition ${view === t.id ? 'border-transparent bg-[#f7931e] text-white' : 'border-white/10 bg-zinc-800/80 text-zinc-300'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* محتوا */}
        <main ref={scrollRef} className="os-scroll relative min-w-0 flex-1 overflow-y-auto p-4 pb-16 pt-10 md:pb-4 md:pt-4">
          <ReadProgress targetRef={scrollRef} accent={SUNJOB_PALETTE.orange} />
          <AnimatePresence mode="wait">
            <motion.div key={view} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.16 }} className="reading-shell prose-fa mx-auto">
              {/* ---------------- خانه ---------------- */}
              {view === 'home' && (
                <div className="space-y-4">
                  <div className="relative overflow-hidden rounded-2xl border border-white/10">
                    <img src="/wallpapers/retro-terminal.png" alt="ترمینال خوش‌آمدگویی آکادمی پاورشل" className="h-40 w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" aria-hidden />
                    <div className="absolute bottom-3 left-4 right-4">
                      <p className="text-sm font-black text-white sm:text-base">کاربر ویندوزی! پاورشل قدرت واقعی سیستم‌ات در دست توست.</p>
                      <p className="mt-0.5 text-[11px] leading-4 text-zinc-300">۱۲ درس در ۴ مرحله، زمین بازی با شبیه‌ساز آموزشی صادق، ۵ مأموریت عملی، آزمون و گواهی — همه‌چیز آفلاین و بدون خطر.</p>
                    </div>
                  </div>

                  {resumeLesson && (
                    <button onClick={() => setView(resumeLesson.id)} className="flex w-full items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] p-3 text-right transition hover:border-amber-400/50 hover:bg-amber-500/[0.09]">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-500/15" style={{ color: SUNJOB_PALETTE.orange }}>
                        <BookOpen size={17} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-black text-zinc-100">ادامهٔ یادگیری: {resumeLesson.title}</span>
                        <span className="block text-[10px] text-zinc-500">مرحلهٔ {fa(resumeLesson.stage + 1)} — از همان‌جایی که رها کردی ادامه بده</span>
                      </span>
                      <ChevronLeft size={14} className="shrink-0 text-amber-400" aria-hidden />
                    </button>
                  )}

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'درس خوانده‌شده', value: `${fa(lessonsDone)}/${fa(LESSONS.length)}` },
                      { label: 'مأموریت زمین بازی', value: `${fa(missionCount)}/${fa(MISSIONS.length)}` },
                      { label: 'بهترین نمرهٔ آزمون', value: fa(progress.quizBest) },
                    ].map((s) => (
                      <div key={s.label} className="rounded-xl border border-white/10 bg-zinc-900/60 p-3 text-center">
                        <p className="text-lg font-black" style={{ color: SUNJOB_PALETTE.orange }}>
                          {s.value}
                        </p>
                        <p className="mt-0.5 text-[10px] text-zinc-400">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {STAGES.map((s, si) => (
                    <div key={s.title}>
                      <p className="mb-1.5 flex items-center gap-1.5 text-xs font-black" style={{ color: s.tint }}>
                        <s.icon size={14} />
                        مرحلهٔ {fa(si + 1)}: {s.title}
                        <span className="text-[10px] font-normal text-zinc-500">— {s.subtitle}</span>
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {LESSONS.filter((l) => l.stage === si).map((l) => {
                          const isDone = progress.done.includes(l.id)
                          return (
                            <button key={l.id} onClick={() => setView(l.id)} className="group flex items-start gap-3 rounded-2xl border border-white/10 bg-zinc-900/60 p-3 text-right transition hover:border-white/25 hover:bg-zinc-900 active:scale-[0.99]">
                              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl font-black" style={{ background: `${s.tint}22`, color: s.tint }}>
                                {fa(LESSONS.indexOf(l) + 1)}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="flex items-center gap-1.5">
                                  <span className="truncate text-xs font-black text-zinc-100">{l.title}</span>
                                  {isDone && <CheckCircle2 size={13} className="shrink-0 text-emerald-400" aria-hidden />}
                                </span>
                                <span className="mt-0.5 flex items-center gap-1 text-[10px] text-zinc-500">
                                  <Clock size={10} aria-hidden />
                                  {fa(l.minutes)} دقیقه
                                </span>
                              </span>
                              <ChevronLeft size={14} className="mt-2 shrink-0 text-zinc-600 transition group-hover:text-zinc-300" aria-hidden />
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}

                  <div className="grid gap-2 sm:grid-cols-2">
                    <button onClick={() => setView('play')} className="flex items-center gap-3 rounded-2xl border border-cyan-500/25 bg-cyan-500/[0.05] p-3 text-right transition hover:border-cyan-400/50">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-cyan-500/15 text-cyan-300">
                        <FlaskConical size={17} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-black text-zinc-100">زمین بازی — شبیه‌ساز آموزشی</span>
                        <span className="block text-[10px] text-zinc-500">خط لوله را روی داده‌های جعلی تمرین کن؛ صادقانه: پاورشل واقعی نیست</span>
                      </span>
                    </button>
                    <button onClick={() => setView('quiz')} className="flex items-center gap-3 rounded-2xl border border-rose-500/25 bg-rose-500/[0.05] p-3 text-right transition hover:border-rose-400/50">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-rose-500/15 text-rose-300">
                        <ListChecks size={17} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-black text-zinc-100">آزمون پایانی و گواهی</span>
                        <span className="block text-[10px] text-zinc-500">۸ سؤال، حد نصاب قبولی {fa(PASS_SCORE)} — بهترین نمره: {fa(progress.quizBest)}</span>
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* ---------------- درس‌ها ---------------- */}
              {activeLesson && (
                <LessonView
                  key={activeLesson.id}
                  lesson={activeLesson}
                  done={progress.done.includes(activeLesson.id)}
                  onToggle={() => toggleRead(activeLesson)}
                  onNav={(dir) => {
                    const idx = LESSONS.findIndex((l) => l.id === activeLesson.id)
                    const target = LESSONS[Math.max(0, Math.min(LESSONS.length - 1, idx + dir))]
                    if (target) setView(target.id)
                  }}
                />
              )}

              {/* ---------------- زمین بازی ---------------- */}
              {view === 'play' && <PlayView missionsDone={progress.missionsDone} onMissionDone={onMissionDone} />}

              {/* ---------------- آزمون ---------------- */}
              {view === 'quiz' && <FinalQuiz quizBest={progress.quizBest} onScore={onQuizScore} onGoCert={() => setView('cert')} />}

              {/* ---------------- گواهی ---------------- */}
              {view === 'cert' && <CertView progress={progress} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
