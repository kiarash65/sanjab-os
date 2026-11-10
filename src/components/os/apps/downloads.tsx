'use client'

/* ------------------------------------------------------------------ */
/* «دانلود و به‌روزرسانی»، انتشارهای گیت‌هاب، مقایسهٔ نسخه، فایل‌ها     */
/* همهٔ درخواست‌ها سمت کلاینت؛ با تایم‌اوت ۱۰ ثانیه و حافظهٔ نهان ۱۰ دقیقه‌ای */
/* ------------------------------------------------------------------ */

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  Check,
  CircleCheck,
  CloudOff,
  Copy,
  Download,
  ExternalLink,
  FileArchive,
  FileDown,
  Globe,
  HardDrive,
  History,
  Info,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Tag,
  TriangleAlert,
} from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { useOS } from '@/lib/os/store'
import { BRAND } from '@/lib/os/brand'

/* ------------------------------- انواع ------------------------------- */

/** دارایی یک انتشار، نگاشت دقیق به پاسخ GitHub Releases API */
interface GhAsset {
  name: string
  size: number
  browser_download_url: string
  content_type?: string
  download_count?: number
}

/** یک انتشار (release)، نگاشت دقیق به پاسخ GitHub Releases API */
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

/** ساختار حافظهٔ نهان محلی */
interface ReleasesCache {
  t: number
  data: GhRelease[]
}

type LoadStatus = 'loading' | 'ok' | 'from-cache' | 'error'

/* ------------------------------ ثابت‌ها ------------------------------ */

const RELEASES_URL = 'https://api.github.com/repos/kiarash65/sanjab-os/releases?per_page=10'
const CACHE_KEY = 'sanjab-releases-cache'
const CACHE_TTL_MS = 10 * 60 * 1000
const FETCH_TIMEOUT_MS = 10_000
const MAX_CHECKSUM_BYTES = 64 * 1024

/* ------------------------------ کمکی‌ها ------------------------------ */

const faNum = (n: number): string => n.toLocaleString('fa-IR')

const faDate = (iso: string | null): string => {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return iso
  }
}

/** حجم انسانی، مگابایت/کیلوبایت با ارقام فارسی */
const humanSize = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '—'
  const mb = bytes / 1048576
  if (mb >= 1) return `${mb.toLocaleString('fa-IR', { maximumFractionDigits: 1 })} مگابایت`
  return `${(bytes / 1024).toLocaleString('fa-IR', { maximumFractionDigits: 0 })} کیلوبایت`
}

/** نگاشت محافظه‌کارانهٔ پاسخ ناشناخته به GhRelease، بدون any */
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

/** خواندن حافظهٔ نهان با اعتبارسنجی سخت‌گیرانه */
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
    const payload: ReleasesCache = { t: Date.now(), data }
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload))
  } catch {
    /* حافظه پر یا غیرفعال، مهم نیست */
  }
}

/** مقایسهٔ نسخه: «v4.0.1» و «4.0 "Sanjabak"» → [4,0,1] و [4,0] */
function parseVersion(s: string): number[] | null {
  const m = /^v?(\d+(?:\.\d+)*)/.exec(s.trim())
  if (!m) return null
  return m[1].split('.').map((p) => parseInt(p, 10))
}

function compareVersions(a: number[], b: number[]): number {
  const len = Math.max(a.length, b.length)
  for (let i = 0; i < len; i++) {
    const x = a[i] ?? 0
    const y = b[i] ?? 0
    if (x !== y) return x - y
  }
  return 0
}

