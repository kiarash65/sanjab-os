/**
 * Learning Store، منبع یگانهٔ حقیقت پیشرفت یادگیری
 *
 * Zustand + persist روی کلید sanjab-learning-v1.
 * آکادمی‌ها از طریق Adapterهای همین فایل (noteLessonOpened, noteLessonCompleted,
 * noteQuizResult, noteExercisePassed, noteChallengePassed, noteReviewResult,
 * noteProjectMilestone, noteProjectComplete) با لایهٔ یادگیری صحبت می‌کنند.
 *
 * مهاجرت: dataهای قدیمی (sunjob-py-v1، sunjob-academy-v1، sunjob-rust-v1،
 * sunjob-ai-v1، sunjob-ps-v1) یک‌بار و به‌صورت idempotent خوانده و seed
 * می‌شوند؛ کلیدهای قدیمی حذف نمی‌شوند تا UIهای موجود همچنان کار کنند.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  EVENTS_CAP,
  EVIDENCE_CAP,
  TRACK_TITLES,
  type EvidenceKind,
  type LearningEvent,
  type LearningEventType,
  type LearningProfile,
  type LessonRecord,
  type MasteryState,
  type SkillEvidence,
  type TrackId,
} from './types'
import { computeMastery } from './mastery'
import { newReviewItem, scheduleReview, dueItems, type ReviewOutcome } from './review'
import { skillsOfLesson } from './skills'

export const LEARNING_KEY = 'sanjab-learning-v1'

const emptyProfile = (): LearningProfile => ({
  version: 1,
  lessons: {},
  skills: {},
  events: [],
  review: {},
  projects: {},
  reading: {},
})

const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

const dayKey = (at: number) => {
  const d = new Date(at)
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

/** همهٔ مهارت‌های mastered (برای unlockها و پیش‌نیازها) */
export function masteredSkillIds(skills: LearningProfile['skills']): Set<string> {
  return new Set(
    Object.entries(skills)
      .filter(([, s]) => s.state === 'mastered')
      .map(([id]) => id)
  )
}

interface LearningStore {
  profile: LearningProfile
  /* ---- Adapterهای آکادمی‌ها ---- */
  noteLessonOpened: (track: TrackId, lessonId: string, sectionId?: string) => void
  noteSectionCompleted: (track: TrackId, lessonId: string, sectionId: string) => void
  noteLessonCompleted: (track: TrackId, lessonId: string) => void
  noteExercisePassed: (track: TrackId, lessonId: string) => void
  noteExerciseFailed: (track: TrackId, lessonId: string) => void
  noteQuizResult: (track: TrackId, quizId: string, correct: number, total: number) => void
  noteChallengePassed: (track: TrackId, challengeId: string) => void
  noteReviewResult: (
    itemId: string,
    correct: boolean,
    confidence: 'sure' | 'shaky'
  ) => void
  noteProjectOpened: (projectId: string) => void
  noteProjectMilestone: (projectId: string, track: TrackId, stepId: string) => void
  noteProjectComplete: (projectId: string, track: TrackId) => void
  saveProjectCode: (projectId: string, code: string) => void
  addReadingSeconds: (seconds: number) => void
  /* ---- ابزارها ---- */
  ensureMigrated: () => void
  resetLearning: () => void
}

