'use client'

/* ------------------------------------------------------------------ */
/* «مدیریت اجراکننده‌ها»، فهرست صادقانه موتورهای اجرایی سان‌جاب‌اواس    */
/* قاعدهٔ صداقت: هیچ موتور وبی «نیتیو» معرفی نمی‌شود. برچسب‌ها:          */
/* «مرورگر» / «شبیه‌ساز آموزشی» / «دسکتاپ» / «برنامه‌ریزی‌شده»            */
/* ------------------------------------------------------------------ */

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  Binary,
  Brain,
  Check,
  CircleCheck,
  CircleX,
  Cog,
  Cpu,
  ExternalLink,
  Gauge,
  GraduationCap,
  HardDrive,
  Hourglass,
  Info,
  LoaderCircle,
  MemoryStick,
  MonitorSmartphone,
  Server,
  ShieldCheck,
  Terminal,
  TriangleAlert,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { PyodideRunner, type PyOutKind } from '@/lib/os/pyodide'
import { useOS } from '@/lib/os/store'
import { getApp, launch } from '@/lib/os/apps'
import { useGame } from '@/lib/gamification/engine'

/* ------------------------------- انواع ------------------------------- */

/** برچسب نوع موتور، قاعدهٔ صداقت سیستم‌عامل */
type RuntimeKind = 'مرورگر' | 'شبیه‌ساز آموزشی' | 'دسکتاپ' | 'برنامه‌ریزی‌شده'

/** وضعیت زندهٔ هر موتور در همین جلسه */
type RuntimeState =
  | 'بارگیری‌نشده'
  | 'در حال بارگیری'
  | 'آماده'
  | 'آزمایش شد'
  | 'خطا'
  | 'برنامه‌ریزی‌شده'

/** خروجی آزمایش پایتون واقعی */
interface PyLine {
  kind: Extract<PyOutKind, 'stdout' | 'stderr' | 'status' | 'fatal'>
  text: string
}

/** شناسه‌های محیط میزبان که زنده تشخیص داده می‌شوند */
interface EnvInfo {
  webgpu: boolean
  cores: number
  online: boolean
}

/* ------------------------- رنگ برچسب‌ها (بدون آبی) ------------------------- */

const KIND_STYLE: Record<RuntimeKind, string> = {
  'مرورگر': 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300',
  'شبیه‌ساز آموزشی': 'border-purple-400/40 bg-purple-400/10 text-purple-300',
  'دسکتاپ': 'border-rose-400/40 bg-rose-400/10 text-rose-300',
  'برنامه‌ریزی‌شده': 'border-amber-400/40 bg-amber-400/10 text-amber-300',
}

const STATE_STYLE: Record<RuntimeState, string> = {
  'بارگیری‌نشده': 'border-zinc-500/40 bg-zinc-500/10 text-zinc-400',
  'در حال بارگیری': 'border-amber-400/40 bg-amber-400/10 text-amber-300',
  'آماده': 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300',
  'آزمایش شد': 'border-emerald-400/50 bg-emerald-400/15 text-emerald-200',
  'خطا': 'border-rose-400/50 bg-rose-400/15 text-rose-300',
  'برنامه‌ریزی‌شده': 'border-amber-400/40 bg-amber-400/10 text-amber-300',
}

/* ------------------------------ کمکی‌ها ------------------------------ */

const faNum = (n: number): string => n.toLocaleString('fa-IR')

/** اسکلت محو-شدن هنگام ورود به دید، با احترام به reduced-motion */
function FadeIn({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 14 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-32px' }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

function KindPill({ kind }: { kind: RuntimeKind }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-black ${KIND_STYLE[kind]}`}
      title={`نوع موتور: ${kind}`}
    >
      {kind}
    </span>
  )
}

function StatePill({ state }: { state: RuntimeState }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-black ${STATE_STYLE[state]}`}
      role="status"
      aria-live="polite"
    >
      {state === 'در حال بارگیری' && <LoaderCircle size={10} className="animate-spin" aria-hidden />}
      {state === 'آزمایش شد' && <CircleCheck size={10} aria-hidden />}
      {state === 'خطا' && <CircleX size={10} aria-hidden />}
      {state === 'برنامه‌ریزی‌شده' && <Hourglass size={10} aria-hidden />}
      {state}
    </span>
  )
}

