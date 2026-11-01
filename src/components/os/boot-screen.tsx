'use client'

import { useEffect, useRef, useState } from 'react'

interface BootLine {
  t: string
  tag?: 'ok' | 'warn'
}

/** خطوط بوت به سبک dmesg — کمی آموزشی، خیلی بامزه */
const LINES: BootLine[] = [
  { t: 'Linux version 6.9.4-pengo-cute (gcc 13.2.0) #1 SMP PREEMPT' },
  { t: 'Command line: BOOT_IMAGE=/vmlinuz-pengo root=/dev/ice/sd0 ro cute' },
  { t: 'BIOS-provided physical RAM map: 65,536 KB usable (mostly harmless)' },
  { t: 'Initializing cgroup subsys penguin', tag: 'ok' },
  { t: 'Waking up kernel… 5 more minutes please', tag: 'warn' },
  { t: 'smpboot: CPU0: مغز شما (cores: unknown) online', tag: 'ok' },
  { t: 'meowd: cat service started successfully', tag: 'ok' },
  { t: 'smart-fridge: device not found on network', tag: 'warn' },
  { t: 'pengo-fs: mounting /home/pengo … your files are safe-ish', tag: 'ok' },
  { t: 'autocorrect: typo-fixing daemon loaded (thefuck-compatible)', tag: 'ok' },
  { t: 'tutor: terminal lesson engine ready — 14 missions queued', tag: 'ok' },
  { t: 'Random crontab joke scheduled for later', tag: 'ok' },
  { t: 'systemd[1]: Reached target Cute Interface.', tag: 'ok' },
  { t: 'Welcome to PenguinOS 3.0 «کلوخک» — کلیک برای ورود', tag: 'ok' },
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
      210
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
      className="boot-scanlines fixed inset-0 z-[9999] block cursor-pointer bg-black text-left"
      aria-label="پرش از بوت"
    >
      <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-6 font-mono">
        <div className="flex items-center gap-4">
          <pre
            className="hidden text-[10px] leading-4 text-emerald-500 sm:block"
            dir="ltr"
            aria-hidden
          >
            {TUX}
          </pre>
          <div>
            <h1 className="text-lg font-black text-emerald-400 sm:text-xl">
              PenguinOS 3.0 «کلوخک»
            </h1>
            <p className="text-[11px] text-zinc-600">
              وب‌سیستم‌عامل بامزه — بر پایه هسته‌ی تخیل لینوکسی
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
                <span className="text-emerald-400">
                  [ <b>OK</b> ]{' '}
                </span>
              )}
              {l.tag === 'warn' && (
                <span className="text-amber-400">
                  [ <b>!!</b> ]{' '}
                </span>
              )}
              {l.tag === undefined && (
                <span className="text-violet-400">
                  [ <b>..</b> ]{' '}
                </span>
              )}
              {l.t}
            </div>
          ))}
          {n >= LINES.length && (
            <div className="pengo-fadein text-emerald-400">
              [ <b>OK</b> ] خوش اومدی! داری وارد می‌شی…
            </div>
          )}
        </div>
        <div className="h-1.5 w-full max-w-xl overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-emerald-500 transition-[width] duration-100"
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
