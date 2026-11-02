'use client'

import { useEffect, useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  FileText,
  Play,
  Plus,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useOS } from '@/lib/os/store'

/* ---------------------------------- مدل ---------------------------------- */

interface Slide {
  id: string
  title: string
  body: string
  theme: string
}

interface Deck {
  title: string
  slides: Slide[]
}

const LS_KEY = 'pengo-slides-v1'

const THEMES: { id: string; label: string; css: string }[] = [
  { id: 'sunset', label: 'غروب نارنجی', css: 'linear-gradient(135deg,#f7931e,#fbbf24)' },
  { id: 'violet', label: 'بنفش کهکشانی', css: 'linear-gradient(135deg,#8b5cf6,#d946ef)' },
  { id: 'teal', label: 'فیروزه‌ای اقیانوس', css: 'linear-gradient(135deg,#14b8a6,#10b981)' },
  { id: 'rose', label: 'گل رز', css: 'linear-gradient(135deg,#f43f5e,#ec4899)' },
  { id: 'navy', label: 'سرمه‌ای شب', css: 'linear-gradient(135deg,#1e293b,#52525b)' },
  { id: 'lime', label: 'لیمویی بهاری', css: 'linear-gradient(135deg,#84cc16,#059669)' },
]

const themeOf = (id: string): { id: string; label: string; css: string } =>
  THEMES.find((t) => t.id === id) ?? THEMES[0]

const uid = (): string => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
const fa = (n: number): string => n.toLocaleString('fa-IR')

type Line = { text: string; bullet: boolean }

const parseLines = (body: string): Line[] =>
  body
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) =>
      /^[-•·]\s?/.test(l)
        ? { text: l.replace(/^[-•·]\s?/, ''), bullet: true }
        : { text: l, bullet: false },
    )

function sampleDeck(): Deck {
  return {
    title: 'معرفی سان‌جاب‌او‌اس',
    slides: [
      {
        id: uid(),
        title: 'سان‌جاب‌او‌اس 🐧',
        body: 'یک وب‌سیستم کامل، همین‌جا توی مرورگر تو\nبا اسپانسری سان‌جاب\nسبک، سریع و تمام‌فارسی',
        theme: 'sunset',
      },
      {
        id: uid(),
        title: 'چرا سان‌جاب‌او‌اس؟',
        body: '- پنجره‌های شناور و داک کاربردی\n- اپ‌های آماده: یادداشت، ماشین‌حساب، ترمینال و…\n- تم تاریک شیشه‌ای با رنگ‌های زنده سان‌جاب\n- همه‌چیز محلی؛ هیچ داده‌ای جایی نمی‌ره',
        theme: 'violet',
      },
      {
        id: uid(),
        title: 'همین حالا شروع کن!',
        body: 'با اسپانسری سان‌جاب\nاز منوی استارت اپ‌ها را باز کن\nو سطل اسباب‌بازی‌های تازه‌ات را پر کن 🎉',
        theme: 'teal',
      },
    ],
  }
}

function loadDeck(): Deck {
  try {
    if (typeof window !== 'undefined') {
      const raw = window.localStorage.getItem(LS_KEY)
      if (raw) {
        const p = JSON.parse(raw) as Deck
        if (Array.isArray(p.slides) && p.slides.length > 0) {
          return {
            title: String(p.title ?? 'ارائه بدون نام'),
            slides: p.slides.map((s) => ({
              id: typeof s.id === 'string' ? s.id : uid(),
              title: String(s.title ?? ''),
              body: String(s.body ?? ''),
              theme: themeOf(String(s.theme ?? 'sunset')).id,
            })),
          }
        }
      }
    }
  } catch { /* داده خراب؛ از نو شروع می‌کنیم */ }
  return sampleDeck()
}

/* ------------------------------ بوم اسلاید ------------------------------ */

type Variant = 'mini' | 'preview' | 'stage' | 'export'

