'use client'

import {
  useRef,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import { useOS, type OSWindow } from '@/lib/os/store'
import { getApp } from '@/lib/os/apps'

const TASKBAR = 48

export default function WindowFrame({
  win,
  children,
}: {
  win: OSWindow
  children: ReactNode
}) {
  const focusedId = useOS((s) => s.focusedId)
  const focusWindow = useOS((s) => s.focusWindow)
  const closeWindow = useOS((s) => s.closeWindow)
  const minimizeWindow = useOS((s) => s.minimizeWindow)
  const toggleMaximize = useOS((s) => s.toggleMaximize)
  const moveWindow = useOS((s) => s.moveWindow)
  const resizeWindow = useOS((s) => s.resizeWindow)
  const accent = useOS((s) => s.settings.accent)
  const app = getApp(win.appId)
  const tint = app?.tint

  const focused = focusedId === win.id
  const drag = useRef<{ dx: number; dy: number } | null>(null)
  const rsz = useRef<{ sx: number; sy: number; w: number; h: number } | null>(
    null
  )

  const onTitleDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('[data-nodrag]')) return
    focusWindow(win.id)
    if (win.maximized) return
    drag.current = { dx: e.clientX - win.x, dy: e.clientY - win.y }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onTitleMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current) return
    const vw = window.innerWidth
    const vh = window.innerHeight
    const x = Math.max(
      90 - win.w,
      Math.min(e.clientX - drag.current.dx, vw - 90)
    )
    const y = Math.max(
      0,
      Math.min(e.clientY - drag.current.dy, vh - TASKBAR - 36)
    )
    moveWindow(win.id, x, y)
  }
  const endDrag = () => {
    drag.current = null
  }

  const onRszDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    focusWindow(win.id)
    rsz.current = { sx: e.clientX, sy: e.clientY, w: win.w, h: win.h }
    e.currentTarget.setPointerCapture(e.pointerId)
    e.stopPropagation()
  }
  const onRszMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!rsz.current) return
    const w = Math.max(
      300,
      Math.min(
        rsz.current.w + (e.clientX - rsz.current.sx),
        window.innerWidth - win.x - 4
      )
    )
    const h = Math.max(
      220,
      Math.min(
        rsz.current.h + (e.clientY - rsz.current.sy),
        window.innerHeight - win.y - TASKBAR - 4
      )
    )
    resizeWindow(win.id, w, h)
  }

  const style: CSSProperties = win.maximized
    ? {
        left: 0,
        top: 0,
        width: '100vw',
        height: `calc(100vh - ${TASKBAR}px)`,
        zIndex: win.z,
      }
    : {
        left: win.x,
        top: win.y,
        width: win.w,
        height: win.h,
        zIndex: win.z,
      }

  if (win.minimized) return null

  return (
    <section
      className={`pengo-pop absolute flex flex-col select-none overflow-hidden rounded-xl border text-zinc-100 ${
        focused
          ? 'border-white/25 shadow-2xl shadow-black/60'
          : 'border-white/10 shadow-lg shadow-black/30'
      }`}
      style={style}
      onPointerDown={() => focusWindow(win.id)}
      role="dialog"
      aria-label={win.title}
    >
      <div
        className={`pengo-noselect flex h-10 shrink-0 cursor-grab items-center gap-2 px-3 backdrop-blur active:cursor-grabbing ${
          focused && tint
            ? `bg-gradient-to-l ${tint}`
            : 'bg-zinc-900/95'
        }`}
        style={
          focused && tint
            ? undefined
            : focused
              ? { boxShadow: `inset 0 -2px 0 0 ${accent}` }
              : undefined
        }
        onPointerDown={onTitleDown}
        onPointerMove={onTitleMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDoubleClick={() => toggleMaximize(win.id)}
      >
        <div className="flex items-center gap-1.5" data-nodrag>
          <button
            aria-label="بستن پنجره"
            onClick={() => closeWindow(win.id)}
            className="h-3.5 w-3.5 rounded-full bg-red-500 transition hover:brightness-125"
          />
          <button
            aria-label="بزرگ کردن یا برگرداندن پنجره"
            onClick={() => toggleMaximize(win.id)}
            className="h-3.5 w-3.5 rounded-full bg-amber-400 transition hover:brightness-125"
          />
          <button
            aria-label="کوچک کردن پنجره"
            onClick={() => minimizeWindow(win.id)}
            className="h-3.5 w-3.5 rounded-full bg-emerald-500 transition hover:brightness-125"
          />
        </div>
        {app && (
          <span
            className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-black/25"
            aria-hidden
          >
            <app.icon size={12} strokeWidth={2.2} className="text-white" />
          </span>
        )}
        <div className="pointer-events-none min-w-0 flex-1 px-1 text-center text-xs font-bold text-white drop-shadow-sm sm:text-[13px]">
          <span className="block truncate">{win.title}</span>
        </div>
        <div className="w-14 shrink-0" aria-hidden />
      </div>
      <div className="relative min-h-0 flex-1 bg-zinc-950/95">{children}</div>
      {!win.maximized && (
        <div
          data-nodrag
          onPointerDown={onRszDown}
          onPointerMove={onRszMove}
          onPointerUp={() => {
            rsz.current = null
          }}
          onPointerCancel={() => {
            rsz.current = null
          }}
          className="absolute bottom-0 left-0 z-10 h-4 w-4 cursor-nwse-resize"
          aria-hidden
        />
      )}
    </section>
  )
}
