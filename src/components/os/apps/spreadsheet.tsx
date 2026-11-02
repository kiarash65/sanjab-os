'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Bold, Download, FilePlus2, PaintBucket, Pencil, Trash2, Type, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useOS } from '@/lib/os/store'

/* مدل داده */
type Cell = { v: string; b?: boolean; c?: string; bg?: string }
type Cells = Record<string, Cell>
type Sheet = { id: string; name: string; cells: Cells }
type Workbook = { sheets: Sheet[]; activeId: string }

const COLS = 26
const ROWS = 100
const LS_KEY = 'pengo-sheets-v1'
const COL_LETTERS = Array.from({ length: COLS }, (_, i) => String.fromCharCode(65 + i))
const ROW_NUMS = Array.from({ length: ROWS }, (_, i) => i + 1)
const TEXT_COLORS = ['#ffffff', '#f7931e', '#fbbf24', '#a78bfa', '#2dd4bf', '#fb7185', '#60a5fa', '#94a3b8']
const BG_COLORS = ['#18181b', '#f7931e', '#facc15', '#22c55e', '#38bdf8', '#a78bfa', '#fb7185', '#f8fafc']
const uid = (): string => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

/* ----------------------------- موتور فرمول‌ها ----------------------------- */

class FormulaError extends Error {}
class CycleError extends FormulaError {}

type Tok = { k: 'num'; n: number } | { k: 'op'; o: string } | { k: 'punc'; p: string } | { k: 'ref'; r: string } | { k: 'fn'; f: string }

type Node =
  | { t: 'num'; v: number }
  | { t: 'ref'; r: string }
  | { t: 'rng'; refs: string[] }
  | { t: 'un'; op: '+' | '-'; a: Node }
  | { t: 'bin'; op: string; a: Node; b: Node }
  | { t: 'pct'; a: Node }
  | { t: 'call'; f: string; args: Node[] }

const FUNCS = new Set(['SUM', 'AVG', 'AVERAGE', 'MIN', 'MAX', 'COUNT', 'ABS', 'ROUND', 'SQRT', 'POW'])

