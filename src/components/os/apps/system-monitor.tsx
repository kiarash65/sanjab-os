'use client'

import { useEffect, useRef, useState } from 'react'
import { RotateCcw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useOS } from '@/lib/os/store'

const POINTS = 40

type MetricKey = 'cpu' | 'ram' | 'net'
type Histories = Record<MetricKey, number[]>

type Process = {
  pid: number
  name: string
  desc: string
  cpu: number
  mem: number
}

const PROCESS_SEED: ReadonlyArray<{ pid: number; name: string; desc: string }> = [
  { pid: 1, name: 'systemd-bamze', desc: 'مدیر بامزگی سیستم' },
  { pid: 2, name: 'meowd', desc: 'سرویس گربه‌ها 🐱' },
  { pid: 4, name: 'coffee_daemon', desc: 'سرویس قهوه ☕' },
  { pid: 88, name: 'chrome_eating_ram', desc: 'خورنده رم، اولویت بالا' },
  { pid: 42, name: 'vibe_engine', desc: 'موتور لایب' },
  { pid: 7, name: 'kernel_task', desc: 'هسته لینوکس ۶.۹.۴' },
  { pid: 13, name: 'procrastinatord', desc: 'بهانه‌گیری حرفه‌ای' },
]

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value))

const randStep = (step: number): number => (Math.random() * 2 - 1) * step

const randInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min

function seedHistory(start: number, step: number, min: number, max: number): number[] {
  const out: number[] = []
  let value = start
  for (let i = 0; i < POINTS; i += 1) {
    value = clamp(value + randStep(step), min, max)
    out.push(value)
  }
  return out
}

function pushHistory(values: number[], step: number, min: number, max: number): number[] {
  const last = values[values.length - 1] ?? 50
  const next = clamp(last + randStep(step), min, max)
  return [...values.slice(-(POINTS - 1)), next]
}

function freshHistories(): Histories {
  return {
    cpu: seedHistory(22, 8, 3, 97),
    ram: seedHistory(46, 4, 20, 95),
    net: seedHistory(35, 15, 0, 100),
  }
}

function initialCpu(name: string): number {
  return name === 'chrome_eating_ram' ? randInt(96, 99) : randInt(1, 18)
}

function initialMem(name: string): number {
  return name === 'chrome_eating_ram' ? randInt(1900, 2400) : randInt(16, 640)
}

function makeProcesses(): Process[] {
  return PROCESS_SEED.map((seed) => ({
    ...seed,
    cpu: initialCpu(seed.name),
    mem: initialMem(seed.name),
  }))
}

function drawChart(canvas: HTMLCanvasElement, values: number[], color: string): void {
  const ctx = canvas.getContext('2d')
  if (!ctx || values.length === 0) return
  const w = canvas.width
  const h = canvas.height
  ctx.clearRect(0, 0, w, h)

  ctx.lineWidth = 1
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'
  for (const fraction of [0.25, 0.5, 0.75]) {
    ctx.beginPath()
    ctx.moveTo(0, h * fraction)
    ctx.lineTo(w, h * fraction)
    ctx.stroke()
  }

  const xAt = (i: number): number => (i / Math.max(values.length - 1, 1)) * (w - 6) + 3
  const yAt = (v: number): number => h - 4 - (clamp(v, 0, 100) / 100) * (h - 8)

  ctx.beginPath()
  values.forEach((v, i) => {
    if (i === 0) ctx.moveTo(xAt(i), yAt(v))
    else ctx.lineTo(xAt(i), yAt(v))
  })
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.shadowColor = color
  ctx.shadowBlur = 8
  ctx.stroke()

  const lastX = xAt(values.length - 1)
  const lastY = yAt(values[values.length - 1] ?? 0)
  ctx.beginPath()
  ctx.arc(lastX, lastY, 2.5, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()
  ctx.shadowBlur = 0
}

function MetricCard({
  emoji,
  title,
  subtitle,
  values,
}: {
  emoji: string
  title: string
  subtitle: string
  values: number[]
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const accent =
      getComputedStyle(document.documentElement).getPropertyValue('--pengo-accent').trim() || '#22c55e'
    drawChart(canvas, values, accent)
  }, [values])

  const current = values[values.length - 1] ?? 0
  const percent = Math.round(current)

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-zinc-900 p-3 transition-colors hover:border-white/20">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs font-bold text-zinc-100">
          <span aria-hidden>{emoji}</span>
          <span dir="ltr">{title}</span>
        </span>
        <span className="truncate text-[10px] text-zinc-500">{subtitle}</span>
      </div>
      <canvas
        ref={canvasRef}
        width={220}
        height={60}
        className="h-14 w-full rounded-lg border border-white/5 bg-zinc-950/70"
      />
      <div className="flex items-center justify-between">
        <span dir="ltr" className="text-2xl font-black text-zinc-100">{percent}%</span>
        <span className="flex items-center gap-1 text-[10px] text-zinc-500">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--pengo-accent)]" />
          زنده
        </span>
      </div>
      <Progress value={percent} className="h-1.5 bg-zinc-800 [&>div]:bg-[var(--pengo-accent)]" />
    </div>
  )
}

function SensorChip({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-zinc-900 px-3 py-1.5 text-[11px] transition-colors hover:border-white/20">
      <span aria-hidden>{emoji}</span>
      <span className="text-zinc-500">{label}:</span>
      <span className="font-bold text-zinc-200">{value}</span>
    </div>
  )
}

