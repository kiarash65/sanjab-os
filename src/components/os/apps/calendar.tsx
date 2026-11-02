'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SUNJOB_PALETTE } from '@/lib/os/brand'

/* ------------------------------------------------------------------ */
/* تبدیل تاریخ جلالی ↔ میلادی (بازنویسی الگوریتم استاندارد jalaali-js) */
/* دقیق با کبیسه‌های ۳۳ ساله و نقاط شکست معروف                          */
/* ------------------------------------------------------------------ */

interface JalaliDate {
  jy: number
  jm: number
  jd: number
}

interface GregorianDate {
  gy: number
  gm: number
  gd: number
}

const div = (a: number, b: number): number => Math.trunc(a / b)
const mod = (a: number, b: number): number => a - Math.trunc(a / b) * b

/** نقاط شکست الگوریتم جلالی (Behrooz Nejatpour / jalaali-js) */
const JALALI_BREAKS = [
  -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097,
  2192, 2262, 2324, 2394, 2456, 3178,
]

function jalCal(jy: number): { leap: number; gy: number; march: number } {
  const gy = jy + 621
  let leapJ = -14
  let jp = JALALI_BREAKS[0]
  let jump = 0

  for (let i = 1; i < JALALI_BREAKS.length; i += 1) {
    const jm = JALALI_BREAKS[i]
    jump = jm - jp
    if (jy < jm) break
    leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4)
    jp = jm
  }

  let n = jy - jp

  leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4)
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1

  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150
  const march = 20 + leapJ - leapG

  if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33
  let leap = mod(mod(n + 1, 33) - 1, 4)
  if (leap === -1) leap = 4

  return { leap, gy, march }
}

/** روز جولیَن از تاریخ میلادی */
function g2d(gy: number, gm: number, gd: number): number {
  let d =
    div((gy + div(gm - 8, 6) + 100100) * 1461, 4) +
    div(153 * mod(gm + 9, 12) + 2, 5) +
    gd -
    34840408
  d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752
  return d
}

/** تاریخ میلادی از روز جولیَن */
function d2g(jdn: number): GregorianDate {
  let j = 4 * jdn + 139361631
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908
  const i = div(mod(j, 1461), 4) * 5 + 308
  const gd = div(mod(i, 153), 5) + 1
  const gm = mod(div(i, 153), 12) + 1
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6)
  return { gy, gm, gd }
}

/** روز جولیَن از تاریخ جلالی */
function j2d(jy: number, jm: number, jd: number): number {
  const r = jalCal(jy)
  return (
    g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1
  )
}

/** تاریخ جلالی از روز جولیَن */
function d2j(jdn: number): JalaliDate {
  const gy = d2g(jdn).gy
  let jy = gy - 621
  const r = jalCal(jy)
  const jdn1f = g2d(gy, 3, r.march)
  let k = jdn - jdn1f

  if (k >= 0) {
    if (k <= 185) {
      return { jy, jm: 1 + div(k, 31), jd: mod(k, 31) + 1 }
    }
    k -= 186
  } else {
    jy -= 1
    k += 179
    if (r.leap === 1) k += 1
  }

  return { jy, jm: 7 + div(k, 30), jd: mod(k, 30) + 1 }
}

function toJalaali(gy: number, gm: number, gd: number): JalaliDate {
  return d2j(g2d(gy, gm, gd))
}

function toGregorian(jy: number, jm: number, jd: number): GregorianDate {
  return d2g(j2d(jy, jm, jd))
}

function isLeapJalaliYear(jy: number): boolean {
  return jalCal(jy).leap === 0
}

function jalaliMonthLength(jy: number, jm: number): number {
  if (jm <= 6) return 31
  if (jm <= 11) return 30
  return isLeapJalaliYear(jy) ? 30 : 29
}

/** ایندکس روز هفته با ستون اول «شنبه» (۰=شنبه … ۶=جمعه) */
function weekdaySatFirst(jy: number, jm: number, jd: number): number {
  const g = toGregorian(jy, jm, jd)
  return (new Date(Date.UTC(g.gy, g.gm - 1, g.gd)).getUTCDay() + 1) % 7
}

/* ------------------------------------------------------------------ */

interface CalEvent {
  id: string
  title: string
  color: string
}

