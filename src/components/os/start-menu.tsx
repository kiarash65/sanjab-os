'use client'

import { useState } from 'react'
import { Lock, Power, RotateCcw, Search } from 'lucide-react'
import { useOS } from '@/lib/os/store'
import { APPS, launch } from '@/lib/os/apps'
import { Input } from '@/components/ui/input'
import { getPlayerName, setPlayerName } from '@/components/os/leaderboard'

export default function StartMenu() {
  const startOpen = useOS((s) => s.startOpen)
  if (!startOpen) return null
  return <StartMenuInner />
}

function StartMenuInner() {
  const toggleStart = useOS((s) => s.toggleStart)
  const restartOS = useOS((s) => s.restartOS)
  const shutdownOS = useOS((s) => s.shutdownOS)
  const [q, setQ] = useState('')

  const needle = q.trim().toLowerCase()
  const filtered = APPS.filter(
    (a) =>
      a.id !== 'about' &&
      (needle === '' ||
        a.name.toLowerCase().includes(needle) ||
        (a.keywords ?? []).some((k) => k.includes(needle)))
  )
  const groups: { label: string; items: typeof APPS }[] = [
    { label: 'برنامه‌ها', items: filtered.filter((a) => a.category === 'app') },
    { label: 'بازی‌ها', items: filtered.filter((a) => a.category === 'game') },
    {
      label: 'سیستم',
      items: filtered.filter((a) => a.category === 'system'),
    },
  ]

  return (
    <>
      <div
        className="fixed inset-0 z-[8400]"
        onClick={() => toggleStart(false)}
        aria-hidden
      />
      <div
        className="pengo-pop fixed bottom-14 right-2 z-[8500] flex max-h-[min(74vh,580px)] w-[min(94vw,580px)] flex-col overflow-hidden rounded-2xl border border-white/15 bg-zinc-900/95 shadow-2xl shadow-black/60 backdrop-blur-xl sm:right-3"
        role="menu"
        aria-label="منوی شروع"
      >
        <div className="border-b border-white/10 p-3">
          <div className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500"
              aria-hidden
            />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="جستجو بین اپ‌ها و بازی‌ها…"
              className="h-9 bg-zinc-800/70 pr-9 text-sm"
              aria-label="جستجوی برنامه‌ها"
            />
          </div>
        </div>
        <div className="os-scroll flex-1 space-y-4 overflow-y-auto p-3">
          {groups.map((g) =>
            g.items.length > 0 ? (
              <section key={g.label}>
                <h3 className="mb-2 text-xs font-bold text-zinc-500">
                  {g.label}
                </h3>
                <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5">
                  {g.items.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => launch(a.id)}
                      className="flex flex-col items-center gap-1.5 rounded-xl p-2 transition hover:bg-white/10 active:scale-95"
                    >
                      <span
                        className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-zinc-800 shadow-inner"
                        aria-hidden
                      >
                        <a.icon size={22} strokeWidth={1.8} className="text-zinc-100" />
                      </span>
                      <span className="text-center text-[11px] font-medium leading-tight text-zinc-200">
                        {a.name}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            ) : null
          )}
          {filtered.length === 0 && (
            <div className="grid place-items-center gap-2 py-10 text-center">
              <Search size={36} className="text-zinc-600" aria-hidden />
              <p className="text-sm text-zinc-400">
                چیزی پیدا نشد! حتی گربه سیستمی هم نمی‌دونه «{q}» چیه.
              </p>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-white/10 p-2.5">
          <div className="flex min-w-0 items-center gap-2 px-1">
            <img
              src="/tux-avatar.png"
              alt="آواتار پنگوئن"
              className="h-9 w-9 shrink-0 rounded-full border border-white/15 object-cover"
            />
            <div className="min-w-0 leading-tight">
              <input
                defaultValue={getPlayerName()}
                onBlur={(e) => setPlayerName(e.target.value.trim().slice(0, 24))}
                maxLength={24}
                aria-label="اسم بازیکن"
                placeholder="پنگوئن مهمان"
                className="w-36 rounded-md bg-transparent px-1.5 py-0.5 text-xs font-bold text-zinc-100 outline-none transition hover:bg-white/10 focus:bg-white/10"
              />
              <div className="px-1.5 text-[10px] text-zinc-500">
                مدیر ارشد بامزگی
              </div>
            </div>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => {
                toggleStart(false)
                useOS.getState().lockScreen()
              }}
              className="grid h-9 w-9 place-items-center rounded-lg text-zinc-300 transition hover:bg-white/10 hover:text-sky-300"
              title="قفل صفحه"
              aria-label="قفل صفحه"
            >
              <Lock size={16} />
            </button>
            <button
              onClick={restartOS}
              className="grid h-9 w-9 place-items-center rounded-lg text-zinc-300 transition hover:bg-white/10 hover:text-amber-300"
              title="شروع دوباره سیستم"
              aria-label="شروع دوباره سیستم"
            >
              <RotateCcw size={16} />
            </button>
            <button
              onClick={shutdownOS}
              className="grid h-9 w-9 place-items-center rounded-lg text-zinc-300 transition hover:bg-red-500/20 hover:text-red-400"
              title="خاموش کردن سیستم"
              aria-label="خاموش کردن سیستم"
            >
              <Power size={16} />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
