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
      {ordered.map((a, i) => (
        <button
          key={a.id}
          onClick={() => launch(a.id)}
          className="pengo-noselect icon-enter group flex w-[84px] flex-col items-center gap-1.5 rounded-xl p-2 transition-colors hover:bg-white/10 active:bg-white/15"
          style={{ animationDelay: `${Math.min(i * 40, 720)}ms` }}
          title={a.name}
        >
          <span
            className={`grid h-12 w-12 place-items-center rounded-xl border border-white/25 bg-gradient-to-br shadow-[inset_0_1px_0_rgba(255,255,255,0.4),inset_0_-8px_14px_rgba(0,0,0,0.15),0_10px_18px_-8px_rgba(0,0,0,0.55)] transition-all duration-200 ease-out group-hover:-translate-y-1 group-hover:scale-105 group-hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.45),inset_0_-8px_14px_rgba(0,0,0,0.15),0_16px_26px_-8px_rgba(0,0,0,0.6)] group-active:translate-y-0 group-active:scale-95 ${
              a.tint ?? 'from-zinc-700 to-zinc-800'
            }`}
            aria-hidden
          >
            <a.icon
              size={24}
              strokeWidth={2}
              className="text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] transition-transform duration-200 group-hover:scale-110"
            />
          </span>
          <span className="text-center text-[11px] font-bold leading-tight text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] transition-transform duration-200 group-hover:-translate-y-0.5">
            {a.name}
          </span>
        </button>
      ))}
    </div>
  )
}
