'use client'

import { useEffect, useState } from 'react'
import { Cat, PartyPopper, RotateCcw, ShieldCheck } from 'lucide-react'
import { useOS } from '@/lib/os/store'
import { Button } from '@/components/ui/button'

export default function AboutApp() {
  const bootAt = useOS((s) => s.bootAt)
  const pushToast = useOS((s) => s.pushToast)
  const restartOS = useOS((s) => s.restartOS)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(iv)
  }, [])

  const upSec = Math.max(0, Math.floor((now - bootAt) / 1000))
  const upMin = Math.floor(upSec / 60)
  const up = upMin > 0 ? `${upMin} دقیقه و ${upSec % 60} ثانیه` : `${upSec} ثانیه`

  const specs: [string, string][] = [
    ['هسته', 'لینوکس ۶.۹.۴-پنگویی'],
    ['محیط دسکتاپ', 'PengoShell ۳.۰'],
    ['شل', 'pengo-sh 3.0 (آموزشی)'],
    ['پردازنده', 'مغز شما (اختیاری)'],
    ['حافظه', 'همان‌قدر که لازم داری'],
    ['امنیت', 'یک گربه نگهبان'],
    ['آپتایم', up],
  ]

  return (
    <div className="os-scroll flex h-full flex-col items-center overflow-y-auto bg-zinc-950 p-5 text-zinc-100">
      <img
        src="/tux-avatar.png"
        alt="لوگوی پنگوئن‌اواس"
        className="pengo-float h-20 w-20 rounded-3xl border border-white/15 object-cover shadow-lg"
      />
      <h2 className="mt-3 text-lg font-black">پنگوئن‌اواس ۳.۰ «کلوخک»</h2>
      <p className="mt-1 text-center text-xs leading-5 text-zinc-400">
        یک سیستم‌عامل خیالی بر پایه لینوکس که فقط در مرورگر شما زندگی می‌کند.
        <br />
        با ترمینال آموزشی، تصحیح غلط تایپی و ۱۰ بازی.
      </p>

      <div className="mt-4 w-full max-w-xs overflow-hidden rounded-xl border border-white/10">
        {specs.map(([k, v], i) => (
          <div
            key={k}
            className={`flex items-center justify-between gap-2 px-3 py-2 text-xs ${
              i % 2 === 0 ? 'bg-zinc-900' : 'bg-zinc-900/50'
            }`}
          >
            <span className="text-zinc-500">{k}</span>
            <span className="font-bold text-zinc-200">{v}</span>
          </div>
        ))}
      </div>

      <p className="mt-3 max-w-xs text-center text-[11px] leading-5 text-zinc-500">
        طراحی الهام‌گرفته از پروژه‌های Puter، OS.js، daedalOS و win11React —
        و تصحیح دستورها به سبک thefuck و fish-shell.
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() =>
            pushToast({
              icon: PartyPopper,
              title: 'اعلان تستی',
              body: 'اگر این را می‌بینی، یعنی سیستم اعلان کار می‌کند. آفرین به ما!',
            })
          }
        >
          <PartyPopper className="size-4" />
          یه اعلان تستی بفرست
        </Button>
        <Button size="sm" variant="outline" onClick={restartOS}>
          <RotateCcw className="size-4" />
          ری‌استارت سیستم
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() =>
            pushToast({
              icon: Cat,
              title: 'گربه نگهبان',
              body: 'گزارش وضعیت: همه‌چیز امن است. غذای گربه هم امن است.',
            })
          }
        >
          <ShieldCheck className="size-4" />
          وضعیت امنیت
        </Button>
      </div>
    </div>
  )
}
