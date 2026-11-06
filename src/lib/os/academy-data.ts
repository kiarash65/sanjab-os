/* ------------------------------------------------------------------ */
/* داده‌های «آکادمی لینوکس» سان‌جاب‌او‌اس                              */
/* الهام‌گرفته از Linux Journey ، LinuxCommand.org و کتاب‌های جامع     */
/* ------------------------------------------------------------------ */

export interface TimelineItem {
  year: string
  title: string
  body: string
}

export interface StatItem {
  label: string
  value: number
  suffix: string
  color: string
  note: string
}

export interface Distro {
  id: string
  name: string
  basedOn: string
  color: string
  difficulty: 1 | 2 | 3 | 4 | 5
  pm: string
  bestFor: string
  fun: string
  tags: ('beginner' | 'stable' | 'modern' | 'diy' | 'security' | 'light')[]
}

export interface InstallMethod {
  id: string
  title: string
  emoji: string
  difficulty: string
  time: string
  color: string
  intro: string
  steps: { title: string; body: string; tip?: string }[]
}

export interface Mission {
  id: string
  brief: string
  hint: string
  /** اگر match شد، ماموریت انجام شده است */
  match: RegExp
}

export interface QuizQ {
  q: string
  options: string[]
  answer: number
  why: string
}

export const TIMELINE: TimelineItem[] = [
  {
    year: '۱۹۸۳',
    title: 'پروژهٔ گنو آغاز می‌شود',
    body: 'ریچارد استالمن پروژهٔ GNU را ساخت تا یک سیستم‌عامل کاملاً آزاد بسازد؛ تقریباً همه‌چیز آماده بود جز هسته.',
  },
  {
    year: '۱۹۹۱',
    title: '«فقط یه سرگرمی» — لینوس تووالدز',
    body: 'دانشجوی ۲۱ سالهٔ فنلاندی، هستهٔ لینوکس ۰.۰۱ را منتشر کرد و در گروه خبری نوشت: «فقط یه سرگرمی است، بزرگ و حرفه‌ای نخواهد شد!» — معلوم شد اشتباه می‌کرد.',
  },
  {
    year: '۱۹۹۳',
    title: 'اولین توزیع‌ها',
    body: 'Debian و Slackware متولد شدند؛ مفهوم «توزیع» (هسته + ابزارها + نصب‌کننده) شکل گرفت.',
  },
  {
    year: '۱۹۹۶',
    title: 'تاکسی به‌عنوان نماد',
    body: 'لری ارینگ پنگوئن بچاق را طراحی کرد. اسمش TUX است: Torvalds UniX!',
  },
  {
    year: '۲۰۰۴',
    title: 'اوبونتو برای انسان‌ها',
    body: 'Ubuntu با شعار «Linux for Human Beings» لینوکس را به دسکتاپ‌های معمولی آورد و نسخهٔ هر ۶ ماه را باب کرد.',
  },
  {
    year: '۲۰۰۸ → امروز',
    title: 'لینوکس همه‌جا!',
    body: 'اندروید (با هستهٔ لینوکس) پرکاربردترین سیستم‌عامل دنیا شد؛ سرورها، ابرها، سوپرکامپیوترها و حتی مریخ‌نوردها لینوکسی شدند.',
  },
]

export const WHERE_STATS: StatItem[] = [
  {
    label: 'سوپرکامپیوترهای برتر جهان',
    value: 100,
    suffix: '٪',
    color: '#f7931e',
    note: 'هر ۵۰۰ تای لیست Top500 لینوکسی‌اند — حتی یکی استثنا نیست!',
  },
  {
    label: 'گوشی‌های اندرویدی',
    value: 71,
    suffix: '٪',
    color: '#0ea5a0',
    note: 'اندروید روی هستهٔ لینوکس سوار است؛ یعنی احتمالاً جیبت را الان هم لینوکس گرم نگه داشته.',
  },
  {
    label: 'سرورهای وب (Linux/Unix)',
    value: 84,
    suffix: '٪',
    color: '#8b5cf6',
    note: 'تقریباً هر سایتی که باز می‌کنی، پشت‌صحنه‌اش یه پنگوئن داره دوید',
  },
  {
    label: 'ابرهای عمومی (Cloud)',
    value: 90,
    suffix: '٪',
    color: '#e11d48',
    note: 'AWS ،Google Cloud و Azure بیشترِ ماشین‌های‌شان لینوکسی است',
  },
]

