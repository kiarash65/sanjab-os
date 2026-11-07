/**
 * Learning Domain — مدل مشترک یادگیری سنجاب‌اواس
 *
 * لایهٔ مستقل و تایپ‌شده که همهٔ آکادمی‌ها از طریق Adapter به آن وصل می‌شوند.
 * منبع یگانهٔ حقیقت برای «پیشرفت درسی»، «تسلط بر مهارت»، «مرور فاصله‌دار» و
 * «رویدادهای یادگیری». موتور XP (useGame) دست‌نخورده می‌ماند و فقط شمارنده است.
 *
 * طراحی Local-first: همه‌چیز در localStorage (کلید sanjab-learning-v1) ذخیره
 * می‌شود، بدون نیاز به حساب کاربری یا سرور. Sync ابری به‌عنوان توسعهٔ آینده در
 * docs/LEARNING-EXPERIENCE-TRANSFORMATION.md مستند شده است.
 */

export type TrackId =
  | 'python'
  | 'linux'
  | 'rust'
  | 'ai'
  | 'powershell'
  | 'algorithm'

export const TRACK_TITLES: Record<TrackId, string> = {
  python: 'آکادمی پایتون',
  linux: 'آکادمی لینوکس',
  rust: 'آکادمی راست',
  ai: 'آکادمی هوش مصنوعی',
  powershell: 'آکادمی پاورشل',
  algorithm: 'آکادمی الگوریتم',
}

/** وضعیت تسلط بر یک مهارت — از شواهد واقعی محاسبه می‌شود، نه دستی */
export type MasteryState =
  | 'not-started'
  | 'attempted'
  | 'familiar'
  | 'proficient'
  | 'mastered'

export const MASTERY_TITLES: Record<MasteryState, string> = {
  'not-started': 'شروع نشده',
  attempted: 'شروع‌شده',
  familiar: 'آشنا',
  proficient: 'مسلط',
  mastered: 'تسلط کامل',
}

export const MASTERY_ORDER: MasteryState[] = [
  'not-started',
  'attempted',
  'familiar',
  'proficient',
  'mastered',
]

/** نوع شواهد — هر شواهد وزنی مشخص و بازهٔ زمانی دارد */
export type EvidenceKind =
  | 'lesson-view' // درس باز شد (فعالیت اولیه — وزن کم)
  | 'lesson-complete' // درس خوانده شد
  | 'exercise-pass' // تمرین عملی پاس شد
  | 'quiz-correct' // پاسخ درست در آزمون
  | 'quiz-perfect' // نمره کامل آزمون
  | 'challenge-pass' // چالش انتقالی حل شد
  | 'review-correct' // یادآوری موفق در مرور فاصله‌دار
  | 'review-failed' // فراموشی در مرور
  | 'project-milestone' // یک مرحله پروژه کامل شد
  | 'project-complete' // پروژه کامل شد

export const EVIDENCE_WEIGHT: Record<EvidenceKind, number> = {
  'lesson-view': 1,
  'lesson-complete': 2,
  'exercise-pass': 3,
  'quiz-correct': 2,
  'quiz-perfect': 4,
  'challenge-pass': 4,
  'review-correct': 3,
  'review-failed': 0,
  'project-milestone': 4,
  'project-complete': 5,
}

export const EVIDENCE_LABEL: Record<EvidenceKind, string> = {
  'lesson-view': 'باز کردن درس',
  'lesson-complete': 'تکمیل درس',
  'exercise-pass': 'پاس کردن تمرین',
  'quiz-correct': 'پاسخ درست آزمون',
  'quiz-perfect': 'نمره کامل آزمون',
  'challenge-pass': 'حل چالش',
  'review-correct': 'یادآوری موفق',
  'review-failed': 'فراموشی در مرور',
  'project-milestone': 'پیشرفت پروژه',
  'project-complete': 'تکمیل پروژه',
}

export interface SkillEvidence {
  kind: EvidenceKind
  /** ارجاع — id درس/سؤال/پروژه */
  ref: string
  at: number
}

export interface SkillState {
  state: MasteryState
  evidence: SkillEvidence[]
  lastAt: number
}

/** رویداد استاندارد یادگیری — گزارش‌گیری و داشبورد از این تغذیه می‌شود */
export type LearningEventType =
  | 'lesson.started'
  | 'lesson.section_completed'
  | 'lesson.completed'
  | 'assessment.started'
  | 'assessment.submitted'
  | 'practice.completed'
  | 'practice.failed'
  | 'skill.evidence_added'
  | 'skill.mastery_changed'
  | 'review.due'
  | 'review.completed'
  | 'project.milestone_completed'
  | 'project.completed'

export interface LearningEvent {
  id: string
  type: LearningEventType
  track: TrackId
  /** شناسه مرجع — lessonId / projectId / assessmentId */
  ref: string
  /** عنوان فارسی کوتاه برای فید */
  label: string
  at: number
}

/** آیتم مرور فاصله‌دار — زمان‌بند ساده SM-2 گونه (مستندشده در review.ts) */
export interface ReviewItem {
  id: string
  track: TrackId
  /** عنوان کوتاه برای نمایش */
  title: string
  /** skillId مرتبط برای ثبت شواهد */
  skillId?: string
  ease: number
  intervalDays: number
  dueAt: number
  reps: number
  lapses: number
  lastAt: number
  lastCorrect: boolean
}

export interface LessonRecord {
  done: boolean
  /** بهترین نمره آزمون درس — [درست, کل] */
  bestScore?: [number, number]
  openedAt: number
  completedAt?: number
}

export interface ProjectRecord {
  startedAt: number
  doneSteps: string[]
  /** کد ذخیره‌شده برای ادامه کار (Checkpoints) */
  code?: string
  completedAt?: number
}

/** پروفایل یادگیری — نسخه‌بندی‌شده و قابل مهاجرت */
export interface LearningProfile {
  version: 1
  /** پیشرفت درس‌ها به تفکیک مسیر — مرجع اصلی پیشرفت محتوایی */
  lessons: Partial<Record<TrackId, Record<string, LessonRecord>>>
  /** وضعیت مهارت‌ها با شواهد */
  skills: Record<string, SkillState>
  /** رویدادها — حداکثر EVENTS_CAP آیتم آخر نگه داشته می‌شود */
  events: LearningEvent[]
  /** صف مرور فاصله‌دار */
  review: Record<string, ReviewItem>
  projects: Record<string, ProjectRecord>
  /** آخرین نقطه مطالعه برای «ادامه یادگیری» */
  lastSession?: {
    track: TrackId
    lessonId: string
    sectionId?: string
    at: number
  }
  /** مجموع ثانیه مطالعه به تفکیک روز (mirror از sunjob-reading-v1) */
  reading: Record<string, number>
  /** مهر مهاجرت از کلیدهای قدیمی — تکرارپذیر و ایمن */
  migratedAt?: number
}

export const EVENTS_CAP = 500
export const EVIDENCE_CAP = 24

/** نتیجه ارزیابی یک آزمون */
export interface AssessmentResult {
  questionId: string
  correct: boolean
  /** پاسخ کاربر (برای گزارش) */
  given: string
}
