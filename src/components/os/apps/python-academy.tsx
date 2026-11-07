'use client'

/* ------------------------------------------------------------------ */
/* آکادمی پایتون — با CPython واقعی (Pyodide) در تمرین‌ها               */
/* صادقانه: بارگیری ~۱۰MB از CDN، سقف اجرای ۱۵ ثانیه، فایل مجازی       */
/* ------------------------------------------------------------------ */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion'
import {
  GraduationCap,
  Play,
  LoaderCircle,
  CircleCheck,
  CircleX,
  Lightbulb,
  AlertTriangle,
  BookOpen,
  FlaskConical,
  ListChecks,
  Award,
  Terminal,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Wifi,
  Zap,
  Target,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  PYTHON_LESSONS,
  PY_LEVELS,
  loadPyProgress,
  savePyProgress,
  type PyLesson,
} from '@/lib/academy/python-curriculum'
import { PyodideRunner, type PyOutKind } from '@/lib/os/pyodide'
import { useGame } from '@/lib/gamification/engine'
import { useLearning } from '@/lib/learning/store'
import { SUNJOB_PALETTE } from '@/lib/os/brand'
import { ReadProgress, lastView, rememberView } from '@/components/os/academy/reader'

const fa = (n: number | string) => String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)])

/* --------------------------- پیشرفت ------------------------------- */

interface Progress {
  done: string[]
  ex: string[]
  quizBest: Record<string, number>
  projects: string[]
}

function usePyProgress() {
  const [progress, setProgress] = useState<Progress>(() => ({ done: [], ex: [], quizBest: {}, projects: [] }))
  useEffect(() => {
    const saved = loadPyProgress()
    window.setTimeout(() => setProgress(saved), 0)
  }, [])
  const update = useCallback((fn: (p: Progress) => Progress) => {
    setProgress((prev) => {
      const next = fn(prev)
      savePyProgress(next)
      return next
    })
  }, [])
  return { progress, update }
}

/* ------------------------- بلوک کد ------------------------------- */

function CodeBlock({ code, caption }: { code: string; caption?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = useCallback(() => {
    navigator.clipboard?.writeText(code).then(
      () => {
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1200)
      },
      () => {},
    )
  }, [code])
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-zinc-950/80">
      <div className="flex items-center justify-between border-b border-white/5 px-3 py-1.5">
        <span className="font-mono text-[10px] text-zinc-500" dir="ltr">
          python
        </span>
        <div className="flex items-center gap-2">
          {caption && <span className="text-[10px] text-zinc-400">{caption}</span>}
          <Button size="sm" variant="ghost" className="h-5 gap-1 px-1.5 text-[10px] text-zinc-500 hover:text-amber-300" onClick={copy}>
            {copied ? <CircleCheck size={10} className="text-emerald-400" /> : null} کپی
          </Button>
        </div>
      </div>
      <pre className="os-scroll overflow-x-auto p-3 font-mono text-[11.5px] leading-6 text-emerald-100/90" dir="ltr" style={{ fontSize: 'var(--fa-code-size)', lineHeight: 'var(--fa-code-line-height)' }}>
        {code}
      </pre>
    </div>
  )
}

/* --------------------------- کوئیز ------------------------------- */