export const useLearning = create<LearningStore>()(
  persist(
    (set, get) => {
      /** شواهد به مهارت اضافه می‌کند و تسلط را بازمحاسبه می‌کند */
      const addEvidence = (
        track: TrackId,
        lessonId: string,
        kind: EvidenceKind,
        ref: string
      ) => {
        const skills = skillsOfLesson(track, lessonId)
        if (skills.length === 0) return
        const p = get().profile
        const now = Date.now()
        const nextSkills = { ...p.skills }
        const nextEvents: LearningEvent[] = []
        for (const sk of skills) {
          const prev = nextSkills[sk.id] ?? { state: 'not-started' as MasteryState, evidence: [], lastAt: 0 }
          const ev: SkillEvidence = { kind, ref, at: now }
          const evidence = [...prev.evidence, ev].slice(-EVIDENCE_CAP)
          const state = computeMastery(evidence, now)
          const changed = state !== prev.state
          nextSkills[sk.id] = { state, evidence, lastAt: now }
          nextEvents.push({
            id: uid(),
            type: changed ? 'skill.mastery_changed' : 'skill.evidence_added',
            track,
            ref: sk.id,
            label: `${kind === 'review-failed' ? 'مرور مجدد' : 'شواهد'} برای مهارت «${sk.title}»`,
            at: now,
          })
        }
        set({
          profile: {
            ...p,
            skills: nextSkills,
            events: [...p.events, ...nextEvents].slice(-EVENTS_CAP),
          },
        })
      }

      const pushEvent = (
        type: LearningEventType,
        track: TrackId,
        ref: string,
        label: string
      ) => {
        const p = get().profile
        const ev: LearningEvent = { id: uid(), type, track, ref, label, at: Date.now() }
        set({ profile: { ...p, events: [...p.events, ev].slice(-EVENTS_CAP) } })
      }

      return {
        profile: emptyProfile(),

        noteLessonOpened: (track, lessonId, sectionId) => {
          const p = get().profile
          const now = Date.now()
          const trackLessons = { ...(p.lessons[track] ?? {}) }
          const prev: LessonRecord = trackLessons[lessonId] ?? {
            done: false,
            openedAt: now,
          }
          trackLessons[lessonId] = { ...prev, openedAt: prev.openedAt || now }
          const firstOpen = !prev.openedAt
          set({
            profile: {
              ...p,
              lessons: { ...p.lessons, [track]: trackLessons },
              lastSession: { track, lessonId, sectionId, at: now },
            },
          })
          if (firstOpen) {
            pushEvent('lesson.started', track, lessonId, `شروع «${lessonId}» در ${TRACK_TITLES[track]}`)
            addEvidence(track, lessonId, 'lesson-view', lessonId)
          }
        },

        noteSectionCompleted: (track, lessonId, sectionId) => {
          const p = get().profile
          const now = Date.now()
          set({
            profile: {
              ...p,
              lastSession: { track, lessonId, sectionId, at: now },
            },
          })
          pushEvent('lesson.section_completed', track, lessonId, `بخش «${sectionId}» تکمیل شد`)
        },

        noteLessonCompleted: (track, lessonId) => {
          const p = get().profile
          const now = Date.now()
          const trackLessons = { ...(p.lessons[track] ?? {}) }
          const prev: LessonRecord = trackLessons[lessonId] ?? {
            done: false,
            openedAt: now,
          }
          if (!prev.done) {
            trackLessons[lessonId] = { ...prev, done: true, completedAt: now }
            set({
              profile: { ...p, lessons: { ...p.lessons, [track]: trackLessons } },
            })
            pushEvent('lesson.completed', track, lessonId, `تکمیل درس «${lessonId}»`)
            addEvidence(track, lessonId, 'lesson-complete', lessonId)
            scheduleReviewsForNewLesson(track, lessonId, set, get)
          }
        },

        noteExercisePassed: (track, lessonId) => {
          const p = get().profile
          pushEvent('practice.completed', track, lessonId, `تمرین «${lessonId}» پاس شد`)
          addEvidence(track, lessonId, 'exercise-pass', lessonId)
          set({ profile: p })
        },

        noteExerciseFailed: (track, lessonId) => {
          pushEvent('practice.failed', track, lessonId, `تمرین «${lessonId}» نیاز به تلاش دیگر دارد`)
        },

        noteQuizResult: (track, quizId, correct, total) => {
          const p = get().profile
          const now = Date.now()
          const trackLessons = { ...(p.lessons[track] ?? {}) }
          const prev: LessonRecord = trackLessons[quizId] ?? {
            done: false,
            openedAt: now,
          }
          const best = prev.bestScore
          const better = !best || correct / Math.max(1, total) > best[0] / Math.max(1, best[1])
          if (better) {
            trackLessons[quizId] = { ...prev, bestScore: [correct, total] }
            set({
              profile: { ...p, lessons: { ...p.lessons, [track]: trackLessons } },
            })
          }
          pushEvent(
            'assessment.submitted',
            track,
            quizId,
            `آزمون «${quizId}»: ${correct} از ${total}`
          )
          // هر درسِ مرتبط با این آزمون شواهد quiz می‌گیرد (فقط درس‌هایی که باز شده‌اند)
          const skills = skillsOfLesson(track, quizId)
          if (skills.length > 0) {
            addEvidence(track, quizId, correct === total && total > 0 ? 'quiz-perfect' : 'quiz-correct', quizId)
          }
          // مهارت‌های ضعیف (کمتر از ۶۰٪) به صف مرور می‌روند
          if (correct / Math.max(1, total) < 0.6) {
            enqueueWeakSkills(track, quizId, set, get)
          }
        },

        noteChallengePassed: (track, challengeId) => {
          pushEvent('practice.completed', track, challengeId, `چالش «${challengeId}» حل شد`)
          // چالش به همهٔ مهارت‌های مسیرِ مرتبط با چالش شواهد می‌دهد (نگاشت در bank)
          const skillId = challengeSkillMap[challengeId]
          if (skillId) {
            const p = get().profile
            const now = Date.now()
            const prev = p.skills[skillId] ?? { state: 'not-started' as MasteryState, evidence: [], lastAt: 0 }
            const evidence = [...prev.evidence, { kind: 'challenge-pass' as EvidenceKind, ref: challengeId, at: now }].slice(-EVIDENCE_CAP)
            set({
              profile: {
                ...p,
                skills: {
                  ...p.skills,
                  [skillId]: { state: computeMastery(evidence, now), evidence, lastAt: now },
                },
              },
            })
          }
        },

        noteReviewResult: (itemId, correct, confidence) => {
          const p = get().profile
          const item = p.review[itemId]
          if (!item) return
          const now = Date.now()
          const out: ReviewOutcome = scheduleReview(item, correct, confidence, now)
          const next: typeof item = {
            ...item,
            ease: out.ease,
            intervalDays: out.intervalDays,
            dueAt: out.dueAt,
            reps: out.reps,
            lapses: out.lapses,
            lastAt: now,
            lastCorrect: correct,
          }
          set({ profile: { ...p, review: { ...p.review, [itemId]: next } } })
          pushEvent('review.completed', item.track, itemId, `مرور «${item.title}» ${correct ? 'موفق' : 'ناموفق'}`)
          // شواهد مرور به مهارت مرتبط
          if (item.skillId) {
            const sk = p.skills[item.skillId]
            if (sk) {
              const evidence = [
                ...sk.evidence,
                { kind: (correct ? 'review-correct' : 'review-failed') as EvidenceKind, ref: itemId, at: now },
              ].slice(-EVIDENCE_CAP)
              const state = computeMastery(evidence, now)
              set({
                profile: {
                  ...get().profile,
                  skills: {
                    ...get().profile.skills,
                    [item.skillId]: { state, evidence, lastAt: now },
                  },
                },
              })
            }
          }
        },

        noteProjectOpened: (projectId) => {
          const p = get().profile
          if (p.projects[projectId]) return
          set({
            profile: {
              ...p,
              projects: { ...p.projects, [projectId]: { startedAt: Date.now(), doneSteps: [] } },
            },
          })
        },

        noteProjectMilestone: (projectId, track, stepId) => {
          const p = get().profile
          const proj = p.projects[projectId] ?? { startedAt: Date.now(), doneSteps: [] }
          if (proj.doneSteps.includes(stepId)) return
          set({
            profile: {
              ...p,
              projects: {
                ...p.projects,
                [projectId]: { ...proj, doneSteps: [...proj.doneSteps, stepId] },
              },
            },
          })
          pushEvent('project.milestone_completed', track, projectId, `مرحلهٔ «${stepId}» از پروژه کامل شد`)
        },

        noteProjectComplete: (projectId, track) => {
          const p = get().profile
          const proj = p.projects[projectId]
          if (!proj || proj.completedAt) return
          set({
            profile: {
              ...p,
              projects: {
                ...p.projects,
                [projectId]: { ...proj, completedAt: Date.now() },
              },
            },
          })
          pushEvent('project.completed', track, projectId, `پروژهٔ «${projectId}» کامل شد`)
        },

        saveProjectCode: (projectId, code) => {
          const p = get().profile
          const proj = p.projects[projectId] ?? { startedAt: Date.now(), doneSteps: [] }
          set({
            profile: { ...p, projects: { ...p.projects, [projectId]: { ...proj, code } } },
          })
        },

        addReadingSeconds: (seconds) => {
          const p = get().profile
          const k = dayKey(Date.now())
          set({
            profile: {
              ...p,
              reading: { ...p.reading, [k]: (p.reading[k] ?? 0) + seconds },
            },
          })
        },

        ensureMigrated: () => {
          const p = get().profile
          if (p.migratedAt) return
          const seeded = migrateFromLegacy(p)
          set({ profile: seeded })
        },

        resetLearning: () => set({ profile: emptyProfile() }),
      }
    },
    {
      name: LEARNING_KEY,
      version: 1,
      /* ذخیرهٔ کامل پروفایل، حجم رویدادها با EVENTS_CAP محدود شده */
    }
  )
)

