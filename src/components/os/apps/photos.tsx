'use client'

import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Images, Wallpaper, X } from 'lucide-react'
import { useOS } from '@/lib/os/store'
import { Button } from '@/components/ui/button'

interface Photo {
  src: string
  title: string
  desc: string
}

const PHOTOS: Photo[] = [
  {
    src: '/photos/tux-astronaut.png',
    title: 'پنگوئن فضانورد',
    desc: 'سفر کهکشانی با لباس گرم، مقصد: ماهی‌یخ نپتون',
  },
  {
    src: '/photos/penguin-party.png',
    title: 'مهمونی یخی',
    desc: 'جشن رقص روی کوه یخ، دی‌جی: یک خوک دریایی',
  },
  {
    src: '/photos/cat-hacker.png',
    title: 'گربه هکر',
    desc: 'مقصر ۹۰٪ کرش‌های شبانه سیستم',
  },
  {
    src: '/photos/ice-city.png',
    title: 'شهر یخی',
    desc: 'پایتخت پنگوئن‌ها، جمعیت: ۱۲۴ پنگوئن و ۱ گربه',
  },
  {
    src: '/wallpapers/aurora-night.png',
    title: 'شفق قطبی',
    desc: 'شب بی‌خوابی قطب جنوب',
  },
  {
    src: '/wallpapers/retro-terminal.png',
    title: 'اتاق رترو',
    desc: 'جایی که همه‌چی با لوله اشته می‌شد',
  },
  {
    src: '/wallpapers/tux-hills.png',
    title: 'تپه‌های پنگوئنی',
    desc: 'زادگاه ماسکات رسمی ما',
  },
  {
    src: '/wallpapers/pixel-art.png',
    title: 'ایگلو هکری',
    desc: 'مقر مخفی، لطفاً لو ندهید',
  },
  {
    src: '/wallpapers/cat-space.png',
    title: 'گربه در فضا',
    desc: 'اولین گربه‌ای که پرواز ناموفق نداشت',
  },
]

export default function PhotosApp() {
  const [lightbox, setLightbox] = useState<number | null>(null)

  const closeLightbox = useCallback(() => setLightbox(null), [])

  // حرکت در گالری با چرخش دور‌تا‌دور (wrap-around)
  const step = useCallback((dir: 1 | -1) => {
    setLightbox((cur) =>
      cur === null ? null : (cur + dir + PHOTOS.length) % PHOTOS.length
    )
  }, [])

  // میان‌برهای کیبورد: بستن با Esc، قبلی/بعدی با جهت‌نما (مطابق چیدمان راست‌به‌چپ)
  useEffect(() => {
    if (lightbox === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeLightbox()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        step(-1)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        step(1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox, closeLightbox, step])

  const setAsWallpaper = (photo: Photo) => {
    useOS.getState().setSetting('wallpaper', `custom:${photo.src}`)
    useOS.getState().pushToast({
      icon: Images,
      title: 'کاغذدیواری عوض شد',
      body: `«${photo.title}» حالا پشت پنجره‌هاته`,
    })
  }

  const current = lightbox !== null ? PHOTOS[lightbox] : null

  return (
    <div className="relative flex h-full w-full flex-col">
      {/* سربرگ: عنوان، شمارنده و راهنما */}
      <header className="flex shrink-0 items-center gap-2 border-b border-white/10 px-3 py-2">
        <h2 className="shrink-0 text-sm font-black text-zinc-100">
          گالری پنگوئن‌اواس
        </h2>
        <span className="shrink-0 rounded-full border border-white/10 bg-zinc-900 px-2 py-0.5 text-[10px] font-bold text-zinc-400">
          {PHOTOS.length.toLocaleString('fa-IR')} عکس
        </span>
        <p className="min-w-0 flex-1 truncate text-left text-[10px] text-zinc-500">
          روی عکس کلیک کن، می‌تونی هر عکسی رو کاغذدیواری کنی
        </p>
      </header>

      {/* شبکه عکس‌ها */}
      <div className="os-scroll grid min-h-0 flex-1 grid-cols-2 gap-2 overflow-y-auto p-3 sm:grid-cols-3">
        {PHOTOS.map((photo, i) => (
          <button
            key={photo.src}
            type="button"
            onClick={() => setLightbox(i)}
            aria-label={`باز کردن عکس: ${photo.title}`}
            title={photo.title}
            className="group overflow-hidden rounded-xl border border-white/10 bg-zinc-900 text-right transition hover:border-white/25 hover:shadow-lg active:scale-[0.99]"
          >
            <div className="aspect-[4/3] w-full overflow-hidden">
              <img
                src={photo.src}
                alt={photo.title}
                loading="lazy"
                draggable={false}
                className="aspect-[4/3] w-full object-cover transition duration-300 group-hover:scale-105"
              />
            </div>
            <div className="space-y-0.5 p-2">
              <p className="truncate text-[11px] font-bold text-zinc-200">
                {photo.title}
              </p>
              <p className="truncate text-[10px] text-zinc-500">{photo.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* لایت‌باکس */}
      {current && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`نمایش عکس: ${current.title}`}
          onClick={closeLightbox}
          className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/85 p-4 backdrop-blur"
        >
          {/* جلوگیری از بستن هنگام کلیک روی محتوا */}
          <div
            className="flex h-full w-full flex-col items-center justify-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={current.src}
              alt={current.title}
              draggable={false}
              className="max-h-[60%] max-w-full rounded-xl border border-white/15 object-contain shadow-2xl"
            />
            <div className="max-w-full text-center">
              <p className="font-black text-zinc-50">{current.title}</p>
              <p className="mt-0.5 text-xs text-zinc-400">{current.desc}</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button
                type="button"
                size="icon"
                variant="outline"
                aria-label="عکس قبلی"
                title="عکس قبلی"
                onClick={() => step(-1)}
                className="size-9 border-white/15 bg-zinc-900/70 text-zinc-200 hover:bg-white/10 hover:text-zinc-50"
              >
                <ChevronRight className="size-5" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="outline"
                aria-label="عکس بعدی"
                title="عکس بعدی"
                onClick={() => step(1)}
                className="size-9 border-white/15 bg-zinc-900/70 text-zinc-200 hover:bg-white/10 hover:text-zinc-50"
              >
                <ChevronLeft className="size-5" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="outline"
                aria-label="بستن نمایشگر"
                title="بستن (Esc)"
                onClick={closeLightbox}
                className="size-9 border-white/15 bg-zinc-900/70 text-zinc-300 hover:border-rose-500/50 hover:bg-rose-500/10 hover:text-rose-300"
              >
                <X className="size-5" />
              </Button>
              <Button
                type="button"
                size="sm"
                aria-label="کاغذدیواری کن"
                title="این عکس پشت همه پنجره‌ها قرار می‌گیره"
                onClick={() => setAsWallpaper(current)}
                className="h-9 gap-1.5 bg-[var(--pengo-accent)] px-3 text-zinc-950 hover:bg-[var(--pengo-accent)]/90"
              >
                <Wallpaper className="size-4" />
                کاغذدیواری کن
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
