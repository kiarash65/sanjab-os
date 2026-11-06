import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useOS } from '@/lib/os/store'

/* ------------------------------------------------------------------ */
/* موتور گیمیفیکیشن سان‌جاب‌اواس — یک موتور مرکزی برای همه آکادمی‌ها    */
/* XP، دستاورد، مأموریت روزانه، استریک (زنجیره روزهای فعال)           */
/* رویدادها idempotent هستند: هر event-id فقط یک‌بار امتیاز می‌دهد     */
/* ------------------------------------------------------------------ */

export type Track = 'linux' | 'python' | 'rust' | 'ai'

export interface GameEvent {
  id: string
  label: string
  xp: number
  at: number
}

export interface Achievement {
  id: string
  title: string
  desc: string
  /** شرط بر اساس آمار — اگر true شد دستاورد باز می‌شود */
  check: (s: GameStats) => boolean
}

export interface GameStats {
  xp: number
  lessons: Record<Track, number>
  quizzesPerfect: number
  gamesCompleted: number
  streakBest: number
  awards: number
}

const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-step', title: 'اولین قدم', desc: 'اولین امتیازت را گرفتی', check: (s) => s.awards >= 1 },
  { id: 'xp-100', title: 'فندق‌جمع‌کن', desc: '۱۰۰ XP جمع کردی', check: (s) => s.xp >= 100 },
  { id: 'xp-500', title: 'سنجاب حرفه‌ای', desc: '۵۰۰ XP جمع کردی', check: (s) => s.xp >= 500 },
  { id: 'xp-1500', title: 'استاد سان‌جاب', desc: '۱۵۰۰ XP جمع کردی', check: (s) => s.xp >= 1500 },
  { id: 'linux-3', title: 'پنگوئن‌آموز', desc: '۳ درس لینوکس را تمام کردی', check: (s) => s.lessons.linux >= 3 },
  { id: 'linux-10', title: 'sysadmin کوچک', desc: '۱۰ درس لینوکس را تمام کردی', check: (s) => s.lessons.linux >= 10 },
  { id: 'python-3', title: 'مارمولک‌آموز', desc: '۳ درس پایتون را تمام کردی', check: (s) => s.lessons.python >= 3 },
  { id: 'python-10', title: 'پایتونیست', desc: '۱۰ درس پایتون را تمام کردی', check: (s) => s.lessons.python >= 10 },
  { id: 'rust-3', title: 'خرچنگ‌آموز', desc: '۳ درس Rust را تمام کردی', check: (s) => s.lessons.rust >= 3 },
  { id: 'rust-6', title: 'borrow-checker شاگرد اول', desc: '۶ درس Rust را تمام کردی', check: (s) => s.lessons.rust >= 6 },
  { id: 'ai-3', title: 'مهندس نورون', desc: '۳ درس هوش مصنوعی را تمام کردی', check: (s) => s.lessons.ai >= 3 },
  { id: 'quiz-perfect', title: 'آزمون بی‌نقص', desc: 'یک آزمون را ۱۰۰٪ زدی', check: (s) => s.quizzesPerfect >= 1 },
  { id: 'quiz-perfect-5', title: '۵ آزمون بی‌نقص', desc: '۵ آزمون را ۱۰۰٪ زدی', check: (s) => s.quizzesPerfect >= 5 },
  { id: 'streak-3', title: 'سه روز پیاپی', desc: '۳ روز پشت‌سرهم فعال بودی', check: (s) => s.streakBest >= 3 },
  { id: 'streak-7', title: 'هفته کامل', desc: '۷ روز پشت‌سرهم فعال بودی', check: (s) => s.streakBest >= 7 },
]

const QUEST_POOL: { id: string; label: string; xp: number; ev: string }[] = [
  { id: 'q-linux', label: 'یک درس آکادمی لینوکس را کامل کن', xp: 30, ev: 'lesson:linux' },
  { id: 'q-python', label: 'یک درس پایتون را کامل کن', xp: 30, ev: 'lesson:python' },
  { id: 'q-rust', label: 'یک درس Rust را کامل کن', xp: 30, ev: 'lesson:rust' },
  { id: 'q-ai', label: 'یک درس آکادمی هوش مصنوعی را کامل کن', xp: 30, ev: 'lesson:ai' },
  { id: 'q-quiz', label: 'یک آزمون کامل در هر آکادمی بده', xp: 25, ev: 'quiz:any' },
  { id: 'q-code', label: 'در کداستودیو یک برنامه اجرا کن', xp: 20, ev: 'code:run' },
]

export function levelOf(xp: number): number {
  return Math.floor(Math.sqrt(xp / 60)) + 1
}
export function xpForLevel(level: number): number {
  return (level - 1) * (level - 1) * 60
}

export function todayKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** مأموریت روزانه — از روی تاریخ به‌صورت قطعی انتخاب می‌شود */
export function questOfTheDay(day = todayKey()): (typeof QUEST_POOL)[number] {
  let h = 0
  for (const ch of day) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return QUEST_POOL[h % QUEST_POOL.length]
}

