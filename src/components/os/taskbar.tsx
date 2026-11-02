'use client'

import { useEffect, useState } from 'react'
import { BatteryMedium, Volume2, VolumeX, Wifi } from 'lucide-react'
import { useOS } from '@/lib/os/store'
import { getApp } from '@/lib/os/apps'

function TaskbarClock() {
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    const t0 = window.setTimeout(() => setNow(new Date()), 0)
    const t = window.setInterval(() => setNow(new Date()), 1000)
    return () => {
      window.clearTimeout(t0)
      window.clearInterval(t)
    }
  }, [])
  if (!now) return <div className="w-20" aria-hidden />
  const time = now.toLocaleTimeString('fa-IR', {
    hour: '2-digit',
    minute: '2-digit',
  })
  const date = now.toLocaleDateString('fa-IR', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  })
  return (
    <div className="mr-1 text-right leading-tight" dir="ltr">
      <div className="text-xs font-black text-zinc-100" dir="rtl">
        {time}
      </div>
      <div className="text-[10px] text-zinc-400" dir="rtl">
        {date}
      </div>
    </div>
  )
}

export default function Taskbar() {
  const windows = useOS((s) => s.windows)
  const focusedId = useOS((s) => s.focusedId)
  const toggleWindow = useOS((s) => s.toggleWindow)
  const toggleStart = useOS((s) => s.toggleStart)
  const minimizeAll = useOS((s) => s.minimizeAll)
  const sound = useOS((s) => s.settings.sound)
  const setSetting = useOS((s) => s.setSetting)
  const accent = useOS((s) => s.settings.accent)

  return (
    <footer className="fixed inset-x-0 bottom-0 z-[8000] flex h-12 items-center gap-1 border-t border-white/10 bg-black/70 px-2 backdrop-blur-md">
      <button
        onClick={() => toggleStart()}
        className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-sm font-black transition hover:bg-white/10 active:scale-95"
        style={{ color: accent }}
        aria-label="منوی شروع"
      >
        <img
          src="/squirrel-avatar.png"
          alt=""
          aria-hidden
          className="pengo-breathe h-6 w-6 rounded-full border border-white/20 object-cover"
        />
        <span className="hidden sm:inline">شروع</span>
      </button>
      <a
        href="https://sunjob.ir"
        target="_blank"
        rel="noreferrer"
        title="اسپانسیر ما: سان‌جاب — sunjob.ir"
        className="mr-1 hidden h-7 shrink-0 items-center gap-1.5 rounded-full border border-[#f7931e]/40 bg-gradient-to-l from-[#f7931e]/20 to-[#8b5cf6]/20 px-2.5 text-[10px] font-black text-amber-200 transition hover:from-[#f7931e]/35 hover:to-[#8b5cf6]/35 lg:flex"
      >
        <img
          src="/brand/sunjob-logo.webp"
          alt="لوگوی سان‌جاب"
          className="h-4 w-4 rounded-sm bg-white object-contain"
        />
        با اسپانسری سان‌جاب
      </a>
      <div className="h-6 w-px shrink-0 bg-white/10" aria-hidden />
      <nav
        className="os-scroll flex min-w-0 flex-1 items-center gap-1 overflow-x-auto"
        aria-label="پنجره‌های باز"
      >
        {windows.map((win) => {
          const app = getApp(win.appId)
          const isFocused = focusedId === win.id && !win.minimized
          return (
            <button
              key={win.id}
              onClick={() => toggleWindow(win.id)}
              className={`flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-xs transition active:scale-95 ${
                isFocused
                  ? 'bg-white/15 font-bold text-white'
                  : win.minimized
                    ? 'text-zinc-500 hover:bg-white/5 hover:text-zinc-300'
                    : 'text-zinc-300 hover:bg-white/10'
              }`}
              title={win.title}
            >
              {app ? <app.icon size={15} aria-hidden /> : null}
              <span className="hidden max-w-24 truncate md:inline">
                {win.title}
              </span>
              <span
                className="h-1 w-1 rounded-full"
                style={{ background: isFocused ? accent : 'transparent' }}
                aria-hidden
              />
            </button>
          )
        })}
      </nav>
      <div className="flex shrink-0 items-center gap-0.5 text-zinc-300">
        <button
          onClick={() => setSetting('sound', !sound)}
          className="grid h-8 w-8 place-items-center rounded-lg transition hover:bg-white/10"
          title={sound ? 'قطع صدا' : 'وصل صدا'}
          aria-label={sound ? 'قطع صدا' : 'وصل صدا'}
        >
          {sound ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>
        <span
          className="hidden h-8 w-8 place-items-center rounded-lg sm:grid"
          title="وای‌فای: قوی، مثل اعتمادبه‌نفس پنگوئن‌ها"
        >
          <Wifi size={16} />
        </span>
        <span
          className="hidden h-8 w-8 place-items-center rounded-lg sm:grid"
          title="باتری: ۹۹٪ (همیشه، جادویی)"
        >
          <BatteryMedium size={16} />
        </span>
        <button
          onClick={minimizeAll}
          className="ml-1 h-8 w-2 rounded-sm border-l border-white/20 transition hover:bg-white/10"
          title="نمایش میزکار"
          aria-label="کوچک کردن همه پنجره‌ها"
        />
        <TaskbarClock />
      </div>
    </footer>
  )
}
