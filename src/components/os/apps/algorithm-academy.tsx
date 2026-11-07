'use client'

/* ------------------------------------------------------------------ */
/* آکادمی الگوریتم — تفکر محاسباتی تا تحلیل پیچیدگی                    */
/* درس‌ها با LearningReader · Visualizer با Trace واقعی الگوریتم ·      */
/* Complexity Playground · چالش‌های تعاملی از بانک سؤال                */
/* ------------------------------------------------------------------ */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Gauge,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import LearningReader, { Callout, type ReaderSection } from '@/components/os/academy/reader'
import QuestionCard from '@/components/os/academy/question-card'
import {
  ALGO_LESSONS,
  ALGO_LEVELS,
  LESSON_QUESTIONS,
  type AlgoLesson,
} from '@/lib/academy/algorithm-curriculum'
import {
  ALGO_SKILL,
  ALGO_TITLES,
  complexityModel,
  needsTarget,
  traceAlgo,
  type AlgoId,
  type AlgoStep,
} from '@/lib/learning/algos'
import { buildQuiz } from '@/lib/learning/assessment'
import { QUESTION_BANK } from '@/lib/learning/banks'
import { useLearning } from '@/lib/learning/store'
import { useGame } from '@/lib/gamification/engine'
import { useOS } from '@/lib/os/store'

const fa = (n: number | string) => String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)])

type View = 'home' | 'lesson' | 'visualizer' | 'playground' | 'challenges'

const ALGO_TINT = '#ec4899'