interface GameStore {
  xp: number
  events: GameEvent[]
  lessons: Record<Track, number>
  quizzesPerfect: number
  gamesCompleted: number
  streakLast: string
  streakCount: number
  streakBest: number
  achievements: string[]
  /** امتیاز برای یک رویداد idempotent؛ اگر قبلاً ثبت شده، false برمی‌گرداند */
  award: (eventId: string, xp: number, label: string, opts?: { track?: Track; lesson?: boolean; quizPerfect?: boolean }) => boolean
  /** ثبت کامل شدن یک درس (XP پیش‌فرض ۲۰ + پاداش مأموریت روزانه در صورت تطابق) */
  completeLesson: (track: Track, lessonId: string, xp?: number) => void
  registerQuiz: (track: Track, quizId: string, perfect: boolean, xp?: number) => void
  registerGame: (gameId: string, xp?: number) => void
  /** رویداد عمومی کدستودیو برای مأموریت روزانه q-code */
  registerCodeRun: (exampleId?: string) => void
  touchStreak: () => void
  resetAll: () => void
}

function toastAward(label: string, xp: number) {
  try {
    useOS.getState().pushToast({
      icon: '🐿️',
      title: xp > 0 ? `+${xp} XP` : 'گیمیفیکیشن',
      body: label,
    })
  } catch {
    /* خارج از محیط دسکتاپ — نادیده */
  }
}

function checkAchievements(get: () => GameStore, set: (p: Partial<GameStore>) => void) {
  const st = get()
  const stats: GameStats = {
    xp: st.xp,
    lessons: st.lessons,
    quizzesPerfect: st.quizzesPerfect,
    gamesCompleted: st.gamesCompleted,
    streakBest: st.streakBest,
    awards: st.events.length,
  }
  const newly = ACHIEVEMENTS.filter((a) => !st.achievements.includes(a.id) && a.check(stats))
  if (newly.length === 0) return
  set({ achievements: [...st.achievements, ...newly.map((a) => a.id)] })
  for (const a of newly) {
    const s2 = get()
    set({
      xp: s2.xp + 10,
      events: [...s2.events, { id: `ach:${a.id}`, label: `دستاورد: ${a.title}`, xp: 10, at: Date.now() }],
    })
    toastAward(`دستاورد باز شد: «${a.title}» — ${a.desc}`, 10)
  }
}

export const useGame = create<GameStore>()(
  persist(
    (set, get) => ({
      xp: 0,
      events: [],
      lessons: { linux: 0, python: 0, rust: 0, ai: 0 },
      quizzesPerfect: 0,
      gamesCompleted: 0,
      streakLast: '',
      streakCount: 0,
      streakBest: 0,
      achievements: [],

      award: (eventId, xp, label, opts) => {
        const st = get()
        if (st.events.some((e) => e.id === eventId)) return false
        const next: Partial<GameStore> = {
          xp: st.xp + xp,
          events: [...st.events.slice(-200), { id: eventId, label, xp, at: Date.now() }],
        }
        if (opts?.lesson && opts?.track) next.lessons = { ...st.lessons, [opts.track]: st.lessons[opts.track] + 1 }
        if (opts?.quizPerfect) next.quizzesPerfect = st.quizzesPerfect + 1
        set(next)
        toastAward(label, xp)
        checkAchievements(get, set)
        return true
      },

      completeLesson: (track, lessonId, xp = 20) => {
        get().touchStreak()
        get().award(`lesson:${track}:${lessonId}`, xp, `درس کامل شد (${track})`, { track, lesson: true })
        // پاداش مأموریت روزانه در صورت تطابق ترک
        const q = questOfTheDay()
        const trackOfQuest = q.id.replace('q-', '')
        if (trackOfQuest === track) {
          get().award(`quest:${todayKey()}`, q.xp, `مأموریت روزانه انجام شد: ${q.label}`)
        }
      },

      registerQuiz: (track, quizId, perfect, xp = 15) => {
        get().touchStreak()
        get().award(`quiz:${track}:${quizId}`, xp, 'آزمون داده شد', { quizPerfect: perfect })
        const q = questOfTheDay()
        if (q.id === 'q-quiz') get().award(`quest:${todayKey()}`, q.xp, `مأموریت روزانه انجام شد: ${q.label}`)
      },

      registerGame: (gameId, xp = 10) => {
        const st = get()
        const evId = `game:${gameId}:${todayKey()}`
        if (st.events.some((e) => e.id === evId)) return
        get().touchStreak()
        set({
          gamesCompleted: st.gamesCompleted + 1,
          xp: st.xp + xp,
          events: [...st.events, { id: evId, label: 'یک بازی کامل شد', xp, at: Date.now() }],
        })
        toastAward('یک بازی کامل شد', xp)
        checkAchievements(get, set)
      },

      registerCodeRun: (exampleId) => {
        const q = questOfTheDay()
        if (q.id !== 'q-code') return
        get().touchStreak()
        get().award(`code:${exampleId ?? 'run'}:${todayKey()}`, q.xp, `مأموریت روزانه انجام شد: ${q.label}`)
      },

      touchStreak: () => {
        const st = get()
        const today = todayKey()
        if (st.streakLast === today) return
        const yesterday = todayKey(new Date(Date.now() - 86_400_000))
        const count = st.streakLast === yesterday ? st.streakCount + 1 : 1
        set({
          streakLast: today,
          streakCount: count,
          streakBest: Math.max(st.streakBest, count),
        })
        if (count >= 3) toastAward(`زنجیره ${count} روزه فعال است — ادامه بده!`, 0)
      },

      resetAll: () =>
        set({
          xp: 0,
          events: [],
          lessons: { linux: 0, python: 0, rust: 0, ai: 0 },
          quizzesPerfect: 0,
          gamesCompleted: 0,
          streakLast: '',
          streakCount: 0,
          streakBest: 0,
          achievements: [],
        }),
    }),
    { name: 'sanjab-game-v1' }
  )
)

export { ACHIEVEMENTS, QUEST_POOL }
