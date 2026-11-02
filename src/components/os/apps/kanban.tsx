'use client'

import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  CheckCheck,
  Flame,
  ListTodo,
  Plus,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { SUNJOB_PALETTE } from '@/lib/os/brand'

type ColumnId = 'todo' | 'doing' | 'done'

interface Task {
  id: string
  title: string
  color: string
  col: ColumnId
}

interface BoardData {
  tasks: Task[]
  doneTotal: number
  doneToday: number
  day: string
}

const KEY = 'sunjob-kanban-v1'

const COLUMNS: Array<{ id: ColumnId; title: string; color: string }> = [
  { id: 'todo', title: 'باید انجام بدم', color: SUNJOB_PALETTE.orange },
  { id: 'doing', title: 'دارم انجام میدم', color: SUNJOB_PALETTE.violet },
  { id: 'done', title: 'تموم شد!', color: SUNJOB_PALETTE.teal },
]

const LABEL_COLORS = [
  SUNJOB_PALETTE.orange,
  SUNJOB_PALETTE.violet,
  SUNJOB_PALETTE.teal,
  SUNJOB_PALETTE.rose,
  SUNJOB_PALETTE.orangeSoft,
  SUNJOB_PALETTE.tealBright,
] as const

const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'] as const

const toFa = (value: number | string): string =>
  String(value).replace(/\d/g, (digit) => FA_DIGITS[Number(digit)] ?? digit)

const pad2 = (n: number): string => String(n).padStart(2, '0')

const todayKey = (): string => {
  const d = new Date()
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

const uid = (): string =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

function loadBoard(): BoardData {
  const day = todayKey()
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { tasks: [], doneTotal: 0, doneToday: 0, day }
    const parsed = JSON.parse(raw) as Partial<BoardData>
    const tasks = Array.isArray(parsed.tasks)
      ? parsed.tasks.filter(
          (t) => t && typeof t.title === 'string' && typeof t.col === 'string'
        )
      : []
    return {
      tasks,
      doneTotal: typeof parsed.doneTotal === 'number' ? parsed.doneTotal : 0,
      doneToday:
        parsed.day === day && typeof parsed.doneToday === 'number'
          ? parsed.doneToday
          : 0,
      day,
    }
  } catch {
    return { tasks: [], doneTotal: 0, doneToday: 0, day }
  }
}

