'use client'

/* «لینوکس واقعی»، بوت کرنل واقعی Linux 6.12 (Alpine) داخل مرورگر با شبیه‌ساز v86
   ── bzImage و initramfs واقعی Alpine 3.21.9 (netboot)
   ── ISO به‌عنوان cdrom وصل می‌شود → modloop + مخزن apk آفلاین در دسترس است
   ── ترمینال سریال سفارشی با پارسر ANSI (رنگ، \r، \b، پاک‌کردن خط)
   هیچ‌چیز شبیه‌سازی‌شده نیست، dmesg، busybox و apk همه واقعی‌اند. */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type UIEvent,
} from 'react'
import {
  AlertTriangle,
  ArchiveRestore,
  CircleStop,
  Cpu,
  Eraser,
  Loader2,
  Monitor,
  Play,
  RotateCcw,
  Save,
  Send,
  Wifi,
  Zap,
} from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { useOS } from '@/lib/os/store'
import { idbGet, idbPut } from '@/lib/os/idb'

declare global {
  interface Window {
    V86?: new (opts: Record<string, unknown>) => V86Instance
  }
}

interface V86Instance {
  add_listener: (event: string, fn: (arg?: unknown) => void) => void
  serial0_send: (data: string) => void
  destroy?: () => void
  stop?: () => void
  save_state?: () => Promise<ArrayBuffer>
  restore_state?: (buf: ArrayBuffer) => Promise<void>
}

const VM_STATE_KEY = 'v86-alpine-state-v1'

type Phase = 'idle' | 'starting' | 'running' | 'error'

/* ─── رنگ‌های ANSI (پس‌زمینه تیره) ─── */
const FG_DEFAULT = '#d4d4d8'
const FG = ['#71717a', '#f87171', '#4ade80', '#facc15', '#60a5fa', '#e879f9', '#22d3ee', '#e5e5e5']
const FG_BRIGHT = ['#a1a1aa', '#fca5a5', '#86efac', '#fde047', '#93c5fd', '#f0abfc', '#67e8f9', '#ffffff']

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

interface Seg {
  t: string
  c?: string
}

/* ─── مینی VT100: مدل خط/ستون با پشتیبانی رنگ و پاک‌کردن ─── */
class MiniVT {
  private lines: Seg[][] = [[]]
  private row = 0
  private col = 0
  private color: string | undefined
  private escMode: '' | 'esc' | 'csi' = ''
  private params = ''
  private readonly maxCols = 400
  private readonly maxLines = 700

  write(chunk: string): void {
    for (const ch of chunk) this.put(ch)
  }

  private put(ch: string): void {
    if (this.escMode) {
      this.putEsc(ch)
      return
    }
    if (ch === '\x1b') {
      this.escMode = 'esc'
      this.params = ''
      return
    }
    if (ch === '\n') {
      this.newline()
      return
    }
    if (ch === '\r') {
      this.col = 0
      return
    }
    if (ch === '\b') {
      if (this.col > 0) this.col--
      return
    }
    if (ch === '\t') {
      const pad = 8 - (this.col % 8)
      for (let i = 0; i < pad; i++) this.ins(' ')
      return
    }
    if (ch < ' ') return
    this.ins(ch)
  }

  private putEsc(ch: string): void {
    if (this.escMode === 'esc') {
      if (ch === '[') {
        this.escMode = 'csi'
        this.params = ''
      } else {
        this.escMode = '' // سایر دنباله‌ها نادیده
      }
      return
    }
    if (/[0-9;]/.test(ch)) {
      this.params += ch
      return
    }
    this.escMode = ''
    const nums = this.params
      .split(';')
      .map((x) => (x === '' ? NaN : parseInt(x, 10)))
      .map((x) => (Number.isNaN(x) ? 0 : x))
    switch (ch) {
      case 'm':
        this.sgr(nums)
        break
      case 'K': {
        const p = nums[0] ?? 0
        if (p === 0) this.eraseFromCol()
        else if (p === 2) this.lines[this.row] = []
        break
      }
      case 'J': {
        if ((nums[0] ?? 0) === 2) {
          this.lines = [[]]
          this.row = 0
          this.col = 0
        }
        break
      }
      case 'G': {
        this.col = Math.max(0, (nums[0] || 1) - 1)
        break
      }
      default:
        break // A/B/C/D/H و بقیه نادیده
    }
  }

