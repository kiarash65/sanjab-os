'use client'

/* ------------------------------------------------------------------ */
/* آزمایشگاه شبکه عصبی سان‌جاب، آموزش واقعی با پس‌انتشار روی مرورگر   */
/* ایده مرجع: micrograd (MIT) و TensorFlow Playground (Apache-2.0)    */
/* اینجا مدل واقعاً آموزش می‌بیند: مرز تصمیم و منحنی خطا زنده رسم      */
/* می‌شوند. اندازه مدل کوچک است تا در مرورگر روان باشد.               */
/* ------------------------------------------------------------------ */

import { useCallback, useEffect, useRef, useState } from 'react'
import { Pause, Play, RotateCcw, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { useGame } from '@/lib/gamification/engine'
import {
  MLP,
  makeDataset,
  predict,
  trainStep,
  type DatasetId,
  type Point,
} from '@/lib/ai/micrograd'

const DATASETS: { id: DatasetId; label: string }[] = [
  { id: 'circles', label: 'دو دایره' },
  { id: 'xor', label: 'XOR' },
  { id: 'moons', label: 'دو هلال' },
  { id: 'spiral', label: 'مارپیچ' },
]

const GRID = 64

function defaultArch(): number[] {
  return [2, 6, 6, 1]
}

export default function NNLab() {
  const [dataset, setDataset] = useState<DatasetId>('circles')
  const [hidden, setHidden] = useState<number[]>([6, 6])
  const [lr, setLr] = useState(0.5)
  const [lossFn, setLossFn] = useState<'mse' | 'bce'>('bce')
  const [running, setRunning] = useState(false)
  const [epoch, setEpoch] = useState(0)
  const [loss, setLoss] = useState(0)
  const [acc, setAcc] = useState(0)
  const [paramsCount, setParamsCount] = useState(0)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const lossCanvasRef = useRef<HTMLCanvasElement>(null)
  const netRef = useRef<MLP | null>(null)
  const dataRef = useRef<Point[]>([])
  const lossHistoryRef = useRef<number[]>([])
  const rafRef = useRef<number | null>(null)
  const epochRef = useRef(0)

  const drawBoundary = useCallback(() => {
    const cv = canvasRef.current
    const net = netRef.current
    const data = dataRef.current
    if (!cv || !net) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    const size = cv.width
    const cell = size / GRID
    // پس‌زمینه مرز تصمیم
    for (let i = 0; i < GRID; i++) {
      for (let j = 0; j < GRID; j++) {
        const x = (i / GRID) * 2 - 1
        const y = (j / GRID) * 2 - 1
        const v = predict(net, x, y)
        const t = Math.max(-1, Math.min(1, v))
        // کلاس ۱ = بنفش، کلاس ۰ = نارنجی (پالت سان‌جاب)
        const r = t > 0 ? 139 - Math.round(t * 30) : 247
        const g = t > 0 ? 92 + Math.round((1 - t) * 30) : 147
        const b = t > 0 ? 246 : 30
        ctx.fillStyle = `rgba(${r},${g},${b},${0.18 + Math.abs(t) * 0.32})`
        ctx.fillRect(i * cell, j * cell, cell + 1, cell + 1)
      }
    }
    // نقاط داده
    for (const p of data) {
      const cx = ((p.x + 1) / 2) * size
      const cy = ((p.y + 1) / 2) * size
      ctx.beginPath()
      ctx.arc(cx, cy, 4.2, 0, Math.PI * 2)
      ctx.fillStyle = p.label === 1 ? '#8b5cf6' : '#f7931e'
      ctx.fill()
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'
      ctx.lineWidth = 1
      ctx.stroke()
    }
  }, [])

  const drawLoss = useCallback(() => {
    const cv = lossCanvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    const w = cv.width
    const h = cv.height
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = 'rgba(0,0,0,0.35)'
    ctx.fillRect(0, 0, w, h)
    const hist = lossHistoryRef.current
    if (hist.length < 2) return
    const maxL = Math.max(...hist, 0.001)
    ctx.beginPath()
    ctx.moveTo(0, h)
    hist.forEach((v, i) => {
      const x = (i / (hist.length - 1)) * w
      const y = h - (v / maxL) * (h - 6) - 2
      ctx.lineTo(x, y)
    })
    ctx.lineTo(w, h - 2)
    ctx.closePath()
    ctx.fillStyle = 'rgba(45, 212, 191, 0.25)'
    ctx.fill()
    ctx.beginPath()
    hist.forEach((v, i) => {
      const x = (i / (hist.length - 1)) * w
      const y = h - (v / maxL) * (h - 6) - 2
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.strokeStyle = '#2dd4bf'
    ctx.lineWidth = 2
    ctx.stroke()
  }, [])

  const rebuild = useCallback(
    (dsId: DatasetId, arch: number[]) => {
      dataRef.current = makeDataset(dsId, 140)
      netRef.current = new MLP(arch)
      lossHistoryRef.current = []
      epochRef.current = 0
      setEpoch(0)
      setLoss(0)
      setAcc(0)
      setParamsCount(netRef.current.parameters().length)
      drawBoundary()
      drawLoss()
    },
    [drawBoundary, drawLoss]
  )

  useEffect(() => {
    if (!running) return
    let raf = 0
    /* حلقهٔ آموزش، هر فریم چند گام؛ مدل کوچک است */
    const loop = () => {
      const net = netRef.current
      if (!net) return
      const stepsPerFrame = 6
      let last: { loss: number; accuracy: number } | null = null
      for (let s = 0; s < stepsPerFrame; s++) {
        epochRef.current++
        last = trainStep(net, dataRef.current, { lr, epochs: 1, loss: lossFn }, epochRef.current)
      }
      if (last) {
        setEpoch(epochRef.current)
        setLoss(last.loss)
        setAcc(last.accuracy)
      }
      // پاداش اولین آموزش واقعی مدل (idempotent)
      if (epochRef.current === 60) {
        useGame.getState().award('ai:lab:first-train', 15, 'اولین مدل را در آزمایشگاه آموزش دادی', { track: 'ai' })
      }
      lossHistoryRef.current.push(last?.loss ?? 0)
      if (lossHistoryRef.current.length > 240) lossHistoryRef.current.shift()
      drawBoundary()
      drawLoss()
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [running, lr, lossFn, drawBoundary, drawLoss])

  useEffect(() => {
    const t = window.setTimeout(() => rebuild(dataset, [2, ...hidden, 1]), 0)
    return () => window.clearTimeout(t)
  }, [dataset, rebuild, hidden])

  const changeHidden = (idx: number, delta: number) => {
    const next = [...hidden]
    next[idx] = Math.max(1, Math.min(8, next[idx] + delta))
    setHidden(next)
    rebuild(dataset, [2, ...next, 1])
  }

  const addLayer = () => {
    if (hidden.length >= 3) return
    const next = [...hidden, 4]
    setHidden(next)
    rebuild(dataset, [2, ...next, 1])
  }

  const removeLayer = () => {
    if (hidden.length <= 1) return
    const next = hidden.slice(0, -1)
    setHidden(next)
    rebuild(dataset, [2, ...next, 1])
  }

  const reset = () => {
    rebuild(dataset, [2, ...hidden, 1])
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-3 text-[11px] leading-6 text-zinc-400">
        <p>
          این یک <b className="text-violet-300">شبکه عصبی واقعی</b> است که همین‌جا در مرورگر تو آموزش
          می‌بیند: انتشار رو به جلو، محاسبه خطا، پس‌انتشار گرادیان و گام گرادیان‌نزولی. الهام‌گرفته از
          پروژه‌های آموزشی micrograd و TensorFlow Playground، اما پیاده‌سازی خودِ سان‌جاب.
        </p>
        <p className="mt-1 text-zinc-500">
          مدل کوچک است (چند صد پارامتر) تا روی هر لپ‌تاپی روان باشد. «CPython/GPU لازم نیست».
        </p>
      </div>

      {/* انتخاب دیتاست */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-bold text-zinc-500">داده تمرین:</span>
        {DATASETS.map((d) => (
          <button
            key={d.id}
            onClick={() => {
              setRunning(false)
              setDataset(d.id)
            }}
            className={`rounded-lg border px-3 py-1.5 text-[11px] font-bold transition active:scale-95 ${
              dataset === d.id
                ? 'border-violet-400/60 bg-violet-500/15 text-violet-300'
                : 'border-white/10 bg-zinc-800/70 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* معماری */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-zinc-900/60 p-3">
        <span className="text-[11px] font-bold text-zinc-500">معماری:</span>
        <span dir="ltr" className="rounded bg-zinc-800 px-2 py-1 font-mono text-[11px] text-teal-300">
          2 → {hidden.join(' → ')} → 1
        </span>
        {hidden.map((n, i) => (
          <span key={i} className="flex items-center gap-1">
            <span className="text-[10px] text-zinc-500">لایه {i + 1}:</span>
            <button
              onClick={() => changeHidden(i, -1)}
              className="grid h-6 w-6 place-items-center rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              aria-label="کاهش نورون"
            >
              −
            </button>
            <span className="w-5 text-center text-[11px] font-bold text-zinc-200">{n}</span>
            <button
              onClick={() => changeHidden(i, 1)}
              className="grid h-6 w-6 place-items-center rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              aria-label="افزایش نورون"
            >
              +
            </button>
          </span>
        ))}
        <Button size="sm" variant="outline" onClick={addLayer} disabled={hidden.length >= 3} className="h-7 px-2 text-[10px]">
          + لایه
        </Button>
        <Button size="sm" variant="outline" onClick={removeLayer} disabled={hidden.length <= 1} className="h-7 px-2 text-[10px]">
          − لایه
        </Button>
        <span className="text-[10px] text-zinc-500">({paramsCount} پارامتر)</span>
      </div>

      {/* کنترل‌ها */}
      <div className="flex flex-wrap items-center gap-4">
        <Button
          onClick={() => setRunning((r) => !r)}
          className={running ? 'bg-rose-600 hover:bg-rose-500' : 'bg-emerald-600 hover:bg-emerald-500'}
        >
          {running ? <Pause size={14} /> : <Play size={14} />}
          {running ? 'توقف آموزش' : 'شروع آموزش'}
        </Button>
        <Button variant="outline" onClick={reset}>
          <RotateCcw size={14} />
          وزن‌های جدید
        </Button>
        <div className="flex min-w-[180px] items-center gap-2">
          <span className="text-[11px] text-zinc-500">نرخ یادگیری:</span>
          <Slider
            value={[lr]}
            min={0.05}
            max={2}
            step={0.05}
            onValueChange={(v) => setLr(v[0] ?? 0.5)}
            className="w-28"
          />
          <span dir="ltr" className="font-mono text-[11px] text-teal-300">{lr.toFixed(2)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-zinc-500">تابع خطا:</span>
          {(['bce', 'mse'] as const).map((f) => (
            <button
              key={f}
              onClick={() => {
                setLossFn(f)
                rebuild(dataset, [2, ...hidden, 1])
              }}
              className={`rounded-md border px-2 py-1 text-[10px] font-bold transition ${
                lossFn === f
                  ? 'border-teal-400/60 bg-teal-500/15 text-teal-300'
                  : 'border-white/10 bg-zinc-800/70 text-zinc-400'
              }`}
              dir="ltr"
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* بوم‌ها */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <canvas
            ref={canvasRef}
            width={448}
            height={448}
            className="w-full max-w-full rounded-xl border border-white/10"
            aria-label="مرز تصمیم شبکه عصبی"
          />
          <p className="mt-1 text-center text-[10px] text-zinc-500">
            بنفش = کلاس ۱ · نارنجی = کلاس ۰ · رنگ پس‌زمینه = خروجی شبکه
          </p>
        </div>
        <div className="space-y-3">
          <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-3">
            <p className="mb-2 flex items-center gap-1 text-[11px] font-bold text-zinc-400">
              <Zap size={12} className="text-teal-400" />
              وضعیت آموزش
            </p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[10px] text-zinc-500">گام</p>
                <p className="font-mono text-sm font-bold text-zinc-100">{epoch.toLocaleString('fa-IR')}</p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-500">خطا</p>
                <p className="font-mono text-sm font-bold text-teal-300">{loss.toFixed(4)}</p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-500">دقت</p>
                <p className="font-mono text-sm font-bold text-emerald-400">{Math.round(acc * 100)}٪</p>
              </div>
            </div>
          </div>
          <canvas
            ref={lossCanvasRef}
            width={280}
            height={120}
            className="w-full rounded-xl border border-white/10"
            aria-label="منحنی خطا"
          />
          <p className="text-center text-[10px] text-zinc-500">
            منحنی خطا باید پایین بیاید، اگر بالا رفت، یادگیریِ تند (lr بزرگ) داری
          </p>
        </div>
      </div>
    </div>
  )
}
