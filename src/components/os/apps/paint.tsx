'use client'

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { Download, Eraser, Rainbow, Trash2 } from 'lucide-react'
import { useOS } from '@/lib/os/store'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'

const CANVAS_BG = '#0a0f0a'
const COLORS: readonly string[] = [
  '#f8fafc',
  '#fb7185',
  '#fb923c',
  '#f59e0b',
  '#22c55e',
  '#14b8a6',
  '#a78bfa',
  '#f472b6',
  '#facc15',
  '#71717a',
]

const faNum = (n: number): string => n.toLocaleString('fa-IR')

interface Point {
  x: number
  y: number
}

export default function PaintApp() {
  const [color, setColor] = useState<string>(COLORS[0] ?? '#f8fafc')
  const [size, setSize] = useState(6)
  const [eraser, setEraser] = useState(false)
  const [rainbow, setRainbow] = useState(false)
  const [touched, setTouched] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const drawingRef = useRef(false)
  const lastRef = useRef<Point | null>(null)
  const hueRef = useRef(0)

  const pushToast = useOS((s) => s.pushToast)

  // آماده‌سازی بوم + حفظ نقاشی موقع تغییر اندازه
  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = wrap.getBoundingClientRect()
      const w = Math.max(1, Math.round(rect.width))
      const h = Math.max(1, Math.round(rect.height))
      const targetW = Math.round(w * dpr)
      const targetH = Math.round(h * dpr)
      if (canvas.width === targetW && canvas.height === targetH) return

      // اسنپ‌شات از نقاشی قبلی
      const snapshot = document.createElement('canvas')
      snapshot.width = canvas.width
      snapshot.height = canvas.height
      const sctx = snapshot.getContext('2d')
      if (sctx && canvas.width > 0 && canvas.height > 0) {
        sctx.drawImage(canvas, 0, 0)
      }

      canvas.width = targetW
      canvas.height = targetH
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.fillStyle = CANVAS_BG
      ctx.fillRect(0, 0, w, h)
      if (snapshot.width > 0 && snapshot.height > 0) {
        ctx.drawImage(snapshot, 0, 0, snapshot.width, snapshot.height, 0, 0, w, h)
      }
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [])

  const strokeColor = (): string => {
    if (eraser) return CANVAS_BG
    if (rainbow) return `hsl(${hueRef.current} 90% 60%)`
    return color
  }

  const getPos = (e: ReactPointerEvent<HTMLCanvasElement>): Point => {
    const rect = e.currentTarget.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const handleDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drawingRef.current = true
    const p = getPos(e)
    lastRef.current = p
    setTouched(true)
    // نقطه کوچیک برای تک‌کلیک
    ctx.fillStyle = strokeColor()
    ctx.beginPath()
    ctx.arc(p.x, p.y, size / 2, 0, Math.PI * 2)
    ctx.fill()
  }

  const handleMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return
    const ctx = canvasRef.current?.getContext('2d')
    const last = lastRef.current
    if (!ctx || !last) return
    const p = getPos(e)
    ctx.strokeStyle = strokeColor()
    ctx.lineWidth = size
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(last.x, last.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    lastRef.current = p
    if (rainbow) hueRef.current = (hueRef.current + 8) % 360
  }

  const endStroke = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return
    drawingRef.current = false
    lastRef.current = null
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* کپچر از قبل رها شده، مهم نیست */
    }
  }

  const pickColor = (c: string) => {
    setColor(c)
    setEraser(false)
    setRainbow(false)
  }

  const toggleEraser = () => {
    const next = !eraser
    setEraser(next)
    if (next) setRainbow(false)
  }

  const toggleRainbow = () => {
    const next = !rainbow
    setRainbow(next)
    if (next) {
      setEraser(false)
      hueRef.current = 0
    }
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !wrap || !ctx) return
    const dpr = window.devicePixelRatio || 1
    const rect = wrap.getBoundingClientRect()
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.fillStyle = CANVAS_BG
    ctx.fillRect(0, 0, rect.width, rect.height)
    drawingRef.current = false
    lastRef.current = null
    setTouched(false)
    pushToast({
      icon: '🧽',
      title: 'پاک شد!',
      body: 'صفحه سفید ذهنی هم شد.',
    })
  }

  const downloadPng = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    try {
      const a = document.createElement('a')
      a.href = canvas.toDataURL('image/png')
      a.download = 'pengo-paint.png'
      document.body.appendChild(a)
      a.click()
      a.remove()
      pushToast({
        icon: '💾',
        title: 'نقاشی ذخیره شد',
        body: 'اکنون یک هنرمند وبی هستی!',
      })
    } catch {
      pushToast({
        icon: '😱',
        title: 'ذخیره نشد!',
        body: 'مرورگر گیر داد. یه بار دیگه امتحان کن.',
      })
    }
  }

  return (
    <div className="flex h-full w-full flex-col">
      {/* نوار ابزار */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-white/10 bg-zinc-900/60 p-2">
        {COLORS.map((c) => {
          const active = color === c && !eraser && !rainbow
          return (
            <button
              key={c}
              type="button"
              aria-label={`رنگ ${c}`}
              aria-pressed={active}
              onClick={() => pickColor(c)}
              style={{ backgroundColor: c }}
              className={`size-7 rounded-full border-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 active:scale-95 ${
                active
                  ? 'scale-110 border-white ring-2 ring-white'
                  : 'border-white/10 hover:scale-105'
              }`}
            />
          )
        })}

        <div className="mx-0.5 h-6 w-px bg-white/10" aria-hidden />

        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-pressed={eraser}
          aria-label="پاک‌کن"
          title="پاک‌کن"
          onClick={toggleEraser}
          className={`size-8 transition active:scale-95 ${
            eraser
              ? 'bg-[var(--pengo-accent)] text-zinc-950 hover:bg-[var(--pengo-accent)]/80 hover:text-zinc-950'
              : 'text-zinc-300 hover:bg-white/10 hover:text-zinc-100'
          }`}
        >
          <Eraser className="size-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-pressed={rainbow}
          aria-label="حالت رنگین‌کمان"
          title="حالت رنگین‌کمان 🌈"
          onClick={toggleRainbow}
          className={`size-8 transition active:scale-95 ${
            rainbow
              ? 'bg-[var(--pengo-accent)] text-zinc-950 hover:bg-[var(--pengo-accent)]/80 hover:text-zinc-950'
              : 'text-zinc-300 hover:bg-white/10 hover:text-zinc-100'
          }`}
        >
          <Rainbow className="size-4" />
        </Button>

        <div className="flex items-center gap-1.5">
          <Slider
            min={2}
            max={30}
            value={[size]}
            onValueChange={(v) => setSize(v[0] ?? size)}
            className="w-28"
            aria-label="ضخامت قلم"
          />
          <span className="w-6 text-center text-[10px] tabular-nums text-zinc-500">
            {faNum(size)}
          </span>
        </div>

        <div className="ms-auto flex items-center gap-2">
          <Button
            type="button"
            size="icon"
            variant="outline"
            aria-label="پاک کردن بوم"
            title="پاک کردن بوم"
            onClick={clearCanvas}
            className="size-8 border-white/10 bg-zinc-900/60 text-zinc-300 hover:bg-white/10 hover:text-zinc-100"
          >
            <Trash2 className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="secondary"
            aria-label="ذخیره نقاشی"
            title="ذخیره نقاشی"
            onClick={downloadPng}
            className="size-8"
          >
            <Download className="size-4" />
          </Button>
        </div>
      </div>

      {/* بوم */}
      <div ref={wrapRef} className="relative min-h-0 flex-1 overflow-hidden">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full cursor-crosshair touch-none"
          onPointerDown={handleDown}
          onPointerMove={handleMove}
          onPointerUp={endStroke}
          onPointerCancel={endStroke}
        />
        {!touched && (
          <div
            className="pointer-events-none absolute inset-0 grid place-items-center"
            aria-hidden
          >
            <div className="rounded-xl bg-black/30 px-4 py-2 text-xs text-zinc-400">
              اینجا بکش! هنر پنگوئنی‌ات رو نشون بده 🎨
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
