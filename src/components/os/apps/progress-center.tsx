'use client'

/* ------------------------------------------------------------------ */
/* مرکز پیشرفت سان‌جاب، نمایش XP، سطح، استریک، مأموریت روزانه و      */
/* دستاوردها. داده‌ها از موتور گیمیفیکیشن مرکزی می‌آیند.              */
/* ------------------------------------------------------------------ */

import {
  Award,
  Flame,
  Lock,
  ScrollText,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import {
  ACHIEVEMENTS,
  levelOf,
  questOfTheDay,
  todayKey,
  useGame,
  xpForLevel,
} from '@/lib/gamification/engine'

const TRACK_LABELS: { key: 'linux' | 'python' | 'rust' | 'ai' | 'powershell'; label: string; tint: string }[] = [
  { key: 'linux', label: 'آکادمی لینوکس', tint: '#f7931e' },
  { key: 'python', label: 'آکادمی پایتون', tint: '#2dd4bf' },
  { key: 'rust', label: 'آکادمی Rust', tint: '#b7410e' },
  { key: 'ai', label: 'آکادمی هوش مصنوعی', tint: '#8b5cf6' },
  { key: 'powershell', label: 'آکادمی پاورشل', tint: '#5391fe' },
]

const fa = (n: number | string) => String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)])

export default function ProgressCenterApp() {
  const game = useGame()
  const level = levelOf(game.xp)
  const curFloor = xpForLevel(level)
  const nextFloor = xpForLevel(level + 1)
  const pct = Math.min(100, Math.round(((game.xp - curFloor) / Math.max(1, nextFloor - curFloor)) * 100))
  const quest = questOfTheDay()
  const questDone = game.events.some(
    (e) => e.id === `quest:${todayKey()}` || e.id.startsWith('quest:') && e.at > Date.now() - 86_400_000
  )

  return (
    <div className="os-scroll h-full w-full overflow-y-auto p-4">
      {/* کارت سطح */}
      <div className="mb-4 rounded-2xl border border-white/10 bg-gradient-to-l from-[#f7931e]/15 via-violet-500/10 to-transparent p-4">
        <div className="flex items-center gap-3">
          <div className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-[#f7931e] to-[#e07b00] text-lg font-black text-white shadow-lg">
            {fa(level)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-zinc-100">
              سطح {fa(level)}، سنجابکِ در حال رشد
            </p>
            <p className="mt-0.5 text-[11px] text-zinc-400">
              {fa(game.xp)} XP · تا سطح بعد {fa(Math.max(0, nextFloor - game.xp))} XP
            </p>
            <Progress value={pct} className="mt-2 h-2" aria-label="پیشرفت سطح" />
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl border border-white/10 bg-black/25 p-2">
            <p className="flex items-center justify-center gap-1 text-[10px] text-zinc-500">
              <Flame size={11} className="text-orange-400" />
              زنجیره روزها
            </p>
            <p className="text-base font-black text-orange-300">{fa(game.streakCount)} روز</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/25 p-2">
            <p className="flex items-center justify-center gap-1 text-[10px] text-zinc-500">
              <Trophy size={11} className="text-amber-400" />
              دستاورد
            </p>
            <p className="text-base font-black text-amber-300">
              {fa(game.achievements.length)}/{fa(ACHIEVEMENTS.length)}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/25 p-2">
            <p className="flex items-center justify-center gap-1 text-[10px] text-zinc-500">
              <Sparkles size={11} className="text-violet-400" />
              رویدادها
            </p>
            <p className="text-base font-black text-violet-300">{fa(game.events.length)}</p>
          </div>
        </div>
      </div>

      {/* مأموریت روزانه */}
      <div className="mb-4 rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
        <p className="mb-1 flex items-center gap-1.5 text-xs font-black text-zinc-200">
          <Target size={14} className="text-teal-400" />
          مأموریت روزانه
        </p>
        <div className="flex items-center justify-between gap-2">
          <p className="text-[12px] text-zinc-300">{quest.label}</p>
          {questDone ? (
            <span className="rounded-lg bg-emerald-500/15 px-2.5 py-1 text-[10px] font-black text-emerald-300">
              انجام شد! +{fa(quest.xp)} XP
            </span>
          ) : (
            <span className="rounded-lg bg-zinc-800 px-2.5 py-1 text-[10px] font-black text-zinc-400">
              +{fa(quest.xp)} XP منتظر توست
            </span>
          )}
        </div>
      </div>

      {/* پیشرفت رشته‌ها */}
      <div className="mb-4 rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
        <p className="mb-2 text-xs font-black text-zinc-200">مسیر یادگیری</p>
        <div className="grid grid-cols-2 gap-2">
          {TRACK_LABELS.map((t) => (
            <div key={t.key} className="rounded-xl border border-white/10 bg-black/25 p-2.5">
              <p className="text-[11px] font-bold" style={{ color: t.tint }}>
                {t.label}
              </p>
              <p className="mt-1 text-lg font-black text-zinc-100">
                {fa(game.lessons[t.key])}
                <span className="text-[10px] font-normal text-zinc-500"> فعالیت درس/تمرین</span>
              </p>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[10px] leading-5 text-zinc-500">
          درس‌ها را از آکادمی‌ها و کداستودیو کامل کن؛ هر رویداد فقط یک‌بار امتیاز می‌دهد (ضد فارم XP).
        </p>
      </div>

      {/* دستاوردها */}
      <div className="mb-4 rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
        <p className="mb-2 text-xs font-black text-zinc-200">دستاوردها</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {ACHIEVEMENTS.map((a) => {
            const earned = game.achievements.includes(a.id)
            return (
              <div
                key={a.id}
                className={`rounded-xl border p-2.5 transition ${
                  earned
                    ? 'border-amber-500/40 bg-amber-500/10'
                    : 'border-white/10 bg-black/20 opacity-60'
                }`}
              >
                <p className="flex items-center gap-1 text-[11px] font-black text-zinc-100">
                  {earned ? <Award size={12} className="text-amber-400" /> : <Lock size={11} className="text-zinc-500" />}
                  {a.title}
                </p>
                <p className="mt-0.5 text-[10px] leading-4 text-zinc-400">{a.desc}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* تاریخچه اخیر */}
      <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-black text-zinc-200">
          <ScrollText size={14} className="text-zinc-400" />
          آخرین رویدادها
        </p>
        <div className="os-scroll max-h-44 space-y-1 overflow-y-auto">
          {[...game.events].reverse().slice(0, 40).map((e) => (
            <div
              key={e.id + e.at}
              className="flex items-center justify-between gap-2 rounded-lg bg-black/25 px-2.5 py-1.5"
            >
              <span className="truncate text-[11px] text-zinc-300">{e.label}</span>
              <span className="shrink-0 text-[10px] font-bold text-teal-300">+{fa(e.xp)} XP</span>
            </div>
          ))}
          {game.events.length === 0 && (
            <p className="py-3 text-center text-[11px] text-zinc-500">
              هنوز چیزی اینجاست نشده، برو یه درس بگذران یا یه بازی کن!
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
