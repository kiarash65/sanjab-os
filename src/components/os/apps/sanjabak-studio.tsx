'use client'

/* ------------------------------------------------------------------ */
/* استودیو سنجابک — شخصی‌سازی ماسکوت با پیش‌نمایش لحظه‌ای              */
/* آیتم‌های قفل‌شده دلیل قفل را نشان می‌دهند؛ باز شدن با فعالیت واقعی   */
/* آموزشی است — بدون Loot Box و بدون پاداش تصادفی.                     */
/* ------------------------------------------------------------------ */

import { useEffect, useMemo } from 'react'
import { Lock, RotateCcw, Sparkles, Unlock } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { SanjabakAvatar } from '@/components/os/sanjabak/Sanjabak'
import {
  DEFAULT_LOOK,
  LAYER_TITLES,
  MASCOT_ITEMS,
  invalidateUnlockCache,
  isUnlocked,
  useMascot,
  type MascotLayer,
} from '@/lib/os/mascot-store'
import { useLearning } from '@/lib/learning/store'

const fa = (n: number | string) => String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)])

const LAYERS: MascotLayer[] = ['fur', 'eye', 'glasses', 'hat', 'outfit', 'held', 'bg']

const POSES: { id: 'sit' | 'wave' | 'cheer' | 'read'; label: string }[] = [
  { id: 'sit', label: 'نشسته' },
  { id: 'wave', label: 'سلام' },
  { id: 'cheer', label: 'شادی' },
  { id: 'read', label: 'کتاب‌خوان' },
]

export default function SanjabakStudioApp() {
  const mascot = useMascot()
  const events = useLearning((s) => s.profile.events)

  /* با هر رویداد یادگیری، شرط قفل‌ها دوباره بررسی می‌شود */
  useEffect(() => {
    invalidateUnlockCache()
  }, [events.length])

  const eventsLen = events.length
  const byLayer = useMemo(() => {
    void eventsLen
    const map: Record<MascotLayer, typeof MASCOT_ITEMS> = {
      fur: [],
      eye: [],
      glasses: [],
      hat: [],
      outfit: [],
      held: [],
      bg: [],
    }
    for (const item of MASCOT_ITEMS) map[item.layer].push(item)
    return map
  }, [eventsLen])

  const unlockedCount = MASCOT_ITEMS.filter((i) => isUnlocked(i)).length

  return (
    <div className="flex h-full min-h-0" dir="rtl">
      {/* پیش‌نمایش لحظه‌ای */}
      <div className="flex w-44 shrink-0 flex-col items-center gap-2 border-e border-white/10 bg-zinc-950/50 p-3">
        <div className="grid place-items-center rounded-2xl border border-white/10 bg-black/30 p-1">
          <SanjabakAvatar size={128} mood="happy" />
        </div>
        <input
          value={mascot.name}
          onChange={(e) => mascot.setName(e.target.value)}
          maxLength={24}
          aria-label="نام سنجابک"
          className="w-full rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-center text-[12px] font-black text-zinc-100 outline-none focus:border-amber-400/50"
        />
        <div className="grid w-full grid-cols-2 gap-1">
          {POSES.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => mascot.setPose(p.id)}
              aria-pressed={mascot.look.pose === p.id}
              className={`rounded-lg py-1.5 text-[10px] font-bold transition ${
                mascot.look.pose === p.id
                  ? 'bg-amber-400/20 text-amber-300'
                  : 'bg-white/5 text-zinc-400 hover:bg-white/10'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="mt-auto w-full space-y-1.5">
          <div className="flex items-center justify-between rounded-lg bg-black/30 px-2 py-1.5">
            <span className="text-[10px] font-bold text-zinc-300">واکنش‌های زنده</span>
            <Switch
              checked={mascot.reactions}
              onCheckedChange={mascot.setReactions}
              aria-label="واکنش‌های سنجابک روی میزکار"
            />
          </div>
          <button
            type="button"
            onClick={mascot.resetLook}
            className="flex w-full items-center justify-center gap-1 rounded-lg bg-white/5 py-1.5 text-[10px] font-bold text-zinc-400 transition hover:bg-white/10"
          >
            <RotateCcw size={11} aria-hidden />
            بازگشت به ظاهر پیش‌فرض
          </button>
          <p className="text-center text-[9px] text-zinc-600" dir="ltr">
            {fa(unlockedCount)}/{fa(MASCOT_ITEMS.length)} آیتم
          </p>
        </div>
      </div>

      {/* انتخابگرها */}
      <div className="os-scroll min-w-0 flex-1 space-y-4 overflow-y-auto p-3">
        <p className="flex items-center gap-1.5 text-[11px] leading-5 text-zinc-400">
          <Sparkles size={13} className="text-amber-400" aria-hidden />
          آیتم‌ها با فعالیت واقعی آموزشی باز می‌شوند — دلیل هر قفل شفاف است.
        </p>

        {LAYERS.map((layer) => (
          <section key={layer}>
            <h3 className="mb-1.5 text-[12px] font-black text-zinc-200">{LAYER_TITLES[layer]}</h3>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {byLayer[layer].map((item) => {
                const open = isUnlocked(item)
                const active = mascot.look[layer] === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={!open}
                    onClick={() => mascot.setLayer(layer, item.id)}
                    aria-pressed={active}
                    className={`rounded-xl border p-2 text-start transition ${
                      active
                        ? 'border-amber-400/60 bg-amber-400/15'
                        : open
                          ? 'border-white/10 bg-black/25 hover:border-white/25 hover:bg-white/5'
                          : 'cursor-not-allowed border-white/5 bg-black/40 opacity-55'
                    }`}
                  >
                    <p className="flex items-center gap-1 text-[11px] font-black text-zinc-100">
                      {!open ? (
                        <Lock size={10} className="shrink-0 text-zinc-500" aria-hidden />
                      ) : active ? (
                        <Unlock size={10} className="shrink-0 text-amber-400" aria-hidden />
                      ) : null}
                      {item.title}
                    </p>
                    {item.unlock && (
                      <p className={`mt-0.5 text-[9px] leading-4 ${open ? 'text-emerald-400/80' : 'text-zinc-500'}`}>
                        {open ? '✓ باز شد' : `🔒 ${item.unlock.desc}`}
                      </p>
                    )}
                  </button>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
