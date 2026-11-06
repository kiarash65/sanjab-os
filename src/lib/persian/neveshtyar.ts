/* ------------------------------------------------------------------ */
/*  نوشت‌یار — موتور پردازش و ویرایش متن فارسی                          */
/*  کاملاً محلی و قطعی (بدون React و بدون DOM) — امن برای هر محیطی      */
/*  فقط «ایده» از پروژه‌های NeveshtYar (MIT) و DadmaTools (Apache-2.0)  */
/*  گرفته شده است؛ این پیاده‌سازی اصلی و مستقل است.                     */
/* ------------------------------------------------------------------ */

/** نیم‌فاصله (ZWNJ) — قلب نگارش درست فارسی */
export const NY_ZWNJ = '\u200c'

/* ------------------------------------------------------------------ */
/*  انواع                                                              */
/* ------------------------------------------------------------------ */

/** دسته‌های ویرایشی که موتور پیشنهاد می‌دهد */
export type NyEditType =
  | 'layout' // خطای چیدمان کیبورد (fa ↔ en)
  | 'char' // حروف عربیِ نامعتبر در متن فارسی (ي ك ة ى)
  | 'digit' // یکسان‌سازی ارقام به ۰-۹ فارسی
  | 'zwnj' // نیم‌فاصله‌های جاافتاده
  | 'space' // فاصله‌های اضافی و خطوط شلوغ
  | 'punct' // نشانه‌های نگارشی و فاصله‌گذاری آن‌ها
  | 'quote' // گیومهٔ فارسی به‌جای کوتیشن
  | 'typo' // غلط املایی/رسمی رایج
  | 'repeat' // واژهٔ تکراری پشت‌سرهم

/** یک ویرایش پیشنهادی؛ مختصات (start/end) روی متنِ اصلی است */
export interface NyEdit {
  id: string
  type: NyEditType
  start: number
  end: number
  from: string
  to: string
  reason: string
}

/** نتیجهٔ خوانایی‌سنجی */
export type NyReadability = 'آسان' | 'متوسط' | 'دشوار'

/** تحلیل آماری متن */
export interface NyAnalysis {
  words: number
  sentences: number
  paragraphs: number
  chars: number
  avgSentence: number
  longSentences: number[]
  readability: NyReadability
  repeats: Array<{ word: string; count: number }>
}

/** خروجی کامل تحلیل: فهرست پیشنهادها + آمار */
export interface NyResult {
  edits: NyEdit[]
  analysis: NyAnalysis
}

/* ------------------------------------------------------------------ */
/*  ثابت‌ها                                                            */
/* ------------------------------------------------------------------ */

/** بازهٔ حروف فارسی/عربی رایج در متن فارسی (BMP و تک‌واحدی) */
const FA_LETTER_CLASS = '\\u0621-\\u06D5'
/** کاراکترهای سازندهٔ «واژه» فارسی (حرف + نیم‌فاصله) */
const FA_WORD_CLASS = '\\u0621-\\u06D5\\u200c'

/** کوتاه‌ترین دنباله برای گمانِ خطای چیدمان — رشته‌های کوتاه مبهم‌اند */
const MIN_LAYOUT_RUN = 4
/** کمینهٔ بافت فارسی لازم برای جرئت کردن به پیشنهاد تبدیل چیدمان */
const MIN_FA_CONTEXT = 8
/** جمله‌ای که از این تعداد واژه بیشتر باشد «بلند» شمرده می‌شود */
const LONG_SENTENCE_WORDS = 20
/** بیشینهٔ واژه‌های پرتکرار در گزارش */
const MAX_REPEATS = 6

/**
 * اولویت ویرایش‌ها وقتی دو پیشنهاد روی هم بیفتند؛
 * عدد کوچک‌تر برنده است (مثلاً «می باشد» هم قاعدهٔ نیم‌فاصله دارد
 * و هم اصلاح «است» — اصلاحِ املایی باید برنده شود)
 */
const TYPE_PRIORITY: Record<NyEditType, number> = {
  typo: 0,
  layout: 1,
  quote: 2,
  punct: 3,
  digit: 4,
  char: 5,
  zwnj: 6,
  repeat: 7,
  space: 8,
}

/* ------------------------------------------------------------------ */
/*  نگاشت چیدمان استاندارد کیبورد فارسی (ISIRI 9147 / ویندوز)          */
/*  فقط نویسه‌های بدون Shift؛ ارقام هم مطابق چیدمان واقعی نگاشت می‌شوند */
/* ------------------------------------------------------------------ */

