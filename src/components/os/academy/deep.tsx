'use client'

/* ------------------------------------------------------------------ */
/* فصل‌های عمیق «آکادمی لینوکس» — بوت، هسته، فایل‌سیستم، شبکه، بش، امنیت */
/* هر فصل انیمیشن تعاملی اختصاصی دارد.                                 */
/* ------------------------------------------------------------------ */

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { BookOpen } from 'lucide-react'
import {
  Check,
  Cpu,
  HardDrive,
  Network,
  Power,
  ShieldCheck,
  SquareTerminal,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SUNJOB_PALETTE } from '@/lib/os/brand'

export interface DeepChapterDef {
  id: string
  title: string
  subtitle: string
  icon: typeof BookOpen
  tint: string
}

export const DEEP_CHAPTERS: DeepChapterDef[] = [
  { id: 'boot', title: 'فرآیند بوت', subtitle: 'از دکمهٔ پاور تا صفحهٔ لاگین، قدم‌به‌قدم', icon: Power, tint: '#f7931e' },
  { id: 'kernel', title: 'هسته از نزدیک', subtitle: 'سیستم‌کال، زمان‌بند و حافظهٔ مجازی', icon: Cpu, tint: '#8b5cf6' },
  { id: 'fsdisk', title: 'فایل‌سیستم و دیسک', subtitle: 'inode ،journal و راز mount', icon: HardDrive, tint: '#0ea5a0' },
  { id: 'net', title: 'شبکه در لینوکس', subtitle: 'سفر یک بسته از اپ تا کابل و برعکس', icon: Network, tint: '#14b8a6' },
  { id: 'shell', title: 'اسکریپت‌نویسی Bash', subtitle: 'اتوماسیون: حلقه، شرط، کرون', icon: SquareTerminal, tint: '#e11d48' },
  { id: 'sec', title: 'امنیت و SSH', subtitle: 'دست‌دادن رمزنگاری‌شده و قانون کمترین دسترسی', icon: ShieldCheck, tint: '#22c55e' },
]

export const DEEP_IDS = new Set(DEEP_CHAPTERS.map((c) => c.id))

const fa = (n: number) => n.toLocaleString('fa-IR')

/* ================================================================
   اجزای کمکی
   ================================================================ */

function DeepChapterHeader({ def, done, onToggleDone }: { def: DeepChapterDef; done: boolean; onToggleDone: () => void }) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ background: `${def.tint}22`, color: def.tint }}>
        <def.icon size={19} />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="text-base font-black text-zinc-50">{def.title}</h2>
        <p className="text-[11px] text-zinc-400">{def.subtitle}</p>
      </div>
      <Button
        size="sm"
        variant={done ? 'secondary' : 'outline'}
        onClick={onToggleDone}
        className={`shrink-0 text-[11px] ${done ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300' : 'border-white/15 text-zinc-300'}`}
      >
        <Check size={13} />
        {done ? 'خوانده شد' : 'خواندم!'}
      </Button>
    </div>
  )
}

function TBox({ lines, tone = 'green' }: { lines: string[]; tone?: 'green' | 'red' }) {
  return (
    <pre
      dir="ltr"
      className={`overflow-x-auto rounded-xl border border-white/10 bg-zinc-950 p-3 font-mono text-[11px] leading-5 ${
        tone === 'red' ? 'text-rose-300' : 'text-emerald-300'
      }`}
    >
      {lines.join('\n')}
    </pre>
  )
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-[#f7931e]/25 bg-[#f7931e]/10 p-3 text-xs leading-5 text-amber-200/90">
      <span aria-hidden className="mt-0.5 text-[#f7931e]">
        💡
      </span>
      <span>{children}</span>
    </div>
  )
}

function H3({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <h3 className="flex items-center gap-2 text-sm font-black text-zinc-100">
      <span className="h-4 w-1 rounded-full" style={{ background: color }} aria-hidden />
      {children}
    </h3>
  )
}

function useStepper(length: number, ms: number) {
  const [step, setStep] = useState(0)
  const ref = useRef(0)
  useEffect(() => {
    const t = setInterval(() => {
      ref.current = (ref.current + 1) % length
      setStep(ref.current)
    }, ms)
    return () => clearInterval(t)
  }, [length, ms])
  return [step, () => setStep((s) => (s + 1) % length)] as const
}

const StepBtn = ({ onClick, label }: { onClick: () => void; label: string }) => (
  <button onClick={onClick} className="shrink-0 rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-bold text-zinc-300 transition hover:bg-white/10 active:scale-95">
    {label}
  </button>
)

/* ================================================================
   انیمیشن ۱: توالی بوت
   ================================================================ */

