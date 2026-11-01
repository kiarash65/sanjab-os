'use client'

import { useState } from 'react'
import { Droplets, Eye, PartyPopper, RotateCcw, Wind } from 'lucide-react'
import { Button } from '@/components/ui/button'

const CONDITIONS = [
  { name: 'آفتابی', emoji: '☀️', advice: 'کرم ضدآفتاب بزن، پنگوئن‌ها هم آفتاب‌سوختگی می‌شن' },
  { name: 'بارونی', emoji: '🌧', advice: 'چتر یادت نره... یا اصلاً نرو بیرون' },
  { name: 'برفی', emoji: '❄️', advice: 'یه آدم‌برفی بساز، اسمشو بذار بابا' },
  { name: 'طوفانی', emoji: '⛈', advice: 'از پنجره‌ها دور شو، وای‌فای هم ممکنه قطع شه' },
  { name: 'مه‌آلود', emoji: '🌫', advice: 'جلوی چشمت دستت رو ببین؟ مبارکه' },
  { name: 'پنگوئنی خاص', emoji: '🐧', advice: 'هوایی هست که فقط پنگوئن‌ها می‌فهمن' },
] as const

type Condition = (typeof CONDITIONS)[number]

type ForecastDay = {
  day: string
  emoji: string
  low: number
  high: number
}

type WeatherData = {
  condition: Condition
  temp: number
  wind: number
  humidity: number
  funIndex: number
  penguinChance: number
  forecast: ForecastDay[]
}

const POP_STYLE =
  '@keyframes pengo-pop{0%{transform:scale(.75);opacity:0}60%{transform:scale(1.06)}100%{transform:scale(1);opacity:1}}' +
  '.pengo-pop{animation:pengo-pop .38s cubic-bezier(.34,1.56,.64,1) both}'

const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'] as const

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value))

const randInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)] as T
}

const toFa = (value: number | string): string =>
  String(value).replace(/\d/g, (digit) => FA_DIGITS[Number(digit)] ?? digit)

function weekdayLabel(offsetDays: number): string {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  return date.toLocaleDateString('fa-IR', { weekday: 'short' })
}

function genAll(): WeatherData {
  const temp = randInt(-5, 38)
  const forecast: ForecastDay[] = Array.from({ length: 5 }, (_, index) => {
    const low = clamp(temp + randInt(-6, 3), -10, 42)
    return {
      day: weekdayLabel(index + 1),
      emoji: pick(CONDITIONS).emoji,
      low,
      high: low + randInt(2, 9),
    }
  })
  return {
    condition: pick(CONDITIONS),
    temp,
    wind: randInt(2, 40),
    humidity: randInt(20, 90),
    funIndex: randInt(60, 100),
    penguinChance: randInt(5, 95),
    forecast,
  }
}

export default function WeatherApp() {
  const [data, setData] = useState<WeatherData>(() => genAll())
  const [gen, setGen] = useState(0)

  const regenerate = () => {
    setData(genAll())
    setGen((g) => g + 1)
  }

  const condition = data.condition

  const stats = [
    { key: 'wind', icon: <Wind className="h-4 w-4" />, label: 'باد', value: `${toFa(data.wind)} km/h` },
    { key: 'humidity', icon: <Droplets className="h-4 w-4" />, label: 'رطوبت', value: `${toFa(data.humidity)}٪` },
    { key: 'fun', icon: <PartyPopper className="h-4 w-4" />, label: 'شاخص بامزگی', value: `${toFa(data.funIndex)}٪` },
    { key: 'penguin', icon: <Eye className="h-4 w-4" />, label: 'احتمال دیدن پنگوئن', value: `${toFa(data.penguinChance)}٪` },
  ]

  return (
    <div className="os-scroll h-full w-full overflow-y-auto bg-zinc-950/60">
      <style>{POP_STYLE}</style>

      <div className="flex items-center justify-between gap-2 px-4 pt-4">
        <h2 className="text-sm font-black text-zinc-100">آب‌وهوای خیالی ⛅</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={regenerate}
          className="gap-1.5 rounded-xl border-white/10 bg-zinc-900 text-xs text-zinc-200 transition-all hover:bg-zinc-800 hover:text-zinc-100 active:scale-95"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          پیش‌بینی جادویی
        </Button>
      </div>

      <div
        key={`hero-${gen}`}
        className="pengo-pop mx-4 mt-3 flex items-center gap-4 rounded-xl border border-white/10 bg-zinc-900 p-5 transition-colors hover:border-white/20"
      >
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-zinc-800/70 text-4xl" aria-hidden>
          {condition.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span dir="ltr" className="text-5xl font-black leading-none text-zinc-100">
              {toFa(data.temp)}°
            </span>
            <span className="text-sm font-bold text-[var(--pengo-accent)]">{condition.name}</span>
          </div>
          <p className="mt-1.5 text-xs leading-5 text-zinc-400">{condition.advice}</p>
          <p className="mt-1 text-[11px] text-zinc-500">پنگوئن‌آباد — اکنون</p>
        </div>
      </div>

      <div className="mx-4 mt-3 grid grid-cols-2 gap-2">
        {stats.map((stat) => (
          <div
            key={`${gen}-${stat.key}`}
            className="pengo-pop flex items-center gap-2.5 rounded-xl border border-white/10 bg-zinc-900 p-3 transition-colors hover:border-white/20"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-[var(--pengo-accent)]">
              {stat.icon}
            </div>
            <div className="min-w-0">
              <div className="truncate text-[10px] text-zinc-500">{stat.label}</div>
              <div className="truncate text-sm font-black text-zinc-100">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mx-4 mt-3 rounded-xl border border-white/10 bg-zinc-900 p-3">
        <div className="mb-2 text-xs font-bold text-zinc-400">پیش‌بینی ۵ روز آینده</div>
        <div className="os-scroll overflow-x-auto pb-1">
          <div className="grid min-w-[440px] grid-cols-5 gap-2">
            {data.forecast.map((day, index) => (
              <div
                key={`${gen}-${index}`}
                className="pengo-pop flex flex-col items-center gap-1 rounded-lg border border-white/5 bg-zinc-800/60 p-2 transition-colors hover:border-white/20"
              >
                <span className="text-[11px] text-zinc-400">{day.day}</span>
                <span className="text-2xl" aria-hidden>{day.emoji}</span>
                <span dir="ltr" className="text-[11px] font-bold text-zinc-200">
                  {toFa(day.low)}° / {toFa(day.high)}°
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="px-4 py-4 text-center text-[11px] text-zinc-500">
        دقت پیش‌بینی: حدود ۴۲٪ — بیشتر از این ادعا نداریم
      </p>
    </div>
  )
}