const EN2FA_FULL: Record<string, string> = {
  q: 'ض', w: 'ص', e: 'ث', r: 'ق', t: 'ف', y: 'غ', u: 'ع', i: 'ه', o: 'خ', p: 'ح',
  '[': 'ج', ']': 'چ',
  a: 'ش', s: 'س', d: 'ی', f: 'ب', g: 'ل', h: 'ا', j: 'ت', k: 'ن', l: 'م',
  ';': 'ک', "'": 'گ',
  z: 'ظ', x: 'ط', c: 'ز', v: 'ر', b: 'ذ', n: 'د', m: 'پ', ',': 'و',
  '1': '۱', '2': '۲', '3': '۳', '4': '۴', '5': '۵',
  '6': '۶', '7': '۷', '8': '۸', '9': '۹', '0': '۰',
}

/** وارونهٔ نگاشت بالا برای مسیر fa → en */
const FA2EN_FULL: Record<string, string> = {}
for (const [en, fa] of Object.entries(EN2FA_FULL)) FA2EN_FULL[fa] = en

/** فقط حروف و کلیدهای نزدیک آن‌ها؛ برای تشخیصِ محافظه‌کارانهٔ چیدمان */
const EN2FA_LETTERS: Record<string, string> = {}
for (const [en, fa] of Object.entries(EN2FA_FULL)) {
  if (/[a-z[\];']/.test(en)) EN2FA_LETTERS[en] = fa
}
const FA2EN_LETTERS: Record<string, string> = {}
for (const [en, fa] of Object.entries(EN2FA_LETTERS)) FA2EN_LETTERS[fa] = en

/** حروف پرتکرار فارسی برای سنجش «معتبر بودن» خروجی نگاشت en→fa */
const TOP_FA = new Set('اهمترنمسیدولبکیگفرشپچخج'.split(''))

/**
 * واژه‌های انگلیسی رایجی که در متن فارسی «مشروع»اند و نباید
 * به‌عنوان خطای چیدمان گزارش شوند (کاهش مثبت کاذب)
 */
const EN_KEEP = new Set([
  'hello', 'world', 'keyboard', 'screen', 'file', 'files', 'folder', 'test', 'code', 'codes',
  'script', 'python', 'linux', 'windows', 'android', 'google', 'gmail', 'email', 'login', 'user',
  'name', 'persian', 'farsi', 'iran', 'tehran', 'next', 'react', 'node', 'cloud', 'server',
  'client', 'design', 'excel', 'word', 'office', 'print', 'save', 'copy', 'paste', 'undo',
  'redo', 'search', 'download', 'upload', 'photo', 'video', 'music', 'mouse', 'monitor',
  'laptop', 'phone', 'mobile', 'telegram', 'instagram', 'youtube', 'chrome', 'firefox', 'token',
  'type', 'text', 'title', 'page', 'post', 'blog', 'site', 'website', 'line', 'note', 'notes',
  'open', 'close', 'edit', 'delete', 'remove', 'list', 'item', 'items', 'home', 'about', 'help',
  'error', 'start', 'stop', 'play', 'pause', 'back', 'menu', 'theme', 'dark', 'light', 'font',
  'size', 'color', 'javascript', 'typescript', 'github', 'salam',
])

/**
 * واژه‌نامهٔ محدود و واقعی اغلاط رایج — محترمانه و بدون سلیقهٔ شخصی.
 * کلید دقیقاً یک «واژه» است؛ مقدار، صورت درست و دلیل اصلاح است.
 */
const TYPO_MAP: Record<string, { to: string; reason: string }> = {
  'هیج': { to: 'هیچ', reason: 'اغلط رایج: «هیچ»' },
  'اتفاقا': { to: 'اتفاقاً', reason: 'تنوین فراموش شده است' },
  'مثلا': { to: 'مثلاً', reason: 'تنوین فراموش شده است' },
  'حتما': { to: 'حتماً', reason: 'تنوین فراموش شده است' },
  'فعلا': { to: 'فعلاً', reason: 'تنوین فراموش شده است' },
  'واقعا': { to: 'واقعاً', reason: 'تنوین فراموش شده است' },
  'اصلا': { to: 'اصلاً', reason: 'تنوین فراموش شده است' },
  'دقیقا': { to: 'دقیقاً', reason: 'تنوین فراموش شده است' },
  'احتمالا': { to: 'احتمالاً', reason: 'تنوین فراموش شده است' },
  'خصوصا': { to: 'خصوصاً', reason: 'تنوین فراموش شده است' },
  'مطمئنا': { to: 'مطمئناً', reason: 'تنوین فراموش شده است' },
  'ظاهرا': { to: 'ظاهراً', reason: 'تنوین فراموش شده است' },
  'لطفا': { to: 'لطفاً', reason: 'تنوین فراموش شده است' },
  'پسرآنه': { to: 'پسرانه', reason: 'همزهٔ اضافی: «پسرانه»' },
  'دخترآنه': { to: 'دخترانه', reason: 'همزهٔ اضافی: «دخترانه»' },
  'میکنه': { to: 'می‌کند', reason: 'صورت رسمی با نیم‌فاصله' },
  'نمیکنه': { to: 'نمی‌کند', reason: 'صورت رسمی با نیم‌فاصله' },
  'میکنم': { to: 'می‌کنم', reason: 'نیم‌فاصلهٔ «می» لازم است' },
  'میکنید': { to: 'می‌کنید', reason: 'نیم‌فاصلهٔ «می» لازم است' },
  'میشه': { to: 'می‌شود', reason: 'صورت رسمی: «می‌شود»' },
  'نمیشه': { to: 'نمی‌شود', reason: 'صورت رسمی: «نمی‌شود»' },
  'میشود': { to: 'می‌شود', reason: 'نیم‌فاصلهٔ «می» لازم است' },
  'نمیشود': { to: 'نمی‌شود', reason: 'نیم‌فاصلهٔ «می» لازم است' },
  'میبینی': { to: 'می‌بینی', reason: 'نیم‌فاصلهٔ «می» لازم است' },
  'میبینم': { to: 'می‌بینم', reason: 'نیم‌فاصلهٔ «می» لازم است' },
  'میخوام': { to: 'می‌خواهم', reason: 'صورت رسمی: «می‌خواهم»' },
  'میخوای': { to: 'می‌خواهی', reason: 'صورت رسمی: «می‌خواهی»' },
  'میخواد': { to: 'می‌خواهد', reason: 'صورت رسمی: «می‌خواهد»' },
  'نمیخوام': { to: 'نمی‌خواهم', reason: 'صورت رسمی: «نمی‌خواهم»' },
  'میتوانم': { to: 'می‌توانم', reason: 'نیم‌فاصلهٔ «می» لازم است' },
  'میتونی': { to: 'می‌توانی', reason: 'نیم‌فاصلهٔ «می» لازم است' },
  'میباشد': { to: 'است', reason: 'به‌جای «می‌باشد» از «است» استفاده کنید' },
  'هارو': { to: 'ها را', reason: 'در نوشتار رسمی «ها را» جدا نوشته می‌شود' },
  'اون': { to: 'او', reason: 'صورت رسمی ضمیر: «او»' },
}

/** پسوندهایی که باید با نیم‌فاصله به واژه بچسبند (به‌ترتیب بلندی) */
const ZWNJ_SUFFIXES = [
  'هایمان', 'هایتان', 'هایشان', 'هایم', 'هایت', 'هایش', 'های', 'ترین', 'تر', 'ای',
]

/** واژه‌های ساختاری که در گزارش پرتکرارها معنا ندارند */
const STOPWORDS = new Set([
  'و', 'در', 'به', 'از', 'که', 'را', 'با', 'این', 'آن', 'برای', 'یک', 'تا', 'است', 'هست', 'هم',
  'بر', 'می', 'شد', 'بود', 'کرد', 'کند', 'خواهد', 'های', 'ها', 'یا', 'اما', 'اگر', 'هر', 'چه',
  'نیز', 'بین', 'روی', 'خود', 'ما', 'شما', 'او', 'من', 'تو', 'چون', 'پس', 'نیست', 'باشد',
  'دارد', 'باید', 'دیگر', 'شده', 'کرده', 'شود', 'بودن', 'شدن', 'خیلی', 'بسیار', 'همین',
  'وقتی', 'مورد', 'طریق', 'بله', 'خیر', 'نه', 'آیا', 'چند', 'همچنین', 'بنابراین', 'البته', 'ولی',
])

/* ------------------------------------------------------------------ */
/*  ابزارهای کوچک                                                      */
/* ------------------------------------------------------------------ */

/** آیا نویسه، حرف فارسی/عربی است؟ */
function isFaLetter(ch: string): boolean {
  return ch !== '' && new RegExp(`^[${FA_LETTER_CLASS}]$`).test(ch)
}

/** آیا نویسه «فارسی‌ساز» است (حرف یا نشانهٔ فارسی)؟ برای سنجش بافت */
function isFaish(ch: string): boolean {
  return isFaLetter(ch) || '،؛؟…«»'.includes(ch)
}

function isDigit(ch: string): boolean {
  return /[0-9\u06F0-\u06F9\u0660-\u0669]/.test(ch)
}

/** نزدیک‌ترین نویسهٔ غیرفاصله در یک جهت */
function neighborNonSpace(text: string, index: number, step: -1 | 1): string {
  let i = index + step
  while (i >= 0 && i < text.length) {
    const ch = text[i]
    if (ch !== ' ' && ch !== '\t' && ch !== '\n') return ch
    i += step
  }
  return ''
}

/** شمردن موارد یک الگوی سراسری */
function countMatches(text: string, re: RegExp): number {
  let n = 0
  for (const _m of text.matchAll(re)) n += 1
  return n
}

/** نگاشت نویسه‌به‌نویسهٔ یک رشته با جدول داده‌شده */
function mapChars(str: string, map: Record<string, string>): string {
  let out = ''
  for (const ch of str) out += map[ch] ?? ch
  return out
}

/* ------------------------------------------------------------------ */
/*  ۱) تشخیص محتاطانهٔ خطای چیدمان کیبورد (هرگز خودکار اعمال نمی‌شود)   */
/* ------------------------------------------------------------------ */

function detectLayoutEdits(text: string, mk: MkFn): NyEdit[] {
  const edits: NyEdit[] = []
  const faCount = countMatches(text, new RegExp(`[${FA_LETTER_CLASS}]`, 'g'))
  const enCount = countMatches(text, /[a-zA-Z]/g)
  const total = faCount + enCount
  if (total < MIN_LAYOUT_RUN * 2) return edits

  // حالت ۱: واژه‌های لاتینِ درونِ متن فارسی → احتمالاً با چیدمان اشتباه تایپ شده‌اند
  if (faCount >= MIN_FA_CONTEXT && enCount >= MIN_LAYOUT_RUN && enCount <= Math.max(10, Math.round(total * 0.4))) {
    for (const m of text.matchAll(/[a-zA-Z]+/g)) {
      const run = m[0]
      if (run.length < MIN_LAYOUT_RUN) continue
      if (EN_KEEP.has(run.toLowerCase())) continue // واژهٔ مشروع انگلیسی
      const mapped = mapChars(run, EN2FA_LETTERS)
      let top = 0
      for (const ch of mapped) if (TOP_FA.has(ch)) top += 1
      // دست‌کم نصف نویسه‌ها باید از حروف پرتکرار فارسی بیایند تا «معتبر» بپذیریم
      if (top >= Math.ceil(mapped.length * 0.5) && top >= 2) {
        edits.push(
          mk('layout', m.index, m.index + run.length, run, mapped,
            'احتمالاً با چیدمان اشتباه تایپ شده — انگلیسی به فارسی')
        )
      }
    }
  }

  // حالت ۲: واژه‌های فارسیِ درونِ متن انگلیسی → معکوس حالت بالا
  if (enCount >= MIN_FA_CONTEXT && faCount >= MIN_LAYOUT_RUN && faCount <= Math.max(10, Math.round(total * 0.4))) {
    for (const m of text.matchAll(new RegExp(`[${FA_LETTER_CLASS}]+`, 'g'))) {
      const run = m[0]
      if (run.length < MIN_LAYOUT_RUN) continue
      const mapped = mapChars(run, FA2EN_LETTERS)
      // «اعتبار انگلیسی»: بدون نویسهٔ کیبوردی باقی‌مانده و دست‌کم دو مصوت
      const stripped = mapped.replace(/[';,.\-]/g, '')
      const vowels = (stripped.match(/[aeiou]/gi) ?? []).length
      if (/^[a-zA-Z]*$/.test(stripped) && stripped.length >= 3 && vowels >= 2) {
        edits.push(
          mk('layout', m.index, m.index + run.length, run, mapped,
            'احتمالاً با چیدمان اشتباه تایپ شده — فارسی به انگلیسی')
        )
      }
    }
  }
  return edits
}

/* ------------------------------------------------------------------ */
/*  ۲) حروف عربی → فارسی و ۳) یکسان‌سازی ارقام                          */
/* ------------------------------------------------------------------ */

const AR_TO_FA_DIGIT_OFFSET = 0x06f0 - 0x0660

function detectCharAndDigitEdits(text: string, mk: MkFn): NyEdit[] {
  const edits: NyEdit[] = []

  // نویسه‌به‌نویسه: ی عربی، ک عربی، ة و ى
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i]
    let to = ''
    if (ch === '\u064a') to = 'ی' // ي → ی
    else if (ch === '\u0643') to = 'ک' // ك → ک
    else if (ch === '\u0629') to = 'ه' // ة → ه
    else if (ch === '\u0649') to = 'ی' // ى → ی
    else if (ch >= '\u0660' && ch <= '\u0669') {
      // ارقام عربی ٠-٩ همیشه به فارسی برمی‌گردند
      edits.push(mk('digit', i, i + 1, ch, String.fromCharCode(ch.charCodeAt(0) + AR_TO_FA_DIGIT_OFFSET),
        'یکسان‌سازی ارقام به ۰-۹ فارسی'))
      continue
    }
    if (to !== '') edits.push(mk('char', i, i + 1, ch, to, 'معادل فارسی این حرف عربی'))
  }

  // ارقام لاتین فقط «در بافت فارسی» فارسی می‌شوند (کد و آدرس خراب نمی‌شود)
  for (const m of text.matchAll(/[0-9]+/g)) {
    const before = neighborNonSpace(text, m.index, -1)
    const after = neighborNonSpace(text, m.index + m[0].length - 1, 1)
    if (!isFaish(before) && !isFaish(after)) continue
    let to = ''
    for (const ch of m[0]) to += String.fromCharCode(ch.charCodeAt(0) + (0x06f0 - 0x30))
    edits.push(mk('digit', m.index, m.index + m[0].length, m[0], to, 'ارقام لاتین در متن فارسی'))
  }
  return edits
}

/* ------------------------------------------------------------------ */
/*  ۴) نیم‌فاصله (ZWNJ): پیشوند «می/نمی» و پسوندها                      */
/* ------------------------------------------------------------------ */

function detectZwnjEdits(text: string, mk: MkFn): NyEdit[] {
  const edits: NyEdit[] = []

  // «می گفت» → «می‌گفت» — واژهٔ بعدی باید با حرف فارسی آغاز شود و کوتاه نباشد
  const prefixRe = new RegExp(`(^|[^${FA_WORD_CLASS}])(ن?می)[ \\t]+([${FA_LETTER_CLASS}][${FA_WORD_CLASS}]*)`, 'g')
  for (const m of text.matchAll(prefixRe)) {
    const head = m[2] // می یا نمی
    const word = m[3]
    if (word.length < 2) continue
    const start = m.index + m[1].length
    const from = head + ' ' + word
    edits.push(mk('zwnj', start, start + from.length, from, head + NY_ZWNJ + word,
      '«می» با فعل نیم‌فاصله می‌گیرد'))
  }

  // «خانه ها» → «خانه‌ها» — پسوندهای رایج بعد از یک واژهٔ فارسی
  const suffixRe = new RegExp(
    `([${FA_LETTER_CLASS}][${FA_WORD_CLASS}]*)[ \\t]+(${ZWNJ_SUFFIXES.join('|')})(?=$|[^${FA_WORD_CLASS}])`,
    'g'
  )
  for (const m of text.matchAll(suffixRe)) {
    const start = m.index
    const end = start + m[0].length
    const from = text.slice(start, end)
    const to = m[1] + NY_ZWNJ + m[2]
    if (from === to) continue
    edits.push(mk('zwnj', start, end, from, to, 'پسوند با نیم‌فاصله به واژه می‌چسبد'))
  }
  return edits
}

/* ------------------------------------------------------------------ */
/*  ۵) نشانه‌های نگارشی: فاصله‌گذاری + تبدیل ASCII به فارسی              */
/* ------------------------------------------------------------------ */

const PUNCT_CLASS = '،؛,;.!؟?:…'

function detectPunctEdits(text: string, mk: MkFn): NyEdit[] {
  const edits: NyEdit[] = []
  for (const m of text.matchAll(new RegExp(`[${PUNCT_CLASS}]`, 'g'))) {
    const i = m.index
    const ch = m[0]
    const prev = i > 0 ? text[i - 1] : ''
    const next = i + 1 < text.length ? text[i + 1] : ''

    // جداکنندهٔ رقم‌ها («۱،۵۰۰» یا 3.14) دست‌نخورده می‌ماند
    if ((ch === ',' || ch === '.') && isDigit(prev) && isDigit(next)) continue

    // فاصلهٔ اضافی «قبل از» نشانه (برای هر دو زبان درست است)
    if (prev === ' ' || prev === '\t') {
      let s = i - 1
      while (s > 0 && (text[s - 1] === ' ' || text[s - 1] === '\t')) s -= 1
      edits.push(mk('punct', s, i, text.slice(s, i), '', 'فاصلهٔ اضافی پیش از نشانهٔ نگارشی'))
    }

    // تبدیل ASCII به معادل فارسی — فقط با بافت فارسی (متن انگلیسی سالم می‌ماند)
    let converted = ch
    if ((ch === ',' || ch === ';' || ch === '?') && (isFaish(prev) || isFaish(next))) {
      converted = ch === ',' ? '،' : ch === ';' ? '؛' : '؟'
    }

    // فاصلهٔ جاافتادهٔ «بعد از» نشانه؛ بخشِ بعدی برای تفاوتِ خوانا در پیش‌نمایش است
    const run = text.slice(i + 1).match(new RegExp(`^[${FA_LETTER_CLASS}a-zA-Z\\u06F0-\\u06F90-9«]{1,12}`))
    if (run && !(isDigit(prev) && isDigit(next) && (ch === ',' || ch === '.'))) {
      const from = ch + run[0]
      const to = converted + ' ' + run[0]
      if (from !== to) {
        edits.push(mk('punct', i, i + 1 + run[0].length, from, to,
          converted === ch ? 'بعد از نشانهٔ نگارشی یک فاصله لازم است' : 'نشانهٔ فارسی + فاصلهٔ بعد از آن'))
      }
    } else if (converted !== ch) {
      edits.push(mk('punct', i, i + 1, ch, converted, 'معادل فارسی این نشانه'))
    }
  }
  return edits
}

/* ------------------------------------------------------------------ */
/*  ۶) گیومهٔ فارسی به‌جای کوتیشن مستقیم                                */
/* ------------------------------------------------------------------ */

function detectQuoteEdits(text: string, mk: MkFn): NyEdit[] {
  const edits: NyEdit[] = []
  const marks: number[] = []
  for (let i = 0; i < text.length; i += 1) if (text[i] === '"') marks.push(i)
  // جفت‌های زوج باز/بسته می‌شوند؛ کوتیشن بی‌جفت رها می‌شود
  for (let k = 0; k + 1 < marks.length; k += 2) {
    edits.push(mk('quote', marks[k], marks[k] + 1, '"', '«', 'گیومهٔ فارسی به‌جای کوتیشن'))
    edits.push(mk('quote', marks[k + 1], marks[k + 1] + 1, '"', '»', 'گیومهٔ فارسی به‌جای کوتیشن'))
  }
  return edits
}

/* ------------------------------------------------------------------ */
/*  ۷) فاصله‌ها: لبه‌های خط، فاصله‌های تکراری، خط خالی اضافی              */
/* ------------------------------------------------------------------ */

function detectSpaceEdits(text: string, mk: MkFn): NyEdit[] {
  const edits: NyEdit[] = []

  // بریدن ابتدا و انتهای کل متن
  const leadAll = text.match(/^[ \t\n\r]+/)
  if (leadAll) edits.push(mk('space', 0, leadAll[0].length, leadAll[0], '', 'فاصلهٔ ابتدای متن'))
  const trailAll = text.match(/[ \t\n\r]+$/)
  if (trailAll) {
    edits.push(mk('space', text.length - trailAll[0].length, text.length, trailAll[0], '', 'فاصلهٔ انتهای متن'))
  }

  // پیمایش خط‌به‌خط برای لبه‌ها و فاصله‌های درونی
  let off = 0
  for (const line of text.split('\n')) {
    const lead = line.match(/^[ \t]+/)
    // اگر کل خط فاصله باشد، خط خالیِ مشروع است و دست نمی‌خورد
    if (lead && lead[0].length !== line.length) {
      edits.push(mk('space', off, off + lead[0].length, lead[0], '', 'فاصلهٔ ابتدای خط'))
    }
    const trail = line.match(/[ \t]+$/)
    if (trail && trail[0].length !== line.length) {
      edits.push(mk('space', off + line.length - trail[0].length, off + line.length, trail[0], '',
        'فاصلهٔ اضافی پیش از پایان خط'))
    }
    for (const m of line.matchAll(/[ \t]{2,}/g)) {
      const s = off + m.index
      const e = s + m[0].length
      const before = s > 0 ? text[s - 1] : ''
      const after = e < text.length ? text[e] : ''
      // فقط فاصله‌های «درونی» جمع می‌شوند تا با لبه‌ها تداخل نکنند
      if (before !== '' && after !== '' && !/[ \t]/.test(before) && !/[ \t]/.test(after)) {
        edits.push(mk('space', s, e, m[0], ' ', 'فاصله‌های تکراری'))
      }
    }
    off += line.length + 1
  }

  // بیش از یک خط خالی پشت‌سرهم → حداکثر یک خط خالی می‌ماند
  for (const m of text.matchAll(/\n(?:[ \t]*\n){2,}/g)) {
    edits.push(mk('space', m.index, m.index + m[0].length, m[0], '\n\n', 'بیش از یک خط خالی پشت‌سرهم'))
  }
  return edits
}

/* ------------------------------------------------------------------ */
/*  ۸) اغلاط رایج (واژه‌ای + عبارت «می باشد»)                           */
/* ------------------------------------------------------------------ */

function detectTypoEdits(text: string, mk: MkFn): NyEdit[] {
  const edits: NyEdit[] = []

  // عبارت «می باشد» → «است» (توصیهٔ رایج ویرایشی)
  const phraseRe = new RegExp(`(^|[^${FA_WORD_CLASS}])می[ \\t]+باشد(?=$|[^${FA_WORD_CLASS}])`, 'g')
  for (const m of text.matchAll(phraseRe)) {
    const start = m.index + m[1].length
    const from = m[0].slice(m[1].length)
    edits.push(mk('typo', start, start + from.length, from, 'است',
      'به‌جای «می‌باشد» از «است» استفاده کنید'))
  }

  // واژه‌به‌واژه با جدول اغلاط
  const tokenRe = new RegExp(`[${FA_LETTER_CLASS}][${FA_WORD_CLASS}]*`, 'g')
  for (const m of text.matchAll(tokenRe)) {
    const fix = TYPO_MAP[m[0]]
    if (fix && fix.to !== m[0]) {
      edits.push(mk('typo', m.index, m.index + m[0].length, m[0], fix.to, fix.reason))
    }
  }
  return edits
}

/* ------------------------------------------------------------------ */
/*  ۹) واژهٔ تکراری پشت‌سرهم                                            */
/* ------------------------------------------------------------------ */

function detectRepeatEdits(text: string, mk: MkFn): NyEdit[] {
  const edits: NyEdit[] = []
  const tokens: Array<{ word: string; start: number; end: number }> = []
  const tokenRe = new RegExp(`[${FA_LETTER_CLASS}][${FA_WORD_CLASS}]*`, 'g')
  for (const m of text.matchAll(tokenRe)) {
    tokens.push({ word: m[0], start: m.index, end: m.index + m[0].length })
  }
  for (let i = 0; i < tokens.length; i += 1) {
    // زنجیرهٔ تکرار مثل «که که که» تا انتهایش گسترش می‌یابد
    let j = i + 1
    while (
      j < tokens.length &&
      tokens[i].word.length >= 2 &&
      tokens[j].word === tokens[i].word &&
      /^[ \t]+$/.test(text.slice(tokens[j - 1].end, tokens[j].start))
    ) {
      j += 1
    }
    if (j > i + 1) {
      const last = tokens[j - 1]
      const start = tokens[i].start
      const end = last.end
      edits.push(mk('repeat', start, end, text.slice(start, end), tokens[i].word,
        'واژهٔ تکراری پشت‌سرهم'))
      i = j - 1
    }
  }
  return edits
}

/* ------------------------------------------------------------------ */
/*  ادغام ویرایش‌ها (بدون هم‌پوشانی و مرتب) و اعمال آن‌ها                */
/* ------------------------------------------------------------------ */

type MkFn = (type: NyEditType, start: number, end: number, from: string, to: string, reason: string) => NyEdit

/** ساخت ویرایش با شناسهٔ قطعی (بدون تصادف — امن برای تست) */
function makeIdFactory(): MkFn {
  let seq = 0
  return (type, start, end, from, to, reason) => {
    const edit: NyEdit = { id: `${type}:${start}:${end}:${seq}`, type, start, end, from, to, reason }
    seq += 1
    return edit
  }
}

/**
 * مرتب‌سازی صعودی بر اساس موقعیت + حذف هم‌پوشانی‌ها.
 * در برخورد: پیشنهادِ زودترشروع‌شونده، بلندتر و پراولویت‌تر برنده می‌شود.
 */
function mergeEdits(edits: NyEdit[]): NyEdit[] {
  const sorted = [...edits].sort(
    (a, b) =>
      a.start - b.start ||
      b.end - b.start - (a.end - a.start) ||
      TYPE_PRIORITY[a.type] - TYPE_PRIORITY[b.type]
  )
  const out: NyEdit[] = []
  let lastEnd = -1
  for (const e of sorted) {
    if (e.from === e.to) continue // پیشنهاد بی‌اثر
    if (e.start < lastEnd) continue // با برندهٔ قبلی تداخل دارد
    out.push(e)
    lastEnd = e.end
  }
  return out
}

/** اعمال ویرایش‌ها از انتها به آغاز تا مختصات‌ها جابه‌جا نشوند */
export function applyEdits(text: string, edits: readonly NyEdit[]): string {
  const sorted = [...edits].sort((a, b) => b.start - a.start)
  let out = text
  for (const e of sorted) {
    if (!Number.isInteger(e.start) || !Number.isInteger(e.end)) continue
    if (e.start < 0 || e.end > out.length || e.start > e.end) continue
    out = out.slice(0, e.start) + e.to + out.slice(e.end)
  }
  return out
}

/* ------------------------------------------------------------------ */
/*  تحلیل آماری متن                                                    */
/* ------------------------------------------------------------------ */

const HAS_WORD = new RegExp(`[${FA_LETTER_CLASS}a-zA-Z0-9\\u06F0-\\u06F9]`)

function computeAnalysis(text: string): NyAnalysis {
  const trimmed = text.trim()
  const wordTokens = trimmed === '' ? [] : trimmed.split(/\s+/).filter((w) => HAS_WORD.test(w))
  const words = wordTokens.length

  // جمله‌ها: قطعه‌های میان نشانه‌های پایان جمله یا خط جدید
  const pieces: string[] = []
  for (const m of trimmed.matchAll(/[^.!؟…؛\n]+/g)) {
    const piece = m[0].trim()
    if (piece !== '' && HAS_WORD.test(piece)) pieces.push(piece)
  }
  const sentences = pieces.length
  const longSentences: number[] = []
  pieces.forEach((piece, idx) => {
    const wc = piece.split(/\s+/).filter((w) => HAS_WORD.test(w)).length
    if (wc > LONG_SENTENCE_WORDS) longSentences.push(idx + 1) // شمارهٔ جمله از ۱
  })

  const paragraphs =
    trimmed === '' ? 0 : trimmed.split(/\n[ \t]*\n/).filter((p) => p.trim() !== '').length

  const avgSentence = sentences === 0 ? 0 : Math.round((words / sentences) * 10) / 10
  const readability: NyReadability =
    sentences === 0 || avgSentence <= 14 ? 'آسان' : avgSentence <= 24 ? 'متوسط' : 'دشوار'

  // واژه‌های پرتکرار (بدون واژه‌های ساختاری)
  const freq = new Map<string, number>()
  const tokenRe = new RegExp(`[${FA_LETTER_CLASS}][${FA_WORD_CLASS}]*`, 'g')
  for (const m of trimmed.matchAll(tokenRe)) {
    const w = m[0].split(NY_ZWNJ).join('')
    if (w.length < 3 || STOPWORDS.has(w)) continue
    freq.set(w, (freq.get(w) ?? 0) + 1)
  }
  const repeats = [...freq.entries()]
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'fa'))
    .slice(0, MAX_REPEATS)
    .map(([word, count]) => ({ word, count }))

  return {
    words,
    sentences,
    paragraphs,
    chars: text.length,
    avgSentence,
    longSentences,
    readability,
    repeats,
  }
}