export default function AlgorithmAcademyApp() {
  const [view, setView] = useState<View>('home')
  const [lessonId, setLessonId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const profile = useLearning((s) => s.profile)
  const noteLessonOpened = useLearning((s) => s.noteLessonOpened)

  const openLesson = useCallback(
    (id: string) => {
      setLessonId(id)
      setView('lesson')
      noteLessonOpened('algorithm', id)
    },
    [noteLessonOpened]
  )

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 })
  }, [view, lessonId])

  const lesson = lessonId ? ALGO_LESSONS.find((l) => l.id === lessonId) : null
  const lessonsDone = profile.lessons.algorithm ?? {}

  return (
    <div ref={scrollRef} className="os-scroll h-full min-h-0 overflow-y-auto" dir="rtl">
      {view === 'home' && (
        <Home
          onOpenLesson={openLesson}
          onOpenVisualizer={() => setView('visualizer')}
          onOpenPlayground={() => setView('playground')}
          onOpenChallenges={() => setView('challenges')}
          doneMap={lessonsDone}
        />
      )}
      {view === 'lesson' && lesson && (
        <LessonView
          lesson={lesson}
          onBack={() => setView('home')}
          onVisualizer={() => setView('visualizer')}
        />
      )}
      {view === 'visualizer' && <Visualizer onBack={() => setView('home')} />}
      {view === 'playground' && <Playground onBack={() => setView('home')} />}
      {view === 'challenges' && <Challenges onBack={() => setView('home')} />}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* خانه — سطوح و درس‌ها                                                */
/* ------------------------------------------------------------------ */
function Home({
  onOpenLesson,
  onOpenVisualizer,
  onOpenPlayground,
  onOpenChallenges,
  doneMap,
}: {
  onOpenLesson: (id: string) => void
  onOpenVisualizer: () => void
  onOpenPlayground: () => void
  onOpenChallenges: () => void
  doneMap: Record<string, { done: boolean } | undefined>
}) {
  const tools = [
    { title: 'ابزار نمایش الگوریتم', desc: 'اجرای گام‌به‌گام با Trace واقعی', Icon: Cpu, onClick: onOpenVisualizer },
    { title: 'زمین بازی پیچیدگی', desc: 'رشد O(1) تا O(2ⁿ) را زنده ببین', Icon: Gauge, onClick: onOpenPlayground },
    { title: 'چالش‌های الگوریتمی', desc: 'پیش‌بینی گام، تحلیل، ترتیب عملیات', Icon: Target, onClick: onOpenChallenges },
  ]

  return (
    <div className="reading-shell prose-fa px-4 pb-10 pt-5">
      <header className="mb-4">
        <h1 className="flex items-center gap-2 text-xl font-black text-white">
          <Zap size={20} style={{ color: ALGO_TINT }} aria-hidden />
          آکادمی الگوریتم
        </h1>
        <p className="mt-1 text-[12px] leading-6 text-zinc-400">
          هدف فقط حفظ کردن الگوریتم‌ها نیست — اینجا یاد می‌گیری مسئله را تحلیل کنی، راه‌حل طراحی کنی و کارایی را بسنجی.
          ۶ سطح، ۳۵ درس، شبیه‌ساز واقعی.
        </p>
      </header>

      {/* ابزارها */}
      <div className="mb-5 grid gap-2 sm:grid-cols-3">
        {tools.map((t) => (
          <button
            key={t.title}
            type="button"
            onClick={t.onClick}
            className="rounded-2xl border border-white/10 bg-zinc-900/60 p-3.5 text-start transition hover:border-pink-400/40 hover:bg-pink-500/5"
          >
            <t.Icon size={18} style={{ color: ALGO_TINT }} aria-hidden />
            <p className="mt-1.5 text-[12px] font-black text-zinc-100">{t.title}</p>
            <p className="text-[10px] leading-5 text-zinc-500">{t.desc}</p>
          </button>
        ))}
      </div>

      {/* سطوح */}
      {ALGO_LEVELS.map((lvl) => {
        const lessons = ALGO_LESSONS.filter((l) => l.level === lvl.id)
        const done = lessons.filter((l) => doneMap[l.id]?.done).length
        const pct = Math.round((done / lessons.length) * 100)
        return (
          <section key={lvl.id} className="mb-5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div>
                <h2 className="text-[14px] font-black text-white">
                  سطح {fa(lvl.id)}: {lvl.title}
                </h2>
                <p className="text-[11px] text-zinc-500">{lvl.subtitle}</p>
              </div>
              <div className="w-24 shrink-0" aria-hidden>
                <Progress value={pct} className="h-1.5 [&>div]:bg-pink-400" />
              </div>
            </div>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {lessons.map((l) => {
                const isDone = doneMap[l.id]?.done
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => onOpenLesson(l.id)}
                    className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-start transition ${
                      isDone
                        ? 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-400/50'
                        : 'border-white/10 bg-black/25 hover:border-pink-400/40 hover:bg-pink-500/5'
                    }`}
                  >
                    <span
                      className={`grid size-7 shrink-0 place-items-center rounded-lg text-[11px] font-black ${
                        isDone ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/5 text-zinc-400'
                      }`}
                      aria-hidden
                    >
                      {isDone ? '✓' : fa(l.minutes) + '′'}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12px] font-bold text-zinc-100">{l.title}</span>
                      <span className="block truncate text-[10px] text-zinc-500">
                        {l.outcomes[0]}
                        {l.visualizer ? ' · شبیه‌ساز دارد' : ''}
                      </span>
                    </span>
                    <ArrowLeft size={13} className="shrink-0 text-zinc-600" aria-hidden />
                  </button>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* درس — با خواننده استاندارد                                          */
/* ------------------------------------------------------------------ */
function LessonView({
  lesson,
  onBack,
  onVisualizer,
}: {
  lesson: AlgoLesson
  onBack: () => void
  onVisualizer: () => void
}) {
  const noteLessonCompleted = useLearning((s) => s.noteLessonCompleted)
  const noteQuizResult = useLearning((s) => s.noteQuizResult)
  const completeLesson = useGame((s) => s.completeLesson)
  const pushToast = useOS((s) => s.pushToast)
  const profile = useLearning((s) => s.profile)

  const qIds = LESSON_QUESTIONS[lesson.id] ?? []
  const questions = useMemo(
    () => QUESTION_BANK.filter((q) => qIds.includes(q.id)),
    [qIds]
  )
  const [answers, setAnswers] = useState<Record<string, boolean>>({})

  const sections: ReaderSection[] = [
    {
      id: 'concept',
      title: 'مفهوم',
      content: (
        <>
          <p>{lesson.intro}</p>
          <p>{lesson.concept}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {lesson.outcomes.map((o) => (
              <span key={o} className="rounded-lg bg-teal-500/15 px-2 py-1 text-[10px] font-bold text-teal-300">
                🎯 {o}
              </span>
            ))}
          </div>
        </>
      ),
    },
    ...(lesson.worked
      ? [
          {
            id: 'worked',
            title: 'مثال حل‌شده',
            content: (
              <Callout kind="example" title={lesson.worked.title}>
                <p className="whitespace-pre-line">{lesson.worked.body}</p>
              </Callout>
            ),
          } satisfies ReaderSection,
        ]
      : []),
    {
      id: 'misconceptions',
      title: 'اشتباهات رایج',
      content: (
        <div className="space-y-2">
          {lesson.misconceptions.map((m, i) => (
            <Callout key={i} kind="warn" title={`اشتباه ${fa(i + 1)}`}>
              <p>{m}</p>
            </Callout>
          ))}
        </div>
      ),
    },
    {
      id: 'summary',
      title: 'جمع‌بندی',
      content: (
        <ul className="space-y-1.5">
          {lesson.summary.map((s, i) => (
            <li key={i} className="flex items-start gap-2 text-[13px] leading-7 text-zinc-200">
              <Check2 aria-hidden />
              {s}
            </li>
          ))}
        </ul>
      ),
    },
    ...(questions.length > 0
      ? [
          {
            id: 'quiz',
            title: 'آزمون Retrieval',
            content: (
              <div className="space-y-3">
                <p className="text-[12px] leading-6 text-zinc-400">
                  اول از حافظه جواب بده، بعد توضیح را بخوان — بازیابی، قوی‌ترین ابزار یادگیری است.
                </p>
                {questions.map((q) => (
                  <QuestionCard
                    key={q.id}
                    question={q}
                    compact
                    onAnswered={(correct) => {
                      if (answers[q.id] === undefined) {
                        setAnswers((cur) => ({ ...cur, [q.id]: correct }))
                        noteQuizResult('algorithm', lesson.id, correct ? 1 : 0, 1)
                        if (correct) useGame.getState().award(`al-quiz:${q.id}`, 10, 'پاسخ درست آزمون الگوریتم')
                      }
                    }}
                  />
                ))}
              </div>
            ),
          } satisfies ReaderSection,
        ]
      : []),
  ]

  const answeredAll = questions.length === 0 || questions.every((q) => answers[q.id] !== undefined)
  const isDone = !!profile.lessons.algorithm?.[lesson.id]?.done

  const complete = () => {
    noteLessonCompleted('algorithm', lesson.id)
    completeLesson('algorithm', lesson.id, 20)
    pushToast({ title: 'درس کامل شد 🎉', body: `«${lesson.title}» به پیشرفتت اضافه شد.` })
  }

  return (
    <div className="h-full">
      <div className="relative z-10 flex items-center gap-2 border-b border-white/10 bg-zinc-900/80 px-3 py-2 backdrop-blur">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 rounded-lg bg-white/5 px-2.5 py-1.5 text-[11px] font-bold text-zinc-300 transition hover:bg-white/10"
        >
          <ChevronRight size={13} aria-hidden />
          فهرست درس‌ها
        </button>
        <p className="min-w-0 flex-1 truncate text-center text-[11px] font-black text-zinc-300">
          سطح {fa(lesson.level)} · {lesson.title}
        </p>
        {lesson.visualizer && (
          <button
            type="button"
            onClick={onVisualizer}
            className="flex items-center gap-1 rounded-lg bg-pink-500/20 px-2.5 py-1.5 text-[11px] font-black text-pink-300 transition hover:bg-pink-500/30"
          >
            <Cpu size={12} aria-hidden />
            شبیه‌ساز
          </button>
        )}
      </div>
      <div className="h-[calc(100%-2.6rem)]">
        <LearningReader
          readerId={`algo:${lesson.id}`}
          sections={sections}
          accent={ALGO_TINT}
          title={`${lesson.title} (~${fa(lesson.minutes)} دقیقه)`}
          footer={
            <div className="mt-6 rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
              {isDone ? (
                <p className="flex items-center justify-center gap-1.5 text-[12px] font-black text-emerald-300">
                  ✓ این درس را کامل کرده‌ای — هر وقت خواستی مرورش کن.
                </p>
              ) : (
                <button
                  type="button"
                  onClick={complete}
                  disabled={!answeredAll}
                  className="w-full rounded-xl bg-emerald-500/80 py-2.5 text-[13px] font-black text-white transition hover:bg-emerald-500 disabled:opacity-40"
                >
                  {answeredAll ? '✓ درس را خواندم — ثبت کن' : 'اول آزمون Retrieval را کامل کن'}
                </button>
              )}
            </div>
          }
        />
      </div>
    </div>
  )
}

function Check2() {
  return <span className="mt-1.5 text-emerald-400" aria-hidden>✓</span>
}

/* ------------------------------------------------------------------ */
/* Visualizer — اجرای گام‌به‌گام با Trace واقعی                         */
/* ------------------------------------------------------------------ */
function Visualizer({ onBack }: { onBack: () => void }) {
  const [algo, setAlgo] = useState<AlgoId>('bubble-sort')
  const [input, setInput] = useState('5, 1, 4, 2, 8')
  const [target, setTarget] = useState('4')
  const [idx, setIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(400)

  const noteExercisePassed = useLearning((s) => s.noteExercisePassed)
  const award = useGame((s) => s.award)

  const parse = (raw: string): number[] => {
    const arr = raw
      .split(/[,،\s]+/)
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n))
      .slice(0, 12)
    return arr
  }

  /* اجرای اولیه — lazy initializer به‌جای setState در effect */
  const [steps, setSteps] = useState(() => {
    const result = traceAlgo('bubble-sort', [5, 1, 4, 2, 8])
    return { steps: result.steps, pseudocode: result.pseudocode, ok: result.ok }
  })

  const run = useCallback(() => {
    const arr = parse(input)
    const t = Number(target)
    const result = traceAlgo(
      algo,
      arr.length > 0 ? arr : [5, 1, 4, 2, 8],
      needsTarget(algo) ? (Number.isFinite(t) ? t : undefined) : undefined
    )
    setSteps({ steps: result.steps, pseudocode: result.pseudocode, ok: result.ok })
    setIdx(0)
    setPlaying(true)
  }, [algo, input, target])

  /* پخش خودکار */
  useEffect(() => {
    if (!playing || !steps) return
    if (idx >= steps.steps.length - 1) {
      /* پایان اجرا — با تاخیر صفر تا setState داخل callback باشد */
      const done = window.setTimeout(() => {
        setPlaying(false)
        /* پایان اجرای کامل الگوریتم = شواهد تمرین واقعی (یک‌بار در هر الگوریتم) */
        if (!ranAwarded.has(algo)) {
          ranAwarded.add(algo)
          const map = ALGO_SKILL[algo]
          noteExercisePassed(map.track, map.lessonId)
          award(`algo-viz:${algo}`, 12, `نمایش کامل ${ALGO_TITLES[algo]}`)
        }
      }, 0)
      return () => window.clearTimeout(done)
    }
    const t = window.setTimeout(() => setIdx((i) => i + 1), speed)
    return () => window.clearTimeout(t)
  }, [playing, idx, steps, speed, algo, noteExercisePassed, award])

  const step = steps?.steps[idx]
  const maxVal = step ? Math.max(...step.arr, 1) : 1

  return (
    <div className="reading-shell prose-fa px-4 pb-10 pt-4">
      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 rounded-lg bg-white/5 px-2.5 py-1.5 text-[11px] font-bold text-zinc-300 transition hover:bg-white/10"
        >
          <ChevronRight size={13} aria-hidden />
          خانه
        </button>
        <h1 className="flex-1 text-[15px] font-black text-white">ابزار نمایش الگوریتم — Trace واقعی</h1>
      </div>

      {/* انتخاب الگوریتم */}
      <div className="os-scroll mb-3 flex gap-1 overflow-x-auto pb-1">
        {(Object.keys(ALGO_TITLES) as AlgoId[]).map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => {
              setAlgo(a)
              ranAwarded.delete(a)
              window.setTimeout(run, 0)
            }}
            aria-pressed={algo === a}
            className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-black transition ${
              algo === a ? 'bg-pink-500/20 text-pink-300' : 'bg-white/5 text-zinc-400 hover:bg-white/10'
            }`}
          >
            {ALGO_TITLES[a]}
          </button>
        ))}
      </div>

      {/* ورودی */}
      <div className="mb-3 flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-zinc-900/60 p-3">
        <label className="text-[11px] font-bold text-zinc-400" htmlFor="algo-input">
          آرایه:
        </label>
        <input
          id="algo-input"
          dir="ltr"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-40 rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-[12px] text-zinc-100 outline-none focus:border-pink-400/50"
          placeholder="5, 1, 4, 2, 8"
        />
        {needsTarget(algo) && (
          <>
            <label className="text-[11px] font-bold text-zinc-400" htmlFor="algo-target">
              هدف:
            </label>
            <input
              id="algo-target"
              dir="ltr"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-16 rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-center text-[12px] text-zinc-100 outline-none focus:border-pink-400/50"
            />
          </>
        )}
        <button
          type="button"
          onClick={run}
          className="rounded-lg bg-pink-500/80 px-3 py-1.5 text-[11px] font-black text-white transition hover:bg-pink-500"
        >
          اجرا
        </button>
        <span className="text-[10px] text-zinc-500">Edge Caseها را امتحان کن: خالی، تکراری، مرتب، معکوس، منفی</span>
      </div>

      {/* نما */}
      {steps && step && (
        <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-3">
          {/* نوارها */}
          <div className="flex h-40 items-end justify-center gap-1 px-2" dir="ltr" aria-label="نمایش آرایه">
            {step.arr.map((v, i) => {
              const isCompare = step.compare?.includes(i)
              const isSwap = step.swap?.includes(i)
              const isSorted = step.sorted.includes(i)
              const isPivot = step.pointers.pivot === i
              return (
                <div key={i} className="flex h-full w-full max-w-10 flex-col items-center justify-end gap-1">
                  <span className="text-[10px] font-black tabular-nums text-zinc-400">{v}</span>
                  <div
                    className={`w-full rounded-t-md transition-all duration-150 ${
                      isSwap
                        ? 'bg-amber-400'
                        : isCompare
                          ? 'bg-sky-400'
                          : isSorted
                            ? 'bg-emerald-400'
                            : isPivot
                              ? 'bg-violet-400'
                              : 'bg-zinc-600'
                    }`}
                    style={{ height: `${Math.max(6, (v / maxVal) * 100)}%` }}
                  />
                  <span className="text-[9px] text-zinc-600" dir="ltr">{i}</span>
                </div>
              )
            })}
          </div>
          {step.arr.length === 0 && (
            <p className="py-6 text-center text-[12px] text-zinc-500">آرایهٔ خالی — حالت مرزی! الگوریتم باید بدون خطا تمام شود.</p>
          )}

          {/* اشاره‌گرها */}
          <div className="mt-1.5 flex flex-wrap justify-center gap-1.5" dir="ltr">
            {Object.entries(step.pointers).map(([name, val]) => (
              <span key={name} className="rounded-md bg-black/40 px-1.5 py-0.5 text-[10px] font-black text-teal-300">
                {name}={val}
              </span>
            ))}
          </div>

          {/* کنترل */}
          <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
            <CtlBtn onClick={() => { setPlaying(false); setIdx(0) }} label="از اول" Icon={RotateCcw} />
            <CtlBtn onClick={() => { setPlaying(false); setIdx((i) => Math.max(0, i - 1)) }} label="گام قبل" Icon={ChevronRight} disabled={idx === 0} />
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              className="flex items-center gap-1 rounded-lg bg-pink-500/80 px-3 py-1.5 text-[11px] font-black text-white transition hover:bg-pink-500"
            >
              {playing ? <Pause size={13} /> : <Play size={13} />}
              {playing ? 'مکث' : 'پخش'}
            </button>
            <CtlBtn onClick={() => { setPlaying(false); setIdx((i) => Math.min(steps.steps.length - 1, i + 1)) }} label="گام بعد" Icon={ChevronLeft} disabled={idx >= steps.steps.length - 1} />
            <label className="ms-2 flex items-center gap-1.5 text-[10px] text-zinc-500">
              سرعت
              <input
                type="range"
                min={60}
                max={900}
                step={60}
                value={960 - speed}
                onChange={(e) => setSpeed(960 - Number(e.target.value))}
                className="w-20 accent-pink-400"
                aria-label="سرعت پخش"
              />
            </label>
          </div>
          <p className="mt-1 text-center text-[10px] tabular-nums text-zinc-500" dir="ltr">
            step {idx + 1} / {steps.steps.length}
          </p>

          {/* توضیح گام */}
          <div className="mt-2 rounded-xl border border-white/10 bg-black/30 p-2.5 text-center">
            <p className="text-[12px] leading-6 text-zinc-200">{step.note}</p>
          </div>

          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {/* شبه‌کد */}
            <div className="rounded-xl border border-white/10 bg-black/40 p-2.5">
              <p className="mb-1 text-[10px] font-black text-zinc-500">شبه‌کد</p>
              <pre dir="ltr" className="text-[11px] leading-5">
                {steps.pseudocode.map((line, i) => (
                  <div key={i} className={i === step.pseudoLine ? 'rounded bg-pink-500/25 px-1 text-pink-200' : 'px-1 text-zinc-500'}>
                    {line}
                  </div>
                ))}
              </pre>
            </div>
            {/* آمار + پشته */}
            <div className="space-y-2">
              <div className="rounded-xl border border-white/10 bg-black/40 p-2.5">
                <p className="mb-1 text-[10px] font-black text-zinc-500">آمار زنده</p>
                <div className="flex gap-3 text-[12px] font-black" dir="ltr">
                  <span className="text-sky-300">comparisons: {step.stats.comparisons}</span>
                  <span className="text-amber-300">swaps: {step.stats.swaps}</span>
                </div>
              </div>
              {step.callStack && step.callStack.length > 0 && (
                <div className="rounded-xl border border-white/10 bg-black/40 p-2.5">
                  <p className="mb-1 text-[10px] font-black text-zinc-500">پشته فراخوانی (Call Stack)</p>
                  <div dir="ltr" className="space-y-0.5">
                    {[...step.callStack].reverse().map((f, i) => (
                      <p key={i} className="rounded bg-violet-500/15 px-1.5 py-0.5 text-[10px] font-bold text-violet-200" style={{ marginInlineStart: `${i * 8}px` }}>
                        {f}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const ranAwarded = new Set<AlgoId>()

function CtlBtn({ onClick, label, Icon, disabled }: { onClick: () => void; label: string; Icon: typeof Play; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1 rounded-lg bg-white/5 px-2.5 py-1.5 text-[11px] font-bold text-zinc-300 transition hover:bg-white/10 disabled:opacity-30"
    >
      <Icon size={13} aria-hidden />
      {label}
    </button>
  )
}

/* ------------------------------------------------------------------ */
/* Complexity Playground                                               */
/* ------------------------------------------------------------------ */
function Playground({ onBack }: { onBack: () => void }) {
  const [n, setN] = useState(16)
  const model = useMemo(() => complexityModel(n), [n])
  const maxOps = Math.max(...model.map((m) => (m.ops > 10_000 ? 10_000 : m.ops)), 10)

  return (
    <div className="reading-shell prose-fa px-4 pb-10 pt-4">
      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 rounded-lg bg-white/5 px-2.5 py-1.5 text-[11px] font-bold text-zinc-300 transition hover:bg-white/10"
        >
          <ChevronRight size={13} aria-hidden />
          خانه
        </button>
        <h1 className="flex-1 text-[15px] font-black text-white">زمین بازی پیچیدگی</h1>
      </div>

      <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
        <label className="flex items-center gap-3 text-[12px] font-bold text-zinc-300" htmlFor="cg-n">
          اندازه ورودی n = <span dir="ltr" className="font-black text-pink-300">{fa(n)}</span>
          <input
            id="cg-n"
            type="range"
            min={1}
            max={128}
            value={n}
            onChange={(e) => setN(Number(e.target.value))}
            className="flex-1 accent-pink-400"
          />
        </label>

        <div className="mt-4 space-y-2">
          {model.map((m) => {
            const capped = Math.min(m.ops, 10_000)
            const pct = Math.max(2, Math.round((capped / maxOps) * 100))
            const display =
              m.ops > 1e12
                ? '≈ نجومی'
                : m.ops > 9999
                  ? '> ۱۰٬۰۰۰'
                  : fa(m.ops.toLocaleString('en-US'))
            return (
              <div key={m.id}>
                <p className="mb-0.5 flex justify-between text-[11px]">
                  <span dir="ltr" className="font-black text-zinc-300">{m.label}</span>
                  <span dir="ltr" className="tabular-nums text-zinc-500">{display} ops</span>
                </p>
                <div className="h-2 overflow-hidden rounded-full bg-black/30">
                  <div
                    className={`h-full rounded-full transition-all duration-200 ${
                      m.id === 'o2n' ? 'bg-rose-500' : m.id === 'on2' ? 'bg-amber-400' : 'bg-teal-400'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        <Callout kind="tip" title="چرا بعضی الگوریتم‌ها با ورودی بزرگ ناکارآمد می‌شوند؟">
          <p>
            با n=128: خطی فقط ۱۲۸ عملیات می‌خواهد ولی n² یک‌وگیردهزار و 2ⁿ عددی می‌شود که هیچ کامپیوتری تا پایان عمرش نمی‌تواند پردازش کند.
            رشد «شکل» هزینه است، نه ثانیه — برای همین الگوریتم n² روی داده‌های بزرگ عملاً می‌میرد.
          </p>
        </Callout>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* چالش‌ها                                                             */
/* ------------------------------------------------------------------ */
const CH_SKILL_FALLBACK = 'al-thinking'

function Challenges({ onBack }: { onBack: () => void }) {
  const [seed, setSeed] = useState(0)
  const quiz = useMemo(() => {
    void seed
    return buildQuiz(QUESTION_BANK, { track: 'algorithm', count: 5 })
  }, [seed])
  const [done, setDone] = useState<Record<string, boolean>>({})
  const noteChallengePassed = useLearning((s) => s.noteChallengePassed)
  const award = useGame((s) => s.award)
  const pushToast = useOS((s) => s.pushToast)

  const skillTitleOf = (q: (typeof quiz)[number]) =>
    q.skillIds[0] === CH_SKILL_FALLBACK ? 'تفکر الگوریتمی' : q.skillIds[0]?.replace('al-', '')

  const onAnswered = (q: (typeof quiz)[number], correct: boolean) => {
    if (done[q.id] !== undefined) return
    setDone((cur) => ({ ...cur, [q.id]: correct }))
    if (correct) {
      noteChallengePassed('algorithm', 'al-ch-order')
      /* شواهد دقیق‌تر: مهارت اول سؤال */
      const skillId = q.skillIds[0]
      if (skillId) {
        useLearning.setState((s) => {
          const now = Date.now()
          const prev = s.profile.skills[skillId] ?? { state: 'attempted' as const, evidence: [], lastAt: 0 }
          const evidence = [...prev.evidence, { kind: 'challenge-pass' as const, ref: q.id, at: now }].slice(-24)
          return {
            profile: {
              ...s.profile,
              skills: {
                ...s.profile.skills,
                [skillId]: { state: prev.state, evidence, lastAt: now },
              },
            },
          }
        })
      }
      award(`al-ch:${q.id}`, 15, 'حل چالش الگوریتمی')
    }
    if (Object.keys(done).length + 1 >= quiz.length) {
      pushToast({ title: 'چالش‌ها تمام شد! 🧠', body: 'چالش بعدی را با سؤال‌های تازه امتحان کن.' })
    }
  }

  return (
    <div className="reading-shell prose-fa px-4 pb-10 pt-4">
      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 rounded-lg bg-white/5 px-2.5 py-1.5 text-[11px] font-bold text-zinc-300 transition hover:bg-white/10"
        >
          <ChevronRight size={13} aria-hidden />
          خانه
        </button>
        <h1 className="flex-1 text-[15px] font-black text-white">چالش‌های الگوریتمی</h1>
        <button
          type="button"
          onClick={() => {
            setSeed((s) => s + 1)
            setDone({})
          }}
          className="rounded-lg bg-white/10 px-2.5 py-1.5 text-[11px] font-black text-zinc-200 transition hover:bg-white/20"
        >
          <Sparkles size={12} className="me-1 inline" aria-hidden />
          سؤال‌های تازه
        </button>
      </div>

      <div className="space-y-3">
        {quiz.map((q) => (
          <QuestionCard
            key={q.id}
            question={q}
            skillTitle={skillTitleOf(q)}
            onAnswered={(correct) => onAnswered(q, correct)}
          />
        ))}
        {quiz.length === 0 && (
          <p className="py-6 text-center text-[12px] text-zinc-500">چالشی در بانک نیست — بعداً برگرد.</p>
        )}
      </div>
    </div>
  )
}
