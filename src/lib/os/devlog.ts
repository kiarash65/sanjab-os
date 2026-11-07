/* ================================================================
   لاگ داخلی سیستم — برای Developer Mode
   - حلقه‌ای (ring buffer) با سقف ثابت، هیچ‌وقد رشد نمی‌کند
   - محتوای حساس (کلید، توکن، رمز) پیش از ذخیره پاک می‌شود
   - متن‌ها کوتاه می‌شوند تا حافظه مصرف نشود
   ================================================================ */

export type DevLogLevel = 'info' | 'warn' | 'error'

export interface DevLogEntry {
  id: number
  level: DevLogLevel
  msg: string
  at: number
  src?: string
}

const MAX_ENTRIES = 120
const MAX_MSG = 240

let entries: DevLogEntry[] = []
let seq = 0
let installed = false

/** حذف اطلاعات حساس و کوتاه‌سازی */
export function scrubMessage(input: unknown): string {
  let s = ''
  try {
    if (input instanceof Error) s = `${input.name}: ${input.message}`
    else s = typeof input === 'string' ? input : String(input)
  } catch {
    return '[unserializable]'
  }
  s = s
    .replace(/\b(sk-|key|token|secret|password|authorization|bearer)[=: ]\S+/gi, '$1=[پاک‌شد]')
    .replace(/ghp_[A-Za-z0-9]+/g, '[پاک‌شد]')
    .replace(/eyJ[A-Za-z0-9_-]{10,}/g, '[پاک‌شد]')
  if (s.length > MAX_MSG) s = `${s.slice(0, MAX_MSG)}…`
  return s
}

export function devLog(level: DevLogLevel, msg: unknown, src?: string): void {
  entries.push({
    id: ++seq,
    level,
    msg: scrubMessage(msg),
    at: Date.now(),
    src: src ? scrubMessage(src) : undefined,
  })
  if (entries.length > MAX_ENTRIES) entries = entries.slice(-MAX_ENTRIES)
}

export function getDevLogs(): DevLogEntry[] {
  return [...entries].reverse()
}

export function clearDevLogs(): void {
  entries = []
  devLog('info', 'لاگ‌ها پاک شد', 'devlog')
}

/** نصب یک‌باره گوش‌دهنده‌های خطای سراسری */
export function installDevLog(): void {
  if (installed || typeof window === 'undefined') return
  installed = true

  window.addEventListener('error', (e) => {
    devLog('error', e.message || 'خطای ناشناخته', e.filename?.split('/').pop())
  })
  window.addEventListener('unhandledrejection', (e) => {
    devLog('error', `Promise رد شد: ${scrubMessage(e.reason)}`, 'promise')
  })

  const origWarn = console.warn.bind(console)
  console.warn = (...args: unknown[]) => {
    devLog('warn', args.map(scrubMessage).join(' '))
    origWarn(...args)
  }
  const origError = console.error.bind(console)
  console.error = (...args: unknown[]) => {
    devLog('error', args.map(scrubMessage).join(' '))
    origError(...args)
  }

  devLog('info', 'DevLog نصب شد', 'devlog')
}

/** گزارش فنی کامل برای کپی — بدون هیچ داده خصوصی */
export async function buildTechReport(): Promise<string> {
  const nav = typeof navigator !== 'undefined' ? navigator : null
  const perf = typeof performance !== 'undefined' ? performance : null
  const mem = (
    perf as unknown as { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } } | null
  )?.memory

  let storage = ''
  try {
    if (nav?.storage?.estimate) {
      const est = await nav.storage.estimate()
      storage = `usage=${Math.round((est.usage ?? 0) / 1024)}KB quota=${Math.round((est.quota ?? 0) / 1024 / 1024)}MB`
    }
  } catch {
    storage = 'unavailable'
  }

  const fontChecks = [
    'Estedad',
    'Vazirmatn',
    'JetBrains Mono',
  ].map((f) => {
    try {
      return `${f}:${document.fonts.check(`16px ${f}`) ? 'ok' : 'no'}`
    } catch {
      return `${f}:?`
    }
  })

  return JSON.stringify(
    {
      app: 'SanjabOS',
      note: 'این گزارش فنی است و شامل کلیدها یا داده‌های شخصی شما نیست',
      generatedAt: new Date().toISOString(),
      logs: getDevLogs().slice(0, 40),
      environment: {
        userAgent: nav?.userAgent,
        language: nav?.language,
        platform: nav?.platform,
        online: nav?.onLine,
        deviceMemoryGB: (nav as unknown as { deviceMemory?: number })?.deviceMemory,
        hardwareConcurrency: nav?.hardwareConcurrency,
        dpr: typeof window !== 'undefined' ? window.devicePixelRatio : undefined,
        screen: typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : undefined,
      },
      memory: mem
        ? `heap=${Math.round(mem.usedJSHeapSize / 1024)}KB limit=${Math.round(mem.jsHeapSizeLimit / 1024 / 1024)}MB`
        : 'unavailable',
      storage,
      fonts: fontChecks.join(' '),
    },
    null,
    2
  )
}
