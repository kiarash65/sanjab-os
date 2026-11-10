'use client'

/* ------------------------------------------------------------------ */
/* «نویسا»، واژه‌پرداز سان‌جاب‌او‌اس                                    */
/* ویرایشگر غنی راست‌به‌چپ با خروجی Word (.doc / .docx) و PDF، آفلاین  */
/* ------------------------------------------------------------------ */

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Baseline,
  Bold,
  CheckCircle2,
  Eraser,
  File,
  FileDown,
  FileText,
  FolderOpen,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  Italic,
  List,
  ListOrdered,
  Pilcrow,
  Redo2,
  Save,
  Stamp,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import {
  AlignmentType,
  Document,
  HeadingLevel,
  HighlightColor,
  LevelFormat,
  Packer,
  Paragraph,
  TextRun,
} from 'docx'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { HOME, getNode, useFs } from '@/lib/os/fs'
import { useOS } from '@/lib/os/store'
import { SUNJOB_PALETTE } from '@/lib/os/brand'

/* --------------------------- ثابت‌ها --------------------------- */

const DRAFT_KEY = 'pengo-writer-draft'
const DOCS_DIR = `${HOME}/سندها`
const DEFAULT_NAME = 'سند_من'
const NUM_REF = 'nouisa-list'
const STAMP_TEXT = 'با اسپانسری سان‌جاب | sunjob.ir'

const WELCOME_HTML = `
<h1>سند اول من</h1>
<p>این سند نمونه در <b>نویسا</b>، واژه‌پرداز رسمی <b>سان‌جاب‌او‌اس</b>، است. مثل ورد می‌نویسی، قالب‌بندی می‌کنی و آخرش خروجی Word یا PDF می‌گیری؛ همه‌چیز آفلاین و داخل مرورگر خودت.</p>
<p>چند نکتهٔ سریع برای شروع:</p>
<ul>
  <li>نوار ابزار بالا، متن را درشت، کج، زیرخط‌دار و رنگی می‌کند.</li>
  <li>دکمهٔ «ذخیره در پرونده‌ها» سند را در پوشهٔ سندها نگه می‌دارد.</li>
  <li>دکمهٔ «مهر سان‌جاب» امضای اسپانسر را پایین سند می‌گذارد.</li>
  <li>خروجی‌های Word و PDF بدون اینترنت ساخته می‌شوند.</li>
</ul>
`.trim()

/** استایل سرصفحه‌ها و فهرست‌ها، چون پیش‌فرض‌های Tailwind آن‌ها را صفر می‌کند */
const DOC_STYLES = [
  '[&_h1]:mb-4 [&_h1]:mt-1 [&_h1]:text-2xl [&_h1]:font-extrabold',
  '[&_h2]:mb-3 [&_h2]:mt-3 [&_h2]:text-xl [&_h2]:font-bold',
  '[&_h3]:mb-2 [&_h3]:mt-3 [&_h3]:text-lg [&_h3]:font-bold',
  '[&_p]:mb-3 [&_p]:leading-8',
  '[&_ul]:mb-3 [&_ul]:list-disc [&_ul]:ps-6',
  '[&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:ps-6',
  '[&_li]:leading-7',
  '[&_b]:font-bold [&_strong]:font-bold',
  '[&_a]:text-teal-700 [&_a]:underline',
].join(' ')

const faNum = (n: number): string => n.toLocaleString('fa-IR')

