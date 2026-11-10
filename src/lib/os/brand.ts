/* ------------------------------------------------------------------ */
/* هویت بصری «سان‌جاب‌او‌اس»، پالت رنگی اقتباس‌شده از sunjob.ir      */
/* ------------------------------------------------------------------ */

export const BRAND = {
  name: 'سان‌جاب‌او‌اس',
  nameEn: 'SunJob OS',
  version: '۴.۰ «سنجابک»',
  versionEn: '4.0 "Sanjabak"',
  kernel: '6.12.4-sanjob-cute',
  sponsor: 'با اسپانسری سان‌جاب',
  sponsorShort: 'اسپانسر: سان‌جاب',
  sponsorUrl: 'https://sunjob.ir',
  sponsorSite: 'sunjob.ir',
  tagline: 'سیستم‌عامل بامزهٔ آموزشی تحت وب، با اسپانسری سان‌جاب',
  home: '/home/pengo',
} as const

/** پالت رنگی استخراج‌شده از سایت sunjob.ir */
export const SUNJOB_PALETTE = {
  orange: '#f7931e', // برند اصلی سان‌جاب
  orangeDeep: '#e07b00',
  orangeSoft: '#fdb56b',
  violet: '#8b5cf6',
  violetDeep: '#7c3aed',
  violetSoft: '#a78bfa',
  teal: '#0ea5a0',
  tealBright: '#11b7be',
  tealTailwind: '#14b8a6',
  rose: '#e11d48',
  navy: '#1a2744',
  navyDeep: '#0b1120',
  cream: '#fffbf5',
  creamWarm: '#fffaf6',
  sand: '#f3f0ed',
} as const

/** رنگ پیش‌فرض اکسنت سیستم */
export const DEFAULT_ACCENT = SUNJOB_PALETTE.orange

/** هشدار نرمال‌سازی رنگ */
export function safeColor(c: string | undefined): string {
  if (c && /^#[0-9a-fA-F]{3,8}$/.test(c)) return c
  return DEFAULT_ACCENT
}
