'use client'

import { useState } from 'react'
import { ArrowLeftRight, Lightbulb } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { SUNJOB_PALETTE } from '@/lib/os/brand'

type CategoryId = 'length' | 'weight' | 'temp' | 'data' | 'speed' | 'time'

interface UnitDef {
  id: string
  label: string
  /** ضریب تبدیل به یکای پایه (برای دما استفاده نمی‌شه) */
  factor?: number
  /** تبدیل مقدار به پایه (برای دما) */
  toBase?: (v: number) => number
  /** تبدیل از پایه به این یکا (برای دما) */
  fromBase?: (v: number) => number
}

interface CategoryDef {
  id: CategoryId
  label: string
  color: string
  tip: string
  units: UnitDef[]
}

const u = (id: string, label: string, factor: number): UnitDef => ({ id, label, factor })

const CATEGORIES: CategoryDef[] = [
  {
    id: 'length',
    label: 'طول',
    color: SUNJOB_PALETTE.teal,
    tip: 'از اینجا تا ماه فقط ۳۸۴٬۴۰۰ کیلومتره؛ پیاده برو، ارزون‌تره!',
    units: [
      u('m', 'متر', 1),
      u('km', 'کیلومتر', 1000),
      u('cm', 'سانتی‌متر', 0.01),
      u('mm', 'میلی‌متر', 0.001),
      u('mile', 'مایل', 1609.344),
      u('ft', 'فوت', 0.3048),
      u('inch', 'اینچ', 0.0254),
      u('yd', 'یارد', 0.9144),
    ],
  },
  {
    id: 'weight',
    label: 'وزن',
    color: SUNJOB_PALETTE.violet,
    tip: 'وزن‌کردن قبل از شام ممنوع؛ مادهٔ اول قانون فیزیک شادی!',
    units: [
      u('kg', 'کیلوگرم', 1),
      u('g', 'گرم', 0.001),
      u('t', 'تُن', 1000),
      u('lb', 'پوند', 0.45359237),
      u('oz', 'اونس', 0.028349523125),
    ],
  },
  {
    id: 'temp',
    label: 'دما',
    color: SUNJOB_PALETTE.rose,
    tip: 'هوای تهران همیشه یک دمهٔ بالاتره!',
    units: [
      { id: 'c', label: 'سلسیوس', toBase: (v) => v, fromBase: (v) => v },
      { id: 'f', label: 'فارنهایت', toBase: (v) => ((v - 32) * 5) / 9, fromBase: (v) => (v * 9) / 5 + 32 },
      { id: 'k', label: 'کلوین', toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
    ],
  },
  {
    id: 'data',
    label: 'حجم داده',
    color: SUNJOB_PALETTE.orange,
    tip: 'گیگابایت یعنی ۱۰۲۴ مگابایت؛ فروشنده‌های اینترنت ممکنه نظر دیگه‌ای داشته باشن!',
    units: [
      u('b', 'بایت', 1),
      u('kb', 'کیلوبایت', 1024),
      u('mb', 'مگابایت', 1024 ** 2),
      u('gb', 'گیگابایت', 1024 ** 3),
      u('tb', 'ترابایت', 1024 ** 4),
    ],
  },
  {
    id: 'speed',
    label: 'سرعت',
    color: SUNJOB_PALETTE.tealBright,
    tip: 'سرعت نور حدود ۱٬۰۷۹٬۲۵۲٬۸۴۸ کیلومتر بر ساعته؛ توی ترافیک فقط روی کاغذ!',
    units: [
      u('ms', 'متر بر ثانیه', 1),
      u('kmh', 'کیلومتر بر ساعت', 1 / 3.6),
      u('mph', 'مایل بر ساعت', 0.44704),
      u('kn', 'گره', 1852 / 3600),
    ],
  },
  {
    id: 'time',
    label: 'زمان',
    color: SUNJOB_PALETTE.violetSoft,
    tip: 'یه هفته ۶۰۴٬۸۰۰ ثانیه‌ست؛ ولی دوشنبه‌ها خودشون ۲۰۰ هزار تا حساب می‌شن!',
    units: [
      u('s', 'ثانیه', 1),
      u('min', 'دقیقه', 60),
      u('h', 'ساعت', 3600),
      u('d', 'روز', 86400),
      u('w', 'هفته', 604800),
    ],
  },
]

const getUnit = (cat: CategoryDef, id: string): UnitDef =>
  cat.units.find((unit2) => unit2.id === id) ?? cat.units[0]

const toBaseValue = (unit2: UnitDef, v: number): number =>
  unit2.toBase ? unit2.toBase(v) : v * (unit2.factor ?? 1)

const fromBaseValue = (unit2: UnitDef, v: number): number =>
  unit2.fromBase ? unit2.fromBase(v) : v / (unit2.factor ?? 1)

/** تا ۶ رقم معنادار، بدون صفرهای اضافه */
function formatResult(value: number): string {
  if (!Number.isFinite(value)) return ''
  if (value === 0) return '0'
  const abs = Math.abs(value)
  if (abs >= 1e15 || abs < 1e-9) {
    return value.toExponential(4).replace(/(\.\d*?)0+e/, '$1e').replace(/\.e/, 'e')
  }
  return Number(value.toPrecision(6)).toString()
}

export default function UnitConverterApp() {
  const [catId, setCatId] = useState<CategoryId>('length')
  const [fromId, setFromId] = useState('m')
  const [toId, setToId] = useState('km')
  const [editedSide, setEditedSide] = useState<'from' | 'to'>('from')
  const [editedText, setEditedText] = useState('1')

  const cat = CATEGORIES.find((c) => c.id === catId) ?? CATEGORIES[0]
  const fromUnit = getUnit(cat, fromId)
  const toUnit = getUnit(cat, toId)

  const parsed = parseFloat(editedText.replace(/٫/g, '.'))
  const otherText = Number.isFinite(parsed)
    ? editedSide === 'from'
      ? formatResult(fromBaseValue(toUnit, toBaseValue(fromUnit, parsed)))
      : formatResult(fromBaseValue(fromUnit, toBaseValue(toUnit, parsed)))
    : ''
  const fromText = editedSide === 'from' ? editedText : otherText
  const toText = editedSide === 'to' ? editedText : otherText

  const selectCategory = (next: CategoryId) => {
    if (next === catId) return
    const c = CATEGORIES.find((x) => x.id === next)
    if (!c) return
    setCatId(next)
    setFromId(c.units[0]?.id ?? '')
    setToId(c.units[1]?.id ?? c.units[0]?.id ?? '')
    setEditedSide('from')
    setEditedText('1')
  }

  const swapUnits = () => {
    setFromId(toId)
    setToId(fromId)
  }

  const valid = Number.isFinite(parsed) && fromText !== '' && toText !== ''

  return (
    <div className="flex h-full w-full flex-col bg-zinc-950/60">
      <div className="os-scroll min-h-0 flex-1 overflow-y-auto p-3">
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-black text-zinc-100">
          مبدل یکاها
          <span className="text-base" aria-hidden>
            📏
          </span>
        </h2>

        {/* تب دسته‌ها */}
        <div className="mb-3 flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => {
            const active = c.id === catId
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => selectCategory(c.id)}
                style={
                  active
                    ? { backgroundColor: `${c.color}26`, color: c.color, borderColor: `${c.color}66` }
                    : undefined
                }
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition active:scale-95 ${
                  active
                    ? 'font-black'
                    : 'border-white/10 bg-zinc-900/60 text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                }`}
              >
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: c.color }}
                  aria-hidden
                />
                {c.label}
              </button>
            )
          })}
        </div>

        {/* پنل تبدیل */}
        <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-3">
          <div className="flex items-center gap-2">
            <Input
              dir="ltr"
              type="text"
              inputMode="decimal"
              value={fromText}
              placeholder="۰"
              onChange={(e) => {
                setEditedSide('from')
                setEditedText(e.target.value)
              }}
              className="h-11 min-w-0 flex-1 bg-zinc-800/70 text-left text-lg font-bold text-zinc-100"
            />
            <select
              value={fromId}
              onChange={(e) => setFromId(e.target.value)}
              aria-label="یکای مبدأ"
              className="h-11 w-28 shrink-0 cursor-pointer rounded-lg border border-white/10 bg-zinc-800/80 px-2 text-sm font-bold text-zinc-100 outline-none [&>option]:bg-zinc-900"
            >
              {cat.units.map((unit2) => (
                <option key={unit2.id} value={unit2.id}>
                  {unit2.label}
                </option>
              ))}
            </select>
          </div>

          <div className="my-2 flex justify-center">
            <button
              type="button"
              onClick={swapUnits}
              aria-label="جابه‌جایی یکاها"
              title="جابه‌جایی یکاها"
              style={{ borderColor: `${cat.color}66`, color: cat.color }}
              className="flex size-9 items-center justify-center rounded-full border bg-zinc-800/70 transition hover:bg-white/10 active:scale-95"
            >
              <ArrowLeftRight className="size-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Input
              dir="ltr"
              type="text"
              inputMode="decimal"
              value={toText}
              placeholder="۰"
              onChange={(e) => {
                setEditedSide('to')
                setEditedText(e.target.value)
              }}
              className="h-11 min-w-0 flex-1 bg-zinc-800/70 text-left text-lg font-bold text-zinc-100"
            />
            <select
              value={toId}
              onChange={(e) => setToId(e.target.value)}
              aria-label="یکای مقصد"
              className="h-11 w-28 shrink-0 cursor-pointer rounded-lg border border-white/10 bg-zinc-800/80 px-2 text-sm font-bold text-zinc-100 outline-none [&>option]:bg-zinc-900"
            >
              {cat.units.map((unit2) => (
                <option key={unit2.id} value={unit2.id}>
                  {unit2.label}
                </option>
              ))}
            </select>
          </div>

          <p
            aria-live="polite"
            className="mt-3 min-h-5 text-center text-xs text-zinc-400"
            dir="ltr"
          >
            {valid ? (
              <span>
                <span className="font-black" style={{ color: cat.color }}>
                  {fromText}
                </span>{' '}
                {fromUnit.label} ={' '}
                <span className="font-black" style={{ color: cat.color }}>
                  {toText}
                </span>{' '}
                {toUnit.label}
              </span>
            ) : (
              'یه عدد وارد کن تا دوطرفه تبدیل شه!'
            )}
          </p>
        </div>

        {/* نکتهٔ بامزه */}
        <div
          style={{ borderColor: `${cat.color}44` }}
          className="mt-3 flex items-start gap-2 rounded-xl border bg-zinc-900/60 p-3 text-xs leading-6 text-zinc-300"
        >
          <Lightbulb className="mt-0.5 size-4 shrink-0" style={{ color: cat.color }} />
          <span>{cat.tip}</span>
        </div>
      </div>
    </div>
  )
}
