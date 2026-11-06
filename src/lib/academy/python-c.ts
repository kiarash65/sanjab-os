/* ------------------------------------------------------------------ */
/* آکادمی پایتون — سطح ۸: پروژه‌های عملی                                */
/* ------------------------------------------------------------------ */

import type { PyLesson } from './python-a'
import { PY_PASS } from './python-a'

export const LESSONS_C: PyLesson[] = [
  {
    id: 'l8-calc',
    level: 8,
    title: 'پروژه ۱ — ماشین‌حساب و مبدأ واحدها',
    minutes: 20,
    learn: ['طراحی از مشخصات (spec)', 'پارس عبارت با دیکشنری عملگر', 'مدیریت خطای ورودی', 'گزارش‌گیری تمیز'],
    prereq: 'سطح‌های ۳ تا ۵',
    intro: 'اولین پروژه: ماشین‌حسابی که فقط با مشخصاتِ نوشتاری ساخته می‌شود — نه با دکمه. الگوی «دیکشنریِ عملگرها» را یاد می‌گیرید که در کارخانه‌های پارس واقعی هم هست.',
    analogy: 'ماشین‌حساب = رستورانِ سفارش‌محور: ورودی (سفارش) → پارس (گارسون) → اجرا (آشپزخانه) → خروجی (غذا). جدا کردن این سه مرحله، پروژه را قابل‌تست می‌کند — هر مرحله را جدا تست می‌کنیم.',
    technical: 'مشخصات: evaluate(expr: str) -> float با + - * / و پرانتز نه (فعلاً بدون پرانتز — ارزیابی چپ‌به‌راست با اولویت * /). parse: split با regex از عملگرها. اعمال از OPERATORS = {"+": add, ...} — دیکشنریِ توابع. خطاها: ورودی خالی، عملگر نامعتبر، تقسیم بر صفر → پیام فارسی، نه کرش.',
    example1: {
      title: 'اسکلت پروژه',
      code: 'OPERATORS = {\n    "+": lambda a, b: a + b,\n    "-": lambda a, b: a - b,\n    "*": lambda a, b: a * b,\n    "/": lambda a, b: a / b,\n}\n\ndef evaluate(expr: str) -> float:\n    parts = expr.split()\n    if len(parts) != 3:\n        raise ValueError("فرمت: عدد عملگر عدد")\n    a_str, op, b_str = parts\n    if op not in OPERATORS:\n        raise ValueError(f"عملگر ناشناخته: {op}")\n    a, b = float(a_str), float(b_str)\n    if op == "/" and b == 0:\n        raise ZeroDivisionError("تقسیم بر صفر")\n    return OPERATORS[op](a, b)\n\nprint(evaluate("12 * 4"))   # 48.0',
      explain: 'دقت کنید: فقط یک حلقه هم نداریم — کل ماشین‌حساب، دیکشنریِ lambda ها + اعتبارسنجی است. افزودن ** یعنی یک خط به دیکشنری.',
    },
    example2: {
      title: 'مبدأ واحدها — دامنهٔ دما',
      code: 'CONVERSIONS = {\n    ("c", "f"): lambda t: t * 9 / 5 + 32,\n    ("f", "c"): lambda t: (t - 32) * 5 / 9,\n    ("km", "mi"): lambda d: d * 0.621371,\n    ("kg", "lb"): lambda m: m * 2.204623,\n}\n\ndef convert(value: float, src: str, dst: str) -> float:\n    key = (src, dst)\n    if key not in CONVERSIONS:\n        raise ValueError("جفت واحدها پشتیبانی نمی‌شود")\n    return round(CONVERSIONS[key](value), 2)\n\nprint(convert(37, "c", "f"))     # 98.6\nprint(convert(10, "km", "mi"))   # 6.21',
      explain: 'کلید tuple — الگوی استاندارد جدول تبدیل. برای هر واحدِ جدید فقط یک خط. تست‌نویسی هم ساده: ورودی/خروجی معلوم.',
    },
    lineByLine: [
      'OPERATORS = {"+": lambda...} — دیکشنریِ توابع؛ select به‌جای if/elif زنجیره‌ای.',
      'parts = expr.split() — پارس اولیه؛ اعتبارسنجی طول.',
      'if op == "/" and b == 0: — گارد خطای منطقی قبل از اجرا.',
      'return OPERATORS[op](a, b) — صدا زدن تابع از دیکشنری.',
    ],
    mistakes: [
      'float(a_str) قبل از اعتبارسنجی عملگر — پیام خطا گمراه‌کننده می‌شود؛ اول ساختار، بعد مقدار.',
      'گرد کردن داخل محاسبات — فقط در نمایش گرد کنید.',
      'خوردن خطا با except و بازگشت 0 — کاربر فکر می‌کند درست حساب کرد!',
    ],
    exercise: {
      prompt: 'پروژه را کامل کنید: evaluate("2 + 3 * 4") باید با اولویت ضرب 14.0 بدهد. رشته را به توکن‌ها بشکنید (split با فاصله)، اول * و / را از چپ به راست اعمال کنید، بعد + و -. خروجی float.',
      starter: 'OPERATORS = {\n    "+": lambda a, b: a + b,\n    "-": lambda a, b: a - b,\n    "*": lambda a, b: a * b,\n    "/": lambda a, b: a / b,\n}\n\ndef evaluate(expr: str) -> float:\n    # توکن‌ها را بشکنید؛ اول * / سپس + -\n    ...\n\nprint(evaluate("2 + 3 * 4"))  # 14.0',
      tests: `assert evaluate("2 + 3 * 4") == 14.0\nassert evaluate("10 - 2 - 3") == 5.0, 'چپ‌به‌راست'\nassert evaluate("8 / 2 * 2") == 8.0\nassert evaluate("5 + 1") == 6.0\ntry:\n    evaluate("2 / 0")\n    assert False, 'باید خطا بدهد'\nexcept ZeroDivisionError:\n    pass\nprint('${PY_PASS}')`,
      hint: 'توکن‌ها را لیست کنید؛ حلقه: تا وقتی "*" یا "/" در لیست است، جای i-1,i,i+1 را با نتیجه عوض کنید. بعد برای + - همین کار.',
    },
    challenge: 'پرانتز را اضافه کنید: با stack، هر ( را فشار و ) را ارزیابی و جمع کنید.',
    summary: 'دیکشنریِ توابع = جداول انتخاب. پارس → اعتبارسنجی → اجرا → گزارش. اولویت عملگر = دو گذر. خطاها با معنا، نه کرش.',
    quiz: [
      { q: 'چرا دیکشنریِ عملگرها از if/elif بهتر؟', options: ['کوتاه‌تر', 'افزودن عملگر = یک خط، بدون تغییر منطق', 'سریع‌تر همیشه', 'لازم نیست'], answer: 1, why: 'جدولِ باز است — OCP به زبان ساده.' },
      { q: 'اولویت * بر + با چه الگویی پیاده می‌شود؟', options: ['sort', 'دو گذر: اول * / سپس + -', 'recursion', 'regex'], answer: 1, why: 'گذر اول عملگرهای قوی‌تر جمع می‌زند.' },
    ],
  },
  {
    id: 'l8-guess',
    level: 8,
    title: 'پروژه ۲ — بازی حدس عدد',
    minutes: 15,
    learn: ['حلقهٔ بازی و وضعیت', 'feedback مقایسه‌ای', 'شمارش تلاش و محدودیت', 'تکرارپذیری با seed', 'پوشهٔ تست برای منطق بازی'],
    prereq: 'حلقه‌ها، خطاها، random',
    intro: 'بازی حدس عدد، کوچک‌ترین «بازیِ کامل» دنیاست: وضعیت، حلقه، بازخورد، شرط برد/باخت. و بهترین تمرینِ جداسازیِ منطقِ بازی از UI.',
    analogy: 'منطقِ بازی = موتور ماشین؛ حلقهٔ تعاملی = فرمان و پدال. موتور باید بدون فرمان هم روی میزِ تست کار کند — پس guess_check(secret, guess) جدا می‌شود و تستش می‌شود.',
    technical: 'random.randint(1, 100) شمارهٔ مخفی؛ seed برای تکرارپذیریِ تست. تابع خالص check(secret, guess) -> str ("بالاتر"/"پایین‌تر"/"درست"). حلقهٔ بازی در run_game با try/except برای ورودی غلط. سقف تلاش (مثلاً ۷ — log2(100)≈6.64). اینجا در محیط بدون input واقعی، منطق را تست‌محور اجرا می‌کنیم.',
    example1: {
      title: 'موتور بازی — خالص و تست‌پذیر',
      code: 'import random\n\ndef check(secret: int, guess: int) -> str:\n    if guess == secret:\n        return "درست"\n    return "بالاتر" if guess < secret else "پایین‌تر"\n\ndef run_game(secret: int, guesses: list[int]) -> dict:\n    tries = 0\n    for g in guesses:\n        tries += 1\n        result = check(secret, g)\n        if result == "درست":\n            return {"win": True, "tries": tries}\n    return {"win": False, "tries": tries}\n\nprint(check(50, 30), check(50, 70), check(50, 50))\nprint(run_game(42, [10, 50, 42]))',
      explain: 'run_game ورودی‌هایش را از بیرون می‌گیرد (تزریق وابستگیِ مینی) — پس تست بدون تعامل ممکن است. همین الگو در بازی‌های بزرگ هم هست.',
    },
    example2: {
      title: 'تکرارپذیری — seed و تست',
      code: 'import random\n\nrandom.seed(7)\nsecret = random.randint(1, 100)\nprint(secret)          # همیشه همان عدد با seed=7\n\n# استراتژی دودویی خودکار — بازیکن ربات:\ndef robot_play(secret: int, low: int = 1, high: int = 100) -> int:\n    tries = 0\n    while low <= high:\n        tries += 1\n        mid = (low + high) // 2\n        r = check(secret, mid)\n        if r == "درست":\n            return tries\n        if r == "بالاتر":\n            low = mid + 1\n        else:\n            high = mid - 1\n    return tries\n\nprint(robot_play(42))  # ۷ تلاش — دقیقاً log2(100)',
      explain: 'رباتِ دودویی حداکثر ۷ تلاش می‌کند — همان مرزی که به بازیکن می‌دهیم. ریاضیِ پشت طراحی بازی: سقف تلاش از log2 بازه.',
    },
    lineByLine: [
      'random.seed(7) — دنبالهٔ تصادفی قفل می‌شود؛ تست تکرارپذیر.',
      'return "بالاتر" if guess < secret else "پایین‌تر" — بازخوردِ جهت‌دار.',
      'for g in guesses: — شبیه‌سازیِ دفعات حدس بدون input واقعی.',
      '{"win": True, "tries": tries} — خروجی ساختاریافته؛ UI رشته می‌سازد.',
    ],
    mistakes: [
      'منطق داخل حلقهٔ تعاملی — غیرقابل تست؛ موتور را خالص کنید.',
      'جای "بالاتر"/"پایین‌تر" عوض — بازیکن در جهت غلط جستجو می‌کند!',
      'سقف تلاش بیش از log2(بازه) — بازی بی‌چالش؛ کمتر — ناعادلانه.',
    ],
    exercise: {
      prompt: 'پروژه: تابع check(secret, guess) با بازخورد «بالاتر»/«پایین‌تر»/«درست» و run_game(secret, guesses) که {"win": bool, "tries": int} برگرداند. تست: حدس‌های [10, 50, 42] برای secret=42 باید برد در تلاش سوم باشد.',
      starter: 'def check(secret: int, guess: int) -> str:\n    ...\n\ndef run_game(secret: int, guesses: list) -> dict:\n    ...\n\nprint(run_game(42, [10, 50, 42]))',
      tests: `assert check(50, 30) == 'بالاتر'\nassert check(50, 70) == 'پایین‌تر'\nassert check(50, 50) == 'درست'\nr = run_game(42, [10, 50, 42])\nassert r == {'win': True, 'tries': 3}, f'{r}'\nassert run_game(42, [1, 2]) == {'win': False, 'tries': 2}\nprint('${PY_PASS}')`,
      hint: 'check مثل مثال؛ run_game با حلقه for و return زودهنگام.',
    },
    challenge: 'hint سیستم بسازید: بعد از ۳ تلاش غلط، بگویید عدد زوج است یا فرد.',
    summary: 'منطقِ خالص جدا از حلقهٔ تعامل = تست‌پذیری. seed برای تکرارپذیری. سقف تلاش از ریاضیِ بازه (log2). خروجی ساختاریافته (dict) نه رشته.',
    quiz: [
      { q: 'چرا موتور بازی تابعِ خالص باشد؟', options: ['سریع‌تر', 'قابل تست بدون تعامل', 'کوتاه‌تر', 'الزامی نیست ولی شیک‌تر'], answer: 1, why: 'ورودی/خروجی معلوم → تست خودکار.' },
      { q: 'حداقل تلاشِ منطقی برای بازهٔ ۱-۱۰۰؟', options: ['۵', '۷', '۱۰', '۱۰۰'], answer: 1, why: 'ceil(log2(100)) = 7 با جستجوی دودویی.' },
    ],
  },
  {
    id: 'l8-tasks',
    level: 8,
    title: 'پروژه ۳ — مدیر کارها با JSON',
    minutes: 22,
    learn: ['CRUD کامل روی فایل', 'مدل داده با id', 'فیلتر و گزارش', 'قابلیت اطمینان: فایل خراب', 'پایداری بین اجراها'],
    prereq: 'JSON، فایل، dataclass',
    intro: 'اولین «برنامهٔ واقعی» شما: کارها را می‌سازد، می‌بیند، کامل می‌کند و حذف — و همه‌چیز در فایل JSON می‌ماند. بعد از این پروژه، برنامه‌های TODO بقیهٔ عمرتان را در ۱۰ دقیقه می‌نویسید.',
    analogy: 'این پروژه = دفترچهٔ تلفنِ برقی: رکوردها (id، عنوان، وضعیت)، ذخیرهٔ دائمی (فایل) و گزارش‌گیری (فیلتر). کلیدِ مهندسی: id بیرونیِ بکن — نه ترتیبِ لیست — چون ترتیب با حذف‌ها می‌لنگد.',
    technical: 'مدل: {"id": int, "title": str, "done": bool, "tags": [str]}. لایهٔ storage: load_tasks() / save_tasks() با JSONDecodeError → برگشت به [] (فایل خراب برنامه را نکُشد). لایهٔ منطق: add/list/complete/delete با یافتنِ id. گزارش: کامل/کل، فیلتر tag. همه روی فایلِ واقعیِ MEMFS — بین اجراهای جلسه می‌ماند.',
    example1: {
      title: 'لایهٔ ذخیره‌سازی مقاوم',
      code: 'from pathlib import Path\nimport json\n\nDB = Path("tasks.json")\n\ndef load_tasks() -> list:\n    if not DB.exists():\n        return []\n    try:\n        return json.loads(DB.read_text(encoding="utf-8"))\n    except json.JSONDecodeError:\n        print("فایل خراب بود — از نو شروع می‌کنیم")\n        return []\n\ndef save_tasks(tasks: list) -> None:\n    DB.write_text(\n        json.dumps(tasks, ensure_ascii=False, indent=2),\n        encoding="utf-8",\n    )\n\nsave_tasks(load_tasks())   # مهاجرتِ اولیه؛ فایل خالی تمیز می‌شود',
      explain: 'دو خط مهم: چکِ exists و try/except JSONDecodeError — یعنی کاربر می‌تواند فایل را دستی خراب کند و برنامه باز هم بالا بیاید. به این می‌گویند graceful degradation.',
    },
    example2: {
      title: 'منطق CRUD و گزارش',
      code: 'def add_task(tasks: list, title: str, tags: list | None = None) -> dict:\n    task = {\n        "id": max((t["id"] for t in tasks), default=0) + 1,\n        "title": title,\n        "done": False,\n        "tags": tags or [],\n    }\n    tasks.append(task)\n    return task\n\ndef complete(tasks: list, tid: int) -> bool:\n    for t in tasks:\n        if t["id"] == tid:\n            t["done"] = True\n            return True\n    return False\n\ndef report(tasks: list, tag: str | None = None) -> str:\n    sel = [t for t in tasks if tag is None or tag in t["tags"]]\n    done = sum(1 for t in sel if t["done"])\n    return f"{done}/{len(sel)} انجام‌شده"\n\ntasks = load_tasks()\nadd_task(tasks, "تمرین پایتون", ["آکادمی"])\ncomplete(tasks, 1)\nsave_tasks(tasks)\nprint(report(tasks), report(tasks, "آکادمی"))',
      explain: 'id با max(...)+1 ساخته می‌شود — حتی بعد از حذف‌ها یکتا می‌ماند. complete بولِ موفقیت برمی‌گرداند تا caller بداند id بود یا نه.',
    },
    lineByLine: [
      'max((t["id"] for t in tasks), default=0) + 1 — genexp با default: روی لیست خالی هم امن.',
      'tags or [] — اگر None بود لیست خالی؛ از دامِ آرگومانِ پیش‌فرض امن عبور کردیم.',
      't["done"] = True — تغییر درجا؛ بعدش حتماً save_tasks.',
      '[t for t in sel if ...] — فیلتر گزارش؛ tag None یعنی همه.',
    ],
    mistakes: [
      'id = len(tasks)+1 — بعد از حذف، id تکراری می‌شود.',
      'تغییر در حافظه بدون save — «کامپیوتر خوردش!»؛ ذخیره بلافاصله بعد از هر تغییر.',
      'json.dumps بدون ensure_ascii=False — عنوان فارسی در فایل ناخوانا.',
    ],
    exercise: {
      prompt: 'پروژه: لایهٔ ذخیره + منطق را کامل کنید تا تست پاس شود: load/save، add_task با id یکتا، complete با بازگشت bool، و report به شکل «X/Y انجام‌شده».',
      starter: 'from pathlib import Path\nimport json\n\nDB = Path("my_tasks.json")\n\n# load_tasks, save_tasks, add_task, complete, report را کامل کنید\n',
      tests: `import json\nfrom pathlib import Path\n\n# ذخیره‌سازی\nsave_tasks([{"id": 1, "title": "a", "done": False, "tags": []}])\nloaded = load_tasks()\nassert loaded and loaded[0]["title"] == "a", 'save/load شکست'\n\n# add با id یکتا\nadd_task(loaded, "b")\nadd_task(loaded, "c")\nids = [t["id"] for t in loaded]\nassert len(ids) == len(set(ids)), 'id تکراری!'\nassert len(loaded) == 3\n\n# complete\nassert complete(loaded, 2) == True\nassert complete(loaded, 99) == False\n\n# report\nr = report(loaded)\nassert r.endswith("انجام‌شده") and r.startswith("1/3"), f'{r}'\n\n# پایداری فایل خراب\nPath("my_tasks.json").write_text("{خراب", encoding="utf-8")\nassert load_tasks() == [], 'فایل خراب باید [] برگرداند'\nprint('${PY_PASS}')`,
      hint: 'همهٔ پنج تابع را مثل مثال‌های بالا بنویسید؛ DB = Path("my_tasks.json") ثابت مانده.',
    },
    challenge: 'delete با id اضافه کنید + دکمهٔ undo ساده (آخرین حذف در حافظه نگه دارد).',
    summary: 'storage مقاوم (exists + try/except) زیرِ منطق تمیز (id بیرونی، بازگشت bool). گزارش = فیلتر + شمارش. ذخیره بلافاصله بعد از هر تغییر.',
    quiz: [
      { q: 'چرا id جدا از len؟', options: ['سرعت', 'حذف‌ها ترتیب/تعداد را می‌شکنند', 'JSON اجبار می‌کند', 'قرارداد REST'], answer: 1, why: 'id = max+1 همیشه یکتا می‌ماند.' },
      { q: 'فایل JSON خراب — برنامه درست چه کند؟', options: ['کرش', 'پیام + برگشت به خالی', 'بازنویسی بی‌سؤال', 'خروج'], answer: 1, why: 'graceful degradation: کاربر مطلع، برنامه پایدار.' },
      { q: 'گزارش «1/3 انجام‌شده» با کدام الگو؟', options: ['while', 'فیلتر + شمارش genexp', 'regex', 'class'], answer: 1, why: 'sum(1 for t if t["done"]) روی انتخابِ فیلترشده.' },
    ],
  },
  {
    id: 'l8-csv',
    level: 8,
    title: 'پروژه ۴ — تحلیل‌گر گزارش فروش',
    minutes: 20,
    learn: ['خواندن CSV ماژول استاندارد', 'aggregation گروهی با دیکشنری', 'سورت چندکلیدی گزارش', 'stat پایه', 'خروجی گزارش خوانا'],
    prereq: 'فایل، دیکشنری، comprehensions',
    intro: 'پروژهٔ پایانی: از یک CSV خام به گزارشِ مدیریتی — بیشترین فروش، میانگین، رتبه‌بندی. همان مهارتی که در مشاغل واقعی «data analysis» می‌گویند، و همه‌اش با stdlib.',
    analogy: 'تحلیل داده = پخت آش برای مهمانی: مواد خام (CSV) → تمیزکاری (parse) → پخت (aggregate) → سِرو (گزارش). بدون pandas هم می‌شود — با دیکشنری و comprehension؛ pandas بعداً شکرِ روی آش است.',
    technical: 'csv.reader(f) خط‌به‌خط لیست می‌دهد؛ DictReader سرستون‌ها را کلید می‌کند. aggregate: دیکشنریِ {محصول: جمع} با get. چند معیار: total، count، avg، best (max با key). گزارش نهایی: sorted(items, key=lambda kv: -kv[1]) برای رتبه‌بندی + f-string جدول‌بندی. ستون عددی ممکن است رشتهٔ با کاما باشد — اول پاک‌سازی.',
    example1: {
      title: 'خواندن و تجمیع',
      code: 'import csv\nfrom pathlib import Path\n\nPath("sales.csv").write_text(\n    "product,amount\\n"\n    "قلم,120000\\nدفتر,250000\\nقلم,180000\\nپاک‌کن,30000\\n",\n    encoding="utf-8",\n)\n\nwith open("sales.csv", encoding="utf-8") as f:\n    rows = list(csv.DictReader(f))\n\nprint(len(rows), "رکورد")\n\ntotals: dict[str, int] = {}\ncounts: dict[str, int] = {}\nfor row in rows:\n    name = row["product"]\n    totals[name] = totals.get(name, 0) + int(row["amount"])\n    counts[name] = counts.get(name, 0) + 1\n\nprint(totals, counts)',
      explain: 'DictReader هر ردیف را دیکشنری می‌کند — دسترسی با نام ستون نه ایندکس. الگوی تجمیع دوتایی (جمع + شمارش) پایدارترین الگوی آماریِ بدون کتابخانه است.',
    },
    example2: {
      title: 'گزارش رتبه‌بندی‌شده',
      code: 'def ranked_report(totals: dict[str, int], counts: dict[str, int]) -> str:\n    lines = ["گزارش فروش — رتبه بر اساس مبلغ"]\n    ranked = sorted(totals.items(), key=lambda kv: -kv[1])\n    for rank, (name, total) in enumerate(ranked, start=1):\n        avg = total / counts[name]\n        medal = {1: "🥇", 2: "🥈", 3: "🥉"}.get(rank, "  ")\n        lines.append(f"{medal} {rank}. {name}: {total:,} ({avg:,.0f} میانگین)")\n    return "\\n".join(lines)\n\nprint(ranked_report(totals, counts))',
      explain: 'sorted با key منفی = نزولی. enumerate از ۱ برای رتبه. f-string با :,.0f جدول تمیز می‌سازد — خروجی‌ای که مدیر می‌خواند، نه برنامه‌نویس.',
    },
    lineByLine: [
      'list(csv.DictReader(f)) — همهٔ ردیف‌ها به دیکشنری؛ برای فایل‌های بزرگ به‌جای list مستقیم در حلقه بخوانید.',
      'totals.get(name, 0) + int(row["amount"]) — انباشت امنِ مقدار عددی.',
      'sorted(totals.items(), key=lambda kv: -kv[1]) — نزولی با منفی‌کردن مقدار.',
      'enumerate(ranked, start=1) — رتبهٔ انسانی؛ medal برای سه نفر اول.',
    ],
    mistakes: [
      'int(row["amount"]) بدون پاک‌سازی — «1,200» می‌ترکد؛ اول replace(",", "") (در این پروژه داده تمیز است).',
      'ستون‌های اضافی/فاصله در نام ستون — row[" product"] KeyError می‌دهد؛ با strip کلیدها.',
      'round روی جمع مالی — هیچ‌وقت؛ گرد کردن فقط در نمایش.',
    ],
    exercise: {
      prompt: 'پروژهٔ نهایی: از sales.csv (خودتان می‌سازید با سه محصول) totals و counts را بسازید، تابع ranked_report خوانا (شامل نام، مبلغ با جداکننده) بنویسید و best_product را بریزید. تست: بهترین فروشندهٔ دادهٔ نمونه باید «دفتر» باشد.',
      starter: 'import csv\nfrom pathlib import Path\n\nPath("sales.csv").write_text(\n    "product,amount\\nقلم,120000\\nدفتر,250000\\nقلم,180000\\n", encoding="utf-8")\n\n# totals, counts، سپس ranked_report و best_product\n',
      tests: `assert totals['قلم'] == 300_000 and totals['دفتر'] == 250_000\nassert counts == {'قلم': 2, 'دفتر': 1}\nassert best_product == 'دفتر', f'{best_product}'\nrep = ranked_report(totals, counts)\nassert 'قلم' in rep and '300,000' in rep, f'{rep[:80]}'\nassert rep.index('قلم') < rep.index('دفتر'), 'رتبه‌بندی نزولی نیست'\nprint('${PY_PASS}')`,
      hint: 'best_product = max(totals, key=totals.get) — یک خطِ قدرتمند دیکشنری.',
    },
    challenge: 'میانگین متحرک ماهانه بسازید: ستون month اضافه کنید و گزارشِ هر ماه جدا بدهید.',
    summary: 'DictReader برای CSV ستون‌نام‌دار. تجمیع = دیکشنری + get. رتبه = sorted با key منفی. گزارش خوب: رتبه، مبلغ فرمت‌شده، میانگین. best = max(d, key=d.get).',
    quiz: [
      { q: 'DictReader چه فرقی با reader دارد؟', options: ['سریع‌تر', 'ردیف را دیکشنری با کلید سرستون می‌کند', 'فقط فایل بزرگ', 'encoding حل می‌کند'], answer: 1, why: 'دسترسی با نام ستون به‌جای ایندکس.' },
      { q: 'max(totals, key=totals.get) چه می‌دهد؟', options: ['بزرگ‌ترین کلید', 'کلیدِ دارای بیشترین مقدار', 'بیشترین مقدار', 'خطا'], answer: 1, why: 'max روی کلیدها ولی مقایسه با مقدارشان.' },
      { q: 'سورت نزولی با sorted و key؟', options: ['reverse=False', 'key=lambda kv: -kv[1]', 'desc=True', 'امکان ندارد'], answer: 1, why: 'یا reverse=True — هر دو صحیح.' },
    ],
  },
]