export default function SystemMonitorApp() {
  const [hist, setHist] = useState<Histories>(() => freshHistories())
  const [procs, setProcs] = useState<Process[]>(() => makeProcesses())

  useEffect(() => {
    const id = window.setInterval(() => {
      setHist((h) => ({
        cpu: pushHistory(h.cpu, 8, 3, 97),
        ram: pushHistory(h.ram, 4, 20, 95),
        net: pushHistory(h.net, 15, 0, 100),
      }))
    }, 1000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => {
      setProcs((ps) =>
        ps.map((p) => ({
          ...p,
          cpu:
            p.name === 'chrome_eating_ram'
              ? randInt(96, 99)
              : Math.round(clamp(p.cpu + randStep(6), 0, 99)),
        })),
      )
    }, 2000)
    return () => window.clearInterval(id)
  }, [])

  const resetStats = () => setHist(freshHistories())

  const killProcess = (target: Process) => {
    setProcs((ps) => ps.filter((p) => p.pid !== target.pid))
    useOS.getState().pushToast({
      icon: '💀',
      title: 'پروسه اخراج شد',
      body: `${target.name} با حال خوب رفت بیرون.`,
    })
  }

  const reviveAll = () => setProcs(makeProcesses())

  return (
    <Tabs defaultValue="overview" className="flex h-full w-full flex-col bg-zinc-950/60">
      <div className="border-b border-white/10 px-3 py-2.5">
        <TabsList className="h-8 rounded-xl border border-white/10 bg-zinc-900 p-1">
          <TabsTrigger
            value="overview"
            className="rounded-lg px-3 text-xs transition-all data-[state=active]:bg-zinc-800 data-[state=active]:text-[var(--pengo-accent)]"
          >
            نمای کلی
          </TabsTrigger>
          <TabsTrigger
            value="processes"
            className="rounded-lg px-3 text-xs transition-all data-[state=active]:bg-zinc-800 data-[state=active]:text-[var(--pengo-accent)]"
          >
            فرآیندها
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="overview" className="mt-0 min-h-0 flex-1 px-3 pb-3 pt-3">
        <div className="os-scroll flex h-full flex-col gap-3 overflow-y-auto pr-1">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-[11px] text-zinc-500">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--pengo-accent)]" />
              آمار زنده، هر ۱ ثانیه یه قدم جلو
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={resetStats}
              className="gap-1.5 rounded-xl border-white/10 bg-zinc-900 text-xs text-zinc-200 transition-all hover:bg-zinc-800 hover:text-zinc-100 active:scale-95"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              شروع دوباره آمار
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <MetricCard emoji="🧠" title="CPU" subtitle="مغز سیستم" values={hist.cpu} />
            <MetricCard emoji="😋" title="RAM" subtitle="حافظه‌ای که کروم می‌خوره" values={hist.ram} />
            <MetricCard emoji="📡" title="شبکه" subtitle="بیت‌های خوشحال" values={hist.net} />
          </div>

          <div className="flex flex-wrap gap-2">
            <SensorChip emoji="🌡" label="دمای پنگوئن" value="۳۶.۶°" />
            <SensorChip emoji="🌀" label="فن" value="ساکت مثل نوجوان سر سفره" />
            <SensorChip emoji="🔋" label="باتری" value="۹۹٪ (جادویی)" />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="processes" className="mt-0 min-h-0 flex-1 px-3 pb-3 pt-3">
        {procs.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <span className="text-4xl" aria-hidden>😴</span>
            <p className="text-sm font-bold text-zinc-300">همه پروسه‌ها اخراج شدن! سیستم خیلی آرومه 😴</p>
            <Button
              size="sm"
              onClick={reviveAll}
              className="rounded-xl bg-[var(--pengo-accent)] font-bold text-zinc-950 transition-all hover:opacity-90 active:scale-95"
            >
              احیای همه
            </Button>
          </div>
        ) : (
          <div className="flex h-full flex-col gap-2">
            <div className="flex items-center gap-3 px-3 text-[10px] text-zinc-600">
              <span className="flex-1">پروسه</span>
              <span dir="ltr" className="w-12 text-center">CPU</span>
              <span dir="ltr" className="w-16 text-center">MEM</span>
              <span className="w-7" />
            </div>
            <div className="os-scroll flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
              {procs.map((p) => (
                <div
                  key={p.pid}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-zinc-900 px-3 py-2.5 transition-colors hover:border-white/20"
                >
                  <div className="min-w-0 flex-1">
                    <div dir="ltr" className="truncate text-right font-mono text-xs font-bold text-zinc-100">
                      {p.name}
                    </div>
                    <div className="truncate text-[11px] text-zinc-500">{p.desc}</div>
                  </div>
                  <span dir="ltr" className="w-12 text-center text-[11px] font-bold text-zinc-300">
                    {p.cpu}%
                  </span>
                  <span dir="ltr" className="w-16 text-center font-mono text-[11px] text-zinc-500">
                    {p.mem}MB
                  </span>
                  <button
                    type="button"
                    onClick={() => killProcess(p)}
                    aria-label={`اخراج ${p.name}`}
                    className="rounded-lg p-1.5 text-zinc-500 transition-all hover:bg-red-500/20 hover:text-red-400 active:scale-95"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}
