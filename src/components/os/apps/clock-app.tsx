'use client'

import { useEffect, useRef, useState } from 'react'
import { Pause, Play, Plus, RotateCcw } from 'lucide-react'
import { useOS } from '@/lib/os/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const pad2 = (n: number): string => String(n).padStart(2, '0')
const faNum = (n: number): string => n.toLocaleString('fa-IR')

const fmtStopwatch = (ms: number): string => {
  const totalCs = Math.floor(ms / 10)
  const cs = totalCs % 100
  const s = Math.floor(totalCs / 100) % 60
  const m = Math.floor(totalCs / 6000)
  return `${pad2(m)}:${pad2(s)}.${pad2(cs)}`
}

const fmtTimer = (ms: number): string => {
  const s = Math.ceil(ms / 1000)
  return `${pad2(Math.floor(s / 60))}:${pad2(s % 60)}`
}

const clampInt = (raw: string, lo: number, hi: number): number => {
  const n = Number.parseInt(raw, 10)
  if (Number.isNaN(n)) return lo
  return Math.min(hi, Math.max(lo, n))
}

const RING_CIRCUMFERENCE = 2 * Math.PI * 70
const TIMER_PRESETS: readonly number[] = [1, 3, 5, 10]

// بوق پایان تایمر: چون بدون کلیک کاربر اجرا می‌شه ممکنه اجازه نگیره — بی‌صدا رد می‌شیم
const playFinishBeeps = (): void => {
  try {
    const Ctor: typeof AudioContext | undefined =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext
    if (!Ctor) return
    const ctx = new Ctor()
    for (let i = 0; i < 3; i++) {
      const t0 = ctx.currentTime + i * 0.35
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.0001, t0)
      gain.gain.exponentialRampToValueAtTime(0.3, t0 + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.3)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(t0)
      osc.stop(t0 + 0.32)
    }
    window.setTimeout(() => {
      ctx.close().catch(() => {
        /* بوق تمام */
      })
    }, 1500)
  } catch {
    /* بی‌صدا؛ دنیا بدون بوق هم می‌چرخه */
  }
}

const announceTimerDone = (): void => {
  playFinishBeeps()
  useOS.getState().pushToast({
    icon: '⏰',
    title: 'تایمر تمام شد!',
    body: 'چای آماده‌ست ☕',
  })
}

function AnalogClock({ now }: { now: Date }) {
  const hr = now.getHours() % 12
  const min = now.getMinutes()
  const sec = now.getSeconds()
  const hrDeg = hr * 30 + min * 0.5
  const minDeg = min * 6 + sec * 0.1
  const secDeg = sec * 6

  const ticks = Array.from({ length: 12 }, (_, i) => {
    const a = (i * 30 * Math.PI) / 180
    const major = i % 3 === 0
    const inner = major ? 76 : 80
    return {
      key: i,
      major,
      x1: 100 + Math.sin(a) * inner,
      y1: 100 - Math.cos(a) * inner,
      x2: 100 + Math.sin(a) * 87,
      y2: 100 - Math.cos(a) * 87,
    }
  })

  return (
    <svg
      viewBox="0 0 200 200"
      className="size-44 drop-shadow-lg"
      role="img"
      aria-label="ساعت عقربه‌ای پنگوئنی"
    >
      <circle cx="100" cy="100" r="94" className="fill-zinc-900" />
      <circle
        cx="100"
        cy="100"
        r="94"
        className="fill-none stroke-white/10"
        strokeWidth="4"
      />
      {ticks.map((t) => (
        <line
          key={t.key}
          x1={t.x1}
          y1={t.y1}
          x2={t.x2}
          y2={t.y2}
          strokeLinecap="round"
          strokeWidth={t.major ? 3.5 : 2}
          className={t.major ? 'stroke-zinc-400' : 'stroke-zinc-600'}
        />
      ))}
      {/* عقربه ساعت‌شمار: رنگ اکسنت */}
      <line
        x1="100"
        y1="104"
        x2="100"
        y2="58"
        className="stroke-[var(--pengo-accent)]"
        strokeWidth="6"
        strokeLinecap="round"
        transform={`rotate(${hrDeg} 100 100)`}
      />
      <line
        x1="100"
        y1="106"
        x2="100"
        y2="40"
        className="stroke-zinc-200"
        strokeWidth="4"
        strokeLinecap="round"
        transform={`rotate(${minDeg} 100 100)`}
      />
      <line
        x1="100"
        y1="112"
        x2="100"
        y2="34"
        className="stroke-zinc-500"
        strokeWidth="2"
        strokeLinecap="round"
        transform={`rotate(${secDeg} 100 100)`}
      />
      <circle cx="100" cy="100" r="5" className="fill-[var(--pengo-accent)]" />
      <circle cx="100" cy="100" r="2" className="fill-zinc-900" />
    </svg>
  )
}

