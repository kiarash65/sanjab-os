'use client'

import { useEffect, useMemo, useState } from 'react'
import { Copy, Moon, Pipette, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SUNJOB_PALETTE } from '@/lib/os/brand'
import { useOS } from '@/lib/os/store'

const KEY = 'sunjob-color-v1'

const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
const toFa = (value: number | string): string =>
  String(value).replace(/\d/g, (digit) => FA_DIGITS[Number(digit)] ?? digit)

/* ------------------------------------------------------------------ */
/* ریاضیات رنگ، تبدیل‌های دستی HEX/RGB/HSL                           */
/* ------------------------------------------------------------------ */

interface RGB {
  r: number
  g: number
  b: number
}

interface HSL {
  h: number
  s: number
  l: number
}

const HEX_RE = /^#?(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

function hexToRgb(hex: string): RGB | null {
  let h = hex.trim().replace(/^#/, '')
  if (/^[0-9a-fA-F]{3}$/.test(h)) {
    h = h
      .split('')
      .map((c) => c + c)
      .join('')
  }
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null
  const n = parseInt(h, 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

function rgbToHex({ r, g, b }: RGB): string {
  const part = (v: number) =>
    Math.round(Math.min(255, Math.max(0, v)))
      .toString(16)
      .padStart(2, '0')
  return `#${part(r)}${part(g)}${part(b)}`
}

function rgbToHsl({ r, g, b }: RGB): HSL {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  let h = 0
  let s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0)
    else if (max === gn) h = (bn - rn) / d + 2
    else h = (rn - gn) / d + 4
    h *= 60
  }
  return { h, s: s * 100, l: l * 100 }
}

function hslToRgb({ h, s, l }: HSL): RGB {
  const hn = (((h % 360) + 360) % 360) / 360
  const sn = Math.min(100, Math.max(0, s)) / 100
  const ln = Math.min(100, Math.max(0, l)) / 100
  if (sn === 0) {
    const v = ln * 255
    return { r: v, g: v, b: v }
  }
  const q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn
  const p = 2 * ln - q
  const f = (t: number) => {
    let tt = t
    if (tt < 0) tt += 1
    if (tt > 1) tt -= 1
    if (tt < 1 / 6) return p + (q - p) * 6 * tt
    if (tt < 1 / 2) return q
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6
    return p
  }
  return { r: f(hn + 1 / 3) * 255, g: f(hn) * 255, b: f(hn - 1 / 3) * 255 }
}

const clampL = (v: number) => Math.min(100, Math.max(0, v))

function withLightness(color: RGB, delta: number): RGB {
  const hsl = rgbToHsl(color)
  return hslToRgb({ ...hsl, l: clampL(hsl.l + delta) })
}

/** روشنایی نسبی طبق فرمول WCAG */
function relativeLuminance({ r, g, b }: RGB): number {
  const lin = (v: number) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

function contrastRatio(a: RGB, b: RGB): number {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  const hi = Math.max(la, lb)
  const lo = Math.min(la, lb)
  return (hi + 0.05) / (lo + 0.05)
}

const WHITE: RGB = { r: 255, g: 255, b: 255 }
const BLACK: RGB = { r: 17, g: 17, b: 17 }

function grade(ratio: number): { label: string; cls: string } {
  if (ratio >= 7) return { label: 'AAA ✓', cls: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300' }
  if (ratio >= 4.5) return { label: 'AA ✓', cls: 'border-teal-400/40 bg-teal-400/10 text-teal-300' }
  if (ratio >= 3) return { label: 'AA بزرگ ✓', cls: 'border-amber-400/40 bg-amber-400/10 text-amber-300' }
  return { label: '✗ رد شد', cls: 'border-rose-400/40 bg-rose-400/10 text-rose-300' }
}

/* ------------------------------------------------------------------ */
/* داده‌های ثابت                                                      */
/* ------------------------------------------------------------------ */

const SANJOB_COLORS: Array<{ hex: string; name: string }> = [
  { hex: SUNJOB_PALETTE.orange, name: 'نارنجی برند' },
  { hex: SUNJOB_PALETTE.violet, name: 'بنفش کهکشانی' },
  { hex: SUNJOB_PALETTE.teal, name: 'فیروزه‌ای' },
  { hex: SUNJOB_PALETTE.rose, name: 'رز جسور' },
  { hex: SUNJOB_PALETTE.navy, name: 'سرمه‌ای شب' },
  { hex: SUNJOB_PALETTE.cream, name: 'کرم صبحگاهی' },
]

const RANGE_CLS =
  'h-2.5 w-full cursor-pointer appearance-none rounded-full outline-none [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-zinc-950 [&::-webkit-slider-thumb]:bg-white'

export default function ColorStudioApp() {
  const [color, setColor] = useState<RGB>({ r: 247, g: 147, b: 30 })
  const [hexInput, setHexInput] = useState('#f7931e')
  const [loaded, setLoaded] = useState(false)

  // خواندن آخرین رنگ
  useEffect(() => {
    const timer = window.setTimeout(() => {
      let next: RGB = { r: 247, g: 147, b: 30 }
      try {
        const raw = localStorage.getItem(KEY)
        const data = (raw ? JSON.parse(raw) : {}) as { hex?: string }
        if (typeof data.hex === 'string') {
          const rgb = hexToRgb(data.hex)
          if (rgb) next = rgb
        }
      } catch {
        /* رنگ خراب؟ برمی‌گردیم به نارنجی برند */
      }
      setColor(next)
      setHexInput(rgbToHex(next))
      setLoaded(true)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  // ذخیرهٔ خودکار
  useEffect(() => {
    if (!loaded) return
    try {
      localStorage.setItem(KEY, JSON.stringify({ hex: rgbToHex(color) }))
    } catch {
      /* مهم نیست */
    }
  }, [color, loaded])

  const hsl = useMemo(() => rgbToHsl(color), [color])
  const hex = rgbToHex(color)
  const hexValid = HEX_RE.test(hexInput.trim())
  const rgbStr = `rgb(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)})`
  const hslStr = `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)`

  const lighter = withLightness(color, 20)
  const darker = withLightness(color, -20)
  const lighterHex = rgbToHex(lighter)
  const darkerHex = rgbToHex(darker)

  const setHsl = (patch: Partial<HSL>) => {
    const next = hslToRgb({ ...hsl, ...patch })
    setColor(next)
    setHexInput(rgbToHex(next))
  }

  const applyHex = (text: string) => {
    setHexInput(text)
    if (HEX_RE.test(text.trim())) {
      const rgb = hexToRgb(text.trim())
      if (rgb) setColor(rgb)
    }
  }

  const toast = (body: string, icon = '🎨') => {
    useOS.getState().pushToast({ title: 'کارگاه رنگ', body, icon })
  }

  const copy = async (text: string, label: string) => {
    let ok = false
    try {
      await navigator.clipboard.writeText(text)
      ok = true
    } catch {
      try {
        const ta = document.createElement('textarea')
        ta.value = text
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
        ok = true
      } catch {
        ok = false
      }
    }
    toast(ok ? `${label} کپی شد!` : 'کپی نشد؛ دستی انتخاب کن!', ok ? '🎨' : '😅')
  }

  const applyBase = (h: string) => {
    const rgb = hexToRgb(h)
    if (!rgb) return
    setColor(rgb)
    setHexInput(rgbToHex(rgb))
    toast(`${h} رنگ پایه شد!`, '🪄')
  }

  /* ---------- پالت خودکار ---------- */

  const palettes = useMemo(() => {
    const { h, s, l } = hsl
    const at = (hh: number, ss: number, ll: number): RGB => hslToRgb({ h: hh, s: ss, l: clampL(ll) })
    const comp = h + 180
    return [
      {
        key: 'comp',
        title: 'مکمل (Complementary)',
        swatches: [color, at(comp, s, l - 18), at(comp, s, l), at(comp, s, l + 18), at(comp, Math.max(0, s - 35), l)],
      },
      {
        key: 'tri',
        title: 'سه‌گانه (Triadic)',
        swatches: [color, at(h + 120, s, l), at(h + 240, s, l), at(h + 120, s, l + 18), at(h + 240, s, l - 18)],
      },
      {
        key: 'ana',
        title: 'همسایه (Analogous)',
        swatches: [at(h - 30, s, l), at(h - 15, s, l), color, at(h + 15, s, l), at(h + 30, s, l)],
      },
      {
        key: 'shades',
        title: 'سایه‌روشن (Shades)',
        swatches: [at(h, s, l + 30), at(h, s, l + 15), color, at(h, s, l - 15), at(h, s, l - 30)],
      },
    ]
  }, [color, hsl])

  /* ---------- کنتراست ---------- */

  const cWhite = contrastRatio(color, WHITE)
  const cBlack = contrastRatio(color, BLACK)
  const onColorText = cWhite >= cBlack ? '#ffffff' : '#111111'
  const onDarkText = contrastRatio(darker, WHITE) >= contrastRatio(darker, BLACK) ? '#ffffff' : '#111111'

  const outputs = [
    { label: 'HEX', value: hex },
    { label: 'RGB', value: rgbStr },
    { label: 'HSL', value: hslStr },
  ]

  const contrastTests = [
    { key: 'white', text: '#ffffff', label: 'متن سفید', sample: 'استخدام توسعه‌دهندهٔ فرانت‌اند', ratio: cWhite },
    { key: 'black', text: '#111111', label: 'متن مشکی', sample: 'استخدام توسعه‌دهندهٔ فرانت‌اند', ratio: cBlack },
  ]

  const actionBtnCls =
    'size-6 shrink-0 text-zinc-500 hover:bg-white/10 hover:text-zinc-100'

  return (
    <div className="flex h-full w-full flex-col bg-zinc-950/60">
      <div className="os-scroll min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        {/* هدر */}
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="flex items-center gap-1.5 text-sm font-black text-zinc-100">
            کارگاه رنگ
            <span aria-hidden>🎨</span>
          </h2>
          <span className="text-[10px] text-zinc-500">با اسپانسری سان‌جاب</span>
          <span className="ms-auto text-[10px] text-zinc-600">چشم‌ها هم سرِ کارشان می‌آیند!</span>
        </div>

        {/* رنگ‌گزین */}
        <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-3">
          <p className="mb-2 text-xs font-bold text-zinc-300">رنگ‌گزین</p>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={hex}
              onChange={(e) => applyHex(e.target.value)}
              aria-label="انتخابگر رنگ"
              className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-white/10 bg-transparent p-1"
            />
            <Input
              dir="ltr"
              value={hexInput}
              onChange={(e) => applyHex(e.target.value)}
              onBlur={() => setHexInput(hex)}
              spellCheck={false}
              placeholder="#f7931e"
              aria-label="کد هگز"
              className={`min-w-0 flex-1 border-white/10 bg-zinc-950/70 text-center font-mono text-xs uppercase text-zinc-100 focus-visible:ring-1 ${
                hexValid ? '' : 'border-rose-400/70 text-rose-300'
              }`}
            />
            <button
              type="button"
              onClick={() => copy(hex, hex)}
              title="کپی رنگ"
              className="flex h-10 min-w-24 flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 font-mono text-sm font-black transition hover:opacity-90 active:scale-95"
              style={{ backgroundColor: hex, color: onColorText }}
            >
              <Copy className="size-3.5" />
              {hex}
            </button>
          </div>
          {!hexValid && (
            <p className="mt-1.5 text-[10px] font-bold text-rose-300">
              فرمت هگز معتبر نیست؛ مثل #f7931e یا #f93 بنویس!
            </p>
          )}

          {/* اسلایدرهای HSL */}
          <div className="mt-3 space-y-2.5">
            <div>
              <div className="mb-1 flex items-center justify-between text-[11px] text-zinc-300">
                <span>فام (Hue)</span>
                <span dir="ltr" className="font-mono font-bold" style={{ color: hex }}>
                  {Math.round(hsl.h)}°
                </span>
              </div>
              <input
                type="range"
                dir="ltr"
                min={0}
                max={360}
                step={1}
                value={Math.round(hsl.h)}
                onChange={(e) => setHsl({ h: Number(e.target.value) })}
                aria-label="فام"
                className={RANGE_CLS}
                style={{
                  background:
                    'linear-gradient(to right,#f00,#ff0 17%,#0f0 33%,#0ff 50%,#00f 67%,#f0f 83%,#f00)',
                }}
              />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-[11px] text-zinc-300">
                <span>اشباع (Saturation)</span>
                <span dir="ltr" className="font-mono font-bold" style={{ color: hex }}>
                  {Math.round(hsl.s)}%
                </span>
              </div>
              <input
                type="range"
                dir="ltr"
                min={0}
                max={100}
                step={1}
                value={Math.round(hsl.s)}
                onChange={(e) => setHsl({ s: Number(e.target.value) })}
                aria-label="اشباع"
                className={RANGE_CLS}
                style={{
                  background: `linear-gradient(to right, hsl(${hsl.h},0%,${hsl.l}%), hsl(${hsl.h},100%,${hsl.l}%))`,
                }}
              />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-[11px] text-zinc-300">
                <span>روشنایی (Lightness)</span>
                <span dir="ltr" className="font-mono font-bold" style={{ color: hex }}>
                  {Math.round(hsl.l)}%
                </span>
              </div>
              <input
                type="range"
                dir="ltr"
                min={0}
                max={100}
                step={1}
                value={Math.round(hsl.l)}
                onChange={(e) => setHsl({ l: Number(e.target.value) })}
                aria-label="روشنایی"
                className={RANGE_CLS}
                style={{
                  background: `linear-gradient(to right, #000, hsl(${hsl.h},${hsl.s}%,50%), #fff)`,
                }}
              />
            </div>
          </div>
        </div>

        {/* خروجی‌های زنده */}
        <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-3">
          <p className="mb-2 text-xs font-bold text-zinc-300">کدهای آمادهٔ کپی</p>
          <div className="space-y-1.5">
            {outputs.map((o) => (
              <div
                key={o.label}
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-zinc-950/50 px-2.5 py-1.5"
              >
                <span className="w-9 shrink-0 text-[10px] font-black text-zinc-500">{o.label}</span>
                <code dir="ltr" className="min-w-0 flex-1 truncate font-mono text-[11px] text-zinc-200">
                  {o.value}
                </code>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => copy(o.value, o.label)}
                  aria-label={`کپی ${o.label}`}
                  className={actionBtnCls}
                >
                  <Copy className="size-3" />
                </Button>
              </div>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => copy(lighterHex, 'نسخهٔ روشن‌تر')}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-zinc-950/50 p-2 text-start transition hover:border-white/30"
            >
              <span className="size-7 shrink-0 rounded-md border border-white/10" style={{ backgroundColor: lighterHex }} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1 text-[10px] font-bold text-zinc-300">
                  <Sun className="size-3 text-amber-300" />
                  روشن‌تر +۲۰٪
                </span>
                <code dir="ltr" className="block truncate font-mono text-[10px] text-zinc-500">
                  {lighterHex}
                </code>
              </span>
            </button>
            <button
              type="button"
              onClick={() => copy(darkerHex, 'نسخهٔ تیره‌تر')}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-zinc-950/50 p-2 text-start transition hover:border-white/30"
            >
              <span className="size-7 shrink-0 rounded-md border border-white/10" style={{ backgroundColor: darkerHex }} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1 text-[10px] font-bold text-zinc-300">
                  <Moon className="size-3 text-indigo-300" />
                  تیره‌تر −۲۰٪
                </span>
                <code dir="ltr" className="block truncate font-mono text-[10px] text-zinc-500">
                  {darkerHex}
                </code>
              </span>
            </button>
          </div>
        </div>

        {/* پالت خودکار */}
        <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-3">
          <p className="mb-2 text-xs font-bold text-zinc-300">
            پالت خودکار از رنگ پایه <span className="text-[10px] font-normal text-zinc-500">(کلیک = کپی)</span>
          </p>
          <div className="space-y-2.5">
            {palettes.map((p) => (
              <div key={p.key}>
                <p className="mb-1 text-[11px] font-bold text-zinc-400">{p.title}</p>
                <div className="grid grid-cols-5 gap-1.5">
                  {p.swatches.map((sw, i) => {
                    const swHex = rgbToHex(sw)
                    return (
                      <button
                        key={`${p.key}-${i}`}
                        type="button"
                        onClick={() => copy(swHex, swHex)}
                        title={`کپی ${swHex}`}
                        className="group rounded-lg border border-white/10 p-1 transition hover:border-white/30"
                      >
                        <span className="block h-9 w-full rounded-md" style={{ backgroundColor: swHex }} />
                        <span
                          dir="ltr"
                          className="mt-1 block truncate text-center font-mono text-[9px] text-zinc-500 group-hover:text-zinc-300"
                        >
                          {swHex}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* تست کنتراست */}
        <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-3">
          <p className="mb-2 text-xs font-bold text-zinc-300">تست کنتراست (WCAG)</p>
          <div className="grid grid-cols-2 gap-2">
            {contrastTests.map((t) => {
              const g = grade(t.ratio)
              return (
                <div key={t.key} className="rounded-lg border border-white/10 p-2.5" style={{ backgroundColor: hex }}>
                  <p className="text-[11px] font-black" style={{ color: t.text }}>
                    {t.label}
                  </p>
                  <p className="mt-0.5 text-[10px] leading-5" style={{ color: t.text, opacity: 0.85 }}>
                    {t.sample}
                  </p>
                  <div className="mt-2 flex items-center justify-between border-t border-white/15 pt-1.5">
                    <span dir="ltr" className="font-mono text-[10px] font-bold" style={{ color: t.text }}>
                      {t.ratio.toFixed(2)}:1
                    </span>
                    <span className={`rounded-full border px-1.5 py-0.5 text-[9px] font-black ${g.cls}`}>{g.label}</span>
                  </div>
                </div>
              )
            })}
          </div>
          <p className="mt-2 text-[10px] leading-5 text-zinc-500">
            AA یعنی نسبت ۴.۵ به بالا، AAA یعنی ۷ به بالا. اگر رد شد، متن روی این رنگ نخوانده می‌شود، به چشم‌ها رحم کن!
          </p>
        </div>

        {/* پالت سان‌جاب */}
        <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-3">
          <p className="mb-2 text-xs font-bold text-zinc-300">
            🐿️ پالت سان‌جاب <span className="text-[10px] font-normal text-zinc-500">(قطره = رنگ پایه)</span>
          </p>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {SANJOB_COLORS.map((c) => (
              <div key={c.hex} className="flex items-center gap-2 rounded-lg border border-white/10 bg-zinc-950/50 p-1.5">
                <span className="size-8 shrink-0 rounded-md border border-white/15" style={{ backgroundColor: c.hex }} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[11px] font-bold text-zinc-200">{c.name}</span>
                  <code dir="ltr" className="block font-mono text-[10px] text-zinc-500">
                    {c.hex}
                  </code>
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => applyBase(c.hex)}
                  title="انتخاب به‌عنوان رنگ پایه"
                  aria-label="انتخاب رنگ پایه"
                  className={actionBtnCls}
                >
                  <Pipette className="size-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => copy(c.hex, c.hex)}
                  title="کپی"
                  aria-label="کپی رنگ"
                  className={actionBtnCls}
                >
                  <Copy className="size-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* پیش‌نمایش */}
        <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-3">
          <p className="mb-2 text-xs font-bold text-zinc-300">پیش‌نمایش زنده روی یک کارت نمونه</p>
          <div className="overflow-hidden rounded-xl border border-white/10">
            <div className="p-3" style={{ backgroundColor: hex, color: onColorText }}>
              <p className="text-sm font-black">آگهی شغلی آزمایشی</p>
              <p className="mt-0.5 text-[11px] opacity-80">
                استخدام پرتابلِ رنگی، حقوق: به وزنِ کدت! 🐿️
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 bg-zinc-950/80 p-3">
              <span
                className="rounded-lg px-3 py-1.5 text-[11px] font-black transition hover:opacity-90"
                style={{ backgroundColor: hex, color: onColorText }}
              >
                ارسال رزومه
              </span>
              <span
                className="rounded-full px-2.5 py-1 text-[10px] font-bold"
                style={{ backgroundColor: lighterHex, color: '#1a2744' }}
              >
                فوری
              </span>
              <span
                className="rounded-full px-2.5 py-1 text-[10px] font-bold"
                style={{ backgroundColor: darkerHex, color: onDarkText }}
              >
                دورکاری
              </span>
              <span className="h-2 min-w-12 flex-1 rounded-full bg-zinc-800">
                <span className="block h-2 rounded-full" style={{ width: '64%', backgroundColor: hex }} />
              </span>
            </div>
          </div>
          <p className="mt-2 text-[10px] text-zinc-500">
            رنگ متنِ روی رنگ پایه خودکار بر اساس کنتراست انتخاب می‌شود.
          </p>
        </div>
      </div>
    </div>
  )
}
