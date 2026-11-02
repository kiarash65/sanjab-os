'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Brain, Pause, Play, RotateCcw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useOS } from '@/lib/os/store'
import { SUNJOB_PALETTE } from '@/lib/os/brand'

type ModeId = 'focus' | 'short' | 'long'

interface PomoStats {
  date: string
  sessions: number
  minutes: number
}

const KEY = 'sunjob-pomodoro-v1'
const FOCUS_MINUTES = 25
const CYCLE_LENGTH = 4 // هر ۴ تمرکز، یک استراحت بلند

const MODES: Record<ModeId, { label: string; seconds: number; color: string }> = {
  focus: { label: 'تمرکز', seconds: 25 * 60, color: SUNJOB_PALETTE.orange },
  short: { label: 'استراحت کوتاه', seconds: 5 * 60, color: SUNJOB_PALETTE.teal },
  long: { label: 'استراحت بلند', seconds: 15 * 60, color: SUNJOB_PALETTE.violet },
}

const DOT_COLORS = [
  SUNJOB_PALETTE.orange,
  SUNJOB_PALETTE.violet,
  SUNJOB_PALETTE.teal,
  SUNJOB_PALETTE.rose,
] as const

const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'] as const

const toFa = (value: number | string): string =>
  String(value).replace(/\d/g, (digit) => FA_DIGITS[Number(digit)] ?? digit)

const pad2 = (n: number): string => String(n).padStart(2, '0')

const todayKey = (): string => {
  const d = new Date()
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

const fmtTime = (s: number): string =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** نارنجی → فیروزه‌ای با پیشرفت زمان */
function lerpColor(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a)
  const [r2, g2, b2] = hexToRgb(b)
  const mix = (x: number, y: number) => Math.round(x + (y - x) * t)
  return `rgb(${mix(r1, r2)}, ${mix(g1, g2)}, ${mix(b1, b2)})`
}

