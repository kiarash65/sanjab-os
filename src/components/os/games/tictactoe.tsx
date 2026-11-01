'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { GameShell } from '@/components/os/game-shell'
import { useOS } from '@/lib/os/store'

type Mark = 'X' | 'O'
type Cell = Mark | null

interface Result {
  over: boolean
  winner: Mark | null
  line: readonly number[] | null
}

const LINES: readonly (readonly [number, number, number])[] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
]

const AI_THINK_MS = 450
const AI_BLUNDER_CHANCE = 0.25

function emptyBoard(): Cell[] {
  return [null, null, null, null, null, null, null, null, null]
}

function winnerOf(cells: readonly Cell[]): { winner: Mark | null; line: readonly number[] | null } {
  for (const line of LINES) {
    const [i, j, k] = line
    const v = cells[i]
    if (v !== null && v === cells[j] && v === cells[k]) {
      return { winner: v, line }
    }
  }
  return { winner: null, line: null }
}

// مینیمکس کامل — پنگوئنِ بی‌رحم
function minimax(cells: Cell[], current: Mark, me: Mark, depth: number): number {
  const res = winnerOf(cells)
  if (res.winner !== null) return res.winner === me ? 10 - depth : depth - 10
  if (cells.every((v) => v !== null)) return 0

  const maximizing = current === me
  let best = maximizing ? -Infinity : Infinity
  for (let i = 0; i < 9; i++) {
    if (cells[i] !== null) continue
    cells[i] = current
    const s = minimax(cells, current === 'X' ? 'O' : 'X', me, depth + 1)
    cells[i] = null
    if (maximizing) best = Math.max(best, s)
    else best = Math.min(best, s)
  }
  return best
}

function bestMove(cells: readonly Cell[], me: Mark): number {
  const work: Cell[] = [...cells]
  let bestScore = -Infinity
  let move = -1
  for (let i = 0; i < 9; i++) {
    if (work[i] !== null) continue
    work[i] = me
    const s = minimax(work, me === 'X' ? 'O' : 'X', me, 1)
    work[i] = null
    if (s > bestScore) {
      bestScore = s
      move = i
    }
  }
  return move
}

function statusText(result: Result, thinking: boolean): { text: string; cls: string } {
  if (result.over) {
    if (result.winner === 'X') return { text: 'بردی! 🎉', cls: 'text-emerald-400' }
    if (result.winner === 'O') return { text: 'پنگوئن برد! 🐧', cls: 'text-rose-400' }
    return { text: 'مساوی! 🤝', cls: 'text-zinc-400' }
  }
  if (thinking) {
    return { text: 'پنگوئن داره فکر می‌کنه… 🤔', cls: 'text-amber-300 animate-pulse' }
  }
  return { text: 'نوبت شما ✕', cls: 'text-zinc-300' }
}

export default function TicTacToeGame() {
  const [board, setBoard] = useState<Cell[]>(emptyBoard)
  const [thinking, setThinking] = useState(false)
  const [result, setResult] = useState<Result>({ over: false, winner: null, line: null })
  const [tally, setTally] = useState({ player: 0, ai: 0, draw: 0 })
  const boardRef = useRef<Cell[]>(emptyBoard())
  const timerRef = useRef<number | null>(null)

  const finishGame = useCallback((cells: Cell[]) => {
    boardRef.current = cells
    setBoard(cells)
    const res = winnerOf(cells)
    const full = cells.every((v) => v !== null)
    if (res.winner === 'X') {
      setResult({ over: true, winner: 'X', line: res.line })
      setTally((t) => ({ ...t, player: t.player + 1 }))
      useOS.getState().pushToast({
        icon: '🏆',
        title: 'پنگوئن را شکستی!',
        body: 'خیلی خفنی. یه دور دیگه؟',
      })
    } else if (res.winner === 'O') {
      setResult({ over: true, winner: 'O', line: res.line })
      setTally((t) => ({ ...t, ai: t.ai + 1 }))
    } else if (full) {
      setResult({ over: true, winner: null, line: null })
      setTally((t) => ({ ...t, draw: t.draw + 1 }))
    } else {
      setResult({ over: false, winner: null, line: null })
    }
  }, [])

  const play = useCallback(
    (i: number) => {
      if (thinking || result.over) return
      if (timerRef.current !== null) return
      if (boardRef.current[i] !== null) return

      const afterPlayer: Cell[] = [...boardRef.current]
      afterPlayer[i] = 'X'
      finishGame(afterPlayer)

      const res = winnerOf(afterPlayer)
      if (res.winner !== null || afterPlayer.every((v) => v !== null)) return

      setThinking(true)
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null
        const cur: Cell[] = [...boardRef.current]
        const empties = cur.flatMap((v, idx) => (v === null ? [idx] : []))
        if (empties.length === 0) {
          setThinking(false)
          return
        }
        // ۲۵٪ مواقع پنگوئن دست‌پاچه می‌شه!
        const move =
          Math.random() < AI_BLUNDER_CHANCE
            ? empties[Math.floor(Math.random() * empties.length)]
            : bestMove(cur, 'O')
        cur[move] = 'O'
        finishGame(cur)
        setThinking(false)
      }, AI_THINK_MS)
    },
    [thinking, result.over, finishGame]
  )

  const reset = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
    const fresh = emptyBoard()
    boardRef.current = fresh
    setBoard(fresh)
    setResult({ over: false, winner: null, line: null })
    setThinking(false)
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    }
  }, [])

  const status = statusText(result, thinking)

  return (
    <div className="h-full w-full">
      <GameShell
        emoji="⭕"
        title="دوز"
        howTo="تو ✕ هستی، پنگوئن ⭕. سه‌تایی رو بچین!"
        stats={[
          { label: 'برد شما', value: tally.player },
          { label: 'برد پنگوئن', value: tally.ai },
          { label: 'مساوی', value: tally.draw },
        ]}
        onRestart={reset}
      >
        <div className="flex h-full w-full flex-col items-center justify-center gap-4">
          <div className={`text-sm font-black transition-colors ${status.cls}`}>
            {status.text}
          </div>
          <div className="grid aspect-square w-full max-w-[340px] select-none grid-cols-3 grid-rows-3 gap-2">
            {board.map((v, i) => {
              const isWinning = result.line?.includes(i) ?? false
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => play(i)}
                  disabled={v !== null || thinking || result.over}
                  className={`grid place-items-center rounded-xl border border-white/10 bg-zinc-900 text-4xl font-black transition enabled:hover:bg-zinc-800 enabled:active:scale-95 disabled:cursor-default ${
                    isWinning ? 'ring-2 ring-amber-400' : ''
                  }`}
                >
                  {v === 'X' && <span className="pengo-pop text-rose-400">✕</span>}
                  {v === 'O' && <span className="pengo-pop text-emerald-400">⭕</span>}
                </button>
              )
            })}
          </div>
          <div className="text-xs text-zinc-500">
            رازِ پیروزی: پنگوئن گاهی حواسش پرت می‌شه 😉
          </div>
        </div>
      </GameShell>
    </div>
  )
}