const parseRef = (s: string): [number, number] | null => {
  const m = /^([A-Z])([1-9][0-9]{0,3})$/.exec(s)
  const c = m ? m[1].charCodeAt(0) - 65 : -1
  return m && c >= 0 && c <= 25 ? [c, Number(m[2])] : null
}
const expandRange = (a: string, b: string): string[] => {
  const pa = parseRef(a)
  const pb = parseRef(b)
  if (!pa || !pb) throw new FormulaError('ref')
  const out: string[] = []
  for (let c = Math.min(pa[0], pb[0]); c <= Math.max(pa[0], pb[0]); c++)
    for (let r = Math.min(pa[1], pb[1]); r <= Math.max(pa[1], pb[1]); r++)
      out.push(String.fromCharCode(65 + c) + r)
  if (out.length > COLS * ROWS) throw new FormulaError('big')
  return out
}
function tokenize(src: string): Tok[] {
  const out: Tok[] = []
  let i = 0
  while (i < src.length) {
    const ch = src[i]
    if (ch === ' ' || ch === '\t') { i++; continue }
    if ((ch >= '0' && ch <= '9') || (ch === '.' && src[i + 1] >= '0' && src[i + 1] <= '9')) {
      let j = i + 1
      while (j < src.length && ((src[j] >= '0' && src[j] <= '9') || src[j] === '.')) j++
      const n = Number(src.slice(i, j))
      if (!Number.isFinite(n)) throw new FormulaError('num')
      out.push({ k: 'num', n }); i = j; continue
    }
    const up = ch.toUpperCase()
    if (up >= 'A' && up <= 'Z') {
      let j = i + 1
      while (j < src.length && src[j].toUpperCase() >= 'A' && src[j].toUpperCase() <= 'Z') j++
      const word = src.slice(i, j).toUpperCase()
      let k = j
      while (k < src.length && src[k] >= '0' && src[k] <= '9') k++
      if (k > j) {
        const ref = word + src.slice(j, k)
        if (!parseRef(ref)) throw new FormulaError('ref')
        out.push({ k: 'ref', r: ref }); i = k; continue
      }
      if (src[j] === '(') { out.push({ k: 'fn', f: word }); i = j; continue }
      throw new FormulaError('word')
    }
    if ('+-*/^%'.includes(ch)) { out.push({ k: 'op', o: ch }); i++; continue }
    if ('(),:'.includes(ch)) { out.push({ k: 'punc', p: ch }); i++; continue }
    throw new FormulaError('char')
  }
  return out
}
function parseFormula(src: string): Node {
  const toks = tokenize(src)
  let p = 0
  const peek = (): Tok | undefined => toks[p]
  const next = (): Tok | undefined => toks[p++]
  const isOp = (o: string): boolean => { const t = peek(); return !!t && t.k === 'op' && t.o === o }
  const isPunc = (c: string): boolean => { const t = peek(); return !!t && t.k === 'punc' && t.p === c }
  const expectPunc = (c: string): void => {
    const t = next()
    if (!t || t.k !== 'punc' || t.p !== c) throw new FormulaError(c)
  }
  // a op b (چپ‌گرا)
  const binLoop = (ops: string[], sub: () => Node): Node => {
    let a = sub()
    for (;;) {
      const t = peek()
      if (!t || t.k !== 'op' || !ops.includes(t.o)) return a
      next()
      a = { t: 'bin', op: t.o, a, b: sub() }
    }
  }
  const parseExpr = (): Node => binLoop(['+', '-'], parseTerm)
  const parseTerm = (): Node => binLoop(['*', '/'], parseUnary)
  const parseUnary = (): Node => {
    if (isOp('-')) { next(); return { t: 'un', op: '-', a: parseUnary() } }
    if (isOp('+')) { next(); return { t: 'un', op: '+', a: parseUnary() } }
    return parsePower()
  }
  const parsePower = (): Node => {
    const base = parsePostfix()
    if (!isOp('^')) return base
    next()
    return { t: 'bin', op: '^', a: base, b: parseUnary() }
  }
  const parsePostfix = (): Node => {
    let a = parsePrimary()
    while (isOp('%')) { next(); a = { t: 'pct', a } }
    return a
  }
  function parsePrimary(): Node {
    const t = next()
    if (!t) throw new FormulaError('eof')
    if (t.k === 'num') return { t: 'num', v: t.n }
    if (t.k === 'ref') {
      const t2 = isPunc(':') ? toks[p + 1] : undefined
      if (t2 && t2.k === 'ref') { p += 2; return { t: 'rng', refs: expandRange(t.r, t2.r) } }
      return { t: 'ref', r: t.r }
    }
    if (t.k === 'fn') {
      if (!FUNCS.has(t.f)) throw new FormulaError('fn')
      expectPunc('(')
      const args: Node[] = []
      if (!isPunc(')')) {
        args.push(parseExpr())
        while (isPunc(',')) { next(); args.push(parseExpr()) }
      }
      expectPunc(')')
      return { t: 'call', f: t.f, args }
    }
    if (t.k === 'punc' && t.p === '(') {
      const a = parseExpr()
      expectPunc(')')
      return a
    }
    throw new FormulaError('token')
  }
  const node = parseExpr()
  if (p !== toks.length) throw new FormulaError('trail')
  return node
}
interface Ctx { cells: Cells; cache: Map<string, number>; visiting: Set<string>; depth: number }

/* مقدار عددی یک سلول (با کش و تشخیص چرخه تا عمق ۴۰) */
function cellNum(ref: string, ctx: Ctx): number {
  const cached = ctx.cache.get(ref)
  if (cached !== undefined) return cached
  if (ctx.visiting.has(ref) || ctx.depth > 40) throw new CycleError()
  const raw = ctx.cells[ref]?.v ?? ''
  let val: number
  if (raw === '') val = 0
  else if (raw.startsWith('=')) {
    ctx.visiting.add(ref)
    ctx.depth++
    try { val = evalNum(parseFormula(raw.slice(1)), ctx) }
    finally { ctx.depth--; ctx.visiting.delete(ref) }
  } else {
    const n = Number(raw.replace(/,/g, ''))
    if (!Number.isFinite(n)) throw new FormulaError('text')
    val = n
  }
  ctx.cache.set(ref, val)
  return val
}

