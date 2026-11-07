/**
 * Lesson Registry — فهرست درس‌های واقعی هر مسیر + عنوان فارسی
 * منبع درس‌های پایتون از python-curriculum و الگوریتم از curriculum خودش
 * import می‌شود؛ بقیه نگاشت استاتیک با عنوان‌های رسمی آکادمی‌ها هستند.
 */
import { PYTHON_LESSONS } from '@/lib/academy/python-curriculum'
import { ALGO_LESSONS } from '@/lib/academy/algorithm-curriculum'
import type { TrackId } from './types'

export interface LessonInfo {
  id: string
  title: string
}

const RUST_TITLES: Record<string, string> = {
  'rust-what': 'راست چیست؟',
  'rust-cargo': 'کاگو؛ جعبه‌ابزار رسمی',
  'rust-vars': 'متغیرها: let و let mut',
  'rust-types': 'انواع داده',
  'rust-fn': 'توابع؛ عبارت در برابر دستور',
  'rust-control': 'کنترل جریان: if ،loop و for',
  'own-what': 'مالکیت؛ قلب Rust',
  'own-move': 'Move؛ جابه‌جایی مالکیت',
  'own-borrow': 'استقراض با &',
  'own-mutborrow': 'قرض قابل‌تغییر',
  'own-slices': 'برش‌ها (Slices)',
  'own-lifetime': 'عمرها (Lifetimes)',
  'st-struct': 'struct و impl',
  'st-enum': 'enum و قدرت match',
  'st-option': 'Option؛ پایانِ null',
  'st-result': 'Result و عملگر ؟',
  'st-traits': 'trait؛ قرارداد رفتار',
  'st-collections': 'Vec ،HashMap و iteratorها',
  'conc-thread': 'thread و move',
  'conc-mutex': 'Mutex و Arc',
  'conc-async': 'async/await و tokio',
  'conc-unsafe': 'دنیای unsafe',
}

const POWERSHELL_TITLES: Record<string, string> = {
  'ps-1': 'پاورشل چیست؟ اشیاء در برابر متن',
  'ps-2': 'Get-Help و Get-Command — هنوز پیدا کردن',
  'ps-3': 'متغیرها و انواع داده',
  'ps-4': 'پوشه‌ها و فایل‌ها؛ دنیای Providerها',
  'ps-5': 'پروسه‌ها و سرویس‌ها',
  'ps-6': 'شبکه و CIM؛ سیستم گزارش می‌دهد',
  'ps-7': 'شرط‌ها و حلقه‌ها',
  'ps-8': 'توابع؛ بسته‌بندی منطق',
  'ps-9': 'مدیریت خطاها؛ وقتی کار خراب می‌شود',
  'ps-10': 'ماژول‌ها و اسکریپت‌ها؛ سیاست اجرا',
  'ps-11': 'کار با API و JSON',
  'ps-12': 'winget و مدیریت نرم‌افزار',
}

const AI_TITLES: Record<string, string> = {
  home: 'هوش مصنوعی چیست؟',
  perceptron: 'پرسپترون: نورون اول',
  gradient: 'نزول گرادیان',
  activations: 'توابع فعال‌ساز',
  network: 'شبکه عصبی جلوی چشم',
  llm: 'مدل زبانی چطور حرف می‌زند؟',
  overfit: 'بیش‌برازش (Overfitting)',
  ethics: 'اخلاق و آینده',
  lab: 'آزمایشگاه شبکه عصبی',
  tokenizer: 'توکن‌ساز — زبان مدل‌ها (BPE)',
  attention: 'خودتوجهی — قلب ترنسفورمر',
  rag: 'بازیابی‌افزوده (RAG)',
  quiz: 'آزمون نهایی',
}

const LINUX_TITLES: Record<string, string> = {
  what: 'لینوکس چیست؟',
  where: 'لینوکس کجاست؟',
  distros: 'توزیع‌ها',
  install: 'نصب لینوکس',
  terminal: 'ترمینال',
  permissions: 'دسترسی‌ها',
  procs: 'فرآیندها و بسته‌ها',
  quiz: 'آزمون و گواهی',
}

const PY_TITLES = new Map(PYTHON_LESSONS.map((l) => [l.id, l.title]))
const AL_TITLES = new Map(ALGO_LESSONS.map((l) => [l.id, l.title]))

/** کل درس‌های محتوایی هر مسیر (به ترتیب) */
export const TRACK_LESSONS: Record<TrackId, LessonInfo[]> = {
  python: PYTHON_LESSONS.map((l) => ({ id: l.id, title: l.title })),
  linux: Object.entries(LINUX_TITLES).map(([id, title]) => ({ id, title })),
  rust: Object.entries(RUST_TITLES).map(([id, title]) => ({ id, title })),
  ai: Object.entries(AI_TITLES).map(([id, title]) => ({ id, title })),
  powershell: Object.entries(POWERSHELL_TITLES).map(([id, title]) => ({ id, title })),
  algorithm: ALGO_LESSONS.map((l) => ({ id: l.id, title: l.title })),
}

const TRACK_APP: Record<TrackId, string> = {
  python: 'python-academy',
  linux: 'linux-academy',
  rust: 'rust-academy',
  ai: 'ai-academy',
  powershell: 'powershell-academy',
  algorithm: 'algorithm-academy',
}

export function appOfTrack(track: TrackId): string {
  return TRACK_APP[track]
}

/** عنوان درس — با fallback خوانا */
export function lessonTitle(track: TrackId, lessonId: string): string {
  const list = TRACK_LESSONS[track]
  const found = list.find((l) => l.id === lessonId)
  if (found) return found.title
  if (lessonId.startsWith('ex:')) {
    const ex = lessonId.slice(3)
    return `تمرین ${PY_TITLES.get(ex) ?? ex}`
  }
  if (lessonId.startsWith('mission:')) return `مأموریت ${lessonId.slice(8)}`
  return lessonId
}
