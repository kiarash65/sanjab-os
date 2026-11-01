'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { GameShell, Overlay } from '@/components/os/game-shell'

const CANVAS_W = 560
const CANVAS_H = 360
const PADDLE_W = 10
const PADDLE_H = 64
const PLAYER_X = 14
const AI_X = CANVAS_W - PLAYER_X - PADDLE_W
const BALL = 8
const BASE_SPEED = 4.2
const MAX_SPEED = 12
const AI_SPEED = 4.2
const KEY_SPEED = 6
const WIN_SCORE = 5
const MAX_BOUNCE = Math.PI / 3
const SERVE_DELAY = 800

interface PongState {
  playerY: number
  aiY: number
  ballX: number
  ballY: number
  vx: number
  vy: number
  speed: number
  serving: boolean
  serveAt: number
  serveDir: number
  keysUp: boolean
  keysDown: boolean
  t: number
}

const fa = (n: number): string => n.toLocaleString('fa-IR')
const clamp = (v: number, lo: number, hi: number): number =>
  Math.max(lo, Math.min(hi, v))
const readAccent = (): string => {
  try {
    const v = getComputedStyle(document.documentElement)
      .getPropertyValue('--pengo-accent')
      .trim()
    return v || '#22c55e'
  } catch {
    return '#22c55e'
  }
}

function freshState(): PongState {
  return {
    playerY: CANVAS_H / 2,
    aiY: CANVAS_H / 2,
    ballX: CANVAS_W / 2 - BALL / 2,
    ballY: CANVAS_H / 2 - BALL / 2,
    vx: 0,
    vy: 0,
    speed: BASE_SPEED,
    serving: true,
    serveAt: performance.now() + SERVE_DELAY,
    serveDir: Math.random() < 0.5 ? -1 : 1,
    keysUp: false,
    keysDown: false,
    t: 0,
  }
}

// Serve toward the last scorer after a short pause
function startServe(st: PongState, dir: number): void {
  st.serving = true
  st.serveDir = dir
  st.serveAt = performance.now() + SERVE_DELAY
  st.ballX = CANVAS_W / 2 - BALL / 2
  st.ballY = CANVAS_H / 2 - BALL / 2
  st.vx = 0
  st.vy = 0
  st.speed = BASE_SPEED
}

