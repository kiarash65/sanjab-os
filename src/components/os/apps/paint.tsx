'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import {
  ArrowUpRight, Brush, Circle, Download, Droplet, Eraser, FlipHorizontal2, Highlighter, Minus, PaintBucket,
  Pipette, Redo2, Sparkles, Square, Trash2, Type, Undo2, Wallpaper, Zap, type LucideIcon,
} from 'lucide-react'
import { useOS } from '@/lib/os/store'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'

type Tool = 'brush' | 'marker' | 'spray' | 'neon' | 'eraser' | 'line' | 'rect' | 'ellipse' | 'arrow' | 'fill' | 'pick' | 'text'
type BgKey = 'dark' | 'white' | 'cream' | 'grid' | 'ruled'
interface Point { x: number; y: number }
interface ToolDef { id: Tool; icon: LucideIcon; label: string }
interface BgDef { id: BgKey; label: string; base: string; line: string; css: CSSProperties }
interface ToolButtonProps { active?: boolean; danger?: boolean; disabled?: boolean; label: string; onClick: () => void; children: ReactNode }

const FILL_TOLERANCE = 32
const HISTORY_MAX = 30
const GRID_STEP = 24
const SPRAY_DOTS = 24

const TOOLS: readonly ToolDef[] = [
  { id: 'brush', icon: Brush, label: 'قلم‌مو' }, { id: 'marker', icon: Highlighter, label: 'ماجیک' },
  { id: 'spray', icon: Sparkles, label: 'اسپری' }, { id: 'neon', icon: Zap, label: 'نئون' },
  { id: 'eraser', icon: Eraser, label: 'پاک‌کن' }, { id: 'line', icon: Minus, label: 'خط' },
  { id: 'rect', icon: Square, label: 'مستطیل' }, { id: 'ellipse', icon: Circle, label: 'بیضی' },
  { id: 'arrow', icon: ArrowUpRight, label: 'فلش' }, { id: 'fill', icon: PaintBucket, label: 'دریچه رنگ' },
  { id: 'pick', icon: Pipette, label: 'قطره‌چکان' }, { id: 'text', icon: Type, label: 'متن' },
]

const BGS: readonly BgDef[] = [
  { id: 'dark', label: 'تیره', base: '#0a0f0a', line: '', css: { backgroundColor: '#0a0f0a' } },
  { id: 'white', label: 'سفید', base: '#ffffff', line: '', css: { backgroundColor: '#ffffff' } },
  { id: 'cream', label: 'کرم', base: '#fffdf5', line: '', css: { backgroundColor: '#fffdf5' } },
  {
    id: 'grid', label: 'کاغذ شطرنجی', base: '#fffdf5', line: 'rgba(24,24,27,0.08)',
    css: {
      backgroundColor: '#fffdf5',
      backgroundImage:
        'linear-gradient(to right, rgba(24,24,27,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(24,24,27,0.08) 1px, transparent 1px)',
      backgroundSize: '24px 24px',
    },
  },
  {
    id: 'ruled', label: 'کاغذ خط‌دار', base: '#ffffff', line: 'rgba(56,115,189,0.18)',
    css: {
      backgroundColor: '#ffffff',
      backgroundImage: 'linear-gradient(to bottom, rgba(56,115,189,0.18) 1px, transparent 1px)',
      backgroundSize: '24px 24px',
    },
  },
]

const COLORS: readonly string[] = [
  '#f8fafc', '#f7931e', '#ef4444', '#fb7185', '#f97316', '#facc15', '#22c55e',
  '#14b8a6', '#38bdf8', '#6366f1', '#a78bfa', '#f472b6', '#a3a3a3', '#171717',
]

