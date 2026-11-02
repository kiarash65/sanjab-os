'use client'

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import {
  ChevronLeft, ChevronRight, Download, Eraser, Highlighter, NotebookText, Pencil, Pen, PenLine,
  Plus, Redo2, Trash2, Undo2, type LucideIcon,
} from 'lucide-react'
import { useOS } from '@/lib/os/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

/* ---------- نوع‌ها ---------- */

interface Note { id: string; title: string; body: string; updatedAt: number }
type Tool = 'pen' | 'hl' | 'eraser'
type PageBg = 'ruled' | 'grid' | 'dot' | 'plain'
/** مختصات نرمال‌شده (۰..۱) + فشار قلم (۰..۱) */
type Pt = [x: number, y: number, p: number]
interface Stroke { tool: Tool; color: string; w: number; pts: Pt[] }
interface ScribblePage { id: string; bg: PageBg; strokes: Stroke[] }
interface ScribbleBook { id: string; title: string; updatedAt: number; pages: ScribblePage[] }
interface ScribbleState { books: ScribbleBook[]; activeBookId: string }
interface Hist { undo: Stroke[][]; redo: Stroke[][] }

/* ---------- ثابت‌ها ---------- */

const STORAGE_KEY = 'pengo-notes'
const MODE_KEY = 'pengo-notes-mode'
const SCRIBBLE_KEY = 'pengo-scribbles-v1'
const PAPER = '#fffdf5'
const PATTERN_INK = '#d7ccc8'
const EMPTY_HIST: Hist = { undo: [], redo: [] }
const ACCENT_BTN = 'size-7 text-[var(--pengo-accent)] hover:bg-white/10 hover:text-[var(--pengo-accent)]'
const SOLID_BTN = 'bg-[var(--pengo-accent)] text-zinc-950 hover:bg-[var(--pengo-accent)]/90'

const WELCOME_BODY = `سلام پنگویی عزیز! 🐧

این دفترچه رسمی یادداشت‌های سیستمه. چند قانون بامزه:
• هرچی بنویسی همین‌جا ذخیره می‌شه (توی مرورگر خودت).
• گربه‌های سیستم قول دادن متن‌هات رو نخونن... بیشترش.
• دکمه ➕ بالای لیست، یادداشت تازه می‌سازه.
• دکمه 🗑 پاک می‌کنه؛ ولی اول ازت می‌پرسه، نگران نباش.

حالا یه چی قشنگ بنویس. دنیا منتظره! ✍️`

const TOOLS: { id: Tool; label: string; icon: LucideIcon }[] = [
  { id: 'pen', label: 'خودکار', icon: Pen },
  { id: 'hl', label: 'ماژیک هایلایتر', icon: Highlighter },
  { id: 'eraser', label: 'پاک‌کن', icon: Eraser },
]
const INK_COLORS: { c: string; label: string }[] = [
  { c: '#1e293b', label: 'سرمه‌ای' },
  { c: '#0f172a', label: 'مشکی' },
  { c: '#dc2626', label: 'قرمز' },
  { c: '#16a34a', label: 'سبز' },
]
const BG_OPTIONS: { id: PageBg; label: string }[] = [
  { id: 'ruled', label: 'خط‌دار' },
  { id: 'grid', label: 'شطرنجی' },
  { id: 'dot', label: 'نقطه‌ای' },
  { id: 'plain', label: 'ساده' },
]

/* ---------- کمک‌کارها و حافظه ---------- */

const uid = (): string => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
const makeNote = (title: string, body: string): Note => ({ id: uid(), title, body, updatedAt: Date.now() })
const fmtDate = (ts: number): string => new Date(ts).toLocaleDateString('fa-IR')
const faNum = (n: number): string => n.toLocaleString('fa-IR')
const dpr = (): number => window.devicePixelRatio || 1

const isNote = (value: unknown): value is Note => {
  if (typeof value !== 'object' || value === null) return false
  const o = value as Record<string, unknown>
  return (
    typeof o.id === 'string' && typeof o.title === 'string' &&
    typeof o.body === 'string' && typeof o.updatedAt === 'number'
  )
}

const loadNotes = (): Note[] => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        const loaded = parsed.filter(isNote)
        if (loaded.length > 0) return loaded
      }
    }
  } catch {
    /* اگه داده خراب بود، از نو شروع می‌کنیم */
  }
  return [makeNote('به دفترچه خوش اومدی 👋', WELCOME_BODY)]
}

const loadMode = (): 'text' | 'ink' => {
  try {
    return window.localStorage.getItem(MODE_KEY) === 'ink' ? 'ink' : 'text'
  } catch {
    return 'text'
  }
}

const freshPage = (bg: PageBg = 'ruled'): ScribblePage => ({ id: uid(), bg, strokes: [] })
const freshBook = (title: string): ScribbleBook => ({
  id: uid(), title, updatedAt: Date.now(), pages: [freshPage()],
})

const isStroke = (v: unknown): v is Stroke => {
  if (typeof v !== 'object' || v === null) return false
  const o = v as Record<string, unknown>
  return (
    (o.tool === 'pen' || o.tool === 'hl' || o.tool === 'eraser') &&
    typeof o.color === 'string' && typeof o.w === 'number' && Array.isArray(o.pts)
  )
}

