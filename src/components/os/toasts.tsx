'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { useOS, type OSToast } from '@/lib/os/store'

function ToastCard({ t }: { t: OSToast }) {
  const dismiss = useOS((s) => s.dismissToast)
  useEffect(() => {
    const to = setTimeout(() => dismiss(t.id), 6000)
    return () => clearTimeout(to)
  }, [t.id, dismiss])
  return (
    <div className="toast-in pointer-events-auto flex items-start gap-2.5 rounded-xl border border-white/15 bg-zinc-900/95 p-3 shadow-2xl shadow-black/50 backdrop-blur">
      <span className="text-2xl leading-none" aria-hidden>
        {t.icon ?? '🐧'}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-black text-zinc-100">{t.title}</div>
        <div className="mt-0.5 text-[11px] leading-5 text-zinc-400">
          {t.body}
        </div>
      </div>
      <button
        onClick={() => dismiss(t.id)}
        className="text-zinc-500 transition hover:text-zinc-200"
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