export const RUNS_ON: { place: string; body: string }[] = [
  { place: 'فضا', body: 'ISS (ایستگاه فضایی) با Debian اجرا می‌شود؛ لپ‌تاپ‌های فضانورد‌ها هم لینوکسی‌اند.' },
  { place: 'مریخ', body: 'هلیکوپتر Ingenuity با لینوکس پرواز کرد — اولین پرواز روی سیارهٔ دیگر!' },
  { place: 'ماشین‌ها', body: 'Toyota و تعدادی خودروساز دیگر با Automotive Grade Linux داشبورد می‌سازند.' },
  { place: 'خانهٔ تو', body: 'روتر وای‌فای، تلویزیون هوشمند، ساعت هوشمند و اکثر دستگاه‌های IoT لینوکس دارند.' },
]

export const DISTROS: Distro[] = [
  {
    id: 'ubuntu',
    name: 'Ubuntu',
    basedOn: 'Debian',
    color: '#e95420',
    difficulty: 1,
    pm: 'apt',
    bestFor: 'شروع برای همه؛ بیشتر آموزش‌های اینترنت هم برای اوبونتو است',
    fun: 'هر نسخه با یه اسم بامزه مثل «Jammy Jellyfish» منتشر می‌شود',
    tags: ['beginner', 'stable'],
  },
  {
    id: 'mint',
    name: 'Linux Mint',
    basedOn: 'Ubuntu',
    color: '#87cf3e',
    difficulty: 1,
    pm: 'apt',
    bestFor: 'کسانی که از ویندوز می‌آیند و دنبال حسی آشنا هستند (Cinnamon)',
    fun: 'پیش‌فرضش بدون هیچ دردسری codec ها را نصب دارد',
    tags: ['beginner', 'stable'],
  },
  {
    id: 'debian',
    name: 'Debian',
    basedOn: '—',
    color: '#d70a53',
    difficulty: 2,
    pm: 'apt',
    bestFor: 'سرورها و کسانی که ثبات را از هرچیزی بیشتر دوست دارند',
    fun: 'نسخه‌هایش اسم شخصیت‌های تویی‌استوری را دارند (Bullseye, Bookworm)',
    tags: ['stable'],
  },
  {
    id: 'fedora',
    name: 'Fedora',
    basedOn: 'Red Hat',
    color: '#294172',
    difficulty: 2,
    pm: 'dnf',
    bestFor: 'تجربهٔ جدیدترین فناوری‌ها با پایداری قابل قبول؛ محبوب لینوس تووالدز',
    fun: 'هر ۶ ماه نسخهٔ جدید؛ فناوری‌های نو مثل Wayland زودتر از همه اینجا آمدند',
    tags: ['modern'],
  },
  {
    id: 'arch',
    name: 'Arch Linux',
    basedOn: '—',
    color: '#1793d1',
    difficulty: 5,
    pm: 'pacman',
    bestFor: 'یادگیری عمیق لینوکس؛ نصبش خودش یک دورهٔ آموزشی کامل است',
    fun: 'مشهورترین جملهٔ دنیای لینوکس: «من آرچ استفاده می‌کنم، ضمناً»',
    tags: ['diy'],
  },
  {
    id: 'kali',
    name: 'Kali Linux',
    basedOn: 'Debian',
    color: '#557c94',
    difficulty: 3,
    pm: 'apt',
    bestFor: 'امنیت و تست نفوذ — صدها ابزار حرفه‌ای آماده',
    fun: 'در فیلم‌های هکری همیشه Kali روی صفحه است؛ ولی در واقعیت مامان‌بزرگت هم داره!',
    tags: ['security'],
  },
  {
    id: 'manjaro',
    name: 'Manjaro',
    basedOn: 'Arch',
    color: '#35bf5c',
    difficulty: 3,
    pm: 'pacman',
    bestFor: 'قدرت آرچ، ولی با نصب آسان و ابزار گرافیکی',
    fun: 'اگه آرچ دوست داری ولی حوصله نصب سخت نداری، این وسط خوشگله',
    tags: ['diy', 'modern'],
  },
  {
    id: 'alpine',
    name: 'Alpine',
    basedOn: '—',
    color: '#0d597f',
    difficulty: 4,
    pm: 'apk',
    bestFor: 'کانتینرها و سیستم‌های خیلی کم‌مصرف؛ کمتر از ۱۵۰ مگابایت!',
    fun: 'پایهٔ بیشتر ایمیج‌های Docker است — کوچولوی بادیِ دنیای لینوکس',
    tags: ['light', 'diy'],
  },
]

