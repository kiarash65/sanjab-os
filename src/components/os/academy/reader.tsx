'use client'

/* ================================================================
   Learning Reader، خواننده استاندارد آموزش‌های سان‌جاب‌اواس
   ویژگی‌ها:
   - عرض مطالعه و تایپوگرافی از توکن‌های سراسری (CSS Variables)
   - فهرست مطالب با هایلایت بخش فعال (Scroll-Spy)
   - نوار پیشرفت داخل درس
   - بازگشت به آخرین نقطه مطالعه (per-reader localStorage)
   - حالت فوکوس / مطالعه (پنهان‌سازی عناصر غیرضروری)
   - کنترل سریع اندازه قلم (A- / A+) روی همان تنظیمات سراسری
   - ردیابی زمان مطالعه امروز (برای هدف روزانه)
   - RTL کامل + جداسازی اصطلاحات انگلیسی
   ================================================================ */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  AlertTriangle,
  BookOpenCheck,
  ChevronDown,
  Eye,
  EyeOff,
  Flame,
  Info,
  Lightbulb,
  ListTree,
  Minus,
  Plus,
  Sparkles,
} from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { useOS } from '@/lib/os/store'
import {
  FONT_SIZE_LIMITS,
  READING_WIDTH_PRESETS,
} from '@/lib/os/typography'
import { addReadingSeconds, todayReadingSeconds } from '@/lib/os/settings-io'

/* ---------------- بلوک‌های محتوایی مشترک ---------------- */

export type CalloutKind = 'note' | 'warn' | 'tip' | 'example'

const CALLOUT_META: Record<
  CalloutKind,
  { cls: string; label: string; Icon: typeof Info }
> = {
  note: { cls: 'callout-note', label: 'نکته', Icon: Info },
  warn: { cls: 'callout-warn', label: 'هشدار', Icon: AlertTriangle },
  tip: { cls: 'callout-tip', label: 'ترفند', Icon: Lightbulb },
  example: { cls: 'callout-example', label: 'مثال', Icon: Sparkles },
}

export function Callout({
  kind = 'note',
  title,
  children,
}: {
  kind?: CalloutKind
  title?: string
  children: ReactNode
}) {
  const { cls, label, Icon } = CALLOUT_META[kind]
  return (
    <div className={`callout ${cls}`} role="note">
      <p className="callout-title">
        <Icon size={15} aria-hidden />
        {title ?? label}
      </p>
      {children}
    </div>
  )
}

/** بلوک کد استاندارد خواننده، همیشه LTR، با فونت کد قابل‌تنظیم */
export function ReaderCode({ code, label }: { code: string; label?: string }) {
  return (
    <figure className="my-[var(--fa-paragraph-gap)]">
      {label && (
        <figcaption className="mb-1 flex items-center gap-1.5 text-[11px] font-bold text-zinc-500">
          <BookOpenCheck size={12} aria-hidden />
          {label}
        </figcaption>
      )}
      <pre className="prose-pre" dir="ltr">
        <code>{code}</code>
      </pre>
    </figure>
  )
}

/* ---------------- پوسته ساده مطالعه ---------------- */

/** عرض استاندارد + تایپوگرافی مطالعه، برای درون‌پیچی محتوای درس‌ها */
export function ReadingShell({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`reading-shell prose-fa ${className}`}>{children}</div>
  )
}

/* ---------------- نوار پیشرفت چسبان برای اسکرول‌های موجود ---------------- */

/** برای mainهایی که خودشان اسکرول دارند، یک خط اضافه می‌کند */
export function ReadProgress({
  targetRef,
  accent,
}: {
  targetRef: React.RefObject<HTMLElement | null>
  accent?: string
}) {
  const [pct, setPct] = useState(0)
  useEffect(() => {
    const el = targetRef.current
    if (!el) return
    const onScroll = () => {
      const max = el.scrollHeight - el.clientHeight
      setPct(max > 40 ? Math.min(100, Math.round((el.scrollTop / max) * 100)) : 0)
    }
    onScroll()
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [targetRef])
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[3px] bg-white/5"
      aria-hidden
    >
      <div
        className="h-full transition-[width] duration-150"
        style={{ width: `${pct}%`, background: accent ?? 'var(--pengo-accent, #f7931e)' }}
      />
    </div>
  )
}

