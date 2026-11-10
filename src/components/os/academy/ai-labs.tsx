'use client'

/* ==================================================================
   آکادمی هوش مصنوعی، آزمایشگاه‌های تعاملی (SanjabOS)
   سه آزمایشگاه خودکفا: TokenizerLab (BPE واقعی روی پیکرهٔ دوزبانه) ·
   AttentionLab (خودتوجهی مقیاس‌شده با اعداد واقعی) · RagLab (بازیابی-
   تولید روی ۶ سند اسباب‌بازی). بدون وابستگی به ai-academy؛ همهٔ
   محاسبات محلی و قطعی (deterministic) است، بدون سرور.
   با اسپانسری سان‌جاب
   ================================================================== */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  AlertTriangle, Binary, FastForward, FileSearch, Info, ListOrdered, Network,
  Play, RefreshCw, Scissors, Search, Sparkles, StepForward, Thermometer,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

/* ================================================================
   پالت و ابزارهای پایه (فقط رنگ‌های مجاز، آبی/ایندیگو ممنوع)
   ================================================================ */

const AMBER = '#f59e0b'
const ORANGE = '#f7931e'
const ROSE = '#f43f5e'
const PURPLE = '#a855f7'
const CYAN = '#22d3ee'
const EMERALD = '#34d399'

/** تبدیل عدد به رقم فارسی */
const fa = (n: number) => n.toLocaleString('fa-IR')

/* ================================================================
   ابزارهای مشترک فارسی (نرمال‌سازی + توکنایز + ایست‌واژه‌ها)
   ================================================================ */

/** هر چیزی که نویسهٔ فارسی/لاتین/رقم نیست، جداکننده است */
const NON_WORD_RE = /[^\u0600-\u06FFa-z0-9]+/

/** نرمال‌سازی متون فارسی: یکدست‌سازی ي/ی و ك/ک، حذف نیم‌فاصله و اعراب */
function normalizeFa(input: string): string {
  return input
    .toLowerCase()
    .replace(/[\u200c\u200e\u200f]/g, ' ') // نیم‌فاصله و نشانه‌های جهت → فاصله
    .replace(/[يى]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[\u0640\u064b-\u0652\u0670]/g, '') // کشیده و اعراب
}

/** توکنایز ساده بر اساس نویسه‌ها */
function tokenizeFa(input: string): string[] {
  return normalizeFa(input)
    .split(NON_WORD_RE)
    .filter(Boolean)
}

/** ایست‌واژه‌های پرتکرار فارسی که سیگنال معنایی ندارند */
const FA_STOPWORDS = new Set([
  'از', 'به', 'با', 'در', 'که', 'را', 'و', 'این', 'آن', 'برای', 'است',
  'هست', 'بر', 'تا', 'نیز', 'یا', 'هم', 'می', 'شود', 'ها', 'من',
])

/** توکن‌های معنادار (بدون ایست‌واژه) */
function contentTokens(input: string): string[] {
  return tokenizeFa(input).filter((t) => t.length > 1 && !FA_STOPWORDS.has(t))
}

/** مولد اعداد شبه‌تصادفی دانه‌دار (mulberry32)، خروجی کاملاً قطعی */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/* ================================================================
   اجزای کمکی مشترک UI (سبک هماهنگ با اپ‌های OS)
   ================================================================ */

function LabCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-white/10 bg-zinc-900/60 p-3 ${className}`}>{children}</div>
}

function LabHeader({ icon: Icon, tint, title, en }: { icon: LucideIcon; tint: string; title: string; en: string }) {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl" style={{ background: `${tint}22`, color: tint }}>
        <Icon size={18} aria-hidden />
      </span>
      <div className="min-w-0">
        <h3 className="text-[13px] font-black text-zinc-100">{title}</h3>
        <p dir="ltr" className="text-right font-mono text-[9px] tracking-wide text-zinc-500">
          {en}
        </p>
      </div>
    </div>
  )
}

function LabCode({ children }: { children: ReactNode }) {
  return (
    <code
      dir="ltr"
      className="inline-block rounded-lg border border-white/10 bg-black/40 px-2 py-1 font-mono text-[10.5px] leading-4 text-cyan-300"
    >
      {children}
    </code>
  )
}

/** برچسب صداقت آموزشی، الزام هر آزمایشگاه */
function HonestyNote({ children }: { children?: ReactNode }) {
  return (
    <div className="mt-3 space-y-1 rounded-xl border border-dashed border-amber-400/30 bg-amber-400/5 p-2.5 text-[10px] leading-5 text-amber-200/85">
      <p className="flex items-start gap-1.5">
        <AlertTriangle size={12} className="mt-0.5 shrink-0" aria-hidden />
        <span>این یک پیاده‌سازی آموزشی کوچک است، نه مدل تولیدی.</span>
      </p>
      {children ? <p className="ps-5 text-zinc-400">{children}</p> : null}
      <p className="ps-5 text-[8.5px] text-zinc-600">با اسپانسری سان‌جاب</p>
    </div>
  )
}

function Stat({ label, value, tint }: { label: string; value: string; tint?: string }) {
  return (
    <div className="flex-1 rounded-xl border border-white/10 bg-black/30 px-2 py-1.5 text-center">
      <div dir="ltr" className="font-mono text-[13px] font-black" style={{ color: tint ?? '#e4e4e7' }}>
        {value}
      </div>
      <div className="text-[9px] text-zinc-500">{label}</div>
    </div>
  )
}

function MiniBar({ pct, color, reduce }: { pct: number; color: string; reduce: boolean }) {
  return (
    <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-white/5">
      <motion.div
        className="h-full rounded-full"
        style={{ background: color }}
        initial={reduce ? false : { width: 0 }}
        animate={{ width: `${Math.round(Math.min(1, Math.max(0, pct)) * 100)}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
    </div>
  )
}

/* ================================================================
   آزمایشگاه ۱، توکنایزر BPE (Byte-Pair Encoding)
   یادگیری ادغام‌ها روی پیکرهٔ کوچک دوزبانه؛ اعمال قدم‌به‌قدم روی جملهٔ شما
   ================================================================ */

/** پیکرهٔ کوچک: ۱۰ جملهٔ دوزبانه (فارسی + انگلیسی ساده) */
const BPE_CORPUS: string[] = [
  'هوش مصنوعی آینده است', 'یادگیری ماشین جذاب است', 'ماشین‌های هوشمند داده می‌خورند',
  'داده‌ها سوخت هوش مصنوعی هستند', 'هوش مصنوعی از داده یاد می‌گیرد', 'آینده از آن یادگیرندگان است',
  'the cat sat on the mat', 'a smart cat learns fast',
  'the future of machine learning', 'learning machines learn from data',
]

const BPE_MAX_MERGES = 30

interface BpeMerge {
  a: string
  b: string
  token: string
  freq: number
}

interface BpeStepInfo {
  affected: number
  hadEffect: boolean
}

/** پیش‌توکنایز: شکستن به واژه و بعد به نویسه (لاتین → حروف کوچک) */
function pretokenize(text: string): string[][] {
  return normalizeFa(text)
    .split(NON_WORD_RE)
    .filter(Boolean)
    .map((w) => Array.from(w))
}

