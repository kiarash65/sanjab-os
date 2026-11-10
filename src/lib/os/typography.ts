/* ================================================================
   سیستم تایپوگرافی سان‌جاب‌اواس
   گزینه‌های فونت، پریست‌ها و اعمال تنظیمات روی CSS Variables
   هیچ Reload لازم نیست، همه‌چیز runtime اعمال می‌شود.
   ================================================================ */

import type {
  FontFamilyKey,
  CodeFontKey,
  LineHeightKey,
  ReadingWidthKey,
  OSSettings,
} from './store'

/* ---------------- استک فونت‌ها ---------------- */

export const FONT_STACKS: Record<FontFamilyKey, string> = {
  estedad: "'Estedad', 'Vazirmatn', ui-sans-serif, system-ui, sans-serif",
  vazirmatn: "'Vazirmatn', 'Estedad', ui-sans-serif, system-ui, sans-serif",
  'vazirmatn-ui': "'Vazirmatn UI', 'Vazirmatn', ui-sans-serif, system-ui, sans-serif",
  system: "system-ui, -apple-system, 'Segoe UI', Tahoma, ui-sans-serif, sans-serif",
}

export const CODE_FONT_STACKS: Record<CodeFontKey, string> = {
  jetbrains:
    "'JetBrains Mono', 'Vazirmatn', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  system:
    "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace",
}

/* ---------------- متادیتای فونت‌ها (برای Settings و مستندات) ---------------- */

export interface FontMeta {
  key: FontFamilyKey
  label: string
  designer: string
  license: string
  /** بازه وزن پشتیبانی‌شده، اسلایدر وزن داخل این بازه clamp می‌شود */
  weightMin: number
  weightMax: number
  /** اگر فونت استاتیک است، وزن‌ها به این مقادیر اسنپ می‌کنند */
  weightSnap?: number[]
  note: string
}

export const FONT_OPTIONS: FontMeta[] = [
  {
    key: 'estedad',
    label: 'استعداد',
    designer: 'امین عابدی',
    license: 'SIL OFL 1.1',
    weightMin: 100,
    weightMax: 900,
    note: 'فونت پیشنهادی برای متن‌های آموزشی و مطالعه طولانی، فونت متغیر با همه وزن‌ها',
  },
  {
    key: 'vazirmatn',
    label: 'وزیرمتن',
    designer: 'صابر راستی‌کردار',
    license: 'SIL OFL 1.1',
    weightMin: 100,
    weightMax: 900,
    note: 'فونت عمومی و محبوب وب فارسی، فونت متغیر، مناسب متن و رابط',
  },
  {
    key: 'vazirmatn-ui',
    label: 'وزیرمتن UI',
    designer: 'صابر راستی‌کردار',
    license: 'SIL OFL 1.1',
    weightMin: 400,
    weightMax: 900,
    weightSnap: [400, 500, 700, 900],
    note: 'نسخه مخصوص رابط کاربری، هماهنگی بهتر ارتفاع حروف در کنار متن انگلیسی',
  },
  {
    key: 'system',
    label: 'پیش‌فرض سیستم',
    designer: 'سیستم‌عامل دستگاه',
    license: 'متغیر (به دستگاه کاربر بستگی دارد)',
    weightMin: 300,
    weightMax: 800,
    note: 'فونت خود دستگاه، سریع‌ترین حالت، بدون دانلود',
  },
]

export const CODE_FONT_OPTIONS: {
  key: CodeFontKey
  label: string
  note: string
}[] = [
  {
    key: 'jetbrains',
    label: 'JetBrains Mono',
    note: 'مونوی حرفه‌ای با ارقام قابل‌تشخیص، باندل محلی، مجوز OFL',
  },
  {
    key: 'system',
    label: 'مونوی سیستم',
    note: 'Consolas / Menlo / monospace خود دستگاه',
  },
]

/* ---------------- پریست‌ها ---------------- */

