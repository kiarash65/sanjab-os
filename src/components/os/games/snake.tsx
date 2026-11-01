'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react'
import { GameShell, Overlay, useBestScore } from '@/components/os/game-shell'

const GRID = 24
const CELL = 20
const CANVAS_PX = GRID * CELL
const START_LEN = 3
const START_INTERVAL = 140
const MIN_INTERVAL = 70

interface Point {
  x: number
  y: number
}

interface GameState {
  snake: Point[]
  dir: Point
  nextDir: Point
  food: Point
  alive: boolean
  interval: number
  acc: number
}

function randomFood(snake: readonly Point[]): Point {
  for (;;) {
    const p = {
      x: Math.floor(Math.random() * GRID),
      y: Math.floor(Math.random() * GRID),
    }
    if (!snake.some((s) => s.x === p.x && s.y === p.y)) return p
  }
}

function makeState(): GameState {
  const snake: Point[] = [
    { x: 12, y: 12 },
    { x: 11, y: 12 },
    { x: 10, y: 12 },
  ]
  return {
    snake,
    dir: { x: 1, y: 0 },
    nextDir: { x: 1, y: 0 },
    food: randomFood(snake),
    alive: true,
    interval: START_INTERVAL,
    acc: 0,
  }
}

function fillRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
  ctx.fill()
}

function DPad({ onDir }: { onDir: (d: Point) => void }) {
  const btn =
    'flex size-10 select-none items-center justify-center rounded-lg border border-white/10 bg-zinc-900 text-zinc-300 transition hover:bg-zinc-800 hover:text-zinc-100 active:scale-95'
  return (
    <div className="grid select-none grid-cols-3 gap-1.5">
      <div />
      <button
        type="button"
        aria-label="بالا"
        className={btn}
        onClick={() => onDir({ x: 0, y: -1 })}
      >
        <ChevronUp aria-hidden className="size-5" />
      </button>
      <div />
      <button
        type="button"
        aria-label="چپ"
        className={btn}
        onClick={() => onDir({ x: -1, y: 0 })}
      >
        <ChevronLeft aria-hidden className="size-5" />
      </button>
      <div className="grid size-10 place-items-center">
        <div className="size-2 rounded-full bg-white/15" />
      </div>
      <button
        type="button"
        aria-label="راست"
        className={btn}
        onClick={() => onDir({ x: 1, y: 0 })}
      >
        <ChevronRight aria-hidden className="size-5" />
      </button>
      <div />
      <button
        type="button"
        aria-label="پایین"
        className={btn}
        onClick={() => onDir({ x: 0, y: 1 })}
      >
        <ChevronDown aria-hidden className="size-5" />
      </button>
      <div />
    </div>
  )
}

