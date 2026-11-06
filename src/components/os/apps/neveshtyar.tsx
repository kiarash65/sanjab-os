'use client'

/* ------------------------------------------------------------------ */
/* نوشت‌یار — دستیار نوشتن فارسی، کاملاً محلی                          */
/* موتور: src/lib/persian/neveshtyar.ts                                */
/* الهام از NeveshtYar (MIT) و DadmaTools (Apache-2.0) — کد اصل است    */
/* ------------------------------------------------------------------ */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion'
import {
  Feather,
  ShieldCheck,
  Keyboard,
  Quote,
  SpellCheck,
  Hash,
  Scissors,
  Type,
  CopyX,
  AlignLeft,
  Wand2,
  Save,
  Download,
  Undo2,
  Redo2,
  Trash2,
  FileText,
  Check,
  X,
  BarChart3,
  FileWarning,
  LoaderCircle,
  FolderOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  analyzeText,
  applyEdits,
  layoutConvert,
  NY_ZWNJ,
  type NyEdit,
  type NyEditType,
  type NyResult,
} from '@/lib/persian/neveshtyar'
import { SUNJOB_PALETTE } from '@/lib/os/brand'

/* ---------------------------- ذخیره‌سازی --------------------------- */

interface NyDoc {
  id: string
  title: string
  text: string
  updated: number
}

const LS_KEY = 'sunjob-ny-v1'

function loadDocs(): NyDoc[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as { docs?: NyDoc[] }
    return Array.isArray(parsed.docs) ? parsed.docs.slice(0, 30) : []
  } catch {
    return []
  }
}

function saveDocs(docs: NyDoc[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ docs }))
  } catch {
    /* حافظه پر است — بی‌صدا */
  }
}

/* --------------------------- نقشهٔ انواع --------------------------- */

const fa = (n: number | string) => String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)])

const TYPE_META: Record<
  NyEditType,
  { label: string; icon: typeof Keyboard; color: string; bg: string; border: string }