/* مثل cellNum ولی متن/خالی → null (برای SUM و…) */
function tryNum(ref: string, ctx: Ctx): number | null {
  const cell = ctx.cells[ref]
  if (!cell || cell.v === '') return null
  if (cell.v.startsWith('=')) return cellNum(ref, ctx)
  const n = Number(cell.v.replace(/,/g, ''))
  return Number.isFinite(n) ? n : null
}
function evalNum(n: Node, ctx: Ctx): number {
  switch (n.t) {
    case 'num': return n.v
    case 'ref': return cellNum(n.r, ctx)
    case 'rng': throw new FormulaError('range')
    case 'un': return n.op === '-' ? -evalNum(n.a, ctx) : evalNum(n.a, ctx)
    case 'pct': return evalNum(n.a, ctx) / 100
    case 'bin': {
      const a = evalNum(n.a, ctx)
      const b = evalNum(n.b, ctx)
      if (n.op === '+') return a + b
      if (n.op === '-') return a - b
      if (n.op === '*') return a * b
      if (n.op === '/') { if (b === 0) throw new FormulaError('div0'); return a / b }
      if (n.op === '^') return Math.pow(a, b)
      throw new FormulaError('op')
    }
    case 'call': return callFn(n, ctx)
  }
}
function callFn(fn: { f: string; args: Node[] }, ctx: Ctx): number {
  const args = fn.args
  const need = (k: number): void => { if (args.length < k) throw new FormulaError('argc') }
  const scalar = (i: number): number => {
    if (args[i].t === 'rng') throw new FormulaError('range')
    return evalNum(args[i], ctx)
  }
  const collect = (): number[] => {
    const out: number[] = []
    for (const a of args) {
      if (a.t === 'rng') {
        for (const r of a.refs) { const v = tryNum(r, ctx); if (v !== null) out.push(v) }
      } else if (a.t === 'ref') {
        const v = tryNum(a.r, ctx)
        if (v !== null) out.push(v)
      } else out.push(evalNum(a, ctx))
    }
    return out
  }
  switch (fn.f) {
    case 'SUM': return collect().reduce((s, v) => s + v, 0)
    case 'AVG':
    case 'AVERAGE': {
      const xs = collect()
      return xs.length ? xs.reduce((s, v) => s + v, 0) / xs.length : 0
    }
    case 'MIN': { const xs = collect(); return xs.length ? Math.min(...xs) : 0 }
    case 'MAX': { const xs = collect(); return xs.length ? Math.max(...xs) : 0 }
    case 'COUNT': return collect().length
    case 'ABS': need(1); return Math.abs(scalar(0))
    case 'SQRT': { need(1); const v = scalar(0); if (v < 0) throw new FormulaError('sqrt'); return Math.sqrt(v) }
    case 'POW': { need(2); return Math.pow(scalar(0), scalar(1)) }
    case 'ROUND': {
      need(1)
      const f = Math.pow(10, args[1] ? scalar(1) : 0)
      return Math.round(scalar(0) * f) / f
    }
  }
  throw new FormulaError('fn')
}
const fmtNum = (n: number): string => (Number.isInteger(n) ? String(n) : String(Number(n.toFixed(10))))

/* محاسبه همه سلول‌های فرمول‌دار برگه */
function computeSheet(cells: Cells): Record<string, string> {
  const out: Record<string, string> = {}
  const ctx: Ctx = { cells, cache: new Map(), visiting: new Set(), depth: 0 }
  for (const ref of Object.keys(cells)) {
    const v = cells[ref]?.v
    if (!v || !v.startsWith('=')) continue
    try { out[ref] = fmtNum(cellNum(ref, ctx)) }
    catch (e) { out[ref] = e instanceof CycleError ? '#چرخه' : '#خطا' }
  }
  return out
}

/* ------------------------------ برگه نمونه ------------------------------ */

