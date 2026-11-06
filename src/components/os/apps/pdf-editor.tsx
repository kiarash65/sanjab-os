'use client'

/* «PDF ساز» — باز کردن، علامت‌گذاری، متن‌گذاری فارسی، چرخش/حذف/جابجایی صفحه و خروجی واقعی PDF
   موتور نمایش: pdf.js — موتور خروجی: pdf-lib
   متن فارسی با رستر شدن روی بوم (شکل‌دهی حروف درست است) به PDF اضافه می‌شود. */

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  Download,
  FilePlus2,
  Highlighter,
  Loader2,
  Plus,
  RotateCw,
  Square,
  Trash2,
  Type,
  Upload,
  X,
} from 'lucide-react'
import { useOS } from '@/lib/os/store'

const fa = (n: number) => n.toLocaleString('fa-IR')

interface PageEntry {
  src: number // اندیس صفرمبنا در فایل اصلی؛ -1 یعنی صفحهٔ سفید
  blank?: boolean
  rotation: number
}

interface Stamp {
  id: string
  page: number // اندیس صفرمبنا در فایل اصلی (صفحهٔ سفید مهر نمی‌پذیرد)
  type: 'text' | 'rect'
  // مختصات PDF (point، مبدأ پایین-چپ)
  pdfX: number
  pdfY: number
  pdfX2: number
  pdfY2: number
  // پیش‌نمایش CSS (در مقیاس لحظهٔ ایجاد)
  scale: number
  text?: string
  size?: number
  color?: string
  png?: string
  pngW?: number
  pngH?: number
  highlight?: boolean
}

type Tool = 'select' | 'text' | 'highlight' | 'rect'
type VpAdapter = {
  width: number
  height: number
  scale: number
  convertToPdfPoint: (x: number, y: number) => number[]
  convertToViewportPoint: (x: number, y: number) => number[]
}

const COLORS = ['#111827', '#dc2626', '#2563eb', '#16a34a', '#f7931e']

