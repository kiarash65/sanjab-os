'use client'

/* ====================================================================
   «مرکز انتشار» — نسخهٔ نصب‌شده، آخرین Stable، فایل پیشنهادی هوشمند،
   تأییدکنندهٔ SHA-256 و تاریخچهٔ انتشارها. داده مستقیم از GitHub Releases.
   قواعد صادقانگی: پیش‌انتشار جدا از Stable، نوع هر فایل از نام کامل،
   هیچ فایلی بدون برچسب نوع رها نمی‌شود و نصاب لینوکسِ ناموجود ادعا نمی‌شود.
   ==================================================================== */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { motion, useReducedMotion } from 'framer-motion'
import {
  BadgeCheck,
  CircleCheck,
  CloudOff,
  Copy,
  Download,
  ExternalLink,
  FileArchive,
  FileDown,
  FileUp,
  FlaskConical,
  Globe,
  HardDrive,
  History,
  Info,
  LoaderCircle,
  Package,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Tag,
  Terminal,
  TriangleAlert,
} from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useOS } from '@/lib/os/store'
import { BRAND } from '@/lib/os/brand'
import { classifyAsset, updateState, type AssetInfo, type UpdateState } from '@/lib/os/releases'
import { Sha256, parseSums } from '@/lib/os/sha256'

/* ------------------------------- انواع ------------------------------- */

interface GhAsset {
  name: string
  size: number
  browser_download_url: string
  content_type?: string
  download_count?: number
}

interface GhRelease {
  id: number
  tag_name: string
  name: string | null
  body: string | null
  html_url: string
  published_at: string | null
  prerelease: boolean
  draft: boolean
  assets: GhAsset[]
}

interface ReleasesCache {
  t: number
  data: GhRelease[]
}

type LoadStatus = 'loading' | 'ok' | 'from-cache' | 'error'

type UserPlatform = 'windows' | 'linux' | 'mac' | 'other'

/* ------------------------------ ثابت‌ها ------------------------------ */

const RELEASES_URL = 'https://api.github.com/repos/kiarash65/sanjab-os/releases?per_page=20'
const CACHE_KEY = 'sanjab-releases-cache-v2'
const CACHE_TTL_MS = 10 * 60 * 1000
const FETCH_TIMEOUT_MS = 10_000

/* ------------------------------ کمکی‌ها ------------------------------ */

const faNum = (n: number): string => n.toLocaleString('fa-IR')

const faDate = (iso: string | null): string => {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch {
    return iso
  }
}

const humanSize = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '—'
  const mb = bytes / 1048576
  if (mb >= 1) return `${mb.toLocaleString('fa-IR', { maximumFractionDigits: 1 })} مگابایت`
  return `${(bytes / 1024).toLocaleString('fa-IR', { maximumFractionDigits: 0 })} کیلوبایت`
}

function isGhRelease(v: unknown): v is GhRelease {
  if (typeof v !== 'object' || v === null) return false
  const r = v as Record<string, unknown>
  return (
    typeof r.id === 'number' &&
    typeof r.tag_name === 'string' &&
    typeof r.html_url === 'string' &&
    Array.isArray(r.assets)
  )
}

function parseReleases(v: unknown): GhRelease[] {
  if (!Array.isArray(v)) throw new Error('ساختار پاسخ گیت‌هاب غیرمنتظره بود.')
  return v.filter(isGhRelease)
}

function loadCache(): ReleasesCache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return null
    const c = parsed as Record<string, unknown>
    if (typeof c.t !== 'number' || !Array.isArray(c.data)) return null
    const data = c.data.filter(isGhRelease)
    if (data.length === 0) return null
    return { t: c.t, data }
  } catch {
    return null
  }
}

function saveCache(data: GhRelease[]): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), data }))
  } catch {
    /* حافظه پر یا غیرفعال — مهم نیست */
  }
}

function detectPlatform(): UserPlatform {
  if (typeof navigator === 'undefined') return 'other'
  const ua = navigator.userAgent
  if (/Windows/i.test(ua)) return 'windows'
  if (/Mac/i.test(ua)) return 'mac'
  if (/Linux/i.test(ua) && !/Android/i.test(ua)) return 'linux'
  return 'other'
}

const PLATFORM_LABEL: Record<UserPlatform, string> = {
  windows: 'ویندوز',
  linux: 'لینوکس',
  mac: 'مک',
  other: 'مرورگر / موبایل',
}

/** رنگ برچسب نوع فایل — خوانا و یکدست */
const KIND_STYLE: Record<AssetInfo['kind'], string> = {
  'windows-nsis': 'border-rose-400/40 bg-rose-400/10 text-rose-300',
  'windows-msi': 'border-rose-400/40 bg-rose-400/10 text-rose-300',
  'windows-portable': 'border-amber-400/40 bg-amber-400/10 text-amber-300',
  'web-standalone': 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300',
  cli: 'border-teal-400/40 bg-teal-400/10 text-teal-300',
  sbom: 'border-cyan-400/40 bg-cyan-400/10 text-cyan-300',
  checksums: 'border-cyan-400/40 bg-cyan-400/10 text-cyan-300',
  notices: 'border-zinc-400/30 bg-zinc-400/10 text-zinc-300',
  'version-file': 'border-zinc-400/30 bg-zinc-400/10 text-zinc-300',
  unknown: 'border-zinc-500/30 bg-zinc-500/10 text-zinc-400',
}