export const DISTRO_QUIZ: {
  q: string
  options: { text: string; score: Record<string, number> }[]
}[] = [
  {
    q: 'با کامپیوترت چقدر راحتی؟',
    options: [
      { text: 'ترجیح می‌دم همه‌چیز از قبل کار کنه', score: { ubuntu: 2, mint: 2 } },
      { text: 'یه‌کم ور می‌رم، یاد می‌گیرم', score: { fedora: 2, manjaro: 2 } },
      { text: 'همه‌چیز را خودم می‌سازم!', score: { arch: 3, alpine: 1 } },
    ],
  },
  {
    q: 'هدفت از نصب لینوکس چیه؟',
    options: [
      { text: 'دسکتاپ روزمره و اداری', score: { mint: 2, ubuntu: 2 } },
      { text: 'یادگیری عمیق و آزمایش', score: { arch: 2, fedora: 1 } },
      { text: 'سرور و کارهای جدی', score: { debian: 3 } },
      { text: 'امنیت و تست نفوذ', score: { kali: 3 } },
    ],
  },
  {
    q: 'کامپیوترت چقدر قوی است؟',
    options: [
      { text: 'قدرتمند، بدون محدودیت', score: { ubuntu: 1, fedora: 1 } },
      { text: 'متوسط', score: { mint: 1, manjaro: 1 } },
      { text: 'خیلی ضعیف و قدیمی', score: { alpine: 1, mint: 1 } },
    ],
  },
  {
    q: 'آپدیت‌های تازه برایت مهم‌ترند یا ثبات؟',
    options: [
      { text: 'ثبات! دست نزن چیزی که کار می‌کنه', score: { debian: 2, mint: 1 } },
      { text: 'تازه‌ترین نسخه‌ها برای من!', score: { fedora: 2, arch: 2 } },
    ],
  },
]

