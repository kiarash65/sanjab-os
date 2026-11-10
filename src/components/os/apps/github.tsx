'use client'

/* «گیت‌هاب»، جستجوی ریپو، ریپوهای من، فایل‌ها، ایسوها و README */

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AlertTriangle, ArrowRight, Bug, Check, ChevronLeft, Copy, Eye, EyeOff, ExternalLink, FileText,
  Folder, FolderGit2, GitFork, KeyRound, Loader2, MessageSquare, Plus, Search, Star, Trash2,
  UserPlus, Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useOS } from '@/lib/os/store'
import { ghApi, loadGhToken, saveGhToken, clearGhToken, isGhTokenSessionOnly } from '@/lib/os/integrations'

/* ------------------------------- انواع ------------------------------- */

interface GhUser {
  login: string
  name: string | null
  bio: string | null
  avatar_url: string
  html_url: string
  followers: number
  following: number
  public_repos: number
}

interface GhRepo {
  full_name: string
  description: string | null
  language: string | null
  stargazers_count: number
  forks_count: number
  updated_at: string
  html_url: string
}

interface GhContent {
  name: string
  path: string
  type: 'file' | 'dir'
  size: number
  content?: string
  download_url: string | null
}

interface GhLabel {
  id: number
  name: string
  color: string
}

interface GhIssue {
  id: number
  number: number
  title: string
  html_url: string
  comments: number
  labels: GhLabel[]
  user?: { login: string } | null
  pull_request?: Record<string, unknown>
}

type MainTab = 'search' | 'mine' | 'repo'
type RepoTab = 'files' | 'issues' | 'readme'
type FileView =
  | { kind: 'text'; name: string; text: string }
  | { kind: 'big'; name: string; downloadUrl: string | null }
  | null

/* ------------------------------ کمکی‌ها ------------------------------ */

const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178c6', JavaScript: '#f1e05a', Python: '#3572A5', Rust: '#dea584',
  Go: '#00ADD8', 'C++': '#f34b7d', Java: '#b07219', Shell: '#89e051', HTML: '#e34c26', CSS: '#563d7c',
}

const fmtNum = (n: number): string => n.toLocaleString('fa-IR')
const fmtDate = (iso: string): string => {
  try {
    return new Date(iso).toLocaleDateString('fa-IR')
  } catch {
    return iso
  }
}
const splitRepo = (full: string): { owner: string; repo: string } => {
  const [owner = '', repo = ''] = full.split('/')
  return { owner, repo }
}
const encPath = (path: string): string => path.split('/').map((s) => encodeURIComponent(s)).join('/')
/** base64 → متن یونیکد امن */
const decodeB64 = (b64: string): string =>
  new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\s/g, '')), (c) => c.charCodeAt(0)))
const errText = (err: unknown): string => (err instanceof Error ? err.message : 'خطای ناشناخته')

/* --------------------------- قطعات مشترک --------------------------- */

function ErrorBox({ text }: { text: string }) {
  return (
    <div role="alert" className="mx-3 flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs leading-5 text-rose-300">
      <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
      <span className="min-w-0">{text}</span>
    </div>
  )
}

function SkeletonList({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-1.5 px-3" aria-label="در حال بارگذاری">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-14 animate-pulse rounded-xl bg-zinc-800/60" style={{ animationDelay: `${i * 90}ms` }} />
      ))}
    </div>
  )
}

function LangDot({ lang }: { lang: string }) {
  return (
    <span className="inline-block size-2.5 shrink-0 rounded-full border border-white/20" style={{ backgroundColor: LANG_COLORS[lang] ?? '#8b8b8b' }} aria-hidden />
  )
}

function RepoCard({ repo, onOpen }: { repo: GhRepo; onOpen: (full: string) => void }) {
  return (
    <button type="button" onClick={() => onOpen(repo.full_name)}
      className="block w-full rounded-xl border border-white/10 bg-zinc-900/50 p-3 text-right transition hover:border-[#f7931e]/40 hover:bg-zinc-800/50">
      <span className="flex items-center gap-2">
        <span dir="ltr" className="min-w-0 flex-1 truncate text-xs font-bold text-zinc-100">{repo.full_name}</span>
        <span className="flex shrink-0 items-center gap-1 text-[10px] text-zinc-400"><Star className="size-3 text-amber-400" />{fmtNum(repo.stargazers_count)}</span>
        <span className="flex shrink-0 items-center gap-1 text-[10px] text-zinc-400"><GitFork className="size-3 text-teal-400" />{fmtNum(repo.forks_count)}</span>
      </span>
      {repo.description && <span className="mt-1 line-clamp-2 block text-[11px] leading-5 text-zinc-400">{repo.description}</span>}
      <span className="mt-1.5 flex items-center gap-3 text-[10px] text-zinc-500">
        {repo.language && <span className="flex items-center gap-1"><LangDot lang={repo.language} />{repo.language}</span>}
        <span>به‌روزرسانی: {fmtDate(repo.updated_at)}</span>
      </span>
    </button>
  )
}

