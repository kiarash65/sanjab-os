'use client'

import { useEffect, useRef, useState } from 'react'
import { Check } from 'lucide-react'
import { GameShell, Overlay } from '@/components/os/game-shell'
import { useOS } from '@/lib/os/store'

const EMOJIS = ['🐧', '🐱', '🍕', '⚡', '🌙', '🎩', '🚀', '🧠'] as const
const PAIRS = EMOJIS.length
const BEST_KEY = 'pengo-best-memory'
const FLIP_BACK_MS = 750

interface MemoryCard {
  id: number
  emoji: string
  matched: boolean
}

const fa = (n: number): string => n.toLocaleString('fa-IR')

function buildDeck(): MemoryCard[] {
  const cards: MemoryCard[] = EMOJIS.flatMap((emoji, i) => [
    { id: i * 2, emoji, matched: false },
    { id: i * 2 + 1, emoji, matched: false },
  ])
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = cards[i]
    cards[i] = cards[j]
    cards[j] = tmp
  }
  return cards
}

export default function MemoryGame() {
  const [cards, setCards] = useState<MemoryCard[]>(buildDeck)
  const [flipped, setFlipped] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [matchedPairs, setMatchedPairs] = useState(0)
  const [seconds, setSeconds] = useState(0)
  const [started, setStarted] = useState(false)
  const [won, setWon] = useState(false)
  const [isRecord, setIsRecord] = useState(false)
  const [best, setBest] = useState<number | null>(() => {
    try {
      const raw = window.localStorage.getItem(BEST_KEY)
      if (raw !== null) {
        const n = Number(raw)
        if (Number.isFinite(n) && n > 0) return Math.floor(n)
      }
    } catch {
      /* localStorage inaccessible */
    }
    return null
  })

  const lockRef = useRef(false)
  const flipBackRef = useRef<number | null>(null)

  // Timer: starts on first flip, stops on win
  useEffect(() => {
    if (!started || won) return
    const iv = window.setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => window.clearInterval(iv)
  }, [started, won])

  // On win: persist record if fewer moves, celebrate with a toast
  const registerWin = (finalMoves: number) => {
    setWon(true)
    try {
      const raw = window.localStorage.getItem(BEST_KEY)
      const prev =
        raw !== null && Number.isFinite(Number(raw))
          ? Math.floor(Number(raw))
          : null
      if (prev === null || finalMoves < prev) {
        window.localStorage.setItem(BEST_KEY, String(finalMoves))
        setBest(finalMoves)
        setIsRecord(true)
        useOS.getState().pushToast({
          title: '🏆 رکورد جدید!',
          body: `${fa(finalMoves)} حرکت؟ حافظه‌ت خفن‌تر از رم همین سیستمه!`,
          icon: '🃏',
        })
      } else {
        setBest(prev)
      }
    } catch {
      /* localStorage inaccessible */
    }
  }

  // Clear pending flip-back timeout on unmount
  useEffect(() => {
    return () => {
      if (flipBackRef.current !== null) window.clearTimeout(flipBackRef.current)
    }
  }, [])

  const reset = () => {
    if (flipBackRef.current !== null) window.clearTimeout(flipBackRef.current)
    flipBackRef.current = null
    lockRef.current = false
    setCards(buildDeck())
    setFlipped([])
    setMoves(0)
    setMatchedPairs(0)
    setSeconds(0)
    setStarted(false)
    setWon(false)
    setIsRecord(false)
  }

  const flip = (idx: number) => {
    if (won || lockRef.current) return
    if (flipped.includes(idx) || cards[idx].matched) return
    if (!started) setStarted(true)

    const next = [...flipped, idx]
    setFlipped(next)
    if (next.length < 2) return

    const [a, b] = next
    setMoves((m) => m + 1)

    if (cards[a].emoji === cards[b].emoji) {
      const total = matchedPairs + 1
      setCards((cs) =>
        cs.map((c, i) => (i === a || i === b ? { ...c, matched: true } : c))
      )
      setFlipped([])
      setMatchedPairs(total)
      if (total === PAIRS) registerWin(moves + 1)
    } else {
      lockRef.current = true
      flipBackRef.current = window.setTimeout(() => {
        flipBackRef.current = null
        lockRef.current = false
        setFlipped([])
      }, FLIP_BACK_MS)
    }
  }

  return (
    <GameShell
      emoji="🃏"
      title="حافظه خفن"
      howTo="دوتا کارت یکسان رو پشت سر هم پیدا کن"
      stats={[
        { label: 'حرکت‌ها', value: fa(moves) },
        { label: 'جفت‌ها', value: `${fa(matchedPairs)}/${fa(PAIRS)}` },
        { label: 'زمان', value: fa(seconds) },
        { label: 'رکورد', value: best === null ? '—' : fa(best) },
      ]}
      onRestart={reset}
    >
      <div className="flex h-full w-full select-none flex-col items-center justify-center gap-3">
        <div className="grid aspect-square max-h-full w-full max-w-[380px] grid-cols-4 grid-rows-4 gap-2">
          {cards.map((card, i) => {
            const revealed = flipped.includes(i) || card.matched
            const classes = card.matched
              ? 'pengo-pop border-emerald-500/50 bg-emerald-900/50 opacity-80'
              : revealed
                ? 'pengo-pop border-white/20 bg-zinc-800'
                : 'border-white/10 bg-zinc-800/50 hover:border-white/25 hover:bg-zinc-700'
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => flip(i)}
                disabled={card.matched || won}
                aria-label={revealed ? `کارت ${card.emoji}` : 'کارت بسته'}
                className={`relative flex items-center justify-center rounded-xl border text-3xl transition-all duration-200 active:scale-95 ${classes}`}
              >
                {card.matched && (
                  <Check
                    className="absolute left-1 top-1 size-3 text-emerald-400"
                    aria-hidden
                  />
                )}
                <span aria-hidden>
                  {revealed ? card.emoji : <span className="text-2xl text-zinc-600">؟</span>}
                </span>
              </button>
            )
          })}
        </div>
        <p className="shrink-0 text-[11px] text-zinc-500">
          {won
            ? isRecord
              ? 'رکورد جدید زدی! پنگوئن بهت افتخار می‌کنه 🏆'
              : 'می‌تونی سریع‌تر هم انجامش بدی، می‌دونم 😉'
            : 'روی کارت‌ها بزن تا برن گردن'}
        </p>
      </div>
      <Overlay
        show={won}
        emoji="🎉"
        title="همه رو پیدا کردی!"
        subtitle={`با ${fa(moves)} حرکت در ${fa(seconds)} ثانیه`}
        onAction={reset}
      />
    </GameShell>
  )
}