function SlideBody({ slide, variant }: { slide: Slide; variant: Exclude<Variant, 'mini'> }) {
  const th = themeOf(slide.theme)
  const lines = parseLines(slide.body)
  const S = {
    preview: { pad: 'p-4', title: 'text-base sm:text-lg', body: 'text-[10px] sm:text-xs', gap: 'mt-2' },
    stage: { pad: 'p-10 md:p-14', title: 'text-4xl md:text-5xl', body: 'text-lg md:text-xl', gap: 'mt-6' },
    export: { pad: 'p-14', title: 'text-[44px]', body: 'text-[22px]', gap: 'mt-8' },
  }[variant]
  return (
    <div className={`flex h-full w-full flex-col ${S.pad}`} style={{ background: th.css }}>
      <h2 className={`${S.title} font-black leading-tight text-white drop-shadow-md`}>
        {slide.title || 'بدون عنوان'}
      </h2>
      <div className={`${S.gap} flex-1 overflow-hidden ${S.body} leading-relaxed text-white/90`}>
        {lines.map((l, i) =>
          l.bullet ? (
            <div key={i} className="flex items-start gap-2">
              <span className="mt-[0.35em] h-1.5 w-1.5 shrink-0 rounded-full bg-white/80" />
              <span>{l.text}</span>
            </div>
          ) : (
            <p key={i}>{l.text}</p>
          ),
        )}
      </div>
      <div className="text-[9px] font-medium tracking-wide text-white/50">سان‌جاب‌او‌اس</div>
    </div>
  )
}

function SlideMini({ slide }: { slide: Slide }) {
  const th = themeOf(slide.theme)
  return (
    <div className="flex aspect-video w-full flex-col justify-between overflow-hidden rounded-md p-1.5" style={{ background: th.css }}>
      <div className="truncate text-[8px] font-black text-white">{slide.title || 'بدون عنوان'}</div>
      <div className="truncate text-[6px] text-white/80">{parseLines(slide.body)[0]?.text ?? ''}</div>
    </div>
  )
}

/* ------------------------------- کامپوننت ------------------------------- */