const isScribbleState = (v: unknown): v is ScribbleState => {
  if (typeof v !== 'object' || v === null) return false
  const o = v as Record<string, unknown>
  if (!Array.isArray(o.books) || typeof o.activeBookId !== 'string') return false
  return o.books.every((b) => {
    if (typeof b !== 'object' || b === null) return false
    const bb = b as Record<string, unknown>
    return (
      typeof bb.id === 'string' && typeof bb.title === 'string' &&
      typeof bb.updatedAt === 'number' && Array.isArray(bb.pages) &&
      bb.pages.every((p) => {
        if (typeof p !== 'object' || p === null) return false
        const pp = p as Record<string, unknown>
        return (
          typeof pp.id === 'string' &&
          (pp.bg === 'ruled' || pp.bg === 'grid' || pp.bg === 'dot' || pp.bg === 'plain') &&
          Array.isArray(pp.strokes) && pp.strokes.every(isStroke)
        )
      })
    )
  })
}

const loadScribbles = (): ScribbleState => {
  try {
    const raw = window.localStorage.getItem(SCRIBBLE_KEY)
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      if (isScribbleState(parsed) && parsed.books.length > 0) {
        const books = parsed.books.map((b) => (b.pages.length > 0 ? b : { ...b, pages: [freshPage()] }))
        const ok = books.some((b) => b.id === parsed.activeBookId)
        return { books, activeBookId: ok ? parsed.activeBookId : (books[0]?.id ?? '') }
      }
    }
  } catch {
    /* خراب بود؟ یه جزوه تازه می‌سازیم */
  }
  const book = freshBook('جزوه اول من 📓')
  return { books: [book], activeBookId: book.id }
}

/* ---------- رسم روی بوم (مستقل از ری‌اکت) ---------- */