export const LINE_HEIGHT_PRESETS: Record<
  LineHeightKey,
  { value: number; label: string }
> = {
  compact: { value: 1.7, label: 'فشرده' },
  comfortable: { value: 1.9, label: 'راحت' },
  relaxed: { value: 2.15, label: 'باز' },
}

export const READING_WIDTH_PRESETS: Record<
  ReadingWidthKey,
  { value: string; label: string }
> = {
  narrow: { value: '620px', label: 'باریک' },
  standard: { value: '720px', label: 'استاندارد' },
  wide: { value: '880px', label: 'پهن' },
}

export const FONT_SIZE_LIMITS = { min: 13, max: 22, default: 16 }
export const CODE_SIZE_LIMITS = { min: 11, max: 18, default: 13 }

/* ---------------- کمکی‌ها ---------------- */

/** وزن را داخل بازه مجاز فونت clamp می‌کند (و برای فونت استاتیک اسنپ) */
export function clampWeight(font: FontFamilyKey, weight: number): number {
  const meta = FONT_OPTIONS.find((f) => f.key === font)
  if (!meta) return 400
  if (meta.weightSnap) {
    let best = meta.weightSnap[0]
    for (const w of meta.weightSnap) {
      if (Math.abs(w - weight) < Math.abs(best - weight)) best = w
    }
    return best
  }
  return Math.min(meta.weightMax, Math.max(meta.weightMin, Math.round(weight / 50) * 50))
}

/* ---------------- اعمال تنظیمات ---------------- */

/**
 * تنظیمات را بدون Reload روی <html> اعمال می‌کند:
 * - CSS Variables تایپوگرافی
 * - کلاس‌های دسترس‌پذیری
 * - مقیاس رابط کاربری (root font-size)
 */
export function applyTypography(s: OSSettings): void {
  if (typeof document === 'undefined') return
  const el = document.documentElement
  const st = el.style

  st.setProperty('--fa-font-body', FONT_STACKS[s.fontFamily] ?? FONT_STACKS.vazirmatn)
  st.setProperty('--fa-font-code', CODE_FONT_STACKS[s.codeFont] ?? CODE_FONT_STACKS.jetbrains)
  st.setProperty('--fa-body-size', `${s.fontSize}px`)
  st.setProperty('--fa-body-weight', String(clampWeight(s.fontFamily, s.bodyWeight)))
  st.setProperty('--fa-line-height', String(LINE_HEIGHT_PRESETS[s.lineHeight]?.value ?? 1.9))
  st.setProperty('--fa-reading-width', READING_WIDTH_PRESETS[s.readingWidth]?.value ?? '720px')
  st.setProperty('--fa-code-size', `${s.codeSize}px`)
  st.setProperty('--fa-paragraph-gap', `${(LINE_HEIGHT_PRESETS[s.lineHeight]?.value ?? 1.9) * 0.46}em`)

  // دسترس‌پذیری و رابط
  el.classList.toggle('fa-reduced-motion', s.reducedMotion === true || s.animations === false)
  el.classList.toggle('fa-high-contrast', s.highContrast === true)
  el.classList.toggle('fa-focus-indicators', s.keyboardNav === true)
  el.classList.toggle('fa-compact', s.density === 'compact')

  // مقیاس رابط: root font-size = 16px × مقیاس × (کنترل‌های بزرگ‌تر)
  const uiPx = Math.round(16 * (s.uiScale ?? 1) * (s.largerControls ? 1.06 : 1))
  st.fontSize = `${uiPx}px`
}

/** گزارش وضعیت بارگذاری فونت‌ها، برای Developer Mode */
export function fontStatusReport(): { family: string; loaded: boolean }[] {
  if (typeof document === 'undefined' || !('fonts' in document)) return []
  return [
    'Estedad',
    'Vazirmatn',
    'Vazirmatn UI',
    'JetBrains Mono',
  ].map((family) => ({
    family,
    loaded: document.fonts.check(`16px ${family}`),
  }))
}
