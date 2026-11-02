'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import { CornerDownLeft, GraduationCap, History, List, Sparkles, X, Zap } from 'lucide-react'
import { useOS } from '@/lib/os/store'
import { APPS, getApp, launch } from '@/lib/os/apps'
import { WALLPAPERS } from '@/lib/os/wallpapers'
import {
  HOME,
  baseName,
  getNode,
  normalizePath,
  parentOf,
  prettyPath,
  useFs,
  type FsDir,
  type FsNode,
} from '@/lib/os/fs'
import { aiComplete, hasAICfg, loadAICfg } from '@/lib/os/integrations'

/* ------------------------------------------------------------------ */
/* پنگوئن‌شل ۴.۰ — پایپ، زنجیره، متغیرها، فیلترها و ۲۸ ماموریت آموزشی  */
/* ------------------------------------------------------------------ */

type LineType = 'in' | 'out' | 'ok' | 'err' | 'warn' | 'sys' | 'dim'

interface Line {
  id: number
  type: LineType
  text: string
}

// پایه شمارنده از زمان بوت تا بعد از HMR هم کلید تکراری تولید نشود
let lineId = (Math.floor(Date.now() / 1000) % 9_000_000) * 1_000
const mkLine = (type: LineType, text: string): Line => ({
  id: lineId++,
  type,
  text,
})

/* ------------------------- man pages ------------------------- */

const MAN: Record<string, { u: string; d: string }> = {
  pwd: { u: 'pwd', d: 'مسیر پوشه فعلی را چاپ می‌کند. (print working directory)' },
  ls: {
    u: 'ls [-la] [مسیر]',
    d: 'محتویات پوشه را لیست می‌کند. فلگ a یعنی حتی فایل‌های مخفی (که با نقطه شروع می‌شوند)، فلگ l یعنی با جزئیات.',
  },
  cd: {
    u: 'cd [مسیر]',
    d: 'بین پوشه‌ها جابه‌جا می‌شوی. «cd ..» یعنی یک پوشه برو عقب، «cd ~» یعنی برگرد خانه.',
  },
  cat: { u: 'cat فایل...', d: 'محتوای فایل متنی را نشان می‌دهد. (concatenate)' },
  mkdir: { u: 'mkdir پوشه', d: 'پوشه جدید می‌سازد. (make directory)' },
  touch: { u: 'touch فایل', d: 'فایل خالی می‌سازد (یا تاریخ فایل را تازه می‌کند).' },
  echo: { u: 'echo متن [> فایل]', d: 'متن را چاپ می‌کند؛ با «>» می‌توانی داخل فایل بنویسی و با «>>» به انتهای فایل اضافه کنی.' },
  rm: { u: 'rm [-r] مسیر', d: 'فایل پاک می‌کند. با r پوشه‌ها هم پاک می‌شوند. با احتیاط! r یعنی recursive.', },
  cp: { u: 'cp مبدأ مقصد', d: 'کپی می‌کند. (copy)' },
  mv: { u: 'mv مبدأ مقصد', d: 'جابه‌جا یا تغییر نام می‌دهد. (move)' },
  tree: { u: 'tree [مسیر]', d: 'کل درخت پوشه‌ها را مثل شاخه درخت رسم می‌کند.' },
  find: { u: 'find نام [مسیر]', d: 'دنبال فایل یا پوشه‌ای با آن نام می‌گردد.' },
  grep: { u: 'grep الگو فایل', d: 'خط‌های حاوی الگو را پیدا می‌کند. (global regex print)' },
  head: { u: 'head [-n تعداد] فایل', d: 'اول فایل را نشان می‌دهد. پیش‌فرض ۱۰ خط.' },
  tail: { u: 'tail [-n تعداد] فایل', d: 'آخر فایل را نشان می‌دهد. برای لاگ‌ها عالی است.' },
  wc: { u: 'wc فایل', d: 'تعداد خط، کلمه و حرف فایل را می‌شمارد. (word count)' },
  history: { u: 'history', d: 'لیست دستورهایی که زده‌ای. با فلش بالا هم قابل مرور است.' },
  man: { u: 'man دستور', d: 'دفترچه راهنمای هر دستور. هر وقت گم شدی اینجایی.' },
  neofetch: { u: 'neofetch', d: 'مشخصات سیستم + هنر ASCII پنگوئن. سنت همه لینوکسی‌ها!' },
  learn: { u: 'learn [start|status|reset]', d: 'آموزش تعاملی ترمینال با ۱۴ ماموریت و امتیاز. همین را امتحان کن!' },
  ask: { u: 'ask سوال', d: 'از دستیار هوشمند بپرس. به فارسی جواب می‌دهد و دستور پیشنهاد می‌کند.' },
  open: { u: 'open نام‌اپ', d: 'برنامه‌ای را از دل ترمینال باز می‌کند. مثلاً: open snake' },
  wallpaper: { u: 'wallpaper [کلید]', d: 'کاغذدیواری عوض می‌کند. بدون پارامتر، لیست می‌دهد.' },
  ps: { u: 'ps', d: 'پنجره‌های باز = پروسه‌های در حال اجرا. مثل htop ولی بامزه‌تر.' },
  kill: { u: 'kill شمارهPID', d: 'یک پروسه را می‌بندد. اول با ps شماره‌اش را پیدا کن.' },
  sudo: { u: 'sudo دستور', d: 'اجرا با دسترسی مدیر. (superuser do) با پنگوئن‌ها مهربان باش.' },
  apt: { u: 'apt install بسته', d: 'نصب بسته (خیالی). خب یه چیزی که نباشه!' },
  /* ---------- نسخه ۴.۰: متن و فیلتر ---------- */
  sort: { u: 'sort فایل', d: 'خط‌ها را مرتب می‌کند. با پایپ هم کار می‌کند: ls | sort' },
  uniq: { u: 'uniq فایل', d: 'خط‌های تکراری کنار هم را حذف می‌کند. معمولاً بعد از sort می‌آید.' },
  diff: { u: 'diff فایل۱ فایل۲', d: 'تفاوت دو فایل را با < و > نشان می‌دهد.' },
  cut: { u: 'cut -d، -f۲ فایل', d: 'ستون مشخصی از هر خط را با جداکننده برمی‌دارد.' },
  tr: { u: 'tr قدیم جدید', d: 'حرف‌ها را در ورودیِ پایپ جایگزین می‌کند: cat فایل | tr ا ی' },
  sed: { u: 'sed s/قدیم/جدید/ [فایل]', d: 'جایگزینی متن. با پایپ هم کار می‌کند: cat فایل | sed s/سلام/درود/' },
  rev: { u: 'rev فایل', d: 'هر خط را برعکس می‌کند. برای پیام‌های رمزی عالی است!' },
  bc: { u: 'bc عبارت', d: 'ماشین‌حساب ترمینال: bc (2+3)*4' },
  expr: { u: 'expr 2 + 2', d: 'محاسبه سبک قدیمی با فاصله بین عملگرها.' },
  seq: { u: 'seq 1 10', d: 'دنباله عدد چاپ می‌کند.' },
  cal: { u: 'cal [ماه سال]', d: 'تقویم ماه را رسم می‌کند. مثل سال نو، ولی خشک و بی‌مزه.' },
  /* ---------- نسخه ۴.۰: سیستم ---------- */
  chmod: { u: 'chmod +x فایل | chmod 755 فایل', d: 'دسترسی اجرا می‌دهد. بعدش با ./فایل اجرایش کن!' },
  id: { u: 'id', d: 'کاربر و گروه‌های تو با شماره‌های UID/GID.' },
  ln: { u: 'ln -s هدف نام‌پیوند', d: 'یک پیوند نمادین به فایل یا پوشه می‌سازد.' },
  du: { u: 'du [مسیر]', d: 'حجم اشغالی مسیر را تخمین می‌زند.' },
  which: { u: 'which دستور', d: 'می‌گوید دستور کجای سیستم ساکن است — یا alias است.' },
  file: { u: 'file فایل', d: 'نوع واقعی فایل را حدس می‌زند. جادویی ولی خوانا.' },
  stat: { u: 'stat فایل', d: 'مشخصات کامل فایل: نوع، حجم، دسترسی.' },
  less: { u: 'less فایل', d: 'مثل cat ولی با ادعای صفحه‌بندی. اینجا همه‌چیز جا می‌شود.' },
  alias: { u: 'alias اسم="دستور"', d: 'میان‌بر شخصی می‌سازد و برای همیشه یادش می‌ماند. مثال: alias ماهی="echo یومی!"' },
  unalias: { u: 'unalias اسم', d: 'اسم مستعار را فراموش می‌کند.' },
  export: { u: 'export NAME=value', d: 'متغیر محیطی می‌سازد. بعداً با echo $NAME صدایش کن.' },
  top: { u: 'top', d: 'پروسه‌های فعال با مصرف CPU. مثل htop ولی ثابت و بی‌استرس.' },
  jobs: { u: 'jobs', d: 'کارهای معلق در پس‌زمینه.' },
  systemctl: { u: 'systemctl status سرویس', d: 'وضعیت سرویس‌های (خیالی) سیستم را می‌گوید.' },
  journalctl: { u: 'journalctl', d: 'لاگ‌های اخیر هسته را نشان می‌دهد.' },
  crontab: { u: 'crontab', d: 'برنامه زمانی کارها. ما همSchedule داریم!' },
  tar: { u: 'tar czf بسته.tar.gz فایل‌ها', d: 'بسته‌بندی (خیالی). سرعتش بی‌نظیره چون هیچی منتقل نمی‌شود.' },
  zip: { u: 'zip بسته.zip فایل', d: 'زیپ کردن (خیالی).' },
  wget: { u: 'wget آدرس', d: 'دانلود با نوار پیشرفت. فایل‌ها به بُعد خیالی منتقل می‌شوند.' },
  ssh: { u: 'ssh user@host', d: 'اتصال به ماشین دیگر… البته اینجا مرورگریم، ولی تلاش‌مان را می‌کنیم.' },
  ip: { u: 'ip a', d: 'کارت‌های شبکه و آدرس‌ها. آدرس‌مان خیلی بامزه است.' },
  nano: { u: 'nano فایل', d: 'ویرایشگر ساده. اینجا به «نویسا» راهنمایی‌ات می‌کند.' },
  vim: { u: 'vim فایل', d: 'ویرایشگر افسانه‌ای. برای خروج: :q! — موفق باشی.' },
  sleep: { u: 'sleep ثانیه', d: 'مکث. حداکثر ۵ ثانیه، چون بیشترش بی‌ادبیه.' },
  env: { u: 'env', d: 'متغیرهای محیطی فعلی.' },
  ai: { u: 'ai', d: 'اپ «هوش‌یار» را باز می‌کند تا کلید API خودت را وصل کنی.' },
}

const MAN_KEYS = Object.keys(MAN)

/* ------------------------ ماموریت‌ها ------------------------ */

interface Mission {
  id: string
  title: string
  brief: string
  hint: string
  match: RegExp
}

