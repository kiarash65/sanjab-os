'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { PartyPopper, RotateCw, Trash2 } from 'lucide-react'
import { SUNJOB_PALETTE } from '@/lib/os/brand'

const WHEEL_COLORS = [
  SUNJOB_PALETTE.orange, // #f7931e
  SUNJOB_PALETTE.violet, // #8b5cf6
  SUNJOB_PALETTE.teal, // #0ea5a0
  SUNJOB_PALETTE.rose, // #e11d48
  '#f59e0b', // amber
  '#84cc16', // lime
  '#ec4899', // pink
  SUNJOB_PALETTE.orangeSoft, // #fdb56b
]

const DEFAULT_OPTIONS = `پیتزا
برگر
قورمه‌سبزی
آبگوشت
سالاد
ساندویچ
چلوکباب
هرچی خودش بلده`

const SPIN_DURATION = 4200
const TAU = Math.PI * 2
const POINTER_ANGLE = -Math.PI / 2 // بالای چرخ

const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'] as const

const toFa = (value: number | string): string =>
  String(value).replace(/\d/g, (digit) => FA_DIGITS[Number(digit)] ?? digit)

const easeOutCubic = (t: number): number => 1 - (1 - t) ** 3

/** اندیس بخش زیر عقربه با در نظر گرفتن چرخش فعلی */
function winnerIndexAt(rotation: number, count: number): number {
  if (count === 0) return 0
  const seg = TAU / count
  const local = (((POINTER_ANGLE - rotation) % TAU) + TAU) % TAU
  return Math.floor(local / seg) % count
}

const removeFirstLine = (text: string, line: string): string => {
  const lines = text.split('\n')
  const i = lines.findIndex((l) => l.trim() === line)
  if (i === -1) return text
  lines.splice(i, 1)
  return lines.join('\n')
}

interface ConfettiParticle {
  x: number
  y: number
  vx: number
  vy: number
  rot: number
  vr: number
  size: number
  color: string
  circle: boolean
}

