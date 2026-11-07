'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle,
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronLeft,
  Cpu,
  Download,
  ExternalLink,
  Globe2,
  GraduationCap,
  Lightbulb,
  Package as PackageIcon,
  RotateCcw,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Play,
  SquareTerminal,
  Target,
  Trophy,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { BRAND, SUNJOB_PALETTE } from '@/lib/os/brand'
import { useOS } from '@/lib/os/store'
import { useGame } from '@/lib/gamification/engine'
import { DEEP_CHAPTERS, DEEP_IDS, DeepChapterView } from '@/components/os/academy/deep'
import LearningReader, { ReadingShell, ReadProgress, rememberView, lastView, type ReaderSection } from '@/components/os/academy/reader'
import {
  CHEATSHEET,
  DISTROS,
  DISTRO_QUIZ,
  FURTHER_RESOURCES,
  INSTALL_METHODS,
  QUIZ,
  RUNS_ON,
  TERMINAL_MISSIONS,
  TIMELINE,
  WHERE_STATS,
} from '@/lib/os/academy-data'

/* ================================================================
   پیشرفت و ذخیره‌سازی
   ================================================================ */

interface AcademyProgress {
  done: string[]
  missions: string[]
  quizBest: number
  certName: string
}

const PROGRESS_KEY = 'sunjob-academy-v1'
const EMPTY_PROGRESS: AcademyProgress = { done: [], missions: [], quizBest: 0, certName: '' }

/** حد نصاب قبولی آزمون — ۷۰٪ سؤال‌ها */
const PASS_SCORE = Math.ceil(QUIZ.length * 0.7)

function loadProgress(): AcademyProgress {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY)
    if (!raw) return EMPTY_PROGRESS
    return { ...EMPTY_PROGRESS, ...(JSON.parse(raw) as Partial<AcademyProgress>) }
  } catch {
    return EMPTY_PROGRESS
  }
}

function saveProgress(p: AcademyProgress) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(p))
  } catch {
    /* ignore */
  }
}

const fa = (n: number) => n.toLocaleString('fa-IR')

/* ================================================================
   تعریف فصل‌ها
   ================================================================ */

interface ChapterDef {
  id: string
  title: string
  subtitle: string
  icon: typeof BookOpen
  tint: string
}

const CHAPTERS: ChapterDef[] = [
  { id: 'what', title: 'لینوکس چیست؟', subtitle: 'قصهٔ یک سرگرمی که دنیا را گرفت', icon: BookOpen, tint: SUNJOB_PALETTE.orange },
  { id: 'where', title: 'لینوکس کجاست؟', subtitle: 'از جیب تو تا مریخ', icon: Globe2, tint: SUNJOB_PALETTE.teal },
  { id: 'distros', title: 'توزیع‌ها', subtitle: 'کدام لینوکس برای تو؟', icon: PackageIcon, tint: SUNJOB_PALETTE.violet },
  { id: 'install', title: 'نصب لینوکس', subtitle: 'چهار راه مطمئن، قدم‌به‌قدم', icon: Download, tint: SUNJOB_PALETTE.rose },
  { id: 'terminal', title: 'ترمینال', subtitle: 'قلب تپندهٔ لینوکس + تمرین عملی', icon: SquareTerminal, tint: '#14b8a6' },
  { id: 'permissions', title: 'دسترسی‌ها', subtitle: 'rwx ،sudo و هنوز حفاظت', icon: ShieldCheck, tint: SUNJOB_PALETTE.violet },
  { id: 'procs', title: 'فرآیندها و بسته‌ها', subtitle: 'ps ،kill و apt/dnf/pacman', icon: Cpu, tint: SUNJOB_PALETTE.teal },
  { id: 'quiz', title: 'آزمون و گواهی', subtitle: 'آزمون جامع، یک گواهی باحال', icon: Award, tint: SUNJOB_PALETTE.orange },
  ...DEEP_CHAPTERS,
]

type ViewId = 'home' | 'cheats' | (typeof CHAPTERS)[number]['id']

/* ================================================================
   کامپوننت‌های کوچک
   ================================================================ */