function sampleWorkbook(): Workbook {
  const c: Cells = {
    A1: { v: 'مورد', b: true, bg: '#f7931e' },
    B1: { v: 'مبلغ (تومان)', b: true, bg: '#f7931e' },
    A2: { v: 'اجاره خانه' }, B2: { v: '8500000' },
    A3: { v: 'خوراک' }, B3: { v: '3200000' },
    A4: { v: 'حمل‌ونقل' }, B4: { v: '950000' },
    A5: { v: 'اینترنت و موبایل' }, B5: { v: '540000' },
    A6: { v: 'تفریح' }, B6: { v: '600000' },
    A7: { v: 'جمع کل', b: true, c: '#f7931e' },
    B7: { v: '=SUM(B2:B6)', b: true, c: '#f7931e', bg: '#18181b' },
    A9: { v: 'میانگین' }, B9: { v: '=AVG(B2:B6)' },
    A10: { v: 'بیشترین قلم' }, B10: { v: '=MAX(B2:B6)' },
    A11: { v: 'تعداد اقلام' }, B11: { v: '=COUNT(B2:B6)' },
  }
  const id = uid()
  return { sheets: [{ id, name: 'هزینه‌های ماه', cells: c }], activeId: id }
}
function loadWorkbook(): Workbook {
  try {
    if (typeof window !== 'undefined') {
      const p = JSON.parse(window.localStorage.getItem(LS_KEY) ?? '') as Workbook
      if (Array.isArray(p.sheets) && p.sheets.length > 0) {
        const sheets = p.sheets.map((s) => ({ id: String(s.id ?? uid()), name: String(s.name ?? 'برگه'), cells: (s.cells ?? {}) as Cells }))
        return { sheets, activeId: sheets.some((s) => s.id === p.activeId) ? p.activeId : sheets[0].id }
      }
    }
  } catch { /* داده خراب؛ از نو شروع می‌کنیم */ }
  return sampleWorkbook()
}

/* --------------------------------- CSV --------------------------------- */

const csvEscape = (s: string): string => (/["\n\r,]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s)

function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQ = false
  const pushRow = (): void => {
    if (field !== '' || row.length) { row.push(field); rows.push(row); row = []; field = '' }
  }
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQ) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ }
        else inQ = false
      } else field += ch
    } else if (ch === '"') inQ = true
    else if (ch === ',') { row.push(field); field = '' }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      pushRow()
    } else field += ch
  }
  pushRow()
  return rows.filter((r) => r.some((f) => f !== ''))
}

/* ------------------------------- کامپوننت ------------------------------- */