function StopwatchTab() {
  const [ms, setMs] = useState(0)
  const [running, setRunning] = useState(false)
  const [laps, setLaps] = useState<number[]>([])
  const baseRef = useRef(0)

  useEffect(() => {
    if (!running) return
    const t0 = performance.now() - baseRef.current
    const iv = window.setInterval(() => {
      baseRef.current = performance.now() - t0
      setMs(baseRef.current)
    }, 33)
    return () => window.clearInterval(iv)
  }, [running])

  const toggleRun = () => setRunning((r) => !r)

  const reset = () => {
    setRunning(false)
    baseRef.current = 0
    setMs(0)
    setLaps([])
  }

  const addLap = () => {
    if (running) setLaps((ls) => [baseRef.current, ...ls])
  }

  return (
    <div className="os-scroll flex h-full flex-col items-center justify-center gap-4 overflow-y-auto p-4">
      <p className="font-mono text-4xl font-black tabular-nums text-zinc-100">
        {fmtStopwatch(ms)}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button
          type="button"
          size="sm"
          onClick={toggleRun}
          className={
            running
              ? ''
              : 'bg-[var(--pengo-accent)] text-zinc-950 hover:bg-[var(--pengo-accent)]/90'
          }
        >
          {running ? <Pause className="size-4" /> : <Play className="size-4" />}
          {running ? 'توقف' : 'شروع'}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={addLap}
          disabled={!running}
          className="border-white/10 bg-zinc-900/60 text-zinc-300 hover:bg-white/10 hover:text-zinc-100"
        >
          <Plus className="size-4" />
          دور
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={reset}
          className="text-zinc-400 hover:bg-white/10 hover:text-zinc-100"
        >
          <RotateCcw className="size-4" />
          ریست
        </Button>
      </div>

      <div className="os-scroll max-h-40 w-60 overflow-y-auto rounded-xl border border-white/10 bg-zinc-900/50">
        {laps.length === 0 ? (
          <p className="px-3 py-3 text-center text-[11px] leading-5 text-zinc-600">
            {running
              ? 'می‌دوی؟ یه دور ثبت کن! 🏃'
              : 'هنوز دوری ثبت نشده. اول شروع کن!'}
          </p>
        ) : (
          laps.map((lapMs, i) => (
            <div
              key={i}
              className="flex items-center justify-between border-b border-white/5 px-3 py-1.5 text-xs last:border-b-0"
            >
              <span className="text-zinc-500">دور {faNum(laps.length - i)}</span>
              <span className="font-mono tabular-nums text-zinc-200">
                {fmtStopwatch(lapMs)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function TimerTab() {
  const [totalMs, setTotalMs] = useState(5 * 60_000)
  const [remainMs, setRemainMs] = useState(5 * 60_000)
  const [running, setRunning] = useState(false)
  const [draftMin, setDraftMin] = useState('5')
  const [draftSec, setDraftSec] = useState('0')

  const remainRef = useRef(remainMs)
  useEffect(() => {
    remainRef.current = remainMs
  }, [remainMs])

  useEffect(() => {
    if (!running) return
    const endAt = Date.now() + remainRef.current
    let done = false
    const iv = window.setInterval(() => {
      if (done) return
      const left = endAt - Date.now()
      if (left <= 0) {
        done = true
        setRemainMs(0)
        setRunning(false)
        announceTimerDone()
      } else {
        setRemainMs(left)
      }
    }, 200)
    return () => window.clearInterval(iv)
  }, [running])

  const setDuration = (ms: number) => {
    setTotalMs(ms)
    setRemainMs(ms)
    remainRef.current = ms
    setRunning(false)
  }

  const applyCustom = (minRaw: string, secRaw: string) => {
    const m = clampInt(minRaw, 0, 99)
    const s = clampInt(secRaw, 0, 59)
    setDuration(Math.max((m * 60 + s) * 1000, 5000))
  }

  const startPause = () => {
    if (!running && remainMs <= 0) {
      setRemainMs(totalMs)
      remainRef.current = totalMs
    }
    setRunning((r) => !r)
  }

  const reset = () => setDuration(totalMs)

  const frac =
    totalMs > 0 ? Math.min(1, Math.max(0, remainMs / totalMs)) : 0
  const dashOffset = RING_CIRCUMFERENCE * (1 - frac)
  const almostDone = remainMs > 0 && remainMs <= 10_000
  const finished = remainMs <= 0

  return (
    <div className="os-scroll flex h-full flex-col items-center justify-center gap-4 overflow-y-auto p-4">
      {/* چیپ‌های آماده */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {TIMER_PRESETS.map((p) => {
          const isActive = totalMs === p * 60_000
          return (
            <button
              key={p}
              type="button"
              onClick={() => {
                setDraftMin(String(p))
                setDraftSec('0')
                setDuration(p * 60_000)
              }}
              className={`rounded-full border px-3 py-1 text-xs font-bold transition active:scale-95 ${
                isActive
                  ? 'border-transparent bg-[var(--pengo-accent)] text-zinc-950'
                  : 'border-white/10 bg-zinc-800/60 text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              {faNum(p)} دقیقه
            </button>
          )
        })}
      </div>

      {/* حلقه پیشرفت */}
      <div className="relative size-44">
        <svg
          viewBox="0 0 160 160"
          className="size-full"
          role="img"
          aria-label="حلقه پیشرفت تایمر"
        >
          <circle
            cx="80"
            cy="80"
            r="70"
            fill="none"
            strokeWidth="10"
            className="stroke-zinc-800"
          />
          <circle
            cx="80"
            cy="80"
            r="70"
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            className={
              finished
                ? 'stroke-zinc-700'
                : almostDone
                  ? 'stroke-rose-400'
                  : 'stroke-[var(--pengo-accent)]'
            }
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 80 80)"
            style={{ transition: 'stroke-dashoffset 0.25s linear' }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <span
            className={`font-mono text-3xl font-black tabular-nums ${
              finished
                ? 'text-zinc-400'
                : almostDone
                  ? 'text-rose-300'
                  : 'text-zinc-100'
            }`}
          >
            {finished ? 'تمومه!' : fmtTimer(remainMs)}
          </span>
        </div>
      </div>

      {/* تنظیم دستی */}
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <Input
          type="number"
          min={0}
          max={99}
          inputMode="numeric"
          aria-label="دقیقه"
          value={draftMin}
          onChange={(e) => {
            setDraftMin(e.target.value)
            applyCustom(e.target.value, draftSec)
          }}
          className="h-8 w-14 border-white/10 bg-zinc-800/60 text-center text-sm"
        />
        <span>دقیقه</span>
        <Input
          type="number"
          min={0}
          max={59}
          inputMode="numeric"
          aria-label="ثانیه"
          value={draftSec}
          onChange={(e) => {
            setDraftSec(e.target.value)
            applyCustom(draftMin, e.target.value)
          }}
          className="h-8 w-14 border-white/10 bg-zinc-800/60 text-center text-sm"
        />
        <span>ثانیه</span>
      </div>

      <div className="flex items-center justify-center gap-2">
        <Button
          type="button"
          size="sm"
          onClick={startPause}
          className="bg-[var(--pengo-accent)] text-zinc-950 hover:bg-[var(--pengo-accent)]/90"
        >
          {running ? <Pause className="size-4" /> : <Play className="size-4" />}
          {running ? 'مکث' : 'شروع'}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={reset}
          className="text-zinc-400 hover:bg-white/10 hover:text-zinc-100"
        >
          <RotateCcw className="size-4" />
          ریست
        </Button>
      </div>

      <p className="text-[10px] text-zinc-600">
        حداقل ۵ ثانیه. صبور باش، چای تازه‌دم می‌خواد ☕
      </p>
    </div>
  )
}

export default function ClockApp() {
  const [now, setNow] = useState<Date>(() => new Date())

  useEffect(() => {
    const iv = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(iv)
  }, [])

  return (
    <Tabs defaultValue="clock" className="h-full w-full">
      <TabsList className="mx-auto mt-3 shrink-0 border border-white/10 bg-zinc-900">
        <TabsTrigger
          value="clock"
          className="text-zinc-400 data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100"
        >
          ساعت
        </TabsTrigger>
        <TabsTrigger
          value="stopwatch"
          className="text-zinc-400 data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100"
        >
          کرنومتر
        </TabsTrigger>
        <TabsTrigger
          value="timer"
          className="text-zinc-400 data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100"
        >
          تایمر
        </TabsTrigger>
      </TabsList>

      <TabsContent value="clock" className="min-h-0 flex-1">
        <div className="os-scroll flex h-full flex-col items-center justify-center gap-4 overflow-y-auto p-4">
          <AnalogClock now={now} />
          <div className="text-center">
            <p className="font-mono text-3xl font-black tabular-nums text-zinc-100">
              {now.toLocaleTimeString('fa-IR')}
            </p>
            <p className="mt-1 text-xs text-zinc-500">پنگوئن‌آباد، زمان محلی</p>
            <p className="mt-1 text-sm font-bold text-[var(--pengo-accent)]">
              {now.toLocaleDateString('fa-IR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
      </TabsContent>

      <TabsContent
        value="stopwatch"
        forceMount
        className="min-h-0 flex-1 data-[state=inactive]:hidden"
      >
        <StopwatchTab />
      </TabsContent>

      <TabsContent
        value="timer"
        forceMount
        className="min-h-0 flex-1 data-[state=inactive]:hidden"
      >
        <TimerTab />
      </TabsContent>
    </Tabs>
  )
}
