/* ------------------------------------------------------------------ */
/* پشتیبان‌گیری و بازیابی سان‌جاب‌اواس                                  */
/* صادقانه: تنظیمات/فایل‌سیستم/پیشرفت در localStorage هستند؛           */
/* این ماژول همه داده‌های مربوط به سیستم را در یک فایل JSON بریزد      */
/* و برمی‌گرداند. رازهای API به‌صورت پیش‌فرض حذف می‌شوند (opt-in).     */
/* ------------------------------------------------------------------ */

const KEY_PREFIXES = ['sunjob-os-v1', 'pengo-fs-v2', 'sanjab-game-v1', 'pengo-best-', 'sanjab-']
const SECRET_KEYS = ['sanjab-integrations']

export interface BackupFile {
  app: 'sanjabos'
  version: 1
  createdAt: string
  items: Record<string, string>
  includesSecrets: boolean
}

export interface UsageReport {
  localStorageBytes: number
  appBytes: number
  keyCount: number
  quota?: number
  usage?: number
}

function isAppKey(key: string): boolean {
  return KEY_PREFIXES.some((p) => key.startsWith(p))
}

export function backupToString(includeSecrets = false): string {
  const items: Record<string, string> = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key) continue
    if (!isAppKey(key)) continue
    if (!includeSecrets && SECRET_KEYS.includes(key)) continue
    items[key] = localStorage.getItem(key) ?? ''
  }
  const file: BackupFile = {
    app: 'sanjabos',
    version: 1,
    createdAt: new Date().toISOString(),
    items,
    includesSecrets: includeSecrets,
  }
  return JSON.stringify(file, null, 2)
}

export function downloadBackup(includeSecrets = false): boolean {
  try {
    const json = backupToString(includeSecrets)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sanjabos-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    return true
  } catch {
    return false
  }
}

/** بازیابی — تعداد کلیدهای بازیابی‌شده را برمی‌گرداند */
export function restoreFromString(json: string): { ok: boolean; count: number; error?: string } {
  try {
    const file = JSON.parse(json) as BackupFile
    if (file?.app !== 'sanjabos' || typeof file.items !== 'object') {
      return { ok: false, count: 0, error: 'فایل پشتیبان معتبر نیست' }
    }
    let count = 0
    for (const [k, v] of Object.entries(file.items)) {
      if (typeof v !== 'string') continue
      localStorage.setItem(k, v)
      count++
    }
    return { ok: true, count }
  } catch (e) {
    return { ok: false, count: 0, error: e instanceof Error ? e.message : 'خطای ناشناخته' }
  }
}

export function restoreFromFile(file: File): Promise<{ ok: boolean; count: number; error?: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(restoreFromString(String(reader.result ?? '')))
    reader.onerror = () => resolve({ ok: false, count: 0, error: 'خواندن فایل ناموفق بود' })
    reader.readAsText(file)
  })
}

export function usageReport(): UsageReport {
  let total = 0
  let app = 0
  let count = 0
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key) continue
    const val = localStorage.getItem(key) ?? ''
    const bytes = key.length + val.length
    total += bytes
    count++
    if (isAppKey(key)) app += bytes
  }
  return { localStorageBytes: total, appBytes: app, keyCount: count }
}

export function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(2)} MB`
}