export default function PomodoroApp() {
  const [mode, setMode] = useState<ModeId>('focus')
  const [running, setRunning] = useState(false)
  const [remaining, setRemaining] = useState(MODES.focus.seconds)
  const [stats, setStats] = useState<PomoStats>({
    date: todayKey(),
    sessions: 0,
    minutes: 0,
  })
  const [loaded, setLoaded] = useState(false)

  const endAtRef = useRef(0)
  const finishedRef = useRef(false)
  const audioRef = useRef<AudioContext | null>(null)

  /* ---------- localStorage ---------- */
  useEffect(() => {
    queueMicrotask(() => {
      const today = todayKey()
      let s: PomoStats = { date: today, sessions: 0, minutes: 0 }
      try {
        const raw = localStorage.getItem(KEY)
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<PomoStats>
          if (
            parsed.date === today &&
            typeof parsed.sessions === 'number' &&
            typeof parsed.minutes === 'number'
          ) {
            s = { date: today, sessions: parsed.sessions, minutes: parsed.minutes }
          }
        }
      } catch {
        /* آمار خراب شده؛ از صفر شروع می‌کنیم */
      }
      setStats(s)
      setLoaded(true)
    })
  }, [])

  useEffect(() => {
    if (!loaded) return
    try {
      localStorage.setItem(KEY, JSON.stringify(stats))
    } catch {
      /* بی‌خیال، تمرکز مهم‌تره */
    }
  }, [stats, loaded])

  /* ---------- صدا (WebAudio) ---------- */
  const ensureAudio = useCallback(() => {
    if (audioRef.current) return
    try {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext
      if (Ctor) audioRef.current = new Ctor()
    } catch {
      audioRef.current = null
    }
  }, [])

  const playBeep = useCallback(() => {
    if (!useOS.getState().settings.sound) return
    const ctx = audioRef.current
    if (!ctx) return
    try {
      if (ctx.state === 'suspended') void ctx.resume()
      const now = ctx.currentTime
      const notes = [
        { f: 880, t: 0 },
        { f: 1174.66, t: 0.2 },
      ]
      for (const { f, t } of notes) {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.value = f
        gain.gain.setValueAtTime(0.0001, now + t)
        gain.gain.exponentialRampToValueAtTime(0.25, now + t + 0.03)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.18)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now + t)
        osc.stop(now + t + 0.2)
      }
    } catch {
      /* اگر صدا بازی نکرد، بهانه نیار! */
    }
  }, [])

  /* ---------- پایان هر دوره ---------- */
  const finish = useCallback(() => {
    if (finishedRef.current) return
    finishedRef.current = true
    setRunning(false)
    playBeep()

    const today = todayKey()
    const prev: PomoStats =
      stats.date === today ? stats : { date: today, sessions: 0, minutes: 0 }

    if (mode === 'focus') {
      const nextSessions = prev.sessions + 1
      setStats({
        date: today,
        sessions: nextSessions,
        minutes: prev.minutes + FOCUS_MINUTES,
      })
      const longNext = nextSessions % CYCLE_LENGTH === 0
      const next: ModeId = longNext ? 'long' : 'short'
      useOS.getState().pushToast({
        title: 'پومودورو تمام شد!',
        body: longNext
          ? 'چهار تای پشت‌سرهم! حالا نوبت استراحت بلنده.'
          : 'یه تمرکز کامل؛ ۵ دقیقه استراحت حقّته!',
      })
      setMode(next)
      setRemaining(MODES[next].seconds)
    } else {
      useOS.getState().pushToast({
        title: 'استراحت تموم شد!',
        body: 'برگرد سراغ تمرکز؛ تو می‌تونی!',
      })
      setMode('focus')
      setRemaining(MODES.focus.seconds)
    }
  }, [mode, stats, playBeep])

  /* ---------- تیک تایمر ---------- */
  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => {
      const left = Math.max(0, Math.round((endAtRef.current - Date.now()) / 1000))
      setRemaining(left)
      if (left <= 0) finish()
    }, 250)
    return () => window.clearInterval(id)
  }, [running, finish])

  const start = () => {
    ensureAudio()
    finishedRef.current = false
    endAtRef.current = Date.now() + remaining * 1000
    setRunning(true)
  }

  const pause = () => {
    const left = Math.max(0, Math.round((endAtRef.current - Date.now()) / 1000))
    setRemaining(left)
    setRunning(false)
  }

  const reset = () => {
    finishedRef.current = false
    setRunning(false)
    setRemaining(MODES[mode].seconds)
  }

  const selectMode = (id: ModeId) => {
    finishedRef.current = false
    setRunning(false)
    setMode(id)
    setRemaining(MODES[id].seconds)
  }

  /* ---------- حلقهٔ SVG ---------- */
  const R = 96
  const CIRC = 2 * Math.PI * R
  const total = MODES[mode].seconds
  const progress = total > 0 ? 1 - remaining / total : 0
  const ringColor = lerpColor('#f7931e', '#0ea5a0', progress)

  const dots = Math.min(stats.sessions, 10)
  const untilLong = CYCLE_LENGTH - (stats.sessions % CYCLE_LENGTH)

  return (
    <div className="flex h-full w-full flex-col bg-zinc-950/60">
      <header className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2.5">
        <h2 className="flex items-center gap-1.5 text-sm font-black text-zinc-100">
          <Brain className="size-4" style={{ color: SUNJOB_PALETTE.teal }} />
          گوشهٔ تمرکز
        </h2>
        <span className="text-[10px] text-zinc-500">با اسپانسری سان‌جاب</span>
      </header>

      <div className="os-scroll min-h-0 flex-1 overflow-y-auto p-3">
        {/* حالت‌ها */}
        <div className="flex flex-wrap justify-center gap-1.5">
          {(Object.keys(MODES) as ModeId[]).map((id) => {
            const active = id === mode
            const m = MODES[id]
            return (
              <button
                key={id}
                type="button"
                onClick={() => selectMode(id)}
                style={
                  active
                    ? { backgroundColor: `${m.color}26`, color: m.color, borderColor: `${m.color}66` }
                    : undefined
                }
                className={`rounded-full border px-3 py-1.5 text-xs transition active:scale-95 ${
                  active
                    ? 'font-black'
                    : 'border-white/10 bg-zinc-900/60 text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                }`}
              >
                {m.label}
              </button>
            )
          })}
        </div>

        {/* حلقهٔ تایمر */}
        <div className="mt-3 flex justify-center">
          <div className="relative size-[220px]">
            <svg
              width="220"
              height="220"
              viewBox="0 0 220 220"
              className="-rotate-90"
              role="img"
              aria-label={`حلقهٔ پیشرفت ${MODES[mode].label}`}
            >
              <circle cx="110" cy="110" r={R} fill="none" stroke="#27272a" strokeWidth="12" />
              <circle
                cx="110"
                cy="110"
                r={R}
                fill="none"
                stroke={ringColor}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={CIRC}
                strokeDashoffset={CIRC * (1 - progress)}
                style={{
                  transition: 'stroke-dashoffset 0.3s linear, stroke 0.5s linear',
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div
                dir="ltr"
                className="font-mono text-4xl font-black tracking-wider text-zinc-100"
              >
                {fmtTime(remaining)}
              </div>
              <div className="mt-1 text-[11px] font-bold" style={{ color: MODES[mode].color }}>
                {MODES[mode].label}
                {running ? ' • در حال اجرا' : ''}
              </div>
            </div>
          </div>
        </div>

        {/* کنترل‌ها */}
        <div className="mt-3 flex items-center justify-center gap-2">
          {running ? (
            <Button
              onClick={pause}
              className="gap-1.5 bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
            >
              <Pause className="size-4" />
              مکث
            </Button>
          ) : (
            <Button
              onClick={start}
              className="gap-1.5 bg-[#f7931e] text-zinc-950 hover:bg-[#e07b00]"
            >
              <Play className="size-4" />
              شروع
            </Button>
          )}
          <Button
            variant="outline"
            onClick={reset}
            className="gap-1.5 border-white/10 bg-zinc-900/60 text-zinc-300 hover:bg-white/10 hover:text-zinc-100"
          >
            <RotateCcw className="size-4" />
            ریست
          </Button>
        </div>

        <p className="mt-2 text-center text-[11px] text-zinc-500">
          {stats.sessions > 0 && stats.sessions % CYCLE_LENGTH === 0
            ? 'استراحت بلند شایستگی توئه!'
            : `تا استراحت بلند ${toFa(untilLong)} تمرکز دیگه مونده`}
        </p>

        {/* دوره‌های امروز */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 rounded-xl border border-white/10 bg-zinc-900/60 p-3">
          <Badge
            variant="outline"
            className="border-white/10 bg-zinc-800/80 text-[10px] font-black text-zinc-300"
          >
            دوره‌های امروز: {toFa(stats.sessions)}
          </Badge>
          {dots > 0 && (
            <svg
              width={dots * 14}
              height="12"
              role="img"
              aria-label={`${toFa(stats.sessions)} پومودوروی انجام‌شده`}
            >
              {Array.from({ length: dots }).map((_, i) => (
                <circle
                  key={i}
                  cx={i * 14 + 6}
                  cy="6"
                  r="4.5"
                  fill={DOT_COLORS[i % DOT_COLORS.length]}
                />
              ))}
            </svg>
          )}
        </div>

        {/* آمار */}
        <div className="mt-3 rounded-xl border border-white/10 bg-zinc-900/60 p-3 text-center">
          <p className="text-xs font-bold text-zinc-200">
            مجموع تمرکز امروز:{' '}
            <span style={{ color: SUNJOB_PALETTE.orange }}>
              {toFa(stats.minutes)}
            </span>{' '}
            دقیقه
          </p>
          <p className="mt-1 text-[11px] leading-5 text-zinc-500">
            قانون طلایی: تا تایمر می‌چرخه، تب عوض کردن ممنوع!
          </p>
        </div>
      </div>
    </div>
  )
}