> = {
  layout: { label: 'چیدمان کیبورد', icon: Keyboard, color: '#f59e0b', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  char: { label: 'حرف عربی', icon: Type, color: '#a855f7', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  digit: { label: 'رقم', icon: Hash, color: '#10b981', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  zwnj: { label: 'نیم‌فاصله', icon: Scissors, color: '#22d3ee', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' },
  space: { label: 'فاصله', icon: AlignLeft, color: '#a1a1aa', bg: 'bg-zinc-500/10', border: 'border-zinc-500/30' },
  punct: { label: 'نشانهٔ نگارشی', icon: Wand2, color: '#a855f7', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  quote: { label: 'گیومه', icon: Quote, color: '#c084fc', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  typo: { label: 'غلط املایی', icon: SpellCheck, color: '#f43f5e', bg: 'bg-rose-500/10', border: 'border-rose-500/30' },
  repeat: { label: 'واژهٔ تکراری', icon: CopyX, color: '#f97316', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
}

/* --------------------------- کامپوننت اصلی ------------------------- */

export default function NeveshtYarApp() {
  const reduced = useReducedMotion() ?? false
  const [text, setText] = useState('')
  const [result, setResult] = useState<NyResult | null>(null)
  const [rejected, setRejected] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)
  const [banner, setBanner] = useState<{ kind: 'ok' | 'warn' | 'info'; msg: string } | null>(null)
  const [docs, setDocs] = useState<NyDoc[]>([])
  const [docTitle, setDocTitle] = useState('سند بی‌نام')
  const [fontSize, setFontSize] = useState(15)
  const [undoStack, setUndoStack] = useState<string[]>([])
  const [redoStack, setRedoStack] = useState<string[]>([])
  const areaRef = useRef<HTMLTextAreaElement>(null)

  /* بارگیری سندهای ذخیره‌شده */
  useEffect(() => {
    const t = window.setTimeout(() => setDocs(loadDocs()), 0)
    return () => window.clearTimeout(t)
  }, [])

  /* پاک‌سازی بنر */
  useEffect(() => {
    if (!banner) return undefined
    const t = window.setTimeout(() => setBanner(null), 2600)
    return () => window.clearTimeout(t)
  }, [banner])

  const pushUndo = useCallback((prev: string) => {
    setUndoStack((st) => [...st.slice(-40), prev])
    setRedoStack([])
  }, [])

  const applyText = useCallback(
    (next: string) => {
      pushUndo(text)
      setText(next)
    },
    [text, pushUndo],
  )

  /* ------------------------- ویرایش‌های فعال ------------------------ */

  const edits = useMemo(() => {
    if (!result) return []
    return result.edits.filter((e) => !rejected.has(e.id))
  }, [result, rejected])

  const nonOverlapping = useMemo(() => {
    // از بین ویرایش‌های هم‌پوشان فقط اولین را نگه می‌داریم
    const out: NyEdit[] = []
    let lastEnd = -1
    for (const e of edits) {
      if (e.start >= lastEnd) {
        out.push(e)
        lastEnd = e.end
      }
    }
    return out
  }, [edits])

  const layoutEdits = nonOverlapping.filter((e) => e.type === 'layout')
  const safeEdits = nonOverlapping.filter((e) => e.type !== 'layout')

  /* --------------------------- عملیات‌ها ----------------------------- */

  const runCheck = useCallback(() => {
    setBusy(true)
    // پردازش سبک است؛ یک تاخیر کوتاه برای حس پاسخ‌گویی
    window.setTimeout(() => {
      setResult(analyzeText(text))
      setRejected(new Set())
      setBusy(false)
      if (!text.trim()) setBanner({ kind: 'warn', msg: 'متنی برای بررسی نیست' })
      else setBanner({ kind: 'info', msg: 'بررسی انجام شد — پیشنهادها در ستون کنار' })
    }, reduced ? 0 : 220)
  }, [text, reduced])

  const acceptEdit = useCallback(
    (e: NyEdit) => {
      applyText(applyEdits(text, [e]))
      setResult(analyzeText(applyEdits(text, [e])))
      setBanner({ kind: 'ok', msg: 'اصلاح اعمال شد' })
    },
    [text, applyText],
  )

  const rejectEdit = useCallback((e: NyEdit) => {
    setRejected((prev) => new Set(prev).add(e.id))
  }, [])

  const acceptAllSafe = useCallback(() => {
    if (!safeEdits.length) return
    const next = applyEdits(text, safeEdits)
    applyText(next)
    setResult(analyzeText(next))
    setBanner({ kind: 'ok', msg: `${fa(safeEdits.length)} اصلاح اعمال شد` })
  }, [safeEdits, text, applyText])

  const quickClean = useCallback(() => {
    if (!text.trim()) return
    const r = analyzeText(text)
    const safe = r.edits.filter((e) => e.type !== 'layout')
    if (!safe.length) {
      setBanner({ kind: 'info', msg: 'چیزی برای پاک‌سازی نبود' })
      return
    }
    const next = applyEdits(text, safe)
    applyText(next)
    setResult(analyzeText(next))
    setBanner({ kind: 'ok', msg: `${fa(safe.length)} اصلاح خودکار انجام شد` })
  }, [text, applyText])

  const doConvert = useCallback(
    (dir: 'fa2en' | 'en2fa') => {
      if (!text.trim()) return
      applyText(layoutConvert(text, dir))
      setResult(null)
      setBanner({ kind: 'ok', msg: dir === 'fa2en' ? 'متن با چیدمان انگلیسی بازنویسی شد' : 'متن با چیدمان فارسی بازنویسی شد' })
    },
    [text, applyText],
  )

  const undo = useCallback(() => {
    if (!undoStack.length) return
    const prev = undoStack[undoStack.length - 1]
    setUndoStack((st) => st.slice(0, -1))
    setRedoStack((st) => [...st, text])
    setText(prev)
    setResult(null)
  }, [text, undoStack])

  const redo = useCallback(() => {
    if (!redoStack.length) return
    const next = redoStack[redoStack.length - 1]
    setRedoStack((st) => st.slice(0, -1))
    setUndoStack((st) => [...st, text])
    setText(next)
    setResult(null)
  }, [text, redoStack])

  const saveDoc = useCallback(() => {
    if (!text.trim()) {
      setBanner({ kind: 'warn', msg: 'سند خالی است' })
      return
    }
    const now = Date.now()
    const existing = docs.findIndex((d) => d.title === docTitle)
    let next: NyDoc[]
    if (existing >= 0) {
      next = docs.map((d, i) => (i === existing ? { ...d, text, updated: now } : d))
    } else {
      next = [{ id: `nd${now}`, title: docTitle || 'سند بی‌نام', text, updated: now }, ...docs].slice(0, 30)
    }
    setDocs(next)
    saveDocs(next)
    setBanner({ kind: 'ok', msg: 'سند ذخیره شد' })
  }, [text, docs, docTitle])

  const openDoc = useCallback((d: NyDoc) => {
    setUndoStack([])
    setRedoStack([])
    setText(d.text)
    setDocTitle(d.title)
    setResult(null)
  }, [])

  const deleteDoc = useCallback(
    (id: string) => {
      const next = docs.filter((d) => d.id !== id)
      setDocs(next)
      saveDocs(next)
    },
    [docs],
  )

  const exportTxt = useCallback(() => {
    const blob = new Blob([`\ufeff${text}`], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${docTitle || 'neveshtyar'}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }, [text, docTitle])

  /* --------------------------- میان‌برها ----------------------------- */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      } else if ((e.key === 'y') || (e.key === 'z' && e.shiftKey)) {
        e.preventDefault()
        redo()
      } else if (e.key === 's') {
        e.preventDefault()
        saveDoc()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo, saveDoc])

  const analysis = result?.analysis
  const liveWords = text.trim() ? text.trim().split(/\s+/).length : 0

  /* ------------------------------ رندر ------------------------------ */

  return (
    <div className="flex h-full flex-col gap-3 p-4" dir="rtl">
      {/* سربرگ */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ background: 'rgba(247,147,30,.14)', color: SUNJOB_PALETTE.orange }}
          >
            <Feather size={18} />
          </span>
          <div>
            <h2 className="text-sm font-black text-zinc-100">نوشت‌یار</h2>
            <p className="text-[11px] text-zinc-500">دستیار نوشتن فارسی — پردازش کاملاً محلی، هیچ متنی جایی ارسال نمی‌شود</p>
          </div>
        </div>
        <Badge className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
          <ShieldCheck size={12} /> آفلاین و خصوصی
        </Badge>
      </div>

      {/* بنر پیام */}
      <AnimatePresence>
        {banner && (
          <motion.div
            initial={{ opacity: 0, y: reduced ? 0 : -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`rounded-xl border px-3 py-1.5 text-xs ${
              banner.kind === 'ok'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                : banner.kind === 'warn'
                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                  : 'border-white/10 bg-white/5 text-zinc-300'
            }`}
          >
            {banner.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[1fr_300px]">
        {/* ستون ویرایشگر */}
        <div className="flex min-h-0 flex-col gap-2">
          {/* نوار ابزار */}
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              size="sm"
              onClick={runCheck}
              disabled={busy}
              className="h-8 gap-1.5 bg-amber-500 font-bold text-zinc-950 hover:bg-amber-400"
              style={{ background: SUNJOB_PALETTE.orange }}
            >
              {busy ? <LoaderCircle size={14} className="animate-spin" /> : <SpellCheck size={14} />}
              بررسی متن
            </Button>
            <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={quickClean}>
              <Wand2 size={14} /> پاک‌سازی سریع
            </Button>
            <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={() => doConvert('fa2en')}>
              <Keyboard size={14} /> fa→en
            </Button>
            <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={() => doConvert('en2fa')}>
              <Keyboard size={14} /> en→fa
            </Button>
            <span className="mx-1 h-5 w-px bg-white/10" />
            <Button size="sm" variant="ghost" className="h-8 gap-1 px-2" onClick={undo} disabled={undoStack.length === 0} aria-label="واگرد">
              <Undo2 size={14} />
            </Button>
            <Button size="sm" variant="ghost" className="h-8 gap-1 px-2" onClick={redo} disabled={redoStack.length === 0} aria-label="ازنو">
              <Redo2 size={14} />
            </Button>
            <span className="mx-1 h-5 w-px bg-white/10" />
            <Button size="sm" variant="ghost" className="h-8 gap-1.5" onClick={() => setFontSize((s) => Math.max(12, s - 1))} aria-label="کوچک‌تر">
              <Type size={12} />
            </Button>
            <Button size="sm" variant="ghost" className="h-8 gap-1.5" onClick={() => setFontSize((s) => Math.min(22, s + 1))} aria-label="بزرگ‌تر">
              <Type size={16} />
            </Button>
            <span className="mx-1 h-5 w-px bg-white/10" />
            <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={saveDoc}>
              <Save size={14} /> ذخیره
            </Button>
            <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={exportTxt}>
              <Download size={14} /> خروجی txt
            </Button>
          </div>

          {/* ویرایشگر */}
          <Textarea
            ref={areaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            dir="rtl"
            style={{ fontSize }}
            className="os-scroll min-h-[200px] flex-1 resize-none rounded-2xl border-white/10 bg-zinc-950/70 leading-8 text-zinc-100 focus-visible:ring-amber-500/40"
            placeholder={'متن فارسی خود را اینجا بنویسید…\n\nمثلاً:  من ديروز كتابي را خواندم كه درباره "هوش مصنوعی" بود , واقعا جالب بود.'}
          />

          {/* شمارنده‌های زنده */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
            <span>{fa(liveWords)} واژه</span>
            <span>·</span>
            <span>{fa(text.length)} نویسه</span>
            <span>·</span>
            <span>{fa(text ? text.split(/\n+/).filter((l) => l.trim()).length : 0)} خط</span>
            <span className="ms-auto flex items-center gap-1 text-amber-400/80">
              <FileText size={11} />
              <Input
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                className="h-6 w-32 border-white/10 bg-zinc-900/60 text-[11px] text-zinc-300"
                aria-label="عنوان سند"
              />
            </span>
          </div>

          {/* تحلیل متن */}
          {analysis && (
            <Card className="border-white/10 bg-zinc-900/50 p-3">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-black text-zinc-200">
                <BarChart3 size={13} style={{ color: SUNJOB_PALETTE.orange }} /> تحلیل متن
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {[
                  ['واژه', analysis.words],
                  ['جمله', analysis.sentences],
                  ['بند', analysis.paragraphs],
                  ['نویسه', analysis.chars],
                  ['میانگین جمله', analysis.avgSentence],
                  ['جملهٔ بلند', analysis.longSentences.length],
                ].map(([label, v]) => (
                  <div key={String(label)} className="rounded-xl border border-white/5 bg-white/[0.03] p-2 text-center">
                    <div className="text-sm font-black text-zinc-100">{fa(Number(v))}</div>
                    <div className="text-[10px] text-zinc-500">{label}</div>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge
                  className={
                    analysis.readability === 'آسان'
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                      : analysis.readability === 'متوسط'
                        ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                        : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                  }
                >
                  خوانایی: {analysis.readability}
                </Badge>
                <span className="text-[11px] text-zinc-500">جمله‌های میانگینِ زیر ۲۰ واژه خواناترند</span>
              </div>
              {analysis.repeats.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {analysis.repeats.slice(0, 8).map((r) => (
                    <Badge key={r.word} variant="outline" className="border-orange-500/30 bg-orange-500/5 text-[10px] text-orange-300">
                      {r.word} ×{fa(r.count)}
                    </Badge>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>

        {/* ستون پیشنهادها و اسناد */}
        <div className="os-scroll flex min-h-0 flex-col gap-3 overflow-y-auto pl-1">
          {/* پیشنهادها */}
          <Card className="border-white/10 bg-zinc-900/50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-black text-zinc-200">
                <SpellCheck size={13} style={{ color: SUNJOB_PALETTE.orange }} />
                پیشنهادها {result ? `(${fa(nonOverlapping.length)})` : ''}
              </div>
              {safeEdits.length > 0 && (
                <Button size="sm" variant="ghost" className="h-6 gap-1 px-2 text-[10px] text-emerald-300 hover:text-emerald-200" onClick={acceptAllSafe}>
                  <Check size={11} /> پذیرش همه (بدون چیدمان)
                </Button>
              )}
            </div>

            {!result && (
              <p className="rounded-xl border border-dashed border-white/10 p-3 text-center text-[11px] leading-5 text-zinc-500">
                دکمهٔ «بررسی متن» را بزنید تا پیشنهادهای نگارشی، نیم‌فاصله، چیدمان و املایی اینجا بیاید.
              </p>
            )}

            {result && nonOverlapping.length === 0 && (
              <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-center text-[11px] text-emerald-300">
                متن تمیز است — هیچ پیشنهادی نداریم.
              </p>
            )}

            <div className="space-y-2">
              <AnimatePresence initial={false}>
                {nonOverlapping.map((e) => {
                  const meta = TYPE_META[e.type]
                  const Icon = meta.icon
                  return (
                    <motion.div
                      key={e.id}
                      layout={!reduced}
                      initial={{ opacity: 0, y: reduced ? 0 : 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: reduced ? 1 : 0.95 }}
                      transition={{ duration: reduced ? 0 : 0.2 }}
                      className={`rounded-xl border p-2.5 ${meta.border} ${meta.bg}`}
                    >
                      <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold" style={{ color: meta.color }}>
                        <Icon size={11} />
                        {meta.label}
                        {e.type === 'layout' && (
                          <Badge variant="outline" className="h-4 border-amber-500/40 px-1 text-[9px] text-amber-300">
                            نیازمند تأیید شما
                          </Badge>
                        )}
                      </div>
                      <div className="mb-1 text-xs leading-6" dir="auto">
                        <span className="rounded bg-rose-500/15 px-1 text-rose-300 line-through decoration-rose-400/60">{e.from || '␣'}</span>
                        <span className="mx-1 text-zinc-500">←</span>
                        <span className="rounded bg-emerald-500/15 px-1 text-emerald-300">{e.to || 'حذف'}</span>
                      </div>
                      <p className="mb-1.5 text-[10px] leading-4 text-zinc-500">{e.reason}</p>
                      <div className="flex gap-1.5">
                        <Button size="sm" className="h-6 gap-1 bg-emerald-600 px-2 text-[10px] hover:bg-emerald-500" onClick={() => acceptEdit(e)}>
                          <Check size={10} /> پذیرش
                        </Button>
                        <Button size="sm" variant="ghost" className="h-6 gap-1 px-2 text-[10px] text-zinc-400" onClick={() => rejectEdit(e)}>
                          <X size={10} /> رد
                        </Button>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </Card>

          {/* اسناد ذخیره‌شده */}
          <Card className="border-white/10 bg-zinc-900/50 p-3">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-black text-zinc-200">
              <FolderOpen size={13} style={{ color: SUNJOB_PALETTE.orange }} /> سندهای من
            </div>
            {docs.length === 0 ? (
              <p className="text-[11px] leading-5 text-zinc-500">هنوز سندی ذخیره نکرده‌اید. با دکمهٔ «ذخیره» متن فعلی نگه داشته می‌شود (فقط در همین مرورگر).</p>
            ) : (
              <ul className="space-y-1.5">
                {docs.map((d) => (
                  <li key={d.id} className="flex items-center gap-1.5 rounded-xl border border-white/5 bg-white/[0.03] px-2 py-1.5">
                    <FileText size={12} className="shrink-0 text-zinc-500" />
                    <button className="min-w-0 flex-1 truncate text-start text-[11px] text-zinc-300 hover:text-amber-300" onClick={() => openDoc(d)}>
                      {d.title}
                    </button>
                    <span className="shrink-0 text-[9px] text-zinc-600">{fa(new Date(d.updated).toLocaleDateString('fa-IR'))}</span>
                    <Button size="sm" variant="ghost" className="h-5 w-5 shrink-0 p-0 text-zinc-600 hover:text-rose-400" onClick={() => deleteDoc(d.id)} aria-label="حذف سند">
                      <Trash2 size={11} />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* حریم خصوصی */}
          <div className="flex items-start gap-1.5 rounded-xl border border-white/5 bg-white/[0.02] p-2.5 text-[10px] leading-4 text-zinc-600">
            <FileWarning size={12} className="mt-0.5 shrink-0" />
            <span>
              تمام پردازش‌ها روی دستگاه شما انجام می‌شود؛ متن شما از مرورگر خارج نمی‌شود. الهام از پروژه‌های NeveshtYar (MIT) و DadmaTools (Apache-2.0) — پیاده‌سازی اصلی و محلی.
            </span>
          </div>
        </div>
      </div>

      {/* نیم‌فاصلهٔ واقعی برای کپی کاربر */}
      <span className="sr-only">{NY_ZWNJ}</span>
    </div>
  )
}
