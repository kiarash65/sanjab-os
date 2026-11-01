'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { GameShell, Overlay, useBestScore } from '@/components/os/game-shell'
const W = 420
const H = 560
const GROUND_H = 60
const PIPE_W = 64
const PIPE_GAP = 150
const GRAVITY = 0.45
const FLAP_VY = -7.6
const PIPE_SPEED = 2.6
const SPAWN_EVERY = 92
const BIRD_X = 110
const BIRD_R = 12
const MAX_ROT = Math.PI / 7.2 // ~25 degrees

type Pipe = { x: number; gapY: number; passed: boolean }

type FlappyState = {
  birdY: number
  vy: number
  rot: number
  pipes: Pipe[]
  frame: number
  score: number
}

type Star = { x: number; y: number; r: number; a: number }

const STARS: Star[] = [
  { x: 36, y: 54, r: 1.6, a: 0.9 },
  { x: 86, y: 132, r: 1.1, a: 0.6 },
  { x: 142, y: 70, r: 1.3, a: 0.8 },
  { x: 198, y: 152, r: 1.0, a: 0.5 },
  { x: 250, y: 46, r: 1.5, a: 0.85 },
  { x: 302, y: 172, r: 1.1, a: 0.55 },
  { x: 372, y: 38, r: 1.2, a: 0.7 },
  { x: 396, y: 122, r: 1.4, a: 0.8 },
  { x: 62, y: 222, r: 1.0, a: 0.45 },
  { x: 172, y: 252, r: 1.2, a: 0.5 },
  { x: 270, y: 212, r: 1.0, a: 0.4 },
  { x: 334, y: 262, r: 1.3, a: 0.6 },
  { x: 404, y: 232, r: 1.0, a: 0.5 },
  { x: 120, y: 182, r: 0.9, a: 0.4 },
]

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v))

const getAccent = (): string => {
  if (typeof window === 'undefined') return '#22c55e'
  const raw = window.getComputedStyle(document.documentElement).getPropertyValue('--pengo-accent').trim()
  return raw.length > 0 ? raw : '#22c55e'
}

const freshFlappy = (): FlappyState => ({
  birdY: H * 0.42,
  vy: 0,
  rot: 0,
  pipes: [],
  frame: 0,
  score: 0,
})