const faNum = (n: number): string => n.toLocaleString('fa-IR')
const clamp = (v: number, min: number, max: number): number => Math.min(max, Math.max(min, v))
const isShapeTool = (t: Tool): boolean => t === 'line' || t === 'rect' || t === 'ellipse' || t === 'arrow'
const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = Number.parseInt(full, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function ToolButton({ active, danger, disabled, label, onClick, children }: ToolButtonProps) {
  return (
    <Button
      type="button" size="icon" variant="ghost" aria-pressed={active} aria-label={label} title={label}
      onClick={onClick} disabled={disabled}
      className={`size-8 shrink-0 transition active:scale-95 ${danger ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300' : active ? 'bg-[var(--pengo-accent)] text-zinc-950 hover:bg-[var(--pengo-accent)]/80 hover:text-zinc-950' : 'text-zinc-300 hover:bg-white/10 hover:text-zinc-100'}`}
    >
      {children}
    </Button>
  )
}

export default function PaintApp() {
  const pushToast = useOS((s) => s.pushToast)
  const [tool, setTool] = useState<Tool>('brush')
  const [color, setColor] = useState<string>(COLORS[0] ?? '#f8fafc')
  const [size, setSize] = useState(6)
  const [fillShape, setFillShape] = useState(false)
  const [symmetry, setSymmetry] = useState(false)
  const [bg, setBg] = useState<BgKey>('dark')
  const [touched, setTouched] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const [hist, setHist] = useState({ u: 0, r: 0 })
  const [wrapW, setWrapW] = useState(0)
  const [textDraft, setTextDraft] = useState<{ x: number; y: number; value: string } | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const drawingRef = useRef(false)
  const lastRef = useRef<Point | null>(null)
  const startRef = useRef<Point | null>(null)
  const baseRef = useRef<ImageData | null>(null)
  const pointsRef = useRef<Point[]>([])
  const undoRef = useRef<ImageData[]>([])
  const redoRef = useRef<ImageData[]>([])
  const prevToolRef = useRef<Tool>('brush')
  const clearTimerRef = useRef<number | null>(null)
  const exportedRef = useRef(false)
  const sizeRef = useRef({ w: 0, h: 0 })

  // ---------- تاریخچه: اسنپ‌شات ImageData، حداکثر ۳۰ مرحله ----------
  const snap = useCallback((): ImageData | null => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || canvas.width < 1 || canvas.height < 1) return null
    try { return ctx.getImageData(0, 0, canvas.width, canvas.height) } catch { return null }
  }, [])
  const applySnap = useCallback((data: ImageData) => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.putImageData(data, 0, 0)
    ctx.restore()
  }, [])
  const pushHistory = useCallback(() => {
    const data = snap()
    if (!data) return
    undoRef.current.push(data)
    if (undoRef.current.length > HISTORY_MAX) undoRef.current.shift()
    redoRef.current = []
    setHist({ u: undoRef.current.length, r: 0 })
  }, [snap])
  const undo = useCallback(() => {
    const prev = undoRef.current.pop()
    if (!prev) return
    const cur = snap()
    if (cur) redoRef.current.push(cur)
    applySnap(prev)
    setHist({ u: undoRef.current.length, r: redoRef.current.length })
  }, [applySnap, snap])
  const redo = useCallback(() => {
    const next = redoRef.current.pop()
    if (!next) return
    const cur = snap()
    if (cur) undoRef.current.push(cur)
    if (undoRef.current.length > HISTORY_MAX) undoRef.current.shift()
    applySnap(next)
    setHist({ u: undoRef.current.length, r: redoRef.current.length })
  }, [applySnap, snap])

  // میان‌بر Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y (وقتی فوکوس روی ورودی نیست)
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      if (!(e.ctrlKey || e.metaKey)) return
      const k = e.key.toLowerCase()
      if (k === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo() } else if (k === 'y') { e.preventDefault(); redo() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [redo, undo])

  // ---------- بوم DPR-aware + حفظ نقاشی موقع تغییر اندازه (بوم شفاف، پس‌زمینه CSS) ----------
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
      sizeRef.current = { w, h }
      setWrapW((prev) => (prev === w ? prev : w))
      const targetW = Math.round(w * dpr); const targetH = Math.round(h * dpr)
      if (canvas.width === targetW && canvas.height === targetH) return
      // اسنپ‌شات از نقاشی قبلی
      const snapshot = document.createElement('canvas')
      snapshot.width = canvas.width; snapshot.height = canvas.height
      const sctx = snapshot.getContext('2d')
      if (sctx && canvas.width > 0 && canvas.height > 0) sctx.drawImage(canvas, 0, 0)
      canvas.width = targetW; canvas.height = targetH
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      if (snapshot.width > 0 && snapshot.height > 0) {
        ctx.drawImage(snapshot, 0, 0, snapshot.width, snapshot.height, 0, 0, w, h)
      }
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [])
  useEffect(() => () => { if (clearTimerRef.current) window.clearTimeout(clearTimerRef.current) }, [])

  // ---------- اولیت‌های ترسیم ----------
  const getPos = (e: ReactPointerEvent<HTMLCanvasElement>): Point => {
    const rect = e.currentTarget.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }
  const drawDab = (ctx: CanvasRenderingContext2D, p: Point, r: number, style: string): void => {
    ctx.fillStyle = style
    ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill()
  }
  const strokeSeg = (ctx: CanvasRenderingContext2D, a: Point, b: Point, style: string, width: number): void => {
    ctx.strokeStyle = style
    ctx.lineWidth = width
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()
  }
  const sprayDots = (ctx: CanvasRenderingContext2D, p: Point, width: number, style: string, mw: number): void => {
    const r = width * 1.6
    const dot = Math.max(0.8, width / 6)
    ctx.fillStyle = style
    for (let i = 0; i < SPRAY_DOTS; i += 1) {
      const ang = Math.random() * Math.PI * 2
      const dist = Math.sqrt(Math.random()) * r
      const x = p.x + Math.cos(ang) * dist
      const y = p.y + Math.sin(ang) * dist
      ctx.beginPath(); ctx.arc(x, y, dot, 0, Math.PI * 2); ctx.fill()
      if (mw > 0) {
        ctx.beginPath(); ctx.arc(mw - x, y, dot, 0, Math.PI * 2); ctx.fill()
      }
    }
  }
  const neonDab = (ctx: CanvasRenderingContext2D, p: Point, width: number, col: string): void => {
    ctx.save(); ctx.shadowColor = col; ctx.shadowBlur = width * 2
    drawDab(ctx, p, width / 2, col)
    ctx.restore()
    drawDab(ctx, p, Math.max(1, width / 6), '#ffffff') // هسته سفید
  }
  const neonSeg = (ctx: CanvasRenderingContext2D, a: Point, b: Point, width: number, col: string): void => {
    ctx.save(); ctx.shadowColor = col; ctx.shadowBlur = width * 2
    strokeSeg(ctx, a, b, col, width)
    ctx.shadowBlur = 0
    strokeSeg(ctx, a, b, '#ffffff', Math.max(1, width / 3))
    ctx.restore()
  }
  const strokeMarkerPath = (ctx: CanvasRenderingContext2D, pts: Point[], width: number, col: string, mw: number): void => {
    const draw = (list: Point[]): void => {
      if (list.length < 2) return
      ctx.strokeStyle = col; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
      ctx.beginPath()
      ctx.moveTo(list[0].x, list[0].y)
      for (let i = 1; i < list.length; i += 1) ctx.lineTo(list[i].x, list[i].y)
      ctx.stroke()
    }
    ctx.save()
    ctx.globalAlpha = 0.35
    draw(pts)
    if (mw > 0) draw(pts.map((p) => ({ x: mw - p.x, y: p.y })))
    ctx.restore()
  }
  const drawShape = (ctx: CanvasRenderingContext2D, a: Point, b: Point, kind: Tool, width: number, col: string, filled: boolean): void => {
    ctx.save()
    ctx.strokeStyle = col
    ctx.fillStyle = col
    ctx.lineWidth = width
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    if (kind === 'line') {
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke()
    } else if (kind === 'rect') {
      const x = Math.min(a.x, b.x); const y = Math.min(a.y, b.y)
      const w2 = Math.abs(b.x - a.x); const h2 = Math.abs(b.y - a.y)
      if (filled) ctx.fillRect(x, y, w2, h2)
      else ctx.strokeRect(x, y, w2, h2)
    } else if (kind === 'ellipse') {
      ctx.beginPath()
      ctx.ellipse((a.x + b.x) / 2, (a.y + b.y) / 2, Math.abs(b.x - a.x) / 2, Math.abs(b.y - a.y) / 2, 0, 0, Math.PI * 2)
      if (filled) ctx.fill()
      else ctx.stroke()
    } else if (kind === 'arrow') {
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke()
      const ang = Math.atan2(b.y - a.y, b.x - a.x)
      const head = Math.max(10, width * 2.5)
      ctx.beginPath()
      ctx.moveTo(b.x, b.y)
      ctx.lineTo(b.x - head * Math.cos(ang - Math.PI / 7), b.y - head * Math.sin(ang - Math.PI / 7))
      ctx.moveTo(b.x, b.y)
      ctx.lineTo(b.x - head * Math.cos(ang + Math.PI / 7), b.y - head * Math.sin(ang + Math.PI / 7))
      ctx.stroke()
    }
    ctx.restore()
  }
  const restoreBase = (ctx: CanvasRenderingContext2D): void => {
    const base = baseRef.current
    if (base) ctx.putImageData(base, 0, 0) // پیش‌نمایش شکل/ماجیک: بازگردانی پایه + رسم مجدد
  }

  // ---------- دریچه رنگ: scanline flood fill با تلورانس ۳۲ ----------
  const floodFill = (ctx: CanvasRenderingContext2D, p: Point): void => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const w = canvas.width
    const h = canvas.height
    const sx = clamp(Math.floor(p.x * dpr), 0, w - 1); const sy = clamp(Math.floor(p.y * dpr), 0, h - 1)
    const img = ctx.getImageData(0, 0, w, h)
    const data = img.data
    const i0 = (sy * w + sx) * 4
    const r0 = data[i0]; const g0 = data[i0 + 1]
    const b0 = data[i0 + 2]; const a0 = data[i0 + 3]
    const [fr, fg, fb] = hexToRgb(color)
    if (Math.abs(r0 - fr) <= FILL_TOLERANCE && Math.abs(g0 - fg) <= FILL_TOLERANCE && Math.abs(b0 - fb) <= FILL_TOLERANCE && a0 > 255 - FILL_TOLERANCE) return
    const near = (i: number): boolean =>
      Math.abs(data[i] - r0) <= FILL_TOLERANCE &&
      Math.abs(data[i + 1] - g0) <= FILL_TOLERANCE &&
      Math.abs(data[i + 2] - b0) <= FILL_TOLERANCE &&
      Math.abs(data[i + 3] - a0) <= FILL_TOLERANCE
    const visited = new Uint8Array(w * h)
    const stack: number[] = [sx, sy]
    while (stack.length > 0) {
      const y = stack.pop() as number
      const x = stack.pop() as number
      if (x < 0 || x >= w || y < 0 || y >= h || visited[y * w + x] === 1) continue
      let xl = x
      while (xl >= 0 && visited[y * w + xl] === 0 && near((y * w + xl) * 4)) xl -= 1
      xl += 1
      let xr = x
      while (xr < w && visited[y * w + xr] === 0 && near((y * w + xr) * 4)) xr += 1
      xr -= 1
      for (let xi = xl; xi <= xr; xi += 1) {
        visited[y * w + xi] = 1
        const fi = (y * w + xi) * 4
        data[fi] = fr; data[fi + 1] = fg; data[fi + 2] = fb; data[fi + 3] = 255
      }
      for (const ny of [y - 1, y + 1]) {
        if (ny < 0 || ny >= h) continue
        let inRun = false
        for (let xi = xl; xi <= xr; xi += 1) {
          const ok = visited[ny * w + xi] === 0 && near((ny * w + xi) * 4)
          if (ok && !inRun) { stack.push(xi, ny); inRun = true } else if (!ok) { inRun = false }
        }
      }
    }
    ctx.putImageData(img, 0, 0)
  }

  // ---------- پس‌زمینه و خروجی ترکیبی (پس‌زمینه + نقاشی) ----------
  const paintBackground = useCallback((ctx: CanvasRenderingContext2D, key: BgKey, w: number, h: number): void => {
    const def = BGS.find((b) => b.id === key) ?? BGS[0]
    ctx.save()
    ctx.fillStyle = def.base; ctx.fillRect(0, 0, w, h)
    if (def.line) {
      ctx.strokeStyle = def.line; ctx.lineWidth = 1
      ctx.beginPath()
      if (key === 'grid') {
        for (let v = GRID_STEP; v < w; v += GRID_STEP) { ctx.moveTo(v + 0.5, 0); ctx.lineTo(v + 0.5, h) }
      }
      for (let v = GRID_STEP; v < h; v += GRID_STEP) { ctx.moveTo(0, v + 0.5); ctx.lineTo(w, v + 0.5) }
      ctx.stroke()
    }
    ctx.restore()
  }, [])
  const makeComposite = useCallback((): HTMLCanvasElement | null => {
    const art = canvasRef.current
    if (!art || art.width < 1 || art.height < 1) return null
    const t = document.createElement('canvas')
    t.width = art.width; t.height = art.height
    const tctx = t.getContext('2d')
    if (!tctx) return null
    const dpr = window.devicePixelRatio || 1
    tctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    paintBackground(tctx, bg, art.width / dpr, art.height / dpr)
    tctx.setTransform(1, 0, 0, 1, 0, 0); tctx.drawImage(art, 0, 0)
    return t
  }, [bg, paintBackground])

  // ---------- ابزارهای کلیکی ----------
  const pickColorAt = (p: Point): void => {
    const comp = makeComposite()
    const tctx = comp?.getContext('2d')
    if (!comp || !tctx) return
    const dpr = window.devicePixelRatio || 1
    const x = clamp(Math.floor(p.x * dpr), 0, comp.width - 1); const y = clamp(Math.floor(p.y * dpr), 0, comp.height - 1)
    const d = tctx.getImageData(x, y, 1, 1).data
    setColor(`#${[d[0], d[1], d[2]].map((v) => v.toString(16).padStart(2, '0')).join('')}`)
    setTool(prevToolRef.current) // بعد از برداشت رنگ، برگرد به ابزار قبلی
  }
  const selectTool = (t: Tool): void => {
    if (t === 'pick' && tool !== 'pick') prevToolRef.current = tool
    setTool(t)
  }
  const commitText = (): void => {
    const draft = textDraft
    setTextDraft((d) => (d === draft ? null : d))
    if (!draft || !draft.value.trim()) return
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    pushHistory()
    ctx.save()
    ctx.direction = 'rtl'; ctx.textAlign = 'right'; ctx.textBaseline = 'top'
    ctx.fillStyle = color
    ctx.font = `${size * 3}px Vazirmatn, sans-serif`
    ctx.fillText(draft.value, draft.x, draft.y)
    ctx.restore()
    setTouched(true)
  }

  // ---------- رویدادهای پوینتر ----------
  const handleDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const p = getPos(e)
    if (tool === 'pick') {
      pickColorAt(p)
      return
    }
    if (tool === 'fill') {
      pushHistory(); setTouched(true); floodFill(ctx, p); return
    }
    if (tool === 'text') {
      setTextDraft({ x: p.x, y: p.y, value: '' }) // ورودی قبلی هنگام blur خودش commit می‌شود
      return
    }
    e.currentTarget.setPointerCapture(e.pointerId)
    drawingRef.current = true
    startRef.current = p
    lastRef.current = p
    setTouched(true)
    pushHistory() // اسنپ‌شات «قبل از حرکت»
    const mw = symmetry ? sizeRef.current.w : 0
    if (tool === 'brush') {
      drawDab(ctx, p, size / 2, color)
      if (mw > 0) drawDab(ctx, { x: mw - p.x, y: p.y }, size / 2, color)
    } else if (tool === 'eraser') {
      ctx.save(); ctx.globalCompositeOperation = 'destination-out'
      drawDab(ctx, p, size / 2, '#000')
      ctx.restore()
    } else if (tool === 'spray') {
      sprayDots(ctx, p, size, color, mw)
    } else if (tool === 'neon') {
      neonDab(ctx, p, size, color)
      if (mw > 0) neonDab(ctx, { x: mw - p.x, y: p.y }, size, color)
    } else if (tool === 'marker') {
      pointsRef.current = [p]
      baseRef.current = snap()
      ctx.save(); ctx.globalAlpha = 0.35
      drawDab(ctx, p, size * 1.1, color)
      if (mw > 0) drawDab(ctx, { x: mw - p.x, y: p.y }, size * 1.1, color)
      ctx.restore()
    } else if (isShapeTool(tool)) {
      baseRef.current = snap()
    }
  }
  const handleMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return
    const ctx = canvasRef.current?.getContext('2d')
    const last = lastRef.current
    if (!ctx || !last) return
    const p = getPos(e)
    const mw = symmetry ? sizeRef.current.w : 0
    if (tool === 'brush') {
      strokeSeg(ctx, last, p, color, size)
      if (mw > 0) strokeSeg(ctx, { x: mw - last.x, y: last.y }, { x: mw - p.x, y: p.y }, color, size)
    } else if (tool === 'eraser') {
      ctx.save(); ctx.globalCompositeOperation = 'destination-out'
      strokeSeg(ctx, last, p, '#000', size)
      ctx.restore()
    } else if (tool === 'spray') {
      sprayDots(ctx, p, size, color, mw)
    } else if (tool === 'neon') {
      neonSeg(ctx, last, p, size, color)
      if (mw > 0) neonSeg(ctx, { x: mw - last.x, y: last.y }, { x: mw - p.x, y: p.y }, size, color)
    } else if (tool === 'marker') {
      pointsRef.current.push(p)
      restoreBase(ctx) // کل مسیر با آلفای یکنواخت دوباره کشیده می‌شود
      strokeMarkerPath(ctx, pointsRef.current, size * 2.2, color, mw)
    } else if (isShapeTool(tool)) {
      restoreBase(ctx)
      const s = startRef.current
      if (s) drawShape(ctx, s, p, tool, size, color, fillShape)
    }
    lastRef.current = p
  }
  const endStroke = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return
    drawingRef.current = false
    lastRef.current = null
    startRef.current = null
    baseRef.current = null
    pointsRef.current = []
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* کپچر از قبل رها شده، مهم نیست */
    }
  }

  // ---------- اکشن‌ها ----------
  const changeBg = (key: BgKey): void => {
    if (key === bg) return
    pushHistory()
    setBg(key)
  }
  const handleClear = (): void => {
    if (!confirmClear) {
      setConfirmClear(true)
      clearTimerRef.current = window.setTimeout(() => setConfirmClear(false), 2500)
      return
    }
    if (clearTimerRef.current) { window.clearTimeout(clearTimerRef.current); clearTimerRef.current = null }
    setConfirmClear(false)
    pushHistory()
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.restore(); drawingRef.current = false; lastRef.current = null
    setTouched(false)
    pushToast({ icon: '🧽', title: 'پاک شد!', body: 'بوم دوباره دست‌نخورده‌ست.' })
  }
  const downloadPng = (): void => {
    const comp = makeComposite()
    if (!comp) return
    try {
      const a = document.createElement('a')
      a.href = comp.toDataURL('image/png')
      a.download = 'sanjob-paint.png'
      document.body.appendChild(a)
      a.click()
      a.remove()
      if (!exportedRef.current) {
        exportedRef.current = true
        pushToast({ icon: '🎨', title: 'هنرمند سان‌جابی شدی!', body: 'نقاشیت با اسم sanjob-paint.png ذخیره شد.' })
      } else {
        pushToast({ icon: '💾', title: 'ذخیره شد', body: 'sanjob-paint.png دانلود شد.' })
      }
    } catch {
      pushToast({ icon: '😱', title: 'ذخیره نشد!', body: 'مرورگر گیر داد. یه بار دیگه امتحان کن.' })
    }
  }
  const setAsWallpaper = (): void => {
    const comp = makeComposite()
    if (!comp) return
    try {
      localStorage.setItem('pengo-custom-wallpaper', comp.toDataURL('image/png'))
      useOS.getState().setSetting('wallpaper', 'custom')
      pushToast({ icon: '🖼️', title: 'والپیپر عوض شد!', body: 'نقاشیت حالا پس‌زمینه‌ی سان‌جاب‌اواسه.' })
    } catch {
      pushToast({ icon: '😱', title: 'نشد!', body: 'حجم نقاشی زیاده یا مرورگر اجازه نداد.' })
    }
  }
  const bgDef = BGS.find((b) => b.id === bg) ?? BGS[0]
  const isCustomColor = !COLORS.includes(color)

  return (
    <div className="flex h-full w-full flex-col">
      {/* نوار ابزار */}
      <div className="flex shrink-0 flex-wrap items-center gap-x-1.5 gap-y-1.5 border-b border-white/10 bg-zinc-900/60 p-2">
        {TOOLS.map((t) => {
          const Icon = t.icon
          return (
            <ToolButton key={t.id} label={t.label} active={tool === t.id} onClick={() => selectTool(t.id)}><Icon className="size-4" /></ToolButton>
          )
        })}
        <div className="mx-1 h-6 w-px bg-white/10" aria-hidden />
        {COLORS.map((c) => (
          <button
            key={c} type="button" aria-label={`رنگ ${c}`} aria-pressed={color === c} title={c}
            onClick={() => setColor(c)} style={{ backgroundColor: c }}
            className={`size-7 shrink-0 rounded-full border-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 active:scale-95 ${
              color === c ? 'scale-110 border-white ring-2 ring-white' : 'border-white/10 hover:scale-105'
            }`}
          />
        ))}
        <label
          title="رنگ دلخواه" aria-label="انتخاب رنگ دلخواه"
          className={`relative size-7 shrink-0 cursor-pointer rounded-full border-2 transition hover:scale-105 active:scale-95 ${
            isCustomColor ? 'border-white ring-2 ring-white' : 'border-white/10'
          }`}
          style={{ backgroundImage: 'conic-gradient(#ef4444, #f59e0b, #22c55e, #38bdf8, #a78bfa, #ef4444)' }}
        >
          <input
            type="color" value={color} onChange={(e) => setColor(e.target.value)} aria-label="انتخاب رنگ دلخواه"
            className="absolute inset-0 size-full cursor-pointer opacity-0"
          />
        </label>
        <div className="mx-1 h-6 w-px bg-white/10" aria-hidden />
        <div className="flex items-center gap-1.5">
          <Slider min={1} max={64} value={[size]} onValueChange={(v) => setSize(v[0] ?? size)} className="w-24" aria-label="ضخامت ابزار" />
          <span className="w-6 text-center text-[10px] tabular-nums text-zinc-500" title="ضخامت">{faNum(size)}</span>
          <span aria-hidden title="پیش‌نمایش ضخامت" className="grid size-7 shrink-0 place-items-center rounded-md border border-white/10 bg-zinc-950/70">
            <span className="rounded-full" style={{ width: clamp(size, 2, 18), height: clamp(size, 2, 18), backgroundColor: color }} />
          </span>
        </div>
        <ToolButton label="حالت توپُر (برای شکل‌ها)" active={fillShape} onClick={() => setFillShape((v) => !v)}><Droplet className="size-4" /></ToolButton>
        <ToolButton label="قرینه‌سازی عمودی" active={symmetry} onClick={() => setSymmetry((v) => !v)}><FlipHorizontal2 className="size-4" /></ToolButton>
        <div className="mx-1 h-6 w-px bg-white/10" aria-hidden />
        {BGS.map((b) => (
          <button
            key={b.id} type="button" aria-label={`پس‌زمینه ${b.label}`} aria-pressed={bg === b.id}
            title={`پس‌زمینه ${b.label}`} onClick={() => changeBg(b.id)} style={b.css}
            className={`size-7 shrink-0 rounded-md border transition active:scale-95 ${
              bg === b.id ? 'border-white ring-2 ring-white/70' : 'border-white/15 hover:scale-105'
            }`}
          />
        ))}
        <div className="ms-auto flex items-center gap-1">
          <ToolButton label="واگرد (Ctrl+Z)" onClick={undo} disabled={hist.u === 0}><Undo2 className="size-4" /></ToolButton>
          <ToolButton label="بازانجام (Ctrl+Shift+Z)" onClick={redo} disabled={hist.r === 0}><Redo2 className="size-4" /></ToolButton>
          <ToolButton label={confirmClear ? 'مطمئنی؟ دوباره بزن!' : 'پاک کردن بوم'} danger={confirmClear} onClick={handleClear}><Trash2 className="size-4" /></ToolButton>
          <ToolButton label="ست به والپیپر" onClick={setAsWallpaper}><Wallpaper className="size-4" /></ToolButton>
          <Button type="button" size="icon" variant="secondary" aria-label="دانلود PNG" title="دانلود PNG" onClick={downloadPng} className="size-8 shrink-0">
            <Download className="size-4" />
          </Button>
        </div>
      </div>
      {/* بوم: پس‌زمینه با CSS زیر بومِ شفاف */}
      <div ref={wrapRef} style={bgDef.css} className="relative min-h-0 flex-1 overflow-hidden">
        <canvas
          ref={canvasRef} className="absolute inset-0 h-full w-full cursor-crosshair touch-none"
          onPointerDown={handleDown} onPointerMove={handleMove} onPointerUp={endStroke} onPointerCancel={endStroke}
        />
        {textDraft && (
          <input
            autoFocus dir="rtl" value={textDraft.value} placeholder="بنویس و Enter بزن" aria-label="متن روی بوم"
            onChange={(e) => setTextDraft((d) => (d ? { ...d, value: e.target.value } : d))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); commitText() } else if (e.key === 'Escape') setTextDraft(null)
            }}
            onBlur={commitText}
            style={{ left: clamp(textDraft.x - 164, 4, Math.max(4, wrapW - 172)), top: textDraft.y }}
            className="absolute z-10 w-40 rounded-md border border-[var(--pengo-accent)]/60 bg-zinc-900/90 px-2 py-1 text-xs text-zinc-100 shadow-lg outline-none backdrop-blur"
          />
        )}
        {!touched && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center" aria-hidden>
            <div className="rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-xs text-zinc-300 backdrop-blur-sm">
              اینجا بکش! بوم هنری سان‌جاب منتظر شاهکارت 🎨
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
