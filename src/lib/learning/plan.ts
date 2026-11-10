/**
 * برنامهٔ روزانه و گزارش هفتگی، همه از دادهٔ واقعی
 *
 * برنامهٔ روز بر اساس: مرورهای سررسید → ادامهٔ درس جاری → تمرین مهارت ضعیف
 * → چالش → پروژه. مدت‌های ۱۰/۲۰/۳۰/۴۵ دقیقه انتخاب کاربر است و برنامه
 * متناسب با بودجهٔ زمان کوتاه می‌شود.
 */
import { useLearning } from './store'
import { dueItems } from './review'
import { SKILLS, prereqsMet, skillsOfTrack } from './skills'
import { masteredSkillIds } from './store'
import type { TrackId } from './types'

export interface PlanItem {
  id: string
  kind: 'review' | 'continue' | 'practice' | 'challenge' | 'project'
  title: string
  detail: string
  minutes: number
  /** مسیر برای CTA */
  target: { app?: string; track?: TrackId; lessonId?: string }
}

const DAY = 86_400_000

/** درس جاری هر مسیر، اولین درس ناتمام به ترتیب */
export function currentLessonOfTrack(
  track: TrackId,
  lessonIds: string[],
  done: Record<string, { done: boolean }> | undefined
): string | null {
  for (const id of lessonIds) {
    if (!done?.[id]?.done) return id
  }
  return null
}

/** برنامهٔ امروز، از دادهٔ واقعی کاربر */
export function buildDailyPlan(budgetMin: number): PlanItem[] {
  const p = useLearning.getState().profile
  const items: PlanItem[] = []
  const now = Date.now()

  // ۱) مرورهای سررسید، همیشه اولویت اول
  const due = dueItems(p.review, now, 10)
  for (const r of due.slice(0, 4)) {
    items.push({
      id: `review:${r.id}`,
      kind: 'review',
      title: `مرور «${r.title}»`,
      detail: r.lastCorrect
        ? 'مرور موفق قبلی، برای تثبیت فاصله‌دار'
        : 'قبلاً فراموش شده، اولویت تثبیت',
      minutes: 2,
      target: { app: 'learning' },
    })
  }

  // ۲) ادامهٔ درس جاری
  if (p.lastSession) {
    const ls = p.lastSession
    const rec = p.lessons[ls.track]?.[ls.lessonId]
    if (!rec?.done) {
      items.push({
        id: 'continue',
        kind: 'continue',
        title: 'ادامهٔ درس جاری',
        detail: `آخرین مطالعهٔ تو در ${ls.track === 'python' ? 'آکادمی پایتون' : ls.track === 'linux' ? 'آکادمی لینوکس' : ls.track === 'rust' ? 'آکادمی راست' : ls.track === 'ai' ? 'آکادمی هوش مصنوعی' : ls.track === 'powershell' ? 'آکادمی پاورشل' : 'آکادمی الگوریتم'}، درس «${ls.lessonId}»`,
        minutes: 10,
        target: { track: ls.track, lessonId: ls.lessonId },
      })
    }
  }

  // ۳) تمرین برای ضعیف‌ترین مهارت فعال (کم‌ترین امتیاز شواهد بین attempted/familiar)
  const weak = Object.entries(p.skills)
    .filter(([, s]) => s.state === 'attempted' || s.state === 'familiar')
    .sort((a, b) => a[1].evidence.length - b[1].evidence.length)
    .slice(0, 1)
  for (const [id, st] of weak) {
    const def = SKILLS.find((s) => s.id === id)
    if (!def) continue
    items.push({
      id: `practice:${id}`,
      kind: 'practice',
      title: `تمرین مهارت «${def.title}»`,
      detail:
        st.state === 'familiar'
          ? 'برای رسیدن به سطح «مسلط» یک تمرین عملی لازم است'
          : 'این مهارت تازه شروع شده، تمرین آن را محکم می‌کند',
      minutes: 8,
      target: { track: def.track, lessonId: def.lessons[0] },
    })
  }

  // ۴) چالش الگوریتمی روزانه
  items.push({
    id: 'challenge',
    kind: 'challenge',
    title: 'یک چالش الگوریتمی حل کن',
    detail: 'پیش‌بینی گام بعدی الگوریتم یا تحلیل پیچیدگی، در آکادمی الگوریتم',
    minutes: 6,
    target: { app: 'algorithm-academy' },
  })

  // ۵) پروژهٔ فعال
  const activeProjects = Object.entries(p.projects).filter(([, pr]) => !pr.completedAt)
  if (activeProjects.length > 0) {
    items.push({
      id: 'project',
      kind: 'project',
      title: 'پیشرفت در پروژهٔ فعال',
      detail: `${activeProjects.length} پروژهٔ ناتمام داری، یک مرحله جلو برو`,
      minutes: 12,
      target: { app: 'project-lab' },
    })
  }

  // برش با بودجهٔ زمان، اگر وقت کم است، کوتاه ولی مفید
  const out: PlanItem[] = []
  let used = 0
  for (const it of items) {
    if (used + it.minutes <= budgetMin || out.length === 0) {
      out.push(it)
      used += it.minutes
    }
    if (used >= budgetMin) break
  }
  return out
}

