'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { GameShell, Overlay, useBestScore } from '@/components/os/game-shell'

const HOLES = 9
const ROUND_TIME = 30
const SPAWN_MS = 650
const TICK_MS = 100
const FLASH_MS = 250
const GOLDEN_CHANCE = 0.18
const MIN_HIDE_MS = 750
const MAX_HIDE_MS = 1100

type Mole = { id: number; hole: number; golden: boolean; hideAt: number }
type Flash = { hole: number; until: number }
type Phase = 'idle' | 'running' | 'over'

export default function WhackamoleGame() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [score, setScore] = useState(0)
  const [time, setTime] = useState(ROUND_TIME)
  const [moles, setMoles] = useState<Mole[]>([])
  const [flashes, setFlashes] = useState<Flash[]>([])
  const [best, setBest] = useBestScore('whack')

  const idRef = useRef(0)
  const hitRef = useRef<Set<number>>(new Set())
  const scoreRef = useRef(0)
  const timeRef = useRef(ROUND_TIME)
  const holeRefs = useRef<Array<HTMLButtonElement | null>>([])

  const startRound = useCallback((): void => {
    idRef.current = 0
    hitRef.current = new Set()
    scoreRef.current = 0
    timeRef.current = ROUND_TIME
    setScore(0)
    setTime(ROUND_TIME)
    setMoles([])
    setFlashes([])
    setPhase('running')
  }, [])

  const endRound = useCallback((): void => {
    setPhase('over')
    setMoles([])
    setFlashes([])
    setBest(scoreRef.current)
  }, [setBest])

  // اسپاونر موش‌ها + جمع‌کن موش‌های منقضی‌شده
  useEffect(() => {
    if (phase !== 'running') return

    const spawner = window.setInterval(() => {
      setMoles((prev) => {
        const occupied = new Set(prev.map((m) => m.hole))
        const free: number[] = []
        for (let i = 0; i < HOLES; i += 1) {
          if (!occupied.has(i)) free.push(i)
        }
        if (free.length === 0) return prev
        const hole = free[Math.floor(Math.random() * free.length)]
        const golden = Math.random() < GOLDEN_CHANCE
        const hideAt =
          Date.now() + MIN_HIDE_MS + Math.floor(Math.random() * (MAX_HIDE_MS - MIN_HIDE_MS + 1))
        idRef.current += 1
        return [...prev, { id: idRef.current, hole, golden, hideAt }]
      })
    }, SPAWN_MS)

    const reaper = window.setInterval(() => {
      const now = Date.now()
      setMoles((prev) => {
        const alive = prev.filter((m) => m.hideAt > now)
        return alive.length === prev.length ? prev : alive
      })
      setFlashes((prev) => {
        const alive = prev.filter((f) => f.until > now)
        return alive.length === prev.length ? prev : alive
      })
    }, TICK_MS)

    return () => {
      window.clearInterval(spawner)
      window.clearInterval(reaper)
    }
  }, [phase])

  // شمارش معکوس ۳۰ ثانیه‌ای
  useEffect(() => {
    if (phase !== 'running') return
    const timer = window.setInterval(() => {
      timeRef.current -= 1
      setTime(timeRef.current)
      if (timeRef.current <= 0) endRound()
    }, 1000)
    return () => window.clearInterval(timer)
  }, [phase, endRound])

  // تکون کوچولوی سوراخ خالی (بدون کلیدکید CSS اضافه)
  const pokeHole = useCallback((h: number): void => {
    const el = holeRefs.current[h]
    if (!el || typeof el.animate !== 'function') return
    el.animate(
      [
        { transform: 'translateX(0px)' },
        { transform: 'translateX(-5px)' },
        { transform: 'translateX(5px)' },
        { transform: 'translateX(0px)' },
      ],
      { duration: 160, iterations: 2 },
    )
  }, [])

  const handleHoleClick = (h: number): void => {
    if (phase !== 'running') return
    const mole = moles.find((m) => m.hole === h)
    if (!mole) {
      pokeHole(h)
      return
    }
    // جلوگیری از دوبار شمردن یک موش
    if (hitRef.current.has(mole.id)) return
    hitRef.current.add(mole.id)
    scoreRef.current += mole.golden ? 5 : 1
    setScore(scoreRef.current)
    setMoles((prev) => prev.filter((m) => m.id !== mole.id))
    setFlashes((prev) => [...prev, { hole: h, until: Date.now() + FLASH_MS }])
  }

  const rankText =
    score < 10 ? 'موش‌کوب تازه‌کار 🐣' : score < 20 ? 'موش‌کوب حرفه‌ای 🔧' : 'افسانه‌ی موش‌ها! 👑'

  return (
    <GameShell
      emoji="🔨"
      title="موش‌کوبی"
      howTo="روی موش‌ها بزن! موش طلایی ۵ امتیاز می‌ارزه"
      stats={[
        { label: 'امتیاز', value: score },
        { label: 'زمان', value: time },
        { label: 'رکورد', value: best },
      ]}
      onRestart={startRound}
    >
      <div className="relative flex h-full w-full flex-col items-center justify-center gap-4 p-4">
        <div className="grid aspect-square w-full max-w-[360px] grid-cols-3 grid-rows-3 gap-2">
          {Array.from({ length: HOLES }, (_, h) => {
            const mole = moles.find((m) => m.hole === h)
            const flash = flashes.find((f) => f.hole === h)
            return (
              <button
                key={h}
                ref={(el) => {
                  holeRefs.current[h] = el
                }}
                type="button"
                onClick={() => handleHoleClick(h)}
                aria-label={`سوراخ شماره ${h + 1}`}
                className="relative flex cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 transition hover:border-white/25 active:scale-95"
              >
                <span className="absolute inset-x-4 bottom-2.5 h-2.5 rounded-full bg-zinc-950" />
                {mole ? (
                  <span
                    className={`animate-[pengo-pop_0.2s_ease-out] rounded-full p-1 text-4xl leading-none ${
                      mole.golden ? 'bg-amber-500/10 ring-2 ring-amber-400' : ''
                    }`}
                  >
                    🐹
                  </span>
                ) : flash ? (
                  <span className="animate-[pengo-pop_0.15s_ease-out] text-3xl leading-none">💥</span>
                ) : null}
              </button>
            )
          })}
        </div>

        {phase === 'idle' ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-zinc-950/75 backdrop-blur-sm">
            <Button
              size="lg"
              onClick={startRound}
              className="cursor-pointer bg-[var(--pengo-accent)] text-zinc-950 hover:bg-[var(--pengo-accent)] hover:opacity-90 active:scale-95"
            >
              شروع بازی 🔨
            </Button>
          </div>
        ) : null}

        <Overlay
          show={phase === 'over'}
          emoji="⏰"
          title="تموم شد!"
          subtitle={`امتیاز: ${score} — ${rankText}`}
          onAction={startRound}
        />
      </div>
    </GameShell>
  )
}
