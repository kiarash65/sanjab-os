'use client'

import { useEffect, useRef, useState } from 'react'
import { BRAND } from '@/lib/os/brand'

interface BootLine {
  t: string
  tag?: 'ok' | 'warn' | 'info'
}

/** خطوط بوت به سبک dmesg — کمی آموزشی، خیلی بامزه */
const LINES: BootLine[] = [
  { t: `Linux version ${BRAND.kernel} (gcc 13.2.0) #1 SMP PREEMPT`, tag: 'info' },
  { t: 'Command line: BOOT_IMAGE=/vmlinuz-sanjob root=/dev/sunjob/sd0 ro cute colorful', tag: 'info' },
  { t: 'BIOS-provided physical RAM map: 65,536 KB usable (mostly harmless)', tag: 'info' },
  { t: 'Initializing cgroup subsys sanjabak', tag: 'ok' },
  { t: 'Waking up kernel… 5 more minutes please', tag: 'warn' },
  { t: 'smpboot: CPU0: مغز شما (cores: unknown) online', tag: 'ok' },
  { t: 'sanjob-sponsor: پالت رنگی از sunjob.ir با موفقیت دانلود شد', tag: 'ok' },
  { t: 'sanjob-sponsor: اسپانسری فعال شد — با اسپانسری سان‌جاب', tag: 'ok' },
  { t: 'meowd: cat service started successfully', tag: 'ok' },
  { t: 'smart-fridge: device not found on network', tag: 'warn' },
  { t: 'sanjob-fs: mounting /home/pengo … your files are safe-ish', tag: 'ok' },
  { t: 'autocorrect: typo-fixing daemon loaded (thefuck-compatible)', tag: 'ok' },
  { t: 'tutor: terminal lesson engine ready — 14 missions queued', tag: 'ok' },
  { t: 'python-runtime: mini-python 3.11 «سنجابی» loaded (0 MB, جادویی)', tag: 'ok' },
  { t: 'word-processor: نویسا آمادهٔ خروجی Word و PDF', tag: 'ok' },
  { t: 'linux-academy: آکادمی لینوکس بوت شد — ۸ فصل، ترمینال تعاملی، توزیع‌ها و نصب', tag: 'ok' },
  { t: 'sanjob-logo: لوگوی رسمی سان‌جاب از sunjob.ir بارگذاری شد', tag: 'ok' },
  { t: 'Random crontab joke scheduled for later', tag: 'ok' },
  { t: 'systemd[1]: Reached target Colorful Cute Interface.', tag: 'ok' },
  { t: `Welcome to ${BRAND.nameEn} ${BRAND.versionEn} — کلیک برای ورود`, tag: 'ok' },
]

const MASCOT = String.raw`
   (~._.~)
    (o_o)
     > ~ <
    (_)-(_)
  سنجابکِ سیستم
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
      200
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
      className="boot-scanlines fixed inset-0 z-[9999] block cursor-pointer bg-[#0b1120] text-left"
      aria-label="پرش از بوت"
    >
      <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-6 font-mono">
        <div className="flex items-center gap-4">
          <img
            src="/brand/sunjob-logo.webp"
            alt="لوگوی رسمی سان‌جاب"
            className="pengo-float h-16 w-16 rounded-2xl border border-white/15 bg-white/95 object-contain p-1 shadow-lg shadow-[#f7931e]/25 sm:h-20 sm:w-20"
          />
          <pre
            className="hidden text-[10px] leading-4 text-amber-400/90 lg:block"
            dir="ltr"
            aria-hidden
          >
            {MASCOT}
          </pre>
          <div>
            <h1 className="text-lg font-black sm:text-xl" dir="ltr">
              <span className="bg-gradient-to-l from-[#f7931e] via-[#fdb56b] to-[#8b5cf6] bg-clip-text text-transparent">
                {BRAND.nameEn} {BRAND.versionEn}
              </span>
            </h1>
            <p className="text-[11px] text-zinc-500">
              {BRAND.name} — وب‌سیستم‌عامل بامزهٔ رنگی
            </p>
            <p className="mt-0.5 inline-flex items-center gap-1 rounded-full border border-[#f7931e]/40 bg-[#f7931e]/10 px-2 py-0.5 text-[10px] font-bold text-amber-300">
              <img
                src="/brand/sunjob-logo.webp"
                alt=""
                aria-hidden
                className="h-3.5 w-3.5 rounded-sm bg-white object-contain"
              />
              {BRAND.sponsor}
            </p>
          </div>
        </div>
        <div
          className="os-scroll h-64 w-full max-w-xl overflow-hidden text-[11px] leading-6 sm:text-xs"
          dir="rtl"
        >
          {LINES.slice(0, n).map((l, i) => (
            <div key={i} className="pengo-fadein text-zinc-300">
              {l.tag === 'ok' && (
                <span className="text-teal-400">
                  [ <b>OK</b> ]{' '}
                </span>
              )}
              {l.tag === 'warn' && (
                <span className="text-amber-400">
                  [ <b>!!</b> ]{' '}
                </span>
              )}
              {l.tag === 'info' && (
                <span className="text-violet-400">
                  [ <b>..</b> ]{' '}
                </span>
              )}
              {l.t}
            </div>
          ))}
          {n >= LINES.length && (
            <div className="pengo-fadein text-amber-300">
              [ <b>OK</b> ] خوش اومدی! داری وارد می‌شی…
            </div>
          )}
        </div>
        <div className="h-1.5 w-full max-w-xl overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-l from-[#f7931e] to-[#8b5cf6] transition-[width] duration-100"
            style={{
              width: `${n >= LINES.length ? prog : (n / LINES.length) * 80}%`,
            }}
          />
        </div>
        <p className="animate-pulse text-[11px] text-zinc-600">
          برای پرش کلیک کن
        </p>
      </div>
    </button>
  )
}
