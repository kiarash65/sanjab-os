/* ================================================================
   اطلاعات نسخه و پرچم‌های ویژگی — تک منبع حقیقت برای Developer Mode
   ================================================================ */

import packageJson from '../../../package.json'

export const OS_VERSION = '4.0.0'
export const OS_CODENAME = 'سنجابک'
export const OS_SPONSOR = 'sunjob.ir'
export const OS_REPO = 'https://github.com/kiarash65/sanjab-os'

export const RUNTIMES = [
  { name: 'Next.js', version: String(packageJson.dependencies?.next ?? '?') },
  { name: 'React', version: String(packageJson.dependencies?.react ?? '?') },
  { name: 'TypeScript', version: String(packageJson.devDependencies?.typescript ?? '?') },
  { name: 'Tailwind CSS', version: String(packageJson.devDependencies?.tailwindcss ?? '?') },
  { name: 'Zustand', version: String(packageJson.dependencies?.zustand ?? '?') },
  { name: 'framer-motion', version: String(packageJson.dependencies?.['framer-motion'] ?? '?') },
]

export interface FeatureFlag {
  key: string
  label: string
  on: boolean
  experimental: boolean
}

/** پرچم‌های واقعی سیستم — فقط چیزهایی که در کد وجود دارند */
export const FEATURE_FLAGS: FeatureFlag[] = [
  {
    key: 'reading-reader',
    label: 'خواننده یادگیری (Learning Reader)',
    on: true,
    experimental: false,
  },
  {
    key: 'local-fonts',
    label: 'فونت‌های محلی (بدون CDN)',
    on: true,
    experimental: false,
  },
  {
    key: 'wallpaper-rotate',
    label: 'چرخش خودکار کاغذدیواری',
    on: true,
    experimental: false,
  },
  {
    key: 'real-linux',
    label: 'لینوکس واقعی مرورگرمحور (اپ real-linux)',
    on: true,
    experimental: true,
  },
  {
    key: 'hoshiyar-ai',
    label: 'هوش‌یار — موتور هوش مصنوعی با کلید کاربر',
    on: true,
    experimental: false,
  },
  {
    key: 'dev-mode',
    label: 'حالت توسعه‌دهنده',
    on: true,
    experimental: false,
  },
]