function CountUp({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [v, setV] = useState(0)
  useEffect(() => {
    const start = performance.now()
    const dur = 900
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur)
      setV(Math.round(to * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [to])
  return (
    <span dir="ltr" className="tabular-nums">
      {fa(v)}
      {suffix}
    </span>
  )
}

function SectionTitle({ icon: Icon, children, color }: { icon: typeof BookOpen; children: ReactNode; color: string }) {
  return (
    <h3 className="mb-2 flex items-center gap-2 text-sm font-black text-zinc-100">
      <span className="grid h-7 w-7 place-items-center rounded-lg" style={{ background: `${color}22`, color }}>
        <Icon size={15} />
      </span>
      {children}
    </h3>
  )
}

function FunNote({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-[#f7931e]/25 bg-[#f7931e]/10 p-3 text-xs leading-5 text-amber-200/90">
      <Lightbulb size={15} className="mt-0.5 shrink-0 text-[#f7931e]" aria-hidden />
      <span>{children}</span>
    </div>
  )
}

function TerminalBox({ lines }: { lines: string[] }) {
  return (
    <pre
      dir="ltr"
      className="overflow-x-auto rounded-xl border border-white/10 bg-zinc-950 p-3 font-mono text-[11px] leading-5 text-emerald-300"
    >
      {lines.join('\n')}
    </pre>
  )
}

function DifficultyStars({ n }: { n: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`سختی ${n} از ۵`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className="h-1.5 w-3 rounded-full"
          style={{ background: i <= n ? SUNJOB_PALETTE.orange : 'rgba(255,255,255,0.12)' }}
        />
      ))}
    </span>
  )
}

/* ================================================================
   ترمینال تعاملی فصل ۵
   ================================================================ */

type Line = { kind: 'in' | 'out' | 'err' | 'ok'; text: string }

const HOME = '/home/pengo'

function makeFs() {
  return {
    dirs: [HOME, `${HOME}/projects`] as string[],
    files: {
      [`${HOME}/readme.txt`]:
        'به آکادمی لینوکس سان‌جاب خوش آمدی!\nاینجا ترمینال امن است؛ هر دستوری بزنی هیچ‌چیز خراب نمی‌شود.',
      [`${HOME}/notes.txt`]: 'خرید هفته:\n- فندق برای سنجابک\n- یک توزیع تازه\n- چای برای شب‌های کامپایل',
      [`${HOME}/projects/idea.md`]: '# ایدهٔ بزرگ\nسیستمی بساز که خودش پیدایش کند…',
    } as Record<string, string>,
  }
}

function resolvePath(cwd: string, input: string): string {
  let p = input.trim().replace(/["']/g, '')
  if (p === '' || p === '~') return HOME
  if (p.startsWith('~')) p = HOME + p.slice(1)
  const base = p.startsWith('/') ? '' : cwd
  const parts = `${base}/${p}`.split('/')
  const stack: string[] = []
  for (const seg of parts) {
    if (seg === '' || seg === '.') continue
    if (seg === '..') stack.pop()
    else stack.push(seg)
  }
  return '/' + stack.join('/')
}

function MiniTerminal({ progress, onMissionDone }: { progress: AcademyProgress; onMissionDone: (id: string) => void }) {
  const [fs, setFs] = useState(makeFs)
  const [cwd, setCwd] = useState(HOME)
  const [lines, setLines] = useState<Line[]>([
    { kind: 'out', text: 'sanjob-sh 4.0 — ترمینال تمرین آکادمی (هر دستوری بزنی امن است)' },
    { kind: 'out', text: 'با help لیست دستورها را ببین. ماموریت‌ها در پنل کنار منتظرت هستند!' },
  ])
  const [history, setHistory] = useState<string[]>([])
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const missionIdx = progress.missions.length

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [lines])

  const push = useCallback((kind: Line['kind'], text: string) => {
    setLines((prev) => [...prev.slice(-160), { kind, text }])
  }, [])

  const listDir = useCallback(
    (dirPath: string, long: boolean): string[] => {
      const entries: string[] = []
      for (const d of fs.dirs) {
        if (d === dirPath) continue
        if (d.startsWith(dirPath + '/') && !d.slice(dirPath.length + 1).includes('/')) {
          entries.push((long ? 'd ' : '') + (d.split('/').pop() ?? '') + '/')
        }
      }
      for (const f of Object.keys(fs.files)) {
        if (f.startsWith(dirPath + '/') && !f.slice(dirPath.length + 1).includes('/')) {
          const name = f.split('/').pop() ?? ''
          entries.push(long ? `- ${name}  (${fa((fs.files[f]?.length ?? 0))} بایت)` : name)
        }
      }
      return entries.sort()
    },
    [fs]
  )

  const run = useCallback(
    (raw: string) => {
      const trimmed = raw.trim()
      push('in', `${cwd.split('/').pop() === 'pengo' ? '~' : cwd.split('/').pop()} $ ${trimmed}`)
      if (!trimmed) return
      setHistory((h) => [...h.slice(-60), trimmed])

      // ارزیابی ماموریت بعدی
      if (missionIdx < TERMINAL_MISSIONS.length) {
        const m = TERMINAL_MISSIONS[missionIdx]
        if (m.match.test(trimmed)) {
          onMissionDone(m.id)
          push('ok', `[✔] ماموریت ${fa(missionIdx + 1)} انجام شد: ${m.brief}`)
        }
      }

      // دستور ویژهٔ آموزشی
      if (/^\s*sudo\s+rm\s+-rf\s+\/\s*$/.test(trimmed)) {
        push('err', 'دست نگه دار! sudo rm -rf / یعنی پاک کردن کل سیستم.')
        push('out', 'خوشبختانه اینجا شبیه‌ساز است؛ ولی در دنیای واقعی این معروف‌ترین دستور خطرناک تاریخ است.')
        push('out', 'نکته: sudo قدرت می‌دهد، فکر به عهدهٔ توست.')
        return
      }

      const tokens = trimmed.split(/\s+/)
      const cmd = tokens[0]
      const args = tokens.slice(1).filter((t) => t !== '')
      const flags = args.filter((a) => a.startsWith('-'))
      const rest = args.filter((a) => !a.startsWith('-'))
      const long = flags.some((f) => f.includes('l'))

      switch (cmd) {
        case 'help':
          push('out', 'دستورها: pwd  ls [-l]  cd  mkdir [-p]  touch  rm [-r]  cat  echo متن > فایل')
          push('out', '        whoami  date  uname [-a]  tree  history  clear  sudo rm -rf / (امتحان نکن!)')
          break
        case 'pwd':
          push('out', cwd)
          break
        case 'whoami':
          push('out', 'pengo')
          break
        case 'date':
          push('out', new Date().toLocaleString('fa-IR'))
          break
        case 'uname':
          push('out', flags.includes('-a') ? `Linux sunjob-os ${BRAND.kernel} #1 SMP PREEMPT x86_64 GNU/Linux` : 'Linux')
          break
        case 'clear':
          setLines([])
          break
        case 'history':
          history.forEach((h, i) => push('out', `${fa(i + 1).padStart(2)}  ${h}`))
          break
        case 'cd': {
          const target = resolvePath(cwd, rest[0] ?? '~')
          if (fs.dirs.includes(target)) {
            setCwd(target)
          } else if (Object.keys(fs.files).some((f) => f === target)) {
            push('err', `«${target}» فایل است نه پوشه؛ cd فقط داخل پوشه‌ها می‌رود.`)
          } else {
            push('err', `پوشه‌ای به نام «${rest[0]}» نیست. با ls ببین چی داری.`)
          }
          break
        }
        case 'ls': {
          const target = resolvePath(cwd, rest[0] ?? '.')
          if (!fs.dirs.includes(target)) {
            push('err', `مسیر «${rest[0] ?? '.'}» پیدا نشد.`)
            break
          }
          const entries = listDir(target, long)
          if (entries.length === 0) push('out', '(خالی — مثل حافظهٔ من بعد از ظهر)')
          else entries.forEach((e) => push('out', e))
          break
        }
        case 'mkdir': {
          if (!rest[0]) {
            push('err', 'مثال: mkdir sunjob')
            break
          }
          const target = resolvePath(cwd, rest[0])
          if (fs.dirs.includes(target) || fs.files[target]) {
            push('err', 'این اسم قبلاً وجود دارد.')
            break
          }
          if (flags.includes('-p')) {
            const segs = target.split('/').filter(Boolean)
            let cur = ''
            const added: string[] = []
            for (const s of segs) {
              cur += '/' + s
              if (!fs.dirs.includes(cur)) added.push(cur)
            }
            setFs((f) => ({ ...f, dirs: [...f.dirs, ...added] }))
          } else {
            const parent = target.slice(0, target.lastIndexOf('/'))
            if (!fs.dirs.includes(parent)) {
              push('err', `پوشهٔ والد «${parent}» نیست. از -p استفاده کن: mkdir -p a/b`)
              break
            }
            setFs((f) => ({ ...f, dirs: [...f.dirs, target] }))
          }
          push('out', `پوشهٔ «${target}» ساخته شد.`)
          break
        }
        case 'touch': {
          if (!rest[0]) {
            push('err', 'مثال: touch hello.txt')
            break
          }
          const target = resolvePath(cwd, rest[0])
          if (fs.dirs.includes(target)) {
            push('err', 'این یک پوشه است!')
            break
          }
          setFs((f) => ({ ...f, files: { ...f.files, [target]: f.files[target] ?? '' } }))
          push('out', `فایل «${target}» آماده است.`)
          break
        }
        case 'rm': {
          if (!rest[0]) {
            push('err', 'مثال: rm hello.txt')
            break
          }
          const target = resolvePath(cwd, rest[0])
          if (target === HOME) {
            push('err', 'پاک کردن خانهٔ خودت؟ سنجابک اجازه نمی‌دهد.')
            break
          }
          if (fs.files[target] !== undefined) {
            setFs((f) => {
              const files = { ...f.files }
              delete files[target]
              return { ...f, files }
            })
            push('out', `«${target}» پاک شد.`)
          } else if (fs.dirs.includes(target)) {
            if (!flags.includes('-r')) {
              push('err', 'پوشه است؛ برای پوشه‌ها -r لازم است: rm -r sunjob')
              break
            }
            const hasChildren =
              fs.dirs.some((d) => d.startsWith(target + '/')) ||
              Object.keys(fs.files).some((f) => f.startsWith(target + '/'))
            if (hasChildren) {
              push('err', 'پوشه خالی نیست! اول محتوایش را پاک کن (آموزش مسئولیت پذیری رایگان بود).')
              break
            }
            setFs((f) => ({ ...f, dirs: f.dirs.filter((d) => d !== target) }))
            push('out', `پوشهٔ «${target}» پاک شد.`)
          } else {
            push('err', `«${rest[0]}» وجود ندارد.`)
          }
          break
        }
        case 'cat': {
          const target = resolvePath(cwd, rest[0] ?? '')
          const content = fs.files[target]
          if (content === undefined) push('err', `فایل «${rest[0] ?? ''}» پیدا نشد.`)
          else if (content === '') push('out', '(فایل خالی است)')
          else content.split('\n').forEach((l) => push('out', l))
          break
        }
        case 'echo': {
          const gtIdx = args.indexOf('>')
          if (gtIdx === -1) {
            push('out', rest.join(' '))
            break
          }
          const text = rest.slice(0, gtIdx).join(' ')
          const targetRaw = args[gtIdx + 1]
          if (!targetRaw) {
            push('err', 'بعد از > مقصد را بنویس: echo سلام > hello.txt')
            break
          }
          const target = resolvePath(cwd, targetRaw)
          if (fs.dirs.includes(target)) {
            push('err', 'مقصد یک پوشه است!')
            break
          }
          setFs((f) => ({ ...f, files: { ...f.files, [target]: text } }))
          push('out', `«${text}» در «${target}» ذخیره شد.`)
          break
        }
        case 'tree': {
          const base = resolvePath(cwd, rest[0] ?? '.')
          if (!fs.dirs.includes(base)) {
            push('err', 'پوشه‌ای برای نمایش درخت نیست.')
            break
          }
          push('out', base === HOME ? '~' : base)
          const draw = (dir: string, prefix: string) => {
            const children: string[] = []
            for (const d of fs.dirs) {
              if (d.startsWith(dir + '/') && !d.slice(dir.length + 1).includes('/'))
                children.push('d:' + d)
            }
            for (const f of Object.keys(fs.files)) {
              if (f.startsWith(dir + '/') && !f.slice(dir.length + 1).includes('/'))
                children.push('f:' + f)
            }
            children.sort().forEach((c, i) => {
              const last = i === children.length - 1
              const branch = last ? '└── ' : '├── '
              const name = c.slice(2).split('/').pop() ?? ''
              push('out', prefix + branch + name + (c.startsWith('d:') ? '/' : ''))
              if (c.startsWith('d:')) draw(c.slice(2), prefix + (last ? '    ' : '│   '))
            })
          }
          draw(base, '')
          break
        }
        default:
          push('err', `«${cmd}» را نمی‌شناسم. help را بزن — یا غلط تایپی بود، دوباره درست بنویس!`)
      }
    },
    [cwd, fs, history, listDir, missionIdx, onMissionDone, push]
  )

  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_260px]">
      {/* پنجره ترمینال */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-inner">
        <div className="flex items-center gap-1.5 border-b border-white/10 bg-zinc-900/80 px-3 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500" aria-hidden />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" aria-hidden />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" aria-hidden />
          <span className="mr-2 text-[11px] font-bold text-zinc-400" dir="ltr">
            pengo@sunjob: {cwd.replace(HOME, '~')}
          </span>
          <button
            onClick={() => {
              setFs(makeFs())
              setCwd(HOME)
              setLines([{ kind: 'out', text: 'ترمینال تازه نفس شد. دوباره برو!' }])
            }}
            className="mr-auto flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] text-zinc-500 transition hover:bg-white/10 hover:text-zinc-200"
            title="ریست ترمینال تمرین"
          >
            <RotateCcw size={11} />
            ریست
          </button>
        </div>
        <div
          ref={scrollRef}
          className="os-scroll h-64 overflow-y-auto p-3 font-mono text-[11.5px] leading-6"
          onClick={() => inputRef.current?.focus()}
        >
          {lines.map((l, i) => (
            <div
              key={i}
              className={`pengo-fadein whitespace-pre-wrap break-all ${
                l.kind === 'in'
                  ? 'text-amber-300'
                  : l.kind === 'err'
                    ? 'text-rose-400'
                    : l.kind === 'ok'
                      ? 'font-bold text-emerald-400'
                      : 'text-zinc-300'
              }`}
            >
              {l.text}
            </div>
          ))}
          <div className="flex items-center gap-1.5" dir="ltr">
            <span className="font-mono text-emerald-400">$</span>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  run(input)
                  setInput('')
                }
              }}
              className="flex-1 bg-transparent font-mono text-[12px] text-zinc-100 caret-emerald-400 outline-none"
              aria-label="ورودی ترمینال تمرین"
              spellCheck={false}
              autoComplete="off"
            />
          </div>
        </div>
      </div>

      {/* پنل ماموریت‌ها */}
      <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-3">
        <h4 className="mb-2 flex items-center gap-1.5 text-xs font-black text-zinc-100">
          <Target size={14} style={{ color: SUNJOB_PALETTE.orange }} />
          ماموریت‌ها ({fa(Math.min(progress.missions.length, TERMINAL_MISSIONS.length))}/{fa(TERMINAL_MISSIONS.length)})
        </h4>
        <ol className="space-y-1.5">
          {TERMINAL_MISSIONS.map((m, i) => {
            const done = progress.missions.includes(m.id)
            const active = i === Math.min(progress.missions.length, TERMINAL_MISSIONS.length - 1) && !done
            return (
              <li
                key={m.id}
                className={`rounded-lg border p-2 text-[10.5px] leading-4 transition ${
                  done
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                    : active
                      ? 'border-[#f7931e]/50 bg-[#f7931e]/10 text-amber-200'
                      : 'border-white/10 bg-white/[0.03] text-zinc-500'
                }`}
              >
                <span className="flex items-start gap-1.5">
                  {done ? (
                    <CheckCircle2 size={12} className="mt-0.5 shrink-0" aria-hidden />
                  ) : (
                    <span className="mt-0.5 grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full border border-current text-[8px] font-black" aria-hidden>
                      {fa(i + 1)}
                    </span>
                  )}
                  <span>{m.brief}</span>
                </span>
                {active && <span className="mt-1 block pr-5 text-[9.5px] text-amber-300/70">راهنما: {m.hint}</span>}
              </li>
            )
          })}
        </ol>
        {progress.missions.length >= TERMINAL_MISSIONS.length && (
          <p className="pengo-fadein mt-2 rounded-lg bg-emerald-500/15 p-2 text-[10px] font-bold leading-4 text-emerald-300">
            همهٔ ماموریت‌ها انجام شد! حالا رسماً ترمینال‌باز هستی.
          </p>
        )}
      </div>
    </div>
  )
}