/* ------------------------------------------------------------------ */
/* نگاشت چالش‌ها به مهارت (برای شواهد challenge-pass)                  */
/* ------------------------------------------------------------------ */
export const challengeSkillMap: Record<string, string> = {
  'al-ch-order': 'al-thinking',
  'al-ch-next-bubble': 'al-sorting',
  'al-ch-next-binary': 'al-searching',
  'al-ch-structure': 'al-structures',
}

/* ------------------------------------------------------------------ */
/* زمان‌بندی مرور برای مفاهیم یک درس تازه‌تکمیل‌شده                     */
/* ------------------------------------------------------------------ */
function scheduleReviewsForNewLesson(
  track: TrackId,
  lessonId: string,
  set: (fn: Partial<LearningStore> | ((s: LearningStore) => Partial<LearningStore>)) => void,
  get: () => LearningStore
) {
  const skills = skillsOfLesson(track, lessonId)
  if (skills.length === 0) return
  const p = get().profile
  const now = Date.now()
  const review = { ...p.review }
  for (const sk of skills) {
    const rid = `sk:${sk.id}`
    if (!review[rid]) {
      review[rid] = newReviewItem(rid, track, sk.title, sk.id, now)
    }
  }
  set((s) => ({ profile: { ...s.profile, review } }))
}

