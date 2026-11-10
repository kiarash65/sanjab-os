'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { GameShell, Overlay, useBestScore } from '@/components/os/game-shell'
import { useOS } from '@/lib/os/store'

const W = 560
const H = 400
const COLS = 8
const ROWS = 5
const BRICK_W = 62
const BRICK_H = 18
const BRICK_TOP = 50
const GAP_X = 2
const GAP_Y = 6
const BRICK_LEFT = (W - (COLS * BRICK_W + (COLS - 1) * GAP_X)) / 2
const PADDLE_W = 80
const PADDLE_H = 10
const PADDLE_Y = H - 26
const BALL_R = 7
const BASE_SPEED = 4.5
const SPEED_PER_LEVEL = 0.4
const SERVE_MS = 900
const ROW_COLORS = ['#fb7185', '#fb923c', '#f59e0b', '#22c55e', '#14b8a6']

type Brick = { x: number; y: number; color: string; alive: boolean }

type BreakoutState = {
  paddleX: number
  ballX: number
  ballY: number
  vx: number
  vy: number
  speed: number
  launched: boolean
  serveUntil: number
  bricks: Brick[]
}

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v))

const getAccent = (): string => {
  if (typeof window === 'undefined') return '#22c55e'
  const raw = window.getComputedStyle(document.documentElement).getPropertyValue('--pengo-accent').trim()
  return raw.length > 0 ? raw : '#22c55e'
}

const makeBricks = (): Brick[] => {
  const bricks: Brick[] = []
  for (let r = 0; r < ROWS; r += 1) {
    for (let c = 0; c < COLS; c += 1) {
      bricks.push({
        x: BRICK_LEFT + c * (BRICK_W + GAP_X),
        y: BRICK_TOP + r * (BRICK_H + GAP_Y),
        color: ROW_COLORS[r % ROW_COLORS.length],
        alive: true,
      })
    }
  }
  return bricks
}

const speedForLevel = (level: number): number => BASE_SPEED + SPEED_PER_LEVEL * (level - 1)

const freshBreakout = (level: number): BreakoutState => {
  const now = typeof performance === 'undefined' ? 0 : performance.now()
  return {
    paddleX: W / 2,
    ballX: W / 2,
    ballY: PADDLE_Y - BALL_R - 2,
    vx: 0,
    vy: 0,
    speed: speedForLevel(level),
    launched: false,
    serveUntil: now + SERVE_MS,
    bricks: makeBricks(),
  }
}

const launchBall = (s: BreakoutState): void => {
  const angle = Math.random() * 0.7 - 0.35
  s.vx = Math.sin(angle) * s.speed
  s.vy = -Math.cos(angle) * s.speed
  s.launched = true
}