/** فقط تحلیل آماری — بدون تولید پیشنهاد */
export function analyzeOnly(text: string): NyAnalysis {
  return computeAnalysis(text)
}

/* ------------------------------------------------------------------ */
/*  تحلیل کامل                                                         */
/* ------------------------------------------------------------------ */

/**
 * تحلیل کامل متن: همهٔ پیشنهادها روی متنِ اصلی مختصات‌گذاری شده‌اند،
 * بدون هم‌پوشانی و مرتب‌اند. هیچ پیشنهادِ چیدمانی خودکار اعمال نمی‌شود.
 */
export function analyzeText(text: string): NyResult {
  const mk = makeIdFactory()
  const raw: NyEdit[] = [
    ...detectLayoutEdits(text, mk),
    ...detectCharAndDigitEdits(text, mk),
    ...detectZwnjEdits(text, mk),
    ...detectPunctEdits(text, mk),
    ...detectQuoteEdits(text, mk),
    ...detectSpaceEdits(text, mk),
    ...detectTypoEdits(text, mk),
    ...detectRepeatEdits(text, mk),
  ]
  return { edits: mergeEdits(raw), analysis: computeAnalysis(text) }
}

/* ------------------------------------------------------------------ */
/*  تبدیل دستی چیدمان کیبورد (دکمهٔ fa ↔ en نوار ابزار)                 */
/* ------------------------------------------------------------------ */

export type NyLayoutDir = 'fa2en' | 'en2fa'

/** نگاشت نویسه‌به‌نویسهٔ کل متن با چیدمان استاندارد؛ نویسه‌های ناشناخته دست‌نخورده می‌مانند */
export function layoutConvert(text: string, dir: NyLayoutDir): string {
  return mapChars(text, dir === 'en2fa' ? EN2FA_FULL : FA2EN_FULL)
}