export const INSTALL_METHODS: InstallMethod[] = [
  {
    id: 'vm',
    title: 'ماشین مجازی (امن‌ترین راه)',
    emoji: '🖥',
    difficulty: 'آسان',
    time: 'حدود ۳۰ دقیقه',
    color: '#0ea5a0',
    intro: 'لینوکس مثل یک پنجره داخل ویندوز/مک اجرا می‌شود؛ اگر خراب شد فقط پنجره را می‌بندی. برای شروع یادگیری بهترین گزینه است.',
    steps: [
      { title: 'دانلود VirtualBox یا VMware', body: 'از سایت رسمی virtualbox.org نصب‌کنندهٔ رایگان را بگیر و نصب کن.' },
      { title: 'دانلود فایل ISO', body: 'مثلاً اوبونتو از ubuntu.com/download — فایل ISO یعنی «دیسک نصب» به شکل فایل.' },
      { title: 'ساخت ماشین جدید', body: 'New → نام: Ubuntu → نوع: Linux. رم ۴ گیگ و دیسک ۲۵ گیگ به‌طور معقول است.', tip: 'اگر رم سیستم کم است، ۲ گیگ هم جواب می‌دهد.' },
      { title: 'اتصال ISO و روشن کردن', body: 'Settings → Storage → فایل ISO را در درایو نوری مجازی بگذار، ماشین را Start کن.' },
      { title: 'نصب به سبک عادی', body: 'محیط گرافیکی اوبونتو بالا می‌آید؛ «Install Ubuntu» را بزن، زبان و کیبورد را انتخاب کن و صبر کن.' },
      { title: 'حس خوب', body: 'لینوکس داخل پنجره بالا آمد! حالا Ctrl+Alt+T را بزن تا ترمینال باز شود — قدم بعدی سفر شروع شد.' },
    ],
  },
  {
    id: 'dual',
    title: 'دوال‌بوت کنار ویندوز',
    emoji: '🚪',
    difficulty: 'متوسط',
    time: 'حدود ۱ ساعت',
    color: '#f7931e',
    intro: 'هر دو سیستم‌عامل نصب می‌شوند و موقع روشن‌شدن منوی GRUB می‌پرسد کدام را بالا بیاورد. سرعت واقعی سخت‌افزار، بدون مصنوعیات.',
    steps: [
      { title: 'پشتیبان‌گیری مقدس', body: 'قبل از هر کاری از فایل‌های مهم بکاپ بگیر. این قدم قابل رد شدن نیست!', tip: 'قانون طلایی: بعد از بکاپ، دوباره بکاپ.' },
      { title: 'ساخت لایو USB', body: 'با نرم‌افزار Rufus (ویندوز) یا balenaEtcher، فایل ISO را روی فلش ۸ گیگی بریز.' },
      { title: 'آزاد کردن فضا', body: 'در «مدیریت دیسک» ویندوز از پارتیشن اصلی کمی فضا خالی کن (حداقل ۵۰ گیگ پیشنهاد می‌شود).' },
      { title: 'بوت از فلش', body: 'سیستم را ری‌استارت کن و با کلید مخصوص بوت‌منو (معمولاً F12 ،F9 یا Esc) فلش را انتخاب کن.' },
      { title: 'نصب کنار ویندوز', body: 'در نصب‌کننده گزینهٔ «Install alongside Windows» را انتخاب کن؛ فضا خودکار تقسیم می‌شود.' },
      { title: 'منوی GRUB', body: 'بعد از نصب، هر روشن‌شدن منویی می‌بینی که ویندوز و لینوکس را انتخاب می‌کند. تبریک — رسمی لینوکسی شدی!' },
    ],
  },
  {
    id: 'wsl',
    title: 'WSL — لینوکس داخل ویندوز',
    emoji: '⚡',
    difficulty: 'خیلی آسان',
    time: '۱۰ دقیقه',
    color: '#8b5cf6',
    intro: 'زیرسیستم ویندوز برای لینوکس: یک ترمینال لینوکس واقعی (اوبونتو و…) داخل ویندوز، برای یادگیری خط فرمان فوق‌العاده است.',
    steps: [
      { title: 'باز کردن PowerShell ادمین', body: 'روی منوی استارت راست‌کلیک → «Terminal (Admin)» یا PowerShell ادمین.' },
      { title: 'یک دستور جادویی', body: 'بنویس: wsl --install و Enter بزن. ویندوز همه‌چیز را خودش نصب می‌کند.', tip: 'بعد از نصب یک بار ری‌استارت لازم است.' },
      { title: 'ساخت کاربر لینوکسی', body: 'اولین بار که اوبونتو باز شود، ازت یوزرنیم و پسورد لینوکسی می‌خواهد — این پسورد را جایی یادداشت کن.' },
      { title: 'تمام شد، واقعاً!', body: 'حالا bash داری: `sudo apt update` را امتحان کن و تفاوت سرعتش با ویندوز را ببین!' },
    ],
  },
  {
    id: 'live',
    title: 'لایو USB — بدون نصب امتحان کن',
    emoji: '🔌',
    difficulty: 'آسان',
    time: '۱۵ دقیقه',
    color: '#e11d48',
    intro: 'لینوکس را مستقیم از فلش اجرا کن؛ هیچ‌چیز روی دیسک نوشته نمی‌شود. برای «اول فقط ببینم چی هست» عالی است.',
    steps: [
      { title: 'لایو فلش بساز', body: 'مثل روش دوال‌بوت، با Rufus/Etcher فلش قابل بوت بساز.' },
      { title: 'بوت از فلش', body: 'با کلید بوت‌منو فلش را انتخاب کن. اگر Secure Boot گیر داد، موقتاً از BIOS خاموشش کن.' },
      { title: 'گزینهٔ Try Ubuntu', body: 'به‌جای Install، گزینهٔ «Try» را بزن؛ لینوکس کامل در رم اجرا می‌شود.' },
      { title: 'با خیال راحت ور برو', body: 'هر بلایی سرش بیاوری، با خاموش‌کردن پاک می‌شود. بازی با ترمینال آزاد است!' },
    ],
  },
]

