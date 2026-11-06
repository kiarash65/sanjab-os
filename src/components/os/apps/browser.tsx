'use client'

/* «سفربُر» — مرورگر چندتبی سان‌جاب‌اواس
   تب‌ها، جستجوی ویکی‌پدیا (CORS باز)، بوکمارک، تاریخچه و زوم.
   برخی سایت‌ها اجازهٔ فریم نمی‌دهند (X-Frame-Options) — برای آن‌ها دکمهٔ باز کردن بیرونی داریم. */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  ExternalLink,
  Globe,
  House,
  Loader2,
  Plus,
  RotateCcw,
  Search,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { useOS } from '@/lib/os/store'

const fa = (n: number) => n.toLocaleString('fa-IR')

interface Tab {
  id: string
  title: string
  url: string // '' یعنی صفحهٔ خانه
  hist: string[]
  hi: number
  key: number
}

interface WikiResult {
  title: string
  snippet: string
}

const TILES: { title: string; desc: string; url: string; color: string; letter: string }[] = [
  {
    title: 'نقشهٔ تهران',
    desc: 'OpenStreetMap — تعاملی و آزاد',
    url: 'https://www.openstreetmap.org/export/embed.html?bbox=51.20%2C35.58%2C51.65%2C35.86&layer=mapnik',
    color: '#0ea5a0',
    letter: 'ن',
  },
  {
    title: 'ویکی‌پدیا فارسی',
    desc: 'دانشنامهٔ آزاد — نسخهٔ موبایل',
    url: 'https://fa.m.wikipedia.org/wiki/صفحهٔ_اصلی',
    color: '#8b5cf6',
    letter: 'و',
  },
  {
    title: 'هواشناسی wttr',
    desc: 'آب‌وهوا به سبک ترمینال',
    url: 'https://wttr.in/Tehran?lang=fa',
    color: '#f7931e',
    letter: 'ه',
  },
  {
    title: 'example.com',
    desc: 'اولین سایت آزمایشی دنیا',
    url: 'https://example.com',
    color: '#34d399',
    letter: 'e',
  },
]

const BOOKMARKS: { label: string; url: string }[] = [
  { label: 'نقشه', url: TILES[0].url },
  { label: 'ویکی‌پدیا', url: TILES[1].url },
  { label: 'هوا', url: TILES[2].url },
  { label: 'MDN', url: 'https://developer.mozilla.org' },
  { label: 'GitHub', url: 'https://github.com' },
]

const HIST_KEY = 'sunjob-browser-hist'