/** مهارت‌های ضعیف نتیجهٔ آزمون وارد صف مرور می‌شوند */
function enqueueWeakSkills(
  track: TrackId,
  quizId: string,
  set: (fn: Partial<LearningStore> | ((s: LearningStore) => Partial<LearningStore>)) => void,
  get: () => LearningStore
) {
  const skills = skillsOfLesson(track, quizId)
  if (skills.length === 0) return
  const p = get().profile
  const now = Date.now()
  const review = { ...p.review }
  for (const sk of skills) {
    const rid = `sk:${sk.id}`
    if (!review[rid]) review[rid] = newReviewItem(rid, track, sk.title, sk.id, now)
  }
  set((s) => ({ profile: { ...s.profile, review } }))
}

/* ------------------------------------------------------------------ */
/* مهاجرت از کلیدهای قدیمی، idempotent، بدون حذف دادهٔ کاربر          */
/* ------------------------------------------------------------------ */
function migrateFromLegacy(p: LearningProfile): LearningProfile {
  if (typeof window === 'undefined') return { ...p, migratedAt: Date.now() }
  const now = Date.now()
  const next: LearningProfile = {
    ...p,
    lessons: { ...p.lessons },
    skills: { ...p.skills },
    events: [...p.events],
  }
  const readJSON = (key: string): unknown => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }
  const asRecord = (v: unknown): Record<string, unknown> =>
    v && typeof v === 'object' ? (v as Record<string, unknown>) : {}

  const seedTrack = (
    track: TrackId,
    key: string,
    pickIds: (data: Record<string, unknown>) => string[]
  ) => {
    const data = asRecord(readJSON(key))
    if (!data || Object.keys(data).length === 0) return
    const ids = pickIds(data)
    const existing = next.lessons[track] ?? {}
    const merged = { ...existing }
    let added = 0
    for (const id of ids) {
      if (!merged[id]) {
        merged[id] = { done: true, openedAt: now, completedAt: now }
        added++
      }
    }
    if (added > 0) {
      next.lessons[track] = merged
      next.events.push({
        id: uid(),
        type: 'lesson.completed',
        track,
        ref: 'migration',
        label: `مهاجرت ${added} درس از داده‌های قبلی ${TRACK_TITLES[track]}`,
        at: now,
      })
    }
  }

  // پایتون: { done: string[], ex: string[], quizBest: Record, projects: string[] }
  seedTrack('python', 'sunjob-py-v1', (d) => {
    const done = Array.isArray(d['done']) ? (d['done'] as string[]) : []
    const ex = Array.isArray(d['ex']) ? (d['ex'] as string[]) : []
    return [...done, ...ex.map((e) => `ex:${e}`)]
  })
  // لینوکس: { done: string[], missions: string[], quizBest: number, certName }
  seedTrack('linux', 'sunjob-academy-v1', (d) => {
    const done = Array.isArray(d['done']) ? (d['done'] as string[]) : []
    const missions = Array.isArray(d['missions']) ? (d['missions'] as string[]) : []
    return [...done, ...missions.map((m) => `mission:${m}`)]
  })
  // راست: { done: string[], quizBest: number, missionsDone: string[] }
  seedTrack('rust', 'sunjob-rust-v1', (d) => {
    const done = Array.isArray(d['done']) ? (d['done'] as string[]) : []
    const missions = Array.isArray(d['missionsDone']) ? (d['missionsDone'] as string[]) : []
    return [...done, ...missions.map((m) => `mission:${m}`)]
  })
  // هوش مصنوعی: { done: string[], quizBest: number }
  seedTrack('ai', 'sunjob-ai-v1', (d) =>
    Array.isArray(d['done']) ? (d['done'] as string[]) : []
  )
  // پاورشل: { done: string[], missionsDone: string[], quizBest: number }
  seedTrack('powershell', 'sunjob-ps-v1', (d) => {
    const done = Array.isArray(d['done']) ? (d['done'] as string[]) : []
    const missions = Array.isArray(d['missionsDone']) ? (d['missionsDone'] as string[]) : []
    return [...done, ...missions.map((m) => `mission:${m}`)]
  })

  // زمان مطالعهٔ قبلی (sunjob-reading-v1) به پروفایل منتقل می‌شود
  const reading = asRecord(readJSON('sunjob-reading-v1'))
  if (reading['days'] && typeof reading['days'] === 'object') {
    const days = asRecord(reading['days'])
    next.reading = { ...next.reading }
    for (const [k, v] of Object.entries(days)) {
      if (typeof v === 'number' && !next.reading[k]) next.reading[k] = v
    }
  }

  next.events = next.events.slice(-EVENTS_CAP)
  next.migratedAt = now
  return next
}

/* ------------------------------------------------------------------ */
/* Selectors پرکاربرد                                                  */
/* ------------------------------------------------------------------ */

/** آیتم‌های مرور سررسید */
export function useDueReviews(limit = 12) {
  return dueItems(useLearning((s) => s.profile.review), Date.now(), limit)
}

/** آخرین جلسهٔ قابل ادامه */
export function useLastSession() {
  return useLearning((s) => s.profile.lastSession)
}