function QuizBlock({ lesson, best, onPass }: { lesson: PyLesson; best: number; onPass: (score: number) => void }) {
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [checked, setChecked] = useState(false)
  const score = lesson.quiz.reduce((acc, q, i) => acc + (answers[i] === q.answer ? 1 : 0), 0)
  const passed = score >= Math.ceil(lesson.quiz.length * 0.7)

  return (
    <Card className="border-purple-500/20 bg-purple-500/[0.04] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-black text-zinc-200">
          <ListChecks size={14} style={{ color: SUNJOB_PALETTE.violet }} />
          آزمونک درس — {fa(lesson.quiz.length)} سؤال
        </div>
        {best > 0 && (
          <Badge variant="outline" className="border-emerald-500/30 text-[10px] text-emerald-300">
            بهترین: {fa(best)}/{fa(lesson.quiz.length)}
          </Badge>
        )}
      </div>
      <div className="space-y-3">
        {lesson.quiz.map((q, qi) => (
          <div key={qi} className="rounded-xl border border-white/5 bg-zinc-950/40 p-3">
            <p className="mb-2 text-xs font-bold text-zinc-200">
              {fa(qi + 1)}. {q.q}
            </p>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {q.options.map((opt, oi) => {
                const selected = answers[qi] === oi
                const correct = checked && oi === q.answer
                const wrong = checked && selected && oi !== q.answer
                return (
                  <button
                    key={oi}
                    onClick={() => !checked && setAnswers((a) => ({ ...a, [qi]: oi }))}
                    className={`rounded-lg border px-2.5 py-1.5 text-start text-[11px] transition-colors ${
                      correct
                        ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                        : wrong
                          ? 'border-rose-500/50 bg-rose-500/10 text-rose-300'
                          : selected
                            ? 'border-amber-500/50 bg-amber-500/10 text-amber-200'
                            : 'border-white/10 bg-white/[0.02] text-zinc-400 hover:border-white/20'
                    }`}
                  >
                    {opt}
                  </button>
                )
              })}
            </div>
            {checked && (
              <p className="mt-2 rounded-lg bg-white/[0.03] px-2.5 py-1.5 text-[10.5px] leading-5 text-zinc-400">
                {answers[qi] === q.answer ? 'درست! ' : '✗ '}
                {q.why}
              </p>
            )}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2">
        {!checked ? (
          <Button
            size="sm"
            className="h-8 bg-purple-600 text-xs hover:bg-purple-500"
            disabled={Object.keys(answers).length < lesson.quiz.length}
            onClick={() => {
              setChecked(true)
              if (score >= Math.ceil(lesson.quiz.length * 0.7)) onPass(score)
            }}
          >
            بررسی پاسخ‌ها
          </Button>
        ) : (
          <>
            <Badge className={passed ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-rose-500/30 bg-rose-500/10 text-rose-300'}>
              نمره: {fa(score)}/{fa(lesson.quiz.length)} {passed ? '— قبول' : '— نیاز به مرور'}
            </Badge>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              onClick={() => {
                setAnswers({})
                setChecked(false)
              }}
            >
              <RotateCcw size={12} /> دوباره
            </Button>
          </>
        )}
      </div>
    </Card>
  )
}

/* ----------------------- تمرین با پایتون واقعی --------------------- */

function ExerciseBlock({
  lesson,
  passed,
  onPass,
  runnerRef,
  pyStatus,
  loadPy,
}: {
  lesson: PyLesson
  passed: boolean
  onPass: () => void
  runnerRef: React.MutableRefObject<PyodideRunner | null>
  pyStatus: string
  loadPy: () => Promise<void>
}) {
  const reduced = useReducedMotion() ?? false
  const [code, setCode] = useState(lesson.exercise.starter)
  const [output, setOutput] = useState<string[]>([])
  const [running, setRunning] = useState(false)
  const [verdict, setVerdict] = useState<'idle' | 'pass' | 'fail' | 'error'>('idle')
  const [showHint, setShowHint] = useState(false)
  const outBuf = useRef<string[]>([])

  const collect = useCallback((_kind: PyOutKind, text: string) => {
    outBuf.current.push(text)
  }, [])

  const runExercise = useCallback(async () => {
    setRunning(true)
    setVerdict('idle')
    setOutput([])
    outBuf.current = []
    try {
      let runner = runnerRef.current
      if (!runner) {
        runner = new PyodideRunner()
        runner.onOut = collect
        runnerRef.current = runner
      }
      await loadPy()
      const full = `${code}\n# --- تست‌های سنجاب‌اواس ---\n${lesson.exercise.tests}`
      const r = await runner.run(full, 15000)
      const lines = outBuf.current.filter((l) => l.trim().length > 0)
      setOutput(lines.slice(-40))
      const passMarker = lines.some((l) => l.includes('___SANJAB_OK___'))
      if (r.ok && passMarker) {
        setVerdict('pass')
        onPass()
      } else {
        setVerdict('fail')
      }
    } catch (e) {
      setOutput([`✗ ${e instanceof Error ? e.message : 'خطای نامشخص'}`])
      setVerdict('error')
    } finally {
      setRunning(false)
    }
  }, [code, lesson.exercise.tests, runnerRef, collect, loadPy, onPass])

  return (
    <Card className="border-amber-500/20 bg-amber-500/[0.03] p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-black text-zinc-200">
          <Target size={14} style={{ color: SUNJOB_PALETTE.orange }} />
          تمرین — با پایتون واقعی تصحیح می‌شود
          {passed && (
            <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
              <CircleCheck size={11} /> قبول شد
            </Badge>
          )}
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 gap-1 px-2 text-[10px] text-zinc-500"
          onClick={() => setShowHint((s) => !s)}
        >
          <Lightbulb size={11} /> {showHint ? 'پنهان' : 'راهنما'}
        </Button>
      </div>

      <p className="mb-2 text-[12px] leading-6 text-zinc-300">{lesson.exercise.prompt}</p>

      {showHint && (
        <motion.p
          initial={{ opacity: 0, y: reduced ? 0 : -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-2 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-3 py-2 font-mono text-[11px] text-cyan-200"
          dir="ltr"
        >
          {lesson.exercise.hint}
        </motion.p>
      )}

      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        spellCheck={false}
        dir="ltr"
        rows={Math.min(16, Math.max(6, code.split('\n').length + 1))}
        className="os-scroll w-full resize-y rounded-xl border border-white/10 bg-zinc-950/90 p-3 font-mono text-[12px] leading-6 text-emerald-100 outline-none focus:border-amber-500/40"
      />

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          onClick={runExercise}
          disabled={running}
          className="h-8 gap-1.5 text-xs font-bold text-zinc-950"
          style={{ background: SUNJOB_PALETTE.orange }}
        >
          {running ? <LoaderCircle size={13} className="animate-spin" /> : <Play size={13} />}
          {running ? 'در حال اجرا…' : 'اجرا و تصحیح'}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 gap-1 text-xs text-zinc-500"
          onClick={() => {
            setCode(lesson.exercise.starter)
            setVerdict('idle')
            setOutput([])
          }}
        >
          <RotateCcw size={12} /> بازنشانی
        </Button>
        <span className="text-[10px] text-zinc-600">{pyStatus}</span>
      </div>

      {output.length > 0 && (
        <div className="os-scroll mt-2 max-h-44 overflow-y-auto rounded-xl border border-white/10 bg-black/60 p-2.5" dir="ltr">
          {output.map((l, i) => (
            <div
              key={i}
              className={`whitespace-pre-wrap font-mono text-[11px] leading-5 ${
                l.includes('___SANJAB_OK___')
                  ? 'text-emerald-400'
                  : l.startsWith('✗') || l.includes('Error') || l.includes('assert')
                    ? 'text-rose-400'
                    : 'text-zinc-400'
              }`}
            >
              {l.replace('___SANJAB_OK___', '✓ ALL TESTS PASSED')}
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {verdict === 'pass' && (
          <motion.div
            initial={{ opacity: 0, scale: reduced ? 1 : 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="mt-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300"
          >
            تمرین قبول شد — خب شد! پیشرفت ذخیره شد.
          </motion.div>
        )}
        {verdict === 'fail' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs leading-5 text-rose-300"
          >
            تست‌ها قبول نشد. خروجی/خطای واقعی پایتون را در کنسول بالا بخوانید — traceback دقیقاً می‌گوید کجا و چرا.
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

/* --------------------------- اپ اصلی ------------------------------ */

export default function PythonAcademyApp() {
  const reduced = useReducedMotion() ?? false
  const { progress, update } = usePyProgress()
  const game = useGame()
  const [activeId, setActiveId] = useState<string>(PYTHON_LESSONS[0].id)
  const [pyStatus, setPyStatus] = useState('پایتون واقعی هنوز بارگیری نشده — با اولین اجرا خودکار بارگیری می‌شود')
  const [home, setHome] = useState(true)
  const runnerRef = useRef<PyodideRunner | null>(null)
  const loadedRef = useRef(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const lesson = useMemo(() => PYTHON_LESSONS.find((l) => l.id === activeId) ?? PYTHON_LESSONS[0], [activeId])
  const idx = PYTHON_LESSONS.findIndex((l) => l.id === lesson.id)
  const resumeId = home ? lastView('python-academy') : null
  const resumeLesson = resumeId ? (PYTHON_LESSONS.find((l) => l.id === resumeId) ?? null) : null

  const loadPy = useCallback(async () => {
    if (loadedRef.current) return
    let runner = runnerRef.current
    if (!runner) {
      runner = new PyodideRunner()
      runner.onOut = (kind, text) => {
        if (kind === 'status') setPyStatus(text)
      }
      runnerRef.current = runner
    }
    setPyStatus('در حال بارگیری CPython از CDN… (~۱۰MB، فقط بار اول)')
    await runner.ensure()
    loadedRef.current = true
    setPyStatus('CPython آماده است — اجرای واقعی با سقف ۱۵ ثانیه')
    game.award('python:runtime-first-load', 10, 'اولین بارگیری پایتون واقعی')
  }, [game])

  useEffect(() => {
    return () => {
      runnerRef.current?.terminate()
      runnerRef.current = null
    }
  }, [])

  /* آخرین درس دیده‌شده — برای «ادامهٔ یادگیری» در خانه */
  useEffect(() => {
    if (!home) rememberView('python-academy', activeId)
  }, [activeId, home])

  const markDone = useCallback(
    (id: string) => {
      update((p) => (p.done.includes(id) ? p : { ...p, done: [...p.done, id] }))
      game.completeLesson('python', id, 20)
      useLearning.getState().noteLessonCompleted('python', id)
    },
    [update, game],
  )

  const markEx = useCallback(
    (id: string) => {
      update((p) => (p.ex.includes(id) ? p : { ...p, ex: [...p.ex, id] }))
      game.award(`py-ex:${id}`, 25, 'تمرین قبول شد')
      useLearning.getState().noteExercisePassed('python', id)
    },
    [update, game],
  )

  const markQuiz = useCallback(
    (id: string, score: number, total: number) => {
      update((p) => ({ ...p, quizBest: { ...p.quizBest, [id]: Math.max(p.quizBest[id] ?? 0, score) } }))
      game.registerQuiz('python', id, score === total, score >= Math.ceil(total * 0.7) ? 20 : 10)
      useLearning.getState().noteQuizResult('python', id, score, total)
    },
    [update, game],
  )

  const isDone = (id: string) => progress.done.includes(id)
  const isEx = (id: string) => progress.ex.includes(id)
  const isProject = (id: string) => progress.projects.includes(id)
  const doneCount = progress.done.length
  const exCount = progress.ex.length
  const isProjectLesson = lesson.level === 8

  const openLesson = (id: string) => {
    setActiveId(id)
    setHome(false)
    useLearning.getState().noteLessonOpened('python', id)
    if (!isDone(id)) markDone(id)
  }

  /* --------------------------- صفحهٔ خانه --------------------------- */
  if (home) {
    return (
      <div className="os-scroll h-full overflow-y-auto p-4" dir="rtl">
        <div className="reading-shell mx-auto space-y-4">
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-2xl"
              style={{ background: 'rgba(247,147,30,.14)', color: SUNJOB_PALETTE.orange }}
            >
              <GraduationCap size={22} />
            </span>
            <div>
              <h1 className="text-base font-black text-zinc-100">آکادمی پایتون</h1>
              <p className="text-[11px] text-zinc-500">از صفر تا پروژهٔ واقعی — تمرین‌ها با CPython واقعی در مرورگر شما اجرا و تصحیح می‌شوند</p>
            </div>
          </div>

          <Card className="border-amber-500/20 bg-amber-500/[0.04] p-3.5">
            <div className="flex items-start gap-2">
              <Zap size={15} className="mt-0.5 shrink-0 text-amber-400" />
              <div className="text-[11.5px] leading-5 text-zinc-300">
                <b className="text-amber-300">پایتون واقعی، نه شبیه‌ساز:</b> تمرین‌ها با CPython 3.12 (Pyodide/WebAssembly) تصحیح می‌شوند — همان موتور python.org.
                بارگیری اول ~۱۰MB از CDN می‌خواهد (اینترنت لازم)، اجرا سقف ۱۵ ثانیه دارد و فایل‌ها روی سیستم‌فایل مجازیِ مرورگر ساخته می‌شوند.
                درس‌های نظری آفلاین هم کامل‌اند.
              </div>
            </div>
          </Card>

          {resumeLesson && (
            <button
              onClick={() => openLesson(resumeLesson.id)}
              className="flex w-full items-center gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-3.5 text-start transition-colors hover:border-amber-500/50 hover:bg-amber-500/[0.09]"
            >
              <BookOpen size={16} className="shrink-0" style={{ color: SUNJOB_PALETTE.orange }} />
              <span className="min-w-0 flex-1 truncate text-xs font-bold text-amber-200">ادامهٔ یادگیری: {resumeLesson.title}</span>
              <ChevronLeft size={14} className="shrink-0 text-amber-400" />
            </button>
          )}

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              ['درس خوانده‌شده', `${fa(doneCount)}/${fa(PYTHON_LESSONS.length)}`, BookOpen],
              ['تمرین قبول‌شده', `${fa(exCount)}/${fa(PYTHON_LESSONS.length)}`, Target],
              ['پروژهٔ تمام‌شده', `${fa(progress.projects.length)}/۴`, FlaskConical],
              ['سطح‌ها', fa(PY_LEVELS.length), Award],
            ].map(([label, value, Icon]) => {
              const I = Icon as typeof BookOpen
              return (
                <Card key={String(label)} className="border-white/10 bg-zinc-900/50 p-3 text-center">
                  <I size={16} className="mx-auto mb-1" style={{ color: SUNJOB_PALETTE.orange }} />
                  <div className="text-sm font-black text-zinc-100">{value as string}</div>
                  <div className="text-[10px] text-zinc-500">{label as string}</div>
                </Card>
              )
            })}
          </div>

          <div className="space-y-2">
            {PY_LEVELS.map((lv) => {
              const lessons = PYTHON_LESSONS.filter((l) => l.level === lv.id)
              const lvDone = lessons.filter((l) => isDone(l.id)).length
              const lvEx = lessons.filter((l) => isEx(l.id)).length
              return (
                <Card key={lv.id} className="border-white/10 bg-zinc-900/50 p-3.5">
                  <div className="mb-1 flex flex-wrap items-center justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-300">سطح {fa(lv.id)}</Badge>
                      <h3 className="text-xs font-black text-zinc-100">{lv.title}</h3>
                    </div>
                    <span className="text-[10px] text-zinc-500">
                      {fa(lvDone)}/{fa(lessons.length)} درس · {fa(lvEx)} تمرین سبز
                    </span>
                  </div>
                  <p className="mb-2 text-[10.5px] text-zinc-500">{lv.desc}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {lessons.map((l) => (
                      <button
                        key={l.id}
                        onClick={() => openLesson(l.id)}
                        className={`rounded-lg border px-2.5 py-1.5 text-start text-[11px] transition-colors hover:border-amber-500/50 ${
                          isDone(l.id) ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-200' : 'border-white/10 bg-white/[0.02] text-zinc-300'
                        }`}
                      >
                        <span className="flex items-center gap-1">
                          {isEx(l.id) && <CircleCheck size={10} className="text-emerald-400" />}
                          {l.title}
                          <span className="text-zinc-600">· {fa(l.minutes)}′</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </Card>
              )
            })}
          </div>

          <p className="pb-2 text-center text-[10px] text-zinc-600">
            موتور اجرا: Pyodide v0.26.4 (CPython کامپایل‌شده به WebAssembly) — MPL-2.0 · تمرین‌ها سمت مرورگر شما تصحیح می‌شوند
          </p>
        </div>
      </div>
    )
  }

  /* --------------------------- صفحهٔ درس ---------------------------- */
  return (
    <div className="flex h-full flex-col" dir="rtl">
      {/* نوار بالا */}
      <div className="flex items-center gap-2 border-b border-white/5 px-3 py-2">
        <Button size="sm" variant="ghost" className="h-7 gap-1 text-[11px]" onClick={() => setHome(true)}>
          <ChevronRight size={13} /> فهرست
        </Button>
        <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-300">سطح {fa(lesson.level)}</Badge>
        <span className="truncate text-xs font-black text-zinc-200">{lesson.title}</span>
        <span className="ms-auto flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1 text-[11px]"
            disabled={idx === 0}
            onClick={() => setActiveId(PYTHON_LESSONS[Math.max(0, idx - 1)].id)}
          >
            <ChevronRight size={13} /> قبلی
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1 text-[11px]"
            disabled={idx >= PYTHON_LESSONS.length - 1}
            onClick={() => openLesson(PYTHON_LESSONS[Math.min(PYTHON_LESSONS.length - 1, idx + 1)].id)}
          >
            بعدی <ChevronLeft size={13} />
          </Button>
        </span>
      </div>

      <div ref={scrollRef} className="os-scroll relative flex-1 overflow-y-auto p-4">
        <ReadProgress targetRef={scrollRef} accent={SUNJOB_PALETTE.orange} />
        <AnimatePresence mode="wait">
          <motion.div
            key={lesson.id}
            initial={{ opacity: 0, x: reduced ? 0 : 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: reduced ? 0 : -12 }}
            transition={{ duration: reduced ? 0 : 0.2 }}
            className="reading-shell prose-fa mx-auto space-y-3.5"
          >
            {/* چه یاد می‌گیرید */}
            <Card className="border-white/10 bg-zinc-900/50 p-3.5">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-black text-zinc-200">
                <BookOpen size={13} style={{ color: SUNJOB_PALETTE.orange }} /> در این درس چه یاد می‌گیرید
              </div>
              <ul className="space-y-1">
                {lesson.learn.map((l, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[11.5px] leading-5 text-zinc-300">
                    <CircleCheck size={12} className="mt-0.5 shrink-0 text-emerald-400" />
                    {l}
                  </li>
                ))}
              </ul>
              <p className="mt-2 rounded-lg bg-white/[0.03] px-2.5 py-1.5 text-[10.5px] text-zinc-500">
                پیش‌نیاز: {lesson.prereq} · زمان تقریبی: {fa(lesson.minutes)} دقیقه
              </p>
            </Card>

            {/* مقدمه */}
            <div className="space-y-2">
              <p className="text-[12.5px] leading-7 text-zinc-300">{lesson.intro}</p>
              <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/[0.04] p-3">
                <div className="mb-1 flex items-center gap-1.5 text-[11px] font-black text-cyan-300">
                  <Sparkles size={12} /> تشبیه
                </div>
                <p className="text-zinc-300">{lesson.analogy}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-zinc-950/50 p-3">
                <div className="mb-1 text-[11px] font-black text-zinc-200">تشریح فنی</div>
                <p className="text-zinc-400">{lesson.technical}</p>
              </div>
            </div>

            {/* مثال‌ها */}
            {[lesson.example1, lesson.example2].map((ex, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-black text-zinc-200">
                  <Terminal size={13} style={{ color: SUNJOB_PALETTE.orange }} />
                  مثال {fa(i + 1)} — {ex.title}
                </div>
                <CodeBlock code={ex.code} />
                <p className="text-[11px] leading-5 text-zinc-400">{ex.explain}</p>
              </div>
            ))}

            {/* خط‌به‌خط */}
            <Card className="border-white/10 bg-zinc-900/50 p-3.5">
              <div className="mb-2 text-xs font-black text-zinc-200">تحلیل خط‌به‌خط</div>
              <ul className="space-y-1.5">
                {lesson.lineByLine.map((l, i) => (
                  <li key={i} className="flex items-start gap-2 text-[11px] leading-5 text-zinc-400">
                    <span className="mt-0.5 rounded bg-amber-500/10 px-1.5 font-mono text-[9px] text-amber-400">{fa(i + 1)}</span>
                    <span dir="auto">{l}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* اشتباه‌های رایج */}
            <Card className="border-rose-500/20 bg-rose-500/[0.03] p-3.5">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-black text-rose-300">
                <AlertTriangle size={13} /> اشتباه‌های رایج مبتدی‌ها
              </div>
              <ul className="space-y-1">
                {lesson.mistakes.map((m, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[11px] leading-5 text-zinc-400">
                    <CircleX size={12} className="mt-0.5 shrink-0 text-rose-400" />
                    {m}
                  </li>
                ))}
              </ul>
            </Card>

            {/* تمرین */}
            <ExerciseBlock
              lesson={lesson}
              passed={isEx(lesson.id)}
              onPass={() => {
                markEx(lesson.id)
                if (isProjectLesson && !isProject(lesson.id)) {
                  update((p) => ({ ...p, projects: [...p.projects, lesson.id] }))
                }
              }}
              runnerRef={runnerRef}
              pyStatus={pyStatus}
              loadPy={loadPy}
            />

            {/* چالش بیشتر */}
            <div className="rounded-xl border border-purple-500/20 bg-purple-500/[0.04] p-3">
              <div className="mb-1 flex items-center gap-1.5 text-[11px] font-black text-purple-300">
                <FlaskConical size={12} /> چالش بیشتر
              </div>
              <p className="text-zinc-300">{lesson.challenge}</p>
            </div>

            {/* خلاصه */}
            <Card className="border-emerald-500/20 bg-emerald-500/[0.03] p-3.5">
              <div className="mb-1 text-xs font-black text-emerald-300">خلاصهٔ درس</div>
              <p className="text-zinc-300">{lesson.summary}</p>
            </Card>

            {/* کوئیز */}
            <QuizBlock
              lesson={lesson}
              best={progress.quizBest[lesson.id] ?? 0}
              onPass={(s) => markQuiz(lesson.id, s, lesson.quiz.length)}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
