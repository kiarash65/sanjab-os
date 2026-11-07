'use client'

import { useMemo } from 'react'
import { useOS } from '@/lib/os/store'
import { APPS, launch } from '@/lib/os/apps'

export default function DesktopIcons() {
  const iconNonce = useOS((s) => s.iconNonce)

  const desktopApps = useMemo(() => APPS.filter((a) => a.desktop), [])

  // ترتیب آیکن‌ها: با هر بار «به‌هم‌ریختن» یک شافل تازه
  const ordered = useMemo(() => {
    const ids = desktopApps.map((a) => a.id)
    if (iconNonce === 0) return desktopApps
    const arr = [...ids]
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
      .map((id) => desktopApps.find((a) => a.id === id))
      .filter((a): a is (typeof desktopApps)[number] => Boolean(a))
  }, [desktopApps, iconNonce])

  return (
    <div
      data-tour="icons"
      className="absolute bottom-16 right-3 top-3 z-0 flex flex-col flex-wrap-reverse content-start items-start gap-1"
      aria-label="آیکن‌های میزکار"
    >
      {ordered.map((a) => (
        <button
          key={a.id}
          onClick={() => launch(a.id)}
          className="pengo-noselect group flex w-[84px] flex-col items-center gap-1 rounded-xl p-2 transition hover:bg-white/10 active:scale-95"
          title={a.name}
        >
          <span
            className={`grid h-12 w-12 place-items-center rounded-xl border border-white/20 bg-gradient-to-br shadow-lg shadow-black/40 transition group-hover:scale-105 ${
              a.tint ?? 'from-zinc-700 to-zinc-800'
            }`}
            aria-hidden
          >
            <a.icon
              size={24}
              strokeWidth={2}
              className="text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
            />
          </span>
          <span className="text-center text-[11px] font-bold leading-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
            {a.name}
          </span>
        </button>
      ))}
    </div>
  )
}
