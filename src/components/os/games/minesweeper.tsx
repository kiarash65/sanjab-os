'use client'

import { useEffect, useState } from 'react'
import { GameShell, Overlay } from '@/components/os/game-shell'
import { Button } from '@/components/ui/button'
import { useOS } from '@/lib/os/store'

const SIZE = 9
const MINES = 10
const SAFE_CELLS = SIZE * SIZE - MINES

interface Cell {
  mine: boolean
  revealed: boolean
  flagged: boolean
  exploded: boolean
  count: number
}

type Status = 'idle' | 'playing' | 'won' | 'lost'

// Number colors، no blue allowed in پنگوئن‌اواس 🐧
const NUMBER_COLORS: Record<number, string> = {
  1: 'text-emerald-400',
  2: 'text-amber-300',
  3: 'text-rose-400',
  4: 'text-violet-300',
  5: 'text-orange-400',
  6: 'text-teal-300',
  7: 'text-fuchsia-300',
  8: 'text-zinc-300',
}

const fa = (n: number): string => n.toLocaleString('fa-IR')

function neighborsOf(idx: number): number[] {
  const r = Math.floor(idx / SIZE)
  const c = idx % SIZE
  const out: number[] = []
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue
      const nr = r + dr
      const nc = c + dc
      if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE) out.push(nr * SIZE + nc)
    }
  }
  return out
}

function emptyBoard(): Cell[] {
  return Array.from({ length: SIZE * SIZE }, () => ({
    mine: false,
    revealed: false,
    flagged: false,
    exploded: false,
    count: 0,
  }))
}

// First click is always safe: mines avoid the clicked cell + its 8 neighbors
function plantMines(cells: Cell[], safeIdx: number): Cell[] {
  const forbidden = new Set<number>([safeIdx, ...neighborsOf(safeIdx)])
  const pool: number[] = []
  for (let i = 0; i < SIZE * SIZE; i++) {
    if (!forbidden.has(i)) pool.push(i)
  }
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = pool[i]
    pool[i] = pool[j]
    pool[j] = tmp
  }
  const next = cells.map((c) => ({ ...c }))
  for (let k = 0; k < MINES; k++) next[pool[k]].mine = true
  for (let i = 0; i < next.length; i++) {
    if (next[i].mine) continue
    let n = 0
    for (const nb of neighborsOf(i)) {
      if (next[nb].mine) n++
    }
    next[i].count = n
  }
  return next
}

// BFS flood-fill from a safe cell
function revealFrom(cells: Cell[], start: number): Cell[] {
  const next = cells.map((c) => ({ ...c }))
  const startCell = next[start]
  if (startCell.revealed || startCell.flagged || startCell.mine) return next
  startCell.revealed = true
  const queue: number[] = [start]
  let head = 0
  while (head < queue.length) {
    const cur = queue[head]
    head += 1
    if (next[cur].count !== 0) continue
    for (const nb of neighborsOf(cur)) {
      const cell = next[nb]
      if (!cell.revealed && !cell.flagged && !cell.mine) {
        cell.revealed = true
        queue.push(nb)
      }
    }
  }
  return next
}

