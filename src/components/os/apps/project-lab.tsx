'use client'

/* ------------------------------------------------------------------ */
/* Sanjab Project Lab — یادگیری از طریق ساخت                            */
/* پروژه‌های هدایت‌شده با Task List، Hint، Checkpoint، اجرای واقعی      */
/* پایتون با Pyodide و تست خودکار (الگوی PY_PASS)، Export و Portfolio.  */
/* ------------------------------------------------------------------ */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  CheckCircle2,
  ChevronRight,
  Circle,
  Download,
  FlaskConical,
  Hammer,
  Lightbulb,
  Play,
  Save,
  Trophy,
} from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { PROJECTS, PASS_MARK, projectById, type LearningProject } from '@/lib/academy/projects'
import { useLearning } from '@/lib/learning/store'
import { useGame } from '@/lib/gamification/engine'
import { useOS } from '@/lib/os/store'
import { PyodideRunner } from '@/lib/os/pyodide'

const fa = (n: number | string) => String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)])

const DIFF_LABEL = { beginner: 'مقدماتی', intermediate: 'متوسط', advanced: 'پیشرفته' } as const

export default function ProjectLabApp() {
  const [openId, setOpenId] = useState<string | null>(null)
  const noteProjectOpened = useLearning((s) => s.noteProjectOpened)

  const open = useCallback(
    (id: string) => {
      setOpenId(id)
      noteProjectOpened(id)
    },
    [noteProjectOpened]
  )

  if (openId) {
    const proj = projectById(openId)
    if (proj) return <Workspace project={proj} onBack={() => setOpenId(null)} />
  }

  return (
    <div className="os-scroll h-full overflow-y-auto p-4" dir="rtl">
      <header className="mb-4">
        <h1 className="flex items-center gap-2 text-lg font-black text-white">
          <Hammer size={18} className="text-amber-400" aria-hidden />
          Project Lab — یادگیری از طریق ساخت
        </h1>
        <p className="mt-1 text-[12px] leading-6 text-zinc-400">
          بعد از درس‌ها، اینجا چیزی «واقعی» می‌سازی. صرفاً باز کردن پروژه به‌عنوان انجام‌شده ثبت نمی‌شود؛
          مراحل، تست‌های خودکار و خروجی معتبر معیار تکمیل‌اند.
        </p>
      </header>

      <div className="grid gap-2.5 sm:grid-cols-2">
        {PROJECTS.map((p) => (
          <ProjectCard key={p.id} project={p} onOpen={() => open(p.id)} />
        ))}
      </div>
    </div>
  )
}

