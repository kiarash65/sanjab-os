'use client'

/* ================================================================
   Settings Center — مرکز تنظیمات سان‌جاب‌اواس
   ۱۲ دسته: ظاهر، تایپوگرافی و مطالعه، دسترس‌پذیری، میزکار، اعلان‌ها،
   یادگیری، هوش مصنوعی، حریم خصوصی، ذخیره‌سازی، میان‌برها،
   توسعه‌دهنده (فقط با Developer Mode) و درباره.
   همه تغییرات بدون Reload و فوری روی کل سیستم اعمال می‌شوند.
   ================================================================ */

import { useEffect, useRef, useState } from 'react'
import {
  Accessibility,
  Bell,
  BookOpenCheck,
  Bot,
  CheckCircle2,
  Contrast,
  Copy,
  Cpu,
  Download,
  Eraser,
  ExternalLink,
  Eye,
  Gauge,
  GraduationCap,
  HardDrive,
  Info,
  Keyboard,
  LayoutDashboard,
  Loader2,
  MonitorPlay,
  Palette,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  SquareTerminal,
  Timer,
  Trash2,
  Type,
  Upload,
  XCircle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useOS } from '@/lib/os/store'
import type {
  CodeFontKey,
  DensityKey,
  FontFamilyKey,
  LineHeightKey,
  ReadingWidthKey,
} from '@/lib/os/store'
import { WALLPAPERS, ACCENTS } from '@/lib/os/wallpapers'
import {
  downloadBackup,
  fmtBytes,
  restoreFromFile,
  usageReport,
  type UsageReport,
} from '@/lib/os/backup'
import {
  downloadProgress,
  downloadSettings,
  importProgressFromFile,
  importSettingsFromFile,
  resetAllSettings,
  resetLearningData,
  todayReadingSeconds,
} from '@/lib/os/settings-io'
import {
  clampWeight,
  CODE_FONT_OPTIONS,
  CODE_SIZE_LIMITS,
  FONT_OPTIONS,
  FONT_SIZE_LIMITS,
  fontStatusReport,
  LINE_HEIGHT_PRESETS,
  READING_WIDTH_PRESETS,
} from '@/lib/os/typography'
import {
  FEATURE_FLAGS,
  OS_CODENAME,
  OS_REPO,
  OS_VERSION,
  RUNTIMES,
} from '@/lib/os/version'
import { buildTechReport, clearDevLogs, getDevLogs } from '@/lib/os/devlog'
import { launch } from '@/lib/os/apps'
import { TypographyPreview } from '@/components/os/academy/reader'

/* ---------------- دسته‌بندی‌ها ---------------- */

type CatId =
  | 'appearance'
  | 'typography'
  | 'accessibility'
  | 'desktop'
  | 'notifications'
  | 'learning'
  | 'ai'
  | 'privacy'
  | 'storage'
  | 'shortcuts'
  | 'developer'
  | 'about'

const CATEGORIES: {
  id: CatId
  label: string
  icon: LucideIcon
  hint: string
}[] = [
  { id: 'typography', label: 'تایپوگرافی و مطالعه', icon: Type, hint: 'فونت، اندازه، ارتفاع خط' },
  { id: 'appearance', label: 'ظاهر', icon: Palette, hint: 'کاغذدیواری و رنگ' },
  { id: 'accessibility', label: 'دسترس‌پذیری', icon: Accessibility, hint: 'حرکت، کنتراست، فوکوس' },
  { id: 'desktop', label: 'میزکار و رابط', icon: LayoutDashboard, hint: 'مقیاس، چگالی، انیمیشن' },
  { id: 'notifications', label: 'اعلان‌ها و صدا', icon: Bell, hint: 'حالت سرگرم‌کننده' },
  { id: 'learning', label: 'ترجیحات یادگیری', icon: BookOpenCheck, hint: 'هدف روزانه و راهنما' },
  { id: 'ai', label: 'هوش مصنوعی', icon: Bot, hint: 'هوش‌یار و سرویس‌ها' },
  { id: 'privacy', label: 'حریم خصوصی و داده', icon: ShieldCheck, hint: 'پشتیبان، خروجی، بازنشانی' },
  { id: 'storage', label: 'ذخیره‌سازی و کارایی', icon: HardDrive, hint: 'حجم و پاک‌سازی' },
  { id: 'shortcuts', label: 'کلیدهای میان‌بر', icon: Keyboard, hint: 'میان‌برهای سراسری' },
  { id: 'developer', label: 'توسعه‌دهنده', icon: SquareTerminal, hint: 'وضعیت فنی سیستم' },
  { id: 'about', label: 'درباره سیستم', icon: Info, hint: 'نسخه و اعتبارها' },
]

/* ---------------- اجزای کمکی ---------------- */

function SectionCard({
  title,
  icon: Icon,
  desc,
  children,
  tone,
}: {
  title: string
  icon?: LucideIcon
  desc?: string
  children: React.ReactNode
  tone?: string
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-zinc-900/50 p-4">
      <h3 className="mb-1 flex items-center gap-2 text-sm font-black text-zinc-100">
        {Icon && (
          <span
            className="grid h-7 w-7 place-items-center rounded-lg"
            style={{ background: `${tone ?? 'var(--pengo-accent, #f7931e)'}22`, color: tone ?? 'var(--pengo-accent, #f7931e)' }}
            aria-hidden
          >
            <Icon size={15} />
          </span>
        )}
        {title}
      </h3>
      {desc && <p className="mb-3 text-[11px] leading-5 text-zinc-500">{desc}</p>}
      <div className="mt-2 space-y-2.5">{children}</div>
    </section>
  )
}

function Row({
  title,
  desc,
  children,
  stack = false,
}: {
  title: string
  desc?: string
  children: React.ReactNode
  /** true = کنترل زیر متن می‌آید (برای اسلایدرها) */
  stack?: boolean
}) {
  return (
    <div
      className={`rounded-xl border border-white/10 bg-zinc-950/40 px-3 py-2.5 ${
        stack ? 'space-y-2.5' : 'flex items-center justify-between gap-3'
      }`}
    >
      <div className="min-w-0">
        <p className="text-[13px] font-bold text-zinc-100">{title}</p>
        {desc && <p className="mt-0.5 text-[11px] leading-5 text-zinc-500">{desc}</p>}
      </div>
      <div className={stack ? '' : 'shrink-0'}>{children}</div>
    </div>
  )
}

