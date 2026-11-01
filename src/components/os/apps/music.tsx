'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Pause, Play, SkipBack, SkipForward, Volume2 } from 'lucide-react'
import { useOS } from '@/lib/os/store'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'

type Step = number | null

interface Track {
  name: string
  emoji: string
  bpm: number
  wave: OscillatorType
  hat: boolean
  steps: Step[]
}

const TRACKS: Track[] = [
  {
    name: 'پنگوئن راک',
    emoji: '🎸',
    bpm: 140,
    wave: 'square',
    hat: true,
    steps: [
      69, null, 69, 72, 74, null, 72, 69,
      67, null, 67, 69, 72, null, 69, null,
      76, null, 74, 72, 74, null, 72, 69,
      67, 69, 67, 64, 62, null, 57, null,
    ],
  },
  {
    name: 'بوس جاز',
    emoji: '🎷',
    bpm: 96,
    wave: 'triangle',
    hat: false,
    steps: [
      57, null, 60, null, 62, null, 64, null,
      67, null, 64, null, 62, 60, 57, null,
      64, null, 67, null, 69, null, 67, 64,
      62, null, 60, null, 57, null, null, null,
    ],
  },
  {
    name: 'لو-فای کدزنی',
    emoji: '🌙',
    bpm: 72,
    wave: 'sine',
    hat: false,
    steps: [
      69, null, null, null, 76, null, null, null,
      72, null, null, null, 74, null, 72, null,
      64, null, null, null, 67, null, null, null,
      60, null, null, null, 57, null, null, null,
    ],
  },
]

const BAR_COUNT = 24
const CANVAS_W = 300
const CANVAS_H = 60

const midiToFreq = (midi: number): number => 440 * Math.pow(2, (midi - 69) / 12)

