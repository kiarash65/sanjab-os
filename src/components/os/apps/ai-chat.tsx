'use client'

/* «هوش‌یار»، گفتگوی هوش مصنوعی با کلید API خود کاربر */

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import {
  Check, Copy, Eye, EyeOff, Plus, RefreshCw, Send, Settings2, ShieldCheck, Square, Trash2, X,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useOS } from '@/lib/os/store'
import { AI_PRESETS, aiComplete, clearAICfg, loadAICfg, saveAICfg, type AICfg, type ChatMsg } from '@/lib/os/integrations'

/* ------------------------------- انواع ------------------------------- */

interface Chat {
  id: string
  title: string
  persona: string
  messages: ChatMsg[]
  updatedAt: number
}
interface ChatsStore {
  chats: Chat[]
  activeId: string | null
}

const CHATS_KEY = 'pengo-ai-chats-v1'

const uid = (): string => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

const makeTitle = (text: string): string => {
  const t = text.replace(/\s+/g, ' ').trim()
  return t.length > 24 ? `${t.slice(0, 24)}…` : t || 'گفتگوی تازه'
}

/* ----------------------------- پرسوناها ----------------------------- */

const PERSONAS: { id: string; label: string; prompt: string }[] = [
  { id: 'general', label: 'عمومی', prompt: '' },
  {
    id: 'teacher', label: 'معلم ترمینال لینوکس',
    prompt: 'تو معلم مهربان ترمینال لینوکس هستی. دستورها را خیلی ساده توضیح بده، همیشه یک یا چند دستور آمادهٔ قابل اجرا داخل بلوک کد بده و پاسخ‌هایت کوتاه باشد. به فارسی جواب بده.',
  },
  {
    id: 'translator', label: 'مترجم',
    prompt: 'تو مترجم دوزبانهٔ فارسی و انگلیسی هستی. متن فارسی را به انگلیسی و متن انگلیسی را به فارسی ترجمه کن. فقط ترجمهٔ تمیز و روان بده، بدون توضیح اضافه.',
  },
  {
    id: 'coder', label: 'کدنویس',
    prompt: 'تو دستیار برنامه‌نویسیِ مختصر و دقیقی هستی. مستقیم سراغ راه‌حل برو، کد تمیز به زبان درخواستی کاربر داخل بلوک کد بده و توضیح‌ها را کوتاه و به فارسی بنویس.',
  },
  {
    id: 'penguin', label: 'پنگوئن بامزه',
    prompt: 'تو «پنگوئن بامزه» هستی؛ دستیاری شوخ‌طبع که جواب‌های کاملاً مفید می‌دهد ولی هر جا مناسب بود یک شوخی سبک پنگویی اضافه می‌کند. هرگز از وظیفه غافل نشو. به فارسی پاسخ بده.',
  },
]

/* --------------------------- ذخیرهٔ گفتگوها --------------------------- */

const loadChats = (): ChatsStore => {
  try {
    const raw = window.localStorage.getItem(CHATS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as ChatsStore
      const chats = (Array.isArray(parsed?.chats) ? parsed.chats : []).filter(
        (c) => c && typeof c.id === 'string' && Array.isArray(c.messages) &&
          c.messages.every((m) => m && typeof m.content === 'string' && typeof m.role === 'string')
      )
      if (chats.length > 0) {
        return {
          chats: chats.map((c) => ({
            ...c,
            title: typeof c.title === 'string' ? c.title : '',
            persona: PERSONAS.some((p) => p.id === c.persona) ? c.persona : 'general',
          })),
          activeId: chats.some((c) => c.id === parsed.activeId) ? parsed.activeId : chats[0]!.id,
        }
      }
    }
  } catch {
    /* داده خراب؟ از نو شروع می‌کنیم */
  }
  const hello: Chat = {
    id: uid(), title: '', persona: 'general', updatedAt: Date.now(),
    messages: [{ role: 'assistant', content: 'سلام! من «هوش‌یار» هستم 🤖\nهر چه خواستی بپرس: کد، ترجمه، دستور ترمینال یا فقط گپ زدن.' }],
  }
  return { chats: [hello], activeId: hello.id }
}

/* ------------------------- رندر مارک‌داون سبک ------------------------- */

