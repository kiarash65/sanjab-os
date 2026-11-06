'use client'

/* «ماشین زمان چهره» — جوان‌کن و پیرکن زنده با دوربین
   فیلترهای بوم نقاشی + چین‌وچروک مبتنی بر ۶۸ نقطهٔ لندمارک چهره
   همه‌چیز محلی است — هیچ تصویری جایی نمی‌رود. جادوی بوم‌نقاشی است، نه علم! */

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  Camera,
  CameraOff,
  Download,
  Hourglass,
  Loader2,
  Sparkles,
  Undo2,
} from 'lucide-react'
import { useOS } from '@/lib/os/store'

declare global {
  interface Window {
    faceapi?: any
  }
}

const FACEAPI_CDN =
  'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js'
const MODEL_URL =
  'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights'

type Phase = 'idle' | 'live'
type LibState = 'idle' | 'loading' | 'ready' | 'error'
type Mode = 'old' | 'young'

const fa = (n: number) => n.toLocaleString('fa-IR')

interface FaceInfo {
  box: { x: number; y: number; w: number; h: number }
  age: number
  gender: 'male' | 'female'
  pts: { x: number; y: number }[]
}

export default function AgeMachineApp() {
  const pushToast = useOS((s) => s.pushToast)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const libRef = useRef<Promise<void> | null>(null)
  const faceRef = useRef<FaceInfo | null>(null)
  const lastDetectRef = useRef(0)
  const modeRef = useRef<Mode>('old')
  const intensityRef = useRef(50)
  const baseAgeRef = useRef<number | null>(null)

  const [libState, setLibState] = useState<LibState>('idle')
  const [libErr, setLibErr] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [hasFace, setHasFace] = useState(false)
  const [mode, setMode] = useState<Mode>('old')
  const [intensity, setIntensity] = useState(50)
  const [manualAge, setManualAge] = useState(28)
  const [info, setInfo] = useState<{ age: number; gender: string; shown: number } | null>(null)

  const setModeBoth = (m: Mode) => {
    setMode(m)
    modeRef.current = m
  }
  const setIntensityBoth = (v: number) => {
    setIntensity(v)
    intensityRef.current = v
  }

  /* ── بارگذاری کتابخانه و مدل‌ها ── */
  const ensureLib = useCallback(async (): Promise<boolean> => {
    if (libState === 'ready') return true
    try {
      setLibState('loading')
      setLibErr('')
      if (!libRef.current) {
        libRef.current = new Promise<void>((resolve, reject) => {
          if (window.faceapi) {
            resolve()
            return
          }
          const s = document.createElement('script')
          s.id = 'faceapi-script'
          s.src = FACEAPI_CDN
          s.async = true
          s.onload = () => resolve()
          s.onerror = () => reject(new Error('بارگذاری کتابخانه ناموفق بود — اینترنت را چک کن'))
          document.head.appendChild(s)
        })
      }
      await libRef.current
      const f = window.faceapi
      if (!f) throw new Error('کتابخانه در دسترس نیست')
      await Promise.all([
        f.nets.tinyFaceDetector.isLoaded
          ? Promise.resolve()
          : f.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        f.nets.ageGenderNet.isLoaded ? Promise.resolve() : f.nets.ageGenderNet.loadFromUri(MODEL_URL),
        f.nets.faceLandmark68Net.isLoaded
          ? Promise.resolve()
          : f.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      ])
      setLibState('ready')
      return true
    } catch (err) {
      setLibState('error')
      setLibErr(err instanceof Error ? err.message : 'خطای ناشناخته')
      return false
    }
  }, [libState])

  const stopCamera = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) videoRef.current.srcObject = null
    faceRef.current = null
    setPhase('idle')
    setHasFace(false)
    setInfo(null)
  }, [])

  /* ── چین‌وچروک‌ها روی نقاط لندمارک ── */
  const drawAging = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, face: FaceInfo, k: number) => {
      const mx = (x: number) => w - x // آینه‌سازی X
      const p = (i: number) => ({ x: mx(face.pts[i].x), y: face.pts[i].y })
      ctx.save()
      ctx.lineCap = 'round'

      // چین‌های پیشانی — سه کمان لایه‌لایه
      const browL = p(17)
      const browR = p(26)
      const cx = (browL.x + browR.x) / 2
      const boxTop = face.box.y
      const span = Math.abs(browR.x - browL.x) * 0.82
      for (let i = 0; i < 3; i++) {
        const y = boxTop + face.box.h * (0.12 + i * 0.075)
        ctx.strokeStyle = `rgba(64,44,32,${0.12 + 0.3 * k})`
        ctx.lineWidth = 1 + k * 1.4
        ctx.beginPath()
        ctx.moveTo(cx - span / 2, y)
        ctx.quadraticCurveTo(cx, y - 4 - i, cx + span / 2, y)
        ctx.stroke()
      }
      // دو خط عمودی اخم بین ابروها
      if (k > 0.35) {
        const g1 = p(19)
        const g2 = p(24)
        ctx.strokeStyle = `rgba(64,44,32,${(k - 0.35) * 0.5})`
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo((g1.x + g2.x) / 2 - 5, boxTop + face.box.h * 0.18)
        ctx.lineTo((g1.x + g2.x) / 2 - 5, boxTop + face.box.h * 0.33)
        ctx.moveTo((g1.x + g2.x) / 2 + 5, boxTop + face.box.h * 0.18)
        ctx.lineTo((g1.x + g2.x) / 2 + 5, boxTop + face.box.h * 0.33)
        ctx.stroke()
      }

      // پا و چروک دور چشم‌ها (پاچهٔ چشم)
      const drawCrows = (corner: { x: number; y: number }, dir: 1 | -1) => {
        for (let i = 1; i <= 3; i++) {
          ctx.strokeStyle = `rgba(64,44,32,${(0.1 + 0.25 * k) * (1 - i * 0.18)})`
          ctx.lineWidth = 1.2
          ctx.beginPath()
          ctx.moveTo(corner.x, corner.y)
          ctx.lineTo(corner.x + dir * (7 + i * 5), corner.y - 3 + i * 4)
          ctx.stroke()
        }
      }
      const eL = p(36)
      const eR = p(45)
      drawCrows(eL, -1)
      drawCrows(eR, 1)

      // زیر چشم
      const underEye = (eye: { x: number; y: number }) => {
        ctx.strokeStyle = `rgba(70,50,40,${0.1 + 0.22 * k})`
        ctx.lineWidth = 1.3
        ctx.beginPath()
        ctx.arc(eye.x, eye.y + 6, 9, Math.PI * 0.25, Math.PI * 0.75)
        ctx.stroke()
      }
      underEye({ x: (p(39).x + p(36).x) / 2, y: (p(39).y + p(41).y) / 2 })
      underEye({ x: (p(42).x + p(45).x) / 2, y: (p(42).y + p(47).y) / 2 })

      // خط خنده (نازولابیال) از بالای بینی تا گوشهٔ لب
      const noseL = p(31)
      const noseR = p(35)
      const mouthL = p(48)
      const mouthR = p(54)
      ctx.strokeStyle = `rgba(70,45,35,${0.14 + 0.34 * k})`
      ctx.lineWidth = 1.6 + k
      ctx.beginPath()
      ctx.moveTo(noseL.x - 2, noseL.y)
      ctx.quadraticCurveTo(noseL.x - 8, mouthL.y - 10, mouthL.x - 2, mouthL.y + 1)
      ctx.moveTo(noseR.x + 2, noseR.y)
      ctx.quadraticCurveTo(noseR.x + 8, mouthR.y - 10, mouthR.x + 2, mouthR.y + 1)
      ctx.stroke()

      // چانه و افتادگی گوشهٔ لب
      if (k > 0.5) {
        const chin = p(8)
        const lipB = p(57)
        ctx.strokeStyle = `rgba(64,44,32,${(k - 0.5) * 0.4})`
        ctx.lineWidth = 1.4
        ctx.beginPath()
        ctx.moveTo(lipB.x - 14, lipB.y + 6)
        ctx.quadraticCurveTo(lipB.x, lipB.y + 10 + k * 6, lipB.x + 14, lipB.y + 6)
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(chin.x, chin.y - 4, 8, Math.PI * 1.15, Math.PI * 1.85)
        ctx.stroke()
      }

      // موی جوگندمی — رگه‌های سفید بالای قاب
      if (k > 0.45) {
        const topY = boxTop - 2
        const hw = face.box.w * 0.6
        for (let i = 0; i < 10; i++) {
          ctx.strokeStyle = `rgba(235,235,235,${(k - 0.45) * 0.5 * (0.5 + Math.random() * 0.5)})`
          ctx.lineWidth = 1
          const sx = cx - hw / 2 + (i / 9) * hw
          ctx.beginPath()
          ctx.moveTo(sx, topY + 4)
          ctx.quadraticCurveTo(sx + 3, topY - 6, sx + (Math.random() - 0.5) * 10, topY - 12)
          ctx.stroke()
        }
      }
      ctx.restore()
    },
    []
  )

  /* ── افکت جوان‌کن ── */
  const drawYoung = useCallback(
    (ctx: CanvasRenderingContext2D, v: HTMLVideoElement, face: FaceInfo, k: number) => {
      const w = v.videoWidth || 640
      const h = v.videoHeight || 480
      // صاف‌کنندهٔ پوست داخل بیضی چهره
      ctx.save()
      const bx = face.box.x + face.box.w / 2
      const by = face.box.y + face.box.h / 2
      ctx.beginPath()
      ctx.ellipse(bx, by, face.box.w * 0.52, face.box.h * 0.56, 0, 0, Math.PI * 2)
      ctx.clip()
      ctx.filter = `blur(${1 + 2.6 * k}px) brightness(${1 + 0.07 * k}) saturate(${1 + 0.08 * k})`
      ctx.translate(w, 0)
      ctx.scale(-1, 1)
      ctx.drawImage(v, 0, 0, w, h)
      ctx.restore()
      ctx.filter = 'none'
      // لپ‌های گل‌اندازی
      const mx = (x: number) => w - x
      const cheeks = [face.pts[1], face.pts[15]]
      for (const c of cheeks) {
        const cx = mx(c.x)
        const cy = c.y + face.box.h * 0.1
        const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, face.box.w * 0.22)
        g.addColorStop(0, `rgba(244,114,182,${0.16 * k})`)
        g.addColorStop(1, 'rgba(244,114,182,0)')
        ctx.fillStyle = g
        ctx.fillRect(cx - face.box.w * 0.25, cy - face.box.w * 0.25, face.box.w * 0.5, face.box.w * 0.5)
      }
    },
    []
  )

  /* ── حلقهٔ رندر + تشخیص ── */
  const loop = useCallback(function loop() {
    const f = window.faceapi
    const v = videoRef.current
    const cv = canvasRef.current
    if (!f || !v || !cv || v.readyState < 2) {
      rafRef.current = requestAnimationFrame(loop)
      return
    }
    const w = v.videoWidth || 640
    const h = v.videoHeight || 480
    if (cv.width !== w) cv.width = w
    if (cv.height !== h) cv.height = h
    const ctx = cv.getContext('2d')
    if (!ctx) return

    const k = intensityRef.current / 100
    const isOld = modeRef.current === 'old'

    // ۱) تصویر پایه با فیلتر
    ctx.save()
    if (isOld) {
      ctx.filter = `saturate(${Math.max(0.35, 1 - 0.55 * k)}) contrast(${1 + 0.1 * k}) brightness(${1 - 0.05 * k})`
    }
    ctx.translate(w, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(v, 0, 0, w, h)
    ctx.restore()
    ctx.filter = 'none'

    // ۲) تشخیص هر ۳۵۰ms
    const now = performance.now()
    if (now - lastDetectRef.current > 350) {
      lastDetectRef.current = now
      const opts = new f.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
      f.detectSingleFace(v, opts)
        .withFaceLandmarks()
        .withAgeAndGender()
        .then((r: any) => {
          if (r) {
            const b = r.detection.box
            faceRef.current = {
              box: { x: b.x, y: b.y, w: b.width, h: b.height },
              age: r.age,
              gender: r.gender,
              pts: r.landmarks.positions.map((p: { _x: number; _y: number }) => ({ x: p._x, y: p._y })),
            }
            baseAgeRef.current = r.age
            setHasFace(true)
            const base = r.age
            const delta = Math.round(k * (isOld ? 40 : -22))
            setInfo({
              age: Math.round(base),
              gender: r.gender === 'male' ? 'آقا' : 'خانم',
              shown: Math.max(5, Math.round(base + delta)),
            })
          } else {
            faceRef.current = null
            setHasFace(false)
            setInfo(null)
          }
        })
        .catch(() => {})
    }

    // ۳) افکت‌ها
    const face = faceRef.current
    if (face) {
      if (isOld) drawAging(ctx, w, h, face, k)
      else drawYoung(ctx, v, face, k)
    }

    rafRef.current = requestAnimationFrame(loop)
  }, [drawAging, drawYoung])

  const startCamera = useCallback(async () => {
    const ok = await ensureLib()
    if (!ok) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      })
      streamRef.current = stream
      const v = videoRef.current
      if (!v) return
      v.srcObject = stream
      await v.play()
      setPhase('live')
      pushToast({
        icon: '⏳',
        title: 'ماشین زمان روشن شد',
        body: 'صورتت را در کادر نگه دار و کلید زمان را بچرخان!',
      })
      loop()
    } catch (err) {
      const msg =
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'دسترسی به دوربین داده نشد — اجازه بده!'
          : 'دوربینی پیدا نشد یا خطایی پیش آمد'
      setLibErr(msg)
      setLibState('error')
      pushToast({ icon: '⚠️', title: 'دوربین کار نکرد', body: msg })
    }
  }, [ensureLib, loop, pushToast])

  /* ── عکس یادگاری ── */
  const snapshot = useCallback(() => {
    const cv = canvasRef.current
    const v = videoRef.current
    if (!cv || !v) return
    const w = cv.width
    const h = cv.height
    const out = document.createElement('canvas')
    out.width = w
    out.height = h + 54
    const ctx = out.getContext('2d')
    if (!ctx) return
    ctx.drawImage(cv, 0, 0)
    ctx.fillStyle = 'rgba(2,6,23,0.92)'
    ctx.fillRect(0, h, w, 54)
    ctx.direction = 'rtl'
    const shown = info?.shown ?? manualAge
    ctx.fillStyle = modeRef.current === 'old' ? '#a855f7' : '#22d3ee'
    ctx.font = 'bold 20px Vazirmatn, sans-serif'
    ctx.fillText(
      `${modeRef.current === 'old' ? 'در آینده' : 'در گذشته'}: ~${fa(shown)} سال`,
      w - 12,
      h + 26
    )
    ctx.fillStyle = '#71717a'
    ctx.font = '12px Vazirmatn, sans-serif'
    ctx.fillText('ماشین زمان چهرهٔ سان‌جاب‌اواس — با اسپانسری سان‌جاب', w - 12, h + 44)
    const a = document.createElement('a')
    a.href = out.toDataURL('image/png')
    a.download = 'sanjab-age-machine.png'
    a.click()
  }, [info, manualAge])

  useEffect(() => () => stopCamera(), [stopCamera])

  const shownAge = info?.shown ?? (phase === 'live' && !hasFace ? manualAge + Math.round((intensity / 100) * (mode === 'old' ? 40 : -22)) : null)

  return (
    <div className="flex h-full w-full flex-col bg-zinc-950/70">
      {/* هدر */}
      <div className="flex items-center gap-2 border-b border-white/10 bg-zinc-900/70 p-2.5">
        <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-[#8b5cf6] to-[#22d3ee] text-white">
          <Hourglass size={16} />
        </span>
        <div className="min-w-0">
          <h2 className="text-xs font-black text-zinc-100">ماشین زمان چهره</h2>
          <p className="text-[10px] text-zinc-500">جوان‌کن و پیرکن زنده — جادوی بوم‌نقاشی</p>
        </div>
        {shownAge !== null && (
          <span className="pengo-fadein mr-auto rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-black text-zinc-100">
            ~{fa(shownAge)} سال
          </span>
        )}
      </div>

      {/* صحنه */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center bg-black/60 p-2">
        <div className="relative overflow-hidden rounded-xl border border-white/10">
          <video
            ref={videoRef}
            muted
            playsInline
            className="block max-h-full max-w-full"
            style={{ width: '100%', aspectRatio: '4 / 3', background: '#0b1120', visibility: phase === 'live' ? 'visible' : 'hidden' }}
          />
          <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
          {phase !== 'live' && (
            <div className="absolute inset-0 grid place-items-center bg-black/70 p-4 text-center">
              <div className="flex flex-col items-center gap-2">
                {libState === 'loading' ? (
                  <>
                    <Loader2 className="size-7 animate-spin text-[#8b5cf6]" />
                    <p className="text-xs text-zinc-300">در حال بارگذاری مدل‌های چهره…</p>
                  </>
                ) : libState === 'error' ? (
                  <>
                    <AlertTriangle className="size-7 text-rose-400" />
                    <p className="max-w-xs text-xs text-rose-300">{libErr}</p>
                  </>
                ) : (
                  <>
                    <Hourglass className="size-7 text-zinc-500" />
                    <p className="max-w-[250px] text-xs leading-5 text-zinc-400">
                      دوربین را روشن کن و ببین ۳۰ سال بعد خودت چه شکلی می‌شود — یا دوباره بچرخ به بچگی!
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
          {phase === 'live' && (
            <div className="pengo-fadein absolute right-2 top-2 z-10 flex flex-col gap-1">
              <span
                className={`rounded-full px-2 py-0.5 text-[9.5px] font-black backdrop-blur ${
                  mode === 'old' ? 'bg-violet-500/80 text-white' : 'bg-cyan-400/80 text-zinc-950'
                }`}
              >
                {mode === 'old' ? '⏩ پیرتر' : '⏪ جوان‌تر'}
              </span>
              {info && (
                <span dir="rtl" className="max-w-[190px] truncate rounded-full bg-black/60 px-2 py-0.5 text-[9.5px] font-bold text-zinc-200 backdrop-blur">
                  سن واقعی: ~{fa(info.age)} · {info.gender}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* کنترل‌ها */}
      <div className="space-y-2.5 border-t border-white/10 bg-zinc-900/70 p-3">
        <div className="flex flex-wrap items-center gap-2">
          {phase === 'idle' ? (
            <button
              onClick={() => void startCamera()}
              disabled={libState === 'loading'}
              className="flex h-9 items-center gap-1.5 rounded-lg bg-gradient-to-l from-[#8b5cf6] to-[#7c3aed] px-4 text-xs font-black text-white transition hover:brightness-110 active:scale-95 disabled:opacity-50"
            >
              <Camera size={14} />
              روشن کردن دوربین
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="flex h-9 items-center gap-1.5 rounded-lg bg-rose-500/20 px-4 text-xs font-bold text-rose-300 transition hover:bg-rose-500/30 active:scale-95"
            >
              <CameraOff size={14} />
              خاموش کردن
            </button>
          )}
          {phase === 'live' && (
            <button
              onClick={snapshot}
              className="flex h-9 items-center gap-1.5 rounded-lg bg-gradient-to-l from-[#f7931e] to-[#e07b00] px-4 text-xs font-black text-white transition hover:brightness-110 active:scale-95"
            >
              <Download size={14} />
              عکس یادگاری
            </button>
          )}
          <div className="mr-auto flex gap-1">
            {[
              { label: '+۳۰ سال', m: 'old' as Mode, v: 75 },
              { label: '+۱۰ سال', m: 'old' as Mode, v: 25 },
              { label: '−۵ سال', m: 'young' as Mode, v: 23 },
              { label: 'بچگی', m: 'young' as Mode, v: 80 },
            ].map((p) => (
              <button
                key={p.label}
                onClick={() => {
                  setModeBoth(p.m)
                  setIntensityBoth(p.v)
                }}
                className={`rounded-lg border px-2 py-1.5 text-[10px] font-black transition active:scale-95 ${
                  mode === p.m && intensity === p.v
                    ? 'border-transparent bg-[#8b5cf6] text-white'
                    : 'border-white/10 bg-zinc-800/80 text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* کلید زمان */}
        <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-2.5">
          <div className="mb-1.5 flex items-center justify-between text-[10px] font-bold">
            <button
              onClick={() => setModeBoth('young')}
              className={`rounded-md px-2 py-1 transition ${
                mode === 'young' ? 'bg-cyan-400/20 text-cyan-300' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              ⏪ جوان‌کن
            </button>
            <span className="text-zinc-500">کلید زمان</span>
            <button
              onClick={() => setModeBoth('old')}
              className={`rounded-md px-2 py-1 transition ${
                mode === 'old' ? 'bg-violet-500/20 text-violet-300' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              پیرتر ⏩
            </button>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={intensity}
            onChange={(e) => setIntensityBoth(parseInt(e.target.value, 10))}
            className={`w-full ${mode === 'old' ? 'accent-[#8b5cf6]' : 'accent-[#22d3ee]'}`}
            aria-label="شدت جادوی زمان"
          />
          {!hasFace && phase === 'live' && (
            <label className="mt-1 flex items-center justify-between text-[10px] text-zinc-400">
              <span>سن دستی (چهره‌ای پیدا نشد)</span>
              <span className="font-black text-zinc-200">{fa(manualAge)} سال</span>
            </label>
          )}
          {!hasFace && phase === 'live' && (
            <input
              type="range"
              min={6}
              max={80}
              value={manualAge}
              onChange={(e) => setManualAge(parseInt(e.target.value, 10))}
              className="w-full accent-zinc-400"
              aria-label="سن پایهٔ دستی"
            />
          )}
        </div>

        <div className="flex items-center justify-between gap-2 text-[9.5px] text-zinc-600">
          <span className="flex items-center gap-1">
            <Sparkles size={9} />
            همه‌چیز محلی است — هیچ تصویری ارسال نمی‌شود
          </span>
          <button
            onClick={() => {
              setIntensityBoth(50)
              setModeBoth('old')
            }}
            className="flex items-center gap-1 text-zinc-500 transition hover:text-zinc-300"
          >
            <Undo2 size={10} />
            ریست
          </button>
        </div>
      </div>
    </div>
  )
}