const drawPattern = (ctx: CanvasRenderingContext2D, bg: PageBg, w: number, h: number): void => {
  if (bg === 'plain') return
  ctx.save()
  ctx.strokeStyle = PATTERN_INK
  ctx.fillStyle = PATTERN_INK
  ctx.lineWidth = 1
  if (bg === 'ruled') {
    ctx.beginPath()
    for (let y = 28; y < h; y += 28) { ctx.moveTo(0, y + 0.5); ctx.lineTo(w, y + 0.5) }
    ctx.stroke()
  } else if (bg === 'grid') {
    ctx.beginPath()
    for (let x = 24; x < w; x += 24) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, h) }
    for (let y = 24; y < h; y += 24) { ctx.moveTo(0, y + 0.5); ctx.lineTo(w, y + 0.5) }
    ctx.stroke()
  } else {
    for (let x = 24; x < w; x += 24) {
      for (let y = 24; y < h; y += 24) {
        ctx.beginPath()
        ctx.arc(x, y, 1, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }
  ctx.restore()
}

/** عرض واقعی خط بر اساس ابزار و فشار */
const strokeWidth = (s: Stroke, p: number): number =>
  s.tool === 'pen' ? s.w * (0.4 + 1.2 * p) : s.tool === 'hl' ? s.w * 4 : s.w * 6

/** یه خط رو با نرم‌سازی منحنی (درجه ۲ بین نقطه‌های میانی) می‌کشه؛ مختصات نرمال × ابعاد فعلی بوم */
const drawStroke = (ctx: CanvasRenderingContext2D, s: Stroke, cw: number, ch: number, live = false): void => {
  if (s.pts.length === 0 || cw <= 0 || ch <= 0) return
  const P = s.pts.map(([x, y]) => ({ x: x * cw, y: y * ch }))
  const first = P[0]
  const last = P[P.length - 1]
  if (!first || !last) return
  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  if (s.tool === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out'
    ctx.strokeStyle = '#000'
    ctx.fillStyle = '#000'
  } else {
    // ماژیک توی لایه‌ی زنده با شفافیت ۱ رسم می‌شه (۰.۲۵ با CSS)
    ctx.globalAlpha = s.tool === 'hl' && !live ? 0.25 : 1
    ctx.strokeStyle = s.color
    ctx.fillStyle = s.color
  }
  if (P.length === 1) {
    const r = Math.max(0.4, strokeWidth(s, s.pts[0]?.[2] ?? 0.5) / 2)
    ctx.beginPath()
    ctx.arc(first.x, first.y, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
    return
  }
  if (s.tool === 'pen') {
    // قلم: عرض هر تکه با فشار همون تکه
    let mid = first
    for (let i = 1; i < P.length; i++) {
      const cur = P[i]
      const nxt = P[i + 1]
      const end = nxt && i < P.length - 1 ? { x: (cur.x + nxt.x) / 2, y: (cur.y + nxt.y) / 2 } : cur
      ctx.beginPath()
      ctx.moveTo(mid.x, mid.y)
      ctx.quadraticCurveTo(cur.x, cur.y, end.x, end.y)
      ctx.lineWidth = strokeWidth(s, ((s.pts[i - 1]?.[2] ?? 0.5) + (s.pts[i]?.[2] ?? 0.5)) / 2)
      ctx.stroke()
      mid = end
    }
  } else {
    // ماژیک و پاک‌کن: یه مسیر یک‌تا با عرض ثابت
    ctx.lineWidth = strokeWidth(s, 0.5)
    ctx.beginPath()
    ctx.moveTo(first.x, first.y)
    for (let i = 1; i < P.length - 1; i++) {
      const cur = P[i]
      const nxt = P[i + 1]
      if (!cur || !nxt) continue
      ctx.quadraticCurveTo(cur.x, cur.y, (cur.x + nxt.x) / 2, (cur.y + nxt.y) / 2)
    }
    ctx.lineTo(last.x, last.y)
    ctx.stroke()
  }
  ctx.restore()
}

/* ---------- پراپ‌های دکمه‌ی ابزار کوچک نوار جزوه ---------- */

const tbProps = (
  title: string,
  onClick: () => void,
  opt: { active?: boolean; danger?: boolean; disabled?: boolean } = {}
) => ({
  type: 'button' as const,
  size: 'icon' as const,
  variant: 'ghost' as const,
  title,
  'aria-label': title,
  disabled: opt.disabled,
  onClick,
  className: `size-7 rounded-lg ${
    opt.danger
      ? 'text-red-300 hover:bg-red-500/20 hover:text-red-200'
      : opt.active
        ? 'bg-white/10 text-[var(--pengo-accent)]'
        : 'text-zinc-400 hover:bg-white/10 hover:text-zinc-100'
  }`,
})

const SEP = <span className="mx-0.5 h-5 w-px shrink-0 bg-white/10" aria-hidden />

/* ---------- حالت متن (همون دفترچه‌ی قبلی) ---------- */

function TextNotes() {
  const [notes, setNotes] = useState<Note[]>(loadNotes)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState(0)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const titleRef = useRef<HTMLInputElement>(null)
  const effectiveId = activeId ?? notes[0]?.id ?? null
  const active = notes.find((n) => n.id === effectiveId) ?? null

  // ذخیره خودکار با تاخیر ۵۰۰ میلی‌ثانیه
  useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
        setSavedAt(Date.now())
      } catch {
        /* اگه حافظه پر شده باشه هم غصه نخور */
      }
    }, 500)
    return () => window.clearTimeout(t)
  }, [notes])

  // چشمک «ذخیره شد»
  useEffect(() => {
    if (savedAt === 0) return
    const t = window.setTimeout(() => setSavedAt(0), 1200)
    return () => window.clearTimeout(t)
  }, [savedAt])

  const sorted = [...notes].sort((a, b) => b.updatedAt - a.updatedAt)

  const updateActive = (patch: Partial<Omit<Note, 'id'>>) => {
    if (!effectiveId) return
    setNotes((ns) => ns.map((n) => (n.id === effectiveId ? { ...n, ...patch, updatedAt: Date.now() } : n)))
  }

  const addNote = () => {
    const note = makeNote('', '')
    setNotes((ns) => [note, ...ns])
    setActiveId(note.id)
    setConfirmDelete(false)
    window.setTimeout(() => titleRef.current?.focus(), 0)
  }

  const deleteActive = () => {
    if (!effectiveId || !active) return
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    const rest = notes.filter((n) => n.id !== effectiveId)
    setNotes(rest)
    setActiveId(rest[0]?.id ?? null)
    setConfirmDelete(false)
  }

  const selectNote = (id: string) => {
    setActiveId(id)
    setConfirmDelete(false)
  }

  return (
    <div className="flex h-full w-full">
      {/* لیست یادداشت‌ها (سمت راست در چیدمان راست‌به‌چپ) */}
      <aside className="flex w-40 shrink-0 flex-col border-l border-white/10 bg-zinc-900/50 sm:w-52">
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-2 py-1.5">
          <span className="px-1 text-[11px] font-bold text-zinc-400">یادداشت‌ها</span>
          <Button type="button" size="icon" variant="ghost" aria-label="یادداشت جدید" title="یادداشت جدید" onClick={addNote} className={ACCENT_BTN}>
            <Plus className="size-4" />
          </Button>
        </div>
        <div className="os-scroll min-h-0 flex-1 overflow-y-auto p-1.5">
          {sorted.length === 0 ? (
            <p className="px-2 py-3 text-center text-[10px] leading-5 text-zinc-600">لیست خالیه. مثل ذهن قبل از قهوه ☕</p>
          ) : (
            sorted.map((n) => (
              <button
                key={n.id} type="button" onClick={() => selectNote(n.id)}
                className={`mb-1 block w-full rounded-lg px-2 py-1.5 text-right transition active:scale-[0.98] ${n.id === effectiveId ? 'bg-white/10' : 'hover:bg-white/5'}`}
              >
                <span className={`block truncate text-xs font-bold ${n.id === effectiveId ? 'text-zinc-100' : 'text-zinc-300'}`}>{n.title.trim() || 'بی‌نام'}</span>
                <span className="mt-0.5 block text-[10px] text-zinc-500">{fmtDate(n.updatedAt)}</span>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* ویرایشگر یا حالت خالی */}
      {active ? (
        <section className="flex min-w-0 flex-1 flex-col">
          <div className="flex shrink-0 items-center gap-2 border-b border-white/10 px-3 py-2">
            <Input
              ref={titleRef} value={active.title} placeholder="بی‌نام"
              onChange={(e) => updateActive({ title: e.target.value })}
              className="h-8 min-w-0 flex-1 border-0 bg-transparent px-0 text-sm font-bold shadow-none focus-visible:ring-0"
            />
            <span aria-live="polite" className={`w-16 shrink-0 text-left text-[10px] text-[var(--pengo-accent)] transition-opacity duration-300 ${savedAt > 0 ? 'opacity-100' : 'opacity-0'}`}>
              ذخیره شد ✓
            </span>
            <Button
              type="button" size="sm" variant={confirmDelete ? 'destructive' : 'ghost'} onClick={deleteActive}
              className={`h-8 shrink-0 gap-1 px-2 text-xs transition-colors ${confirmDelete ? '' : 'text-zinc-500 hover:bg-white/10 hover:text-red-300'}`}
            >
              <Trash2 className="size-3.5" />
              {confirmDelete && <span>مطمئنی؟</span>}
            </Button>
          </div>
          <div className="flex min-h-0 flex-1 flex-col px-3 py-2">
            <Textarea
              value={active.body} placeholder="اینجا بنویس… گربه قول میده نخونه!"
              onChange={(e) => updateActive({ body: e.target.value })}
              className="field-sizing-fixed min-h-0 flex-1 resize-none border-0 bg-transparent px-0 text-sm leading-7 shadow-none focus-visible:ring-0"
            />
          </div>
        </section>
      ) : (
        <section className="flex min-w-0 flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <span className="text-5xl" aria-hidden>🐱</span>
          <p className="text-sm text-zinc-400">یه یادداشت بنویس. گربه قول میده نخونه!</p>
          <Button type="button" size="sm" onClick={addNote} className={SOLID_BTN}>
            <Plus className="size-4" />
            یادداشت جدید
          </Button>
        </section>
      )}
    </div>
  )
}

/* ---------- حالت جزوه دست‌خط ---------- */

/** نقطه‌ی نرمال‌شده + فشار؛ پالم‌ردکشن ساده: لمس هم اجازه‌ی رسم داره، فقط فشار مال قلمه */
const readPt = (
  e: { clientX: number; clientY: number; pointerType: string; pressure: number },
  rect: DOMRect
): Pt => {
  const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
  const y = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height))
  const p = e.pointerType === 'pen' && e.pressure > 0 ? Math.min(1, e.pressure) : 0.5
  return [x, y, p]
}

