'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Delete, PartyPopper, SpellCheck, XCircle } from 'lucide-react'
import {
  GameShell,
  LiveBoard,
  Overlay,
  useBestScore,
} from '@/components/os/game-shell'

const WORD_LEN = 5
const MAX_TRIES = 6
/** تاخیر پلکانی فلیب هر خانه (میلی‌ثانیه) */
const STAGGER_MS = 120
const FLIP_MS = 300

type Feedback = 'correct' | 'present' | 'absent'
type GameStatus = 'playing' | 'won' | 'lost'

// کلمات ۵ حرفی فارسی، بدون نیم‌فاصله
const RAW_WORDS = [
  'پنجره',
  'گلدان',
  'سنگین',
  'ستاره',
  'باران',
  'مدرسه',
  'مهتاب',
  'دستان',
  'قلمرو',
  'زنبور',
  'عسلی',
  'شادان',
  'خیالی',
  'شبانه',
  'طوفان',
  'طنابی',
  'ساعتی',
  'روباه',
  'خرگوش',
  'پنیری',
  'نارنج',
  'اناری',
  'گیلاس',
  'انگور',
  'خیاری',
  'کاغذی',
  'مدادی',
  'دفتری',
  'کتابی',
  'خانگی',
  'جنگلی',
  'کوهان',
  'گلابی',
]
// فقط کلماتی که دقیقا ۵ حرف یونیکد دارند قبول می‌شوند
const WORDS = RAW_WORDS.filter((w) => w.split('').length === WORD_LEN)

let lastAnswer = ''
function pickWord(): string {
  if (WORDS.length === 0) return 'ستاره'
  let w = WORDS[Math.floor(Math.random() * WORDS.length)]
  let guard = 0
  while (w === lastAnswer && guard < 12) {
    w = WORDS[Math.floor(Math.random() * WORDS.length)]
    guard += 1
  }
  lastAnswer = w
  return w
}

// یکسان‌سازی ی و ک عربی با معادل فارسی (برای تایپ فیزیکی)
function normalizeChar(ch: string): string {
  if (ch === 'ي') return 'ی'
  if (ch === 'ك') return 'ک'
  return ch
}

// محاسبه وضعیت هر حرف با رعایت حروف تکراری
function feedbackOf(guess: string, answer: string): Feedback[] {
  const g = guess.split('')
  const a = answer.split('')
  const out: Feedback[] = Array.from({ length: WORD_LEN }, () => 'absent')
  const pool = new Map<string, number>()
  for (let i = 0; i < WORD_LEN; i++) {
    if (g[i] === a[i]) out[i] = 'correct'
    else pool.set(a[i], (pool.get(a[i]) ?? 0) + 1)
  }
  for (let i = 0; i < WORD_LEN; i++) {
    if (out[i] === 'correct') continue
    const left = pool.get(g[i]) ?? 0
    if (left > 0) {
      out[i] = 'present'
      pool.set(g[i], left - 1)
    }
  }
  return out
}

const FEEDBACK_STYLE: Record<Feedback, string> = {
  correct: 'border-emerald-500 bg-emerald-600 text-white',
  present: 'border-amber-400 bg-amber-500 text-zinc-950',
  absent: 'border-white/5 bg-zinc-800 text-zinc-400',
}

const KEY_FEEDBACK_STYLE: Record<Feedback, string> = {
  correct: 'border-emerald-500 bg-emerald-600 text-white hover:bg-emerald-500',
  present: 'border-amber-400 bg-amber-500 text-zinc-950 hover:bg-amber-400',
  absent: 'border-white/5 bg-zinc-900 text-zinc-600 hover:bg-zinc-900',
}

const FEEDBACK_ARIA: Record<Feedback, string> = {
  correct: 'جای درست',
  present: 'هست ولی جای دیگه',
  absent: 'نیست',
}

// چیدمان صفحه‌کلید فارسی
const KB_ROW_1 = ['ض', 'ص', 'ث', 'ق', 'ف', 'غ', 'ع', 'ه', 'خ', 'ح', 'ج', 'چ']
const KB_ROW_2 = ['ش', 'س', 'ی', 'ب', 'ل', 'ا', 'ت', 'ن', 'م', 'ک', 'گ']
const KB_ROW_3 = ['ظ', 'ط', 'ز', 'ر', 'ذ', 'د', 'پ', 'و']
const ALL_KEYS = new Set<string>([...KB_ROW_1, ...KB_ROW_2, ...KB_ROW_3])

const KEY_BASE =
  'flex h-10 select-none items-center justify-center rounded-md border font-black transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40'