export default function SlidesApp() {
  const pushToast = useOS((s) => s.pushToast)
  const [deck, setDeck] = useState<Deck>(loadDeck)
  const [sel, setSel] = useState(0)
  const [confirmDel, setConfirmDel] = useState(false)
  const [presenting, setPresenting] = useState(false)
  const [exporting, setExporting] = useState(false)

  const fileRef = useRef<HTMLInputElement>(null)
  const exportRef = useRef<HTMLDivElement>(null)

  const at = Math.min(sel, deck.slides.length - 1)
  const cur = deck.slides[at]

  /* ذخیره خودکار با تاخیر ۴۰۰ میلی‌ثانیه */
  useEffect(() => {
    const t = window.setTimeout(() => {
      try { window.localStorage.setItem(LS_KEY, JSON.stringify(deck)) } catch { /* پر شد؛ غصه نخور */ }
    }, 400)
    return () => window.clearTimeout(t)
  }, [deck])

  useEffect(() => {
    if (!confirmDel) return
    const t = window.setTimeout(() => setConfirmDel(false), 3000)
    return () => window.clearTimeout(t)
  }, [confirmDel])

  const go = (dir: -1 | 1) =>
    setSel((i) => Math.min(deck.slides.length - 1, Math.max(0, Math.min(i, deck.slides.length - 1) + dir)))

  /* میان‌برهای حالت نمایش */
  useEffect(() => {
    if (!presenting) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setPresenting(false); return }
      if (e.key === 'ArrowLeft' || e.key === ' ' || e.key === 'Enter' || e.key === 'PageDown') {
        e.preventDefault()
        go(1)
      } else if (e.key === 'ArrowRight' || e.key === 'PageUp' || e.key === 'Backspace') {
        e.preventDefault()
        go(-1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [presenting, deck.slides.length])

  /* ------------------------------ عملیات اسلاید ------------------------------ */

  const addSlide = () => {
    setDeck((d) => {
      const slides = [...d.slides]
      slides.splice(at + 1, 0, { id: uid(), title: 'اسلاید تازه', body: '', theme: slides[at].theme })
      return { ...d, slides }
    })
    setSel(at + 1)
  }

  const dupSlide = () => {
    setDeck((d) => {
      const slides = [...d.slides]
      slides.splice(at + 1, 0, { ...slides[at], id: uid() })
      return { ...d, slides }
    })
    setSel(at + 1)
    pushToast({ icon: '📄', title: 'تکثیر شد', body: 'یک کپی از اسلاید ساخته شد.' })
  }

  const delSlide = () => {
    setConfirmDel(false)
    if (deck.slides.length <= 1) {
      pushToast({ icon: '⚠️', title: 'ممکن نیست', body: 'حداقل یک اسلاید باید باقی بماند.' })
      return
    }
    setDeck((d) => ({ ...d, slides: d.slides.filter((_, i) => i !== at) }))
    setSel(Math.max(0, at - 1))
  }

  const moveSlide = (dir: -1 | 1) => {
    const to = at + dir
    if (to < 0 || to >= deck.slides.length) return
    setDeck((d) => {
      const slides = [...d.slides]
      ;[slides[at], slides[to]] = [slides[to], slides[at]]
      return { ...d, slides }
    })
    setSel(to)
  }

  const patchSlide = (patch: Partial<Slide>) =>
    setDeck((d) => ({ ...d, slides: d.slides.map((s, i) => (i === at ? { ...s, ...patch } : s)) }))

  /* ------------------------------ خروجی / ورودی ------------------------------ */

  const download = (data: string, name: string, type: string) => {
    const url = URL.createObjectURL(new Blob([data], { type }))
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportJson = () => {
    download(JSON.stringify(deck, null, 2), `${deck.title || 'deck'}.json`, 'application/json')
    pushToast({ icon: '✅', title: 'خروجی JSON', body: 'فایل ارائه ذخیره شد.' })
  }

  const importJson = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const p = JSON.parse(String(reader.result)) as Deck
        if (!Array.isArray(p.slides) || p.slides.length === 0) throw new Error('bad')
        setDeck({
          title: String(p.title ?? 'ارائه بدون نام'),
          slides: p.slides.map((s) => ({
            id: typeof s.id === 'string' ? s.id : uid(),
            title: String(s.title ?? ''),
            body: String(s.body ?? ''),
            theme: themeOf(String(s.theme ?? 'sunset')).id,
          })),
        })
        setSel(0)
        pushToast({ icon: '📥', title: 'ورود JSON', body: 'ارائه با موفقیت بارگذاری شد.' })
      } catch {
        pushToast({ icon: '⚠️', title: 'خطا', body: 'فایل JSON معتبر نیست.' })
      }
    }
    reader.readAsText(file)
  }

  const exportPdf = async () => {
    if (exporting) return
    setExporting(true)
    await new Promise((r) => window.setTimeout(r, 150))
    try {
      const host = exportRef.current
      if (!host) return
      const nodes = Array.from(host.querySelectorAll<HTMLElement>('[data-slide]'))
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [960, 540] })
      for (let i = 0; i < nodes.length; i++) {
        const canvas = await html2canvas(nodes[i], { scale: 2, logging: false })
        if (i > 0) pdf.addPage([960, 540], 'landscape')
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 960, 540)
      }
      pdf.save(`${deck.title || 'deck'}.pdf`)
      pushToast({ icon: '📄', title: 'خروجی PDF', body: `${fa(deck.slides.length)} اسلاید ذخیره شد.` })
    } catch {
      pushToast({ icon: '⚠️', title: 'خطا', body: 'ساخت PDF ناموفق بود.' })
    } finally {
      setExporting(false)
    }
  }

  /* -------------------------------- رندر -------------------------------- */

  return (
    <div dir="rtl" className="flex h-full w-full overflow-hidden bg-zinc-900/50 text-xs text-zinc-100">
      {/* نوار اسلایدها (سمت راست) */}
      <div className="flex w-40 shrink-0 flex-col gap-1.5 border-l border-white/10 p-2">
        <div className="os-scroll flex-1 space-y-1.5 overflow-y-auto">
          {deck.slides.map((s, i) => (
            <button key={s.id} onClick={() => setSel(i)}
              className={`relative block w-full rounded-lg p-0.5 text-right transition ${i === at ? 'ring-2 ring-orange-400' : 'ring-1 ring-white/10 hover:ring-white/30'}`}>
              <SlideMini slide={s} />
              <span className="absolute right-1.5 top-1.5 rounded bg-black/50 px-1 text-[8px] text-white">{fa(i + 1)}</span>
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-1 border-t border-white/10 pt-1.5">
          <Button variant="ghost" size="icon" className="h-7 w-7" title="اسلاید جدید" onClick={addSlide}>
            <Plus className="h-3.5 w-3.5 text-teal-300" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" title="تکثیر اسلاید" onClick={dupSlide}>
            <Copy className="h-3.5 w-3.5 text-violet-300" />
          </Button>
          <Button variant={confirmDel ? 'destructive' : 'ghost'} size="icon" className="h-7 w-7"
            title={confirmDel ? 'برای حذف دوباره بزن' : 'حذف اسلاید'}
            onClick={() => (confirmDel ? delSlide() : setConfirmDel(true))}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" title="انتقال به بالا" onClick={() => moveSlide(-1)}>
            <ArrowUp className="h-3.5 w-3.5 text-zinc-400" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" title="انتقال به پایین" onClick={() => moveSlide(1)}>
            <ArrowDown className="h-3.5 w-3.5 text-zinc-400" />
          </Button>
        </div>
      </div>

      {/* ویرایشگر (سمت چپ) */}
      <div className="os-scroll flex min-w-0 flex-1 flex-col gap-2 overflow-y-auto p-3">
        <div className="flex items-center gap-2">
          <Input value={deck.title} onChange={(e) => setDeck((d) => ({ ...d, title: e.target.value }))}
            placeholder="عنوان ارائه" className="h-8 flex-1 border-white/10 bg-zinc-900/60 text-sm font-bold" />
          <Button size="sm" className="h-8 gap-1.5 bg-gradient-to-l from-orange-500 to-amber-400 text-xs font-bold text-zinc-900 hover:opacity-90"
            onClick={() => setPresenting(true)}>
            <Play className="h-3.5 w-3.5" />
            نمایش
          </Button>
        </div>
        <Input value={cur.title} onChange={(e) => patchSlide({ title: e.target.value })}
          placeholder="عنوان اسلاید" className="h-10 border-white/10 bg-zinc-900/60 text-lg font-extrabold" />
        <Textarea value={cur.body} onChange={(e) => patchSlide({ body: e.target.value })}
          placeholder={'هر خط یک مورد…\nخطوطی که با «- » شروع شوند بولت می‌شوند'}
          className="min-h-24 flex-1 resize-none border-white/10 bg-zinc-900/60 leading-6" />
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] text-zinc-500">تم اسلاید:</span>
          {THEMES.map((t) => (
            <button key={t.id} title={t.label} onClick={() => patchSlide({ theme: t.id })}
              className={`h-6 w-9 rounded-md transition ${cur.theme === t.id ? 'ring-2 ring-white' : 'ring-1 ring-white/20 hover:ring-white/50'}`}
              style={{ background: t.css }} />
          ))}
          <div className="ms-auto flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-[10px] text-zinc-400" onClick={exportJson}>
              <Download className="h-3 w-3" /> JSON
            </Button>
            <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-[10px] text-zinc-400" onClick={() => fileRef.current?.click()}>
              <Upload className="h-3 w-3" /> JSON
            </Button>
            <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-[10px] text-rose-300" onClick={exportPdf} disabled={exporting}>
              <FileText className="h-3 w-3" /> {exporting ? 'در حال ساخت…' : 'PDF'}
            </Button>
          </div>
        </div>
        {/* پیش‌نمایش زنده */}
        <div className="mx-auto aspect-video w-full max-w-md overflow-hidden rounded-xl border border-white/10 shadow-lg">
          <SlideBody slide={cur} variant="preview" />
        </div>
      </div>

      <input ref={fileRef} type="file" accept=".json,application/json" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) importJson(f); e.target.value = '' }} />

      {/* بوم مخدید خروجی PDF (۹۶۰×۵۴۰) */}
      <div ref={exportRef} aria-hidden className="pointer-events-none fixed -left-[9999px] top-0">
        {exporting &&
          deck.slides.map((s) => (
            <div key={s.id} data-slide className="h-[540px] w-[960px] overflow-hidden">
              <SlideBody slide={s} variant="export" />
            </div>
          ))}
      </div>

      {/* حالت نمایش تمام‌صفحه */}
      {presenting && (
        <div dir="rtl" className="fixed inset-0 z-[9999] flex flex-col bg-black/95">
          <button title="خروج (Esc)" onClick={() => setPresenting(false)}
            className="absolute left-3 top-3 z-10 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20">
            <X className="h-5 w-5" />
          </button>
          <div
            className="flex flex-1 items-center justify-center p-4"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const ratio = (e.clientX - rect.left) / rect.width
              if (ratio < 0.5) go(1)
              else go(-1)
            }}>
            <div className="aspect-video w-full max-w-[calc((100vh_-_7rem)*16/9)] overflow-hidden rounded-lg shadow-2xl">
              <SlideBody slide={cur} variant="stage" />
            </div>
          </div>
          <div className="flex items-center justify-center gap-3 pb-4">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" title="قبلی" onClick={() => go(-1)}>
              <ChevronRight className="h-5 w-5" />
            </Button>
            <span className="rounded-full bg-white/10 px-4 py-1 text-xs font-bold text-white">
              {fa(at + 1)} / {fa(deck.slides.length)}
            </span>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" title="بعدی" onClick={() => go(1)}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