export default function SnakeGame() {
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [deathBy, setDeathBy] = useState<'wall' | 'self'>('wall')
  const [best, setBest] = useBestScore('snake')
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const stateRef = useRef<GameState>(makeState())
  const runningRef = useRef(false)

  const turn = useCallback((d: Point) => {
    const st = stateRef.current
    if (!st.alive) return
    runningRef.current = true
    // جلوگیری از چرخش ۱۸۰ درجه
    if (st.dir.x === -d.x && st.dir.y === -d.y) return
    if (st.dir.x === d.x && st.dir.y === d.y) return
    st.nextDir = d
  }, [])

  const reset = useCallback(() => {
    stateRef.current = makeState()
    runningRef.current = false
    setScore(0)
    setGameOver(false)
    setDeathBy('wall')
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      const dirs: Record<string, Point> = {
        arrowup: { x: 0, y: -1 },
        w: { x: 0, y: -1 },
        arrowdown: { x: 0, y: 1 },
        s: { x: 0, y: 1 },
        arrowleft: { x: -1, y: 0 },
        a: { x: -1, y: 0 },
        arrowright: { x: 1, y: 0 },
        d: { x: 1, y: 0 },
      }
      const d = dirs[key]
      if (!d) return
      e.preventDefault()
      turn(d)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [turn])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let last = performance.now()

    const step = (st: GameState) => {
      st.dir = st.nextDir
      const head = st.snake[0]
      const nh: Point = { x: head.x + st.dir.x, y: head.y + st.dir.y }

      if (nh.x < 0 || nh.y < 0 || nh.x >= GRID || nh.y >= GRID) {
        st.alive = false
        setDeathBy('wall')
        setGameOver(true)
        return
      }

      const ate = nh.x === st.food.x && nh.y === st.food.y
      const body = ate ? st.snake : st.snake.slice(0, st.snake.length - 1)
      if (body.some((p) => p.x === nh.x && p.y === nh.y)) {
        st.alive = false
        setDeathBy('self')
        setGameOver(true)
        return
      }

      st.snake.unshift(nh)
      if (ate) {
        st.interval = Math.max(MIN_INTERVAL, st.interval - 3)
        st.food = randomFood(st.snake)
        const newScore = (st.snake.length - START_LEN) * 10
        setScore(newScore)
        setBest(newScore)
      } else {
        st.snake.pop()
      }
    }

    const draw = () => {
      const st = stateRef.current
      const accent =
        getComputedStyle(document.documentElement)
          .getPropertyValue('--pengo-accent')
          .trim() || '#22c55e'

      // زمینه تیره
      ctx.fillStyle = '#0a0f0a'
      ctx.fillRect(0, 0, CANVAS_PX, CANVAS_PX)

      // خطوط کم‌رنگ شبکه
      ctx.strokeStyle = 'rgba(255,255,255,0.04)'
      ctx.lineWidth = 1
      ctx.beginPath()
      for (let i = 1; i < GRID; i++) {
        const p = i * CELL + 0.5
        ctx.moveTo(p, 0)
        ctx.lineTo(p, CANVAS_PX)
        ctx.moveTo(0, p)
        ctx.lineTo(CANVAS_PX, p)
      }
      ctx.stroke()

      // غذا
      const cx = st.food.x * CELL + CELL / 2
      const cy = st.food.y * CELL + CELL / 2
      ctx.fillStyle = '#fb7185'
      ctx.beginPath()
      ctx.arc(cx, cy, CELL / 2 - 3.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.65)'
      ctx.beginPath()
      ctx.arc(cx - 2.5, cy - 2.5, 2, 0, Math.PI * 2)
      ctx.fill()

      // بدن مار
      ctx.fillStyle = accent
      ctx.globalAlpha = 0.85
      for (let i = st.snake.length - 1; i >= 1; i--) {
        const s = st.snake[i]
        fillRoundRect(ctx, s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2, 6)
      }
      ctx.globalAlpha = 1

      // سرِ کمی روشن‌تر
      const head = st.snake[0]
      fillRoundRect(ctx, head.x * CELL + 1, head.y * CELL + 1, CELL - 2, CELL - 2, 7)
      ctx.fillStyle = 'rgba(255,255,255,0.25)'
      fillRoundRect(ctx, head.x * CELL + 1, head.y * CELL + 1, CELL - 2, CELL - 2, 7)

      // چشم‌ها
      const hx = head.x * CELL + CELL / 2
      const hy = head.y * CELL + CELL / 2
      const dx = st.dir.x
      const dy = st.dir.y
      const px = -dy
      const py = dx
      for (const s of [1, -1]) {
        ctx.fillStyle = 'rgba(255,255,255,0.95)'
        ctx.beginPath()
        ctx.arc(hx + dx * 3.5 + px * 4.5 * s, hy + dy * 3.5 + py * 4.5 * s, 2.2, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#0a0f0a'
        ctx.beginPath()
        ctx.arc(hx + dx * 4.6 + px * 4.5 * s, hy + dy * 4.6 + py * 4.5 * s, 1.1, 0, Math.PI * 2)
        ctx.fill()
      }

      // راهنمای شروع
      if (!runningRef.current && st.alive) {
        ctx.fillStyle = 'rgba(0,0,0,0.55)'
        ctx.fillRect(0, CANVAS_PX / 2 - 22, CANVAS_PX, 44)
        ctx.fillStyle = 'rgba(255,255,255,0.95)'
        ctx.font = 'bold 15px system-ui, sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('برای شروع یک جهت بزن!', CANVAS_PX / 2, CANVAS_PX / 2)
      }
    }

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      const st = stateRef.current
      const dt = Math.min(now - last, 100)
      last = now
      if (st.alive && runningRef.current) {
        st.acc += dt
        while (st.acc >= st.interval && st.alive) {
          st.acc -= st.interval
          step(st)
        }
      }
      draw()
    }

    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [setBest])

  return (
    <div className="h-full w-full">
      <GameShell
        emoji="🐍"
        title="مار"
        howTo="کلیدهای جهت‌دار یا WASD — روی موبایل از دکمه‌ها استفاده کن"
        stats={[
          { label: 'امتیاز', value: score },
          { label: 'رکورد', value: best },
        ]}
        onRestart={reset}
      >
        <div className="flex h-full w-full flex-col items-center justify-center gap-3">
          <div className="relative w-full max-w-[420px]">
            <canvas
              ref={canvasRef}
              width={CANVAS_PX}
              height={CANVAS_PX}
              className="block aspect-square w-full rounded-xl border border-white/10"
            />
            <Overlay
              show={gameOver}
              emoji="😵"
              title={deathBy === 'wall' ? 'ای وای! خوردی به دیوار!' : 'آخ! خودتو گاز گرفتی!'}
              subtitle={`امتیاز: ${score}`}
              onAction={reset}
            />
          </div>
          <DPad onDir={turn} />
        </div>
      </GameShell>
    </div>
  )
}