function Empty({ icon, title, body }: { icon: string; title: string; body?: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-1 p-6 text-center">
      <span className="text-3xl" aria-hidden>{icon}</span>
      <p className="text-sm text-zinc-400">{title}</p>
      {body && <p className="text-xs text-zinc-600">{body}</p>}
    </div>
  )
}

/* --------------------------- اپ اصلی گیت‌هاب --------------------------- */

export default function GitHubApp() {
  const pushToast = useOS((s) => s.pushToast)

  /* توکن و پروفایل */
  const [token, setToken] = useState<string>(() => loadGhToken())
  const [tokenInput, setTokenInput] = useState<string>(() => loadGhToken())
  const [showToken, setShowToken] = useState(false)
  const [barOpen, setBarOpen] = useState<boolean>(() => !loadGhToken())
  const [sessionOnly, setSessionOnly] = useState<boolean>(() => isGhTokenSessionOnly())
  const tokenRef = useRef<HTMLInputElement | null>(null)
  const connectedOnce = useRef(false)
  const [profile, setProfile] = useState<GhUser | null>(null)
  const [profileErr, setProfileErr] = useState('')
  const [profileBusy, setProfileBusy] = useState(false)

  /* تب‌ها */
  const [tab, setTab] = useState<MainTab>('search')
  const [backTab, setBackTab] = useState<'search' | 'mine'>('search')
  const [repoTab, setRepoTab] = useState<RepoTab>('files')

  /* جستجو */
  const [searchQ, setSearchQ] = useState('')
  const [searchItems, setSearchItems] = useState<GhRepo[]>([])
  const [searchBusy, setSearchBusy] = useState(false)
  const [searchErr, setSearchErr] = useState('')
  const [searched, setSearched] = useState(false)

  /* ریپوهای من */
  const [mineItems, setMineItems] = useState<GhRepo[]>([])
  const [mineBusy, setMineBusy] = useState(false)
  const [mineErr, setMineErr] = useState('')

  /* مخزن باز: فایل‌ها */
  const [openRepo, setOpenRepo] = useState<GhRepo | null>(null)
  const [path, setPath] = useState('')
  const [entries, setEntries] = useState<GhContent[]>([])
  const [entriesBusy, setEntriesBusy] = useState(false)
  const [entriesErr, setEntriesErr] = useState('')
  const [fileView, setFileView] = useState<FileView>(null)
  const [fileBusy, setFileBusy] = useState(false)
  const [fileErr, setFileErr] = useState('')
  const [copiedFile, setCopiedFile] = useState(false)

  /* ایسوها */
  const [issues, setIssues] = useState<GhIssue[]>([])
  const [issuesBusy, setIssuesBusy] = useState(false)
  const [issuesErr, setIssuesErr] = useState('')
  const [showIssueForm, setShowIssueForm] = useState(false)
  const [issueTitle, setIssueTitle] = useState('')
  const [issueBody, setIssueBody] = useState('')
  const [issueErr, setIssueErr] = useState('')
  const [posting, setPosting] = useState(false)

  /* README */
  const [readme, setReadme] = useState('')
  const [readmeBusy, setReadmeBusy] = useState(false)
  const [readmeErr, setReadmeErr] = useState('')

  /* ------------------------- توکن و پروفایل ------------------------- */

  const saveToken = () => {
    const t = tokenInput.trim()
    if (!t) return
    saveGhToken(t, sessionOnly)
    setToken(t)
    pushToast({
      icon: '🔑',
      title: 'گیت‌هاب',
      body: sessionOnly ? 'توکن فقط برای همین نشست ذخیره شد (با بستن تب پاک می‌شود).' : 'توکن ذخیره شد، پیشنهاد: حداقل‌دسترسی (فقط repo یا public_repo) بده.',
    })
  }
  const clearToken = () => {
    clearGhToken()
    setToken(''); setTokenInput(''); setProfile(null); setProfileErr('')
    if (tab === 'mine') setTab('search')
    if (backTab === 'mine') setBackTab('search')
  }

  const connectProfile = async () => {
    const t = tokenInput.trim()
    setProfileBusy(true)
    setProfileErr('')
    try {
      const u = await ghApi<GhUser>('/user', t)
      saveGhToken(t, sessionOnly)
      setToken(t)
      setProfile(u)
      setBarOpen(false)
      if (!connectedOnce.current) {
        connectedOnce.current = true
        pushToast({ icon: '🐙', title: 'گیت‌هاب', body: 'گیت‌هاب وصل شد!' })
      }
    } catch (err) { setProfileErr(errText(err)) } finally { setProfileBusy(false) }
  }

  /* ----------------------------- جستجو ----------------------------- */

  const runSearch = async () => {
    const q = searchQ.trim()
    if (!q) return
    setSearchBusy(true)
    setSearchErr('')
    setSearched(true)
    try {
      const data = await ghApi<{ items: GhRepo[] }>(`/search/repositories?q=${encodeURIComponent(q)}&per_page=20`, token)
      setSearchItems(data.items ?? [])
    } catch (err) { setSearchErr(errText(err)) } finally { setSearchBusy(false) }
  }

  /* --------------------------- ریپوهای من --------------------------- */

  useEffect(() => {
    if (tab !== 'mine' || !token) return
    let alive = true
    setMineBusy(true)
    setMineErr('')
    ghApi<GhRepo[]>('/user/repos?sort=updated&per_page=30&affiliation=owner', token)
      .then((r) => { if (alive) setMineItems(r) })
      .catch((e: unknown) => { if (alive) setMineErr(errText(e)) })
      .finally(() => { if (alive) setMineBusy(false) })
    return () => { alive = false }
  }, [tab, token])

  /* ---------------------------- مخزن باز ---------------------------- */

  const openRepoView = (full: string) => {
    const { owner, repo } = splitRepo(full)
    if (!owner || !repo) return
    setOpenRepo((prev) =>
      prev && prev.full_name === full ? prev : { full_name: full, description: null, language: null, stargazers_count: 0, forks_count: 0, updated_at: '', html_url: `https://github.com/${full}` }
    )
    setPath(''); setEntries([]); setEntriesErr(''); setFileView(null); setFileErr('')
    setIssues([]); setIssuesErr(''); setShowIssueForm(false); setIssueErr('')
    setReadme(''); setReadmeErr('')
    setRepoTab('files')
    setBackTab((b) => (tab === 'mine' ? 'mine' : tab === 'repo' ? b : 'search'))
    setTab('repo')
  }

  const backFromRepo = () => {
    setOpenRepo(null)
    setTab(backTab)
  }

  /* فهرست فایل‌های مسیر فعلی */
  useEffect(() => {
    if (!openRepo || tab !== 'repo' || repoTab !== 'files') return
    const { owner, repo } = splitRepo(openRepo.full_name)
    let alive = true
    setEntriesBusy(true); setEntriesErr(''); setFileView(null)
    ghApi<GhContent[]>(`/repos/${owner}/${repo}/contents${path ? `/${encPath(path)}` : ''}`, token)
      .then((data) => {
        if (!alive) return
        if (Array.isArray(data)) setEntries(data)
        else setEntriesErr('پاسخ غیرمنتظره از گیت‌هاب.')
      })
      .catch((e: unknown) => { if (alive) setEntriesErr(errText(e)) })
      .finally(() => { if (alive) setEntriesBusy(false) })
    return () => { alive = false }
  }, [openRepo, tab, repoTab, path, token])

  const openFile = async (entry: GhContent) => {
    if (!openRepo) return
    const { owner, repo } = splitRepo(openRepo.full_name)
    setFileBusy(true); setFileErr(''); setCopiedFile(false)
    try {
      const data = await ghApi<GhContent>(`/repos/${owner}/${repo}/contents/${encPath(entry.path)}`, token)
      if (data.size >= 200000 || !data.content) {
        setFileView({ kind: 'big', name: data.name, downloadUrl: data.download_url })
      } else {
        setFileView({ kind: 'text', name: data.name, text: decodeB64(data.content) })
      }
    } catch (err) { setFileErr(errText(err)) } finally { setFileBusy(false) }
  }

  const copyFile = async () => {
    if (fileView?.kind !== 'text') return
    try {
      await navigator.clipboard.writeText(fileView.text)
      setCopiedFile(true)
      window.setTimeout(() => setCopiedFile(false), 1500)
    } catch {
      /* ignore */
    }
  }

  /* ----------------------------- ایسوها ----------------------------- */

  const loadIssues = useCallback(async () => {
    if (!openRepo) return
    const { owner, repo } = splitRepo(openRepo.full_name)
    setIssuesBusy(true); setIssuesErr('')
    try {
      const list = await ghApi<GhIssue[]>(`/repos/${owner}/${repo}/issues?state=open&per_page=20`, token)
      setIssues(list.filter((i) => !i.pull_request))
    } catch (err) { setIssuesErr(errText(err)) } finally { setIssuesBusy(false) }
  }, [openRepo, token])

  useEffect(() => {
    if (tab === 'repo' && repoTab === 'issues' && openRepo) void loadIssues()
  }, [tab, repoTab, openRepo, loadIssues])

  const createIssue = async () => {
    if (!openRepo || !token) return
    const { owner, repo } = splitRepo(openRepo.full_name)
    const title = issueTitle.trim()
    if (!title) {
      setIssueErr('عنوان ایسو نمی‌تواند خالی باشد.')
      return
    }
    setPosting(true)
    setIssueErr('')
    try {
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        body: JSON.stringify({ title, body: issueBody.trim() || undefined }),
      })
      if (!res.ok) {
        if (res.status === 401) throw new Error('توکن نامعتبر است یا منقضی شده (۴۰۱)')
        if (res.status === 403) throw new Error('دسترسی رد شد، توکن باید اجازهٔ نوشتن در این مخزن را داشته باشد (۴۰۳)')
        if (res.status === 404) throw new Error('ایسو برای این مخزن خاموش است یا مخزن پیدا نشد (۴۰۴)')
        if (res.status === 422) throw new Error('عنوان یا متن ایسو نامعتبر است (۴۲۲)')
        throw new Error(`ساخت ایسو شکست خورد (${res.status})`)
      }
      const created = (await res.json()) as GhIssue
      setIssues((prev) => [created, ...prev])
      setIssueTitle('')
      setIssueBody('')
      setShowIssueForm(false)
      pushToast({ icon: '🐛', title: 'گیت‌هاب', body: `ایسوی #${created.number} ساخته شد!` })
    } catch (err) { setIssueErr(errText(err)) } finally { setPosting(false) }
  }

  /* ----------------------------- README ----------------------------- */

  useEffect(() => {
    if (!openRepo || tab !== 'repo' || repoTab !== 'readme') return
    const { owner, repo } = splitRepo(openRepo.full_name)
    let alive = true
    setReadmeBusy(true); setReadmeErr(''); setReadme('')
    ;(async () => {
      try {
        const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
          headers: {
            Accept: 'application/vnd.github.raw',
            'X-GitHub-Api-Version': '2022-11-28',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        })
        if (!res.ok) {
          if (res.status === 404) throw new Error('این مخزن فایل README ندارد.')
          if (res.status === 403) throw new Error('محدودیت نرخ API، کمی صبر کن یا توکن بده (۴۰۳)')
          throw new Error(`خواندن README شکست خورد (${res.status})`)
        }
        const text = await res.text()
        if (alive) setReadme(text)
      } catch (err) { if (alive) setReadmeErr(errText(err)) } finally { if (alive) setReadmeBusy(false) }
    })()
    return () => { alive = false }
  }, [openRepo, tab, repoTab, token])

  /* ----------------------------- رندر ----------------------------- */

  const handleMainTab = (v: string) => {
    const t = v as MainTab
    if (t === 'mine' && !token) {
      setBarOpen(true)
      tokenRef.current?.focus()
      return
    }
    setTab(t)
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      {/* نوار توکن */}
      <div className="shrink-0 border-b border-white/10 bg-zinc-900/50">
        <div className="flex items-center gap-1.5 px-3 py-1.5">
          <Button type="button" size="sm" variant="ghost" onClick={() => setBarOpen((o) => !o)} aria-expanded={barOpen}
            aria-label="باز و بسته کردن نوار توکن" className="h-7 gap-1 px-2 text-xs text-zinc-300">
            <KeyRound className="size-3.5" />
            توکن
          </Button>
          {token ? (
            <Badge className="border-transparent bg-teal-500/15 text-[10px] text-teal-300">متصل ✓</Badge>
          ) : (
            <Badge variant="outline" className="border-white/10 text-[10px] text-zinc-500">ناشناس</Badge>
          )}
          <span className="ms-auto text-[10px] text-zinc-600">بدون توکن: فقط ریپوهای عمومی</span>
        </div>
        {barOpen && (
          <div className="border-t border-white/10 p-3">
            <p className="mb-2 text-[11px] leading-5 text-zinc-500">
              بدون توکن هم ریپوهای عمومی را می‌بینی (۶۰ درخواست/ساعت)؛ با توکن (fine-grained یا classic با scope repo) ریپوهای خودت و ساخت ایسو باز می‌شود.
              امنیت: حداقل‌دسترسی بده و بعد از کار <b>revoke</b> کن، ذخیره در مرورگر (localStorage/sessionStorage) در برابر XSS هم‌مبدا محافظت کامل نیست.
            </p>
            <label className="mb-2 flex w-fit cursor-pointer items-center gap-1.5 text-[11px] text-zinc-300">
              <input
                type="checkbox"
                checked={sessionOnly}
                onChange={(e) => setSessionOnly(e.target.checked)}
                className="size-3.5 accent-[#f7931e]"
              />
              فقط این نشست (با بستن تب پاک شود، امن‌تر)
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              <div className="relative min-w-40 flex-1">
                <Input ref={tokenRef} type={showToken ? 'text' : 'password'} value={tokenInput} onChange={(e) => setTokenInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && void connectProfile()} placeholder="ghp_… یا github_pat_…" dir="ltr"
                  aria-label="توکن گیت‌هاب" className="h-8 pe-8 text-left font-mono text-xs" />
                <button type="button" onClick={() => setShowToken((s) => !s)} aria-label={showToken ? 'پنهان کردن توکن' : 'نمایش توکن'}
                  className="absolute end-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                  {showToken ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </button>
              </div>
              <Button type="button" size="sm" onClick={saveToken} disabled={!tokenInput.trim()} className="h-8 shrink-0 px-2.5 text-xs">ذخیره</Button>
              <Button type="button" size="sm" variant="ghost" onClick={clearToken}
                className="h-8 shrink-0 gap-1 px-2 text-xs text-zinc-500 hover:bg-rose-500/10 hover:text-rose-300">
                <Trash2 className="size-3" />
                پاک کردن
              </Button>
              <Button type="button" size="sm" onClick={() => void connectProfile()} disabled={profileBusy || !tokenInput.trim()}
                className="h-8 shrink-0 gap-1 bg-[#f7931e] px-2.5 text-xs text-zinc-950 hover:bg-[#f7931e]/85">
                {profileBusy ? <Loader2 className="size-3.5 animate-spin" /> : <Users className="size-3.5" />}
                اتصال و دیدن پروفایل
              </Button>
            </div>
            {profileErr && <ErrorBox text={profileErr} />}
            {profile && (
              <div className="mt-2 flex items-start gap-3 rounded-xl border border-white/10 bg-zinc-900/60 p-3">
                <img src={profile.avatar_url} alt={`آواتار ${profile.login}`} className="size-14 shrink-0 rounded-full border border-white/10" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <a href={profile.html_url} target="_blank" rel="noreferrer" dir="ltr" className="truncate text-sm font-bold text-[#f7931e] hover:underline">
                      {profile.login}
                    </a>
                    <ExternalLink className="size-3 shrink-0 text-zinc-500" />
                  </div>
                  {profile.name && <p className="truncate text-xs text-zinc-200">{profile.name}</p>}
                  {profile.bio && <p className="mt-0.5 line-clamp-2 text-[11px] leading-5 text-zinc-400">{profile.bio}</p>}
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="gap-1 border-white/10 bg-white/5 text-[10px] font-normal text-zinc-300"><Users className="size-3" />{fmtNum(profile.followers)} دنبال‌کننده</Badge>
                    <Badge variant="outline" className="gap-1 border-white/10 bg-white/5 text-[10px] font-normal text-zinc-300"><UserPlus className="size-3" />{fmtNum(profile.following)} دنبال‌شده</Badge>
                    <Badge variant="outline" className="gap-1 border-white/10 bg-white/5 text-[10px] font-normal text-zinc-300"><FolderGit2 className="size-3" />{fmtNum(profile.public_repos)} ریپوی عمومی</Badge>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* تب‌های اصلی */}
      <Tabs value={tab} onValueChange={handleMainTab} className="flex min-h-0 flex-1 flex-col gap-0">
        <TabsList className="mx-3 mt-2 h-8 shrink-0 self-start">
          <TabsTrigger value="search" className="h-full px-3 text-xs">جستجو</TabsTrigger>
          <TabsTrigger value="mine" disabled={!token} className="h-full px-3 text-xs">ریپوهای من</TabsTrigger>
          <TabsTrigger value="repo" disabled={!openRepo} className="h-full px-3 text-xs">مخزن</TabsTrigger>
        </TabsList>

        {/* جستجو */}
        <TabsContent value="search" className="flex min-h-0 flex-1 flex-col gap-2 pt-1 outline-none">
          <div className="flex gap-1.5 px-3">
            <Input value={searchQ} onChange={(e) => setSearchQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && void runSearch()}
              placeholder="نام مخزن… مثلاً react" aria-label="جستجوی مخزن" className="h-8 flex-1 text-xs" />
            <Button type="button" size="sm" onClick={() => void runSearch()} disabled={searchBusy || !searchQ.trim()}
              className="h-8 gap-1 bg-[#f7931e] px-3 text-xs text-zinc-950 hover:bg-[#f7931e]/85">
              {searchBusy ? <Loader2 className="size-3.5 animate-spin" /> : <Search className="size-3.5" />}
              جستجو
            </Button>
          </div>
          {searchErr && <ErrorBox text={searchErr} />}
          {searchBusy ? (
            <SkeletonList rows={6} />
          ) : !searched ? (
            <Empty icon="🔍" title="نام یک مخزن را جستجو کن" body="۲۰ نتیجهٔ اول نمایش داده می‌شود" />
          ) : searchItems.length === 0 ? (
            <Empty icon="🔍" title="چیزی پیدا نشد" body="عبارت دیگری امتحان کن" />
          ) : (
            <div className="os-scroll min-h-0 flex-1 space-y-1.5 overflow-y-auto px-3 pb-3">
              {searchItems.map((r) => <RepoCard key={r.full_name} repo={r} onOpen={openRepoView} />)}
            </div>
          )}
        </TabsContent>

        {/* ریپوهای من */}
        <TabsContent value="mine" className="flex min-h-0 flex-1 flex-col gap-2 pt-1 outline-none">
          {!token ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
              <KeyRound className="size-8 text-zinc-600" />
              <p className="text-sm text-zinc-300">برای دیدن ریپوهای خودت، توکن بده</p>
              <Button type="button" size="sm" onClick={() => { setBarOpen(true); window.setTimeout(() => tokenRef.current?.focus(), 0) }}
                className="mt-1 bg-[#f7931e] text-xs text-zinc-950 hover:bg-[#f7931e]/85">
                رفتن به نوار توکن
              </Button>
            </div>
          ) : mineBusy ? (
            <SkeletonList rows={6} />
          ) : mineErr ? (
            <ErrorBox text={mineErr} />
          ) : mineItems.length === 0 ? (
            <Empty icon="🐧" title="ریپویی پیدا نشد" />
          ) : (
            <div className="os-scroll min-h-0 flex-1 space-y-1.5 overflow-y-auto px-3 pb-3">
              {mineItems.map((r) => <RepoCard key={r.full_name} repo={r} onOpen={openRepoView} />)}
            </div>
          )}
        </TabsContent>

        {/* مخزن باز */}
        <TabsContent value="repo" className="flex min-h-0 flex-1 flex-col outline-none">
          {openRepo && (
            <>
              <div className="flex shrink-0 items-center gap-2 border-b border-white/10 px-3 py-2">
                <Button type="button" size="icon" variant="ghost" aria-label="بازگشت به فهرست" title="بازگشت" onClick={backFromRepo}
                  className="size-7 shrink-0 text-zinc-400 hover:text-zinc-100">
                  <ArrowRight className="size-4" />
                </Button>
                <a href={openRepo.html_url} target="_blank" rel="noreferrer" dir="ltr" className="min-w-0 flex-1 truncate text-left text-sm font-bold text-zinc-100 hover:text-[#f7931e]">
                  {openRepo.full_name}
                </a>
                {openRepo.stargazers_count > 0 && (
                  <span className="flex shrink-0 items-center gap-1 text-[10px] text-zinc-400"><Star className="size-3 text-amber-400" />{fmtNum(openRepo.stargazers_count)}</span>
                )}
                {openRepo.language && (
                  <span className="flex shrink-0 items-center gap-1 text-[10px] text-zinc-400"><LangDot lang={openRepo.language} />{openRepo.language}</span>
                )}
                <a href={openRepo.html_url} target="_blank" rel="noreferrer" aria-label="باز کردن در گیت‌هاب" title="باز کردن در گیت‌هاب" className="shrink-0 text-zinc-500 hover:text-[#f7931e]">
                  <ExternalLink className="size-4" />
                </a>
              </div>

              <Tabs value={repoTab} onValueChange={(v) => setRepoTab(v as RepoTab)} className="flex min-h-0 flex-1 flex-col gap-0">
                <TabsList className="mx-3 mt-2 h-7 shrink-0 self-start">
                  <TabsTrigger value="files" className="h-full px-2.5 text-xs">فایل‌ها</TabsTrigger>
                  <TabsTrigger value="issues" className="h-full px-2.5 text-xs">ایسوها</TabsTrigger>
                  <TabsTrigger value="readme" className="h-full px-2.5 text-xs">README</TabsTrigger>
                </TabsList>

                {/* فایل‌ها */}
                <TabsContent value="files" className="flex min-h-0 flex-1 flex-col gap-2 pt-1 outline-none">
                  <div className="flex flex-wrap items-center gap-0.5 px-3 text-xs">
                    {fileBusy && <Loader2 className="me-1 size-3 animate-spin text-zinc-500" />}
                    <button type="button" onClick={() => setPath('')} className="rounded px-1 py-0.5 font-bold text-[#f7931e] hover:bg-white/5">
                      {splitRepo(openRepo.full_name).repo}
                    </button>
                    {path.split('/').filter(Boolean).map((seg, i, arr) => (
                      <span key={i} className="flex items-center gap-0.5">
                        <ChevronLeft className="size-3 text-zinc-600" />
                        <button type="button" onClick={() => setPath(arr.slice(0, i + 1).join('/'))} className="rounded px-1 py-0.5 text-zinc-300 hover:bg-white/5">
                          {seg}
                        </button>
                      </span>
                    ))}
                  </div>
                  {fileErr && <ErrorBox text={fileErr} />}
                  {fileView ? (
                    <div className="mx-3 mb-3 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-white/10 bg-zinc-900/60">
                      <div className="flex shrink-0 items-center gap-2 border-b border-white/10 px-2.5 py-1.5">
                        <span dir="ltr" className="min-w-0 flex-1 truncate text-left font-mono text-[11px] text-zinc-300">{fileView.name}</span>
                        {fileView.kind === 'text' && (
                          <Button type="button" size="sm" variant="ghost" onClick={() => void copyFile()} className="h-6 gap-1 px-1.5 text-[10px] text-zinc-400 hover:text-zinc-100">
                            {copiedFile ? <Check className="size-3" /> : <Copy className="size-3" />}
                            {copiedFile ? 'کپی شد' : 'کپی'}
                          </Button>
                        )}
                        <Button type="button" size="sm" variant="ghost" onClick={() => setFileView(null)} className="h-6 px-1.5 text-[10px] text-zinc-400 hover:text-zinc-100">
                          بازگشت به پوشه
                        </Button>
                      </div>
                      {fileView.kind === 'text' ? (
                        <pre dir="ltr" className="os-scroll min-h-0 flex-1 overflow-auto bg-black/60 p-3 text-left font-mono text-xs leading-5 text-zinc-300">
                          {fileView.text}
                        </pre>
                      ) : (
                        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
                          <FileText className="size-8 text-zinc-600" />
                          <p className="text-sm text-zinc-300">فایل بزرگ است، از گیت‌هاب دانلود کن</p>
                          {fileView.downloadUrl && (
                            <a href={fileView.downloadUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-[#f7931e] hover:underline">
                              دانلود {fileView.name}
                              <ExternalLink className="size-3" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  ) : entriesBusy ? (
                    <SkeletonList rows={7} />
                  ) : entriesErr ? (
                    <ErrorBox text={entriesErr} />
                  ) : entries.length === 0 ? (
                    <Empty icon="📂" title="این پوشه خالی است" />
                  ) : (
                    <div className="os-scroll min-h-0 flex-1 overflow-y-auto px-3 pb-3">
                      {entries.map((e) => (
                        <button key={e.path} type="button" onClick={() => (e.type === 'dir' ? setPath(e.path) : void openFile(e))}
                          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-right transition hover:bg-white/5">
                          {e.type === 'dir' ? <Folder className="size-4 shrink-0 text-teal-400" /> : <FileText className="size-4 shrink-0 text-zinc-500" />}
                          <span dir="ltr" className="min-w-0 flex-1 truncate text-left font-mono text-xs text-zinc-300">{e.name}</span>
                          {e.type === 'file' && (
                            <span className="shrink-0 text-[10px] text-zinc-600">
                              {e.size >= 1024 ? `${Math.round(e.size / 1024)} کیلوبایت` : `${e.size} بایت`}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* ایسوها */}
                <TabsContent value="issues" className="flex min-h-0 flex-1 flex-col gap-2 pt-1 outline-none">
                  <div className="flex items-center gap-2 px-3">
                    <span className="text-xs text-zinc-500">ایسوهای باز</span>
                    <div className="ms-auto">
                      {token ? (
                        <Button type="button" size="sm" variant={showIssueForm ? 'secondary' : 'default'}
                          onClick={() => { setShowIssueForm((s) => !s); setIssueErr('') }}
                          className="h-7 gap-1 bg-[#f7931e] px-2 text-xs text-zinc-950 hover:bg-[#f7931e]/85">
                          <Plus className="size-3.5" />
                          ایسوی جدید
                        </Button>
                      ) : (
                        <span className="text-[10px] text-zinc-600">برای ساخت ایسو توکن لازم است</span>
                      )}
                    </div>
                  </div>
                  {showIssueForm && token && (
                    <div className="mx-3 rounded-xl border border-white/10 bg-zinc-900/70 p-2.5">
                      <Input value={issueTitle} onChange={(e) => setIssueTitle(e.target.value)} placeholder="عنوان ایسو" aria-label="عنوان ایسو" className="mb-1.5 h-8 text-xs" />
                      <Textarea value={issueBody} onChange={(e) => setIssueBody(e.target.value)} placeholder="توضیحات (اختیاری)" aria-label="توضیحات ایسو" rows={3} className="mb-1.5 min-h-16 text-xs" />
                      {issueErr && <p role="alert" className="mb-1.5 text-xs text-rose-400">{issueErr}</p>}
                      <div className="flex justify-end gap-1.5">
                        <Button type="button" size="sm" variant="ghost" onClick={() => { setShowIssueForm(false); setIssueErr('') }} className="h-7 px-2 text-xs text-zinc-400">
                          بی‌خیال
                        </Button>
                        <Button type="button" size="sm" onClick={() => void createIssue()} disabled={posting || !issueTitle.trim()}
                          className="h-7 gap-1 bg-[#f7931e] px-2.5 text-xs text-zinc-950 hover:bg-[#f7931e]/85">
                          {posting ? <Loader2 className="size-3.5 animate-spin" /> : <Bug className="size-3.5" />}
                          ثبت ایسو
                        </Button>
                      </div>
                    </div>
                  )}
                  {issuesErr && <ErrorBox text={issuesErr} />}
                  {issuesBusy ? (
                    <SkeletonList rows={5} />
                  ) : issues.length === 0 ? (
                    <Empty icon="🎉" title="ایسوی بازی نیست" />
                  ) : (
                    <div className="os-scroll min-h-0 flex-1 space-y-1.5 overflow-y-auto px-3 pb-3">
                      {issues.map((i) => (
                        <a key={i.id} href={i.html_url} target="_blank" rel="noreferrer"
                          className="block rounded-xl border border-white/10 bg-zinc-900/50 p-2.5 transition hover:border-[#f7931e]/40 hover:bg-zinc-800/50">
                          <span className="flex items-center gap-1.5">
                            <span className="shrink-0 text-[10px] text-zinc-500">#{i.number}</span>
                            <span className="min-w-0 flex-1 truncate text-xs font-bold text-zinc-100">{i.title}</span>
                            {i.comments > 0 && (
                              <span className="flex shrink-0 items-center gap-0.5 text-[10px] text-zinc-400"><MessageSquare className="size-3" />{fmtNum(i.comments)}</span>
                            )}
                          </span>
                          <span className="mt-1 flex flex-wrap items-center gap-1">
                            {i.user?.login && <span dir="ltr" className="text-[10px] text-zinc-500">@{i.user.login}</span>}
                            {i.labels.map((l) => (
                              <span key={l.id} className="rounded-full border border-white/10 px-1.5 py-px text-[9px]" style={{ backgroundColor: `#${l.color}26`, color: `#${l.color}` }}>
                                {l.name}
                              </span>
                            ))}
                          </span>
                        </a>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* README */}
                <TabsContent value="readme" className="flex min-h-0 flex-1 flex-col pt-1 outline-none">
                  {readmeBusy ? (
                    <SkeletonList rows={6} />
                  ) : readmeErr ? (
                    <ErrorBox text={readmeErr} />
                  ) : readme ? (
                    <pre dir="auto" className="os-scroll min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap break-words px-3 pb-3 font-mono text-xs leading-6 text-zinc-300">
                      {readme}
                    </pre>
                  ) : (
                    <Empty icon="📄" title="README پیدا نشد" />
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
