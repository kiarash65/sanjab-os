'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react'
import { GameShell, Overlay, useBestScore } from '@/components/os/game-shell'

const SIZE = 4
const WIN_VALUE = 2048

type Board = number[][]
type Dir = 'up' | 'down' | 'left' | 'right'

interface PopCell {
  r: number
  c: number
  id: number
}

interface MoveResult {
  board: Board
  gained: number
  moved: boolean
  merged: { r: number; c: number }[]
}

// رنگ کاشی‌ها (بدون آبی!)
const TILE_STYLES: Record<number, string> = {
  2: 'bg-zinc-800 text-zinc-100',
  4: 'bg-zinc-700 text-zinc-50',
  8: 'bg-amber-700 text-zinc-50',
  16: 'bg-amber-600 text-zinc-50',
  32: 'bg-orange-600 text-white',
  64: 'bg-rose-600 text-white',
  128: 'bg-emerald-600 text-white',
  256: 'bg-teal-600 text-white',
  512: 'bg-violet-600 text-white',
  1024: 'bg-fuchsia-600 text-white',
  2048: 'bg-yellow-400 text-zinc-900',
}

function tileStyle(v: number): string {
  return TILE_STYLES[v] ?? 'bg-yellow-400 text-zinc-900'
}

function tileText(v: number): string {
  if (v >= 1024) return 'text-lg'
  if (v >= 128) return 'text-xl'
  return 'text-2xl'
}

function emptyBoard(): Board {
  return [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ]
}

function emptyCells(b: Board): { r: number; c: number }[] {
  const out: { r: number; c: number }[] = []
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (b[r][c] === 0) out.push({ r, c })
    }
  }
  return out
}

function addRandomTile(b: Board): { r: number; c: number } | null {
  const spots = emptyCells(b)
  if (spots.length === 0) return null
  const spot = spots[Math.floor(Math.random() * spots.length)]
  b[spot.r][spot.c] = Math.random() < 0.9 ? 2 : 4
  return spot
}

function initBoard(): Board {
  const b = emptyBoard()
  addRandomTile(b)
  addRandomTile(b)
  return b
}

// مختصات خانه‌ی i-ام خطِ line طوری که «لغزش به سمت ایندکس ۰» همان جهتِ خواسته‌شود باشد
function pos(dir: Dir, line: number, i: number): [number, number] {
  switch (dir) {
    case 'left':
      return [line, i]
    case 'right':
      return [line, SIZE - 1 - i]
    case 'up':
      return [i, line]
    case 'down':
      return [SIZE - 1 - i, line]
  }
}

function moveBoard(board: Board, dir: Dir): MoveResult {
  const next: Board = board.map((row) => [...row])
  const merged: { r: number; c: number }[] = []
  let gained = 0

  for (let line = 0; line < SIZE; line++) {
    const vals: number[] = []
    for (let i = 0; i < SIZE; i++) {
      const [r, c] = pos(dir, line, i)
      if (board[r][c] !== 0) vals.push(board[r][c])
    }

    const out: number[] = []
    for (let i = 0; i < vals.length; i++) {
      if (i + 1 < vals.length && vals[i] === vals[i + 1]) {
        const v = vals[i] * 2
        out.push(v)
        gained += v
        const [r, c] = pos(dir, line, out.length - 1)
        merged.push({ r, c })
        i++
      } else {
        out.push(vals[i])
      }
    }
    while (out.length < SIZE) out.push(0)

    for (let i = 0; i < SIZE; i++) {
      const [r, c] = pos(dir, line, i)
      next[r][c] = out[i]
    }
  }

  const moved = next.some((row, r) => row.some((v, c) => v !== board[r][c]))
  return { board: next, gained, moved, merged }
}

function hasMoves(b: Board): boolean {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const v = b[r][c]
      if (v === 0) return true
      if (c + 1 < SIZE && b[r][c + 1] === v) return true
      if (r + 1 < SIZE && b[r + 1][c] === v) return true
    }
  }
  return false
}

