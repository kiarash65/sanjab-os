'use client'

import { useMemo, useState } from 'react'
import { Copy, Dices, History, ShieldAlert, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useOS } from '@/lib/os/store'
import { SUNJOB_PALETTE } from '@/lib/os/brand'

interface PassOptions {
  upper: boolean
  lower: boolean
  digits: boolean
  symbols: boolean
  noConfusing: boolean
}

const CHAR_SETS: Record<'upper' | 'lower' | 'digits' | 'symbols', string> = {
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lower: 'abcdefghijklmnopqrstuvwxyz',
  digits: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{};:,.<>?/~',
}

const CONFUSING_CHARS = 'O0lI1'
const MIN_LEN = 6
const MAX_LEN = 40

const OPT_COLORS = {
  upper: SUNJOB_PALETTE.violet,
  lower: SUNJOB_PALETTE.teal,
  digits: SUNJOB_PALETTE.orange,
  symbols: SUNJOB_PALETTE.rose,
  noConfusing: SUNJOB_PALETTE.orangeSoft,
} as const

/** سطوح قدرت بر اساس آنتروپی (بیت) */
const STRENGTH_LEVELS = [
  {
    max: 28,
    label: 'خیلی ضعیف',
    color: '#e11d48',
    desc: 'با یه نگاه حدس زده می‌شه؛ حتی گربه‌هام فهمیدن!',
  },
  {
    max: 36,
    label: 'ضعیف',
    color: '#f7931e',
    desc: 'از 123456 بهتره... فقط یه کم!',
  },
  {
    max: 60,
    label: 'متوسط',
    color: '#f59e0b',
    desc: 'مثل چای بدون قند؛ نصفه‌نصفه‌ئه.',
  },
  {
    max: 90,
    label: 'خوب',
    color: '#84cc16',
    desc: 'از وای‌فای همسایه هم قوی‌تره!',
  },
  {
    max: 128,
    label: 'قوی',
    color: '#0ea5a0',
    desc: 'هکرا بهت لقب «رفیق» میدن!',
  },
  {
    max: Number.POSITIVE_INFINITY,
    label: 'افسانه‌ای',
    color: '#8b5cf6',
    desc: 'این رمز باید تو موزه نگه‌داری بشه!',
  },
] as const

const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'] as const

const toFa = (value: number | string): string =>
  String(value).replace(/\d/g, (digit) => FA_DIGITS[Number(digit)] ?? digit)

/** عدد تصادفی امن بین ۰ و max-1 بدون سوگیری باقیمانده (نمونه‌گیری رد می‌کنیم) */
function secureRandomInt(max: number): number {
  if (max <= 1) return 0
  const range = 65536
  const limit = range - (range % max)
  const buf = new Uint16Array(1)
  let v = 0
  do {
    window.crypto.getRandomValues(buf)
    v = buf[0]
  } while (v >= limit)
  return v % max
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    /* می‌ریم سراغ روش جایگزین */
  }
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    return true
  } catch {
    return false
  }
}