const rrect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void => {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

export default function BreakoutGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const stateRef = useRef<BreakoutState>(freshBreakout(1))
  const rafRef = useRef(0)
  const overRef = useRef(false)
  const scoreRef = useRef(0)
  const livesRef = useRef(3)
  const levelRef = useRef(1)
  const keysRef = useRef<{ left: boolean; right: boolean }>({ left: false, right: false })

  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [level, setLevel] = useState(1)
  const [gameOver, setGameOver] = useState(false)
  const [best, setBest] = useBestScore('breakout')

  const update = useCallback((now: number): void => {
    const s = stateRef.current
    if (overRef.current) return

    // حرکت راکت با کیبورد
    if (keysRef.current.left) s.paddleX -= 7
    if (keysRef.current.right) s.paddleX += 7
    s.paddleX = clamp(s.paddleX, PADDLE_W / 2 + 6, W - PADDLE_W / 2 - 6)

    // حالت سرو: توپ روی راکت می‌چسبد تا زمان پرتاب
    if (!s.launched) {
      s.ballX = s.paddleX
      s.ballY = PADDLE_Y - BALL_R - 2
      if (now >= s.serveUntil) launchBall(s)
      return
    }

    s.ballX += s.vx
    s.ballY += s.vy

    // دیواره‌ها
    if (s.ballX - BALL_R < 0) {
      s.ballX = BALL_R
      s.vx = Math.abs(s.vx)
    }
    if (s.ballX + BALL_R > W) {
      s.ballX = W - BALL_R
      s.vx = -Math.abs(s.vx)
    }
    if (s.ballY - BALL_R < 0) {
      s.ballY = BALL_R
      s.vy = Math.abs(s.vy)
    }

    // برخورد با راکت، زاویه بسته به محل برخورد
    if (
      s.vy > 0 &&
      s.ballY + BALL_R >= PADDLE_Y &&
      s.ballY - BALL_R <= PADDLE_Y + PADDLE_H &&
      s.ballX >= s.paddleX - PADDLE_W / 2 - BALL_R &&
      s.ballX <= s.paddleX + PADDLE_W / 2 + BALL_R
    ) {
      const t = clamp((s.ballX - s.paddleX) / (PADDLE_W / 2), -1, 1)
      const angle = t * (Math.PI / 3)
      s.vx = Math.sin(angle) * s.speed
      s.vy = -Math.cos(angle) * s.speed
      s.ballY = PADDLE_Y - BALL_R
    }

    // برخورد با آجرها
    for (const b of s.bricks) {
      if (!b.alive) continue
      const cx = clamp(s.ballX, b.x, b.x + BRICK_W)
      const cy = clamp(s.ballY, b.y, b.y + BRICK_H)
      const dx = s.ballX - cx
      const dy = s.ballY - cy
      if (dx * dx + dy * dy <= BALL_R * BALL_R) {
        b.alive = false
        scoreRef.current += 10
        setScore(scoreRef.current)
        if (Math.abs(dx) > Math.abs(dy)) {
          s.vx = dx >= 0 ? Math.abs(s.vx) : -Math.abs(s.vx)
        } else {
          s.vy = dy >= 0 ? Math.abs(s.vy) : -Math.abs(s.vy)
        }
        break
      }
    }

    // مرحله تمام!
    if (s.bricks.every((b) => !b.alive)) {
      levelRef.current += 1
      setLevel(levelRef.current)
      s.speed = speedForLevel(levelRef.current)
      s.bricks = makeBricks()
      s.launched = false
      s.vx = 0
      s.vy = 0
      s.serveUntil = now + SERVE_MS
      useOS.getState().pushToast({
        title: `مرحله ${levelRef.current}!`,
        body: 'توپ عصبانی‌تر شد 🔥',
        icon: '🔥',
      })
      return
    }

    // توپ افتاد
    if (s.ballY - BALL_R > H) {
      livesRef.current -= 1
      setLives(livesRef.current)
      if (livesRef.current <= 0) {
        overRef.current = true
        setGameOver(true)
        setBest(scoreRef.current)
      } else {
        s.launched = false
        s.vx = 0
        s.vy = 0
        s.serveUntil = now + SERVE_MS
      }
    }
  }, [setBest])

  const draw = useCallback((ctx: CanvasRenderingContext2D): void => {
    const s = stateRef.current

    const bg = ctx.createLinearGradient(0, 0, 0, H)
    bg.addColorStop(0, '#18181b')
    bg.addColorStop(1, '#0a0a0b')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)

    // آجرها
    for (const b of s.bricks) {
      if (!b.alive) continue
      ctx.fillStyle = b.color
      rrect(ctx, b.x, b.y, BRICK_W, BRICK_H, 4)
      ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.16)'
      ctx.fillRect(b.x + 3, b.y + 3, BRICK_W - 6, 4)
    }

    // راکت
    ctx.fillStyle = getAccent()
    rrect(ctx, s.paddleX - PADDLE_W / 2, PADDLE_Y, PADDLE_W, PADDLE_H, 5)
    ctx.fill()

    // توپ
    ctx.save()
    ctx.shadowColor = 'rgba(250,250,250,0.55)'
    ctx.shadowBlur = 12
    ctx.fillStyle = '#fafafa'
    ctx.beginPath()
    ctx.arc(s.ballX, s.ballY, BALL_R, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    if (!s.launched && !overRef.current) {
      ctx.fillStyle = 'rgba(255,255,255,0.7)'
      ctx.font = 'bold 16px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('آماده‌باش... توپ داره میاد!', W / 2, H / 2 + 40)
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const loop = (now: number): void => {
      update(now)
      draw(ctx)
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [update, draw])

  useEffect(() => {
    const down = (e: KeyboardEvent): void => {
      if (e.code === 'ArrowLeft') {
        e.preventDefault()
        keysRef.current.left = true
      } else if (e.code === 'ArrowRight') {
        e.preventDefault()
        keysRef.current.right = true
      }
    }
    const up = (e: KeyboardEvent): void => {
      if (e.code === 'ArrowLeft') keysRef.current.left = false
      else if (e.code === 'ArrowRight') keysRef.current.right = false
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  const movePaddleTo = (e: ReactPointerEvent<HTMLCanvasElement>): void => {
    if (overRef.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * W
    stateRef.current.paddleX = clamp(x, PADDLE_W / 2 + 6, W - PADDLE_W / 2 - 6)
  }

  const reset = useCallback((): void => {
    scoreRef.current = 0
    livesRef.current = 3
    levelRef.current = 1
    overRef.current = false
    keysRef.current.left = false
    keysRef.current.right = false
    setScore(0)
    setLives(3)
    setLevel(1)
    setGameOver(false)
    stateRef.current = freshBreakout(1)
  }, [])

  return (
    <GameShell
      emoji="🧱"
      title="آجرشکن"
      howTo="موس/انگشت یا کلیدهای چپ/راست، توپ رو نذار بیفته!"
      stats={[
        { label: 'امتیاز', value: score },
        { label: 'جان', value: '❤️'.repeat(lives) },
        { label: 'مرحله', value: level },
        { label: 'رکورد', value: best },
      ]}
      onRestart={reset}
    >
      <div className="relative flex h-full w-full items-center justify-center p-3">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          onPointerMove={movePaddleTo}
          onPointerDown={movePaddleTo}
          aria-label="بازی آجرشکن"
          className="h-auto w-full max-w-[520px] touch-none select-none rounded-xl border border-white/10"
        />
        <Overlay
          show={gameOver}
          emoji="💀"
          title="باختی!"
          subtitle={`امتیاز: ${score}، رکورد: ${best}`}
          onAction={reset}
        />
      </div>
    </GameShell>
  )
}
