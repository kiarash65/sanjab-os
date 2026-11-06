'use client'

/* «قدسنج و وزن‌یاب» — تخمین قد با کالیبراسیون چهره + وزن سالم پیشنهادی
   روش: عرض/ارتفاع صورت به‌عنوان «خط‌کش» زنده استفاده می‌شود؛
   بعد از فریز کردن تصویر، کاربر بالای سر و پاشنه پا را علامت می‌زند.
   صددرصد محلی — هیچ تصویری ارسال نمی‌شود. تخمین سرگرم‌کننده است، ترازو حرف آخر را می‌زند! */

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  Camera,
  CameraOff,
  Download,
  Eraser,
  Loader2,
  PersonStanding,
  Play,
  Ruler,
  ScanFace,
  Sparkles,
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

type Phase = 'idle' | 'live' | 'frozen'
type LibState = 'idle' | 'loading' | 'ready' | 'error'

interface FaceBox {
  x: number
  y: number
  w: number
  h: number
}

interface Marker {
  xp: number // درصد عرض کادر
  yp: number // درصد ارتفاع کادر
}

const fa = (n: number) => n.toLocaleString('fa-IR')

/* BMI دسته‌بندی */
function bmiInfo(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: 'کم‌وزن', color: '#38bdf8' }
  if (bmi < 25) return { label: 'نرمال', color: '#34d399' }
  if (bmi < 30) return { label: 'اضافه‌وزن', color: '#f7931e' }
  return { label: 'چاقی', color: '#f43f5e' }
}

