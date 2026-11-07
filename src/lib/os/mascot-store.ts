/**
 * Sanjabak — پروفایل ماسکوت سنجاب‌اواس
 *
 * سنجابک شخصیت همراه SanjabOS است (جایگزین پنگوئن Tux).
 * ساختار لایه‌ای: بدن/خز، چشم، عینک، کلاه، لباس، وسیله، پس‌زمینه.
 * آیتم‌ها با «فعالیت آموزشی واقعی» باز می‌شوند — شرط هر قفل شفاف است،
 * هیچ Loot Box یا پاداش تصادفی وجود ندارد.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { levelOf, useGame } from '@/lib/gamification/engine'
import { useLearning } from '@/lib/learning/store'
import { TRACK_LESSONS } from '@/lib/learning/lessons'

export type MascotLayer = 'fur' | 'eye' | 'glasses' | 'hat' | 'outfit' | 'held' | 'bg'

export interface MascotItem {
  id: string
  layer: MascotLayer
  title: string
  /** اگر undefined باشد = رایگان */
  unlock?: { desc: string; check: () => boolean }
}

export interface SanjabakLook {
  fur: string
  eye: string
  glasses: string
  hat: string
  outfit: string
  held: string
  bg: string
  pose: 'sit' | 'wave' | 'cheer' | 'read'
}

export const DEFAULT_LOOK: SanjabakLook = {
  fur: 'classic',
  eye: 'normal',
  glasses: 'none',
  hat: 'none',
  outfit: 'none',
  held: 'none',
  bg: 'none',
  pose: 'sit',
}

const totalLessonsDone = () => {
  const p = useLearning.getState().profile
  return Object.values(p.lessons).reduce(
    (acc, m) => acc + Object.values(m ?? {}).filter((r) => r.done).length,
    0
  )
}

const masteredCount = () => {
  const p = useLearning.getState().profile
  return Object.values(p.skills).filter((s) => s.state === 'mastered').length
}

const proficientPlus = () => {
  const p = useLearning.getState().profile
  return Object.values(p.skills).filter(
    (s) => s.state === 'proficient' || s.state === 'mastered'
  ).length
}

const reviewsDone = () =>
  useLearning
    .getState()
    .profile.events.filter((e) => e.type === 'review.completed').length

const readingMinutesTotal = () =>
  Math.round(
    Object.values(useLearning.getState().profile.reading).reduce((a, b) => a + b, 0) / 60
  )

const exercisesPassed = () => {
  const p = useLearning.getState().profile
  return Object.values(p.skills).reduce(
    (acc, s) =>
      acc + s.evidence.filter((e) => e.kind === 'exercise-pass' || e.kind === 'challenge-pass').length,
    0
  )
}

const projectsDone = () => {
  const p = useLearning.getState().profile
  return Object.values(p.projects).filter((pr) => pr.completedAt).length
}

export const MASCOT_ITEMS: MascotItem[] = [
  /* ---- خز ---- */
  { id: 'classic', layer: 'fur', title: 'خرمای کلاسیک' },
  {
    id: 'sunset',
    layer: 'fur',
    title: 'غروب سنجاب',
    unlock: { desc: 'برسدن به سطح ۳ در موتور انگیزش', check: () => levelOf(useGame.getState().xp) >= 3 },
  },
  {
    id: 'mint',
    layer: 'fur',
    title: 'نعنایی',
    unlock: { desc: 'تسلط کامل روی یک مهارت', check: () => masteredCount() >= 1 },
  },
  {
    id: 'night',
    layer: 'fur',
    title: 'شبگرد',
    unlock: { desc: 'زنجیرهٔ ۳ روزهٔ یادگیری', check: () => useGame.getState().streakCount >= 3 },
  },
  /* ---- چشم ---- */
  { id: 'normal', layer: 'eye', title: 'چشم معمولی' },
  {
    id: 'happy',
    layer: 'eye',
    title: 'چشم خندان',
    unlock: { desc: 'زنجیرهٔ ۵ روزه', check: () => useGame.getState().streakBest >= 5 },
  },
  {
    id: 'star',
    layer: 'eye',
    title: 'چشم ستاره‌ای',
    unlock: { desc: 'یک مهارت کاملاً مسلط', check: () => masteredCount() >= 1 },
  },
  /* ---- عینک ---- */
  { id: 'none', layer: 'glasses', title: 'بدون عینک' },
  {
    id: 'round',
    layer: 'glasses',
    title: 'عینک دانش‌پژوه',
    unlock: { desc: 'تکمیل ۵ درس', check: () => totalLessonsDone() >= 5 },
  },
  {
    id: 'star',
    layer: 'glasses',
    title: 'عینک ستاره',
    unlock: { desc: 'نمرهٔ کامل یک آزمون', check: () => useGame.getState().quizzesPerfect >= 1 },
  },
  /* ---- کلاه ---- */
  { id: 'none', layer: 'hat', title: 'بدون کلاه' },
  {
    id: 'cap',
    layer: 'hat',
    title: 'کلاه کپ',
    unlock: { desc: 'تکمیل ۱۰ درس', check: () => totalLessonsDone() >= 10 },
  },
  {
    id: 'grad',
    layer: 'hat',
    title: 'کلاه فارغ‌التحصیلی',
    unlock: { desc: '۳ مهارت در سطح «مسلط» یا بالاتر', check: () => proficientPlus() >= 3 },
  },
  {
    id: 'band',
    layer: 'hat',
    title: 'سربند سنجابی',
    unlock: { desc: '۵۰ رویداد یادگیری', check: () => useLearning.getState().profile.events.length >= 50 },
  },
  /* ---- لباس ---- */
  { id: 'none', layer: 'outfit', title: 'بدون لباس' },
  {
    id: 'scarf',
    layer: 'outfit',
    title: 'شال گردن',
    unlock: { desc: '۳ جلسهٔ مرور کامل', check: () => reviewsDone() >= 3 },
  },
  {
    id: 'vest',
    layer: 'outfit',
    title: 'جلیقهٔ مهندسی',
    unlock: { desc: 'تکمیل یک پروژهٔ Project Lab', check: () => projectsDone() >= 1 },
  },
  {
    id: 'hoodie',
    layer: 'outfit',
    title: 'هودی سنجاب',
    unlock: { desc: 'برسدن به سطح ۵', check: () => levelOf(useGame.getState().xp) >= 5 },
  },
  /* ---- وسیله ---- */
  { id: 'none', layer: 'held', title: 'بدون وسیله' },
  {
    id: 'acorn',
    layer: 'held',
    title: 'بلوط افتخار',
    unlock: { desc: 'حل یک چالش الگوریتمی', check: () => exercisesPassed() >= 1 },
  },
  {
    id: 'book',
    layer: 'held',
    title: 'کتاب درس',
    unlock: { desc: '۱۲۰ دقیقه مطالعهٔ تجمعی', check: () => readingMinutesTotal() >= 120 },
  },
  {
    id: 'laptop',
    layer: 'held',
    title: 'لپ‌تاپ کدنویسی',
    unlock: { desc: 'پاس کردن ۳ تمرین عملی', check: () => exercisesPassed() >= 3 },
  },
  /* ---- پس‌زمینه ---- */
  { id: 'none', layer: 'bg', title: 'بدون پس‌زمینه' },
  {
    id: 'sunjob',
    layer: 'bg',
    title: 'هالهٔ سان‌جاب',
    unlock: { desc: 'برسدن به سطح ۲', check: () => levelOf(useGame.getState().xp) >= 2 },
  },
  {
    id: 'mint',
    layer: 'bg',
    title: 'دشت نعنایی',
    unlock: { desc: '۵ مهارت آشنا یا بالاتر', check: () => proficientPlus() + masteredCount() >= 5 },
  },
  {
    id: 'space',
    layer: 'bg',
    title: 'فضا!',
    unlock: {
      desc: 'پیشرفت ۸۰٪ در یک مسیر یادگیری',
      check: () => {
        const p = useLearning.getState().profile
        return Object.entries(TRACK_LESSONS).some(([track, lessons]) => {
          const recs = p.lessons[track as keyof typeof p.lessons] ?? {}
          const done = lessons.filter((l) => recs[l.id]?.done).length
          return lessons.length > 0 && done / lessons.length >= 0.8
        })
      },
    },
  },
]

