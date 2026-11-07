'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  BookOpenCheck,
  Bot,
  ChevronLeft,
  ChevronRight,
  Gamepad2,
  GraduationCap,
  LayoutGrid,
  MousePointerClick,
  PanelBottom,
  PartyPopper,
  Rocket,
  Sparkles,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useOS } from '@/lib/os/store'

/* ------------------------------------------------------------------ */
/*  تور خوش‌آمدگویی سان‌جاب‌اواس — فقط بار اول بعد از بوت اجرا می‌شود  */
/* ------------------------------------------------------------------ */

interface TourStep {
  id: string
  /** سلکتور المنت هدف برای اسپات‌لایت — خالی یعنی کارت وسط صفحه */
  sel?: string
  icon: LucideIcon
  title: string
  body: string
  /** آیتم‌های کوچک برای نمایش به‌شکل چیپ */
  chips?: string[]
}

const STEPS: TourStep[] = [
  {
    id: 'welcome',
    icon: Sparkles,
    title: 'به سان‌جاب‌اواس خوش اومدی!',
    body: 'یه سیستم‌عامل کامل، همین‌جا توی مرورگرت: ترمینال، آکادمی برنامه‌نویسی، آفیس، هوش مصنوعی و کلی بازی. بیا یه دور بزنیم تا دستت راه بیفته — دو دقیقه بیشتر طول نمی‌کشه.',
  },
  {
    id: 'icons',
    sel: '[data-tour="icons"]',
    icon: LayoutGrid,
    title: 'آیکن‌های میزکار',
    body: 'برنامه‌های پرکاربرد همین‌جان. روی هرکدوم کلیک کنی، پنجره‌اش باز می‌شه — مثل یه سیستم‌عامل واقعی.',
  },
  {
    id: 'rightclick',
    icon: MousePointerClick,
    title: 'راست‌کلیکِ جادویی',
    body: 'روی خالیِ میزکار راست‌کلیک کن: کاغذدیواری عوض می‌شه، آیکن‌ها قاطی می‌شن، صفحه قفل می‌شه و یه گزینهٔ «یه خبر خوب بهم بده» هم داریم که واقعاً خبر خوب می‌ده.',
  },
  {
    id: 'start',
    sel: '[data-tour="start"]',
    icon: LayoutGrid,
    title: 'منوی شروع',
    body: 'همهٔ برنامه‌ها اینجاست: آکادمی‌ها، نویسا، کداستودیو، بازی‌ها و… الان خودم بازش کردم — نگاه کن! هر وقت خواستی ببندی، بیرونش یا Escape بزن.',
  },
  {
    id: 'taskbar',
    sel: '[data-tour="taskbar"]',
    icon: PanelBottom,
    title: 'نوار وظیفه',
    body: 'پنجره‌های باز همین‌پایین صف می‌شن. صدا، وای‌فای، باتری و ساعت هم سمت دیگه‌شه. اون خط باریکِ آخر هم همهٔ پنجره‌ها رو یه‌جا جمع می‌کنه.',
  },
  {
    id: 'academy',
    icon: GraduationCap,
    title: 'آکادمی سان‌جاب',
    body: 'درس‌های تصویری با خوانندهٔ مخصوص مطالعه، تمرین تعاملی و آزمون — از ترمینال لینوکس تا پایتون، رست و هوش مصنوعی. اگه دوس داری یاد بگیری، اینجا خونه‌ته.',
    chips: ['آکادمی لینوکس', 'پایتون', 'رست', 'هوش مصنوعی'],
  },
  {
    id: 'fun',
    icon: Gamepad2,
    title: 'هوش‌یار و سرگرمی',
    body: 'هوش‌یار، دستیار هوش مصنوعی سیستمه — سؤال بپرس، ایده بگیر، کمک بگیر. بعدش هم یه دسته بازی داریم (مار، مین‌روب، ۲۰۴۸ و…) که حق داری استراحت کنی!',
  },
  {
    id: 'done',
    icon: PartyPopper,
    title: 'همه‌چیز آماده‌ست!',
    body: 'هر چیزی هم قابل شخصی‌سازیه: فونت، اندازهٔ متن، کاغذدیواری و… توی «تنظیمات». اگه جایی گم شدی، از تنظیمات ← دربارهٔ سیستم می‌تونی این تور رو دوباره ببینی.',
  },
]