/* ---------------- یادآور آخرین بخش مطالعه ---------------- */

const VIEW_KEY = (id: string) => `sunjob-reader-view:${id}`

export function rememberView(readerId: string, viewId: string): void {
  try {
    localStorage.setItem(VIEW_KEY(readerId), viewId)
  } catch {
    /* ignore */
  }
}

export function lastView(readerId: string): string | null {
  try {
    return localStorage.getItem(VIEW_KEY(readerId))
  } catch {
    return null
  }
}

/* ---------------- خواننده کامل ---------------- */

export interface ReaderSection {
  id: string
  title: string
  content: ReactNode
}

interface LearningReaderProps {
  /** شناسه یکتا برای ذخیره آخرین نقطه مطالعه، مثل linux:boot */
  readerId: string
  sections: ReaderSection[]
  /** محتوای اختیاری بعد از بخش‌ها (مثلاً جمع‌بندی) */
  footer?: ReactNode
  accent?: string
  /** عنوان درس، در نوار بالای خواننده نمایش داده می‌شود */
  title?: string
}

const POS_KEY = (id: string) => `sunjob-reader-pos:${id}`

interface ReaderPos {
  sectionId: string
  offset: number
  at: number
}

export default function LearningReader({
  readerId,
  sections,
  footer,
  accent,
  title,
}: LearningReaderProps) {
  const settings = useOS((s) => s.settings)
  const setSetting = useOS((s) => s.setSetting)
  const scrollRef = useRef<HTMLDivElement>(null)
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map())

  const [activeId, setActiveId] = useState(sections[0]?.id ?? '')
  const [pct, setPct] = useState(0)
  const [focusMode, setFocusMode] = useState(false)
  const [tocOpen, setTocOpen] = useState(true)
  const [savedPos, setSavedPos] = useState<ReaderPos | null>(null)
  const [done, setDone] = useState(false)
  const todayMin = Math.floor(todayReadingSeconds() / 60)
  const goal = settings.dailyGoalMin

  const resumeTip = useMemo(
    () => (savedPos && !done ? sections.find((s) => s.id === savedPos.sectionId) : undefined),
    [savedPos, done, sections]
  )

  /* --- آخرین نقطه مطالعه: بارگذاری و ذخیره --- */
  useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        const raw = localStorage.getItem(POS_KEY(readerId))
        if (raw) setSavedPos(JSON.parse(raw) as ReaderPos)
      } catch {
        /* ignore */
      }
    }, 0)
    return () => {
      window.clearTimeout(t)
      try {
        const el = scrollRef.current
        if (!el) return
        const max = el.scrollHeight - el.clientHeight
        if (el.scrollTop > 200) {
          const active =
            [...sectionRefs.current.entries()].find(([, node]) => node.getBoundingClientRect().top > 80)?.[0] ??
            sections[sections.length - 1]?.id
          localStorage.setItem(
            POS_KEY(readerId),
            JSON.stringify({ sectionId: active, offset: el.scrollTop, at: Date.now() } satisfies ReaderPos)
          )
        }
      } catch {
        /* ignore */
      }
    }
  }, [readerId, sections])

  const resume = useCallback(() => {
    const el = scrollRef.current
    const pos = savedPos
    if (!el || !pos) return
    requestAnimationFrame(() => {
      el.scrollTop = pos.offset
    })
    setDone(true)
  }, [savedPos])

  /* --- پیشرفت اسکرول + ذخیره موقعیت + اسکرول‌اسپای --- */
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    let saveTimer = 0
    const onScroll = () => {
      const max = el.scrollHeight - el.clientHeight
      setPct(max > 40 ? Math.min(100, Math.round((el.scrollTop / max) * 100)) : 0)
      const active =
        [...sectionRefs.current.entries()].find(([, node]) => node.getBoundingClientRect().top > 100)?.[0] ??
        sections[sections.length - 1]?.id
      if (active) setActiveId(active)
      window.clearTimeout(saveTimer)
      saveTimer = window.setTimeout(() => {
        if (el.scrollTop > 200) {
          try {
            localStorage.setItem(
              POS_KEY(readerId),
              JSON.stringify({
                sectionId: activeId,
                offset: el.scrollTop,
                at: Date.now(),
              } satisfies ReaderPos)
            )
          } catch {
            /* ignore */
          }
        }
      }, 1200)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => {
      el.removeEventListener('scroll', onScroll)
      window.clearTimeout(saveTimer)
    }
  }, [readerId, sections, activeId])

  /* --- ردیابی زمان مطالعه برای هدف روزانه --- */
  useEffect(() => {
    const t = window.setInterval(() => {
      if (document.visibilityState === 'visible') addReadingSeconds(1)
    }, 1000)
    return () => window.clearInterval(t)
  }, [])

  const goTo = useCallback((id: string) => {
    const node = sectionRefs.current.get(id)
    const el = scrollRef.current
    if (node && el) {
      el.scrollTo({ top: node.offsetTop - 8, behavior: 'smooth' })
    }
  }, [])

  const jumpFontSize = (delta: number) => {
    const next = Math.min(
      FONT_SIZE_LIMITS.max,
      Math.max(FONT_SIZE_LIMITS.min, settings.fontSize + delta)
    )
    setSetting('fontSize', next)
  }

  const widthLabel = READING_WIDTH_PRESETS[settings.readingWidth]?.label ?? ''

  return (
    <div className="relative flex h-full min-h-0 flex-col" dir="rtl">
      {/* نوار ابزار خواننده */}
      <div
        className={`relative z-30 flex shrink-0 items-center gap-1 border-b border-white/10 bg-zinc-900/80 px-2 py-1.5 backdrop-blur transition-opacity ${
          focusMode ? 'opacity-30 hover:opacity-100' : ''
        }`}
      >
        <button
          type="button"
          onClick={() => setTocOpen((v) => !v)}
          className={`hidden h-7 items-center gap-1 rounded-md px-2 text-[11px] font-bold transition sm:flex ${
            tocOpen ? 'bg-white/15 text-white' : 'text-zinc-400 hover:bg-white/10'
          }`}
          title="فهرست مطالب"
          aria-label="نمایش یا پنهان‌کردن فهرست مطالب"
          aria-expanded={tocOpen}
        >
          <ListTree size={13} aria-hidden />
          فهرست
        </button>

        <div className="min-w-0 flex-1 px-1 text-center">
          <p className="truncate text-[11px] font-bold text-zinc-400">
            {title}
            {!focusMode && (
              <span className="mx-1.5 text-zinc-600" aria-hidden>
                ·
              </span>
            )}
            {!focusMode && (
              <span className="text-zinc-500">
                عرض {widthLabel} · {todayMin < goal ? `${todayMin} از ${goal} دقیقه امروز` : 'هدف روزانه کامل شد 🎉'}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-0.5" role="group" aria-label="کنترل اندازه قلم">
          <button
            type="button"
            onClick={() => jumpFontSize(-1)}
            disabled={settings.fontSize <= FONT_SIZE_LIMITS.min}
            className="grid h-7 w-7 place-items-center rounded-md text-zinc-400 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
            title="کوچک‌تر"
            aria-label="کوچک‌کردن قلم"
          >
            <Minus size={13} aria-hidden />
          </button>
          <span className="w-7 text-center text-[11px] tabular-nums text-zinc-500" dir="ltr" aria-live="polite">
            {settings.fontSize}
          </span>
          <button
            type="button"
            onClick={() => jumpFontSize(1)}
            disabled={settings.fontSize >= FONT_SIZE_LIMITS.max}
            className="grid h-7 w-7 place-items-center rounded-md text-zinc-400 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
            title="بزرگ‌تر"
            aria-label="بزرگ‌کردن قلم"
          >
            <Plus size={13} aria-hidden />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setFocusMode((v) => !v)}
          className={`grid h-7 w-7 place-items-center rounded-md transition ${
            focusMode ? 'bg-amber-400/20 text-amber-300' : 'text-zinc-400 hover:bg-white/10 hover:text-white'
          }`}
          title={focusMode ? 'خروج از حالت مطالعه' : 'حالت مطالعه (فوکوس)'}
          aria-label={focusMode ? 'خروج از حالت مطالعه' : 'ورود به حالت مطالعه'}
          aria-pressed={focusMode}
        >
          {focusMode ? <EyeOff size={14} aria-hidden /> : <Eye size={14} aria-hidden />}
        </button>
      </div>

      {/* نوار پیشرفت داخل درس */}
      <Progress
        value={pct}
        className="h-[3px] shrink-0 rounded-none bg-white/5"
        aria-label="میزان پیشرفت مطالعه این درس"
      />

      <div className="flex min-h-0 flex-1">
        {/* فهرست مطالب */}
        {tocOpen && !focusMode && (
          <nav
            aria-label="فهرست مطالب درس"
            className="reader-scroll os-scroll hidden w-44 shrink-0 overflow-y-auto border-e border-white/10 bg-zinc-950/60 p-2 sm:block"
          >
            <p className="mb-1.5 flex items-center gap-1 px-1 text-[10px] font-black text-zinc-500">
              <ChevronDown size={11} aria-hidden />
              بخش‌های درس
            </p>
            <ol className="space-y-0.5">
              {sections.map((s, i) => {
                const active = s.id === activeId
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => goTo(s.id)}
                      aria-current={active ? 'location' : undefined}
                      className={`flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-start text-[11px] leading-5 transition ${
                        active
                          ? 'bg-white/10 font-bold text-white'
                          : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                      }`}
                    >
                      <span
                        className="h-4 w-1 shrink-0 rounded-full transition-colors"
                        style={{ background: active ? accent ?? 'var(--pengo-accent, #f7931e)' : 'rgba(255,255,255,0.12)' }}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1 truncate">{s.title}</span>
                      <span className="shrink-0 text-[9px] text-zinc-600 tabular-nums" dir="ltr">
                        {i + 1}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ol>
          </nav>
        )}

        {/* بدنه مطالعه */}
        <div ref={scrollRef} className="reader-scroll os-scroll relative min-h-0 min-w-0 flex-1 overflow-y-auto">
          {/* چیپ بازگشت به آخرین نقطه */}
          {resumeTip && (
            <div className="sticky top-2 z-20 mx-auto w-fit">
              <button
                type="button"
                onClick={resume}
                className="toast-in flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/15 px-3 py-1.5 text-[11px] font-bold text-amber-200 shadow-lg shadow-black/40 backdrop-blur transition hover:bg-amber-400/25"
              >
                <Flame size={13} aria-hidden />
                ادامه از «{resumeTip.title}»
              </button>
            </div>
          )}

          <div className="reading-shell prose-fa px-4 pb-24 pt-6">
            {sections.map((s) => (
              <section
                key={s.id}
                id={`rs-${s.id}`}
                ref={(node) => {
                  if (node) sectionRefs.current.set(s.id, node)
                  else sectionRefs.current.delete(s.id)
                }}
                aria-labelledby={`rs-${s.id}-h`}
                className="scroll-mt-4"
              >
                <h2
                  id={`rs-${s.id}-h`}
                  className="flex items-center gap-2 border-b border-white/10 pb-2 text-[1.15em] font-black text-white"
                  style={accent ? { borderColor: `${accent}33` } : undefined}
                >
                  <span
                    className="h-5 w-1.5 rounded-full"
                    style={{ background: accent ?? 'var(--pengo-accent, #f7931e)' }}
                    aria-hidden
                  />
                  {s.title}
                </h2>
                <div className="mt-[var(--fa-paragraph-gap)]">{s.content}</div>
              </section>
            ))}
            {footer}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------------- کامپوننت نمایشی برای پیش‌نمایش زنده تنظیمات ---------------- */

export function TypographyPreview() {
  return (
    <div className="prose-fa rounded-xl border border-white/10 bg-zinc-950/60 p-4">
      <h3 className="mb-1 text-[1.1em] font-black text-white">این یک پیش‌نمایش زنده است</h3>
      <p>
        فارسی خوانا، آرام و زیبا، با <strong>عبارت برجسته</strong>، اصطلاح فنی{' '}
        <span className="ltr-inline">Kernel</span> و کمی عدد ۱۲۳۴۵۶ که کنار{' '}
        <span className="ltr-inline">98.6%</span> می‌نشیند.
      </p>
      <p>
        خط دوم برای دیدن <b>فاصله پاراگراف‌ها</b> و ارتفاع خط است؛ اگر اینجا راحت
        می‌خوانید، درس‌های آکادمی هم راحت خواهند بود.
      </p>
      <pre className="prose-pre" dir="ltr">
        <code>{`# این کد با فونت مونو جدا نمایش داده می‌شود
def salam(name="دنیا"):
    return f"Hello, {name}!"  # 42 + "mixed"`}</code>
      </pre>
    </div>
  )
}