/** فهرست توانمندی‌ها و محدودیت‌ها، صادقانه و دوستونه */
function CapList({
  title,
  items,
  tone,
}: {
  title: string
  items: string[]
  tone: 'caps' | 'limits'
}) {
  const ok = tone === 'caps'
  return (
    <div className="min-w-0 flex-1">
      <p
        className={`mb-1 flex items-center gap-1 text-[10px] font-black ${
          ok ? 'text-emerald-300' : 'text-amber-300'
        }`}
      >
        {ok ? <Check size={11} aria-hidden /> : <TriangleAlert size={11} aria-hidden />}
        {title}
      </p>
      <ul className="space-y-0.5">
        {items.map((it) => (
          <li key={it} className="flex items-start gap-1.5 text-[10.5px] leading-4 text-zinc-400">
            <span
              className={`mt-1.5 size-1 shrink-0 rounded-full ${ok ? 'bg-emerald-400/70' : 'bg-amber-400/70'}`}
              aria-hidden
            />
            <span className="min-w-0">{it}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** پوستهٔ مشترک کارت موتور */
function RuntimeCard({
  icon: Icon,
  gradient,
  name,
  version,
  kind,
  state,
  size,
  children,
}: {
  icon: typeof Terminal
  gradient: string
  name: string
  version: string
  kind: RuntimeKind
  state: RuntimeState
  size: string
  children: ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60 shadow-lg shadow-black/20">
      {/* سربرگ کارت */}
      <div className="flex items-start gap-3 border-b border-white/10 bg-zinc-900/80 p-4">
        <span
          className={`grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white shadow-md ${gradient}`}
          aria-hidden
        >
          <Icon size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="text-[13px] font-black text-zinc-100">{name}</h3>
            <KindPill kind={kind} />
            <StatePill state={state} />
          </div>
          <p className="mt-0.5 text-[10.5px] leading-4 text-zinc-500">{version}</p>
        </div>
      </div>

      {/* بدنهٔ کارت */}
      <div className="flex flex-col gap-3 p-4">{children}</div>

      {/* اندازهٔ تقریبی */}
      <div className="flex items-center gap-1.5 border-t border-white/5 bg-zinc-950/40 px-4 py-2 text-[10px] text-zinc-500">
        <HardDrive size={11} className="shrink-0 text-zinc-600" aria-hidden />
        حجم تقریبی: <span className="font-bold text-zinc-400">{size}</span>
      </div>
    </div>
  )
}

/* ---------------------- تشخیص زندهٔ محیط میزبان ---------------------- */

/** خواندن امن شناسه‌های محیط، بدون فرض وجود navigator */
function readEnv(): EnvInfo {
  if (typeof navigator === 'undefined') return { webgpu: false, cores: 0, online: true }
  return {
    webgpu: 'gpu' in navigator,
    cores: navigator.hardwareConcurrency || 0,
    online: navigator.onLine,
  }
}

function useEnvInfo(): EnvInfo {
  /* مقدار اولیه در همان رندر اول خوانده می‌شود؛ افکت فقط مشترک‌شوندهٔ رویدادهاست */
  const [env, setEnv] = useState<EnvInfo>(readEnv)
  useEffect(() => {
    const on = () => setEnv((e) => ({ ...e, online: true }))
    const off = () => setEnv((e) => ({ ...e, online: false }))
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])
  return env
}

function EnvBadge({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Gauge
  label: string
  value: string
  tone: 'ok' | 'off' | 'warn' | 'neutral'
}) {
  const cls =
    tone === 'ok'
      ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300'
      : tone === 'warn'
        ? 'border-amber-400/40 bg-amber-400/10 text-amber-300'
        : tone === 'off'
          ? 'border-rose-400/40 bg-rose-400/10 text-rose-300'
          : 'border-zinc-500/40 bg-zinc-500/10 text-zinc-400'
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${cls}`}>
      <Icon size={12} aria-hidden />
      {label}: {value}
    </span>
  )
}

/* ============================ اپ اصلی ============================ */

export default function RuntimeManagerApp() {
  const env = useEnvInfo()
  const pushToast = useOS((s) => s.pushToast)

  /* آمار صادقانه برای سربرگ: موتورهای واقعاً درون مرورگر */
  const summary = useMemo(() => {
    const inBrowser = 4 // پایتون واقعی، پایتون مینی، لینوکس v86، شبیه‌ساز راست
    const needsNet = 1 // فقط پایتون واقعی (بارگیری نخست از CDN)
    const planned = 3 // rustc نیتیو، هوش مصنوعی محلی، شل میزبان
    return { inBrowser, needsNet, planned }
  }, [])

  return (
    <div className="os-scroll h-full w-full overflow-y-auto bg-zinc-950">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 p-4">
        {/* ---------------------------- قهرمان ---------------------------- */}
        <FadeIn>
          <header className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-l from-amber-400/15 via-purple-400/10 to-emerald-400/10 p-5">
            <div className="flex items-center gap-3">
              <span
                className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/20"
                aria-hidden
              >
                <Gauge size={20} />
              </span>
              <div className="min-w-0">
                <h2 className="text-base font-black text-zinc-100">مدیریت اجراکننده‌ها</h2>
                <p className="mt-0.5 text-[11px] leading-5 text-zinc-400">
                  فهرست صادقانه موتورهای اجرایی سان‌جاب‌اواس
                </p>
              </div>
            </div>

            {/* شناسه‌های زندهٔ محیط */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              <EnvBadge
                icon={Gauge}
                label="WebGPU"
                value={env.webgpu ? 'فعال' : 'موجود نیست'}
                tone={env.webgpu ? 'ok' : 'neutral'}
              />
              <EnvBadge
                icon={MemoryStick}
                label="هسته‌های پردازنده"
                value={env.cores > 0 ? faNum(env.cores) : 'نامشخص'}
                tone="neutral"
              />
              {env.online ? (
                <EnvBadge icon={Wifi} label="شبکه" value="آنلاین" tone="ok" />
              ) : (
                <EnvBadge icon={WifiOff} label="شبکه" value="آفلاین" tone="off" />
              )}
            </div>

            {/* تعهد صداقت */}
            <p className="mt-3 flex items-start gap-1.5 rounded-xl border border-amber-400/25 bg-amber-400/10 p-2.5 text-[10.5px] leading-5 text-amber-200">
              <ShieldCheck size={13} className="mt-0.5 shrink-0" aria-hidden />
              تعهد ما: هیچ موتور مرورگری به‌عنوان «نیتیو» یا «دسکتاپ» جعل نمی‌شود. هر چیزی که در
              مرورگر اجرا شود با برچسب «مرورگر» یا «شبیه‌ساز آموزشی» مشخص است.
            </p>

            {/* خلاصهٔ صادقانه */}
            <p className="mt-2 text-[11px] font-bold leading-5 text-zinc-300">
              {faNum(summary.inBrowser)} موتور در مرورگر آمادهٔ اجراست،{' '}
              {faNum(summary.needsNet)} موتور برای بارگیری نخست اینترنت می‌خواهد و{' '}
              {faNum(summary.planned)} مورد فعلاً برنامه‌ریزی‌شده یا مخصوص دسکتاپ است.
            </p>
          </header>
        </FadeIn>

        {/* ---------------------- ۱) پایتون واقعی؛ Pyodide ---------------------- */}
        <FadeIn>
          <PyodideCard />
        </FadeIn>

        {/* ---------------------- ۲) پایتون مینی (آفلاین) ---------------------- */}
        <FadeIn>
          <MiniPythonCard />
        </FadeIn>

        {/* ---------------------- ۳) لینوکس واقعی، v86 + Alpine ---------------------- */}
        <FadeIn>
          <RealLinuxCard />
        </FadeIn>

        {/* ---------------------- ۴) راست، شبیه‌ساز آموزشی ---------------------- */}
        <FadeIn>
          <RustCard />
        </FadeIn>

        {/* ---------------------- ۵) هوش مصنوعی محلی ---------------------- */}
        <FadeIn>
          <LocalAiCard webgpu={env.webgpu} />
        </FadeIn>

        {/* ---------------------- ۶) پاورشل / شل میزبان ---------------------- */}
        <FadeIn>
          <HostShellCard />
        </FadeIn>

        <p className="pb-2 text-center text-[10px] leading-5 text-zinc-600">
          این فهرست عمداً صادقانه نگه داشته می‌شود، اگر موتوری «شبیه‌ساز» است، همان می‌نویسیم؛
          اگر «نیتیو» نیست، هرگز ادعای نیتیو بودن نمی‌کنیم.
        </p>
      </div>
    </div>
  )
}

/* ------------------ کارت ۱: پایتون واقعی (Pyodide) ------------------ */

function PyodideCard() {
  const runnerRef = useRef<PyodideRunner | null>(null)
  const [state, setState] = useState<RuntimeState>('بارگیری‌نشده')
  const [progress, setProgress] = useState('')
  const [lines, setLines] = useState<PyLine[]>([])
  const [timings, setTimings] = useState<number[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  /* پاک‌سازی ورکر هنگام بستن پنجره */
  useEffect(() => {
    return () => {
      runnerRef.current?.terminate()
      runnerRef.current = null
    }
  }, [])

  const runTest = useCallback(async () => {
    if (busy) return
    setBusy(true)
    setError('')
    setLines([])
    setTimings([])
    setProgress('')
    setState('در حال بارگیری')

    const runner = runnerRef.current ?? new PyodideRunner()
    runnerRef.current = runner
    runner.onOut = (kind: PyOutKind, text: string) => {
      if (kind === 'stdout' || kind === 'stderr' || kind === 'status' || kind === 'fatal') {
        setLines((prev) => [...prev, { kind, text }])
        if (kind === 'fatal') setState('خطا')
      }
    }

    try {
      /* بارگیری از CDN پین‌شده، فقط با اقدام صریح کاربر */
      await runner.ensure((t) => setProgress(t))
      setState('آماده')

      /* دو آزمایش واقعی، خروجی از مسیر onOut می‌آید، نه مقدار بازگشتی */
      const snippets = ['print(2**64)', 'import sys; print(sys.version)']
      const times: number[] = []
      let allOk = true
      for (const code of snippets) {
        const r = await runner.run(code, 15000)
        times.push(r.ms)
        if (!r.ok) allOk = false
      }
      setTimings(times)

      if (allOk) {
        setState('آزمایش شد')
        /* پاداش گیمیفیکیشن، idempotent است و فقط یک‌بار امتیاز می‌دهد */
        useGame.getState().award(
          'runtime:pyodide:quick-test',
          15,
          'اجرای موفق پایتون واقعی (Pyodide) در مرورگر'
        )
      } else {
        setState('خطا')
        setError('یکی از اجراها موفق نبود (احتمالاً تایم‌اوت ۱۵ ثانیه). جزئیات در خروجی بالا.')
      }
    } catch (e) {
      setState('خطا')
      setError(
        e instanceof Error
          ? `بارگیری Pyodide ناموفق بود: ${e.message}`
          : 'بارگیری Pyodide به دلیل خطای ناشناخته‌ای ناموفق بود.'
      )
    } finally {
      setBusy(false)
    }
  }, [busy])

  const totalMs = timings.reduce((a, b) => a + b, 0)

  return (
    <RuntimeCard
      icon={Terminal}
      gradient="from-amber-400 to-orange-500"
      name="پایتون واقعی؛ Pyodide 0.26.4"
      version="CPython 3.12 کامپایل‌شده به WebAssembly، مفسر کامل پایتون، داخل مرورگر"
      kind="مرورگر"
      state={state}
      size="حدود ۱۰ مگابایت از CDN، فقط در نخستین اجرا"
    >
      <div className="flex flex-wrap gap-4">
        <CapList
          title="توانمندی‌ها"
          tone="caps"
          items={[
            'CPython کامل با کتابخانهٔ استاندارد',
            'بارگذاری خودکار بسته‌ها با loadPackagesFromImports (مثل numpy)',
            'خروجی واقعی stdout و stderr در همین پنجره',
          ]}
        />
        <CapList
          title="محدودیت‌ها (صادقانه)"
          tone="limits"
          items={[
            'بدون نخ‌ها (threads)، محیط WASM تک‌نخه است',
            'تایم‌اوت ۱۵ ثانیه برای هر اجرا',
            'بارگیری نخست نیاز به اینترنت دارد (حدود ۱۰ مگابایت)',
          ]}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="secondary" onClick={() => void runTest()} disabled={busy}>
          {busy ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden />
          ) : (
            <Zap className="size-4" aria-hidden />
          )}
          {busy ? 'در حال اجرا…' : 'آزمایش سریع'}
        </Button>
        {state === 'آزمایش شد' && !busy && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300">
            <CircleCheck size={12} aria-hidden />
            مجموع {faNum(totalMs)} میلی‌ثانیه
          </span>
        )}
        {state === 'آماده' && !busy && (
          <span className="text-[10px] text-zinc-500">مفسر بارگیری شد و آمادهٔ اجراست.</span>
        )}
      </div>

      {/* پیشرفت بارگیری */}
      {busy && progress && (
        <p className="flex items-center gap-1.5 text-[10.5px] text-amber-300">
          <LoaderCircle size={11} className="animate-spin" aria-hidden />
          {progress}
        </p>
      )}

      {/* خطای صادقانه، قرمز، بدون پنهان‌کاری */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-2.5 text-[10.5px] leading-5 text-rose-300"
        >
          <CircleX className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span className="min-w-0">{error}</span>
        </div>
      )}

      {/* خروجی واقعی؛ LTR و مونواسپیس */}
      {lines.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-white/10 bg-black/60">
          <div className="flex items-center gap-2 border-b border-white/10 bg-zinc-900/80 px-3 py-1.5">
            <Terminal size={11} className="text-amber-300" aria-hidden />
            <span className="text-[10px] font-bold text-zinc-400">خروجی واقعی CPython 3.12 (WASM)</span>
          </div>
          <pre
            dir="ltr"
            className="os-scroll max-h-40 overflow-y-auto p-3 text-left font-mono text-[11px] leading-5 text-amber-200"
          >
            {lines.map((l, i) => (
              <span
                key={i}
                className={l.kind === 'stdout' ? 'block text-amber-200' : 'block text-rose-400'}
              >
                {l.text}
              </span>
            ))}
          </pre>
        </div>
      )}

      {timings.length > 0 && (
        <p className="text-[10px] text-zinc-500">
          زمان هر اجرا: {timings.map((t) => faNum(Math.round(t))).join(' + ')} میلی‌ثانیه
        </p>
      )}
    </RuntimeCard>
  )
}

/* ------------------ کارت ۲: پایتون مینی (آفلاین) ------------------ */

function MiniPythonCard() {
  const [noteOpen, setNoteOpen] = useState(false)
  return (
    <RuntimeCard
      icon={GraduationCap}
      gradient="from-emerald-400 to-cyan-500"
      name="پایتون مینی (آفلاین)"
      version="مفسر زیرمجموعهٔ آموزشی، کاملاً داخلی، بدون هیچ بارگیری"
      kind="شبیه‌ساز آموزشی"
      state="آماده"
      size="چند ده کیلوبایت، جاسازی‌شده در خود سیستم‌عامل"
    >
      <p className="rounded-xl border border-purple-400/25 bg-purple-400/10 p-2.5 text-[10.5px] leading-5 text-purple-200">
        صداقت با کاربر: این یک <b>زیرمجموعهٔ آموزشی</b> است، همهٔ امکانات CPython را ندارد و جای
        پایتون واقعی را نمی‌گیرد. برای پایتون کامل و واقعی از کارت «پایتون واقعی؛ Pyodide» بالا
        استفاده کن.
      </p>

      <div className="flex flex-wrap gap-4">
        <CapList
          title="توانمندی‌ها"
          tone="caps"
          items={[
            'بدون اینترنت، همیشه و همه‌جا در دسترس',
            'شاخهٔ کوچکی از سینتکس پایتون برای یادگیری مفاهیم پایه',
            'اجرای فوری بدون هیچ بارگیری',
          ]}
        />
        <CapList
          title="محدودیت‌ها (صادقانه)"
          tone="limits"
          items={[
            'کتابخانهٔ استاندارد CPython ندارد',
            'بسته‌های third-party مثل numpy نصب نمی‌شوند',
            'رفتار در موارد خاص ممکن است با پایتون واقعی فرق کند',
          ]}
        />
      </div>

      <div>
        <Button size="sm" variant="outline" onClick={() => setNoteOpen((v) => !v)}>
          <Info className="size-4" aria-hidden />
          {noteOpen ? 'بستن یادداشت' : 'یادداشت صادقانه'}
        </Button>
        {noteOpen && (
          <p className="mt-2 rounded-xl border border-white/10 bg-zinc-950/60 p-3 text-[10.5px] leading-5 text-zinc-400">
            هدف این مفسر، آموزش گام‌به‌گام مفاهیم پایتون داخل آکادمی است: متغیر، شرط، حلقه و
            تابع. اگر به کلاس، وراثت یا کتابخانه‌های واقعی نیاز داری، همان‌طور که بالای کارت
            نوشتیم، مسیر درست «پایتون واقعی؛ Pyodide» است، نه این مفسر کوچک.
          </p>
        )}
      </div>
    </RuntimeCard>
  )
}

/* ------------------ کارت ۳: لینوکس واقعی (v86 + Alpine) ------------------ */

function RealLinuxCard() {
  const pushToast = useOS((s) => s.pushToast)
  const [noteOpen, setNoteOpen] = useState(false)
  const canLaunch = useMemo(() => !!getApp('real-linux'), [])

  const openLinux = useCallback(() => {
    launch('real-linux')
    pushToast({
      icon: Cpu,
      title: 'لینوکس واقعی در حال باز شدن',
      body: 'پنجرهٔ «بوت کرنل واقعی» باز شد، نخستین بوت ممکن است کمی طول بکشد.',
    })
  }, [pushToast])

  return (
    <RuntimeCard
      icon={Cpu}
      gradient="from-orange-400 to-rose-500"
      name="لینوکس واقعی، v86 + Alpine"
      version="کرنل 6.12.114-virt؛ Alpine 3.21.9، ماشین مجازی کامل داخل مرورگر"
      kind="مرورگر"
      state="آماده"
      size="حدود ۶۰ مگابایت، دارایی‌های محلی، بدون بارگیری از اینترنت"
    >
      <div className="flex flex-wrap gap-4">
        <CapList
          title="توانمندی‌ها"
          tone="caps"
          items={[
            'کرنل لینوکس واقعی که واقعاً بوت می‌شود، نه شبیه‌سازی دستوری',
            'ذخیرهٔ Snapshot در IndexedDB، ادامه از همان‌جا که رها کردی',
            'پکیج‌منیجر apk داخل خود لینوکس',
          ]}
        />
        <CapList
          title="محدودیت‌ها (صادقانه)"
          tone="limits"
          items={[
            'معماری i686 است، نه x86_64، بسته‌های ۳۲بیتی',
            'شتاب‌دهی KVM وجود ندارد، بوت کندتر از ماشین مجازی دسکتاپ',
            'شبکه از طریق Relay می‌گذرد و محدودیت‌های خودش را دارد',
          ]}
        />
      </div>

      {canLaunch ? (
        <Button
          size="sm"
          onClick={openLinux}
          className="border border-emerald-400/40 bg-emerald-400/15 text-emerald-200 hover:bg-emerald-400/25"
        >
          <Zap className="size-4" aria-hidden />
          باز کردن لینوکس واقعی
        </Button>
      ) : (
        <p className="rounded-xl border border-amber-400/25 bg-amber-400/10 p-2.5 text-[10.5px] leading-5 text-amber-200">
          برنامهٔ «بوت کرنل واقعی» در این نسخه از سان‌جاب‌اواس ثبت نشده است. با نسخهٔ کامل‌تر، از
          منوی برنامه‌ها گزینهٔ «بوت کرنل واقعی» را باز کن.
        </p>
      )}

      <div>
        <Button size="sm" variant="ghost" onClick={() => setNoteOpen((v) => !v)}>
          <Info className="size-4" aria-hidden />
          {noteOpen ? 'بستن جزئیات' : 'جزئیات فنی'}
        </Button>
        {noteOpen && (
          <p className="mt-2 rounded-xl border border-white/10 bg-zinc-950/60 p-3 text-[10.5px] leading-5 text-zinc-400">
            موتور v86 کد ماشین x86 را در مرورگر با WebAssembly اجرا می‌کند؛ یعنی کرنل واقعی لینوکس
            روی مجازی‌ساز واقعی بوت می‌شود. این «مرورگر» است نه فلز لخت (bare-metal)، ولی برخلاف
            شبیه‌سازهای آموزشی، اینجا یک کرنل واقعی در حال اجراست.
          </p>
        )}
      </div>
    </RuntimeCard>
  )
}

/* ------------------ کارت ۴: راست، شبیه‌ساز آموزشی + rustc نیتیو ------------------ */

function RustCard() {
  const [noteOpen, setNoteOpen] = useState(false)
  return (
    <RuntimeCard
      icon={Binary}
      gradient="from-rose-400 to-orange-500"
      name="راست، شبیه‌ساز آموزشی"
      version="اجرای گام‌به‌گام مفاهیم Rust در آکادمی، نه کامپایلر واقعی rustc"
      kind="شبیه‌ساز آموزشی"
      state="آماده"
      size="داخلی، بخشی از آکادمی راست سان‌جاب‌اواس"
    >
      <p className="rounded-xl border border-purple-400/25 bg-purple-400/10 p-2.5 text-[10.5px] leading-5 text-purple-200">
        صداقت با کاربر: اینجا کامپایلر rustc یا cargo اجرا نمی‌شود. یک شبیه‌ساز آموزشی است که
        زیرمجموعهٔ کوچکی از رفتار Rust را برای درس‌ها تقلید می‌کند، مثلاً مفهوم مالکیت (ownership)
        را با مثال‌های از پیش تعریف‌شده نشان می‌دهد.
      </p>

      <div className="flex flex-wrap gap-4">
        <CapList
          title="توانمندی‌ها"
          tone="caps"
          items={[
            'تمرین تعاملی مفاهیم پایه: مالکیت، borrow، struct و enum',
            'بازخورد فوری درون آکادمی، بدون نصب هیچ‌چیز',
          ]}
        />
        <CapList
          title="محدودیت‌ها (صادقانه)"
          tone="limits"
          items={[
            'کد واقعی rustc نمی‌شود با آن کامپایل کرد',
            'Cargo، crate ها و macro ها پشتیبانی نمی‌شوند',
            'خروجی binary واقعی تولید نمی‌کند',
          ]}
        />
      </div>

      <div>
        <Button size="sm" variant="outline" onClick={() => setNoteOpen((v) => !v)}>
          <Info className="size-4" aria-hidden />
          {noteOpen ? 'بستن یادداشت' : 'یادداشت صادقانه'}
        </Button>
        {noteOpen && (
          <p className="mt-2 rounded-xl border border-white/10 bg-zinc-950/60 p-3 text-[10.5px] leading-5 text-zinc-400">
            مسیر پیشنهادی ما: مفاهیم را اینجا یاد بگیر، بعد برای کامپایل واقعی، rustc و cargo را
            روی دسکتاپ نصب کن، پیوند رسمی در نوار نارنجی پایین همین کارت آمده است.
          </p>
        )}
      </div>

      {/* زیرکارت صادقانه: کامپایلر واقعی فقط دسکتاپ */}
      <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-3">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Cog size={13} className="shrink-0 text-amber-300" aria-hidden />
          <span className="text-[11px] font-black text-amber-200">
            کامپایلر واقعی rustc/cargo: فقط نسخهٔ دسکتاپ/نیتیو
          </span>
          <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-[9px] font-black text-amber-300">
            دسکتاپ
          </span>
          <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-[9px] font-black text-amber-300">
            برنامه‌ریزی‌شده
          </span>
        </div>
        <p className="mt-1.5 text-[10.5px] leading-5 text-amber-200/80">
          rustc و cargo هیچ‌وقت داخل مرورگر اجرا نمی‌شوند، فقط روی لینوکس/ویندوز/مک به‌صورت
          نیتیو. سان‌جاب‌اواس نسخهٔ مرورگری‌اش را ادعا نمی‌کند.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <a
            href="https://www.rust-lang.org/tools/install"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 text-[10.5px] font-bold text-amber-200 transition hover:bg-amber-400/20"
          >
            <ExternalLink size={11} aria-hidden />
            نصب رسمی rust
          </a>
          <a
            href="https://doc.rust-lang.org/book/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/10 bg-zinc-900/60 px-3 text-[10.5px] font-bold text-zinc-300 transition hover:bg-zinc-800"
          >
            <ExternalLink size={11} aria-hidden />
            مستندات رسمی (The Book)
          </a>
        </div>
      </div>
    </RuntimeCard>
  )
}

/* ------------------ کارت ۵: هوش مصنوعی محلی (WebLLM/llama.cpp) ------------------ */

function LocalAiCard({ webgpu }: { webgpu: boolean }) {
  const models: [string, string][] = [
    ['Qwen2 0.5B', 'حدود ۵۰۰ مگابایت'],
    ['Llama 3.2 1B', 'حدود ۷۰۰ مگابایت'],
  ]
  return (
    <RuntimeCard
      icon={Brain}
      gradient="from-purple-400 to-rose-500"
      name="هوش مصنوعی محلی (WebLLM/llama.cpp)"
      version="اجرای مدل‌های زبانی کوچک روی خود دستگاه، بدون ارسال داده به سرور"
      kind="برنامه‌ریزی‌شده"
      state="برنامه‌ریزی‌شده"
      size="به‌ازای هر مدل: از حدود ۵۰۰ مگابایت به بالا"
    >
      <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-3">
        <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-black text-zinc-400">
          <Gauge size={11} className="text-purple-300" aria-hidden />
          نتیجهٔ تشخیص WebGPU در همین مرورگر (زنده):
        </p>
        <p className={`text-[11px] font-black ${webgpu ? 'text-emerald-300' : 'text-zinc-500'}`}>
          {webgpu
            ? 'WebGPU: فعال، دستگاه شما برای اجرای آینده واجد شرایط است.'
            : 'WebGPU: موجود نیست، وقتی این قابلیت برسد، روی این دستگاه کار نخواهد کرد.'}
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10">
        {models.map(([name, size], i) => (
          <div
            key={name}
            className={`flex items-center justify-between gap-2 px-3 py-2 text-[10.5px] ${
              i % 2 === 0 ? 'bg-zinc-900' : 'bg-zinc-900/50'
            }`}
          >
            <span dir="ltr" className="shrink-0 font-mono text-zinc-300">
              {name}
            </span>
            <span className="font-bold text-zinc-500">{size}، فقط برای اطلاع، قابل دانلود نیست</span>
          </div>
        ))}
      </div>

      <div>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-block">
              <Button size="sm" variant="secondary" disabled aria-disabled="true">
                <Brain className="size-4" aria-hidden />
                بارگیری مدل
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>به‌زودی</TooltipContent>
        </Tooltip>
        <p className="mt-2 text-[10px] leading-5 text-zinc-500">
          وضعیت صادقانه: «برنامه‌ریزی‌شده»، هنوز هیچ مدلی در این نسخه دانلود یا اجرا نمی‌شود.
        </p>
      </div>
    </RuntimeCard>
  )
}

/* ------------------ کارت ۶: پاورشل / شل میزبان ------------------ */

function HostShellCard() {
  return (
    <RuntimeCard
      icon={Server}
      gradient="from-zinc-600 to-zinc-700"
      name="پاورشل / شل میزبان"
      version="پل ارتباطی با شل واقعی سیستم‌عامل میزبان (ویندوز/لینوکس/مک)"
      kind="برنامه‌ریزی‌شده"
      state="برنامه‌ریزی‌شده"
      size="— (وابسته به نسخهٔ دسکتاپ)"
    >
      <p className="rounded-xl border border-amber-400/25 bg-amber-400/10 p-2.5 text-[10.5px] leading-5 text-amber-200">
        در مرورگر موجود نیست؛ در نسخهٔ دسکتاپ از طریق پل محلی (local bridge) ارائه می‌شود. مرورگرها
        به دلایل امنیتی اجازهٔ اجرای مستقیم PowerShell یا bash میزبان را نمی‌دهند، و ما این محدودیت
        را دور نمی‌زنیم و وانمود هم نمی‌کنیم.
      </p>

      <div className="flex flex-wrap gap-4">
        <CapList
          title="توانمندی‌ها (وقتی برسد)"
          tone="caps"
          items={[
            'فقط در نسخهٔ دسکتاپ سان‌جاب‌اواس',
            'اجرای فرمان‌های شل میزبان با اجازهٔ صریح کاربر',
          ]}
        />
        <CapList
          title="محدودیت‌ها (صادقانه)"
          tone="limits"
          items={[
            'در نسخهٔ مرورگر هرگز در دسترس نخواهد بود',
            'نیازمند نصب کامپوننت پل محلی روی دستگاه میزبان',
          ]}
        />
      </div>

      <p className="flex items-center gap-1.5 text-[10px] text-zinc-500">
        <MonitorSmartphone size={11} aria-hidden />
        جایگزین درون مرورگر: ترمینال آموزشی sanjob-sh که بخشی از خود سان‌جاب‌اواس است.
      </p>
    </RuntimeCard>
  )
}
