'use client'

/* ------------------------------------------------------------------ */
/* مرکز یادگیری سان‌جاب — Learning Hub                                 */
/* تب‌ها: نمای کلی · برنامه امروز · مرور فاصله‌دار · مسیرها ·           */
/*       نقشه مهارت · پروژه‌ها · گزارش هفتگی                           */
/* همه‌چیز از لایهٔ یادگیری (sanjab-learning-v1) و موتور XP می‌آید.     */
/* ------------------------------------------------------------------ */

import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  Brain,
  CalendarClock,
  Compass,
  Flame,
  GraduationCap,
  Hammer,
  Map as MapIcon,
  Play,
  Repeat,
  Route,
  ScrollText,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
} from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { ACHIEVEMENTS, levelOf, useGame, xpForLevel } from '@/lib/gamification/engine'
import {
  MASTERY_ORDER,
  MASTERY_TITLES,
  TRACK_TITLES,
  type MasteryState,
  type TrackId,
} from '@/lib/learning/types'
import { masteredSkillIds, useLearning } from '@/lib/learning/store'
import { dueItems } from '@/lib/learning/review'
import { analyzeEvidence, masteryGap } from '@/lib/learning/mastery'
import { SKILLS, skillsOfTrack } from '@/lib/learning/skills'
import { buildDailyPlan, buildPathSummaries, buildWeeklyReport, type PlanItem } from '@/lib/learning/plan'
import { TRACK_LESSONS, appOfTrack, lessonTitle } from '@/lib/learning/lessons'
import { type Question } from '@/lib/learning/assessment'
import { QUESTION_BANK } from '@/lib/learning/banks'
import { PROJECTS } from '@/lib/academy/projects'
import { launch } from '@/lib/os/apps'
import { useOS } from '@/lib/os/store'
import QuestionCard from '@/components/os/academy/question-card'

const fa = (n: number | string) => String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)])

const TRACK_TINT: Record<TrackId, string> = {
  python: '#2dd4bf',
  linux: '#f7931e',
  rust: '#b7410e',
  ai: '#8b5cf6',
  powershell: '#5391fe',
  algorithm: '#ec4899',
}

const MASTERY_CHIP: Record<MasteryState, string> = {
  'not-started': 'bg-zinc-700/60 text-zinc-400',
  attempted: 'bg-sky-600/25 text-sky-300',
  familiar: 'bg-teal-600/25 text-teal-300',
  proficient: 'bg-violet-600/30 text-violet-300',
  mastered: 'bg-amber-500/20 text-amber-300',
}

type Tab = 'overview' | 'plan' | 'review' | 'paths' | 'skills' | 'projects' | 'weekly'

const TABS: { id: Tab; label: string; Icon: typeof Compass }[] = [
  { id: 'overview', label: 'نمای کلی', Icon: Compass },
  { id: 'plan', label: 'برنامه امروز', Icon: CalendarClock },
  { id: 'review', label: 'مرور', Icon: Repeat },
  { id: 'paths', label: 'مسیرها', Icon: Route },
  { id: 'skills', label: 'مهارت‌ها', Icon: MapIcon },
  { id: 'projects', label: 'پروژه‌ها', Icon: Hammer },
  { id: 'weekly', label: 'گزارش هفته', Icon: BarChart3 },
]