export const LAYER_TITLES: Record<MascotLayer, string> = {
  fur: 'خز و رنگ بدن',
  eye: 'چشم',
  glasses: 'عینک',
  hat: 'کلاه',
  outfit: 'لباس',
  held: 'وسیله',
  bg: 'پس‌زمینه',
}

const unlockedCache = new Map<string, boolean>()

/** آیا آیتم باز است؟ — شرط‌ها ارزان‌اند و cache می‌شوند */
export function isUnlocked(item: MascotItem): boolean {
  if (!item.unlock) return true
  const cached = unlockedCache.get(item.id)
  if (cached !== undefined) return cached
  let ok = false
  try {
    ok = item.unlock.check()
  } catch {
    ok = false
  }
  unlockedCache.set(item.id, ok)
  return ok
}

/** پاک‌کردن cache شرط‌ها — بعد از هر رویداد آموزشی */
export function invalidateUnlockCache(): void {
  unlockedCache.clear()
}

interface MascotStore {
  version: 1
  name: string
  look: SanjabakLook
  reactions: boolean
  setName: (name: string) => void
  setLayer: (layer: MascotLayer, itemId: string) => void
  setPose: (pose: SanjabakLook['pose']) => void
  setReactions: (v: boolean) => void
  resetLook: () => void
}

export const useMascot = create<MascotStore>()(
  persist(
    (set) => ({
      version: 1,
      name: 'سنجابک',
      look: { ...DEFAULT_LOOK },
      reactions: true,
      setName: (name) => set({ name: name.slice(0, 24) }),
      setLayer: (layer, itemId) =>
        set((s) => ({ look: { ...s.look, [layer]: itemId } })),
      setPose: (pose) => set((s) => ({ look: { ...s.look, pose } })),
      setReactions: (v) => set({ reactions: v }),
      resetLook: () => set({ look: { ...DEFAULT_LOOK } }),
    }),
    { name: 'sanjabak-v1' }
  )
)

/** رنگ‌های خز و پس‌زمینه برای رندر SVG */
export const FUR_COLORS: Record<string, { body: string; belly: string; tail: string }> = {
  classic: { body: '#c9762b', belly: '#f2dfc0', tail: '#a85a1a' },
  sunset: { body: '#e0813f', belly: '#ffd9ad', tail: '#b05018' },
  mint: { body: '#4bab8f', belly: '#d7f2e7', tail: '#2f7d66' },
  night: { body: '#4c4a6d', belly: '#cfcbe8', tail: '#35334f' },
}

export const BG_COLORS: Record<string, { fill: string; glow?: string }> = {
  none: { fill: 'transparent' },
  sunjob: { fill: 'rgba(247,147,30,0.12)', glow: 'rgba(247,147,30,0.35)' },
  mint: { fill: 'rgba(75,171,143,0.14)', glow: 'rgba(75,171,143,0.3)' },
  space: { fill: 'rgba(76,74,109,0.35)', glow: 'rgba(139,92,246,0.4)' },
}
