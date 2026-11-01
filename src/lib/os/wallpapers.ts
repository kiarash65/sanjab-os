export interface Wallpaper {
  key: string
  name: string
  css: string
}

export const WALLPAPERS: Wallpaper[] = [
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
]

export function wallpaperCss(key: string): string {
  const found = WALLPAPERS.find((w) => w.key === key)
  if (found) return found.css
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
  { key: 'green', value: '#22c55e', name: 'سبز پنگوئنی' },
  { key: 'amber', value: '#f59e0b', name: 'زرد عسلی' },
  { key: 'rose', value: '#fb7185', name: 'صورتی شلغمی' },
  { key: 'teal', value: '#14b8a6', name: 'فیروزه‌ای' },
  { key: 'violet', value: '#a78bfa', name: 'بنفش بادمجونی' },
  { key: 'orange', value: '#fb923c', name: 'نارنجی منقاری' },
]
