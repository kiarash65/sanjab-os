'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import {
  Braces,
  Bug,
  Code2,
  Copy,
  FileCode2,
  Globe,
  Play,
  RotateCcw,
  Save,
  Squirrel,
  Trash2,
} from 'lucide-react'
import { useOS } from '@/lib/os/store'
import { HOME, getNode, useFs } from '@/lib/os/fs'
import { LANG_INFO, runScript, type ScriptLang } from '@/lib/os/interpreter'
import { PyodideRunner, type PyOutKind } from '@/lib/os/pyodide'
import { useGame } from '@/lib/gamification/engine'

/* ------------------------------------------------------------------ */
/* کداستودیو سان‌جاب — پایتونِ کوچک + سنجابی + جاوااسکریپت + HTML       */
/* ------------------------------------------------------------------ */

type Lang = ScriptLang | 'js' | 'html'

/** حالت اجرای پایتون — مینی‌مترپرتر آفلاین یا CPython واقعی (Pyodide) */
type PyMode = 'mini' | 'real'

interface LangMeta {
  id: Lang
  name: string
  desc: string
  ext: string
  icon: typeof Code2
  color: string
}

const LANGS: LangMeta[] = [
  {
    id: 'python',
    name: 'پایتون',
    desc: 'پایتون واقعی CPython (Pyodide) یا پایتونِ کوچک آموزشی — با انتخابگر حالت اجرا',
    ext: 'py',
    icon: Code2,
    color: '#f7931e',
  },
  {
    id: 'squirrel',
    name: 'سنجابی',
    desc: 'زبان برنامه‌نویسی فارسیِ رسمی سنجاب‌ها',
    ext: 'sanj',
    icon: Squirrel,
    color: '#8b5cf6',
  },
  {
    id: 'js',
    name: 'جاوااسکریپت',
    desc: 'جاوااسکریپت واقعی، داخل قفسِ امن',
    ext: 'js',
    icon: Braces,
    color: '#0ea5a0',
  },
  {
    id: 'html',
    name: 'HTML',
    desc: 'صفحه‌ات را زنده ببین!',
    ext: 'html',
    icon: Globe,
    color: '#e11d48',
  },
]

interface Example {
  title: string
  code: string
}

