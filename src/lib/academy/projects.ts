/**
 * Sanjab Project Lab — پروژه‌های هدایت‌شده
 *
 * هر پروژه به مهارت‌های واقعی وصل است، مراحل (Task List) دارد، با
 * PyodideRunner اجرا و با تست‌های خودکار سنجیده می‌شود. تکمیل پروژه
 * شواهد واقعی برای Skill Mastery تولید می‌کند — نه Fake Progress.
 */
import type { TrackId } from '@/lib/learning/types'

export interface ProjectStep {
  id: string
  title: string
  hint: string
}

export interface LearningProject {
  id: string
  track: TrackId
  title: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  /** مهارت‌هایی که این پروژه می‌سنجد */
  skillIds: string[]
  description: string
  steps: ProjectStep[]
  /** کد شروع — فقط برای پروژه‌های پایتون */
  starter?: string
  /** تست خودکار پایتون (مثل الگوی PY_PASS آکادمی) */
  tests?: string
  /** نحوهٔ اجرا */
  runtime: 'pyodide' | 'manual'
  outcome: string
}

export const PASS_MARK = '___SANJAB_OK___'

export const PROJECTS: LearningProject[] = [
  {
    id: 'pj-todo',
    track: 'python',
    title: 'اپ کارهای روزانه (CLI)',
    difficulty: 'beginner',
    skillIds: ['py-data', 'py-funcs', 'py-projects'],
    description:
      'یک برنامهٔ خط فرمانی که کارها را در یک لیست نگه می‌دارد: افزودن، حذف، نمایش. تمرین واقعی دیکشنری، حلقه و تابع.',
    runtime: 'pyodide',
    steps: [
      { id: 's1', title: 'ساختار دادهٔ کارها را طراحی کن (لیستی از دیکشنری‌ها با title و done)', hint: 'tasks = [{"title": "...", "done": False}]' },
      { id: 's2', title: 'تابع add_task بنویس', hint: 'تا انتها append کن' },
      { id: 's3', title: 'تابع complete_task با شمارهٔ کار', hint: 'ایندکس از ۱ شروع می‌شود — به کاربر نشان بده' },
      { id: 's4', title: 'تابع show_tasks با علامت ✓/✗', hint: 'برای هر کار: "[✓]" اگر done' },
      { id: 's5', title: 'تست‌های خودکار را پاس کن', hint: 'دکمهٔ «اجرای تست‌ها» را بزن' },
    ],
    starter:
      '# اپ کارهای روزانه\ntasks = []\n\ndef add_task(title):\n    # TODO: یک دیکشنری با title و done=False به tasks اضافه کن\n    pass\n\ndef complete_task(num):\n    # TODO: کار شمارهٔ num (از ۱) را done=True کن\n    pass\n\ndef show_tasks():\n    # TODO: لیست را چاپ کن — "[✓] خرید" یا "[✗] خرید"\n    pass\n',
    tests:
      'add_task("خرید")\nadd_task("مطالعه")\nassert len(tasks) == 2, "دو کار باید اضافه شده باشد"\nassert tasks[0]["title"] == "خرید", "عنوان اول درست نیست"\nassert tasks[0]["done"] == False, "کار تازه باید ناتمام باشد"\ncomplete_task(1)\nassert tasks[0]["done"] == True, "کار ۱ باید کامل شده باشد"\ncomplete_task(2)\nassert tasks[1]["done"] == True, "کار ۲ باید کامل شده باشد"\nprint("___SANJAB_OK___")',
    outcome: 'کار با دیکشنری، تابع و ایندکس‌گذاری را در یک محصول واقعی به‌کار می‌بری.',
  },
  {
    id: 'pj-guess',
    track: 'python',
    title: 'بازی حدس عدد',
    difficulty: 'beginner',
    skillIds: ['py-control', 'py-projects'],
    description:
      'بازی معروف: کامپیوتر عدد می‌اندیشد، تابع check guesses را ارزیابی می‌کند. تمرین شرط، حلقه و state.',
    runtime: 'pyodide',
    steps: [
      { id: 's1', title: 'تابع check_guess(g, secret) بنویس که "بیشتر"، "کمتر" یا "درست" برگرداند', hint: 'سه شاخهٔ if/elif/else' },
      { id: 's2', title: 'تابع play(secret, guesses) که تعداد تلاش لازم را برگرداند', hint: 'روی لیست guesses حلقه بزن تا به secret برسی' },
      { id: 's3', title: 'تست‌های خودکار را پاس کن', hint: 'خروجی دقیق مهم است: "بیشتر" وقتی g < secret' },
    ],
    starter:
      'def check_guess(g, secret):\n    # TODO: g < secret → "بیشتر" ، g > secret → "کمتر" ، مساوی → "درست"\n    pass\n\ndef play(secret, guesses):\n    # TODO: روی guesses پیمایش کن؛ تعداد حدس تا رسیدن به "درست" را برگردان\n    # اگر هیچ‌وقت درست نشد، -1 برگردان\n    pass\n',
    tests:
      'assert check_guess(3, 5) == "بیشتر", "۳ کمتر از ۵ است → باید بیشتر حدس بزنی"\nassert check_guess(7, 5) == "کمتر", "۷ بیشتر از ۵ است"\nassert check_guess(5, 5) == "درست"\nassert play(5, [3, 7, 5]) == 3, "سه حدس لازم بود"\nassert play(4, [1, 2, 4]) == 3\nassert play(9, [1, 2]) == -1, "پیدا نشد → -1"\nprint("___SANJAB_OK___")',
    outcome: 'منطق شرطی و trace کردن state بازی را مسلط می‌شوی.',
  },
  {
    id: 'pj-analyzer',
    track: 'python',
    title: 'تحلیل‌گر داده‌های فروش',
    difficulty: 'intermediate',
    skillIds: ['py-data', 'py-funcs', 'py-projects'],
    description:
      'از روی لیست فروش‌ها: میانگین، بهترین روز و پیدا کردن روزهای بالای هدف. تمرین واقعی پردازش داده — پایهٔ Data Analysis.',
    runtime: 'pyodide',
    steps: [
      { id: 's1', title: 'تابع average(values) بدون استفاده از sum() آماده', hint: 'حلقه + شمارنده' },
      { id: 's2', title: 'تابع best_day(sales) که روزِ بیشترین فروش را برگرداند', hint: 'sales دیکشنری روز→عدد است؛ max را دستی پیدا کن' },
      { id: 's3', title: 'تابع above_target(sales, t) فهرست روزهای بالای هدف', hint: 'لیست کامپرهنشن هم قبول است' },
      { id: 's4', title: 'تست‌های خودکار را پاس کن', hint: 'خروجی average گرد نشده و float باشد' },
    ],
    starter:
      'sales = {"شنبه": 120, "یکشنبه": 95, "دوشنبه": 210, "سه‌شنبه": 180}\n\ndef average(values):\n    # TODO: میانگین را با حلقه حساب کن (بدون sum())\n    pass\n\ndef best_day(sales):\n    # TODO: کلید روزی که بیشترین فروش را دارد برگردان\n    pass\n\ndef above_target(sales, target):\n    # TODO: لیست روزهایی که فروششان > target است\n    pass\n',
    tests:
      'assert abs(average([10, 20, 30]) - 20.0) < 1e-9, "میانگین ۲۰ است"\nassert abs(average([5]) - 5.0) < 1e-9\nassert best_day(sales) == "دوشنبه", "بیشترین فروش ۲۱۰ است"\nassert above_target(sales, 100) == ["شنبه", "دوشنبه", "سه‌شنبه"], "روزهای بالای ۱۰۰"\nassert above_target(sales, 300) == [], "هیچ روزی بالای ۳۰۰ نیست"\nprint("___SANJAB_OK___")',
    outcome: 'پردازش دیکشنری و لیست در یک سناریوی دادهٔ واقعی.',
  },
  {
    id: 'pj-sortviz',
    track: 'algorithm',
    title: 'مقایسه‌گر الگوریتم‌های مرتب‌سازی',
    difficulty: 'advanced',
    skillIds: ['al-sorting', 'al-analysis'],
    description:
      'یک تابع بنویس که روی یک آرایه، تعداد مقایسه‌های حبابی و درجی را بشمارد و گزارش بدهد — با ورودی‌های مرزی که خودت تست می‌کنی.',
    runtime: 'pyodide',
    steps: [
      { id: 's1', title: 'bubble_comparisons(arr) بنویس — تعداد مقایسه‌ها (نه جابه‌جایی) را برگرداند', hint: 'n(n-1)/2 اگر بهینه‌سازی زودپایان نکنی؛ با پرچم ممکن است کمتر شود' },
      { id: 's2', title: 'insertion_comparisons(arr) — تعداد مقایسه‌های درجی', hint: 'هر بار که key با عنصر چپ مقایسه می‌شود یکی اضافه کن' },
      { id: 's3', title: 'برای [1,2,3,4,5] (مرتب) هر دو را بسنج — درجی باید کمتر باشد', hint: 'درجی روی مرتب: فقط ۴ مقایسه' },
      { id: 's4', title: 'تست‌های خودکار را پاس کن', hint: 'آرایهٔ خالی و تک‌عنصری را هم در نظر بگیر' },
    ],
    starter:
      'def bubble_comparisons(arr):\n    # TODO: کپی آرایه را با حبابی مرتب کن و تعداد مقایسه‌ها را برگردان\n    # (پرچم zودپایان مجاز است)\n    a = list(arr)\n    n = len(a)\n    count = 0\n    # TODO: حلقه‌ها + شمارش مقایسه\n    return count\n\ndef insertion_comparisons(arr):\n    a = list(arr)\n    count = 0\n    # TODO: درجی + شمارش مقایسه\n    return count\n',
    tests:
      'assert bubble_comparisons([]) == 0, "آرایه خالی"\nassert bubble_comparisons([1]) == 0, "تک عنصری"\nassert insertion_comparisons([]) == 0\nassert insertion_comparisons([2,1]) == 1, "یک مقایسه، یک شیفت"\nassert insertion_comparisons([1,2,3,4,5]) == 4, "آرایهٔ مرتب: n-1 مقایسه"\nassert insertion_comparisons([5,4,3,2,1]) == 10, "معکوس: 1+2+3+4"\nassert bubble_comparisons([1,2,3]) < 10, "با پرچم روی مرتب ۲ مقایسه"\nprint("___SANJAB_OK___")',
    outcome: 'پیچیدگی را نه حفظ، که با شمارش واقعی «می‌بینی» — تحلیل را تجربه می‌کنی.',
  },
  {
    id: 'pj-search-mini',
    track: 'algorithm',
    title: 'موتور جست‌وجوی مینیاتوری',
    difficulty: 'advanced',
    skillIds: ['al-searching', 'al-hashtable'],
    description:
      'یک ایندکس معکوس (Inverted Index) بساز: از متن چند سند، دیکشنریِ «کلمه → لیست اسناد» بساز و جست‌وجو با O(1) lookup انجام بده — قلب هر موتور جست‌وجو.',
    runtime: 'pyodide',
    steps: [
      { id: 's1', title: 'تابع build_index(docs) بساز — docs دیکشنری شماره→متن است', hint: 'هر سند را به کلمات بشکن (split) و lowercase کن' },
      { id: 's2', title: 'تابع search(index, word) لیست شمارهٔ اسناد حاوی کلمه', hint: 'اگر کلمه در ایندکس نبود [] برگردان' },
      { id: 's3', title: 'جست‌وجوی دو کلمه‌ای: اسناد مشترک', hint: 'اشتراک دو لیست' },
      { id: 's4', title: 'تست‌های خودکار را پاس کن', hint: 'حالت کلمهٔ غایب را چک کن' },
    ],
    starter:
      'docs = {\n    1: "پایتون زبان ساده است",\n    2: "الگوریتم مهم است",\n    3: "پایتون برای الگوریتم خوب است",\n}\n\ndef build_index(docs):\n    # TODO: دیکشنری کلمه → لیست شمارهٔ اسناد بساز\n    index = {}\n    # TODO\n    return index\n\ndef search(index, word):\n    # TODO\n    pass\n\ndef search_two(index, w1, w2):\n    # TODO: اسناد مشترک دو کلمه — مرتب‌شده\n    pass\n',
    tests:
      'idx = build_index(docs)\nassert search(idx, "پایتون") == [1, 3], "پایتون در اسناد ۱ و ۳"\nassert search(idx, "الگوریتم") == [2, 3]\nassert search(idx, "چیزی") == [], "کلمهٔ غایب"\nassert search_two(idx, "پایتون", "الگوریتم") == [3], "فقط سند ۳ هر دو را دارد"\nprint("___SANJAB_OK___")',
    outcome: 'ایندکس معکوس می‌سازی — همان ساختاری که موتورهای جست‌وجو و RAG استفاده می‌کنند.',
  },
  {
    id: 'pj-shell-backup',
    track: 'linux',
    title: 'اسکریپت پشتیبان‌گیری لینوکس',
    difficulty: 'intermediate',
    skillIds: ['lx-terminal', 'lx-admin'],
    description:
      'یک اسکریپت بش واقعی طراحی می‌کنی که پوشه‌ها را با تاریخ پشتیبان می‌گیرد و قدیمی‌ها را پاک می‌کند. (بررسی با شبیه‌ساز ترمینال + آزمون مفهومی)',
    runtime: 'manual',
    steps: [
      { id: 's1', title: 'متغیر BACKUP_DIR با تاریخ (date +%F) بساز', hint: 'BACKUP_DIR="/backup/$(date +%F)"' },
      { id: 's2', title: 'با tar -czf پوشهٔ را فشرده کن', hint: 'tar -czf "$BACKUP_DIR.tar.gz" /home/user/docs' },
      { id: 's3', title: 'فایل‌های قدیمی‌تر از ۷ روز را با find -mtime +7 حذف کن', hint: 'find /backup -name "*.tar.gz" -mtime +7 -delete' },
      { id: 's4', title: 'در ترمینال آکادمی لینوکس هر سه دستور را تمرین کن و مرحله‌ها را تیک بزن', hint: 'دستورها را در ترمینال آموزشی امتحان کن' },
    ],
    outcome: 'اتوماسیون واقعی لینوکس — cron-ready.',
  },
  {
    id: 'pj-neural',
    track: 'ai',
    title: 'نورون تک‌لایه از صفر',
    difficulty: 'intermediate',
    skillIds: ['ai-perceptron', 'ai-gradient'],
    description:
      'یک نورون با وزن‌های قابل آموزش می‌سازی: جمع وزنی، سیگموئید، و یک قدم گرادیان دستی. پایهٔ درک NN Lab آکادمی AI.',
    runtime: 'pyodide',
    steps: [
      { id: 's1', title: 'تابع sigmoid(x) بنویس', hint: '1 / (1 + math.exp(-x))' },
      { id: 's2', title: 'تابع predict(w, b, x) — جمع وزنی + سیگموئید', hint: 'sum(a*b for …) + b' },
      { id: 's3', title: 'یک قدم به‌روزرسانی: w = w - lr * grad', hint: 'grad = (pred - target) * x' },
      { id: 's4', title: 'تست‌ها را پاس کن', hint: 'sigmoid(0) = 0.5' },
    ],
    starter:
      'import math\n\ndef sigmoid(x):\n    # TODO\n    pass\n\ndef predict(w, b, x):\n    # TODO: جمع وزنی + سیگموئید — خروجی float\n    pass\n\ndef train_step(w, b, x, target, lr):\n    # TODO: پیش‌بینی، خطا (pred-target)، به‌روزرسانی w و b\n    # خروجی: (w_new, b_new)\n    pass\n',
    tests:
      'assert abs(sigmoid(0) - 0.5) < 1e-9, "سیگموئید صفر = ۰٫۵"\nassert abs(sigmoid(100) - 1.0) < 1e-6, "سیگموئید خیلی بزرگ ≈ ۱"\nw, b = train_step(1.0, 0.0, 2.0, 1.0, 0.5)\np = predict(w, b, 2.0)\nassert p > 0.5, "بعد از یک قدم به هدف نزدیک‌تر باید باشد"\nprint("___SANJAB_OK___")',
    outcome: 'پرسپترون را نه به‌صورت تعریف، بلکه به‌صورت کد قابل آموزش لمس می‌کنی.',
  },
]

export function projectById(id: string): LearningProject | undefined {
  return PROJECTS.find((p) => p.id === id)
}
