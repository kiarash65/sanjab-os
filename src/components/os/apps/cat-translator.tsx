'use client'

import { useState } from 'react'
import { useOS } from '@/lib/os/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Mode = 'human-to-cat' | 'cat-to-human'

interface HistoryEntry {
  id: number
  mode: Mode
  text: string
}

const MEOWS = ['میو', 'میوو', 'مِیائو', 'می؟', 'میاآآ', 'پوررر']

const CAT_SENTENCES = [
  'ساعت غذاست. دقیقاً همیشه غذاست.',
  'تابلوی دیواریت رو کشیدم. خوشگل‌تر شد.',
  'به لپ‌تاپت گفتم نیای روی کیبورد. گفت باشه.',
  'وقتی نمی‌بینی از پنجره نگاهت می‌کنم. همیشه.',
  'اون جعبه مقوایی مال منه. مال من.',
  'عاشقتم ولی الان بیا غذا.',
  'فکر می‌کنم موسِ کامپیوترت حرکت می‌کنه. باید بگیرمش.',
  'استراحت کردن یک هنر است و من استادم.',
  'دیشب تا صبح دویدم. دلیلش هیچ‌کس نپرسید.',
  'به تو نیاز دارم... بیدار شو. ساعت ۴ صبحه.',
]

const CAT_ASCII = ' /\\_/\\\n( o.o )\n > ^ <'

let entrySeq = 0

function meowifySentence(sentence: string): string {
  return sentence
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      const count = 1 + Math.floor(Math.random() * 3)
      const meows: string[] = []
      for (let i = 0; i < count; i++) {
        meows.push(MEOWS[Math.floor(Math.random() * MEOWS.length)])
      }
      return meows.join(' ')
    })
    .join(' ')
}