export default function MinesweeperGame() {
  const [cells, setCells] = useState<Cell[]>(emptyBoard)
  const [planted, setPlanted] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const [seconds, setSeconds] = useState(0)
  const [flagMode, setFlagMode] = useState(false)

  useEffect(() => {
    if (status !== 'playing') return
    const iv = window.setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => window.clearInterval(iv)
  }, [status])

  // Celebrate / mourn via OS toast
  useEffect(() => {
    if (status === 'won') {
      useOS.getState().pushToast({
        title: '🚩 مین‌یاب: مأموریت موفق!',
        body: `همه مین‌ها رو در ${fa(seconds)} ثانیه دور زدی. پنگوئن مفتخره 🐧`,
        icon: '💣',
      })
    } else if (status === 'lost') {
      useOS.getState().pushToast({
        title: '💥 بوووم!',
        body: 'مین ۱، شما ۰. دفعه بعد از مسیر امن برو!',
        icon: '💣',
      })
    }
  }, [status, seconds])

  const flags = cells.reduce((acc, c) => acc + (c.flagged ? 1 : 0), 0)

  const toggleFlag = (idx: number) => {
    if (status === 'won' || status === 'lost') return
    setCells((cs) =>
      cs.map((c, i) => (i === idx && !c.revealed ? { ...c, flagged: !c.flagged } : c))
    )
    setStatus((s) => (s === 'idle' ? 'playing' : s))
  }

  const handleClick = (idx: number) => {
    if (status === 'won' || status === 'lost') return
    const cell = cells[idx]
    if (cell.flagged || cell.revealed) return
    if (flagMode) {
      toggleFlag(idx)
      return
    }

    let board = cells
    if (!planted) {
      board = plantMines(cells, idx)
      setPlanted(true)
    }
    setStatus('playing')

    if (board[idx].mine) {
      setCells(
        board.map((c, i) =>
          c.mine ? { ...c, revealed: true, exploded: i === idx } : c
        )
      )
      setStatus('lost')
      return
    }

    const revealedBoard = revealFrom(board, idx)
    const revealedSafe = revealedBoard.reduce(
      (acc, c) => acc + (!c.mine && c.revealed ? 1 : 0),
      0
    )
    if (revealedSafe === SAFE_CELLS) {
      setCells(
        revealedBoard.map((c) => (c.mine && !c.flagged ? { ...c, flagged: true } : c))
      )
      setStatus('won')
    } else {
      setCells(revealedBoard)
    }
  }

  const reset = () => {
    setCells(emptyBoard())
    setPlanted(false)
    setStatus('idle')
    setSeconds(0)
  }

  const statusHint =
    status === 'idle'
      ? 'اولین کلیک همیشه امنه 😉'
      : status === 'playing'
        ? 'حواست باشه کجا پا می‌ذاری 👀'
        : status === 'won'
          ? 'زمین تمیز شد! ✨'
          : 'بووووم... دوباره امتحان کن 💥'

  return (
    <GameShell
      emoji="💣"
      title="مین‌یاب"
      howTo="کلیک = باز کردن • راست‌کلیک یا دکمه 🚩 = پرچم"
      stats={[
        { label: 'مین باقی‌مانده', value: fa(MINES - flags) },
        { label: 'زمان', value: fa(seconds) },
      ]}
      controls={
        <Button
          size="sm"
          variant="secondary"
          aria-pressed={flagMode}
          className="h-7 gap-1 px-2.5 text-xs active:scale-95"
          onClick={() => setFlagMode((m) => !m)}
        >
          {flagMode ? '🚩 حالت پرچم' : '⛏ حالت بیل'}
        </Button>
      }
      onRestart={reset}
    >
      <div className="flex h-full w-full select-none flex-col items-center justify-center gap-3">
        <div className="pengo-pop rounded-xl border border-white/10 bg-zinc-900/60 p-1.5">
          <div className="grid w-fit grid-cols-9 gap-1" dir="ltr">
            {cells.map((cell, i) => {
              const showNumber = cell.revealed && !cell.mine && cell.count > 0
              const appearance = cell.revealed
                ? cell.exploded
                  ? 'cursor-default border-white/5 bg-red-500/40'
                  : 'cursor-default border-white/5 bg-zinc-900/80'
                : 'cursor-pointer border-white/10 bg-zinc-800 hover:bg-zinc-700'
              return (
                <button
                  key={i}
                  type="button"
                  disabled={status === 'won' || status === 'lost'}
                  onClick={() => handleClick(i)}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    toggleFlag(i)
                  }}
                  aria-label={
                    cell.flagged ? 'پرچم‌شده' : cell.revealed ? 'خانه باز' : 'خانه بسته'
                  }
                  className={`flex size-8 items-center justify-center rounded-md border text-[13px] font-black transition-colors duration-150 active:scale-95 sm:size-9 ${appearance}${
                    showNumber ? ` ${NUMBER_COLORS[cell.count] ?? ''}` : ''
                  }`}
                >
                  {cell.revealed
                    ? cell.mine
                      ? cell.flagged
                        ? '🚩'
                        : '💣'
                      : showNumber
                        ? fa(cell.count)
                        : ''
                    : cell.flagged
                      ? '🚩'
                      : ''}
                </button>
              )
            })}
          </div>
        </div>
        <p className="shrink-0 text-[11px] text-zinc-500">{statusHint}</p>
      </div>
      <Overlay
        show={status === 'won' || status === 'lost'}
        emoji={status === 'won' ? '🎉' : '💣'}
        title={status === 'won' ? 'بردی! همه مین‌ها رو دور زدی' : 'بوووم! مین‌زده شدی!'}
        subtitle={
          status === 'won'
            ? `در ${fa(seconds)} ثانیه زمین رو ایمن کردی 🚩`
            : 'دوباره تلاش کن، این بار حواست به زمین‌لرزه باشه'
        }
        onAction={reset}
      />
    </GameShell>
  )
}
