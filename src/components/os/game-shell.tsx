'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { RotateCcw } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LeaderboardPanel, getPlayerName, submitScore } from './leaderboard'

export interface GameStat {
  label: string
  value: ReactNode
}

export function GameShell({
  icon: Icon,
  emoji,
  title,
  board,
  howTo,
  stats = [],
  controls,
  onRestart,
  children,
}: {
  /** آیکن lucide بازی */
  icon?: LucideIcon
  emoji?: string
  title: string
  /** پنل کنار بازی (مثل LiveBoard) */
  board?: ReactNode
  howTo?: string
  stats?: GameStat[]
  controls?: ReactNode
  onRestart?: () => void
  children: ReactNode
}) {
  return (
    <div className="flex h-full flex-col bg-zinc-950 text-zinc-100">
      <div className="flex flex-wrap items-center gap-1.5 border-b border-white/10 bg-zinc-900/70 px-3 py-2">
        {Icon ? (
          <Icon size={18} className="shrink-0 text-[var(--pengo-accent)]" aria-hidden />
        ) : (
          emoji && (
            <span className="text-lg leading-none" aria-hidden>
              {emoji}
            </span>
          )
        )}
        <span className="text-sm font-black">{title}</span>
        <div className="mx-1 h-5 w-px bg-white/10" aria-hidden />
        {stats.map((s) => (
          <span
            key={s.label}
            className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px]"
          >
            <span className="text-zinc-400">{s.label}: </span>
            <span className="font-bold">{s.value}</span>
          </span>
        ))}
        <div className="flex-1" />
        {controls}
        {onRestart && (
          <Button
            size="sm"
            variant="secondary"
            className="h-7 gap-1 px-2.5 text-xs"
            onClick={onRestart}
          >
            <RotateCcw className="size-3.5" />
            دوباره
          </Button>
        )}
      </div>
      {howTo && (
        <div className="border-b border-white/5 bg-zinc-900/40 px-3 py-1.5 text-[11px] text-zinc-400">
          {howTo}
        </div>
      )}
      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden p-3">
          {children}
        </div>
        {board}
      </div>
    </div>
  )
}

/**
 * کنار بازی: پنل رکوردهای جهانی با state زنده بازی
 */
export function LiveBoard({
  game,
  best,
  refreshKey,
}: {
  game: string
  best: number
  refreshKey?: number
}) {
  return (
    <aside className="hidden w-48 shrink-0 border-l border-white/10 p-2.5 sm:block">
      <LeaderboardPanel game={game} best={best} refreshKey={refreshKey} />
    </aside>
  )
}

export function Overlay({
  show,
  icon: Icon,
  emoji = '',
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  show: boolean
  icon?: LucideIcon
  emoji?: string
  title: string
  subtitle?: string
  actionLabel?: string
  onAction: () => void
}) {
  if (!show) return null
  return (
    <div className="absolute inset-0 z-20 grid place-items-center rounded-xl bg-black/70 backdrop-blur-sm">
      <div className="pengo-pop flex flex-col items-center gap-2 p-6 text-center">
        {Icon ? (
          <Icon size={44} className="text-[var(--pengo-accent)]" aria-hidden />
        ) : (
          emoji && (
            <div className="text-5xl" aria-hidden>
              {emoji}
            </div>
          )
        )}
        <div className="text-xl font-black">{title}</div>
        {subtitle && <div className="text-sm text-zinc-300">{subtitle}</div>}
        <Button className="mt-2" onClick={onAction}>
          {actionLabel ?? 'شروع دوباره'}
        </Button>
      </div>
    </div>
  )
}

/**
 * رکورد محلی + ارسال خودکار رکورد جهانی (فقط وقتی رکورد جدید ثبت شود)
 */
export function useBestScore(
  key: string
): readonly [number, (v: number) => void] {
  const [best, setBestState] = useState<number>(() => {
    if (typeof window === 'undefined') return 0
    try {
      const v = Number(
        window.localStorage.getItem(`pengo-best-${key}`) ?? '0'
      )
      return Number.isFinite(v) && v > 0 ? v : 0
    } catch {
      /* ignore */
      return 0
    }
  })
  const submittedRef = useRef<number>(0)

  const setBest = useCallback(
    (v: number) => {
      setBestState((b) => {
        const nb = Math.max(b, Math.floor(v))
        try {
          window.localStorage.setItem(`pengo-best-${key}`, String(nb))
        } catch {
          /* ignore */
        }
        // ارسال خودکار رکورد جهانی — فقط وقتی رکورد محلی شکسته شود
        if (nb > b && nb > 0 && submittedRef.current !== nb) {
          submittedRef.current = nb
          const name = (getPlayerName() || 'پنگوئن بی‌نام').slice(0, 24)
          void submitScore(key, name, nb)
          // گیمیفیکیشن: بازی کامل شد (رکورد جدید = پایان موفق یک دست)
          import('@/lib/gamification/engine')
            .then(({ useGame }) => useGame.getState().registerGame(key))
            .catch(() => {})
        }
        return nb
      })
    },
    [key]
  )
  return [best, setBest] as const
}

/** تیک‌تاک ساده برای بازی‌ها */
export function useGameTick(active: boolean, ms: number, fn: () => void) {
  const ref = useRef(fn)
  useEffect(() => {
    ref.current = fn
  }, [fn])
  useEffect(() => {
    if (!active) return
    const iv = setInterval(() => ref.current(), ms)
    return () => clearInterval(iv)
  }, [active, ms])
}