  private sgr(nums: number[]): void {
    for (const n of nums) {
      if (n === 0) this.color = undefined
      else if (n >= 30 && n <= 37) this.color = FG[n - 30]
      else if (n >= 90 && n <= 97) this.color = FG_BRIGHT[n - 90]
      else if (n === 39) this.color = undefined
    }
  }

  private newline(): void {
    this.col = 0
    this.row++
    if (this.row >= this.lines.length) this.lines.push([])
    if (this.lines.length > this.maxLines) {
      const drop = this.lines.length - this.maxLines
      this.lines.splice(0, drop)
      this.row = Math.max(0, this.row - drop)
    }
  }

  private ensureLen(len: number): void {
    const line = this.lines[this.row]
    const total = line.reduce((a, s) => a + s.t.length, 0)
    if (total < len) line.push({ t: ' '.repeat(len - total) })
  }

  private ins(ch: string): void {
    if (this.col >= this.maxCols) {
      this.newline()
    }
    this.ensureLen(this.col)
    const line = this.lines[this.row]
    let i = 0
    let segIdx = 0
    while (segIdx < line.length && i + line[segIdx].t.length <= this.col) {
      i += line[segIdx].t.length
      segIdx++
    }
    if (segIdx >= line.length) {
      line.push({ t: ch, c: this.color })
    } else {
      const seg = line[segIdx]
      const off = this.col - i
      if (seg.c === this.color) {
        seg.t = seg.t.slice(0, off) + ch + seg.t.slice(off + 1)
      } else {
        const before = seg.t.slice(0, off)
        const after = seg.t.slice(off + 1)
        const parts: Seg[] = []
        if (before) parts.push({ t: before, c: seg.c })
        parts.push({ t: ch, c: this.color })
        if (after) parts.push({ t: after, c: seg.c })
        line.splice(segIdx, 1, ...parts)
      }
    }
    this.col++
  }

  private eraseFromCol(): void {
    const line = this.lines[this.row]
    let i = 0
    let segIdx = 0
    while (segIdx < line.length && i + line[segIdx].t.length <= this.col) {
      i += line[segIdx].t.length
      segIdx++
    }
    if (segIdx < line.length) {
      const seg = line[segIdx]
      const off = this.col - i
      const keep = seg.t.slice(0, off)
      line.splice(segIdx)
      if (keep) line.push({ t: keep, c: seg.c })
    }
  }

  html(): string {
    return this.lines
      .map((l) =>
        l.length === 0
          ? ''
          : l
              .map(
                (s) =>
                  `<span style="color:${s.c ?? FG_DEFAULT}">${escHtml(s.t)}</span>`
              )
              .join('')
      )
      .join('\n')
  }
}

/* ─── چیپ‌های دستور سریع ─── */
const QUICK_CMDS: { label: string; cmd: string; hint: string }[] = [
  { label: 'uname -a', cmd: 'uname -a', hint: 'نسخه هسته، نشانهٔ واقعی بودن!' },
  { label: 'os-release', cmd: 'cat /etc/os-release', hint: 'مشخصات Alpine' },
  { label: 'free -m', cmd: 'free -m', hint: 'حافظهٔ ماشین مجازی' },
  { label: 'ls /media/cdrom', cmd: 'ls /media/cdrom', hint: 'محتوای ISO وصل‌شده' },
  { label: 'apk info', cmd: 'apk info | head -20', hint: 'پکیج‌های نصب‌شده' },
  { label: 'dmesg | tail', cmd: 'dmesg | tail -15', hint: 'لاگ واقعی کرنل' },
]

const WELCOME_CMD = 'uname -a && cat /etc/alpine-release'

