import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/* ------------------------------------------------------------------ */
/* فایل‌سیستم مجازی پنگوئن‌اواس — مشترک بین ترمینال و پرونده‌ها        */
/* ------------------------------------------------------------------ */

export type FsKind = 'txt' | 'img' | 'audio' | 'pdf' | 'exe'

export interface FsFile {
  type: 'file'
  kind: FsKind
  content: string
  image?: string
}

export interface FsDir {
  type: 'dir'
  children: Record<string, FsNode>
}

export type FsNode = FsFile | FsDir

export const HOME = '/home/pengo'

const f = (kind: FsKind, content: string, image?: string): FsFile => ({
  type: 'file',
  kind,
  content,
  image,
})

const d = (children: Record<string, FsNode> = {}): FsDir => ({
  type: 'dir',
  children,
})

export function makeInitialFs(): FsDir {
  return d({
    home: d({
      pengo: d({
        'خوش‌آمد.txt': f(
          'txt',
          [
            'به خانه‌ات در پنگوئن‌اواس خوش اومدی!',
            '',
            'این فایل‌سیستم واقعیه — هر چی اینجا بسازی یا پاک کنی،',
            'ترمینال و پرونده‌ها هر دو می‌بیننش.',
            '',
            'پیشنهاد شروع:',
            '  ls            ← ببین چی داری',
            '  cd عکس‌ها      ← برو تو پوشه عکس‌ها',
            '  cat رازها.txt  ← یه راز بخون',
            '  learn start   ← شروع درس‌های تعاملی ترمینال',
            '  ask چطور فایل بسازم؟ ← از دستیار هوشمند بپرس',
          ].join('\n')
        ),
        'رازها.txt': f(
          'txt',
          [
            'راز شماره ۱: پنگوئن‌ها همیشه خوش‌پوش‌اند، چون دامن دارند.',
            'راز شماره ۲: این فایل را پاک نکن، گربه سیستمی ناراحت می‌شود.',
            'راز شماره ۳: رمز وای‌فای همسایه توی .secret هست. از من شنیدی!',
          ].join('\n')
        ),
        'برنامه_امروز.txt': f(
          'txt',
          [
            '۱. خواب',
            '۲. ماهی خوردن',
            '۳. تسخیر دنیا (اختیاری)',
            '۴. خواب دوباره',
          ].join('\n')
        ),
        '.secret': f('txt', 'رمز وای‌فای همسایه: نمی‌گم. از خودش پرسیدم، قبول نکرد.'),
        '.bashrc': f(
          'txt',
          [
            '# تنظیمات پنگوئن‌شل',
            'export PS1="pengo@pengo-os:\\w$ "',
            'alias ll="ls -la"',
            'alias سلام="echo سلام پنگوئن!"',
            '# نکته: ترمینال اینجا غلط‌های تایپی‌ات را هم اصلاح می‌کند.',
          ].join('\n')
        ),
        'عکس‌ها': d({
          'پنگوئن_فضانورد.png': f('img', 'یک پنگوئن فضانورد وسط کهکشان. کلاه کاسمی ندارد چون پنگوئن است.', '/photos/tux-astronaut.png'),
          'مهمونی_یخی.png': f('img', 'جشن پنگوئنی روی کوه یخ. دیسکو و کلاه پارتی دخیل‌اند.', '/photos/penguin-party.png'),
          'گربه_هکر.png': f('img', 'گربه هکر پشت مانیتور. مقصر نود درصد کرش‌های شبانه.', '/photos/cat-hacker.png'),
          'شهر_یخی.png': f('img', 'شهری کوچک از یخ با چراغ‌های روشن. شهردارش پنگوئن است.', '/photos/ice-city.png'),
          'شفق_شب.png': f('img', 'شفق قطبی بالای تپه‌های برفی. حال‌وهوای خوب.', '/wallpapers/aurora-night.png'),
          'میز_رترو.png': f('img', 'میز کار رترو با مانیتور یونی. عطر نسل‌های گذشته.', '/wallpapers/retro-terminal.png'),
        }),
        'سندها': d({
          'قرارداد_اسپانسری_سان‌جاب.txt': f(
            'txt',
            [
              'قرارداد اسپانسری رسمی سان‌جاب‌او‌اس',
              '',
              'ماده ۱: شرکت سان‌جاب (sunjob.ir) اسپانسیر رسمی این سیستم‌عامل بامزه است.',
              'ماده ۲: پالت رنگی سیستم از سایت سان‌جاب وام گرفته شده — نارنجی، بنفش، فیروزه‌ای.',
              'ماده ۳: در ازای اسپانسری، سنجابک حق دارد هر وقت خواست فندق بخورد.',
              'ماده ۴: این قرارداد تا ابد معتبر است. یا تا ریفرش بعدی مرورگر.',
              '',
              'امضا: سنجابکِ سیستم با جای پنجه 🐾',
            ].join('\n')
          ),
          'قرارداد_با_گربه.pdf': f(
            'pdf',
            [
              'قرارداد همکاری صلح‌آمیز انسان و گربه',
              '',
              'ماده ۱: گربه حق دارد هر ساعتی بخوابد؛ حتی روی کیبورد.',
              'ماده ۲: کیبوردِ گرم، به‌طور خودکار متعلق به گربه تلقی می‌شود.',
              'ماده ۳: در ازای هر میاو صبحگاهی، دو وعده غذا پرداخت می‌گردد.',
              'ماده ۴: این قرارداد قابل فسخ نیست. اصلاً. جدی می‌گیم.',
              'امضای گربه با جای پنجه روی کیبورد ثبت شده: ttttttttt',
            ].join('\n')
          ),
          'دفتر_دخل_و_خرج.txt': f(
            'txt',
            ['دخل: صفر', 'خرج: خیلی', 'مانده: منفی-ولی-خوشحال', '', 'یادداشت حسابدار: باز کردن این فایل مسئولیت روحی خودت است.'].join('\n')
          ),
        }),
        'موسیقی': d({
          'پنگوئن_راک.mp3': f('audio', 'بیت ۸ بیتی با گیتار پنگوئنی. با «open music» پخشش کن!'),
          'میو_ریمیکس.wav': f('audio', 'ریمیکس دی‌جی گربه از یک میو کلاسیک. ۱۲ ثانیه عظمت خالص.'),
        }),
        'پروژه‌ها': d({
          'hello.sh': f('exe', '#!/bin/pengo\necho "سلام! من اولین اسکریپت تو هستم."\necho "برای اجرا بنویس: ./hello.sh"'),
          'fib.py': f(
            'txt',
            [
              '# فیبوناچی با پایتونِ کوچک سان‌جاب',
              'a, b = 0, 1',
              'result = []',
              'for i in range(12):',
              '    result.append(a)',
              '    a, b = b, a + b',
              '',
              'print(result)',
            ].join('\n')
          ),
          'سلام.سنج': f(
            'txt',
            [
              '# اولین برنامه سنجابی!',
              'چاپ("سلام! من زبان سنجابی بلدم")',
              'برای شماره در بازه(1, 6):',
              '    چاپ(f"فندق شماره {شماره}")',
            ].join('\n')
          ),
          'secret_plan.md': f(
            'txt',
            [
              'نقشه تسخیر دنیا:',
              '۱- صبحانه نخودفرنگی (مرحله حیاتی)',
              '۲- جلب اعتماد انسان‌ها با بامزگی',
              '۳- ماهی رایگان برای همه',
              '۴- حکومت پنگوئنی مطلقه (ولی مهربون)',
              '۵- خواب',
              '',
              'وضعیت: مرحله ۲ داره عالی پیش میره.',
            ].join('\n')
          ),
          'ایده‌های_باز.txt': f('txt', ['ایده‌های باز:', '- اپ شمارش ماهی', '- کیبورد ضدگربه (در حال بررسی حقوقی)', '- والپیپر جدید (سبز. همیشه سبز.)'].join('\n')),
        }),
        'دانلودها': d({
          'فایل_خیلی_مهم_final_final2.pdf': f('pdf', 'این فایل خراب است. قول می‌دهم. از کسی هم پرسیدم.'),
        }),
      }),
    }),
    etc: d({
      'os-release': f(
        'txt',
        [
          'NAME="SunJobOS"',
          'PRETTY_NAME="سان‌جاب‌او‌اس ۴.۰ «سنجابک» — با اسپانسری سان‌جاب"',
          'ID=sanjob',
          'KERNEL="6.12.4-sanjob-cute"',
          'SPONSOR="sunjob.ir"',
          'HOME_URL="https://sunjob.ir"',
        ].join('\n')
      ),
      'motd': f('txt', 'به سان‌جاب‌او‌اس خوش آمدی! امروز روز خوبی برای learn start یا اجرای پایتونه. با اسپانسری سان‌جاب'),
      hostname: f('txt', 'sanjob-os'),
    }),
    usr: d({
      share: d({
        fortune: d({
          'فال‌ها.txt': f(
            'txt',
            [
              'امروز روز خوبی برای کرنل کامپایل کردن است. یا خوابیدن. هر دو.',
              'یک پنگوئن پشت توست… نه، اشتباه کردم، آینه بود.',
              'قرعه به نام شما خورد: امروز باید یک بازی بردار!',
              'به‌زودی اتفاق خوبی می‌افتد. احتمالاً یک اعلان جدید.',
              'اگر امروز سخت بود، یعنی سرور کمی خسته است. تقصیر تو نیست.',
              'کد امروزت بدون باگ است. فقط توی همین ترمینال.',
              'یادت باشد: sudo یعنی «superuser do»، نه «لطفاً اجازه بده خرابکاری کنم».',
              'ماهی که زیر آب می‌پرد، پنگوئن خوشحالی می‌کند.',
            ].join('\n')
          ),
        }),
      }),
    }),
    bin: d(
      Object.fromEntries(
        [
          'ls', 'cd', 'pwd', 'cat', 'echo', 'mkdir', 'touch', 'rm', 'cp', 'mv',
          'tree', 'grep', 'head', 'tail', 'wc', 'find', 'history', 'clear',
          'neofetch', 'cowsay', 'fortune', 'banner', 'matrix', 'ping', 'uname',
          'date', 'whoami', 'ps', 'kill', 'sudo', 'apt', 'open', 'apps',
          'learn', 'ask', 'man', 'wallpaper', 'lock', 'sl', 'exit',
        ].map((c) => [c, f('exe', `ELF بامزه ۶۴-بیتی — اجرای ${c} نسخه ۳.۰`)])
      ) as Record<string, FsNode>
    ),
    var: d({
      log: d({
        'kernel.log': f(
          'txt',
          [
            '[    0.000000] Linux version 6.9.4-pengo-cute (pengo@pengo-os)',
            '[    0.100000] بیدار شدن هسته… پنج دقیقه دیگه بابا',
            '[    0.300000] meowd: سرویس گربه‌ها اجرا شد',
            '[    0.500000] یخچال هوشمند در شبکه پیدا نشد',
            '[    0.700000] ماژول انگیزه صبحگاهی نصب نیست… رد شد',
            '[    1.000000] آماده بالا آمدن رابط کاربری بامزه',
          ].join('\n')
        ),
      }),
    }),
  })
}