/* ================================================================
   ماشین‌حساب دسترسی‌ها (فصل ۶)
   ================================================================ */

const RWX = ['خواندن (r)', 'نوشتن (w)', 'اجرا (x)']

function PermissionCalc() {
  const [bits, setBits] = useState([
    [true, true, true],
    [true, false, true],
    [true, false, false],
  ])
  const groups = ['مالک (owner)', 'گروه (group)', 'دیگران (others)']

  const octal = bits.map((g) => (g[0] ? 4 : 0) + (g[1] ? 2 : 0) + (g[2] ? 1 : 0)).join('')
  const symbolic = bits.map((g) => `${g[0] ? 'r' : '-'}${g[1] ? 'w' : '-'}${g[2] ? 'x' : '-'}`).join('')
  const is777 = octal === '777'

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-3">
        {bits.map((g, gi) => (
          <div key={gi} className="rounded-xl border border-white/10 bg-zinc-900/60 p-3">
            <p className="mb-2 text-[11px] font-black" style={{ color: [SUNJOB_PALETTE.orange, SUNJOB_PALETTE.teal, SUNJOB_PALETTE.violet][gi] }}>
              {groups[gi]}
            </p>
            <div className="space-y-1.5">
              {RWX.map((label, bi) => (
                <label key={label} className="flex cursor-pointer items-center gap-2 text-[11px] text-zinc-300">
                  <input
                    type="checkbox"
                    checked={g[bi]}
                    onChange={() =>
                      setBits((prev) => prev.map((row, ri) => (ri === gi ? row.map((b, bi2) => (bi2 === bi ? !b : b)) : row)))
                    }
                    className="size-3.5 accent-[#f7931e]"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge dir="ltr" className="border-white/15 bg-zinc-800 font-mono text-sm text-amber-300">
          chmod {octal}
        </Badge>
        <Badge dir="ltr" className="border-white/15 bg-zinc-800 font-mono text-xs text-teal-300">
          {symbolic}
        </Badge>
        <span className="text-[11px] text-zinc-400">معادل دستور:</span>
        <code dir="ltr" className="rounded bg-zinc-950 px-2 py-1 font-mono text-[11px] text-emerald-300">
          chmod {octal} file.txt
        </code>
      </div>

      <TerminalBox
        lines={[
          `-rwxr-xr-x 1 pengo pengo 4096 script.sh   ← ls -l چطور می‌بیند`,
          ` ↑↑↑↑↑↑↑↑↑`,
          ` ${symbolic}  ← همین چیزی که ساختی`,
        ]}
      />

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] text-zinc-500">پیش‌فرض‌های رایج:</span>
        {['644', '755', '700', '600', '777'].map((o) => (
          <button
            key={o}
            onClick={() =>
              setBits(
                o.split('').map((d) => {
                  const n = parseInt(d, 10)
                  return [n >= 4, n % 4 >= 2, n % 2 === 1]
                })
              )
            }
            className="rounded-md border border-white/10 bg-zinc-800/80 px-2 py-1 font-mono text-[11px] text-zinc-300 transition hover:border-[#f7931e]/50 hover:text-amber-300"
            dir="ltr"
          >
            {o}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {is777 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs leading-5 text-rose-300"
          >
            <AlertTriangle size={15} className="mt-0.5 shrink-0" aria-hidden />
            <span>۷۷۷ یعنی همه می‌توانند بخوانند، بنویسند و اجرا کنند — مثل باز گذاشتن در خانه با تابلوی «بفرمایید»! در سرور واقعی هرگز برای فایل‌های معمولی استفاده نشود.</span>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-[11px] leading-5 text-zinc-400">
        <b className="text-zinc-200">chown</b> مالکیت فایل را عوض می‌کند و <b className="text-zinc-200">sudo</b> یک دستور را با اختیارات مدیر اجرا می‌کند؛ با قدرت کامل، مسئولیت کامل می‌آید.
      </p>
    </div>
  )
}

/* ================================================================
   شبیه‌ساز نصب بسته (فصل ۷)
   ================================================================ */

const PKG_MANAGERS: { id: string; name: string; distro: string; install: string; search: string; remove: string; color: string }[] = [
  { id: 'apt', name: 'apt', distro: 'Debian / Ubuntu / Mint', install: 'sudo apt install vim', search: 'apt search vim', remove: 'sudo apt remove vim', color: '#d70a53' },
  { id: 'dnf', name: 'dnf', distro: 'Fedora / RHEL', install: 'sudo dnf install vim', search: 'dnf search vim', remove: 'sudo dnf remove vim', color: '#294172' },
  { id: 'pacman', name: 'pacman', distro: 'Arch / Manjaro', install: 'sudo pacman -S vim', search: 'pacman -Ss vim', remove: 'sudo pacman -R vim', color: '#1793d1' },
]

const FAKE_INSTALL_OUT: Record<string, string[]> = {
  apt: [
    '$ sudo apt install flameshot',
    '[sudo] password for pengo: ••••••••',
    'در حال خواندن لیست بسته‌ها… انجام شد',
    'ساخت درخت وابستگی‌ها… انجام شد',
    'بسته‌های جدید نصب می‌شوند: flameshot',
    'دانلود و نصب…',
    '✔ flameshot نصب شد — کل ماجرا ۴ ثانیه!',
  ],
  dnf: [
    '$ sudo dnf install flameshot',
    'Fedora 41 - x86_64                    3.2 kB/s |  8.1 kB     00:00',
    'Dependencies resolved.',
    'Installing: flameshot  x86_64  0.10.2',
    '✔ Complete! سریع، مودرن، بدون دردسر',
  ],
  pacman: [
    '$ sudo pacman -S flameshot',
    'resolving dependencies...',
    'looking for conflicting packages...',
    'Packages (1) flameshot-0.10.2-1',
    'Total Download Size: 1.24 MiB',
    ':: Proceed with installation? [Y/n] Y',
    '✔ نصب شد — آرچ یعنی سرعت، سرعت، سرعت',
  ],
}

function PackageSim() {
  const [sel, setSel] = useState(PKG_MANAGERS[0])
  const [out, setOut] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const simulate = () => {
    if (busy) return
    setBusy(true)
    setOut([])
    const script = FAKE_INSTALL_OUT[sel.id]
    script.forEach((line, i) => {
      const t = setTimeout(() => {
        setOut((prev) => [...prev, line])
        if (i === script.length - 1) setBusy(false)
      }, 350 * (i + 1))
      timers.current.push(t)
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {PKG_MANAGERS.map((pm) => (
          <button
            key={pm.id}
            onClick={() => {
              setSel(pm)
              setOut([])
            }}
            className={`rounded-lg border px-3 py-1.5 font-mono text-xs font-bold transition ${
              sel.id === pm.id ? 'border-transparent text-white' : 'border-white/10 bg-zinc-800/70 text-zinc-300 hover:bg-zinc-800'
            }`}
            style={sel.id === pm.id ? { background: pm.color } : undefined}
            dir="ltr"
          >
            {pm.name}
          </button>
        ))}
        <Button size="sm" onClick={simulate} disabled={busy} className="mr-auto h-8 text-xs">
          <Sparkles size={13} className={busy ? 'animate-spin' : ''} />
          نصب شبیه‌سازی‌شدهٔ flameshot
        </Button>
      </div>

      {out.length > 0 && <TerminalBox lines={out} />}

      <div className="overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-right text-[11px]">
          <thead className="bg-zinc-800/80 text-zinc-300">
            <tr>
              <th className="p-2 font-bold">مدیر بسته</th>
              <th className="p-2 font-bold">خانوادهٔ توزیع</th>
              <th className="p-2 font-bold">نصب</th>
              <th className="p-2 font-bold">جستجو</th>
              <th className="p-2 font-bold">حذف</th>
            </tr>
          </thead>
          <tbody className="text-zinc-300">
            {PKG_MANAGERS.map((pm) => (
              <tr key={pm.id} className="border-t border-white/5">
                <td className="p-2 font-mono font-bold" dir="ltr" style={{ color: pm.color }}>
                  {pm.name}
                </td>
                <td className="p-2">{pm.distro}</td>
                <td className="p-2 font-mono text-[10px] text-emerald-300" dir="ltr">{pm.install}</td>
                <td className="p-2 font-mono text-[10px] text-emerald-300" dir="ltr">{pm.search}</td>
                <td className="p-2 font-mono text-[10px] text-rose-300" dir="ltr">{pm.remove}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] leading-5 text-zinc-400">
        ایدهٔ اصلی: در لینوکس همه‌چیز از یک مخزن (repository) رسمی نصب می‌شود — بدون گشتن در ده سایت و دعوت‌نامه به نصب نرم‌افزارهای جانبی!
      </p>
    </div>
  )
}

/* ================================================================
   کوییز انتخاب توزیع (فصل ۳)
   ================================================================ */

function DistroQuiz() {
  const [step, setStep] = useState(0)
  const [scores, setScores] = useState<Record<string, number>>({})
  const [result, setResult] = useState<string[] | null>(null)

  const pick = (optIdx: number) => {
    const q = DISTRO_QUIZ[step]
    const add = q.options[optIdx].score
    const next: Record<string, number> = { ...scores }
    for (const [k, v] of Object.entries(add)) next[k] = (next[k] ?? 0) + v
    setScores(next)
    if (step + 1 < DISTRO_QUIZ.length) setStep(step + 1)
    else {
      const sorted = Object.entries(next).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k]) => k)
      setResult(sorted)
    }
  }

  const reset = () => {
    setStep(0)
    setScores({})
    setResult(null)
  }

  if (result) {
    const top = DISTROS.filter((d) => result.includes(d.id))
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
        <p className="text-sm font-black text-zinc-100">پیشنهاد شخصی‌شدهٔ ما برای تو:</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {top.map((d, i) => (
            <div
              key={d.id}
              className={`rounded-2xl border p-3 ${i === 0 ? 'border-[#f7931e]/60 bg-[#f7931e]/10' : 'border-white/10 bg-zinc-900/60'}`}
            >
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-xl font-black text-white" style={{ background: d.color }}>
                  {d.name.slice(0, 1)}
                </span>
                <div>
                  <p className="text-sm font-black text-zinc-100">{d.name}</p>
                  <p className="text-[10px] text-zinc-400">پایه: {d.basedOn} — مدیر بسته: {d.pm}</p>
                </div>
                {i === 0 && <Badge className="mr-auto border-transparent bg-emerald-500/20 text-emerald-300">انتخاب اول</Badge>}
              </div>
              <p className="mt-2 text-[11px] leading-5 text-zinc-300">{d.bestFor}</p>
              <p className="mt-1 text-[10px] leading-4 text-amber-300/80">{d.fun}</p>
            </div>
          ))}
        </div>
        <Button size="sm" variant="outline" onClick={reset} className="text-xs">
          <RotateCcw size={13} />
          دوباره امتحان کن
        </Button>
      </motion.div>
    )
  }

  const q = DISTRO_QUIZ[step]
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Progress value={((step + 1) / DISTRO_QUIZ.length) * 100} className="h-1.5 flex-1" />
        <span className="text-[10px] text-zinc-500">{fa(step + 1)} از {fa(DISTRO_QUIZ.length)}</span>
      </div>
      <p className="text-sm font-black text-zinc-100">{q.q}</p>
      <div className="grid gap-1.5">
        {q.options.map((o, i) => (
          <button
            key={i}
            onClick={() => pick(i)}
            className="rounded-xl border border-white/10 bg-zinc-900/60 px-3 py-2.5 text-right text-xs text-zinc-200 transition hover:border-[#f7931e]/50 hover:bg-[#f7931e]/10 active:scale-[0.99]"
          >
            {o.text}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ================================================================
   آزمون نهایی + گواهی (فصل ۸)
   ================================================================ */

function FinalQuiz({ progress, onScore, onCertName }: { progress: AcademyProgress; onScore: (s: number) => void; onCertName: (n: string) => void }) {
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [name, setName] = useState(progress.certName)
  const passed = score >= PASS_SCORE

  const q = QUIZ[idx]

  const choose = (i: number) => {
    if (picked !== null) return
    setPicked(i)
    if (i === q.answer) setScore((s) => s + 1)
  }

  const next = () => {
    if (idx + 1 < QUIZ.length) {
      setIdx(idx + 1)
      setPicked(null)
    } else {
      setFinished(true)
      onScore(score)
      useGame.getState().registerQuiz('linux', 'final', score === QUIZ.length, score >= PASS_SCORE ? 30 : 10)
    }
  }

  const restart = () => {
    setIdx(0)
    setPicked(null)
    setScore(0)
    setFinished(false)
  }

  if (finished) {
    const today = new Date().toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' })
    return (
      <div className="space-y-4">
        <div
          className={`rounded-2xl border p-4 text-center ${passed ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-amber-500/40 bg-amber-500/10'}`}
        >
          <Trophy size={30} className={`mx-auto ${passed ? 'text-emerald-400' : 'text-amber-400'}`} aria-hidden />
          <p className="mt-2 text-lg font-black text-zinc-100">
            نمرهٔ تو: {fa(score)} از {fa(QUIZ.length)}
          </p>
          <p className="mt-1 text-xs leading-5 text-zinc-300">
            {passed
              ? 'دفترچه‌ات را ببند و گواهی‌ات را بگیر — تو رسماً یک لینوکسی تازه‌وارد هستی!'
              : 'نزدیک بود! فصل‌ها را یک مرور سریع کن و دوباره بیا — آزمون مهم نیست، یادگیری مهم است.'}
          </p>
        </div>

        {passed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="overflow-hidden rounded-2xl border-2 border-[#f7931e]/50"
            style={{ background: 'linear-gradient(135deg,#0b1120 0%,#1a2744 100%)' }}
          >
            <div className="border-b border-white/10 bg-[#f7931e]/10 px-4 py-2 text-center">
              <p className="text-[10px] font-bold tracking-widest text-amber-300">CERTIFICATE OF COMPLETION</p>
            </div>
            <div className="flex flex-col items-center gap-2 p-5 text-center">
              <img src="/brand/sunjob-logo.webp" alt="لوگوی سان‌جاب" className="h-12 w-12 rounded-xl bg-white object-contain p-0.5" />
              <p className="text-[11px] text-zinc-400">گواهی می‌شود که</p>
              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  onCertName(e.target.value.slice(0, 30))
                }}
                placeholder="اسمت را اینجا بنویس…"
                className="w-56 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-center text-sm font-black text-amber-200 outline-none focus:border-[#f7931e]/60"
                maxLength={30}
              />
              <p className="text-[11px] leading-5 text-zinc-300">
                دورهٔ جامع «آکادمی لینوکس» را با نمرهٔ {fa(score)} از {fa(QUIZ.length)} با موفقیت به پایان رساند —
                <br />
                شامل ترمینال تعاملی، هسته، شبکه، بش، امنیت و توزیع‌ها
              </p>
              <div className="mt-1 flex items-center gap-4 text-[9.5px] text-zinc-500">
                <span>{today}</span>
                <span className="font-black text-amber-300/80">آکادمی لینوکسِ {BRAND.name}</span>
              </div>
            </div>
          </motion.div>
        )}

        <div className="flex justify-center gap-2">
          <Button size="sm" variant="outline" onClick={restart} className="text-xs">
            <RotateCcw size={13} />
            آزمون دوباره
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Progress value={((idx + (picked !== null ? 1 : 0)) / QUIZ.length) * 100} className="h-1.5 flex-1" />
        <span className="text-[10px] text-zinc-500">{fa(idx + 1)} / {fa(QUIZ.length)}</span>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          initial={{ opacity: 0, x: -14 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 14 }}
          transition={{ duration: 0.18 }}
          className="space-y-2"
        >
          <p className="text-sm font-black leading-6 text-zinc-100">{q.q}</p>
          <div className="grid gap-1.5">
            {q.options.map((o, i) => {
              const isAnswer = i === q.answer
              const isPicked = picked === i
              let cls = 'border-white/10 bg-zinc-900/60 text-zinc-200 hover:border-[#f7931e]/50'
              if (picked !== null) {
                if (isAnswer) cls = 'border-emerald-500/60 bg-emerald-500/15 text-emerald-200'
                else if (isPicked) cls = 'border-rose-500/60 bg-rose-500/15 text-rose-200'
                else cls = 'border-white/5 bg-zinc-900/40 text-zinc-500'
              }
              return (
                <button
                  key={i}
                  onClick={() => choose(i)}
                  disabled={picked !== null}
                  className={`rounded-xl border px-3 py-2.5 text-right text-xs leading-5 transition active:scale-[0.99] ${cls}`}
                >
                  {o}
                </button>
              )
            })}
          </div>
          {picked !== null && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-[11px] leading-5 text-zinc-300">
              {picked === q.answer ? (
                <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-400" aria-hidden />
              ) : (
                <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-400" aria-hidden />
              )}
              <span>{q.why}</span>
            </motion.div>
          )}
          {picked !== null && (
            <div className="flex justify-end">
              <Button size="sm" onClick={next} className="text-xs">
                {idx + 1 < QUIZ.length ? 'سؤال بعدی' : 'دیدن نتیجه'}
                <ChevronLeft size={14} />
              </Button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

/* ================================================================
   قالب فصل
   ================================================================ */

function Chapter({
  def,
  done,
  onToggleDone,
  children,
}: {
  def: ChapterDef
  done: boolean
  onToggleDone: () => void
  children: ReactNode
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ background: `${def.tint}22`, color: def.tint }}>
          <def.icon size={19} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-black text-zinc-50">{def.title}</h2>
          <p className="text-[11px] text-zinc-400">{def.subtitle}</p>
        </div>
        <Button
          size="sm"
          variant={done ? 'secondary' : 'outline'}
          onClick={onToggleDone}
          className={`shrink-0 text-[11px] ${done ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300' : 'border-white/15 text-zinc-300'}`}
        >
          <Check size={13} />
          {done ? 'خوانده شد' : 'خواندم!'}
        </Button>
      </div>
      <ReadingShell className="pt-1">{children}</ReadingShell>
    </div>
  )
}

/* ================================================================
   اپ اصلی
   ================================================================ */

/* برگه تقلب به‌صورت Learning Reader کامل — فهرست، فوکوس، پیشرفت و ادامه */
const CHEAT_SECTIONS: ReaderSection[] = [
  ...CHEATSHEET.map((g) => ({
    id: g.group,
    title: g.group,
    content: (
      <div key={g.group} className="divide-y divide-white/5 overflow-hidden rounded-xl border border-white/10 bg-zinc-900/50">
        {g.rows.map(([cmd, desc]) => (
          <div key={cmd} className="px-3 py-2">
            <code
              dir="ltr"
              className="block text-left font-mono font-bold text-emerald-300"
              style={{ fontSize: 'var(--fa-code-size)' }}
            >
              {cmd}
            </code>
            <p className="mt-0.5 text-[11px] leading-5 text-zinc-400">{desc}</p>
          </div>
        ))}
      </div>
    ),
  })),
  {
    id: 'resources',
    title: 'منابع واقعی برای ادامهٔ مسیر',
    content: (
      <div className="grid gap-1.5 sm:grid-cols-2">
        {FURTHER_RESOURCES.map((r) => (
          <a
            key={r.name}
            href={r.url}
            target="_blank"
            rel="noreferrer"
            className="group flex items-start gap-2 rounded-xl border border-white/10 bg-black/25 p-2.5 transition hover:border-[#f7931e]/50"
          >
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-black text-zinc-100" dir="ltr">{r.name}</p>
              <p className="mt-0.5 text-[10px] leading-4 text-zinc-400">{r.desc}</p>
            </div>
            <ExternalLink size={13} className="mt-1 shrink-0 text-zinc-500 transition group-hover:text-amber-300" aria-hidden />
          </a>
        ))}
      </div>
    ),
  },
]

export default function LinuxAcademyApp() {
  const [progress, setProgress] = useState<AcademyProgress>(EMPTY_PROGRESS)
  const [view, setView] = useState<ViewId>('home')
  const [installOpen, setInstallOpen] = useState<string>(INSTALL_METHODS[0].id)
  const pushToast = useOS((s) => s.pushToast)
  const mainRef = useRef<HTMLElement>(null)
  const [resumeTo, setResumeTo] = useState<string | null>(null)

  useEffect(() => {
    const t = window.setTimeout(() => {
      setProgress(loadProgress())
      setResumeTo(lastView('linux-academy'))
    }, 0)
    return () => window.clearTimeout(t)
  }, [])

  /* ذخیره آخرین فصل برای «ادامه بده» */
  useEffect(() => {
    if (view !== 'home' && view !== 'cheats') rememberView('linux-academy', view)
  }, [view])

  const update = useCallback((fn: (p: AcademyProgress) => AcademyProgress) => {
    setProgress((prev) => {
      const next = fn(prev)
      saveProgress(next)
      return next
    })
  }, [])

  const toggleDone = useCallback(
    (id: string, title: string) => {
      update((p) => {
        const willBeDone = !p.done.includes(id)
        const done = willBeDone ? [...p.done, id] : p.done.filter((d) => d !== id)
        if (willBeDone) {
          useGame.getState().completeLesson('linux', id, 20)
          pushToast({
            title: `فصل «${title}» تمام شد!`,
            body:
              done.length >= CHAPTERS.length
                ? 'همهٔ فصل‌ها را تموم کردی؟! لینوکس باید ازت ترس داشته باشه. با اسپانسری سان‌جاب'
                : `${fa(CHAPTERS.length - done.length)} فصل تا استادی باقی مانده. با اسپانسری سان‌جاب`,
            icon: GraduationCap,
          })
        }
        return { ...p, done }
      })
    },
    [pushToast, update]
  )

  const onMissionDone = useCallback(
    (id: string) => {
      update((p) => (p.missions.includes(id) ? p : { ...p, missions: [...p.missions, id] }))
      useGame.getState().award(`mission:linux:${id}`, 25, 'مأموریت ترمینال انجام شد', { track: 'linux' })
      if (progress.missions.length + 1 >= TERMINAL_MISSIONS.length) {
        update((p) => ({ ...p, done: p.done.includes('terminal') ? p.done : [...p.done, 'terminal'] }))
        pushToast({
          title: 'همهٔ ماموریت‌های ترمینال انجام شد!',
          body: 'لینوس تووالدز اگر می‌دید، می‌گفت: «نه بد نیست…» — با اسپانسری سان‌جاب',
          icon: Trophy,
        })
      }
    },
    [progress.missions.length, pushToast, update]
  )

  const onScore = useCallback(
    (s: number) => {
      update((p) => ({ ...p, quizBest: Math.max(p.quizBest, s), done: s >= PASS_SCORE && !p.done.includes('quiz') ? [...p.done, 'quiz'] : p.done }))
      if (s >= PASS_SCORE) {
        pushToast({ title: 'مبارک! گواهی آکادمی فعال شد', body: 'اسم داخل گواهی را می‌توانی همان‌جا وارد کنی.', icon: Award })
      }
    },
    [pushToast, update]
  )

  const onCertName = useCallback((n: string) => update((p) => ({ ...p, certName: n })), [update])

  const pct = Math.round((progress.done.filter((d) => CHAPTERS.some((c) => c.id === d)).length / CHAPTERS.length) * 100)
  const missionCount = Math.min(progress.missions.length, TERMINAL_MISSIONS.length)

  const sidebarItem = (v: ViewId, Icon: typeof BookOpen, label: string, tint: string, doneFlag?: boolean) => (
    <button
      key={v}
      onClick={() => setView(v)}
      className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-right text-xs transition ${
        view === v ? 'font-black text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
      }`}
      style={view === v ? { background: `${tint}26` } : undefined}
      aria-current={view === v ? 'page' : undefined}
    >
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg" style={{ background: `${tint}22`, color: tint }}>
        <Icon size={13} />
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {doneFlag && <CheckCircle2 size={13} className="shrink-0 text-emerald-400" aria-hidden />}
    </button>
  )

  return (
    <div className="flex h-full flex-col bg-zinc-950/70">
      {/* هدر قهرمان */}
      <header className="relative h-24 shrink-0 overflow-hidden border-b border-white/10">
        <img src="/wallpapers/linux-classroom.png" alt="پنگوئن معلم در کلاس درس لینوکس" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-l from-black/85 via-black/55 to-black/25" aria-hidden />
        <div className="relative flex h-full items-center gap-3 px-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/15 bg-black/40 backdrop-blur" style={{ color: SUNJOB_PALETTE.orange }}>
            <GraduationCap size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-black text-white sm:text-lg">
              آکادمی لینوکس <span className="text-[10px] font-bold text-amber-300">— دورهٔ جامع رایگان</span>
            </h1>
            <p className="hidden text-[11px] text-zinc-300 sm:block">
              از «لینوکس چیست؟» تا گواهی پایانی — با ترمینال تعاملی و ماموریت‌های واقعی
            </p>
            <div className="mt-1.5 flex max-w-xs items-center gap-2">
              <Progress value={pct} className="h-1.5 flex-1" />
              <span className="text-[10px] font-black text-amber-300">{fa(pct)}٪</span>
            </div>
          </div>
          <img
            src="/brand/sunjob-logo.webp"
            alt="لوگوی سان‌جاب"
            className="h-9 w-9 shrink-0 rounded-xl border border-white/15 bg-white/95 object-contain p-0.5"
          />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* سایدبار */}
        <nav className="os-scroll hidden w-52 shrink-0 space-y-0.5 overflow-y-auto border-l border-white/10 bg-black/25 p-2 md:block" aria-label="فصل‌های آکادمی">
          {sidebarItem('home', GraduationCap, 'خانهٔ آکادمی', SUNJOB_PALETTE.orange)}
          {CHAPTERS.map((c) => sidebarItem(c.id, c.icon, c.title, c.tint, progress.done.includes(c.id)))}
          {sidebarItem('cheats', ScrollText, 'برگه تقلب دستورها', '#14b8a6')}
          <p className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-center text-[9.5px] leading-4 text-zinc-500">
            مسیر یادگیری الهام‌گرفته از Linux Journey و LinuxCommand.org
            <br />
            با اسپانسری سان‌جاب
          </p>
        </nav>

        {/* تب فصل‌ها در موبایل */}
        <div className="absolute inset-x-0 top-24 z-10 flex gap-1 overflow-x-auto bg-black/60 px-2 py-1.5 backdrop-blur md:hidden" role="tablist">
          {[{ id: 'home' as ViewId, label: 'خانه' }, ...CHAPTERS.map((c) => ({ id: c.id as ViewId, label: c.title })), { id: 'cheats' as ViewId, label: 'برگه تقلب' }].map((t) => (
            <button
              key={t.id}
              onClick={() => setView(t.id)}
              className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold transition ${
                view === t.id ? 'border-transparent bg-[#f7931e] text-white' : 'border-white/10 bg-zinc-800/80 text-zinc-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* محتوا — برگه تقلب با خوانندهٔ کامل رندر می‌شود */}
        {view === 'cheats' ? (
          <div className="relative min-w-0 flex-1">
            <LearningReader
              readerId="linux-cheats"
              title="برگه تقلب لینوکس — دستورهای واقعی ترمینال"
              sections={CHEAT_SECTIONS}
            />
          </div>
        ) : (
        <main ref={mainRef} className="os-scroll relative min-w-0 flex-1 overflow-y-auto p-4 pb-16 pt-10 md:pb-4 md:pt-4">
          <ReadProgress targetRef={mainRef} />
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.16 }}
              className="reading-shell mx-auto"
            >
              {/* ---------------- خانه ---------------- */}
              {view === 'home' && (
                <div className="space-y-4">
                  <div className="relative overflow-hidden rounded-2xl border border-white/10">
                    <img src="/wallpapers/linux-classroom.png" alt="کلاس درس لینوکس" className="h-40 w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" aria-hidden />
                    <div className="absolute bottom-3 right-4 left-4">
                      <p className="text-sm font-black text-white sm:text-base">سفرت را همین‌جا شروع کن، پنگوئن معلم صبور است!</p>
                      <p className="mt-0.5 text-[11px] leading-4 text-zinc-300">۱۴ فصل کوتاه، یک ترمینال امن برای تمرین، انیمیشن‌های زندهٔ هسته، آزمون و گواهی پایانی — همه‌چیز آفلاین و بامزه.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'فصل خوانده‌شده', value: `${fa(progress.done.filter((d) => CHAPTERS.some((c) => c.id === d)).length)}/${fa(CHAPTERS.length)}` },
                      { label: 'ماموریت ترمینال', value: `${fa(missionCount)}/${fa(TERMINAL_MISSIONS.length)}` },
                      { label: 'بهترین نمرهٔ آزمون', value: fa(progress.quizBest) },
                    ].map((s) => (
                      <div key={s.label} className="rounded-xl border border-white/10 bg-zinc-900/60 p-3 text-center">
                        <p className="text-lg font-black" style={{ color: SUNJOB_PALETTE.orange }}>{s.value}</p>
                        <p className="mt-0.5 text-[10px] text-zinc-400">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {CHAPTERS.map((c, i) => {
                      const isDone = progress.done.includes(c.id)
                      return (
                        <button
                          key={c.id}
                          onClick={() => setView(c.id)}
                          className="group flex items-start gap-3 rounded-2xl border border-white/10 bg-zinc-900/60 p-3 text-right transition hover:border-white/25 hover:bg-zinc-900 active:scale-[0.99]"
                        >
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl" style={{ background: `${c.tint}22`, color: c.tint }}>
                            <c.icon size={17} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-1.5">
                              <span className="text-xs font-black text-zinc-100">فصل {fa(i + 1)}: {c.title}</span>
                              {isDone && <CheckCircle2 size={13} className="shrink-0 text-emerald-400" aria-hidden />}
                            </span>
                            <span className="mt-0.5 block truncate text-[10.5px] text-zinc-400">{c.subtitle}</span>
                          </span>
                          <ChevronLeft size={14} className="mt-2 shrink-0 text-zinc-600 transition group-hover:text-zinc-300" aria-hidden />
                        </button>
                      )
                    })}
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-3">
                    <SectionTitle icon={ScrollText} color="#14b8a6">برگه تقلب و منابع واقعی</SectionTitle>
                    <p className="mb-2 text-[11px] leading-5 text-zinc-400">
                      جدول کامل دستورها + لینک منابعی که حرفه‌ای‌ها واقعاً استفاده می‌کنند (برای وقتی آکادمی را تمام کردی).
                    </p>
                    <Button size="sm" variant="outline" onClick={() => setView('cheats')} className="text-xs">
                      <ScrollText size={13} />
                      رفتن به برگه تقلب
                    </Button>
                  </div>

                  {resumeTo && resumeTo !== 'home' && (
                    <button
                      type="button"
                      onClick={() => setView(resumeTo as ViewId)}
                      className="flex w-full items-center justify-between gap-2 rounded-2xl border border-[#f7931e]/40 bg-[#f7931e]/10 p-3 text-right transition hover:bg-[#f7931e]/20"
                    >
                      <span className="min-w-0">
                        <span className="block text-xs font-black text-amber-200">ادامه بده از جایی که بودی</span>
                        <span className="mt-0.5 block text-[10.5px] text-amber-200/70">
                          {CHAPTERS.find((c) => c.id === resumeTo)?.title ?? 'فصل آخر'} منتظرت است
                        </span>
                      </span>
                      <Play size={16} className="shrink-0 text-amber-300" aria-hidden />
                    </button>
                  )}
                </div>
              )}

              {/* ---------------- فصل ۱ ---------------- */}
              {view === 'what' && (
                <Chapter def={CHAPTERS[0]} done={progress.done.includes('what')} onToggleDone={() => toggleDone('what', 'لینوکس چیست؟')}>
                  <div className="space-y-3 text-zinc-300">
                    <p>
                      <b className="text-zinc-100">لینوکس</b> اسم «هستهٔ» (kernel) یک سیستم‌عامل است — بخشی که بین سخت‌افزار و برنامه‌ها دادوستد می‌کند.
                      چیزی که مردم «لینوکس» صدا می‌زنند در واقع یک <b className="text-zinc-100">توزیع</b> است: هسته + ابزارها + محیط گرافیکی + نصب‌کننده، بسته‌بندی‌شده مثل یک گوشی با رام اختصاصی.
                    </p>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {[
                        { t: 'هسته (Kernel)', b: 'مدیر رم، CPU و سخت‌افزار. لینوکس همین است!', c: SUNJOB_PALETTE.orange },
                        { t: 'ابزارها (GNU)', b: 'شل، دستورهای ls و cp و… پروژهٔ گنو.', c: SUNJOB_PALETTE.teal },
                        { t: 'توزیع (Distro)', b: 'همهٔ بالا + نصب‌کننده و نرم‌افزارها. اوبونتو، فدورا…', c: SUNJOB_PALETTE.violet },
                      ].map((k) => (
                        <div key={k.t} className="rounded-xl border border-white/10 bg-zinc-900/60 p-3">
                          <p className="text-[11px] font-black" style={{ color: k.c }}>{k.t}</p>
                          <p className="mt-1 text-[10.5px] leading-5 text-zinc-400">{k.b}</p>
                        </div>
                      ))}
                    </div>

                    <SectionTitle icon={BookOpen} color={SUNJOB_PALETTE.orange}>خط زمانی داستان</SectionTitle>
                    <div className="relative space-y-2 pr-4">
                      <span className="absolute bottom-2 right-[7px] top-2 w-px bg-gradient-to-b from-[#f7931e]/60 to-transparent" aria-hidden />
                      {TIMELINE.map((t, i) => (
                        <motion.div
                          key={t.year}
                          initial={{ opacity: 0, x: 12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.08 }}
                          className="relative rounded-xl border border-white/10 bg-zinc-900/60 p-3"
                        >
                          <span className="absolute -right-[21px] top-4 h-2.5 w-2.5 rounded-full border-2 border-zinc-950" style={{ background: SUNJOB_PALETTE.orange }} aria-hidden />
                          <p className="text-[10px] font-black text-amber-300">{t.year}</p>
                          <p className="text-[11.5px] font-black text-zinc-100">{t.title}</p>
                          <p className="mt-0.5 text-[11px] leading-5 text-zinc-400">{t.body}</p>
                        </motion.div>
                      ))}
                    </div>

                    <FunNote>
                      لینوس در ۱۹۹۱ نوشت «فقط یه سرگرمی است، بزرگ و حرفه‌ای نخواهد شد» — امروز پروژهٔ او بیشتر از هر نرم‌افزار دیگری در دنیا در حال اجراست. نکتهٔ اخلاقی: هرگز underestimate نکن سرگرمی‌ها را!
                    </FunNote>
                  </div>
                </Chapter>
              )}

              {/* ---------------- فصل ۲ ---------------- */}
              {view === 'where' && (
                <Chapter def={CHAPTERS[1]} done={progress.done.includes('where')} onToggleDone={() => toggleDone('where', 'لینوکس کجاست؟')}>
                  <div className="space-y-4 text-zinc-300">
                    <p>شاید فکر کنی لینوکس «سیستم‌عامل هکرها» است؛ ولی واقعیت این است که بدون اینکه بفهمی، هر روز ازش استفاده می‌کنی:</p>

                    <div className="space-y-2.5">
                      {WHERE_STATS.map((s, i) => (
                        <div key={s.label} className="rounded-xl border border-white/10 bg-zinc-900/60 p-3">
                          <div className="mb-1.5 flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold text-zinc-200">{s.label}</span>
                            <span className="text-sm font-black" style={{ color: s.color }}>
                              <CountUp to={s.value} suffix={s.suffix} />
                            </span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-white/5">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${s.value}%` }}
                              transition={{ duration: 0.9, delay: i * 0.12, ease: 'easeOut' }}
                              className="h-full rounded-full"
                              style={{ background: `linear-gradient(90deg, ${s.color}88, ${s.color})` }}
                            />
                          </div>
                          <p className="mt-1.5 text-[10.5px] leading-4 text-zinc-500">{s.note}</p>
                        </div>
                      ))}
                    </div>

                    <SectionTitle icon={Globe2} color={SUNJOB_PALETTE.teal}>جاهای باحال‌تر</SectionTitle>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {RUNS_ON.map((r) => (
                        <div key={r.place} className="rounded-xl border border-white/10 bg-zinc-900/60 p-3">
                          <p className="text-[11px] font-black text-teal-300">{r.place}</p>
                          <p className="mt-1 text-[10.5px] leading-5 text-zinc-400">{r.body}</p>
                        </div>
                      ))}
                    </div>

                    <FunNote>گربهٔ سیستمی ما هم می‌گوید: «میوهٔ لینوکسی نخور، خودت لینوکسی شو» — منظورش این بود که از اوبونتو شروع کن.</FunNote>
                  </div>
                </Chapter>
              )}

              {/* ---------------- فصل ۳ ---------------- */}
              {view === 'distros' && (
                <Chapter def={CHAPTERS[2]} done={progress.done.includes('distros')} onToggleDone={() => toggleDone('distros', 'توزیع‌ها')}>
                  <div className="space-y-4 text-zinc-300">
                    <p>
                      «توزیع» یعنی همان بستهٔ کامل آمادهٔ نصب. همه از یک هستهٔ لینوکس استفاده می‌کنند ولی شخصیت‌شان فرق دارد — مثل پیتزافروشی‌هایی که خمیر یکسانی دارند!
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {DISTROS.map((d, i) => (
                        <motion.div
                          key={d.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="rounded-2xl border border-white/10 bg-zinc-900/60 p-3"
                        >
                          <div className="flex items-center gap-2">
                            <span className="grid h-9 w-9 place-items-center rounded-xl font-black text-white" style={{ background: d.color }}>
                              {d.name.slice(0, 1)}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-black text-zinc-100">{d.name}</p>
                              <p className="text-[9.5px] text-zinc-500">پایه: {d.basedOn} — مدیر بسته: {d.pm}</p>
                            </div>
                            <DifficultyStars n={d.difficulty} />
                          </div>
                          <p className="mt-2 text-[10.5px] leading-5 text-zinc-300">{d.bestFor}</p>
                          <p className="mt-1 text-[10px] leading-4 text-amber-300/75">{d.fun}</p>
                        </motion.div>
                      ))}
                    </div>

                    <div className="rounded-2xl border border-[#f7931e]/30 bg-[#f7931e]/[0.07] p-3">
                      <SectionTitle icon={Sparkles} color={SUNJOB_PALETTE.orange}>کدام توزیع مال توست؟</SectionTitle>
                      <DistroQuiz />
                    </div>
                  </div>
                </Chapter>
              )}

              {/* ---------------- فصل ۴ ---------------- */}
              {view === 'install' && (
                <Chapter def={CHAPTERS[3]} done={progress.done.includes('install')} onToggleDone={() => toggleDone('install', 'نصب لینوکس')}>
                  <div className="space-y-3">
                    <p className="text-zinc-300">
                      چهار راه استاندارد برای امتحان‌کردن لینوکس هست؛ از «هیچ ریسکی نمی‌خوام» تا «من کولاک می‌کنم». روی هر روش بزن تا قدم‌به‌قدم باز شود:
                    </p>
                    <div className="space-y-2">
                      {INSTALL_METHODS.map((m) => {
                        const open = installOpen === m.id
                        return (
                          <div key={m.id} className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60">
                            <button
                              onClick={() => setInstallOpen(open ? '' : m.id)}
                              className="flex w-full items-center gap-3 p-3 text-right transition hover:bg-white/5"
                              aria-expanded={open}
                            >
                              <span className="text-xl" aria-hidden>{m.emoji}</span>
                              <span className="min-w-0 flex-1">
                                <span className="block text-xs font-black text-zinc-100">{m.title}</span>
                                <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[9.5px]">
                                  <Badge className="border-transparent" style={{ background: `${m.color}26`, color: m.color }}>{m.difficulty}</Badge>
                                  <span className="text-zinc-500">زمان تقریبی: {m.time}</span>
                                </span>
                              </span>
                              <ChevronLeft size={15} className={`shrink-0 text-zinc-500 transition ${open ? '-rotate-90' : ''}`} aria-hidden />
                            </button>
                            <AnimatePresence initial={false}>
                              {open && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <div className="border-t border-white/10 p-3">
                                    <p className="mb-3 text-[11px] leading-5 text-zinc-400">{m.intro}</p>
                                    <div className="relative space-y-2 pr-5">
                                      <span className="absolute bottom-3 right-[9px] top-3 w-px bg-white/10" aria-hidden />
                                      {m.steps.map((s, i) => (
                                        <motion.div
                                          key={i}
                                          initial={{ opacity: 0, x: 10 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          transition={{ delay: i * 0.07 }}
                                          className="relative rounded-xl border border-white/10 bg-black/25 p-2.5"
                                        >
                                          <span className="absolute -right-[19px] top-4 grid h-3.5 w-3.5 place-items-center rounded-full text-[8px] font-black text-white" style={{ background: m.color }} aria-hidden>
                                            {fa(i + 1)}
                                          </span>
                                          <p className="text-[11px] font-black text-zinc-100">{s.title}</p>
                                          <p className="mt-0.5 text-[10.5px] leading-5 text-zinc-400">{s.body}</p>
                                          {s.tip && (
                                            <p className="mt-1 rounded-lg bg-[#f7931e]/10 px-2 py-1 text-[10px] leading-4 text-amber-300/90">نکته: {s.tip}</p>
                                          )}
                                        </motion.div>
                                      ))}
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )
                      })}
                    </div>
                    <FunNote>پیشنهاد آکادمی: اگر تازه‌کاری، از «ماشین مجازی» یا «WSL» شروع کن. دوال‌بوت وقتی خوبه که دیگه با لینوکس حال کنی!</FunNote>
                  </div>
                </Chapter>
              )}

              {/* ---------------- فصل ۵ ---------------- */}
              {view === 'terminal' && (
                <Chapter def={CHAPTERS[4]} done={progress.done.includes('terminal')} onToggleDone={() => toggleDone('terminal', 'ترمینال')}>
                  <div className="space-y-4 text-zinc-300">
                    <p>
                      در لینوکس «دروازهٔ واقعی قدرت» ترمینال است؛ همان جایی که همه‌چیز با تایپ انجام می‌شود. عبارتی مثل <code dir="ltr" className="rounded bg-zinc-950 px-1.5 py-0.5 font-mono text-[10.5px] text-emerald-300">pengo@sunjob:~$</code> یعنی: کاربر pengo روی ماشین sunjob، در پوشهٔ خانه (~)، آمادهٔ دستور گرفتن ($).
                    </p>
                    <p>
                      شل (shell) مفسرِ دستورهاست؛ محبوب‌ترینش <b className="text-zinc-100">bash</b> است. ترمینال پایین یک شبیه‌ساز امن است — ۱۰ ماموریت را در آن انجام بده تا فصل کامل شود:
                    </p>
                    <MiniTerminal progress={progress} onMissionDone={onMissionDone} />
                  </div>
                </Chapter>
              )}

              {/* ---------------- فصل ۶ ---------------- */}
              {view === 'permissions' && (
                <Chapter def={CHAPTERS[5]} done={progress.done.includes('permissions')} onToggleDone={() => toggleDone('permissions', 'دسترسی‌ها')}>
                  <div className="space-y-4 text-zinc-300">
                    <p>
                      در لینوکس هر فایل سه نوع بیننده دارد: <b className="text-zinc-100">مالک</b>، <b className="text-zinc-100">گروه</b> و <b className="text-zinc-100">دیگران</b> — و هر کدام می‌توانند بخوانند (r)، بنویسند (w) یا اجرا کنند (x). با ماشین‌حساب زیر بازی کن:
                    </p>
                    <PermissionCalc />
                  </div>
                </Chapter>
              )}

              {/* ---------------- فصل ۷ ---------------- */}
              {view === 'procs' && (
                <Chapter def={CHAPTERS[6]} done={progress.done.includes('procs')} onToggleDone={() => toggleDone('procs', 'فرآیندها و بسته‌ها')}>
                  <div className="space-y-4 text-zinc-300">
                    <div>
                      <SectionTitle icon={Cpu} color={SUNJOB_PALETTE.teal}>فرآیندها: هر برنامه یک شماره دارد</SectionTitle>
                      <p className="mb-2">
                        هر برنامهٔ در حال اجرا یک <b className="text-zinc-100">PID</b> دارد. با <code dir="ltr" className="rounded bg-zinc-950 px-1 font-mono text-[10.5px] text-emerald-300">ps aux</code> لیستشان را می‌بینی، با <code dir="ltr" className="rounded bg-zinc-950 px-1 font-mono text-[10.5px] text-emerald-300">htop</code> زنده و رنگی، و با <code dir="ltr" className="rounded bg-zinc-950 px-1 font-mono text-[10.5px] text-rose-300">kill -9 PID</code> پایانی بی‌رحمانه!
                      </p>
                      <TerminalBox
                        lines={[
                          '$ ps aux',
                          'USER   PID %CPU %MEM   COMMAND',
                          'pengo    1  0.0  0.1   systemd (بویسِ همهٔ فرآیندها)',
                          'pengo  412  0.3  1.2   firefox',
                          'pengo  777  9.9 99.0   chrome (همیشه)',
                          'pengo 1024  0.1  0.2   sanjabak-daemon (فندق‌شکن)',
                        ]}
                      />
                    </div>
                    <div>
                      <SectionTitle icon={PackageIcon} color={SUNJOB_PALETTE.violet}>بسته‌ها: نصب برنامه، لینوکسی‌وار</SectionTitle>
                      <PackageSim />
                    </div>
                  </div>
                </Chapter>
              )}

              {/* ---------------- فصل ۸ ---------------- */}
              {view === 'quiz' && (
                <Chapter def={CHAPTERS[7]} done={progress.done.includes('quiz')} onToggleDone={() => toggleDone('quiz', 'آزمون و گواهی')}>
                  <div className="text-zinc-300">
                    <p className="mb-3">
                      {fa(QUIZ.length)} سؤال از تمام فصل‌ها (حتی فصل‌های عمیق). {fa(PASS_SCORE)} و بالاتر یعنی قبول و صاحب گواهی «آکادمی لینوکس سان‌جاب‌او‌اس». بهترین نمرهٔ فعلی تو: <b className="text-amber-300">{fa(progress.quizBest)}</b>
                    </p>
                    <FinalQuiz progress={progress} onScore={onScore} onCertName={onCertName} />
                  </div>
                </Chapter>
              )}

              {/* ---------------- فصل‌های عمیق ---------------- */}
              {DEEP_IDS.has(view) && (
                <DeepChapterView
                  id={view}
                  done={progress.done.includes(view)}
                  onToggleDone={() => toggleDone(view, CHAPTERS.find((c) => c.id === view)?.title ?? '')}
                />
              )}

              {/* برگه تقلب به‌صورت خوانندهٔ کامل بالاتر (بیرون از main) رندر می‌شود */}
            </motion.div>
          </AnimatePresence>
        </main>
        )}
      </div>
    </div>
  )
}
