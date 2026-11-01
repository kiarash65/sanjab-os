'use client'

import { useEffect, useState } from 'react'
import { PartyPopper, RotateCcw } from 'lucide-react'
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
    ['محیط دسکتاپ', 'PengoShell ۲.۰'],
    ['پردازنده', 'مغز شما (اختیاری)'],
    ['حافظه', 'همان‌قدر که لازم داری'],
    ['امنیت', 'یک گربه نگهبان 🐱'],
    ['آپتایم', up],
  ]

  return (
    <div className="os-scroll flex h-full flex-col items-center overflow-y-auto bg-zinc-950 p-5 text-zinc-100">
      <div className="pengo-pop grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-500 text-5xl shadow-lg" aria-hidden>
        🐧
      </div>
      <h2 className="mt-3 text-lg font-black">پنگوئن‌اواس ۲.۰ «کلوخک»</h2>
      <p className="mt-1 text-center text-xs leading-5 text-zinc-400">
        یک سیستم‌عامل خیالی بر پایه لینوکس که فقط در مرورگر شما زندگی می‌کند.
        <br />
        ساخته‌شده با ❤️ و کمی شلوغ‌کاری.
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

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() =>
            pushToast({
              icon: '🎉',
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
      </div>
    </div>
  )
}