const EXAMPLES: Record<Lang, Example[]> = {
  python: [
    {
      title: 'سلام دنیا',
      code: `# اولین برنامه‌ات — سلام دنیا!\nprint("سلام دنیا!")\nprint("به کداستودیوی سان‌جاب خوش اومدی")\n`,
    },
    {
      title: 'فیبوناچی',
      code: `# دنباله فیبوناچی — ۱۰ جمله اول\na, b = 0, 1\nfibs = []\nfor i in range(10):\n    fibs.append(a)\n    a, b = b, a + b\n\nprint("فیبوناچی:", fibs)\n`,
    },
    {
      title: 'حدس عددی',
      code: `# بازی حدس عدد — راز عدد بین ۱ تا ۵۰\nsecret = 27\nguesses = [10, 40, 25, 30, 27]\n\nfor g in guesses:\n    if g == secret:\n        print(f"آفرین! {g} درست بود")\n        break\n    elif g < secret:\n        print(f"{g} کوچیک‌تره!")\n    else:\n        print(f"{g} بزرگ‌تره!")\n`,
    },
    {
      title: 'تابع و بازگشت',
      code: `# فاکتوریل با بازگشت\ndef factorial(n):\n    if n <= 1:\n        return 1\n    return n * factorial(n - 1)\n\nfor i in range(1, 8):\n    print(f"{i}! = {factorial(i)}")\n`,
    },
    {
      title: 'لیست و دیکشنری',
      code: `# نمره‌های کلاس\nscores = {"علی": 18, "سارا": 20, "پنگوئن": 19.5}\n\nfor name, score in scores.items():\n    print(f"{name}: {score}")\n\nnums = [12, 5, 8, 20, 3]\nprint("بیشترین:", max(nums))\nprint("میانگین:", sum(nums) / len(nums))\nprint("مرتب:", sorted(nums))\n`,
    },
    {
      title: 'جدول ضرب',
      code: `# جدول ضرب ۱۰×۱۰\nfor i in range(1, 11):\n    row = ""\n    for j in range(1, 11):\n        row += str(i * j) + "\\t"\n    print(row)\n`,
    },
    {
      title: 'تابع و پارامتر',
      code: `# تابع محاسبه مساحت و محیط مستطیل\ndef مستطیل(طول, عرض):\n    مساحت = طول * عرض\n    محیط = 2 * (طول + عرض)\n    return مساحت, محیط\n\nm, p = مستطیل(5, 3)\nprint(f"مساحت: {m}")\nprint(f"محیط: {p}")\n`,
    },
    {
      title: 'while و break',
      code: `# شمارش معکوس با while\ncount = 5\nwhile count > 0:\n    print(f"تا کم‌شدن: {count}")\n    count = count - 1\n\nprint("صفر! بوم! 🎉")\n`,
    },
    {
      title: 'رشته‌ها و حلقه',
      code: `# شمارش حروف یک کلمه\nکلمه = "سنجابک"\nfor حرف in کلمه:\n    print(f"حرف: {حرف}")\nprint(f"طول: {len(کلمه)}")\n`,
    },
    {
      title: 'اعداد تصادفی',
      code: `# پرتاب تاس ۵ بار\nfor i in range(5):\n    r = random()\n    tas = int(r * 6) + 1\n    print(f"پرتاب {i+1}: {tas}")\n`,
    },
    {
      title: 'اعداد اول',
      code: `# یافتن اعداد اول کوچکتر از ۳۰\nfor n in range(2, 30):\n    is_prime = True\n    for i in range(2, n):\n        if n % i == 0:\n            is_prime = False\n            break\n    if is_prime:\n        print(n, "اول است")\n`,
    },
    {
      title: 'ریاضیات',
      code: `# توابع ریاضی\nprint("جذر ۱۶:", sqrt(16))\nprint("۲ به توان ۱۰:", pow(2, 10))\nprint("گرد کردن ۳.۱۴۱۵۹:", round(3.14159, 2))\nprint("کف ۳.۹:", floor(3.9))\nprint("سقف ۳.۱:", ceil(3.1))\nprint("قدر مطلق -۷:", abs(-7))\n`,
    },
  ],
  squirrel: [
    {
      title: 'سلام سنجابی',
      code: `# اولین برنامه سنجابی!\nچاپ("سلام دنیا! من سنجابی بلدم")\nچاپ("کلیدواژه‌ها همه فارسی‌اند!")\n`,
    },
    {
      title: 'حلقه برای',
      code: `# شمردن فندق‌ها\nفندق = 0\nبرای شماره در بازه(1, 11):\n    فندق += شماره\n\nچاپ(f"کل فندق‌ها: {فندق}")\n`,
    },
    {
      title: 'اگه و وگرنه',
      code: `# تشخیص زوج و فرد\nعدد = 17\nاگه عدد % 2 == 0:\n    چاپ(f"{عدد} زوجه")\nوگرنه عدد % 5 == 0:\n    چاپ(f"{عدد} بر ۵ بخش‌پذیره")\nپس:\n    چاپ(f"{عدد} فرده")\n`,
    },
    {
      title: 'تابع سنجابی',
      code: `# تابع محاسبه مساحت\nتابع مساحت_مستطیل(طول, عرض):\n    برگردون طول * عرض\n\nچاپ(مساحت_مستطیل(5, 3))\nچاپ(طول("سنجاب"))\n`,
    },
  ],
  js: [
    {
      title: 'سلام دنیا',
      code: `// جاوااسکریپت واقعی!\nconsole.log("سلام دنیا!");\nconsole.log("من داخل یه Web Worker امن اجرا می‌شم");\n`,
    },
    {
      title: 'آرایه و map',
      code: `const دانشجوها = ["علی", "سارا", "سنجابک"];\n\nconst سلامها = دانشجوها.map((n) => \`سلام \${n}!\`);\nسلامها.forEach(console.log);\n\nconsole.log("تعداد:", دانشجوها.length);\n`,
    },
    {
      title: 'کلاس و شیء',
      code: `class سنجاب {\n  constructor(نام) {\n    this.نام = نام;\n    this.فندق = 0;\n  }\n  جمع‌کردن(n) {\n    this.فندق += n;\n    return this;\n  }\n}\n\nconst سنجابک = new سنجاب("سنجابک");\nسنجابک.جمع‌کردن(5).جمع‌کردن(3);\nconsole.log(\`\${سنجابک.نام} \${سنجابک.فندق} فندق داره!\`);\n`,
    },
  ],
  html: [
    {
      title: 'سلام صفحه',
      code: `<!doctype html>\n<html dir="rtl">\n  <body style="font-family:sans-serif; background:#fffbf5; text-align:center; padding:40px">\n    <h1 style="color:#f7931e">سلام دنیا!</h1>\n    <p style="color:#1a2744">این صفحه واقعی رندر می‌شه — با اسپانسری سان‌جاب</p>\n  </body>\n</html>\n`,
    },
    {
      title: 'دکمه رنگی',
      code: `<!doctype html>\n<html dir="rtl">\n  <body style="font-family:sans-serif; background:#1a2744; display:grid; place-items:center; min-height:90vh">\n    <button\n      onclick="this.textContent='کلیک شد! سان‌جاب'; this.style.background='#8b5cf6'"\n      style="background:#f7931e; color:white; border:none; padding:16px 32px; border-radius:16px; font-size:20px; font-weight:bold; cursor:pointer"\n    >\n      منو بزن!\n    </button>\n  </body>\n</html>\n`,
    },
  ],
}