export default function RealLinuxApp() {
  const pushToast = useOS((s) => s.pushToast)

  const [phase, setPhase] = useState<Phase>('idle')
  const [bootMsg, setBootMsg] = useState('')
  const [progress, setProgress] = useState<{ label: string; pct: number } | null>(null)
  const [error, setError] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const [serialLive, setSerialLive] = useState(false)
  const [showScreen, setShowScreen] = useState(false)
  const [network, setNetwork] = useState(false)
  const [input, setInput] = useState('')

  const emuRef = useRef<V86Instance | null>(null)
  const libRef = useRef<Promise<void> | null>(null)
  const vtRef = useRef<MiniVT | null>(null)
  const decRef = useRef<TextDecoder | null>(null)
  const pendingRef = useRef<string[]>([])
  const rafRef = useRef<number | null>(null)
  const rawRef = useRef('')
  const stickRef = useRef(true)
  const autologinRef = useRef({ done: false, welcomed: false })
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startedAtRef = useRef(0)
  const serialLiveRef = useRef(false)
  const outRef = useRef<HTMLDivElement | null>(null)
  const screenHostRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const histRef = useRef<string[]>([])
  const histIdxRef = useRef(-1)
  const phaseRef = useRef<Phase>('idle')

  /* هوک دیباگ برای تست خودکار */
  useEffect(() => {
    const w = window as unknown as {
      __sanjabLinux?: {
        getLog: () => string
        phase: () => string
        emu?: unknown
      }
    }
    w.__sanjabLinux = {
      getLog: () => rawRef.current.slice(-4000),
      phase: () => phaseRef.current,
    }
    return () => {
      delete w.__sanjabLinux
    }
  }, [])

  const setPhaseSafe = useCallback((p: Phase) => {
    phaseRef.current = p
    setPhase(p)
  }, [])

  useEffect(() => {
    vtRef.current = new MiniVT()
    decRef.current = new TextDecoder('utf-8')
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      if (timerRef.current) clearInterval(timerRef.current)
      try {
        emuRef.current?.destroy?.()
      } catch {
        /* ignore */
      }
      emuRef.current = null
    }
  }, [])

  /* ── فلاش خروجی سریال با rAF ── */
  const flush = useCallback(() => {
    if (!pendingRef.current.length) return
    const chunk = pendingRef.current.join('')
    pendingRef.current = []
    rawRef.current = (rawRef.current + chunk).slice(-24000)
    vtRef.current?.write(chunk)
    const el = outRef.current
    if (el) {
      el.innerHTML = vtRef.current?.html() ?? ''
      if (stickRef.current) el.scrollTop = el.scrollHeight
    }

    /* پاسخ به پرس‌وجوی موقعیت کرسر (ESC[6n)، ویرایشگر خط شل منتظرش می‌ماند */
    if (/\x1b\[6n/.test(chunk)) {
      emuRef.current?.serial0_send('\x1b[24;80R')
    }

    /* ورود خودکار root و دستور خوش‌آمد */
    const tail = rawRef.current.slice(-600)
    /* پاک‌سازی دنباله‌های ANSI برای تشخیص prompt */
    const clean = tail.replace(/\x1b\[[0-9;?]*[A-Za-z]|\x1b[78=>]/g, '')
    const al = autologinRef.current
    if (!al.done && /login:\s*$/i.test(clean)) {
      al.done = true
      setTimeout(() => emuRef.current?.serial0_send('root\r'), 900)
    } else if (al.done && !al.welcomed && /:~#\s*$/.test(clean)) {
      al.welcomed = true
      setTimeout(() => emuRef.current?.serial0_send(WELCOME_CMD + '\r'), 1100)
    }
  }, [])

  const scheduleFlush = useCallback(() => {
    if (rafRef.current != null) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null
      flush()
    })
  }, [flush])

  /* ── بارگذاری libv86.js ── */
  const loadLib = useCallback((): Promise<void> => {
    if (libRef.current) return libRef.current
    libRef.current = new Promise<void>((resolve, reject) => {
      if (window.V86) {
        resolve()
        return
      }
      const s = document.createElement('script')
      s.src = '/v86/libv86.js'
      s.async = true
      s.onload = () =>
        window.V86
          ? resolve()
          : reject(new Error('کتابخانه v86 بارگذاری شد ولی کلاس V86 پیدا نشد'))
      s.onerror = () => reject(new Error('بارگذاری libv86.js ناموفق بود'))
      document.head.appendChild(s)
    })
    return libRef.current
  }, [])

  /* ── بوت ── */
  const start = useCallback(async () => {
    if (phaseRef.current === 'starting' || phaseRef.current === 'running') return
    setPhaseSafe('starting')
    setError('')
    setBootMsg('بارگذاری شبیه‌ساز v86…')
    setProgress(null)
    setElapsed(0)
    setSerialLive(false)
    serialLiveRef.current = false
    autologinRef.current = { done: false, welcomed: false }
    vtRef.current = new MiniVT()
    rawRef.current = ''
    stickRef.current = true
    if (outRef.current) outRef.current.innerHTML = ''

    try {
      await loadLib()
      const V86C = window.V86
      if (!V86C) throw new Error('کلاس V86 در دسترس نیست')

      setBootMsg('دانلود کرنل و initramfs…')
      const emu = new V86C({
        wasm_path: '/v86/v86.wasm',
        memory_size: 512 * 1024 * 1024,
        vga_memory_size: 8 * 1024 * 1024,
        screen_container: screenHostRef.current,
        bios: { url: '/v86/seabios.bin' },
        vga_bios: { url: '/v86/vgabios.bin' },
        bzimage: { url: '/v86/vmlinuz-virt' },
        initrd: { url: '/v86/initramfs-virt' },
        cmdline:
          'console=tty0 console=ttyS0,115200 modules=loop,squashfs,sd-mod,usb-storage,sr-mod quiet',
        cdrom: { url: '/v86/alpine-virt.iso' },
        autostart: true,
        disable_speaker: true,
        ...(network ? { network_relay_url: 'fetch' } : {}),
      })
      emuRef.current = emu
      const w2 = window as unknown as { __sanjabLinux?: { emu?: unknown } }
      if (w2.__sanjabLinux) w2.__sanjabLinux.emu = emu

      const files = new Map<string, { loaded: number; total: number }>()
      emu.add_listener('download-progress', (arg?: unknown) => {
        const e = arg as {
          file_name?: string
          file_index?: number
          file_count?: number
          loaded?: number
          total?: number
        }
        if (!e || !e.file_name) return
        if (typeof e.loaded === 'number' && typeof e.total === 'number' && e.total > 0) {
          files.set(e.file_name, { loaded: e.loaded, total: e.total })
        }
        let loaded = 0
        let total = 0
        for (const f of files.values()) {
          loaded += f.loaded
          total += f.total
        }
        const pct = total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : 0
        const short = (e.file_name ?? '').split('/').pop() ?? 'فایل'
        setProgress({ label: `دانلود ${short}`, pct })
        setBootMsg(`دانلود ایمیج‌ها… (${pct}٪)`)
      })
      emu.add_listener('download-error', () => {
        setPhaseSafe('error')
        setError('دانلود یکی از فایل‌های بوت ناموفق بود')
      })
      emu.add_listener('emulator-started', () => {
        setProgress(null)
        setBootMsg('هستهٔ لینوکس در حال بوت است…')
        startedAtRef.current = Date.now()
        setPhaseSafe('running')
        if (timerRef.current) clearInterval(timerRef.current)
        timerRef.current = setInterval(() => {
          if (startedAtRef.current)
            setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000))
        }, 1000)
      })
      emu.add_listener('serial0-output-byte', (arg?: unknown) => {
        const b = arg as number
        if (typeof b !== 'number') return
        const dec = decRef.current
        if (!dec) return
        const piece = dec.decode(new Uint8Array([b]), { stream: true })
        if (piece) {
          pendingRef.current.push(piece)
          scheduleFlush()
        }
        if (!serialLiveRef.current) {
          serialLiveRef.current = true
          setSerialLive(true)
        }
      })
    } catch (err) {
      setPhaseSafe('error')
      setError(err instanceof Error ? err.message : 'خطای ناشناخته در راه‌اندازی v86')
    }
  }, [loadLib, network, scheduleFlush, setPhaseSafe])

  const shutdown = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    try {
      emuRef.current?.destroy?.()
    } catch {
      /* ignore */
    }
    emuRef.current = null
    setPhaseSafe('idle')
    setBootMsg('')
    setProgress(null)
    setElapsed(0)
    setSerialLive(false)
    serialLiveRef.current = false
  }, [setPhaseSafe])

  const restart = useCallback(() => {
    shutdown()
    setTimeout(() => void start(), 80)
  }, [shutdown, start])

  /* ── ذخیره/بازیابی وضعیت ماشین مجازی (snapshot در IndexedDB) ── */
  const [hasSnapshot, setHasSnapshot] = useState(false)
  const [snapshotBusy, setSnapshotBusy] = useState(false)

  useEffect(() => {
    void idbGet(VM_STATE_KEY).then((v) => setHasSnapshot(!!v))
  }, [])

  const saveSnapshot = useCallback(async () => {
    const emu = emuRef.current
    if (!emu || phaseRef.current !== 'running' || typeof emu.save_state !== 'function') {
      pushToast({ icon: '⚠️', title: 'فعلاً نمی‌شود', body: 'باید ماشین بوت‌شده باشد تا snapshot بگیریم' })
      return
    }
    setSnapshotBusy(true)
    try {
      const buf = await emu.save_state()
      await idbPut(VM_STATE_KEY, buf)
      setHasSnapshot(true)
      pushToast({
        icon: '💾',
        title: 'وضعیت ماشین ذخیره شد',
        body: `حجم snapshot: ${(buf.byteLength / 1024 / 1024).toFixed(1)} MB در IndexedDB مرورگر`,
      })
    } catch (e) {
      pushToast({ icon: '❌', title: 'ذخیره snapshot ناموفق بود', body: e instanceof Error ? e.message : 'خطای ناشناخته' })
    } finally {
      setSnapshotBusy(false)
    }
  }, [pushToast])

  const restoreSnapshot = useCallback(async () => {
    const emu = emuRef.current
    if (!emu || phaseRef.current !== 'running' || typeof emu.restore_state !== 'function') {
      pushToast({ icon: '⚠️', title: 'اول بوت کن', body: 'بازیابی snapshot به یک ماشین در حال اجرا نیاز دارد' })
      return
    }
    setSnapshotBusy(true)
    try {
      const buf = await idbGet<ArrayBuffer>(VM_STATE_KEY)
      if (!buf) {
        pushToast({ icon: '⚠️', title: 'snapshot پیدا نشد', body: 'اول ذخیره کن' })
        return
      }
      await emu.restore_state(buf)
      pushToast({ icon: '⏪', title: 'وضعیت بازیابی شد', body: 'ماشین به لحظه‌ی snapshot برگشت' })
    } catch (e) {
      pushToast({ icon: '❌', title: 'بازیابی ناموفق بود', body: e instanceof Error ? e.message : 'احتمالاً snapshot از نسخه‌ی دیگری از ایمیج‌هاست، دوباره ذخیره کن' })
    } finally {
      setSnapshotBusy(false)
    }
  }, [pushToast])

  const send = useCallback((s: string) => {
    if (!emuRef.current || phaseRef.current !== 'running') {
      pushToast({ icon: '⚠️', title: 'هنوز بوت نشده', body: 'اول دکمهٔ «بوت هستهٔ واقعی» را بزن' })
      return
    }
    emuRef.current.serial0_send(s)
  }, [pushToast])

  const runCommand = useCallback(
    (cmd: string) => {
      if (!cmd.trim()) return
      histRef.current.push(cmd)
      if (histRef.current.length > 60) histRef.current.shift()
      histIdxRef.current = -1
      send(cmd + '\r')
    },
    [send]
  )

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    runCommand(input)
    setInput('')
  }

  const onInputKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      const h = histRef.current
      if (!h.length) return
      histIdxRef.current = Math.min(h.length - 1, histIdxRef.current + 1)
      setInput(h[h.length - 1 - histIdxRef.current])
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const h = histRef.current
      if (histIdxRef.current <= 0) {
        histIdxRef.current = -1
        setInput('')
      } else {
        histIdxRef.current--
        setInput(h[h.length - 1 - histIdxRef.current])
      }
    }
  }

  const onOutScroll = (e: UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    stickRef.current = el.scrollTop + el.clientHeight >= el.scrollHeight - 48
  }

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const ss = String(elapsed % 60).padStart(2, '0')

  return (
    <div className="flex h-full w-full flex-col bg-zinc-950/70">
      {/* ── هدر ── */}
      <div className="flex items-center gap-2.5 border-b border-white/10 bg-gradient-to-l from-emerald-500/10 via-transparent to-teal-500/10 px-3 py-2.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-lg">
          <Cpu size={17} aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="flex items-center gap-1.5 text-sm font-black text-zinc-100">
            لینوکس واقعی، هستهٔ Alpine
            <span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-1.5 py-px text-[9px] font-bold text-emerald-300">
              ۶٫۱۲٫۱۱۴
            </span>
          </h2>
          <p className="truncate text-[10px] text-zinc-400">
            Linux 6.12.114-0-virt · شبیه‌ساز v86 · ISO وصل‌شده با apk آفلاین
          </p>
        </div>
        <div className="mr-auto flex shrink-0 items-center gap-1.5">
          {phase === 'running' && (
            <span className="hidden items-center gap-1 rounded-full border border-white/10 bg-zinc-900 px-2 py-1 font-mono text-[10px] text-zinc-400 sm:flex" dir="ltr">
              <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
              {mm}:{ss}
            </span>
          )}
          {phase !== 'idle' && (
            <>
              {phase === 'running' && (
                <>
                  <button
                    onClick={() => void saveSnapshot()}
                    disabled={snapshotBusy}
                    className={`grid size-8 place-items-center rounded-lg border border-white/10 transition active:scale-95 ${
                      hasSnapshot ? 'bg-emerald-400/10 text-emerald-300' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                    } disabled:opacity-50`}
                    title="ذخیره وضعیت ماشین (snapshot در IndexedDB)"
                    aria-label="ذخیره وضعیت ماشین مجازی"
                  >
                    <Save size={14} aria-hidden />
                  </button>
                  <button
                    onClick={() => void restoreSnapshot()}
                    disabled={snapshotBusy || !hasSnapshot}
                    className="grid size-8 place-items-center rounded-lg border border-white/10 bg-zinc-900 text-zinc-400 transition hover:bg-zinc-800 active:scale-95 disabled:opacity-40"
                    title="بازیابی وضعیت ذخیره‌شده"
                    aria-label="بازیابی وضعیت ماشین مجازی"
                  >
                    <ArchiveRestore size={14} aria-hidden />
                  </button>
                </>
              )}
              <button
                onClick={() => setShowScreen((v) => !v)}
                className={`grid size-8 place-items-center rounded-lg border transition active:scale-95 ${
                  showScreen
                    ? 'border-emerald-400/50 bg-emerald-400/10 text-emerald-300'
                    : 'border-white/10 bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                }`}
                title="نمایشگر گرافیکی دستگاه (VGA)"
                aria-label="نمایشگر دستگاه"
              >
                <Monitor size={14} aria-hidden />
              </button>
              <button
                onClick={restart}
                className="grid size-8 place-items-center rounded-lg border border-white/10 bg-zinc-900 text-zinc-400 transition hover:bg-zinc-800 active:scale-95"
                title="ری‌استارت ماشین"
                aria-label="ری‌استارت ماشین"
              >
                <RotateCcw size={14} aria-hidden />
              </button>
              <button
                onClick={shutdown}
                className="grid size-8 place-items-center rounded-lg border border-rose-400/30 bg-rose-500/10 text-rose-300 transition hover:bg-rose-500/20 active:scale-95"
                title="خاموش کردن ماشین"
                aria-label="خاموش کردن ماشین"
              >
                <CircleStop size={14} aria-hidden />
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── کارت بوت (حالت idle) ── */}
      {phase === 'idle' && (
        <div className="os-scroll min-h-0 flex-1 overflow-y-auto p-4">
          <div className="mx-auto flex w-full max-w-xl flex-col gap-3">
            <div className="rounded-2xl border border-emerald-400/25 bg-gradient-to-br from-emerald-400/10 to-teal-500/5 p-4">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-emerald-300" aria-hidden />
                <h3 className="text-sm font-black text-zinc-100">
                  این یک شبیه‌ساز نیست، کرنل واقعی است!
                </h3>
              </div>
              <p className="mt-2 text-[11px] leading-5 text-zinc-300">
                کرنل <b dir="ltr">Linux 6.12.114-0-virt</b> توزیع{' '}
                <b dir="ltr">Alpine 3.21.9</b> با شبیه‌ساز x86 «v86» (WASM) در همین
                مرورگر بوت می‌شود. <b>busybox</b> واقعی، <b>apk</b> واقعی،{' '}
                <b>dmesg</b> واقعی؛ ISO هم به‌عنوان سی‌دی‌رام وصل است تا مخزن
                پکیج‌ها در دسترس باشد.
              </p>
              <ul className="mt-2.5 space-y-1 text-[10px] leading-4 text-zinc-400">
                <li>• کرنل و initramfs واقعی Alpine (bzImage رسمی)</li>
                <li>• ورود خودکار به‌عنوان root (بدون رمز، مثل ISO واقعی)</li>
                <li>• پکیج نصب کن: <span dir="ltr" className="font-mono text-teal-300">apk add htop</span></li>
              </ul>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-zinc-900/60 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Wifi size={14} className={network ? 'text-emerald-300' : 'text-zinc-500'} aria-hidden />
                <div>
                  <p className="text-[11px] font-bold text-zinc-200">شبکهٔ آزمایشی</p>
                  <p className="text-[9px] text-zinc-500">
                    رلهٔ fetch اتصال اینترنتی داخل ماشین (apk از اینترنت)
                  </p>
                </div>
              </div>
              <Switch checked={network} onCheckedChange={setNetwork} aria-label="شبکهٔ آزمایشی" />
            </div>

            <p className="text-[10px] leading-4 text-zinc-500">
              ⏱ بوت اولین بار حدود ۳۰ تا ۹۰ ثانیه طول می‌کشد (سرعت شبیه‌سازی). همهٔ
              فایل‌ها (~۸۵MB) از خود سایت لود می‌شوند و بعد از بوت، اینترنت لازم نیست.
            </p>

            <button
              onClick={() => void start()}
              className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-sm font-black text-white shadow-lg shadow-emerald-500/20 transition hover:brightness-110 active:scale-[0.98]"
            >
              <Play size={17} aria-hidden />
              بوت هستهٔ واقعی
            </button>
          </div>
        </div>
      )}

      {/* ── ناحیهٔ ترمینال ── */}
      {phase !== 'idle' && (
        <>
          {/* کانتینر صفحهٔ v86، همیشه در DOM (v86 موقع ساخت به آن نیاز دارد) */}
          <div
            ref={screenHostRef}
            tabIndex={0}
            onClick={() => screenHostRef.current?.focus()}
            className={`os-scroll max-h-56 overflow-auto rounded-lg bg-black outline-none ${
              showScreen ? 'block' : 'hidden'
            }`}
          >
            <div
              style={{
                whiteSpace: 'pre',
                font: '12px ui-monospace, monospace',
                lineHeight: '14px',
                color: FG_DEFAULT,
              }}
            />
            <canvas style={{ display: 'none' }} />
          </div>
          {showScreen && (
            <div className="border-b border-white/10 bg-black px-2 py-2">
              <p className="mt-1 text-center text-[9px] text-zinc-600">
                نمایشگر گرافیکی ماشین، برای تایپ مستقیم کلیک کن
              </p>
            </div>
          )}

          <div className="relative min-h-0 flex-1">
            <div
              ref={outRef}
              onScroll={onOutScroll}
              dir="ltr"
              onClick={() => inputRef.current?.focus()}
              className="os-scroll absolute inset-0 cursor-text overflow-auto bg-black p-3 text-left font-mono text-[11px] leading-[15px]"
              style={{ whiteSpace: 'pre' }}
              aria-label="خروجی ترمینال سریال لینوکس"
            />
            {phase === 'starting' || (phase === 'running' && !serialLive) ? (
              <div className="pointer-events-none absolute inset-0 grid place-items-center bg-black/80">
                <div className="flex flex-col items-center gap-3 text-center">
                  <Loader2 size={26} className="animate-spin text-emerald-300" aria-hidden />
                  <p className="text-xs font-bold text-zinc-200">
                    {bootMsg || 'در حال راه‌اندازی…'}
                  </p>
                  {progress && (
                    <div className="w-56">
                      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
                        <div
                          className="h-full rounded-full bg-gradient-to-l from-emerald-400 to-teal-500 transition-all"
                          style={{ width: `${progress.pct}%` }}
                        />
                      </div>
                      <p className="mt-1 font-mono text-[9px] text-zinc-500">
                        {progress.label}، {progress.pct}٪
                      </p>
                    </div>
                  )}
                  {phase === 'running' && !serialLive && (
                    <p className="max-w-56 text-[10px] leading-4 text-zinc-500">
                      کرنل در حال راه‌اندازی است، ترمینال سریال چند لحظهٔ دیگر
                      روشن می‌شود…
                    </p>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          {/* چیپ‌های دستور */}
          <div className="os-scroll flex gap-1.5 overflow-x-auto border-t border-white/10 bg-zinc-900/60 px-2.5 py-2">
            <button
              onClick={() => send('root\r')}
              className="flex h-7 shrink-0 items-center gap-1 rounded-lg border border-amber-400/40 bg-amber-400/10 px-2.5 text-[10px] font-bold text-amber-300 transition hover:bg-amber-400/20 active:scale-95"
              title="ورود به‌عنوان root"
            >
              ورود root
            </button>
            {QUICK_CMDS.map((q) => (
              <button
                key={q.label}
                onClick={() => runCommand(q.cmd)}
                title={q.hint}
                className="h-7 shrink-0 rounded-lg border border-white/10 bg-zinc-800/80 px-2.5 font-mono text-[10px] text-zinc-300 transition hover:border-emerald-400/40 hover:text-emerald-300 active:scale-95"
              >
                {q.label}
              </button>
            ))}
            <button
              onClick={() => send('\x03')}
              className="h-7 shrink-0 rounded-lg border border-rose-400/30 bg-rose-500/10 px-2.5 font-mono text-[10px] text-rose-300 transition hover:bg-rose-500/20 active:scale-95"
              title="ارسال Ctrl+C، قطع دستور جاری"
            >
              ^C
            </button>
            <button
              onClick={() => send('\t')}
              className="h-7 shrink-0 rounded-lg border border-white/10 bg-zinc-800/80 px-2.5 font-mono text-[10px] text-zinc-300 transition hover:bg-zinc-800 active:scale-95"
              title="ارسال Tab، تکمیل خودکار"
            >
              ⇥ Tab
            </button>
          </div>

          {/* ورودی */}
          <form
            onSubmit={onSubmit}
            dir="ltr"
            className="flex items-center gap-2 border-t border-white/10 bg-zinc-950 px-2.5 py-2"
          >
            <span className="shrink-0 font-mono text-[11px] font-bold text-emerald-400">
              sanjab@kernel:~#
            </span>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onInputKey}
              disabled={phase !== 'running'}
              placeholder={phase === 'running' ? 'فرمان بزن… (مثل apk add htop)' : 'ماشین هنوز بوت نشده'}
              className="h-8 min-w-0 flex-1 rounded-lg border border-white/10 bg-zinc-900 px-2.5 font-mono text-[11px] text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-emerald-400/50 disabled:opacity-50"
              aria-label="ورودی فرمان لینوکس"
            />
            <button
              type="submit"
              disabled={phase !== 'running'}
              className="grid size-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 text-white transition hover:brightness-110 active:scale-95 disabled:opacity-40"
              aria-label="ارسال فرمان"
            >
              <Send size={13} className="-scale-x-100" aria-hidden />
            </button>
          </form>
        </>
      )}

      {/* ── خطا ── */}
      {phase === 'error' && (
        <div className="border-t border-rose-400/30 bg-rose-500/10 p-3">
          <div className="mx-auto flex max-w-xl items-start gap-2">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-rose-300" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-rose-200">خطا در اجرای ماشین</p>
              <p className="mt-0.5 text-[10px] leading-4 text-rose-300/80">{error}</p>
              <div className="mt-2 flex gap-1.5">
                <button
                  onClick={() => void start()}
                  className="rounded-lg bg-rose-500/20 px-3 py-1 text-[10px] font-bold text-rose-200 transition hover:bg-rose-500/30"
                >
                  تلاش دوباره
                </button>
                <button
                  onClick={shutdown}
                  className="rounded-lg bg-white/5 px-3 py-1 text-[10px] font-bold text-zinc-300 transition hover:bg-white/10"
                >
                  بستن
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── نوار وضعیت ── */}
      <div className="flex items-center gap-2 border-t border-white/10 bg-zinc-900/80 px-3 py-1.5">
        <span
          className={`size-2 rounded-full ${
            phase === 'running'
              ? 'animate-pulse bg-emerald-400'
              : phase === 'starting'
                ? 'animate-pulse bg-amber-400'
                : phase === 'error'
                  ? 'bg-rose-400'
                  : 'bg-zinc-600'
          }`}
          aria-hidden
        />
        <span className="text-[10px] font-bold text-zinc-300">
          {phase === 'idle'
            ? 'خاموش'
            : phase === 'starting'
              ? bootMsg || 'در حال آماده‌سازی…'
              : phase === 'running'
                ? serialLive
                  ? 'ترمینال سریال فعال، واقعی!'
                  : bootMsg || 'هسته در حال بوت…'
                : 'خطا'}
        </span>
        <span className="mr-auto flex items-center gap-1 text-[9px] text-zinc-600">
          <Eraser size={9} aria-hidden />
          خروجی: {vtRef.current ? 'زنده' : '—'}
          {network && phase !== 'idle' ? ' · شبکهٔ آزمایشی روشن' : ''}
        </span>
      </div>
    </div>
  )
}
