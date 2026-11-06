'use client'

/* ==================================================================
   آکادمی هوش مصنوعی — مفاهیم اولیه (SanjabOS)
   دورهٔ تعاملی فارسی برای فهم شهودی AI:
   پرسپترون، نزول گرادیان، توابع فعال‌ساز، شبکهٔ عصبی، مدل زبانی
   بایگرامی، بیش‌برازش، اخلاق و آزمون پایانی.
   همهٔ محاسبات به‌صورت محلی و بدون سرور انجام می‌شود.
   با اسپانسری سان‌جاب
   ================================================================== */

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode, RefObject } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Activity,
  AlertTriangle,
  Bot,
  BookOpen,
  Brain,
  Briefcase,
  Check,
  CheckCircle2,
  ChevronLeft,
  Copyright,
  Cpu,
  Ghost,
  GitBranch,
  GraduationCap,
  Lightbulb,
  Lock,
  MessageSquare,
  Pause,
  Play,
  RotateCcw,
  Scale,
  Sparkles,
  Trophy,
  TrendingDown,
  Users,
  Video,
  Zap,
  Scissors,
  Eye,
  Search,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { useOS } from '@/lib/os/store'
import { useGame } from '@/lib/gamification/engine'
import NNLab from './nn-lab'

/* ================================================================
   پالت و ابزارهای پایه
   ================================================================ */

const ORANGE = '#f7931e'
const VIOLET = '#8b5cf6'
const TEAL = '#0ea5a0'
const ROSE = '#f43f5e'
const PINK = '#ec4899'

const PROGRESS_KEY = 'sunjob-ai-v1'

interface AIProgress {
  done: string[]
  quizBest: number
}

const EMPTY_PROGRESS: AIProgress = { done: [], quizBest: 0 }

function loadProgress(): AIProgress {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY)
    if (!raw) return EMPTY_PROGRESS
    const parsed = JSON.parse(raw) as Partial<AIProgress>
    return {
      done: Array.isArray(parsed.done)
        ? parsed.done.filter((d): d is string => typeof d === 'string')
        : [],
      quizBest: typeof parsed.quizBest === 'number' ? parsed.quizBest : 0,
    }
  } catch {
    return EMPTY_PROGRESS
  }
}

function saveProgress(p: AIProgress) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(p))
  } catch {
    /* ذخیره‌سازی مهم نیست؛ اپ بدون آن هم کار می‌کند */
  }
}

/** تبدیل عدد به رقم فارسی */
const fa = (n: number) => n.toLocaleString('fa-IR')
/** عدد فارسی همراه علامت منفی (برای محورها) */
const faSigned = (n: number) => (n < 0 ? '−' : '') + fa(Math.abs(n))
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

/* ================================================================
   تعریف بخش‌ها
   ================================================================ */

type ViewId =
  | 'home'
  | 'perceptron'
  | 'gradient'
  | 'activations'
  | 'network'
  | 'llm'
  | 'overfit'
  | 'ethics'
  | 'lab'
  | 'tokenizer'
  | 'attention'
  | 'rag'
  | 'quiz'

const TokenizerLab = dynamic(() => import('@/components/os/academy/ai-labs').then((m) => m.TokenizerLab), {
  ssr: false,
  loading: () => <div className="grid h-32 place-items-center text-xs text-zinc-500">در حال بارگیری آزمایشگاه…</div>,
})
const AttentionLab = dynamic(() => import('@/components/os/academy/ai-labs').then((m) => m.AttentionLab), {
  ssr: false,
  loading: () => <div className="grid h-32 place-items-center text-xs text-zinc-500">در حال بارگیری آزمایشگاه…</div>,
})
const RagLab = dynamic(() => import('@/components/os/academy/ai-labs').then((m) => m.RagLab), {
  ssr: false,
  loading: () => <div className="grid h-32 place-items-center text-xs text-zinc-500">در حال بارگیری آزمایشگاه…</div>,
})

interface SectionDef {
  id: ViewId
  short: string
  title: string
  subtitle: string
  icon: LucideIcon
  tint: string
}

const SECTIONS: SectionDef[] = [
  { id: 'home', short: 'خانه', title: 'هوش مصنوعی چیست؟', subtitle: 'نقشهٔ کلی دنیای AI و داستان ۷۵ سالهٔ آن', icon: Brain, tint: ORANGE },
  { id: 'perceptron', short: 'پرسپترون', title: 'پرسپترون: نورون اول', subtitle: 'اولین نورون مصنوعی را با دست تنظیم کن', icon: Cpu, tint: VIOLET },
  { id: 'gradient', short: 'گرادیان', title: 'نزول گرادیان', subtitle: 'ماشین‌ها چطور یاد می‌گیرند؟ با توپ و شیب بازی کن', icon: TrendingDown, tint: TEAL },
  { id: 'activations', short: 'فعال‌سازها', title: 'توابع فعال‌ساز', subtitle: 'قلب تپندهٔ هر نورون در چهار طعم', icon: Activity, tint: PINK },
  { id: 'network', short: 'شبکه', title: 'شبکهٔ عصبی جلوی چشم', subtitle: 'سیگنال را در یک شبکهٔ واقعی ۳-۴-۲ رها کن', icon: GitBranch, tint: ORANGE },
  { id: 'llm', short: 'مدل زبانی', title: 'مدل زبانی چطور حرف می‌زند؟', subtitle: 'بایگرام، توکن و دما — مدل زبانی جیبی خودت', icon: MessageSquare, tint: VIOLET },
  { id: 'overfit', short: 'بیش‌برازش', title: 'بیش‌برازش (Overfitting)', subtitle: 'وقتی مدل حفظ می‌کند ولی یاد نمی‌گیرد', icon: AlertTriangle, tint: TEAL },
  { id: 'ethics', short: 'اخلاق', title: 'اخلاق و آینده', subtitle: 'قدرت بزرگ، مسئولیت بزرگ می‌آورد', icon: Scale, tint: PINK },
  { id: 'lab', short: 'آزمایشگاه آموزش', title: 'آزمایشگاه شبکه عصبی', subtitle: 'یک شبکه واقعی را در مرورگر تو آموزش بده — پس‌انتشار زنده', icon: Activity, tint: TEAL },
  { id: 'tokenizer', short: 'توکن‌ساز (BPE)', title: 'توکن‌ساز — زبانِ مدل‌ها', subtitle: 'متن چطور به توکن شکسته می‌شود؟ BPE زنده', icon: Scissors, tint: VIOLET },
  { id: 'attention', short: 'توجه (Attention)', title: 'خودتوجهی — قلب ترنسفورمر', subtitle: 'هر واژه به کدام واژه‌ها «نگاه» می‌کند؟', icon: Eye, tint: ORANGE },
  { id: 'rag', short: 'RAG', title: 'بازیابی‌افزوده (RAG)', subtitle: 'چطور مدلِ بدون حافظه، از اسناد شما جواب می‌دهد', icon: Search, tint: TEAL },
  { id: 'quiz', short: 'آزمون', title: 'آزمون نهایی', subtitle: '۸ سؤال؛ قبولی با ۶ یا بیشتر', icon: Trophy, tint: ORANGE },
]

/* ================================================================
   داده‌های ثابت
   ================================================================ */

const TIMELINE: { year: string; title: string; desc: string }[] = [
  { year: '۱۹۵۰', title: 'آزمون تورینگ', desc: 'آلن تورینگ می‌پرسد: «آیا ماشین‌ها می‌توانند فکر کنند؟»' },
  { year: '۱۹۵۶', title: 'کنفرانس دارتموث', desc: 'اصطلاح «هوش مصنوعی» برای اولین بار متولد می‌شود.' },
  { year: '۱۹۹۷', title: 'Deep Blue در برابر کاسپاروف', desc: 'برای اولین‌بار یک کامپیوتر قهرمان شطرنج جهان را شکست داد.' },
  { year: '۲۰۱۲', title: 'AlexNet و انقلاب بینایی ماشین', desc: 'شبکه‌های عمیق نشان دادند برای دیدن، لایه لازم است.' },
  { year: '۲۰۱۷', title: 'مقالهٔ Attention', desc: 'ترنسفورمر متولد شد؛ همان معماری که پشت ChatGPT است.' },
  { year: '۲۰۲۲', title: 'ChatGPT', desc: 'هوش مصنوعی از آزمایشگاه به میز همه رسید.' },
  { year: '۲۰۲۵', title: 'عامل‌های هوشمند', desc: 'مدل‌ها فقط حرف نمی‌زنند؛ ابزار به دست می‌گیرند و کار انجام می‌دهند.' },
]

/** نقاط پیش‌فرض دموی پرسپترون — دو کلاس جداپذیر خطی (مرز تقریبی: x + y = ۱۰) */
interface PercPt {
  x: number
  y: number
  label: 0 | 1
}
const PERCEPTRON_POINTS: PercPt[] = [
  { x: 1.5, y: 2.0, label: 0 },
  { x: 2.5, y: 4.0, label: 0 },
  { x: 4.0, y: 1.5, label: 0 },
  { x: 1.0, y: 6.0, label: 0 },
  { x: 3.0, y: 3.0, label: 0 },
  { x: 5.0, y: 2.5, label: 0 },
  { x: 2.0, y: 7.5, label: 0 },
  { x: 6.0, y: 3.0, label: 0 },
  { x: 7.0, y: 6.0, label: 1 },
  { x: 8.0, y: 4.5, label: 1 },
  { x: 6.5, y: 8.0, label: 1 },
  { x: 9.0, y: 7.0, label: 1 },
  { x: 7.5, y: 9.0, label: 1 },
  { x: 9.0, y: 5.0, label: 1 },
  { x: 5.5, y: 7.0, label: 1 },
]

/** تابع خطای دمو: دو گودی (کمینهٔ سراسری نزدیک ۲٫۵ و محلی نزدیک ۷٫۵) */
const LOSS = (w: number) => 0.05 * (w - 2.5) ** 2 * (w - 7.5) ** 2 + 0.1 * w
const DLOSS = (w: number) => 0.2 * (w - 2.5) * (w - 7.5) * (w - 5) + 0.1

type ActId = 'sigmoid' | 'relu' | 'tanh' | 'gelu'
interface ActDef {
  id: ActId
  label: string
  color: string
  formula: string
  f: (x: number) => number
  range: string
  use: string
  note: string
}
const ACTS: ActDef[] = [
  {
    id: 'sigmoid',
    label: 'سیگموید',
    color: ORANGE,
    formula: 'σ(x) = 1 / (1 + e^(-x))',
    f: (x) => 1 / (1 + Math.exp(-x)),
    range: 'بین ۰ و ۱',
    use: 'لایهٔ آخر، برای تبدیل امتیاز خام به احتمال (دسته‌بندی دوکلاسه)',
    note: 'در دم‌ها شیب تقریباً صفر است؛ در شبکه‌های عمیق باعث «محوشدن گرادیان» می‌شود.',
  },
  {
    id: 'relu',
    label: 'ReLU',
    color: TEAL,
    formula: 'f(x) = max(0, x)',
    f: (x) => Math.max(0, x),
    range: 'از ۰ تا بی‌نهایت',
    use: 'پیش‌فرض لایه‌های پنهان شبکه‌های عمیق؛ سریع، ساده و ارزان',
    note: 'اگر نورونی برای همهٔ ورودی‌ها خروجی صفر بدهد «می‌میرد»؛ نسخه‌هایی مثل Leaky ReLU برای همین آمدند.',
  },
  {
    id: 'tanh',
    label: 'tanh',
    color: VIOLET,
    formula: 'tanh(x) = (e^x − e^(-x)) / (e^x + e^(-x))',
    f: (x) => Math.tanh(x),
    range: 'بین −۱ و ۱',
    use: 'شبکه‌های بازگشتی (RNN) و وقتی خروجی صفر-محور می‌خواهیم',
    note: 'خروجی حول صفر متقارن است و معمولاً از سیگموید همگرایی بهتری می‌دهد؛ ولی باز هم محوشدن گرادیان دارد.',
  },
  {
    id: 'gelu',
    label: 'GELU',
    color: PINK,
    formula: 'GELU(x) ≈ 0.5x · (1 + tanh(√(2/π) · (x + 0.044715x³)))',
    f: (x) => 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x ** 3))),
    range: 'حدوداً از −۰٫۲ به بالا',
    use: 'انتخاب مدرن ترنسفورمرها: GPT و BERT از آن استفاده می‌کنند',
    note: 'نسخهٔ نرم و روان ReLU است؛ منحنی روان یعنی گرادیان روان‌تر و یادگیری پایدارتر.',
  },
]

/* ----- شبکهٔ عصبی ۳-۴-۲ با وزن‌های ثابت ----- */
const NET_X = [95, 280, 465]
const IN_Y = [70, 130, 190]
const HID_Y = [40, 100, 160, 220]
const OUT_Y = [95, 165]
const NET_INPUT: number[] = [0.9, 0.1, 0.6]
const W1: number[][] = [
  [1.2, -0.8, 0.5],
  [-0.6, 1.4, -0.3],
  [0.9, 0.4, 0.8],
  [-0.2, 1.1, 0.6],
]
const B1: number[] = [-0.1, 0.2, -0.3, 0]
const W2: number[][] = [
  [1.3, -0.9, 0.8, -0.2],
  [-0.7, 1.2, -0.5, 0.9],
]
const B2: number[] = [-0.37, 0.85]
const HID_VALS: number[] = W1.map((row, i) =>
  Math.tanh(row.reduce((s, w, j) => s + w * NET_INPUT[j], B1[i])),
)
const OUT_LOGITS: number[] = W2.map((row, i) =>
  row.reduce((s, w, j) => s + w * HID_VALS[j], B2[i]),
)
const OUT_SIG: number[] = OUT_LOGITS.map((z) => 1 / (1 + Math.exp(-z)))
const P_CAT = 1 / (1 + Math.exp(-(OUT_LOGITS[0] - OUT_LOGITS[1])))

