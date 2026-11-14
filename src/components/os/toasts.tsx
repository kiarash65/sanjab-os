'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Bell } from 'lucide-react'
import { useOS, type OSToast } from '@/lib/os/store'

function ToastCard({ t }: { t: OSToast }) {
  const dismiss = useOS((s) => s.dismissToast)
  useEffect(() => {
    const to = setTimeout(() => dismiss(t.id), 6000)
    return () => clearTimeout(to)
  }, [t.id, dismiss])
  const Icon: LucideIcon | string | undefined = t.icon ?? Bell
  return (
    <div className="toast-in pointer-events-auto flex items-start gap-2.5 rounded-xl border border-white/15 bg-zinc-900/95 p-3 shadow-2xl shadow-black/50 backdrop-blur transition-transform hover:-translate-y-0.5">
      <span
        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/5"
        aria-hidden
      >
        {typeof Icon === 'string' ? (
          <span className="text-base leading-none">{Icon}</span>
        ) : (
          <Icon size={16} className="text-zinc-200" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-black text-zinc-100">{t.title}</div>
        <div className="mt-0.5 text-[11px] leading-5 text-zinc-400">
          {t.body}
        </div>
      </div>
      <button
        onClick={() => dismiss(t.id)}
        className="shrink-0 self-center rounded-md p-1 text-zinc-500 transition-all hover:rotate-90 hover:bg-white/10 hover:text-zinc-100"
        aria-label="بستن اعلان"
      >
        <X size={14} />
      </button>
    </div>
  )
}

export default function Toasts() {
  const toasts = useOS((s) => s.toasts)
  return (
    <div
      className="pointer-events-none fixed bottom-14 left-3 z-[9000] flex w-[min(90vw,320px)] flex-col gap-2"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} t={t} />
      ))}
    </div>
  )
}