export default function WordleGame() {
  const [best, setBest] = useBestScore('wordle')
  const [refreshKey, setRefreshKey] = useState(0)
  const [answer, setAnswer] = useState<string>(pickWord)
  const [guesses, setGuesses] = useState<string[]>([])
  const [current, setCurrent] = useState('')
  const [status, setStatus] = useState<GameStatus>('playing')
  const [revealing, setRevealing] = useState(false)
  const [wins, setWins] = useState(0)
  const [hint, setHint] = useState('')
  const [roundId, setRoundId] = useState(0)

  const timersRef = useRef<number[]>([])
  const hintTimerRef = useRef<number>(0)

  const clearTimers = useCallback(() => {
    for (const t of timersRef.current) window.clearTimeout(t)
    timersRef.current = []
    window.clearTimeout(hintTimerRef.current)
  }, [])

  // پاک‌سازی تایمرها هنگام بسته شدن بازی
  useEffect(() => clearTimers, [clearTimers])

  const flash = useCallback((msg: string) => {
    setHint(msg)
    window.clearTimeout(hintTimerRef.current)
    hintTimerRef.current = window.setTimeout(() => setHint(''), 1800)
  }, [])

  const reset = useCallback(() => {
    clearTimers()
    setAnswer(pickWord())
    setGuesses([])
    setCurrent('')
    setStatus('playing')
    setRevealing(false)
    setHint('')
    setRoundId((r) => r + 1)
  }, [clearTimers])

  const pressLetter = useCallback(
    (raw: string) => {
      if (status !== 'playing' || revealing) return
      const ch = normalizeChar(raw)
      setCurrent((c) => (c.length < WORD_LEN ? c + ch : c))
    },
    [status, revealing]
  )

  const pressBackspace = useCallback(() => {
    if (status !== 'playing' || revealing) return
    setCurrent((c) => c.slice(0, -1))
  }, [status, revealing])

  const submit = useCallback(() => {
    if (status !== 'playing' || revealing) return
    if (guesses.length >= MAX_TRIES) return
    if (current.length < WORD_LEN) {
      flash('کلمه باید ۵ حرفی باشه')
      return
    }
    const guess = current
    const won = guess === answer
    const nextGuesses = [...guesses, guess]
    const lost = !won && nextGuesses.length >= MAX_TRIES
    setGuesses(nextGuesses)
    setCurrent('')
    setRevealing(true)
    const delay = WORD_LEN * STAGGER_MS + FLIP_MS + 80
    timersRef.current.push(
      window.setTimeout(() => {
        setRevealing(false)
        if (won) {
          setStatus('won')
          setWins((w) => w + 1)
          setBest(best + 1)
          setRefreshKey((k) => k + 1)
        } else if (lost) {
          setStatus('lost')
        }
      }, delay)
    )
  }, [status, revealing, guesses, current, answer, best, setBest, flash])

  // کیبورد فیزیکی: حروف فارسی، اینتر و بک‌اسپیس
  useEffect(() => {
    if (status !== 'playing' || revealing) return
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) return
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        submit()
      } else if (e.key === 'Backspace') {
        e.preventDefault()
        pressBackspace()
      } else {
        const ch = normalizeChar(e.key)
        if (ALL_KEYS.has(ch)) {
          e.preventDefault()
          pressLetter(ch)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [status, revealing, submit, pressLetter, pressBackspace])

  // بهترین وضعیت هر حرف برای رنگ‌آمیزی صفحه‌کلید
  const keyStates = useMemo(() => {
    const map = new Map<string, Feedback>()
    for (const g of guesses) {
      const fb = feedbackOf(g, answer)
      const chars = g.split('')
      for (let i = 0; i < chars.length; i++) {
        const ch = chars[i]
        const cur = fb[i]
        const prev = map.get(ch)
        if (prev === 'correct') continue
        if (prev === 'present' && cur !== 'correct') continue
        map.set(ch, cur)
      }
    }
    return map
  }, [guesses, answer])

  const attempt = Math.min(
    guesses.length + (status === 'playing' ? 1 : 0),
    MAX_TRIES
  )
  const lockKeys = status !== 'playing' || revealing

  const renderKey = (k: string) => {
    const st = keyStates.get(k)
    return (
      <button
        key={k}
        type="button"
        onClick={() => pressLetter(k)}
        disabled={lockKeys}
        aria-label={`حرف ${k}`}
        className={`${KEY_BASE} min-w-0 flex-1 text-[13px] ${
          st
            ? KEY_FEEDBACK_STYLE[st]
            : 'border-white/10 bg-zinc-800 text-zinc-100 hover:bg-zinc-700'
        }`}
      >
        {k}
      </button>
    )
  }

  return (
    <GameShell
      icon={SpellCheck}
      title="حدس‌لغت"
      board={<LiveBoard game="wordle" best={best} refreshKey={refreshKey} />}
      howTo="یک کلمه ۵ حرفی فارسی حدس بزن، ۶ فرصت داری. سبز: جای درست، کهربایی: هست ولی جای دیگه، خاکستری: نیست."
      stats={[
        { label: 'تلاش', value: String(attempt) },
        { label: 'برد', value: wins.toLocaleString('fa-IR') },
      ]}
      onRestart={reset}
    >
      <div className="-mx-3 os-scroll flex h-full w-[calc(100%+1.5rem)] select-none flex-col items-center overflow-y-auto py-2">
        <div className="m-auto flex w-full flex-col items-center justify-center gap-2">
        <div
          key={roundId}
          dir="rtl"
          role="grid"
          aria-label={`جدول حدس کلمه با ${MAX_TRIES} سطر و ${WORD_LEN} ستون`}
          className="grid shrink-0 gap-1"
        >
          {Array.from({ length: MAX_TRIES }, (_, r) => {
            const submitted = r < guesses.length
            const isCurrent =
              r === guesses.length && status === 'playing' && !revealing
            const word = submitted ? guesses[r] : isCurrent ? current : ''
            const chars = word.split('')
            const fb = submitted ? feedbackOf(guesses[r], answer) : null
            return (
              <div key={r} role="row" className="grid grid-cols-5 gap-1">
                {Array.from({ length: WORD_LEN }, (_, c) => {
                  const letter = chars[c] ?? ''
                  const state = fb ? fb[c] : null
                  const cls = state
                    ? FEEDBACK_STYLE[state]
                    : letter
                      ? 'border-[var(--pengo-accent)] bg-white/[0.03] text-zinc-100'
                      : 'border-white/15 bg-white/[0.03] text-zinc-100'
                  const label = state
                    ? `${letter} — ${FEEDBACK_ARIA[state]}`
                    : letter || 'خالی'
                  return (
                    <div
                      key={c}
                      role="gridcell"
                      aria-label={label}
                      style={{
                        transitionDelay: submitted
                          ? `${c * STAGGER_MS}ms`
                          : undefined,
                      }}
                      className={`grid h-11 w-11 place-items-center rounded-lg border text-lg font-black transition-all duration-300 sm:h-12 sm:w-12 ${cls}`}
                    >
                      {letter}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>

        <p
          role="status"
          aria-live="polite"
          className="h-4 shrink-0 text-[11px] font-bold text-amber-300"
        >
          {hint}
        </p>

        <div
          dir="rtl"
          role="group"
          aria-label="صفحه‌کلید فارسی"
          className="flex w-full max-w-[336px] shrink-0 flex-col gap-1"
        >
          <div className="flex gap-1">{KB_ROW_1.map(renderKey)}</div>
          <div className="flex gap-1">{KB_ROW_2.map(renderKey)}</div>
          <div className="flex gap-1">
            {KB_ROW_3.map(renderKey)}
            <span
              aria-hidden
              className="flex h-10 min-w-0 flex-[0.5] items-center justify-center rounded-md border border-white/5 bg-white/[0.03] text-[10px] text-zinc-600"
            >
              .
            </span>
            <button
              type="button"
              onClick={submit}
              disabled={lockKeys}
              aria-label="ثبت حدس (اینتر)"
              className={`${KEY_BASE} flex-[1.7] border-white/10 bg-zinc-700 text-[12px] text-zinc-100 hover:bg-zinc-600`}
            >
              ثبت
            </button>
            <button
              type="button"
              onClick={pressBackspace}
              disabled={lockKeys}
              aria-label="پاک کردن حرف قبلی (بک‌اسپیس)"
              className={`${KEY_BASE} flex-[1.7] border-white/10 bg-zinc-700 text-zinc-100 hover:bg-zinc-600`}
            >
              <Delete className="size-4" aria-hidden />
            </button>
          </div>
        </div>
        </div>
      </div>

      <Overlay
        show={status === 'won'}
        icon={PartyPopper}
        title="آفرین!"
        subtitle={`کلمه «${answer}» بود، با ${guesses.length.toLocaleString(
          'fa-IR'
        )} تلاش پیدا شد`}
        actionLabel="کلمه بعدی"
        onAction={reset}
      />
      <Overlay
        show={status === 'lost'}
        icon={XCircle}
        title="این یکی نشد!"
        subtitle={`کلمه درست «${answer}» بود`}
        actionLabel="دوباره"
        onAction={reset}
      />
    </GameShell>
  )
}