/** برچسب نوع فایل بر اساس نام واقعی دارایی، بدون حدس */
function assetType(name: string): { label: string; cls: string } | null {
  if (/sha256|checksum/i.test(name))
    return { label: 'چک‌سام', cls: 'border-cyan-400/40 bg-cyan-400/10 text-cyan-300' }
  if (/\.tar\.gz$/i.test(name))
    return { label: 'لینوکس', cls: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300' }
  if (/\.exe$/i.test(name))
    return { label: 'ویندوز', cls: 'border-rose-400/40 bg-rose-400/10 text-rose-300' }
  if (/\.msi$/i.test(name))
    return { label: 'نصاب ویندوز', cls: 'border-rose-400/40 bg-rose-400/10 text-rose-300' }
  if (/\.zip$/i.test(name))
    return { label: 'آرشیو', cls: 'border-amber-400/40 bg-amber-400/10 text-amber-300' }
  return null
}

/* --------------------- رندر امن متن انتشار (بدون innerHTML) --------------------- */

/** تبدیل URL ها و `کد`ها به المان‌های امن، هیچ innerHTML ای در کار نیست */
function linkify(text: string): ReactNode[] {
  const parts = text.split(/(https?:\/\/[^\s)"'<>]+|`[^`]+`)/g)
  return parts.map((part, i) => {
    if (/^https?:\/\//.test(part)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noreferrer"
          dir="ltr"
          className="break-all text-cyan-300 underline decoration-cyan-400/40 underline-offset-2 hover:text-cyan-200"
        >
          {part}
        </a>
      )
    }
    if (/^`[^`]+`$/.test(part)) {
      return (
        <code
          key={i}
          dir="ltr"
          className="mx-0.5 inline-block rounded bg-black/50 px-1.5 py-0.5 font-mono text-[10px] text-amber-200"
        >
          {part.slice(1, -1)}
        </code>
      )
    }
    return <span key={i}>{part}</span>
  })
}

/** یادداشت انتشار: خط‌به‌خط، تیترها، بولت‌ها و پاراگراف‌ها */
function ReleaseNotes({ body }: { body: string }) {
  const lines = body.replace(/\r/g, '').split('\n')
  return (
    <div className="flex flex-col gap-1">
      {lines.map((line, i) => {
        const heading = /^(#{1,3})\s+(.*)$/.exec(line)
        if (heading) {
          const level = heading[1].length
          return (
            <p
              key={i}
              className={`mt-1.5 font-black text-amber-200 ${level === 1 ? 'text-[12px]' : 'text-[11px]'}`}
            >
              {linkify(heading[2])}
            </p>
          )
        }
        const bullet = /^\s*[-*]\s+(.*)$/.exec(line)
        if (bullet) {
          return (
            <p key={i} className="flex items-start gap-1.5 text-[11px] leading-5 text-zinc-300">
              <span className="mt-2 size-1 shrink-0 rounded-full bg-emerald-400/70" aria-hidden />
              <span className="min-w-0">{linkify(bullet[1])}</span>
            </p>
          )
        }
        if (line.trim() === '') return <div key={i} className="h-1" aria-hidden />
        return (
          <p key={i} className="text-[11px] leading-5 text-zinc-300">
            {linkify(line)}
          </p>
        )
      })}
    </div>
  )
}

/* ============================ اپ اصلی ============================ */

export default function DownloadsApp() {
  const pushToast = useOS((s) => s.pushToast)
  const reduce = useReducedMotion()

  const [releases, setReleases] = useState<GhRelease[] | null>(null)
  const [status, setStatus] = useState<LoadStatus>('loading')
  const [err, setErr] = useState('')
  const [staleWarn, setStaleWarn] = useState('')
  const [cacheAt, setCacheAt] = useState(0)

  /* بارگیری اولیه: اگر حافظهٔ نهان تازه است، همین را نشان بده */
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
      /* آفلاین یا خطا → حافظهٔ نهان موجود را با هشدار صادقانه نشان بده */
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
  }, [load])

  const latest = releases && releases.length > 0 ? releases[0] : null
  const older = releases ? releases.slice(1) : []

  /* مقایسهٔ صادقانهٔ نسخهٔ نصب‌شده با آخرین انتشار */
  const cmp = useMemo(() => {
    const installed = parseVersion(BRAND.versionEn)
    const remote = latest ? parseVersion(latest.tag_name) : null
    if (latest && installed && remote) {
      const c = compareVersions(remote, installed)
      if (c === 0) return 'equal' as const
      return c > 0 ? ('newer' as const) : ('older' as const)
    }
    return 'unknown' as const
  }, [latest])

  /* دارایی‌های کلیدی نسخهٔ آخر، فقط نام‌های واقعی، بدون حدس */
  const exeAsset = useMemo(() => latest?.assets.find((a) => /\.exe$/i.test(a.name)) ?? null, [latest])
  const zipAsset = useMemo(() => latest?.assets.find((a) => /\.zip$/i.test(a.name)) ?? null, [latest])
  const targzAsset = useMemo(() => latest?.assets.find((a) => /\.tar\.gz$/i.test(a.name)) ?? null, [latest])
  const sumsAsset = useMemo(() => latest?.assets.find((a) => /sha256|checksum/i.test(a.name)) ?? null, [latest])

  /* کپی چک‌سام‌ها، با سقف ۶۴ کیلوبایت */
  const [ckBusy, setCkBusy] = useState(false)
  const [ckDone, setCkDone] = useState(false)
  const [ckErr, setCkErr] = useState('')

  const copyChecksums = useCallback(async () => {
    if (!sumsAsset || ckBusy) return
    setCkBusy(true)
    setCkErr('')
    try {
      const res = await fetch(sumsAsset.browser_download_url)
      if (!res.ok) throw new Error(`دانلود فایل چک‌سام ناموفق بود (کد ${res.status}).`)
      const text = await res.text()
      if (text.length > MAX_CHECKSUM_BYTES)
        throw new Error('فایل چک‌سام بزرگ‌تر از حد انتظار است (سقف ۶۴ کیلوبایت).')
      await navigator.clipboard.writeText(text)
      setCkDone(true)
      pushToast({
        icon: ShieldCheck,
        title: 'چک‌سام‌ها کپی شد',
        body: 'محتوای کامل فایل تأیید صحت در کلیپ‌بورد است.',
      })
      setTimeout(() => setCkDone(false), 2500)
    } catch (e) {
      setCkErr(e instanceof Error ? e.message : 'کپی ناموفق بود.')
    } finally {
      setCkBusy(false)
    }
  }, [sumsAsset, ckBusy, pushToast])

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
              <div className="min-w-0">
                <h2 className="text-base font-black text-zinc-100">دانلود و به‌روزرسانی</h2>
                <p className="mt-0.5 text-[10.5px] leading-5 text-zinc-400">
                  انتشارهای رسمی از مخزن گیت‌هاب، با حافظهٔ نهان محلی ۱۰ دقیقه‌ای
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="mr-auto shrink-0"
                onClick={() => void load(true)}
                disabled={status === 'loading'}
                aria-label="بارگیری دوباره فهرست انتشارها"
              >
                <RefreshCw className={`size-4 ${status === 'loading' ? 'animate-spin' : ''}`} aria-hidden />
                <span className="hidden sm:inline">بازخوانی</span>
              </Button>
            </div>

            {/* نسخهٔ نصب‌شده و مقایسه */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-zinc-900/80 px-2.5 py-1 text-[10.5px] font-bold text-zinc-300">
                <Tag size={12} className="text-amber-300" aria-hidden />
                نسخهٔ نصب‌شده: <span dir="ltr" className="font-mono">{BRAND.versionEn}</span>
              </span>

              {status !== 'loading' && latest && (
                <>
                  {cmp === 'equal' && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2.5 py-1 text-[10.5px] font-black text-emerald-300">
                      <CircleCheck size={12} aria-hidden />
                      به‌روز هستی، آخرین انتشار: {latest.tag_name}
                    </span>
                  )}
                  {cmp === 'newer' && (
                    <>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/10 px-2.5 py-1 text-[10.5px] font-black text-amber-300">
                        <TriangleAlert size={12} aria-hidden />
                        به‌روزرسانی در دسترس، انتشار: {latest.tag_name}
                      </span>
                      <a
                        href={latest.html_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-7 items-center gap-1 rounded-lg border border-amber-400/40 bg-amber-400/10 px-2.5 text-[10px] font-bold text-amber-200 transition hover:bg-amber-400/20"
                      >
                        <ExternalLink size={11} aria-hidden />
                        مشاهده انتشار
                      </a>
                    </>
                  )}
                  {cmp === 'older' && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-400/40 bg-purple-400/10 px-2.5 py-1 text-[10.5px] font-black text-purple-300">
                      <Info size={12} aria-hidden />
                      نسخهٔ نصب‌شده از آخرین انتشار جلوتر است
                    </span>
                  )}
                  {cmp === 'unknown' && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-500/40 bg-zinc-500/10 px-2.5 py-1 text-[10.5px] font-black text-zinc-400">
                      <Info size={12} aria-hidden />
                      نسخه‌ها قابل مقایسهٔ خودکار نیستند
                    </span>
                  )}
                </>
              )}
            </div>

            {/* وضعیت داده */}
            {status === 'from-cache' && staleWarn && (
              <p className="mt-2 flex items-start gap-1.5 rounded-xl border border-amber-400/30 bg-amber-400/10 p-2.5 text-[10.5px] leading-5 text-amber-200">
                <CloudOff className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                <span className="min-w-0">{staleWarn}</span>
              </p>
            )}
            {status === 'ok' && cacheAt > 0 && (
              <p className="mt-2 text-[10px] text-zinc-500">
                داده از حافظهٔ نهان محلی (ذخیره: {faDate(new Date(cacheAt).toISOString())})، تا ۱۰ دقیقه بدون درخواست تازه.
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

        {latest && (
          <>
            {/* ------------------------ کارت آخرین انتشار ------------------------ */}
            <FadeIn reduce={reduce}>
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
                        {latest.tag_name}
                      </h3>
                      {latest.prerelease && (
                        <span className="rounded-full border border-purple-400/40 bg-purple-400/10 px-2 py-0.5 text-[9px] font-black text-purple-300">
                          پیش‌انتشار
                        </span>
                      )}
                      {latest.draft && (
                        <span className="rounded-full border border-zinc-500/40 bg-zinc-500/10 px-2 py-0.5 text-[9px] font-black text-zinc-400">
                          پیش‌نویس
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-[10.5px] text-zinc-500">
                      {latest.name ?? 'بدون عنوان'}، انتشار: {faDate(latest.published_at)}
                    </p>
                  </div>
                  <a
                    href={latest.html_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-zinc-950/60 px-2.5 text-[10.5px] font-bold text-zinc-300 transition hover:bg-zinc-800"
                  >
                    <ExternalLink size={11} aria-hidden />
                    در گیت‌هاب
                  </a>
                </div>

                <div className="flex flex-col gap-3 p-4">
                  {/* یادداشت انتشار */}
                  {latest.body && latest.body.trim() !== '' && (
                    <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-3">
                      <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-black text-zinc-400">
                        <FileDown size={11} className="text-emerald-300" aria-hidden />
                        یادداشت انتشار
                      </p>
                      <ReleaseNotes body={latest.body} />
                    </div>
                  )}

                  {/* صادقانه: اگر هنوز فایلی ساخته نشده */}
                  {latest.assets.length === 0 && (
                    <p className="flex items-start gap-1.5 rounded-xl border border-amber-400/30 bg-amber-400/10 p-2.5 text-[10.5px] leading-5 text-amber-200">
                      <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                      برای این نسخه هنوز فایل ساخته نشده، به‌محض انتشار اینجا دیده می‌شود.
                    </p>
                  )}

                  {/* فهرست دارایی‌ها */}
                  {latest.assets.length > 0 && (
                    <div className="overflow-hidden rounded-xl border border-white/10">
                      <p className="border-b border-white/10 bg-zinc-900/80 px-3 py-2 text-[10px] font-black text-zinc-400">
                        فایل‌های این انتشار ({faNum(latest.assets.length)} فایل)
                      </p>
                      {latest.assets.map((a, i) => {
                        const t = assetType(a.name)
                        return (
                          <div
                            key={`${a.name}-${i}`}
                            className={`flex flex-wrap items-center gap-2 px-3 py-2 ${
                              i % 2 === 0 ? 'bg-zinc-900' : 'bg-zinc-900/50'
                            }`}
                          >
                            <FileArchive size={13} className="shrink-0 text-zinc-500" aria-hidden />
                            <span dir="ltr" className="min-w-0 flex-1 truncate font-mono text-[10.5px] text-zinc-200">
                              {a.name}
                            </span>
                            {t && (
                              <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-black ${t.cls}`}>
                                {t.label}
                              </span>
                            )}
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
                        )
                      })}
                    </div>
                  )}

                  {/* کپی چک‌سام‌ها */}
                  {sumsAsset && (
                    <div className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 p-3">
                      <p className="text-[10.5px] leading-5 text-cyan-200">
                        فایل تأیید صحت پیدا شد: <span dir="ltr" className="font-mono">{sumsAsset.name}</span>،
                        بعد از دانلود، امضای فایل را با آن مقایسه کن.
                      </p>
                      {ckErr && (
                        <p role="alert" className="mt-1.5 text-[10px] leading-4 text-rose-300">
                          {ckErr}
                        </p>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2 border-cyan-400/40 text-cyan-200 hover:bg-cyan-400/15"
                        onClick={() => void copyChecksums()}
                        disabled={ckBusy}
                      >
                        {ckBusy ? (
                          <LoaderCircle className="size-4 animate-spin" aria-hidden />
                        ) : ckDone ? (
                          <Check className="size-4" aria-hidden />
                        ) : (
                          <Copy className="size-4" aria-hidden />
                        )}
                        {ckDone ? 'کپی شد' : 'کپی چک‌سام‌ها'}
                      </Button>
                    </div>
                  )}

                  {/* راهنمای نصب */}
                  {latest.assets.length > 0 && (
                    <div className="rounded-xl border border-white/10 bg-zinc-950/60 px-3">
                      <p className="pt-3 text-[10px] font-black text-zinc-400">راهنمای نصب به تفکیک پلتفرم</p>
                      <Accordion type="single" collapsible className="mt-1">
                        {/* ویندوز، exe */}
                        <AccordionItem value="win-exe">
                          <AccordionTrigger className="py-3 text-[11px] font-black text-zinc-200 hover:no-underline">
                            <span className="flex items-center gap-1.5">
                              <FileDown size={12} className="text-rose-300" aria-hidden />
                              ویندوز، نصاب exe
                            </span>
                          </AccordionTrigger>
                          <AccordionContent className="pb-4">
                            {exeAsset ? (
                              <ol className="flex list-decimal flex-col gap-1.5 pr-4 text-[10.5px] leading-5 text-zinc-300">
                                <li>
                                  فایل <span dir="ltr" className="font-mono text-amber-200">{exeAsset.name}</span> را
                                  از فهرست بالا دانلود کن ({humanSize(exeAsset.size)}).
                                </li>
                                <li>روی فایل دانلودشده دوبار کلیک کن تا نصاب اجرا شود.</li>
                                <li>
                                  اگر Windows Smart Screen هشدار داد: روی «More info» بزن و بعد
                                  «Run anyway» را انتخاب کن، چون نصاب هنوز امضای دیجیتال ندارد.
                                </li>
                              </ol>
                            ) : (
                              <p className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-2.5 text-[10.5px] leading-5 text-amber-200">
                                در این نسخه فایل exe یافت نشد، راهنمای ویندوز فعلاً قابل ارائه نیست.
                              </p>
                            )}
                          </AccordionContent>
                        </AccordionItem>

                        {/* ویندوز، zip پرتابل */}
                        <AccordionItem value="win-zip">
                          <AccordionTrigger className="py-3 text-[11px] font-black text-zinc-200 hover:no-underline">
                            <span className="flex items-center gap-1.5">
                              <FileArchive size={12} className="text-amber-300" aria-hidden />
                              ویندوز، نسخهٔ پرتابل (بدون نصب)
                            </span>
                          </AccordionTrigger>
                          <AccordionContent className="pb-4">
                            {zipAsset ? (
                              <ol className="flex list-decimal flex-col gap-1.5 pr-4 text-[10.5px] leading-5 text-zinc-300">
                                <li>
                                  فایل <span dir="ltr" className="font-mono text-amber-200">{zipAsset.name}</span> را
                                  دانلود کن ({humanSize(zipAsset.size)}).
                                </li>
                                <li>محتوای آرشیو را در پوشه‌ای دلخواه استخراج کن، نیازی به نصب نیست.</li>
                                <li>فایل اجرای اصلی داخل پوشه را اجرا کن؛ نسخهٔ پرتابل هیچ ردپایی در رجیستری نمی‌گذارد.</li>
                              </ol>
                            ) : (
                              <p className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-2.5 text-[10.5px] leading-5 text-amber-200">
                                در این نسخه فایل zip یافت نشد، نسخهٔ پرتابل فعلاً منتشر نشده است.
                              </p>
                            )}
                          </AccordionContent>
                        </AccordionItem>

                        {/* لینوکس، tar.gz */}
                        <AccordionItem value="linux-targz">
                          <AccordionTrigger className="py-3 text-[11px] font-black text-zinc-200 hover:no-underline">
                            <span className="flex items-center gap-1.5">
                              <HardDrive size={12} className="text-emerald-300" aria-hidden />
                              لینوکس، بستهٔ tar.gz
                            </span>
                          </AccordionTrigger>
                          <AccordionContent className="pb-4">
                            {targzAsset ? (
                              <>
                                <ol className="mb-2 flex list-decimal flex-col gap-1.5 pr-4 text-[10.5px] leading-5 text-zinc-300">
                                  <li>
                                    فایل{' '}
                                    <span dir="ltr" className="font-mono text-amber-200">{targzAsset.name}</span>{' '}
                                    را دانلود کن ({humanSize(targzAsset.size)}).
                                  </li>
                                  <li>در همان پوشه، ترمینال را باز کن و فرمان زیر را اجرا کن:</li>
                                </ol>
                                <pre
                                  dir="ltr"
                                  className="os-scroll overflow-x-auto rounded-lg border border-white/10 bg-black/60 p-3 text-left font-mono text-[11px] leading-5 text-emerald-200"
                                >
                                  {`tar xzf ${targzAsset.name} && node server.js`}
                                </pre>
                              </>
                            ) : (
                              <p className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-2.5 text-[10.5px] leading-5 text-amber-200">
                                در این نسخه فایل tar.gz یافت نشد، بستهٔ لینوکس فعلاً منتشر نشده است.
                                (روش نصب مستقیم از مخزن، در برنامهٔ «نسخه لینوکس واقعی» توضیح داده شده.)
                              </p>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </div>
                  )}

                  {/* نسخهٔ مرورگر */}
                  <div className="flex items-start gap-2.5 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-3">
                    <span
                      className="grid size-8 shrink-0 place-items-center rounded-lg bg-emerald-400/20 text-emerald-300"
                      aria-hidden
                    >
                      <Globe size={15} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-black text-emerald-200">نسخهٔ مرورگر: همین سایت</p>
                      <p className="mt-0.5 text-[10.5px] leading-5 text-emerald-200/75">
                        اگر همین حالا سان‌جاب‌اواس را در مرورگر می‌بینی، نسخهٔ مرورگر را داری،
                        چیزی برای دانلود نیست؛ به‌روزرسانی‌اش با خود سایت انجام می‌شود.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </FadeIn>

            {/* ------------------------ نسخه‌های پیشین ------------------------ */}
            {older.length > 0 && (
              <FadeIn reduce={reduce}>
                <section className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60">
                  <p className="flex items-center gap-1.5 border-b border-white/10 bg-zinc-900/80 px-4 py-2.5 text-[10.5px] font-black text-zinc-400">
                    <History size={12} className="text-purple-300" aria-hidden />
                    نسخه‌های پیشین ({faNum(older.length)} انتشار)
                  </p>
                  {older.map((r, i) => (
                    <a
                      key={r.id}
                      href={r.html_url}
                      target="_blank"
                      rel="noreferrer"
                      className={`flex flex-wrap items-center gap-2 px-4 py-2.5 text-[10.5px] transition hover:bg-zinc-800/60 ${
                        i % 2 === 0 ? 'bg-zinc-900' : 'bg-zinc-900/50'
                      }`}
                    >
                      <span dir="ltr" className="shrink-0 font-mono font-bold text-zinc-200">
                        {r.tag_name}
                      </span>
                      {r.prerelease && (
                        <span className="shrink-0 rounded-full border border-purple-400/40 bg-purple-400/10 px-1.5 py-0.5 text-[8.5px] font-black text-purple-300">
                          پیش‌انتشار
                        </span>
                      )}
                      <span className="min-w-0 flex-1 truncate text-zinc-500">{r.name ?? ''}</span>
                      <span className="shrink-0 text-zinc-500">{faDate(r.published_at)}</span>
                      <span className="shrink-0 text-zinc-600">{faNum(r.assets.length)} فایل</span>
                      <ExternalLink size={11} className="shrink-0 text-zinc-600" aria-hidden />
                    </a>
                  ))}
                </section>
              </FadeIn>
            )}
          </>
        )}

        <p className="pb-2 text-center text-[10px] leading-5 text-zinc-600">
          داده‌ها مستقیم از api.github.com خوانده می‌شود، بدون سرور واسط و بدون هیچ داده‌ای از تو.
        </p>
      </div>
    </div>
  )
}

/* ------------------------- قطعات کمکی رابط ------------------------- */

function FadeIn({ children, reduce }: { children: ReactNode; reduce: boolean | null }) {
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