function renderInline(text: string, keyBase: string): ReactNode[] {
  const parts: ReactNode[] = []
  const regex = /(\*\*[^*]+\*\*|`[^`\n]+`)/g
  let last = 0
  let i = 0
  let m: RegExpExecArray | null
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    const tok = m[0]
    if (tok.startsWith('**')) {
      parts.push(<strong key={`${keyBase}-b${i}`}>{tok.slice(2, -2)}</strong>)
    } else {
      parts.push(
        <code key={`${keyBase}-c${i}`} dir="ltr" className="mx-0.5 rounded bg-black/50 px-1 py-0.5 font-mono text-[0.85em]">
          {tok.slice(1, -1)}
        </code>
      )
    }
    last = m.index + tok.length
    i++
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts
}

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      /* دسترسی کلیپ‌بورد نبود */
    }
  }
  return (
    <div dir="ltr" className="group relative my-1.5 overflow-hidden rounded-lg border border-white/10 bg-black/60 text-left font-mono text-xs">
      <Button type="button" size="icon" variant="ghost" aria-label="کپی کد" title="کپی کد" onClick={() => void copy()}
        className="absolute left-1.5 top-1.5 size-6 text-zinc-400 hover:bg-white/10 hover:text-zinc-100">
        {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
      </Button>
      <pre className="os-scroll max-h-64 overflow-auto p-3 pe-10" style={{ whiteSpace: 'pre' }}>
        <code>{code.replace(/\n$/, '')}</code>
      </pre>
    </div>
  )
}

function MarkdownLite({ content }: { content: string }) {
  return (
    <div className="text-sm leading-7" style={{ whiteSpace: 'pre-wrap' }}>
      {content.split('```').map((seg, idx) =>
        idx % 2 === 1 ? (
          <CodeBlock key={idx} code={seg.replace(/^[a-zA-Z0-9_+.#-]*\n?/, '')} />
        ) : (
          <span key={idx}>{renderInline(seg, `s${idx}`)}</span>
        )
      )}
    </div>
  )
}

/* ------------------------------ حباب‌ها ------------------------------ */

function Dots({ dark = false }: { dark?: boolean }) {
  return (
    <span className="flex items-center gap-1" aria-label="در حال نوشتن…">
      {[0, 150, 300].map((d) => (
        <span key={d} className={`size-1.5 animate-bounce rounded-full ${dark ? 'bg-zinc-900' : 'bg-[#f7931e]'}`} style={{ animationDelay: `${d}ms` }} />
      ))}
    </span>
  )
}

function Bubble({ msg }: { msg: ChatMsg }) {
  const [copied, setCopied] = useState(false)
  if (msg.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-[#f7931e]/90 px-3.5 py-2 text-sm leading-7 text-zinc-950" style={{ whiteSpace: 'pre-wrap' }}>
          {msg.content}
        </div>
      </div>
    )
  }
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(msg.content)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      /* ignore */
    }
  }
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-zinc-800/80 px-3.5 py-2">
        <MarkdownLite content={msg.content} />
        <button type="button" onClick={() => void copy()} aria-label="کپی پاسخ"
          className="mt-1 inline-flex items-center gap-1 rounded px-1 text-[10px] text-zinc-500 transition hover:bg-white/5 hover:text-zinc-300">
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
          {copied ? 'کپی شد' : 'کپی'}
        </button>
      </div>
    </div>
  )
}

/* ---------------------------- فرم اتصال ---------------------------- */

