'use client'

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import { useOS } from '@/lib/os/store'
import { getApp } from '@/lib/os/apps'

type LineType = 'in' | 'out' | 'ok' | 'err' | 'warn' | 'sys'

interface Line {
  id: number
  type: LineType
  text: string
}

const FILES: Record<string, string> = {
  'رازها.txt':
    '🤫 راز شماره ۱: پنگوئن‌ها همیشه خوش‌پوش‌اند، چون دامن دارند.\n🤫 راز شماره ۲: این فایل را پاک نکن، گربه سیستمی ناراحت می‌شود.',
  'برنامه_امروز.txt':
    '۱. خواب\n۲. ماهی خوردن\n۳. تسخیر دنیا (اختیاری)\n۴. خواب دوباره',
  'cat.jpg':
    '🖼 [تصویر یک گربه خیلی بامزه — ولی ترمینال نمی‌تواند نشانش دهد!\nطبق قانون لینوکس: همه‌چی فایل متنی است]\n\n   /\\_/\\\n  ( o.o )\n   > ^ <',
  '.secret': 'رمز وای‌فای همسایه: نمی‌گم 😝 (از روش پرسیدم، قبول نکرد)',
  '~/عکس‌ها/گربه.png': '🐱 یک گربه. خیلی بامزه. کیفیت: نامحدود.',
  '~/عکس‌ها/تعطیلات.jpg': '🏖 سواحل یخ قطب جنوب. آب هوای عالی: ۴۰- درجه!',
  '~/عکس‌ها/ممنوعه.gif': '🚫 این فایل برای دیدن نیاز به سطح دسترسی «شجاعت» دارد.',
  '~/سندها/قرارداد_با_گربه.pdf':
    'ماده ۱: گربه غذا می‌گیرد.\nماده ۲: گربه هر کاری بخواهد می‌شود.\nماده ۳: بند ۱ و ۲ قابل لغو نیستند.',
  '~/سندها/دفتر_دخل_و_خرج.xlsx':
    'دخل: صفر\nخرج: خیلی\nمانده: منفی‌ولی-خوشحال',
  '~/موسیقی/پنگوئن_راک.mp3': '🎸 نکته: پخش‌کننده چیپ‌تیون همین الان منتظرته!',
  '~/موسیقی/میو_ریمیکس.wav': '🐱 میو میو میو (نسخه دی‌جی)',
}

const DIRS: Record<string, string[]> = {
  '~': [
    'عکس‌ها/',
    'سندها/',
    'موسیقی/',
    'رازها.txt',
    'برنامه_امروز.txt',
    'cat.jpg',
    '.secret',
  ],
  '~/عکس‌ها': ['گربه.png', 'تعطیلات.jpg', 'ممنوعه.gif'],
  '~/سندها': ['قرارداد_با_گربه.pdf', 'دفتر_دخل_و_خرج.xlsx'],
  '~/موسیقی': ['پنگوئن_راک.mp3', 'میو_ریمیکس.wav'],
}

const FORTUNES = [
  'امروز روز خوبی برای کرنل کامپایل کردن است. یا خوابیدن. هر دو.',
  'یک پنگوئن پشت توست… نه، اشتباه کردم، آینه بود.',
  'قرعه به نام شما خورد: امروز باید یک بازی بردار! 🎮',
  'بزودی اتفاق خوبی می‌افتد. احتمالاً یک toast جدید.',
  'اگر امروز سخت بود، یعنی سرور کمی خسته است. تقصیر تو نیست.',
  'ماهی که زیر آب می‌پرد، پنگوئن خوشحالی می‌کند. 🐟',
  'کد امروزت بدون باگ است. فقط توی همین ترمینال.',
  'یادت باشه: sudo به این معنی نیست که همیشه حق با توئه.',
]

const HELP: [string, string][] = [
  ['help', 'همین لیست بامزه'],
  ['ls / cd / cat', 'گشتن تو فایل‌سیستم خیالی'],
  ['neofetch', 'مشخصات سیستم + پنگوئن خوشگل'],
  ['cowsay <متن>', 'گاو بامزه حرف می‌زنه'],
  ['fortune', 'یه فال پنگوئنی'],
  ['matrix', 'وارد ماتریکس شو (آبی نیست، سبزه!)'],
  ['ping <آدرس>', 'پینگ با فناوری کوانتومی'],
  ['open <نام اپ>', 'باز کردن برنامه (مثل: open snake)'],
  ['apps', 'لیست همه اپ‌ها'],
  ['sudo rm -rf /', 'اون کارو نکن! 😅'],
  ['whoami / date / uname', 'اینا هم هست'],
  ['clear / exit', 'پاک کردن / بستن ترمینال'],
]

