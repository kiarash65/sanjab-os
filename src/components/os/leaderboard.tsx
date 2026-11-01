'use client'

import { useCallback, useEffect, useState } from 'react'
import { Crown, Loader2, Trophy } from 'lucide-react'

export interface ScoreRow {
  id: string
  name: string
  score: number
  createdAt: string
}

export function getPlayerName(): string {
  try {
    return window.localStorage.getItem('pengo-player-name') ?? ''
  } catch {
    return ''
  }
}

export function setPlayerName(name: string) {
  try {
    window.localStorage.setItem('pengo-player-name', name)
  } catch {
    /* ignore */
  }
}

export async function fetchScores(game: string): Promise<ScoreRow[]> {
  try {
    const res = await fetch(`/api/scores?game=${encodeURIComponent(game)}`, {
      cache: 'no-store',
    })
    if (!res.ok) return []
    const data = (await res.json()) as { scores?: ScoreRow[] }
    return data.scores ?? []
  } catch {
    return []
  }
}

export async function submitScore(
  game: string,
  name: string,
  score: number
): Promise<boolean> {
  try {
    const res = await fetch('/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game, name, score }),
    })
    return res.ok
  } catch {
    return false
  }
}

export function LeaderboardPanel({
  game,
  best,
  refreshKey,
}: {
  game: string
  best: number
  /** با تغییر این عدد جدول دوباره لود می‌شود */
  refreshKey?: number
}) {
  const [rows, setRows] = useState<ScoreRow[] | null>(null)
  const [name, setName] = useState<string>(() =>
    typeof window === 'undefined' ? '' : getPlayerName()
  )
  const [sent, setSent] = useState(false)

  const load = useCallback(() => {
    fetchScores(game).then(setRows)
  }, [game])

  useEffect(() => {
    load()
  }, [load, refreshKey])

  const saveName = (v: string) => {
    setName(v)
    setPlayerName(v)
    setSent(false)
  }

  const send = async () => {
    if (best <= 0) return
    const finalName = (name.trim() || 'پنگوئن بی‌نام').slice(0, 24)
    setPlayerName(finalName)
    setSent(true)
    await submitScore(game, finalName, best)
    load()
  }

  return (
    <div className="flex h-full w-full flex-col rounded-xl border border-white/10 bg-zinc-900/60 p-3">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-black text-amber-300">
        <Trophy size={14} aria-hidden />
        رکوردهای جهانی
      </div>

      <div className="mb-2 flex gap-1.5">
        <input
          value={name}
          onChange={(e) => saveName(e.target.value)}
          placeholder="اسم پنگوئنی‌ات"
          maxLength={24}
          className="min-w-0 flex-1 rounded-lg border border-white/10 bg-zinc-950/70 px-2.5 py-1.5 text-xs text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-white/25"
          aria-label="اسم بازیکن"
        />
        <button
          onClick={send}
          disabled={best <= 0 || sent}
          className="shrink-0 rounded-lg bg-amber-500/90 px-2.5 py-1.5 text-xs font-black text-zinc-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {sent ? 'فرستاده شد' : 'ثبت رکورد'}
        </button>
      </div>

      {rows === null ? (
        <div className="flex flex-1 items-center justify-center text-zinc-600">
          <Loader2 className="size-4 animate-spin" aria-hidden />
        </div>
      ) : rows.length === 0 ? (
        <p className="flex-1 self-center text-center text-[11px] leading-5 text-zinc-500">
          هنوز کسی رکورد نفرستاده.
          <br />
          تو اولین باش!
        </p>
      ) : (
        <ol className="os-scroll flex-1 space-y-0.5 overflow-y-auto pr-0.5 text-[11px]">
          {rows.map((r, i) => (
            <li
              key={r.id}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 odd:bg-white/[0.04]"
            >
              <span
                className={`grid w-5 shrink-0 place-items-center font-black ${
                  i === 0 ? 'text-amber-300' : 'text-zinc-500'
                }`}
                aria-hidden
              >
                {i === 0 ? <Crown size={13} /> : i + 1}
              </span>
              <span className="min-w-0 flex-1 truncate font-medium text-zinc-200">
                {r.name}
              </span>
              <span className="shrink-0 font-black text-amber-200">
                {r.score.toLocaleString('fa-IR')}
              </span>
            </li>
          ))}
        </ol>
      )}

      {best > 0 && (
        <p className="mt-2 border-t border-white/5 pt-1.5 text-[10px] text-zinc-500">
          رکورد محلی تو:{' '}
          <b className="text-zinc-300">{best.toLocaleString('fa-IR')}</b>
        </p>
      )}
    </div>
  )
}