function ConfigForm({ initial, onConnected }: { initial?: AICfg | null; onConnected: (cfg: AICfg) => void }) {
  const [apiKey, setApiKey] = useState(initial?.apiKey ?? '')
  const [baseUrl, setBaseUrl] = useState(initial?.baseUrl ?? '')
  const [model, setModel] = useState(initial?.model ?? '')
  const [kind, setKind] = useState<'openai' | 'anthropic'>(initial?.kind ?? 'openai')
  const [showKey, setShowKey] = useState(false)
  const [error, setError] = useState('')
  const [testing, setTesting] = useState(false)

  const applyPreset = (id: string) => {
    const p = AI_PRESETS.find((x) => x.id === id)
    if (!p) return
    setBaseUrl(p.baseUrl)
    setModel(p.model)
    setKind(p.kind)
    setError('')
  }

  const saveAndTest = async () => {
    const key = apiKey.trim()
    const url = baseUrl.trim()
    const mdl = model.trim()
    if (!key || !url || !mdl) {
      setError('هر سه فیلد را پر کن: کلید، آدرس سرویس و نام مدل.')
      return
    }
    const cfg: AICfg = { kind: url.includes('anthropic') ? 'anthropic' : kind, baseUrl: url, apiKey: key, model: mdl }
    setTesting(true)
    setError('')
    try {
      saveAICfg(cfg)
      await aiComplete([{ role: 'user', content: 'سلام! فقط بگو وصله' }], cfg)
      onConnected(cfg)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تست اتصال شکست خورد.')
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div>
        <p className="mb-1 text-[11px] font-bold text-zinc-400">سرویس آماده:</p>
        <div className="flex flex-wrap gap-1.5">
          {AI_PRESETS.map((p) => (
            <button key={p.id} type="button" title={p.note} onClick={() => applyPreset(p.id)}
              className={`rounded-full border px-2.5 py-1 text-[11px] transition ${
                baseUrl === p.baseUrl
                  ? 'border-[#f7931e]/60 bg-[#f7931e]/15 text-[#f7931e]'
                  : 'border-white/10 bg-white/5 text-zinc-300 hover:border-white/25 hover:bg-white/10'
              }`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div className="relative">
        <Input type={showKey ? 'text' : 'password'} value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-…" dir="ltr" aria-label="کلید API" className="h-8 pe-8 text-left font-mono text-xs" />
        <button type="button" onClick={() => setShowKey((s) => !s)} aria-label={showKey ? 'پنهان کردن کلید' : 'نمایش کلید'}
          className="absolute end-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
          {showKey ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
        </button>
      </div>
      <Input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://api.openai.com/v1" dir="ltr" aria-label="آدرس سرویس" className="h-8 text-left font-mono text-xs" />
      <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="gpt-4o-mini" dir="ltr" aria-label="نام مدل" className="h-8 text-left font-mono text-xs" />
      {error && <p role="alert" className="text-xs leading-5 text-rose-400">{error}</p>}
      <Button type="button" onClick={() => void saveAndTest()} disabled={testing} className="h-8 gap-1.5 bg-[#f7931e] text-xs text-zinc-950 hover:bg-[#f7931e]/85">
        {testing ? <Dots dark /> : <ShieldCheck className="size-3.5" />}
        ذخیره و تست
      </Button>
    </div>
  )
}

/* ----------------------------- آنبوردینگ ----------------------------- */

function Onboarding({ onConnected }: { onConnected: (cfg: AICfg) => void }) {
  return (
    <div className="os-scroll flex h-full w-full items-center justify-center overflow-y-auto p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900/60 p-5 shadow-2xl backdrop-blur">
        <div className="mb-3 flex items-center gap-2.5">
          <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#f7931e] to-violet-500 text-xl" aria-hidden>🤖</span>
          <div>
            <h2 className="text-sm font-bold text-zinc-100">به «هوش‌یار» خوش آمدی</h2>
            <p className="text-[11px] text-zinc-500">دستیار هوش مصنوعی سان‌جاب‌او‌اس</p>
          </div>
        </div>
        <p className="mb-2 text-xs leading-6 text-zinc-400">
          می‌توانی «هوش‌یار» را به <strong className="text-zinc-200">هر سرویس هوش مصنوعی‌ای</strong> که خودت کلیدش را داری وصل کنی:
          OpenAI، OpenRouter، Groq، DeepSeek، Claude یا GLM (چی‌پو)، فقط کلید و نام مدل را بده.
        </p>
        <p className="mb-3 flex items-start gap-1.5 rounded-lg border border-teal-500/25 bg-teal-500/10 p-2 text-[11px] leading-5 text-teal-300">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
          کلید فقط در مرورگر خودت ذخیره می‌شود و درخواست مستقیم به سرویس می‌رود.
        </p>
        <p className="mb-3 flex items-start gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-[11px] leading-5 text-amber-300">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
          این در نسخه نصبی روی سیستم فعال نیست و باید در «هوش‌یار» API key بزنی.
        </p>
        <ConfigForm onConnected={onConnected} />
      </div>
    </div>
  )
}

/* -------------------------- اپ اصلی گفتگو -------------------------- */

export default function AIChatApp() {
  const pushToast = useOS((s) => s.pushToast)
  const [cfg, setCfg] = useState<AICfg | null>(() => loadAICfg())
  const [store, setStore] = useState<ChatsStore>(loadChats)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const abortRef = useRef<AbortController | null>(null)
  const greetedRef = useRef(false)
  const listRef = useRef<HTMLDivElement | null>(null)
  const taRef = useRef<HTMLTextAreaElement | null>(null)

  const activeChat = store.chats.find((c) => c.id === store.activeId) ?? store.chats[0] ?? null
  const msgCount = activeChat?.messages.length ?? 0

  /* ذخیرهٔ خودکار با تاخیر ۴۰۰ میلی‌ثانیه */
  useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        window.localStorage.setItem(CHATS_KEY, JSON.stringify(store))
      } catch {
        /* حافظه پر؟ بی‌خیال */
      }
    }, 400)
    return () => window.clearTimeout(t)
  }, [store])

  /* اسکرول به آخرین پیام */
  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [msgCount, busy])

  /* بلندشدن خودکار جعبهٔ متن (۲ تا ۵ سطر) */
  useEffect(() => {
    const el = taRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }, [draft])

  const patchChat = useCallback((id: string, patch: (c: Chat) => Chat) => {
    setStore((s) => ({
      ...s,
      chats: s.chats.map((c) => (c.id === id ? { ...patch(c), updatedAt: Date.now() } : c)),
    }))
  }, [])

  const runCompletion = async (chatId: string, personaId: string, messages: ChatMsg[]) => {
    if (!cfg) {
      setSettingsOpen(true)
      return
    }
    setBusy(true)
    const ac = new AbortController()
    abortRef.current = ac
    try {
      const persona = PERSONAS.find((p) => p.id === personaId) ?? PERSONAS[0]!
      const payload: ChatMsg[] = [
        ...(persona.prompt ? [{ role: 'system' as const, content: persona.prompt }] : []),
        ...messages.filter((m) => m.role !== 'system'),
      ]
      const reply = await aiComplete(payload, cfg, ac.signal)
      patchChat(chatId, (c) => ({ ...c, messages: [...c.messages, { role: 'assistant', content: reply }] }))
      if (!greetedRef.current) {
        greetedRef.current = true
        pushToast({ icon: '🤖', title: 'هوش‌یار', body: '«هوش‌یار» آماده است! سؤالت را بپرس.' })
      }
    } catch (err) {
      const aborted = err instanceof DOMException && err.name === 'AbortError'
      const body = aborted ? '⏹ درخواست متوقف شد.' : err instanceof Error ? err.message : 'خطای ناشناخته'
      patchChat(chatId, (c) => ({ ...c, messages: [...c.messages, { role: 'system', content: body }] }))
    } finally {
      setBusy(false)
      abortRef.current = null
    }
  }

  const send = () => {
    const chat = activeChat
    const text = draft.trim()
    if (!chat || !text || busy) return
    const messages: ChatMsg[] = [...chat.messages, { role: 'user', content: text }]
    patchChat(chat.id, (c) => ({ ...c, messages, title: c.title || makeTitle(text) }))
    setDraft('')
    void runCompletion(chat.id, chat.persona, messages)
  }

  const regenerate = () => {
    const chat = activeChat
    if (!chat || busy) return
    const msgs = [...chat.messages]
    while (msgs.length > 0 && msgs[msgs.length - 1]!.role !== 'user') msgs.pop()
    if (msgs.length === 0) return
    patchChat(chat.id, (c) => ({ ...c, messages: msgs }))
    void runCompletion(chat.id, chat.persona, msgs)
  }

  const newChat = () => {
    const chat: Chat = {
      id: uid(), title: '', persona: activeChat?.persona ?? 'general', messages: [], updatedAt: Date.now(),
    }
    setStore((s) => ({ chats: [chat, ...s.chats], activeId: chat.id }))
    setConfirmId(null)
    setDraft('')
  }

  const deleteChat = (id: string) => {
    setStore((s) => {
      const rest = s.chats.filter((c) => c.id !== id)
      if (rest.length === 0) {
        const fresh: Chat = { id: uid(), title: '', persona: 'general', messages: [], updatedAt: Date.now() }
        return { chats: [fresh], activeId: fresh.id }
      }
      return { chats: rest, activeId: s.activeId === id ? rest[0]!.id : s.activeId }
    })
    setConfirmId(null)
  }

  const removeCfg = () => {
    clearAICfg()
    setCfg(null)
    setSettingsOpen(false)
    pushToast({ icon: '🗑️', title: 'هوش‌یار', body: 'کلید API حذف شد.' })
  }

  if (!cfg) {
    return (
      <Onboarding
        onConnected={(c) => {
          setCfg(c)
          pushToast({ icon: '🤖', title: 'هوش‌یار', body: 'وصل شد! حالا بپرس 🎉' })
        }}
      />
    )
  }

  const sortedChats = [...store.chats].sort((a, b) => b.updatedAt - a.updatedAt)

  return (
    <div className="flex h-full w-full">
      {/* فهرست گفتگوها، سمت راست در چیدمان راست‌به‌چپ */}
      <aside className="flex w-40 shrink-0 flex-col border-l border-white/10 bg-zinc-900/50 sm:w-52">
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-2 py-1.5">
          <span className="px-1 text-[11px] font-bold text-zinc-400">گفتگوها</span>
          <Button type="button" size="icon" variant="ghost" aria-label="گفتگوی جدید" title="گفتگوی جدید" onClick={newChat}
            className="size-7 text-[#f7931e] hover:bg-white/10 hover:text-[#f7931e]">
            <Plus className="size-4" />
          </Button>
        </div>
        <div className="os-scroll min-h-0 flex-1 overflow-y-auto p-1.5">
          {sortedChats.map((c) => {
            const armed = confirmId === c.id
            return (
              <div key={c.id} className={`group mb-1 flex items-center gap-0.5 rounded-lg pe-0.5 transition ${c.id === activeChat?.id ? 'bg-white/10' : 'hover:bg-white/5'}`}>
                <button type="button" onClick={() => { setStore((s) => ({ ...s, activeId: c.id })); setConfirmId(null) }} className="min-w-0 flex-1 py-1.5 pe-1 text-right">
                  <span className={`block truncate text-xs font-bold ${c.id === activeChat?.id ? 'text-zinc-100' : 'text-zinc-300'}`}>
                    {c.title || 'گفتگوی تازه'}
                  </span>
                  <span className="mt-0.5 block truncate text-[10px] text-zinc-500">
                    {armed ? <span className="text-rose-400">مطمئنی؟ دوباره بزن</span> : (
                      <>{PERSONAS.find((p) => p.id === c.persona)?.label ?? 'عمومی'} · {new Date(c.updatedAt).toLocaleDateString('fa-IR')}</>
                    )}
                  </span>
                </button>
                <Button type="button" size="icon" variant="ghost" onClick={() => (armed ? deleteChat(c.id) : setConfirmId(c.id))}
                  aria-label={armed ? 'تأیید حذف گفتگو' : `حذف گفتگوی ${c.title || 'بی‌نام'}`} title={armed ? 'دوباره بزن تا حذف شود' : 'حذف گفتگو'}
                  className={`size-6 shrink-0 ${armed ? 'bg-rose-500/15 text-rose-400 hover:bg-rose-500/25' : 'text-zinc-600 hover:bg-white/10 hover:text-rose-300'}`}>
                  <Trash2 className="size-3" />
                </Button>
              </div>
            )
          })}
        </div>
      </aside>

      {/* ناحیهٔ اصلی گفتگو */}
      <section className="flex min-w-0 flex-1 flex-col">
        {/* نوار ابزار */}
        <div className="flex shrink-0 items-center gap-1.5 border-b border-white/10 px-2 py-1.5">
          <Button type="button" size="sm" variant={settingsOpen ? 'secondary' : 'ghost'} onClick={() => setSettingsOpen((o) => !o)}
            aria-expanded={settingsOpen} aria-label="تنظیمات اتصال" className="h-7 gap-1 px-2 text-xs text-zinc-300">
            <Settings2 className="size-3.5" />
            تنظیمات
          </Button>
          <Badge variant="outline" dir="ltr" title={cfg.model} className="max-w-36 truncate border-white/10 bg-white/5 font-mono text-[10px] font-normal text-zinc-400">
            {cfg.model}
          </Badge>
          <div className="ms-auto">
            <Select value={activeChat?.persona ?? 'general'} onValueChange={(v) => activeChat && patchChat(activeChat.id, (c) => ({ ...c, persona: v }))}>
              <SelectTrigger size="sm" aria-label="شخصیت پاسخ‌دهنده" className="h-7 w-fit gap-1 px-2 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERSONAS.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="text-xs">{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* کشوی تنظیمات */}
        {settingsOpen && (
          <div className="shrink-0 border-b border-white/10 bg-zinc-900/70 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-300">اتصال به سرویس هوش مصنوعی</span>
              <div className="flex items-center gap-1">
                <Button type="button" size="sm" variant="ghost" onClick={removeCfg} className="h-7 gap-1 px-2 text-xs text-rose-300 hover:bg-rose-500/10">
                  <Trash2 className="size-3.5" />
                  حذف کلید
                </Button>
                <Button type="button" size="icon" variant="ghost" aria-label="بستن تنظیمات" onClick={() => setSettingsOpen(false)}
                  className="size-7 text-zinc-500 hover:text-zinc-200">
                  <X className="size-3.5" />
                </Button>
              </div>
            </div>
            <ConfigForm
              initial={cfg}
              onConnected={(c) => {
                setCfg(c)
                setSettingsOpen(false)
                pushToast({ icon: '🤖', title: 'هوش‌یار', body: 'اتصال به‌روزرسانی شد! ✅' })
              }}
            />
          </div>
        )}

        {/* پیام‌ها */}
        <div ref={listRef} className="os-scroll min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
          {msgCount === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
              <span className="text-4xl" aria-hidden>🐧</span>
              <p className="text-sm font-bold text-zinc-300">از «هوش‌یار» بپرس!</p>
              <p className="text-xs leading-5 text-zinc-500">کد، ترجمه، دستور ترمینال لینوکس یا هر سؤال دیگری که داری.</p>
            </div>
          ) : (
            activeChat?.messages.map((m, i) =>
              m.role === 'system' ? (
                <div key={i} className="flex justify-center">
                  <div role="alert" className="max-w-[92%] rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-center text-xs leading-6 text-rose-300">
                    {m.content}
                  </div>
                </div>
              ) : (
                <Bubble key={i} msg={m} />
              )
            )
          )}
          {busy && (
            <div className="flex justify-start" aria-label="هوش‌یار در حال نوشتن است">
              <div className="flex items-center rounded-2xl rounded-br-sm bg-zinc-800/80 px-4 py-3.5">
                <Dots />
              </div>
            </div>
          )}
        </div>

        {/* جعبهٔ نوشتن */}
        <div className="shrink-0 border-t border-white/10 p-2">
          <div className="flex items-end gap-1.5 rounded-xl border border-white/10 bg-zinc-900/60 p-1.5">
            <Textarea
              ref={taRef} value={draft} onChange={(e) => setDraft(e.target.value)} rows={2}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              aria-label="متن پیام" placeholder={busy ? 'هوش‌یار مشغول نوشتن است…' : 'پیامت را بنویس… (Enter = ارسال)'}
              className="field-sizing-fixed min-h-[40px] flex-1 resize-none border-0 bg-transparent px-2 text-sm leading-6 shadow-none focus-visible:ring-0"
            />
            {busy ? (
              <Button type="button" size="icon" variant="destructive" aria-label="توقف پاسخ" title="توقف" onClick={() => abortRef.current?.abort()} className="size-8 shrink-0">
                <Square className="size-3.5" />
              </Button>
            ) : (
              <Button type="button" size="icon" aria-label="ارسال پیام" title="ارسال (Enter)" onClick={send} disabled={!draft.trim()}
                className="size-8 shrink-0 bg-[#f7931e] text-zinc-950 hover:bg-[#f7931e]/85">
                <Send className="size-3.5 -scale-x-100" />
              </Button>
            )}
          </div>
          <div className="mt-1 flex items-center gap-2 px-1">
            <button type="button" onClick={regenerate} disabled={busy || msgCount === 0} aria-label="تولید دوبارهٔ آخرین پاسخ"
              className="inline-flex items-center gap-1 rounded px-1 text-[10px] text-zinc-500 transition hover:bg-white/5 hover:text-zinc-300 disabled:pointer-events-none disabled:opacity-40">
              <RefreshCw className="size-3" />
              تولید دوبارهٔ پاسخ
            </button>
            <span className="ms-auto text-[10px] text-zinc-600">Shift+Enter = خط جدید</span>
          </div>
        </div>
      </section>
    </div>
  )
}
