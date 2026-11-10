/**
 * موتور تسلط بر مهارت‌ها؛ Skill Mastery Engine
 *
 * چهار معیار جدا نگه داشته می‌شوند و هیچ‌کدام جای دیگری استفاده نمی‌شود:
 *   1) Course Completion  → lessons[track][lessonId].done (در store.ts)
 *   2) Skill Mastery      → computeMastery در همین فایل
 *   3) Knowledge Retention→ آیتم‌های مرور فاصله‌دار (review.ts)
 *   4) Practical Perf.    → شواهد exercise-pass / project-*
 *
 * قواعد ارتقا (شفاف و مستند، از شواهد واقعی، نه از نمرهٔ کل):
 *   امتیاز شواهد = Σ وزن × ضریب تازگی (شواهد >45 روز: نصف)
 *   attempted  : حداقل ۱ شواهد
 *   familiar   : امتیاز ≥ 3
 *   proficient : امتیاز ≥ 7 با ≥2 نوع شواهد متفاوت و حداقل یکی از
 *                (exercise-pass | quiz-correct | review-correct)
 *   mastered   : امتیاز ≥ 12 با ≥3 نوع شواهد، شامل review-correct در روزی
 *                متفاوت از lesson-complete (یادآوری فاصله‌دار) و بدون
 *                review-failed در ۷ روز اخیر
 *
 * قواعد محافظه‌کارانه:
 *   - یک آزمون آسان هیچ‌وقت به‌تنهایی mastered نمی‌دهد (نیاز به تنوع شواهد)
 *   - پاسخ غلط بیش از یک سطح تنزل نمی‌دهد
 *   - نمرهٔ کل دوره جای تسلط را نمی‌گیرد
 */
import {
  EVIDENCE_WEIGHT,
  MASTERY_ORDER,
  type EvidenceKind,
  type MasteryState,
  type SkillEvidence,
} from './types'

const RECENCY_HALF_LIFE_DAYS = 45
const DAY = 86_400_000

export interface MasteryInput {
  evidence: SkillEvidence[]
}

export interface MasteryScore {
  score: number
  kinds: Set<EvidenceKind>
  /** تاریخ آخرین lesson-complete */
  lastLessonCompleteAt?: number
  /** تاریخ آخرین review-correct */
  lastReviewCorrectAt?: number
  /** آیا در ۷ روز اخیر review-failed دارد؟ */
  recentFailure: boolean
}

export function analyzeEvidence(evidence: SkillEvidence[], now: number = Date.now()): MasteryScore {
  let score = 0
  const kinds = new Set<EvidenceKind>()
  let lastLessonCompleteAt: number | undefined
  let lastReviewCorrectAt: number | undefined
  let recentFailure = false

  for (const ev of evidence) {
    const ageDays = (now - ev.at) / DAY
    // شواهد تازه کامل، شواهد قدیمی نصف، تازگی دانش مهم است
    const recency = ageDays > RECENCY_HALF_LIFE_DAYS ? 0.5 : 1
    score += EVIDENCE_WEIGHT[ev.kind] * recency
    kinds.add(ev.kind)
    if (ev.kind === 'lesson-complete' && (!lastLessonCompleteAt || ev.at > lastLessonCompleteAt))
      lastLessonCompleteAt = ev.at
    if (ev.kind === 'review-correct' && (!lastReviewCorrectAt || ev.at > lastReviewCorrectAt))
      lastReviewCorrectAt = ev.at
    if (ev.kind === 'review-failed' && now - ev.at < 7 * DAY) recentFailure = true
  }

  return { score, kinds, lastLessonCompleteAt, lastReviewCorrectAt, recentFailure }
}

export function computeMastery(
  evidence: SkillEvidence[],
  now: number = Date.now()
): MasteryState {
  if (evidence.length === 0) return 'not-started'
  const a = analyzeEvidence(evidence, now)

  if (a.score < 1) return 'not-started'
  if (a.score < 3) return 'attempted'

  const hasPractice =
    a.kinds.has('exercise-pass') ||
    a.kinds.has('quiz-correct') ||
    a.kinds.has('review-correct') ||
    a.kinds.has('challenge-pass') ||
    a.kinds.has('project-milestone') ||
    a.kinds.has('project-complete')

  if (a.score < 7 || a.kinds.size < 2 || !hasPractice) return 'familiar'

  // تسلط کامل، نیاز به یادآوری فاصله‌دار در روزی متفاوت از تکمیل درس
  const recallOnDifferentDay =
    a.lastReviewCorrectAt !== undefined &&
    a.lastLessonCompleteAt !== undefined &&
    !sameDay(a.lastReviewCorrectAt, a.lastLessonCompleteAt)
  const recallOrApplied =
    recallOnDifferentDay ||
    a.kinds.has('challenge-pass') ||
    a.kinds.has('project-complete') ||
    a.kinds.has('project-milestone')

  if (a.score >= 12 && a.kinds.size >= 3 && recallOrApplied && !a.recentFailure)
    return 'mastered'

  return 'proficient'
}

function sameDay(a: number, b: number): boolean {
  const da = new Date(a)
  const db = new Date(b)
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  )
}

/** حداکثر یک سطح تنزل، پاسخ غلط نباید شدید جریمه کند */
export function demoteOne(state: MasteryState): MasteryState {
  const i = MASTERY_ORDER.indexOf(state)
  return MASTERY_ORDER[Math.max(0, i - 1)]
}

/** توضیح «چرا هنوز مسلط نشدی»، برای نمایش در Skill Map */
export function masteryGap(
  evidence: SkillEvidence[],
  state: MasteryState,
  now: number = Date.now()
): string | null {
  if (state === 'mastered') return null
  const a = analyzeEvidence(evidence, now)
  if (state === 'not-started') return 'هنوز فعالیتی در این مهارت ثبت نشده است.'
  if (state === 'attempted')
    return 'برای «آشنا» شدن، چند فعالیت بیشتر (درس، تمرین یا آزمون) لازم است.'
  if (state === 'familiar')
    return hasPracticeKind(a.kinds)
      ? 'امتیاز یا تنوع شواهد برای «مسلط» کافی نیست، تمرین و آزمون بیشتر کمک می‌کند.'
      : 'یک تمرین عملی یا آزمون لازم است تا «مسلط» شوی.'
  // proficient
  if (a.recentFailure) return 'یک مرور اخیر فراموشی داشت، بعد از مرور موفق دوباره امتحان کن.'
  if (!a.lastReviewCorrectAt) return 'یک مرور فاصله‌دار موفق برای تثبیت یادگیری لازم است.'
  return 'شواهد بیشتری (چالش یا پروژه) برای «تسلط کامل» لازم است.'
}

function hasPracticeKind(kinds: Set<EvidenceKind>): boolean {
  return (
    kinds.has('exercise-pass') ||
    kinds.has('quiz-correct') ||
    kinds.has('review-correct') ||
    kinds.has('challenge-pass') ||
    kinds.has('project-milestone') ||
    kinds.has('project-complete')
  )
}
