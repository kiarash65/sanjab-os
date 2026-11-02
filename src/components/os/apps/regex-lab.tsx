'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ChevronDown, Play, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { SUNJOB_PALETTE } from '@/lib/os/brand'
import { useOS } from '@/lib/os/store'

const KEY = 'sunjob-regex-v1'
const MAX_MATCHES = 500
const MAX_RESULTS_SHOWN = 100

const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
const toFa = (value: number | string): string =>
  String(value).replace(/\d/g, (digit) => FA_DIGITS[Number(digit)] ?? digit)

interface MatchInfo {
  index: number
  value: string
  groups: Array<string | undefined>
  named: Record<string, string> | undefined
}

interface ScanResult {
  matches: MatchInfo[]
  error: string
}

interface FlagState {
  g: boolean
  i: boolean
  m: boolean
}

interface CheatRow {
  token: string
  desc: string
  example: string
}

interface Challenge {
  title: string
  emoji: string
  pattern: string
  flags: string
  sample: string
  hint: string
}

const DEFAULT_TEXT = `کاربر ali@gmail.com دیروز ثبت‌نام کرد.
شماره‌اش 09121234567 است و کدپستی‌اش 1234567890.
قرار ما ۱۴۰۲/۰۸/۱۵ است یا 2024-11-06؟
قیمت دوره: 25000 تومان — فقط 20% تخفیف!
رنگ لوگو #f7931e و #8B5CF6 است.`

const FLAG_DEFS: Array<{ key: keyof FlagState; label: string; color: string }> = [
  { key: 'g', label: 'همهٔ مچ‌ها (global)', color: SUNJOB_PALETTE.orange },
  { key: 'i', label: 'بی‌تفاوت به بزرگی حروف', color: SUNJOB_PALETTE.violet },
  { key: 'm', label: 'چندخطی (^ و $ برای هر خط)', color: SUNJOB_PALETTE.teal },
]

const CHEATS: CheatRow[] = [
  { token: '\\d', desc: 'هر عدد از ۰ تا ۹', example: '\\d+' },
  { token: '\\w', desc: 'حرف انگلیسی، عدد یا زیرخط', example: '\\w+' },
  { token: '\\s', desc: 'فاصله، تب یا خط جدید', example: '\\s+' },
  { token: '.', desc: 'هر کاراکتر به‌جز خط جدید', example: 'a.c' },
  { token: '*', desc: 'صفر بار یا بیشتر', example: 'ab*c' },
  { token: '+', desc: 'یک بار یا بیشتر', example: 'ab+c' },
  { token: '?', desc: 'صفر یا یک بار (اختیاری)', example: 'colou?r' },
  { token: '{n}', desc: 'دقیقاً n بار تکرار', example: '\\d{4}' },
  { token: '[abc]', desc: 'یکی از کاراکترهای داخل کروشه', example: '[aeiou]+' },
  { token: '(…|…)', desc: 'یکی از گزینه‌ها (یا منطقی)', example: '(cat|dog)' },
  { token: '^', desc: 'شروع رشته (با m: شروع هر خط)', example: '^#' },
  { token: '$', desc: 'پایان رشته (با m: پایان هر خط)', example: '\\d$' },
  { token: '\\b', desc: 'مرز کلمه', example: '\\bjob\\b' },
  { token: '(?<name>…)', desc: 'گروه گرفتن با نام دلخواه', example: '(?<year>\\d{4})-(?<month>\\d{2})' },
  { token: '(?=…)', desc: 'نگاه به جلو: بعدش باید بیاید ولی جزو مچ نیست', example: '\\d+(?= تومان)' },
  { token: '(?!…)', desc: 'نگاه به جلوی منفی: بعدش نباید بیاید', example: '\\d{3}(?!\\d)' },
]