/** گزارش هفتگی، فقط از رویدادهای واقعی ۷ روز اخیر */
export interface WeeklyReport {
  lessonsCompleted: number
  exercisesPassed: number
  reviewsDone: number
  assessments: number
  readingMinutes: number
  skillsImproved: string[]
  needsReview: string[]
  projectsTouched: number
  byTrack: Partial<Record<TrackId, number>>
}

export function buildWeeklyReport(): WeeklyReport {
  const p = useLearning.getState().profile
  const now = Date.now()
  const weekAgo = now - 7 * DAY
  const events = p.events.filter((e) => e.at >= weekAgo)

  const byTrack: Partial<Record<TrackId, number>> = {}
  for (const e of events) byTrack[e.track] = (byTrack[e.track] ?? 0) + 1

  let readingMinutes = 0
  for (let i = 0; i < 7; i++) {
    const d = new Date(now - i * DAY)
    const k = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
    readingMinutes += Math.round((p.reading[k] ?? 0) / 60)
  }

  // مهارت‌هایی که در هفته تغییر سطح داده‌اند
  const skillsImproved = events
    .filter((e) => e.type === 'skill.mastery_changed')
    .map((e) => {
      const def = SKILLS.find((s) => s.id === e.ref)
      return def?.title ?? e.ref
    })
    .slice(0, 6)

  const needsReview = dueItems(p.review, now, 5).map((r) => r.title)

  return {
    lessonsCompleted: events.filter((e) => e.type === 'lesson.completed').length,
    exercisesPassed: events.filter((e) => e.type === 'practice.completed').length,
    reviewsDone: events.filter((e) => e.type === 'review.completed').length,
    assessments: events.filter((e) => e.type === 'assessment.submitted').length,
    readingMinutes,
    skillsImproved,
    needsReview,
    projectsTouched: events.filter((e) => e.type === 'project.milestone_completed').length,
    byTrack,
  }
}

/** مسیرهای یادگیری، برای تب Paths داشبورد */
export interface PathSummary {
  track: TrackId
  title: string
  totalLessons: number
  doneLessons: number
  skillsTotal: number
  skillsMastered: number
  /** نزدیک‌ترین مهارت قابل شروع (پیش‌نیازها برآورده) */
  nextSkill?: string
}

export function buildPathSummaries(
  lessonIdsByTrack: Record<TrackId, string[]>
): PathSummary[] {
  const p = useLearning.getState().profile
  const mastered = masteredSkillIds(p.skills)
  const tracks: TrackId[] = ['python', 'linux', 'rust', 'ai', 'powershell', 'algorithm']
  const titles: Record<TrackId, string> = {
    python: 'پایتون',
    linux: 'لینوکس',
    rust: 'راست',
    ai: 'هوش مصنوعی',
    powershell: 'پاورشل',
    algorithm: 'الگوریتم',
  }
  return tracks.map((track) => {
    const lessonIds = lessonIdsByTrack[track] ?? []
    const recs = p.lessons[track] ?? {}
    const done = lessonIds.filter((id) => recs[id]?.done).length
    const skills = skillsOfTrack(track)
    const skillsMastered = skills.filter((s) => mastered.has(s.id)).length
    const nextSkill = skills.find(
      (s) =>
        !mastered.has(s.id) &&
        prereqsMet(s.id, mastered).met
    )?.title
    return {
      track,
      title: titles[track],
      totalLessons: lessonIds.length,
      doneLessons: done,
      skillsTotal: skills.length,
      skillsMastered,
      nextSkill,
    }
  })
}