export default function PongGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const stateRef = useRef<PongState>(freshState())
  const scoreRef = useRef({ player: 0, ai: 0 })
  const accentRef = useRef<string>('#22c55e')
  const [playerScore, setPlayerScore] = useState(0)
  const [aiScore, setAiScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)

  // Accent color for the AI paddle (read once, refreshed on restart)
  useEffect(() => {
    accentRef.current = readAccent()
  }, [])

  const movePaddle = useCallback((e: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    if (rect.height <= 0) return
    const y = ((e.clientY - rect.top) / rect.height) * CANVAS_H
    const st = stateRef.current
    st.playerY = clamp(y, PADDLE_H / 2, CANVAS_H - PADDLE_H / 2)
  }, [])

  // Keyboard control on window (OS rule: preventDefault handled keys)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        stateRef.current.keysUp = true
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        stateRef.current.keysDown = true
      }
    }
    const up = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') stateRef.current.keysUp = false
      else if (e.key === 'ArrowDown') stateRef.current.keysDown = false
    }
    const clearKeys = () => {
      stateRef.current.keysUp = false
      stateRef.current.keysDown = false
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', clearKeys)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', clearKeys)
    }
  }, [])

  // Main loop — paused while game over
  useEffect(() => {
    if (gameOver) return
    let raf = 0

    const update = () => {
      const st = stateRef.current
      st.t += 1

      // Player paddle via held keys
      if (st.keysUp) st.playerY -= KEY_SPEED
      if (st.keysDown) st.playerY += KEY_SPEED
      st.playerY = clamp(st.playerY, PADDLE_H / 2, CANVAS_H - PADDLE_H / 2)

      // AI penguin: chases the ball with a sinusoidal mistake
      const chasing = st.vx > 0 && !st.serving
      const wobble = Math.sin(st.t / 34) * 16
      const target = chasing ? st.ballY + wobble : CANVAS_H / 2
      const step = chasing ? AI_SPEED : AI_SPEED / 2
      st.aiY = clamp(
        st.aiY + clamp(target - st.aiY, -step, step),
        PADDLE_H / 2,
        CANVAS_H - PADDLE_H / 2
      )

      // Serve countdown
      if (st.serving) {
        if (performance.now() >= st.serveAt) {
          st.serving = false
          const angle = Math.random() * (Math.PI / 6) - Math.PI / 12
          st.vx = Math.cos(angle) * st.speed * st.serveDir
          st.vy = Math.sin(angle) * st.speed
        }
        return
      }

      // Ball motion
      st.ballX += st.vx
      st.ballY += st.vy

      // Top / bottom walls
      if (st.ballY <= 0) {
        st.ballY = 0
        st.vy = Math.abs(st.vy)
      } else if (st.ballY >= CANVAS_H - BALL) {
        st.ballY = CANVAS_H - BALL
        st.vy = -Math.abs(st.vy)
      }

      // Player paddle (left)
      if (
        st.vx < 0 &&
        st.ballX <= PLAYER_X + PADDLE_W &&
        st.ballX + BALL >= PLAYER_X &&
        st.ballY + BALL >= st.playerY - PADDLE_H / 2 &&
        st.ballY <= st.playerY + PADDLE_H / 2
      ) {
        const offset = clamp(
          (st.ballY + BALL / 2 - st.playerY) / (PADDLE_H / 2),
          -1,
          1
        )
        st.speed = Math.min(MAX_SPEED, st.speed + 0.25)
        const angle = offset * MAX_BOUNCE
        st.vx = Math.cos(angle) * st.speed
        st.vy = Math.sin(angle) * st.speed
        st.ballX = PLAYER_X + PADDLE_W
      }

      // AI paddle (right)
      if (
        st.vx > 0 &&
        st.ballX + BALL >= AI_X &&
        st.ballX <= AI_X + PADDLE_W &&
        st.ballY + BALL >= st.aiY - PADDLE_H / 2 &&
        st.ballY <= st.aiY + PADDLE_H / 2
      ) {
        const offset = clamp(
          (st.ballY + BALL / 2 - st.aiY) / (PADDLE_H / 2),
          -1,
          1
        )
        st.speed = Math.min(MAX_SPEED, st.speed + 0.25)
        const angle = offset * MAX_BOUNCE
        st.vx = -Math.cos(angle) * st.speed
        st.vy = Math.sin(angle) * st.speed
        st.ballX = AI_X - BALL
      }

      // Scoring: past left → پنگوئن scores, past right → شما score
      if (st.ballX < -BALL) {
        scoreRef.current.ai += 1
        setAiScore(scoreRef.current.ai)
        if (scoreRef.current.ai >= WIN_SCORE) {
          setGameOver(true)
          return
        }
        startServe(st, 1)
      } else if (st.ballX > CANVAS_W + BALL) {
        scoreRef.current.player += 1
        setPlayerScore(scoreRef.current.player)
        if (scoreRef.current.player >= WIN_SCORE) {
          setGameOver(true)
          return
        }
        startServe(st, -1)
      }
    }

    const draw = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const st = stateRef.current

      ctx.fillStyle = '#0a0f0a'
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

      // Center dashed line
      ctx.strokeStyle = 'rgba(255,255,255,0.15)'
      ctx.lineWidth = 2
      ctx.setLineDash([8, 10])
      ctx.beginPath()
      ctx.moveTo(CANVAS_W / 2, 0)
      ctx.lineTo(CANVAS_W / 2, CANVAS_H)
      ctx.stroke()
      ctx.setLineDash([])

      // Faint big scores
      ctx.fillStyle = 'rgba(255,255,255,0.08)'
      ctx.font = 'bold 46px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(fa(scoreRef.current.player), CANVAS_W / 4, 44)
      ctx.fillText(fa(scoreRef.current.ai), (CANVAS_W * 3) / 4, 44)

      // AI paddle in accent color
      ctx.fillStyle = accentRef.current
      ctx.fillRect(AI_X, st.aiY - PADDLE_H / 2, PADDLE_W, PADDLE_H)

      // Player paddle (white-ish)
      ctx.fillStyle = '#f4f4f5'
      ctx.fillRect(PLAYER_X, st.playerY - PADDLE_H / 2, PADDLE_W, PADDLE_H)

      // Ball (white square)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(st.ballX, st.ballY, BALL, BALL)

      // Penguin mascot near the AI paddle
      ctx.font = '18px system-ui, sans-serif'
      ctx.textAlign = 'right'
      ctx.textBaseline = 'top'
      ctx.fillText('🐧', CANVAS_W - 10, 10)
    }

    const step = () => {
      update()
      draw()
      raf = window.requestAnimationFrame(step)
    }
    raf = window.requestAnimationFrame(step)
    return () => window.cancelAnimationFrame(raf)
  }, [gameOver])

  const reset = useCallback(() => {
    stateRef.current = freshState()
    stateRef.current.serveAt = performance.now() + SERVE_DELAY
    scoreRef.current = { player: 0, ai: 0 }
    accentRef.current = readAccent()
    setPlayerScore(0)
    setAiScore(0)
    setGameOver(false)
  }, [])

  const playerWon = playerScore >= WIN_SCORE && playerScore > aiScore

  return (
    <GameShell
      emoji="🏓"
      title="پینگ‌پنگ"
      howTo="موس/انگشت روی زمین بازی بکش یا از کلیدهای بالا/پایین استفاده کن — اولین نفر به ۵ امتیاز"
      stats={[
        { label: 'شما', value: fa(playerScore) },
        { label: 'پنگوئن', value: fa(aiScore) },
      ]}
      onRestart={reset}
    >
      <div className="flex h-full w-full select-none flex-col items-center justify-center gap-3">
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          onPointerMove={movePaddle}
          onPointerDown={movePaddle}
          className="pengo-pop w-full max-w-[520px] touch-none rounded-xl border border-white/10 bg-[#0a0f0a]"
        />
        <p className="shrink-0 text-[11px] text-zinc-500">
          {gameOver
            ? 'بازی تموم شد! دکمه دوباره منتظرته 🔄'
            : 'پنگوئن داره تمرکز می‌کنه… سوتیش نده 🐧'}
        </p>
      </div>
      <Overlay
        show={gameOver}
        emoji={playerWon ? '🏆' : '🐧'}
        title={
          playerWon ? 'بردی! پنگوئن کلافه شد' : 'پنگوئن برد! میو نمی‌گویم، می‌گویم میو'
        }
        subtitle={
          playerWon
            ? `${fa(playerScore)} به ${fa(aiScore)} — معلومه کی مربی حرفه‌ایه!`
            : `${fa(aiScore)} به ${fa(playerScore)} — دفعه بعد بکشش کف زمین!`
        }
        onAction={reset}
      />
    </GameShell>
  )
}
