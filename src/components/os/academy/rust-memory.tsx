'use client'

/* ================================================================
   آزمایشگاه حافظه Rust — چهار نمودار تعاملی برای مالکیت، قرض، clone و scope
   این کامپوننت کاملاً مستقل است و هیچ وابستگی‌ای به rust-academy ندارد.
   رنگ‌ها: زمردی = معتبر، رز = خطا/نامعتبر، خاکستری = جابه‌جاشده،
   کهربایی/نارنجی = &mut و هشدار، فیروزه‌ای = &str، بنفش = کپی/مقایسه.
   ================================================================ */

import { Fragment, useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  AlertTriangle, ArrowDown, Boxes, CheckCircle2,
  Copy, Cpu, Eye, HardDrive,
  HelpCircle, Layers, Link2, Pause,
  PenLine, Play, RotateCcw, Scale,
  Timer, X, XCircle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

/* ================================================================
   انواع و ثابت‌های عمومی
   ================================================================ */

export type RustMemoryLessonId = 'mem-move' | 'mem-borrow' | 'mem-clone' | 'mem-scope'

export const RUST_MEMORY_LESSONS: RustMemoryLessonId[] = ['mem-move', 'mem-borrow', 'mem-clone', 'mem-scope']

/** برچسب صادقانه — مثل SIM_HINT آکادمی: این‌جا rustc واقعی اجرا نمی‌شود */
const HONEST_NOTE =
  'این نمودارها شبیه‌سازی آموزشیِ وضعیت حافظه‌اند — نه اجرای واقعی rustc. متن خطاها عیناً از پیام‌های واقعی کامپایلر Rust نقل شده تا با شکل و زبان آن‌ها آشنا شوی.'

const fa = (n: number) => n.toLocaleString('fa-IR')

/** پالت حالت‌های حافظه */
const TONE = {
  ok: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
  moved: 'border-zinc-600/60 bg-zinc-800/40 text-zinc-400',
  err: 'border-rose-500/50 bg-rose-500/10 text-rose-200',
  warn: 'border-amber-500/50 bg-amber-500/10 text-amber-200',
  ref: 'border-cyan-500/50 bg-cyan-500/10 text-cyan-200',
  copy: 'border-purple-500/50 bg-purple-500/10 text-purple-200',
} as const

type Tone = keyof typeof TONE

const TONE_TEXT: Record<Tone, string> = {
  ok: 'text-emerald-400', moved: 'text-zinc-500', err: 'text-rose-400',
  warn: 'text-amber-400', ref: 'text-cyan-400', copy: 'text-purple-400',
}

/* ================================================================
   کمکی‌های متنی — کد و شناسه‌ها انگلیسی و LTR می‌مانند
   ================================================================ */

function mono(text: string): ReactNode[] {
  return text.split('`').map((seg, i) =>
    i % 2 === 1 ? (
      <code key={i} dir="ltr" className="mx-0.5 inline-block rounded-md bg-white/10 px-1.5 font-mono text-[0.85em] text-[#f7931e]">
        {seg}
      </code>
    ) : (
      <Fragment key={i}>{seg}</Fragment>
    ),
  )
}

/** مدت انتقال با احترام به reduced-motion — وقتی کاهش‌یافته، پرش لحظه‌ای */
function useDur() {
  const reduced = useReducedMotion() ?? false
  return useCallback((d: number) => ({ duration: reduced ? 0 : d }), [reduced])
}

/* ================================================================
   قلاب گام‌دهنده — هر گام با setTimeout زمان‌بندی می‌شود تا قانون
   react-hooks/set-state-in-effect رعایت شود (setState فقط در callback ناهمگام)
   ================================================================ */

function useStepper(total: number) {
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    if (!playing) return
    if (step >= total) {
      // پایان سناریو — توقف خودکار پخش
      const stop = window.setTimeout(() => setPlaying(false), 350)
      return () => window.clearTimeout(stop)
    }
    const id = window.setTimeout(() => setStep((s) => Math.min(s + 1, total)), 1700)
    return () => window.clearTimeout(id)
  }, [playing, step, total])

  const toggle = useCallback(() => {
    setPlaying((p) => !p)
    setStep((s) => (s >= total ? 0 : s))
  }, [total])

  const reset = useCallback(() => {
    setPlaying(false)
    setStep(0)
  }, [])

  return { step, playing, setStep, setPlaying, toggle, reset }
}

/* ================================================================
   اجزای مشترک رابط
   ================================================================ */

/** جعبهٔ کد LTR با هایلایت خط فعال و خط خطادار */
function CodeBox({ code, active = 0, errorLine = 0 }: { code: string; active?: number; errorLine?: number }) {
  return (
    <pre dir="ltr" className="os-scroll max-h-64 overflow-auto rounded-xl border border-white/10 bg-zinc-950 p-0 text-left font-mono text-[11.5px] leading-6">
      <code className="block">
        {code.split('\n').map((ln, i) => {
          const n = i + 1
          const cls = n === errorLine ? 'bg-rose-500/15 text-rose-300' : n === active ? 'bg-emerald-500/10 text-emerald-200' : 'text-zinc-300'
          return (
            <span key={n} className={`flex gap-2 px-3 ${cls}`}>
              <span className="w-5 shrink-0 select-none text-right text-[10px] text-zinc-600">{n}</span>
              <span className="whitespace-pre">{ln === '' ? ' ' : ln}</span>
            </span>
          )
        })}
      </code>
    </pre>
  )
}

/** کنترل‌های گام: اجرای گام‌به‌گام / توقف / بازنشانی + شمارندهٔ گام */
function StepControls({ step, total, playing, onToggle, onReset }: { step: number; total: number; playing: boolean; onToggle: () => void; onReset: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size="sm" variant="outline" onClick={onToggle}
        aria-label={playing ? 'توقف اجرای گام‌به‌گام' : 'اجرای گام‌به‌گام'}
        className="h-8 gap-1.5 border-[#f7931e]/30 bg-[#f7931e]/10 px-2.5 text-[11px] text-[#f7931e] hover:bg-[#f7931e]/20"
      >
        {playing ? <Pause className="h-3.5 w-3.5" aria-hidden /> : <Play className="h-3.5 w-3.5" aria-hidden />}
        {playing ? 'توقف' : 'اجرای گام‌به‌گام'}
      </Button>
      <Button
        size="sm" variant="outline" onClick={onReset} aria-label="بازنشانی نمودار"
        className="h-8 gap-1.5 border-white/15 bg-zinc-800/60 px-2.5 text-[11px] text-zinc-300 hover:text-zinc-100"
      >
        <RotateCcw className="h-3.5 w-3.5" aria-hidden />
        بازنشانی
      </Button>
      <span dir="rtl" className="rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[10.5px] font-bold text-zinc-300">
        گام {fa(Math.min(step, total))} از {fa(total)}
      </span>
    </div>
  )
}

/** خط توضیح هر گام — با تغییر گام، نرم عوض می‌شود */
function StepNote({ text }: { text: string }) {
  const dur = useDur()
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.p
        key={text} dir="rtl" aria-live="polite"
        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={dur(0.18)}
        className="rounded-xl border border-white/10 bg-black/25 p-2.5 text-[11.5px] leading-6 text-zinc-300"
      >
        {mono(text)}
      </motion.p>
    </AnimatePresence>
  )
}