function ProjectCard({ project, onOpen }: { project: LearningProject; onOpen: () => void }) {
  const rec = useLearning((s) => s.profile.projects[project.id])
  const doneN = rec?.doneSteps.length ?? 0
  const pct = Math.round((doneN / project.steps.length) * 100)
  const state = rec?.completedAt ? 'done' : rec ? 'active' : 'new'

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`rounded-2xl border p-3.5 text-start transition ${
        state === 'done'
          ? 'border-emerald-500/40 bg-emerald-500/5 hover:border-emerald-400/60'
          : 'border-white/10 bg-zinc-900/60 hover:border-amber-400/40 hover:bg-white/5'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] font-black text-zinc-100">{project.title}</p>
        <span
          className={`rounded-md px-1.5 py-0.5 text-[9px] font-black ${
            state === 'done'
              ? 'bg-emerald-500/20 text-emerald-300'
              : state === 'active'
                ? 'bg-amber-400/15 text-amber-300'
                : 'bg-white/5 text-zinc-400'
          }`}
        >
          {state === 'done' ? 'کامل شد ✓' : state === 'active' ? 'در جریان' : DIFF_LABEL[project.difficulty]}
        </span>
      </div>
      <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-zinc-400">{project.description}</p>
      {state === 'active' && <Progress value={pct} className="mt-2 h-1.5" aria-hidden />}
      <p className="mt-1.5 text-[10px] text-zinc-500">
        {fa(project.steps.length)} مرحله ·{' '}
        {project.runtime === 'pyodide' ? 'اجرای واقعی پایتون + تست خودکار' : 'تمرین ترمینال لینوکس'}
      </p>
    </button>
  )
}

/* ------------------------------------------------------------------ */
/* فضای کاری پروژه                                                     */
/* ------------------------------------------------------------------ */
function Workspace({ project, onBack }: { project: LearningProject; onBack: () => void }) {
  const profile = useLearning((s) => s.profile)
  const noteMilestone = useLearning((s) => s.noteProjectMilestone)
  const noteComplete = useLearning((s) => s.noteProjectComplete)
  const saveCode = useLearning((s) => s.saveProjectCode)
  const award = useGame((s) => s.award)
  const pushToast = useOS((s) => s.pushToast)

  const rec = profile.projects[project.id]
  const doneSteps = rec?.doneSteps ?? []
  const [code, setCode] = useState(rec?.code ?? project.starter ?? '')
  const [hintFor, setHintFor] = useState<string | null>(null)
  const [output, setOutput] = useState<string[]>([])
  const [testing, setTesting] = useState(false)
  const [testsPassed, setTestsPassed] = useState(false)
  const runnerRef = useRef<PyodideRunner | null>(null)
  const outRef = useRef<HTMLDivElement>(null)

  const isPy = project.runtime === 'pyodide' && Boolean(project.tests)

  useEffect(() => {
    return () => {
      runnerRef.current?.terminate()
    }
  }, [])

  useEffect(() => {
    outRef.current?.scrollTo({ top: outRef.current.scrollHeight })
  }, [output])

  const toggleStep = (stepId: string) => {
    if (doneSteps.includes(stepId)) return
    noteMilestone(project.id, project.track, stepId)
    award(`pj:${project.id}:${stepId}`, 10, `مرحلهٔ پروژه «${project.title}»`)
  }

  const runTests = useCallback(async () => {
    if (!isPy) return
    setTesting(true)
    const lines: string[] = []
    setOutput(['⏳ راه‌اندازی پایتون واقعی (CPython 3.12 در WebAssembly)…'])
    try {
      const runner = runnerRef.current ?? new PyodideRunner()
      runnerRef.current = runner
      runner.onOut = (kind, text) => {
        lines.push(text)
        setOutput((cur) => [...cur.slice(-200), text])
      }
      await runner.ensure((msg) => {
        lines.push(msg)
        setOutput((cur) => [...cur.slice(-200), msg])
      })
      setOutput((cur) => [...cur, '▶ اجرای کد + تست‌ها…'])
      const full = `${code}\n# --- تست‌های سنجاب‌اواس ---\n${project.tests}`
      const res = await runner.run(full, 20000)
      /* تشخیص پاس از خروجی واقعی — همان الگوی آکادمی پایتون */
      const pass = lines.some((l) => l.includes(PASS_MARK))
      if (pass) {
        setTestsPassed(true)
        for (const st of project.steps) {
          noteMilestone(project.id, project.track, st.id)
          award(`pj:${project.id}:${st.id}`, 10, `مرحلهٔ پروژه «${project.title}»`)
        }
        if (!useLearning.getState().profile.projects[project.id]?.completedAt) {
          noteComplete(project.id, project.track)
          award(`pj-done:${project.id}`, 40, `تکمیل پروژهٔ «${project.title}»`)
          pushToast({
            title: 'پروژه کامل شد! 🏆',
            body: 'شواهد تسلط ثبت شد و به پورتفولیو اضافه گردید.',
          })
        }
      } else if (!res.ok) {
        setOutput((cur) => [...cur, '✗ اجرا با خطا تمام شد — خروجی بالا را بررسی کن.'])
      }
    } catch {
      setOutput((cur) => [...cur, '⚠️ خطای اجرای ران‌تایم.'])
    } finally {
      setTesting(false)
    }
  }, [code, isPy, project, noteMilestone, noteComplete, award, pushToast])



  const exportFile = () => {
    const blob = new Blob([code], { type: 'text/x-python;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${project.id}.py`
    a.click()
    URL.revokeObjectURL(url)
  }

  const progress = Math.round((doneSteps.length / project.steps.length) * 100)
  const completed = Boolean(rec?.completedAt)

  return (
    <div className="flex h-full min-h-0 flex-col" dir="rtl">
      {/* هدر */}
      <div className="flex shrink-0 items-center gap-2 border-b border-white/10 bg-zinc-900/80 px-3 py-2">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 rounded-lg bg-white/5 px-2.5 py-1.5 text-[11px] font-bold text-zinc-300 transition hover:bg-white/10"
        >
          <ChevronRight size={13} aria-hidden />
          پروژه‌ها
        </button>
        <p className="min-w-0 flex-1 truncate text-[12px] font-black text-zinc-100">{project.title}</p>
        {completed && (
          <span className="flex items-center gap-1 rounded-lg bg-emerald-500/20 px-2 py-1 text-[10px] font-black text-emerald-300">
            <Trophy size={11} aria-hidden />
            تکمیل شد
          </span>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3 lg:flex-row">
        {/* ستون مراحل */}
        <div className="w-full shrink-0 space-y-2 lg:w-72">
          <p className="text-[11px] leading-5 text-zinc-400">{project.description}</p>
          <p className="text-[10px] text-zinc-500">
            🎯 {project.outcome}
          </p>
          <Progress value={progress} className="h-1.5" aria-hidden />
          <div className="space-y-1.5">
            {project.steps.map((s, i) => {
              const done = doneSteps.includes(s.id)
              return (
                <div key={s.id} className="rounded-xl border border-white/10 bg-black/25 p-2.5">
                  <div className="flex items-start gap-2">
                    <button
                      type="button"
                      onClick={() => toggleStep(s.id)}
                      aria-pressed={done}
                      aria-label={`مرحلهٔ ${i + 1}: ${s.title}`}
                      className="mt-0.5 shrink-0"
                    >
                      {done ? (
                        <CheckCircle2 size={16} className="text-emerald-400" />
                      ) : (
                        <Circle size={16} className="text-zinc-600 transition hover:text-amber-400" />
                      )}
                    </button>
                    <p className={`min-w-0 flex-1 text-[11px] font-bold leading-5 ${done ? 'text-emerald-300/90 line-through' : 'text-zinc-200'}`}>
                      {fa(i + 1)}. {s.title}
                    </p>
                  </div>
                  {hintFor === s.id && (
                    <p className="mt-1.5 flex items-start gap-1 rounded-lg bg-amber-400/10 px-2 py-1.5 text-[10px] leading-5 text-amber-200">
                      <Lightbulb size={11} className="mt-0.5 shrink-0" aria-hidden />
                      {s.hint}
                    </p>
                  )}
                  {!done && (
                    <button
                      type="button"
                      onClick={() => setHintFor(hintFor === s.id ? null : s.id)}
                      className="mt-1 text-[10px] font-bold text-amber-300/70 transition hover:text-amber-300"
                    >
                      💡 سرنخ
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* ستون کد/اجرای واقعی */}
        {project.runtime === 'pyodide' ? (
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => void runTests()}
                disabled={testing}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-500/80 px-3 py-1.5 text-[11px] font-black text-white transition hover:bg-emerald-500 disabled:opacity-40"
              >
                <FlaskConical size={13} aria-hidden />
                {testing ? 'در حال اجرا…' : 'اجرای تست‌های خودکار'}
              </button>
              <button
                type="button"
                onClick={() => {
                  saveCode(project.id, code)
                  pushToast({ title: 'Checkpoint ذخیره شد', body: 'کدت محفوظ است — بعداً ادامه بده.' })
                }}
                className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-[11px] font-bold text-zinc-300 transition hover:bg-white/10"
              >
                <Save size={13} aria-hidden />
                ذخیرهٔ Checkpoint
              </button>
              <button
                type="button"
                onClick={exportFile}
                className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-[11px] font-bold text-zinc-300 transition hover:bg-white/10"
              >
                <Download size={13} aria-hidden />
                Export .py
              </button>
              {testsPassed && (
                <span className="rounded-lg bg-emerald-500/20 px-2 py-1 text-[10px] font-black text-emerald-300">
                  ✓ تست‌ها پاس شد
                </span>
              )}
            </div>
            <textarea
              dir="ltr"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              aria-label="کد پروژه"
              className="prose-pre min-h-40 flex-1 w-full resize-none rounded-xl border border-white/10 bg-black/40 p-3 font-mono text-[12px] leading-6 text-zinc-100 outline-none focus:border-amber-400/40"
            />
            <div
              ref={outRef}
              dir="ltr"
              className="os-scroll h-36 overflow-y-auto rounded-xl border border-white/10 bg-black/60 p-2.5 font-mono text-[11px] leading-5 text-emerald-200/90"
              role="log"
              aria-label="خروجی اجرا"
            >
              {output.length === 0 ? (
                <p className="text-zinc-600"># خروجی اجرای پایتون واقعی اینجا ظاهر می‌شود…</p>
              ) : (
                output.map((l, i) => (
                  <p key={i} className="whitespace-pre-wrap">
                    {l}
                  </p>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="flex min-w-0 flex-1 flex-col items-start gap-3">
            <div className="w-full rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
              <p className="text-[12px] font-black text-zinc-200">تمرین ترمینال واقعی</p>
              <p className="mt-1 text-[11px] leading-6 text-zinc-400">
                این پروژه با اجرای واقعی لینوکس سنجیده می‌شود: دستورهای مراحل را در «آکادمی لینوکس» (بخش ترمینال) یا
                ترمینال سیستم تمرین کن، بعد مراحل را تیک بزن. تکمیل مراحل = شواهد تسلط.
              </p>
              <Play size={16} className="mt-2 text-amber-400" aria-hidden />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