/* ----- جملات آموزشی مدل بایگرام ----- */
const SENTENCES: string[] = [
  'هوش مصنوعی آیندهٔ فناوری است',
  'هوش مصنوعی دنیا را تغییر می‌دهد',
  'یادگیری ماشین زیرمجموعهٔ هوش مصنوعی است',
  'یادگیری عمیق انقلابی در یادگیری ماشین ساخت',
  'شبکه‌های عصبی از مغز انسان الهام گرفته‌اند',
  'پرسپترون ساده‌ترین مدل شبکه عصبی است',
  'برنامه‌نویسی با پایتون آسان است',
  'پایتون زبان محبوب برنامه‌نویسی است',
  'برنامه‌نویسی مهارت حل مسئله است',
  'لینوکس بهترین سیستم‌عامل برای برنامه‌نویسی است',
  'لینوکس رایگان و متن‌باز است',
  'ترمینال لینوکس ابزار قدرتمند برای توسعه‌دهندگان است',
  'داده سوخت اصلی هوش مصنوعی است',
  'داده تمیز مهم‌ترین بخش هر پروژه است',
  'مدل زبانی متن را توکن به توکن می‌سازد',
  'مدل زبانی کلمه بعدی را پیش‌بینی می‌کند',
  'ترنسفورمر قلب مدل‌های زبانی مدرن است',
  'ترنسفورمر با مکانیزم توجه کار می‌کند',
  'نزول گرادیان وزن‌ها را قدم‌به‌قدم بهتر می‌کند',
  'نرخ یادگیری بالا باعث ناپایداری می‌شود',
  'بیش‌برازش یعنی مدل داده را حفظ کرده است',
  'تمرین زیاد کلید یادگیری است',
  'اخلاق در هوش مصنوعی اهمیت زیادی دارد',
  'آینده فناوری به دست نسل ماست',
  'مغز انسان پیچیده‌ترین سیستم جهان است',
]

const normWord = (w: string) =>
  w
    .trim()
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[.،!؟«»():;]/g, '')

interface BigramModel {
  starts: string[]
  next: Map<string, Map<string, number>>
}

/** ساخت مدل بایگرام در بارگذاری ماژول */
const BIGRAM: BigramModel = (() => {
  const starts: string[] = []
  const next = new Map<string, Map<string, number>>()
  for (const s of SENTENCES) {
    const words = s
      .split(/\s+/)
      .map(normWord)
      .filter(Boolean)
    if (words.length === 0) continue
    starts.push(words[0])
    for (let i = 0; i < words.length - 1; i++) {
      const cur = words[i]
      const nxt = words[i + 1]
      let m = next.get(cur)
      if (!m) {
        m = new Map()
        next.set(cur, m)
      }
      m.set(nxt, (m.get(nxt) ?? 0) + 1)
    }
  }
  return { starts, next }
})()

/** نقاط دموی بیش‌برازش: سهمی نویزی؛ ۱۰ نقطهٔ آموزش + ۴ نقطهٔ اعتبارسنجی */
interface OPt {
  x: number
  y: number
  val: boolean
}
const OVERFIT_POINTS: OPt[] = [
  { x: 0.6, y: 8.9, val: false },
  { x: 1.3, y: 7.2, val: true },
  { x: 1.8, y: 6.3, val: false },
  { x: 2.1, y: 5.6, val: false },
  { x: 2.9, y: 4.4, val: false },
  { x: 3.7, y: 3.0, val: true },
  { x: 4.6, y: 2.6, val: false },
  { x: 5.4, y: 2.1, val: false },
  { x: 6.2, y: 2.9, val: true },
  { x: 6.7, y: 3.2, val: false },
  { x: 7.0, y: 3.8, val: false },
  { x: 7.8, y: 5.1, val: false },
  { x: 8.6, y: 6.6, val: true },
  { x: 9.3, y: 8.4, val: false },
]
const TRUE_F = (x: number) => 0.32 * (x - 5) ** 2 + 1.5

/* ----- آزمون ----- */
interface QuizQ {
  q: string
  options: string[]
  answer: number
  why: string
}
const QUIZ: QuizQ[] = [
  {
    q: 'پرسپترون دقیقاً چیست؟',
    options: [
      'یک الگوریتم مرتب‌سازی داده',
      'ساده‌ترین نوع شبکهٔ عصبی؛ یک نورون با وزن‌ها و تابع گامی',
      'نوعی پایگاه داده برای ذخیرهٔ تصاویر',
      'زبان برنامه‌نویسی مخصوص هوش مصنوعی',
    ],
    answer: 1,
    why: 'پرسپترون ورودی‌ها را در وزن‌ها ضرب می‌کند، جمع می‌زند و از تابع گام رد می‌کند؛ همین! همهٔ شبکه‌های بزرگ از همین آجر ساده ساخته شده‌اند.',
  },
  {
    q: 'چرا نزول گرادیان «پایین» می‌رود، نه بالا؟',
    options: [
      'چون گرادیان جهت تندترین «افزایش» خطاست و ما خلاف آن حرکت می‌کنیم',
      'چون وزن‌ها همیشه منفی‌اند',
      'چون داده‌ها سنگین‌اند',
      'به دلایل تاریخی؛ کاملاً اتفاقی است',
    ],
    answer: 0,
    why: 'گرادیان همیشه به سمت بیشترین شیبِ بالا رفتن خطا اشاره می‌کند؛ پس برای کم‌کردن خطا باید در جهت منفی آن قدم برداریم.',
  },
  {
    q: 'خروجی ReLU برای ورودی −۳ چیست؟',
    options: ['−۳', '۰', '۳', '۱'],
    answer: 1,
    why: 'ReLU یعنی max(0, x)؛ هر عدد منفی می‌شود صفر و مثبت‌ها دست‌نخورده رد می‌شوند.',
  },
  {
    q: 'کدام گزینه نشانهٔ بارز بیش‌برازش است؟',
    options: [
      'خطای آموزش بالا و خطای آزمون پایین',
      'خطای آموزش و آزمون هر دو بالا',
      'خطای آموزش خیلی کم، ولی افت شدید روی دادهٔ جدید',
      'مدل اصلاً آموزش نمی‌بیند',
    ],
    answer: 2,
    why: 'مدل نویز دادهٔ آموزش را هم حفظ کرده؛ روی دادهٔ دیده‌شده عالی و روی دادهٔ تازه فاجعه است.',
  },
  {
    q: 'دمای (Temperature) بالا در تولید متن چه می‌کند؟',
    options: [
      'مدل را سریع‌تر می‌کند',
      'انتخاب کلمهٔ بعدی تصادفی‌تر و خلاقانه‌تر (و پرخطاتر) می‌شود',
      'متن کوتاه‌تر می‌شود',
      'خروجی را کاملاً قطعی می‌کند',
    ],
    answer: 1,
    why: 'دمای بالا توزیع احتمال را پُر می‌کند و کلمه‌های کم‌احتمال هم شانس می‌گیرند؛ دمای پایین فقط محتمل‌ترین‌ها را انتخاب می‌کند.',
  },
  {
    q: 'محدودیت اصلی مدل بایگرام چیست؟',
    options: [
      'فقط با زبان فارسی کار می‌کند',
      'فقط یک کلمهٔ قبلی را می‌بیند و زمینهٔ طولانی ندارد',
      'خیلی گران است',
      'نمی‌تواند عدد تولید کند',
    ],
    answer: 1,
    why: 'بایگرام حافظه‌اش فقط یک کلمه است؛ مدل‌های مدرن با مکانیزم توجه (Attention) صدها هزار توکن را همزمان می‌بینند.',
  },
  {
    q: 'رابطهٔ درست بین این سه مفهوم کدام است؟',
    options: [
      'یادگیری ماشین زیرمجموعهٔ یادگیری عمیق است',
      'یادگیری عمیق زیرمجموعهٔ یادگیری ماشین و آن هم زیرمجموعهٔ هوش مصنوعی است',
      'این سه دقیقاً یکی هستند',
      'هوش مصنوعی زیرمجموعهٔ رباتیک است',
    ],
    answer: 1,
    why: 'هوش مصنوعی ⊃ یادگیری ماشین ⊃ یادگیری عمیق؛ یادگیری عمیق فقط روش‌های شبکه‌عصبیِ چندلایه را در بر می‌گیرد.',
  },
  {
    q: 'توهم‌زایی (Hallucination) مدل زبانی یعنی چه؟',
    options: [
      'مدل تصویر تولید می‌کند',
      'مدل متن نادرست اما با اعتمادبه‌نفس کامل تولید می‌کند',
      'مدل رمز عبور را لو می‌دهد',
      'مدل بیش از حد آموزش می‌بیند',
    ],
    answer: 1,
    why: 'مدل زبانی «محتمل‌ترین ادامه» را می‌سازد، نه «درست‌ترین» را؛ برای همین خروجی‌اش باید همیشه راستی‌آزمایی شود.',
  },
]

const QUIZ_LETTERS = ['الف', 'ب', 'پ', 'ت']

const ETHICS_CARDS: { icon: LucideIcon; tint: string; title: string; lines: string[] }[] = [
  {
    icon: Users,
    tint: ORANGE,
    title: 'سوگیری داده',
    lines: [
      'اگر داده‌ها یک‌جانبه باشند، مدل هم یک‌جانبه قضاوت می‌کند.',
      'مدل آینهٔ داده است، نه عدالت؛ همیشه بپرس: داده از کجا آمده؟',
      'سوگیری در استخدام، وام و پزشکی می‌تواند زندگی واقعی انسان‌ها را بِبرد.',
    ],
  },
  {
    icon: Lock,
    tint: TEAL,
    title: 'حریم خصوصی',
    lines: [
      'مدل‌ها روی داده‌های شخصی آموزش می‌بینند؛ آیا اجازهٔ استفاده وجود داشت؟',
      'گفتگو با چت‌بات‌ها را مثل گفتگو در یک اتاق شلوغ فرض کن.',
      'دادهٔ حساس را وارد مدل‌های عمومی نکن — هرگز.',
    ],
  },
  {
    icon: Video,
    tint: VIOLET,
    title: 'دیپ‌فیک',
    lines: [
      'ساخت چهره و صدای جعلی دیگر گران نیست؛ اعتماد گران شده است.',
      'قبل از بازنشر، منبع را بررسی کن؛ چشم و گوشِ خودت باش.',
      'واترمارک و امضای دیجیتال، سپرهای اول این جنگ‌اند.',
    ],
  },
  {
    icon: Ghost,
    tint: PINK,
    title: 'توهم‌زایی مدل‌ها',
    lines: [
      'مدل ممکن است با اعتمادبه‌نفس کامل، چرت و پرت بگوید.',
      'محتمل بودن با درست بودن فرق دارد؛ مدل «احتمال» می‌سازد نه «حقیقت».',
      'همیشه خروجی را با منبع معتبر راستی‌آزمایی کن.',
    ],
  },
  {
    icon: Briefcase,
    tint: ORANGE,
    title: 'آیندهٔ شغل‌ها',
    lines: [
      'AI معمولاً شغل را حذف نمی‌کند؛ ماهیتش را عوض می‌کند.',
      'ابزار جدید، شغل‌های جدید می‌سازد — برای کسانی که یاد می‌گیرند.',
      'یادگیری مداوم بهترین بیمهٔ بیکاری است.',
    ],
  },
  {
    icon: Copyright,
    tint: TEAL,
    title: 'کپی‌رایت و خلق آثار',
    lines: [
      'آیا آموزش مدل روی آثار هنرمندان بدون اجازه منصف است؟ بحث داغ امروز.',
      'خروجی مدل را اثر خودت جا نزن؛ منبع و ابزار را شفاف بگو.',
      'احترام به خالقان، پایهٔ اقتصاد خلاقیت است.',
    ],
  },
]

const PLEDGE: string[] = [
  'قبل از انتشار، خروجی هوش مصنوعی را راستی‌آزمایی می‌کنم.',
  'دادهٔ شخصی افراد را بدون اجازه وارد مدل‌ها نمی‌کنم.',
  'وقتی نمی‌دانم، نمی‌گویم «مطمئنم».',
  'به سوگیری‌های احتمالی مدل حساسم و آن را گزارش می‌کنم.',
  'از فناوری برای کمک به انسان‌ها استفاده می‌کنم، نه فریب آن‌ها.',
]

/* ================================================================
   کمکی‌های ریاضی (بدون وابستگی)
   ================================================================ */

/** آماده‌سازی بوم برای کشیدگی crisp با DPR */
function prepareCanvas(canvas: HTMLCanvasElement | null, w: number, h: number): CanvasRenderingContext2D | null {
  if (!canvas) return null
  const dpr = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1
  canvas.width = Math.round(w * dpr)
  canvas.height = Math.round(h * dpr)
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, w, h)
  return ctx
}

/** برش چندضلعی با نیم‌صفحهٔ f(x,y) > 0 (برای سایه‌گذاری سمت مثبت خط جداکننده) */
function clipHalfPlane(poly: [number, number][], f: (x: number, y: number) => number): [number, number][] {
  const out: [number, number][] = []
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]
    const b = poly[(i + 1) % poly.length]
    const fa = f(a[0], a[1])
    const fb = f(b[0], b[1])
    const inA = fa > 0
    const inB = fb > 0
    if (inA) out.push(a)
    if (inA !== inB) {
      const denom = fa - fb
      const t = denom === 0 ? 0.5 : fa / denom
      out.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])])
    }
  }
  return out
}

/** حل دستگاه خطی با حذف گاوس + چرخش جزئی؛ null یعنی تکین */
function solveLinearSystem(A: number[][], bVec: number[]): number[] | null {
  const n = bVec.length
  const M: number[][] = A.map((row, i) => [...row, bVec[i]])
  for (let col = 0; col < n; col++) {
    let piv = col
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(M[r][col]) > Math.abs(M[piv][col])) piv = r
    }
    if (Math.abs(M[piv][col]) < 1e-10) return null
    const tmp = M[col]
    M[col] = M[piv]
    M[piv] = tmp
    for (let r = col + 1; r < n; r++) {
      const factor = M[r][col] / M[col][col]
      if (factor === 0) continue
      for (let c = col; c <= n; c++) M[r][c] -= factor * M[col][c]
    }
  }
  const x = new Array<number>(n).fill(0)
  for (let r = n - 1; r >= 0; r--) {
    let s = M[r][n]
    for (let c = r + 1; c < n; c++) s -= M[r][c] * x[c]
    x[r] = s / M[r][r]
    if (!Number.isFinite(x[r])) return null
  }
  return x
}