export default function LearningHubApp() {
  const [tab, setTab] = useState<Tab>('overview')
  const profile = useLearning((s) => s.profile)
  const ensureMigrated = useLearning((s) => s.ensureMigrated)
  const game = useGame()
  const { pushToast } = useOSLite()

  useEffect(() => {
    ensureMigrated()
  }, [ensureMigrated])

  const mastered = useMemo(() => masteredSkillIds(profile.skills), [profile.skills])
  const due = useMemo(() => dueItems(profile.review, Date.now(), 99), [profile.review])

  return (
    <div className="flex h-full min-h-0 flex-col" dir="rtl">
      {/* نوار تب */}
      <div className="os-scroll flex shrink-0 gap-1 overflow-x-auto border-b border-white/10 bg-zinc-900/70 px-2 py-1.5 backdrop-blur">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            aria-pressed={tab === id}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-black transition ${
              tab === id ? 'bg-[#f7931e]/20 text-[#f7931e]' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
            }`}
          >
            <Icon size={13} aria-hidden />
            {label}
            {id === 'review' && due.length > 0 && (
              <span className="grid min-w-4 place-items-center rounded-full bg-rose-500/90 px-1 text-[9px] font-black text-white" dir="ltr">
                {fa(due.length)}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="os-scroll min-h-0 flex-1 overflow-y-auto p-4">
        {tab === 'overview' && <Overview onGoReview={() => setTab('review')} onGoPlan={() => setTab('plan')} dueCount={due.length} />}
        {tab === 'plan' && <PlanTab />}
        {tab === 'review' && <ReviewTab due={due} pushToast={pushToast} />}
        {tab === 'paths' && <PathsTab />}
        {tab === 'skills' && <SkillsTab />}
        {tab === 'projects' && <ProjectsTab />}
        {tab === 'weekly' && <WeeklyTab />}

        {/* فوتر: موتور XP — نگه‌داشته‌شده و متصل */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-zinc-900/40 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-[11px] font-black text-zinc-300">
              <Trophy size={13} className="text-amber-400" />
              موتور انگیزش: سطح {fa(levelOf(game.xp))} — {fa(game.xp)} XP · زنجیره {fa(game.streakCount)} روز
            </p>
            <p className="text-[10px] text-zinc-500">
              {fa(game.achievements.length)}/{fa(ACHIEVEMENTS.length)} دستاورد · رویدادهای XP ضدتکرار (Idempotent)
            </p>
          </div>
          <Progress
            value={Math.min(100, Math.round(((game.xp - xpForLevel(levelOf(game.xp))) / Math.max(1, xpForLevel(levelOf(game.xp) + 1) - xpForLevel(levelOf(game.xp)))) * 100))}
            className="mt-2 h-1.5"
            aria-label="پیشرفت سطح"
          />
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* نمای کلی                                                            */
/* ------------------------------------------------------------------ */
function Overview({ onGoReview, onGoPlan, dueCount }: { onGoReview: () => void; onGoPlan: () => void; dueCount: number }) {
  const profile = useLearning((s) => s.profile)
  const game = useGame()

  /* کارت «ادامه یادگیری» — برجسته‌ترین بخش */
  const ls = profile.lastSession
  const continueTrack = ls?.track
  const continueLesson = ls ? lessonTitle(ls.track, ls.lessonId) : null
  const trackRecs = ls ? (profile.lessons[ls.track] ?? {}) : {}
  const trackAll = ls ? TRACK_LESSONS[ls.track] : []
  const doneCount = trackAll.filter((l) => trackRecs[l.id]?.done).length
  const trackPct = trackAll.length > 0 ? Math.round((doneCount / trackAll.length) * 100) : 0

  /* آمار مهارت‌ها */
  const masteryCounts = useMemo(() => {
    const counts: Record<MasteryState, number> = {
      'not-started': 0,
      attempted: 0,
      familiar: 0,
      proficient: 0,
      mastered: 0,
    }
    for (const s of Object.values(profile.skills)) counts[s.state]++
    return counts
  }, [profile.skills])
  const activeSkills = Object.values(profile.skills).filter((s) => s.state !== 'not-started').length
  const totalSkills = SKILLS.length

  /* امروز */
  const dayKey = (() => {
    const d = new Date()
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
  })()
  const todayMin = Math.round((profile.reading[dayKey] ?? 0) / 60)
  const settings = useOS((st) => st.settings)
  const goal = settings.dailyGoalMin
  const goalPct = Math.min(100, Math.round((todayMin / Math.max(1, goal)) * 100))

  return (
    <div className="space-y-4">
      {/* خوشامگویی سنجابک */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-l from-[#f7931e]/15 via-violet-500/10 to-transparent p-4">
        <div className="flex items-start gap-3">
          <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#f7931e] to-[#e07b00] text-xl shadow-lg" aria-hidden>
            🐿️
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-black text-zinc-100">
              {game.streakCount >= 3 ? 'زنجیره‌ات داغ است!' : todayMin > 0 ? 'خوش برگشتی!' : 'آمادهٔ یادگیری امروز؟'}
            </h2>
            <p className="mt-0.5 text-[11px] leading-5 text-zinc-400">
              {activeSkills > 0
                ? `${fa(activeSkills)} مهارت فعال داری · ${fa(masteryCounts.mastered)} تسلط کامل · ${dueCount > 0 ? `${fa(dueCount)} مرور سررسید` : 'مرور معوق نداری'}`
                : 'مسیر یادگیری‌ات را انتخاب کن و اولین درس را باز کن — سنجابک همراهت است.'}
            </p>
          </div>
        </div>
      </div>

      {/* ادامهٔ یادگیری */}
      {continueTrack && continueLesson && (
        <button
          type="button"
          onClick={() => launch(appOfTrack(continueTrack))}
          className="group w-full rounded-2xl border border-teal-500/30 bg-teal-500/10 p-4 text-start transition hover:border-teal-400/60 hover:bg-teal-500/15"
        >
          <p className="flex items-center gap-1.5 text-[10px] font-black text-teal-300">
            <Play size={12} aria-hidden />
            ادامهٔ یادگیری — یک کلیک تا جای قبلی
          </p>
          <p className="mt-1.5 text-[13px] font-black text-zinc-100">
            {TRACK_TITLES[continueTrack]} · «{continueLesson}»
          </p>
          <div className="mt-2 flex items-center gap-2">
            <Progress value={trackPct} className="h-1.5 flex-1" aria-label={`پیشرفت ${TRACK_TITLES[continueTrack]}`} />
            <span className="text-[10px] font-black text-teal-300" dir="ltr">{fa(trackPct)}٪</span>
          </div>
          <p className="mt-1.5 flex items-center gap-1 text-[11px] text-teal-200/80">
            باز کردن آکادمی و ادامه
            <ArrowLeft size={12} className="transition group-hover:-translate-x-0.5" aria-hidden />
          </p>
        </button>
      )}

      {/* آمار امروز */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCard Icon={Flame} tint="text-orange-400" label="زنجیره روزها" value={`${fa(game.streakCount)} روز`} />
        <StatCard Icon={BookOpen} tint="text-teal-400" label="مطالعه امروز" value={`${fa(todayMin)} دقیقه`} sub={`هدف ${fa(goal)}`} pct={goalPct} />
        <StatCard Icon={Repeat} tint="text-rose-300" label="مرور سررسید" value={`${fa(dueCount)} مفهوم`} onClick={onGoReview} />
        <StatCard Icon={GraduationCap} tint="text-violet-300" label="مهارت فعال" value={`${fa(activeSkills)}/${fa(totalSkills)}`} />
      </div>

      {/* عصارهٔ تسلط */}
      <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-black text-zinc-200">
          <Brain size={14} className="text-violet-400" />
          وضعیت تسلط بر مهارت‌ها
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {MASTERY_ORDER.slice(1).map((st) => (
            <div key={st} className={`rounded-xl border border-white/10 p-2 text-center ${MASTERY_CHIP[st]}`}>
              <p className="text-lg font-black" dir="ltr">{fa(masteryCounts[st])}</p>
              <p className="text-[10px] font-bold">{MASTERY_TITLES[st]}</p>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[10px] leading-5 text-zinc-500">
          تسلط از «شواهد واقعی» محاسبه می‌شود — درس، تمرین عملی، آزمون و مرور فاصله‌دار. تکمیل دوره جداست از تسلط.
        </p>
      </div>

      {/* فید رویدادهای یادگیری */}
      <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-black text-zinc-200">
          <ScrollText size={14} className="text-zinc-400" />
          رویدادهای اخیر یادگیری
        </p>
        <div className="os-scroll max-h-44 space-y-1 overflow-y-auto">
          {[...profile.events].reverse().slice(0, 25).map((e) => (
            <div key={e.id} className="flex items-center justify-between gap-2 rounded-lg bg-black/25 px-2.5 py-1.5">
              <span className="truncate text-[11px] text-zinc-300">{e.label}</span>
              <span className="shrink-0 text-[10px] text-zinc-500">
                {new Date(e.at).toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          ))}
          {profile.events.length === 0 && (
            <p className="py-3 text-center text-[11px] text-zinc-500">
              هنوز رویدادی ثبت نشده — با باز کردن اولین درس، اینجا زنده می‌شود.
            </p>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onGoPlan}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-white/5 py-2.5 text-[12px] font-black text-zinc-200 transition hover:bg-white/10"
      >
        <Target size={14} aria-hidden />
        برنامهٔ امروزت را ببین
      </button>
    </div>
  )
}

function StatCard({
  Icon,
  tint,
  label,
  value,
  sub,
  pct,
  onClick,
}: {
  Icon: typeof Flame
  tint: string
  label: string
  value: string
  sub?: string
  pct?: number
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`rounded-xl border border-white/10 bg-black/25 p-2.5 text-start transition ${onClick ? 'hover:border-white/25 hover:bg-white/5' : 'cursor-default'}`}
    >
      <p className="flex items-center gap-1 text-[10px] text-zinc-500">
        <Icon size={11} className={tint} aria-hidden />
        {label}
      </p>
      <p className="mt-0.5 text-base font-black text-zinc-100">{value}</p>
      {sub && <p className="text-[9px] text-zinc-500">{sub}</p>}
      {pct !== undefined && <Progress value={pct} className="mt-1.5 h-1" aria-hidden />}
    </button>
  )
}

/* ------------------------------------------------------------------ */
/* برنامه امروز                                                        */
/* ------------------------------------------------------------------ */
function PlanTab() {
  const [budget, setBudget] = useState(20)
  const [seed, setSeed] = useState(0)
  const plan = useMemo(() => {
    void seed
    return buildDailyPlan(budget)
  }, [budget, seed])

  const kindMeta: Record<PlanItem['kind'], { label: string; Icon: typeof Target; tint: string }> = {
    review: { label: 'مرور', Icon: Repeat, tint: 'text-rose-300' },
    continue: { label: 'ادامه', Icon: Play, tint: 'text-teal-300' },
    practice: { label: 'تمرین', Icon: Hammer, tint: 'text-amber-300' },
    challenge: { label: 'چالش', Icon: Sparkles, tint: 'text-violet-300' },
    project: { label: 'پروژه', Icon: TrendingUp, tint: 'text-sky-300' },
  }

  const go = (item: PlanItem) => {
    if (item.target.app) launch(item.target.app)
    else if (item.target.track) launch(appOfTrack(item.target.track))
    else setSeed((s) => s + 1)
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
        <p className="flex items-center gap-1.5 text-xs font-black text-zinc-200">
          <CalendarClock size={14} className="text-teal-400" />
          چقدر وقت داری؟
        </p>
        <div className="mt-2 grid grid-cols-4 gap-1.5">
          {[10, 20, 30, 45].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setBudget(m)}
              aria-pressed={budget === m}
              className={`rounded-xl border py-2 text-[12px] font-black transition ${
                budget === m
                  ? 'border-teal-400/60 bg-teal-500/15 text-teal-200'
                  : 'border-white/10 bg-black/25 text-zinc-400 hover:bg-white/5'
              }`}
            >
              {fa(m)} دقیقه
            </button>
          ))}
        </div>
        <p className="mt-2 text-[10px] leading-5 text-zinc-500">
          برنامه بر اساس دادهٔ واقعی تو ساخته می‌شود: اول مرورهای سررسید، بعد ادامهٔ درس جاری، تمرین مهارت ضعیف، چالش و پروژه.
          وقت کم؟ کوتاه ولی مفید.
        </p>
      </div>

      <div className="space-y-2">
        {plan.map((item, i) => {
          const meta = kindMeta[item.kind]
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => go(item)}
              className="flex w-full items-start gap-3 rounded-2xl border border-white/10 bg-zinc-900/60 p-3.5 text-start transition hover:border-white/25 hover:bg-white/5"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-black/30" aria-hidden>
                <meta.Icon size={16} className={meta.tint} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="text-[12px] font-black text-zinc-100">{item.title}</span>
                  <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[9px] font-bold text-zinc-400">{meta.label}</span>
                </span>
                <span className="mt-0.5 block text-[11px] leading-5 text-zinc-400">{item.detail}</span>
              </span>
              <span className="shrink-0 rounded-lg bg-black/30 px-2 py-1 text-[10px] font-bold text-zinc-400" dir="ltr">
                ~{fa(item.minutes)}′
              </span>
              <span className="mt-0.5 shrink-0 text-[10px] text-zinc-600" aria-hidden>{fa(i + 1)}</span>
            </button>
          )
        })}
        {plan.length === 0 && (
          <p className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6 text-center text-[12px] text-zinc-500">
            فعلاً برنامه‌ای نیست — یک آکادمی را شروع کن تا برنامهٔ هوشمند فعال شود.
          </p>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* مرور فاصله‌دار — جلسهٔ مرور واقعی                                    */
/* ------------------------------------------------------------------ */
interface DueItemLite {
  id: string
  title: string
  track: TrackId
  skillId?: string
  reps: number
}

function ReviewTab({
  due,
  pushToast,
}: {
  due: ReturnType<typeof dueItems>
  pushToast: (t: { title: string; body: string }) => void
}) {
  const noteReviewResult = useLearning((s) => s.noteReviewResult)
  const award = useGame((s) => s.award)
  const [session, setSession] = useState<DueItemLite[] | null>(null)
  const [idx, setIdx] = useState(0)
  const [question, setQuestion] = useState<Question | null>(null)
  const [qSkill, setQSkill] = useState<string | undefined>()

  const start = () => {
    const items = due.slice(0, 10).map((r) => ({
      id: r.id,
      title: r.title,
      track: r.track,
      skillId: r.skillId,
      reps: r.reps,
    }))
    setSession(items)
    setIdx(0)
    pickQuestion(items[0])
  }

  const pickQuestion = (item: DueItemLite | undefined) => {
    if (!item) {
      setQuestion(null)
      return
    }
    if (item.skillId) {
      const pool = QUESTION_BANK.filter((q) => q.skillIds.includes(item.skillId!))
      if (pool.length > 0) {
        setQuestion(pool[Math.floor(Math.random() * pool.length)])
        setQSkill(SKILLS.find((s) => s.id === item.skillId)?.title)
        return
      }
    }
    setQuestion(null)
    setQSkill(undefined)
  }

  const finishItem = (correct: boolean, confidence: 'sure' | 'shaky') => {
    if (!session) return
    const item = session[idx]
    noteReviewResult(item.id, correct, confidence)
    if (correct) {
      /* ضد فارم: هر تکرار مرور فقط یک‌بار XP */
      award(`review:${item.id}:${item.reps + 1}`, 8, `مرور «${item.title}»`)
    }
    const next = idx + 1
    if (next >= session.length) {
      setSession(null)
      setIdx(0)
      setQuestion(null)
      pushToast({
        title: 'جلسهٔ مرور کامل شد 🎉',
        body: 'مرور فاصله‌دار، دشمن فراموشی است — فردا هم سر بزن.',
      })
    } else {
      setIdx(next)
      pickQuestion(session[next])
    }
  }

  /* جلسه فعال */
  if (session && session.length > 0) {
    const item = session[idx]
    const isLast = idx === session.length - 1
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-zinc-900/60 p-3">
          <p className="text-[12px] font-black text-zinc-200">
            مرور {fa(idx + 1)} از {fa(session.length)}
          </p>
          <button
            type="button"
            onClick={() => setSession(null)}
            className="rounded-lg bg-white/5 px-2.5 py-1 text-[11px] font-bold text-zinc-400 transition hover:bg-white/10"
          >
            پایان جلسه
          </button>
        </div>
        <Progress value={Math.round(((idx) / session.length) * 100)} className="h-1.5" aria-hidden />

        {question ? (
          <QuestionCard
            question={question}
            skillTitle={qSkill}
            onAnswered={(correct, hintsUsed) => finishItem(correct, hintsUsed > 0 ? 'shaky' : 'sure')}
            onNext={!isLast ? () => undefined : undefined}
          />
        ) : (
          /* یادآوری خودارزیابی — برای مفاهیم بدون سؤال بانکی */
          <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
            <p className="text-[11px] font-black text-rose-300">یادآوری فعال</p>
            <p className="prose-fa mt-2 text-[14px] font-black leading-8 text-zinc-100">
              «{item.title}» — بدون نگاه به درس، توضیح بده: این مفهوم چیست و کجا به‌کار می‌آید؟
            </p>
            <p className="mt-1 text-[11px] text-zinc-500">صادق باش — مغز تو فقط خودش می‌داند! نتیجه در زمان‌بندی مرور اثر می‌گذارد.</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                { label: 'بلد بودم ✅', correct: true, conf: 'sure' as const, cls: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20' },
                { label: 'مطمئن نیستم 🤔', correct: true, conf: 'shaky' as const, cls: 'border-amber-400/40 bg-amber-400/10 text-amber-200 hover:bg-amber-400/20' },
                { label: 'یادم نبود ❌', correct: false, conf: 'sure' as const, cls: 'border-rose-500/40 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20' },
              ].map((b) => (
                <button
                  key={b.label}
                  type="button"
                  onClick={() => finishItem(b.correct, b.conf)}
                  className={`rounded-xl border py-2.5 text-[12px] font-black transition ${b.cls}`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  /* لیست سررسید */
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
        <p className="flex items-center gap-1.5 text-xs font-black text-zinc-200">
          <Repeat size={14} className="text-rose-300" />
          صف مرور فاصله‌دار
        </p>
        <p className="mt-1 text-[11px] leading-5 text-zinc-400">
          مفاهیمی که زمان مرورشان رسیده — زمان‌بند نردبانی (الهام از SM-2): پاسخ درست فاصله را ×ease زیاد می‌کند، فراموشی برمی‌گرداند به ۱ روز.
        </p>
        {due.length > 0 && (
          <button
            type="button"
            onClick={start}
            className="mt-3 w-full rounded-xl bg-rose-500/80 py-2.5 text-[13px] font-black text-white transition hover:bg-rose-500"
          >
            شروع جلسهٔ مرور ({fa(Math.min(due.length, 10))} آیتم)
          </button>
        )}
      </div>

      {due.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6 text-center">
          <p className="text-[12px] text-zinc-400">صف مرور خالی است 👏</p>
          <p className="mt-1 text-[11px] leading-5 text-zinc-500">
            مرورها بعد از تکمیل درس و آزمون‌ها ساخته می‌شوند — هر درس تازه، مفاهیمش وارد چرخهٔ مرور می‌شوند.
          </p>
        </div>
      )}

      <div className="space-y-1.5">
        {due.slice(0, 20).map((r) => (
          <div key={r.id} className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/25 px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-[12px] font-bold text-zinc-200">{r.title}</p>
              <p className="text-[10px] text-zinc-500">
                {TRACK_TITLES[r.track]} · {r.lapses > 0 ? `${fa(r.lapses)} بار فراموشی` : 'بدون فراموشی'} · تکرار {fa(r.reps)}
              </p>
            </div>
            <span className="shrink-0 rounded-lg bg-rose-500/15 px-2 py-1 text-[10px] font-black text-rose-300">
              سررسید
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* مسیرها                                                              */
/* ------------------------------------------------------------------ */
function PathsTab() {
  const profile = useLearning((s) => s.profile)
  const paths = useMemo(
    () =>
      buildPathSummaries({
        python: TRACK_LESSONS.python.map((l) => l.id),
        linux: TRACK_LESSONS.linux.map((l) => l.id),
        rust: TRACK_LESSONS.rust.map((l) => l.id),
        ai: TRACK_LESSONS.ai.map((l) => l.id),
        powershell: TRACK_LESSONS.powershell.map((l) => l.id),
        algorithm: TRACK_LESSONS.algorithm.map((l) => l.id),
      }),
    [profile]
  )

  return (
    <div className="space-y-3">
      {paths.map((p) => {
        const completion = p.totalLessons > 0 ? Math.round((p.doneLessons / p.totalLessons) * 100) : 0
        const mastery = p.skillsTotal > 0 ? Math.round((p.skillsMastered / p.skillsTotal) * 100) : 0
        const started = p.doneLessons > 0
        return (
          <div key={p.track} className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[13px] font-black" style={{ color: TRACK_TINT[p.track] }}>
                {TRACK_TITLES[p.track]}
              </p>
              <button
                type="button"
                onClick={() => launch(appOfTrack(p.track))}
                className="rounded-lg bg-white/8 px-2.5 py-1 text-[11px] font-black text-zinc-200 transition hover:bg-white/15"
              >
                {started ? 'ادامه' : 'شروع'}
              </button>
            </div>
            {/* دو معیار جدا: تکمیل محتوا و تسلط مهارت */}
            <div className="mt-2.5 grid grid-cols-2 gap-3">
              <div>
                <p className="mb-1 flex justify-between text-[10px] text-zinc-500">
                  <span>تکمیل محتوا</span>
                  <span dir="ltr">{fa(p.doneLessons)}/{fa(p.totalLessons)}</span>
                </p>
                <Progress value={completion} className="h-1.5" aria-label="تکمیل محتوا" />
              </div>
              <div>
                <p className="mb-1 flex justify-between text-[10px] text-zinc-500">
                  <span>تسلط مهارت‌ها</span>
                  <span dir="ltr">{fa(p.skillsMastered)}/{fa(p.skillsTotal)}</span>
                </p>
                <Progress value={mastery} className="h-1.5 [&>div]:bg-amber-400" aria-label="تسلط مهارت‌ها" />
              </div>
            </div>
            {p.nextSkill && (
              <p className="mt-2 text-[11px] text-zinc-400">
                <span className="text-zinc-500">قدم بعدی:</span> تسلط بر «{p.nextSkill}»
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* نقشه مهارت                                                          */
/* ------------------------------------------------------------------ */
function SkillsTab() {
  const profile = useLearning((s) => s.profile)
  const mastered = masteredSkillIds(profile.skills)
  const [track, setTrack] = useState<TrackId>('python')
  const skills = skillsOfTrack(track)

  return (
    <div className="space-y-3">
      <div className="os-scroll flex gap-1 overflow-x-auto pb-1">
        {(Object.keys(TRACK_TITLES) as TrackId[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTrack(t)}
            aria-pressed={track === t}
            className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-black transition ${
              track === t ? 'text-white' : 'text-zinc-400 hover:bg-white/5'
            }`}
            style={track === t ? { background: `${TRACK_TINT[t]}33`, color: TRACK_TINT[t] } : undefined}
          >
            {TRACK_TITLES[t]}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {skills.map((s) => {
          const st = profile.skills[s.id] ?? { state: 'not-started' as MasteryState, evidence: [], lastAt: 0 }
          const gap = masteryGap(st.evidence, st.state)
          const prereqsOk = s.prereq.every((p) => mastered.has(p))
          const evidence = analyzeEvidence(st.evidence)
          return (
            <div key={s.id} className="rounded-2xl border border-white/10 bg-zinc-900/60 p-3.5">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[12px] font-black text-zinc-100">{s.title}</p>
                <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-black ${MASTERY_CHIP[st.state]}`}>
                  {MASTERY_TITLES[st.state]}
                </span>
                {!prereqsOk && (
                  <span className="rounded-md bg-zinc-700/60 px-1.5 py-0.5 text-[9px] font-bold text-zinc-400">
                    نیاز به پیش‌نیاز
                  </span>
                )}
              </div>
              {s.prereq.length > 0 && (
                <p className="mt-1 text-[10px] text-zinc-500">
                  پیش‌نیاز: {s.prereq.map((p) => SKILLS.find((x) => x.id === p)?.title ?? p).join(' · ')}
                </p>
              )}
              {gap && st.state !== 'not-started' && (
                <p className="mt-1 text-[11px] leading-5 text-amber-200/80">{gap}</p>
              )}
              {st.evidence.length > 0 && (
                <p className="mt-1 text-[10px] text-zinc-500" dir="ltr">
                  evidence score: {fa(Math.round(evidence.score))} · {fa(st.evidence.length)} events
                </p>
              )}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {s.lessons.slice(0, 4).map((lid) => {
                  const done = profile.lessons[s.track]?.[lid]?.done
                  return (
                    <span
                      key={lid}
                      className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold ${
                        done ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/5 text-zinc-500'
                      }`}
                    >
                      {done ? '✓ ' : ''}
                      {lessonTitle(s.track, lid)}
                    </span>
                  )
                })}
                {s.lessons.length > 4 && (
                  <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[9px] text-zinc-500">
                    +{fa(s.lessons.length - 4)} درس
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* پروژه‌ها                                                            */
/* ------------------------------------------------------------------ */
function ProjectsTab() {
  const profile = useLearning((s) => s.profile)
  return (
    <div className="space-y-2.5">
      <p className="text-[11px] leading-5 text-zinc-500">
        پروژه = جایی که مهارت به «توانایی واقعی» تبدیل می‌شود. تکمیل پروژه شواهد تسلط می‌سازد و در پورتفولیو ثبت می‌شود.
      </p>
      {PROJECTS.map((p) => {
        const rec = profile.projects[p.id]
        const total = p.steps.length
        const doneN = rec?.doneSteps.length ?? 0
        const pct = total > 0 ? Math.round((doneN / total) * 100) : 0
        const state = rec?.completedAt ? 'done' : rec ? 'active' : 'new'
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => launch('project-lab')}
            className="w-full rounded-2xl border border-white/10 bg-zinc-900/60 p-3.5 text-start transition hover:border-white/25 hover:bg-white/5"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-[12px] font-black text-zinc-100">{p.title}</p>
              <span
                className={`rounded-md px-1.5 py-0.5 text-[9px] font-black ${
                  state === 'done'
                    ? 'bg-emerald-500/15 text-emerald-300'
                    : state === 'active'
                      ? 'bg-amber-400/15 text-amber-300'
                      : 'bg-white/5 text-zinc-400'
                }`}
              >
                {state === 'done' ? 'کامل شد ✓' : state === 'active' ? `در جریان ${fa(doneN)}/${fa(total)}` : 'شروع نشده'}
              </span>
            </div>
            <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-zinc-400">{p.description}</p>
            {state === 'active' && <Progress value={pct} className="mt-2 h-1.5" aria-hidden />}
            <p className="mt-1.5 flex flex-wrap gap-1">
              {p.skillIds.map((sid) => (
                <span key={sid} className="rounded-md bg-violet-500/15 px-1.5 py-0.5 text-[9px] font-bold text-violet-300">
                  {SKILLS.find((s) => s.id === sid)?.title ?? sid}
                </span>
              ))}
            </p>
          </button>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* گزارش هفتگی                                                         */
/* ------------------------------------------------------------------ */
function WeeklyTab() {
  const report = useMemo(() => buildWeeklyReport(), [])
  const maxTrack = Math.max(1, ...Object.values(report.byTrack).map((v) => v ?? 0))

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
        <p className="flex items-center gap-1.5 text-xs font-black text-zinc-200">
          <BarChart3 size={14} className="text-sky-300" />
          هفتهٔ اخیر — فقط از دادهٔ واقعی
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <MiniStat label="درس تکمیل‌شده" value={report.lessonsCompleted} tint="text-teal-300" />
          <MiniStat label="تمرین پاس‌شده" value={report.exercisesPassed} tint="text-amber-300" />
          <MiniStat label="مرور انجام‌شده" value={report.reviewsDone} tint="text-rose-300" />
          <MiniStat label="آزمون داده‌شده" value={report.assessments} tint="text-violet-300" />
          <MiniStat label="دقیقه مطالعه" value={report.readingMinutes} tint="text-sky-300" />
          <MiniStat label="مرحلهٔ پروژه" value={report.projectsTouched} tint="text-emerald-300" />
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
        <p className="mb-2 text-xs font-black text-zinc-200">فعالیت به تفکیک مسیر</p>
        <div className="space-y-2">
          {(Object.entries(report.byTrack) as [TrackId, number][]).map(([t, n]) => (
            <div key={t}>
              <p className="mb-1 flex justify-between text-[10px] text-zinc-500">
                <span>{TRACK_TITLES[t]}</span>
                <span dir="ltr">{fa(n)} رویداد</span>
              </p>
              <div className="h-1.5 overflow-hidden rounded-full bg-black/30">
                <div className="h-full rounded-full" style={{ width: `${Math.round((n / maxTrack) * 100)}%`, background: TRACK_TINT[t] }} />
              </div>
            </div>
          ))}
          {Object.keys(report.byTrack).length === 0 && (
            <p className="py-2 text-center text-[11px] text-zinc-500">این هفته فعالیتی ثبت نشده.</p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
        <p className="mb-2 text-xs font-black text-zinc-200">توصیهٔ هفتهٔ بعد</p>
        {report.skillsImproved.length > 0 && (
          <p className="text-[11px] leading-6 text-zinc-300">
            📈 این مهارت‌ها ارتقا گرفتند: {report.skillsImproved.map((s) => `«${s}»`).join('، ')} — خوب بود!
          </p>
        )}
        {report.needsReview.length > 0 && (
          <p className="mt-1.5 text-[11px] leading-6 text-amber-200/80">
            🔁 این‌ها منتظر مرورند: {report.needsReview.map((s) => `«${s}»`).join('، ')}
          </p>
        )}
        {report.assessments < 2 && (
          <p className="mt-1.5 text-[11px] leading-6 text-zinc-400">
            📝 این هفته کمتر از دو آزمون دادی — آزمون کوتاه، بهترین ابزار تثبیت حافظه است.
          </p>
        )}
        {report.lessonsCompleted === 0 && report.reviewsDone === 0 && (
          <p className="mt-1.5 text-[11px] leading-6 text-zinc-400">
            🌱 هفتهٔ آرامی بود — برنامهٔ امروز را باز کن و با ۱۰ دقیقه شروع کن.
          </p>
        )}
      </div>
    </div>
  )
}

function MiniStat({ label, value, tint }: { label: string; value: number; tint: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/25 p-2.5 text-center">
      <p className={`text-lg font-black ${tint}`} dir="ltr">{fa(value)}</p>
      <p className="text-[10px] text-zinc-500">{label}</p>
    </div>
  )
}

/* دسترسی سبک به pushToast */
function useOSLite() {
  const pushToast = useOS((s) => s.pushToast)
  return { pushToast }
}