export default function BodyMetricsApp() {
  const pushToast = useOS((s) => s.pushToast)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const libRef = useRef<Promise<void> | null>(null)
  const boxRef = useRef<FaceBox | null>(null)
  const lastDetectRef = useRef(0)
  const stageRef = useRef<HTMLDivElement | null>(null)

  const [libState, setLibState] = useState<LibState>('idle')
  const [libErr, setLibErr] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [detected, setDetected] = useState(false)
  const [faceHpx, setFaceHpx] = useState(0) // ارتفاع قاب چهره در پیکسل ویدیو
  const [faceHcm, setFaceHcm] = useState(23) // قد واقعی صورت (چانه تا فرق سر)
  const [gender, setGender] = useState<'male' | 'female'>('male')
  const [frame, setFrame] = useState(3) // اسلایدر بندی بدن ۱..۵
  const [head, setHead] = useState<Marker>({ xp: 50, yp: 12 })
  const [foot, setFoot] = useState<Marker>({ xp: 50, yp: 92 })
  const [dragging, setDragging] = useState<'head' | 'foot' | null>(null)
  const [distCm, setDistCm] = useState<number | null>(null)

  /* ── بارگذاری کتابخانه + مدل تشخیص چهره (سبک) ── */
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
      if (!f.nets.tinyFaceDetector.isLoaded) {
        await f.nets.tinyFaceDetector.loadFromUri(MODEL_URL)
      }
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
    boxRef.current = null
    setPhase('idle')
    setDetected(false)
    setDistCm(null)
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
    ctx.clearRect(0, 0, w, h)

    const now = performance.now()
    if (now - lastDetectRef.current > 350) {
      lastDetectRef.current = now
      const opts = new f.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
      f.detectSingleFace(v, opts)
        .then((r: any) => {
          if (r) {
            const b = r.box
            boxRef.current = { x: b.x, y: b.y, w: b.width, h: b.height }
            setFaceHpx(Math.round(b.height))
            setDetected(true)
          } else {
            boxRef.current = null
            setDetected(false)
          }
          // رسم قاب
          const box = boxRef.current
          if (box) {
            ctx.lineWidth = 3
            ctx.strokeStyle = '#34d399'
            ctx.strokeRect(box.x, box.y, box.w, box.h)
          }
        })
        .catch(() => {})
    }
    rafRef.current = requestAnimationFrame(detectLoop)
  }, [])

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
        icon: '📏',
        title: 'دوربین روشن شد',
        body: 'صورتت را در کادر نگه دار تا خط‌کش کالیبره شود!',
      })
      detectLoop()
    } catch (err) {
      const msg =
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'دسترسی به دوربین داده نشد — اجازه بده!'
          : 'دوربینی پیدا نشد یا خطایی پیش آمد'
      setLibErr(msg)
      pushToast({ icon: '⚠️', title: 'دوربین کار نکرد', body: msg })
    }
  }, [ensureLib, detectLoop, pushToast])

  /* ── فریز کردن تصویر برای علامت‌گذاری ── */
  const freeze = useCallback(() => {
    const v = videoRef.current
    if (!v || !boxRef.current) {
      pushToast({
        icon: '🤷',
        title: 'اول چهره کالیبره شود',
        body: 'صورتت را جلوی دوربین نگه دار تا قاب سبز بیاید، بعد فریز کن.',
      })
      return
    }
    v.pause()
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    // تخمین فاصله: focal ≈ w / (2·tan(30°))
    const vw = v.videoWidth || 640
    const bw = boxRef.current.w
    const focal = vw / 1.155
    const d = Math.round((focal * 15) / bw) // با عرض صورت پیش‌فرض ۱۵ سانتی‌متر
    setDistCm(d)
    setPhase('frozen')
    setHead({ xp: 50, yp: Math.max(4, ((boxRef.current.y - 6) / (v.videoHeight || 480)) * 100) })
    setFoot({ xp: 50, yp: 92 })
  }, [pushToast])

  const unfreeze = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    void v.play()
    setPhase('live')
    detectLoop()
  }, [detectLoop])

  /* ── محاسبه قد ── */
  const vh = videoRef.current?.videoHeight || 480
  const headPx = (head.yp / 100) * vh
  const footPx = (foot.yp / 100) * vh
  const pxSpan = Math.max(0, footPx - headPx)
  const heightCm = faceHpx > 0 ? (pxSpan / faceHpx) * faceHcm : 0

  /* ── وزن پیشنهادی (Broca + بندی بدن) ── */
  const base = gender === 'male' ? heightCm - 100 : heightCm - 105
  const adjust = 0.9 + (frame - 1) * 0.05 // بندی ۱ → ۹۰٪، بندی ۵ → ۱۱۰٪
  const weightKg = base > 0 ? base * adjust : 0
  const wMin = weightKg * 0.92
  const wMax = weightKg * 1.08
  const hM = heightCm / 100
  const bmiNormalMin = 18.5 * hM * hM
  const bmiNormalMax = 24.9 * hM * hM

  /* ── گرفتن عکس یادگاری ── */
  const snapshot = useCallback(() => {
    const v = videoRef.current
    const cv = canvasRef.current
    if (!v || !cv) return
    const w = v.videoWidth || 640
    const h = v.videoHeight || 480
    const out = document.createElement('canvas')
    out.width = w
    out.height = h + 56
    const ctx = out.getContext('2d')
    if (!ctx) return
    // تصویر آینه‌ای
    ctx.save()
    ctx.translate(w, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(cv, 0, 0)
    ctx.restore()
    // نشانگرها (آینه‌ای)
    const mx = (xp: number) => w - (xp / 100) * w
    ctx.strokeStyle = '#f7931e'
    ctx.lineWidth = 3
    ctx.setLineDash([8, 6])
    ctx.beginPath()
    ctx.moveTo(mx(head.xp), (head.yp / 100) * h)
    ctx.lineTo(mx(foot.xp), (foot.yp / 100) * h)
    ctx.stroke()
    ctx.setLineDash([])
    // نوار نتیجه
    ctx.fillStyle = 'rgba(2,6,23,0.92)'
    ctx.fillRect(0, h, w, 56)
    ctx.direction = 'rtl'
    ctx.fillStyle = '#f7931e'
    ctx.font = 'bold 20px Vazirmatn, sans-serif'
    ctx.fillText(
      `قد تخمینی: ${fa(Math.round(heightCm))} سانتی‌متر — وزن سالم: ${fa(Math.round(wMin))} تا ${fa(Math.round(wMax))} کیلوگرم`,
      w - 12,
      h + 34
    )
    ctx.fillStyle = '#71717a'
    ctx.font = '12px Vazirmatn, sans-serif'
    ctx.fillText('قدسنج و وزن‌یاب سان‌جاب‌اواس — با اسپانسری سان‌جاب', w - 12, h + 50)
    const a = document.createElement('a')
    a.href = out.toDataURL('image/png')
    a.download = 'sanjab-qad-sanj.png'
    a.click()
  }, [head, foot, heightCm, wMin, wMax])

  useEffect(() => () => stopCamera(), [stopCamera])

  /* ── درگ نشانگرها روی تصویر فریز شده ── */
  const markerDrag = (which: 'head' | 'foot') => (e: React.PointerEvent) => {
    e.preventDefault()
    setDragging(which)
    const move = (ev: PointerEvent) => {
      const stage = stageRef.current
      if (!stage) return
      const r = stage.getBoundingClientRect()
      const xp = Math.min(98, Math.max(2, ((ev.clientX - r.left) / r.width) * 100))
      const yp = Math.min(98, Math.max(2, ((ev.clientY - r.top) / r.height) * 100))
      if (which === 'head') setHead({ xp, yp })
      else setFoot({ xp, yp })
    }
    const up = () => {
      setDragging(null)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const stepNum = phase === 'idle' ? 1 : phase === 'live' ? (detected ? 2 : 1) : 3

  return (
    <div className="flex h-full w-full flex-col bg-zinc-950/70">
      {/* هدر */}
      <div className="flex items-center gap-2 border-b border-white/10 bg-zinc-900/70 p-2.5">
        <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 text-white">
          <PersonStanding size={16} />
        </span>
        <div className="min-w-0">
          <h2 className="text-xs font-black text-zinc-100">قدسنج و وزن‌یاب</h2>
          <p className="text-[10px] text-zinc-500">تخمین قد با خط‌کش چهره — سرگرمی علمی</p>
        </div>
        <span className="mr-auto flex items-center gap-1">
          {(['idle', 'live', 'frozen'] as const).map((p, i) => (
            <span
              key={p}
              className={`h-1.5 w-6 rounded-full transition ${
                stepNum > i ? 'bg-emerald-400' : 'bg-white/10'
              }`}
              aria-hidden
            />
          ))}
        </span>
      </div>

      <div className="os-scroll min-h-0 flex-1 overflow-y-auto">
        {/* صحنه دوربین */}
        <div className="relative flex items-center justify-center bg-black/60 p-2">
          <div ref={stageRef} className="relative overflow-hidden rounded-xl border border-white/10">
            <video
              ref={videoRef}
              muted
              playsInline
              className="block w-full"
              style={{ aspectRatio: '4 / 3', transform: 'scaleX(-1)', background: '#0b1120' }}
            />
            <canvas
              ref={canvasRef}
              className={`absolute inset-0 h-full w-full ${phase === 'frozen' ? 'opacity-0' : ''}`}
              style={{ transform: 'scaleX(-1)' }}
            />
            {phase === 'frozen' && (
              <>
                {/* خط قد */}
                <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
                  <line
                    x1={`${(head.xp + foot.xp) / 2}%`}
                    y1={`${head.yp}%`}
                    x2={`${(head.xp + foot.xp) / 2}%`}
                    y2={`${foot.yp}%`}
                    stroke="#f7931e"
                    strokeWidth="2"
                    strokeDasharray="7 5"
                  />
                </svg>
                {/* نشانگر بالای سر */}
                <button
                  type="button"
                  onPointerDown={markerDrag('head')}
                  aria-label="نشانگر بالای سر — بکش"
                  className={`absolute z-10 grid size-8 -translate-x-1/2 -translate-y-1/2 touch-none place-items-center rounded-full border-2 border-white bg-[#f7931e] text-white shadow-lg transition ${
                    dragging === 'head' ? 'scale-125' : 'hover:scale-110'
                  }`}
                  style={{ left: `${head.xp}%`, top: `${head.yp}%` }}
                >
                  <span className="text-[9px] font-black">سر</span>
                </button>
                <button
                  type="button"
                  onPointerDown={markerDrag('foot')}
                  aria-label="نشانگر پاشنه پا — بکش"
                  className={`absolute z-10 grid size-8 -translate-x-1/2 -translate-y-1/2 touch-none place-items-center rounded-full border-2 border-white bg-[#f7931e] text-white shadow-lg transition ${
                    dragging === 'foot' ? 'scale-125' : 'hover:scale-110'
                  }`}
                  style={{ left: `${foot.xp}%`, top: `${foot.yp}%` }}
                >
                  <span className="text-[9px] font-black">پا</span>
                </button>
              </>
            )}
            {phase === 'idle' && (
              <div className="absolute inset-0 grid place-items-center bg-black/70 p-4 text-center">
                <div className="flex flex-col items-center gap-2">
                  {libState === 'loading' ? (
                    <>
                      <Loader2 className="size-7 animate-spin text-emerald-400" />
                      <p className="text-xs text-zinc-300">در حال بارگذاری مدل چهره…</p>
                    </>
                  ) : libState === 'error' ? (
                    <>
                      <AlertTriangle className="size-7 text-rose-400" />
                      <p className="max-w-xs text-xs text-rose-300">{libErr}</p>
                    </>
                  ) : (
                    <>
                      <Ruler className="size-7 text-zinc-500" />
                      <p className="max-w-[240px] text-xs leading-5 text-zinc-400">
                        دوربین را روشن کن، صورتت داخل قاب سبز شود و بعد «فریز» را بزن —
                        الان جلوی دوربین ایستادن لازم نیست، عکس تمام‌قد بعداً!
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* پنل کنترل */}
        <div className="space-y-3 p-3">
          {/* دکمه‌ها */}
          <div className="flex flex-wrap items-center gap-2">
            {phase === 'idle' && (
              <button
                onClick={() => void startCamera()}
                disabled={libState === 'loading'}
                className="flex h-9 items-center gap-1.5 rounded-lg bg-gradient-to-l from-emerald-500 to-teal-600 px-4 text-xs font-black text-white transition hover:brightness-110 active:scale-95 disabled:opacity-50"
              >
                <Camera size={14} />
                روشن کردن دوربین
              </button>
            )}
            {phase === 'live' && (
              <>
                <button
                  onClick={freeze}
                  className={`flex h-9 items-center gap-1.5 rounded-lg px-4 text-xs font-black text-white transition active:scale-95 ${
                    detected
                      ? 'bg-gradient-to-l from-[#f7931e] to-[#e07b00] hover:brightness-110'
                      : 'bg-zinc-700 hover:bg-zinc-600'
                  }`}
                >
                  <ScanFace size={14} />
                  فریز برای اندازه‌گیری
                </button>
                <button
                  onClick={stopCamera}
                  className="flex h-9 items-center gap-1.5 rounded-lg bg-rose-500/20 px-3 text-xs font-bold text-rose-300 transition hover:bg-rose-500/30 active:scale-95"
                >
                  <CameraOff size={14} />
                  خاموش
                </button>
                <span
                  className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                    detected ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/5 text-zinc-400'
                  }`}
                >
                  {detected
                    ? `چهره کالیبره شد — ارتفاع قاب: ${fa(faceHpx)} پیکسل`
                    : 'منتظر چهره… صورتت را جلوی دوربین بگیر'}
                </span>
              </>
            )}
            {phase === 'frozen' && (
              <>
                <button
                  onClick={unfreeze}
                  className="flex h-9 items-center gap-1.5 rounded-lg bg-gradient-to-l from-emerald-500 to-teal-600 px-4 text-xs font-black text-white transition hover:brightness-110 active:scale-95"
                >
                  <Play size={14} />
                  ادامه زنده
                </button>
                <button
                  onClick={snapshot}
                  className="flex h-9 items-center gap-1.5 rounded-lg bg-gradient-to-l from-[#f7931e] to-[#e07b00] px-4 text-xs font-black text-white transition hover:brightness-110 active:scale-95"
                >
                  <Download size={14} />
                  عکس یادگاری
                </button>
                <button
                  onClick={() => {
                    setHead({ xp: 50, yp: 12 })
                    setFoot({ xp: 50, yp: 92 })
                  }}
                  className="flex h-9 items-center gap-1.5 rounded-lg bg-white/5 px-3 text-xs font-bold text-zinc-300 transition hover:bg-white/10 active:scale-95"
                >
                  <Eraser size={14} />
                  ریست نشانگرها
                </button>
              </>
            )}
          </div>

          {/* راهنمای فریز */}
          {phase === 'frozen' && (
            <div className="pengo-fadein flex items-start gap-2 rounded-xl border border-[#f7931e]/25 bg-[#f7931e]/10 p-3 text-[11px] leading-5 text-amber-200/90">
              <Sparkles size={15} className="mt-0.5 shrink-0 text-[#f7931e]" aria-hidden />
              <span>
                دو نشانگر نارنجی را بکش: یکی <b>فرق سر</b>، یکی <b>پاشنه پا</b> — در عکس تمام‌قد!
                اگر فقط نیم‌تنه داری، اندازه تا جایی که هست؛ قد واقعی بعداً تناسبی حساب می‌شود.
              </span>
            </div>
          )}

          {/* اسلایدر کالیبراسیون */}
          <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-3">
            <p className="mb-2 text-[11px] font-black text-zinc-200">کالیبراسیون خط‌کش چهره</p>
            <label className="mb-1 flex items-center justify-between text-[10.5px] text-zinc-400">
              <span>قد واقعی صورتت (چانه تا فرق سر)</span>
              <span className="font-black text-emerald-300">{fa(faceHcm)} سانتی‌متر</span>
            </label>
            <input
              type="range"
              min={19}
              max={27}
              step={0.5}
              value={faceHcm}
              onChange={(e) => setFaceHcm(parseFloat(e.target.value))}
              className="w-full accent-emerald-400"
              aria-label="قد واقعی صورت به سانتی‌متر"
            />
            <p className="mt-1 text-[9.5px] text-zinc-500">
              میانگین بزرگسالان حدود ۲۳ سانتی‌متر است؛ برای دقت بیشتر با متر واقعی اندازه بگیر.
              {distCm !== null && phase === 'frozen' && (
                <b className="text-teal-300"> فاصلهٔ تخمینی دوربین تا صورت: ~{fa(distCm)} سانتی‌متر</b>
              )}
            </p>
          </div>

          {/* نتیجه قد */}
          {phase === 'frozen' && heightCm > 20 && (
            <div className="pengo-fadein rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-center">
              <p className="text-[10px] font-bold text-emerald-300/80">قد تخمینی تو</p>
              <p className="text-3xl font-black text-emerald-300">
                {fa(Math.round(heightCm))}
                <span className="text-sm font-bold"> سانتی‌متر</span>
              </p>
              <p className="mt-1 text-[9.5px] text-zinc-400">
                دقت این روش به کیفیت عکس و نشانگرها بستگی دارد — چند بار امتحان کن!
              </p>
            </div>
          )}

          {/* وزن سالم */}
          {heightCm > 80 && (
            <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px] font-black text-zinc-200">وزن سالم پیشنهادی</p>
                <div className="flex gap-1 rounded-lg bg-white/5 p-0.5">
                  {(['male', 'female'] as const).map((g) => (
                    <button
                      key={g}
                      onClick={() => setGender(g)}
                      className={`rounded-md px-2.5 py-1 text-[10px] font-black transition ${
                        gender === g ? 'bg-[#f7931e] text-white' : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {g === 'male' ? 'آقا' : 'خانم'}
                    </button>
                  ))}
                </div>
              </div>
              <label className="mb-1 flex items-center justify-between text-[10.5px] text-zinc-400">
                <span>بندی بدن (اسکلت و عضله)</span>
                <span className="font-black text-[#f7931e]">
                  {['خیل لاغر', 'لاغر', 'متوسط', 'درشت‌هیکل', 'خیلی درشت'][frame - 1]}
                </span>
              </label>
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={frame}
                onChange={(e) => setFrame(parseInt(e.target.value, 10))}
                className="w-full accent-[#f7931e]"
                aria-label="بندی بدن"
              />
              {weightKg > 0 && (
                <>
                  <p className="mt-2 text-center text-2xl font-black text-[#f7931e]" dir="ltr">
                    {fa(Math.round(wMin))}–{fa(Math.round(wMax))}
                    <span className="text-xs font-bold"> کیلوگرم</span>
                  </p>
                  <p className="mt-1 text-center text-[10px] text-zinc-400">
                    بازهٔ BMI نرمال برای قد تو: {fa(Math.round(bmiNormalMin))} تا {fa(Math.round(bmiNormalMax))} کیلوگرم
                  </p>
                </>
              )}
              <div className="mt-2 flex flex-wrap justify-center gap-1">
                {[
                  { r: [0, 18.5], label: 'کم‌وزن', c: '#38bdf8' },
                  { r: [18.5, 25], label: 'نرمال', c: '#34d399' },
                  { r: [25, 30], label: 'اضافه‌وزن', c: '#f7931e' },
                  { r: [30, 99], label: 'چاقی', c: '#f43f5e' },
                ].map((b) => (
                  <span
                    key={b.label}
                    className="rounded-md px-2 py-0.5 text-[9px] font-bold"
                    style={{ background: `${b.c}22`, color: b.c }}
                  >
                    {b.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* سلب مسئولیت */}
          <div className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-[10px] leading-4 text-zinc-500">
            <AlertTriangle size={13} className="mt-0.5 shrink-0 text-amber-400" aria-hidden />
            <span>
              این اعداد «تخمین سرگرم‌کننده» هستند، نه تشخیص پزشکی! برای عدد دقیق، متر و ترازو حرف آخر را می‌زنند.
              همه‌چیز همین‌جا در مرورگر پردازش می‌شود — هیچ تصویری جایی ارسال نمی‌شود. با اسپانسری سان‌جاب
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