const CHALLENGES: Challenge[] = [
  {
    title: 'شماره موبایل ایران',
    emoji: '📱',
    pattern: '^09\\d{9}$',
    flags: 'gm',
    sample: '09121234567\n09359876543\n02112345678\n989121234567\n0912 345 6789',
    hint: 'با فلگ m هر خط جدا سنجیده می‌شود؛ فقط شماره‌های خالص ۱۱ رقمی که با 09 شروع شوند قبول‌اند!',
  },
  {
    title: 'شکار ایمیل',
    emoji: '📧',
    pattern: '[\\w.+-]+@[\\w-]+\\.[\\w.-]{2,}',
    flags: 'g',
    sample: 'ali@gmail.com\nsara.k@yahoo.co.uk\ninfo@sunjob.ir\nbad@@mail\nx@y',
    hint: 'دو @ پشت‌سرهم یا دامنهٔ خیلی کوتاه شکار نمی‌شوند؛ regex سخت‌گیر است!',
  },
  {
    title: 'تاریخ شمسی',
    emoji: '📅',
    pattern: '1[34]\\d{2}/\\d{1,2}/\\d{1,2}',
    flags: 'g',
    sample: 'امروز ۱۴۰۲/۰۸/۱۵ است\n1403/03/21 درست است\n1399/12/30 قدیمی ولی معتبر\n۲۰۲۴/۱۱/۰۶ شمسی نیست!',
    hint: 'سال‌های ۱۳xx و ۱۴xx را می‌گیرد. نکته: اعداد فارسی با \\d شکار نمی‌شوند؛ \\d یعنی 0-9 لاتین!',
  },
  {
    title: 'قیمت به تومان',
    emoji: '💰',
    pattern: '\\d+(?=\\s*تومان)',
    flags: 'g',
    sample: 'چای 25000 تومان\nنان 500 تومان\nبلیط 1200000 ریال\nقهوه ۸۵۰۰۰ تومان',
    hint: 'با lookahead فقط عددِ قبل از «تومان» می‌آید؛ ریالی‌ها و اعداد فارسی نجات پیدا می‌کنند!',
  },
  {
    title: 'کد رنگ هگز',
    emoji: '🎨',
    pattern: '#[0-9a-fA-F]{6}\\b',
    flags: 'gi',
    sample: '#f7931e\n#8B5CF6\n#fff\nبدون هشتگ: 0ea5a0',
    hint: 'با فلگ i حروف بزرگ و کوچک فرقی نمی‌کنند؛ ولی #fff سه‌رقبی شکار نمی‌شود!',
  },
]

function scanText(pattern: string, flagStr: string, text: string): ScanResult {
  if (pattern === '') return { matches: [], error: '' }
  try {
    const re = new RegExp(pattern, flagStr)
    const found: MatchInfo[] = []
    if (re.global) {
      let guard = 0
      while (guard < 10000 && found.length < MAX_MATCHES) {
        const m = re.exec(text)
        if (!m) break
        found.push({ index: m.index, value: m[0], groups: m.slice(1), named: m.groups })
        if (m[0] === '') re.lastIndex += 1 // جلوگیری از حلقهٔ بی‌نهایت روی مچ‌های خالی
        guard += 1
      }
    } else {
      const m = re.exec(text)
      if (m) found.push({ index: m.index, value: m[0], groups: m.slice(1), named: m.groups })
    }
    return { matches: found, error: '' }
  } catch (e) {
    return { matches: [], error: e instanceof Error ? e.message : 'الگوی نامعتبر است' }
  }
}