/* --------------------------- مسیرها --------------------------- */

export function normalizePath(cwd: string, input?: string): string {
  let base: string
  if (!input || input === '~') base = HOME
  else if (input.startsWith('~/')) base = HOME + input.slice(1)
  else if (input.startsWith('/')) base = input
  else base = `${cwd === HOME ? HOME : cwd}/${input}`
  const parts: string[] = []
  for (const seg of base.split('/')) {
    if (!seg || seg === '.') continue
    if (seg === '..') parts.pop()
    else parts.push(seg)
  }
  return '/' + parts.join('/')
}

export const splitPath = (p: string): string[] => p.split('/').filter(Boolean)

export function getNode(root: FsDir, path: string): FsNode | null {
  let cur: FsNode = root
  for (const seg of splitPath(path)) {
    if (cur.type !== 'dir') return null
    const next: FsNode | undefined = cur.children[seg]
    if (!next) return null
    cur = next
  }
  return cur
}

export function parentOf(path: string): string {
  const parts = splitPath(path)
  parts.pop()
  return '/' + parts.join('/')
}

export function baseName(path: string): string {
  const parts = splitPath(path)
  return parts[parts.length - 1] ?? '/'
}

export function prettyPath(path: string): string {
  if (path === HOME) return '~'
  if (path.startsWith(HOME + '/')) return '~' + path.slice(HOME.length)
  return path
}

