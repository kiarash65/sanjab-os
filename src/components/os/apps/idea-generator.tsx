'use client'

import { useEffect, useRef, useState } from 'react'
import { Bot, Copy, Loader2, Sparkles, Star, X } from 'lucide-react'
import { useOS } from '@/lib/os/store'
import { launch } from '@/lib/os/apps'
import { Button } from '@/components/ui/button'
import { aiComplete, loadAICfg, type ChatMsg } from '@/lib/os/integrations'

const SUBJECTS = [
  'گربه‌ها',
  'پیتزا',
  'جاروبرقی‌ها',
  'کوهنوردی',
  'همسایه‌ها',
  'سس مایونز',
  'لاغری',
  'خوابیدن',
  'خرگوش‌ها',
  'ترافیک',
  'موشک',
  'چای',
]

const TECHS = [
  'هوش مصنوعی',
  'بلاکچین',
  'واقعیت مجازی',
  'نت‌های کوانتومی',
  'انرژی چای',
  'عصاره پنگوئن',
  'اینترنت اشیا',
  'رباتیک',
]

const OUTCOMES = [
  'دنیا را نجات می‌دهد',
  'صبح‌ها شما را بیدار می‌کند',
  'مالیات می‌دهد',
  'آواز می‌خواند',
  'پیتزا سفارش می‌دهد',
  'همه‌چیز را فراموش می‌کند',
  'در مسابقات قهرمان می‌شود',
  'دوستی‌ها را قوی‌تر می‌کند',
]

const TEMPLATES: ((subject: string, tech: string, outcome: string) => string)[] = [
  (subject, tech, outcome) => `یک اپلیکیشن که ${subject} را با ${tech} ترکیب می‌کند تا ${outcome}!`,
  (subject, tech, outcome) =>
    `استارتاپی که برای ${subject} از ${tech} استفاده می‌کند و قرار است ${outcome}!`,
  (subject, tech, outcome) => `سرویس اشتراکی ${subject} + ${tech}: قرار است ${outcome}!`,
]

const SERIOUS_LINES = [
  'بهش سرمایه می‌زنم... نه صبر کن، شوخی کردم.',
  'این دقیقاً همون چیزیه که هیچ‌کس نمی‌خواست. تبریک!',
  'اسلاید اول پاورپوینت آماده‌ست: «انقلاب در...»',
  'فقط یه سرمایه‌گذار خیلی مهربون کم داری.',
  'با این ایده حداقل یه پادکست می‌سازی.',
]

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

const IDEAS_KEY = 'pengo-ideas'
const MAX_FAVORITES = 8