export default function PdfEditorApp() {
  const pushToast = useOS((s) => s.pushToast)

  const pdfjsRef = useRef<typeof import('pdfjs-dist') | null>(null)
  const docRef = useRef<import('pdfjs-dist').PDFDocumentProxy | null>(null)
  const bytesRef = useRef<Uint8Array | null>(null)
  const viewportRef = useRef<VpAdapter | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const stageRef = useRef<HTMLDivElement | null>(null)
  const dragRef = useRef<{ x: number; y: number } | null>(null)

  const [busy, setBusy] = useState('')
  const [opened, setOpened] = useState(false)
  const [pages, setPages] = useState<PageEntry[]>([])
  const [cur, setCur] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [tool, setTool] = useState<Tool>('select')
  const [color, setColor] = useState(COLORS[1])
  const [textSize, setTextSize] = useState(20)
  const [stamps, setStamps] = useState<Stamp[]>([])
  const [thumbs, setThumbs] = useState<string[]>([])
  const [placing, setPlacing] = useState<{ x: number; y: number } | null>(null)
  const [placeText, setPlaceText] = useState('')
  const [rubber, setRubber] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const [fileName, setFileName] = useState('')

  /* ── بارگذاری pdf.js یک بار ── */
  const ensurePdfjs = useCallback(async () => {
    if (pdfjsRef.current) return pdfjsRef.current
    const pdfjs = await import('pdfjs-dist')
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf/pdf.worker.min.mjs'
    pdfjsRef.current = pdfjs
    return pdfjs
  }, [])

  /* ── رندر صفحهٔ جاری ── */
  const renderCurrent = useCallback(
    async (pagesList: PageEntry[], curIdx: number, zoomVal: number) => {
      const pdfjs = pdfjsRef.current
      const doc = docRef.current
      const cv = canvasRef.current
      const p = pagesList[curIdx]
      if (!cv || !p) return
      const dpr = Math.min(2, window.devicePixelRatio || 1)

      if (p.blank || !doc || !pdfjs) {
        const wCss = 500 * zoomVal
        const hCss = 707 * zoomVal
        cv.width = wCss * dpr
        cv.height = hCss * dpr
        cv.style.width = `${wCss}px`
        cv.style.height = `${hCss}px`
        const ctx = cv.getContext('2d')
        if (ctx) {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, wCss, hCss)
        }
        const s = wCss / 500
        viewportRef.current = {
          width: wCss,
          height: hCss,
          scale: s,
          convertToPdfPoint: (x, y) => [x / s, (hCss - y) / s],
          convertToViewportPoint: (x, y) => [x * s, hCss - y * s],
        }
        return
      }

      const page = await doc.getPage(p.src + 1)
      const base = page.getViewport({ scale: 1, rotation: p.rotation })
      const fit = Math.min(1.2, 620 / base.width)
      const scale = fit * zoomVal
      const viewport = page.getViewport({ scale, rotation: p.rotation })
      cv.width = viewport.width * dpr
      cv.height = viewport.height * dpr
      cv.style.width = `${viewport.width}px`
      cv.style.height = `${viewport.height}px`
      const ctx = cv.getContext('2d')
      if (!ctx) return
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, viewport.width, viewport.height)
      await page.render({
        canvas: cv,
        canvasContext: ctx,
        viewport,
        transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined,
      }).promise
      viewportRef.current = viewport as unknown as VpAdapter
    },
    []
  )

  /* ── رندر بندانگشتی‌ها ── */
  const renderThumbs = useCallback(async (pagesList: PageEntry[], zoomVal: number) => {
    const doc = docRef.current
    const pdfjs = pdfjsRef.current
    if (!pdfjs) return
    const out: string[] = []
    const cv = document.createElement('canvas')
    for (const p of pagesList.slice(0, 80)) {
      const ctx = cv.getContext('2d')
      if (!ctx) break
      if (p.blank || !doc) {
        cv.width = 70
        cv.height = 99
        ctx.fillStyle = '#fff'
        ctx.fillRect(0, 0, 70, 99)
        out.push(cv.toDataURL('image/png'))
        continue
      }
      const page = await doc.getPage(p.src + 1)
      const viewport = page.getViewport({ scale: 70 / page.getViewport({ scale: 1 }).width, rotation: p.rotation })
      cv.width = viewport.width
      cv.height = viewport.height
      await page.render({ canvas: cv, canvasContext: ctx, viewport }).promise
      out.push(cv.toDataURL('image/jpeg', 0.72))
    }
    void zoomVal
    setThumbs(out)
  }, [])

  /* ── باز کردن بایت‌ها ── */
  const openBytes = useCallback(
    async (buf: Uint8Array, name: string) => {
      setBusy('در حال باز کردن PDF…')
      try {
        const pdfjs = await ensurePdfjs()
        if (docRef.current) {
          const old = docRef.current as unknown as { destroy?: () => Promise<void> }
          await old.destroy?.()
          docRef.current = null
        }
        bytesRef.current = buf
        const doc = await pdfjs.getDocument({ data: buf.slice(0) }).promise
        docRef.current = doc
        const list: PageEntry[] = []
        for (let i = 0; i < doc.numPages; i++) {
          const pg = await doc.getPage(i + 1)
          list.push({ src: i, rotation: (pg.rotate ?? 0) % 360 })
        }
        setPages(list)
        setCur(0)
        setStamps([])
        setFileName(name)
        setOpened(true)
        await renderCurrent(list, 0, zoom)
        void renderThumbs(list, zoom)
      } catch {
        pushToast({
          icon: '⚠️',
          title: 'PDF باز نشد',
          body: 'فایل خراب است یا رمز دارد — نسخهٔ بدون رمز را امتحان کن.',
        })
      } finally {
        setBusy('')
      }
    },
    [ensurePdfjs, pushToast, renderCurrent, renderThumbs, zoom]
  )

  const openFile = useCallback(
    async (file: File) => {
      const buf = new Uint8Array(await file.arrayBuffer())
      await openBytes(buf, file.name)
    },
    [openBytes]
  )

  const newBlank = useCallback(async () => {
    const { PDFDocument } = await import('pdf-lib')
    const doc = await PDFDocument.create()
    doc.addPage([595.28, 841.89])
    const bytes = await doc.save()
    await openBytes(new Uint8Array(bytes), 'سند-جدید.pdf')
  }, [openBytes])

  /* ── اثر صفحه/زوم → رندر دوباره ── */
  useEffect(() => {
    if (!opened) return
    void renderCurrent(pages, cur, zoom)
  }, [opened, pages, cur, zoom, renderCurrent])

  useEffect(() => {
    return () => {
      const old = docRef.current as unknown as { destroy?: () => Promise<void> } | null
      void old?.destroy?.()
      docRef.current = null
    }
  }, [])

  /* ── ابزارها ── */
  const rotate = (dir: 1 | -1) => {
    setPages((prev) =>
      prev.map((p, i) => (i === cur ? { ...p, rotation: (p.rotation + dir * 90 + 360) % 360 } : p))
    )
  }

  const deletePage = () => {
    if (pages.length <= 1) {
      pushToast({ icon: '🚫', title: 'حداقل یک صفحه لازم است', body: 'صفحهٔ آخر را نمی‌شود حذف کرد.' })
      return
    }
    setPages((prev) => prev.filter((_, i) => i !== cur))
    setCur((c) => Math.max(0, c - 1))
    void renderThumbs(pages.filter((_, i) => i !== cur), zoom)
  }

  const movePage = (dir: -1 | 1) => {
    setPages((prev) => {
      const j = cur + dir
      if (j < 0 || j >= prev.length) return prev
      const next = [...prev]
      ;[next[cur], next[j]] = [next[j], next[cur]]
      return next
    })
    setCur((c) => Math.min(pages.length - 1, Math.max(0, c + dir)))
  }

  const addBlank = () => {
    setPages((prev) => {
      const next = [...prev]
      next.splice(cur + 1, 0, { src: -1, blank: true, rotation: 0 })
      return next
    })
    setCur((c) => c + 1)
    pushToast({ icon: '📄', title: 'صفحهٔ سفید اضافه شد', body: 'برای نوشتن، ابزار متن را انتخاب کن.' })
  }

  const mergeFile = useCallback(
    async (file: File) => {
      if (!bytesRef.current) return
      setBusy('در حال چسباندن دو PDF…')
      try {
        const { PDFDocument } = await import('pdf-lib')
        const main = await PDFDocument.load(bytesRef.current, { ignoreEncryption: true })
        const extra = await PDFDocument.load(new Uint8Array(await file.arrayBuffer()), {
          ignoreEncryption: true,
        })
        const idx = extra.getPageIndices()
        const copied = await main.copyPages(extra, idx)
        for (const p of copied) main.addPage(p)
        const bytes = await main.save()
        await openBytes(new Uint8Array(bytes), `${fileName} + ${file.name}`)
        pushToast({
          icon: '🧩',
          title: 'ادغام انجام شد',
          body: `${fa(idx.length)} صفحه اضافه شد — حالا ترتیب را با فلش‌ها مرتب کن.`,
        })
      } catch {
        pushToast({ icon: '⚠️', title: 'ادغام نشد', body: 'یکی از فایل‌ها خراب یا رمزدار است.' })
      } finally {
        setBusy('')
      }
    },
    [fileName, openBytes, pushToast]
  )

  /* ── کلیک روی صفحه ── */
  const stagePoint = (e: React.PointerEvent | React.MouseEvent) => {
    const stage = stageRef.current
    if (!stage) return null
    const r = stage.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  const onStageClick = (e: React.MouseEvent) => {
    if (tool !== 'text' || !viewportRef.current) return
    const pt = stagePoint(e)
    if (pt) {
      setPlacing(pt)
      setPlaceText('')
    }
  }

  /* ── درگ هایلایت/مستطیل ── */
  const onStageDown = (e: React.PointerEvent) => {
    if (tool !== 'highlight' && tool !== 'rect') return
    const pt = stagePoint(e)
    if (!pt) return
    dragRef.current = pt
    setRubber({ x: pt.x, y: pt.y, w: 0, h: 0 })
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
  }
  const onStageMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return
    const pt = stagePoint(e)
    if (!pt) return
    const x0 = dragRef.current.x
    const y0 = dragRef.current.y
    setRubber({ x: Math.min(x0, pt.x), y: Math.min(y0, pt.y), w: Math.abs(pt.x - x0), h: Math.abs(pt.y - y0) })
  }
  const onStageUp = () => {
    const vp = viewportRef.current
    const rb = rubber
    dragRef.current = null
    if (!rb || !vp || rb.w < 4 || rb.h < 4) {
      setRubber(null)
      return
    }
    const p = pages[cur]
    const [px1, py1] = vp.convertToPdfPoint(rb.x, rb.y + rb.h)
    const [px2, py2] = vp.convertToPdfPoint(rb.x + rb.w, rb.y)
    setStamps((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2, 9),
        page: p.blank ? -1 : p.src,
        type: 'rect',
        pdfX: Math.min(px1, px2),
        pdfY: Math.min(py1, py2),
        pdfX2: Math.max(px1, px2),
        pdfY2: Math.max(py1, py2),
        scale: vp.scale,
        color,
        highlight: tool === 'highlight',
      },
    ])
    setRubber(null)
  }

  /* ── ثبت متن فارسی (رستر) ── */
  const commitText = () => {
    const vp = viewportRef.current
    const pt = placing
    const p = pages[cur]
    if (!vp || !pt || !placeText.trim()) {
      setPlacing(null)
      return
    }
    if (p.blank) {
      pushToast({ icon: '✍️', title: 'روی صفحهٔ سفید', body: 'متن صفحهٔ سفید در خروجی رسمی اضافه می‌شود… فعلاً پیش‌نمایش بماند!' })
    }
    // رستر متن با شکل‌دهی درست فارسی
    const meas = document.createElement('canvas').getContext('2d')
    const font = `${textSize}px Vazirmatn, Tahoma, sans-serif`
    if (meas) {
      meas.font = font
      meas.direction = 'rtl'
    }
    const tw = meas ? Math.ceil(meas.measureText(placeText).width) : placeText.length * textSize
    const th = Math.ceil(textSize * 1.6)
    const pad = 4
    const cnv = document.createElement('canvas')
    cnv.width = tw + pad * 2
    cnv.height = th + pad * 2
    const c2 = cnv.getContext('2d')
    if (c2) {
      c2.direction = 'rtl'
      c2.font = font
      c2.fillStyle = color
      c2.textBaseline = 'middle'
      c2.fillText(placeText, cnv.width - pad, cnv.height / 2)
    }
    const [pdfX, pdfY] = vp.convertToPdfPoint(pt.x, pt.y)
    setStamps((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2, 9),
        page: p.blank ? -1 : p.src,
        type: 'text',
        pdfX,
        pdfY,
        pdfX2: pdfX,
        pdfY2: pdfY,
        scale: vp.scale,
        text: placeText.trim(),
        size: textSize,
        color,
        png: cnv.toDataURL('image/png'),
        pngW: cnv.width,
        pngH: cnv.height,
      },
    ])
    setPlacing(null)
    setPlaceText('')
  }

  /* ── مهرهای صفحهٔ جاری به‌صورت overlay ── */
  const curStamps = () => {
    const vp = viewportRef.current
    const p = pages[cur]
    if (!vp || !p || p.blank) return []
    return stamps
      .filter((s) => s.page === p.src)
      .map((s) => {
        const [vx1, vy1] = vp.convertToViewportPoint(s.pdfX, s.pdfY2)
        const [vx2, vy2] = vp.convertToViewportPoint(s.pdfX2, s.pdfY)
        return { s, x: Math.min(vx1, vx2), y: Math.min(vy1, vy2), w: Math.abs(vx2 - vx1), h: Math.abs(vy2 - vy1) }
      })
  }

  /* ── خروجی PDF ── */
  const exportPdf = useCallback(async () => {
    if (!bytesRef.current) return
    setBusy('در حال ساختن PDF نهایی…')
    try {
      const { PDFDocument, rgb, degrees } = await import('pdf-lib')
      const src = await PDFDocument.load(bytesRef.current, { ignoreEncryption: true })
      const out = await PDFDocument.create()
      const ordered = pages.filter((p) => !p.blank && p.src >= 0)
      const idxs = ordered.map((p) => p.src)
      if (idxs.length > 0) {
        const copied = await out.copyPages(src, idxs)
        copied.forEach((pg, i) => {
          pg.setRotation(degrees(ordered[i].rotation))
          out.addPage(pg)
        })
      }
      // صفحه‌های سفید در جای درست‌شان
      pages.forEach((p, i) => {
        if (p.blank) out.insertPage(i, [595.28, 841.89])
      })
      // مهرها
      const outPages = out.getPages()
      const pngCache = new Map<string, import('pdf-lib').PDFImage>()
      for (const st of stamps) {
        const pos = pages.findIndex((p) => !p.blank && p.src === st.page)
        if (pos === -1) continue
        const pg = outPages[pos]
        if (!pg) continue
        if (st.type === 'rect') {
          const w = st.pdfX2 - st.pdfX
          const h = st.pdfY2 - st.pdfY
          const col = hexRgb(st.color ?? '#f7931e')
          pg.drawRectangle({
            x: st.pdfX,
            y: st.pdfY,
            width: w,
            height: h,
            color: rgb(col[0] / 255, col[1] / 255, col[2] / 255),
            opacity: st.highlight ? 0.35 : 0.85,
            borderWidth: st.highlight ? 0 : 1.2,
            borderColor: rgb(col[0] / 255, col[1] / 255, col[2] / 255),
          })
        } else if (st.png) {
          let img = pngCache.get(st.png)
          if (!img) {
            const res = await fetch(st.png)
            const blob = await res.blob()
            img = await out.embedPng(new Uint8Array(await blob.arrayBuffer()))
            pngCache.set(st.png, img)
          }
          const wPt = (st.pngW ?? 100) / st.scale
          const hPt = (st.pngH ?? 30) / st.scale
          pg.drawImage(img, { x: st.pdfX, y: st.pdfY - hPt, width: wPt, height: hPt })
        }
      }
      const bytes = await out.save()
      const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = fileName.replace(/\.pdf$/i, '') + '-سان‌جاب.pdf'
      a.click()
      setTimeout(() => URL.revokeObjectURL(a.href), 4000)
      pushToast({ icon: '✅', title: 'PDF ذخیره شد', body: 'فایل در پوشهٔ دانلود توست!' })
    } catch {
      pushToast({ icon: '⚠️', title: 'خروجی ساخته نشد', body: 'فایل ورودی شاید رمزدار باشد.' })
    } finally {
      setBusy('')
    }
  }, [pages, stamps, fileName, pushToast])

  const p = pages[cur]
  const overlay = curStamps()

  return (
    <div className="flex h-full w-full flex-col bg-zinc-950/70">
      {/* هدر */}
      <div className="flex items-center gap-2 border-b border-white/10 bg-zinc-900/70 p-2.5">
        <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-rose-400 to-rose-600 text-white">
          <Highlighter size={15} />
        </span>
        <div className="min-w-0">
          <h2 className="truncate text-xs font-black text-zinc-100">PDF ساز</h2>
          <p className="truncate text-[10px] text-zinc-500">{fileName || 'فایلی باز نشده'}</p>
        </div>
        <span className="mr-auto flex items-center gap-1.5">
          <label className="flex h-8 cursor-pointer items-center gap-1.5 rounded-lg bg-white/5 px-3 text-[11px] font-bold text-zinc-200 transition hover:bg-white/10 active:scale-95">
            <Upload size={13} />
            باز کردن PDF
            <input
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void openFile(f)
                e.currentTarget.value = ''
              }}
            />
          </label>
          <button
            onClick={() => void newBlank()}
            disabled={busy !== ''}
            className="flex h-8 items-center gap-1.5 rounded-lg bg-white/5 px-3 text-[11px] font-bold text-zinc-200 transition hover:bg-white/10 active:scale-95 disabled:opacity-50"
          >
            <FilePlus2 size={13} />
            سند جدید
          </button>
          {opened && (
            <button
              onClick={() => void exportPdf()}
              disabled={busy !== ''}
              className="flex h-8 items-center gap-1.5 rounded-lg bg-gradient-to-l from-rose-500 to-rose-600 px-3 text-[11px] font-black text-white transition hover:brightness-110 active:scale-95 disabled:opacity-50"
            >
              <Download size={13} />
              ذخیره PDF
            </button>
          )}
        </span>
      </div>

      {!opened ? (
        /* صفحهٔ خالی اولیه */
        <div
          className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 bg-black/40 p-6 text-center"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            const f = e.dataTransfer.files?.[0]
            if (f) void openFile(f)
          }}
        >
          {busy ? (
            <>
              <Loader2 size={30} className="animate-spin text-rose-400" />
              <p className="text-xs text-zinc-300">{busy}</p>
            </>
          ) : (
            <>
              <span className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-rose-500/30 to-rose-600/20 text-rose-300">
                <Highlighter size={26} />
              </span>
              <p className="max-w-xs text-xs leading-5 text-zinc-300">
                فایل PDF را همین‌جا رها کن — یا از دکمهٔ «باز کردن PDF» انتخابش کن.
                می‌توانی سند جدید بسازی، متن فارسی بگذاری، هایلایت کنی، صفحه‌ها را بچرخانی و مرتب کنی، دو PDF را بچسبانی و خروجی واقعی بگیری.
              </p>
              <p className="text-[9.5px] text-zinc-600">همه‌چیز در مرورگر — هیچ فایلی جایی آپلود نمی‌شود. با اسپانسری سان‌جاب</p>
            </>
          )}
        </div>
      ) : (
        <div className="flex min-h-0 flex-1">
          {/* بندانگشتی‌ها */}
          <div className="os-scroll w-24 shrink-0 space-y-1.5 overflow-y-auto border-l border-white/10 bg-black/25 p-2">
            {thumbs.map((t, i) => (
              <button
                key={i}
                onClick={() => setCur(i)}
                className={`relative block w-full overflow-hidden rounded-md border-2 transition ${
                  i === cur ? 'border-[#f7931e]' : 'border-transparent opacity-70 hover:opacity-100'
                }`}
                aria-label={`صفحهٔ ${fa(i + 1)}`}
              >
                <img src={t} alt={`بندانگشتی صفحهٔ ${fa(i + 1)}`} className="block w-full" />
                <span className="absolute bottom-0.5 left-0.5 rounded bg-black/70 px-1 text-[8px] font-black text-white">
                  {fa(i + 1)}
                </span>
              </button>
            ))}
          </div>

          {/* صحنهٔ اصلی */}
          <div className="os-scroll relative min-w-0 flex-1 overflow-auto bg-zinc-800/60 p-4">
            <div
              ref={stageRef}
              className={`relative mx-auto shadow-2xl ${
                tool === 'text' ? 'cursor-text' : tool !== 'select' ? 'cursor-crosshair' : ''
              }`}
              onClick={onStageClick}
              onPointerDown={onStageDown}
              onPointerMove={onStageMove}
              onPointerUp={onStageUp}
              role="application"
              aria-label="صفحهٔ PDF"
            >
              <canvas ref={canvasRef} className="block" />
              {/* مهرها */}
              {overlay.map(({ s, x, y, w, h }) => (
                <div key={s.id} className="pengo-fadein absolute" style={{ left: x, top: y, width: w, height: h }}>
                  {s.type === 'text' ? (
                    <img src={s.png} alt={s.text ?? ''} className="block h-full w-full" />
                  ) : (
                    <div
                      className="h-full w-full rounded-sm"
                      style={{
                        background: s.highlight ? `${s.color}59` : 'transparent',
                        border: s.highlight ? 'none' : `1.5px solid ${s.color}`,
                        opacity: s.highlight ? 1 : 0.9,
                      }}
                    />
                  )}
                </div>
              ))}
              {/* کشوی درگ */}
              {rubber && (
                <div
                  className="pointer-events-none absolute border-2 border-dashed border-[#f7931e]"
                  style={{
                    left: rubber.x,
                    top: rubber.y,
                    width: rubber.w,
                    height: rubber.h,
                    background: tool === 'highlight' ? 'rgba(250,204,21,0.3)' : 'transparent',
                  }}
                  aria-hidden
                />
              )}
              {/* ورودی متن شناور */}
              {placing && (
                <div
                  className="absolute z-20 flex items-center gap-1 rounded-lg border border-[#f7931e]/60 bg-zinc-900/95 p-1 shadow-xl"
                  style={{ left: placing.x, top: placing.y }}
                >
                  <input
                    autoFocus
                    value={placeText}
                    onChange={(e) => setPlaceText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitText()
                      if (e.key === 'Escape') setPlacing(null)
                    }}
                    placeholder="متن را بنویس…"
                    className="w-40 bg-transparent px-1 text-[12px] text-zinc-100 placeholder:text-zinc-600 outline-none"
                    aria-label="متن جدید"
                  />
                  <button
                    onClick={commitText}
                    className="grid size-6 place-items-center rounded bg-emerald-500 text-white"
                    aria-label="ثبت متن"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => setPlacing(null)}
                    className="grid size-6 place-items-center rounded bg-white/10 text-zinc-300"
                    aria-label="انصراف"
                  >
                    <X size={11} />
                  </button>
                </div>
              )}
            </div>
            {busy && (
              <div className="absolute inset-0 z-30 grid place-items-center bg-black/50 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 size={26} className="animate-spin text-rose-400" />
                  <p className="text-xs text-zinc-200">{busy}</p>
                </div>
              </div>
            )}
          </div>

          {/* نوار ابزار */}
          <div className="os-scroll w-44 shrink-0 space-y-3 overflow-y-auto border-r border-white/10 bg-zinc-900/60 p-2.5">
            {/* ابزارها */}
            <div>
              <p className="mb-1.5 text-[10px] font-black text-zinc-500">ابزار</p>
              <div className="grid grid-cols-2 gap-1">
                {(
                  [
                    { id: 'select', label: 'انتخاب', Icon: Square },
                    { id: 'text', label: 'متن', Icon: Type },
                    { id: 'highlight', label: 'هایلایت', Icon: Highlighter },
                    { id: 'rect', label: 'کادر', Icon: Square },
                  ] as { id: Tool; label: string; Icon: typeof Type }[]
                ).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTool(t.id)}
                    className={`flex items-center gap-1 rounded-lg border px-2 py-1.5 text-[10px] font-bold transition active:scale-95 ${
                      tool === t.id
                        ? 'border-transparent bg-[#f7931e] text-white'
                        : 'border-white/10 bg-zinc-800/80 text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    <t.Icon size={11} />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* رنگ و اندازه */}
            <div>
              <p className="mb-1.5 text-[10px] font-black text-zinc-500">رنگ</p>
              <div className="flex gap-1">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    aria-label={`رنگ ${c}`}
                    className={`size-5 rounded-full border-2 transition ${color === c ? 'border-white scale-110' : 'border-transparent'}`}
                    style={{ background: c }}
                  />
                ))}
              </div>
              <label className="mt-2 flex items-center justify-between text-[10px] text-zinc-400">
                <span>اندازهٔ متن</span>
                <span className="font-black text-zinc-200">{fa(textSize)}</span>
              </label>
              <input
                type="range"
                min={12}
                max={48}
                value={textSize}
                onChange={(e) => setTextSize(parseInt(e.target.value, 10))}
                className="w-full accent-[#f7931e]"
                aria-label="اندازهٔ متن"
              />
            </div>

            {/* صفحه‌ها */}
            <div>
              <p className="mb-1.5 text-[10px] font-black text-zinc-500">
                صفحه {fa(cur + 1)} از {fa(pages.length)}
              </p>
              <div className="grid grid-cols-2 gap-1">
                <button onClick={() => rotate(1)} className="flex items-center justify-center gap-1 rounded-lg border border-white/10 bg-zinc-800/80 py-1.5 text-[10px] font-bold text-zinc-200 transition hover:bg-zinc-800 active:scale-95">
                  <RotateCw size={11} /> چرخش
                </button>
                <button onClick={addBlank} className="flex items-center justify-center gap-1 rounded-lg border border-white/10 bg-zinc-800/80 py-1.5 text-[10px] font-bold text-zinc-200 transition hover:bg-zinc-800 active:scale-95">
                  <Plus size={11} /> سفید
                </button>
                <button onClick={() => movePage(-1)} className="flex items-center justify-center gap-1 rounded-lg border border-white/10 bg-zinc-800/80 py-1.5 text-[10px] font-bold text-zinc-200 transition hover:bg-zinc-800 active:scale-95">
                  <ArrowUp size={11} /> بالا
                </button>
                <button onClick={() => movePage(1)} className="flex items-center justify-center gap-1 rounded-lg border border-white/10 bg-zinc-800/80 py-1.5 text-[10px] font-bold text-zinc-200 transition hover:bg-zinc-800 active:scale-95">
                  <ArrowDown size={11} /> پایین
                </button>
                <button onClick={deletePage} className="col-span-2 flex items-center justify-center gap-1 rounded-lg border border-rose-500/40 bg-rose-500/15 py-1.5 text-[10px] font-bold text-rose-300 transition hover:bg-rose-500/25 active:scale-95">
                  <Trash2 size={11} /> حذف صفحه
                </button>
              </div>
            </div>

            {/* ادغام */}
            <div>
              <p className="mb-1.5 text-[10px] font-black text-zinc-500">ادغام</p>
              <label className="flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-zinc-800/80 text-[10px] font-bold text-zinc-200 transition hover:bg-zinc-800 active:scale-95">
                <Upload size={11} />
                چسباندن PDF دیگر…
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) void mergeFile(f)
                    e.currentTarget.value = ''
                  }}
                />
              </label>
            </div>

            {/* فهرست مهرها */}
            <div>
              <p className="mb-1.5 text-[10px] font-black text-zinc-500">مهرها ({fa(stamps.length)})</p>
              <div className="os-scroll max-h-36 space-y-1 overflow-y-auto">
                {stamps.length === 0 && <p className="text-[9px] text-zinc-600">هنوز مهری نزده‌ای</p>}
                {stamps.map((s) => (
                  <div key={s.id} className="flex items-center gap-1 rounded-md bg-white/[0.04] px-1.5 py-1 text-[9px] text-zinc-300">
                    <span className="min-w-0 flex-1 truncate">{s.type === 'text' ? s.text : s.highlight ? 'هایلایت' : 'کادر'}</span>
                    <button
                      onClick={() => setStamps((prev) => prev.filter((x) => x.id !== s.id))}
                      className="grid size-4 shrink-0 place-items-center rounded text-zinc-500 transition hover:bg-rose-500/20 hover:text-rose-300"
                      aria-label="حذف مهر"
                    >
                      <X size={9} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-[8.5px] leading-3 text-zinc-600">
              متن فارسی با شکل‌دهی درست رستر می‌شود؛ خروجی با pdf-lib ساخته می‌شود. با اسپانسری سان‌جاب
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function hexRgb(hex: string): [number, number, number] {
  const m = hex.replace('#', '')
  return [parseInt(m.slice(0, 2), 16), parseInt(m.slice(2, 4), 16), parseInt(m.slice(4, 6), 16)]
}
