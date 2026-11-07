'use client'

/* ====================================================================
   «راهنمای سنجابک» — دستیار همه‌جای سیستم
   * پاسخ‌های محلی از رجیستری کمک (help.ts) — بدون اینترنت کار می‌کند
   * حالت «این چیه؟»: کاربر روی هر عنصر میزکار کلیک می‌کند و توضیح می‌گیرد
   * پاسخ هوشمند اختیاری با AI (اپ + سرور /api/guide؛ بدون کلید در کلاینت)
   ==================================================================== */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  BookOpen,
  CircleHelp,
  Crosshair,
  ExternalLink,
  Loader2,
  MousePointerClick,
  Search,
  Send,
  Sparkles,
  Wrench,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useOS } from '@/lib/os/store'
import { launch } from '@/lib/os/apps'
import {
  HELP_CATEGORIES,
  HELP_REGISTRY,
  REGION_HELP,
  getHelp,
  type HelpMeta,
} from '@/lib/os/help'
import { faNormalize } from '@/lib/os/fa'

const INTERNET_LABEL: Record<HelpMeta['internet'], { text: string; cls: string }> = {
  none: { text: 'بدون اینترنت', cls: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300' },
  'first-use': { text: 'فقط بار اول دانلود', cls: 'border-amber-400/40 bg-amber-400/10 text-amber-300' },
  required: { text: 'نیازمند اینترنت', cls: 'border-rose-400/40 bg-rose-400/10 text-rose-300' },
}

const OFFLINE_LABEL: Record<HelpMeta['offline'], string> = {
  full: 'کاملاً آفلاین',
  partial: 'آفلاین با دانلود اولیه',
  no: 'آنلاین',
}

const CAT_LABEL: Record<HelpMeta['category'], string> = Object.fromEntries(
  HELP_CATEGORIES.map((c) => [c.id, c.label])
) as Record<HelpMeta['category'], string>

/* ============================ اپ اصلی ============================ */

export default function GuideApp() {
  const pushToast = useOS((s) => s.pushToast)
  const reduce = useReducedMotion()

  const [query, setQuery] = useState('')
  const [cat, setCat] = useState<HelpMeta['category'] | 'all'>('all')
  const [selected, setSelected] = useState<HelpMeta | null>(null)
  const [pickMode, setPickMode] = useState(false)
  const [picked, setPicked] = useState<{ label: string; desc: string } | null>(null)

  /* ---------- پاسخ هوشمند اختیاری ---------- */
  const [aiQ, setAiQ] = useState('')
  const [aiBusy, setAiBusy] = useState(false)
  const [aiAnswer, setAiAnswer] = useState('')
  const [aiErr, setAiErr] = useState('')
  const aiSeenRef = useRef(false)

  const results = useMemo(() => {
    const q = faNormalize(query)
    return Object.values(HELP_REGISTRY).filter((h) => {
      if (cat !== 'all' && h.category !== cat) return false
      if (!q) return true
      return (
        faNormalize(h.name).includes(q) ||
        faNormalize(h.desc).includes(q) ||
        faNormalize(h.purpose).includes(q) ||
        h.features.some((f) => faNormalize(f).includes(q))
      )
    })
  }, [query, cat])

  /* ---------- حالت «این چیه؟» — گوش‌دادن سراسری ---------- */
  useEffect(() => {
    if (!pickMode) return
    const onOver = (e: MouseEvent) => {
      const el = (e.target as HTMLElement)?.closest?.('[data-help-id]')
      el?.setAttribute('data-help-hover', '1')
    }
    const onOut = (e: MouseEvent) => {
      const el = (e.target as HTMLElement)?.closest?.('[data-help-id]')
      el?.removeAttribute('data-help-hover')
    }
    const onClick = (e: MouseEvent) => {
      // دکمهٔ «پایان» و کنترل‌های خود راهنما نباید بلعیده شوند
      if ((e.target as HTMLElement)?.closest?.('[data-help-exit]')) return
      const el = (e.target as HTMLElement)?.closest?.('[data-help-id]') as HTMLElement | null
      e.preventDefault()
      e.stopPropagation()
      if (!el) {
        setPicked(null)
        pushToast({
          icon: Crosshair,
          title: 'این ناحیه راهنمای ثبت‌شده ندارد',
          body: 'روی نوار وظیفه، دکمه‌های شروع/پنجره یا میزکار کلیک کن.',
        })
        return
      }
      const id = el.getAttribute('data-help-id') ?? ''
      const region = REGION_HELP.find((r) => r.id === id)
      if (region) {
        setPicked({ label: region.label, desc: region.desc })
      } else {
        setPicked({ label: id, desc: 'توضیحی برای این عنصر ثبت نشده است.' })
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPickMode(false)
    }
    document.addEventListener('mouseover', onOver, true)
    document.addEventListener('mouseout', onOut, true)
    document.addEventListener('click', onClick, true)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mouseover', onOver, true)
      document.removeEventListener('mouseout', onOut, true)
      document.removeEventListener('click', onClick, true)
      window.removeEventListener('keydown', onKey)
      document.querySelectorAll('[data-help-hover]').forEach((el) => el.removeAttribute('data-help-hover'))
    }
  }, [pickMode, pushToast])

  const askAI = useCallback(async () => {
    const q = aiQ.trim()
    if (!q || aiBusy) return
    setAiBusy(true)
    setAiErr('')
    setAiAnswer('')
    try {
      const res = await fetch('/api/guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          appIds: selected ? [selected.appId] : results.slice(0, 3).map((r) => r.appId),
        }),
      })
      const data = (await res.json()) as { answer?: string; error?: string }
      if (!res.ok || !data.answer) throw new Error(data.error ?? 'پاسخی نیامد')
      setAiAnswer(data.answer)
      aiSeenRef.current = true
    } catch (e) {
      setAiErr(e instanceof Error ? e.message : 'نشد — پاسخ‌های محلی همیشه در دسترس‌اند.')
    } finally {
      setAiBusy(false)
    }
  }, [aiQ, aiBusy, selected, results])

  return (
    <div className="os-scroll h-full w-full overflow-y-auto bg-zinc-950">
      {/* نوار حالت بررسی */}
      {pickMode && (
        <div className="sticky top-0 z-30 flex items-center gap-2 border-b border-fuchsia-400/30 bg-fuchsia-500/15 px-4 py-2 text-[11px] font-black text-fuchsia-200 backdrop-blur">
          <MousePointerClick size={13} aria-hidden />
          حالت «این چیه؟» فعال است — روی هر عنصر میزکار کلیک کن.
          <Button size="sm" variant="ghost" className="mr-auto h-6 text-[10px] text-fuchsia-200" data-help-exit onClick={() => setPickMode(false)}>
            <X size={11} aria-hidden />
            پایان
          </Button>
        </div>
      )}

      <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 p-4">
        {/* سربرگ */}
        <motion.header
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-l from-fuchsia-400/10 via-amber-400/10 to-emerald-400/10 p-4"
        >
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-violet-600 text-white shadow-lg" aria-hidden>
              <CircleHelp size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-black text-zinc-100">راهنمای سنجابک</h2>
              <p className="mt-0.5 text-[10.5px] leading-5 text-zinc-400">
                هر اپ، هر دکمه، هر محدودیت — صادقانه. آفلاین جواب می‌دهد.
              </p>
            </div>
            <Button
              size="sm"
              variant={pickMode ? 'default' : 'outline'}
              className={`shrink-0 ${pickMode ? 'bg-fuchsia-600 hover:bg-fuchsia-500' : 'border-fuchsia-400/40 text-fuchsia-200'}`}
              onClick={() => {
                setPickMode((p) => !p)
                setPicked(null)
              }}
              aria-pressed={pickMode}
            >
              <Crosshair size={13} aria-hidden />
              این چیه؟
            </Button>
          </div>
        </motion.header>

        {/* نتیجهٔ حالت بررسی */}
        {picked && (
          <div role="status" className="pengo-fadein rounded-2xl border border-fuchsia-400/30 bg-fuchsia-400/10 p-4">
            <p className="text-[12px] font-black text-fuchsia-200">{picked.label}</p>
            <p className="mt-1 text-[11px] leading-6 text-zinc-300">{picked.desc}</p>
          </div>
        )}

        {/* جستجو + دسته‌ها */}
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-zinc-900/70 p-2">
          <Search size={14} className="shrink-0 text-zinc-500" aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجو در راهنما — مثلاً «بوکمارک» یا «پایتون»…"
            className="min-w-0 flex-1 bg-transparent text-[12px] text-zinc-100 placeholder:text-zinc-600 outline-none"
            aria-label="جستجوی راهنما"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setCat('all')}
            className={`rounded-full border px-3 py-1 text-[10px] font-bold transition ${cat === 'all' ? 'border-amber-400/60 bg-amber-400/15 text-amber-300' : 'border-white/10 text-zinc-500 hover:text-zinc-300'}`}
          >
            همه
          </button>
          {HELP_CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              className={`rounded-full border px-3 py-1 text-[10px] font-bold transition ${cat === c.id ? 'border-amber-400/60 bg-amber-400/15 text-amber-300' : 'border-white/10 text-zinc-500 hover:text-zinc-300'}`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* فهرست نتایج */}
        {selected === null && (
          <div className="flex flex-col gap-2">
            {results.length === 0 && (
              <p className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4 text-center text-[11px] text-zinc-500">
                چیزی پیدا نشد — با کلمهٔ دیگری امتحان کن.
              </p>
            )}
            {results.map((h) => (
              <button
                key={h.appId}
                onClick={() => setSelected(h)}
                className="group rounded-2xl border border-white/10 bg-zinc-900/60 p-3.5 text-right transition hover:border-amber-400/40 hover:bg-zinc-900"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[12.5px] font-black text-zinc-100">{h.name}</span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-bold text-zinc-400">
                    {CAT_LABEL[h.category]}
                  </span>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-black ${INTERNET_LABEL[h.internet].cls}`}>
                    {INTERNET_LABEL[h.internet].text}
                  </span>
                </div>
                <p className="mt-1 text-[11px] leading-5 text-zinc-400">{h.desc}</p>
              </button>
            ))}
          </div>
        )}

        {/* کارت تفصیلی اپ */}
        {selected && (
          <div className="pengo-fadein flex flex-col gap-3">
            <button
              onClick={() => setSelected(null)}
              className="self-start rounded-lg border border-white/10 px-3 py-1.5 text-[10.5px] font-bold text-zinc-300 transition hover:bg-white/10"
            >
              ← برگشت به فهرست
            </button>
            <article className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-[14px] font-black text-zinc-100">{selected.name}</h3>
                <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black ${INTERNET_LABEL[selected.internet].cls}`}>
                  {INTERNET_LABEL[selected.internet].text} — {OFFLINE_LABEL[selected.offline]}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="mr-auto h-7 border-emerald-400/40 text-[10px] text-emerald-300"
                  onClick={() => {
                    launch(selected.appId)
                  }}
                >
                  <ExternalLink size={11} aria-hidden />
                  باز کردن اپ
                </Button>
              </div>
              <p className="mt-2 text-[11.5px] leading-6 text-zinc-300">{selected.desc}</p>

              <Section icon={BookOpen} title="هدف">
                <p className="text-[11px] leading-6 text-zinc-300">{selected.purpose}</p>
              </Section>

              <Section icon={Sparkles} title="امکانات">
                <ul className="flex list-disc flex-col gap-1 pr-4 text-[11px] leading-6 text-zinc-300">
                  {selected.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </Section>

              <Section icon={MousePointerClick} title="چطور استفاده کنم؟">
                <ol className="flex list-decimal flex-col gap-1 pr-4 text-[11px] leading-6 text-zinc-300">
                  {selected.howToUse.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ol>
              </Section>

              {selected.shortcuts.length > 0 && (
                <Section icon={Wrench} title="میان‌برها">
                  <div className="flex flex-wrap gap-1.5">
                    {selected.shortcuts.map((s) => (
                      <span key={s.keys} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-zinc-950/70 px-2 py-1 text-[10px] text-zinc-300">
                        <kbd dir="ltr" className="font-mono font-bold text-amber-200">{s.keys}</kbd>
                        {s.label}
                      </span>
                    ))}
                  </div>
                </Section>
              )}

              <Section icon={Wrench} title="ذخیره‌سازی و مجوزها">
                <p className="text-[11px] leading-6 text-zinc-300">
                  داده‌ها: {selected.storage} — مجوزها: {selected.permissions.join('، ')}
                </p>
              </Section>

              {selected.limitations.length > 0 && (
                <Section icon={CircleHelp} title="محدودیت‌ها (صادقانه)">
                  <ul className="flex list-disc flex-col gap-1 pr-4 text-[11px] leading-6 text-amber-200/90">
                    {selected.limitations.map((l) => (
                      <li key={l}>{l}</li>
                    ))}
                  </ul>
                </Section>
              )}

              {selected.troubleshooting.length > 0 && (
                <Section icon={Wrench} title="رفع اشکال">
                  <div className="flex flex-col gap-1.5">
                    {selected.troubleshooting.map((t) => (
                      <div key={t.problem} className="rounded-xl border border-white/10 bg-zinc-950/60 p-2.5">
                        <p className="text-[11px] font-black text-rose-300">{t.problem}</p>
                        <p className="mt-0.5 text-[10.5px] leading-5 text-zinc-300">{t.fix}</p>
                      </div>
                    ))}
                  </div>
                </Section>
              )}
            </article>
          </div>
        )}

        {/* پاسخ هوشمند اختیاری */}
        <section className="rounded-2xl border border-violet-400/25 bg-violet-400/[0.06] p-4">
          <p className="flex items-center gap-1.5 text-[11px] font-black text-violet-200">
            <Sparkles size={13} aria-hidden />
            پاسخ هوشمند (اختیاری — نیازمند اینترنت)
          </p>
          <p className="mt-1 text-[10px] leading-4 text-zinc-500">
            دانش محلی ملاک است؛ AI فقط بر اساس همان جواب می‌دهد و کلیدها سمت سرور می‌مانند.
          </p>
          <div className="mt-2 flex items-center gap-1.5">
            <input
              value={aiQ}
              onChange={(e) => setAiQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void askAI()
              }}
              placeholder="مثلاً: مرورگر سایت‌ها را چطور باز می‌کند؟"
              className="min-w-0 flex-1 rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-[11.5px] text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-violet-400/60"
              aria-label="پرسش از راهنمای هوشمند"
            />
            <Button
              size="sm"
              className="h-9 shrink-0 bg-violet-600 hover:bg-violet-500"
              onClick={() => void askAI()}
              disabled={aiBusy || !aiQ.trim()}
            >
              {aiBusy ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <Send size={13} aria-hidden />}
            </Button>
          </div>
          {aiErr && (
            <p role="alert" className="mt-2 rounded-lg border border-amber-400/30 bg-amber-400/10 p-2 text-[10.5px] leading-5 text-amber-200">
              {aiErr} — پاسخ‌های محلی بالا همیشه کار می‌کنند.
            </p>
          )}
          {aiAnswer && (
            <div role="status" className="pengo-fadein mt-2 rounded-xl border border-white/10 bg-zinc-950/70 p-3">
              <p className="whitespace-pre-wrap text-[11.5px] leading-6 text-zinc-200">{aiAnswer}</p>
            </div>
          )}
        </section>

        <p className="pb-2 text-center text-[10px] leading-5 text-zinc-600">
          راهنمای سنجابک — بخشی از سان‌جاب‌اواس {selected ? '' : ''}با اسپانسری سان‌جاب
        </p>
      </div>
    </div>
  )
}

/* ------------------------- بخش کارت ------------------------- */

function Section({ icon: Icon, title, children }: { icon: typeof BookOpen; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-3 border-t border-white/5 pt-3">
      <p className="mb-1.5 flex items-center gap-1.5 text-[10.5px] font-black text-zinc-400">
        <Icon size={12} className="text-amber-300" aria-hidden />
        {title}
      </p>
      {children}
    </section>
  )
}