const UPDATE_STATE_TEXT: Record<Exclude<UpdateState, 'unknown'>, { text: string; cls: string }> = {
  'up-to-date': {
    text: 'به‌روز هستی',
    cls: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300',
  },
  'update-available': {
    text: 'به‌روزرسانی Stable در دسترس',
    cls: 'border-amber-400/40 bg-amber-400/10 text-amber-300',
  },
  'prerelease-available': {
    text: 'فقط پیش‌انتشار جدید — پیشنهاد نمی‌شود',
    cls: 'border-purple-400/40 bg-purple-400/10 text-purple-300',
  },
  'newer-than-stable': {
    text: 'این نسخه از آخرین Stable جلوتر است (شاخهٔ آزمایشی)',
    cls: 'border-sky-400/40 bg-sky-400/10 text-sky-300',
  },
}

/* --------------------- SHA-256 و SHA256SUMS — از کتابخانهٔ خالص --------------------- */

/* ============================ اپ اصلی ============================ */

export default function DownloadsApp() {
  const pushToast = useOS((s) => s.pushToast)
  const reduce = useReducedMotion()

  const [releases, setReleases] = useState<GhRelease[] | null>(null)
  const [status, setStatus] = useState<LoadStatus>('loading')
  const [err, setErr] = useState('')
  const [staleWarn, setStaleWarn] = useState('')
  const [cacheAt, setCacheAt] = useState(0)
  const [platform, setPlatform] = useState<UserPlatform>('other')

  /* بارگیری اولیه */
  const load = useCallback(async (force: boolean) => {
    if (!force) {
      const c = loadCache()
      if (c && Date.now() - c.t < CACHE_TTL_MS) {
        setReleases(c.data)
        setCacheAt(c.t)
        setStatus('ok')
        setStaleWarn('')
        return
      }
    }
    setStatus('loading')
    setErr('')
    setStaleWarn('')
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS)
    try {
      const res = await fetch(RELEASES_URL, {
        headers: { Accept: 'application/vnd.github+json' },
        signal: ctrl.signal,
      })
      if (!res.ok) throw new Error(`پاسخ گیت‌هاب با کد ${res.status} برگشت.`)
      const raw: unknown = await res.json()
      const data = parseReleases(raw)
      setReleases(data)
      setStatus('ok')
      saveCache(data)
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.name === 'AbortError'
            ? 'درخواست بیش از ۱۰ ثانیه طول کشید و لغو شد.'
            : e.message
          : 'خطای ناشناخته'
      const c = loadCache()
      if (c) {
        setReleases(c.data)
        setCacheAt(c.t)
        setStatus('from-cache')
        setStaleWarn(`اتصال به گیت‌هاب برقرار نشد (${msg}) نسخهٔ ذخیره‌شدهٔ قبلی نمایش داده می‌شود.`)
      } else {
        setStatus('error')
        setErr(msg)
      }
    } finally {
      clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    void load(false)
    setPlatform(detectPlatform())
  }, [load])

  /* تفکیک Stable از پیش‌انتشار — نسخهٔ پیشنهادی فقط از بین Stableها */
  const { latestStable, stableList, prereleases } = useMemo(() => {
    const all = releases ?? []
    const stables = all.filter((r) => !r.prerelease && !r.draft)
    return {
      latestStable: stables[0] ?? null,
      stableList: stables.slice(1),
      prereleases: all.filter((r) => r.prerelease && !r.draft),
    }
  }, [releases])

  const cmp: UpdateState = useMemo(
    () => updateState(BRAND.versionEn, latestStable?.tag_name ?? null, releases?.[0]?.tag_name ?? null),
    [latestStable, releases]
  )

  /* دارایی‌های نسخهٔ پیشنهادی (آخرین Stable) */
  const assets = useMemo(
    () => (latestStable ? latestStable.assets.map((a) => ({ ...a, info: classifyAsset(a.name) })) : []),
    [latestStable]
  )

  /* فایل پیشنهادی برای پلتفرم کاربر — صادقانه: مک نصاب دسکتاپ ندارد */
  const recommended = useMemo(() => {
    switch (platform) {
      case 'windows':
        return assets.find((a) => a.info.kind === 'windows-nsis') ?? null
      case 'linux':
        return assets.find((a) => a.info.kind === 'web-standalone') ?? null
      case 'mac':
        return assets.find((a) => a.info.kind === 'cli') ?? null
      default:
        return null
    }
  }, [platform, assets])

  /* ---------- تأییدکنندهٔ SHA-256 ---------- */
  const sumsAsset = useMemo(() => assets.find((a) => a.info.kind === 'checksums') ?? null, [assets])
  const [sumsText, setSumsText] = useState<string | null>(null)
  const [sumsState, setSumsState] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle')
  const [file, setFile] = useState<File | null>(null)
  const [hashBusy, setHashBusy] = useState(false)
  const [hashProgress, setHashProgress] = useState(0)
  const [hashResult, setHashResult] = useState<{ ok: boolean; hash: string; expected: string | null } | null>(null)
  const [hashErr, setHashErr] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)

  const verifyFile = useCallback(
    async (f: File) => {
      setHashErr('')
      setHashResult(null)
      setHashBusy(true)
      setHashProgress(0)
      try {
        const sha = new Sha256()
        const CHUNK = 4 * 1024 * 1024
        let off = 0
        while (off < f.size) {
          const slice = f.slice(off, Math.min(off + CHUNK, f.size))
          const buf = new Uint8Array(await slice.arrayBuffer())
          sha.update(buf)
          off += buf.length
          setHashProgress(Math.round((off / Math.max(1, f.size)) * 100))
        }
        const digest = sha.hex()
        let expected: string | null = null
        if (sumsText) {
          const sums = parseSums(sumsText)
          expected = sums.get(f.name.toLowerCase()) ?? null
        }
        const ok = expected ? expected === digest : false
        setHashResult({ ok, hash: digest, expected })
        if (expected === null) {
          pushToast({
            icon: 'ℹ️',
            title: 'هش مرجع پیدا نشد',
            body: 'این نام فایل در SHA256SUMS نبود — هش محاسبه شد ولی مقایسه‌ای انجام نشد.',
          })
        } else if (ok) {
          pushToast({ icon: ShieldCheck, title: 'فایل سالم است ✓', body: 'امضای SHA-256 دقیقاً مطابق نسخهٔ رسمی است.' })
        } else {
          pushToast({
            icon: TriangleAlert,
            title: 'فایل سالم نیست!',
            body: 'هش فایل با نسخهٔ رسمی یکی نیست — از دانلود مجدد و گزارش مشکل مطمئن شو.',
          })
        }
      } catch (e) {
        setHashErr(e instanceof Error ? e.message : 'محاسبهٔ هش ناموفق بود.')
      } finally {
        setHashBusy(false)
        setHashProgress(0)
      }
    },
    [pushToast, sumsText]
  )

  /* دانلود متن SHA256SUMS برای مقایسه */
  const loadSums = useCallback(async () => {
    if (!sumsAsset) return
    setSumsState('loading')
    try {
      const res = await fetch(sumsAsset.browser_download_url)
      if (!res.ok) throw new Error(`کد ${res.status}`)
      const text = await res.text()
      if (text.length > 256 * 1024) throw new Error('فایل چک‌سام غیرعادی بزرگ است.')
      setSumsText(text)
      setSumsState('ok')
    } catch {
      setSumsState('err')
    }
  }, [sumsAsset])

  useEffect(() => {
    if (sumsAsset && sumsState === 'idle') void loadSums()
  }, [sumsAsset, sumsState, loadSums])

  const copySums = useCallback(async () => {
    if (!sumsText) return
    try {
      await navigator.clipboard.writeText(sumsText)
      pushToast({ icon: Copy, title: 'چک‌سام‌ها کپی شد', body: 'برای مقایسهٔ دستی در کلیپ‌بورد است.' })
    } catch {
      pushToast({ icon: '⚠️', title: 'کپی نشد', body: 'دسترسی کلیپ‌بورد داده نشد.' })
    }
  }, [sumsText, pushToast])

  const updateBadge = cmp === 'unknown' ? null : UPDATE_STATE_TEXT[cmp]

  return (
    <div className="os-scroll h-full w-full overflow-y-auto bg-zinc-950">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 p-4">
        {/* ---------------------------- سربرگ ---------------------------- */}
        <FadeIn reduce={reduce}>
          <header className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-l from-emerald-400/10 via-amber-400/10 to-rose-400/10 p-4">
            <div className="flex items-center gap-3">
              <span
                className="grid size-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-emerald-400 to-amber-500 text-white shadow-lg shadow-emerald-500/20"
                aria-hidden
              >
                <Download size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-black text-zinc-100">مرکز انتشار</h2>
                <p className="mt-0.5 text-[10.5px] leading-5 text-zinc-400">
                  نسخهٔ نصب‌شده، آخرین Stable و فایل پیشنهادی سیستم تو — مستقیم از گیت‌هاب
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="shrink-0"
                onClick={() => void load(true)}
                disabled={status === 'loading'}
                aria-label="بارگیری دوباره فهرست انتشارها"
              >
                <RefreshCw className={`size-4 ${status === 'loading' ? 'animate-spin' : ''}`} aria-hidden />
                <span className="hidden sm:inline">بازخوانی</span>
              </Button>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-zinc-900/80 px-2.5 py-1 text-[10.5px] font-bold text-zinc-300">
                <Tag size={12} className="text-amber-300" aria-hidden />
                نسخهٔ نصب‌شده: <span dir="ltr" className="font-mono">{BRAND.versionEn}</span>
              </span>
              {platform !== 'other' && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-zinc-900/80 px-2.5 py-1 text-[10.5px] font-bold text-zinc-300">
                  <HardDrive size={12} className="text-teal-300" aria-hidden />
                  سیستم تو: {PLATFORM_LABEL[platform]}
                </span>
              )}
              {status !== 'loading' && updateBadge && (
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10.5px] font-black ${updateBadge.cls}`}>
                  {cmp === 'up-to-date' && <CircleCheck size={12} aria-hidden />}
                  {cmp !== 'up-to-date' && <Info size={12} aria-hidden />}
                  {updateBadge.text}
                  {cmp === 'update-available' && latestStable ? ` — ${latestStable.tag_name}` : ''}
                </span>
              )}
            </div>

            {status === 'from-cache' && staleWarn && (
              <p className="mt-2 flex items-start gap-1.5 rounded-xl border border-amber-400/30 bg-amber-400/10 p-2.5 text-[10.5px] leading-5 text-amber-200">
                <CloudOff className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                <span className="min-w-0">{staleWarn}</span>
              </p>
            )}
          </header>
        </FadeIn>

        {/* ---------------------------- وضعیت‌ها ---------------------------- */}
        {status === 'loading' && <SkeletonList />}

        {status === 'error' && (
          <div
            role="alert"
            className="flex flex-col items-start gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-[11px] leading-5 text-rose-300"
          >
            <span className="flex items-center gap-1.5 font-black">
              <TriangleAlert size={13} aria-hidden />
              دریافت فهرست انتشارها ناموفق بود
            </span>
            <span className="text-rose-200/80">{err}</span>
            <span className="text-rose-200/60">
              اتصال اینترنت را بررسی کن؛ اگر فیلترشکن داری، مطمئن شو api.github.com در دسترس است.
            </span>
            <Button size="sm" variant="outline" onClick={() => void load(true)}>
              <RefreshCw className="size-4" aria-hidden />
              تلاش دوباره
            </Button>
          </div>
        )}

        {latestStable && (
          <>
            {/* ---------------- فایل پیشنهادی برای سیستم تو ---------------- */}
            <FadeIn reduce={reduce}>
              <section className="rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.06] p-4">
                <p className="flex items-center gap-1.5 text-[11px] font-black text-emerald-200">
                  <Sparkles size={13} aria-hidden />
                  پیشنهاد برای سیستم تو ({PLATFORM_LABEL[platform]})
                </p>
                {platform === 'other' ? (
                  <p className="mt-2 text-[10.5px] leading-5 text-emerald-200/80">
                    برای موبایل و تبلت، نسخهٔ مرورگر همین سایت بهترین گزینه است — چیزی برای نصب نیست.
                  </p>
                ) : recommended ? (
                  <div className="mt-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-zinc-900/70 px-2.5 py-1 text-[10.5px] font-bold text-zinc-200">
                        <Package size={12} className="text-emerald-300" aria-hidden />
                        {recommended.info.label}
                      </span>
                      <span dir="ltr" className="min-w-0 truncate font-mono text-[10.5px] text-zinc-300">{recommended.name}</span>
                      <span className="text-[10px] text-zinc-500">{humanSize(recommended.size)}</span>
                    </div>
                    <p className="mt-1.5 text-[10.5px] leading-5 text-zinc-400">{recommended.info.purpose}</p>
                    <a
                      href={recommended.browser_download_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2.5 inline-flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-l from-emerald-500 to-teal-500 px-4 text-[11.5px] font-black text-white shadow-lg transition hover:brightness-110"
                    >
                      <Download size={14} aria-hidden />
                      دانلود نسخهٔ پیشنهادی
                    </a>
                    {platform === 'mac' && (
                      <p className="mt-2 flex items-start gap-1.5 rounded-xl border border-amber-400/30 bg-amber-400/10 p-2.5 text-[10.5px] leading-5 text-amber-200">
                        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                        برای مک فعلاً نصاب دسکتاپ منتشر نمی‌شود — ابزار CLI و نسخهٔ وب در دسترس‌اند. این محدودیت صادقانه است، نه وعدهٔ ساختگی.
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="mt-2 text-[10.5px] leading-5 text-amber-200/90">
                    برای این پلتفرم در آخرین Stable فایلی منتشر نشده — فهرست کامل فایل‌ها پایین‌تر است.
                  </p>
                )}
              </section>
            </FadeIn>

            {/* ---------------- تأیید صحت فایل (SHA-256) ---------------- */}
            <FadeIn reduce={reduce}>
              <section className="rounded-2xl border border-cyan-400/25 bg-cyan-400/[0.05] p-4">
                <p className="flex items-center gap-1.5 text-[11px] font-black text-cyan-200">
                  <ShieldCheck size={13} aria-hidden />
                  تأیید سلامت فایل دانلودشده (SHA-256)
                </p>
                <p className="mt-1.5 text-[10.5px] leading-5 text-zinc-400">
                  فایل دانلودشده را انتخاب کن تا هش آن «روی همین دستگاه» محاسبه و با SHA256SUMS نسخهٔ رسمی مقایسه شود.
                  هیچ فایلی به هیچ سروری فرستاده نمی‌شود.
                </p>
                <p className="mt-1 text-[10px] leading-4 text-zinc-500">
                  تفاوت: «چک‌سام» سلامت فایل را در برابر خرابی/دستکاری بررسی می‌کند؛ «امضای دیجیتال ناشر» هنوز برای نصاب‌های
                  سان‌جاب منتشر نشده و به‌محض فعال شدن همان‌جا اعلام می‌شود.
                </p>

                <input
                  ref={fileInput}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null
                    setFile(f)
                    if (f) void verifyFile(f)
                  }}
                  aria-label="انتخاب فایل برای تأیید هش"
                />
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-cyan-400/40 text-cyan-200 hover:bg-cyan-400/15"
                    onClick={() => fileInput.current?.click()}
                    disabled={hashBusy}
                  >
                    <FileUp size={14} aria-hidden />
                    {file ? 'انتخاب فایل دیگر' : 'انتخاب فایل…'}
                  </Button>
                  {file && !hashBusy && !hashResult && <span dir="ltr" className="font-mono text-[10.5px] text-zinc-400">{file.name}</span>}
                  {hashBusy && (
                    <span className="flex min-w-40 flex-1 items-center gap-2">
                      <LoaderCircle size={13} className="shrink-0 animate-spin text-cyan-300" aria-hidden />
                      <Progress value={hashProgress} className="h-1.5 flex-1" aria-label="پیشرفت محاسبهٔ هش" />
                      <span className="text-[10px] text-cyan-200">{faNum(hashProgress)}٪</span>
                    </span>
                  )}
                </div>

                {hashErr && (
                  <p role="alert" className="mt-2 rounded-lg border border-rose-400/30 bg-rose-400/10 p-2 text-[10.5px] text-rose-300">
                    {hashErr}
                  </p>
                )}

                {hashResult && (
                  <div className="mt-2.5 space-y-1.5">
                    {hashResult.expected === null ? (
                      <p className="flex items-start gap-1.5 rounded-lg border border-amber-400/30 bg-amber-400/10 p-2 text-[10.5px] leading-5 text-amber-200">
                        <Info size={12} className="mt-0.5 shrink-0" aria-hidden />
                        نام این فایل در SHA256SUMS نسخهٔ فعلی نیست (شاید از نسخهٔ قدیمی‌تری دانلود شده).
                      </p>
                    ) : hashResult.ok ? (
                      <p className="flex items-center gap-1.5 rounded-lg border border-emerald-400/40 bg-emerald-400/10 p-2 text-[11px] font-black text-emerald-300">
                        <BadgeCheck size={14} aria-hidden />
                        سالم است — هش دقیقاً مطابق نسخهٔ رسمی
                      </p>
                    ) : (
                      <p className="flex items-center gap-1.5 rounded-lg border border-rose-400/40 bg-rose-400/10 p-2 text-[11px] font-black text-rose-300">
                        <TriangleAlert size={14} aria-hidden />
                        هش مطابقت ندارد! این فایل یا خراب دانلود شده یا دستکاری شده — هرگز اجرایش نکن.
                      </p>
                    )}
                    <div className="rounded-lg border border-white/10 bg-zinc-950/70 p-2" dir="ltr">
                      <p className="font-mono text-[9.5px] leading-4 text-zinc-400 break-all">{hashResult.hash}</p>
                      {hashResult.expected && (
                        <p className="mt-1 font-mono text-[9.5px] leading-4 text-zinc-600 break-all">expected: {hashResult.expected}</p>
                      )}
                    </div>
                  </div>
                )}

                {sumsAsset && (
                  <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-white/10 pt-2.5">
                    <span className="text-[10px] text-zinc-500">
                      مرجع: <span dir="ltr" className="font-mono">{sumsAsset.name}</span>
                      {sumsState === 'ok' && ' — بارگیری شد ✓'}
                      {sumsState === 'err' && ' — بارگیری نشد'}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-[10px] text-cyan-300"
                      onClick={() => void loadSums()}
                      disabled={sumsState === 'loading'}
                    >
                      <RefreshCw size={10} aria-hidden />
                      دوباره
                    </Button>
                    <Button size="sm" variant="ghost" className="h-6 text-[10px] text-cyan-300" onClick={() => void copySums()} disabled={!sumsText}>
                      <Copy size={10} aria-hidden />
                      کپی
                    </Button>
                  </div>
                )}
              </section>
            </FadeIn>

            {/* ---------------- کارت آخرین Stable ---------------- */}
            <FadeIn reduce={reduce}>
              <ReleaseCard release={latestStable} assets={assets} highlight />
            </FadeIn>

            {/* ---------------- پیش‌انتشارها — جدا و شفاف ---------------- */}
            {prereleases.length > 0 && (
              <FadeIn reduce={reduce}>
                <section className="overflow-hidden rounded-2xl border border-purple-400/25 bg-purple-400/[0.05]">
                  <p className="flex items-center gap-1.5 border-b border-white/10 px-4 py-2.5 text-[10.5px] font-black text-purple-300">
                    <FlaskConical size={12} aria-hidden />
                    پیش‌انتشارها ({faNum(prereleases.length)}) — برای آزمایش؛ به کاربران عادی پیشنهاد نمی‌شود
                  </p>
                  {prereleases.map((r) => (
                    <a
                      key={r.id}
                      href={r.html_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex flex-wrap items-center gap-2 px-4 py-2.5 text-[10.5px] transition hover:bg-purple-400/10"
                    >
                      <span dir="ltr" className="shrink-0 font-mono font-bold text-purple-200">{r.tag_name}</span>
                      <span className="min-w-0 flex-1 truncate text-zinc-500">{r.name ?? ''}</span>
                      <span className="shrink-0 text-zinc-500">{faDate(r.published_at)}</span>
                      <ExternalLink size={11} className="shrink-0 text-zinc-600" aria-hidden />
                    </a>
                  ))}
                </section>
              </FadeIn>
            )}

            {/* ---------------- نسخه‌های پیشین ---------------- */}
            {stableList.length > 0 && (
              <FadeIn reduce={reduce}>
                <section className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60">
                  <p className="flex items-center gap-1.5 border-b border-white/10 bg-zinc-900/80 px-4 py-2.5 text-[10.5px] font-black text-zinc-400">
                    <History size={12} className="text-sky-300" aria-hidden />
                    نسخه‌های پیشین Stable ({faNum(stableList.length)} انتشار)
                  </p>
                  {stableList.map((r, i) => {
                    const olderAssets = r.assets.map((a) => ({ ...a, info: classifyAsset(a.name) }))
                    return (
                      <Accordion key={r.id} type="single" collapsible>
                        <AccordionItem value={`rel-${r.id}`} className={i % 2 === 0 ? 'bg-zinc-900' : 'bg-zinc-900/50'}>
                          <AccordionTrigger className="flex flex-wrap items-center gap-2 px-4 py-2.5 text-[10.5px] hover:no-underline">
                            <span dir="ltr" className="shrink-0 font-mono font-bold text-zinc-200">{r.tag_name}</span>
                            <span className="min-w-0 flex-1 truncate text-left text-zinc-500">{r.name ?? ''}</span>
                            <span className="shrink-0 text-zinc-500">{faDate(r.published_at)}</span>
                            <span className="shrink-0 text-zinc-600">{faNum(r.assets.length)} فایل</span>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4">
                            {r.body?.trim() ? (
                              <div className="mb-2 rounded-xl border border-white/10 bg-zinc-950/60 p-3">
                                <MarkdownNotes body={r.body} />
                              </div>
                            ) : null}
                            <div className="space-y-1">
                              {olderAssets.map((a) => (
                                <div key={a.name} className="flex flex-wrap items-center gap-2 text-[10.5px]">
                                  <FileArchive size={12} className="shrink-0 text-zinc-600" aria-hidden />
                                  <span dir="ltr" className="min-w-0 flex-1 truncate font-mono text-zinc-300">{a.name}</span>
                                  <span className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-black ${KIND_STYLE[a.info.kind]}`}>
                                    {a.info.label}
                                  </span>
                                  <span className="shrink-0 text-zinc-500">{humanSize(a.size)}</span>
                                  <a
                                    href={a.browser_download_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="shrink-0 rounded-md border border-emerald-400/40 bg-emerald-400/10 px-2 py-0.5 font-bold text-emerald-300 transition hover:bg-emerald-400/20"
                                  >
                                    دانلود
                                  </a>
                                </div>
                              ))}
                            </div>
                            <a
                              href={r.html_url}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-sky-300 hover:underline"
                            >
                              <ExternalLink size={10} aria-hidden />
                              مشاهده در گیت‌هاب
                            </a>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    )
                  })}
                </section>
              </FadeIn>
            )}
          </>
        )}

        <p className="pb-2 text-center text-[10px] leading-5 text-zinc-600">
          داده‌ها مستقیم از api.github.com خوانده می‌شود — بدون سرور واسط و بدون هیچ داده‌ای از تو.
        </p>
      </div>
    </div>
  )
}