/** برازش چندجمله‌ای کمینه-مربعات با پُل کم‌رidge λ=1e-6 روی معادلات نرمال */
function polyFit(pts: OPt[], degree: number): number[] | null {
  const n = degree + 1
  const A: number[][] = Array.from({ length: n }, () => new Array<number>(n).fill(0))
  const bVec = new Array<number>(n).fill(0)
  for (const p of pts) {
    const powers: number[] = [1]
    for (let k = 1; k <= degree; k++) powers.push(powers[k - 1] * p.x)
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) A[i][j] += powers[i] * powers[j]
      bVec[i] += powers[i] * p.y
    }
  }
  for (let i = 0; i < n; i++) A[i][i] += 1e-6
  return solveLinearSystem(A, bVec)
}

/** ارزیابی چندجمله‌ای با الگوریتم هورنر */
function evalPoly(coef: number[] | null, x: number): number {
  if (!coef) return NaN
  let s = 0
  for (let i = coef.length - 1; i >= 0; i--) s = s * x + coef[i]
  return s
}

function mseOf(coef: number[] | null, pts: OPt[]): number {
  if (!coef || pts.length === 0) return NaN
  let s = 0
  for (const p of pts) {
    const d = evalPoly(coef, p.x) - p.y
    s += d * d
  }
  return s / pts.length
}

/* ================================================================
   اجزای کوچک رابط
   ================================================================ */

function SectionCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-white/10 bg-zinc-900/60 p-3 ${className}`}>{children}</div>
}

function CardTitle({ children }: { children: ReactNode }) {
  return <h3 className="mb-2 text-[12.5px] font-black text-zinc-100">{children}</h3>
}

function Code({ children }: { children: ReactNode }) {
  return (
    <code
      dir="ltr"
      className="inline-block rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 font-mono text-[11.5px] leading-5 text-teal-300"
    >
      {children}
    </code>
  )
}

function Tip({ children, tone = 'amber' }: { children: ReactNode; tone?: 'amber' | 'violet' | 'teal' }) {
  const styles =
    tone === 'violet'
      ? 'border-violet-500/30 bg-violet-500/10 text-violet-200'
      : tone === 'teal'
        ? 'border-teal-500/30 bg-teal-500/10 text-teal-200'
        : 'border-amber-500/30 bg-amber-500/10 text-amber-200'
  return (
    <div className={`flex items-start gap-2 rounded-xl border p-2.5 text-[11px] leading-5 ${styles}`}>
      <Lightbulb size={14} className="mt-0.5 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}

function Stat({ value, label }: { value: ReactNode; label: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-3 text-center">
      <div className="text-lg font-black text-white">{value}</div>
      <div className="mt-1 text-[9.5px] leading-4 text-zinc-400">{label}</div>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/25 px-2 py-1.5 text-center">
      <div className="text-[9px] text-zinc-500">{label}</div>
      <div className="mt-0.5 text-[12px] font-black text-zinc-100">{value}</div>
    </div>
  )
}

function CountUp({ to, duration = 1.1 }: { to: number; duration?: number }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let raf = 0
    const t0 = performance.now()
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / (duration * 1000))
      setVal(Math.round(to * (1 - (1 - p) ** 3)))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [to, duration])
  return <span className="font-mono">{fa(val)}</span>
}

function CanvasBox({
  canvasRef,
  height,
  label,
}: {
  canvasRef: RefObject<HTMLCanvasElement | null>
  height: number
  label: string
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-black/40">
      <canvas
        ref={canvasRef}
        width={600}
        height={height}
        style={{ width: '100%', height: `${height}px` }}
        role="img"
        aria-label={label}
      />
    </div>
  )
}

function ChapterShell({
  def,
  done,
  onToggleDone,
  children,
}: {
  def: SectionDef
  done: boolean
  onToggleDone: () => void
  children: ReactNode
}) {
  const Icon = def.icon
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
          style={{ background: `${def.tint}22`, color: def.tint }}
        >
          <Icon size={19} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-black text-zinc-50">{def.title}</h2>
          <p className="text-[11px] text-zinc-400">{def.subtitle}</p>
        </div>
        <Button
          size="sm"
          variant={done ? 'secondary' : 'outline'}
          onClick={onToggleDone}
          aria-pressed={done}
          aria-label={done ? `برداشتن علامت «خواندم» از ${def.title}` : `علامت‌گذاری ${def.title} به‌عنوان خوانده‌شده`}
          className={`shrink-0 text-[11px] ${done ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300' : 'border-white/15 text-zinc-300'}`}
        >
          <Check size={13} aria-hidden />
          {done ? 'خوانده شد' : 'خواندم!'}
        </Button>
      </div>
      {children}
    </div>
  )
}

/* ================================================================
   بخش ۱ — هوش مصنوعی چیست؟
   ================================================================ */

function HomeSection({ onNavigate }: { onNavigate: (v: ViewId) => void }) {
  return (
    <div className="space-y-4">
      {/* قهرمان */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-l from-orange-500/15 via-zinc-900/60 to-violet-500/15 p-4">
        <div className="flex items-center gap-2">
          <Sparkles size={15} style={{ color: ORANGE }} aria-hidden />
          <p className="text-sm font-black text-white sm:text-base">به آکادمی هوش مصنوعی خوش آمدی!</p>
        </div>
        <p className="mt-2 text-[11.5px] leading-6 text-zinc-300">
          هوش مصنوعی یعنی ساختن ماشین‌هایی که کارهایی را انجام دهند که معمولاً به هوش انسانی نیاز دارد:
          دیدن، شنیدن، حرف زدن، تصمیم‌گرفتن و یادگرفتن. اینجا به‌جای حفظ‌کردن تعریف‌ها، با دست و چشم
          مفاهیم را لمس می‌کنی: وزن‌های یک نورون را تنظیم می‌کنی، یک توپ را روی شیب خطا می‌غلتانی،
          سیگنال را در شبکهٔ عصبی رها می‌کنی و به یک مدل زبانی جیبی کلمه می‌دهی.
        </p>
        <p className="mt-2 text-[10.5px] text-zinc-500">
          هر بخش یک «خواندم!» دارد؛ نه بخش را بخوان، نه آزمون آخر را جا بینداز.
        </p>
      </div>

      {/* نمودار مجموعه‌های تودرتو */}
      <SectionCard>
        <CardTitle>سه دایرهٔ تودرتو: AI ⊃ ML ⊃ DL</CardTitle>
        <div className="space-y-2">
          <motion.div
            initial={{ scale: 0.75, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.35, delay: 0.05, ease: 'easeOut' }}
            className="rounded-2xl border-2 p-3"
            style={{ borderColor: `${ORANGE}66`, background: `${ORANGE}12` }}
          >
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-[12.5px] font-black" style={{ color: ORANGE }}>
                هوش مصنوعی (AI)
              </span>
              <span className="text-[10px] text-zinc-400">
                هر ترفندی که به ماشین رفتار هوشمندانه بدهد — از قواعد دستی تا یادگیری
              </span>
            </div>
            <motion.div
              initial={{ scale: 0.75, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.35, delay: 0.22, ease: 'easeOut' }}
              className="mt-2.5 rounded-xl border-2 p-3"
              style={{ borderColor: `${VIOLET}66`, background: `${VIOLET}12` }}
            >
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-[12px] font-black" style={{ color: VIOLET }}>
                  یادگیری ماشین (ML)
                </span>
                <span className="text-[10px] text-zinc-400">
                  به‌جای قاعده‌نویسی، الگوها را از داده یاد می‌گیرد
                </span>
              </div>
              <motion.div
                initial={{ scale: 0.75, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.35, delay: 0.4, ease: 'easeOut' }}
                className="mt-2.5 rounded-lg border-2 p-2.5"
                style={{ borderColor: `${TEAL}66`, background: `${TEAL}14` }}
              >
                <span className="text-[11.5px] font-black" style={{ color: TEAL }}>
                  یادگیری عمیق (DL)
                </span>
                <p className="mt-0.5 text-[10px] text-zinc-400">
                  شبکه‌های عصبی چندلایه؛ موتور اصلی انقلاب امروز
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
        <Tip>
          هر یادگیری عمیقی یک یادگیری ماشین است و هر یادگیری ماشینی یک هوش مصنوعی؛ اما برعکسش برقرار نیست.
          قهوه‌سازِ برنامه‌ریزی‌شدهٔ قدیمی AI است ولی ML نیست!
        </Tip>
      </SectionCard>

      {/* خط زمان */}
      <SectionCard>
        <CardTitle>
          <span className="flex items-center gap-1.5">
            <BookOpen size={13} style={{ color: VIOLET }} aria-hidden />
            ۷۵ سال در یک نگاه
          </span>
        </CardTitle>
        <div className="relative space-y-3 pr-5">
          <span className="absolute bottom-2 right-[7px] top-2 w-px bg-white/10" aria-hidden />
          {TIMELINE.map((t, i) => (
            <motion.div
              key={t.year}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.08 * i }}
              className="relative"
            >
              <span
                className="absolute -right-5 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-zinc-950"
                style={{ background: i % 3 === 0 ? ORANGE : i % 3 === 1 ? VIOLET : TEAL }}
                aria-hidden
              />
              <div className="flex flex-wrap items-baseline gap-2">
                <span dir="ltr" className="font-mono text-[11px] font-black text-zinc-300">
                  {t.year}
                </span>
                <span className="text-[11.5px] font-bold text-zinc-100">{t.title}</span>
              </div>
              <p className="text-[10.5px] leading-5 text-zinc-400">{t.desc}</p>
            </motion.div>
          ))}
        </div>
      </SectionCard>

      {/* آمار */}
      <div className="grid grid-cols-3 gap-2">
        <Stat value={<CountUp to={70} />} label={<span>سال قدمت ایدهٔ «ماشین متفکر»</span>} />
        <Stat
          value={
            <span dir="ltr" className="font-mono">
              ۱۰<sup className="text-[10px]" style={{ color: ORANGE }}><CountUp to={12} /></sup>
            </span>
          }
          label="پارامتر در بزرگ‌ترین مدل‌های زبانی"
        />
        <Stat value={<CountUp to={SECTIONS.length} />} label="بخش تعاملی در همین اپ" />
      </div>

      {/* میان‌برها */}
      <SectionCard>
        <CardTitle>آزمایش‌های تعاملی این دوره</CardTitle>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {SECTIONS.slice(1, 8).map((s) => {
            const Icon = s.icon
            return (
              <button
                key={s.id}
                onClick={() => onNavigate(s.id)}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/25 p-2.5 text-right transition hover:border-white/25 hover:bg-white/5"
                aria-label={`رفتن به بخش ${s.title}`}
              >
                <span
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-lg"
                  style={{ background: `${s.tint}22`, color: s.tint }}
                >
                  <Icon size={14} aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[11.5px] font-bold text-zinc-100">{s.title}</span>
                  <span className="block truncate text-[9.5px] text-zinc-500">{s.subtitle}</span>
                </span>
                <ChevronLeft size={14} className="shrink-0 text-zinc-500" aria-hidden />
              </button>
            )
          })}
        </div>
      </SectionCard>

      <p className="pt-1 text-center text-[10px] text-zinc-500">با اسپانسری سان‌جاب</p>
    </div>
  )
}

/* ================================================================
   بخش ۲ — پرسپترون
   ================================================================ */

const PERC_W = 600
const PERC_H = 300
const PERC_PAD = { l: 30, r: 14, t: 14, b: 24 }
const percPx = (x: number) => PERC_PAD.l + (x / 10) * (PERC_W - PERC_PAD.l - PERC_PAD.r)
const percPy = (y: number) => PERC_H - PERC_PAD.b - (y / 10) * (PERC_H - PERC_PAD.t - PERC_PAD.b)

