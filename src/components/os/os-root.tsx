'use client'

import { useEffect, useState } from 'react'
import { useOS } from '@/lib/os/store'
import { getApp, launch } from '@/lib/os/apps'
import { WALLPAPERS, wallpaperCss } from '@/lib/os/wallpapers'
import BootScreen from './boot-screen'
import DesktopIcons from './desktop-icons'
import StartMenu from './start-menu'
import Taskbar from './taskbar'
import Toasts from './toasts'
import WindowFrame from './window'

const NOTIFS: { icon: string; title: string; body: string }[] = [
  {
    icon: '📦',
    title: 'بروزرسانی سیستم',
    body: '۴.۲ گیگ آپدیت آماده‌ست که فقط آیکن‌ها را کمی جابه‌جا می‌کند.',
  },
  {
    icon: '😱',
    title: 'کروم',
    body: 'سلام، من ۸۰٪ رم تو رو خوردم. ممنون که هستی.',
  },
  {
    icon: '🐱',
    title: 'گربه سیستمی',
    body: 'روی کیبوردت خوابیدم و چند کلید فشرده شد. تقصیر منه؟ بله.',
  },
  {
    icon: '💧',
    title: 'یادآوری مهربان',
    body: 'آب خوردن مهم‌تر از کامپایل کردن است. برود آب بخور.',
  },
  {
    icon: '🐧',
    title: 'هسته لینوکس',
    body: 'قول می‌دم امروز کرش نکنم. قولِ قول. (شرطی نداره)',
  },
  {
    icon: '🎯',
    title: 'راهنما',
    body: 'ترمینال را باز کن و بنویس help تا جادو ببینی.',
  },
  {
    icon: '🗑️',
    title: 'سطل بازیافت',
    body: 'دوتا رویا شکسته اینجاست. یکی‌ش مال دیشبه بود.',
  },
  {
    icon: '📡',
    title: 'وای‌فای',
    body: 'همسایه شبکه‌شو «مخفی» کرده. ما هم دیدیمش. مخفی نبود.',
  },
  {
    icon: '☕',
    title: 'سرویس قهوه',
    body: 'قهوه‌ات سرد شد. سیستمی کاریش نمی‌شه کرد. ببخشید.',
  },
  {
    icon: '🔋',
    title: 'باتری',
    body: '۹۹٪ — یک درصد کم شد فقط برای اینکه استرس داشته باشی.',
  },
  {
    icon: '🎲',
    title: 'دستور روز',
    body: 'یکی از بازی‌ها رو باز کن. رکوردت منتظرته!',
  },
  {
    icon: '🌙',
    title: 'ساعت خواب',
    body: 'دیره. فقط گفتم. خودت بزرگ شدی.',
  },
]

function ContextMenu({
  at,
  onClose,
}: {
  at: { x: number; y: number }
  onClose: () => void
}) {
  const settings = useOS((s) => s.settings)
  const setSetting = useOS((s) => s.setSetting)
  const shuffleIcons = useOS((s) => s.shuffleIcons)
  const pushToast = useOS((s) => s.pushToast)

  const cycleWallpaper = () => {
    const idx = WALLPAPERS.findIndex((w) => w.key === settings.wallpaper)
    const next = WALLPAPERS[(idx + 1 + WALLPAPERS.length) % WALLPAPERS.length]
    setSetting('wallpaper', next.key)
    pushToast({
      icon: '🖼️',
      title: 'کاغذدیواری عوض شد',
      body: `حالا روی حالت «${next.name}» هستی. قشنگه، نه؟`,
    })
  }

  const items: { label: string; action: () => void }[] = [
    { label: '🖼️ تغییر کاغذدیواری', action: cycleWallpaper },
    { label: '🔀 به‌هم‌ریختن آیکن‌ها', action: shuffleIcons },
    {
      label: '🔔 یه خبر خوب بهم بده',
      action: () => {
        const n = NOTIFS[Math.floor(Math.random() * NOTIFS.length)]
        pushToast(n)
      },
    },
    { label: 'ℹ️ درباره پنگوئن‌اواس', action: () => launch('about') },
  ]

  const x = Math.min(at.x, (typeof window !== 'undefined' ? window.innerWidth : 400) - 230)
  const y = Math.min(at.y, (typeof window !== 'undefined' ? window.innerHeight : 700) - 240)

  return (
    <>
      <div className="fixed inset-0 z-[9100]" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose() }} aria-hidden />
      <div
        className="pengo-pop fixed z-[9200] w-56 overflow-hidden rounded-xl border border-white/15 bg-zinc-900/95 py-1.5 shadow-2xl backdrop-blur-xl"
        style={{ left: Math.max(4, x), top: Math.max(4, y) }}
        role="menu"
      >
        {items.map((it) => (
          <button
            key={it.label}
            onClick={() => {
              it.action()
              onClose()
            }}
            className="block w-full px-3.5 py-2 text-right text-xs font-medium text-zinc-200 transition hover:bg-white/10"
            role="menuitem"
          >
            {it.label}
          </button>
        ))}
      </div>
    </>
  )
}