const safeName = (raw: string): string =>
  raw.trim().replace(/[\\/:*?"<>|]+/g, '_') || DEFAULT_NAME

/** محتوای آغازین سند، پیش‌نویس ذخیره‌شدهٔ خودکار یا سند خوش‌آمد */
function initialDocHtml(): string {
  if (typeof window === 'undefined') return WELCOME_HTML
  try {
    const draft = window.localStorage.getItem(DRAFT_KEY)
    if (draft && draft.trim()) return draft
  } catch {
    /* حافظهٔ محلی در دسترس نیست */
  }
  return WELCOME_HTML
}

/** شمارش واژه/نویسه از روی HTML، فقط برای مقدار اولیه (بدون دست‌زدن به DOM) */
function textStats(html: string): { words: number; chars: number } {
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return { words: 0, chars: 0 }
  }
  const text = new DOMParser().parseFromString(html, 'text/html').body.textContent ?? ''
  const trimmed = text.trim()
  return { words: trimmed ? trimmed.split(/\s+/).length : 0, chars: text.length }
}

const escapeHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** «#ff8800» یا «rgb(255,136,0)» → «FF8800» (بدون # برای docx) */
function cssColorToHex(raw: string): string | null {
  const v = raw.trim().toLowerCase()
  if (!v || v === 'transparent' || v.startsWith('rgba(0, 0, 0, 0')) return null
  if (v.startsWith('#')) {
    const hex = v.slice(1)
    if (hex.length === 3) return hex.split('').map((c) => c + c).join('').toUpperCase()
    if (hex.length >= 6) return hex.slice(0, 6).toUpperCase()
    return null
  }
  const m = v.match(/^rgba?\(\s*(\d+)\s*[,\s]\s*(\d+)\s*[,\s]\s*(\d+)/)
  if (!m) return null
  return [m[1], m[2], m[3]]
    .map((n) => Math.max(0, Math.min(255, Number(n))))
    .map((n) => n.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()
}

type DocxHighlight = (typeof HighlightColor)[keyof typeof HighlightColor]

/** docx فقط نام رنگ‌های استاندارد هایلایت را قبول می‌کند؛ نزدیک‌ترین را پیدا می‌کنیم */
const HIGHLIGHT_SWATCHES: ReadonlyArray<readonly [string, string]> = [
  ['yellow', 'FFFF00'], ['green', '00FF00'], ['cyan', '00FFFF'], ['magenta', 'FF00FF'],
  ['red', 'FF0000'], ['blue', '0000FF'], ['darkYellow', '808000'], ['darkGreen', '008000'],
  ['darkCyan', '008080'], ['darkMagenta', '800080'], ['darkRed', '800000'],
  ['darkBlue', '000080'], ['darkGray', '808080'], ['lightGray', 'C0C0C0'],
  ['black', '000000'], ['white', 'FFFFFF'],
]

function nearestHighlight(hex: string): DocxHighlight {
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  let best = HIGHLIGHT_SWATCHES[0]
  let bestDist = Number.POSITIVE_INFINITY
  for (const sw of HIGHLIGHT_SWATCHES) {
    const pr = parseInt(sw[1].slice(0, 2), 16)
    const pg = parseInt(sw[1].slice(2, 4), 16)
    const pb = parseInt(sw[1].slice(4, 6), 16)
    const d = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2
    if (d < bestDist) {
      bestDist = d
      best = sw
    }
  }
  return best[0] as DocxHighlight
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 4000)
}

/* --------------------------- مبدل HTML → docx --------------------------- */

interface RunCtx {
  bold: boolean
  italics: boolean
  underline: boolean
  strike: boolean
  color?: string
  highlight?: DocxHighlight
}

const BASE_CTX: RunCtx = { bold: false, italics: false, underline: false, strike: false }

/** گره‌های درون‌خطی را به TextRun با ویژگی‌های bold/italic/underline/strike تبدیل می‌کند */
function collectRuns(node: Node, ctx: RunCtx): TextRun[] {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent ?? ''
    if (!text) return []
    return [
      new TextRun({
        text,
        bold: ctx.bold || undefined,
        italics: ctx.italics || undefined,
        underline: ctx.underline ? {} : undefined,
        strike: ctx.strike || undefined,
        color: ctx.color,
        highlight: ctx.highlight,
        rightToLeft: true,
      }),
    ]
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return []
  const el = node as HTMLElement
  const tag = el.tagName
  if (tag === 'BR') return [new TextRun({ break: 1, rightToLeft: true })]
  if (tag === 'SCRIPT' || tag === 'STYLE') return []

  const next: RunCtx = { ...ctx }
  if (tag === 'B' || tag === 'STRONG') next.bold = true
  if (tag === 'I' || tag === 'EM') next.italics = true
  if (tag === 'U' || tag === 'INS') next.underline = true
  if (tag === 'S' || tag === 'STRIKE' || tag === 'DEL') next.strike = true
  if (tag === 'FONT') {
    const c = cssColorToHex(el.getAttribute('color') ?? '')
    if (c) next.color = c
  }
  const st = el.style
  if (st) {
    const w = st.fontWeight
    if (w === 'bold' || w === 'bolder' || w === '700' || w === '800' || w === '900') next.bold = true
    if (st.fontStyle === 'italic' || st.fontStyle === 'oblique') next.italics = true
    const deco = st.textDecorationLine || st.textDecoration || ''
    if (deco.includes('underline')) next.underline = true
    if (deco.includes('line-through')) next.strike = true
    const c = cssColorToHex(st.color)
    if (c) next.color = c
    const bg = cssColorToHex(st.backgroundColor)
    if (bg) next.highlight = nearestHighlight(bg)
  }

  const runs: TextRun[] = []
  for (const child of Array.from(el.childNodes)) runs.push(...collectRuns(child, next))
  return runs
}

/** تراز پاراگراف، پیش‌فرض سند راست‌به‌چپ یعنی راست‌چین */
function paraAlign(el: HTMLElement): (typeof AlignmentType)[keyof typeof AlignmentType] {
  const a = (el.style.textAlign || el.getAttribute('align') || '').toLowerCase()
  if (a === 'center') return AlignmentType.CENTER
  if (a === 'left') return AlignmentType.LEFT
  if (a === 'justify') return AlignmentType.JUSTIFIED
  return AlignmentType.RIGHT
}

function emptyRun(): TextRun {
  return new TextRun({ text: '', rightToLeft: true })
}

function buildDocxBody(root: HTMLElement): Paragraph[] {
  const out: Paragraph[] = []
  let olInstance = 0

  const pushBlock = (el: HTMLElement) => {
    const tag = el.tagName
    const runs = collectRuns(el, BASE_CTX)
    out.push(
      new Paragraph({
        heading:
          tag === 'H1'
            ? HeadingLevel.HEADING_1
            : tag === 'H2'
              ? HeadingLevel.HEADING_2
              : tag === 'H3'
                ? HeadingLevel.HEADING_3
                : undefined,
        bidirectional: true, // راست‌به‌چپ بودن پاراگراف (معادل RTL در docx نسخه ۹)
        alignment: paraAlign(el),
        children: runs.length > 0 ? runs : [emptyRun()],
      })
    )
  }

  const addList = (list: HTMLElement, ordered: boolean, level: number) => {
    const instance = ordered ? ++olInstance : 0
    for (const li of Array.from(list.children)) {
      if (li.tagName !== 'LI') continue
      const liEl = li as HTMLElement
      // نسخهٔ مسطح از li بدون فهرست‌های تودرتو (آن‌ها جداگانه اضافه می‌شوند)
      const flat = liEl.cloneNode(true) as HTMLElement
      flat.querySelectorAll('ul,ol').forEach((n) => n.remove())
      const runs = collectRuns(flat, BASE_CTX)
      out.push(
        new Paragraph({
          ...(ordered
            ? {
                numbering: {
                  reference: NUM_REF,
                  level: Math.min(level, 2),
                  instance,
                },
              }
            : { bullet: { level: Math.min(level, 8) } }),
          bidirectional: true,
          alignment: paraAlign(liEl),
          children: runs.length > 0 ? runs : [emptyRun()],
        })
      )
      for (const sub of Array.from(liEl.children)) {
        if (sub.tagName === 'UL') addList(sub as HTMLElement, false, level + 1)
        else if (sub.tagName === 'OL') addList(sub as HTMLElement, true, level + 1)
      }
    }
  }

  const walk = (container: HTMLElement) => {
    for (const child of Array.from(container.children)) {
      const el = child as HTMLElement
      switch (el.tagName) {
        case 'H1':
        case 'H2':
        case 'H3':
        case 'P':
        case 'BLOCKQUOTE':
          pushBlock(el)
          break
        case 'UL':
          addList(el, false, 0)
          break
        case 'OL':
          addList(el, true, 0)
          break
        case 'DIV':
        case 'SECTION':
        case 'ARTICLE':
          if (el.querySelector('p,h1,h2,h3,ul,ol,div')) walk(el)
          else pushBlock(el)
          break
        default:
          pushBlock(el)
      }
    }
  }

  walk(root)
  return out
}

/* --------------------------- دکمه‌های نوار ابزار --------------------------- */

interface FmtButtonProps {
  title: string
  active?: boolean
  onAct: () => void
  children: React.ReactNode
}

function FmtButton({ title, active = false, onAct, children }: FmtButtonProps) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onAct}
      className={`flex h-8 w-8 items-center justify-center rounded-lg text-zinc-300 transition hover:bg-white/10 hover:text-white active:scale-95 ${
        active ? 'bg-white/15 text-white' : ''
      }`}
    >
      {children}
    </button>
  )
}