export default function SpreadsheetApp() {
  const pushToast = useOS((s) => s.pushToast)
  const [wb, setWb] = useState<Workbook>(loadWorkbook)
  const [active, setActive] = useState('A1')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<{ ref: string; text: string }>({ ref: 'A1', text: '' })
  const [palette, setPalette] = useState<'c' | 'bg' | null>(null)
  const [renameOpen, setRenameOpen] = useState(false)
  const [renameVal, setRenameVal] = useState('')
  const [pendingCsv, setPendingCsv] = useState<string[][] | null>(null)
  const [confirmDel, setConfirmDel] = useState(false)
  const gridRef = useRef<HTMLDivElement>(null)
  const editRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const skipBlurRef = useRef(false)

  const activeSheet = wb.sheets.find((s) => s.id === wb.activeId) ?? wb.sheets[0]
  const cells = activeSheet?.cells ?? {}
  const computed = useMemo(() => computeSheet(cells), [cells])
  const nonEmpty = useMemo(() => Object.values(cells).filter((c) => c.v !== '').length, [cells])
  const dispOf = useCallback((ref: string): string => {
    const raw = cells[ref]?.v ?? ''
    return raw.startsWith('=') ? (computed[ref] ?? '') : raw
  }, [cells, computed])
  /* ذخیره خودکار با تاخیر ۴۰۰ میلی‌ثانیه */
  useEffect(() => {
    const t = window.setTimeout(() => {
      try { window.localStorage.setItem(LS_KEY, JSON.stringify(wb)) } catch { /* پر شد؛ غصه نخور */ }
    }, 400)
    return () => window.clearTimeout(t)
  }, [wb])
  useEffect(() => {
    if (editing) editRef.current?.focus()
  }, [editing])
  useEffect(() => {
    if (!confirmDel) return
    const t = window.setTimeout(() => setConfirmDel(false), 3000)
    return () => window.clearTimeout(t)
  }, [confirmDel])

  const setSheet = useCallback((fn: (s: Sheet) => Sheet) => {
    setWb((w) => ({ ...w, sheets: w.sheets.map((s) => (s.id === w.activeId ? fn(s) : s)) }))
  }, [])

  const setCellRaw = useCallback((ref: string, v: string) => {
    setSheet((s) => {
      const prev = s.cells[ref]
      if (!v && (!prev || (!prev.b && !prev.c && !prev.bg))) {
        const cc = { ...s.cells }
        delete cc[ref]
        return { ...s, cells: cc }
      }
      return { ...s, cells: { ...s.cells, [ref]: { ...prev, v } } }
    })
  }, [setSheet])
  const moveSel = useCallback((dr: number, dc: number) => {
    setActive((prev) => {
      const col = prev.charCodeAt(0) - 65
      const row = parseInt(prev.slice(1), 10) || 1
      const c2 = Math.min(COLS - 1, Math.max(0, col + dc))
      const r2 = Math.min(ROWS, Math.max(1, row + dr))
      return `${COL_LETTERS[c2]}${r2}`
    })
  }, [])

  const beginEdit = useCallback((seed?: string) => {
    setDraft({ ref: active, text: seed ?? (cells[active]?.v ?? '') })
    setEditing(true)
  }, [cells, active])

  const commitEdit = useCallback((dr: number, dc: number) => {
    if (editing) {
      const cur = cells[active]?.v ?? ''
      const text = draft.ref === active ? draft.text : cur
      if (text !== cur) setCellRaw(active, text)
      setEditing(false)
    }
    moveSel(dr, dc)
    requestAnimationFrame(() => gridRef.current?.focus())
  }, [editing, draft, cells, active, setCellRaw, moveSel])

  const cancelEdit = useCallback(() => {
    skipBlurRef.current = true
    window.setTimeout(() => { skipBlurRef.current = false }, 0)
    setEditing(false)
    requestAnimationFrame(() => gridRef.current?.focus())
  }, [])

  const onBlurCommit = useCallback(() => {
    if (skipBlurRef.current) { skipBlurRef.current = false; return }
    const cur = cells[active]?.v ?? ''
    const text = draft.ref === active ? draft.text : cur
    if (text !== cur) setCellRaw(active, text)
    setEditing(false)
  }, [draft, cells, active, setCellRaw])

  const onCellDown = (ref: string, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'INPUT') return
    if (editing) onBlurCommit()
    setActive(ref)
    gridRef.current?.focus()
  }

  const onGridKeyDown = (e: React.KeyboardEvent) => {
    if (editing) return
    const k = e.key
    if (k === 'ArrowUp') { e.preventDefault(); moveSel(-1, 0) }
    else if (k === 'ArrowDown' || k === 'Enter') { e.preventDefault(); moveSel(1, 0) }
    else if (k === 'ArrowLeft') { e.preventDefault(); moveSel(0, -1) }
    else if (k === 'ArrowRight' || k === 'Tab') { e.preventDefault(); moveSel(0, 1) }
    else if (k === 'Delete' || k === 'Backspace') { e.preventDefault(); setCellRaw(active, '') }
    else if (k.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); beginEdit(k) }
  }

  const onEditKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation()
    if (e.key === 'Enter') commitEdit(1, 0)
    else if (e.key === 'Tab') commitEdit(0, 1)
    else if (e.key === 'Escape') cancelEdit()
  }

  /* برگه‌ها */
  const addSheet = () => {
    const id = uid()
    setWb((w) => ({ sheets: [...w.sheets, { id, name: `برگه ${w.sheets.length + 1}`, cells: {} }], activeId: id }))
    setActive('A1')
  }

  const doRename = () => {
    const name = renameVal.trim()
    if (!name) return
    setSheet((s) => ({ ...s, name }))
    setRenameOpen(false)
    pushToast({ icon: '✅', title: 'نام برگه', body: `به «${name}» تغییر کرد.` })
  }

  const deleteSheet = () => {
    setConfirmDel(false)
    if (wb.sheets.length <= 1) {
      pushToast({ icon: '⚠️', title: 'ممکن نیست', body: 'حداقل یک برگه باید باقی بماند.' })
      return
    }
    const rest = wb.sheets.filter((s) => s.id !== wb.activeId)
    setWb((w) => ({ sheets: rest, activeId: rest[0].id }))
    setActive('A1')
    pushToast({ icon: '🗑', title: 'حذف شد', body: `برگه «${activeSheet?.name}» پاک شد.` })
  }

  /* قالب‌بندی سلول فعال */
  const patchCell = useCallback((patch: Partial<Cell>) => {
    setSheet((s) => {
      const prev = s.cells[active] ?? { v: '' }
      return { ...s, cells: { ...s.cells, [active]: { ...prev, ...patch } } }
    })
  }, [setSheet, active])

  const toggleBold = () => patchCell({ b: !cells[active]?.b })
  const applyColor = (key: 'c' | 'bg', val?: string) => {
    patchCell({ [key]: val })
    setPalette(null)
  }

  /* CSV */
  const exportCsv = () => {
    let maxR = 0
    let maxC = 0
    for (const [ref, cell] of Object.entries(cells)) {
      if (!cell.v) continue
      maxC = Math.max(maxC, ref.charCodeAt(0) - 65)
      maxR = Math.max(maxR, parseInt(ref.slice(1), 10) || 0)
    }
    const rows: string[][] = []
    for (let r = 1; r <= maxR; r++) {
      const row: string[] = []
      for (let c = 0; c <= maxC; c++) row.push(dispOf(`${COL_LETTERS[c]}${r}`))
      rows.push(row)
    }
    const csv = '\uFEFF' + rows.map((r) => r.map(csvEscape).join(',')).join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `${activeSheet?.name || 'sheet'}.csv`
    a.click()
    URL.revokeObjectURL(url)
    pushToast({ icon: '✅', title: 'خروجی CSV', body: `«${activeSheet?.name}.csv» ذخیره شد.` })
  }

  const onImportFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const rows = parseCsv(String(reader.result ?? '').replace(/^\uFEFF/, ''))
      if (!rows.length) {
        pushToast({ icon: '⚠️', title: 'ورود CSV', body: 'فایل خالی است یا قابل خواندن نیست.' })
        return
      }
      setPendingCsv(rows)
    }
    reader.readAsText(file, 'utf-8')
  }

  const applyCsv = () => {
    if (!pendingCsv) return
    const nc: Cells = {}
    pendingCsv.forEach((row, ri) => {
      if (ri >= ROWS) return
      row.forEach((f, ci) => {
        if (ci < COLS && f !== '') nc[`${COL_LETTERS[ci]}${ri + 1}`] = { v: f }
      })
    })
    setSheet((s) => ({ ...s, cells: nc }))
    pushToast({ icon: '📥', title: 'ورود CSV', body: `${pendingCsv.length.toLocaleString('fa-IR')} سطر وارد شد.` })
    setPendingCsv(null)
  }

  /* رندر */
  const activeRaw = cells[active]?.v ?? ''
  const activeDisp = dispOf(active)
  const swatches = (key: 'c' | 'bg') => (
    <div className="absolute top-8 z-50 flex items-center gap-1 rounded-xl border border-white/10 bg-zinc-900 p-2 shadow-xl"
      style={{ [key === 'c' ? 'left' : 'right']: 0 } as React.CSSProperties}>
      {(key === 'c' ? TEXT_COLORS : BG_COLORS).map((c) => (
        <button key={c} onClick={() => applyColor(key, c)} style={{ background: c }}
          className={`h-5 w-5 rounded-md border border-white/25 ${cells[active]?.[key] === c ? 'ring-2 ring-orange-400' : ''}`} />
      ))}
      <button onClick={() => applyColor(key, undefined)} title="بدون رنگ" className="h-5 w-5 rounded-md border border-white/25"
        style={{ background: 'linear-gradient(135deg,transparent 44%,#fb7185 44%,#fb7185 56%,transparent 56%)' }} />
    </div>
  )

  return (
    <div dir="rtl" className="flex h-full w-full flex-col overflow-hidden bg-zinc-900/50 text-xs text-zinc-100">
      {/* نوار ابزار */}
      <div className="flex flex-wrap items-center gap-1 border-b border-white/10 px-2 py-1.5">
        <Button variant="ghost" size="icon" className="h-7 w-7" title="برگه جدید" onClick={addSheet}><FilePlus2 className="h-3.5 w-3.5 text-teal-300" /></Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" title="تغییر نام برگه"
          onClick={() => { setRenameVal(activeSheet?.name ?? ''); setRenameOpen(true) }}><Pencil className="h-3.5 w-3.5 text-violet-300" /></Button>
        <Button variant={confirmDel ? 'destructive' : 'ghost'} size="sm" className="h-7 gap-1 px-2 text-[10px]" title="حذف برگه"
          onClick={() => (confirmDel ? deleteSheet() : setConfirmDel(true))}><Trash2 className="h-3.5 w-3.5" />{confirmDel ? 'تأیید حذف' : ''}</Button>
        <div className="mx-1 h-5 w-px bg-white/10" />
        <Button variant="ghost" size="icon" className="h-7 w-7" title="خروجی CSV" onClick={exportCsv}><Download className="h-3.5 w-3.5 text-orange-400" /></Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" title="ورود CSV" onClick={() => fileRef.current?.click()}><Upload className="h-3.5 w-3.5 text-orange-400" /></Button>
        <div className="mx-1 h-5 w-px bg-white/10" />
        <Button variant={cells[active]?.b ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7" title="بولد" onClick={toggleBold}><Bold className="h-3.5 w-3.5" /></Button>
        <div className="relative">
          <Button variant="ghost" size="icon" className="h-7 w-7" title="رنگ متن"
            onClick={() => setPalette((p) => (p === 'c' ? null : 'c'))}><Type className="h-3.5 w-3.5" style={{ color: cells[active]?.c }} /></Button>
          {palette === 'c' && swatches('c')}
        </div>
        <div className="relative">
          <Button variant="ghost" size="icon" className="h-7 w-7" title="رنگ پس‌زمینه"
            onClick={() => setPalette((p) => (p === 'bg' ? null : 'bg'))}><PaintBucket className="h-3.5 w-3.5" /></Button>
          {palette === 'bg' && swatches('bg')}
        </div>
        <div className="ms-auto">
          <Badge variant="outline" className="h-5 border-orange-400/40 bg-orange-400/10 px-1.5 font-mono text-[10px] text-orange-300">{active}</Badge>
        </div>
        <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onImportFile(f); e.target.value = '' }} />
      </div>

      {/* نوار فرمول */}
      <div dir="ltr" className="flex items-center gap-1.5 border-b border-white/10 px-2 py-1">
        <span className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-orange-300">{active}</span>
        <span className="font-mono text-[10px] italic text-zinc-500">fx</span>
        <input
          className="h-5 flex-1 bg-transparent font-mono text-[11px] text-zinc-100 outline-none placeholder:text-zinc-600"
          value={editing && draft.ref === active ? draft.text : activeRaw}
          placeholder="=SUM(A1:A5)"
          onChange={(e) => { setDraft({ ref: active, text: e.target.value }); if (!editing) setEditing(true) }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitEdit(1, 0)
            else if (e.key === 'Tab') { e.preventDefault(); commitEdit(0, 1) }
            else if (e.key === 'Escape') cancelEdit()
          }}
          onBlur={onBlurCommit}
        />
      </div>

      {/* شبکه سلول‌ها (LTR برای فرمول‌ها) */}
      <div ref={gridRef} dir="ltr" tabIndex={0} onKeyDown={onGridKeyDown} className="os-scroll flex-1 overflow-auto outline-none">
        <table className="w-max select-none border-collapse text-[11px]">
          <thead>
            <tr>
              <th className="sticky left-0 top-0 z-30 h-6 w-10 min-w-10 border-b border-r border-white/10 bg-zinc-900" />
              {COL_LETTERS.map((l) => (
                <th key={l} className="sticky top-0 z-20 h-6 w-[88px] min-w-[88px] border-b border-r border-white/10 bg-zinc-900 text-[10px] font-medium text-zinc-400">{l}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROW_NUMS.map((r) => (
              <tr key={r}>
                <th className="sticky left-0 z-10 h-6 w-10 min-w-10 border-b border-r border-white/10 bg-zinc-900 text-[10px] font-normal text-zinc-500">{r}</th>
                {COL_LETTERS.map((l) => {
                  const ref = `${l}${r}`
                  const cell = cells[ref]
                  const disp = dispOf(ref)
                  const isNum = disp !== '' && !Number.isNaN(Number(disp.replace(/,/g, '')))
                  const isErr = disp.startsWith('#')
                  return (
                    <td key={ref} onMouseDown={(e) => onCellDown(ref, e)} onDoubleClick={() => !editing && beginEdit()}
                      className={`relative h-6 w-[88px] min-w-[88px] max-w-[88px] cursor-cell border-b border-r border-white/5 ${ref === active ? 'z-[5] outline outline-2 -outline-offset-2 outline-orange-400' : ''}`}>
                      {editing && ref === active ? (
                        <input ref={editRef} dir="ltr" value={draft.text} onChange={(e) => setDraft({ ref: active, text: e.target.value })}
                          onKeyDown={onEditKeyDown} onBlur={onBlurCommit}
                          className="absolute inset-0 z-20 w-full bg-zinc-900 px-1 font-mono text-[11px] text-zinc-100 outline-none ring-2 ring-orange-400" />
                      ) : (
                        <div className={`flex h-full items-center overflow-hidden whitespace-nowrap px-1 ${isNum ? 'justify-end' : ''} ${isErr ? 'text-rose-400' : ''}`}
                          style={{ color: isErr ? undefined : cell?.c, background: cell?.bg, fontWeight: cell?.b ? 700 : undefined }}>
                          {disp}
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* تب برگه‌ها */}
      <div className="os-scroll flex items-center gap-1 overflow-x-auto border-t border-white/10 px-2 py-1">
        {wb.sheets.map((s) => (
          <button key={s.id} onClick={() => { setWb((w) => ({ ...w, activeId: s.id })); setActive('A1') }}
            className={`whitespace-nowrap rounded-md px-2 py-0.5 text-[10px] transition ${s.id === wb.activeId ? 'bg-orange-500/20 text-orange-300' : 'text-zinc-400 hover:bg-white/5'}`}>
            {s.name}
          </button>
        ))}
      </div>

      {/* نوار وضعیت */}
      <div className="flex items-center justify-between gap-2 border-t border-white/10 px-2 py-1 text-[10px] text-zinc-400">
        <div dir="ltr" className="flex-1 truncate font-mono text-zinc-500">
          {activeRaw ? (activeRaw.startsWith('=') ? `${activeRaw} → ${activeDisp}` : activeRaw) : '—'}
        </div>
        <span className="shrink-0 text-zinc-500">{nonEmpty.toLocaleString('fa-IR')} خانه پر</span>
      </div>
      {/* دیالوگ تغییر نام */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="max-w-xs border-white/10 bg-zinc-900">
          <DialogHeader><DialogTitle className="text-sm">تغییر نام برگه</DialogTitle></DialogHeader>
          <Input autoFocus value={renameVal} onChange={(e) => setRenameVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && doRename()} className="h-8 text-xs" />
          <DialogFooter>
            <Button size="sm" className="h-7 bg-orange-500 text-xs text-white hover:bg-orange-600" onClick={doRename}>ذخیره</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* دیالوگ تأیید ورود CSV */}
      <Dialog open={!!pendingCsv} onOpenChange={(o) => !o && setPendingCsv(null)}>
        <DialogContent className="max-w-xs border-white/10 bg-zinc-900">
          <DialogHeader><DialogTitle className="text-sm">ورود CSV</DialogTitle></DialogHeader>
          <p className="text-[11px] leading-5 text-zinc-400">
            محتوای برگه «{activeSheet?.name}» با {(pendingCsv?.length ?? 0).toLocaleString('fa-IR')} سطر بازنویسی شود؟
          </p>
          <DialogFooter className="flex-row gap-2">
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setPendingCsv(null)}>انصراف</Button>
            <Button size="sm" className="h-7 bg-orange-500 text-xs text-white hover:bg-orange-600" onClick={applyCsv}>بازنویسی</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
