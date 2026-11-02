'use client'

import { useEffect, useRef, useState } from 'react'
import { useOS } from '@/lib/os/store'

interface Tip {
  q: string
  a: string
}

const TIPS: Tip[] = [
  { q: 'ترمینال چیه؟', a: 'ترمینال یعنی حرف زدن مستقیم با سیستم! بنویس: help' },
  { q: 'غلط تایپ زدم!', a: 'اشکال نداره — ترمینال ما غلط‌های ساده رو خودش اصلاح می‌کنه. مثلاً بنویس lss تا ببینی!' },
  { q: 'چطور یاد بگیرم؟', a: 'توی ترمینال بنویس: learn start — ۱۴ ماموریت بامزه منتظرته.' },
  { q: 'دستیار هوشمند؟', a: 'توی ترمینال بنویس: ask چطور فایل بسازم؟ — خودم هم گاهی ازش می‌پرسم.' },
  { q: 'کار پینگ چیه؟', a: 'ping یعنی «بیداری؟» به سرور. سرور جواب می‌ده: «بیدارم، وقت خوابه».' },
  { q: 'مخفی‌کاری!', a: 'توی خانه یه فایل به اسم .secret هست. با ls -la پیداش کن!' },
  { q: 'خسته شدم', a: 'توی ترمینال بنویس matrix یا sl — قطار پنگوئنی از رد می‌شه!' },
  { q: 'حافظه', a: 'توی ترمینال free بزن. رم ما همیشه خالیه چون خوابیم.' },
]

/** پت پنگوئن متحرک: روی میزکار قدم می‌زند و با کلیک نکته می‌دهد */
export default function TuxPet() {
  const funMode = useOS((s) => s.settings.funMode)
  const [pos, setPos] = useState({ x: 80, dir: -1 as -1 | 1 })
  const [bubble, setBubble] = useState<Tip | null>(null)
  const [paused, setPaused] = useState(false)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // قدم زدن آرام
  useEffect(() => {
    if (!funMode || paused) return
    const iv = setInterval(() => {
      setPos((p) => {
        const vw = window.innerWidth
        let x = p.x + p.dir * 1.2
        let dir = p.dir
        if (x < 24) {
          x = 24
          dir = 1
        }
        if (x > vw - 90) {
          x = vw - 90
          dir = -1
        }
        return { x, dir }
      })
    }, 40)
    return () => clearInterval(iv)
  }, [funMode, paused])

  // جابجایی تصادفی حالت مکث
  useEffect(() => {
    if (!funMode) return
    const iv = setInterval(() => {
      setPaused((p) => {
        if (!p && Math.random() < 0.18) return true
        if (p && Math.random() < 0.5) return false
        return p
      })
    }, 2600)
    return () => clearInterval(iv)
  }, [funMode])

  if (!funMode) return null

  const onClick = () => {
    const tip = TIPS[Math.floor(Math.random() * TIPS.length)]
    setBubble(tip)
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setBubble(null), 5200)
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="pengo-noselect absolute bottom-12 z-[4] cursor-pointer"
      style={{
        left: pos.x,
        transform: `scaleX(${pos.dir === 1 ? 1 : -1})`,
        transition: 'none',
      }}
      aria-label="پنگوئن خانگی — کلیک کن تا نکته بدهد"
      title="پنگوئن خانگی"
    >
      {/* حباب گفتار */}
      {bubble && (
        <div
          className="pengo-pop absolute bottom-full mb-2 w-52 rounded-xl border border-white/15 bg-zinc-900/95 p-2.5 text-right shadow-2xl backdrop-blur"
          style={{ transform: 'scaleX(1)', right: 'auto', left: '50%', translate: '-50% 0' }}
          dir="rtl"
        >
          <div className="text-[11px] font-black text-[var(--pengo-accent)]">
            {bubble.q}
          </div>
          <div className="mt-0.5 text-[11px] leading-5 text-zinc-300">
            {bubble.a}
          </div>
          <span
            className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-l border-white/15 bg-zinc-900/95"
            aria-hidden
          />
        </div>
      )}
      {/* پنگوئن SVG */}
      <svg
        width="46"
        height="54"
        viewBox="0 0 46 54"
        className={`drop-shadow-[0_3px_6px_rgba(0,0,0,0.5)] ${paused ? '' : 'pengo-bob'}`}
        aria-hidden
      >
        {/* بدن */}
        <ellipse cx="23" cy="32" rx="17" ry="21" fill="#1c1917" />
        <ellipse cx="23" cy="36" rx="12" ry="15" fill="#fafafa" />
        {/* سر داخل بدن یکپارچه است */}
        <circle cx="23" cy="15" r="0" />
        {/* چشم‌ها */}
        <circle cx="17.5" cy="14" r="2.4" fill="#0a0a0a" />
        <circle cx="28.5" cy="14" r="2.4" fill="#0a0a0a" />
        <circle cx="18.3" cy="13.2" r="0.8" fill="#fff" />
        <circle cx="29.3" cy="13.2" r="0.8" fill="#fff" />
        {/* منقار */}
        <path d="M20 19 Q23 23 26 19 Q23 21.5 20 19 Z" fill="#f59e0b" />
        {/* بال‌ها */}
        <ellipse cx="7" cy="34" rx="3.5" ry="9" fill="#0c0a09" className="pengo-flip-left" />
        <ellipse cx="39" cy="34" rx="3.5" ry="9" fill="#0c0a09" className="pengo-flip-right" />
        {/* پاها */}
        <path d="M15 52 L13 54 L19 54 Z" fill="#f59e0b" />
        <path d="M31 52 L29 54 L35 54 Z" fill="#f59e0b" />
      </svg>
    </button>
  )
}