const BOOT_STAGES = [
  { t: 'BIOS / UEFI', d: 'قطعهٔ روشن‌کنندهٔ سخت‌افزار — POST و انتخاب دیسک بوت', code: 'POST … OK  ·  Boot Device: NVMe0' },
  { t: 'Bootloader (GRUB)', d: 'منویی که کرنل را انتخاب و بارگذاری می‌کند', code: 'GRUB loading /boot/vmlinuz-6.x' },
  { t: 'هسته (Kernel)', d: 'باز شدن هسته: درایورها، حافظه و CPU بیدار می‌شوند', code: 'Linux version 6.x … Booting the kernel.' },
  { t: 'initramfs', d: 'فایل‌سیستم ریشهٔ موقت در RAM تا درایور دیسک واقعی آماده شود', code: 'unpacking initramfs → /sysroot' },
  { t: 'systemd (PID 1)', d: 'اولین پروسه؛ سرویس‌ها را موازی بالا می‌آورد', code: '[  OK  ] Started target: graphical' },
  { t: 'صفحهٔ لاگین', d: 'display manager آماده است — خوش آمدی!', code: 'sanjabos login: _' },
]

function BootAnim() {
  const [step, bump] = useStepper(BOOT_STAGES.length, 1600)
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-950 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[11px] font-black text-zinc-200">توالی بوت — انیمیشن زنده</p>
        <StepBtn onClick={bump} label="قدم بعدی ⏭" />
      </div>
      <div className="space-y-1.5">
        {BOOT_STAGES.map((s, i) => {
          const active = i === step
          const past = i < step
          return (
            <motion.div
              key={s.t}
              animate={{
                borderColor: active ? 'rgba(247,147,30,0.6)' : past ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.08)',
                opacity: active ? 1 : past ? 0.75 : 0.45,
              }}
              className="rounded-xl border bg-zinc-900/70 p-2"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`grid size-5 place-items-center rounded-md text-[9px] font-black ${
                    active ? 'bg-[#f7931e] text-white' : past ? 'bg-emerald-500/80 text-white' : 'bg-white/10 text-zinc-500'
                  }`}
                >
                  {past ? '✓' : fa(i + 1)}
                </span>
                <span className="text-[11px] font-black text-zinc-100">{s.t}</span>
                {active && <span className="mr-auto text-[9px] font-bold text-amber-300">در حال اجرا…</span>}
              </div>
              {active && (
                <motion.div initial={{ opacity: 0, y: -3 }} animate={{ opacity: 1, y: 0 }} className="mt-1 pr-7">
                  <p className="text-[10.5px] leading-4 text-zinc-400">{s.d}</p>
                  <p dir="ltr" className="mt-1 rounded-md bg-black/60 px-2 py-1 font-mono text-[10px] text-emerald-300">
                    {s.code}
                  </p>
                </motion.div>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

/* ================================================================
   انیمیشن ۲: سفر سیستم‌کال
   ================================================================ */

const SYSCALL_NODES = ['برنامهٔ تو', 'کتابخانه (libc)', 'دستور syscall', 'هستهٔ لینوکس', 'سخت‌افزار']

function SyscallAnim() {
  const [step, bump] = useStepper(SYSCALL_NODES.length, 1100)
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-950 p-3">
      <p className="mb-2 text-[11px] font-black text-zinc-200">
        مثال: <code dir="ltr" className="font-mono text-emerald-300">open(&quot;notes.txt&quot;)</code> — سفر به اعماق
      </p>
      <div className="flex items-center gap-1">
        {SYSCALL_NODES.map((n, i) => (
          <div key={n} className="flex min-w-0 flex-1 items-center gap-1">
            <motion.div
              animate={{
                scale: i === step ? 1.06 : 1,
                backgroundColor: i === step ? 'rgba(139,92,246,0.25)' : i < step ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.04)',
              }}
              className="flex-1 rounded-lg border border-white/10 p-2 text-center text-[9.5px] font-bold leading-3 text-zinc-200"
            >
              {n}
            </motion.div>
            {i < SYSCALL_NODES.length - 1 && (
              <motion.span animate={{ color: i === step ? '#8b5cf6' : '#3f3f46' }} className="text-[10px]" aria-hidden>
                ←
              </motion.span>
            )}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-[10px] leading-4 text-zinc-500">
          برنامه مستقیماً با سخت‌افزار حرف نمی‌زند؛ همیشه از دروازهٔ رسمی هسته (سیستم‌کال) رد می‌شود — یعنی امنیت.
        </p>
        <StepBtn onClick={bump} label="بفرست ⚡" />
      </div>
    </div>
  )
}

/* ================================================================
   انیمیشن ۳: زمان‌بند Round-Robin
   ================================================================ */

function SchedulerAnim() {
  const [step, bump] = useStepper(3, 900)
  const procs = [
    { n: 'مرورگر', c: '#f7931e' },
    { n: 'موزیک', c: '#8b5cf6' },
    { n: 'کامپایلر', c: '#0ea5a0' },
  ]
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-950 p-3">
      <p className="mb-2 text-[11px] font-black text-zinc-200">زمان‌بند Round-Robin — هرکدام «کوانتوم» می‌گیرند، هیچ‌کس گرسنه نمی‌ماند</p>
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <div className="space-y-1.5">
          {procs.map((p, i) => (
            <div key={p.n} className="flex items-center gap-2">
              <span className="w-14 shrink-0 text-[10px] font-bold text-zinc-300">{p.n}</span>
              <div className="h-4 flex-1 overflow-hidden rounded-full bg-white/5">
                <motion.div
                  animate={{ width: i === step ? '100%' : '0%' }}
                  transition={{ duration: i === step ? 0.85 : 0.25, ease: 'linear' }}
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${p.c}66, ${p.c})` }}
                />
              </div>
              <span className="w-12 shrink-0 text-[9px] font-black" style={{ color: i === step ? p.c : '#71717a' }}>
                {i === step ? 'روی CPU' : 'منتظر'}
              </span>
            </div>
          ))}
        </div>
        <div className="flex w-16 flex-col items-center justify-center rounded-xl border border-white/10 bg-black/40">
          <Cpu size={16} className="mb-1 text-zinc-400" aria-hidden />
          <motion.span
            key={step}
            initial={{ scale: 1.4 }}
            animate={{ scale: 1 }}
            className="text-[9px] font-black"
            style={{ color: procs[step].c }}
          >
            {procs[step].n}
          </motion.span>
        </div>
      </div>
      <StepBtn onClick={bump} label="کوانتوم بعدی ⏱" />
    </div>
  )
}

/* ================================================================
   انیمیشن ۴: حافظهٔ مجازی و جدول صفحه‌ها
   ================================================================ */

function PageTableAnim() {
  const [step, bump] = useStepper(3, 1200)
  const pairs = [
    { va: '0x1000', pa: 'RAM 0x7f20' },
    { va: '0x2000', pa: 'RAM 0x3a10' },
    { va: '0x3000', pa: 'Disk (swap!)' },
  ]
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-950 p-3">
      <p className="mb-2 text-[11px] font-black text-zinc-200">حافظهٔ مجازی: هر پروسه فکر می‌کند کل رم مال اوست!</p>
      <div className="grid grid-cols-3 items-center gap-2">
        <div className="space-y-1">
          {pairs.map((p, i) => (
            <motion.div
              key={p.va}
              animate={{ borderColor: i === step ? '#8b5cf6' : 'rgba(255,255,255,0.08)', opacity: i === step ? 1 : 0.5 }}
              className="rounded-lg border bg-zinc-900/70 p-1.5 text-center font-mono text-[9.5px] text-zinc-300"
              dir="ltr"
            >
              VA {p.va}
            </motion.div>
          ))}
          <p className="pt-0.5 text-center text-[8.5px] text-zinc-600">آدرس مجازی</p>
        </div>
        <div className="flex flex-col items-center">
          <motion.div
            animate={{ boxShadow: ['0 0 0px #8b5cf6', '0 0 14px #8b5cf6', '0 0 0px #8b5cf6'] }}
            transition={{ repeat: Infinity, duration: 1.6 }}
            className="rounded-xl border border-violet-500/60 bg-violet-500/15 p-2 text-center"
          >
            <p className="text-[9.5px] font-black text-violet-300">جدول صفحه‌ها</p>
            <p className="text-[8px] text-zinc-400">MMU + CR3</p>
          </motion.div>
          <p className="mt-1 text-[8.5px] text-zinc-600">ترجمه</p>
        </div>
        <div className="space-y-1">
          {pairs.map((p, i) => (
            <motion.div
              key={p.pa}
              animate={{
                borderColor: i === step ? (p.pa.includes('Disk') ? '#f43f5e' : '#34d399') : 'rgba(255,255,255,0.08)',
                opacity: i === step ? 1 : 0.5,
              }}
              className="rounded-lg border bg-zinc-900/70 p-1.5 text-center font-mono text-[9.5px] text-zinc-300"
              dir="ltr"
            >
              {p.pa}
            </motion.div>
          ))}
          <p className="pt-0.5 text-center text-[8.5px] text-zinc-600">آدرس فیزیکی</p>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-[10px] leading-4 text-zinc-500">
          وقتی آدرسی به swap برود یعنی صفحه روی دیسک است — سرعت می‌افتد ولی سیستم زنده می‌ماند!
        </p>
        <StepBtn onClick={bump} label="آدرس بعدی 🎲" />
      </div>
    </div>
  )
}

/* ================================================================
   انیمیشن ۵: inode و بلوک‌های داده
   ================================================================ */

function InodeAnim() {
  const [step, bump] = useStepper(3, 1300)
  const rows = [
    { name: 'readme.txt', inode: '۱۲۴۰۵', blocks: '۴۲، ۴۳' },
    { name: 'عکس.png', inode: '۱۲۴۰۶', blocks: '۵۱' },
    { name: 'فیلم.mkv', inode: '۱۲۴۰۹', blocks: '۷۰ تا ۸۲' },
  ]
  const cur = rows[step]
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-950 p-3">
      <p className="mb-2 text-[11px] font-black text-zinc-200">راز فایل‌سیستم: اسم‌ها فقط «برچسب» اند؛ واقعیت در inode است</p>
      <div className="grid grid-cols-3 gap-2">
        {[
          { t: 'نام فایل', v: cur.name, c: '#f7931e' },
          { t: 'شمارهٔ inode', v: cur.inode, c: '#8b5cf6' },
          { t: 'بلوک‌های داده', v: cur.blocks, c: '#0ea5a0' },
        ].map((x, i) => (
          <motion.div
            key={x.t}
            animate={{ scale: i === step ? 1.04 : 1, borderColor: i === step ? x.c : 'rgba(255,255,255,0.08)' }}
            className="rounded-xl border bg-zinc-900/70 p-2 text-center"
          >
            <p className="text-[9px] text-zinc-500">{x.t}</p>
            <p className="mt-0.5 truncate text-[11px] font-black" style={{ color: x.c }}>
              {x.v}
            </p>
          </motion.div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-[10px] leading-4 text-zinc-500">
          یعنی «hard link» دو اسم برای یک inode است — پاک کردن یکی، داده را نمی‌کشد تا آخری برود!
        </p>
        <StepBtn onClick={bump} label="فایل بعدی 📄" />
      </div>
    </div>
  )
}

/* ================================================================
   انیمیشن ۶: سفر بستهٔ شبکه
   ================================================================ */

const NET_LAYERS = ['اپلیکیشن (curl)', 'TCP (پورت)', 'IP (آدرس)', 'درایور کارت شبکه', 'کابل / وای‌فای']

function PacketAnim() {
  const [step, bump] = useStepper(NET_LAYERS.length * 2 - 1, 950)
  const down = step < NET_LAYERS.length
  const idx = down ? step : NET_LAYERS.length * 2 - 2 - step
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-950 p-3">
      <p className="mb-2 text-[11px] font-black text-zinc-200">
        <code dir="ltr" className="font-mono text-emerald-300">curl sunjob.ir</code> — بسته پایین می‌رود تا روی سیم، بعد برمی‌گردد
      </p>
      <div className="space-y-1">
        {NET_LAYERS.map((l, i) => {
          const active = i === idx
          return (
            <motion.div
              key={l}
              animate={{
                borderColor: active ? (down ? '#14b8a6' : '#f7931e') : 'rgba(255,255,255,0.08)',
                x: active ? (down ? -6 : 6) : 0,
              }}
              className="rounded-lg border bg-zinc-900/70 px-2 py-1.5 text-[10px] font-bold text-zinc-200"
            >
              <span aria-hidden className="inline-block w-4">
                {down ? '⬇' : i === idx ? '⬆' : ''}
              </span>
              <span dir="ltr" className="font-mono text-[9px] text-zinc-500">
                L{NET_LAYERS.length - i}
              </span>{' '}
              {l}
            </motion.div>
          )
        })}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-[10px] leading-4 text-zinc-500">
          هر لایه پاکت را با «پاکت‌نامهٔ» خودش می‌پوشاند (Encapsulation) — مثل نامهٔ پستی با آدرس و تمبر!
        </p>
        <StepBtn onClick={bump} label="ارسال 📨" />
      </div>
    </div>
  )
}

/* ================================================================
   انیمیشن ۷: فایروال netfilter
   ================================================================ */

function NetfilterAnim() {
  const [local, setLocal] = useState(false)
  const [step, bump] = useStepper(3, 1000)
  const chain = local ? ['OUTPUT', 'POSTROUTING'] : ['PREROUTING', 'INPUT']
  const reached = Math.min(step, chain.length)
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-950 p-3">
      <p className="mb-2 text-[11px] font-black text-zinc-200">سفر بسته در فیلتر بسته‌های هسته (netfilter)</p>
      <div className="mb-2 flex gap-1">
        <button
          onClick={() => {
            setLocal(false)
            bump()
          }}
          className={`rounded-md px-2 py-1 text-[10px] font-bold transition ${!local ? 'bg-[#14b8a6] text-white' : 'bg-white/5 text-zinc-400'}`}
        >
          از اینترنت می‌آید
        </button>
        <button
          onClick={() => {
            setLocal(true)
            bump()
          }}
          className={`rounded-md px-2 py-1 text-[10px] font-bold transition ${local ? 'bg-[#14b8a6] text-white' : 'bg-white/5 text-zinc-400'}`}
        >
          از برنامهٔ محلی
        </button>
      </div>
      <div className="flex items-center gap-1">
        {chain.map((c, i) => (
          <motion.div
            key={c}
            animate={{ borderColor: i < reached ? '#14b8a6' : 'rgba(255,255,255,0.08)', opacity: i < reached ? 1 : 0.5 }}
            className="flex-1 rounded-lg border bg-zinc-900/70 p-2 text-center font-mono text-[10px] font-black text-zinc-200"
            dir="ltr"
          >
            {c}
          </motion.div>
        ))}
        <motion.div
          animate={{ backgroundColor: step >= chain.length ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.04)' }}
          className="rounded-lg border border-white/10 px-2 py-2 text-[10px] font-black text-emerald-300"
        >
          {step >= chain.length ? 'ACCEPT ✅' : 'در بررسی…'}
        </motion.div>
      </div>
      <p className="mt-2 text-[10px] leading-4 text-zinc-500">
        iptables/nftables همان زبان نوشتن قواعد این گیت‌هاست: ACCEPT ،DROP یا REJECT — دیوار بلند و صبر!
      </p>
    </div>
  )
}

/* ================================================================
   انیمیشن ۸: دست‌دادن SSH
   ================================================================ */

const SSH_STEPS = [
  { t: 'اتصال TCP', d: 'پورت ۲۲ باز شد — سلام و علیک اولیه', l: 'tcp connect :22' },
  { t: 'تبادل کلید (DH)', d: 'هر دو یک رمز مشترک می‌سازند بدون اینکه روی سیم فرستاده‌اش کنند!', l: 'kex: curve25519-sha256' },
  { t: 'بررسی کلید میزبان', d: '«این سرور همانی است که می‌شناسم؟» — همان yes معروف اولین اتصال', l: 'host key fingerprint OK' },
  { t: 'احراز هویت', d: 'کلید عمومی تو (یا رمز) چک می‌شود', l: 'auth: publickey "id_ed25519"' },
  { t: 'کانال امن', d: 'همه‌چیز رمزنگاری‌شده — ترمینال تو روی سرور!', l: 'session opened' },
]

function SshAnim() {
  const [step, bump] = useStepper(SSH_STEPS.length, 1500)
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-950 p-3">
      <div className="mb-2 grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-white/10 bg-zinc-900/70 p-2 text-center">
          <p className="text-[10px] font-black text-teal-300">لپ‌تاپ تو (client)</p>
          <p dir="ltr" className="text-[8.5px] text-zinc-500">ssh pengo@server</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-zinc-900/70 p-2 text-center">
          <p className="text-[10px] font-black text-amber-300">سرور (sshd)</p>
          <p dir="ltr" className="text-[8.5px] text-zinc-500">port 22, OpenSSH</p>
        </div>
      </div>
      <div className="space-y-1">
        {SSH_STEPS.map((s, i) => {
          const active = i === step
          const past = i < step
          return (
            <motion.div
              key={s.t}
              animate={{
                borderColor: active ? '#22c55e' : past ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.08)',
                opacity: active ? 1 : past ? 0.7 : 0.4,
              }}
              className="rounded-lg border bg-zinc-900/70 p-2"
            >
              <p className="text-[10.5px] font-black text-zinc-100">
                {past ? '✓ ' : ''}
                {fa(i + 1)}. {s.t}
              </p>
              {active && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-0.5 text-[9.5px] leading-4 text-zinc-400">
                  {s.d} — <code dir="ltr" className="font-mono text-emerald-300">{s.l}</code>
                </motion.p>
              )}
            </motion.div>
          )
        })}
      </div>
      <StepBtn onClick={bump} label="مرحلهٔ بعد 🔐" />
    </div>
  )
}

/* ================================================================
   انیمیشن ۹: کرون — ساعت کارها
   ================================================================ */

function CronAnim() {
  const [tick, bump] = useStepper(4, 1200)
  const jobs = [
    { expr: '0 9 * * *', what: 'گزارش صبح' },
    { expr: '*/15 * * * *', what: 'بکاپ سریع' },
    { expr: '0 3 * * 0', what: 'آپدیت یکشنبه‌ها' },
    { expr: '30 22 * * *', what: 'یادآوری خواب' },
  ]
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-950 p-3">
      <p className="mb-2 text-[11px] font-black text-zinc-200">crontab — پادشاه اتوماسیون (۵ فیلد: دقیقه ساعت روز ماه روز-هفته)</p>
      <div className="flex items-center gap-3">
        <div className="relative grid size-16 shrink-0 place-items-center rounded-full border-2 border-white/10">
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: tick === 0 ? 1.1 : 3, ease: 'linear' }}
            className="absolute h-6 w-0.5 origin-bottom rounded-full bg-[#f7931e]"
            style={{ bottom: '50%' }}
            aria-hidden
          />
          <span className="text-[8px] font-black text-zinc-500">cron</span>
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          {jobs.map((j, i) => (
            <motion.div
              key={j.expr}
              animate={{ opacity: i === tick ? 1 : 0.55, borderColor: i === tick ? '#f7931e' : 'rgba(255,255,255,0.08)' }}
              className="flex items-center gap-2 rounded-lg border bg-zinc-900/70 px-2 py-1"
            >
              <code dir="ltr" className="shrink-0 font-mono text-[9.5px] text-amber-300">
                {j.expr}
              </code>
              <span className="truncate text-[10px] font-bold text-zinc-300">{j.what}</span>
              {i === tick && <span className="mr-auto text-[9px] font-black text-amber-300">اجرا شد! ▶</span>}
            </motion.div>
          ))}
        </div>
      </div>
      <StepBtn onClick={bump} label="زمان بعدی ⏰" />
    </div>
  )
}

/* ================================================================
   انیمیشن ۱۰: LVM — لایه‌های دیسک
   ================================================================ */

function LvmAnim() {
  const layers = [
    { t: 'فایل‌سیستم (ext4)', c: '#f7931e', d: 'جایی که فایل‌ها زندگی می‌کنند' },
    { t: 'Logical Volume (lv-data)', c: '#8b5cf6', d: 'مثل پارتیشن انعطاف‌پذیر' },
    { t: 'Volume Group (vg0)', c: '#0ea5a0', d: 'استخری از چند دیسک' },
    { t: 'دیسک‌های فیزیکی sda + sdb', c: '#71717a', d: 'فلز واقعی!' },
  ]
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-950 p-3">
      <p className="mb-2 text-[11px] font-black text-zinc-200">LVM — آسانسور فضای دیسک: بزرگ کن بدون دردسر</p>
      <div className="space-y-1">
        {layers.map((l, i) => (
          <motion.div
            key={l.t}
            initial={{ opacity: 0, x: 10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="rounded-lg border border-white/10 bg-zinc-900/70 p-2"
            style={{ borderRightWidth: 3, borderRightColor: l.c }}
          >
            <div className="flex items-center justify-between gap-2">
              <span dir="ltr" className="text-[10.5px] font-black text-zinc-100">
                {l.t}
              </span>
              <span className="text-[9px] text-zinc-500">{l.d}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

/* ================================================================
   محتوای فصل‌ها
   ================================================================ */

function BootChapter() {
  return (
    <div className="space-y-4 text-xs leading-6 text-zinc-300">
      <p>
        وقتی دکمهٔ پاور را می‌زنی، تا لحظه‌ای که لاگین می‌کنی، لینوکس یک <b className="text-zinc-100">زنجیرهٔ دقیق</b> را اجرا می‌کند. هر حلقهٔ این
        زنجیره یک راز دارد — با انیمیشن زیر قدم‌به‌قدم ببین:
      </p>
      <BootAnim />
      <H3 color="#f7931e">چرا initramfs لازم است؟</H3>
      <p>
        هسته برای خواندن دیسک واقعی به <b className="text-zinc-100">درایور</b> نیاز دارد، و درایور گاهی داخل دیسک است — دوراهی! initramfs یک دنیای
        کوچک در RAM است که این گره را باز می‌کند: اول درایورها را از خودش بالا می‌آورد، بعد دیسک واقعی را mount می‌کند و تحویل systemd می‌دهد.
      </p>
      <TBox
        lines={['$ dmesg | head -20', '[    0.000000] Linux version 6.12.4 (build@sanjab)', '[    0.412001] initramfs: unpacking…', '[    1.204551] EXT4-fs: mounted /dev/sda3 as root']}
      />
      <H3 color="#f7931e">systemd یعنی چه؟</H3>
      <p>
        PID 1 همیشه «پایهٔ همه‌چیز» است. اگر بمیرد، کرنل panic می‌کند! systemd پروسه‌ها را <b className="text-zinc-100">موازی</b> بالا می‌آورد (به همین
        دلیل بوت مدرن سریع است) و با فایل‌های <code dir="ltr" className="font-mono text-emerald-300">.service</code> مدیریتشان می‌کند.
      </p>
      <Tip>
        می‌خواهی این توالی را واقعی ببینی؟ اپ «بوت کرنل واقعی» را باز کن — Alpine را با v86 بوت می‌کند و همهٔ این مراحل را در خروجی dmesg می‌بینی!
      </Tip>
    </div>
  )
}

function KernelChapter() {
  return (
    <div className="space-y-4 text-xs leading-6 text-zinc-300">
      <p>
        هسته سه نقش دارد: <b className="text-zinc-100">داور زمان CPU</b> (زمان‌بندی)، <b className="text-zinc-100">نگهبان حافظه</b> و
        <b className="text-zinc-100">فروشندهٔ خدمات</b> به برنامه‌ها (سیستم‌کال). بیا از نزدیک:
      </p>
      <SyscallAnim />
      <H3 color="#8b5cf6">مدل monolithic یعنی چه؟</H3>
      <p>
        لینوکس <b className="text-zinc-100">مونولیتیک</b> است: درایورها و سیستم‌فایل‌ها داخل خود هسته اجرا می‌شوند (سرعت بالا!) ولی با
        <b className="text-zinc-100">ماژول‌ها</b> می‌توان در حین کار قطعه اضافه/حذف کرد:
      </p>
      <TBox lines={['$ lsmod | head -5', '$ sudo modprobe btusb      # اتصال ماژول بلوتوث', '$ sudo rmmod btusb         # جدا کردن']} />
      <SchedulerAnim />
      <PageTableAnim />
      <H3 color="#8b5cf6">کانتینر = چرخش با نام‌فضاها</H3>
      <p>
        Docker چیزی «جادویی» ندارد: <b className="text-zinc-100">namespace</b> می‌گوید پروسه چه چیزی ببیند (شبکه و درخت پروسه‌های خودش) و
        <b className="text-zinc-100">cgroup</b> می‌گوید چقدر رم و CPU بخورد. یعنی کانتینر = پروسهٔ محدودشده با مالکیت جدا — کرنل لینوکس خودش ستارهٔ اصلی
        است.
      </p>
      <TBox lines={['$ unshare --pid --fork --mount-proc bash', '# در این پوسته، PID خودت = 1 — دنیای جدا!', '$ ps aux']} />
    </div>
  )
}

function FsChapter() {
  return (
    <div className="space-y-4 text-xs leading-6 text-zinc-300">
      <p>
        در لینوکس همه‌چیز «فایل» است — از متن‌ها تا دیسک، کارت صدا و حتی اطلاعات پروسه‌ها (
        <code dir="ltr" className="font-mono text-emerald-300">/proc</code>). این ایدهٔ جسورانه، ابزارها را ساده و قدرتمند می‌کند.
      </p>
      <InodeAnim />
      <H3 color="#0ea5a0">journaling یعنی؟</H3>
      <p>
        ext4 قبل از نوشتن واقعی، «قصد» نوشتن را در یک دفتر (journal) ثبت می‌کند. اگر برق قطع شد، بعد از بوت فقط دفتر مرور می‌شود — به همین دلیل{' '}
        <code dir="ltr" className="font-mono text-emerald-300">fsck</code> مدرن در چند ثانیه تمام می‌شود.
      </p>
      <H3 color="#0ea5a0">مقایسهٔ بزرگ</H3>
      <div className="overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-right text-[10.5px]">
          <thead className="bg-zinc-800/80 text-zinc-300">
            <tr>
              <th className="p-2">فایل‌سیستم</th>
              <th className="p-2">نقطهٔ قوت</th>
              <th className="p-2">کجا استفاده شود</th>
            </tr>
          </thead>
          <tbody className="text-zinc-300">
            {[
              ['ext4', 'پایداری اثبات‌شده، همه‌کاره', 'پیش‌فرض خوب برای همه'],
              ['XFS', 'عالی برای فایل‌های بزرگ', 'سرورهای رسانه و دیتابیس'],
              ['Btrfs', 'اسنپ‌شات و فشرده‌سازی', 'دسکتاپ‌های مدرن، NAS'],
              ['ZFS', 'صحت داده افسانه‌ای', 'استوریج سرورها (RAM بیشتر می‌خواهد)'],
              ['FAT32/exFAT', 'سازگاری همه‌جا', 'فلش‌ها و کارت‌های حافظه'],
            ].map((r) => (
              <tr key={r[0]} className="border-t border-white/5">
                <td dir="ltr" className="p-2 text-right font-mono font-black text-teal-300">
                  {r[0]}
                </td>
                <td className="p-2">{r[1]}</td>
                <td className="p-2 text-zinc-500">{r[2]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <H3 color="#0ea5a0">mount یعنی دوختن درخت‌ها به هم</H3>
      <p>
        کل سیستم یک درخت است از <code dir="ltr" className="font-mono text-emerald-300">/</code>. هر دیسک/فلش در یک نقطه «دوخته» می‌شود و محتوایش همان‌جا
        دیده می‌شود:
      </p>
      <TBox lines={['$ lsblk', '$ sudo mount /dev/sdb1 /mnt/flash', '$ ls /mnt/flash', '$ sudo umount /mnt/flash']} />
      <LvmAnim />
    </div>
  )
}

function NetChapter() {
  return (
    <div className="space-y-4 text-xs leading-6 text-zinc-300">
      <p>
        شبکه لینوکس از <b className="text-zinc-100">لایه‌های مشخص</b> ساخته شده — ابزار هر لایه جدا است و همین، دیباگ را آسان می‌کند:
      </p>
      <PacketAnim />
      <H3 color="#14b8a6">جعبه‌ابزار واقعی</H3>
      <TBox
        lines={[
          '$ ip a                      # کارت‌ها و آدرس‌ها',
          '$ ip route                  # مسیر پیش‌فرض کدام دروازه؟',
          '$ ping -c3 8.8.8.8          # راه باز است؟ (لایه IP)',
          '$ ping -c3 google.com       # اگر IP جواب داد ولی اسم نه → مشکل DNS!',
          '$ ss -tulpn                 # چه برنامه‌ای چه پورتی را گوش می‌دهد؟ (sudo)',
          '$ curl -I https://sunjob.ir # هدرهای HTTP را ببین',
        ]}
      />
      <H3 color="#14b8a6">پورت‌ها دروازه‌های شماره‌دار</H3>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        {[
          ['22', 'SSH'],
          ['80', 'HTTP'],
          ['443', 'HTTPS'],
          ['53', 'DNS'],
        ].map(([p, n]) => (
          <div key={p} className="rounded-xl border border-white/10 bg-zinc-900/60 p-2 text-center">
            <p dir="ltr" className="font-mono text-sm font-black text-teal-300">
              {p}
            </p>
            <p className="text-[9.5px] text-zinc-500">{n}</p>
          </div>
        ))}
      </div>
      <NetfilterAnim />
      <Tip>
        قانون طلایی دیباگ شبکه: اول <code dir="ltr" className="font-mono">ping</code> (اتصال)، بعد <code dir="ltr" className="font-mono">ip route</code>{' '}
        (مسیر)، بعد DNS، بعد فایروال. طبقه‌بندی مشکل = نصف حل آن.
      </Tip>
    </div>
  )
}

function ShellChapter() {
  const snippets = [
    {
      t: 'اولین اسکریپت',
      code: '#!/bin/bash\necho "سلام $USER — خوش آمدی به اتوماسیون!"\ndate',
      note: 'خط اول (shebang) می‌گوید با کدام مفسر اجرا شود. بعد chmod +x و اجرا با ./اسکریپت.sh',
    },
    {
      t: 'حلقه روی فایل‌ها',
      code: 'for f in *.txt; do\n  echo "تبدیل: $f"\n  mv "$f" "backup-$f"\ndone',
      note: '"$f" همیشه داخل گیومه — فایل‌هایی با فاصله به تو لبخند می‌زنند!',
    },
    {
      t: 'شرط و پارامتر',
      code: 'if [ -d "/mnt/flash" ]; then\n  echo "فلش وصل است"\nelse\n  echo "فلش نیست — اول وصلش کن"\nfi\necho "اولین آرگومان: $1"',
      note: '$1، $2 پارامترهای اسکریپت‌اند؛ $0 اسم خودش. -d یعنی «دایرکتوری هست؟»',
    },
    {
      t: 'پایپ: قدرت ترکیب',
      code: 'cat access.log | grep "404" | wc -l\n# تعداد خطاهای ۴۰۴ امروز!',
      note: 'فلسفهٔ یونیکس: هر ابزار یک کار، ولی ترکیبشان بی‌نهایت',
    },
  ]
  return (
    <div className="space-y-4 text-xs leading-6 text-zinc-300">
      <p>
        بش فقط «محل تایپ» نیست؛ یک <b className="text-zinc-100">زبان کامل برنامه‌نویسی</b> است. هر کد تکراری را یک بار بنویس و بعداً با یک دستور صداش کن:
      </p>
      <div className="space-y-2.5">
        {snippets.map((s) => (
          <div key={s.t} className="rounded-2xl border border-white/10 bg-zinc-900/60 p-3">
            <p className="mb-1.5 text-[11px] font-black text-zinc-100">{s.t}</p>
            <TBox lines={s.code.split('\n')} />
            <p className="mt-1.5 text-[10px] leading-4 text-zinc-500">{s.note}</p>
          </div>
        ))}
      </div>
      <CronAnim />
      <H3 color="#e11d48">متغیرهای محیطی — تنظیمات فراگیر</H3>
      <TBox
        lines={[
          '$ echo $HOME          # خانهٔ تو',
          '$ export EDITOR=vim   # همهٔ برنامه‌ها ببینند',
          '$ PATH=$PATH:$HOME/bin  # پوشهٔ اسکریپت‌هایت به مسیر جستجو اضافه شود',
        ]}
      />
      <Tip>اسکریپت‌های bash را در «ترمینال آموزشی» همین سیستم امتحان کن — ابزارهای آن پایپ واقعی را هم تقلید می‌کنند!</Tip>
    </div>
  )
}

function SecChapter() {
  return (
    <div className="space-y-4 text-xs leading-6 text-zinc-300">
      <p>
        امنیت لینوکس روی سه ستون است: <b className="text-zinc-100">دسترسی‌ها</b> (فصل ۶)، <b className="text-zinc-100">جداسازی</b> (کاربر/گروه/کانتینر) و{' '}
        <b className="text-zinc-100">رمزنگاری</b> (SSH و به‌روزرسانی‌ها).
      </p>
      <SshAnim />
      <H3 color="#22c55e">کلید SSH — رمز عبوری که تایپ نمی‌شود</H3>
      <TBox
        lines={[
          '$ ssh-keygen -t ed25519 -C "pengo@sanjab"',
          '$ ssh-copy-id pengo@server.ir     # کلید عمومی را بفرست',
          '$ ssh pengo@server.ir             # بدون رمز — جادویی!',
        ]}
      />
      <p className="text-[10.5px] leading-5 text-zinc-400">
        کلید <b>خصوصی</b> فقط پیش توست (هرگز جایی نفرست!)، کلید <b>عمومی</b> روی سرور می‌نشیند. ریاضیات رد و بدل می‌شود، نه رمز!
      </p>
      <H3 color="#22c55e">چک‌لیست سرور امن</H3>
      <div className="space-y-1.5">
        {[
          'به‌روزرسانی خودکار امنیتی: sudo apt install unattended-upgrades',
          'رمز عبور root برای SSH را ببند: PermitRootLogin no',
          'فایروال را روشن کن: sudo ufw enable',
          'کاربر هر برنامه = کمترین دسترسی لازم (نه همیشه root!)',
          'لاگ‌ها را نگاه کن: sudo journalctl -u ssh',
        ].map((r) => (
          <div key={r} className="flex items-start gap-2 rounded-xl border border-white/10 bg-zinc-900/60 p-2.5">
            <ShieldCheck size={14} className="mt-0.5 shrink-0 text-emerald-400" aria-hidden />
            <code dir="ltr" className="font-mono text-[10px] leading-4 text-emerald-300">
              {r}
            </code>
          </div>
        ))}
      </div>
      <Tip>«امنیت یک فرآیند است نه یک محصول»: به‌روزرسانی منظم + بکاپ + کمترین دسترسی، ۹۰٪ حملات را بی‌اثر می‌کند. با اسپانسری سان‌جاب!</Tip>
    </div>
  )
}

/* ================================================================
   نمای عمومی
   ================================================================ */

export function DeepChapterView({ id, done, onToggleDone }: { id: string; done: boolean; onToggleDone: () => void }) {
  const def = DEEP_CHAPTERS.find((c) => c.id === id)
  if (!def) return null
  return (
    <div className="space-y-4">
      <DeepChapterHeader def={def} done={done} onToggleDone={onToggleDone} />
      {id === 'boot' && <BootChapter />}
      {id === 'kernel' && <KernelChapter />}
      {id === 'fsdisk' && <FsChapter />}
      {id === 'net' && <NetChapter />}
      {id === 'shell' && <ShellChapter />}
      {id === 'sec' && <SecChapter />}
    </div>
  )
}
