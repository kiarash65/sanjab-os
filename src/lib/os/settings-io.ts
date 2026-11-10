/* ================================================================
   خروجی/ورودی تنظیمات و داده‌های یادگیری
   - Export/Import تنظیمات (JSON)
   - Export/Import پیشرفت آموزشی
   - بازنشانی جداگانه تنظیمات و داده‌های یادگیری
   ================================================================ */

import { DEFAULT_SETTINGS, useOS, type OSSettings } from './store'
import { clampWeight } from './typography'

const SETTINGS_EXPORT_APP = 'sanjabos-settings'
const PROGRESS_EXPORT_APP = 'sanjabos-progress'

/** کلیدهایی که پیشرفت آموزشی/خواندن را نگه می‌دارند (پیشوند sunjob- غیر از خود تنظیمات) */
export const LEARNING_KEY_PREFIX = 'sunjob-'
const SETTINGS_STORAGE_KEY = 'sunjob-os-v1'

export function isLearningKey(key: string): boolean {
  return key.startsWith(LEARNING_KEY_PREFIX) && key !== SETTINGS_STORAGE_KEY
}

export function learningKeys(): string[] {
  if (typeof localStorage === 'undefined') return []
  const out: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k && isLearningKey(k)) out.push(k)
  }
  return out
}

/* ---------------- تنظیمات ---------------- */

export interface SettingsFile {
  app: string
  version: number
  exportedAt: string
  settings: Partial<OSSettings>
}

export function exportSettingsToString(): string {
  const settings = useOS.getState().settings
  const file: SettingsFile = {
    app: SETTINGS_EXPORT_APP,
    version: 2,
    exportedAt: new Date().toISOString(),
    settings,
  }
  return JSON.stringify(file, null, 2)
}

export function downloadSettings(): boolean {
  try {
    const blob = new Blob([exportSettingsToString()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sanjabos-settings-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    return true
  } catch {
    return false
  }
}

type AnySetter = (key: keyof OSSettings, value: unknown) => void

/** تنظیمات فایل را اعتبارسنجی و روی store اعمال می‌کند، بدون بارگذاری دوباره */
export function importSettingsFromString(json: string): { ok: boolean; count: number; error?: string } {
  let file: SettingsFile
  try {
    file = JSON.parse(json) as SettingsFile
  } catch {
    return { ok: false, count: 0, error: 'فایل JSON معتبر نیست' }
  }
  if (file.app !== SETTINGS_EXPORT_APP || typeof file.settings !== 'object' || !file.settings) {
    return { ok: false, count: 0, error: 'این فایل تنظیمات سان‌جاب‌اواس نیست' }
  }
  const incoming = file.settings as unknown as Record<string, unknown>
  const defaults = DEFAULT_SETTINGS as unknown as Record<string, unknown>
  let count = 0
  const setSetting = useOS.getState().setSetting as unknown as AnySetter
  for (const key of Object.keys(defaults)) {
    if (key in incoming && typeof incoming[key] === typeof defaults[key]) {
      setSetting(key as keyof OSSettings, incoming[key])
      count++
    }
  }
  // وزن را داخل بازه فونت انتخابی clamp کن تا بیرون از بازه نماند
  const s = useOS.getState().settings
  setSetting('bodyWeight', clampWeight(s.fontFamily, s.bodyWeight))
  return { ok: true, count }
}

export async function importSettingsFromFile(file: File) {
  const text = await file.text()
  return importSettingsFromString(text)
}

/* ---------------- پیشرفت آموزشی ---------------- */

export function exportProgressToString(): string {
  const items: Record<string, string> = {}
  learningKeys().forEach((k) => {
    const v = localStorage.getItem(k)
    if (v) items[k] = v
  })
  return JSON.stringify(
    { app: PROGRESS_EXPORT_APP, version: 1, exportedAt: new Date().toISOString(), items },
    null,
    2
  )
}

export function downloadProgress(): boolean {
  try {
    const blob = new Blob([exportProgressToString()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sanjabos-progress-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    return true
  } catch {
    return false
  }
}

export function importProgressFromString(json: string): { ok: boolean; count: number; error?: string } {
  let file: { app?: string; items?: Record<string, string> }
  try {
    file = JSON.parse(json)
  } catch {
    return { ok: false, count: 0, error: 'فایل JSON معتبر نیست' }
  }
  if (file.app !== PROGRESS_EXPORT_APP || !file.items) {
    return { ok: false, count: 0, error: 'این فایل پیشرفت آموزشی سان‌جاب‌اواس نیست' }
  }
  let count = 0
  Object.entries(file.items).forEach(([k, v]) => {
    if (isLearningKey(k) && typeof v === 'string') {
      localStorage.setItem(k, v)
      count++
    }
  })
  return { ok: true, count }
}

export async function importProgressFromFile(file: File) {
  const text = await file.text()
  return importProgressFromString(text)
}

/** حذف فقط داده‌های یادگیری، تنظیمات دست‌نخورده می‌مانند */
export function resetLearningData(): number {
  const keys = learningKeys()
  keys.forEach((k) => localStorage.removeItem(k))
  return keys.length
}

/** بازنشانی تنظیمات به پیش‌فرض، داده‌های یادگیری دست‌نخورده */
export function resetAllSettings(): void {
  const setSetting = useOS.getState().setSetting as unknown as AnySetter
  const d = DEFAULT_SETTINGS
  ;(Object.keys(d) as (keyof OSSettings)[]).forEach((k) => {
    setSetting(k, d[k])
  })
}

/* ---------------- ردیابی زمان مطالعه (هدف روزانه) ---------------- */

const READING_TIME_KEY = 'sunjob-reading-v1'

export interface ReadingTimeFile {
  date: string
  seconds: number
}

export function todayReadingSeconds(): number {
  try {
    const raw = localStorage.getItem(READING_TIME_KEY)
    if (!raw) return 0
    const f = JSON.parse(raw) as ReadingTimeFile
    const today = new Date().toISOString().slice(0, 10)
    return f.date === today ? f.seconds : 0
  } catch {
    return 0
  }
}

export function addReadingSeconds(sec: number): void {
  try {
    const today = new Date().toISOString().slice(0, 10)
    const raw = localStorage.getItem(READING_TIME_KEY)
    const f: ReadingTimeFile = raw ? (JSON.parse(raw) as ReadingTimeFile) : { date: today, seconds: 0 }
    if (f.date !== today) {
      f.date = today
      f.seconds = 0
    }
    f.seconds += sec
    localStorage.setItem(READING_TIME_KEY, JSON.stringify(f))
  } catch {
    /* ignore */
  }
}
