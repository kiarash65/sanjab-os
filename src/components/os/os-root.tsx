'use client'

import { useEffect, useState } from 'react'
import {
  Battery,
  Bell,
  Coffee,
  Info,
  Lightbulb,
  Moon,
  Package,
  Radio,
  Target,
  Trash2,
  Wifi,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useOS } from '@/lib/os/store'
import { useGame } from '@/lib/gamification/engine'
import { getApp, launch } from '@/lib/os/apps'
import { WALLPAPERS, wallpaperCss } from '@/lib/os/wallpapers'
import BootScreen from './boot-screen'
import DesktopIcons from './desktop-icons'
import LockScreen from './lock-screen'
import StartMenu from './start-menu'
import Taskbar from './taskbar'
import Toasts from './toasts'
import WelcomeTour from './welcome-tour'
import Sanjabak from './sanjabak/Sanjabak'
import WindowFrame from './window'
import { SanjabakAvatar } from './sanjabak/Sanjabak'

const NOTIFS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Package,
    title: 'بروزرسانی سیستم',
    body: '۴.۲ گیگ آپدیت آماده‌ست که فقط آیکن‌ها را کمی جابه‌جا می‌کند.',
  },
  {
    icon: Battery,
    title: 'کروم',
    body: 'سلام، من ۸۰٪ رم تو رو خوردم. ممنون که هستی.',
  },
  {
    icon: Moon,
    title: 'گربه سیستمی',
    body: 'روی کیبوردت خوابیدم و چند کلید فشرده شد. تقصیر منه؟ بله.',
  },
  {
    icon: Coffee,
    title: 'یادآوری مهربان',
    body: 'آب خوردن مهم‌تر از کامپایل کردن است. برید آب بخورید.',
  },
  {
    icon: Lightbulb,
    title: 'راهنما',
    body: 'ترمینال را باز کن، بنویس learn start تا ترمینال را بازی‌کنان یاد بگیری. یا کداستودیو را امتحان کن — پایتون داریم!',
  },
  {
    icon: Package,
    title: 'خبر داغ',
    body: 'نویسا آمد! مثل ورد می‌نویسی و خروجی Word و PDF می‌گیری. با اسپانسری سان‌جاب',
  },
  {
    icon: Trash2,
    title: 'سطل بازیافت',
    body: 'دوتا رویا شکسته اینجاست. یکی‌ش مال دیشبه بود.',
  },
  {
    icon: Radio,
    title: 'وای‌فای',
    body: 'همسایه شبکه‌اش را «مخفی» کرده. ما هم دیدیمش. مخفی نبود.',
  },
  {
    icon: Info,
    title: 'هسته لینوکس',
    body: 'قول می‌دهم امروز کرش نکنم. قولِ قول. (شرطی نداره)',
  },
  {
    icon: Target,
    title: 'دستور روز',
    body: 'ترمینال را باز کن و غلط تایپی بده — خودش اصلاحش می‌کند!',
  },
  {
    icon: Wifi,
    title: 'باتری',
    body: '۹۹٪ — یک درصد کم شد فقط برای اینکه استرس داشته باشی.',
  },
  {
    icon: Bell,
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
      icon: Info,
      title: 'کاغذدیواری عوض شد',
      body: `حالا روی حالت «${next.name}» هستی. قشنگه، نه؟`,
    })
  }

  const items: { label: string; action: () => void }[] = [
    { label: 'تغییر کاغذدیواری', action: cycleWallpaper },
    { label: 'به‌هم‌ریختن آیکن‌ها', action: shuffleIcons },
    { label: 'قفل صفحه', action: () => useOS.getState().lockScreen() },
    {
      label: 'یه خبر خوب بهم بده',
      action: () => {
        const n = NOTIFS[Math.floor(Math.random() * NOTIFS.length)]
        pushToast(n)
      },
    },
    { label: 'درباره سان‌جاب‌او‌اس', action: () => launch('about') },
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
        <div aria-hidden className="opacity-70">
          <SanjabakAvatar size={80} mood="idle" />
        </div>
        <h1 className="text-xl font-black text-zinc-200">
          سیستم خاموش شد.
        </h1>
        <p className="max-w-xs text-sm leading-6 text-zinc-500">
          ولی صبر کن… تو توی مرورگری! هیچ‌جا نمی‌تونی بری.
        </p>
        <button
          onClick={restartOS}
          className="mt-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-black text-white transition hover:bg-emerald-500 active:scale-95"
        >
          روشن کردن دوباره
        </button>
      </div>
    </div>
  )
}

export default function OSRoot() {
  const booted = useOS((s) => s.booted)
  const poweredOff = useOS((s) => s.poweredOff)
  const locked = useOS((s) => s.locked)
  const windows = useOS((s) => s.windows)
  const settings = useOS((s) => s.settings)
  const setBooted = useOS((s) => s.setBooted)

  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)

  // ثبت زنجیره روزهای فعال (استریک) هنگام بوت دسکتاپ
  useEffect(() => {
    if (booted) useGame.getState().touchStreak()
  }, [booted])

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

  // کلید Escape منوها را می‌بندد + میان‌برهای سراسری سان‌جاب‌اواس
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenu(null)
        useOS.getState().toggleStart(false)
        return
      }
      /* میان‌برهای Ctrl+Alt مثل لینوکس واقعی */
      if (e.ctrlKey && e.altKey && !e.shiftKey && !e.metaKey) {
        const k = e.key.toLowerCase()
        if (k === 't') {
          e.preventDefault()
          launch('terminal')
        } else if (k === 'l') {
          e.preventDefault()
          useOS.getState().lockScreen()
        } else if (k === 's') {
          e.preventDefault()
          launch('settings')
        }
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  // چرخش خودکار کاغذدیواری هر ۳۰ ثانیه
  useEffect(() => {
    if (!settings.wallpaperRotate) return
    const iv = setInterval(() => {
      const idx = WALLPAPERS.findIndex((w) => w.key === settings.wallpaper)
      const next = WALLPAPERS[(idx + 1 + WALLPAPERS.length) % WALLPAPERS.length]
      useOS.getState().setSetting('wallpaper', next.key)
    }, 30000)
    return () => clearInterval(iv)
  }, [settings.wallpaperRotate, settings.wallpaper])

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
      <Sanjabak />
      {/* واترمارک اسپانسری — لوگوی رسمی سان‌جاب */}
      <a
        href="https://sunjob.ir"
        target="_blank"
        rel="noreferrer"
        className="pengo-fadein pointer-events-auto fixed bottom-14 left-3 z-[5] hidden items-center gap-2 rounded-full border border-white/10 bg-black/35 px-2.5 py-1.5 backdrop-blur-md transition hover:border-[#f7931e]/50 sm:flex"
        title="اسپانسیر سیستم: سان‌جاب — sunjob.ir"
      >
        <img
          src="/brand/sunjob-logo.webp"
          alt="لوگوی سان‌جاب"
          className="h-5 w-5 rounded-sm bg-white object-contain"
        />
        <span className="text-[10px] font-bold text-white/70">
          با اسپانسری سان‌جاب
        </span>
      </a>
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
      {locked && <LockScreen />}
      {!settings.tourDone && !locked && <WelcomeTour />}
      {menu && <ContextMenu at={menu} onClose={() => setMenu(null)} />}
    </div>
  )
}