/** کارت خطای رز — نقل قول واقعی rustc + توضیح فارسی */
function ErrCard({ title, excerpt, why }: { title: string; excerpt: string; why: string }) {
  return (
    <motion.div initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} className="space-y-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3" role="alert">
      <p className="flex items-center gap-1.5 text-[12px] font-bold text-rose-300">
        <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden /> {title}
      </p>
      <pre dir="ltr" className="os-scroll max-h-44 overflow-auto rounded-lg border border-rose-500/20 bg-zinc-950 p-2.5 text-left font-mono text-[10.5px] leading-5 text-rose-200">
        <code>{excerpt}</code>
      </pre>
      <p className="text-[11.5px] leading-6 text-rose-100/85">{mono(why)}</p>
    </motion.div>
  )
}

/** کارت موفقیت سبز */
function OkCard({ text }: { text: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3" role="status">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
      <p className="text-[11.5px] leading-6 text-emerald-100/90">{mono(text)}</p>
    </motion.div>
  )
}

/** پیکان اتصال پشته به heap — در موبایل رو به پایین، در دسکتاپ رو به راست */
function ArrowStrip({ label, tone }: { label: string; tone: Tone }) {
  return (
    <div className="flex flex-col items-center gap-0.5 py-1" aria-hidden>
      <svg viewBox="0 0 64 22" className={`h-5 w-14 md:hidden ${TONE_TEXT[tone]}`} fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="32" y1="2" x2="32" y2="13" />
        <polyline points="25,9 32,19 39,9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <svg viewBox="0 0 64 22" className={`hidden h-5 w-14 md:block ${TONE_TEXT[tone]}`} fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="4" y1="11" x2="53" y2="11" />
        <polyline points="47,4 58,11 47,18" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span dir="ltr" className={`rounded-full border border-white/10 bg-black/40 px-2 py-0.5 font-mono text-[9.5px] font-bold ${TONE_TEXT[tone]}`}>
        {label}
      </span>
    </div>
  )
}

/** قاب ناحیهٔ حافظه: پشته، heap یا فریم‌ها */
function MemZone({ label, icon: Icon, children }: { label: string; icon: LucideIcon; children: ReactNode }) {
  return (
    <div dir="ltr" className="rounded-xl border border-white/10 bg-zinc-950/60 p-3">
      <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold tracking-wide text-zinc-400">
        <Icon className="h-3.5 w-3.5" aria-hidden /> {label}
      </p>
      <div className="space-y-1.5">{children}</div>
    </div>
  )
}