const TUX_ART = String.raw`
   .--.
  |o_o |
  |:_/ |
 //   \ \
(|     | )
/'\_   _/'\
\___)=(___/
`

const COW_ART = (text: string) => String.raw`
 _________
< ${text} >
 ---------
        \   ^__^
         \  (oo)\_______
            (__)\       )\/\
                ||----w |
                ||     ||
`

let lineId = 0
const mkLine = (type: LineType, text: string): Line => ({
  id: lineId++,
  type,
  text,
})

export default function TerminalApp() {
  const [lines, setLines] = useState<Line[]>(() => [
    mkLine(
      'sys',
      'پنگوئن‌شل ۲.۰ — به ترمینال بامزه خوش اومدی! 🐧'
    ),
    mkLine('out', 'برای دیدن دستورها بنویس: help'),
  ])
  const [cwd, setCwd] = useState('~')
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [histIdx, setHistIdx] = useState(-1)
  const [matrixMode, setMatrixMode] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [lines])

  useEffect(() => {
    if (!matrixMode) return
    const iv = setInterval(() => {
      const chars = 'アイウエオカキクケコサシスセソ0101101001'
      const row = Array.from(
        { length: 64 },
        () => chars[Math.floor(Math.random() * chars.length)]
      ).join(' ')
      setLines((ls) => [...ls.slice(-40), mkLine('ok', row)])
    }, 90)
    const stop = setTimeout(() => {
      setMatrixMode(false)
      setLines((ls) => [
        ...ls,
        mkLine('sys', 'از ماتریکس خارج شدی. قرمز یا سبز؟ سبز که واضحه. 💊'),
      ])
    }, 3000)
    return () => {
      clearInterval(iv)
      clearTimeout(stop)
    }
  }, [matrixMode])

  const push = (type: LineType, text: string) =>
    setLines((ls) => [...ls, mkLine(type, text)])

  const closeSelf = () => {
    const st = useOS.getState()
    const win = st.windows.find((w) => w.appId === 'terminal')
    if (win) st.closeWindow(win.id)
  }

  const run = (raw: string) => {
    const cmd = raw.trim()
    push('in', cmd)
    if (!cmd) return
    setHistory((h) => [cmd, ...h].slice(0, 50))
    setHistIdx(-1)

    const parts = cmd.split(/\s+/)
    const base = parts[0].toLowerCase()
    const arg = parts.slice(1).join(' ')

    switch (base) {
      case 'help':
        push('sys', 'دستورهای موجود:')
        HELP.forEach(([c, d]) => push('out', `  ${c.padEnd(18)} ← ${d}`))
        break
      case 'ls': {
        const items = DIRS[cwd] ?? []
        if (items.length === 0) {
          push('out', '(خالیه، مثل وعده‌های عید)')
        } else {
          items.forEach((it) =>
            it.endsWith('/')
              ? push('ok', '📁 ' + it)
              : push('out', '📄 ' + it)
          )
        }
        break
      }
      case 'cd': {
        if (!arg || arg === '~' || arg === 'cd') {
          setCwd('~')
        } else if (arg === '..') {
          setCwd((c) => (c === '~' ? '~' : '~'))
          push('warn', 'این فایل‌سیستم فقط یک طبقه داره، خونه‌ی یه‌طبقه‌ست 😅')
        } else {
          const target = cwd === '~' ? `~/${arg}` : `${cwd}/${arg}`
          if (DIRS[target]) setCwd(target)
          else push('err', `پوشه‌ای به اسم «${arg}» نیست! (ls بزن ببین چی داریم)`)
        }
        break
      }
      case 'cat': {
        if (!arg) {
          push('err', 'باید اسم فایل رو بگی: cat رازها.txt')
        } else {
          const key = cwd === '~' && !arg.includes('/') ? arg : arg.startsWith('~') ? arg : `${cwd}/${arg}`
          const content = FILES[arg] ?? FILES[key] ?? FILES[`${cwd}/${arg}`]
          if (content) push('out', content)
          else push('err', `فایل «${arg}» پیدا نشد. شاید گربه برداشته 🐱`)
        }
        break
      }
      case 'pwd':
        push('out', `/home/pengo${cwd === '~' ? '' : cwd.slice(1)}`)
        break
      case 'whoami':
        push('ok', 'pengo — مدیر ارشد بامزگی (سطح دسترسی: همه‌چی، چون خونه خودته)')
        break
      case 'date':
        push('out', new Date().toLocaleDateString('fa-IR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }))
        break
      case 'uname':
        push('out', 'پنگوئن‌اواس ۲.۰ «کلوخک» — kernel 6.9.4-pengo x86_64 (هسته خیلی بامزه)')
        break
      case 'neofetch':
        push('sys', TUX_ART)
        push('out', 'OS:       پنگوئن‌اواس ۲.۰ «کلوخک»')
        push('out', 'Kernel:   6.9.4-pengo')
        push('out', 'Shell:    pengo-sh 2.0')
        push('out', 'Uptime:   هرقدر که تو این پنجره رو باز نگه داری')
        push('out', 'CPU:      مغز شما (چند هسته؟ نمی‌دونیم)')
        push('out', 'GPU:      تصورات شما')
        push('out', 'Memory:   64 MiB عمدتاً میم‌ها')
        break
      case 'cowsay': {
        const text = (arg || 'مووو! تو بهترین کاربری در دنیایی').slice(0, 36)
        push('sys', COW_ART(text))
        break
      }
      case 'fortune':
        push('ok', '🔮 ' + FORTUNES[Math.floor(Math.random() * FORTUNES.length)])
        break
      case 'matrix':
        push('sys', 'وارد ماتریکس می‌شی… (۳ ثانیه صبر کن) 🟩')
        setMatrixMode(true)
        break
      case 'ping': {
        const host = arg || 'penguin.os'
        push('out', `PING ${host} (42.42.42.42) از طریق تونل کوانتومی پنگوئنی:`)
        for (let i = 1; i <= 4; i++) {
          push('out', `پاسخ از 42.42.42.42: بایت=۳۲ زمان=${40 + Math.floor(Math.random() * 20)}ms TTL=۲۵۶`)
        }
        push('ok', 'نتیجه: سرور زنده‌ست و حالش خوبه 🫡')
        break
      }
      case 'echo':
        push('out', arg || '')
        break
      case 'mkdir':
      case 'touch':
        push('ok', `«${arg || 'چیزی'}» ساخته شد! (فقط تو ذهنمون، ولی قشنگه 😅)`)
        break
      case 'rm':
        push('warn', 'فایل به خانه گربه‌ها فرستاده شد 🐱 (هیچی واقعا پاک نشد، خیالت راحت)')
        break
      case 'apps': {
        push('sys', 'اپ‌های نصب‌شده (با open بازشون کن):')
        push('out', '  terminal, files, notes, clock, paint, calc,')
        push('out', '  weather, monitor, music, settings, ideas, cat')
        push('out', 'بازی‌ها: snake, 2048, ttt, memory, mines, pong, flappy, whack, breakout')
        break
      }
      case 'open': {
        const map: Record<string, string> = {
          terminal: 'terminal', files: 'file-manager', notes: 'notes',
          clock: 'clock', paint: 'paint', calc: 'calculator',
          weather: 'weather', monitor: 'system-monitor', music: 'music',
          settings: 'settings', ideas: 'ideas', cat: 'cat-translator',
          snake: 'snake', '2048': 'g2048', ttt: 'tictactoe',
          memory: 'memory', mines: 'minesweeper', pong: 'pong',
          flappy: 'flappy', whack: 'whackamole', breakout: 'breakout',
        }
        const appId = map[arg.toLowerCase().trim()]
        const app = appId ? getApp(appId) : undefined
        if (app) {
          const st = useOS.getState()
          st.openApp({ appId: app.id, title: app.name, w: app.w, h: app.h })
          push('ok', `«${app.name}» باز شد ✨`)
        } else {
          push('err', `اپی به اسم «${arg || 'خالی'}» نداریم. بنویس apps تا لیست رو ببینی.`)
        }
        break
      }
      case 'sudo': {
        if (cmd.includes('rm') && cmd.includes('-rf') && cmd.includes('/')) {
          push('warn', 'در حال حذف همه‌چیز…')
          push('out', '▓▓▓▓▓▓▓▓▓▓░░░░ ۶۷٪')
          setTimeout(() => {
            push('err', '😱 صبر کن صبر کن صبر کن!')
          }, 700)
          setTimeout(() => {
            push('sys', 'خیالت راحت! این یه سیستم‌عامل بامزه‌ست؛ هیچی پاک نمی‌شه 🐧\nولی دفعه بعد قبل از این‌کار، یه فکر کوچولو بکن.')
          }, 1400)
        } else {
          push('ok', 'شما sudo نیستید… ولی بگذار وانمود کنیم اجازه دادم. چی می‌خواستی؟ 😄')
        }
        break
      }
      case 'apt':
      case 'apt-get':
      case 'install':
        push('out', 'در حال نصب بامزگی بیشتر…')
        push('ok', 'نصب شد ✅ حالا ۲۰٪ بامزه‌تر شدی.')
        break
      case 'coffee':
      case 'قهوه':
        push('sys', '  ( (\n   ) )\n ........\n |      |]\n \\      /\n  `----\'\n☕ قهوه آماده‌ست! ولی اینجا وب دیگه، بو نمیده.')
        break
      case 'tux':
        push('sys', TUX_ART)
        push('ok', 'این ماسکات ماست. اسمش Tux‌ه. نماد لینوکس. خوشگله، نه؟')
        break
      case 'exit':
      case 'quit':
        push('out', 'بای بای! 👋')
        setTimeout(closeSelf, 400)
        break
      case 'clear':
        setLines([])
        break
      default:
        push('err', `دستور پیدا نشد: ${base} — بنویس help (یا open snake 🙂)`)
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    run(input)
    setInput('')
  }

  const onKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (history.length === 0) return
      const idx = Math.min(histIdx + 1, history.length - 1)
      setHistIdx(idx)
      setInput(history[idx])
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const idx = histIdx - 1
      if (idx < 0) {
        setHistIdx(-1)
        setInput('')
      } else {
        setHistIdx(idx)
        setInput(history[idx])
      }
    }
  }

  const color: Record<LineType, string> = {
    in: 'text-zinc-500',
    out: 'text-zinc-200',
    ok: 'text-emerald-400',
    err: 'text-rose-400',
    warn: 'text-amber-300',
    sys: 'text-violet-300',
  }

  return (
    <div
      className="flex h-full flex-col bg-[#0a0f0a] font-mono"
      onClick={() => inputRef.current?.focus()}
    >
      <div
        ref={scrollRef}
        className="os-scroll min-h-0 flex-1 overflow-y-auto p-3 text-[12px] leading-6 sm:text-[13px]"
        dir="rtl"
      >
        {lines.map((l) =>
          l.text.includes('\n') || /^[\s/\]|<>_()=\\]+$/.test(l.text) ? (
            <pre
              key={l.id}
              className={`whitespace-pre text-left ${color[l.type]}`}
              dir="ltr"
            >
              {l.text}
            </pre>
          ) : (
            <div key={l.id} className={`whitespace-pre-wrap ${color[l.type]}`}>
              {l.type === 'in' && <span className="text-emerald-500">$ </span>}
              {l.text}
            </div>
          )
        )}
      </div>
      <form
        onSubmit={onSubmit}
        className="flex shrink-0 items-center gap-2 border-t border-white/10 px-3 py-2 text-[12px] sm:text-[13px]"
        dir="ltr"
      >
        <span className="shrink-0 text-emerald-400" dir="ltr">
          pengo@penguin:{cwd}$
        </span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          className="min-w-0 flex-1 bg-transparent text-zinc-100 outline-none placeholder:text-zinc-700"
          placeholder="یه دستور بنویس… (help)"
          aria-label="ورودی ترمینال"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
        />
        <span className="pengo-caret text-emerald-400" aria-hidden>
          ▌
        </span>
      </form>
    </div>
  )
}