/**
 * آموزش BPE: در هر گام، پرتکرارترین جفت توکنِ کنارِ هم در کل پیکره پیدا و
 * در همهٔ واژه‌ها ادغام می‌شود (تعداد فراوانی وزن‌دار با بسامد واژه‌ها).
 */
function trainBpe(wordFreqs: Array<[string, number]>, maxMerges: number): BpeMerge[] {
  const words = wordFreqs.map(([w, f]) => ({ parts: Array.from(w) as string[], freq: f }))
  const merges: BpeMerge[] = []
  for (let step = 0; step < maxMerges; step++) {
    const pairFreq = new Map<string, number>()
    for (const w of words) {
      for (let i = 0; i < w.parts.length - 1; i++) {
        const key = `${w.parts[i]}\u0000${w.parts[i + 1]}`
        pairFreq.set(key, (pairFreq.get(key) ?? 0) + w.freq)
      }
    }
    let bestKey = ''
    let bestF = 1
    for (const [key, f] of pairFreq) {
      if (f < 2) continue // ادغامِ تک‌بار بی‌فایده است
      if (f > bestF || (f === bestF && key < bestKey)) {
        bestKey = key
        bestF = f
      }
    }
    if (!bestKey) break
    const sep = bestKey.indexOf('\u0000')
    const a = bestKey.slice(0, sep)
    const b = bestKey.slice(sep + 1)
    const token = a + b
    for (const w of words) {
      const out: string[] = []
      for (let i = 0; i < w.parts.length; i++) {
        if (i < w.parts.length - 1 && w.parts[i] === a && w.parts[i + 1] === b) {
          out.push(token)
          i++
        } else {
          out.push(w.parts[i])
        }
      }
      w.parts = out
    }
    merges.push({ a, b, token, freq: bestF })
  }
  return merges
}

/** اعمال یک ادغام روی توالی توکن‌های جملهٔ کاربر */
function applyMerge(words: string[][], m: BpeMerge): { words: string[][]; affected: number } {
  let affected = 0
  const next = words.map((w) => {
    const out: string[] = []
    for (let i = 0; i < w.length; i++) {
      if (i < w.length - 1 && w[i] === m.a && w[i + 1] === m.b) {
        out.push(m.token)
        affected++
        i++
      } else {
        out.push(w[i])
      }
    }
    return out
  })
  return { words: next, affected }
}

/** رنگ ثابت هر توکن بر اساس هش متنش */
const CHIP_TINTS = [
  'border-amber-400/40 bg-amber-400/15 text-amber-200', 'border-orange-400/40 bg-orange-400/15 text-orange-200',
  'border-rose-400/40 bg-rose-400/15 text-rose-200', 'border-purple-400/40 bg-purple-400/15 text-purple-200',
  'border-cyan-400/40 bg-cyan-400/15 text-cyan-200', 'border-emerald-400/40 bg-emerald-400/15 text-emerald-200',
]

function tintOf(token: string): string {
  let h = 0
  for (let i = 0; i < token.length; i++) h = (h * 31 + token.charCodeAt(i)) >>> 0
  return CHIP_TINTS[h % CHIP_TINTS.length]
}