export default function IdeaGeneratorApp() {
  const pushToast = useOS((s) => s.pushToast)

  const [idea, setIdea] = useState<string | null>(null)
  const [popKey, setPopKey] = useState(0)
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(IDEAS_KEY)
      if (raw) {
        const parsed: unknown = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          return parsed
            .filter((x): x is string => typeof x === 'string')
            .slice(0, MAX_FAVORITES)
        }
      }
    } catch {
      /* داده خراب بود، بی‌خیال */
    }
    return []
  })

  useEffect(() => {
    try {
      localStorage.setItem(IDEAS_KEY, JSON.stringify(favorites))
    } catch {
      /* حافظه پر یا قفل بود، بی‌خیال */
    }
  }, [favorites])

  const generate = () => {
    const template = pick(TEMPLATES)
    setIdea(template(pick(SUBJECTS), pick(TECHS), pick(OUTCOMES)))
    setPopKey((k) => k + 1)
    setAiAnalysis(null)
  }

  const analyzeWithAI = async () => {
    if (!idea) return
    const cfg = loadAICfg()
    if (!cfg) {
      pushToast({
        icon: '🤖',
        title: 'هوش‌یار وصل نیست',
        body: 'اول در «هوش‌یار» کلید API بزن، بعد ایده را تحلیل کن!',
      })
      launch('ai-chat')
      return
    }
    setAnalyzing(true)
    setAiAnalysis(null)
    try {
      const messages: ChatMsg[] = [
        {
          role: 'system',
          content:
            'تو یک تحلیل‌گر استارتاپ بامزه و خوش‌بین هستی. کاربر یک ایده عجیب می‌دهد و تو باید در ۳-۴ جمله کوتاه فارسی، آن را طوری تحلیل کنی که هم خنده‌دار باشد و هم کمی جدی. نقاط قوت، چالش‌ها و یک پیشنهاد خنده‌دار بده. از ایموجی استفاده کن.',
        },
        {
          role: 'user',
          content: `این ایده را تحلیل کن:\n«${idea}»`,
        },
      ]
      const text = await aiComplete(messages, cfg)
      setAiAnalysis(text)
    } catch (err) {
      pushToast({
        icon: '😬',
        title: 'تحلیل نشد',
        body: err instanceof Error ? err.message : 'خطای هوش مصنوعی',
      })
    } finally {
      setAnalyzing(false)
    }
  }

  const takeSeriously = () => {
    pushToast({ icon: '🧐', title: 'جدی گرفتی؟', body: pick(SERIOUS_LINES) })
  }

  const copyIdea = async () => {
    if (!idea) return
    try {
      await navigator.clipboard.writeText(idea)
      pushToast({ icon: '📋', title: 'کپی شد!', body: 'برو سرمایه‌گذار پیدا کن 💸' })
    } catch {
      pushToast({ icon: '😬', title: 'کپی نشد', body: 'مرورگرت گیر داد. دستی تایپ کن!' })
    }
  }

  const saveFavorite = () => {
    if (!idea) return
    if (favorites.includes(idea)) {
      pushToast({ icon: '⭐', title: 'قبلاً ذخیره شده', body: 'دوست داری این ایده رو دوتا داشته باشی؟' })
      return
    }
    if (favorites.length >= MAX_FAVORITES) {
      pushToast({ icon: '📚', title: 'لیست پره', body: 'اول یکی از ایده‌های کم‌جونش رو حذف کن' })
      return
    }
    setFavorites((f) => [...f, idea])
    pushToast({ icon: '⭐', title: 'نجاتش دادی', body: 'ایده به موزه‌ی عجایب رفت' })
  }

  const removeFavorite = (index: number) => {
    setFavorites((f) => f.filter((_, i) => i !== index))
  }

  return (
    <div className="h-full w-full">
      <div className="os-scroll flex h-full flex-col items-center overflow-y-auto p-4">
        <div className="flex w-full max-w-md flex-col gap-4">
          <div className="text-center">
            <p className="text-3xl" aria-hidden>
              💡
            </p>
            <h2 className="text-base font-black text-zinc-100">مولد ایده عجیب</h2>
            <p className="text-[11px] text-zinc-500">
              استارتاپ‌هایی که هیچ‌کس درخواستش نکرده بود
            </p>
          </div>

          <div className="relative flex min-h-32 items-center justify-center rounded-2xl border border-white/10 bg-zinc-900/70 p-4 text-center">
            {idea && (
              <button
                type="button"
                onClick={saveFavorite}
                title="ذخیره در ایده‌های عجیب"
                aria-label="ذخیره ایده"
                className="absolute left-2 top-2 grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-zinc-950/70 text-zinc-400 transition hover:text-[var(--pengo-accent)]"
              >
                <Star className="size-4" />
              </button>
            )}
            {idea ? (
              <p key={popKey} className="pengo-pop text-lg font-bold leading-8 text-zinc-100">
                {idea}
              </p>
            ) : (
              <p className="text-sm leading-6 text-zinc-500">
                دکمه‌ی پایین رو بزن تا یه فاجعه‌ی تجاری تولید کنیم
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button
              onClick={generate}
              className="bg-[var(--pengo-accent)] font-bold text-zinc-950 hover:brightness-110"
            >
              💡 یه ایده عجیب بده!
            </Button>
            {idea && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => void analyzeWithAI()}
                  disabled={analyzing}
                  className="gap-1.5 bg-gradient-to-l from-[#8b5cf6] to-[#7c3aed] text-white hover:brightness-110"
                >
                  {analyzing ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Bot className="size-3.5" />
                  )}
                  تحلیل با هوش‌یار
                </Button>
                <Button variant="secondary" size="sm" onClick={takeSeriously}>
                  جدی‌ش بگیر 🧐
                </Button>
                <Button variant="outline" size="sm" onClick={copyIdea}>
                  <Copy className="size-4" />
                  کپی 📋
                </Button>
              </>
            )}
          </div>

          {/* تحلیل هوش مصنوعی */}
          {(analyzing || aiAnalysis) && (
            <div className="rounded-2xl border border-violet-500/30 bg-violet-500/10 p-3">
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-violet-300">
                <Sparkles className="size-3.5" />
                تحلیل هوش‌یار
              </h3>
              {analyzing ? (
                <div className="flex items-center gap-2 text-[11px] text-violet-300/70">
                  <Loader2 className="size-3.5 animate-spin" />
                  هوش‌یار داره به ایده نگاه می‌کنه…
                </div>
              ) : (
                <p className="whitespace-pre-wrap text-[11px] leading-6 text-violet-100/90">
                  {aiAnalysis}
                </p>
              )}
            </div>
          )}

          <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-3">
            <h3 className="mb-2 text-xs font-bold text-zinc-500">⭐ ایده‌های ذخیره‌شده</h3>
            {favorites.length === 0 ? (
              <p className="text-[11px] leading-5 text-zinc-600">
                هنوز هیچ ایده عجیبی رو نجات ندادی
              </p>
            ) : (
              <ul className="space-y-1">
                {favorites.map((fav, i) => (
                  <li
                    key={`${i}-${fav}`}
                    className="flex items-center gap-2 rounded-lg bg-zinc-950/60 px-2 py-1.5"
                  >
                    <span className="min-w-0 flex-1 truncate text-xs text-zinc-300">{fav}</span>
                    <button
                      type="button"
                      onClick={() => removeFavorite(i)}
                      aria-label="حذف ایده"
                      className="shrink-0 text-zinc-600 transition hover:text-rose-400"
                    >
                      <X className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <p className="pb-1 text-center text-[10px] text-zinc-600">
            ما هیچ مسئولیتی در قبال استارتاپ‌های شکست‌خورده نداریم 😌
          </p>
        </div>
      </div>
    </div>
  )
}
