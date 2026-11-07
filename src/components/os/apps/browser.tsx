'use client'

/* ====================================================================
   «سفربُر» — مرورگر چندتبی سان‌جاب‌اواس (نسخهٔ ۴٫۱)
   * رفع باگ حذف بوکمارک: حذف «بر اساس URL خود بوکمارک» انجام می‌شود،
     نه وضعیت بوکمارکِ تب فعال (باگ شناخته‌شدهٔ نسخه‌های قبل).
   * حالت خصوصی: بدون تاریخچه/بوکمارک/بازیابی نشست — با توضیح صادقانه.
   * بازیابی نشست: تب‌های باز بعد از بستن مرورگر برمی‌گردند.
   * انتخاب موتور جستجو، میان‌برهای کیبورد، مدیر بوکمارک و تاریخچه.
   * صادقانگی معماری: نمایش صفحه با iframe است؛ سایت‌هایی که اجازهٔ فریم
     نمی‌دهند (X-Frame-Options/CSP) با پیام شفاف + دکمهٔ باز کردن بیرونی.
   ==================================================================== */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookmarkPlus,
  Copy,
  Download,
  ExternalLink,
  EyeOff,
  Globe,
  History as HistoryIcon,
  House,
  Import,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  ShieldAlert,
  Star,
  Trash2,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { useOS } from '@/lib/os/store'
import {
  classifyAddress,
  hostOf,
  removeBookmark,
  toggleBookmarkFor,
  type Bookmark as BmItem,
} from '@/lib/os/releases'

const fa = (n: number) => n.toLocaleString('fa-IR')

/* ------------------------------- انواع ------------------------------- */

interface Tab {
  id: string
  title: string
  url: string // '' یعنی صفحهٔ خانه
  hist: string[]
  hi: number
  key: number
}

interface HistEntry {
  url: string
  at: number
}

interface WikiResult {
  title: string
  snippet: string
}

type EngineId = 'duckduckgo' | 'google' | 'bing' | 'brave' | 'wikipedia'

const ENGINES: { id: EngineId; name: string; build: (q: string) => string; note: string }[] = [
  {
    id: 'duckduckgo',
    name: 'DuckDuckGo',
    build: (q) => `https://duckduckgo.com/?q=${encodeURIComponent(q)}`,
    note: 'حریم خصوصی محور — نتایج در فریم باز نمی‌شود و بیرونی باز می‌شود',
  },
  {
    id: 'google',
    name: 'Google',
    build: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`,
    note: 'اجازهٔ فریم نمی‌دهد — بیرونی باز می‌شود',
  },
  {
    id: 'bing',
    name: 'Bing',
    build: (q) => `https://www.bing.com/search?q=${encodeURIComponent(q)}`,
    note: 'اجازهٔ فریم نمی‌دهد — بیرونی باز می‌شود',
  },
  {
    id: 'brave',
    name: 'Brave Search',
    build: (q) => `https://search.brave.com/search?q=${encodeURIComponent(q)}`,
    note: 'اجازهٔ فریم نمی‌دهد — بیرونی باز می‌شود',
  },
  {
    id: 'wikipedia',
    name: 'ویکی‌پدیا (داخل مرورگر)',
    build: (q) => `https://fa.m.wikipedia.org/w/index.php?search=${encodeURIComponent(q)}`,
    note: 'ویکی‌پدیا اجازهٔ فریم می‌دهد و داخل سفربُر باز می‌شود',
  },
]

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

const DEFAULT_BOOKMARKS: BmItem[] = [
  { label: 'نقشه', url: TILES[0].url },
  { label: 'ویکی‌پدیا', url: TILES[1].url },
  { label: 'هوا', url: TILES[2].url },
  { label: 'MDN', url: 'https://developer.mozilla.org' },
  { label: 'GitHub', url: 'https://github.com' },
]

const HIST_KEY = 'sunjob-browser-hist-v2'
const LEGACY_HIST_KEY = 'sunjob-browser-hist'
const BM_KEY = 'sunjob-browser-bm-v2'
const LEGACY_BM_KEY = 'sunjob-browser-bm'
const SESSION_KEY = 'sunjob-browser-session'
const ENGINE_KEY = 'sunjob-browser-engine'

const uid = () => Math.random().toString(36).slice(2, 9)

/* ------------------------- خواندن ذخیره‌سازی ------------------------- */

function loadHistory(): HistEntry[] {
  try {
    const raw = localStorage.getItem(HIST_KEY)
    if (raw) return (JSON.parse(raw) as HistEntry[]).slice(0, 100)
    // مهاجرت از نسخهٔ قدیمی (فهرست رشته‌ای)
    const legacy = localStorage.getItem(LEGACY_HIST_KEY)
    if (legacy) {
      const urls = JSON.parse(legacy) as string[]
      const now = Date.now()
      return urls.map((url, i) => ({ url, at: now - i * 60_000 }))
    }
  } catch {
    /* ignore */
  }
  return []
}