function PowerOffScreen() {
  const restartOS = useOS((s) => s.restartOS)
  return (
    <div className="fixed inset-0 z-[9999] grid place-items-center bg-black p-6 text-center">
      <div className="flex flex-col items-center gap-4">
        <span className="text-6xl" aria-hidden>
          🐧
        </span>
        <h1 className="text-xl font-black text-zinc-200">
          سیستم خاموش شد.
        </h1>
        <p className="max-w-xs text-sm leading-6 text-zinc-500">
          ولی صبر کن… تو توی مرورگری! هیچ‌جا نمی‌تونی بری 😜
        </p>
        <button
          onClick={restartOS}
          className="mt-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-black text-white transition hover:bg-emerald-500 active:scale-95"
        >
          ⏻ روشن کردن دوباره
        </button>
      </div>
    </div>
  )
}

export default function OSRoot() {
  const booted = useOS((s) => s.booted)
  const poweredOff = useOS((s) => s.poweredOff)
  const windows = useOS((s) => s.windows)
  const settings = useOS((s) => s.settings)
  const setBooted = useOS((s) => s.setBooted)

  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)

  // سرویس اعلان‌های بامزه (اگر حالت سرگرم‌کننده فعال باشد)
  useEffect(() => {
    if (!settings.funMode) return
    let alive = true
    let to: ReturnType<typeof setTimeout> | undefined
    const schedule = () => {
      to = setTimeout(() => {
        if (!alive) return
        const n = NOTIFS[Math.floor(Math.random() * NOTIFS.length)]
        useOS.getState().pushToast(n)
        schedule()
      }, 26000 + Math.random() * 28000)
    }
    schedule()
    return () => {
      alive = false
      if (to) clearTimeout(to)
    }
  }, [settings.funMode])

  // کلید Escape منوها را می‌بندد
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenu(null)
        useOS.getState().toggleStart(false)
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  if (poweredOff) return <PowerOffScreen />
  if (!booted) return <BootScreen onDone={() => setBooted(true)} />

  return (
    <div
      className="pengo-noselect fixed inset-0 overflow-hidden"
      style={{
        backgroundImage: wallpaperCss(settings.wallpaper),
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
      onContextMenu={(e) => {
        e.preventDefault()
        setMenu({ x: e.clientX, y: e.clientY })
      }}
    >
      <style>{`:root{--pengo-accent:${settings.accent}}`}</style>
      <div className="absolute inset-0 bg-black/10" aria-hidden />
      <DesktopIcons />
      {windows.map((w) => {
        const app = getApp(w.appId)
        if (!app) return null
        const Comp = app.component
        return (
          <WindowFrame key={w.id} win={w}>
            <Comp />
          </WindowFrame>
        )
      })}
      <Taskbar />
      <StartMenu />
      <Toasts />
      {menu && <ContextMenu at={menu} onClose={() => setMenu(null)} />}
    </div>
  )
}

