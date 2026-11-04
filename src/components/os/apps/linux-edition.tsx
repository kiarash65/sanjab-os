'use client'

/* «نسخه لینوکس واقعی» — راهنمای نصب SanjabOS روی هستهٔ واقعی لینوکس
   Debian/Ubuntu + Arch + Docker + Kiosk — با اسپانسری سان‌جاب */

import { useState } from 'react'
import {
  Binary,
  Check,
  Container,
  Cpu,
  HardDrive,
  Monitor,
  Package,
  Terminal,
  Zap,
} from 'lucide-react'
import { useOS } from '@/lib/os/store'

const REPO = 'https://github.com/kiarash65/sanjab-os'
const RAW =
  'https://raw.githubusercontent.com/kiarash65/sanjab-os/main/linux-edition'

const QUICK_INSTALL = `curl -fsSL ${RAW}/install.sh | bash`

interface Method {
  id: string
  label: string
  icon: typeof HardDrive
  badge: string
  steps: { title: string; code: string }[]
  note?: string
}

const METHODS: Method[] = [
  {
    id: 'quick',
    label: 'نصب سریع',
    icon: Zap,
    badge: 'پیشنهادی',
    steps: [
      { title: 'یک فرمان — نصب کاربری (systemd user)', code: QUICK_INSTALL },
      {
        title: 'یا با clone دستی',
        code: `git clone ${REPO}.git\ncd sanjab-os\n./linux-edition/install.sh`,
      },
      {
        title: 'نصب سراسری برای همهٔ کاربران (/opt)',
        code: `git clone ${REPO}.git\ncd sanjab-os\nsudo ./linux-edition/install.sh --system`,
      },
    ],
    note: 'نصب‌کننده توزیع را تشخیص می‌دهد (دبین/اوبونتو/آرچ/فدورا/اوپن‌سوزه)، Bun را نصب، پروژه را بیلد و سرویس sanjabos را فعال می‌کند → http://localhost:4310',
  },
  {
    id: 'deb',
    label: 'دبین / اوبونتو',
    icon: Package,
    badge: 'پایهٔ اصلی',
    steps: [
      { title: '۱ — ساخت بستهٔ deb از روی سورس', code: `git clone ${REPO}.git\ncd sanjab-os/linux-edition/packaging\n./build-deb.sh` },
      { title: '۲ — نصب (بیلد و سرویس خودکار)', code: `sudo apt install ./sanjabos_1.0.0_all.deb` },
      { title: '۳ — وضعیت سرویس', code: `systemctl status sanjabos\njournalctl -u sanjabos -f` },
    ],
    note: 'پایهٔ اصلی ما دبین است — این پروژه روی Debian 13 (trixie) توسعه و تست می‌شود. اوبونتو، مین و مبتنی‌ها همین بسته را می‌گیرند.',
  },
  {
    id: 'arch',
    label: 'آرچ لینوکس',
    icon: Binary,
    badge: 'PKGBUILD',
    steps: [
      { title: '۱ — ساخت و نصب پکیج', code: `git clone ${REPO}.git\ncd sanjab-os/linux-edition/arch\nmakepkg -si` },
      { title: '۲ — فعال‌سازی سرویس', code: `sudo systemctl enable --now sanjabos` },
      { title: '۳ — اجرا', code: `sanjabos open` },
    ],
    note: 'آرچیوزرها عاشق این‌اند: پکیج بومی، منیجر pacman، آپدیت با همان makepkg. (کاندید AUR!)',
  },
  {
    id: 'docker',
    label: 'داکر',
    icon: Container,
    badge: 'همه‌جا',
    steps: [
      { title: '۱ — بیلد و اجرای ایمیج', code: `docker build -t sanjabos -f linux-edition/Dockerfile .\ndocker run -d --name sanjabos -p 4310:4310 --restart unless-stopped sanjabos` },
      { title: 'یا با Compose', code: `docker compose -f linux-edition/docker-compose.yml up -d` },
      { title: 'لاگ‌ها', code: `docker logs -f sanjabos` },
    ],
    note: 'ایمیج چندمرحله‌ای Bun + خروجی standalone — سبک و سریع. هستهٔ واقعی لینوکسِ میزبان را قرض می‌گیری!',
  },
  {
    id: 'kiosk',
    label: 'کیوسک',
    icon: Monitor,
    badge: 'جعبهٔ سان‌جاب',
    steps: [
      { title: 'لپ‌تاپ قدیمی را به جعبهٔ سان‌جاب تبدیل کن', code: `sudo ./linux-edition/install.sh --system --kiosk\nsudo reboot` },
      { title: 'اجرای دستی کیوسک', code: `./linux-edition/kiosk.sh` },
      { title: 'autostart بعد از لاگین', code: `./linux-edition/kiosk.sh --install-autostart` },
    ],
    note: 'بعد از ورود، Chromium فول‌اسکرین باز می‌شود — تجربهٔ یک سیستم‌عامل واقعی با هستهٔ واقعی، بدون دسکتاپ دیگر!',
  },
]

const CLI_ROWS: [string, string][] = [
  ['sanjabos start', 'روشن کردن سرویس'],
  ['sanjabos stop', 'خاموش کردن'],
  ['sanjabos restart', 'ری‌استارت'],
  ['sanjabos status', 'وضعیت سرویس'],
  ['sanjabos logs', 'لاگ زنده'],
  ['sanjabos open', 'باز کردن در مرورگر'],
  ['sanjabos kiosk', 'حالت فول‌اسکرین'],
  ['sanjabos update', 'آپدیت + بیلد + ری‌استارت'],
]