export default function WheelApp() {
  const [text, setText] = useState(DEFAULT_OPTIONS)
  const [spinning, setSpinning] = useState(false)
  const [winner, setWinner] = useState<{ name: string; color: string } | null>(null)
  const [history, setHistory] = useState<Array<{ name: string; color: string }>>([])
  const [removeWinnerAfterSpin, setRemoveWinnerAfterSpin] = useState(false)

  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const confettiRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef(0)
  const confettiRafRef = useRef(0)
  const rotationRef = useRef(0)
  const sizeRef = useRef(320)
  const dprRef = useRef(1)

  const options = useMemo(
    () =>
      text
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0),
    [text]
  )

  const drawWheel = useCallback(
    (rotation: number) => {
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (!canvas || !ctx) return
      const dpr = dprRef.current
      const size = sizeRef.current
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, size, size)

      const cx = size / 2
      const cy = size / 2
      const r = size / 2 - 6
      const count = options.length

      // حلقهٔ بیرونی
      ctx.beginPath()
      ctx.arc(cx, cy, r + 3, 0, TAU)
      ctx.lineWidth = 5
      ctx.strokeStyle = 'rgba(255,255,255,0.14)'
      ctx.stroke()

      if (count === 0) {
        ctx.beginPath()
        ctx.setLineDash([8, 8])
        ctx.arc(cx, cy, r, 0, TAU)
        ctx.lineWidth = 3
        ctx.strokeStyle = 'rgba(255,255,255,0.25)'
        ctx.stroke()
        ctx.setLineDash([])
        ctx.fillStyle = 'rgba(255,255,255,0.4)'
        ctx.font = 'bold 14px Tahoma, sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('چرخ خالیه!', cx, cy)
        return
      }

      const seg = TAU / count
      for (let i = 0; i < count; i += 1) {
        const a0 = rotation + i * seg
        const a1 = a0 + seg
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.arc(cx, cy, r, a0, a1)
        ctx.closePath()
        ctx.fillStyle = WHEEL_COLORS[i % WHEEL_COLORS.length]
        ctx.fill()
        ctx.lineWidth = 1.5
        ctx.strokeStyle = 'rgba(11,17,32,0.45)'
        ctx.stroke()
      }

      // برچسب‌ها
      ctx.save()
      ctx.translate(cx, cy)
      ctx.direction = 'rtl'
      ctx.font = 'bold 12px Vazirmatn, Tahoma, sans-serif'
      ctx.textAlign = 'right'
      ctx.textBaseline = 'middle'
      for (let i = 0; i < count; i += 1) {
        const raw = options[i] ?? ''
        const label = raw.length > 14 ? `${raw.slice(0, 13)}…` : raw
        ctx.save()
        ctx.rotate(rotation + i * seg + seg / 2)
        ctx.fillStyle = SUNJOB_PALETTE.navyDeep
        ctx.fillText(label, r - 10, 0, r * 0.62)
        ctx.restore()
      }
      ctx.restore()

      // توپی مرکزی
      ctx.beginPath()
      ctx.arc(cx, cy, 14, 0, TAU)
      ctx.fillStyle = '#18181b'
      ctx.fill()
      ctx.lineWidth = 2
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(cx, cy, 5, 0, TAU)
      ctx.fillStyle = SUNJOB_PALETTE.orange
      ctx.fill()
    },
    [options]
  )

  // اندازه‌گیری واکنش‌گرا + رسم اولیه
  useEffect(() => {
    const measure = () => {
      const wrap = wrapRef.current
      if (!wrap) return
      const size = Math.max(240, Math.min(320, wrap.clientWidth))
      const dpr = window.devicePixelRatio || 1
      sizeRef.current = size
      dprRef.current = dpr
      for (const canvas of [canvasRef.current, confettiRef.current]) {
        if (!canvas) continue
        canvas.width = Math.round(size * dpr)
        canvas.height = Math.round(size * dpr)
        canvas.style.width = `${size}px`
        canvas.style.height = `${size}px`
      }
      drawWheel(rotationRef.current)
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (wrapRef.current) ro.observe(wrapRef.current)
    return () => ro.disconnect()
  }, [drawWheel])

  // انیمیشن کانفتی
  const startConfetti = useCallback(() => {
    const canvas = confettiRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const dpr = dprRef.current
    const size = sizeRef.current
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const particles: ConfettiParticle[] = Array.from({ length: 60 }, () => ({
      x: size / 2 + (Math.random() * 2 - 1) * 40,
      y: size / 2,
      vx: (Math.random() * 2 - 1) * 170,
      vy: -(90 + Math.random() * 190),
      rot: Math.random() * TAU,
      vr: (Math.random() * 2 - 1) * 9,
      size: 4 + Math.random() * 5,
      color: WHEEL_COLORS[Math.floor(Math.random() * WHEEL_COLORS.length)],
      circle: Math.random() < 0.5,
    }))

    const t0 = performance.now()
    const dt = 1 / 60
    cancelAnimationFrame(confettiRafRef.current)
    const step = (now: number) => {
      const progress = Math.min(1, (now - t0) / 1500)
      ctx.clearRect(0, 0, size, size)
      for (const p of particles) {
        p.vy += 440 * dt
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.rot += p.vr * dt
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.globalAlpha = 1 - progress * progress
        ctx.fillStyle = p.color
        if (p.circle) {
          ctx.beginPath()
          ctx.arc(0, 0, p.size / 2, 0, TAU)
          ctx.fill()
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 3, p.size, (p.size * 2) / 3)
        }
        ctx.restore()
      }
      if (progress < 1) {
        confettiRafRef.current = requestAnimationFrame(step)
      } else {
        ctx.clearRect(0, 0, size, size)
      }
    }
    confettiRafRef.current = requestAnimationFrame(step)
  }, [])

  const spin = () => {
    if (spinning || options.length < 2) return
    cancelAnimationFrame(rafRef.current)
    setWinner(null)

    const count = options.length
    const start = rotationRef.current
    const turns = 4 + Math.floor(Math.random() * 4) // ۴ تا ۷ دور کامل
    const target = start + turns * TAU + Math.random() * TAU
    const t0 = performance.now()
    setSpinning(true)

    const step = (now: number) => {
      const progress = Math.min(1, (now - t0) / SPIN_DURATION)
      const rotation = start + (target - start) * easeOutCubic(progress)
      rotationRef.current = rotation
      drawWheel(rotation)
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step)
        return
      }
      const idx = winnerIndexAt(rotationRef.current, count)
      const name = options[idx] ?? ''
      const color = WHEEL_COLORS[idx % WHEEL_COLORS.length]
      setWinner({ name, color })
      setHistory((h) => [{ name, color }, ...h].slice(0, 5))
      setSpinning(false)
      startConfetti()
      if (removeWinnerAfterSpin) {
        setText((prev) => removeFirstLine(prev, name))
      }
    }
    rafRef.current = requestAnimationFrame(step)
  }

  // پاک‌سازی هنگام بسته‌شدن پنجره
  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current)
      cancelAnimationFrame(confettiRafRef.current)
    }
  }, [])

  const canSpin = options.length >= 2 && !spinning

  return (
    <div className="flex h-full w-full flex-col bg-zinc-950/60">
      <div className="os-scroll flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
        <h2 className="flex items-center gap-1.5 text-sm font-black text-zinc-100">
          چرخ شانس
          <span className="text-base" aria-hidden>
            🎯
          </span>
        </h2>

        {/* چرخ */}
        <div ref={wrapRef} className="relative flex justify-center pt-5">
          <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2">
            <div
              className="drop-shadow-md"
              style={{
                width: 0,
                height: 0,
                borderLeft: '10px solid transparent',
                borderRight: '10px solid transparent',
                borderTop: '18px solid #e11d48',
              }}
              aria-hidden
            />
          </div>
          <div className="relative">
            <canvas ref={canvasRef} className="relative z-0" />
            <canvas ref={confettiRef} className="pointer-events-none absolute left-0 top-0 z-20" />
          </div>
        </div>

        {/* کارت برنده */}
        <div className="min-h-[58px]" aria-live="polite">
          {winner ? (
            <div
              style={{ borderColor: `${winner.color}66` }}
              className="flex items-center justify-center gap-2 rounded-xl border bg-zinc-900/60 p-2.5 text-center"
            >
              <PartyPopper className="size-5 shrink-0" style={{ color: winner.color }} />
              <span className="text-xs text-zinc-400">برنده شد:</span>
              <span className="text-base font-black" style={{ color: winner.color }}>
                {winner.name}
              </span>
            </div>
          ) : (
            <p className="pt-2 text-center text-xs text-zinc-500">
              {spinning ? 'داره می‌چرخه… نفس رو حبس کن!' : 'چرخ رو بچرخون تا شانس‌تو امتحان کنی!'}
            </p>
          )}
        </div>

        {/* دکمهٔ چرخش */}
        <button
          type="button"
          onClick={spin}
          disabled={!canSpin}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-[#7c3aed] to-[#8b5cf6] py-3 text-sm font-black text-white shadow-lg shadow-violet-500/20 transition hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
        >
          <RotateCw className="size-4" />
          {spinning ? 'داره می‌چرخه…' : 'بچرخون!'}
        </button>
        {options.length < 2 && (
          <p className="-mt-1.5 text-center text-[11px] font-bold text-rose-300">
            برای چرخاندن چرخ حداقل دو گزینه لازمه! {toFa(options.length)} گزینه روی چرخه.
          </p>
        )}

        {/* گزینه‌ها */}
        <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-300">
              گزینه‌ها (هر خط یک گزینه)
            </span>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-black"
              style={{ backgroundColor: `${SUNJOB_PALETTE.teal}26`, color: SUNJOB_PALETTE.teal }}
            >
              {toFa(options.length)} گزینه
            </span>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            aria-label="گزینه‌های چرخ"
            className="os-scroll w-full resize-none rounded-lg border border-white/10 bg-zinc-800/70 p-2 text-xs leading-6 text-zinc-100 outline-none placeholder:text-zinc-600"
            placeholder={'پیتزا\nبرگر\n…'}
          />
          <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs text-zinc-200">
            <input
              type="checkbox"
              checked={removeWinnerAfterSpin}
              onChange={(e) => setRemoveWinnerAfterSpin(e.target.checked)}
              className="size-4 cursor-pointer rounded"
              style={{ accentColor: SUNJOB_PALETTE.rose }}
            />
            <Trash2 className="size-3.5" style={{ color: SUNJOB_PALETTE.rose }} aria-hidden />
            حذف برنده از چرخ بعد از هر دور
          </label>
        </div>

        {/* تاریخچه */}
        <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-3">
          <p className="mb-2 text-xs font-bold text-zinc-300">برنده‌های قبلی</p>
          {history.length === 0 ? (
            <p className="text-[11px] text-zinc-600">هنوز کسی برنده نشده؛ اولین نفر باش!</p>
          ) : (
            <ul className="space-y-1.5">
              {history.map((h, i) => (
                <li key={`${h.name}-${i}`} className="flex items-center gap-2 text-xs">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: h.color }}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 truncate text-zinc-200">{h.name}</span>
                  <span className="shrink-0 text-[10px] text-zinc-600">
                    {toFa(history.length - i)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