export function TokenizerLab() {
  const reduceMotion = useReducedMotion() ?? false
  const [input, setInput] = useState('هوش مصنوعی داده‌ها را یاد می‌گیرد')
  const [vocabTarget, setVocabTarget] = useState(64)
  const [started, setStarted] = useState(false)
  const [initWords, setInitWords] = useState<string[][]>([])
  const [step, setStep] = useState(0)

  /** بسامد واژه‌های پیکره */
  const corpusFreqs = useMemo<Array<[string, number]>>(() => {
    const freq = new Map<string, number>()
    for (const s of BPE_CORPUS) {
      for (const w of normalizeFa(s).split(NON_WORD_RE)) {
        if (w) freq.set(w, (freq.get(w) ?? 0) + 1)
      }
    }
    return Array.from(freq.entries())
  }, [])

  /** الفبای پایه: نویسه‌های یکتای پیکره */
  const baseChars = useMemo<string[]>(() => {
    const set = new Set<string>()
    for (const [w] of corpusFreqs) for (const ch of w) set.add(ch)
    return Array.from(set).sort()
  }, [corpusFreqs])

  /** اندازهٔ واژه‌نامه = پایه + ادغام‌ها → سقف ادغام مجاز */
  const maxMerges = Math.max(0, Math.min(BPE_MAX_MERGES, vocabTarget - baseChars.length))

  /** فهرست کامل ادغام‌های یادگرفته‌شده (قطعی) */
  const merges = useMemo<BpeMerge[]>(() => trainBpe(corpusFreqs, maxMerges), [corpusFreqs, maxMerges])

  /** توالی توکن‌های جملهٔ کاربر بعد از اعمال `step` ادغام اول */
  const { words, infos } = useMemo<{ words: string[][]; infos: BpeStepInfo[] }>(() => {
    let cur = initWords
    const stepInfos: BpeStepInfo[] = []
    for (let i = 0; i < step && i < merges.length; i++) {
      const r = applyMerge(cur, merges[i])
      cur = r.words
      stepInfos.push({ affected: r.affected, hadEffect: r.affected > 0 })
    }
    return { words: cur, infos: stepInfos }
  }, [initWords, step, merges])

  /** شناسه‌های توکن: نویسه‌های پایه، بعد توکن‌های ادغامی، بعد نویسه‌های ناشناخته */
  const tokenIds = useMemo<Map<string, number>>(() => {
    const map = new Map<string, number>()
    baseChars.forEach((c, i) => map.set(c, i))
    let next = baseChars.length
    for (const m of merges) if (!map.has(m.token)) map.set(m.token, next++)
    for (const w of words) for (const t of w) if (!map.has(t)) map.set(t, next++)
    return map
  }, [baseChars, merges, words])

  const charCount = initWords.reduce((n, w) => n + w.length, 0)
  const tokenCount = words.reduce((n, w) => n + w.length, 0)
  const ratio = tokenCount > 0 ? charCount / tokenCount : 1

  const run = () => {
    setInitWords(pretokenize(input))
    setStep(0)
    setStarted(true)
  }

  const lastMerge = step > 0 && step <= merges.length ? merges[step - 1] : null
  const lastInfo = step > 0 ? infos[step - 1] : undefined
  const finished = step >= merges.length

  const spring = reduceMotion ? { duration: 0 } : { type: 'spring' as const, stiffness: 520, damping: 30 }

  return (
    <div className="space-y-3">
      <LabCard>
        <LabHeader icon={Scissors} tint={AMBER} title="آزمایشگاه توکنایزر" en="Byte-Pair Encoding (BPE)" />

        {/* توضیح ۳ خطی BPE */}
        <div className="rounded-xl border border-white/10 bg-black/25 p-2.5">
          <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold text-amber-200">
            <Binary size={12} aria-hidden />
            BPE در سه خط
          </div>
          <ol className="list-inside list-decimal space-y-0.5 text-[10.5px] leading-5 text-zinc-300">
            <li>جمله اول به «واژه» و هر واژه به «نویسه» شکسته می‌شود.</li>
            <li>در کل پیکره، پرتکرارترین جفتِ توکنِ کنارِ هم پیدا و در یک توکن جدید ادغام می‌شود؛ این مرحله بارها تکرار می‌شود.</li>
            <li>واژه‌نامه = نویسه‌های پایه + توکن‌های ادغامی. GPT هم همین را، در مقیاس میلیاردی، انجام می‌دهد.</li>
          </ol>
        </div>

        {/* ورودی کاربر */}
        <Textarea
          value={input} onChange={(e) => setInput(e.target.value)} rows={2} aria-label="جمله برای توکنایز"
          className="mt-2.5 border-white/10 bg-black/35 text-[12px] leading-6 text-zinc-100"
        />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Button
            size="sm" onClick={run} className="bg-amber-500/90 text-[11px] text-zinc-950 hover:bg-amber-400"
            aria-label="اجرای توکنایزر روی جمله"
          >
            <Play size={13} aria-hidden />
            اجرا
          </Button>
          <span className="text-[9.5px] text-zinc-500">پس از تغییر متن، دوباره «اجرا» را بزن.</span>
        </div>

        {/* اسلایدر واژه‌نامه */}
        <div className="mt-2.5 rounded-xl border border-white/10 bg-black/25 p-2.5">
          <div className="mb-1 flex items-center justify-between text-[10px] text-zinc-400">
            <span>اندازهٔ واژه‌نامهٔ هدف (vocab size)</span>
            <span dir="ltr" className="font-mono text-zinc-200">
              {fa(vocabTarget)}
            </span>
          </div>
          <Slider
            value={[vocabTarget]} min={20} max={120} step={1}
            onValueChange={(v) => setVocabTarget(v[0])} aria-label="اندازهٔ واژه‌نامه"
          />
          <p className="mt-1.5 text-[9.5px] leading-4 text-zinc-500">
            الفبای پایهٔ پیکره: {fa(baseChars.length)} نویسه · سقف ادغام: {fa(BPE_MAX_MERGES)} · ادغام مجاز فعلی:{' '}
            <b className="text-amber-300">{fa(maxMerges)}</b>، واژه‌نامه = پایه + ادغام‌ها.
          </p>
          {maxMerges === 0 && (
            <p className="mt-1 text-[9.5px] text-rose-300">
              هدف واژه‌نامه از الفبای پایه کوچک‌تر است؛ هیچ ادغامی انجام نمی‌شود (واژه‌نامه نمی‌تواند از الفبا کوچک‌تر باشد).
            </p>
          )}
        </div>
      </LabCard>

      <LabCard>
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-200">
            <ListOrdered size={13} className="text-amber-300" aria-hidden />
            توالی توکن‌ها (ادغام قدم‌به‌قدم)
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Button
              size="sm" variant="outline" disabled={!started || finished}
              onClick={() => setStep((s) => Math.min(s + 1, merges.length))}
              className="border-white/15 text-[10.5px] text-zinc-300" aria-label="اعمال ادغام بعدی"
            >
              <StepForward size={13} aria-hidden />
              گام بعد
            </Button>
            <Button
              size="sm" variant="outline" disabled={!started || finished}
              onClick={() => setStep(merges.length)}
              className="border-white/15 text-[10.5px] text-zinc-300" aria-label="اجرای همهٔ ادغام‌ها"
            >
              <FastForward size={13} aria-hidden />
              ادامه تا انتها
            </Button>
            <Button
              size="sm" variant="outline" disabled={!started}
              onClick={() => setStep(0)}
              className="border-white/15 text-[10.5px] text-zinc-300" aria-label="بازگشت به نویسه‌ها"
            >
              <RefreshCw size={13} aria-hidden />
              از ابتدا
            </Button>
          </div>
        </div>

        {/* توالی چیپ‌ها */}
        <div className="min-h-16 rounded-xl border border-white/10 bg-black/25 p-2.5">
          {!started ? (
            <p className="text-[10.5px] text-zinc-500">دکمهٔ «اجرا» را بزن تا جمله به نویسه‌ها شکسته شود.</p>
          ) : initWords.length === 0 ? (
            <p className="text-[10.5px] text-rose-300">متنی برای توکنایز پیدا نشد، جمله‌ای بنویس و اجرا کن.</p>
          ) : (
            <div className="flex flex-wrap items-start gap-2">
              {words.map((w, wi) => (
                <motion.div
                  layout
                  key={`w${wi}`}
                  transition={spring}
                  className="flex max-w-full flex-wrap items-center gap-1 rounded-xl border border-white/10 bg-black/40 p-1.5"
                >
                  <AnimatePresence initial={false} mode="popLayout">
                    {w.map((t, ti) => (
                      <motion.span
                        key={`${wi}-${ti}-${t}`}
                        layout
                        initial={reduceMotion ? false : { scale: 0.4, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={reduceMotion ? undefined : { scale: 0.3, opacity: 0 }}
                        transition={spring}
                        className={`flex flex-col items-center rounded-lg border px-1.5 py-0.5 ${tintOf(t)} ${
                          lastMerge && t === lastMerge.token ? 'ring-2 ring-emerald-400/70' : ''
                        }`}
                      >
                        <span className="text-[11px] font-bold leading-4">{t}</span>
                        <span dir="ltr" className="font-mono text-[7px] leading-3 opacity-60">
                          #{tokenIds.get(t) ?? 0}
                        </span>
                      </motion.span>
                    ))}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          )}
          <p className="mt-2 text-[9px] leading-4 text-zinc-600">هر رنگ یک توکن است · حلقهٔ سبز = ادغام تازه · عدد ریز زیر هر چیپ = شناسهٔ توکن در واژه‌نامه</p>
        </div>

        {/* خط توضیح گام */}
        <div className="mt-2 rounded-xl border border-amber-400/20 bg-amber-400/5 p-2.5 text-[10.5px] leading-5 text-amber-100/90">
          {!started ? (
            <p>اول «اجرا»، بعد «گام بعد»، هر گام پرتکرارترین جفت را در پیکره پیدا و همه‌جا ادغام می‌کند.</p>
          ) : finished && merges.length === 0 ? (
            <p>با این اندازهٔ واژه‌نامه ادغامی مجاز نیست، اسلایدر را بالاتر ببر.</p>
          ) : finished ? (
            <p>
              تمام {fa(merges.length)} ادغامِ مجاز انجام شد. واژه‌نامه نهایی:{' '}
              {fa(baseChars.length + merges.length)} توکن (پایه + ادغام‌ها).
            </p>
          ) : lastMerge && lastInfo ? (
            lastInfo.hadEffect ? (
              <p>
                ادغام شماره {fa(step)}: جفت «{lastMerge.a} + {lastMerge.b}» با بسامد {fa(lastMerge.freq)} در پیکره، به
                توکن «{lastMerge.token}» تبدیل شد، در جملهٔ تو هم {fa(lastInfo.affected)} جایگاه ادغام شد.
              </p>
            ) : (
              <p>
                ادغام شماره {fa(step)}: جفت «{lastMerge.a} + {lastMerge.b}» ({fa(lastMerge.freq)} بار در پیکره) فقط
                واژه‌نامه را می‌سازد، این جفت در جملهٔ تو نبود.
              </p>
            )
          ) : (
            <p>توالی فعلی همان نویسه‌های اولیه است، «گام بعد» را بزن.</p>
          )}
        </div>

        {/* جدول ادغام‌ها */}
        <div className="mt-2">
          <div className="mb-1 text-[10px] font-bold text-zinc-300">جدول ادغام‌ها (به‌صورت زنده ساخته می‌شود)</div>
          <div className="os-scroll max-h-44 overflow-y-auto rounded-xl border border-white/10">
            <table className="w-full text-right text-[10px]">
              <thead className="sticky top-0 bg-zinc-800/90 text-zinc-400">
                <tr>
                  <th className="p-1.5 font-medium">رتبه</th>
                  <th className="p-1.5 font-medium">جفت</th>
                  <th className="p-1.5 font-medium">توکن جدید</th>
                  <th className="p-1.5 font-medium">بسامد در پیکره</th>
                  <th className="p-1.5 font-medium">در جملهٔ شما</th>
                </tr>
              </thead>
              <tbody>
                {merges.slice(0, step).map((m, i) => (
                  <tr key={m.token} className="border-t border-white/5">
                    <td dir="ltr" className="p-1.5 text-center font-mono text-zinc-500">
                      {fa(i + 1)}
                    </td>
                    <td dir="ltr" className="p-1.5 font-mono text-zinc-300">
                      {m.a} + {m.b}
                    </td>
                    <td className="p-1.5 font-bold text-amber-200">{m.token}</td>
                    <td dir="ltr" className="p-1.5 text-center font-mono text-zinc-400">
                      ×{fa(m.freq)}
                    </td>
                    <td dir="ltr" className="p-1.5 text-center font-mono text-emerald-300">
                      {infos[i] ? fa(infos[i].affected) : '—'}
                    </td>
                  </tr>
                ))}
                {step === 0 && (
                  <tr>
                    <td colSpan={5} className="p-3 text-center text-[10px] text-zinc-600">
                      هنوز ادغامی اعمال نشده، ستون‌ها با هر «گام بعد» پر می‌شوند.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* آمار */}
        <div className="mt-2.5 flex gap-2">
          <Stat label="نویسه‌ها (بدون فاصله)" value={fa(charCount)} tint={CYAN} />
          <Stat label="توکن‌های فعلی" value={fa(tokenCount)} tint={AMBER} />
          <Stat label="نسبت فشردگی" value={`${fa(+ratio.toFixed(2))}×`} tint={EMERALD} />
        </div>
        <p className="mt-1.5 text-[9px] leading-4 text-zinc-600">
          نسبت ۱٫۰۰ یعنی هنوز هیچ ادغامی رخ نداده؛ هرچه کوچک‌تر شود، توکن‌ها «چرب‌تر» شده‌اند. نویسه‌های خارج از واژه‌نامه به‌صورت توکن تک‌نویسه با شناسهٔ جدید می‌مانند (byte-fallback ساده).
        </p>

        <HonestyNote>
          تفاوت با توکنایزرهای واقعی: آنها byte-level BPE را روی تریلیون‌ها توکن اجرا می‌کنند و حتی مرز واژه‌ها را هم
          ادغام می‌کنند؛ پیکرهٔ اینجا فقط {fa(BPE_CORPUS.length)} جمله است و مرز واژه‌ها دست‌نخورده می‌ماند.
        </HonestyNote>
      </LabCard>
    </div>
  )
}

/* ================================================================
   آزمایشگاه ۲، خودتوجهی (Self-Attention)
   توجه مقیاس‌شدهٔ واقعی روی ۶ توکن فارسی با بردارهای ثابت ۸بعدی
   ================================================================ */

const ATTN_WORDS = ['پسر', 'توپ', 'را', 'به', 'دروازه‌بان', 'داد']
const ATTN_DK = 8

/**
 * بردارهای تعبیه: ترکیب «مؤلفه معنایی ثابت» (اسم‌ها/فعل/نقش‌نما/حرف اضافه)
 * + «نویز شبه‌تصادفی دانه‌دار»، کاملاً قطعی و تکرارپذیر.
 */
function buildAttentionEmbeddings(): number[][] {
  const groups: number[][] = [
    [0, 1], // پسر، اسم
    [0, 1], // توپ، اسم
    [4, 5], // را، نقش‌نمای مفعول
    [6, 7], // به، حرف اضافه
    [0, 1], // دروازه‌بان، اسم
    [2, 3], // داد، فعل
  ]
  const lean: Array<Record<number, number>> = [
    {},
    { 2: 0.35 }, // توپ کمی به فضای فعلی متمایل است
    { 0: 0.85 }, // «را» به اسم‌ها وصل می‌شود
    { 0: 0.85, 1: 0.25 }, // «به» هم به اسم‌ها وصل می‌شود
    {},
    { 2: 0.35 },
  ]
  return ATTN_WORDS.map((_, i) => {
    const rnd = mulberry32(90210 + i * 131)
    const v = new Array<number>(ATTN_DK).fill(0)
    for (const d of groups[i]) v[d] += 1.15
    for (const [d, b] of Object.entries(lean[i])) v[Number(d)] += b
    for (let d = 0; d < ATTN_DK; d++) v[d] += (rnd() * 2 - 1) * 0.55
    const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1
    return v.map((x) => x / norm)
  })
}

const ATTN_EMB = buildAttentionEmbeddings()

interface AttnRow {
  dots: number[]
  scaled: number[]
  temped: number[]
  exps: number[]
  weights: number[]
}

/** توجه مقیاس‌شدهٔ واقعی برای یک سطر: softmax((q·k / √dₖ) / T) */
function attentionRow(qi: number, temp: number): AttnRow {
  const q = ATTN_EMB[qi]
  const dots = ATTN_EMB.map((k) => k.reduce((s, x, j) => s + x * q[j], 0))
  const scaled = dots.map((d) => d / Math.sqrt(ATTN_DK))
  const temped = scaled.map((s) => s / temp)
  const exps = temped.map((t) => Math.exp(t))
  const sum = exps.reduce((a, b) => a + b, 0)
  return { dots, scaled, temped, exps, weights: exps.map((e) => e / sum) }
}

export function AttentionLab() {
  const reduceMotion = useReducedMotion() ?? false
  const [query, setQuery] = useState(1) // «توپ»
  const [temp, setTemp] = useState(1)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const chipRefs = useRef<Array<HTMLButtonElement | null>>([])
  const [box, setBox] = useState({ w: 0, h: 0 })
  const [anchors, setAnchors] = useState<Array<{ x: number; y: number }>>([])

  const row = useMemo(() => attentionRow(query, temp), [query, temp])
  const matrix = useMemo(() => ATTN_WORDS.map((_, qi) => attentionRow(qi, temp).weights), [temp])

  /** اندازه‌گیری دقیق موقعیت چیپ‌ها برای کشیدن خطوط SVG */
  const measure = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const cr = el.getBoundingClientRect()
    setBox({ w: cr.width, h: cr.height })
    setAnchors(
      chipRefs.current.map((c) => {
        if (!c) return { x: 0, y: 0 }
        const r = c.getBoundingClientRect()
        return { x: r.left - cr.left + r.width / 2, y: r.bottom - cr.top }
      }),
    )
  }, [])

  useLayoutEffect(() => {
    measure()
    const el = containerRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => measure())
    ro.observe(el)
    return () => ro.disconnect()
  }, [measure])

  useEffect(() => {
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts
    fonts?.ready.then(() => measure()).catch(() => {})
  }, [measure])

  /** مسیر خمیدهٔ توجه از Query به هر Key */
  const curveFor = (k: number): string => {
    const a = anchors[query]
    const b = anchors[k]
    if (!a || !b || !box.w) return ''
    if (k === query) {
      // حلقهٔ توجه به خود
      return `M ${a.x} ${a.y} C ${a.x - 18} ${a.y + 30}, ${a.x + 18} ${a.y + 30}, ${a.x} ${a.y}`
    }
    const mx = (a.x + b.x) / 2
    const cy = Math.max(a.y, b.y) + 22 + 55 * (Math.abs(a.x - b.x) / Math.max(box.w, 1))
    return `M ${a.x} ${a.y} Q ${mx} ${cy} ${b.x} ${b.y}`
  }

  const qVals = ATTN_EMB[query].map((x) => `${x >= 0 ? '+' : ''}${x.toFixed(2)}`).join('  ')
  const expSum = row.exps.reduce((a, b) => a + b, 0)

  return (
    <div className="space-y-3">
      <LabCard>
        <LabHeader icon={Network} tint={PURPLE} title="آزمایشگاه خودتوجهی" en="Self-Attention · Scaled Dot-Product" />

        <p className="text-[10.5px] leading-5 text-zinc-300">
          جملهٔ نمونه: <b className="text-zinc-100">پسر توپ را به دروازه‌بان داد</b>، هر توکن یک بردار ثابت ۸بعدی دارد.
          امتیاز توجه = حاصل‌ضرب داخلی دو بردار تقسیم بر √۸، بعد softmax سطر به سطر:
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          <LabCode>score(q,k) = q·k / √dₖ</LabCode>
          <LabCode>weights = softmax(score / T)</LabCode>
        </div>

        {/* چیپ‌های توکن + خطوط توجه */}
        <div ref={containerRef} className="relative mt-3">
          <svg className="pointer-events-none absolute inset-0 z-0 h-full w-full" aria-hidden>
            {anchors.map((_, k) => {
              const d = curveFor(k)
              if (!d) return null
              const w = row.weights[k]
              return (
                <motion.path
                  key={`${query}-${k}`}
                  d={d}
                  fill="none"
                  stroke={EMERALD}
                  strokeOpacity={0.2 + 0.8 * w}
                  strokeWidth={0.8 + 6 * w}
                  strokeLinecap="round"
                  initial={reduceMotion ? false : { pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.55, ease: 'easeOut' }}
                />
              )
            })}
          </svg>
          <div className="relative z-10 flex flex-wrap gap-1.5">
            {ATTN_WORDS.map((w, i) => (
              <button
                key={w}
                ref={(el) => {
                  chipRefs.current[i] = el
                }}
                type="button"
                onClick={() => setQuery(i)}
                aria-pressed={query === i}
                aria-label={`انتخاب ${w} به‌عنوان Query`}
                className={`min-h-9 rounded-xl border px-3 py-1.5 text-[11.5px] font-bold transition ${
                  query === i
                    ? 'border-amber-400 bg-amber-400/20 text-amber-100 ring-2 ring-amber-400/60'
                    : 'border-white/15 bg-black/35 text-zinc-200 hover:border-white/35'
                }`}
              >
                {w}
              </button>
            ))}
          </div>
          <div className="h-20" aria-hidden />
        </div>
        <p className="-mt-1 text-[9px] leading-4 text-zinc-600">ضخامت و پررنگی خط = وزن توجه · حلقهٔ کهربایی = توکن Query · خط چرخیده = توجه توکن به خودش</p>
      </LabCard>

      <LabCard>
        {/* نقشهٔ حرارتی توجه */}
        <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold text-zinc-200">
          <Thermometer size={13} className="text-purple-300" aria-hidden />
          نقشهٔ حرارتی توجه (سطر = Query، ستون = Key)
        </div>
        <div className="os-scroll overflow-x-auto">
          <table className="w-full min-w-[330px] border-separate border-spacing-0.5 text-[9px]">
            <thead>
              <tr>
                <th className="p-1 text-zinc-600">
                  <span dir="ltr" className="font-mono">Q\K</span>
                </th>
                {ATTN_WORDS.map((w) => (
                  <th key={w} className="p-1 font-medium text-zinc-400">{w}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((rw, qi) => (
                <tr key={ATTN_WORDS[qi]}>
                  <th className="p-0.5">
                    <button
                      type="button"
                      onClick={() => setQuery(qi)}
                      aria-label={`انتخاب ${ATTN_WORDS[qi]} به‌عنوان Query`}
                      className={`w-full rounded-md px-1 py-1 font-bold transition ${
                        qi === query ? 'bg-amber-400/20 text-amber-200' : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {ATTN_WORDS[qi]}
                    </button>
                  </th>
                  {rw.map((w, ki) => (
                    <td key={ki} className="p-0">
                      <div
                        title={`${ATTN_WORDS[qi]} → ${ATTN_WORDS[ki]}: ${(w * 100).toFixed(1)}٪`}
                        className={`grid h-8 place-items-center rounded-md font-mono text-[9.5px] ${
                          qi === query ? 'ring-1 ring-inset ring-amber-400/50' : ''
                        }`}
                        style={{ background: `rgba(16, 185, 129, ${w.toFixed(3)})` }}
                      >
                        <span className={w > 0.45 ? 'text-zinc-950' : 'text-zinc-300'}>{Math.round(w * 100)}</span>
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-1.5 text-[9px] leading-4 text-zinc-600">اعداد درصد گردشده‌اند؛ با نگه‌داشتن ماوس روی هر خانه عدد دقیق را ببین. جمع وزن‌های هر سطر = ۱.</p>

        {/* اسلایدر دما */}
        <div className="mt-2.5 rounded-xl border border-white/10 bg-black/25 p-2.5">
          <div className="mb-1 flex items-center justify-between text-[10px] text-zinc-400">
            <span>دما (Temperature)، دمای پایین = تمرکز بیشتر</span>
            <span dir="ltr" className="font-mono text-zinc-200">
              {fa(+temp.toFixed(1))}
            </span>
          </div>
          <Slider
            value={[temp]} min={0.5} max={3} step={0.1}
            onValueChange={(v) => setTemp(v[0])} aria-label="دما"
          />
        </div>
      </LabCard>

      <LabCard>
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold text-amber-200">
            قدم‌به‌قدم برای Query: «{ATTN_WORDS[query]}»
          </span>
          <Badge variant="outline" className="border-white/15 font-mono text-[9px] text-zinc-400">
            T = {fa(+temp.toFixed(1))}
          </Badge>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/35 p-2.5">
          <div className="text-[9.5px] text-zinc-500">بردار Query (۸ بعد، مقادیر واقعی):</div>
          <pre dir="ltr" className="mt-1 overflow-x-auto font-mono text-[9.5px] leading-4 text-cyan-300">
            q = [ {qVals} ]
          </pre>

          <div dir="ltr" className="os-scroll mt-2 overflow-x-auto font-mono text-[9.5px] text-zinc-300">
            <table className="w-full min-w-[400px] text-right">
              <thead>
                <tr className="text-zinc-500">
                  <th className="px-1 py-1 text-left font-medium">k</th>
                  <th className="px-1 font-medium">q·k</th>
                  <th className="px-1 font-medium">÷√8</th>
                  <th className="px-1 font-medium">÷T</th>
                  <th className="px-1 font-medium">exp</th>
                  <th className="px-1 font-medium">weight</th>
                </tr>
              </thead>
              <tbody>
                {ATTN_WORDS.map((w, ki) => (
                  <tr key={w} className={`border-t border-white/5 ${ki === query ? 'bg-amber-400/5' : ''}`}>
                    <td className="px-1 py-0.5 text-left text-zinc-200">{w}</td>
                    <td className="px-1">{row.dots[ki].toFixed(2)}</td>
                    <td className="px-1">{row.scaled[ki].toFixed(3)}</td>
                    <td className="px-1">{row.temped[ki].toFixed(3)}</td>
                    <td className="px-1">{row.exps[ki].toFixed(3)}</td>
                    <td className="px-1 font-bold text-emerald-300">{(row.weights[ki] * 100).toFixed(1)}%</td>
                  </tr>
                ))}
                <tr className="border-t border-white/10 text-zinc-500">
                  <td className="px-1 py-1 text-left">Σ</td>
                  <td />
                  <td />
                  <td />
                  <td>{expSum.toFixed(3)}</td>
                  <td>100.0%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-2 space-y-1.5 text-[10px] leading-5 text-zinc-400">
          <p>هر توکن بیشترین توجه را معمولاً به خودش دارد (چون q·k خودش = ۱ است)؛ اسم‌ها هم به همدیگر نزدیک‌اند چون بردارهایشان مؤلفهٔ معنایی مشترک دارد. «را» و «به» به‌جای معنا، نقش دستوری را کد می‌کنند.</p>
          <p>در ترنسفورمر واقعی Q و K و V با ماتریس‌های یادگرفته‌شده از تعبیه‌ها ساخته می‌شوند و چندین head موازی وجود دارد؛ اینجا برای سادگی Q = K = V = همان بردارها است.</p>
        </div>

        <HonestyNote>
          بردارها واقعی نیستند: مؤلفهٔ معنایی ساده + نویز ثابت‌اند تا الگوی توجه قابل توضیح باشد؛ مدل واقعی این
          بردارها را از داده یاد می‌گیرد.
        </HonestyNote>
      </LabCard>
    </div>
  )
}

/* ================================================================
   آزمایشگاه ۳، بازیابی-تولید (RAG)
   شباهت کسینوسی روی ۶ سند اسباب‌بازی محصول خیالی «سان‌جاب‌پلاس»
   ================================================================ */

interface RagDoc {
  id: string
  title: string
  text: string
}

const RAG_DOCS: RagDoc[] = [
  { id: 'd1', title: 'قیمت و تعرفه‌ها', text: 'سان‌جاب‌پلاس سه پلن دارد: پایه ۲۹۰ هزار تومان در ماه، حرفه‌ای ۵۹۰ هزار تومان در ماه و سازمانی با قیمت توافقی. پلن حرفه‌ای ۱۴ روز تست رایگان دارد.' },
  { id: 'd2', title: 'امکانات', text: 'سان‌جاب‌پلاس دستیار هوش مصنوعی مدیریت کار است. تقویم فارسی، اتصال به ایمیل، ساخت گزارش خودکار و یادآور قرارها از امکانات اصلی آن هستند.' },
  { id: 'd3', title: 'پشتیبانی', text: 'ساعات پشتیبانی: شنبه تا چهارشنبه از ساعت ۹ صبح تا ۶ عصر پاسخ می‌دهیم. پنجشنبه‌ها فقط درخواست‌های بحرانی بررسی می‌شود و جمعه‌ها تعطیل است.' },
  { id: 'd4', title: 'گارانتی و بازگشت وجه', text: 'همهٔ پلن‌ها ۳۰ روز گارانتی بازگشت وجه بدون قید و شرط دارند. برای درخواست بازگشت وجه از بخش تنظیمات تیکت ثبت کنید.' },
  { id: 'd5', title: 'سازگاری', text: 'سان‌جاب‌پلاس با اندروید ۱۰ به بالا سازگار است و روی iOS 15 به بالا و همهٔ مرورگرهای مدرن اجرا می‌شود. نسخهٔ دسکتاپ برای ویندوز و مک هم منتشر شده است.' },
  { id: 'd6', title: 'حریم خصوصی', text: 'داده‌های شما فقط روی سرورهای داخل کشور ذخیره می‌شود و در اختیار هیچ شخص ثالثی قرار نمی‌گیرد. نامه‌ها با رمزگذاری سرتاسری محافظت می‌شوند.' },
]

const RAG_SUGGESTIONS = [
  'قیمت پلن‌ها چقدر است؟', 'گارانتی بازگشت وجه دارد؟', 'ساعات پشتیبانی کی است؟',
  'با اندروید سازگار است؟', 'داده‌های من کجا ذخیره می‌شود؟',
]

/** پرسش‌های آزمایشی برای سنجش دقت بازیابی (پرسش → سند درست) */
const RAG_EVAL: Array<{ q: string; target: string }> = [
  { q: 'قیمت پلن حرفه‌ای چقدر است؟', target: 'd1' },
  { q: 'گارانتی بازگشت وجه دارید؟', target: 'd4' },
  { q: 'ساعات کاری پشتیبانی چیست؟', target: 'd3' },
  { q: 'روی اندروید اجرا می‌شود؟', target: 'd5' },
  { q: 'اطلاعات من کجا ذخیره می‌شود؟', target: 'd6' },
]

/** پاسخ‌های غلطِ قاطعِ «مدل بی‌سند»، برای نمایش هالوسینیشن */
const RAG_HALLUCINATIONS: Array<{ keys: string[]; text: string }> = [
  { keys: ['قیمت', 'هزینه', 'تومان', 'پلن', 'تعرفه'], text: 'سان‌جاب‌پلاس فقط ۹۹ هزار تومان در ماه هزینه دارد و پلن سازمانی همیشه رایگان است!' },
  { keys: ['گارانتی', 'بازگشت'], text: 'سان‌جاب‌پلاس هیچ گارانتی یا بازگشت وجه‌ای ندارد؛ بعد از خرید همه‌چیز نهایی است.' },
  { keys: ['پشتیبانی', 'ساعت', 'ساعات'], text: 'پشتیبانی ما ۲۴ ساعته و ۷ روز هفته، حتی در تعطیلات، بی‌درنگ پاسخ می‌دهد.' },
  { keys: ['اندروید', 'ios', 'آیفون', 'ویندوز'], text: 'فعلاً سان‌جاب‌پلاس فقط روی لینوکس اجرا می‌شود؛ برنامه‌ای برای موبایل نداریم.' },
  { keys: ['داده', 'خصوصی', 'ذخیره', 'حریم'], text: 'داده‌های شما روی سرورهای خارج از کشور ذخیره و برای تبلیغات به فروشندگان داده فروخته می‌شود.' },
]

/** شکستن متن به جمله (بدون lookbehind برای سازگاری) */
function splitSentences(text: string): string[] {
  const out: string[] = []
  let cur = ''
  for (const ch of text) {
    cur += ch
    if (ch === '.' || ch === '؟' || ch === '!' || ch === '؛') {
      out.push(cur.trim())
      cur = ''
    }
  }
  if (cur.trim()) out.push(cur.trim())
  return out.filter((s) => s.length > 0)
}

interface RagUnit {
  key: string
  docId: string
  title: string
  text: string
  part: number
  parts: number
}

/** بخش‌بندی اسناد (chunking): هر سند به n بخش تقسیم می‌شود */
function buildUnits(perDoc: number): RagUnit[] {
  const units: RagUnit[] = []
  for (const d of RAG_DOCS) {
    const sents = splitSentences(d.text)
    const n = Math.max(1, Math.min(perDoc, sents.length))
    if (n === 1) {
      units.push({ key: `${d.id}#1`, docId: d.id, title: d.title, text: d.text, part: 1, parts: 1 })
      continue
    }
    const per = Math.ceil(sents.length / n)
    for (let c = 0; c < n; c++) {
      const chunk = sents.slice(c * per, (c + 1) * per).join(' ')
      if (chunk) {
        units.push({ key: `${d.id}#${c + 1}`, docId: d.id, title: d.title, text: chunk, part: c + 1, parts: n })
      }
    }
  }
  return units
}

/** بردار بسامد کلمات (bag-of-words) */
function bagOf(tokens: string[]): Map<string, number> {
  const m = new Map<string, number>()
  for (const t of tokens) m.set(t, (m.get(t) ?? 0) + 1)
  return m
}

/** شباهت کسینوسی دو بردار بسامد */
function cosine(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0
  for (const [t, v] of a) dot += v * (b.get(t) ?? 0)
  let na = 0
  let nb = 0
  a.forEach((v) => {
    na += v * v
  })
  b.forEach((v) => {
    nb += v * v
  })
  const denom = Math.sqrt(na) * Math.sqrt(nb)
  return denom > 0 ? dot / denom : 0
}

export function RagLab() {
  const reduceMotion = useReducedMotion() ?? false
  const [query, setQuery] = useState(RAG_SUGGESTIONS[0])
  const [perDoc, setPerDoc] = useState(1)
  const [noRag, setNoRag] = useState(false)
  /** پاسخ فقط برای «همین پرسش و همین بخش‌بندی» نمایش داده می‌شود */
  const [shownFor, setShownFor] = useState<string | null>(null)

  const answerKey = `${query}|${perDoc}`
  const answerShown = shownFor === answerKey

  const units = useMemo(() => buildUnits(perDoc), [perDoc])
  const unitVecs = useMemo(() => units.map((u) => bagOf(contentTokens(u.text))), [units])
  const qTokens = useMemo(() => contentTokens(query), [query])
  const qVec = useMemo(() => bagOf(qTokens), [qTokens])

  const ranked = useMemo(() => {
    return units
      .map((u, i) => ({ unit: u, score: cosine(qVec, unitVecs[i]) }))
      .sort((a, b) => b.score - a.score)
  }, [units, unitVecs, qVec])

  /** دقت بازیابی: چند پرسش آزمایشی، سندِ درست را رتبهٔ ۱ گرفتند؟ */
  const precision = useMemo(() => {
    let hits = 0
    for (const ev of RAG_EVAL) {
      const evVec = bagOf(contentTokens(ev.q))
      let bestDoc = ''
      let bestScore = -1
      for (let i = 0; i < units.length; i++) {
        const s = cosine(evVec, unitVecs[i])
        if (s > bestScore) {
          bestScore = s
          bestDoc = units[i].docId
        }
      }
      if (bestDoc === ev.target) hits++
    }
    return hits / RAG_EVAL.length
  }, [units, unitVecs])

  /** پاسخ استخراجی: بهترین جمله از دو واحدِ برتر */
  const answer = useMemo(() => {
    const top = ranked.filter((r) => r.score > 0).slice(0, 2)
    return top.map((r) => {
      const sents = splitSentences(r.unit.text)
      let bestS = sents[0] ?? r.unit.text
      let bestOverlap = -1
      for (const s of sents) {
        const st = new Set(contentTokens(s))
        let ov = 0
        for (const t of qTokens) if (st.has(t)) ov++
        if (ov > bestOverlap) {
          bestOverlap = ov
          bestS = s
        }
      }
      return {
        from: r.unit.title,
        part: r.unit.parts > 1 ? `بخش ${fa(r.unit.part)} از ${fa(r.unit.parts)}` : 'سند کامل',
        sentence: bestS,
        score: r.score,
      }
    })
  }, [ranked, qTokens])

  const hallucination = useMemo(() => {
    const qt = new Set(qTokens)
    for (const h of RAG_HALLUCINATIONS) if (h.keys.some((k) => qt.has(k))) return h.text
    return null
  }, [qTokens])

  return (
    <div className="space-y-3">
      <LabCard>
        <LabHeader icon={FileSearch} tint={CYAN} title="آزمایشگاه بازیابی و تولید" en="Retrieval-Augmented Generation (RAG)" />

        <p className="text-[10.5px] leading-5 text-zinc-300">
          RAG یعنی: اول از میان اسناد، مرتبط‌ترین‌ها را با شباهت کسینوسی بردار بسامد کلمات پیدا کن؛ بعد پاسخ را فقط از همان‌ها بساز.
          اینجا ۶ سند دربارهٔ محصول خیالی «سان‌جاب‌پلاس» داریم.
        </p>

        {/* اسناد */}
        <div className="mt-2 rounded-xl border border-white/10 bg-black/25 p-2.5">
          <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold text-cyan-200">
            <Info size={12} aria-hidden />
            اسناد موجود ({fa(RAG_DOCS.length)} سند)
          </div>
          <div className="os-scroll max-h-36 space-y-1.5 overflow-y-auto">
            {RAG_DOCS.map((d, i) => (
              <div key={d.id} className="flex items-start gap-2">
                <Badge variant="outline" className="shrink-0 border-cyan-400/30 text-[9px] text-cyan-300">
                  {fa(i + 1)}
                </Badge>
                <p className="min-w-0 text-[10px] leading-5 text-zinc-400">
                  <b className="text-zinc-200">{d.title}: </b>
                  {d.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </LabCard>

      <LabCard>
        {/* پرسش */}
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-200">
          <Search size={13} className="text-cyan-300" aria-hidden />
          پرسش خود را بنویس یا انتخاب کن
        </div>
        <Input
          value={query} onChange={(e) => setQuery(e.target.value)} aria-label="پرسش جست‌وجو"
          placeholder="دربارهٔ سان‌جاب‌پلاس بپرس…" className="mt-2 border-white/10 bg-black/35 text-[12px] text-zinc-100"
        />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {RAG_SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setQuery(s)}
              aria-label={`پرسش پیشنهادی: ${s}`}
              className={`rounded-full border px-2.5 py-1 text-[10px] font-bold transition ${
                query === s
                  ? 'border-transparent bg-cyan-400/20 text-cyan-200'
                  : 'border-white/10 bg-zinc-800/70 text-zinc-300 hover:border-white/25'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* اسلایدر بخش‌بندی */}
        <div className="mt-2.5 rounded-xl border border-white/10 bg-black/25 p-2.5">
          <div className="mb-1 flex items-center justify-between text-[10px] text-zinc-400">
            <span>بخش‌بندی اسناد (chunking)، هر سند به چند بخش؟</span>
            <span dir="ltr" className="font-mono text-zinc-200">
              {fa(perDoc)}
            </span>
          </div>
          <Slider value={[perDoc]} min={1} max={3} step={1} onValueChange={(v) => setPerDoc(v[0])} aria-label="تعداد بخش هر سند" />
        </div>

        {/* نتایج رتبه‌بندی */}
        <div className="mt-2.5">
          <div className="mb-1.5 text-[10px] font-bold text-zinc-300">
            نتایج بازیابی (رتبه‌بندی با شباهت کسینوسی)
          </div>
          <div className="os-scroll max-h-72 space-y-1.5 overflow-y-auto pe-1">
            {ranked.every((r) => r.score === 0) ? (
              <p className="p-3 text-center text-[10px] text-zinc-500">
                هیچ سندی با این پرسش هم‌پوشانی ندارد، کلمات کلیدی مثل «قیمت» یا «گارانتی» را امتحان کن.
              </p>
            ) : (
              ranked
                .filter((r) => r.score > 0)
                .map((r, i) => (
                  <motion.div
                    key={r.unit.key}
                    layout
                    initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: reduceMotion ? 0 : i * 0.04 }}
                    className={`rounded-xl border p-2.5 ${
                      i === 0 ? 'border-emerald-400/40 bg-emerald-400/5' : 'border-white/10 bg-black/25'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="grid h-5 w-5 shrink-0 place-items-center rounded-md font-mono text-[9px]"
                        style={{
                          background: i === 0 ? `${EMERALD}22` : 'rgba(255,255,255,0.06)',
                          color: i === 0 ? EMERALD : '#a1a1aa',
                        }}
                      >
                        {fa(i + 1)}
                      </span>
                      <span className="text-[11px] font-bold text-zinc-200">{r.unit.title}</span>
                      {r.unit.parts > 1 && (
                        <Badge variant="outline" className="shrink-0 border-white/15 text-[8.5px] text-zinc-400">
                          بخش {fa(r.unit.part)}/{fa(r.unit.parts)}
                        </Badge>
                      )}
                      <span dir="ltr" className="ms-auto shrink-0 font-mono text-[10px] text-emerald-300">
                        {(r.score * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <MiniBar pct={r.score} color={EMERALD} reduce={reduceMotion} />
                    </div>
                    <p className="mt-1.5 text-[10px] leading-5 text-zinc-400">{r.unit.text}</p>
                  </motion.div>
                ))
            )}
          </div>
        </div>

        {/* دقت بازیابی */}
        <div className="mt-2.5 rounded-xl border border-purple-400/25 bg-purple-400/5 p-2.5">
          <div className="flex items-center justify-between gap-2 text-[10.5px]">
            <span className="font-bold text-purple-200">
              دقت بازیابی روی {fa(RAG_EVAL.length)} پرسش آزمایشی (رتبهٔ ۱ = سند درست؟)
            </span>
            <span dir="ltr" className="font-mono font-black text-purple-300">
              {fa(Math.round(precision * 100))}٪
            </span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/5">
            <motion.div
              className="h-full rounded-full bg-purple-400"
              initial={false}
              animate={{ width: `${Math.round(precision * 100)}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <p className="mt-1.5 text-[9.5px] leading-4 text-zinc-400">
            با تغییر اسلایدر بخش‌بندی دقت عوض می‌شود: بخش‌های ریزتر سیگنال را متمرکزتر می‌کنند اما ممکن است زمینهٔ جمله از دست برود، دقت را مقایسه کن.
          </p>
        </div>
      </LabCard>

      <LabCard>
        {/* ساخت پاسخ */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm" disabled={noRag} onClick={() => setShownFor(answerKey)}
            className="bg-emerald-500/90 text-[11px] text-zinc-950 hover:bg-emerald-400"
            aria-label="ساخت پاسخ از اسناد بازیابی‌شده"
          >
            <Sparkles size={13} aria-hidden />
            ساخت پاسخ
          </Button>
          <div className="flex items-center gap-2 rounded-full border border-rose-400/30 bg-rose-400/5 px-3 py-1.5">
            <Switch id="rag-off" checked={noRag} onCheckedChange={setNoRag} aria-label="حالت بدون RAG" />
            <label htmlFor="rag-off" className="cursor-pointer text-[10px] font-bold text-rose-200">
              بدون RAG (مدل بی‌سند)
            </label>
          </div>
        </div>

        {noRag ? (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2.5 rounded-xl border border-rose-400/35 bg-rose-400/10 p-3"
          >
            <div className="flex items-center gap-1.5 text-[10.5px] font-black text-rose-200">
              <AlertTriangle size={13} aria-hidden />
              پاسخ «مدل بی‌سند»، بدون بازیابی
            </div>
            <p className="mt-1.5 text-[11.5px] leading-6 text-zinc-100">
              {hallucination ?? 'متأسفم، در این زمینه اطلاعاتی ندارم. (مدل واقعی ممکن است به‌جای سکوت، پاسخی اشتباه بسازد!)'}
            </p>
            <p className="mt-2 text-[9.5px] leading-4 text-rose-200/80">
              این متن از هیچ سندی نیامده؛ اطلاعات قاطعانه و غلط است (hallucination). همین است که RAG جلویش را می‌گیرد:
              اول بازیابی، بعد تولید.
            </p>
          </motion.div>
        ) : answerShown ? (
          answer.length > 0 ? (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2.5 rounded-xl border border-emerald-400/35 bg-emerald-400/5 p-3"
            >
              <div className="text-[10.5px] font-black text-emerald-300">پاسخ (استخراجی از اسناد بازیابی‌شده)</div>
              <p className="mt-1 text-[11.5px] font-bold leading-6 text-zinc-100">بر اساس اسناد بازیابی‌شده:</p>
              <ol className="mt-1 space-y-2">
                {answer.map((a, i) => (
                  <li key={`${a.from}-${i}`} className="rounded-lg border border-white/10 bg-black/30 p-2">
                    <p className="text-[11.5px] leading-6 text-zinc-100">{a.sentence}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[9px] text-zinc-500">
                      <Badge variant="outline" className="border-emerald-400/30 text-[8.5px] text-emerald-300">
                        منبع {fa(i + 1)}: {a.from}
                      </Badge>
                      <span>
                        {a.part} · شباهت {fa(Math.round(a.score * 100))}٪
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="mt-2 text-[9.5px] leading-4 text-emerald-200/70">
                این پاسخ «استخراجی» است: جمله‌ها عیناً از اسناد کپی شده‌اند. یک LLM واقعی به‌جای کپی، پاسخ را با زبان
                خودش بازنویسی و ترکیب می‌کند، و همان‌جاست که ممکن است خطا کند.
              </p>
            </motion.div>
          ) : (
            <p className="mt-2.5 text-[10.5px] text-zinc-500">
              چیزی برای استخراج پیدا نشد، اول یک پرسش با هم‌پوشانی انتخاب کن.
            </p>
          )
        ) : (
          <p className="mt-2.5 text-[10px] leading-5 text-zinc-500">
            دکمهٔ «ساخت پاسخ» را بزن تا از دو سندِ برترِ بازیابی‌شده، یک پاسخ صادقانه (استخراجی) ساخته شود.
          </p>
        )}

        <HonestyNote>
          بازیابی با بردار بسامد کلمات (bag-of-words) انجام شده؛ RAG واقعی از تعبیه‌های معنایی (embeddings) و پایگاه
          برداری استفاده می‌کند و تولید با LLM است، نه کپی جمله.
        </HonestyNote>
      </LabCard>
    </div>
  )
}