function PerceptronSection() {
  const pushToast = useOS((s) => s.pushToast)
  const [w1, setW1] = useState(0.4)
  const [w2, setW2] = useState(0.4)
  const [b, setB] = useState(-1)
  const [sigmoid, setSigmoid] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const net = useCallback((x: number, y: number) => w1 * x + w2 * y + b, [w1, w2, b])
  const correct = PERCEPTRON_POINTS.filter((p) => (net(p.x, p.y) > 0 ? 1 : 0) === p.label).length
  const acc = Math.round((correct / PERCEPTRON_POINTS.length) * 100)

  useEffect(() => {
    const ctx = prepareCanvas(canvasRef.current, PERC_W, PERC_H)
    if (!ctx) return

    // شبکهٔ پس‌زمینه
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'
    ctx.lineWidth = 1
    for (let g = 0; g <= 10; g += 2) {
      ctx.beginPath()
      ctx.moveTo(percPx(g), percPy(0))
      ctx.lineTo(percPx(g), percPy(10))
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(percPx(0), percPy(g))
      ctx.lineTo(percPx(10), percPy(g))
      ctx.stroke()
    }

    // سایه‌گذاری سمت مثبت
    const rect: [number, number][] = [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
    ]
    const poly = clipHalfPlane(rect, (x, y) => net(x, y))
    if (poly.length >= 3) {
      ctx.beginPath()
      poly.forEach(([x, y], i) => {
        if (i === 0) ctx.moveTo(percPx(x), percPy(y))
        else ctx.lineTo(percPx(x), percPy(y))
      })
      ctx.closePath()
      ctx.fillStyle = 'rgba(139,92,246,0.10)'
      ctx.fill()
    }

    // خط جداکننده w1·x + w2·y + b = 0
    const norm = Math.hypot(w1, w2)
    if (norm > 1e-6) {
      const cand: [number, number][] = []
      if (Math.abs(w1) > 1e-9) {
        const x0 = -b / w1
        const x10 = -(w2 * 10 + b) / w1
        if (x0 >= -0.01 && x0 <= 10.01) cand.push([x0, 0])
        if (x10 >= -0.01 && x10 <= 10.01) cand.push([x10, 10])
      }
      if (Math.abs(w2) > 1e-9) {
        const y0 = -b / w2
        const y10 = -(w1 * 10 + b) / w2
        if (y0 >= -0.01 && y0 <= 10.01) cand.push([0, y0])
        if (y10 >= -0.01 && y10 <= 10.01) cand.push([10, y10])
      }
      const uniq = cand.filter(
        (c, i) => cand.findIndex((d) => Math.hypot(d[0] - c[0], d[1] - c[1]) < 0.05) === i,
      )
      if (uniq.length >= 2) {
        ctx.strokeStyle = ORANGE
        ctx.lineWidth = 2.2
        ctx.beginPath()
        ctx.moveTo(percPx(uniq[0][0]), percPy(uniq[0][1]))
        ctx.lineTo(percPx(uniq[1][0]), percPy(uniq[1][1]))
        ctx.stroke()
      }
    }

    // نقاط داده
    for (const p of PERCEPTRON_POINTS) {
      const u = net(p.x, p.y)
      const pred = u > 0 ? 1 : 0
      const mis = pred !== p.label
      const sig = 1 / (1 + Math.exp(-u))
      ctx.globalAlpha = sigmoid ? clamp(sig, 0.12, 1) : 1
      ctx.fillStyle = p.label === 1 ? VIOLET : ORANGE
      ctx.beginPath()
      ctx.arc(percPx(p.x), percPy(p.y), 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
      ctx.strokeStyle = 'rgba(255,255,255,0.55)'
      ctx.lineWidth = 1
      ctx.stroke()
      if (mis) {
        ctx.setLineDash([3, 3])
        ctx.strokeStyle = ROSE
        ctx.lineWidth = 1.4
        ctx.beginPath()
        ctx.arc(percPx(p.x), percPy(p.y), 8.5, 0, Math.PI * 2)
        ctx.stroke()
        ctx.setLineDash([])
      }
    }

    // برچسب محورها
    ctx.fillStyle = 'rgba(161,161,170,0.9)'
    ctx.font = '10px monospace'
    ctx.fillText('x', PERC_W - 12, PERC_H - 8)
    ctx.fillText('y', 8, 12)
  }, [w1, w2, b, sigmoid, net])

  const learnStep = () => {
    const wrong = PERCEPTRON_POINTS.filter((p) => (net(p.x, p.y) > 0 ? 1 : 0) !== p.label)
    if (wrong.length === 0) {
      pushToast({
        title: 'پرسپترون همگرا شد!',
        body: 'هیچ نقطه‌ای اشتباه طبقه‌بندی نمی‌شود؛ خطا صفر است. با اسپانسری سان‌جاب',
        icon: CheckCircle2,
      })
      return
    }
    const p = wrong[Math.floor(Math.random() * wrong.length)]
    const t = p.label === 1 ? 1 : -1
    const lr = 0.5
    setW1((v) => +clamp(v + lr * t * p.x, -5, 5).toFixed(2))
    setW2((v) => +clamp(v + lr * t * p.y, -5, 5).toFixed(2))
    setB((v) => +clamp(v + lr * t, -5, 5).toFixed(2))
  }

  const reset = () => {
    setW1(0.4)
    setW2(0.4)
    setB(-1)
  }

  return (
    <div className="space-y-4">
      <SectionCard>
        <CardTitle>آزمایشگاه نورون</CardTitle>
        <CanvasBox canvasRef={canvasRef} height={PERC_H} label="نمودار پراکنش دو کلاس و خط جداکنندهٔ پرسپترون" />
        <div className="mt-2 flex flex-wrap gap-3 text-[9.5px] text-zinc-400">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: ORANGE }} aria-hidden /> کلاس ۰
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: VIOLET }} aria-hidden /> کلاس ۱
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-full border border-dashed" style={{ borderColor: ROSE }} aria-hidden /> طبقه‌بندی اشتباه
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-0.5 w-4" style={{ background: ORANGE }} aria-hidden /> خط جداکننده
          </span>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <motion.div
            key={acc}
            initial={{ scale: 0.92, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            className="shrink-0 text-center"
          >
            <div
              className="text-3xl font-black leading-none"
              style={{ color: acc === 100 ? '#34d399' : ORANGE }}
            >
              {fa(acc)}٪
            </div>
            <div className="mt-1 text-[9px] text-zinc-500">
              دقت — {fa(correct)} از {fa(PERCEPTRON_POINTS.length)} نقطه
            </div>
          </motion.div>
          <div className="min-w-0 flex-1 space-y-2">
            <div>
              <div className="mb-1 flex justify-between text-[10px] text-zinc-400">
                <span>وزن w₁ (توجه به x)</span>
                <span dir="ltr" className="font-mono text-zinc-200">{fa(+w1.toFixed(1))}</span>
              </div>
              <Slider value={[w1]} min={-5} max={5} step={0.1} onValueChange={(v) => setW1(v[0])} aria-label="وزن اول" />
            </div>
            <div>
              <div className="mb-1 flex justify-between text-[10px] text-zinc-400">
                <span>وزن w₂ (توجه به y)</span>
                <span dir="ltr" className="font-mono text-zinc-200">{fa(+w2.toFixed(1))}</span>
              </div>
              <Slider value={[w2]} min={-5} max={5} step={0.1} onValueChange={(v) => setW2(v[0])} aria-label="وزن دوم" />
            </div>
            <div>
              <div className="mb-1 flex justify-between text-[10px] text-zinc-400">
                <span>بایاس b</span>
                <span dir="ltr" className="font-mono text-zinc-200">{fa(+b.toFixed(1))}</span>
              </div>
              <Slider value={[b]} min={-5} max={5} step={0.1} onValueChange={(v) => setB(v[0])} aria-label="بایاس" />
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={learnStep} className="text-[11px]" aria-label="اجرای یک قدم یادگیری پرسپترون">
            <Zap size={13} aria-hidden />
            آموزش خودکار (۱ قدم پرسپترون)
          </Button>
          <Button size="sm" variant="outline" onClick={reset} className="text-[11px] border-white/15 text-zinc-300" aria-label="بازنشانی وزن‌ها">
            <RotateCcw size={13} aria-hidden />
            بازنشانی
          </Button>
          <div className="ms-auto flex items-center gap-2 text-[10.5px] text-zinc-300">
            <span className={sigmoid ? 'text-zinc-500' : 'font-bold text-zinc-100'}>گام</span>
            <Switch checked={sigmoid} onCheckedChange={(v) => setSigmoid(v)} aria-label="تغییر تابع فعال‌ساز بین گام و سیگموید" />
            <span className={sigmoid ? 'font-bold text-zinc-100' : 'text-zinc-500'}>سیگموید</span>
          </div>
        </div>
        {sigmoid && (
          <p className="mt-2 text-[10px] leading-5 text-zinc-400">
            حالت سیگموید: شفافیت هر نقطه برابر خروجی نورون برای آن نقطه است — هرچه دورتر از خط، مطمئن‌تر.
          </p>
        )}
      </SectionCard>

      <SectionCard>
        <CardTitle>پرسپترون چه می‌گوید؟</CardTitle>
        <div className="space-y-2 text-[11.5px] leading-6 text-zinc-300">
          <p>
            پرسپترون سال ۱۹۵۸ توسط فرانک روزنبلات ساخته شد؛ ساده‌ترین شبکهٔ عصبی ممکن: ورودی‌ها را در
            وزن‌ها ضرب می‌کند، جمع می‌زند و از یک تابع فعال‌ساز رد می‌کند تا تصمیم بگیرد ۰ یا ۱.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Code>u = w1·x1 + w2·x2 + b</Code>
            <span className="text-zinc-500">→</span>
            <Code>ŷ = step(u)</Code>
          </div>
          <p>
            وزن‌ها یعنی «چقدر به این ورودی توجه کنم؟» و بایاس یعنی «در مجموع چقدر سخت‌گیر باشم؟».
            خط جداکنندهٔ روی نمودار دقیقاً همین سه عدد است — اسلایدرها را بکش و ببین خط چطور می‌چرخد و جابه‌جا می‌شود.
          </p>
          <p>
            یادگیری یعنی: اگر نقطه‌ای اشتباه طبقه‌بندی شد، وزن‌ها را کمی به سمتی بکش که جواب درست شود.
            دکمهٔ «آموزش خودکار» همین قانون را با نرخ یادگیری ۰٫۵ روی یک نقطهٔ اشتباه تصادفی اجرا می‌کند:
          </p>
          <Code>w ← w + η · t · x    (t ∈ {`{−1, +1}`})</Code>
        </div>
        <div className="mt-3">
          <Tip tone="violet">
            محدودیت بزرگ پرسپترون: فقط می‌تواند با «یک خط» جدا کند. مسئلهٔ XOR همان چیزی بود که اولین
            «زمستان هوش مصنوعی» را رقم زد. راه‌حل؟ چند لایه نورون — یعنی همان یادگیری عمیق.
          </Tip>
        </div>
      </SectionCard>
    </div>
  )
}

/* ================================================================
   بخش ۳ — نزول گرادیان
   ================================================================ */

const GR_W = 600
const GR_H = 300
const GR_PAD = { l: 34, r: 16, t: 16, b: 26 }
const grPx = (w: number) => GR_PAD.l + (w / 10) * (GR_W - GR_PAD.l - GR_PAD.r)
const grPy = (v: number) => GR_H - GR_PAD.b - (v / 19) * (GR_H - GR_PAD.t - GR_PAD.b)

