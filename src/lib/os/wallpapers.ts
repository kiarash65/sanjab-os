export interface Wallpaper {
  key: string
  name: string
  css: string
}

export const WALLPAPERS: Wallpaper[] = [
  {
    key: 'img:sunjob-sunrise',
    name: 'طلوع سان‌جاب (لوگو)',
    css: 'url(/wallpapers/sanjob-sunrise.png)',
  },
  {
    key: 'img:linux-classroom',
    name: 'کلاس درس لینوکس',
    css: 'url(/wallpapers/linux-classroom.png)',
  },
  {
    key: 'img:sunjob-flow',
    name: 'موج‌های سان‌جابی',
    css: 'url(/wallpapers/sunjob-flow.png)',
  },
  {
    key: 'img:sunjob-squirrel',
    name: 'سنجابک سان‌جابی',
    css: 'url(/wallpapers/sunjob-squirrel.png)',
  },
  {
    key: 'img:sunjob-blobs',
    name: 'لکه‌های رنگی سان‌جاب',
    css: 'url(/wallpapers/sunjob-blobs.png)',
  },
  {
    key: 'img:sunjob-desk',
    name: 'میز مطالعه کنکوری',
    css: 'url(/wallpapers/sunjob-desk.png)',
  },
  {
    key: 'grad:sunjob',
    name: 'گرادیان رسمی سان‌جاب',
    css: 'linear-gradient(135deg, #1a2744 0%, #7c3aed 55%, #f7931e 120%)',
  },
  {
    key: 'grad:sunjob-light',
    name: 'کرم صبحگاهی سان‌جاب',
    css: 'linear-gradient(135deg, #fffbf5 0%, #fdb56b 55%, #f7931e 110%)',
  },
  {
    key: 'grad:sunjob-teal',
    name: 'فیروزه سان‌جابی',
    css: 'linear-gradient(140deg, #0b1120 0%, #0ea5a0 60%, #11b7be 110%)',
  },
  {
    key: 'grad:aurora',
    name: 'شفق پنگوئنی',
    css: 'linear-gradient(140deg, #022c22 0%, #065f46 45%, #0d9488 100%)',
  },
  {
    key: 'grad:sunset',
    name: 'غروب نارنجی',
    css: 'linear-gradient(140deg, #431407 0%, #9a3412 50%, #f59e0b 100%)',
  },
  {
    key: 'grad:berry',
    name: 'شب توت‌فرنگی',
    css: 'linear-gradient(140deg, #3b0764 0%, #701a75 50%, #db2777 100%)',
  },
  {
    key: 'grad:night',
    name: 'شب مخملی',
    css: 'linear-gradient(140deg, #09090b 0%, #1c1917 55%, #57534e 100%)',
  },
  {
    key: 'grad:mint',
    name: 'چای نعنایی',
    css: 'linear-gradient(140deg, #064e3b 0%, #0f766e 50%, #84cc16 100%)',
  },
  {
    key: 'img:tux',
    name: 'تاکسی پنگوئنی',
    css: 'url(/wallpapers/tux-hills.png)',
  },
  {
    key: 'img:pixel',
    name: 'ایگلو هکری',
    css: 'url(/wallpapers/pixel-art.png)',
  },
  {
    key: 'img:catspace',
    name: 'گربه فضانورد',
    css: 'url(/wallpapers/cat-space.png)',
  },
  {
    key: 'img:aurora',
    name: 'شفق قطبی',
    css: 'url(/wallpapers/aurora-night.png)',
  },
  {
    key: 'img:retro',
    name: 'اتاق رترو',
    css: 'url(/wallpapers/retro-terminal.png)',
  },
  {
    key: 'grad:cyber',
    name: 'سایبرپانک نئون',
    css: 'linear-gradient(135deg, #0f0524 0%, #2d0b5e 35%, #e91e63 75%, #ff6f00 100%)',
  },
  {
    key: 'grad:deepsea',
    name: 'اقیانوس عمیق',
    css: 'linear-gradient(145deg, #021024 0%, #052859 45%, #0466c8 85%, #48cae4 100%)',
  },
  {
    key: 'grad:gold',
    name: 'طلایی پادشاهی',
    css: 'linear-gradient(135deg, #1a0f02 0%, #5c3a0e 40%, #d4a017 80%, #ffe066 100%)',
  },
  {
    key: 'grad:emerald',
    name: 'زمرد جنگل',
    css: 'linear-gradient(145deg, #022c22 0%, #064e3b 40%, #10b981 80%, #6ee7b7 100%)',
  },
  {
    key: 'grad:lavender',
    name: 'اسطوخودوس',
    css: 'linear-gradient(135deg, #2e1065 0%, #6d28d9 45%, #c4b5fd 90%, #f5d0fe 100%)',
  },
  {
    key: 'grad:lava',
    name: 'گدازه آتشفشانی',
    css: 'linear-gradient(145deg, #1c0a00 0%, #7c2d12 35%, #dc2626 70%, #fbbf24 100%)',
  },
  {
    key: 'grad:icecream',
    name: 'بستنی نعنایی',
    css: 'linear-gradient(135deg, #fdf2f8 0%, #fbcfe8 35%, #a7f3d0 75%, #bae6fd 100%)',
  },
  {
    key: 'grad:galaxy',
    name: 'کهکشان دور',
    css: 'radial-gradient(ellipse at 30% 20%, #1e1b4b 0%, transparent 50%), radial-gradient(ellipse at 70% 70%, #831843 0%, transparent 50%), linear-gradient(135deg, #030712 0%, #1e1b4b 100%)',
  },
  {
    key: 'grad:cotton',
    name: 'پنبه رنگی',
    css: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 25%, #fca5a5 55%, #c4b5fd 85%, #a5f3fc 100%)',
  },
]

export function wallpaperCss(key: string): string {
  const found = WALLPAPERS.find((w) => w.key === key)
  if (found) return found.css
  // نقاشی خود کاربر از اپ نقاشی: کلید «custom» + dataURL در localStorage
  if (key === 'custom' && typeof window !== 'undefined') {
    try {
      const data = window.localStorage.getItem('pengo-custom-wallpaper')
      if (data) return `url("${data}")`
    } catch {
      /* ignore */
    }
  }
  // عکس دلخواه (مثلاً از گالری): کلید «custom:/photos/x.png»
  if (key.startsWith('custom:')) return `url("${key.slice(7)}")`
  return WALLPAPERS[0].css
}

export interface Accent {
  key: string
  value: string
  name: string
}

export const ACCENTS: Accent[] = [
  { key: 'orange', value: '#f7931e', name: 'نارنجی سان‌جاب' },
  { key: 'violet', value: '#8b5cf6', name: 'بنفش سان‌جاب' },
  { key: 'teal', value: '#0ea5a0', name: 'فیروزه سان‌جاب' },
  { key: 'rose', value: '#e11d48', name: 'قرمز سان‌جاب' },
  { key: 'green', value: '#22c55e', name: 'سبز پنگوئنی' },
  { key: 'amber', value: '#f59e0b', name: 'زرد عسلی' },
  { key: 'pink', value: '#ec4899', name: 'صورتی بامزه' },
  { key: 'lime', value: '#84cc16', name: 'لیمویی' },
]