export default function MusicApp() {
  const sound = useOS((s) => s.settings.sound)
  const pushToast = useOS((s) => s.pushToast)

  const [currentIndex, setCurrentIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState(70)

  const audioCtxRef = useRef<AudioContext | null>(null)
  const masterGainRef = useRef<GainNode | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourcesRef = useRef<AudioScheduledSourceNode[]>([])
  const timeoutRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)
  const playingRef = useRef(false)
  const loopTokenRef = useRef(0)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const barsRef = useRef<number[]>(Array.from({ length: BAR_COUNT }, () => 0))
  const drawFrameRef = useRef<() => void>(() => {})

  const stopAudio = useCallback(() => {
    playingRef.current = false
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    sourcesRef.current.forEach((src) => {
      try {
        src.stop()
      } catch {
        /* already stopped */
      }
      try {
        src.disconnect()
      } catch {
        /* already disconnected */
      }
    })
    sourcesRef.current = []
    masterGainRef.current = null
    analyserRef.current = null
    if (audioCtxRef.current) {
      const ctx = audioCtxRef.current
      audioCtxRef.current = null
      ctx.close().catch(() => {})
    }
  }, [])

  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      rafRef.current = null
      return
    }
    const c2d = canvas.getContext('2d')
    if (!c2d) {
      rafRef.current = null
      return
    }

    const bars = barsRef.current
    const analyser = analyserRef.current

    if (playingRef.current && analyser) {
      const data = new Uint8Array(analyser.frequencyBinCount)
      analyser.getByteFrequencyData(data)
      for (let i = 0; i < BAR_COUNT; i++) {
        const bin = Math.min(data.length - 1, Math.floor((i / BAR_COUNT) * data.length))
        const value = (data[bin] / 255) * CANVAS_H
        bars[i] = Math.max(bars[i] * 0.72, value)
      }
    } else {
      for (let i = 0; i < BAR_COUNT; i++) bars[i] = bars[i] * 0.86
    }

    c2d.clearRect(0, 0, CANVAS_W, CANVAS_H)
    const accent = getComputedStyle(canvas).getPropertyValue('--pengo-accent').trim() || '#22c55e'
    const grad = c2d.createLinearGradient(0, CANVAS_H, 0, 0)
    grad.addColorStop(0, accent)
    grad.addColorStop(1, '#f59e0b')
    c2d.fillStyle = grad
    const slot = CANVAS_W / BAR_COUNT
    const barW = slot * 0.6
    for (let i = 0; i < BAR_COUNT; i++) {
      const h = Math.max(2, bars[i])
      const x = i * slot + (slot - barW) / 2
      c2d.fillRect(x, CANVAS_H - h, barW, h)
    }

    const keepGoing = playingRef.current || bars.some((b) => b > 0.5)
    rafRef.current = keepGoing ? requestAnimationFrame(() => drawFrameRef.current()) : null
  }, [])

  useEffect(() => {
    drawFrameRef.current = drawFrame
  }, [drawFrame])

  const startVisualizer = useCallback(() => {
    if (rafRef.current !== null) return
    rafRef.current = requestAnimationFrame(drawFrame)
  }, [drawFrame])

  const scheduleLoop = (track: Track, startTime: number, token: number) => {
    const ctx = audioCtxRef.current
    const master = masterGainRef.current
    if (!ctx || !master) return

    const stepDur = 60 / track.bpm / 2
    const loopDur = stepDur * track.steps.length

    track.steps.forEach((note, i) => {
      if (note === null) return
      const t = startTime + i * stepDur
      const osc = ctx.createOscillator()
      osc.type = track.wave
      osc.frequency.value = midiToFreq(note)
      const env = ctx.createGain()
      env.gain.setValueAtTime(0.0001, t)
      env.gain.exponentialRampToValueAtTime(0.28, t + 0.005)
      env.gain.exponentialRampToValueAtTime(0.0001, t + stepDur * 0.9)
      osc.connect(env)
      env.connect(master)
      osc.start(t)
      osc.stop(t + stepDur)
      osc.onended = () => {
        try {
          env.disconnect()
        } catch {
          /* noop */
        }
      }
      sourcesRef.current.push(osc)
    })

    if (track.hat) {
      const hatCount = Math.floor(track.steps.length / 2)
      for (let i = 0; i < hatCount; i++) {
        const t = startTime + i * 2 * stepDur
        const len = Math.max(1, Math.floor(ctx.sampleRate * 0.04))
        const buf = ctx.createBuffer(1, len, ctx.sampleRate)
        const data = buf.getChannelData(0)
        for (let j = 0; j < len; j++) data[j] = (Math.random() * 2 - 1) * (1 - j / len)
        const src = ctx.createBufferSource()
        src.buffer = buf
        const g = ctx.createGain()
        g.gain.setValueAtTime(0.05, t)
        src.connect(g)
        g.connect(master)
        src.start(t)
        sourcesRef.current.push(src)
      }
    }

    const nextIn = Math.max(60, loopDur * 1000 - 80)
    timeoutRef.current = window.setTimeout(() => {
      if (!playingRef.current || loopTokenRef.current !== token) return
      scheduleLoop(track, startTime + loopDur, token)
    }, nextIn)
  }

  const startPlay = (index: number) => {
    const track = TRACKS[index]
    if (!track) return
    if (!sound) {
      pushToast({ icon: '🔇', title: 'صدا خاموشه', body: 'از تسک‌بار یا تنظیمات وصلش کن' })
      return
    }
    stopAudio()
    try {
      const ctx = new AudioContext()
      audioCtxRef.current = ctx
      const master = ctx.createGain()
      master.gain.value = (volume / 100) * 0.5
      masterGainRef.current = master
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 64
      analyserRef.current = analyser
      master.connect(analyser)
      analyser.connect(ctx.destination)

      playingRef.current = true
      loopTokenRef.current += 1
      setPlaying(true)
      setCurrentIndex(index)
      scheduleLoop(track, ctx.currentTime + 0.06, loopTokenRef.current)
      startVisualizer()
    } catch {
      playingRef.current = false
      setPlaying(false)
      pushToast({ icon: '⚠️', title: 'صدا بالا نیامد', body: 'مرورگرت با سینت سایزر حال نمی‌کند' })
    }
  }

  const handleToggle = () => {
    if (playingRef.current) {
      stopAudio()
      setPlaying(false)
      startVisualizer()
    } else {
      startPlay(currentIndex)
    }
  }

  const handleStep = (dir: -1 | 1) => {
    const next = (currentIndex + dir + TRACKS.length) % TRACKS.length
    setCurrentIndex(next)
    if (playingRef.current) startPlay(next)
  }

  useEffect(() => {
    const master = masterGainRef.current
    const ctx = audioCtxRef.current
    if (master && ctx) {
      master.gain.setTargetAtTime((volume / 100) * 0.5, ctx.currentTime, 0.02)
    }
  }, [volume])

  useEffect(() => {
    startVisualizer()
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      stopAudio()
    }
  }, [startVisualizer, stopAudio])

  const track = TRACKS[currentIndex] ?? TRACKS[0]

  return (
    <div className="h-full w-full">
      <div className="os-scroll flex h-full flex-col gap-3 overflow-y-auto p-4">
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-zinc-900/70 p-3">
          <div
            className="grid h-16 w-16 shrink-0 place-items-center rounded-xl border border-white/10 bg-zinc-950 text-4xl"
            aria-hidden
          >
            {track.emoji}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold text-zinc-500">در حال پخش از سینت پنگوئنی</p>
            <p className="truncate text-base font-black text-zinc-100">{track.name}</p>
            <p className="text-[11px] text-zinc-500">{track.bpm} ضرب در دقیقه • بافت {track.wave}</p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            aria-label="آهنگ قبلی"
            onClick={() => handleStep(-1)}
          >
            <SkipBack className="size-5" />
          </Button>
          <button
            type="button"
            aria-label={playing ? 'توقف' : 'پخش'}
            onClick={handleToggle}
            className="grid h-14 w-14 place-items-center rounded-full bg-[var(--pengo-accent)] text-zinc-950 shadow-lg transition hover:brightness-110 active:scale-95"
          >
            {playing ? <Pause className="size-6" /> : <Play className="size-6" />}
          </button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="آهنگ بعدی"
            onClick={() => handleStep(1)}
          >
            <SkipForward className="size-5" />
          </Button>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-zinc-900/50 px-3 py-2.5">
          <Volume2 className="size-4 shrink-0 text-zinc-400" />
          <Slider
            value={[volume]}
            min={0}
            max={100}
            step={1}
            onValueChange={(v) => setVolume(v[0] ?? 0)}
            aria-label="بلندی صدا"
            className="flex-1"
          />
          <span className="w-9 shrink-0 text-left text-[11px] tabular-nums text-zinc-500">
            {volume}٪
          </span>
        </div>

        <div className="space-y-1.5">
          {TRACKS.map((t, i) => {
            const active = i === currentIndex
            return (
              <button
                key={t.name}
                type="button"
                onClick={() => {
                  setCurrentIndex(i)
                  startPlay(i)
                }}
                className={`flex w-full items-center gap-3 rounded-lg border border-white/10 px-3 py-2 text-right transition hover:bg-white/5 ${
                  active ? 'bg-white/5 ring-1 ring-[var(--pengo-accent)]' : ''
                }`}
              >
                <span className="text-xl" aria-hidden>
                  {t.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-zinc-100">{t.name}</span>
                  <span className="block text-[11px] text-zinc-500">
                    {active && playing ? (
                      <span className="animate-pulse">در حال پخش…</span>
                    ) : (
                      `${t.bpm} ضرب در دقیقه`
                    )}
                  </span>
                </span>
              </button>
            )
          })}
        </div>

        <div className="mt-auto rounded-xl border border-white/10 bg-zinc-950 p-2">
          <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} className="h-16 w-full" />
        </div>
      </div>
    </div>
  )
}
