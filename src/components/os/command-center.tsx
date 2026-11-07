'use client'

/* ====================================================================
   «مرکز فرمان سان‌جاب» — Command Palette با Ctrl+K
   باز کردن اپ‌ها، کارهای سیستم، پرش به تنظیمات — جستجوی فارسی و انگلیسی،
   کیبورد-محور و بدون هیچ وابستگی جدید (cmdk از قبل در پروژه بود).
   ==================================================================== */

import { useEffect, useMemo, useState } from 'react'
import { Command } from 'cmdk'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  Cog,
  Info,
  Lock,
  Minimize2,
  Moon,
  Power,
  RotateCw,
  Sparkles,
  Shuffle,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { useOS } from '@/lib/os/store'
import { APPS } from '@/lib/os/apps'
import { WALLPAPERS } from '@/lib/os/wallpapers'
import { faNormalize } from '@/lib/os/fa'

interface Cmd {
  id: string
  label: string
  hint?: string
  icon: typeof Cog
  group: string
  keywords: string[]
  run: () => void
}

export default function CommandCenter({ open, onClose }: { open: boolean; onClose: () => void }) {
  const reduce = useReducedMotion()
  const settings = useOS((s) => s.settings)
  const setSetting = useOS((s) => s.setSetting)
  const [query, setQuery] = useState('')

  const commands = useMemo<Cmd[]>(() => {
    const os = useOS.getState()
    const cmds: Cmd[] = []

    /* اپ‌ها و بازی‌ها */
    for (const app of APPS) {
      cmds.push({
        id: `app-${app.id}`,
        label: app.name,
        hint: app.category === 'game' ? 'بازی' : 'اپ',
        icon: app.icon,
        group: 'اپ‌ها و بازی‌ها',
        keywords: app.keywords ?? [],
        run: () => {
          os.openApp({ appId: app.id, title: app.name, w: app.w, h: app.h })
        },
      })
    }

    /* کارهای سیستم */
    cmds.push(
      {
        id: 'sys-lock',
        label: 'قفل کردن صفحه',
        icon: Lock,
        group: 'سیستم',
        keywords: ['lock', 'قفل'],
        run: () => os.lockScreen(),
      },
      {
        id: 'sys-minimize',
        label: 'کوچک‌کردن همهٔ پنجره‌ها',
        icon: Minimize2,
        group: 'سیستم',
        keywords: ['minimize', 'پنجره'],
        run: () => os.minimizeAll(),
      },
      {
        id: 'sys-wallpaper-next',
        label: 'کاغذدیواری بعدی',
        icon: Shuffle,
        group: 'سیستم',
        keywords: ['wallpaper', 'کاغذدیواری', 'پس‌زمینه'],
        run: () => {
          const idx = WALLPAPERS.findIndex((w) => w.key === settings.wallpaper)
          const next = WALLPAPERS[(idx + 1 + WALLPAPERS.length) % WALLPAPERS.length]
          setSetting('wallpaper', next.key)
        },
      },
      {
        id: 'sys-funmode',
        label: settings.funMode ? 'خاموش‌کردن حالت سرگرم‌کننده' : 'روشن‌کردن حالت سرگرم‌کننده',
        icon: Sparkles,
        group: 'سیستم',
        keywords: ['fun', 'سرگرمی', 'اعلان'],
        run: () => setSetting('funMode', !settings.funMode),
      },
      {
        id: 'sys-sound',
        label: settings.sound ? 'بی‌صدا کردن سیستم' : 'روشن‌کردن صدا',
        icon: settings.sound ? VolumeX : Volume2,
        group: 'سیستم',
        keywords: ['sound', 'صدا', 'بیصدا', 'mute'],
        run: () => setSetting('sound', !settings.sound),
      },
      {
        id: 'sys-reduced-motion',
        label: settings.reducedMotion ? 'فعال‌کردن انیمیشن‌ها' : 'کاهش حرکت (انیمیشن کمتر)',
        icon: Moon,
        group: 'دسترس‌پذیری',
        keywords: ['motion', 'انیمیشن', 'حرکت', 'دسترس‌پذیری'],
        run: () => setSetting('reducedMotion', !settings.reducedMotion),
      },
      {
        id: 'sys-settings',
        label: 'باز کردن تنظیمات',
        icon: Cog,
        group: 'سیستم',
        keywords: ['settings', 'تنظیمات'],
        run: () => os.openApp({ appId: 'settings', title: 'تنظیمات', w: 720, h: 560 }),
      },
      {
        id: 'sys-about',
        label: 'دربارهٔ سان‌جاب‌اواس',
        icon: Info,
        group: 'سیستم',
        keywords: ['about', 'درباره', 'نسخه'],
        run: () => os.openApp({ appId: 'about', title: 'درباره سیستم', w: 620, h: 520 }),
      },
      {
        id: 'sys-restart',
        label: 'راه‌اندازی دوباره سیستم',
        icon: RotateCw,
        group: 'سیستم',
        keywords: ['restart', 'ریستارت', 'راه‌اندازی'],
        run: () => os.restartOS(),
      },
      {
        id: 'sys-shutdown',
        label: 'خاموش کردن سیستم',
        icon: Power,
        group: 'سیستم',
        keywords: ['shutdown', 'خاموش', 'پاور'],
        run: () => os.shutdownOS(),
      },
    )
    return cmds
  }, [settings.wallpaper, settings.funMode, settings.sound, settings.reducedMotion, setSetting])

  /* جستجو: نام + کلیدواژه‌ها — فارسی و انگلیسی، بدون حساسیت به اعراب */
  const filtered = useMemo(() => {
    const q = faNormalize(query)
    if (!q) return commands
    return commands.filter((c) => {
      if (faNormalize(c.label).includes(q)) return true
      return c.keywords.some((k) => faNormalize(k).includes(q))
    })
  }, [commands, query])

  const groups = useMemo(() => {
    const m = new Map<string, Cmd[]>()
    for (const c of filtered) {
      const list = m.get(c.group) ?? []
      list.push(c)
      m.set(c.group, list)
    }
    return [...m.entries()]
  }, [filtered])

  /* قفل اسکرول پس‌زمینه + ریست جستجو هنگام باز شدن */
  useEffect(() => {
    if (open) {
      setQuery('')
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[9400] flex items-start justify-center bg-black/55 p-4 pt-[12vh] backdrop-blur-sm"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="مرکز فرمان سان‌جاب"
        >
          <motion.div
            initial={reduce ? false : { opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/15 bg-zinc-900/95 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Command label="مرکز فرمان سان‌جاب" loop className="[&_[cmdk-group-heading]]:px-4">
              {/* ورودی جستجو */}
              <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
                <Sparkles size={15} className="shrink-0 text-amber-300" aria-hidden />
                <Command.Input
                  value={query}
                  onValueChange={setQuery}
                  placeholder="اپ، بازی یا کار سیستمی… (فارسی یا انگلیسی)"
                  className="min-w-0 flex-1 bg-transparent text-[13px] text-zinc-100 placeholder:text-zinc-500 outline-none"
                  autoFocus
                />
                <kbd className="hidden rounded border border-white/15 bg-zinc-800 px-1.5 py-0.5 font-mono text-[9px] text-zinc-400 sm:block" dir="ltr">
                  Esc
                </kbd>
              </div>

              <Command.List className="os-scroll max-h-[46vh] overflow-y-auto p-2">
                <Command.Empty className="px-4 py-6 text-center text-[11.5px] text-zinc-500">
                  چیزی پیدا نشد — با کلمهٔ دیگری امتحان کن.
                </Command.Empty>
                {groups.map(([group, items]) => (
                  <Command.Group
                    key={group}
                    heading={group}
                    className="[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[9.5px] [&_[cmdk-group-heading]]:font-black [&_[cmdk-group-heading]]:text-zinc-500"
                  >
                    {items.map((c) => (
                      <Command.Item
                        key={c.id}
                        value={`${c.label} ${c.keywords.join(' ')}`}
                        onSelect={() => {
                          c.run()
                          onClose()
                        }}
                        className="flex cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-[12px] text-zinc-200 data-[selected=true]:bg-white/10"
                      >
                        <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-white/5 text-amber-300" aria-hidden>
                          <c.icon size={13} />
                        </span>
                        <span className="min-w-0 flex-1 truncate font-bold">{c.label}</span>
                        {c.hint && <span className="shrink-0 text-[9px] text-zinc-500">{c.hint}</span>}
                      </Command.Item>
                    ))}
                  </Command.Group>
                ))}
              </Command.List>

              <div className="flex items-center gap-3 border-t border-white/10 bg-zinc-900/80 px-4 py-2 text-[9px] text-zinc-500">
                <span>↑↓ حرکت</span>
                <span>↵ اجرا</span>
                <span className="mr-auto">مرکز فرمان سان‌جاب — Ctrl+K</span>
              </div>
            </Command>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