export default function RegexLabApp() {
  const [pattern, setPattern] = useState('')
  const [flags, setFlags] = useState<FlagState>({ g: true, i: false, m: false })
  const [testText, setTestText] = useState(DEFAULT_TEXT)
  const [cheatOpen, setCheatOpen] = useState(false)
  const [hint, setHint] = useState('')
  const [loaded, setLoaded] = useState(false)

  // خواندن آخرین الگو از localStorage
  useEffect(() => {
    const timer = window.setTimeout(() => {
      let savedPattern = ''
      let savedFlags: Partial<FlagState> = {}
      try {
        const raw = localStorage.getItem(KEY)
        const data = (raw ? JSON.parse(raw) : {}) as { pattern?: string; flags?: Partial<FlagState> }
        if (typeof data.pattern === 'string') savedPattern = data.pattern
        if (data.flags) savedFlags = data.flags
      } catch {
        /* داده خراب؟ بی‌خیال، تازه شروع می‌کنیم */
      }
      setPattern(savedPattern)
      setFlags((prev) => ({ ...prev, ...savedFlags }))
      setLoaded(true)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  // ذخیرهٔ الگو و فلگ‌ها
  useEffect(() => {
    if (!loaded) return
    try {
      localStorage.setItem(KEY, JSON.stringify({ pattern, flags }))
    } catch {
      /* مهم نیست */
    }
  }, [pattern, flags, loaded])

  const flagStr = `${flags.g ? 'g' : ''}${flags.i ? 'i' : ''}${flags.m ? 'm' : ''}`

  const result = useMemo(
    () => scanText(pattern, flagStr, testText),
    [pattern, flagStr, testText]
  )

  /** بازسازی متن به‌شکل قطعه‌های هایلایت‌شده */
  const segments = useMemo(() => {
    const segs: Array<{ text: string; hit: boolean; id: number }> = []
    let pos = 0
    let id = 0
    for (const m of result.matches) {
      if (m.index < pos) continue
      if (m.index > pos) {
        segs.push({ text: testText.slice(pos, m.index), hit: false, id })
        id += 1
      }
      if (m.value.length > 0) {
        segs.push({ text: testText.slice(m.index, m.index + m.value.length), hit: true, id })
        id += 1
        pos = m.index + m.value.length
      }
    }
    if (pos < testText.length) {
      segs.push({ text: testText.slice(pos), hit: false, id })
    }
    return segs
  }, [result.matches, testText])

  const toast = (body: string, icon = '🧪') => {
    useOS.getState().pushToast({ title: 'آزمایشگاه Regex', body, icon })
  }

  const applyExample = (example: string) => {
    setPattern(example)
    toast('الگوی نمونه بارگذاری شد؛ نتیجه را زنده ببین!')
  }

  const loadChallenge = (c: Challenge) => {
    setPattern(c.pattern)
    setTestText(c.sample)
    setFlags({ g: c.flags.includes('g'), i: c.flags.includes('i'), m: c.flags.includes('m') })
    setHint(c.hint)
    toast(`چالش «${c.title}» بارگذاری شد!`)
  }

  const countColor = result.error
    ? SUNJOB_PALETTE.rose
    : result.matches.length > 0
      ? SUNJOB_PALETTE.teal
      : '#a1a1aa'

  const highlightReady = pattern !== '' && result.error === ''

  return (
    <div className="flex h-full w-full flex-col bg-zinc-950/60">
      <div className="os-scroll min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        {/* هدر */}
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="flex items-center gap-1.5 text-sm font-black text-zinc-100">
            آزمایشگاه Regex
            <span aria-hidden>🧪</span>
          </h2>
          <span className="text-[10px] text-zinc-500">با اسپانسری سان‌جاب</span>
          <span
            className="ms-auto rounded-full border border-white/10 bg-zinc-900/70 px-2.5 py-1 text-[11px] font-bold"
            style={{ color: countColor }}
          >
            {result.error !== ''
              ? 'الگوی خراب است!'
              : `${toFa(result.matches.length)} مورد پیدا شد`}
          </span>
        </div>

        {/* ورودی الگو */}
        <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-3">
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="re-pattern" className="text-xs font-bold text-zinc-300">
              الگو (Pattern)
            </label>
            <span className="text-[10px] text-zinc-500">بین دو اسلش — مثل فیلم‌های اکشن!</span>
          </div>
          <div dir="ltr" className="flex items-center gap-1.5">
            <span className="font-mono text-sm text-zinc-500">/</span>
            <Input
              id="re-pattern"
              dir="ltr"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="مثلاً: 09\d{9}"
              spellCheck={false}
              className="flex-1 border-white/10 bg-zinc-950/70 font-mono text-xs text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-1"
            />
            <span className="font-mono text-sm text-zinc-500">/</span>
            <span className="min-w-6 text-center font-mono text-xs font-bold" style={{ color: SUNJOB_PALETTE.orange }}>
              {flagStr === '' ? '·' : flagStr}
            </span>
          </div>

          {result.error !== '' && (
            <p className="mt-2 flex items-center gap-1.5 rounded-lg border border-rose-400/30 bg-rose-400/10 px-2.5 py-1.5 text-[11px] font-bold text-rose-300">
              <AlertTriangle className="size-3.5 shrink-0" />
              الگوی نامعتبر:
              <span dir="ltr" className="min-w-0 flex-1 truncate font-mono font-normal">
                {result.error}
              </span>
            </p>
          )}

          {/* فلگ‌ها */}
          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5">
            {FLAG_DEFS.map((f) => (
              <label key={f.key} className="flex cursor-pointer items-center gap-1.5 text-[11px] text-zinc-300">
                <input
                  type="checkbox"
                  checked={flags[f.key]}
                  onChange={() => setFlags((prev) => ({ ...prev, [f.key]: !prev[f.key] }))}
                  className="size-3.5 cursor-pointer rounded"
                  style={{ accentColor: f.color }}
                />
                <code dir="ltr" className="font-mono font-bold">
                  {f.key}
                </code>
                <span className="text-zinc-500">{f.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* متن تست + هایلایت زنده */}
        <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-3">
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="re-text" className="text-xs font-bold text-zinc-300">
              متن تست
            </label>
            <span className="text-[10px] text-zinc-500">{toFa(testText.length)} کاراکتر</span>
          </div>
          <Textarea
            id="re-text"
            dir="ltr"
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            spellCheck={false}
            className="min-h-24 resize-y border-white/10 bg-zinc-950/70 font-mono text-xs leading-6 text-zinc-100 focus-visible:ring-1"
          />
          <div className="mt-2.5">
            <p className="mb-1 text-[10px] font-bold text-zinc-500">نمای زندهٔ مچ‌ها:</p>
            <pre
              dir="ltr"
              className="os-scroll max-h-44 min-h-10 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-white/10 bg-zinc-950 p-3 font-mono text-xs leading-6 text-zinc-300"
            >
              {highlightReady
                ? segments.map((seg) =>
                    seg.hit ? (
                      <mark
                        key={seg.id}
                        className="rounded-sm bg-orange-400/25 px-0.5 text-orange-200 ring-1 ring-orange-400/40"
                      >
                        {seg.text}
                      </mark>
                    ) : (
                      <span key={seg.id}>{seg.text}</span>
                    )
                  )
                : testText}
            </pre>
          </div>
        </div>

        {/* نتایج */}
        <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-bold text-zinc-300">نتایج</p>
            <p className="text-[10px] text-zinc-500">
              {pattern === ''
                ? 'الگویی وارد نکردی'
                : result.error !== ''
                  ? 'اول الگو را درست کن'
                  : `${toFa(result.matches.length)} مورد`}
            </p>
          </div>

          {pattern === '' ? (
            <p className="rounded-lg border border-dashed border-white/10 px-3 py-4 text-center text-[11px] leading-6 text-zinc-500">
              یه الگو بنویس تا شکار شروع شود! 🎯
              <br />
              از چالش‌های آماده یا برگه تقلب هم می‌توانی کمک بگیری.
            </p>
          ) : result.matches.length === 0 ? (
            <p className="rounded-lg border border-dashed border-white/10 px-3 py-4 text-center text-[11px] text-zinc-500">
              {result.error !== '' ? 'اول الگو را درست کن!' : 'مچی پیدا نشد؛ شاید متن بی‌گناه است! 😅'}
            </p>
          ) : (
            <>
              <ul className="os-scroll max-h-64 space-y-1.5 overflow-y-auto">
                {result.matches.slice(0, MAX_RESULTS_SHOWN).map((m, i) => {
                  const hasNamed = m.named !== undefined && Object.keys(m.named).length > 0
                  return (
                    <li
                      key={`${m.index}-${i}`}
                      className="rounded-lg border border-white/10 bg-zinc-950/50 px-2.5 py-1.5"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="flex size-5 shrink-0 items-center justify-center rounded-md text-[10px] font-black text-zinc-950"
                          style={{ backgroundColor: SUNJOB_PALETTE.orange }}
                        >
                          {toFa(i + 1)}
                        </span>
                        <code dir="ltr" className="min-w-0 flex-1 truncate font-mono text-[11px] text-orange-200">
                          {m.value === '' ? '⌀ (مچ خالی)' : m.value}
                        </code>
                        <span dir="ltr" className="shrink-0 font-mono text-[10px] text-zinc-500">
                          @{m.index}
                        </span>
                      </div>
                      {(m.groups.length > 0 || hasNamed) && (
                        <div className="mt-1 space-y-0.5 border-t border-white/5 pt-1">
                          {m.groups.map((g, gi) => (
                            <div key={gi} className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                              <span className="shrink-0">گروه {toFa(gi + 1)}:</span>
                              <code dir="ltr" className="min-w-0 flex-1 truncate font-mono text-teal-300">
                                {g === undefined ? '— (خالی)' : g === '' ? '⌀' : g}
                              </code>
                            </div>
                          ))}
                          {hasNamed &&
                            Object.entries(m.named!).map(([name, value]) => (
                              <div key={name} className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                                <span className="shrink-0">گروه «{name}»:</span>
                                <code dir="ltr" className="min-w-0 flex-1 truncate font-mono text-violet-300">
                                  {value === '' ? '⌀' : value}
                                </code>
                              </div>
                            ))}
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
              {result.matches.length > MAX_RESULTS_SHOWN && (
                <p className="mt-1.5 text-[10px] text-zinc-600">
                  فقط {toFa(MAX_RESULTS_SHOWN)} مورد اول نمایش داده می‌شود؛ بقیه هم آن‌جایند، نگران نباش!
                </p>
              )}
            </>
          )}
        </div>

        {/* چالش‌های آماده */}
        <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-3">
          <p className="mb-2 text-xs font-bold text-zinc-300">🏆 چالش‌های آماده</p>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {CHALLENGES.map((c) => (
              <div key={c.title} className="rounded-lg border border-white/10 bg-zinc-950/50 p-2">
                <div className="flex items-center gap-1.5">
                  <span aria-hidden>{c.emoji}</span>
                  <span className="min-w-0 flex-1 truncate text-[11px] font-bold text-zinc-200">{c.title}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => loadChallenge(c)}
                    className="h-6 shrink-0 gap-1 border-white/10 bg-zinc-800/70 px-2 text-[10px] text-zinc-300 hover:bg-white/10 hover:text-zinc-100"
                  >
                    <Zap className="size-3" />
                    بارگذاری
                  </Button>
                </div>
                <code dir="ltr" className="mt-1 block truncate font-mono text-[10px] text-teal-300/90">
                  /{c.pattern}/{c.flags}
                </code>
              </div>
            ))}
          </div>
          {hint !== '' && <p className="mt-2 text-[10px] leading-5 text-zinc-400">💡 {hint}</p>}
        </div>

        {/* برگه تقلب جمع‌شونده */}
        <div className="rounded-xl border border-white/10 bg-zinc-900/60">
          <button
            type="button"
            onClick={() => setCheatOpen((o) => !o)}
            className="flex w-full items-center gap-1.5 px-3 py-2.5 text-xs font-bold text-zinc-200"
          >
            <span className="flex-1 text-start">📋 برگه تقلب — پرکاربردترین نمادها</span>
            <ChevronDown
              className={`size-4 text-zinc-400 transition-transform ${cheatOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {cheatOpen && (
            <div className="border-t border-white/10 p-3">
              <div className="space-y-0.5">
                {CHEATS.map((row) => (
                  <div
                    key={row.token}
                    className="flex items-center gap-2 rounded-lg px-1.5 py-1 transition hover:bg-white/5"
                  >
                    <code
                      dir="ltr"
                      className="w-24 shrink-0 rounded-md border border-white/10 bg-zinc-950/80 px-1.5 py-0.5 text-center font-mono text-[10px] text-orange-200"
                    >
                      {row.token}
                    </code>
                    <span className="min-w-0 flex-1 text-[10.5px] leading-5 text-zinc-400">{row.desc}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => applyExample(row.example)}
                      className="h-6 shrink-0 gap-1 px-2 text-[10px] text-zinc-400 hover:bg-white/10 hover:text-zinc-100"
                    >
                      <Play className="size-2.5" />
                      امتحان
                    </Button>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[10px] text-zinc-600">
                دکمهٔ «امتحان» الگو را در ورودی بالا می‌گذارد؛ متن تست خودت را داشته باش!
              </p>
            </div>
          )}
        </div>

        <p className="pb-1 text-center text-[10px] text-zinc-600">
          Regex مثل دوچرخه‌سواری است — اول افتادی، بعد پرواز می‌کنی! 🚴
        </p>
      </div>
    </div>
  )
}
