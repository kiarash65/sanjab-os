/**
 * Assessment Engine، موتور آزمون مشترک
 *
 * انواع سؤال، تصحیح، بازخورد چندلایه و سیستم راهنما.
 * هر سؤال متادیتای کامل دارد (skill، دشواری، زمان تخمینی، وضعیت اعتبارسنجی)
 * و پاسخ‌ها همیشه به learning store ثبت می‌شوند تا تسلط واقعی اندازه‌گیری شود.
 */
import type { TrackId } from './types'

export type QuestionType =
  | 'single-choice'
  | 'multi-select'
  | 'true-false'
  | 'fill-blank'
  | 'ordering'
  | 'predict-output'
  | 'find-bug'
  | 'code-completion'

export type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert'

export const DIFFICULTY_TITLES: Record<Difficulty, string> = {
  beginner: 'مقدماتی',
  intermediate: 'متوسط',
  advanced: 'پیشرفته',
  expert: 'خبره',
}

export interface Question {
  id: string
  track: TrackId
  /** مهارت‌هایی که این سؤال می‌سنجد */
  skillIds: string[]
  difficulty: Difficulty
  type: QuestionType
  prompt: string
  /** برای سؤال‌های کدی */
  code?: string
  options?: string[]
  /**
   * پاسخ صحیح:
   *  single/true-false/predict/find-bug → index گزینه یا مقدار بولی/رشته
   *  multi-select → آرایهٔ indexها
   *  fill-blank → رشتهٔ مورد انتظار (چند گزینه با |)
   *  ordering → ترتیب صحیح indexها
   *  code-completion → رشتهٔ دقیق
   */
  answer: number | number[] | boolean | string
  /** توضیح منطق پاسخ صحیح */
  explanation: string
  /** چرا گزینه‌های مهم غلط‌اند */
  distractorExplanations?: Record<string, string>
  hints: string[]
  estimatedMin: number
  validationStatus: 'reviewed'
}

export interface Graded {
  correct: boolean
  /** درصد تطابق 0..1، برای ordering و fill جزئی هم محاسبه می‌شود */
  ratio: number
}

/* ---------------- تصحیح ---------------- */

const norm = (s: string) =>
  s
    .trim()
    .replace(/\u200c/g, ' ')
    .replace(/[«»"'`]/g, '')
    .replace(/\s+/g, ' ')
    .toLowerCase()

export function gradeAnswer(q: Question, given: unknown): Graded {
  switch (q.type) {
    case 'single-choice':
    case 'predict-output':
    case 'find-bug':
      return { correct: given === q.answer, ratio: given === q.answer ? 1 : 0 }
    case 'true-false':
      return { correct: given === q.answer, ratio: given === q.answer ? 1 : 0 }
    case 'multi-select': {
      const want = new Set(q.answer as number[])
      const got = Array.isArray(given) ? new Set(given.map(Number)) : new Set<number>()
      if (want.size !== got.size) return { correct: false, ratio: 0 }
      let hit = 0
      for (const v of want) if (got.has(v)) hit++
      const ratio = hit / want.size
      return { correct: hit === want.size, ratio }
    }
    case 'fill-blank':
    case 'code-completion': {
      const want = String(q.answer)
      const got = typeof given === 'string' ? given : ''
      const alternatives = want.split('|').map((a) => norm(a))
      const ok = alternatives.includes(norm(got))
      return { correct: ok, ratio: ok ? 1 : 0 }
    }
    case 'ordering': {
      const want = q.answer as number[]
      const got = Array.isArray(given) ? (given as number[]) : []
      if (got.length !== want.length) return { correct: false, ratio: 0 }
      let inPlace = 0
      for (let i = 0; i < want.length; i++) if (want[i] === got[i]) inPlace++
      const ratio = inPlace / want.length
      return { correct: inPlace === want.length, ratio }
    }
  }
}

/* ---------------- بازخورد چندلایه ---------------- */

export interface Feedback {
  correct: boolean
  headline: string
  /** جواب صحیح، برای رشته‌ها/ترتیب‌ها */
  correctText?: string
  explanation: string
  /** دلیل غلط بودن گزینهٔ انتخابی کاربر */
  distractorWhy?: string
  /** مهارت مرتبط برای مرور */
  skillHint?: string
}

export function buildFeedback(
  q: Question,
  given: unknown,
  graded: Graded,
  skillTitle?: string
): Feedback {
  const correctText =
    q.type === 'ordering'
      ? (q.answer as number[]).map((i) => q.options?.[i]).join(' ← ')
      : q.type === 'multi-select'
        ? (q.answer as number[]).map((i) => q.options?.[i]).join('، ')
        : q.type === 'single-choice' || q.type === 'predict-output' || q.type === 'find-bug'
          ? (q.options?.[q.answer as number] ?? '')
          : String(q.answer).split('|')[0]

  let distractorWhy: string | undefined
  if (!graded.correct && q.distractorExplanations) {
    if (typeof given === 'number' && q.options) {
      distractorWhy = q.distractorExplanations[q.options[given]]
    } else if (typeof given === 'string') {
      distractorWhy =
        q.distractorExplanations[given] ?? q.distractorExplanations['*']
    }
  }

  return {
    correct: graded.correct,
    headline: graded.correct
      ? 'درست است! 🎯'
      : graded.ratio >= 0.5
        ? 'نزدیک بود، ولی کامل نیست.'
        : 'پاسخ درست این بود:',
    correctText: graded.correct ? undefined : correctText,
    explanation: q.explanation,
    distractorWhy,
    skillHint: skillTitle,
  }
}

/* ---------------- سیستم راهنما (Hint) ---------------- */

/** راهنمای مرحله‌ای، هر بار فقط یک راهنما، بدون لو دادن جواب نهایی */
export function nextHint(q: Question, usedCount: number): { text: string; isLast: boolean } | null {
  if (usedCount >= q.hints.length) return null
  return { text: q.hints[usedCount], isLast: usedCount === q.hints.length - 1 }
}

/* ---------------- نمونه‌گیری آزمون ---------------- */

export interface QuizSpec {
  track: TrackId
  /** مهارت‌های مجاز، خالی یعنی همهٔ مسیر */
  skillIds?: string[]
  difficulties?: Difficulty[]
  count: number
  /** سؤال‌هایی که نباید تکرار شوند (id) */
  exclude?: string[]
}

export function buildQuiz(bank: Question[], spec: QuizSpec): Question[] {
  let pool = bank.filter((q) => q.track === spec.track)
  if (spec.skillIds && spec.skillIds.length > 0) {
    pool = pool.filter((q) => q.skillIds.some((s) => spec.skillIds!.includes(s)))
  }
  if (spec.difficulties && spec.difficulties.length > 0) {
    pool = pool.filter((q) => spec.difficulties!.includes(q.difficulty))
  }
  if (spec.exclude && spec.exclude.length > 0) {
    const ex = new Set(spec.exclude)
    pool = pool.filter((q) => !ex.has(q.id))
  }
  // شافل قطعی‌ناپذیر سبک
  const shuffled = [...pool]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, spec.count)
}
