"""درس‌های پایتون سان‌جاب — متن فارسی با تمرین کدنویسی و بررسی امن (خروجی/regex)."""
from __future__ import annotations

from typing import Any, Dict, List

LESSONS: List[Dict[str, Any]] = [
    {
        "id": "01",
        "title_fa": "متغیرها",
        "body_fa": [
            "متغیر یعنی نامی برای یک مقدار؛ در پایتون با = می‌سازی و نیازی به اعلام نوع نیست.",
            "نام متغیر با حرف یا _ شروع می‌شود و به بزرگی حروف حساس است: name با Name یکی نیست.",
            "برای دیدن مقدار از print استفاده کن و چند مقدار را با کاما جدا چاپ کن.",
        ],
        "example": 'name = "Sanjab"\nlevel = 2\nprint(name, level)',
        "exercise": {
            "kind": "code",
            "prompt_fa": 'دو متغیر بساز: name با مقدار "Sanjab" و age با مقدار 2؛ سپس هر دو را با یک print چاپ کن.',
            "starter": '# دو متغیر name و age بساز\n\nprint(name, age)',
            "check": {"kind": "output", "expected": "Sanjab 2"},
        },
        "solution": 'name = "Sanjab"\nage = 2\nprint(name, age)',
        "hint_fa": 'دو خط قبل از print اضافه کن: name = "Sanjab" و age = 2.',
        "xp": 20,
    },
    {
        "id": "02",
        "title_fa": "انواع داده",
        "body_fa": [
            "هر مقدار نوعی دارد: int صحیح، float اعشاری، str رشته، bool درست/غلط.",
            "تابع type(...) نوع را نشان می‌دهد؛ تبدیل با int(...) و str(...) و float(...) انجام می‌شود.",
            "«7» رشته است نه عدد؛ جمع رشته با عدد خطا می‌دهد — اول تبدیل کن.",
        ],
        "example": 'print(type(3), type(3.14), type("hi"), type(True))',
        "exercise": {
            "kind": "code",
            "prompt_fa": 'مقدار a رشته است؛ آن را به عدد تبدیل کن، با 3 جمع کن و نتیجه را چاپ کن.',
            "starter": 'a = "12"\n# a را به int تبدیل کن، با 3 جمع کن و چاپ کن\n',
            "check": [
                {"kind": "output", "expected": "15"},
                {"kind": "regex", "pattern": r"int\s*\(\s*a\s*\)"},
            ],
        },
        "solution": 'a = "12"\nprint(int(a) + 3)',
        "hint_fa": "با int(a) رشته را عدد کن و بعد + 3.",
        "xp": 20,
    },
    {
        "id": "03",
        "title_fa": "رشته‌ها",
        "body_fa": [
            "رشته با \"...\" یا '...' ساخته می‌شود و با + به هم می‌چسبد.",
            "f-string راحت‌ترین راه گذاشتن متغیر داخل متن است: f\"salam {name}\".",
            "len طول رشته را می‌دهد و برش با [شروع:پایان] کار می‌کند.",
        ],
        "example": 'name = "Sanjab"\nprint(f"salam az {name}!")\nprint("ab" * 3)',
        "exercise": {
            "kind": "code",
            "prompt_fa": "با f-string و متغیر name این جمله را چاپ کن: salam Sanjab, khosh amadi",
            "starter": 'name = "Sanjab"\n# جمله را با f-string چاپ کن\n',
            "check": [
                {"kind": "output", "expected": "salam Sanjab, khosh amadi"},
                {"kind": "regex", "pattern": r"f\""},
            ],
        },
        "solution": 'name = "Sanjab"\nprint(f"salam {name}, khosh amadi")',
        "hint_fa": 'داخل print از f"..." استفاده کن و {name} را جایگذاری کن.',
        "xp": 20,
    },
    {
        "id": "04",
        "title_fa": "شرط if",
        "body_fa": [
            "با if کد را شرطی اجرا می‌کنی؛ بدنه با تورفتگی ۴ فاصله مشخص می‌شود.",
            "elif برای شرط‌های بیشتر و else برای حالت باقی‌مانده.",
            "عملگرها: == برابر، != نابرابر، > < >= <=.",
        ],
        "example": 'score = 12\nif score >= 10:\n    print("pass")\nelse:\n    print("fail")',
        "exercise": {
            "kind": "code",
            "prompt_fa": "score برابر 12 است؛ با if و else چاپ کن pass اگر score >= 10 بود وگرنه fail.",
            "starter": "score = 12\n# با if و else تصمیم بگیر\n",
            "check": [
                {"kind": "output", "expected": "pass"},
                {"kind": "regex", "pattern": r"if\s+score\s*>=\s*10"},
            ],
        },
        "solution": 'score = 12\nif score >= 10:\n    print("pass")\nelse:\n    print("fail")',
        "hint_fa": 'if score >= 10: بنویس و زیرش با ۴ فاصله print("pass")؛ وگرنه else.',
        "xp": 20,
    },
    {
        "id": "05",
        "title_fa": "حلقه‌ها",
        "body_fa": [
            "for روی دنباله حرکت می‌کند: for x in range(1, 6) اعداد ۱ تا ۵ می‌دهد.",
            "while تا وقتی شرط درست است ادامه دارد؛ مواظب حلقهٔ بی‌پایان باش.",
            "break حلقه را می‌شکند و continue به دور بعد می‌پرد.",
        ],
        "example": "for x in range(1, 4):\n    print(x)",
        "exercise": {
            "kind": "code",
            "prompt_fa": "با for و range اعداد 1 تا 5 را هرکدام در یک خط چاپ کن.",
            "starter": "# با for و range\n",
            "check": [
                {"kind": "output", "expected": "1\n2\n3\n4\n5"},
                {"kind": "regex", "pattern": r"for\s+\w+\s+in\s+range"},
            ],
        },
        "solution": "for i in range(1, 6):\n    print(i)",
        "hint_fa": "for i in range(1, 6): و زیرش با تورفتگی print(i).",
        "xp": 20,
    },
    {
        "id": "06",
        "title_fa": "لیست‌ها",
        "body_fa": [
            "لیست با [ ] ساخته می‌شود، ترتیب دارد و اندیسش از صفر شروع می‌شود.",
            "append عضو اضافه می‌کند، pop برمی‌دارد، len طول را می‌دهد.",
            "items[0] عضو اول و items[-1] عضو آخر است.",
        ],
        "example": 'langs = ["python", "rust"]\nlangs.append("linux")\nprint(langs[0], len(langs))',
        "exercise": {
            "kind": "code",
            "prompt_fa": 'با append مقدار "cat" را به tools اضافه کن و طول لیست را چاپ کن.',
            "starter": 'tools = ["ls", "grep"]\n# "cat" را اضافه کن و طول لیست را چاپ کن\n',
            "check": [
                {"kind": "output", "expected": "3"},
                {"kind": "regex", "pattern": r"\.append\s*\("},
            ],
        },
        "solution": 'tools = ["ls", "grep"]\ntools.append("cat")\nprint(len(tools))',
        "hint_fa": 'tools.append("cat") سپس print(len(tools)).',
        "xp": 20,
    },
    {
        "id": "07",
        "title_fa": "دیکشنری",
        "body_fa": [
            'دیکشنری داده را با کلید نگه می‌دارد: user = {"name": "Sanjab"}.',
            'دسترسی با user["name"]، افزودن با user["level"] = 2 و خواندن امن با user.get("x").',
            "کلیدها یکتا هستند؛ keys و values فهرست کلیدها/مقادیر را می‌دهند.",
        ],
        "example": 'user = {"name": "Sanjab"}\nuser["level"] = 2\nprint(user["name"], user.get("xp", 0))',
        "exercise": {
            "kind": "code",
            "prompt_fa": "کلید level با مقدار 2 را به user اضافه کن و سپس نام و سطح را با یک print چاپ کن.",
            "starter": 'user = {"name": "Sanjab"}\n# level را با عدد 2 اضافه کن و نام و سطح را چاپ کن\n',
            "check": [
                {"kind": "output", "expected": "Sanjab 2"},
                {"kind": "regex", "pattern": r"\[\s*[\"']level[\"']\s*\]\s*="},
            ],
        },
        "solution": 'user = {"name": "Sanjab"}\nuser["level"] = 2\nprint(user["name"], user["level"])',
        "hint_fa": 'user["level"] = 2 سپس print(user["name"], user["level"]).',
        "xp": 20,
    },
    {
        "id": "08",
        "title_fa": "توابع",
        "body_fa": [
            "تابع بسته‌ای از کد با نام است: def greet(name): و بدنه با تورفتگی.",
            "return نتیجه را برمی‌گرداند؛ بدون return نتیجه None است.",
            "توابع تکرار را حذف می‌کنند و کد را قابل تست می‌کنند.",
        ],
        "example": "def add(a, b):\n    return a + b\n\nprint(add(2, 3))",
        "exercise": {
            "kind": "code",
            "prompt_fa": 'تابع greet بنویس که "salam " + name را برگرداند و سپس print(greet("Sanjab")) را اجرا کن.',
            "starter": '# تابع greet را تعریف کن و برای "Sanjab" صدا بزن\n',
            "check": [
                {"kind": "output", "expected": "salam Sanjab"},
                {"kind": "regex", "pattern": r"def\s+greet"},
            ],
        },
        "solution": 'def greet(name):\n    return "salam " + name\n\nprint(greet("Sanjab"))',
        "hint_fa": 'def greet(name): و داخلش return "salam " + name؛ فراخوانی: print(greet("Sanjab")).',
        "xp": 25,
    },
    {
        "id": "09",
        "title_fa": "کار با فایل",
        "body_fa": [
            'فایل را با with open("name", "w") as f: باز کن؛ with خودش می‌بندد.',
            'حالت‌ها: "r" خواندن، "w" نوشتن از نو، "a" افزودن به انتها.',
            "f.write(...) می‌نویسد و f.read() کل متن را می‌خواند.",
            "در تمرین سان‌جاب کد واقعاً اجرا نمی‌شود؛ ساختار کد بررسی می‌شود.",
        ],
        "example": 'with open("log.txt", "w") as f:\n    f.write("sanjab")',
        "exercise": {
            "kind": "code",
            "prompt_fa": 'کدی بنویس که فایل "note.txt" را با with و open در حالت "w" باز کند و در آن sanjab را بنویسد.',
            "starter": '# الگوی درست:\n# with open("note.txt", "w") as f:\n#     f.write(...)\n',
            "check": [
                {"kind": "regex", "pattern": r"with\s+open\(\s*[\"']note\.txt[\"']\s*,\s*[\"']w[\"']\s*\)"},
                {"kind": "regex", "pattern": r"\.write\s*\("},
            ],
        },
        "solution": 'with open("note.txt", "w") as f:\n    f.write("sanjab")',
        "hint_fa": 'با with open("note.txt", "w") as f: شروع کن و زیرش f.write("sanjab").',
        "xp": 25,
    },
    {
        "id": "10",
        "title_fa": "خطاها",
        "body_fa": [
            "خطا برنامه را متوقف می‌کند مگر با try/except بگیریش.",
            "خطای دقیق بگیر: except ZeroDivisionError بهتر از except کلی است.",
            "finally همیشه اجرا می‌شود — خوب برای بستن منابع.",
        ],
        "example": 'try:\n    x = 10 / 0\nexcept ZeroDivisionError:\n    print("khata")',
        "exercise": {
            "kind": "code",
            "prompt_fa": 'بلاک try در starter هست؛ خطای تقسیم بر صفر را با except ZeroDivisionError بگیر و "khata" چاپ کن.',
            "starter": "try:\n    x = 10 / 0\n    # خطا را بگیر و khata چاپ کن\n",
            "check": [
                {"kind": "output", "expected": "khata"},
                {"kind": "regex", "pattern": r"except\s+ZeroDivisionError"},
            ],
        },
        "solution": 'try:\n    x = 10 / 0\nexcept ZeroDivisionError:\n    print("khata")',
        "hint_fa": 'بعد از بلاک try بنویس: except ZeroDivisionError: و زیرش print("khata").',
        "xp": 25,
    },
    {
        "id": "11",
        "title_fa": "کلاس‌ها",
        "body_fa": [
            "کلاس قالب ساخت اشیاست؛ از روی کلاس، شیء می‌سازی.",
            "__init__ هنگام ساخت شیء اجرا می‌شود و self یعنی خودِ شیء.",
            "متدها توابع داخل کلاس‌اند و پارامتر اولشان self است.",
        ],
        "example": 'class Dog:\n    def __init__(self, name):\n        self.name = name\n\n    def bark(self):\n        print("hap hap")\n\nd = Dog("Rex")\nd.bark()',
        "exercise": {
            "kind": "code",
            "prompt_fa": 'کلاس Dog بساز با متد bark که "hap hap" چاپ کند؛ بعد یک شیء بساز و bark را صدا بزن.',
            "starter": "class Dog:\n    # متد bark را اینجا بنویس\n\n# یک شیء بساز و bark را صدا بزن\n",
            "check": [
                {"kind": "output", "expected": "hap hap"},
                {"kind": "regex", "pattern": r"class\s+Dog"},
            ],
        },
        "solution": 'class Dog:\n    def bark(self):\n        print("hap hap")\n\nd = Dog()\nd.bark()',
        "hint_fa": "داخل کلاس با تورفتگی: def bark(self): و زیرش print(\"hap hap\").",
        "xp": 25,
    },
    {
        "id": "12",
        "title_fa": "Comprehension و ماژول",
        "body_fa": [
            "list comprehension راه کوتاه ساختن لیست است: [x * x for x in range(5)].",
            "می‌توان شرط هم گذاشت: [x for x in items if x > 2].",
            "ماژول‌ها کد آماده‌اند: import math — فقط کتابخانهٔ معتبر را import کن.",
        ],
        "example": "squares = [x * x for x in range(5)]\nprint(squares)",
        "exercise": {
            "kind": "code",
            "prompt_fa": "با list comprehension مربع اعداد 0 تا 4 را بساز و لیست را چاپ کن.",
            "starter": "# squares = [؟ for x in range(5)]\n",
            "check": [
                {"kind": "output", "expected": "[0, 1, 4, 9, 16]"},
                {"kind": "regex", "pattern": r"for\s+\w+\s+in"},
            ],
        },
        "solution": "squares = [x * x for x in range(5)]\nprint(squares)",
        "hint_fa": "squares = [x * x for x in range(5)] و بعد print(squares).",
        "xp": 25,
    },
]