function loadBookmarks(): BmItem[] {
  try {
    const raw = localStorage.getItem(BM_KEY)
    if (raw) return JSON.parse(raw) as BmItem[]
    const legacy = localStorage.getItem(LEGACY_BM_KEY)
    if (legacy) {
      const pairs = JSON.parse(legacy) as { label: string; url: string }[]
      return pairs.map((p) => ({ label: p.label, url: p.url, addedAt: Date.now() }))
    }
  } catch {
    /* ignore */
  }
  return []
}

function loadSession(): { tabs: Tab[]; activeId: string } | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { tabs: Tab[]; activeId: string }
    if (!Array.isArray(parsed.tabs) || parsed.tabs.length === 0) return null
    return parsed
  } catch {
    return null
  }
}

/* ============================ اپ اصلی ============================ */

export default function BrowserApp() {
  const pushToast = useOS((s) => s.pushToast)

  const [tabs, setTabs] = useState<Tab[]>([])
  const [activeId, setActiveId] = useState('')
  const [addr, setAddr] = useState('')
  const [loading, setLoading] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [wikiQ, setWikiQ] = useState('')
  const [wikiResults, setWikiResults] = useState<WikiResult[] | null>(null)
  const [wikiBusy, setWikiBusy] = useState(false)
  const [panel, setPanel] = useState<'none' | 'history' | 'bookmarks' | 'engine'>('none')
  const [history, setHistory] = useState<HistEntry[]>([])
  const [userBm, setUserBm] = useState<BmItem[]>([])
  const [engine, setEngine] = useState<EngineId>('duckduckgo')
  const [privateMode, setPrivateMode] = useState(false)
  const [frameBlocked, setFrameBlocked] = useState(false)
  const [bmSearch, setBmSearch] = useState('')
  const [histSearch, setHistSearch] = useState('')
  const [editBm, setEditBm] = useState<{ url: string; label: string } | null>(null)
  const closedStack = useRef<Tab[]>([])
  const addrRef = useRef<HTMLInputElement>(null)
  const didInit = useRef(false)

  /* ---------------- init: نشست، بوکمارک، تاریخچه ---------------- */
  useEffect(() => {
    const saved = loadSession()
    if (saved) {
      setTabs(saved.tabs)
      setActiveId(saved.activeId && saved.tabs.some((t) => t.id === saved.activeId) ? saved.activeId : saved.tabs[0].id)
    } else {
      const first: Tab = { id: uid(), title: 'خانه', url: '', hist: [], hi: -1, key: 1 }
      setTabs([first])
      setActiveId(first.id)
    }
    setHistory(loadHistory())
    setUserBm(loadBookmarks())
    try {
      const e = localStorage.getItem(ENGINE_KEY)
      if (e && ENGINES.some((x) => x.id === e)) setEngine(e as EngineId)
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
    setFrameBlocked(false)
  }, [active?.id, active?.url, active?.key])

  /* ذخیرهٔ نشست — در حالت خصوصی هرگز */
  useEffect(() => {
    if (!didInit.current || privateMode) return
    try {
      const light = tabs.map((t) => ({ ...t }))
      localStorage.setItem(SESSION_KEY, JSON.stringify({ tabs: light, activeId }))
    } catch {
      /* ignore */
    }
  }, [tabs, activeId, privateMode])

  /* برخی سایت‌ها اجازهٔ فریم نمی‌دهند؛ تایم‌اوت = «کند یا مسدود» — صادقانه تفکیک نمی‌کنیم چون iframe راهی برای تشخیص دقیق نمی‌دهد */
  useEffect(() => {
    if (loading && active?.url) {
      const t = setTimeout(() => {
        setLoading((l) => {
          if (l) setFrameBlocked(true)
          return false
        })
      }, 6500)
      return () => clearTimeout(t)
    }
  }, [loading, active?.url])

  /* ---------------- بوکمارک: رفع باگ حذف ---------------- */

  /** تاگل بوکمارک برای URL مشخص — همان URL ای که دکمه به آن تعلق دارد */
  const toggleBookmarkForUrl = useCallback(
    (url: string) => {
      if (!url) return
      setUserBm((prev) => {
        const { list, added } = toggleBookmarkFor(prev, url, hostOf(url), 200)
        try {
          localStorage.setItem(BM_KEY, JSON.stringify(list))
        } catch {
          /* ignore */
        }
        pushToast({
          icon: added ? '⭐' : '☆',
          title: added ? 'بوکمارک شد' : 'بوکمارک حذف شد',
          body: hostOf(url),
        })
        return list
      })
    },
    [pushToast]
  )

  /** حذف دقیق یک بوکمارک با URL خودش — باگ قدیمی اینجا بود که تپ فعال تاگل می‌شد */
  const deleteBookmark = useCallback(
    (url: string) => {
      setUserBm((prev) => {
        const next = removeBookmark(prev, url)
        try {
          localStorage.setItem(BM_KEY, JSON.stringify(next))
        } catch {
          /* ignore */
        }
        return next
      })
    },
    []
  )

  /** ویرایش عنوان بوکمارک */
  const renameBookmark = useCallback((url: string, label: string) => {
    setUserBm((prev) => {
      const next = prev.map((b) => (b.url === url ? { ...b, label: label.trim() || hostOf(url) } : b))
      try {
        localStorage.setItem(BM_KEY, JSON.stringify(next))
      } catch {
        /* ignore */
      }
      return next
    })
  }, [])

  /* ---------------- تاریخچه ---------------- */

  const remember = useCallback(
    (url: string) => {
      if (!url || privateMode) return
      setHistory((prev) => {
        const next = [{ url, at: Date.now() }, ...prev.filter((h) => h.url !== url)].slice(0, 100)
        try {
          localStorage.setItem(HIST_KEY, JSON.stringify(next))
        } catch {
          /* ignore */
        }
        return next
      })
    },
    [privateMode]
  )

  const clearHistory = useCallback(
    (range: 'all' | 'hour' | 'day' | 'week') => {
      const cutoff = range === 'all' ? Infinity : Date.now() - (range === 'hour' ? 3600e3 : range === 'day' ? 86400e3 : 7 * 86400e3)
      setHistory((prev) => {
        const next = cutoff === Infinity ? [] : prev.filter((h) => h.at > cutoff)
        try {
          localStorage.setItem(HIST_KEY, JSON.stringify(next))
        } catch {
          /* ignore */
        }
        return next
      })
      pushToast({ icon: '🧹', title: 'تاریخچه پاک شد', body: range === 'all' ? 'کل تاریخچه حذف شد.' : 'بازهٔ انتخابی حذف شد.' })
    },
    [pushToast]
  )

  /* ---------------- ناوبری ---------------- */

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
    const { kind, url, query } = classifyAddress(raw)
    if (kind === 'url' && url) {
      navigate(url)
      return
    }
    if (query) {
      const eng = ENGINES.find((e) => e.id === engine) ?? ENGINES[0]
      navigate(eng.build(query))
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
      const data = (await res.json()) as { query?: { search?: { title: string; snippet: string }[] } }
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

  const newTab = useCallback(() => {
    const t: Tab = { id: uid(), title: 'خانه', url: '', hist: [], hi: -1, key: 1 }
    setTabs((prev) => [...prev, t])
    setActiveId(t.id)
  }, [])

  const duplicateTab = useCallback((id: string) => {
    setTabs((prev) => {
      const src = prev.find((t) => t.id === id)
      if (!src) return prev
      const copy: Tab = { ...src, id: uid(), key: 1 }
      setTabs((cur) => [...cur, copy])
      setActiveId(copy.id)
      return prev
    })
  }, [])

  const closeTab = (id: string) => {
    setTabs((prev) => {
      const idx = prev.findIndex((t) => t.id === id)
      const victim = prev[idx]
      if (victim && !privateMode) {
        closedStack.current = [...closedStack.current.slice(-9), victim]
      }
      const next = prev.filter((t) => t.id !== id)
      if (next.length === 0) {
        const fresh: Tab = { id: uid(), title: 'خانه', url: '', hist: [], hi: -1, key: 1 }
        setActiveId(fresh.id)
        return [fresh]
      }
      if (id === activeId) setActiveId(next[Math.max(0, idx - 1)].id)
      return next
    })
  }

  const restoreTab = useCallback(() => {
    const victim = closedStack.current.pop()
    if (!victim) {
      pushToast({ icon: '🗂️', title: 'تبی برای بازگردانی نیست', body: 'آخرین تب‌های بسته‌شده اینجا برمی‌گردند.' })
      return
    }
    setTabs((prev) => [...prev, victim])
    setActiveId(victim.id)
  }, [pushToast])

  const openExternal = (url: string) => {
    if (!url) return
    window.open(url, '_blank', 'noopener,noreferrer')
    pushToast({ icon: '🌐', title: 'در تب جدید باز شد', body: hostOf(url) })
  }

  /* خروجی/ورودی بوکمارک */
  const exportBookmarks = useCallback(() => {
    const blob = new Blob([JSON.stringify(userBm, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'sanjab-bookmarks.json'
    a.click()
    URL.revokeObjectURL(a.href)
  }, [userBm])

  const importBookmarks = useCallback(
    (f: File) => {
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const parsed = JSON.parse(String(reader.result)) as BmItem[]
          if (!Array.isArray(parsed)) throw new Error('ساختار فایل نامعتبر است')
          setUserBm((prev) => {
            const merged = [...prev]
            for (const b of parsed) {
              if (b?.url && typeof b.url === 'string' && !merged.some((x) => x.url === b.url)) {
                merged.push({ label: b.label || hostOf(b.url), url: b.url, addedAt: b.addedAt ?? Date.now() })
              }
            }
            try {
              localStorage.setItem(BM_KEY, JSON.stringify(merged))
            } catch {
              /* ignore */
            }
            return merged
          })
          pushToast({ icon: Import, title: 'بوکمارک‌ها وارد شد', body: `${fa(parsed.length)} مورد پردازش شد.` })
        } catch {
          pushToast({ icon: '⚠️', title: 'ورود ناموفق', body: 'فایل JSON بوکمارک معتبر نیست.' })
        }
      }
      reader.readAsText(f)
    },
    [pushToast]
  )

  /* ---------------- میان‌برهای کیبورد ---------------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey
      if (!mod && !e.altKey) return
      const k = e.key.toLowerCase()
      if (mod && k === 'l') {
        e.preventDefault()
        addrRef.current?.focus()
        addrRef.current?.select()
      } else if (mod && k === 't' && !e.shiftKey) {
        e.preventDefault()
        newTab()
      } else if (mod && k === 'w' && !e.shiftKey) {
        e.preventDefault()
        if (activeId) closeTab(activeId)
      } else if (mod && k === 't' && e.shiftKey) {
        e.preventDefault()
        restoreTab()
      } else if (mod && k === 'r') {
        e.preventDefault()
        if (active?.url) navigate(active.url)
      } else if (mod && k === 'd') {
        e.preventDefault()
        if (privateMode) {
          pushToast({ icon: EyeOff, title: 'حالت خصوصی', body: 'در این حالت بوکمارک جدید ذخیره نمی‌شود.' })
        } else if (active?.url) {
          toggleBookmarkForUrl(active.url)
        }
      } else if (mod && (k === '+' || k === '=')) {
        e.preventDefault()
        setZoom((z) => Math.min(1.6, Math.round((z + 0.1) * 10) / 10))
      } else if (mod && k === '-') {
        e.preventDefault()
        setZoom((z) => Math.max(0.5, Math.round((z - 0.1) * 10) / 10))
      } else if (mod && k === '0') {
        e.preventDefault()
        setZoom(1)
      } else if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault()
        back()
      } else if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault()
        forward()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activeId, active?.url, privateMode, newTab, restoreTab, navigate, toggleBookmarkForUrl, pushToast])

  const isHome = !active?.url
  const canBack = !!active && active.hi > 0
  const canForward = !!active && active.hi < active.hist.length - 1
  const isBookmarked = !!active?.url && userBm.some((b) => b.url === active.url)

  /* پیشنهادهای نوار آدرس از تاریخچه و بوکمارک */
  const suggestions = useMemo(() => {
    const q = addr.trim().toLowerCase()
    if (!q || q.startsWith('http')) return []
    const fromBm = userBm.filter((b) => b.url.toLowerCase().includes(q) || b.label.toLowerCase().includes(q)).slice(0, 3)
    const fromHist = history.filter((h) => h.url.toLowerCase().includes(q)).slice(0, 4)
    const seen = new Set<string>()
    return [...fromBm, ...fromHist.map((h) => ({ label: hostOf(h.url), url: h.url }))].filter((s) => {
      if (seen.has(s.url)) return false
      seen.add(s.url)
      return true
    })
  }, [addr, userBm, history])

  const filteredBm = useMemo(() => {
    const q = bmSearch.trim().toLowerCase()
    return q ? userBm.filter((b) => b.url.toLowerCase().includes(q) || b.label.toLowerCase().includes(q)) : userBm
  }, [userBm, bmSearch])

  const filteredHist = useMemo(() => {
    const q = histSearch.trim().toLowerCase()
    return q ? history.filter((h) => h.url.toLowerCase().includes(q)) : history
  }, [history, histSearch])

  return (
    <div className={`flex h-full w-full flex-col bg-zinc-950/70 ${privateMode ? 'ring-1 ring-inset ring-purple-500/40' : ''}`}>
      {/* نوار تب‌ها */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-white/10 bg-zinc-900/80 px-1.5 pt-1.5">
        {tabs.map((t) => (
          <div
            key={t.id}
            className={`group flex h-8 min-w-0 max-w-44 shrink-0 items-center gap-1.5 rounded-t-lg px-2.5 text-[11px] transition ${
              t.id === activeId
                ? privateMode
                  ? 'bg-purple-950/60 font-bold text-purple-100'
                  : 'bg-zinc-800 font-bold text-zinc-100'
                : 'bg-white/[0.03] text-zinc-400 hover:bg-white/[0.07]'
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
          onClick={newTab}
          className="grid size-6 shrink-0 place-items-center rounded-md text-zinc-400 transition hover:bg-white/10 hover:text-zinc-100"
          aria-label="تب جدید"
          title="تب جدید (Ctrl+T)"
        >
          <Plus size={13} />
        </button>
        <button
          onClick={() => activeId && duplicateTab(activeId)}
          disabled={!activeId}
          className="grid size-6 shrink-0 place-items-center rounded-md text-zinc-400 transition hover:bg-white/10 hover:text-zinc-100 disabled:opacity-30"
          aria-label="تکثیر تب"
          title="تکثیر تب فعلی"
        >
          <Copy size={11} />
        </button>
      </div>

      {/* نوار آدرس */}
      <div className="flex items-center gap-1.5 border-b border-white/10 bg-zinc-900/70 p-2">
        <button
          onClick={back}
          disabled={!canBack}
          className="grid size-7 place-items-center rounded-md text-zinc-400 transition hover:bg-white/10 hover:text-zinc-100 disabled:opacity-30"
          aria-label="عقب"
          title="عقب (Alt+→)"
        >
          <ArrowRight size={14} />
        </button>
        <button
          onClick={forward}
          disabled={!canForward}
          className="grid size-7 place-items-center rounded-md text-zinc-400 transition hover:bg-white/10 hover:text-zinc-100 disabled:opacity-30"
          aria-label="جلو"
          title="جلو (Alt+←)"
        >
          <ArrowLeft size={14} />
        </button>
        <button
          onClick={() => active?.url && navigate(active.url)}
          disabled={isHome}
          className="grid size-7 place-items-center rounded-md text-zinc-400 transition hover:bg-white/10 hover:text-zinc-100 disabled:opacity-30"
          aria-label="بارگذاری دوباره"
          title="بارگذاری دوباره (Ctrl+R)"
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
          className="relative flex min-w-0 flex-1 items-center"
          onSubmit={(e) => {
            e.preventDefault()
            goAddr(addr)
          }}
        >
          <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-full border border-white/10 bg-zinc-950 px-3 py-1.5 focus-within:border-[#f7931e]/60">
            <Search size={12} className="shrink-0 text-zinc-500" aria-hidden />
            <input
              ref={addrRef}
              value={addr}
              onChange={(e) => setAddr(e.target.value)}
              placeholder="آدرس سایت یا جستجو… (Ctrl+L)"
              dir="ltr"
              className="min-w-0 flex-1 bg-transparent text-left text-[11.5px] text-zinc-100 placeholder:text-zinc-600 outline-none"
              aria-label="نوار آدرس"
              spellCheck={false}
              autoComplete="off"
            />
            {loading && <Loader2 size={12} className="shrink-0 animate-spin text-[#f7931e]" aria-hidden />}
          </div>
          {suggestions.length > 0 && (
            <div className="pengo-fadein absolute inset-x-0 top-9 z-30 overflow-hidden rounded-xl border border-white/15 bg-zinc-900/95 shadow-2xl backdrop-blur">
              {suggestions.map((s) => (
                <button
                  key={s.url}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    navigate(s.url)
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-right text-[10.5px] text-zinc-300 transition hover:bg-white/5"
                >
                  <Globe size={10} className="shrink-0 text-zinc-500" aria-hidden />
                  <span className="min-w-0 flex-1 truncate" dir="ltr">{s.url}</span>
                  <span className="shrink-0 text-[9px] text-zinc-600">{s.label}</span>
                </button>
              ))}
            </div>
          )}
        </form>
        <button
          onClick={() => {
            if (privateMode) {
              pushToast({ icon: EyeOff, title: 'حالت خصوصی', body: 'در این حالت بوکمارک جدید ذخیره نمی‌شود.' })
              return
            }
            if (active?.url) toggleBookmarkForUrl(active.url)
          }}
          disabled={isHome}
          className={`grid size-7 place-items-center rounded-md transition hover:bg-white/10 disabled:opacity-30 ${
            isBookmarked ? 'text-amber-400' : 'text-zinc-400 hover:text-zinc-100'
          }`}
          aria-label="بوکمارک این صفحه"
          title="بوکمارک این صفحه (Ctrl+D)"
        >
          <BookmarkPlus size={14} />
        </button>
        <button
          onClick={() => setPanel((p) => (p === 'bookmarks' ? 'none' : 'bookmarks'))}
          className={`grid size-7 place-items-center rounded-md transition hover:bg-white/10 ${panel === 'bookmarks' ? 'text-[#f7931e]' : 'text-zinc-400 hover:text-zinc-100'}`}
          aria-label="مدیر بوکمارک"
          title="مدیر بوکمارک"
        >
          <Star size={13} />
        </button>
        <button
          onClick={() => setPanel((p) => (p === 'history' ? 'none' : 'history'))}
          className={`grid size-7 place-items-center rounded-md transition hover:bg-white/10 ${panel === 'history' ? 'text-[#f7931e]' : 'text-zinc-400 hover:text-zinc-100'}`}
          aria-label="تاریخچه"
          title="تاریخچه"
        >
          <HistoryIcon size={13} />
        </button>
        <button
          onClick={() => {
            const next = !privateMode
            setPrivateMode(next)
            pushToast({
              icon: EyeOff,
              title: next ? 'حالت خصوصی روشن شد' : 'حالت خصوصی خاموش شد',
              body: next
                ? 'تاریخچه، بوکمارک خودکار و بازیابی نشست در این حالت غیرفعال است. توجه: سایت‌ها و اینترنت‌گزین هنوز فعالیت تو را می‌بینند.'
                : 'از این پس دوباره ذخیره می‌شود.',
            })
          }}
          className={`grid size-7 place-items-center rounded-md transition hover:bg-white/10 ${privateMode ? 'text-purple-300' : 'text-zinc-400 hover:text-zinc-100'}`}
          aria-label="حالت خصوصی"
          title="حالت خصوصی — بدون ذخیرهٔ تاریخچه"
        >
          <EyeOff size={13} />
        </button>
        <span className="hidden min-w-10 text-center text-[9.5px] font-black text-zinc-500 sm:block">{fa(Math.round(zoom * 100))}٪</span>
        <button
          onClick={() => setZoom((z) => Math.min(1.6, Math.round((z + 0.1) * 10) / 10))}
          className="grid size-7 place-items-center rounded-md text-zinc-400 transition hover:bg-white/10 hover:text-zinc-100"
          aria-label="بزرگ‌نمایی"
          title="بزرگ‌نمایی (Ctrl+ +)"
        >
          <ZoomIn size={14} />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.5, Math.round((z - 0.1) * 10) / 10))}
          className="grid size-7 place-items-center rounded-md text-zinc-400 transition hover:bg-white/10 hover:text-zinc-100"
          aria-label="کوچک‌نمایی"
          title="کوچک‌نمایی (Ctrl+ -)"
        >
          <ZoomOut size={14} />
        </button>
      </div>

      {/* نوار بوکمارک سریع */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-white/10 bg-zinc-900/40 px-2 py-1">
        {DEFAULT_BOOKMARKS.map((b) => (
          <button
            key={b.label}
            onClick={() => navigate(b.url)}
            className="shrink-0 rounded-md px-2 py-1 text-[10px] font-bold text-zinc-400 transition hover:bg-white/10 hover:text-zinc-100"
          >
            {b.label}
          </button>
        ))}
        {userBm.length > 0 && <span className="mx-1 h-4 w-px shrink-0 bg-white/15" aria-hidden />}
        {userBm.map((b) => (
          <span key={b.url} className="flex shrink-0 items-center">
            <button
              onClick={() => navigate(b.url)}
              className="rounded-md px-2 py-1 text-[10px] font-bold text-amber-300/90 transition hover:bg-white/10"
              title={b.url}
            >
              {b.label}
            </button>
            <button
              onClick={() => deleteBookmark(b.url)}
              aria-label={`حذف بوکمارک ${b.label}`}
              title={`حذف «${b.label}»`}
              className="grid size-4 place-items-center rounded text-zinc-600 transition hover:text-rose-300"
            >
              <X size={9} />
            </button>
          </span>
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
                آدرس را بالا وارد کن یا یکی از میان‌برها را بزن. جستجو با موتور انتخابی تو انجام می‌شود.
              </p>

              {/* انتخاب موتور جستجو */}
              <div className="flex items-center justify-center gap-1.5">
                {ENGINES.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => {
                      setEngine(e.id)
                      try {
                        localStorage.setItem(ENGINE_KEY, e.id)
                      } catch {
                        /* ignore */
                      }
                    }}
                    title={e.note}
                    className={`rounded-full border px-2.5 py-1 text-[9.5px] font-bold transition ${
                      engine === e.id
                        ? 'border-[#f7931e]/60 bg-[#f7931e]/15 text-[#f7931e]'
                        : 'border-white/10 text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {e.name}
                  </button>
                ))}
              </div>

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

              {/* جستجوی سریع ویکی‌پدیا */}
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
          <div className="h-full w-full bg-white" style={{ zoom }}>
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

        {/* هشدار سایت رفریم‌نشدنی/کند */}
        {!isHome && frameBlocked && (
          <div className="pengo-fadein absolute inset-0 z-10 grid place-items-center bg-zinc-950/95 p-6 text-center">
            <div className="max-w-xs space-y-3">
              <ShieldAlert size={34} className="mx-auto text-amber-400" aria-hidden />
              <h3 className="text-sm font-black text-zinc-100">این صفحه داخل فریم باز نشد</h3>
              <p className="text-[11px] leading-5 text-zinc-400">
                دو دلیل ممکن است: سایت با سیاست امنیتی خودش (X-Frame-Options/CSP) اجازهٔ نمایش داخل مرورگرهای دیگر را
                نمی‌دهد، یا بارگذاری بیش از ۶٫۵ ثانیه طول کشیده. این محدودیت امنیتی سایت است، نه خرابی سان‌جاب‌اواس.
              </p>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => openExternal(active?.url ?? '')}
                  className="flex items-center gap-1.5 rounded-lg bg-[#f7931e] px-3 py-2 text-[11px] font-black text-white transition hover:brightness-110"
                >
                  <ExternalLink size={12} />
                  باز کردن بیرونی
                </button>
                <button
                  onClick={() => {
                    setFrameBlocked(false)
                    if (active?.url) navigate(active.url)
                  }}
                  className="rounded-lg border border-white/15 px-3 py-2 text-[11px] font-bold text-zinc-300 transition hover:bg-white/10"
                >
                  تلاش دوباره
                </button>
                <button
                  onClick={() => navigate('')}
                  className="rounded-lg border border-white/15 px-3 py-2 text-[11px] font-bold text-zinc-300 transition hover:bg-white/10"
                >
                  خانه
                </button>
              </div>
            </div>
          </div>
        )}

        {/* پنل بوکمارک‌ها */}
        {panel === 'bookmarks' && (
          <div className="pengo-fadein absolute left-2 top-2 z-20 flex w-72 flex-col overflow-hidden rounded-xl border border-white/15 bg-zinc-900/95 shadow-2xl backdrop-blur">
            <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
              <p className="text-[11px] font-black text-zinc-100">بوکمارک‌های من</p>
              <button
                onClick={() => setPanel('none')}
                className="grid size-5 place-items-center rounded text-zinc-500 transition hover:bg-white/10 hover:text-zinc-200"
                aria-label="بستن پنل بوکمارک"
              >
                <X size={12} />
              </button>
            </div>
            <div className="flex items-center gap-1.5 border-b border-white/10 px-2.5 py-1.5">
              <input
                value={bmSearch}
                onChange={(e) => setBmSearch(e.target.value)}
                placeholder="جستجو در بوکمارک…"
                className="min-w-0 flex-1 rounded-md border border-white/10 bg-zinc-950 px-2 py-1 text-[10.5px] text-zinc-200 outline-none"
                aria-label="جستجو در بوکمارک‌ها"
              />
              <button
                onClick={exportBookmarks}
                className="grid size-6 place-items-center rounded text-zinc-400 hover:text-emerald-300"
                title="خروجی JSON"
                aria-label="خروجی بوکمارک‌ها"
              >
                <Download size={11} />
              </button>
              <label className="grid size-6 cursor-pointer place-items-center rounded text-zinc-400 hover:text-amber-300" title="ورود JSON">
                <Import size={11} />
                <input
                  type="file"
                  accept="application/json"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) importBookmarks(f)
                    e.currentTarget.value = ''
                  }}
                />
              </label>
            </div>
            <div className="os-scroll max-h-60 overflow-y-auto">
              {filteredBm.length === 0 ? (
                <p className="p-3 text-center text-[10px] text-zinc-500">بوکمارکی نیست — با Ctrl+D صفحهٔ فعلی را ذخیره کن.</p>
              ) : (
                filteredBm.map((b) => {
                  const eb = editBm?.url === b.url ? editBm : null
                  return eb ? (
                    <div key={b.url} className="flex items-center gap-1 px-2.5 py-1.5">
                      <input
                        value={eb.label}
                        onChange={(e) => setEditBm({ url: b.url, label: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            renameBookmark(b.url, eb.label)
                            setEditBm(null)
                          }
                        }}
                        className="min-w-0 flex-1 rounded border border-white/15 bg-zinc-950 px-2 py-1 text-[10.5px] text-zinc-200 outline-none"
                        aria-label="عنوان جدید بوکمارک"
                        autoFocus
                      />
                      <button
                        onClick={() => {
                          renameBookmark(b.url, eb.label)
                          setEditBm(null)
                        }}
                        className="grid size-5 place-items-center rounded text-emerald-300 hover:bg-white/10"
                        aria-label="ذخیرهٔ عنوان"
                      >
                        ✓
                      </button>
                    </div>
                  ) : (
                    <div key={b.url} className="group flex items-center gap-1 px-2.5 py-1.5 transition hover:bg-white/5">
                      <button
                        onClick={() => navigate(b.url)}
                        className="flex min-w-0 flex-1 flex-col items-start text-right"
                      >
                        <span className="max-w-full truncate text-[10.5px] font-bold text-zinc-200">{b.label}</span>
                        <span className="max-w-full truncate text-[9px] text-zinc-600" dir="ltr">{b.url}</span>
                      </button>
                      <button
                        onClick={() => setEditBm({ url: b.url, label: b.label })}
                        className="grid size-5 shrink-0 place-items-center rounded text-zinc-500 opacity-0 transition hover:text-amber-300 group-hover:opacity-100"
                        aria-label={`ویرایش عنوان ${b.label}`}
                      >
                        <Pencil size={10} />
                      </button>
                      <button
                        onClick={() => deleteBookmark(b.url)}
                        className="grid size-5 shrink-0 place-items-center rounded text-zinc-500 opacity-0 transition hover:text-rose-300 group-hover:opacity-100"
                        aria-label={`حذف بوکمارک ${b.label}`}
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* پنل تاریخچه */}
        {panel === 'history' && (
          <div className="pengo-fadein absolute left-2 top-2 z-20 flex w-72 flex-col overflow-hidden rounded-xl border border-white/15 bg-zinc-900/95 shadow-2xl backdrop-blur">
            <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
              <p className="text-[11px] font-black text-zinc-100">تاریخچه</p>
              <button
                onClick={() => setPanel('none')}
                className="grid size-5 place-items-center rounded text-zinc-500 transition hover:bg-white/10 hover:text-zinc-200"
                aria-label="بستن پنل تاریخچه"
              >
                <X size={12} />
              </button>
            </div>
            {privateMode && (
              <p className="border-b border-purple-400/20 bg-purple-400/10 px-3 py-1.5 text-[9.5px] leading-4 text-purple-200">
                حالت خصوصی: چیزی ثبت نمی‌شود. توجه — این حالت جلوی ردیابیِ خود سایت‌ها و اینترنت‌گزین را نمی‌گیرد.
              </p>
            )}
            <div className="flex items-center gap-1.5 border-b border-white/10 px-2.5 py-1.5">
              <input
                value={histSearch}
                onChange={(e) => setHistSearch(e.target.value)}
                placeholder="جستجو در تاریخچه…"
                className="min-w-0 flex-1 rounded-md border border-white/10 bg-zinc-950 px-2 py-1 text-[10.5px] text-zinc-200 outline-none"
                aria-label="جستجو در تاریخچه"
              />
              <button
                onClick={() => clearHistory('hour')}
                className="rounded border border-white/10 px-1.5 py-1 text-[9px] text-zinc-400 hover:text-rose-300"
              >
                ۱ ساعت
              </button>
              <button
                onClick={() => clearHistory('day')}
                className="rounded border border-white/10 px-1.5 py-1 text-[9px] text-zinc-400 hover:text-rose-300"
              >
                ۲۴ ساعت
              </button>
              <button
                onClick={() => clearHistory('all')}
                className="rounded border border-white/10 px-1.5 py-1 text-[9px] text-zinc-400 hover:text-rose-300"
              >
                همه
              </button>
            </div>
            <div className="os-scroll max-h-60 overflow-y-auto">
              {filteredHist.length === 0 ? (
                <p className="p-3 text-center text-[10px] text-zinc-500">هنوز جایی نرفته‌ای!</p>
              ) : (
                filteredHist.map((h) => (
                  <button
                    key={h.url}
                    onClick={() => navigate(h.url)}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-right text-[10.5px] text-zinc-300 transition hover:bg-white/5"
                  >
                    <Globe size={10} className="shrink-0 text-zinc-500" aria-hidden />
                    <span className="min-w-0 flex-1 truncate" dir="ltr">{hostOf(h.url)}</span>
                    <span className="shrink-0 text-[9px] text-zinc-600">
                      {new Date(h.at).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
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