export default function PassgenApp() {
  const [length, setLength] = useState(16)
  const [opts, setOpts] = useState<PassOptions>({
    upper: true,
    lower: true,
    digits: true,
    symbols: true,
    noConfusing: false,
  })
  const [password, setPassword] = useState('')
  const [history, setHistory] = useState<string[]>([])

  const pool = useMemo(() => {
    let chars = ''
    if (opts.upper) chars += CHAR_SETS.upper
    if (opts.lower) chars += CHAR_SETS.lower
    if (opts.digits) chars += CHAR_SETS.digits
    if (opts.symbols) chars += CHAR_SETS.symbols
    if (opts.noConfusing) {
      chars = [...chars].filter((ch) => !CONFUSING_CHARS.includes(ch)).join('')
    }
    return chars
  }, [opts])

  const poolSize = pool.length
  const entropy = poolSize > 1 ? length * Math.log2(poolSize) : 0
  const levelIndex = Math.max(
    0,
    STRENGTH_LEVELS.findIndex((l) => entropy < l.max)
  )
  const level = STRENGTH_LEVELS[levelIndex] ?? STRENGTH_LEVELS[0]

  const toggle = (key: keyof PassOptions) =>
    setOpts((o) => ({ ...o, [key]: !o[key] }))

  const generate = () => {
    if (poolSize === 0) {
      useOS.getState().pushToast({
        icon: '🙈',
        title: 'رمزساز',
        body: 'حداقل یه گروه کاراکتر رو انتخاب کن!',
      })
      return
    }
    const chars: string[] = []
    for (let i = 0; i < length; i += 1) {
      chars.push(pool[secureRandomInt(poolSize)])
    }
    const next = chars.join('')
    setPassword(next)
    setHistory((h) => [next, ...h].slice(0, 4))
  }

  const copy = async (text: string) => {
    const ok = await copyToClipboard(text)
    useOS.getState().pushToast({
      icon: ok ? '🔑' : '😶',
      title: 'رمزساز',
      body: ok ? 'رمز کپی شد!' : 'کپی نشد؛ خودت دستی انتخاب کن!',
    })
  }

  const pct = ((length - MIN_LEN) / (MAX_LEN - MIN_LEN)) * 100

  const options: Array<{ key: keyof PassOptions; label: string }> = [
    { key: 'upper', label: 'حروف بزرگ (A-Z)' },
    { key: 'lower', label: 'حروف کوچک (a-z)' },
    { key: 'digits', label: 'عدد (0-9)' },
    { key: 'symbols', label: 'نماد (!@#$…)' },
    { key: 'noConfusing', label: 'حذف کاراکترهای گیج‌کننده (O0lI1)' },
  ]

  return (
    <div className="flex h-full w-full flex-col bg-zinc-950/60">
      <div className="os-scroll min-h-0 flex-1 overflow-y-auto p-3">
        <h2 className="mb-3 flex items-center gap-1.5 text-sm font-black text-zinc-100">
          رمزساز قوی
          <span className="text-base" aria-hidden>
            🔐
          </span>
        </h2>

        {/* طول رمز */}
        <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-300">طول رمز</span>
            <span
              dir="ltr"
              className="text-2xl font-black leading-none"
              style={{ color: SUNJOB_PALETTE.orange }}
            >
              {toFa(length)}
            </span>
          </div>
          <input
            type="range"
            dir="ltr"
            min={MIN_LEN}
            max={MAX_LEN}
            step={1}
            value={length}
            aria-label="طول رمز"
            onChange={(e) => setLength(Number(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-full outline-none [&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-[#f7931e] [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-zinc-950 [&::-webkit-slider-thumb]:bg-[#f7931e]"
            style={{
              background: `linear-gradient(to right, ${SUNJOB_PALETTE.orange} ${pct}%, #3f3f46 ${pct}%)`,
            }}
          />
          <div dir="ltr" className="mt-1 flex justify-between text-[10px] text-zinc-500">
            <span>{toFa(MIN_LEN)}</span>
            <span>{toFa(MAX_LEN)}</span>
          </div>
        </div>

        {/* گروه‌های کاراکتر */}
        <div className="mt-3 rounded-xl border border-white/10 bg-zinc-900/60 p-3">
          <div className="space-y-2">
            {options.map((opt) => (
              <label
                key={opt.key}
                className="flex cursor-pointer items-center gap-2 text-xs text-zinc-200"
              >
                <input
                  type="checkbox"
                  checked={opts[opt.key]}
                  onChange={() => toggle(opt.key)}
                  className="size-4 cursor-pointer rounded"
                  style={{ accentColor: OPT_COLORS[opt.key] }}
                />
                {opt.label}
              </label>
            ))}
          </div>
          {poolSize === 0 ? (
            <p className="mt-2 flex items-center gap-1 text-[11px] font-bold text-rose-300">
              <ShieldAlert className="size-3.5" />
              بدون هیچ کاراکتری رمز هم نمی‌شه ساخت!
            </p>
          ) : (
            <p className="mt-2 text-[11px] text-zinc-500">
              مخزن کاراکترها: {toFa(poolSize)} کاراکتر
            </p>
          )}
        </div>

        {/* دکمهٔ ساخت */}
        <button
          type="button"
          onClick={generate}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-[#e07b00] to-[#f7931e] py-3 text-sm font-black text-zinc-950 shadow-lg shadow-orange-500/20 transition hover:opacity-90 active:scale-95"
        >
          <Dices className="size-5" />
          رمز جدید بساز!
        </button>

        {/* نتیجه */}
        <div className="mt-3 rounded-xl border border-white/10 bg-zinc-900/60 p-3">
          <div className="flex items-start gap-2">
            <div
              dir="ltr"
              className="min-h-6 min-w-0 flex-1 break-all font-mono text-base font-bold text-zinc-100"
            >
              {password || <span className="text-zinc-600">هنوز رمزی نساختی…</span>}
            </div>
            <Button
              type="button"
              size="icon"
              variant="outline"
              aria-label="کپی رمز"
              title="کپی رمز"
              disabled={!password}
              onClick={() => copy(password)}
              className="size-8 shrink-0 rounded-lg border-white/10 bg-zinc-800/70 text-zinc-300 hover:bg-white/10 hover:text-zinc-100"
            >
              <Copy className="size-3.5" />
            </Button>
          </div>

          {/* سنجهٔ قدرت */}
          <div className="mt-3">
            <div className="flex gap-1">
              {STRENGTH_LEVELS.map((l, i) => (
                <span
                  key={l.label}
                  className="h-2 flex-1 rounded-full transition-colors"
                  style={{ backgroundColor: i <= levelIndex ? l.color : '#3f3f46' }}
                />
              ))}
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[11px]">
              <span className="font-black" style={{ color: level.color }}>
                {level.label}
              </span>
              <span className="text-zinc-500">
                آنتروپی: ~{toFa(Math.round(entropy))} بیت
              </span>
            </div>
            <p className="mt-1 text-[11px] leading-5 text-zinc-400">{level.desc}</p>
          </div>
        </div>

        {/* تاریخچه */}
        <div className="mt-3 rounded-xl border border-white/10 bg-zinc-900/60 p-3">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-zinc-300">
            <History className="size-3.5" style={{ color: SUNJOB_PALETTE.violet }} />
            آخرین رمزها
            <Sparkles className="size-3 text-zinc-600" aria-hidden />
          </p>
          {history.length === 0 ? (
            <p className="text-[11px] text-zinc-600">هنوز چیزی اینجا نیست؛ یه رمز بساز!</p>
          ) : (
            <ul className="space-y-1.5">
              {history.map((pass, i) => (
                <li key={`${pass}-${i}`} className="flex items-center gap-2">
                  <span
                    dir="ltr"
                    className="min-w-0 flex-1 truncate font-mono text-xs text-zinc-300"
                    title={pass}
                  >
                    {pass}
                  </span>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label="کپی از تاریخچه"
                    title="کپی"
                    onClick={() => copy(pass)}
                    className="size-6 shrink-0 text-zinc-500 hover:bg-white/10 hover:text-zinc-200"
                  >
                    <Copy className="size-3" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