type EventMap = Record<string, CalEvent[]>

const KEY = 'sunjob-calendar-v1'

const MONTHS = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
] as const

const WEEKDAYS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'] as const

const G_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const

const FA_WEEKDAYS = [
  'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه',
] as const

const EVENT_COLORS = [
  SUNJOB_PALETTE.orange,
  SUNJOB_PALETTE.violet,
  SUNJOB_PALETTE.teal,
  SUNJOB_PALETTE.rose,
  SUNJOB_PALETTE.orangeSoft,
  SUNJOB_PALETTE.tealBright,
] as const

const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'] as const

const toFa = (value: number | string): string =>
  String(value).replace(/\d/g, (digit) => FA_DIGITS[Number(digit)] ?? digit)

const pad2 = (n: number): string => String(n).padStart(2, '0')

const dayKey = (jy: number, jm: number, jd: number): string =>
  `${jy}/${pad2(jm)}/${pad2(jd)}`

const uid = (): string =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

function loadEvents(): EventMap {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as EventMap
    }
    return {}
  } catch {
    return {}
  }
}

export default function CalendarApp() {
  const today = useMemo(() => {
    const d = new Date()
    return toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate())
  }, [])

  const [view, setView] = useState({ jy: today.jy, jm: today.jm })
  const [events, setEvents] = useState<EventMap>({})
  const [loaded, setLoaded] = useState(false)
  const [selected, setSelected] = useState<JalaliDate | null>(null)
  const [title, setTitle] = useState('')
  const [color, setColor] = useState<string>(EVENT_COLORS[0])

  useEffect(() => {
    queueMicrotask(() => {
      setEvents(loadEvents())
      setLoaded(true)
    })
  }, [])

  useEffect(() => {
    if (!loaded) return
    try {
      localStorage.setItem(KEY, JSON.stringify(events))
    } catch {
      /* حافظه پر شده؛ بی‌خیال، تقویم به کارش ادامه می‌ده */
    }
  }, [events, loaded])

  const grid = useMemo(() => {
    const first = weekdaySatFirst(view.jy, view.jm, 1)
    const len = jalaliMonthLength(view.jy, view.jm)
    const cells: Array<{ jd: number; key: string; isToday: boolean } | null> = []
    for (let i = 0; i < first; i += 1) cells.push(null)
    for (let d = 1; d <= len; d += 1) {
      cells.push({
        jd: d,
        key: dayKey(view.jy, view.jm, d),
        isToday:
          view.jy === today.jy && view.jm === today.jm && d === today.jd,
      })
    }
    return cells
  }, [view, today])

  const monthRange = useMemo(() => {
    const len = jalaliMonthLength(view.jy, view.jm)
    return {
      first: toGregorian(view.jy, view.jm, 1),
      last: toGregorian(view.jy, view.jm, len),
    }
  }, [view])

  const todayKey = dayKey(today.jy, today.jm, today.jd)

  const todayWeekday = useMemo(() => {
    const g = toGregorian(today.jy, today.jm, today.jd)
    return new Date(Date.UTC(g.gy, g.gm - 1, g.gd)).getUTCDay()
  }, [today])

  const tomorrowKey = useMemo(() => {
    const t = d2j(j2d(today.jy, today.jm, today.jd) + 1)
    return dayKey(t.jy, t.jm, t.jd)
  }, [today])

  const upcoming = useMemo(() => {
    return Object.entries(events)
      .flatMap(([key, list]) => list.map((ev) => ({ key, ev })))
      .filter((x) => x.key >= todayKey)
      .sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0))
      .slice(0, 12)
  }, [events, todayKey])

  const goMonth = (delta: number) => {
    setView((v) => {
      let jm = v.jm + delta
      let jy = v.jy
      if (jm > 12) {
        jm = 1
        jy += 1
      }
      if (jm < 1) {
        jm = 12
        jy -= 1
      }
      return { jy, jm }
    })
    setSelected(null)
  }

  const goToday = () => {
    setView({ jy: today.jy, jm: today.jm })
    setSelected(null)
  }

  const openDay = (jd: number) => {
    setSelected((prev) =>
      prev && prev.jy === view.jy && prev.jm === view.jm && prev.jd === jd
        ? null
        : { jy: view.jy, jm: view.jm, jd }
    )
    setTitle('')
  }

  const addEvent = () => {
    if (!selected) return
    const t = title.trim()
    if (!t) return
    const key = dayKey(selected.jy, selected.jm, selected.jd)
    const ev: CalEvent = { id: uid(), title: t, color }
    setEvents((prev) => ({ ...prev, [key]: [...(prev[key] ?? []), ev] }))
    setTitle('')
  }

  const removeEvent = (key: string, id: string) => {
    setEvents((prev) => {
      const list = (prev[key] ?? []).filter((ev) => ev.id !== id)
      const next = { ...prev }
      if (list.length === 0) delete next[key]
      else next[key] = list
      return next
    })
  }

  const eventCount = Object.values(events).reduce((sum, list) => sum + list.length, 0)

  const fmtG = (g: GregorianDate): string =>
    `${pad2(g.gd)} ${G_MONTHS[g.gm - 1]} ${g.gy}`

  const upcomingLabel = (key: string): string => {
    if (key === todayKey) return 'امروز'
    if (key === tomorrowKey) return 'فردا'
    const [jm, jd] = key.split('/')
    return `${toFa(Number(jd))} ${MONTHS[Number(jm) - 1]}`
  }

  return (
    <div className="flex h-full w-full flex-col bg-zinc-950/60">
      <header className="border-b border-white/10 px-3 py-2.5">
        <h2 className="flex items-center gap-1.5 text-sm font-black text-zinc-100">
          <CalendarDays className="size-4" style={{ color: SUNJOB_PALETTE.orange }} />
          تقویم جلالی
        </h2>
      </header>

      <div className="os-scroll min-h-0 flex-1 overflow-y-auto p-3">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_240px]">
          {/* تقویم ماهانه */}
          <section className="rounded-xl border border-white/10 bg-zinc-900/60 p-3">
            <div className="flex items-center justify-between gap-2">
              <Button
                size="icon"
                variant="ghost"
                aria-label="ماه قبل"
                title="ماه قبل"
                onClick={() => goMonth(-1)}
                className="size-8 rounded-lg text-zinc-400 hover:bg-white/10 hover:text-zinc-100"
              >
                <ChevronRight className="size-4" />
              </Button>
              <div className="text-center">
                <div className="text-sm font-black text-zinc-100">
                  {MONTHS[view.jm - 1]} {toFa(view.jy)}
                </div>
                <div dir="ltr" className="text-[10px] text-zinc-500">
                  {fmtG(monthRange.first)} – {fmtG(monthRange.last)}
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                aria-label="ماه بعد"
                title="ماه بعد"
                onClick={() => goMonth(1)}
                className="size-8 rounded-lg text-zinc-400 hover:bg-white/10 hover:text-zinc-100"
              >
                <ChevronLeft className="size-4" />
              </Button>
            </div>

            <div className="mt-2 flex items-center justify-between gap-2">
              {view.jm === 12 ? (
                <span className="flex items-center gap-1 text-[10px] font-bold text-orange-300">
                  <Sparkles className="size-3" style={{ color: SUNJOB_PALETTE.orange }} />
                  اسفند که شه، یادت باشه سال نو نزدیکه!
                </span>
              ) : (
                <span />
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={goToday}
                className="h-7 rounded-lg border-white/10 bg-zinc-800/70 px-2.5 text-[11px] text-zinc-300 hover:bg-white/10 hover:text-zinc-100"
              >
                امروز
              </Button>
            </div>

            <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-zinc-500">
              {WEEKDAYS.map((w) => (
                <span key={w} className="py-1">
                  {w}
                </span>
              ))}
            </div>

            <div className="mt-1 grid grid-cols-7 gap-1">
              {grid.map((cell, i) =>
                cell ? (
                  <button
                    key={cell.key}
                    type="button"
                    onClick={() => openDay(cell.jd)}
                    aria-label={`روز ${toFa(cell.jd)} ${MONTHS[view.jm - 1]}`}
                    style={
                      cell.isToday
                        ? {
                            borderColor: SUNJOB_PALETTE.orange,
                            backgroundColor: 'rgba(247, 147, 30, 0.12)',
                          }
                        : undefined
                    }
                    className={`relative flex aspect-square items-center justify-center rounded-lg border text-xs font-bold transition active:scale-95 ${
                      cell.isToday
                        ? 'border text-orange-300'
                        : 'border-transparent text-zinc-300 hover:bg-white/5 hover:text-zinc-100'
                    } ${
                      selected &&
                      selected.jy === view.jy &&
                      selected.jm === view.jm &&
                      selected.jd === cell.jd
                        ? 'ring-1 ring-zinc-400/60'
                        : ''
                    }`}
                  >
                    {toFa(cell.jd)}
                    <span className="absolute inset-x-0 bottom-1 flex justify-center gap-0.5">
                      {(events[cell.key] ?? []).slice(0, 3).map((ev) => (
                        <span
                          key={ev.id}
                          className="size-1.5 rounded-full"
                          style={{ backgroundColor: ev.color }}
                        />
                      ))}
                    </span>
                  </button>
                ) : (
                  <span key={`empty-${i}`} aria-hidden />
                )
              )}
            </div>

            {/* فرم افزودن رویداد */}
            {selected && (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  addEvent()
                }}
                className="pengo-fadein mt-2 rounded-xl border border-white/10 bg-zinc-950/60 p-3"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-zinc-200">
                    رویداد جدید برای {toFa(selected.jd)} {MONTHS[selected.jm - 1]}
                  </span>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label="بستن فرم"
                    title="بستن"
                    onClick={() => setSelected(null)}
                    className="size-6 text-zinc-500 hover:bg-white/10 hover:text-zinc-200"
                  >
                    <X className="size-3.5" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="مثلاً: جلسه با تیم"
                    className="h-9 bg-zinc-800/70 text-xs text-zinc-100"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    className="h-9 shrink-0 gap-1 bg-[#f7931e] text-zinc-950 hover:bg-[#e07b00]"
                  >
                    <Plus className="size-4" />
                    افزودن
                  </Button>
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-[10px] text-zinc-500">رنگ:</span>
                  {EVENT_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-label={`انتخاب رنگ ${c}`}
                      onClick={() => setColor(c)}
                      style={{ backgroundColor: c }}
                      className={`size-5 rounded-full transition active:scale-90 ${
                        color === c
                          ? 'ring-2 ring-white/70 ring-offset-2 ring-offset-zinc-950'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </form>
            )}
          </section>

          {/* رویدادهای نزدیک */}
          <aside className="flex flex-col rounded-xl border border-white/10 bg-zinc-900/60 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-xs font-black text-zinc-100">رویدادهای نزدیک</span>
              <span
                className="rounded-md border border-white/10 bg-zinc-800/80 px-1.5 py-0.5 text-[10px] font-black"
                style={{ color: SUNJOB_PALETTE.orange }}
              >
                {toFa(eventCount)}
              </span>
            </div>

            <p className="mb-2 text-[10px] text-zinc-500">
              امروز: {FA_WEEKDAYS[todayWeekday]} {toFa(today.jd)} {MONTHS[today.jm - 1]} {toFa(today.jy)}
            </p>

            {upcoming.length === 0 ? (
              <p className="rounded-lg border border-dashed border-white/10 p-3 text-center text-[11px] leading-5 text-zinc-600">
                هنوز رویدادی نیست؛ روی یه روز کلیک کن و اولین قرار زندگیت رو ثبت کن!
              </p>
            ) : (
              <ul className="space-y-1.5">
                {upcoming.map(({ key, ev }) => (
                  <li
                    key={ev.id}
                    className="pengo-fadein flex items-center gap-2 rounded-lg border border-white/10 bg-zinc-950/60 p-2"
                  >
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: ev.color }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs text-zinc-200" title={ev.title}>
                        {ev.title}
                      </span>
                      <span className="block text-[10px] text-zinc-500">
                        {upcomingLabel(key)}
                      </span>
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="حذف رویداد"
                      title="حذف"
                      onClick={() => removeEvent(key, ev.id)}
                      className="size-6 shrink-0 text-zinc-500 hover:bg-white/10 hover:text-rose-300"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-auto pt-3 text-center">
              <span className="text-[10px] text-zinc-500">با اسپانسری سان‌جاب</span>
            </p>
          </aside>
        </div>
      </div>
    </div>
  )
}