function Sep() {
  return <span aria-hidden className="mx-1 h-5 w-px shrink-0 bg-white/10" />
}

interface ActButtonProps {
  title: string
  hint: string
  color: string
  icon: LucideIcon
  onClick: () => void
  active?: boolean
}

function ActButton({ title, hint, color, icon: Icon, onClick, active = false }: ActButtonProps) {
  return (
    <button
      type="button"
      title={hint}
      aria-label={hint}
      aria-pressed={active}
      onClick={onClick}
      className="flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-bold transition hover:brightness-125 active:scale-[0.97]"
      style={{
        color,
        borderColor: `${color}55`,
        backgroundColor: active ? `${color}38` : `${color}1f`,
      }}
    >
      <Icon className="size-3.5" />
      {title}
    </button>
  )
}

/* --------------------------- برنامهٔ اصلی --------------------------- */

export default function WriterApp() {
  const editorRef = useRef<HTMLDivElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const colorRef = useRef<HTMLInputElement>(null)
  const hlRef = useRef<HTMLInputElement>(null)
  const bootedRef = useRef(false)
  const saveTimerRef = useRef<number | null>(null)

  const [name, setName] = useState(DEFAULT_NAME)
  const [initialHtml] = useState(initialDocHtml)
  const [words, setWords] = useState(() => textStats(initialHtml).words)
  const [chars, setChars] = useState(() => textStats(initialHtml).chars)
  const [stamp, setStamp] = useState(false)
  const [autosave, setAutosave] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [fmt, setFmt] = useState({ bold: false, italic: false, underline: false, strike: false, block: 'p' })

  const updateCounts = useCallback(() => {
    const el = editorRef.current
    if (!el) return
    const text = el.textContent ?? ''
    const trimmed = text.trim()
    setWords(trimmed ? trimmed.split(/\s+/).length : 0)
    setChars(text.length)
  }, [])

  const refreshFmt = useCallback(() => {
    try {
      setFmt({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strike: document.queryCommandState('strikeThrough'),
        block: (document.queryCommandValue('formatBlock') || 'p')
          .toLowerCase()
          .replace(/[<>]/g, ''),
      })
    } catch {
      /* بعضی مرورگرها اجازهٔ خواندن وضعیت را نمی‌دهند */
    }
  }, [])

  // محتوای اولیه فقط یک‌بار روی DOM ست می‌شود؛ ری‌رندرهای بعدی هرگز HTML را از استیت نمی‌سازند
  useEffect(() => {
    if (bootedRef.current) return
    bootedRef.current = true
    const el = editorRef.current
    if (!el) return
    try {
      document.execCommand('styleWithCSS', false, 'true')
    } catch {
      /* مرورگر قدیمی؛ مهم نیست */
    }
    el.innerHTML = initialHtml
  }, [initialHtml])

  // پاک‌سازی تایمر ذخیرهٔ خودکار هنگام بستن پنجره
  useEffect(
    () => () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current)
    },
    []
  )

  const toast = (title: string, body: string, icon?: LucideIcon) =>
    useOS.getState().pushToast({ title, body, icon })

  const handleInput = () => {
    updateCounts()
    setAutosave('saving')
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current)
    saveTimerRef.current = window.setTimeout(() => {
      const el = editorRef.current
      if (!el) return
      try {
        window.localStorage.setItem(DRAFT_KEY, el.innerHTML)
        setAutosave('saved')
      } catch {
        setAutosave('idle')
      }
    }, 1200)
  }

  const exec = (cmd: string, value?: string) => {
    editorRef.current?.focus()
    try {
      document.execCommand(cmd, false, value)
    } catch {
      /* دستور پشتیبانی نشد */
    }
    refreshFmt()
    updateCounts()
  }

  /* --------------------------- ذخیره / بازکردن --------------------------- */

  const handleSave = () => {
    const el = editorRef.current
    if (!el) return
    const fileName = safeName(name)
    const fs = useFs.getState()
    fs.mkdir(DOCS_DIR)
    const ok = fs.writeFile(`${DOCS_DIR}/${fileName}.txt`, el.innerHTML)
    if (ok) {
      toast(
        'ذخیره شد ✓',
        `«${fileName}.txt» در پوشهٔ سندها ذخیره شد. حالا از «پرونده‌ها» در دسترس است.`,
        CheckCircle2
      )
    } else {
      toast('ذخیره نشد ✗', 'پوشهٔ سندها در فایل‌سیستم مجازی در دسترس نیست.', XCircle)
    }
  }

  const handleOpen = () => {
    const el = editorRef.current
    if (!el) return
    const fileName = safeName(name)
    const node = getNode(useFs.getState().fs, `${DOCS_DIR}/${fileName}.txt`)
    if (node && node.type === 'file') {
      el.innerHTML = node.content || WELCOME_HTML
      updateCounts()
      refreshFmt()
      toast('سند باز شد ✓', `«${fileName}.txt» از پوشهٔ سندها بارگذاری شد.`, FolderOpen)
    } else {
      toast('پیدا نشد ✗', `فایلی به نام «${fileName}.txt» در پوشهٔ سندها نیست.`, XCircle)
    }
  }

  /* --------------------------- خروجی‌ها --------------------------- */

  const exportDoc = () => {
    const el = editorRef.current
    if (!el) return
    const fileName = safeName(name)
    const stampHtml = stamp
      ? `<p style="text-align:center;color:#9ca3af;font-size:10pt;margin-top:24pt">${STAMP_TEXT}</p>`
      : ''
    const html =
      `<html xmlns:o="urn:schemas-microsoft-com:office:office" ` +
      `xmlns:w="urn:schemas-microsoft-com:office:word" ` +
      `xmlns="http://www.w3.org/TR/REC-html40" dir="rtl" lang="fa">` +
      `<head><meta charset="utf-8" /><title>${escapeHtml(fileName)}</title></head>` +
      `<body dir="rtl" style="font-family:Tahoma,'Vazirmatn',sans-serif;">` +
      `${el.innerHTML}${stampHtml}</body></html>`
    downloadBlob(new Blob(['\ufeff', html], { type: 'application/msword;charset=utf-8' }), `${fileName}.doc`)
    toast('Word (.doc) آماده شد ✓', `«${fileName}.doc» دانلود شد.`, CheckCircle2)
  }

  const exportDocx = async () => {
    const el = editorRef.current
    if (!el) return
    const fileName = safeName(name)
    try {
      const parsed = new DOMParser().parseFromString(el.innerHTML, 'text/html')
      const children = buildDocxBody(parsed.body)
      if (stamp) {
        children.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            bidirectional: true,
            spacing: { before: 480 },
            children: [
              new TextRun({ text: STAMP_TEXT, size: 16, color: '9CA3AF', rightToLeft: true }),
            ],
          })
        )
      }
      const doc = new Document({
        creator: 'نویسا، سان‌جاب‌او‌اس',
        title: fileName,
        numbering: {
          config: [
            {
              reference: NUM_REF,
              levels: [
                { level: 0, format: LevelFormat.DECIMAL, text: '%1.' },
                { level: 1, format: LevelFormat.LOWER_LETTER, text: '%2.' },
                { level: 2, format: LevelFormat.LOWER_ROMAN, text: '%3.' },
              ],
            },
          ],
        },
        sections: [
          {
            properties: {
              page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } },
            },
            children,
          },
        ],
      })
      const blob = await Packer.toBlob(doc)
      downloadBlob(blob, `${fileName}.docx`)
      toast('Word (.docx) آماده شد ✓', `«${fileName}.docx» دانلود شد.`, CheckCircle2)
    } catch {
      toast('خروجی docx شکست خورد', 'ساخت فایل Word استاندارد با خطا مواجه شد؛ خروجی .doc را امتحان کن.', XCircle)
    }
  }

  const exportPdf = async () => {
    const target = wrapRef.current
    if (!target) return
    const fileName = safeName(name)
    try {
      const canvas = await html2canvas(target, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      })
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW = 210 // میلی‌متر؛ A4
      const pageH = 297
      const imgH = (canvas.height * pageW) / canvas.width // ارتفاع کل سند بر حسب میلی‌متر
      const data = canvas.toDataURL('image/jpeg', 0.95)
      pdf.addImage(data, 'JPEG', 0, 0, pageW, imgH)
      let rendered = pageH
      while (rendered < imgH) {
        pdf.addPage()
        pdf.addImage(data, 'JPEG', 0, -rendered, pageW, imgH)
        rendered += pageH
      }
      pdf.save(`${fileName}.pdf`)
      toast('PDF آماده شد ✓', `«${fileName}.pdf» دانلود شد.`, CheckCircle2)
    } catch {
      toast('خروجی PDF شکست خورد', 'ساخت تصویر سند با خطا مواجه شد.', XCircle)
    }
  }

  /* --------------------------- رابط کاربری --------------------------- */

  return (
    <div dir="rtl" className="flex h-full w-full flex-col bg-zinc-950/60 text-zinc-100">
      {/* نوار ابزار */}
      <header className="shrink-0 border-b border-white/10 bg-zinc-900/80">
        <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5">
          <FmtButton title="درشت (Ctrl+B)" active={fmt.bold} onAct={() => exec('bold')}>
            <Bold className="size-4" />
          </FmtButton>
          <FmtButton title="کج (Ctrl+I)" active={fmt.italic} onAct={() => exec('italic')}>
            <Italic className="size-4" />
          </FmtButton>
          <FmtButton title="زیرخط (Ctrl+U)" active={fmt.underline} onAct={() => exec('underline')}>
            <UnderlineIcon className="size-4" />
          </FmtButton>
          <FmtButton title="خط‌خورده" active={fmt.strike} onAct={() => exec('strikeThrough')}>
            <Strikethrough className="size-4" />
          </FmtButton>
          <Sep />
          <FmtButton
            title="پاراگراف"
            active={fmt.block === 'p' || fmt.block === 'div'}
            onAct={() => exec('formatBlock', '<p>')}
          >
            <Pilcrow className="size-4" />
          </FmtButton>
          <FmtButton title="تیتر ۱" active={fmt.block === 'h1'} onAct={() => exec('formatBlock', '<h1>')}>
            <Heading1 className="size-4" />
          </FmtButton>
          <FmtButton title="تیتر ۲" active={fmt.block === 'h2'} onAct={() => exec('formatBlock', '<h2>')}>
            <Heading2 className="size-4" />
          </FmtButton>
          <FmtButton title="تیتر ۳" active={fmt.block === 'h3'} onAct={() => exec('formatBlock', '<h3>')}>
            <Heading3 className="size-4" />
          </FmtButton>
          <Sep />
          <FmtButton title="فهرست نقطه‌ای" onAct={() => exec('insertUnorderedList')}>
            <List className="size-4" />
          </FmtButton>
          <FmtButton title="فهرست شماره‌دار" onAct={() => exec('insertOrderedList')}>
            <ListOrdered className="size-4" />
          </FmtButton>
          <Sep />
          <FmtButton title="تراز از راست" onAct={() => exec('justifyRight')}>
            <AlignRight className="size-4" />
          </FmtButton>
          <FmtButton title="تراز وسط" onAct={() => exec('justifyCenter')}>
            <AlignCenter className="size-4" />
          </FmtButton>
          <FmtButton title="تراز از چپ" onAct={() => exec('justifyLeft')}>
            <AlignLeft className="size-4" />
          </FmtButton>
          <Sep />
          <FmtButton title="رنگ متن" onAct={() => colorRef.current?.click()}>
            <Baseline className="size-4" />
          </FmtButton>
          <input
            ref={colorRef}
            type="color"
            defaultValue="#111827"
            tabIndex={-1}
            aria-hidden
            className="size-0 opacity-0"
            onChange={(e) => exec('foreColor', e.target.value)}
          />
          <FmtButton title="رنگ هایلایت" onAct={() => hlRef.current?.click()}>
            <Highlighter className="size-4" />
          </FmtButton>
          <input
            ref={hlRef}
            type="color"
            defaultValue="#fde047"
            tabIndex={-1}
            aria-hidden
            className="size-0 opacity-0"
            onChange={(e) => exec('hiliteColor', e.target.value)}
          />
          <Sep />
          <FmtButton title="واگرد (Ctrl+Z)" onAct={() => exec('undo')}>
            <Undo2 className="size-4" />
          </FmtButton>
          <FmtButton title="ازنو (Ctrl+Y)" onAct={() => exec('redo')}>
            <Redo2 className="size-4" />
          </FmtButton>
          <FmtButton title="پاک‌کردن قالب‌بندی" onAct={() => exec('removeFormat')}>
            <Eraser className="size-4" />
          </FmtButton>
        </div>

        {/* ردیف سند و خروجی‌ها */}
        <div className="flex flex-wrap items-center gap-1.5 border-t border-white/5 px-2 py-1.5">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="نام سند"
            aria-label="نام سند"
            className="h-8 w-32 rounded-lg border border-white/10 bg-white/5 px-2 text-xs text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-white/25 sm:w-40"
          />
          <span className="hidden text-[10px] text-zinc-500 sm:inline">.txt</span>
          <ActButton
            title="ذخیره در پرونده‌ها"
            hint="ذخیرهٔ سند در پوشهٔ سندهای فایل‌سیستم مجازی"
            color={SUNJOB_PALETTE.teal}
            icon={Save}
            onClick={handleSave}
          />
          <ActButton
            title="باز کردن آخرین سند"
            hint="بازخوانی سند ذخیره‌شده از پوشهٔ سندها"
            color="#a1a1aa"
            icon={FolderOpen}
            onClick={handleOpen}
          />
          <Sep />
          <ActButton
            title="Word (.docx)"
            hint="خروجی Word استاندارد (docx واقعی)"
            color={SUNJOB_PALETTE.violet}
            icon={FileText}
            onClick={() => void exportDocx()}
          />
          <ActButton
            title="Word (.doc)"
            hint="خروجی Word سازگار (سند HTML)"
            color={SUNJOB_PALETTE.orange}
            icon={File}
            onClick={exportDoc}
          />
          <ActButton
            title="PDF"
            hint="خروجی PDF چندصفحه‌ای از سند"
            color={SUNJOB_PALETTE.rose}
            icon={FileDown}
            onClick={() => void exportPdf()}
          />
          <ActButton
            title="مهر سان‌جاب"
            hint="درج یا حذف امضای اسپانسر پایین سند"
            color={SUNJOB_PALETTE.tealBright}
            icon={Stamp}
            active={stamp}
            onClick={() => setStamp((s) => !s)}
          />
        </div>
      </header>

      {/* صفحهٔ سند */}
      <main className="os-scroll min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
        <div
          ref={wrapRef}
          className="mx-auto w-full max-w-3xl rounded-xl bg-white text-zinc-900 shadow-xl ring-1 ring-black/10"
        >
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            dir="rtl"
            spellCheck={false}
            role="textbox"
            aria-multiline="true"
            aria-label="متن سند"
            onInput={handleInput}
            onKeyUp={refreshFmt}
            onMouseUp={refreshFmt}
            onFocus={refreshFmt}
            className={`os-scroll min-h-[420px] overflow-y-auto rounded-xl px-6 py-6 text-[15px] outline-none ${DOC_STYLES}`}
            style={{ fontFamily: 'var(--font-vazir), sans-serif' }}
          />
          {/* مهر اسپانسر، بیرون از contentEditable ولی داخل ناحیهٔ خروجی PDF */}
          {stamp && (
            <div className="select-none pb-5 pt-1 text-center text-[11px] text-zinc-400">
              {STAMP_TEXT}
            </div>
          )}
        </div>
      </main>

      {/* نوار وضعیت */}
      <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-white/10 bg-zinc-900/80 px-3 py-1.5 text-[11px] text-zinc-400">
        <div className="flex items-center gap-3">
          <span>واژه‌ها: {faNum(words)}</span>
          <span>نویسه‌ها: {faNum(chars)}</span>
        </div>
        <span className={autosave === 'saved' ? 'text-teal-400' : 'text-zinc-500'}>
          {autosave === 'saving'
            ? 'در حال ذخیرهٔ خودکار…'
            : autosave === 'saved'
              ? 'ذخیرهٔ خودکار انجام شد ✓'
              : 'ذخیرهٔ خودکار فعال است'}
        </span>
      </footer>
    </div>
  )
}