const SAVE_DIR = `${HOME}/پروژه‌ها`

/** راهنمای سریع توابع هر زبان */
const CHEAT_SHEETS: Record<Lang, { title: string; items: string[] }[]> = {
  python: [
    { title: 'چاپ و ورودی', items: ['print("متن")', 'print(f"سلام {name}")'] },
    { title: 'متغیر و نوع', items: ['x = 10', 'name = "علی"', 'n = int("42")', 's = str(42)'] },
    { title: 'شرط', items: ['if x > 0:', 'elif x == 0:', 'else:'] },
    { title: 'حلقه', items: ['for i in range(10):', 'for x in list:', 'while x > 0:', 'break / continue'] },
    { title: 'تابع', items: ['def add(a, b):', '    return a + b'] },
    { title: 'لیست', items: ['nums = [1, 2, 3]', 'nums.append(4)', 'len(nums)', 'sorted(nums)', 'sum(nums)', 'max(nums)'] },
    { title: 'دیکشنری', items: ['d = {"a": 1}', 'd["b"] = 2', 'for k, v in d.items():'] },
    { title: 'ریاضی', items: ['sqrt(16)', 'pow(2, 10)', 'round(3.14, 2)', 'abs(-7)', 'floor(3.9)', 'ceil(3.1)'] },
    { title: 'رشته', items: ['len("سلام")', 'str(42)', '"a" + "b"'] },
  ],
  squirrel: [
    { title: 'چاپ', items: ['چاپ("متن")', 'چاپ(f"سلام {نام}")'] },
    { title: 'شرط', items: ['اگه x > 0:', 'وگرنه x == 0:', 'پس:'] },
    { title: 'حلقه', items: ['برای i در بازه(10):', 'تاوقتی x > 0:', 'بس‌کن / ادامه‌بده'] },
    { title: 'تابع', items: ['تابع جمع(آ, ب):', '    برگردون آ + ب'] },
    { title: 'توابع', items: ['طول(...)', 'بیشترین(...)', 'کمترین(...)', 'جمع(...)', 'مرتب(...)'] },
  ],
  js: [
    { title: 'چاپ', items: ['console.log("متن")', 'console.log(`سلام ${name}`)'] },
    { title: 'متغیر', items: ['let x = 10', 'const name = "علی"', 'var y = 5'] },
    { title: 'تابع', items: ['function add(a, b) {', '  return a + b;', '}'] },
    { title: 'آرایه', items: ['arr.map(x => x*2)', 'arr.filter(x => x>0)', 'arr.forEach(fn)'] },
    { title: 'کلاس', items: ['class Cat {', '  constructor(n) { this.n = n }', '}'] },
  ],
  html: [
    { title: 'ساختار', items: ['<html>', '<body>', '<h1>', '<p>', '<div>'] },
    { title: 'استایل', items: ['style="color:red"', 'style="background:#f7931e"'] },
    { title: 'تعاملی', items: ['onclick="..."', '<button>'] },
  ],
}