export default function KanbanApp() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [doneTotal, setDoneTotal] = useState(0)
  const [doneToday, setDoneToday] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [title, setTitle] = useState('')
  const [color, setColor] = useState<string>(LABEL_COLORS[0])

  useEffect(() => {
    queueMicrotask(() => {
      const board = loadBoard()
      setTasks(board.tasks)
      setDoneTotal(board.doneTotal)
      setDoneToday(board.doneToday)
      setLoaded(true)
    })
  }, [])

  useEffect(() => {
    if (!loaded) return
    try {
      localStorage.setItem(
        KEY,
        JSON.stringify({ tasks, doneTotal, doneToday, day: todayKey() })
      )
    } catch {
      /* ذخیره نشد؟ اشکالی نداره، بورد سر جاشه */
    }
  }, [tasks, doneTotal, doneToday, loaded])

  const addTask = () => {
    const t = title.trim()
    if (!t) return
    setTasks((prev) => [
      ...prev,
      { id: uid(), title: t, color, col: 'todo' as ColumnId },
    ])
    setTitle('')
  }

  const move = (id: string, dir: -1 | 1) => {
    const task = tasks.find((t) => t.id === id)
    if (!task) return
    const idx = COLUMNS.findIndex((c) => c.id === task.col)
    const nextCol = COLUMNS[idx + dir]
    if (!nextCol) return
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, col: nextCol.id } : t))
    )
    if (nextCol.id === 'done' && task.col !== 'done') {
      setDoneTotal((n) => n + 1)
      setDoneToday((n) => n + 1)
    } else if (task.col === 'done' && nextCol.id !== 'done') {
      setDoneTotal((n) => Math.max(0, n - 1))
      setDoneToday((n) => Math.max(0, n - 1))
    }
  }

  const removeTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  const clearDone = () => {
    setTasks((prev) => prev.filter((t) => t.col !== 'done'))
  }

  const doneCount = tasks.filter((t) => t.col === 'done').length
  const progressPct = tasks.length
    ? Math.round((doneCount / tasks.length) * 100)
    : 0

  return (
    <div className="flex h-full w-full flex-col bg-zinc-950/60">
      <header className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2.5">
        <h2 className="flex items-center gap-1.5 text-sm font-black text-zinc-100">
          <ListTodo className="size-4" style={{ color: SUNJOB_PALETTE.violet }} />
          برد کارها
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={clearDone}
          disabled={doneCount === 0}
          className="h-7 gap-1 rounded-lg border-white/10 bg-zinc-800/70 px-2.5 text-[11px] text-zinc-300 hover:bg-white/10 hover:text-zinc-100 disabled:opacity-40"
        >
          <CheckCheck className="size-3.5" />
          پاک‌سازی تمام‌شده‌ها
        </Button>
      </header>

      <div className="os-scroll min-h-0 flex-1 overflow-y-auto p-3">
        {/* افزودن کار جدید */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            addTask()
          }}
          className="rounded-xl border border-white/10 bg-zinc-900/60 p-2.5"
        >
          <div className="flex gap-2">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="یه کار جدید بنویس… (مثلاً: جواب دادن به ایمیل‌ها)"
              className="h-9 bg-zinc-800/70 text-xs text-zinc-100"
            />
            <Button
              type="submit"
              size="sm"
              className="h-9 shrink-0 gap-1 bg-[#f7931e] text-zinc-950 hover:bg-[#e07b00]"
            >
              <Plus className="size-4" />
              افزودن
            </Button>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] text-zinc-500">رنگ برچسب:</span>
            {LABEL_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`انتخاب رنگ ${c}`}
                onClick={() => setColor(c)}
                style={{ backgroundColor: c }}
                className={`size-5 rounded-full transition active:scale-90 ${
                  color === c
                    ? 'ring-2 ring-white/70 ring-offset-2 ring-offset-zinc-950'
                    : 'opacity-70 hover:opacity-100'
                }`}
              />
            ))}
          </div>
        </form>

        {/* پیشرفت کلی + رکورد بامزه */}
        <div className="mt-3 rounded-xl border border-white/10 bg-zinc-900/60 p-2.5">
          <div className="mb-1.5 flex items-center justify-between text-[11px]">
            <span className="font-bold text-zinc-300">پیشرفت کلی</span>
            <span className="font-black" style={{ color: SUNJOB_PALETTE.teal }}>
              {toFa(progressPct)}٪
            </span>
          </div>
          <Progress value={progressPct} className="h-2 bg-zinc-800" />
          <p
            className="mt-1.5 flex items-center gap-1 text-[11px] font-bold"
            style={{ color: SUNJOB_PALETTE.orangeSoft }}
          >
            <Flame className="size-3.5" />
            امروزی‌ها: {toFa(doneToday)} کار تموم شد
            <span className="font-normal text-zinc-500">
              (مجموع: {toFa(doneTotal)})
            </span>
          </p>
        </div>

        {/* سه ستون بورد */}
        <div className="mt-3 flex flex-col gap-3 md:flex-row">
          {COLUMNS.map((col) => {
            const items = tasks.filter((t) => t.col === col.id)
            return (
              <section
                key={col.id}
                className="flex min-h-0 flex-1 flex-col rounded-xl border border-white/10 bg-zinc-900/60 p-2.5 md:min-h-[300px]"
              >
                <header className="mb-2 flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-xs font-black text-zinc-100">
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: col.color }}
                    />
                    {col.title}
                  </span>
                  <span
                    className="rounded-md border border-white/10 bg-zinc-800/80 px-1.5 py-0.5 text-[10px] font-black"
                    style={{ color: col.color }}
                  >
                    {toFa(items.length)}
                  </span>
                </header>

                <div className="os-scroll min-h-0 flex-1 space-y-1.5 overflow-y-auto">
                  {items.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-white/10 p-3 text-center text-[11px] leading-5 text-zinc-600">
                      {col.id === 'todo'
                        ? 'لیست خالیه! یه کار اضافه کن و زندگیت رو منظم کن.'
                        : col.id === 'doing'
                          ? 'اینجا جای کارهای در جریانه… یه چیزی بکش این‌ور!'
                          : 'هنوز هیچی تموم نشده؛ ولی به زودی!'}
                    </p>
                  ) : (
                    items.map((task) => (
                      <div
                        key={task.id}
                        className="pengo-fadein flex items-center gap-1.5 rounded-lg border border-white/10 bg-zinc-950/60 p-2"
                      >
                        <span
                          className="size-2 shrink-0 rounded-full"
                          style={{ backgroundColor: task.color }}
                        />
                        <span
                          title={task.title}
                          className={`min-w-0 flex-1 truncate text-xs ${
                            task.col === 'done'
                              ? 'text-zinc-500 line-through'
                              : 'text-zinc-200'
                          }`}
                        >
                          {task.title}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="مرحله قبل"
                          title="مرحله قبل"
                          disabled={task.col === 'todo'}
                          onClick={() => move(task.id, -1)}
                          className="size-6 shrink-0 text-zinc-400 hover:bg-white/10 hover:text-zinc-100 disabled:opacity-25"
                        >
                          <ArrowRight className="size-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="مرحله بعد"
                          title="مرحله بعد"
                          disabled={task.col === 'done'}
                          onClick={() => move(task.id, 1)}
                          className="size-6 shrink-0 text-zinc-400 hover:bg-white/10 hover:text-zinc-100 disabled:opacity-25"
                        >
                          <ArrowLeft className="size-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="حذف کار"
                          title="حذف"
                          onClick={() => removeTask(task.id)}
                          className="size-6 shrink-0 text-zinc-500 hover:bg-white/10 hover:text-rose-300"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </section>
            )
          })}
        </div>

        <p className="mt-3 text-center">
          <span className="text-[10px] text-zinc-500">با اسپانسری سان‌جاب</span>
        </p>
      </div>
    </div>
  )
}