function Pills<T extends string | number>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T
  options: { v: T; label: string }[]
  onChange: (v: T) => void
  ariaLabel: string
}) {
  return (
    <div className="flex flex-wrap gap-1" role="group" aria-label={ariaLabel}>
      {options.map((o) => {
        const active = o.v === value
        return (
          <button
            key={String(o.v)}
            type="button"
            onClick={() => onChange(o.v)}
            aria-pressed={active}
            className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold transition ${
              active
                ? 'border-transparent bg-[var(--pengo-accent)] text-zinc-950'
                : 'border-white/10 bg-zinc-900/80 text-zinc-300 hover:bg-white/10'
            }`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

/** دکمه خطرناک دومرحله‌ای — اول کلیک، بعد تأیید */
function ConfirmButton({
  label,
  confirmLabel,
  onConfirm,
  className = '',
  icon: Icon,
}: {
  label: string
  confirmLabel: string
  onConfirm: () => void
  className?: string
  icon?: LucideIcon
}) {
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    if (!armed) return
    const t = window.setTimeout(() => setArmed(false), 3000)
    return () => window.clearTimeout(t)
  }, [armed])
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        if (armed) {
          setArmed(false)
          onConfirm()
        } else {
          setArmed(true)
        }
      }}
      className={`border-rose-500/40 text-rose-300 hover:bg-rose-500/10 ${className}`}
      aria-live="polite"
    >
      {Icon && <Icon className="size-4" />}
      {armed ? confirmLabel : label}
    </Button>
  )
}

/* ---------------- ظاهر ---------------- */

function AppearanceSection() {
  const settings = useOS((s) => s.settings)
  const setSetting = useOS((s) => s.setSetting)
  const pushToast = useOS((s) => s.pushToast)

  return (
    <>
      <SectionCard title="کاغذدیواری" icon={Palette} tone="#a855f7">
        <Row
          title="چرخش خودکار"
          desc="هر ۳۰ ثانیه کاغذدیواری عوض می‌شود"
        >
          <Switch
            checked={settings.wallpaperRotate}
            onCheckedChange={(v) => setSetting('wallpaperRotate', v)}
            aria-label="چرخش خودکار کاغذدیواری"
          />
        </Row>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {WALLPAPERS.map((w) => {
            const active = settings.wallpaper === w.key
            return (
              <div key={w.key}>
                <button
                  type="button"
                  aria-label={w.name}
                  title={w.name}
                  onClick={() => {
                    setSetting('wallpaper', w.key)
                    pushToast({ icon: '🖼️', title: 'کاغذدیواری عوض شد', body: `حالا روی «${w.name}» هستی` })
                  }}
                  className={`h-16 w-full rounded-lg border border-white/10 transition-all hover:brightness-110 ${
                    active ? 'ring-2 ring-[var(--pengo-accent)]' : ''
                  }`}
                  style={{ background: w.css, backgroundSize: 'cover', backgroundPosition: 'center' }}
                />
                <p className="mt-1 truncate text-center text-[10px] text-zinc-400">{w.name}</p>
              </div>
            )
          })}
        </div>
      </SectionCard>

      <SectionCard title="رنگ اصلی سیستم" icon={Sparkles} tone="#f7931e">
        <div className="flex flex-wrap items-center gap-3">
          {ACCENTS.map((a) => {
            const active = settings.accent === a.value
            return (
              <button
                key={a.key}
                type="button"
                title={a.name}
                aria-label={a.name}
                aria-pressed={active}
                onClick={() => setSetting('accent', a.value)}
                className={`h-9 w-9 rounded-full border border-white/20 transition-transform hover:scale-110 ${
                  active ? 'scale-110 ring-2 ring-white' : ''
                }`}
                style={{ background: a.value }}
              />
            )
          })}
        </div>
      </SectionCard>
    </>
  )
}

/* ---------------- تایپوگرافی و مطالعه (ویترین ارتقا) ---------------- */

function TypographySection() {
  const settings = useOS((s) => s.settings)
  const setSetting = useOS((s) => s.setSetting)
  const pushToast = useOS((s) => s.pushToast)

  const activeFont = FONT_OPTIONS.find((f) => f.key === settings.fontFamily) ?? FONT_OPTIONS[0]

  const pickFont = (k: FontFamilyKey) => {
    setSetting('fontFamily', k)
    setSetting('bodyWeight', clampWeight(k, settings.bodyWeight))
  }

  const sizePresets: { v: number; label: string }[] = [
    { v: 14, label: 'کوچک' },
    { v: 16, label: 'متوسط' },
    { v: 18, label: 'بزرگ' },
    { v: 20, label: 'خیلی بزرگ' },
  ]

  const resetTypography = () => {
    setSetting('fontFamily', 'estedad')
    setSetting('fontSize', 16)
    setSetting('lineHeight', 'comfortable')
    setSetting('readingWidth', 'standard')
    setSetting('bodyWeight', 400)
    setSetting('codeFont', 'jetbrains')
    setSetting('codeSize', 13)
    pushToast({ icon: '🔤', title: 'تایپوگرافی برگشت', body: 'فونت استعداد، اندازهٔ استاندارد' })
  }

  return (
    <>
      <SectionCard
        title="فونت فارسی"
        icon={Type}
        desc="روی کل سیستم و همهٔ آکادمی‌ها فوراً اعمال می‌شود. هر دو فونت محلی باندل شده‌اند و بعد از اولین بار، بدون اینترنت هم کار می‌کنند."
      >
        <div className="grid gap-2 sm:grid-cols-2">
          {FONT_OPTIONS.map((f) => {
            const active = settings.fontFamily === f.key
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => pickFont(f.key)}
                aria-pressed={active}
                className={`rounded-xl border p-3 text-right transition ${
                  active
                    ? 'border-[var(--pengo-accent)] bg-white/5 ring-1 ring-[var(--pengo-accent)]'
                    : 'border-white/10 bg-zinc-950/40 hover:border-white/25'
                }`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-black text-zinc-100">{f.label}</span>
                  {active && <CheckCircle2 size={15} className="shrink-0 text-emerald-400" aria-hidden />}
                </span>
                <span className="mt-1 block text-[10.5px] leading-4 text-zinc-500">{f.note}</span>
                <span className="mt-1.5 block text-[10px] text-zinc-600">
                  طراح: {f.designer} · {f.license}
                </span>
              </button>
            )
          })}
        </div>
      </SectionCard>

      <SectionCard title="اندازه متن مطالعه" icon={Gauge} tone="#14b8a6">
        <Row title="اندازه پیش‌فرض" desc="بین ۱۳ تا ۲۲ پیکسل — همهٔ درس‌ها پیروی می‌کنند" stack>
          <Pills
            value={settings.fontSize}
            options={sizePresets}
            onChange={(v) => setSetting('fontSize', v)}
            ariaLabel="اندازه متن"
          />
          <Slider
            value={[settings.fontSize]}
            min={FONT_SIZE_LIMITS.min}
            max={FONT_SIZE_LIMITS.max}
            step={1}
            onValueChange={(vals) => setSetting('fontSize', vals[0])}
            aria-label="تنظیم دقیق اندازه متن"
          />
          <p className="text-center text-[10px] text-zinc-500" dir="ltr" aria-live="polite">
            {settings.fontSize}px
          </p>
        </Row>
        <Row
          title="وزن قلم"
          desc={`بازهٔ مجاز «${activeFont.label}»: ${activeFont.weightMin} تا ${activeFont.weightMax}${
            activeFont.weightSnap ? ' (وزن‌های موجود اسنپ می‌شوند)' : ''
          }`}
          stack
        >
          <Slider
            value={[clampWeight(settings.fontFamily, settings.bodyWeight)]}
            min={activeFont.weightMin}
            max={activeFont.weightMax}
            step={activeFont.weightSnap ? 100 : 50}
            onValueChange={(vals) => setSetting('bodyWeight', clampWeight(settings.fontFamily, vals[0]))}
            aria-label="وزن قلم"
          />
          <p className="text-center text-[10px] text-zinc-500" dir="ltr" aria-live="polite">
            {clampWeight(settings.fontFamily, settings.bodyWeight)}
          </p>
        </Row>
        <Row title="ارتفاع خط" desc="برای مطالعهٔ طولانی فارسی، «راحت» پیشنهاد می‌شود">
          <Pills
            value={settings.lineHeight}
            options={(Object.keys(LINE_HEIGHT_PRESETS) as LineHeightKey[]).map((k) => ({
              v: k,
              label: LINE_HEIGHT_PRESETS[k].label,
            }))}
            onChange={(v) => setSetting('lineHeight', v)}
            ariaLabel="ارتفاع خط"
          />
        </Row>
        <Row title="عرض ستون مطالعه" desc="عرض استاندارد بهترین تعادل برای چشم است">
          <Pills
            value={settings.readingWidth}
            options={(Object.keys(READING_WIDTH_PRESETS) as ReadingWidthKey[]).map((k) => ({
              v: k,
              label: READING_WIDTH_PRESETS[k].label,
            }))}
            onChange={(v) => setSetting('readingWidth', v)}
            ariaLabel="عرض مطالعه"
          />
        </Row>
      </SectionCard>

      <SectionCard title="فونت کد" icon={SquareTerminal} tone="#22c55e">
        <Row title="خانوادهٔ فونت کد" desc="کد همیشه LTR رندر می‌شود؛ فارسی داخل کد از فونت متن پیروی می‌کند">
          <Pills
            value={settings.codeFont}
            options={CODE_FONT_OPTIONS.map((c) => ({ v: c.key as CodeFontKey, label: c.label }))}
            onChange={(v) => setSetting('codeFont', v)}
            ariaLabel="فونت کد"
          />
        </Row>
        <Row title="اندازه فونت کد" stack>
          <Slider
            value={[settings.codeSize]}
            min={CODE_SIZE_LIMITS.min}
            max={CODE_SIZE_LIMITS.max}
            step={1}
            onValueChange={(vals) => setSetting('codeSize', vals[0])}
            aria-label="اندازه فونت کد"
          />
          <p className="text-center text-[10px] text-zinc-500" dir="ltr" aria-live="polite">
            {settings.codeSize}px
          </p>
        </Row>
      </SectionCard>

      <SectionCard title="پیش‌نمایش زنده" icon={Eye} tone="#a855f7" desc="همین الان با تنظیمات فعلی سیستم رندر شده است — تغییر بده و همین‌جا ببین.">
        <TypographyPreview />
      </SectionCard>

      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={resetTypography} className="border-white/15 text-zinc-300 hover:bg-white/10">
          <RotateCcw className="size-4" />
          بازگرداندن تایپوگرافی به پیش‌فرض
        </Button>
      </div>
    </>
  )
}

/* ---------------- دسترس‌پذیری ---------------- */

function AccessibilitySection() {
  const settings = useOS((s) => s.settings)
  const setSetting = useOS((s) => s.setSetting)

  return (
    <>
      <SectionCard title="دسترس‌پذیری" icon={Accessibility} tone="#38bdf8" desc="این گزینه‌ها فوراً روی کل سیستم اعمال می‌شوند.">
        <Row title="کاهش حرکت" desc="انیمیشن‌ها و ترنزیشن‌ها تقریباً خاموش می‌شوند">
          <Switch
            checked={settings.reducedMotion}
            onCheckedChange={(v) => setSetting('reducedMotion', v)}
            aria-label="کاهش حرکت"
          />
        </Row>
        <Row title="کنتراست بالا" desc="متن‌های کم‌رنگ روشن‌تر و حاشیه‌ها واضح‌تر می‌شوند">
          <Switch
            checked={settings.highContrast}
            onCheckedChange={(v) => setSetting('highContrast', v)}
            aria-label="کنتراست بالا"
          />
        </Row>
        <Row title="کنترل‌های بزرگ‌تر" desc="دکمه‌ها و متن رابط حدود ۶٪ بزرگ‌تر می‌شوند">
          <Switch
            checked={settings.largerControls}
            onCheckedChange={(v) => setSetting('largerControls', v)}
            aria-label="کنترل‌های بزرگ‌تر"
          />
        </Row>
        <Row title="راهنمای فوکوس کیبورد" desc="حین پیمایش با Tab، فوکوس همیشه با رنگ اکسنت مشخص است">
          <Switch
            checked={settings.keyboardNav}
            onCheckedChange={(v) => setSetting('keyboardNav', v)}
            aria-label="راهنمای فوکوس کیبورد"
          />
        </Row>
      </SectionCard>
      <SectionCard title="کنتراست و خوانایی متن" icon={Contrast} tone="#f7931e">
        <p className="text-[11.5px] leading-6 text-zinc-400">
          متن آموزشی سان‌جاب‌اواس همیشه بالای آستانهٔ خوانایی می‌ماند: کوچک‌ترین اندازهٔ مجاز{' '}
          <span dir="ltr" className="ltr-inline">{FONT_SIZE_LIMITS.min}px</span> است و رنگ متن اصلی در پس‌زمینهٔ تیره کنتراست استاندارد دارد.
          شخصی‌سازی هیچ‌وقت خوانایی را قربانی نمی‌کند.
        </p>
      </SectionCard>
    </>
  )
}

/* ---------------- میزکار و رابط ---------------- */

function DesktopSection() {
  const settings = useOS((s) => s.settings)
  const setSetting = useOS((s) => s.setSetting)
  const shuffleIcons = useOS((s) => s.shuffleIcons)
  const pushToast = useOS((s) => s.pushToast)

  return (
    <>
      <SectionCard title="مقیاس و چگالی رابط" icon={LayoutDashboard} tone="#a855f7">
        <Row title="مقیاس کلی رابط" desc="اندازهٔ متن و کنترل‌های میزکار (متن مطالعه جداگانه در تایپوگرافی تنظیم می‌شود)" stack>
          <Slider
            value={[settings.uiScale]}
            min={0.9}
            max={1.15}
            step={0.05}
            onValueChange={(vals) => setSetting('uiScale', vals[0])}
            aria-label="مقیاس رابط کاربری"
          />
          <p className="text-center text-[10px] text-zinc-500" dir="ltr" aria-live="polite">
            {Math.round(settings.uiScale * 100)}%
          </p>
        </Row>
        <Row title="چگالی رابط" desc="فشرده = نوار عنوان پنجره‌ها و تسک‌بار باریک‌تر">
          <Pills
            value={settings.density}
            options={[
              { v: 'comfortable' as DensityKey, label: 'راحت' },
              { v: 'compact' as DensityKey, label: 'فشرده' },
            ]}
            onChange={(v) => setSetting('density', v)}
            ariaLabel="چگالی رابط"
          />
        </Row>
        <Row title="انیمیشن‌های سیستم" desc="خاموش‌کردن = حالت بی‌حرکت کامل (مثل کاهش حرکت)">
          <Switch
            checked={settings.animations}
            onCheckedChange={(v) => setSetting('animations', v)}
            aria-label="انیمیشن‌های سیستم"
          />
        </Row>
      </SectionCard>
      <SectionCard title="آیکن‌های میزکار" icon={MonitorPlay} tone="#14b8a6">
        <Row title="به‌هم‌ریختن آیکن‌ها" desc="همان‌قدر بامزه که بی‌فایده است — مال خودت">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              shuffleIcons()
              pushToast({ icon: '🎲', title: 'آیکن‌ها قاطی شدند', body: 'دنبال ترمینال بگرد! 😄' })
            }}
            className="border-white/15 text-zinc-200 hover:bg-white/10"
          >
            <Sparkles className="size-4" />
            بُر بزن
          </Button>
        </Row>
      </SectionCard>
    </>
  )
}

/* ---------------- اعلان‌ها و صدا ---------------- */

function NotificationsSection() {
  const settings = useOS((s) => s.settings)
  const setSetting = useOS((s) => s.setSetting)

  return (
    <SectionCard title="اعلان‌ها و صدا" icon={Bell} tone="#f7931e">
      <Row title="حالت سرگرم‌کننده" desc="اعلان‌های بامزهٔ تصادفی از سرویس‌های سیستم">
        <Switch checked={settings.funMode} onCheckedChange={(v) => setSetting('funMode', v)} aria-label="حالت سرگرم‌کننده" />
      </Row>
      <Row title="صدا" desc="برای بازی‌ها و اپ‌های صوتی">
        <Switch checked={settings.sound} onCheckedChange={(v) => setSetting('sound', v)} aria-label="صدا" />
      </Row>
    </SectionCard>
  )
}

/* ---------------- ترجیحات یادگیری ---------------- */

function LearningSection() {
  const settings = useOS((s) => s.settings)
  const setSetting = useOS((s) => s.setSetting)
  const [todayMin, setTodayMin] = useState<number | null>(null)

  useEffect(() => {
    const t = window.setTimeout(() => setTodayMin(Math.floor(todayReadingSeconds() / 60)), 0)
    const iv = window.setInterval(() => setTodayMin(Math.floor(todayReadingSeconds() / 60)), 10000)
    return () => {
      window.clearTimeout(t)
      window.clearInterval(iv)
    }
  }, [])

  const goal = settings.dailyGoalMin
  const pct = todayMin === null ? 0 : Math.min(100, Math.round((todayMin / goal) * 100))

  return (
    <>
      <SectionCard title="هدف روزانهٔ مطالعه" icon={Timer} tone="#14b8a6" desc="زمان مطالعه در خوانندهٔ آموزش‌ها (هر جا درس می‌خوانی) به‌صورت خصوصی روی همین دستگاه ثبت می‌شود.">
        <Row title="هدف روزانه" desc="دقیقهٔ مطالعهٔ درس در روز">
          <Pills
            value={goal}
            options={[10, 20, 30, 45, 60].map((m) => ({ v: m, label: `${m} دقیقه` }))}
            onChange={(v) => setSetting('dailyGoalMin', v)}
            ariaLabel="هدف روزانه"
          />
        </Row>
        <div className="rounded-xl border border-white/10 bg-zinc-950/40 px-3 py-3">
          <div className="mb-2 flex items-center justify-between text-[12px]">
            <span className="font-bold text-zinc-200">امروز</span>
            <span className="text-zinc-400" dir="ltr" aria-live="polite">
              {todayMin === null ? '…' : `${todayMin} / ${goal} دقیقه`}
            </span>
          </div>
          <Progress value={pct} aria-label="پیشرفت هدف روزانه" />
          {todayMin !== null && todayMin >= goal && (
            <p className="mt-2 text-[11px] font-bold text-emerald-300">هدف امروز کامل شد — دستت درد نکند! 🎉</p>
          )}
        </div>
      </SectionCard>
      <SectionCard title="نمایش راهنماها" icon={BookOpenCheck} tone="#a855f7">
        <Row title="راهنمای آموزشی" desc="جعبه‌های نکته و راهنما داخل خوانندهٔ درس‌ها دیده شوند">
          <Switch checked={settings.showGuides} onCheckedChange={(v) => setSetting('showGuides', v)} aria-label="نمایش راهنماها" />
        </Row>
        <p className="text-[11px] leading-5 text-zinc-500">
          اندازهٔ قلم و عرض مطالعهٔ درس‌ها در بخش «تایپوگرافی و مطالعه» تنظیم می‌شود و روی همهٔ آکادمی‌ها اعمال است.
        </p>
      </SectionCard>
      <SectionCard title="مربی سنجاب" icon={GraduationCap} tone="#14b8a6" desc="دستیار هوشمند یادگیری با حالت‌های توضیح، سقراطی، سرنخ، دیباگ و آزمون. کلید API هرگز ارسال نمی‌شود و خاموش‌کردن کامل ممکن است.">
        <Row title="مربی فعال باشد؟" desc="اپ «مربی سنجاب» در منو ظاهر شود — همهٔ بخش‌های آموزشی بدون مربی هم کامل کار می‌کنند">
          <Switch checked={settings.coachEnabled} onCheckedChange={(v) => setSetting('coachEnabled', v)} aria-label="فعال بودن مربی سنجاب" />
        </Row>
        <p className="text-[11px] leading-5 text-zinc-500">
          سقف مصرف: ۴۰ پیام در روز. حالت Quiz Me مربی کاملاً آفلاین است و حتی بدون هوش‌یار کار می‌کند.
        </p>
      </SectionCard>
    </>
  )
}

/* ---------------- هوش مصنوعی ---------------- */

function AiSection() {
  const pushToast = useOS((s) => s.pushToast)
  const [hasKey] = useState<boolean | null>(() => {
    try {
      return !!localStorage.getItem('sanjab-integrations')
    } catch {
      return false
    }
  })

  return (
    <SectionCard
      title="هوش‌یار — موتور هوش مصنوعی سان‌جاب‌اواس"
      icon={Bot}
      tone="#22c55e"
      desc="هوش‌یار با کلید شخصی خودت کار می‌کند؛ کلید فقط در مرورگر خودت می‌ماند و در پشتیبان‌گیری عمداً کنار گذاشته می‌شود. پریست آمادهٔ GLM (چی‌پو) هم در تنظیمات هوش‌یار هست."
    >
      <Row title="وضعیت کلید" desc={hasKey === null ? 'در حال بررسی…' : hasKey ? 'کلید ثبت شده است' : 'هنوز کلیدی ثبت نشده'}>
        {hasKey === null ? (
          <Loader2 className="size-4 animate-spin text-zinc-500" aria-hidden />
        ) : hasKey ? (
          <CheckCircle2 className="size-5 text-emerald-400" aria-label="کلید ثبت شده" />
        ) : (
          <XCircle className="size-5 text-amber-400" aria-label="بدون کلید" />
        )}
      </Row>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          onClick={() => {
            launch('ai-chat')
            pushToast({ icon: '🤖', title: 'هوش‌یار باز شد', body: 'از منوی چرخ‌دنده کلید و پریست GLM را تنظیم کن' })
          }}
          className="bg-emerald-600 text-white hover:bg-emerald-500"
        >
          <Bot className="size-4" />
          بازکردن هوش‌یار
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            launch('idea-generator')
          }}
          className="border-white/15 text-zinc-200 hover:bg-white/10"
        >
          <Sparkles className="size-4" />
          بخش ایده‌ها
        </Button>
      </div>
    </SectionCard>
  )
}

/* ---------------- حریم خصوصی و داده ---------------- */

function PrivacySection() {
  const pushToast = useOS((s) => s.pushToast)
  const settingsFileRef = useRef<HTMLInputElement>(null)
  const progressFileRef = useRef<HTMLInputElement>(null)
  const backupFileRef = useRef<HTMLInputElement>(null)

  return (
    <>
      <SectionCard title="خروجی و ورودی تنظیمات" icon={Download} tone="#22c55e" desc="تنظیمات (ظاهر، تایپوگرافی، دسترس‌پذیری…) در یک فایل JSON — بدون هیچ دادهٔ خصوصی.">
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() => {
              const ok = downloadSettings()
              pushToast({
                icon: '⚙️',
                title: ok ? 'تنظیمات خروجی گرفته شد' : 'خروجی ناموفق',
                body: ok ? 'فایل JSON دانلود شد' : 'مرورگرت اجازه نداد',
              })
            }}
            className="bg-emerald-600 text-white hover:bg-emerald-500"
          >
            <Download className="size-4" />
            خروجی تنظیمات
          </Button>
          <Button size="sm" variant="outline" onClick={() => settingsFileRef.current?.click()} className="border-white/15 text-zinc-200 hover:bg-white/10">
            <Upload className="size-4" />
            ورود تنظیمات
          </Button>
          <input
            ref={settingsFileRef}
            type="file"
            accept="application/json"
            className="hidden"
            aria-label="انتخاب فایل تنظیمات"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              const res = await importSettingsFromFile(file)
              pushToast({
                icon: res.ok ? '✅' : '❌',
                title: res.ok ? 'تنظیمات اعمال شد' : 'ورود ناموفق',
                body: res.ok ? `${res.count} تنظیم برگشت — بدون ری‌استارت` : (res.error ?? 'خطای ناشناخته'),
              })
              e.target.value = ''
            }}
          />
        </div>
      </SectionCard>

      <SectionCard title="پشتیبان‌گیری داده‌های آموزشی" icon={BookOpenCheck} tone="#14b8a6" desc="پیشرفت درس‌ها، رکورد بازی‌ها و فایل‌سیستم مجازی؛ کلیدهای API داخلش نمی‌آیند.">
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() => {
              const ok = downloadBackup(false)
              pushToast({
                icon: '💾',
                title: ok ? 'پشتیبان ساخته شد' : 'پشتیبان‌گیری ناموفق',
                body: ok ? 'فایل JSON دانلود شد (امن)' : 'مرورگرت اجازه دانلود نداد',
              })
            }}
            className="bg-teal-600 text-white hover:bg-teal-500"
          >
            <Download className="size-4" />
            پشتیبان کامل
          </Button>
          <Button size="sm" variant="outline" onClick={() => backupFileRef.current?.click()} className="border-white/15 text-zinc-200 hover:bg-white/10">
            <Upload className="size-4" />
            بازیابی پشتیبان
          </Button>
          <input
            ref={backupFileRef}
            type="file"
            accept="application/json"
            className="hidden"
            aria-label="انتخاب فایل پشتیبان"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              const res = await restoreFromFile(file)
              pushToast({
                icon: res.ok ? '✅' : '❌',
                title: res.ok ? 'بازیابی انجام شد' : 'بازیابی ناموفق',
                body: res.ok ? `${res.count} کلید برگشت — برای اعمال کامل، سیستم را ری‌استارت کن` : (res.error ?? 'خطای ناشناخته'),
              })
              e.target.value = ''
            }}
          />
        </div>
        <p className="text-[10px] leading-4 text-zinc-500">می‌خواهی فقط پیشرفت درس‌ها را جابه‌جا کنی؟ خروجی سبکِ پیشرفت همین پایین است.</p>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const ok = downloadProgress()
              pushToast({
                icon: '🎓',
                title: ok ? 'پیشرفت خروجی گرفت' : 'خروجی ناموفق',
                body: ok ? 'فقط داده‌های یادگیری — سبک و تمیز' : 'مرورگرت اجازه نداد',
              })
            }}
            className="border-white/15 text-zinc-200 hover:bg-white/10"
          >
            <Download className="size-4" />
            خروجی پیشرفت آموزشی
          </Button>
          <Button size="sm" variant="outline" onClick={() => progressFileRef.current?.click()} className="border-white/15 text-zinc-200 hover:bg-white/10">
            <Upload className="size-4" />
            ورود پیشرفت آموزشی
          </Button>
          <input
            ref={progressFileRef}
            type="file"
            accept="application/json"
            className="hidden"
            aria-label="انتخاب فایل پیشرفت"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              const { importProgressFromString } = await import('@/lib/os/settings-io')
              const res = importProgressFromString(await file.text())
              pushToast({
                icon: res.ok ? '✅' : '❌',
                title: res.ok ? 'پیشرفت برگشت' : 'ورود ناموفق',
                body: res.ok ? `${res.count} کلید بازیابی شد` : (res.error ?? 'خطای ناشناخته'),
              })
              e.target.value = ''
            }}
          />
        </div>
      </SectionCard>

      <SectionCard title="منطقهٔ خطر" icon={Trash2} tone="#f43f5e" desc="بازنشانی ظاهر و تنظیمات، داده‌های آموزشی را پاک نمی‌کند — دو چیز جدا هستند.">
        <div className="flex flex-wrap gap-2">
          <ConfirmButton
            label="بازنشانی تنظیمات سیستم"
            confirmLabel="مطمئنی؟ کلیک دوم = بازنشانی"
            icon={RotateCcw}
            onConfirm={() => {
              resetAllSettings()
              pushToast({ icon: '♻️', title: 'تنظیمات برگشت', body: 'ظاهر و تایپوگرافی مثل روز اول شد؛ پیشرفت درس‌ها سالم است' })
            }}
          />
          <ConfirmButton
            label="حذف داده‌های آموزشی"
            confirmLabel="مطمئنی؟ کلیک دوم = حذف پیشرفت"
            icon={Eraser}
            onConfirm={() => {
              const n = resetLearningData()
              pushToast({ icon: '🧹', title: 'داده‌های آموزشی پاک شدند', body: `${n} کلید حذف شد — پیشرفت از صفر شروع می‌شود` })
            }}
          />
          <ConfirmButton
            label="پاک‌کردن رکوردهای بازی‌ها"
            confirmLabel="مطمئنی؟ کلیک دوم = پاک‌کردن رکوردها"
            icon={Trash2}
            onConfirm={() => {
              try {
                const doomed: string[] = []
                for (let i = 0; i < localStorage.length; i++) {
                  const key = localStorage.key(i)
                  if (key && (key.startsWith('pengo-best-') || key === 'pengo-best-memory')) doomed.push(key)
                }
                doomed.forEach((key) => localStorage.removeItem(key))
                pushToast({ icon: '🧹', title: 'رکوردها پاک شدند', body: 'تاریخ از نو نوشته می‌شود!' })
              } catch {
                pushToast({ icon: '😬', title: 'پاک نشد', body: 'مرورگرت جلوی جاروی ما را گرفت' })
              }
            }}
          />
        </div>
      </SectionCard>
    </>
  )
}

/* ---------------- ذخیره‌سازی و کارایی ---------------- */

function StorageSection() {
  const pushToast = useOS((s) => s.pushToast)
  const [usage, setUsage] = useState<UsageReport | null>(null)
  const [quota, setQuota] = useState<string | null>(null)

  useEffect(() => {
    const t = window.setTimeout(() => {
      setUsage(usageReport())
      if (navigator.storage?.estimate) {
        navigator.storage
          .estimate()
          .then((est) => setQuota(`${fmtBytes(est.usage ?? 0)} از ${fmtBytes(est.quota ?? 0)}`))
          .catch(() => setQuota(null))
      }
    }, 0)
    return () => window.clearTimeout(t)
  }, [])

  return (
    <>
      <SectionCard title="ذخیره‌سازی مرورگر" icon={HardDrive} tone="#a855f7" desc="همه‌چیز محلی است؛ هیچ داده‌ای روی سرور ذخیره نمی‌شود.">
      <Row title="داده‌های سان‌جاب‌اواس" desc={usage ? `${fmtBytes(usage.appBytes)} در ${usage.keyCount} کلید` : 'در حال محاسبه…'}>
        <Badge variant="outline" className="border-white/15 text-zinc-300" dir="ltr">
          localStorage
        </Badge>
      </Row>
      <Row title="سهمیهٔ کل مرورگر" desc={quota ? `استفاده‌شده: ${quota}` : 'در حال بررسی…'}>
        <Badge variant="outline" className="border-white/15 text-zinc-300" dir="ltr">
          quota
        </Badge>
      </Row>
    </SectionCard>
    <SectionCard title="پاک‌سازی کش‌های غیرحیاتی" icon={Eraser} tone="#f43f5e">
      <Row title="Cache و Session" desc="کش مرورگر (Cache API) و حافظهٔ نشست پاک می‌شود؛ تنظیمات و پیشرفت دست‌نخورده می‌مانند">
        <Button
          size="sm"
          variant="outline"
          onClick={async () => {
            let n = 0
            try {
              if (typeof caches !== 'undefined') {
                const keys = await caches.keys()
                await Promise.all(keys.map((k) => caches.delete(k)))
                n += keys.length
              }
              sessionStorage.clear()
              pushToast({ icon: '🧽', title: 'کش‌ها پاک شدند', body: `${n} کش + session — سیستم سبک‌تر شد` })
            } catch {
              pushToast({ icon: '😬', title: 'پاک‌سازی ناموفق', body: 'مرورگرت اجازه نداد' })
            }
          }}
          className="border-rose-500/40 text-rose-300 hover:bg-rose-500/10"
        >
          <Eraser className="size-4" />
          پاک‌سازی
        </Button>
      </Row>
    </SectionCard>
    </>
  )
}

/* ---------------- میان‌برها ---------------- */

const SHORTCUTS: { keys: string; desc: string }[] = [
  { keys: 'Ctrl + Alt + T', desc: 'بازکردن ترمینال (مثل لینوکس واقعی)' },
  { keys: 'Ctrl + Alt + L', desc: 'قفل‌کردن صفحه' },
  { keys: 'Ctrl + Alt + S', desc: 'بازکردن تنظیمات' },
  { keys: 'Esc', desc: 'بستن منوی شروع و منوی راست‌کلیک' },
  { keys: 'Tab', desc: 'تکمیل خودکار دستور در ترمینال آموزشی' },
  { keys: 'Ctrl + Enter', desc: 'اجرای کد در استودیو کد و بازیگاه راست' },
]

function ShortcutsSection() {
  return (
    <SectionCard title="کلیدهای میان‌بر سراسری" icon={Keyboard} tone="#38bdf8" desc="همهٔ میان‌برهای واقعی سیستم — در ترمینال و اپ‌های کدنویسی هم میان‌برهای محلی داریم.">
      <div className="overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="bg-white/5 text-zinc-300">
              <th className="px-3 py-2 text-start font-bold">کلیدها</th>
              <th className="px-3 py-2 text-start font-bold">کار</th>
            </tr>
          </thead>
          <tbody>
            {SHORTCUTS.map((s) => (
              <tr key={s.keys} className="border-t border-white/5">
                <td className="px-3 py-2">
                  <kbd dir="ltr" className="ltr-inline rounded-md border border-white/15 bg-zinc-950 px-2 py-0.5 font-mono text-[11px] text-amber-200">
                    {s.keys}
                  </kbd>
                </td>
                <td className="px-3 py-2 text-zinc-300">{s.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  )
}

/* ---------------- توسعه‌دهنده ---------------- */

function FpsMeter() {
  const [fps, setFps] = useState<number | null>(null)
  useEffect(() => {
    let raf = 0
    let frames = 0
    let last = performance.now()
    let alive = true
    const loop = (t: number) => {
      frames++
      if (t - last >= 1000) {
        setFps(Math.round((frames * 1000) / (t - last)))
        frames = 0
        last = t
      }
      if (alive) raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      alive = false
      cancelAnimationFrame(raf)
    }
  }, [])
  return <span dir="ltr">{fps === null ? '…' : `${fps} FPS`}</span>
}

function ApiHealthRows() {
  const [rows, setRows] = useState<{ name: string; status: string; ms: number }[] | null>(null)
  useEffect(() => {
    let alive = true
    const check = async (name: string, url: string) => {
      const t0 = performance.now()
      try {
        const r = await fetch(url)
        return { name, status: `HTTP ${r.status}`, ms: Math.round(performance.now() - t0) }
      } catch {
        return { name, status: 'ناموفق', ms: Math.round(performance.now() - t0) }
      }
    }
    Promise.all([check('GET /api', '/api'), check('GET /api/scores', '/api/scores')]).then((r) => {
      if (alive) setRows(r)
    })
    return () => {
      alive = false
    }
  }, [])
  if (!rows) {
    return (
      <p className="flex items-center gap-1.5 text-[11px] text-zinc-500">
        <Loader2 className="size-3.5 animate-spin" aria-hidden /> در حال پینگ…
      </p>
    )
  }
  return (
    <ul className="space-y-1" dir="ltr">
      {rows.map((r) => (
        <li key={r.name} className="flex items-center justify-between text-[11px] text-zinc-300">
          <span className="font-mono">{r.name}</span>
          <span className={r.status.includes('200') ? 'text-emerald-400' : 'text-amber-400'}>
            {r.status} · {r.ms}ms
          </span>
        </li>
      ))}
    </ul>
  )
}

function DeveloperSection() {
  const settings = useOS((s) => s.settings)
  const setSetting = useOS((s) => s.setSetting)
  const pushToast = useOS((s) => s.pushToast)
  const [logs, setLogs] = useState(getDevLogs())
  const [fonts, setFonts] = useState(fontStatusReport())

  useEffect(() => {
    const iv = window.setInterval(() => {
      setLogs(getDevLogs())
      setFonts(fontStatusReport())
    }, 2000)
    return () => window.clearInterval(iv)
  }, [])

  if (!settings.devMode) {
    return (
      <SectionCard title="حالت توسعه‌دهنده" icon={SquareTerminal} tone="#38bdf8" desc="وضعیت فنی سیستم، لاگ‌ها، پرچم‌های ویژگی و ابزارهای عیب‌یابی. هیچ دادهٔ خصوصی یا کلیدی نمایش داده نمی‌شود.">
        <Row title="فعال‌سازی" desc="هر وقت خواستی از همین‌جا خاموشش کن">
          <Switch checked={false} onCheckedChange={(v) => v && setSetting('devMode', true)} aria-label="فعال‌سازی حالت توسعه‌دهنده" />
        </Row>
      </SectionCard>
    )
  }

  const env = typeof navigator !== 'undefined' ? navigator : null
  const mem = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory

  return (
    <>
      <SectionCard title="وضعیت فعال" icon={SquareTerminal} tone="#38bdf8" desc="لاگ‌ها فقط پیام‌های فنی را نگه می‌دارند؛ محتوای حساس پیش از ثبت پاک می‌شود.">
        <Row title="خاموش‌کردن حالت توسعه‌دهنده">
          <Switch checked onCheckedChange={(v) => !v && setSetting('devMode', false)} aria-label="خاموش‌کردن حالت توسعه‌دهنده" />
        </Row>
        <Row title="Logهای داخلی" desc={`${logs.length} رویداد اخیر`}>
          <Button size="sm" variant="outline" onClick={() => { clearDevLogs(); setLogs([]) }} className="border-white/15 text-zinc-200 hover:bg-white/10">
            <Eraser className="size-4" />
            پاک‌کردن
          </Button>
        </Row>
        <div className="max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-zinc-950/70 p-2 font-mono text-[10.5px] leading-5" dir="ltr">
          {logs.length === 0 && <p className="text-zinc-600">no logs yet</p>}
          {logs.map((l) => (
            <p key={l.id} className="truncate">
              <span className={l.level === 'error' ? 'text-rose-400' : l.level === 'warn' ? 'text-amber-300' : 'text-sky-400'}>
                [{l.level}]
              </span>{' '}
              <span className="text-zinc-400">{new Date(l.at).toLocaleTimeString('en-GB')}</span>{' '}
              <span className="text-zinc-300">{l.msg}</span>
              {l.src ? <span className="text-zinc-600"> ({l.src})</span> : null}
            </p>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="نسخه‌ها و Runtimeها" icon={Cpu} tone="#a855f7">
        <Row title={`سان‌جاب‌اواس ${OS_VERSION}`} desc={`کد‌نام: «${OS_CODENAME}»`}>
          <Badge className="bg-amber-400 text-zinc-950" dir="ltr">
            v{OS_VERSION}
          </Badge>
        </Row>
        {RUNTIMES.map((r) => (
          <Row key={r.name} title={r.name}>
            <span dir="ltr" className="font-mono text-[11px] text-zinc-400">
              {r.version}
            </span>
          </Row>
        ))}
      </SectionCard>

      <SectionCard title="سرویس‌ها و کارایی" icon={Gauge} tone="#14b8a6">
        <Row title="APIهای داخلی">
          <ApiHealthRows />
        </Row>
        <Row title="Web Worker" desc={typeof Worker === 'undefined' ? 'پشتیبانی نمی‌شود' : 'پشتیبانی می‌شود (استودیو کد)'}>
          <Badge variant="outline" className={typeof Worker === 'undefined' ? 'border-amber-400/40 text-amber-300' : 'border-emerald-400/40 text-emerald-300'} dir="ltr">
            {typeof Worker ? 'OK' : 'NO'}
          </Badge>
        </Row>
        <Row title="نرخ فریم رابط">
          <FpsMeter />
        </Row>
        <Row title="حافظهٔ JS" desc={mem ? `${Math.round(mem.usedJSHeapSize / 1024)} KB` : 'در این مرورگر گزارش نمی‌شود'}>
          <Badge variant="outline" className="border-white/15 text-zinc-300" dir="ltr">
            heap
          </Badge>
        </Row>
        <Row title="IndexedDB / LocalStorage" desc={`${typeof indexedDB !== 'undefined' ? 'موجود' : 'غایب'} / ${typeof localStorage !== 'undefined' ? 'موجود' : 'غایب'}`}>
          <Badge variant="outline" className="border-white/15 text-zinc-300" dir="ltr">
            storage
          </Badge>
        </Row>
      </SectionCard>

      <SectionCard title="وضعیت فونت‌ها" icon={Type} tone="#f7931e" desc="باید همه «بارگذاری شد» باشند — وگرنه فونت جایگزین نمایش داده می‌شود.">
        {fonts.map((f) => (
          <Row key={f.family} title={f.family} desc={f.loaded ? 'بارگذاری شد' : 'هنوز بارگذاری نشده'}>
            {f.loaded ? <CheckCircle2 className="size-5 text-emerald-400" aria-label="بارگذاری شد" /> : <XCircle className="size-5 text-amber-400" aria-label="بارگذاری نشده" />}
          </Row>
        ))}
      </SectionCard>

      <SectionCard title="پرچم‌های ویژگی" icon={Sparkles} tone="#22c55e" desc="فهرست واقعی قابلیت‌های سیستم؛ موارد «آزمایشی» ممکن است تغییر کنند.">
        {FEATURE_FLAGS.map((f) => (
          <Row key={f.key} title={f.label} desc={f.experimental ? 'قابلیت آزمایشی' : 'پایدار'}>
            <Badge className={f.on ? 'bg-emerald-600 text-white' : 'bg-zinc-700 text-zinc-300'} dir="ltr">
              {f.on ? 'ON' : 'OFF'}
            </Badge>
          </Row>
        ))}
      </SectionCard>

      <SectionCard title="محیط اجرا و گزارش فنی" icon={Info} tone="#38bdf8" desc="گزارش برای ارسال به تیم توسعه — کلیدها و داده‌های شخصی داخلش نیستند.">
        <Row title="محیط" desc={env ? `${env.platform ?? '?'} · ${env.language} · ${env.onLine ? 'آنلاین' : 'آفلاین'} · ${env.hardwareConcurrency} هسته` : '—'}>
          <Badge variant="outline" className="border-white/15 text-zinc-300" dir="ltr">
            env
          </Badge>
        </Row>
        <Button
          size="sm"
          variant="outline"
          onClick={async () => {
            try {
              const report = await buildTechReport()
              await navigator.clipboard.writeText(report)
              pushToast({ icon: '📋', title: 'گزارش کپی شد', body: 'آمادهٔ پیست‌کردن برای تیم توسعه' })
            } catch {
              pushToast({ icon: '😬', title: 'کپی نشد', body: 'مرورگرت اجازهٔ کلیپ‌بورد نداد' })
            }
          }}
          className="border-white/15 text-zinc-200 hover:bg-white/10"
        >
          <Copy className="size-4" />
          کپی گزارش فنی
        </Button>
      </SectionCard>
    </>
  )
}

/* ---------------- درباره ---------------- */

function AboutSection() {
  return (
    <>
      <SectionCard title="سان‌جاب‌اواس" icon={Info} tone="#f7931e">
        <p className="text-[12px] leading-6 text-zinc-300">
          نسخه <span dir="ltr">{OS_VERSION}</span> — کد‌نام «{OS_CODENAME}»
        </p>
        <p className="text-[11.5px] leading-6 text-zinc-400">
          یک سیستم‌عامل کامل و بامزه در مرورگر: ترمینال آموزشی، پایتون، آکادمی‌های لینوکس/راست/هوش مصنوعی/پاورشل، آفیس، بازی و هوش‌یار.
        </p>
        <div className="flex flex-wrap gap-2">
          <a
            href={OS_REPO}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/15 px-3 text-[11px] font-bold text-zinc-200 transition hover:bg-white/10"
          >
            <ExternalLink className="size-3.5" aria-hidden />
            گیت‌هاب
          </a>
          <a
            href="https://sunjob.ir"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#f7931e]/40 bg-[#f7931e]/10 px-3 text-[11px] font-bold text-amber-200 transition hover:bg-[#f7931e]/20"
          >
            <img src="/brand/sunjob-logo.webp" alt="لوگوی سان‌جاب" className="h-4 w-4 rounded-sm bg-white object-contain" />
            با اسپانسری سان‌جاب
          </a>
        </div>
      </SectionCard>
      <SectionCard title="اعتبار فونت‌ها" icon={Type} tone="#a855f7" desc="همهٔ فونت‌ها محلی باندل شده‌اند و با مجوز آزاد SIL OFL 1.1 منتشر شده‌اند — جزئیات کامل در public/fonts و docs/TYPOGRAPHY-SETTINGS-UPGRADE.md">
        {FONT_OPTIONS.filter((f) => f.key !== 'system').map((f) => (
          <Row key={f.key} title={f.label} desc={`${f.designer} · ${f.license}`}>
            <Badge variant="outline" className="border-white/15 text-zinc-400" dir="ltr">
              OFL
            </Badge>
          </Row>
        ))}
        <Row title="JetBrains Mono" desc="JetBrains · SIL OFL 1.1">
          <Badge variant="outline" className="border-white/15 text-zinc-400" dir="ltr">
            OFL
          </Badge>
        </Row>
      </SectionCard>
      <SectionCard title="فناوری‌ها" icon={Cpu} tone="#14b8a6">
        {RUNTIMES.map((r) => (
          <Row key={r.name} title={r.name}>
            <span dir="ltr" className="font-mono text-[11px] text-zinc-400">
              {r.version}
            </span>
          </Row>
        ))}
      </SectionCard>
    </>
  )
}

/* ---------------- اپ اصلی ---------------- */

export default function SettingsApp() {
  const settings = useOS((s) => s.settings)
  const [cat, setCat] = useState<CatId>('typography')
  const scrollRef = useRef<HTMLDivElement>(null)

  const visible = CATEGORIES
  const active = CATEGORIES.find((c) => c.id === cat) ?? CATEGORIES[0]

  return (
    <div className="flex h-full min-h-0 w-full" dir="rtl">
      {/* ریل دسته‌بندی‌ها — در موبایل افقی */}
      <nav
        aria-label="دسته‌بندی تنظیمات"
        className="os-scroll flex shrink-0 gap-1 overflow-x-auto border-e border-white/10 bg-zinc-950/60 p-2 max-lg:absolute max-lg:inset-x-0 max-lg:top-0 max-lg:z-20 max-lg:border-b lg:w-52 lg:flex-col lg:overflow-y-auto"
      >
        {visible.map((c) => {
          const isActive = c.id === cat
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setCat(c.id)
                scrollRef.current?.scrollTo({ top: 0 })
              }}
              aria-current={isActive ? 'page' : undefined}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-2.5 py-2 text-start transition lg:w-full ${
                isActive ? 'bg-white/12 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
              }`}
              title={c.hint}
            >
              <span
                className={`grid h-6 w-6 shrink-0 place-items-center rounded-md ${isActive ? 'bg-[var(--pengo-accent)] text-zinc-950' : 'bg-white/5'}`}
                aria-hidden
              >
                <c.icon size={13} />
              </span>
              <span className="whitespace-nowrap text-[11.5px] font-bold lg:whitespace-normal">{c.label}</span>
            </button>
          )
        })}
      </nav>

      {/* محتوا */}
      <div ref={scrollRef} className="os-scroll relative min-w-0 flex-1 overflow-y-auto p-4 pt-3 max-lg:pt-14">
        <header className="mb-3">
          <h2 className="flex items-center gap-2 text-sm font-black text-zinc-50">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-[var(--pengo-accent)]/15 text-[var(--pengo-accent)]" aria-hidden>
              <active.icon size={15} />
            </span>
            {active.label}
          </h2>
          <p className="mt-0.5 text-[11px] text-zinc-500">{active.hint} — تغییرات فوری اعمال و ذخیره می‌شوند</p>
        </header>
        <div className="space-y-3 pb-6">
          {cat === 'appearance' && <AppearanceSection />}
          {cat === 'typography' && <TypographySection />}
          {cat === 'accessibility' && <AccessibilitySection />}
          {cat === 'desktop' && <DesktopSection />}
          {cat === 'notifications' && <NotificationsSection />}
          {cat === 'learning' && <LearningSection />}
          {cat === 'ai' && <AiSection />}
          {cat === 'privacy' && <PrivacySection />}
          {cat === 'storage' && <StorageSection />}
          {cat === 'shortcuts' && <ShortcutsSection />}
          {cat === 'developer' && <DeveloperSection />}
          {cat === 'about' && <AboutSection />}
        </div>
      </div>
    </div>
  )
}