export default function CodeStudioApp() {
  const [lang, setLang] = useState<Lang>('python')
  const [code, setCode] = useState(EXAMPLES.python[0].code)
  const [output, setOutput] = useState<{ kind: 'out' | 'err' | 'sys'; text: string }[]>([
    { kind: 'sys', text: 'کداستودیوی سان‌جاب — یه زبان انتخاب کن و «اجرا» بزن!' },
  ])
  const [running, setRunning] = useState(false)
  const [lastMs, setLastMs] = useState<number | null>(null)
  const [fileName, setFileName] = useState('برنامه_من')
  const [showCheat, setShowCheat] = useState(false)
  const [pyMode, setPyMode] = useState<PyMode>('mini')
  const [pyStatus, setPyStatus] = useState<string>('')

  const editorRef = useRef<HTMLTextAreaElement>(null)
  const gutterRef = useRef<HTMLDivElement>(null)
  const workerRef = useRef<Worker | null>(null)
  const pyRef = useRef<PyodideRunner | null>(null)

  const meta = useMemo(() => LANGS.find((l) => l.id === lang)!, [lang])
  const lineCount = useMemo(() => code.split('\n').length, [code])

  const push = useCallback((kind: 'out' | 'err' | 'sys', text: string) => {
    setOutput((o) => [...o.slice(-300), { kind, text }])
  }, [])

  // آزادسازی وورکرها
  useEffect(() => {
    return () => {
      workerRef.current?.terminate()
      pyRef.current?.terminate()
    }
  }, [])

  const runPythonOrSquirrel = useCallback(
    (src: string, which: ScriptLang) => {
      const res = runScript(src, which)
      for (const line of res.output) push('out', line)
      if (res.error) {
        push('err', `✗ ${res.error}`)
        push('sys', 'نکته: از منوی «مثال‌ها» یه نمونه سالم امتحان کن!')
      } else {
        setLastMs(res.ms)
        push('sys', `✓ اجرا شد در ${res.ms.toFixed(1)} میلی‌ثانیه — آفرین!`)
        useGame.getState().registerCodeRun('mini-run')
      }
    },
    [push]
  )

  const pushPy = useCallback(
    (kind: PyOutKind, text: string) => {
      if (kind === 'stdout') push('out', text)
      else if (kind === 'stderr') push('err', text)
      else if (kind === 'fatal') push('err', `✗ ${text}`)
      else push('sys', text)
      if (kind === 'status' || kind === 'fatal') setPyStatus(text)
    },
    [push]
  )

  const runRealPython = useCallback(
    async (src: string) => {
      if (!pyRef.current) pyRef.current = new PyodideRunner()
      const runner = pyRef.current
      runner.onOut = pushPy
      try {
        push('sys', 'در حال آماده‌سازی CPython… (بار اول اینترنت و کمی صبر لازم دارد)')
        await runner.ensure()
        const r = await runner.run(src, 15000)
        setLastMs(r.ms > 0 ? r.ms : null)
        if (r.ok) {
          push('sys', `✓ CPython اجرا شد در ${r.ms.toFixed(0)} میلی‌ثانیه — پایتون واقعی!`)
          useGame.getState().registerCodeRun('real-run')
        }
      } catch (e) {
        push('err', `✗ ${e instanceof Error ? e.message : 'بارگذاری پایتون واقعی ناموفق بود — اینترنت را چک کن'}`)
        push('sys', 'نکته: می‌توانی با حالت «مینی» بدون اینترنت ادامه بدهی')
      }
    },
    [push, pushPy]
  )

  const runJs = useCallback(
    (src: string) => {
      workerRef.current?.terminate()
      let worker: Worker
      try {
        const blob = new Blob(
          [
            `self.onmessage = function (e) {
  const logs = [];
  const push = function (s) { if (logs.length < 500) logs.push(String(s)); };
  self.console = { log: push, warn: push, error: push, info: push };
  try {
    const fn = new Function(e.data);
    fn();
    self.postMessage({ ok: true, logs: logs });
  } catch (err) {
    self.postMessage({ ok: false, logs: logs, error: String(err && err.message ? err.message : err) });
  }
};`,
          ],
          { type: 'text/javascript' }
        )
        worker = new Worker(URL.createObjectURL(blob))
      } catch {
        push('err', '✗ ساخت قفس امن (Worker) ممکن نشد')
        return
      }
      workerRef.current = worker
      const killer = window.setTimeout(() => {
        push('err', '✗ اجرا بیش از ۳ ثانیه طول کشید — حلقه بی‌نهایت داشتی احتمالاً!')
        worker.terminate()
        setRunning(false)
      }, 3000)
      worker.onmessage = (ev: MessageEvent) => {
        window.clearTimeout(killer)
        const data = ev.data as { ok: boolean; logs: string[]; error?: string }
        for (const l of data.logs ?? []) push('out', l)
        if (data.ok) {
          setLastMs(null)
          push('sys', '✓ اجرا شد — تبریک!')
        } else {
          push('err', `✗ ${data.error ?? 'خطای ناشناخته'}`)
        }
        worker.terminate()
        setRunning(false)
      }
      worker.onerror = () => {
        window.clearTimeout(killer)
        push('err', '✗ خطا در اجرا')
        worker.terminate()
        setRunning(false)
      }
      worker.postMessage(src)
    },
    [push]
  )

  const run = useCallback(() => {
    setRunning(true)
    setOutput([])
    setLastMs(null)
    if (lang === 'python') {
      if (pyMode === 'real') {
        runRealPython(code).finally(() => setRunning(false))
        return
      }
      runPythonOrSquirrel(code, 'python')
    } else if (lang === 'squirrel') runPythonOrSquirrel(code, 'squirrel')
    else if (lang === 'js') runJs(code)
    else push('sys', 'HTML اجرا نمی‌خواد — پیش‌نمایش کنتراهه!')
    if (lang === 'python' || lang === 'squirrel') setRunning(false)
  }, [code, lang, pyMode, runJs, runPythonOrSquirrel, runRealPython, push])

  // اعداد خط
  const gutter = useMemo(
    () => Array.from({ length: lineCount }, (_, i) => i + 1).join('\n'),
    [lineCount]
  )

  const onKeyDown = (e: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget
    if (e.key === 'Tab') {
      e.preventDefault()
      const { selectionStart: s, selectionEnd: t } = el
      const next = code.slice(0, s) + '    ' + code.slice(t)
      setCode(next)
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = s + 4
      })
      return
    }
    if (e.key === 'Enter') {
      const s = el.selectionStart
      const lineStart = code.lastIndexOf('\n', s - 1) + 1
      const curLine = code.slice(lineStart, s)
      const indentMatch = curLine.match(/^[ \t]*/)
      let indent = indentMatch ? indentMatch[0] : ''
      if (curLine.trimEnd().endsWith(':')) indent += '    '
      if (indent) {
        e.preventDefault()
        const next = code.slice(0, s) + '\n' + indent + code.slice(el.selectionEnd)
        setCode(next)
        const target = s + 1 + indent.length
        requestAnimationFrame(() => {
          el.selectionStart = el.selectionEnd = target
        })
      }
    }
  }

  const saveToFs = () => {
    const name = fileName.trim() || 'برنامه_من'
    const path = `${SAVE_DIR}/${name}.${meta.ext}`
    const ok = useFs.getState().writeFile(path, code)
    useOS.getState().pushToast({
      title: 'کداستودیو',
      body: ok ? `«${name}.${meta.ext}» در پرونده‌ها ذخیره شد` : 'ذخیره ناموفق بود!',
    })
  }

  const loadFromFs = () => {
    const name = fileName.trim()
    if (!name) return
    const node = getNode(useFs.getState().fs, `${SAVE_DIR}/${name}.${meta.ext}`)
    if (node && node.type === 'file') {
      setCode(node.content)
      push('sys', `«${name}.${meta.ext}» بارگذاری شد`)
    } else {
      push('err', `فایل «${name}.${meta.ext}» در پروژه‌ها پیدا نشد`)
    }
  }

  const switchLang = (l: Lang) => {
    setLang(l)
    const first = EXAMPLES[l][0]
    setCode(first.code)
    setLastMs(null)
  }

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code)
      useOS.getState().pushToast({ title: 'کداستودیو', body: 'کد کپی شد!' })
    } catch {
      /* بی‌خیال */
    }
  }

  return (
    <div className="flex h-full w-full flex-col bg-zinc-950/60">
      {/* نوار زبان‌ها */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-white/10 bg-zinc-900/70 p-2">
        {LANGS.map((l) => {
          const active = l.id === lang
          return (
            <button
              key={l.id}
              onClick={() => switchLang(l.id)}
              title={l.desc}
              className={`flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold transition active:scale-95 ${
                active ? 'text-white' : 'text-zinc-400 hover:bg-white/10'
              }`}
              style={active ? { background: l.color } : undefined}
            >
              <l.icon size={14} aria-hidden />
              {l.name}
            </button>
          )
        })}
        <span className="mr-auto hidden truncate text-[10px] text-zinc-500 md:inline">
          {meta.desc}
        </span>
      </div>

      {/* انتخابگر موتور پایتون — فقط برای زبان پایتون */}
      {lang === 'python' && (
        <div className="flex flex-wrap items-center gap-1.5 border-b border-white/10 bg-zinc-900/40 px-2 py-1.5">
          <span className="text-[10px] font-bold text-zinc-500">موتور اجرا:</span>
          <button
            onClick={() => setPyMode('mini')}
            className={`rounded-md border px-2 py-0.5 text-[10px] font-bold transition active:scale-95 ${
              pyMode === 'mini'
                ? 'border-[#f7931e]/60 bg-[#f7931e]/15 text-[#f7931e]'
                : 'border-white/10 bg-zinc-800/70 text-zinc-400 hover:bg-zinc-700'
            }`}
            title="مترپرتر آموزشی کوچک — آفلاین و فوری؛ زیرمجموعه‌ای از پایتون"
          >
            مینی (آفلاین)
          </button>
          <button
            onClick={() => setPyMode('real')}
            className={`rounded-md border px-2 py-0.5 text-[10px] font-bold transition active:scale-95 ${
              pyMode === 'real'
                ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-400'
                : 'border-white/10 bg-zinc-800/70 text-zinc-400 hover:bg-zinc-700'
            }`}
            title="CPython کامل از طریق Pyodide — نیاز به اینترنت و ~۱۰MB دانلود دارد"
          >
            پایتون واقعی CPython (اینترنت)
          </button>
          <span className="text-[9px] text-zinc-600">
            {pyMode === 'mini'
              ? 'زیرمجموعه آموزشی — همه دستورهای پایتون را ندارد'
              : 'CPython کامل — ۱۵ ثانیه محدودیت اجرا و سقف خروجی'}
          </span>
        </div>
      )}

      {/* نوار مثال‌ها و فایل */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-white/10 bg-zinc-900/40 px-2 py-1.5">
        <span className="text-[10px] font-bold text-zinc-500">مثال‌ها:</span>
        {EXAMPLES[lang].map((ex) => (
          <button
            key={ex.title}
            onClick={() => setCode(ex.code)}
            className="rounded-md border border-white/10 bg-zinc-800/70 px-2 py-0.5 text-[10px] text-zinc-300 transition hover:bg-zinc-700 active:scale-95"
          >
            {ex.title}
          </button>
        ))}
        <button
          onClick={() => setShowCheat((s) => !s)}
          className={`flex h-6 items-center gap-1 rounded-md border px-2 text-[10px] font-bold transition active:scale-95 ${
            showCheat
              ? 'border-[#f7931e]/60 bg-[#f7931e]/15 text-[#f7931e]'
              : 'border-white/10 bg-zinc-800/70 text-zinc-400 hover:bg-zinc-700'
          }`}
        >
          <Bug size={11} />
          راهنمای توابع
        </button>
        <div className="mr-auto flex items-center gap-1">
          <input
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            className="h-7 w-28 rounded-md border border-white/10 bg-zinc-800/70 px-2 text-[11px] text-zinc-200 outline-none focus:border-[#f7931e]/60"
            aria-label="نام فایل"
            placeholder="نام فایل"
          />
          <button
            onClick={saveToFs}
            title="ذخیره در پرونده‌ها"
            className="grid h-7 w-7 place-items-center rounded-md bg-[#0ea5a0]/15 text-[#2dd4bf] transition hover:bg-[#0ea5a0]/30 active:scale-95"
          >
            <Save size={14} />
          </button>
          <button
            onClick={loadFromFs}
            title="باز کردن از پرونده‌ها"
            className="grid h-7 w-7 place-items-center rounded-md bg-violet-500/15 text-violet-300 transition hover:bg-violet-500/30 active:scale-95"
          >
            <FileCode2 size={14} />
          </button>
          <button
            onClick={copyCode}
            title="کپی کد"
            className="grid h-7 w-7 place-items-center rounded-md bg-zinc-800/70 text-zinc-300 transition hover:bg-zinc-700 active:scale-95"
          >
            <Copy size={14} />
          </button>
        </div>
      </div>

      {/* پنل راهنمای سریع */}
      {showCheat && (
        <div className="os-scroll max-h-44 shrink-0 overflow-y-auto border-b border-white/10 bg-zinc-900/50 p-2" dir="rtl">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {CHEAT_SHEETS[lang].map((cat) => (
              <div key={cat.title} className="rounded-lg border border-white/5 bg-zinc-950/50 p-2">
                <p className="mb-1 text-[10px] font-bold text-[#f7931e]">{cat.title}</p>
                <ul className="space-y-0.5">
                  {cat.items.map((it, i) => (
                    <li
                      key={i}
                      dir="ltr"
                      className="cursor-pointer truncate rounded px-1 py-0.5 font-mono text-[9px] text-zinc-400 transition hover:bg-white/5 hover:text-teal-300"
                      title="کلیک برای درج در ویرایشگر"
                      onClick={() => {
                        setCode((c) => c + (c.endsWith('\n') ? '' : '\n') + it + (lang === 'python' || lang === 'squirrel' ? '\n' : ''))
                        setShowCheat(false)
                      }}
                    >
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ویرایشگر */}
      <div className="relative flex min-h-0 flex-1 flex-row-reverse">
        <div
          ref={gutterRef}
          dir="ltr"
          aria-hidden
          className="w-10 shrink-0 overflow-hidden border-l border-white/5 bg-zinc-900/60 py-2 text-right font-mono text-[11px] leading-5 text-zinc-600"
          style={{ userSelect: 'none' }}
        >
          <pre className="px-2">{gutter}</pre>
        </div>
        <textarea
          ref={editorRef}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onScroll={(e) => {
            if (gutterRef.current) {
              gutterRef.current.scrollTop = e.currentTarget.scrollTop
            }
          }}
          onKeyDown={onKeyDown}
          dir="ltr"
          spellCheck={false}
          aria-label="ویرایشگر کد"
          className="os-scroll min-h-0 flex-1 resize-none bg-zinc-950/80 p-2 pt-2 font-mono text-[12px] leading-5 text-zinc-100 outline-none"
          style={{ direction: 'ltr', textAlign: 'left' }}
        />
      </div>

      {/* HTML پیش‌نمایش */}
      {lang === 'html' && (
        <iframe
          title="پیش‌نمایش HTML"
          sandbox="allow-scripts"
          srcDoc={code}
          className="h-40 w-full shrink-0 border-t border-white/10 bg-white"
        />
      )}

      {/* نوار اجرا */}
      <div className="flex items-center gap-2 border-t border-white/10 bg-zinc-900/70 px-2 py-1.5">
        <button
          onClick={run}
          disabled={running}
          className="flex h-8 items-center gap-1.5 rounded-lg bg-gradient-to-l from-[#f7931e] to-[#e07b00] px-4 text-xs font-black text-white transition hover:brightness-110 active:scale-95 disabled:opacity-50"
        >
          <Play size={14} />
          {running ? 'در حال اجرا…' : 'اجرا'}
        </button>
        <button
          onClick={() => setOutput([])}
          title="پاک کردن خروجی"
          className="grid h-8 w-8 place-items-center rounded-lg bg-zinc-800/70 text-zinc-400 transition hover:bg-zinc-700 active:scale-95"
        >
          <Trash2 size={14} />
        </button>
        {lang === 'html' && (
          <span className="text-[10px] text-zinc-500">
            پیش‌نمایش پایین صفحه زنده است
          </span>
        )}
        {lastMs !== null && (
          <span className="text-[10px] font-bold text-teal-400">
            آخرین اجرا: {lastMs.toFixed(1)}ms
          </span>
        )}
        {pyStatus && lang === 'python' && pyMode === 'real' && (
          <span className="max-w-[220px] truncate text-[10px] text-violet-300" title={pyStatus}>
            {pyStatus}
          </span>
        )}
        <span className="mr-auto hidden items-center gap-1 text-[10px] text-zinc-600 sm:flex">
          <RotateCcw size={10} /> Tab = تورفتگی · بعد از «:» خودش می‌پیچد
        </span>
      </div>

      {/* کنسول خروجی */}
      <div
        className="os-scroll h-36 shrink-0 overflow-y-auto border-t border-white/10 bg-black/60 p-2 font-mono text-[11px] leading-5"
        dir="rtl"
        aria-live="polite"
      >
        {output.map((o, i) => (
          <div
            key={i}
            className={
              o.kind === 'err'
                ? 'whitespace-pre-wrap text-rose-400'
                : o.kind === 'sys'
                  ? 'whitespace-pre-wrap text-violet-400/90'
                  : 'whitespace-pre-wrap text-teal-200'
            }
          >
            {o.text}
          </div>
        ))}
        {output.length === 0 && (
          <div className="text-zinc-600">خروجی اینجا ظاهر می‌شه…</div>
        )}
      </div>

      {/* امضای پایین */}
      <div className="flex items-center justify-between border-t border-white/10 bg-zinc-900/60 px-3 py-1">
        <span className="text-[9px] text-zinc-600">
          {lang === 'python'
            ? pyMode === 'real'
              ? 'CPython واقعی از طریق Pyodide v0.26.4 — اجرای کامل پایتون در Worker جدا'
              : 'پایتونِ کوچک سان‌جاب — مترپرتر آموزشی آفلاین؛ پایتون کامل را با حالت «CPython» امتحان کن'
            : 'کداستودیو سان‌جاب'}
        </span>
        <span className="flex items-center gap-1 text-[9px] font-bold text-amber-400/80">
          <Bug size={9} aria-hidden /> باگ داری؟ خودشه! برنامه‌نویسی همین دیگه
        </span>
      </div>
    </div>
  )
}