function GradientSection() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef(0)
  const wRef = useRef(3.2)
  const stepsRef = useRef(0)
  const trailRef = useRef<number[]>([])
  const lrRef = useRef(0.3)
  const [lr, setLr] = useState(0.3)
  const [running, setRunning] = useState(false)
  const [display, setDisplay] = useState({ w: 3.2, steps: 0, converged: false })

  useEffect(() => {
    lrRef.current = lr
  }, [lr])

  const drawScene = useCallback(() => {
    const ctx = prepareCanvas(canvasRef.current, GR_W, GR_H)
    if (!ctx) return

    ctx.strokeStyle = 'rgba(255,255,255,0.05)'
    ctx.lineWidth = 1
    for (let wt = 0; wt <= 10; wt += 2) {
      ctx.beginPath()
      ctx.moveTo(grPx(wt), grPy(0))
      ctx.lineTo(grPx(wt), grPy(19))
      ctx.stroke()
    }
    for (let v = 0; v <= 18; v += 3) {
      ctx.beginPath()
      ctx.moveTo(grPx(0), grPy(v))
      ctx.lineTo(grPx(10), grPy(v))
      ctx.stroke()
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'
    ctx.beginPath()
    ctx.moveTo(grPx(0), grPy(0))
    ctx.lineTo(grPx(10), grPy(0))
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(grPx(0), grPy(0))
    ctx.lineTo(grPx(0), grPy(19))
    ctx.stroke()
    ctx.fillStyle = 'rgba(161,161,170,0.9)'
    ctx.font = '10px monospace'
    ctx.fillText('w', grPx(10) - 6, grPy(0) + 14)
    ctx.fillText('L', grPx(0) - 14, grPy(19) + 10)

    // نشانگر کمینه‌ها
    ctx.setLineDash([4, 4])
    ctx.strokeStyle = 'rgba(14,165,160,0.5)'
    ctx.beginPath()
    ctx.moveTo(grPx(2.5), grPy(0))
    ctx.lineTo(grPx(2.5), grPy(LOSS(2.5)))
    ctx.stroke()
    ctx.strokeStyle = 'rgba(139,92,246,0.5)'
    ctx.beginPath()
    ctx.moveTo(grPx(7.5), grPy(0))
    ctx.lineTo(grPx(7.5), grPy(LOSS(7.5)))
    ctx.stroke()
    ctx.setLineDash([])

    // منحنی خطا
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'
    ctx.lineWidth = 1.8
    ctx.beginPath()
    for (let i = 0; i <= 240; i++) {
      const w = (i / 240) * 10
      const y = grPy(LOSS(w))
      if (i === 0) ctx.moveTo(grPx(w), y)
      else ctx.lineTo(grPx(w), y)
    }
    ctx.stroke()

    ctx.font = '9.5px sans-serif'
    ctx.fillStyle = TEAL
    ctx.fillText('کمینهٔ سراسری', grPx(2.5) - 34, grPy(LOSS(2.5)) - 10)
    ctx.fillStyle = VIOLET
    ctx.fillText('کمینهٔ محلی', grPx(7.5) - 28, grPy(LOSS(7.5)) - 10)

    // رد توپ
    const trail = trailRef.current
    for (let i = 0; i < trail.length; i++) {
      ctx.globalAlpha = ((i + 1) / trail.length) * 0.4
      ctx.fillStyle = ORANGE
      ctx.beginPath()
      ctx.arc(grPx(trail[i]), grPy(LOSS(trail[i])), 2.6, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1

    // توپ
    const w = wRef.current
    ctx.shadowColor = ORANGE
    ctx.shadowBlur = 14
    ctx.fillStyle = ORANGE
    ctx.beginPath()
    ctx.arc(grPx(w), grPy(LOSS(w)), 7.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(grPx(w), grPy(LOSS(w)), 7.5, 0, Math.PI * 2)
    ctx.stroke()
  }, [])

  useEffect(() => {
    drawScene()
  }, [drawScene])

  useEffect(() => {
    if (!running) return
    let last = performance.now()
    const loop = (t: number) => {
      rafRef.current = requestAnimationFrame(loop)
      if (t - last < 85) return
      last = t
      const cur = wRef.current
      const grad = DLOSS(cur)
      const clipped = clamp(grad, -12, 12)
      const next = clamp(cur - lrRef.current * clipped, 0, 10)
      if (Math.abs(next - cur) > 1e-6) {
        trailRef.current.push(next)
        if (trailRef.current.length > 40) trailRef.current.shift()
      }
      wRef.current = next
      stepsRef.current += 1
      if (Math.abs(DLOSS(next)) < 0.02 || Math.abs(next - cur) < 0.0012) {
        setRunning(false)
        setDisplay({ w: next, steps: stepsRef.current, converged: true })
      } else {
        setDisplay({ w: next, steps: stepsRef.current, converged: false })
      }
      drawScene()
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [running, drawScene])

  useEffect(() => () => cancelAnimationFrame(rafRef.current), [])

  const restart = () => {
    const start = 0.4 + Math.random() * 9.2
    wRef.current = start
    stepsRef.current = 0
    trailRef.current = []
    setDisplay({ w: start, steps: 0, converged: false })
    setRunning(true)
    drawScene()
  }

  return (
    <div className="space-y-4">
      <SectionCard>
        <CardTitle>توپ را روی شیب خطا بغلتان</CardTitle>
        <CanvasBox canvasRef={canvasRef} height={GR_H} label="منحنی خطا و توپی که با نزول گرادیان به سراشیبی می‌رود" />
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <MiniStat label="موقعیت w" value={<span dir="ltr" className="font-mono">{fa(+display.w.toFixed(2))}</span>} />
          <MiniStat label="خطا L(w)" value={<span dir="ltr" className="font-mono">{fa(+LOSS(display.w).toFixed(2))}</span>} />
          <MiniStat label="شیب L′(w)" value={<span dir="ltr" className="font-mono">{fa(+DLOSS(display.w).toFixed(2))}</span>} />
          <MiniStat label="تعداد قدم" value={<span dir="ltr" className="font-mono">{fa(display.steps)}</span>} />
        </div>

        <div className="mt-3">
          <div className="mb-1 flex justify-between text-[10px] text-zinc-400">
            <span>نرخ یادگیری η</span>
            <span dir="ltr" className="font-mono text-zinc-200">{fa(+lr.toFixed(2))}</span>
          </div>
          <Slider value={[lr]} min={0.01} max={1.2} step={0.01} onValueChange={(v) => setLr(v[0])} aria-label="نرخ یادگیری" />
          <p className="mt-1 text-[9.5px] text-zinc-500">
            {lr < 0.25 ? 'قدم‌های کوتاه و محتاط — امن ولی کند.' : lr < 0.85 ? 'تعادل نسبتاً خوب.' : 'قدم‌های بلند! احتمالاً از کمینه می‌پری — ببین توپ چطور لرز می‌خورد.'}
          </p>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={() => setRunning(true)} disabled={running} className="text-[11px]" aria-label="شروع نزول گرادیان">
            <Play size={13} aria-hidden />
            شروع
          </Button>
          <Button size="sm" variant="outline" onClick={() => setRunning(false)} disabled={!running} className="border-white/15 text-[11px] text-zinc-300" aria-label="توقف نزول گرادیان">
            <Pause size={13} aria-hidden />
            توقف
          </Button>
          <Button size="sm" variant="outline" onClick={restart} className="border-white/15 text-[11px] text-zinc-300" aria-label="شروع دوباره با نقطهٔ تصادفی">
            <RotateCcw size={13} aria-hidden />
            شروع دوباره (شروع تصادفی)
          </Button>
        </div>

        <AnimatePresence>
          {display.converged && (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-[11.5px] font-bold text-emerald-300"
            >
              به کمینه رسید! شیب تقریباً صفر است و مدل دیگر نمی‌تواند خطا را کمتر کند — همان جایی که آموزش تمام می‌شود.
            </motion.p>
          )}
        </AnimatePresence>
      </SectionCard>

      <SectionCard>
        <CardTitle>چرا «منهای» گرادیان؟</CardTitle>
        <div className="space-y-2 text-[11.5px] leading-6 text-zinc-300">
          <p>
            یادگیری ماشین در هستهٔ خود یعنی کم‌کردن یک عدد: «خطا» یا Loss. نزول گرادیان ساده‌ترین و
            مهم‌ترین راه کم‌کردن آن است: به جهت تندترین شیبِ «بالا رفتن» نگاه کن و دقیقاً برعکسش قدم بردار.
          </p>
          <Code>w ← w − η · L′(w)</Code>
          <p>
            نرخ یادگیری η طول قدم است: کوچک باشد حلزون‌وار ولی مطمئن پیش می‌روی؛ بزرگ باشد از گودی رد
            می‌شوی و بالا و پایین می‌پری — در شبکه‌های واقعی حتی می‌تواند همه‌چیز را منفجر کند. η را ببر
            روی ۱ و این لرزش را با چشم ببین!
          </p>
          <p>
            کمینهٔ محلی و سراسری: در این دمو دو گودی می‌بینی. توپ ممکن است در گودی کوچک گیر کند و هرگز
            خبردار نشود که گودی عمیق‌تری هم هست. در مسائل واقعی با میلیون‌ها پارامتر، شروع تصادفی و
            کمی نویز کمک می‌کنند از تله‌ها فرار کنیم.
          </p>
        </div>
        <div className="mt-3">
          <Tip tone="teal">
            برای سادگی، اگر اندازهٔ گرادیان خیلی بزرگ شود آن را «می‌چینیم» (Gradient Clipping) — تکنیکی که
            واقعاً در آموزش مدل‌های زبانی هم استفاده می‌شود تا قدم‌ها از کنترل خارج نشوند.
          </Tip>
        </div>
      </SectionCard>
    </div>
  )
}

/* ================================================================
   بخش ۴ — توابع فعال‌ساز
   ================================================================ */

const ACT_W = 600
const ACT_H = 300
const actPx = (x: number) => 30 + ((x + 6) / 12) * (ACT_W - 40)
const actPy = (y: number) => ACT_H - 22 - ((y + 2) / 6) * (ACT_H - 34)

function drawActivation(canvas: HTMLCanvasElement | null, act: ActDef, p: number) {
  const ctx = prepareCanvas(canvas, ACT_W, ACT_H)
  if (!ctx) return

  ctx.strokeStyle = 'rgba(255,255,255,0.05)'
  ctx.lineWidth = 1
  for (let x = -6; x <= 6; x++) {
    ctx.beginPath()
    ctx.moveTo(actPx(x), actPy(-2))
    ctx.lineTo(actPx(x), actPy(4))
    ctx.stroke()
  }
  for (let y = -2; y <= 4; y++) {
    ctx.beginPath()
    ctx.moveTo(actPx(-6), actPy(y))
    ctx.lineTo(actPx(6), actPy(y))
    ctx.stroke()
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'
  ctx.beginPath()
  ctx.moveTo(actPx(-6), actPy(0))
  ctx.lineTo(actPx(6), actPy(0))
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(actPx(0), actPy(-2))
  ctx.lineTo(actPx(0), actPy(4))
  ctx.stroke()

  ctx.fillStyle = 'rgba(161,161,170,0.85)'
  ctx.font = '9px monospace'
  for (let x = -6; x <= 6; x += 2) {
    if (x !== 0) ctx.fillText(faSigned(x), actPx(x) - 6, actPy(0) + 13)
  }
  for (let y = -2; y <= 4; y++) {
    if (y !== 0) ctx.fillText(faSigned(y), actPx(-6) - 18, actPy(y) + 3)
  }
  ctx.fillText('x', actPx(6) + 4, actPy(0) + 12)
  ctx.fillText('y', actPx(0) + 6, actPy(-2) + 14)

  // منحنی با پیشرفت انیمیشنی
  const xEnd = -6 + 12 * p
  ctx.strokeStyle = act.color
  ctx.lineWidth = 2.6
  ctx.shadowColor = act.color
  ctx.shadowBlur = 8
  ctx.beginPath()
  let started = false
  for (let x = -6; x <= xEnd + 1e-9; x += 0.06) {
    const y = act.f(x)
    if (!Number.isFinite(y) || y < -2.3 || y > 4.3) {
      started = false
      continue
    }
    const cx = actPx(x)
    const cy = actPy(y)
    if (!started) {
      ctx.moveTo(cx, cy)
      started = true
    } else {
      ctx.lineTo(cx, cy)
    }
  }
  ctx.stroke()
  ctx.shadowBlur = 0
}

function ActivationsSection() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [tabIdx, setTabIdx] = useState(0)
  const act = ACTS[tabIdx]

  useEffect(() => {
    let raf = 0
    const t0 = performance.now()
    const DUR = 850
    const loop = (t: number) => {
      const p = Math.min(1, (t - t0) / DUR)
      drawActivation(canvasRef.current, act, p)
      if (p < 1) raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [act])

  return (
    <div className="space-y-4">
      <SectionCard>
        <CardTitle>چهار طعم، چهار شخصیت</CardTitle>
        <div className="mb-3 flex gap-1" role="tablist" aria-label="انتخاب تابع فعال‌ساز">
          {ACTS.map((a, i) => (
            <button
              key={a.id}
              role="tab"
              aria-selected={i === tabIdx}
              onClick={() => setTabIdx(i)}
              className={`flex-1 rounded-xl border px-2 py-1.5 text-[10.5px] font-bold transition ${
                i === tabIdx ? 'border-transparent text-white' : 'border-white/10 bg-zinc-800/70 text-zinc-400 hover:text-zinc-200'
              }`}
              style={i === tabIdx ? { background: `${a.color}30`, color: a.color } : undefined}
            >
              {a.label}
            </button>
          ))}
        </div>
        <CanvasBox canvasRef={canvasRef} height={ACT_H} label={`نمودار تابع فعال‌ساز ${act.label}`} />

        <AnimatePresence mode="wait">
          <motion.div
            key={act.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="mt-3 space-y-2"
          >
            <div className="flex justify-center">
              <Code>{act.formula}</Code>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-black/25 p-2.5">
                <div className="text-[9px] text-zinc-500">محدودهٔ خروجی</div>
                <div className="mt-1 text-[11px] font-bold text-zinc-200">{act.range}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/25 p-2.5">
                <div className="text-[9px] text-zinc-500">کاربرد اصلی</div>
                <div className="mt-1 text-[10.5px] leading-5 text-zinc-300">{act.use}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/25 p-2.5">
                <div className="text-[9px] text-zinc-500">نکتهٔ مهم</div>
                <div className="mt-1 text-[10.5px] leading-5 text-zinc-300">{act.note}</div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </SectionCard>

      <SectionCard>
        <CardTitle>اصلاً فعال‌ساز به چه دردی می‌خورد؟</CardTitle>
        <div className="space-y-2 text-[11.5px] leading-6 text-zinc-300">
          <p>
            اگر نورون فقط «ضرب و جمع» باشد، هر تعداد لایه که بگذاری حاصل می‌شود یک ضرب و جمع بزرگ —
            شبکه تا ابد فقط می‌تواند خط بکشد! تابع فعال‌ساز این خط را خم می‌کند و به شبکه قدرت
            یادگیری الگوهای خمیده و پیچیده می‌دهد. بدون فعال‌ساز، یادگیری عمیق وجود نداشت.
          </p>
          <p>
            «محوشدن گرادیان» هم اینجاست که اهمیت پیدا می‌کند: برای یادگیری، سیگنال خطا باید از لایه‌های
            آخر به اول برگردد. اگر تابع فعال‌ساز در بعضی نقاط شیب تقریباً صفر داشته باشد (مثل دم‌های
            سیگموید و tanh)، این سیگنال لایه‌به‌لایه محو می‌شود — مثل فریاد در یک راهروی خیلی طولانی.
          </p>
        </div>
        <div className="mt-3">
          <Tip>قانون سرانگشتی: لایه‌های پنهان → ReLU یا GELU؛ لایهٔ خروجی احتمال → سیگموید (دوکلاسه) یا Softmax (چندکلاسه).</Tip>
        </div>
      </SectionCard>
    </div>
  )
}

/* ================================================================
   بخش ۵ — شبکهٔ عصبی ۳-۴-۲
   ================================================================ */

function NetworkSection() {
  const [run, setRun] = useState(0)
  const [showOut, setShowOut] = useState(false)
  const timerRef = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    },
    [],
  )

  const play = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current)
    setShowOut(false)
    setRun((r) => r + 1)
    timerRef.current = window.setTimeout(() => setShowOut(true), 1500)
  }

  const reset = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current)
    setRun(0)
    setShowOut(false)
  }

  const catPct = Math.round(P_CAT * 100)
  const dogPct = Math.round((1 - P_CAT) * 100)

  const edge = (keyStr: string, x1: number, y1: number, x2: number, y2: number, w: number, layer: number) => {
    const positive = w >= 0
    const common = {
      x1,
      y1,
      x2,
      y2,
      stroke: positive ? TEAL : ROSE,
      strokeWidth: 0.8 + Math.abs(w) * 2.1,
      strokeLinecap: 'round' as const,
    }
    if (run === 0) {
      return <line key={keyStr} {...common} strokeOpacity={0.28} />
    }
    return (
      <motion.line
        key={keyStr}
        {...common}
        initial={{ strokeOpacity: 0.28 }}
        animate={{ strokeOpacity: [0.28, 1, 0.28] }}
        transition={{ duration: 0.55, delay: layer === 0 ? 0.05 : 0.5, ease: 'easeInOut' }}
      />
    )
  }

  const node = (keyStr: string, cx: number, cy: number, r: number, stroke: string, fill: string) => (
    <circle key={keyStr} cx={cx} cy={cy} r={r} stroke={stroke} strokeWidth={1.6} fill={fill} />
  )

  const pulse = (keyStr: string, cx: number, cy: number, r: number, delay: number) =>
    run === 0 ? null : (
      <motion.circle
        key={keyStr}
        cx={cx}
        cy={cy}
        r={r}
        fill="rgba(255,255,255,0.45)"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.85, 0] }}
        transition={{ duration: 0.5, delay, ease: 'easeInOut' }}
      />
    )

  return (
    <div className="space-y-4">
      <SectionCard>
        <CardTitle>یک طبقه‌بند گربه/سگ با ۳ ورودی و ۲ خروجی</CardTitle>
        <p className="mb-3 text-[10.5px] leading-5 text-zinc-400">
          ورودی‌ها به شبکه می‌گویند: گوش نوک‌تیز چقدر؟ صدای واق‌واق چقدر؟ علاقه به توپ چقدر؟
          ضخامت هر یال بزرگی وزن و رنگش علامت آن است (فیروزه‌ای مثبت، رز منفی). دکمهٔ اجرا را بزن و
          ببین سیگنال چطور لایه‌به‌لایه جریان پیدا می‌کند.
        </p>
        <div className="overflow-hidden rounded-xl border border-white/10 bg-black/40 p-1">
          <svg viewBox="0 0 560 260" className="w-full" role="img" aria-label="نمودار شبکهٔ عصبی سه‌لایه با یال‌های وزن‌دار">
            {/* یال‌ها */}
            {W1.map((row, h) => row.map((w, i) => edge(`e1-${run}-${h}-${i}`, NET_X[0] + 12, IN_Y[i], NET_X[1] - 13, HID_Y[h], w, 0)))}
            {W2.map((row, o) => row.map((w, h) => edge(`e2-${run}-${o}-${h}`, NET_X[1] + 13, HID_Y[h], NET_X[2] - 14, OUT_Y[o], w, 1)))}

            {/* گره‌ها */}
            {IN_Y.map((y, i) => node(`in-${i}`, NET_X[0], y, 12, ORANGE, 'rgba(247,147,30,0.16)'))}
            {HID_Y.map((y, i) => node(`hid-${i}`, NET_X[1], y, 13, TEAL, 'rgba(14,165,160,0.14)'))}
            {OUT_Y.map((y, i) =>
              node(`out-${i}`, NET_X[2], y, 14, i === 0 ? VIOLET : ORANGE, i === 0 ? 'rgba(139,92,246,0.16)' : 'rgba(247,147,30,0.16)'),
            )}

            {/* پالس‌ها */}
            {IN_Y.map((y, i) => pulse(`pin-${run}-${i}`, NET_X[0], y, 12, 0.05))}
            {HID_Y.map((y, i) => pulse(`phid-${run}-${i}`, NET_X[1], y, 13, 0.45))}
            {OUT_Y.map((y, i) => pulse(`pout-${run}-${i}`, NET_X[2], y, 14, 0.95))}

            {/* مقادیر داخل گره‌ها */}
            {NET_INPUT.map((v, i) => (
              <text key={`tv-${i}`} x={NET_X[0]} y={IN_Y[i] + 2.5} textAnchor="middle" fontSize="7.5" fill="#fde9d2" fontFamily="monospace">
                {v}
              </text>
            ))}
            {HID_VALS.map((v, i) => (
              <text key={`hv-${i}`} x={NET_X[1]} y={HID_Y[i] + 2.5} textAnchor="middle" fontSize="7.5" fill="#d2f5ef" fontFamily="monospace">
                {v.toFixed(1)}
              </text>
            ))}
            {OUT_SIG.map((v, i) => (
              <text key={`ov-${i}`} x={NET_X[2]} y={OUT_Y[i] + 2.5} textAnchor="middle" fontSize="7.5" fill="#f5e9ff" fontFamily="monospace">
                {v.toFixed(2)}
              </text>
            ))}

            {/* برچسب ورودی‌ها */}
            {['گوش نوک‌تیز', 'صدای واق‌واق', 'علاقه به توپ'].map((t, i) => (
              <text key={`il-${i}`} x={NET_X[0] - 18} y={IN_Y[i] + 3} textAnchor="end" fontSize="9" fill="#a1a1aa">
                {t}
              </text>
            ))}
            {/* برچسب خروجی‌ها */}
            <text x={NET_X[2] + 20} y={OUT_Y[0] + 3} fontSize="10" fontWeight="700" fill={VIOLET}>
              گربه
            </text>
            <text x={NET_X[2] + 20} y={OUT_Y[1] + 3} fontSize="10" fontWeight="700" fill={ORANGE}>
              سگ
            </text>

            {/* عناوین لایه‌ها */}
            <text x={NET_X[0]} y={16} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#d4d4d8">
              ورودی
            </text>
            <text x={NET_X[1]} y={16} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#d4d4d8">
              لایهٔ پنهان
            </text>
            <text x={NET_X[2]} y={16} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#d4d4d8">
              خروجی
            </text>
          </svg>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={play} className="text-[11px]" aria-label="اجرای سیگنال در شبکه">
            <Zap size={13} aria-hidden />
            اجرای سیگنال
          </Button>
          <Button size="sm" variant="outline" onClick={reset} className="border-white/15 text-[11px] text-zinc-300" aria-label="بازنشانی شبکه">
            <RotateCcw size={13} aria-hidden />
            بازنشانی
          </Button>
          <span className="text-[9.5px] text-zinc-500">پنهان: tanh — خروجی: سیگموید + نرمال‌سازی</span>
        </div>

        <AnimatePresence>
          {showOut && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-3 space-y-2"
            >
              {[
                { label: 'گربه', pct: catPct, color: VIOLET },
                { label: 'سگ', pct: dogPct, color: ORANGE },
              ].map((o, i) => (
                <div key={o.label} className="flex items-center gap-2">
                  <span className="w-10 text-[11px] font-bold" style={{ color: o.color }}>
                    {o.label}
                  </span>
                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/5">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: o.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${o.pct}%` }}
                      transition={{ duration: 0.6, delay: 0.1 * i, ease: 'easeOut' }}
                    />
                  </div>
                  <span className="w-10 text-left text-[11px] font-black text-zinc-200">{fa(o.pct)}٪</span>
                </div>
              ))}
              <p className="text-[10.5px] leading-5 text-zinc-400">
                شبکه چیزی جز چند ضرب و جمع ساده انجام نداد — با این حال تصمیم گرفت:{' '}
                <b style={{ color: catPct >= dogPct ? VIOLET : ORANGE }}>
                  {catPct >= dogPct ? 'این یک گربه است!' : 'این یک سگ است!'}
                </b>{' '}
                همین است که شبکه‌های بزرگ انجام می‌دهند؛ فقط با میلیون‌ها وزن و دادهٔ بیشتر.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </SectionCard>

      <SectionCard>
        <CardTitle>پشت صحنه چه گذشت؟</CardTitle>
        <div className="space-y-2 text-[11.5px] leading-6 text-zinc-300">
          <p>
            هر گره در لایهٔ پنهان مجموع وزن‌دار ورودی‌ها را می‌گیرد و از tanh رد می‌کند؛ هر خروجی همین
            کار را با خروجی‌های پنهان می‌کند و از سیگموید رد می‌شود تا «امتیاز» بگیرد. آموزش یعنی
            تنظیم همین وزن‌ها با نزول گرادیان تا خطای تصمیم‌ها کم شود.
          </p>
          <p>
            نکتهٔ ظریف: وزن منفی یعنی «این شاهد علیه گربه بودن است» — مثل صدای واق‌واق که با وزن
            منفی به گرهٔ گربه وصل شده. شبکه با ترکیب شواهد مثبت و منفی رأی می‌دهد.
          </p>
        </div>
      </SectionCard>
    </div>
  )
}