/** سلول پشته: نام متغیر + فیلدها (ptr/len/cap یا مقدار) */
function StackRow({ name, fields, tone, note }: { name: string; fields: string[]; tone: Tone; note?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-1.5 rounded-lg border px-2 py-1.5 ${TONE[tone]}`}>
      <span className="font-mono text-[11.5px] font-black">{name}</span>
      <span className="flex flex-wrap gap-1">
        {fields.map((f, i) => (
          <span key={i} className="rounded-md bg-black/30 px-1.5 py-0.5 font-mono text-[10px]">{f}</span>
        ))}
      </span>
      {note && <span className="text-[9.5px] font-bold leading-4">{note}</span>}
    </div>
  )
}

/** بافر heap: متن + نمایش بایت‌ها + برچسب؛ با drop شدن، ضربدر رز می‌خورد */
function HeapBox({ text, bytes, caption, tone, dropped = false }: { text: string; bytes: number; caption: string; tone: Tone; dropped?: boolean }) {
  const dur = useDur()
  return (
    <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={dur(0.25)} className="relative">
      <div className={`rounded-lg border px-2.5 py-2 ${TONE[tone]} ${dropped ? 'opacity-40' : ''}`}>
        <p dir="ltr" className="font-mono text-[12px] font-bold">{text}</p>
        <div dir="ltr" className="mt-1.5 flex flex-wrap gap-[3px]">
          {Array.from({ length: Math.min(bytes, 20) }, (_, i) => (
            <span key={i} className={`h-1.5 w-1.5 rounded-[2px] ${dropped ? 'bg-rose-400/50' : 'bg-current opacity-60'}`} />
          ))}
        </div>
        <p className="mt-1.5 text-[9.5px] font-bold leading-4">{caption}</p>
      </div>
      {dropped && (
        <motion.span
          initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={dur(0.3)}
          className="absolute -left-2 -top-2 grid h-6 w-6 place-items-center rounded-full border border-rose-500/50 bg-zinc-950 text-rose-400" aria-hidden
        >
          <X className="h-4 w-4" />
        </motion.span>
      )}
    </motion.div>
  )
}

/** کلید دوحالتهٔ سناریو (مثل String/i32 یا scope/drop) */
function SegToggle<T extends string>({ value, options, onChange, ariaLabel }: { value: T; options: { v: T; label: string }[]; onChange: (v: T) => void; ariaLabel: string }) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="flex gap-1 rounded-xl border border-white/10 bg-black/30 p-1">
      {options.map((o) => (
        <button
          key={o.v} role="radio" aria-checked={value === o.v} onClick={() => onChange(o.v)}
          className={`rounded-lg px-2.5 py-1 font-mono text-[10.5px] font-bold transition-colors ${value === o.v ? 'bg-[#f7931e]/15 text-[#f7931e]' : 'text-zinc-400 hover:text-zinc-200'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** قاب هر درس: عنوان + هدف یک‌خطی */
function DiagramFrame({ id, title, goal, icon: Icon, children }: { id: string; title: string; goal: string; icon: LucideIcon; children: ReactNode }) {
  return (
    <section id={id} aria-label={title} className="space-y-3 rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
      <header className="flex items-start gap-2">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-[#f7931e]/30 bg-[#f7931e]/10 text-[#f7931e]">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <h3 className="text-[13px] font-black text-zinc-100">{title}</h3>
          <p className="text-[11px] leading-5 text-zinc-400">{goal}</p>
        </div>
      </header>
      {children}
    </section>
  )
}

/* ================================================================
   درس ۱ — جابه‌جایی (Move) در برابر Copy
   ================================================================ */

const MOVE_STRING_CODE = `fn main() {
    let s1 = String::from("سلام");
    let s2 = s1;
    println!("{}", s1);
}`

const MOVE_COPY_CODE = `fn main() {
    let x: i32 = 5;
    let y = x;
    println!("{} {}", x, y);
}`

/** متن واقعی rustc برای استفاده از مقدار جابه‌جاشده */
const MOVE_ERR_EXCERPT = `error[E0382]: borrow of moved value: \`s1\`
 --> src/main.rs:4:20
  |
2 |     let s1 = String::from("سلام");
  |         -- move occurs because \`s1\` has type \`String\`,
  |            which does not implement the \`Copy\` trait
3 |     let s2 = s1;
  |              -- value moved here
4 |     println!("{}", s1);
  |                    ^^ value borrowed here after move
  |
help: consider cloning the value if the performance cost is acceptable
  |
3 |     let s2 = s1.clone();
  |              ++++++++`

function MoveLesson() {
  const [mode, setMode] = useState<'string' | 'copy'>('string')
  return (
    <DiagramFrame id="mem-move" title="جابه‌جایی مالکیت (Move) در برابر Copy" goal="ببین `let s2 = s1;` با String چه می‌کند — و چرا با i32 مشکلی پیش نمی‌آید." icon={Boxes}>
      {/* key={mode} باعث اجرای تازهٔ سناریو با هر تغییر نوع می‌شود */}
      <MoveScenario key={mode} mode={mode} onModeChange={setMode} />
    </DiagramFrame>
  )
}

function MoveScenario({ mode, onModeChange }: { mode: 'string' | 'copy'; onModeChange: (m: 'string' | 'copy') => void }) {
  const dur = useDur()
  const { step, playing, toggle, reset } = useStepper(4)

  const s1Owner = mode === 'string' && step === 1
  const s1Attempt = mode === 'string' && step === 3
  const s1Moved = mode === 'string' && step >= 2
  const s2Live = mode === 'string' && step >= 2
  const copyX = mode === 'copy' && step >= 1
  const copyY = mode === 'copy' && step >= 2

  const notes: Record<'string' | 'copy', string[]> = {
    string: [
      'هنوز چیزی در حافظه نیست — دکمهٔ «اجرای گام‌به‌گام» را بزن تا انتقال مالکیت را خط‌به‌خط ببینی.',
      '`s1` ساخته شد: نشانگر، طول و ظرفیت روی پشته‌اند و بافر «سلام» در heap — `s1` مالک داده است.',
      '`let s2 = s1;` مالکیت را منتقل می‌کند: نشانگر از `s1` به `s2` رسید؛ `s1` بی‌صاحب شد — کپی واقعی‌ای در کار نبود.',
      'حالا `s1` را چاپ می‌کنیم… کامپایلر دقیقاً روی همین خط می‌ایستد.',
      'در Rust انتقال، مالکیت را منتقل می‌کند؛ `s1` دیگر معتبر نیست — یا `s2` را بخوان یا از `s1.clone()` استفاده کن.',
    ],
    copy: [
      'سناریوی موازی با عدد: هنوز چیزی در حافظه نیست.',
      '`x = 5` مستقیم روی پشته می‌نشیند — برای `i32` هیچ بافری در heap وجود ندارد.',
      '`let y = x;` کل مقدار ۵ را روی پشته کپی کرد — چون `i32` ویژگی `Copy` دارد، `x` هم معتبر می‌ماند.',
      'چاپ هر دو متغیر… این بار کامپایلر اعتراضی ندارد.',
      'چاپ شد: `5 5` — در `Copy` هیچ مالکیتی منتقل نمی‌شود؛ متغیر قبلی معتبر می‌ماند. تفاوت Move و Copy همین‌جاست.',
    ],
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SegToggle
          ariaLabel="انتخاب نوع دادهٔ سناریو" value={mode} onChange={onModeChange}
          options={[{ v: 'string', label: 'String → Move' }, { v: 'copy', label: 'i32 → Copy' }]}
        />
        <StepControls step={step} total={4} playing={playing} onToggle={toggle} onReset={reset} />
      </div>

      <CodeBox code={mode === 'string' ? MOVE_STRING_CODE : MOVE_COPY_CODE} active={step === 0 ? 0 : Math.min(step + 1, 4)} errorLine={mode === 'string' && step >= 3 ? 4 : 0} />

      {mode === 'string' ? (
        <div className="grid gap-2 md:grid-cols-[1fr_auto_1fr] md:items-center">
          <MemZone label="پشته (Stack)" icon={Cpu}>
            <div className="relative">
              <StackRow
                name="s1" fields={step >= 1 ? ['ptr', 'len: 8', 'cap: 8'] : ['—']}
                tone={s1Attempt ? 'err' : s1Owner ? 'ok' : 'moved'}
                note={s1Moved ? 'جابه‌جا شد — moved from' : s1Attempt ? 'استفاده پس از انتقال' : undefined}
              />
              {/* حلقهٔ نشانگر: با انتقال مالکیت، از ردیف s1 به ردیف s2 می‌لغزد */}
              {s1Owner && <motion.span layoutId="ptr-glow" transition={{ layout: { duration: dur(0.5).duration } }} className="absolute inset-0 rounded-lg ring-2 ring-emerald-400/70" />}
            </div>
            {s2Live && (
              <div className="relative">
                <StackRow name="s2" fields={['ptr', 'len: 8', 'cap: 8']} tone="ok" note={step >= 3 ? 'مالک فعلی — معتبر' : 'معتبر'} />
                <motion.span layoutId="ptr-glow" transition={{ layout: { duration: dur(0.5).duration } }} className="absolute inset-0 rounded-lg ring-2 ring-emerald-400/70" />
              </div>
            )}
          </MemZone>

          <ArrowStrip label={s2Live ? 's2.ptr → heap' : 's1.ptr → heap'} tone={s1Attempt ? 'err' : step >= 1 ? 'ok' : 'moved'} />

          <MemZone label="حافظهٔ پویا (Heap)" icon={HardDrive}>
            {step >= 1 ? (
              <HeapBox text='"سلام"' bytes={8} caption={s2Live ? 'مالک فعلی: s2 — s1 دیگر به این بافر دسترسی ندارد' : 'مالک: s1'} tone={s1Attempt ? 'err' : 'ok'} />
            ) : (
              <p className="rounded-lg border border-dashed border-zinc-700/60 p-3 text-center text-[10.5px] text-zinc-500">بافر heap پس از ساخته‌شدن s1 ظاهر می‌شود</p>
            )}
          </MemZone>
        </div>
      ) : (
        <div className="grid gap-2 md:grid-cols-2">
          <MemZone label="پشته (Stack)" icon={Cpu}>
            <StackRow name="x" fields={copyX ? ['5'] : ['—']} tone={copyX ? 'ok' : 'moved'} />
            {copyY && <StackRow name="y" fields={['5']} tone="copy" note="کپی مستقل روی پشته" />}
          </MemZone>
          <MemZone label="حافظهٔ پویا (Heap)" icon={HardDrive}>
            <p className="rounded-lg border border-dashed border-purple-500/30 p-3 text-[10.5px] leading-5 text-purple-200/80">
              هیچ بافری در heap نیست — `i32` از نوع `Copy` است و مقدارش مستقیم روی پشته کپی می‌شود.
            </p>
          </MemZone>
        </div>
      )}

      <StepNote text={notes[mode][Math.min(step, notes[mode].length - 1)]} />

      <AnimatePresence>
        {mode === 'string' && step >= 4 && (
          <ErrCard
            key="move-err" title="کامپایلر این کد را نمی‌پذیرد — گزارش واقعی rustc (گزیده)" excerpt={MOVE_ERR_EXCERPT}
            why="در Rust انتقال، مالکیت را منتقل می‌کند؛ `s1` دیگر معتبر نیست. کامپایلر در زمان ساخت (نه اجرا) جلوی استفاده از مقدار جابه‌جاشده را می‌گیرد — و حتی پیشنهاد `clone()` می‌دهد."
          />
        )}
        {mode === 'copy' && step >= 4 && <OkCard key="copy-ok" text="چاپ شد: `5 5` — هر دو متغیر معتبرند چون `i32` ویژگی `Copy` دارد؛ کپی ارزان روی پشته، بدون heap." />}
      </AnimatePresence>
    </>
  )
}

/* ================================================================
   درس ۲ — قرض گرفتن (Borrow): &s بی‌نهایت، &mut فقط یکی
   ================================================================ */

interface RefChip {
  id: number
  name: string
  kind: 'shared' | 'mut'
}

type BorrowErr = 'E0502-mut' | 'E0502-imm' | 'E0499' | null

/** نقل قول‌های واقعی rustc برای هر نقض قاعدهٔ قرض */
const BORROW_ERRORS: Record<Exclude<BorrowErr, null>, { title: string; excerpt: string; why: string }> = {
  'E0502-mut': {
    title: 'قرض یکتا ممکن نیست — گزارش واقعی rustc (گزیده)',
    excerpt: `error[E0502]: cannot borrow \`s\` as mutable because it is also borrowed as immutable
 --> src/main.rs:4:14
  |
3 |     let r1 = &s;
  |             -- immutable borrow occurs here
4 |     let m1 = &mut s;
  |              ^^^^^^ mutable borrow occurs here`,
    why: 'تا وقتی یک قرض مشترک (`&s`) زنده است، هیچ `&mut s`‌ای مجاز نیست — خواننده‌ای که به داده اعتماد کرده نباید زیر پای‌اش عوض شود.',
  },
  'E0502-imm': {
    title: 'قرض مشترک روی دادهٔ قرض‌گرفتهٔ یکتا — گزارش واقعی rustc (گزیده)',
    excerpt: `error[E0502]: cannot borrow \`s\` as immutable because it is also borrowed as mutable
 --> src/main.rs:4:14
  |
3 |     let m1 = &mut s;
  |             ------- mutable borrow occurs here
4 |     let r1 = &s;
  |              ^^ immutable borrow occurs here`,
    why: 'مالکِ `&mut` انتظار دارد تنها بیننده باشد؛ تا `&mut` زنده است، قرض مشترک جدید ممنوع است.',
  },
  E0499: {
    title: 'قرض یکتای دوم — گزارش واقعی rustc (گزیده)',
    excerpt: `error[E0499]: cannot borrow \`s\` as mutable more than once at a time
 --> src/main.rs:4:14
  |
3 |     let m1 = &mut s;
  |             ------- first mutable borrow occurs here
4 |     let m2 = &mut s;
  |              ^^^^^^ second mutable borrow occurs here`,
    why: 'در هر لحظه فقط یک `&mut` مجاز است — دو نویسندهٔ هم‌زمان یعنی مسابقهٔ داده (data race) که Rust آن را در کامپایل رد می‌کند.',
  },
}

const BORROW_SCRIPT: string[] = [
  'مالک `s` آماده است — با دکمه‌ها قرض بساز یا سناریوی هدایت‌شده را اجرا کن.',
  '`r1 = &s` ساخته شد: قرض مشترک، فقط خواندن — هر تعداد که بخواهی مجاز است.',
  'تلاش برای `&mut s` در حالی که `r1` زنده است… کامپایلر مخالفت می‌کند.',
  '`r1` با `drop` تمام شد — قرض‌ها پاک شدند و راه برای `&mut` باز شد.',
  '`m1 = &mut s` با موفقیت ساخته شد — حالا s یک نویسندهٔ یکتا دارد.',
]

function BorrowLesson() {
  const dur = useDur()
  const total = 4
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [refs, setRefs] = useState<RefChip[]>([])
  const [seq, setSeq] = useState(0)
  const [err, setErr] = useState<BorrowErr>(null)
  const [note, setNote] = useState<string | null>(null)
  const [shakeKey, setShakeKey] = useState(0)

  /** اعمال وضعیت سناریوی هدایت‌شده برای گام n — هم از پخش خودکار، هم از کنترل‌ها */
  const applyScript = useCallback((n: number) => {
    if (n <= 0) {
      setRefs([]); setSeq(0); setErr(null); setNote(null)
    } else if (n === 1) {
      setRefs([{ id: 1, name: 'r1', kind: 'shared' }]); setSeq(1); setErr(null); setNote(null)
    } else if (n === 2) {
      setErr((e) => e ?? 'E0502-mut'); setNote(null)
    } else if (n === 3) {
      setRefs((rs) => rs.filter((r) => r.kind !== 'shared')); setNote('mut-ok')
    } else {
      setRefs((rs) => (rs.some((r) => r.kind === 'mut') ? rs : [...rs, { id: 2, name: 'm1', kind: 'mut' as const }])); setErr(null); setNote(null); setSeq(2)
    }
  }, [])

  useEffect(() => {
    if (!playing) return
    if (step >= total) {
      const stop = window.setTimeout(() => setPlaying(false), 350)
      return () => window.clearTimeout(stop)
    }
    // هر گام، هم شمارنده را جلو می‌برد هم وضعیت سناریو را اعمال می‌کند
    const id = window.setTimeout(() => {
      const ns = Math.min(step + 1, total)
      setStep(ns)
      applyScript(ns)
    }, 1700)
    return () => window.clearTimeout(id)
  }, [playing, step, total, applyScript])

  const toggle = useCallback(() => {
    setPlaying((p) => !p)
    if (step >= total) {
      applyScript(0)
      setStep(0)
    }
  }, [step, total, applyScript])

  const reset = useCallback(() => {
    setPlaying(false); applyScript(0); setStep(0)
  }, [applyScript])

  /** نقض قاعده: لرزش + کارت خطا */
  const fail = useCallback((code: Exclude<BorrowErr, null>) => {
    setErr(code); setNote(null); setShakeKey((k) => k + 1); setPlaying(false); setStep(2)
  }, [])

  const addShared = useCallback(() => {
    setPlaying(false)
    if (refs.some((r) => r.kind === 'mut')) return fail('E0502-imm')
    const n = seq + 1
    setRefs((rs) => [...rs, { id: n, name: `r${n}`, kind: 'shared' }])
    setSeq(n); setErr(null); setNote(null); setStep((s) => Math.max(s, 1))
  }, [refs, seq, fail])

  const addMut = useCallback(() => {
    setPlaying(false)
    if (refs.some((r) => r.kind === 'shared')) return fail('E0502-mut')
    if (refs.some((r) => r.kind === 'mut')) return fail('E0499')
    const n = seq + 1
    setRefs((rs) => [...rs, { id: n, name: `m${n}`, kind: 'mut' }])
    setSeq(n); setErr(null); setNote(null); setStep(4)
  }, [refs, seq, fail])

  /** کلیک روی چیپ = drop کردن مرجع */
  const dropRef = useCallback(
    (id: number) => {
      setPlaying(false)
      const rest = refs.filter((r) => r.id !== id)
      setRefs(rest)
      if (rest.length === 0 && err) setNote('mut-ok')
      setStep((s) => (err ? 3 : s))
    },
    [refs, err],
  )

  const codeLines = ['fn main() {', '    let mut s = String::from("داده");']
    .concat(refs.map((r) => (r.kind === 'shared' ? `    let ${r.name} = &s;      // قرض مشترک` : `    let ${r.name} = &mut s;  // قرض یکتا`)))
    .concat('}')

  const errInfo = err ? BORROW_ERRORS[err] : null
  const sharedCount = refs.filter((r) => r.kind === 'shared').length
  const mutCount = refs.filter((r) => r.kind === 'mut').length

  return (
    <DiagramFrame id="mem-borrow" title="قرض گرفتن (Borrowing)" goal="هر تعداد `&s` یا فقط یک `&mut s` — قاعدهٔ قرض را با دست‌های خودت آزمایش کن." icon={Link2}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm" variant="outline" onClick={addShared} aria-label="ساختن مرجع مشترک &s"
            className="h-8 gap-1.5 border-emerald-500/40 bg-emerald-500/10 px-2.5 font-mono text-[11px] text-emerald-300 hover:bg-emerald-500/20"
          >
            <Eye className="h-3.5 w-3.5" aria-hidden /> &s بساز
          </Button>
          <Button
            size="sm" variant="outline" onClick={addMut} aria-label="ساختن مرجع یکتای &mut s"
            className="h-8 gap-1.5 border-amber-500/40 bg-amber-500/10 px-2.5 font-mono text-[11px] text-amber-300 hover:bg-amber-500/20"
          >
            <PenLine className="h-3.5 w-3.5" aria-hidden /> &mut s بساز
          </Button>
        </div>
        <StepControls step={step} total={total} playing={playing} onToggle={toggle} onReset={reset} />
      </div>

      <CodeBox code={codeLines.join('\n')} active={refs.length > 0 ? 2 + refs.length : 0} />

      <p className="flex items-center gap-1.5 text-[10.5px] leading-5 text-zinc-400">
        <HelpCircle className="h-3.5 w-3.5 shrink-0 text-zinc-500" aria-hidden />
        روی هر چیپ کلیک کن تا `drop` شود (حذف قرض) — قواعد، همان قواعد واقعی کامپایلرند.
      </p>

      {/* لرزش هنگام نقض قاعده */}
      <motion.div key={shakeKey} animate={shakeKey > 0 ? { x: [0, -8, 8, -5, 5, 0] } : { x: 0 }} transition={dur(0.45)}>
        <div className="grid gap-2 md:grid-cols-[1fr_auto_1fr] md:items-center">
          <MemZone label="مالک و مرجع‌ها" icon={Cpu}>
            <StackRow name="s: String" fields={['مالک']} tone="ok" note="همیشه زنده است" />
            <div className="flex flex-wrap gap-1.5">
              <AnimatePresence>
                {refs.map((chip) => (
                  <motion.button
                    key={chip.id} layout onClick={() => dropRef(chip.id)}
                    initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={dur(0.22)}
                    aria-label={`حذف مرجع ${chip.name}`} title="کلیک = drop کردن مرجع"
                    className={`flex items-center gap-1 rounded-full border px-2 py-1 font-mono text-[10px] font-bold ${
                      chip.kind === 'shared' ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-200' : 'border-amber-500/50 bg-amber-500/10 text-amber-200'
                    }`}
                  >
                    {chip.kind === 'shared' ? `${chip.name}: &s` : `${chip.name}: &mut s`}
                    <span className="font-sans text-[8.5px] font-normal">{chip.kind === 'shared' ? 'فقط خواندن' : 'خواندن + نوشتن'}</span>
                    <X className="h-3 w-3 opacity-70" aria-hidden />
                  </motion.button>
                ))}
              </AnimatePresence>
              {refs.length === 0 && <span className="text-[10px] text-zinc-500">هیچ مرجعی وجود ندارد — آزاد برای `&mut`</span>}
            </div>
          </MemZone>

          <ArrowStrip label={mutCount > 0 ? '&mut → s' : sharedCount > 0 ? '& → s' : '—'} tone={mutCount > 0 ? 'warn' : sharedCount > 0 ? 'ref' : 'moved'} />

          <MemZone label="خط عمر مرجع‌ها (Lifetime)" icon={Timer}>
            <div className="relative h-4 rounded-md bg-emerald-500/25">
              <span dir="ltr" className="absolute left-1.5 top-1/2 -translate-y-1/2 font-mono text-[9px] font-bold text-emerald-200">s</span>
              <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[8.5px] font-bold text-emerald-300/80">مالک — تا پایان scope</span>
            </div>
            {refs.map((chip, i) => (
              <div key={chip.id} className="relative h-3.5">
                <motion.div
                  initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={dur(0.3)}
                  style={{ transformOrigin: 'left', left: `${8 + i * 7}%`, width: `${88 - i * 7}%` }}
                  className={`absolute inset-y-0 rounded-md ${chip.kind === 'shared' ? 'bg-cyan-500/40' : 'bg-amber-500/40'}`}
                >
                  <span dir="ltr" className="absolute left-1 top-1/2 -translate-y-1/2 font-mono text-[8.5px] font-bold text-zinc-100">{chip.name}</span>
                </motion.div>
              </div>
            ))}
            <p dir="rtl" className="pt-1 text-[9.5px] leading-4 text-zinc-500">
              عمر هر مرجع زیر عمر مالک است — اگر `s` تمام شود، مرجع‌ها هم تمام شده‌اند.
            </p>
          </MemZone>
        </div>
      </motion.div>

      <AnimatePresence>
        {note === 'mut-ok' && refs.length === 0 && <OkCard key="borrow-ok" text="حالا می‌توانید `&mut` بگیرید — همهٔ قرض‌ها `drop` شده‌اند و `s` آزاد است." />}
        {mutCount > 0 && !err && <OkCard key="mut-live" text="قرض یکتا فعال است: `&mut s` هم می‌خواند هم می‌نویسد — ولی تا وقتی زنده است هیچ مرجع دیگری مجاز نیست." />}
      </AnimatePresence>

      <StepNote text={BORROW_SCRIPT[Math.min(step, BORROW_SCRIPT.length - 1)]} />

      <AnimatePresence>{errInfo && <ErrCard key={err} title={errInfo.title} excerpt={errInfo.excerpt} why={errInfo.why} />}</AnimatePresence>
    </DiagramFrame>
  )
}

/* ================================================================
   درس ۳ — String در برابر &str در برابر clone()
   ================================================================ */

const CLONE_CODE = `fn main() {
    let s1 = String::from("سلام دنیا");
    let view: &str = &s1;      // همان بافر — بدون کپی
    let s2 = s1.clone();       // بافر جدید — کپی واقعی
    println!("{s1} | {view} | {s2}");
}`

function CloneLesson() {
  const dur = useDur()
  const [pulse, setPulse] = useState(0) // تکرار انیمیشن بایت‌ها با هر کلیک
  const { step, playing, setStep, setPlaying, toggle, reset } = useStepper(3)

  const showRef = step >= 1
  const showClone = step >= 2
  const showCompare = step >= 3

  const makeRef = useCallback(() => {
    setPlaying(false); setStep((s) => Math.max(s, 1)); setPulse((p) => p + 1)
  }, [setPlaying, setStep])

  const makeClone = useCallback(() => {
    setPlaying(false); setStep((s) => Math.max(s, 2)); setPulse((p) => p + 1)
  }, [setPlaying, setStep])

  return (
    <DiagramFrame id="mem-clone" title="String، &str و clone()" goal="اشاره‌گر چاق فقط نگاه است (O(1))؛ `clone()` بافر جدید می‌سازد (O(n))." icon={Copy}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm" variant="outline" onClick={makeRef} aria-label="ساختن اشاره‌گر &str به همان بافر"
            className="h-8 gap-1.5 border-cyan-500/40 bg-cyan-500/10 px-2.5 font-mono text-[11px] text-cyan-300 hover:bg-cyan-500/20"
          >
            <Link2 className="h-3.5 w-3.5" aria-hidden /> اشاره با &str
          </Button>
          <Button
            size="sm" variant="outline" onClick={makeClone} aria-label="اجرای clone روی s1"
            className="h-8 gap-1.5 border-purple-500/40 bg-purple-500/10 px-2.5 font-mono text-[11px] text-purple-300 hover:bg-purple-500/20"
          >
            <Copy className="h-3.5 w-3.5" aria-hidden /> clone()
          </Button>
        </div>
        <StepControls step={step} total={3} playing={playing} onToggle={toggle} onReset={reset} />
      </div>

      <CodeBox code={CLONE_CODE} active={[0, 3, 4, 5][Math.min(step, 3)]} />

      <div className="grid gap-2 md:grid-cols-[1fr_auto_1fr] md:items-center">
        <MemZone label="پشته (Stack) — اشاره‌گرهای چاق" icon={Cpu}>
          <StackRow name="s1" fields={['ptr', 'len: 17', 'cap: 17']} tone="ok" note="مالک بافر ۱" />
          {showRef && <StackRow name="view" fields={['ptr', 'len: 17']} tone="ref" note="&str — بدون cap، مالک جدید نیست" />}
          {showClone && <StackRow name="s2" fields={['ptr', 'len: 17', 'cap: 17']} tone="copy" note="مالک بافر ۲" />}
        </MemZone>

        <ArrowStrip label={showClone ? 's2.ptr → بافر ۲' : showRef ? 'view.ptr → بافر ۱' : 's1.ptr → بافر ۱'} tone={showClone ? 'copy' : showRef ? 'ref' : 'ok'} />

        <MemZone label="حافظهٔ پویا (Heap)" icon={HardDrive}>
          <div className={showRef && !showClone ? 'rounded-lg ring-2 ring-cyan-400/50' : ''}>
            <HeapBox text='"سلام دنیا"' bytes={17} caption="بافر ۱ — ۱۷ بایت UTF-8" tone={showRef && !showClone ? 'ref' : 'ok'} />
          </div>
          {showClone && (
            <>
              {/* انیمیشن کپی بایت‌ها از بافر ۱ به بافر ۲ */}
              <div key={pulse} className="relative flex h-7 items-center justify-center overflow-hidden" aria-hidden>
                {Array.from({ length: 7 }, (_, i) => (
                  <motion.span
                    key={i} className="absolute h-1.5 w-1.5 rounded-[2px] bg-purple-300" style={{ left: `${18 + i * 9}%` }}
                    initial={{ x: -30, opacity: 0 }} animate={{ x: 30, opacity: [0, 1, 1, 0] }}
                    transition={{ duration: dur(0.9).duration, delay: i * 0.09 }}
                  />
                ))}
                <ArrowDown className="h-3.5 w-3.5 text-purple-300/70" />
              </div>
              <HeapBox text='"سلام دنیا"' bytes={17} caption="بافر ۲ — کپی واقعی در heap؛ پرهزینه ولی امن" tone="copy" />
            </>
          )}
        </MemZone>
      </div>

      {/* سنجهٔ هزینه: مقایسه O(1) و O(n) */}
      <div dir="rtl" className="space-y-2 rounded-xl border border-white/10 bg-black/25 p-3">
        <p className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-200">
          <Scale className="h-3.5 w-3.5 text-[#f7931e]" aria-hidden /> سنجهٔ هزینه
        </p>
        {[
          { label: 'اشاره‌گر &str — فقط کپیِ ptr و len روی پشته', gate: 1, bar: 'bg-cyan-400/70', cost: 'O(1)' },
          { label: 's.clone() — کپی کامل ۱۷ بایت در heap', gate: 2, bar: 'bg-purple-400/70', cost: 'O(n)' },
        ].map((m) => (
          <div key={m.cost} className="flex items-center gap-2">
            <span className="w-full min-w-0 flex-1 truncate text-[10px] text-zinc-400 sm:w-56">{m.label}</span>
            <div className="h-2 w-24 shrink-0 overflow-hidden rounded-full bg-zinc-800 sm:w-40">
              <motion.div
                initial={{ scaleX: 0 }} animate={{ scaleX: step >= m.gate ? 1 : 0 }} transition={dur(0.5)}
                style={{ transformOrigin: 'right' }} className={`h-full w-full rounded-full ${m.bar}`}
              />
            </div>
            <span dir="ltr" className="w-9 shrink-0 text-right font-mono text-[9.5px] font-bold text-zinc-300">{m.cost}</span>
          </div>
        ))}
      </div>

      <StepNote
        text={
          [
            '`s1` مالک بافر «سلام دنیا» است — سه عدد ptr/len/cap روی پشته به آن اشاره می‌کنند.',
            '`view: &str` فقط یک اشاره‌گر به همان بافر است — «مالک جدید نیست» و هیچ داده‌ای کپی نشد.',
            '`s1.clone()` بافر دومی در heap ساخت و بایت‌ها را واقعاً کپی کرد — «کپی واقعی در heap، پرهزینه ولی امن»؛ حالا دو مالک مستقل داریم.',
            'مقایسه با عدد کوچک: `let a = 7; let b = a;` فقط چند بایت روی پشته کپی می‌کند — ارزان و بدون heap؛ به همین دلیل `i32` از نوع `Copy` است.',
          ][Math.min(step, 3)]
        }
      />

      <AnimatePresence>
        {showCompare && (
          <motion.div key="int-compare" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={dur(0.25)} className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-3">
            <p dir="ltr" className="font-mono text-[11px] leading-6 text-purple-200">
              let a = 7;
              <br />
              let b = a; <span className="text-purple-300/60">{'// هر دو معتبر — کپی روی پشته'}</span>
            </p>
            <p className="mt-1.5 text-[11px] leading-6 text-purple-100/85">
              برای `i32`، «اشاره» و «کلون» بی‌معنا هستند: مقدار کوچک است و خودش کپی می‌شود — `a` و `b` هر دو معتبر می‌مانند.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </DiagramFrame>
  )
}

/* ================================================================
   درس ۴ — پایان scope و drop
   ================================================================ */

const SCOPE_CODE = `fn main() {
    let s = String::from("بیرون");
    {
        let t = String::from("درون");
        println!("{t}");
    } // t این‌جا drop می‌شود
    println!("{s}");
}`

const DROP_CODE = `fn main() {
    let s = String::from("زودهنگام");
    drop(s);
    println!("{s}");
}`

const DROP_ERR_EXCERPT = `error[E0382]: borrow of moved value: \`s\`
 --> src/main.rs:4:15
  |
2 |     let s = String::from("زودهنگام");
  |         -- move occurs because \`s\` has type \`String\`,
  |            which does not implement the \`Copy\` trait
3 |     drop(s);
  |          -- value moved here
4 |     println!("{s}");
  |               ^ value borrowed here after move
  |
  = note: this error originates in the macro \`println\``

function ScopeLesson() {
  const [mode, setMode] = useState<'scope' | 'drop'>('scope')
  return (
    <DiagramFrame id="mem-scope" title="پایان scope و فراخوانی drop()" goal="حافظه دقیقاً در پایان مالکیت آزاد می‌شود — خودکار با پایان scope یا زودهنگام با `drop`." icon={Layers}>
      {/* key={mode} باعث اجرای تازهٔ سناریو با هر تغییر حالت می‌شود */}
      <ScopeScenario key={mode} mode={mode} onModeChange={setMode} />
    </DiagramFrame>
  )
}

function ScopeScenario({ mode, onModeChange }: { mode: 'scope' | 'drop'; onModeChange: (m: 'scope' | 'drop') => void }) {
  const dur = useDur()
  const isScope = mode === 'scope'
  const total = isScope ? 4 : 3
  const { step, playing, toggle, reset } = useStepper(total)

  const tLive = isScope && step >= 2 && step < 4
  const framePopped = isScope && step >= 4
  const sDropped = !isScope && step >= 2
  const sLive = step >= 1 && !sDropped
  const useAfterDrop = !isScope && step >= 3

  const note = isScope
    ? [
        'کد دو scope تو در تو دارد — «اجرای گام‌به‌گام» را بزن تا تولد و مرگ هر متغیر را ببینی.',
        '`s` در scope بیرونی ساخته شد و بافر «بیرون» را در heap مالک است.',
        'scope داخلی باز شد و `t` بافر «درون» را مالک شد — هر فریم، دنیای خودش را دارد.',
        '`println!("{t}")` داخل scope داخلی کار می‌کند — `t` همین‌جا زنده است.',
        'پایان scope داخلی: فریم جمع شد و `drop(t)` خودکار اجرا شد — حافظهٔ بافر آزاد شد؛ `s` بیرون هنوز زنده است.',
      ][Math.min(step, 4)]
    : [
        'گاهی می‌خواهی حافظه زودتر آزاد شود — Rust تابع `drop(s)` را برای همین دارد.',
        '`s` ساخته شد — مالک بافر «زودهنگام».',
        '`drop(s)` فراخوانی شد: بافر همان لحظه آزاد شد و `s` بی‌صاحب — مثل Move، مالکیت به خودِ drop رفت.',
        'تلاش برای چاپ `s` بعد از drop… کامپایلر اجازه نمی‌دهد — استفاده پس از آزادسازی از نظر نوع ممنوع است.',
      ][Math.min(step, 3)]

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SegToggle
          ariaLabel="انتخاب سناریوی پایان مالکیت" value={mode} onChange={onModeChange}
          options={[{ v: 'scope', label: 'پایان scope' }, { v: 'drop', label: 'drop زودهنگام' }]}
        />
        <StepControls step={step} total={total} playing={playing} onToggle={toggle} onReset={reset} />
      </div>

      <CodeBox code={isScope ? SCOPE_CODE : DROP_CODE} active={[0, 2, isScope ? 4 : 3, isScope ? 5 : 4, 6][Math.min(step, total)]} errorLine={useAfterDrop ? 4 : 0} />

      <div className="grid gap-2 md:grid-cols-[1fr_auto_1fr] md:items-center">
        <MemZone label="فریم‌های scope" icon={Layers}>
          {/* فریم بیرونی */}
          <div className={`rounded-xl border-2 border-dashed p-2.5 ${sLive ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-zinc-600/50 bg-zinc-900/40'}`}>
            <p dir="ltr" className="mb-1.5 font-mono text-[9.5px] font-bold text-zinc-400">fn main — scope بیرونی</p>
            <StackRow name="s" fields={sLive ? ['"بیرون"'] : ['—']} tone={sLive ? 'ok' : 'moved'} note={sDropped ? 'moved — drop(s)' : sLive ? 'مالک بافر A' : undefined} />
            {/* فریم داخلی — با پایان scope پایین می‌لغزد و محو می‌شود */}
            <AnimatePresence>
              {isScope && step >= 2 && !framePopped && (
                <motion.div
                  key="inner" transition={dur(0.35)}
                  initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 18 }}
                  className="mt-2 rounded-xl border-2 border-dashed border-cyan-500/40 bg-cyan-500/5 p-2.5"
                >
                  <p dir="ltr" className="mb-1.5 font-mono text-[9.5px] font-bold text-cyan-300/80">{'{ … } — scope داخلی'}</p>
                  <StackRow name="t" fields={['"درون"']} tone="ref" note="مالک بافر B" />
                </motion.div>
              )}
            </AnimatePresence>
            {framePopped && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={dur(0.3)} dir="rtl" className="mt-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-1.5 text-[10px] font-bold leading-5 text-rose-200">
                فریم داخلی برداشته شد — `drop(t)` خودکار اجرا شد
              </motion.p>
            )}
          </div>
        </MemZone>

        <ArrowStrip label={tLive ? 't.ptr → بافر B' : sLive ? 's.ptr → بافر A' : '—'} tone={tLive ? 'ref' : sLive ? 'ok' : 'moved'} />

        <MemZone label="حافظهٔ پویا (Heap)" icon={HardDrive}>
          <HeapBox text='"بیرون"' bytes={10} caption={sLive ? 'بافر A — مالک: s' : 'بافر A — drop(s) زودهنگام'} tone={sLive ? 'ok' : 'moved'} dropped={sDropped} />
          {isScope ? (
            step >= 2 ? (
              <HeapBox text='"درون"' bytes={8} caption={framePopped ? 'drop() فراخوانی شد — حافظه آزاد شد' : 'بافر B — مالک: t'} tone={framePopped ? 'err' : 'ref'} dropped={framePopped} />
            ) : (
              <p className="rounded-lg border border-dashed border-zinc-700/60 p-3 text-center text-[10.5px] text-zinc-500">بافر B با ساخته‌شدن t ظاهر می‌شود</p>
            )
          ) : null}
        </MemZone>
      </div>

      <StepNote text={note} />

      <AnimatePresence>
        {useAfterDrop && <ErrCard key="drop-err" title="استفاده پس از drop ممنوع است — گزارش واقعی rustc (گزیده)" excerpt={DROP_ERR_EXCERPT} why="`drop` مثل انتقال مالکیت عمل می‌کند — بعد از آن `s` نامعتبر است. کامپایلر حتی یک بار استفادهٔ تصادفی پس از آزادسازی را نمی‌پذیرد." />}
      </AnimatePresence>

      {/* کارت مقایسه با سایر زبان‌ها */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={dur(0.25)} className="rounded-xl border border-white/10 bg-black/25 p-3">
        <p className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-200">
          <Scale className="h-3.5 w-3.5 text-[#f7931e]" aria-hidden /> مقایسه با سایر زبان‌ها
        </p>
        <p className="mt-1.5 text-[11px] leading-6 text-zinc-300">
          در ++C همین الگو `RAII` است: تخریب‌گر در پایان `scope` اجرا می‌شود. در زبان‌های `GC`‌دار، `garbage collector` بعداً و در زمانی نامعلوم پاک می‌کند. در Rust دقیقاً در پایان مالکیت — نه دیرتر، نه زودتر.
        </p>
      </motion.div>
    </>
  )
}

/* ================================================================
   آزمون خودسنجی — سه پرسش با بازخورد فوری
   ================================================================ */

interface Mcq {
  q: string
  opts: string[]
  a: number
  why: string
}

const QUIZ: Mcq[] = [
  {
    q: 'بعد از اجرای `let s1 = String::from("سلام");` و `let s2 = s1;` وضعیت `s1` چیست؟',
    opts: ['کپی شد و همچنان معتبر است', 'به دادهٔ s2 اشاره می‌کند', 'جابه‌جا شده (moved) و دیگر معتبر نیست', 'تبدیل به &str شده است'],
    a: 2,
    why: 'String از نوع Copy نیست؛ `let s2 = s1` مالکیت را منتقل می‌کند و `s1` از آن پس نامعتبر است — استفادهٔ دوباره خطای E0382 می‌دهد.',
  },
  {
    q: 'در یک لحظه، چند مرجع `&mut s` می‌توان هم‌زمان داشت؟',
    opts: ['هر تعداد که بخواهی', 'فقط یکی — و در آن لحظه هیچ مرجع دیگری هم نباشد', 'دو تا، به شرطی که یکی فقط بخواند', 'فقط داخل توابع جداگانه'],
    a: 1,
    why: 'قاعدهٔ قرض یکتا: حداکثر یک `&mut` در هر لحظه و آن هم فقط وقتی هیچ قرض مشترک زنده‌ای وجود ندارد — این همان چیزی است که data race را در کامپایل رد می‌کند.',
  },
  {
    q: 'فراخوانی `s.clone()` روی یک String چه می‌کند؟',
    opts: ['کپی واقعی داده در heap — با هزینه O(n)', 'فقط نشانگر را کپی می‌کند', 'مالکیت را منتقل می‌کند و s نامعتبر می‌شود', 'یک مرجع &str برمی‌گرداند'],
    a: 0,
    why: '`clone` بافر تازه‌ای در heap می‌سازد و بایت‌ها را واقعاً کپی می‌کند — پرهزینه ولی امن؛ هر دو متغیر مالک مستقل خود می‌شوند.',
  },
]

function QuizSection() {
  const dur = useDur()
  const [picked, setPicked] = useState<(number | null)[]>(() => QUIZ.map(() => null))
  const answered = picked.filter((p) => p !== null).length
  const score = QUIZ.reduce((acc, q, i) => acc + (picked[i] === q.a ? 1 : 0), 0)

  return (
    <section aria-label="آزمون خودسنجی حافظه" className="space-y-3 rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[13px] font-black text-zinc-100">خودسنجی — سه پرسش سریع</h3>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[10.5px] font-bold text-zinc-300">
            {fa(answered)} از {fa(QUIZ.length)} پاسخ داده شد
          </span>
          {answered > 0 && (
            <Button size="sm" variant="ghost" onClick={() => setPicked(QUIZ.map(() => null))} className="h-7 gap-1 px-2 text-[10.5px] text-zinc-400 hover:text-zinc-100">
              <RotateCcw className="h-3 w-3" aria-hidden /> دوباره
            </Button>
          )}
        </div>
      </header>

      <div className="space-y-3">
        {QUIZ.map((q, qi) => {
          const p = picked[qi]
          const done = p !== null
          const correct = p === q.a
          return (
            <div key={qi} className="rounded-xl border border-white/10 bg-black/25 p-3">
              <p className="text-[12px] font-bold leading-6 text-zinc-200">
                {fa(qi + 1)}. {mono(q.q)}
              </p>
              <div className="mt-2 flex flex-col gap-1.5">
                {q.opts.map((opt, oi) => {
                  const showRight = done && oi === q.a
                  const showWrong = done && p === oi && !correct
                  const cls = showRight
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-200'
                    : showWrong
                      ? 'border-rose-500/50 bg-rose-500/10 text-rose-200'
                      : done
                        ? 'border-white/5 bg-zinc-900/40 text-zinc-500'
                        : 'border-white/10 bg-zinc-900/60 text-zinc-300 hover:border-[#f7931e]/40 hover:text-zinc-100'
                  return (
                    <button
                      key={oi} disabled={done} aria-pressed={p === oi}
                      onClick={() => !done && setPicked((prev) => prev.map((x, i) => (i === qi ? oi : x)))}
                      className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-right text-[11px] leading-5 transition-colors ${cls}`}
                    >
                      {showRight ? (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden />
                      ) : showWrong ? (
                        <XCircle className="h-3.5 w-3.5 shrink-0 text-rose-400" aria-hidden />
                      ) : (
                        <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-current opacity-40" aria-hidden />
                      )}
                      <span className="min-w-0 flex-1">{mono(opt)}</span>
                    </button>
                  )
                })}
              </div>
              <AnimatePresence>
                {done && (
                  <motion.p
                    key={`${qi}-${p}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={dur(0.2)}
                    className={`mt-2 rounded-lg border p-2.5 text-[11px] leading-6 ${
                      correct ? 'border-emerald-500/25 bg-emerald-500/5 text-emerald-100/85' : 'border-amber-500/25 bg-amber-500/5 text-amber-100/85'
                    }`}
                  >
                    {correct ? 'درست است — ' : 'نه، دقت کن — '}
                    {mono(q.why)}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>

      {answered === QUIZ.length && <OkCard text={`نمرهٔ تو: ${fa(score)} از ${fa(QUIZ.length)} — ${score === QUIZ.length ? 'قواعد مالکیت و قرض را خوب فهمیده‌ای.' : 'نمودارها را دوباره گام‌به‌گام اجرا کن؛ خطاهای rustc بهترین معلم‌اند.'}`} />}
    </section>
  )
}

/* ================================================================
   جدول جمع‌بندی — چهار راه انتقال/دسترسی به داده
   ================================================================ */

const SUMMARY: { op: string; moved: string; copied: string; prevValid: string; tones: [Tone, Tone, Tone] }[] = [
  { op: 'Move (`let s2 = s1`)', moved: 'بله', copied: 'خیر — فقط نشانگر جابه‌جا شد', prevValid: 'خیر — نامعتبر', tones: ['warn', 'moved', 'err'] },
  { op: 'Copy (`i32` و…)', moved: 'خیر', copied: 'بله — روی پشته، O(1)', prevValid: 'بله', tones: ['moved', 'ok', 'ok'] },
  { op: 'Clone (`s.clone()`)', moved: 'خیر', copied: 'بله — کپی کامل heap، O(n)', prevValid: 'بله', tones: ['moved', 'copy', 'ok'] },
  { op: 'Borrow (`&s` / `&mut s`)', moved: 'خیر', copied: 'خیر — فقط دسترسی قرضی', prevValid: 'بله — با قواعد قرض', tones: ['moved', 'moved', 'ok'] },
]

function SummaryTable() {
  return (
    <section aria-label="جدول جمع‌بندی مالکیت و قرض" className="space-y-2 rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
      <h3 className="text-[13px] font-black text-zinc-100">جمع‌بندی — Move، Copy، Clone و Borrow در یک نگاه</h3>
      <div className="os-scroll overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-right text-[10.5px] text-zinc-400">عملیات</TableHead>
              <TableHead className="text-right text-[10.5px] text-zinc-400">مالکیت منتقل می‌شود؟</TableHead>
              <TableHead className="text-right text-[10.5px] text-zinc-400">داده کپی می‌شود؟</TableHead>
              <TableHead className="text-right text-[10.5px] text-zinc-400">متغیر قبلی معتبر است؟</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {SUMMARY.map((r) => (
              <TableRow key={r.op} className="border-white/10">
                <TableCell dir="ltr" className="text-left font-mono text-[10.5px] font-bold text-zinc-200">{r.op}</TableCell>
                {[r.moved, r.copied, r.prevValid].map((cell, ci) => (
                  <TableCell key={ci} className="text-[10.5px]">
                    <span className={`rounded-md border px-1.5 py-0.5 font-bold ${TONE[r.tones[ci]]}`}>{cell}</span>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  )
}

/* ================================================================
   آزمایشگاه کامل — چهار درس با تب، آزمون و جدول
   ================================================================ */

const LESSON_LABELS: Record<RustMemoryLessonId, string> = {
  'mem-move': 'جابه‌جایی (Move)',
  'mem-borrow': 'قرض (Borrow)',
  'mem-clone': 'clone و &str',
  'mem-scope': 'scope و drop',
}

export function RustMemoryLab() {
  const [active, setActive] = useState<RustMemoryLessonId>('mem-move')
  const dur = useDur()

  return (
    <div dir="rtl" className="space-y-4 rounded-2xl border border-[#f7931e]/20 bg-zinc-950/70 p-4">
      {/* سربرگ آزمایشگاه */}
      <header className="flex items-start gap-2">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[#f7931e]/30 bg-gradient-to-br from-[#b7410e]/40 to-[#f7931e]/20 text-[#f7931e]">
          <HardDrive className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="text-[14px] font-black text-zinc-50">
            آزمایشگاه حافظه <span className="text-[10px] font-bold text-[#f7931e]">— مالکیت، قرض، clone و scope</span>
          </h2>
          <p className="text-[10.5px] leading-5 text-zinc-400">وضعیت واقعی متغیرها و مرجع‌ها را گام‌به‌گام ببین — همان چیزی که کامپایلر Rust ذهنش را درگیر می‌کند.</p>
        </div>
      </header>

      {/* برچسب صادقانه — سبک SIM_HINT آکادمی */}
      <div className="flex gap-2 rounded-xl border border-[#f7931e]/25 bg-[#f7931e]/10 p-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#f7931e]" aria-hidden />
        <p className="text-[11.5px] leading-6 text-amber-100/90">{HONEST_NOTE}</p>
      </div>

      {/* تب درس‌ها */}
      <div role="tablist" aria-label="درس‌های آزمایشگاه حافظه" className="flex flex-wrap gap-1.5">
        {RUST_MEMORY_LESSONS.map((id) => (
          <button
            key={id} role="tab" aria-selected={active === id} aria-controls={`panel-${id}`} onClick={() => setActive(id)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-bold transition-colors ${
              active === id ? 'border-transparent bg-[#f7931e] text-white' : 'border-white/10 bg-zinc-900/80 text-zinc-300 hover:text-zinc-100'
            }`}
          >
            {LESSON_LABELS[id]}
          </button>
        ))}
      </div>

      {/* درس فعال */}
      <div role="tabpanel" id={`panel-${active}`} aria-label={LESSON_LABELS[active]}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={active} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={dur(0.18)}>
            {active === 'mem-move' && <MoveLesson />}
            {active === 'mem-borrow' && <BorrowLesson />}
            {active === 'mem-clone' && <CloneLesson />}
            {active === 'mem-scope' && <ScopeLesson />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* خودسنجی و جدول */}
      <QuizSection />
      <SummaryTable />
    </div>
  )
}
