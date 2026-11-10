'use client'

/* «تشخیص چهره»، تشخیص جنسیت و سن با دوربین + face-api.js
   کتابخانه: face-api.js (justadudewhohacks) مبتنی بر TensorFlow.js
   مدل‌ها از CDN jsDelivr بارگذاری می‌شوند. */

import { useCallback, useEffect, useRef, useState } from 'react'
import { Camera, CameraOff, Loader2, ScanFace, AlertTriangle, Sparkles } from 'lucide-react'
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

type LoadState = 'idle' | 'loading-lib' | 'loading-models' | 'ready' | 'error'

interface Detection {
  x: number
  y: number
  w: number
  h: number
  gender: string
  age: number
  expression: string
}

const EXP_FA: Record<string, string> = {
  neutral: 'خنثی',
  happy: 'خوشحال',
  sad: 'غمگین',
  angry: 'عصبانی',
  fearful: 'ترسیده',
  disgusted: 'بیزار',
  surprised: 'متعجب',
}

export default function FaceDetectApp() {
  const pushToast = useOS((s) => s.pushToast)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [loadState, setLoadState] = useState<LoadState>('idle')
  const [error, setError] = useState('')
  const [running, setRunning] = useState(false)
  const [detections, setDetections] = useState<Detection[]>([])
  const [fps, setFps] = useState(0)
  const lastFrameRef = useRef(performance.now())

  /* بارگذاری face-api.js از CDN */
  const loadLibrary = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.faceapi) {
        resolve()
        return
      }
      const existing = document.getElementById(
        'faceapi-script'
      ) as HTMLScriptElement | null
      if (existing) {
        existing.addEventListener('load', () => resolve())
        existing.addEventListener('error', () =>
          reject(new Error('بارگذاری کتابخانه face-api ناموفق بود'))
        )
        return
      }
      const script = document.createElement('script')
      script.id = 'faceapi-script'
      script.src = FACEAPI_CDN
      script.async = true
      script.onload = () => resolve()
      script.onerror = () =>
        reject(new Error('بارگذاری کتابخانه face-api ناموفق بود، اینترنت چک کن'))
      document.head.appendChild(script)
    })
  }, [])

  /* بارگذاری مدل‌ها */
  const loadModels = useCallback(async (): Promise<void> => {
    const f = window.faceapi
    if (!f) throw new Error('کتابخانه بارگذاری نشده')
    await Promise.all([
      f.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      f.nets.ageGenderNet.loadFromUri(MODEL_URL),
      f.nets.faceExpressionNet.loadFromUri(MODEL_URL),
    ])
  }, [])

  const ensureLoaded = useCallback(async (): Promise<boolean> => {
    if (loadState === 'ready') return true
    try {
      setLoadState('loading-lib')
      setError('')
      await loadLibrary()
      setLoadState('loading-models')
      await loadModels()
      setLoadState('ready')
      return true
    } catch (err) {
      setLoadState('error')
      setError(err instanceof Error ? err.message : 'خطای ناشناخته')
      return false
    }
  }, [loadState, loadLibrary, loadModels])

  const stopCamera = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setRunning(false)
    setDetections([])
    const cv = canvasRef.current
    if (cv) {
      const ctx = cv.getContext('2d')
      if (ctx) ctx.clearRect(0, 0, cv.width, cv.height)
    }
  }, [])

  const detectLoop = useCallback(function detectLoop() {
    const f = window.faceapi
    const v = videoRef.current
    const cv = canvasRef.current
    if (!f || !v || !cv || v.readyState < 2) {
      rafRef.current = requestAnimationFrame(detectLoop)
      return
    }
    const w = v.videoWidth || 640
    const h = v.videoHeight || 480
    if (cv.width !== w) cv.width = w
    if (cv.height !== h) cv.height = h
    const ctx = cv.getContext('2d')
    if (!ctx) return

    const opts = new f.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
    f.detectAllFaces(v, opts)
      .withAgeAndGender()
      .withFaceExpressions()
      .then((results: any[]) => {
        ctx.clearRect(0, 0, w, h)
        const ds: Detection[] = []
        for (const r of results) {
          const box = r.detection.box
          const gender = r.gender === 'male' ? 'آقا' : 'خانم'
          const age = Math.round(r.age)
          let bestExp = 'neutral'
          let bestVal = 0
          const exps = r.expressions || {}
          for (const k of Object.keys(exps)) {
            if (exps[k] > bestVal) {
              bestVal = exps[k]
              bestExp = k
            }
          }
          ds.push({
            x: box.x,
            y: box.y,
            w: box.width,
            h: box.height,
            gender,
            age,
            expression: EXP_FA[bestExp] || bestExp,
          })
          // فقط قاب، برچسب‌ها با HTML روی ویدیو می‌نشینند تا متن فارسی برعکس/بریده نشود
          ctx.lineWidth = 3
          ctx.strokeStyle = r.gender === 'male' ? '#38bdf8' : '#f472b6'
          ctx.strokeRect(box.x, box.y, box.width, box.height)
          // گوشه‌های قاب لنگری
          ctx.lineWidth = 5
          const c = Math.min(22, box.width * 0.22)
          const corners: [number, number, number, number][] = [
            [box.x, box.y, box.x + c, box.y],
            [box.x, box.y, box.x, box.y + c],
            [box.x + box.width, box.y, box.x + box.width - c, box.y],
            [box.x + box.width, box.y, box.x + box.width, box.y + c],
            [box.x, box.y + box.height, box.x + c, box.y + box.height],
            [box.x, box.y + box.height, box.x, box.y + box.height - c],
            [box.x + box.width, box.y + box.height, box.x + box.width - c, box.y + box.height],
            [box.x + box.width, box.y + box.height, box.x + box.width, box.y + box.height - c],
          ]
          ctx.beginPath()
          for (const [x1, y1, x2, y2] of corners) {
            ctx.moveTo(x1, y1)
            ctx.lineTo(x2, y2)
          }
          ctx.stroke()
        }
        setDetections(ds)
        const now = performance.now()
        const dt = now - lastFrameRef.current
        lastFrameRef.current = now
        if (dt > 0) setFps(Math.round(1000 / dt))
        rafRef.current = requestAnimationFrame(detectLoop)
      })
      .catch(() => {
        rafRef.current = requestAnimationFrame(detectLoop)
      })
  }, [])

  const startCamera = useCallback(async () => {
    const ok = await ensureLoaded()
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
      setRunning(true)
      pushToast({
        icon: '🎥',
        title: 'دوربین روشن شد',
        body: 'حالا صورتت را جلوی دوربین بگیر، سان‌جاب حدس می‌زنه!',
      })
      detectLoop()
    } catch (err) {
      const msg =
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'دسترسی به دوربین داده نشد، اجازه بده!'
          : err instanceof DOMException && err.name === 'NotFoundError'
            ? 'دوربینی پیدا نشد، شاید روی دسکتاپ بدون وب‌کم هستی'
            : 'خطا در باز کردن دوربین'
      setError(msg)
      pushToast({ icon: '⚠️', title: 'دوربین کار نکرد', body: msg })
    }
  }, [ensureLoaded, pushToast, detectLoop])

  useEffect(() => {
    return () => stopCamera()
  }, [stopCamera])

  const loadLabel: Record<LoadState, string> = {
    idle: 'برای شروع دوربین را روشن کن',
    'loading-lib': 'در حال بارگذاری کتابخانه هوش…',
    'loading-models': 'در حال بارگذاری مدل‌های هوش مصنوعی…',
    ready: 'آماده! دوربین را روشن کن',
    error: 'خطا در بارگذاری',
  }

  return (
    <div className="flex h-full w-full flex-col bg-zinc-950/70">
      {/* هدر */}
      <div className="flex items-center gap-2 border-b border-white/10 bg-zinc-900/70 p-2.5">
        <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-[#f7931e] to-[#8b5cf6] text-white">
          <ScanFace size={16} />
        </span>
        <div className="min-w-0">
          <h2 className="text-xs font-black text-zinc-100">تشخیص چهره</h2>
          <p className="text-[10px] text-zinc-500">جنسیت و سن با هوش مصنوعی</p>
        </div>
        <span className="mr-auto flex items-center gap-1.5">
          {running && (
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
              <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
              زنده · {fps} FPS
            </span>
          )}
        </span>
      </div>

      {/* ناحیه ویدیو */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center bg-black/60 p-2">
        <div className="relative overflow-hidden rounded-xl border border-white/10">
          <video
            ref={videoRef}
            muted
            playsInline
            className="block max-h-full max-w-full object-cover"
            style={{
              width: '100%',
              aspectRatio: '4 / 3',
              transform: 'scaleX(-1)',
              background: '#0b1120',
            }}
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 h-full w-full"
            style={{ transform: 'scaleX(-1)' }}
          />
          {/* برچسب‌های HTML، چون canvas آینه‌ای است، متن را اینجا فارسی می‌کشیم */}
          {detections.map((d, i) => {
            const vw = videoRef.current?.videoWidth || 640
            const vh = videoRef.current?.videoHeight || 480
            const leftPct = ((vw - d.x - d.w) / vw) * 100
            const boxTopPct = (d.y / vh) * 100
            const above = d.y > 44
            const topPct = above
              ? Math.max(0.5, boxTopPct - 7)
              : Math.min(88, ((d.y + d.h) / vh) * 100 + 2)
            const leftClamped = Math.min(78, Math.max(2, leftPct))
            const male = d.gender === 'آقا'
            return (
              <span
                key={i}
                dir="rtl"
                className={`pengo-fadein pointer-events-none absolute z-10 max-w-[96%] truncate rounded-lg px-2 py-1 text-[11px] font-black text-zinc-950 shadow-lg backdrop-blur ${
                  male ? 'bg-sky-400/90' : 'bg-pink-400/90'
                }`}
                style={{ left: `${leftClamped}%`, top: `${topPct}%` }}
              >
                {d.gender} · ~{d.age.toLocaleString('fa-IR')} سال · {d.expression}
              </span>
            )
          })}
          {!running && (
            <div className="absolute inset-0 grid place-items-center bg-black/70 p-4 text-center">
              <div className="flex flex-col items-center gap-2">
                {loadState === 'loading-lib' || loadState === 'loading-models' ? (
                  <>
                    <Loader2 className="size-7 animate-spin text-[#f7931e]" />
                    <p className="text-xs text-zinc-300">{loadLabel[loadState]}</p>
                    <p className="text-[10px] text-zinc-500">
                      اولین بار کمی طول می‌کشه، بعداً سریع می‌شه
                    </p>
                  </>
                ) : loadState === 'error' ? (
                  <>
                    <AlertTriangle className="size-7 text-rose-400" />
                    <p className="max-w-xs text-xs text-rose-300">{error}</p>
                  </>
                ) : (
                  <>
                    <Camera className="size-7 text-zinc-500" />
                    <p className="text-xs text-zinc-400">{loadLabel[loadState]}</p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* پنل نتایج */}
      {detections.length > 0 && (
        <div className="flex max-h-28 shrink-0 flex-wrap gap-1.5 overflow-y-auto border-t border-white/10 bg-zinc-900/50 p-2">
          {detections.map((d, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-zinc-800/60 px-2.5 py-1.5 text-[11px]"
            >
              <span
                className={`grid size-6 place-items-center rounded-full text-[10px] font-black ${
                  d.gender === 'آقا'
                    ? 'bg-sky-500/20 text-sky-300'
                    : 'bg-pink-500/20 text-pink-300'
                }`}
              >
                {d.gender === 'آقا' ? '♂' : '♀'}
              </span>
              <span className="font-bold text-zinc-200">{d.gender}</span>
              <span className="text-zinc-500">·</span>
              <span className="text-amber-300">~{d.age} سال</span>
              <span className="text-zinc-500">·</span>
              <span className="text-violet-300">{d.expression}</span>
            </div>
          ))}
        </div>
      )}

      {/* نوار کنترل */}
      <div className="flex items-center gap-2 border-t border-white/10 bg-zinc-900/70 p-2">
        {running ? (
          <button
            onClick={stopCamera}
            className="flex h-8 items-center gap-1.5 rounded-lg bg-rose-500/20 px-4 text-xs font-bold text-rose-300 transition hover:bg-rose-500/30 active:scale-95"
          >
            <CameraOff size={14} />
            خاموش کردن
          </button>
        ) : (
          <button
            onClick={() => void startCamera()}
            disabled={loadState === 'loading-lib' || loadState === 'loading-models'}
            className="flex h-8 items-center gap-1.5 rounded-lg bg-gradient-to-l from-[#f7931e] to-[#e07b00] px-4 text-xs font-black text-white transition hover:brightness-110 active:scale-95 disabled:opacity-50"
          >
            <Camera size={14} />
            روشن کردن دوربین
          </button>
        )}
        <span className="mr-auto flex items-center gap-1 text-[9px] text-zinc-600">
          <Sparkles size={9} />
          face-api.js · TensorFlow.js · حریم خصوصی ۱۰۰٪، هیچ تصویری ارسال نمی‌شود
        </span>
      </div>
    </div>
  )
}