const PAD = 10

export default function WelcomeTour() {
  const setSetting = useOS((s) => s.setSetting)
  const pushToast = useOS((s) => s.pushToast)

  const [i, setI] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const [cardH, setCardH] = useState(200)
  const cardRef = useRef<HTMLDivElement>(null)

  const step = STEPS[i]
  const last = i === STEPS.length - 1
  const targeted = Boolean(step.sel)

  /* ---- اندازه‌گیری هدف اسپات‌لایت ---- */
  const measure = useCallback(() => {
    if (!step.sel) {
      setRect(null)
      return
    }
    const el = document.querySelector(step.sel)
    setRect(el ? el.getBoundingClientRect() : null)
  }, [step.sel])

  useLayoutEffect(() => {
    /* اندازه‌گیری بعد از پینت انجام می‌شود تا setState همگام در اثر رخ ندهد */
    const raf = requestAnimationFrame(() => {
      measure()
      if (cardRef.current) setCardH(cardRef.current.offsetHeight)
    })
    return () => cancelAnimationFrame(raf)
  }, [measure, i])

  useEffect(() => {
    const onResize = () => measure()
    window.addEventListener('resize', onResize)
    /* بعد از انیمیشن‌ها هم یک بار دیگر اندازه بگیر */
    const t1 = setTimeout(measure, 450)
    const t2 = setTimeout(measure, 1100)
    return () => {
      window.removeEventListener('resize', onResize)
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [measure, i])

  /* ---- مرحلهٔ «منوی شروع»: خود منو را باز کن، بعد از مرحله ببند ---- */
  useEffect(() => {
    if (step.id === 'start') {
      const t = setTimeout(() => {
        if (!useOS.getState().startOpen) useOS.getState().toggleStart(true)
      }, 300)
      return () => clearTimeout(t)
    }
    if (useOS.getState().startOpen) useOS.getState().toggleStart(false)
  }, [step.id])

  const finish = useCallback(() => {
    if (useOS.getState().startOpen) useOS.getState().toggleStart(false)
    setSetting('tourDone', true)
    pushToast({
      icon: BookOpenCheck,
      title: 'خوش اومدی!',
      body: 'هر وقت خواستی تور رو دوباره ببینی: تنظیمات ← دربارهٔ سیستم ← «دیدن دوبارهٔ تور».',
    })
  }, [setSetting, pushToast])

  const next = useCallback(() => {
    if (last) finish()
    else setI((v) => Math.min(v + 1, STEPS.length - 1))
  }, [last, finish])

  const prev = () => setI((v) => Math.max(v - 1, 0))

  /* ---- کیبورد: Enter بعدی، Escape خروج ---- */
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        next()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        finish()
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [next, finish])

  /* ---- جای کارت نسبت به هدف ---- */
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1024
  const vh = typeof window !== 'undefined' ? window.innerHeight : 768
  const mobile = vw < 640
  const cardW = Math.min(350, vw - 24)

  let cardStyle: React.CSSProperties
  if (!targeted || !rect) {
    /* کارت وسط صفحه */
    cardStyle = {
      width: cardW,
      left: Math.max(12, (vw - cardW) / 2),
      top: Math.max(12, (vh - cardH) / 2 - 10),
    }
  } else if (mobile) {
    /* موبایل: کارت پایین صفحه، بالای نوار وظیفه */
    cardStyle = {
      width: cardW,
      left: 12,
      bottom: 64,
    }
  } else {
    const below = rect.bottom + 14
    const above = rect.top - 14 - cardH
    const top = below + cardH + 12 < vh ? below : Math.max(12, above)
    const left = Math.min(
      Math.max(12, rect.left + rect.width / 2 - cardW / 2),
      vw - cardW - 12,
    )
    cardStyle = { width: cardW, left, top }
  }

  const hl = rect
    ? {
        left: Math.max(0, rect.left - PAD),
        top: Math.max(0, rect.top - PAD),
        width: rect.width + PAD * 2,
        height: rect.height + PAD * 2,
      }
    : null

  const Icon = step.icon

  return (
    <div
      className="pengo-fadein fixed inset-0 z-[9400]"
      role="dialog"
      aria-modal="true"
      aria-label="تور خوش‌آمدگویی سان‌جاب‌اواس"
    >
      {/* لایهٔ تاریک با سوراخ اسپات‌لایت */}
      <div
        className="absolute inset-0 transition-all duration-300"
        style={{
          background: 'rgba(2, 4, 8, 0.62)',
          backdropFilter: 'blur(1.5px)',
        }}
        onClick={next}
        aria-hidden
      />
      {hl && (
        <div
          className="pengo-spotlight pointer-events-none absolute rounded-2xl transition-all duration-300"
          style={{
            ...hl,
            boxShadow: '0 0 0 3px rgba(247,147,30,0.85), 0 0 34px rgba(247,147,30,0.4), 0 0 0 9999px rgba(2,4,8,0.66)',
            background: 'rgba(247,147,30,0.06)',
          }}
          aria-hidden
        />
      )}

      {/* کارت راهنما */}
      <div
        ref={cardRef}
        className="pengo-pop absolute overflow-hidden rounded-2xl border border-white/15 bg-zinc-900/95 shadow-2xl shadow-black/60 backdrop-blur-xl"
        style={cardStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {/* نوار رنگی برند */}
        <div
          className="h-1.5 w-full"
          style={{
            background:
              'linear-gradient(to left, #f7931e, #8b5cf6, #f7931e)',
          }}
          aria-hidden
        />

        <div className="p-5">
          {/* رد کردن */}
          <button
            onClick={finish}
            className="absolute left-3 top-4 grid h-7 w-7 place-items-center rounded-lg text-zinc-500 transition hover:bg-white/10 hover:text-zinc-200"
            title="رد کردن تور"
            aria-label="رد کردن تور"
          >
            <X size={15} />
          </button>

          <div className="flex items-start gap-3">
            <span
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/10"
              style={{ background: 'rgba(247,147,30,0.15)' }}
              aria-hidden
            >
              <Icon size={22} className="text-[#f7931e]" />
            </span>
            <div className="min-w-0">
              <h2 className="text-[15px] font-black leading-6 text-zinc-50">
                {step.title}
              </h2>
              <p className="mt-1.5 text-[12.5px] leading-6 text-zinc-300">
                {step.body}
              </p>
            </div>
          </div>

          {step.chips && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {step.chips.map((c) => (
                <span
                  key={c}
                  className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-zinc-200"
                >
                  {c}
                </span>
              ))}
            </div>
          )}

          {/* اسپانسر */}
          {step.id === 'welcome' && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2">
              <img
                src="/brand/sunjob-logo.webp"
                alt="لوگوی سان‌جاب"
                className="h-5 w-5 rounded-sm bg-white object-contain"
              />
              <span className="text-[10.5px] font-bold text-zinc-400">
                با اسپانسری سان‌جاب — sunjob.ir
              </span>
            </div>
          )}

          {/* ناوبری */}
          <div className="mt-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5" aria-hidden>
              {STEPS.map((s, idx) => (
                <span
                  key={s.id}
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: idx === i ? 18 : 6,
                    background:
                      idx === i ? '#f7931e' : 'rgba(255,255,255,0.22)',
                  }}
                />
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              {i > 0 && (
                <button
                  onClick={prev}
                  className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-zinc-400 transition hover:bg-white/10 hover:text-zinc-100"
                >
                  <ChevronRight size={14} aria-hidden />
                  قبلی
                </button>
              )}
              <button
                onClick={next}
                className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-black text-zinc-950 transition hover:brightness-110 active:scale-95"
                style={{ background: '#f7931e' }}
              >
                {last ? (
                  <>
                    بزن بریم!
                    <Rocket size={14} aria-hidden />
                  </>
                ) : (
                  <>
                    بعدی
                    <ChevronLeft size={14} aria-hidden />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
