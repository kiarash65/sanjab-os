/**
 * مرور فاصله‌دار — زمان‌بند سبک «نردبانی» الهام‌گرفته از SM-2
 *
 * صداقت فنی: این پیاده‌سازی FSRS «نیست». FSRS مدل سه‌جزئی (ثبات بازیابی/
 * سختی/احتمال) دارد که به پارامترهای آموزش‌دیده روی دیتاست‌های بزرگ نیاز
 * دارد. اینجا یک نردبان ساده و قابل‌فهم با ضریب Ease در بازهٔ 1.3 تا 2.8
 * استفاده شده که رفتارش در review.test.ts (توسعهٔ آینده) قابل تست است:
 *
 *   پاسخ درست:  interval‌های 1 → 3 → 7 → 16 → 35 → … روز (×ease از مرتبهٔ
 *               دوم به بعد) و ease += 0.05 (سقف 2.8)
 *   پاسخ غلط:   interval = 1 روز، ease −= 0.2 (کف 1.3)، lapses += 1
 *   اطمینان کاربر: مطمئن ×1.0 / مطمئن نیستم ×0.6
 *
 * عوامل مؤثر: نتیجهٔ آخرین مرور، سابقهٔ فراموشی (lapses)، اطمینان کاربر و
 * فاصلهٔ زمانی — دقیقاً همان عوامل خواسته‌شده در طراحی محصول.
 */
import type { ReviewItem, TrackId } from './types'

export const EASE_MIN = 1.3
export const EASE_MAX = 2.8
export const EASE_DEFAULT = 2.3

const DAY = 86_400_000

export interface ReviewOutcome {
  ease: number
  intervalDays: number
  dueAt: number
  reps: number
  lapses: number
}

/** محاسبهٔ نتیجهٔ یک مرور — تابع خالص و قابل تست */
export function scheduleReview(
  item: Pick<
    ReviewItem,
    'ease' | 'intervalDays' | 'reps' | 'lapses'
  >,
  correct: boolean,
  confidence: 'sure' | 'shaky' = 'sure',
  now: number = Date.now()
): ReviewOutcome {
  let ease = item.ease || EASE_DEFAULT
  let intervalDays: number
  let lapses = item.lapses

  if (correct) {
    ease = Math.min(EASE_MAX, ease + 0.05)
    if (item.intervalDays <= 0) intervalDays = 1
    else if (item.intervalDays === 1) intervalDays = 3
    else if (item.intervalDays === 3) intervalDays = 7
    else intervalDays = Math.round(item.intervalDays * ease)
    // اطمینان کم ⇒ فاصلهٔ کوتاه‌تر
    if (confidence === 'shaky') intervalDays = Math.max(1, Math.round(intervalDays * 0.6))
    intervalDays = Math.min(intervalDays, 180)
  } else {
    ease = Math.max(EASE_MIN, ease - 0.2)
    intervalDays = 1
    lapses += 1
  }

  return {
    ease,
    intervalDays,
    dueAt: now + intervalDays * DAY,
    reps: item.reps + 1,
    lapses,
  }
}

/** ساخت آیتم مرور جدید برای یک مفهوم/سؤال */
export function newReviewItem(
  id: string,
  track: TrackId,
  title: string,
  skillId: string | undefined,
  now: number = Date.now()
): ReviewItem {
  return {
    id,
    track,
    title,
    skillId,
    ease: EASE_DEFAULT,
    intervalDays: 0,
    dueAt: now, // فوراً سررسید
    reps: 0,
    lapses: 0,
    lastAt: 0,
    lastCorrect: false,
  }
}

/** آیتم‌های سررسید (یا عقب‌افتاده) — قدیمی‌ترین اول */
export function dueItems(
  review: Record<string, ReviewItem>,
  now: number = Date.now(),
  limit = 12
): ReviewItem[] {
  return Object.values(review)
    .filter((r) => r.dueAt <= now)
    .sort((a, b) => a.dueAt - b.dueAt)
    .slice(0, limit)
}

/** پیش‌بینی مرورهای روزهای آینده برای داشبورد */
export function upcomingCounts(
  review: Record<string, ReviewItem>,
  days = 7,
  now: number = Date.now()
): { day: string; count: number }[] {
  const out: { day: string; count: number }[] = []
  const dayMs = DAY
  for (let i = 0; i < days; i++) {
    const start = now + i * dayMs
    const end = start + dayMs
    const count = Object.values(review).filter(
      (r) => r.dueAt >= (i === 0 ? 0 : start) && r.dueAt < end
    ).length
    out.push({ day: new Date(start).toLocaleDateString('fa-IR', { weekday: 'short' }), count })
  }
  return out
}