export function displayName(path: string): string {
  return baseName(path)
}

function clone(root: FsDir): FsDir {
  if (typeof structuredClone === 'function') return structuredClone(root)
  return JSON.parse(JSON.stringify(root)) as FsDir
}

/* --------------------------- استور --------------------------- */

interface FsStore {
  fs: FsDir
  writeFile: (path: string, content: string, append?: boolean) => boolean
  mkdir: (path: string) => boolean
  remove: (path: string) => boolean
  copy: (src: string, dst: string) => boolean
  move: (src: string, dst: string) => boolean
  chmod: (path: string, exe: boolean) => boolean
  resetFs: () => void
}

export const useFs = create<FsStore>()(
  persist(
    (set, get) => ({
      fs: makeInitialFs(),
      writeFile: (path, content, append = false) => {
        const parent = getNode(get().fs, parentOf(path))
        if (!parent || parent.type !== 'dir') return false
        const name = baseName(path)
        if (!name || name === '/') return false
        const existing = parent.children[name]
        if (existing && existing.type === 'dir') return false
        const next = clone(get().fs)
        const targetParent = getNode(next, parentOf(path))
        if (!targetParent || targetParent.type !== 'dir') return false
        const prev = existing && !append ? '' : ((existing as FsFile)?.content ?? '')
        targetParent.children[name] = f('txt', append ? prev + content : content)
        set({ fs: next })
        return true
      },
      mkdir: (path) => {
        const parts = splitPath(path)
        const next = clone(get().fs)
        let cur: FsDir = next
        for (const seg of parts) {
          const child: FsNode | undefined = cur.children[seg]
          if (!child) {
            cur.children[seg] = d()
          } else if (child.type === 'file') {
            return false
          }
          cur = cur.children[seg] as FsDir
        }
        set({ fs: next })
        return true
      },
      remove: (path) => {
        if (path === '/' || path === HOME) return false
        const parent = getNode(get().fs, parentOf(path))
        const name = baseName(path)
        if (!parent || parent.type !== 'dir' || !parent.children[name]) return false
        const next = clone(get().fs)
        const targetParent = getNode(next, parentOf(path))
        if (!targetParent || targetParent.type !== 'dir') return false
        delete targetParent.children[name]
        set({ fs: next })
        return true
      },
      copy: (src, dst) => {
        const node = getNode(get().fs, src)
        if (!node) return false
        const dstParent = getNode(get().fs, parentOf(dst))
        if (!dstParent || dstParent.type !== 'dir') return false
        const dstName = baseName(dst)
        if (dstName === '/') return false
        const existingDst = dstParent.children[dstName]
        let finalPath = dst
        if (existingDst?.type === 'dir') finalPath = normalizePath(dst, baseName(src))
        const finalParent = getNode(get().fs, parentOf(finalPath))
        if (!finalParent || finalParent.type !== 'dir') return false
        const next = clone(get().fs)
        const fp = getNode(next, parentOf(finalPath))
        if (!fp || fp.type !== 'dir') return false
        fp.children[baseName(finalPath)] = structuredClone
          ? structuredClone(node)
          : (JSON.parse(JSON.stringify(node)) as FsNode)
        set({ fs: next })
        return true
      },
      move: (src, dst) => {
        const st = get()
        if (!st.copy(src, dst)) return false
        return st.remove(src)
      },
      chmod: (path, exe) => {
        const node = getNode(get().fs, path)
        if (!node || node.type !== 'file') return false
        const next = clone(get().fs)
        const target = getNode(next, path)
        if (!target || target.type !== 'file') return false
        target.kind = exe ? 'exe' : 'txt'
        set({ fs: next })
        return true
      },
      resetFs: () => set({ fs: makeInitialFs() }),
    }),
    { name: 'pengo-fs-v2' }
  )
)