export default function FlappyGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const stateRef = useRef<FlappyState>(freshFlappy())
  const rafRef = useRef(0)
  const startedRef = useRef(false)
  const overRef = useRef(false)

  const [started, setStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [best, setBest] = useBestScore('flappy')

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const die = (): void => {
      if (overRef.current) return
      overRef.current = true
      setGameOver(true)
      setScore(stateRef.current.score)
      setBest(stateRef.current.score)
    }

    const update = (): void => {
      const s = stateRef.current
      if (!startedRef.current) return

      if (overRef.current) {
        // مرگ: پنگوئن با چاشنی نمایش، تا زمین سقوط می‌کند
        const limit = H - GROUND_H - BIRD_R
        if (s.birdY < limit) {
          s.vy += GRAVITY
          s.birdY = Math.min(s.birdY + s.vy, limit)
          s.rot = Math.min(s.rot + 0.09, Math.PI / 2)
        }
        return
      }

      s.frame += 1
      s.vy += GRAVITY
      s.birdY += s.vy
      s.rot = clamp(s.vy * 0.06, -MAX_ROT, MAX_ROT)

      if (s.birdY - BIRD_R < 0) {
        s.birdY = BIRD_R
        s.vy = 0
      }

      if (s.frame % SPAWN_EVERY === 0) {
        const groundY = H - GROUND_H
        const margin = 90
        s.pipes.push({
          x: W + 20,
          gapY: margin + Math.random() * (groundY - margin * 2),
          passed: false,
        })
      }

      s.pipes = s.pipes.map((p) => ({ ...p, x: p.x - PIPE_SPEED })).filter((p) => p.x + PIPE_W > -12)

      for (const p of s.pipes) {
        if (!p.passed && p.x + PIPE_W < BIRD_X - BIRD_R) {
          p.passed = true
          s.score += 1
          setScore(s.score)
        }
      }

      const groundY = H - GROUND_H
      const bl = BIRD_X - BIRD_R
      const br = BIRD_X + BIRD_R
      const bt = s.birdY - BIRD_R
      const bb = s.birdY + BIRD_R

      for (const p of s.pipes) {
        const overlapX = br > p.x && bl < p.x + PIPE_W
        if (!overlapX) continue
        const topH = p.gapY - PIPE_GAP / 2
        const botY = p.gapY + PIPE_GAP / 2
        if (bt < topH || bb > botY) {
          die()
          return
        }
      }

      if (bb >= groundY) {
        s.birdY = groundY - BIRD_R
        die()
      }
    }

    const draw = (): void => {
      const s = stateRef.current
      const groundY = H - GROUND_H

      // آسمان شب
      const sky = ctx.createLinearGradient(0, 0, 0, H)
      sky.addColorStop(0, '#141417')
      sky.addColorStop(1, '#1e1e23')
      ctx.fillStyle = sky
      ctx.fillRect(0, 0, W, H)

      // ستاره‌ها (موقعیت ثابت)
      for (const st of STARS) {
        ctx.globalAlpha = st.a
        ctx.fillStyle = '#e4e4e7'
        ctx.beginPath()
        ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1

      // ماه
      ctx.save()
      ctx.shadowColor = 'rgba(244,244,245,0.55)'
      ctx.shadowBlur = 24
      ctx.fillStyle = '#e4e4e7'
      ctx.beginPath()
      ctx.arc(342, 88, 26, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()

      // لوله‌ها
      const accent = getAccent()
      for (const p of s.pipes) {
        const topH = p.gapY - PIPE_GAP / 2
        const botY = p.gapY + PIPE_GAP / 2
        ctx.fillStyle = accent
        ctx.fillRect(p.x, 0, PIPE_W, topH)
        ctx.fillRect(p.x, botY, PIPE_W, groundY - botY)
        ctx.fillStyle = 'rgba(0,0,0,0.28)'
        ctx.fillRect(p.x - 4, topH - 16, PIPE_W + 8, 16)
        ctx.fillRect(p.x - 4, botY, PIPE_W + 8, 16)
      }

      // زمین
      ctx.fillStyle = '#27272a'
      ctx.fillRect(0, groundY, W, GROUND_H)
      ctx.fillStyle = '#3f3f46'
      ctx.fillRect(0, groundY, W, 4)

      // پنگوئن
      ctx.save()
      ctx.translate(BIRD_X, s.birdY)
      ctx.rotate(s.rot)
      ctx.font = '28px serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('🐧', 0, 0)
      ctx.restore()

      // متن‌ها
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      if (!startedRef.current) {
        ctx.fillStyle = 'rgba(255,255,255,0.95)'
        ctx.font = 'bold 30px system-ui, sans-serif'
        ctx.fillText('آماده‌ای؟', W / 2, H / 2 - 110)
        ctx.fillStyle = 'rgba(255,255,255,0.72)'
        ctx.font = 'bold 20px system-ui, sans-serif'
        ctx.fillText('برای شروع بزن!', W / 2, H / 2 - 72)
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.92)'
        ctx.font = 'bold 36px system-ui, sans-serif'
        ctx.fillText(String(s.score), W / 2, 60)
      }
    }

    const loop = (): void => {
      update()
      draw()
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [setBest])

  const flap = useCallback((): void => {
    if (overRef.current) return
    if (!startedRef.current) {
      startedRef.current = true
      setStarted(true)
    }
    stateRef.current.vy = FLAP_VY
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault()
        flap()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [flap])

  const reset = useCallback((): void => {
    stateRef.current = freshFlappy()
    startedRef.current = false
    overRef.current = false
    setStarted(false)
    setGameOver(false)
    setScore(0)
  }, [])

  return (
    <GameShell
      emoji="🐤"
      title="پنگوئن پرنده"
      howTo="کلیک/لمس یا Space — بپر و از لوله‌ها رد شو!"
      stats={[
        { label: 'امتیاز', value: score },
        { label: 'رکورد', value: best },
      ]}
      onRestart={reset}
    >
      <div className="relative flex h-full w-full items-center justify-center p-3">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          onPointerDown={flap}
          aria-label={started ? 'پنگوئن پرنده — بازی در جریان' : 'پنگوئن پرنده — برای شروع بزن'}
          className="h-auto w-full max-w-[380px] touch-none select-none rounded-xl border border-white/10"
        />
        <Overlay
          show={gameOver}
          emoji="💀"
          title="آخ! خوردی به لوله!"
          subtitle={`امتیاز: ${score} — رکورد: ${best}`}
          onAction={reset}
        />
      </div>
    </GameShell>
  )
}