/** ماموریت‌های ترمینال تعاملی فصل ۵ */
export const TERMINAL_MISSIONS: Mission[] = [
  { id: 'm1', brief: 'با دستور pwd ببین الان کجای سیستم هستی', hint: 'فقط بنویس: pwd', match: /^\s*pwd\s*$/ },
  { id: 'm2', brief: 'با ls محتویات خانه را لیست کن', hint: 'بنویس: ls', match: /^\s*ls\s*(--all|-la|-l|-a)?\s*$/ },
  { id: 'm3', brief: 'داخل پوشهٔ projects برو (با cd) و دوباره ls بزن', hint: 'cd projects بعد ls', match: /^\s*ls\s*(--all|-la|-l|-a)?\s*$/ },
  { id: 'm4', brief: 'یک پوشهٔ جدید به نام sunjob بساز', hint: 'mkdir sunjob', match: /^\s*mkdir\s+(-p\s+)?["']?sunjob["']?\s*$/ },
  { id: 'm5', brief: 'داخل sunjob فایلی به نام hello.txt بساز (با touch)', hint: 'touch sunjob/hello.txt یا اول cd sunjob', match: /^\s*touch\s+["']?(sunjob\/)?hello\.txt["']?\s*$/ },
  { id: 'm6', brief: 'چیزی در hello.txt بنویس: echo سلام > sunjob/hello.txt', hint: 'echo با > متن را داخل فایل می‌ریزد', match: /^\s*echo\s+.+\s*>\s*["']?(sunjob\/)?hello\.txt["']?\s*$/ },
  { id: 'm7', brief: 'با cat محتوای فایل را بخوان', hint: 'cat sunjob/hello.txt', match: /^\s*cat\s+["']?(sunjob\/)?hello\.txt["']?\s*$/ },
  { id: 'm8', brief: 'کار تمیز! فایل را با rm پاک کن', hint: 'rm sunjob/hello.txt', match: /^\s*rm\s+(-r\s+)?["']?(sunjob\/)?hello\.txt["']?\s*$/ },
  { id: 'm9', brief: 'با uname -a نسخهٔ کامل هسته را ببین', hint: 'uname -a', match: /^\s*uname\s+(-a|--all)\s*$/ },
  { id: 'm10', brief: 'کل درخت خانه را با tree تماشا کن', hint: 'tree', match: /^\s*tree\s*$/ },
]

export const QUIZ: QuizQ[] = [
  {
    q: 'لینوکس دقیقاً چیست؟',
    options: ['یک نرم‌افزار اداری', 'هستهٔ سیستم‌عامل', 'یک مرورگر', 'یک بازی'],
    answer: 1,
    why: 'لینوکس اسم «هسته» است؛ توزیع‌ها هسته + ابزارها + محیط گرافیکی هستند.',
  },
  {
    q: 'کدام‌ها با هستهٔ لینوکس کار می‌کنند؟',
    options: ['فقط سوپرکامپیوترها', 'فقط سرورها', 'اندروید، سرورها، تلویزیون‌ها و سوپرکامپیوترها', 'فقط دسکتاپ‌ها'],
    answer: 2,
    why: 'لینوکس همه‌جاست؛ از گوشی اندرویدی‌ات تا مریخ‌نورد!',
  },
  {
    q: '«توزیع» (Distro) یعنی چه؟',
    options: [
      'یک نسخهٔ پیرated از ویندوز',
      'هستهٔ لینوکس + ابزارها و نصب‌کننده که با هم پخش می‌شوند',
      'نوعی فایل فشرده',
      'درایور کارت گرافیک',
    ],
    answer: 1,
    why: 'اوبونتو، فدورا و آرچ همه «توزیع» هستند: یک بستهٔ کامل از هسته و نرم‌افزارها.',
  },
  {
    q: 'دستور pwd چه کاری می‌کند؟',
    options: ['پسورد را عوض می‌کند', 'مسیر فعلی را نشان می‌دهد', 'فایل را پاک می‌کند', 'برنامه را می‌بندد'],
    answer: 1,
    why: 'pwd = print working directory؛ همیشه بگو کجای سیستم هستی.',
  },
  {
    q: 'برای رفتن به پوشهٔ خانه، کدام دستور درست است؟',
    options: ['cd /home', 'cd ~', 'cd root', 'home go'],
    answer: 1,
    why: '~ میان‌بُر پوشهٔ خانهٔ کاربر فعلی است؛ cd ~ یعنی برو خانه!',
  },
  {
    q: 'معنی رشتهٔ دسترسی rwxr-xr-- (عددی: 754) برای «دیگران» چیست؟',
    options: ['خواندن و اجرا', 'فقط خواندن', 'همه‌کاره', 'هیچ دسترسی'],
    answer: 1,
    why: 'سه نقطهٔ آخر (r--) فقط خواندن است؛ یعنی عدد ۴.',
  },
  {
    q: 'chmod 777 file.txt چرا خطرناک تلقی می‌شود؟',
    options: ['فایل را رمزگذاری می‌کند', 'به همه اجازهٔ خواندن/نوشتن/اجرا می‌دهد', 'فایل را حذف می‌کند', 'چیزی را نصب می‌کند'],
    answer: 1,
    why: '۷۷۷ یعنی درِ خانه باز به روی همه؛ در سرور حفرهٔ امنیتی جدی است.',
  },
  {
    q: 'برای دیدن فرآیندهای در حال اجرا کدام بهتر است؟',
    options: ['ls', 'ps aux یا htop', 'cat /dev/null', 'mkdir'],
    answer: 1,
    why: 'ps لیست لحظه‌ای می‌دهد و htop نمایش زنده و رنگی دارد.',
  },
  {
    q: 'در اوبونتو با کدام دستور برنامه نصب می‌کنی؟',
    options: ['sudo apt install name', 'install name.exe', 'pacman -S name فقط در اوبونتو', 'yum forever'],
    answer: 0,
    why: 'apt مدیر بستهٔ خانوادهٔ Debian/Ubuntu است؛ فدورا dnf و آرچ pacman دارد.',
  },
  {
    q: 'sudo پیش از یک دستور چه می‌کند؟',
    options: ['آن را سریع‌تر اجرا می‌کند', 'آن را با دسترسی مدیر (root) اجرا می‌کند', 'آن را در پس‌زمینه می‌برد', 'چیزی را پاک می‌کند'],
    answer: 1,
    why: 'sudo = superuser do؛ قدرت کامل با مسئولیت کامل!',
  },
  {
    q: '«PID 1» در لینوکس معمولاً کیست و چرا مهم است؟',
    options: ['اولین کاربر — مالک سیستم', 'systemd — پدر همهٔ پروسه‌ها؛ اگر بمیرد کرنل panic می‌کند', 'هستهٔ لینوکس خودش', 'لاگ‌گیر سیستم'],
    answer: 1,
    why: 'درخت پروسه‌ها از PID 1 (systemd) ریشه می‌گیرد؛ مرگش یعنی مرگ سیستم.',
  },
  {
    q: 'initramfs در فرآیند بوت چه نقشی دارد؟',
    options: [
      'منوی انتخاب سیستم‌عامل',
      'فایل‌سیستم موقت در RAM که درایورهای لازم را بالا می‌آورد تا ریشهٔ واقعی mount شود',
      'پشتیبان‌گیر خودکار',
      'مدیر بستهٔ بوت',
    ],
    answer: 1,
    why: 'گره «درایور داخل دیسک است، دیسک بدون درایور خوانده نمی‌شود» را initramfs باز می‌کند.',
  },
  {
    q: 'هر برنامه برای دسترسی به سخت‌افزار باید چه کند؟',
    options: ['مستقیماً بنویسد — آزادیم!', 'از سیستم‌کال (syscall) رد شود — دروازهٔ رسمی هسته', 'از root اجازه بگیرد هر بار', 'فقط با sudo اجرا شود'],
    answer: 1,
    why: 'هسته تک‌نفرهٔ داور است؛ برنامه‌ها فقط از طریق syscall سرویس می‌گیرند — همین امنیت می‌آورد.',
  },
  {
    q: 'Docker در واقع از کدام دو امکان هستهٔ لینوکس استفاده می‌کند؟',
    options: ['systemd و cron', 'namespace و cgroup', 'iptables و ufw', 'ext4 و btrfs'],
    answer: 1,
    why: 'namespace می‌گوید پروسه چه ببیند، cgroup می‌گوید چقدر منبع بخورد — کانتینر یعنی همین!',
  },
  {
    q: '«inode» چیست؟',
    options: ['نوعی ویروس قدیمی', 'ساختار متادیتای فایل: مالک، دسترسی‌ها و آدرس بلوک‌های داده', 'نام دیگر فولدر', 'پسوند فایل‌های لینوکسی'],
    answer: 1,
    why: 'اسم فایل فقط برچسب است؛ inode هویت واقعی فایل است — پس hard link ممکن می‌شود.',
  },
  {
    q: 'journaling در ext4 چه فایده‌ای دارد؟',
    options: [
      'فایل‌ها را رمزنگاری می‌کند',
      'قبل از نوشتن، قصد نوشتن را ثبت می‌کند تا بعد از قطع برق، فایل‌سیستم سریع سالم شود',
      'سرعت اینترنت را زیاد می‌کند',
      'فایل‌ها را فشرده می‌کند',
    ],
    answer: 1,
    why: 'دفترچهٔ (journal) باعث می‌شود بعد از قطع برق، fsck چند ثانیه‌ای تمام شود نه چند ساعت!',
  },
  {
    q: 'اگر «ping 8.8.8.8» جواب داد ولی «ping google.com» جواب نداد، مشکل کجاست؟',
    options: ['کارت شبکه', 'فایروال', 'DNS — ترجمهٔ اسم به آدرس خراب است', 'اینترنت قطع است'],
    answer: 2,
    why: 'آدرس IP کار می‌کند یعنی اتصال سالم است؛ مشکل ترجمهٔ اسم است: سرور DNS را چک کن (cat /etc/resolv.conf).',
  },
  {
    q: 'در SSH، کدام کلید هرگز نباید از دستگاه تو خارج شود؟',
    options: ['کلید عمومی (id_ed25519.pub)', 'کلید خصوصی (id_ed25519)', 'فایل known_hosts', 'etc/hosts'],
    answer: 1,
    why: 'کلید خصوصی رمز هویت توست — فقط روی دستگاه خودت. کلید عمومی را می‌شود همه‌جا پخش کرد.',
  },
  {
    q: 'دستور «chmod 644 فایل» چه معنی‌ای دارد؟',
    options: [
      'مالک: خواندن+نوشتن — گروه و دیگران: فقط خواندن',
      'همه همه‌کاره‌اند',
      'فقط root دسترسی دارد',
      'فایل اجرایی می‌شود',
    ],
    answer: 0,
    why: '۶=rw برای مالک، ۴=r برای گروه، ۴=r برای دیگران — پیش‌فرض استاندارد فایل‌های متنی.',
  },
]

export const CHEATSHEET: { group: string; color: string; rows: [string, string][] }[] = [
  {
    group: 'ناوبری',
    color: '#f7931e',
    rows: [
      ['pwd', 'مسیر فعلی را نشان می‌دهد'],
      ['ls / ls -la', 'لیست فایل‌ها / با فایل‌های مخفی و جزئیات'],
      ['cd / cd ~ / cd ..', 'جابجایی بین پوشه‌ها / خانه / یک پله بالا'],
      ['tree', 'نمای درختی پوشه‌ها (باید نصب شود)'],
    ],
  },
  {
    group: 'فایل‌ها',
    color: '#0ea5a0',
    rows: [
      ['mkdir -p a/b', 'ساخت پوشه با کل مسیر'],
      ['touch f.txt', 'ساخت فایل خالی / بروزرسانی زمان'],
      ['cp / mv / rm -r', 'کپی / انتقال و تغییرنام / حذف'],
      ['cat / less / head / tail', 'دیدن محتوای فایل'],
      ['grep -r "متن" .', 'جستجوی متن داخل فایل‌ها'],
      ['find . -name "*.txt"', 'جستجوی فایل با الگو'],
    ],
  },
  {
    group: 'دسترسی‌ها',
    color: '#8b5cf6',
    rows: [
      ['chmod 755 script.sh', 'تغییر مجوزها'],
      ['chown user:group f', 'تغییر مالکیت'],
      ['sudo', 'اجرای دستور با دسترسی مدیر'],
      ['whoami / groups', 'من کی‌ام؟ / گروه‌های من'],
    ],
  },
  {
    group: 'فرآیندها و سیستم',
    color: '#e11d48',
    rows: [
      ['ps aux / htop', 'لیست فرآیندها / مانیتور زنده'],
      ['kill -9 PID', 'بستن اجباری یک فرآیند'],
      ['df -h / du -sh', 'فضای دیسک / حجم پوشه'],
      ['uname -a / lsb_release -a', 'اطلاعات هسته و توزیع'],
      ['top / uptime / free -h', 'وضعیت لحظه‌ای سیستم'],
    ],
  },
  {
    group: 'بسته‌ها (بسته به توزیع)',
    color: '#14b8a6',
    rows: [
      ['sudo apt update && upgrade', 'Debian/Ubuntu: بروزرسانی'],
      ['sudo apt install نام', 'نصب برنامه در اوبونتو'],
      ['sudo dnf install نام', 'Fedora/RHEL'],
      ['sudo pacman -S نام', 'Arch/Manjaro'],
      ['apk add نام', 'Alpine (در بوت کرنل واقعی سان‌جاب هم واقعی است!)'],
    ],
  },
  {
    group: 'شبکه',
    color: '#14b8a6',
    rows: [
      ['ip a / ip route', 'کارت‌های شبکه و مسیر پیش‌فرض'],
      ['ping -c3 آدرس', 'آزمایش اتصال (۳ بسته)'],
      ['ss -tulpn', 'پورت‌های باز و صاحبان‌شان (sudo)'],
      ['curl -I آدرس', 'فقط هدرهای HTTP یک سایت'],
      ['traceroute آدرس', 'مسیر بسته‌ها هاپ‌به‌هاپ'],
      ['sudo ufw enable', 'روشن کردن فایروال (اوبونتو)'],
    ],
  },
  {
    group: 'دیسک و بوت',
    color: '#f7931e',
    rows: [
      ['lsblk', 'درخت دیسک‌ها و پارتیشن‌ها'],
      ['sudo mount /dev/sdb1 /mnt', 'اتصال دیسک به درخت فایل‌ها'],
      ['sudo umount /mnt', 'جدا کردن امن (قبل از کشیدن فلش!)'],
      ['dmesg | tail', 'آخرین پیام‌های واقعی کرنل'],
      ['systemctl status سرویس', 'وضعیت سرویس‌های systemd'],
      ['journalctl -b', 'لاگ‌های این بوت'],
    ],
  },
  {
    group: 'اسکریپت و اتوماسیون',
    color: '#8b5cf6',
    rows: [
      ['chmod +x اسکریپت.sh', 'اجازهٔ اجرا دادن'],
      ['$1 ، $2 ، $#', 'پارامترهای اسکریپت و تعدادشان'],
      ['if [ -d پوشه ]; then', 'شرط «پوشه وجود دارد؟»'],
      ['for f in *.txt; do … done', 'حلقه روی فایل‌ها'],
      ['cat لاگ | grep خطا | wc -l', 'ترکیب ابزارها با پایپ'],
      ['crontab -e', 'زمان‌بندی کارهای تکراری'],
    ],
  },
]

/** لینک‌های منابع واقعی برای ادامهٔ مسیر */
export const FURTHER_RESOURCES: { name: string; url: string; desc: string }[] = [
  { name: 'Linux Journey', url: 'https://linuxjourney.com', desc: 'مسیر یادگیری مرحله‌به‌مرحله رایگان (انگلیسی ساده)' },
  { name: 'The Linux Command Line', url: 'https://linuxcommand.org/tlcl.php', desc: 'کتاب طلایی خط فرمان، رایگان PDF' },
  { name: 'Ubuntu Tutorials', url: 'https://ubuntu.com/tutorials', desc: 'آموزش‌های رسمی اوبونتو با تصویر' },
  { name: 'Arch Wiki', url: 'https://wiki.archlinux.org', desc: 'دانشنامهٔ افسانه‌ای — برای همه توزیع‌ها ارزشمند' },
]