export default function CatTranslatorApp() {
  const sound = useOS((s) => s.settings.sound)
  const pushToast = useOS((s) => s.pushToast)

  const [mode, setMode] = useState<Mode>('human-to-cat')
  const [humanText, setHumanText] = useState('')
  const [catOutput, setCatOutput] = useState('')
  const [humanOutput, setHumanOutput] = useState('')
  const [history, setHistory] = useState<HistoryEntry[]>([])

  const addHistory = (entryMode: Mode, text: string) => {
    entrySeq += 1
    setHistory((h) => [{ id: entrySeq, mode: entryMode, text }, ...h].slice(0, 3))
  }

  const translateToCat = () => {
    const text = humanText.trim()
    if (!text) {
      pushToast({ icon: '🐱', title: 'چیزی برای ترجمه نیست', body: 'یه جمله بنویس، حتی «بیا غذا»' })
      return
    }
    const translated = text
      .split(/[.!?؟…]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map(meowifySentence)
      .join('. نُ ')
    setCatOutput(translated)
    addHistory('human-to-cat', translated)
  }

  const translateToHuman = () => {
    const sentence = CAT_SENTENCES[Math.floor(Math.random() * CAT_SENTENCES.length)]
    setHumanOutput(sentence)
    addHistory('cat-to-human', sentence)
  }

  const playMeow = () => {
    if (!sound) {
      pushToast({ icon: '🔇', title: 'صدا خاموشه', body: 'از تسک‌بار یا تنظیمات وصلش کن' })
      return
    }
    try {
      const ctx = new AudioContext()
      const t0 = ctx.currentTime

      const osc = ctx.createOscillator()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(750, t0)
      osc.frequency.exponentialRampToValueAtTime(380, t0 + 0.35)

      const lfo = ctx.createOscillator()
      lfo.frequency.value = 6
      const lfoGain = ctx.createGain()
      lfoGain.gain.value = 30
      lfo.connect(lfoGain)
      lfoGain.connect(osc.frequency)

      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0.0001, t0)
      gain.gain.exponentialRampToValueAtTime(0.22, t0 + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.4)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(t0)
      lfo.start(t0)
      osc.stop(t0 + 0.45)
      lfo.stop(t0 + 0.45)
      osc.onended = () => {
        ctx.close().catch(() => {})
      }
    } catch {
      pushToast({ icon: '🔇', title: 'میاو پخش نشد', body: 'مرورگرت این میاو را بلد نیست' })
    }
  }

  return (
    <div className="h-full w-full">
      <div className="os-scroll flex h-full flex-col gap-3 overflow-y-auto p-4">
        <div className="flex items-center gap-3">
          <pre
            dir="ltr"
            aria-hidden
            className="pengo-pop shrink-0 text-2xl leading-6 text-[var(--pengo-accent)]"
          >
            {CAT_ASCII}
          </pre>
          <div className="min-w-0">
            <h2 className="text-base font-black text-zinc-100">مترجم گربه‌ای 🐱</h2>
            <p className="text-[11px] text-zinc-500">دقت ترجمه: ۹۹٪ (طبق گفته خود گربه)</p>
          </div>
        </div>

        <div className="flex gap-1 self-start rounded-xl border border-white/10 bg-zinc-900/70 p-1">
          <Button
            size="sm"
            variant={mode === 'human-to-cat' ? 'secondary' : 'ghost'}
            aria-pressed={mode === 'human-to-cat'}
            onClick={() => setMode('human-to-cat')}
            className={
              mode === 'human-to-cat'
                ? 'bg-[var(--pengo-accent)] font-bold text-zinc-950 hover:brightness-110'
                : 'text-zinc-400'
            }
          >
            انسان → گربه
          </Button>
          <Button
            size="sm"
            variant={mode === 'cat-to-human' ? 'secondary' : 'ghost'}
            aria-pressed={mode === 'cat-to-human'}
            onClick={() => setMode('cat-to-human')}
            className={
              mode === 'cat-to-human'
                ? 'bg-[var(--pengo-accent)] font-bold text-zinc-950 hover:brightness-110'
                : 'text-zinc-400'
            }
          >
            گربه → انسان
          </Button>
        </div>

        {mode === 'human-to-cat' ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={humanText}
                onChange={(e) => setHumanText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') translateToCat()
                }}
                placeholder="چیزی بنویس..."
                className="flex-1"
              />
              <Button
                onClick={translateToCat}
                className="shrink-0 bg-[var(--pengo-accent)] font-bold text-zinc-950 hover:brightness-110"
              >
                ترجمه کن 🐱
              </Button>
            </div>

            {catOutput && (
              <div className="rounded-xl border border-white/10 bg-zinc-900/70 p-3">
                <p className="mb-1 text-[11px] text-zinc-500">گربه شما می‌گوید:</p>
                <p className="text-lg font-bold leading-8 text-emerald-300">{catOutput}</p>
                <div className="mt-3 flex items-end justify-between gap-3">
                  <pre dir="ltr" aria-hidden className="text-[11px] leading-4 text-zinc-500">
                    {CAT_ASCII}
                  </pre>
                  <Button size="sm" variant="outline" onClick={playMeow}>
                    پخش میاو 🔊
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span
                title="شوخی کردیم؛ هیچ میاو ضبط‌شده‌ای وجود ندارد"
                className="rounded-md border border-dashed border-white/15 px-2 py-1 text-[11px] text-zinc-500"
              >
                یه میاو ضبط‌شده گوش بده
              </span>
              <Button
                onClick={translateToHuman}
                className="bg-[var(--pengo-accent)] font-bold text-zinc-950 hover:brightness-110"
              >
                ترجمه کن 🐈
              </Button>
            </div>

            {humanOutput && (
              <div className="rounded-xl border border-white/10 bg-zinc-900/70 p-3">
                <p className="mb-1 text-[11px] text-zinc-500">گربه‌ات این را می‌خواست بگوید:</p>
                <p className="text-sm font-bold leading-7 text-zinc-100">{humanOutput}</p>
              </div>
            )}
          </div>
        )}

        {history.length > 0 && (
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold text-zinc-500">تاریخچه ترجمه‌ها</h3>
            {history.map((entry) => (
              <div
                key={entry.id}
                className="rounded-lg border border-white/10 bg-zinc-900/50 px-2.5 py-1.5"
              >
                <p className="text-[10px] text-zinc-600">
                  {entry.mode === 'human-to-cat' ? 'انسان → گربه' : 'گربه → انسان'}
                </p>
                <p className="truncate text-[11px] text-zinc-400">{entry.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