const MISSIONS: Mission[] = [
  { id: 'm1', title: 'کجاییم؟', brief: 'دستور pwd را اجرا کن تا مسیر فعلی را ببینی.', hint: 'فقط بنویس: pwd', match: /^\s*pwd\s*$/ },
  { id: 'm2', title: 'لیست کن', brief: 'با ls ببین توی خانه‌ات چی هست.', hint: 'فقط بنویس: ls', match: /^\s*ls(\s+-[a-zA-Z]+)*\s*$/ },
  { id: 'm3', title: 'با جزئیات', brief: 'حالا ls -la را بزن تا فایل‌های مخفی هم معلوم شوند.', hint: 'فلگ a یعنی all — حتی .secret هم پیدا می‌شود', match: /^\s*ls\s+-[a-zA-Z]+\s*$/ },
  { id: 'm4', title: 'پرواز به عکس‌ها', brief: 'با cd برو داخل پوشه «عکس‌ها».', hint: 'بنویس: cd عکس‌ها', match: /^\s*cd\s+(['"]?)(عکس‌ها|~\/عکس‌ها)\1\s*$/ },
  { id: 'm5', title: 'برگرد خانه', brief: 'با cd .. یک پوشه عقب برگرد.', hint: 'نقطه‌نقطه یعنی پوشه مادر', match: /^\s*cd\s+\.\.\s*$/ },
  { id: 'm6', title: 'کتاب‌خوان', brief: 'محتوای فایل «خوش‌آمد.txt» را با cat بخوان.', hint: 'بنویس: cat خوش‌آمد.txt', match: /^\s*cat\s+(['"]?)خوش‌آمد\.txt\1\s*$/ },
  { id: 'm7', title: 'معمار سیستم', brief: 'یک پوشه به اسم «مزرعه» بساز.', hint: 'mkdir یعنی make directory', match: /^\s*mkdir\s+(['"]?)مزرعه\1\s*$/ },
  { id: 'm8', title: 'تخم‌گذاری', brief: 'داخل مزرعه یک فایل خالی به اسم «مار.txt» بساز.', hint: 'بنویس: touch مزرعه/مار.txt', match: /^\s*touch\s+(['"]?)(~\/)?مزرعه\/مار\.txt\1\s*$/ },
  { id: 'm9', title: 'جادوی ریدایرکت', brief: 'با echo و > کلمه «سلام» را داخل مزرعه/مار.txt بنویس.', hint: 'بنویس: echo سلام > مزرعه/مار.txt', match: /^\s*echo\s+.*>\s*(['"]?)(~\/)?مزرعه\/مار\.txt\1\s*$/ },
  { id: 'm10', title: 'بازخوانی', brief: 'با cat مطمئن شو نوشته‌ات ذخیره شده.', hint: 'بنویس: cat مزرعه/مار.txt', match: /^\s*cat\s+(['"]?)(~\/)?مزرعه\/مار\.txt\1\s*$/ },
  { id: 'm11', title: 'تغییر نام', brief: 'مار.txt را به «مار_کوچولو.txt» تغییر نام بده (با mv).', hint: 'بنویس: mv مزرعه/مار.txt مزرعه/مار_کوچولو.txt', match: /^\s*mv\s+(['"]?)(~\/)?مزرعه\/مار\.txt\1\s+(['"]?)(~\/)?مزرعه\/مار_کوچولو\.txt\3\s*$/ },
  { id: 'm12', title: 'جاروبرقی', brief: 'مار_کوچولو.txt را با rm پاک کن.', hint: 'بنویس: rm مزرعه/مار_کوچولو.txt', match: /^\s*rm\s+(['"]?)(~\/)?مزرعه\/مار_کوچولو\.txt\1\s*$/ },
  { id: 'm13', title: 'جنگل‌نگار', brief: 'کل درخت خانه‌ات را با tree ببین.', hint: 'بنویس: tree', match: /^\s*tree(\s+(~|\/home\/pengo))?\s*$/ },
  { id: 'm14', title: 'مدرک‌خوان', brief: 'راهنمای دستور ls را با man بخوان — همیشه راهنما بخوان!', hint: 'بنویس: man ls', match: /^\s*man\s+ls\s*$/ },
  /* ---------- فصل ۳: جستجو و متن ---------- */
  { id: 'm15', title: 'جستجوگر', brief: 'دنبال هر چیزی که اسمش «راز» است بگرد: find راز', hint: 'بنویس: find راز', match: /^\s*find\s+(['"]?)راز\1\s*$/ },
  { id: 'm16', title: 'شکارچی کلمه', brief: 'توی «رازها.txt» دنبال کلمه «رمز» بگرد: grep رمز رازها.txt', hint: 'grep الگو فایل', match: /^\s*grep\s+(['"]?)رمز\1\s+(['"]?)رازها\.txt\2\s*$/ },
  { id: 'm17', title: 'لوله‌کش', brief: 'اولین پایپ زندگی‌ات: cat رازها.txt | grep رمز', hint: 'خروجی cat می‌رود داخل grep — با |', match: /^\s*cat\s+\S+\s*\|\s*grep\s+\S+\s*$/ },
  { id: 'm18', title: 'شمارنده', brief: 'بنویس: ls | wc — ببین چند چیز در خانه داری.', hint: 'پایپ به wc', match: /^\s*ls(\s+-[a-zA-Z]+)?\s*\|\s*wc\s*$/ },
  { id: 'm19', title: 'مرتب‌ساز', brief: 'برنامه امروزت را مرتب کن: sort برنامه_امروز.txt', hint: 'بنویس: sort برنامه_امروز.txt', match: /^\s*sort\s+(['"]?)برنامه_امروز\.txt\1\s*$/ },
  { id: 'm20', title: 'یکتاساز', brief: 'تکراری‌ها را حذف کن: sort رازها.txt | uniq', hint: 'ترکیب کلاسیک: sort بعد uniq', match: /^\s*sort\s+\S+\s*\|\s*uniq\s*$/ },
  /* ---------- فصل ۴: پوستهٔ حرفه‌ای ---------- */
  { id: 'm21', title: 'میان‌برساز', brief: 'یک اسم مستعار بساز: alias fish="echo یومی!"', hint: 'alias اسم="دستور" — اسم لاتین', match: /^\s*alias\s+\w+\s*=/ },
  { id: 'm22', title: 'متغیرساز', brief: 'متغیر بساز و چاپ کن: export NAME=Pengo بعد echo $NAME', hint: 'اول export، بعد echo $NAME', match: /^\s*echo\s+\$[A-Za-z_]/ },
  { id: 'm23', title: 'کلیدساز', brief: 'به اسکریپت اجازه اجرا بده: chmod +x پروژه‌ها/hello.sh', hint: '+x یعنی executable', match: /^\s*chmod\s+(\+x|[1-7]{3})\s+(['"]?)(~\/)?پروژه‌ها\/hello\.sh\2\s*$/ },
  { id: 'm24', title: 'پروسه‌یاب', brief: 'ببین چه پروسه‌هایی باز است: ps', hint: 'هر پنجره یک پروسه', match: /^\s*ps\s*$/ },
  { id: 'm25', title: 'خوابانندهٔ مهربان', brief: 'یکی از پروسه‌ها را با kill و PIDاش ببند (اول ps بزن).', hint: 'kill شماره', match: /^\s*kill\s+\d+\s*$/ },
  /* ---------- فصل ۵: سیستم و دستیار ---------- */
  { id: 'm26', title: 'نصاب', brief: 'یک بسته بامزه نصب کن: apt install فندق', hint: 'apt install نام', match: /^\s*apt(-get)?\s+install\s+\S+\s*$/ },
  { id: 'm27', title: 'تاریخ‌نگار', brief: 'تاریخچه دستورهایت را ببین: history', hint: 'همه‌چیز ثبت شده...', match: /^\s*history\s*$/ },
  { id: 'm28', title: 'پرسشگر نهایی', brief: 'از دستیار هوشمند بپرس: ask بهترین دستور لینوکس چیست؟', hint: 'ask سوال', match: /^\s*ask\s+.+\s*$/ },
]

const LEVELS: [number, string][] = [
  [0, 'کارآموز پنگوئن'],
  [40, 'گشت‌گذر ترمینال'],
  [80, 'شکارچی مسیرها'],
  [120, 'افسر شل'],
  [160, 'سردار پایپ'],
  [200, 'استاد ترمینال'],
  [240, 'افسانهٔ ترمینال'],
]

const levelOf = (xp: number): string => {
  let name = LEVELS[0][1]
  for (const [thr, n] of LEVELS) if (xp >= thr) name = n
  return name
}

/* فصل‌های دورهٔ آموزش ترمینال */
const CHAPTERS: { title: string; ids: string[] }[] = [
  { title: 'فصل ۱ — قدم‌های اول', ids: ['m1', 'm2', 'm3', 'm4', 'm5'] },
  {
    title: 'فصل ۲ — فایل‌بازی',
    ids: ['m6', 'm7', 'm8', 'm9', 'm10', 'm11', 'm12', 'm13', 'm14'],
  },
  {
    title: 'فصل ۳ — جستجو و متن',
    ids: ['m15', 'm16', 'm17', 'm18', 'm19', 'm20'],
  },
  {
    title: 'فصل ۴ — پوستهٔ حرفه‌ای',
    ids: ['m21', 'm22', 'm23', 'm24', 'm25'],
  },
  {
    title: 'فصل ۵ — سیستم و دستیار',
    ids: ['m26', 'm27', 'm28'],
  },
]

interface TutorState {
  xp: number
  done: string[]
  active: string | null
}

const loadTutor = (): TutorState => {
  try {
    const raw = localStorage.getItem('pengo-tutor-v1')
    if (raw) return JSON.parse(raw) as TutorState
  } catch {
    /* ignore */
  }
  return { xp: 0, done: [], active: null }
}

const saveTutor = (t: TutorState) => {
  try {
    localStorage.setItem('pengo-tutor-v1', JSON.stringify(t))
  } catch {
    /* ignore */
  }
}

/* ------------------ تاریخچه و نقشه اصلاح ------------------ */

const loadHistory = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem('pengo-sh-history') ?? '[]') as string[]
  } catch {
    return []
  }
}

const saveHistory = (h: string[]) => {
  try {
    localStorage.setItem('pengo-sh-history', JSON.stringify(h.slice(0, 60)))
  } catch {
    /* ignore */
  }
}

const loadFixMap = (): Record<string, string> => {
  try {
    return JSON.parse(localStorage.getItem('pengo-fixmap-v1') ?? '{}') as Record<string, string>
  } catch {
    return {}
  }
}

const saveFixMap = (m: Record<string, string>) => {
  try {
    localStorage.setItem('pengo-fixmap-v1', JSON.stringify(m))
  } catch {
    /* ignore */
  }
}

const loadMap = (key: string): Record<string, string> => {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '{}') as Record<string, string>
  } catch {
    return {}
  }
}

const saveMap = (key: string, m: Record<string, string>) => {
  try {
    localStorage.setItem(key, JSON.stringify(m))
  } catch {
    /* ignore */
  }
}

const ENV_DEFAULTS: Record<string, string> = {
  USER: 'pengo',
  HOME: '/home/pengo',
  SHELL: '/bin/pengo-sh',
  MOOD: 'happy',
  AUTOCORRECT: 'enabled',
  SPONSOR: 'sunjob.ir',
}

/* حالت پایپ — وقتی silent است خروجی به‌جای صفحه در بافر می‌رود */
const PIPE: { stdin: string[] | null; out: string[]; silent: boolean } = {
  stdin: null,
  out: [],
  silent: false,
}

/* چیپ‌های دستور سریع زیر خروجی */
const QUICK_CMDS: { cmd: string; label: string }[] = [
  { cmd: 'learn start', label: 'درس بعدی' },
  { cmd: 'ls -la', label: 'لیست کامل' },
  { cmd: 'tree', label: 'درخت' },
  { cmd: 'cat خوش‌آمد.txt', label: 'بخوان' },
  { cmd: 'cat رازها.txt | grep رمز', label: 'پایپ!' },
  { cmd: 'ls | wc', label: 'بشمار' },
  { cmd: 'export NAME=Pengo', label: 'متغیر' },
  { cmd: 'echo $NAME', label: 'چاپش' },
  { cmd: 'chmod +x پروژه‌ها/hello.sh', label: 'اجراکی' },
  { cmd: 'cal', label: 'تقویم' },
  { cmd: 'neofetch', label: 'مشخصات' },
  { cmd: 'ai', label: 'هوش‌یار' },
]

/* ---------------------- فاصله لاونشتاین ---------------------- */

function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      )
    }
    prev = cur
  }
  return prev[b.length]
}

const ALL_COMMANDS = [
  ...MAN_KEYS,
  'help', 'clear', 'exit', 'uptime', 'df', 'free', 'env', 'whoami', 'date',
  'uname', 'hostname', 'apps', 'cowsay', 'fortune', 'banner', 'matrix', 'sl',
  'coffee', 'tux', 'ping', 'curl', 'lock', 'quit', 'dir', 'll', 'la', 'cls',
]

function didYouMean(input: string, extra: string[] = []): string | null {
  const pool = [...new Set([...ALL_COMMANDS, ...extra])]
  let best: string | null = null
  let bestD = Infinity
  for (const c of pool) {
    const d = levenshtein(input, c)
    if (d < bestD) {
      bestD = d
      best = c
    }
  }
  if (!best || bestD === 0) return null
  const maxD = input.length <= 3 ? 1 : Math.max(1, Math.floor(input.length / 3))
  return bestD <= maxD ? best : null
}

function nearestName(target: string, names: string[]): string | null {
  let best: string | null = null
  let bestD = Infinity
  for (const n of names) {
    const d = levenshtein(target, n)
    if (d < bestD) {
      bestD = d
      best = n
    }
  }
  return best && bestD <= 2 ? best : null
}

/* --------------------------- بنر --------------------------- */

const BANNER_FONT: Record<string, string[]> = {
  A: [' ### ', '#   #', '#####', '#   #', '#   #'],
  B: ['#### ', '#   #', '#### ', '#   #', '#### '],
  C: [' ### ', '#   #', '#    ', '#   #', ' ### '],
  D: ['#### ', '#   #', '#   #', '#   #', '#### '],
  E: ['#####', '#    ', '#### ', '#    ', '#####'],
  F: ['#####', '#    ', '#### ', '#    ', '#    '],
  G: [' ### ', '#    ', '#  ##', '#   #', ' ### '],
  H: ['#   #', '#   #', '#####', '#   #', '#   #'],
  I: ['#####', '  #  ', '  #  ', '  #  ', '#####'],
  J: ['#####', '   # ', '   # ', '#  # ', ' ##  '],
  K: ['#   #', '#  # ', '###  ', '#  # ', '#   #'],
  L: ['#    ', '#    ', '#    ', '#    ', '#####'],
  M: ['#   #', '## ##', '# # #', '#   #', '#   #'],
  N: ['#   #', '##  #', '# # #', '#  ##', '#   #'],
  O: [' ### ', '#   #', '#   #', '#   #', ' ### '],
  P: ['#### ', '#   #', '#### ', '#    ', '#    '],
  Q: [' ### ', '#   #', '# # #', '#  # ', ' ## #'],
  R: ['#### ', '#   #', '#### ', '#  # ', '#   #'],
  S: [' ####', '#    ', ' ### ', '    #', '#### '],
  T: ['#####', '  #  ', '  #  ', '  #  ', '  #  '],
  U: ['#   #', '#   #', '#   #', '#   #', ' ### '],
  V: ['#   #', '#   #', '#   #', ' # # ', '  #  '],
  W: ['#   #', '#   #', '# # #', '## ##', '#   #'],
  X: ['#   #', ' # # ', '  #  ', ' # # ', '#   #'],
  Y: ['#   #', ' # # ', '  #  ', '  #  ', '  #  '],
  Z: ['#####', '   # ', '  #  ', ' #   ', '#####'],
  '0': [' ### ', '#  ##', '# # #', '##  #', ' ### '],
  '1': ['  #  ', ' ##  ', '  #  ', '  #  ', '#####'],
  '2': [' ### ', '#   #', '  ## ', ' #   ', '#####'],
  '3': ['#### ', '    #', ' ### ', '    #', '#### '],
  '4': ['#  # ', '#  # ', '#####', '   # ', '   # '],
  '5': ['#####', '#    ', '#### ', '    #', '#### '],
  '6': [' ### ', '#    ', '#### ', '#   #', ' ### '],
  '7': ['#####', '    #', '   # ', '  #  ', '  #  '],
  '8': [' ### ', '#   #', ' ### ', '#   #', ' ### '],
  '9': [' ### ', '#   #', ' ####', '    #', ' ### '],
  ' ': ['     ', '     ', '     ', '     ', '     '],
}

function banner(text: string): string {
  const chars = text.toUpperCase().slice(0, 12).split('')
  const rows = ['', '', '', '', '']
  for (const ch of chars) {
    const glyph = BANNER_FONT[ch] ?? BANNER_FONT[' ']
    for (let r = 0; r < 5; r++) rows[r] += glyph[r] + ' '
  }
  return rows.join('\n')
}

/* --------------------------- تقویم --------------------------- */

function calGrid(month?: number, year?: number): string {
  const now = new Date()
  const m = month && month >= 1 && month <= 12 ? month - 1 : now.getMonth()
  const y = year && year > 1900 ? year : now.getFullYear()
  const first = new Date(y, m, 1)
  const days = new Date(y, m + 1, 0).getDate()
  const names = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
  ]
  const head = `${names[m] ?? 'MONTH'} ${y}`
  const lines: string[] = [
    head.padStart(Math.floor((20 + head.length) / 2)).padEnd(20),
    'Su Mo Tu We Th Fr Sa',
  ]
  let row = '   '.repeat(first.getDay())
  for (let d = 1; d <= days; d++) {
    row += String(d).padStart(2) + ' '
    if ((first.getDay() + d) % 7 === 0) {
      lines.push(row.trimEnd())
      row = ''
    }
  }
  if (row.trim()) lines.push(row.trimEnd())
  return lines.join('\n')
}

/* --------------------------- هنر --------------------------- */

const TUX_ART = String.raw`
   .--.
  |o_o |
  |:_/ |
 //   \ \
(|     | )
/'\_   _/'\
\___)=(___/
`

const SQUIRREL_ART = String.raw`
   (\_/)
  ( •ᴥ• )
  / >🥜   سنجابکِ سان‌جابی
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

const TRAIN_ART = String.raw`
      ~ ooO ~
        O
   _____________
  |#############|
  | پنگوئن‌اکسپرس |
  |#############|
   (@)===(@)===(@)
  چو چو! از کجا اومدی؟!
`

/* --------------------------- استور --------------------------- */

const ALIASES: Record<string, string> = {
  ll: 'ls -la',
  la: 'ls -a',
  dir: 'ls',
  cls: 'clear',
  '?': 'help',
}

const pidOf = (id: string): number => {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  return 1000 + (Math.abs(h) % 9000)
}

interface PendingFix {
  from: string
  fixed: string
}

export default function TerminalApp() {
  const [lines, setLines] = useState<Line[]>(() => [
    mkLine('sys', 'پنگوئن‌شل ۴.۰ — حالا با پایپ | ، زنجیره && و ; ، متغیرها و ۲۸ ماموریت!'),
    mkLine('dim', 'شروع: learn start  |  سوالی؟: ask سوال  |  راهنما: help'),
    mkLine('dim', 'غلط تایپی بزنی اصلاحش می‌کنم. امتحان کن: lss — و Ctrl+R برای جستجو در تاریخچه'),
  ])
  const [cwd, setCwd] = useState<string>(HOME)
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>(() => loadHistory())
  const [histIdx, setHistIdx] = useState(-1)
  const [pendingFix, setPendingFix] = useState<PendingFix | null>(null)
  const [matrix, setMatrix] = useState(false)
  const [busy, setBusy] = useState(false)
  const [tutor, setTutor] = useState<TutorState>(() =>
    typeof window === 'undefined' ? { xp: 0, done: [], active: null } : loadTutor()
  )
  const fixMapRef = useRef<Record<string, string>>(loadFixMap())
  const aliasRef = useRef<Record<string, string>>({
    ...ALIASES,
    ...loadMap('pengo-alias-v1'),
  })
  const envRef = useRef<Record<string, string>>({
    ...ENV_DEFAULTS,
    ...loadMap('pengo-env-v1'),
  })
  const [revSearch, setRevSearch] = useState<string | null>(null)
  const [showChips, setShowChips] = useState(false)
  const tutorRef = useRef<TutorState>(tutor)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    tutorRef.current = tutor
  }, [tutor])

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [lines, pendingFix])

  const push = useCallback((type: LineType, text: string) => {
    if (PIPE.silent) {
      PIPE.out.push(...text.split('\n'))
      return
    }
    setLines((ls) => [...ls, mkLine(type, text)])
  }, [])

  const pushMany = useCallback((type: LineType, text: string) => {
    if (PIPE.silent) {
      PIPE.out.push(...text.split('\n'))
      return
    }
    setLines((ls) => [...ls, ...text.split('\n').map((t) => mkLine(type, t))])
  }, [])

  /* توسعهٔ متغیرهای محیطی: $NAME */
  const expandEnv = (s: string): string =>
    s.replace(/\$([A-Za-z_]\w*)/g, (_all, n: string) => envRef.current[n] ?? '')

  /* جستجوی معکوس تاریخچه (Ctrl+R) */
  const revMatch = useMemo<string | null>(() => {
    if (revSearch === null) return null
    const q = revSearch.toLowerCase()
    return history.find((h) => h.toLowerCase().includes(q)) ?? null
  }, [revSearch, history])

  /* ----------------------- ماتریکس ----------------------- */
  useEffect(() => {
    if (!matrix) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    // اندازه از والد گرفته می‌شود چون offsetWidth هنگام mount صفر است
    const box = canvas.parentElement
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    const w = (canvas.width = Math.max(320, box?.clientWidth ?? 0))
    const h = (canvas.height = Math.max(240, box?.clientHeight ?? 0))
    const chars = 'アイウエオカキクケコサシスセソ01پنگوين'
    const drops = Array.from({ length: Math.floor(w / 16) }, () =>
      Math.floor(Math.random() * (h / 16))
    )
    const iv = setInterval(() => {
      ctx.fillStyle = 'rgba(0,0,0,0.09)'
      ctx.fillRect(0, 0, w, h)
      ctx.font = '13px monospace'
      for (let i = 0; i < drops.length; i++) {
        const ch = chars[Math.floor(Math.random() * chars.length)]
        ctx.fillStyle = Math.random() < 0.08 ? '#d9f99d' : '#22c55e'
        ctx.fillText(ch, i * 16, drops[i] * 16)
        if (drops[i] * 16 > h && Math.random() > 0.975) drops[i] = 0
        drops[i]++
      }
    }, 50)
    const stop = (e: Event) => {
      e.preventDefault()
      setMatrix(false)
      push('sys', 'از ماتریکس خارج شدی. قرمز یا سبز؟ سبز که واضح است.')
    }
    canvas.addEventListener('click', stop)
    window.addEventListener('keydown', stop)
    return () => {
      clearInterval(iv)
      canvas.removeEventListener('click', stop)
      window.removeEventListener('keydown', stop)
    }
  }, [matrix, push])

  /* --------------------- پیشنهاد تایپی --------------------- */
  const suggestion = useMemo<string | null>(() => {
    if (!input || input.includes(' ')) return null
    const fix = fixMapRef.current[input]
    if (fix && fix !== input && fix.startsWith(input)) return fix
    if (ALL_COMMANDS.includes(input)) return null
    const byCmd = ALL_COMMANDS.filter((c) => c.startsWith(input)).sort(
      (a, b) => a.length - b.length
    )[0]
    const byHist = history.find((h) => h.startsWith(input) && h !== input)
    if (byCmd && (!byHist || byCmd.length <= byHist.length)) return byCmd
    return byHist ?? null
  }, [input, history])

  // غلطِ تکراری که قبلاً اصلاح شده — فوراً نوار پیشنهاد را نشان بده
  const exactFix = useMemo<PendingFix | null>(() => {
    const t = input.trim()
    if (!t || t.includes(' ') || ALL_COMMANDS.includes(t)) return null
    const fix = fixMapRef.current[t]
    return fix && fix !== t ? { from: t, fixed: fix } : null
  }, [input])
  const activeFix = pendingFix ?? exactFix

  const rememberFix = (from: string, to: string) => {
    fixMapRef.current[from] = to
    saveFixMap(fixMapRef.current)
  }

  const closeSelf = () => {
    const st = useOS.getState()
    const win = st.windows.find((w) => w.appId === 'terminal')
    if (win) st.closeWindow(win.id)
  }

  const commitHistory = (cmd: string) => {
    setHistory((h) => {
      const nh = [cmd, ...h].slice(0, 60)
      saveHistory(nh)
      return nh
    })
    setHistIdx(-1)
  }

  /* ------------------- ماموریت‌سنج ------------------- */
  const checkMission = (raw: string) => {
    const t = tutorRef.current
    if (!t.active) return
    const m = MISSIONS.find((x) => x.id === t.active)
    if (!m) return
    if (!m.match.test(raw)) return
    const done = [...t.done, m.id]
    const xp = t.xp + 10
    const next = MISSIONS.find((x) => !done.includes(x.id))
    const nt: TutorState = { xp, done, active: next ? next.id : null }
    setTutor(nt)
    saveTutor(nt)
    push('ok', `ماموریت «${m.title}» کامل شد. +۱۰ امتیاز (${done.length}/${MISSIONS.length})`)
    if (!next) {
      pushMany(
        'sys',
        banner('TUX MASTER')
      )
      push(
        'ok',
        'آفرین استاد! هر ۲۸ ماموریت را کامل کردی. از این به بعد ترمینال، خانه دومت است.'
      )
      useOS.getState().pushToast({
        icon: GraduationCap,
        title: 'استاد ترمینال شدی!',
        body: 'هر ۲۸ ماموریت کامل شد. هسته به تو افتخار می‌کند.',
      })
    } else {
      push('dim', `ماموریت بعدی: «${next.title}» — ${next.brief}`)
    }
  }

  /* ------------------- موتور دستورات ------------------- */

  /** خط‌های ورودی را از فایل یا پایپ می‌خواند */
  const readInputLines = (
    fileArg: string | undefined
  ): { lines: string[]; label: string } | null => {
    if (fileArg) {
      const node = getNode(useFs.getState().fs, normalizePath(cwd, fileArg))
      if (!node || node.type !== 'file') {
        push('err', `فایل «${fileArg}» پیدا نشد`)
        return null
      }
      return { lines: node.content.split('\n'), label: fileArg }
    }
    if (PIPE.stdin) return { lines: PIPE.stdin, label: '(پایپ)' }
    push('err', 'ورودی ندارم! یا اسم فایل بده یا با پایپ بفرست: cat فایل | دستور')
    return null
  }

  /** اجرای زنجیرهٔ پایپ: خروجی هر حلقه ورودی بعدی می‌شود */
  const runPipeline = (raw: string) => {
    const segs = raw
      .split('|')
      .map((s) => s.trim())
      .filter(Boolean)
    if (segs.length < 2) {
      push('err', 'پایپ ناقص — بین دو دستور | بگذار: ls | wc')
      return
    }
    let stdin: string[] | null = null
    for (let i = 0; i < segs.length; i++) {
      PIPE.stdin = stdin
      PIPE.silent = i < segs.length - 1
      PIPE.out = []
      execute(segs[i], true)
      stdin = PIPE.out.slice()
    }
    PIPE.silent = false
    PIPE.stdin = null
    PIPE.out = []
  }

  const execute = (rawInput: string, nested = false) => {
    const raw = rawInput.trim()
    if (!raw) return
    if (!nested) {
      setPendingFix(null)
      commitHistory(raw)

      // prompt echo
      setLines((ls) => [...ls, mkLine('in', raw)])

      // زنجیرهٔ پایپ
      if (raw.includes('|')) {
        runPipeline(raw)
        checkMission(raw)
        return
      }
      // زنجیرهٔ && و ;
      if (raw.includes('&&') || raw.includes(';')) {
        raw
          .split(/&&|;/)
          .map((p) => p.trim())
          .filter(Boolean)
          .forEach((p) => execute(p, true))
        checkMission(raw)
        return
      }
    }

    const fs = useFs.getState()
    const os = useOS.getState()

    // alias
    const firstWord = raw.split(/\s+/)[0]
    const aliased = aliasRef.current[firstWord]
    const cmdline = aliased ? aliased + raw.slice(firstWord.length) : raw

    const parts = cmdline.split(/\s+/)
    let base = parts[0].toLowerCase()
    const args = parts.slice(1)
    const argStr = args.join(' ')

    // اسکریپت اجرا شدنی
    if (base.startsWith('./')) {
      const p = normalizePath(cwd, base.slice(2))
      const node = getNode(fs.fs, p)
      if (!node) push('err', `چنین فایلی نیست: ${base}`)
      else if (node.type === 'file' && node.kind === 'exe')
        pushMany('out', node.content.replace(/^#!.*\n/, ''))
      else push('err', 'این فایل قابل اجرا نیست. (فقط فایل‌های exe اجرا می‌شوند)')
      checkMission(raw)
      return
    }

    // echo با ریدایرکت و توسعهٔ متغیرها
    if (base === 'echo') {
      const gtIdx = args.findIndex((a) => a === '>' || a === '>>')
      if (gtIdx === -1) {
        push('out', expandEnv(argStr.replace(/^["']|["']$/g, '')))
      } else {
        const text = expandEnv(
          args.slice(0, gtIdx).join(' ').replace(/^["']|["']$/g, '')
        )
        const target = normalizePath(cwd, args[gtIdx + 1] ?? '')
        const append = args[gtIdx] === '>>'
        if (!target || target === '/') {
          push('err', 'مسیر مقصد نامعتبر است')
        } else {
          const ok = fs.writeFile(target, (append ? '' : '') + text + '\n', append)
          if (ok) push('ok', `نوشته شد در ${prettyPath(target)} ${append ? '(اضافه شد)' : ''}`)
          else push('err', 'نشد بنویسم — پوشه مقصد وجود دارد؟')
        }
      }
      checkMission(raw)
      return
    }

    switch (base) {
      /* ---------------- آموزش ---------------- */
      case 'help': {
        push('sys', 'دستورها — با «man دستور» جزئیات بگیر:')
        const groups: [string, string[]][] = [
          ['آموزش', ['learn', 'ask', 'ai', 'man', 'help']],
          ['فایل‌ها', ['ls', 'cd', 'pwd', 'cat', 'mkdir', 'touch', 'echo', 'rm', 'cp', 'mv', 'tree', 'find', 'ln', 'du', 'stat', 'file']],
          ['متن و فیلتر', ['grep', 'sort', 'uniq', 'diff', 'cut', 'tr', 'sed', 'rev', 'wc', 'head', 'tail', 'bc', 'expr', 'seq', 'cal']],
          ['سیستم', ['chmod', 'id', 'whoami', 'uname', 'date', 'uptime', 'ps', 'top', 'kill', 'jobs', 'df', 'free', 'env', 'export', 'alias', 'unalias', 'which', 'systemctl', 'journalctl', 'crontab', 'history', 'clear', 'exit']],
          ['سرگرمی', ['neofetch', 'cowsay', 'fortune', 'banner', 'matrix', 'sl', 'coffee', 'tux', 'sunjob', 'python', 'ping', 'curl', 'wget', 'ssh', 'ip', 'tar', 'zip', 'nano', 'vim', 'sleep', 'less', 'wallpaper', 'lock']],
          ['گراف', ['open', 'apps', 'sudo', 'apt']],
        ]
        for (const [g, cmds] of groups) {
          push('dim', `— ${g}:`)
          push('out', '  ' + cmds.map((c) => (MAN[c] ? c : c)).join('  '))
        }
        push('dim', 'پایپ | و زنجیره && و ; هم کار می‌کنند! مثال: cat رازها.txt | grep رمز')
        push('dim', 'نکته: Tab تکمیل می‌کند، فلش بالا تاریخچه، Ctrl+R جستجو، Ctrl+L پاک می‌کند.')
        break
      }
      case 'learn': {
        const sub = args[0] ?? 'status'
        if (sub === 'start' || sub === 'status' || sub === '') {
          const next = MISSIONS.find((m) => !tutor.done.includes(m.id))
          if (!next) {
            push('ok', 'همه ماموریت‌ها را کامل کرده‌ای استاد! با learn reset از نو شروع کن.')
          } else {
            const nt: TutorState = { ...tutor, active: next.id }
            setTutor(nt)
            saveTutor(nt)
            push('sys', `ماموریت ${tutor.done.length + 1} از ${MISSIONS.length}: «${next.title}»`)
            push('out', next.brief)
            push('dim', `راهنما: ${next.hint}`)
          }
          if (sub === 'status' || sub === '')
            push(
              'dim',
              `امتیاز: ${tutor.xp} — سطح: ${levelOf(tutor.xp)}`
            )
        } else if (sub === 'list') {
          push('sys', `نقشهٔ ماموریت‌ها — ${tutor.done.length}/${MISSIONS.length} کامل شده:`)
          for (const ch of CHAPTERS) {
            push('warn', `📚 ${ch.title}`)
            for (const id of ch.ids) {
              const m = MISSIONS.find((x) => x.id === id)
              if (!m) continue
              const ok = tutor.done.includes(id)
              push(ok ? 'ok' : 'dim', `  ${ok ? '✔' : '▫'} ${m.title} — ${m.brief}`)
            }
          }
        } else if (sub === 'reset') {
          const nt: TutorState = { xp: 0, done: [], active: null }
          setTutor(nt)
          saveTutor(nt)
          push('warn', 'پیشرفت آموزش ریست شد. دوباره از m1 شروع کن: learn start')
        } else {
          push('err', 'کاربردها: learn start | learn list | learn status | learn reset')
        }
        break
      }
      case 'man': {
        const topic = args[0]
        if (!topic) {
          push('out', 'برای کدام دستور؟ ' + MAN_KEYS.join(' '))
        } else if (MAN[topic]) {
          push('sys', `${topic.toUpperCase()}(1)`)
          push('out', `نام: ${topic}`)
          push('out', `کاربرد: ${MAN[topic].u}`)
          push('out', `توضیح: ${MAN[topic].d}`)
        } else {
          const m = didYouMean(topic, MAN_KEYS)
          push('err', `راهنمایی برای «${topic}» نداریم.`)
          if (m) push('dim', `شاید منظورت «${m}» بود؟`)
        }
        break
      }
      case 'ask': {
        const q = argStr.trim()
        if (!q) {
          push('err', 'بگو چی بپرسم! مثال: ask چطور فایل بسازم؟')
          break
        }
        setBusy(true)
        push('dim', 'پنگوئن‌بات دارد فکر می‌کند…')
        // نسخه محلی: با کلید هوش مصنوعی خود کاربر (وقتی سرور در دسترس نیست)
        const localBrain = async (): Promise<void> => {
          const cfg = loadAICfg()
          if (!cfg) {
            push('err', 'سرور مغز در دسترس نیست و تو هم کلید هوش‌یار نداری.')
            push('dim', 'دو راه: بعداً دوباره بپرس، یا در اپ «هوش‌یار» کلید API خودت را وصل کن (open ai).')
            return
          }
          try {
            const answer = await aiComplete(
              [
                {
                  role: 'system',
                  content:
                    'تو پنگوئن‌بات هستی، دستیار آموزش ترمینال در سیستم‌عامل بامزه سان‌جاب‌او‌اس. فارسی، صمیمی و کوتاه (حداکثر ۹۰ کلمه) جواب بده؛ دستورها را در خط جدا با مثال بده و فقط دستورهای ساده لینوکس را آموزش بده. خانه کاربر /home/pengo است و پوشه‌های عکس‌ها، سندها، موسیقی و پروژه‌ها دارد. بدون ایموجی.',
                },
                { role: 'user', content: q },
              ],
              cfg
            )
            pushMany('out', answer.trim())
            push('dim', '(با کلید هوش مصنوعی خودت جواب گرفتی — چه حرفه‌ای!)')
          } catch (e) {
            push('err', e instanceof Error ? e.message : 'کلید هوش‌یار جواب نداد')
          }
        }
        fetch('/api/tutor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: q }),
        })
          .then(async (r) => {
            if (!r.ok) throw new Error('bad')
            const data = (await r.json()) as { answer?: string }
            if (!data.answer) throw new Error('empty')
            pushMany('out', data.answer.trim())
          })
          .catch(() => localBrain())
          .finally(() => setBusy(false))
        break
      }

      /* ---------------- فایل‌ها ---------------- */
      case 'pwd':
        push('out', cwd)
        break
      case 'ls': {
        const flags = args.filter((a) => a.startsWith('-')).join('')
        const rest = args.filter((a) => !a.startsWith('-'))
        const showAll = flags.includes('a')
        const long = flags.includes('l')
        const targetPath = rest[0] ? normalizePath(cwd, rest[0]) : cwd
        const node = getNode(fs.fs, targetPath)
        if (!node) {
          push('err', `ls: به «${rest[0]}» نمی‌رسم — چنین مسیری نیست`)
          const parent = getNode(fs.fs, parentOf(targetPath))
          if (parent && parent.type === 'dir') {
            const near = nearestName(baseName(targetPath), Object.keys(parent.children))
            if (near) push('dim', `نزدیک‌ترین: «${near}» — شاید غلط تایپی بود؟`)
          }
          break
        }
        if (node.type === 'file') {
          push('out', baseName(targetPath))
          break
        }
        const entries = Object.entries((node as FsDir).children)
          .filter(([name]) => showAll || !name.startsWith('.'))
          .sort(([a], [b]) =>
            ((node as FsDir).children[a].type === 'dir' ? 0 : 1) -
              ((node as FsDir).children[b].type === 'dir' ? 0 : 1) ||
            a.localeCompare(b)
          )
        if (entries.length === 0) {
          push('dim', '(خالی — مثل وعده‌های عید)')
          break
        }
        if (long) {
          push('out', `مجموع ${entries.length}`)
          for (const [name, n] of entries) {
            const isDir = n.type === 'dir'
            const kind = n.type === 'file' ? n.kind : '-'
            const size = isDir
              ? '4.0K'
              : `${Math.max(1, Math.round((n.content.length || 8) / 102.4) / 10)}K`
            push(
              'out',
              `${isDir ? 'd' : '-'}rw-r--r--  pengo pengo  ${size.padStart(5)}  ${isDir ? name + '/' : name}${kind === 'exe' ? ' *' : ''}`
            )
          }
        } else {
          for (const [name, n] of entries) {
            if (n.type === 'dir') push('ok', name + '/')
            else push('out', name)
          }
        }
        break
      }
      case 'cd': {
        const target = args[0] ? normalizePath(cwd, args[0]) : HOME
        const node = getNode(fs.fs, target)
        if (target === cwd) break
        if (!node) {
          push('err', `cd: چنین پوشه‌ای نیست: ${args[0]}`)
          const parent = getNode(fs.fs, parentOf(target))
          if (parent && parent.type === 'dir') {
            const near = nearestName(baseName(target), Object.keys(parent.children))
            if (near) push('dim', `نزدیک‌ترین: «${near}»`)
          }
          break
        }
        if (node.type !== 'dir') {
          push('err', '«' + baseName(target) + '» فایل است نه پوشه!')
          break
        }
        setCwd(target)
        break
      }
      case 'cat': {
        if (!args.length) {
          push('err', 'باید اسم فایل بدهی: cat خوش‌آمد.txt')
          break
        }
        for (const a of args) {
          const p = normalizePath(cwd, a)
          const node = getNode(fs.fs, p)
          if (!node) {
            push('err', `cat: «${a}» پیدا نشد`)
            const parent = getNode(fs.fs, parentOf(p))
            if (parent && parent.type === 'dir') {
              const near = nearestName(baseName(p), Object.keys(parent.children))
              if (near) push('dim', `نزدیک‌ترین: «${near}»`)
            }
            continue
          }
          if (node.type === 'dir') {
            push('err', `«${a}» پوشه است؛ با cd برو توش`)
            continue
          }
          if (node.kind === 'img') {
            push('out', `[عکس: ${baseName(p)}]`)
            push('dim', 'ترمینال عکس نشان نمی‌دهد — با «open photos» ببینش!')
            continue
          }
          if (node.kind === 'audio') {
            push('out', node.content)
            push('dim', 'با «open music» پخشش کن')
            continue
          }
          pushMany('out', node.content)
        }
        break
      }
      case 'mkdir': {
        if (!args[0]) {
          push('err', 'اسم پوشه را بگو: mkdir پروژه')
          break
        }
        const p = normalizePath(cwd, args[0])
        if (getNode(fs.fs, p)) {
          push('err', '«' + baseName(p) + '» از قبل هست!')
          break
        }
        if (fs.mkdir(p)) push('ok', `پوشه «${baseName(p)}» ساخته شد`)
        else push('err', 'ساخته نشد — مسیر والد موجود است؟')
        break
      }
      case 'touch': {
        if (!args[0]) {
          push('err', 'اسم فایل را بگو: touch گزارش.txt')
          break
        }
        for (const a of args) {
          const p = normalizePath(cwd, a)
          const existing = getNode(fs.fs, p)
          if (existing) {
            push('dim', `«${baseName(p)}» از قبل بود؛ تاریخش تازه شد`)
            continue
          }
          if (fs.writeFile(p, '')) push('ok', `فایل «${baseName(p)}» ساخته شد`)
          else push('err', `«${a}» ساخته نشد — پوشه مقصد هست؟`)
        }
        break
      }
      case 'rm': {
        const rec = args.includes('-r') || args.includes('-rf')
        const targets = args.filter((a) => !a.startsWith('-'))
        if (!targets.length) {
          push('err', 'چه چیزی را پاک کنم؟ (rm فایل)')
          break
        }
        for (const a of targets) {
          const p = normalizePath(cwd, a)
          const node = getNode(fs.fs, p)
          if (!node) {
            push('err', `rm: «${a}» که اصلاً نیست`)
            continue
          }
          if (node.type === 'dir' && !rec) {
            push('err', '«' + baseName(p) + '» پوشه است — با rm -r پاکش کن')
            continue
          }
          if (fs.remove(p)) push('ok', `«${baseName(p)}» به خانه گربه‌ها فرستاده شد`)
          else push('err', 'پاک نشد (شاید مسیر محافظت‌شده است)')
        }
        break
      }
      case 'cp':
      case 'mv': {
        if (args.length < 2) {
          push('err', `کاربرد: ${base} مبدأ مقصد`)
          break
        }
        const src = normalizePath(cwd, args[0])
        let dst = normalizePath(cwd, args[1])
        const srcNode = getNode(fs.fs, src)
        if (!srcNode) {
          push('err', `مبدأ «${args[0]}» پیدا نشد`)
          break
        }
        const dstNode = getNode(fs.fs, dst)
        if (dstNode && dstNode.type === 'dir')
          dst = normalizePath(dst, baseName(src))
        const ok = base === 'cp' ? fs.copy(src, dst) : fs.move(src, dst)
        if (ok)
          push('ok', `${base === 'cp' ? 'کپی' : 'جابه‌جا'} شد: ${baseName(src)} ← ${prettyPath(dst)}`)
        else push('err', 'انجام نشد — مقصد معتبر است؟')
        break
      }
      case 'tree': {
        const root = args[0] ? normalizePath(cwd, args[0]) : cwd
        const node = getNode(fs.fs, root)
        if (!node || node.type !== 'dir') {
          push('err', 'پوشه‌ای برای رسم نیست')
          break
        }
        let dirs = 0
        let files = 0
        const walk = (nd: FsDir, prefix: string, depth: number) => {
          const entries = Object.entries(nd.children).sort(([a], [b]) =>
            a.localeCompare(b)
          )
          entries.forEach(([name, child], i) => {
            const last = i === entries.length - 1
            const branch = last ? '└── ' : '├── '
            if (child.type === 'dir') {
              dirs++
              push('ok', `${prefix}${branch}${name}/`)
              if (depth < 5) walk(child, prefix + (last ? '    ' : '│   '), depth + 1)
            } else {
              files++
              push('out', `${prefix}${branch}${name}`)
            }
          })
        }
        push('sys', prettyPath(root))
        walk(node as FsDir, '', 0)
        push('dim', `${dirs} پوشه، ${files} فایل`)
        break
      }
      case 'find': {
        const needle = (args[0] ?? '').toLowerCase()
        const root = args[1] ? normalizePath(cwd, args[1]) : cwd
        if (!needle) {
          push('err', 'دنبال چی می‌گردی؟ find نام [مسیر]')
          break
        }
        const found: string[] = []
        const walk = (nd: FsNode, path: string) => {
          if (nd.type === 'dir') {
            for (const [name, child] of Object.entries(nd.children)) {
              if (name.toLowerCase().includes(needle)) found.push(`${path}/${name}`)
              walk(child, `${path}/${name}`)
            }
          }
        }
        const startNode = getNode(fs.fs, root)
        if (!startNode) {
          push('err', 'مسیر شروع موجود نیست')
          break
        }
        walk(startNode, root === '/' ? '' : root)
        if (found.length === 0) push('dim', 'هیچی پیدا نشد. حتی گربه هم ندید.')
        else found.slice(0, 30).forEach((f) => push('out', f))
        break
      }
      case 'grep': {
        const pattern = (args[0] ?? '').replace(/^["']|["']$/g, '')
        if (!pattern) {
          push('err', 'کاربرد: grep الگو [فایل] — یا: cat فایل | grep الگو')
          break
        }
        const src = readInputLines(args[1])
        if (!src) break
        const matches = src.lines
          .map((l, i) => ({ l, i }))
          .filter(({ l }) => l.toLowerCase().includes(pattern.toLowerCase()))
        if (!matches.length) push('dim', 'هیچ خطی جور نشد')
        else matches.forEach(({ l, i }) => push('ok', `${i + 1}: ${l}`))
        break
      }
      case 'head':
      case 'tail': {
        const nIdx = args.indexOf('-n')
        const count =
          nIdx !== -1 ? parseInt(args[nIdx + 1] ?? '10', 10) || 10 : 10
        const file = args.filter(
          (a, i) => a !== '-n' && i !== nIdx + 1 && !a.startsWith('-')
        )[0]
        const src = readInputLines(file)
        if (!src) break
        const all = src.lines
        const slice =
          base === 'head' ? all.slice(0, count) : all.slice(-count)
        slice.forEach((l) => push('out', l))
        break
      }
      case 'wc': {
        const file = args.filter((a) => !a.startsWith('-'))[0]
        const src = readInputLines(file)
        if (!src) break
        const text = src.lines.join('\n')
        const w = text.split(/\s+/).filter(Boolean).length
        push('out', `${src.lines.length} خط، ${w} کلمه، ${text.length} حرف`)
        break
      }

      /* ---------------- سیستم ---------------- */
      case 'whoami':
        push('ok', 'pengo — مدیر ارشد بامزگی (سطح دسترسی: همه‌چیز، چون خانه خودت است)')
        break
      case 'hostname':
        push('out', 'sanjob-os')
        break
      case 'date':
        push(
          'out',
          new Date().toLocaleDateString('fa-IR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        )
        break
      case 'uname':
        push(
          'out',
          args.includes('-a')
            ? 'Linux sanjob-os 6.12.4-sanjob-cute #1 SMP PREEMPT x86_64 GNU/Linux-ولی-بامزه'
            : 'PenguinOS'
        )
        break
      case 'uptime': {
        const mins = os.bootAt ? Math.max(1, Math.round((Date.now() - os.bootAt) / 60000)) : 0
        push('out', `بالا اومدی: ${mins} دقیقه — بار سیستم: 0.08 (خیلی آروم، چون خوابیم)`)
        break
      }
      case 'df':
        pushMany('out', [
          'فایل‌سیستم      حجم    استفاده    خالی    استفاده%',
          '/dev/ice/sd0   64M      21M       43M       33%',
          '/dev/fun       ∞        خیلی      بیشتر      1%',
        ].join('\n'))
        break
      case 'free':
        pushMany('out', [
          '             مجموع      استفاده    خالی',
          'حافظه:       64Mi       12Mi       52Mi',
          'بافر بامزگی: 8Mi        7Mi        1Mi',
        ].join('\n'))
        break
      case 'env': {
        Object.entries(envRef.current).forEach(([k, v]) =>
          push('out', `${k}=${v}`)
        )
        push('dim', 'متغیر بساز: export NAME=value — بعد echo $NAME')
        break
      }
      case 'history':
        history.forEach((h, i) => push('out', `${String(i + 1).padStart(3)}  ${h}`))
        break
      case 'ps': {
        push('out', '  PID  اپ              عنوان')
        if (os.windows.length === 0) push('dim', '(پروسه‌ای نیست — همه خواب‌اند)')
        os.windows.forEach((w) => {
          const app = getApp(w.appId)
          push(
            'out',
            `${String(pidOf(w.id)).padStart(5)}  ${(app?.id ?? '?').padEnd(15)} ${w.title}${w.minimized ? ' (کم‌حجم)' : ''}`
          )
        })
        break
      }
      case 'kill': {
        const pid = parseInt(args[0] ?? '', 10)
        if (!Number.isFinite(pid)) {
          push('err', 'شماره پروسه بده. اول ps بزن.')
          break
        }
        const win = os.windows.find((w) => pidOf(w.id) === pid)
        if (!win) {
          push('err', `پروسه ${pid} وجود ندارد`)
          break
        }
        os.closeWindow(win.id)
        push('ok', `پروسه ${pid} با آرامش خوابانده شد`)
        break
      }
      case 'clear':
        setLines([])
        break
      case 'exit':
      case 'quit':
        push('out', 'بای بای!')
        setTimeout(closeSelf, 350)
        break

      /* ---------------- گراف ---------------- */
      case 'apps':
        push('sys', 'اپ‌های نصب‌شده — با «open شناسه» بازشان کن:')
        push(
          'out',
          APPS.map((a) => a.id).join('  ')
        )
        break
      case 'open': {
        const q = argStr.toLowerCase().trim()
        const app = APPS.find(
          (a) =>
            a.id === q ||
            a.name === argStr.trim() ||
            (a.keywords ?? []).some((k) => k === q)
        )
        if (app) {
          os.openApp({ appId: app.id, title: app.name, w: app.w, h: app.h })
          push('ok', `«${app.name}» باز شد`)
        } else {
          push('err', `اپی به اسم «${argStr || 'خالی'}» نداریم. بنویس apps`)
        }
        break
      }
      case 'wallpaper': {
        if (!args[0]) {
          push('sys', 'کاغذدیواری‌ها — با کلید ست کن:')
          WALLPAPERS.forEach((w) => push('out', `  ${w.key.padEnd(14)} ${w.name}`))
          break
        }
        const w = WALLPAPERS.find((x) => x.key === args[0])
        if (w) {
          os.setSetting('wallpaper', w.key)
          push('ok', `کاغذدیواری شد: «${w.name}»`)
        } else {
          push('err', 'چنین کلیدی نیست. فقط «wallpaper» بزن تا لیست ببینی.')
        }
        break
      }
      case 'lock':
        push('out', 'قفل شد! برای باز کردن کلیک کن.')
        setTimeout(() => useOS.getState().lockScreen(), 400)
        break

      /* ---------------- سرگرمی ---------------- */
      case 'neofetch': {
        push('sys', TUX_ART)
        const mins = os.bootAt ? Math.max(1, Math.round((Date.now() - os.bootAt) / 60000)) : 0
        const info: string[] = [
          `sanjab@sanjob-os`,
          `-----------------`,
          `OS:      سان‌جاب‌او‌اس ۴.۰ «سنجابک»`,
          `Kernel:  6.12.4-sanjob-cute`,
          `Shell:   sanjob-sh 4.0`,
          `Uptime:  ${mins} دقیقه`,
          `Windows: ${os.windows.length} پنجره باز`,
          `Theme:   ${os.settings.accent} (پالت سان‌جاب)`,
          `AI:      ${hasAICfg() ? 'هوش‌یار وصل است (کلید خودت)' : 'هوش‌یار بی‌کلید — با open ai وصلش کن'}`,
          `Sponsor: sunjob.ir — با اسپانسری سان‌جاب`,
          `XP:      ${tutor.xp} (${levelOf(tutor.xp)}) — ${tutor.done.length}/${MISSIONS.length} ماموریت`,
          `Sponsor: sunjob.ir — با اسپانسری سان‌جاب`,
          `Memory:  12MiB / 64MiB (عمدتاً میم)`,
        ]
        info.forEach((l) => push('out', l))
        break
      }
      case 'sunjob': {
        push('sys', SQUIRREL_ART)
        push('ok', '⚡ سان‌جاب (sunjob.ir) اسپانسیر رسمی این سیستم‌عامله!')
        push('out', 'مشاوره انتخاب رشته و کنکور رو ازشون بگیرید — پالت رنگی سیستم هم هدیهٔ اونهاست.')
        break
      }
      case 'python': {
        push('ok', 'پایتونِ کوچک سان‌جاب توی کداستودیو نصبه! دارم برات بازش می‌کنم…')
        launch('code')
        break
      }
      case 'cowsay': {
        const text = (argStr || 'مووو! تو بهترین کاربری در دنیایی').slice(0, 36)
        push('sys', COW_ART(text))
        break
      }
      case 'fortune': {
        const node = getNode(fs.fs, '/usr/share/fortune/فال‌ها.txt')
        const list =
          node && node.type === 'file'
            ? node.content.split('\n').filter(Boolean)
            : ['امروز روز خوبی است.']
        push('ok', 'فال: ' + list[Math.floor(Math.random() * list.length)])
        break
      }
      case 'banner': {
        if (!argStr || !/^[a-zA-Z0-9 ]+$/.test(argStr)) {
          push('out', 'بنر فقط حروف انگلیسی و عدد می‌فهمد: banner PENGO')
          break
        }
        push('sys', banner(argStr))
        break
      }
      case 'matrix':
        push('dim', 'به ماتریکس خوش آمدی… برای خروج کلیک کن یا کلیدی بزن')
        setMatrix(true)
        break
      case 'sl':
        push('sys', TRAIN_ART)
        push('ok', 'غلط تایپی برای ls؟ قطارش همین‌جا رسید!')
        break
      case 'coffee':
        pushMany(
          'sys',
          [
            '  ( (',
            '   ) )',
            ' ........',
            ' |      |]',
            ' \\      /',
            "  `----'",
          ].join('\n')
        )
        push('ok', 'قهوه آماده! ولی اینجا وب است، بو نمی‌دهد.')
        break
      case 'tux':
        push('sys', TUX_ART)
        push('ok', 'این ماسکات ماست: Tux. نماد رسمی لینوکس. خوشگل، نه؟')
        break
      case 'ping': {
        const host = args[0] || 'penguin.os'
        push('out', `PING ${host} (42.42.42.42) — تونل کوانتومی پنگوئنی:`)
        for (let i = 1; i <= 4; i++) {
          push('out', `reply from 42.42.42.42: bytes=32 time=${40 + Math.floor(Math.random() * 20)}ms TTL=256`)
        }
        push('ok', 'سرور زنده است و حالش خوب است')
        break
      }
      case 'curl':
        pushMany(
          'out',
          [
            '<!doctype html>',
            '<html lang="fa">',
            '  <body>',
            '    <h1>سلام! این یک وب‌سایت خیالی است.</h1>',
            '    <p>اینجا همه‌چیز سبز است و هیچ کوکی‌ای نمی‌پزد.</p>',
            '  </body>',
            '</html>',
          ].join('\n')
        )
        break
      case 'sudo': {
        if (cmdline.includes('rm') && cmdline.includes('-rf')) {
          push('warn', 'در حال حذف همه‌چیز…')
          setTimeout(() => push('out', '▓▓▓▓▓▓▓▓▓▓░░░░ ۶۷٪'), 400)
          setTimeout(() => push('err', 'صبر کن صبر کن صبر کن!'), 900)
          setTimeout(() => {
            push('sys', 'خیالت راحت! این یک سیستم‌عامل بامزه است؛ هیچ‌چیز پاک نمی‌شود.')
            push('dim', 'ولی دفعه بعد قبل از این‌کار یک فکر کوچولو بکن.')
          }, 1500)
        } else {
          push('err', 'pengo در فایل sudoers نیست. این حادثه گزارش خواهد شد… به خودت.')
        }
        break
      }
      case 'apt':
      case 'apt-get': {
        if (args[0] === 'install' || args[0] === 'update') {
          const pkg = args[1] ?? 'bizarreness'
          if (['python', 'python3', 'node', 'nodejs', 'js', 'javascript', 'html'].includes(pkg.toLowerCase())) {
            push('ok', `«${pkg}» از قبل نصبه! توی کداستودیو منتظرته — دارم بازش می‌کنم…`)
            setTimeout(() => launch('code'), 600)
            break
          }
          setBusy(true)
          push('out', 'در حال خواندن لیست بسته‌ها… انجام شد')
          setTimeout(() => push('out', `نصب ${pkg} … ▕░░░░░░▏ ۱۲٪`), 350)
          setTimeout(() => push('out', `▕▓▓▓▓▓░░░░▏ ۶۳٪`), 750)
          setTimeout(() => {
            push('ok', `نصب شد. حالا ۲۰٪ بامزه‌تر شدی. (نصب خیالی بود، اصلاً نگران نباش)`)
            setBusy(false)
          }, 1150)
        } else {
          push('err', 'کاربرد: apt install نام‌بسته')
        }
        break
      }

      /* ---------------- متن و فیلتر (۴.۰) ---------------- */
      case 'sort': {
        const src = readInputLines(args.filter((a) => !a.startsWith('-'))[0])
        if (!src) break
        const sorted = [...src.lines].sort((a, b) => a.localeCompare(b, 'fa'))
        sorted.forEach((l) => push('out', l))
        break
      }
      case 'uniq': {
        const src = readInputLines(args[0])
        if (!src) break
        let prev: string | null = null
        for (const l of src.lines) {
          if (l !== prev) push('out', l)
          prev = l
        }
        break
      }
      case 'diff': {
        if (args.length < 2) {
          push('err', 'کاربرد: diff فایل۱ فایل۲')
          break
        }
        const a = getNode(fs.fs, normalizePath(cwd, args[0]))
        const b = getNode(fs.fs, normalizePath(cwd, args[1]))
        if (!a || !b || a.type !== 'file' || b.type !== 'file') {
          push('err', 'دو فایل معتبر بده')
          break
        }
        const la = a.content.split('\n')
        const lb = b.content.split('\n')
        const n = Math.max(la.length, lb.length)
        let changes = 0
        for (let i = 0; i < n; i++) {
          const x = la[i] ?? ''
          const y = lb[i] ?? ''
          if (x !== y) {
            changes++
            if (x) push('err', `< ${x}`)
            if (y) push('ok', `> ${y}`)
          }
        }
        push('dim', changes === 0 ? 'دو فایل یکسان‌اند — دوقلو!' : `${changes} تفاوت پیدا شد`)
        break
      }
      case 'cut': {
        const dIdx = args.indexOf('-d')
        const fIdx = args.indexOf('-f')
        const delim = dIdx !== -1 ? (args[dIdx + 1] ?? ',') : ','
        const field = fIdx !== -1 ? parseInt(args[fIdx + 1] ?? '1', 10) || 1 : 1
        const file = args.filter(
          (a, i) => !a.startsWith('-') && i !== dIdx + 1 && i !== fIdx + 1
        )[0]
        const src = readInputLines(file)
        if (!src) break
        src.lines.forEach((l) => push('out', l.split(delim)[field - 1] ?? ''))
        break
      }
      case 'tr': {
        if (args.length < 2) {
          push('err', 'کاربرد: tr قدیم جدید (با پایپ): cat فایل | tr ا ی')
          break
        }
        const src = readInputLines(undefined)
        if (!src) break
        const from = [...args[0]]
        const to = [...args[1]]
        src.lines.forEach((l) => {
          let out = ''
          for (const ch of l) {
            const idx = from.indexOf(ch)
            out += idx !== -1 ? (to[Math.min(idx, to.length - 1)] ?? ch) : ch
          }
          push('out', out)
        })
        break
      }
      case 'sed': {
        const m = (args[0] ?? '').match(/^s(.)(.+?)\1(.*?)\1([gi]*)$/)
        if (!m) {
          push('err', 'کاربرد: sed s/قدیم/جدید/ [فایل] — یا با پایپ')
          break
        }
        const from = m[2]
        const to = m[3]
        const flags = m[4] ?? ''
        const src = readInputLines(args[1])
        if (!src) break
        let re: RegExp
        try {
          re = new RegExp(
            from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
            flags.includes('g') ? 'g' : ''
          )
        } catch {
          push('err', 'الگو خراب است')
          break
        }
        src.lines.forEach((l) => push('out', l.replace(re, to)))
        break
      }
      case 'rev': {
        const src = readInputLines(args[0])
        if (!src) break
        src.lines.forEach((l) => push('out', [...l].reverse().join('')))
        break
      }
      case 'bc': {
        const exprStr = argStr.replace(/\s+/g, '')
        if (!exprStr) {
          push('err', 'مثال: bc (2+3)*4')
          break
        }
        if (!/^[\d+\-*/().%^]+$/.test(exprStr)) {
          push('err', 'فقط عدد و عملگر قبول است — ریاضی، نه شعبده‌بازی!')
          break
        }
        try {
          const val = Function(`"use strict";return (${exprStr.replace(/\^/g, '**')})`)() as number
          push('ok', String(val))
        } catch {
          push('err', 'عبارت خراب است')
        }
        break
      }
      case 'expr': {
        if (args.length < 3) {
          push('err', 'کاربرد: expr 2 + 2 (با فاصله!)')
          break
        }
        const nx = Number(args[0])
        const ny = Number(args[2])
        if (!Number.isFinite(nx) || !Number.isFinite(ny)) {
          push('err', 'عدد بده دیگه')
          break
        }
        const op = args[1]
        const r =
          op === '+' ? nx + ny :
          op === '-' ? nx - ny :
          op === '*' || op === 'x' ? nx * ny :
          op === '/' ? nx / ny :
          op === '%' ? nx % ny : null
        if (r === null) {
          push('err', `عملگر «${op}» را نمی‌شناسم`)
          break
        }
        push('ok', String(r))
        break
      }
      case 'seq': {
        const a = Number(args[0] ?? 1)
        const b = Number(args[1] ?? args[0] ?? 5)
        if (!Number.isFinite(a) || !Number.isFinite(b)) {
          push('err', 'مثال: seq 1 5')
          break
        }
        const [start, end] = args.length < 2 ? [1, a] : [a, b]
        for (let i = start; i <= end && i - start < 200; i++) push('out', String(i))
        break
      }
      case 'cal': {
        const mth = args[0] ? parseInt(args[0], 10) : undefined
        const yr = args[1] ? parseInt(args[1], 10) : undefined
        pushMany('out', calGrid(Number.isFinite(mth) ? mth : undefined, Number.isFinite(yr) ? yr : undefined))
        break
      }

      /* ---------------- سیستم ۴.۰ ---------------- */
      case 'chmod': {
        if (!args[0] || !args[1]) {
          push('err', 'کاربرد: chmod +x فایل یا chmod 755 فایل')
          break
        }
        const p = normalizePath(cwd, args[1])
        const node = getNode(fs.fs, p)
        if (!node || node.type !== 'file') {
          push('err', `فایل «${args[1]}» پیدا نشد`)
          break
        }
        const grant = args[0] === '+x' || /^[75][1-7][1-7]$/.test(args[0])
        if (fs.chmod(p, grant)) {
          push(
            'ok',
            grant
              ? `«${baseName(p)}» حالا قابل اجراست! امتحان کن: ./${baseName(p)}`
              : 'دسترسی اجرا گرفته شد (برگشت به حالت معمولی)'
          )
        } else push('err', 'تغییر دسترسی ممکن نشد')
        break
      }
      case 'id':
        push('out', 'uid=1000(pengo) gid=1000(pengo) groups=1000(pengo),27(sudo),150(بامزگی)')
        break
      case 'groups':
        push('out', 'pengo sudo بامزگی')
        break
      case 'ln': {
        const real = args.filter((a) => !a.startsWith('-'))
        if (real.length < 2) {
          push('err', 'کاربرد: ln -s هدف نام‌پیوند')
          break
        }
        const target = normalizePath(cwd, real[0])
        const linkPath = normalizePath(cwd, real[1])
        if (!getNode(fs.fs, target)) {
          push('err', `هدف «${real[0]}» نیست و نبود`)
          break
        }
        if (fs.writeFile(linkPath, `پیوند به ${target}\n`))
          push('ok', `پیوند «${baseName(linkPath)}» ساخته شد → ${prettyPath(target)}`)
        else push('err', 'پیوند ساخته نشد')
        break
      }
      case 'du': {
        const root = args[0] ? normalizePath(cwd, args[0]) : cwd
        const node = getNode(fs.fs, root)
        if (!node) {
          push('err', 'مسیر پیدا نشد')
          break
        }
        const sizeOf = (nd: FsNode): number =>
          nd.type === 'file'
            ? Math.max(1, Math.round((nd.content.length || 8) / 102.4) / 10)
            : Object.values(nd.children).reduce((s, c) => s + sizeOf(c), 4)
        push('out', `${sizeOf(node).toFixed(1)}K\t${prettyPath(root)}`)
        break
      }
      case 'which': {
        const c = args[0]
        if (!c) {
          push('err', 'کدام دستور؟')
          break
        }
        if (aliasRef.current[c]) push('ok', `${c}: alias به «${aliasRef.current[c]}»`)
        else if (MAN[c] || ALL_COMMANDS.includes(c)) push('out', `/bin/${c}`)
        else {
          push('err', `«${c}» هیچ‌جا نیست`)
          const sugg = didYouMean(c)
          if (sugg) push('dim', `شاید «${sugg}»؟`)
        }
        break
      }
      case 'file': {
        if (!args[0]) {
          push('err', 'اسم فایل بده')
          break
        }
        const node = getNode(fs.fs, normalizePath(cwd, args[0]))
        if (!node) {
          push('err', 'پیدا نشد')
          break
        }
        if (node.type === 'dir') push('out', `${args[0]}: directory — پوشه`)
        else if (node.kind === 'exe') push('out', `${args[0]}: ELF بامزه ۶۴-بیتی، قابل اجرا`)
        else if (node.kind === 'img') push('out', `${args[0]}: image — عکس`)
        else if (node.kind === 'audio') push('out', `${args[0]}: audio — صدا`)
        else if (node.kind === 'pdf') push('out', `${args[0]}: PDF document`)
        else push('out', `${args[0]}: ASCII text — متن ساده`)
        break
      }
      case 'stat': {
        if (!args[0]) {
          push('err', 'فایل بده: stat فایل')
          break
        }
        const node = getNode(fs.fs, normalizePath(cwd, args[0]))
        if (!node) {
          push('err', 'پیدا نشد')
          break
        }
        push('out', `  File: ${args[0]}`)
        push('out', `  Type: ${node.type === 'dir' ? 'directory' : node.kind === 'exe' ? 'executable' : node.kind}`)
        push('out', `  Size: ${node.type === 'file' ? node.content.length : 4096} بایت`)
        push('out', 'Access: (0644/-rw-r--r--)  Uid: 1000(pengo)')
        break
      }
      case 'less':
      case 'more': {
        push('dim', 'اینجا همه‌چیز جا می‌شود؛ مثل cat رفتار می‌کنم:')
        if (!args[0]) {
          push('err', 'فایل بده')
          break
        }
        const node = getNode(fs.fs, normalizePath(cwd, args[0]))
        if (node && node.type === 'file' && node.kind !== 'img') pushMany('out', node.content)
        else push('err', 'فایل متنی بده')
        break
      }
      case 'alias': {
        if (!args[0]) {
          push('sys', 'اسم‌های مستعار فعال:')
          Object.entries(aliasRef.current).forEach(([k, v]) =>
            push('out', `  ${k}='${v}'`)
          )
          push('dim', 'بساز با: alias fish="echo یومی!" — برای همیشه یادم می‌ماند')
          break
        }
        const m = argStr.match(/^(\w+)\s*=\s*["']?(.+?)["']?$/)
        if (!m) {
          push('err', 'مثال: alias fish="echo یومی!" (اسم لاتین)')
          break
        }
        aliasRef.current[m[1]] = m[2]
        saveMap('pengo-alias-v1', aliasRef.current)
        push('ok', `از این به بعد «${m[1]}» یعنی: ${m[2]}`)
        break
      }
      case 'unalias': {
        if (!args[0]) {
          push('err', 'کدام alias؟')
          break
        }
        if (aliasRef.current[args[0]]) {
          delete aliasRef.current[args[0]]
          saveMap('pengo-alias-v1', aliasRef.current)
          push('ok', `«${args[0]}» از یادم رفت`)
        } else push('err', 'چنین aliasای ندارم')
        break
      }
      case 'export': {
        const m = argStr.match(/^([A-Za-z_]\w*)\s*=\s*(.*)$/)
        if (!m) {
          push('err', 'مثال: export NAME=Pengo')
          break
        }
        envRef.current[m[1]] = m[2].replace(/^["']|["']$/g, '')
        saveMap('pengo-env-v1', envRef.current)
        push('ok', `${m[1]}=${envRef.current[m[1]]} — حالا با echo $${m[1]} صدایش کن`)
        break
      }
      case 'top': {
        push('sys', 'top — سان‌جاب‌او‌اس (بامزه‌ترین پروسه‌ها اول)')
        push('out', '  PID  CPU%  پروسه')
        if (os.windows.length === 0) push('dim', '(سیستم آروم و خواب‌آلود)')
        os.windows.forEach((w, i) => {
          push('out', `${String(pidOf(w.id)).padStart(5)}  ${String(3 + ((i * 7) % 23)).padStart(3)}%  ${w.title}${w.minimized ? ' (خوابیده)' : ''}`)
        })
        push('dim', 'نکته: این top ثابت است؛ اینجا هیچ‌چیز اذیت نمی‌کند.')
        break
      }
      case 'jobs':
        push(
          'out',
          os.windows.some((w) => w.minimized)
            ? 'چند پروسه خوابیده در پس‌زمینه (کمینه‌شده)'
            : 'بدون کار معلق — سیستم سرحال است'
        )
        break
      case 'systemctl': {
        const sub2 = args[0] ?? 'status'
        const unit = args[1] ?? 'fun.service'
        if (sub2 === 'status') {
          push('sys', `● ${unit} — فعال و سرحال`)
          push('out', '   Loaded: loaded (/lib/systemd/system/بامزگی.service)')
          push('out', '   Active: active (running) از لحظه بوت')
        } else if (sub2 === 'restart' || sub2 === 'stop' || sub2 === 'start') {
          push('ok', `${unit} ${sub2 === 'stop' ? 'خوابانده شد' : 'راه افتاد'} — یونیت‌های ما هرگز واقعاً نمی‌میرند`)
        } else push('err', 'مثال: systemctl status fun.service')
        break
      }
      case 'journalctl': {
        const log = getNode(fs.fs, '/var/log/kernel.log')
        push('sys', '-- لاگ‌های اخیر هسته --')
        if (log && log.type === 'file') pushMany('out', log.content)
        else push('dim', 'لاگ خالی — سیستم خیلی آرام است')
        break
      }
      case 'crontab':
        push('out', '# برنامه زمانی بامزه')
        push('out', '0 9 * * *    یادآوری آب خوردن')
        push('out', '30 22 * * *  حال دلی نرم (خواب)')
        push('out', '*/5 * * * *  یک فندق برای سنجابک')
        break
      case 'tar':
      case 'zip': {
        setBusy(true)
        push('out', `در حال ${base === 'zip' ? 'زیپ' : 'تار'} کردن ${args.filter((a) => !a.startsWith('-'))[0] ?? 'همه‌چیز'}…`)
        setTimeout(() => {
          push('ok', 'بسته شد! (خیالی بود — اینجا دیسک سخت نداریم، قلب‌مان را داریم)')
          setBusy(false)
        }, 800)
        break
      }
      case 'wget': {
        const f = args[0] ?? 'فندق.zip'
        setBusy(true)
        push('out', `در حال دانلود ${f} …`)
        setTimeout(() => push('out', '▕░░░░░░░░░░▏ ۱۰٪'), 250)
        setTimeout(() => push('out', '▕▓▓▓▓▓░░░░▏ ۵۰٪'), 550)
        setTimeout(() => {
          push('ok', `«${f}» دانلود شد — ۱۰۰٪ (به گوشه‌ای خیالی از حافظه)`)
          setBusy(false)
        }, 900)
        break
      }
      case 'ssh':
        push('dim', `ssh ${args[0] ?? 'pengo@penguin.os'} …`)
        push('err', 'اتصال رد شد: اینجا مرورگر است، پورت ۲۲ نداریم! ولی به شبکه پنگوئنی خوش آمدی.')
        break
      case 'ip':
      case 'ifconfig':
        push('out', 'lo0:   127.0.0.1     — خانه، شیرین خانه')
        push('out', 'en0:   42.42.42.42   — تونل کوانتومی پنگوئنی (فعال)')
        push('out', 'tux0:  10.0.cute.1   — کارت شبکه بامزگی')
        break
      case 'nano':
      case 'vim':
      case 'emacs': {
        push(
          'warn',
          base === 'vim'
            ? 'به vim خوش آمدی! برای خروج: :q! — موفق باشی، ۹۰٪ کاربران همین‌جا گم می‌شوند.'
            : `${base} اینجا نصب نیست — ولی «نویسا» داریم که خیلی مهربان‌تر است!`
        )
        setTimeout(() => launch('writer'), 700)
        break
      }
      case 'sleep': {
        const n = Math.min(5, Number(args[0] ?? 1) || 1)
        setBusy(true)
        push('dim', `zzz… ${n} ثانیه`)
        setTimeout(() => {
          push('ok', 'بیدار! خواب خوبی بود')
          setBusy(false)
        }, n * 1000)
        break
      }
      case 'ai':
        push('ok', 'هوش‌یار باز شد — کلید API خودت را آنجا وصل کن!')
        launch('ai-chat')
        break

      /* ---------------- پیش‌فرض: غلط تایپی ---------------- */
      default: {
        const m = didYouMean(base, fixMapRef.current[base] ? [fixMapRef.current[base]] : [])
        const fixm = fixMapRef.current[base]
        const fixedFull = fixm
          ? fixm + cmdline.slice(base.length)
          : m
            ? m + cmdline.slice(base.length)
            : null
        if (fixedFull) {
          if (!nested) setPendingFix({ from: base, fixed: fixedFull })
          push('err', `پنگوئن‌شل: دستور «${base}» را نمی‌شناسم`)
          push('dim', `اما گمان می‌کنم منظورت «${fixedFull}» بود — Enter بزن تا اجرایش کنم، یا از نوار بالا استفاده کن.`)
        } else {
          push('err', `پنگوئن‌شل: دستور «${base}» پیدا نشد`)
          push('dim', 'بنویس help، یا از دستیار بپرس: ask ' + base)
        }
      }
    }

    // ارزیابی ماموریت فعال (بعد از اجرای دستور)
    checkMission(raw)
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (busy) return
    if (!input.trim() && activeFix) {
      rememberFix(activeFix.from, activeFix.fixed.split(/\s+/)[0])
      execute(activeFix.fixed)
      setInput('')
      setPendingFix(null)
      return
    }
    execute(input)
    setInput('')
  }

  /* ------------------- کیبورد ------------------- */
  const completePath = () => {
    const parts = input.split(/\s+/)
    const last = parts[parts.length - 1] ?? ''
    const slashIdx = last.lastIndexOf('/')
    const dirPart = slashIdx !== -1 ? last.slice(0, slashIdx + 1) : ''
    const namePart = slashIdx !== -1 ? last.slice(slashIdx + 1) : last
    const dirPath = dirPart
      ? normalizePath(cwd, dirPart.endsWith('/') ? dirPart : dirPart)
      : cwd
    const node = getNode(useFs.getState().fs, dirPath)
    if (!node || node.type !== 'dir') return
    const names = Object.keys(node.children).filter((n) =>
      n.startsWith(namePart)
    )
    if (names.length === 0) return
    if (names.length === 1) {
      const full = dirPart + names[0] + (node.children[names[0]].type === 'dir' ? '/' : '')
      parts[parts.length - 1] = full
      setInput(parts.join(' '))
    } else {
      push('dim', names.join('  '))
    }
  }

  const onKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    /* جستجوی معکوس تاریخچه (Ctrl+R) */
    if (revSearch !== null) {
      e.preventDefault()
      if (e.key === 'Escape') {
        setRevSearch(null)
      } else if (e.key === 'Enter') {
        if (revMatch) {
          const cmd = revMatch
          setRevSearch(null)
          setInput(cmd)
          execute(cmd)
          setInput('')
        } else {
          setRevSearch(null)
        }
      } else if (e.key === 'Backspace') {
        setRevSearch(revSearch.slice(0, -1))
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setRevSearch(revSearch + e.key)
      }
      return
    }
    if (e.ctrlKey && e.key.toLowerCase() === 'r') {
      e.preventDefault()
      setRevSearch('')
      return
    }
    if (e.ctrlKey && e.key.toLowerCase() === 'l') {
      e.preventDefault()
      setLines([])
      return
    }
    if (e.ctrlKey && e.key.toLowerCase() === 'c') {
      e.preventDefault()
      push('in', input + '^C')
      setInput('')
      return
    }
    if (e.key === 'Tab') {
      e.preventDefault()
      if (!input) return
      if (input.includes(' ')) {
        completePath()
      } else {
        const matches = ALL_COMMANDS.filter((c) => c.startsWith(input)).sort()
        if (matches.length === 1) {
          setInput(matches[0] + ' ')
        } else if (matches.length > 1) {
          push('dim', matches.join('  '))
        }
      }
      return
    }
    if (
      suggestion &&
      (e.key === 'Tab' ||
        (e.key === 'ArrowRight' &&
          (e.currentTarget.selectionStart ?? 0) >= input.length))
    ) {
      e.preventDefault()
      setInput(suggestion)
      return
    }
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
    dim: 'text-zinc-500',
  }

  const prompt = `sanjab@sanjob-os:${prettyPath(cwd)}$`

  return (
    <div
      className="relative flex h-full flex-col bg-[#0a0f0c] font-mono"
      onClick={() => inputRef.current?.focus()}
    >
      {/* نوار وضعیت tmux-وار */}
      <div
        className="flex shrink-0 items-center gap-2 border-b border-white/10 bg-zinc-900/80 px-3 py-1 text-[10px] text-zinc-400"
        dir="ltr"
      >
        <span className="font-black text-[var(--pengo-accent)]">pengo-sh 4.0</span>
        <span className="hidden truncate sm:inline">{prettyPath(cwd)}</span>
        <div className="flex-1" />
        <span
          className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5"
          title="امتیاز آموزش ترمینال"
        >
          <Zap size={10} className="text-amber-300" aria-hidden />
          {tutor.xp} XP — {levelOf(tutor.xp)}
        </span>
        <button
          onClick={() => setRevSearch('')}
          className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 transition hover:bg-white/15 sm:flex"
          title="جستجو در تاریخچه (Ctrl+R)"
          aria-label="جستجو در تاریخچه"
        >
          <History size={10} aria-hidden />
          جستجو
        </button>
        <button
          onClick={() => setShowChips((v) => !v)}
          className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 transition hover:bg-white/15"
          title="نوار دستورهای سریع"
          aria-expanded={showChips}
        >
          <List size={10} aria-hidden />
          سریع
        </button>
        <span className="hidden md:inline">help | learn start</span>
      </div>

      {/* خروجی */}
      <div
        ref={scrollRef}
        className="os-scroll min-h-0 flex-1 overflow-y-auto p-3 text-[12px] leading-6 sm:text-[13px]"
        dir="rtl"
      >
        {lines.map((l) =>
          l.type === 'in' ? (
            <pre key={l.id} className="whitespace-pre-wrap text-left" dir="ltr">
              <span className="text-emerald-500">{prompt} </span>
              <span className="text-zinc-200">{l.text}</span>
            </pre>
          ) : l.text.includes('\n') || /^[\s/\]|<>_()=\\#▓░▏▔▕├└─]+$/.test(l.text) ? (
            <pre
              key={l.id}
              className={`whitespace-pre text-left ${color[l.type]}`}
              dir="ltr"
            >
              {l.text}
            </pre>
          ) : (
            <div key={l.id} className={`whitespace-pre-wrap ${color[l.type]}`}>
              {l.text}
            </div>
          )
        )}
      </div>

      {/* جستجوی معکوس تاریخچه */}
      {revSearch !== null && (
        <div
          className="flex shrink-0 items-center gap-2 border-t border-violet-400/20 bg-violet-500/10 px-3 py-1.5 text-[11px]"
          dir="ltr"
        >
          <span className="font-black text-violet-300">reverse-i-search</span>
          <code className="rounded bg-black/50 px-1.5 py-0.5 text-violet-100">
            `{revSearch}`
          </code>
          <span className={`min-w-0 flex-1 truncate ${revMatch ? 'text-zinc-200' : 'text-rose-300'}`}>
            {revMatch ?? 'پیدا نشد'}
          </span>
          <span className="hidden text-zinc-500 sm:inline">Enter=اجرا — Esc=خروج</span>
        </div>
      )}

      {/* نوار دستورهای سریع */}
      {showChips && (
        <div className="flex shrink-0 flex-wrap gap-1 border-t border-white/10 bg-zinc-900/70 px-3 py-1.5">
          {QUICK_CMDS.map((c) => (
            <button
              key={c.cmd}
              type="button"
              onClick={() => {
                setInput(c.cmd)
                inputRef.current?.focus()
              }}
              className="rounded-lg border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[10px] text-zinc-300 transition hover:border-emerald-400/40 hover:text-emerald-300 active:scale-95"
              dir="ltr"
            >
              {c.cmd}
              <span className="ms-1.5 font-sans text-[9px] text-zinc-500">{c.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* نوار پیشنهاد اصلاح غلط */}
      {activeFix && (
        <div
          className="pengo-wiggle flex shrink-0 flex-wrap items-center gap-2 border-t border-amber-400/20 bg-amber-500/10 px-3 py-1.5 text-[11px]"
          dir="rtl"
        >
          <Sparkles size={13} className="shrink-0 text-amber-300" aria-hidden />
          <span className="text-amber-100">منظورت این بود؟</span>
          <code
            className="rounded bg-black/50 px-1.5 py-0.5 font-bold text-amber-200"
            dir="ltr"
          >
            {activeFix.fixed}
          </code>
          <button
            onClick={() => {
              rememberFix(activeFix.from, activeFix.fixed.split(/\s+/)[0])
              execute(activeFix.fixed)
              setInput('')
            }}
            className="flex items-center gap-1 rounded-lg bg-amber-400/90 px-2 py-1 font-black text-zinc-950 transition hover:bg-amber-300 active:scale-95"
          >
            <CornerDownLeft size={12} aria-hidden />
            اجرا (Enter)
          </button>
          <button
            onClick={() => setPendingFix(null)}
            className="grid h-6 w-6 place-items-center rounded-lg text-amber-200/70 transition hover:bg-white/10 hover:text-amber-100"
            aria-label="بی‌خیال پیشنهاد"
          >
            <X size={12} />
          </button>
          <span className="text-amber-200/50">اصلاح‌ها یاد گرفته می‌شوند — دفعه بعد خودکار پیشنهاد می‌دهم</span>
        </div>
      )}

      {/* ورودی */}
      <form
        onSubmit={onSubmit}
        className="flex shrink-0 items-center gap-2 border-t border-white/10 px-3 py-2 text-[12px] sm:text-[13px]"
        dir="ltr"
      >
        <span className="shrink-0 whitespace-nowrap text-emerald-400">
          {prompt}
        </span>
        <div className="relative min-w-0 flex-1">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            className="w-full bg-transparent text-zinc-100 caret-emerald-400 outline-none placeholder:text-zinc-700"
            placeholder="یه دستور بنویس… (help)"
            aria-label="ورودی ترمینال"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
          />
          {suggestion && suggestion.startsWith(input) && (
            <span
              className="pointer-events-none absolute inset-y-0 left-0 flex items-center whitespace-pre text-zinc-600"
              aria-hidden
            >
              <span className="invisible">{input}</span>
              <span>{suggestion.slice(input.length)}</span>
            </span>
          )}
        </div>
      </form>

      {/* حالت ماتریکس */}
      {matrix && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 z-10 cursor-pointer bg-black/95"
          aria-label="انیمیشن ماتریکس — برای خروج کلیک کن"
        />
      )}
    </div>
  )
}
