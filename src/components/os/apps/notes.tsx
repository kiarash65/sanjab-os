'use client'

import { useEffect, useRef, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

interface Note {
  id: string
  title: string
  body: string
  updatedAt: number
}

const STORAGE_KEY = 'pengo-notes'

const WELCOME_BODY = `سلام پنگویی عزیز! 🐧

این دفترچه رسمی یادداشت‌های سیستمه. چند قانون بامزه:
• هرچی بنویسی همین‌جا ذخیره می‌شه (توی مرورگر خودت).
• گربه‌های سیستم قول دادن متن‌هات رو نخونن... بیشترش.
• دکمه ➕ بالای لیست، یادداشت تازه می‌سازه.
• دکمه 🗑 پاک می‌کنه؛ ولی اول ازت می‌پرسه، نگران نباش.

حالا یه چی قشنگ بنویس. دنیا منتظره! ✍️`

const uid = (): string =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

const makeNote = (title: string, body: string): Note => ({
  id: uid(),
  title,
  body,
  updatedAt: Date.now(),
})

const isNote = (value: unknown): value is Note => {
  if (typeof value !== 'object' || value === null) return false
  const o = value as Record<string, unknown>
  return (
    typeof o.id === 'string' &&
    typeof o.title === 'string' &&
    typeof o.body === 'string' &&
    typeof o.updatedAt === 'number'
  )
}

const fmtDate = (ts: number): string => new Date(ts).toLocaleDateString('fa-IR')

const loadNotes = (): Note[] => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        const loaded = parsed.filter(isNote)
        if (loaded.length > 0) return loaded
      }
    }
  } catch {
    /* اگه داده خراب بود، از نو شروع می‌کنیم */
  }
  return [makeNote('به دفترچه خوش اومدی 👋', WELCOME_BODY)]
}

