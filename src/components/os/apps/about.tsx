'use client'

import { useEffect, useState } from 'react'
import { Cat, ExternalLink, PartyPopper, RotateCcw, ShieldCheck, Zap } from 'lucide-react'
import { useOS } from '@/lib/os/store'
import { Button } from '@/components/ui/button'
import { BRAND, SUNJOB_PALETTE } from '@/lib/os/brand'

const PALETTE_SWATCHES: [string, string][] = [
  [SUNJOB_PALETTE.orange, 'نارنجی برند'],
  [SUNJOB_PALETTE.violet, 'بنفش'],
  [SUNJOB_PALETTE.teal, 'فیروزه‌ای'],
  [SUNJOB_PALETTE.rose, 'قرمز'],
  [SUNJOB_PALETTE.navy, 'سرمه‌ای'],
  [SUNJOB_PALETTE.cream, 'کرم'],
]

export default function AboutApp() {
  const bootAt = useOS((s) => s.bootAt)
  const pushToast = useOS((s) => s.pushToast)
  const restartOS = useOS((s) => s.restartOS)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(iv)
  }, [])

  const upSec = Math.max(0, Math.floor((now - bootAt) / 1000))
  const upMin = Math.floor(upSec / 60)
  const up = upMin > 0 ? `${upMin} دقیقه و ${upSec % 60} ثانیه` : `${upSec} ثانیه`

  const specs: [string, string][] = [
    ['هسته', 'لینوکس ۶.۱۲.۴-سان‌جابی'],
    ['محیط دسکتاپ', 'SanjabShell ۴.۰'],
    ['شل', 'sanjob-sh 4.0 (آموزشی + تصحیح غلط)'],
    ['زبان‌های نصب‌شده', 'پایتون، سنجابی، جاوااسکریپت، HTML'],
    ['آفیس', 'نویسا — خروجی Word و PDF'],
    ['پردازنده', 'مغز شما (اختیاری)'],
    ['حافظه', 'همان‌قدر که لازم داری'],
    ['امنیت', 'یک گربه نگهبان + یک سنجابک'],
    ['آپتایم', up],
  ]

  return (
    <div className="os-scroll flex h-full flex-col items-center overflow-y-auto bg-zinc-950 p-5 text-zinc-100">
      <img
        src="/squirrel-avatar.png"
        alt="سنجابک، نماد سان‌جاب‌او‌اس"
        className="pengo-float h-20 w-20 rounded-3xl border-2 border-[#f7931e]/50 object-cover shadow-lg shadow-[#f7931e]/20"
      />
      <h2 className="mt-3 text-lg font-black">
        <span className="bg-gradient-to-l from-[#f7931e] to-[#8b5cf6] bg-clip-text text-transparent">
          {BRAND.name} {BRAND.version}
        </span>
      </h2>
      <p className="mt-1 text-center text-xs leading-5 text-zinc-400">
        سیستم‌عامل رنگی و بامزهٔ تحت وب — همین‌جا توی مرورگرت زندگی می‌کند.
        <br />
        ترمینال آموزشی، پایتون، نویسا، ماشین‌حساب فول و ۱۰ بازی.
      </p>

      {/* کارت اسپانسری */}
      <a
        href={BRAND.sponsorUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-4 flex w-full max-w-xs items-center gap-3 overflow-hidden rounded-2xl border border-[#f7931e]/40 bg-gradient-to-l from-[#f7931e]/15 via-[#8b5cf6]/15 to-[#0ea5a0]/15 p-3 text-right transition hover:border-[#f7931e]/70 hover:shadow-lg hover:shadow-[#f7931e]/10"
      >
        <img
          src="/squirrel-avatar.png"
          alt="لوگو سان‌جاب"
          className="h-12 w-12 shrink-0 rounded-xl border border-white/20 object-cover"
        />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1 text-sm font-black text-amber-200">
            <Zap size={14} className="text-[#f7931e]" aria-hidden />
            {BRAND.sponsor}
          </span>
          <span className="mt-0.5 block text-[11px] leading-4 text-zinc-400">
            پالت رنگی این سیستم هدیهٔ {BRAND.sponsorSite} است — انتخاب رشته و مشاورهٔ تخصصی
          </span>
        </span>
        <ExternalLink size={14} className="shrink-0 text-zinc-500" aria-hidden />
      </a>

      {/* پالت رنگی */}
      <div className="mt-4 w-full max-w-xs">
        <h3 className="mb-1.5 text-[11px] font-bold text-zinc-500">پالت رنگی سان‌جاب</h3>
        <div className="flex gap-1.5">
          {PALETTE_SWATCHES.map(([c, n]) => (
            <div key={c} className="flex flex-1 flex-col items-center gap-1" title={n}>
              <span
                className="h-7 w-full rounded-lg border border-white/15 shadow-inner"
                style={{ background: c }}
                aria-hidden
              />
              <span className="truncate text-[9px] text-zinc-500">{n}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 w-full max-w-xs overflow-hidden rounded-xl border border-white/10">
        {specs.map(([k, v], i) => (
          <div
            key={k}
            className={`flex items-center justify-between gap-2 px-3 py-2 text-xs ${
              i % 2 === 0 ? 'bg-zinc-900' : 'bg-zinc-900/50'
            }`}
          >
            <span className="shrink-0 text-zinc-500">{k}</span>
            <span className="text-left font-bold text-zinc-200">{v}</span>
          </div>
        ))}
      </div>

      <p className="mt-3 max-w-xs text-center text-[11px] leading-5 text-zinc-500">
        طراحی الهام‌گرفته از پروژه‌های Puter، OS.js، daedalOS و win11React —
        و تصحیح دستورها به سبک thefuck و fish-shell.
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 pb-1">
        <Button
          size="sm"
          variant="secondary"
          onClick={() =>
            pushToast({
              icon: PartyPopper,
              title: 'اعلان تستی',
              body: 'اگر این را می‌بینی، یعنی سیستم اعلان کار می‌کند. آفرین به ما!',
            })
          }
        >
          <PartyPopper className="size-4" />
          یه اعلان تستی بفرست
        </Button>
        <Button size="sm" variant="outline" onClick={restartOS}>
          <RotateCcw className="size-4" />
          ری‌استارت سیستم
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() =>
            pushToast({
              icon: Cat,
              title: 'گربه نگهبان',
              body: 'گزارش وضعیت: همه‌چیز امن است. فندقِ سنجابک هم امن است.',
            })
          }
        >
          <ShieldCheck className="size-4" />
          وضعیت امنیت
        </Button>
      </div>
    </div>
  )
}
