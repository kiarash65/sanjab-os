'use client'

import { useEffect, useState } from 'react'
import { Unlock } from 'lucide-react'
import { useOS } from '@/lib/os/store'

export default function LockScreen() {
  const unlock = useOS((s) => s.unlockScreen)
  const wallpaper = useOS((s) => s.settings.wallpaper)
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    const t0 = window.setTimeout(() => setNow(new Date()), 0)
    const iv = window.setInterval(() => setNow(new Date()), 1000)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === 'Escape') unlock()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(t0)
      window.clearInterval(iv)
      window.removeEventListener('keydown', onKey)
    }
  }, [unlock])

  const time = now?.toLocaleTimeString('fa-IR', {
    hour: '2-digit',
    minute: '2-digit',
  })
  const date = now?.toLocaleDateString('fa-IR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div
      className="pengo-pop fixed inset-0 z-[9600] flex cursor-pointer flex-col items-center justify-center gap-3 bg-black/70 backdrop-blur-xl"
      onClick={unlock}
      role="button"
      aria-label="برای باز کردن قفل کلیک کن"
    >
      <img
        src="/tux-avatar.png"
        alt=""
        aria-hidden
        className="pengo-float h-24 w-24 rounded-full border-2 border-white/20 object-cover shadow-2xl"
      />
      <div
        className="text-6xl font-black tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)] tabular-nums sm:text-8xl"
        dir="ltr"
      >
        {time ?? '--:--'}
      </div>
      <div className="text-sm font-bold text-white/80">{date ?? ''}</div>
      <div className="mt-6 flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold text-white/90">
        <Unlock size={14} aria-hidden />
        برای باز کردن قفل کلیک کن یا Enter بزن
      </div>
      <p className="absolute bottom-6 text-[11px] text-white/40">
        نکته: رمز این قفل، بامزگی توست. که همیشه درست است.
      </p>
    </div>
  )
}