export default function NotesApp() {
  const [notes, setNotes] = useState<Note[]>(loadNotes)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState(0)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const titleRef = useRef<HTMLInputElement>(null)

  const effectiveId = activeId ?? notes[0]?.id ?? null
  const active = notes.find((n) => n.id === effectiveId) ?? null

  // ذخیره خودکار با تاخیر ۵۰۰ میلی‌ثانیه
  useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
        setSavedAt(Date.now())
      } catch {
        /* اگه حافظه پر شده باشه هم غصه نخور */
      }
    }, 500)
    return () => window.clearTimeout(t)
  }, [notes])

  // چشمک «ذخیره شد»
  useEffect(() => {
    if (savedAt === 0) return
    const t = window.setTimeout(() => setSavedAt(0), 1200)
    return () => window.clearTimeout(t)
  }, [savedAt])

  const sorted = [...notes].sort((a, b) => b.updatedAt - a.updatedAt)

  const updateActive = (patch: Partial<Omit<Note, 'id'>>) => {
    if (!effectiveId) return
    setNotes((ns) =>
      ns.map((n) =>
        n.id === effectiveId ? { ...n, ...patch, updatedAt: Date.now() } : n
      )
    )
  }

  const addNote = () => {
    const note = makeNote('', '')
    setNotes((ns) => [note, ...ns])
    setActiveId(note.id)
    setConfirmDelete(false)
    window.setTimeout(() => titleRef.current?.focus(), 0)
  }

  const deleteActive = () => {
    if (!effectiveId || !active) return
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    const rest = notes.filter((n) => n.id !== effectiveId)
    setNotes(rest)
    setActiveId(rest[0]?.id ?? null)
    setConfirmDelete(false)
  }

  const selectNote = (id: string) => {
    setActiveId(id)
    setConfirmDelete(false)
  }

  return (
    <div className="flex h-full w-full">
      {/* لیست یادداشت‌ها (سمت راست در چیدمان راست‌به‌چپ) */}
      <aside className="flex w-40 shrink-0 flex-col border-l border-white/10 bg-zinc-900/50 sm:w-52">
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-2 py-1.5">
          <span className="px-1 text-[11px] font-bold text-zinc-400">
            یادداشت‌ها
          </span>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="یادداشت جدید"
            title="یادداشت جدید"
            onClick={addNote}
            className="size-7 text-[var(--pengo-accent)] hover:bg-white/10 hover:text-[var(--pengo-accent)]"
          >
            <Plus className="size-4" />
          </Button>
        </div>
        <div className="os-scroll min-h-0 flex-1 overflow-y-auto p-1.5">
          {sorted.length === 0 ? (
            <p className="px-2 py-3 text-center text-[10px] leading-5 text-zinc-600">
              لیست خالیه. مثل ذهن قبل از قهوه ☕
            </p>
          ) : (
            sorted.map((n) => {
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => selectNote(n.id)}
                  className={`mb-1 block w-full rounded-lg px-2 py-1.5 text-right transition active:scale-[0.98] ${
                    n.id === effectiveId ? 'bg-white/10' : 'hover:bg-white/5'
                  }`}
                >
                  <span
                    className={`block truncate text-xs font-bold ${
                      n.id === effectiveId ? 'text-zinc-100' : 'text-zinc-300'
                    }`}
                  >
                    {n.title.trim() || 'بی‌نام'}
                  </span>
                  <span className="mt-0.5 block text-[10px] text-zinc-500">
                    {fmtDate(n.updatedAt)}
                  </span>
                </button>
              )
            })
          )}
        </div>
      </aside>

      {/* ویرایشگر یا حالت خالی */}
      {active ? (
        <section className="flex min-w-0 flex-1 flex-col">
          <div className="flex shrink-0 items-center gap-2 border-b border-white/10 px-3 py-2">
            <Input
              ref={titleRef}
              value={active.title}
              placeholder="بی‌نام"
              onChange={(e) => updateActive({ title: e.target.value })}
              className="h-8 min-w-0 flex-1 border-0 bg-transparent px-0 text-sm font-bold shadow-none focus-visible:ring-0"
            />
            <span
              aria-live="polite"
              className={`w-16 shrink-0 text-left text-[10px] text-[var(--pengo-accent)] transition-opacity duration-300 ${
                savedAt > 0 ? 'opacity-100' : 'opacity-0'
              }`}
            >
              ذخیره شد ✓
            </span>
            <Button
              type="button"
              size="sm"
              variant={confirmDelete ? 'destructive' : 'ghost'}
              onClick={deleteActive}
              className={`h-8 shrink-0 gap-1 px-2 text-xs transition-colors ${
                confirmDelete
                  ? ''
                  : 'text-zinc-500 hover:bg-white/10 hover:text-red-300'
              }`}
            >
              <Trash2 className="size-3.5" />
              {confirmDelete && <span>مطمئنی؟</span>}
            </Button>
          </div>
          <div className="flex min-h-0 flex-1 flex-col px-3 py-2">
            <Textarea
              value={active.body}
              placeholder="اینجا بنویس… گربه قول میده نخونه!"
              onChange={(e) => updateActive({ body: e.target.value })}
              className="field-sizing-fixed min-h-0 flex-1 resize-none border-0 bg-transparent px-0 text-sm leading-7 shadow-none focus-visible:ring-0"
            />
          </div>
        </section>
      ) : (
        <section className="flex min-w-0 flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <span className="text-5xl" aria-hidden>
            🐱
          </span>
          <p className="text-sm text-zinc-400">
            یه یادداشت بنویس. گربه قول میده نخونه!
          </p>
          <Button
            type="button"
            size="sm"
            onClick={addNote}
            className="bg-[var(--pengo-accent)] text-zinc-950 hover:bg-[var(--pengo-accent)]/90"
          >
            <Plus className="size-4" />
            یادداشت جدید
          </Button>
        </section>
      )}
    </div>
  )
}