/* --------------------- کارت انتشار (Stable فعلی) --------------------- */

function ReleaseCard({
  release,
  assets,
  highlight,
}: {
  release: GhRelease
  assets: (GhAsset & { info: AssetInfo })[]
  highlight?: boolean
}) {
  const exe = assets.find((a) => a.info.kind === 'windows-nsis')
  const msi = assets.find((a) => a.info.kind === 'windows-msi')
  const web = assets.find((a) => a.info.kind === 'web-standalone')
  const cli = assets.find((a) => a.info.kind === 'cli')

  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-white/10 bg-zinc-900/80 p-4">
        <span
          className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md"
          aria-hidden
        >
          <Tag size={15} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 dir="ltr" className="font-mono text-[12px] font-black text-amber-200">
              {release.tag_name}
            </h3>
            {highlight ? (
              <span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2 py-0.5 text-[9px] font-black text-emerald-300">
                آخرین Stable
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 truncate text-[10.5px] text-zinc-500">
            {release.name ?? 'بدون عنوان'} — انتشار: {faDate(release.published_at)}
          </p>
        </div>
        <a
          href={release.html_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-zinc-950/60 px-2.5 text-[10.5px] font-bold text-zinc-300 transition hover:bg-zinc-800"
        >
          <ExternalLink size={11} aria-hidden />
          در گیت‌هاب
        </a>
      </div>

      <div className="flex flex-col gap-3 p-4">
        {release.body && release.body.trim() !== '' && (
          <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-3">
            <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-black text-zinc-400">
              <FileDown size={11} className="text-emerald-300" aria-hidden />
              یادداشت انتشار
            </p>
            <MarkdownNotes body={release.body} />
          </div>
        )}

        {release.assets.length === 0 && (
          <p className="flex items-start gap-1.5 rounded-xl border border-amber-400/30 bg-amber-400/10 p-2.5 text-[10.5px] leading-5 text-amber-200">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            برای این نسخه هنوز فایلی ساخته نشده — به‌محض انتشار اینجا دیده می‌شود.
          </p>
        )}

        {release.assets.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-white/10">
            <p className="border-b border-white/10 bg-zinc-900/80 px-3 py-2 text-[10px] font-black text-zinc-400">
              فایل‌های این انتشار ({faNum(release.assets.length)} فایل)
            </p>
            {assets.map((a, i) => (
              <div
                key={a.name}
                className={`flex flex-wrap items-center gap-2 px-3 py-2 ${i % 2 === 0 ? 'bg-zinc-900' : 'bg-zinc-900/50'}`}
                title={a.info.purpose}
              >
                <FileArchive size={13} className="shrink-0 text-zinc-500" aria-hidden />
                <span dir="ltr" className="min-w-0 flex-1 truncate font-mono text-[10.5px] text-zinc-200">
                  {a.name}
                </span>
                <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-black ${KIND_STYLE[a.info.kind]}`}>
                  {a.info.label}
                </span>
                <span className="shrink-0 text-[10px] text-zinc-500">{humanSize(a.size)}</span>
                <a
                  href={a.browser_download_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-7 shrink-0 items-center gap-1 rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-2.5 text-[10px] font-bold text-emerald-300 transition hover:bg-emerald-400/20"
                >
                  <Download size={11} aria-hidden />
                  دانلود
                </a>
              </div>
            ))}
          </div>
        )}

        {release.assets.length > 0 && (
          <div className="rounded-xl border border-white/10 bg-zinc-950/60 px-3">
            <p className="pt-3 text-[10px] font-black text-zinc-400">راهنمای نصب به تفکیک پلتفرم</p>
            <Accordion type="single" collapsible className="mt-1">
              <AccordionItem value="win-exe">
                <AccordionTrigger className="py-3 text-[11px] font-black text-zinc-200 hover:no-underline">
                  <span className="flex items-center gap-1.5">
                    <FileDown size={12} className="text-rose-300" aria-hidden />
                    ویندوز — نصاب گرافیکی (exe)
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  {exe ? (
                    <ol className="flex list-decimal flex-col gap-1.5 pr-4 text-[10.5px] leading-5 text-zinc-300">
                      <li>
                        فایل <span dir="ltr" className="font-mono text-amber-200">{exe.name}</span> را دانلود کن ({humanSize(exe.size)}).
                      </li>
                      <li>روی فایل دوبار کلیک کن تا نصاب اجرا شود؛ نصب per-user است و به دسترسی مدیر نیاز ندارد.</li>
                      <li>
                        اگر SmartScreen هشدار داد: «More info» و بعد «Run anyway» — چون نصاب هنوز امضای دیجیتال شرکت ندارد.
                      </li>
                      <li>
                        پیش‌نیاز: WebView2 (روی ویندوز ۱۱ و بیشتر ویندوزهای ۱۰ از قبل نصب است). اگر نصب نباشد، نصاب آن را از اینترنت
                        می‌گیرد — در اینترنتِ محدود، اول WebView2 Runtime را جداگانه نصب کن.
                      </li>
                      <li>داده‌های تو در AppData نگهداری می‌شوند و حذف/به‌روزرسانی برنامه آن‌ها را پاک نمی‌کند.</li>
                    </ol>
                  ) : (
                    <p className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-2.5 text-[10.5px] leading-5 text-amber-200">
                      در این نسخه نصاب exe یافت نشد — راهنمای ویندوز فعلاً قابل ارائه نیست.
                    </p>
                  )}
                </AccordionContent>
              </AccordionItem>

              {msi && (
                <AccordionItem value="win-msi">
                  <AccordionTrigger className="py-3 text-[11px] font-black text-zinc-200 hover:no-underline">
                    <span className="flex items-center gap-1.5">
                      <Package size={12} className="text-rose-300" aria-hidden />
                      ویندوز — نصاب MSI (استقرار سازمانی)
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <ol className="flex list-decimal flex-col gap-1.5 pr-4 text-[10.5px] leading-5 text-zinc-300">
                      <li>
                        فایل <span dir="ltr" className="font-mono text-amber-200">{msi.name}</span> مناسب استقرار با سیاست گروهی است.
                      </li>
                      <li dir="ltr" className="text-left">
                        <code className="font-mono text-emerald-300">msiexec /i {msi.name} /qn</code>
                      </li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>
              )}

              <AccordionItem value="web-standalone">
                <AccordionTrigger className="py-3 text-[11px] font-black text-zinc-200 hover:no-underline">
                  <span className="flex items-center gap-1.5">
                    <Globe size={12} className="text-emerald-300" aria-hidden />
                    وب self-host / لینوکس — اجرای سرور محلی
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  {web ? (
                    <>
                      <ol className="mb-2 flex list-decimal flex-col gap-1.5 pr-4 text-[10.5px] leading-5 text-zinc-300">
                        <li>
                          فایل <span dir="ltr" className="font-mono text-amber-200">{web.name}</span> را دانلود کن ({humanSize(web.size)}) —
                          نیازمند Node.js 18+ روی سیستم.
                        </li>
                        <li>در همان پوشه ترمینال باز کن و:</li>
                      </ol>
                      <pre dir="ltr" className="os-scroll overflow-x-auto rounded-lg border border-white/10 bg-black/60 p-3 text-left font-mono text-[11px] leading-5 text-emerald-200">
                        {`tar xzf ${web.name} && PORT=3000 node server.js`}
                      </pre>
                      <p className="mt-2 text-[10px] leading-4 text-zinc-500">
                        نصب‌کنندهٔ بومی لینوکس (.deb/Arch) هنوز منتشر نشده؛ این محدودیت صادقانه اعلام می‌شود.
                      </p>
                    </>
                  ) : (
                    <p className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-2.5 text-[10.5px] leading-5 text-amber-200">
                      در این نسخه بستهٔ وب standalone یافت نشد.
                    </p>
                  )}
                </AccordionContent>
              </AccordionItem>

              {cli && (
                <AccordionItem value="cli">
                  <AccordionTrigger className="py-3 text-[11px] font-black text-zinc-200 hover:no-underline">
                    <span className="flex items-center gap-1.5">
                      <Terminal size={12} className="text-teal-300" aria-hidden />
                      ابزار CLI — آموزش در ترمینال واقعی
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <ol className="mb-2 flex list-decimal flex-col gap-1.5 pr-4 text-[10.5px] leading-5 text-zinc-300">
                      <li>
                        <span dir="ltr" className="font-mono text-amber-200">{cli.name}</span> ابزار خط‌فرمان یادگیری است (Python 3.10+) —
                        روی ویندوز، لینوکس و مک کار می‌کند.
                      </li>
                    </ol>
                    <pre dir="ltr" className="os-scroll overflow-x-auto rounded-lg border border-white/10 bg-black/60 p-3 text-left font-mono text-[11px] leading-5 text-teal-200">
                      {`tar xzf ${cli.name}\ncd $(basename ${cli.name} .tar.gz)\npip install .\nsanjab --help`}
                    </pre>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          </div>
        )}

        {/* نسخهٔ مرورگر */}
        <div className="flex items-start gap-2.5 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-emerald-400/20 text-emerald-300" aria-hidden>
            <Globe size={15} />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-black text-emerald-200">نسخهٔ مرورگر: همین سایت</p>
            <p className="mt-0.5 text-[10.5px] leading-5 text-emerald-200/75">
              اگر همین حالا سان‌جاب‌اواس را در مرورگر می‌بینی، نسخهٔ مرورگر را داری — به‌روزرسانی‌اش با خود سایت انجام می‌شود.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------------- یادداشت انتشار — Markdown امن (بدون innerHTML) ---------------- */

function MarkdownNotes({ body }: { body: string }) {
  return (
    <div className="prose-invert max-w-none text-[11px] leading-6 text-zinc-300 [&_a]:break-all [&_a]:text-cyan-300 [&_a]:underline [&_blockquote]:border-r-2 [&_blockquote]:border-amber-400/40 [&_blockquote]:pr-3 [&_blockquote]:text-zinc-400 [&_code]:rounded [&_code]:bg-black/50 [&_code]:px-1 [&_code]:font-mono [&_code]:text-[10px] [&_code]:text-amber-200 [&_h1]:mt-2 [&_h1]:text-[12px] [&_h1]:font-black [&_h1]:text-amber-200 [&_h2]:mt-2 [&_h2]:text-[11.5px] [&_h2]:font-black [&_h2]:text-amber-200 [&_h3]:mt-2 [&_h3]:text-[11px] [&_h3]:font-black [&_h3]:text-zinc-200 [&_hr]:border-white/10 [&_img]:max-w-full [&_li]:my-0.5 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pr-4 [&_p]:my-1 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-black/60 [&_pre]:p-2.5 [&_pre]:font-mono [&_pre]:text-[10px] [&_table]:w-full [&_table]:text-[10px] [&_td]:border [&_td]:border-white/10 [&_td]:px-1.5 [&_td]:py-1 [&_th]:border [&_th]:border-white/10 [&_th]:bg-white/5 [&_th]:px-1.5 [&_th]:py-1 [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pr-4">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noreferrer noopener">
              {children}
            </a>
          ),
        }}
      >
        {body}
      </ReactMarkdown>
    </div>
  )
}

/* ------------------------- قطعات کمکی رابط ------------------------- */

function FadeIn({ children, reduce }: { children: React.ReactNode; reduce: boolean | null }) {
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 12 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-32px' }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

function SkeletonList() {
  return (
    <div className="flex flex-col gap-2" aria-label="در حال بارگذاری">
      {Array.from({ length: 3 }, (_, i) => (
        <div
          key={i}
          className="h-24 animate-pulse rounded-2xl bg-zinc-900/80"
          style={{ animationDelay: `${i * 120}ms` }}
        />
      ))}
    </div>
  )
}