function CodeBlock({ code, title }: { code: string; title: string }) {
  const pushToast = useOS((s) => s.pushToast)
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      pushToast({ icon: '📋', title: 'کپی شد!', body: 'برو ترمینال واقعی بچسبونش' })
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* ignore */
    }
  }
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-black/60">
      <div className="flex items-center gap-2 border-b border-white/10 bg-zinc-900/80 px-3 py-1.5">
        <Terminal size={11} className="text-teal-400" aria-hidden />
        <span className="text-[10px] font-bold text-zinc-400">{title}</span>
        <button
          onClick={copy}
          className="mr-auto flex items-center gap-1 rounded-md bg-white/5 px-2 py-0.5 text-[10px] text-zinc-300 transition hover:bg-white/10 active:scale-95"
          aria-label="کپی فرمان"
        >
          {copied ? <Check size={10} className="text-teal-400" /> : null}
          {copied ? 'کپی شد' : 'کپی'}
        </button>
      </div>
      <pre dir="ltr" className="overflow-x-auto p-3 text-left font-mono text-[11px] leading-5 text-teal-200">
        {code}
      </pre>
    </div>
  )
}

export default function LinuxEditionApp() {
  const [active, setActive] = useState('quick')
  const method = METHODS.find((m) => m.id === active)!

  return (
    <div className="flex h-full w-full flex-col bg-zinc-950/60">
      {/* هدر */}
      <div className="border-b border-white/10 bg-gradient-to-l from-[#f7931e]/15 via-transparent to-[#0ea5a0]/15 p-3">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#f7931e] to-[#0ea5a0] text-white shadow-lg">
            <Cpu size={17} />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-black text-zinc-100">
              نسخهٔ لینوکس واقعی <span className="text-[#f7931e]">سان‌جاب‌او‌اس</span>
            </h2>
            <p className="text-[10px] leading-4 text-zinc-400">
              همین WebOS — ولی به‌عنوان سرویس بومی systemd روی هستهٔ واقعی لینوکس
            </p>
          </div>
          <span className="mr-auto hidden shrink-0 items-center gap-1 rounded-full border border-[#f7931e]/40 bg-[#f7931e]/10 px-2.5 py-1 text-[10px] font-bold text-amber-300 sm:flex">
            <HardDrive size={10} aria-hidden /> Debian · Arch · Docker · Kiosk
          </span>
        </div>
      </div>

      {/* بدنه */}
      <div className="os-scroll min-h-0 flex-1 overflow-y-auto p-3">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-3">
          {/* انتخاب روش */}
          <div className="flex flex-wrap gap-1.5">
            {METHODS.map((m) => {
              const isActive = m.id === active
              return (
                <button
                  key={m.id}
                  onClick={() => setActive(m.id)}
                  className={`flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition active:scale-95 ${
                    isActive
                      ? 'border-[#f7931e]/60 bg-[#f7931e]/15 text-[#f7931e]'
                      : 'border-white/10 bg-zinc-900/60 text-zinc-400 hover:border-white/25 hover:bg-zinc-800'
                  }`}
                >
                  <m.icon size={13} aria-hidden />
                  {m.label}
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[8px] font-black ${
                      isActive ? 'bg-[#f7931e]/20 text-amber-300' : 'bg-white/5 text-zinc-500'
                    }`}
                  >
                    {m.badge}
                  </span>
                </button>
              )
            })}
          </div>

          {/* مرحله‌ها */}
          <div className="flex flex-col gap-2.5">
            {method.steps.map((s, i) => (
              <div key={i}>
                <p className="mb-1 flex items-center gap-1.5 text-[11px] font-bold text-zinc-300">
                  <span className="grid size-4 place-items-center rounded-full bg-[#f7931e]/20 text-[9px] font-black text-amber-300">
                    {i + 1}
                  </span>
                  {s.title}
                </p>
                <CodeBlock code={s.code} title={`مرحلهٔ ${i + 1} — ${method.label}`} />
              </div>
            ))}
          </div>

          {method.note && (
            <p className="rounded-xl border border-teal-500/25 bg-teal-500/10 p-2.5 text-[11px] leading-5 text-teal-200">
              💡 {method.note}
            </p>
          )}

          {/* فرمان sanjabos */}
          <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-3">
            <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-zinc-300">
              <Terminal size={13} className="text-[#f7931e]" aria-hidden />
              بعد از نصب — فرمان <code dir="ltr" className="rounded bg-black/50 px-1.5 py-0.5 font-mono text-[10px] text-amber-300">sanjabos</code>
            </h3>
            <div className="grid gap-1 sm:grid-cols-2">
              {CLI_ROWS.map(([cmd, desc]) => (
                <div
                  key={cmd}
                  className="flex items-center gap-2 rounded-lg bg-zinc-950/60 px-2 py-1.5"
                >
                  <code dir="ltr" className="shrink-0 font-mono text-[10px] font-bold text-teal-300">
                    {cmd}
                  </code>
                  <span className="mr-auto truncate text-[10px] text-zinc-500">{desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* امضا */}
          <p className="pb-1 text-center text-[10px] leading-5 text-zinc-600">
            کدهای این بخش در پوشهٔ <code dir="ltr">linux-edition/</code> ریپو هستند —
            {' '}<a href={`${REPO}/tree/main/linux-edition`} target="_blank" rel="noreferrer" className="text-teal-400 underline">مشاهده در گیت‌هاب ↗</a>
            <br />
            با اسپانسری سان‌جاب — sunjob.ir 🐿️
          </p>
        </div>
      </div>
    </div>
  )
}
