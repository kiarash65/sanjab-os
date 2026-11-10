'use client'

import { useCallback, useEffect, useState } from 'react'
import { Brain, Check, Play, Plus, RotateCcw, Trash2, Trophy, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { SUNJOB_PALETTE } from '@/lib/os/brand'
import { useOS } from '@/lib/os/store'

/* --------------------------------- انواع ---------------------------------- */

interface FlashCard {
  id: string
  front: string
  back: string
  /** جلوی کارت دستور/کد لاتین است؟ */
  code: boolean
}

interface SessionState {
  queue: FlashCard[]
  idx: number
  reviewed: number
  correct: number
  /** کارت فعلی برگشته باشد؟ */
  flipped: boolean
}

/** آمار کل ذخیره‌شده در localStorage */
interface StoredState {
  boxes: Record<string, number>
  personal: FlashCard[]
  reviewed: number
  correct: number
}

type CatId = 'linux' | 'general' | 'personal'

/* -------------------------------- ثابت‌ها --------------------------------- */

const KEY = 'sunjob-flashcards-v1'
const BOX_COUNT = 5
/** وزن انتخاب تصادفی هر جعبه: جعبهٔ ۱ وزن ۵ … جعبهٔ ۵ وزن ۱ */
const BOX_WEIGHTS = [5, 4, 3, 2, 1]
const BOX_COLORS = ['#e11d48', '#f7931e', '#fdb56b', '#0ea5a0', '#8b5cf6']

const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']

const toFa = (value: number | string): string =>
  String(value).replace(/\d/g, (d) => FA_DIGITS[Number(d)] ?? d)

/* --------------------------- دیتای داخلی دسته‌ها --------------------------- */

const LINUX_RAW: Array<[string, string]> = [
  ['ls -la', 'نمایش همهٔ فایل‌ها با جزئیات کامل؛ حتی مخفی‌ها هم قایم نمی‌شن'],
  ['cd ~', 'پرش به دایرکتوری خانهٔ کاربر'],
  ['pwd', 'چاپ مسیر فعلی؛ یعنی الان کجای هارد قدم می‌زنی؟'],
  ['mkdir -p', 'ساخت پوشه به‌همراه تمام پوشه‌های واسط، بدون غر زدن'],
  ['rm -rf', 'حذف بازگشتی و اجباری؛ خطرناک‌ترین دستور تاریخ لینوکس!'],
  ['cp', 'کپی کردن فایل یا پوشه'],
  ['mv', 'جابه‌جایی یا تغییر نام فایل و پوشه'],
  ['grep -r', 'جستجوی یک متن داخل فایل‌ها به‌صورت بازگشتی'],
  ['find . -name', 'جستجوی فایل بر اساس نام، شروع از مسیر فعلی'],
  ['chmod 755', 'تعیین مجوز: صاحب فایل همه‌کاره، بقیه فقط اجازهٔ نگاه'],
  ['chown', 'تغییر مالک فایل یا پوشه'],
  ['sudo apt update', 'به‌روزرسانی لیست بسته‌ها با دسترسی مدیرکل'],
  ['systemctl status', 'دیدن وضعیت یک سرویس؛ ببین زنده‌ست یا نه'],
  ['ps aux', 'نمایش تمام پروسه‌های در حال اجرای سیستم'],
  ['kill -9', 'کشتن بی‌رحمانهٔ یک پروسهٔ سرکش'],
  ['tar -xzvf', 'باز کردن آرشیو فشردهٔ tar.gz'],
  ['df -h', 'نمایش فضای دیسک به زبان آدمیزاد (خوانا)'],
  ['du -sh', 'حجم کل یک پوشه در یک خط'],
  ['man', 'صفحهٔ راهنمای دستورها؛ بهترین معلم مجانی لینوکس'],
  ['history | grep', 'جستجو میان تاریخچهٔ دستورهای قبلی ترمینال'],
]

const GENERAL_RAW: Array<[string, string]> = [
  ['تفاوت kernel و distro چیست؟', 'کرنل قلب سیستم‌عامل و مسئول سخت‌افزار است؛ توزیع (distro) بستهٔ کاملِ کرنل + ابزارها + نرم‌افزارهاست، مثل اوبونتو'],
  ['/etc چیست؟', 'محل سکونت فایل‌های تنظیمات (کانفیگ) سیستم و برنامه‌ها'],
  ['sudo چیست؟', 'اجرای یک دستور با دسترسی موقت ریشه؛ یعنی «این یکی رو به‌جای من، رئیس انجام بده»'],
  ['دایرکتوری home چیست؟', 'محیط شخصی هر کاربر برای فایل‌هایش؛ مثل /home/pengo'],
  ['پکیج منیجر چیست؟', 'ابزار نصب، حذف و به‌روزرسانی برنامه‌ها؛ مثل apt یا pacman'],
  ['tty چیست؟', 'ترمینال متنی؛ گفت‌وگوی رودررو با سیستم بدون رابط گرافیکی'],
  ['shell چیست؟', 'مفسر دستورها و میانجی بین تو و کرنل'],
  ['root کیست؟', 'کاربر مدیر با بالاترین سطح دسترسی؛ خدای سیستم!'],
  ['یک توزیع Debian-based نام ببر', 'اوبونتو، لینوکس مینت یا خود دبیان'],
  ['یک توزیع Arch-based نام ببر', 'آرچ لینوکس، مانجارو یا EndeavourOS'],
  ['bash چیست؟', 'پوستهٔ پیش‌فرض بیشتر توزیع‌ها؛ مخفف Bourne Again Shell'],
  ['علامت ~ یعنی چه؟', 'میان‌بُر دایرکتوری خانهٔ کاربر فعلی'],
]

const LINUX_CARDS: FlashCard[] = LINUX_RAW.map(([front, back], i) => ({
  id: `lnx-${i + 1}`,
  front,
  back,
  code: true,
}))

const GENERAL_CARDS: FlashCard[] = GENERAL_RAW.map(([front, back], i) => ({
  id: `gen-${i + 1}`,
  front,
  back,
  code: false,
}))

/* ------------------------------- توابع کمکی ------------------------------- */

const EMPTY_SESSION: SessionState = {
  queue: [],
  idx: 0,
  reviewed: 0,
  correct: 0,
  flipped: false,
}

/** جلسهٔ تازه: صف وزن‌دار از کارت‌ها (برای دستهٔ خالی، جلسهٔ خالی) */
function newSession(cards: FlashCard[], boxes: Record<string, number>): SessionState {
  if (cards.length === 0) return EMPTY_SESSION
  return {
    queue: weightedShuffle(cards, boxes),
    idx: 0,
    reviewed: 0,
    correct: 0,
    flipped: false,
  }
}

const getBox = (id: string, boxes: Record<string, number>): number => {
  const b = boxes[id]
  return typeof b === 'number' && b >= 1 && b <= BOX_COUNT ? Math.floor(b) : 1
}

/** چیدمان صف جلسه با انتخاب تصادفی وزن‌دار (کارت‌های جعبه‌های عقب زودتر میان) */
function weightedShuffle(cards: FlashCard[], boxes: Record<string, number>): FlashCard[] {
  const pool = [...cards]
  const out: FlashCard[] = []
  while (pool.length > 0) {
    const weights = pool.map((c) => BOX_WEIGHTS[getBox(c.id, boxes) - 1])
    const total = weights.reduce((sum, w) => sum + w, 0)
    let r = Math.random() * total
    let picked = 0
    for (let i = 0; i < pool.length; i += 1) {
      r -= weights[i]
      if (r <= 0) {
        picked = i
        break
      }
    }
    out.push(pool[picked])
    pool.splice(picked, 1)
  }
  return out
}

/** جملهٔ بامزهٔ آخر جلسه بر اساس دقت */
function funnyLine(correct: number, total: number): string {
  if (total === 0) return 'بدون حتی یک مرور تمام شد؟! این که جلسه نبود، رد شدن بود!'
  const ratio = correct / total
  if (ratio >= 0.99) return 'بدون یک خطا! کرنل از خوشحالی به اسم تو یک پروسه ساخته.'
  if (ratio >= 0.75) return 'عالی بود! با این روند تا آخر هفته جعبهٔ ۵ مال توئه.'
  if (ratio >= 0.5) return 'نصفه‌نیمه؛ مثل چایی که سرد شده ولی هنوز می‌شه خوردش!'
  if (ratio > 0) return 'چندتا رفتن جعبهٔ ۱؛ اشکال نداره، لینوکس هم یهو یاد گرفته نشد.'
  return 'صفر درصد؟! حتی rm -rf با تو مودبانه‌تر رفتار می‌کنه. جلسهٔ بعد می‌درخشی!'
}

/* ------------------------------ پنل مرور کارت ------------------------------ */

interface ReviewPanelProps {
  catId: CatId
  cards: FlashCard[]
  boxes: Record<string, number>
  session: SessionState
  lifetime: Pick<StoredState, 'reviewed' | 'correct'>
  onStart: (catId: CatId) => void
  onFlip: (catId: CatId) => void
  onAnswer: (catId: CatId, ok: boolean) => void
}

function ReviewPanel({ catId, cards, boxes, session, lifetime, onStart, onFlip, onAnswer }: ReviewPanelProps) {
  const total = session.queue.length
  const finished = total > 0 && session.idx >= total
  const current = !finished && total > 0 ? session.queue[session.idx] : undefined
  const flipped = session.flipped && current !== undefined

  const flip = () => {
    if (current) onFlip(catId)
  }

  const accuracy = session.reviewed > 0 ? Math.round((session.correct / session.reviewed) * 100) : 0
  const progressPct = total > 0 ? Math.round((session.idx / total) * 100) : 0
  const distribution = Array.from({ length: BOX_COUNT }, (_, i) =>
    cards.filter((c) => getBox(c.id, boxes) === i + 1).length,
  )

  return (
    <div>
      {/* توزیع کارت‌ها بین ۵ جعبهٔ لایتنر */}
      <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-300">توزیع کارت‌ها بین جعبه‌ها</span>
          <span className="text-[10px] text-zinc-500">جعبه‌های دورتر دیرتر تکرار می‌شن</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {BOX_COLORS.map((color, i) => (
            <Badge
              key={color}
              variant="outline"
              className="border"
              style={{ color, backgroundColor: `${color}1f`, borderColor: `${color}66` }}
            >
              جعبهٔ {toFa(i + 1)}: {toFa(distribution[i])}
            </Badge>
          ))}
        </div>
        <p className="mt-1.5 text-[10px] text-zinc-600">
          جعبهٔ ۱ یعنی تازه‌کار، جعبهٔ ۵ یعنی استاد لینوکس!
        </p>
      </div>

      {/* نوار پیشرفت جلسه */}
      {total > 0 && (
        <div className="mt-3 rounded-xl border border-white/10 bg-zinc-900/60 p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-zinc-300">
              مرور شده: {toFa(session.reviewed)} از {toFa(total)}
            </span>
            <span className="text-zinc-400">دقت جلسه: {toFa(accuracy)}٪</span>
          </div>
          <Progress
            value={progressPct}
            className="mt-2 h-2 bg-zinc-800 [&>div]:bg-[#f7931e]"
          />
        </div>
      )}

      {cards.length === 0 ? (
        <div className="mt-3 rounded-xl border border-dashed border-white/15 bg-zinc-900/40 p-6 text-center">
          <p className="text-xs leading-6 text-zinc-400">
            هنوز هیچ کارتی در این دسته نداری؛ اول از فرم بالا یکی بساز!
          </p>
        </div>
      ) : total === 0 ? (
        /* حالت آماده‌باش: جلسه شروع نشده */
        <div className="mt-3 rounded-xl border border-white/10 bg-zinc-900/60 p-6 text-center">
          <p className="text-sm font-black text-zinc-100">آماده‌ای برای یک جلسهٔ مرور؟</p>
          <p className="mt-1 text-[11px] leading-5 text-zinc-500">
            {toFa(cards.length)} کارت با ترتیب تصادفی وزن‌دار؛ هر جواب غلط یعنی بلیت برگشت به جعبهٔ ۱!
          </p>
          <Button
            onClick={() => onStart(catId)}
            className="mt-3 bg-gradient-to-l from-[#e07b00] to-[#f7931e] font-black text-zinc-950 shadow-lg shadow-orange-500/20 hover:opacity-90"
          >
            <Play className="size-4" />
            شروع جلسه
          </Button>
        </div>
      ) : finished ? (
        /* کارت نتیجهٔ آخر جلسه */
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="mt-3 rounded-2xl border border-white/10 bg-zinc-900/60 p-6 text-center"
        >
          <Trophy className="mx-auto size-9" style={{ color: SUNJOB_PALETTE.orange }} />
          <p className="mt-2 text-sm font-black leading-6 text-zinc-100">
            {funnyLine(session.correct, session.reviewed)}
          </p>
          <p className="mt-2 text-xs text-zinc-400">
            این جلسه: {toFa(session.reviewed)} مرور · دقت {toFa(accuracy)}٪
          </p>
          <p className="mt-1 text-[11px] text-zinc-500">
            مجموع مرورهای همهٔ زمان‌ها: {toFa(lifetime.reviewed)}، این آمار رو هیچ‌جا آپلود نمی‌شه، وعده!
          </p>
          <Button
            onClick={() => onStart(catId)}
            className="mt-4 bg-gradient-to-l from-[#e07b00] to-[#f7931e] font-black text-zinc-950 shadow-lg shadow-orange-500/20 hover:opacity-90"
          >
            <RotateCcw className="size-4" />
            جلسهٔ جدید
          </Button>
        </motion.div>
      ) : current ? (
        /* کارت اصلی مرور */
        <div className="mt-3">
          <div
            className="relative h-60 w-full cursor-pointer select-none [perspective:1200px]"
            onClick={flip}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') flip()
            }}
          >
            <AnimatePresence>
              <motion.div
                key={`${catId}-${session.idx}`}
                className="absolute inset-0"
                initial={{ x: 90, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -90, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                <motion.div
                  className="relative h-full w-full"
                  animate={{ rotateY: flipped ? 180 : 0 }}
                  transition={{ duration: 0.45, ease: 'easeInOut' }}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {/* روی کارت */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-zinc-900/80 p-4 [backface-visibility:hidden]">
                    <span className="absolute right-3 top-3 text-[10px] font-bold text-zinc-500">
                      جعبهٔ {toFa(getBox(current.id, boxes))}
                    </span>
                    {current.code ? (
                      <code
                        dir="ltr"
                        className="max-w-full break-all text-center font-mono text-xl font-black text-zinc-50"
                      >
                        {current.front}
                      </code>
                    ) : (
                      <p
                        dir="auto"
                        className="max-w-full text-center text-base font-black leading-7 text-zinc-50"
                      >
                        {current.front}
                      </p>
                    )}
                    <span className="absolute bottom-3 text-[10px] text-zinc-600">
                      برای دیدن جواب روی کارت بزن
                    </span>
                  </div>
                  {/* پشت کارت */}
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 bg-zinc-900/80 p-4 [backface-visibility:hidden]"
                    style={{ transform: 'rotateY(180deg)' }}
                  >
                    <span className="text-[10px] font-bold" style={{ color: SUNJOB_PALETTE.teal }}>
                      جواب
                    </span>
                    <p className="max-w-full text-center text-sm leading-7 text-zinc-100">
                      {current.back}
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>

          {!flipped ? (
            <Button
              variant="outline"
              onClick={flip}
              className="mt-3 w-full border-white/10 bg-zinc-900/60 font-bold text-zinc-200 hover:bg-white/10 hover:text-white"
            >
              <RotateCcw className="size-4" />
              برگرد
            </Button>
          ) : (
            <div className="mt-3 flex gap-2">
              <Button
                onClick={() => onAnswer(catId, true)}
                className="flex-1 bg-emerald-600 font-black text-white hover:bg-emerald-500"
              >
                <Check className="size-4" />
                بلد بودم
              </Button>
              <Button
                onClick={() => onAnswer(catId, false)}
                className="flex-1 bg-rose-600 font-black text-white hover:bg-rose-500"
              >
                <X className="size-4" />
                نمی‌دونستم
              </Button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}

/* ------------------------- مدیریت کارت‌های شخصی --------------------------- */

interface PersonalManagerProps {
  cards: FlashCard[]
  boxes: Record<string, number>
  onAdd: (front: string, back: string) => void
  onDelete: (id: string) => void
}

function PersonalManager({ cards, boxes, onAdd, onDelete }: PersonalManagerProps) {
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')

  const add = () => {
    const f = front.trim()
    const b = back.trim()
    if (!f || !b) {
      useOS.getState().pushToast({
        icon: '✍️',
        title: 'فلش‌کارت',
        body: 'هر دو سمت کارت را پر کن!',
      })
      return
    }
    onAdd(f, b)
    setFront('')
    setBack('')
  }

  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-3">
      <p className="mb-2 text-xs font-bold text-zinc-300">ساخت کارت جدید</p>
      <Input
        value={front}
        onChange={(e) => setFront(e.target.value)}
        placeholder="روی کارت، مثلاً: دستور chmod چه‌کار می‌کنه؟"
        className="border-white/10 bg-zinc-950/60 text-sm text-zinc-100 placeholder:text-zinc-600"
      />
      <Textarea
        value={back}
        onChange={(e) => setBack(e.target.value)}
        placeholder="پشت کارت، جواب کوتاه و مفید"
        rows={2}
        className="mt-2 resize-none border-white/10 bg-zinc-950/60 text-sm text-zinc-100 placeholder:text-zinc-600"
      />
      <Button
        onClick={add}
        className="mt-2 w-full bg-gradient-to-l from-[#e07b00] to-[#f7931e] font-black text-zinc-950 shadow-lg shadow-orange-500/20 hover:opacity-90"
      >
        <Plus className="size-4" />
        افزودن به کارت‌های من
      </Button>

      {cards.length > 0 && (
        <div className="mt-3">
          <p className="mb-1.5 text-[11px] font-bold text-zinc-400">
            کارت‌های شخصی ({toFa(cards.length)}):
          </p>
          <ul className="space-y-1.5">
            {cards.map((c) => {
              const box = getBox(c.id, boxes)
              const color = BOX_COLORS[box - 1]
              return (
                <li
                  key={c.id}
                  className="flex items-center gap-2 rounded-lg border border-white/10 bg-zinc-950/50 px-2 py-1.5"
                >
                  <span
                    dir="auto"
                    className="min-w-0 flex-1 truncate text-xs text-zinc-200"
                    title={c.front}
                  >
                    {c.front}
                  </span>
                  <Badge
                    variant="outline"
                    className="shrink-0 border"
                    style={{ color, borderColor: `${color}66` }}
                  >
                    جعبهٔ {toFa(box)}
                  </Badge>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`حذف کارت ${c.front}`}
                    title="حذف کارت"
                    onClick={() => onDelete(c.id)}
                    className="size-7 shrink-0 text-zinc-500 hover:bg-rose-500/15 hover:text-rose-400"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

/* ------------------------------ خواندن آمار ------------------------------- */

function loadStored(): StoredState {
  if (typeof window === 'undefined') {
    return { boxes: {}, personal: [], reviewed: 0, correct: 0 }
  }
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { boxes: {}, personal: [], reviewed: 0, correct: 0 }
    const data = JSON.parse(raw) as Partial<StoredState>
    return {
      boxes: data.boxes && typeof data.boxes === 'object' ? data.boxes : {},
      personal: Array.isArray(data.personal)
        ? data.personal
            .filter(
              (c) =>
                c &&
                typeof c.id === 'string' &&
                typeof c.front === 'string' &&
                typeof c.back === 'string',
            )
            .map((c) => ({ ...c, code: Boolean(c.code) }))
        : [],
      reviewed: typeof data.reviewed === 'number' ? data.reviewed : 0,
      correct: typeof data.correct === 'number' ? data.correct : 0,
    }
  } catch {
    /* دادهٔ خراب؛ از صفر شروع می‌کنیم */
    return { boxes: {}, personal: [], reviewed: 0, correct: 0 }
  }
}

/* -------------------------------- اپ اصلی --------------------------------- */

export default function FlashcardsApp() {
  /* خواندن یک‌بارهٔ آمار از localStorage در اولین رندر (الگوی مشترک اپ‌های OS) */
  const [stored, setStored] = useState<StoredState>(loadStored)
  const [tab, setTab] = useState<CatId>('linux')
  const [sessions, setSessions] = useState<Record<CatId, SessionState>>(() => ({
    linux: newSession(LINUX_CARDS, stored.boxes),
    general: newSession(GENERAL_CARDS, stored.boxes),
    personal: newSession(stored.personal, stored.boxes),
  }))

  /* ذخیره‌سازی آمار کل */
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(stored))
    } catch {
      /* اگر حافظه پر بود، اپ نباید بشکنه */
    }
  }, [stored])

  const startSession = useCallback(
    (catId: CatId) => {
      const cards =
        catId === 'linux' ? LINUX_CARDS : catId === 'general' ? GENERAL_CARDS : stored.personal
      if (cards.length === 0) return
      setSessions((prev) => ({ ...prev, [catId]: newSession(cards, stored.boxes) }))
    },
    [stored],
  )

  const flipCard = useCallback((catId: CatId) => {
    setSessions((prev) => {
      const cur = prev[catId]
      if (cur.queue.length === 0 || cur.idx >= cur.queue.length || cur.flipped) return prev
      return { ...prev, [catId]: { ...cur, flipped: true } }
    })
  }, [])

  const answer = useCallback(
    (catId: CatId, ok: boolean) => {
      const s = sessions[catId]
      const card = s.queue[s.idx]
      if (!card) return
      const nextBox = ok ? Math.min(getBox(card.id, stored.boxes) + 1, BOX_COUNT) : 1
      setStored((prev) => ({
        ...prev,
        boxes: { ...prev.boxes, [card.id]: nextBox },
        reviewed: prev.reviewed + 1,
        correct: prev.correct + (ok ? 1 : 0),
      }))
      setSessions((prev) => {
        const cur = prev[catId]
        return {
          ...prev,
          [catId]: {
            ...cur,
            idx: cur.idx + 1,
            reviewed: cur.reviewed + 1,
            correct: cur.correct + (ok ? 1 : 0),
            flipped: false,
          },
        }
      })
    },
    [sessions, stored.boxes],
  )

  const addPersonal = useCallback((front: string, back: string) => {
    const card: FlashCard = {
      id: `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      front,
      back,
      code: false,
    }
    setStored((prev) => ({ ...prev, personal: [...prev.personal, card] }))
    setSessions((prev) => ({ ...prev, personal: EMPTY_SESSION }))
    useOS.getState().pushToast({
      icon: '🃏',
      title: 'فلش‌کارت',
      body: 'کارت به دستهٔ شخصی اضافه شد!',
    })
  }, [])

  const deletePersonal = useCallback((id: string) => {
    setStored((prev) => {
      const boxes = { ...prev.boxes }
      delete boxes[id]
      return {
        ...prev,
        boxes,
        personal: prev.personal.filter((c) => c.id !== id),
      }
    })
    setSessions((prev) => ({ ...prev, personal: EMPTY_SESSION }))
    useOS.getState().pushToast({
      icon: '🗑️',
      title: 'فلش‌کارت',
      body: 'کارت حذف شد.',
    })
  }, [])

  return (
    <div className="flex h-full w-full flex-col bg-zinc-950/60">
      {/* هدر */}
      <div className="flex items-center justify-between border-b border-white/10 p-3">
        <h2 className="flex items-center gap-1.5 text-sm font-black text-zinc-100">
          <Brain className="size-4" style={{ color: SUNJOB_PALETTE.orange }} />
          فلش‌کارت لایتنر
        </h2>
        <span className="text-[10px] text-zinc-500">با اسپانسری سان‌جاب</span>
      </div>

      <div className="os-scroll min-h-0 flex-1 overflow-y-auto p-3">
        <Tabs value={tab} onValueChange={(v) => setTab(v as CatId)}>
          <TabsList className="grid h-auto w-full grid-cols-3 border border-white/10 bg-zinc-900/70">
            <TabsTrigger value="linux" className="text-xs">
              دستورات لینوکس
            </TabsTrigger>
            <TabsTrigger value="general" className="text-xs">
              لینوکس عمومی
            </TabsTrigger>
            <TabsTrigger value="personal" className="text-xs">
              کارت‌های من
            </TabsTrigger>
          </TabsList>

          <TabsContent value="linux" className="mt-2">
            <ReviewPanel
              catId="linux"
              cards={LINUX_CARDS}
              boxes={stored.boxes}
              session={sessions.linux}
              lifetime={stored}
              onStart={startSession}
              onFlip={flipCard}
              onAnswer={answer}
            />
          </TabsContent>

          <TabsContent value="general" className="mt-2">
            <ReviewPanel
              catId="general"
              cards={GENERAL_CARDS}
              boxes={stored.boxes}
              session={sessions.general}
              lifetime={stored}
              onStart={startSession}
              onFlip={flipCard}
              onAnswer={answer}
            />
          </TabsContent>

          <TabsContent value="personal" className="mt-2">
            <div className="space-y-3">
              <PersonalManager
                cards={stored.personal}
                boxes={stored.boxes}
                onAdd={addPersonal}
                onDelete={deletePersonal}
              />
              <ReviewPanel
                catId="personal"
                cards={stored.personal}
                boxes={stored.boxes}
                session={sessions.personal}
                lifetime={stored}
                onStart={startSession}
                onFlip={flipCard}
                onAnswer={answer}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