/* ================================================================
   بخش ۶ — مدل زبانی (بایگرام)
   ================================================================ */

interface BigramEntry {
  word: string
  count: number
  prob: number
}

function LLMSection() {
  const [query, setQuery] = useState('هوش')
  const [temp, setTemp] = useState(0.8)
  const [typed, setTyped] = useState('')
  const [tokenText, setTokenText] = useState('هوش مصنوعی آینده را می‌نویسد!')
  const typeTimer = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (typeTimer.current) window.clearInterval(typeTimer.current)
    },
    [],
  )

  const results: BigramEntry[] | null = useMemo(() => {
    const q = normWord(query)
    if (!q) return null
    const m = BIGRAM.next.get(q)
    if (!m || m.size === 0) return []
    const total = [...m.values()].reduce((a, b) => a + b, 0)
    return [...m.entries()]
      .map(([word, count]) => ({ word, count, prob: count / total }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [query])

  const tempLabel = temp < 0.5 ? 'محافظه‌کار' : temp < 1.1 ? 'متعادل' : temp < 1.6 ? 'خلاق' : 'دیوانه‌وار'

  const typewriter = (s: string) => {
    if (typeTimer.current) window.clearInterval(typeTimer.current)
    setTyped('')
    let i = 0
    typeTimer.current = window.setInterval(() => {
      i += 1
      setTyped(s.slice(0, i))
      if (i >= s.length && typeTimer.current) {
        window.clearInterval(typeTimer.current)
        typeTimer.current = null
      }
    }, 34)
  }

  const generate = () => {
    const start = BIGRAM.starts[Math.floor(Math.random() * BIGRAM.starts.length)]
    const words = [start]
    let cur = start
    for (let i = 0; i < 7; i++) {
      const m = BIGRAM.next.get(cur)
      if (!m || m.size === 0) break
      const entries = [...m.entries()]
      const weights = entries.map(([, c]) => Math.pow(c, 1 / temp))
      const sum = weights.reduce((a, b) => a + b, 0)
      let r = Math.random() * sum
      let idx = weights.length - 1
      for (let k = 0; k < weights.length; k++) {
        r -= weights[k]
        if (r <= 0) {
          idx = k
          break
        }
      }
      const w = entries[idx][0]
      words.push(w)
      cur = w
    }
    typewriter(words.join(' ') + '.')
  }

  const tokens = useMemo(
    () => tokenText.match(/[A-Za-z0-9\u0600-\u06FF\u200c]+|[^\sA-Za-z0-9\u0600-\u06FF\u200c]/g) ?? [],
    [tokenText],
  )

  return (
    <div className="space-y-4">
      <SectionCard>
        <CardTitle>کلمهٔ بعدی را حدس بزن (مدل بایگرام)</CardTitle>
        <p className="mb-3 text-[10.5px] leading-5 text-zinc-400">
          این مدل کوچک از {fa(SENTENCES.length)} جملهٔ فارسی ساخته شده و فقط یک چیز بلد است:
          بعد از هر کلمه، بگوید در داده‌ها چه کلمه‌هایی آمده‌اند. یک کلمه بنویس یا از میان‌برها انتخاب کن.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {['هوش', 'لینوکس', 'برنامه‌نویسی', 'یادگیری', 'داده', 'تمرین'].map((s) => (
            <button
              key={s}
              onClick={() => setQuery(s)}
              className={`rounded-full border px-2.5 py-1 text-[10px] font-bold transition ${
                normWord(query) === s ? 'border-transparent bg-violet-500/30 text-violet-200' : 'border-white/10 bg-zinc-800/70 text-zinc-300 hover:border-white/25'
              }`}
              aria-label={`انتخاب کلمهٔ ${s}`}
            >
              {s}
            </button>
          ))}
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="مثلاً: هوش، لینوکس، تمرین…"
          aria-label="کلمه برای پیش‌بینی کلمهٔ بعدی"
          className="mt-2.5 w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-[12px] text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-violet-400/50"
        />

        <div className="mt-3 min-h-24 rounded-xl border border-white/10 bg-black/25 p-3">
          {results === null ? (
            <p className="text-[11px] text-zinc-500">یک کلمه بنویس تا توزیع کلمهٔ بعدی را ببینی.</p>
          ) : results.length === 0 ? (
            <p className="text-[11px] text-zinc-500">
              این کلمه در حافظهٔ {fa(SENTENCES.length)} جمله‌ای ما نیست — مدل هم گاهی همین‌قدر گیج می‌شود!
            </p>
          ) : (
            <div className="space-y-2">
              {results.map((r, i) => (
                <div key={r.word} className="flex items-center gap-2">
                  <span className="w-24 shrink-0 truncate text-[11.5px] font-bold text-zinc-200">{r.word}</span>
                  <div className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-white/5">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: i === 0 ? TEAL : VIOLET }}
                      initial={{ width: 0 }}
                      animate={{ width: `${r.prob * 100}%` }}
                      transition={{ delay: i * 0.05, duration: 0.45, ease: 'easeOut' }}
                    />
                  </div>
                  <span dir="ltr" className="w-10 shrink-0 text-right font-mono text-[10px] text-zinc-400">
                    {fa(Math.round(r.prob * 100))}٪
                  </span>
                  <Badge variant="outline" className="shrink-0 border-white/15 text-[9px] text-zinc-400">
                    ×{fa(r.count)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard>
        <CardTitle>یک جمله تولید کن</CardTitle>
        <div className="mb-3">
          <div className="mb-1 flex items-center justify-between text-[10px] text-zinc-400">
            <span>دما (Temperature)</span>
            <span className="flex items-center gap-2">
              <span dir="ltr" className="font-mono text-zinc-200">{fa(+temp.toFixed(2))}</span>
              <Badge variant="outline" className="border-white/15 text-[9px] text-orange-300">
                {tempLabel}
              </Badge>
            </span>
          </div>
          <Slider value={[temp]} min={0.1} max={2} step={0.05} onValueChange={(v) => setTemp(v[0])} aria-label="دما" />
        </div>
        <Button size="sm" onClick={generate} className="text-[11px]" aria-label="تولید یک جمله با مدل بایگرام">
          <Bot size={13} aria-hidden />
          یک جمله تولید کن
        </Button>
        <div className="mt-3 min-h-14 rounded-xl border border-white/10 bg-black/35 p-3 text-[12.5px] leading-7 text-zinc-100">
          {typed || <span className="text-zinc-600">هنوز چیزی تولید نشده…</span>}
          {typed && <span className="ms-0.5 inline-block h-4 w-1.5 animate-pulse bg-orange-400 align-middle" aria-hidden />}
        </div>
      </SectionCard>

      <SectionCard>
        <CardTitle>توکن چیست؟</CardTitle>
        <input
          value={tokenText}
          onChange={(e) => setTokenText(e.target.value)}
          aria-label="متن برای شمارش توکن"
          className="w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-[12px] text-zinc-100 outline-none focus:border-teal-400/50"
        />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge className="bg-teal-500/20 text-[10px] text-teal-200 hover:bg-teal-500/20">
            تعداد توکن‌ها: {fa(tokens.length)}
          </Badge>
          <span className="text-[9.5px] text-zinc-500">تقسیم ساده بر فاصله و نشانه‌های سجاوندی؛ مدل‌های واقعی از BPE استفاده می‌کنند.</span>
        </div>
        <div className="os-scroll mt-2 flex max-h-28 flex-wrap gap-1 overflow-y-auto">
          {tokens.map((t, i) => (
            <span
              key={`${i}-${t}`}
              className="rounded-lg border border-white/10 bg-black/30 px-1.5 py-0.5 text-[10.5px] text-zinc-200"
            >
              <sup className="text-[7.5px] text-zinc-500">{fa(i + 1)}</sup> {t}
            </span>
          ))}
        </div>
      </SectionCard>

      <SectionCard>
        <CardTitle>بایگرام تا ترنسفورمر</CardTitle>
        <div className="space-y-2 text-[11.5px] leading-6 text-zinc-300">
          <p>
            مدل ما «بایگرام» است: فقط به «یک» کلمهٔ قبل نگاه می‌کند. فرمولش ساده است:
          </p>
          <Code>P(next | prev) = count(prev, next) / count(prev)</Code>
          <p>
            نسل‌های بعدی هر بار حافظه را بزرگ‌تر کردند: n-gram با چند کلمهٔ زمینه، بعد RNN با حافظهٔ
            پنهان، و در نهایت ترنسفورمر با «مکانیزم توجه» که می‌تواند به همهٔ کلمه‌های متن همزمان نگاه
            کند. ChatGPT هم دقیقاً همین کار بایگرام را انجام می‌دهد؛ فقط توزیعش از میلیاردها پارامتر
            و تریلیون‌ها توکن آمده است.
          </p>
          <p>
            دما هم کنترل می‌کند چقدر جسور باشیم: با بالاتر بردن T، توزیع احتمال «پُر» می‌شود و کلمه‌های
            کم‌احتمال هم شانس می‌گیرند (خلاقیت + ریسک)؛ با پایین آوردنش مدل فقط محتمل‌ترین گزینه را
            انتخاب می‌کند (ایمن + تکراری). امتحانش کن: دما را بگذار ۲ و چند جمله تولید کن!
          </p>
        </div>
      </SectionCard>
    </div>
  )
}

/* ================================================================
   بخش ۷ — بیش‌برازش
   ================================================================ */

const OF_W = 600
const OF_H = 300
const ofPx = (x: number) => 30 + (x / 10) * (OF_W - 44)
const ofPy = (y: number) => OF_H - 24 - (y / 10) * (OF_H - 40)

function OverfitSection() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [degree, setDegree] = useState(2)

  const FITS = useMemo(() => {
    const train = OVERFIT_POINTS.filter((p) => !p.val)
    const val = OVERFIT_POINTS.filter((p) => p.val)
    const coefs: (number[] | null)[] = []
    const trainMse: number[] = []
    const valMse: number[] = []
    for (let d = 1; d <= 9; d++) {
      const c = polyFit(train, d)
      coefs.push(c)
      trainMse.push(c ? mseOf(c, train) : NaN)
      valMse.push(c ? mseOf(c, val) : NaN)
    }
    let bestVal = Number.POSITIVE_INFINITY
    let bestDeg = 1
    for (let d = 1; d <= 9; d++) {
      const v = valMse[d - 1]
      if (Number.isFinite(v) && v < bestVal) {
        bestVal = v
        bestDeg = d
      }
    }
    if (!Number.isFinite(bestVal)) bestVal = 1
    return { coefs, trainMse, valMse, bestVal, bestDeg }
  }, [])

  const trainErr = FITS.trainMse[degree - 1]
  const valErr = FITS.valMse[degree - 1]
  const overfitting = valErr > FITS.bestVal * 1.5 + 0.2
  const barMax = Math.max(
    Number.isFinite(trainErr) ? trainErr : 0,
    Number.isFinite(valErr) ? valErr : 0,
    0.5,
  )
  const maxSpark = Math.max(...FITS.valMse.filter(Number.isFinite), 1)

  useEffect(() => {
    const ctx = prepareCanvas(canvasRef.current, OF_W, OF_H)
    if (!ctx) return

    ctx.strokeStyle = 'rgba(255,255,255,0.05)'
    ctx.lineWidth = 1
    for (let g = 0; g <= 10; g += 2) {
      ctx.beginPath()
      ctx.moveTo(ofPx(g), ofPy(0))
      ctx.lineTo(ofPx(g), ofPy(10))
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(ofPx(0), ofPy(g))
      ctx.lineTo(ofPx(10), ofPy(g))
      ctx.stroke()
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'
    ctx.beginPath()
    ctx.moveTo(ofPx(0), ofPy(0))
    ctx.lineTo(ofPx(10), ofPy(0))
    ctx.stroke()

    // شکل واقعی داده (خط‌چین)
    ctx.setLineDash([4, 4])
    ctx.strokeStyle = 'rgba(255,255,255,0.28)'
    ctx.lineWidth = 1.4
    ctx.beginPath()
    for (let i = 0; i <= 100; i++) {
      const x = (i / 100) * 10
      if (i === 0) ctx.moveTo(ofPx(x), ofPy(TRUE_F(x)))
      else ctx.lineTo(ofPx(x), ofPy(TRUE_F(x)))
    }
    ctx.stroke()
    ctx.setLineDash([])

    // منحنی برازش‌شده
    const coef = FITS.coefs[degree - 1]
    if (coef) {
      ctx.strokeStyle = VIOLET
      ctx.lineWidth = 2.4
      ctx.beginPath()
      let started = false
      for (let i = 0; i <= 220; i++) {
        const x = (i / 220) * 10
        const y = evalPoly(coef, x)
        if (!Number.isFinite(y) || y < -2 || y > 13) {
          started = false
          continue
        }
        if (!started) {
          ctx.moveTo(ofPx(x), ofPy(clamp(y, -1.5, 12)))
          started = true
        } else {
          ctx.lineTo(ofPx(x), ofPy(clamp(y, -1.5, 12)))
        }
      }
      ctx.stroke()
    }

    // نقاط
    for (const p of OVERFIT_POINTS) {
      if (p.val) {
        ctx.strokeStyle = TEAL
        ctx.lineWidth = 2
        ctx.fillStyle = 'rgba(0,0,0,0.4)'
        ctx.beginPath()
        ctx.arc(ofPx(p.x), ofPy(p.y), 5, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()
      } else {
        ctx.fillStyle = ORANGE
        ctx.strokeStyle = 'rgba(255,255,255,0.6)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(ofPx(p.x), ofPy(p.y), 4.5, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()
      }
    }

    ctx.fillStyle = 'rgba(161,161,170,0.9)'
    ctx.font = '10px monospace'
    ctx.fillText('x', OF_W - 12, OF_H - 8)
  }, [degree, FITS])

  return (
    <div className="space-y-4">
      <SectionCard>
        <CardTitle>منحنی را به نقاط تحمیل کن</CardTitle>
        <CanvasBox
          canvasRef={canvasRef}
          height={OF_H}
          label="نقاط داده با منحنی برازش‌شده و شکل واقعی داده به‌صورت خط‌چین"
        />
        <div className="mt-2 flex flex-wrap gap-3 text-[9.5px] text-zinc-400">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: ORANGE }} aria-hidden /> آموزش ({fa(10)} نقطه)
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-full border-2" style={{ borderColor: TEAL }} aria-hidden /> دادهٔ جدید ({fa(4)} نقطه)
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-0.5 w-4 bg-zinc-500" aria-hidden /> شکل واقعی داده (خط‌چین)
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-0.5 w-4" style={{ background: VIOLET }} aria-hidden /> مدل تو
          </span>
        </div>

        <div className="mt-3">
          <div className="mb-1 flex justify-between text-[10px] text-zinc-400">
            <span>درجهٔ مدل (پیچیدگی)</span>
            <span dir="ltr" className="font-mono text-zinc-200">{fa(degree)}</span>
          </div>
          <Slider value={[degree]} min={1} max={9} step={1} onValueChange={(v) => setDegree(v[0])} aria-label="درجهٔ مدل" />
        </div>

        <div className="mt-3 space-y-2">
          {[
            { label: 'خطای آموزش', value: trainErr, color: TEAL, warn: false },
            { label: 'خطای تخمینی روی دادهٔ جدید', value: valErr, color: ORANGE, warn: overfitting },
          ].map((bar) => (
            <div key={bar.label}>
              <div className="mb-1 flex items-center justify-between text-[10px]">
                <span className={bar.warn ? 'font-bold text-rose-300' : 'text-zinc-400'}>{bar.label}</span>
                <span dir="ltr" className="font-mono text-zinc-300">
                  {Number.isFinite(bar.value) ? fa(+bar.value.toFixed(1)) : '—'}
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-white/5">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: bar.warn ? ROSE : bar.color }}
                  animate={{ width: `${Number.isFinite(bar.value) ? clamp((bar.value / barMax) * 100, 1.5, 100) : 1.5}%` }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* نمودار کوچک خطای عمومی در هر درجه */}
        <div className="mt-3 rounded-xl border border-white/10 bg-black/25 p-2.5">
          <div className="mb-1.5 flex items-center justify-between text-[9.5px] text-zinc-500">
            <span>خطای دادهٔ جدید در هر درجه</span>
            <span>
              بهترین درجه: <b className="text-emerald-300">{fa(FITS.bestDeg)}</b>
            </span>
          </div>
          <div className="flex h-12 items-end gap-1.5">
            {FITS.valMse.map((v, i) => (
              <button
                key={i}
                onClick={() => setDegree(i + 1)}
                aria-label={`انتخاب درجهٔ ${fa(i + 1)}`}
                className="flex h-full flex-1 flex-col justify-end rounded-md outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
              >
                <span
                  className={`w-full rounded-md ${i + 1 === degree ? 'ring-1 ring-orange-300' : ''}`}
                  style={{
                    height: `${Number.isFinite(v) ? clamp((Math.sqrt(v) / Math.sqrt(maxSpark)) * 100, 6, 100) : 6}%`,
                    background: i + 1 === FITS.bestDeg ? '#34d399' : i + 1 === degree ? VIOLET : 'rgba(255,255,255,0.14)',
                  }}
                />
              </button>
            ))}
          </div>
          <div className="mt-1 flex justify-between text-[8.5px] text-zinc-600">
            {FITS.valMse.map((_, i) => (
              <span key={i} className="flex-1 text-center">
                {fa(i + 1)}
              </span>
            ))}
          </div>
        </div>

        <AnimatePresence>
          {overfitting && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="mt-3 flex items-start gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 p-2.5"
            >
              <AlertTriangle size={15} className="mt-0.5 shrink-0 text-rose-400" aria-hidden />
              <div className="text-[11.5px] font-bold leading-5 text-rose-200">
                مدل حفظ کرده، یاد نگرفته!
                <span className="block text-[10.5px] font-normal text-rose-200/80">
                  منحنی دارد نقاط آموزش را دقیقاً لمس می‌کند؛ روی دادهٔ تازه فرو می‌ریزد.
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </SectionCard>

      <SectionCard>
        <CardTitle>بایاس در برابر واریانس</CardTitle>
        <div className="space-y-2 text-[11.5px] leading-6 text-zinc-300">
          <p>
            درجهٔ ۱ (یک خط) از واقعیت ساده‌تر است: هم آموزش و هم آزمون بدند — این «کم‌برازش» است.
            درجهٔ ۲ و ۳ شکل واقعی داده را می‌گیرند: نقطهٔ طلایی. از درجهٔ حدود ۴ به بعد، منحنی دارد
            نویزِ ۱۰ نقطهٔ آموزش را حفظ می‌کند: خطای آموزش سقوط می‌کند ولی خطای دادهٔ جدید اوج می‌گیرد.
          </p>
          <p>
            چرا درجهٔ ۹ خطای آموزش تقریباً صفر می‌دهد؟ چون از ۱۰ نقطه با منحنیِ درجهٔ ۹ می‌توان دقیقاً
            همهٔ نقاط را رد کرد — این «حفظ کردن» است نه «یاد گرفتن». همین است که مدل‌های بزرگ بدون
            دادهٔ کافی انجام می‌دهند.
          </p>
          <p className="font-bold text-zinc-100">راه‌حل‌های استاندارد:</p>
          <ul className="ms-1 space-y-1">
            {[
              'دادهٔ بیشتر — بهترین دوست تو در برابر بیش‌برازش',
              'منظم‌سازی (L2 / Dropout) — چانهٔ مدل را کوتاه کن',
              'مدل ساده‌تر — وقتی خط با داده توضیح داده می‌شود، منحنی نکش',
              'توقف زودهنگام و اعتبارسنجی — دقیقاً همان چیزی که این دمو شبیه‌سازی می‌کند',
            ].map((s) => (
              <li key={s} className="flex items-start gap-1.5 text-[11px] text-zinc-300">
                <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-400" aria-hidden />
                {s}
              </li>
            ))}
          </ul>
        </div>
      </SectionCard>
    </div>
  )
}

/* ================================================================
   بخش ۸ — اخلاق و آینده
   ================================================================ */

function EthicsSection() {
  const [pledge, setPledge] = useState<boolean[]>([false, false, false, false, false])
  const signed = pledge.filter(Boolean).length
  const togglePledge = (i: number) =>
    setPledge((p) => p.map((v, j) => (j === i ? !v : v)))

  return (
    <div className="space-y-4">
      <SectionCard>
        <CardTitle>شش مسائل که هر مهندس AI باید بداند</CardTitle>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {ETHICS_CARDS.map((c, i) => {
            const Icon = c.icon
            return (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i, duration: 0.25 }}
                whileHover={{ y: -4 }}
                className="rounded-2xl border border-white/10 bg-zinc-900/60 p-3"
              >
                <span
                  className="grid h-8 w-8 place-items-center rounded-xl"
                  style={{ background: `${c.tint}22`, color: c.tint }}
                >
                  <Icon size={15} aria-hidden />
                </span>
                <h4 className="mt-2 text-[12px] font-black text-zinc-100">{c.title}</h4>
                <ul className="mt-1 space-y-1">
                  {c.lines.map((l) => (
                    <li key={l} className="text-[10px] leading-5 text-zinc-400">
                      • {l}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )
          })}
        </div>
      </SectionCard>

      <SectionCard>
        <CardTitle>پیمان مهندس AI</CardTitle>
        <p className="mb-2 text-[10.5px] text-zinc-400">
          اگر با همهٔ موارد موافقی، امضاشان کن — ببینیم چند «مهندس متعهد» اینجا هست.
        </p>
        <div className="space-y-1.5">
          {PLEDGE.map((p, i) => (
            <button
              key={p}
              onClick={() => togglePledge(i)}
              aria-pressed={pledge[i]}
              className="flex w-full items-start gap-2 rounded-xl border border-white/10 bg-black/20 p-2.5 text-right transition hover:border-white/25"
            >
              <CheckCircle2
                size={16}
                className={`mt-0.5 shrink-0 transition ${pledge[i] ? 'text-emerald-400' : 'text-zinc-600'}`}
                aria-hidden
              />
              <span className={`text-[11.5px] leading-5 ${pledge[i] ? 'font-bold text-zinc-100' : 'text-zinc-400'}`}>
                {p}
              </span>
            </button>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Badge variant="outline" className="border-white/15 text-[10px] text-zinc-300">
            {fa(signed)} از {fa(PLEDGE.length)} امضا شد
          </Badge>
          {signed === PLEDGE.length && (
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              <Badge className="bg-emerald-500/20 text-[10px] text-emerald-200 hover:bg-emerald-500/20">
                مهندس متعهد AI — رسمی!
              </Badge>
            </motion.div>
          )}
        </div>
      </SectionCard>

      <SectionCard>
        <CardTitle>آینده چی؟</CardTitle>
        <p className="text-[11.5px] leading-6 text-zinc-300">
          هیچ‌کس نمی‌داند مدل‌های ده سال دیگر چه شکلی‌اند؛ فقط یک چیز قطعی است: کسانی که «چطور
          فکر کردنِ» این ابزارها را می‌فهمند، فرق دارند با کسانی که فقط از آن‌ها دستور می‌گیرند.
          این آکادمی اولین قدمِ آن مسیر بود — پرسپترون تا عامل‌های هوشمند، همه از همان چند ضرب و جمع
          ساده شروع می‌شود.
        </p>
      </SectionCard>
    </div>
  )
}

/* ================================================================
   بخش ۹ — آزمون نهایی
   ================================================================ */

function QuizSection({ best, onSave }: { best: number; onSave: (score: number) => void }) {
  const pushToast = useOS((s) => s.pushToast)
  const [picks, setPicks] = useState<(number | null)[]>(() => QUIZ.map(() => null))
  const [submitted, setSubmitted] = useState(false)

  const score = picks.reduce<number>((s, p, i) => s + (p === QUIZ[i].answer ? 1 : 0), 0)
  const allPicked = picks.every((p) => p !== null)
  const passed = submitted && score >= 6

  const submit = () => {
    if (!allPicked || submitted) return
    setSubmitted(true)
    onSave(score)
    useGame.getState().registerQuiz('ai', 'quiz', score === QUIZ.length, score >= 6 ? 25 : 10)
    if (score >= 6) {
      pushToast({
        title: 'قبول شدی!',
        body: `امتیاز ${fa(score)} از ${fa(QUIZ.length)} در آزمون AI ثبت شد. با اسپانسری سان‌جاب`,
        icon: Trophy,
      })
    }
  }

  const retry = () => {
    setPicks(QUIZ.map(() => null))
    setSubmitted(false)
  }

  return (
    <div className="space-y-4">
      <SectionCard>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle>{fa(QUIZ.length)} سؤال — حداقل قبولی: {fa(6)}</CardTitle>
          {best > 0 && (
            <Badge variant="outline" className="ms-auto border-amber-500/40 text-[10px] text-amber-300">
              <Trophy size={10} aria-hidden />
              بهترین رکورد: {fa(best)}/{fa(QUIZ.length)}
            </Badge>
          )}
        </div>

        <div className="space-y-3">
          {QUIZ.map((q, qi) => (
            <div key={q.q} className="rounded-2xl border border-white/10 bg-black/25 p-3">
              <div className="flex items-start gap-2">
                <span
                  className="grid h-6 w-6 shrink-0 place-items-center rounded-lg text-[10px] font-black"
                  style={{ background: `${ORANGE}22`, color: ORANGE }}
                >
                  {fa(qi + 1)}
                </span>
                <p className="text-[12px] font-bold leading-6 text-zinc-100">{q.q}</p>
              </div>
              <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {q.options.map((opt, oi) => {
                  const picked = picks[qi] === oi
                  let cls = 'border-white/10 bg-black/20 text-zinc-300 hover:border-white/25'
                  if (!submitted && picked) cls = 'border-orange-400/60 bg-orange-400/10 text-white'
                  if (submitted && oi === q.answer) cls = 'border-emerald-500/60 bg-emerald-500/15 text-emerald-200'
                  else if (submitted && picked) cls = 'border-rose-500/60 bg-rose-500/10 text-rose-200'
                  else if (submitted) cls = 'border-white/5 bg-black/10 text-zinc-500'
                  return (
                    <button
                      key={opt}
                      onClick={() => {
                        if (submitted) return
                        setPicks((p) => p.map((v, j) => (j === qi ? oi : v)))
                      }}
                      aria-pressed={picked}
                      className={`flex items-start gap-2 rounded-xl border p-2 text-right text-[10.5px] leading-5 transition ${cls}`}
                    >
                      <span className="shrink-0 font-black">{QUIZ_LETTERS[oi]})</span>
                      <span className="min-w-0 flex-1">{opt}</span>
                    </button>
                  )
                })}
              </div>
              <AnimatePresence>
                {submitted && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2 flex items-start gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] p-2 text-[10px] leading-5 text-zinc-400">
                      <Lightbulb size={12} className="mt-0.5 shrink-0 text-amber-300" aria-hidden />
                      {q.why}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {!submitted ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={submit} disabled={!allPicked} className="text-[11px]" aria-label="ثبت پاسخ‌ها و پایان آزمون">
              <CheckCircle2 size={13} aria-hidden />
              پایان آزمون
            </Button>
            {!allPicked && (
              <span className="text-[10px] text-zinc-500">
                {fa(picks.filter((p) => p === null).length)} سؤال باقی مانده…
              </span>
            )}
          </div>
        ) : (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={retry} className="border-white/15 text-[11px] text-zinc-300" aria-label="دوباره دادن آزمون">
              <RotateCcw size={13} aria-hidden />
              آزمون دوباره
            </Button>
            <span className="text-[11px] text-zinc-400">
              امتیاز تو: <b className="text-zinc-100">{fa(score)} از {fa(QUIZ.length)}</b>
            </span>
          </div>
        )}

        <AnimatePresence>
          {passed && (
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
              className="mt-4 rounded-2xl border-2 border-amber-400/50 bg-gradient-to-l from-amber-500/15 via-zinc-900/60 to-orange-500/15 p-4 text-center"
            >
              <Trophy size={34} className="mx-auto text-amber-300" aria-hidden />
              <p className="mt-2 text-sm font-black text-amber-200">قبول شدی — مفاهیم اولیهٔ AI را بلدی!</p>
              <p className="mt-1 text-[10.5px] leading-5 text-zinc-400">
                امتیاز {fa(score)} از {fa(QUIZ.length)} ثبت شد{best > 0 && best >= score ? `؛ بهترین رکوردت: ${fa(best)}` : ' و رکورد جدیدی هم زدی'}.
                حالا برو و این چند ضرب و جمع ساده را به چیزهای بزرگ تبدیل کن.
              </p>
              <p className="mt-2 text-[9.5px] text-zinc-500">با اسپانسری سان‌جاب</p>
            </motion.div>
          )}
        </AnimatePresence>
      </SectionCard>
    </div>
  )
}

/* ================================================================
   اپ اصلی
   ================================================================ */

export default function AIAcademyApp() {
  const [progress, setProgress] = useState<AIProgress>(EMPTY_PROGRESS)
  const [view, setView] = useState<ViewId>('home')
  const pushToast = useOS((s) => s.pushToast)

  useEffect(() => {
    const t = window.setTimeout(() => setProgress(loadProgress()), 0)
    return () => window.clearTimeout(t)
  }, [])

  const update = useCallback((fn: (p: AIProgress) => AIProgress) => {
    setProgress((prev) => {
      const next = fn(prev)
      saveProgress(next)
      return next
    })
  }, [])

  const toggleDone = useCallback(
    (id: ViewId, title: string) => {
      update((p) => {
        const willBeDone = !p.done.includes(id)
        const done = willBeDone ? [...p.done, id] : p.done.filter((d) => d !== id)
        if (willBeDone) {
          useGame.getState().completeLesson('ai', id, 20)
          const finishedAll = done.length >= SECTIONS.length
          pushToast({
            title: finishedAll ? 'همهٔ مفاهیم AI را یاد گرفتی!' : `بخش «${title}» تمام شد!`,
            body: finishedAll
              ? 'از تورینگ تا ترنسفورمر را لمس کردی؛ مسیر یادگیری ادامه دارد. با اسپانسری سان‌جاب'
              : `${fa(SECTIONS.length - done.length)} بخش تا تسلط کامل باقی مانده. با اسپانسری سان‌جاب`,
            icon: Brain,
          })
        }
        return { ...p, done }
      })
    },
    [pushToast, update],
  )

  const saveQuizBest = useCallback(
    (score: number) => {
      update((p) => ({
        ...p,
        quizBest: Math.max(p.quizBest, score),
        done: score >= 6 && !p.done.includes('quiz') ? [...p.done, 'quiz'] : p.done,
      }))
    },
    [update],
  )

  const doneCount = SECTIONS.filter((s) => progress.done.includes(s.id)).length
  const pct = Math.round((doneCount / SECTIONS.length) * 100)

  const renderSection = (id: ViewId, node: ReactNode) => {
    const def = SECTIONS.find((s) => s.id === id)
    if (!def) return null
    return (
      <ChapterShell def={def} done={progress.done.includes(id)} onToggleDone={() => toggleDone(id, def.title)}>
        {node}
      </ChapterShell>
    )
  }

  const sidebarItem = (s: SectionDef) => {
    const Icon = s.icon
    const doneFlag = progress.done.includes(s.id)
    return (
      <button
        key={s.id}
        onClick={() => setView(s.id)}
        aria-current={view === s.id ? 'page' : undefined}
        className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-right text-xs transition ${
          view === s.id ? 'font-black text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
        }`}
        style={view === s.id ? { background: `${s.tint}26` } : undefined}
      >
        <span
          className="grid h-6 w-6 shrink-0 place-items-center rounded-lg"
          style={{ background: `${s.tint}22`, color: s.tint }}
        >
          <Icon size={13} aria-hidden />
        </span>
        <span className="min-w-0 flex-1 truncate">{s.title}</span>
        {doneFlag && <CheckCircle2 size={13} className="shrink-0 text-emerald-400" aria-hidden />}
      </button>
    )
  }

  return (
    <div className="flex h-full w-full flex-col bg-zinc-950/70">
      {/* هدر */}
      <header className="sticky top-0 z-20 shrink-0 border-b border-white/10 bg-zinc-950/85 backdrop-blur">
        <div className="flex h-16 items-center gap-3 px-4">
          <span
            className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-white/15 bg-black/40"
            style={{ color: ORANGE }}
          >
            <GraduationCap size={20} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-black text-white sm:text-base">
              آکادمی هوش مصنوعی <span className="text-[10px] font-bold text-orange-300">— مفاهیم اولیه</span>
            </h1>
            <p className="hidden text-[10.5px] text-zinc-400 sm:block">
              از پرسپترون تا مدل زبانی — با آزمایش‌های تعاملی
            </p>
          </div>
          {progress.quizBest > 0 && (
            <Badge variant="outline" className="hidden shrink-0 border-amber-500/40 text-[9.5px] text-amber-300 sm:flex">
              <Trophy size={10} aria-hidden />
              رکورد: {fa(progress.quizBest)}/{fa(QUIZ.length)}
            </Badge>
          )}
          <div className="flex w-28 shrink-0 items-center gap-2 sm:w-44">
            <Progress value={pct} className="h-1.5 flex-1" aria-label={`پیشرفت دوره: ${pct} درصد`} />
            <span className="text-[10px] font-black text-orange-300">{fa(pct)}٪</span>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col">
        {/* تب فصل‌ها در موبایل */}
        <div
          className="os-scroll flex shrink-0 gap-1 overflow-x-auto border-b border-white/10 bg-black/40 px-2 py-1.5 md:hidden"
          role="tablist"
          aria-label="بخش‌های آکادمی هوش مصنوعی"
        >
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              role="tab"
              aria-selected={view === s.id}
              onClick={() => setView(s.id)}
              className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold transition ${
                view === s.id ? 'border-transparent bg-orange-500/90 text-white' : 'border-white/10 bg-zinc-800/80 text-zinc-300'
              }`}
            >
              {s.short}
            </button>
          ))}
        </div>

        <div className="flex min-h-0 flex-1">
          {/* سایدبار */}
          <nav
            className="os-scroll hidden w-52 shrink-0 space-y-0.5 overflow-y-auto border-l border-white/10 bg-black/25 p-2 md:block"
            aria-label="بخش‌های آکادمی هوش مصنوعی"
          >
            {SECTIONS.map(sidebarItem)}
            <p className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-center text-[9.5px] leading-4 text-zinc-500">
              هر بخش یک آزمایش تعاملی دارد؛ دست بزن تا یاد بگیری.
              <br />
              با اسپانسری سان‌جاب
            </p>
          </nav>

          {/* محتوا */}
          <main className="os-scroll min-w-0 flex-1 overflow-y-auto p-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={view}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.16 }}
                className="mx-auto max-w-3xl"
              >
                {view === 'home' && renderSection('home', <HomeSection onNavigate={setView} />)}
                {view === 'perceptron' && renderSection('perceptron', <PerceptronSection />)}
                {view === 'gradient' && renderSection('gradient', <GradientSection />)}
                {view === 'activations' && renderSection('activations', <ActivationsSection />)}
                {view === 'network' && renderSection('network', <NetworkSection />)}
                {view === 'llm' && renderSection('llm', <LLMSection />)}
                {view === 'overfit' && renderSection('overfit', <OverfitSection />)}
                {view === 'ethics' && renderSection('ethics', <EthicsSection />)}
                {view === 'lab' && renderSection('lab', <NNLab />)}
                {view === 'tokenizer' && renderSection('tokenizer', <TokenizerLab />)}
                {view === 'attention' && renderSection('attention', <AttentionLab />)}
                {view === 'rag' && renderSection('rag', <RagLab />)}
                {view === 'quiz' && renderSection('quiz', <QuizSection best={progress.quizBest} onSave={saveQuizBest} />)}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  )
}