function DPad({ onDir }: { onDir: (d: Dir) => void }) {
  const btn =
    'flex size-10 select-none items-center justify-center rounded-lg border border-white/10 bg-zinc-900 text-zinc-300 transition hover:bg-zinc-800 hover:text-zinc-100 active:scale-95'
  return (
    <div className="grid select-none grid-cols-3 gap-1.5">
      <div />
      <button type="button" aria-label="بالا" className={btn} onClick={() => onDir('up')}>
        <ChevronUp aria-hidden className="size-5" />
      </button>
      <div />
      <button type="button" aria-label="چپ" className={btn} onClick={() => onDir('left')}>
        <ChevronLeft aria-hidden className="size-5" />
      </button>
      <div className="grid size-10 place-items-center">
        <div className="size-2 rounded-full bg-white/15" />
      </div>
      <button type="button" aria-label="راست" className={btn} onClick={() => onDir('right')}>
        <ChevronRight aria-hidden className="size-5" />
      </button>
      <div />
      <button type="button" aria-label="پایین" className={btn} onClick={() => onDir('down')}>
        <ChevronDown aria-hidden className="size-5" />
      </button>
      <div />
    </div>
  )
}

export default function Game2048() {
  const [initial] = useState<Board>(initBoard)
  const [board, setBoard] = useState<Board>(initial)
  const [score, setScore] = useState(0)
  const [pops, setPops] = useState<PopCell[]>([])
  const [over, setOver] = useState(false)
  const [won, setWon] = useState(false)
  const [best, setBest] = useBestScore('2048')
  const boardRef = useRef<Board>(initial)
  const scoreRef = useRef(0)
  const popIdRef = useRef(0)
  const overRef = useRef(false)
  const wonRef = useRef(false)

  const doMove = useCallback(
    (dir: Dir) => {
      if (overRef.current || wonRef.current) return
      const res = moveBoard(boardRef.current, dir)
      if (!res.moved) return

      const spawn = addRandomTile(res.board)
      boardRef.current = res.board
      setBoard(res.board)

      if (res.gained > 0) {
        scoreRef.current += res.gained
        setScore(scoreRef.current)
        setBest(scoreRef.current)
      }

      const id = ++popIdRef.current
      const nextPops: PopCell[] = res.merged.map((m) => ({ ...m, id }))
      if (spawn) nextPops.push({ ...spawn, id })
      setPops(nextPops)

      if (res.board.some((row) => row.some((v) => v >= WIN_VALUE))) {
        wonRef.current = true
        setWon(true)
        setBest(scoreRef.current)
        return
      }
      if (!hasMoves(res.board)) {
        overRef.current = true
        setOver(true)
      }
    },
    [setBest]
  )

  const reset = useCallback(() => {
    const fresh = initBoard()
    boardRef.current = fresh
    setBoard(fresh)
    scoreRef.current = 0
    setScore(0)
    overRef.current = false
    wonRef.current = false
    setOver(false)
    setWon(false)
    setPops([])
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const dirs: Record<string, Dir> = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
      }
      const dir = dirs[e.key]
      if (!dir) return
      e.preventDefault()
      doMove(dir)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [doMove])

  return (
    <div className="h-full w-full">
      <GameShell
        emoji="🔢"
        title="۲۰۴۸"
        howTo="با کلیدهای جهت‌دار یا دکمه‌ها، کاشی‌های هم‌عدد رو ترکیب کن"
        stats={[
          { label: 'امتیاز', value: score },
          { label: 'رکورد', value: best },
        ]}
        onRestart={reset}
      >
        <div className="flex h-full w-full flex-col items-center justify-center gap-3">
          <div className="relative w-full max-w-[400px]">
            <div className="grid aspect-square w-full select-none grid-cols-4 grid-rows-4 gap-2 rounded-xl border border-white/10 bg-zinc-900 p-2">
              {board.map((row, r) =>
                row.map((v, c) => {
                  const pop = pops.find((p) => p.r === r && p.c === c)
                  const key = pop ? `t-${r}-${c}-${pop.id}` : `t-${r}-${c}`
                  return (
                    <div
                      key={key}
                      className={`grid place-items-center rounded-lg font-black transition-colors ${
                        v === 0 ? 'bg-zinc-800/30' : tileStyle(v)
                      } ${v !== 0 && pop ? 'pengo-pop' : ''} ${v !== 0 ? tileText(v) : ''}`}
                    >
                      {v !== 0 ? v : ''}
                    </div>
                  )
                })
              )}
            </div>
            <Overlay
              show={won}
              emoji="🏆"
              title="آفرین! به ۲۰۴۸ رسیدی!"
              subtitle={`امتیاز نهایی: ${score}`}
              actionLabel="یه دور دیگه!"
              onAction={reset}
            />
            <Overlay
              show={!won && over}
              emoji="🧠"
              title="جای خالی نموند!"
              subtitle={`امتیاز: ${score}`}
              actionLabel="دوباره تلاش کن"
              onAction={reset}
            />
          </div>
          <DPad onDir={doMove} />
        </div>
      </GameShell>
    </div>
  )
}