function normalizeInput(raw: string): { url: string; search?: string } {
  const t = raw.trim()
  if (!t) return { url: '' }
  if (/^https?:\/\//i.test(t)) return { url: t }
  // حاوی نقطه و بدون فاصله → دامنه
  if (!/\s/.test(t) && /\.[a-zA-Z\u0600-\u06FF]{2,}/.test(t)) return { url: `https://${t}` }
  return { url: '', search: t }
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export default function BrowserApp() {
  const pushToast = useOS((s) => s.pushToast)

  const mkTab = useCallback(
    (url = ''): Tab => ({
      id: Math.random().toString(36).slice(2, 9),
      title: url ? hostOf(url) : 'خانه',
      url,
      hist: url ? [url] : [],
      hi: url ? 0 : -1,
      key: 1,
    }),
    []
  )

  const [tabs, setTabs] = useState<Tab[]>(() => [Object.create(null) as never].slice(0, 0)) // جایگزین می‌شود
  const [activeId, setActiveId] = useState('')
  const [addr, setAddr] = useState('')
  const [loading, setLoading] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [wikiQ, setWikiQ] = useState('')
  const [wikiResults, setWikiResults] = useState<WikiResult[] | null>(null)
  const [wikiBusy, setWikiBusy] = useState(false)
  const [histOpen, setHistOpen] = useState(false)
  const [history, setHistory] = useState<string[]>([])
  const didInit = useRef(false)

  /* init در کلاینت (جلوگیری از mismatch) */
  useEffect(() => {
    const first: Tab = {
      id: Math.random().toString(36).slice(2, 9),
      title: 'خانه',
      url: '',
      hist: [],
      hi: -1,
      key: 1,
    }
    setTabs([first])
    setActiveId(first.id)
    try {
      const raw = localStorage.getItem(HIST_KEY)
      if (raw) setHistory(JSON.parse(raw) as string[])
    } catch {
      /* ignore */
    }
    didInit.current = true
  }, [])

  const active = useMemo(() => tabs.find((t) => t.id === activeId) ?? null, [tabs, activeId])

  useEffect(() => {
    setAddr(active?.url ?? '')
    setLoading(false)
    setWikiResults(null)
  }, [active?.id, active?.url, active?.key])

  const remember = useCallback((url: string) => {
    if (!url) return
    setHistory((prev) => {
      const next = [url, ...prev.filter((u) => u !== url)].slice(0, 30)
      try {
        localStorage.setItem(HIST_KEY, JSON.stringify(next))
      } catch {
        /* ignore */
      }
      return next
    })
  }, [])

  const navigate = useCallback(
    (url: string, tabId?: string) => {
      const tid = tabId ?? activeId
      if (!tid) return
      setTabs((prev) =>
        prev.map((t) => {
          if (t.id !== tid) return t
          const hist = [...t.hist.slice(0, t.hi + 1), url].slice(-50)
          return { ...t, url, hist, hi: hist.length - 1, key: t.key + 1, title: hostOf(url) || 'خانه' }
        })
      )
      remember(url)
      setLoading(true)
    },
    [activeId, remember]
  )

  const goAddr = (raw: string) => {
    const { url, search } = normalizeInput(raw)
    if (url) {
      navigate(url)
      return
    }
    if (search) {
      /* موتورهای جستجو فریم نمی‌دهند → ویکی‌پدیا را جستجو می‌کنیم */
      void runWikiSearch(search)
    }
  }

  const runWikiSearch = useCallback(async (q: string) => {
    setWikiBusy(true)
    setWikiResults(null)
    try {
      const api =
        'https://fa.wikipedia.org/w/api.php?action=query&format=json&origin=*&list=search&srlimit=8&srsearch=' +
        encodeURIComponent(q)
      const res = await fetch(api)
      const data = (await res.json()) as {
        query?: { search?: { title: string; snippet: string }[] }
      }
      const items = (data.query?.search ?? []).map((s) => ({
        title: s.title,
        snippet: s.snippet.replace(/<[^>]+>/g, ''),
      }))
      setWikiResults(items)
      if (items.length === 0) {
        pushToast({ icon: '🔍', title: 'نتیجه‌ای پیدا نشد', body: `برای «${q}» در ویکی‌پدیا چیزی نبود.` })
      }
    } catch {
      pushToast({
        icon: '⚠️',
        title: 'جستجوی آنلاین نشد',
        body: 'اتصال اینترنت را چک کن یا آدرس را مستقیم وارد کن.',
      })
    } finally {
      setWikiBusy(false)
    }
  }, [pushToast])

  const back = () => {
    if (!active || active.hi <= 0) return
    setTabs((prev) =>
      prev.map((t) =>
        t.id === active.id
          ? { ...t, hi: t.hi - 1, url: t.hist[t.hi - 1], key: t.key + 1, title: hostOf(t.hist[t.hi - 1]) }
          : t
      )
    )
  }
  const forward = () => {
    if (!active || active.hi >= active.hist.length - 1) return
    setTabs((prev) =>
      prev.map((t) =>
        t.id === active.id
          ? { ...t, hi: t.hi + 1, url: t.hist[t.hi + 1], key: t.key + 1, title: hostOf(t.hist[t.hi + 1]) }
          : t
      )
    )
  }

  const closeTab = (id: string) => {
    setTabs((prev) => {
      const idx = prev.findIndex((t) => t.id === id)
      const next = prev.filter((t) => t.id !== id)
      if (next.length === 0) {
        const fresh: Tab = { id: Math.random().toString(36).slice(2, 9), title: 'خانه', url: '', hist: [], hi: -1, key: 1 }
        setActiveId(fresh.id)
        return [fresh]
      }
      if (id === activeId) setActiveId(next[Math.max(0, idx - 1)].id)
      return next
    })
  }

  const openExternal = (url: string) => {
    if (!url) return
    window.open(url, '_blank', 'noopener,noreferrer')
    pushToast({ icon: '🌐', title: 'در تب جدید باز شد', body: hostOf(url) })
  }

  const isHome = !active?.url
  const canBack = !!active && active.hi > 0
  const canForward = !!active && active.hi < active.hist.length - 1

  return (
    <div className="flex h-full w-full flex-col bg-zinc-950/70">
      {/* نوار تب‌ها */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-white/10 bg-zinc-900/80 px-1.5 pt-1.5">
        {tabs.map((t) => (
          <div
            key={t.id}
            className={`group flex h-8 min-w-0 max-w-44 shrink-0 items-center gap-1.5 rounded-t-lg px-2.5 text-[11px] transition ${
              t.id === activeId ? 'bg-zinc-800 font-bold text-zinc-100' : 'bg-white/[0.03] text-zinc-400 hover:bg-white/[0.07]'
            }`}
          >
            <button
              onClick={() => setActiveId(t.id)}
              className="flex min-w-0 flex-1 items-center gap-1.5"
              aria-label={`تب ${t.title}`}
            >
              <Globe size={11} className="shrink-0 text-[#f7931e]" aria-hidden />
              <span className="truncate">{t.title}</span>
            </button>
            <button
              onClick={() => closeTab(t.id)}
              className="grid size-4 shrink-0 place-items-center rounded text-zinc-500 opacity-0 transition hover:bg-white/10 hover:text-rose-300 group-hover:opacity-100"
              aria-label="بستن تب"
            >
              <X size={10} />
            </button>
          </div>
        ))}
        <button
          onClick={() => {
            const t: Tab = { id: Math.random().toString(36).slice(2, 9), title: 'خانه', url: '', hist: [], hi: -1, key: 1 }
            setTabs((prev) => [...prev, t])
            setActiveId(t.id)
          }}
          className="grid size-6 shrink-0 place-items-center rounded-md text-zinc-400 transition hover:bg-white/10 hover:text-zinc-100"
          aria-label="تب جدید"
        >
          <Plus size={13} />
        </button>
      </div>

      {/* نوار آدرس */}
      <div className="flex items-center gap-1.5 border-b border-white/10 bg-zinc-900/70 p-2">
        <button
          onClick={back}
          disabled={!canBack}
          className="grid size-7 place-items-center rounded-md text-zinc-400 transition hover:bg-white/10 hover:text-zinc-100 disabled:opacity-30"
          aria-label="عقب"
        >
          <ArrowRight size={14} />
        </button>
        <button
          onClick={forward}
          disabled={!canForward}
          className="grid size-7 place-items-center rounded-md text-zinc-400 transition hover:bg-white/10 hover:text-zinc-100 disabled:opacity-30"
          aria-label="جلو"
        >
          <ArrowLeft size={14} />
        </button>
        <button
          onClick={() => active?.url && navigate(active.url)}
          disabled={isHome}
          className="grid size-7 place-items-center rounded-md text-zinc-400 transition hover:bg-white/10 hover:text-zinc-100 disabled:opacity-30"
          aria-label="بارگذاری دوباره"
        >
          <RotateCcw size={13} />
        </button>
        <button
          onClick={() => navigate('')}
          className="grid size-7 place-items-center rounded-md text-zinc-400 transition hover:bg-white/10 hover:text-zinc-100"
          aria-label="خانه"
        >
          <House size={14} />
        </button>
        <form
          className="flex min-w-0 flex-1 items-center"
          onSubmit={(e) => {
            e.preventDefault()
            goAddr(addr)
          }}
        >
          <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-full border border-white/10 bg-zinc-950 px-3 py-1.5 focus-within:border-[#f7931e]/60">
            <Search size={12} className="shrink-0 text-zinc-500" aria-hidden />
            <input
              value={addr}
              onChange={(e) => setAddr(e.target.value)}
              placeholder="آدرس سایت یا جستجو در ویکی‌پدیا…"
              dir="ltr"
              className="min-w-0 flex-1 bg-transparent text-left text-[11.5px] text-zinc-100 placeholder:text-zinc-600 outline-none"
              aria-label="نوار آدرس"
              spellCheck={false}
              autoComplete="off"
            />
            {loading && <Loader2 size={12} className="shrink-0 animate-spin text-[#f7931e]" aria-hidden />}
          </div>
        </form>
        <button
          onClick={() => setZoom((z) => Math.min(1.6, z + 0.1))}
          className="grid size-7 place-items-center rounded-md text-zinc-400 transition hover:bg-white/10 hover:text-zinc-100"
          aria-label="بزرگ‌نمایی"
        >
          <ZoomIn size={14} />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
          className="grid size-7 place-items-center rounded-md text-zinc-400 transition hover:bg-white/10 hover:text-zinc-100"
          aria-label="کوچک‌نمایی"
        >
          <ZoomOut size={14} />
        </button>
        <span className="hidden min-w-10 text-center text-[9.5px] font-black text-zinc-500 sm:block">{fa(Math.round(zoom * 100))}٪</span>
        <button
          onClick={() => setHistOpen((o) => !o)}
          className={`grid size-7 place-items-center rounded-md transition hover:bg-white/10 ${histOpen ? 'text-[#f7931e]' : 'text-zinc-400 hover:text-zinc-100'}`}
          aria-label="تاریخچه"
        >
          <Bookmark size={13} />
        </button>
      </div>

      {/* بوکمارک‌ها */}
      <div className="flex items-center gap-1 border-b border-white/10 bg-zinc-900/40 px-2 py-1">
        {BOOKMARKS.map((b) => (
          <button
            key={b.label}
            onClick={() => navigate(b.url)}
            className="rounded-md px-2 py-1 text-[10px] font-bold text-zinc-400 transition hover:bg-white/10 hover:text-zinc-100"
          >
            {b.label}
          </button>
        ))}
      </div>

      {/* بدنه */}
      <div className="relative min-h-0 flex-1">
        {/* صفحهٔ خانه */}
        {isHome && (
          <div className="os-scroll h-full overflow-y-auto bg-gradient-to-b from-[#0b1120] to-zinc-950 p-4">
            <div className="mx-auto max-w-md space-y-4 pt-4 text-center">
              <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-[#f7931e] to-[#e07b00] text-white shadow-lg">
                <Globe size={26} />
              </div>
              <h2 className="text-lg font-black text-zinc-100">سفربُر سان‌جاب</h2>
              <p className="text-[11px] leading-5 text-zinc-400">
                آدرس را بالا وارد کن یا یکی از میان‌برهای زیر را بزن. جستجو، ویکی‌پدیا را ورق می‌زند!
              </p>
              <div className="grid grid-cols-2 gap-2">
                {TILES.map((tile) => (
                  <button
                    key={tile.title}
                    onClick={() => navigate(tile.url)}
                    className="group flex flex-col items-center gap-1.5 rounded-2xl border border-white/10 bg-zinc-900/60 p-4 transition hover:border-white/25 active:scale-[0.98]"
                  >
                    <span
                      className="grid size-10 place-items-center rounded-xl text-lg font-black text-white transition group-hover:scale-110"
                      style={{ background: tile.color }}
                      aria-hidden
                    >
                      {tile.letter}
                    </span>
                    <span className="text-[11px] font-black text-zinc-100">{tile.title}</span>
                    <span className="text-[9.5px] leading-3.5 text-zinc-500">{tile.desc}</span>
                  </button>
                ))}
              </div>
              {/* جستجوی ویکی‌پدیا */}
              <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-3 text-right">
                <p className="mb-2 text-[11px] font-black text-zinc-200">جستجوی سریع ویکی‌پدیا</p>
                <div className="flex gap-1.5">
                  <input
                    value={wikiQ}
                    onChange={(e) => setWikiQ(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && wikiQ.trim()) void runWikiSearch(wikiQ.trim())
                    }}
                    placeholder="مثلاً: لینوکس توروالدز"
                    className="min-w-0 flex-1 rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-[11.5px] text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-[#f7931e]/60"
                    aria-label="جستجوی ویکی‌پدیا"
                  />
                  <button
                    onClick={() => wikiQ.trim() && void runWikiSearch(wikiQ.trim())}
                    disabled={wikiBusy}
                    className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#8b5cf6] text-white transition hover:brightness-110 active:scale-95 disabled:opacity-50"
                    aria-label="جستجو"
                  >
                    {wikiBusy ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                  </button>
                </div>
                {wikiResults && wikiResults.length > 0 && (
                  <div className="pengo-fadein mt-2 max-h-52 space-y-1 overflow-y-auto">
                    {wikiResults.map((r) => (
                      <button
                        key={r.title}
                        onClick={() => navigate(`https://fa.m.wikipedia.org/wiki/${encodeURIComponent(r.title.replace(/ /g, '_'))}`)}
                        className="block w-full rounded-lg border border-white/5 bg-white/[0.03] p-2 text-right transition hover:border-[#8b5cf6]/50 hover:bg-[#8b5cf6]/10"
                      >
                        <span className="block text-[11px] font-black text-violet-300">{r.title}</span>
                        <span className="mt-0.5 line-clamp-2 block text-[10px] leading-4 text-zinc-400">{r.snippet}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className="pb-2 text-[9.5px] text-zinc-600">با اسپانسری سان‌جاب</p>
            </div>
          </div>
        )}

        {/* فریم سایت */}
        {!isHome && active && (
          <div
            className="h-full w-full bg-white"
            style={{ zoom }}
          >
            <iframe
              key={`${active.id}-${active.key}`}
              src={active.url}
              title={`صفحهٔ ${active.title}`}
              className="h-full w-full border-0"
              onLoad={() => setLoading(false)}
              referrerPolicy="no-referrer"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          </div>
        )}

        {/* تاریخچه */}
        {histOpen && (
          <div className="pengo-fadein absolute left-2 top-2 z-20 w-64 overflow-hidden rounded-xl border border-white/15 bg-zinc-900/95 shadow-2xl backdrop-blur">
            <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
              <p className="text-[11px] font-black text-zinc-100">تاریخچهٔ اخیر</p>
              <button
                onClick={() => setHistOpen(false)}
                className="grid size-5 place-items-center rounded text-zinc-500 transition hover:bg-white/10 hover:text-zinc-200"
                aria-label="بستن تاریخچه"
              >
                <X size={12} />
              </button>
            </div>
            <div className="os-scroll max-h-56 overflow-y-auto">
              {history.length === 0 ? (
                <p className="p-3 text-center text-[10px] text-zinc-500">هنوز جایی نرفته‌ای!</p>
              ) : (
                history.map((u) => (
                  <button
                    key={u}
                    onClick={() => navigate(u)}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-right text-[10.5px] text-zinc-300 transition hover:bg-white/5"
                    dir="ltr"
                  >
                    <Globe size={10} className="shrink-0 text-zinc-500" aria-hidden />
                    <span className="truncate">{hostOf(u)}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* نوار پایین: هشدار فریم */}
      {!isHome && (
        <div className="flex items-center gap-2 border-t border-white/10 bg-zinc-900/70 px-3 py-1.5 text-[9.5px] text-zinc-500">
          <ExternalLink size={10} className="shrink-0 text-zinc-600" aria-hidden />
          <span className="min-w-0 flex-1 truncate" dir="ltr">
            {active?.url}
          </span>
          <button
            onClick={() => openExternal(active?.url ?? '')}
            className="flex shrink-0 items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-[10px] font-bold text-zinc-300 transition hover:bg-white/10"
          >
            <ExternalLink size={10} />
            صفحه سفید است؟ باز کردن بیرونی
          </button>
        </div>
      )}
    </div>
  )
}