function Scribbles() {
  const pushToast = useOS((s) => s.pushToast)
  const [state, setState] = useState<ScribbleState>(loadScribbles)
  const [pageIdx, setPageIdx] = useState(0)
  const [tool, setTool] = useState<Tool>('pen')
  const [color, setColor] = useState(INK_COLORS[0]?.c ?? '#1e293b')
  const [size, setSize] = useState(3)
  const [hist, setHist] = useState<Hist>(EMPTY_HIST)
  const [box, setBox] = useState({ w: 0, h: 0 })
  const [redrawTick, setRedrawTick] = useState(0)
  const [confirmPageDel, setConfirmPageDel] = useState(false)
  const [confirmBookId, setConfirmBookId] = useState<string | null>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameVal, setRenameVal] = useState('')

  const boxRef = useRef<HTMLDivElement>(null)
  const paperRef = useRef<HTMLCanvasElement>(null)
  const inkRef = useRef<HTMLCanvasElement>(null)
  const liveCanvasRef = useRef<HTMLCanvasElement>(null)
  const strokeRef = useRef<Stroke | null>(null)
  const prevRef = useRef<{ pt: { x: number; y: number }; mid: { x: number; y: number } } | null>(null)
  const quotaAtRef = useRef(0)
  const [exportedOnce, setExportedOnce] = useState(false)

  const activeBook = state.books.find((b) => b.id === state.activeBookId) ?? null
  const pageCount = activeBook?.pages.length ?? 0
  const safeIdx = Math.max(0, Math.min(pageIdx, pageCount - 1))
  const page = activeBook?.pages[safeIdx] ?? null
  const pageBg = page?.bg
  const pageStrokes = page?.strokes

  /* ذخیره‌ی خودکار جزوه‌ها (۵۰۰ms) با محافظت از پرشدن حافظه */
  useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        window.localStorage.setItem(SCRIBBLE_KEY, JSON.stringify(state))
      } catch {
        if (Date.now() - quotaAtRef.current > 4000) {
          quotaAtRef.current = Date.now()
          pushToast({ title: 'جزوه دست‌خط', body: 'حافظه پر شده!', icon: '⚠️' })
        }
      }
    }, 500)
    return () => window.clearTimeout(t)
  }, [state, pushToast])

  /* اندازه‌ی ناحیه‌ی کاغذ */
  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const r = entries[0]?.contentRect
      if (!r) return
      const nw = Math.max(1, Math.round(r.width))
      const nh = Math.max(1, Math.round(r.height))
      setBox((s) => (s.w === nw && s.h === nh ? s : { w: nw, h: nh }))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  /* رسم کاغذ + الگو + جوهر (DPR-آگاه؛ چون مختصات نرماله، تغییر اندازه نیازی به تغییر داده نداره) */
  useEffect(() => {
    const paper = paperRef.current
    const ink = inkRef.current
    const live = liveCanvasRef.current
    const { w, h } = box
    if (!paper || !ink || !live || w < 2 || h < 2) return
    const d = dpr()
    const setup = (c: HTMLCanvasElement): CanvasRenderingContext2D | null => {
      const bw = Math.round(w * d)
      const bh = Math.round(h * d)
      if (c.width !== bw || c.height !== bh) { c.width = bw; c.height = bh }
      const ctx = c.getContext('2d')
      if (!ctx) return null
      ctx.setTransform(d, 0, 0, d, 0, 0)
      return ctx
    }
    const pctx = setup(paper)
    const ictx = setup(ink)
    const lctx = setup(live)
    if (!pctx || !ictx || !lctx) return
    pctx.clearRect(0, 0, w, h)
    pctx.fillStyle = PAPER
    pctx.fillRect(0, 0, w, h)
    if (pageBg) drawPattern(pctx, pageBg, w, h)
    ictx.clearRect(0, 0, w, h)
    if (pageStrokes) for (const s of pageStrokes) drawStroke(ictx, s, w, h)
    lctx.clearRect(0, 0, w, h)
  }, [box, pageBg, pageStrokes, redrawTick])

  /* ---------- تغییر وضعیت ---------- */

  const patchBook = (id: string, fn: (b: ScribbleBook) => ScribbleBook): void =>
    setState((s) => ({ ...s, books: s.books.map((b) => (b.id === id ? fn(b) : b)) }))

  const patchPage = (fn: (p: ScribblePage) => ScribblePage): void => {
    if (!activeBook) return
    patchBook(activeBook.id, (b) => ({
      ...b,
      updatedAt: Date.now(),
      pages: b.pages.map((p, i) => (i === safeIdx ? fn(p) : p)),
    }))
  }

  const applyStrokes = (strokes: Stroke[]): void => patchPage((p) => ({ ...p, strokes }))

  const commitStroke = (s: Stroke): void => {
    if (!activeBook) return
    const prev = activeBook.pages[safeIdx]?.strokes ?? []
    setHist((h) => ({ undo: [...h.undo.slice(-49), prev], redo: [] }))
    applyStrokes([...(activeBook.pages[safeIdx]?.strokes ?? []), s])
  }

  const undo = (): void => {
    if (!page || hist.undo.length === 0) return
    const prev = hist.undo[hist.undo.length - 1]
    if (!prev) return
    setHist((h) => ({ undo: h.undo.slice(0, -1), redo: [...h.redo, page.strokes] }))
    applyStrokes(prev)
  }

  const redo = (): void => {
    if (!page || hist.redo.length === 0) return
    const next = hist.redo[hist.redo.length - 1]
    if (!next) return
    setHist((h) => ({ undo: [...h.undo, page.strokes], redo: h.redo.slice(0, -1) }))
    applyStrokes(next)
  }

  const goPage = (i: number): void => {
    setPageIdx(i)
    setConfirmPageDel(false)
  }

  const addBook = (): void => {
    const b = freshBook('جزوه بدون نام')
    setState((s) => ({ ...s, books: [b, ...s.books], activeBookId: b.id }))
    goPage(0)
    setHist(EMPTY_HIST)
    setConfirmBookId(null)
  }

  const selectBook = (id: string): void => {
    setState((s) => ({ ...s, activeBookId: id }))
    goPage(0)
    setHist(EMPTY_HIST)
    setConfirmBookId(null)
  }

  const commitRename = (): void => {
    const id = renamingId
    const title = renameVal.trim()
    setRenamingId(null)
    if (!id || !title) return
    patchBook(id, (b) => ({ ...b, title, updatedAt: Date.now() }))
  }

  const deleteBook = (id: string): void => {
    if (confirmBookId !== id) {
      setConfirmBookId(id)
      return
    }
    setState((s) => {
      const books = s.books.filter((b) => b.id !== id)
      return {
        books,
        activeBookId: books.some((b) => b.id === s.activeBookId) ? s.activeBookId : (books[0]?.id ?? ''),
      }
    })
    setConfirmBookId(null)
    goPage(0)
    setHist(EMPTY_HIST)
  }

  const addPage = (): void => {
    if (!activeBook) return
    const bg = activeBook.pages[safeIdx]?.bg ?? 'ruled'
    patchBook(activeBook.id, (b) => ({
      ...b,
      updatedAt: Date.now(),
      pages: [...b.pages.slice(0, safeIdx + 1), freshPage(bg), ...b.pages.slice(safeIdx + 1)],
    }))
    goPage(safeIdx + 1)
    setHist(EMPTY_HIST)
  }

  const deletePage = (): void => {
    if (!activeBook || pageCount < 2) return
    if (!confirmPageDel) {
      setConfirmPageDel(true)
      return
    }
    patchBook(activeBook.id, (b) => ({
      ...b,
      updatedAt: Date.now(),
      pages: b.pages.filter((_, i) => i !== safeIdx),
    }))
    goPage(Math.max(0, safeIdx - 1))
    setHist(EMPTY_HIST)
  }

  const setBg = (bg: PageBg): void => patchPage((p) => ({ ...p, bg }))

  /* میان‌برهای Ctrl+Z / Ctrl+Y */
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (!(e.ctrlKey || e.metaKey)) return
      const t = e.target
      if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement) return
      const k = e.key.toLowerCase()
      if (k === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
      } else if (k === 'y') {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  /* ---------- رسم با قلم ---------- */

  const renderLive = (): void => {
    const s = strokeRef.current
    const live = liveCanvasRef.current
    if (!s || !live) return
    const ctx = live.getContext('2d')
    if (!ctx) return
    const r = live.getBoundingClientRect()
    ctx.setTransform(dpr(), 0, 0, dpr(), 0, 0)
    ctx.clearRect(0, 0, r.width, r.height)
    drawStroke(ctx, s, r.width, r.height, true)
  }

  const onPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>): void => {
    if ((e.pointerType === 'mouse' && e.button !== 0) || !e.isPrimary) return
    const canvas = inkRef.current
    if (!canvas) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const rect = canvas.getBoundingClientRect()
    const pt = readPt(e, rect)
    strokeRef.current = { tool, color, w: size, pts: [pt] }
    const px = { x: pt[0] * rect.width, y: pt[1] * rect.height }
    prevRef.current = { pt: px, mid: px }
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr(), 0, 0, dpr(), 0, 0)
    if (tool === 'hl') {
      renderLive()
      return
    }
    const lw = tool === 'eraser' ? size * 6 : size * (0.4 + 1.2 * pt[2])
    ctx.save()
    if (tool === 'eraser') ctx.globalCompositeOperation = 'destination-out'
    ctx.fillStyle = tool === 'eraser' ? '#000' : color
    ctx.beginPath()
    ctx.arc(px.x, px.y, Math.max(0.4, lw / 2), 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>): void => {
    const s = strokeRef.current
    const canvas = inkRef.current
    if (!s || !canvas) return
    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr(), 0, 0, dpr(), 0, 0)
    const native = e.nativeEvent
    const coalesced = typeof native.getCoalescedEvents === 'function' ? native.getCoalescedEvents() : []
    for (const ev of coalesced.length > 0 ? coalesced : [native]) {
      const pt = readPt(ev, rect)
      const lastN = s.pts[s.pts.length - 1]
      if (lastN && pt[0] === lastN[0] && pt[1] === lastN[1]) continue
      s.pts.push(pt)
      const px = { x: pt[0] * rect.width, y: pt[1] * rect.height }
      const prev = prevRef.current?.pt ?? px
      const mid = { x: (prev.x + px.x) / 2, y: (prev.y + px.y) / 2 }
      if (s.tool === 'hl') {
        // ماژیک: کل خط زنده رو یک‌جا با شفافیت درست می‌کشیم
        renderLive()
      } else {
        // خودکار/پاک‌کن: فقط تکه‌ی جدید مستقیم روی لایه‌ی جوهر
        ctx.save()
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        if (s.tool === 'eraser') {
          ctx.globalCompositeOperation = 'destination-out'
          ctx.strokeStyle = '#000'
        } else {
          ctx.strokeStyle = s.color
        }
        ctx.lineWidth = s.tool === 'eraser' ? s.w * 6 : s.w * (0.4 + 1.2 * pt[2])
        const start = prevRef.current?.mid ?? prev
        ctx.beginPath()
        ctx.moveTo(start.x, start.y)
        ctx.quadraticCurveTo(prev.x, prev.y, mid.x, mid.y)
        ctx.stroke()
        ctx.restore()
      }
      prevRef.current = { pt: px, mid }
    }
  }

  const finishStroke = (cancel: boolean): void => {
    const s = strokeRef.current
    const canvas = inkRef.current
    strokeRef.current = null
    prevRef.current = null
    const live = liveCanvasRef.current
    const lctx = live?.getContext('2d')
    if (live && lctx) {
      const r = live.getBoundingClientRect()
      lctx.setTransform(dpr(), 0, 0, dpr(), 0, 0)
      lctx.clearRect(0, 0, r.width, r.height)
    }
    if (!s || cancel) {
      if (cancel) setRedrawTick((t) => t + 1) // پیکسل‌های نیمه‌کاره پاک شن
      return
    }
    // نسخه‌ی نهایی رو همین‌جا روی لایه‌ی جوهر می‌کشیم که پرش نزنه
    const ctx = canvas?.getContext('2d')
    if (ctx && canvas) {
      const r = canvas.getBoundingClientRect()
      ctx.setTransform(dpr(), 0, 0, dpr(), 0, 0)
      drawStroke(ctx, s, r.width, r.height)
    }
    commitStroke(s)
  }

  /* ---------- خروجی PNG ---------- */

  const exportPng = (): void => {
    if (!page || box.w < 2 || box.h < 2) return
    const d = dpr()
    const out = document.createElement('canvas')
    out.width = Math.round(box.w * d)
    out.height = Math.round(box.h * d)
    const ctx = out.getContext('2d')
    if (!ctx) return
    ctx.setTransform(d, 0, 0, d, 0, 0)
    ctx.fillStyle = PAPER
    ctx.fillRect(0, 0, box.w, box.h)
    drawPattern(ctx, page.bg, box.w, box.h)
    for (const s of page.strokes) drawStroke(ctx, s, box.w, box.h)
    out.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'jazveh.png'
      a.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 2000)
    }, 'image/png')
    if (!exportedOnce) {
      setExportedOnce(true)
      pushToast({ title: 'جزوه‌نویس حرفه‌ای!', body: 'صفحه‌ات با کاغذ گرم و دست‌خط خودت ذخیره شد ✍️', icon: '🏅' })
    }
  }

  /* ---------- رابط کاربری ---------- */

  const sortedBooks = [...state.books].sort((a, b) => b.updatedAt - a.updatedAt)

  return (
    <div className="flex h-full w-full">
      {/* قفسه‌ی جزوه‌ها (سمت راست) */}
      <aside className="flex w-44 shrink-0 flex-col border-l border-white/10 bg-zinc-900/50 sm:w-52">
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-2 py-1.5">
          <span className="px-1 text-[11px] font-bold text-zinc-400">جزوه‌ها</span>
          <Button type="button" size="icon" variant="ghost" aria-label="جزوه جدید" title="جزوه جدید" onClick={addBook} className={ACCENT_BTN}>
            <Plus className="size-4" />
          </Button>
        </div>
        <div className="os-scroll min-h-0 flex-1 overflow-y-auto p-1.5">
          {sortedBooks.length === 0 ? (
            <p className="px-2 py-3 text-center text-[10px] leading-5 text-zinc-600">قفسه خالیه. حتی گرد هم روش ننشسته 🕸</p>
          ) : (
            sortedBooks.map((b) => (
              <div key={b.id} className={`group mb-1 flex items-center gap-1 rounded-lg px-1.5 py-1 transition ${b.id === activeBook?.id ? 'bg-white/10' : 'hover:bg-white/5'}`}>
                {renamingId === b.id ? (
                  <Input
                    autoFocus value={renameVal} onBlur={commitRename}
                    onChange={(e) => setRenameVal(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitRename()
                      if (e.key === 'Escape') setRenamingId(null)
                    }}
                    className="h-6 min-w-0 flex-1 bg-zinc-950/60 px-1.5 text-xs"
                  />
                ) : (
                  <button type="button" onClick={() => selectBook(b.id)} title={b.title} className="min-w-0 flex-1 text-right">
                    <span className={`block truncate text-xs font-bold ${b.id === activeBook?.id ? 'text-zinc-100' : 'text-zinc-300'}`}>{b.title}</span>
                    <span className="mt-0.5 block text-[10px] text-zinc-500">{fmtDate(b.updatedAt)} · {faNum(b.pages.length)} صفحه</span>
                  </button>
                )}
                {renamingId !== b.id && (
                  <span className="flex shrink-0 items-center opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
                    <button type="button" aria-label="تغییر نام" title="تغییر نام" onClick={() => { setRenamingId(b.id); setRenameVal(b.title) }} className="rounded p-1 text-zinc-500 hover:text-zinc-100">
                      <Pencil className="size-3" />
                    </button>
                    {confirmBookId === b.id ? (
                      <button type="button" onClick={() => deleteBook(b.id)} className="rounded px-1 py-0.5 text-[9px] font-bold text-red-300 hover:bg-red-500/20">مطمئنی؟</button>
                    ) : (
                      <button type="button" aria-label="حذف جزوه" title="حذف جزوه" onClick={() => deleteBook(b.id)} className="rounded p-1 text-zinc-500 hover:text-red-300">
                        <Trash2 className="size-3" />
                      </button>
                    )}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
        <p className="shrink-0 border-t border-white/10 px-3 py-1.5 text-[9px] leading-4 text-zinc-600">با قلم یا انگشت بنویس؛ فشار قلم حساب می‌شه 🖊</p>
      </aside>

      {/* ناحیه‌ی اصلی جزوه */}
      {activeBook && page ? (
        <section className="flex min-w-0 flex-1 flex-col">
          {/* نوار ابزار */}
          <div className="flex shrink-0 flex-wrap items-center gap-x-2 gap-y-1 border-b border-white/10 bg-zinc-900/40 px-2 py-1.5">
            <span className="flex items-center gap-0.5">
              {TOOLS.map((t) => {
                const Icon = t.icon
                return (
                  <Button key={t.id} {...tbProps(t.label, () => setTool(t.id), { active: tool === t.id })}>
                    <Icon className="size-3.5" />
                  </Button>
                )
              })}
            </span>
            {SEP}
            <span className="flex items-center gap-1.5">
              {INK_COLORS.map((c) => (
                <button
                  key={c.c} type="button" title={c.label} aria-label={`جوهر ${c.label}`} style={{ background: c.c }}
                  onClick={() => setColor(c.c)}
                  className={`size-4 rounded-full border border-white/20 transition ${color === c.c ? 'ring-2 ring-[var(--pengo-accent)] ring-offset-1 ring-offset-zinc-900' : 'hover:scale-110'}`}
                />
              ))}
            </span>
            {SEP}
            <span className="flex items-center gap-1.5">
              <span className="text-[10px] text-zinc-500">اندازه</span>
              <Slider value={[size]} min={1} max={14} step={1} onValueChange={(v) => setSize(v[0] ?? 3)} className="w-16" aria-label="اندازه‌ی قلم" />
              {tool === 'hl' && <span className="text-[9px] text-zinc-500">۴× پهن</span>}
            </span>
            {SEP}
            <span className="flex items-center gap-0.5">
              {BG_OPTIONS.map((b) => (
                <button
                  key={b.id} type="button" onClick={() => setBg(b.id)}
                  className={`h-6 rounded-md px-1.5 text-[10px] transition ${page.bg === b.id ? 'bg-white/10 text-zinc-100' : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-300'}`}
                >
                  {b.label}
                </button>
              ))}
            </span>
            {SEP}
            <span className="flex items-center gap-0.5">
              <Button {...tbProps('برگردون (Ctrl+Z)', undo, { disabled: hist.undo.length === 0 })}>
                <Undo2 className="size-3.5" />
              </Button>
              <Button {...tbProps('دوباره (Ctrl+Y)', redo, { disabled: hist.redo.length === 0 })}>
                <Redo2 className="size-3.5" />
              </Button>
            </span>
            {SEP}
            <span className="flex items-center gap-0.5">
              <Button {...tbProps('صفحه جدید', addPage)}>
                <Plus className="size-3.5" />
              </Button>
              {confirmPageDel ? (
                <Button type="button" size="sm" variant="destructive" onClick={deletePage} className="h-7 px-2 text-[10px]">مطمئنی؟</Button>
              ) : (
                <Button {...tbProps(pageCount < 2 ? 'حداقل یه صفحه باید بمونه' : 'حذف همین صفحه', deletePage, { danger: true, disabled: pageCount < 2 })}>
                  <Trash2 className="size-3.5" />
                </Button>
              )}
            </span>
            {SEP}
            <Button {...tbProps('خروجی PNG', () => exportPng())}>
              <Download className="size-3.5" />
            </Button>
          </div>

          {/* کاغذ */}
          <div className="relative min-h-0 flex-1 p-2 sm:p-3">
            <div ref={boxRef} className="absolute inset-2 overflow-hidden rounded-xl border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.35)] sm:inset-3">
              <canvas ref={paperRef} className="absolute inset-0 h-full w-full" aria-hidden />
              <canvas
                ref={inkRef} className="absolute inset-0 h-full w-full cursor-crosshair touch-none"
                onPointerDown={onPointerDown} onPointerMove={onPointerMove}
                onPointerUp={() => finishStroke(false)} onPointerCancel={() => finishStroke(true)}
                onContextMenu={(e) => e.preventDefault()}
              />
              <canvas ref={liveCanvasRef} className="pointer-events-none absolute inset-0 h-full w-full opacity-25" aria-hidden />
            </div>
          </div>

          {/* ناوبری صفحه‌ها */}
          <div className="flex shrink-0 items-center justify-center gap-1 border-t border-white/10 bg-zinc-900/40 px-3 py-1.5">
            <Button {...tbProps('صفحه قبل', () => goPage(Math.max(0, safeIdx - 1)), { disabled: safeIdx === 0 })}>
              <ChevronRight className="size-3.5" />
            </Button>
            <span className="min-w-24 text-center text-[11px] tabular-nums text-zinc-400">صفحهٔ {faNum(safeIdx + 1)} از {faNum(pageCount)}</span>
            <Button {...tbProps('صفحه بعد', () => goPage(Math.min(pageCount - 1, safeIdx + 1)), { disabled: safeIdx >= pageCount - 1 })}>
              <ChevronLeft className="size-3.5" />
            </Button>
          </div>
        </section>
      ) : (
        <section className="flex min-w-0 flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <span className="text-5xl" aria-hidden>📓</span>
          <p className="text-sm text-zinc-400">هنوز جزوه‌ای نداری. یه جزوه تازه بزن و شروع کن به خط‌خطی کردن!</p>
          <Button type="button" size="sm" onClick={addBook} className={SOLID_BTN}>
            <Plus className="size-4" />
            جزوه جدید
          </Button>
        </section>
      )}
    </div>
  )
}

/* ---------- شِل اصلی: دو حالت با تب ---------- */

export default function NotesApp() {
  const [mode, setMode] = useState<'text' | 'ink'>(loadMode)

  useEffect(() => {
    try {
      window.localStorage.setItem(MODE_KEY, mode)
    } catch {
      /* بی‌خیال */
    }
  }, [mode])

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex shrink-0 items-center justify-center border-b border-white/10 bg-zinc-900/40 px-3 py-1.5">
        <Tabs value={mode} onValueChange={(v) => setMode(v === 'ink' ? 'ink' : 'text')}>
          <TabsList className="h-7 bg-white/5">
            <TabsTrigger value="text" className="h-full gap-1 px-3 text-[11px]">
              <NotebookText className="size-3.5" />
              متن
            </TabsTrigger>
            <TabsTrigger value="ink" className="h-full gap-1 px-3 text-[11px]">
              <PenLine className="size-3.5" />
              جزوه دست‌خط
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="min-h-0 flex-1">{mode === 'text' ? <TextNotes /> : <Scribbles />}</div>
    </div>
  )
}
