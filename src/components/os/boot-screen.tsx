'use client'

import { useEffect, useRef, useState } from 'react'

interface BootLine {
  t: string
  tag?: 'ok' | 'warn'
}

const LINES: BootLine[] = [
  { t: 'پنگوئن‌اواس ۲.۰ «کلوخک» — هسته لینوکس ۶.۹.۴-پنگویی' },
  { t: 'بیدار شدن هسته… ۵ دقیقه دیگه بابا 😴', tag: 'warn' },
  { t: 'بارگذاری درایور فلفل‌دلمه‌ای سبز', tag: 'ok' },
  { t: 'چک حافظه: ۶۵,۵۳۶ کیلوبایت «عمدتاً بی‌ضرر»', tag: 'ok' },
  { t: 'سرویس گربه‌ها (meowd) اجرا شد — میو 🐱', tag: 'ok' },
  { t: 'یخچال هوشمند در شبکه پیدا نشد 🧊', tag: 'warn' },
  { t: 'ماژول انگیزه‌ی صبحگاهی نصب نیست… رد شد', tag: 'warn' },
  { t: 'کالیبره کردن حس شوخ‌طبعی… ۱۰۰٪', tag: 'ok' },
  { t: 'بارگذاری ۲۴,۰۹۱ فونت بامزه', tag: 'ok' },
  { t: 'مونتاژ پوشه «چیزهای مهم که فراموش می‌کنیم»', tag: 'ok' },
  { t: 'آماده‌ی بالا آمدن رابط کاربری بامزه ✨', tag: 'ok' },
]

const TUX = String.raw`
    .--.
   |o_o |
   |:_/ |
  //   \ \
 (|     | )
/'\_   _/'\
\___)=(___/
`

export default function BootScreen({ onDone }: { onDone: () => void }) {
  const [n, setN] = useState(0)
  const [prog, setProg] = useState(0)
  const doneRef = useRef(false)
  const finish = useRef(onDone)

  useEffect(() => {
    finish.current = onDone
  }, [onDone])

  useEffect(() => {
    const iv = setInterval(
      () => setN((v) => Math.min(v + 1, LINES.length)),
      240
    )
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    if (n < LINES.length) return
    const start = performance.now()
    const iv = setInterval(() => {
      const p = Math.min(100, ((performance.now() - start) / 700) * 100)
      setProg(p)
      if (p >= 100 && !doneRef.current) {
        doneRef.current = true
        setTimeout(() => finish.current(), 180)
      }
    }, 30)
    return () => clearInterval(iv)
  }, [n])

  const skip = () => {
    if (!doneRef.current) {
      doneRef.current = true
      finish.current()
    }
  }

  return (
    <button
      onClick={skip}
      className="fixed inset-0 z-[9999] block cursor-pointer bg-black text-left"
      aria-label="پرش از بوت"
    >
      <div className="flex h-full w-full flex-col items-center justify-center gap-5 p-6 font-mono">
        <pre
          className="hidden text-[10px] leading-4 text-emerald-500 sm:block"
          dir="ltr"
          aria-hidden
        >
          {TUX}
        </pre>
        <h1 className="text-lg font-black text-emerald-400 sm:text-xl">
          🐧 پنگوئن‌اواس ۲.۰ «کلوخک»
        </h1>
        <div
          className="os-scroll h-64 w-full max-w-xl overflow-hidden text-[11px] leading-6 sm:text-xs"
          dir="rtl"
        >
          {LINES.slice(0, n).map((l, i) => (
            <div key={i} className="text-zinc-300">
              {l.tag === 'ok' && (
                <span className="text-emerald-400">[ <b>OK</b> ] </span>
              )}
              {l.tag === 'warn' && (
                <span className="text-amber-400">[ <b>!!</b> ] </span>
              )}
              {l.tag === undefined && (
                <span className="text-violet-400">[ .. ] </span>
              )}
              {l.t}
            </div>
          ))}
          {n >= LINES.length && (
            <div className="text-emerald-400">
              [ OK ] خوش اومدی! داری وارد می‌شی…
            </div>
          )}
        </div>
        <div className="h-1.5 w-full max-w-xl overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-emerald-500 transition-[width] duration-100"
            style={{ width: `${n >= LINES.length ? prog : (n / LINES.length) * 80}%` }}
          />
        </div>
        <p className="animate-pulse text-[11px] text-zinc-600">
          برای پرش کلیک کن ⏭
        </p>
      </div>
    </button>
  )
}
